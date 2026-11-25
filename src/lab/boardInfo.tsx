import { useState } from 'react'
import * as THREE from 'three'
import { PCB_T, arduinoPinPositions, unoPinGroup, type PinGroup } from '../three/models/Arduino'
import { NANO_PIN_DOWN, nanoPinGroup, nanoPinPositions, nanoToUno } from '../three/models/Nano'

export const GROUP_INFO: Record<PinGroup, { label: string; color: string }> = {
  power: { label: 'Alimentación', color: '#ef4444' },
  ground: { label: 'GND (masa)', color: '#9ca3af' },
  digital: { label: 'Digital', color: '#38bdf8' },
  pwm: { label: 'Digital con PWM (~)', color: '#a78bfa' },
  analog: { label: 'Analógico', color: '#34d399' },
  bus: { label: 'Comunicación (UART, I²C)', color: '#fbbf24' },
  control: { label: 'Control (RESET, AREF)', color: '#fb923c' },
  nc: { label: 'Sin conexión', color: '#4b5563' },
}

/** Qué hace cada pin del UNO, en pocas palabras. */
export function unoPinInfo(n: string): { title: string; text: string } {
  const g = unoPinGroup(n)
  if (n === '5V') return { title: '5V', text: 'Salida de 5 V para alimentar sensores y módulos. Viene del USB o del regulador.' }
  if (n === '3.3V') return { title: '3.3V', text: 'Salida de 3,3 V para módulos que la necesitan. Entrega como máximo 50 mA.' }
  if (n === 'VIN') return { title: 'VIN', text: 'La tensión que entra por el jack (7 a 12 V). También se puede alimentar la placa por acá.' }
  if (n === 'IOREF') return { title: 'IOREF', text: 'Indica a los shields con qué tensión trabajan los pines (en el UNO, 5 V).' }
  if (g === 'ground') return { title: 'GND', text: 'Masa o negativo: la referencia común. Todo circuito conectado al Arduino comparte este GND.' }
  if (n === 'RESET') return { title: 'RESET', text: 'Si se lleva a GND, reinicia el programa (igual que el botón).' }
  if (n === 'AREF') return { title: 'AREF', text: 'Tensión de referencia externa para las entradas analógicas (opcional).' }
  if (n === 'SDA') return { title: 'SDA (I²C)', text: 'Línea de datos del bus I²C (es la misma que A4). Pantallas LCD con adaptador, sensores, relojes…' }
  if (n === 'SCL') return { title: 'SCL (I²C)', text: 'Línea de reloj del bus I²C (es la misma que A5).' }
  if (n === '0') return { title: 'Pin 0 · RX', text: 'Recibe datos por el puerto serie. Está compartido con el USB: si lo usás, puede fallar la carga del programa.' }
  if (n === '1') return { title: 'Pin 1 · TX', text: 'Envía datos por el puerto serie (lo que ves en el Monitor serie). Compartido con el USB.' }
  if (n === 'NC') return { title: 'Sin conexión', text: 'Pin reservado, no está conectado.' }
  if (g === 'analog') {
    const extra = n === 'A4' ? ' También es SDA del bus I²C.' : n === 'A5' ? ' También es SCL del bus I²C.' : ''
    return { title: `Entrada analógica ${n}`, text: `Mide una tensión de 0 a 5 V y la convierte en un número de 0 a 1023 con analogRead(${n}).${extra}` }
  }
  const pwm = g === 'pwm' ? ' Tiene PWM (~): con analogWrite() regula el brillo de un LED o la velocidad de un motor.' : ''
  const int = n === '2' || n === '3' ? ' Admite interrupciones (attachInterrupt).' : ''
  const led = n === '13' ? ' Tiene conectado el LED "L" de la placa.' : ''
  const spi = n === '11' ? ' También es MOSI (SPI).' : n === '12' ? ' También es MISO (SPI).' : n === '13' ? ' También es SCK (SPI).' : n === '10' ? ' También es SS (SPI).' : ''
  return { title: `Pin digital ${n}`, text: `Entrada o salida de 0 V / 5 V (digitalRead / digitalWrite). Máximo 20 mA.${pwm}${int}${led}${spi}` }
}

/** Datos de los pines de cada placa: posición, altura de la marca, grupo y explicación. */
export interface BoardPins {
  pins: Record<string, [number, number]>
  y: number
  group: (n: string) => PinGroup
  info: (n: string) => { title: string; text: string }
}

export const BOARD_PINS: Record<string, BoardPins> = {
  arduino: { pins: arduinoPinPositions(), y: -0.3 + PCB_T / 2 + 0.85 + 0.004, group: unoPinGroup, info: unoPinInfo },
  nano: {
    pins: nanoPinPositions(),
    y: 0.08 + 0.25 + NANO_PIN_DOWN + 0.08 + 0.008,
    group: nanoPinGroup,
    info: (n) => {
      const i = unoPinInfo(nanoToUno(n))
      const name = n.replace(/2$/, '')
      if (n === 'A6' || n === 'A7') return { title: `Entrada analógica ${n}`, text: 'Sólo lee tensiones de 0 a 5 V (0 a 1023). En el Nano, A6 y A7 no funcionan como pines digitales.' }
      if (n === '5V') return { title: '5V', text: 'Salida de 5 V del USB o del regulador. También se puede alimentar el Nano por acá con 5 V regulados.' }
      return { title: i.title.replace(/^Pin digital /, `${name} · pin digital `), text: i.text.replace('el LED "L" de la placa', 'el LED "L" de la placa') }
    },
  },
}

/** Marcas de colores sobre cada pin; al pasar el mouse se resalta y se informa cuál es. */
export function PinsOverlay({ board, hover, onHover }: { board: BoardPins; hover: string | null; onHover: (n: string | null) => void }) {
  const { pins, y } = board
  const [geo] = useState(() => new THREE.BoxGeometry(0.2, 0.012, 0.2))
  return (
    <group>
      {Object.entries(pins).map(([n, [x, z]]) => {
        const g = board.group(n)
        const on = hover === n
        return (
          <mesh
            key={n}
            geometry={geo}
            position={[x, y + (on ? 0.02 : 0), z]}
            scale={on ? [1.35, 2, 1.35] : [1, 1, 1]}
            onPointerOver={(e) => {
              e.stopPropagation()
              onHover(n)
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
              onHover(null)
              document.body.style.cursor = ''
            }}
          >
            <meshStandardMaterial color={GROUP_INFO[g].color} emissive={GROUP_INFO[g].color} emissiveIntensity={on ? 0.9 : 0.35} transparent opacity={0.85} />
          </mesh>
        )
      })}
    </group>
  )
}

/** Ficha técnica de las placas (para la pestaña «Ficha»). */
export const SPECS: Record<string, { rows: [string, string][]; good: string[]; careful: string[] }> = {
  arduino: {
    rows: [
      ['Microcontrolador', 'ATmega328P (8 bits)'],
      ['Reloj', '16 MHz'],
      ['Memoria Flash', '32 KB (0,5 KB los usa el bootloader)'],
      ['RAM / EEPROM', '2 KB / 1 KB'],
      ['Pines digitales', '14 (6 con PWM)'],
      ['Entradas analógicas', '6 (10 bits: 0 a 1023)'],
      ['Tensión de trabajo', '5 V'],
      ['Alimentación', 'USB 5 V, o 7 a 12 V por el jack / VIN'],
      ['Corriente por pin', '20 mA (máximo absoluto 40 mA)'],
      ['Comunicación', 'UART (serie), I²C, SPI'],
      ['Medidas', '68,6 × 53,4 mm · 25 g'],
    ],
    good: [
      'Es robusta: trabaja a 5 V y aguanta muchos errores de principiante.',
      'Hay ejemplos y respuestas para casi cualquier proyecto.',
      'El microcontrolador va en un zócalo: si se quema, se cambia.',
      'Los shields se enchufan arriba sin cablear.',
    ],
    careful: [
      'Un pin da como máximo 20 mA: los LEDs siempre con resistencia; motores y relés con transistor o driver.',
      'No alimentes servos ni motores desde el 5V de la placa: usá una fuente aparte y uní los GND.',
      'Los módulos de 3,3 V no se conectan directo a pines de 5 V.',
      'Los pines 0 y 1 son del USB: si tienen algo conectado, puede fallar la carga del programa.',
    ],
  },
  nano: {
    rows: [
      ['Microcontrolador', 'ATmega328P (8 bits), encapsulado TQFP-32'],
      ['Reloj', '16 MHz'],
      ['Memoria Flash', '32 KB (2 KB los usa el bootloader)'],
      ['RAM / EEPROM', '2 KB / 1 KB'],
      ['Pines digitales', '14 (6 con PWM)'],
      ['Entradas analógicas', '8 (A6 y A7 sólo analógicas)'],
      ['Tensión de trabajo', '5 V'],
      ['Alimentación', 'Mini-USB 5 V, o 7 a 12 V por VIN'],
      ['Corriente por pin', '20 mA (máximo absoluto 40 mA)'],
      ['Comunicación', 'UART (serie), I²C, SPI'],
      ['Medidas', '43,2 × 17,8 mm · 7 g'],
    ],
    good: [
      'Programa igual que el UNO: mismo chip, mismas funciones.',
      'Se clava directo en la protoboard: ideal para proyectos armados y robots chicos.',
      'Dos entradas analógicas más que el UNO.',
    ],
    careful: [
      'Va sobre el canal central de la protoboard: si no, las dos filas quedan en cortocircuito.',
      'Su regulador es chico: no le pidas mucha corriente desde el pin 5V cuando lo alimentás por VIN.',
      'Los clones con CH340 necesitan instalar el driver para que la compu los reconozca.',
      'A6 y A7 no sirven como pines digitales.',
    ],
  },
}
