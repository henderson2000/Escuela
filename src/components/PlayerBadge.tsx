import { useEffect, useState } from 'react'
import { ONLINE } from '../lib/config'
import { forgetRecent, login, logout, myPoints, useStore } from '../lib/scores'

const OPEN_EVENT = 'abrir-ingreso'

/** Abre el cartel de ingreso desde cualquier parte de la app. */
export function requestLogin() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

export function PlayerBadge() {
  const s = useStore()
  const p = s.me
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const h = () => setOpen(true)
    window.addEventListener(OPEN_EVENT, h)
    return () => window.removeEventListener(OPEN_EVENT, h)
  }, [])

  return (
    <>
      <button type="button" className="player-badge" onClick={() => setOpen(true)}>
        {p ? (
          <>
            <span className="avatar">{p.name.slice(0, 1).toUpperCase()}</span>
            <span className="player-name">
              {p.name} <small>{p.curso}</small>
            </span>
            <span className="pts">{myPoints(s)} pts</span>
          </>
        ) : (
          <span>👤 Ingresar</span>
        )}
      </button>
      {open && <PlayerModal onClose={() => setOpen(false)} />}
    </>
  )
}

function lastCurso() {
  try {
    return localStorage.getItem('ultimo-curso') ?? ''
  } catch {
    return ''
  }
}

export function PlayerModal({ onClose }: { onClose: () => void }) {
  const s = useStore()
  const [name, setName] = useState('')
  const [curso, setCurso] = useState(lastCurso)
  const [error, setError] = useState<string | null>(null)
  const cursos = [...new Set(s.recent.map((p) => p.curso))].sort()
  const nameOk = /\S+\s+\S+/.test(name.trim())

  const enter = async (n: string, c: string) => {
    setError(null)
    try {
      await login(n, c)
      try {
        localStorage.setItem('ultimo-curso', c.trim())
      } catch {
        /* sin almacenamiento */
      }
      onClose()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal aria-labelledby="ingreso-titulo">
        <h2 id="ingreso-titulo">¿Quién está jugando?</h2>
        <p className="hint">
          {ONLINE
            ? 'Entrá siempre con el mismo nombre y curso: así tus puntos se suman en el ranking del curso.'
            : 'Modo sin servidor: los puntos quedan guardados sólo en esta computadora.'}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (nameOk && curso.trim()) enter(name, curso)
          }}
          className="stack"
        >
          <label className="field">
            <span className="field-label">Nombre y apellido</span>
            <input id="ingreso-nombre" className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej.: Sofía Pérez" autoComplete="off" />
          </label>
          <label className="field">
            <span className="field-label">Curso</span>
            <input id="ingreso-curso" className="input" list="cursos" value={curso} onChange={(e) => setCurso(e.target.value)} placeholder="Ej.: 4°B" />
            <datalist id="cursos">
              {cursos.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <button className="btn primary" type="submit" disabled={!nameOk || !curso.trim() || s.busy}>
            {s.busy ? 'Entrando…' : 'Entrar'}
          </button>
          {name.trim() && !nameOk && <span className="field-hint">Escribí nombre y apellido.</span>}
          {error && <span className="feedback bad">{error}</span>}
        </form>
        {s.recent.length > 0 && (
          <>
            <h3>Usaron esta computadora</h3>
            <div className="player-list">
              {s.recent.map((pl) => (
                <span key={pl.id} className={`chip ${pl.id === s.me?.id ? 'active' : ''}`}>
                  <button type="button" className="chip-main" onClick={() => enter(pl.name, pl.curso)} disabled={s.busy}>
                    {pl.name} · {pl.curso}
                  </button>
                  <button type="button" className="chip-x" title="Quitar de la lista" aria-label={`Quitar a ${pl.name} de la lista`} onClick={() => forgetRecent(pl.id)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          </>
        )}
        {s.me && (
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              logout()
              onClose()
            }}
          >
            Cerrar sesión
          </button>
        )}
      </div>
    </div>
  )
}
