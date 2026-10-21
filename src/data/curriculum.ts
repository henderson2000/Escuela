// Estructura de la plataforma: año → rotación (taller) → contenido.
// Para sumar contenido a un taller nuevo, se marca `ready: true` y se le arman sus páginas.

export interface Subject {
  id: string
  name: string
  icon: string
  desc: string
  /** tiene contenido cargado */
  ready: boolean
}

export interface Rotation {
  n: number
  /** taller de esta rotación (null = todavía sin asignar) */
  subject: string | null
}

export interface Year {
  id: string
  short: string
  name: string
  rotations: Rotation[]
}

export const SUBJECTS: Record<string, Subject> = {
  electronica: {
    id: 'electronica',
    name: 'Electrónica',
    icon: '⚡',
    desc: 'Componentes en 3D, Arduino, teoría, actividades y juegos.',
    ready: true,
  },
  computacion: { id: 'computacion', name: 'Computación', icon: '💻', desc: 'Contenido en preparación.', ready: false },
  electricidad: { id: 'electricidad', name: 'Electricidad', icon: '🔌', desc: 'Contenido en preparación.', ready: false },
  torno: { id: 'torno', name: 'Torno', icon: '⚙️', desc: 'Contenido en preparación.', ready: false },
}

const empty = (): Rotation[] => [1, 2, 3, 4].map((n) => ({ n, subject: null }))

export const YEARS: Year[] = [
  { id: '1', short: '1ro', name: '1er año', rotations: empty() },
  { id: '2', short: '2do', name: '2do año', rotations: empty() },
  {
    id: '3',
    short: '3ro',
    name: '3er año',
    rotations: [
      { n: 1, subject: 'electronica' },
      { n: 2, subject: 'computacion' },
      { n: 3, subject: 'electricidad' },
      { n: 4, subject: 'torno' },
    ],
  },
]

export const getYear = (id?: string) => YEARS.find((y) => y.id === id)
