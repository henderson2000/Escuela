import type { SubjectEntry } from '.'
import { LOGO_CATALOG } from '../logo/catalog'
import { LOGO_TOPICS } from '../logo/theory'
import { LOGO_GAMES } from '../logo/games/registry'
import { LogoHome } from '../logo/pages/LogoHome'
import { EXERCISES } from '../logo/exercises'
import { lazyNamed } from '../lib/lazy'

// el editor de bloques se descarga recién al abrir el simulador o un ejercicio
const SimulatorPage = lazyNamed(() => import('../logo/pages/SimulatorPage'), 'SimulatorPage')
const GuidePage = lazyNamed(() => import('../logo/pages/GuidePage'), 'GuidePage')
const ExercisePage = lazyNamed(() => import('../logo/pages/ExercisePage'), 'ExercisePage')
const exerciseActivityId = (id: string) => `logo-${id}`

const entry: Omit<SubjectEntry, 'nav'> = {
  Home: LogoHome,
  catalog: LOGO_CATALOG,
  topics: LOGO_TOPICS,
  games: LOGO_GAMES,
  routes: [
    { path: 'simulador', Page: SimulatorPage },
    { path: 'guia', Page: GuidePage },
    { path: 'guia/:id', Page: ExercisePage },
  ],
  progress: [{ label: 'Ejercicios de la guía', ids: EXERCISES.map((e) => exerciseActivityId(e.id)) }],
  labels: {
    components: 'Equipos en 3D',
    componentsLead: 'El LOGO! y los elementos de mando y potencia de un tablero. Giralos, accionalos y despiezalos para ver cómo son por dentro.',
    componentsBack: 'Equipos en 3D',
  },
}
export default entry
