import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { L, Level, Look } from './types';
import { sfx } from './audio';

export type Boarding = { flight: string; gate: string; seat: string; row: number; letter: string; time: string; counter: number; kg: number; window: boolean };

export type Progress = {
  started: boolean;
  level: Level;
  done: Record<string, boolean>;
  score: number;
  coins: number;
  words: Record<string, string>;
  achievements: string[];
  outfit: Look;
  boarding: Boarding | null;
  flightDone: string[];
  mazeDone: number[];
  mazeBest: Record<number, number>;
  pilotBest: Record<number, number>;
  stars: number;
  settings: { sound: boolean; autoSpeak: boolean; timer: boolean; rate: number };
  hallPos?: { x: number; y: number } | null;
  stamps: Record<string, string>;
  kg: number;
  cafeOrders: number;
};

export const DEFAULT_OUTFIT: Look = {
  skin: '#f6d2b8', hair: '#3b2219', hairStyle: 'long', top: '#ff6fb5', bottom: '#6b5bd6', skirt: true, shoes: '#ffffff', hat: 'band', hatColor: '#ffd23f',
};

const KEY = 'gayane-aeropuerto-v1';

function fresh(): Progress {
  return {
    started: false, level: 1, done: {}, score: 0, coins: 30, words: {}, achievements: [], outfit: DEFAULT_OUTFIT,
    boarding: null, flightDone: [], mazeDone: [], mazeBest: {}, pilotBest: {}, stars: 0,
    settings: { sound: true, autoSpeak: true, timer: true, rate: 0.9 }, hallPos: null, stamps: {}, kg: 14, cafeOrders: 0,
  };
}

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const d = JSON.parse(raw);
    const f = fresh();
    return { ...f, ...d, settings: { ...f.settings, ...(d.settings || {}) }, outfit: { ...f.outfit, ...(d.outfit || {}) } };
  } catch {
    return fresh();
  }
}

export const ACHIEVEMENTS: Record<string, { icon: string; t: L }> = {
  primerPaso: { icon: '👣', t: { es: 'Primer paso', hy: 'Առաջին քայլը' } },
  maletaPerfecta: { icon: '🧳', t: { es: 'Maleta perfecta', hy: 'Կատարյալ ճամպրուկ' } },
  gato: { icon: '🐱', t: { es: 'El gato escondido', hy: 'Թաքնված կատուն' } },
  ligera: { icon: '🪶', t: { es: 'Viajera ligera', hy: 'Թեթև ճամփորդուհի' } },
  sinErrores: { icon: '💎', t: { es: 'Sin errores', hy: 'Առանց սխալների' } },
  traductora: { icon: '📖', t: { es: '30 palabras', hy: '30 արտահայտություն' } },
  poliglota: { icon: '🌍', t: { es: '100 palabras', hy: '100 արտահայտություն' } },
  velocista: { icon: '⚡', t: { es: 'Velocista del laberinto', hy: 'Լաբիրինթոսի արագավազորդ' } },
  laberintos: { icon: '🧭', t: { es: 'Reina del laberinto', hy: 'Լաբիրինթոսի թագուհի' } },
  piloto: { icon: '🛩️', t: { es: 'Piloto de las nubes', hy: 'Ամպերի օդաչու' } },
  estrellas: { icon: '⭐', t: { es: '100 estrellas', hy: '100 աստղ' } },
  cliente: { icon: '☕', t: { es: 'Clienta educada', hy: 'Քաղաքավարի հաճախորդ' } },
  exacto: { icon: '🪙', t: { es: 'Pago exacto', hy: 'Ճշգրիտ վճարում' } },
  halcon: { icon: '🦅', t: { es: 'Ojo de halcón', hy: 'Բազեի աչք' } },
  conversadora: { icon: '💬', t: { es: 'Conversadora', hy: 'Զրուցասեր' } },
  charlatana: { icon: '🗣️', t: { es: 'Experta en el avión', hy: 'Ինքնաթիռի փորձագետ' } },
  habla: { icon: '🎤', t: { es: '¡Lo dijo en voz alta!', hy: 'Բարձրաձայն ասաց' } },
  escritora: { icon: '✍️', t: { es: 'Escritora', hy: 'Գրող' } },
  viajera: { icon: '🏆', t: { es: '¡Viajera de verdad!', hy: 'Իսկական ճամփորդուհի' } },
  asiento: { icon: '💺', t: { es: 'Mi asiento', hy: 'Իմ տեղը' } },
};

export type Toast = { id: number; icon: string; text: L; sub?: string };

type Ctx = {
  prog: Progress;
  set: (f: (p: Progress) => Progress) => void;
  complete: (mission: string, score?: number, coins?: number) => void;
  addScore: (n: number) => void;
  addCoins: (n: number) => void;
  learn: (t: L) => void;
  achieve: (id: string) => void;
  toast: (icon: string, text: L, sub?: string) => void;
  toasts: Toast[];
  reset: () => void;
};

const GameCtx = createContext<Ctx>(null as unknown as Ctx);
export const useGame = () => useContext(GameCtx);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [prog, setProg] = useState<Progress>(load);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const progRef = useRef(prog);
  progRef.current = prog;

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(prog)); } catch { /* ignore */ }
  }, [prog]);
  useEffect(() => { sfx.enabled = prog.settings.sound; }, [prog.settings.sound]);

  const toast = useCallback((icon: string, text: L, sub?: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, icon, text, sub }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const achieve = useCallback((id: string) => {
    if (progRef.current.achievements.includes(id)) return;
    const a = ACHIEVEMENTS[id];
    setProg((p) => (p.achievements.includes(id) ? p : { ...p, achievements: [...p.achievements, id], coins: p.coins + 5 }));
    if (a) { toast(a.icon, a.t, '+5 🪙'); sfx.play('win'); }
  }, [toast]);

  const learn = useCallback((t: L) => {
    if (!t.es || progRef.current.words[t.es]) return;
    setProg((p) => ({ ...p, words: { ...p.words, [t.es]: t.hy } }));
    const n = Object.keys(progRef.current.words).length + 1;
    if (n >= 30) achieve('traductora');
    if (n >= 100) achieve('poliglota');
  }, [achieve]);

  const complete = useCallback((mission: string, score = 50, coins = 10) => {
    const first = !progRef.current.done[mission];
    setProg((p) => ({
      ...p,
      done: { ...p.done, [mission]: true },
      score: p.score + score,
      coins: p.coins + (first ? coins : Math.round(coins / 3)),
      stamps: p.stamps[mission] ? p.stamps : { ...p.stamps, [mission]: new Date().toLocaleDateString('es-ES') },
    }));
    toast('✅', { es: '¡Misión cumplida!', hy: 'Առաքելությունը կատարված է։' }, `+${score} ⭐ +${first ? coins : Math.round(coins / 3)} 🪙`);
    sfx.play('win');
  }, [toast]);

  const value = useMemo<Ctx>(() => ({
    prog,
    set: (f) => setProg((p) => f(p)),
    complete,
    addScore: (n) => setProg((p) => ({ ...p, score: p.score + n })),
    addCoins: (n) => setProg((p) => ({ ...p, coins: Math.max(0, p.coins + n) })),
    learn,
    achieve,
    toast,
    toasts,
    reset: () => setProg({ ...fresh(), started: true }),
  }), [prog, complete, learn, achieve, toast, toasts]);

  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}
