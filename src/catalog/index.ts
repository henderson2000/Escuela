import type { ComponentDef, PartInfo, Params } from './types'
export { partsOf } from './types'
import { resistor } from './resistor'
import { led } from './led'
import { capacitor } from './capacitor'
import { arduino, breadboard, nano } from './boards'
import { button, dht11, ldr, potentiometer, ultrasonic } from './sensors'
import { buzzer, servo, transistor } from './actuators'
import { motor } from './motor'

export const CATALOG: ComponentDef[] = [
  resistor,
  led,
  capacitor,
  transistor,
  breadboard,
  arduino,
  nano,
  potentiometer,
  button,
  ldr,
  ultrasonic,
  dht11,
  servo,
  motor,
  buzzer,
]

export const getComponent = (id: string) => CATALOG.find((c) => c.id === id)

export type { ComponentDef, PartInfo, Params }
