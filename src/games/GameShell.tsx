import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { RankedGame } from './useRankedGame'
import { useSub } from '../lib/nav'

export function GameShell({ title, icon, children, info }: { title: string; icon: string; children: ReactNode; info?: ReactNode }) {
  const sub = useSub()
  return (
    <div className="page game">
      <Link to={sub('/juegos')} className="back">
        ← Juegos
      </Link>
      <h1>
        <span className="icon">{icon}</span> {title}
      </h1>
      {info && <p className="lead">{info}</p>}
      {children}
    </div>
  )
}

/** Resultado de una partida completa (juegos sin niveles). */
export function ResultCard({ g, detail, onAgain }: { g: RankedGame; detail?: ReactNode; onAgain: () => void }) {
  const r = g.lastResult
  if (!r) return null
  const record = r.ranked && r.points > r.prevBest
  return (
    <div className="card result">
      <div className="result-points">{r.points}</div>
      <div>{r.ranked ? 'puntos (quedan guardados en esta computadora)' : 'puntos (práctica, no se guardan)'}</div>
      {record && <p className="record">🎉 ¡Nuevo récord personal!</p>}
      {r.ranked && !record && r.prevBest > 0 && <p>Tu mejor intento sigue siendo {r.prevBest} puntos.</p>}
      {detail}
      {g.error && <p className="feedback bad">{g.error}</p>}
      <div className="row center">
        <button type="button" className="btn primary big" onClick={onAgain}>
          Continuar
        </button>
      </div>
    </div>
  )
}
