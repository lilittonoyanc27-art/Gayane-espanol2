import { useGame, ACHIEVEMENTS } from '../store';
import { useNav } from '../nav';
import { TopBar } from '../ui/Hud';
import { Es, Tr } from '../ui/Es';
import { Person } from '../ui/Person';
import { MISSIONS } from '../data/missions';
import { LEVEL_NAMES } from '../types';

export function PassportScreen() {
  const { prog } = useGame();
  const { go, params } = useNav();
  const final = params?.final || prog.done.madrid;
  return (
    <div className="screen passport-screen">
      <TopBar title={<Es t={{ es: 'Pasaporte de viajera', hy: 'Ճամփորդուհու անձնագիր' }} voice={false} />} back="start" />
      {final && (
        <div className="final-banner pop">
          <div className="confetti">{Array.from({ length: 24 }, (_, i) => <span key={i} style={{ left: `${(i * 4.2) % 100}%`, animationDelay: `${(i % 6) * 0.3}s` }}>{['🎉', '⭐', '💖', '✈️'][i % 4]}</span>)}</div>
          <Es t={{ es: '¡Enhorabuena, Gayane! Has llegado a Madrid.', hy: 'Շնորհավորում ենք, Գայանե։ Դու հասար Մադրիդ։' }} size="xl" block />
        </div>
      )}
      <div className="passport">
        <div className="pp-cover">
          <div className="pp-emblem">✈</div>
          <div className="pp-title"><Es t={{ es: 'PASAPORTE', hy: 'ԱՆՁՆԱԳԻՐ' }} voice={false} size="xl" /></div>
          <div className="pp-sub"><Es t={{ es: 'DE VIAJERA', hy: 'ՃԱՄՓՈՐԴՈՒՀՈՒ' }} voice={false} size="sm" /></div>
                  </div>
        <div className="pp-page">
          <div className="pp-photo"><Person look={prog.outfit} size={150} /></div>
          <div className="pp-data">
            <div><small><Es t={{ es: 'Nombre', hy: 'Անուն' }} size="sm" voice={false} /></small><b>GAYANE</b></div>
            <div><small><Es t={{ es: 'Ruta', hy: 'Երթուղի' }} size="sm" voice={false} /></small><b>EREVÁN → MADRID</b></div>
            <div><small><Es t={{ es: 'Nivel', hy: 'Մակարդակ' }} size="sm" voice={false} /></small><b>{LEVEL_NAMES[prog.level].code} · <Es t={{ es: LEVEL_NAMES[prog.level].es, hy: LEVEL_NAMES[prog.level].hy }} size="md" voice={false} /></b></div>
            <div className="pp-stats"><span>⭐ {prog.score}</span><span>🪙 {Math.round(prog.coins)}</span><span>📖 {Object.keys(prog.words).length}</span><span>🌟 {prog.stars}</span></div>
          </div>
        </div>
        <div className="pp-page stamps">
          <h4><Es t={{ es: 'Sellos', hy: 'Կնիքներ' }} voice={false} /></h4>
          <div className="stamp-grid">
            {MISSIONS.map((m, i) => (
              <div key={m.id} className={`stamp ${prog.done[m.id] ? 'on' : ''}`} style={{ transform: `rotate(${((i * 37) % 24) - 12}deg)` }}>
                <span>{m.icon}</span><Es t={m.t} size="sm" voice={false} />{prog.stamps[m.id] && <em>{prog.stamps[m.id]}</em>}
              </div>
            ))}
          </div>
        </div>
        <div className="pp-page">
          <h4><Es t={{ es: 'Logros', hy: 'Նվաճումներ' }} voice={false} /></h4>
          <div className="ach-grid">
            {Object.entries(ACHIEVEMENTS).map(([id, a]) => (
              <div key={id} className={`ach ${prog.achievements.includes(id) ? 'on' : ''}`}>
                <span>{prog.achievements.includes(id) ? a.icon : '🔒'}</span><Es t={a.t} size="sm" voice={false} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="row center"><button className="btn primary" onClick={() => go('map')}>🗺️ <Tr s="Mapa|Քարտեզ" /></button><button className="btn soft" onClick={() => go('dict')}>📖 <Tr s="Diccionario|Բառարան" /></button></div>
    </div>
  );
}
