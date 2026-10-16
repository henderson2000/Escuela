// Jugadores, intentos de juego, ranking y progreso de actividades.
//
// Dos modos:
//  - ONLINE (Supabase configurado): jugadores, intentos y ranking viven en el servidor y los
//    comparte todo el curso. El límite de intentos lo controla la base de datos.
//  - LOCAL: todo queda en el navegador de esta computadora (sirve para probar sin servidor).
//
// Cada alumno puede jugar por puntos MAX_ATTEMPTS veces cada juego/nivel. Un intento cuenta
// desde que empieza (si lo abandona, queda con 0). En el ranking suma su mejor intento de cada
// juego/nivel. Siempre se puede practicar sin sumar puntos.

import { useSyncExternalStore } from 'react'
import { MAX_ATTEMPTS, MAX_POINTS, ONLINE } from './config'
import { RemoteError, rpc, select } from './remote'

export interface Player {
  id: string
  name: string
  curso: string
}

export interface Attempt {
  id: string
  playerId: string
  game: string
  /** nivel dentro del juego ('' si el juego no tiene niveles) */
  level: string
  /** null mientras el intento está en curso o si se abandonó */
  points: number | null
  startedAt: number
}

export interface RankRow {
  player: Player
  points: number
  plays: number
  /** mejor puntaje por juego */
  byGame: Record<string, number>
}

interface State {
  /** jugador con la sesión abierta en esta computadora */
  me: Player | null
  /** jugadores que usaron esta computadora (para entrar rápido) */
  recent: Player[]
  /** modo local: todos los intentos; modo online: sólo los del jugador actual */
  attempts: Attempt[]
  /** modo local: todos los jugadores registrados */
  localPlayers: Player[]
  /** progreso de actividades: playerId -> activityId -> resuelta */
  activities: Record<string, Record<string, boolean>>
  ranking: RankRow[] | null
  rankingError: string | null
  busy: boolean
  /** modo online: ya se trajeron del servidor los intentos del jugador actual */
  synced: boolean
}

const KEY = 'escuela-electronica-v2'
const empty: State = {
  me: null,
  recent: [],
  attempts: [],
  localPlayers: [],
  activities: {},
  ranking: null,
  rankingError: null,
  busy: false,
  synced: !ONLINE,
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty
    const saved = JSON.parse(raw)
    // en modo online los intentos se piden de nuevo al servidor
    return { ...empty, ...saved, attempts: ONLINE ? [] : saved.attempts ?? [], ranking: null }
  } catch {
    return empty
  }
}

let state: State = load()
const listeners = new Set<() => void>()

function set(patch: Partial<State>) {
  state = { ...state, ...patch }
  try {
    const { ranking: _r, rankingError: _e, busy: _b, synced: _s, ...persist } = state
    localStorage.setItem(KEY, JSON.stringify(ONLINE ? { ...persist, attempts: [] } : persist))
  } catch {
    // sin almacenamiento disponible: queda en memoria
  }
  listeners.forEach((l) => l())
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
const norm = (s: string) => s.trim().replace(/\s+/g, ' ')
const keyOf = (name: string, curso: string) => `${norm(name).toLowerCase()}|${curso.replace(/\s/g, '').toLowerCase()}`

// ------------------------------------------------------------------ sesión

interface RemotePlayer {
  id: string
  name: string
  curso: string
}
interface RemoteAttempt {
  id: string
  player_id: string
  game: string
  level: string
  points: number | null
  started_at: string
}
const fromRemote = (a: RemoteAttempt): Attempt => ({
  id: a.id,
  playerId: a.player_id,
  game: a.game,
  level: a.level,
  points: a.points,
  startedAt: Date.parse(a.started_at),
})

export async function login(name: string, curso: string): Promise<Player> {
  name = norm(name)
  curso = norm(curso)
  let player: Player
  if (ONLINE) {
    set({ busy: true })
    try {
      const p = await rpc<RemotePlayer>('login', { p_name: name, p_curso: curso })
      player = { id: p.id, name: p.name, curso: p.curso }
    } finally {
      set({ busy: false })
    }
  } else {
    const found = state.localPlayers.find((p) => keyOf(p.name, p.curso) === keyOf(name, curso))
    player = found ?? { id: uid(), name, curso }
    if (!found) set({ localPlayers: [...state.localPlayers, player] })
  }
  const recent = [player, ...state.recent.filter((p) => p.id !== player.id)].slice(0, 30)
  set({ me: player, recent, attempts: ONLINE ? [] : state.attempts, synced: !ONLINE })
  if (ONLINE) await refreshMyAttempts()
  return player
}

export function logout() {
  set({ me: null, attempts: ONLINE ? [] : state.attempts })
}

export function forgetRecent(id: string) {
  set({ recent: state.recent.filter((p) => p.id !== id) })
}

export async function refreshMyAttempts() {
  if (!ONLINE || !state.me) return
  const rows = await select<RemoteAttempt[]>('attempts', `player_id=eq.${state.me.id}&select=*`)
  set({ attempts: rows.map(fromRemote), synced: true })
}

// al abrir la app con una sesión guardada, se traen los intentos del servidor
if (ONLINE && state.me) refreshMyAttempts().catch(() => set({ synced: false }))

// ------------------------------------------------------------------ intentos

export function myAttempts(s: State, game: string, level = ''): Attempt[] {
  if (!s.me) return []
  return s.attempts.filter((a) => a.playerId === s.me!.id && a.game === game && a.level === level)
}

export function bestOf(attempts: Attempt[]): number {
  return attempts.reduce((m, a) => Math.max(m, a.points ?? 0), 0)
}

export function attemptsLeft(s: State, game: string, level = ''): number {
  return Math.max(0, MAX_ATTEMPTS - myAttempts(s, game, level).length)
}

/** Empieza un intento que cuenta para el ranking. Devuelve su id. */
export async function startAttempt(game: string, level = ''): Promise<string> {
  const me = state.me
  if (!me) throw new RemoteError('SIN_SESION', 'Ingresá con tu nombre para jugar por puntos.')
  if (attemptsLeft(state, game, level) <= 0)
    throw new RemoteError('LIMITE_INTENTOS', `Ya usaste tus ${MAX_ATTEMPTS} intentos en este nivel.`)
  if (ONLINE) {
    const a = await rpc<RemoteAttempt>('start_attempt', { p_player: me.id, p_game: game, p_level: level })
    set({ attempts: [...state.attempts, fromRemote(a)] })
    return a.id
  }
  const a: Attempt = { id: uid(), playerId: me.id, game, level, points: null, startedAt: Date.now() }
  set({ attempts: [...state.attempts, a] })
  return a.id
}

/** Guarda el puntaje final de un intento (sólo una vez). */
export async function finishAttempt(attemptId: string, points: number) {
  const a = state.attempts.find((x) => x.id === attemptId)
  if (!a || a.points !== null) return
  const clean = Math.max(0, Math.min(Math.round(points), MAX_POINTS[a.game] ?? 1000))
  set({ attempts: state.attempts.map((x) => (x.id === attemptId ? { ...x, points: clean } : x)) })
  if (ONLINE) {
    try {
      await rpc('finish_attempt', { p_attempt: attemptId, p_points: clean })
    } catch (e) {
      await refreshMyAttempts().catch(() => undefined)
      throw e
    }
  }
}

/** Puntos del jugador actual: suma de su mejor intento en cada juego/nivel. */
export function myPoints(s: State): number {
  if (!s.me) return 0
  return pointsOf(s.attempts.filter((a) => a.playerId === s.me!.id))
}

function pointsOf(attempts: Attempt[]): number {
  const best = new Map<string, number>()
  for (const a of attempts) {
    const k = `${a.game}|${a.level}`
    best.set(k, Math.max(best.get(k) ?? 0, a.points ?? 0))
  }
  let t = 0
  best.forEach((v) => (t += v))
  return t
}

function bestByGame(attempts: Attempt[]): Record<string, number> {
  const best = new Map<string, number>()
  for (const a of attempts) {
    const k = `${a.game}|${a.level}`
    best.set(k, Math.max(best.get(k) ?? 0, a.points ?? 0))
  }
  const out: Record<string, number> = {}
  best.forEach((v, k) => {
    const g = k.split('|')[0]
    out[g] = (out[g] ?? 0) + v
  })
  return out
}

// ------------------------------------------------------------------ ranking

interface RemoteRank {
  id: string
  name: string
  curso: string
  game: string | null
  points: number
  plays: number
}

export async function loadRanking() {
  if (!ONLINE) {
    const rows: RankRow[] = state.localPlayers.map((p) => {
      const mine = state.attempts.filter((a) => a.playerId === p.id)
      return { player: p, points: pointsOf(mine), plays: mine.length, byGame: bestByGame(mine) }
    })
    set({ ranking: rows, rankingError: null })
    return
  }
  try {
    // la vista devuelve una fila por alumno y juego
    const data = await select<RemoteRank[]>('ranking', 'select=*')
    const map = new Map<string, RankRow>()
    for (const r of data) {
      const row = map.get(r.id) ?? { player: { id: r.id, name: r.name, curso: r.curso }, points: 0, plays: 0, byGame: {} }
      if (r.game) {
        row.byGame[r.game] = r.points
        row.points += r.points
        row.plays += r.plays
      }
      map.set(r.id, row)
    }
    set({ ranking: [...map.values()], rankingError: null })
  } catch (e) {
    set({ rankingError: (e as Error).message })
  }
}

// ------------------------------------------------------------------ actividades (siempre locales)

export function markActivity(activityId: string, correct: boolean) {
  const p = state.me
  if (!p) return
  const mine = { ...(state.activities[p.id] ?? {}) }
  if (mine[activityId]) return
  mine[activityId] = correct
  set({ activities: { ...state.activities, [p.id]: mine } })
}

export function activitiesDone(s: State, playerId: string): number {
  return Object.values(s.activities[playerId] ?? {}).filter(Boolean).length
}

// ------------------------------------------------------------------ zona docente

/** Modo online: acciones protegidas con el PIN docente definido en la base de datos. */
export async function adminDeletePlayer(pin: string, playerId: string) {
  if (ONLINE) await rpc('admin_delete_player', { p_pin: pin, p_player: playerId })
  else
    set({
      localPlayers: state.localPlayers.filter((p) => p.id !== playerId),
      attempts: state.attempts.filter((a) => a.playerId !== playerId),
      recent: state.recent.filter((p) => p.id !== playerId),
      me: state.me?.id === playerId ? null : state.me,
    })
  await loadRanking()
}

/** Borra los intentos de un alumno (en un juego, o en todos) para que pueda volver a jugar. */
export async function adminResetAttempts(pin: string, playerId: string, game: string | null) {
  if (ONLINE) await rpc('admin_reset_attempts', { p_pin: pin, p_player: playerId, p_game: game })
  else set({ attempts: state.attempts.filter((a) => !(a.playerId === playerId && (game === null || a.game === game))) })
  if (state.me?.id === playerId) await refreshMyAttempts()
  await loadRanking()
}

export async function adminCheckPin(pin: string): Promise<boolean> {
  if (!ONLINE) return true
  return rpc<boolean>('admin_check_pin', { p_pin: pin })
}

export function rankingCSV(rows: RankRow[], games: { id: string; title: string }[]): string {
  const head = ['Puesto', 'Curso', 'Alumno', ...games.map((g) => g.title), 'Puntos totales', 'Partidas']
  const lines = rows.map((r, i) => [
    String(i + 1),
    r.player.curso,
    r.player.name,
    ...games.map((g) => String(r.byGame[g.id] ?? 0)),
    String(r.points),
    String(r.plays),
  ])
  return [head, ...lines].map((l) => l.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
}

export function download(filename: string, text: string, mime = 'text/csv') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
