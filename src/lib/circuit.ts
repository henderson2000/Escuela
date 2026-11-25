// Análisis de conexiones para el juego de la protoboard.
// Cada "terminal" (orificio de la protoboard o pin del Arduino) pertenece a un nodo.
// Los cables unen nodos. Después se verifica que los componentes formen el circuito pedido.

export type CompKind =
  | 'cable'
  | 'resistencia'
  | 'led'
  | 'pulsador'
  | 'potenciometro'
  | 'ldr'
  | 'buzzer'
  | 'servo'
  | 'ultrasonico'
  | 'transistor'
  | 'diodo'
  | 'capacitor'
  | 'motor'
  | 'rgb'
  | 'display7'
  | 'lm35'

export interface Placed {
  id: string
  kind: CompKind
  /** terminales donde está conectada cada pata (en orden) */
  legs: string[]
  color?: string
  value?: number
}

/** patas de cada componente, en el orden en que se colocan */
export const LEG_NAMES: Record<CompKind, string[]> = {
  cable: ['extremo 1', 'extremo 2'],
  resistencia: ['pata 1', 'pata 2'],
  led: ['ánodo (+, pata larga)', 'cátodo (−, pata corta)'],
  pulsador: ['pata 1', 'pata 2'],
  potenciometro: ['extremo 1', 'cursor (medio)', 'extremo 3'],
  ldr: ['pata 1', 'pata 2'],
  buzzer: ['pata + (larga)', 'pata −'],
  // los módulos se enchufan en una fila: se elige sólo el primer orificio
  servo: ['GND (marrón)', '5V (rojo)', 'señal (naranja)'],
  ultrasonico: ['VCC', 'Trig', 'Echo', 'GND'],
  transistor: ['colector (C)', 'base (B)', 'emisor (E)'],
  diodo: ['ánodo (+)', 'cátodo (−, lado de la franja)'],
  capacitor: ['pata + (larga)', 'pata − (franja)'],
  motor: ['borne + (rojo)', 'borne − (negro)'],
  rgb: ['rojo (R)', 'cátodo común (−, la más larga)', 'verde (G)', 'azul (B)'],
  // display de cátodo común: fila de arriba g f COM a b · fila de abajo e d COM c dp
  display7: ['g', 'f', 'COM', 'a', 'b', 'e', 'd', 'COM', 'c', 'dp'],
  lm35: ['+Vs (5 V)', 'Vout (salida)', 'GND'],
}

/**
 * Cómo se enchufa cada componente cuando se coloca solo (estilo Tinkercad): columnas que ocupa cada pata
 * a partir de la primera, en la misma fila. El display va a caballo de la canaleta central (filas f y e).
 */
export const PLACE_COLS: Record<Exclude<CompKind, 'cable'>, number[]> = {
  resistencia: [0, 4],
  led: [0, 1],
  pulsador: [0, 2],
  potenciometro: [0, 1, 2],
  ldr: [0, 3],
  buzzer: [0, 3],
  servo: [0, 1, 2],
  ultrasonico: [0, 1, 2, 3],
  transistor: [0, 1, 2],
  diodo: [0, 4],
  capacitor: [0, 2],
  motor: [0, 3],
  rgb: [0, 1, 2, 3],
  display7: [0, 1, 2, 3, 4, 0, 1, 2, 3, 4],
  lm35: [0, 1, 2],
}

/** Módulos que ocupan orificios seguidos de una misma fila (se coloca con un solo clic). */
export const ROW_MODULES: Partial<Record<CompKind, number>> = { servo: 3, ultrasonico: 4 }

class DSU {
  parent = new Map<string, string>()
  find(x: string): string {
    if (!this.parent.has(x)) this.parent.set(x, x)
    let r = x
    while (this.parent.get(r) !== r) r = this.parent.get(r)!
    this.parent.set(x, r)
    return r
  }
  union(a: string, b: string) {
    this.parent.set(this.find(a), this.find(b))
  }
}

export interface Netlist {
  net: (terminal: string) => string
  same: (a: string, b: string) => boolean
}

/**
 * terminalNode: convierte un terminal (ej "a12" o "ard:GND2") en su nodo físico
 * (la tira de la protoboard o el pin del Arduino).
 */
export function buildNetlist(placed: Placed[], terminalNode: (t: string) => string): Netlist {
  const d = new DSU()
  for (const p of placed) {
    if (p.kind === 'cable' && p.legs.length === 2) d.union(terminalNode(p.legs[0]), terminalNode(p.legs[1]))
  }
  const net = (t: string) => d.find(terminalNode(t))
  return { net, same: (a, b) => net(a) === net(b) }
}

/** Un tramo de un circuito en serie: componente con terminal de entrada y de salida. */
interface Seg {
  comp: Placed
  /** si el componente tiene polaridad, no se puede dar vuelta */
  polar: boolean
}

/**
 * ¿Existe un orden de los componentes que forme una cadena en serie desde `start` hasta `end`?
 * Las resistencias y pulsadores se pueden dar vuelta; los LEDs no (ánodo → cátodo).
 */
export function seriesChain(nl: Netlist, startNet: string, endNet: string, segs: Seg[]): boolean {
  const perms = permutations(segs)
  for (const order of perms) {
    const flips = 1 << order.length
    for (let f = 0; f < flips; f++) {
      let cur = startNet
      let ok = true
      const visited = new Set([startNet])
      for (let k = 0; k < order.length; k++) {
        const s = order[k]
        let a = nl.net(s.comp.legs[0])
        let b = nl.net(s.comp.legs[s.comp.legs.length - 1])
        if (f & (1 << k)) {
          if (s.polar) {
            ok = false
            break
          }
          ;[a, b] = [b, a]
        }
        if (a !== cur || a === b) {
          ok = false
          break
        }
        cur = b
        const last = k === order.length - 1
        if (!last && (visited.has(cur) || cur === endNet)) {
          ok = false
          break
        }
        visited.add(cur)
      }
      if (ok && cur === endNet) return true
    }
  }
  return false
}

function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr]
  const out: T[][] = []
  arr.forEach((x, i) => {
    for (const rest of permutations([...arr.slice(0, i), ...arr.slice(i + 1)])) out.push([x, ...rest])
  })
  return out
}

export const seg = (comp: Placed): Seg => ({ comp, polar: comp.kind === 'led' })
