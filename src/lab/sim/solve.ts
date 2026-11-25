// Simulador eléctrico de corriente continua de la mesa de trabajo.
// Cada tira de la protoboard / pin del Arduino unidos por cables forman un nodo. Se resuelve la tensión de
// cada nodo con análisis nodal (las fuentes de 5 V, 3,3 V y GND son nodos fijos). Los LEDs son diodos:
// conducen recién cuando la tensión supera su Vf (se itera hasta que el estado de cada LED es estable).

import { buildNetlist, type Placed } from '../../lib/circuit'

export type PinModeName = 'OUTPUT' | 'INPUT' | 'INPUT_PULLUP'

export interface PinState {
  mode: PinModeName
  /** 0 = LOW, 1 = HIGH; entre 0 y 1 = PWM (analogWrite) */
  value: number
}

export interface SimInputs {
  placed: Placed[]
  terminalNode: (t: string) => string
  pins: Record<string, PinState>
  /** pulsadores apretados (id del componente) */
  pressed: Set<string>
  /** posición de la perilla de cada potenciómetro (0 a 1) */
  pots: Record<string, number>
  /** luz ambiente para las LDR, de 0 (oscuro) a 100 (pleno sol) */
  light?: number
}

/** LDR GL5528: ~1 MΩ en oscuridad, ~200 Ω a pleno sol (aproximación logarítmica). */
export function ldrResistance(lightPct: number): number {
  const lg = 6 - (Math.min(100, Math.max(0, lightPct)) / 100) * (6 - Math.log10(200))
  return Math.round(10 ** lg)
}

/** Estado de un módulo o actuador (buzzer, servo, ultrasónico). */
export interface ModuleResult {
  id: string
  /** tiene 5 V entre sus patas de alimentación */
  powered: boolean
  /** tensión sobre el buzzer */
  volts: number
  /** nodo de cada pata */
  nets: string[]
}

export interface LedResult {
  id: string
  current: number
  /** brillo 0 a 1 (ya contempla el PWM) */
  brightness: number
  vf: number
  reversed: boolean
  burnt: boolean
  /** fracción de tiempo encendido si lo maneja un pin con PWM (1 = siempre) */
  duty: number
  /** resistencia en serie y tensión de la fuente, si se pueden identificar (para mostrar la cuenta) */
  series?: { r: number; vsrc: number }
}

export interface SimResult {
  ok: boolean
  short: boolean
  voltage: (terminal: string) => number
  leds: Record<string, LedResult>
  /** corriente que entrega cada pin de salida (A) */
  pinCurrent: Record<string, number>
  netOf: (terminal: string) => string
  modules: Record<string, ModuleResult>
}

/** Tensión directa típica según el color del LED. */
export function ledVf(color?: string): number {
  const c = (color ?? '').toLowerCase()
  if (c.includes('2aff5a') || c.includes('green') || c.includes('verde')) return 2.2
  if (c.includes('ffd21a') || c.includes('yellow') || c.includes('amar')) return 2.1
  if (c.includes('2a6bff') || c.includes('blue') || c.includes('azul') || c.includes('fff')) return 3.0
  return 2.0
}

const R_PIN = 25 // resistencia interna aproximada de un pin de salida
const R_PULLUP = 35000
const R_LED_ON = 12
const G_OPEN = 1e-12

export const PIN_NUMBER: Record<string, number> = {
  ...Object.fromEntries(Array.from({ length: 14 }, (_, i) => [String(i), i])),
  A0: 14,
  A1: 15,
  A2: 16,
  A3: 17,
  A4: 18,
  A5: 19,
}

export function simulate({ placed, terminalNode, pins, pressed, pots, light = 60 }: SimInputs): SimResult {
  const nl = buildNetlist(placed, terminalNode)
  const gnd = nl.net('ard:GND')
  const v5 = nl.net('ard:5V')
  const v33 = nl.net('ard:3.3V')
  const short = gnd === v5 || gnd === v33 || v5 === v33

  // nodos fijos
  const fixed = new Map<string, number>([[gnd, 0]])
  if (!short) {
    fixed.set(v5, 5)
    fixed.set(v33, 3.3)
  }

  // elementos de dos terminales: conductancia g entre a y b + corriente inyectada (de b hacia a dentro del elemento)
  interface Elem {
    a: string
    b: string
    g: number
    /** corriente (A) que el elemento inyecta en el nodo a y saca del nodo b */
    j: number
  }
  const elems: Elem[] = []
  const nets = new Set<string>()
  const addNet = (n: string) => nets.add(n)

  // pines del Arduino
  const pinNet: Record<string, string> = {}
  for (const [name, st] of Object.entries(pins)) {
    const n = nl.net('ard:' + name)
    pinNet[name] = n
    addNet(n)
    if (st.mode === 'OUTPUT') elems.push({ a: n, b: gnd, g: 1 / R_PIN, j: (st.value > 0 ? 5 : 0) / R_PIN })
    else if (st.mode === 'INPUT_PULLUP' && !short) elems.push({ a: n, b: v5, g: 1 / R_PULLUP, j: 0 })
  }

  const ledIdx: { p: Placed; a: string; c: string; vf: number; on: boolean }[] = []
  for (const p of placed) {
    if (p.kind === 'cable') continue
    const ns = p.legs.map(nl.net)
    ns.forEach(addNet)
    if (p.kind === 'resistencia') elems.push({ a: ns[0], b: ns[1], g: 1 / Math.max(p.value ?? 220, 0.1), j: 0 })
    else if (p.kind === 'pulsador') elems.push({ a: ns[0], b: ns[1], g: pressed.has(p.id) ? 1e3 : G_OPEN, j: 0 })
    else if (p.kind === 'potenciometro') {
      const R = p.value ?? 10000
      // perilla al 100 %: el cursor queda pegado al extremo 1
      const pos = Math.min(1, Math.max(0, pots[p.id] ?? 0.5))
      elems.push({ a: ns[0], b: ns[1], g: 1 / Math.max(1, (1 - pos) * R), j: 0 })
      elems.push({ a: ns[1], b: ns[2], g: 1 / Math.max(1, pos * R), j: 0 })
    } else if (p.kind === 'led') ledIdx.push({ p, a: ns[0], c: ns[1], vf: ledVf(p.color), on: false })
    else if (p.kind === 'ldr') elems.push({ a: ns[0], b: ns[1], g: 1 / ldrResistance(light), j: 0 })
    // buzzer activo: consume unos 30 mA a 5 V
    else if (p.kind === 'buzzer') elems.push({ a: ns[0], b: ns[1], g: 1 / 170, j: 0 })
    // módulos: sólo la carga de su alimentación (servo GND-5V-señal · ultrasónico VCC-Trig-Echo-GND)
    else if (p.kind === 'servo') elems.push({ a: ns[1], b: ns[0], g: 1 / 500, j: 0 })
    else if (p.kind === 'ultrasonico') elems.push({ a: ns[0], b: ns[3], g: 1 / 330, j: 0 })
  }
  nets.add(gnd)
  if (!short) {
    nets.add(v5)
    nets.add(v33)
  }

  const unknown = [...nets].filter((n) => !fixed.has(n))
  const index = new Map(unknown.map((n, i) => [n, i]))
  let V = new Map<string, number>()

  const solve = () => {
    const N = unknown.length
    const A = Array.from({ length: N }, () => new Float64Array(N))
    const B = new Float64Array(N)
    const all: Elem[] = [...elems]
    for (const l of ledIdx) {
      // encendido: I = (Va − Vc − Vf) / R  →  g = 1/R y j = Vf/R
      if (l.on) all.push({ a: l.a, b: l.c, g: 1 / R_LED_ON, j: l.vf / R_LED_ON })
      else all.push({ a: l.a, b: l.c, g: G_OPEN, j: 0 })
    }
    for (let i = 0; i < N; i++) A[i][i] += G_OPEN
    for (const e of all) {
      const ia = index.get(e.a)
      const ib = index.get(e.b)
      const fa = fixed.get(e.a)
      const fb = fixed.get(e.b)
      // corriente del elemento de a hacia b: I = g (Va − Vb) − j
      if (ia !== undefined) {
        A[ia][ia] += e.g
        if (ib !== undefined) A[ia][ib] -= e.g
        else if (fb !== undefined) B[ia] += e.g * fb
        B[ia] += e.j
      }
      if (ib !== undefined) {
        A[ib][ib] += e.g
        if (ia !== undefined) A[ib][ia] -= e.g
        else if (fa !== undefined) B[ib] += e.g * fa
        B[ib] -= e.j
      }
    }
    const x = gauss(A, B)
    V = new Map(fixed)
    unknown.forEach((n, i) => V.set(n, x[i]))
  }

  for (let it = 0; it < 30; it++) {
    solve()
    let changed = false
    for (const l of ledIdx) {
      const vd = (V.get(l.a) ?? 0) - (V.get(l.c) ?? 0)
      const cur = (vd - l.vf) / R_LED_ON
      if (!l.on && vd > l.vf + 1e-6) {
        l.on = true
        changed = true
      } else if (l.on && cur < 0) {
        l.on = false
        changed = true
      }
    }
    if (!changed) break
  }

  const leds: Record<string, LedResult> = {}
  for (const l of ledIdx) {
    const va = V.get(l.a) ?? 0
    const vc = V.get(l.c) ?? 0
    const current = l.on ? Math.max(0, (va - vc - l.vf) / R_LED_ON) : 0
    // PWM: si el LED depende de un pin con analogWrite, el brillo se reduce en la misma proporción
    let duty = 1
    for (const [name, st] of Object.entries(pins))
      if (st.mode === 'OUTPUT' && st.value > 0 && st.value < 1 && (pinNet[name] === l.a || pinNet[name] === l.c || connectedThroughOne(l, pinNet[name]))) duty = st.value
    leds[l.p.id] = {
      id: l.p.id,
      current,
      brightness: Math.min(1, current / 0.012) * duty,
      vf: l.vf,
      reversed: !l.on && vc - va > 1,
      burnt: current > 0.03,
      duty,
      series: seriesInfo(l),
    }
  }

  function connectedThroughOne(l: { a: string; c: string }, pn: string) {
    return placed.some((p) => p.kind === 'resistencia' && p.legs.map(nl.net).includes(pn) && p.legs.map(nl.net).some((n) => n === l.a || n === l.c))
  }

  function seriesInfo(l: { p: Placed; a: string; c: string }): LedResult['series'] {
    for (const r of placed) {
      if (r.kind !== 'resistencia') continue
      const [n1, n2] = r.legs.map(nl.net)
      for (const [shared, other] of [
        [n1, n2],
        [n2, n1],
      ])
        // GND/5V no cuentan: muchas cosas comparten esos nodos sin estar en serie con el LED
        if ((shared === l.a || shared === l.c) && !fixed.has(shared)) {
          const ledOther = shared === l.a ? l.c : l.a
          const hi = Math.max(V.get(other) ?? 0, V.get(ledOther) ?? 0)
          const lo = Math.min(V.get(other) ?? 0, V.get(ledOther) ?? 0)
          return { r: r.value ?? 220, vsrc: hi - lo }
        }
    }
    return undefined
  }

  const pinCurrent: Record<string, number> = {}
  for (const [name, st] of Object.entries(pins)) {
    if (st.mode !== 'OUTPUT') continue
    const vout = st.value > 0 ? 5 : 0
    pinCurrent[name] = (vout - (V.get(pinNet[name]) ?? 0)) / R_PIN
  }

  const modules: Record<string, ModuleResult> = {}
  for (const p of placed) {
    if (p.kind !== 'buzzer' && p.kind !== 'servo' && p.kind !== 'ultrasonico') continue
    const ns = p.legs.map(nl.net)
    const v = (n: string) => V.get(n) ?? 0
    const [vcc, g] = p.kind === 'servo' ? [ns[1], ns[0]] : p.kind === 'ultrasonico' ? [ns[0], ns[3]] : [ns[0], ns[1]]
    const volts = v(vcc) - v(g)
    modules[p.id] = { id: p.id, powered: volts > 4, volts, nets: ns }
  }

  return {
    ok: !short,
    short,
    voltage: (t) => V.get(nl.net(t)) ?? 0,
    leds,
    pinCurrent,
    netOf: nl.net,
    modules,
  }
}

/** Eliminación gaussiana con pivoteo parcial. */
function gauss(A: Float64Array[], B: Float64Array): number[] {
  const n = B.length
  const M = A.map((r) => Float64Array.from(r))
  const b = Float64Array.from(B)
  for (let c = 0; c < n; c++) {
    let p = c
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r
    if (p !== c) {
      ;[M[p], M[c]] = [M[c], M[p]]
      ;[b[p], b[c]] = [b[c], b[p]]
    }
    const d = M[c][c] || 1e-18
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / d
      if (!f) continue
      for (let k = c; k < n; k++) M[r][k] -= f * M[c][k]
      b[r] -= f * b[c]
    }
  }
  const x = new Array<number>(n).fill(0)
  for (let r = n - 1; r >= 0; r--) {
    let s = b[r]
    for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]
    x[r] = s / (M[r][r] || 1e-18)
  }
  return x
}
