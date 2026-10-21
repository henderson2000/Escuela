import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  BLOCKS,
  BLOCK_ORDER,
  DEVICE_NAMES,
  MAX_I,
  MAX_Q,
  OUTPUT_NAMES,
  SCAN_MS,
  Simulation,
  inputConf,
  isMomentary,
  newId,
  outputConf,
  type Block,
  type BlockType,
  type InputDevice,
  type OutputKind,
  type Program,
  type Wire,
} from './engine'
import './logo.css'

/* ------------------------------------------------------------------ geometría */

const PIN = 18
const HEAD = 16
const GRID = 10

function size(b: Block) {
  const pins = Math.max(1, BLOCKS[b.type].pins.length)
  const w = b.type === 'I' || b.type === 'Q' ? 96 : 84
  return { w, h: HEAD + pins * PIN + 6 }
}
const inPinPos = (b: Block, i: number) => ({ x: b.x, y: b.y + HEAD + i * PIN + PIN / 2 })
function outPinPos(b: Block) {
  const { w, h } = size(b)
  return { x: b.x + w, y: b.y + h / 2 }
}
const snap = (v: number) => Math.round(v / GRID) * GRID

function wirePath(prog: Program, w: Wire): string | null {
  const a = prog.blocks.find((b) => b.id === w.from)
  const b = prog.blocks.find((x) => x.id === w.to)
  if (!a || !b) return null
  const p1 = outPinPos(a)
  const p2 = inPinPos(b, w.pin)
  if (p2.x > p1.x + 24) {
    const mx = Math.round((p1.x + p2.x) / 2)
    return `M${p1.x} ${p1.y}H${mx}V${p2.y}H${p2.x}`
  }
  // cable que vuelve hacia atrás (realimentación): pasa por debajo de los bloques
  const x0 = p2.x - 14
  const x1 = p1.x + 14
  let below = Math.max(a.y + size(a).h, b.y + size(b).h)
  for (const o of prog.blocks) {
    const so = size(o)
    if (o.x < x1 && o.x + so.w > x0 && o.y + so.h > below && o.y < below + 30) below = o.y + so.h
  }
  below += 14
  return `M${p1.x} ${p1.y}H${p1.x + 14}V${below}H${p2.x - 14}V${p2.y}H${p2.x}`
}

/* ------------------------------------------------------------------ helpers de programa */

function cloneProg(p: Program): Program {
  return JSON.parse(JSON.stringify(p))
}

function isProgram(x: unknown): x is Program {
  const p = x as Program
  return !!p && Array.isArray(p.blocks) && Array.isArray(p.wires) && !!p.io && typeof p.io === 'object'
}

const fmtSec = (ms: number) => (ms / 1000).toLocaleString('es-AR', { maximumFractionDigits: 2 })

function paramText(b: Block): string {
  const p = { ...BLOCKS[b.type].defaults, ...b.params }
  if (b.type === 'TON' || b.type === 'TOF') return `T = ${fmtSec(p.T ?? 0)} s`
  if (b.type === 'GEN') return `${fmtSec(p.TH ?? 0)} / ${fmtSec(p.TL ?? 0)} s`
  if (b.type === 'CNT') return `On ${p.on} · Off ${p.off}`
  return ''
}

/* ------------------------------------------------------------------ editor */

export interface EditorProps {
  initial: Program
  /** guarda el programa en el navegador con esta clave */
  storageKey?: string
  /** sólo simular (no se puede editar) */
  readOnly?: boolean
  /** los bornes vienen fijos con el ejercicio: no se cambian dispositivos ni nombres */
  lockIO?: boolean
  onChange?: (p: Program) => void
  /** botones extra en la barra (por ejemplo "Comprobar") */
  actions?: ReactNode
  /** alto mínimo del área de dibujo en px */
  minHeight?: number
}

type Sel = { kind: 'block'; id: string } | { kind: 'wire'; id: string } | null
type Pending = { from: string } | { to: string; pin: number } | null

export function LogoEditor({ initial, storageKey, readOnly, lockIO, onChange, actions, minHeight = 380 }: EditorProps) {
  const [prog, setProg] = useState<Program>(() => {
    if (storageKey) {
      try {
        const raw = localStorage.getItem(storageKey)
        const saved = raw ? JSON.parse(raw) : null
        if (isProgram(saved)) return saved
      } catch {
        /* sin almacenamiento */
      }
    }
    return cloneProg(initial)
  })
  const history = useRef<Program[]>([])
  const [sel, setSel] = useState<Sel>(null)
  const [pending, setPending] = useState<Pending>(null)
  const [zoom, setZoom] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 700 ? 0.6 : 1))
  const [running, setRunning] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [, setFrame] = useState(0)
  const svgRef = useRef<SVGSVGElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const sim = useRef<Simulation>(null as unknown as Simulation)
  if (!sim.current) sim.current = new Simulation(prog)

  // arrastre de bloques y cables en curso
  const drag = useRef<{ id: string; dx: number; dy: number; moved: boolean; before: Program } | null>(null)
  const [link, setLink] = useState<{ from: string; x: number; y: number } | null>(null)
  const linkStart = useRef<{ x: number; y: number } | null>(null)

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  useEffect(() => {
    sim.current.setProgram(prog)
    onChangeRef.current?.(prog)
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(prog))
      } catch {
        /* sin almacenamiento */
      }
    }
  }, [prog, storageKey])

  /* ---------------- ciclo de simulación */
  useEffect(() => {
    if (!running) return
    let raf = 0
    let last = performance.now()
    let acc = 0
    const loop = (now: number) => {
      acc += Math.min(250, now - last) * speed
      last = now
      let n = 0
      while (acc >= SCAN_MS && n < 20000) {
        sim.current.scan()
        acc -= SCAN_MS
        n++
      }
      setFrame((f) => (f + 1) % 1e6)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
    }
  }, [running, speed])

  /* ---------------- cambios con historial */
  const commit = useCallback((next: Program, before?: Program) => {
    history.current.push(before ?? prog)
    if (history.current.length > 60) history.current.shift()
    setProg(next)
  }, [prog])

  const undo = () => {
    const prev = history.current.pop()
    if (prev) {
      setProg(prev)
      setSel(null)
    }
  }

  const update = (fn: (p: Program) => void) => {
    const next = cloneProg(prog)
    fn(next)
    commit(next)
  }

  /* ---------------- agregar / borrar */
  const freeSpot = (b: Block): Block => {
    const wrap = wrapRef.current
    let x = snap(((wrap?.scrollLeft ?? 0) + (wrap?.clientWidth ?? 600) / 2) / zoom - 40)
    let y = snap(((wrap?.scrollTop ?? 0) + (wrap?.clientHeight ?? 400) / 2) / zoom - 30)
    const { w, h } = size(b)
    const hit = (x0: number, y0: number) =>
      prog.blocks.some((o) => {
        const s = size(o)
        return x0 < o.x + s.w + 10 && x0 + w + 10 > o.x && y0 < o.y + s.h + 10 && y0 + h + 10 > o.y
      })
    for (let i = 0; i < 40 && hit(x, y); i++) {
      x += 30
      y += 20
    }
    return { ...b, x: Math.max(10, x), y: Math.max(10, y) }
  }

  const usedQ = new Set(prog.blocks.filter((b) => b.type === 'Q').map((b) => b.n ?? 1))
  const ioI = Object.keys(prog.io.I).map(Number).sort((a, b) => a - b)
  const ioQ = Object.keys(prog.io.Q).map(Number).sort((a, b) => a - b)

  const addBlock = (type: BlockType, n?: number) => {
    if (readOnly) return
    let num = n
    if (type === 'I' && num === undefined) {
      const placed = new Set(prog.blocks.filter((b) => b.type === 'I').map((b) => b.n ?? 1))
      num = Array.from({ length: MAX_I }, (_, i) => i + 1).find((k) => !placed.has(k)) ?? 1
    }
    if (type === 'Q' && num === undefined) {
      num = Array.from({ length: MAX_Q }, (_, i) => i + 1).find((k) => !usedQ.has(k))
      if (num === undefined) return
    }
    const b = freeSpot({ id: newId(), type, x: 0, y: 0, n: num, params: BLOCKS[type].defaults ? { ...BLOCKS[type].defaults } : undefined })
    update((p) => {
      p.blocks.push(b)
      if (type === 'I' && num && !p.io.I[num]) p.io.I[num] = { dev: 'NA', label: '' }
      if (type === 'Q' && num && !p.io.Q[num]) p.io.Q[num] = { kind: 'lampara', label: '' }
    })
    setSel({ kind: 'block', id: b.id })
  }

  const removeSelected = () => {
    if (readOnly || !sel) return
    if (sel.kind === 'wire') {
      update((p) => {
        p.wires = p.wires.filter((w) => w.id !== sel.id)
      })
    } else {
      const b = prog.blocks.find((x) => x.id === sel.id)
      if (!b || b.locked) return
      update((p) => {
        p.blocks = p.blocks.filter((x) => x.id !== sel.id)
        p.wires = p.wires.filter((w) => w.from !== sel.id && w.to !== sel.id)
      })
    }
    setSel(null)
  }

  const connect = (from: string, to: string, pin: number) => {
    if (readOnly) return
    update((p) => {
      p.wires = p.wires.filter((w) => !(w.to === to && w.pin === pin))
      p.wires.push({ id: newId('w'), from, to, pin })
    })
    setPending(null)
  }

  /* ---------------- teclado */
  useEffect(() => {
    if (readOnly) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, select, textarea')) return
      if ((e.key === 'Delete' || e.key === 'Backspace') && sel) {
        e.preventDefault()
        removeSelected()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undo()
      } else if (e.key === 'Escape') {
        setPending(null)
        setSel(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  })

  /* ---------------- puntero */
  const toWorld = (e: { clientX: number; clientY: number }) => {
    const svg = svgRef.current
    const m = svg?.getScreenCTM()
    if (!svg || !m) return { x: 0, y: 0 }
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    return { x: p.x, y: p.y }
  }

  const nearestInPin = (x: number, y: number, exclude?: string) => {
    let best: { id: string; pin: number; d: number } | null = null
    for (const b of prog.blocks) {
      if (b.id === exclude) continue
      BLOCKS[b.type].pins.forEach((_, i) => {
        const p = inPinPos(b, i)
        const d = Math.hypot(p.x - x, p.y - y)
        if (d < 16 && (!best || d < best.d)) best = { id: b.id, pin: i, d }
      })
    }
    return best as { id: string; pin: number; d: number } | null
  }
  const capture = (id: number) => {
    try {
      svgRef.current?.setPointerCapture(id)
    } catch {
      /* sin captura */
    }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    const el = (e.target as Element).closest('[data-kind]') as HTMLElement | null
    const kind = el?.dataset.kind
    const id = el?.dataset.id ?? ''
    if (kind === 'switch') return // lo maneja el propio interruptor
    if (readOnly) return
    if (kind === 'out') {
      e.preventDefault()
      const w = toWorld(e)
      if (pending && 'to' in pending) {
        connect(id, pending.to, pending.pin)
        return
      }
      linkStart.current = w
      setLink({ from: id, x: w.x, y: w.y })
      capture(e.pointerId)
      return
    }
    if (kind === 'in') {
      e.preventDefault()
      const pin = Number(el?.dataset.pin)
      if (pending && 'from' in pending) connect(pending.from, id, pin)
      else setPending({ to: id, pin })
      return
    }
    if (kind === 'wire') {
      setSel({ kind: 'wire', id })
      setPending(null)
      return
    }
    if (kind === 'block') {
      e.preventDefault()
      const b = prog.blocks.find((x) => x.id === id)
      if (!b) return
      const w = toWorld(e)
      drag.current = { id, dx: w.x - b.x, dy: w.y - b.y, moved: false, before: prog }
      setSel({ kind: 'block', id })
      capture(e.pointerId)
      return
    }
    // fondo
    setSel(null)
    setPending(null)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (drag.current) {
      const d = drag.current
      const w = toWorld(e)
      const x = Math.max(0, snap(w.x - d.dx))
      const y = Math.max(0, snap(w.y - d.dy))
      const b = prog.blocks.find((q) => q.id === d.id)
      if (b && (b.x !== x || b.y !== y)) {
        d.moved = true
        setProg((p) => ({ ...p, blocks: p.blocks.map((q) => (q.id === d.id ? { ...q, x, y } : q)) }))
      }
    } else if (link) {
      const w = toWorld(e)
      setLink({ ...link, x: w.x, y: w.y })
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (drag.current) {
      const d = drag.current
      drag.current = null
      if (d.moved) {
        history.current.push(d.before)
        if (history.current.length > 60) history.current.shift()
      }
    }
    if (link) {
      const w = toWorld(e)
      const start = linkStart.current
      const target = nearestInPin(w.x, w.y)
      setLink(null)
      if (target) connect(link.from, target.id, target.pin)
      else if (start && Math.hypot(start.x - w.x, start.y - w.y) < 8) setPending({ from: link.from }) // toque: elegir después la entrada
      else setPending(null)
    }
  }

  /* ---------------- entradas físicas */
  const press = (n: number, down: boolean) => {
    const dev = inputConf(prog, n).dev
    if (isMomentary(dev)) sim.current.actuated[n] = down
    else if (down) sim.current.actuated[n] = !sim.current.actuated[n]
    setFrame((f) => f + 1)
  }

  /* ---------------- dibujo */
  const world = useMemo(() => {
    let w = 760
    let h = minHeight
    for (const b of prog.blocks) {
      const s = size(b)
      w = Math.max(w, b.x + s.w + 160)
      h = Math.max(h, b.y + s.h + 90)
    }
    return { w, h }
  }, [prog.blocks, minHeight])

  const s = sim.current
  const val = (id: string) => s.value[id] ?? 0
  const selBlock = sel?.kind === 'block' ? prog.blocks.find((b) => b.id === sel.id) : undefined
  const pendingFromPos = pending && 'from' in pending ? prog.blocks.find((b) => b.id === pending.from) : undefined
  const placedI = [...new Set(prog.blocks.filter((b) => b.type === 'I').map((b) => b.n ?? 1))].sort((a, b) => a - b)
  const placedQ = [...usedQ].sort((a, b) => a - b)

  const palette = (
    <div className="logo-palette">
      <div className="pal-group">
        <span className="pal-title">Entradas</span>
        {lockIO ? (
          ioI.map((n) => (
            <button key={n} type="button" className="pal-btn io" onClick={() => addBlock('I', n)} title={`Agregar I${n}`}>
              I{n}
              {prog.io.I[n]?.label && <small>{prog.io.I[n].label}</small>}
            </button>
          ))
        ) : (
          <button type="button" className="pal-btn io" onClick={() => addBlock('I')}>
            I <small>Entrada</small>
          </button>
        )}
      </div>
      <div className="pal-group">
        <span className="pal-title">Salidas</span>
        {lockIO ? (
          ioQ.map((n) => (
            <button key={n} type="button" className="pal-btn io" disabled={usedQ.has(n)} onClick={() => addBlock('Q', n)} title={`Agregar Q${n}`}>
              Q{n}
              {prog.io.Q[n]?.label && <small>{prog.io.Q[n].label}</small>}
            </button>
          ))
        ) : (
          <button type="button" className="pal-btn io" disabled={usedQ.size >= MAX_Q} onClick={() => addBlock('Q')}>
            Q <small>Salida</small>
          </button>
        )}
      </div>
      <div className="pal-group">
        <span className="pal-title">Básicas (GF)</span>
        {BLOCK_ORDER.filter((t) => BLOCKS[t].group === 'gf').map((t) => (
          <button key={t} type="button" className="pal-btn" onClick={() => addBlock(t)} title={BLOCKS[t].desc}>
            <MiniSymbol type={t} />
            <small>{t}</small>
          </button>
        ))}
      </div>
      <div className="pal-group">
        <span className="pal-title">Especiales (SF)</span>
        {BLOCK_ORDER.filter((t) => BLOCKS[t].group === 'sf').map((t) => (
          <button key={t} type="button" className="pal-btn wide" onClick={() => addBlock(t)} title={BLOCKS[t].desc}>
            <b>{BLOCKS[t].symbol}</b>
            <small>{BLOCKS[t].name}</small>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className={`logo-editor ${readOnly ? 'readonly' : ''}`}>
      <div className="logo-toolbar">
        <button type="button" className={`btn small ${running ? '' : 'primary'}`} onClick={() => setRunning(!running)}>
          {running ? '⏸ Pausar' : '▶ Simular'}
        </button>
        <button
          type="button"
          className="btn small"
          onClick={() => {
            s.reset()
            setFrame((f) => f + 1)
          }}
          title="Vuelve todo a cero (como apagar y prender el LOGO!)"
        >
          ⟲ Reiniciar
        </button>
        <label className="speed">
          Velocidad
          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
            <option value={1}>×1</option>
            <option value={10}>×10</option>
            <option value={60}>×60</option>
          </select>
        </label>
        <span className="sim-time">⏱ {fmtClock(s.time)}</span>
        <span className="grow" />
        {!readOnly && (
          <>
            <button type="button" className="btn small ghost" onClick={undo} disabled={history.current.length === 0} title="Deshacer (Ctrl+Z)">
              ↶ Deshacer
            </button>
            <button type="button" className="btn small ghost" onClick={removeSelected} disabled={!sel || (sel.kind === 'block' && !!selBlock?.locked)} title="Borrar lo seleccionado (Supr)">
              🗑 Borrar
            </button>
            <button
              type="button"
              className="btn small ghost"
              onClick={() => {
                commit(cloneProg(initial))
                setSel(null)
              }}
              title="Volver al programa inicial"
            >
              Empezar de nuevo
            </button>
          </>
        )}
        <button type="button" className="btn small ghost" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(1)))} aria-label="Alejar">
          −
        </button>
        <button type="button" className="btn small ghost" onClick={() => setZoom((z) => Math.min(1.8, +(z + 0.1).toFixed(1)))} aria-label="Acercar">
          +
        </button>
        {actions}
      </div>

      <div className="logo-body">
        {!readOnly && palette}

        <div className="logo-canvas" ref={wrapRef}>
          {pending && <div className="pending-hint">{'from' in pending ? 'Ahora tocá la entrada (pin izquierdo) donde va el cable' : 'Ahora tocá la salida (pin derecho) de donde viene la señal'} · Esc para cancelar</div>}
          <svg
            ref={svgRef}
            width={world.w * zoom}
            height={world.h * zoom}
            viewBox={`0 0 ${world.w} ${world.h}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <defs>
              <pattern id="logo-grid" width={GRID * 2} height={GRID * 2} patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" className="grid-dot" />
              </pattern>
            </defs>
            <rect width={world.w} height={world.h} fill="url(#logo-grid)" />

            {/* cables */}
            {prog.wires.map((w) => {
              const d = wirePath(prog, w)
              if (!d) return null
              const on = val(w.from) === 1
              const selected = sel?.kind === 'wire' && sel.id === w.id
              return (
                <g key={w.id}>
                  <path d={d} className={`wire ${on ? 'on' : ''} ${selected ? 'sel' : ''}`} />
                  <path d={d} className="wire-hit" data-kind="wire" data-id={w.id} />
                </g>
              )
            })}
            {link && (() => {
              const b = prog.blocks.find((x) => x.id === link.from)
              if (!b) return null
              const p = outPinPos(b)
              return <path d={`M${p.x} ${p.y}L${link.x} ${link.y}`} className="wire temp" />
            })()}

            {/* bloques */}
            {prog.blocks.map((b) => (
              <BlockView
                key={b.id}
                b={b}
                prog={prog}
                sim={s}
                selected={sel?.kind === 'block' && sel.id === b.id}
                pendingIn={pending && 'to' in pending && pending.to === b.id ? pending.pin : null}
                pendingOut={!!pendingFromPos && pendingFromPos.id === b.id}
                onPress={press}
                readOnly={readOnly}
              />
            ))}
          </svg>
        </div>

        {!readOnly && (
          <aside className="logo-props">
            {selBlock ? (
              <BlockProps
                b={selBlock}
                prog={prog}
                lockIO={lockIO}
                count={s.count(selBlock.id)}
                elapsed={s.elapsed(selBlock.id)}
                onUpdate={update}
                onDelete={removeSelected}
              />
            ) : sel?.kind === 'wire' ? (
              <div>
                <h4>Cable</h4>
                <p className="hint">Lleva la señal de una salida a una entrada. Rojo = 1, azul = 0.</p>
                <button type="button" className="btn small danger" onClick={removeSelected}>
                  Borrar cable
                </button>
              </div>
            ) : (
              <div className="props-help">
                <h4>Cómo se usa</h4>
                <ol>
                  <li>Agregá bloques desde la izquierda.</li>
                  <li>Arrastrá desde el <b>pin derecho</b> (salida) de un bloque hasta el <b>pin izquierdo</b> (entrada) de otro para unirlos. También podés tocar un pin y después el otro.</li>
                  <li>Tocá un bloque para ver y cambiar sus datos.</li>
                  <li>Probalo: tocá los botones de las entradas. <span className="on-text">Rojo = 1</span>, <span className="off-text">azul = 0</span>.</li>
                </ol>
              </div>
            )}
          </aside>
        )}
      </div>

      <SimPanel prog={prog} sim={s} inputs={lockIO ? ioI : placedI} outputs={lockIO ? ioQ : placedQ} onPress={press} />
    </div>
  )
}

const fmtClock = (ms: number) => {
  const t = Math.floor(ms / 100) / 10
  const m = Math.floor(t / 60)
  const sec = (t % 60).toFixed(1).replace('.', ',')
  return m > 0 ? `${m}:${sec.padStart(4, '0')}` : `${sec} s`
}

/* ------------------------------------------------------------------ bloque */

function BlockView({
  b,
  prog,
  sim,
  selected,
  pendingIn,
  pendingOut,
  onPress,
  readOnly,
}: {
  b: Block
  prog: Program
  sim: Simulation
  selected: boolean
  pendingIn: number | null
  pendingOut: boolean
  onPress: (n: number, down: boolean) => void
  readOnly?: boolean
}) {
  const def = BLOCKS[b.type]
  const { w, h } = size(b)
  const q = sim.value[b.id] ?? 0
  const out = outPinPos(b)
  const connected = new Set(prog.wires.filter((x) => x.to === b.id).map((x) => x.pin))
  const n = b.n ?? 1
  const negated = b.type === 'NOT' || b.type === 'NAND' || b.type === 'NOR'

  let body: ReactNode = null
  let control: ReactNode = null
  let caption = ''
  if (b.type === 'I') {
    const c = inputConf(prog, n)
    const sig = sim.inputSignal(n)
    caption = c.label
    control = (
      <g
          data-kind="switch"
          className={`blk-switch ${sig ? 'on' : ''} ${sim.actuated[n] ? 'pressed' : ''}`}
          onPointerDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
            try {
              ;(e.target as Element).setPointerCapture?.(e.pointerId)
            } catch {
              /* sin captura */
            }
            onPress(n, true)
          }}
          onPointerUp={(e) => {
            e.stopPropagation()
            onPress(n, false)
          }}
          onPointerCancel={() => onPress(n, false)}
        >
          <rect x={b.x + w - 40} y={b.y + 9} width={30} height={22} rx={11} />
          <circle cx={sig ? b.x + w - 21 : b.x + w - 29} cy={b.y + 20} r={8} />
        </g>
    )
    body = (
      <>
        <text x={b.x + 8} y={b.y + 19} className="blk-io">
          I{n}
        </text>
        <text x={b.x + 8} y={b.y + 34} className="blk-small">
          {c.dev === 'INT_NC' ? 'NC ret.' : c.dev === 'INT' ? 'Interr.' : c.dev}
        </text>
      </>
    )
  } else if (b.type === 'Q') {
    const c = outputConf(prog, n)
    caption = c.label
    const color = c.color ?? (c.kind === 'lampara' ? '#facc15' : '#4ade80')
    body = (
      <>
        <text x={b.x + 14} y={b.y + 26} className="blk-io">
          Q{n}
        </text>
        <circle cx={b.x + w - 24} cy={b.y + h / 2} r={11} className="blk-lamp" style={q ? { fill: color, filter: `drop-shadow(0 0 6px ${color})` } : undefined} />
        <text x={b.x + w - 24} y={b.y + h / 2 + 4} className="blk-lamp-icon">
          {c.kind === 'motor' ? 'M' : c.kind === 'contactor' ? 'K' : c.kind === 'sirena' ? '♪' : c.kind === 'valvula' ? 'V' : ''}
        </text>
      </>
    )
  } else {
    const sym = def.symbol
    const extra = b.type === 'CNT' ? `Cnt = ${sim.count(b.id)}` : paramText(b)
    body = (
      <>
        <text x={b.x + w / 2 + 6} y={b.y + (def.group === 'gf' ? h / 2 + 7 : 30)} className={def.group === 'gf' ? 'blk-sym' : 'blk-sym sf'}>
          {sym}
        </text>
        {def.group === 'sf' && (
          <text x={b.x + w / 2 + 6} y={b.y + h - 8} className="blk-small center">
            {extra}
          </text>
        )}
        {(b.type === 'TON' || b.type === 'TOF') && sim.elapsed(b.id) > 0 && (
          <rect x={b.x + 18} y={b.y + h - 4} width={((w - 22) * Math.min(1, sim.elapsed(b.id) / (b.params?.T ?? BLOCKS[b.type].defaults?.T ?? 1)))} height={3} className="blk-progress" />
        )}
      </>
    )
  }

  return (
    <g className={`blk ${selected ? 'sel' : ''} ${b.locked ? 'locked' : ''}`}>
      <rect x={b.x} y={b.y} width={w} height={h} rx={5} className={`blk-body ${q ? 'on' : ''}`} data-kind="block" data-id={b.id} style={{ cursor: readOnly ? 'default' : 'grab' }} />
      <g pointerEvents="none">{body}</g>
      {control}
      {/* pines de entrada */}
      {def.pins.map((name, i) => {
        const p = inPinPos(b, i)
        const src = prog.wires.find((x) => x.to === b.id && x.pin === i)
        const v = src ? sim.value[src.from] ?? 0 : 0
        return (
          <g key={i}>
            <line x1={p.x - 10} y1={p.y} x2={p.x} y2={p.y} className={`pin-line ${connected.has(i) && v ? 'on' : ''}`} />
            {name && (
              <text x={p.x + 4} y={p.y + 4} className="pin-name">
                {name}
              </text>
            )}
            <circle cx={p.x - 10} cy={p.y} r={pendingIn === i ? 7 : 5} className={`pin in ${connected.has(i) ? 'used' : ''} ${pendingIn === i ? 'pending' : ''}`} data-kind="in" data-id={b.id} data-pin={i} />
            <circle cx={p.x - 10} cy={p.y} r={9} className="pin-hit" data-kind="in" data-id={b.id} data-pin={i} />
          </g>
        )
      })}
      {/* pin de salida */}
      <line x1={out.x} y1={out.y} x2={out.x + 10} y2={out.y} className={`pin-line ${q ? 'on' : ''}`} />
      {negated && <circle cx={out.x + 1} cy={out.y} r={4} className="neg-dot" />}
      <circle cx={out.x + 10} cy={out.y} r={pendingOut ? 7 : 5} className={`pin out ${pendingOut ? 'pending' : ''}`} data-kind="out" data-id={b.id} />
      <circle cx={out.x + 10} cy={out.y} r={11} className="pin-hit" data-kind="out" data-id={b.id} />
      {caption && (
        <text x={b.x + w / 2} y={b.y + h + 14} className="blk-caption">
          {caption}
        </text>
      )}
    </g>
  )
}

/* ------------------------------------------------------------------ propiedades */

function BlockProps({
  b,
  prog,
  lockIO,
  count,
  elapsed,
  onUpdate,
  onDelete,
}: {
  b: Block
  prog: Program
  lockIO?: boolean
  count: number
  elapsed: number
  onUpdate: (fn: (p: Program) => void) => void
  onDelete: () => void
}) {
  const def = BLOCKS[b.type]
  const n = b.n ?? 1
  const setParam = (k: keyof NonNullable<Block['params']>, v: number) =>
    onUpdate((p) => {
      const x = p.blocks.find((q) => q.id === b.id)
      if (x) x.params = { ...x.params, [k]: v }
    })
  const secField = (k: 'T' | 'TH' | 'TL', label: string) => (
    <label className="field">
      <span className="field-label">{label} (segundos)</span>
      <input
        className="input"
        type="number"
        min={0.01}
        step={0.1}
        value={(b.params?.[k] ?? def.defaults?.[k] ?? 0) / 1000}
        onChange={(e) => {
          const v = Number(e.target.value)
          if (Number.isFinite(v) && v > 0) setParam(k, Math.round(v * 1000))
        }}
      />
    </label>
  )

  return (
    <div>
      <h4>
        {b.type === 'I' ? `Entrada I${n}` : b.type === 'Q' ? `Salida Q${n}` : def.name}
      </h4>
      <p className="hint">{def.desc}</p>

      {b.type === 'I' && (
        <>
          {!b.locked && (
            <label className="field">
              <span className="field-label">Borne</span>
              <select
                className="input"
                value={n}
                onChange={(e) =>
                  onUpdate((p) => {
                    const k = Number(e.target.value)
                    const x = p.blocks.find((q) => q.id === b.id)
                    if (x) x.n = k
                    if (!p.io.I[k]) p.io.I[k] = { dev: 'NA', label: '' }
                  })
                }
              >
                {Array.from({ length: MAX_I }, (_, i) => i + 1)
                  .filter((k) => !lockIO || prog.io.I[k])
                  .map((k) => (
                    <option key={k} value={k}>
                      I{k}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {lockIO ? (
            <p className="hint">
              Conectado: <b>{DEVICE_NAMES[inputConf(prog, n).dev]}</b> {inputConf(prog, n).label && `· ${inputConf(prog, n).label}`}
            </p>
          ) : (
            <>
              <label className="field">
                <span className="field-label">¿Qué está conectado?</span>
                <select
                  className="input"
                  value={inputConf(prog, n).dev}
                  onChange={(e) =>
                    onUpdate((p) => {
                      p.io.I[n] = { ...inputConf(p, n), dev: e.target.value as InputDevice }
                    })
                  }
                >
                  {(Object.keys(DEVICE_NAMES) as InputDevice[]).map((d) => (
                    <option key={d} value={d}>
                      {DEVICE_NAMES[d]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="field-label">Nombre</span>
                <input
                  className="input"
                  value={inputConf(prog, n).label}
                  maxLength={18}
                  placeholder="Ej.: Marcha"
                  onChange={(e) =>
                    onUpdate((p) => {
                      p.io.I[n] = { ...inputConf(p, n), label: e.target.value }
                    })
                  }
                />
              </label>
            </>
          )}
          <p className="hint">
            {inputConf(prog, n).dev === 'NC' || inputConf(prog, n).dev === 'INT_NC'
              ? 'Ojo: es un contacto cerrado. En reposo le da 1 al LOGO!; al accionarlo, da 0.'
              : 'En reposo da 0; al accionarlo le da 1 al LOGO!.'}
          </p>
        </>
      )}

      {b.type === 'Q' && (
        <>
          {!b.locked && (
            <label className="field">
              <span className="field-label">Borne</span>
              <select
                className="input"
                value={n}
                onChange={(e) =>
                  onUpdate((p) => {
                    const k = Number(e.target.value)
                    const x = p.blocks.find((q) => q.id === b.id)
                    if (x) x.n = k
                    if (!p.io.Q[k]) p.io.Q[k] = { kind: 'lampara', label: '' }
                  })
                }
              >
                {Array.from({ length: MAX_Q }, (_, i) => i + 1)
                  .filter((k) => k === n || !prog.blocks.some((q) => q.type === 'Q' && (q.n ?? 1) === k))
                  .filter((k) => !lockIO || prog.io.Q[k])
                  .map((k) => (
                    <option key={k} value={k}>
                      Q{k}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {lockIO ? (
            <p className="hint">
              Conectado: <b>{OUTPUT_NAMES[outputConf(prog, n).kind]}</b> {outputConf(prog, n).label && `· ${outputConf(prog, n).label}`}
            </p>
          ) : (
            <>
              <label className="field">
                <span className="field-label">¿Qué está conectado?</span>
                <select
                  className="input"
                  value={outputConf(prog, n).kind}
                  onChange={(e) =>
                    onUpdate((p) => {
                      p.io.Q[n] = { ...outputConf(p, n), kind: e.target.value as OutputKind }
                    })
                  }
                >
                  {(Object.keys(OUTPUT_NAMES) as OutputKind[]).map((d) => (
                    <option key={d} value={d}>
                      {OUTPUT_NAMES[d]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="field-label">Nombre</span>
                <input
                  className="input"
                  value={outputConf(prog, n).label}
                  maxLength={18}
                  placeholder="Ej.: Motor"
                  onChange={(e) =>
                    onUpdate((p) => {
                      p.io.Q[n] = { ...outputConf(p, n), label: e.target.value }
                    })
                  }
                />
              </label>
              {outputConf(prog, n).kind === 'lampara' && (
                <div className="color-row">
                  {['#facc15', '#ef4444', '#22c55e', '#3b82f6', '#f8fafc', '#f97316'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`color-dot ${outputConf(prog, n).color === c ? 'active' : ''}`}
                      style={{ background: c }}
                      aria-label="Color de la lámpara"
                      onClick={() =>
                        onUpdate((p) => {
                          p.io.Q[n] = { ...outputConf(p, n), color: c }
                        })
                      }
                    />
                  ))}
                </div>
              )}
            </>
          )}
          <p className="hint">Para usar el estado de esta salida en otro bloque, sacá un cable desde su pin derecho.</p>
        </>
      )}

      {(b.type === 'TON' || b.type === 'TOF') && (
        <>
          {secField('T', 'Tiempo T')}
          <p className="hint">Tiempo transcurrido: {fmtSec(elapsed)} s</p>
        </>
      )}
      {b.type === 'GEN' && (
        <>
          {secField('TH', 'TH: tiempo prendido')}
          {secField('TL', 'TL: tiempo apagado')}
        </>
      )}
      {b.type === 'CNT' && (
        <>
          <label className="field">
            <span className="field-label">On (se activa al llegar a)</span>
            <input className="input" type="number" min={0} max={999999} value={b.params?.on ?? 5} onChange={(e) => setParam('on', Math.max(0, Math.round(Number(e.target.value) || 0)))} />
          </label>
          <label className="field">
            <span className="field-label">Off (se desactiva por debajo de)</span>
            <input className="input" type="number" min={0} max={999999} value={b.params?.off ?? 0} onChange={(e) => setParam('off', Math.max(0, Math.round(Number(e.target.value) || 0)))} />
          </label>
          <p className="hint">Cuenta actual: {count}</p>
        </>
      )}

      {!b.locked ? (
        <button type="button" className="btn small danger" onClick={onDelete}>
          Borrar bloque
        </button>
      ) : (
        <p className="hint">🔒 Este bloque viene con el ejercicio.</p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ panel de simulación */

function SimPanel({ prog, sim, inputs, outputs, onPress }: { prog: Program; sim: Simulation; inputs: number[]; outputs: number[]; onPress: (n: number, down: boolean) => void }) {
  if (!inputs.length && !outputs.length) return null
  return (
    <div className="sim-panel">
      <div className="sim-group">
        {inputs.map((n) => {
          const c = inputConf(prog, n)
          const sig = sim.inputSignal(n)
          const act = !!sim.actuated[n]
          return (
            <button
              key={n}
              type="button"
              className={`sim-in ${sig ? 'on' : ''} ${act ? 'pressed' : ''} dev-${c.dev}`}
              onPointerDown={(e) => {
                e.preventDefault()
                try {
                  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
                } catch {
                  /* sin captura */
                }
                onPress(n, true)
              }}
              onPointerUp={() => onPress(n, false)}
              onPointerCancel={() => onPress(n, false)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault()
                  if (!e.repeat) onPress(n, true)
                }
              }}
              onKeyUp={(e) => {
                if (e.key === ' ' || e.key === 'Enter') onPress(n, false)
              }}
              title={`${DEVICE_NAMES[c.dev]}${isMomentary(c.dev) ? ' (mantené apretado)' : ' (queda en la posición)'}`}
            >
              <span className="sim-led" />
              <b>I{n}</b>
              <small>{c.label || DEVICE_NAMES[c.dev]}</small>
              <em>{c.dev === 'INT_NC' ? (act ? 'accionado' : 'normal') : isMomentary(c.dev) ? (act ? 'apretado' : 'suelto') : act ? 'ON' : 'OFF'}</em>
            </button>
          )
        })}
      </div>
      <div className="sim-group">
        {outputs.map((n) => {
          const c = outputConf(prog, n)
          const on = sim.output(n) === 1
          const color = c.color ?? (c.kind === 'lampara' ? '#facc15' : '#4ade80')
          return (
            <div key={n} className={`sim-out ${on ? 'on' : ''}`}>
              <span className={`sim-lamp kind-${c.kind}`} style={on ? { background: color, boxShadow: `0 0 14px ${color}` } : undefined}>
                {c.kind === 'motor' ? <span className={`motor-icon ${on ? 'spin' : ''}`}>✇</span> : null}
              </span>
              <b>Q{n}</b>
              <small>{c.label || OUTPUT_NAMES[c.kind]}</small>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ icono chico para la paleta */

function MiniSymbol({ type }: { type: BlockType }) {
  const neg = type === 'NOT' || type === 'NAND' || type === 'NOR'
  return (
    <svg width="34" height="26" viewBox="0 0 34 26" aria-hidden>
      <rect x="6" y="3" width="18" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text x="15" y="17" textAnchor="middle" fontSize="9" fontWeight="700" fill="currentColor">
        {BLOCKS[type].symbol}
      </text>
      <line x1="0" y1={type === 'NOT' ? 13 : 9} x2="6" y2={type === 'NOT' ? 13 : 9} stroke="currentColor" strokeWidth="1.5" />
      {type !== 'NOT' && <line x1="0" y1="17" x2="6" y2="17" stroke="currentColor" strokeWidth="1.5" />}
      {neg && <circle cx="26.5" cy="13" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />}
      <line x1={neg ? 29 : 24} y1="13" x2="34" y2="13" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
