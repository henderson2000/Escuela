import { useMemo, useState } from 'react'
import type { Activity } from '../catalog/types'
import { markActivity, useStore } from '../lib/scores'

function check(a: Activity, value: string | number): boolean {
  if (a.type === 'mc') return value === a.answer
  const n = parseFloat(String(value).replace(',', '.'))
  if (!Number.isFinite(n)) return false
  const tol = a.tolerance ?? 0.02
  if (a.answer === 0) return Math.abs(n) < 1e-9
  return Math.abs(n - a.answer) <= Math.abs(a.answer) * tol + 1e-9
}

/** Orden de las opciones mezclado, siempre igual para la misma pregunta (no cambia al recargar). */
function shuffledOrder(id: string, n: number): number[] {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619)
  const rand = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
  const order = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

function ActivityItem({ a, n, solved }: { a: Activity; n: number; solved: boolean }) {
  const [value, setValue] = useState<string | number>('')
  const [result, setResult] = useState<null | boolean>(solved ? true : null)
  const order = useMemo(() => (a.type === 'mc' ? shuffledOrder(a.id, a.options.length) : []), [a])

  const submit = () => {
    if (value === '') return
    const ok = check(a, value)
    setResult(ok)
    markActivity(a.id, ok)
  }

  return (
    <li className={`activity ${result === true ? 'ok' : result === false ? 'bad' : ''}`}>
      <div className="activity-q">
        <span className="activity-n">{n}</span>
        <p>{a.q}</p>
      </div>
      {a.type === 'mc' ? (
        <div className="options">
          {order.map((i) => (
            <button
              key={i}
              type="button"
              className={`option ${value === i ? 'chosen' : ''} ${result !== null && i === a.answer && result ? 'right' : ''}`}
              onClick={() => {
                setValue(i)
                setResult(null)
              }}
            >
              {a.options[i]}
            </button>
          ))}
        </div>
      ) : (
        <div className="row">
          <input
            className="input num"
            inputMode="decimal"
            value={value}
            placeholder="Tu respuesta"
            onChange={(e) => {
              setValue(e.target.value)
              setResult(null)
            }}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          <span className="unit">{a.unit}</span>
        </div>
      )}
      <div className="row">
        <button type="button" className="btn small primary" onClick={submit} disabled={value === ''}>
          Comprobar
        </button>
        {result === true && <span className="feedback ok">✔ ¡Correcto! {a.explain}</span>}
        {result === false && <span className="feedback bad">✘ No es correcto. Revisá y probá de nuevo.</span>}
      </div>
    </li>
  )
}

export function ActivityList({ activities }: { activities: Activity[] }) {
  const s = useStore()
  const done = s.done
  const count = activities.filter((a) => done[a.id] === true).length
  return (
    <div>
      <div className="progress-line">
        <div className="progress">
          <div style={{ width: `${(count / activities.length) * 100}%` }} />
        </div>
        <span>
          {count} / {activities.length} resueltas
        </span>
      </div>
      <ol className="activities">
        {activities.map((a, i) => (
          <ActivityItem key={a.id} a={a} n={i + 1} solved={done[a.id] === true} />
        ))}
      </ol>
    </div>
  )
}
