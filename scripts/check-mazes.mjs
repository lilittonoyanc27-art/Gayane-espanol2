// Validates that every maze is solvable: BFS with teleports, secret passages, door opened after reaching P.
import fs from 'fs';
const src = fs.readFileSync(new URL('../src/data/mazes.ts', import.meta.url), 'utf8');
const blocks = [...src.matchAll(/grid: \[([\s\S]*?)\]/g)].map((m) => [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1]));
const targets = [...src.matchAll(/target: '(\w)'/g)].map((m) => m[1]);
const gatesL = [...src.matchAll(/gates: \{([^}]*)\}/g)].map((m) => Object.fromEntries([...m[1].matchAll(/(\w): '(\w+)'/g)].map((x) => [x[2], x[1]])));
const changes = [...src.matchAll(/id: (\d+)[\s\S]*?(?=id: \d+|$)/g)].map((m) => { const c = m[0].match(/change: \{ to: '(\w)'/); return c ? c[1] : null; });
let ok = true;
blocks.forEach((g, i) => {
  const H = g.length, W = g[0].length;
  if (!g.every((r) => r.length === W)) { console.log(`maze ${i + 1}: ragged rows`, g.map((r) => r.length)); ok = false; }
  const find = (ch) => { const out = []; g.forEach((r, y) => [...r].forEach((c, x) => c === ch && out.push([x, y]))); return out; };
  const bfs = (from, doorOpen) => {
    const seen = new Set([from.join()]); const q = [from];
    while (q.length) {
      const [x, y] = q.shift();
      const c = g[y][x];
      const nb = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
      if ('1234'.includes(c)) { const o = find(c).find(([a, b]) => a !== x || b !== y); if (o) nb.push(o); }
      for (const [nx, ny] of nb) {
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const cc = g[ny][nx];
        if (cc === '#' || cc === 'k' || (cc === 'L' && !doorOpen)) continue;
        // gates, P, N, s are interactable: reachable when adjacent; treat as reachable target but N/s solid
        const k = nx + ',' + ny; if (seen.has(k)) continue; seen.add(k);
        if ('NsP'.includes(cc) || /[A-F]/.test(cc)) continue; // solid
        q.push([nx, ny]);
      }
    }
    return seen;
  };
  const S = find('S')[0];
  const hasP = find('P').length > 0;
  const r1 = bfs(S, false);
  const pReach = !hasP || find('P').every(([x, y]) => r1.has(x + ',' + y));
  const r2 = bfs(S, pReach);
  const tgt = targets[i];
  const tPos = find(tgt)[0];
  const reach = tPos && r2.has(tPos.join());
  let chg = true;
  if (changes[i]) { const c = find(changes[i])[0]; chg = c && r2.has(c.join()); }
  console.log(`maze ${i + 1}: ${W}x${H} target ${tgt} reachable=${reach} puzzle=${pReach} change=${chg}`);
  if (!reach || !pReach || !chg) ok = false;
});
process.exit(ok ? 0 : 1);
