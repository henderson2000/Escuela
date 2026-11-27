import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SUBJECTS, type Year } from '../data/curriculum'

/** Foto de cada rotación (el modelo 3D de ese taller, encuadrado de cerca). */
// (subir el número de versión al cambiar las fotos, así los navegadores no siguen mostrando las viejas)
const rotationImg = (yearId: string, n: number) => `img/rotaciones/${yearId}-${n}.webp?v=2`

/** ¿El dispositivo tiene un mouse que pueda "pasar por encima"? (en celulares y tablets se muestran miniaturas) */
const canHover = () => typeof matchMedia !== 'undefined' && matchMedia('(hover: hover) and (pointer: fine)').matches

/**
 * Tarjeta de un año. Con el mouse, un circulito sigue al cursor y deja ver lo que hay "detrás": una hoja de
 * plano técnico, con el año y sus rotaciones resaltados en blanco. Sin mouse, se ven las 4 rotaciones en miniatura.
 */
export function YearCard({ year, ready }: { year: Year; ready: number }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const [lens, setLens] = useState(false)
  const [hover] = useState(canHover)
  const rotations = year.rotations.filter((r) => r.subject)

  const pillText = ready ? `${ready} ${ready === 1 ? 'taller disponible' : 'talleres disponibles'}` : 'Próximamente'

  const move = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !ref.current) return
    const b = ref.current.getBoundingClientRect()
    const s = ref.current.style
    s.setProperty('--mx', `${e.clientX - b.left}px`)
    s.setProperty('--my', `${e.clientY - b.top}px`)
    if (!lens) setLens(true)
  }

  return (
    <Link
      ref={ref}
      to={`/${year.id}`}
      className={`year-btn plano-${year.id} ${ready ? '' : 'soon'} ${lens ? 'lens-on' : ''}`}
      onPointerMove={move}
      onPointerLeave={() => setLens(false)}
    >
      <span className="year-num">{year.short}</span>
      {/* en celulares los nombres ya van debajo de cada miniatura */}
      {hover && (
        <ul className="year-rots" aria-label={`Rotaciones de ${year.name}`}>
          {rotations.map((r) => (
            <li key={r.n}>{SUBJECTS[r.subject!].name}</li>
          ))}
        </ul>
      )}
      <span className={`pill ${ready ? 'ok' : ''}`}>
        {pillText}
      </span>

      {hover ? (
        // el circulito: deja ver el plano de atrás (quieto) y, encima, el año y las rotaciones resaltados
        <span className="year-reveal" aria-hidden>
          <span className="year-zoom" />
          <span className="year-zoom-text">
            <span className="year-num">{year.short}</span>
            <ul className="year-rots">
              {rotations.map((r) => (
                <li key={r.n}>{SUBJECTS[r.subject!].name}</li>
              ))}
            </ul>
            <span className="pill">{pillText}</span>
          </span>
          <span className="year-ring" />
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
