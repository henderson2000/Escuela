import { Link } from 'react-router-dom'
import { useSub } from '../../lib/nav'
import { useStore } from '../../lib/scores'
import { EXERCISES } from '../exercises'

export const exerciseActivityId = (id: string) => `logo-${id}`

const GROUPS = [
  { title: 'Primeros pasos y compuertas', ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 15] },
  { title: 'Memoria: enclavamiento, set-reset y relé de impulsos', ids: [12, 13, 14, 21, 23] },
  { title: 'Temporizadores y secuencias', ids: [16, 17, 18, 19, 20, 24, 32] },
  { title: 'Mando de motores', ids: [22, 25, 26, 27, 28, 29, 30, 31] },
]

export function GuidePage() {
  const sub = useSub()
  const s = useStore()
  const done = s.done
  const solved = EXERCISES.filter((e) => done[exerciseActivityId(e.id)]).length
  return (
    <div className="page">
      <h1>📝 Guía de ejercitación</h1>
      <p className="lead">
        Los ejercicios de la guía del taller. Cada uno se programa en el simulador con las entradas y salidas ya conectadas, y la
        mayoría tiene corrección automática: el programa se prueba solo apretando los pulsadores por vos.
      </p>
      <div className="card progress-card">
        <strong>Tu progreso (guardado en esta computadora)</strong>
        <div className="progress big">
          <div style={{ width: `${(solved / EXERCISES.length) * 100}%` }} />
        </div>
        <span>
          {solved} de {EXERCISES.length} ejercicios resueltos
        </span>
      </div>
      {GROUPS.map((g) => (
        <section key={g.title}>
          <h2 className="section-title">{g.title}</h2>
          <div className="grid cards">
            {g.ids
              .map((n) => EXERCISES.find((e) => e.n === n)!)
              .filter(Boolean)
              .map((e) => {
                const ok = !!done[exerciseActivityId(e.id)]
                return (
                  <Link key={e.id} to={sub(`/guia/${e.id}`)} className={`comp-card ex-card ${ok ? 'complete' : ''}`}>
                    <span className="ex-n">{e.n}</span>
                    <strong>{e.title}</strong>
                    <span>{e.text.split('\n')[0]}</span>
                    <span className="ex-tags">
                      {e.tests ? <em className="tag auto">corrección automática</em> : <em className="tag">lo corrige el profe</em>}
                      {e.table && <em className="tag">tabla de la verdad</em>}
                      {ok && <em className="tag ok">✔ resuelto</em>}
                    </span>
                  </Link>
                )
              })}
          </div>
        </section>
      ))}
    </div>
  )
}
