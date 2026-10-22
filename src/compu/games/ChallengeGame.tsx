import { useCallback, useEffect, useState } from 'react'
import { GameShell } from '../../games/GameShell'
import { useRankedGame } from '../../games/useRankedGame'
import { AttemptGate, LevelTabs, ModeBadge } from '../../games/AttemptGate'
import { LessonWorkspace } from '../Workspace'
import { CHALLENGES } from '../challenges'
import type { Lesson } from '../types'

export const CHALLENGE_GAME = 'compu-desafios'

export function ChallengeGame() {
  const [li, setLi] = useState(0)
  const [playing, setPlaying] = useState(false)
  return (
    <GameShell
      title="Desafíos de código"
      icon="🧩"
      info="Problemas para resolver con HTML y JavaScript. Cada desafío vale 100 puntos; cada comprobación con requisitos sin cumplir resta 10."
    >
      <LevelTabs game={CHALLENGE_GAME} levels={CHALLENGES.map((c, i) => ({ id: c.id, title: `${i + 1}. ${c.kind === 'web' ? '🧱' : '⚡'} ${c.title}` }))} current={li} locked={playing} onSelect={setLi} />
      <ChallengeLevel key={CHALLENGES[li].id} ch={CHALLENGES[li]} onPlayingChange={setPlaying} onNext={li + 1 < CHALLENGES.length ? () => setLi(li + 1) : undefined} />
    </GameShell>
  )
}

function ChallengeLevel({ ch, onPlayingChange, onNext }: { ch: Lesson; onPlayingChange: (p: boolean) => void; onNext?: () => void }) {
  const g = useRankedGame(CHALLENGE_GAME, ch.id)
  const [fails, setFails] = useState(0)
  const [round, setRound] = useState(0)
  const [won, setWon] = useState<number | null>(null)

  useEffect(() => {
    onPlayingChange(g.playing)
  }, [g.playing, onPlayingChange])
  useEffect(() => {
    if (!g.playing) return
    setFails(0)
    setWon(null)
    setRound((r) => r + 1)
    // borra el código guardado de un intento anterior
    try {
      localStorage.removeItem(`compu-code-desafio-${ch.id}`)
    } catch {
      /* sin almacenamiento */
    }
  }, [g.playing, ch.id])

  const onChecked = useCallback(
    (_r: boolean[], ok: boolean) => {
      if (!g.playing) return
      if (ok) {
        const pts = Math.max(40, 100 - fails * 10)
        setWon(pts)
        g.finish(pts)
      } else setFails((f) => f + 1)
    },
    [g, fails],
  )

  if (!g.playing && won === null)
    return (
      <div className="card program-level">
        <h3>{ch.title}</h3>
        <div className="prose">
          {ch.intro}
          {ch.task}
        </div>
        <AttemptGate g={g} />
      </div>
    )

  return (
    <div>
      {won !== null && g.lastResult && (
        <div className="card result inline">
          <p className="record">
            ✔ ¡Desafío resuelto! {g.lastResult.ranked ? `+${won} puntos` : `${won} puntos (práctica, no se guardan)`}
          </p>
          {g.lastResult.ranked && g.lastResult.prevBest >= won && <p>Tu mejor intento en este desafío sigue siendo {g.lastResult.prevBest}.</p>}
          {g.error && <p className="feedback bad">{g.error}</p>}
          <div className="row wrap">
            {onNext && (
              <button type="button" className="btn primary" onClick={onNext}>
                Siguiente desafío →
              </button>
            )}
            <button
              type="button"
              className="btn"
              onClick={() => {
                setWon(null)
                g.clearResult()
              }}
            >
              Volver a este desafío
            </button>
          </div>
        </div>
      )}
      <LessonWorkspace
        key={round}
        lesson={{ ...ch, hint: undefined }}
        storageId={`desafio-${ch.id}`}
        onChecked={onChecked}
        side={
          <div className="row space wrap">
            <ModeBadge g={g} />
            {g.playing && g.ranked && <span className="hint">Comprobaciones fallidas: {fails} (−{fails * 10} pts)</span>}
          </div>
        }
        actions={
          g.playing ? (
            <button type="button" className="btn ghost small" onClick={() => g.abandon()}>
              {g.ranked ? 'Abandonar intento (queda con 0)' : 'Salir de la práctica'}
            </button>
          ) : null
        }
      />
    </div>
  )
}
