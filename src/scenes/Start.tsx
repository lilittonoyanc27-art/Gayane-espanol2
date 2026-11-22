import { useState } from 'react';
import { useGame } from '../store';
import { useNav } from '../nav';
import { Person } from '../ui/Person';
import { Es, Note, Tr } from '../ui/Es';
import { LEVEL_NAMES, Level } from '../types';
import { nextMission } from '../data/missions';
import { sfx } from '../audio';
import { Modal } from '../ui/Hud';

export function StartScreen() {
  const { prog, set, reset, achieve } = useGame();
  const { go } = useNav();
  const [confirm, setConfirm] = useState(false);
  const [settings, setSettings] = useState(false);
  const hasSave = prog.started && Object.keys(prog.done).length > 0;
  const startNew = () => { reset(); setTimeout(() => { achieve('primerPaso'); go('room'); }, 30); };
  const cont = () => {
    sfx.play('click');
    const n = nextMission(prog.done);
    if (!n) go('map'); else go(n.scene, n.params);
  };
  const setLevel = (l: Level) => { sfx.play('click'); set((p) => ({ ...p, level: l })); };
  return (
    <div className="start">
      <div className="sky-anim">
        {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className={`cloud c${i}`} />)}
        <div className="plane-fly">✈️</div>
        <div className="sun" />
      </div>
      <div className="start-inner">
        <div className="logo pop">
          <div className="logo-name">GAYANE</div>
          <div className="logo-sub">AVENTURA EN EL AEROPUERTO</div>
          <div className="logo-route">EREVÁN ✈ MADRID</div>
        </div>
        <div className="start-hero">
          <div className="hero-girl"><Person look={prog.outfit} size={240} wave bag /></div>
          <div className="hero-suitcase">🧳</div>
        </div>
        <div className="start-card">
          <Es t={{ es: '¡Hola, Gayane! ¿Estás lista para viajar?', hy: 'Բարև, Գայանե՛։ Պատրա՞ստ ես ճամփորդելու։' }} size="lg" block />
          <div className="levels">
            {([1, 2, 3] as Level[]).map((l) => (
              <button key={l} className={`level ${prog.level === l ? 'on' : ''}`} onClick={() => setLevel(l)}>
                <b>{LEVEL_NAMES[l].code}</b><Es t={{ es: LEVEL_NAMES[l].es, hy: LEVEL_NAMES[l].hy }} chip voice={false} size="sm" />
              </button>
            ))}
          </div>
          <div className="start-btns">
            {hasSave && <button className="btn primary big glow" onClick={cont}>▶ <Tr s="Continuar el viaje|Շարունակել ճամփորդությունը" /></button>}
            <button className={`btn ${hasSave ? 'soft' : 'primary big glow'}`} onClick={() => (hasSave ? setConfirm(true) : startNew())}>✨ <Tr s="Nuevo viaje|Նոր ճամփորդություն" /></button>
          </div>
          <div className="start-small">
            <button className="btn ghost sm" onClick={() => go('map')}>🗺️ <Tr s="Mapa|Քարտեզ" size="sm" /></button>
            <button className="btn ghost sm" onClick={() => go('wardrobe')}>👗 <Tr s="Armario|Զգեստապահարան" size="sm" /></button>
            <button className="btn ghost sm" onClick={() => go('passport')}>📕 <Tr s="Pasaporte|Անձնագիր" size="sm" /></button>
            <button className="btn ghost sm" onClick={() => go('dict')}>📖 <Tr s="Diccionario|Բառարան" size="sm" /></button>
            <button className="btn ghost sm" onClick={() => setSettings(true)}>⚙️</button>
          </div>
          <Note s="Pulsa cualquier texto en español para ver la traducción. Pulsa otra vez para ocultarla. En los botones, pulsa el circulito rosa.|Սեղմիր ցանկացած իսպաներեն տեքստի վրա՝ թարգմանությունը տեսնելու համար։ Կրկին սեղմիր՝ թաքցնելու համար։ Կոճակների վրա սեղմիր վարդագույն շրջանակին։" />
        </div>
      </div>
      {confirm && (
        <Modal onClose={() => setConfirm(false)}>
          <h3><Es t={{ es: '¿Empezar de nuevo?', hy: 'Սկսե՞լ նորից։' }} voice={false} /></h3>
          <Note s="Se borrará todo tu progreso.|Ամբողջ առաջընթացը կջնջվի։" />
          <div className="row"><button className="btn ghost" onClick={() => setConfirm(false)}><Tr s="No|Ոչ" /></button><button className="btn primary" onClick={startNew}><Tr s="Sí, empezar|Այո, սկսել" /></button></div>
        </Modal>
      )}
      {settings && <SettingsModal onClose={() => setSettings(false)} />}
    </div>
  );
}

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { prog, set } = useGame();
  const S = prog.settings;
  const upd = (k: keyof typeof S, v: any) => set((p) => ({ ...p, settings: { ...p.settings, [k]: v } }));
  return (
    <Modal onClose={onClose}>
      <h3>⚙️ <Es t={{ es: 'Ajustes', hy: 'Կարգավորումներ' }} voice={false} /></h3>
      <label className="toggle"><input type="checkbox" checked={S.sound} onChange={(e) => upd('sound', e.target.checked)} /> 🔔 <Es t={{ es: 'Efectos de sonido', hy: 'Ձայնային էֆեկտներ' }} size="sm" voice={false} /></label>
      <label className="toggle"><input type="checkbox" checked={S.autoSpeak} onChange={(e) => upd('autoSpeak', e.target.checked)} /> 🔊 <Es t={{ es: 'Leer en voz alta las frases automáticamente', hy: 'Ավտոմատ կարդալ իսպաներեն արտահայտությունները' }} size="sm" voice={false} /></label>
      <label className="toggle"><input type="checkbox" checked={S.timer} onChange={(e) => upd('timer', e.target.checked)} /> ⏱️ <Es t={{ es: 'Cronómetro en el laberinto', hy: 'Ժամաչափ լաբիրինթոսում' }} size="sm" voice={false} /></label>
      <label className="toggle">🐢 <Es t={{ es: 'Velocidad de la voz', hy: 'Խոսքի արագություն' }} size="sm" voice={false} />
        <input type="range" min={0.6} max={1.2} step={0.05} value={S.rate} onChange={(e) => upd('rate', Number(e.target.value))} />
      </label>
      <Note s="Controles: WASD o flechas para caminar, Shift para correr, E o espacio para actuar. En el móvil: joystick y botón de acción.|Կառավարում՝ WASD կամ սլաքներ՝ քայլել, Shift՝ վազել, E կամ բացատ՝ գործողություն։ Հեռախոսում՝ ջոյսթիք և գործողության կոճակ։" />
    </Modal>
  );
}
