// Geometría y conexiones internas de una protoboard.
// Unidades: 1 = 10 mm. Separación entre orificios = 2,54 mm.

export const PITCH = 0.254

export type RowName = 'T+' | 'T-' | 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'B-' | 'B+'

/** posición de cada fila sobre el eje z, en "pasos" */
export const ROW_Z: Record<RowName, number> = {
  'T+': -8.5,
  'T-': -7.5,
  j: -5.5,
  i: -4.5,
  h: -3.5,
  g: -2.5,
  f: -1.5,
  e: 1.5,
  d: 2.5,
  c: 3.5,
  b: 4.5,
  a: 5.5,
  'B-': 7.5,
  'B+': 8.5,
}

export const RAIL_ROWS: RowName[] = ['T+', 'T-', 'B-', 'B+']
export const MAIN_ROWS: RowName[] = ['j', 'i', 'h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']

export interface Hole {
  id: string // ej: "a12", "T+3"
  row: RowName
  col: number // 1..N
  x: number
  z: number
  /** tira metálica a la que pertenece: todos los orificios con la misma tira están conectados */
  strip: string
}

export function stripOf(row: RowName, col: number): string {
  if (RAIL_ROWS.includes(row)) return `riel ${row}`
  return ['a', 'b', 'c', 'd', 'e'].includes(row) ? `col ${col} (a-e)` : `col ${col} (f-j)`
}

export function buildHoles(cols: number): Hole[] {
  const holes: Hole[] = []
  const x0 = -((cols - 1) / 2) * PITCH
  for (let c = 1; c <= cols; c++) {
    const x = x0 + (c - 1) * PITCH
    for (const row of MAIN_ROWS) {
      holes.push({ id: `${row}${c}`, row, col: c, x, z: ROW_Z[row] * PITCH, strip: stripOf(row, c) })
    }
    // los rieles vienen en grupos de 5 con un hueco entre grupos
    if ((c - 1) % 6 !== 5 && c > 1 && c < cols) {
      for (const row of RAIL_ROWS) {
        holes.push({ id: `${row}${c}`, row, col: c, x, z: ROW_Z[row] * PITCH, strip: stripOf(row, c) })
      }
    }
  }
  return holes
}

export function boardSize(cols: number) {
  return { width: (cols + 2) * PITCH, depth: 19.5 * PITCH, height: 0.85 }
}

export function describeHole(h: Hole): string {
  if (RAIL_ROWS.includes(h.row)) {
    const sign = h.row.endsWith('+') ? 'positivo (+)' : 'negativo (−)'
    return `Riel ${sign} ${h.row.startsWith('T') ? 'superior' : 'inferior'}`
  }
  return `Fila ${h.row}, columna ${h.col}`
}
