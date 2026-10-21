import { createContext, useContext } from 'react'
import type { ComponentDef } from '../catalog/types'
import type { Topic } from '../data/theory'
import type { GameDef } from '../games/registry'

/** Contenido de un taller: lo usan las páginas comunes (componentes, teoría, juegos, ranking). */
export interface SubjectContent {
  catalog: ComponentDef[]
  topics: Topic[]
  games: GameDef[]
  /** menú del taller */
  nav: { to: string; label: string; end?: boolean }[]
  /** títulos de las páginas comunes */
  labels?: { components?: string; componentsLead?: string; componentsBack?: string }
}

export const SubjectContext = createContext<SubjectContent | null>(null)

export function useSubject(): SubjectContent {
  const s = useContext(SubjectContext)
  if (!s) throw new Error('Página fuera de un taller')
  return s
}
