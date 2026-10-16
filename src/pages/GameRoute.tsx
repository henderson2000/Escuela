import { Link, useParams } from 'react-router-dom'
import { getGame } from '../games/registry'

export function GameRoute() {
  const { id = '' } = useParams()
  const g = getGame(id)
  if (!g) {
    return (
      <div className="page">
        Juego no encontrado. <Link to="/juegos">Volver</Link>
      </div>
    )
  }
  const C = g.component
  return <C key={g.id} />
}
