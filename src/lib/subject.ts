import { createContext, useContext, type ReactNode } from 'react'
import type { ComponentDef } from '../catalog/types'
import type { Topic } from '../data/theory'
import type { GameDef } from '../games/registry'
import type { Activity } from '../catalog/types'

/** Sección de la guía de ejercicios de un taller. */
export interface GuideSection {
  id: string
  title: string
  intro?: ReactNode
  activities: Activity[]
}

/** Contenido de un taller: lo usan las páginas comunes (componentes, teoría, actividades, juegos). */
export interface SubjectContent {
  catalog: ComponentDef[]
  topics: Topic[]
  games: GameDef[]
  /** guía de ejercicios (página «Guía», ruta /ejercicios) */
  guide?: GuideSection[]
  /** menú del taller */
  nav: { to: string; label: string; end?: boolean }[]
  /** títulos de las páginas comunes */
  labels?: { components?: string; componentsLead?: string; componentsBack?: string; guideLead?: string }
}

export const SubjectContext = createContext<SubjectContent | null>(null)

export function useSubject(): SubjectContent {
  const s = useContext(SubjectContext)
  if (!s) throw new Error('Página fuera de un taller')
  return s
}
