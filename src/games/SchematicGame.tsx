import { useState } from 'react'
import { SYMBOL_NAMES, SymbolIcon, SymbolPaths, type SymbolKind } from '../components/Symbols'
import { addScore, bestScore, currentPlayer, useStore } from '../lib/scores'
import { GameShell } from './GameShell'

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
  const s = useStore()
  const p = currentPlayer(s)
  const [li, setLi] = useState(0)
  const level = SCHEMATIC_LEVELS[li]
  const [filled, setFilled] = useState<Record<number, SymbolKind>>({})
  const [pick, setPick] = useState<SymbolKind | null>(null)
  const [fails, setFails] = useState(0)
  const [result, setResult] = useState<null | { ok: boolean; wrong: number[]; points?: number; best?: number }>(null)

  const slots = level.els.map((e, i) => (e.slot ? i : -1)).filter((i) => i >= 0)
  const complete = slots.every((i) => filled[i])

  const reset = (idx: number) => {
    setLi(idx)
    setFilled({})
    setPick(null)
    setFails(0)
    setResult(null)
  }

  const check = () => {
    const wrong = slots.filter((i) => filled[i] !== level.els[i].kind)
    if (wrong.length === 0) {
      const points = Math.max(40, 100 - fails * 15)
      const best = p ? bestScore(s, p.id, 'plano', level.id) : 0
      addScore('plano', points, level.id)
      setResult({ ok: true, wrong, points, best })
    } else {
      setFails((f) => f + 1)
      setResult({ ok: false, wrong })
    }
  }

  return (
    <GameShell title="Completá el plano" icon="📐" info="Elegí un símbolo de la caja de herramientas y tocá el lugar con “?” donde va. Cuando esté completo, comprobá.">
      <div className="level-tabs">
        {SCHEMATIC_LEVELS.map((l, i) => {
          const b = p ? bestScore(s, p.id, 'plano', l.id) : 0
          return (
            <button key={l.id} type="button" className={`chip ${i === li ? 'active' : ''}`} onClick={() => reset(i)}>
              {l.title} {b > 0 && <small>· {b} pts</small>}
            </button>
          )
        })}
      </div>
      <div className="schematic-layout">
        <div className="card">
          <h3>{level.title}</h3>
          <p>{level.goal}</p>
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
                    el.slot && !result?.ok
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
          <div className="row">
            <button type="button" className="btn primary" disabled={!complete || result?.ok} onClick={check}>
              Comprobar
            </button>
            <button type="button" className="btn" onClick={() => reset(li)}>
              Reiniciar
            </button>
            {result && !result.ok && <span className="feedback bad">✘ Hay {result.wrong.length} símbolo(s) mal ubicados (en rojo). −15 pts</span>}
          </div>
          {result?.ok && (
            <div className="card result inline">
              <p className="record">✔ ¡Plano correcto! +{result.points} puntos</p>
              {result.best! >= result.points! && result.best! > 0 && <p>Tu récord en este nivel sigue siendo {result.best}.</p>}
              {li + 1 < SCHEMATIC_LEVELS.length && (
                <button type="button" className="btn primary" onClick={() => reset(li + 1)}>
                  Siguiente nivel →
                </button>
              )}
            </div>
          )}
        </div>
        <aside className="card toolbox">
          <h3>Caja de herramientas</h3>
          <div className="palette">
            {level.palette.map((k) => (
              <button key={k} type="button" className={`palette-item ${pick === k ? 'active' : ''}`} onClick={() => setPick(pick === k ? null : k)}>
                <SymbolIcon kind={k} size={70} />
                <span>{SYMBOL_NAMES[k]}</span>
              </button>
            ))}
          </div>
          <p className="hint">Tocá un símbolo ya colocado (sin nada elegido) para quitarlo.</p>
        </aside>
      </div>
    </GameShell>
  )
}
