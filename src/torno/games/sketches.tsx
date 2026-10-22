// Bosquejos de piezas para los juegos del torno: vista lateral con cotas y, si hace falta, vista de frente.

export type PieceShape = 'cyl' | 'hex' | 'square' | 'irregular' | 'stepped' | 'tube'
export type PieceFeature = 'cone' | 'longcone' | 'thread' | 'groove' | 'knurl' | 'bore' | 'drill' | 'face' | 'part' | 'center' | 'chamfer'

export interface PieceSpec {
  /** largo en mm */
  L: number
  /** diámetro (o entre caras) en mm */
  D: number
  shape?: PieceShape
  feature?: PieceFeature
  /** texto extra debajo (material, cantidad…) */
  note?: string
}

const METAL = '#cbd3dd'
const EDGE = '#8794a5'
const HL = '#ffb020'
const DIM = '#9aa8bd'

export function PieceSketch({ L, D, shape = 'cyl', feature, note }: PieceSpec) {
  const x0 = 46
  const cy = 66
  const maxW = shape === 'cyl' || shape === 'stepped' || shape === 'tube' ? 300 : 250
  const k = Math.min(maxW / L, 84 / D)
  const w = Math.max(10, L * k)
  const h = Math.max(8, D * k)
  const x1 = x0 + w
  const top = cy - h / 2
  const bot = cy + h / 2
  let outline: string
  if (feature === 'cone') {
    const xc = x0 + w * 0.65
    const r2 = h * 0.28
    outline = `M${x0} ${top} H${xc} L${x1} ${cy - r2} V${cy + r2} L${xc} ${bot} H${x0} Z`
  } else if (feature === 'longcone') {
    outline = `M${x0} ${top} L${x1} ${cy - h * 0.32} V${cy + h * 0.32} L${x0} ${bot} Z`
  } else if (feature === 'chamfer') {
    const c = Math.min(8, h / 3)
    outline = `M${x0} ${top} H${x1 - c} L${x1} ${top + c} V${bot - c} L${x1 - c} ${bot} H${x0} Z`
  } else if (shape === 'stepped') {
    const xs = x0 + w * 0.45
    const r2 = h * 0.32
    outline = `M${x0} ${top} H${xs} V${cy - r2} H${x1} V${cy + r2} H${xs} V${bot} H${x0} Z`
  } else {
    outline = `M${x0} ${top} H${x1} V${bot} H${x0} Z`
  }
  const thr = feature === 'thread' ? Math.max(3, Math.min(6, h / 6)) : 0
  const xt = x0 + w * 0.55
  const nT = Math.max(3, Math.floor((x1 - xt) / 7))
  const end = shape === 'hex' || shape === 'square' || shape === 'irregular' || shape === 'tube'
  const ex = 388
  const er = 26
  return (
    <svg viewBox="0 0 430 150" className="tn-sketch" role="img" aria-label={`Pieza de ${L} mm de largo y ${D} mm de diámetro`}>
      <path d={outline} fill={METAL} stroke={EDGE} strokeWidth={1.5} />
      {shape === 'hex' && (
        <>
          <line x1={x0} y1={cy - h / 4} x2={x1} y2={cy - h / 4} stroke={EDGE} />
          <line x1={x0} y1={cy + h / 4} x2={x1} y2={cy + h / 4} stroke={EDGE} />
        </>
      )}
      {(shape === 'tube' || feature === 'bore') && (
        <>
          <line x1={shape === 'tube' ? x0 : x0 + w * 0.5} y1={cy - h * 0.28} x2={x1} y2={cy - h * 0.28} stroke="#5b6b7d" strokeDasharray="5 3" />
          <line x1={shape === 'tube' ? x0 : x0 + w * 0.5} y1={cy + h * 0.28} x2={x1} y2={cy + h * 0.28} stroke="#5b6b7d" strokeDasharray="5 3" />
          {feature === 'bore' && <line x1={x0 + w * 0.5} y1={cy - h * 0.28} x2={x0 + w * 0.5} y2={cy + h * 0.28} stroke="#5b6b7d" strokeDasharray="5 3" />}
        </>
      )}
      {feature === 'drill' && (
        <>
          <path d={`M${x1} ${cy - Math.max(3, h * 0.14)} H${x1 - w * 0.35} L${x1 - w * 0.35 - 6} ${cy} L${x1 - w * 0.35} ${cy + Math.max(3, h * 0.14)} H${x1}`} fill="none" stroke="#5b6b7d" strokeDasharray="4 3" />
          <rect x={x1 + 8} y={cy - 4} width={60} height={8} fill="#b8c2cf" stroke="#5b6b7d" />
          <polygon points={`${x1 + 2},${cy} ${x1 + 8},${cy - 4} ${x1 + 8},${cy + 4}`} fill="#b8c2cf" />
        </>
      )}
      {feature === 'thread' &&
        Array.from({ length: nT }, (_, i) => {
          const x = xt + i * 7
          return (
            <g key={i} stroke="#5b6b7d" strokeWidth={1.4}>
              <path d={`M${x} ${top} L${x + 3.5} ${top + thr} L${x + 7} ${top}`} fill="none" />
              <path d={`M${x} ${bot} L${x + 3.5} ${bot - thr} L${x + 7} ${bot}`} fill="none" />
            </g>
          )
        })}
      {feature === 'groove' && <rect x={x0 + w * 0.5} y={bot - Math.max(4, h * 0.22)} width={Math.max(5, w * 0.05)} height={Math.max(4, h * 0.22) + 1} fill="#0c1220" />}
      {feature === 'knurl' &&
        Array.from({ length: Math.max(4, Math.floor((w * 0.4) / 6)) }, (_, i) => {
          const x = x0 + w * 0.3 + i * 6
          return (
            <g key={i} stroke="#5b6b7d" strokeWidth={1}>
              <line x1={x} y1={top} x2={x + 8} y2={bot} />
              <line x1={x + 8} y1={top} x2={x} y2={bot} />
            </g>
          )
        })}
      {feature === 'face' && <line x1={x1} y1={top} x2={x1} y2={bot} stroke={HL} strokeWidth={4} />}
      {feature === 'part' && <line x1={x0 + w * 0.7} y1={top - 8} x2={x0 + w * 0.7} y2={bot + 8} stroke={HL} strokeWidth={2} strokeDasharray="5 3" />}
      {feature === 'center' && (
        <path d={`M${x1} ${cy - 5} L${x1 - 8} ${cy} L${x1} ${cy + 5}`} fill="#0c1220" stroke={HL} strokeWidth={1.5} />
      )}
      {(feature === 'cone' || feature === 'longcone') && (
        <line
          x1={feature === 'cone' ? x0 + w * 0.65 : x0}
          y1={bot}
          x2={x1}
          y2={feature === 'cone' ? cy + h * 0.28 : cy + h * 0.32}
          stroke={HL}
          strokeWidth={2.5}
        />
      )}
      {/* eje */}
      <path d={`M${x0 - 12} ${cy} H${Math.min(x1 + 12, 350)}`} stroke="#36c2ff" strokeDasharray="8 3 2 3" strokeWidth={1} opacity={0.7} />
      {/* cotas */}
      <g stroke={DIM} strokeWidth={1}>
        <line x1={x0} y1={bot + 6} x2={x0} y2={bot + 24} />
        <line x1={x1} y1={bot + 6} x2={x1} y2={bot + 24} />
        <line x1={x0} y1={bot + 18} x2={x1} y2={bot + 18} />
        <line x1={x0 - 22} y1={top} x2={x0 - 22} y2={bot} />
        <line x1={x0 - 28} y1={top} x2={x0 - 4} y2={top} />
        <line x1={x0 - 28} y1={bot} x2={x0 - 4} y2={bot} />
      </g>
      <text x={(x0 + x1) / 2} y={bot + 34} textAnchor="middle" fill="currentColor" style={{ fontSize: 13, fontWeight: 700 }}>
        {L} mm
      </text>
      <text x={x0 - 26} y={top - 6} textAnchor="middle" fill="currentColor" style={{ fontSize: 12, fontWeight: 700 }}>
        {shape === 'hex' || shape === 'square' ? `${D} e/c` : `ø ${D}`}
      </text>
      {/* vista de frente */}
      {end && (
        <g>
          {shape === 'hex' && (
            <polygon
              points={Array.from({ length: 6 }, (_, i) => {
                const a = (Math.PI / 3) * i
                return `${(ex + er * Math.cos(a)).toFixed(1)},${(cy + er * Math.sin(a)).toFixed(1)}`
              }).join(' ')}
              fill={METAL}
              stroke={EDGE}
            />
          )}
          {shape === 'square' && <rect x={ex - er * 0.8} y={cy - er * 0.8} width={er * 1.6} height={er * 1.6} fill={METAL} stroke={EDGE} />}
          {shape === 'irregular' && (
            <path d={`M${ex - 26} ${cy - 18} L${ex + 22} ${cy - 24} L${ex + 28} ${cy + 10} L${ex + 6} ${cy + 26} L${ex - 24} ${cy + 20} Z`} fill={METAL} stroke={EDGE} />
          )}
          {shape === 'tube' && (
            <>
              <circle cx={ex} cy={cy} r={er} fill={METAL} stroke={EDGE} />
              <circle cx={ex} cy={cy} r={er * 0.55} fill="#0c1220" stroke={EDGE} />
            </>
          )}
          <text x={ex} y={cy + er + 18} textAnchor="middle" fill={DIM} style={{ fontSize: 11 }}>
            de frente
          </text>
        </g>
      )}
      {note && (
        <text x={215} y={146} textAnchor="middle" fill={DIM} style={{ fontSize: 12 }}>
          {note}
        </text>
      )}
    </svg>
  )
}
