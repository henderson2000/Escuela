import type { ReactNode } from 'react'
import type { Vec3 } from '../three/Part'

export interface PartInfo {
  id: string
  name: string
  desc: string
}

export type Activity =
  | {
      id: string
      type: 'mc'
      q: string
      options: string[]
      answer: number
      explain: string
    }
  | {
      id: string
      type: 'num'
      q: string
      answer: number
      /** tolerancia relativa aceptada (0.02 = 2 %) */
      tolerance?: number
      unit: string
      explain: string
    }

export type Params = Record<string, any>

export interface ComponentDef {
  id: string
  name: string
  category:
    | 'Componentes básicos'
    | 'Placas'
    | 'Sensores y entradas'
    | 'Actuadores'
    | 'Automatización'
    | 'Mando y potencia'
    | 'Máquina'
    | 'Accesorios'
    | 'Herramientas de corte'
    | 'Mecanizados'
    | 'La materia'
    | 'Cables'
    | 'Circuitos'
    | 'La computadora'
    | 'Periféricos'
    | 'Herramientas'
    | 'Instrumentos de medición y trazado'
    | 'Proyectos del taller'
    | 'Máquinas'
    | 'Instalación eléctrica'
    | 'Protecciones'
    | 'Instrumentos'
    | 'Equipo de soldadura'
    | 'Seguridad'
    | 'Uniones y posiciones'
    | 'Redes'
    | 'Soldadura con estaño'
    | 'Circuito impreso'
    | 'Fuentes de alimentación'
  icon: string
  short: string
  parts: PartInfo[] | ((p: Params) => PartInfo[])
  camera: Vec3
  target?: Vec3
  shadowY?: number
  defaultParams: Params
  render: (p: Params) => ReactNode
  Controls: (props: { params: Params; set: (patch: Params) => void }) => ReactNode
  theory: ReactNode
  activities: Activity[]
  /** entorno 3D propio en el laboratorio (si no, el del taller): p. ej. los accesorios van sobre un banco */
  environment?: EnvName
  /** 'wall': el modelo va colgado en la pared del fondo (tableros) */
  mount?: 'wall'
}

import type { EnvName } from '../lib/subject'

/** Las partes de un componente (algunas cambian según los parámetros). Vive acá para no arrastrar los catálogos. */
export function partsOf(c: ComponentDef, p: Params = c.defaultParams): PartInfo[] {
  return typeof c.parts === 'function' ? c.parts(p) : c.parts
}
