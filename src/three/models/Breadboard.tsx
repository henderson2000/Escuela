import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Part } from '../Part'
import { useCanvasTexture } from '../helpers'
import { PITCH, ROW_Z, RAIL_ROWS, buildHoles, boardSize, type Hole } from '../../lib/breadboard'

const HOLE_COLOR = new THREE.Color('#1a1a1a')
const HL_COLOR = new THREE.Color('#2fe07a')
const HOVER_COLOR = new THREE.Color('#ffd400')

interface BoardProps {
  cols: number
  highlightStrips?: Set<string>
  hoverId?: string | null
  onHoleClick?: (h: Hole) => void
  onHoleHover?: (h: Hole | null) => void
}

/** Cuerpo de la protoboard con sus orificios (reutilizado por el juego de conexiones). */
export function BreadboardBody({ cols, highlightStrips, hoverId, onHoleClick, onHoleHover }: BoardProps) {
  const holes = useMemo(() => buildHoles(cols), [cols])
  const { width, depth, height } = boardSize(cols)
  const ref = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const o = new THREE.Object3D()
    holes.forEach((h, i) => {
      o.position.set(h.x, height / 2 + 0.002, h.z)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
      const col = h.id === hoverId ? HOVER_COLOR : highlightStrips?.has(h.strip) ? HL_COLOR : HOLE_COLOR
      m.setColorAt(i, col)
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [holes, height, highlightStrips, hoverId])

  const tex = useCanvasTexture(
    Math.round(width * 220),
    Math.round(depth * 220),
    (ctx, w, h) => {
      const sx = (x: number) => ((x + width / 2) / width) * w
      const sz = (z: number) => ((z + depth / 2) / depth) * h
      ctx.fillStyle = '#f3f1ea'
      ctx.fillRect(0, 0, w, h)
      const line = (zPitch: number, color: string) => {
        ctx.fillStyle = color
        ctx.fillRect(sx(-width / 2 + PITCH * 0.6), sz(zPitch * PITCH) - 3, w - sx(-width / 2 + PITCH * 1.2), 6)
      }
      line(-9.2, '#d22')
      line(-6.85, '#25c')
      line(6.85, '#25c')
      line(9.2, '#d22')
      // canal central: ranura con sombra en las paredes
      const c0 = sz(-0.55 * PITCH)
      const c1 = sz(0.55 * PITCH)
      const gch = ctx.createLinearGradient(0, c0, 0, c1)
      gch.addColorStop(0, '#8f8c84')
      gch.addColorStop(0.25, '#c9c6bc')
      gch.addColorStop(0.8, '#d8d5cb')
      gch.addColorStop(1, '#f0eee6')
      ctx.fillStyle = gch
      ctx.fillRect(0, c0, w, c1 - c0)
      // bocas cuadradas con chanfle: borde iluminado de un lado y en sombra del otro
      const px = PITCH * 220
      const outer = px * 0.66
      const inner = px * 0.36
      for (const hole of holes) {
        const cx = sx(hole.x)
        const cz = sz(hole.z)
        const g = ctx.createLinearGradient(cx - outer / 2, cz - outer / 2, cx + outer / 2, cz + outer / 2)
        g.addColorStop(0, '#9e9a90')
        g.addColorStop(0.5, '#c4c0b6')
        g.addColorStop(1, '#ebe8df')
        ctx.fillStyle = g
        ctx.fillRect(cx - outer / 2, cz - outer / 2, outer, outer)
        ctx.fillStyle = '#26231f'
        ctx.fillRect(cx - inner / 2, cz - inner / 2, inner, inner)
        // brillo del contacto metálico al fondo
        ctx.fillStyle = 'rgba(200,200,190,0.35)'
        ctx.fillRect(cx - inner * 0.15, cz - inner * 0.35, inner * 0.3, inner * 0.7)
      }
      ctx.fillStyle = '#555'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `${Math.round(PITCH * 220 * 0.42)}px sans-serif`
      const x0 = -((cols - 1) / 2) * PITCH
      for (let c = 1; c <= cols; c++) {
        if (c === 1 || c % 5 === 0) {
          ctx.fillText(String(c), sx(x0 + (c - 1) * PITCH), sz(-6.25 * PITCH))
          ctx.fillText(String(c), sx(x0 + (c - 1) * PITCH), sz(6.25 * PITCH))
        }
      }
      for (const r of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'] as const) {
        ctx.fillText(r, sx(x0 - PITCH * 0.75), sz(ROW_Z[r] * PITCH))
        ctx.fillText(r, sx(-x0 + PITCH * 0.75), sz(ROW_Z[r] * PITCH))
      }
      ctx.font = `bold ${Math.round(PITCH * 220 * 0.6)}px sans-serif`
      for (const r of RAIL_ROWS) {
        ctx.fillStyle = r.endsWith('+') ? '#d22' : '#25c'
        ctx.fillText(r.endsWith('+') ? '+' : '−', sx(x0 - PITCH * 0.6), sz(ROW_Z[r] * PITCH))
      }
    },
    [cols, holes],
  )

  const interactive = !!onHoleClick || !!onHoleHover
  const group = useRef<THREE.Group>(null)

  /** orificio más cercano al punto tocado (efecto "imán": no hace falta apuntar exacto) */
  const nearest = (p: THREE.Vector3): Hole | null => {
    if (!group.current) return null
    const local = group.current.worldToLocal(p.clone())
    let best: Hole | null = null
    let bd = Infinity
    for (const h of holes) {
      const d = (h.x - local.x) ** 2 + (h.z - local.z) ** 2
      if (d < bd) {
        bd = d
        best = h
      }
    }
    return bd < (PITCH * 0.75) ** 2 ? best : null
  }

  const events = interactive
    ? {
        onClick: (e: ThreeEvent<MouseEvent>) => {
          const h = nearest(e.point)
          if (!h || !onHoleClick) return
          e.stopPropagation()
          onHoleClick(h)
        },
        onPointerMove: (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          const h = nearest(e.point)
          onHoleHover?.(h)
          document.body.style.cursor = h ? 'pointer' : ''
        },
        onPointerOut: () => {
          onHoleHover?.(null)
          document.body.style.cursor = ''
        },
      }
    : {}

  return (
    <group ref={group}>
      <RoundedBox args={[width, height, depth]} radius={0.03} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color="#f1eee5" roughness={0.62} />
      </RoundedBox>      {/* encastres "cola de milano" para unir varias protoboards */}
      {[-0.32, 0, 0.32].map((f) => (
        <group key={f}>
          <mesh position={[width / 2 + 0.05, -0.05, f * depth]}>
            <boxGeometry args={[0.1, height * 0.6, 0.22]} />
            <meshStandardMaterial color="#ebe8df" roughness={0.75} />
          </mesh>
          <mesh position={[-width / 2 + 0.04, -0.05, f * depth]}>
            <boxGeometry args={[0.1, height * 0.62, 0.24]} />
            <meshStandardMaterial color="#9d9a91" roughness={0.9} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, height / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} {...events}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial map={tex} roughness={0.62} />
      </mesh>
      <instancedMesh ref={ref} args={[undefined, undefined, holes.length]} raycast={() => null}>
        <boxGeometry args={[PITCH * 0.36, 0.004, PITCH * 0.36]} />
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>
    </group>
  )
}

/** Tiras metálicas internas que conectan los orificios. */
function Strips({ cols, highlight }: { cols: number; highlight: Set<string> }) {
  const { width } = boardSize(cols)
  const x0 = -((cols - 1) / 2) * PITCH
  const items: { key: string; pos: [number, number, number]; size: [number, number, number] }[] = []
  for (let c = 1; c <= cols; c++) {
    const x = x0 + (c - 1) * PITCH
    items.push({ key: `col ${c} (f-j)`, pos: [x, 0, -3.5 * PITCH], size: [PITCH * 0.5, 0.25, PITCH * 4.6] })
    items.push({ key: `col ${c} (a-e)`, pos: [x, 0, 3.5 * PITCH], size: [PITCH * 0.5, 0.25, PITCH * 4.6] })
  }
  for (const r of RAIL_ROWS) {
    items.push({ key: `riel ${r}`, pos: [0, 0, ROW_Z[r] * PITCH], size: [width - PITCH * 3, 0.25, PITCH * 0.5] })
  }
  return (
    <>
      {items.map((it) => {
        const on = highlight.has(it.key)
        const isRail = it.key.startsWith('riel')
        return (
          <mesh key={it.key} position={it.pos}>
            <boxGeometry args={it.size} />
            <meshStandardMaterial
              color={on ? '#2fe07a' : isRail ? (it.key.includes('+') ? '#e0a0a0' : '#a0b4e0') : '#cfd2d6'}
              emissive={on ? '#1a8a4a' : '#000'}
              metalness={0.85}
              roughness={0.3}
            />
          </mesh>
        )
      })}
    </>
  )
}

export function BreadboardModel({ cols }: { cols: number }) {
  const [hl, setHl] = useState<Set<string>>(new Set())
  const [hover, setHover] = useState<string | null>(null)
  const { width, depth, height } = boardSize(cols)

  return (
    <group>
      <Part id="cuerpo" offset={[0, 1.6, 0]} labelAt={[-width / 2 + 0.4, 0.6, -depth / 2]}>
        <BreadboardBody
          cols={cols}
          highlightStrips={hl}
          hoverId={hover}
          onHoleClick={(h) => setHl(new Set([h.strip]))}
          onHoleHover={(h) => setHover(h?.id ?? null)}
        />
      </Part>
      <Part id="rieles" offset={[0, 1.6, 0]} labelAt={[width / 2 - 0.4, 0.6, -8 * PITCH]}>
        <group />
      </Part>
      <Part id="canal" offset={[0, 1.6, 0]} labelAt={[width / 2 - 0.2, 0.6, 0]}>
        <mesh position={[0, height / 2 - 0.05, 0]}>
          <boxGeometry args={[width + 0.002, 0.12, PITCH * 1.0]} />
          <meshStandardMaterial color="#bdbab0" roughness={0.9} />
        </mesh>
      </Part>
      <Part id="tiras" offset={[0, 0, 0]} labelAt={[0, 0.4, 3.5 * PITCH]}>
        <Strips cols={cols} highlight={hl} />
      </Part>
      <Part id="adhesivo" offset={[0, -1.0, 0]} labelAt={[width / 2 - 0.4, -0.4, depth / 2]}>
        <mesh position={[0, -height / 2 - 0.02, 0]}>
          <boxGeometry args={[width, 0.04, depth]} />
          <meshStandardMaterial color="#e9e4d2" roughness={1} />
        </mesh>
      </Part>
    </group>
  )
}
