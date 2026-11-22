import type { Look } from '../types';

export type Dir = 0 | 1 | 2 | 3; // down, left, right, up
export const FONT = '"Fredoka", "Noto Sans Armenian", system-ui, sans-serif';
export const FONT_HY = '"Noto Sans Armenian", "Fredoka", system-ui, sans-serif';

export function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry = rx * 0.35) {
  ctx.fillStyle = 'rgba(60,20,100,.18)';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** cartoon person, (x,y) = feet center */
export function drawPerson(ctx: CanvasRenderingContext2D, x: number, y: number, L: Look, phase: number, dir: Dir, opts: { moving?: boolean; suitcase?: string | null; s?: number; backpack?: string | null; sit?: boolean; wave?: boolean } = {}) {
  const s = opts.s ?? 1;
  const mv = !!opts.moving;
  const bob = mv ? Math.abs(Math.sin(phase)) * 2.5 : Math.sin(phase * 0.35) * 0.8;
  const sw = mv ? Math.sin(phase) * 7 : 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  shadow(ctx, 0, 0, 16);
  const side = dir === 1 || dir === 2;
  const flip = dir === 1 ? -1 : 1;

  // suitcase behind / beside
  const drawSuit = () => {
    if (!opts.suitcase) return;
    let sx = 0, sy = 0;
    if (dir === 0) { sx = 20; sy = -6; } else if (dir === 3) { sx = -20; sy = -4; } else { sx = -22 * flip; sy = -2; }
    ctx.save();
    ctx.translate(sx, sy);
    ctx.fillStyle = '#555';
    ctx.fillRect(-1.5, -40, 3, 16);
    ctx.fillStyle = opts.suitcase;
    rr(ctx, -10, -26, 20, 26, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.45)';
    ctx.fillRect(-10, -16, 20, 3);
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(4, -24, 5, 7);
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(-6, 1, 2.2, 0, 7); ctx.arc(6, 1, 2.2, 0, 7); ctx.fill();
    ctx.restore();
  };
  if (dir === 3 || side) drawSuit();

  ctx.translate(0, -bob);
  // legs
  const legC = L.skirt ? L.skin : L.bottom;
  ctx.fillStyle = legC;
  if (opts.sit) {
    rr(ctx, -8, -18, 7, 12, 3); ctx.fill(); rr(ctx, 1, -18, 7, 12, 3); ctx.fill();
  } else if (side) {
    ctx.save(); ctx.translate(0, -18); ctx.rotate((sw * Math.PI) / 90); rr(ctx, -3.5, 0, 7, 17, 3); ctx.fill(); ctx.fillStyle = L.shoes; rr(ctx, -4 + flip * 1, 14, 9, 5, 2); ctx.fill(); ctx.restore();
    ctx.fillStyle = legC;
    ctx.save(); ctx.translate(0, -18); ctx.rotate((-sw * Math.PI) / 90); rr(ctx, -3.5, 0, 7, 17, 3); ctx.fill(); ctx.fillStyle = L.shoes; rr(ctx, -4 + flip * 1, 14, 9, 5, 2); ctx.fill(); ctx.restore();
  } else {
    rr(ctx, -8, -19 - Math.max(0, sw) * 0.3, 7, 18, 3); ctx.fill();
    rr(ctx, 1, -19 - Math.max(0, -sw) * 0.3, 7, 18, 3); ctx.fill();
    ctx.fillStyle = L.shoes;
    rr(ctx, -9, -4 - Math.max(0, sw) * 0.3, 9, 5, 2); ctx.fill();
    rr(ctx, 0, -4 - Math.max(0, -sw) * 0.3, 9, 5, 2); ctx.fill();
  }
  // bottom
  ctx.fillStyle = L.bottom;
  if (L.skirt) { ctx.beginPath(); ctx.moveTo(-10, -32); ctx.lineTo(10, -32); ctx.lineTo(14, -16); ctx.quadraticCurveTo(0, -12, -14, -16); ctx.closePath(); ctx.fill(); }
  else { rr(ctx, -10, -30, 20, 12, 4); ctx.fill(); }
  // back hair (long) when facing down/side
  const longH = L.hairStyle === 'long' || L.hairStyle === 'braid';
  if (longH && dir !== 3) { ctx.fillStyle = L.hair; rr(ctx, -15, -64, 30, 34, 10); ctx.fill(); }
  // backpack (visible from back)
  if (opts.backpack && dir === 3) { ctx.fillStyle = opts.backpack; rr(ctx, -10, -48, 20, 20, 5); ctx.fill(); }
  // torso
  ctx.fillStyle = L.top;
  rr(ctx, -11, -48, 22, 20, 7); ctx.fill();
  if (L.scarf) { ctx.fillStyle = L.scarf; rr(ctx, -8, -49, 16, 5, 2); ctx.fill(); }
  if (opts.backpack && dir !== 3) { ctx.strokeStyle = opts.backpack; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, -48); ctx.lineTo(-7, -32); ctx.moveTo(8, -48); ctx.lineTo(7, -32); ctx.stroke(); }
  // arms
  ctx.fillStyle = L.top;
  const as = mv ? sw * 0.6 : 0;
  if (side) {
    ctx.save(); ctx.translate(0, -45); ctx.rotate((-as * Math.PI) / 60); rr(ctx, -3, 0, 6, 15, 3); ctx.fill(); ctx.fillStyle = L.skin; ctx.beginPath(); ctx.arc(0, 16, 3, 0, 7); ctx.fill(); ctx.restore();
  } else {
    ctx.save(); ctx.translate(-13, -46); ctx.rotate((as * Math.PI) / 90); rr(ctx, -3, 0, 6, 15, 3); ctx.fill(); ctx.fillStyle = L.skin; ctx.beginPath(); ctx.arc(0, 16, 3, 0, 7); ctx.fill(); ctx.restore();
    ctx.fillStyle = L.top;
    ctx.save(); ctx.translate(13, -46); ctx.rotate(opts.wave ? -2.4 + Math.sin(phase * 2) * 0.4 : (-as * Math.PI) / 90); rr(ctx, -3, 0, 6, 15, 3); ctx.fill(); ctx.fillStyle = L.skin; ctx.beginPath(); ctx.arc(0, 16, 3, 0, 7); ctx.fill(); ctx.restore();
  }
  // head
  const hy = -64;
  ctx.fillStyle = L.skin;
  ctx.beginPath(); ctx.arc(0, hy, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = L.hair;
  if (dir === 3) {
    ctx.beginPath(); ctx.arc(0, hy - 1, 15.5, 0, Math.PI * 2); ctx.fill();
    if (longH) { rr(ctx, -15, hy, 30, 34, 10); ctx.fill(); }
    if (L.hairStyle === 'pony') { rr(ctx, -4, hy + 4, 8, 22, 4); ctx.fill(); }
  } else {
    ctx.beginPath();
    ctx.arc(0, hy - 2, 15.5, Math.PI, 0);
    if (side) ctx.lineTo(15 * -flip, hy + 6); else ctx.quadraticCurveTo(6, hy - 8, -2, hy - 6);
    ctx.closePath();
    ctx.fill();
    if (!side) { ctx.beginPath(); ctx.moveTo(-15, hy - 2); ctx.quadraticCurveTo(-8, hy - 12, 4, hy - 9); ctx.lineTo(-15, hy + 4); ctx.fill(); }
    if (L.hairStyle === 'pony' && side) { ctx.beginPath(); ctx.ellipse(-14 * flip, hy + 4, 5, 12, 0.3 * flip, 0, 7); ctx.fill(); }
  }
  if (L.hairStyle === 'bun') { ctx.beginPath(); ctx.arc(0, hy - 16, 6.5, 0, 7); ctx.fill(); }
  // face
  if (dir !== 3) {
    const ex = side ? 5 * flip : 0;
    ctx.fillStyle = '#2a1a3a';
    const blink = Math.sin(phase * 0.21) > 0.985;
    if (blink) { ctx.fillRect(ex - 7, hy + 1, 4, 1.5); ctx.fillRect(ex + 3, hy + 1, 4, 1.5); }
    else {
      ctx.beginPath(); ctx.ellipse(ex - 5, hy + 1, 2.2, 2.8, 0, 0, 7); ctx.ellipse(ex + 5, hy + 1, 2.2, 2.8, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex - 4.3, hy, 0.8, 0, 7); ctx.arc(ex + 5.7, hy, 0.8, 0, 7); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,120,160,.5)';
    ctx.beginPath(); ctx.ellipse(ex - 9, hy + 6, 3, 1.8, 0, 0, 7); ctx.ellipse(ex + 9, hy + 6, 3, 1.8, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#b03060'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(ex, hy + 6, 3, 0.2, Math.PI - 0.2); ctx.stroke();
    if (L.glasses) { ctx.strokeStyle = '#333'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(ex - 5, hy + 1, 4, 0, 7); ctx.moveTo(ex + 9, hy + 1); ctx.arc(ex + 5, hy + 1, 4, 0, 7); ctx.stroke(); }
    if (L.beard) { ctx.fillStyle = L.hair; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.arc(ex, hy + 7, 9, 0.1, Math.PI - 0.1); ctx.fill(); ctx.globalAlpha = 1; }
  }
  // hats
  if (L.hat === 'band') { ctx.strokeStyle = L.hatColor || '#ffd23f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, hy, 14, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
  if (L.hat === 'cap' || L.hat === 'pilot') { ctx.fillStyle = L.hatColor || '#333'; ctx.beginPath(); ctx.arc(0, hy - 6, 14, Math.PI, 0); ctx.fill(); ctx.fillRect(-15, hy - 7, 30, 4); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(0, hy - 13, 2.4, 0, 7); ctx.fill(); }
  if (L.hat === 'beret') { ctx.fillStyle = L.hatColor || '#c33'; ctx.beginPath(); ctx.ellipse(-3, hy - 13, 15, 6, -0.2, 0, 7); ctx.fill(); }
  ctx.restore();
  if (dir === 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); drawSuit(); ctx.restore();
  }
}

export function drawSign(ctx: CanvasRenderingContext2D, cx: number, cy: number, text: string, opts: { bg?: string; fg?: string; size?: number; hy?: string | null; icon?: string } = {}) {
  const size = opts.size ?? 16;
  ctx.font = `700 ${size}px ${FONT}`;
  const label = (opts.icon ? opts.icon + ' ' : '') + text;
  const w = ctx.measureText(label).width + 22;
  const h = size + 14;
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  rr(ctx, cx - w / 2 + 2, cy - h / 2 + 3, w, h, 8); ctx.fill();
  ctx.fillStyle = opts.bg ?? '#ffd23f';
  rr(ctx, cx - w / 2, cy - h / 2, w, h, 8); ctx.fill();
  ctx.fillStyle = opts.fg ?? '#2a1650';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, cy + 1);
  if (opts.hy) {
    ctx.font = `600 ${Math.round(size * 0.8)}px ${FONT_HY}`;
    const w2 = ctx.measureText(opts.hy).width + 16;
    ctx.fillStyle = '#ffffff';
    rr(ctx, cx - w2 / 2, cy + h / 2 + 4, w2, size + 8, 6); ctx.fill();
    ctx.strokeStyle = '#a24bd6'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#5a2a8a';
    ctx.fillText(opts.hy, cx, cy + h / 2 + 4 + (size + 8) / 2 + 1);
  }
  return { w, h };
}

export function bubble(ctx: CanvasRenderingContext2D, cx: number, cy: number, text: string, size = 13) {
  ctx.font = `600 ${size}px ${FONT}`;
  const w = ctx.measureText(text).width + 16, h = size + 12;
  ctx.fillStyle = '#fff';
  rr(ctx, cx - w / 2, cy - h, w, h, 8); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx - 5, cy); ctx.lineTo(cx + 5, cy); ctx.lineTo(cx, cy + 6); ctx.fill();
  ctx.strokeStyle = 'rgba(122,79,214,.5)'; ctx.lineWidth = 1.5; rr(ctx, cx - w / 2, cy - h, w, h, 8); ctx.stroke();
  ctx.fillStyle = '#3a1d6e'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy - h / 2 + 1);
}
