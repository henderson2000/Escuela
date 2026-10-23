import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useSub } from '../../../lib/nav'
import { useStore } from '../../../lib/scores'
import { prefetchWhenIdle } from '../../../lib/lazy'
import { LEVELS, levelActivityId, parseMap } from './world'
import { WorldView } from './World'
import './bloques.css'

/** Lista de niveles de programación con bloques. */
export function BlocksHome() {
  const sub = useSub()
  const s = useStore()
  // mientras se elige el nivel, se descarga de fondo el editor de bloques
  useEffect(() => prefetchWhenIdle(() => import('./LevelPage')), [])
  const solved = LEVELS.filter((l) => s.done[levelActivityId(l.id)] === true).length
  const next = LEVELS.find((l) => s.done[levelActivityId(l.id)] !== true) ?? LEVELS[0]
  return (
    <div className="page">
      <h1>🧩 Programación con bloques</h1>
      <p className="lead">
        Programá al robot del taller encastrando bloques, como en Scratch o Pilas Bloques. Cada nivel suma una idea nueva del pensamiento
        computacional: secuencia, repetición, condicionales, variables y procedimientos.
      </p>
      <div className="card progress-card">
        <strong>Tu progreso (guardado en esta computadora)</strong>
        <div className="progress big">
          <div style={{ width: `${(solved / LEVELS.length) * 100}%` }} />
        </div>
        <span>
          {solved} de {LEVELS.length} niveles resueltos ·{' '}
          <Link to={sub(`/bloques/${next.id}`)}>{solved === LEVELS.length ? 'repasar' : `seguir con el nivel ${next.n}`} →</Link>
        </span>
      </div>
      <div className="grid cards bl-levels">
        {LEVELS.map((l) => {
          const ok = s.done[levelActivityId(l.id)] === true
          return (
            <Link key={l.id} to={sub(`/bloques/${l.id}`)} className={`comp-card ${ok ? 'complete' : ''}`}>
              <div className="bl-thumb">
                <WorldView state={parseMap(l.maps[0])} />
              </div>
              <span className="row">
                <span className="ex-n">{l.n}</span> <strong>{l.title}</strong>
              </span>
              <span>{l.concept}</span>
              {ok && <em className="tag ok">✔ resuelto</em>}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
