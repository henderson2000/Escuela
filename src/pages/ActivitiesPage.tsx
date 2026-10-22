import { Link } from 'react-router-dom'
import { useSubject } from '../lib/subject'
import { useSub } from '../lib/nav'
import { useStore } from '../lib/scores'
import type { Activity } from '../catalog/types'

export function ActivitiesPage() {
  const s = useStore()
  const { topics: TOPICS, catalog: CATALOG } = useSubject()
  const sub = useSub()
  const p = s.me
  const done = p ? s.activities[p.id] ?? {} : {}
  const progress = (acts: Activity[]) => acts.filter((a) => done[a.id]).length

  const groups = [
    ...TOPICS.map((t) => ({ key: t.id, to: `/teoria/${t.id}`, icon: t.icon, title: t.title, acts: t.activities })),
    ...CATALOG.map((c) => ({ key: c.id, to: `/componentes/${c.id}`, icon: c.icon, title: c.name, acts: c.activities })),
  ]
  const total = groups.reduce((a, g) => a + g.acts.length, 0)
  const solved = groups.reduce((a, g) => a + progress(g.acts), 0)

  return (
    <div className="page">
      <h1>Actividades</h1>
      <p className="lead">
        Cada tema y cada componente tiene ejercicios con corrección automática. Tu progreso queda guardado.
      </p>
      <div className="card progress-card">
        <strong>Tu progreso (guardado en esta computadora)</strong>
        <div className="progress big">
          <div style={{ width: `${(solved / total) * 100}%` }} />
        </div>
        <span>
          {solved} de {total} actividades resueltas
        </span>
      </div>
      <div className="grid cards">
        {groups.map((g) => {
          const n = progress(g.acts)
          return (
            <Link key={g.key} to={sub(g.to)} className={`comp-card ${n === g.acts.length ? 'complete' : ''}`}>
              <span className="comp-icon">{g.icon}</span>
              <strong>{g.title}</strong>
              <div className="progress">
                <div style={{ width: `${(n / g.acts.length) * 100}%` }} />
              </div>
              <span>
                {n} / {g.acts.length} {n === g.acts.length ? '✔' : ''}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
