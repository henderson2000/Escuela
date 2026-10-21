import { Link, useParams } from 'react-router-dom'
import { getGame } from '../games/registry'
import { useSub } from '../lib/nav'

export function GameRoute() {
  const sub = useSub()
  const { id = '' } = useParams()
  const g = getGame(id)
  if (!g) {
    return (
      <div className="page">
        Juego no encontrado. <Link to={sub('/juegos')}>Volver</Link>
      </div>
    )
  }
  const C = g.component
  return <C key={g.id} />
}
