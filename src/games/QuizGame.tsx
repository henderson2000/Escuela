import { useEffect, useRef, useState, type ReactNode } from 'react'
import { GameShell, ResultCard, requestLogin } from './GameShell'
import { useRankedGame } from './useRankedGame'
import { AttemptGate, ModeBadge } from './AttemptGate'

export interface QuizRound {
  prompt: ReactNode
  visual: ReactNode
  options: { id: string; label: ReactNode }[]
  answer: string
  explain?: ReactNode
}

export const shuffle = <T,>(a: T[]): T[] => {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}
export const pickOne = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]

/** Juego de preguntas: 10 rondas, 15 puntos por acierto + hasta 5 por rapidez (máx. 200). */
export function QuizGame({
  game,
  title,
  icon,
  info,
  intro,
  makeRounds,
  rounds: total = 10,
}: {
  game: string
  title: string
  icon: string
  info: ReactNode
  intro: ReactNode
  makeRounds: () => QuizRound[]
  rounds?: number
}) {
  const g = useRankedGame(game)
  const [rounds, setRounds] = useState<QuizRound[]>(makeRounds)
  const [i, setI] = useState(0)
  const [score, setScore] = useState(0)
  const [hits, setHits] = useState(0)
  const [chosen, setChosen] = useState<string | null>(null)
  const [summary, setSummary] = useState(0)
  const startedAt = useRef(Date.now())

  useEffect(() => {
    if (!g.playing) return
    setRounds(makeRounds())
    setI(0)
    setScore(0)
    setHits(0)
    setChosen(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.playing])

  useEffect(() => {
    startedAt.current = Date.now()
  }, [i, g.playing])

  const r = rounds[i]

  const pick = (id: string) => {
    if (chosen) return
    setChosen(id)
    if (id === r.answer) {
      const secs = (Date.now() - startedAt.current) / 1000
      const bonus = Math.max(0, Math.min(5, Math.round(5 - (secs - 4) / 2)))
      setScore((x) => x + 15 + bonus)
      setHits((h) => h + 1)
    }
  }

  const next = () => {
    if (i + 1 >= total) {
      setSummary(hits)
      g.finish(score)
    } else {
      setI(i + 1)
      setChosen(null)
    }
  }

  return (
    <GameShell title={title} icon={icon} info={info}>
      {!g.playing && !g.lastResult && <AttemptGate g={g} onLogin={requestLogin} intro={intro} />}
      {g.playing && r && (
        <div className="quiz">
          <div className="hud">
            <span>
              Pregunta {i + 1}/{total}
            </span>
            <span>⭐ {score}</span>
            <ModeBadge g={g} />
          </div>
          <div className="card quiz-card">
            <h3 className="quiz-prompt">{r.prompt}</h3>
            <div className="quiz-visual">{r.visual}</div>
          </div>
          <div className="answers">
            {r.options.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`btn big answer ${chosen ? (o.id === r.answer ? 'right' : o.id === chosen ? 'wrong' : '') : ''}`}
                onClick={() => pick(o.id)}
              >
                {o.label}
              </button>
            ))}
          </div>
          {chosen && (
            <div className="card part-info">
              <h4>{chosen === r.answer ? '✔ ¡Correcto!' : '✘ No era esa'}</h4>
              {r.explain && <p>{r.explain}</p>}
              <div className="row">
                <button type="button" className="btn primary" onClick={next}>
                  {i + 1 >= total ? 'Ver resultado' : 'Siguiente →'}
                </button>
              </div>
            </div>
          )}
          {!chosen && (
            <button type="button" className="btn ghost small" onClick={() => g.abandon()}>
              {g.ranked ? 'Abandonar intento (queda con 0)' : 'Salir de la práctica'}
            </button>
          )}
        </div>
      )}
      {!g.playing && g.lastResult && (
        <ResultCard
          g={g}
          onAgain={g.clearResult}
          detail={
            <p>
              Acertaste {summary} de {total}
            </p>
          }
        />
      )}
    </GameShell>
  )
}
