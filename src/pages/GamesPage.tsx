import { Link } from 'react-router-dom'
import { GAMES } from '../games/registry'
import { bestScore, currentPlayer, useStore } from '../lib/scores'

export function GamesPage() {
  const s = useStore()
  const p = currentPlayer(s)
  return (
    <div className="page">
      <h1>Juegos</h1>
      <p className="lead">
        Cada juego suma puntos al ranking del curso. Cuenta tu <strong>mejor</strong> resultado en cada juego (y en cada
        nivel), así que siempre podés volver a intentar para superarte.
      </p>
      <div className="grid cards games">
        {GAMES.map((g) => {
          const best = p
            ? g.levels
              ? g.levels.reduce((a, l) => a + bestScore(s, p.id, g.id, l), 0)
              : bestScore(s, p.id, g.id)
            : 0
          return (
            <Link key={g.id} to={`/juegos/${g.id}`} className="comp-card game-card">
              <span className="comp-icon">{g.icon}</span>
              <strong>{g.title}</strong>
              <span>{g.desc}</span>
              <span className="game-meta">
                Puntos: {g.max}
                {p && <> · Tus puntos: <b>{best}</b></>}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
