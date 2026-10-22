import { Link } from 'react-router-dom'
import { Viewer } from '../../three/Viewer'
import { useSub } from '../../lib/nav'
import { useSubject } from '../../lib/subject'

const SECTIONS = [
  { to: '/componentes', icon: '🧊', title: 'Torno en 3D', text: 'El torno paralelo, sus platos, puntos, lunetas y herramientas de corte. Movelos, encendelos y despiezalos.' },
  { to: '/teoria', icon: '📘', title: 'Teoría', text: 'Partes, accesorios, transmisión, montajes, herramientas, factores de corte, mecanizados, roscado y seguridad.' },
  { to: '/ejercicios', icon: '📝', title: 'Guía de ejercicios', text: 'Cálculos de rpm, conos y roscas, y casos prácticos con corrección automática.' },
  { to: '/juegos', icon: '🎮', title: 'Juegos', text: 'Reconocé las partes, elegí cómo mecanizar y calculá rápido. ¡Suman puntos!' },
]

export function TornoHome() {
  const sub = useSub()
  const torno = useSubject().catalog.find((c) => c.id === 'torno')
  return (
    <div className="page home">
      <section className="hero">
        <div className="hero-text">
          <h1>
            El <span className="accent">torno paralelo</span>
          </h1>
          <p className="lead">
            La máquina herramienta que da forma a las piezas de revolución: cilindros, conos, roscas. Conocé cada parte en 3D,
            aprendé a montar la pieza y a elegir la herramienta, y trabajá siempre seguro.
          </p>
          <div className="row">
            <Link to={sub('/componentes/torno')} className="btn primary big">
              Ver el torno en 3D
            </Link>
            <Link to={sub('/teoria')} className="btn big">
              Teoría
            </Link>
          </div>
        </div>
        {torno && (
          <div className="hero-3d">
            <Viewer camera={torno.camera} target={torno.target} autoRotate shadowY={torno.shadowY} className="viewer hero-viewer">
              {torno.render(torno.defaultParams)}
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
