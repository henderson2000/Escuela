import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSub } from '../../lib/nav'
import { BULBS, isDone, markActivity, useStore } from '../../lib/scores'
import { BulbPurchase } from '../../components/Bulbs'
import { LogoEditor } from '../Editor'
import { DEVICE_NAMES, OUTPUT_NAMES, runTests, type Program, type TestResult } from '../engine'
import { EXERCISES, startProgram, type Exercise } from '../exercises'
import { exerciseActivityId } from './GuidePage'
import { NotFound } from '../../components/ui'

export function ExercisePage() {
  const { id = '' } = useParams()
  return <ExerciseView key={id} id={id} />
}

function ExerciseView({ id }: { id: string }) {
  const sub = useSub()
  const s = useStore()
  const idx = EXERCISES.findIndex((e) => e.id === id)
  const ex = EXERCISES[idx]
  const prog = useRef<Program | null>(null)
  const [result, setResult] = useState<TestResult | null>(null)
  const [tableOk, setTableOk] = useState(false)
  const initial = useMemo(() => (ex ? startProgram(ex.io) : null), [ex])
  const solved = !!ex && isDone(s, exerciseActivityId(ex.id))

  if (!ex || !initial) {
    return <NotFound what="ese ejercicio" back={sub('/guia')} backLabel="Ir a la guía de ejercicios" />
  }
  const prev = EXERCISES[idx - 1]
  const next = EXERCISES[idx + 1]

  const check = () => {
    if (!prog.current || !ex.tests) return
    const r = runTests(prog.current, ex.tests)
    setResult(r)
    if (r.ok && (!ex.table || tableOk)) markActivity(exerciseActivityId(ex.id), true, BULBS.ejercicioLogo, `Ejercicio ${ex.n} de la guía`)
  }

  const onTable = (ok: boolean) => {
    setTableOk(ok)
    if (ok && result?.ok) markActivity(exerciseActivityId(ex.id), true, BULBS.ejercicioLogo, `Ejercicio ${ex.n} de la guía`)
  }

  return (
    <div className="page wide">
      <Link to={sub('/guia')} className="back">
        ← Guía de ejercicios
      </Link>
      <h1>
        <span className="ex-n big">{ex.n}</span> {ex.title} {solved && <span className="tag ok">✔ resuelto</span>}
      </h1>

      <div className="ex-head">
        <section className="card ex-statement">
          {ex.text.split('\n').map((l, i) => (
            <p key={i}>{l}</p>
          ))}
          {ex.hint && (
            <BulbPurchase itemKey={`hint:logo-${ex.id}`} cost={BULBS.pista} label="Ver una pista" what={`Pista: ejercicio ${ex.n}`}>
              {ex.hint}
            </BulbPurchase>
          )}
        </section>
        <IOTable ex={ex} />
      </div>

      {ex.diagram && <PulseDiagram ex={ex} />}

      <LogoEditor
        initial={initial}
        storageKey={`logo-guia-${ex.id}`}
        lockIO
        minHeight={Math.max(360, 60 + Math.max(Object.keys(ex.io.I).length, Object.keys(ex.io.Q).length) * 70)}
        onChange={(p) => {
          prog.current = p
        }}
        actions={
          ex.tests ? (
            <button type="button" className="btn small primary" onClick={check}>
              ✔ Comprobar
            </button>
          ) : null
        }
      />

      {result && (
        <div className={`card check-result ${result.ok ? 'ok' : 'bad'}`}>
          <strong>{result.ok ? '✔ ' : '✘ '}</strong>
          {result.message}
          {result.ok && ex.table && !tableOk && <p>Ahora completá la tabla de la verdad de abajo para terminar el ejercicio.</p>}
          {!result.ok && <p className="hint">Probá tu programa en la simulación, corregilo y volvé a comprobar.</p>}
        </div>
      )}
      {!ex.tests && (
        <div className="card check-result">
          Este ejercicio no tiene corrección automática: probalo en el simulador y mostráselo al profe.{' '}
          {!solved && (
            <button type="button" className="btn small" onClick={() => markActivity(exerciseActivityId(ex.id), true, BULBS.ejercicioMarcado, `Ejercicio ${ex.n} terminado`)}>
              Marcar como terminado
            </button>
          )}
        </div>
      )}

      {ex.table && <TruthTableFill ex={ex} onResult={onTable} />}

      <div className="row space wrap ex-nav">
        {prev ? (
          <Link to={sub(`/guia/${prev.id}`)} className="btn">
            ← Ejercicio {prev.n}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={sub(`/guia/${next.id}`)} className="btn primary">
            Ejercicio {next.n} →
          </Link>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ tabla de entradas y salidas */

function IOTable({ ex }: { ex: Exercise }) {
  const ins = Object.entries(ex.io.I)
  const outs = Object.entries(ex.io.Q)
  return (
    <section className="card io-table">
      <table>
        <thead>
          <tr>
            <th colSpan={2}>Entradas</th>
          </tr>
        </thead>
        <tbody>
          {ins.map(([n, c]) => (
            <tr key={n}>
              <td className="io-n">I{n}</td>
              <td>
                {c.label && c.label !== `I${n}` ? `${c.label} · ` : ''}
                <span className="muted">{DEVICE_NAMES[c.dev]}</span>
              </td>
            </tr>
          ))}
        </tbody>
        <thead>
          <tr>
            <th colSpan={2}>Salidas</th>
          </tr>
        </thead>
        <tbody>
          {outs.map(([n, c]) => (
            <tr key={n}>
              <td className="io-n">Q{n}</td>
              <td>
                {c.label && c.label !== `Q${n}` ? `${c.label} · ` : ''}
                <span className="muted">{OUTPUT_NAMES[c.kind]}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

/* ------------------------------------------------------------------ diagrama de la guía */

function PulseDiagram({ ex }: { ex: Exercise }) {
  const rows = ex.diagram!
  const len = ex.diagramLen ?? 16
  const W = 560
  const left = 46
  const rowH = 34
  const unit = (W - left - 10) / len
  return (
    <section className="card pulse-diagram">
      <h4>Diagrama de la guía</h4>
      <svg viewBox={`0 0 ${W} ${rows.length * rowH + 8}`} role="img" aria-label="Diagrama de tiempos">
        {rows.map((r, i) => {
          const base = i * rowH + rowH - 6
          const top = base - rowH + 14
          let d = `M${left} ${base}`
          for (const [a, b] of r.pulses) d += ` H${left + a * unit} V${top} H${left + b * unit} V${base}`
          d += ` H${W - 6}`
          return (
            <g key={r.label}>
              <text x={left - 8} y={base - 4} className="pd-label">
                {r.label}
              </text>
              <line x1={left} x2={W - 6} y1={base} y2={base} className="pd-axis" />
              {r.pulses.map(([a, b], k) => (
                <rect key={k} x={left + a * unit} y={top} width={(b - a) * unit} height={base - top} className="pd-fill" />
              ))}
              <path d={d} className="pd-line" />
            </g>
          )
        })}
      </svg>
    </section>
  )
}

/* ------------------------------------------------------------------ tabla de la verdad para completar */

function TruthTableFill({ ex, onResult }: { ex: Exercise; onResult: (ok: boolean) => void }) {
  const t = ex.table!
  const rows = useMemo(
    () =>
      Array.from({ length: 1 << t.inputs.length }, (_, combo) => {
        const v: Record<number, number> = {}
        t.inputs.forEach((n, i) => (v[n] = (combo >> (t.inputs.length - 1 - i)) & 1))
        return v
      }),
    [t],
  )
  const [ans, setAns] = useState<(number | null)[]>(() => rows.map(() => null))
  const [checked, setChecked] = useState<null | boolean[]>(null)
  const complete = ans.every((a) => a !== null)

  const check = () => {
    const res = rows.map((v, i) => ans[i] === t.f(v))
    setChecked(res)
    onResult(res.every(Boolean))
  }

  return (
    <section className="card truth-fill">
      <h3>Tabla de la verdad</h3>
      <p className="hint">Tocá cada casillero de Q{t.output} para elegir 0 o 1.</p>
      <table className="tt">
        <thead>
          <tr>
            {t.inputs.map((n) => (
              <th key={n}>I{n}</th>
            ))}
            <th className="out">Q{t.output}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v, i) => (
            <tr key={i} className={checked ? (checked[i] ? 'ok' : 'bad') : ''}>
              {t.inputs.map((n) => (
                <td key={n}>{v[n]}</td>
              ))}
              <td className="out">
                <button
                  type="button"
                  className={`bit ${ans[i] === null ? 'empty' : ''}`}
                  onClick={() => {
                    setAns(ans.map((a, k) => (k === i ? (a === 1 ? 0 : 1) : a)))
                    setChecked(null)
                  }}
                >
                  {ans[i] ?? '?'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="row">
        <button type="button" className="btn primary small" disabled={!complete} onClick={check}>
          Comprobar la tabla
        </button>
        {checked && (checked.every(Boolean) ? <span className="feedback ok">✔ ¡Tabla correcta!</span> : <span className="feedback bad">✘ Hay {checked.filter((x) => !x).length} fila(s) mal (en rojo).</span>)}
      </div>
    </section>
  )
}
