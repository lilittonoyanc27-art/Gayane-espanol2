export type L = { es: string; hy: string };
export type Level = 1 | 2 | 3;
export const LEVEL_NAMES: Record<Level, { code: string; es: string; hy: string }> = {
  1: { code: 'A1', es: 'Principiante', hy: 'Սկսնակ' },
  2: { code: 'A2', es: 'Viajera', hy: 'Ճամփորդուհի' },
  3: { code: 'B1', es: 'Exploradora', hy: 'Հետազոտող' },
};

export type HairStyle = 'long' | 'pony' | 'bun' | 'short' | 'braid';
export type Look = {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  top: string;
  bottom: string;
  skirt?: boolean;
  shoes: string;
  hat?: 'cap' | 'pilot' | 'beret' | 'band' | null;
  hatColor?: string;
  scarf?: string;
  beard?: boolean;
  glasses?: boolean;
};

/** "español|հայերեն" → L */
export function p(s: string): L {
  const i = s.indexOf('|');
  if (i < 0) return { es: s, hy: s };
  return { es: s.slice(0, i).trim(), hy: s.slice(i + 1).trim() };
}

export function pick<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}
export function shuffle<T>(a: T[]): T[] {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}
export function sample<T>(a: T[], n: number): T[] {
  return shuffle(a).slice(0, n);
}

const UNITS = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
const TENS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
export function numEs(n: number): string {
  if (n < 30) return UNITS[n];
  if (n < 100) {
    const t = Math.floor(n / 10), u = n % 10;
    return TENS[t] + (u ? ' y ' + UNITS[u] : '');
  }
  if (n === 100) return 'cien';
  return String(n);
}
/** price like 8.5 → "ocho euros con cincuenta" */
export function priceEs(v: number): string {
  const e = Math.floor(v + 1e-9);
  const c = Math.round((v - e) * 100);
  const eur = e === 1 ? 'un euro' : numEs(e).replace(/uno$/, 'un') + ' euros';
  return c ? `${eur} con ${numEs(c)}` : eur;
}
export function priceHy(v: number): string {
  return `${fmtPrice(v)} եվրո`;
}
export function fmtPrice(v: number) {
  return Number.isInteger(v) ? String(v) : v.toFixed(2).replace('.', ',');
}
