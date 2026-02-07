'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface BeachRisk {
  name: string;
  zone: string;
  risk: {
    level: string;
    color: string;
    emoji: string;
    description: string;
    score: number;
  };
}

interface ForecastData {
  timestamp: string;
  moon: {
    name: string;
    emoji: string;
    illumination: number;
    tidalEffect: string;
  };
  current: {
    swell: { height: number; direction: number; period: number };
    waveHeight: number;
    tideHeight: number;
    swellDirectionLabel: string;
  };
  overallRisk: {
    level: string;
    color: string;
    emoji: string;
    description: string;
    score: number;
  };
  beaches: BeachRisk[];
  timeline48h: Array<{
    time: string;
    swell: { height: number; direction: number; period: number };
    waveHeight: number;
    tideHeight: number;
  }>;
  dailySummary: Array<{
    date: string;
    maxSwellHeight: number;
    avgPeriod: number;
    dominantDirection: number;
    directionLabel: string;
    maxTide: number;
    beaches: Array<{ name: string; risk: { level: string; emoji: string; score: number } }>;
  }>;
}

function DirectionArrow({ direction, label }: { direction: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-8 h-8 flex items-center justify-center"
        style={{ transform: `rotate(${direction}deg)` }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L8 10H16L12 2Z" fill="#60A5FA" />
          <rect x="11" y="10" width="2" height="12" fill="#60A5FA" />
        </svg>
      </div>
      <span className="text-blue-300 text-sm font-medium">{label} ({direction}°)</span>
    </div>
  );
}

function RiskGauge({ score, level, emoji }: { score: number; level: string; emoji: string }) {
  const gradientClass =
    level === 'CRÍTICO'
      ? 'risk-gradient-critico'
      : level === 'ALTO'
      ? 'risk-gradient-alto'
      : level === 'MODERADO'
      ? 'risk-gradient-moderado'
      : 'risk-gradient-bajo';

  return (
    <div className={`${gradientClass} rounded-2xl p-6 text-center`}>
      <div className="text-6xl mb-2 pulse-glow">{emoji}</div>
      <div className="text-3xl font-bold mb-1">{level}</div>
      <div className="text-lg text-gray-300 mb-3">Riesgo general Bahía de Banderas</div>
      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className="h-3 rounded-full transition-all duration-1000"
          style={{
            width: `${score}%`,
            background: `linear-gradient(90deg, #22C55E, #EAB308, #F97316, #DC2626)`,
          }}
        />
      </div>
      <div className="text-sm text-gray-400 mt-1">{score}/100</div>
    </div>
  );
}

function MiniTimeline({ data }: { data: ForecastData['timeline48h'] }) {
  if (!data || data.length === 0) return null;
  const maxSwell = Math.max(...data.map((h) => h.swell.height), 1);

  // Show every 3 hours
  const filtered = data.filter((_, i) => i % 3 === 0);

  return (
    <div className="bg-gray-800/50 rounded-xl p-4">
      <h3 className="text-lg font-semibold mb-3">📊 Próximas 48h — Swell</h3>
      <div className="flex items-end gap-1 h-24 overflow-x-auto">
        {filtered.map((h, i) => {
          const pct = (h.swell.height / maxSwell) * 100;
          const color =
            h.swell.height >= 2
              ? '#DC2626'
              : h.swell.height >= 1.5
              ? '#F97316'
              : h.swell.height >= 1
              ? '#EAB308'
              : '#22C55E';
          const hour = new Date(h.time).getHours();
          return (
            <div key={i} className="flex flex-col items-center min-w-[28px]">
              <div
                className="w-5 rounded-t-sm transition-all"
                style={{ height: `${Math.max(pct, 4)}%`, backgroundColor: color }}
                title={`${h.swell.height}m`}
              />
              <span className="text-[10px] text-gray-500 mt-1">
                {hour === 0 ? new Date(h.time).toLocaleDateString('es', { weekday: 'short' }) : `${hour}h`}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>Ahora</span>
        <span>+48h</span>
      </div>
    </div>
  );
}

function BeachList({ beaches }: { beaches: BeachRisk[] }) {
  const sorted = [...beaches].sort((a, b) => b.risk.score - a.risk.score);
  return (
    <div className="bg-gray-800/50 rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">🏖️ Playas</h3>
        <Link href="/playas" className="text-blue-400 text-sm hover:underline">
          Ver detalle →
        </Link>
      </div>
      <div className="space-y-2">
        {sorted.map((b) => (
          <div
            key={b.name}
            className="flex items-center justify-between bg-gray-900/50 rounded-lg px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{b.risk.emoji}</span>
              <div>
                <span className="font-medium">{b.name}</span>
                <span className="text-xs text-gray-500 ml-2">{b.zone}</span>
              </div>
            </div>
            <div className="text-right">
              <span
                className="text-sm font-bold"
                style={{ color: b.risk.color }}
              >
                {b.risk.level}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DailySummary({ days }: { days: ForecastData['dailySummary'] }) {
  if (!days || days.length === 0) return null;
  return (
    <div className="bg-gray-800/50 rounded-xl p-4">
      <h3 className="text-lg font-semibold mb-3">📅 Pronóstico 7 días</h3>
      <div className="space-y-2">
        {days.map((day) => {
          const worstBeach = day.beaches.reduce(
            (max, b) => (b.risk.score > max.risk.score ? b : max),
            day.beaches[0]
          );
          return (
            <div
              key={day.date}
              className="flex items-center justify-between bg-gray-900/50 rounded-lg px-3 py-2"
            >
              <div>
                <span className="font-medium">
                  {new Date(day.date + 'T12:00').toLocaleDateString('es', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-blue-300">
                  🌊 {day.maxSwellHeight}m
                </span>
                <span className="text-gray-400">{day.avgPeriod}s</span>
                <span className="text-gray-400">{day.directionLabel}</span>
                <span>{worstBeach.risk.emoji}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };
    window.addEventListener('beforeinstallprompt', handler as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  if (!showButton) return null;

  return (
    <button
      onClick={async () => {
        if (deferredPrompt) {
          (deferredPrompt as any).prompt();
          setShowButton(false);
        }
      }}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
    >
      📲 Instalar App
    </button>
  );
}

export default function HomePage() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/forecast')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🌊</div>
          <p className="text-gray-400">Cargando pronóstico...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center bg-red-900/30 rounded-xl p-6 max-w-sm">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-red-300 font-medium">Error al cargar datos</p>
          <p className="text-gray-400 text-sm mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Hero */}
      <div className="relative w-full h-56 overflow-hidden rounded-b-2xl -mt-6 -mx-4 mb-4" style={{ width: 'calc(100% + 2rem)' }}>
        <img
          src="/bg-beach.jpg"
          alt="Playa de los Muertos — Marejada"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0C1222]/40 via-transparent to-[#0C1222]" />
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-2xl font-bold drop-shadow-lg">🌊 Alerta Marejadas</h1>
          <p className="text-gray-200 text-sm drop-shadow">Bahía de Banderas</p>
        </div>
      </div>

      {/* Risk Gauge */}
      <RiskGauge
        score={data.overallRisk.score}
        level={data.overallRisk.level}
        emoji={data.overallRisk.emoji}
      />

      {/* Current Conditions */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-300">
            {data.current.swell.height.toFixed(1)}m
          </div>
          <div className="text-xs text-gray-400">Swell</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-300">
            {data.current.swell.period.toFixed(0)}s
          </div>
          <div className="text-xs text-gray-400">Período</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <DirectionArrow
            direction={data.current.swell.direction}
            label={data.current.swellDirectionLabel}
          />
          <div className="text-xs text-gray-400 mt-1">Dirección Swell</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-cyan-300">
            {(data.current.tideHeight ?? 0).toFixed(2)}m
          </div>
          <div className="text-xs text-gray-400">Marea estimada</div>
        </div>
      </div>

      {/* Moon Phase */}
      <div className="bg-gray-800/50 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{data.moon.emoji}</span>
          <div>
            <div className="font-medium">{data.moon.name}</div>
            <div className="text-xs text-gray-400">{data.moon.illumination}% iluminación</div>
          </div>
        </div>
        <div className="text-right">
          <span
            className={`text-sm font-semibold px-2 py-1 rounded ${
              data.moon.tidalEffect === 'SPRING'
                ? 'bg-red-900/50 text-red-300'
                : data.moon.tidalEffect === 'NEAP'
                ? 'bg-green-900/50 text-green-300'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            {data.moon.tidalEffect === 'SPRING'
              ? '⚡ Mareas Vivas'
              : data.moon.tidalEffect === 'NEAP'
              ? '😌 Mareas Muertas'
              : '〰️ Normal'}
          </span>
        </div>
      </div>

      {/* 48h Timeline */}
      <MiniTimeline data={data.timeline48h} />

      {/* Beach List */}
      <BeachList beaches={data.beaches} />

      {/* 7-day Summary */}
      <DailySummary days={data.dailySummary} />

      {/* Install Button */}
      <InstallButton />

      {/* Footer */}
      <footer className="text-center text-gray-600 text-xs py-4">
        <p>Hecho por duendes.app 2026 para Chelunguis</p>
        <p className="mt-1">
          Actualizado:{' '}
          {new Date(data.timestamp).toLocaleString('es-MX', {
            timeZone: 'America/Mexico_City',
          })}
        </p>
      </footer>
    </main>
  );
}
