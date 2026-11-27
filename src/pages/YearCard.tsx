import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SUBJECTS, type Year } from '../data/curriculum'

/** Foto de cada rotación (el modelo 3D de ese taller, encuadrado de cerca). */
// (subir el número de versión al cambiar las fotos, así los navegadores no siguen mostrando las viejas)
const rotationImg = (yearId: string, n: number) => `img/rotaciones/${yearId}-${n}.webp?v=2`

/** ¿El dispositivo tiene un mouse que pueda "pasar por encima"? (en celulares y tablets se muestran miniaturas) */
const canHover = () => typeof matchMedia !== 'undefined' && matchMedia('(hover: hover) and (pointer: fine)').matches

/**
 * Tarjeta de un año. Cada cuarto de la tarjeta esconde una rotación: con el mouse, una lupa redonda sigue al
 * cursor y deja ver, agrandada, la rotación de ese cuarto, con su nombre. Sin mouse, se ven las 4 en miniatura.
 */
export function YearCard({ year, ready, armed }: { year: Year; ready: number; armed: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const [active, setActive] = useState<number | null>(null)
  const [hover] = useState(canHover)
  const rotations = year.rotations.filter((r) => r.subject)

  const move = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !ref.current) return
    const b = ref.current.getBoundingClientRect()
    const x = e.clientX - b.left
    const y = e.clientY - b.top
    const right = x > b.width / 2
    const bottom = y > b.height / 2
    const s = ref.current.style
    s.setProperty('--mx', `${x}px`)
    s.setProperty('--my', `${y}px`)
    const q = (right ? 1 : 0) + (bottom ? 2 : 0)
    setActive(q < rotations.length ? q : null)
  }

  const label = active !== null ? rotations[active] : null

  return (
    <Link
      ref={ref}
      to={`/${year.id}`}
      className={`year-btn plano-${year.id} ${ready ? '' : 'soon'} ${active !== null ? 'lens-on' : ''}`}
      onPointerMove={move}
      onPointerLeave={() => setActive(null)}
    >
      <span className="year-num">{year.short}</span>
      <span className="year-name">{year.name}</span>
      {/* en celulares los nombres ya van debajo de cada miniatura */}
      {hover && (
        <ul className="year-rots" aria-label={`Rotaciones de ${year.name}`}>
          {rotations.map((r, i) => (
            <li key={r.n} className={active === i ? 'on' : ''}>
              {SUBJECTS[r.subject!].name}
            </li>
          ))}
        </ul>
      )}
      <span className={`pill ${ready ? 'ok' : ''}`}>
        {ready ? `${ready} ${ready === 1 ? 'taller disponible' : 'talleres disponibles'}` : 'Próximamente'}
      </span>

      {hover ? (
        // dentro de la lupa: las 4 rotaciones, una por cuarto de la tarjeta, agrandadas alrededor del cursor
        <span className="year-reveal" aria-hidden>
          <span className="year-mosaic">
            {rotations.map((r) => (
              <span key={r.n} className="year-tile">
                {armed && (
                  <>
                    {/* la misma foto, desenfocada, rellena el cuarto; encima va entera, sin recortar */}
                    <img className="fill" src={rotationImg(year.id, r.n)} alt="" decoding="async" />
                    <img className="pic" src={rotationImg(year.id, r.n)} alt="" decoding="async" />
                  </>
                )}
              </span>
            ))}
          </span>
          <span className="year-ring">{label && <span className="year-ring-label">{SUBJECTS[label.subject!].name}</span>}</span>
        </span>
      ) : (
        <span className="year-thumbs" aria-hidden>
          {rotations.map((r) => (
            <span key={r.n} className="year-thumb">
              <img src={rotationImg(year.id, r.n)} alt="" loading="lazy" decoding="async" />
              <span>{SUBJECTS[r.subject!].name}</span>
            </span>
          ))}
        </span>
      )}
    </Link>
  )
}

/**
 * Las fotos de la lupa se piden recién cuando el mouse se acerca a las tarjetas (o a los pocos segundos):
 * así la portada carga igual de rápido.
 */
export function useArmImages() {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (armed) return
    const id = window.setTimeout(() => setArmed(true), 2500)
    return () => window.clearTimeout(id)
  }, [armed])
  return [armed, () => setArmed(true)] as const
}
