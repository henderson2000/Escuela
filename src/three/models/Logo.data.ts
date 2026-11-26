// Datos de Logo (partes, textos y cálculos) sin three.js: los usan las páginas de teoría y del taller,
// que así no tienen que esperar a que se descargue el 3D.
import { useSyncExternalStore } from 'react'

/* ================================================================== */
/* Estado de entradas/salidas del LOGO! (compartido con los controles) */
/* ================================================================== */

export type LogoProgram = 'directo' | 'and' | 'or' | 'auto'

export const LOGO_PROGRAMS: { value: LogoProgram; label: string; desc: string }[] = [
  { value: 'directo', label: 'Directo', desc: 'Q1 = I1, Q2 = I2, Q3 = I3, Q4 = I4. Cada salida copia a su entrada.' },
  { value: 'and', label: 'Y (AND)', desc: 'Q1 = I1 · I2: la salida se activa sólo si I1 Y I2 están en 1 (como dos contactos en serie).' },
  { value: 'or', label: 'O (OR)', desc: 'Q1 = I1 + I2: la salida se activa si I1 O I2 (o las dos) están en 1 (contactos en paralelo).' },
  { value: 'auto', label: 'Autorretención', desc: 'I1 = marcha, I2 = parada. Un toque en I1 enciende Q1 y queda encendida (se “retiene”) hasta que se toca I2. Q1 = (I1 + Q1) · ¬I2.' },
]

export interface LogoIO {
  /** entradas fijadas desde el panel de controles (interruptores) */
  sw: boolean[]
  /** pulsadores 3D apretados en este momento */
  held: boolean[]
  latch: boolean
  program: LogoProgram
}

export const fresh = (): LogoIO => ({ sw: Array(8).fill(false), held: Array(8).fill(false), latch: false, program: 'directo' })

export let io: LogoIO = fresh()

export const listeners = new Set<() => void>()

export const logoInputs = (s: LogoIO) => s.sw.map((v, i) => v || s.held[i])

export function logoOutputs(s: LogoIO): boolean[] {
  const I = logoInputs(s)
  switch (s.program) {
    case 'directo':
      return [I[0], I[1], I[2], I[3]]
    case 'and':
      return [I[0] && I[1], false, false, false]
    case 'or':
      return [I[0] || I[1], false, false, false]
    case 'auto':
      return [s.latch, false, false, false]
  }
}

export function commit(next: LogoIO) {
  // un ciclo de programa: con autorretención, Q1 = (I1 + Q1) · ¬I2 (gana la parada)
  const I = logoInputs(next)
  next.latch = next.program === 'auto' ? !I[1] && (I[0] || next.latch) : false
  io = next
  listeners.forEach((l) => l())
}

export const logoIO = {
  get: () => io,
  subscribe(l: () => void) {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
  toggle(n: number) {
    const sw = [...io.sw]
    sw[n] = !sw[n]
    commit({ ...io, sw })
  },
  hold(n: number, v: boolean) {
    if (io.held[n] === v) return
    const held = [...io.held]
    held[n] = v
    commit({ ...io, held })
  },
  setProgram(program: LogoProgram) {
    if (io.program === program) return
    commit({ ...io, program, latch: false })
  },
  clear() {
    commit({ ...fresh(), program: io.program })
  },
}

export const useLogoIO = () => useSyncExternalStore(logoIO.subscribe, logoIO.get, logoIO.get)

export const LAMP_COLOR_OPTIONS = [
  { value: 'verde', label: 'Verde', color: '#2fd655', off: '#1d5a2c' },
  { value: 'rojo', label: 'Rojo', color: '#ff2a1f', off: '#6e1712' },
  { value: 'amarillo', label: 'Amarillo', color: '#ffc21a', off: '#7a5d12' },
  { value: 'blanco', label: 'Blanco', color: '#f4f1e6', off: '#8d8b84' },
  { value: 'azul', label: 'Azul', color: '#3b8cff', off: '#1a3466' },
] as const
