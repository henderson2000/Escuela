// Progreso, intentos de juego y lamparitas. Todo queda guardado en el navegador de cada computadora:
// no hay inicio de sesión ni servidor.
//
// Cada juego/nivel se puede jugar por puntos MAX_ATTEMPTS veces en cada computadora. Un intento cuenta
// desde que empieza (si se abandona, queda con 0) y se guarda el mejor. Siempre se puede practicar sin sumar.

import { useSyncExternalStore } from 'react'
import { MAX_ATTEMPTS, MAX_POINTS } from './config'

export interface Attempt {
  id: string
  game: string
  /** nivel dentro del juego ('' si el juego no tiene niveles) */
  level: string
  /** null mientras el intento está en curso o si se abandonó */
  points: number | null
  startedAt: number
}

export interface BulbMove {
  at: number
  delta: number
  label: string
}

export interface State {
  attempts: Attempt[]
  /** actividades, lecciones y ejercicios: id -> resuelto (false = lo intentó y falló) */
  done: Record<string, boolean>
  /** 💡 lamparitas disponibles para comprar pistas */
  bulbs: number
  /** cosas que ya dieron lamparitas (cada una paga una sola vez) */
  rewarded: Record<string, boolean>
  /** pistas y soluciones ya compradas */
  owned: Record<string, boolean>
  /** últimos movimientos de lamparitas */
  bulbLog: BulbMove[]
}

const KEY = 'escuela-electronica-v2'
const empty: State = { attempts: [], done: {}, bulbs: 0, rewarded: {}, owned: {}, bulbLog: [] }

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

/** Arma un estado válido a partir de lo guardado (acepta el formato viejo, con jugadores). */
function sanitize(saved: unknown): State {
  if (!isObj(saved)) return empty
  // formato viejo: activities: { jugador: { actividad: true } }
  const done: Record<string, boolean> = {}
  const addDone = (m: unknown) => {
    if (!isObj(m)) return
    for (const [k, v] of Object.entries(m)) {
      if (v === true) done[k] = true
      else if (v === false && !(k in done)) done[k] = false
    }
  }
  if (isObj(saved.activities)) Object.values(saved.activities).forEach(addDone)
  addDone(saved.done)
  const attempts: Attempt[] = Array.isArray(saved.attempts)
    ? saved.attempts
        .filter((a): a is Record<string, unknown> => isObj(a) && typeof a.id === 'string' && typeof a.game === 'string')
        .map((a) => ({
          id: a.id as string,
          game: a.game as string,
          level: typeof a.level === 'string' ? a.level : '',
          points: typeof a.points === 'number' && Number.isFinite(a.points) ? a.points : null,
          startedAt: typeof a.startedAt === 'number' ? a.startedAt : 0,
        }))
    : []
  const flags = (v: unknown) => (isObj(v) ? Object.fromEntries(Object.entries(v).filter(([, x]) => x === true)) as Record<string, boolean> : {})
  const bulbs = typeof saved.bulbs === 'number' && Number.isFinite(saved.bulbs) ? Math.max(0, Math.floor(saved.bulbs)) : 0
  const bulbLog = Array.isArray(saved.bulbLog)
    ? saved.bulbLog.filter((m): m is BulbMove => isObj(m) && typeof m.delta === 'number' && typeof m.label === 'string').slice(0, 25)
    : []
  return { attempts, done, bulbs, rewarded: flags(saved.rewarded), owned: flags(saved.owned), bulbLog }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? sanitize(JSON.parse(raw)) : empty
  } catch {
    return empty
  }
}

let state: State = load()
const listeners = new Set<() => void>()

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // sin almacenamiento disponible (modo incógnito lleno, etc.): queda en memoria
  }
}

function set(patch: Partial<State>) {
  state = { ...state, ...patch }
  save()
  listeners.forEach((l) => l())
}

// si la plataforma está abierta en dos pestañas, las dos ven lo mismo
if (typeof window !== 'undefined')
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return
    state = e.newValue ? sanitize(safeParse(e.newValue)) : empty
    listeners.forEach((l) => l())
  })

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}

export function useStore(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

// ------------------------------------------------------------------ intentos

export function myAttempts(s: State, game: string, level = ''): Attempt[] {
  return s.attempts.filter((a) => a.game === game && a.level === level)
}

export function bestOf(attempts: Attempt[]): number {
  return attempts.reduce((m, a) => Math.max(m, a.points ?? 0), 0)
}

export function attemptsLeft(s: State, game: string, level = ''): number {
  return Math.max(0, MAX_ATTEMPTS - myAttempts(s, game, level).length)
}

/** Empieza un intento por puntos. Devuelve su id. */
export function startAttempt(game: string, level = ''): string {
  if (attemptsLeft(state, game, level) <= 0) throw new Error(`Ya se usaron los ${MAX_ATTEMPTS} intentos de este nivel en esta computadora.`)
  const a: Attempt = { id: uid(), game, level, points: null, startedAt: Date.now() }
  set({ attempts: [...state.attempts, a] })
  return a.id
}

/** Guarda el puntaje final de un intento (sólo una vez). */
export function finishAttempt(attemptId: string, points: number) {
  const a = state.attempts.find((x) => x.id === attemptId)
  if (!a || a.points !== null) return
  const clean = Math.max(0, Math.min(Math.round(points), MAX_POINTS[a.game] ?? 1000))
  set({ attempts: state.attempts.map((x) => (x.id === attemptId ? { ...x, points: clean } : x)) })
}

/** Mejor puntaje de un juego, sumando sus niveles. */
export function bestOfGame(s: State, game: string, levels: string[] = ['']): number {
  return levels.reduce((t, l) => t + bestOf(myAttempts(s, game, l)), 0)
}

// ------------------------------------------------------------------ actividades

/** ¿Está resuelta? (actividad, lección o ejercicio) */
export const isDone = (s: State, id: string) => s.done[id] === true

/**
 * Marca una actividad/lección como resuelta (o como fallada). La primera vez que se resuelve bien da
 * lamparitas, salvo que se haya comprado la solución. Una actividad que antes se respondió mal paga
 * menos (así no conviene probar opción por opción).
 */
export function markActivity(activityId: string, correct: boolean, reward = BULBS.actividad, label = 'Actividad resuelta') {
  const prev = state.done[activityId]
  if (prev === true) return
  if (!correct) {
    if (prev === undefined) set({ done: { ...state.done, [activityId]: false } })
    return
  }
  set({ done: { ...state.done, [activityId]: true } })
  if (state.owned[`sol:${activityId}`]) return
  const amount = prev === false && reward === BULBS.actividad ? BULBS.actividadReintento : reward
  earnBulbs(`act:${activityId}`, amount, prev === false && reward === BULBS.actividad ? `${label} (después de un error)` : label)
}

/* ------------------------------------------------------------------ 💡 lamparitas */

/** Valores de la economía de lamparitas. */
export const BULBS = {
  /** actividad acertada al primer intento */
  actividad: 5,
  /** actividad acertada después de haberse equivocado */
  actividadReintento: 2,
  leccion: 20,
  proyecto: 40,
  ejercicioLogo: 30,
  ejercicioMarcado: 10,
  /** juegos por puntos: 1 lamparita cada tantos puntos */
  puntosPorLamparita: 20,
  pista: 30,
  solucion: 100,
}

type BulbListener = (delta: number, label: string) => void
const bulbListeners = new Set<BulbListener>()
/** Para mostrar el cartelito "+20 💡". */
export function onBulbs(l: BulbListener) {
  bulbListeners.add(l)
  return () => {
    bulbListeners.delete(l)
  }
}

function logBulbs(delta: number, label: string) {
  const bulbLog = [{ at: Date.now(), delta, label }, ...state.bulbLog].slice(0, 25)
  set({ bulbs: Math.max(0, state.bulbs + delta), bulbLog })
  bulbListeners.forEach((l) => l(delta, label))
}

/** Suma lamparitas una sola vez por clave. */
export function earnBulbs(key: string, amount: number, label: string) {
  if (amount <= 0 || state.rewarded[key]) return
  set({ rewarded: { ...state.rewarded, [key]: true } })
  logBulbs(amount, label)
}

/** ¿Ya se compró esta pista/solución? */
export function owns(s: State, key: string) {
  return !!s.owned[key]
}

/** Compra algo (pista o solución). Devuelve false si no alcanzan las lamparitas. */
export function spendBulbs(key: string, amount: number, label: string): boolean {
  if (state.owned[key]) return true
  if (state.bulbs < amount) return false
  set({ owned: { ...state.owned, [key]: true } })
  logBulbs(-amount, label)
  return true
}

// ------------------------------------------------------------------ copia de seguridad

/** Todo el progreso de esta computadora en un texto (para pasarlo a otra o guardarlo). */
export function exportProgress(): string {
  return JSON.stringify({ app: 'its-villada-talleres', version: 1, savedAt: new Date().toISOString(), data: state }, null, 1)
}

/** Carga un progreso exportado. Devuelve un mensaje de error o null si salió bien. */
export function importProgress(text: string): string | null {
  const parsed = safeParse(text)
  if (!isObj(parsed) || parsed.app !== 'its-villada-talleres' || !isObj(parsed.data)) return 'El archivo no es un progreso de esta plataforma.'
  set(sanitize(parsed.data))
  return null
}

/** Borra todo el progreso de esta computadora. */
export function resetProgress() {
  set({ ...empty })
}

export function download(filename: string, text: string, mime = 'text/csv') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
