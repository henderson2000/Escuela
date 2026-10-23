import type { SubjectEntry } from '.'
import { CompuHome } from '../compu/pages/CompuHome'
import { COMPU_GAMES } from '../compu/games/registry'
import { lazyNamed } from '../lib/lazy'

// el editor de código (CodeMirror) y el motor de JavaScript se descargan recién al abrir una lección
const TrackPage = lazyNamed(() => import('../compu/pages/TrackPage'), 'TrackPage')
const LessonPage = lazyNamed(() => import('../compu/pages/LessonPage'), 'LessonPage')
const PlaygroundPage = lazyNamed(() => import('../compu/pages/PlaygroundPage'), 'PlaygroundPage')
import { TRACKS, lessonActivityId, lessonsOf } from '../compu/course'

const entry: Omit<SubjectEntry, 'nav'> = {
  Home: CompuHome,
  catalog: [],
  topics: [],
  games: COMPU_GAMES,
  routes: [
    { path: 'curso/:track', Page: TrackPage },
    { path: 'curso/:track/:lesson', Page: LessonPage },
    { path: 'taller-libre', Page: PlaygroundPage },
  ],
  progress: TRACKS.map((t) => ({ label: `Lecciones de ${t.title}`, ids: lessonsOf(t).map((l) => lessonActivityId(l.id)) })),
}
export default entry
