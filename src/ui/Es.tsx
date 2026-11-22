import { useState } from 'react';
import type { L } from '../types';
import { p } from '../types';
import { say } from '../audio';
import { useGame } from '../store';

/**
 * The single Spanish-text component of the game.
 * Spanish is always shown; the Armenian translation appears ONLY after a tap/click and hides on the next one.
 * `chip` mode is for text inside buttons/controls: the label itself keeps the button's action,
 * and a small «ա» chip next to it toggles the translation.
 */
export function Es({ t, size = 'md', voice = true, className = '', block = false, chip = false }: {
  t: L; size?: 'sm' | 'md' | 'lg' | 'xl'; voice?: boolean; className?: string; block?: boolean; chip?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { learn } = useGame();
  const toggle = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setOpen((o) => !o);
    if (!open) learn(t);
  };
  if (chip) {
    return (
      <span className={`es es-chip es-${size} ${open ? 'open' : ''} ${className}`}>
        <span className="es-label">{t.es}</span>
        <span className="tr-chip" role="button" tabIndex={0} aria-label="Traducción" title="Traducción"
          onClick={toggle} onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Enter') toggle(e); }}>ա</span>
        {open && <span className="hy" onClick={toggle}>{t.hy}</span>}
      </span>
    );
  }
  return (
    <span className={`es es-${size} ${block ? 'es-block' : ''} ${open ? 'open' : ''} ${className}`}>
      <span className="es-text" role="button" tabIndex={0} title="Pulsa para ver la traducción"
        onClick={toggle} onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Enter') toggle(e); }}>{t.es}</span>
      {voice && (
        <button className="say" aria-label="Escuchar" onClick={(e) => { e.stopPropagation(); say(t.es); }}>🔊</button>
      )}
      {open && <span className="hy" onClick={toggle}>{t.hy}</span>}
    </span>
  );
}

/** Button / control label: "español|հայերեն" */
export function Tr({ s, size = 'md' }: { s: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  return <Es t={p(s)} chip voice={false} size={size} />;
}

/** Instruction / hint line: "español|հայերեն" */
export function Note({ s, className = '', voice = false }: { s: string; className?: string; voice?: boolean }) {
  return <div className={`note ${className}`}><Es t={p(s)} size="sm" voice={voice} /></div>;
}

const NAME_HY: Record<string, string> = {
  Taxista: 'Տաքսու վարորդ', Empleada: 'Աշխատակցուհի', Empleado: 'Աշխատակից', Policía: 'Ոստիկան', Agente: 'Նստեցման աշխատակից',
  Azafata: 'Ուղեկցորդուհի', Guardia: 'Պահակ', Señora: 'Տիկին', Taquillera: 'Տոմսավաճառուհի', Recepcionista: 'Ընդունարանի աշխատակցուհի',
  Turista: 'Զբոսաշրջիկ', Piloto: 'Օդաչու', Niño: 'Երեխա', Camarero: 'Մատուցող', Camarera: 'Մատուցողուհի', Dependienta: 'Վաճառողուհի',
  Dependiente: 'Վաճառող', Mamá: 'Մայրիկ', Megafonía: 'Բարձրախոս', Cartel: 'Ցուցանակ', Limpiadora: 'Հավաքարարուհի', Quiosquero: 'Կրպակի վաճառող',
  Portero: 'Դռնապան', Músico: 'Երաժիշտ', Pasajero: 'Ուղևոր', Pasajera: 'Ուղևորուհի', Gayane: 'Գայանե', Javier: 'Խավիեր', Lucía: 'Լուսիա', Pablo: 'Պաբլո',
};
/** Character name, clickable like every Spanish word */
export function Who({ n }: { n: string }) {
  return <Es t={{ es: n, hy: NAME_HY[n] ?? n }} size="sm" voice={false} className="who-name" />;
}
