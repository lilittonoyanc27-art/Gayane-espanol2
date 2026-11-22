import { useGame } from '../store';
import { useNav } from '../nav';
import { Person } from '../ui/Person';
import { TopBar } from '../ui/Hud';
import { Es, Tr } from '../ui/Es';
import type { HairStyle, Look } from '../types';
import { sfx } from '../audio';

const TOPS = ['#ff6fb5', '#a24bd6', '#2bd9c4', '#4fa3ff', '#ffd23f', '#ffffff', '#ff8c5a', '#7b4fd6'];
const BOTTOMS = ['#6b5bd6', '#2c3e66', '#ff6fb5', '#ffffff', '#2bb5c9', '#3b2a5a'];
const HAIRS = ['#3b2219', '#1a1110', '#7a3e1d', '#c58a3a', '#5a2a8a'];
const STYLES: { id: HairStyle; hy: string }[] = [{ id: 'long', hy: 'Largo|Երկար' }, { id: 'pony', hy: 'Coleta|Պոչիկ' }, { id: 'bun', hy: 'Moño|Կապոց' }, { id: 'braid', hy: 'Trenza|Հյուս' }, { id: 'short', hy: 'Corto|Կարճ' }];
const HATS: { id: Look['hat']; hy: string }[] = [{ id: 'band', hy: 'Diadema|Մազակալ' }, { id: 'beret', hy: 'Boina|Բերետ' }, { id: 'cap', hy: 'Gorra|Գլխարկ' }, { id: null, hy: 'Nada|Ոչինչ' }];

export function Wardrobe({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void }) {
  const { prog, set } = useGame();
  const { go } = useNav();
  const o = prog.outfit;
  const upd = (k: keyof Look, v: any) => { sfx.play('click'); set((p) => ({ ...p, outfit: { ...p.outfit, [k]: v } })); };
  const Sw = ({ k, list }: { k: keyof Look; list: string[] }) => (
    <div className="swatches">{list.map((c) => <button key={c} className={`sw ${o[k] === c ? 'on' : ''}`} style={{ background: c }} onClick={() => upd(k, c)} />)}</div>
  );
  return (
    <div className={embedded ? 'wardrobe embedded' : 'screen wardrobe'}>
      {!embedded && <TopBar title={<Es t={{ es: 'El armario', hy: 'Զգեստապահարանը' }} voice={false} />} back="start" />}
      <div className="wardrobe-body">
        <div className="mirror"><Person look={o} size={280} wave bag /></div>
        <div className="wardrobe-opts">
          <Es t={{ es: '¿Qué ropa te pones para el viaje?', hy: 'Ի՞նչ հագուստ ես հագնում ճամփորդության համար։' }} size="lg" block />
          <h4><Es t={{ es: 'La camiseta', hy: 'Շապիկը' }} voice={false} size="sm" /></h4><Sw k="top" list={TOPS} />
          <h4><Es t={{ es: 'La falda o los pantalones', hy: 'Կիսաշրջազգեստը կամ տաբատը' }} voice={false} size="sm" /></h4>
          <div className="row"><button className={`btn sm ${o.skirt ? 'primary' : 'ghost'}`} onClick={() => upd('skirt', true)}><Tr s="la falda|կիսաշրջազգեստը" size="sm" /></button><button className={`btn sm ${!o.skirt ? 'primary' : 'ghost'}`} onClick={() => upd('skirt', false)}><Tr s="los pantalones|տաբատը" size="sm" /></button></div>
          <Sw k="bottom" list={BOTTOMS} />
          <h4><Es t={{ es: 'El pelo', hy: 'Մազերը' }} voice={false} size="sm" /></h4><Sw k="hair" list={HAIRS} />
          <div className="row wrap">{STYLES.map((s) => <button key={s.id} className={`btn sm ${o.hairStyle === s.id ? 'primary' : 'ghost'}`} onClick={() => upd('hairStyle', s.id)}><Tr s={s.hy} size="sm" /></button>)}</div>
          <h4><Es t={{ es: 'Los accesorios', hy: 'Աքսեսուարները' }} voice={false} size="sm" /></h4>
          <div className="row wrap">{HATS.map((s) => <button key={String(s.id)} className={`btn sm ${o.hat === s.id ? 'primary' : 'ghost'}`} onClick={() => upd('hat', s.id)}><Tr s={s.hy} size="sm" /></button>)}</div>
          <Sw k="hatColor" list={['#ffd23f', '#ff6fb5', '#2bd9c4', '#a24bd6', '#ffffff', '#e23b6d']} />
          <h4><Es t={{ es: 'Los zapatos', hy: 'Կոշիկները' }} voice={false} size="sm" /></h4><Sw k="shoes" list={['#ffffff', '#ff6fb5', '#2a1a3a', '#a24bd6', '#ffd23f']} />
          <button className="btn primary" onClick={() => (onClose ? onClose() : go('start'))}>✓ <Tr s="¡Lista!|Պատրաստ է" /></button>
        </div>
      </div>
    </div>
  );
}
