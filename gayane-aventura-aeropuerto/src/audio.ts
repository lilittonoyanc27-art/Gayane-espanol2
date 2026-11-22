type Snd = 'click' | 'ok' | 'bad' | 'coin' | 'win' | 'ding' | 'beep' | 'whoosh' | 'star' | 'step' | 'hit' | 'open';

class Sfx {
  enabled = true;
  rate = 0.9;
  ctx: AudioContext | null = null;
  private ac() {
    if (!this.ctx) {
      const C = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
      if (!C) return null;
      this.ctx = new C();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }
  tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.15, delay = 0, slide = 0) {
    const c = this.ac();
    if (!c) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  play(s: Snd) {
    if (!this.enabled) return;
    try {
      switch (s) {
        case 'click': this.tone(660, 0.06, 'triangle', 0.08); break;
        case 'ok': [523, 659, 784].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.12, i * 0.08)); break;
        case 'bad': this.tone(220, 0.25, 'sawtooth', 0.06, 0, -80); break;
        case 'coin': this.tone(988, 0.08, 'square', 0.06); this.tone(1319, 0.2, 'square', 0.06, 0.07); break;
        case 'win': [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.11, i * 0.09)); break;
        case 'ding': this.tone(880, 0.6, 'sine', 0.15); this.tone(698, 0.8, 'sine', 0.15, 0.35); this.tone(523, 1, 'sine', 0.15, 0.7); break;
        case 'beep': this.tone(1200, 0.12, 'square', 0.07); this.tone(1200, 0.12, 'square', 0.07, 0.18); this.tone(1200, 0.12, 'square', 0.07, 0.36); break;
        case 'whoosh': this.tone(300, 0.5, 'sawtooth', 0.04, 0, 600); break;
        case 'star': this.tone(1568, 0.12, 'sine', 0.1); this.tone(2093, 0.18, 'sine', 0.08, 0.06); break;
        case 'step': this.tone(120, 0.04, 'triangle', 0.03); break;
        case 'hit': this.tone(150, 0.3, 'square', 0.1, 0, -100); break;
        case 'open': this.tone(400, 0.15, 'triangle', 0.08, 0, 300); break;
      }
    } catch { /* ignore */ }
  }
}
export const sfx = new Sfx();

let esVoice: SpeechSynthesisVoice | null = null;
function findVoice() {
  if (!('speechSynthesis' in window)) return null;
  const vs = speechSynthesis.getVoices();
  esVoice = vs.find((v) => v.lang === 'es-ES' && /female|mujer|mónica|monica|helena|elvira|lucia|google/i.test(v.name))
    || vs.find((v) => v.lang === 'es-ES') || vs.find((v) => v.lang.startsWith('es')) || null;
  return esVoice;
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  findVoice();
  speechSynthesis.onvoiceschanged = () => findVoice();
}
export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export function say(text: string, pitch = 1.05) {
  if (!canSpeak()) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[«»]/g, ''));
    u.lang = 'es-ES';
    const v = esVoice || findVoice();
    if (v) u.voice = v;
    u.rate = sfx.rate;
    u.pitch = pitch;
    speechSynthesis.speak(u);
  } catch { /* ignore */ }
}

export const canListen = () => typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

export function listen(): Promise<string> {
  return new Promise((resolve, reject) => {
    const R = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!R) return reject(new Error('no'));
    const r = new R();
    r.lang = 'es-ES';
    r.interimResults = false;
    r.maxAlternatives = 3;
    let got = false;
    r.onresult = (e: any) => {
      got = true;
      const alts: string[] = [];
      for (let i = 0; i < e.results[0].length; i++) alts.push(e.results[0][i].transcript);
      resolve(alts.join(' ||| '));
    };
    r.onerror = (e: any) => reject(e);
    r.onend = () => { if (!got) reject(new Error('silence')); };
    r.start();
  });
}
