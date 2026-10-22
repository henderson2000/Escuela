import { useEffect, useState, type ReactNode } from 'react'
import { BULBS, onBulbs, owns, spendBulbs, useStore } from '../lib/scores'
import './bulbs.css'

/** Contador de lamparitas (arriba a la derecha), con el cartelito cuando se ganan o se gastan. */
export function BulbBadge() {
  const s = useStore()
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<{ id: number; delta: number; label: string } | null>(null)

  useEffect(
    () =>
      onBulbs((delta, label) => {
        const id = Date.now()
        setToast({ id, delta, label })
        setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), 2600)
      }),
    [],
  )

  return (
    <div className="bulb-wrap">
      <button type="button" className="bulb-badge" onClick={() => setOpen(!open)} aria-expanded={open} title="Tus lamparitas para comprar pistas">
        <span className="bulb-icon" aria-hidden>
          💡
        </span>
        <b>{s.bulbs}</b>
      </button>
      {toast && (
        <div key={toast.id} className={`bulb-toast ${toast.delta > 0 ? 'plus' : 'minus'}`} role="status">
          {toast.delta > 0 ? `+${toast.delta}` : toast.delta} 💡 <small>{toast.label}</small>
        </div>
      )}
      {open && (
        <div className="bulb-panel">
          <div className="row space">
            <strong>💡 Lamparitas: {s.bulbs}</strong>
            <button type="button" className="btn small ghost" onClick={() => setOpen(false)} aria-label="Cerrar">
              ✕
            </button>
          </div>
          <p className="hint">Se ganan resolviendo y se gastan en pistas. Se guardan en esta computadora.</p>
          <div className="bulb-cols">
            <div>
              <h5>Ganás</h5>
              <ul>
                <li>
                  Pregunta de actividad <b>+{BULBS.actividad}</b>
                </li>
                <li>
                  Lección de Computación <b>+{BULBS.leccion}</b>
                </li>
                <li>
                  Mini-proyecto <b>+{BULBS.proyecto}</b>
                </li>
                <li>
                  Ejercicio de la guía LOGO! <b>+{BULBS.ejercicioLogo}</b>
                </li>
                <li>
                  Juegos por puntos: <b>+1</b> cada {BULBS.puntosPorLamparita} puntos
                </li>
              </ul>
            </div>
            <div>
              <h5>Gastás</h5>
              <ul>
                <li>
                  Pista <b>−{BULBS.pista}</b>
                </li>
                <li>
                  Ver la solución <b>−{BULBS.solucion}</b>
                </li>
              </ul>
              <p className="hint">Cada cosa paga una sola vez. Lo que compraste queda desbloqueado.</p>
            </div>
          </div>
          {s.bulbLog.length > 0 && (
            <>
              <h5>Últimos movimientos</h5>
              <ul className="bulb-log">
                {s.bulbLog.slice(0, 8).map((e, i) => (
                  <li key={i} className={e.delta > 0 ? 'plus' : 'minus'}>
                    <b>{e.delta > 0 ? `+${e.delta}` : e.delta}</b> {e.label}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Botón para comprar algo con lamparitas (pista o solución). Si ya está comprado, muestra el contenido.
 * onBuy se llama la primera vez que se compra (por ejemplo, para cargar la solución).
 */
export function BulbPurchase({
  itemKey,
  cost,
  label,
  what,
  children,
  onBuy,
  confirmText,
}: {
  itemKey: string
  cost: number
  /** texto del botón, ej. "Ver una pista" */
  label: string
  /** qué se compra (para el historial), ej. "Pista: Hola, mundo" */
  what: string
  children?: ReactNode
  onBuy?: () => void
  confirmText?: string
}) {
  const s = useStore()
  const bought = owns(s, itemKey)
  const [show, setShow] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  if (bought && children)
    return (
      <div className="bulb-buy">
        <button type="button" className="btn ghost small" onClick={() => setShow(!show)}>
          💡 {show ? 'Ocultar' : label} <span className="owned-tag">desbloqueada</span>
        </button>
        {show && <div className="hint-box">{children}</div>}
      </div>
    )
  const missing = cost - s.bulbs
  return (
    <div className="bulb-buy">
      <button
        type="button"
        className="btn ghost small"
        onClick={() => {
          if (missing > 0) {
            setMsg(`Te faltan ${missing} 💡. Resolvé otras lecciones o actividades para ganar lamparitas.`)
            return
          }
          if (confirmText && !confirm(confirmText)) return
          if (spendBulbs(itemKey, cost, what)) {
            setShow(true)
            setMsg(null)
            onBuy?.()
          }
        }}
      >
        💡 {label} <span className={`cost ${missing > 0 ? 'short' : ''}`}>−{cost}</span>
      </button>
      {msg && <p className="hint">{msg}</p>}
    </div>
  )
}
