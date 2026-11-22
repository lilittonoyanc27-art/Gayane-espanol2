import type { Boarding } from '../store';
import { Es } from './Es';

export function BoardingPass({ b }: { b: Boarding }) {
  return (
    <div className="bpass pop">
      <div className="bp-head"><span>✈ AERO VIOLETA</span><Es t={{ es: 'TARJETA DE EMBARQUE', hy: 'ՆՍՏԵՑՄԱՆ ԿՏՐՈՆ' }} voice={false} size="sm" /></div>
      <div className="bp-body">
        <div className="bp-route"><div><b>EVN</b><small>Ereván</small></div><div className="bp-plane">✈</div><div><b>MAD</b><small>Madrid</small></div></div>
        <div className="bp-grid">
          <div><small><Es t={{ es: 'Pasajera', hy: 'Ուղևոր' }} voice={false} size="sm" /></small><b>GAYANE</b></div>
          <div><small><Es t={{ es: 'Vuelo', hy: 'Չվերթ' }} voice={false} size="sm" /></small><b>{b.flight}</b></div>
          <div><small><Es t={{ es: 'Puerta', hy: 'Դարպաս' }} voice={false} size="sm" /></small><b>{b.gate}</b></div>
          <div><small><Es t={{ es: 'Embarque', hy: 'Նստեցում' }} voice={false} size="sm" /></small><b>{b.time}</b></div>
          <div><small><Es t={{ es: 'Asiento', hy: 'Տեղ' }} voice={false} size="sm" /></small><b>{b.seat}</b></div>
          <div><small><Es t={{ es: 'Fila', hy: 'Շարք' }} voice={false} size="sm" /></small><b>{b.row}</b></div>
        </div>
      </div>
      <div className="bp-stub"><div className="barcode" /></div>
    </div>
  );
}
