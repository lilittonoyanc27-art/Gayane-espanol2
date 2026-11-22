import { useState } from 'react';
import { useGame } from '../store';
import { useNav } from '../nav';
import { TopBar } from '../ui/Hud';
import { Es, Tr } from '../ui/Es';
import { Person, LOOKS } from '../ui/Person';
import { Dialogue, Mode, MODES } from '../ui/Dialogue';
import { FLIGHT, Situation } from '../data/flight';
import { boardingVars, ensureBoarding } from '../boardingInfo';
import { sfx } from '../audio';

const NEED = { 1: 4, 2: 6, 3: 8 } as const;

export function Flight() {
  const { prog, set, complete, achieve, addCoins } = useGame();
  const { go } = useNav();
  const [cur, setCur] = useState<Situation | null>(null);
  const [mode, setMode] = useState<Mode>('choice');
  const b = prog.boarding ?? ensureBoarding(prog);
  const avail = FLIGHT.filter((s) => s.lv <= prog.level);
  const doneN = avail.filter((s) => prog.flightDone.includes(s.id)).length;
  const need = Math.min(NEED[prog.level], avail.length);
  const finish = (s: Situation) => {
    const first = !prog.flightDone.includes(s.id);
    const nd = first ? [...prog.flightDone, s.id] : prog.flightDone;
    set((p) => ({ ...p, flightDone: nd }));
    if (first) addCoins(3);
    if (nd.length >= 10) achieve('conversadora');
    if (nd.length >= 20) achieve('charlatana');
    if (!prog.done.vuelo && avail.filter((x) => nd.includes(x.id)).length >= need) complete('vuelo', 80, 20);
    setCur(null);
  };
  if (cur) return <Dialogue key={cur.id} scene={cur.scene} bg="bg-plane" defaultMode={mode} initVars={boardingVars(b, prog.kg)} onExit={() => setCur(null)} onDone={() => finish(cur)} />;
  return (
    <div className="screen flight-screen">
      <TopBar title={<Es t={{ es: 'En el avión', hy: 'Ինքնաթիռում' }} voice={false} />} />
      <div className="cabin-view">
        <div className="cabin-window"><div className="clouds-move">{[0, 1, 2, 3].map((i) => <span key={i}>☁️</span>)}</div></div>
        <div className="cabin-people">
          <Person look={LOOKS.azafata} size={150} />
          <Person look={prog.outfit} size={130} />
          <Person look={LOOKS.pasajero} size={130} />
        </div>
        <div className="flight-info">
          <div>✈ {b.flight} · EVN → MAD · 💺 {b.seat}</div>
          <div className="fi-bar"><div style={{ width: `${Math.min(100, (doneN / need) * 100)}%` }} /></div>
          <small>{doneN} / {need} — <Es t={{ es: 'conversaciones para llegar a Madrid', hy: 'զրույց՝ Մադրիդ հասնելու համար' }} voice={false} size="sm" /></small>
        </div>
      </div>
      <div className="mode-row">
        <Es t={{ es: 'Modo de respuesta:', hy: 'Պատասխանի ռեժիմ՝' }} size="sm" voice={false} />
        {(['choice', 'build', 'type', 'speak', 'free'] as Mode[]).map((m) => (
          <button key={m} className={`btn sm ${mode === m ? 'primary' : 'ghost'}`} onClick={() => setMode(m)}>
            {MODES.find((x) => x.id === m)!.icon} {MODES.find((x) => x.id === m)!.s.split('|')[0]}
          </button>
        ))}
      </div>
      <div className="situations">
        {FLIGHT.map((s) => {
          const locked = s.lv > prog.level;
          const d = prog.flightDone.includes(s.id);
          return (
            <button key={s.id} className={`sit ${d ? 'done' : ''} ${locked ? 'locked' : ''}`} disabled={locked} onClick={() => { sfx.play('click'); setCur(s); }}>
              <span className="sit-icon">{locked ? '🔒' : s.icon}</span>
              <Es t={s.t} size="sm" voice={false} />
              <small>{s.scene.name}{s.lv > 1 ? ` · ${['', 'A1', 'A2', 'B1'][s.lv]}` : ''}</small>
              {d && <span className="sit-check">✓</span>}
            </button>
          );
        })}
      </div>
      <div className="flight-actions">
        <button className="btn soft" onClick={() => go('pilot')}>🛩️ <Tr s="Pilota tu avión|Վարիր քո ինքնաթիռը" /></button>
        <button className={`btn ${prog.done.vuelo ? 'primary big glow' : 'ghost'}`} disabled={!prog.done.vuelo} onClick={() => go('arrival')}>🛬 <Tr s="Aterrizar en Madrid|Վայրէջք Մադրիդում" /> ▶</button>
      </div>
    </div>
  );
}
