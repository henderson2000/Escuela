import { useState } from 'react'
import type { Activity } from '../catalog/types'
import { currentPlayer, markActivity, useStore } from '../lib/scores'

function check(a: Activity, value: string | number): boolean {
  if (a.type === 'mc') return value === a.answer
  const n = parseFloat(String(value).replace(',', '.'))
  if (!Number.isFinite(n)) return false
  const tol = a.tolerance ?? 0.02
  if (a.answer === 0) return Math.abs(n) < 1e-9
  return Math.abs(n - a.answer) <= Math.abs(a.answer) * tol + 1e-9
}

function ActivityItem({ a, n, solved }: { a: Activity; n: number; solved: boolean }) {
  const [value, setValue] = useState<string | number>('')
  const [result, setResult] = useState<null | boolean>(solved ? true : null)

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
          {a.options.map((o, i) => (
            <button
              key={i}
              type="button"
              className={`option ${value === i ? 'chosen' : ''} ${result !== null && i === a.answer && result ? 'right' : ''}`}
              onClick={() => {
                setValue(i)
                setResult(null)
              }}
            >
              {o}
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
  const p = currentPlayer(s)
  const done = p ? s.activities[p.id] ?? {} : {}
  const count = activities.filter((a) => done[a.id]).length
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
      {!p && <p className="hint">Ingresá tu nombre arriba a la derecha para que se guarde tu progreso.</p>}
      <ol className="activities">
        {activities.map((a, i) => (
          <ActivityItem key={a.id + (p?.id ?? '')} a={a} n={i + 1} solved={!!done[a.id]} />
        ))}
      </ol>
    </div>
  )
}
