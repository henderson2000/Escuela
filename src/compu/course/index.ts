import type { Lesson, Track } from '../types'
import { HTML_TRACK } from './html'
import { CSS_TRACK } from './css'
import { JAVA_TRACK } from './java'

export const TRACKS: Track[] = [HTML_TRACK, CSS_TRACK, JAVA_TRACK]

export const getTrack = (id?: string) => TRACKS.find((t) => t.id === id)

/** todas las lecciones de un recorrido, en orden */
export const lessonsOf = (t: Track): Lesson[] => t.modules.flatMap((m) => m.lessons)

export function findLesson(id?: string): { track: Track; lesson: Lesson; index: number; all: Lesson[] } | null {
  for (const track of TRACKS) {
    const all = lessonsOf(track)
    const index = all.findIndex((l) => l.id === id)
    if (index >= 0) return { track, lesson: all[index], index, all }
  }
  return null
}

export const lessonActivityId = (id: string) => `compu-${id}`
