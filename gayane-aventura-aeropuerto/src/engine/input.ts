export const input = {
  keys: new Set<string>(),
  joy: { x: 0, y: 0, active: false },
  actionQueued: false,
};
let bound = false;
export function bindKeys() {
  if (bound) return;
  bound = true;
  window.addEventListener('keydown', (e) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const k = e.key.toLowerCase();
    input.keys.add(k);
    if (k === 'e' || k === ' ' || k === 'enter') {
      if (k === ' ' || k === 'enter') { if ((e.target as HTMLElement)?.tagName !== 'BUTTON') e.preventDefault(); }
      if (k === ' ' && (e.target as HTMLElement)?.tagName === 'BUTTON') return;
      input.actionQueued = true;
    }
    if (k.startsWith('arrow')) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => input.keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => input.keys.clear());
}
export function axis() {
  const k = input.keys;
  let x = 0, y = 0;
  if (k.has('a') || k.has('arrowleft') || k.has('ф')) x -= 1;
  if (k.has('d') || k.has('arrowright') || k.has('в')) x += 1;
  if (k.has('w') || k.has('arrowup') || k.has('ц')) y -= 1;
  if (k.has('s') || k.has('arrowdown') || k.has('ы')) y += 1;
  let run = k.has('shift');
  if (input.joy.active) {
    x = input.joy.x; y = input.joy.y;
    run = Math.hypot(x, y) > 0.92;
  }
  const m = Math.hypot(x, y);
  if (m > 1) { x /= m; y /= m; }
  return { x, y, run };
}
