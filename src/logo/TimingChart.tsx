import { useEffect, useRef, useState, type JSX } from 'react'

// Diagrama de tiempos (cronograma): cada señal es una fila con una onda cuadrada,
// el nombre a la izquierda y el eje de tiempo en segundos abajo.

export interface Trace {
  label: string
  /** una muestra cada `stepMs` (0 o 1) */
  values: number[]
}

const LABEL_W = 64
const ROW_H = 34
const TOP = 16
const AXIS_H = 24

function niceTick(totalMs: number, maxTicks: number): number {
  const opts = [100, 200, 500, 1000, 2000, 5000, 10000, 30000, 60000]
  for (const o of opts) if (totalMs / o <= maxTicks) return o
  return 120000
}

const fmtS = (ms: number) => {
  const s = ms / 1000
  return `${Number.isInteger(s) ? s : s.toFixed(1).replace('.', ',')} s`
}

export function TimingChart({
  traces,
  stepMs,
  width: fixedWidth,
  marks,
  showGrid = true,
}: {
  traces: Trace[]
  stepMs: number
  width?: number
  marks?: { atMs: number; label: string }[]
  showGrid?: boolean
}) {
  // sin `width`, el ancho del dibujo sigue al del contenedor para que el texto no quede diminuto en el celular
  const box = useRef<SVGSVGElement>(null)
  const [measured, setMeasured] = useState(640)
  useEffect(() => {
    if (fixedWidth || !box.current || typeof ResizeObserver === 'undefined') return
    const el = box.current
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth
      if (w > 0) setMeasured(Math.max(300, Math.min(900, Math.round(w))))
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
    }
  }, [fixedWidth])
  const width = fixedWidth ?? measured
  const n = Math.max(1, ...traces.map((t) => t.values.length))
  const totalMs = n * stepMs
  const plotW = width - LABEL_W - 12
  const H = TOP + traces.length * ROW_H + AXIS_H
  const xOf = (ms: number) => LABEL_W + (ms / totalMs) * plotW
  const tick = niceTick(totalMs, Math.max(3, Math.min(12, Math.floor(plotW / 44))))
  const ticks: number[] = []
  for (let t = 0; t <= totalMs + 0.5; t += tick) ticks.push(t)
  const plotBottom = TOP + traces.length * ROW_H

  return (
    <svg
      ref={box}
      viewBox={`0 0 ${width} ${H}`}
      width="100%"
      style={{ display: 'block', height: 'auto' }}
      role="img"
      aria-label={`Diagrama de tiempos de ${traces.map((t) => t.label).join(', ')}`}
    >
      {showGrid &&
        ticks.map((t) => (
          <line
            key={t}
            x1={xOf(t)}
            x2={xOf(t)}
            y1={TOP - 4}
            y2={plotBottom}
            stroke="currentColor"
            strokeOpacity={0.12}
            strokeDasharray="2 4"
          />
        ))}
      {traces.map((tr, i) => {
        const y0 = TOP + i * ROW_H
        const hi = y0 + 6
        const lo = y0 + ROW_H - 8
        let d = ''
        const fills: JSX.Element[] = []
        let start = -1
        tr.values.forEach((v, k) => {
          const x = xOf(k * stepMs)
          const y = v ? hi : lo
          d += k === 0 ? `M${x} ${y}` : ` H${x} V${y}`
          if (v && start < 0) start = k
          if (!v && start >= 0) {
            fills.push(<rect key={k} x={xOf(start * stepMs)} y={hi} width={xOf(k * stepMs) - xOf(start * stepMs)} height={lo - hi} />)
            start = -1
          }
        })
        if (tr.values.length) d += ` H${xOf(tr.values.length * stepMs)}`
        if (start >= 0)
          fills.push(
            <rect key="end" x={xOf(start * stepMs)} y={hi} width={xOf(tr.values.length * stepMs) - xOf(start * stepMs)} height={lo - hi} />,
          )
        return (
          <g key={tr.label + i}>
            <line x1={LABEL_W} x2={width - 12} y1={lo} y2={lo} stroke="currentColor" strokeOpacity={0.15} />
            <text
              x={LABEL_W - 10}
              y={(hi + lo) / 2 + 4}
              textAnchor="end"
              fill="currentColor"
              style={{
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {tr.label}
            </text>
            <g fill="#38bdf8" fillOpacity={0.16}>
              {fills}
            </g>
            <path d={d} fill="none" stroke="#38bdf8" strokeWidth={2} strokeLinejoin="round" />
          </g>
        )
      })}
      <line x1={LABEL_W} x2={width - 12} y1={plotBottom + 2} y2={plotBottom + 2} stroke="currentColor" strokeOpacity={0.5} />
      {ticks.map((t) => (
        <g key={t}>
          <line x1={xOf(t)} x2={xOf(t)} y1={plotBottom + 2} y2={plotBottom + 6} stroke="currentColor" strokeOpacity={0.5} />
          <text
            x={xOf(t)}
            y={plotBottom + 18}
            textAnchor="middle"
            fill="currentColor"
            fillOpacity={0.7}
            style={{ fontSize: 11, fontFamily: 'system-ui, sans-serif' }}
          >
            {fmtS(t)}
          </text>
        </g>
      ))}
      {marks?.map((m, i) => (
        <g key={i}>
          <line x1={xOf(m.atMs)} x2={xOf(m.atMs)} y1={TOP - 6} y2={plotBottom} stroke="#ffb020" strokeDasharray="4 3" />
          <text
            x={xOf(m.atMs)}
            y={TOP - 8}
            textAnchor="middle"
            fill="#ffb020"
            style={{ fontSize: 11, fontFamily: 'system-ui, sans-serif' }}
          >
            {m.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
