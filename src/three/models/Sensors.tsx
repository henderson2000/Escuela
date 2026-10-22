import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Label } from '../Label'
import { Part } from '../Part'
import { Soic, Wire, darkPlastic, gearGeometry, latheGeometry, metal, pcbGeometries, tinned, useCanvasTexture } from '../helpers'

/* ------------------------------------------------------------------ */
/* Sensor ultrasónico HC-SR04 (1 unidad = 10 mm)                       */
/* Placa 45 × 20 mm, transductores Ø16 × 12 mm, pines a 2,54 mm.        */
/* ------------------------------------------------------------------ */

const US_W = 4.5
const US_H = 2.0
const US_T = 0.16
const TX = 1.3 // centro de cada transductor

function Transducer({ x }: { x: number }) {
  const canGeo = useMemo(
    () =>
      latheGeometry(
        [
          [0.74, 0],
          [0.8, 0.04],
          [0.8, 1.12],
          [0.79, 1.17],
          [0.74, 1.2],
          [0.7, 1.19],
        ],
        64,
      ),
    [],
  )
  const mesh = useCanvasTexture(
    512,
    512,
    (ctx, w, h) => {
      // malla tejida fina
      ctx.fillStyle = '#0e0e0e'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#3a3a3a'
      ctx.lineWidth = 3
      for (let i = -h; i < w + h; i += 9) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i + h, h)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i - h, h)
        ctx.stroke()
      }
    },
    [],
  )
  return (
    <group position={[x, 0, US_T / 2]}>
      <mesh geometry={canGeo} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <meshStandardMaterial {...metal} roughness={0.32} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 1.17]}>
        <circleGeometry args={[0.71, 64]} />
        <meshStandardMaterial map={mesh} roughness={0.85} />
      </mesh>
      {/* disco piezoeléctrico y cono interno */}
      <mesh position={[0, 0, 0.55]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.04, 40]} />
        <meshStandardMaterial color="#c9a95a" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.75]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.45, 0.35, 40, 1, true]} />
        <meshStandardMaterial color="#3a3226" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

export function UltrasonicModel({ distanceCm, showWaves }: { distanceCm: number; showWaves: boolean }) {
  const holes: [number, number, number][] = [
    [-US_W / 2 + 0.2, US_H / 2 - 0.2, 0.1],
    [US_W / 2 - 0.2, US_H / 2 - 0.2, 0.1],
    [-US_W / 2 + 0.2, -US_H / 2 + 0.2, 0.1],
    [US_W / 2 - 0.2, -US_H / 2 + 0.2, 0.1],
  ]
  const { body, face } = useMemo(() => pcbGeometries(US_W, US_H, US_T, holes, 0.06), [])
  const silk = useCanvasTexture(
    1800,
    800,
    (ctx, w, h) => {
      const mx = (x: number) => ((x + US_W / 2) / US_W) * w
      const my = (y: number) => ((US_H / 2 - y) / US_H) * h
      ctx.fillStyle = '#1f62c0'
      ctx.fillRect(0, 0, w, h)
      // pistas
      ctx.strokeStyle = '#3a7ad6'
      ctx.lineWidth = 9
      ctx.lineCap = 'round'
      for (const [a, b, c, d] of [
        [-0.38, -0.85, -0.38, -0.3],
        [-0.13, -0.85, -0.13, 0.2],
        [0.13, -0.85, 0.13, 0.4],
        [0.38, -0.85, 0.38, -0.2],
        [-0.38, -0.3, -0.5, 0.6],
        [0.38, -0.2, 0.5, 0.6],
      ]) {
        ctx.beginPath()
        ctx.moveTo(mx(a), my(b))
        ctx.lineTo(mx(c), my(d))
        ctx.stroke()
      }
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = 'bold 64px sans-serif'
      ctx.fillText('HC-SR04', mx(0), my(0.0))
      ctx.font = 'bold 44px sans-serif'
      ;['Vcc', 'Trig', 'Echo', 'Gnd'].forEach((t, i) => ctx.fillText(t, mx((i - 1.5) * 0.254), my(-0.55)))
      ctx.font = 'bold 80px sans-serif'
      ctx.fillText('T', mx(-TX - 0.95), my(0.7))
      ctx.fillText('R', mx(TX + 0.95), my(0.7))
      // anillos de las serigrafías de los transductores
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 5
      for (const x of [-TX, TX]) {
        ctx.beginPath()
        ctx.arc(mx(x), my(0), (0.84 / US_W) * w, 0, Math.PI * 2)
        ctx.stroke()
      }
      // pads de los pines
      ctx.fillStyle = '#d9d9d9'
      for (let i = 0; i < 4; i++) {
        ctx.beginPath()
        ctx.arc(mx((i - 1.5) * 0.254), my(-0.82), 22, 0, Math.PI * 2)
        ctx.fill()
      }
      // agujeros de montaje con anillo plateado
      for (const [hx, hy] of holes) {
        ctx.beginPath()
        ctx.arc(mx(hx), my(hy), 34, 0, Math.PI * 2)
        ctx.fill()
      }
    },
    [],
  )

  const wallZ = 1.6 + distanceCm / 30
  const out = useRef<THREE.Mesh>(null)
  const back = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!out.current || !back.current) return
    const travel = wallZ - 1.35
    const period = 2.4
    const t = (clock.elapsedTime % period) / period
    const goT = Math.min(t * 2, 1)
    const backT = Math.max(0, t * 2 - 1)
    out.current.visible = showWaves && t < 0.5
    back.current.visible = showWaves && t >= 0.5
    out.current.position.set(-TX + goT * TX, 0, 1.35 + goT * travel)
    out.current.scale.setScalar(0.6 + goT * 1.4)
    back.current.position.set(backT * TX, 0, wallZ - backT * travel)
    back.current.scale.setScalar(2 - backT * 1.2)
  })

  return (
    <group>
      <Part id="placa" offset={[0, 0, -1.2]} labelAt={[0, 1.25, 0]}>
        <mesh geometry={body} castShadow>
          <meshStandardMaterial color="#1f62c0" roughness={0.5} />
        </mesh>
        <mesh geometry={face} position={[0, 0, US_T / 2 + 0.001]}>
          <meshStandardMaterial map={silk} roughness={0.45} />
        </mesh>
      </Part>
      <Part id="emisor" offset={[-0.8, 0, 1.2]} labelAt={[-TX, 1.1, 0.8]}>
        <Transducer x={-TX} />
      </Part>
      <Part id="receptor" offset={[0.8, 0, 1.2]} labelAt={[TX, 1.1, 0.8]}>
        <Transducer x={TX} />
      </Part>
      <Part id="cristal" offset={[0, 0.9, 0.6]} labelAt={[0, 0.85, 0.4]}>
        {/* cristal HC-49S acostado sobre la placa */}
        <mesh position={[0, 0.58, US_T / 2 + 0.2]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.78]}>
          <capsuleGeometry args={[0.2, 0.62, 8, 24]} />
          <meshStandardMaterial {...metal} roughness={0.25} />
        </mesh>
      </Part>
      <Part id="circuito" offset={[0, 0, -1.8]} labelAt={[0, -0.4, -0.4]}>
        <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -US_T / 2]}>
          <group rotation={[Math.PI, 0, 0]}>
            <Soic position={[-0.9, 0, 0.2]} pins={14} label="TL074" />
            <Soic position={[0.2, 0, 0.25]} pins={16} label="MAX232" />
            <Soic position={[1.2, 0, -0.1]} pins={8} label="EM78" />
          </group>
        </group>
        {/* puntos de soldadura de los transductores y pines */}
        {[-TX - 0.15, -TX + 0.15, TX - 0.15, TX + 0.15, -0.381, -0.127, 0.127, 0.381].map((x, i) => (
          <mesh key={i} position={[x, i < 4 ? 0 : -0.82, -US_T / 2 - 0.03]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.07, 0.07, 16]} />
            <meshStandardMaterial {...tinned} />
          </mesh>
        ))}
      </Part>
      <Part id="pines" offset={[0, -0.9, 0]} labelAt={[0.8, -1.6, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[(i - 1.5) * 0.254, -1.2, 0]}>
            <boxGeometry args={[0.064, 1.0, 0.064]} />
            <meshStandardMaterial color="#d6b45c" metalness={1} roughness={0.3} />
          </mesh>
        ))}
        <mesh position={[0, -1.12, 0]}>
          <boxGeometry args={[4 * 0.254, 0.25, 0.25]} />
          <meshStandardMaterial {...darkPlastic} />
        </mesh>
      </Part>

      {/* obstáculo y ondas: no son partes del sensor */}
      <mesh position={[0, 0, wallZ + 0.05]}>
        <boxGeometry args={[5, 3, 0.1]} />
        <meshStandardMaterial color="#8e5a3c" roughness={0.9} transparent opacity={0.45} depthWrite={false} />
      </mesh>
      <Label position={[2.6, 1.6, wallZ]} center style={{ pointerEvents: 'none' }}>
        <div className="part-label">obstáculo a {distanceCm} cm</div>
      </Label>
      <mesh ref={out}>
        <torusGeometry args={[0.6, 0.03, 8, 48]} />
        <meshBasicMaterial color="#5ad1ff" transparent opacity={0.8} />
      </mesh>
      <mesh ref={back}>
        <torusGeometry args={[0.6, 0.03, 8, 48]} />
        <meshBasicMaterial color="#ffb85a" transparent opacity={0.8} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* LDR GL5528 (1 unidad = 5 mm): disco cerámico Ø5 × 2 mm               */
/* ------------------------------------------------------------------ */

export function ldrResistance(lightPct: number): number {
  // aproximación logarítmica: ~1 MΩ en oscuridad, ~200 Ω a pleno sol
  const lg = Math.log10(1e6) - (lightPct / 100) * (Math.log10(1e6) - Math.log10(200))
  return Math.round(10 ** lg)
}

/** Dibuja los dos "peines" de electrodos que se entrelazan; devuelve el área de la pista. */
function drawComb(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  const fingers = 9
  const top = h * 0.17
  const bottom = h * 0.83
  const step = (bottom - top) / fingers
  ctx.fillStyle = color
  // barras laterales (siguen el borde del disco)
  ctx.beginPath()
  ctx.arc(w / 2, h / 2, w * 0.48, Math.PI * 0.62, Math.PI * 1.38)
  ctx.arc(w / 2, h / 2, w * 0.36, Math.PI * 1.38, Math.PI * 0.62, true)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(w / 2, h / 2, w * 0.48, -Math.PI * 0.38, Math.PI * 0.38)
  ctx.arc(w / 2, h / 2, w * 0.36, Math.PI * 0.38, -Math.PI * 0.38, true)
  ctx.fill()
  // dedos alternados
  for (let i = 0; i <= fingers; i++) {
    const y = top + i * step
    const fromLeft = i % 2 === 0
    const x0 = fromLeft ? w * 0.15 : w * 0.25
    ctx.fillRect(x0, y - step * 0.18, w * 0.6, step * 0.36)
  }
}

export function LdrModel({ light }: { light: number }) {
  const track = useCanvasTexture(
    1024,
    1024,
    (ctx, w, h) => {
      ctx.fillStyle = '#c4632a'
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, w * 0.46, 0, Math.PI * 2)
      ctx.fill()
    },
    [],
  )
  const electrodes = useCanvasTexture(1024, 1024, (ctx, w, h) => drawComb(ctx, w, h, '#e4e6ea'), [])
  const baseGeo = useMemo(
    () =>
      latheGeometry([
        [0, -0.2],
        [0.47, -0.2],
        [0.5, -0.17],
        [0.51, -0.08],
        [0.51, 0.06],
        [0.5, 0.085],
        [0.48, 0.095],
        [0, 0.095],
      ]),
    [],
  )
  const lamp = useRef<THREE.PointLight>(null)
  useFrame(() => {
    if (lamp.current) lamp.current.intensity += ((light / 100) * 25 - lamp.current.intensity) * 0.1
  })

  return (
    <group rotation={[0.5, 0, 0]}>
      <pointLight ref={lamp} position={[-1.2, 2.2, -1.2]} color="#fff6d8" intensity={0} distance={10} />
      <mesh position={[-1.2, 2.2, -1.2]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#fff6d8" emissive="#ffe28a" emissiveIntensity={light / 25} />
      </mesh>
      <Part id="base" offset={[0, -1.2, 0]} labelAt={[0.9, 0, 0]}>
        <mesh geometry={baseGeo} castShadow>
          <meshStandardMaterial color="#f3efe6" roughness={0.75} />
        </mesh>
      </Part>
      <Part id="pista" offset={[0, 0.7, 0]} labelAt={[0.8, 0.12, 0]}>
        <mesh position={[0, 0.097, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.48, 64]} />
          <meshStandardMaterial map={track} transparent alphaTest={0.1} roughness={0.7} />
        </mesh>
      </Part>
      <Part id="electrodos" offset={[0, 1.4, 0]} labelAt={[-0.8, 0.12, 0]}>
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.48, 64]} />
          <meshStandardMaterial map={electrodes} transparent alphaTest={0.1} metalness={0.85} roughness={0.3} />
        </mesh>
      </Part>
      <Part id="recubrimiento" offset={[0, 2.1, 0]} labelAt={[0, 0.35, 0]}>
        <mesh position={[0, 0.095, 0]} scale={[1, 0.12, 1]}>
          <sphereGeometry args={[0.5, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.18} roughness={0.05} clearcoat={1} depthWrite={false} />
        </mesh>
      </Part>
      <Part id="terminales" offset={[0, -1.8, 0]} labelAt={[0.6, -1.5, 0]}>
        {[-1, 1].map((s) => (
          <Wire key={s} points={[[s * 0.34, -0.15, 0], [s * 0.34, -1.0, 0], [s * 0.34, -4.0, 0]]} radius={0.05} {...tinned} />
        ))}
      </Part>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Utilidades para chapas estampadas (patas, lengüetas, escobillas)    */
/* ------------------------------------------------------------------ */

type P2 = [number, number]

/** Redondea las esquinas de una polilínea 2D (radio por esquina). */
export function filletPolyline(pts: P2[], radii: number | number[], seg = 6): P2[] {
  const out: P2[] = [pts[0]]
  for (let i = 1; i < pts.length - 1; i++) {
    const r = Array.isArray(radii) ? radii[i - 1] ?? 0 : radii
    const [ax, ay] = pts[i - 1]
    const [px, py] = pts[i]
    const [bx, by] = pts[i + 1]
    let d1x = px - ax
    let d1y = py - ay
    let d2x = bx - px
    let d2y = by - py
    const l1 = Math.hypot(d1x, d1y)
    const l2 = Math.hypot(d2x, d2y)
    d1x /= l1
    d1y /= l1
    d2x /= l2
    d2y /= l2
    const turn = Math.acos(Math.min(1, Math.max(-1, d1x * d2x + d1y * d2y)))
    if (r <= 0 || turn < 1e-3) {
      out.push(pts[i])
      continue
    }
    const td = Math.min(r * Math.tan(turn / 2), l1 * 0.49, l2 * 0.49)
    const t1: P2 = [px - d1x * td, py - d1y * td]
    const t2: P2 = [px + d2x * td, py + d2y * td]
    for (let k = 0; k <= seg; k++) {
      const t = k / seg
      const a = (1 - t) * (1 - t)
      const b = 2 * (1 - t) * t
      const c = t * t
      out.push([a * t1[0] + b * px + c * t2[0], a * t1[1] + b * py + c * t2[1]])
    }
  }
  out.push(pts[pts.length - 1])
  return out
}

/**
 * Tira de chapa doblada: el perfil (línea media) está en el plano XY y la tira se extruye
 * a lo largo de Z con el ancho dado (centrada en z = 0).
 */
export function stripGeometry(center: P2[], thickness: number, width: number) {
  const n = center.length
  const left: P2[] = []
  const right: P2[] = []
  for (let i = 0; i < n; i++) {
    const p = center[i]
    const a = center[Math.max(0, i - 1)]
    const b = center[Math.min(n - 1, i + 1)]
    let tx = b[0] - a[0]
    let ty = b[1] - a[1]
    const l = Math.hypot(tx, ty) || 1
    tx /= l
    ty /= l
    const nx = -ty
    const ny = tx
    const h = thickness / 2
    left.push([p[0] + nx * h, p[1] + ny * h])
    right.push([p[0] - nx * h, p[1] - ny * h])
  }
  const s = new THREE.Shape()
  s.moveTo(...left[0])
  left.slice(1).forEach((p) => s.lineTo(...p))
  right.reverse().forEach((p) => s.lineTo(...p))
  s.closePath()
  const g = new THREE.ExtrudeGeometry(s, { depth: width, bevelEnabled: false, curveSegments: 4 })
  g.translate(0, 0, -width / 2)
  g.computeVertexNormals()
  return g
}

/** Arco de puntos (en el plano de la forma) desde a0 hasta a1. */
function arcPts(r: number, a0: number, a1: number, n = 48): P2[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n
    return [Math.cos(a) * r, Math.sin(a) * r] as P2
  })
}

/* ------------------------------------------------------------------ */
/* Potenciómetro rotativo de 16 mm tipo Alpha, B10K (1 unidad = 10 mm) */
/* Ejes: el eje del potenciómetro es +y; los terminales salen hacia +z. */
/* Ángulo φ medido desde +z hacia +x (igual que LatheGeometry).         */
/* ------------------------------------------------------------------ */

const POT_R = 0.8 // carcasa Ø16 mm
const POT_TOP = 0.5 // cara frontal de la carcasa
const POT_BUSH = 1.2 // fin del buje roscado M7 × 7 mm
const POT_SHAFT = 2.2 // punta del eje: sobresale 17 mm del frente
const WAFER_T = 0.16 // base de pertinax de 1,6 mm
const TRACK_IN = 0.38
const TRACK_OUT = 0.6
const TRACK_GAP = 30 // la abertura de la herradura mide 2 × 30° y mira a los terminales
const LUG_X = [-0.5, 0, 0.5] // paso de 5 mm
const LUG_Z = 0.82 // remaches
const TONGUE = 0.66 // media anchura de la lengüeta de la base
const CAN_GAP = 60 // abertura de la carcasa por donde salen los terminales (±)

export function PotentiometerModel({ angle }: { angle: number }) {
  const phi = (-(TRACK_GAP + angle) * Math.PI) / 180

  // base de pertinax: disco + lengüeta hacia los terminales (forma en x, -z)
  const wafer = useMemo(() => {
    const zc = Math.sqrt(0.78 * 0.78 - TONGUE * TONGUE)
    const a1 = Math.atan2(-zc, TONGUE)
    const pts = arcPts(0.78, a1, Math.PI - a1, 64)
    const s = new THREE.Shape()
    s.moveTo(...pts[0])
    pts.slice(1).forEach((p) => s.lineTo(...p))
    s.lineTo(-TONGUE, -0.98)
    s.lineTo(TONGUE, -0.98)
    s.closePath()
    const body = new THREE.ExtrudeGeometry(s, { depth: WAFER_T, bevelEnabled: false, curveSegments: 8 })
    body.rotateX(-Math.PI / 2)
    const face = new THREE.ShapeGeometry(s, 8)
    const pos = face.attributes.position
    const uv = new Float32Array(pos.count * 2)
    for (let i = 0; i < pos.count; i++) {
      uv[i * 2] = (pos.getX(i) + 0.8) / 1.6
      uv[i * 2 + 1] = (pos.getY(i) + 1.0) / 1.8
    }
    face.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
    face.rotateX(-Math.PI / 2)
    return { body, face }
  }, [])
  // serigrafía de plata: anillo colector y pistas hacia los remaches
  const waferTex = useCanvasTexture(
    512,
    576,
    (ctx, w, h) => {
      const X = (x: number) => ((x + 0.8) / 1.6) * w
      const Z = (z: number) => ((z + 0.8) / 1.8) * h
      const S = w / 1.6
      ctx.fillStyle = '#7a5434'
      ctx.fillRect(0, 0, w, h)
      // vetas del pertinax
      ctx.globalAlpha = 0.08
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = i % 2 ? '#000' : '#fff'
        ctx.fillRect(0, (i / 60) * h, w, 2)
      }
      ctx.globalAlpha = 1
      ctx.strokeStyle = '#cfd3d8'
      ctx.fillStyle = '#cfd3d8'
      ctx.lineCap = 'round'
      // anillo colector (lo toca el dedo interior del cursor)
      ctx.lineWidth = 0.12 * S
      ctx.beginPath()
      ctx.arc(X(0), Z(0), 0.23 * S, 0, Math.PI * 2)
      ctx.stroke()
      // del colector al terminal 2
      ctx.lineWidth = 0.1 * S
      ctx.beginPath()
      ctx.moveTo(X(0), Z(0.28))
      ctx.lineTo(X(0), Z(LUG_Z))
      ctx.stroke()
      // extremos de la pista hacia los terminales 1 y 3
      for (const sx of [-1, 1]) {
        const a = (TRACK_GAP * Math.PI) / 180
        const r = (TRACK_IN + TRACK_OUT) / 2
        ctx.beginPath()
        ctx.moveTo(X(sx * r * Math.sin(a)), Z(r * Math.cos(a)))
        ctx.lineTo(X(sx * 0.5), Z(LUG_Z))
        ctx.stroke()
        // pad plateado bajo el extremo de la pista
        ctx.beginPath()
        ctx.arc(X(sx * r * Math.sin(a)), Z(r * Math.cos(a)), 0.1 * S, 0, Math.PI * 2)
        ctx.fill()
      }
      for (const x of LUG_X) {
        ctx.beginPath()
        ctx.arc(X(x), Z(LUG_Z), 0.1 * S, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = '#f2e6cf'
      ctx.font = `bold ${0.11 * S}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('1', X(-0.5), Z(0.62))
      ctx.fillText('2', X(0.14), Z(0.62))
      ctx.fillText('3', X(0.5), Z(0.62))
    },
    [],
  )

  // herradura de carbón (~300°), con un poco de espesor para que se vea al despiezar
  const trackGeo = useMemo(() => {
    const a0 = ((TRACK_GAP - 90) * Math.PI) / 180
    const a1 = a0 + ((360 - 2 * TRACK_GAP) * Math.PI) / 180
    const outer = arcPts(TRACK_OUT, a0, a1, 72)
    const inner = arcPts(TRACK_IN, a1, a0, 72)
    const s = new THREE.Shape()
    s.moveTo(...outer[0])
    outer.slice(1).forEach((p) => s.lineTo(...p))
    inner.forEach((p) => s.lineTo(...p))
    s.closePath()
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.014, bevelEnabled: false })
    // forma en (x, y) con ángulo desde +x; se acuesta para que quede con φ desde +z
    g.rotateX(-Math.PI / 2) // (x, y) → (x, -z)... la abertura queda hacia +z
    return g
  }, [])

  // cursor: estrella de chapa con el brazo hacia afuera
  const wiperGeo = useMemo(() => {
    const s = new THREE.Shape()
    const ring = arcPts(0.3, -Math.PI / 2 + 0.38, (3 * Math.PI) / 2 - 0.38, 40)
    s.moveTo(-0.11, -0.66)
    s.lineTo(-0.11, -0.28)
    ring.reverse().forEach(([x, y]) => s.lineTo(x, y))
    s.lineTo(0.11, -0.28)
    s.lineTo(0.11, -0.66)
    s.lineTo(0.025, -0.66)
    s.lineTo(0.025, -0.5)
    s.lineTo(-0.025, -0.5)
    s.lineTo(-0.025, -0.66)
    s.closePath()
    const hole = new THREE.Path()
    hole.absarc(0, 0, 0.11, 0, Math.PI * 2, true)
    s.holes.push(hole)
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.014, bevelEnabled: false, curveSegments: 16 })
    g.rotateX(-Math.PI / 2) // brazo hacia +z
    return g
  }, [])

  const canGeo = useMemo(
    () =>
      latheGeometry(
        [
          [POT_R, 0.22],
          [POT_R, POT_TOP - 0.04],
          [POT_R - 0.035, POT_TOP],
          [0.36, POT_TOP],
        ],
        72,
      ),
    [],
  )
  const canLowGeo = useMemo(() => {
    const a = (CAN_GAP * Math.PI) / 180
    return new THREE.LatheGeometry([new THREE.Vector2(POT_R, 0), new THREE.Vector2(POT_R, 0.22)], 60, a, Math.PI * 2 - 2 * a)
  }, [])
  const threadGeo = useMemo(() => {
    // rosca M7 × 0,75: hélice continua
    const turns = 9
    const pts = Array.from({ length: turns * 24 + 1 }, (_, i) => {
      const t = i / 24
      const a = t * Math.PI * 2
      return new THREE.Vector3(Math.sin(a) * 0.335, POT_TOP + 0.04 + t * 0.072, Math.cos(a) * 0.335)
    })
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), turns * 24, 0.022, 6, false)
  }, [])
  const nutGeo = useMemo(() => {
    const s = new THREE.Shape()
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6
      if (i === 0) s.moveTo(Math.cos(a) * 0.53, Math.sin(a) * 0.53)
      else s.lineTo(Math.cos(a) * 0.53, Math.sin(a) * 0.53)
    }
    s.closePath()
    const h = new THREE.Path()
    h.absarc(0, 0, 0.35, 0, Math.PI * 2, true)
    s.holes.push(h)
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1, curveSegments: 24 })
    g.rotateX(-Math.PI / 2)
    return g
  }, [])
  const washerGeo = useMemo(() => {
    const g = new THREE.RingGeometry(0.36, 0.6, 40, 1)
    return g
  }, [])
  const knurlGeo = useMemo(() => gearGeometry(18, 0.3, 0.85, 0, 0.88), [])
  const markTex = useCanvasTexture(
    256,
    64,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#2a2a2a'
      ctx.font = 'bold 40px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('B10K', w / 2, h / 2 + 2)
    },
    [],
  )

  // terminales: chapa plana con ojal sobre la base, doblada 90° hacia abajo (para la placa)
  const lugFlat = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.11, -0.68)
    s.lineTo(0.11, -0.68)
    s.lineTo(0.11, -1.08)
    s.lineTo(-0.11, -1.08)
    s.closePath()
    const h = new THREE.Path()
    h.absarc(0, -0.97, 0.05, 0, Math.PI * 2, true)
    s.holes.push(h)
    const r = new THREE.Path()
    r.absarc(0, -LUG_Z, 0.035, 0, Math.PI * 2, true)
    s.holes.push(r)
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: false, curveSegments: 16 })
    g.rotateX(-Math.PI / 2)
    return g
  }, [])
  const lugBend = useMemo(() => {
    const g = stripGeometry(
      filletPolyline(
        [
          [1.075, WAFER_T + 0.02],
          [1.16, WAFER_T + 0.02],
          [1.16, -0.32],
        ],
        [0.07],
      ),
      0.04,
      0.22,
    )
    g.rotateY(-Math.PI / 2) // perfil (z, y) extruido a lo largo de x
    return g
  }, [])

  const lugTip = -0.66

  return (
    <group position={[0, -0.3, 0]}>
      <Part id="terminales" offset={[0, -0.72, 0]} labelAt={[1.25, -0.3, 1.16]}>
        {LUG_X.map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh geometry={lugFlat} position={[0, WAFER_T, 0]} castShadow>
              <meshStandardMaterial {...tinned} side={THREE.DoubleSide} />
            </mesh>
            <mesh geometry={lugBend} castShadow>
              <meshStandardMaterial {...tinned} />
            </mesh>
            {/* punta para la placa, más angosta */}
            <mesh position={[0, (-0.32 + lugTip) / 2, 1.16]}>
              <boxGeometry args={[0.12, -0.32 - lugTip, 0.04]} />
              <meshStandardMaterial {...tinned} />
            </mesh>
            {/* remache que fija el terminal a la base */}
            <mesh position={[0, WAFER_T + 0.055, LUG_Z]}>
              <cylinderGeometry args={[0.06, 0.07, 0.03, 20]} />
              <meshStandardMaterial {...tinned} />
            </mesh>
            <mesh position={[0, WAFER_T / 2, LUG_Z]}>
              <cylinderGeometry args={[0.034, 0.034, WAFER_T + 0.06, 12]} />
              <meshStandardMaterial {...tinned} />
            </mesh>
          </group>
        ))}
        {(['1', '2', '3'] as const).map((t, i) => (
          <Label key={t} position={[LUG_X[i], lugTip - 0.14, 1.16]} center style={{ pointerEvents: 'none' }}>
            <div className="pin-tag">{t}</div>
          </Label>
        ))}
      </Part>

      <Part id="base" offset={[0, -0.42, 0]} labelAt={[-1.2, 0.05, 0.2]}>
        <mesh geometry={wafer.body} castShadow>
          <meshStandardMaterial color="#6e4b2e" roughness={0.75} />
        </mesh>
        <mesh geometry={wafer.face} position={[0, WAFER_T + 0.001, 0]}>
          <meshStandardMaterial map={waferTex} roughness={0.6} metalness={0.15} />
        </mesh>
      </Part>

      <Part id="pista" offset={[0, -0.17, 0]} labelAt={[1.15, 0.17, 0]}>
        <mesh geometry={trackGeo} position={[0, WAFER_T + 0.002, 0]}>
          <meshStandardMaterial color="#1d1b1a" roughness={0.85} />
        </mesh>
      </Part>

      <Part id="cursor" offset={[0, 0.27, 0]} labelAt={[-1.0, 0.28, 0]}>
        <group rotation={[0, phi, 0]}>
          {/* rotor plástico que arrastra el eje */}
          <mesh position={[0, 0.27, 0]}>
            <cylinderGeometry args={[0.32, 0.32, 0.1, 40]} />
            <meshStandardMaterial color="#e9e4d6" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.322, 0]}>
            <boxGeometry args={[0.36, 0.006, 0.08]} />
            <meshStandardMaterial color="#555" roughness={0.7} />
          </mesh>
          {/* escobilla: chapa de alpaca con dos dedos sobre la pista */}
          <mesh geometry={wiperGeo} position={[0, 0.205, 0]}>
            <meshStandardMaterial color="#e2d3a4" metalness={0.9} roughness={0.3} side={THREE.DoubleSide} />
          </mesh>
          {[-0.07, 0.07].map((x) => (
            <mesh key={x} position={[x, 0.195, 0.53]} rotation={[0.55, 0, 0]}>
              <boxGeometry args={[0.06, 0.012, 0.14]} />
              <meshStandardMaterial color="#e2d3a4" metalness={0.9} roughness={0.3} />
            </mesh>
          ))}
        </group>
      </Part>

      <Part id="carcasa" offset={[0, 0.7, 0]} labelAt={[1.1, 0.4, -0.2]}>
        <mesh geometry={canGeo} castShadow>
          <meshStandardMaterial {...metal} roughness={0.3} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={canLowGeo} castShadow>
          <meshStandardMaterial {...metal} roughness={0.3} side={THREE.DoubleSide} />
        </mesh>
        {/* lengüetas que se doblan por debajo de la base y la aprietan */}
        {[110, 180, 250].map((d) => {
          const a = (d * Math.PI) / 180
          return (
            <group key={d} rotation={[0, a, 0]}>
              <mesh position={[0, -0.012, POT_R - 0.07]}>
                <boxGeometry args={[0.22, 0.025, 0.16]} />
                <meshStandardMaterial {...metal} roughness={0.35} />
              </mesh>
              <mesh position={[0, 0.0, POT_R - 0.005]}>
                <boxGeometry args={[0.22, 0.04, 0.012]} />
                <meshStandardMaterial {...metal} roughness={0.35} />
              </mesh>
            </group>
          )
        })}
        {/* pestaña anti-giro (encaja en un agujerito del panel) */}
        <mesh position={[0, POT_TOP + 0.1, -0.68]}>
          <boxGeometry args={[0.16, 0.2, 0.04]} />
          <meshStandardMaterial {...metal} roughness={0.35} />
        </mesh>
        {/* marca impresa en el costado */}
        <mesh position={[0, 0.27, 0]}>
          <cylinderGeometry args={[POT_R + 0.002, POT_R + 0.002, 0.16, 24, 1, true, (70 * Math.PI) / 180, (60 * Math.PI) / 180]} />
          <meshStandardMaterial map={markTex} transparent roughness={0.5} />
        </mesh>
        {/* buje roscado M7 */}
        <mesh position={[0, (POT_TOP + POT_BUSH) / 2, 0]}>
          <cylinderGeometry args={[0.322, 0.322, POT_BUSH - POT_TOP, 40]} />
          <meshStandardMaterial color="#c9ccd1" metalness={0.9} roughness={0.32} />
        </mesh>
        <mesh geometry={threadGeo}>
          <meshStandardMaterial color="#c9ccd1" metalness={0.9} roughness={0.32} />
        </mesh>
        <mesh position={[0, POT_BUSH - 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.34, 40]} />
          <meshStandardMaterial color="#c9ccd1" metalness={0.9} roughness={0.32} />
        </mesh>
      </Part>

      <Part id="tuerca" offset={[0, 1.45, 0]} labelAt={[1.05, 0.62, 0]}>
        <mesh geometry={washerGeo} position={[0, POT_TOP + 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <meshStandardMaterial {...metal} roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, POT_TOP + 0.017, 0]}>
          <cylinderGeometry args={[0.6, 0.6, 0.035, 40, 1, true]} />
          <meshStandardMaterial {...metal} roughness={0.4} />
        </mesh>
        <mesh geometry={nutGeo} position={[0, POT_TOP + 0.06, 0]} castShadow>
          <meshStandardMaterial color="#d5d8dc" metalness={0.95} roughness={0.28} />
        </mesh>
      </Part>

      <Part id="eje" offset={[0, 2.2, 0]} labelAt={[0.75, 1.75, 0]}>
        <group rotation={[0, phi, 0]}>
          <mesh position={[0, (0.3 + POT_SHAFT - 0.85) / 2, 0]}>
            <cylinderGeometry args={[0.28, 0.28, POT_SHAFT - 0.85 - 0.3, 32]} />
            <meshStandardMaterial color="#d0d3d8" metalness={0.9} roughness={0.3} />
          </mesh>
          {/* lengüeta inferior que arrastra el rotor */}
          <mesh position={[0, 0.27, 0]}>
            <boxGeometry args={[0.34, 0.08, 0.07]} />
            <meshStandardMaterial color="#d0d3d8" metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh geometry={knurlGeo} position={[0, POT_SHAFT - 0.85, 0]} castShadow>
            <meshStandardMaterial color="#d6d9de" metalness={0.9} roughness={0.32} flatShading />
          </mesh>
          <mesh position={[0, POT_SHAFT - 0.0005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.264, 36]} />
            <meshStandardMaterial color="#d6d9de" metalness={0.9} roughness={0.32} />
          </mesh>
          {/* ranura (el eje moleteado está partido para que entre a presión la perilla) */}
          <mesh position={[0, POT_SHAFT - 0.2, 0]}>
            <boxGeometry args={[0.62, 0.41, 0.07]} />
            <meshStandardMaterial color="#1a1a1c" roughness={0.8} />
          </mesh>
          {/* marquita de pintura: indica hacia dónde apunta el cursor */}
          <mesh position={[0.0, POT_SHAFT + 0.002, 0.17]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.045, 16]} />
            <meshStandardMaterial color="#e33" roughness={0.5} />
          </mesh>
        </group>
      </Part>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Pulsador táctil 6 × 6 × 5 mm (modelado en mm y escalado)            */
/* ------------------------------------------------------------------ */

const BT_FLOOR = 2.0 // piso de la cavidad (contactos)
const BT_TOP = 3.5 // cara superior del cuerpo plástico
const BT_PLATE = 0.25 // espesor de la tapa metálica
const DOME_H = 0.4
const PIN_X = 3.25 // patas a 6,5 mm
const PIN_Z = 2.25 // y a 4,5 mm

export function ButtonModel({ pressed }: { pressed: boolean }) {
  const cap = useRef<THREE.Group>(null)
  const dome = useRef<THREE.Group>(null)
  useFrame(() => {
    if (cap.current) cap.current.position.y += ((pressed ? -0.3 : 0) - cap.current.position.y) * 0.35
    if (dome.current) dome.current.scale.y += ((pressed ? 0.28 : 1) - dome.current.scale.y) * 0.35
  })

  const geos = useMemo(() => {
    // cuerpo: parte superior con la cavidad redonda
    const frame = new THREE.Shape()
    frame.moveTo(-2.92, -2.92)
    frame.lineTo(2.92, -2.92)
    frame.lineTo(2.92, 2.92)
    frame.lineTo(-2.92, 2.92)
    frame.closePath()
    const cav = new THREE.Path()
    cav.absarc(0, 0, 2.33, 0, Math.PI * 2, true)
    frame.holes.push(cav)
    const top = new THREE.ExtrudeGeometry(frame, { depth: BT_TOP - BT_FLOOR - 0.08, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 2, curveSegments: 40 })
    top.rotateX(-Math.PI / 2)
    top.translate(0, BT_FLOOR, 0)
    // tapa: chapa 6 × 6 con agujero para el botón
    const plate = new THREE.Shape()
    const r = 0.35
    plate.moveTo(-3 + r, -3)
    plate.lineTo(3 - r, -3)
    plate.quadraticCurveTo(3, -3, 3, -3 + r)
    plate.lineTo(3, 3 - r)
    plate.quadraticCurveTo(3, 3, 3 - r, 3)
    plate.lineTo(-3 + r, 3)
    plate.quadraticCurveTo(-3, 3, -3, 3 - r)
    plate.lineTo(-3, -3 + r)
    plate.quadraticCurveTo(-3, -3, -3 + r, -3)
    const ph = new THREE.Path()
    ph.absarc(0, 0, 1.9, 0, Math.PI * 2, true)
    plate.holes.push(ph)
    const plateGeo = new THREE.ExtrudeGeometry(plate, { depth: BT_PLATE, bevelEnabled: false, curveSegments: 40 })
    plateGeo.rotateX(-Math.PI / 2)
    // lengüeta de la tapa: sale del borde y baja abrazando el cuerpo
    const tab = stripGeometry(
      filletPolyline(
        [
          [2.5, BT_TOP + BT_PLATE / 2],
          [3.08, BT_TOP + BT_PLATE / 2],
          [3.08, 2.15],
          [2.9, 1.95],
        ],
        [0.15, 0.08],
      ),
      0.15,
      1.2,
    )
    tab.rotateY(-Math.PI / 2) // perfil (z, y)
    // pata: sale horizontal del cuerpo, baja 90° y tiene un "codito" que hace de tope en la placa
    const leg = stripGeometry(
      filletPolyline(
        [
          [2.3, BT_FLOOR - 0.1],
          [2.3, 0.65],
          [PIN_X, 0.65],
          [PIN_X, -0.6],
          [PIN_X + 0.2, -0.85],
          [PIN_X, -1.1],
          [PIN_X, -3.5],
        ],
        [0.2, 0.25, 0.15, 0.2, 0.15],
      ),
      0.3,
      0.8,
    )
    // domo metálico (casquete esférico de Ø 3,8 mm y 0,4 mm de alto)
    const a = 1.9
    const R = (a * a + DOME_H * DOME_H) / (2 * DOME_H)
    const domeGeo = new THREE.SphereGeometry(R, 48, 6, 0, Math.PI * 2, 0, Math.asin(a / R))
    domeGeo.translate(0, DOME_H - R, 0)
    // contacto exterior (lo toca el borde del domo): arco en la mitad de atrás
    const ring = new THREE.Shape()
    const o = arcPts(2.15, Math.PI * 0.1, Math.PI * 0.9, 32)
    const i = arcPts(1.55, Math.PI * 0.9, Math.PI * 0.1, 32)
    ring.moveTo(...o[0])
    o.slice(1).forEach((p) => ring.lineTo(...p))
    i.forEach((p) => ring.lineTo(...p))
    ring.closePath()
    const ringGeo = new THREE.ExtrudeGeometry(ring, { depth: 0.08, bevelEnabled: false })
    ringGeo.rotateX(-Math.PI / 2) // la forma con y>0 queda hacia -z
    return { top, plateGeo, tab, leg, domeGeo, ringGeo }
  }, [])

  const corners: [number, number][] = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]
  const frameMat = (
    <meshStandardMaterial {...tinned} emissive="#22c55e" emissiveIntensity={pressed ? 0.28 : 0} />
  )

  return (
    <group scale={0.36} position={[0, -0.75, 0]}>
      <Part id="terminales" offset={[0, -3.0, 0]} labelAt={[4.8, -2.4, 2.6]}>
        {/* marco de contactos: par 1–2 (atrás, al borde del domo) y par 3–4 (adelante, al centro) */}
        {corners.map(([sx, sz]) => (
          <mesh key={`${sx}${sz}`} geometry={geos.leg} position={[0, 0, sz * PIN_Z]} scale={[sx, 1, 1]} castShadow>
            {frameMat}
          </mesh>
        ))}
        {[-1, 1].map((sz) => (
          <mesh key={sz} position={[0, BT_FLOOR - 0.12, sz * PIN_Z]}>
            <boxGeometry args={[4.9, 0.12, 0.8]} />
            {frameMat}
          </mesh>
        ))}
        {/* 1–2: arco exterior sobre el que apoya el borde del domo */}
        <mesh geometry={geos.ringGeo} position={[0, BT_FLOOR - 0.06, 0]}>
          {frameMat}
        </mesh>
        <mesh position={[0, BT_FLOOR - 0.03, -2.0]}>
          <boxGeometry args={[0.9, 0.08, 0.6]} />
          {frameMat}
        </mesh>
        {/* 3–4: contacto central (lo toca el domo cuando se aplasta) */}
        <mesh position={[0, BT_FLOOR - 0.02, 0]}>
          <cylinderGeometry args={[0.7, 0.7, 0.08, 32]} />
          {frameMat}
        </mesh>
        <mesh position={[0, BT_FLOOR - 0.03, 1.4]}>
          <boxGeometry args={[0.7, 0.08, 1.8]} />
          {frameMat}
        </mesh>
        {[
          ['1', -1, -1],
          ['2', 1, -1],
          ['3', -1, 1],
          ['4', 1, 1],
        ].map(([t, sx, sz]) => (
          <Label key={t as string} position={[(sx as number) * PIN_X, -4.0, (sz as number) * PIN_Z]} center style={{ pointerEvents: 'none' }}>
            <div className="pin-tag">{t}</div>
          </Label>
        ))}
      </Part>

      <Part id="base" offset={[0, 0, 0]} labelAt={[-4.4, 1.6, 0]}>
        <mesh position={[0, (0.3 + BT_FLOOR) / 2, 0]} castShadow>
          <boxGeometry args={[6, BT_FLOOR - 0.3, 6]} />
          <meshStandardMaterial color="#17171a" roughness={0.55} />
        </mesh>
        <mesh geometry={geos.top} castShadow>
          <meshStandardMaterial color="#17171a" roughness={0.55} />
        </mesh>
        {/* piso de la cavidad (un poco más claro para que se lea la profundidad) */}
        <mesh position={[0, BT_FLOOR + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.25, 40]} />
          <meshStandardMaterial color="#26262a" roughness={0.7} />
        </mesh>
        {/* patitas de apoyo en las esquinas */}
        {corners.map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x * 2.45, 0.15, z * 2.45]}>
            <cylinderGeometry args={[0.45, 0.5, 0.3, 16]} />
            <meshStandardMaterial color="#17171a" roughness={0.6} />
          </mesh>
        ))}
        {/* ranuras por donde salen las patas */}
        {corners.map(([x, z]) => (
          <mesh key={`s${x}${z}`} position={[x * 3.0, 0.65, z * PIN_Z]}>
            <boxGeometry args={[0.04, 0.5, 1.0]} />
            <meshStandardMaterial color="#050505" roughness={0.9} />
          </mesh>
        ))}
      </Part>

      <Part id="domo" offset={[0, 2.5, 0]} labelAt={[3.6, 2.6, 0]}>
        <group ref={dome} position={[0, BT_FLOOR + 0.08, 0]}>
          <mesh geometry={geos.domeGeo}>
            <meshStandardMaterial color="#e3e6ea" metalness={1} roughness={0.18} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </Part>

      <Part id="tapa" offset={[0, 4.6, 0]} labelAt={[4.4, 3.8, -2]}>
        <mesh geometry={geos.plateGeo} position={[0, BT_TOP, 0]} castShadow>
          <meshStandardMaterial {...metal} roughness={0.32} />
        </mesh>
        {[-1, 1].map((sz) =>
          [-1, 1].map((sx) => (
            <mesh key={`${sx}${sz}`} geometry={geos.tab} position={[sx * 1.6, 0, 0]} scale={[1, 1, sz]}>
              <meshStandardMaterial {...metal} roughness={0.32} side={THREE.DoubleSide} />
            </mesh>
          )),
        )}
      </Part>

      <Part id="boton" offset={[0, 6.9, 0]} labelAt={[2.8, 5.4, 0]}>
        <group ref={cap}>
          {/* topecito que aprieta el centro del domo */}
          <mesh position={[0, BT_FLOOR + 0.08 + DOME_H + 0.08, 0]}>
            <cylinderGeometry args={[0.45, 0.5, 0.16, 24]} />
            <meshStandardMaterial color="#1c1c1f" roughness={0.5} />
          </mesh>
          {/* pestaña ancha: queda debajo de la tapa y evita que el botón se salga */}
          <mesh position={[0, (BT_FLOOR + DOME_H + 0.24 + BT_TOP - 0.05) / 2, 0]}>
            <cylinderGeometry args={[2.15, 2.15, BT_TOP - 0.05 - (BT_FLOOR + DOME_H + 0.24), 40]} />
            <meshStandardMaterial color="#1c1c1f" roughness={0.5} />
          </mesh>
          <mesh position={[0, (BT_TOP + 4.95) / 2, 0]} castShadow>
            <cylinderGeometry args={[1.75, 1.75, 4.95 - BT_TOP, 40]} />
            <meshStandardMaterial color="#1c1c1f" roughness={0.45} />
          </mesh>
          <mesh position={[0, 4.95, 0]} scale={[1, 0.06, 1]}>
            <sphereGeometry args={[1.75, 40, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#1c1c1f" roughness={0.45} />
          </mesh>
        </group>
      </Part>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* DHT11: 12 × 15,5 × 5,5 mm (1 unidad = 10 mm)                        */
/* ------------------------------------------------------------------ */

const DW = 1.2
const DH = 1.55
const DD = 0.55

export function Dht11Model() {
  // frente con rejilla: una placa con ventanitas reales (agujeros)
  const grilleGeo = useMemo(() => {
    const s = new THREE.Shape()
    const r = 0.08
    const x0 = -DW / 2
    const y0 = -DH / 2
    s.moveTo(x0 + r, y0)
    s.lineTo(x0 + DW - r, y0)
    s.quadraticCurveTo(x0 + DW, y0, x0 + DW, y0 + r)
    s.lineTo(x0 + DW, y0 + DH - r)
    s.quadraticCurveTo(x0 + DW, y0 + DH, x0 + DW - r, y0 + DH)
    s.lineTo(x0 + r, y0 + DH)
    s.quadraticCurveTo(x0, y0 + DH, x0, y0 + DH - r)
    s.lineTo(x0, y0 + r)
    s.quadraticCurveTo(x0, y0, x0 + r, y0)
    const cols = 4
    const rows = 6
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++) {
        const cx = -0.39 + i * 0.26
        const cy = -0.38 + j * 0.2
        const hw = 0.085
        const hh = 0.06
        const p = new THREE.Path()
        p.moveTo(cx - hw, cy - hh)
        p.lineTo(cx - hw, cy + hh)
        p.lineTo(cx + hw, cy + hh)
        p.lineTo(cx + hw, cy - hh)
        p.closePath()
        s.holes.push(p)
      }
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2 })
    return g
  }, [])
  const plastic = <meshStandardMaterial color="#2f86d9" roughness={0.55} />

  return (
    <group position={[0, 0.2, 0]}>
      <Part id="carcasa" offset={[0, 0, 1.4]} labelAt={[0.9, 0.9, 0.3]}>
        <mesh geometry={grilleGeo} position={[0, 0, DD / 2 - 0.14]} castShadow>
          {plastic}
        </mesh>
        {/* paredes laterales */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * (DW / 2 - 0.04), 0, 0]}>
            <boxGeometry args={[0.08, DH, DD - 0.1]} />
            {plastic}
          </mesh>
        ))}
        {[-1, 1].map((sy) => (
          <mesh key={sy} position={[0, sy * (DH / 2 - 0.04), 0]}>
            <boxGeometry args={[DW, 0.08, DD - 0.1]} />
            {plastic}
          </mesh>
        ))}
      </Part>
      <Part id="tapa" offset={[0, 0, -1.2]} labelAt={[-0.9, 0.8, -0.2]}>
        <mesh position={[0, 0, -DD / 2 + 0.05]}>
          <boxGeometry args={[DW, DH, 0.1]} />
          {plastic}
        </mesh>
      </Part>
      <Part id="humedad" offset={[0.9, 0.2, 0.8]} labelAt={[-0.2, 0.7, 0.2]}>
        <mesh position={[-0.12, 0.22, 0.02]}>
          <boxGeometry args={[0.6, 0.62, 0.04]} />
          <meshStandardMaterial color="#5e4127" roughness={0.5} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} position={[-0.12 + (i % 2 ? 0.04 : -0.04), -0.03 + i * 0.1, 0.045]}>
            <boxGeometry args={[0.46, 0.035, 0.01]} />
            <meshStandardMaterial color="#e2c072" metalness={0.9} roughness={0.3} />
          </mesh>
        ))}
      </Part>
      <Part id="termistor" offset={[-0.8, 0.4, 0.8]} labelAt={[0.45, 0.62, 0.2]}>
        <mesh position={[0.36, 0.38, 0.05]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color="#111" roughness={0.4} />
        </mesh>
        <Wire points={[[0.34, 0.33, 0.05], [0.34, -0.1, 0.0]]} radius={0.01} {...tinned} />
        <Wire points={[[0.38, 0.33, 0.05], [0.38, -0.1, 0.0]]} radius={0.01} {...tinned} />
      </Part>
      <Part id="chip" offset={[0, -0.6, 0.8]} labelAt={[0, -0.3, 0.2]}>
        <mesh position={[0, -0.45, 0.0]}>
          <boxGeometry args={[0.9, 0.3, 0.04]} />
          <meshStandardMaterial color="#1f6b35" roughness={0.6} />
        </mesh>
        <mesh position={[0.15, -0.45, 0.04]}>
          <boxGeometry args={[0.32, 0.2, 0.05]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      </Part>
      <Part id="pines" offset={[0, -1.0, 0]} labelAt={[0.7, -1.5, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <Wire key={i} points={[[(i - 1.5) * 0.254, -DH / 2 + 0.1, 0], [(i - 1.5) * 0.254, -DH / 2 - 0.9, 0]]} radius={0.025} square smooth={0} {...tinned} />
        ))}
        <Label position={[0, -DH / 2 - 1.1, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="pin-tag">VCC · DATA · NC · GND</div>
        </Label>
      </Part>
    </group>
  )
}
