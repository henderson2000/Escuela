import type { SubjectEntry } from '.'
import { SubjectHome } from '../pages/SubjectHome'
import { ELECTRICIDAD1_CATALOG } from '../primero/electricidad/catalog'
import { ELECTRICIDAD1_TOPICS } from '../primero/electricidad/theory'
import { ELECTRICIDAD1_GUIDE } from '../primero/electricidad/guide'
import { ELECTRICIDAD1_GAMES } from '../primero/electricidad/games'

function Home() {
  return (
    <SubjectHome
      title={
        <>
          Instalaciones eléctricas <span className="accent">básicas</span>
        </>
      }
      lead="Del átomo al circuito: qué es la electricidad, por qué el cobre conduce y el PVC aísla, cómo se eligen los cables y cómo se relacionan la tensión, la corriente y la resistencia."
      heroModel="atomo"
      actions={[
        { to: '/componentes/circuito', label: 'Armar un circuito', primary: true },
        { to: '/teoria', label: 'Teoría' },
      ]}
      sections={[
        { to: '/componentes', icon: '🧊', title: 'En 3D', text: 'El átomo por capas, los cables por dentro y un circuito con lámparas en serie y en paralelo.' },
        { to: '/teoria', icon: '📘', title: 'Teoría', text: 'Átomo, materiales, cables, campo eléctrico, tensión, corriente, resistencia, ley de Ohm, CC y CA, serie y paralelo.' },
        { to: '/ejercicios', icon: '📝', title: 'Guía de ejercicios', text: 'Ley de Ohm, resistencia equivalente y cables, con corrección automática.' },
        { to: '/juegos', icon: '🎮', title: 'Juegos', text: 'Reconocé cables por su color, clasificá materiales y calculá rápido. ¡Suman puntos!' },
      ]}
    />
  )
}

const entry: Omit<SubjectEntry, 'nav'> = {
  Home,
  catalog: ELECTRICIDAD1_CATALOG,
  topics: ELECTRICIDAD1_TOPICS,
  games: ELECTRICIDAD1_GAMES,
  guide: ELECTRICIDAD1_GUIDE,
  labels: {
    components: 'Electricidad en 3D',
    componentsLead: 'El átomo, los cables y un circuito real. Cambiá sus valores, despiezalos y mirá cómo funcionan.',
    componentsBack: 'Electricidad en 3D',
    guideLead: 'Ley de Ohm, resistencia equivalente en serie y en paralelo, y cables. Se corrigen solos y tu progreso queda guardado.',
  },
}
export default entry
