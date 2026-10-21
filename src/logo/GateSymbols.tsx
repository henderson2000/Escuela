// Símbolos de las compuertas lógicas en tres estilos:
//  · 'ansi'      → formas distintivas (norma americana)
//  · 'iec'       → cajas rectangulares con &, ≥1, =1, 1 (lo que usa LOGO! en FUP)
//  · 'contactos' → circuito equivalente con contactos NA / NC (como la tabla del apunte)
// Los trazos usan currentColor: heredan el color del texto.

import type { JSX } from 'react'

export type Gate = 'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR'
export type GateStyle = 'ansi' | 'iec' | 'contactos'

export const GATES: Gate[] = ['AND', 'OR', 'XOR', 'NOT', 'NAND', 'NOR']

export const GATE_NAMES: Record<Gate, string> = {
  AND: 'Y (AND)',
  OR: 'O (OR)',
  NOT: 'Negación (NOT)',
  NAND: 'Y negada (NAND)',
  NOR: 'O negada (NOR)',
  XOR: 'O exclusiva (XOR)',
}

// U+0305 (raya combinada) sobre cada carácter negado
export const GATE_EXPR: Record<Gate, string> = {
  AND: 'z = a · b',
  OR: 'z = a + b',
  NOT: 'z = a̅',
  NAND: 'z = a̅·̅b̅',
  NOR: 'z = a̅+̅b̅',
  XOR: 'z = a̅ · b + a · b̅',
}

export function gateEval(g: Gate, a: number, b: number): number {
  const A = a ? 1 : 0
  const B = b ? 1 : 0
  switch (g) {
    case 'AND':
      return A & B
    case 'OR':
      return A | B
    case 'NOT':
      return 1 - A
    case 'NAND':
      return 1 - (A & B)
    case 'NOR':
      return 1 - (A | B)
    case 'XOR':
      return A ^ B
  }
}

export const SIGNAL_ON = '#ef4444'
export const SIGNAL_OFF = '#6b85b8'

type Vals = { a?: number; b?: number; z?: number }

const wire = (v?: number) => (v === undefined ? 'currentColor' : v ? SIGNAL_ON : SIGNAL_OFF)

const LABEL = {
  fontSize: 11,
  fontFamily: 'system-ui, sans-serif',
  fill: 'currentColor',
  stroke: 'none',
} as const

const negated = (g: Gate) => g === 'NAND' || g === 'NOR' || g === 'NOT'

/* ---------------------------------------------------------------- ANSI */

function Ansi({ gate, v }: { gate: Gate; v: Vals }) {
  const one = gate === 'NOT'
  const ya = one ? 35 : 22
  const yb = 48
  const inEnd = gate === 'AND' || gate === 'NAND' ? 30 : gate === 'XOR' ? 26 : gate === 'NOT' ? 35 : 32
  const tip = gate === 'AND' || gate === 'NAND' ? 85 : gate === 'NOT' ? 80 : 88
  const outStart = negated(gate) ? tip + 8 : tip
  let body: string
  if (gate === 'AND' || gate === 'NAND') body = 'M30 10 H60 A25 25 0 0 1 60 60 H30 Z'
  else if (gate === 'NOT') body = 'M35 12 L80 35 L35 58 Z'
  else body = 'M28 10 Q65 10 88 35 Q65 60 28 60 Q40 35 28 10 Z'
  return (
    <>
      <path d={`M4 ${ya} H${inEnd}`} stroke={wire(v.a)} />
      {!one && <path d={`M4 ${yb} H${inEnd}`} stroke={wire(v.b)} />}
      <path d={body} />
      {gate === 'XOR' && <path d="M22 10 Q34 35 22 60" />}
      {negated(gate) && <circle cx={tip + 4} cy={35} r={4} />}
      <path d={`M${outStart} 35 H116`} stroke={wire(v.z)} />
      <text x={5} y={ya - 4} {...LABEL}>
        a
      </text>
      {!one && (
        <text x={5} y={yb - 4} {...LABEL}>
          b
        </text>
      )}
      <text x={109} y={31} {...LABEL}>
        z
      </text>
    </>
  )
}

/* ---------------------------------------------------------------- IEC (LOGO!) */

const IEC_TEXT: Record<Gate, string> = {
  AND: '&',
  NAND: '&',
  OR: '≥1',
  NOR: '≥1',
  XOR: '=1',
  NOT: '1',
}

function Iec({ gate, v }: { gate: Gate; v: Vals }) {
  const one = gate === 'NOT'
  const ya = one ? 35 : 22
  const yb = 48
  const neg = negated(gate)
  return (
    <>
      <path d={`M4 ${ya} H34`} stroke={wire(v.a)} />
      {!one && <path d={`M4 ${yb} H34`} stroke={wire(v.b)} />}
      <rect x={34} y={8} width={46} height={54} rx={2} />
      <text
        x={57}
        y={28}
        textAnchor="middle"
        style={{
          fontSize: 15,
          fontWeight: 700,
          fontFamily: 'system-ui, sans-serif',
        }}
        fill="currentColor"
        stroke="none"
      >
        {IEC_TEXT[gate]}
      </text>
      {neg && <circle cx={84} cy={35} r={4} />}
      <path d={`M${neg ? 88 : 80} 35 H116`} stroke={wire(v.z)} />
      <text x={5} y={ya - 4} {...LABEL}>
        a
      </text>
      {!one && (
        <text x={5} y={yb - 4} {...LABEL}>
          b
        </text>
      )}
      <text x={109} y={31} {...LABEL}>
        z
      </text>
    </>
  )
}

/* ---------------------------------------------------------------- contactos */

/** Contacto horizontal entre x y x+24. NA en reposo abierto, NC en reposo cerrado. */
function Contact({ x, y, nc, label, neg, val }: { x: number; y: number; nc: boolean; label: string; neg: boolean; val?: number }) {
  // si hay valores, se dibuja la posición real del contacto
  const closed = val === undefined ? nc : nc ? val === 0 : val === 1
  const color = val === undefined ? 'currentColor' : closed ? SIGNAL_ON : SIGNAL_OFF
  let blade: string
  if (nc) blade = closed ? `M${x} ${y} L${x + 28} ${y - 6}` : `M${x} ${y} L${x + 17} ${y - 13}`
  else blade = closed ? `M${x} ${y} L${x + 25} ${y - 2}` : `M${x} ${y} L${x + 21} ${y - 11}`
  return (
    <g>
      <circle cx={x} cy={y} r={1.8} fill="currentColor" stroke="none" />
      <circle cx={x + 24} cy={y} r={1.8} fill="currentColor" stroke="none" />
      {nc && <path d={`M${x + 24} ${y} V${y - 8}`} />}
      <path d={blade} stroke={color} strokeWidth={2.4} />
      <text x={x + 12} y={y - 15} textAnchor="middle" {...LABEL} style={{ fontSize: 12, fontStyle: 'italic' }}>
        {label}
      </text>
      {neg && <path d={`M${x + 8.5} ${y - 24} H${x + 15.5}`} strokeWidth={1.2} />}
    </g>
  )
}

function Contactos({ gate, v }: { gate: Gate; v: Vals }) {
  const Y = 48
  const T = 30 // rama de arriba
  const B = 68 // rama de abajo
  const els: JSX.Element[] = []
  const w = (d: string, k: string) => els.push(<path key={k} d={d} />)
  const c = (k: string, x: number, y: number, nc: boolean, label: 'a' | 'b') =>
    els.push(<Contact key={k} x={x} y={y} nc={nc} label={label} neg={nc} val={label === 'a' ? v.a : v.b} />)

  switch (gate) {
    case 'AND':
    case 'NOR': {
      const nc = gate === 'NOR'
      w(`M8 ${Y} H44 M68 ${Y} H104 M128 ${Y} H166`, 'w')
      c('a', 44, Y, nc, 'a')
      c('b', 104, Y, nc, 'b')
      break
    }
    case 'OR':
    case 'NAND': {
      const nc = gate === 'NAND'
      w(`M8 ${Y} H34 M34 ${T} V${B} M34 ${T} H64 M88 ${T} H120 M34 ${B} H64 M88 ${B} H120 M120 ${T} V${B} M120 ${Y} H166`, 'w')
      c('a', 64, T, nc, 'a')
      c('b', 64, B, nc, 'b')
      break
    }
    case 'NOT':
      w(`M8 ${Y} H74 M98 ${Y} H166`, 'w')
      c('a', 74, Y, true, 'a')
      break
    case 'XOR':
      w(
        `M8 ${Y} H28 M28 ${T} V${B} M28 ${T} H44 M68 ${T} H96 M120 ${T} H140 M28 ${B} H44 M68 ${B} H96 M120 ${B} H140 M140 ${T} V${B} M140 ${Y} H166`,
        'w',
      )
      c('a1', 44, T, true, 'a')
      c('b1', 96, T, false, 'b')
      c('a2', 44, B, false, 'a')
      c('b2', 96, B, true, 'b')
      break
  }
  return (
    <>
      <path d={`M8 ${Y - 12} V${Y + 12}`} strokeWidth={3} stroke={v.a === undefined ? 'currentColor' : SIGNAL_ON} />
      {els}
      <circle cx={176} cy={Y} r={9} stroke={wire(v.z)} fill={v.z ? 'rgba(239,68,68,0.25)' : 'none'} />
      <path d={`M169.6 ${Y - 6.4} L182.4 ${Y + 6.4} M182.4 ${Y - 6.4} L169.6 ${Y + 6.4}`} strokeWidth={1.2} stroke={wire(v.z)} />
      <text x={176} y={Y - 14} textAnchor="middle" {...LABEL} style={{ fontSize: 12, fontStyle: 'italic' }}>
        z
      </text>
    </>
  )
}

export function GateSymbol({ gate, style, width, values }: { gate: Gate; style: GateStyle; width?: number; values?: Vals }) {
  const v: Vals = values ? { ...values, z: values.z ?? gateEval(gate, values.a ?? 0, values.b ?? 0) } : {}
  const vb = style === 'contactos' ? '0 0 196 84' : '0 0 120 70'
  const w = width ?? (style === 'contactos' ? 196 : 120)
  return (
    <svg
      viewBox={vb}
      width={w}
      style={{
        maxWidth: '100%',
        height: 'auto',
        display: 'block',
        overflow: 'visible',
      }}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={`${GATE_NAMES[gate]} — ${style === 'contactos' ? 'equivalente en contactos' : style === 'iec' ? 'símbolo LOGO!' : 'símbolo ANSI'}`}
    >
      {style === 'ansi' && <Ansi gate={gate} v={v} />}
      {style === 'iec' && <Iec gate={gate} v={v} />}
      {style === 'contactos' && <Contactos gate={gate} v={v} />}
    </svg>
  )
}
