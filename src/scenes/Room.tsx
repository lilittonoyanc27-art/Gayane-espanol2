import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../store';
import { useNav } from '../nav';
import { Es, Note, Tr, Who } from '../ui/Es';
import { Person, LOOKS } from '../ui/Person';
import { Modal, TopBar } from '../ui/Hud';
import { Wardrobe } from './Wardrobe';
import { say, sfx } from '../audio';
import type { L } from '../types';
import { pick } from '../types';

type Dest = 'hand' | 'bag' | 'any' | 'no';
type Item = { id: string; icon: string; t: L; acc: string; kg: number; dest: Dest; x: number; y: number; hidden?: 'drawer' | 'pillow' | 'bed' | 'wardrobe' };

const ITEMS: Item[] = [
  { id: 'pasaporte', icon: '📕', t: { es: 'el pasaporte', hy: 'անձնագիրը' }, acc: 'անձնագիրը', kg: 0.2, dest: 'hand', x: 63, y: 46 },
  { id: 'billete', icon: '🎟️', t: { es: 'el billete', hy: 'տոմսը' }, acc: 'տոմսը', kg: 0.1, dest: 'hand', x: 70, y: 47 },
  { id: 'tarjeta', icon: '🎫', t: { es: 'la tarjeta de embarque', hy: 'նստեցման կտրոնը' }, acc: 'նստեցման կտրոնը', kg: 0.1, dest: 'hand', x: 8, y: 60 },
  { id: 'ropa', icon: '👚', t: { es: 'la ropa', hy: 'հագուստը' }, acc: 'հագուստը', kg: 4, dest: 'bag', x: 30, y: 52 },
  { id: 'zapatos', icon: '👟', t: { es: 'los zapatos', hy: 'կոշիկները' }, acc: 'կոշիկները', kg: 2, dest: 'bag', x: 40, y: 90 },
  { id: 'cargador', icon: '🔌', t: { es: 'el cargador', hy: 'լիցքավորիչը' }, acc: 'լիցքավորիչը', kg: 0.3, dest: 'hand', x: 66, y: 62, hidden: 'drawer' },
  { id: 'telefono', icon: '📱', t: { es: 'el teléfono', hy: 'հեռախոսը' }, acc: 'հեռախոսը', kg: 0.2, dest: 'hand', x: 39, y: 50 },
  { id: 'cepillo', icon: '🪥', t: { es: 'el cepillo de dientes', hy: 'ատամի խոզանակը' }, acc: 'ատամի խոզանակը', kg: 0.1, dest: 'bag', x: 87, y: 44 },
  { id: 'chaqueta', icon: '🧥', t: { es: 'la chaqueta', hy: 'բաճկոնը' }, acc: 'բաճկոնը', kg: 1.5, dest: 'any', x: 88, y: 22, hidden: 'wardrobe' },
  { id: 'gafas', icon: '🕶️', t: { es: 'las gafas de sol', hy: 'արևային ակնոցը' }, acc: 'արևային ակնոցը', kg: 0.1, dest: 'any', x: 22, y: 44, hidden: 'pillow' },
  { id: 'regalo', icon: '🎁', t: { es: 'el regalo', hy: 'նվերը' }, acc: 'նվերը', kg: 1, dest: 'bag', x: 64, y: 86 },
  { id: 'libro', icon: '📚', t: { es: 'el libro', hy: 'գիրքը' }, acc: 'գիրքը', kg: 1, dest: 'any', x: 74, y: 40 },
  { id: 'perfume', icon: '🧴', t: { es: 'el perfume', hy: 'օծանելիքը' }, acc: 'օծանելիքը', kg: 0.4, dest: 'bag', x: 89, y: 56 },
  { id: 'paraguas', icon: '☂️', t: { es: 'el paraguas', hy: 'անձրևանոցը' }, acc: 'անձրևանոցը', kg: 0.8, dest: 'bag', x: 31, y: 80 },
  { id: 'pesas', icon: '🏋️', t: { es: 'las pesas', hy: 'ծանրաձողերը' }, acc: 'ծանրաձողերը', kg: 15, dest: 'no', x: 52, y: 92 },
  { id: 'planta', icon: '🪴', t: { es: 'la planta', hy: 'բույսը' }, acc: 'բույսը', kg: 3, dest: 'no', x: 54, y: 30 },
  { id: 'gato', icon: '🐱', t: { es: 'el gato', hy: 'կատուն' }, acc: 'կատվին', kg: 4, dest: 'no', x: 31, y: 69, hidden: 'bed' },
];
const REQ: Record<number, string[]> = {
  1: ['pasaporte', 'tarjeta', 'ropa', 'zapatos', 'telefono', 'cepillo'],
  2: ['pasaporte', 'tarjeta', 'ropa', 'zapatos', 'telefono', 'cepillo', 'cargador', 'chaqueta'],
  3: ['pasaporte', 'billete', 'tarjeta', 'ropa', 'zapatos', 'telefono', 'cepillo', 'cargador', 'chaqueta', 'gafas'],
};
const LIMIT: Record<number, number> = { 1: 23, 2: 20, 3: 15 };
const DEST_L = { hand: { es: 'la mochila', hy: 'ուսապարկի մեջ' }, bag: { es: 'la maleta', hy: 'ճամպրուկի մեջ' } };

function request(it: Item, first: boolean): { line: L; dest: 'hand' | 'bag' } {
  const dest: 'hand' | 'bag' = it.dest === 'bag' ? 'bag' : 'hand';
  const d = DEST_L[dest];
  if (first) return { line: { es: `¡Gayane! No olvides tu pasaporte. Ponlo en la mochila.`, hy: 'Գայանե՛, մի՛ մոռացիր անձնագիրդ։ Դիր այն ուսապարկի մեջ։' }, dest };
  const v = pick([
    { es: `Pon ${it.t.es} en ${d.es}.`, hy: `Դիր ${it.acc} ${d.hy}։` },
    { es: `¡No olvides ${it.t.es}! Va en ${d.es}.`, hy: `Չմոռանաս ${it.acc}։ Այն դրվում է ${d.hy}։` },
    { es: `Gayane, ¿y ${it.t.es}? Mételo en ${d.es}.`.replace('Mételo', /^la |^las /.test(it.t.es) ? (it.t.es.startsWith('las') ? 'Mételas' : 'Métela') : (it.t.es.startsWith('los') ? 'Mételos' : 'Mételo')), hy: `Գայանե, իսկ ${it.acc}։ Դիր ${d.hy}։` },
  ]);
  return { line: v, dest };
}

export function Room() {
  const { prog, set, complete, achieve, learn } = useGame();
  const { go } = useNav();
  const lv = prog.level;
  const reqIds = REQ[lv];
  const [where, setWhere] = useState<Record<string, 'hand' | 'bag' | null>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [reqI, setReqI] = useState(0);
  const [mamaLine, setMamaLine] = useState<L>({ es: '¡Buenos días, Gayane! Hoy viajas a Madrid. Vamos a preparar la maleta.', hy: 'Բարի լույս, Գայանե։ Այսօր մեկնում ես Մադրիդ։ Եկ պատրաստենք ճամպրուկը։' });
  const [reqLine, setReqLine] = useState<{ line: L; dest: 'hand' | 'bag' } | null>(null);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; sx: number; sy: number; moved: boolean } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [wardrobe, setWardrobe] = useState(false);
  const [done, setDone] = useState(false);
  const [bump, setBump] = useState<string | null>(null);
  const handRef = useRef<HTMLDivElement>(null), bagRef = useRef<HTMLDivElement>(null), roomRef = useRef<HTMLDivElement>(null);
  const items = useMemo(() => ITEMS.filter((i) => lv > 1 || i.id !== 'billete'), [lv]);
  const kg = (d: 'hand' | 'bag') => items.filter((i) => where[i.id] === d).reduce((s, i) => s + i.kg, 0);
  const bagKg = kg('bag'), handKg = kg('hand');
  const allReq = reqI >= reqIds.length;

  const mama = (l: L) => { setMamaLine(l); if (prog.settings.autoSpeak) say(l.es, 1.15); };
  useEffect(() => {
    const t = setTimeout(() => nextReq(0), 2600);
    if (prog.settings.autoSpeak) say(mamaLine.es, 1.15);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, []);
  const nextReq = (i: number) => {
    setReqI(i);
    if (i >= reqIds.length) {
      mama({ es: '¡Muy bien! Ya tienes todo lo importante. Puedes meter más cosas o cerrar la maleta.', hy: 'Շատ լավ։ Արդեն ունես ամեն կարևոր բան։ Կարող ես էլի իրեր դնել կամ փակել ճամպրուկը։' });
      setReqLine(null);
      return;
    }
    const it = ITEMS.find((x) => x.id === reqIds[i])!;
    const r = request(it, i === 0);
    setReqLine(r);
    mama(r.line);
  };

  const place = (id: string, dest: 'hand' | 'bag') => {
    const it = ITEMS.find((x) => x.id === id)!;
    if (it.dest === 'no') {
      sfx.play('bad'); setMistakes((m) => m + 1);
      mama(it.id === 'gato' ? { es: '¡Ay, no! ¡El gato no puede viajar en la maleta! Se queda en casa conmigo.', hy: 'Վա՜յ, ոչ։ Կատուն չի կարող ճամփորդել ճամպրուկում։ Մնում է տանը՝ ինձ հետ։' }
        : it.id === 'pesas' ? { es: '¡Las pesas pesan demasiado! No las necesitas en Madrid.', hy: 'Ծանրաձողերը չափազանց ծանր են։ Մադրիդում քեզ պետք չեն։' }
          : { es: 'La planta se queda en casa. Yo la riego, tranquila.', hy: 'Բույսը մնում է տանը։ Ես կջրեմ, հանգիստ։' });
      return;
    }
    if (!allReq) {
      const want = reqIds[reqI];
      if (id !== want) {
        sfx.play('bad'); setMistakes((m) => m + 1);
        const w = ITEMS.find((x) => x.id === want)!;
        mama({ es: `No, eso es ${it.t.es}. Ahora busca ${w.t.es}.`, hy: `Ոչ, դա ${it.t.hy} է։ Հիմա գտիր ${w.acc}։` });
        return;
      }
      if (reqLine && dest !== reqLine.dest && it.dest !== 'any') {
        sfx.play('bad'); setMistakes((m) => m + 1);
        mama(dest === 'bag'
          ? { es: `¡No, en la maleta no! ${it.t.es[0].toUpperCase() + it.t.es.slice(1)} va en la mochila, contigo en el avión.`, hy: `Ոչ, ճամպրուկի մեջ չէ։ ${it.t.hy[0].toUpperCase() + it.t.hy.slice(1)} դրվում է ուսապարկի մեջ՝ քեզ հետ ինքնաթիռում։` }
          : { es: `Mejor en la maleta grande, Gayane.`, hy: 'Ավելի լավ է՝ մեծ ճամպրուկի մեջ, Գայանե։' });
        return;
      }
    } else if (it.dest !== 'any' && it.dest !== dest) {
      sfx.play('bad'); setMistakes((m) => m + 1);
      mama(it.dest === 'bag' && it.id === 'perfume' ? { es: 'El perfume es un líquido: mejor en la maleta grande.', hy: 'Օծանելիքը հեղուկ է՝ ավելի լավ է մեծ ճամպրուկում։' } : { es: `Mmm… ${it.t.es} va mejor en ${DEST_L[it.dest as 'hand' | 'bag'].es}.`, hy: `Մմ… ${it.acc} ավելի լավ է դնել ${DEST_L[it.dest as 'hand' | 'bag'].hy}։` });
      return;
    }
    const newKg = (dest === 'bag' ? bagKg : handKg) + it.kg;
    if (dest === 'bag' && newKg > LIMIT[lv]) { sfx.play('bad'); mama({ es: `¡Cuidado! La maleta pesa demasiado. El límite es de ${LIMIT[lv]} kilos.`, hy: `Զգույշ։ Ճամպրուկը չափազանց ծանր է։ Սահմանը ${LIMIT[lv]} կգ է։` }); return; }
    if (dest === 'hand' && newKg > 8) { sfx.play('bad'); mama({ es: 'La mochila pesa demasiado. Máximo ocho kilos.', hy: 'Ուսապարկը չափազանց ծանր է։ Առավելագույնը ութ կգ։' }); return; }
    sfx.play('ok'); learn(it.t);
    setWhere((w) => ({ ...w, [id]: dest }));
    setBump(dest); setTimeout(() => setBump(null), 400);
    if (!allReq) {
      setTimeout(() => mama(pick([{ es: '¡Perfecto!', hy: 'Հիանալի է։' }, { es: '¡Muy bien, cariño!', hy: 'Շատ լավ, սիրելիս։' }, { es: '¡Eso es!', hy: 'Ճիշտ այդպես։' }])), 50);
      setTimeout(() => nextReq(reqI + 1), 1400);
    }
  };

  const reveal = (spot: Item['hidden']) => {
    sfx.play('open');
    const its = ITEMS.filter((i) => i.hidden === spot);
    setRevealed((r) => { const n = { ...r }; its.forEach((i) => (n[i.id] = true)); return n; });
    if (spot === 'bed') { achieve('gato'); mama({ es: '¡Miau! ¡Has encontrado al gato escondido debajo de la cama!', hy: 'Մյաու։ Գտար մահճակալի տակ թաքնված կատվին։' }); }
    if (spot === 'wardrobe') setWardrobe(true);
  };

  const dropAt = (id: string, cx: number, cy: number) => {
    const inR = (el: HTMLDivElement | null) => { if (!el) return false; const r = el.getBoundingClientRect(); return cx > r.left - 10 && cx < r.right + 10 && cy > r.top - 10 && cy < r.bottom + 10; };
    if (inR(handRef.current)) place(id, 'hand');
    else if (inR(bagRef.current)) place(id, 'bag');
  };

  const finish = () => {
    const missing = reqIds.filter((r) => !where[r]);
    if (missing.length) { sfx.play('bad'); const w = ITEMS.find((x) => x.id === missing[0])!; mama({ es: `¡Espera! Todavía falta ${w.t.es}.`, hy: `Սպասիր։ Դեռ պակասում է ${w.t.hy}։` }); return; }
    if (mistakes === 0) achieve('maletaPerfecta');
    if (bagKg <= 10) achieve('ligera');
    set((p) => ({ ...p, kg: Math.max(5, Math.round(bagKg)) }));
    complete('maleta', 60 + Math.max(0, 30 - mistakes * 5), 10);
    setDone(true);
    mama({ es: '¡Qué bien! La maleta está lista. ¡Buen viaje, hija! El taxi te espera.', hy: 'Ինչ լավ է։ Ճամպրուկը պատրաստ է։ Բարի ճանապարհ, աղջիկս։ Տաքսին քեզ սպասում է։' });
  };

  const visible = items.filter((i) => !where[i.id] && (!i.hidden || revealed[i.id]));
  const reqItem = !allReq ? ITEMS.find((x) => x.id === reqIds[reqI]) : null;
  const showLabels = lv < 3;

  return (
    <div className="screen room-screen"
      onPointerMove={(e) => { if (drag) { const m = drag.moved || Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6; setDrag({ ...drag, x: e.clientX, y: e.clientY, moved: m }); } }}
      onPointerUp={(e) => {
        if (!drag) return;
        if (drag.moved) dropAt(drag.id, e.clientX, e.clientY);
        else { setSelected((s) => (s === drag.id ? null : drag.id)); sfx.play('click'); }
        setDrag(null);
      }}>
      <TopBar title={<Es t={{ es: 'Prepara tu maleta', hy: 'Պատրաստիր ճամպրուկդ' }} voice={false} />} />
      <div className="room" ref={roomRef}>
        <div className="r-wall" /><div className="r-floor" /><div className="r-rug" />
        <div className="r-window"><div className="r-sky"><span>☁️</span><span>✈️</span></div><div className="r-ararat" /></div>
        <div className="r-poster">MADRID ❤</div>
        <div className="r-wardrobe furniture" onClick={() => reveal('wardrobe')} title="El armario"><div className="door l" /><div className="door r" /><Es t={{ es: 'el armario', hy: 'զգեստապահարանը' }} size="sm" voice={false} className="f-label" /></div>
        <div className="r-bed furniture">
          <div className="r-pillow" onClick={() => reveal('pillow')} title="la almohada" />
          <div className="r-blanket" />
          <div className="r-bedskirt" onClick={() => reveal('bed')} title="debajo de la cama" />
          <Es t={{ es: 'la cama', hy: 'մահճակալը' }} size="sm" voice={false} className="f-label" />
        </div>
        <div className="r-desk furniture">
          <div className="r-lamp" />
          <div className={`r-drawer ${revealed.cargador ? 'open' : ''}`} onClick={() => reveal('drawer')} title="el cajón"><span /></div>
          <Es t={{ es: 'el escritorio', hy: 'գրասեղանը' }} size="sm" voice={false} className="f-label" />
        </div>
        <div className="r-shelf furniture" />
        <div className="r-mama"><Person look={LOOKS.mama} size={150} talking /></div>
        <div className="r-girl"><Person look={prog.outfit} size={150} /></div>

        {visible.map((it) => (
          <div key={it.id} className={`item ${selected === it.id ? 'sel' : ''} ${reqItem?.id === it.id && mistakes > 2 ? 'hint' : ''} ${drag?.id === it.id && drag.moved ? 'ghosted' : ''}`}
            style={{ left: `${it.x}%`, top: `${it.y}%` }}
            onPointerDown={(e) => { e.preventDefault(); setDrag({ id: it.id, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false }); }}>
            <span className="item-icon">{it.icon}</span>
            {showLabels && <Es t={it.t} size="sm" voice={false} className="item-label" />}
          </div>
        ))}

        <div className={`container c-hand ${bump === 'hand' ? 'bump' : ''} ${selected ? 'target' : ''}`} ref={handRef} onClick={() => { if (selected) { place(selected, 'hand'); setSelected(null); } }}>
          <div className="c-icon">🎒</div>
          <Es t={{ es: 'La mochila (equipaje de mano)', hy: 'Ուսապարկ (ձեռքի ուղեբեռ)' }} size="sm" voice={false} />
          <div className="c-items">{items.filter((i) => where[i.id] === 'hand').map((i) => <span key={i.id}>{i.icon}</span>)}</div>
          <div className="c-kg">{handKg.toFixed(1)} / 8 kg</div>
        </div>
        <div className={`container c-bag ${bump === 'bag' ? 'bump' : ''} ${selected ? 'target' : ''}`} ref={bagRef} onClick={() => { if (selected) { place(selected, 'bag'); setSelected(null); } }}>
          <div className="suitcase-lid" />
          <div className="suitcase-body">
            <div className="c-items">{items.filter((i) => where[i.id] === 'bag').map((i) => <span key={i.id}>{i.icon}</span>)}</div>
          </div>
          <Es t={{ es: 'La maleta (para facturar)', hy: 'Ճամպրուկ (հանձնելու համար)' }} size="sm" voice={false} />
          <div className="weight"><div style={{ width: `${Math.min(100, (bagKg / LIMIT[lv]) * 100)}%`, background: bagKg > LIMIT[lv] * 0.85 ? '#ff5b7f' : '#2bd9c4' }} /></div>
          <div className="c-kg">⚖️ {bagKg.toFixed(1)} / {LIMIT[lv]} kg</div>
        </div>
      </div>

      <div className="room-panel">
        <div className="mama-bubble pop" key={mamaLine.es}>
          <span className="who"><Who n="Mamá" />:</span> <Es t={mamaLine} size="lg" />
        </div>
        <div className="room-tasks">
          <div className="tasks-title">📋 <Es t={{ es: `Misiones (${Math.min(reqI, reqIds.length)}/${reqIds.length})`, hy: `Առաջադրանքներ (${Math.min(reqI, reqIds.length)}/${reqIds.length})` }} size="md" voice={false} /></div>
          <div className="task-dots">{reqIds.map((r, i) => <span key={r} className={i < reqI ? 'ok' : i === reqI ? 'cur' : ''}>{i < reqI ? ITEMS.find((x) => x.id === r)!.icon : '•'}</span>)}</div>
          <div className="secret">🤫 <Es t={{ es: 'Misiones secretas:', hy: 'Գաղտնի առաջադրանքներ՝' }} size="sm" voice={false} />
            <div className="secret-list">
              <span>{prog.achievements.includes('gato') ? '✅' : '🐱'} <Es t={{ es: 'Encuentra el gato escondido.', hy: 'Գտիր թաքնված կատվին։' }} size="sm" voice={false} /></span>
              <span>{bagKg <= 10 && allReq ? '✅' : '🪶'} <Es t={{ es: 'La maleta pesa diez kilos o menos.', hy: 'Ճամպրուկը կշռում է տասը կիլոգրամ կամ պակաս։' }} size="sm" voice={false} /></span>
              <span>{mistakes === 0 ? '💎' : '✗'} <Es t={{ es: 'Haz la maleta sin errores.', hy: 'Հավաքիր ճամպրուկն առանց սխալների։' }} size="sm" voice={false} /></span>
            </div>
          </div>
          <Note s="Arrastra la cosa o tócala y después toca la mochila o la maleta.|Քաշիր իրը կամ սեղմիր իրին, հետո՝ ուսապարկին կամ ճամպրուկին։" />
          <Note s="Algunas cosas están escondidas: busca debajo de la almohada, en el cajón, en el armario y debajo de la cama.|Որոշ իրեր թաքնված են․ փնտրիր բարձի տակ, դարակում, պահարանում և մահճակալի տակ։" />
          {allReq && !done && <button className="btn primary big glow" onClick={finish}>🧳 <Tr s="Cerrar la maleta|Փակել ճամպրուկը" /></button>}
          {done && <button className="btn primary big glow" onClick={() => go('taxi')}>🚕 <Tr s="Al taxi|Դեպի տաքսի" /> ▶</button>}
        </div>
      </div>

      {drag && drag.moved && (() => { const it = ITEMS.find((x) => x.id === drag.id)!; return <div className="drag-ghost" style={{ left: drag.x, top: drag.y }}>{it.icon}</div>; })()}
      {wardrobe && <Modal onClose={() => setWardrobe(false)} wide><Wardrobe embedded onClose={() => setWardrobe(false)} /></Modal>}
    </div>
  );
}
