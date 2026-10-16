import { useEffect, useRef, useState } from 'react'
import { Viewer } from '../three/Viewer'
import { ResistorModel } from '../three/models/Resistor'
import { formatOhms, randomE12, valueToBands, type ColorName } from '../lib/resistor'
import { addScore, bestScore, currentPlayer, useStore } from '../lib/scores'
import { GameShell, ResultCard } from './GameShell'

const DURATION = 60

interface Round {
  value: number
  bands: ColorName[]
  options: number[]
}

function makeRound(level: number): Round {
  const five = level >= 6 && Math.random() < 0.5
  const value = randomE12(1, level < 3 ? 4 : 6)
  const bands = valueToBands(value, five ? 5 : 4, five ? 1 : 5)
  const s = String(value)
  const swapped = Number(s[1] + s[0] + s.slice(2))
  const cands = new Set<number>([value * 10, Math.max(1, Math.round(value / 10)), swapped, value * 100, randomE12(1, 5)])
  cands.delete(value)
  const wrong = [...cands].filter((v) => v > 0).sort(() => Math.random() - 0.5).slice(0, 3)
  const options = [value, ...wrong].sort(() => Math.random() - 0.5)
  return { value, bands, options }
}

export function ColorGame() {
  const s = useStore()
  const p = currentPlayer(s)
  const [phase, setPhase] = useState<'intro' | 'play' | 'end'>('intro')
  const [time, setTime] = useState(DURATION)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  const [round, setRound] = useState<Round>(() => makeRound(0))
  const [flash, setFlash] = useState<null | { ok: boolean; text: string }>(null)
  const [best, setBest] = useState(0)
  const saved = useRef(false)

  useEffect(() => {
    if (phase !== 'play') return
    const t = setInterval(() => setTime((x) => x - 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  useEffect(() => {
    if (phase === 'play' && time <= 0) {
      setPhase('end')
    }
  }, [time, phase])

  useEffect(() => {
    if (phase === 'end' && !saved.current) {
      saved.current = true
      setBest(p ? bestScore(s, p.id, 'colores') : 0)
      addScore('colores', score)
    }
  }, [phase])

  const start = () => {
    saved.current = false
    setScore(0)
    setStreak(0)
    setHits(0)
    setMisses(0)
    setTime(DURATION)
    setRound(makeRound(0))
    setFlash(null)
    setPhase('play')
  }

  const answer = (v: number) => {
    if (v === round.value) {
      const gained = 10 + Math.min(streak, 10) * 2
      setScore((x) => x + gained)
      setStreak((x) => x + 1)
      setHits((h) => h + 1)
      setFlash({ ok: true, text: `+${gained}` })
      setRound(makeRound(hits + 1))
    } else {
      setStreak(0)
      setMisses((m) => m + 1)
      setTime((t) => Math.max(0, t - 3))
      setFlash({ ok: false, text: `Era ${formatOhms(round.value)} (−3 s)` })
      setRound(makeRound(hits))
    }
  }

  return (
    <GameShell title="Código de colores contrarreloj" icon="🎨" info="Tenés 60 segundos. Mirá las bandas y elegí el valor correcto. Cada acierto seguido suma más; cada error resta 3 segundos.">
      {phase === 'intro' && (
        <div className="card center-block">
          <p>Tip: poné la banda dorada a la derecha y leé de izquierda a derecha. Desde la ronda 6 aparecen resistencias de 5 bandas.</p>
          <button type="button" className="btn primary big" onClick={start}>
            ¡Empezar!
          </button>
        </div>
      )}
      {phase === 'play' && (
        <div className="game-layout">
          <div className="hud">
            <span className={`timer ${time <= 10 ? 'low' : ''}`}>⏱ {time}s</span>
            <span>⭐ {score}</span>
            <span>🔥 x{streak}</span>
          </div>
          <Viewer camera={[0, 0.4, 5.2]} shadowY={-1.2} className="viewer game-viewer">
            <group scale={1.15}>
              <ResistorModel bands={round.bands} straight />
            </group>
          </Viewer>
          {flash && <div className={`flash ${flash.ok ? 'ok' : 'bad'}`} key={hits + misses}>{flash.text}</div>}
          <div className="answers">
            {round.options.map((o) => (
              <button key={o} type="button" className="btn big answer" onClick={() => answer(o)}>
                {formatOhms(o)}
              </button>
            ))}
          </div>
        </div>
      )}
      {phase === 'end' && (
        <ResultCard
          points={score}
          best={best}
          onRetry={start}
          detail={
            <p>
              Aciertos: {hits} · Errores: {misses}
            </p>
          }
        />
      )}
    </GameShell>
  )
}
