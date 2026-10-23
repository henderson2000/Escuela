import type { SubjectEntry } from '.'
import { SubjectHome } from '../pages/SubjectHome'
import { HOJALATERIA1_CATALOG } from '../primero/hojalateria/catalog'
import { HOJALATERIA1_TOPICS } from '../primero/hojalateria/theory'
import { HOJALATERIA1_GUIDE } from '../primero/hojalateria/guide'
import { HOJALATERIA1_GAMES } from '../primero/hojalateria/games'

function Home() {
  return (
    <SubjectHome
      title={
        <>
          Hojalatería: <span className="accent">trabajar la chapa</span>
        </>
      }
      lead="Chapas, hojalata y galvanizado; las herramientas para medir, trazar, cortar y plegar; y los tres proyectos del taller (caja, tapa y budinera) plegándose en 3D con las medidas de los planos."
      heroModel="caja"
      heroParams={{ op: 9 }}
      actions={[
        { to: '/componentes/caja', label: 'Plegar la caja en 3D', primary: true },
        { to: '/teoria', label: 'Teoría' },
      ]}
      sections={[
        { to: '/componentes', icon: '🧊', title: 'En 3D', text: 'La caja, la tapa y la budinera operación por operación, las herramientas, la plegadora y el engrafado.' },
        { to: '/teoria', icon: '📘', title: 'Teoría', text: 'Chapas, calibre, hojalata, galvanizado, herramientas, plegado, uniones, soldadura por punto y máquinas de corte.' },
        { to: '/ejercicios', icon: '📝', title: 'Guía de ejercicios', text: 'Lectura de planos, desarrollos y ciclos de fabricación de los tres proyectos.' },
        { to: '/juegos', icon: '🎮', title: 'Juegos', text: '¿Qué herramienta uso?, el orden de las operaciones y los planos. ¡Suman puntos!' },
      ]}
    />
  )
}

const entry: Omit<SubjectEntry, 'nav'> = {
  Home,
  catalog: HOJALATERIA1_CATALOG,
  topics: HOJALATERIA1_TOPICS,
  games: HOJALATERIA1_GAMES,
  guide: HOJALATERIA1_GUIDE,
  labels: {
    components: 'Hojalatería en 3D',
    componentsLead: 'Los proyectos del taller plegándose operación por operación, las herramientas, la plegadora y el engrafado.',
    componentsBack: 'Hojalatería en 3D',
    guideLead: 'Planos, desarrollos y ciclos de fabricación de la caja, la tapa y la budinera. Se corrigen solos.',
  },
}
export default entry
