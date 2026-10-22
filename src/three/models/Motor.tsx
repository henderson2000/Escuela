import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Label } from '../Label'
import { Part, useParts } from '../Part'
import { Wire, gearGeometry, latheGeometry, metal, tinned, useCanvasTexture } from '../helpers'
import { filletPolyline, stripGeometry } from './Sensors'

/* ------------------------------------------------------------------ */
/* Motor de corriente continua tamaño "130" (3–6 V), 1 unidad = 10 mm   */
/* Eje del motor = +x (el eje de salida asoma hacia +x).                */
/* Carcasa de 20 × 15 mm (redonda con dos lados planos, arriba/abajo).  */
/* Las formas 2D se dibujan en (u, v) y se extruyen a lo largo de x:    */
/*   x = w, y = v, z = −u                                              */
/* ------------------------------------------------------------------ */

type P2 = [number, number]

const CAN_R = 1.0
const CAN_F = 0.75 // lados planos a ±7,5 mm
const CAN_BACK = -1.0
const CAN_FRONT = 1.01
const CAP_BACK = -1.38
const SHAFT_R = 0.1 // eje de 2 mm
const SHAFT_TIP = 2.0
const COMM_X = -0.83 // centro del colector
const TERM_Z = 0.62

function arc(r: number, a0: number, a1: number, n = 24, cx = 0, cy = 0): P2[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as P2
  })
}

/** Contorno "redondo con dos lados planos" (sentido antihorario). */
function stadium(R: number, F: number): P2[] {
  const a = Math.asin(F / R)
  return [...arc(R, -a, a, 48), ...arc(R, Math.PI - a, Math.PI + a, 48)]
}

function toShape(pts: P2[]) {
  const s = new THREE.Shape()
  s.moveTo(...pts[0])
  pts.slice(1).forEach((p) => s.lineTo(...p))
  s.closePath()
  return s
}

function circlePath(cx: number, cy: number, r: number) {
  const p = new THREE.Path()
  p.absarc(cx, cy, r, 0, Math.PI * 2, true)
  return p
}

function slotPath(cx: number, cy: number, w: number, h: number) {
  const r = h / 2
  return toShape([...arc(r, -Math.PI / 2, Math.PI / 2, 8, cx + w / 2 - r, cy), ...arc(r, Math.PI / 2, (3 * Math.PI) / 2, 8, cx - w / 2 + r, cy)])
}

/** Extruye una forma a lo largo de x, desde x0 con el largo dado. */
function extrudeX(shape: THREE.Shape, x0: number, length: number, curveSegments = 12) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false, curveSegments })
  g.rotateY(Math.PI / 2) // (u, v, w) → (w, v, −u)
  g.translate(x0, 0, 0)
  return g
}

/** Paquete de chapas del rotor: 3 polos en T, cortado en láminas. */
function armatureGeometry() {
  const rh = 0.2
  const ri = 0.56
  const ro = 0.7
  const w = 0.1
  const hs = (50 * Math.PI) / 180
  const pts: P2[] = []
  const at = (c: number, t: number, side: number): P2 => [Math.cos(c) * t - Math.sin(c) * w * side, Math.sin(c) * t + Math.cos(c) * w * side]
  for (let k = 0; k < 3; k++) {
    const c = Math.PI / 2 + (k * 2 * Math.PI) / 3
    const next = c + (2 * Math.PI) / 3
    const dh = Math.asin(w / rh)
    const di = Math.asin(w / ri)
    pts.push(at(c, Math.sqrt(rh * rh - w * w), -1))
    pts.push(at(c, Math.sqrt(ri * ri - w * w), -1))
    pts.push(...arc(ri, c - di, c - hs, 8).slice(1))
    pts.push(...arc(ro, c - hs, c + hs, 24))
    pts.push(...arc(ri, c + hs, c + di, 8).slice(0, -1))
    pts.push(at(c, Math.sqrt(ri * ri - w * w), 1))
    pts.push(at(c, Math.sqrt(rh * rh - w * w), 1))
    pts.push(...arc(rh, c + dh, next - dh, 8).slice(1, -1))
  }
  const shape = toShape(pts)
  shape.holes.push(circlePath(0, 0, SHAFT_R))
  const n = 11
  const len = 1.0
  const t = len / n
  const slices = Array.from({ length: n }, (_, i) => extrudeX(shape, -len / 2 + i * t + 0.004, t - 0.008, 6))
  const merged = mergeAll(slices)
  return merged
}

function mergeAll(gs: THREE.BufferGeometry[]) {
  // fusión simple de geometrías no indexadas con los mismos atributos
  const parts = gs.map((g) => (g.index ? g.toNonIndexed() : g))
  const names = ['position', 'normal', 'uv']
  const out = new THREE.BufferGeometry()
  for (const name of names) {
    const arrays = parts.map((g) => g.getAttribute(name).array as Float32Array)
    const total = arrays.reduce((s, a) => s + a.length, 0)
    const data = new Float32Array(total)
    let off = 0
    for (const a of arrays) {
      data.set(a, off)
      off += a.length
    }
    out.setAttribute(name, new THREE.BufferAttribute(data, parts[0].getAttribute(name).itemSize))
  }
  gs.forEach((g) => g.dispose())
  return out
}

/** Bobina alrededor de un polo (apunta a +y, eje del motor = x). */
function coilGeometry() {
  const rr = (hw: number, hh: number, r: number) => {
    const p: P2[] = [
      ...arc(r, -Math.PI / 2, 0, 6, hw - r, -hh + r),
      ...arc(r, 0, Math.PI / 2, 6, hw - r, hh - r),
      ...arc(r, Math.PI / 2, Math.PI, 6, -hw + r, hh - r),
      ...arc(r, Math.PI, (3 * Math.PI) / 2, 6, -hw + r, -hh + r),
    ]
    return p
  }
  const s = toShape(rr(0.2, 0.63, 0.12))
  s.holes.push(toShape(rr(0.106, 0.506, 0.02)))
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.26, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2, curveSegments: 6 })
  g.translate(0, 0, 0.26)
  g.rotateX(-Math.PI / 2) // (u, v, w) → (u, w, −v)
  g.rotateY(Math.PI / 2) // → (−v, w, −u): axial = x, radial = y
  return g
}

function MagnetTag({ text, position }: { text: string; position: [number, number, number] }) {
  const { explode } = useParts()
  if (explode < 0.3) return null
  return (
    <Label position={position} center style={{ pointerEvents: 'none' }}>
      <div className="pin-tag">{text}</div>
    </Label>
  )
}

export function MotorModel({ rpm, dir, voltage }: { rpm: number; dir: 1 | -1; voltage: number }) {
  const rotor = useRef<THREE.Group>(null)
  const comm = useRef<THREE.Group>(null)
  const shaft = useRef<THREE.Group>(null)
  const ang = useRef(0)
  const speed = useRef(0)
  useFrame((_, dt) => {
    // cámara lenta: a 11 000 rpm se ve ≈ 1,6 vueltas por segundo
    const target = -dir * (rpm / 11000) * Math.PI * 2 * 1.6
    speed.current += (target - speed.current) * (1 - Math.exp(-dt * 3))
    ang.current += speed.current * Math.min(dt, 0.05)
    for (const g of [rotor.current, comm.current, shaft.current]) if (g) g.rotation.x = ang.current
  })

  const g = useMemo(() => {
    // carcasa: tubo de chapa + frente con buje, agujeros de fijación y ventilación
    const tube = toShape(stadium(CAN_R, CAN_F))
    tube.holes.push(toShape(stadium(CAN_R - 0.04, CAN_F - 0.04).reverse()))
    const canTube = extrudeX(tube, CAN_BACK, CAN_FRONT - 0.04 - CAN_BACK, 4)
    const front = toShape(stadium(CAN_R, CAN_F))
    front.holes.push(circlePath(0, 0, 0.3))
    for (const u of [-0.6, 0.6]) front.holes.push(circlePath(u, 0, 0.08))
    for (const v of [-0.47, 0.47]) front.holes.push(slotPath(0, v, 0.5, 0.13))
    const canFront = extrudeX(front, CAN_FRONT - 0.04, 0.04, 12)
    const boss = latheGeometry(
      [
        [0.16, 0.18],
        [0.25, 0.15],
        [0.3, 0.12],
        [0.3, 0],
      ],
      40,
    )
    boss.rotateZ(-Math.PI / 2)
    boss.translate(CAN_FRONT, 0, 0)
    // tapa trasera de plástico con ventilación y buje trasero
    const capShape = toShape(stadium(CAN_R - 0.01, CAN_F - 0.01))
    for (const v of [-0.47, 0.47]) capShape.holes.push(slotPath(0, v, 0.46, 0.12))
    const cap = extrudeX(capShape, CAP_BACK, CAN_BACK - CAP_BACK, 8)
    // terminal: lengüeta plana con agujero
    const tab = toShape([[-1.3, -0.1], ...arc(0.1, -Math.PI / 2, (-3 * Math.PI) / 2, 10, -1.66, 0), [-1.3, 0.1]])
    tab.holes.push(circlePath(-1.66, 0, 0.05))
    const term = new THREE.ExtrudeGeometry(tab, { depth: 0.03, bevelEnabled: false, curveSegments: 12 })
    term.rotateX(-Math.PI / 2)
    term.translate(0, -0.015, 0)
    // imanes: arcos de ferrita de 110°
    const mag = toShape([...arc(0.95, -0.78, 0.78, 24), ...arc(0.74, 0.78, -0.78, 24)])
    const magnet = extrudeX(mag, -0.65, 1.3, 6)
    // escobilla: lámina de bronce elástica que apoya de costado sobre el colector
    const brush = stripGeometry(
      filletPolyline(
        [
          [TERM_Z, -0.14],
          [TERM_Z, 0.36],
          [0.215, 0.14],
          [0.215, -0.34],
        ],
        [0.05, 0.08],
      ),
      0.022,
      0.12,
    )
    brush.rotateY(-Math.PI / 2) // perfil (z, y), ancho a lo largo de x
    return {
      canTube,
      canFront,
      boss,
      cap,
      term,
      magnet,
      brush,
      armature: armatureGeometry(),
      coil: coilGeometry(),
      pinion: (() => {
        const p = gearGeometry(10, 0.24, 0.3, SHAFT_R * 0.98, 0.78)
        p.rotateZ(-Math.PI / 2)
        return p
      })(),
    }
  }, [])

  const wireTex = useCanvasTexture(
    32,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#a4531f'
      ctx.fillRect(0, 0, w, h)
      for (let i = 0; i < 16; i++) {
        const y = (i / 16) * h
        const grd = ctx.createLinearGradient(0, y, 0, y + h / 16)
        grd.addColorStop(0, '#5e2a0c')
        grd.addColorStop(0.5, '#e08a4a')
        grd.addColorStop(1, '#5e2a0c')
        ctx.fillStyle = grd
        ctx.fillRect(0, y, w, h / 16)
      }
    },
    [],
  )
  useMemo(() => {
    wireTex.wrapS = wireTex.wrapT = THREE.RepeatWrapping
    wireTex.repeat.set(1, 2.4)
    wireTex.needsUpdate = true
  }, [wireTex])

  const poles = [0, 1, 2].map((k) => (k * 2 * Math.PI) / 3)
  const copper = { color: '#c97b3c', metalness: 0.9, roughness: 0.3 }
  const brass = { color: '#c9a25a', metalness: 0.9, roughness: 0.35 }
  const steel = { color: '#d4d7dc', metalness: 0.95, roughness: 0.22 }
  const capWhite = <meshStandardMaterial color="#efece3" roughness={0.55} />
  const plus = voltage > 0

  return (
    <group>
      {/* ---------------- carcasa de acero con buje delantero ---------------- */}
      <Part id="carcasa" offset={[2.2, 0, 0]} labelAt={[0.3, 1.3, 0]}>
        <mesh geometry={g.canTube} castShadow>
          <meshStandardMaterial {...metal} color="#c9ccd1" roughness={0.3} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={g.canFront} castShadow>
          <meshStandardMaterial {...metal} color="#c9ccd1" roughness={0.3} />
        </mesh>
        <mesh geometry={g.boss}>
          <meshStandardMaterial {...metal} color="#c9ccd1" roughness={0.3} side={THREE.DoubleSide} />
        </mesh>
        {/* buje de bronce sinterizado */}
        <mesh position={[CAN_FRONT + 0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.16, 0.16, 0.2, 24, 1, true]} />
          <meshStandardMaterial {...brass} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[CAN_FRONT + 0.2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <ringGeometry args={[SHAFT_R + 0.005, 0.16, 24]} />
          <meshStandardMaterial {...brass} />
        </mesh>
        {/* lengüetas engarzadas sobre la tapa trasera */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[CAN_BACK - 0.06, s * (CAN_F + 0.005), 0]}>
            <boxGeometry args={[0.14, 0.02, 0.3]} />
            <meshStandardMaterial {...metal} color="#c9ccd1" roughness={0.3} />
          </mesh>
        ))}
      </Part>

      {/* ---------------- imanes permanentes (pegados dentro de la carcasa) ---------------- */}
      <Part id="imanes" offset={[0, 0, -1.25]} labelAt={[0, 0.8, -1.0]}>
        <mesh geometry={g.magnet}>
          <meshStandardMaterial color="#6e4042" roughness={0.8} metalness={0.1} />
        </mesh>
        <MagnetTag text="N" position={[0.35, 0.0, -1.02]} />
      </Part>
      <Part id="imanes" offset={[0, 0, 1.25]} noLabel>
        <mesh geometry={g.magnet} rotation={[Math.PI, 0, 0]}>
          <meshStandardMaterial color="#3d4c68" roughness={0.8} metalness={0.1} />
        </mesh>
        <MagnetTag text="S" position={[0.35, 0.0, 1.02]} />
      </Part>

      {/* ---------------- rotor: paquete de chapas + bobinados ---------------- */}
      <Part id="rotor" offset={[-1.1, 0, 0]} labelAt={[0, 0.95, 0]}>
        <group ref={rotor}>
          <mesh geometry={g.armature} castShadow>
            <meshStandardMaterial color="#8a8e95" metalness={0.85} roughness={0.42} />
          </mesh>
          {poles.map((a) => (
            <group key={a} rotation={[a, 0, 0]}>
              <mesh geometry={g.coil}>
                <meshStandardMaterial map={wireTex} color="#ffffff" metalness={0.6} roughness={0.35} />
              </mesh>
              {/* alambre que baja de la bobina a la uña del colector */}
              <Wire
                points={[
                  [-0.62, 0.3, 0.12],
                  [-0.7, 0.26, 0.15],
                  [-0.74, 0.22, 0.12],
                ]}
                radius={0.014}
                color="#c06a2c"
                metalness={0.7}
                roughness={0.3}
              />
            </group>
          ))}
        </group>
      </Part>

      {/* ---------------- colector: 3 delgas de cobre ---------------- */}
      <Part id="colector" offset={[-1.1, 0, 0]} labelAt={[COMM_X - 0.1, -0.5, 0.3]}>
        <group ref={comm}>
          <mesh position={[COMM_X, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.17, 0.17, 0.23, 24]} />
            <meshStandardMaterial color="#3a2a1e" roughness={0.7} />
          </mesh>
          {poles.map((a) => (
            <group key={a} rotation={[a + Math.PI / 3, 0, 0]}>
              <mesh position={[COMM_X, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.2, 0.2, 0.2, 16, 1, false, -0.92, 1.84]} />
                <meshStandardMaterial {...copper} />
              </mesh>
              {/* uña donde se suelda el alambre */}
              <mesh position={[COMM_X + 0.12, 0.22, 0]}>
                <boxGeometry args={[0.06, 0.05, 0.08]} />
                <meshStandardMaterial {...copper} />
              </mesh>
            </group>
          ))}
          {/* arandela aislante */}
          <mesh position={[-0.68, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.27, 0.27, 0.03, 28]} />
            <meshStandardMaterial color="#5b4630" roughness={0.8} />
          </mesh>
        </group>
      </Part>

      {/* ---------------- eje de acero con piñón ---------------- */}
      <Part id="eje" offset={[-1.1, 0, 0]} labelAt={[1.75, 0.55, 0]}>
        <group ref={shaft}>
          <mesh position={[(-1.44 + SHAFT_TIP) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[SHAFT_R, SHAFT_R, SHAFT_TIP + 1.44, 16]} />
            <meshStandardMaterial {...steel} />
          </mesh>
          <mesh geometry={g.pinion} position={[1.6, 0, 0]} castShadow>
            <meshStandardMaterial color="#f4f2ea" roughness={0.45} />
          </mesh>
          {/* cinta de color para ver el giro */}
          <mesh position={[1.75, 0.38, 0]}>
            <boxGeometry args={[0.2, 0.3, 0.012]} />
            <meshStandardMaterial color="#e53935" roughness={0.6} />
          </mesh>
        </group>
      </Part>

      {/* ---------------- escobillas ---------------- */}
      <Part id="escobillas" offset={[-1.95, 0, 0]} labelAt={[COMM_X, 0.7, -0.4]}>
        {[0, Math.PI].map((r) => (
          <group key={r} rotation={[r, 0, 0]}>
            <mesh geometry={g.brush} position={[COMM_X, 0, 0]}>
              <meshStandardMaterial color="#d79352" metalness={0.85} roughness={0.3} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[-0.93, -0.12, TERM_Z]}>
              <boxGeometry args={[0.16, 0.1, 0.05]} />
              <meshStandardMaterial color="#d79352" metalness={0.85} roughness={0.3} />
            </mesh>
          </group>
        ))}
      </Part>

      {/* ---------------- tapa trasera con terminales ---------------- */}
      <Part id="tapa" offset={[-2.7, 0, 0]} labelAt={[CAP_BACK, 1.0, 0]}>
        <mesh geometry={g.cap} castShadow>{capWhite}</mesh>
        <mesh position={[CAP_BACK - 0.04, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.24, 0.08, 28]} />
          {capWhite}
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[CAP_BACK - 0.05, 0, s * TERM_Z]}>
              <boxGeometry args={[0.1, 0.12, 0.3]} />
              {capWhite}
            </mesh>
            <mesh geometry={g.term} position={[0, 0, s * TERM_Z]} castShadow>
              <meshStandardMaterial {...tinned} side={THREE.DoubleSide} />
            </mesh>
            {/* parte del terminal que atraviesa la tapa hacia la escobilla */}
            <mesh position={[(CAN_BACK + CAP_BACK) / 2, -0.12, s * TERM_Z]}>
              <boxGeometry args={[CAN_BACK - CAP_BACK, 0.08, 0.04]} />
              <meshStandardMaterial {...tinned} />
            </mesh>
          </group>
        ))}
        {/* punto rojo: terminal positivo */}
        <mesh position={[CAP_BACK - 0.002, 0.3, TERM_Z]} rotation={[0, -Math.PI / 2, 0]}>
          <circleGeometry args={[0.07, 20]} />
          <meshStandardMaterial color="#e3241b" roughness={0.5} emissive="#e3241b" emissiveIntensity={plus ? 0.15 : 0} />
        </mesh>
      </Part>
    </group>
  )
}
