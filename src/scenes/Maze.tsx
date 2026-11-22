import { useEffect, useMemo, useRef, useState } from 'react';
import { World, WorldDef, WorldHandle, Ent } from '../engine/World';
import { npc, textAt } from '../engine/props';
import { drawPerson, rr, FONT } from '../engine/draw';
import { MAZES, MazeDef } from '../data/mazes';
import { useGame } from '../store';
import { useNav } from '../nav';
import { TopBar, Modal } from '../ui/Hud';
import { Es, Note, Tr, Who } from '../ui/Es';
import { LOOKS } from '../ui/Person';
import { say, sfx } from '../audio';
import type { L } from '../types';

const T = 64;

export function Maze() {
  const { prog } = useGame();
  const [level, setLevel] = useState<number | null>(null);
  if (level === null) return <MazeSelect onPick={setLevel} />;
  return <MazeRun key={level} m={MAZES[level]} onExit={() => setLevel(null)} onNext={() => setLevel(level + 1 < MAZES.length ? level + 1 : null)} hasNext={level + 1 < MAZES.length} timer={prog.settings.timer} />;
}

function MazeSelect({ onPick }: { onPick: (i: number) => void }) {
  const { prog, set } = useGame();
  const { go } = useNav();
  return (
    <div className="screen maze-select">
      <TopBar title={<Es t={{ es: 'El laberinto del aeropuerto', hy: 'Օդանավակայանի լաբիրինթոսը' }} voice={false} />} />
      <div className="maze-intro">
        <Es t={{ es: 'Encuentra el camino a tu puerta de embarque. ¡Escucha las indicaciones!', hy: 'Գտիր ճանապարհը դեպի քո նստեցման դարպաս։ Լսիր ցուցումները։' }} size="lg" block />
        <div className="phrase-list">
          {[{ es: 'Gira a la izquierda.', hy: 'Թեքվիր ձախ։' }, { es: 'Gira a la derecha.', hy: 'Թեքվիր աջ։' }, { es: 'Sigue todo recto.', hy: 'Գնա ուղիղ։' }, { es: 'Sube a la segunda planta.', hy: 'Բարձրացիր երկրորդ հարկ։' }, { es: 'El ascensor está a la derecha.', hy: 'Վերելակը աջ կողմում է։' }, { es: 'Busca la puerta B12.', hy: 'Գտիր B12 դարպասը։' }].map((t) => <Es key={t.es} t={t} size="md" />)}
        </div>
        <label className="toggle"><input type="checkbox" checked={prog.settings.timer} onChange={(e) => set((p) => ({ ...p, settings: { ...p.settings, timer: e.target.checked } }))} /> ⏱️ <Es t={{ es: 'Con cronómetro (desactívalo para jugar sin límite de tiempo)', hy: 'Ժամաչափով (անջատիր՝ առանց ժամանակի սահմանափակման խաղալու համար)' }} size="sm" voice={false} /></label>
      </div>
      <div className="maze-grid">
        {MAZES.map((m, i) => {
          const open = i === 0 || prog.mazeDone.includes(MAZES[i - 1].id) || prog.mazeDone.includes(m.id);
          const best = prog.mazeBest[m.id];
          const stars = best ? (best <= m.time ? 3 : best <= m.time * 1.6 ? 2 : 1) : 0;
          return (
            <button key={m.id} className={`maze-card ${open ? '' : 'locked'}`} disabled={!open} onClick={() => { sfx.play('click'); onPick(i); }}>
              <div className="mc-num">{open ? i + 1 : '🔒'}</div>
              <Es t={m.name} size="sm" voice={false} />
              <div className="mc-stars">{[1, 2, 3].map((s) => <span key={s} className={s <= stars ? 'on' : ''}>★</span>)}</div>
              {best && <small>⏱ {best}s</small>}
            </button>
          );
        })}
      </div>
      {prog.done.laberinto && <button className="btn primary big glow" onClick={() => go('boarding')}>🛫 Embarque ▶</button>}
    </div>
  );
}

function MazeRun({ m, onExit, onNext, hasNext, timer }: { m: MazeDef; onExit: () => void; onNext: () => void; hasNext: boolean; timer: boolean }) {
  const { prog, set, complete, achieve, addCoins, learn } = useGame();
  const { go } = useNav();
  const ref = useRef<WorldHandle>(null);
  const [target, setTarget] = useState(m.gates[m.target]);
  const targetRef = useRef(target); targetRef.current = target;
  const [msg, setMsg] = useState<{ who: string; t: L } | null>(null);
  const [puzzle, setPuzzle] = useState(false);
  const [solved, setSolved] = useState(false);
  const [won, setWon] = useState<{ time: number; stars: number } | null>(null);
  const [time, setTime] = useState(0);
  const [announce, setAnnounce] = useState<L | null>(null);
  const t0 = useRef(performance.now());
  const changed = useRef(false);

  useEffect(() => { say(m.intro.es); setMsg({ who: 'Megafonía', t: m.intro }); }, []); // eslint-disable-line
  useEffect(() => {
    if (won) return;
    const iv = setInterval(() => setTime(Math.floor((performance.now() - t0.current) / 1000)), 250);
    return () => clearInterval(iv);
  }, [won]);

  const speak = (who: string, t: L) => { setMsg({ who, t }); say(t.es); learn(t); };

  const def: WorldDef = useMemo(() => {
    const g = m.grid, H = g.length, W = g[0].length;
    const ents: Ent[] = [];
    let start = { x: T * 1.5, y: T * 1.5 };
    let si = 0, ni = 0;
    const cells: { c: string; x: number; y: number }[] = [];
    g.forEach((row, y) => [...row].forEach((c, x) => cells.push({ c, x, y })));
    const solidAt = (x: number, y: number) => { const c = g[y]?.[x]; return c === '#' || c === undefined; };
    for (const { c, x, y } of cells) {
      const px = x * T, py = y * T;
      if (c === 'S') start = { x: px + T / 2, y: py + T / 2 + 10 };
      else if (/[A-F]/.test(c) && m.gates[c]) {
        const code = m.gates[c];
        ents.push({
          id: 'gate' + c, x: px + 4, y: py + 8, w: T - 8, h: T - 12, solid: true, reach: 36, actText: `Puerta ${code}|Դարպաս ${code}`,
          label: { es: `PUERTA ${code}`, hy: `ԴԱՐՊԱՍ ${code}` }, sign: { cx: px + T / 2, cy: py - 4, size: 12, bg: '#ffd23f' },
          act: () => {
            if (code === targetRef.current) win();
            else { sfx.play('bad'); speak('Gayane', { es: `Esta es la puerta ${code}. ¡Mi puerta es la ${targetRef.current}!`, hy: `Սա ${code} դարպասն է։ Իմ դարպասը ${targetRef.current}-ն է։` }); }
          },
          draw: (ctx, t) => {
            ctx.fillStyle = '#7b4fd6'; rr(ctx, px + 4, py + 4, T - 8, T - 8, 10); ctx.fill();
            ctx.fillStyle = code === targetRef.current ? `rgba(255,111,181,${0.6 + Math.sin(t * 5) * 0.3})` : '#bfe3ff';
            rr(ctx, px + 12, py + 12, T - 24, T - 24, 6); ctx.fill();
            textAt(ctx, '✈', px + T / 2, py + T / 2, 20, '#fff');
          },
        });
      } else if (c === 'N') {
        const hint = m.hints[ni % m.hints.length]; ni++;
        ents.push(npc('n' + x + '-' + y, px + T / 2, py + T / 2 + 14, { ...LOOKS.info, top: ni % 2 ? '#2bb5c9' : '#ff8c5a' }, () => speak('Empleado', hint), 'Preguntar el camino|Հարցնել ճանապարհը', 0));
      } else if (c === 's') {
        const s = m.signs[si % m.signs.length]; si++;
        ents.push({ id: 's' + x + y, x: px + 8, y: py + 8, w: T - 16, h: T - 16, solid: true, label: s, sign: { cx: px + T / 2, cy: py + T / 2 - 6, size: 13, bg: '#2bd9c4' },
          draw: (ctx) => { ctx.fillStyle = '#5a3a8a'; ctx.fillRect(px + T / 2 - 3, py + T / 2, 6, T / 2 - 6); } });
      } else if (c === 'P') {
        ents.push({ id: 'P', x: px + 10, y: py + 10, w: T - 20, h: T - 18, solid: true, reach: 36, actText: 'Resolver el enigma|Լուծել հանելուկը', act: () => setPuzzle(true),
          draw: (ctx, t) => { ctx.fillStyle = '#ff6fb5'; rr(ctx, px + 10, py + 4, T - 20, T - 10, 8); ctx.fill(); ctx.fillStyle = '#2a1650'; rr(ctx, px + 16, py + 10, T - 32, 22, 4); ctx.fill(); textAt(ctx, '?', px + T / 2, py + 22 + Math.sin(t * 4) * 2, 16, '#ffd23f'); } });
      } else if (c === 'L') {
        ents.push({ id: 'door', x: px, y: py, w: T, h: T, solid: true, reach: 30, actText: 'Está cerrada|Փակ է', act: () => speak('Cartel', { es: 'Puerta cerrada. Resuelve el enigma para abrirla.', hy: 'Դուռը փակ է։ Լուծիր հանելուկը այն բացելու համար։' }),
          draw: (ctx) => { ctx.fillStyle = '#e23b6d'; ctx.fillRect(px + 4, py, T - 8, T); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(px + T / 2, py + T / 2, 8, 0, 7); ctx.fill(); textAt(ctx, '🔒', px + T / 2, py + T / 2 + 18, 14); } });
      } else if (/[1-4]/.test(c)) {
        const other = cells.find((o) => o.c === c && (o.x !== x || o.y !== y));
        const name = m.tp[c] ?? { es: 'Ascensor', hy: 'Վերելակ' };
        ents.push({ id: 'tp' + x + y, x: px + 8, y: py + 8, w: T - 16, h: T - 16, flat: true, reach: 26, actText: name.hy,
          act: () => { if (!other) return; sfx.play('ding'); ref.current?.teleport(other.x * T + T / 2, other.y * T + T / 2 + 18, 0); setAnnounce(name); setTimeout(() => setAnnounce(null), 1600); },
          draw: (ctx, t) => { ctx.fillStyle = '#9aa4c9'; rr(ctx, px + 6, py + 6, T - 12, T - 12, 10); ctx.fill(); ctx.fillStyle = `rgba(43,217,196,${0.5 + Math.sin(t * 3) * 0.3})`; rr(ctx, px + 14, py + 14, T - 28, T - 28, 6); ctx.fill(); textAt(ctx, name.es.startsWith('Asc') ? '🛗' : '⇅', px + T / 2, py + T / 2, 20); } });
      }
    }
    const isWall = (cx: number, cy: number) => { const c = g[cy]?.[cx]; return c === undefined || c === '#' || c === 'k'; };
    return {
      w: W * T, h: H * T, bg: '#2a1650', look: prog.outfit, suitcase: null, backpack: '#7b4fd6', start, zoom: 1.05,
      ents,
      blocked: (x, y, w, h) => {
        const x0 = Math.floor(x / T), x1 = Math.floor((x + w) / T), y0 = Math.floor(y / T), y1 = Math.floor((y + h) / T);
        for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) if (isWall(cx, cy)) return true;
        return false;
      },
      onTick: (P) => {
        if (m.change && !changed.current) {
          const tc = cells.find((c) => c.c === m.target)!;
          if (Math.hypot(P.x / T - (tc.x + 0.5), P.y / T - (tc.y + 0.5)) < m.change.when) {
            changed.current = true;
            const nt = m.gates[m.change.to];
            setTarget(nt);
            sfx.play('ding');
            const a = { es: `Atención, por favor: el vuelo AV 2027 con destino Madrid ha cambiado de puerta. Ahora sale por la puerta ${nt}.`, hy: `Ուշադրություն, խնդրում ենք․ AV 2027 Մադրիդ չվերթի դարպասը փոխվել է։ Այժմ մեկնում է ${nt} դարպասից։` };
            setMsg({ who: 'Megafonía', t: a }); setTimeout(() => say(a.es), 900);
          }
        }
      },
      drawFloor: (ctx) => {
        for (const { c, x, y } of cells) {
          const px = x * T, py = y * T;
          const fl = m.floors?.find((f) => y >= f.y0 && y < f.y1);
          if (c === '#' || c === '%') {
            ctx.fillStyle = c === '%' ? '#b39af0' : '#b79cf5'; ctx.fillRect(px, py, T, T);
            if (!solidAt(x, y + 1) || c === '%') { ctx.fillStyle = '#8a6bd6'; ctx.fillRect(px, py + T - 16, T, 16); }
            ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(px, py, T, 4);
            if (c === '%') { ctx.strokeStyle = 'rgba(80,40,140,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px + 20, py + 10); ctx.lineTo(px + 30, py + 26); ctx.lineTo(px + 24, py + 40); ctx.stroke(); }
          } else {
            ctx.fillStyle = fl?.tint ?? (((x + y) % 2) ? '#f6efff' : '#ede0ff');
            if (fl && (x + y) % 2) ctx.fillStyle = shade(fl.tint);
            ctx.fillRect(px, py, T, T);
          }
        }
        if (m.floors) for (const f of m.floors) { ctx.font = `700 14px ${FONT}`; ctx.fillStyle = 'rgba(90,42,138,.5)'; ctx.textAlign = 'right'; ctx.fillText(f.name.es, f.x1 * T - 76, f.y1 * T - 20); }
      },
    };
  }, [m]); // eslint-disable-line

  const win = () => {
    const tm = Math.floor((performance.now() - t0.current) / 1000);
    const stars = !timer ? 3 : tm <= m.time ? 3 : tm <= m.time * 1.6 ? 2 : 1;
    setWon({ time: tm, stars });
    sfx.play('win');
    const first = !prog.mazeDone.includes(m.id);
    set((p) => ({ ...p, mazeDone: p.mazeDone.includes(m.id) ? p.mazeDone : [...p.mazeDone, m.id], mazeBest: { ...p.mazeBest, [m.id]: timer ? Math.min(p.mazeBest[m.id] ?? 9999, tm) : p.mazeBest[m.id] ?? tm }, score: p.score + stars * 15 }));
    addCoins(first ? 4 + stars * 2 : 1);
    if (timer && tm <= m.time * 0.7) achieve('velocista');
    if (!prog.done.laberinto) complete('laberinto', 60, 10);
    const all = MAZES.every((z) => z.id === m.id || prog.mazeDone.includes(z.id));
    if (all) achieve('laberintos');
  };

  const P = m.puzzle;
  return (
    <div className="screen world-screen">
      <TopBar title={<Es t={m.name} voice={false} />}>
        <button className="btn ghost sm" onClick={onExit}>☰</button>
      </TopBar>
      <World def={def} ref={ref} paused={puzzle || !!won}>
        <div className="objective"><span>🎯</span><Es t={{ es: `Busca la puerta ${target}.`, hy: `Գտիր ${target} դարպասը։` }} /></div>
        {timer && <div className={`timer ${time > m.time ? 'late' : ''}`}>⏱ {time}s / {m.time}s</div>}
        {announce && <div className="banner pop"><Es t={announce} size="lg" /></div>}
        {msg && <div className="speech pop"><b><Who n={msg.who} />:</b> <Es t={msg.t} size="lg" /> <button className="btn ghost sm" onClick={() => setMsg(null)}>✕</button></div>}
      </World>
      {puzzle && P && (
        <Modal onClose={() => setPuzzle(false)}>
          <h3>🧩 <Es t={{ es: 'El enigma', hy: 'Հանելուկը' }} voice={false} /></h3>
          <Es t={P.q} size="lg" block />
          <div className="choices">
            {P.opts.map((o, i) => (
              <button key={i} className="btn soft" onClick={() => {
                if (i === P.ok) {
                  sfx.play('open'); setSolved(true); setPuzzle(false);
                  const d = def.ents.find((e) => e.id === 'door'); if (d) d.hidden = true;
                  speak('Cartel', { es: '¡Correcto! La puerta está abierta.', hy: 'Ճիշտ է։ Դուռը բաց է։' });
                } else { sfx.play('bad'); speak('Cartel', { es: 'Incorrecto. Piensa otra vez.', hy: 'Սխալ է։ Մտածիր նորից։' }); }
              }}>{o.es}</button>
            ))}
          </div>
          {solved && <div>✓</div>}
        </Modal>
      )}
      {won && (
        <Modal>
          <div className="stars big">{[1, 2, 3].map((s) => <span key={s} className={s <= won.stars ? 'on' : ''}>★</span>)}</div>
          <Es t={{ es: `¡Has encontrado la puerta ${target}!`, hy: `Գտար ${target} դարպասը։` }} size="xl" block />
          <Note s={`⏱ ${won.time} segundos|⏱ ${won.time} վայրկյան`} />
          <div className="row wrap">
            <button className="btn ghost" onClick={onExit}>☰ <Tr s="Laberintos|Լաբիրինթոսներ" /></button>
            {hasNext && <button className="btn soft" onClick={onNext}><Tr s="Siguiente|Հաջորդը" /> ▶</button>}
            <button className="btn primary" onClick={() => go('boarding')}>🛫 Embarque</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function shade(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (n >> 16) - 14), g = Math.max(0, ((n >> 8) & 255) - 14), b = Math.max(0, (n & 255) - 8);
  return `rgb(${r},${g},${b})`;
}
void drawPerson;
