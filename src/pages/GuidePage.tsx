import { useState } from 'react'
import { ActivityList } from '../components/ActivityList'
import { useStore } from '../lib/scores'
import { useSubject } from '../lib/subject'
import './guide.css'

/** Guía de ejercicios de un taller: secciones desplegables con actividades que se corrigen solas. */
export function GuidePage() {
  const s = useStore()
  const { guide = [], labels } = useSubject()
  const [open, setOpen] = useState<string | undefined>(guide[0]?.id)
  const total = guide.reduce((a, g) => a + g.activities.length, 0)
  const solved = guide.reduce((a, g) => a + g.activities.filter((x) => s.done[x.id] === true).length, 0)
  return (
    <div className="page narrow">
      <h1>📝 Guía de ejercicios</h1>
      <p className="lead">{labels?.guideLead ?? 'Ejercicios y casos prácticos que se corrigen solos. Tu progreso queda guardado.'}</p>
      <div className="card progress-card">
        <strong>Tu progreso (guardado en esta computadora)</strong>
        <div className="progress big">
          <div style={{ width: `${total ? (solved / total) * 100 : 0}%` }} />
        </div>
        <span>
          {solved} de {total} ejercicios resueltos
        </span>
      </div>
      {guide.map((g) => {
        const n = g.activities.filter((x) => s.done[x.id] === true).length
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
                {g.intro && <p className="hint">{g.intro}</p>}
                <ActivityList activities={g.activities} />
              </>
            )}
          </section>
        )
      })}
    </div>
  )
}
