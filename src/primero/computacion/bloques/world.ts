// Mundo de los bloques: un robot en una grilla junta tornillos, limpia aceite y llega a la meta.

export type Dir = 0 | 1 | 2 | 3 // 0 = derecha, 1 = abajo, 2 = izquierda, 3 = arriba
export const DX = [1, 0, -1, 0]
export const DY = [0, 1, 0, -1]

export interface MapState {
  w: number
  h: number
  walls: Set<string>
  screws: Set<string>
  oil: Set<string>
  goal: string | null
  x: number
  y: number
  dir: Dir
}

const key = (x: number, y: number) => `${x},${y}`

/**
 * Mapas como texto: . vacío · # caja · T tornillo · A aceite · M meta · > v < ^ robot (y su dirección).
 */
export function parseMap(rows: string[]): MapState {
  const s: MapState = { w: Math.max(...rows.map((r) => r.length)), h: rows.length, walls: new Set(), screws: new Set(), oil: new Set(), goal: null, x: 0, y: 0, dir: 0 }
  rows.forEach((r, y) =>
    [...r].forEach((c, x) => {
      const k = key(x, y)
      if (c === '#') s.walls.add(k)
      else if (c === 'T') s.screws.add(k)
      else if (c === 'A') s.oil.add(k)
      else if (c === 'M') s.goal = k
      else if ('>v<^'.includes(c)) {
        s.x = x
        s.y = y
        s.dir = '>v<^'.indexOf(c) as Dir
      }
    }),
  )
  return s
}

export const cloneState = (s: MapState): MapState => ({ ...s, walls: new Set(s.walls), screws: new Set(s.screws), oil: new Set(s.oil) })

export function wallAhead(s: MapState): boolean {
  const nx = s.x + DX[s.dir]
  const ny = s.y + DY[s.dir]
  return nx < 0 || ny < 0 || nx >= s.w || ny >= s.h || s.walls.has(key(nx, ny))
}
export const screwHere = (s: MapState) => s.screws.has(key(s.x, s.y))
export const oilHere = (s: MapState) => s.oil.has(key(s.x, s.y))
export const atGoal = (s: MapState) => s.goal === key(s.x, s.y)
export const cellKey = key

export type ToolboxBlock =
  | 'avanzar'
  | 'girar_izq'
  | 'girar_der'
  | 'juntar'
  | 'limpiar'
  | 'repetir'
  | 'si'
  | 'si_sino'
  | 'repetir_hasta'
  | 'mientras'
  | 'no'
  | 'hay_tornillo'
  | 'hay_aceite'
  | 'hay_pared'
  | 'en_meta'
  | 'variables'
  | 'decir'
  | 'procedimiento'

export interface Level {
  id: string
  n: number
  title: string
  concept: string
  /** qué hay que hacer */
  goal: string
  /** explicación corta del concepto nuevo */
  learn: string
  hint: string
  toolbox: ToolboxBlock[]
  /** mapas en los que se prueba el programa (tiene que andar en todos) */
  maps: string[][]
  /** máximo de bloques permitidos (sin contar «al empezar») */
  maxBlocks?: number
  /** el programa tiene que decir este número (por mapa): nivel de variables */
  say?: (m: MapState) => number
  /** se juntan todos los tornillos / se limpia todo el aceite / se llega a la meta (según lo que haya en el mapa) */
}

export const LEVELS: Level[] = [
  {
    id: 'b1',
    n: 1,
    title: 'Primeros pasos',
    concept: 'Secuencia de instrucciones',
    goal: 'Llevá al robot hasta el tornillo y juntalo.',
    learn: 'Un programa es una secuencia de instrucciones que se ejecutan en orden, de arriba hacia abajo, empezando por «al empezar».',
    hint: 'Avanzá tres veces y después juntá.',
    toolbox: ['avanzar', 'juntar'],
    maps: [['>..T.']],
  },
  {
    id: 'b2',
    n: 2,
    title: 'Doblar la esquina',
    concept: 'Secuencia con giros',
    goal: 'Llegá a la meta 🏁. Las cajas no se pueden atravesar.',
    learn: 'El robot gira sobre sí mismo: «girar a la derecha» y «girar a la izquierda» cambian hacia dónde mira, no lo mueven.',
    hint: 'Avanzá 2, girá a la derecha, avanzá 2.',
    toolbox: ['avanzar', 'girar_izq', 'girar_der'],
    maps: [['>..#', '##.#', '##M#']],
  },
  {
    id: 'b3',
    n: 3,
    title: 'Juntar de a varios',
    concept: 'Algoritmo',
    goal: 'Juntá los tres tornillos.',
    learn: 'Un algoritmo es como una receta: pasos definidos que llevan a un resultado. Pensá el camino antes de armarlo.',
    hint: 'Avanzá y juntá cada vez que estés sobre un tornillo; para subir, girá a la izquierda.',
    toolbox: ['avanzar', 'girar_izq', 'girar_der', 'juntar'],
    maps: [['..T..', '.....', '>T..T']],
  },
  {
    id: 'b4',
    n: 4,
    title: 'Repetir',
    concept: 'Repetición simple',
    goal: 'Juntá los 7 tornillos usando como máximo 4 bloques.',
    learn: 'Con «repetir N veces» no hace falta escribir lo mismo una y otra vez: se indica con un número cuántas veces se repite.',
    hint: 'Repetir 7 veces: avanzar y juntar.',
    toolbox: ['avanzar', 'juntar', 'repetir'],
    maps: [['>TTTTTTT']],
    maxBlocks: 4,
  },
  {
    id: 'b5',
    n: 5,
    title: 'La escalera',
    concept: 'Repetición con varias instrucciones',
    goal: 'Subí la escalera hasta la meta con 6 bloques como máximo.',
    learn: 'Adentro de un «repetir» puede haber varias instrucciones: se repite el grupo completo.',
    hint: 'Cada escalón es: girar a la izquierda, avanzar, girar a la derecha, avanzar.',
    toolbox: ['avanzar', 'girar_izq', 'girar_der', 'repetir'],
    maps: [['....M', '....#', '...##', '..###', '>####']],
    maxBlocks: 6,
  },
  {
    id: 'b6',
    n: 6,
    title: '¿Hay tornillo?',
    concept: 'Condicional simple',
    goal: 'Recorré la fila y juntá los tornillos. Ojo: el programa se prueba en 3 filas distintas.',
    learn: 'Con «si … entonces» el robot pregunta algo: si la condición es verdadera hace lo de adentro; si es falsa, sigue de largo.',
    hint: 'Repetir 6 veces: avanzar y, si hay tornillo, juntar.',
    toolbox: ['avanzar', 'juntar', 'repetir', 'si', 'hay_tornillo'],
    maps: [['>T.T..T'], ['>.TT.T.'], ['>..T..T']],
  },
  {
    id: 'b7',
    n: 7,
    title: 'Tornillo o aceite',
    concept: 'Condicional doble (si / si no)',
    goal: 'En cada casilla hay un tornillo o una mancha de aceite 🛢️: juntá los tornillos y limpiá el aceite.',
    learn: '«si … si no» elige entre dos caminos: uno cuando la condición se cumple y otro cuando no.',
    hint: 'Repetir 5 veces: avanzar; si hay tornillo, juntar; si no, limpiar.',
    toolbox: ['avanzar', 'juntar', 'limpiar', 'repetir', 'si_sino', 'hay_tornillo'],
    maps: [['>TAATA'], ['>ATTAT'], ['>AAATT']],
  },
  {
    id: 'b8',
    n: 8,
    title: '¿Hasta cuándo?',
    concept: 'Repetición condicional',
    goal: 'Llegá a la meta. El pasillo tiene un largo distinto en cada prueba.',
    learn: '«repetir hasta que …» repite mientras la condición sea falsa y se detiene cuando se cumple. ¡Cuidado con la condición de corte: si nunca se cumple, el bucle es infinito!',
    hint: 'Repetir hasta que llegue a la meta: avanzar.',
    toolbox: ['avanzar', 'repetir', 'repetir_hasta', 'en_meta'],
    maps: [['>..M'], ['>......M'], ['>.........M']],
  },
  {
    id: 'b9',
    n: 9,
    title: 'Pasillo con sorpresas',
    concept: 'Repetición condicional + condicional',
    goal: 'Llegá a la meta juntando todos los tornillos del camino.',
    learn: 'Las estructuras se pueden combinar: una pregunta adentro de una repetición.',
    hint: 'Repetir hasta que llegue a la meta: avanzar y, si hay tornillo, juntar.',
    toolbox: ['avanzar', 'juntar', 'repetir', 'repetir_hasta', 'si', 'hay_tornillo', 'en_meta'],
    maps: [['>.T..TM'], ['>T.T.T..T.M'], ['>..TM']],
  },
  {
    id: 'b10',
    n: 10,
    title: 'Contar tornillos',
    concept: 'Variables',
    goal: 'Recorré el pasillo, juntá los tornillos y al final decí cuántos juntaste.',
    learn: 'Una variable es una caja con nombre que guarda un valor que puede cambiar. Empezá en 0 y sumale 1 cada vez que juntes.',
    hint: 'Poner tornillos a 0; repetir hasta la meta: avanzar; si hay tornillo: juntar y sumar 1 a tornillos. Al final: decir tornillos.',
    toolbox: ['avanzar', 'juntar', 'repetir_hasta', 'si', 'hay_tornillo', 'en_meta', 'variables', 'decir'],
    maps: [['>T.T..TM'], ['>..T.M'], ['>TTT.T.TT.M']],
    say: (m) => m.screws.size,
  },
  {
    id: 'b11',
    n: 11,
    title: 'Mis propios bloques',
    concept: 'Procedimientos',
    goal: 'Juntá las tres filas de tornillos con 14 bloques como máximo.',
    learn: 'Un procedimiento es un bloque propio con nombre: se define una vez y se usa todas las veces que haga falta. Divide el programa en partes más chicas.',
    hint: 'Definí «juntar fila» (repetir 4: avanzar y juntar) y usalo 3 veces. Entre fila y fila: girar, avanzar y girar otra vez.',
    toolbox: ['avanzar', 'juntar', 'girar_izq', 'girar_der', 'repetir', 'procedimiento'],
    maps: [['>TTTT', 'TTTT.', '.TTTT']],
    maxBlocks: 14,
  },
  {
    id: 'b12',
    n: 12,
    title: 'Desafío final: el laberinto',
    concept: 'Todo junto',
    goal: 'Llegá a la meta en los dos laberintos con el mismo programa.',
    learn: 'Para resolver problemas grandes se combinan todas las herramientas: repetición condicional, decisiones y sensores.',
    hint: 'Repetir hasta que llegue a la meta: si hay pared adelante, girar a la derecha; si no, avanzar.',
    toolbox: ['avanzar', 'girar_izq', 'girar_der', 'repetir', 'repetir_hasta', 'si', 'si_sino', 'no', 'hay_pared', 'en_meta'],
    maps: [
      ['>....', '####.', '..M#.', '.###.', '.....'],
      ['>..#', '##.#', '##.#', 'M..#'],
    ],
  },
]

export const getLevel = (id?: string) => LEVELS.find((l) => l.id === id)
export const levelActivityId = (id: string) => `c1-bloques-${id}`
