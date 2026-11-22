import { useMemo, useState } from 'react';
import { useGame } from '../store';
import { useNav } from '../nav';
import { Dialogue } from '../ui/Dialogue';
import { CHECKIN } from '../data/scenes';
import { boardingVars, ensureBoarding } from '../boardingInfo';
import { BoardingPass } from '../ui/BoardingPass';
import { Modal } from '../ui/Hud';
import { Es, Tr } from '../ui/Es';
import type { Boarding } from '../store';

export function Checkin() {
  const { prog, set, complete } = useGame();
  const { go } = useNav();
  const b0 = useMemo(() => ensureBoarding(prog), []); // eslint-disable-line
  const [pass, setPass] = useState<Boarding | null>(null);
  return (
    <>
      <Dialogue scene={CHECKIN} bg="bg-checkin" initVars={boardingVars(b0, prog.kg)} onExit={() => go('hall', { at: 'checkin' })}
        prop={<div className="counter-prop"><div className="screen-sign">Mostrador {b0.counter} · MADRID AV 2027</div><div className="scale">⚖️ {prog.kg} kg</div><div className="belt-mini"><span>🧳</span></div></div>}
        onDone={(r) => {
          const win = r.vars.window !== '0';
          const letter = win ? (Math.random() < 0.5 ? 'A' : 'F') : (Math.random() < 0.5 ? 'C' : 'D');
          const b: Boarding = { ...b0, letter, seat: `${b0.row}${letter}`, window: win, kg: prog.kg };
          set((p) => ({ ...p, boarding: b }));
          complete('checkin', 60 + r.points, 15);
          setPass(b);
        }} />
      {pass && (
        <Modal onClose={() => go('hall', { at: 'afterCheckin' })}>
          <Es t={{ es: '¡Ya tienes tu tarjeta de embarque!', hy: 'Արդեն ունես նստեցման կտրոնդ։' }} size="lg" block />
          <BoardingPass b={pass} />
          <Es t={{ es: `Ahora ve al control de seguridad. Tu puerta es la ${pass.gate}.`, hy: `Հիմա գնա անվտանգության ստուգման։ Քո դարպասը ${pass.gate}-ն է։` }} block />
          <button className="btn primary big" onClick={() => go('hall', { at: 'afterCheckin' })}><Tr s="Continuar|Շարունակել" /> ▶</button>
        </Modal>
      )}
    </>
  );
}
