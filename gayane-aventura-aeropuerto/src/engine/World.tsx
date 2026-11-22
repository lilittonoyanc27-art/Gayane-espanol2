import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { L, Look } from '../types';
import { axis, bindKeys, input } from './input';
import { Dir, drawPerson, drawSign, FONT } from './draw';
import { Joystick } from './Joystick';
import { say, sfx } from '../audio';
import { useGame } from '../store';
import { Tr } from '../ui/Es';

export interface Ent {
  id: string;
  x: number; y: number; w: number; h: number;
  solid?: boolean;
  z?: number;
  flat?: boolean;
  draw?: (ctx: CanvasRenderingContext2D, t: number, e: Ent) => void;
  update?: (dt: number, e: Ent, t: number) => void;
  label?: L;
  sign?: { bg?: string; fg?: string; size?: number; icon?: string; cx?: number; cy?: number };
  showHy?: boolean;
  act?: () => void;
  actText?: string; // "español|հայերեն"
  reach?: number;
  hidden?: boolean;
  data?: any;
}

export interface WorldDef {
  w: number; h: number;
  bg: string;
  drawFloor: (ctx: CanvasRenderingContext2D, t: number) => void;
  drawTop?: (ctx: CanvasRenderingContext2D, t: number) => void;
  blocked: (x: number, y: number, w: number, h: number) => boolean;
  ents: Ent[];
  start: { x: number; y: number; dir?: Dir };
  zoom?: number;
  look: Look;
  suitcase?: string | null;
  backpack?: string | null;
  speed?: number;
  onTick?: (p: PlayerState, dt: number) => void;
}

export type PlayerState = { x: number; y: number; dir: Dir; phase: number; moving: boolean; sit: boolean; hidden: boolean };

export type WorldHandle = {
  teleport: (x: number, y: number, dir?: Dir) => void;
  player: PlayerState;
  interact: () => void;
};

function hit(e: Ent, x: number, y: number, w: number, h: number) {
  return x < e.x + e.w && x + w > e.x && y < e.y + e.h && y + h > e.y;
}

export const World = forwardRef<WorldHandle, { def: WorldDef; paused?: boolean; children?: React.ReactNode }>(function World({ def, paused = false, children }, ref) {
  const wrap = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const player = useRef<PlayerState>({ x: def.start.x, y: def.start.y, dir: def.start.dir ?? 0, phase: 0, moving: false, sit: false, hidden: false });
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const defRef = useRef(def);
  defRef.current = def;
  const [near, setNear] = useState<Ent | null>(null);
  const nearRef = useRef<Ent | null>(null);
  const cam = useRef({ x: 0, y: 0, z: 1, vw: 800, vh: 600 });
  const { learn } = useGame();
  const learnRef = useRef(learn);
  learnRef.current = learn;

  const doInteract = () => {
    const n = nearRef.current;
    if (n && n.act && !pausedRef.current) { sfx.play('click'); n.act(); }
  };

  useImperativeHandle(ref, () => ({
    teleport: (x, y, dir) => { player.current.x = x; player.current.y = y; if (dir !== undefined) player.current.dir = dir; },
    get player() { return player.current; },
    interact: doInteract,
  }));

  useEffect(() => {
    bindKeys();
    input.actionQueued = false;
    const c = cv.current!;
    const ctx = c.getContext('2d')!;
    let raf = 0, last = performance.now(), stepT = 0;
    const resize = () => {
      const r = wrap.current!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
      c.style.width = r.width + 'px'; c.style.height = r.height + 'px';
      const z = Math.max(0.5, Math.min(1.12, Math.min(r.width / 820, r.height / 560))) * (defRef.current.zoom ?? 1);
      cam.current.z = z; cam.current.vw = r.width / z; cam.current.vh = r.height / z;
      (c as any)._dpr = dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap.current!);

    const blockedAt = (x: number, y: number) => {
      const d = defRef.current;
      const bx = x - 10, by = y - 9, bw = 20, bh = 9;
      if (bx < 0 || by < 0 || bx + bw > d.w || by + bh > d.h) return true;
      if (d.blocked(bx, by, bw, bh)) return true;
      for (const e of d.ents) if (e.solid && !e.hidden && hit(e, bx, by, bw, bh)) return true;
      return false;
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      const d = defRef.current;
      const P = player.current;
      // update
      if (!pausedRef.current && !P.sit) {
        const a = axis();
        const sp = (d.speed ?? 190) * (a.run ? 1.55 : 1);
        P.moving = Math.hypot(a.x, a.y) > 0.12;
        if (P.moving) {
          const nx = P.x + a.x * sp * dt, ny = P.y + a.y * sp * dt;
          if (!blockedAt(nx, P.y)) P.x = nx;
          if (!blockedAt(P.x, ny)) P.y = ny;
          if (Math.abs(a.x) > Math.abs(a.y)) P.dir = a.x < 0 ? 1 : 2; else P.dir = a.y < 0 ? 3 : 0;
          P.phase += dt * (a.run ? 15 : 11);
          stepT += dt;
          if (stepT > (a.run ? 0.22 : 0.32)) { stepT = 0; sfx.play('step'); }
        } else P.phase += dt * 3;
      } else { P.moving = false; P.phase += dt * 3; }
      for (const e of d.ents) e.update?.(dt, e, t);
      if (!pausedRef.current) d.onTick?.(P, dt);

      // nearest interactable
      let best: Ent | null = null, bd = 1e9;
      for (const e of d.ents) {
        if (!e.act || e.hidden) continue;
        const reach = e.reach ?? 34;
        const dx = Math.max(e.x - P.x, 0, P.x - (e.x + e.w));
        const dy = Math.max(e.y - (P.y - 8), 0, (P.y - 8) - (e.y + e.h));
        const dist = Math.hypot(dx, dy);
        if (dist < reach && dist < bd) { bd = dist; best = e; }
      }
      if (best !== nearRef.current) { nearRef.current = best; setNear(best); }
      if (input.actionQueued) { input.actionQueued = false; doInteract(); }

      // camera
      const C = cam.current;
      C.x = Math.max(0, Math.min(d.w - C.vw, P.x - C.vw / 2));
      C.y = Math.max(0, Math.min(d.h - C.vh, P.y - 40 - C.vh / 2));
      if (d.w < C.vw) C.x = (d.w - C.vw) / 2;
      if (d.h < C.vh) C.y = (d.h - C.vh) / 2;

      // draw
      const dpr = (c as any)._dpr || 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = d.bg;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.setTransform(dpr * C.z, 0, 0, dpr * C.z, -C.x * dpr * C.z, -C.y * dpr * C.z);
      d.drawFloor(ctx, t);
      for (const e of d.ents) if (e.flat && !e.hidden) e.draw?.(ctx, t, e);
      const list: { z: number; f: () => void }[] = [];
      for (const e of d.ents) {
        if (e.flat || e.hidden || !e.draw) continue;
        list.push({ z: e.z ?? e.y + e.h, f: () => e.draw!(ctx, t, e) });
      }
      if (!P.hidden) list.push({ z: P.y, f: () => drawPerson(ctx, P.x, P.y, d.look, P.phase, P.dir, { moving: P.moving, suitcase: d.suitcase ?? null, backpack: d.backpack ?? '#7b4fd6', sit: P.sit }) });
      list.sort((a, b) => a.z - b.z);
      for (const it of list) it.f();
      d.drawTop?.(ctx, t);
      // signs on top
      for (const e of d.ents) {
        if (e.hidden || !e.label || !e.sign) continue;
        drawSign(ctx, e.sign.cx ?? e.x + e.w / 2, e.sign.cy ?? e.y + e.h / 2, e.label.es, { ...e.sign, hy: e.showHy ? e.label.hy : null });
      }
      // near marker
      const n = nearRef.current;
      if (n && !pausedRef.current) {
        const bx = n.x + n.w / 2, by = n.y - 14 + Math.sin(t * 5) * 3;
        ctx.fillStyle = '#ff4fa3';
        ctx.beginPath(); ctx.moveTo(bx - 8, by - 10); ctx.lineTo(bx + 8, by - 10); ctx.lineTo(bx, by); ctx.fill();
        ctx.font = `700 12px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onClick = (ev: PointerEvent) => {
      const r = c.getBoundingClientRect();
      const C = cam.current;
      const wx = (ev.clientX - r.left) / C.z + C.x, wy = (ev.clientY - r.top) / C.z + C.y;
      const d = defRef.current;
      // signs first (approx rect around sign center)
      for (const e of d.ents) {
        if (e.hidden || !e.label) continue;
        const cx = e.sign?.cx ?? e.x + e.w / 2, cy = e.sign?.cy ?? e.y + e.h / 2;
        const half = e.sign ? Math.max(40, e.label.es.length * 5.5) : e.w / 2 + 6;
        const hh = e.sign ? 18 : e.h / 2 + 10;
        if (Math.abs(wx - cx) < half && Math.abs(wy - cy) < hh) {
          e.showHy = !e.showHy;
          if (e.showHy) { say(e.label.es); learnRef.current(e.label); }
          sfx.play('click');
          return;
        }
      }
      if (nearRef.current && !pausedRef.current) {
        const e = nearRef.current;
        if (wx > e.x - 30 && wx < e.x + e.w + 30 && wy > e.y - 80 && wy < e.y + e.h + 30) doInteract();
      }
    };
    c.addEventListener('pointerdown', onClick);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); c.removeEventListener('pointerdown', onClick); };
  }, []);

  return (
    <div className="world" ref={wrap}>
      <canvas ref={cv} />
      {children}
      {!paused && <Joystick />}
      {!paused && near && near.act && (
        <button className="act-btn" onClick={doInteract}>
          <span className="act-key">E</span> <Tr s={near.actText || 'Actuar|Գործել'} />
        </button>
      )}
    </div>
  );
});
