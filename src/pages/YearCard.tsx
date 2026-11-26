import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SUBJECTS, type Year } from '../data/curriculum'

/** Foto de cada rotación (los modelos 3D del laboratorio de ese taller). */
const rotationImg = (yearId: string, n: number) => `img/rotaciones/${yearId}-${n}.webp`

/** ¿El dispositivo tiene un mouse que pueda "pasar por encima"? (en celulares y tablets se muestran miniaturas) */
const canHover = () => typeof matchMedia !== 'undefined' && matchMedia('(hover: hover) and (pointer: fine)').matches

/**
 * Tarjeta de un año. Con el mouse, una lupa redonda sigue al cursor y deja ver, agrandadas, las 4 rotaciones
 * que hay "debajo" de la tarjeta (una en cada cuarto). Sin mouse, se ven las 4 en miniatura.
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
    ref.current.style.setProperty('--mx', `${x}px`)
    ref.current.style.setProperty('--my', `${y}px`)
    const q = (x > b.width / 2 ? 1 : 0) + (y > b.height / 2 ? 2 : 0)
    setActive(q < rotations.length ? q : null)
  }

  const label = active !== null ? rotations[active] : null

  return (
    <Link
      ref={ref}
      to={`/${year.id}`}
      className={`year-btn ${ready ? '' : 'soon'} ${active !== null ? 'lens-on' : ''}`}
      onPointerMove={move}
      onPointerLeave={() => setActive(null)}
    >
      <span className="year-num">{year.short}</span>
      <span className="year-name">{year.name}</span>
      <ol className="year-rots" aria-label={`Rotaciones de ${year.name}`}>
        {rotations.map((r, i) => (
          <li key={r.n} className={active === i ? 'on' : ''}>
            <b>{r.n}</b> {SUBJECTS[r.subject!].name}
          </li>
        ))}
      </ol>
      <span className={`pill ${ready ? 'ok' : ''}`}>
        {ready ? `${ready} ${ready === 1 ? 'taller disponible' : 'talleres disponibles'}` : 'Próximamente'}
      </span>

      {hover ? (
        // lo que se ve dentro de la lupa: las 4 rotaciones, una por cuarto de la tarjeta, agrandadas
        <span className="year-reveal" aria-hidden>
          <span className="year-mosaic">
            {rotations.map((r) => (
              <span key={r.n} className="year-tile">
                {armed && <img src={rotationImg(year.id, r.n)} alt="" decoding="async" />}
              </span>
            ))}
          </span>
          <span className="year-ring">
            {label && (
              <span className="year-ring-label">
                Rotación {label.n} · {SUBJECTS[label.subject!].name}
              </span>
            )}
          </span>
        </span>
      ) : (
        <span className="year-thumbs" aria-hidden>
          {rotations.map((r) => (
            <span key={r.n} className="year-thumb" title={SUBJECTS[r.subject!].name}>
              <img src={rotationImg(year.id, r.n)} alt="" loading="lazy" decoding="async" />
              <b>{r.n}</b>
            </span>
          ))}
        </span>
      )}
    </Link>
  )
}

/**
 * Las fotos de la lupa se piden recién cuando el mouse se acerca a las tarjetas (o cuando la página ya está quieta):
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
