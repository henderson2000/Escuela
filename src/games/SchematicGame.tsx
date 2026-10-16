import { useEffect, useState } from 'react'
import { SYMBOL_NAMES, SymbolIcon, SymbolPaths, type SymbolKind } from '../components/Symbols'
import { GameShell, requestLogin } from './GameShell'
import { useRankedGame } from './useRankedGame'
import { AttemptGate, LevelTabs, ModeBadge } from './AttemptGate'

interface El {
  kind: SymbolKind
  /** centro */
  x: number
  y: number
  /** vertical */
  v?: boolean
  /** si es un hueco a completar */
  slot?: boolean
  label?: string
}

interface Level {
  id: string
  title: string
  goal: string
  wires: string
  els: El[]
  palette: SymbolKind[]
}

// rectángulo base: (60,60) – (340,200)
const LOOP = 'M60 60 H340 V200 H60 Z'

export const SCHEMATIC_LEVELS: Level[] = [
  {
    id: 'linterna',
    title: '1. La linterna',
    goal: 'Una linterna tiene una pila, un interruptor para prenderla y una lámpara. Completá lo que falta.',
    wires: LOOP,
    els: [
      { kind: 'bateria', x: 60, y: 130, v: true, label: '3 V' },
      { kind: 'interruptor', x: 200, y: 60, slot: true },
      { kind: 'lampara', x: 340, y: 130, v: true, slot: true },
    ],
    palette: ['lampara', 'interruptor', 'capacitor', 'resistencia', 'motor'],
  },
  {
    id: 'led',
    title: '2. LED protegido',
    goal: 'Un LED que se prende con un interruptor. ¡Ojo! Sin algo que limite la corriente, el LED se quema.',
    wires: LOOP,
    els: [
      { kind: 'bateria', x: 60, y: 130, v: true, label: '9 V' },
      { kind: 'resistencia', x: 200, y: 60, slot: true },
      { kind: 'led', x: 340, y: 130, v: true, slot: true },
      { kind: 'interruptor', x: 200, y: 200 },
    ],
    palette: ['resistencia', 'led', 'capacitor', 'lampara', 'potenciometro', 'masa'],
  },
  {
    id: 'paralelo',
    title: '3. Dos lámparas en paralelo',
    goal: 'Un interruptor general prende dos lámparas conectadas en paralelo (si una se quema, la otra sigue).',
    wires: 'M60 60 H340 V200 H60 Z M240 60 V200',
    els: [
      { kind: 'bateria', x: 60, y: 130, v: true, label: '12 V' },
      { kind: 'interruptor', x: 150, y: 60, slot: true },
      { kind: 'lampara', x: 240, y: 130, v: true, slot: true },
      { kind: 'lampara', x: 340, y: 130, v: true, slot: true },
    ],
    palette: ['lampara', 'interruptor', 'motor', 'resistencia', 'bateria', 'diodo'],
  },
  {
    id: 'motor',
    title: '4. Motor con filtro',
    goal: 'Un motor de juguete. En paralelo con el motor se pone un capacitor que filtra el ruido eléctrico de las escobillas.',
    wires: 'M60 60 H340 V200 H60 Z M240 60 V200',
    els: [
      { kind: 'bateria', x: 60, y: 130, v: true, label: '6 V' },
      { kind: 'interruptor', x: 150, y: 60 },
      { kind: 'capacitor', x: 240, y: 130, v: true, slot: true, label: '100 nF' },
      { kind: 'motor', x: 340, y: 130, v: true, slot: true },
    ],
    palette: ['capacitor', 'motor', 'lampara', 'resistencia', 'led', 'masa'],
  },
  {
    id: 'brillo',
    title: '5. Control de brillo',
    goal: 'Queremos regular el brillo de un LED girando una perilla, y que no se queme aunque la perilla esté al mínimo.',
    wires: LOOP,
    els: [
      { kind: 'bateria', x: 60, y: 130, v: true, label: '9 V' },
      { kind: 'potenciometro', x: 150, y: 60, slot: true },
      { kind: 'resistencia', x: 260, y: 60, slot: true, label: '330 Ω' },
      { kind: 'led', x: 340, y: 130, v: true, slot: true },
      { kind: 'interruptor', x: 200, y: 200 },
    ],
    palette: ['potenciometro', 'resistencia', 'led', 'diodo', 'capacitor', 'lampara', 'interruptor'],
  },
  {
    id: 'diodo',
    title: '6. Protección contra la pila al revés',
    goal: 'Un diodo en serie deja pasar la corriente en un solo sentido: si alguien pone la pila al revés, el motor no se daña.',
    wires: LOOP,
    els: [
      { kind: 'bateria', x: 60, y: 130, v: true, label: '9 V' },
      { kind: 'diodo', x: 150, y: 60, slot: true },
      { kind: 'interruptor', x: 260, y: 60, slot: true },
      { kind: 'motor', x: 340, y: 130, v: true, slot: true },
    ],
    palette: ['diodo', 'led', 'interruptor', 'motor', 'lampara', 'capacitor', 'resistencia'],
  },
]

function Element({ el, kind, onClick, state }: { el: El; kind?: SymbolKind; onClick?: () => void; state?: 'ok' | 'bad' | 'sel' }) {
  const rot = el.v ? `rotate(90 ${el.x} ${el.y})` : undefined
  return (
    <g onClick={onClick} className={`el ${el.slot ? 'slot' : ''} ${state ?? ''}`}>
      <g transform={rot}>
        <rect x={el.x - 38} y={el.y - 22} width={76} height={44} className="el-bg" rx={6} />
        {kind && (
          <g transform={`translate(${el.x - 40} ${el.y - 20})`}>
            <SymbolPaths kind={kind} />
          </g>
        )}
      </g>
      {!kind && el.slot && (
        <text x={el.x} y={el.y + 8} className="slot-q">
          ?
        </text>
      )}
      {el.label && kind && (
        <text x={el.v ? el.x + 28 : el.x} y={el.v ? el.y + 4 : el.y - 28} className={`svg-label ${el.v ? 'start' : ''}`}>
          {el.label}
        </text>
      )}
    </g>
  )
}

export function SchematicGame() {
  const [li, setLi] = useState(0)
  const [playing, setPlaying] = useState(false)
  return (
    <GameShell title="Completá el plano" icon="📐" info="Elegí un símbolo de la caja de herramientas y tocá el lugar con “?” donde va. Cuando esté completo, comprobá.">
      <LevelTabs game="plano" levels={SCHEMATIC_LEVELS} current={li} locked={playing} onSelect={setLi} />
      <SchematicLevel
        key={SCHEMATIC_LEVELS[li].id}
        level={SCHEMATIC_LEVELS[li]}
        onPlayingChange={setPlaying}
        onNext={li + 1 < SCHEMATIC_LEVELS.length ? () => setLi(li + 1) : undefined}
      />
    </GameShell>
  )
}

function SchematicLevel({ level, onPlayingChange, onNext }: { level: Level; onPlayingChange: (p: boolean) => void; onNext?: () => void }) {
  const g = useRankedGame('plano', level.id)
  const [filled, setFilled] = useState<Record<number, SymbolKind>>({})
  const [pick, setPick] = useState<SymbolKind | null>(null)
  const [fails, setFails] = useState(0)
  const [result, setResult] = useState<null | { ok: boolean; wrong: number[]; points?: number }>(null)

  useEffect(() => onPlayingChange(g.playing), [g.playing])
  useEffect(() => {
    if (!g.playing) return
    setFilled({})
    setPick(null)
    setFails(0)
    setResult(null)
  }, [g.playing])

  const slots = level.els.map((e, i) => (e.slot ? i : -1)).filter((i) => i >= 0)
  const complete = slots.every((i) => filled[i])
  const active = g.playing && !result?.ok

  const check = () => {
    const wrong = slots.filter((i) => filled[i] !== level.els[i].kind)
    if (wrong.length === 0) {
      const points = Math.max(40, 100 - fails * 15)
      setResult({ ok: true, wrong, points })
      setPick(null)
      g.finish(points)
    } else {
      setFails((f) => f + 1)
      setResult({ ok: false, wrong })
    }
  }

  const showBoard = g.playing || result?.ok

  return (
    <div className="schematic-layout">
      <div className="card">
        <div className="row space wrap">
          <h3>{level.title}</h3>
          <ModeBadge g={g} />
        </div>
        <p>{level.goal}</p>
        {!showBoard ? (
          <AttemptGate g={g} onLogin={requestLogin} />
        ) : (
          <>
            <svg viewBox="0 0 400 260" className="schematic">
              <path d={level.wires} className="wire" />
              {level.els.map((el, i) => {
                const kind = el.slot ? filled[i] : el.kind
                const state = result && el.slot ? (result.wrong.includes(i) ? 'bad' : result.ok ? 'ok' : undefined) : undefined
                return (
                  <Element
                    key={i}
                    el={el}
                    kind={kind}
                    state={state}
                    onClick={
                      el.slot && active
                        ? () => {
                            if (pick) {
                              setFilled({ ...filled, [i]: pick })
                              setResult(null)
                            } else if (filled[i]) {
                              const f = { ...filled }
                              delete f[i]
                              setFilled(f)
                              setResult(null)
                            }
                          }
                        : undefined
                    }
                  />
                )
              })}
            </svg>
            {active && (
              <div className="row wrap">
                <button type="button" className="btn primary" disabled={!complete} onClick={check}>
                  Comprobar
                </button>
                <button type="button" className="btn ghost" onClick={() => g.abandon()}>
                  {g.ranked ? 'Abandonar intento (queda con 0)' : 'Salir de la práctica'}
                </button>
                {result && !result.ok && (
                  <span className="feedback bad">
                    ✘ Hay {result.wrong.length} símbolo(s) mal ubicados (en rojo).{g.ranked && ' −15 pts'}
                  </span>
                )}
              </div>
            )}
            {result?.ok && g.lastResult && (
              <div className="card result inline">
                <p className="record">
                  ✔ ¡Plano correcto! {g.lastResult.ranked ? `+${result.points} puntos para el ranking` : `${result.points} puntos (práctica, no se guardan)`}
                </p>
                {g.lastResult.ranked && g.lastResult.prevBest >= result.points! && <p>Tu mejor intento en este nivel sigue siendo {g.lastResult.prevBest}.</p>}
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
                      setResult(null)
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
      <aside className="card toolbox">
        <h3>Caja de herramientas</h3>
        <div className="palette">
          {level.palette.map((k) => (
            <button key={k} type="button" disabled={!active} className={`palette-item ${pick === k ? 'active' : ''}`} onClick={() => setPick(pick === k ? null : k)}>
              <SymbolIcon kind={k} size={70} />
              <span>{SYMBOL_NAMES[k]}</span>
            </button>
          ))}
        </div>
        <p className="hint">Tocá un símbolo ya colocado (sin nada elegido) para quitarlo.</p>
      </aside>
    </div>
  )
}
