import { useEffect, useRef, useState } from 'react';
import { useGame } from '../store';
import { useNav } from '../nav';
import { TopBar } from '../ui/Hud';
import { Es, Note, Tr } from '../ui/Es';
import { say, sfx } from '../audio';
import { bindKeys, input } from '../engine/input';
import { rr, FONT } from '../engine/draw';
import type { L } from '../types';
import { pick } from '../types';

const VW = 900, VH = 500;
const COLORS: { id: string; c: string; t: L }[] = [
  { id: 'rojo', c: '#ff4f6d', t: { es: 'rojo', hy: 'կարմիր' } },
  { id: 'azul', c: '#3fa9f5', t: { es: 'azul', hy: 'կապույտ' } },
  { id: 'verde', c: '#2bd98a', t: { es: 'verde', hy: 'կանաչ' } },
  { id: 'amarillo', c: '#ffd23f', t: { es: 'amarillo', hy: 'դեղին' } },
];
const LEVELS = [
  { len: 5200, speed: 230, obst: 0.5, sky: ['#7fd0ff', '#ffd6ec'], name: { es: 'Sobre Ereván y el Ararat', hy: 'Երևանի և Արարատի վրայով' } },
  { len: 7000, speed: 280, obst: 0.8, sky: ['#ff9ad5', '#ffd9a0'], name: { es: 'Sobre el mar al atardecer', hy: 'Ծովի վրայով՝ մայրամուտին' } },
  { len: 8800, speed: 330, obst: 1.1, sky: ['#3a2a7a', '#b06ad6'], name: { es: 'Llegando a Madrid de noche', hy: 'Գիշերով հասնում ենք Մադրիդ' } },
];
type Obj = { kind: 'star' | 'ring' | 'cloud' | 'bird' | 'flag' | 'gold'; x: number; y: number; c?: string; cid?: string; hit?: boolean; vy?: number };
type Cmd = { t: L; kind: 'up' | 'down' | 'mid' | 'ring' | 'gold'; color?: string; until: number; ok?: boolean };

export function Pilot() {
  const { prog, set, achieve, addCoins, complete, learn } = useGame();
  const { go } = useNav();
  const [lvl, setLvl] = useState<number | null>(null);
  const [res, setRes] = useState<{ win: boolean; score: number; stars: number } | null>(null);
  const [cmd, setCmd] = useState<Cmd | null>(null);
  const [hud, setHud] = useState({ lives: 3, score: 0, stars: 0, prog: 0, cp: 0 });
  const [fb, setFb] = useState<string | null>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const touch = useRef(0);

  useEffect(() => {
    if (lvl === null || res) return;
    bindKeys();
    const L = LEVELS[lvl];
    const c = cv.current!; const ctx = c.getContext('2d')!;
    const st = { y: VH / 2, vy: 0, dist: 0, lives: 3, score: 0, stars: 0, inv: 0, t: 0, nextCmd: 4, cp: 0, done: false };
    const objs: Obj[] = [];
    // generate
    let x = 600;
    while (x < L.len) {
      const r = Math.random();
      if (r < 0.45) { const yy = 80 + Math.random() * 340; for (let k = 0; k < 4; k++) objs.push({ kind: 'star', x: x + k * 45, y: yy + Math.sin(k) * 20 }); x += 260; }
      else if (r < 0.45 + 0.35 * L.obst) { objs.push({ kind: Math.random() < 0.5 ? 'cloud' : 'bird', x, y: 60 + Math.random() * 380, vy: (Math.random() - 0.5) * 40 }); x += 220 / L.obst; }
      else { objs.push({ kind: 'ring', x, y: 90 + Math.random() * 320, c: '#ff9ad5' }); x += 240; }
    }
    for (let k = 1; k <= 3; k++) objs.push({ kind: 'flag', x: (L.len / 4) * k, y: 0 });
    let curCmd: Cmd | null = null;
    const newCmd = () => {
      const opts: Cmd['kind'][] = ['up', 'down', 'mid', 'ring', 'ring', 'gold'];
      const kind = pick(opts);
      let t: L, color: string | undefined;
      const dur = 4.5;
      if (kind === 'up') t = pick([{ es: '¡Sube!', hy: 'Բարձրացի՛ր' }, { es: '¡Vuela más alto!', hy: 'Թռի՛ր ավելի բարձր' }]);
      else if (kind === 'down') t = pick([{ es: '¡Baja!', hy: 'Իջի՛ր' }, { es: '¡Vuela más bajo!', hy: 'Թռի՛ր ավելի ցածր' }]);
      else if (kind === 'mid') t = { es: 'Vuela por el centro.', hy: 'Թռիր կենտրոնով։' };
      else if (kind === 'gold') t = { es: 'Recoge la estrella dorada.', hy: 'Հավաքիր ոսկե աստղը։' };
      else { const col = pick(COLORS); color = col.id; t = { es: `Pasa por el anillo ${col.t.es}.`, hy: `Անցիր ${col.t.hy} օղակի միջով։` }; }
      const ahead = st.dist + 700;
      if (kind === 'ring') { const cs = [...COLORS].sort(() => Math.random() - 0.5).slice(0, 3); if (!cs.find((q) => q.id === color)) cs[0] = COLORS.find((q) => q.id === color)!; cs.forEach((q, i) => objs.push({ kind: 'ring', x: ahead, y: 100 + i * 150, c: q.c, cid: q.id })); }
      if (kind === 'gold') { objs.push({ kind: 'gold', x: ahead, y: 80 + Math.random() * 340 }); for (let i = 0; i < 2; i++) objs.push({ kind: 'star', x: ahead + (i ? 60 : -60), y: 80 + Math.random() * 340 }); }
      curCmd = { t, kind, color, until: st.t + dur + (kind === 'ring' || kind === 'gold' ? 1.6 : 0) };
      setCmd(curCmd); say(t.es); learn(t);
    };
    const resolve = (ok: boolean) => {
      if (!curCmd) return;
      curCmd = null; setCmd(null);
      if (ok) { st.score += 50; sfx.play('ok'); setFb('✓ ¡Muy bien!|✓ Շատ լավ է։'); } else { sfx.play('bad'); setFb('✗ ¡Uy!|✗ Վա՜յ։'); }
      setTimeout(() => setFb(null), 900);
    };
    let raf = 0, last = performance.now();
    const resize = () => { const r = c.parentElement!.getBoundingClientRect(); const dpr = Math.min(2, window.devicePixelRatio || 1); c.width = r.width * dpr; c.height = r.height * dpr; c.style.width = r.width + 'px'; c.style.height = r.height + 'px'; };
    resize(); window.addEventListener('resize', resize);
    const loop = (now: number) => {
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      st.t += dt;
      const k = input.keys;
      let ay = 0;
      if (k.has('w') || k.has('arrowup')) ay -= 1;
      if (k.has('s') || k.has('arrowdown')) ay += 1;
      if (touch.current) ay = touch.current;
      st.vy += ay * 1400 * dt; st.vy *= 0.9;
      st.y = Math.max(40, Math.min(VH - 40, st.y + st.vy * dt));
      st.dist += L.speed * dt;
      if (st.inv > 0) st.inv -= dt;
      // commands
      if (!curCmd && st.t > st.nextCmd && st.dist < L.len - 600) { newCmd(); st.nextCmd = st.t + 9; }
      if (curCmd) {
        const cc = curCmd as Cmd;
        if (cc.kind === 'up' && st.y < VH / 3) resolve(true);
        else if (cc.kind === 'down' && st.y > (VH * 2) / 3) resolve(true);
        else if (cc.kind === 'mid' && st.y > VH / 3 && st.y < (VH * 2) / 3 && st.t > cc.until - 3) resolve(true);
        else if (st.t > cc.until) resolve(false);
      }
      // collisions
      const px = 170;
      for (const o of objs) {
        if (o.hit) continue;
        const sx = o.x - st.dist + px;
        if (o.vy) o.y = Math.max(50, Math.min(VH - 50, o.y + o.vy * dt));
        if (o.kind === 'flag' && sx < px) { o.hit = true; st.cp++; sfx.play('ding'); setFb('🚩 Punto de control|🚩 Ստուգակետ'); setTimeout(() => setFb(null), 1200); continue; }
        const dx = sx - px, dy = o.y - st.y;
        if (Math.abs(dx) > 50) continue;
        if (o.kind === 'star' && Math.hypot(dx, dy) < 30) { o.hit = true; st.stars++; st.score += 10; sfx.play('star'); }
        else if (o.kind === 'gold' && Math.hypot(dx, dy) < 34) { o.hit = true; st.stars += 5; st.score += 30; sfx.play('star'); if (curCmd && (curCmd as Cmd).kind === 'gold') resolve(true); }
        else if (o.kind === 'ring' && Math.abs(dx) < 8 && Math.abs(dy) < 45) {
          o.hit = true;
          if (curCmd && (curCmd as Cmd).kind === 'ring') resolve(o.cid === (curCmd as Cmd).color);
          else { st.score += 20; sfx.play('coin'); }
        } else if ((o.kind === 'cloud' || o.kind === 'bird') && Math.hypot(dx, dy) < (o.kind === 'cloud' ? 42 : 26) && st.inv <= 0) {
          o.hit = true; st.lives--; st.inv = 1.5; sfx.play('hit');
          if (st.lives <= 0 && !st.done) { st.done = true; setRes({ win: false, score: st.score, stars: st.stars }); }
        }
      }
      if (st.dist >= L.len && !st.done) { st.done = true; setRes({ win: true, score: st.score, stars: st.stars }); }
      if (Math.floor(st.t * 10) % 3 === 0) setHud({ lives: st.lives, score: st.score, stars: st.stars, prog: Math.min(1, st.dist / L.len), cp: st.cp });

      // draw
      const s = Math.min(c.width / VW, c.height / VH);
      const ox = (c.width - VW * s) / 2, oy = (c.height - VH * s) / 2;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const g = ctx.createLinearGradient(0, 0, 0, c.height); g.addColorStop(0, L.sky[0]); g.addColorStop(1, L.sky[1]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height);
      ctx.setTransform(s, 0, 0, s, ox, oy);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, VW, VH); ctx.clip();
      // sun / moon
      ctx.fillStyle = lvl === 2 ? '#fff8d0' : '#ffe680'; ctx.beginPath(); ctx.arc(760, 90, lvl === 2 ? 34 : 50, 0, 7); ctx.fill();
      if (lvl === 2) for (let i = 0; i < 40; i++) { ctx.fillStyle = '#fff'; ctx.fillRect((i * 137 - st.dist * 0.02) % VW + (i * 137 - st.dist * 0.02 < 0 ? VW : 0), (i * 53) % 260, 2, 2); }
      // mountains
      const mt = (par: number, col: string, h: number, snow: boolean) => {
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, VH);
        for (let x2 = -50; x2 <= VW + 50; x2 += 10) { const wx = x2 + st.dist * par; const y = VH - h - Math.abs(Math.sin(wx / 230)) * h * 0.8 - Math.sin(wx / 97) * 14; ctx.lineTo(x2, y); }
        ctx.lineTo(VW, VH); ctx.fill();
        if (snow) { ctx.fillStyle = 'rgba(255,255,255,.85)'; const ax = 500 - ((st.dist * par) % 2400); ctx.beginPath(); ctx.moveTo(ax - 200, VH - 120); ctx.lineTo(ax, VH - 330); ctx.lineTo(ax + 220, VH - 120); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(ax - 60, VH - 270); ctx.lineTo(ax, VH - 330); ctx.lineTo(ax + 66, VH - 268); ctx.lineTo(ax + 20, VH - 280); ctx.lineTo(ax - 10, VH - 262); ctx.fill(); }
      };
      if (lvl === 0) mt(0.05, '#c7a6f0', 120, true);
      mt(0.12, lvl === 2 ? '#4a3a8a' : '#b48cf0', 80, false);
      if (lvl === 1) { ctx.fillStyle = '#4fb8e8'; ctx.fillRect(0, VH - 60, VW, 60); }
      mt(0.3, lvl === 2 ? '#2a1a5a' : '#8a6bd6', 40, false);
      if (lvl === 2 && st.dist > L.len - 900) { for (let i = 0; i < 30; i++) { ctx.fillStyle = '#ffd23f'; ctx.fillRect(400 + i * 17 - (st.dist - (L.len - 900)) * 0.5, VH - 30 - (i % 4) * 10, 4, 4); } }
      // bg clouds
      for (let i = 0; i < 8; i++) { const cx = ((i * 260 - st.dist * 0.4) % (VW + 300) + VW + 300) % (VW + 300) - 150; cloud(ctx, cx, 60 + (i * 71) % 300, 0.6 + (i % 3) * 0.2, 'rgba(255,255,255,.55)'); }
      // objects
      for (const o of objs) {
        if (o.hit && o.kind !== 'flag' && o.kind !== 'ring') continue;
        const sx = o.x - st.dist + 170;
        if (sx < -80 || sx > VW + 80) continue;
        if (o.kind === 'star' || o.kind === 'gold') starShape(ctx, sx, o.y, o.kind === 'gold' ? 20 : 13, o.kind === 'gold' ? '#ffb800' : '#ffd23f', st.t);
        else if (o.kind === 'ring') { ctx.strokeStyle = o.c!; ctx.lineWidth = 9; ctx.globalAlpha = o.hit ? 0.3 : 1; ctx.beginPath(); ctx.ellipse(sx, o.y, 14, 44, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
        else if (o.kind === 'cloud') { cloud(ctx, sx, o.y, 0.9, '#7a6a9a'); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(sx - 4, o.y + 18); ctx.lineTo(sx + 6, o.y + 18); ctx.lineTo(sx - 2, o.y + 38); ctx.fill(); }
        else if (o.kind === 'bird') { ctx.font = '34px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.save(); ctx.translate(sx, o.y); ctx.scale(-1, 1); ctx.fillText('🐦', 0, Math.sin(st.t * 8) * 3); ctx.restore(); }
        else if (o.kind === 'flag') { ctx.fillStyle = '#fff'; ctx.fillRect(sx, 0, 4, VH); ctx.fillStyle = '#ff6fb5'; ctx.fillRect(sx + 4, 20, 40, 26); ctx.font = `700 11px ${FONT}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText('CONTROL', sx + 6, 37); }
      }
      // plane
      if (!(st.inv > 0 && Math.floor(st.t * 10) % 2)) plane(ctx, 170, st.y, Math.max(-0.4, Math.min(0.4, st.vy / 700)), prog.outfit.hair, st.t);
      // zone guides when command up/down/mid
      if (curCmd) { const cc = curCmd as Cmd; ctx.fillStyle = 'rgba(255,255,255,.12)'; if (cc.kind === 'up') ctx.fillRect(0, 0, VW, VH / 3); if (cc.kind === 'down') ctx.fillRect(0, (VH * 2) / 3, VW, VH / 3); if (cc.kind === 'mid') ctx.fillRect(0, VH / 3, VW, VH / 3); }
      ctx.restore();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [lvl, res]); // eslint-disable-line

  useEffect(() => {
    if (!res || lvl === null) return;
    if (res.win) {
      sfx.play('win');
      set((p) => ({ ...p, pilotBest: { ...p.pilotBest, [lvl]: Math.max(p.pilotBest[lvl] ?? 0, res.score) }, stars: p.stars + res.stars, score: p.score + Math.round(res.score / 5) }));
      addCoins(5 + lvl * 3);
      if (lvl === 2) achieve('piloto');
      if (prog.stars + res.stars >= 100) achieve('estrellas');
      if (!prog.done.piloto) complete('piloto', 40, 10);
    }
  }, [res]); // eslint-disable-line

  if (lvl === null) {
    return (
      <div className="screen pilot-menu">
        <TopBar title={<Es t={{ es: 'Pilota tu avión', hy: 'Վարիր քո ինքնաթիռը' }} voice={false} />} />
        <div className="pilot-hero"><div className="pilot-plane">✈️</div></div>
        <Es t={{ es: 'Vuela entre las nubes, recoge estrellas y sigue las órdenes del control aéreo.', hy: 'Թռիր ամպերի միջով, հավաքիր աստղեր և կատարիր օդային վերահսկիչի հրամանները։' }} size="lg" block />
        <div className="phrase-list">
          {[{ es: '¡Sube!', hy: 'Բարձրացի՛ր' }, { es: '¡Baja!', hy: 'Իջի՛ր' }, { es: 'Vuela por el centro.', hy: 'Թռիր կենտրոնով։' }, { es: 'Pasa por el anillo rojo.', hy: 'Անցիր կարմիր օղակի միջով։' }, { es: 'Recoge la estrella dorada.', hy: 'Հավաքիր ոսկե աստղը։' }].map((t) => <Es key={t.es} t={t} />)}
        </div>
        <div className="maze-grid">
          {LEVELS.map((L, i) => {
            const open = i === 0 || prog.pilotBest[i - 1] !== undefined;
            return <button key={i} className={`maze-card ${open ? '' : 'locked'}`} disabled={!open} onClick={() => { setRes(null); setLvl(i); }}><div className="mc-num">{open ? i + 1 : '🔒'}</div><Es t={L.name} size="sm" voice={false} />{prog.pilotBest[i] !== undefined && <small>🏆 {prog.pilotBest[i]}</small>}</button>;
          })}
        </div>
        <Note s="Controles: W/S o ⬆/⬇. En el móvil, los botones ▲▼.|Կառավարում՝ W/S կամ ⬆/⬇, հեռախոսում՝ ▲▼ կոճակները։" className="center" />
      </div>
    );
  }
  return (
    <div className="screen pilot-screen">
      <TopBar title={<Es t={LEVELS[lvl].name} voice={false} />}><button className="btn ghost sm" onClick={() => setLvl(null)}>☰</button></TopBar>
      <div className="pilot-wrap">
        <canvas ref={cv} />
        <div className="pilot-hud">
          <span>{'❤️'.repeat(Math.max(0, hud.lives))}</span><span>⭐ {hud.stars}</span><span>🏆 {hud.score}</span><span>🚩 {hud.cp}/3</span>
          <div className="pbar"><div style={{ width: `${hud.prog * 100}%` }} /></div>
        </div>
        {cmd && <div className="pilot-cmd pop" key={cmd.t.es}>🎧 <Es t={cmd.t} size="xl" /></div>}
        {fb && <div className="pilot-fb pop">{fb.split('|')[0]}</div>}
        <div className="pilot-btns">
          <button onPointerDown={() => (touch.current = -1)} onPointerUp={() => (touch.current = 0)} onPointerLeave={() => (touch.current = 0)}>▲</button>
          <button onPointerDown={() => (touch.current = 1)} onPointerUp={() => (touch.current = 0)} onPointerLeave={() => (touch.current = 0)}>▼</button>
        </div>
        {res && (
          <div className="pilot-res pop">
            <Es t={res.win ? { es: '¡Aterrizaje perfecto!', hy: 'Կատարյալ վայրէջք։' } : { es: '¡Oh, no! Inténtalo otra vez.', hy: 'Օ՜, ոչ։ Փորձիր նորից։' }} size="xl" block />
            <div className="hy-note">⭐ {res.stars} · 🏆 {res.score}</div>
            <div className="row wrap">
              <button className="btn ghost" onClick={() => setRes(null)}>🔁 <Tr s="Repetir|Կրկնել" /></button>
              {res.win && lvl < 2 && <button className="btn soft" onClick={() => { setRes(null); setLvl(lvl + 1); }}><Tr s="Siguiente|Հաջորդը" /> ▶</button>}
              <button className="btn primary" onClick={() => go(prog.done.vuelo ? 'arrival' : 'flight')}>{prog.done.vuelo ? <>🛬 <Tr s="A Madrid|Դեպի Մադրիդ" /> ▶</> : <>💬 <Tr s="Al avión|Ինքնաթիռ" /> ▶</>}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, col: string) {
  ctx.fillStyle = col; ctx.beginPath();
  ctx.arc(x, y, 26 * s, 0, 7); ctx.arc(x + 28 * s, y - 10 * s, 30 * s, 0, 7); ctx.arc(x + 58 * s, y, 24 * s, 0, 7); ctx.arc(x + 30 * s, y + 10 * s, 26 * s, 0, 7); ctx.fill();
}
function starShape(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, col: string, t: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(t * 1.5); ctx.fillStyle = col; ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5, rr2 = i % 2 ? r * 0.45 : r; ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); }
  ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
}
function plane(ctx: CanvasRenderingContext2D, x: number, y: number, tilt: number, hair: string, t: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
  ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.arc(-60 - i * 18, Math.sin(t * 10 + i) * 3, 6 - i * 0.8, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#ff6fb5'; rr(ctx, -55, -16, 100, 32, 16); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-50, -10); ctx.lineTo(-70, -38); ctx.lineTo(-52, -38); ctx.lineTo(-30, -12); ctx.fill();
  ctx.fillStyle = '#a24bd6'; ctx.beginPath(); ctx.moveTo(-10, 4); ctx.lineTo(-30, 34); ctx.lineTo(8, 34); ctx.lineTo(18, 4); ctx.fill();
  ctx.fillStyle = '#bfe9ff'; rr(ctx, 4, -24, 26, 16, 8); ctx.fill();
  ctx.fillStyle = '#f6d2b8'; ctx.beginPath(); ctx.arc(16, -16, 7, 0, 7); ctx.fill();
  ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(16, -19, 7.5, Math.PI, 0); ctx.fill(); ctx.fillRect(9, -19, 4, 10);
  ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(46, 0, 7, 0, 7); ctx.fill();
  ctx.strokeStyle = '#7b4fd6'; ctx.lineWidth = 3; ctx.beginPath(); const pa = t * 30; ctx.moveTo(48, Math.sin(pa) * 16); ctx.lineTo(48, -Math.sin(pa) * 16); ctx.stroke();
  for (let i = 0; i < 3; i++) { ctx.fillStyle = '#bfe9ff'; ctx.beginPath(); ctx.arc(-30 + i * 14, -2, 4, 0, 7); ctx.fill(); }
  ctx.restore();
}
