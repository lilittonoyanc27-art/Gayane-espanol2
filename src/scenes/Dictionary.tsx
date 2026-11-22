import { useState } from 'react';
import { useGame } from '../store';
import { TopBar } from '../ui/Hud';
import { Es, Note, Tr } from '../ui/Es';
import { norm } from '../data/dialog';

export function Dictionary() {
  const { prog } = useGame();
  const [q, setQ] = useState('');
  const [showAll, setShowAll] = useState(false);
  const all = Object.entries(prog.words).reverse();
  const list = all.filter(([es, hy]) => !q || norm(es).includes(norm(q)) || hy.includes(q));
  return (
    <div className="screen dict-screen">
      <TopBar title={<Es t={{ es: 'Mi diccionario', hy: 'Իմ բառարանը' }} voice={false} />} back="start" />
      <div className="dict-top">
        <input className="answer-input" placeholder="🔎 Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="chip">{all.length}</span>
        <button className={`btn sm ${showAll ? 'primary' : 'ghost'}`} onClick={() => setShowAll(!showAll)}>👁️ <Tr s={showAll ? 'Ocultar las traducciones|Թաքցնել թարգմանությունները' : 'Mostrar todas las traducciones|Ցույց տալ բոլոր թարգմանությունները'} size="sm" /></button>
      </div>
      {!all.length && <Note s="Aquí aparecerán las frases que traduces o usas bien en el juego.|Այստեղ կհայտնվեն արտահայտությունները, որոնք թարգմանել կամ ճիշտ օգտագործել ես խաղում։" className="center" />}
      <div className="dict-list">
        {list.map(([es, hy]) => (
          <div key={es} className="dict-item">
            <Es t={{ es, hy }} size="md" />
            {showAll && <span className="dict-hy">{hy}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
