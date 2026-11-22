import { useEffect, useMemo, useRef, useState } from 'react';
import { World, WorldDef, WorldHandle, Ent } from '../engine/World';
import { bench, npc, plant, textAt, walker } from '../engine/props';
import { drawPerson, rr, shadow, FONT } from '../engine/draw';
import { useGame } from '../store';
import { useNav } from '../nav';
import { TopBar, Modal } from '../ui/Hud';
import { Es, Note, Tr, Who } from '../ui/Es';
import { Dialogue } from '../ui/Dialogue';
import { LOOKS } from '../ui/Person';
import { INFO, PASAPORTE } from '../data/scenes';
import type { DScene } from '../data/dialog';
import { st } from '../data/dialog';
import { boardingVars, ensureBoarding } from '../boardingInfo';
import type { L } from '../types';
import { p } from '../types';
import { say, sfx } from '../audio';

const W = 3000, H = 1400;
type R = { x: number; y: number; w: number; h: number };
const WALLS: R[] = [
  { x: 0, y: 0, w: 1300, h: 70 },
  { x: 0, y: 380, w: 3000, h: 100 },
  { x: 1300, y: 0, w: 1700, h: 480 },
  { x: 1300, y: 480, w: 40, h: 370 }, { x: 1300, y: 1000, w: 40, h: 400 },
  { x: 1720, y: 480, w: 40, h: 370 }, { x: 1720, y: 1000, w: 40, h: 400 },
];
const inter = (a: R, x: number, y: number, w: number, h: number) => x < a.x + a.w && x + w > a.x && y < a.y + a.h && y + h > a.y;

const DESTS = [
  { city: 'París', hy: 'Փարիզ' }, { city: 'Roma', hy: 'Հռոմ' }, { city: 'Atenas', hy: 'Աթենք' }, { city: 'Viena', hy: 'Վիեննա' },
  { city: 'Dubái', hy: 'Դուբայ' }, { city: 'Tiflis', hy: 'Թբիլիսի' }, { city: 'Barcelona', hy: 'Բարսելոնա' }, { city: 'Praga', hy: 'Պրահա' },
];

const TURISTA: DScene = {
  id: 'turista', title: p('Una turista perdida|Մոլորված զբոսաշրջիկ'), name: 'Turista', look: LOOKS.pasajera,
  steps: [
    st(['¡Hola! Perdona, ¿sabes dónde están los aseos?|Բարև։ Ներիր, գիտե՞ս՝ որտեղ են զուգարանները։', 'Perdona, ¿hay aseos en esta planta?|Ներիր, այս հարկում զուգարաններ կա՞ն։'],
      ['Sí, están en la primera planta. Sube por la escalera mecánica.|Այո, առաջին հարկում են։ Բարձրացիր շարժասանդուղքով։', 'Están arriba, en la primera planta.|Վերևում են՝ առաջին հարկում։'],
      [['Sí, me gusta Madrid.|Այո, Մադրիդը դուր է գալիս։', 'Ah… ¡qué bien! Pero, ¿y los aseos?|Ա՜… ինչ լավ է։ Բայց իսկ զուգարաննե՞րը։'], ['Son las diez.|Ժամը տասն է։', 'Gracias, pero no pregunto la hora, ja, ja. ¿Los aseos?|Շնորհակալություն, բայց ժամը չեմ հարցնում, հա-հա։ Զուգարաննե՞րը։']],
      { kw: [['planta', 'arriba', 'escalera']] }),
    st(['¡Muchas gracias! ¿Tú también viajas hoy?|Շատ շնորհակալություն։ Դու էլ ես այսօր ճամփորդո՞ւմ։'],
      ['Sí, viajo a Madrid. ¡Buen viaje!|Այո, մեկնում եմ Մադրիդ։ Բարի ճանապարհ։', 'Sí, a Madrid. ¡Que te vaya bien!|Այո, Մադրիդ։ Հաջողություն։'],
      [['No, soy un avión.|Ոչ, ես ինքնաթիռ եմ։', 'Ja, ja, ¡qué divertida! ¿Viajas o no?|Հա-հա, ինչ զվարճալի ես։ Ճամփորդո՞ւմ ես, թե՞ ոչ։']], { kw: [['madrid', 'si']] }),
  ],
};
const PILOTO: DScene = {
  id: 'piloto', title: p('El piloto simpático|Համակրելի օդաչուն'), name: 'Piloto', look: { ...LOOKS.guardia, top: '#ffffff', hat: 'pilot', hatColor: '#2c2266', beard: false },
  steps: [
    st(['¡Hola! Soy el piloto del vuelo a Madrid. ¿Viajas con nosotros?|Բարև։ Ես Մադրիդի չվերթի օդաչուն եմ։ Մեզ հե՞տ ես ճամփորդում։'],
      ['¡Sí! Mi vuelo es el AV 2027.|Այո։ Իմ չվերթը AV 2027-ն է։', 'Sí, voy a Madrid con ustedes.|Այո, ձեզ հետ գնում եմ Մադրիդ։'],
      [['No, voy en bicicleta.|Ոչ, հեծանիվով եմ գնում։', '¿En bicicleta a Madrid? ¡Está muy lejos! Ja, ja.|Հեծանիվո՞վ Մադրիդ։ Շատ հեռու է։ Հա-հա։']], { kw: [['si', 'madrid', '2027']] }),
    st(['¡Genial! El vuelo dura cinco horas. ¿Te gusta volar?|Հիանալի է։ Թռիչքը տևում է հինգ ժամ։ Թռչել սիրո՞ւմ ես։'],
      ['¡Me encanta! Sobre todo mirar las nubes.|Շատ եմ սիրում։ Հատկապես ամպերին նայել։', 'Un poco, estoy nerviosa.|Մի քիչ, նյարդայնանում եմ։'],
      [['Me gusta la sopa.|Ապուր եմ սիրում։', 'A mí también, pero ¿y volar? ¿Te gusta?|Ես էլ, բայց իսկ թռչե՞լը։ Դուր է գալի՞ս։']]),
  ],
};
const NINO: DScene = {
  id: 'nino', title: p('En el mirador|Դիտահրապարակում'), name: 'Niño', look: LOOKS.nino,
  steps: [
    st(['¡Mira, mira! ¡Un avión grande! ¿Es tu avión?|Նայի՛ր, նայի՛ր։ Մեծ ինքնաթիռ։ Քո ինքնաթի՞ռն է։'],
      ['¡Quizás! Mi avión es morado y blanco.|Գուցե։ Իմ ինքնաթիռը մանուշակագույն և սպիտակ է։', 'No sé. Mi avión va a Madrid.|Չգիտեմ։ Իմ ինքնաթիռը գնում է Մադրիդ։'],
      [['Es mi gato.|Իմ կատուն է։', '¿Un gato? ¡Es un avión! Ja, ja, ja.|Կատո՞ւ։ Ինքնաթիռ է։ Հա-հա-հա։']]),
    st(['¡Cuando sea mayor, quiero ser piloto!|Երբ մեծանամ, ուզում եմ օդաչու դառնալ։'],
      ['¡Qué bien! Vas a ser un piloto estupendo.|Ինչ լավ է։ Հիանալի օդաչու ես լինելու։', '¡Yo también quiero pilotar un avión!|Ես էլ եմ ուզում ինքնաթիռ վարել։'],
      [['Tengo frío.|Մրսում եմ։', '¿Frío? ¡Ponte la chaqueta! Ja, ja.|Մրսո՞ւմ ես։ Բաճկոնդ հագիր։ Հա-հա։']]),
  ],
};

function sign(id: string, es: string, hy: string, cx: number, cy: number, extra: any = {}): Ent {
  return { id, x: cx - 50, y: cy - 15, w: 100, h: 30, label: { es, hy }, sign: { cx, cy, ...extra }, z: -1 };
}

export function Hall() {
  const { prog, set, complete, learn } = useGame();
  const { go, params } = useNav();
  const ref = useRef<WorldHandle>(null);
  const [dlg, setDlg] = useState<{ scene: DScene; onDone: () => void; vars?: any } | null>(null);
  const [msg, setMsg] = useState<{ t: L; who: string } | null>(null);
  const [board, setBoard] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [banner, setBanner] = useState<L | null>(null);
  const progRef = useRef(prog); progRef.current = prog;
  const b = useMemo(() => ensureBoarding(prog), []); // eslint-disable-line
  useEffect(() => { if (!prog.boarding) set((pp) => ({ ...pp, boarding: b })); }, []); // eslint-disable-line

  const speak = (who: string, t: L) => { setMsg({ who, t }); if (progRef.current.settings.autoSpeak) say(t.es); learn(t); };
  const flash = (t: L) => { setBanner(t); say(t.es); setTimeout(() => setBanner(null), 2200); };

  const flights = useMemo(() => {
    const ds = DESTS.slice(0, 7);
    const rows = ds.map((d, i) => ({ time: ['09:50', '10:05', '10:20', '10:55', '11:30', '11:45', '12:10'][i], dest: d, fl: ['AF', 'AZ', 'A3', 'OS', 'EK', 'GE', 'VY'][i] + (100 + i * 37), counter: [1, 2, 3, 4, 5, 6, 7, 8].filter((c) => c !== b.counter)[i] ?? 8, gate: 'A' + (i + 2), status: i === 2 ? 'delay' : i === 5 ? 'board' : 'ok' }));
    rows.splice(3, 0, { time: b.time, dest: { city: 'Madrid', hy: 'Մադրիդ' }, fl: b.flight, counter: b.counter, gate: b.gate, status: prog.level === 3 ? 'delay' : 'ok' });
    return rows;
  }, [b, prog.level]);

  const def: WorldDef = useMemo(() => {
    const ents: Ent[] = [];
    const blockedPt = (x: number, y: number) => WALLS.some((r) => inter(r, x - 8, y - 6, 16, 6));
    // signs
    ents.push(
      sign('s-ent', 'ENTRADA', 'ՄՈՒՏՔ', 190, 1360, { bg: '#2bd9c4' }),
      sign('s-fac', 'FACTURACIÓN', 'ԳՐԱՆՑՈՒՄ', 900, 520, { size: 20, icon: '🧳' }),
      sign('s-inf', 'INFORMACIÓN', 'ՏԵՂԵԿԱՏՈՒ', 470, 625, { bg: '#4fa3ff', fg: '#fff', icon: 'ℹ️' }),
      sign('s-lle', 'LLEGADAS', 'ԺԱՄԱՆՈՒՄՆԵՐ', 900, 1360, { bg: '#ff8fb0', icon: '🛬' }),
      sign('s-sal', 'SALIDAS', 'ՄԵԿՆՈՒՄՆԵՐ', 315, 655, { bg: '#ffd23f', icon: '🛫', size: 18 }),
      sign('s-equ', 'EQUIPAJE', 'ՈՒՂԵԲԵՌ', 1180, 760, { bg: '#a24bd6', fg: '#fff', icon: '🧳' }),
      sign('s-seg', 'SEGURIDAD', 'ԱՆՎՏԱՆԳՈՒԹՅՈՒՆ', 1320, 820, { bg: '#ff5b7f', fg: '#fff', icon: '🛃', size: 18 }),
      sign('s-pas', 'CONTROL DE PASAPORTES', 'ԱՆՁՆԱԳՐԱՅԻՆ ՍՏՈՒԳՈՒՄ', 1740, 820, { bg: '#7b4fd6', fg: '#fff', icon: '🛂' }),
      sign('s-pue', 'PUERTA DE EMBARQUE B1–B20 →', 'ՆՍՏԵՑՄԱՆ ԴԱՐՊԱՍ B1–B20', 2800, 800, { bg: '#ffd23f', size: 18 }),
      sign('s-caf', 'CAFETERÍA', 'ՍՐՃԱՐԱՆ', 2030, 500, { bg: '#ff8c5a', fg: '#fff', icon: '☕' }),
      sign('s-tie', 'TIENDA', 'ԽԱՆՈՒԹ', 2390, 500, { bg: '#2bd9c4', icon: '🛍️' }),
      sign('s-ase', 'ASEOS', 'ԶՈՒԳԱՐԱՆՆԵՐ', 2690, 500, { bg: '#4fa3ff', fg: '#fff', icon: '🚻' }),
      sign('s-asc', 'ASCENSOR', 'ՎԵՐԵԼԱԿ', 1170, 470, { bg: '#fff', icon: '🛗' }),
      sign('s-esc', 'ESCALERA MECÁNICA', 'ՇԱՐԺԱՍԱՆԴՈՒՂՔ', 110, 470, { bg: '#fff', size: 13 }),
      sign('s-pl1', 'PRIMERA PLANTA · MIRADOR', 'ԱՌԱՋԻՆ ՀԱՐԿ · ԴԻՏԱՀՐԱՊԱՐԱԿ', 650, 90, { bg: '#ff6fb5', fg: '#fff' }),
      sign('s-rec', 'TIENDA DE RECUERDOS', 'ՀՈՒՇԱՆՎԵՐՆԵՐԻ ԽԱՆՈՒԹ', 550, 220, { bg: '#ffd23f', size: 13 }),
      sign('s-as2', 'ASEOS', 'ԶՈՒԳԱՐԱՆՆԵՐ', 885, 220, { bg: '#4fa3ff', fg: '#fff', icon: '🚻', size: 13 }),
      sign('s-asc2', 'ASCENSOR', 'ՎԵՐԵԼԱԿ', 1170, 240, { bg: '#fff', icon: '🛗', size: 13 }),
      sign('s-esc2', 'BAJAR · PLANTA BAJA', 'ԻՋՆԵԼ · ԱՌԱՋԻՆ ՀԱՐԿ', 110, 240, { bg: '#fff', size: 12 }),
    );
    // departure board
    ents.push({
      id: 'board', x: 200, y: 480, w: 230, h: 60, solid: true, act: () => { setBoard(true); sfx.play('ding'); }, actText: 'Mirar el panel|Նայել ցուցատախտակին', reach: 60,
      draw: (ctx, t) => {
        ctx.fillStyle = '#2a1650'; rr(ctx, 200, 482, 230, 120, 10); ctx.fill();
        ctx.fillStyle = '#ffd23f'; ctx.font = `700 11px ${FONT}`; ctx.textAlign = 'left';
        for (let i = 0; i < 6; i++) {
          const r = flights[i];
          ctx.fillStyle = r.dest.city === 'Madrid' ? '#ff9ad5' : '#ffd23f';
          ctx.fillText(r.time, 210, 500 + i * 17); ctx.fillText(r.dest.city, 250, 500 + i * 17); ctx.fillText(String(r.counter), 322, 500 + i * 17); ctx.fillText(r.status === 'delay' ? 'RETRASADO' : r.status === 'board' ? 'EMBARQUE' : 'A TIEMPO', 340, 500 + i * 17);
        }
        if (Math.sin(t * 3) > 0) { ctx.fillStyle = '#2bd9c4'; ctx.fillRect(210, 590, 16, 4); }
        ctx.fillStyle = '#5a3a8a'; ctx.fillRect(240, 602, 10, 30); ctx.fillRect(380, 602, 10, 30);
      },
      z: 640,
    });
    // info desk
    ents.push(npc('info-npc', 470, 668, LOOKS.info));
    ents.push({
      id: 'info', x: 400, y: 680, w: 140, h: 50, solid: true, reach: 46, actText: 'Hablar con el empleado|Խոսել աշխատակցի հետ',
      act: () => setDlg({ scene: INFO, vars: boardingVars(b, prog.kg), onDone: () => complete('info', 40, 10) }),
      draw: (ctx) => { shadow(ctx, 470, 732, 80, 10); ctx.fillStyle = '#4fa3ff'; rr(ctx, 400, 680, 140, 50, 10); ctx.fill(); ctx.fillStyle = '#bfe3ff'; rr(ctx, 400, 676, 140, 12, 6); ctx.fill(); textAt(ctx, 'i', 470, 710, 26, '#fff'); },
    });
    // counters
    for (let i = 0; i < 8; i++) {
      const n = i + 1, x = 560 + i * 86;
      const mine = n === b.counter;
      const fl = flights.find((f) => f.counter === n && f.dest.city !== 'Madrid') ?? flights[0];
      const look = { ...LOOKS.empleada, hair: ['#7a3e1d', '#222', '#c58a3a', '#5a2a2a'][i % 4], hairStyle: (['bun', 'pony', 'short', 'bun'] as const)[i % 4], skirt: i % 2 === 0 };
      ents.push(npc('cn' + n, x + 38, 596, look));
      ents.push({
        id: 'counter' + n, x, y: 600, w: 76, h: 54, solid: true, reach: 40, actText: `Mostrador ${n}|Վաճառասեղան ${n}`,
        act: () => {
          const P = progRef.current;
          if (mine) {
            if (P.done.checkin) speak('Empleada', { es: 'Ya tiene su tarjeta de embarque. Ahora vaya al control de seguridad, a la derecha.', hy: 'Արդեն ունեք նստեցման կտրոնը։ Հիմա գնացեք անվտանգության ստուգման՝ աջ կողմում։' });
            else { if (!P.done.info) complete('info', 20, 5); go('checkin'); }
          } else speak('Empleada', { es: `Lo siento, este mostrador es para el vuelo a ${fl.dest.city}. Para Madrid, vaya al mostrador ${b.counter}.`, hy: `Ցավում եմ, այս վաճառասեղանը ${fl.dest.hy}ի չվերթի համար է։ Մադրիդի համար գնացեք ${b.counter} վաճառասեղան։` });
        },
        draw: (ctx, t) => {
          shadow(ctx, x + 38, 656, 40, 6);
          ctx.fillStyle = '#7b4fd6'; rr(ctx, x, 604, 76, 50, 8); ctx.fill();
          ctx.fillStyle = '#e9dcff'; rr(ctx, x - 2, 600, 80, 12, 5); ctx.fill();
          ctx.fillStyle = '#fff'; rr(ctx, x + 22, 620, 32, 22, 6); ctx.fill();
          textAt(ctx, String(n), x + 38, 632, 16, '#7b4fd6');
          ctx.fillStyle = '#2a1650'; rr(ctx, x + 6, 601, 64, 12, 4); ctx.fill();
          textAt(ctx, mine ? 'MADRID' : fl.dest.city.toUpperCase(), x + 38, 607.5, 9, mine ? '#ff9ad5' : '#ffd23f');
          // belt
          ctx.fillStyle = '#555'; ctx.fillRect(x + 64, 612, 16, 40);
          ctx.fillStyle = '#888'; for (let k = 0; k < 4; k++) ctx.fillRect(x + 64, 614 + ((t * 30 + k * 10) % 40), 16, 2);
        },
      });
    }
    // escalators & elevators
    const escDraw = (x: number, y: number, up: boolean) => (ctx: CanvasRenderingContext2D, t: number) => {
      ctx.fillStyle = '#c9b3ff'; rr(ctx, x, y, 100, 60, 8); ctx.fill();
      ctx.fillStyle = '#8a6bd6'; for (let k = 0; k < 6; k++) { const yy = y + ((t * 25 * (up ? -1 : 1) + k * 10) % 60 + 60) % 60; ctx.fillRect(x + 10, y + yy - y, 80, 4); }
      ctx.fillStyle = '#2a1650'; ctx.fillRect(x, y, 8, 60); ctx.fillRect(x + 92, y, 8, 60);
      textAt(ctx, up ? '⬆' : '⬇', x + 50, y + 30, 22, '#fff');
    };
    ents.push({ id: 'esc', x: 60, y: 485, w: 100, h: 60, solid: true, reach: 40, actText: 'Subir ⬆|Բարձրանալ', act: () => { sfx.play('whoosh'); ref.current?.teleport(110, 345, 0); flash({ es: 'Primera planta', hy: 'Առաջին հարկ (վերևի)' }); }, draw: escDraw(60, 485, true) });
    ents.push({ id: 'esc2', x: 60, y: 260, w: 100, h: 60, solid: true, reach: 40, actText: 'Bajar ⬇|Իջնել', act: () => { sfx.play('whoosh'); ref.current?.teleport(110, 575, 0); flash({ es: 'Planta baja', hy: 'Ներքևի հարկ' }); }, draw: escDraw(60, 260, false) });
    const elDraw = (x: number, y: number) => (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = '#9aa4c9'; rr(ctx, x, y, 100, 56, 6); ctx.fill();
      ctx.fillStyle = '#dfe6ff'; ctx.fillRect(x + 8, y + 6, 40, 50); ctx.fillRect(x + 52, y + 6, 40, 50);
      ctx.fillStyle = '#ff6fb5'; ctx.beginPath(); ctx.arc(x + 96, y + 28, 4, 0, 7); ctx.fill();
    };
    ents.push({ id: 'asc', x: 1120, y: 482, w: 100, h: 56, solid: true, reach: 40, actText: 'Ascensor ⬆|Վերելակ՝ վերև', act: () => { sfx.play('ding'); ref.current?.teleport(1170, 345, 0); flash({ es: 'Primera planta. Las puertas se abren.', hy: 'Առաջին հարկ։ Դռները բացվում են։' }); }, draw: elDraw(1120, 482) });
    ents.push({ id: 'asc2', x: 1120, y: 255, w: 100, h: 56, solid: true, reach: 40, actText: 'Ascensor ⬇|Վերելակ՝ ներքև', act: () => { sfx.play('ding'); ref.current?.teleport(1170, 575, 0); flash({ es: 'Planta baja.', hy: 'Ներքևի հարկ։' }); }, draw: elDraw(1120, 255) });
    // upper floor shop & toilets
    ents.push({ id: 'recuerdos', x: 430, y: 120, w: 240, h: 80, solid: true, reach: 40, actText: 'Entrar en la tienda|Մտնել խանութ', act: () => go('cafe', { shop: 'recuerdos' }),
      draw: (ctx) => { ctx.fillStyle = '#ffe9a8'; rr(ctx, 430, 100, 240, 100, 10); ctx.fill(); ctx.fillStyle = '#ff8fb0'; for (let k = 0; k < 8; k++) ctx.fillRect(430 + k * 30, 100, 15, 14); textAt(ctx, '🎁 🧸 🏺 🍫', 550, 160, 22); } });
    ents.push({ id: 'aseo1', x: 820, y: 120, w: 130, h: 80, solid: true, reach: 40, actText: 'Aseos|Զուգարան', act: () => speak('Gayane', { es: 'Me lavo las manos. ¡Qué limpio está el aseo!', hy: 'Լվանում եմ ձեռքերս։ Ինչ մաքուր է զուգարանը։' }),
      draw: (ctx) => { ctx.fillStyle = '#bfe3ff'; rr(ctx, 820, 100, 130, 100, 10); ctx.fill(); textAt(ctx, '🚺 🚹', 885, 160, 24); } });
    ents.push(npc('nino', 760, 300, LOOKS.nino, () => setDlg({ scene: NINO, onDone: () => {} }), 'Hablar con el niño|Խոսել երեխայի հետ', 3));
    ents.push(bench('ub1', 300, 300), bench('ub2', 900, 300), plant('up1', 1000, 150), plant('up2', 250, 150));
    // landside NPCs
    ents.push(npc('turista', 760, 1000, LOOKS.pasajera, () => setDlg({ scene: TURISTA, onDone: () => {} }), 'Hablar con la turista|Խոսել զբոսաշրջիկի հետ', 0));
    ents.push(npc('limpieza', 1050, 1180, { ...LOOKS.camarero, top: '#2bd9c4', scarf: undefined }, () => speak('Limpiadora', { es: '¡Cuidado, el suelo está mojado! Camine despacio, por favor.', hy: 'Զգույշ, հատակը թաց է։ Քայլեք դանդաղ, խնդրում եմ։' }), 'Hablar|Խոսել', 1));
    ents.push({ id: 'wet', x: 980, y: 1200, w: 30, h: 10, flat: true, draw: (ctx) => { ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(985, 1215); ctx.lineTo(995, 1185); ctx.lineTo(1005, 1215); ctx.fill(); textAt(ctx, '!', 995, 1204, 12, '#2a1650'); } });
    ents.push({ id: 'llegadas', x: 820, y: 1370, w: 160, h: 30, solid: true, reach: 40, actText: 'Leer|Կարդալ', act: () => speak('Cartel', { es: 'Por aquí salen los pasajeros que llegan. Usted sale hoy: vaya a SALIDAS.', hy: 'Այստեղից դուրս են գալիս ժամանող ուղևորները։ Դուք այսօր մեկնում եք՝ գնացեք ՄԵԿՆՈՒՄՆԵՐ։' }), draw: (ctx) => { ctx.fillStyle = '#ffc9dd'; ctx.fillRect(820, 1380, 160, 20); } });
    ents.push(plant('p1', 480, 1100), plant('p2', 1240, 900), bench('b1', 450, 1220), bench('b2', 650, 1220));
    // security
    ents.push({ id: 'xray', x: 1345, y: 870, w: 70, h: 40, solid: true, draw: (ctx, t) => { ctx.fillStyle = '#9aa4c9'; rr(ctx, 1345, 860, 70, 50, 8); ctx.fill(); ctx.fillStyle = '#2a1650'; ctx.fillRect(1352, 872, 56, 26); ctx.fillStyle = `rgba(43,217,196,${0.4 + Math.sin(t * 4) * 0.3})`; ctx.fillRect(1352, 872, 56, 26); } });
    ents.push(npc('guardia', 1385, 960, LOOKS.guardia, undefined, '', 1));
    ents.push({
      id: 'seg', x: 1296, y: 850, w: 48, h: 150, solid: true, reach: 50, actText: 'Control de seguridad|Անվտանգության ստուգում',
      hidden: !!prog.done.seguridad,
      act: () => {
        if (!progRef.current.done.checkin) speak('Guardia', { es: 'Primero tiene que facturar y tener su tarjeta de embarque. La facturación está a la izquierda.', hy: 'Նախ պետք է գրանցվեք և ունենաք նստեցման կտրոն։ Գրանցումը ձախ կողմում է։' });
        else go('security');
      },
      draw: (ctx, t) => {
        ctx.fillStyle = 'rgba(255,91,127,.25)'; ctx.fillRect(1296, 850, 48, 150);
        ctx.strokeStyle = '#ff5b7f'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(1300, 860); ctx.lineTo(1300, 1000); ctx.moveTo(1340, 860); ctx.lineTo(1340, 1000); ctx.moveTo(1300, 860); ctx.lineTo(1340, 860); ctx.stroke();
        ctx.fillStyle = Math.sin(t * 4) > 0 ? '#ff5b7f' : '#2bd9c4'; ctx.beginPath(); ctx.arc(1320, 848, 6, 0, 7); ctx.fill();
      },
    });
    // passport
    for (let k = 0; k < 2; k++) {
      const by = k ? 1010 : 790;
      ents.push({ id: 'booth' + k, x: 1766, y: by, w: 70, h: 50, solid: true, draw: (ctx) => { shadow(ctx, 1800, by + 52, 40, 6); ctx.fillStyle = '#7b4fd6'; rr(ctx, 1766, by, 70, 50, 8); ctx.fill(); ctx.fillStyle = 'rgba(191,233,255,.8)'; ctx.fillRect(1772, by - 30, 58, 32); } });
    }
    ents.push(npc('poli', 1800, 905, LOOKS.policia, undefined, '', 1));
    ents.push({
      id: 'pas', x: 1716, y: 850, w: 48, h: 150, solid: true, reach: 50, actText: 'Control de pasaportes|Անձնագրային ստուգում', hidden: !!prog.done.pasaporte,
      act: () => setDlg({ scene: PASAPORTE, onDone: () => { complete('pasaporte', 50, 10); passHide(); ref.current?.teleport(1850, 930, 2); } }),
      draw: (ctx) => { ctx.fillStyle = 'rgba(123,79,214,.25)'; ctx.fillRect(1716, 850, 48, 150); ctx.fillStyle = '#7b4fd6'; ctx.fillRect(1716, 920, 48, 8); },
    });
    // airside shops
    ents.push({ id: 'cafe', x: 1890, y: 520, w: 280, h: 80, solid: true, reach: 44, actText: 'Entrar en la cafetería|Մտնել սրճարան', act: () => go('cafe', { shop: 'cafe' }),
      draw: (ctx) => { ctx.fillStyle = '#ffcfa8'; rr(ctx, 1890, 480, 280, 120, 10); ctx.fill(); ctx.fillStyle = '#ff8c5a'; for (let k = 0; k < 9; k++) ctx.fillRect(1890 + k * 31, 480, 16, 16); textAt(ctx, '☕ 🥐 🥪 🧃', 2030, 550, 24); ctx.fillStyle = '#8a4b2a'; rr(ctx, 1910, 580, 240, 20, 6); ctx.fill(); } });
    ents.push(npc('camarero', 2080, 572, LOOKS.camarero));
    ents.push({ id: 'tienda', x: 2250, y: 520, w: 280, h: 80, solid: true, reach: 44, actText: 'Entrar en la tienda|Մտնել խանութ', act: () => go('cafe', { shop: 'tienda' }),
      draw: (ctx) => { ctx.fillStyle = '#c4f5ee'; rr(ctx, 2250, 480, 280, 120, 10); ctx.fill(); ctx.fillStyle = '#2bd9c4'; for (let k = 0; k < 9; k++) ctx.fillRect(2250 + k * 31, 480, 16, 16); textAt(ctx, '🧴 🕶️ 🍫 📰 💧', 2390, 550, 22); } });
    ents.push({ id: 'aseo2', x: 2620, y: 520, w: 140, h: 70, solid: true, reach: 40, actText: 'Aseos|Զուգարան', act: () => speak('Cartel', { es: 'Aseos: ocupado. Espere un momento, por favor.', hy: 'Զուգարաններ՝ զբաղված է։ Սպասեք մի պահ, խնդրում ենք։' }),
      draw: (ctx) => { ctx.fillStyle = '#bfe3ff'; rr(ctx, 2620, 480, 140, 110, 10); ctx.fill(); textAt(ctx, '🚺 🚹', 2690, 545, 24); } });
    ents.push(npc('piloto', 2300, 900, PILOTO.look, () => setDlg({ scene: PILOTO, onDone: () => {} }), 'Hablar con el piloto|Խոսել օդաչուի հետ', 0));
    ents.push(bench('b3', 1900, 1150), bench('b4', 2100, 1150), bench('b5', 2400, 1150), bench('b6', 2600, 1150), plant('p3', 2250, 1160), plant('p4', 1880, 760), plant('p5', 2560, 760));
    ents.push({
      id: 'gates', x: 2950, y: 840, w: 50, h: 170, solid: true, reach: 50, actText: 'Ir a las puertas|Դեպի դարպասներ',
      act: () => { if (!progRef.current.done.pasaporte) return; go(progRef.current.done.laberinto ? 'boarding' : 'maze'); },
      draw: (ctx, t) => { ctx.fillStyle = '#ffd23f'; ctx.fillRect(2950, 840, 50, 170); ctx.fillStyle = '#2a1650'; for (let k = 0; k < 3; k++) textAt(ctx, '➜', 2975, 880 + k * 45 + Math.sin(t * 4 + k) * 3, 26, '#7b4fd6'); },
    });
    // walkers
    for (let i = 0; i < 7; i++) ents.push(walker('w' + i, { x: 200, y: 780, w: 1050, h: 440 }, blockedPt));
    for (let i = 0; i < 6; i++) ents.push(walker('wa' + i, { x: 1820, y: 700, w: 1050, h: 380 }, blockedPt));
    for (let i = 0; i < 2; i++) ents.push(walker('wu' + i, { x: 200, y: 330, w: 900, h: 30 }, blockedPt));

    const passHide = () => { const e = ents.find((x) => x.id === 'pas'); if (e) e.hidden = true; };

    let start = { x: 200, y: 1290, dir: 3 as 0 | 1 | 2 | 3 };
    const at = params?.at ?? params?.focus;
    if (at === 'checkin') start = { x: 560 + (b.counter - 1) * 86 + 38, y: 688, dir: 3 };
    else if (at === 'afterCheckin') start = { x: 560 + (b.counter - 1) * 86 + 38, y: 720, dir: 0 };
    else if (at === 'security') start = prog.done.checkin ? { x: 1268, y: 930, dir: 2 } : start;
    else if (at === 'afterSecurity' || (at === 'passport' && prog.done.seguridad)) start = { x: 1450, y: 930, dir: 2 };
    else if (['cafe', 'tienda'].includes(at) && prog.done.pasaporte) start = { x: at === 'cafe' ? 2030 : 2390, y: 680, dir: 0 };
    else if (at === 'recuerdos') start = { x: 550, y: 250, dir: 0 };
    else if (at === 'gates' || (prog.done.pasaporte && !at)) start = { x: 2850, y: 930, dir: 1 };
    else if (prog.done.seguridad && !at) start = { x: 1450, y: 930, dir: 2 };

    return {
      w: W, h: H, bg: '#2a1650', look: prog.outfit, suitcase: prog.done.checkin ? null : '#ff6fb5', backpack: '#7b4fd6',
      start,
      blocked: (x, y, w, h) => WALLS.some((r) => inter(r, x, y, w, h)),
      ents,
      drawFloor: (ctx, t) => {
        const T = 80;
        for (let ty = 0; ty < H; ty += T) for (let tx = 0; tx < W; tx += T) {
          const up = ty < 380, air = tx >= 1340;
          if (up && tx >= 1300) continue;
          const odd = ((tx + ty) / T) % 2;
          ctx.fillStyle = up ? (odd ? '#ffe3f0' : '#fff0f7') : air ? (tx >= 1760 ? (odd ? '#dcf1ff' : '#eaf7ff') : (odd ? '#ffe0ea' : '#fff0f4')) : (odd ? '#ede0ff' : '#f6efff');
          ctx.fillRect(tx, ty, T, T);
        }
        // void
        ctx.fillStyle = '#3a2470'; ctx.fillRect(1300, 0, 1700, 480);
        for (let i = 0; i < 20; i++) { ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(1320 + i * 85, 40, 40, 300); }
        // top windows of upper floor (mirador)
        const grd = ctx.createLinearGradient(0, 0, 0, 70); grd.addColorStop(0, '#8fd3ff'); grd.addColorStop(1, '#ffd6ec');
        ctx.fillStyle = grd; ctx.fillRect(0, 0, 1300, 70);
        ctx.fillStyle = '#9ad'; ctx.fillRect(0, 56, 1300, 14);
        const px = ((t * 60) % 1700) - 200; textAt(ctx, '✈', px, 30, 34, '#fff');
        textAt(ctx, '✈', 1300 - (((t * 35) % 1600) - 150), 50, 22, '#ffffffcc');
        ctx.fillStyle = '#fff'; for (let i = 0; i < 14; i++) ctx.fillRect(i * 100, 0, 6, 70);
        // railing between floors
        ctx.fillStyle = '#c9b3ff'; ctx.fillRect(0, 380, 1300, 100);
        ctx.fillStyle = 'rgba(191,233,255,.7)'; ctx.fillRect(0, 380, 1300, 26);
        ctx.fillStyle = '#7b4fd6'; ctx.fillRect(0, 378, 1300, 5);
        // main top wall with windows
        ctx.fillStyle = '#b79cf5'; ctx.fillRect(0, 406, 3000, 74);
        const g2 = ctx.createLinearGradient(0, 410, 0, 470); g2.addColorStop(0, '#9bdcff'); g2.addColorStop(1, '#ffe1f1');
        ctx.fillStyle = g2;
        for (let i = 0; i < 30; i++) ctx.fillRect(1340 + i * 56, 418, 46, 50);
        // security / passport walls
        ctx.fillStyle = '#c9b3ff';
        for (const r of WALLS.slice(3)) { ctx.fillRect(r.x, r.y, r.w, r.h); ctx.fillStyle = '#a58ce8'; ctx.fillRect(r.x, r.y + r.h - 8, r.w, 8); ctx.fillStyle = '#c9b3ff'; }
        // entrance doors
        ctx.fillStyle = '#bfe9ff'; ctx.fillRect(90, 1380, 200, 20);
        ctx.fillStyle = '#7b4fd6'; ctx.fillRect(188, 1380, 4, 20);
        // carpet path to gates
        ctx.fillStyle = 'rgba(255,111,181,.12)'; ctx.fillRect(1760, 880, 1240, 90);
      },
    };
  }, []); // eslint-disable-line

  const objective: L = !prog.done.info ? { es: 'Habla con el empleado de INFORMACIÓN.', hy: 'Խոսիր ՏԵՂԵԿԱՏՈՒԻ աշխատակցի հետ։' }
    : !prog.done.checkin ? { es: `Busca el mostrador de facturación número ${b.counter}.`, hy: `Գտիր ${b.counter} համարի գրանցման վաճառասեղանը։` }
      : !prog.done.seguridad ? { es: 'Ve al control de SEGURIDAD, a la derecha.', hy: 'Գնա ԱՆՎՏԱՆԳՈՒԹՅԱՆ ստուգման՝ աջ կողմում։' }
        : !prog.done.pasaporte ? { es: 'Pasa el CONTROL DE PASAPORTES.', hy: 'Անցիր ԱՆՁՆԱԳՐԱՅԻՆ ՍՏՈՒԳՈՒՄԸ։' }
          : !prog.done.laberinto ? { es: `Busca la PUERTA DE EMBARQUE ${b.gate}. Sigue todo recto hacia la derecha.`, hy: `Գտիր ${b.gate} ՆՍՏԵՑՄԱՆ ԴԱՐՊԱՍԸ։ Գնա ուղիղ դեպի աջ։` }
            : !prog.done.cafe ? { es: 'Tienes tiempo: compra algo en la CAFETERÍA o en la TIENDA.', hy: 'Ժամանակ ունես՝ գնիր ինչ-որ բան ՍՐՃԱՐԱՆՈՒՄ կամ ԽԱՆՈՒԹՈՒՄ։' }
              : { es: 'Ve a la puerta de embarque. ¡Tu avión te espera!', hy: 'Գնա նստեցման դարպաս։ Ինքնաթիռդ քեզ սպասում է։' };

  return (
    <div className="screen world-screen">
      <TopBar title={<Es t={{ es: 'Aeropuerto de Zvartnots', hy: 'Զվարթնոց օդանավակայան' }} voice={false} />}>
        <button className="btn ghost sm" onClick={() => setMapOpen(true)}>🧭 <Tr s="Plano|Հատակագիծ" size="sm" /></button>
      </TopBar>
      <World def={def} ref={ref} paused={!!dlg || board || mapOpen}>
        <div className="objective"><span>🎯</span><Es t={objective} size="md" /></div>
        {banner && <div className="banner pop"><Es t={banner} size="lg" /></div>}
        {msg && (
          <div className="speech pop" onClick={() => setMsg(null)}>
            <b><Who n={msg.who} />:</b> <Es t={msg.t} size="lg" /> <button className="btn ghost sm" onClick={() => setMsg(null)}>✕</button>
          </div>
        )}
        <div className="controls-hint">WASD / ⬆⬇⬅➡ · Shift · E</div>
      </World>
      {dlg && (
        <div className="overlay-full">
          <Dialogue scene={dlg.scene} initVars={dlg.vars ?? boardingVars(b, prog.kg)} onExit={() => setDlg(null)} onDone={() => { dlg.onDone(); setDlg(null); }} />
        </div>
      )}
      {board && (
        <Modal onClose={() => setBoard(false)} wide>
          <DepartureBoard rows={flights} />
        </Modal>
      )}
      {mapOpen && <Modal onClose={() => setMapOpen(false)} wide><TerminalMap getPos={() => ref.current?.player} /></Modal>}
    </div>
  );
}

const STATUS: Record<string, L> = {
  ok: { es: 'A tiempo', hy: 'Ժամանակին' },
  delay: { es: 'Retrasado', hy: 'Ուշանում է' },
  board: { es: 'Embarcando', hy: 'Նստեցում' },
};
function DepartureBoard({ rows }: { rows: any[] }) {
  return (
    <div className="dboard">
      <h3><Es t={{ es: 'SALIDAS', hy: 'ՄԵԿՆՈՒՄՆԵՐ' }} size="xl" /></h3>
      <div className="db-row head">
        <Es t={{ es: 'Hora', hy: 'Ժամ' }} voice={false} size="sm" /><Es t={{ es: 'Destino', hy: 'Ուղղություն' }} voice={false} size="sm" /><Es t={{ es: 'Vuelo', hy: 'Չվերթ' }} voice={false} size="sm" />
        <Es t={{ es: 'Mostrador', hy: 'Վաճառասեղան' }} voice={false} size="sm" /><Es t={{ es: 'Puerta', hy: 'Դարպաս' }} voice={false} size="sm" /><Es t={{ es: 'Estado', hy: 'Կարգավիճակ' }} voice={false} size="sm" />
      </div>
      {rows.map((r) => (
        <div key={r.fl} className={`db-row ${r.dest.city === 'Madrid' ? 'mine' : ''}`}>
          <span>{r.time}</span><Es t={{ es: r.dest.city, hy: r.dest.hy }} voice size="sm" /><span>{r.fl}</span><span>{r.counter}</span><span>{r.gate}</span>
          <Es t={STATUS[r.status]} size="sm" voice={false} className={r.status} />
        </div>
      ))}
      <Note s="Busca tu vuelo a Madrid y recuerda el número del mostrador.|Գտիր քո չվերթը Մադրիդ և հիշիր վաճառասեղանի համարը։" />
    </div>
  );
}

function TerminalMap({ getPos }: { getPos: () => any }) {
  const cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = cv.current!; const ctx = c.getContext('2d')!;
    let raf = 0;
    const draw = (now: number) => {
      const s = c.width / W;
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.save(); ctx.scale(s, s);
      const zones: [number, number, number, number, string, string][] = [
        [0, 70, 1300, 310, '#ffd6ec', 'PRIMERA PLANTA'], [0, 480, 1300, 920, '#e7d9ff', 'FACTURACIÓN · SALIDAS'], [1340, 480, 380, 920, '#ffd6e2', 'SEGURIDAD'],
        [1760, 480, 1240, 920, '#d7efff', 'ZONA DE EMBARQUE'],
      ];
      for (const z of zones) { ctx.fillStyle = z[4]; ctx.fillRect(z[0], z[1], z[2], z[3]); ctx.fillStyle = '#5a2a8a'; ctx.font = `700 60px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(z[5], z[0] + z[2] / 2, z[1] + z[3] / 2); }
      const pts: [number, number, string][] = [[470, 705, 'ℹ️'], [900, 630, '🧳'], [110, 515, '⬆'], [1170, 510, '🛗'], [1320, 925, '🛃'], [1740, 925, '🛂'], [2030, 560, '☕'], [2390, 560, '🛍️'], [2690, 550, '🚻'], [2970, 925, '🛫'], [550, 160, '🎁'], [190, 1380, '🚪']];
      ctx.font = '70px sans-serif'; for (const q of pts) ctx.fillText(q[2], q[0], q[1] + 20);
      const P = getPos();
      if (P) { ctx.fillStyle = '#ff2f8f'; ctx.beginPath(); ctx.arc(P.x, P.y - 20, 30 + Math.sin(now / 200) * 8, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.stroke(); }
      ctx.restore();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="tmap">
      <h3><Es t={{ es: 'Plano del terminal', hy: 'Տերմինալի հատակագիծը' }} size="lg" /></h3>
      <canvas ref={cv} width={900} height={420} />
      <Note s="🔴 Estás aquí.|🔴 Դու այստեղ ես։" />
    </div>
  );
}
