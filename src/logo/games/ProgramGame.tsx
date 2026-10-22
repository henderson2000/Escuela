import { useEffect, useMemo, useRef, useState } from 'react'
import { GameShell } from '../../games/GameShell'
import { useRankedGame } from '../../games/useRankedGame'
import { AttemptGate, LevelTabs, ModeBadge } from '../../games/AttemptGate'
import { LogoEditor } from '../Editor'
import { DEVICE_NAMES, OUTPUT_NAMES, runTests, type Program } from '../engine'
import { startProgram, type Exercise } from '../exercises'
import { LOGO_LEVELS } from '../levels'

export const PROGRAM_GAME = 'logo-programa'

export function ProgramGame() {
  const [li, setLi] = useState(0)
  const [playing, setPlaying] = useState(false)
  return (
    <GameShell
      title="Programá el LOGO!"
      icon="🤖"
      info="Situaciones reales para automatizar. Armá el programa, probalo y tocá «Comprobar». Cada nivel vale 100 puntos; cada comprobación fallida resta 10."
    >
      <LevelTabs game={PROGRAM_GAME} levels={LOGO_LEVELS.map((l) => ({ id: l.id, title: `${l.n}. ${l.title}` }))} current={li} locked={playing} onSelect={setLi} />
      <ProgramLevel
        key={LOGO_LEVELS[li].id}
        level={LOGO_LEVELS[li]}
        onPlayingChange={setPlaying}
        onNext={li + 1 < LOGO_LEVELS.length ? () => setLi(li + 1) : undefined}
      />
    </GameShell>
  )
}

function ProgramLevel({ level, onPlayingChange, onNext }: { level: Exercise; onPlayingChange: (p: boolean) => void; onNext?: () => void }) {
  const g = useRankedGame(PROGRAM_GAME, level.id)
  const [fails, setFails] = useState(0)
  const [msg, setMsg] = useState<{ ok: boolean; text: string; points?: number } | null>(null)
  const [round, setRound] = useState(0)
  const prog = useRef<Program | null>(null)
  const initial = useMemo(() => startProgram(level.io), [level, round])

  useEffect(() => {
    onPlayingChange(g.playing)
  }, [g.playing, onPlayingChange])
  useEffect(() => {
    if (!g.playing) return
    setFails(0)
    setMsg(null)
    setRound((r) => r + 1)
  }, [g.playing])

  const check = () => {
    if (!prog.current || !level.tests) return
    const r = runTests(prog.current, level.tests)
    if (r.ok) {
      const points = Math.max(40, 100 - fails * 10)
      setMsg({ ok: true, text: r.message, points })
      g.finish(points)
    } else {
      setFails((f) => f + 1)
      setMsg({ ok: false, text: r.message })
    }
  }

  const showEditor = g.playing || msg?.ok

  return (
    <div className="card program-level">
      <div className="row space wrap">
        <h3>
          {level.n}. {level.title}
        </h3>
        <ModeBadge g={g} />
      </div>
      <p>{level.text}</p>
      <div className="io-chips">
        {Object.entries(level.io.I).map(([n, c]) => (
          <span key={`i${n}`} className="chip static">
            <b>I{n}</b> {c.label} <small>({DEVICE_NAMES[c.dev]})</small>
          </span>
        ))}
        {Object.entries(level.io.Q).map(([n, c]) => (
          <span key={`q${n}`} className="chip static">
            <b>Q{n}</b> {c.label} <small>({OUTPUT_NAMES[c.kind]})</small>
          </span>
        ))}
      </div>
      {!showEditor ? (
        <AttemptGate g={g} />
      ) : (
        <>
          <LogoEditor
            key={round}
            initial={initial}
            lockIO
            readOnly={!g.playing}
            onChange={(p) => {
              prog.current = p
            }}
            actions={
              g.playing ? (
                <button type="button" className="btn small primary" onClick={check}>
                  ✔ Comprobar
                </button>
              ) : null
            }
          />
          {g.playing && (
            <div className="row wrap">
              {msg && !msg.ok && (
                <span className="feedback bad">
                  ✘ {msg.text}
                  {g.ranked && ' (−10 pts)'}
                </span>
              )}
              <span className="grow" />
              <button type="button" className="btn ghost small" onClick={() => g.abandon()}>
                {g.ranked ? 'Abandonar intento (queda con 0)' : 'Salir de la práctica'}
              </button>
            </div>
          )}
          {msg?.ok && g.lastResult && (
            <div className="card result inline">
              <p className="record">
                ✔ ¡Funciona! {g.lastResult.ranked ? `+${msg.points} puntos` : `${msg.points} puntos (práctica, no se guardan)`}
              </p>
              {g.lastResult.ranked && g.lastResult.prevBest >= msg.points! && <p>Tu mejor intento en este nivel sigue siendo {g.lastResult.prevBest}.</p>}
              {g.error && <p className="feedback bad">{g.error}</p>}
              <div className="row wrap">
                {onNext && (
                  <button type="button" className="btn primary" onClick={onNext}>
                    Siguiente nivel →
                  </button>
                )}
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setMsg(null)
                    g.clearResult()
                  }}
                >
                  Volver a este nivel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
