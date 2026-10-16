import { useMemo } from 'react'
import * as THREE from 'three'
import type { Vec3 } from './Part'

/** Pata/alambre metálico que pasa por varios puntos. */
export function Wire({
  points,
  radius = 0.025,
  color = '#c8c8cc',
  metalness = 0.9,
  roughness = 0.3,
  square = false,
  smooth = 0.1,
}: {
  points: Vec3[]
  radius?: number
  color?: string
  metalness?: number
  roughness?: number
  /** sección cuadrada (patas de LED, pulsadores, pines) */
  square?: boolean
  /** cuánto se redondean los dobleces (0 = quiebre marcado) */
  smooth?: number
}) {
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
      false,
      'catmullrom',
      smooth,
    )
    return new THREE.TubeGeometry(curve, Math.max(24, points.length * 16), radius, square ? 4 : 12, false)
  }, [JSON.stringify(points), radius, square, smooth])
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} flatShading={square} />
    </mesh>
  )
}

/** Pata recta con un doblez a 90° (típica de componentes axiales). */
export function bentLeg(start: Vec3, dir: 1 | -1, horiz: number, down: number): Vec3[] {
  const [x, y, z] = start
  const r = 0.12
  return [
    [x, y, z],
    [x + dir * (horiz - r), y, z],
    [x + dir * (horiz - r * 0.3), y - r * 0.3, z],
    [x + dir * horiz, y - r, z],
    [x + dir * horiz, y - down, z],
  ]
}

/** Textura generada con canvas (para textos impresos sin cargar fuentes externas). */
export function useCanvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  deps: unknown[],
) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    draw(ctx, width, height)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    return tex
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

export const metal = { color: '#cfd2d6', metalness: 0.95, roughness: 0.25 }
export const darkPlastic = { color: '#1b1b1d', metalness: 0.1, roughness: 0.6 }
export const gold = { color: '#d9b45a', metalness: 1, roughness: 0.3 }

/** Pin macho cuadrado (tipo header). */
export function MalePin({ position, length = 0.6 }: { position: Vec3; length?: number }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.064, length, 0.064]} />
      <meshStandardMaterial {...gold} />
    </mesh>
  )
}

/** Estaño de las patas (más claro y algo mate que el metal pulido). */
export const tinned = { color: '#dfe2e6', metalness: 1, roughness: 0.28 }

/** Engranaje / moleteado extruido (dientes trapezoidales), acostado sobre el plano XZ. */
export function gearGeometry(teeth: number, r: number, depth: number, hole = 0, inner = 0.86) {
  const s = new THREE.Shape()
  const rIn = r * inner
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2
    const step = (Math.PI * 2) / teeth
    const pts: [number, number][] = [
      [rIn, a0],
      [r, a0 + step * 0.2],
      [r, a0 + step * 0.5],
      [rIn, a0 + step * 0.7],
    ]
    pts.forEach(([rr, a], k) => {
      const x = Math.cos(a) * rr
      const y = Math.sin(a) * rr
      if (i === 0 && k === 0) s.moveTo(x, y)
      else s.lineTo(x, y)
    })
  }
  s.closePath()
  if (hole > 0) {
    const h = new THREE.Path()
    h.absarc(0, 0, hole, 0, Math.PI * 2, true)
    s.holes.push(h)
  }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 6 })
  g.rotateX(-Math.PI / 2)
  return g
}

/** Sólido de revolución a partir de un perfil (radio, altura). */
export function latheGeometry(profile: [number, number][], segments = 48, step = 0.04) {
  // se subdividen los tramos largos para que la textura se reparta parejo a lo largo del perfil
  const pts: THREE.Vector2[] = []
  profile.forEach(([r, y], i) => {
    if (i > 0) {
      const [r0, y0] = profile[i - 1]
      const n = Math.max(1, Math.ceil(Math.hypot(r - r0, y - y0) / step))
      for (let k = 1; k < n; k++) pts.push(new THREE.Vector2(Math.max(r0 + ((r - r0) * k) / n, 0.0001), y0 + ((y - y0) * k) / n))
    }
    pts.push(new THREE.Vector2(Math.max(r, 0.0001), y))
  })
  return new THREE.LatheGeometry(pts, segments)
}

/** Tornillo de cabeza redonda con ranura en cruz (visto desde arriba = +y). */
export function Screw({ position, r = 0.08, rotation = [0, 0, 0] }: { position: Vec3; r?: number; rotation?: Vec3 }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <sphereGeometry args={[r, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial {...metal} roughness={0.35} />
      </mesh>
      {[0, Math.PI / 2].map((a) => (
        <mesh key={a} position={[0, r * 0.75, 0]} rotation={[0, a, 0]}>
          <boxGeometry args={[r * 1.5, r * 0.5, r * 0.22]} />
          <meshStandardMaterial color="#555" metalness={0.8} roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

/** Plástico con algo de brillo (laca / termocontraíble). */
export function GlossyPlastic({ color, roughness = 0.35, clearcoat = 0.5 }: { color: string; roughness?: number; clearcoat?: number }) {
  return <meshPhysicalMaterial color={color} roughness={roughness} clearcoat={clearcoat} clearcoatRoughness={0.25} />
}

/**
 * Placa de circuito impreso parada (en el plano XY, mirando a +z), con esquinas redondeadas
 * y agujeros. Devuelve el cuerpo y una cara frontal con UV para pegarle la serigrafía.
 */
export function pcbGeometries(w: number, h: number, t: number, holes: [number, number, number][] = [], corner = 0.05) {
  const s = new THREE.Shape()
  const x0 = -w / 2
  const y0 = -h / 2
  s.moveTo(x0 + corner, y0)
  s.lineTo(x0 + w - corner, y0)
  s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + corner)
  s.lineTo(x0 + w, y0 + h - corner)
  s.quadraticCurveTo(x0 + w, y0 + h, x0 + w - corner, y0 + h)
  s.lineTo(x0 + corner, y0 + h)
  s.quadraticCurveTo(x0, y0 + h, x0, y0 + h - corner)
  s.lineTo(x0, y0 + corner)
  s.quadraticCurveTo(x0, y0, x0 + corner, y0)
  for (const [hx, hy, r] of holes) {
    const p = new THREE.Path()
    p.absarc(hx, hy, r, 0, Math.PI * 2, true)
    s.holes.push(p)
  }
  const body = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 16 })
  body.translate(0, 0, -t / 2)
  const face = new THREE.ShapeGeometry(s, 16)
  const pos = face.attributes.position
  const uv = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - x0) / w
    uv[i * 2 + 1] = (pos.getY(i) - y0) / h
  }
  face.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  return { body, face }
}

/** Circuito integrado SMD (SOIC) con sus patitas de ala de gaviota, acostado sobre +y. */
export function Soic({ position, rotation = [0, 0, 0], pins = 8, label = '' }: { position: Vec3; rotation?: Vec3; pins?: number; label?: string }) {
  const n = pins / 2
  const len = n * 0.127 + 0.05
  const tex = useCanvasTexture(
    256,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#161616'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#9a9a9a'
      ctx.font = 'bold 34px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, w / 2, h / 2)
    },
    [label],
  )
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[len, 0.06, 0.39]} />
        <meshStandardMaterial color="#161616" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.0605, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[len * 0.9, 0.3]} />
        <meshStandardMaterial map={tex} roughness={0.5} />
      </mesh>
      {Array.from({ length: n }, (_, i) =>
        [-1, 1].map((sd) => (
          <mesh key={`${i}${sd}`} position={[-len / 2 + 0.06 + i * 0.127, 0.01, sd * 0.24]}>
            <boxGeometry args={[0.04, 0.02, 0.12]} />
            <meshStandardMaterial {...tinned} />
          </mesh>
        )),
      )}
    </group>
  )
}
