import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../store';
import { useNav } from '../nav';
import { TopBar } from '../ui/Hud';
import { Es, Note, Tr, Who } from '../ui/Es';
import { Person, LOOKS } from '../ui/Person';
import { say, sfx } from '../audio';
import type { L } from '../types';
import { fmtPrice, pick, priceEs, sample, shuffle } from '../types';
import { norm } from '../data/dialog';

type Prod = { id: string; es: string; name: string; hy: string; price: number; kind: 'drink' | 'food' | 'gift'; icon: string };
const CAT: Record<string, Prod[]> = {
  cafe: [
    { id: 'cl', es: 'un café con leche', name: 'café con leche', hy: 'կաթով սուրճ', price: 2.5, kind: 'drink', icon: '☕' },
    { id: 'cs', es: 'un café solo', name: 'café solo', hy: 'սև սուրճ', price: 1.8, kind: 'drink', icon: '☕' },
    { id: 'te', es: 'un té', name: 'té', hy: 'թեյ', price: 1.5, kind: 'drink', icon: '🍵' },
    { id: 'zn', es: 'un zumo de naranja', name: 'zumo de naranja', hy: 'նարնջի հյութ', price: 3, kind: 'drink', icon: '🧃' },
    { id: 'ag', es: 'una botella de agua', name: 'agua', hy: 'մի շիշ ջուր', price: 1.5, kind: 'drink', icon: '💧' },
    { id: 'bj', es: 'un bocadillo de jamón', name: 'bocadillo de jamón', hy: 'խոզապուխտով բուտերբրոդ', price: 4.5, kind: 'food', icon: '🥖' },
    { id: 'bq', es: 'un bocadillo de queso', name: 'bocadillo de queso', hy: 'պանրով բուտերբրոդ', price: 4, kind: 'food', icon: '🥪' },
    { id: 'cr', es: 'un cruasán', name: 'cruasán', hy: 'կրուասան', price: 2, kind: 'food', icon: '🥐' },
    { id: 'to', es: 'una tortilla de patatas', name: 'tortilla de patatas', hy: 'կարտոֆիլով ձվածեղ', price: 3.5, kind: 'food', icon: '🍳' },
    { id: 'ma', es: 'una magdalena', name: 'magdalena', hy: 'կեքս', price: 1.5, kind: 'food', icon: '🧁' },
  ],
  tienda: [
    { id: 'ag', es: 'una botella de agua', name: 'agua', hy: 'մի շիշ ջուր', price: 2, kind: 'drink', icon: '💧' },
    { id: 'ch', es: 'un chocolate', name: 'chocolate', hy: 'շոկոլադ', price: 3, kind: 'food', icon: '🍫' },
    { id: 're', es: 'una revista', name: 'revista', hy: 'ամսագիր', price: 4, kind: 'gift', icon: '📰' },
    { id: 'ga', es: 'unas gafas de sol', name: 'gafas de sol', hy: 'արևային ակնոց', price: 15, kind: 'gift', icon: '🕶️' },
    { id: 'pe', es: 'un perfume', name: 'perfume', hy: 'օծանելիք', price: 20, kind: 'gift', icon: '🧴' },
    { id: 'ca', es: 'un cargador', name: 'cargador', hy: 'լիցքավորիչ', price: 12, kind: 'gift', icon: '🔌' },
    { id: 'ca2', es: 'unos caramelos', name: 'caramelos', hy: 'կոնֆետներ', price: 2.5, kind: 'food', icon: '🍬' },
  ],
  recuerdos: [
    { id: 'im', es: 'un imán', name: 'imán', hy: 'մագնիս', price: 3, kind: 'gift', icon: '🧲' },
    { id: 'po', es: 'una postal', name: 'postal', hy: 'բացիկ', price: 1, kind: 'gift', icon: '💌' },
    { id: 'ta', es: 'una taza', name: 'taza', hy: 'գավաթ', price: 8, kind: 'gift', icon: '🏺' },
    { id: 'll', es: 'un llavero', name: 'llavero', hy: 'բանալու կախազարդ', price: 4, kind: 'gift', icon: '🔑' },
    { id: 'cm', es: 'una camiseta', name: 'camiseta', hy: 'շապիկ', price: 12, kind: 'gift', icon: '👕' },
    { id: 'pl', es: 'un peluche', name: 'peluche', hy: 'փափուկ խաղալիք', price: 10, kind: 'gift', icon: '🧸' },
    { id: 'ga', es: 'una granada de cerámica', name: 'granada', hy: 'կերամիկական նուռ', price: 6, kind: 'gift', icon: '🍎' },
  ],
};
const INFO: Record<string, { title: L; who: string; look: any; greet: L[]; bg: string }> = {
  cafe: { title: { es: 'La cafetería', hy: 'Սրճարանը' }, who: 'Camarero', look: LOOKS.camarero, bg: 'bg-cafe', greet: [{ es: 'Buenas tardes. ¿Qué le pongo?', hy: 'Բարի օր։ Ի՞նչ բերեմ ձեզ։' }, { es: 'Hola, ¿qué va a tomar?', hy: 'Բարև, ի՞նչ եք վերցնելու։' }, { es: 'Buenas. ¿Qué desea?', hy: 'Բարև։ Ի՞նչ եք ցանկանում։' }] },
  tienda: { title: { es: 'La tienda', hy: 'Խանութը' }, who: 'Dependienta', look: LOOKS.recepcion, bg: 'bg-shop', greet: [{ es: 'Hola, buenas tardes. ¿Puedo ayudarla?', hy: 'Բարև, բարի օր։ Կարո՞ղ եմ օգնել։' }, { es: '¡Hola! ¿Busca algo?', hy: 'Բարև։ Ինչ-որ բան եք փնտրո՞ւմ։' }] },
  recuerdos: { title: { es: 'Tienda de recuerdos', hy: 'Հուշանվերների խանութ' }, who: 'Dependiente', look: LOOKS.pasajero, bg: 'bg-shop', greet: [{ es: '¡Bienvenida! ¿Busca un regalo?', hy: 'Բարի գալուստ։ Նվե՞ր եք փնտրում։' }, { es: 'Hola, ¿en qué la puedo ayudar?', hy: 'Բարև, ինչո՞վ կարող եմ օգնել։' }] },
};
type Task = { t: L; check: (c: Prod[]) => boolean };
function tasks(shop: string, lv: number): Task[] {
  if (shop === 'cafe') return [
    { t: { es: 'Pide algo para beber y algo para comer.', hy: 'Պատվիրիր խմելու և ուտելու ինչ-որ բան։' }, check: (c) => c.some((x) => x.kind === 'drink') && c.some((x) => x.kind === 'food') },
    { t: { es: 'Pide un café con leche y un bocadillo.', hy: 'Պատվիրիր կաթով սուրճ և բուտերբրոդ։' }, check: (c) => c.some((x) => x.id === 'cl') && c.some((x) => x.id.startsWith('b')) },
    ...(lv > 1 ? [{ t: { es: 'Tienes ocho euros. Compra tres cosas.', hy: 'Ունես ութ եվրո։ Գնիր երեք բան։' }, check: (c: Prod[]) => c.length === 3 && c.reduce((s, x) => s + x.price, 0) <= 8 }] : []),
    ...(lv > 2 ? [{ t: { es: 'No bebes café. Pide una bebida sin café y algo dulce.', hy: 'Սուրճ չես խմում։ Պատվիրիր առանց սուրճի խմիչք և քաղցր բան։' }, check: (c: Prod[]) => c.some((x) => ['te', 'zn', 'ag'].includes(x.id)) && c.some((x) => ['cr', 'ma'].includes(x.id)) && !c.some((x) => x.id.startsWith('c') && x.kind === 'drink') }] : []),
  ];
  if (shop === 'tienda') return [
    { t: { es: 'Compra agua para el avión.', hy: 'Գնիր ջուր ինքնաթիռի համար։' }, check: (c) => c.some((x) => x.id === 'ag') },
    { t: { es: 'Compra algo para leer y algo dulce.', hy: 'Գնիր կարդալու և քաղցր ինչ-որ բան։' }, check: (c) => c.some((x) => x.id === 're') && c.some((x) => x.kind === 'food') },
  ];
  return [
    { t: { es: 'Compra un regalo para tu mamá.', hy: 'Գնիր նվեր մայրիկիդ համար։' }, check: (c) => c.length >= 1 },
    { t: { es: 'Compra dos recuerdos por menos de diez euros.', hy: 'Գնիր երկու հուշանվեր տասը եվրոյից պակաս։' }, check: (c) => c.length === 2 && c.reduce((s, x) => s + x.price, 0) < 10 },
  ];
}
const joinEs = (a: string[]) => (a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1]);
const joinHy = (a: string[]) => (a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' և ' + a[a.length - 1]);
function orderLine(items: Prod[], shop: string, form: number): L {
  const es = joinEs(items.map((i) => i.es)), hy = joinHy(items.map((i) => i.hy));
  const forms: L[] = shop === 'cafe'
    ? [{ es: `Quisiera ${es}, por favor.`, hy: `Կցանկանայի ${hy}, խնդրում եմ։` }, { es: `Me pone ${es}, por favor.`, hy: `Կտա՞ք ${hy}, խնդրում եմ։` }, { es: `Para mí, ${es}.`, hy: `Ինձ համար՝ ${hy}։` }]
    : [{ es: `Quisiera comprar ${es}.`, hy: `Կցանկանայի գնել ${hy}։` }, { es: `Me llevo ${es}, por favor.`, hy: `Կվերցնեմ ${hy}, խնդրում եմ։` }];
  return forms[form % forms.length];
}

const COINS = [0.5, 1, 2, 5, 10, 20];

export function Cafe() {
  const { prog, set, complete, achieve, addScore, learn } = useGame();
  const { go, params } = useNav();
  const shop: string = params?.shop ?? 'cafe';
  const info = INFO[shop];
  const cat = CAT[shop];
  const lv = prog.level;
  const task = useMemo(() => pick(tasks(shop, lv)), [shop, lv]);
  const soldOut = useMemo(() => (lv === 3 ? pick(cat) : null), [cat, lv]);
  const [phase, setPhase] = useState<'menu' | 'order' | 'more' | 'pay' | 'done'>('menu');
  const [cart, setCart] = useState<Prod[]>([]);
  const [line, setLine] = useState<L>(pick(info.greet));
  const [paid, setPaid] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [log, setLog] = useState<L[]>([]);
  const [typed, setTyped] = useState('');
  const total = Math.round(cart.reduce((s, x) => s + x.price, 0) * 100) / 100;
  const paidSum = Math.round(paid.reduce((s, x) => s + x, 0) * 100) / 100;
  const npc = (l: L) => { setLine(l); say(l.es); };
  useEffect(() => { say(line.es); }, []); // eslint-disable-line
  const me = (l: L) => { setLog((g) => [...g, l]); learn(l); };

  const toggle = (p: Prod) => {
    sfx.play('click');
    if (soldOut && p.id === soldOut.id) { sfx.play('bad'); npc({ es: `Lo siento, no nos queda ${p.name}. ¿Quiere otra cosa?`, hy: `Ցավում եմ, ${p.hy} չի մնացել։ Ուրիշ բան կուզե՞ք։` }); return; }
    setCart((c) => (c.find((x) => x.id === p.id) ? c.filter((x) => x.id !== p.id) : c.length >= 4 ? c : [...c, p]));
  };

  const options = useMemo(() => {
    if (phase !== 'order' || !cart.length) return [];
    const form = Math.floor(Math.random() * 3);
    const right = orderLine(cart, shop, form);
    const others = cat.filter((x) => !cart.find((c) => c.id === x.id));
    const w1 = orderLine(cart.map((c, i) => (i === 0 && others.length ? pick(others) : c)), shop, form + 1);
    const w2 = cart.length > 1 ? orderLine(cart.slice(1), shop, form + 2) : orderLine([pick(others.length ? others : cat)], shop, form + 2);
    return shuffle([{ l: right, ok: true }, { l: w1, ok: false }, { l: w2, ok: false }]);
  }, [phase]); // eslint-disable-line

  const chooseOrder = (o: { l: L; ok: boolean }) => {
    if (!o.ok) { sfx.play('bad'); setMistakes((m) => m + 1); npc({ es: 'Perdone, ¿cómo? Mire su bandeja: ¿qué quiere exactamente?', hy: 'Ներեցեք, ինչպե՞ս։ Նայեք ձեր սկուտեղին՝ կոնկրետ ի՞նչ եք ուզում։' }); return; }
    sfx.play('ok'); me(o.l); addScore(10);
    setPhase('more'); npc(pick([{ es: '¿Algo más?', hy: 'Էլի ինչ-որ բա՞ն։' }, { es: 'Muy bien. ¿Algo más?', hy: 'Շատ լավ։ Էլի ինչ-որ բա՞ն։' }, { es: '¿Quiere algo más?', hy: 'Էլի ինչ-որ բան կուզե՞ք։' }]));
  };
  const typeOrder = () => {
    const n = norm(typed);
    const names = cart.every((c) => n.includes(norm(c.name).split(' ')[0]));
    const polite = /quisiera|quiero|me pone|para mi|me llevo|por favor|comprar/.test(n);
    if (names && polite) chooseOrder({ l: { es: typed, hy: orderLine(cart, shop, 0).hy }, ok: true });
    else { sfx.play('bad'); setMistakes((m) => m + 1); npc({ es: 'Perdone, no la entiendo. Diga, por ejemplo: «Quisiera…, por favor».', hy: 'Ներեցեք, չեմ հասկանում։ Ասեք, օրինակ՝ «Quisiera…, por favor»։' }); }
    setTyped('');
  };
  const more = (yes: boolean, l: L) => {
    me(l); sfx.play('click');
    if (yes) { setPhase('menu'); npc({ es: 'Claro, dígame.', hy: 'Իհարկե, ասեք։' }); return; }
    setPhase('pay');
    npc(lv === 1 ? { es: `Son ${priceEs(total)}. (${fmtPrice(total)} €)`, hy: `${fmtPrice(total)} եվրո է։` } : { es: `Son ${priceEs(total)}.`, hy: `${fmtPrice(total)} եվրո է։` });
  };
  const pay = () => {
    if (paidSum < total) { sfx.play('bad'); setMistakes((m) => m + 1); const f = Math.round((total - paidSum) * 100) / 100; npc({ es: `Faltan ${priceEs(f)}.`, hy: `Պակասում է ${fmtPrice(f)} եվրո։` }); return; }
    const change = Math.round((paidSum - total) * 100) / 100;
    me({ es: 'Aquí tiene.', hy: 'Վերցրեք։' });
    sfx.play('coin');
    set((p) => ({ ...p, coins: Math.max(0, p.coins - total), cafeOrders: p.cafeOrders + 1 }));
    if (change === 0) achieve('exacto');
    achieve('cliente');
    const ok = task.check(cart);
    npc(change ? { es: `Gracias. Aquí tiene su cambio: ${priceEs(change)}. ¡Que aproveche!`, hy: `Շնորհակալություն։ Ահա ձեր մանրը՝ ${fmtPrice(change)} եվրո։ Բարի ախորժակ։` } : { es: '¡Justo! Muchas gracias. ¡Que aproveche!', hy: 'Ճիշտ է։ Շատ շնորհակալություն։ Բարի ախորժակ։' });
    complete('cafe', 40 + (ok ? 30 : 0) + Math.max(0, 20 - mistakes * 5), ok ? 8 : 4);
    setPhase('done');
  };

  const enough = prog.coins >= total;
  return (
    <div className={`screen cafe-screen ${info.bg}`}>
      <TopBar title={<Es t={info.title} voice={false} />} back="hall" />
      <div className="cafe-top">
        <div className="cafe-npc"><Person look={info.look} size={170} talking /></div>
        <div className="cafe-bubble pop" key={line.es}><b><Who n={info.who} />:</b> <Es t={line} size="lg" /></div>
        <div className="task-card"><span>📝</span><Es t={task.t} size="md" />{phase !== 'menu' && phase !== 'done' && <span className={task.check(cart) ? 'tk ok' : 'tk'}>{task.check(cart) ? '✓' : '…'}</span>}</div>
      </div>
      <div className="cafe-body">
        <div className="menu-board">
          <h3><Es t={{ es: shop === 'cafe' ? 'La carta' : 'Los productos', hy: shop === 'cafe' ? 'Ճաշացանկը' : 'Ապրանքները' }} voice={false} /></h3>
          <div className="menu-items">
            {cat.map((p) => (
              <div key={p.id} className={`menu-item ${cart.find((c) => c.id === p.id) ? 'in' : ''} ${soldOut?.id === p.id ? 'sold' : ''}`} role="button" onClick={() => phase === 'menu' && toggle(p)}>
                <span className="mi-icon">{p.icon}</span>
                <Es t={{ es: p.name, hy: p.hy }} size="sm" />
                <span className="mi-price">{lv === 3 ? '€ ?' : `${fmtPrice(p.price)} €`}</span>
                {lv === 3 && <Es t={{ es: priceEs(p.price), hy: `${fmtPrice(p.price)} եվրո` }} size="sm" voice className="price-words" />}
              </div>
            ))}
          </div>
        </div>
        <div className="cafe-side">
          <div className="tray-box">
            <div className="tb-title">🧺 <Es t={{ es: 'Tu bandeja', hy: 'Քո սկուտեղը' }} voice={false} size="sm" /></div>
            <div className="tb-items">{cart.map((c) => <span key={c.id} className="drop-in">{c.icon}</span>)}{!cart.length && <small>—</small>}</div>
            {lv < 3 && <div className="tb-total">Σ {fmtPrice(total)} €</div>}
            <div className="tb-coins">🪙 {fmtPrice(prog.coins)}</div>
          </div>
          {log.map((l, i) => <div key={i} className="me-line"><b><Who n="Gayane" />:</b> <Es t={l} size="md" /></div>)}
          {phase === 'menu' && <button className="btn primary big" disabled={!cart.length} onClick={() => { setPhase('order'); sfx.play('click'); }}>🗣️ <Tr s="Pedir|Պատվիրել" /></button>}
          {phase === 'order' && (
            <div className="choices">
              <Note s="¿Cómo lo pides?|Ինչպե՞ս ես պատվիրում։" />
              {lv < 3 ? options.map((o, i) => <div key={i} className="choice" role="button" onClick={() => chooseOrder(o)}><span className="letter">{'ABC'[i]}</span><Es t={o.l} size="md" /></div>) : (
                <div className="row"><input className="answer-input" value={typed} onChange={(e) => setTyped(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && typeOrder()} placeholder="Quisiera…" /><button className="btn primary" onClick={typeOrder}>➤</button></div>
              )}
              {lv === 3 && <button className="btn ghost sm" onClick={() => setPhase('menu')}>← <Tr s="La carta|Ճաշացանկը" size="sm" /></button>}
            </div>
          )}
          {phase === 'more' && (
            <div className="choices">
              <div className="choice" role="button" onClick={() => more(false, { es: 'No, gracias. ¿Cuánto es?', hy: 'Ոչ, շնորհակալություն։ Որքա՞ն է։' })}><span className="letter">A</span><Es t={{ es: 'No, gracias. ¿Cuánto es?', hy: 'Ոչ, շնորհակալություն։ Որքա՞ն է։' }} /></div>
              <div className="choice" role="button" onClick={() => more(true, { es: 'Sí, también quiero otra cosa.', hy: 'Այո, ուրիշ բան էլ եմ ուզում։' })}><span className="letter">B</span><Es t={{ es: 'Sí, también quiero otra cosa.', hy: 'Այո, ուրիշ բան էլ եմ ուզում։' }} /></div>
              {lv > 1 && <div className="choice" role="button" onClick={() => more(false, { es: 'Eso es todo. ¿Me cobra, por favor?', hy: 'Այսքանը։ Կհաշվե՞ք, խնդրում եմ։' })}><span className="letter">C</span><Es t={{ es: 'Eso es todo. ¿Me cobra, por favor?', hy: 'Այսքանը։ Կհաշվե՞ք, խնդրում եմ։' }} /></div>}
            </div>
          )}
          {phase === 'pay' && (
            <div className="pay">
              <Note s="Escucha el precio y paga con monedas.|Լսիր գինը և վճարիր մետաղադրամներով։" />
              {!enough && <Note s="No tienes suficientes monedas, pero hoy el juego te ayuda 😉|Մետաղադրամներդ բավարար չեն, բայց այսօր խաղը քեզ կօգնի 😉" />}
              <div className="coins">{COINS.map((c) => <button key={c} className={`coin c${String(c).replace('.', '')}`} onClick={() => { sfx.play('coin'); setPaid((p) => [...p, c]); }}>{c < 5 ? fmtPrice(c) : fmtPrice(c)}€</button>)}</div>
              <div className="paid">💶 {paid.map((c, i) => <span key={i} onClick={() => setPaid((p) => p.filter((_, j) => j !== i))}>{fmtPrice(c)}</span>)} = <b>{fmtPrice(paidSum)} €</b></div>
              <div className="row"><button className="btn ghost sm" onClick={() => setPaid([])}>↺</button><button className="btn primary" onClick={pay}><Tr s="Pagar|Վճարել" /> ✓</button></div>
            </div>
          )}
          {phase === 'done' && (
            <div className="pop">
              <div className="served">{cart.map((c) => <span key={c.id}>{c.icon}</span>)}</div>
              <Es t={task.check(cart) ? { es: '¡Tarea cumplida!', hy: 'Առաջադրանքը կատարված է։' } : { es: '¡Compra hecha!', hy: 'Գնումը կատարված է։' }} size="lg" block />
              <div className="row wrap">
                <button className="btn ghost" onClick={() => go('cafe', { shop })}>🔁 <Tr s="Repetir|Կրկնել" /></button>
                <button className="btn soft" onClick={() => go('hall', { at: shop })}>🏢 <Tr s="Aeropuerto|Օդանավակայան" /></button>
                <button className="btn primary" onClick={() => go(prog.done.laberinto ? 'boarding' : 'hall', { at: shop })}>{prog.done.laberinto ? <>🛫 <Tr s="Embarque|Նստեցում" /> ▶</> : <><Tr s="Continuar|Շարունակել" /> ▶</>}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
void sample;
