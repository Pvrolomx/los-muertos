import { Beach } from './beaches';

export type RiskLevel = 'BAJO' | 'MODERADO' | 'ALTO' | 'CRÍTICO';

export interface RiskResult {
  level: RiskLevel;
  color: string;
  emoji: string;
  description: string;
  score: number; // 0-100
}

export interface SwellData {
  height: number; // meters
  direction: number; // degrees (0=N, 90=E, 180=S, 270=W)
  period: number; // seconds
}

export interface ForecastHour {
  time: string;
  swell: SwellData;
  secondarySwell?: SwellData;
  waveHeight: number;
  tideHeight?: number; // meters above mean sea level
}

function isNWswell(direction: number): boolean {
  // NW/W swell: 270°-330°
  return direction >= 270 && direction <= 330;
}

function isSWswell(direction: number): boolean {
  // S/SW swell: 150°-240°
  return direction >= 150 && direction <= 240;
}

function getExposureMultiplier(exposure: string): number {
  switch (exposure) {
    case 'MUY ALTA': return 1.0;
    case 'ALTA': return 0.8;
    case 'MEDIA': return 0.5;
    case 'BAJA': return 0.2;
    default: return 0.3;
  }
}

function getSwellDirection(direction: number): string {
  if (direction >= 315 || direction < 45) return 'N';
  if (direction >= 45 && direction < 135) return 'E';
  if (direction >= 135 && direction < 225) return 'S';
  return 'W';
}

export function getSwellDirectionLabel(direction: number): string {
  if (direction >= 270 && direction <= 330) return 'NW';
  if (direction >= 150 && direction <= 240) return 'SW';
  if (direction >= 330 || direction <= 30) return 'N';
  if (direction >= 60 && direction <= 150) return 'SE';
  return getSwellDirection(direction);
}

export function calculateRisk(
  beach: Beach,
  swell: SwellData,
  tideHeight: number,
  tidalEffect: 'SPRING' | 'NEAP' | 'NORMAL',
  secondarySwell?: SwellData
): RiskResult {
  let score = 0;

  // Evaluate primary swell against beach exposure
  const evalSwell = (sw: SwellData) => {
    let swellScore = 0;
    let exposure = 0;

    if (isNWswell(sw.direction)) {
      exposure = getExposureMultiplier(beach.exposureNW);
    } else if (isSWswell(sw.direction)) {
      exposure = getExposureMultiplier(beach.exposureSW);
    } else {
      exposure = 0.1; // Minimal impact from other directions
    }

    // Swell height contribution (0-40 points)
    if (sw.height >= 2.0) swellScore += 40;
    else if (sw.height >= 1.5) swellScore += 30;
    else if (sw.height >= 1.0) swellScore += 20;
    else if (sw.height >= 0.5) swellScore += 10;

    // Period contribution (0-25 points) - longer period = more energy
    if (sw.period >= 16) swellScore += 25;
    else if (sw.period >= 14) swellScore += 20;
    else if (sw.period >= 12) swellScore += 12;
    else if (sw.period >= 10) swellScore += 5;

    return swellScore * exposure;
  };

  score += evalSwell(swell);
  if (secondarySwell && secondarySwell.height > 0.3) {
    score += evalSwell(secondarySwell) * 0.5; // Secondary swell has less weight
  }

  // Tide contribution (0-20 points)
  if (tideHeight >= 0.8) score += 20;
  else if (tideHeight >= 0.7) score += 15;
  else if (tideHeight >= 0.6) score += 10;
  else if (tideHeight >= 0.4) score += 5;

  // Tidal effect (spring tides amplify risk)
  if (tidalEffect === 'SPRING') score *= 1.15;
  else if (tidalEffect === 'NEAP') score *= 0.85;

  score = Math.min(100, Math.round(score));

  // Determine level
  let level: RiskLevel;
  let color: string;
  let emoji: string;
  let description: string;

  if (score >= 70) {
    level = 'CRÍTICO';
    color = '#DC2626';
    emoji = '🔴';
    description = 'Riesgo de inundación. Evitar zona costera.';
  } else if (score >= 50) {
    level = 'ALTO';
    color = '#F97316';
    emoji = '🟠';
    description = 'Oleaje fuerte. Precaución en playas expuestas.';
  } else if (score >= 30) {
    level = 'MODERADO';
    color = '#EAB308';
    emoji = '🟡';
    description = 'Oleaje moderado. Atención en pleamar.';
  } else {
    level = 'BAJO';
    color = '#22C55E';
    emoji = '🟢';
    description = 'Condiciones normales.';
  }

  return { level, color, emoji, description, score };
}
