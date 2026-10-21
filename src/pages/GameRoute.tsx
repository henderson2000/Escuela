import { Link, useParams } from 'react-router-dom'
import { useSubject } from '../lib/subject'
import { useSub } from '../lib/nav'

export function GameRoute() {
  const sub = useSub()
  const { id = '' } = useParams()
  const g = useSubject().games.find((x) => x.id === id)
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
