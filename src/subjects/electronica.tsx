import type { SubjectEntry } from '.'
import { CATALOG } from '../catalog'
import { TOPICS } from '../data/theory'
import { GAMES } from '../games/registry'
import { ElectronicsHome } from '../pages/ElectronicsHome'
import { lazyNamed } from '../lib/lazy'

// el laboratorio (mesa de trabajo 3D) se descarga recién al abrirlo
const LabPage = lazyNamed(() => import('../lab/LabPage'), 'LabPage')

const entry: Omit<SubjectEntry, 'nav'> = {
  Home: ElectronicsHome,
  catalog: CATALOG,
  topics: TOPICS,
  games: GAMES,
  routes: [
    { path: 'laboratorio', Page: LabPage },
    { path: 'laboratorio/:id', Page: LabPage },
  ],
}
export default entry
