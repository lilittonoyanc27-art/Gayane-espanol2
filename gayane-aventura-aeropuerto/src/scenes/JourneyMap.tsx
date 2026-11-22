import { useGame } from '../store';
import { useNav } from '../nav';
import { MISSIONS, isUnlocked, nextMission } from '../data/missions';
import { Es, Tr } from '../ui/Es';
import { TopBar } from '../ui/Hud';
import { sfx } from '../audio';

export function JourneyMap() {
  const { prog } = useGame();
  const { go } = useNav();
  const next = nextMission(prog.done);
  const n = MISSIONS.filter((m) => prog.done[m.id]).length;
  return (
    <div className="screen map-screen">
      <TopBar title={<Es t={{ es: 'El mapa del viaje', hy: 'Ճամփորդության քարտեզը' }} voice={false} />} back="start" />
      <div className="journey-progress"><div style={{ width: `${(n / MISSIONS.length) * 100}%` }} /></div>
      <div className="journey">
        <div className="city-tag evn">🇦🇲 <Es t={{ es: 'Ereván', hy: 'Երևան' }} voice={false} /></div>
        <div className="path">
          {MISSIONS.map((m, i) => {
            const un = isUnlocked(i, prog.done);
            const done = !!prog.done[m.id];
            return (
              <div key={m.id} className={`node ${done ? 'done' : ''} ${un ? 'open' : 'locked'} ${next?.id === m.id ? 'next' : ''} ${i % 2 ? 'right' : 'left'}`}>
                <button className="node-btn" disabled={!un} onClick={() => { sfx.play('click'); go(m.scene, m.params); }}>
                  <span className="node-icon">{un ? m.icon : '🔒'}</span>
                  {done && <span className="node-check">✓</span>}
                </button>
                <div className="node-label">
                  <small>{i + 1}.</small> <Es t={m.t} size="sm" voice={false} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="city-tag mad">🇪🇸 <Es t={{ es: 'Madrid', hy: 'Մադրիդ' }} voice={false} /></div>
      </div>
      <div className="map-extra">
        <button className="btn soft" onClick={() => go('pilot')}>🛩️ <Tr s="Pilota tu avión|Վարիր քո ինքնաթիռը" /></button>
        <button className="btn soft" onClick={() => go('flight')} disabled={!prog.done.embarque}>💬 <Tr s="Diálogos en el avión|Զրույցներ ինքնաթիռում" /></button>
        <button className="btn soft" onClick={() => go('passport')}>📕 <Tr s="Pasaporte|Անձնագիր" /></button>
        <button className="btn soft" onClick={() => go('dict')}>📖 <Tr s="Diccionario|Բառարան" /> ({Object.keys(prog.words).length})</button>
        <button className="btn soft" onClick={() => go('wardrobe')}>👗 <Tr s="Armario|Զգեստապահարան" /></button>
      </div>
    </div>
  );
}
