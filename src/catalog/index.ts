import type { ComponentDef, PartInfo, Params } from './types'
import { resistor } from './resistor'
import { led } from './led'
import { capacitor } from './capacitor'
import { arduino, breadboard } from './boards'
import { button, dht11, ldr, potentiometer, ultrasonic } from './sensors'

export const CATALOG: ComponentDef[] = [
  resistor,
  led,
  capacitor,
  breadboard,
  arduino,
  potentiometer,
  button,
  ldr,
  ultrasonic,
  dht11,
]

export const getComponent = (id: string) => CATALOG.find((c) => c.id === id)

export function partsOf(c: ComponentDef, p: Params = c.defaultParams): PartInfo[] {
  return typeof c.parts === 'function' ? c.parts(p) : c.parts
}

export type { ComponentDef, PartInfo, Params }
