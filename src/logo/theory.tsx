// Teoría del taller de Electricidad (3er año): automatización con LOGO!
// Sigue el apunte «Automatización LOGO!» (Prof. González) y la tabla de funciones lógicas básicas.

import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Topic } from '../data/theory'
import { Formula, Readout, Segmented, Slider } from '../components/ui'
import {
  BLOCKS,
  SCAN_MS,
  Simulation,
  signalOf,
  type Block,
  type BlockParams,
  type BlockType,
  type InputDevice,
  type Program,
  type Wire,
} from './engine'
import { GATES, GATE_NAMES, GateSymbol, SIGNAL_OFF, SIGNAL_ON, gateEval, type Gate } from './GateSymbols'
import { TimingChart, type Trace } from './TimingChart'

/* ================================================================ utilidades */

/** Texto con raya arriba (negado). */
const Neg = ({ children }: { children: ReactNode }) => <span style={{ textDecoration: 'overline' }}>{children}</span>

const sig = (v?: number | boolean) => (v ? SIGNAL_ON : SIGNAL_OFF)

function Bit({ v, label }: { v: number | boolean; label?: string }) {
  return (
    <span className={`lt-bit${v ? ' on' : ''}`} title={label}>
      {v ? 1 : 0}
    </span>
  )
}

function Lamp({ on, color = '#ffd34d', label }: { on: boolean | number; color?: string; label?: ReactNode }) {
  return (
    <span className="lt-lamp-wrap">
      <span className={`lt-lamp${on ? ' on' : ''}`} style={{ ['--c' as string]: color }} />
      {label && <span>{label}</span>}
    </span>
  )
}

/** Botón que queda pulsado mientras se mantiene apretado (mouse, dedo o teclado). */
function HoldButton({
  label,
  onChange,
  active,
  disabled,
}: {
  label: ReactNode
  onChange: (down: boolean) => void
  active: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      className={`btn lt-push${active ? ' pressed' : ''}`}
      disabled={disabled}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId)
        onChange(true)
      }}
      onPointerUp={() => onChange(false)}
      onPointerCancel={() => onChange(false)}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
          e.preventDefault()
          onChange(true)
        }
      }}
      onKeyUp={(e) => {
        if (e.key === ' ' || e.key === 'Enter') onChange(false)
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  )
}

/** Programa mínimo: una entrada I por cada pin del bloque, el bloque y la salida Q1. */
function oneBlockProgram(type: BlockType, params?: BlockParams): Program {
  const pins = BLOCKS[type].pins
  const blocks: Block[] = pins.map((_, i) => ({
    id: `in${i}`,
    type: 'I',
    n: i + 1,
    x: 0,
    y: i * 40,
  }))
  blocks.push({ id: 'f', type, x: 100, y: 0, params }, { id: 'q', type: 'Q', n: 1, x: 200, y: 0 })
  const wires: Wire[] = pins.map((_, i) => ({
    id: `w${i}`,
    from: `in${i}`,
    to: 'f',
    pin: i,
  }))
  wires.push({ id: 'wq', from: 'f', to: 'q', pin: 0 })
  const I: Program['io']['I'] = {}
  pins.forEach((p, i) => (I[i + 1] = { dev: 'INT', label: p }))
  return {
    blocks,
    wires,
    io: { I, Q: { 1: { kind: 'lampara', label: 'Q' } } },
  }
}

/** Corre la simulación con entradas guionadas y devuelve las curvas (para los diagramas fijos). */
function staticTraces(
  type: BlockType,
  params: BlockParams,
  script: Record<string, [number, number][]>,
  totalMs: number,
  stepMs = 100,
): Trace[] {
  const pins = BLOCKS[type].pins
  const sim = new Simulation(oneBlockProgram(type, params))
  const used = pins.map((p, i) => ({ p, i })).filter(({ p }) => script[p])
  const out: Trace[] = [...used.map(({ p }) => ({ label: p, values: [] as number[] })), { label: 'Q', values: [] }]
  for (let t = 0; t < totalMs; t += stepMs) {
    pins.forEach((p, i) => (sim.actuated[i + 1] = (script[p] ?? []).some(([a, b]) => t >= a && t < b)))
    sim.run(SCAN_MS)
    used.forEach(({ i }, k) => out[k].values.push(sim.inputSignal(i + 1)))
    out[out.length - 1].values.push(sim.output(1))
    sim.run(stepMs - SCAN_MS)
  }
  return out
}

/* ================================================================ 1. intro */

function IoFlow() {
  const box = (x: number, title: string, items: string[], color: string) => (
    <g>
      <rect x={x} y={14} width={150} height={112} rx={12} fill="none" stroke={color} strokeWidth={2} />
      <text x={x + 75} y={36} textAnchor="middle" fill={color} style={{ fontWeight: 700, fontSize: 15 }}>
        {title}
      </text>
      {items.map((t, i) => (
        <text key={t} x={x + 75} y={60 + i * 18} textAnchor="middle" fill="currentColor" style={{ fontSize: 12 }}>
          {t}
        </text>
      ))}
    </g>
  )
  return (
    <svg viewBox="0 0 560 140" className="lt-diagram" role="img" aria-label="Entradas, programa y salidas">
      {box(6, 'ENTRADAS (I)', ['pulsadores', 'finales de carrera', 'sensores', 'I1 … I8'], '#38bdf8')}
      {box(205, 'PROGRAMA', ['decide con lógica', 'compuertas,', 'temporizadores…', 'LOGO!'], '#ffb020')}
      {box(404, 'SALIDAS (Q)', ['lámparas', 'contactores, motores', 'electroválvulas', 'Q1 … Q4'], '#2fd27a')}
      <path
        d="M160 70 H198 M192 64 L199 70 L192 76 M359 70 H397 M391 64 L398 70 L391 76"
        stroke="currentColor"
        strokeWidth={2}
        fill="none"
      />
    </svg>
  )
}

/* ================================================================ 2. ciclo de scan */

const SCAN_PHASES = [
  {
    t: 'Lectura de entradas',
    d: 'El LOGO! mira, todas a la vez, si hay tensión en cada borne de entrada I1, I2, I3, I4…',
  },
  {
    t: 'Imagen de entradas',
    d: 'Guarda esos valores (0 o 1) en una memoria: la imagen de entradas. Si ahora tocás un pulsador, el programa no se entera hasta el próximo ciclo.',
  },
  {
    t: 'Ejecución del programa',
    d: 'Resuelve el programa de arriba hacia abajo usando SÓLO la imagen de entradas.',
  },
  {
    t: 'Imagen de salidas',
    d: 'Los resultados se guardan en otra memoria: la imagen de salidas. Los relés todavía no cambiaron.',
  },
  {
    t: 'Escritura de salidas',
    d: 'Recién ahora la imagen de salidas se copia, toda junta, a los relés Q. Y el ciclo vuelve a empezar.',
  },
]

const scanProgram = (i: number[]) => [i[0] & i[1], i[0] | i[2], 1 - i[3]]
const SCAN_LINES = ['Q1 = I1 · I2   (AND)', 'Q2 = I1 + I3   (OR)', 'Q3 = NOT I4']

function ScanCycle() {
  const [phase, setPhase] = useState(0)
  const [phys, setPhys] = useState([1, 0, 1, 0])
  const [inImg, setInImg] = useState([0, 0, 0, 0])
  const [outImg, setOutImg] = useState([0, 0, 0])
  const [outs, setOuts] = useState([0, 0, 0])
  const [cycles, setCycles] = useState(0)
  const [auto, setAuto] = useState(false)
  const state = useRef({ phase, phys, inImg, outImg })
  state.current = { phase, phys, inImg, outImg }

  const next = () => {
    const s = state.current
    const p = (s.phase + 1) % 5
    if (p === 1) setInImg([...s.phys])
    if (p === 3) setOutImg(scanProgram(s.inImg))
    if (p === 4) setOuts([...s.outImg])
    if (p === 0) setCycles((c) => c + 1)
    setPhase(p)
  }
  const nextRef = useRef(next)
  nextRef.current = next

  useEffect(() => {
    if (!auto) return
    const id = window.setInterval(() => {
      nextRef.current()
    }, 900)
    return () => {
      window.clearInterval(id)
    }
  }, [auto])

  const preview = scanProgram(inImg)
  return (
    <div className="calc">
      <div className="lt-phases">
        {SCAN_PHASES.map((p, i) => (
          <div key={p.t} className={`lt-phase${i === phase ? ' active' : ''}`}>
            <small>{i + 1}</small>
            {p.t}
          </div>
        ))}
      </div>
      <p className="hint" style={{ minHeight: '3em' }}>
        <strong>{SCAN_PHASES[phase].t}:</strong> {SCAN_PHASES[phase].d}
      </p>
      <div className="lt-io-grid">
        <div className={`lt-io-col${phase === 0 ? ' active' : ''}`}>
          <h5>Bornes de entrada</h5>
          {phys.map((v, i) => (
            <div key={i} className="lt-bitrow">
              <button
                type="button"
                className={`btn small lt-push${v ? ' pressed' : ''}`}
                onClick={() => setPhys(phys.map((x, j) => (j === i ? 1 - x : x)))}
              >
                I{i + 1}
              </button>
              <Bit v={v} />
            </div>
          ))}
          <small className="hint">Tocá para cambiar</small>
        </div>
        <div className={`lt-io-col${phase === 1 ? ' active' : ''}`}>
          <h5>Imagen de entradas</h5>
          {inImg.map((v, i) => (
            <div key={i} className="lt-bitrow">
              <span className="lt-tag">I{i + 1}</span> <Bit v={v} />
            </div>
          ))}
        </div>
        <div className={`lt-io-col${phase === 2 ? ' active' : ''}`}>
          <h5>Programa</h5>
          {SCAN_LINES.map((l, i) => (
            <div key={l} className="lt-bitrow">
              <code style={{ whiteSpace: 'pre' }}>{l}</code>
              {phase === 2 && <Bit v={preview[i]} />}
            </div>
          ))}
        </div>
        <div className={`lt-io-col${phase === 3 ? ' active' : ''}`}>
          <h5>Imagen de salidas</h5>
          {outImg.map((v, i) => (
            <div key={i} className="lt-bitrow">
              <span className="lt-tag">Q{i + 1}</span> <Bit v={v} />
            </div>
          ))}
        </div>
        <div className={`lt-io-col${phase === 4 ? ' active' : ''}`}>
          <h5>Bornes de salida (relés)</h5>
          {outs.map((v, i) => (
            <div key={i} className="lt-bitrow">
              <Lamp on={v} label={`Q${i + 1}`} />
            </div>
          ))}
        </div>
      </div>
      <div className="row wrap">
        <button type="button" className="btn primary" onClick={next} disabled={auto}>
          Siguiente paso →
        </button>
        <button type="button" className={`btn${auto ? ' pressed lt-push' : ''}`} onClick={() => setAuto(!auto)}>
          {auto ? '⏸ Pausar' : '▶ Automático'}
        </button>
        <span className="hint">Ciclos completos: {cycles}</span>
      </div>
      <p className="hint">
        Probá esto: avanzá hasta «Ejecución del programa» y recién ahí cambiá una entrada. ¿Cambia el resultado? Recién lo hace en el ciclo
        siguiente. El LOGO! real repite este ciclo cientos de veces por segundo, por eso parece instantáneo.
      </p>
    </div>
  )
}

/* ================================================================ 3. partes del LOGO! */

function LogoFront() {
  const topLabels = ['L1', 'N', 'I1', 'I2', 'I3', 'I4', 'I5', 'I6', 'I7', 'I8']
  const tx = (i: number) => 192 + i * 24.5 + (i >= 2 ? 6 : 0)
  const qx = [196, 222, 262, 288, 328, 354, 394, 420]
  const callout = (x1: number, y1: number, x2: number, y2: number, text: string[], anchor: 'start' | 'end') => (
    <g>
      <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke="#38bdf8" strokeWidth={1.4} fill="none" />
      <circle cx={x1} cy={y1} r={3} fill="#38bdf8" />
      {text.map((t, i) => (
        <text
          key={t}
          x={x2 + (anchor === 'start' ? 6 : -6)}
          y={y2 + 4 + i * 15}
          textAnchor={anchor}
          fill="currentColor"
          style={{ fontSize: 13, fontWeight: i ? 400 : 700 }}
        >
          {t}
        </text>
      ))}
    </g>
  )
  return (
    <svg viewBox="0 0 620 380" className="lt-diagram" role="img" aria-label="Vista frontal del LOGO! con sus partes">
      {/* carcasa */}
      <rect x={176} y={50} width={268} height={270} rx={8} fill="#cfd4dc" stroke="#7d8798" strokeWidth={2} />
      <rect x={176} y={50} width={268} height={52} rx={8} fill="#aeb5c1" />
      <rect x={176} y={268} width={268} height={52} rx={8} fill="#aeb5c1" />
      {/* bornes de arriba */}
      {topLabels.map((l, i) => (
        <g key={l}>
          <text x={tx(i)} y={66} textAnchor="middle" fill="#1f2937" style={{ fontSize: 10, fontWeight: 700 }}>
            {l}
          </text>
          <circle cx={tx(i)} cy={84} r={8} fill="#e5e7eb" stroke="#4b5563" />
          <path d={`M${tx(i) - 5} ${89} L${tx(i) + 5} ${79}`} stroke="#4b5563" strokeWidth={1.6} />
        </g>
      ))}
      {/* frente */}
      <text x={196} y={124} fill="#0f766e" style={{ fontSize: 13, fontWeight: 800 }}>
        SIEMENS
      </text>
      <text x={330} y={124} fill="#1f2937" style={{ fontSize: 14, fontWeight: 800, fontStyle: 'italic' }}>
        LOGO!
      </text>
      <rect x={192} y={136} width={130} height={68} rx={4} fill="#9fb59a" stroke="#4b5563" />
      <text x={200} y={156} fill="#1e3a1e" style={{ fontSize: 11, fontFamily: 'monospace' }}>
        I:1.......8
      </text>
      <text x={200} y={172} fill="#1e3a1e" style={{ fontSize: 11, fontFamily: 'monospace' }}>
        Q:1..4
      </text>
      <text x={200} y={192} fill="#1e3a1e" style={{ fontSize: 11, fontFamily: 'monospace' }}>
        Mo 09:30
      </text>
      {/* teclas */}
      <g fill="#e5e7eb" stroke="#4b5563">
        <path d="M382 140 L392 156 H372 Z" />
        <path d="M382 200 L392 184 H372 Z" />
        <path d="M352 170 L368 160 V180 Z" />
        <path d="M412 170 L396 160 V180 Z" />
        <rect x={340} y={214} width={34} height={20} rx={3} />
        <rect x={390} y={214} width={34} height={20} rx={3} />
      </g>
      <text x={357} y={228} textAnchor="middle" fill="#1f2937" style={{ fontSize: 10, fontWeight: 700 }}>
        ESC
      </text>
      <text x={407} y={228} textAnchor="middle" fill="#1f2937" style={{ fontSize: 10, fontWeight: 700 }}>
        OK
      </text>
      {/* interfaz */}
      <rect x={192} y={220} width={70} height={18} rx={3} fill="#6b7280" stroke="#374151" />
      {/* conector de ampliación */}
      <rect x={440} y={150} width={8} height={70} fill="#6b7280" />
      {/* bornes de abajo */}
      {qx.map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={286} r={8} fill="#e5e7eb" stroke="#4b5563" />
          <path d={`M${x - 5} 291 L${x + 5} 281`} stroke="#4b5563" strokeWidth={1.6} />
          <text x={x} y={306} textAnchor="middle" fill="#1f2937" style={{ fontSize: 9 }}>
            {(i % 2) + 1}
          </text>
        </g>
      ))}
      {[0, 1, 2, 3].map((k) => (
        <text
          key={k}
          x={(qx[2 * k] + qx[2 * k + 1]) / 2}
          y={316}
          textAnchor="middle"
          fill="#1f2937"
          style={{ fontSize: 10, fontWeight: 700 }}
        >
          Q{k + 1}
        </text>
      ))}
      {/* llamadas */}
      {callout(204, 74, 150, 30, ['Alimentación', 'L1 y N (220 V)'], 'end')}
      {callout(380, 54, 470, 24, ['Entradas', 'I1 … I8'], 'start')}
      {callout(194, 150, 150, 160, ['Pantalla LCD', 'programa y estados'], 'end')}
      {callout(226, 230, 150, 236, ['Conexión a la PC', 'cable o módulo'], 'end')}
      {callout(412, 170, 470, 140, ['6 teclas', '4 flechas + ESC + OK'], 'start')}
      {callout(448, 200, 470, 210, ['Módulos de', 'ampliación'], 'start')}
      {callout(209, 300, 150, 336, ['Salidas a relé', 'Q1 … Q4 (bornes 1 y 2)'], 'end')}
    </svg>
  )
}

/* ================================================================ 4. señales y dispositivos */

function DeviceDemo() {
  const [dev, setDev] = useState<InputDevice>('NA')
  const [held, setHeld] = useState(false)
  const [sw, setSw] = useState(false)
  const actuated = dev === 'INT' ? sw : held
  const s = signalOf(dev, actuated) ? 1 : 0
  const nc = dev === 'NC'
  // el contacto está cerrado cuando deja pasar la tensión → coincide con la señal
  const closed = s === 1
  const y = 70
  const x = 150
  const blade = closed ? `M${x} ${y} L${x + 38} ${y - 3}` : nc ? `M${x} ${y} L${x + 28} ${y - 20}` : `M${x} ${y} L${x + 33} ${y - 18}`
  const desc =
    dev === 'NA'
      ? actuated
        ? 'Pulsador NA apretado: el contacto se cierra, llega tensión a I1 → el LOGO! lee 1.'
        : 'Pulsador NA en reposo: el contacto está abierto, no llega tensión → I1 = 0.'
      : dev === 'NC'
        ? actuated
          ? 'Pulsador NC apretado: el contacto se ABRE, se corta la tensión → I1 = 0.'
          : '¡Ojo! Pulsador NC en reposo: el contacto está cerrado, llega tensión → el LOGO! lee 1 aunque nadie lo toque.'
        : actuated
          ? 'Interruptor en ON: queda cerrado aunque saques la mano → I1 = 1.'
          : 'Interruptor en OFF: queda abierto → I1 = 0.'
  return (
    <div className="calc">
      <Segmented<InputDevice>
        value={dev}
        options={[
          { value: 'NA', label: 'Pulsador NA' },
          { value: 'NC', label: 'Pulsador NC' },
          { value: 'INT', label: 'Interruptor' },
        ]}
        onChange={(d) => {
          setDev(d)
          setHeld(false)
          setSw(false)
        }}
      />
      <svg
        viewBox="0 0 460 120"
        className="lt-diagram"
        style={{ maxWidth: 560 }}
        role="img"
        aria-label="Contacto conectado a la entrada I1"
      >
        <text x={14} y={y + 5} fill="currentColor" style={{ fontSize: 14, fontWeight: 700 }}>
          L1
        </text>
        <path d={`M40 ${y} H${x}`} stroke={SIGNAL_ON} strokeWidth={3} fill="none" />
        <circle cx={x} cy={y} r={3} fill="currentColor" />
        <circle cx={x + 40} cy={y} r={3} fill="currentColor" />
        {nc && <path d={`M${x + 40} ${y} V${y - 12}`} stroke="currentColor" strokeWidth={2.5} />}
        <path d={blade} stroke={closed ? SIGNAL_ON : SIGNAL_OFF} strokeWidth={3.5} strokeLinecap="round" fill="none" />
        <path d={`M${x + 40} ${y} H330`} stroke={sig(s)} strokeWidth={3} fill="none" />
        <text x={x + 20} y={y - 32} textAnchor="middle" fill="currentColor" style={{ fontSize: 12 }}>
          {dev === 'INT' ? 'interruptor' : nc ? 'pulsador NC' : 'pulsador NA'}
        </text>
        <rect x={330} y={30} width={120} height={80} rx={8} fill="#cfd4dc" stroke="#7d8798" />
        <circle cx={352} cy={y} r={7} fill="#e5e7eb" stroke="#4b5563" />
        <text x={372} y={y + 5} fill="#1f2937" style={{ fontSize: 14, fontWeight: 800 }}>
          I1 = {s}
        </text>
        <text x={390} y={50} textAnchor="middle" fill="#1f2937" style={{ fontSize: 11, fontWeight: 700, fontStyle: 'italic' }}>
          LOGO!
        </text>
      </svg>
      <div className="row wrap">
        {dev === 'INT' ? (
          <button type="button" className={`btn lt-push${sw ? ' pressed' : ''}`} onClick={() => setSw(!sw)}>
            {sw ? 'Interruptor: ON (tocá para apagar)' : 'Interruptor: OFF (tocá para prender)'}
          </button>
        ) : (
          <HoldButton label={held ? 'Apretado…' : 'Mantené apretado el pulsador'} active={held} onChange={setHeld} />
        )}
        <span className="lt-signal">
          Señal en I1: <Bit v={s} />
        </span>
      </div>
      <p className="hint">{desc}</p>
    </div>
  )
}

/* ================================================================ 5. compuertas */

function TruthTable({ gate, a, b }: { gate: Gate; a?: number; b?: number }) {
  const one = gate === 'NOT'
  const rows = one
    ? [
        [0, 0],
        [1, 0],
      ]
    : [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ]
  return (
    <table className="lt-tt">
      <thead>
        <tr>
          <th>a</th>
          {!one && <th>b</th>}
          <th>z</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([ra, rb]) => {
          const z = gateEval(gate, ra, rb)
          const cur = a !== undefined && ra === a && (one || rb === b)
          return (
            <tr key={`${ra}${rb}`} className={cur ? 'cur' : ''}>
              <td>{ra}</td>
              {!one && <td>{rb}</td>}
              <td className={z ? 'z1' : ''}>{z}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function GateRefTable() {
  return (
    <div className="table-wrap">
      <table className="lt-ref">
        <thead>
          <tr>
            <th>Nombre</th>
            {GATES.map((g) => (
              <th key={g}>{GATE_NAMES[g]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Símbolo ANSI</th>
            {GATES.map((g) => (
              <td key={g}>
                <GateSymbol gate={g} style="ansi" width={84} />
              </td>
            ))}
          </tr>
          <tr>
            <th>Símbolo LOGO! (FUP)</th>
            {GATES.map((g) => (
              <td key={g}>
                <GateSymbol gate={g} style="iec" width={84} />
              </td>
            ))}
          </tr>
          <tr>
            <th>Tabla de verdad</th>
            {GATES.map((g) => (
              <td key={g}>
                <TruthTable gate={g} />
              </td>
            ))}
          </tr>
          <tr>
            <th>Equivalente en contactos</th>
            {GATES.map((g) => (
              <td key={g}>
                <GateSymbol gate={g} style="contactos" width={112} />
              </td>
            ))}
          </tr>
          <tr>
            <th>Expresión</th>
            {GATES.map((g) => (
              <td key={g} className="lt-expr">
                {EXPR[g]}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

/** Expresiones con la raya de negación bien dibujada. */
const EXPR: Record<Gate, ReactNode> = {
  AND: <>z = a · b</>,
  OR: <>z = a + b</>,
  NOT: (
    <>
      z = <Neg>a</Neg>
    </>
  ),
  NAND: (
    <>
      z = <Neg>a · b</Neg>
    </>
  ),
  NOR: (
    <>
      z = <Neg>a + b</Neg>
    </>
  ),
  XOR: (
    <>
      z = <Neg>a</Neg> · b + a · <Neg>b</Neg>
    </>
  ),
}

const GATE_HINT: Record<Gate, string> = {
  AND: 'Sólo da 1 si a Y b están en 1. Como dos contactos en serie: tienen que estar los dos cerrados.',
  OR: 'Da 1 si a O b (o las dos) están en 1. Como dos contactos en paralelo: alcanza con uno cerrado.',
  NOT: 'Invierte: si entra 1 sale 0 y al revés. Es un contacto normal cerrado.',
  NAND: 'Es una AND con la salida invertida: da 0 sólo cuando a y b están en 1.',
  NOR: 'Es una OR con la salida invertida: da 1 sólo cuando a y b están en 0.',
  XOR: 'Da 1 cuando a y b son DISTINTAS. Es la «combinación» de una luz que se maneja desde dos lugares.',
}

function GateExplorer() {
  const [gate, setGate] = useState<Gate>('AND')
  const [a, setA] = useState(0)
  const [b, setB] = useState(0)
  const one = gate === 'NOT'
  const z = gateEval(gate, a, b)
  const vals = { a, b: one ? undefined : b, z }
  return (
    <div className="calc">
      <Segmented<Gate> value={gate} options={GATES.map((g) => ({ value: g, label: g }))} onChange={setGate} />
      <div className="row wrap" style={{ marginTop: 10 }}>
        <button type="button" className={`btn lt-push${a ? ' pressed' : ''}`} onClick={() => setA(1 - a)}>
          a = {a}
        </button>
        {!one && (
          <button type="button" className={`btn lt-push${b ? ' pressed' : ''}`} onClick={() => setB(1 - b)}>
            b = {b}
          </button>
        )}
        <span className="lt-signal">
          z = <Bit v={z} />
        </span>
      </div>
      <div className="lt-gate-grid">
        <div className="lt-gate-cell">
          <GateSymbol gate={gate} style="ansi" width={150} values={vals} />
          <span>Símbolo ANSI</span>
        </div>
        <div className="lt-gate-cell">
          <GateSymbol gate={gate} style="iec" width={150} values={vals} />
          <span>Símbolo LOGO! (FUP)</span>
        </div>
        <div className="lt-gate-cell">
          <GateSymbol gate={gate} style="contactos" width={210} values={vals} />
          <span>Equivalente en contactos</span>
        </div>
        <div className="lt-gate-cell">
          <TruthTable gate={gate} a={a} b={b} />
          <span>Tabla de verdad</span>
        </div>
      </div>
      <Formula>
        {GATE_NAMES[gate]}: <strong>{EXPR[gate]}</strong>
      </Formula>
      <p className="hint">
        {GATE_HINT[gate]} Rojo = hay señal (1), gris azulado = no hay (0), igual que en la simulación de LOGO!Soft Comfort.
      </p>
    </div>
  )
}

/* ================================================================ 6. arranque de motor */

// I1 = marcha PM (NA) · I3 = parada PP (NC) · I5 = hongo (NC enclavable) · I7 = relé térmico RT (NC)
// Q1 = KM1 · Q2 = LV H1 (marcha) · Q3 = LR H2 (detenido)
const MOTOR_PROGRAM: Program = {
  blocks: [
    { id: 'i1', type: 'I', n: 1, x: 0, y: 0 },
    { id: 'i3', type: 'I', n: 3, x: 0, y: 40 },
    { id: 'i5', type: 'I', n: 5, x: 0, y: 80 },
    { id: 'i7', type: 'I', n: 7, x: 0, y: 120 },
    { id: 'or', type: 'OR', x: 100, y: 0 },
    { id: 'and', type: 'AND', x: 200, y: 40 },
    { id: 'q1', type: 'Q', n: 1, x: 300, y: 40 },
    { id: 'q2', type: 'Q', n: 2, x: 400, y: 80 },
    { id: 'not', type: 'NOT', x: 350, y: 120 },
    { id: 'q3', type: 'Q', n: 3, x: 400, y: 120 },
  ],
  wires: [
    { id: 'w1', from: 'i1', to: 'or', pin: 0 },
    { id: 'w2', from: 'q1', to: 'or', pin: 1 },
    { id: 'w3', from: 'or', to: 'and', pin: 0 },
    { id: 'w4', from: 'i3', to: 'and', pin: 1 },
    { id: 'w5', from: 'i5', to: 'and', pin: 2 },
    { id: 'w6', from: 'i7', to: 'and', pin: 3 },
    { id: 'w7', from: 'and', to: 'q1', pin: 0 },
    { id: 'w8', from: 'q1', to: 'q2', pin: 0 },
    { id: 'w9', from: 'q1', to: 'not', pin: 0 },
    { id: 'w10', from: 'not', to: 'q3', pin: 0 },
  ],
  io: {
    I: {
      1: { dev: 'NA', label: 'Marcha PM' },
      3: { dev: 'NC', label: 'Parada PP' },
      5: { dev: 'INT_NC', label: 'Hongo' },
      7: { dev: 'INT_NC', label: 'Relé térmico RT' },
    },
    Q: {
      1: { kind: 'contactor', label: 'KM1' },
      2: { kind: 'lampara', label: 'LV H1', color: '#2fd27a' },
      3: { kind: 'lampara', label: 'LR H2', color: '#ff5a5a' },
    },
  },
}

type MotorVals = Partial<Record<'i1' | 'i3' | 'i5' | 'i7' | 'or' | 'and' | 'q1' | 'not', number>>

/** Programa del arranque en FUP (como se ve en LOGO!Soft Comfort). Si recibe valores, pinta los cables. */
function FupMotor({ v }: { v?: MotorVals }) {
  const c = (k: keyof MotorVals) => (v ? sig(v[k]) : 'currentColor')
  const inBox = (y: number, name: string, label: string, k: keyof MotorVals) => (
    <g>
      <rect x={8} y={y - 13} width={104} height={26} rx={4} fill="none" stroke="currentColor" strokeWidth={1.6} />
      <text x={16} y={y + 5} fill="currentColor" style={{ fontSize: 13, fontWeight: 700 }}>
        {name}
      </text>
      <text x={42} y={y + 4} fill="currentColor" fillOpacity={0.75} style={{ fontSize: 11 }}>
        {label}
      </text>
      <path d={`M112 ${y} H${k === 'i1' ? 150 : 270}`} stroke={c(k)} strokeWidth={2.2} fill="none" />
    </g>
  )
  const box = (x: number, y: number, w: number, h: number, t: string) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={3} fill="none" stroke="currentColor" strokeWidth={1.8} />
      <text x={x + w / 2} y={y + 18} textAnchor="middle" fill="currentColor" style={{ fontSize: 14, fontWeight: 700 }}>
        {t}
      </text>
    </g>
  )
  const outBox = (x: number, y: number, name: string, label: string) => (
    <g>
      <rect x={x} y={y - 13} width={98} height={26} rx={4} fill="none" stroke="currentColor" strokeWidth={1.6} />
      <text x={x + 8} y={y + 5} fill="currentColor" style={{ fontSize: 13, fontWeight: 700 }}>
        {name}
      </text>
      <text x={x + 34} y={y + 4} fill="currentColor" fillOpacity={0.75} style={{ fontSize: 11 }}>
        {label}
      </text>
    </g>
  )
  return (
    <div className="lt-wide">
      <svg viewBox="0 0 620 250" className="lt-diagram" role="img" aria-label="Programa FUP del arranque de motor">
        {inBox(66, 'I1', 'Marcha PM', 'i1')}
        {inBox(100, 'I3', 'Parada PP', 'i3')}
        {inBox(130, 'I5', 'Hongo', 'i5')}
        {inBox(160, 'I7', 'Térmico RT', 'i7')}
        {/* realimentación (autorretención) Q1 → OR */}
        <path d="M410 85 H440 V14 H136 V40 H150" stroke={c('q1')} strokeWidth={2.2} fill="none" />
        {box(150, 28, 46, 52, '≥1')}
        <path d="M196 54 H230 V70 H270" stroke={c('or')} strokeWidth={2.2} fill="none" />
        {box(270, 55, 50, 120, '&')}
        <path d="M320 115 H340 V85 H352" stroke={c('and')} strokeWidth={2.2} fill="none" />
        <rect x={352} y={72} width={58} height={26} rx={4} fill="none" stroke="currentColor" strokeWidth={1.6} />
        <text x={360} y={90} fill="currentColor" style={{ fontSize: 13, fontWeight: 700 }}>
          Q1
        </text>
        <text x={381} y={89} fill="currentColor" fillOpacity={0.75} style={{ fontSize: 11 }}>
          KM1
        </text>
        <path d="M440 85 V215 M440 150 H510 M440 215 H458" stroke={c('q1')} strokeWidth={2.2} fill="none" />
        <circle cx={440} cy={85} r={3.5} fill={c('q1')} />
        <circle cx={440} cy={150} r={3.5} fill={c('q1')} />
        {outBox(510, 150, 'Q2', 'LV H1')}
        {box(458, 198, 34, 34, '1')}
        <circle cx={496} cy={215} r={4} fill="none" stroke="currentColor" strokeWidth={1.8} />
        <path d="M500 215 H510" stroke={c('not')} strokeWidth={2.2} />
        {outBox(510, 215, 'Q3', 'LR H2')}
        <text x={444} y={30} fill="currentColor" fillOpacity={0.7} style={{ fontSize: 11 }}>
          autorretención
        </text>
        <text x={8} y={232} fill="currentColor" fillOpacity={0.7} style={{ fontSize: 11 }}>
          Q1 = (I1 + Q1) · I3 · I5 · I7 &nbsp;&nbsp; Q2 = Q1 &nbsp;&nbsp; Q3 = NOT Q1
        </text>
      </svg>
    </div>
  )
}

/** Contacto vertical: borne de arriba en (x, y), de abajo en (x, y + 26). */
function VContact({ x, y, nc, closed, label, live }: { x: number; y: number; nc: boolean; closed: boolean; label: string; live: boolean }) {
  const col = live ? sig(closed) : 'currentColor'
  const blade = closed
    ? nc
      ? `M${x} ${y + 26} L${x - 8} ${y - 3}`
      : `M${x} ${y + 26} L${x - 2} ${y}`
    : nc
      ? `M${x} ${y + 26} L${x - 16} ${y + 6}`
      : `M${x} ${y + 26} L${x - 13} ${y + 4}`
  return (
    <g>
      {nc && <path d={`M${x} ${y} H${x - 10}`} stroke="currentColor" strokeWidth={1.8} />}
      <path d={blade} stroke={col} strokeWidth={2.6} strokeLinecap="round" fill="none" />
      <circle cx={x} cy={y} r={2} fill="currentColor" />
      <circle cx={x} cy={y + 26} r={2} fill="currentColor" />
      <text x={x + 8} y={y + 17} fill="currentColor" style={{ fontSize: 11 }}>
        {label}
      </text>
    </g>
  )
}

/** Circuito de mando en lógica cableada (simplificado del apunte). */
function MandoCableado({ s }: { s?: { pm: boolean; pp: boolean; hongo: boolean; rt: boolean; km: boolean } }) {
  const live = !!s
  const st = s ?? { pm: false, pp: false, hongo: false, rt: false, km: false }
  const line = 'currentColor'
  return (
    <svg
      viewBox="0 0 430 380"
      className="lt-diagram"
      style={{ maxWidth: 450 }}
      role="img"
      aria-label="Circuito de mando cableado del arranque"
    >
      <g stroke={line} strokeWidth={1.8} fill="none">
        <path d="M60 20 V36 M60 56 V70 M60 96 V110 M60 136 V150 M60 176 V196 M60 196 H130 M60 222 V242 M130 196 V214 M130 236 V242 M60 242 H130 M60 242 V262 M60 286 V340 H340 M60 50 H340" />
        <rect x={54} y={36} width={12} height={20} />
        <path d="M220 50 V140 M220 166 V262 M220 286 V340 M340 50 V140 M340 166 V262 M340 286 V340" />
      </g>
      <text x={40} y={18} fill="currentColor" style={{ fontSize: 12, fontWeight: 700 }}>
        L1
      </text>
      <text x={350} y={344} fill="currentColor" style={{ fontSize: 12, fontWeight: 700 }}>
        N
      </text>
      <text x={72} y={42} fill="currentColor" style={{ fontSize: 11 }}>
        F2
      </text>
      <VContact x={60} y={70} nc closed={!st.hongo} label="Hongo (NC)" live={live} />
      <VContact x={60} y={110} nc closed={!st.rt} label="RT 95-96 (NC)" live={live} />
      <VContact x={60} y={150} nc closed={!st.pp} label="PP parada (NC)" live={live} />
      <VContact x={60} y={196} nc={false} closed={st.pm} label="" live={live} />
      <text x={20} y={214} fill="currentColor" style={{ fontSize: 11 }}>
        PM
      </text>
      <VContact x={130} y={210} nc={false} closed={st.km} label="KM1 13-14" live={live} />
      <rect
        x={45}
        y={262}
        width={30}
        height={24}
        fill={st.km && live ? 'rgba(239,68,68,0.3)' : 'none'}
        stroke="currentColor"
        strokeWidth={1.8}
      />
      <text x={82} y={279} fill="currentColor" style={{ fontSize: 11, fontWeight: 700 }}>
        KM1 (bobina)
      </text>
      <VContact x={220} y={140} nc={false} closed={st.km} label="KM1 23-24" live={live} />
      <VContact x={340} y={140} nc closed={!st.km} label="KM1 31-32" live={live} />
      {[
        { x: 220, on: st.km, col: '#2fd27a', t: 'H1 verde', t2: '(marcha)' },
        { x: 340, on: !st.km, col: '#ff5a5a', t: 'H2 roja', t2: '(detenido)' },
      ].map((l) => (
        <g key={l.x}>
          <circle
            cx={l.x}
            cy={274}
            r={12}
            fill={live && l.on ? l.col : 'none'}
            fillOpacity={0.85}
            stroke="currentColor"
            strokeWidth={1.8}
          />
          <path d={`M${l.x - 8} 266 L${l.x + 8} 282 M${l.x + 8} 266 L${l.x - 8} 282`} stroke="currentColor" strokeWidth={1.4} />
          <text x={l.x} y={304} textAnchor="middle" fill="currentColor" style={{ fontSize: 10 }}>
            {l.t}
          </text>
          <text x={l.x} y={316} textAnchor="middle" fill="currentColor" style={{ fontSize: 10 }}>
            {l.t2}
          </text>
        </g>
      ))}
    </svg>
  )
}

function useSimLoop(sim: Simulation, onFrame: () => void, paused = false) {
  const cb = useRef(onFrame)
  cb.current = onFrame
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let acc = 0
    const loop = (now: number) => {
      const dt = Math.min(100, now - last)
      last = now
      if (!pausedRef.current) {
        acc += dt
        while (acc >= SCAN_MS) {
          sim.scan()
          acc -= SCAN_MS
          cb.current()
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
    }
  }, [sim])
}

function MotorSim() {
  const [sim] = useState(() => new Simulation(MOTOR_PROGRAM))
  const [, setTick] = useState(0)
  const [pm, setPm] = useState(false)
  const [pp, setPp] = useState(false)
  const [hongo, setHongo] = useState(false)
  const [rt, setRt] = useState(false)
  sim.actuated[1] = pm
  sim.actuated[3] = pp
  sim.actuated[5] = hongo
  sim.actuated[7] = rt
  const lastKey = useRef('')
  useSimLoop(sim, () => {
    const key = ['i1', 'i3', 'i5', 'i7', 'or', 'and', 'q1', 'not'].map((k) => sim.value[k] ?? 0).join('')
    if (key !== lastKey.current) {
      lastKey.current = key
      setTick((t) => t + 1)
    }
  })
  const val = (k: string) => sim.value[k] ?? 0
  const km = val('q1') === 1
  const v: MotorVals = {
    i1: val('i1'),
    i3: val('i3'),
    i5: val('i5'),
    i7: val('i7'),
    or: val('or'),
    and: val('and'),
    q1: val('q1'),
    not: val('not'),
  }
  let msg = km
    ? 'El motor está en marcha. Soltaste Marcha y sigue andando gracias a la autorretención (Q1 vuelve a entrar a la OR).'
    : 'Motor detenido. Mantené apretado Marcha para arrancar.'
  if (hongo) msg = 'Hongo de emergencia enclavado: I5 = 0 y la AND no deja arrancar. Girá el hongo para desenclavarlo.'
  else if (rt) msg = 'Disparó el relé térmico (sobrecarga): I7 = 0. Hasta que no lo rearmes no se puede arrancar.'
  else if (pp) msg = 'Estás apretando Parada: I3 pasa a 0, la AND da 0 y KM1 se suelta.'
  return (
    <div className="calc">
      <div className="row wrap">
        <HoldButton label="▶ Marcha PM (NA)" active={pm} onChange={setPm} />
        <HoldButton label="■ Parada PP (NC)" active={pp} onChange={setPp} />
        <button type="button" className={`btn lt-push${hongo ? ' pressed danger-on' : ''}`} onClick={() => setHongo(!hongo)}>
          {hongo ? '🍄 Desenclavar hongo' : '🍄 Pulsar hongo'}
        </button>
        <button type="button" className={`btn lt-push${rt ? ' pressed danger-on' : ''}`} onClick={() => setRt(!rt)}>
          {rt ? '🔧 Rearmar térmico' : '🔥 Disparar térmico'}
        </button>
      </div>
      <div className="lt-motor-panel">
        <div className="lt-io-col">
          <h5>Entradas (señal)</h5>
          <div className="lt-bitrow">
            <Bit v={v.i1 ?? 0} /> I1 Marcha
          </div>
          <div className="lt-bitrow">
            <Bit v={v.i3 ?? 0} /> I3 Parada
          </div>
          <div className="lt-bitrow">
            <Bit v={v.i5 ?? 0} /> I5 Hongo
          </div>
          <div className="lt-bitrow">
            <Bit v={v.i7 ?? 0} /> I7 Térmico
          </div>
        </div>
        <div className="lt-io-col">
          <h5>Salidas</h5>
          <div className="lt-bitrow">
            <Lamp on={km} color="#38bdf8" label="Q1 · KM1" />
          </div>
          <div className="lt-bitrow">
            <Lamp on={val('q2')} color="#2fd27a" label="Q2 · H1 verde" />
          </div>
          <div className="lt-bitrow">
            <Lamp on={val('q3')} color="#ff5a5a" label="Q3 · H2 roja" />
          </div>
        </div>
        <div className="lt-io-col lt-motor-box">
          <h5>Motor</h5>
          <svg viewBox="0 0 80 80" className={`lt-motor${km ? ' on' : ''}`} width={80} height={80}>
            <circle cx={40} cy={40} r={32} fill="none" stroke="currentColor" strokeWidth={3} />
            <g className="lt-rotor">
              <path d="M40 14 V66 M14 40 H66 M22 22 L58 58 M58 22 L22 58" stroke={km ? '#38bdf8' : 'currentColor'} strokeWidth={3} />
            </g>
            <text
              x={40}
              y={45}
              textAnchor="middle"
              fill="currentColor"
              style={{ fontSize: 14, fontWeight: 800 }}
              stroke="#0b1018"
              strokeWidth={4}
              paintOrder="stroke"
            >
              M
            </text>
          </svg>
          <small>{km ? 'girando' : 'detenido'}</small>
        </div>
      </div>
      <p className="hint">{msg}</p>
      <h4>El programa en el LOGO! (FUP), en vivo</h4>
      <FupMotor v={v} />
      <h4>El mismo circuito con lógica cableada, en vivo</h4>
      <MandoCableado s={{ pm, pp, hongo, rt, km }} />
    </div>
  )
}

/* ================================================================ 7-9. osciloscopio de funciones especiales */

interface ParamDef {
  key: keyof BlockParams
  label: string
  min: number
  max: number
  step: number
  /** el valor está en ms y se muestra en segundos */
  ms?: boolean
}

interface ScopeFn {
  id: string
  label: string
  type: BlockType
  params: ParamDef[]
  defaults?: BlockParams
  hint: ReactNode
}

const STEP_MS = 50
const HIST = 200 // 10 s

const fmtS = (ms: number) => `${(ms / 1000).toFixed(ms % 1000 === 0 ? 0 : 1).replace('.', ',')} s`

function Scope({ fns }: { fns: ScopeFn[] }) {
  const [fnId, setFnId] = useState(fns[0].id)
  const fn = fns.find((f) => f.id === fnId) ?? fns[0]
  const pins = BLOCKS[fn.type].pins
  const initParams = (f: ScopeFn): BlockParams => ({
    ...BLOCKS[f.type].defaults,
    ...f.defaults,
  })
  const [params, setParams] = useState<BlockParams>(() => initParams(fns[0]))
  const [held, setHeld] = useState<boolean[]>([])
  const [latched, setLatched] = useState<boolean[]>([])
  const [paused, setPaused] = useState(false)
  const [, setTick] = useState(0)
  const blank = (n: number) => Array.from({ length: n }, () => new Array<number>(HIST).fill(0))
  const [sim, setSim] = useState(() => new Simulation(oneBlockProgram(fns[0].type, initParams(fns[0]))))
  const hist = useRef<number[][]>(blank(BLOCKS[fns[0].type].pins.length + 1))
  const since = useRef(0)

  pins.forEach((_, i) => (sim.actuated[i + 1] = !!held[i] || !!latched[i]))

  useSimLoop(
    sim,
    () => {
      since.current += SCAN_MS
      if (since.current >= STEP_MS) {
        since.current = 0
        const h = hist.current
        pins.forEach((_, i) => {
          h[i].push(sim.inputSignal(i + 1))
          h[i].shift()
        })
        h[pins.length].push(sim.output(1))
        h[pins.length].shift()
        setTick((t) => t + 1)
      }
    },
    paused,
  )

  const choose = (id: string) => {
    const f = fns.find((x) => x.id === id) ?? fns[0]
    const p = initParams(f)
    setParams(p)
    setSim(new Simulation(oneBlockProgram(f.type, p)))
    hist.current = blank(BLOCKS[f.type].pins.length + 1)
    setHeld([])
    setLatched([])
    setFnId(f.id)
  }
  const setParam = (k: keyof BlockParams, val: number) => {
    const p = { ...params, [k]: val }
    setParams(p)
    sim.setProgram(oneBlockProgram(fn.type, p))
  }
  const clear = () => {
    const prog = oneBlockProgram(fn.type, params)
    const s = new Simulation(prog)
    setSim(s)
    hist.current = blank(pins.length + 1)
    setHeld([])
    setLatched([])
  }

  const q = sim.output(1)
  const traces: Trace[] = [
    ...pins.map((p, i) => ({ label: p, values: hist.current[i] })),
    { label: 'Q', values: hist.current[pins.length] },
  ]
  const T = fn.type === 'TON' || fn.type === 'TOF' ? (params.T ?? 0) : 0

  return (
    <div className="calc">
      {fns.length > 1 && <Segmented<string> value={fnId} options={fns.map((f) => ({ value: f.id, label: f.label }))} onChange={choose} />}
      <p className="hint">{fn.hint}</p>
      {fn.params.map((pd) => (
        <Slider
          key={pd.key}
          label={pd.label}
          value={params[pd.key] ?? 0}
          min={pd.min}
          max={pd.max}
          step={pd.step}
          onChange={(x) => setParam(pd.key, x)}
          format={pd.ms ? fmtS : undefined}
        />
      ))}
      <div className="lt-scope-inputs">
        {pins.map((p, i) => (
          <div key={p} className="lt-in">
            <HoldButton
              label={
                <>
                  {p} <Bit v={!!held[i] || !!latched[i]} />
                </>
              }
              active={!!held[i] || !!latched[i]}
              onChange={(d) => setHeld((h) => pins.map((_, j) => (j === i ? d : !!h[j])))}
            />
            <label className="lt-latch">
              <input
                type="checkbox"
                checked={!!latched[i]}
                onChange={(e) => setLatched((l) => pins.map((_, j) => (j === i ? e.target.checked : !!l[j])))}
              />
              fijo
            </label>
          </div>
        ))}
        <div className="lt-in" style={{ marginLeft: 'auto' }}>
          <Lamp on={q} color="#ef4444" label={<strong>Q = {q}</strong>} />
        </div>
      </div>
      <div className="lt-scope">
        <TimingChart traces={traces} stepMs={STEP_MS} />
      </div>
      <div className="row wrap">
        <button type="button" className="btn small" onClick={() => setPaused(!paused)}>
          {paused ? '▶ Seguir' : '⏸ Pausar'}
        </button>
        <button type="button" className="btn small ghost" onClick={clear}>
          ↺ Reiniciar
        </button>
        <span className="hint">
          Últimos 10 segundos: el borde derecho es «ahora». Mantené apretado un botón o marcá «fijo» para dejarlo en 1.
        </span>
      </div>
      {T > 0 && (
        <Readout label="Tiempo contado por el temporizador" value={`${fmtS(Math.round(sim.elapsed('f') / 100) * 100)} de ${fmtS(T)}`} />
      )}
      {fn.type === 'CNT' && (
        <div className="lt-count">
          <span>Cuenta (Cnt)</span>
          <strong>{sim.count('f')}</strong>
          <span>
            On = {params.on} · Off = {params.off}
          </span>
        </div>
      )}
    </div>
  )
}

function StaticChart({ title, traces, stepMs = 100 }: { title: string; traces: Trace[]; stepMs?: number }) {
  return (
    <figure className="lt-figure">
      <figcaption>{title}</figcaption>
      <TimingChart traces={traces} stepMs={stepMs} />
    </figure>
  )
}

const TON_CHART = staticTraces(
  'TON',
  { T: 3000 },
  {
    Trg: [
      [1000, 6000],
      [7000, 9000],
    ],
  },
  11000,
)
const TOF_CHART = staticTraces(
  'TOF',
  { T: 3000 },
  {
    Trg: [
      [1000, 3000],
      [7000, 8000],
    ],
    R: [[9000, 9500]],
  },
  11000,
)
const GEN_CHART = staticTraces('GEN', { TH: 1000, TL: 500 }, { En: [[1000, 9000]], Inv: [[6000, 9000]] }, 11000)
const RS_CHART = staticTraces(
  'RS',
  {},
  {
    S: [
      [1000, 1500],
      [6000, 6500],
    ],
    R: [
      [4000, 4500],
      [6200, 7500],
    ],
  },
  10000,
)
const RI_CHART = staticTraces(
  'RI',
  {},
  {
    Trg: [
      [1000, 1400],
      [3000, 3400],
      [5000, 5400],
      [8500, 8900],
    ],
    S: [],
    R: [[7000, 7400]],
  },
  10000,
)
const CNT_CHART = staticTraces(
  'CNT',
  { on: 3, off: 2 },
  {
    R: [[11200, 11600]],
    Cnt: [
      [500, 800],
      [1500, 1800],
      [2500, 2800],
      [3500, 3800],
      [6000, 6300],
      [7000, 7300],
      [8000, 8300],
      [9000, 9300],
    ],
    Dir: [[5000, 10000]],
  },
  12000,
)

const TIMER_FNS: ScopeFn[] = [
  {
    id: 'TON',
    label: 'TON (a la conexión)',
    type: 'TON',
    params: [{ key: 'T', label: 'Tiempo T', min: 500, max: 8000, step: 500, ms: true }],
    defaults: { T: 3000 },
    hint: 'Mantené Trg en 1: Q se activa recién cuando pasó el tiempo T. Si soltás antes, no pasa nada y el tiempo vuelve a cero.',
  },
  {
    id: 'TOF',
    label: 'TOF (a la desconexión)',
    type: 'TOF',
    params: [{ key: 'T', label: 'Tiempo T', min: 500, max: 8000, step: 500, ms: true }],
    defaults: { T: 3000 },
    hint: 'Con Trg en 1, Q se activa enseguida. Cuando Trg vuelve a 0 (flanco negativo), Q sigue activa el tiempo T. R la apaga en el acto.',
  },
  {
    id: 'GEN',
    label: 'Generador de impulsos',
    type: 'GEN',
    params: [
      {
        key: 'TH',
        label: 'TH (tiempo en alto)',
        min: 200,
        max: 3000,
        step: 100,
        ms: true,
      },
      {
        key: 'TL',
        label: 'TL (tiempo en bajo)',
        min: 200,
        max: 3000,
        step: 100,
        ms: true,
      },
    ],
    defaults: { TH: 1000, TL: 500 },
    hint: 'Mientras En está en 1, Q se prende durante TH y se apaga durante TL, una y otra vez. Inv invierte la salida (sólo si En está activa).',
  },
]

const LATCH_FNS: ScopeFn[] = [
  {
    id: 'RS',
    label: 'Set-Reset (RS)',
    type: 'RS',
    params: [],
    hint: 'Un toque en S pone Q en 1 y queda así aunque sueltes. Un toque en R la pone en 0. Probá apretar S y R juntos: gana R.',
  },
  {
    id: 'RI',
    label: 'Relé de impulsos',
    type: 'RI',
    params: [],
    hint: 'Cada toque en Trg cambia Q (prende / apaga). S la prende y R la apaga siempre; mientras S o R estén en 1, Trg no hace nada.',
  },
]

const COUNTER_FNS: ScopeFn[] = [
  {
    id: 'CNT',
    label: 'Contador',
    type: 'CNT',
    params: [
      { key: 'on', label: 'Umbral On', min: 0, max: 20, step: 1 },
      { key: 'off', label: 'Umbral Off', min: 0, max: 20, step: 1 },
    ],
    defaults: { on: 5, off: 2 },
    hint: 'Cada flanco de subida en Cnt suma 1 (Dir = 0) o resta 1 (Dir = 1). Q se activa al llegar a On y se desactiva cuando la cuenta baja de Off. R pone todo en 0.',
  },
]

/* ================================================================ temas */

export const LOGO_TOPICS: Topic[] = [
  {
    id: 'logo-automatizacion',
    title: 'Automatización y PLC',
    icon: '🏭',
    summary: 'Qué es automatizar, qué es un PLC y de dónde sale el LOGO!.',
    content: (
      <>
        <p>
          <strong>Automatizar</strong> es lograr que una máquina o un proceso funcione solo, con muy poca (o ninguna) intervención de una
          persona. Un sistema automatizado <strong>ajusta lo que hace según lo que pasa afuera</strong>: si se llena el tanque, corta la
          bomba; si oscurece, prende las luces. Puede ser eléctrico, electrónico, neumático, etc.
        </p>
        <p>
          Un <strong>PLC</strong> (<em>Programmable Logic Controller</em>, Controlador Lógico Programable) es una{' '}
          <strong>computadora industrial</strong> pensada para controlar procesos. Tiene muchas entradas y salidas, y un programa que decide
          qué salidas activar según las entradas.
        </p>
        <IoFlow />
        <h4>Un poco de historia</h4>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Época</th>
                <th>Cómo se automatizaba</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Prehistoria</td>
                <td>Máquinas simples (palanca, polea, rueda) para hacer menos fuerza.</td>
              </tr>
              <tr>
                <td>Antes de los años 60</td>
                <td>
                  <strong>Lógica de relés</strong>: la “inteligencia” estaba en el cableado de relés, temporizadores y contactos. No
                  existían los circuitos integrados. Para máquinas grandes los tableros eran enormes y buscar una falla era muy difícil.
                </td>
              </tr>
              <tr>
                <td>1996</td>
                <td>
                  Aparece el <strong>LOGO!</strong> de Siemens para reemplazar relés cableados: <strong>30 bloques</strong> de programa,{' '}
                  <strong>6 funciones básicas</strong> y <strong>8 especiales</strong>.
                </td>
              </tr>
              <tr>
                <td>Hoy (LOGO! 8)</td>
                <td>
                  <strong>400 bloques</strong>, <strong>8 funciones básicas</strong> y <strong>37 especiales</strong>, Ethernet industrial y
                  servidor web incorporado.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Siemens llama al LOGO! <strong>módulo lógico inteligente</strong>; mucha gente le dice <strong>PLC compacto</strong>. Está un
          escalón abajo de los PLC grandes (otro muy conocido de esta categoría es el Zelio de Schneider). Hay modelos de 12 V a 240 V, en
          CA y CC, y módulos de ampliación para agregar entradas y salidas.
        </p>
        <h4>¿LOGO!, PLC grande o Arduino?</h4>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>LOGO!</th>
                <th>PLC de gama alta (SIMATIC, Modicon)</th>
                <th>Arduino</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Para qué</td>
                <td>Automatizaciones chicas y medianas</td>
                <td>Plantas e instalaciones complejas</td>
                <td>Prototipos, aprendizaje, electrónica</td>
              </tr>
              <tr>
                <td>Robustez</td>
                <td>Industrial: aguanta vibración, calor, ruido eléctrico</td>
                <td>Industrial</td>
                <td>Placa “al aire”, hay que protegerla</td>
              </tr>
              <tr>
                <td>Salidas</td>
                <td>A relé: maneja cargas de 220 V directo</td>
                <td>Relé, transistor, módulos</td>
                <td>5 V y pocos mA: necesita relés</td>
              </tr>
              <tr>
                <td>Costo</td>
                <td>Bajo / medio</td>
                <td>Alto (y un técnico más especializado)</td>
                <td>Muy bajo</td>
              </tr>
              <tr>
                <td>Programación</td>
                <td>Bloques (FUP) o contactos (KOP), con 6 teclas o en la PC</td>
                <td>Varios lenguajes (KOP, FUP, texto estructurado…)</td>
                <td>Código en C/C++</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="tip">
          Usar un PLC de gama alta para prender unas luces sería un despropósito por el costo. Para eso está el LOGO!: resuelve problemas
          sencillos con mucha flexibilidad y tableros más chicos.
        </p>
        <h4>Ejemplos de aplicaciones</h4>
        <ul>
          <li>Encender una lámpara en intervalos regulares o subir y bajar persianas.</li>
          <li>Calefacción central: que la bomba de circulación funcione sólo cuando hace falta agua o calor.</li>
          <li>Refrigeración: activarla y desactivarla por intervalos para ahorrar energía.</li>
          <li>Alumbrado de un ambiente según la hora, o alumbrado exterior según la luz del día.</li>
          <li>Arranque de motores, portones, bombas, cintas transportadoras y pequeñas máquinas de producción.</li>
        </ul>
      </>
    ),
    activities: [
      {
        id: 'lt-auto-1',
        type: 'mc',
        q: '¿Qué significa la sigla PLC?',
        options: ['Placa Lógica Común', 'Controlador Lógico Programable', 'Programa de Línea Continua', 'Protector de Línea y Circuito'],
        answer: 1,
        explain: 'PLC = Programmable Logic Controller: Controlador Lógico Programable.',
      },
      {
        id: 'lt-auto-2',
        type: 'num',
        q: '¿En qué año surge el LOGO! de Siemens?',
        answer: 1996,
        tolerance: 0,
        unit: '',
        explain: 'El LOGO! aparece en 1996 para reemplazar los relés cableados.',
      },
      {
        id: 'lt-auto-3',
        type: 'num',
        q: '¿Cuántos bloques de programa permitía el primer LOGO!?',
        answer: 30,
        tolerance: 0,
        unit: 'bloques',
        explain: 'Al principio: 30 bloques, 6 funciones básicas y 8 especiales. Hoy: 400 bloques.',
      },
      {
        id: 'lt-auto-4',
        type: 'num',
        q: '¿Cuántas funciones especiales tiene el LOGO! actual?',
        answer: 37,
        tolerance: 0,
        unit: 'funciones',
        explain: 'Hoy tiene 8 funciones básicas y 37 especiales.',
      },
      {
        id: 'lt-auto-5',
        type: 'mc',
        q: 'Antes de los años 60, la automatización se hacía con…',
        options: ['Arduino', 'Lógica de relés (cableada)', 'PLC con Ethernet', 'Celulares'],
        answer: 1,
        explain: 'Se combinaban relés en el cableado: la lógica de relés.',
      },
      {
        id: 'lt-auto-6',
        type: 'mc',
        q: '¿Por qué el LOGO! puede prender una lámpara de 220 V directamente y un Arduino no?',
        options: [
          'Porque el LOGO! tiene salidas a relé',
          'Porque el Arduino es más lento',
          'Porque el LOGO! no usa electricidad',
          'Porque la lámpara es digital',
        ],
        answer: 0,
        explain: 'Las salidas del LOGO! son contactos de relé; el Arduino da 5 V y pocos mA, y necesita un relé.',
      },
    ],
  },
  {
    id: 'logo-logica',
    title: 'Lógica cableada vs. programada',
    icon: '🔀',
    summary: 'Relés y cables contra programa. El ciclo de trabajo del LOGO!.',
    content: (
      <>
        <h4>Lógica cableada</h4>
        <p>
          La función del circuito la definen <strong>las conexiones físicas</strong>: cables, relés, contactores, pulsadores,
          temporizadores. Si querés que la máquina haga otra cosa, tenés que <strong>recablear</strong>.
        </p>
        <h4>Lógica programada</h4>
        <p>
          Nace con el microprocesador. Los pulsadores y sensores se conectan a las entradas, las cargas a las salidas, y{' '}
          <strong>lo que pasa en el medio lo decide un programa</strong>. Para cambiar el funcionamiento, muchas veces alcanza con cambiar
          el programa, sin tocar un cable.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Lógica cableada</th>
                <th>Lógica programada (LOGO!/PLC)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Funciones complejas</td>
                <td>Muy difíciles o imposibles</td>
                <td>Fáciles: temporizadores, contadores, cálculos</td>
              </tr>
              <tr>
                <td>Tamaño y peso del tablero</td>
                <td>Grande y pesado</td>
                <td>Chico: un módulo reemplaza muchos relés</td>
              </tr>
              <tr>
                <td>Modificaciones</td>
                <td>Hay que recablear y cambiar elementos</td>
                <td>Se cambia el programa</td>
              </tr>
              <tr>
                <td>Averías</td>
                <td>Más probables, difíciles de encontrar, reparaciones caras</td>
                <td>Menos cables y contactos; se ven los estados en pantalla</td>
              </tr>
              <tr>
                <td>Repuestos (stock)</td>
                <td>Muchos relés, temporizadores, contadores…</td>
                <td>Pocos elementos</td>
              </tr>
              <tr>
                <td>Extras</td>
                <td>—</td>
                <td>Comunicaciones, control distribuido, gestión</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="tip">
          Aunque usemos LOGO!, la lógica cableada no desaparece: la <strong>parte de potencia</strong> (contactores, fusibles, relé térmico)
          y los <strong>elementos de seguridad</strong> se siguen cableando.
        </p>
        <h4>¿Cómo trabaja el LOGO! por dentro? El ciclo de scan</h4>
        <p>El LOGO! no hace todo “al mismo tiempo”: repite sin parar un ciclo con tres fases principales:</p>
        <ol>
          <li>
            <strong>Lectura de entradas</strong>: lee todas las entradas a la vez y guarda sus valores en la{' '}
            <strong>imagen de entradas</strong> (una memoria temporal).
          </li>
          <li>
            <strong>Ejecución del programa</strong>: resuelve el programa usando la imagen de entradas y va guardando los resultados en la{' '}
            <strong>imagen de salidas</strong>.
          </li>
          <li>
            <strong>Escritura de salidas</strong>: cuando terminó todo el programa, copia la imagen de salidas a los relés Q, todos juntos.
          </li>
        </ol>
        <ScanCycle />
      </>
    ),
    activities: [
      {
        id: 'lt-log-1',
        type: 'mc',
        q: 'En lógica cableada, para cambiar el funcionamiento de una máquina hay que…',
        options: ['Cambiar el programa', 'Recablear y cambiar elementos', 'Apretar ESC', 'Nada, se adapta sola'],
        answer: 1,
        explain: 'La función está en las conexiones: cambiarla implica recablear.',
      },
      {
        id: 'lt-log-2',
        type: 'mc',
        q: '¿Cuál es una ventaja de la lógica programada?',
        options: ['Tableros más grandes', 'Más relés de repuesto', 'Gran flexibilidad: se cambia el programa', 'No necesita alimentación'],
        answer: 2,
        explain: 'Con un programa se modifica el funcionamiento sin recablear.',
      },
      {
        id: 'lt-log-3',
        type: 'mc',
        q: '¿Cuál es el orden correcto del ciclo del LOGO!?',
        options: [
          'Ejecutar programa → leer entradas → escribir salidas',
          'Leer entradas → ejecutar programa → escribir salidas',
          'Escribir salidas → leer entradas → ejecutar',
          'Leer entradas → escribir salidas → ejecutar',
        ],
        answer: 1,
        explain: 'Primero lee (imagen de entradas), después ejecuta y por último escribe las salidas.',
      },
      {
        id: 'lt-log-4',
        type: 'mc',
        q: 'Si una entrada cambia mientras el LOGO! está ejecutando el programa, ¿cuándo lo nota?',
        options: ['En el mismo instante', 'En la próxima lectura de entradas (próximo ciclo)', 'Nunca', 'Cuando lo apagás'],
        answer: 1,
        explain: 'El programa usa la imagen de entradas, que se actualiza al comienzo de cada ciclo.',
      },
      {
        id: 'lt-log-5',
        type: 'num',
        q: '¿Cuántas fases principales tiene el ciclo de trabajo del autómata según el apunte?',
        answer: 3,
        tolerance: 0,
        unit: 'fases',
        explain: 'Lectura de entradas, procesado del programa y escritura de salidas.',
      },
    ],
  },
  {
    id: 'logo-partes',
    title: 'Partes del LOGO! y conexión',
    icon: '🟩',
    summary: 'Alimentación, entradas, salidas a relé, pantalla y teclas.',
    content: (
      <>
        <LogoFront />
        <ul>
          <li>
            <strong>Alimentación (L1 y N)</strong>: el modelo de 230 V se conecta directo a la red de 220 V, porque tiene la fuente
            incorporada. Hay modelos de 12 V y 24 V.
          </li>
          <li>
            <strong>Entradas I1 … I8</strong>: ahí van pulsadores, interruptores, finales de carrera y sensores. Si hacen falta más, se
            agregan <strong>módulos de ampliación</strong> al costado.
          </li>
          <li>
            <strong>Salidas Q1 … Q4</strong>: cada una es el contacto de un <strong>relé</strong> (bornes 1 y 2). Con Q = 1 el contacto se
            cierra. Soportan como máximo <strong>8 A a 230 V CA con carga resistiva</strong> (lámparas incandescentes, resistencias) y{' '}
            <strong>3 A con carga inductiva</strong> (bobinas de contactores, motores). Siempre conviene mirar el manual del modelo.
          </li>
          <li>
            <strong>Pantalla LCD</strong>: muestra el programa, el estado de entradas y salidas, los parámetros y la hora.
          </li>
          <li>
            <strong>6 teclas</strong> (4 flechas, ESC y OK): con ellas se puede programar directamente en el equipo.
          </li>
          <li>
            <strong>Conexión a la PC</strong>: el programa también se puede hacer en la computadora con <strong>LOGO!Soft Comfort</strong>{' '}
            (software gratuito de Siemens), <strong>simularlo en la PC</strong> para probarlo y después transferirlo con el cable (o por
            Ethernet en el LOGO! 8).
          </li>
        </ul>
        <h4>El ejemplo más simple</h4>
        <p>
          Un pulsador en I1 y una lámpara en Q1, con el programa “Q1 = I1”. <strong>Q1 vale 0 cuando I1 vale 0</strong> y{' '}
          <strong>Q1 vale 1 cuando I1 vale 1</strong>. Fijate que la lámpara no está conectada al pulsador: los une el programa.
        </p>
        <Formula>I1 → [ programa ] → Q1 &nbsp;&nbsp;·&nbsp;&nbsp; I1 = 0 ⇒ Q1 = 0 &nbsp;&nbsp;·&nbsp;&nbsp; I1 = 1 ⇒ Q1 = 1</Formula>
        <p className="tip">
          Si una carga necesita más corriente que la que aguanta el relé (por ejemplo, un motor trifásico), la salida Q maneja la{' '}
          <strong>bobina de un contactor</strong>, y el contactor maneja la potencia.
        </p>
      </>
    ),
    activities: [
      {
        id: 'lt-par-1',
        type: 'num',
        q: '¿Cuántas entradas digitales tiene el LOGO! básico de 8E/4S?',
        answer: 8,
        tolerance: 0,
        unit: 'entradas',
        explain: 'I1 a I8. Se pueden agregar más con módulos de ampliación.',
      },
      {
        id: 'lt-par-2',
        type: 'num',
        q: '¿Cuántos amperes puede manejar como máximo una salida Q con carga resistiva a 230 V?',
        answer: 8,
        tolerance: 0,
        unit: 'A',
        explain: '8 A con carga resistiva; 3 A con carga inductiva.',
      },
      {
        id: 'lt-par-3',
        type: 'num',
        q: '¿Y con carga inductiva (por ejemplo, la bobina de un contactor)?',
        answer: 3,
        tolerance: 0,
        unit: 'A',
        explain: 'Con cargas inductivas el máximo baja a 3 A.',
      },
      {
        id: 'lt-par-4',
        type: 'mc',
        q: '¿Cómo se llama el software gratuito para programar y simular el LOGO! en la PC?',
        options: ['Arduino IDE', 'LOGO!Soft Comfort', 'Excel', 'Tinkercad'],
        answer: 1,
        explain: 'LOGO!Soft Comfort permite programar, simular y transferir el programa.',
      },
      {
        id: 'lt-par-5',
        type: 'num',
        q: '¿Cuántas teclas tiene el frente del LOGO! para programarlo?',
        answer: 6,
        tolerance: 0,
        unit: 'teclas',
        explain: '4 flechas, ESC y OK.',
      },
      {
        id: 'lt-par-6',
        type: 'mc',
        q: '¿Dónde se conectan L1 y N?',
        options: ['En las salidas', 'En la alimentación del LOGO!', 'En la pantalla', 'En el módulo de ampliación'],
        answer: 1,
        explain: 'L1 y N son los bornes de alimentación.',
      },
    ],
  },
  {
    id: 'logo-senales',
    title: 'Señales y pulsadores',
    icon: '⎍',
    summary: 'Binarias y analógicas, estados 0 y 1, NA, NC e interruptores.',
    content: (
      <>
        <p>
          El LOGO! sólo se fija si en cada entrada <strong>hay o no hay tensión</strong>. Los módulos de entrada convierten esa tensión en
          una <strong>señal</strong> que el procesador puede entender.
        </p>
        <h4>Señales binarias (digitales)</h4>
        <p>
          Pueden tomar sólo <strong>dos valores</strong>: activado o desactivado, que escribimos <strong>1</strong> y <strong>0</strong>. Es
          lo que mejor entiende una computadora.
        </p>
        <ul>
          <li>
            <strong>Estado 0</strong>: sin tensión. Entrada sin activar, salida sin funcionar. También se le dice “falso”.
          </li>
          <li>
            <strong>Estado 1</strong>: hay tensión. Entrada activada, salida funcionando. También “verdadero”.
          </li>
        </ul>
        <h4>Señales analógicas</h4>
        <p>
          Pueden tomar <strong>cualquier valor</strong> entre cero y un máximo, como la tensión de un tacómetro o de un sensor de
          temperatura. Como el PLC por dentro sólo trabaja con 0 y 1, los módulos analógicos convierten ese valor en un{' '}
          <strong>número binario</strong>.
        </p>
        <h4>Pulsadores, interruptores y el “cuidado” del NC</h4>
        <ul>
          <li>
            <strong>Pulsador NA</strong> (normal abierto): en reposo está abierto. Al apretarlo se cierra; al soltarlo vuelve solo.
          </li>
          <li>
            <strong>Pulsador NC</strong> (normal cerrado): en reposo está <strong>cerrado</strong>. Al apretarlo se abre.
          </li>
          <li>
            <strong>Interruptor</strong>: queda en la posición en la que lo dejás (ON u OFF).
          </li>
        </ul>
        <p className="warn-box">
          ⚠️ Un pulsador NC <strong>sin tocar le da 1 al LOGO!</strong> (le llega tensión), y al apretarlo da 0. Por eso los pulsadores de
          parada, el hongo de emergencia y el contacto del relé térmico se conectan NC: si se corta un cable, el LOGO! ve un 0 y la máquina
          se detiene. Es una medida de <strong>seguridad</strong>.
        </p>
        <DeviceDemo />
      </>
    ),
    activities: [
      {
        id: 'lt-sen-1',
        type: 'num',
        q: '¿Cuántos valores distintos puede tomar una señal binaria?',
        answer: 2,
        tolerance: 0,
        unit: 'valores',
        explain: 'Dos: 0 y 1.',
      },
      {
        id: 'lt-sen-2',
        type: 'mc',
        q: 'Un pulsador NC conectado a I2, sin que nadie lo toque. ¿Qué lee el LOGO! en I2?',
        options: ['0', '1'],
        answer: 1,
        explain: 'En reposo el NC está cerrado: llega tensión, I2 = 1.',
      },
      {
        id: 'lt-sen-3',
        type: 'mc',
        q: 'La tensión de un sensor de temperatura que va de 0 a 10 V es una señal…',
        options: ['Binaria', 'Analógica'],
        answer: 1,
        explain: 'Puede tomar cualquier valor dentro del rango: es analógica.',
      },
      {
        id: 'lt-sen-4',
        type: 'mc',
        q: '¿Qué diferencia a un interruptor de un pulsador?',
        options: [
          'El interruptor queda en la posición en que lo dejás',
          'El pulsador es más grande',
          'El interruptor sólo es NC',
          'No hay diferencia',
        ],
        answer: 0,
        explain: 'El pulsador vuelve solo a su posición de reposo; el interruptor no.',
      },
      {
        id: 'lt-sen-5',
        type: 'mc',
        q: '¿Por qué el pulsador de parada se conecta NC?',
        options: [
          'Porque es más barato',
          'Porque si se corta un cable la máquina se detiene igual (seguridad)',
          'Porque el LOGO! no acepta NA',
          'Para que la lámpara brille más',
        ],
        answer: 1,
        explain: 'Con NC, un cable cortado da 0, igual que apretar la parada: falla segura.',
      },
      {
        id: 'lt-sen-6',
        type: 'mc',
        q: 'El estado 1 de una entrada corresponde a…',
        options: ['Ausencia de tensión', 'Presencia de tensión', 'Tensión negativa', 'Un cortocircuito'],
        answer: 1,
        explain: '1 = hay tensión en el borne (activada / verdadero).',
      },
    ],
  },
  {
    id: 'logo-funciones-basicas',
    title: 'Funciones básicas (compuertas)',
    icon: '&',
    summary: 'Álgebra de Boole: AND, OR, NOT, NAND, NOR y XOR en tres formas.',
    content: (
      <>
        <p>
          Las <strong>compuertas lógicas</strong> son las “Funciones Generales” del LOGO! (abreviadas <strong>GF</strong>). Cada una tiene
          su <strong>tabla de verdad</strong>: todas las combinaciones posibles de entradas y la salida que corresponde. Además, cada
          compuerta equivale a un circuito de contactos.
        </p>
        <h4>Funciones lógicas básicas</h4>
        <GateRefTable />
        <h4>Álgebra de Boole</h4>
        <p>
          El conjunto de reglas para operar con variables que sólo valen <strong>0 o 1</strong> se llama <strong>álgebra de Boole</strong>,
          porque fue <strong>George Boole</strong> (matemático inglés, siglo XIX) quien armó las bases de la lógica matemática. Se definen
          tres operaciones básicas:
        </p>
        <ul>
          <li>
            <strong>Suma lógica — O (OR)</strong>: <code>z = a + b</code>. Vale 1 si al menos una entrada vale 1. En contactos:{' '}
            <strong>paralelo</strong> de NA.
          </li>
          <li>
            <strong>Producto lógico — Y (AND)</strong>: <code>z = a · b</code>. Vale 1 sólo si todas valen 1. En contactos:{' '}
            <strong>serie</strong> de NA.
          </li>
          <li>
            <strong>Negación lógica — NO (NOT)</strong>:{' '}
            <code>
              z = <Neg>a</Neg>
            </code>{' '}
            (se lee “a negada”). Invierte el valor. En contactos: un <strong>NC</strong>.
          </li>
        </ul>
        <p>Combinándolas aparecen las otras:</p>
        <ul>
          <li>
            <strong>NAND</strong> = AND + NOT:{' '}
            <code>
              <Neg>a · b</Neg>
            </code>
            . En contactos: NC en paralelo.
          </li>
          <li>
            <strong>NOR</strong> = OR + NOT:{' '}
            <code>
              <Neg>a + b</Neg>
            </code>
            . En contactos: NC en serie.
          </li>
          <li>
            <strong>XOR</strong> (O exclusiva):{' '}
            <code>
              <Neg>a</Neg> · b + a · <Neg>b</Neg>
            </code>
            . Vale 1 cuando las entradas son distintas. Es la conmutación de una luz desde dos lugares (combinación de escalera).
          </li>
        </ul>
        <p className="tip">
          En el LOGO! se usan los símbolos rectangulares (norma IEC): <strong>&amp;</strong> para AND, <strong>≥1</strong> para OR,{' '}
          <strong>=1</strong> para XOR y <strong>1</strong> para NOT. El circulito en la salida significa “negada”. Las AND y OR del LOGO!
          tienen hasta 4 entradas; una entrada que no se conecta no molesta.
        </p>
        <h4>Explorador de compuertas</h4>
        <GateExplorer />
      </>
    ),
    activities: [
      {
        id: 'lt-gf-1',
        type: 'mc',
        q: '¿Quién desarrolló las bases de la lógica matemática que usamos en las compuertas?',
        options: ['Georg Ohm', 'George Boole', 'Werner von Siemens', 'Alessandro Volta'],
        answer: 1,
        explain: 'Por eso se llama álgebra de Boole.',
      },
      {
        id: 'lt-gf-2',
        type: 'mc',
        q: 'Dos contactos NA en serie equivalen a una compuerta…',
        options: ['OR', 'AND', 'NOT', 'XOR'],
        answer: 1,
        explain: 'En serie tienen que estar cerrados los dos: AND (producto lógico).',
      },
      {
        id: 'lt-gf-3',
        type: 'mc',
        q: 'En el LOGO!, el bloque con el símbolo ≥1 es…',
        options: ['AND', 'OR', 'NOT', 'Un contador'],
        answer: 1,
        explain: '≥1: “al menos una entrada en 1” → OR.',
      },
      {
        id: 'lt-gf-4',
        type: 'num',
        q: 'XOR con a = 1 y b = 1. ¿Cuánto vale z?',
        answer: 0,
        tolerance: 0,
        unit: '',
        explain: 'XOR da 1 sólo si las entradas son distintas. Son iguales → 0.',
      },
      {
        id: 'lt-gf-5',
        type: 'num',
        q: 'NOR con a = 0 y b = 0. ¿Cuánto vale z?',
        answer: 1,
        tolerance: 0,
        unit: '',
        explain: 'OR daría 0; negada da 1. NOR sólo da 1 con todas en 0.',
      },
      {
        id: 'lt-gf-6',
        type: 'mc',
        q: '¿Qué compuerta equivale a dos contactos NC en paralelo?',
        options: ['AND', 'NOR', 'NAND', 'OR'],
        answer: 2,
        explain: 'Sólo se abre el circuito si se abren los dos NC (a = b = 1): es NAND.',
      },
    ],
  },
  {
    id: 'logo-motor',
    title: 'Arranque de un motor',
    icon: '⚙️',
    summary: 'Marcha-parada con autorretención: cableado y programado en LOGO!.',
    content: (
      <>
        <p>
          Es el circuito clásico de los tableros: un motor trifásico que arranca con un pulsador de <strong>marcha</strong>, sigue andando
          solo y se detiene con <strong>parada</strong>, con el <strong>hongo</strong> de emergencia o si dispara el{' '}
          <strong>relé térmico</strong>.
        </p>
        <h4>Parte de potencia (igual en los dos casos)</h4>
        <ul>
          <li>
            <strong>Fusibles F1</strong>: protegen contra cortocircuito.
          </li>
          <li>
            <strong>Contactor KM1</strong>: sus contactos principales (1-2, 3-4, 5-6) conectan las tres fases L1, L2, L3 al motor. Su bobina
            (A1-A2) es la que se maneja desde el mando.
          </li>
          <li>
            <strong>Relé térmico RT</strong>: protege al motor contra sobrecargas. Tiene un contacto auxiliar NC (95-96) que se abre si el
            motor consume de más.
          </li>
          <li>
            <strong>Motor M</strong> trifásico (bornes U, V, W y tierra).
          </li>
        </ul>
        <h4>Mando con lógica cableada</h4>
        <ul>
          <li>Todo en serie: fusible F2 → hongo (NC) → RT 95-96 (NC) → parada PP (NC) → marcha PM (NA) → bobina KM1.</li>
          <li>
            <strong>Autorretención</strong>: en paralelo con PM va un contacto auxiliar NA del propio contactor (<strong>KM1 13-14</strong>
            ). Cuando KM1 se activa, ese contacto se cierra y “se sostiene” aunque sueltes marcha.
          </li>
          <li>
            Señalización: <strong>KM1 23-24</strong> (NA) prende la lámpara verde <strong>H1 de marcha</strong> y <strong>KM1 31-32</strong>{' '}
            (NC) la roja <strong>H2 de detenido</strong>.
          </li>
        </ul>
        <MandoCableado />
        <h4>Mando con lógica programada (LOGO!)</h4>
        <p>
          Cada pulsador o contacto pasa a ser una <strong>entrada</strong>, y la bobina y las lámparas, <strong>salidas</strong>. Toda la
          lógica (serie, paralelo, autorretención y la lámpara roja) queda en el programa:
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Borne</th>
                <th>Elemento</th>
                <th>Contacto</th>
                <th>En reposo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>I1</td>
                <td>Pulsador de marcha PM</td>
                <td>NA</td>
                <td>0</td>
              </tr>
              <tr>
                <td>I3</td>
                <td>Pulsador de parada PP</td>
                <td>NC</td>
                <td>1</td>
              </tr>
              <tr>
                <td>I5</td>
                <td>Hongo de emergencia (enclavable)</td>
                <td>NC</td>
                <td>1</td>
              </tr>
              <tr>
                <td>I7</td>
                <td>Relé térmico RT (95-96)</td>
                <td>NC</td>
                <td>1</td>
              </tr>
              <tr>
                <td>Q1</td>
                <td>Bobina del contactor KM1</td>
                <td colSpan={2}>salida a relé</td>
              </tr>
              <tr>
                <td>Q2</td>
                <td>Lámpara verde LV H1 (marcha)</td>
                <td colSpan={2}>salida a relé</td>
              </tr>
              <tr>
                <td>Q3</td>
                <td>Lámpara roja LR H2 (detenido)</td>
                <td colSpan={2}>salida a relé</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul>
          <li>
            <strong>OR (≥1)</strong> entre I1 y Q1: es el paralelo de “marcha” con el contacto de autorretención. En el LOGO! ya no hace
            falta el contacto auxiliar KM1 13-14: se usa directamente el estado de Q1.
          </li>
          <li>
            <strong>AND (&amp;)</strong> con I3, I5 e I7: es la serie de los NC. Como están conectados NC, en reposo dan 1 y dejan pasar; al
            accionarse dan 0 y cortan.
          </li>
          <li>
            <strong>Q2 = Q1</strong> (lámpara verde) y <strong>Q3 = NOT Q1</strong> (lámpara roja: reemplaza al contacto NC 31-32).
          </li>
        </ul>
        <FupMotor />
        <p className="tip">
          En diagrama de contactos (KOP) el mismo programa se ve como en el apunte: I1 en paralelo con Q1, en serie con I3, I5 e I7,
          mandando la bobina Q1. Los NC del campo se dibujan como contactos NA en el programa, porque ya llegan con 1 en reposo.
        </p>
        <h4>Probalo</h4>
        <MotorSim />
      </>
    ),
    activities: [
      {
        id: 'lt-mot-1',
        type: 'mc',
        q: '¿Para qué sirve el contacto KM1 13-14 en paralelo con el pulsador de marcha?',
        options: [
          'Para parar el motor',
          'Para la autorretención: mantiene el contactor activado al soltar marcha',
          'Para prender la lámpara roja',
          'Para proteger contra cortocircuito',
        ],
        answer: 1,
        explain: 'Es la autorretención (enclavamiento): el contactor se sostiene a sí mismo.',
      },
      {
        id: 'lt-mot-2',
        type: 'mc',
        q: 'En el programa del LOGO!, la autorretención se hace con…',
        options: ['Una OR entre I1 y Q1', 'Una NOT en I1', 'Un contador', 'Una XOR'],
        answer: 0,
        explain: 'Q1 vuelve a entrar a la OR junto con marcha: es el paralelo del contacto de autorretención.',
      },
      {
        id: 'lt-mot-3',
        type: 'mc',
        q: '¿Qué protege el relé térmico RT?',
        options: ['Al operario de una descarga', 'Al motor contra sobrecargas', 'A la lámpara', 'Al LOGO! de la humedad'],
        answer: 1,
        explain: 'Si el motor consume de más, el térmico abre su contacto 95-96 y se detiene.',
      },
      {
        id: 'lt-mot-4',
        type: 'num',
        q: 'Con el motor detenido y nada accionado, ¿qué valor lee el LOGO! en I3 (parada NC)?',
        answer: 1,
        tolerance: 0,
        unit: '',
        explain: 'El pulsador NC en reposo está cerrado: I3 = 1.',
      },
      {
        id: 'lt-mot-5',
        type: 'mc',
        q: 'La lámpara roja H2 (detenido) se programa como…',
        options: ['Q3 = Q1', 'Q3 = NOT Q1', 'Q3 = I1', 'Q3 = I1 · I3'],
        answer: 1,
        explain: 'Se prende cuando el contactor NO está activado: la negación de Q1.',
      },
      {
        id: 'lt-mot-6',
        type: 'mc',
        q: '¿Qué parte del circuito se sigue cableando aunque uses LOGO!?',
        options: ['Ninguna', 'La parte de potencia: fusibles, contactor, relé térmico y motor', 'Sólo las lámparas', 'La autorretención'],
        answer: 1,
        explain: 'El LOGO! reemplaza la lógica de mando; la potencia sigue con contactor, fusibles y térmico.',
      },
    ],
  },
  {
    id: 'logo-temporizadores',
    title: 'Temporizadores',
    icon: '⏱',
    summary: 'Retardo a la conexión (TON), a la desconexión (TOF) y generador de impulsos.',
    content: (
      <>
        <p>
          Los temporizadores son <strong>funciones especiales</strong> (SF). Hay dos familias: los que retrasan la <strong>conexión</strong>{' '}
          de la salida y los que retrasan su <strong>desconexión</strong>.
        </p>
        <h4>Retardo a la conexión (TON)</h4>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th>Entrada Trg</th>
                <td>Una señal en Trg (trigger, “disparo”) arranca el temporizador.</td>
              </tr>
              <tr>
                <th>Parámetro T</th>
                <td>Tiempo después del cual se activa la salida (pasa de 0 a 1).</td>
              </tr>
              <tr>
                <th>Salida Q</th>
                <td>
                  Se activa cuando pasó el tiempo T, <strong>siempre que Trg siga activada</strong>. Si Trg vuelve a 0 antes, el tiempo se
                  reinicia.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <StaticChart title="TON con T = 3 s" traces={TON_CHART} />
        <h4>Retardo a la desconexión (TOF)</h4>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th>Entrada Trg</th>
                <td>Una señal en Trg activa Q. El tiempo arranca con el flanco negativo (cuando Trg pasa de 1 a 0).</td>
              </tr>
              <tr>
                <th>Entrada R</th>
                <td>Reinicia el tiempo y apaga la salida en el acto.</td>
              </tr>
              <tr>
                <th>Parámetro T</th>
                <td>La salida se desactiva (de 1 a 0) cuando termina el tiempo T.</td>
              </tr>
              <tr>
                <th>Salida Q</th>
                <td>Se activa con Trg y mantiene ese estado hasta que pasa T.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <StaticChart title="TOF con T = 3 s (R corta el segundo retardo)" traces={TOF_CHART} />
        <h4>Generador de impulsos asíncrono</h4>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th>Entrada En</th>
                <td>Activa y desactiva el generador.</td>
              </tr>
              <tr>
                <th>Entrada Inv</th>
                <td>Invierte la salida, sólo si el generador está activado por En.</td>
              </tr>
              <tr>
                <th>Parámetros TH y TL</th>
                <td>
                  <strong>TH</strong> (Time High): ancho del impulso. <strong>TL</strong> (Time Low): pausa entre impulsos.
                </td>
              </tr>
              <tr>
                <th>Salida Q</th>
                <td>Se prende y se apaga cíclicamente con los tiempos TH y TL. Sirve para balizas, alarmas, luces intermitentes.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <StaticChart title="Generador con TH = 1 s y TL = 0,5 s (Inv activa desde los 6 s)" traces={GEN_CHART} />
        <Formula>Período = TH + TL &nbsp;&nbsp;·&nbsp;&nbsp; Frecuencia = 1 / (TH + TL)</Formula>
        <h4>Remanencia</h4>
        <p>
          En los parámetros de casi todas las funciones especiales se elige la <strong>remanencia</strong>: <strong>/</strong> = sin
          remanencia, <strong>R</strong> = remanente. Si el bloque es remanente y se corta la luz, al volver el LOGO! recupera el estado de
          la salida y el tiempo que llevaba contado. Si no es remanente, todo vuelve a los valores iniciales.
        </p>
        <h4>Osciloscopio: probá los temporizadores</h4>
        <Scope fns={TIMER_FNS} />
      </>
    ),
    activities: [
      {
        id: 'lt-tmp-1',
        type: 'mc',
        q: 'TON con T = 5 s. Mantenés Trg en 1 durante 3 s y lo soltás. ¿Qué hace Q?',
        options: ['Se activa a los 3 s', 'Se activa a los 5 s', 'Nunca se activa', 'Queda activa 5 s'],
        answer: 2,
        explain: 'Trg tiene que seguir en 1 hasta que pase T. A los 3 s volvió a 0: el tiempo se reinicia y Q no se activa.',
      },
      {
        id: 'lt-tmp-2',
        type: 'num',
        q: 'TOF con T = 4 s. Trg está en 1 y pasa a 0 a los 2 s. ¿A los cuántos segundos (desde el inicio) se apaga Q?',
        answer: 6,
        tolerance: 0,
        unit: 's',
        explain: 'El retardo arranca con el flanco negativo (2 s) y dura 4 s: se apaga a los 6 s.',
      },
      {
        id: 'lt-tmp-3',
        type: 'mc',
        q: 'En el TOF, ¿qué hace la entrada R?',
        options: ['Arranca el tiempo', 'Apaga la salida y reinicia el tiempo en el acto', 'Invierte la salida', 'Cuenta impulsos'],
        answer: 1,
        explain: 'R (reset) reinicia el tiempo de retardo y la salida.',
      },
      {
        id: 'lt-tmp-4',
        type: 'num',
        q: 'Generador de impulsos con TH = 1 s y TL = 0,5 s. ¿Cuánto dura un período completo?',
        answer: 1.5,
        tolerance: 0,
        unit: 's',
        explain: 'Período = TH + TL = 1 + 0,5 = 1,5 s.',
      },
      {
        id: 'lt-tmp-5',
        type: 'num',
        q: 'Con TH = 1 s y TL = 0,5 s, ¿cuántos impulsos completos da el generador en 6 s?',
        answer: 4,
        tolerance: 0,
        unit: 'impulsos',
        explain: '6 s / 1,5 s = 4 impulsos.',
      },
      {
        id: 'lt-tmp-6',
        type: 'mc',
        q: 'Un bloque remanente (R), después de un corte de luz…',
        options: [
          'Vuelve a cero',
          'Recupera el estado y el tiempo que tenía antes del corte',
          'Se borra del programa',
          'Queda siempre en 1',
        ],
        answer: 1,
        explain: 'Remanente = guarda su estado ante cortes de alimentación.',
      },
    ],
  },
  {
    id: 'logo-set-reset',
    title: 'Set-Reset y relé de impulsos',
    icon: '🔁',
    summary: 'Memorias que se enclavan: relé autoenclavador (RS) y telerruptor.',
    content: (
      <>
        <h4>SET y RESET</h4>
        <ul>
          <li>
            <strong>SET</strong> = poner un “1”. Una salida o marca puesta a 1 <strong>permanece en ese estado</strong> aunque la condición
            haya dejado de cumplirse, hasta que la borre un RESET.
          </li>
          <li>
            <strong>RESET</strong> = poner un “0”. Una salida o marca puesta a 0 permanece así hasta que llegue un SET.
          </li>
        </ul>
        <h4>Relé autoenclavador (RS)</h4>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th>Entrada S</th>
                <td>Pone la salida Q en 1.</td>
              </tr>
              <tr>
                <th>Entrada R</th>
                <td>
                  Repone la salida Q a 0. <strong>Si S y R están en 1 a la vez, la salida se desactiva</strong> (gana R).
                </td>
              </tr>
              <tr>
                <th>Salida Q</th>
                <td>Se activa con S y queda activada hasta que se active R.</td>
              </tr>
              <tr>
                <th>Parámetro</th>
                <td>Remanencia: / = sin remanencia, R = el estado se guarda.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          ¿Te suena? Hace lo mismo que la <strong>autorretención</strong> del arranque de motor, pero en un solo bloque: marcha a S, parada
          a R.
        </p>
        <StaticChart title="Relé autoenclavador: S y R al mismo tiempo → gana R" traces={RS_CHART} />
        <h4>Relé de impulsos (telerruptor)</h4>
        <p>
          Un breve impulso en la entrada <strong>activa</strong> la salida, y el siguiente la <strong>desactiva</strong>. Es el clásico
          telerruptor para prender una luz desde varios pulsadores.
        </p>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th>Entrada Trg</th>
                <td>Cada vez que Trg pasa de 0 a 1 (y S y R están en 0), la salida cambia de estado.</td>
              </tr>
              <tr>
                <th>Entrada S</th>
                <td>Activa la salida.</td>
              </tr>
              <tr>
                <th>Entrada R</th>
                <td>Desactiva la salida.</td>
              </tr>
              <tr>
                <th>Parámetros</th>
                <td>
                  Selección de prioridad: <strong>RS</strong> (tiene prioridad R) o <strong>SR</strong> (tiene prioridad S). Remanencia.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="hint">
          La señal en Trg no hace nada mientras S o R estén en 1. En este simulador el relé de impulsos usa prioridad RS.
        </p>
        <StaticChart title="Relé de impulsos: cada flanco de Trg cambia Q; R la apaga" traces={RI_CHART.filter((t) => t.label !== 'S')} />
        <h4>Probalos</h4>
        <Scope fns={LATCH_FNS} />
      </>
    ),
    activities: [
      {
        id: 'lt-rs-1',
        type: 'mc',
        q: 'En un RS, apretás S y lo soltás. ¿Qué pasa con Q?',
        options: ['Se apaga al soltar', 'Queda en 1 hasta que se active R', 'Titila', 'Nada'],
        answer: 1,
        explain: 'SET pone un 1 que permanece hasta el RESET.',
      },
      {
        id: 'lt-rs-2',
        type: 'num',
        q: 'En el relé autoenclavador, S = 1 y R = 1 al mismo tiempo. ¿Cuánto vale Q?',
        answer: 0,
        tolerance: 0,
        unit: '',
        explain: 'Según el apunte: si S y R son 1, se desactiva la salida.',
      },
      {
        id: 'lt-rs-3',
        type: 'num',
        q: 'Relé de impulsos con Q = 0. Le das 3 impulsos en Trg (S y R en 0). ¿Cuánto vale Q?',
        answer: 1,
        tolerance: 0,
        unit: '',
        explain: '1.º → 1, 2.º → 0, 3.º → 1.',
      },
      {
        id: 'lt-rs-4',
        type: 'mc',
        q: 'En el relé de impulsos con prioridad SR, si S y R valen 1…',
        options: ['Gana S: la salida se activa', 'Gana R: la salida se apaga', 'La salida titila', 'Cuenta un impulso'],
        answer: 0,
        explain: 'SR = tiene prioridad S.',
      },
      {
        id: 'lt-rs-5',
        type: 'mc',
        q: '¿Qué circuito clásico reemplaza el relé de impulsos?',
        options: ['El telerruptor (luz desde varios pulsadores)', 'El fusible', 'El relé térmico', 'El transformador'],
        answer: 0,
        explain: 'Cada pulsación cambia el estado de la luz: es un telerruptor.',
      },
    ],
  },
  {
    id: 'logo-marcas-contador',
    title: 'Marcas y contador',
    icon: '🔢',
    summary: 'Memorias internas (M) y el contador adelante/atrás.',
    content: (
      <>
        <h4>Marcas: memorias internas</h4>
        <p>
          Las <strong>marcas</strong> sirven para guardar valores dentro del programa, como si fueran salidas que no tienen borne. Hay dos
          tipos:
        </p>
        <ul>
          <li>
            <strong>Marcas internas (IM)</strong>: sólo aparecen en el diagrama de contactos (KOP). En realidad sólo ordenan las conexiones
            y no consumen recursos.
          </li>
          <li>
            <strong>Marcas M</strong>: guardan un valor y lo devuelven en su salida. Las digitales van de <strong>M1 a M27</strong> y las
            analógicas de <strong>AM1 a AM6</strong>.
          </li>
        </ul>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Marca reservada</th>
                <th>Para qué sirve</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>M8</td>
                <td>Marca de arranque: vale 1 sólo en el primer ciclo después de encender (sirve para inicializar).</td>
              </tr>
              <tr>
                <td>M25</td>
                <td>Retroiluminación de la pantalla del LOGO!.</td>
              </tr>
              <tr>
                <td>M26</td>
                <td>Retroiluminación de la pantalla externa TD.</td>
              </tr>
              <tr>
                <td>M27</td>
                <td>Elige el juego de caracteres de los textos de aviso.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <h4>Contador adelante/atrás</h4>
        <p>
          Cada impulso en la entrada <strong>suma o resta 1</strong> a una cuenta interna. Cuando la cuenta llega a los umbrales que
          configuraste, la salida se activa o se desactiva.
        </p>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th>Entrada R</th>
                <td>Pone en 0 la cuenta y la salida.</td>
              </tr>
              <tr>
                <th>Entrada Cnt</th>
                <td>
                  Cuenta los cambios de <strong>0 a 1</strong> (flanco de subida). El paso de 1 a 0 no se cuenta. Entradas comunes: hasta{' '}
                  <strong>5 Hz</strong>. Entradas rápidas <strong>I5 / I6</strong> (en los modelos de 12/24 V): hasta <strong>2 kHz</strong>
                  .
                </td>
              </tr>
              <tr>
                <th>Entrada Dir</th>
                <td>
                  Sentido de conteo: <strong>Dir = 0 suma</strong>, <strong>Dir = 1 resta</strong>.
                </td>
              </tr>
              <tr>
                <th>Parámetros</th>
                <td>
                  <strong>On</strong>: umbral de conexión. <strong>Off</strong>: umbral de desconexión (de 0 a 999999). Remanencia de la
                  cuenta.
                </td>
              </tr>
              <tr>
                <th>Salida Q</th>
                <td>
                  Si On ≥ Off: Q se activa cuando la cuenta llega a On (Cnt ≥ On) y se desactiva cuando baja de Off (Cnt &lt; Off). Entre
                  los dos umbrales mantiene el estado que tenía.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <StaticChart title="Contador con On = 3 y Off = 2: cuenta 4 hacia arriba, después baja con Dir = 1" traces={CNT_CHART} />
        <p className="hint">
          En el gráfico: con el 3.er impulso Q se activa. Con Dir = 1 la cuenta baja 4 → 3 → 2 (Q sigue en 1) → 1 (menor que Off: Q se
          apaga) → 0.
        </p>
        <h4>Probalo</h4>
        <Scope fns={COUNTER_FNS} />
        <p className="tip">
          Ejemplos: contar botellas en una cinta y parar cuando llegan a 12; contar autos que entran (suma) y salen (resta) de un
          estacionamiento y prender el cartel “COMPLETO”.
        </p>
      </>
    ),
    activities: [
      {
        id: 'lt-cnt-1',
        type: 'num',
        q: '¿Hasta qué marca digital (M…) llega el LOGO!? Escribí el número.',
        answer: 27,
        tolerance: 0,
        unit: '',
        explain: 'Las marcas digitales van de M1 a M27.',
      },
      {
        id: 'lt-cnt-2',
        type: 'mc',
        q: '¿Para qué sirve la marca M8?',
        options: ['Retroiluminación', 'Marca de arranque (primer ciclo)', 'Cuenta impulsos', 'Es una entrada'],
        answer: 1,
        explain: 'M8 es la marca de arranque.',
      },
      {
        id: 'lt-cnt-3',
        type: 'mc',
        q: 'En el contador, con Dir = 1…',
        options: ['Suma', 'Resta', 'Se pone en cero', 'No cuenta'],
        answer: 1,
        explain: 'Dir = 0 incrementa, Dir = 1 decrementa.',
      },
      {
        id: 'lt-cnt-4',
        type: 'num',
        q: '¿Cuál es la frecuencia máxima de conteo (en Hz) en una entrada común del LOGO!?',
        answer: 5,
        tolerance: 0,
        unit: 'Hz',
        explain: 'Entradas comunes: 5 Hz. Para procesos rápidos se usan I5/I6 (hasta 2 kHz).',
      },
      {
        id: 'lt-cnt-5',
        type: 'num',
        q: 'Contador con On = 5 y Off = 2. Contás 6 impulsos hacia arriba y después 3 hacia abajo. ¿Cuánto vale la cuenta?',
        answer: 3,
        tolerance: 0,
        unit: '',
        explain: '6 − 3 = 3.',
      },
      {
        id: 'lt-cnt-6',
        type: 'num',
        q: 'En el ejemplo anterior (cuenta = 3, On = 5, Off = 2), ¿cuánto vale Q?',
        answer: 1,
        tolerance: 0,
        unit: '',
        explain: 'Q se activó al llegar a 5 y sólo se apaga cuando la cuenta sea menor que 2. Con 3 sigue en 1.',
      },
    ],
  },
]

export const getLogoTopic = (id: string) => LOGO_TOPICS.find((t) => t.id === id)
