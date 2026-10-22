import type { SubjectEntry } from '.'
import { CATALOG } from '../catalog'
import { TOPICS } from '../data/theory'
import { GAMES } from '../games/registry'
import { ElectronicsHome } from '../pages/ElectronicsHome'

const entry: Omit<SubjectEntry, 'nav'> = {
  Home: ElectronicsHome,
  catalog: CATALOG,
  topics: TOPICS,
  games: GAMES,
}
export default entry
