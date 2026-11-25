import type { SubjectEntry } from '.'
import { CATALOG } from '../catalog'
import { TOPICS } from '../data/theory'
import { GAMES } from '../games/registry'
import { ElectronicsHome } from '../pages/ElectronicsHome'
import { lazyNamed } from '../lib/lazy'
import { MISSIONS, missionActivityId } from '../lab/bench/missions'

// la mesa de trabajo trae el editor de código y el simulador (el laboratorio es común a todos los talleres)
const BenchPage = lazyNamed(() => import('../lab/bench/BenchPage'), 'BenchPage')
const MissionBenchPage = lazyNamed(() => import('../lab/bench/BenchPage'), 'MissionBenchPage')
const MissionsPage = lazyNamed(() => import('../lab/bench/MissionsPage'), 'MissionsPage')

const entry: Omit<SubjectEntry, 'nav'> = {
  Home: ElectronicsHome,
  catalog: CATALOG,
  topics: TOPICS,
  games: GAMES,
  environment: 'electronica',
  routes: [
    { path: 'laboratorio/mesa', Page: BenchPage },
    { path: 'laboratorio/misiones', Page: MissionsPage },
    { path: 'laboratorio/misiones/:id', Page: MissionBenchPage },
  ],
  progress: [{ label: 'Misiones de la mesa de trabajo', ids: MISSIONS.map((m) => missionActivityId(m.id)) }],
}
export default entry
