import { useState, type ReactElement } from 'react'
import { Segmented } from '../../components/ui'
import { CAJA_OPS, TAPA_OPS, BUDINERA_OPS, type Op } from './catalog'

type Proj = 'caja' | 'tapa' | 'budinera'

const DIMS: Record<Proj, { W: number; H: number; f: number; s: number; ops: Op[]; name: string }> = {
  caja: { W: 130, H: 290, f: 5, s: 35, ops: CAJA_OPS, name: 'Caja (Ej. 01-01)' },
  tapa: { W: 102, H: 262, f: 5, s: 20, ops: TAPA_OPS, name: 'Tapa (Ej. 02-01)' },
  budinera: { W: 200, H: 333, f: 8, s: 63, ops: BUDINERA_OPS, name: 'Budinera (Ej. 03)' },
}

/**
 * Plano del desarrollo con el trazado que se va agregando en cada operación:
 * líneas finas = trazado con gramil, llenas = corte, de trazos = plegado.
 */
export function Desarrollo({ initial = 'caja' as Proj, fixed }: { initial?: Proj; fixed?: boolean }) {
  const [proj, setProj] = useState<Proj>(initial)
  const d = DIMS[proj]
  const [k, setK] = useState(d.ops.length - 1)
  const op = d.ops[Math.min(k, d.ops.length - 1)]
  const n = op.n
  const { W, H, f, s } = d
  const pad = 12
  const lines: ReactElement[] = []
  const L = (x1: number, y1: number, x2: number, y2: number, cls: string, key: string) => lines.push(<line key={key} x1={x1} y1={y1} x2={x2} y2={y2} className={cls} />)
  // trazado con el gramil (op 20)
  if (n >= 20)
    for (const v of [f, s]) {
      L(v, 0, v, H, 'trace', `tv${v}`)
      L(W - v, 0, W - v, H, 'trace', `tw${v}`)
      L(0, v, W, v, 'trace', `th${v}`)
      L(0, H - v, W, H - v, 'trace', `ti${v}`)
    }
  const corners: [number, number, number, number][] = [
    [0, 0, 1, 1],
    [W, 0, -1, 1],
    [0, H, 1, -1],
    [W, H, -1, -1],
  ]
  if (proj !== 'budinera') {
    if (n >= 30) corners.forEach(([x, y, sx, sy], i) => L(x + sx * f, y + sy * f, x + sx * s, y + sy * s, n >= 50 ? 'cut' : 'trace2', `d${i}`))
    if (n >= 40)
      corners.forEach(([x, y, sx, sy], i) => {
        L(x + sx * s, y + sy * f, x + sx * (s - f), y, n >= 60 ? 'cut' : 'trace2', `c${i}a`)
        L(x + sx * f, y + sy * s, x, y + sy * (s - f), n >= 60 ? 'cut' : 'trace2', `c${i}b`)
      })
    if (n >= 50) corners.forEach(([x, y, sx, sy], i) => L(x + sx * s, y, x + sx * s, y + sy * s, 'cut', `k${i}`))
    if (n >= 70) {
      // líneas de plegado
      L(f, s, f, H - s, 'fold', 'pf1')
      L(W - f, s, W - f, H - s, 'fold', 'pf2')
      L(s, f, W - s, f, 'fold', 'pf3')
      L(s, H - f, W - s, H - f, 'fold', 'pf4')
    }
    if (n >= 90) {
      L(s, 0, s, H, 'fold', 'pl1')
      L(W - s, 0, W - s, H, 'fold', 'pl2')
      L(s, s, W - s, s, 'fold', 'pl3')
      L(s, H - s, W - s, H - s, 'fold', 'pl4')
    }
  } else {
    // budinera: cabeceras que se abren 18 mm y diagonales a 15 mm
    if (n >= 30)
      for (const [y, sy] of [
        [0, 1],
        [H, -1],
      ])
        for (const [x, sx] of [
          [s, -1],
          [W - s, 1],
        ])
          L(x, y + sy * s, x + sx * 18, y + sy * f, n >= 80 ? 'cut' : 'trace2', `b30${x}${y}`)
    if (n >= 40) corners.forEach(([x, y, sx, sy], i) => L(x + sx * s, y + sy * s, x + sx * f, y + sy * (s - 15), n >= 80 ? 'cut' : 'trace2', `b40${i}`))
    if (n >= 90) {
      L(s, s, s, H - s, 'fold', 'bl1')
      L(W - s, s, W - s, H - s, 'fold', 'bl2')
      L(s, s, W - s, s, 'fold', 'bl3')
      L(s, H - s, W - s, H - s, 'fold', 'bl4')
    }
    if (n >= 100) corners.forEach(([x, y, sx, sy], i) => L(x + sx * s, y + sy * s, x + sx * f * 2, y + sy * f * 2, 'fold', `b100${i}`))
    if (n >= 110) {
      L(f, s, f, H - s, 'fold', 'bf1')
      L(W - f, s, W - f, H - s, 'fold', 'bf2')
    }
  }
  return (
    <div className="calc">
      {!fixed && (
        <Segmented<Proj>
          value={proj}
          onChange={(p) => {
            setProj(p)
            setK(DIMS[p].ops.length - 1)
          }}
          options={[
            { value: 'caja', label: 'Caja' },
            { value: 'tapa', label: 'Tapa' },
            { value: 'budinera', label: 'Budinera' },
          ]}
        />
      )}
      <div className="h1-plan">
        <svg viewBox={`${-pad} ${-pad} ${W + 2 * pad + 40} ${H + 2 * pad}`} role="img" aria-label={`Desarrollo de la ${d.name}`}>
          <rect x={0} y={0} width={W} height={H} className="sheet" />
          {lines}
          <text x={W + 8} y={H / 2} className="dim" transform={`rotate(90 ${W + 8} ${H / 2})`}>
            {H}
          </text>
          <text x={W / 2} y={H + 10} className="dim">
            {W}
          </text>
        </svg>
        <div>
          <p>
            <b>{d.name}</b> · chapa galvanizada Nº 30 · desarrollo {W} × {H} mm
          </p>
          <label className="field">
            <span className="field-label">
              Operación {op.n} ({Math.min(k, d.ops.length - 1) + 1} de {d.ops.length})
            </span>
            <input type="range" min={0} max={d.ops.length - 1} value={Math.min(k, d.ops.length - 1)} onChange={(e) => setK(Number(e.target.value))} />
          </label>
          <p className="hint">{op.text}</p>
          <p className="h1-legend">
            <span className="lg trace" /> trazado <span className="lg cut" /> corte <span className="lg fold" /> plegado
          </p>
        </div>
      </div>
    </div>
  )
}
