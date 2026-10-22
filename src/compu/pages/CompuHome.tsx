import { Link } from 'react-router-dom'
import { useSub } from '../../lib/nav'
import { useStore } from '../../lib/scores'
import { TRACKS, lessonActivityId, lessonsOf } from '../course'

export function CompuHome() {
  const sub = useSub()
  const s = useStore()
  const done = s.me ? s.activities[s.me.id] ?? {} : {}
  return (
    <div className="page home">
      <section className="hero compu-hero">
        <div className="hero-text">
          <h1>
            Programá en <span className="accent">HTML y JavaScript</span>
          </h1>
          <p className="lead">
            Lecciones cortas con un editor de verdad: escribís código, lo ves funcionar al instante y el sistema te dice qué
            requisitos cumpliste. Todo en castellano, con tu progreso guardado y desafíos que suman puntos para el ranking.
          </p>
          <div className="row">
            <Link to={sub('/curso/html')} className="btn primary big">
              Empezar el curso
            </Link>
            <Link to={sub('/taller-libre')} className="btn big">
              Taller libre
            </Link>
          </div>
        </div>
        <div className="hero-3d compu-hero-art" aria-hidden>
          <pre>
            <span className="t">{'<button'}</span> <span className="p">id</span>=<span className="v">"boton"</span>
            <span className="t">{'>'}</span>Tocame<span className="t">{'</button>'}</span>
            {'\n\n'}
            <span className="k">const</span> boton = document.getElementById(<span className="v">"boton"</span>);
            {'\n'}boton.addEventListener(<span className="v">"click"</span>, () {'=> {'}
            {'\n  '}console.log(<span className="v">"¡Hola, Villada!"</span>);
            {'\n});'}
          </pre>
        </div>
      </section>
      <h2 className="section-title">Recorridos</h2>
      <div className="grid cards track-cards">
        {TRACKS.map((t) => {
          const all = lessonsOf(t)
          const n = all.filter((l) => done[lessonActivityId(l.id)]).length
          return (
            <Link key={t.id} to={sub(`/curso/${t.id}`)} className={`comp-card ${n === all.length && n > 0 ? 'complete' : ''}`}>
              <span className="comp-icon">{t.icon}</span>
              <strong>{t.title}</strong>
              <span>{t.desc}</span>
              <div className="progress">
                <div style={{ width: `${all.length ? (n / all.length) * 100 : 0}%` }} />
              </div>
              <span>
                {n} / {all.length} lecciones
              </span>
            </Link>
          )
        })}
      </div>
      <div className="grid cards">
        <Link to={sub('/taller-libre')} className="comp-card">
          <span className="comp-icon">🛠</span>
          <strong>Taller libre</strong>
          <span>Armá tu propia página con HTML y JavaScript, o probá programas en la consola. Se guarda en esta computadora.</span>
        </Link>
        <Link to={sub('/juegos')} className="comp-card">
          <span className="comp-icon">🎮</span>
          <strong>Desafíos y juegos</strong>
          <span>Problemas para resolver con código y juegos de preguntas. ¡Suman puntos!</span>
        </Link>
        <Link to={sub('/ranking')} className="comp-card">
          <span className="comp-icon">🏆</span>
          <strong>Ranking</strong>
          <span>Los puntos de los desafíos se acumulan durante todo el año.</span>
        </Link>
      </div>
    </div>
  )
}
