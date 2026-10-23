import type { ComponentType } from 'react'
import type { SubjectContent } from '../lib/subject'
import { loadModule } from '../lib/lazy'

/** Contenido completo de un taller (se descarga al entrar). */
export interface SubjectEntry extends SubjectContent {
  Home: ComponentType
  /** páginas propias del taller, además de las comunes (componentes, teoría, actividades, juegos) */
  routes?: { path: string; Page: ComponentType }[]
  /** grupos propios para la página de progreso (además de actividades y juegos) */
  progress?: { label: string; ids: string[] }[]
}

type NavItem = SubjectContent['nav'][number]

/** Lo liviano de cada taller: su menú (se muestra antes de descargar el contenido). */
export const SUBJECT_NAV: Record<string, NavItem[]> = {
  '3/electronica': [
    { to: '', label: 'Inicio del taller', end: true },
    { to: '/componentes', label: 'Componentes 3D' },
    { to: '/teoria', label: 'Teoría' },
    { to: '/actividades', label: 'Actividades' },
    { to: '/juegos', label: 'Juegos' },
  ],
  '3/electricidad': [
    { to: '', label: 'Inicio del taller', end: true },
    { to: '/componentes', label: 'LOGO! 3D' },
    { to: '/teoria', label: 'Teoría' },
    { to: '/simulador', label: 'Simulador' },
    { to: '/guia', label: 'Guía' },
    { to: '/juegos', label: 'Juegos' },
  ],
  '3/computacion': [
    { to: '', label: 'Inicio del taller', end: true },
    { to: '/curso/html', label: 'HTML' },
    { to: '/curso/js', label: 'JavaScript' },
    { to: '/taller-libre', label: 'Taller libre' },
    { to: '/juegos', label: 'Juegos' },
  ],
  '3/torno': [
    { to: '', label: 'Inicio del taller', end: true },
    { to: '/componentes', label: 'Torno 3D' },
    { to: '/teoria', label: 'Teoría' },
    { to: '/ejercicios', label: 'Guía' },
    { to: '/juegos', label: 'Juegos' },
  ],
}

// 1er año
SUBJECT_NAV['1/electricidad'] = [
  { to: '', label: 'Inicio del taller', end: true },
  { to: '/componentes', label: 'En 3D' },
  { to: '/teoria', label: 'Teoría' },
  { to: '/ejercicios', label: 'Guía' },
  { to: '/juegos', label: 'Juegos' },
]

SUBJECT_NAV['1/computacion'] = [
  { to: '', label: 'Inicio del taller', end: true },
  { to: '/componentes', label: 'En 3D' },
  { to: '/teoria', label: 'Teoría' },
  { to: '/bloques', label: 'Bloques' },
  { to: '/juegos', label: 'Juegos' },
]

SUBJECT_NAV['1/ajuste'] = [
  { to: '', label: 'Inicio del taller', end: true },
  { to: '/componentes', label: 'En 3D' },
  { to: '/teoria', label: 'Teoría' },
  { to: '/ejercicios', label: 'Guía' },
  { to: '/juegos', label: 'Juegos' },
]

SUBJECT_NAV['1/hojalateria'] = [
  { to: '', label: 'Inicio del taller', end: true },
  { to: '/componentes', label: 'En 3D' },
  { to: '/teoria', label: 'Teoría' },
  { to: '/ejercicios', label: 'Guía' },
  { to: '/juegos', label: 'Juegos' },
]

// 2do año
SUBJECT_NAV['2/electricidad'] = [
  { to: '', label: 'Inicio del taller', end: true },
  { to: '/componentes', label: 'En 3D' },
  { to: '/teoria', label: 'Teoría' },
  { to: '/ejercicios', label: 'Guía' },
  { to: '/juegos', label: 'Juegos' },
]

SUBJECT_NAV['2/computacion'] = [
  { to: '', label: 'Inicio del taller', end: true },
  { to: '/componentes', label: 'En 3D' },
  { to: '/teoria', label: 'Teoría' },
  { to: '/pseudocodigo', label: 'Pseudocódigo' },
  { to: '/juegos', label: 'Juegos' },
]

SUBJECT_NAV['2/soldadura'] = [
  { to: '', label: 'Inicio del taller', end: true },
  { to: '/componentes', label: 'En 3D' },
  { to: '/teoria', label: 'Teoría' },
  { to: '/ejercicios', label: 'Guía' },
  { to: '/juegos', label: 'Juegos' },
]

const LOADERS: Record<string, () => Promise<{ default: Omit<SubjectEntry, 'nav'> }>> = {
  '1/electricidad': () => import('./electricidad-1'),
  '1/computacion': () => import('./computacion-1'),
  '1/ajuste': () => import('./ajuste-1'),
  '1/hojalateria': () => import('./hojalateria-1'),
  '2/electricidad': () => import('./electricidad-2'),
  '2/computacion': () => import('./computacion-2'),
  '2/soldadura': () => import('./soldadura-2'),
  '3/electronica': () => import('./electronica'),
  '3/electricidad': () => import('./electricidad'),
  '3/computacion': () => import('./computacion'),
  '3/torno': () => import('./torno'),
}

export const subjectKey = (anio?: string, materia?: string) => `${anio}/${materia}`
export const hasSubjectContent = (anio?: string, materia?: string) => subjectKey(anio, materia) in LOADERS

const cache = new Map<string, Promise<SubjectEntry>>()

/** Descarga (una sola vez) el contenido de un taller. */
export function loadSubject(key: string): Promise<SubjectEntry> {
  let p = cache.get(key)
  if (!p) {
    p = loadModule(LOADERS[key]).then((m) => ({ ...m.default, nav: SUBJECT_NAV[key] }))
    // si falla, que se pueda reintentar
    p.catch(() => cache.delete(key))
    cache.set(key, p)
  }
  return p
}

/** Todos los talleres con contenido (para la página de progreso). */
export const SUBJECT_KEYS = Object.keys(LOADERS)
