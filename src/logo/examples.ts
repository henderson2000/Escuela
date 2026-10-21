// Programas de ejemplo para el simulador libre.
import type { Block, BlockType, Program } from './engine'

interface Ex {
  id: string
  name: string
  desc: string
  build: () => Program
}

/** Arma un programa a partir de bloques ubicados en una grilla (col, fila). */
function make(io: Program['io'], items: [string, BlockType, number, number, Partial<Block>?][], wires: [string, string, number][]): Program {
  const blocks: Block[] = items.map(([id, type, col, row, extra]) => ({ id, type, x: 20 + col * 150, y: 20 + row * 70, ...extra }))
  return { blocks, wires: wires.map(([from, to, pin], i) => ({ id: `w${i}`, from, to, pin })), io }
}

export const EXAMPLES: Ex[] = [
  {
    id: 'vacio',
    name: 'Programa vacío',
    desc: 'Empezá de cero.',
    build: () => ({ blocks: [], wires: [], io: { I: {}, Q: {} } }),
  },
  {
    id: 'motor',
    name: 'Arranque de un motor',
    desc: 'Marcha (NA), parada (NC) y guardamotor (NC). Autorretención con la propia salida Q1. Lámpara verde funcionando y roja detenido.',
    build: () =>
      make(
        {
          I: { 1: { dev: 'NA', label: 'Marcha' }, 2: { dev: 'NC', label: 'Parada' }, 3: { dev: 'INT_NC', label: 'Guardamotor' } },
          Q: { 1: { kind: 'motor', label: 'Contactor KM1' }, 2: { kind: 'lampara', label: 'Verde: funciona', color: '#22c55e' }, 3: { kind: 'lampara', label: 'Roja: detenido', color: '#ef4444' } },
        },
        [
          ['i1', 'I', 0, 0, { n: 1 }],
          ['i2', 'I', 0, 2, { n: 2 }],
          ['i3', 'I', 0, 3, { n: 3 }],
          ['or', 'OR', 1, 0],
          ['and', 'AND', 2, 1],
          ['q1', 'Q', 3, 1, { n: 1 }],
          ['q2', 'Q', 4, 0, { n: 2 }],
          ['not', 'NOT', 3, 3],
          ['q3', 'Q', 4, 3, { n: 3 }],
        ],
        [
          ['i1', 'or', 0],
          ['q1', 'or', 1],
          ['or', 'and', 0],
          ['i2', 'and', 1],
          ['i3', 'and', 2],
          ['and', 'q1', 0],
          ['q1', 'q2', 0],
          ['q1', 'not', 0],
          ['not', 'q3', 0],
        ],
      ),
  },
  {
    id: 'minutero',
    name: 'Minutero de escalera',
    desc: 'Retardo a la desconexión: la luz queda prendida 30 s después de soltar el pulsador.',
    build: () =>
      make(
        { I: { 1: { dev: 'NA', label: 'Pulsador' } }, Q: { 1: { kind: 'lampara', label: 'Luz escalera' } } },
        [
          ['i1', 'I', 0, 1, { n: 1 }],
          ['tof', 'TOF', 1, 1, { params: { T: 30000 } }],
          ['q1', 'Q', 2, 1, { n: 1 }],
        ],
        [
          ['i1', 'tof', 0],
          ['tof', 'q1', 0],
        ],
      ),
  },
  {
    id: 'intermitente',
    name: 'Luz intermitente',
    desc: 'Generador de impulsos: mientras el interruptor está accionado, la baliza prende 0,5 s y apaga 0,5 s.',
    build: () =>
      make(
        { I: { 1: { dev: 'INT', label: 'Baliza' } }, Q: { 1: { kind: 'lampara', label: 'Baliza', color: '#f97316' } } },
        [
          ['i1', 'I', 0, 1, { n: 1 }],
          ['gen', 'GEN', 1, 1, { params: { TH: 500, TL: 500 } }],
          ['q1', 'Q', 2, 1, { n: 1 }],
        ],
        [
          ['i1', 'gen', 0],
          ['gen', 'q1', 0],
        ],
      ),
  },
  {
    id: 'semaforo',
    name: 'Semáforo',
    desc: 'Cadena de temporizadores: verde 5 s, verde + amarillo 2 s, rojo 6 s, y vuelve a empezar. Marcha y parada.',
    build: () =>
      make(
        {
          I: { 1: { dev: 'NA', label: 'Marcha' }, 2: { dev: 'NA', label: 'Parada' } },
          Q: { 1: { kind: 'lampara', label: 'Verde', color: '#22c55e' }, 2: { kind: 'lampara', label: 'Amarillo', color: '#facc15' }, 3: { kind: 'lampara', label: 'Rojo', color: '#ef4444' } },
        },
        [
          ['i1', 'I', 0, 0, { n: 1 }],
          ['i2', 'I', 0, 1, { n: 2 }],
          ['rs', 'RS', 1, 0],
          ['n3', 'NOT', 1, 2],
          ['en', 'AND', 2, 0],
          ['t1', 'TON', 3, 1, { params: { T: 5000 } }],
          ['t2', 'TON', 4, 2, { params: { T: 2000 } }],
          ['t3', 'TON', 5, 3, { params: { T: 6000 } }],
          ['n2', 'NOT', 3, 3],
          ['gv', 'AND', 4, 0],
          ['ga', 'AND', 5, 1],
          ['q1', 'Q', 6, 0, { n: 1 }],
          ['q2', 'Q', 6, 1, { n: 2 }],
          ['q3', 'Q', 6, 2, { n: 3 }],
        ],
        [
          ['i1', 'rs', 0],
          ['i2', 'rs', 1],
          ['rs', 'en', 0],
          ['t3', 'n3', 0],
          ['n3', 'en', 1],
          ['en', 't1', 0],
          ['t1', 't2', 0],
          ['t2', 't3', 0],
          ['t2', 'n2', 0],
          ['en', 'gv', 0],
          ['n2', 'gv', 1],
          ['t1', 'ga', 0],
          ['n2', 'ga', 1],
          ['gv', 'q1', 0],
          ['ga', 'q2', 0],
          ['t2', 'q3', 0],
        ],
      ),
  },
]
