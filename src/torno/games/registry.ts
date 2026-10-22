import type { GameDef } from '../../games/registry'
import { MountGame, MOUNT_GAME } from './MountGame'
import { SafetyGame, SAFETY_GAME } from './SafetyGame'
import { CalcGame, CALC_GAME } from './CalcGame'

export const TORNO_GAMES: GameDef[] = [
  {
    id: MOUNT_GAME,
    title: '¿Cómo lo mecanizo?',
    icon: '🗜️',
    desc: 'Te muestran una pieza y un trabajo: elegí el montaje, el accesorio, la herramienta, la operación o el carro correcto.',
    max: '200',
    component: MountGame,
  },
  {
    id: SAFETY_GAME,
    title: 'Seguridad en el taller',
    icon: '🦺',
    desc: '¿Está bien o mal? ¿Qué hacés? Situaciones reales frente al torno, según las normas del apunte.',
    max: '200',
    component: SafetyGame,
  },
  {
    id: CALC_GAME,
    title: 'Calculá rápido',
    icon: '🧮',
    desc: 'Rpm, desplazamiento de la contrapunta, conos, profundidad de rosca y ángulo β con números nuevos en cada partida.',
    max: '200',
    component: CalcGame,
  },
]
