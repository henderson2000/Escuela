import { Link } from 'react-router-dom'
import { useSubject } from '../lib/subject'
import { MAX_ATTEMPTS } from '../lib/config'
import { bestOf, myAttempts, useStore } from '../lib/scores'
import { useSub } from '../lib/nav'

export function GamesPage() {
  const sub = useSub()
  const s = useStore()
  const { games: GAMES } = useSubject()
  return (
    <div className="page">
      <h1>Juegos</h1>
      <p className="lead">
        Cada juego (y cada nivel) se puede jugar <strong>{MAX_ATTEMPTS} veces por puntos</strong> en cada computadora; queda guardado
        el mejor intento. Después podés seguir practicando todo lo que quieras.
      </p>
      <div className="grid cards games">
        {GAMES.map((g) => {
          const levels = g.levels ?? ['']
          const best = levels.reduce((a, l) => a + bestOf(myAttempts(s, g.id, l)), 0)
          const left = levels.reduce((a, l) => a + Math.max(0, MAX_ATTEMPTS - myAttempts(s, g.id, l).length), 0)
          return (
            <Link key={g.id} to={sub(`/juegos/${g.id}`)} className="comp-card game-card">
              <span className="comp-icon">{g.icon}</span>
              <strong>{g.title}</strong>
              <span>{g.desc}</span>
              <span className="game-meta">
                Puntos: {g.max}
                {' '}
                · Tus puntos: <b>{best}</b> · Intentos disponibles: <b>{left}</b>
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
