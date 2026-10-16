import { Link } from 'react-router-dom'
import { Viewer } from '../three/Viewer'
import { ArduinoModel } from '../three/models/Arduino'

const SECTIONS = [
  { to: '/componentes', icon: '🧊', title: 'Componentes 3D', text: 'Resistencias, LEDs, capacitores, protoboard, Arduino y sensores. Giralos, modificalos y despiezalos.' },
  { to: '/teoria', icon: '📘', title: 'Teoría', text: 'Ley de Ohm, serie y paralelo, divisor de tensión, PWM… con calculadoras interactivas.' },
  { to: '/actividades', icon: '📝', title: 'Actividades', text: 'Ejercicios con corrección automática para cada tema y componente.' },
  { to: '/juegos', icon: '🎮', title: 'Juegos', text: 'Sumá puntos con desafíos de colores, planos y conexiones en la protoboard 3D.' },
  { to: '/ranking', icon: '🏆', title: 'Ranking', text: 'Los puntos se acumulan durante todo el año. ¡El que más suma se lleva el premio!' },
]

export function Home() {
  return (
    <div className="page home">
      <section className="hero">
        <div className="hero-text">
          <h1>
            Aprendé electrónica <span className="accent">tocando los componentes</span>
          </h1>
          <p className="lead">
            Mirá cada componente por dentro, cambiale el valor y descubrí cómo funciona. Después poné a prueba lo que
            sabés con actividades y juegos que suman puntos para el ranking del curso.
          </p>
          <div className="row">
            <Link to="/componentes" className="btn primary big">
              Explorar componentes
            </Link>
            <Link to="/juegos" className="btn big">
              Jugar
            </Link>
          </div>
        </div>
        <div className="hero-3d">
          <Viewer camera={[0, 7.5, 9]} autoRotate shadowY={-1.6} className="viewer hero-viewer">
            <ArduinoModel powered blink />
          </Viewer>
        </div>
      </section>
      <div className="grid cards">
        {SECTIONS.map((s) => (
          <Link key={s.to} to={s.to} className="comp-card">
            <span className="comp-icon">{s.icon}</span>
            <strong>{s.title}</strong>
            <span>{s.text}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
