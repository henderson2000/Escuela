import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSub } from '../../../lib/nav'
import { BULBS, isDone, markActivity, useStore } from '../../../lib/scores'
import { BulbPurchase } from '../../../components/Bulbs'
import { NotFound } from '../../../components/ui'
import { Blockly, darkTheme, setupBlocks, toolboxFor } from './blocks'
import { checkGoal, countBlocks, run, type Program } from './interpreter'
import { LEVELS, getLevel, levelActivityId, parseMap, type Level, type MapState } from './world'
import { WorldView } from './World'
import './bloques.css'

const START: Program = { blocks: { blocks: [{ type: 'al_empezar', id: 'inicio', x: 24, y: 24 } as never] } }
const storageKey = (id: string) => `bloques-${id}`

function loadProgram(id: string): Program {
  try {
    const raw = localStorage.getItem(storageKey(id))
    if (raw) return JSON.parse(raw)
  } catch {
    /* sin almacenamiento */
  }
  return START
}

export function LevelPage() {
  const { id } = useParams()
  const level = getLevel(id)
  const sub = useSub()
  if (!level) return <NotFound what="ese nivel" back={sub('/bloques')} backLabel="Ver los niveles" />
  return <LevelView key={level.id} level={level} />
}

type Status = { kind: 'idle' } | { kind: 'running' } | { kind: 'ok' } | { kind: 'bad'; msg: string; map: number }

function LevelView({ level }: { level: Level }) {
  const sub = useSub()
  const s = useStore()
  const solved = isDone(s, levelActivityId(level.id))
  const maps = useMemo(() => level.maps.map(parseMap), [level])
  const [mapIdx, setMapIdx] = useState(0)
  const [view, setView] = useState<{ state: MapState; say?: string; crashed?: boolean }>({ state: maps[0] })
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [count, setCount] = useState(0)
  const [speed, setSpeed] = useState(2)
  const host = useRef<HTMLDivElement>(null)
  const ws = useRef<Blockly.WorkspaceSvg | null>(null)
  const timer = useRef<number | null>(null)

  const idx = LEVELS.indexOf(level)
  const prev = LEVELS[idx - 1]
  const next = LEVELS[idx + 1]

  // editor de bloques
  useEffect(() => {
    setupBlocks()
    const el = host.current
    if (!el) return
    const w = Blockly.inject(el, {
      toolbox: toolboxFor(level.toolbox),
      theme: darkTheme(),
      renderer: 'zelos',
      trashcan: true,
      sounds: false,
      // íconos de Blockly desde la propia página (no desde otro sitio)
      media: 'blockly/',
      zoom: { controls: true, wheel: false, startScale: 0.85, maxScale: 1.6, minScale: 0.5 },
      move: { scrollbars: true, drag: true, wheel: true },
    })
    ws.current = w
    try {
      Blockly.serialization.workspaces.load(loadProgram(level.id) as object, w)
    } catch {
      Blockly.serialization.workspaces.load(START as object, w)
    }
    const save = () => {
      const json = Blockly.serialization.workspaces.save(w) as Program
      setCount(countBlocks(json))
      try {
        localStorage.setItem(storageKey(level.id), JSON.stringify(json))
      } catch {
        /* sin almacenamiento */
      }
    }
    save()
    w.addChangeListener((e) => {
      if (!e.isUiEvent) save()
    })
    const onResize = () => Blockly.svgResize(w)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      if (timer.current) window.clearInterval(timer.current)
      w.dispose()
      ws.current = null
    }
  }, [level])

  const stop = () => {
    if (timer.current) window.clearInterval(timer.current)
    timer.current = null
    ws.current?.highlightBlock(null)
  }

  const reset = (m = mapIdx) => {
    stop()
    setStatus({ kind: 'idle' })
    setView({ state: maps[m] })
  }

  const play = () => {
    const w = ws.current
    if (!w) return
    stop()
    const prog = Blockly.serialization.workspaces.save(w) as Program
    const n = countBlocks(prog)
    if (level.maxBlocks && n > level.maxBlocks) {
      setStatus({ kind: 'bad', msg: `Usaste ${n} bloques y el máximo es ${level.maxBlocks}. Buscá una forma más corta (¿una repetición?).`, map: mapIdx })
      return
    }
    // se prueba en todos los mapas; se muestra el primero que falla (o el elegido si anda en todos)
    const results = maps.map((m) => run(prog, m))
    const fails = results.map((r, k) => checkGoal(level, maps[k], r))
    const firstBad = fails.findIndex((f) => f !== null)
    const show = firstBad >= 0 ? firstBad : mapIdx
    setMapIdx(show)
    const r = results[show]
    setStatus({ kind: 'running' })
    let k = -1
    let lastSay: string | undefined
    setView({ state: maps[show] })
    timer.current = window.setInterval(
      () => {
        k++
        if (k >= r.steps.length) {
          stop()
          if (r.error && r.errorBlock) w.highlightBlock(r.errorBlock)
          setView((v) => ({ ...v, crashed: !!r.error }))
          if (firstBad < 0) {
            setStatus({ kind: 'ok' })
            markActivity(levelActivityId(level.id), true, BULBS.leccion, `Bloques: ${level.title}`)
          } else setStatus({ kind: 'bad', msg: fails[firstBad]!, map: firstBad })
          return
        }
        const st = r.steps[k]
        if (st.say !== undefined) lastSay = st.say
        w.highlightBlock(st.blockId)
        setView({ state: st.state, say: lastSay })
      },
      [700, 380, 160, 60][speed],
    )
  }

  const shownMap = status.kind === 'running' ? mapIdx : mapIdx

  return (
    <div className="page wide bl-page">
      <div className="bl-head">
        <Link to={sub('/bloques')} className="back">
          ← Niveles
        </Link>
        <h1>
          <span className="ex-n big">{level.n}</span> {level.title} {solved && <span className="tag ok">✔ resuelto</span>}
        </h1>
        <p className="lead">
          <b>{level.concept}.</b> {level.learn}
        </p>
      </div>

      <div className="bl-layout">
        <section className="card bl-left">
          <p className="bl-goal">🎯 {level.goal}</p>
          {level.maps.length > 1 && (
            <div className="row wrap bl-maps" role="tablist" aria-label="Mapas de prueba">
              {maps.map((_, k) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={shownMap === k}
                  className={`chip ${shownMap === k ? 'active' : ''}`}
                  disabled={status.kind === 'running'}
                  onClick={() => {
                    setMapIdx(k)
                    reset(k)
                  }}
                >
                  Prueba {k + 1}
                </button>
              ))}
            </div>
          )}
          <WorldView state={view.state} say={view.say} crashed={view.crashed} />
          <div className="row wrap bl-actions">
            <button type="button" className="btn primary" onClick={play} disabled={status.kind === 'running'}>
              ▶ Ejecutar
            </button>
            <button type="button" className="btn" onClick={() => reset()}>
              ⟲ Reiniciar
            </button>
            <label className="bl-speed">
              Velocidad
              <input type="range" min={0} max={3} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} aria-label="Velocidad" />
            </label>
          </div>
          <p className={`bl-count ${level.maxBlocks && count > level.maxBlocks ? 'over' : ''}`}>
            Bloques usados: <b>{count}</b>
            {level.maxBlocks ? ` de ${level.maxBlocks} como máximo` : ''}
          </p>
          {status.kind === 'ok' && (
            <div className="card check-result ok">
              <strong>✔ ¡Resuelto!</strong> {level.maps.length > 1 ? `Tu programa anduvo en las ${level.maps.length} pruebas.` : 'El robot cumplió el objetivo.'}
              {next && (
                <div className="row">
                  <Link to={sub(`/bloques/${next.id}`)} className="btn primary small">
                    Siguiente nivel →
                  </Link>
                </div>
              )}
            </div>
          )}
          {status.kind === 'bad' && (
            <div className="card check-result bad">
              <strong>✘ </strong>
              {level.maps.length > 1 && <b>Prueba {status.map + 1}: </b>}
              {status.msg}
            </div>
          )}
          <BulbPurchase itemKey={`hint:${levelActivityId(level.id)}`} cost={BULBS.pista} label="Ver una pista" what={`Pista: bloques ${level.n}`}>
            {level.hint}
          </BulbPurchase>
        </section>

        <section className="bl-editor-wrap">
          <div ref={host} className="bl-editor" aria-label="Editor de bloques" />
          <p className="hint">Arrastrá los bloques desde la izquierda y encastralos debajo de «al empezar». Para borrar, llevalos a la papelera.</p>
        </section>
      </div>

      <div className="row space wrap ex-nav">
        {prev ? (
          <Link to={sub(`/bloques/${prev.id}`)} className="btn">
            ← Nivel {prev.n}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={sub(`/bloques/${next.id}`)} className="btn primary">
            Nivel {next.n} →
          </Link>
        )}
      </div>
    </div>
  )
}
