import { Link } from 'react-router-dom'
import { useSub } from '../../lib/nav'
import { isDone, useStore } from '../../lib/scores'
import { MISSIONS, missionActivityId } from './missions'
import './bench.css'

/** Lista de misiones guiadas de la mesa de trabajo. */
export function MissionsPage() {
  const sub = useSub()
  const s = useStore()
  const done = MISSIONS.filter((m) => isDone(s, missionActivityId(m.id))).length
  return (
    <div className="page missions-page">
      <Link to={sub('/laboratorio/mesa')} className="back">
        ← Mesa de trabajo libre
      </Link>
      <h1>🎯 Misiones guiadas</h1>
      <p className="lead">
        Proyectos paso a paso en la mesa de trabajo: <b>Armar</b> (colocar los componentes) → <b>Cablear</b> → <b>Programar</b> en C de Arduino →{' '}
        <b>Probar</b>. Cada paso se comprueba solo y cada misión cumplida suma 💡.
      </p>
      <p className="hint">
        Cumplidas: {done} de {MISSIONS.length}
      </p>
      <div className="missions-grid">
        {MISSIONS.map((m, i) => {
          const ok = isDone(s, missionActivityId(m.id))
          return (
            <Link key={m.id} to={sub(`/laboratorio/misiones/${m.id}`)} className={`mission-card ${ok ? 'done' : ''}`}>
              <header>
                <span className="mission-icon">{m.icon}</span>
                <div>
                  <small>
                    {i + 1}. {m.level}
                    {ok && <b className="mission-badge"> ✔ Cumplida</b>}
                  </small>
                  <h3 style={{ margin: 0 }}>{m.title}</h3>
                </div>
              </header>
              <p>{m.goal}</p>
              <span className="steps">Armar → Cablear → Programar → Probar</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
