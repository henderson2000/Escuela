import { useEffect, useMemo, useRef, useState } from 'react'
import { CATALOG, partsOf, type ComponentDef, type PartInfo } from '../catalog'
import { Viewer } from '../three/Viewer'
import { GameShell, ResultCard, requestLogin } from './GameShell'
import { useRankedGame } from './useRankedGame'
import { AttemptGate, ModeBadge } from './AttemptGate'

const ROUNDS = 10

interface Round {
  comp: ComponentDef
  part: PartInfo
  options: PartInfo[]
}

function shuffle<T>(a: T[]): T[] {
  return [...a].sort(() => Math.random() - 0.5)
}

function makeRounds(): Round[] {
  const rounds: Round[] = []
  const comps = shuffle(CATALOG)
  for (let i = 0; i < ROUNDS; i++) {
    const comp = comps[i % comps.length]
    const parts = partsOf(comp)
    const part = parts[Math.floor(Math.random() * parts.length)]
    const options = shuffle([part, ...shuffle(parts.filter((p) => p.id !== part.id)).slice(0, 3)])
    rounds.push({ comp, part, options })
  }
  return rounds
}

/** la cámara del juego se aleja un poco porque el modelo aparece despiezado */
function farCamera(c: ComponentDef): [number, number, number] {
  const t = c.target ?? [0, 0, 0]
  return c.camera.map((v, k) => t[k] + (v - t[k]) * 1.45) as [number, number, number]
}

export function PartsGame() {
  const g = useRankedGame('partes')
  const [rounds, setRounds] = useState<Round[]>(makeRounds)
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
  }, [g.playing])

  useEffect(() => {
    startedAt.current = Date.now()
  }, [i, g.playing])

  const r = rounds[i]
  const names = useMemo(() => Object.fromEntries(partsOf(r.comp).map((x) => [x.id, x.name])), [r])

  const pick = (id: string) => {
    if (chosen) return
    setChosen(id)
    if (id === r.part.id) {
      const secs = (Date.now() - startedAt.current) / 1000
      const bonus = Math.max(0, Math.round(10 - secs))
      setScore((x) => x + 10 + bonus)
      setHits((h) => h + 1)
    }
  }

  const next = () => {
    if (i + 1 >= ROUNDS) {
      setSummary(hits)
      g.finish(score)
    } else {
      setI(i + 1)
      setChosen(null)
    }
  }

  return (
    <GameShell title="¿Qué parte es?" icon="🔍" info="El componente aparece despiezado y una pieza tiene un signo “?”. ¿Cuál es? Cuanto más rápido respondas, más puntos.">
      {!g.playing && !g.lastResult && (
        <AttemptGate g={g} onLogin={requestLogin} intro={<p>10 rondas. Podés girar el modelo para ver mejor. Respuesta correcta: 10 puntos + bonus por rapidez (hasta 10).</p>} />
      )}
      {g.playing && (
        <div className="game-layout">
          <div className="hud">
            <span>
              Ronda {i + 1}/{ROUNDS}
            </span>
            <span>⭐ {score}</span>
            <span>{r.comp.name}</span>
            <ModeBadge g={g} />
          </div>
          <Viewer
            key={`${i}-${r.comp.id}`}
            camera={farCamera(r.comp)}
            target={r.comp.target}
            shadowY={r.comp.shadowY}
            className="viewer game-viewer"
            parts={{ explode: 1, quizTarget: chosen ? null : r.part.id, selected: chosen ? r.part.id : null, names }}
          >
            {r.comp.render(r.comp.defaultParams)}
          </Viewer>
          <div className="answers">
            {r.options.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`btn big answer ${chosen ? (o.id === r.part.id ? 'right' : o.id === chosen ? 'wrong' : '') : ''}`}
                onClick={() => pick(o.id)}
              >
                {o.name}
              </button>
            ))}
          </div>
          {chosen && (
            <div className="card part-info">
              <h4>{chosen === r.part.id ? '✔ ¡Correcto!' : `✘ Era: ${r.part.name}`}</h4>
              <p>{r.part.desc}</p>
              <button type="button" className="btn primary" onClick={next}>
                {i + 1 >= ROUNDS ? 'Ver resultado' : 'Siguiente →'}
              </button>
            </div>
          )}
        </div>
      )}
      {!g.playing && g.lastResult && <ResultCard g={g} onAgain={g.clearResult} detail={<p>Acertaste {summary} de {ROUNDS}</p>} />}
    </GameShell>
  )
}
