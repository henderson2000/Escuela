import type { ComponentType } from 'react'
import type { SubjectContent } from './lib/subject'
import { CATALOG } from './catalog'
import { TOPICS } from './data/theory'
import { GAMES } from './games/registry'
import { ElectronicsHome } from './pages/ElectronicsHome'
import { LOGO_CATALOG } from './logo/catalog'
import { LOGO_TOPICS } from './logo/theory'
import { LOGO_GAMES } from './logo/games/registry'
import { LogoHome } from './logo/pages/LogoHome'
import { CompuHome } from './compu/pages/CompuHome'
import { COMPU_GAMES } from './compu/games/registry'

export interface SubjectEntry extends SubjectContent {
  Home: ComponentType
}

/** Talleres que ya tienen contenido, por año y materia ("3/electronica"). */
export const SUBJECT_CONTENT: Record<string, SubjectEntry> = {
  '3/electronica': {
    Home: ElectronicsHome,
    catalog: CATALOG,
    topics: TOPICS,
    games: GAMES,
    nav: [
      { to: '', label: 'Inicio del taller', end: true },
      { to: '/componentes', label: 'Componentes 3D' },
      { to: '/teoria', label: 'Teoría' },
      { to: '/actividades', label: 'Actividades' },
      { to: '/juegos', label: 'Juegos' },
      { to: '/ranking', label: 'Ranking' },
    ],
  },
  '3/electricidad': {
    Home: LogoHome,
    catalog: LOGO_CATALOG,
    topics: LOGO_TOPICS,
    games: LOGO_GAMES,
    nav: [
      { to: '', label: 'Inicio del taller', end: true },
      { to: '/componentes', label: 'LOGO! 3D' },
      { to: '/teoria', label: 'Teoría' },
      { to: '/simulador', label: 'Simulador' },
      { to: '/guia', label: 'Guía' },
      { to: '/juegos', label: 'Juegos' },
      { to: '/ranking', label: 'Ranking' },
    ],
    labels: {
      components: 'Equipos en 3D',
      componentsLead: 'El LOGO! y los elementos de mando y potencia de un tablero. Giralos, accionalos y despiezalos para ver cómo son por dentro.',
      componentsBack: 'Equipos en 3D',
    },
  },
}

SUBJECT_CONTENT['3/computacion'] = {
  Home: CompuHome,
  catalog: [],
  topics: [],
  games: COMPU_GAMES,
  nav: [
    { to: '', label: 'Inicio del taller', end: true },
    { to: '/curso/html', label: 'HTML' },
    { to: '/curso/css', label: 'CSS' },
    { to: '/curso/java', label: 'Java' },
    { to: '/taller-libre', label: 'Taller libre' },
    { to: '/juegos', label: 'Juegos' },
    { to: '/ranking', label: 'Ranking' },
  ],
}

export const getSubjectContent = (anio?: string, materia?: string) => SUBJECT_CONTENT[`${anio}/${materia}`]
