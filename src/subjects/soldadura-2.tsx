import type { SubjectEntry } from '.'
import { SubjectHome } from '../pages/SubjectHome'
import { SOLDADURA2_CATALOG } from '../segundo/soldadura/catalog'
import { SOLDADURA2_TOPICS } from '../segundo/soldadura/theory'
import { SOLDADURA2_GUIDE } from '../segundo/soldadura/guide'
import { SOLDADURA2_GAMES } from '../segundo/soldadura/games'

function Home() {
  return (
    <SubjectHome
      title={
        <>
          Soldadura eléctrica <span className="accent">por arco</span>
        </>
      }
      lead="Soldadura con electrodo revestido: normas de seguridad, protección personal, el equipo, el arco, los electrodos y la técnica. Con un simulador para ver cómo queda el cordón según la intensidad, el arco, la velocidad y el ángulo."
      heroModel="equipo"
      actions={[
        { to: '/componentes/cordon', label: 'Probar el simulador del cordón', primary: true },
        { to: '/teoria', label: 'Teoría' },
      ]}
      sections={[
        { to: '/componentes', icon: '🧊', title: 'En 3D', text: 'El equipo con el arco encendido, el electrodo, el simulador del cordón, la protección personal y las uniones y posiciones.' },
        { to: '/teoria', icon: '📘', title: 'Teoría', text: 'Seguridad, protección de la vista, el proceso, el arco, electrodos, intensidad, técnica, posiciones y tablas de chapas.' },
        { to: '/ejercicios', icon: '📝', title: 'Guía de autoevaluación', text: 'Las 28 preguntas del apunte, con corrección automática.' },
        { to: '/juegos', icon: '🎮', title: 'Juegos', text: '¿Seguro o peligroso?, amperes y filtros, y encontrá qué salió mal en el cordón.' },
      ]}
    />
  )
}

const entry: Omit<SubjectEntry, 'nav'> = {
  Home,
  catalog: SOLDADURA2_CATALOG,
  topics: SOLDADURA2_TOPICS,
  games: SOLDADURA2_GAMES,
  guide: SOLDADURA2_GUIDE,
  labels: {
    components: 'Soldadura en 3D',
    componentsLead: 'El equipo de soldadura, el electrodo, un simulador del cordón, la protección personal y las uniones.',
    componentsBack: 'Soldadura en 3D',
    guideLead: 'Las 28 preguntas de la guía de autoevaluación del apunte de soldadura eléctrica. Se corrigen solas.',
  },
}
export default entry
