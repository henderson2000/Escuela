import { cellKey, type MapState } from './world'

const C = 46 // tamaño de cada casilla

/** Dibujo del taller: grilla, cajas, tornillos, aceite, meta y el robot. */
export function WorldView({ state, say, crashed }: { state: MapState; say?: string; crashed?: boolean }) {
  const W = state.w * C
  const H = state.h * C
  const cells = []
  for (let y = 0; y < state.h; y++)
    for (let x = 0; x < state.w; x++) {
      const k = cellKey(x, y)
      cells.push(
        <g key={k} transform={`translate(${x * C} ${y * C})`}>
          <rect width={C} height={C} className={`bw-cell ${(x + y) % 2 ? 'alt' : ''}`} />
          {state.walls.has(k) && (
            <text x={C / 2} y={C / 2 + 2} className="bw-emoji">
              📦
            </text>
          )}
          {state.goal === k && (
            <text x={C / 2} y={C / 2 + 2} className="bw-emoji">
              🏁
            </text>
          )}
          {state.oil.has(k) && <ellipse cx={C / 2} cy={C / 2 + 6} rx={15} ry={9} className="bw-oil" />}
          {state.screws.has(k) && (
            <text x={C / 2} y={C / 2 + 2} className="bw-emoji small">
              🔩
            </text>
          )}
        </g>,
      )
    }
  const rx = state.x * C + C / 2
  const ry = state.y * C + C / 2
  const rot = state.dir * 90
  return (
    <svg viewBox={`-4 -4 ${W + 8} ${H + 8}`} className="bw-world" role="img" aria-label="Taller del robot">
      {cells}
      <g transform={`translate(${rx} ${ry})`} className={`bw-robot ${crashed ? 'crash' : ''}`}>
        <g transform={`rotate(${rot})`}>
          <path d="M15 0 L6 -8 L6 8 Z" className="bw-arrow" />
        </g>
        <text y={2} className="bw-emoji">
          🤖
        </text>
        {say !== undefined && (
          <g transform="translate(10 -30)">
            <rect x={-4} y={-14} width={say.length * 9 + 14} height={22} rx={8} className="bw-bubble" />
            <text x={3} y={2} className="bw-say">
              {say}
            </text>
          </g>
        )}
      </g>
    </svg>
  )
}
