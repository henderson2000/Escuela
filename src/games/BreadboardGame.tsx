import { useMemo, useState } from 'react'
import * as THREE from 'three'
import { Label } from '../three/Label'
import type { ThreeEvent } from '@react-three/fiber'
import { Viewer } from '../three/Viewer'
import { BreadboardBody } from '../three/models/Breadboard'
import { ArduinoModel, PCB_T, arduinoPinPositions } from '../three/models/Arduino'
import { Wire } from '../three/helpers'
import { boardSize, buildHoles, describeHole, type Hole } from '../lib/breadboard'
import { LEG_NAMES, buildNetlist, type Placed } from '../lib/circuit'
import { COLORS, valueToBands } from '../lib/resistor'
import { addScore, bestScore, currentPlayer, useStore } from '../lib/scores'
import { BB_LEVELS, type Tool } from './breadboardLevels'
import { GameShell } from './GameShell'

const COLS = 30
const TOP = boardSize(COLS).height / 2
const ARD_POS: [number, number, number] = [0.6, -0.22, -5.75]
const HEADER_TOP = PCB_T / 2 + 0.86 - 0.3 // el modelo del Arduino está corrido 0.3 hacia abajo

const PIN_LABEL: Record<string, string> = {
  GND2: 'GND',
  GND3: 'GND',
  '3.3V': '3,3V',
}

/** Pines del Arduino que se pueden usar en el juego */
const USABLE_PINS = ['13', '12', '11', '10', '9', '8', '7', '6', '5', '4', '3', '2', 'GND2', '5V', '3.3V', 'GND', 'GND3', 'VIN', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5']

const pinName = (p: string) => PIN_LABEL[p] ?? p

function describePin(p: string) {
  const n = pinName(p)
  if (/^\d+$/.test(n)) return `Arduino · pin digital ${n}`
  if (n.startsWith('A')) return `Arduino · entrada analógica ${n}`
  return `Arduino · ${n}`
}

export function BreadboardGame() {
  const s = useStore()
  const player = currentPlayer(s)
  const holes = useMemo(() => buildHoles(COLS), [])
  const holeById = useMemo(() => new Map(holes.map((h) => [h.id, h])), [holes])
  const pins = useMemo(() => arduinoPinPositions(), [])

  const [li, setLi] = useState(0)
  const level = BB_LEVELS[li]
  const [tool, setTool] = useState<Tool | 'borrar'>(level.tools[0])
  const [placed, setPlaced] = useState<Placed[]>([])
  const [pending, setPending] = useState<string[]>([])
  const [hover, setHover] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'info' | 'bad' | 'ok'; text: string } | null>(null)
  const [fails, setFails] = useState(0)
  const [won, setWon] = useState<null | { points: number; best: number }>(null)
  const [showHint, setShowHint] = useState(false)

  const termPos = (t: string): THREE.Vector3 => {
    if (t.startsWith('ard:')) {
      const [x, z] = pins[t.slice(4)]
      return new THREE.Vector3(ARD_POS[0] + x, ARD_POS[1] + HEADER_TOP, ARD_POS[2] + z)
    }
    const h = holeById.get(t)!
    return new THREE.Vector3(h.x, TOP, h.z)
  }

  const terminalNode = (t: string) => {
    if (t.startsWith('ard:')) {
      const p = t.slice(4)
      return 'pin:' + (p.startsWith('GND') ? 'GND' : p)
    }
    return holeById.get(t)!.strip
  }

  const occupied = useMemo(() => {
    const m = new Map<string, string>()
    placed.forEach((p) => p.legs.forEach((l) => m.set(l, p.id)))
    pending.forEach((l) => m.set(l, 'pending'))
    return m
  }, [placed, pending])

  const reset = (idx: number) => {
    setLi(idx)
    setPlaced([])
    setPending([])
    setMsg(null)
    setFails(0)
    setWon(null)
    setShowHint(false)
    setTool(BB_LEVELS[idx].tools[0])
  }

  const clickTerminal = (t: string) => {
    if (won) return
    if (tool === 'borrar') {
      const id = occupied.get(t)
      if (id && id !== 'pending') setPlaced(placed.filter((p) => p.id !== id))
      return
    }
    if (occupied.has(t)) {
      setMsg({ type: 'bad', text: 'Ese lugar ya está ocupado. Cada orificio admite una sola pata o cable.' })
      return
    }
    if (tool.kind !== 'cable' && t.startsWith('ard:')) {
      setMsg({ type: 'bad', text: 'Los componentes se colocan en la protoboard. Para llegar al Arduino usá cables.' })
      return
    }
    if (tool.kind !== 'cable' && pending.length > 0) {
      const d = termPos(pending[pending.length - 1]).distanceTo(termPos(t))
      if (d > 1.6) {
        setMsg({ type: 'bad', text: 'Las patas no llegan tan lejos. Poné la siguiente pata más cerca.' })
        return
      }
    }
    const legs = [...pending, t]
    const need = LEG_NAMES[tool.kind].length
    if (legs.length < need) {
      setPending(legs)
      setMsg({ type: 'info', text: `Ahora elegí dónde va: ${LEG_NAMES[tool.kind][legs.length]}.` })
      return
    }
    const item: Placed = {
      id: Math.random().toString(36).slice(2),
      kind: tool.kind,
      legs,
      color: tool.color,
      value: tool.value,
    }
    setPlaced([...placed, item])
    setPending([])
    const sameStrip = tool.kind !== 'cable' && new Set(legs.map(terminalNode)).size < legs.length
    setMsg(
      sameStrip
        ? { type: 'bad', text: '⚠ Ojo: dos patas quedaron en la misma tira, así el componente queda en cortocircuito.' }
        : null,
    )
  }

  const check = () => {
    const nl = buildNetlist(placed, terminalNode)
    let problem: string | null = null
    if (nl.same('ard:5V', 'ard:GND')) problem = '¡Cortocircuito! 5V y GND quedaron conectados directamente. Eso puede dañar el Arduino.'
    if (!problem) {
      for (const p of placed) {
        if (p.kind === 'cable') continue
        const nets = new Set(p.legs.map(nl.net))
        if (nets.size < p.legs.length) {
          problem = `Hay un componente (${p.kind}) con dos patas en la misma tira: queda en cortocircuito.`
          break
        }
      }
    }
    if (!problem) problem = level.check(nl, placed)
    if (problem) {
      // si sólo faltan piezas no se penaliza: se descuenta cuando el circuito armado está mal
      const incomplete = /^Falta/.test(problem)
      if (!incomplete) setFails((f) => f + 1)
      setMsg({ type: 'bad', text: incomplete ? problem : problem + ' (−15 pts)' })
      return
    }
    const points = Math.max(40, 100 - fails * 15)
    const best = player ? bestScore(s, player.id, 'protoboard', level.id) : 0
    addScore('protoboard', points, level.id)
    setWon({ points, best })
    setMsg({ type: 'ok', text: `✔ ¡Circuito correcto! +${points} puntos` })
  }

  const hoverText = (() => {
    if (!hover) return null
    if (hover.startsWith('ard:')) return describePin(hover.slice(4))
    const h = holeById.get(hover)
    return h ? describeHole(h) : null
  })()

  const hlStrips = useMemo(() => {
    const set = new Set<string>()
    if (hover && !hover.startsWith('ard:')) set.add(holeById.get(hover)!.strip)
    pending.forEach((t) => !t.startsWith('ard:') && set.add(holeById.get(t)!.strip))
    return set
  }, [hover, pending, holeById])

  const toolLabel = tool === 'borrar' ? 'Borrar' : tool.label

  return (
    <GameShell
      title="Conexiones en la protoboard"
      icon="🔌"
      info="Armá el circuito pedido conectando componentes y cables en la protoboard 3D. Tocá un orificio para ver con cuáles está conectado."
    >
      <div className="level-tabs">
        {BB_LEVELS.map((l, i) => {
          const b = player ? bestScore(s, player.id, 'protoboard', l.id) : 0
          return (
            <button key={l.id} type="button" className={`chip ${i === li ? 'active' : ''}`} onClick={() => reset(i)}>
              {l.title} {b > 0 && <small>· {b} pts</small>}
            </button>
          )
        })}
      </div>
      <div className="bb-layout">
        <div className="bb-main">
          <div className="card goal">
            <strong>Objetivo:</strong> {level.goal}{' '}
            <button type="button" className="btn small ghost" onClick={() => setShowHint(!showHint)}>
              {showHint ? 'Ocultar pista' : '💡 Pista'}
            </button>
            {showHint && <p className="hint">{level.hint}</p>}
          </div>
          <div className="bb-view">
            <Viewer camera={[0, 9, 6.5]} target={[0, 0, -2.2]} shadowY={-0.75} className="viewer bb-viewer">
              <BreadboardBody
                cols={COLS}
                highlightStrips={hlStrips}
                hoverId={hover && !hover.startsWith('ard:') ? hover : null}
                onHoleClick={(h: Hole) => clickTerminal(h.id)}
                onHoleHover={(h) => setHover(h ? h.id : null)}
              />
              <group position={ARD_POS}>
                <ArduinoModel powered blink={false} />
              </group>
              {USABLE_PINS.map((p) => {
                const t = `ard:${p}`
                const pos = termPos(t)
                const busy = occupied.has(t)
                return (
                  <mesh
                    key={p}
                    position={[pos.x, pos.y + 0.01, pos.z]}
                    onClick={(e: ThreeEvent<MouseEvent>) => {
                      e.stopPropagation()
                      clickTerminal(t)
                    }}
                    onPointerOver={(e) => {
                      e.stopPropagation()
                      setHover(t)
                      document.body.style.cursor = 'pointer'
                    }}
                    onPointerOut={() => {
                      setHover(null)
                      document.body.style.cursor = ''
                    }}
                  >
                    <boxGeometry args={[0.2, 0.03, 0.2]} />
                    <meshBasicMaterial
                      color={hover === t ? '#ffd400' : busy ? '#2fe07a' : '#ffffff'}
                      transparent
                      opacity={hover === t || pending.includes(t) ? 0.95 : 0.25}
                    />
                  </mesh>
                )
              })}
              {placed.map((p) => (
                <PlacedItem
                  key={p.id}
                  item={p}
                  termPos={termPos}
                  lit={!!won}
                  onClick={tool === 'borrar' ? () => setPlaced(placed.filter((x) => x.id !== p.id)) : undefined}
                />
              ))}
              {pending.map((t) => {
                const v = termPos(t)
                return (
                  <mesh key={t} position={[v.x, v.y + 0.12, v.z]}>
                    <sphereGeometry args={[0.07, 16, 16]} />
                    <meshBasicMaterial color="#ffd400" />
                  </mesh>
                )
              })}
              {hover && hoverText && (
                <Label position={termPos(hover).add(new THREE.Vector3(0, 0.45, 0))} center style={{ pointerEvents: 'none' }} zIndexRange={[30, 0]}>
                  <div className="part-label selected">{hoverText}</div>
                </Label>
              )}
            </Viewer>
            <div className="viewer-help">
              Herramienta: <strong>{toolLabel}</strong>
              {tool !== 'borrar' && pending.length === 0 && ` · tocá dónde va: ${LEG_NAMES[tool.kind][0]}`}
              {' · '}Arrastrá para girar la vista
            </div>
          </div>
          {msg && <div className={`msg ${msg.type}`}>{msg.text}</div>}
          {won && (
            <div className="card result inline">
              <p className="record">🎉 ¡Funciona! +{won.points} puntos</p>
              {won.best >= won.points && won.best > 0 && <p>Tu récord en este nivel sigue siendo {won.best}.</p>}
              {li + 1 < BB_LEVELS.length && (
                <button type="button" className="btn primary" onClick={() => reset(li + 1)}>
                  Siguiente nivel →
                </button>
              )}
            </div>
          )}
        </div>
        <aside className="card toolbox">
          <h3>Herramientas</h3>
          <div className="tool-list">
            {level.tools.map((t) => (
              <button
                key={t.label}
                type="button"
                className={`tool ${tool !== 'borrar' && tool.label === t.label ? 'active' : ''}`}
                onClick={() => {
                  setTool(t)
                  setPending([])
                  setMsg(null)
                }}
              >
                <span className="tool-swatch" style={{ background: t.color ?? (t.kind === 'resistencia' ? '#d9c29a' : t.kind === 'potenciometro' ? '#26407a' : '#333') }} />
                {t.label}
              </button>
            ))}
            <button
              type="button"
              className={`tool ${tool === 'borrar' ? 'active' : ''}`}
              onClick={() => {
                setTool('borrar')
                setPending([])
              }}
            >
              🗑 Borrar (tocá una pieza)
            </button>
          </div>
          <div className="row wrap">
            <button type="button" className="btn small" disabled={!placed.length || !!won} onClick={() => setPlaced(placed.slice(0, -1))}>
              ↶ Deshacer
            </button>
            <button type="button" className="btn small" onClick={() => reset(li)}>
              Empezar de nuevo
            </button>
          </div>
          <button type="button" className="btn primary big" disabled={!!won || placed.length === 0} onClick={check}>
            ⚡ Probar circuito
          </button>
          <p className="hint">Cada prueba con un error de conexión resta 15 puntos al premio del nivel (mínimo 40).</p>
        </aside>
      </div>
    </GameShell>
  )
}

function PlacedItem({
  item,
  termPos,
  lit,
  onClick,
}: {
  item: Placed
  termPos: (t: string) => THREE.Vector3
  lit: boolean
  onClick?: () => void
}) {
  const ps = item.legs.map(termPos)
  const handlers = onClick
    ? {
        onClick: (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          onClick()
        },
        onPointerOver: () => (document.body.style.cursor = 'not-allowed'),
        onPointerOut: () => (document.body.style.cursor = ''),
      }
    : {}

  if (item.kind === 'cable') {
    const [a, b] = ps
    const d = a.distanceTo(b)
    const h = Math.min(0.25 + d * 0.15, 1.2)
    const pts: [number, number, number][] = [
      [a.x, a.y, a.z],
      [a.x, a.y + h * 0.7, a.z],
      [(a.x + b.x) / 2, Math.max(a.y, b.y) + h, (a.z + b.z) / 2],
      [b.x, b.y + h * 0.7, b.z],
      [b.x, b.y, b.z],
    ]
    return (
      <group {...handlers}>
        <Wire points={pts} radius={0.035} color={item.color} metalness={0.1} roughness={0.5} />
      </group>
    )
  }

  const mid = ps.reduce((acc, v) => acc.add(v), new THREE.Vector3()).multiplyScalar(1 / ps.length)
  const a = ps[0]
  const b = ps[ps.length - 1]
  const ang = Math.atan2(-(b.z - a.z), b.x - a.x)
  const legsTo = (y: number) =>
    ps.map((p, i) => <Wire key={i} points={[[p.x, p.y, p.z], [p.x, p.y + y * 0.6, p.z], [p.x + (mid.x - p.x) * 0.3, mid.y + y, p.z + (mid.z - p.z) * 0.3]]} radius={0.018} />)

  if (item.kind === 'resistencia') {
    const bands = valueToBands(item.value ?? 220, 4, 5)
    const len = Math.max(0.35, Math.min(0.6, a.distanceTo(b) - 0.1))
    return (
      <group {...handlers}>
        {ps.map((p, i) => {
          const end = i === 0 ? -1 : 1
          const ex = mid.x + Math.cos(ang) * end * (len / 2)
          const ez = mid.z - Math.sin(ang) * end * (len / 2)
          return <Wire key={i} points={[[p.x, p.y, p.z], [p.x, mid.y + 0.25, p.z], [ex, mid.y + 0.3, ez]]} radius={0.018} />
        })}
        <group position={[mid.x, mid.y + 0.3, mid.z]} rotation={[0, ang, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.11, 0.11, len, 20]} />
            <meshStandardMaterial color="#d9c29a" />
          </mesh>
          {bands.map((c, i) => (
            <mesh key={i} position={[-len / 2 + 0.08 + i * (len - 0.16) / 3 + (i === 3 ? 0.03 : 0), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.115, 0.115, 0.04, 20]} />
              <meshStandardMaterial color={COLORS[c].hex} />
            </mesh>
          ))}
        </group>
      </group>
    )
  }

  if (item.kind === 'led') {
    const color = item.color ?? '#ff2a2a'
    return (
      <group {...handlers}>
        {ps.map((p, i) => (
          <Wire key={i} points={[[p.x, p.y, p.z], [p.x, p.y + 0.3, p.z], [mid.x + (p.x - mid.x) * 0.4, mid.y + (i === 0 ? 0.55 : 0.5), mid.z + (p.z - mid.z) * 0.4]]} radius={0.018} />
        ))}
        <group position={[mid.x, mid.y + 0.55, mid.z]}>
          <mesh position={[0, 0.17, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 0.34, 24]} />
            <meshStandardMaterial color={color} transparent opacity={0.75} emissive={color} emissiveIntensity={lit ? 2.5 : 0.1} />
          </mesh>
          <mesh position={[0, 0.34, 0]}>
            <sphereGeometry args={[0.13, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={color} transparent opacity={0.75} emissive={color} emissiveIntensity={lit ? 2.5 : 0.1} />
          </mesh>
          {lit && <pointLight color={color} intensity={4} distance={3} />}
        </group>
        <Label position={[ps[0].x, ps[0].y + 0.15, ps[0].z]} center style={{ pointerEvents: 'none' }}>
          <div className="pin-tag">+</div>
        </Label>
      </group>
    )
  }

  if (item.kind === 'pulsador') {
    return (
      <group {...handlers}>
        {legsTo(0.15)}
        <group position={[mid.x, mid.y + 0.25, mid.z]} rotation={[0, ang, 0]}>
          <mesh>
            <boxGeometry args={[0.45, 0.2, 0.45]} />
            <meshStandardMaterial color="#1b1b1d" />
          </mesh>
          <mesh position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.14, 20]} />
            <meshStandardMaterial color="#c01818" />
          </mesh>
        </group>
      </group>
    )
  }

  // potenciómetro
  const w = ps[1]
  return (
    <group {...handlers}>
      {legsTo(0.25)}
      <group position={[w.x, w.y + 0.45, w.z]}>
        <mesh>
          <boxGeometry args={[0.7, 0.35, 0.6]} />
          <meshStandardMaterial color="#26407a" />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.3, 20]} />
          <meshStandardMaterial color="#d0d3d8" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
    </group>
  )
}
