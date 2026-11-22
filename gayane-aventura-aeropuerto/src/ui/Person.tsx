import type { Look } from '../types';

export const LOOKS: Record<string, Look> = {
  empleada: { skin: '#e9b99a', hair: '#7a3e1d', hairStyle: 'bun', top: '#5b3fc4', bottom: '#2f2566', skirt: true, shoes: '#222', scarf: '#ffd23f', hat: null },
  info: { skin: '#d9a07c', hair: '#1f1a17', hairStyle: 'short', top: '#2bb5c9', bottom: '#2c3e66', shoes: '#222', scarf: '#ff6fb5', glasses: true },
  guardia: { skin: '#c68b62', hair: '#1f1a17', hairStyle: 'short', top: '#3d4a7a', bottom: '#28304f', shoes: '#111', hat: 'cap', hatColor: '#28304f', beard: true },
  policia: { skin: '#f0c7a4', hair: '#5a3a22', hairStyle: 'pony', top: '#355c7d', bottom: '#253b52', skirt: false, shoes: '#111', hat: 'cap', hatColor: '#253b52' },
  azafata: { skin: '#f3cfb3', hair: '#e0a84a', hairStyle: 'bun', top: '#a24bd6', bottom: '#5a2a8a', skirt: true, shoes: '#5a2a8a', hat: 'pilot', hatColor: '#a24bd6', scarf: '#2bd9c4' },
  camarero: { skin: '#d8a27e', hair: '#2a1a10', hairStyle: 'short', top: '#ffffff', bottom: '#333', shoes: '#111', scarf: '#e23b6d', beard: false },
  taxista: { skin: '#e0b08c', hair: '#6b6b6b', hairStyle: 'short', top: '#f2c94c', bottom: '#4a4a4a', shoes: '#222', hat: 'cap', hatColor: '#222', beard: true },
  pasajero: { skin: '#f2d0b5', hair: '#a0522d', hairStyle: 'short', top: '#4caf8d', bottom: '#335', shoes: '#333', glasses: true },
  pasajera: { skin: '#b98260', hair: '#151010', hairStyle: 'braid', top: '#ff9f43', bottom: '#2d5d8a', skirt: false, shoes: '#fff' },
  abuela: { skin: '#f2d6c2', hair: '#d9d9d9', hairStyle: 'bun', top: '#9b59b6', bottom: '#5d3a6e', skirt: true, shoes: '#333', glasses: true },
  mama: { skin: '#f1cdb3', hair: '#2e1b14', hairStyle: 'bun', top: '#ff8fab', bottom: '#4b3f8f', skirt: true, shoes: '#fff', scarf: '#ffd23f' },
  recepcion: { skin: '#e5b593', hair: '#3a2a1a', hairStyle: 'pony', top: '#e23b6d', bottom: '#2a2a3a', shoes: '#222', scarf: '#fff' },
  nino: { skin: '#f6d2b8', hair: '#d9902b', hairStyle: 'short', top: '#3fa9f5', bottom: '#2c3e66', shoes: '#f33' },
};

export function Person({ look, size = 160, wave = false, talking = false, mirror = false, className = '', bag = false }: {
  look: Look; size?: number; wave?: boolean; talking?: boolean; mirror?: boolean; className?: string; bag?: boolean;
}) {
  const L = look;
  const hairBackLong = L.hairStyle === 'long' || L.hairStyle === 'braid';
  return (
    <svg viewBox="0 0 120 200" width={size * 0.6} height={size} className={`person ${talking ? 'talking' : ''} ${className}`}
      style={{ transform: mirror ? 'scaleX(-1)' : undefined, overflow: 'visible' }}>
      <ellipse cx="60" cy="193" rx="34" ry="6" fill="rgba(60,20,90,.18)" />
      {hairBackLong && <path d={`M28 52 Q24 ${L.hairStyle === 'braid' ? 100 : 120} 40 ${L.hairStyle === 'braid' ? 112 : 128} L80 ${L.hairStyle === 'braid' ? 112 : 128} Q96 ${L.hairStyle === 'braid' ? 100 : 120} 92 52 Z`} fill={L.hair} />}
      {L.hairStyle === 'pony' && <path d="M84 40 Q112 60 96 110 Q90 80 80 60 Z" fill={L.hair} />}
      {/* legs */}
      <g className="legs">
        <rect x="44" y="128" width="13" height="54" rx="6" fill={L.skirt ? L.skin : L.bottom} />
        <rect x="63" y="128" width="13" height="54" rx="6" fill={L.skirt ? L.skin : L.bottom} />
        <ellipse cx="49" cy="184" rx="10" ry="6" fill={L.shoes} stroke="rgba(0,0,0,.15)" />
        <ellipse cx="71" cy="184" rx="10" ry="6" fill={L.shoes} stroke="rgba(0,0,0,.15)" />
      </g>
      {L.skirt ? <path d="M38 112 L82 112 L92 150 Q60 158 28 150 Z" fill={L.bottom} /> : <rect x="41" y="110" width="38" height="26" rx="8" fill={L.bottom} />}
      {/* arms */}
      <g className="arm-l"><rect x="24" y="90" width="13" height="40" rx="6.5" fill={L.top} /><circle cx="30.5" cy="133" r="6.5" fill={L.skin} /></g>
      <g className={`arm-r ${wave ? 'waving' : ''}`} style={{ transformOrigin: '89px 92px' }}>
        <rect x="83" y="90" width="13" height="40" rx="6.5" fill={L.top} /><circle cx="89.5" cy="133" r="6.5" fill={L.skin} />
      </g>
      {/* torso */}
      <path d="M36 92 Q36 82 50 80 L70 80 Q84 82 84 92 L84 118 Q60 124 36 118 Z" fill={L.top} />
      <path d="M52 80 L60 90 L68 80" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="2.5" />
      {L.scarf && <path d="M46 80 Q60 92 74 80 L72 86 Q60 96 48 86 Z" fill={L.scarf} />}
      {bag && <><path d="M40 82 L80 116" stroke="#7b4fd6" strokeWidth="4" /><rect x="74" y="108" width="20" height="16" rx="4" fill="#ffd23f" stroke="#7b4fd6" strokeWidth="2" /></>}
      <rect x="54" y="72" width="12" height="10" fill={L.skin} />
      {/* head */}
      <circle cx="60" cy="50" r="30" fill={L.skin} />
      <ellipse cx="30" cy="54" rx="4" ry="6" fill={L.skin} /><ellipse cx="90" cy="54" rx="4" ry="6" fill={L.skin} />
      {/* hair front */}
      {L.hairStyle === 'short'
        ? <path d="M30 48 Q30 18 60 18 Q90 18 90 48 Q84 32 70 30 Q56 36 40 32 Q34 38 30 48 Z" fill={L.hair} />
        : <path d="M29 56 Q26 18 60 17 Q94 18 91 56 Q88 36 76 30 Q66 42 44 40 Q36 44 29 56 Z" fill={L.hair} />}
      {L.hairStyle === 'bun' && <circle cx="60" cy="16" r="12" fill={L.hair} />}
      {L.hairStyle === 'braid' && <path d="M84 60 Q96 90 88 130" stroke={L.hair} strokeWidth="9" fill="none" strokeLinecap="round" strokeDasharray="6 2" />}
      {L.beard && <path d="M36 58 Q40 82 60 84 Q80 82 84 58 Q78 72 60 72 Q42 72 36 58 Z" fill={L.hair} opacity=".85" />}
      {/* face */}
      <g className="blink">
        <ellipse cx="48" cy="54" rx="4.2" ry="5.2" fill="#2a1a3a" />
        <ellipse cx="72" cy="54" rx="4.2" ry="5.2" fill="#2a1a3a" />
        <circle cx="49.5" cy="52" r="1.6" fill="#fff" /><circle cx="73.5" cy="52" r="1.6" fill="#fff" />
      </g>
      {L.glasses && <g fill="none" stroke="#333" strokeWidth="2"><circle cx="48" cy="54" r="8" /><circle cx="72" cy="54" r="8" /><path d="M56 54 L64 54" /></g>}
      <ellipse cx="40" cy="64" rx="5" ry="3" fill="#ff8fb0" opacity=".6" /><ellipse cx="80" cy="64" rx="5" ry="3" fill="#ff8fb0" opacity=".6" />
      <path className="mouth" d="M53 66 Q60 72 67 66" stroke="#b03060" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* hats */}
      {L.hat === 'band' && <path d="M31 38 Q60 14 89 38" stroke={L.hatColor || '#ffd23f'} strokeWidth="5" fill="none" strokeLinecap="round" />}
      {L.hat === 'cap' && <><path d="M30 34 Q60 4 90 34 Z" fill={L.hatColor} /><rect x="28" y="30" width="64" height="7" rx="3" fill={L.hatColor} /><circle cx="60" cy="24" r="4" fill="#ffd23f" /></>}
      {L.hat === 'pilot' && <><path d="M36 28 Q60 10 84 28 L84 34 L36 34 Z" fill={L.hatColor} /><circle cx="60" cy="24" r="3.5" fill="#ffd23f" /></>}
      {L.hat === 'beret' && <ellipse cx="54" cy="24" rx="30" ry="10" fill={L.hatColor} transform="rotate(-10 54 24)" />}
    </svg>
  );
}
