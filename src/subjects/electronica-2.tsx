import type { SubjectEntry } from '.'
import { SubjectHome } from '../pages/SubjectHome'
import { ELECTRONICA2_CATALOG } from '../segundo/electronica/catalog'
import { ELECTRONICA2_TOPICS } from '../segundo/electronica/theory'
import { ELECTRONICA2_GUIDE } from '../segundo/electronica/guide'
import { ELECTRONICA2_GAMES } from '../segundo/electronica/games'

function Home() {
  return (
    <SubjectHome
      title={
        <>
          Electrónica: <span className="accent">soldadura, placas y fuentes</span>
        </>
      }
      lead="Soldar con estaño como se debe, fabricar un circuito impreso, conocer los componentes y armar una fuente de alimentación. Con un simulador del punto de soldadura y un osciloscopio en 3D."
      heroModel="fuente"
      heroParams={{ etapa: 'filtrada', carga: 600 }}
      actions={[
        { to: '/componentes/punto', label: 'Probar el simulador de soldadura', primary: true },
        { to: '/ejercicios', label: 'Guía de ejercicios' },
      ]}
      sections={[
        { to: '/componentes', icon: '🧊', title: 'En 3D', text: 'La estación de soldado, el punto de soldadura, la fabricación de una placa y la fuente de 12 V con osciloscopio.' },
        { to: '/teoria', icon: '📘', title: 'Teoría', text: 'Seguridad, el soldador y el estaño, el punto de soldadura, desoldar, componentes, circuito impreso, fuentes y mediciones.' },
        { to: '/ejercicios', icon: '📝', title: 'Guía de ejercicios', text: '30 ejercicios de LEDs, componentes, soldadura y fuentes, con corrección automática.' },
        { to: '/juegos', icon: '🎮', title: 'Juegos', text: 'Partes en 3D, ¿buena o mala soldadura?, componentes y cálculos, y seguridad. ¡Suman puntos!' },
      ]}
    />
  )
}

const entry: Omit<SubjectEntry, 'nav'> = {
  environment: 'electronica',
  Home,
  catalog: ELECTRONICA2_CATALOG,
  topics: ELECTRONICA2_TOPICS,
  games: ELECTRONICA2_GAMES,
  guide: ELECTRONICA2_GUIDE,
  labels: {
    components: 'Electrónica en 3D',
    componentsLead: 'La estación de soldado, el punto de soldadura, cómo se fabrica una placa y una fuente de alimentación con osciloscopio.',
    componentsBack: 'Electrónica en 3D',
    guideLead: 'Ejercicios de resistencias y LEDs, componentes, soldadura y circuito impreso, y fuente de alimentación. Se corrigen solos.',
  },
}
export default entry
