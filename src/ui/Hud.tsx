import { useGame } from '../store';
import { useNav } from '../nav';
import { LEVEL_NAMES } from '../types';
import { sfx } from '../audio';
import { Es } from './Es';

export function TopBar({ title, back = 'map', children }: { title?: React.ReactNode; back?: any; children?: React.ReactNode }) {
  const { prog } = useGame();
  const { go } = useNav();
  return (
    <div className="topbar">
      <button className="btn ghost sm" onClick={() => { sfx.play('click'); go(back); }} title="Mapa">🗺️</button>
      <div className="tb-title">{title}</div>
      {children}
      <div className="chips">
        <span className="chip lvl">{LEVEL_NAMES[prog.level].code}</span>
        <span className="chip">⭐ {prog.score}</span>
        <span className="chip">🪙 {prog.coins}</span>
      </div>
    </div>
  );
}

export function Toasts() {
  const { toasts } = useGame();
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className="toast pop">
          <span className="t-icon">{t.icon}</span>
          <div><Es t={t.text} size="md" voice={false} />{t.sub && <div className="t-sub">{t.sub}</div>}</div>
        </div>
      ))}
    </div>
  );
}

export function Modal({ children, onClose, wide = false }: { children: React.ReactNode; onClose?: () => void; wide?: boolean }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className={`modal pop ${wide ? 'wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        {onClose && <button className="modal-x" onClick={onClose}>✕</button>}
        {children}
      </div>
    </div>
  );
}
