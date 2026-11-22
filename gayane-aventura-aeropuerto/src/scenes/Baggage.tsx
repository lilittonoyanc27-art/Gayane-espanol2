import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../store';
import { useNav } from '../nav';
import { TopBar } from '../ui/Hud';
import { Es, Note, Tr } from '../ui/Es';
import { Dialogue } from '../ui/Dialogue';
import { PERDIDO } from '../data/scenes';
import { say, sfx } from '../audio';
import type { L } from '../types';
import { pick } from '../types';

const COL = [
  { id: 'rosa', c: '#ff6fb5', es: 'rosa', hy: 'վարդագույն' }, { id: 'roja', c: '#e8344e', es: 'roja', hy: 'կարմիր' },
  { id: 'amarilla', c: '#ffd23f', es: 'amarilla', hy: 'դեղին' }, { id: 'azul', c: '#3f7bf5', es: 'azul', hy: 'կապույտ' },
  { id: 'verde', c: '#2bbf6a', es: 'verde', hy: 'կանաչ' }, { id: 'negra', c: '#2a2a35', es: 'negra', hy: 'սև' },
  { id: 'blanca', c: '#f4f4f8', es: 'blanca', hy: 'սպիտակ' }, { id: 'morada', c: '#8a4be0', es: 'morada', hy: 'մանուշակագույն' },
];
const SIZES = [{ id: 'grande', s: 1.25, es: 'grande', hy: 'մեծ' }, { id: 'mediana', s: 1, es: 'mediana', hy: 'միջին' }, { id: 'pequeña', s: 0.78, es: 'pequeña', hy: 'փոքր' }];
const PATS = [{ id: 'rayas', es: 'con rayas', hy: 'գծերով' }, { id: 'lunares', es: 'con lunares', hy: 'պուտերով' }, { id: 'estrellas', es: 'con estrellas', hy: 'աստղերով' }];
type Bag = { color: number; size: number; tag: number; ribbon: number; pat: number; x: number; id: number };

function rnd(): Omit<Bag, 'x' | 'id'> {
  return { color: Math.floor(Math.random() * 8), size: Math.floor(Math.random() * 3), tag: Math.random() < 0.5 ? Math.floor(Math.random() * 8) : -1, ribbon: Math.random() < 0.35 ? Math.floor(Math.random() * 8) : -1, pat: Math.random() < 0.4 ? Math.floor(Math.random() * 3) : -1 };
}
type Round = { bags: Bag[]; target: number; t: L };
const KEYS: (keyof Bag)[][] = [['color'], ['color', 'size'], ['color', 'size', 'tag'], ['color', 'pat'], ['size', 'tag', 'ribbon'], ['pos']] as any;

function makeRound(r: number, n: number): Round {
  const keys = KEYS[Math.min(r, KEYS.length - 1)] as string[];
  if (keys[0] === 'pos') {
    const bags: Bag[] = Array.from({ length: n }, (_, i) => ({ ...rnd(), x: 0, id: i }));
    const ref = 2 + Math.floor(Math.random() * (n - 4));
    bags.forEach((b, i) => { if (i !== ref && b.color === 5) b.color = (b.color + 1) % 8; });
    bags[ref].color = 5;
    const right = Math.random() < 0.5;
    const target = right ? ref + 1 : ref - 1;
    // belt moves left→right: larger index = more to the right
    return { bags, target, t: right ? { es: 'Busca la maleta que está a la derecha de la maleta negra.', hy: 'Գտիր այն ճամպրուկը, որը սև ճամպրուկից աջ է։' } : { es: 'Busca la maleta que está a la izquierda de la maleta negra.', hy: 'Գտիր այն ճամպրուկը, որը սև ճամպրուկից ձախ է։' } };
  }
  const tg = rnd();
  if (keys.includes('tag') && tg.tag < 0) tg.tag = Math.floor(Math.random() * 8);
  if (keys.includes('ribbon') && tg.ribbon < 0) tg.ribbon = Math.floor(Math.random() * 8);
  if (keys.includes('pat') && tg.pat < 0) tg.pat = Math.floor(Math.random() * 3);
  const matches = (b: any) => keys.every((k) => b[k] === (tg as any)[k]);
  const bags: Bag[] = [];
  const target = Math.floor(Math.random() * n);
  for (let i = 0; i < n; i++) {
    if (i === target) { bags.push({ ...tg, x: 0, id: i }); continue; }
    let b = rnd(), guard = 0;
    // make distractors similar but not matching
    if (Math.random() < 0.6) { b = { ...tg }; const k = pick(keys) as keyof typeof b; (b as any)[k] = k === 'size' ? (tg.size + 1 + Math.floor(Math.random() * 2)) % 3 : k === 'pat' ? (tg.pat + 1) % 3 : ((tg as any)[k] + 1 + Math.floor(Math.random() * 7)) % 8; }
    while (matches(b) && guard++ < 50) b = rnd();
    bags.push({ ...b, x: 0, id: i });
  }
  const adjE: string[] = [], adjH: string[] = [], withE: string[] = [], withH: string[] = [];
  if (keys.includes('color')) { adjE.push(COL[tg.color].es); adjH.push(COL[tg.color].hy); }
  if (keys.includes('size')) { adjE.push(SIZES[tg.size].es); adjH.push(SIZES[tg.size].hy); }
  if (keys.includes('tag')) { withE.push(`con una etiqueta ${COL[tg.tag].es}`); withH.push(`${COL[tg.tag].hy} պիտակով`); }
  if (keys.includes('ribbon')) { withE.push(`con una cinta ${COL[tg.ribbon].es}`); withH.push(`${COL[tg.ribbon].hy} ժապավենով`); }
  if (keys.includes('pat')) { withE.push(PATS[tg.pat].es); withH.push(PATS[tg.pat].hy); }
  const es = `Busca la maleta ${adjE.join(', ')}${withE.length ? (adjE.length ? ' y ' : ' ') + withE.join(' y ') : ''}.`;
  const hy = `Գտիր ${adjH.join(', ')}${adjH.length ? ' ' : ''}ճամպրուկը${withH.length ? '՝ ' + withH.join(' և ') : ''}։`;
  return { bags, target, t: { es, hy } };
}

function SuitcaseSvg({ b }: { b: Bag }) {
  const c = COL[b.color].c, s = SIZES[b.size].s;
  const w = 70 * s, h = 54 * s;
  const pid = `p${b.id}-${b.pat}`;
  return (
    <svg width={w + 20} height={h + 30} viewBox={`-10 -22 ${w + 20} ${h + 30}`}>
      <defs>
        {b.pat === 0 && <pattern id={pid} width="10" height="10" patternUnits="userSpaceOnUse"><rect width="5" height="10" fill="rgba(255,255,255,.45)" /></pattern>}
        {b.pat === 1 && <pattern id={pid} width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="3" fill="rgba(255,255,255,.7)" /></pattern>}
        {b.pat === 2 && <pattern id={pid} width="18" height="18" patternUnits="userSpaceOnUse"><text x="3" y="14" fontSize="12" fill="rgba(255,255,255,.8)">★</text></pattern>}
      </defs>
      <rect x={w / 2 - 12} y={-16} width={24} height={18} rx={6} fill="none" stroke="#444" strokeWidth={5} />
      <rect x={0} y={0} width={w} height={h} rx={10} fill={c} stroke="rgba(0,0,0,.25)" strokeWidth={2} />
      {b.pat >= 0 && <rect x={0} y={0} width={w} height={h} rx={10} fill={`url(#${pid})`} />}
      <rect x={w * 0.18} y={0} width={4} height={h} fill="rgba(0,0,0,.12)" /><rect x={w * 0.78} y={0} width={4} height={h} fill="rgba(0,0,0,.12)" />
      {b.ribbon >= 0 && <rect x={w / 2 - 5} y={0} width={10} height={h} fill={COL[b.ribbon].c} stroke="rgba(0,0,0,.2)" />}
      {b.tag >= 0 && <g><path d={`M${w - 6} 6 L${w + 6} 18`} stroke="#555" strokeWidth={2} /><rect x={w} y={14} width={16} height={22} rx={3} fill={COL[b.tag].c} stroke="rgba(0,0,0,.3)" /></g>}
    </svg>
  );
}

export function Baggage() {
  const { prog, complete, achieve, addScore, learn } = useGame();
  const { go } = useNav();
  const total = prog.level === 1 ? 5 : 6;
  const [r, setR] = useState(0);
  const [round, setRound] = useState<Round>(() => makeRound(0, 7));
  const [pos, setPos] = useState(0);
  const [miss, setMiss] = useState(0);
  const [roundMiss, setRoundMiss] = useState(0);
  const [flash, setFlash] = useState<{ id: number; ok: boolean } | null>(null);
  const [phase, setPhase] = useState<'play' | 'lost' | 'lostDlg' | 'done'>('play');
  const [timeLeft, setTimeLeft] = useState(25);
  const wrap = useRef<HTMLDivElement>(null);
  const speed = 60 + r * 18 + (prog.level - 1) * 10;
  const SP = 150;
  useEffect(() => { say(round.t.es); learn(round.t); }, [round]); // eslint-disable-line
  useEffect(() => {
    if (phase !== 'play') return;
    let raf = 0, last = performance.now(), acc = 0;
    const loop = (now: number) => {
      const dt = (now - last) / 1000; last = now; acc += dt;
      setPos((p) => p + speed * dt);
      if (acc > 1) { acc = 0; setTimeLeft((t) => t - 1); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, speed]);
  useEffect(() => {
    if (timeLeft <= 0 && phase === 'play') { sfx.play('bad'); setMiss((m) => m + 1); setFlash({ id: round.target, ok: true }); setTimeout(() => nextRound(), 1500); setTimeLeft(99); }
  }, [timeLeft]); // eslint-disable-line

  const nextRound = () => {
    setFlash(null); setRoundMiss(0);
    const n = r + 1;
    if (n >= total) {
      if (miss === 0) achieve('halcon');
      if (prog.level === 3) { setPhase('lost'); say('¡Oh, no! Mi maleta no sale. ¿Dónde está?'); }
      else { complete('equipaje', 60, 12); setPhase('done'); }
      return;
    }
    setR(n); setRound(makeRound(n, 7)); setTimeLeft(25);
  };
  const click = (b: Bag) => {
    if (flash || phase !== 'play') return;
    if (b.id === round.target) { sfx.play('ok'); addScore(Math.max(5, 20 - roundMiss * 5)); setFlash({ id: b.id, ok: true }); setTimeout(nextRound, 1000); }
    else { sfx.play('bad'); setMiss((m) => m + 1); setRoundMiss((m) => m + 1); setFlash({ id: b.id, ok: false }); setTimeout(() => setFlash(null), 500); }
  };
  const widthPx = wrap.current?.clientWidth ?? 900;
  const loopLen = Math.max(widthPx + 300, round.bags.length * SP);

  if (phase === 'lostDlg') return <Dialogue scene={PERDIDO} bg="bg-arrival" onExit={() => setPhase('lost')} onDone={() => { complete('equipaje', 90, 18); setPhase('done'); }} />;
  return (
    <div className="screen baggage-screen">
      <TopBar title={<Es t={{ es: 'Recogida de equipajes · Cinta 3', hy: 'Ուղեբեռի ստացում · Ժապավեն 3' }} voice={false} />} />
      {phase === 'play' && (
        <>
          <div className="bag-task pop" key={round.t.es}>
            <span className="round">{r + 1}/{total}</span>
            <Es t={round.t} size="xl" />
            <div className="tbar"><div style={{ width: `${Math.max(0, timeLeft / 25) * 100}%` }} /></div>
          </div>
          <div className="carousel" ref={wrap}>
            <div className="carousel-belt" style={{ backgroundPositionX: pos }} />
            {round.bags.map((b, i) => {
              const x = ((i * SP + pos) % loopLen) - 150;
              return (
                <div key={b.id} className={`bag ${flash?.id === b.id ? (flash.ok ? 'right' : 'wrong') : ''}`} style={{ transform: `translateX(${x}px)` }} onPointerDown={() => click(b)}>
                  <SuitcaseSvg b={b} />
                </div>
              );
            })}
          </div>
          <Note s={`Toca la maleta correcta antes de que se acabe el tiempo. Errores: ${miss}|Սեղմիր ճիշտ ճամպրուկին, մինչև ժամանակը չի ավարտվել։ Սխալներ՝ ${miss}`} className="center" />
          <div className="vocab-strip">
            {COL.map((c) => <Es key={c.id} t={{ es: c.es, hy: c.hy }} size="sm" voice={false} className="chip-es" />)}
            {SIZES.map((c) => <Es key={c.id} t={{ es: c.es, hy: c.hy }} size="sm" voice={false} className="chip-es" />)}
            <Es t={{ es: 'la etiqueta', hy: 'պիտակը' }} size="sm" voice={false} className="chip-es" /><Es t={{ es: 'la cinta', hy: 'ժապավենը' }} size="sm" voice={false} className="chip-es" />
            {PATS.map((c) => <Es key={c.id} t={{ es: c.es, hy: c.hy }} size="sm" voice={false} className="chip-es" />)}
          </div>
          {prog.level < 3 && <button className="btn ghost sm" onClick={() => setPhase('lostDlg')}>🧳❓ <Tr s="Equipaje perdido (B1)|Կորած ուղեբեռ (B1)" size="sm" /></button>}
        </>
      )}
      {phase === 'lost' && (
        <div className="center-card pop">
          <div className="big-emoji">😱🧳</div>
          <Es t={{ es: '¡Oh, no! La cinta está vacía y mi maleta no ha salido.', hy: 'Օ՜, ոչ։ Ժապավենը դատարկ է, և իմ ճամպրուկը դուրս չի եկել։' }} size="xl" block />
          <Es t={{ es: 'Ve a la oficina de EQUIPAJE PERDIDO y explica el problema.', hy: 'Գնա ԿՈՐԱԾ ՈՒՂԵԲԵՌԻ գրասենյակ և բացատրիր խնդիրը։' }} size="lg" block />
          <button className="btn primary big glow" onClick={() => setPhase('lostDlg')}>🏢 <Tr s="Equipaje perdido|Կորած ուղեբեռ" /> ▶</button>
        </div>
      )}
      {phase === 'done' && (
        <div className="center-card pop">
          <div className="big-emoji">🧳💖</div>
          <Es t={{ es: '¡Ya tienes tu maleta! Ahora, a la ciudad.', hy: 'Արդեն ունես ճամպրուկդ։ Հիմա՝ դեպի քաղաք։' }} size="xl" block />
          <div className="row wrap">
            <button className="btn ghost" onClick={() => go('baggage')}>🔁 <Tr s="Repetir|Կրկնել" /></button>
            <button className="btn soft" onClick={() => setPhase('lostDlg')}><Tr s="Equipaje perdido|Կորած ուղեբեռ" /></button>
            <button className="btn primary big glow" onClick={() => go('madrid')}>🏙️ <Tr s="A Madrid|Դեպի Մադրիդ" /> ▶</button>
          </div>
        </div>
      )}
    </div>
  );
}
void useMemo;
