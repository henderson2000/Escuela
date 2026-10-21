import type { GameDef } from '../../games/registry'
import { LOGO_LEVELS } from '../levels'
import { ProgramGame, PROGRAM_GAME } from './ProgramGame'
import { GatesGame } from './GatesGame'
import { TimersGame } from './TimersGame'

export const LOGO_GAMES: GameDef[] = [
  {
    id: PROGRAM_GAME,
    title: 'Programá el LOGO!',
    icon: '🤖',
    desc: 'Automatizá situaciones reales: prensas, alarmas, bombas, cintas, semáforos. Tu programa se prueba solo.',
    max: `${LOGO_LEVELS.length} niveles × 100`,
    levels: LOGO_LEVELS.map((l) => l.id),
    component: ProgramGame,
  },
  {
    id: 'logo-compuertas',
    title: 'Compuertas al toque',
    icon: '🔣',
    desc: 'Reconocé AND, OR, NOT, NAND, NOR y XOR en símbolos, contactos y tablas de la verdad.',
    max: '200',
    component: GatesGame,
  },
  {
    id: 'logo-tiempos',
    title: 'Diagramas de tiempo',
    icon: '⏱',
    desc: 'Leé diagramas de entradas y salidas: ¿es un TON, un TOF, un relé de impulsos…? ¿Cuánto vale T?',
    max: '200',
    component: TimersGame,
  },
]
