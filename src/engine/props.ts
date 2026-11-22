import { drawPerson, rr, shadow, FONT } from './draw';
import type { Ent } from './World';
import type { Look } from '../types';
import { pick } from '../types';

export const PAX_LOOKS: Look[] = [
  { skin: '#f2d0b5', hair: '#a0522d', hairStyle: 'short', top: '#4caf8d', bottom: '#335', shoes: '#333' },
  { skin: '#b98260', hair: '#151010', hairStyle: 'braid', top: '#ff9f43', bottom: '#2d5d8a', shoes: '#fff' },
  { skin: '#e8b996', hair: '#e0b04a', hairStyle: 'pony', top: '#3fa9f5', bottom: '#ffffff', skirt: true, shoes: '#f5a' },
  { skin: '#8d5a3b', hair: '#111', hairStyle: 'short', top: '#e23b6d', bottom: '#222', shoes: '#111', beard: true },
  { skin: '#f6d9c4', hair: '#cfcfcf', hairStyle: 'bun', top: '#9b59b6', bottom: '#4b3f8f', skirt: true, shoes: '#333', glasses: true },
  { skin: '#d9a07c', hair: '#3a2a1a', hairStyle: 'long', top: '#2bd9c4', bottom: '#5a2a8a', shoes: '#fff' },
  { skin: '#f0c7a4', hair: '#5a3a22', hairStyle: 'short', top: '#ffd23f', bottom: '#2c3e66', shoes: '#222', hat: 'cap', hatColor: '#e23b6d' },
];
const SUITS = ['#2bd9c4', '#4fa3ff', '#ff8c5a', '#7b4fd6', '#444', '#e23b6d', null, null];

/** wandering passenger inside rectangle */
export function walker(id: string, area: { x: number; y: number; w: number; h: number }, blocked?: (x: number, y: number) => boolean): Ent {
  const look = pick(PAX_LOOKS);
  const suit = pick(SUITS);
  const st = { tx: 0, ty: 0, wait: Math.random() * 2, phase: Math.random() * 10, dir: 0 as 0 | 1 | 2 | 3, moving: false };
  const newT = () => { st.tx = area.x + Math.random() * area.w; st.ty = area.y + Math.random() * area.h; };
  const e: Ent = {
    id, x: area.x + Math.random() * area.w, y: area.y + Math.random() * area.h, w: 1, h: 1,
    update: (dt) => {
      if (st.wait > 0) { st.wait -= dt; st.moving = false; st.phase += dt * 3; return; }
      if (!st.tx) newT();
      const dx = st.tx - e.x, dy = st.ty - e.y, d = Math.hypot(dx, dy);
      if (d < 4) { st.wait = 1 + Math.random() * 3; newT(); return; }
      const sp = 70;
      const nx = e.x + (dx / d) * sp * dt, ny = e.y + (dy / d) * sp * dt;
      if (blocked && blocked(nx, ny)) { newT(); st.wait = 0.5; return; }
      e.x = nx; e.y = ny;
      st.moving = true; st.phase += dt * 10;
      st.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0;
    },
    draw: (ctx) => drawPerson(ctx, e.x, e.y, look, st.phase, st.dir, { moving: st.moving, suitcase: suit, s: 0.95 }),
  };
  return e;
}

/** static NPC */
export function npc(id: string, x: number, y: number, look: Look, act?: () => void, actText = 'Hablar|Խոսել', dir: 0 | 1 | 2 | 3 = 0, extra: Partial<Ent> = {}): Ent {
  const off = Math.random() * 100;
  let ph = off;
  return {
    id, x: x - 14, y: y - 10, w: 28, h: 12, solid: true, act, actText, z: y,
    draw: (ctx, t) => { ph = t * 3 + off; drawPerson(ctx, x, y, look, ph, dir, { wave: !!act && Math.sin(t * 0.8) > 0.92 }); },
    ...extra,
  };
}

export function bench(id: string, x: number, y: number, w = 120): Ent {
  return {
    id, x, y, w, h: 24, solid: true,
    draw: (ctx) => {
      shadow(ctx, x + w / 2, y + 24, w / 2, 6);
      ctx.fillStyle = '#7b4fd6'; rr(ctx, x, y - 14, w, 14, 5); ctx.fill();
      ctx.fillStyle = '#a77ff0'; rr(ctx, x, y, w, 12, 4); ctx.fill();
      ctx.fillStyle = '#4b2a8a'; ctx.fillRect(x + 8, y + 12, 6, 12); ctx.fillRect(x + w - 14, y + 12, 6, 12);
    },
  };
}

export function plant(id: string, x: number, y: number): Ent {
  return {
    id, x: x - 14, y: y - 8, w: 28, h: 14, solid: true,
    draw: (ctx, t) => {
      shadow(ctx, x, y + 4, 16, 5);
      ctx.fillStyle = '#ff8fb0'; rr(ctx, x - 13, y - 22, 26, 26, 6); ctx.fill();
      ctx.fillStyle = '#2bbf8a';
      for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.45 + Math.sin(t + i) * 0.04; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 14, y - 30 + Math.sin(a) * 14, 6, 14, a + Math.PI / 2, 0, 7); ctx.fill(); }
    },
  };
}

export function textAt(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size = 14, color = '#3a1d6e', weight = 700) {
  ctx.font = `${weight} ${size}px ${FONT}`; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y);
}
