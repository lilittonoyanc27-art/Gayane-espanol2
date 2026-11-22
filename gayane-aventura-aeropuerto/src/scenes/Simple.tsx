import { useGame } from '../store';
import { useNav } from '../nav';
import { Dialogue } from '../ui/Dialogue';
import { LLEGADA, TAXI } from '../data/scenes';

export function TaxiScene() {
  const { complete } = useGame();
  const { go } = useNav();
  return (
    <Dialogue scene={TAXI} bg="bg-taxi" onExit={() => go('map')}
      prop={<div className="taxi-car"><div className="taxi-body">TAXI</div><div className="wheel a" /><div className="wheel b" /></div>}
      onDone={(r) => { complete('taxi', 40 + r.points, 10); go('hall'); }} />
  );
}

export function ArrivalScene() {
  const { complete } = useGame();
  const { go } = useNav();
  return (
    <Dialogue scene={LLEGADA} bg="bg-arrival" onExit={() => go('map')}
      prop={<div className="booth-prop">🛂 <b>CONTROL DE PASAPORTES</b></div>}
      onDone={(r) => { complete('llegada', 40 + r.points, 12); go('baggage'); }} />
  );
}
