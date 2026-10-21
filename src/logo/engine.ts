// Motor de simulación del LOGO! (diagrama de funciones / FUP).
//
// Un programa es una lista de bloques unidos por cables. Cada bloque tiene una sola salida
// y 0..4 entradas. La simulación funciona como el LOGO! real: en cada ciclo (10 ms) lee las
// entradas, ejecuta los bloques en orden y escribe las salidas.

export type BlockType =
  | 'I' // entrada física I1..I8
  | 'Q' // salida física Q1..Q8
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'NAND'
  | 'NOR'
  | 'XOR'
  | 'TON' // retardo a la conexión
  | 'TOF' // retardo a la desconexión
  | 'RS' // relé autoenclavador (set/reset)
  | 'RI' // relé de impulsos
  | 'GEN' // generador de impulsos asíncrono
  | 'CNT' // contador adelante/atrás

/** Tipo de dispositivo conectado a una entrada. */
export type InputDevice =
  | 'NA' // pulsador normal abierto
  | 'NC' // pulsador normal cerrado
  | 'INT' // interruptor (queda en la posición)
  | 'INT_NC' // contacto NC que queda accionado (hongo de seguridad, contacto auxiliar de guardamotor)

/** Qué hay conectado a una salida (sólo cambia el dibujo). */
export type OutputKind = 'lampara' | 'motor' | 'contactor' | 'sirena' | 'valvula'

export interface BlockParams {
  /** tiempo en ms (TON, TOF) */
  T?: number
  /** tiempo en alto y en bajo en ms (GEN) */
  TH?: number
  TL?: number
  /** umbrales del contador */
  on?: number
  off?: number
}

export interface Block {
  id: string
  type: BlockType
  x: number
  y: number
  /** número de entrada/salida (I1 → 1) */
  n?: number
  params?: BlockParams
  /** no se puede borrar ni cambiar el número (viene con el ejercicio) */
  locked?: boolean
}

export interface Wire {
  id: string
  from: string
  to: string
  /** índice de la entrada del bloque destino */
  pin: number
}

export interface InputConf {
  dev: InputDevice
  label: string
}
export interface OutputConf {
  kind: OutputKind
  label: string
  /** color de la lámpara */
  color?: string
}

export interface Program {
  blocks: Block[]
  wires: Wire[]
  /** qué hay conectado en cada borne (compartido por todos los bloques I/Q con ese número) */
  io: { I: Record<number, InputConf>; Q: Record<number, OutputConf> }
}

export interface BlockDef {
  type: BlockType
  name: string
  /** texto corto que va dentro del bloque */
  symbol: string
  pins: string[]
  group: 'io' | 'gf' | 'sf'
  desc: string
  defaults?: BlockParams
}

export const BLOCKS: Record<BlockType, BlockDef> = {
  I: { type: 'I', name: 'Entrada', symbol: 'I', pins: [], group: 'io', desc: 'Borne de entrada del LOGO! (pulsador, interruptor, sensor).' },
  Q: { type: 'Q', name: 'Salida', symbol: 'Q', pins: [''], group: 'io', desc: 'Borne de salida a relé (lámpara, contactor, motor…). Su estado también se puede usar como señal.' },
  AND: { type: 'AND', name: 'Y (AND)', symbol: '&', pins: ['', '', '', ''], group: 'gf', desc: 'La salida es 1 sólo si todas las entradas conectadas están en 1. Equivale a contactos en serie.' },
  OR: { type: 'OR', name: 'O (OR)', symbol: '≥1', pins: ['', '', '', ''], group: 'gf', desc: 'La salida es 1 si al menos una entrada está en 1. Equivale a contactos en paralelo.' },
  NOT: { type: 'NOT', name: 'Negación (NOT)', symbol: '1', pins: [''], group: 'gf', desc: 'Invierte la señal: si entra 1 sale 0 y al revés. Equivale a un contacto NC.' },
  NAND: { type: 'NAND', name: 'Y negada (NAND)', symbol: '&', pins: ['', '', '', ''], group: 'gf', desc: 'Es una AND con la salida invertida: da 0 sólo si todas las entradas están en 1.' },
  NOR: { type: 'NOR', name: 'O negada (NOR)', symbol: '≥1', pins: ['', '', '', ''], group: 'gf', desc: 'Es una OR con la salida invertida: da 1 sólo si todas las entradas están en 0.' },
  XOR: { type: 'XOR', name: 'O exclusiva (XOR)', symbol: '=1', pins: ['', ''], group: 'gf', desc: 'Da 1 cuando las dos entradas son distintas. Es la conmutación de una luz desde dos lugares.' },
  TON: { type: 'TON', name: 'Retardo a la conexión', symbol: 'TON', pins: ['Trg'], group: 'sf', desc: 'La salida se activa cuando la entrada Trg lleva el tiempo T en 1. Si Trg vuelve a 0, la salida se apaga.', defaults: { T: 3000 } },
  TOF: { type: 'TOF', name: 'Retardo a la desconexión', symbol: 'TOF', pins: ['Trg', 'R'], group: 'sf', desc: 'Con Trg en 1 la salida se activa. Cuando Trg pasa a 0, la salida sigue activa durante el tiempo T. R la apaga en el acto.', defaults: { T: 5000 } },
  RS: { type: 'RS', name: 'Relé autoenclavador (RS)', symbol: 'RS', pins: ['S', 'R'], group: 'sf', desc: 'S activa la salida y queda enclavada; R la desactiva. Si S y R están en 1 a la vez, gana R (se apaga).' },
  RI: { type: 'RI', name: 'Relé de impulsos', symbol: 'RI', pins: ['Trg', 'S', 'R'], group: 'sf', desc: 'Cada impulso en Trg cambia la salida (enciende / apaga). S la enciende y R la apaga siempre.' },
  GEN: { type: 'GEN', name: 'Generador de impulsos', symbol: 'GEN', pins: ['En', 'Inv'], group: 'sf', desc: 'Mientras En está en 1, la salida se prende TH y se apaga TL, una y otra vez (intermitente). Inv invierte la salida.', defaults: { TH: 500, TL: 500 } },
  CNT: { type: 'CNT', name: 'Contador adelante/atrás', symbol: '+/−', pins: ['R', 'Cnt', 'Dir'], group: 'sf', desc: 'Cuenta los impulsos en Cnt (Dir = 0 suma, Dir = 1 resta). La salida se activa al llegar al valor On y se desactiva por debajo de Off. R pone la cuenta en 0.', defaults: { on: 5, off: 0 } },
}

export const BLOCK_ORDER: BlockType[] = ['I', 'Q', 'AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'TON', 'TOF', 'RS', 'RI', 'GEN', 'CNT']

export const DEVICE_NAMES: Record<InputDevice, string> = {
  NA: 'Pulsador NA',
  NC: 'Pulsador NC',
  INT: 'Interruptor',
  INT_NC: 'Contacto NC con retención',
}

export const OUTPUT_NAMES: Record<OutputKind, string> = {
  lampara: 'Lámpara',
  motor: 'Motor (contactor)',
  contactor: 'Contactor',
  sirena: 'Sirena / bocina',
  valvula: 'Electroválvula',
}

/** Los pulsadores vuelven solos al soltarlos; los interruptores quedan. */
export const isMomentary = (d: InputDevice) => d === 'NA' || d === 'NC'

/** Señal que recibe el LOGO! según el dispositivo esté accionado o no. */
export const signalOf = (d: InputDevice, actuated: boolean) => (d === 'NC' || d === 'INT_NC' ? !actuated : actuated)

export const MAX_I = 8
export const MAX_Q = 8

export const blockLabel = (b: Block) => (b.type === 'I' || b.type === 'Q' ? `${b.type}${b.n ?? 1}` : BLOCKS[b.type].symbol)

export function emptyProgram(): Program {
  return { blocks: [], wires: [], io: { I: {}, Q: {} } }
}

export function inputConf(p: Program, n: number): InputConf {
  return p.io.I[n] ?? { dev: 'NA', label: '' }
}
export function outputConf(p: Program, n: number): OutputConf {
  return p.io.Q[n] ?? { kind: 'lampara', label: '' }
}

let seq = 0
export const newId = (prefix = 'b') => `${prefix}${Date.now().toString(36)}${(seq++).toString(36)}`

/* ------------------------------------------------------------------ simulación */

interface BlockState {
  q: number
  t: number
  prev: number[]
  cnt: number
}

export const SCAN_MS = 10

export class Simulation {
  /** estado físico de cada entrada: accionada o no */
  actuated: Record<number, boolean> = {}
  /** valor de salida de cada bloque */
  value: Record<string, number> = {}
  /** valor que llega a cada entrada de cada bloque (para pintar cables) */
  time = 0
  private st: Record<string, BlockState> = {}
  private order: Block[] = []
  private inputs: Record<string, (string | null)[]> = {}
  private prog: Program

  constructor(prog: Program) {
    this.prog = prog
    this.setProgram(prog)
  }

  /** Cambia el programa sin perder el estado de los bloques que siguen existiendo. */
  setProgram(prog: Program) {
    this.prog = prog
    const byId = new Map(prog.blocks.map((b) => [b.id, b]))
    this.inputs = {}
    for (const b of prog.blocks) this.inputs[b.id] = BLOCKS[b.type].pins.map(() => null)
    for (const w of prog.wires) {
      const pins = this.inputs[w.to]
      if (pins && byId.has(w.from) && w.pin < pins.length) pins[w.pin] = w.from
    }
    // orden: cada bloque después de los que lo alimentan (los lazos usan el valor del ciclo anterior)
    const seen = new Set<string>()
    const order: Block[] = []
    const visit = (id: string, stack: Set<string>) => {
      if (seen.has(id) || stack.has(id)) return
      stack.add(id)
      for (const src of this.inputs[id] ?? []) if (src) visit(src, stack)
      stack.delete(id)
      seen.add(id)
      const b = byId.get(id)
      if (b) order.push(b)
    }
    // las salidas Q se recorren primero para que el orden siga el flujo de la señal
    const roots = [...prog.blocks].sort((a, b) => (a.type === 'Q' ? 0 : 1) - (b.type === 'Q' ? 0 : 1) || a.y - b.y)
    for (const b of roots) visit(b.id, new Set())
    this.order = order
    for (const id of Object.keys(this.st)) if (!byId.has(id)) delete this.st[id]
    for (const id of Object.keys(this.value)) if (!byId.has(id)) delete this.value[id]
  }

  reset() {
    this.st = {}
    this.value = {}
    this.time = 0
    this.actuated = {}
  }

  /** Señal (0/1) en la entrada física n. */
  inputSignal(n: number): number {
    return signalOf(inputConf(this.prog, n).dev, !!this.actuated[n]) ? 1 : 0
  }

  /** Estado de la salida física n (0 si no hay bloque Q con ese número). */
  output(n: number): number {
    const b = this.prog.blocks.find((x) => x.type === 'Q' && (x.n ?? 1) === n)
    return b ? this.value[b.id] ?? 0 : 0
  }

  /** Valor actual del contador (para mostrarlo en el bloque). */
  count(id: string): number {
    return this.st[id]?.cnt ?? 0
  }
  /** Tiempo acumulado de un temporizador en ms. */
  elapsed(id: string): number {
    return this.st[id]?.t ?? 0
  }

  /** Ejecuta un ciclo del programa. */
  scan(dt = SCAN_MS) {
    this.time += dt
    for (const b of this.order) {
      const srcs = this.inputs[b.id] ?? []
      const vals = srcs.map((s) => (s ? this.value[s] ?? 0 : null))
      const st = (this.st[b.id] ??= { q: 0, t: 0, prev: vals.map(() => 0), cnt: 0 })
      const v = (i: number) => vals[i] ?? 0
      const rising = (i: number) => v(i) === 1 && (st.prev[i] ?? 0) === 0
      const conn = vals.filter((x): x is number => x !== null)
      const p = { ...BLOCKS[b.type].defaults, ...b.params }
      let q = 0
      switch (b.type) {
        case 'I':
          q = this.inputSignal(b.n ?? 1)
          break
        case 'Q':
          q = v(0)
          break
        case 'AND':
          q = conn.length > 0 && conn.every((x) => x === 1) ? 1 : 0
          break
        case 'NAND':
          q = conn.length > 0 && !conn.every((x) => x === 1) ? 1 : 0
          break
        case 'OR':
          q = conn.some((x) => x === 1) ? 1 : 0
          break
        case 'NOR':
          q = conn.length > 0 && !conn.some((x) => x === 1) ? 1 : 0
          break
        case 'XOR':
          q = conn.length > 0 && conn.filter((x) => x === 1).length % 2 === 1 ? 1 : 0
          break
        case 'NOT':
          q = conn.length > 0 && conn[0] === 0 ? 1 : 0
          break
        case 'TON':
          if (v(0)) {
            st.t = Math.min(st.t + dt, p.T ?? 0)
            q = st.t >= (p.T ?? 0) ? 1 : 0
          } else {
            st.t = 0
            q = 0
          }
          break
        case 'TOF':
          if (v(1)) {
            st.t = 0
            q = 0
          } else if (v(0)) {
            st.t = 0
            q = 1
          } else if (st.q) {
            st.t += dt
            q = st.t >= (p.T ?? 0) ? 0 : 1
            if (!q) st.t = 0
          }
          break
        case 'RS':
          q = v(1) ? 0 : v(0) ? 1 : st.q
          break
        case 'RI':
          q = v(2) ? 0 : v(1) ? 1 : rising(0) ? 1 - st.q : st.q
          break
        case 'GEN': {
          if (!v(0)) {
            st.t = 0
            q = 0
            break
          }
          const th = Math.max(SCAN_MS, p.TH ?? 500)
          const tl = Math.max(SCAN_MS, p.TL ?? 500)
          const pos = st.t % (th + tl)
          st.t += dt
          q = pos < th ? 1 : 0
          if (v(1)) q = 1 - q
          break
        }
        case 'CNT': {
          if (v(0)) {
            st.cnt = 0
            q = 0
            break
          }
          if (rising(1)) st.cnt = Math.max(0, st.cnt + (v(2) ? -1 : 1))
          const on = p.on ?? 5
          const off = p.off ?? 0
          if (on >= off) q = st.cnt >= on ? 1 : st.cnt < off ? 0 : st.q
          else q = st.cnt >= on && st.cnt < off ? 1 : 0
          break
        }
      }
      st.q = q
      st.prev = vals.map((x) => x ?? 0)
      this.value[b.id] = q
    }
  }

  /** Avanza el tiempo (en ms) ejecutando ciclos. */
  run(ms: number, each?: () => void) {
    const n = Math.max(1, Math.round(ms / SCAN_MS))
    for (let i = 0; i < n; i++) {
      this.scan()
      each?.()
    }
  }
}

/* ------------------------------------------------------------------ pruebas automáticas */

/** Un paso de una prueba de secuencia. */
export interface Step {
  /** accionar (true) o soltar (false) dispositivos de entrada */
  set?: Record<number, boolean>
  /** pulsar y soltar una entrada (dura 200 ms en total) */
  press?: number | number[]
  /** esperar este tiempo (ms) */
  wait?: number
  /** estado esperado de las salidas después del paso */
  expect?: Record<number, 0 | 1>
  /** las salidas indicadas tienen que titilar durante `blink` ms (al menos 2 cambios) */
  blink?: { q: number[]; ms: number }
  /** cuenta cuántas veces se prende una salida durante `ms`: tiene que estar entre min y max */
  edges?: { q: number; ms: number; min: number; max: number }
  /** texto para explicar al alumno qué se estaba probando */
  msg?: string
}

export interface TestSpec {
  /** prueba combinacional: se prueban todas las combinaciones de estas entradas */
  truth?: { inputs: number[]; outputs: Record<number, (v: Record<number, number>) => number> }
  /** prueba de secuencia (se puede tener más de una, cada una arranca de cero) */
  sequences?: Step[][]
  /** salidas que nunca pueden estar activas a la vez (enclavamiento) */
  never?: number[][]
  /** bloques que el programa tiene que usar */
  requires?: BlockType[]
}

export interface TestResult {
  ok: boolean
  message: string
}

const qName = (prog: Program, n: number) => {
  const c = prog.io.Q[n]
  return c?.label ? `Q${n} (${c.label})` : `Q${n}`
}
const iName = (prog: Program, n: number) => {
  const c = prog.io.I[n]
  return c?.label ? `I${n} (${c.label})` : `I${n}`
}

export function runTests(prog: Program, spec: TestSpec): TestResult {
  for (const t of spec.requires ?? []) {
    if (!prog.blocks.some((b) => b.type === t))
      return { ok: false, message: `El ejercicio pide usar el bloque «${BLOCKS[t].name}». Agregalo a tu programa.` }
  }
  const outs = new Set<number>()
  if (spec.truth) Object.keys(spec.truth.outputs).forEach((k) => outs.add(Number(k)))
  spec.sequences?.forEach((seqs) => seqs.forEach((s) => Object.keys(s.expect ?? {}).forEach((k) => outs.add(Number(k)))))
  for (const n of outs) {
    if (!prog.blocks.some((b) => b.type === 'Q' && (b.n ?? 1) === n)) return { ok: false, message: `Falta la salida ${qName(prog, n)} en el programa.` }
  }

  if (spec.truth) {
    const { inputs, outputs } = spec.truth
    for (let combo = 0; combo < 1 << inputs.length; combo++) {
      const sim = new Simulation(prog)
      const vals: Record<number, number> = {}
      inputs.forEach((n, i) => {
        const bit = (combo >> (inputs.length - 1 - i)) & 1
        vals[n] = bit
        // en una prueba combinacional se fija la SEÑAL de la entrada (no el dispositivo)
        const dev = inputConf(prog, n).dev
        sim.actuated[n] = signalOf(dev, true) ? bit === 1 : bit === 0
      })
      sim.run(100)
      for (const [k, f] of Object.entries(outputs)) {
        const want = f(vals)
        const got = sim.output(Number(k))
        if (want !== got) {
          const cond = inputs.map((n) => `I${n} = ${vals[n]}`).join(', ')
          return { ok: false, message: `Con ${cond}, ${qName(prog, Number(k))} debería ser ${want} y tu programa da ${got}.` }
        }
      }
    }
  }

  for (const steps of spec.sequences ?? []) {
    const sim = new Simulation(prog)
    sim.run(100)
    let broken: string | null = null
    const watch = () => {
      if (broken) return
      for (const group of spec.never ?? []) {
        if (group.every((n) => sim.output(n) === 1)) broken = `${group.map((n) => qName(prog, n)).join(' y ')} nunca pueden estar activas al mismo tiempo.`
      }
    }
    const done: string[] = []
    for (const s of steps) {
      if (s.set) Object.entries(s.set).forEach(([k, v]) => (sim.actuated[Number(k)] = v))
      if (s.press !== undefined) {
        const list = Array.isArray(s.press) ? s.press : [s.press]
        list.forEach((n) => (sim.actuated[n] = true))
        sim.run(100, watch)
        list.forEach((n) => (sim.actuated[n] = false))
        sim.run(100, watch)
      }
      if (s.blink) {
        const prev: Record<number, number> = {}
        const changes: Record<number, number> = {}
        s.blink.q.forEach((n) => ((prev[n] = sim.output(n)), (changes[n] = 0)))
        sim.run(s.blink.ms, () => {
          watch()
          s.blink!.q.forEach((n) => {
            const o = sim.output(n)
            if (o !== prev[n]) changes[n]++
            prev[n] = o
          })
        })
        for (const n of s.blink.q) {
          if (changes[n] < 2) return { ok: false, message: `${s.msg ? s.msg + ': ' : ''}${qName(prog, n)} tendría que titilar (prender y apagar) y no lo hace.` }
        }
      }
      if (s.edges) {
        const e = s.edges
        let prev = sim.output(e.q)
        let rises = 0
        sim.run(e.ms, () => {
          watch()
          const o = sim.output(e.q)
          if (o && !prev) rises++
          prev = o
        })
        if (rises < e.min || rises > e.max)
          return {
            ok: false,
            message: `${s.msg ? s.msg + ': ' : ''}en ${fmtTime(e.ms)} ${qName(prog, e.q)} se prendió ${rises} ${rises === 1 ? 'vez' : 'veces'} y tendría que prenderse entre ${e.min} y ${e.max}. Revisá los tiempos.`,
          }
      }
      if (s.wait) sim.run(s.wait, watch)
      if (broken) return { ok: false, message: broken }
      for (const [k, want] of Object.entries(s.expect ?? {})) {
        const got = sim.output(Number(k))
        if (got !== want) {
          const ctx = s.msg ?? describeStep(prog, s, done)
          return {
            ok: false,
            message: `${ctx}: ${qName(prog, Number(k))} debería estar ${want ? 'ACTIVADA (1)' : 'APAGADA (0)'} y en tu programa está ${got ? 'activada' : 'apagada'}.`,
          }
        }
      }
      done.push(describeStep(prog, s, []))
    }
  }
  return { ok: true, message: '¡Funciona! Tu programa pasó todas las pruebas.' }
}

function describeStep(prog: Program, s: Step, _done: string[]): string {
  const parts: string[] = []
  if (s.press !== undefined) {
    const list = Array.isArray(s.press) ? s.press : [s.press]
    parts.push(`Al pulsar ${list.map((n) => iName(prog, n)).join(' y ')}`)
  }
  if (s.set) {
    for (const [k, v] of Object.entries(s.set)) parts.push(`${v ? 'Al accionar' : 'Al soltar'} ${iName(prog, Number(k))}`)
  }
  if (s.wait) parts.push(`después de ${fmtTime(s.wait)}`)
  return parts.join(', ') || 'Al arrancar'
}

export function fmtTime(ms: number): string {
  if (ms >= 60000 && ms % 60000 === 0) return `${ms / 60000} min`
  const s = ms / 1000
  return `${Number.isInteger(s) ? s : s.toFixed(2).replace(/0$/, '').replace('.', ',')} s`
}
