// Guía de ejercitación LOGO! (3er año, Electricidad).
// Los enunciados siguen la guía del taller. Donde la guía numera desde 0 (I0, Q0), acá se usa
// la numeración del LOGO! (I1, Q1).

import { newId, type Block, type InputConf, type OutputConf, type Program, type TestSpec } from './engine'

export interface Exercise {
  id: string
  n: number
  title: string
  /** enunciado (párrafos separados por \n) */
  text: string
  io: { I: Record<number, InputConf>; Q: Record<number, OutputConf> }
  /** corrección automática del programa */
  tests?: TestSpec
  /** además hay que completar la tabla de la verdad de esta salida */
  table?: { inputs: number[]; output: number; f: (v: Record<number, number>) => number }
  /** diagrama de tiempos de la guía (para mostrarlo) */
  diagram?: { label: string; pulses: [number, number][] }[]
  /** duración total del diagrama (en unidades arbitrarias) */
  diagramLen?: number
  hint?: string
}

/* ------------------------------------------------------------------ atajos */

const NA = (label = ''): InputConf => ({ dev: 'NA', label })
const NC = (label = ''): InputConf => ({ dev: 'NC', label })
const INT = (label = ''): InputConf => ({ dev: 'INT', label })
const RET = (label = ''): InputConf => ({ dev: 'INT_NC', label })
const L = (label = '', color?: string): OutputConf => ({ kind: 'lampara', label, color })
const M = (label = ''): OutputConf => ({ kind: 'motor', label })

const VERDE = '#22c55e'
const ROJO = '#ef4444'
const AMARILLO = '#facc15'

/** salidas esperadas iguales para varias Q */
const all = (qs: number[], v: 0 | 1) => Object.fromEntries(qs.map((q) => [q, v])) as Record<number, 0 | 1>

/** Programa inicial: bornes del ejercicio a la izquierda (entradas) y a la derecha (salidas). */
export function startProgram(io: Exercise['io']): Program {
  const blocks: Block[] = []
  const ins = Object.keys(io.I).map(Number).sort((a, b) => a - b)
  const outs = Object.keys(io.Q).map(Number).sort((a, b) => a - b)
  ins.forEach((n, i) => blocks.push({ id: newId('i'), type: 'I', n, x: 20, y: 20 + i * 70, locked: true }))
  outs.forEach((n, i) => blocks.push({ id: newId('q'), type: 'Q', n, x: 520, y: 20 + i * 70, locked: true }))
  return { blocks, wires: [], io: JSON.parse(JSON.stringify(io)) }
}

/* ------------------------------------------------------------------ ejercicios */

export const EXERCISES: Exercise[] = [
  {
    id: 'g1',
    n: 1,
    title: 'Entrada directa con pulsador',
    text: 'Conectar una entrada con una salida en el programa. La entrada tiene que ser un pulsador NA.',
    io: { I: { 1: NA('Pulsador') }, Q: { 1: L('Lámpara') } },
    tests: { truth: { inputs: [1], outputs: { 1: (v) => v[1] } } },
    hint: 'Uní el pin de salida de I1 con la entrada de Q1. Probá: mientras apretás, la lámpara prende.',
  },
  {
    id: 'g2',
    n: 2,
    title: 'Entrada directa con interruptor',
    text: 'Conectar una entrada con una salida en el programa. La entrada tiene que ser un interruptor.',
    io: { I: { 1: INT('Interruptor') }, Q: { 1: L('Lámpara') } },
    tests: { truth: { inputs: [1], outputs: { 1: (v) => v[1] } } },
    hint: '¿Notás la diferencia con el ejercicio 1? El interruptor queda en la posición en que lo dejás.',
  },
  {
    id: 'g3',
    n: 3,
    title: 'Una entrada, dos salidas',
    text: 'Conectar una entrada con dos salidas en el programa: I1, Q1 y Q2.',
    io: { I: { 1: INT('Interruptor') }, Q: { 1: L('Lámpara 1'), 2: L('Lámpara 2') } },
    tests: { truth: { inputs: [1], outputs: { 1: (v) => v[1], 2: (v) => v[1] } } },
    hint: 'De una misma salida pueden salir varios cables.',
  },
  {
    id: 'g4',
    n: 4,
    title: 'Compuerta O',
    text: 'Realizar el circuito con la compuerta "O" (OR): la lámpara Q1 prende con I1 o con I2.',
    io: { I: { 1: INT('I1'), 2: INT('I2') }, Q: { 1: L('Lámpara') } },
    tests: { truth: { inputs: [1, 2], outputs: { 1: (v) => v[1] | v[2] } } },
  },
  {
    id: 'g5',
    n: 5,
    title: 'Compuerta Y',
    text: 'Realizar el circuito con la compuerta "Y" (AND): la lámpara Q1 prende sólo con I1 e I2 accionadas.',
    io: { I: { 1: INT('I1'), 2: INT('I2') }, Q: { 1: L('Lámpara') } },
    tests: { truth: { inputs: [1, 2], outputs: { 1: (v) => v[1] & v[2] } } },
  },
  {
    id: 'g6',
    n: 6,
    title: 'Compuerta NOT',
    text: 'Realizar el circuito con la compuerta "NOT": la lámpara Q1 está prendida cuando I1 NO está accionada.',
    io: { I: { 1: INT('I1') }, Q: { 1: L('Lámpara') } },
    tests: { truth: { inputs: [1], outputs: { 1: (v) => 1 - v[1] } } },
  },
  {
    id: 'g7',
    n: 7,
    title: 'Combinar O con NOT',
    text: 'Combinar la operación lógica "O" con la "NOT": la lámpara Q1 tiene que estar prendida sólo cuando ninguna de las dos entradas está accionada.\nQ1 = NOT (I1 + I2)',
    io: { I: { 1: INT('I1'), 2: INT('I2') }, Q: { 1: L('Lámpara') } },
    tests: { truth: { inputs: [1, 2], outputs: { 1: (v) => 1 - (v[1] | v[2]) } } },
    hint: 'Primero la O y después la negación. (Es lo mismo que una NOR.)',
  },
  {
    id: 'g8',
    n: 8,
    title: 'Combinar Y con O',
    text: 'Combinar la operación lógica "Y" con la "O":\nQ1 = (I1 + I2) × I3',
    io: { I: { 1: INT('I1'), 2: INT('I2'), 3: INT('I3') }, Q: { 1: L('Lámpara') } },
    tests: { truth: { inputs: [1, 2, 3], outputs: { 1: (v) => (v[1] | v[2]) & v[3] } } },
  },
  {
    id: 'g9',
    n: 9,
    title: 'Esquema de funciones con tabla',
    text: 'Representar el siguiente esquema de funciones y realizar la tabla de la verdad:\nI3 × I4 × I5 × I6 = Q3',
    io: { I: { 3: INT('I3'), 4: INT('I4'), 5: INT('I5'), 6: INT('I6') }, Q: { 3: L('Q3') } },
    tests: { truth: { inputs: [3, 4, 5, 6], outputs: { 3: (v) => v[3] & v[4] & v[5] & v[6] } } },
    table: { inputs: [3, 4, 5, 6], output: 3, f: (v) => v[3] & v[4] & v[5] & v[6] },
    hint: 'Un solo bloque AND tiene 4 entradas.',
  },
  {
    id: 'g10',
    n: 10,
    title: 'Esquema de funciones con tabla (2)',
    text: 'Representar el siguiente esquema de funciones y realizar la tabla de la verdad:\n(I1 + I2) × I3 × I4 = Q1',
    io: { I: { 1: INT('I1'), 2: INT('I2'), 3: INT('I3'), 4: INT('I4') }, Q: { 1: L('Q1') } },
    tests: { truth: { inputs: [1, 2, 3, 4], outputs: { 1: (v) => (v[1] | v[2]) & v[3] & v[4] } } },
    table: { inputs: [1, 2, 3, 4], output: 1, f: (v) => (v[1] | v[2]) & v[3] & v[4] },
  },
  {
    id: 'g11',
    n: 11,
    title: 'Esquema de funciones (3)',
    text: 'Representar el siguiente esquema de funciones:\n(I1 + I2) × I3 × (I4 + I5) = Q6',
    io: { I: { 1: INT('I1'), 2: INT('I2'), 3: INT('I3'), 4: INT('I4'), 5: INT('I5') }, Q: { 6: L('Q6') } },
    tests: { truth: { inputs: [1, 2, 3, 4, 5], outputs: { 6: (v) => (v[1] | v[2]) & v[3] & (v[4] | v[5]) } } },
  },
  {
    id: 'g12',
    n: 12,
    title: 'Encender con un pulsador y apagar con otro',
    text: 'Una lámpara se debe encender con un pulsador y apagar con otro pulsador: una salida (Q1) debe activarse mediante una entrada (I1) y se debe desactivar con otra entrada (I2).',
    io: { I: { 1: NA('Encender'), 2: NA('Apagar') }, Q: { 1: L('Lámpara') } },
    tests: {
      sequences: [
        [
          { expect: { 1: 0 }, msg: 'Al arrancar' },
          { press: 1, expect: { 1: 1 } },
          { wait: 1000, expect: { 1: 1 }, msg: 'Un segundo después de soltar I1 (tiene que quedar prendida)' },
          { press: 2, expect: { 1: 0 } },
          { press: 2, expect: { 1: 0 } },
          { press: 1, expect: { 1: 1 } },
        ],
      ],
    },
    hint: 'Necesitás que la salida "se acuerde": autorretención (OR con la propia Q1) o el bloque RS.',
  },
  {
    id: 'g13',
    n: 13,
    title: 'Cuatro lámparas desde tres lugares',
    text: 'Se debe realizar el accionamiento de 4 lámparas desde 3 lugares diferentes: las salidas (Q1, Q2, Q3 y Q4) se activan y desactivan desde diferentes entradas (I1, I2 e I3). Cada pulsación cambia el estado de las lámparas.',
    io: { I: { 1: NA('Lugar 1'), 2: NA('Lugar 2'), 3: NA('Lugar 3') }, Q: { 1: L('Lámpara 1'), 2: L('Lámpara 2'), 3: L('Lámpara 3'), 4: L('Lámpara 4') } },
    tests: {
      sequences: [
        [
          { expect: all([1, 2, 3, 4], 0), msg: 'Al arrancar' },
          { press: 1, expect: all([1, 2, 3, 4], 1) },
          { press: 2, expect: all([1, 2, 3, 4], 0) },
          { press: 3, expect: all([1, 2, 3, 4], 1) },
          { press: 3, expect: all([1, 2, 3, 4], 0) },
          { press: 2, expect: all([1, 2, 3, 4], 1) },
          { press: 1, expect: all([1, 2, 3, 4], 0) },
        ],
      ],
    },
    hint: 'El relé de impulsos cambia de estado con cada pulso. ¿Cómo hacés para que cualquiera de los tres pulsadores le mande el pulso?',
  },
  {
    id: 'g14',
    n: 14,
    title: 'Activar todo y desactivar por grupos',
    text: 'Con un pulsador se activan todas las salidas y con otros se desactivan por grupos:\nI1 → activa todas las salidas (Q1 a Q6)\nI2 → desactiva Q1, Q3 y Q5\nI3 → desactiva Q2, Q4 y Q6, sólo si Q1, Q3 y Q5 están desactivadas',
    io: {
      I: { 1: NA('Activar todo'), 2: NA('Apagar impares'), 3: NA('Apagar pares') },
      Q: { 1: L('Q1'), 2: L('Q2'), 3: L('Q3'), 4: L('Q4'), 5: L('Q5'), 6: L('Q6') },
    },
    tests: {
      sequences: [
        [
          { expect: all([1, 2, 3, 4, 5, 6], 0), msg: 'Al arrancar' },
          { press: 1, expect: all([1, 2, 3, 4, 5, 6], 1) },
          { press: 3, expect: all([1, 2, 3, 4, 5, 6], 1), msg: 'Al pulsar I3 con Q1, Q3 y Q5 prendidas (no tiene que apagar nada)' },
          { press: 2, expect: { 1: 0, 3: 0, 5: 0, 2: 1, 4: 1, 6: 1 } },
          { press: 3, expect: all([1, 2, 3, 4, 5, 6], 0) },
          { press: 1, expect: all([1, 2, 3, 4, 5, 6], 1) },
        ],
      ],
    },
    hint: 'Usá un RS por grupo. La condición "sólo si…" se arma con una AND y una NOT.',
  },
  {
    id: 'g15',
    n: 15,
    title: 'Decodificador de 2 a 4 líneas',
    text: 'Realizar un decodificador de dos a cuatro líneas (I1 es el bit de mayor peso):\nI1 I2 → Q1 Q2 Q3 Q4\n0  0  → 1  0  0  0\n0  1  → 0  1  0  0\n1  0  → 0  0  1  0\n1  1  → 0  0  0  1',
    io: { I: { 1: INT('I1 (bit alto)'), 2: INT('I2 (bit bajo)') }, Q: { 1: L('Q1'), 2: L('Q2'), 3: L('Q3'), 4: L('Q4') } },
    tests: {
      truth: {
        inputs: [1, 2],
        outputs: {
          1: (v) => (1 - v[1]) & (1 - v[2]),
          2: (v) => (1 - v[1]) & v[2],
          3: (v) => v[1] & (1 - v[2]),
          4: (v) => v[1] & v[2],
        },
      },
    },
    hint: 'Cada salida es una AND de las entradas (o de sus negadas).',
  },
  {
    id: 'g16',
    n: 16,
    title: 'Arranque de dos motores con retardo',
    text: 'Realizar un programa que arranque dos motores cumpliendo el diagrama: al pulsar I1 arranca M1 (Q1) y 4 segundos después arranca M2 (Q2). Con I2 se detienen los dos.',
    io: { I: { 1: NA('Marcha'), 2: NA('Parada') }, Q: { 1: M('Motor M1'), 2: M('Motor M2') } },
    diagram: [
      { label: 'I1', pulses: [[1, 2]] },
      { label: 'Q1', pulses: [[1, 14]] },
      { label: 'Q2', pulses: [[5, 14]] },
      { label: 'I2', pulses: [[14, 15]] },
    ],
    diagramLen: 17,
    tests: {
      sequences: [
        [
          { expect: { 1: 0, 2: 0 }, msg: 'Al arrancar' },
          { press: 1, expect: { 1: 1, 2: 0 } },
          { wait: 3600, expect: { 2: 0 }, msg: 'A los 3,8 s de pulsar Marcha' },
          { wait: 400, expect: { 1: 1, 2: 1 }, msg: 'A los 4,2 s de pulsar Marcha' },
          { press: 2, expect: { 1: 0, 2: 0 } },
        ],
        [
          { press: 1 },
          { wait: 1000 },
          { press: 2, expect: { 1: 0, 2: 0 }, msg: 'Al parar antes de los 4 s' },
          { wait: 5000, expect: { 1: 0, 2: 0 }, msg: 'Después de parar (M2 no tiene que arrancar sola)' },
        ],
      ],
    },
    hint: 'Autorretención (o RS) para Q1 y un retardo a la conexión (TON) de 4 s alimentado por Q1.',
  },
  {
    id: 'g17',
    n: 17,
    title: 'Tres salidas en cascada',
    text: 'Realizar un programa que cumpla con el diagrama: con I1 se activa Q1; 3 s después Q2; 5 s después de Q2 se activa Q3. Con I2 se apaga todo.',
    io: { I: { 1: NA('Marcha'), 2: NA('Parada') }, Q: { 1: L('Q1'), 2: L('Q2'), 3: L('Q3') } },
    diagram: [
      { label: 'I1', pulses: [[1, 2]] },
      { label: 'Q1', pulses: [[1, 14]] },
      { label: 'Q2', pulses: [[4, 14]] },
      { label: 'Q3', pulses: [[9, 14]] },
      { label: 'I2', pulses: [[14, 15]] },
    ],
    diagramLen: 17,
    tests: {
      sequences: [
        [
          { press: 1, expect: { 1: 1, 2: 0, 3: 0 } },
          { wait: 2600, expect: { 2: 0 }, msg: 'A los 2,8 s' },
          { wait: 400, expect: { 2: 1, 3: 0 }, msg: 'A los 3,2 s' },
          { wait: 4600, expect: { 3: 0 }, msg: 'A los 7,8 s' },
          { wait: 400, expect: { 1: 1, 2: 1, 3: 1 }, msg: 'A los 8,2 s' },
          { press: 2, expect: { 1: 0, 2: 0, 3: 0 } },
        ],
      ],
    },
  },
  {
    id: 'g18',
    n: 18,
    title: 'Semáforo de cruce de calles',
    text: 'Realizar el control de un semáforo de cruce de calles siguiendo el diagrama (R = rojo, A = amarillo, V = verde de cada calle). I1 da la marcha e I2 la parada.\nTiempos sugeridos: verde 5 s, amarillo 2 s.',
    io: {
      I: { 1: NA('Marcha'), 2: NA('Parada') },
      Q: { 1: L('R1', ROJO), 2: L('A1', AMARILLO), 3: L('V1', VERDE), 4: L('R2', ROJO), 5: L('A2', AMARILLO), 6: L('V2', VERDE) },
    },
    diagram: [
      { label: 'I1', pulses: [[0, 1]] },
      { label: 'R1', pulses: [[1, 8], [15, 22]] },
      { label: 'A1', pulses: [[13, 15]] },
      { label: 'V1', pulses: [[8, 13], [22, 25]] },
      { label: 'R2', pulses: [[8, 15]] },
      { label: 'A2', pulses: [[6, 8], [20, 22]] },
      { label: 'V2', pulses: [[1, 6], [15, 20]] },
    ],
    diagramLen: 25,
    hint: 'Este ejercicio no tiene corrección automática: probalo en el simulador y mostráselo al profe.',
  },
  {
    id: 'g19',
    n: 19,
    title: 'Oscilador',
    text: 'Realizar con temporizadores un oscilador con un período de 0,5 s. Que oscile mientras el interruptor I1 esté accionado.',
    io: { I: { 1: INT('Habilitar') }, Q: { 1: L('Lámpara') } },
    tests: {
      sequences: [
        [
          { wait: 1000, expect: { 1: 0 }, msg: 'Con I1 sin accionar' },
          { set: { 1: true } },
          { edges: { q: 1, ms: 4000, min: 7, max: 9 }, msg: 'Con I1 accionada, en 4 s (período 0,5 s = 8 encendidas)' },
          { set: { 1: false }, wait: 800, expect: { 1: 0 }, msg: 'Al desactivar I1' },
        ],
      ],
    },
    hint: 'Período 0,5 s = 0,25 s prendido + 0,25 s apagado. Probá con el generador de impulsos o con dos TON que se realimentan.',
  },
  {
    id: 'g20',
    n: 20,
    title: 'Secuencia de luces ida y vuelta',
    text: 'Con las seis salidas realizar una secuencia de luces de izquierda a derecha y viceversa con un período de 2 s, que arranca con I1.',
    io: { I: { 1: NA('Marcha'), 2: NA('Parada') }, Q: { 1: L('Q1'), 2: L('Q2'), 3: L('Q3'), 4: L('Q4'), 5: L('Q5'), 6: L('Q6') } },
    diagram: [
      { label: 'I1', pulses: [[0, 1]] },
      { label: 'Q1', pulses: [[1, 2], [11, 12]] },
      { label: 'Q2', pulses: [[2, 3], [10, 11]] },
      { label: 'Q3', pulses: [[3, 4], [9, 10]] },
      { label: 'Q4', pulses: [[4, 5], [8, 9]] },
      { label: 'Q5', pulses: [[5, 6], [7, 8]] },
      { label: 'Q6', pulses: [[6, 7]] },
    ],
    diagramLen: 13,
    hint: 'Este ejercicio no tiene corrección automática. Pista: un contador que avanza con un generador de impulsos, o una cadena de temporizadores.',
  },
  {
    id: 'g21',
    n: 21,
    title: 'Iluminación de un pasillo',
    text: 'Realizar el comando de iluminación (seis lámparas) para un pasillo:\n• Se deben encender y apagar con un solo pulsador ubicado en cada extremo del pasillo (I1 e I2).\n• Un pulsador en el centro del pasillo (I3) apaga las tres primeras.\n• Otro pulsador ubicado en uno de los extremos (I4) apaga todas las luces.',
    io: {
      I: { 1: NA('Extremo A'), 2: NA('Extremo B'), 3: NA('Centro'), 4: NA('Apagar todo') },
      Q: { 1: L('L1'), 2: L('L2'), 3: L('L3'), 4: L('L4'), 5: L('L5'), 6: L('L6') },
    },
    tests: {
      sequences: [
        [
          { expect: all([1, 2, 3, 4, 5, 6], 0), msg: 'Al arrancar' },
          { press: 1, expect: all([1, 2, 3, 4, 5, 6], 1) },
          { press: 2, expect: all([1, 2, 3, 4, 5, 6], 0) },
          { press: 2, expect: all([1, 2, 3, 4, 5, 6], 1) },
          { press: 3, expect: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1, 6: 1 } },
          { press: 4, expect: all([1, 2, 3, 4, 5, 6], 0) },
          { press: 1, expect: all([1, 2, 3, 4, 5, 6], 1) },
          { press: 4, expect: all([1, 2, 3, 4, 5, 6], 0) },
        ],
      ],
    },
    hint: 'Dos relés de impulsos (uno por cada grupo de tres lámparas): Trg con I1 o I2, y R con lo que apaga cada grupo.',
  },
  {
    id: 'g22',
    n: 22,
    title: 'Inversión de giro de un MAT',
    text: 'Realizar la inversión del sentido de giro de un MAT (Motor Asincrónico Trifásico) con dos pulsadores:\n• Cada uno enciende un sentido de giro.\n• El paso de un sentido al otro puede ser directo.\n• Agregamos una parada (I3, pulsador NC).\nLos dos contactores NUNCA pueden estar activados a la vez (sería un cortocircuito entre fases).',
    io: { I: { 1: NA('Giro horario'), 2: NA('Giro antihorario'), 3: NC('Parada') }, Q: { 1: M('KM1 horario'), 2: M('KM2 antihorario') } },
    tests: {
      never: [[1, 2]],
      sequences: [
        [
          { expect: { 1: 0, 2: 0 }, msg: 'Al arrancar' },
          { press: 1, expect: { 1: 1, 2: 0 } },
          { press: 2, expect: { 1: 0, 2: 1 } },
          { press: 1, expect: { 1: 1, 2: 0 } },
          { press: 3, expect: { 1: 0, 2: 0 } },
          { press: 2, expect: { 1: 0, 2: 1 } },
          { press: 3, expect: { 1: 0, 2: 0 } },
        ],
      ],
    },
    hint: 'Cada pulsador hace SET de su sentido y RESET del otro. Ojo con la parada NC: en reposo da 1.',
  },
  {
    id: 'g23',
    n: 23,
    title: 'Lámpara desde dos lugares con marcha y parada',
    text: 'Accionamiento de una lámpara desde dos lugares diferentes, con la posibilidad de encender la luz desde un pulsador independiente y apagarla desde otro:\n• La salida Q1 se activa y desactiva desde I1 e I2 (cada pulso cambia el estado).\n• Q1 se activa siempre que se pulse el pulsador de activación I3.\n• Q1 se desactiva siempre que se pulse el pulsador de parada I4.',
    io: { I: { 1: NA('Lugar 1'), 2: NA('Lugar 2'), 3: NA('Encender'), 4: NA('Apagar') }, Q: { 1: L('Lámpara') } },
    tests: {
      sequences: [
        [
          { expect: { 1: 0 }, msg: 'Al arrancar' },
          { press: 1, expect: { 1: 1 } },
          { press: 2, expect: { 1: 0 } },
          { press: 2, expect: { 1: 1 } },
          { press: 3, expect: { 1: 1 }, msg: 'Al pulsar Encender con la luz prendida' },
          { press: 4, expect: { 1: 0 } },
          { press: 4, expect: { 1: 0 } },
          { press: 3, expect: { 1: 1 } },
          { press: 1, expect: { 1: 0 } },
        ],
      ],
    },
    hint: 'El relé de impulsos tiene las tres entradas que necesitás: Trg, S y R.',
  },
  {
    id: 'g24',
    n: 24,
    title: 'Extractor de baño',
    text: 'Cuando se enciende la iluminación (Q1) también se activa el extractor (Q2); cuando se apaga la iluminación, el extractor se mantiene activo durante el tiempo programado:\na. La salida Q1 se activa y desactiva mediante la entrada I1 (interruptor).\nb. Q2 se activa cuando se activa Q1 y se desactiva 10 min después de haberse desactivado Q1.',
    io: { I: { 1: INT('Interruptor luz') }, Q: { 1: L('Luz'), 2: M('Extractor') } },
    tests: {
      sequences: [
        [
          { expect: { 1: 0, 2: 0 }, msg: 'Al arrancar' },
          { set: { 1: true }, wait: 200, expect: { 1: 1, 2: 1 } },
          { wait: 60000, expect: { 1: 1, 2: 1 }, msg: 'Con la luz prendida 1 minuto' },
          { set: { 1: false }, wait: 200, expect: { 1: 0, 2: 1 } },
          { wait: 9 * 60000 + 59000, expect: { 2: 1 }, msg: 'A los 9 min 59 s de apagar la luz' },
          { wait: 2000, expect: { 1: 0, 2: 0 }, msg: 'A los 10 min 1 s de apagar la luz' },
        ],
      ],
    },
    hint: 'Retardo a la desconexión (TOF) con T = 600 s. En el simulador usá la velocidad ×60 para no esperar 10 minutos.',
  },
  {
    id: 'g25',
    n: 25,
    title: 'Arranque de un motor',
    text: 'Realizar el programa para arrancar un motor de acuerdo con las siguientes entradas y salidas:\nI1: hongo de seguridad NC · I2: pulsador de marcha NA · I3: contacto auxiliar NC del guardamotor · I4: pulsador de parada NC\nQ1: bobina contactor motor · Q2: lámpara verde funcionamiento · Q3: lámpara roja detenido',
    io: {
      I: { 1: RET('Hongo seguridad'), 2: NA('Marcha'), 3: RET('Guardamotor'), 4: NC('Parada') },
      Q: { 1: M('Contactor motor'), 2: L('Verde: funciona', VERDE), 3: L('Roja: detenido', ROJO) },
    },
    tests: motorTests(),
    hint: 'Los tres contactos NC (hongo, guardamotor, parada) dan 1 en reposo: van en serie (AND) con la autorretención.',
  },
  {
    id: 'g26',
    n: 26,
    title: 'Arranque de un motor con Set-Reset',
    text: 'Igual que el ejercicio 25, pero empleando la función Set-Reset (bloque RS).\nI1: hongo de seguridad NC · I2: marcha NA · I3: guardamotor NC · I4: parada NC\nQ1: contactor motor · Q2: lámpara verde · Q3: lámpara roja',
    io: {
      I: { 1: RET('Hongo seguridad'), 2: NA('Marcha'), 3: RET('Guardamotor'), 4: NC('Parada') },
      Q: { 1: M('Contactor motor'), 2: L('Verde: funciona', VERDE), 3: L('Roja: detenido', ROJO) },
    },
    tests: { ...motorTests(), requires: ['RS'] },
    hint: 'S = marcha. R = cualquiera de los NC abiertos: NOT hongo + NOT guardamotor + NOT parada (o una NAND).',
  },
  {
    id: 'g27',
    n: 27,
    title: 'Inversor de giro con señalización',
    text: 'Programa de mando de un inversor de giro:\nEntradas: I1 hongo NC · I2 marcha horario NA · I3 guardamotor NC · I4 parada NC · I6 marcha antihorario NA\nSalidas: Q1 contactor horario · Q2 lámpara verde (fija en horario, intermitente en antihorario) · Q3 lámpara roja detenido · Q4 contactor antihorario\nLos dos contactores nunca pueden estar activados a la vez.',
    io: {
      I: { 1: RET('Hongo seguridad'), 2: NA('Marcha horario'), 3: RET('Guardamotor'), 4: NC('Parada'), 6: NA('Marcha antihorario') },
      Q: { 1: M('KM1 horario'), 2: L('Verde', VERDE), 3: L('Roja: detenido', ROJO), 4: M('KM2 antihorario') },
    },
    tests: inverterTests(),
    hint: 'Para la intermitencia: generador de impulsos habilitado por Q4. Para el enclavamiento: cada marcha sólo actúa si el otro contactor está apagado.',
  },
  {
    id: 'g28',
    n: 28,
    title: 'Inversor de giro con Set-Reset',
    text: 'Igual que el ejercicio 27, pero empleando la función Set-Reset (bloques RS).',
    io: {
      I: { 1: RET('Hongo seguridad'), 2: NA('Marcha horario'), 3: RET('Guardamotor'), 4: NC('Parada'), 6: NA('Marcha antihorario') },
      Q: { 1: M('KM1 horario'), 2: L('Verde', VERDE), 3: L('Roja: detenido', ROJO), 4: M('KM2 antihorario') },
    },
    tests: { ...inverterTests(), requires: ['RS'] },
  },
  {
    id: 'g29',
    n: 29,
    title: 'Dos motores, una sola parada',
    text: 'Encender dos motores con dos pulsadores independientes (uno para cada motor). La parada de ambos motores se realiza con un solo pulsador (NC).',
    io: { I: { 1: NA('Marcha M1'), 2: NA('Marcha M2'), 3: NC('Parada') }, Q: { 1: M('Motor M1'), 2: M('Motor M2') } },
    tests: {
      sequences: [
        [
          { expect: { 1: 0, 2: 0 }, msg: 'Al arrancar' },
          { press: 1, expect: { 1: 1, 2: 0 } },
          { press: 2, expect: { 1: 1, 2: 1 } },
          { press: 3, expect: { 1: 0, 2: 0 } },
          { press: 2, expect: { 1: 0, 2: 1 } },
          { press: 3, expect: { 1: 0, 2: 0 } },
        ],
      ],
    },
  },
  {
    id: 'g30',
    n: 30,
    title: 'Bomba con un solo pulsador',
    text: 'Encender y apagar una bomba con un solo pulsador (I1). La bomba tiene un guardamotor de protección (contacto NC en I2) que, cuando hay una falla, la detiene y enciende una luz intermitente (Q2).',
    io: { I: { 1: NA('Pulsador'), 2: RET('Guardamotor') }, Q: { 1: M('Bomba'), 2: L('Luz de falla', ROJO) } },
    tests: {
      sequences: [
        [
          { expect: { 1: 0, 2: 0 }, msg: 'Al arrancar' },
          { press: 1, expect: { 1: 1, 2: 0 } },
          { press: 1, expect: { 1: 0, 2: 0 } },
          { press: 1, expect: { 1: 1 } },
          { set: { 2: true }, wait: 200, expect: { 1: 0 }, msg: 'Al saltar el guardamotor' },
          { blink: { q: [2], ms: 3000 }, msg: 'Con el guardamotor en falla' },
          { press: 1, expect: { 1: 0 }, msg: 'Al pulsar con el guardamotor en falla' },
          { set: { 2: false }, wait: 1500, expect: { 1: 0, 2: 0 }, msg: 'Al rearmar el guardamotor' },
          { press: 1, expect: { 1: 1 } },
        ],
      ],
    },
    hint: 'Relé de impulsos para la bomba (su R es la falla) y generador de impulsos para la luz.',
  },
  {
    id: 'g31',
    n: 31,
    title: 'Dos MAT con un solo pulsador',
    text: 'Encender dos MAT utilizando un pulsador (I1):\n• Con el primer pulso enciende el primer motor.\n• Con el segundo pulso enciende el segundo motor.\n• Con el tercer pulso se apagan ambos motores.\n• Un guardamotor (contacto NC en I2) protege ambos motores; cuando detecta una falla los detiene y activa una luz parpadeante (Q3).',
    io: { I: { 1: NA('Pulsador'), 2: RET('Guardamotor') }, Q: { 1: M('Motor 1'), 2: M('Motor 2'), 3: L('Luz de falla', ROJO) } },
    tests: {
      sequences: [
        [
          { expect: { 1: 0, 2: 0, 3: 0 }, msg: 'Al arrancar' },
          { press: 1, expect: { 1: 1, 2: 0 } },
          { press: 1, expect: { 1: 1, 2: 1 } },
          { press: 1, expect: { 1: 0, 2: 0 } },
          { press: 1, expect: { 1: 1, 2: 0 }, msg: 'Al empezar de nuevo (primer pulso)' },
          { set: { 2: true }, wait: 200, expect: { 1: 0, 2: 0 }, msg: 'Al saltar el guardamotor' },
          { blink: { q: [3], ms: 3000 }, msg: 'Con el guardamotor en falla' },
          { set: { 2: false }, wait: 1500, expect: { 1: 0, 2: 0, 3: 0 }, msg: 'Al rearmar el guardamotor' },
          { press: 1, expect: { 1: 1, 2: 0 }, msg: 'Primer pulso después de la falla' },
          { press: 1, expect: { 1: 1, 2: 1 } },
        ],
      ],
    },
    hint: 'Un contador (On = 1 para el motor 1, otro con On = 2 para el motor 2) y un reset cuando llega a 3 o hay falla.',
  },
  {
    id: 'g32',
    n: 32,
    title: 'Control de un semáforo',
    text: 'Un semáforo con tres lámparas: verde, amarilla y roja, y dos pulsadores: marcha (I1) y parada (I2). El ciclo comienza al accionar marcha y se repite hasta que se accione parada; en ese momento se apaga todo. Siempre que se active marcha, el sistema inicia con el verde.\nSecuencia: 1) Verde durante 5 s. 2) Verde + Amarillo durante 2 s. 3) Rojo durante 6 s.',
    io: { I: { 1: NA('Marcha'), 2: NA('Parada') }, Q: { 1: L('Verde', VERDE), 2: L('Amarillo', AMARILLO), 3: L('Rojo', ROJO) } },
    tests: {
      sequences: [
        [
          { expect: { 1: 0, 2: 0, 3: 0 }, msg: 'Al arrancar' },
          { press: 1, expect: { 1: 1, 2: 0, 3: 0 } },
          { wait: 4600, expect: { 1: 1, 2: 0, 3: 0 }, msg: 'A los 4,8 s' },
          { wait: 400, expect: { 1: 1, 2: 1, 3: 0 }, msg: 'A los 5,2 s (verde + amarillo)' },
          { wait: 1600, expect: { 1: 1, 2: 1, 3: 0 }, msg: 'A los 6,8 s' },
          { wait: 400, expect: { 1: 0, 2: 0, 3: 1 }, msg: 'A los 7,2 s (rojo)' },
          { wait: 5600, expect: { 1: 0, 2: 0, 3: 1 }, msg: 'A los 12,8 s' },
          { wait: 400, expect: { 1: 1, 2: 0, 3: 0 }, msg: 'A los 13,2 s (vuelve el verde)' },
          { wait: 5000, expect: { 1: 1, 2: 1, 3: 0 }, msg: 'A los 18,2 s (segundo ciclo, verde + amarillo)' },
          { press: 2, expect: { 1: 0, 2: 0, 3: 0 } },
          { wait: 3000, expect: { 1: 0, 2: 0, 3: 0 }, msg: 'Después de parar' },
        ],
        [
          { press: 1 },
          { wait: 8000, expect: { 3: 1 }, msg: 'A los 8 s (rojo)' },
          { press: 2, expect: { 1: 0, 2: 0, 3: 0 } },
          { press: 1, expect: { 1: 1, 2: 0, 3: 0 }, msg: 'Al volver a dar marcha (tiene que empezar en verde)' },
        ],
      ],
    },
    hint: 'Una cadena de TON: el primero cuenta 5 s, el segundo 2 s y el tercero 6 s; el último reinicia la cadena.',
  },
]

/* ------------------------------------------------------------------ pruebas compartidas */

function motorTests(): TestSpec {
  const off = { 1: 0, 2: 0, 3: 1 } as const
  const on = { 1: 1, 2: 1, 3: 0 } as const
  return {
    sequences: [
      [
        { expect: off, msg: 'Al arrancar (motor detenido, lámpara roja)' },
        { press: 2, expect: on },
        { wait: 1000, expect: on, msg: 'Un segundo después de soltar Marcha' },
        { press: 4, expect: off },
        { press: 2, expect: on },
        { set: { 1: true }, wait: 200, expect: off, msg: 'Al accionar el hongo de seguridad' },
        { press: 2, expect: off, msg: 'Al pulsar Marcha con el hongo accionado' },
        { set: { 1: false }, wait: 200, expect: off, msg: 'Al desenclavar el hongo (no tiene que arrancar solo)' },
        { press: 2, expect: on },
        { set: { 3: true }, wait: 200, expect: off, msg: 'Al saltar el guardamotor' },
        { press: 2, expect: off, msg: 'Al pulsar Marcha con el guardamotor en falla' },
        { set: { 3: false }, wait: 200, expect: off, msg: 'Al rearmar el guardamotor' },
        { press: 2, expect: on },
      ],
    ],
  }
}

function inverterTests(): TestSpec {
  return {
    never: [[1, 4]],
    sequences: [
      [
        { expect: { 1: 0, 4: 0, 2: 0, 3: 1 }, msg: 'Al arrancar' },
        { press: 2, expect: { 1: 1, 4: 0, 2: 1, 3: 0 } },
        { wait: 300, expect: { 2: 1 }, msg: 'Girando en sentido horario (verde fija)' },
        { wait: 400, expect: { 2: 1 }, msg: 'Girando en sentido horario (verde fija)' },
        { wait: 500, expect: { 2: 1 }, msg: 'Girando en sentido horario (verde fija)' },
        { press: 6 },
        { press: 4, expect: { 1: 0, 4: 0, 2: 0, 3: 1 } },
        { press: 6, expect: { 1: 0, 4: 1, 3: 0 } },
        { blink: { q: [2], ms: 3000 }, msg: 'Girando en sentido antihorario' },
        { press: 4, expect: { 1: 0, 4: 0, 2: 0, 3: 1 } },
        { press: 2, expect: { 1: 1, 4: 0 } },
        { set: { 1: true }, wait: 200, expect: { 1: 0, 4: 0, 3: 1 }, msg: 'Al accionar el hongo de seguridad' },
        { set: { 1: false }, wait: 200 },
        { press: 6, expect: { 4: 1 } },
        { set: { 3: true }, wait: 200, expect: { 1: 0, 4: 0, 3: 1 }, msg: 'Al saltar el guardamotor' },
      ],
    ],
  }
}

export const getExercise = (id: string) => EXERCISES.find((e) => e.id === id)
