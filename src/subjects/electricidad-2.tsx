import type { SubjectEntry } from '.'
import { SubjectHome } from '../pages/SubjectHome'
import { ELECTRICIDAD2_CATALOG } from '../segundo/electricidad/catalog'
import { ELECTRICIDAD2_TOPICS } from '../segundo/electricidad/theory'
import { ELECTRICIDAD2_GUIDE } from '../segundo/electricidad/guide'
import { ELECTRICIDAD2_GAMES } from '../segundo/electricidad/games'

function Home() {
  return (
    <SubjectHome
      title={
        <>
          Instalaciones eléctricas <span className="accent">domiciliarias</span>
        </>
      }
      lead="Ley de Ohm y de Kirchhoff, circuitos en serie, paralelo y mixtos, protecciones, esquemas y seguridad. Y los cuatro circuitos del taller armados en 3D, con fallas que hacen saltar las protecciones."
      heroModel="instalacion"
      actions={[
        { to: '/componentes/instalacion', label: 'Probar la instalación en 3D', primary: true },
        { to: '/ejercicios', label: 'Guía de circuitos' },
      ]}
      sections={[
        { to: '/componentes', icon: '🧊', title: 'En 3D', text: 'Los circuitos del taller (simple, serie, paralelo y escalera), el termomagnético y el diferencial por dentro y el multímetro.' },
        { to: '/teoria', icon: '📘', title: 'Teoría', text: 'Magnitudes, Ohm, Kirchhoff, serie y paralelo, materiales, esquemas, simbología, reglas de oro, fallas y protecciones.' },
        { to: '/ejercicios', icon: '📝', title: 'Guía de ejercicios', text: 'Los 6 circuitos de la guía: RT, IT, corrientes y caídas de tensión, con corrección automática.' },
        { to: '/juegos', icon: '🎮', title: 'Juegos', text: 'Símbolos, cálculos rápidos, protecciones y seguridad. ¡Suman puntos!' },
      ]}
    />
  )
}

const entry: Omit<SubjectEntry, 'nav'> = {
  Home,
  catalog: ELECTRICIDAD2_CATALOG,
  topics: ELECTRICIDAD2_TOPICS,
  games: ELECTRICIDAD2_GAMES,
  guide: ELECTRICIDAD2_GUIDE,
  labels: {
    components: 'Electricidad en 3D',
    componentsLead: 'La instalación del taller con sus protecciones, el termomagnético y el diferencial por dentro, y el multímetro.',
    componentsBack: 'Electricidad en 3D',
    guideLead: 'La guía de resolución de circuitos eléctricos (6 circuitos) y un repaso del apunte. Se corrigen solos.',
  },
}
export default entry
