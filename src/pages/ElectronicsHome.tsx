import { lazyModel } from '../three/lazy3d'
import { Link } from 'react-router-dom'
import { Viewer } from '../three/lazy3d'

import { useSub } from '../lib/nav'

const ArduinoModel = lazyModel(() => import('../three/models/Arduino'), 'ArduinoModel')

const SECTIONS = [
  { to: '/laboratorio/mesa', icon: '🛠', title: 'Mesa de trabajo', text: 'Armá circuitos con el Arduino en la protoboard, programalo en C como en el IDE y simulalo: LEDs, pulsadores, potenciómetros y monitor serie.' },
  { to: '/laboratorio/misiones', icon: '🎯', title: 'Misiones guiadas', text: 'Proyectos paso a paso que se corrigen solos: Blink, semáforo, pulsador, dimmer y contador. Armar → cablear → programar → probar.' },
  { to: '/laboratorio', icon: '🔬', title: 'Laboratorio 3D', text: 'Resistencias, LEDs, Arduino UNO y Nano, sensores y actuadores sobre la mesa: tocá cada parte, mirá los pines, despiezalos y usalos.' },
  { to: '/teoria', icon: '📘', title: 'Teoría', text: 'Ley de Ohm, serie y paralelo, divisor de tensión, PWM… con calculadoras interactivas.' },
  { to: '/actividades', icon: '📝', title: 'Actividades', text: 'Ejercicios con corrección automática para cada tema y componente.' },
  { to: '/juegos', icon: '🎮', title: 'Juegos', text: 'Sumá puntos con desafíos de colores, planos y conexiones en la protoboard 3D.' },
]

export function ElectronicsHome() {
  const sub = useSub()
  return (
    <div className="page home">
      <section className="hero">
        <div className="hero-text">
          <h1>
            Aprendé electrónica <span className="accent">tocando los componentes</span>
          </h1>
          <p className="lead">
            Mirá cada componente por dentro, cambiale el valor y descubrí cómo funciona. Después poné a prueba lo que
            sabés con actividades y juegos.
          </p>
          <div className="row">
            <Link to={sub('/laboratorio')} className="btn primary big">
              Abrir el laboratorio
            </Link>
            <Link to={sub('/laboratorio/mesa')} className="btn big">
              Mesa de trabajo
            </Link>
            <Link to={sub('/juegos')} className="btn big">
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
