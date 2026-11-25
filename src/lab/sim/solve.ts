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
  /** temperatura del ambiente para el LM35 (°C) */
  temp?: number
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
const BETA = 150 // ganancia de corriente del transistor (BC547 / 2N2222)
const R_SAT = 2 // transistor saturado: casi un cortocircuito entre colector y emisor
const R_MOTOR = 25 // motor de juguete de 3-6 V en marcha
/** segmentos del display en el orden de sus patas */
export const SEG_LEGS = ['g', 'f', 'COM', 'a', 'b', 'e', 'd', 'COM', 'c', 'dp']
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

export function simulate({ placed, terminalNode, pins, pressed, pots, light = 60, temp = 25 }: SimInputs): SimResult {
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

  // diodos: LEDs, diodos, cada color del LED RGB, cada segmento del display y la juntura base-emisor
  const ledIdx: { id: string; p: Placed; a: string; c: string; vf: number; on: boolean }[] = []
  const trans: { id: string; c: string; e: string; be: string; sat: boolean; ib: number }[] = []
  const lm: { vs: string; out: string; g: string; on: boolean }[] = []
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
    } else if (p.kind === 'led') ledIdx.push({ id: p.id, p, a: ns[0], c: ns[1], vf: ledVf(p.color), on: false })
    else if (p.kind === 'diodo') ledIdx.push({ id: p.id, p, a: ns[0], c: ns[1], vf: 0.7, on: false })
    else if (p.kind === 'rgb')
      (
        [
          ['r', 0, 2.0],
          ['g', 2, 3.0],
          ['b', 3, 3.0],
        ] as const
      ).forEach(([k, i, vf]) => ledIdx.push({ id: `${p.id}:${k}`, p, a: ns[i], c: ns[1], vf, on: false }))
    else if (p.kind === 'display7') {
      // los dos COM están unidos por dentro
      elems.push({ a: ns[2], b: ns[7], g: 1e3, j: 0 })
      SEG_LEGS.forEach((seg, i) => {
        if (seg !== 'COM') ledIdx.push({ id: `${p.id}:${seg}`, p, a: ns[i], c: ns[2], vf: 2.0, on: false })
      })
    } else if (p.kind === 'transistor') {
      const be = `${p.id}:be`
      ledIdx.push({ id: be, p, a: ns[1], c: ns[2], vf: 0.65, on: false })
      trans.push({ id: p.id, c: ns[0], e: ns[2], be, sat: false, ib: 0 })
    } else if (p.kind === 'motor') elems.push({ a: ns[0], b: ns[1], g: 1 / R_MOTOR, j: 0 })
    else if (p.kind === 'lm35') {
      elems.push({ a: ns[0], b: ns[2], g: 1 / 80000, j: 0 })
      lm.push({ vs: ns[0], out: ns[1], g: ns[2], on: false })
    }
    // capacitor: en continua no deja pasar corriente (queda abierto)
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
    for (const t of trans) {
      // saturado: llave cerrada · activo: fuente de corriente Ic = β·Ib (de colector a emisor)
      if (t.sat) all.push({ a: t.c, b: t.e, g: 1 / R_SAT, j: 0 })
      else all.push({ a: t.c, b: t.e, g: G_OPEN, j: -BETA * t.ib })
    }
    // LM35: 10 mV por °C en la salida (si tiene alimentación)
    for (const m of lm) if (m.on) all.push({ a: m.out, b: m.g, g: 1 / 80, j: (temp * 0.01) / 80 })
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

  const vOf = (n: string) => V.get(n) ?? 0
  for (let it = 0; it < 80; it++) {
    solve()
    let changed = false
    for (const m of lm) {
      const on = vOf(m.vs) - vOf(m.g) > 4
      if (on !== m.on) {
        m.on = on
        changed = true
      }
    }
    for (const t of trans) {
      const be = ledIdx.find((l) => l.id === t.be)!
      const ib = be.on ? Math.max(0, (vOf(be.a) - vOf(be.c) - be.vf) / R_LED_ON) : 0
      if (Math.abs(ib - t.ib) > 1e-7 + t.ib * 0.002) {
        t.ib = ib
        changed = true
      }
      const vce = vOf(t.c) - vOf(t.e)
      if (!t.sat && t.ib > 0 && vce < 0.2) {
        t.sat = true
        changed = true
      } else if (t.sat && (t.ib === 0 || vce / R_SAT > BETA * t.ib * 1.001)) {
        t.sat = false
        changed = true
      }
    }
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
    leds[l.id] = {
      id: l.id,
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
    if (p.kind !== 'buzzer' && p.kind !== 'servo' && p.kind !== 'ultrasonico' && p.kind !== 'motor' && p.kind !== 'lm35' && p.kind !== 'transistor') continue
    const ns = p.legs.map(nl.net)
    const v = (n: string) => V.get(n) ?? 0
    if (p.kind === 'lm35') {
      modules[p.id] = { id: p.id, powered: v(ns[0]) - v(ns[2]) > 4, volts: v(ns[1]) - v(ns[2]), nets: ns }
      continue
    }
    if (p.kind === 'transistor') {
      const t = trans.find((x) => x.id === p.id)!
      // volts = corriente de colector (A); powered = saturado (llave cerrada)
      const ic = t.sat ? Math.max(0, (v(ns[0]) - v(ns[2])) / R_SAT) : BETA * t.ib
      modules[p.id] = { id: p.id, powered: t.sat, volts: ic, nets: ns }
      continue
    }
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
