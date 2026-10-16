import { useState } from 'react'
import { createPlayer, currentPlayer, selectPlayer, totalPoints, useStore } from '../lib/scores'

export function PlayerBadge() {
  const s = useStore()
  const p = currentPlayer(s)
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" className="player-badge" onClick={() => setOpen(true)}>
        {p ? (
          <>
            <span className="avatar">{p.name.slice(0, 1).toUpperCase()}</span>
            <span className="player-name">
              {p.name} <small>{p.curso}</small>
            </span>
            <span className="pts">{totalPoints(s, p.id)} pts</span>
          </>
        ) : (
          <span>👤 Ingresar</span>
        )}
      </button>
      {open && <PlayerModal onClose={() => setOpen(false)} />}
    </>
  )
}

export function PlayerModal({ onClose }: { onClose: () => void }) {
  const s = useStore()
  const [name, setName] = useState('')
  const [curso, setCurso] = useState(localStorage.getItem('ultimo-curso') ?? '')
  const cursos = [...new Set(s.players.map((p) => p.curso))].sort()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !curso.trim()) return
    try {
      localStorage.setItem('ultimo-curso', curso.trim())
    } catch {
      /* sin almacenamiento */
    }
    createPlayer(name, curso)
    onClose()
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
        <h2>¿Quién está jugando?</h2>
        <form onSubmit={submit} className="stack">
          <label className="field">
            <span className="field-label">Nombre y apellido</span>
            <input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej.: Sofía Pérez" />
          </label>
          <label className="field">
            <span className="field-label">Curso</span>
            <input className="input" list="cursos" value={curso} onChange={(e) => setCurso(e.target.value)} placeholder="Ej.: 4°B" />
            <datalist id="cursos">
              {cursos.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <button className="btn primary" type="submit" disabled={!name.trim() || !curso.trim()}>
            Entrar
          </button>
        </form>
        {s.players.length > 0 && (
          <>
            <h3>O elegí un usuario de esta computadora</h3>
            <div className="player-list">
              {s.players.map((pl) => (
                <button
                  key={pl.id}
                  type="button"
                  className={`chip ${pl.id === s.currentPlayerId ? 'active' : ''}`}
                  onClick={() => {
                    selectPlayer(pl.id)
                    onClose()
                  }}
                >
                  {pl.name} · {pl.curso}
                </button>
              ))}
            </div>
          </>
        )}
        {s.currentPlayerId && (
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              selectPlayer(null)
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
