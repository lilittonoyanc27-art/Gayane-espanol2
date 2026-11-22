import { useMemo, useRef, useState } from 'react';
import { World, WorldDef, WorldHandle, Ent } from '../engine/World';
import { textAt } from '../engine/props';
import { drawPerson, rr, shadow, FONT } from '../engine/draw';
import { PAX_LOOKS } from '../engine/props';
import { useGame } from '../store';
import { useNav } from '../nav';
import { TopBar, Modal } from '../ui/Hud';
import { Es, Note, Tr, Who } from '../ui/Es';
import { Dialogue } from '../ui/Dialogue';
import { BoardingPass } from '../ui/BoardingPass';
import { LOOKS } from '../ui/Person';
import { GATE_AGENT, BIENVENIDA } from '../data/scenes';
import { boardingVars, ensureBoarding } from '../boardingInfo';
import { say, sfx } from '../audio';
import type { L } from '../types';
import { p, pick, shuffle } from '../types';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const ROWS = 22;

export function Boarding() {
  const { prog, set } = useGame();
  const b = useMemo(() => prog.boarding ?? ensureBoarding(prog), []); // eslint-disable-line
  const [phase, setPhase] = useState<'gate' | 'agent' | 'plane'>('gate');
  const gate = prog.level === 3 ? (b.gate === 'B14' ? 'B15' : 'B14') : b.gate;
  if (phase === 'gate') return <GateCheck b={b} newGate={gate} onOk={() => { if (gate !== b.gate) set((p) => ({ ...p, boarding: { ...b, gate } })); setPhase('agent'); }} />;
  if (phase === 'agent') return <Dialogue scene={GATE_AGENT} bg="bg-gate" initVars={boardingVars({ ...b, gate }, prog.kg)} onDone={() => setPhase('plane')} prop={<BoardingPass b={{ ...b, gate }} />} />;
  return <Cabin b={b} />;
}

function GateCheck({ b, newGate, onOk }: { b: any; newGate: string; onOk: () => void }) {
  const { prog, addScore } = useGame();
  const { go } = useNav();
  const changed = newGate !== b.gate;
  const rows = useMemo(() => shuffle([
    { t: b.time, d: 'Madrid', f: b.flight, g: newGate, s: changed ? { es: 'Cambio de puerta', hy: 'Դարպասի փոփոխություն' } : { es: 'Embarcando', hy: 'Նստեցում' }, ok: true },
    { t: b.time, d: 'Málaga', f: 'AV 1987', g: 'B10', s: { es: 'A tiempo', hy: 'Ժամանակին' }, ok: false },
    { t: '13:20', d: 'Madrid', f: 'AV 2029', g: 'B11', s: { es: 'Retrasado', hy: 'Ուշանում է' }, ok: false },
    { t: '11:00', d: 'Milán', f: 'AV 2207', g: 'B13', s: { es: 'Cancelado', hy: 'Չեղարկված' }, ok: false },
  ]), []); // eslint-disable-line
  const [step, setStep] = useState<'board' | 'q' | 'ok'>(changed ? 'q' : 'board');
  const [err, setErr] = useState('');
  const ann: L = changed
    ? { es: `Atención, por favor: el vuelo ${b.flight} a Madrid tiene un retraso de treinta minutos y sale ahora por la puerta ${newGate}.`, hy: `Ուշադրություն․ ${b.flight} Մադրիդ չվերթը ուշանում է երեսուն րոպե և այժմ մեկնում է ${newGate} դարպասից։` }
    : { es: `Último aviso para los pasajeros del vuelo ${b.flight} con destino Madrid. Embarque por la puerta ${newGate}.`, hy: `Վերջին հայտարարություն ${b.flight} Մադրիդ չվերթի ուղևորների համար։ Նստեցումը ${newGate} դարպասից է։` };
  return (
    <div className="screen gate-screen">
      <TopBar title={<Es t={{ es: `Puerta de embarque ${newGate}`, hy: `Նստեցման դարպաս ${newGate}` }} voice={false} />} />
      <div className="gate-scene">
        <div className="gate-window"><div className="plane-big">✈️</div></div>
        <div className="announce pop" onClick={() => say(ann.es)}>📢 <Es t={ann} size="lg" /></div>
        {step === 'q' && (
          <div className="gate-q pop">
            <Note s="¿Qué ha cambiado?|Ի՞նչ է փոխվել։" />
            <div className="row wrap">
              {[{ t: `La puerta ahora es la ${newGate} y el vuelo tiene retraso.|Դարպասն այժմ ${newGate}-ն է, և չվերթը ուշանում է։`, ok: true }, { t: 'El vuelo está cancelado.|Չվերթը չեղարկված է։', ok: false }, { t: 'El vuelo es mañana.|Չվերթը վաղն է։', ok: false }].map((o) => (
                <button key={o.t} className="btn soft" onClick={() => { if (o.ok) { sfx.play('ok'); addScore(10); setStep('board'); } else { sfx.play('bad'); setErr('Escucha otra vez el anuncio 📢|Լսիր կրկին հայտարարությունը 📢'); } }}><Tr s={o.t} /></button>
              ))}
            </div>
            {err && <div className="err"><Es t={p(err)} size="sm" voice={false} /></div>}
          </div>
        )}
        {step === 'board' && (
          <div className="dboard small pop">
            <Note s="Toca la fila de tu vuelo (mira tu tarjeta de embarque).|Սեղմիր քո չվերթի տողին (նայիր նստեցման կտրոնին)։" />
            {rows.map((r) => (
              <div key={r.f} className="db-row click" onClick={() => { if (r.ok) { sfx.play('ok'); addScore(10); onOk(); } else { sfx.play('bad'); setErr(`No. Tu vuelo es el ${b.flight}.|Ոչ։ Քո չվերթը ${b.flight}-ն է։`); } }}>
                <span>{r.t}</span><span>{r.d}</span><span>{r.f}</span><span>{r.g}</span><Es t={r.s} size="sm" voice={false} />
              </div>
            ))}
            {err && <div className="err"><Es t={p(err)} size="sm" voice={false} /></div>}
          </div>
        )}
        <div className="gate-pass"><BoardingPass b={{ ...b, gate: newGate }} /></div>
      </div>
      {!prog.done.cafe && <button className="btn ghost sm floating" onClick={() => go('cafe', { shop: 'cafe' })}>☕ <Tr s="Cafetería|Սրճարան" size="sm" /></button>}
    </div>
  );
}

function Cabin({ b }: { b: any }) {
  const { prog, complete, achieve, learn } = useGame();
  const { go } = useNav();
  const ref = useRef<WorldHandle>(null);
  const [dlg, setDlg] = useState(false);
  const [greeted, setGreeted] = useState(false);
  const greetedRef = useRef(false); greetedRef.current = greeted;
  const [rowPick, setRowPick] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ who: string; t: L } | null>(null);
  const [seated, setSeated] = useState(false);
  const speak = (who: string, t: L) => { setMsg({ who, t }); say(t.es); learn(t); };
  const SX = 900, SW = 74; // cabin start x, row width
  const AY = 400; // aisle center
  const occupied = useMemo(() => {
    const o = new Set<string>();
    for (let r = 1; r <= ROWS; r++) for (const L of LETTERS) if (Math.random() < 0.42 && !(r === b.row)) o.add(r + L);
    // neighbour in my row
    o.add(b.row + (b.letter === 'A' || b.letter === 'B' || b.letter === 'C' ? 'B' : 'E'));
    o.delete(b.seat);
    return o;
  }, [b]);
  const looks = useMemo(() => { const m: Record<string, any> = {}; occupied.forEach((s) => (m[s] = pick(PAX_LOOKS))); return m; }, [occupied]);

  const def: WorldDef = useMemo(() => {
    const W = SX + ROWS * SW + 200, H = 800;
    const ents: Ent[] = [];
    // azafata at the door
    let ph = 0;
    ents.push({
      id: 'azafata', x: 770, y: 352, w: 30, h: 14, solid: true, reach: 60, actText: 'Saludar a la azafata|Բարևել ուղեկցորդուհուն',
      act: () => setDlg(true),
      draw: (ctx, t) => { ph = t * 3; drawPerson(ctx, 785, 364, LOOKS.azafata, ph, 0, { wave: !greetedRef.current && Math.sin(t * 2) > 0 }); },
    });
    // gate blocker before greeting
    ents.push({ id: 'block', x: 840, y: 340, w: 20, h: 120, solid: true, draw: () => {} });
    // seats
    for (let r = 1; r <= ROWS; r++) {
      const x = SX + (r - 1) * SW;
      ents.push({ id: 'rowlabel' + r, x, y: 120, w: SW, h: 20, label: { es: `Fila ${r}`, hy: `${r}-րդ շարք` }, sign: { cx: x + SW / 2, cy: 112, size: 12, bg: r === 12 ? '#ffd23f' : '#ffffff' }, z: -1 });
      LETTERS.forEach((L, li) => {
        const top = li < 3;
        const sy = top ? 170 + li * 62 : 470 + (li - 3) * 62;
        const seat = r + L;
        ents.push({
          id: 'seat' + seat, x: x + 8, y: sy, w: SW - 16, h: 50, solid: true, z: sy + 50,
          draw: (ctx, t) => {
            shadow(ctx, x + SW / 2, sy + 52, 26, 5);
            ctx.fillStyle = seat === b.seat && greetedRef.current ? (Math.sin(t * 5) > 0 ? '#ff6fb5' : '#ff9ad5') : '#7b4fd6';
            rr(ctx, x + 8, sy, SW - 16, 50, 10); ctx.fill();
            ctx.fillStyle = '#a77ff0'; rr(ctx, x + 8, sy, 14, 50, 6); ctx.fill();
            textAt(ctx, L, x + SW / 2 + 6, sy + 25, 13, '#fff');
            if (occupied.has(seat)) drawPerson(ctx, x + SW / 2 + 6, sy + 50, looks[seat], t * 3 + r * 7 + li, 0, { sit: true, s: 0.72 });
          },
        });
      });
      // row interaction strip in aisle
      ents.push({ id: 'row' + r, x: x + 10, y: AY - 40, w: SW - 20, h: 80, flat: true, reach: 6, actText: `Fila ${r}|${r}-րդ շարք`, act: () => setRowPick(r) });
    }
    const lab = (id: string, es: string, hy: string, cx: number, cy: number, bg = '#ffffff', size = 11) => ents.push({ id, x: cx - 40, y: cy - 10, w: 80, h: 20, label: { es, hy }, sign: { cx, cy, size, bg }, z: -1 });
    lab('l-pas', 'PASARELA →', 'ՕԴԱՆԱՎԱԿԱՅԱՆԻ ԿԱՄՈՒՐՋ', 360, 362, '#e9dcff', 13);
    lab('l-v1', 'VENTANILLA', 'ՊԱՏՈՒՀԱՆ', SX - 46, 190); lab('l-v2', 'VENTANILLA', 'ՊԱՏՈՒՀԱՆ', SX - 46, 620);
    lab('l-p1', 'PASILLO', 'ՄԻՋԱՆՑՔ', SX - 46, 300, '#ffd6ec'); lab('l-p2', 'PASILLO', 'ՄԻՋԱՆՑՔ', SX - 46, 480, '#ffd6ec');
    return {
      w: W, h: H, bg: '#cfe9ff', look: prog.outfit, suitcase: null, backpack: '#7b4fd6', start: { x: 120, y: 410, dir: 2 }, zoom: 1,
      ents,
      blocked: (x, y, w, h) => {
        // jet bridge corridor (0..700, 340..470), plane door area (700..900, 260..470), cabin aisle (900.., 340..470)
        const inR = (a: number, b2: number, c: number, d: number) => x >= a && x + w <= c && y >= b2 && y + h <= d;
        return !(inR(0, 350, 720, 470) || inR(700, 280, 900, 470) || inR(880, 345, W - 60, 465));
      },
      drawFloor: (ctx, t) => {
        // sky + tarmac
        const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#9bdcff'); g.addColorStop(1, '#ffd6ec'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#b8b4c9'; ctx.fillRect(0, 620, 760, 180);
        // jet bridge
        ctx.fillStyle = '#e9dcff'; ctx.fillRect(0, 330, 720, 150);
        ctx.fillStyle = '#c9b3ff'; for (let i = 0; i < 14; i++) ctx.fillRect(i * 52, 330, 4, 150);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 330, 720, 14); ctx.fillRect(0, 466, 720, 14);
        // plane fuselage
        ctx.fillStyle = '#ffffff'; rr(ctx, 690, 80, W - 640, 640, 200); ctx.fill();
        ctx.fillStyle = '#a24bd6'; ctx.fillRect(700, 690, W - 700, 16);
        ctx.fillStyle = '#ff6fb5'; ctx.fillRect(700, 92, W - 700, 10);
        // windows
        for (let r = 0; r < ROWS; r++) { ctx.fillStyle = '#9bdcff'; rr(ctx, SX + r * SW + 26, 138, 26, 18, 8); ctx.fill(); rr(ctx, SX + r * SW + 26, 654, 26, 18, 8); ctx.fill(); }
        // floor/aisle
        ctx.fillStyle = '#f4ecff'; ctx.fillRect(700, 260, 200, 220);
        ctx.fillStyle = '#ff9ad5'; ctx.fillRect(880, 345, W - 940, 120);
        ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let x = 880; x < W - 60; x += 40) ctx.fillRect(x, 400, 20, 4);
        textAt(ctx, 'AERO VIOLETA ✈', 1400, 60, 22, '#7b4fd6');
        ctx.font = `700 12px ${FONT}`;
        void t;
      },
    };
  }, []); // eslint-disable-line

  const pickSeat = (r: number, L: string) => {
    const seat = r + L;
    setRowPick(null);
    if (seat === b.seat) {
      sfx.play('win'); setSeated(true);
      const P = ref.current!.player;
      const li = LETTERS.indexOf(L);
      const sy = li < 3 ? 170 + li * 62 : 470 + (li - 3) * 62;
      ref.current!.teleport(SX + (r - 1) * SW + SW / 2 + 6, sy + 44, 0);
      P.sit = true;
      achieve('asiento');
      speak('Azafata', { es: '¡Perfecto! Abróchese el cinturón, por favor. Vamos a despegar.', hy: 'Հիանալի է։ Ամրացրեք գոտին, խնդրում եմ։ Թռիչք ենք կատարում։' });
      complete('embarque', 70, 15);
    } else if (occupied.has(seat)) {
      sfx.play('bad'); speak('Pasajero', pick([{ es: 'Perdone, creo que este es mi asiento.', hy: 'Ներեցեք, կարծում եմ՝ սա իմ տեղն է։' }, { es: 'Lo siento, este asiento está ocupado.', hy: 'Ցավում եմ, այս տեղը զբաղված է։' }]));
    } else {
      sfx.play('bad'); speak('Azafata', { es: `No, señorita, ese es el ${seat}. Su asiento es el ${b.seat}.`, hy: `Ոչ, օրիորդ, դա ${seat}-ն է։ Ձեր տեղը ${b.seat}-ն է։` });
    }
  };

  const objective: L = !greeted ? { es: 'Saluda a la azafata en la puerta del avión.', hy: 'Բարևիր ուղեկցորդուհուն ինքնաթիռի դռան մոտ։' }
    : !seated ? { es: `Busca tu asiento: fila ${b.row}, letra ${b.letter}.`, hy: `Գտիր քո տեղը՝ ${b.row}-րդ շարք, ${b.letter} տառ։` }
      : { es: '¡Estás en tu asiento! Disfruta del vuelo.', hy: 'Դու քո տեղում ես։ Վայելիր թռիչքը։' };
  return (
    <div className="screen world-screen">
      <TopBar title={<Es t={{ es: 'Embarque: la pasarela y el avión', hy: 'Նստեցում՝ կամուրջ և ինքնաթիռ' }} voice={false} />} />
      <World def={def} ref={ref} paused={dlg || rowPick !== null}>
        <div className="objective"><span>🎯</span><Es t={objective} /></div>
        <div className="seat-chip">💺 {b.seat}</div>
        {msg && <div className="speech pop"><b><Who n={msg.who} />:</b> <Es t={msg.t} size="lg" /><button className="btn ghost sm" onClick={() => setMsg(null)}>✕</button></div>}
        {seated && <button className="btn primary big glow floating-center" onClick={() => go('flight')}>✈️ ¡A volar! ▶</button>}
      </World>
      {dlg && (
        <div className="overlay-full">
          <Dialogue scene={BIENVENIDA} bg="bg-plane" initVars={boardingVars(b, prog.kg)} onExit={() => setDlg(false)} onDone={() => {
            setDlg(false); setGreeted(true);
            const bl = def.ents.find((e) => e.id === 'block'); if (bl) bl.hidden = true;
            const az = def.ents.find((e) => e.id === 'azafata'); if (az) { az.act = () => speak('Azafata', { es: `Su asiento es el ${b.seat}, fila ${b.row}.`, hy: `Ձեր տեղը ${b.seat}-ն է՝ ${b.row}-րդ շարք։` }); az.actText = 'Preguntar|Հարցնել'; }
          }} />
        </div>
      )}
      {rowPick !== null && (
        <Modal onClose={() => setRowPick(null)}>
          <Es t={{ es: `Fila ${rowPick}. ¿Qué asiento?`, hy: `${rowPick}-րդ շարք։ Ո՞ր տեղը։` }} size="lg" block />
          <div className="seat-row">
            {LETTERS.map((L, i) => (
              <span key={L} style={{ display: 'contents' }}>
                {i === 3 && <div className="aisle-gap">PASILLO</div>}
                <button className={`seat-btn ${occupied.has(rowPick + L) ? 'occ' : ''}`} onClick={() => pickSeat(rowPick, L)}>
                  {occupied.has(rowPick + L) ? '🧑' : '💺'}<b>{rowPick}{L}</b>
                  <small>{L === 'A' || L === 'F' ? 'ventanilla' : L === 'C' || L === 'D' ? 'pasillo' : 'centro'}</small>
                </button>
              </span>
            ))}
          </div>
          <div className="row wrap"><Es t={{ es: 'ventanilla', hy: 'պատուհան' }} size="sm" voice={false} /><Es t={{ es: 'pasillo', hy: 'միջանցք' }} size="sm" voice={false} /><Es t={{ es: 'centro', hy: 'մեջտեղ' }} size="sm" voice={false} /></div>
        </Modal>
      )}
    </div>
  );
}
