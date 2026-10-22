// Estructura de la plataforma: año → rotación (taller) → contenido.
// Para habilitar el contenido de un taller en un año, se pone `ready: true` en esa rotación
// y se le arman sus páginas (ver SubjectLayout en src/pages/Structure.tsx).

export interface Subject {
  id: string
  name: string
  icon: string
}

export interface Rotation {
  n: number
  /** taller de esta rotación (null = todavía sin asignar) */
  subject: string | null
  /** el taller ya tiene contenido cargado para este año */
  ready?: boolean
  /** descripción que se ve en la tarjeta cuando hay contenido */
  desc?: string
}

export interface Year {
  id: string
  short: string
  name: string
  rotations: Rotation[]
}

export const SUBJECTS: Record<string, Subject> = {
  electronica: { id: 'electronica', name: 'Electrónica', icon: '⚡' },
  computacion: { id: 'computacion', name: 'Computación', icon: '💻' },
  electricidad: { id: 'electricidad', name: 'Electricidad', icon: '🔌' },
  torno: { id: 'torno', name: 'Torno', icon: '⚙️' },
  hojalateria: { id: 'hojalateria', name: 'Hojalatería', icon: '🔨' },
  ajuste: { id: 'ajuste', name: 'Ajuste', icon: '🔧' },
  soldadura: { id: 'soldadura', name: 'Soldadura', icon: '🔥' },
}

const rot = (...subjects: string[]): Rotation[] => subjects.map((subject, i) => ({ n: i + 1, subject }))

export const YEARS: Year[] = [
  { id: '1', short: '1ro', name: '1er año', rotations: rot('electricidad', 'computacion', 'hojalateria', 'ajuste') },
  { id: '2', short: '2do', name: '2do año', rotations: rot('electronica', 'computacion', 'electricidad', 'soldadura') },
  {
    id: '3',
    short: '3ro',
    name: '3er año',
    rotations: [
      { n: 1, subject: 'electronica', ready: true, desc: 'Componentes en 3D, Arduino, teoría, actividades y juegos.' },
      { n: 2, subject: 'computacion', ready: true, desc: 'HTML y JavaScript básico con editor, vista previa en vivo y corrección automática.' },
      { n: 3, subject: 'electricidad', ready: true, desc: 'Automatización con LOGO!: simulador, guía de ejercicios, teoría y juegos.' },
      { n: 4, subject: 'torno', ready: true, desc: 'Torno paralelo en 3D, accesorios y herramientas, teoría del apunte, guía de cálculos y juegos.' },
    ],
  },
]

export const getYear = (id?: string) => YEARS.find((y) => y.id === id)

/** La rotación de un taller en un año (undefined si ese año no tiene ese taller). */
export const getRotation = (yearId?: string, subjectId?: string) =>
  getYear(yearId)?.rotations.find((r) => r.subject === subjectId)
