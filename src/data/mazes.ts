import type { L } from '../types';
import { p } from '../types';

/**
 * Legend:  # wall   . floor   S start   A-F gates (see gates)   1-4 teleport pairs (elevator/escalator)
 *          L locked door (opens after puzzle P solved)   P puzzle kiosk   % secret passage (looks like wall)
 *          N staff with hint   s sign (see signs, in order)   k water/plant decoration (solid)
 */
export type MazeDef = {
  id: number;
  name: L;
  grid: string[];
  gates: Record<string, string>;
  target: string; // gate letter
  change?: { to: string; when: number }; // B1: gate change when within N tiles of target
  hints: L[];
  signs: L[];
  tp: Record<string, L>;
  puzzle?: { q: L; opts: L[]; ok: number };
  floors?: { y0: number; y1: number; x0: number; x1: number; name: L; tint: string }[];
  time: number; // seconds for 3 stars
  intro: L;
};

export const MAZES: MazeDef[] = [
  {
    id: 1, name: p('Pasillo de las puertas B|B դարպասների միջանցք'), time: 45,
    intro: p('Busca la puerta B12. Sigue todo recto y gira a la derecha.|Գտիր B12 դարպասը։ Գնա ուղիղ և թեքվիր աջ։'),
    grid: [
      '####################',
      '#A.....#....#.....B#',
      '#......#....#......#',
      '#..##..#.s..#..##..#',
      '#......#....#......#',
      '#..............N...#',
      '#S.................#',
      '#..............#####',
      '#..###..###....#...#',
      '#..#C#..#.#........#',
      '#.......#.#....#...#',
      '####################',
    ],
    gates: { A: 'B10', B: 'B12', C: 'B11' }, target: 'B',
    hints: [p('La puerta B12 está arriba, a la derecha.|B12 դարպասը վերևում է՝ աջ կողմում։')],
    signs: [p('B10 ← · B12 →|B10 ← · B12 →')], tp: {},
  },
  {
    id: 2, name: p('Los pasillos de colores|Գունավոր միջանցքները'), time: 60,
    intro: p('Busca la puerta B14. Gira a la izquierda y sigue las señales.|Գտիր B14 դարպասը։ Թեքվիր ձախ և հետևիր նշաններին։'),
    grid: [
      '########################',
      '#B.....#.......#......A#',
      '#......#.......#.......#',
      '###.####...s...####.####',
      '#......................#',
      '#.####.#####.####.####.#',
      '#.#..........N.......#.#',
      '#.#.######.#####.###.#.#',
      '#...#C...#.....#...#...#',
      '#####....#..S..#.......#',
      '#........#.....#...D...#',
      '########################',
    ],
    gates: { A: 'B13', B: 'B14', C: 'B15', D: 'B16' }, target: 'B',
    hints: [p('Gira a la izquierda y sube por el pasillo. La B14 está arriba a la izquierda.|Թեքվիր ձախ և բարձրացիր միջանցքով։ B14-ը վերևում է՝ ձախ կողմում։')],
    signs: [p('← B14 · B13 →|← B14 · B13 →')], tp: {},
  },
  {
    id: 3, name: p('El ascensor mágico|Կախարդական վերելակը'), time: 75,
    intro: p('Busca la puerta B18 en la segunda planta. El ascensor está a la derecha.|Գտիր B18 դարպասը երկրորդ հարկում։ Վերելակը աջ կողմում է։'),
    grid: [
      '######################',
      '#C......#.....#.....A#',
      '#.......#.....#......#',
      '#.......#..s..#......#',
      '#..1.............N...#',
      '#....................#',
      '######################',
      '#....................#',
      '#.S...........N....1.#',
      '#.......#.....#......#',
      '#..B....#..s..#......#',
      '######################',
    ],
    floors: [{ x0: 0, x1: 22, y0: 0, y1: 6, name: p('Segunda planta|Երկրորդ հարկ'), tint: '#ffe3f0' }, { x0: 0, x1: 22, y0: 6, y1: 12, name: p('Planta baja|Առաջին հարկ'), tint: '#e8f7ff' }],
    gates: { A: 'B17', B: 'B19', C: 'B18' }, target: 'C',
    hints: [p('El ascensor está a la derecha. Sube a la segunda planta.|Վերելակը աջ կողմում է։ Բարձրացիր երկրորդ հարկ։'), p('Ahora gira a la izquierda. La B18 está al final del pasillo.|Հիմա թեքվիր ձախ։ B18-ը միջանցքի վերջում է։')],
    signs: [p('Segunda planta: B17, B18 ↑|Երկրորդ հարկ՝ B17, B18 ↑'), p('Ascensor →|Վերելակ →')],
    tp: { '1': p('Ascensor|Վերելակ') },
  },
  {
    id: 4, name: p('La puerta cerrada|Փակ դուռը'), time: 90,
    intro: p('Busca la puerta B21. Hay una puerta cerrada: resuelve el enigma para abrirla.|Գտիր B21 դարպասը։ Կա փակ դուռ՝ լուծիր հանելուկը այն բացելու համար։'),
    grid: [
      '########################',
      '#S.....#..........#...A#',
      '#......#..####....L....#',
      '#..##..#..#..#....#....#',
      '#..##.....#..#..N.######',
      '#.........#P.#.........#',
      '####.######..######....#',
      '#.......#..........#...#',
      '#.B.....#...s......#.C.#',
      '#.......#..........#...#',
      '#..................#...#',
      '########################',
    ],
    gates: { A: 'B21', B: 'B20', C: 'B22' }, target: 'A',
    hints: [p('La puerta B21 está detrás de la puerta cerrada. Busca la máquina del enigma.|B21 դարպասը փակ դռան հետևում է։ Գտիր հանելուկի սարքը։')],
    signs: [p('B20 ← · B22 →|B20 ← · B22 →')], tp: {},
    puzzle: { q: p('¿Cómo se dice «աջ» en español?|Ինչպե՞ս է իսպաներեն «աջ»։'), opts: [p('derecha|աջ'), p('izquierda|ձախ'), p('recto|ուղիղ')], ok: 0 },
  },
  {
    id: 5, name: p('El pasillo secreto|Գաղտնի միջանցքը'), time: 100,
    intro: p('Busca la puerta B25. Un empleado conoce un pasillo secreto.|Գտիր B25 դարպասը։ Աշխատակիցներից մեկը գաղտնի միջանցք գիտի։'),
    grid: [
      '##########################',
      '#S.......#.......#.......#',
      '#........#...s...#...N...#',
      '#..####..#.......#.......#',
      '#..#..#..####.####.......#',
      '#..#..#..................#',
      '#..#2.#..######.##########',
      '#.......N.#...#.#........#',
      '#######.###.L.#.#..C.....#',
      '#.........#...#.#........#',
      '#.P.......#...%.#....2...#',
      '#.........#.A.#.#........#',
      '##########################',
    ],
    gates: { A: 'B25', C: 'B24' }, target: 'A',
    hints: [p('Sigue todo recto y baja por el pasillo de la izquierda.|Գնա ուղիղ և իջիր ձախ միջանցքով։'), p('Hay un pasillo secreto en la pared, a la derecha de la puerta B25. ¡Empújala!|Պատում գաղտնի միջանցք կա՝ B25 դարպասից աջ։ Հրիր այն։')],
    signs: [p('B24 → · B25 ↓|B24 → · B25 ↓')],
    tp: { '2': p('Escalera mecánica|Շարժասանդուղք') },
    puzzle: { q: p('¿Qué significa «Sube a la segunda planta»?|Ի՞նչ է նշանակում «Sube a la segunda planta»։'), opts: [p('Բարձրացիր երկրորդ հարկ|Բարձրացիր երկրորդ հարկ'), p('Իջիր առաջին հարկ|Իջիր առաջին հարկ'), p('Թեքվիր ձախ|Թեքվիր ձախ')], ok: 0 },
  },
  {
    id: 6, name: p('¡Cambio de puerta!|Դարպասի փոփոխություն'), time: 110,
    intro: p('Busca la puerta B30. ¡Atención a los anuncios: la puerta puede cambiar!|Գտիր B30 դարպասը։ Ուշադրություն հայտարարություններին՝ դարպասը կարող է փոխվել։'),
    grid: [
      '##########################',
      '#A.......#.......#......B#',
      '#........#...s...#.......#',
      '#..####..#.......#..###..#',
      '#..#..#......N......#C#..#',
      '#..#..#..####.####..#.#..#',
      '#.................1......#',
      '#..######.###.######.###.#',
      '#.......#.....#..........#',
      '#.S.....#.....#.....N....#',
      '#....1..#..L..#..........#',
      '#.......#..P..#...E......#',
      '##########################',
    ],
    gates: { A: 'B30', B: 'B32', C: 'B31', E: 'B33' }, target: 'A', change: { to: 'B', when: 4 },
    hints: [p('Sube por la escalera y gira a la izquierda.|Բարձրացիր սանդուղքով և թեքվիր ձախ։'), p('Si cambia la puerta, mira el cartel y sigue todo recto a la derecha.|Եթե դարպասը փոխվի, նայիր ցուցանակին և գնա ուղիղ դեպի աջ։')],
    signs: [p('B30 ← · B32 →|B30 ← · B32 →')],
    tp: { '1': p('Escalera mecánica|Շարժասանդուղք') },
    puzzle: { q: p('¿Qué significa «Sigue todo recto»?|Ի՞նչ է նշանակում «Sigue todo recto»։'), opts: [p('Գնա ուղիղ|Գնա ուղիղ'), p('Կանգնիր|Կանգնիր'), p('Վերադարձիր|Վերադարձիր')], ok: 0 },
  },
];
