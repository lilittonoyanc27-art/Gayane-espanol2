import { p } from '../types';
import type { L } from '../types';

export type SceneId = 'start' | 'map' | 'room' | 'taxi' | 'hall' | 'checkin' | 'security' | 'maze' | 'cafe' | 'boarding' | 'flight' | 'pilot' | 'arrival' | 'baggage' | 'madrid' | 'passport' | 'dict' | 'wardrobe';
export type Mission = { id: string; t: L; icon: string; scene: SceneId; params?: any; city: 'EVN' | 'AIR' | 'MAD' };

export const MISSIONS: Mission[] = [
  { id: 'maleta', t: p('Prepara tu maleta|Պատրաստիր ճամպրուկդ'), icon: '🧳', scene: 'room', city: 'EVN' },
  { id: 'taxi', t: p('Un taxi al aeropuerto|Տաքսի դեպի օդանավակայան'), icon: '🚕', scene: 'taxi', city: 'EVN' },
  { id: 'info', t: p('Explora el aeropuerto|Ուսումնասիրիր օդանավակայանը'), icon: '🗺️', scene: 'hall', city: 'EVN' },
  { id: 'checkin', t: p('Facturación|Գրանցում'), icon: '🎫', scene: 'hall', params: { focus: 'checkin' }, city: 'EVN' },
  { id: 'seguridad', t: p('Control de seguridad|Անվտանգության ստուգում'), icon: '🛃', scene: 'hall', params: { focus: 'security' }, city: 'EVN' },
  { id: 'pasaporte', t: p('Control de pasaportes|Անձնագրային ստուգում'), icon: '🛂', scene: 'hall', params: { focus: 'passport' }, city: 'EVN' },
  { id: 'laberinto', t: p('El laberinto del aeropuerto|Օդանավակայանի լաբիրինթոսը'), icon: '🧭', scene: 'maze', city: 'EVN' },
  { id: 'cafe', t: p('Tiendas y cafetería|Խանութներ և սրճարան'), icon: '☕', scene: 'cafe', city: 'EVN' },
  { id: 'embarque', t: p('Embarque|Նստեցում'), icon: '🛫', scene: 'boarding', city: 'EVN' },
  { id: 'vuelo', t: p('La azafata y los pasajeros|Ուղեկցորդուհին և ուղևորները'), icon: '💬', scene: 'flight', city: 'AIR' },
  { id: 'piloto', t: p('Pilota tu avión|Վարիր քո ինքնաթիռը'), icon: '🛩️', scene: 'pilot', city: 'AIR' },
  { id: 'llegada', t: p('Llegada a Madrid|Ժամանում Մադրիդ'), icon: '🛬', scene: 'arrival', city: 'MAD' },
  { id: 'equipaje', t: p('¿Dónde está mi maleta?|Որտե՞ղ է իմ ճամպրուկը'), icon: '🧳', scene: 'baggage', city: 'MAD' },
  { id: 'madrid', t: p('Una aventura en Madrid|Արկած Մադրիդում'), icon: '🏰', scene: 'madrid', city: 'MAD' },
];

export function isUnlocked(i: number, done: Record<string, boolean>) {
  return i === 0 || !!done[MISSIONS[i - 1].id] || !!done[MISSIONS[i].id];
}
export function nextMission(done: Record<string, boolean>) {
  return MISSIONS.find((m) => !done[m.id]) ?? null;
}
