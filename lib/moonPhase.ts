export interface MoonPhaseInfo {
  phase: number; // 0-1 (0=new, 0.5=full)
  name: string;
  emoji: string;
  illumination: number; // 0-100%
  tidalEffect: 'SPRING' | 'NEAP' | 'NORMAL';
}

export function getMoonPhase(date: Date): MoonPhaseInfo {
  // Synodic month = 29.53058770576 days
  // Known new moon: Jan 6, 2000 18:14 UTC
  const knownNew = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
  const synodicMonth = 29.53058770576;
  
  const diff = (date.getTime() - knownNew.getTime()) / (1000 * 60 * 60 * 24);
  const phase = ((diff % synodicMonth) + synodicMonth) % synodicMonth / synodicMonth;
  
  const illumination = Math.round((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100);
  
  let name: string;
  let emoji: string;
  
  if (phase < 0.0625) { name = 'Luna Nueva'; emoji = '🌑'; }
  else if (phase < 0.1875) { name = 'Creciente'; emoji = '🌒'; }
  else if (phase < 0.3125) { name = 'Cuarto Creciente'; emoji = '🌓'; }
  else if (phase < 0.4375) { name = 'Gibosa Creciente'; emoji = '🌔'; }
  else if (phase < 0.5625) { name = 'Luna Llena'; emoji = '🌕'; }
  else if (phase < 0.6875) { name = 'Gibosa Menguante'; emoji = '🌖'; }
  else if (phase < 0.8125) { name = 'Cuarto Menguante'; emoji = '🌗'; }
  else if (phase < 0.9375) { name = 'Menguante'; emoji = '🌘'; }
  else { name = 'Luna Nueva'; emoji = '🌑'; }
  
  // Spring tides near new and full moon (±2 days ≈ ±0.068 phase)
  // Neap tides near quarters
  let tidalEffect: 'SPRING' | 'NEAP' | 'NORMAL';
  if (phase < 0.07 || phase > 0.93 || (phase > 0.43 && phase < 0.57)) {
    tidalEffect = 'SPRING'; // Mareas vivas - higher highs, lower lows
  } else if ((phase > 0.18 && phase < 0.32) || (phase > 0.68 && phase < 0.82)) {
    tidalEffect = 'NEAP'; // Mareas muertas - smaller range
  } else {
    tidalEffect = 'NORMAL';
  }
  
  return { phase, name, emoji, illumination, tidalEffect };
}
