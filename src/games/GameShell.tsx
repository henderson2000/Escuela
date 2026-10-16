import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { currentPlayer, useStore } from '../lib/scores'
import { PlayerModal } from '../components/PlayerBadge'

export function GameShell({ title, icon, children, info }: { title: string; icon: string; children: ReactNode; info?: ReactNode }) {
  const s = useStore()
  const p = currentPlayer(s)
  const [login, setLogin] = useState(false)
  return (
    <div className="page game">
      <div className="row space wrap">
        <div>
          <Link to="/juegos" className="back">
            ← Juegos
          </Link>
          <h1>
            <span className="icon">{icon}</span> {title}
          </h1>
        </div>
        {!p && (
          <div className="warn-box">
            Estás jugando sin usuario: los puntos no se van a guardar.{' '}
            <button type="button" className="btn small primary" onClick={() => setLogin(true)}>
              Ingresar
            </button>
          </div>
        )}
      </div>
      {info && <p className="lead">{info}</p>}
      {children}
      {login && <PlayerModal onClose={() => setLogin(false)} />}
    </div>
  )
}

export function ResultCard({
  points,
  best,
  detail,
  onRetry,
  extra,
}: {
  points: number
  best: number
  detail?: ReactNode
  onRetry: () => void
  extra?: ReactNode
}) {
  const record = points >= best && points > 0
  return (
    <div className="card result">
      <div className="result-points">{points}</div>
      <div>puntos</div>
      {record ? <p className="record">🎉 ¡Nuevo récord personal!</p> : best > 0 && <p>Tu récord: {best} puntos</p>}
      {detail}
      <div className="row center">
        <button type="button" className="btn primary big" onClick={onRetry}>
          Jugar de nuevo
        </button>
        {extra}
        <Link to="/ranking" className="btn big">
          Ver ranking
        </Link>
      </div>
    </div>
  )
}
