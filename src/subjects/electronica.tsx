import type { SubjectEntry } from '.'
import { CATALOG } from '../catalog'
import { TOPICS } from '../data/theory'
import { GAMES } from '../games/registry'
import { ElectronicsHome } from '../pages/ElectronicsHome'
import { lazyNamed } from '../lib/lazy'
import { MISSIONS, missionActivityId } from '../lab/bench/missions'

// el laboratorio (mesa de trabajo 3D) se descarga recién al abrirlo
const LabPage = lazyNamed(() => import('../lab/LabPage'), 'LabPage')
// la mesa de trabajo trae el editor de código y el simulador
const BenchPage = lazyNamed(() => import('../lab/bench/BenchPage'), 'BenchPage')
const MissionBenchPage = lazyNamed(() => import('../lab/bench/BenchPage'), 'MissionBenchPage')
const MissionsPage = lazyNamed(() => import('../lab/bench/MissionsPage'), 'MissionsPage')

const entry: Omit<SubjectEntry, 'nav'> = {
  Home: ElectronicsHome,
  catalog: CATALOG,
  topics: TOPICS,
  games: GAMES,
  routes: [
    { path: 'laboratorio', Page: LabPage },
    { path: 'laboratorio/mesa', Page: BenchPage },
    { path: 'laboratorio/misiones', Page: MissionsPage },
    { path: 'laboratorio/misiones/:id', Page: MissionBenchPage },
    { path: 'laboratorio/:id', Page: LabPage },
  ],
  progress: [{ label: 'Misiones de la mesa de trabajo', ids: MISSIONS.map((m) => missionActivityId(m.id)) }],
}
export default entry
