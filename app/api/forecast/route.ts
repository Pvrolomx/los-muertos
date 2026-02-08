import { NextResponse } from 'next/server';
import { BEACHES, BAY_CENTER } from '@/lib/beaches';
import { getMoonPhase } from '@/lib/moonPhase';
import { calculateRisk, getSwellDirectionLabel } from '@/lib/riskCalculator';
import type { SwellData, ForecastHour } from '@/lib/riskCalculator';

// In-memory cache
let cachedData: { data: unknown; timestamp: number } | null = null;
const CACHE_DURATION = 1 * 60 * 60 * 1000; // 1 hour

async function fetchOpenMeteoMarine() {
  const params = new URLSearchParams({
    latitude: BAY_CENTER.lat.toString(),
    longitude: BAY_CENTER.lon.toString(),
    hourly: [
      'wave_height',
      'wave_direction',
      'wave_period',
      'swell_wave_height',
      'swell_wave_direction',
      'swell_wave_period',
    ].join(','),
    forecast_days: '7',
    timezone: 'America/Mexico_City',
  });

  const res = await fetch(
    `https://marine-api.open-meteo.com/v1/marine?${params.toString()}`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) {
    throw new Error(`Open-Meteo error: ${res.status}`);
  }

  return res.json();
}

// Simple tide approximation using astronomical calculation
// PV has mixed semidiurnal tides, ~0.5-1.0m range
function approximateTide(date: Date): number {
  const hours = date.getHours() + date.getMinutes() / 60;
  // Two tidal cycles per day (semidiurnal), shifted for PV
  // High tides approximately every 12.42 hours
  const tidalPeriod = 12.42;
  const phase = ((hours % tidalPeriod) / tidalPeriod) * 2 * Math.PI;
  
  // Base amplitude ~0.4m, mean sea level offset ~0.5m
  const moon = getMoonPhase(date);
  const amplitudeMultiplier = moon.tidalEffect === 'SPRING' ? 1.3 : 
                               moon.tidalEffect === 'NEAP' ? 0.7 : 1.0;
  
  return 0.5 + 0.4 * amplitudeMultiplier * Math.cos(phase);
}

export async function GET() {
  try {
    // Check cache
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json(cachedData.data);
    }

    const marineData = await fetchOpenMeteoMarine();
    const hourly = marineData.hourly;
    const now = new Date();
    const moon = getMoonPhase(now);

    // Process hourly data into forecast hours
    const forecastHours: ForecastHour[] = hourly.time.map((time: string, i: number) => {
      const hourDate = new Date(time);
      const swell: SwellData = {
        height: hourly.swell_wave_height?.[i] ?? hourly.wave_height?.[i] ?? 0,
        direction: hourly.swell_wave_direction?.[i] ?? hourly.wave_direction?.[i] ?? 0,
        period: hourly.swell_wave_period?.[i] ?? hourly.wave_period?.[i] ?? 0,
      };

      return {
        time,
        swell,
        waveHeight: hourly.wave_height?.[i] ?? 0,
        tideHeight: approximateTide(hourDate),
      };
    });

    // Find current hour index
    const nowStr = now.toISOString().slice(0, 13);
    let currentIdx = forecastHours.findIndex(
      (h) => h.time.slice(0, 13) === nowStr
    );
    if (currentIdx === -1) currentIdx = 0;

    const currentHour = forecastHours[currentIdx];

    // Calculate risk per beach for current conditions
    const beachRisks = BEACHES.map((beach) => {
      const risk = calculateRisk(
        beach,
        currentHour.swell,
        currentHour.tideHeight ?? 0.5,
        moon.tidalEffect,
        currentHour.secondarySwell
      );
      return {
        ...beach,
        risk,
      };
    });

    // Overall risk = highest among all beaches
    const overallRisk = beachRisks.reduce(
      (max, b) => (b.risk.score > max.risk.score ? b : max),
      beachRisks[0]
    );

    // Next 48h forecast for timeline
    const timeline48h = forecastHours.slice(currentIdx, currentIdx + 48);

    // 7-day daily summary
    const dailySummary = [];
    for (let d = 0; d < 7; d++) {
      const dayStart = d * 24;
      const dayHours = forecastHours.slice(dayStart, dayStart + 24);
      if (dayHours.length === 0) continue;

      const maxSwell = Math.max(...dayHours.map((h) => h.swell.height));
      const avgPeriod =
        dayHours.reduce((sum, h) => sum + h.swell.period, 0) / dayHours.length;
      const dominantDir =
        dayHours.reduce((sum, h) => sum + h.swell.direction, 0) /
        dayHours.length;
      const maxTide = Math.max(...dayHours.map((h) => h.tideHeight ?? 0));

      // Calculate max risk for each beach this day
      const dayBeachRisks = BEACHES.map((beach) => {
        let maxRisk = { level: 'BAJO' as string, color: '#22C55E', emoji: '🟢', description: '', score: 0 };
        for (const h of dayHours) {
          const r = calculateRisk(
            beach,
            h.swell,
            h.tideHeight ?? 0.5,
            moon.tidalEffect
          );
          if (r.score > maxRisk.score) {
            maxRisk = { level: r.level, color: r.color, emoji: r.emoji, description: r.description, score: r.score };
          }
        }
        return { name: beach.name, risk: maxRisk };
      });

      dailySummary.push({
        date: dayHours[0].time.slice(0, 10),
        maxSwellHeight: Math.round(maxSwell * 100) / 100,
        avgPeriod: Math.round(avgPeriod * 10) / 10,
        dominantDirection: Math.round(dominantDir),
        directionLabel: getSwellDirectionLabel(Math.round(dominantDir)),
        maxTide: Math.round(maxTide * 100) / 100,
        beaches: dayBeachRisks,
      });
    }

    const responseData = {
      timestamp: now.toISOString(),
      moon,
      current: {
        swell: currentHour.swell,
        waveHeight: currentHour.waveHeight,
        tideHeight: currentHour.tideHeight,
        swellDirectionLabel: getSwellDirectionLabel(currentHour.swell.direction),
      },
      overallRisk: overallRisk.risk,
      beaches: beachRisks,
      timeline48h,
      dailySummary,
    };

    // Cache
    cachedData = { data: responseData, timestamp: Date.now() };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Forecast API error:', error);
    return NextResponse.json(
      { error: 'Error al obtener pronóstico', details: String(error) },
      { status: 500 }
    );
  }
}
