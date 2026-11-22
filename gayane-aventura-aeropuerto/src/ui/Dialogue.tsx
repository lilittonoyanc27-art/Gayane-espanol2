import { useEffect, useMemo, useRef, useState } from 'react';
import type { L } from '../types';
import { pick, sample, shuffle } from '../types';
import type { Bad, DScene, Opt, Step, Vars } from '../data/dialog';
import { fill, matchAnswer, norm } from '../data/dialog';
import { Es, Note, Tr, Who } from './Es';
import { Person } from './Person';
import { useGame } from '../store';
import { canListen, listen, say, sfx } from '../audio';

export type Mode = 'choice' | 'build' | 'type' | 'speak' | 'free';
export const MODES: { id: Mode; icon: string; s: string }[] = [
  { id: 'choice', icon: '👆', s: 'Elegir|Ընտրել' },
  { id: 'build', icon: '🧩', s: 'Construir|Կառուցել' },
  { id: 'type', icon: '⌨️', s: 'Escribir|Գրել' },
  { id: 'speak', icon: '🎤', s: 'Hablar|Խոսել' },
  { id: 'free', icon: '🎭', s: 'Sin pistas|Առանց հուշման' },
];

type Entry = { who: 'npc' | 'me' | 'sys'; t: L; name?: string; id: number };
export type DialogResult = { vars: Vars; mistakes: number; points: number; stars: number };

let eid = 0;
const GENERIC_NONE: L[] = [
  { es: 'Perdone, no la he entendido. ¿Puede repetirlo?', hy: 'Ներեցեք, չհասկացա։ Կարո՞ղ եք կրկնել։' },
  { es: 'Disculpe, ¿cómo dice?', hy: 'Ներեցեք, ի՞նչ ասացիք։' },
  { es: 'Lo siento, no la entiendo bien. ¿Otra vez, por favor?', hy: 'Ցավում եմ, լավ չեմ հասկանում։ Մեկ անգամ էլ, խնդրում եմ։' },
];

export function Dialogue({ scene, onDone, onExit, initVars = {}, bg = 'bg-terminal', defaultMode, prop }: {
  scene: DScene; onDone: (r: DialogResult) => void; onExit?: () => void; initVars?: Vars; bg?: string; defaultMode?: Mode; prop?: React.ReactNode;
}) {
  const { prog, learn, addScore, achieve } = useGame();
  const steps = useMemo(() => scene.steps.filter((s) => (s.lv ?? 1) <= prog.level && (s.maxLv ?? 3) >= prog.level), [scene, prog.level]);
  const [mode, setMode] = useState<Mode>(defaultMode ?? 'choice');
  const [vars, setVars] = useState<Vars>(initVars);
  const varsRef = useRef(vars); varsRef.current = vars;
  const [idx, setIdx] = useState(-1);
  const [log, setLog] = useState<Entry[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [stepMiss, setStepMiss] = useState(0);
  const [points, setPoints] = useState(0);
  const [removed, setRemoved] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState<DialogResult | null>(null);
  const [talking, setTalking] = useState<'npc' | 'me' | null>(null);
  const [round, setRound] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);

  const push = (e: Omit<Entry, 'id'>) => setLog((l) => [...l, { ...e, id: ++eid }]);
  const npcSay = (t: L) => {
    const f = fill(t, varsRef.current);
    push({ who: 'npc', t: f, name: scene.name });
    setTalking('npc');
    if (prog.settings.autoSpeak) say(f.es, scene.look.hairStyle === 'short' && !scene.look.skirt ? 0.85 : 1.1);
    setTimeout(() => setTalking(null), 1400);
  };

  const enter = (i: number, v: Vars) => {
    let j = i;
    while (j < steps.length && steps[j].when && !steps[j].when!(v)) j++;
    if (j >= steps.length) {
      const stars = mistakesRef.current === 0 ? 3 : mistakesRef.current <= 2 ? 2 : 1;
      const res = { vars: v, mistakes: mistakesRef.current, points: pointsRef.current, stars };
      setFinished(res);
      addScore(pointsRef.current);
      if (mistakesRef.current === 0 && steps.length >= 4) achieve('sinErrores');
      sfx.play('win');
      return;
    }
    setIdx(j); setStepMiss(0); setRemoved([]); setRound((r) => r + 1);
    npcSay(pick(steps[j].npc));
  };
  const mistakesRef = useRef(0); mistakesRef.current = mistakes;
  const pointsRef = useRef(0); pointsRef.current = points;

  useEffect(() => { enter(0, initVars); /* eslint-disable-next-line */ }, []);
  useEffect(() => { logRef.current?.scrollTo({ top: 1e6, behavior: 'smooth' }); }, [log, finished]);

  const step: Step | null = idx >= 0 && idx < steps.length ? steps[idx] : null;
  const npcOnly = !!step && step.ok.length === 0;
  const branching = !!step && step.ok.filter((o) => o.set || o.goto).length > 1;

  const options = useMemo(() => {
    if (!step || npcOnly) return [] as { o: Opt | Bad; ok: boolean }[];
    const oks = branching ? step.ok.slice(0, 3) : [pick(step.ok)];
    const bads = sample(step.bad.filter((b) => !removed.includes(b.es)), prog.level === 1 ? 2 : 2);
    return shuffle([...oks.map((o) => ({ o, ok: true })), ...bads.map((o) => ({ o, ok: false }))]);
    // eslint-disable-next-line
  }, [step, round, removed.length]);

  const advance = (o: Opt) => {
    const nv = o.set ? { ...varsRef.current, ...o.set } : varsRef.current;
    if (o.set) setVars(nv);
    varsRef.current = nv;
    const reaction = o.re ?? (step!.after ? pick(step!.after) : null);
    setBusy(true);
    setTimeout(() => {
      if (reaction) npcSay(reaction);
      setTimeout(() => {
        setBusy(false);
        let next = idx + 1;
        if (o.goto) { const k = steps.findIndex((s) => s.id === o.goto); if (k >= 0) next = k; }
        enter(next, nv);
      }, reaction ? 1300 : 300);
    }, 450);
  };

  const answerOk = (o: Opt, pts: number) => {
    push({ who: 'me', t: fill(o, varsRef.current), name: 'Gayane' });
    setTalking('me'); setTimeout(() => setTalking(null), 900);
    sfx.play('ok');
    learn(fill(o, varsRef.current));
    setPoints((p) => p + Math.max(2, pts - stepMiss * 3));
    advance(o);
  };
  const answerBad = (b: Bad | null, line?: L) => {
    if (line) push({ who: 'me', t: line, name: 'Gayane' });
    sfx.play('bad');
    setMistakes((m) => m + 1); setStepMiss((m) => m + 1);
    setBusy(true);
    setTimeout(() => {
      npcSay(b ? b.re : pick(GENERIC_NONE));
      if (b) setRemoved((r) => [...r, b.es]);
      setBusy(false);
    }, 450);
  };

  const restart = () => {
    setLog([]); setMistakes(0); setPoints(0); setFinished(null); setVars(initVars); varsRef.current = initVars;
    mistakesRef.current = 0; pointsRef.current = 0;
    enter(0, initVars);
  };

  return (
    <div className={`dialogue ${bg}`}>
      <div className="dlg-top">
        <button className="btn ghost sm" onClick={onExit}>✕</button>
        <div className="dlg-title"><Es t={scene.title} size="md" voice={false} /></div>
        <div className="modes">
          {MODES.map((m) => (
            <button key={m.id} className={`mode ${mode === m.id ? 'on' : ''}`} onClick={() => { setMode(m.id); sfx.play('click'); }}>
              <span>{m.icon}</span><small>{m.s.split('|')[0]}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="dlg-stage">
        <div className={`dlg-npc ${talking === 'npc' ? 'speaking' : ''}`}>
          <Person look={scene.look} size={190} talking={talking === 'npc'} />
          <div className="nameplate"><Who n={scene.name} /></div>
        </div>
        {prop && <div className="dlg-prop">{prop}</div>}
        <div className={`dlg-me ${talking === 'me' ? 'speaking' : ''}`}>
          <Person look={prog.outfit} size={190} talking={talking === 'me'} mirror bag />
          <div className="nameplate me"><Who n="Gayane" /></div>
        </div>
      </div>
      <div className="dlg-log" ref={logRef}>
        {log.map((e) => (
          <div key={e.id} className={`msg ${e.who}`}>
            <div className="msg-name">{e.name && <Who n={e.name} />}</div>
            <div className="msg-bubble"><Es t={e.t} size="lg" /></div>
          </div>
        ))}
        {finished && (
          <div className="dlg-finish pop">
            <div className="stars">{[1, 2, 3].map((s) => <span key={s} className={s <= finished.stars ? 'on' : ''}>★</span>)}</div>
            <Es t={{ es: '¡Muy bien, Gayane!', hy: 'Շատ լավ, Գայանե՛' }} size="xl" />
            <Note s={`Errores: ${finished.mistakes} · Puntos: +${finished.points}|Սխալներ՝ ${finished.mistakes} · Միավորներ՝ +${finished.points}`} className="center" />
            <div className="row">
              <button className="btn ghost" onClick={restart}>🔁 <Tr s="Repetir|Կրկնել" /></button>
              <button className="btn primary" onClick={() => onDone(finished)}><Tr s="Continuar|Շարունակել" /> ▶</button>
            </div>
          </div>
        )}
      </div>
      {!finished && step && (
        <div className={`dlg-answer ${busy ? 'busy' : ''}`}>
          {npcOnly ? (
            <button className="btn primary big" onClick={() => { sfx.play('click'); enter(idx + 1, varsRef.current); }}><Tr s="Continuar|Շարունակել" /> ▶</button>
          ) : mode === 'choice' ? (
            <ChoicePanel options={options} hint={stepMiss >= 2} onPick={(x) => (x.ok ? answerOk(x.o as Opt, 10) : answerBad(x.o as Bad, x.o))} />
          ) : mode === 'build' ? (
            <BuildPanel key={round + '-' + idx} step={step} vars={vars} branching={branching} onOk={(o) => answerOk(o, 15)} onMiss={() => { setMistakes((m) => m + 1); setStepMiss((m) => m + 1); sfx.play('bad'); }} />
          ) : (
            <TypePanel key={round + '-' + idx + mode} step={step} mode={mode} vars={vars} branching={branching} showHint={stepMiss >= 1}
              onResult={(raw, spoken) => {
                const r = matchAnswer(raw, step);
                const shown = raw.split('|||')[0].trim();
                if (r.kind === 'ok') {
                  if (spoken) achieve('habla');
                  if (mode === 'free' || mode === 'type') achieve('escritora');
                  answerOk(r.opt, mode === 'free' ? 25 : 20);
                } else if (r.kind === 'bad') answerBad(r.bad, { es: shown, hy: r.bad.hy });
                else answerBad(null, { es: shown, hy: '—' });
              }} />
          )}
        </div>
      )}
    </div>
  );
}

function ChoicePanel({ options, onPick, hint }: { options: { o: L; ok: boolean }[]; onPick: (x: { o: L; ok: boolean }) => void; hint: boolean }) {
  return (
    <div className="choices">
      {options.map((x, i) => (
        <div key={x.o.es} className={`choice ${hint && x.ok ? 'hinted' : ''}`} onClick={() => onPick(x)} role="button">
          <span className="letter">{'ABCD'[i]}</span>
          <Es t={x.o} size="lg" />
        </div>
      ))}
      <Note s="💡 Pulsa el texto para ver la traducción y pulsa la letra para responder.|💡 Սեղմիր տեքստին՝ թարգմանությունը տեսնելու համար, իսկ տառին՝ պատասխանելու։" />
    </div>
  );
}

function BuildPanel({ step, vars, branching, onOk, onMiss }: { step: Step; vars: Vars; branching: boolean; onOk: (o: Opt) => void; onMiss: () => void }) {
  const [target, setTarget] = useState<Opt | null>(branching ? null : pick(step.ok));
  const [placed, setPlaced] = useState<number[]>([]);
  const [wrong, setWrong] = useState(false);
  const tf = target ? fill(target, vars) : null;
  const tokens = useMemo(() => {
    if (!tf) return [] as string[];
    const base = tf.es.split(' ');
    const extra = step.bad.length ? sample(fill(pick(step.bad), vars).es.split(' ').filter((w) => !base.includes(w)), 2) : [];
    return shuffle([...base, ...extra]);
    // eslint-disable-next-line
  }, [target]);
  if (!target || !tf) {
    return (
      <div className="build">
        <Note s="¿Qué quieres decir? Elige una opción y después construye la frase.|Ի՞նչ ես ուզում ասել։ Ընտրիր տարբերակ և հետո կազմիր նախադասությունը։" />
        <div className="row wrap">
          {step.ok.slice(0, 3).map((o) => <button key={o.es} className="btn soft" onClick={() => setTarget(o)}><Es t={fill(o, vars)} chip voice={false} /></button>)}
        </div>
      </div>
    );
  }
  const check = () => {
    const s = placed.map((i) => tokens[i]).join(' ');
    if (norm(s) === norm(tf.es)) onOk(target);
    else { setWrong(true); onMiss(); setTimeout(() => setWrong(false), 700); }
  };
  return (
    <div className="build">
      <div className="note">🧩 <Es t={{ es: 'Construye la frase. Pulsa aquí para ver lo que significa.', hy: `Կազմիր նախադասությունը՝ «${tf.hy}»` }} size="sm" voice={false} /></div>
      <div className={`build-line ${wrong ? 'shake' : ''}`}>
        {placed.length === 0 && <span className="ph">Toca las palabras…</span>}
        {placed.map((i, k) => <button key={k} className="tile placed" onClick={() => setPlaced((p) => p.filter((_, j) => j !== k))}>{tokens[i]}</button>)}
      </div>
      <div className="row wrap">
        {tokens.map((w, i) => !placed.includes(i) && <button key={i} className="tile" onClick={() => { sfx.play('click'); setPlaced((p) => [...p, i]); }}>{w}</button>)}
      </div>
      <div className="row">
        <button className="btn ghost sm" onClick={() => setPlaced([])}>↺</button>
        <button className="btn primary" disabled={!placed.length} onClick={check}><Tr s="Comprobar|Ստուգել" /> ✓</button>
      </div>
    </div>
  );
}

function TypePanel({ step, mode, vars, branching, showHint, onResult }: { step: Step; mode: Mode; vars: Vars; branching: boolean; showHint: boolean; onResult: (raw: string, spoken: boolean) => void }) {
  const [val, setVal] = useState('');
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const [reveal, setReveal] = useState(false);
  const inp = useRef<HTMLInputElement>(null);
  useEffect(() => { if (mode !== 'speak') inp.current?.focus(); }, [mode]);
  const model = fill(step.ok[0], vars);
  const mic = async () => {
    setListening(true); setHeard('');
    try {
      const r = await listen();
      setHeard(r.split('|||')[0]);
      onResult(r, true);
    } catch { setHeard('🙉 No te he oído. Inténtalo otra vez o escribe la respuesta.'); }
    setListening(false);
  };
  const submit = () => { if (val.trim()) { onResult(val, false); setVal(''); } };
  return (
    <div className="typepanel">
      {mode === 'type' && (
        <div className="note">
          ⌨️ <Es t={{ es: 'Responde en español. Pulsa aquí para ver una pista.', hy: branching ? 'Օրինակ՝ ' + step.ok.slice(0, 3).map((o) => '«' + fill(o, vars).hy + '»').join(' / ') : `Իմաստը՝ «${model.hy}»` }} size="sm" voice={false} />
        </div>
      )}
      {mode === 'free' && <Note s="🎭 Juego de rol sin pistas: responde tú sola.|🎭 Դերային խաղ առանց հուշման՝ պատասխանիր ինքնուրույն։" />}
      {mode === 'speak' && (
        <div className="speak-row">
          {canListen() ? (
            <button className={`mic ${listening ? 'on' : ''}`} onClick={mic} disabled={listening}>🎤</button>
          ) : <Note s="Tu navegador no reconoce la voz. Dilo en voz alta y escribe la respuesta abajo.|Քո բրաուզերը չի ճանաչում խոսքը։ Ասա բարձրաձայն և գրիր պատասխանը ներքևում։" />}
          <div className="note">
            {listening ? <Es t={{ es: 'Te escucho… habla en español.', hy: 'Լսում եմ… խոսիր իսպաներեն։' }} size="sm" voice={false} />
              : heard ? <span>👂 «{heard}»</span>
                : <Es t={{ es: 'Pulsa el micrófono y responde. Pulsa aquí para ver lo que tienes que decir.', hy: `Իմաստը՝ «${model.hy}»։ Սեղմիր խոսափողին և ասա։` }} size="sm" voice={false} />}
          </div>
        </div>
      )}
      <div className="row">
        <input ref={inp} className="answer-input" value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Escribe aquí en español…" autoComplete="off" autoCapitalize="sentences" spellCheck={false} />
        <button className="btn primary" onClick={submit}>➤</button>
      </div>
      <div className="row wrap accents">
        {['á', 'é', 'í', 'ó', 'ú', 'ñ', '¿', '¡'].map((c) => <button key={c} className="tile sm" onClick={() => { setVal((v) => v + c); inp.current?.focus(); }}>{c}</button>)}
        {mode !== 'free' && showHint && <button className="btn soft sm" onClick={() => setReveal(true)}>💡 <Tr s="Pista|Հուշում" size="sm" /></button>}
      </div>
      {reveal && <div className="reveal"><Es t={model} size="lg" /></div>}
    </div>
  );
}
