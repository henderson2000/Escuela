// Desafíos con puntos (juego "Desafíos de código"): HTML y JavaScript.
import type { Lesson } from './types'
import { WEB_CHALLENGES } from './challenges-web'
import { JS_CHALLENGES } from './challenges-js'

/** todos los desafíos, alternando HTML y JavaScript */
export const CHALLENGES: Lesson[] = (() => {
  const a: Lesson[] = WEB_CHALLENGES
  const b: Lesson[] = JS_CHALLENGES
  const out: Lesson[] = []
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (b[i]) out.push(b[i])
    if (a[i]) out.push(a[i])
  }
  return out
})()
