import { useMemo, useRef, useState } from 'react';
import { World, WorldDef, WorldHandle, Ent } from '../engine/World';
import { bench, npc, plant, textAt, walker } from '../engine/props';
import { rr, shadow } from '../engine/draw';
import { useGame } from '../store';
import { useNav } from '../nav';
import { TopBar } from '../ui/Hud';
import { Es, Who } from '../ui/Es';
import { Dialogue } from '../ui/Dialogue';
import { LOOKS } from '../ui/Person';
import { PREGUNTAR, TAXI_MADRID, METRO, HOTEL } from '../data/scenes';
import type { DScene } from '../data/dialog';
import { say, sfx } from '../audio';
import type { L } from '../types';

const W = 2600, H = 1400;
type R = { x: number; y: number; w: number; h: number };
const WALLS: R[] = [
  { x: 0, y: 0, w: W, h: 330 }, // buildings row
  { x: 1240, y: 330, w: 120, h: 1070 }, // river
  { x: 0, y: 1300, w: W, h: 100 },
];
const inter = (a: R, x: number, y: number, w: number, h: number) => x < a.x + a.w && x + w > a.x && y < a.y + a.h && y + h > a.y;

function sign(id: string, es: string, hy: string, cx: number, cy: number, extra: any = {}): Ent {
  return { id, x: cx - 50, y: cy - 15, w: 100, h: 30, label: { es, hy }, sign: { cx, cy, ...extra }, z: -1 };
}

export function Madrid() {
  const { prog, set, complete, achieve, learn } = useGame();
  const { go } = useNav();
  const ref = useRef<WorldHandle>(null);
  const [dlg, setDlg] = useState<{ scene: DScene; onDone: () => void } | null>(null);
  const [msg, setMsg] = useState<{ who: string; t: L } | null>(null);
  const [asked, setAsked] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [banner, setBanner] = useState<L | null>(null);
  const speak = (who: string, t: L) => { setMsg({ who, t }); say(t.es); learn(t); };
  const travel = (how: 'taxi' | 'metro') => {
    sfx.play('whoosh');
    const t = how === 'taxi' ? { es: 'El taxi atraviesa Madrid… ¡Ya estás en la calle de las Flores!', hy: 'Տաքսին անցնում է Մադրիդով… Դու արդեն Ծաղիկների փողոցում ես։' } : { es: 'Línea 8, después línea 10… ¡Sales del metro en el centro!', hy: '8-րդ գիծ, հետո 10-րդ գիծ… Դուրս ես գալիս մետրոյից կենտրոնում։' };
    setBanner(t); say(t.es); setTimeout(() => setBanner(null), 3500);
    ref.current?.teleport(1480, 820, 2); setArrived(true);
  };
  const def: WorldDef = useMemo(() => {
    const ents: Ent[] = [];
    const bp = (x: number, y: number) => WALLS.some((r) => inter(r, x - 8, y - 6, 16, 6));
    ents.push(
      sign('m-sal', 'AEROPUERTO · SALIDA', 'ՕԴԱՆԱՎԱԿԱՅԱՆ · ԵԼՔ', 160, 380, { bg: '#7b4fd6', fg: '#fff' }),
      sign('m-taxi', 'PARADA DE TAXIS', 'ՏԱՔՍԻՆԵՐԻ ԿԱՆԳԱՌ', 930, 420, { bg: '#ffffff', icon: '🚕' }),
      sign('m-metro', 'METRO', 'ՄԵՏՐՈ', 700, 960, { bg: '#e8344e', fg: '#fff', icon: 'Ⓜ️', size: 18 }),
      sign('m-kiosk', 'QUIOSCO', 'ԿՐՊԱԿ', 1040, 760, { bg: '#2bd9c4' }),
      sign('m-rio', 'RÍO MANZANARES', 'ՄԱՆՍԱՆԱՐԵՍ ԳԵՏ', 1300, 1000, { bg: '#4fa3ff', fg: '#fff', size: 12 }),
      sign('m-calle', 'CALLE DE LAS FLORES', 'ԾԱՂԻԿՆԵՐԻ ՓՈՂՈՑ', 1700, 380, { bg: '#ffd23f' }),
      sign('m-hotel', 'HOTEL LAS FLORES ★★★', 'ԼԱՍ ՖԼՈՐԵՍ ՀՅՈՒՐԱՆՈՑ', 2100, 300, { bg: '#ff6fb5', fg: '#fff', size: 18 }),
      sign('m-cafe', 'CHURRERÍA', 'ՉՈՒՐՈՍԻ ՍՐՃԱՐԱՆ', 2400, 420, { bg: '#ff8c5a', fg: '#fff', size: 13 }),
    );
    // fountain
    ents.push({ id: 'fuente', x: 520, y: 640, w: 170, h: 110, solid: true, draw: (ctx, t) => {
      shadow(ctx, 605, 752, 92, 16); ctx.fillStyle = '#c9b3ff'; ctx.beginPath(); ctx.ellipse(605, 700, 88, 50, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#7fd0ff'; ctx.beginPath(); ctx.ellipse(605, 696, 74, 40, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#e9dcff'; ctx.fillRect(598, 630, 14, 66);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(605 + Math.cos(a) * (20 + ((t * 30 + i * 7) % 40)), 640 + ((t * 60 + i * 13) % 50), 3, 0, 7); ctx.fill(); }
    } });
    // taxis
    for (let k = 0; k < 3; k++) {
      const x = 820 + k * 130;
      ents.push({ id: 'taxi' + k, x, y: 470, w: 110, h: 50, solid: true, reach: 40, actText: 'Coger el taxi|Նստել տաքսի',
        act: () => setDlg({ scene: TAXI_MADRID, onDone: () => travel('taxi') }),
        draw: (ctx) => { shadow(ctx, x + 55, 522, 58, 8); ctx.fillStyle = '#fff'; rr(ctx, x, 474, 110, 42, 12); ctx.fill(); ctx.fillStyle = '#e8344e'; ctx.fillRect(x, 494, 110, 6); ctx.fillStyle = '#bfe9ff'; rr(ctx, x + 22, 460, 64, 22, 8); ctx.fill(); ctx.fillStyle = '#2bbf6a'; ctx.beginPath(); ctx.arc(x + 54, 456, 5, 0, 7); ctx.fill(); ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(x + 24, 518, 9, 0, 7); ctx.arc(x + 86, 518, 9, 0, 7); ctx.fill(); } });
    }
    ents.push(npc('taxista', 1260 - 60, 560, { ...LOOKS.taxista, top: '#fff', hatColor: '#e8344e' }, () => setDlg({ scene: TAXI_MADRID, onDone: () => travel('taxi') }), 'Hablar con el taxista|Խոսել վարորդի հետ', 1));
    // metro entrance
    ents.push({ id: 'metro', x: 640, y: 1000, w: 120, h: 70, solid: true, reach: 40, actText: 'Bajar al metro|Իջնել մետրո', act: () => setDlg({ scene: METRO, onDone: () => travel('metro') }),
      draw: (ctx) => { ctx.fillStyle = '#5a5a6a'; rr(ctx, 640, 1000, 120, 70, 8); ctx.fill(); ctx.fillStyle = '#2a2a35'; ctx.fillRect(656, 1014, 88, 50); ctx.fillStyle = '#9aa'; for (let i = 0; i < 5; i++) ctx.fillRect(656, 1018 + i * 10, 88, 3); ctx.fillStyle = '#e8344e'; ctx.fillRect(636, 996, 128, 8); } });
    // kiosk
    ents.push({ id: 'kiosk', x: 990, y: 790, w: 100, h: 60, solid: true, reach: 40, actText: 'Hablar con el quiosquero|Խոսել վաճառողի հետ', act: () => speak('Quiosquero', { es: '¡Hola! ¿Quiere un mapa de Madrid? Es gratis. El centro está al otro lado del río.', hy: 'Բարև։ Մադրիդի քարտեզ կուզե՞ք։ Անվճար է։ Կենտրոնը գետի մյուս կողմում է։' }),
      draw: (ctx) => { shadow(ctx, 1040, 852, 55, 8); ctx.fillStyle = '#2bbf8a'; rr(ctx, 990, 780, 100, 70, 8); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(998, 796, 84, 30); textAt(ctx, '📰 🗺️ 🍬', 1040, 811, 16); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(980, 784); ctx.lineTo(1100, 784); ctx.lineTo(1090, 770); ctx.lineTo(990, 770); ctx.fill(); } });
    // señora
    ents.push(npc('senora', 440, 900, LOOKS.abuela, () => setDlg({ scene: PREGUNTAR, onDone: () => setAsked(true) }), 'Preguntar el camino|Հարցնել ճանապարհը', 2));
    // hotel side
    ents.push({ id: 'hotel', x: 1980, y: 330, w: 240, h: 60, solid: true, reach: 50, actText: 'Entrar en el hotel|Մտնել հյուրանոց',
      act: () => setDlg({ scene: HOTEL, onDone: () => { complete('madrid', 120, 30); achieve('viajera'); set((p) => ({ ...p })); go('passport', { final: true }); } }),
      draw: (ctx) => { ctx.fillStyle = '#ff9ad5'; ctx.fillRect(2060, 330, 80, 60); ctx.fillStyle = '#7b4fd6'; rr(ctx, 2072, 336, 56, 54, 8); ctx.fill(); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(2118, 364, 4, 0, 7); ctx.fill(); } });
    ents.push(npc('portero', 2170, 400, { ...LOOKS.camarero, top: '#7b4fd6', hat: 'cap', hatColor: '#7b4fd6' }, () => speak('Portero', { es: '¡Bienvenida! La recepción está dentro, todo recto.', hy: 'Բարի գալուստ։ Ընդունարանը ներսում է՝ ուղիղ։' }), 'Hablar|Խոսել', 0));
    ents.push({ id: 'churros', x: 2330, y: 330, w: 160, h: 50, solid: true, reach: 40, actText: 'Pedir churros|Պատվիրել չուրոս', act: () => speak('Camarera', { es: '¡Hola! ¿Unos churros con chocolate? Son cuatro euros. ¡Están riquísimos!', hy: 'Բարև։ Չուրոս շոկոլադով կուզե՞ք։ Չորս եվրո է։ Շատ համեղ են։' }),
      draw: (ctx) => { for (let k = 0; k < 3; k++) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(2360 + k * 50, 470, 18, 0, 7); ctx.fill(); ctx.fillStyle = '#ff8c5a'; ctx.beginPath(); ctx.moveTo(2340 + k * 50, 452); ctx.lineTo(2380 + k * 50, 452); ctx.lineTo(2360 + k * 50, 432); ctx.fill(); } } });
    ents.push(npc('musico', 1800, 1000, { ...LOOKS.pasajero, hat: 'beret', hatColor: '#e8344e' }, () => speak('Músico', { es: '¡Hola, guapa! Esta canción se llama «Madrid, Madrid». ¿Te gusta?', hy: 'Բարև, սիրունս։ Այս երգը կոչվում է «Մադրիդ, Մադրիդ»։ Դուր է գալի՞ս։' }), 'Escuchar al músico|Լսել երաժշտին', 0));
    ents.push(bench('mb1', 300, 1120), bench('mb2', 1600, 640), bench('mb3', 2200, 1100), plant('mp1', 200, 1000), plant('mp2', 1100, 1100), plant('mp3', 1500, 1150), plant('mp4', 2400, 900), plant('mp5', 1950, 800));
    for (let i = 0; i < 5; i++) ents.push(walker('mw' + i, { x: 150, y: 600, w: 1000, h: 650 }, bp));
    for (let i = 0; i < 5; i++) ents.push(walker('mh' + i, { x: 1420, y: 560, w: 1100, h: 650 }, bp));
    return {
      w: W, h: H, bg: '#2a1650', look: prog.outfit, suitcase: '#ff6fb5', backpack: '#7b4fd6', start: { x: 180, y: 560, dir: 0 },
      ents,
      blocked: (x, y, w, h) => WALLS.some((r) => inter(r, x, y, w, h)),
      drawFloor: (ctx, t) => {
        ctx.fillStyle = '#f1e6d6'; ctx.fillRect(0, 330, W, 970);
        for (let y = 330; y < 1300; y += 40) for (let x = (y / 40) % 2 ? 0 : 20; x < W; x += 40) { ctx.fillStyle = 'rgba(200,170,140,.18)'; ctx.fillRect(x, y, 20, 20); }
        // road
        ctx.fillStyle = '#8e8a9e'; ctx.fillRect(0, 1180, W, 100);
        ctx.fillStyle = '#fff'; for (let x = 0; x < W; x += 80) ctx.fillRect(x, 1228, 40, 5);
        const cars = ['#e8344e', '#3f7bf5', '#ffd23f', '#fff'];
        for (let i = 0; i < 4; i++) { const cx = ((t * (90 + i * 25) + i * 700) % (W + 300)) - 150; const cy = 1196 + (i % 2) * 44; ctx.fillStyle = cars[i]; rr(ctx, cx, cy, 90, 32, 10); ctx.fill(); ctx.fillStyle = '#bfe9ff'; rr(ctx, cx + 20, cy + 4, 40, 12, 4); ctx.fill(); }
        // buildings
        const cols = ['#ffd6a8', '#ffc0cb', '#e7d9ff', '#fff2c2', '#c4f5ee'];
        for (let i = 0; i < 26; i++) {
          const x = i * 100; ctx.fillStyle = cols[i % 5]; ctx.fillRect(x, 40 + (i % 3) * 20, 100, 290 - (i % 3) * 20);
          ctx.fillStyle = '#c0785a'; ctx.fillRect(x, 30 + (i % 3) * 20, 100, 14);
          for (let fy = 0; fy < 3; fy++) for (let fx = 0; fx < 3; fx++) { ctx.fillStyle = '#7fb6e0'; ctx.fillRect(x + 12 + fx * 30, 90 + (i % 3) * 14 + fy * 70, 18, 30); ctx.fillStyle = '#5a3a2a'; ctx.fillRect(x + 8 + fx * 30, 122 + (i % 3) * 14 + fy * 70, 26, 3); }
          if (i % 4 === 1) { ctx.fillStyle = '#ff6fb5'; for (let fx = 0; fx < 3; fx++) { ctx.beginPath(); ctx.arc(x + 21 + fx * 30, 120 + (i % 3) * 14, 4, 0, 7); ctx.fill(); } }
        }
        // airport building (left)
        ctx.fillStyle = '#e9dcff'; ctx.fillRect(0, 60, 340, 270); ctx.fillStyle = '#9bdcff'; for (let i = 0; i < 6; i++) ctx.fillRect(14 + i * 54, 120, 40, 180);
        textAt(ctx, 'AEROPUERTO MADRID', 170, 90, 18, '#7b4fd6');
        // hotel facade
        ctx.fillStyle = '#ffe3f0'; ctx.fillRect(1960, 20, 280, 310); ctx.fillStyle = '#ff6fb5'; ctx.fillRect(1960, 20, 280, 18);
        for (let fy = 0; fy < 3; fy++) for (let fx = 0; fx < 5; fx++) { ctx.fillStyle = '#bfe9ff'; ctx.fillRect(1975 + fx * 54, 60 + fy * 80, 30, 46); ctx.fillStyle = '#ff9ad5'; ctx.fillRect(1970 + fx * 54, 106 + fy * 80, 40, 5); }
        // river
        ctx.fillStyle = '#7fd0ff'; ctx.fillRect(1240, 330, 120, 970);
        ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 3; for (let i = 0; i < 12; i++) { const y = 360 + ((i * 80 + t * 30) % 940); ctx.beginPath(); ctx.moveTo(1260, y); ctx.quadraticCurveTo(1300, y - 10, 1340, y); ctx.stroke(); }
        // park on right of river
        ctx.fillStyle = '#c9f2d4'; ctx.fillRect(1380, 900, 300, 220);
        ctx.fillStyle = 'rgba(255,111,181,.5)'; for (let i = 0; i < 30; i++) { ctx.beginPath(); ctx.arc(1400 + (i * 37) % 280, 920 + (i * 53) % 190, 4, 0, 7); ctx.fill(); }
      },
    };
  }, []); // eslint-disable-line

  const objective: L = arrived ? { es: 'Busca el HOTEL LAS FLORES y habla con la recepcionista.', hy: 'Գտիր ԼԱՍ ՖԼՈՐԵՍ ՀՅՈՒՐԱՆՈՑԸ և խոսիր ընդունարանի աշխատակցի հետ։' }
    : !asked ? { es: 'Pregunta a la señora cómo ir al centro: ¿taxi o metro?', hy: 'Հարցրու տիկնոջը՝ ինչպես գնալ կենտրոն՝ տաքսի՞, թե՞ մետրո։' }
      : { es: 'Ve a la PARADA DE TAXIS o al METRO.', hy: 'Գնա ՏԱՔՍԻՆԵՐԻ ԿԱՆԳԱՌ կամ ՄԵՏՐՈ։' };
  return (
    <div className="screen world-screen">
      <TopBar title={<Es t={{ es: 'Una aventura en Madrid', hy: 'Արկած Մադրիդում' }} voice={false} />} />
      <World def={def} ref={ref} paused={!!dlg}>
        <div className="objective"><span>🎯</span><Es t={objective} /></div>
        {banner && <div className="banner pop"><Es t={banner} size="lg" /></div>}
        {msg && <div className="speech pop"><b><Who n={msg.who} />:</b> <Es t={msg.t} size="lg" /><button className="btn ghost sm" onClick={() => setMsg(null)}>✕</button></div>}
      </World>
      {dlg && <div className="overlay-full"><Dialogue scene={dlg.scene} bg="bg-madrid" onExit={() => setDlg(null)} onDone={() => { const f = dlg.onDone; setDlg(null); f(); }} /></div>}
    </div>
  );
}
