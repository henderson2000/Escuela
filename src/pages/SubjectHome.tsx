import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Viewer } from '../three/Viewer'
import { useSub } from '../lib/nav'
import { useSubject } from '../lib/subject'

export interface HomeSection {
  to: string
  icon: string
  title: string
  text: string
}

/** Inicio de un taller: título, texto, botones, un modelo 3D girando y las secciones. */
export function SubjectHome({
  title,
  lead,
  heroModel,
  heroParams,
  heroArt,
  actions,
  sections,
}: {
  title: ReactNode
  lead: ReactNode
  /** id del equipo del catálogo que se muestra en 3D */
  heroModel?: string
  heroParams?: Record<string, unknown>
  /** en lugar del 3D, otro dibujo */
  heroArt?: ReactNode
  actions: { to: string; label: string; primary?: boolean }[]
  sections: HomeSection[]
}) {
  const sub = useSub()
  const model = heroModel ? useSubject().catalog.find((c) => c.id === heroModel) : undefined
  return (
    <div className="page home">
      <section className="hero">
        <div className="hero-text">
          <h1>{title}</h1>
          <p className="lead">{lead}</p>
          <div className="row">
            {actions.map((a) => (
              <Link key={a.to} to={sub(a.to)} className={`btn big ${a.primary ? 'primary' : ''}`}>
                {a.label}
              </Link>
            ))}
          </div>
        </div>
        {model ? (
          <div className="hero-3d">
            <Viewer camera={model.camera} target={model.target} autoRotate shadowY={model.shadowY} className="viewer hero-viewer">
              {model.render({ ...model.defaultParams, ...heroParams })}
            </Viewer>
          </div>
        ) : (
          heroArt && <div className="hero-3d">{heroArt}</div>
        )}
      </section>
      <div className="grid cards">
        {sections.map((s) => (
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
