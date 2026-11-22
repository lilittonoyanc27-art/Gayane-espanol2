import type { Boarding, Progress } from './store';
import { numEs, pick } from './types';

export function ensureBoarding(p: Progress): Boarding {
  if (p.boarding) return p.boarding;
  const row = 6 + Math.floor(Math.random() * 14);
  return { flight: 'AV 2027', gate: 'B12', seat: `${row}A`, row, letter: 'A', time: pick(['10:40', '11:15', '12:30']), counter: 3 + Math.floor(Math.random() * 5), kg: p.kg, window: true };
}
export function boardingVars(b: Boarding, kg: number) {
  const win = b.letter === 'A' || b.letter === 'F';
  return {
    counter: String(b.counter), gate: b.gate, time: b.time, kg: String(kg), seat: b.seat, row: String(b.row), rowEs: numEs(b.row),
    sideEs: win ? 'junto a la ventanilla' : 'junto al pasillo', side_hy: win ? 'պատուհանի մոտ' : 'միջանցքի մոտ', flight: b.flight,
  };
}
