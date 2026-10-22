import type { SubjectEntry } from '.'
import { LOGO_CATALOG } from '../logo/catalog'
import { LOGO_TOPICS } from '../logo/theory'
import { LOGO_GAMES } from '../logo/games/registry'
import { LogoHome } from '../logo/pages/LogoHome'
import { SimulatorPage } from '../logo/pages/SimulatorPage'
import { GuidePage } from '../logo/pages/GuidePage'
import { ExercisePage } from '../logo/pages/ExercisePage'
import { EXERCISES } from '../logo/exercises'
import { exerciseActivityId } from '../logo/pages/GuidePage'

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
