import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { Link, Navigate, useParams } from 'react-router-dom'
import { buildNetlist } from '../../lib/circuit'
import { BULBS, isDone, markActivity, useStore } from '../../lib/scores'
import { MISSIONS, missionActivityId, type Mission, type Sample } from './missions'
import { LabScene, type CameraRequest, type ViewName } from '../LabScene'
import { BreadboardBody } from '../../three/models/Breadboard'
import { ArduinoModel, arduinoPinPositions } from '../../three/models/Arduino'
import { Label } from '../../three/Label'
import { ARD_POS, COLS, HEADER_TOP, PlacedItem, USABLE_PINS, describePin } from '../../games/BreadboardGame'
import { boardSize, buildHoles, describeHole } from '../../lib/breadboard'
import { LEG_NAMES, ROW_MODULES, type CompKind, type Placed } from '../../lib/circuit'
import { BenchItem } from './BenchItems'
import { CodeEditor } from '../../compu/CodeEditor'
import { compileArduino, type CompileError } from '../arduino/compile'
import { ArduinoRunner, type BoardIO } from '../arduino/runtime'
import { ldrResistance, simulate, type PinModeName, type PinState, type SimResult } from '../sim/solve'
import { EXAMPLES, WIRE_COLORS } from './examples'
import { useSub } from '../../lib/nav'
import '../lab.css'
import './bench.css'

const TOP = boardSize(COLS).height / 2
const STORE = 'its-mesa-3ro-v1'

interface Tool {
  kind: CompKind
  label: string
  value?: number
  color?: string
  group: string
}

const BLUE = '#2a6bff'
const TOOLS: Tool[] = [
  { kind: 'cable', label: 'Rojo', color: WIRE_COLORS.rojo, group: 'Cables' },
  { kind: 'cable', label: 'Negro', color: WIRE_COLORS.negro, group: 'Cables' },
  { kind: 'cable', label: 'Amarillo', color: WIRE_COLORS.amarillo, group: 'Cables' },
  { kind: 'cable', label: 'Azul', color: WIRE_COLORS.azul, group: 'Cables' },
  { kind: 'cable', label: 'Verde', color: WIRE_COLORS.verde, group: 'Cables' },
  { kind: 'resistencia', label: '220 Ω', value: 220, group: 'Resistencias' },
  { kind: 'resistencia', label: '330 Ω', value: 330, group: 'Resistencias' },
  { kind: 'resistencia', label: '1 kΩ', value: 1000, group: 'Resistencias' },
  { kind: 'resistencia', label: '10 kΩ', value: 10000, group: 'Resistencias' },
  { kind: 'led', label: 'Rojo', color: '#ff2a2a', group: 'LEDs' },
  { kind: 'led', label: 'Verde', color: '#2aff5a', group: 'LEDs' },
  { kind: 'led', label: 'Amarillo', color: '#ffd21a', group: 'LEDs' },
  { kind: 'led', label: 'Azul', color: BLUE, group: 'LEDs' },
  { kind: 'pulsador', label: 'Pulsador', group: 'Entradas' },
  { kind: 'potenciometro', label: 'Potenciómetro 10 kΩ', value: 10000, group: 'Entradas' },
  { kind: 'ldr', label: 'LDR (sensor de luz)', group: 'Sensores y actuadores' },
  { kind: 'ultrasonico', label: 'Ultrasónico HC-SR04', group: 'Sensores y actuadores' },
  { kind: 'buzzer', label: 'Buzzer', group: 'Sensores y actuadores' },
  { kind: 'servo', label: 'Servo SG90', group: 'Sensores y actuadores' },
]

const SWATCH: Partial<Record<CompKind, string>> = {
  resistencia: '#d9c29a',
  potenciometro: '#26407a',
  ldr: '#c45a2a',
  ultrasonico: '#1c5bb8',
  buzzer: '#141416',
  servo: '#2f6fe0',
}
const EXTRA = new Set<CompKind>(['ldr', 'buzzer', 'servo', 'ultrasonico'])

const LED_NAME: Record<string, string> = { '#ff2a2a': 'rojo', '#2aff5a': 'verde', '#ffd21a': 'amarillo', [BLUE]: 'azul' }
const fmt = (n: number, d = 1) => (Number.isFinite(n) ? n.toFixed(d).replace('.', ',') : '—')
const uid = () => Math.random().toString(36).slice(2, 10)
const pinName = (n: number) => (n >= 14 && n <= 19 ? `A${n - 14}` : String(n))

/** Lee del programa qué pines se configuran y cómo (para revisar el circuito antes de ejecutarlo). */
function declaredPins(code: string): Record<string, PinModeName> {
  const consts: Record<string, number> = { LED_BUILTIN: 13, A0: 14, A1: 15, A2: 16, A3: 17, A4: 18, A5: 19 }
  for (const m of code.matchAll(/(?:#define\s+(\w+)\s+(\d+))|(?:\b(?:const\s+)?(?:int|byte|uint8_t)\s+(\w+)\s*=\s*(A?\d+)\s*;)/g)) {
    const name = m[1] ?? m[3]
    const val = m[2] ?? m[4]
    consts[name] = /^A\d$/.test(val) ? 14 + Number(val.slice(1)) : Number(val)
  }
  const out: Record<string, PinModeName> = {}
  for (const m of code.matchAll(/pinMode\s*\(\s*(\w+)\s*,\s*(OUTPUT|INPUT_PULLUP|INPUT)\s*\)/g)) {
    const n = /^\d+$/.test(m[1]) ? Number(m[1]) : consts[m[1]]
    if (n !== undefined) out[pinName(n)] = m[2] as PinModeName
  }
  return out
}

interface Check {
  type: 'ok' | 'warn' | 'bad' | 'info'
  text: string
}

function load(key: string, mission?: Mission): { placed: Placed[]; code: string } {
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const v = JSON.parse(raw)
      if (Array.isArray(v.placed) && typeof v.code === 'string') return v
    }
  } catch {
    /* sin almacenamiento */
  }
  if (mission) return { placed: [], code: mission.startCode }
  const ex = EXAMPLES[0]
  return { placed: ex.circuit.map((c) => ({ ...c, id: uid() })), code: ex.code }
}

export function BenchPage() {
  return <Bench />
}

/** Mesa de trabajo en modo misión (ruta laboratorio/misiones/:id). */
export function MissionBenchPage() {
  const { id } = useParams()
  const sub = useSub()
  const m = MISSIONS.find((x) => x.id === id)
  if (!m) return <Navigate to={sub('/laboratorio/misiones')} replace />
  return <Bench key={m.id} mission={m} />
}

function Bench({ mission }: { mission?: Mission }) {
  const sub = useSub()
  const holes = useMemo(() => buildHoles(COLS), [])
  const holeById = useMemo(() => new Map(holes.map((h) => [h.id, h])), [holes])
  const pinPos = useMemo(() => arduinoPinPositions(), [])
  const storeKey = mission ? `${STORE}-${mission.id}` : STORE
  const initial = useMemo(() => load(storeKey, mission), [storeKey, mission])

  const [placed, setPlaced] = useState<Placed[]>(initial.placed)
  const [code, setCode] = useState(initial.code)
  const [tool, setTool] = useState<Tool | 'borrar' | 'usar'>('usar')
  const [pending, setPending] = useState<string[]>([])
  const [hover, setHover] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'info' | 'bad'; text: string } | null>(null)
  const [cam, setCam] = useState<CameraRequest>({ view: 'iso', n: 1 })
  const [pressed, setPressed] = useState<Set<string>>(new Set())
  const [pots, setPots] = useState<Record<string, number>>({})
  const [running, setRunning] = useState(false)
  const [compileErr, setCompileErr] = useState<CompileError | null>(null)
  const [runErr, setRunErr] = useState<string | null>(null)
  const [serial, setSerial] = useState('')
  const [, setFrame] = useState(0)
  const [light, setLight] = useState(60)
  const [distance, setDistance] = useState(30)
  const [muted, setMuted] = useState(false)
  const tonesRef = useRef<Record<string, number>>({})
  const servoRef = useRef<Record<string, number>>({})

  // guardar en esta computadora
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(storeKey, JSON.stringify({ placed, code }))
      } catch {
        /* sin almacenamiento */
      }
    }, 400)
    return () => window.clearTimeout(t)
  }, [placed, code, storeKey])

  const termPos = (t: string): THREE.Vector3 => {
    if (t.startsWith('ard:')) {
      const [x, z] = pinPos[t.slice(4)]
      return new THREE.Vector3(ARD_POS[0] + x, ARD_POS[1] + HEADER_TOP, ARD_POS[2] + z)
    }
    const h = holeById.get(t)!
    return new THREE.Vector3(h.x, TOP, h.z)
  }
  const terminalNode = useMemo(
    () => (t: string) => {
      if (t.startsWith('ard:')) {
        const p = t.slice(4)
        return 'pin:' + (p.startsWith('GND') ? 'GND' : p)
      }
      return holeById.get(t)?.strip ?? t
    },
    [holeById],
  )

  /* ---------------------------------------------------------------- simulación */

  const pinsRef = useRef<Record<string, PinState>>({})
  const serialRef = useRef('')
  const raf = useRef(0)
  const refresh = () => {
    if (raf.current) return
    raf.current = requestAnimationFrame(() => {
      raf.current = 0
      setFrame((f) => f + 1)
      setSerial(serialRef.current)
    })
  }
  // lo que el programa necesita leer en el momento (no puede esperar a que se dibuje la pantalla)
  const live = useRef({ placed, pressed, pots, light, distance })
  live.current = { placed, pressed, pots, light, distance }
  const simCache = useRef<SimResult | null>(null)
  const dirty = () => {
    simCache.current = null
    refresh()
  }
  useEffect(() => {
    simCache.current = null
  }, [placed, pressed, pots, light])
  const currentSim = () => {
    if (!simCache.current) simCache.current = simulate({ ...live.current, terminalNode, pins: { ...pinsRef.current } })
    return simCache.current
  }

  const sim = currentSim()
  const pins = pinsRef.current

  // revisión "antes de ejecutar": los pines que el programa declara como salida, en HIGH
  const declared = useMemo(() => declaredPins(code), [code])
  const hypo = useMemo(() => {
    const ps: Record<string, PinState> = {}
    for (const [n, m] of Object.entries(declared)) ps[n] = { mode: m, value: m === 'OUTPUT' ? 1 : 0 }
    return simulate({ placed, terminalNode, pins: ps, pressed: new Set(), pots, light })
  }, [placed, declared, pots, terminalNode, light])

  const runner = useRef<ArduinoRunner | null>(null)
  const stop = () => {
    runner.current?.stop()
    runner.current = null
    pinsRef.current = {}
    tonesRef.current = {}
    servoRef.current = {}
    setRunning(false)
    setTesting(false)
    dirty()
  }
  useEffect(() => () => runner.current?.stop(), [])

  const io: BoardIO = {
    pinMode: (n, mode) => {
      const name = pinName(n)
      pinsRef.current[name] = { mode, value: mode === 'OUTPUT' ? pinsRef.current[name]?.value ?? 0 : 0 }
      dirty()
    },
    write: (n, v) => {
      const name = pinName(n)
      const st = pinsRef.current[name]
      // digitalWrite(HIGH) en un pin de entrada activa la resistencia pull-up (como en la placa real)
      if (!st || st.mode !== 'OUTPUT') pinsRef.current[name] = { mode: v ? 'INPUT_PULLUP' : 'INPUT', value: 0 }
      else pinsRef.current[name] = { mode: 'OUTPUT', value: v }
      dirty()
    },
    readDigital: (n) => (currentSim().voltage('ard:' + pinName(n)) > 2.5 ? 1 : 0),
    readAnalog: (n) => Math.round(Math.min(1, Math.max(0, currentSim().voltage('ard:' + pinName(n)) / 5)) * 1023),
    tone: (n, f) => {
      const name = pinName(n)
      // tone() deja el pin oscilando: para el circuito es como un PWM al 50 %
      if (f && f > 0) {
        tonesRef.current[name] = f
        pinsRef.current[name] = { mode: 'OUTPUT', value: 0.5 }
      } else {
        delete tonesRef.current[name]
        pinsRef.current[name] = { mode: 'OUTPUT', value: 0 }
      }
      dirty()
    },
    servo: (n, a) => {
      const name = pinName(n)
      if (a === null) delete servoRef.current[name]
      else servoRef.current[name] = a
      refresh()
    },
    pulseIn: (n) => {
      const s = currentSim()
      const net = s.netOf('ard:' + pinName(n))
      const { placed: ps, distance: d } = live.current
      for (const p of ps) {
        if (p.kind !== 'ultrasonico') continue
        const m = s.modules[p.id]
        // el eco llega si el módulo tiene 5 V, su Echo va a este pin y su Trig a algún pin del Arduino
        const trigOk = Object.keys(pinsRef.current).some((pn) => pinsRef.current[pn].mode === 'OUTPUT' && s.netOf('ard:' + pn) === m?.nets[1])
        if (m?.powered && m.nets[2] === net && trigOk) return d > 400 ? 0 : Math.round(d * 58.3)
      }
      return 0
    },
    serial: (t) => {
      serialRef.current = (serialRef.current + t).slice(-8000)
      refresh()
    },
  }

  const run = async () => {
    stop()
    const r = compileArduino(code)
    if (!r.ok) {
      setCompileErr(r.error)
      return
    }
    setCompileErr(null)
    setRunErr(null)
    serialRef.current = ''
    setSerial('')
    const rn = new ArduinoRunner(io)
    runner.current = rn
    setRunning(true)
    setTool('usar')
    setPending([])
    await rn.run(r.out, (m) => setRunErr(m))
    if (runner.current === rn) {
      runner.current = null
      setRunning(false)
    }
  }

  /* ---------------------------------------------------------------- misión */

  const store = useStore()
  const missionDone = mission ? isDone(store, missionActivityId(mission.id)) : false
  const [step, setStep] = useState(0)
  const [stepMsg, setStepMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [testing, setTesting] = useState(false)
  const [won, setWon] = useState(false)
  const [testSecs, setTestSecs] = useState(0)
  const samples = useRef<Sample[]>([])
  const missionCtx = () => ({ placed: live.current.placed, nl: buildNetlist(live.current.placed, terminalNode), sim: currentSim() })

  const reqState = mission ? mission.codeReqs.map(([t, f]) => [t, f(code)] as const) : []

  const checkStep = (i: number) => {
    if (!mission) return
    let err: string | null = null
    if (i === 0) {
      const missing = mission.parts.filter((p) => placed.filter((x) => x.kind === p.kind && (!p.color || x.color === p.color)).length < p.n)
      if (missing.length) err = `Falta colocar: ${missing.map((p) => p.label).join(', ')}.`
    } else if (i === 1) err = mission.checkWire(missionCtx())
    else if (i === 2) {
      const r = compileArduino(code)
      if (!r.ok) {
        setCompileErr(r.error)
        err = `El programa tiene un error en la línea ${r.error.line}: ${r.error.message}`
      } else {
        setCompileErr(null)
        const bad = reqState.filter(([, ok]) => !ok)
        if (bad.length) err = `Al programa le falta: ${bad[0][0]}`
      }
    }
    if (err) setStepMsg({ ok: false, text: err })
    else {
      setStepMsg({ ok: true, text: ['¡Están todos los componentes!', '¡El circuito está bien conectado!', '¡El programa compila y tiene todo lo pedido!'][i] })
      setStep(i + 1)
    }
  }

  const startTest = () => {
    if (!mission) return
    const wire = mission.checkWire(missionCtx())
    if (wire) {
      setStepMsg({ ok: false, text: `Antes de probar: ${wire}` })
      return
    }
    samples.current = []
    setWon(false)
    setTestSecs(0)
    setStepMsg(null)
    // run() frena lo anterior (y apaga "testing") antes de su primera espera: se activa después
    void run()
    setTesting(true)
  }

  useEffect(() => {
    if (!mission || !testing || !running) return
    const t0 = performance.now()
    const id = window.setInterval(() => {
      const s = currentSim()
      const t = (performance.now() - t0) / 1000
      samples.current.push({
        t,
        leds: Object.fromEntries(Object.values(s.leds).map((l) => [l.id, l.brightness])),
        pressed: live.current.pressed.size > 0,
        pots: { ...live.current.pots },
        serial: serialRef.current,
      })
      setTestSecs(Math.floor(t))
      const r = mission.test(samples.current, missionCtx())
      if (r.ok) {
        setWon(true)
        setTesting(false)
        setStepMsg({ ok: true, text: r.msg })
        markActivity(missionActivityId(mission.id), true, BULBS.proyecto, `Misión: ${mission.title}`)
      } else if (t > mission.maxSeconds) {
        setTesting(false)
        setStepMsg({ ok: false, text: r.msg })
      } else if (t > 3) setStepMsg({ ok: false, text: r.msg })
    }, 100)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission, testing, running])

  const nextMission = mission ? MISSIONS[MISSIONS.indexOf(mission) + 1] : undefined

  /* ---------------------------------------------------------------- armar */

  const occupied = useMemo(() => {
    const m = new Map<string, string>()
    placed.forEach((p) => p.legs.forEach((l) => m.set(l, p.id)))
    pending.forEach((l) => m.set(l, 'pending'))
    return m
  }, [placed, pending])

  const clickTerminal = (t: string) => {
    if (tool === 'usar') {
      setMsg({ type: 'info', text: 'Elegí una herramienta a la izquierda para colocar componentes o cables.' })
      return
    }
    if (tool === 'borrar') {
      const id = occupied.get(t)
      if (id && id !== 'pending') setPlaced((ps) => ps.filter((p) => p.id !== id))
      return
    }
    if (occupied.has(t)) {
      setMsg({ type: 'bad', text: 'Ese lugar ya está ocupado: cada orificio admite una sola pata o cable.' })
      return
    }
    if (tool.kind !== 'cable' && t.startsWith('ard:')) {
      setMsg({ type: 'bad', text: 'Los componentes van en la protoboard. Para llegar al Arduino usá cables.' })
      return
    }
    const rowN = ROW_MODULES[tool.kind]
    if (rowN) {
      const h = holeById.get(t)
      if (!h || /^[TB]/.test(h.row)) {
        setMsg({ type: 'bad', text: 'Los módulos se enchufan en la zona central (filas a a j), no en los rieles.' })
        return
      }
      const legs = Array.from({ length: rowN }, (_, i) => `${h.row}${h.col + i}`)
      if (legs.some((l) => !holeById.has(l))) {
        setMsg({ type: 'bad', text: `No entra: necesita ${rowN} orificios seguidos hacia la derecha.` })
        return
      }
      if (legs.some((l) => occupied.has(l))) {
        setMsg({ type: 'bad', text: 'Alguno de esos orificios ya está ocupado.' })
        return
      }
      setPlaced((ps) => [...ps, { id: uid(), kind: tool.kind, legs }])
      setMsg({ type: 'info', text: `Pines de izquierda a derecha: ${LEG_NAMES[tool.kind].join(' · ')}. Conectalos con cables desde sus columnas.` })
      return
    }
    if (tool.kind !== 'cable' && pending.length > 0 && termPos(pending[pending.length - 1]).distanceTo(termPos(t)) > 1.6) {
      setMsg({ type: 'bad', text: 'Las patas no llegan tan lejos. Poné la siguiente más cerca.' })
      return
    }
    const legs = [...pending, t]
    const need = LEG_NAMES[tool.kind].length
    if (legs.length < need) {
      setPending(legs)
      setMsg({ type: 'info', text: `Ahora: ${LEG_NAMES[tool.kind][legs.length]}.` })
      return
    }
    setPlaced((ps) => [...ps, { id: uid(), kind: tool.kind, legs, color: tool.color, value: tool.value }])
    setPending([])
    setMsg(null)
  }

  const loadExample = (id: string) => {
    const ex = EXAMPLES.find((e) => e.id === id)
    if (!ex) return
    stop()
    setPlaced(ex.circuit.map((c) => ({ ...c, id: uid() })))
    setCode(ex.code)
    setPots({})
    setPressed(new Set())
    setCompileErr(null)
    setRunErr(null)
    serialRef.current = ''
    setSerial('')
    setCam((c) => ({ view: 'iso', n: c.n + 1 }))
  }

  const press = (id: string, down: boolean) =>
    setPressed((s) => {
      if (s.has(id) === down) return s
      const n = new Set(s)
      if (down) n.add(id)
      else n.delete(id)
      return n
    })

  /* ---------------------------------------------------------------- revisión del circuito */

  const checks = useMemo<Check[]>(() => {
    const out: Check[] = []
    const s = running ? sim : hypo
    if (s.short) out.push({ type: 'bad', text: '¡Cortocircuito! 5V (o 3,3V) quedó conectado directo con GND. Eso puede quemar la placa o el puerto USB.' })
    for (const p of placed) {
      if (p.kind === 'cable') continue
      if (new Set(p.legs.map(sim.netOf)).size < p.legs.length)
        out.push({ type: 'warn', text: `Un${p.kind === 'resistencia' ? 'a resistencia' : p.kind === 'led' ? ' LED' : p.kind === 'pulsador' ? ' pulsador' : ' potenciómetro'} tiene dos patas en la misma tira: queda en cortocircuito y no hace nada.` })
    }
    let n = 0
    for (const p of placed) {
      if (p.kind !== 'led') continue
      n++
      const name = `LED ${LED_NAME[p.color ?? ''] ?? n}`
      const l = s.leds[p.id]
      if (!l) continue
      if (l.burnt)
        out.push({ type: 'bad', text: `${name}: ${fmt(l.current * 1000, 0)} mA. ¡Se quema! Le falta una resistencia en serie (220 Ω es lo típico).` })
      else if (l.current > 0.0005) {
        const formula = l.series ? ` ≈ (${fmt(l.series.vsrc)} V − ${fmt(l.vf)} V) ÷ ${l.series.r >= 1000 ? fmt(l.series.r / 1000, 1) + ' k' : l.series.r + ' '}Ω` : ''
        const weak = l.current < 0.002 ? ' Brilla muy poco: la resistencia es grande.' : ' Seguro para el LED y para el pin.'
        const pwm = running && l.duty < 1 ? ` Con PWM está prendido el ${Math.round(l.duty * 100)} % del tiempo: se ve más tenue.` : ''
        out.push({ type: l.current < 0.002 ? 'warn' : 'ok', text: `${name}: ${fmt(l.current * 1000)} mA${formula}.${weak}${pwm}` })
      } else if (l.reversed) out.push({ type: 'warn', text: `${name}: parece estar al revés. El ánodo (pata larga, +) va hacia el pin o 5V; el cátodo, hacia GND.` })
      else out.push({ type: 'info', text: `${name}: no le llega corriente${running ? ' ahora' : ''}. Revisá que el circuito esté cerrado hasta GND${running ? ' o que el pin esté en HIGH' : ''}.` })
    }
    for (const [pin, i] of Object.entries(s.pinCurrent))
      if (Math.abs(i) > 0.04) out.push({ type: 'bad', text: `El pin ${pin} tendría que entregar ${fmt(Math.abs(i) * 1000, 0)} mA: un pin aguanta como máximo 40 mA (20 mA recomendado). ¿Está conectado directo a GND o a 5V?` })
    const pinOnNet = (net: string) => USABLE_PINS.find((pn) => /^(\d+|A\d)$/.test(pn) && s.netOf('ard:' + pn) === net)
    const fmtR = (r: number) => (r >= 1e6 ? `${fmt(r / 1e6, 1)} MΩ` : r >= 1000 ? `${fmt(r / 1000, 1)} kΩ` : `${Math.round(r)} Ω`)
    for (const p of placed) {
      const m = s.modules[p.id]
      if (p.kind === 'ldr') out.push({ type: 'info', text: `LDR: con la luz al ${light} % su resistencia es ≈ ${fmtR(ldrResistance(light))} (a más luz, menos resistencia).` })
      if (p.kind === 'servo' && m) {
        if (!m.powered) out.push({ type: 'warn', text: 'Servo: necesita 5V en el cable rojo (pata del medio) y GND en el marrón.' })
        const sig = pinOnNet(m.nets[2])
        out.push(sig ? { type: 'ok', text: `Servo: la señal (naranja) va al pin ${sig}. En el programa: miServo.attach(${sig});` } : { type: 'info', text: 'Servo: la señal (cable naranja) tiene que ir a un pin digital, por ejemplo el 9.' })
      }
      if (p.kind === 'ultrasonico' && m) {
        if (!m.powered) out.push({ type: 'warn', text: 'Ultrasónico: le falta alimentación (VCC a 5V y GND a GND).' })
        const trig = pinOnNet(m.nets[1])
        const echo = pinOnNet(m.nets[2])
        if (!trig || !echo) out.push({ type: 'info', text: 'Ultrasónico: Trig y Echo van cada uno a un pin digital (por ejemplo, Trig al 9 y Echo al 10).' })
        else out.push({ type: 'ok', text: `Ultrasónico: Trig en el pin ${trig} y Echo en el ${echo}. distancia (cm) = pulseIn(${echo}, HIGH) / 58.` })
      }
      if (p.kind === 'buzzer' && m && m.volts > 3 && !pinOnNet(m.nets[0])) out.push({ type: 'info', text: 'Buzzer: está conectado directo a 5V, así que suena todo el tiempo. Para controlarlo, llevá su pata + a un pin.' })
    }
    for (const p of placed)
      for (const l of p.legs)
        if (l === 'ard:0' || l === 'ard:1') out.push({ type: 'warn', text: 'Los pines 0 y 1 se usan para el USB: si tienen algo conectado puede fallar la carga del programa.' })
    for (const [pin, m] of Object.entries(declared)) {
      const used = placed.some((p) => p.kind === 'cable' && p.legs.includes('ard:' + pin))
      if (!used && pin !== '13') out.push({ type: 'info', text: `El programa configura el pin ${pin} como ${m}, pero no tiene nada conectado.` })
    }
    if (out.length === 0) out.push({ type: 'info', text: placed.length ? 'No hay LEDs para revisar todavía.' : 'La mesa está vacía: elegí un ejemplo o una herramienta para empezar.' })
    out.unshift({ type: 'ok', text: 'Arduino UNO alimentado por USB (5 V).' })
    return out
  }, [placed, sim, hypo, running, declared, light])

  /* ---------------------------------------------------------------- pantalla */

  const hoverText = (() => {
    if (!hover) return null
    if (hover.startsWith('ard:')) {
      const v = sim.voltage(hover)
      return `${describePin(hover.slice(4))}${running ? ` · ${fmt(v, 2)} V` : ''}`
    }
    const h = holeById.get(hover)
    return h ? `${describeHole(h)}${running ? ` · ${fmt(sim.voltage(hover), 2)} V` : ''}` : null
  })()

  const hlStrips = useMemo(() => {
    const set = new Set<string>()
    if (hover && !hover.startsWith('ard:')) set.add(holeById.get(hover)!.strip)
    pending.forEach((t) => !t.startsWith('ard:') && set.add(holeById.get(t)!.strip))
    return set
  }, [hover, pending, holeById])

  /** ángulo del servo: el que pidió el programa en el pin conectado a su señal (si tiene 5 V). */
  const servoAngle = (p: Placed) => {
    const m = sim.modules[p.id]
    if (!running || !m?.powered) return 90
    for (const [pn, a] of Object.entries(servoRef.current)) if (sim.netOf('ard:' + pn) === m.nets[2]) return a
    return 90
  }
  /** frecuencia a la que suena un buzzer (0 = callado). */
  const buzzFreq = (p: Placed) => {
    const m = sim.modules[p.id]
    if (!m) return 0
    for (const [pn, f] of Object.entries(tonesRef.current)) if (sim.netOf('ard:' + pn) === m.nets[0] && m.volts > 1) return f
    return m.volts > 3 ? 2300 : 0
  }
  const freq = Math.max(0, ...placed.filter((p) => p.kind === 'buzzer').map(buzzFreq))

  // sonido del buzzer (Web Audio): se crea al primer sonido (siempre después de un clic del usuario)
  const audio = useRef<{ ctx: AudioContext; osc: OscillatorNode; gain: GainNode } | null>(null)
  useEffect(() => {
    const on = freq > 0 && !muted
    if (!on) {
      if (audio.current) audio.current.gain.gain.setTargetAtTime(0, audio.current.ctx.currentTime, 0.01)
      return
    }
    try {
      if (!audio.current) {
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'square'
        gain.gain.value = 0
        osc.connect(gain).connect(ctx.destination)
        osc.start()
        audio.current = { ctx, osc, gain }
      }
      const a = audio.current
      void a.ctx.resume()
      a.osc.frequency.setTargetAtTime(freq, a.ctx.currentTime, 0.005)
      a.gain.gain.setTargetAtTime(0.04, a.ctx.currentTime, 0.01)
    } catch {
      /* sin audio */
    }
  }, [freq, muted])
  useEffect(
    () => () => {
      void audio.current?.ctx.close()
      audio.current = null
    },
    [],
  )

  const potList = placed.filter((p) => p.kind === 'potenciometro')
  const hasLdr = placed.some((p) => p.kind === 'ldr')
  const hasUs = placed.some((p) => p.kind === 'ultrasonico')
  const hasBuzzer = placed.some((p) => p.kind === 'buzzer')
  const groups = [...new Set(TOOLS.map((t) => t.group))]
  const led13 = running && pins['13']?.mode === 'OUTPUT' && pins['13'].value > 0
  const view = (v: ViewName) => setCam((c) => ({ view: v, n: c.n + 1 }))

  return (
    <div className="bench">
      {/* ---------------- herramientas */}
      <aside className="labx-lib bench-tools">
        {mission ? (
          <div className="bench-examples">
            <Link className="btn small" to={sub('/laboratorio/misiones')}>
              ← Todas las misiones
            </Link>
          </div>
        ) : (
        <div className="bench-examples">
          <Link className="btn small primary bench-missions-link" to={sub('/laboratorio/misiones')}>
            🎯 Misiones guiadas
          </Link>
          <label>
            Ejemplos
            <select className="input" value="" onChange={(e) => loadExample(e.target.value)}>
              <option value="" disabled>
                Cargar un ejemplo…
              </option>
              {EXAMPLES.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        )}
        <div className="labx-lib-list">
          <button type="button" className={`bench-tool ${tool === 'usar' ? 'active' : ''}`} onClick={() => (setTool('usar'), setPending([]))}>
            <span className="bench-sw">👆</span> Usar (apretar pulsadores)
          </button>
          {groups.map((g) => (
            <section key={g}>
              <h4>{g}</h4>
              <div className={g === 'Cables' || g === 'LEDs' || g === 'Resistencias' ? 'bench-grid' : ''}>
                {TOOLS.filter((t) => t.group === g).map((t) => (
                  <button
                    key={t.label + t.group}
                    type="button"
                    disabled={running}
                    className={`bench-tool ${tool !== 'borrar' && tool !== 'usar' && tool.label === t.label && tool.group === t.group ? 'active' : ''}`}
                    onClick={() => {
                      setTool(t)
                      setPending([])
                      setMsg(null)
                    }}
                  >
                    <span className="bench-sw" style={{ background: t.color ?? SWATCH[t.kind] ?? '#333' }} />
                    {t.label}
                  </button>
                ))}
              </div>
            </section>
          ))}
          <h4>Editar</h4>
          <button type="button" disabled={running} className={`bench-tool ${tool === 'borrar' ? 'active' : ''}`} onClick={() => (setTool('borrar'), setPending([]))}>
            <span className="bench-sw">🗑</span> Borrar (tocá una pieza)
          </button>
          <div className="row wrap" style={{ marginTop: 6 }}>
            <button type="button" className="btn small" disabled={running || !placed.length} onClick={() => setPlaced((ps) => ps.slice(0, -1))}>
              ↶ Deshacer
            </button>
            <button type="button" className="btn small" disabled={running || !placed.length} onClick={() => setPlaced([])}>
              Vaciar
            </button>
          </div>
        </div>
      </aside>

      {/* ---------------- mesa 3D */}
      <div className="labx-stage bench-stage">
        <div className="labx-toolbar">
          <div className="labx-views">
            {(
              [
                ['iso', 'Iso'],
                ['top', 'Arriba'],
                ['front', 'Frente'],
                ['fit', 'Encuadrar'],
              ] as [ViewName, string][]
            ).map(([v, l]) => (
              <button key={v} type="button" className="btn small" onClick={() => view(v)}>
                {l}
              </button>
            ))}
          </div>
          <div className="labx-tools">
            {running ? (
              <button type="button" className="btn small bench-stop" onClick={stop}>
                ■ Detener
              </button>
            ) : (
              <button type="button" className="btn small primary" onClick={run}>
                ▶ Ejecutar
              </button>
            )}
          </div>
        </div>
        <LabScene modelKey="mesa" camera={cam} parts={{}} onBackgroundClick={() => setHover(null)}>
          <BreadboardBody
            cols={COLS}
            highlightStrips={hlStrips}
            hoverId={hover && !hover.startsWith('ard:') ? hover : null}
            onHoleClick={(h) => clickTerminal(h.id)}
            onHoleHover={(h) => setHover(h ? h.id : null)}
          />
          <group position={ARD_POS}>
            <ArduinoModel powered blink={false} led13={led13} />
          </group>
          {USABLE_PINS.map((p) => {
            const t = `ard:${p}`
            const pos = termPos(t)
            const busy = occupied.has(t)
            return (
              <mesh
                key={p}
                position={[pos.x, pos.y + 0.01, pos.z]}
                onClick={(e: ThreeEvent<MouseEvent>) => {
                  e.stopPropagation()
                  clickTerminal(t)
                }}
                onPointerOver={(e) => {
                  e.stopPropagation()
                  setHover(t)
                  document.body.style.cursor = 'pointer'
                }}
                onPointerOut={() => {
                  setHover(null)
                  document.body.style.cursor = ''
                }}
              >
                <boxGeometry args={[0.2, 0.03, 0.2]} />
                <meshBasicMaterial color={hover === t ? '#ffd400' : busy ? '#2fe07a' : '#ffffff'} transparent opacity={hover === t || pending.includes(t) ? 0.95 : tool === 'usar' ? 0.08 : 0.25} />
              </mesh>
            )
          })}
          {placed.map((p) =>
            EXTRA.has(p.kind) ? (
              <BenchItem
                key={p.id}
                item={p}
                termPos={termPos}
                floorY={-boardSize(COLS).height / 2}
                frontZ={boardSize(COLS).depth / 2}
                angle={servoAngle(p)}
                sounding={!!buzzFreq(p)}
                distance={distance}
                onClick={tool === 'borrar' ? () => setPlaced((ps) => ps.filter((x) => x.id !== p.id)) : undefined}
              />
            ) : (
            <PlacedItem
              key={p.id}
              item={p}
              termPos={termPos}
              lit={false}
              glow={sim.leds[p.id]?.brightness ?? 0}
              pressed={pressed.has(p.id)}
              onPress={p.kind === 'pulsador' && tool === 'usar' ? (down) => press(p.id, down) : undefined}
              onClick={tool === 'borrar' ? () => setPlaced((ps) => ps.filter((x) => x.id !== p.id)) : undefined}
            />
            ),
          )}
          {pending.map((t) => {
            const v = termPos(t)
            return (
              <mesh key={t} position={[v.x, v.y + 0.12, v.z]}>
                <sphereGeometry args={[0.07, 16, 16]} />
                <meshBasicMaterial color="#ffd400" />
              </mesh>
            )
          })}
          {hover && hoverText && (
            <Label position={termPos(hover).add(new THREE.Vector3(0, 0.45, 0))} center style={{ pointerEvents: 'none' }} zIndexRange={[30, 0]}>
              <div className="part-label selected">{hoverText}</div>
            </Label>
          )}
        </LabScene>
        {msg && <div className={`bench-msg ${msg.type}`}>{msg.text}</div>}
        <div className="labx-help">
          {tool === 'usar'
            ? 'Clic sostenido sobre un pulsador para apretarlo · arrastrá para girar · rueda para acercar'
            : tool === 'borrar'
              ? 'Tocá una pieza o un cable para sacarlo'
              : `${tool.group === 'Cables' ? 'Cable' : tool.label}: tocá dónde va ${LEG_NAMES[tool.kind][pending.length]}`}
        </div>
      </div>

      {/* ---------------- código, monitor serie y revisión */}
      <aside className="labx-panel bench-panel">
        {mission && (
          <section className="mission">
            <div className="mission-head">
              <span className="mission-icon">{mission.icon}</span>
              <div>
                <small>
                  Misión · {mission.level}
                  {missionDone && <b className="mission-badge"> ✔ Cumplida</b>}
                </small>
                <h3>{mission.title}</h3>
              </div>
            </div>
            <p className="mission-goal">{mission.goal}</p>
            <ol className="mission-steps">
              {['Armar', 'Cablear', 'Programar', 'Probar'].map((s, i) => (
                <li key={s} className={i < step || (i === 3 && won) ? 'done' : i === step ? 'active' : ''}>
                  <button
                    type="button"
                    disabled={i > step}
                    onClick={() => {
                      setStep(i)
                      setStepMsg(null)
                    }}
                  >
                    <span>{i < step || (i === 3 && won) ? '✔' : i + 1}</span> {s}
                  </button>
                </li>
              ))}
            </ol>
            <div className="mission-body">
              {step === 0 && (
                <>
                  <p>Elegí las herramientas de la izquierda y colocá en la protoboard:</p>
                  <ul>
                    {mission.parts.map((p) => {
                      const n = placed.filter((x) => x.kind === p.kind && (!p.color || x.color === p.color)).length
                      return (
                        <li key={p.label} className={n >= p.n ? 'ok' : ''}>
                          {n >= p.n ? '✔' : '○'} {p.label}
                        </li>
                      )
                    })}
                  </ul>
                  <p className="hint">Las conexiones las hacés en el paso siguiente: por ahora alcanza con que estén puestos.</p>
                </>
              )}
              {step === 1 && <p>{mission.wireHint}</p>}
              {step === 2 && (
                <>
                  <p>Escribí el programa en el editor. Tiene que:</p>
                  <ul>
                    {reqState.map(([t, ok]) => (
                      <li key={t} className={ok ? 'ok' : ''}>
                        {ok ? '✔' : '○'} {t}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {step === 3 && (
                <>
                  <p>{mission.testHint}</p>
                  {testing && running && <p className="hint">Observando la simulación… {testSecs} s</p>}
                </>
              )}
              {stepMsg && <div className={`mission-msg ${stepMsg.ok ? 'ok' : 'bad'}`}>{stepMsg.text}</div>}
              {won ? (
                <div className="mission-won">
                  <b>🎉 ¡Misión cumplida!</b>
                  {nextMission ? (
                    <Link className="btn small primary" to={sub(`/laboratorio/misiones/${nextMission.id}`)}>
                      Siguiente: {nextMission.title} →
                    </Link>
                  ) : (
                    <Link className="btn small primary" to={sub('/laboratorio/misiones')}>
                      Ver todas las misiones
                    </Link>
                  )}
                </div>
              ) : step < 3 ? (
                <button type="button" className="btn small primary" onClick={() => checkStep(step)}>
                  Comprobar
                </button>
              ) : (
                <button type="button" className="btn small primary" onClick={startTest}>
                  {testing ? '↻ Volver a probar' : '▶ Ejecutar y probar'}
                </button>
              )}
            </div>
          </section>
        )}
        <div className="bench-code-head">
          <h3>Programa</h3>
          <span className={`bench-state ${running ? 'on' : ''}`}>{running ? '● Ejecutando' : 'Detenido'}</span>
        </div>
        <div className="bench-editor">
          <CodeEditor value={code} onChange={setCode} lang="js" onRun={run} errorLines={compileErr ? [compileErr.line] : []} />
        </div>
        {compileErr && (
          <div className="bench-err">
            <b>Error en la línea {compileErr.line}:</b> {compileErr.message}
          </div>
        )}
        {runErr && (
          <div className="bench-err">
            <b>Error al ejecutar:</b> {runErr}
          </div>
        )}
        <div className="row wrap">
          {running ? (
            <button type="button" className="btn bench-stop" onClick={stop}>
              ■ Detener
            </button>
          ) : (
            <button type="button" className="btn primary" onClick={run}>
              ▶ Ejecutar <small>(Ctrl+Enter)</small>
            </button>
          )}
        </div>

        {(potList.length > 0 || hasLdr || hasUs || hasBuzzer) && (
          <section className="bench-section">
            <h4>Perillas y ambiente</h4>
            {hasLdr && (
              <label className="bench-pot">
                <span>☀ Luz ambiente</span>
                <input type="range" min={0} max={100} value={light} onChange={(e) => setLight(Number(e.target.value))} />
                <b>{light} %</b>
              </label>
            )}
            {hasUs && (
              <label className="bench-pot">
                <span>↔ Distancia</span>
                <input type="range" min={2} max={200} value={distance} onChange={(e) => setDistance(Number(e.target.value))} />
                <b>{distance} cm</b>
              </label>
            )}
            {hasBuzzer && (
              <label className="bench-pot">
                <span>🔊 Sonido</span>
                <input type="checkbox" checked={!muted} onChange={(e) => setMuted(!e.target.checked)} />
                <b>{freq > 0 ? `${Math.round(freq)} Hz` : 'callado'}</b>
              </label>
            )}
            {potList.map((p, i) => (
              <label key={p.id} className="bench-pot">
                <span>Potenciómetro {i + 1}</span>
                <input type="range" min={0} max={100} value={Math.round((pots[p.id] ?? 0.5) * 100)} onChange={(e) => setPots((s) => ({ ...s, [p.id]: Number(e.target.value) / 100 }))} />
                <b>{Math.round((pots[p.id] ?? 0.5) * 100)} %</b>
              </label>
            ))}
          </section>
        )}

        <section className="bench-section">
          <div className="row space">
            <h4>Monitor serie</h4>
            <button type="button" className="btn small ghost" onClick={() => ((serialRef.current = ''), setSerial(''))}>
              Limpiar
            </button>
          </div>
          <SerialView text={serial} />
        </section>

        <section className="bench-section">
          <h4>Revisión del circuito {running ? '(en vivo)' : '(con las salidas en HIGH)'}</h4>
          <ul className="bench-checks">
            {checks.map((c, i) => (
              <li key={i} className={c.type}>
                {c.text}
              </li>
            ))}
          </ul>
        </section>
        <Link className="btn small labx-more" to={sub('/laboratorio')}>
          ← Volver a explorar componentes
        </Link>
      </aside>
    </div>
  )
}

function SerialView({ text }: { text: string }) {
  const ref = useRef<HTMLPreElement>(null)
  useEffect(() => {
    const el = ref.current
    if (el) el.scrollTop = el.scrollHeight
  }, [text])
  return (
    <pre ref={ref} className="bench-serial">
      {text || 'Lo que el programa mande con Serial.print() aparece acá.'}
    </pre>
  )
}
