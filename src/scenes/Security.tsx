import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../store';
import { useNav } from '../nav';
import { TopBar } from '../ui/Hud';
import { Es, Note, Tr } from '../ui/Es';
import { Person, LOOKS } from '../ui/Person';
import { Dialogue } from '../ui/Dialogue';
import { SEGURIDAD_BEEP } from '../data/scenes';
import { say, sfx } from '../audio';
import type { L } from '../types';
import { pick } from '../types';

type It = { id: string; icon: string; t: L; elec?: boolean };
const ITEMS: It[] = [
  { id: 'mochila', icon: '🎒', t: { es: 'la mochila', hy: 'ուսապարկը' } },
  { id: 'chaqueta', icon: '🧥', t: { es: 'la chaqueta', hy: 'բաճկոնը' } },
  { id: 'telefono', icon: '📱', t: { es: 'el teléfono', hy: 'հեռախոսը' }, elec: true },
  { id: 'portatil', icon: '💻', t: { es: 'el portátil', hy: 'նոութբուքը' }, elec: true },
  { id: 'llaves', icon: '🔑', t: { es: 'las llaves', hy: 'բանալիները' } },
  { id: 'monedas', icon: '🪙', t: { es: 'las monedas', hy: 'մետաղադրամները' } },
  { id: 'botella', icon: '🧴', t: { es: 'la botella de agua', hy: 'ջրի շիշը' } },
  { id: 'cinturon', icon: '🎗️', t: { es: 'el cinturón', hy: 'գոտին' } },
  { id: 'reloj', icon: '⌚', t: { es: 'el reloj', hy: 'ժամացույցը' } },
  { id: 'libro', icon: '📚', t: { es: 'el libro', hy: 'գիրքը' } },
  { id: 'bocadillo', icon: '🥪', t: { es: 'el bocadillo', hy: 'բուտերբրոդը' } },
  { id: 'pasaporte', icon: '📕', t: { es: 'el pasaporte', hy: 'անձնագիրը' } },
];
type Cmd = { t: L[]; need?: string[]; action?: 'esperar' | 'pasar' | 'recoger'; lv?: number; beep?: boolean };
const CMDS: Cmd[] = [
  { t: [{ es: 'Coloque su mochila en la bandeja.', hy: 'Ուսապարկը դրեք սկուտեղի մեջ։' }, { es: 'Ponga la mochila en la bandeja, por favor.', hy: 'Դրեք ուսապարկը սկուտեղի մեջ, խնդրում եմ։' }], need: ['mochila'] },
  { t: [{ es: 'Quítese la chaqueta y póngala en la bandeja.', hy: 'Հանեք բաճկոնը և դրեք սկուտեղի մեջ։' }, { es: 'La chaqueta también, por favor.', hy: 'Բաճկոնը նույնպես, խնդրում եմ։' }], need: ['chaqueta'] },
  { t: [{ es: 'Saque los dispositivos electrónicos, por favor.', hy: 'Հանեք էլեկտրոնային սարքերը, խնդրում եմ։' }, { es: 'El portátil y el teléfono, fuera de la mochila.', hy: 'Նոութբուքը և հեռախոսը՝ ուսապարկից դուրս։' }], need: ['telefono', 'portatil'] },
  { t: [{ es: 'Ponga las llaves y las monedas en la bandeja.', hy: 'Բանալիները և մետաղադրամները դրեք սկուտեղի մեջ։' }], need: ['llaves', 'monedas'], lv: 2 },
  { t: [{ es: 'Saque la botella de agua. No se permiten líquidos.', hy: 'Հանեք ջրի շիշը։ Հեղուկներ չի թույլատրվում։' }], need: ['botella'], lv: 2 },
  { t: [{ es: 'Quítese el cinturón, por favor.', hy: 'Հանեք գոտին, խնդրում եմ։' }], need: ['cinturon'], lv: 3 },
  { t: [{ es: 'Espere un momento.', hy: 'Սպասեք մի պահ։' }, { es: 'Un momento, espere aquí, por favor.', hy: 'Մի պահ, սպասեք այստեղ, խնդրում եմ։' }], action: 'esperar' },
  { t: [{ es: 'Puede pasar.', hy: 'Կարող եք անցնել։' }, { es: 'Pase por el arco, por favor.', hy: 'Անցեք շրջանակով, խնդրում եմ։' }], action: 'pasar', beep: true },
  { t: [{ es: 'Recoja sus cosas. ¡Buen viaje!', hy: 'Վերցրեք ձեր իրերը։ Բարի ճանապարհ։' }, { es: 'Ya puede recoger sus cosas.', hy: 'Արդեն կարող եք վերցնել ձեր իրերը։' }], action: 'recoger' },
];

export function Security() {
  const { prog, complete, learn } = useGame();
  const { go } = useNav();
  const cmds = useMemo(() => CMDS.filter((c) => (c.lv ?? 1) <= prog.level), [prog.level]);
  const [ci, setCi] = useState(0);
  const [line, setLine] = useState<L>(pick(cmds[0].t));
  const [inTray, setInTray] = useState<string[]>([]);
  const [trays, setTrays] = useState<string[][]>([]);
  const [miss, setMiss] = useState(0);
  const [stepMiss, setStepMiss] = useState(0);
  const [gpos, setGpos] = useState<'before' | 'arch' | 'after'>('before');
  const [alarm, setAlarm] = useState<'none' | 'red' | 'green'>('none');
  const [beepDlg, setBeepDlg] = useState(false);
  const [needWatch, setNeedWatch] = useState(false);
  const [finished, setFinished] = useState(false);
  const [waitOk, setWaitOk] = useState(false);
  const cmd = cmds[ci];
  const officer = (l: L) => { setLine(l); say(l.es, 0.85); };
  useEffect(() => { say(line.es, 0.85); /* eslint-disable-next-line */ }, []);

  const next = () => {
    const n = ci + 1; setStepMiss(0);
    if (n >= cmds.length) return;
    setCi(n); officer(pick(cmds[n].t));
  };
  const wrong = (why?: L) => {
    sfx.play('bad'); setMiss((m) => m + 1); setStepMiss((m) => m + 1);
    officer(why ?? { es: `No, señorita. ${line.es}`, hy: `Ոչ, օրիորդ։ ${line.hy}` });
  };
  const used = new Set(trays.flat().concat(inTray));
  const clickItem = (it: It) => {
    if (finished) return;
    if (needWatch) {
      if (it.id === 'reloj') { sfx.play('ok'); setNeedWatch(false); setInTray((t) => [...t, 'reloj']); officer({ es: 'Gracias. Ahora pase otra vez por el arco.', hy: 'Շնորհակալություն։ Հիմա նորից անցեք շրջանակով։' }); setGpos('before'); setAlarm('none'); }
      else wrong({ es: 'No, el reloj, por favor. Quítese el reloj.', hy: 'Ոչ, ժամացույցը, խնդրում եմ։ Հանեք ժամացույցը։' });
      return;
    }
    if (!cmd.need) return wrong({ es: 'No, ahora no. Escuche bien: ' + line.es, hy: 'Ոչ, հիմա ոչ։ Ուշադիր լսեք՝ ' + line.hy });
    if (!cmd.need.includes(it.id)) return wrong(it.id === 'pasaporte' ? { es: 'El pasaporte quédeselo, por favor. ' + line.es, hy: 'Անձնագիրը պահեք ձեզ մոտ, խնդրում եմ։ ' + line.hy } : undefined);
    sfx.play('ok'); learn(it.t);
    const nt = [...inTray, it.id];
    setInTray(nt);
    if (cmd.need.every((n) => nt.includes(n))) {
      setTimeout(() => { setTrays((tr) => [...tr, nt]); setInTray([]); sfx.play('whoosh'); next(); }, 500);
    }
  };
  const action = (a: 'esperar' | 'pasar' | 'recoger') => {
    if (finished) return;
    if (cmd.action !== a) {
      if (a === 'pasar') return wrong({ es: '¡Espere, por favor! Todavía no puede pasar.', hy: 'Սպասեք, խնդրում եմ։ Դեռ չեք կարող անցնել։' });
      return wrong();
    }
    if (a === 'esperar') {
      if (waitOk) return;
      setWaitOk(true); sfx.play('ok');
      setTimeout(() => { setWaitOk(false); next(); }, 1800);
    } else if (a === 'pasar') {
      setGpos('arch');
      setTimeout(() => {
        if (cmd.beep && prog.level === 3 && !inTray.includes('reloj') && !trays.flat().includes('reloj')) {
          setAlarm('red'); sfx.play('beep'); setBeepDlg(true); return;
        }
        setAlarm('green'); sfx.play('ok');
        setTimeout(() => { setGpos('after'); next(); }, 900);
      }, 900);
    } else {
      sfx.play('coin'); setTrays([]); setFinished(true);
      complete('seguridad', 50 + Math.max(0, 30 - miss * 5), 12);
    }
  };

  const showHy = stepMiss >= 2;
  return (
    <div className="screen security-screen">
      <TopBar title={<Es t={{ es: 'Control de seguridad', hy: 'Անվտանգության ստուգում' }} voice={false} />} back="hall" />
      <div className="sec-stage">
        <div className="sec-officer">
          <Person look={LOOKS.guardia} size={170} talking />
          <div className="sec-bubble pop" key={line.es}>
            <Es t={line} size="lg" />
            {showHy && <Note s="💡 Pulsa la frase para ver la traducción.|💡 Սեղմիր նախադասությանը՝ թարգմանությունը տեսնելու համար։" />}
          </div>
        </div>
        <div className="belt">
          <div className="xray"><span>RAYOS X</span></div>
          <div className="belt-track" />
          <div className="trays">
            {trays.map((t, i) => <div key={i} className="tray moved" style={{ animationDelay: `${i * 0.05}s` }}>{t.map((id) => ITEMS.find((x) => x.id === id)!.icon)}</div>)}
            <div className="tray current">{inTray.map((id) => <span key={id} className="drop-in">{ITEMS.find((x) => x.id === id)!.icon}</span>)}<small>la bandeja</small></div>
          </div>
        </div>
        <div className={`arch ${alarm}`}>
          <div className="arch-frame"><div className="arch-light" /></div>
          <div className={`sec-girl ${gpos}`}><Person look={prog.outfit} size={130} /></div>
        </div>
      </div>
      {!finished ? (
        <div className="sec-panel">
          <div className="sec-items">
            {ITEMS.filter((i) => !used.has(i.id)).map((it) => (
              <div key={it.id} className="sec-item" role="button" onClick={() => clickItem(it)}>
                <span className="si-icon">{it.icon}</span>
                <Es t={it.t} size="sm" voice={false} />
              </div>
            ))}
          </div>
          <div className="sec-actions">
            <button className={`btn soft ${waitOk ? 'pulse' : ''}`} onClick={() => action('esperar')}>✋ <Tr s="Esperar|Սպասել" /></button>
            <button className="btn soft" onClick={() => action('pasar')}>🚶 <Tr s="Pasar por el arco|Անցնել շրջանակով" /></button>
            <button className="btn soft" onClick={() => action('recoger')}>🧺 <Tr s="Recoger las cosas|Վերցնել իրերը" /></button>
          </div>
          <Note s={`Escucha la instrucción del agente y obedece: toca la cosa o la acción correcta. (${ci + 1}/${cmds.length})|Լսիր աշխատակցի հրահանգը և կատարիր՝ սեղմելով ճիշտ իրը կամ գործողությունը։ (${ci + 1}/${cmds.length})`} className="center" />
        </div>
      ) : (
        <div className="sec-panel done pop">
          <Es t={{ es: '¡Control de seguridad superado!', hy: 'Անվտանգության ստուգումն անցած է։' }} size="xl" block />
          <Note s={`Errores: ${miss}|Սխալներ՝ ${miss}`} className="center" />
          <button className="btn primary big glow" onClick={() => go('hall', { at: 'afterSecurity' })}><Tr s="Continuar|Շարունակել" /> ▶</button>
        </div>
      )}
      {beepDlg && (
        <div className="overlay-full">
          <Dialogue scene={SEGURIDAD_BEEP} onExit={() => setBeepDlg(false)} onDone={() => {
            setBeepDlg(false); setNeedWatch(true); setGpos('before'); setAlarm('none');
            officer({ es: 'Quítese el reloj, por favor.', hy: 'Հանեք ժամացույցը, խնդրում եմ։' });
          }} />
        </div>
      )}
    </div>
  );
}
