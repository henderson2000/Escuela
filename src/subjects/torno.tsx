import type { SubjectEntry } from '.'
import { TornoHome } from '../torno/pages/TornoHome'
import { TORNO_CATALOG } from '../torno/catalog'
import { TORNO_TOPICS } from '../torno/theory'
import { TORNO_GAMES } from '../torno/games/registry'
import { lazyNamed } from '../lib/lazy'

const TornoGuidePage = lazyNamed(() => import('../torno/pages/TornoGuidePage'), 'TornoGuidePage')
import { PartsGame } from '../games/PartsGame'
import { TORNO_GUIDE } from '../torno/guide'

const entry: Omit<SubjectEntry, 'nav'> = {
  Home: TornoHome,
  catalog: TORNO_CATALOG,
  topics: TORNO_TOPICS,
  games: [
    {
      id: 'torno-partes',
      title: '¿Qué parte es?',
      icon: '🔍',
      desc: 'El torno y sus accesorios aparecen despiezados en 3D: identificá la pieza marcada. Rápido = más puntos.',
      max: '200',
      component: () => <PartsGame game="torno-partes" />,
    },
    ...TORNO_GAMES,
  ],
  routes: [{ path: 'ejercicios', Page: TornoGuidePage }],
  progress: [{ label: 'Guía de ejercicios', ids: TORNO_GUIDE.flatMap((g) => g.activities.map((a) => a.id)) }],
  labels: {
    components: 'El torno en 3D',
    componentsLead: 'La máquina, sus accesorios y las herramientas de corte. Encendé el torno, mové los carros, cambiá el montaje y despiezá cada parte.',
    componentsBack: 'Torno en 3D',
  },
}
export default entry
