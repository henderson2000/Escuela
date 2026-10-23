import type { SubjectEntry } from '.'
import { SubjectHome } from '../pages/SubjectHome'
import { AJUSTE1_CATALOG } from '../primero/ajuste/catalog'
import { AJUSTE1_TOPICS } from '../primero/ajuste/theory'
import { AJUSTE1_GUIDE } from '../primero/ajuste/guide'
import { AJUSTE1_GAMES } from '../primero/ajuste/games'

function Home() {
  return (
    <SubjectHome
      title={
        <>
          Ajuste: <span className="accent">el limado</span>
        </>
      }
      lead="Aprendé a elegir la lima justa, a tomarla y moverla con la técnica correcta, y seguí paso a paso la fabricación del martillo de peña con las medidas del plano."
      heroModel="martillo"
      heroParams={{ etapa: 5, cotas: false }}
      actions={[
        { to: '/componentes/martillo', label: 'Ver el martillo en 3D', primary: true },
        { to: '/teoria', label: 'Teoría' },
      ]}
      sections={[
        { to: '/componentes', icon: '🧊', title: 'En 3D', text: 'La lima (forma, tamaño, picado y grado), el martillo etapa por etapa, los instrumentos de trazado y la morsa.' },
        { to: '/teoria', icon: '📘', title: 'Teoría', text: 'Limado, partes y clasificación de las limas, las tres etapas, técnica y postura, dirección del limado y el ciclo del martillo.' },
        { to: '/ejercicios', icon: '📝', title: 'Guía y trabajo práctico', text: 'Las 10 preguntas del trabajo práctico, el plano del martillo y el ciclo de fabricación.' },
        { to: '/juegos', icon: '🎮', title: 'Juegos', text: 'Elegí la lima justa, ordená el ciclo de fabricación y corregí la postura. ¡Suman puntos!' },
      ]}
    />
  )
}

const entry: Omit<SubjectEntry, 'nav'> = {
  Home,
  catalog: AJUSTE1_CATALOG,
  topics: AJUSTE1_TOPICS,
  games: AJUSTE1_GAMES,
  guide: AJUSTE1_GUIDE,
  labels: {
    components: 'Ajuste en 3D',
    componentsLead: 'La lima, el martillo de peña (el proyecto del taller), los instrumentos de trazado y la morsa.',
    componentsBack: 'Ajuste en 3D',
    guideLead: 'El trabajo práctico de limado, la lectura del plano y el ciclo de fabricación del martillo. Se corrigen solos.',
  },
}
export default entry
