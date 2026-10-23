import type { SubjectEntry } from '.'
import { SubjectHome } from '../pages/SubjectHome'
import { lazyNamed } from '../lib/lazy'
import { COMPU2_CATALOG } from '../segundo/computacion/catalog'
import { COMPU2_TOPICS } from '../segundo/computacion/theory'
import { COMPU2_GAMES } from '../segundo/computacion/games'
import { LESSONS, pseudoActivityId } from '../segundo/computacion/pseudo/lessons'

// el editor (CodeMirror) se descarga recién al abrir el pseudocódigo
const PseudoHome = lazyNamed(() => import('../segundo/computacion/pseudo/PseudoPages'), 'PseudoHome')
const PseudoLessonPage = lazyNamed(() => import('../segundo/computacion/pseudo/PseudoPages'), 'PseudoLessonPage')

function Home() {
  return (
    <SubjectHome
      title={
        <>
          Computación: <span className="accent">algoritmos y redes</span>
        </>
      }
      lead="Cómo evolucionaron las computadoras, el modelo de Von Neumann, las redes, la imagen digital y, sobre todo, a pensar algoritmos y escribirlos en pseudocódigo que se ejecuta y se corrige solo."
      heroModel="von-neumann"
      heroParams={{ paso: 3 }}
      actions={[
        { to: '/pseudocodigo', label: 'Escribir pseudocódigo', primary: true },
        { to: '/componentes/red', label: 'Ver la red en 3D' },
      ]}
      sections={[
        { to: '/componentes', icon: '🧊', title: 'En 3D', text: 'Von Neumann ejecutando un programa paso a paso, una red con topologías y paquetes, y los píxeles de cerca.' },
        { to: '/teoria', icon: '📘', title: 'Teoría', text: 'Computación y programación, historia, Von Neumann, redes, algoritmos, pseudocódigo, píxeles y formatos.' },
        { to: '/pseudocodigo', icon: '⌨️', title: 'Pseudocódigo', text: `${LESSONS.length} lecciones con un intérprete estilo PSeInt: Escribir, Leer, Si, Mientras, Para, Repetir… y un taller libre.` },
        { to: '/juegos', icon: '🎮', title: 'Juegos', text: 'Redes, prueba de escritorio de pseudocódigo e imagen digital. ¡Suman puntos!' },
      ]}
    />
  )
}

const entry: Omit<SubjectEntry, 'nav'> = {
  Home,
  catalog: COMPU2_CATALOG,
  topics: COMPU2_TOPICS,
  games: COMPU2_GAMES,
  routes: [
    { path: 'pseudocodigo', Page: PseudoHome },
    { path: 'pseudocodigo/:id', Page: PseudoLessonPage },
  ],
  progress: [{ label: 'Lecciones de pseudocódigo', ids: LESSONS.map((l) => pseudoActivityId(l.id)) }],
  labels: {
    components: 'Computación en 3D',
    componentsLead: 'El modelo de Von Neumann, una red de computadoras y una pantalla vista de cerca.',
    componentsBack: 'Computación en 3D',
  },
}
export default entry
