import { useEffect, useState } from 'react'
import { MAX_ATTEMPTS } from '../lib/config'
import { BULBS, attemptsLeft, bestOf, earnBulbs, finishAttempt, myAttempts, refreshMyAttempts, startAttempt, useStore } from '../lib/scores'

export type PlayMode = 'puntos' | 'practica'

export interface Session {
  mode: PlayMode
  attemptId?: string
  /** número de intento (1 o 2) cuando juega por puntos */
  n?: number
}

/**
 * Maneja los intentos por puntos de un juego/nivel:
 * en cada computadora hay MAX_ATTEMPTS intentos por puntos (queda el mejor), y se puede practicar sin límite.
 */
export function useRankedGame(game: string, level = '') {
  const s = useStore()
  const attempts = myAttempts(s, game, level)
  const left = attemptsLeft(s, game, level)
  const best = bestOf(attempts)
  const [session, setSession] = useState<Session | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const needsSync = !!s.me && !s.synced
  useEffect(() => {
    if (needsSync) refreshMyAttempts().catch((e) => setError((e as Error).message))
  }, [needsSync])
  const [lastResult, setLastResult] = useState<{ points: number; ranked: boolean; prevBest: number } | null>(null)

  const start = async (mode: PlayMode) => {
    setError(null)
    setLastResult(null)
    if (mode === 'practica') {
      setSession({ mode })
      return true
    }
    setStarting(true)
    try {
      const id = await startAttempt(game, level)
      setSession({ mode, attemptId: id, n: attempts.length + 1 })
      return true
    } catch (e) {
      setError((e as Error).message)
      return false
    } finally {
      setStarting(false)
    }
  }

  /** Termina la partida actual con un puntaje (en práctica no se guarda). */
  const finish = async (points: number) => {
    const sess = session
    setSession(null)
    setLastResult({ points, ranked: sess?.mode === 'puntos', prevBest: best })
    if (sess?.mode === 'puntos' && sess.attemptId) {
      earnBulbs(`juego:${sess.attemptId}`, Math.floor(points / BULBS.puntosPorLamparita), 'Juego por puntos')
      try {
        await finishAttempt(sess.attemptId, points)
      } catch (e) {
        setError((e as Error).message)
      }
    }
  }

  /** Abandona: en un intento por puntos queda registrado con 0. */
  const abandon = async () => {
    const sess = session
    setSession(null)
    if (sess?.mode === 'puntos' && sess.attemptId) await finishAttempt(sess.attemptId, 0).catch(() => undefined)
  }

  return {
    loggedIn: !!s.me,
    /** todavía no se sabe cuántos intentos le quedan (cargando del servidor) */
    syncing: !!s.me && !s.synced,
    used: attempts.length,
    left,
    max: MAX_ATTEMPTS,
    best,
    session,
    playing: !!session,
    ranked: session?.mode === 'puntos',
    start,
    finish,
    abandon,
    starting,
    error,
    lastResult,
    clearResult: () => setLastResult(null),
  }
}

export type RankedGame = ReturnType<typeof useRankedGame>
