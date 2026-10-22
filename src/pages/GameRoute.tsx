import { useParams } from 'react-router-dom'
import { useSubject } from '../lib/subject'
import { useSub } from '../lib/nav'
import { NotFound } from '../components/ui'

export function GameRoute() {
  const sub = useSub()
  const { id = '' } = useParams()
  const g = useSubject().games.find((x) => x.id === id)
  if (!g) {
    return <NotFound what="ese juego" back={sub('/juegos')} backLabel="Ver los juegos" />
  }
  const C = g.component
  return <C key={g.id} />
}
