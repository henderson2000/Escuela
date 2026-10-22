import { Link, Navigate, useParams } from 'react-router-dom'
import { useSub } from '../../lib/nav'
import { useStore } from '../../lib/scores'
import { getTrack, lessonActivityId, lessonsOf } from '../course'

export function TrackPage() {
  const { track: tid } = useParams()
  const sub = useSub()
  const s = useStore()
  const track = getTrack(tid)
  if (!track) return <Navigate to={sub('')} replace />
  const done = s.done
  const all = lessonsOf(track)
  const solved = all.filter((l) => done[lessonActivityId(l.id)]).length
  const next = all.find((l) => !done[lessonActivityId(l.id)]) ?? all[0]
  let k = 0
  return (
    <div className="page">
      <Link to={sub('')} className="back">
        ← Computación
      </Link>
      <h1>
        <span className="icon">{track.icon}</span> {track.title}
      </h1>
      <p className="lead">{track.desc}</p>
      <div className="card progress-card">
        <strong>Tu progreso (guardado en esta computadora)</strong>
        <div className="progress big">
          <div style={{ width: `${all.length ? (solved / all.length) * 100 : 0}%` }} />
        </div>
        <span>
          {solved} de {all.length} lecciones
        </span>
        {next && (
          <Link to={sub(`/curso/${track.id}/${next.id}`)} className="btn primary">
            {solved ? 'Seguir donde dejé →' : 'Empezar →'}
          </Link>
        )}
      </div>
      {track.modules.map((m) => (
        <section key={m.id} className="module-block">
          <h2>{m.title}</h2>
          <p className="hint">{m.desc}</p>
          <div className="lesson-links">
            {m.lessons.map((l) => {
              k++
              const ok = !!done[lessonActivityId(l.id)]
              return (
                <Link key={l.id} to={sub(`/curso/${track.id}/${l.id}`)} className={`lesson-link ${ok ? 'done' : ''}`}>
                  <span className="ln">{ok ? '✔' : k}</span>
                  <span>{l.title}</span>
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
