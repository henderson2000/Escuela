import { useState } from 'react'
import { ActivityList } from '../../components/ActivityList'
import { useStore } from '../../lib/scores'
import { TORNO_GUIDE } from '../guide'
import './torno-pages.css'

export function TornoGuidePage() {
  const s = useStore()
  const done = s.done
  const [open, setOpen] = useState<string | undefined>(TORNO_GUIDE[0]?.id)
  const total = TORNO_GUIDE.reduce((a, g) => a + g.activities.length, 0)
  const solved = TORNO_GUIDE.reduce((a, g) => a + g.activities.filter((x) => done[x.id]).length, 0)
  return (
    <div className="page narrow">
      <h1>📝 Guía de ejercicios</h1>
      <p className="lead">Cálculos y casos prácticos de torneado. Se corrigen solos y tu progreso queda guardado.</p>
      <div className="card progress-card">
        <strong>Tu progreso (guardado en esta computadora)</strong>
        <div className="progress big">
          <div style={{ width: `${total ? (solved / total) * 100 : 0}%` }} />
        </div>
        <span>
          {solved} de {total} ejercicios resueltos
        </span>
      </div>
      {TORNO_GUIDE.map((g) => {
        const n = g.activities.filter((x) => done[x.id]).length
        return (
          <section key={g.id} className="card guide-section">
            <button type="button" className="guide-head" onClick={() => setOpen(open === g.id ? undefined : g.id)} aria-expanded={open === g.id}>
              <strong>{g.title}</strong>
              <span className="hint">
                {n} / {g.activities.length} {n === g.activities.length ? '✔' : ''} {open === g.id ? '▲' : '▼'}
              </span>
            </button>
            {open === g.id && (
              <>
                <p className="hint">{g.intro}</p>
                <ActivityList activities={g.activities} />
              </>
            )}
          </section>
        )
      })}
    </div>
  )
}
