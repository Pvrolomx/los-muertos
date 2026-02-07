'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface BeachDetail {
  name: string;
  lat: number;
  lon: number;
  exposureNW: string;
  exposureSW: string;
  riskSeason: string;
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
  current: {
    swellDirectionLabel: string;
    swell: { height: number; direction: number; period: number };
  };
  beaches: BeachDetail[];
}

function ExposureBadge({ label, value }: { label: string; value: string }) {
  const colors: Record<string, string> = {
    'MUY ALTA': 'bg-red-900/50 text-red-300',
    ALTA: 'bg-orange-900/50 text-orange-300',
    MEDIA: 'bg-yellow-900/50 text-yellow-300',
    BAJA: 'bg-green-900/50 text-green-300',
  };

  const tooltips: Record<string, Record<string, string>> = {
    'Exp. NW': {
      'MUY ALTA': 'Playa muy expuesta al oleaje del Noroeste (Pacífico Norte/Bering). Mayor riesgo en invierno (Nov-Abr).',
      'ALTA': 'Playa expuesta al oleaje del Noroeste. Riesgo significativo en temporada invernal.',
      'MEDIA': 'Exposición moderada al oleaje del Noroeste.',
      'BAJA': 'Playa protegida del oleaje del Noroeste por la curvatura de la bahía.',
    },
    'Exp. SW': {
      'MUY ALTA': 'Playa muy expuesta al oleaje del Suroeste (tormentas tropicales/huracanes). Mayor riesgo en verano (May-Oct).',
      'ALTA': 'Playa expuesta al oleaje del Suroeste. Riesgo significativo en temporada de lluvias.',
      'MEDIA': 'Exposición moderada al oleaje del Suroeste.',
      'BAJA': 'Playa protegida del oleaje del Suroeste por Cabo Corrientes.',
    },
  };

  const [showTooltip, setShowTooltip] = useState(false);
  const tooltip = tooltips[label]?.[value] || '';

  return (
    <div className="relative">
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center gap-2 cursor-pointer"
      >
        <span className="text-xs text-gray-400">{label}:</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${colors[value] || 'bg-gray-700 text-gray-300'}`}>
          {value} {(value === 'MUY ALTA' || value === 'ALTA') ? 'ⓘ' : ''}
        </span>
      </button>
      {showTooltip && tooltip && (
        <div className="absolute z-10 bottom-full left-0 mb-2 w-64 bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs text-gray-300 shadow-lg">
          {tooltip}
          <div className="absolute top-full left-4 w-2 h-2 bg-gray-900 border-r border-b border-gray-700 transform rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}

export default function PlayasPage() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/forecast')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-5xl animate-bounce">🏖️</div>
      </div>
    );
  }

  if (!data) return null;

  const sorted = [...data.beaches].sort((a, b) => b.risk.score - a.risk.score);
  const swellDir = data.current.swellDirectionLabel;

  return (
    <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <header className="flex items-center gap-3">
        <Link href="/" className="text-blue-400 hover:text-blue-300">
          ← Inicio
        </Link>
        <h1 className="text-xl font-bold">🏖️ Detalle por Playa</h1>
      </header>

      <div className="bg-gray-800/50 rounded-xl p-3 text-center">
        <span className="text-sm text-gray-400">
          Swell dominante: <strong className="text-blue-300">{swellDir}</strong> —{' '}
          {data.current.swell.height.toFixed(1)}m @ {data.current.swell.period.toFixed(0)}s
        </span>
      </div>

      <div className="space-y-3">
        {sorted.map((beach) => (
          <div
            key={beach.name}
            className="bg-gray-800/50 rounded-xl p-4 border-l-4"
            style={{ borderColor: beach.risk.color }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{beach.risk.emoji}</span>
                <div>
                  <h3 className="font-bold text-lg">{beach.name}</h3>
                  <span className="text-xs text-gray-500">Zona {beach.zone}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg" style={{ color: beach.risk.color }}>
                  {beach.risk.level}
                </div>
                <div className="text-xs text-gray-400">{beach.risk.score}/100</div>
              </div>
            </div>

            <p className="text-sm text-gray-300 mb-3">{beach.risk.description}</p>

            <div className="flex flex-wrap gap-3">
              <ExposureBadge label="Exp. NW" value={beach.exposureNW} />
              <ExposureBadge label="Exp. SW" value={beach.exposureSW} />
            </div>

            <div className="mt-2 text-xs text-gray-500">
              Temporada riesgo: {beach.riskSeason}
            </div>
          </div>
        ))}
      </div>

      <footer className="text-center text-gray-600 text-xs py-4">
        Hecho por duendes.app 2026 para Chelunguis
      </footer>
    </main>
  );
}
