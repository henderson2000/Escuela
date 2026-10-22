import type { SubjectEntry } from '.'
import { CompuHome } from '../compu/pages/CompuHome'
import { COMPU_GAMES } from '../compu/games/registry'
import { TrackPage } from '../compu/pages/TrackPage'
import { LessonPage } from '../compu/pages/LessonPage'
import { PlaygroundPage } from '../compu/pages/PlaygroundPage'
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
