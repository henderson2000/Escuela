// Niveles del juego "Programá el LOGO!": situaciones reales que hay que automatizar.
import type { Exercise } from './exercises'

const VERDE = '#22c55e'
const ROJO = '#ef4444'
const AMARILLO = '#facc15'

export const LOGO_LEVELS: Exercise[] = [
  {
    id: 'prensa',
    n: 1,
    title: 'Prensa con doble mando',
    text: 'Una prensa hidráulica sólo puede bajar si el operario aprieta los DOS pulsadores a la vez (uno con cada mano). Así nunca tiene una mano debajo de la prensa.',
    io: { I: { 1: { dev: 'NA', label: 'Mano izquierda' }, 2: { dev: 'NA', label: 'Mano derecha' } }, Q: { 1: { kind: 'motor', label: 'Prensa' } } },
    tests: { truth: { inputs: [1, 2], outputs: { 1: (v) => v[1] & v[2] } } },
  },
  {
    id: 'combinacion',
    n: 2,
    title: 'Luz de escalera con llaves de combinación',
    text: 'La luz de una escalera se maneja con dos llaves: una abajo (I1) y otra arriba (I2). Cualquiera de las dos tiene que poder prender o apagar la luz, esté como esté la otra.',
    io: { I: { 1: { dev: 'INT', label: 'Llave abajo' }, 2: { dev: 'INT', label: 'Llave arriba' } }, Q: { 1: { kind: 'lampara', label: 'Luz escalera' } } },
    tests: { truth: { inputs: [1, 2], outputs: { 1: (v) => v[1] ^ v[2] } } },
  },
  {
    id: 'alarma',
    n: 3,
    title: 'Alarma de un local',
    text: 'La sirena suena si la alarma está activada (interruptor I1) y se abre la puerta (sensor I2) o la ventana (sensor I3). Con la alarma desactivada, nunca suena.',
    io: {
      I: { 1: { dev: 'INT', label: 'Alarma activada' }, 2: { dev: 'NA', label: 'Sensor puerta' }, 3: { dev: 'NA', label: 'Sensor ventana' } },
      Q: { 1: { kind: 'sirena', label: 'Sirena' } },
    },
    tests: { truth: { inputs: [1, 2, 3], outputs: { 1: (v) => v[1] & (v[2] | v[3]) } } },
  },
  {
    id: 'autorretencion',
    n: 4,
    title: 'Bomba de agua con marcha y parada',
    text: 'Una bomba arranca con el pulsador de marcha (NA) y sigue funcionando al soltarlo. Se detiene con el pulsador de parada, que es NC (en reposo le da 1 al LOGO!).',
    io: { I: { 1: { dev: 'NA', label: 'Marcha' }, 2: { dev: 'NC', label: 'Parada' } }, Q: { 1: { kind: 'motor', label: 'Bomba' } } },
    tests: {
      sequences: [
        [
          { expect: { 1: 0 }, msg: 'Al arrancar' },
          { press: 1, expect: { 1: 1 } },
          { wait: 2000, expect: { 1: 1 }, msg: 'Dos segundos después de soltar Marcha' },
          { press: 2, expect: { 1: 0 } },
          { wait: 1000, expect: { 1: 0 }, msg: 'Después de parar' },
          { press: 1, expect: { 1: 1 } },
        ],
      ],
    },
  },
  {
    id: 'minutero',
    n: 5,
    title: 'Minutero de escalera',
    text: 'Al pulsar el botón del palier, la luz de la escalera se prende y se apaga sola 30 segundos después de soltarlo. Si alguien vuelve a pulsar, el tiempo empieza de nuevo.',
    io: { I: { 1: { dev: 'NA', label: 'Pulsador palier' } }, Q: { 1: { kind: 'lampara', label: 'Luz escalera' } } },
    tests: {
      sequences: [
        [
          { expect: { 1: 0 }, msg: 'Al arrancar' },
          { press: 1, expect: { 1: 1 } },
          { wait: 29600, expect: { 1: 1 }, msg: 'A los 29,7 s de soltar el pulsador' },
          { wait: 600, expect: { 1: 0 }, msg: 'A los 30,3 s de soltar el pulsador' },
          { press: 1 },
          { wait: 20000 },
          { press: 1, msg: 'Al volver a pulsar' },
          { wait: 25000, expect: { 1: 1 }, msg: 'A los 25 s de volver a pulsar (el tiempo tenía que empezar de nuevo)' },
          { wait: 6000, expect: { 1: 0 }, msg: 'A los 31 s de volver a pulsar' },
        ],
      ],
    },
  },
  {
    id: 'cinta',
    n: 6,
    title: 'Cinta transportadora con aviso',
    text: 'Antes de que arranque la cinta tiene que sonar una bocina de aviso durante 3 s. Al pulsar Marcha suena la bocina; a los 3 s se calla y arranca la cinta. Parada (NC) detiene todo.',
    io: {
      I: { 1: { dev: 'NA', label: 'Marcha' }, 2: { dev: 'NC', label: 'Parada' } },
      Q: { 1: { kind: 'sirena', label: 'Bocina' }, 2: { kind: 'motor', label: 'Cinta' } },
    },
    tests: {
      sequences: [
        [
          { expect: { 1: 0, 2: 0 }, msg: 'Al arrancar' },
          { press: 1, expect: { 1: 1, 2: 0 } },
          { wait: 2600, expect: { 1: 1, 2: 0 }, msg: 'A los 2,8 s de pulsar Marcha' },
          { wait: 500, expect: { 1: 0, 2: 1 }, msg: 'A los 3,3 s de pulsar Marcha' },
          { wait: 2000, expect: { 1: 0, 2: 1 }, msg: 'Con la cinta andando' },
          { press: 2, expect: { 1: 0, 2: 0 } },
          { wait: 4000, expect: { 1: 0, 2: 0 }, msg: 'Después de parar' },
          { press: 1, expect: { 1: 1, 2: 0 } },
          { wait: 1000 },
          { press: 2, expect: { 1: 0, 2: 0 }, msg: 'Al parar mientras suena la bocina' },
          { wait: 4000, expect: { 1: 0, 2: 0 }, msg: 'Después de parar (la cinta no tiene que arrancar sola)' },
        ],
      ],
    },
  },
  {
    id: 'cajas',
    n: 7,
    title: 'Contador de cajas',
    text: 'Un sensor (I1) da un pulso por cada caja que pasa. Cuando pasaron 5 cajas se prende la lámpara "caja llena". El operario la apaga y empieza de nuevo con el pulsador Reset (I2).',
    io: {
      I: { 1: { dev: 'NA', label: 'Sensor cajas' }, 2: { dev: 'NA', label: 'Reset' } },
      Q: { 1: { kind: 'lampara', label: 'Caja llena', color: VERDE } },
    },
    tests: {
      sequences: [
        [
          { expect: { 1: 0 }, msg: 'Al arrancar' },
          { press: 1 },
          { press: 1 },
          { press: 1 },
          { press: 1, expect: { 1: 0 }, msg: 'Después de 4 cajas' },
          { press: 1, expect: { 1: 1 }, msg: 'Después de 5 cajas' },
          { press: 1, expect: { 1: 1 }, msg: 'Después de 6 cajas' },
          { press: 2, expect: { 1: 0 } },
          { press: 1 },
          { press: 1 },
          { press: 1 },
          { press: 1, expect: { 1: 0 }, msg: 'Después del reset y 4 cajas' },
          { press: 1, expect: { 1: 1 }, msg: 'Después del reset y 5 cajas' },
        ],
      ],
    },
  },
  {
    id: 'peatonal',
    n: 8,
    title: 'Semáforo peatonal a pedido',
    text: 'Normalmente los autos tienen verde (Q1). Cuando un peatón aprieta el botón: amarillo para los autos durante 2 s (Q2), después rojo para los autos (Q3) y verde para el peatón (Q4) durante 5 s, y vuelve todo a la normalidad.',
    io: {
      I: { 1: { dev: 'NA', label: 'Botón peatón' } },
      Q: {
        1: { kind: 'lampara', label: 'Verde autos', color: VERDE },
        2: { kind: 'lampara', label: 'Amarillo autos', color: AMARILLO },
        3: { kind: 'lampara', label: 'Rojo autos', color: ROJO },
        4: { kind: 'lampara', label: 'Verde peatón', color: VERDE },
      },
    },
    tests: {
      sequences: [
        [
          { wait: 500, expect: { 1: 1, 2: 0, 3: 0, 4: 0 }, msg: 'Sin peatones' },
          { press: 1, expect: { 1: 0, 2: 1, 3: 0, 4: 0 } },
          { wait: 1600, expect: { 1: 0, 2: 1, 3: 0, 4: 0 }, msg: 'A los 1,8 s del pedido' },
          { wait: 400, expect: { 1: 0, 2: 0, 3: 1, 4: 1 }, msg: 'A los 2,2 s del pedido' },
          { wait: 4600, expect: { 1: 0, 2: 0, 3: 1, 4: 1 }, msg: 'A los 6,8 s del pedido' },
          { wait: 400, expect: { 1: 1, 2: 0, 3: 0, 4: 0 }, msg: 'A los 7,2 s del pedido (vuelve a la normalidad)' },
          { wait: 3000, expect: { 1: 1, 2: 0, 3: 0, 4: 0 }, msg: 'Un rato después' },
          { press: 1, expect: { 1: 0, 2: 1 }, msg: 'Con un segundo pedido' },
        ],
      ],
    },
  },
]

export const getLevel = (id: string) => LOGO_LEVELS.find((l) => l.id === id)
