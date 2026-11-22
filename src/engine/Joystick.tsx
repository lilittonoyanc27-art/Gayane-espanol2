import { useRef, useState } from 'react';
import { input } from './input';

export function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const pid = useRef<number | null>(null);
  const move = (cx: number, cy: number) => {
    const r = base.current!.getBoundingClientRect();
    const R = r.width / 2;
    let dx = cx - (r.left + R), dy = cy - (r.top + R);
    const m = Math.hypot(dx, dy);
    if (m > R) { dx = (dx / m) * R; dy = (dy / m) * R; }
    setKnob({ x: dx, y: dy });
    input.joy.x = dx / R; input.joy.y = dy / R; input.joy.active = true;
  };
  const end = () => { pid.current = null; setKnob({ x: 0, y: 0 }); input.joy.x = 0; input.joy.y = 0; input.joy.active = false; };
  return (
    <div className="joy" ref={base}
      onPointerDown={(e) => { pid.current = e.pointerId; (e.target as HTMLElement).setPointerCapture(e.pointerId); move(e.clientX, e.clientY); }}
      onPointerMove={(e) => { if (pid.current === e.pointerId) move(e.clientX, e.clientY); }}
      onPointerUp={end} onPointerCancel={end}>
      <div className="joy-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}
