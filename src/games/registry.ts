import type { ComponentType } from 'react'
import { ColorGame } from './ColorGame'
import { PartsGame } from './PartsGame'
import { SchematicGame, SCHEMATIC_LEVELS } from './SchematicGame'
import { BreadboardGame } from './BreadboardGame'
import { BB_LEVELS } from './breadboardLevels'

export interface GameDef {
  id: string
  title: string
  icon: string
  desc: string
  /** máximo de puntos posibles (aprox.) para mostrar */
  max: string
  /** juegos con niveles: cada nivel suma su mejor puntaje */
  levels?: string[]
  component: ComponentType
}

export const GAMES: GameDef[] = [
  {
    id: 'protoboard',
    title: 'Conexiones en la protoboard',
    icon: '🔌',
    desc: 'Armá circuitos reales en 3D: cables, resistencias, LEDs, pulsadores y potenciómetros conectados al Arduino.',
    max: `${BB_LEVELS.length} niveles × 100`,
    levels: BB_LEVELS.map((l) => l.id),
    component: BreadboardGame,
  },
  {
    id: 'plano',
    title: 'Completá el plano',
    icon: '📐',
    desc: 'A los esquemas les faltan piezas. Elegí el símbolo correcto para cada hueco.',
    max: `${SCHEMATIC_LEVELS.length} niveles × 100`,
    levels: SCHEMATIC_LEVELS.map((l) => l.id),
    component: SchematicGame,
  },
  {
    id: 'colores',
    title: 'Código de colores contrarreloj',
    icon: '🎨',
    desc: '60 segundos para leer todas las resistencias que puedas. Las rachas multiplican.',
    max: 'sin límite',
    component: ColorGame,
  },
  {
    id: 'partes',
    title: '¿Qué parte es?',
    icon: '🔍',
    desc: 'Identificá piezas de los componentes despiezados en 3D. Rápido = más puntos.',
    max: '200',
    component: PartsGame,
  },
]

export const getGame = (id: string) => GAMES.find((g) => g.id === id)
