// Análisis de conexiones para el juego de la protoboard.
// Cada "terminal" (orificio de la protoboard o pin del Arduino) pertenece a un nodo.
// Los cables unen nodos. Después se verifica que los componentes formen el circuito pedido.

export type CompKind = 'cable' | 'resistencia' | 'led' | 'pulsador' | 'potenciometro'

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
}

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
