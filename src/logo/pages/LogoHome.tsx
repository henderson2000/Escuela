import { Link } from 'react-router-dom'
import { Viewer } from '../../three/Viewer'
import { useSub } from '../../lib/nav'
import { useSubject } from '../../lib/subject'

const SECTIONS = [
  { to: '/componentes', icon: '🧊', title: 'LOGO! en 3D', text: 'El LOGO! 8 por dentro y por fuera, el contactor, los pulsadores y el hongo. Despiezalos y probalos.' },
  { to: '/teoria', icon: '📘', title: 'Teoría', text: 'Automatización, lógica cableada y programada, compuertas, temporizadores, set-reset y contadores.' },
  { to: '/simulador', icon: '🧩', title: 'Simulador', text: 'Programá en bloques (FUP) como en LOGO!Soft Comfort y probalo en vivo con pulsadores y lámparas.' },
  { to: '/guia', icon: '📝', title: 'Guía de ejercicios', text: 'Los 32 ejercicios de la guía, con corrección automática de tu programa.' },
  { to: '/juegos', icon: '🎮', title: 'Juegos', text: 'Programá situaciones reales, reconocé compuertas y leé diagramas de tiempo. ¡Suman puntos!' },
  { to: '/ranking', icon: '🏆', title: 'Ranking', text: 'Los puntos se acumulan durante todo el año.' },
]

export function LogoHome() {
  const sub = useSub()
  const logo = useSubject().catalog.find((c) => c.id === 'logo')
  return (
    <div className="page home">
      <section className="hero">
        <div className="hero-text">
          <h1>
            Automatización con <span className="accent">LOGO!</span>
          </h1>
          <p className="lead">
            Aprendé a reemplazar tableros de relés por un programa: conectá pulsadores y sensores a las entradas, armá la lógica con
            bloques y mirá cómo responden las salidas. Después resolvé la guía y sumá puntos en los juegos.
          </p>
          <div className="row">
            <Link to={sub('/simulador')} className="btn primary big">
              Abrir el simulador
            </Link>
            <Link to={sub('/guia')} className="btn big">
              Guía de ejercicios
            </Link>
          </div>
        </div>
        {logo && (
          <div className="hero-3d">
            <Viewer camera={logo.camera} target={logo.target} autoRotate shadowY={logo.shadowY} className="viewer hero-viewer">
              {logo.render(logo.defaultParams)}
            </Viewer>
          </div>
        )}
      </section>
      <div className="grid cards">
        {SECTIONS.map((s) => (
          <Link key={s.to} to={sub(s.to)} className="comp-card">
            <span className="comp-icon">{s.icon}</span>
            <strong>{s.title}</strong>
            <span>{s.text}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
