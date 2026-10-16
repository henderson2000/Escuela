// Jugadores, puntajes y progreso de actividades.
// Se guardan en el navegador (localStorage). Para juntar puntajes de varias
// computadoras se usa Exportar / Importar en la página de Ranking.

import { useSyncExternalStore } from 'react'

export interface Player {
  id: string
  name: string
  curso: string
  createdAt: number
}

export interface ScoreEntry {
  id: string
  playerId: string
  game: string // id del juego
  level?: string // nivel / modo dentro del juego
  points: number
  date: number
}

interface State {
  players: Player[]
  currentPlayerId: string | null
  scores: ScoreEntry[]
  /** progreso de actividades: playerId -> activityId -> respondida bien */
  activities: Record<string, Record<string, boolean>>
}

const KEY = 'escuela-electronica-v1'

const empty: State = { players: [], currentPlayerId: null, scores: [], activities: {} }

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty
    return { ...empty, ...JSON.parse(raw) }
  } catch {
    return empty
  }
}

let state: State = load()
const listeners = new Set<() => void>()

function save(next: State) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // almacenamiento no disponible: se mantiene en memoria
  }
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useStore(): State {
  return useSyncExternalStore(subscribe, () => state)
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

export function createPlayer(name: string, curso: string): Player {
  const existing = state.players.find(
    (p) => p.name.trim().toLowerCase() === name.trim().toLowerCase() && p.curso === curso,
  )
  if (existing) {
    save({ ...state, currentPlayerId: existing.id })
    return existing
  }
  const player: Player = { id: uid(), name: name.trim(), curso: curso.trim(), createdAt: Date.now() }
  save({ ...state, players: [...state.players, player], currentPlayerId: player.id })
  return player
}

export function selectPlayer(id: string | null) {
  save({ ...state, currentPlayerId: id })
}

export function currentPlayer(s: State = state): Player | undefined {
  return s.players.find((p) => p.id === s.currentPlayerId)
}

export function addScore(game: string, points: number, level?: string): ScoreEntry | null {
  const p = currentPlayer()
  if (!p || points <= 0) return null
  const entry: ScoreEntry = { id: uid(), playerId: p.id, game, level, points: Math.round(points), date: Date.now() }
  save({ ...state, scores: [...state.scores, entry] })
  return entry
}

export function bestScore(s: State, playerId: string, game: string, level?: string): number {
  return s.scores
    .filter((e) => e.playerId === playerId && e.game === game && e.level === level)
    .reduce((m, e) => Math.max(m, e.points), 0)
}

/**
 * Puntaje total del jugador = suma de su MEJOR puntaje en cada juego/nivel.
 * Así repetir mil veces el mismo juego no infla el ranking: lo que cuenta es mejorar.
 */
export function totalPoints(s: State, playerId: string): number {
  const best = new Map<string, number>()
  for (const e of s.scores) {
    if (e.playerId !== playerId) continue
    const k = `${e.game}|${e.level ?? ''}`
    best.set(k, Math.max(best.get(k) ?? 0, e.points))
  }
  let t = 0
  best.forEach((v) => (t += v))
  return t
}

export function markActivity(activityId: string, correct: boolean) {
  const p = currentPlayer()
  if (!p) return
  const mine = { ...(state.activities[p.id] ?? {}) }
  if (mine[activityId]) return // ya estaba bien, no se pisa
  mine[activityId] = correct
  save({ ...state, activities: { ...state.activities, [p.id]: mine } })
}

export function activitiesDone(s: State, playerId: string): number {
  return Object.values(s.activities[playerId] ?? {}).filter(Boolean).length
}

// ---------- exportar / importar (para juntar los datos de varias PCs) ----------

export function exportJSON(): string {
  return JSON.stringify({ app: 'escuela-electronica', version: 1, ...state, currentPlayerId: null }, null, 2)
}

export function importJSON(text: string): { players: number; scores: number } {
  const data = JSON.parse(text) as Partial<State>
  if (!Array.isArray(data.players) || !Array.isArray(data.scores)) throw new Error('Archivo inválido')
  const players = [...state.players]
  const idMap = new Map<string, string>()
  let newPlayers = 0
  for (const p of data.players) {
    const same = players.find(
      (q) => q.id === p.id || (q.name.toLowerCase() === p.name.toLowerCase() && q.curso === p.curso),
    )
    if (same) idMap.set(p.id, same.id)
    else {
      players.push(p)
      idMap.set(p.id, p.id)
      newPlayers++
    }
  }
  const known = new Set(state.scores.map((e) => e.id))
  const incoming = data.scores
    .filter((e) => !known.has(e.id))
    .map((e) => ({ ...e, playerId: idMap.get(e.playerId) ?? e.playerId }))
  const activities = { ...state.activities }
  for (const [pid, acts] of Object.entries(data.activities ?? {})) {
    const target = idMap.get(pid) ?? pid
    activities[target] = { ...acts, ...(activities[target] ?? {}) }
  }
  save({ ...state, players, scores: [...state.scores, ...incoming], activities })
  return { players: newPlayers, scores: incoming.length }
}

export function exportCSV(): string {
  const rows = [['Curso', 'Alumno', 'Puntos totales', 'Actividades resueltas', 'Partidas jugadas']]
  for (const p of state.players) {
    rows.push([
      p.curso,
      p.name,
      String(totalPoints(state, p.id)),
      String(activitiesDone(state, p.id)),
      String(state.scores.filter((e) => e.playerId === p.id).length),
    ])
  }
  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
}

export function resetAll() {
  save(empty)
}

export function deletePlayer(id: string) {
  const activities = { ...state.activities }
  delete activities[id]
  save({
    players: state.players.filter((p) => p.id !== id),
    scores: state.scores.filter((e) => e.playerId !== id),
    activities,
    currentPlayerId: state.currentPlayerId === id ? null : state.currentPlayerId,
  })
}

export function download(filename: string, text: string, mime = 'application/json') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
