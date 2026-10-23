import type { SubjectEntry } from '.'
import { SubjectHome } from '../pages/SubjectHome'
import { lazyNamed } from '../lib/lazy'
import { COMPU1_CATALOG } from '../primero/computacion/catalog'
import { COMPU1_TOPICS } from '../primero/computacion/theory'
import { COMPU1_GAMES } from '../primero/computacion/games'
import { LEVELS, levelActivityId } from '../primero/computacion/bloques/world'

const BlocksHome = lazyNamed(() => import('../primero/computacion/bloques/BlocksHome'), 'BlocksHome')
// el editor de bloques (Blockly) se descarga recién al abrir un nivel
const LevelPage = lazyNamed(() => import('../primero/computacion/bloques/LevelPage'), 'LevelPage')

function Home() {
  return (
    <SubjectHome
      title={
        <>
          La computadora <span className="accent">por dentro</span>
        </>
      }
      lead="Qué hay adentro de una computadora, cómo guarda todo con unos y ceros, cómo viaja la información por internet, y a pensar como programador armando programas con bloques."
      heroModel="pc"
      actions={[
        { to: '/bloques', label: 'Programar con bloques', primary: true },
        { to: '/componentes/pc', label: 'Ver la compu en 3D' },
      ]}
      sections={[
        { to: '/componentes', icon: '🧊', title: 'En 3D', text: 'El gabinete por dentro, el disco rígido y el SSD, y los periféricos. Despiezalos.' },
        { to: '/teoria', icon: '📘', title: 'Teoría', text: 'Partes, hardware y software, sistema binario, dato e información, redes, internet y pensamiento computacional.' },
        { to: '/bloques', icon: '🧩', title: 'Programación con bloques', text: '12 niveles con el robot del taller: secuencias, repeticiones, condicionales, variables y procedimientos.' },
        { to: '/juegos', icon: '🎮', title: 'Juegos', text: 'Reconocé las partes, pasá números a binario y separá hardware de software. ¡Suman puntos!' },
      ]}
    />
  )
}

const entry: Omit<SubjectEntry, 'nav'> = {
  Home,
  catalog: COMPU1_CATALOG,
  topics: COMPU1_TOPICS,
  games: COMPU1_GAMES,
  routes: [
    { path: 'bloques', Page: BlocksHome },
    { path: 'bloques/:id', Page: LevelPage },
  ],
  progress: [{ label: 'Niveles de bloques', ids: LEVELS.map((l) => levelActivityId(l.id)) }],
  labels: {
    components: 'La computadora en 3D',
    componentsLead: 'El gabinete y sus partes, el disco rígido frente al SSD y los periféricos de entrada y salida.',
    componentsBack: 'La computadora en 3D',
  },
}
export default entry
