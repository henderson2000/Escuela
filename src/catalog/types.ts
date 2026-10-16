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
  category: 'Componentes básicos' | 'Placas' | 'Sensores y entradas' | 'Actuadores'
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
}
