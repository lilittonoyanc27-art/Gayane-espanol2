import type { L, Level, Look } from '../types';
import { p } from '../types';

export type Vars = Record<string, string>;
export type Opt = L & { re?: L; set?: Vars; goto?: string };
export type Bad = L & { re: L };
export type Step = {
  id?: string;
  lv?: Level;
  maxLv?: Level;
  npc: L[];
  ok: Opt[];
  bad: Bad[];
  after?: L[];
  kw?: string[][];
  when?: (v: Vars) => boolean;
  who?: string; // speaker name override
  narr?: boolean;
};
export type DScene = {
  id: string;
  title: L;
  name: string;
  look: Look;
  steps: Step[];
};

type OkIn = string | [string, string] | Opt;
/** Compact step builder: strings are "español|հայերեն". ok: "line" or ["line","reaction"]. bad: ["line","reaction"]. */
export function st(npc: string | string[], ok: OkIn[], bad: [string, string][] = [], x: Partial<Step> = {}): Step {
  return {
    npc: (Array.isArray(npc) ? npc : [npc]).map(p),
    ok: ok.map((o) => (typeof o === 'string' ? p(o) : Array.isArray(o) ? { ...p(o[0]), re: p(o[1]) } : o)),
    bad: bad.map(([a, b]) => ({ ...p(a), re: p(b) })),
    ...x,
  };
}
export function op(line: string, re?: string, set?: Vars, goto?: string): Opt {
  return { ...p(line), re: re ? p(re) : undefined, set, goto };
}
/** narration / NPC-only line, continue button */
export function say(npc: string | string[], x: Partial<Step> = {}): Step {
  return st(npc, [], [], x);
}

export function fill(t: L, v: Vars): L {
  const r = (s: string, lang: 'es' | 'hy') => s.replace(/\{(\w+)\}/g, (_, k) => (lang === 'hy' ? v[k + '_hy'] ?? v[k] : v[k]) ?? '');
  return { es: r(t.es, 'es'), hy: r(t.hy, 'hy') };
}

// ---------- matching for typed / spoken answers ----------
export function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[¿?¡!.,;:«»"'()\-–—]/g, ' ').replace(/\s+/g, ' ').trim();
}
export function lev(a: string, b: string) {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
function close(a: string, b: string) {
  const d = lev(a, b);
  return d <= Math.max(2, Math.floor(b.length * 0.18)) ? d : -1;
}
export type MatchRes = { kind: 'ok'; opt: Opt } | { kind: 'bad'; bad: Bad } | { kind: 'none' };
export function matchAnswer(raw: string, step: Step): MatchRes {
  const alts = raw.split('|||').map(norm).filter(Boolean);
  for (const a of alts) {
    let best: Opt | null = null, bd = 1e9;
    for (const o of step.ok) { const d = close(a, norm(o.es)); if (d >= 0 && d < bd) { bd = d; best = o; } }
    if (best) return { kind: 'ok', opt: best };
    for (const b of step.bad) if (close(a, norm(b.es)) >= 0) return { kind: 'bad', bad: b };
    if (step.kw) {
      const words = a.split(' ');
      const has = (k: string) => words.includes(norm(k)) || (k.includes(' ') && a.includes(norm(k)));
      if (step.kw.every((g) => g.some(has))) {
        // choose ok that shares the most words
        let o = step.ok[0], sc = -1;
        for (const c of step.ok) { const cw = norm(c.es).split(' '); const s = words.filter((w) => cw.includes(w)).length; if (s > sc) { sc = s; o = c; } }
        return { kind: 'ok', opt: o };
      }
    }
  }
  return { kind: 'none' };
}
