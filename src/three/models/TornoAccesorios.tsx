import { useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js'
import { Part, type Vec3 } from '../Part'
import { gearGeometry, useCanvasTexture } from '../helpers'

/* ------------------------------------------------------------------ */
/* Accesorios y herramientas del torno paralelo.                       */
/* 1 unidad = 10 mm. Las piezas de revolución tienen su eje en +x      */
/* (como el eje del torno: el plato "mira" hacia +x, la contrapunta).  */
/* Ángulos alrededor del eje: a = 0 arriba (+y), a = 90° adelante (+z). */
/* ------------------------------------------------------------------ */

type P2 = [number, number]
const D = Math.PI / 180

/* ================================================================== materiales */

const std = (color: string, metalness: number, roughness: number, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra })

export const M = {
  steel: std('#c6cacf', 0.92, 0.26),
  satin: std('#a7abb1', 0.88, 0.4),
  chuck: std('#b9bdc2', 0.9, 0.33),
  burnished: std('#3d4046', 0.8, 0.42),
  black: std('#1d1e21', 0.35, 0.5),
  hole: std('#0c0d0f', 0.3, 0.9),
  bronze: std('#b5874c', 0.9, 0.33),
  carbide: std('#3b3d43', 0.65, 0.32),
  shim: std('#55585e', 0.7, 0.45),
  tin: std('#cfa73f', 0.95, 0.28),
  hss: std('#d9dbde', 0.95, 0.2),
  work: std('#aeb3b9', 0.85, 0.38),
  turned: std('#dfe3e7', 0.97, 0.14),
  paint: std('#6b9580', 0.15, 0.5),
  paintDark: std('#4f7462', 0.15, 0.55),
  blue: std('#2d5d8e', 0.2, 0.5),
  red: std('#c62a20', 0.15, 0.4),
  yellow: std('#e6b521', 0.15, 0.45),
  rubber: std('#26282b', 0.05, 0.85),
  cast: std('#6e7277', 0.5, 0.6),
}

/* ================================================================== utilidades geométricas */

/**
 * Sólido de revolución con eje en +x a partir de un perfil [radio, x].
 * El perfil se recorre en sentido antihorario (cara de atrás hacia afuera, borde exterior hacia +x,
 * cara de adelante hacia adentro y agujero hacia −x) para que las normales queden hacia afuera.
 * Cada tramo es una "rebanada" aparte: las aristas quedan vivas, como una pieza torneada.
 */
export function revolve(profile: P2[], segs = 48, phiStart = 0, phiLength = Math.PI * 2) {
  const gs: THREE.BufferGeometry[] = []
  for (let i = 1; i < profile.length; i++) {
    const [r0, x0] = profile[i - 1]
    const [r1, x1] = profile[i]
    if (Math.abs(r0 - r1) < 1e-6 && Math.abs(x0 - x1) < 1e-6) continue
    if (r0 < 1e-4 && r1 < 1e-4) continue
    gs.push(new THREE.LatheGeometry([new THREE.Vector2(Math.max(r0, 1e-4), x0), new THREE.Vector2(Math.max(r1, 1e-4), x1)], segs, phiStart, phiLength))
  }
  const g = mergeGeometries(gs)!
  gs.forEach((x) => x.dispose())
  g.rotateZ(-Math.PI / 2)
  return g
}

export function useRevolve(profile: P2[], segs = 48, deps: unknown[] = []) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => revolve(profile, segs), deps)
}

export interface BoxSpec {
  p: Vec3
  s: Vec3
  /** giro alrededor de x (se aplica después de trasladar) */
  rx?: number
  /** giro alrededor de y (se aplica antes de trasladar) */
  ry?: number
  /** giro alrededor de z (se aplica antes de trasladar) */
  rz?: number
}

/** Varias cajas unidas en una sola geometría (una sola llamada de dibujo). */
export function boxesGeometry(list: BoxSpec[]) {
  const gs = list.map(({ p, s, rx = 0, ry = 0, rz = 0 }) => {
    const g = new THREE.BoxGeometry(...s)
    if (rz) g.rotateZ(rz)
    if (ry) g.rotateY(ry)
    g.translate(...p)
    if (rx) g.rotateX(rx)
    return g
  })
  const m = mergeGeometries(gs)!
  gs.forEach((g) => g.dispose())
  return m
}

export function useBoxes(list: BoxSpec[], deps: unknown[] = []) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => boxesGeometry(list), deps)
}

/** Forma 2D (u, v) extruida a lo largo de +x desde x0: el punto (u, v) del dibujo queda en (z = −u, y = v). */
export function extrudeX(shape: THREE.Shape | THREE.Shape[], depth: number, x0 = 0, curveSegments = 24) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments })
  g.rotateY(Math.PI / 2)
  g.translate(x0, 0, 0)
  return g
}

/** Pasa una geometría a no indexada (sin advertencias si ya lo es) y deja sólo posición y normal. */
export function ni(g: THREE.BufferGeometry) {
  const out = g.index ? g.toNonIndexed() : g
  if (out.getAttribute('uv')) out.deleteAttribute('uv')
  return out
}

/** Forma 2D (u, v) extruida hacia +y: el dibujo queda acostado en el plano xz con (u, v) → (x, −z). */
export function extrudeY(shape: THREE.Shape | THREE.Shape[], depth: number, y0 = 0, curveSegments = 12) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments })
  g.rotateX(-Math.PI / 2)
  g.translate(0, y0, 0)
  return g
}

export function polyShape(pts: P2[], holes: P2[][] = []) {
  const s = new THREE.Shape()
  s.moveTo(...pts[0])
  pts.slice(1).forEach((p) => s.lineTo(...p))
  s.closePath()
  holes.forEach((h) => {
    const p = new THREE.Path()
    p.moveTo(...h[0])
    h.slice(1).forEach((q) => p.lineTo(...q))
    p.closePath()
    s.holes.push(p)
  })
  return s
}

export function arcPts(r: number, a0: number, a1: number, n = 24, cx = 0, cy = 0): P2[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as P2
  })
}

/** Polígono con las esquinas redondeadas (radio r). */
export function roundedPoly(pts: P2[], r: number, n = 4): P2[] {
  const out: P2[] = []
  const L = pts.length
  for (let i = 0; i < L; i++) {
    const p = pts[i]
    const a = pts[(i - 1 + L) % L]
    const b = pts[(i + 1) % L]
    const da = Math.hypot(a[0] - p[0], a[1] - p[1])
    const db = Math.hypot(b[0] - p[0], b[1] - p[1])
    const ra = Math.min(r, da / 2)
    const rb = Math.min(r, db / 2)
    const p0: P2 = [p[0] + ((a[0] - p[0]) * ra) / da, p[1] + ((a[1] - p[1]) * ra) / da]
    const p1: P2 = [p[0] + ((b[0] - p[0]) * rb) / db, p[1] + ((b[1] - p[1]) * rb) / db]
    for (let k = 0; k <= n; k++) {
      const t = k / n
      // curva cuadrática p0 → p → p1
      const x = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p[0] + t * t * p1[0]
      const y = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p[1] + t * t * p1[1]
      out.push([x, y])
    }
  }
  return out
}

/** Círculo como polígono (para agujeros). */
export function circlePts(r: number, n = 24, cx = 0, cy = 0, reverse = true): P2[] {
  const pts = arcPts(r, 0, Math.PI * 2, n, cx, cy).slice(0, n)
  return reverse ? pts.reverse() : pts
}

/** Engranaje con el eje en +x (gearGeometry acostado y girado). */
export function gearX(teeth: number, r: number, depth: number, hole = 0, inner = 0.86, x0 = 0) {
  const g = gearGeometry(teeth, r, depth, hole, inner)
  g.rotateZ(-Math.PI / 2)
  g.translate(x0, 0, 0)
  g.computeVertexNormals()
  return g
}

/* ================================================================== componentes genéricos */

/** Caja simple. */
export function B({ p, s, m, r }: { p: Vec3; s: Vec3; m: THREE.Material; r?: Vec3 }) {
  return (
    <mesh position={p} rotation={r} material={m}>
      <boxGeometry args={s} />
    </mesh>
  )
}

/** Cilindro con el eje en x. */
export function CylX({ x0, x1, r, r2, m, seg = 32, y = 0, z = 0 }: { x0: number; x1: number; r: number; r2?: number; m: THREE.Material; seg?: number; y?: number; z?: number }) {
  return (
    <mesh position={[(x0 + x1) / 2, y, z]} rotation={[0, 0, -Math.PI / 2]} material={m}>
      <cylinderGeometry args={[r2 ?? r, r, Math.abs(x1 - x0), seg]} />
    </mesh>
  )
}

/** Volante de mano (mira hacia +z): llanta, rayos, cubo y manija giratoria. */
export function Handwheel({ r, spokes = 3, handle = true, mat = M.steel, grip = M.black }: { r: number; spokes?: number; handle?: boolean; mat?: THREE.Material; grip?: THREE.Material }) {
  const t = r * 0.085
  return (
    <group>
      <mesh material={mat}>
        <torusGeometry args={[r, t, 12, 48]} />
      </mesh>
      <mesh material={mat} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -r * 0.05]}>
        <cylinderGeometry args={[r * 0.17, r * 0.21, r * 0.42, 24]} />
      </mesh>
      {Array.from({ length: spokes }, (_, i) => {
        const a = (i / spokes) * Math.PI * 2 + Math.PI / 2
        return (
          <mesh key={i} material={mat} position={[Math.cos(a) * r * 0.58, Math.sin(a) * r * 0.58, -r * 0.03]} rotation={[0, 0, a - Math.PI / 2]}>
            <boxGeometry args={[r * 0.13, r * 0.84, r * 0.07]} />
          </mesh>
        )
      })}
      {handle && (
        <group position={[r * Math.cos(-Math.PI / 6), r * Math.sin(-Math.PI / 6), 0]}>
          <mesh material={mat} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, r * 0.12]}>
            <cylinderGeometry args={[r * 0.05, r * 0.05, r * 0.24, 10]} />
          </mesh>
          <mesh material={grip} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, r * 0.52]}>
            <cylinderGeometry args={[r * 0.075, r * 0.085, r * 0.6, 14]} />
          </mesh>
        </group>
      )}
    </group>
  )
}

/** Palanca con bocha (a lo largo de +y). */
export function Lever({ len, r = 0.35, knob = 0.95, mat = M.steel, knobMat = M.black }: { len: number; r?: number; knob?: number; mat?: THREE.Material; knobMat?: THREE.Material }) {
  return (
    <group>
      <mesh material={mat} position={[0, len / 2, 0]}>
        <cylinderGeometry args={[r * 0.7, r, len, 12]} />
      </mesh>
      <mesh material={knobMat} position={[0, len + knob * 0.75, 0]}>
        <sphereGeometry args={[knob, 20, 14]} />
      </mesh>
    </group>
  )
}

/** Grupo que se acerca suavemente a la posición/rotación pedida (los carros "se deslizan"). */
export function Smooth({ p = [0, 0, 0], r = [0, 0, 0], rate = 6, children }: { p?: Vec3; r?: Vec3; rate?: number; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  const ready = useRef(false)
  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    const k = ready.current ? 1 - Math.exp(-dt * rate) : 1
    ready.current = true
    g.position.x += (p[0] - g.position.x) * k
    g.position.y += (p[1] - g.position.y) * k
    g.position.z += (p[2] - g.position.z) * k
    g.rotation.x += (r[0] - g.rotation.x) * k
    g.rotation.y += (r[1] - g.rotation.y) * k
    g.rotation.z += (r[2] - g.rotation.z) * k
  })
  return <group ref={ref}>{children}</group>
}

/** Grupo que gira alrededor de x a "speed" rad/s (con arranque y frenado suaves). */
export function Spin({ speed, children }: { speed: number; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  const w = useRef(0)
  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    w.current += (speed - w.current) * (1 - Math.exp(-dt * 2.5))
    g.rotation.x += w.current * Math.min(dt, 0.05)
  })
  return <group ref={ref}>{children}</group>
}

/** Cartel con texto dibujado en canvas (siempre mirando a la cámara). */
export function TextSprite({ text, position, size = 1, color = '#ffffff', bg = 'rgba(16,21,31,0.78)' }: { text: string; position: Vec3; size?: number; color?: string; bg?: string }) {
  const tex = useCanvasTexture(
    256,
    96,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = bg
      const rr = 22
      ctx.beginPath()
      ctx.moveTo(rr, 4)
      ctx.arcTo(w - 4, 4, w - 4, h - 4, rr)
      ctx.arcTo(w - 4, h - 4, 4, h - 4, rr)
      ctx.arcTo(4, h - 4, 4, 4, rr)
      ctx.arcTo(4, 4, w - 4, 4, rr)
      ctx.fill()
      ctx.fillStyle = color
      ctx.font = 'bold 50px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, w / 2, h / 2 + 2)
    },
    [text, color, bg],
  )
  return (
    <sprite position={position} scale={[size * 2.67, size, 1]} renderOrder={10}>
      <spriteMaterial map={tex} transparent depthTest={false} />
    </sprite>
  )
}

/* ================================================================== bancada (sección) */

/** Tramo de bancada de torno (bancada arriba en y = 0, eje del torno en y = 18, z = 0). */
export const BED = {
  flangeY: -3.5,
  bottom: -28,
  half: 17,
  gap: 6, // ranura central entre las alas superiores
  vOut: 14, // guía prismática del carro (adelante)
  fOut: -14, // guía plana del carro (atrás)
  vIn: 8.5, // guía prismática de la contrapunta
  fIn: -8.5, // guía plana de la contrapunta
  vH: 1.7,
  fH: 1.0,
  center: 18,
}

export function bedGeometries(x0: number, x1: number, ribStep = 20) {
  const L = x1 - x0
  const cx = (x0 + x1) / 2
  const H = BED
  const cast: BoxSpec[] = [
    // alas superiores
    { p: [cx, H.flangeY / 2, (H.half + H.gap) / 2], s: [L, -H.flangeY, H.half - H.gap] },
    { p: [cx, H.flangeY / 2, -(H.half + H.gap) / 2], s: [L, -H.flangeY, H.half - H.gap] },
    // paredes
    { p: [cx, (H.flangeY + H.bottom) / 2, H.half - 1.3], s: [L, H.flangeY - H.bottom, 2.6] },
    { p: [cx, (H.flangeY + H.bottom) / 2, -H.half + 1.3], s: [L, H.flangeY - H.bottom, 2.6] },
    // pestañas inferiores
    { p: [cx, H.bottom + 1, H.half - 3], s: [L, 2, 6] },
    { p: [cx, H.bottom + 1, -H.half + 3], s: [L, 2, 6] },
  ]
  for (let x = x0 + 3; x <= x1 - 2; x += ribStep) {
    // nervaduras transversales (en "V" vistas desde arriba: se simplifican rectas)
    cast.push({ p: [x, (H.flangeY + H.bottom) / 2 - 0.5, 0], s: [2, H.flangeY - H.bottom - 1, H.half * 2 - 4] })
  }
  const castGeo = boxesGeometry(cast)
  // guías templadas y rectificadas
  const tri = polyShape([
    [-1.7, 0],
    [1.7, 0],
    [0, H.vH],
  ])
  const vGeo = (z: number) => {
    const g = extrudeX(tri, L, x0, 1)
    g.translate(0, 0, z)
    return g
  }
  const flat = (z: number) => {
    const g = new THREE.BoxGeometry(L, H.fH, 3.4)
    g.translate(cx, H.fH / 2, z)
    return g
  }
  const ways = mergeGeometries([ni(vGeo(H.vOut)), ni(vGeo(H.vIn)), ni(flat(H.fOut)), ni(flat(H.fIn))])!
  return { castGeo, ways }
}

export function BedSection({ x0, x1, ribStep = 20, paint = M.paint }: { x0: number; x1: number; ribStep?: number; paint?: THREE.Material }) {
  const { castGeo, ways } = useMemo(() => bedGeometries(x0, x1, ribStep), [x0, x1, ribStep])
  return (
    <group>
      <mesh geometry={castGeo} material={paint} />
      <mesh geometry={ways} material={M.satin} />
    </group>
  )
}

/* ================================================================== barra (pieza) */

/** Barra redonda de acero con chaflán y, opcionalmente, agujero de centro en cada punta. */
export function Bar({ x0, x1, r, centerL = false, centerR = false, m = M.work }: { x0: number; x1: number; r: number; centerL?: boolean; centerR?: boolean; m?: THREE.Material }) {
  const geo = useMemo(() => {
    const c = Math.min(0.25, r * 0.12)
    const ch = Math.min(0.55, r * 0.3) // agujero de centro (60°)
    const prof: P2[] = []
    if (centerL) prof.push([0, x0 + ch * 1.73], [ch, x0])
    else prof.push([0, x0])
    prof.push([r - c, x0], [r, x0 + c], [r, x1 - c], [r - c, x1])
    if (centerR) prof.push([ch, x1], [0, x1 - ch * 1.73])
    else prof.push([0, x1])
    return revolve(prof, 40)
  }, [x0, x1, r, centerL, centerR])
  return <mesh geometry={geo} material={m} />
}

/* ================================================================== plato universal de 3 mordazas (Ø 160) */

export const C3 = { R: 8, L: 6.6, bore: 2.1 }
export const JAW3 = [0, 120, 240].map((d) => d * D)
export const PIN3 = [60, 180, 300].map((d) => d * D)

export function Chuck3Body() {
  const geo = useRevolve(
    [
      [C3.bore, 0],
      [7.6, 0],
      [C3.R, 0.4],
      [C3.R, 6.2],
      [7.6, C3.L],
      [2.8, C3.L],
      [C3.bore, 5.9],
      [C3.bore, 0],
    ],
    72,
  )
  const dark = useBoxes([
    ...JAW3.flatMap((a) => [
      { p: [C3.L + 0.012, 5.25, 0] as Vec3, s: [0.03, 5.5, 2.06] as Vec3, rx: a },
      { p: [(3.9 + C3.L) / 2, C3.R - 0.005, 0] as Vec3, s: [C3.L - 3.9, 0.03, 2.06] as Vec3, rx: a },
    ]),
    ...PIN3.map((a) => ({ p: [0.95, C3.R - 0.005, 0] as Vec3, s: [0.85, 0.03, 0.85] as Vec3, rx: a })),
  ])
  return (
    <group>
      <mesh geometry={geo} material={M.chuck} />
      <mesh geometry={dark} material={M.hole} />
      {/* tornillos de unión del cuerpo con el plato trasero (cabeza Allen, embutidos) */}
      {PIN3.map((a) => (
        <group key={a} rotation={[a, 0, 0]}>
          <mesh position={[C3.L + 0.01, 4.6, 0]} rotation={[0, 0, -Math.PI / 2]} material={M.burnished}>
            <cylinderGeometry args={[0.55, 0.55, 0.04, 20]} />
          </mesh>
          <mesh position={[C3.L + 0.02, 4.6, 0]} rotation={[0, 0, -Math.PI / 2]} material={M.hole}>
            <cylinderGeometry args={[0.25, 0.25, 0.04, 6]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Espiral (corona con rosca plana en la cara de adelante y dientes cónicos atrás). */
export function Chuck3Scroll() {
  const { disc, spiral, teeth } = useMemo(() => {
    const disc = revolve(
      [
        [2.3, 2.2],
        [7.4, 2.2],
        [7.4, 3.4],
        [2.3, 3.4],
        [2.3, 2.2],
      ],
      64,
    )
    const turns = 5
    const n = turns * 56
    const outer: P2[] = []
    const inner: P2[] = []
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * turns * Math.PI * 2
      const r = 2.9 + (0.8 * t) / (Math.PI * 2)
      outer.push([Math.cos(t) * (r + 0.2), Math.sin(t) * (r + 0.2)])
      inner.push([Math.cos(t) * (r - 0.2), Math.sin(t) * (r - 0.2)])
    }
    const spiral = extrudeX(polyShape([...outer, ...inner.reverse()]), 0.45, 3.4, 1)
    const teeth = gearX(56, 7.2, 0.6, 5.0, 0.88, 1.6)
    return { disc, spiral, teeth }
  }, [])
  return (
    <group>
      <mesh geometry={disc} material={M.satin} />
      <mesh geometry={spiral} material={M.steel} />
      <mesh geometry={teeth} material={M.satin} />
    </group>
  )
}

/** Un piñón cónico con su cabeza cuadrada para la llave (eje radial = +y local). */
export function Chuck3Pinion() {
  const gear = useMemo(() => {
    const g = gearGeometry(11, 0.95, 0.7, 0, 0.8)
    g.translate(0.95, 5.95, 0)
    g.computeVertexNormals()
    return g
  }, [])
  return (
    <group>
      <mesh geometry={gear} material={M.steel} />
      <mesh position={[0.95, 7.3, 0]} material={M.satin}>
        <cylinderGeometry args={[0.47, 0.47, 1.3, 16]} />
      </mesh>
      <mesh position={[0.95, 7.95, 0]} material={M.hole}>
        <boxGeometry args={[0.5, 0.06, 0.5]} />
      </mesh>
    </group>
  )
}

/** Geometría de una mordaza escalonada (eje radial = +y local, empieza en y = 0). */
function jawGeometry(inverted: boolean, h: number, steps: [number, number, number], guideX0: number, faceX: number, width: number) {
  const [s1, s2, s3] = steps // alturas radiales de cada escalón
  const tot = s1 + s2 + s3
  const list: BoxSpec[] = [{ p: [(guideX0 + faceX) / 2, tot / 2, 0], s: [faceX - guideX0, tot, width] }]
  const ext = [h, h * 0.66, h * 0.33]
  const ys = inverted ? [tot - s1 / 2, s3 + s2 / 2, s3 / 2] : [s1 / 2, s1 + s2 / 2, s1 + s2 + s3 / 2]
  const hs = [s1, s2, s3]
  for (let i = 0; i < 3; i++) list.push({ p: [faceX + ext[i] / 2, ys[i], 0], s: [ext[i], hs[i], width] })
  // dientes que engranan con la espiral (o con el tornillo)
  for (let k = 0; k < 5; k++) list.push({ p: [guideX0 - 0.2, 0.5 + k * 0.8 * (tot / 5.2), 0], s: [0.4, 0.38, width * 0.92] })
  return boxesGeometry(list)
}

/** Las tres mordazas del plato universal. clampR = radio de la pieza que aprietan. */
export function Chuck3Jaw({ clampR, inverted = false, angle }: { clampR: number; inverted?: boolean; angle: number }) {
  const geo = useMemo(() => jawGeometry(inverted, 3.2, [1.6, 1.7, 1.9], 3.9, C3.L, 2.0), [inverted])
  // la mordaza normal toma la pieza con su punta; la invertida, con el escalón alto (a 3,3 de su base)
  const rIn = inverted ? clampR - 3.3 : clampR
  return (
    <group rotation={[angle, 0, 0]}>
      <Smooth p={[0, rIn, 0]}>
        <mesh geometry={geo} material={M.chuck} />
      </Smooth>
    </group>
  )
}

export function Chuck3BackPlate() {
  const geo = useRevolve(
    [
      [2.6, -2.2],
      [4.8, -2.2],
      [4.8, -1.0],
      [7.6, -1.0],
      [7.6, 0],
      [2.6, 0],
      [2.6, -2.2],
    ],
    64,
  )
  return (
    <group>
      <mesh geometry={geo} material={M.burnished} />
      {PIN3.map((a) => (
        <group key={a} rotation={[a + Math.PI / 3, 0, 0]}>
          <mesh position={[-1.25, 6.2, 0]} rotation={[0, 0, -Math.PI / 2]} material={M.steel}>
            <cylinderGeometry args={[0.6, 0.6, 0.5, 6]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Llave del plato: punta cuadrada, cuerpo y manija en T (eje radial = +y local). */
export function ChuckKey({ base = 7.3 }: { base?: number }) {
  return (
    <group>
      <mesh position={[0, base + 0.5, 0]} material={M.burnished}>
        <boxGeometry args={[0.48, 1.0, 0.48]} />
      </mesh>
      <mesh position={[0, base + 1.25, 0]} material={M.burnished}>
        <cylinderGeometry args={[0.65, 0.65, 0.5, 20]} />
      </mesh>
      <mesh position={[0, base + 3.6, 0]} material={M.burnished}>
        <cylinderGeometry args={[0.42, 0.48, 4.3, 16]} />
      </mesh>
      <mesh position={[0, base + 6.0, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.burnished}>
        <cylinderGeometry args={[0.45, 0.45, 9, 16]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, base + 6.0, s * 4.6]} material={M.burnished}>
          <sphereGeometry args={[0.5, 14, 10]} />
        </mesh>
      ))}
    </group>
  )
}

/** Plato universal armado (para usarlo dentro del torno). */
export function Chuck3({ clampR, inverted = false }: { clampR: number; inverted?: boolean }) {
  return (
    <group>
      <Chuck3BackPlate />
      <Chuck3Body />
      {JAW3.map((a) => (
        <Chuck3Jaw key={a} angle={a} clampR={clampR} inverted={inverted} />
      ))}
    </group>
  )
}

/* ================================================================== plato de 4 mordazas independientes (Ø 200) */

export const C4 = { R: 10, L: 7.5, bore: 2.6 }
export const JAW4 = [0, 90, 180, 270].map((d) => d * D)

export function Chuck4Body() {
  const geo = useRevolve(
    [
      [C4.bore, 0],
      [9.6, 0],
      [C4.R, 0.4],
      [C4.R, 7.1],
      [9.6, C4.L],
      [C4.bore + 0.6, C4.L],
      [C4.bore, 6.9],
      [C4.bore, 0],
    ],
    72,
  )
  const dark = useBoxes(
    JAW4.flatMap((a) => [
      { p: [C4.L + 0.012, 6.3, 0] as Vec3, s: [0.03, 7.4, 2.56] as Vec3, rx: a },
      { p: [(4.2 + C4.L) / 2, C4.R - 0.005, 0] as Vec3, s: [C4.L - 4.2, 0.03, 2.56] as Vec3, rx: a },
    ]),
  )
  const rings = useCanvasTexture(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#b9bdc2'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#7d8187'
      ctx.lineWidth = 2
      for (let r = 70; r < 250; r += 30) {
        ctx.beginPath()
        ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2)
        ctx.stroke()
      }
    },
    [],
  )
  return (
    <group>
      <mesh geometry={geo} material={M.chuck} />
      <mesh geometry={dark} material={M.hole} />
      <mesh position={[C4.L + 0.006, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <ringGeometry args={[C4.bore + 0.6, 9.6, 64]} />
        <meshStandardMaterial map={rings} metalness={0.85} roughness={0.35} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
    </group>
  )
}

export function Chuck4Jaw({ rIn, inverted = false }: { rIn: number; inverted?: boolean }) {
  const geo = useMemo(() => jawGeometry(inverted, 3.4, [1.8, 1.9, 1.9], 4.2, C4.L, 2.5), [inverted])
  return (
    <Smooth p={[0, inverted ? rIn - 3.7 : rIn, 0]}>
      <mesh geometry={geo} material={M.chuck} />
    </Smooth>
  )
}

/** Tornillo de ajuste de una mordaza del plato de 4 (radial, cabeza cuadrada a ras de la periferia). */
export function Chuck4Screw() {
  return (
    <group>
      <mesh position={[5.85, 6.0, 0]} material={M.burnished}>
        <cylinderGeometry args={[0.55, 0.55, 7.9, 16]} />
      </mesh>
      <mesh position={[5.85, 9.97, 0]} material={M.hole}>
        <boxGeometry args={[0.55, 0.06, 0.55]} />
      </mesh>
    </group>
  )
}

/* ================================================================== plato liso, perno y brida */

export function PlatoLiso() {
  const geo = useRevolve(
    [
      [2.6, -2.6],
      [5.2, -2.6],
      [5.2, 0],
      [9.7, 0],
      [10, 0.3],
      [10, 2.1],
      [9.7, 2.4],
      [2.6, 2.4],
      [2.6, -2.6],
    ],
    72,
  )
  const slots = useBoxes([0, Math.PI].map((a) => ({ p: [2.412, 6.6, 0] as Vec3, s: [0.03, 4.6, 1.6] as Vec3, rx: a })))
  return (
    <group>
      <mesh geometry={geo} material={M.burnished} />
      <mesh geometry={slots} material={M.hole} />
    </group>
  )
}

/** Perno de arrastre (abulonado en la ranura del plato liso), abajo (a = 180°). */
export function PernoArrastre() {
  return (
    <group rotation={[Math.PI, 0, 0]}>
      <CylX x0={2.4} x1={6.6} r={0.75} m={M.steel} y={6.8} seg={20} />
      <mesh position={[6.6, 6.8, 0]} material={M.steel}>
        <sphereGeometry args={[0.75, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <CylX x0={2.4} x1={2.9} r={1.25} m={M.satin} y={6.8} seg={6} />
      <CylX x0={-1.4} x1={0} r={1.2} m={M.satin} y={6.8} seg={6} />
      <CylX x0={-2.0} x1={2.4} r={0.55} m={M.steel} y={6.8} seg={12} />
    </group>
  )
}

/** Brida (perro) de arrastre de cola curva, centrada en el origen, sobre una pieza de radio barR. */
export function Brida({ barR = 2 }: { barR?: number }) {
  const ring = useRevolve(
    [
      [barR + 0.3, -0.9],
      [3.5, -0.9],
      [3.5, 0.9],
      [barR + 0.3, 0.9],
      [barR + 0.3, -0.9],
    ],
    40,
    [barR],
  )
  const lugs = useBoxes([
    { p: [0, 3.9, 0], s: [1.8, 2.0, 2.6] },
    { p: [0, -3.7, 0], s: [1.8, 1.4, 1.7] },
  ])
  const tail = useMemo(() => {
    const c = new THREE.CatmullRomCurve3(
      [
        [0, -4.2, 0],
        [0, -6.0, 0],
        [-0.25, -6.75, 0],
        [-1.0, -7.0, 0],
        [-4.2, -7.0, 0],
      ].map((p) => new THREE.Vector3(...(p as Vec3))),
      false,
      'catmullrom',
      0.2,
    )
    return new THREE.TubeGeometry(c, 40, 0.55, 12, false)
  }, [])
  return (
    <group>
      <mesh geometry={ring} material={M.burnished} />
      <mesh geometry={lugs} material={M.burnished} />
      <mesh geometry={tail} material={M.burnished} />
      {/* tornillo de apriete sobre la pieza */}
      <mesh position={[0, (barR + 6.2) / 2, 0]} material={M.steel}>
        <cylinderGeometry args={[0.45, 0.45, 6.2 - barR, 14]} />
      </mesh>
      <mesh position={[0, 6.7, 0]} material={M.steel}>
        <boxGeometry args={[1.1, 1.0, 1.1]} />
      </mesh>
    </group>
  )
}

/* ================================================================== pinza (boquilla) de apriete */

export function Portapinzas() {
  const geo = useRevolve(
    [
      [2.5, -6],
      [3.6, -6],
      [3.6, -4.5],
      [4.6, -4.5],
      [4.6, -2.6],
      [3.2, -2.6],
      [3.2, 0.6],
      [2.4, 0.6],
      [1.7, -1.4],
      [1.7, -4.2],
      [2.5, -6],
    ],
    56,
  )
  return <mesh geometry={geo} material={M.burnished} />
}

/** Pinza tipo ER: doble cono con ranuras alternadas. */
export function Pinza({ boreR = 1.0 }: { boreR?: number }) {
  const geo = useMemo(() => {
    const n = 8
    const gap = 0.09
    const segs: THREE.BufferGeometry[] = []
    const prof: P2[] = [
      [boreR, -4.0],
      [1.55, -4.0],
      [2.25, -1.2],
      [2.25, -0.9],
      [1.95, 0.3],
      [boreR + 0.2, 0.3],
      [boreR, 0.1],
      [boreR, -4.0],
    ]
    for (let i = 0; i < n; i++) {
      const w = (Math.PI * 2) / n
      segs.push(revolve(prof, 6, i * w + gap / 2, w - gap))
    }
    const g = mergeGeometries(segs)!
    segs.forEach((s) => s.dispose())
    return g
  }, [boreR])
  return <mesh geometry={geo} material={M.steel} />
}

export function TuercaPinza() {
  const geo = useRevolve(
    [
      [3.25, -1.0],
      [3.9, -1.0],
      [4.1, -0.8],
      [4.1, 1.9],
      [3.9, 2.1],
      [2.0, 2.1],
      [2.0, 1.25],
      [2.3, 0.6],
      [3.25, 0.6],
      [3.25, -1.0],
    ],
    56,
  )
  const notches = useBoxes([0, 1, 2, 3, 4, 5].map((k) => ({ p: [0.55, 4.08, 0] as Vec3, s: [1.4, 0.05, 0.7] as Vec3, rx: (k * Math.PI) / 3 })))
  return (
    <group>
      <mesh geometry={geo} material={M.steel} />
      <mesh geometry={notches} material={M.hole} />
    </group>
  )
}

/* ================================================================== puntos */

/** Cono Morse (cola) desde x0 hacia atrás (−x), largo L. */
function morseProfile(x0: number, L: number, rBig: number, rSmall: number): P2[] {
  return [
    [0, x0 - L],
    [rSmall, x0 - L],
    [rBig, x0],
  ]
}

/** Punto fijo: cola cono Morse y collar. */
export function PuntoFijoCola() {
  const geo = useRevolve([...morseProfile(-2.9, 8, 1.2, 0.98), [1.38, -2.9], [1.38, -2.17], [0, -2.17]])
  return <mesh geometry={geo} material={M.steel} />
}

/** Punto fijo: punta cónica de 60° (templada y rectificada), con el vértice en el origen. */
export function PuntoFijoPunta() {
  const geo = useRevolve([
    [0, -2.17],
    [1.25, -2.17],
    [0, 0],
  ])
  return <mesh geometry={geo} material={M.turned} />
}

/** Punto fijo armado: punta a 60° en el origen mirando a +x. */
export function PuntoFijo() {
  return (
    <group>
      <PuntoFijoCola />
      <PuntoFijoPunta />
    </group>
  )
}

/** Rodamiento rígido de bolas (eje x, centrado en x). */
export function Rodamiento({ x, w, ri, ro, n = 9 }: { x: number; w: number; ri: number; ro: number; n?: number }) {
  const { rings, balls } = useMemo(() => {
    const t = (ro - ri) * 0.28
    const a = x - w / 2
    const b = x + w / 2
    const inner = revolve(
      [
        [ri, a],
        [ri + t, a],
        [ri + t, b],
        [ri, b],
        [ri, a],
      ],
      40,
    )
    const outer = revolve(
      [
        [ro - t, a],
        [ro, a],
        [ro, b],
        [ro - t, b],
        [ro - t, a],
      ],
      40,
    )
    const rb = Math.min((ro - ri - 2 * t) * 0.6, w * 0.42)
    const rc = (ri + ro) / 2
    const bs: THREE.BufferGeometry[] = []
    for (let i = 0; i < n; i++) {
      const s = new THREE.SphereGeometry(rb, 12, 8)
      const ang = (i / n) * Math.PI * 2
      s.translate(x, Math.cos(ang) * rc, Math.sin(ang) * rc)
      bs.push(s)
    }
    const balls = mergeGeometries(bs)!
    bs.forEach((s) => s.dispose())
    return { rings: mergeGeometries([inner, outer])!, balls }
  }, [x, w, ri, ro, n])
  return (
    <group>
      <mesh geometry={rings} material={M.steel} />
      <mesh geometry={balls} material={M.turned} />
    </group>
  )
}

/** Punto giratorio: cuerpo con cola Morse (fijo). */
export function PuntoGiratorioCuerpo() {
  const body = useRevolve([
    [0, -10.2],
    [2.3, -10.2],
    [2.5, -10.0],
    [2.5, -4.45],
    [2.25, -4.1],
    [1.95, -4.1],
    [1.95, -9.6],
    [0, -9.6],
  ])
  const shank = useRevolve([...morseProfile(-10.2, 8, 1.2, 0.98), [0, -10.2]])
  return (
    <group>
      <mesh geometry={body} material={M.burnished} />
      <mesh geometry={shank} material={M.steel} />
    </group>
  )
}

/** Punto giratorio: eje con la punta (gira junto con la pieza). */
export function PuntoGiratorioPunta() {
  const geo = useRevolve([
    [0, -9.4],
    [0.75, -9.4],
    [0.75, -4.0],
    [1.6, -4.0],
    [1.6, -2.77],
    [0, 0],
  ])
  return <mesh geometry={geo} material={M.steel} />
}

export function PuntoGiratorioRodamientos({ which }: { which: 'a' | 'b' }) {
  return which === 'a' ? <Rodamiento x={-8.75} w={1.2} ri={0.75} ro={1.9} n={8} /> : <Rodamiento x={-5.2} w={1.6} ri={0.75} ro={1.9} n={8} />
}

/** Punto giratorio armado (para el torno). */
export function PuntoGiratorio({ spin = 0 }: { spin?: number }) {
  return (
    <group>
      <PuntoGiratorioCuerpo />
      <Spin speed={spin}>
        <PuntoGiratorioPunta />
      </Spin>
    </group>
  )
}

/* ================================================================== mandril portabrocas, broca y mecha de centrar */

export function MandrilCono() {
  const geo = useRevolve([...morseProfile(-0.8, 7.7, 0.9, 0.72), [1.4, -0.8], [1.4, -0.2], [0.8, -0.2], [0.8, 1.5], [0, 1.5]])
  return <mesh geometry={geo} material={M.steel} />
}

export function MandrilCuerpo() {
  const knurl = useCanvasTexture(
    256,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#9da2a8'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#5d6168'
      ctx.lineWidth = 2
      for (let i = -h; i < w + h; i += 8) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i + h, h)
        ctx.moveTo(i + h, 0)
        ctx.lineTo(i, h)
        ctx.stroke()
      }
    },
    [],
  )
  const back = useRevolve([
    [0, 0],
    [2.0, 0],
    [2.2, 0.2],
    [2.2, 2.0],
    [0.8, 2.0],
  ])
  const nose = useRevolve([
    [2.0, 6.2],
    [2.0, 6.5],
    [1.05, 8.0],
    [0.7, 8.0],
    [0.7, 6.2],
  ])
  const teeth = useMemo(() => gearX(36, 2.6, 0.6, 1.8, 0.82, 2.0), [])
  return (
    <group>
      <mesh geometry={back} material={M.steel} />
      <mesh geometry={teeth} material={M.steel} />
      <mesh position={[4.4, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[2.45, 2.45, 3.6, 40]} />
        <meshStandardMaterial map={knurl} metalness={0.85} roughness={0.45} />
      </mesh>
      <mesh geometry={nose} material={M.steel} />
      {/* agujero para la llave */}
      <mesh position={[1.0, 2.19, 0]} material={M.hole}>
        <cylinderGeometry args={[0.32, 0.32, 0.05, 16]} />
      </mesh>
    </group>
  )
}

/** Mordazas del portabrocas (convergen hacia la punta y aprietan una herramienta de radio g). */
export function MandrilMordazas({ g }: { g: number }) {
  return (
    <group>
      {[0, 120, 240].map((d) => {
        const a = d * D + Math.PI / 3
        const x0 = 2.8
        const y0 = 1.55
        const x1 = 8.6
        const y1 = g + 0.22
        const L = Math.hypot(x1 - x0, y1 - y0)
        return (
          <group key={d} rotation={[a, 0, 0]}>
            <mesh position={[(x0 + x1) / 2, (y0 + y1) / 2, 0]} rotation={[0, 0, Math.atan2(y1 - y0, x1 - x0)]} material={M.satin}>
              <boxGeometry args={[L, 0.42, 0.5]} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

/** Llave del portabrocas (eje radial = +y local, en la posición del agujero). */
export function MandrilLlave() {
  const pin = useMemo(() => {
    const g = gearGeometry(12, 0.85, 0.55, 0, 0.78)
    g.translate(0, 2.3, 0)
    g.computeVertexNormals()
    return g
  }, [])
  return (
    <group position={[1.0, 0, 0]}>
      <mesh position={[0, 1.95, 0]} material={M.burnished}>
        <cylinderGeometry args={[0.28, 0.28, 0.7, 12]} />
      </mesh>
      <mesh geometry={pin} material={M.burnished} />
      <mesh position={[0, 4.4, 0]} material={M.burnished}>
        <cylinderGeometry args={[0.35, 0.4, 3.2, 12]} />
      </mesh>
      <mesh position={[0, 6.1, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.rubber}>
        <cylinderGeometry args={[0.42, 0.42, 5.4, 14]} />
      </mesh>
    </group>
  )
}

/** Broca helicoidal (2 canales) desde x0, de radio r y largo L, con punta de 118°. */
export function Broca({ x0, r, L, shank }: { x0: number; r: number; L: number; shank: number }) {
  const geo = useMemo(() => {
    const pts: P2[] = []
    const n = 72
    for (let i = 0; i < n; i++) {
      const phi = (i / n) * Math.PI * 2
      const u = (phi % Math.PI) / Math.PI
      const rr = u < 0.45 ? r : r * (1 - 0.8 * Math.pow(Math.sin((Math.PI * (u - 0.45)) / 0.55), 0.8))
      pts.push([Math.cos(phi) * rr, Math.sin(phi) * rr])
    }
    const fl = L - shank
    const g = new THREE.ExtrudeGeometry(polyShape(pts), { depth: fl, steps: 60, bevelEnabled: false })
    const lead = (Math.PI * 2 * r) / Math.tan(30 * D)
    const tip = Math.tan(59 * D)
    const pos = g.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const z = pos.getZ(i)
      const a = (z / lead) * Math.PI * 2
      let nx = x * Math.cos(a) - y * Math.sin(a)
      let ny = x * Math.sin(a) + y * Math.cos(a)
      const rv = Math.hypot(nx, ny)
      const lim = (fl - z) * tip
      if (rv > lim && rv > 1e-6) {
        nx *= lim / rv
        ny *= lim / rv
      }
      // (x, y, z) → eje +x
      pos.setXYZ(i, z, ny, -nx)
    }
    g.deleteAttribute('normal')
    g.computeVertexNormals()
    g.translate(x0 + shank, 0, 0)
    return g
  }, [x0, r, L, shank])
  return (
    <group>
      <mesh geometry={geo} material={M.hss} />
      <CylX x0={x0} x1={x0 + shank + 0.01} r={r * 0.98} m={M.hss} seg={24} />
    </group>
  )
}

/** Mecha de centrar (tipo A, 60°): cuerpo Ø 8 con punta de centrar en ambos extremos. */
export function MechaCentrar({ x0 }: { x0: number }) {
  const geo = useRevolve(
    [
      [0, x0 - 0.15],
      [0.125, x0],
      [0.125, x0 + 0.3],
      [0.4, x0 + 0.78],
      [0.4, x0 + 4.22],
      [0.125, x0 + 4.7],
      [0.125, x0 + 5.0],
      [0, x0 + 5.15],
    ],
    32,
    [x0],
  )
  return (
    <group>
      <mesh geometry={geo} material={M.hss} />
      {[0, Math.PI].map((a) => (
        <group key={a} rotation={[a, 0, 0]}>
          <B p={[x0 + 0.65, 0.33, 0]} s={[1.0, 0.16, 0.2]} m={M.hole} />
          <B p={[x0 + 4.35, 0.33, 0]} s={[1.0, 0.16, 0.2]} m={M.hole} />
        </group>
      ))}
    </group>
  )
}

/* ================================================================== lunetas */

/** Patín de luneta (eje radial = +y local): punta de bronce a radio r, tornillo y perilla. */
export function PatinLuneta({ r, housing = 9.0 }: { r: number; housing?: number }) {
  const len = housing + 4.6 - r
  return (
    <group>
      <mesh position={[0, r + len / 2, 0]} material={M.steel}>
        <boxGeometry args={[1.2, len, 1.2]} />
      </mesh>
      <mesh position={[0, r + 0.35, 0]} material={M.bronze}>
        <boxGeometry args={[1.35, 0.7, 1.35]} />
      </mesh>
      <mesh position={[0, housing + 5.6, 0]} material={M.steel}>
        <cylinderGeometry args={[0.38, 0.38, 2.2, 12]} />
      </mesh>
      <mesh position={[0, housing + 7.0, 0]} material={M.black}>
        <cylinderGeometry args={[1.0, 1.0, 0.9, 20]} />
      </mesh>
    </group>
  )
}

/** Cuerpo de la luneta fija (en el plano yz, centro de la pieza en (0, 18)). */
export function LunetaFijaCuerpo() {
  const geo = useMemo(() => {
    const c = BED.center
    const ri = 7.5
    const ro = 10.5
    const lower: P2[] = [
      [-11, 1.0],
      [11, 1.0],
      [11, 4.5],
      [ro, c - 4],
      [ro, c],
      [ri, c],
      ...arcPts(ri, 0, -Math.PI, 28, 0, c).slice(1, -1),
      [-ri, c],
      [-ro, c],
      [-ro, c - 4],
      [-11, 4.5],
    ]
    const upper: P2[] = [...arcPts(ro, 0, Math.PI, 32, 0, c + 0.15), ...arcPts(ri, Math.PI, 0, 28, 0, c + 0.15)]
    const g1 = extrudeX(polyShape(lower), 3.2, -1.6, 1)
    const g2 = extrudeX(polyShape(upper), 3.2, -1.6, 1)
    const base = new THREE.BoxGeometry(10, 3.5, 22)
    base.translate(0, 2.75, 0)
    // cajas de los patines (tubos) y bisagra / traba de la tapa
    const bosses: THREE.BufferGeometry[] = []
    ;[0, 120, 240].forEach((d) => {
      const t = new THREE.CylinderGeometry(1.3, 1.3, 4.2, 20)
      t.translate(0, 11.4, 0)
      t.rotateX(d * D)
      t.translate(0, c, 0)
      bosses.push(t)
    })
    const lug1 = new THREE.BoxGeometry(3.2, 2.0, 2.4)
    lug1.translate(0, c, -11.4)
    const lug2 = new THREE.BoxGeometry(3.2, 2.0, 2.4)
    lug2.translate(0, c, 11.4)
    return mergeGeometries([ni(g1), ni(g2), ni(base), ...bosses.map(ni), ni(lug1), ni(lug2)])!
  }, [])
  return (
    <group>
      <mesh geometry={geo} material={M.blue} />
      {/* perno de la bisagra y bulón de traba de la tapa */}
      <CylX x0={-2} x1={2} r={0.5} m={M.steel} y={BED.center} z={-11.4} seg={12} />
      <mesh position={[0, BED.center + 1.6, 11.4]} material={M.black}>
        <cylinderGeometry args={[0.9, 0.9, 1.0, 6]} />
      </mesh>
    </group>
  )
}

export function LunetaZapata() {
  return <B p={[0, -4.5, 0]} s={[8, 2, 26]} m={M.cast} />
}

export function LunetaBulon() {
  return (
    <group>
      <mesh position={[0, -6.3, 0]} material={M.burnished}>
        <boxGeometry args={[2.6, 1.6, 2.6]} />
      </mesh>
      <mesh position={[0, 0.4, 0]} material={M.steel}>
        <cylinderGeometry args={[0.7, 0.7, 12, 16]} />
      </mesh>
    </group>
  )
}

export function LunetaTuerca() {
  return (
    <group>
      <mesh position={[0, 4.6, 0]} material={M.steel}>
        <cylinderGeometry args={[2.0, 2.0, 0.2, 24]} />
      </mesh>
      <mesh position={[0, 5.4, 0]} material={M.steel}>
        <cylinderGeometry args={[1.5, 1.5, 1.4, 6]} />
      </mesh>
    </group>
  )
}

/** Cuerpo de la luneta móvil ("C" que abraza la pieza desde atrás y arriba). */
export function LunetaMovilCuerpo() {
  const geo = useMemo(() => {
    const c = BED.center
    const ri = 7.0
    const ro = 10.0
    const pts: P2[] = [
      [-12.5, 5.0],
      [-4.5, 5.0],
      [-4.5, 8.0],
      ...arcPts(ri, Math.PI + 0.75, Math.PI / 2 - 0.25, 30, 0, c),
      ...arcPts(ro, Math.PI / 2 - 0.25, Math.PI + 0.5, 30, 0, c),
      [-12.5, 9.0],
    ]
    // los puntos están escritos como (z, y): extrudeX pone z = −u
    const g = extrudeX(polyShape(pts.map(([z, y]) => [-z, y] as P2)), 2.6, -1.3, 1)
    const bosses: THREE.BufferGeometry[] = []
    ;[0, -90].forEach((d) => {
      const t = new THREE.CylinderGeometry(1.3, 1.3, 4.0, 20)
      t.translate(0, 9.5, 0)
      t.rotateX(d * D)
      t.translate(0, c, 0)
      bosses.push(ni(t))
    })
    return mergeGeometries([ni(g), ...bosses])!
  }, [])
  return <mesh geometry={geo} material={M.blue} />
}

/* ================================================================== herramientas de corte */

/** Rombo / polígono de plaquita centrado, en el plano (u, v). */
function rhombus(longHalf: number, shortHalf: number, k = 1): P2[] {
  return [
    [longHalf * k, 0],
    [0, shortHalf * k],
    [-longHalf * k, 0],
    [0, -shortHalf * k],
  ]
}

function triangle(ic: number, k = 1): P2[] {
  // triángulo equilátero con círculo inscripto de radio ic, una punta en +u
  const R = 2 * ic * k
  return [0, 120, 240].map((d) => [Math.cos(d * D) * R, Math.sin(d * D) * R] as P2)
}

/**
 * Plaquita (inserto) de metal duro con rompevirutas: base + labio perimetral + meseta central.
 * Queda acostada (cara superior hacia +y, espesor t), con el centro en el origen; la punta en +u.
 */
export function InsertoGeo({ outline, t, hole, chipbreaker = true, tin = false }: { outline: (k: number) => P2[]; t: number; hole: number; chipbreaker?: boolean; tin?: boolean }) {
  const geos = useMemo(() => {
    const rc = 0.08
    const out = roundedPoly(outline(1), rc)
    const holeP = circlePts(hole, 24)
    if (!chipbreaker) return { base: extrudeY(polyShape(out, [holeP]), t, 0), land: null, plateau: null }
    const inner1 = roundedPoly(outline(0.86), rc * 0.8)
    const inner2 = roundedPoly(outline(0.66), rc * 0.6)
    const groove = 0.07
    const base = extrudeY(polyShape(out, [holeP]), t - groove, 0)
    const land = extrudeY(polyShape(out, [inner1.slice().reverse()]), groove, t - groove)
    const plateau = extrudeY(polyShape(inner2, [circlePts(hole + 0.12, 24)]), groove, t - groove)
    return { base, land, plateau }
  }, [outline, t, hole, chipbreaker])
  const m = tin ? M.tin : M.carbide
  return (
    <group>
      <mesh geometry={geos.base} material={m} />
      {geos.land && <mesh geometry={geos.land} material={m} />}
      {geos.plateau && <mesh geometry={geos.plateau} material={M.shim} />}
    </group>
  )
}

const CNMG = (k: number) => rhombus(0.988, 0.829, k)
const DCMT = (k: number) => rhombus(0.62, 0.29, k)
const TRI = (k: number) => triangle(0.48, k)
const TRI_SHIM = (k: number) => triangle(0.48, k * 0.94)

/** Tornillo Torx de fijación de la plaquita (eje vertical). */
export function TornilloInserto({ y0, len, r = 0.16 }: { y0: number; len: number; r?: number }) {
  return (
    <group>
      <mesh position={[0, y0 - len / 2, 0]} material={M.burnished}>
        <cylinderGeometry args={[r, r, len, 12]} />
      </mesh>
      <mesh position={[0, y0 + 0.06, 0]} material={M.burnished}>
        <cylinderGeometry args={[r * 1.8, r * 1.2, 0.2, 16]} />
      </mesh>
      <mesh position={[0, y0 + 0.165, 0]} material={M.hole}>
        <cylinderGeometry args={[r * 0.8, r * 0.8, 0.02, 6]} />
      </mesh>
    </group>
  )
}

/* ---------- portainsertos para cilindrar (95°) con plaquita rómbica 80° (tipo CNMG) ---------- */

/** Ubicación de la plaquita del portainsertos (punta en +x, filo principal hacia −z). */
export const PORTA = {
  H: 2.0,
  W: 2.0,
  L: 12.5,
  tip: [3.15, 0, -1.15] as Vec3,
  ang: 45 * D,
  shimT: 0.32,
  insT: 0.476,
}
export function portaInsertCenter(): Vec3 {
  const d = 0.988
  return [PORTA.tip[0] - d * Math.cos(PORTA.ang), 0, PORTA.tip[2] + d * Math.sin(PORTA.ang)]
}

export function PortainsertoCuerpo() {
  const geo = useMemo(() => {
    const c = portaInsertCenter()
    const floor = PORTA.H - PORTA.insT - PORTA.shimT + 0.02
    const pts: THREE.Vector3[] = []
    // extremo del vástago
    for (const y of [0, PORTA.H]) for (const z of [-PORTA.W / 2, PORTA.W / 2]) pts.push(new THREE.Vector3(0, y, z))
    // respaldo de la plaquita (altura completa)
    for (const y of [0, PORTA.H]) for (const z of [0.15, PORTA.W / 2]) pts.push(new THREE.Vector3(1.55, y, z))
    // apoyo de la plaquita (contorno) y su alivio hacia abajo
    const out = rhombus(0.988, 0.829, 0.97)
    for (const [u, v] of out) {
      // u → dirección de la punta (cos a, −sin a); v → perpendicular (sin a, cos a)
      const px = c[0] + u * Math.cos(PORTA.ang) + v * Math.sin(PORTA.ang)
      const pz = c[2] - u * Math.sin(PORTA.ang) + v * Math.cos(PORTA.ang)
      pts.push(new THREE.Vector3(px, floor, pz))
      pts.push(new THREE.Vector3(c[0] + (px - c[0]) * 0.8 - 0.15, 0.25, c[2] + (pz - c[2]) * 0.8 + 0.1))
    }
    const head = new ConvexGeometry(pts)
    const shank = new THREE.BoxGeometry(PORTA.L, PORTA.H, PORTA.W)
    shank.translate(-PORTA.L / 2, PORTA.H / 2, 0)
    return mergeGeometries([ni(head), ni(shank)])!
  }, [])
  const label = useCanvasTexture(
    512,
    64,
    (ctx, w, h) => {
      ctx.fillStyle = '#26282c'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#d8dadc'
      ctx.font = 'bold 34px Arial, sans-serif'
      ctx.textBaseline = 'middle'
      ctx.fillText('PCLNR 2020K12', 24, h / 2)
    },
    [],
  )
  return (
    <group>
      <mesh geometry={geo} material={M.burnished} />
      <mesh position={[-PORTA.L / 2, PORTA.H / 2, PORTA.W / 2 + 0.003]}>
        <planeGeometry args={[8, 1.0]} />
        <meshStandardMaterial map={label} metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  )
}

/** Grupo ubicado en el centro de la plaquita (sobre el asiento), girado como la plaquita. */
function AtInsert({ y, children }: { y: number; children: ReactNode }) {
  const c = portaInsertCenter()
  return (
    <group position={[c[0], y, c[2]]} rotation={[0, PORTA.ang, 0]}>
      {children}
    </group>
  )
}

export function PortainsertoAsiento() {
  const floor = PORTA.H - PORTA.insT - PORTA.shimT
  return (
    <AtInsert y={floor}>
      <InsertoGeo outline={(k) => CNMG(k * 0.95)} t={PORTA.shimT} hole={0.3} chipbreaker={false} />
    </AtInsert>
  )
}

export function PortainsertoInserto() {
  return (
    <AtInsert y={PORTA.H - PORTA.insT}>
      <InsertoGeo outline={CNMG} t={PORTA.insT} hole={0.26} />
    </AtInsert>
  )
}

export function PortainsertoTornillo() {
  return (
    <AtInsert y={PORTA.H - 0.12}>
      <TornilloInserto y0={0} len={1.6} />
    </AtInsert>
  )
}

/** Portainsertos armado (punta en +x, cara de la plaquita en y = 2). */
export function Portainserto() {
  return (
    <group>
      <PortainsertoCuerpo />
      <PortainsertoAsiento />
      <PortainsertoInserto />
      <PortainsertoTornillo />
    </group>
  )
}

/* ---------- herramienta integral de acero rápido (HSS) ---------- */

export const HSS = { S: 1.6, L: 11, head: 2.6, alpha: 8, gamma: 14 }

export function IntegralCuerpo() {
  const geo = useMemo(() => {
    const s = HSS.S
    const ta = Math.tan(HSS.alpha * D)
    const tg = Math.tan(HSS.gamma * D)
    const yt = s
    const yr = s - s * tg
    const zf = s / 2 - s * ta
    const pts = [
      [0, yt, s / 2],
      [HSS.head, yt, s / 2],
      [0, yr, -s / 2],
      [HSS.head - 0.75, yr, -s / 2],
      [0, 0, zf],
      [HSS.head - 0.35, 0, zf],
      [0, 0, -s / 2],
      [HSS.head - 1.0, 0, -s / 2],
    ].map((p) => new THREE.Vector3(...(p as Vec3)))
    const head = new ConvexGeometry(pts)
    const shank = new THREE.BoxGeometry(HSS.L, s, s)
    shank.translate(-HSS.L / 2, s / 2, 0)
    return { head, shank }
  }, [])
  return (
    <group>
      <mesh geometry={geo.shank} material={M.hss} />
      <mesh geometry={geo.head} material={M.turned} />
    </group>
  )
}

/** Caras de la herramienta integral resaltadas (cara de ataque, flanco principal) y el filo. */
export function IntegralCara({ which }: { which: 'ataque' | 'flanco' | 'filo' }) {
  const s = HSS.S
  const ta = Math.tan(HSS.alpha * D)
  const tg = Math.tan(HSS.gamma * D)
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    let v: number[] = []
    if (which === 'ataque') {
      const yr = s - s * tg
      v = [0, s, s / 2, HSS.head, s, s / 2, HSS.head - 0.75, yr, -s / 2, 0, s, s / 2, HSS.head - 0.75, yr, -s / 2, 0, yr, -s / 2]
    } else if (which === 'flanco') {
      const zf = s / 2 - s * ta
      v = [0, s, s / 2, 0, 0, zf, HSS.head - 0.35, 0, zf, 0, s, s / 2, HSS.head - 0.35, 0, zf, HSS.head, s, s / 2]
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3))
    g.computeVertexNormals()
    return g
  }, [which, s, ta, tg])
  if (which === 'filo')
    return (
      <mesh position={[HSS.head / 2, s, s / 2]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, HSS.head, 8]} />
        <meshBasicMaterial color="#ffd23f" />
      </mesh>
    )
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial color={which === 'ataque' ? '#4fa3ff' : '#ff7a59'} transparent opacity={0.45} side={THREE.DoubleSide} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  )
}

/** Corte de la cuña con los ángulos α (incidencia), β (filo) y γ (ataque), dibujado delante de la punta. */
export function AngulosHerramienta({ x: x0 = 4.2, k = 2 }: { x?: number; k?: number }) {
  // se dibuja ampliado ×k alrededor del filo, en un plano paralelo al corte
  return (
    <group position={[x0, HSS.S * (1 - k), (HSS.S / 2) * (1 - k)]} scale={k}>
      <AngulosSeccion />
    </group>
  )
}

function AngulosSeccion() {
  const x = 0
  const s = HSS.S
  const a = HSS.alpha * D
  const g = HSS.gamma * D
  // en el plano (z, y): el filo está en E = (s/2, s)
  const E: P2 = [s / 2, s]
  const flankDir: P2 = [-Math.sin(a), -Math.cos(a)] // hacia abajo, inclinado α
  const rakeDir: P2 = [-Math.cos(g), -Math.sin(g)] // hacia atrás (−z), inclinado γ
  const P = (p: P2, d: P2, k: number): Vec3 => [x, p[1] + d[1] * k, p[0] + d[0] * k]
  const arc = (r: number, a0: number, a1: number): Vec3[] =>
    Array.from({ length: 17 }, (_, i) => {
      const t = a0 + ((a1 - a0) * i) / 16
      return [x, E[1] + Math.sin(t) * r, E[0] + Math.cos(t) * r]
    })
  // ángulos en el plano (z, y) medidos desde +z
  const angDown = -Math.PI / 2
  const angFlank = Math.atan2(flankDir[1], flankDir[0])
  const angRake = Math.atan2(rakeDir[1], rakeDir[0])
  const angBack = -Math.PI
  const section: Vec3[] = [
    [x, s, s / 2],
    [x, s - s * Math.tan(g), -s / 2],
    [x, 0, -s / 2],
    [x, 0, s / 2 - s * Math.tan(a)],
    [x, s, s / 2],
  ]
  const mid = (r: number, a0: number, a1: number): Vec3 => [x, E[1] + Math.sin((a0 + a1) / 2) * r, E[0] + Math.cos((a0 + a1) / 2) * r]
  return (
    <group>
      <Line points={section} color="#ffffff" lineWidth={2} />
      {/* referencias: vertical (dirección del corte) y horizontal */}
      <Line points={[P(E, [0, -1], 0), P(E, [0, -1], 2.4)]} color="#aab4c3" lineWidth={1} dashed dashSize={0.2} gapSize={0.15} />
      <Line points={[P(E, [-1, 0], 0), P(E, [-1, 0], 2.8)]} color="#aab4c3" lineWidth={1} dashed dashSize={0.2} gapSize={0.15} />
      <Line points={[P(E, flankDir, 0), P(E, flankDir, 2.4)]} color="#ff7a59" lineWidth={2} />
      <Line points={[P(E, rakeDir, 0), P(E, rakeDir, 2.8)]} color="#4fa3ff" lineWidth={2} />
      <Line points={arc(2.0, angDown, angFlank)} color="#ff7a59" lineWidth={3} />
      <Line points={arc(1.3, angFlank, angRake)} color="#ffd23f" lineWidth={3} />
      <Line points={arc(2.5, angRake, angBack)} color="#4fa3ff" lineWidth={3} />
      <TextSprite text={`α = ${HSS.alpha}°`} position={(() => { const m = mid(2.0, angDown, angFlank); return [m[0], m[1] - 0.9, m[2] + 0.6] as Vec3 })()} size={0.45} color="#ff9d85" />
      <TextSprite text={`β = ${90 - HSS.alpha - HSS.gamma}°`} position={(() => { const m = mid(1.3, angFlank, angRake); return [m[0], m[1] - 0.9, m[2] - 1.0] as Vec3 })()} size={0.45} color="#ffe27a" />
      <TextSprite text={`γ = ${HSS.gamma}°`} position={(() => { const m = mid(2.5, angRake, angBack); return [m[0], m[1] + 0.8, m[2] - 0.6] as Vec3 })()} size={0.45} color="#8cc3ff" />
    </group>
  )
}

/* ---------- herramienta de ranurar / tronzar (cuchilla con plaquita) ---------- */

export function TronzarBloque() {
  return (
    <group>
      <B p={[-4.5, 1.25, 0]} s={[9, 2.5, 2.0]} m={M.burnished} />
      <B p={[-4.5, 2.45, -1.85]} s={[9, 1.1, 1.1]} m={M.burnished} />
      {[-7, -2].map((x) => (
        <mesh key={x} position={[x, 3.15, -1.85]} material={M.steel}>
          <cylinderGeometry args={[0.45, 0.45, 0.4, 6]} />
        </mesh>
      ))}
    </group>
  )
}

export function TronzarCuchilla() {
  const geo = useMemo(() => {
    const pts: P2[] = [
      [-11, 0.3],
      [2.2, 0.3],
      [2.95, 1.0],
      [2.95, 2.2],
      [2.0, 2.2],
      [1.7, 2.5],
      [1.5, 2.5],
      [1.5, 2.9],
      [-11, 2.9],
    ]
    const g = new THREE.ExtrudeGeometry(polyShape(pts), { depth: 0.26, bevelEnabled: false })
    g.translate(0, 0, -0.13)
    return g
  }, [])
  return <mesh geometry={geo} material={M.satin} position={[0, 0, -1.15]} />
}

export function TronzarInserto() {
  const geo = useMemo(() => {
    const pts: P2[] = [
      [2.0, 2.2],
      [3.05, 2.2],
      [3.05, 2.9],
      [1.7, 2.9],
      [1.7, 2.5],
    ]
    const g = new THREE.ExtrudeGeometry(polyShape(pts), { depth: 0.32, bevelEnabled: false })
    g.translate(0, 0, -0.16)
    return g
  }, [])
  return <mesh geometry={geo} material={M.tin} position={[0, 0, -1.15]} />
}

/* ---------- herramienta de roscar exterior (plaquita triangular, perfil 60°) ---------- */

export function RoscarCuerpo() {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (const y of [0, PORTA.H]) for (const z of [-PORTA.W / 2, PORTA.W / 2]) pts.push(new THREE.Vector3(0, y, z))
    for (const y of [0, PORTA.H - 0.8]) for (const z of [-0.6, PORTA.W / 2]) pts.push(new THREE.Vector3(2.4, y, z))
    pts.push(new THREE.Vector3(2.3, PORTA.H - 0.8, -0.9), new THREE.Vector3(1.9, 0.3, -0.7))
    const head = new ConvexGeometry(pts)
    const shank = new THREE.BoxGeometry(PORTA.L, PORTA.H, PORTA.W)
    shank.translate(-PORTA.L / 2, PORTA.H / 2, 0)
    return mergeGeometries([ni(head), ni(shank)])!
  }, [])
  return <mesh geometry={geo} material={M.burnished} />
}

/** Centro de la plaquita de roscar: punta a 60° apuntando a +x, sobresaliendo del cuerpo. */
const ROSCA_C: Vec3 = [2.0, 0, -0.35]

export function RoscarAsiento() {
  return (
    <group position={[ROSCA_C[0], PORTA.H - 0.8, ROSCA_C[2]]}>
      <InsertoGeo outline={TRI_SHIM} t={0.3} hole={0.25} chipbreaker={false} />
    </group>
  )
}

export function RoscarInserto() {
  return (
    <group position={[ROSCA_C[0], PORTA.H - 0.5, ROSCA_C[2]]}>
      <InsertoGeo outline={TRI} t={0.4} hole={0.22} chipbreaker={false} tin />
    </group>
  )
}

export function RoscarTornillo() {
  return (
    <group position={[ROSCA_C[0], PORTA.H - 0.06, ROSCA_C[2]]}>
      <TornilloInserto y0={0} len={1.3} r={0.14} />
    </group>
  )
}

/** Marca del ángulo de 60° del perfil de rosca sobre la punta. */
export function Angulo60() {
  const tip: Vec3 = [ROSCA_C[0] + 0.96, PORTA.H - 0.1 + 0.05, ROSCA_C[2]]
  const r = 1.0
  const pts = Array.from({ length: 17 }, (_, i) => {
    const t = 150 * D + (60 * D * i) / 16
    return [tip[0] + Math.cos(t) * r, tip[1] + 0.02, tip[2] - Math.sin(t) * r] as Vec3
  })
  const e1: Vec3 = [tip[0] + Math.cos(150 * D) * 1.6, tip[1] + 0.02, tip[2] - Math.sin(150 * D) * 1.6]
  const e2: Vec3 = [tip[0] + Math.cos(210 * D) * 1.6, tip[1] + 0.02, tip[2] - Math.sin(210 * D) * 1.6]
  return (
    <group>
      <Line points={[e1, tip, e2]} color="#ffd23f" lineWidth={2} />
      <Line points={pts} color="#ffd23f" lineWidth={3} />
      <TextSprite text="60°" position={[tip[0] - 2.0, tip[1] + 0.9, tip[2]]} size={0.8} color="#ffe27a" />
    </group>
  )
}

/* ---------- barra de interiores ---------- */

export function InteriorBarra() {
  const geo = useMemo(() => {
    const r = 0.8
    const bar = revolve(
      [
        [0, -15],
        [r, -15],
        [r, 0],
        [0, 0],
      ],
      32,
    )
    const pts: THREE.Vector3[] = []
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2
      pts.push(new THREE.Vector3(-0.01, Math.cos(a) * r, Math.sin(a) * r))
    }
    pts.push(new THREE.Vector3(1.5, 0.55, -0.15), new THREE.Vector3(1.5, 0.55, -0.85), new THREE.Vector3(1.35, -0.4, -0.75), new THREE.Vector3(1.0, -0.55, 0.3), new THREE.Vector3(0.8, 0.55, 0.6))
    const head = new ConvexGeometry(pts)
    return { bar, head }
  }, [])
  return (
    <group>
      <mesh geometry={geo.bar} material={M.burnished} />
      <mesh geometry={geo.head} material={M.burnished} />
      {/* plano de apoyo y agujero de refrigerante */}
      <B p={[-8.5, 0.66, 0]} s={[13, 0.3, 1.0]} m={M.satin} />
      <mesh position={[-15.01, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={M.hole}>
        <cylinderGeometry args={[0.18, 0.18, 0.02, 12]} />
      </mesh>
    </group>
  )
}

const INT_C: Vec3 = [1.0, 0.55, -0.45]

export function InteriorInserto() {
  return (
    <group position={[INT_C[0], INT_C[1] - 0.24, INT_C[2]]} rotation={[0, 30 * D, 0]}>
      <InsertoGeo outline={DCMT} t={0.24} hole={0.12} tin />
    </group>
  )
}

export function InteriorTornillo() {
  return (
    <group position={[INT_C[0], INT_C[1] - 0.03, INT_C[2]]}>
      <TornilloInserto y0={0} len={0.9} r={0.09} />
    </group>
  )
}

/* ---------- moleta (moleteador de dos ruedas) ---------- */

function knurlGeometry(handed: 1 | -1) {
  const g = gearGeometry(34, 1.0, 0.8, 0.25, 0.9)
  const pos = g.getAttribute('position') as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const a = handed * (y - 0.4) * 0.55
    pos.setXYZ(i, x * Math.cos(a) - z * Math.sin(a), y - 0.4, x * Math.sin(a) + z * Math.cos(a))
  }
  g.computeVertexNormals()
  // eje de la rueda a lo largo de z
  g.rotateX(Math.PI / 2)
  return g
}

export function MoletaCuerpo() {
  const fork = useBoxes([
    { p: [-5, 1.0, 0], s: [10, 2.0, 2.0] },
    { p: [1.0, 1.0, -1.05], s: [2.6, 4.6, 0.5] },
    { p: [1.0, 1.0, 1.05], s: [2.6, 4.6, 0.5] },
    { p: [-0.1, 1.0, 0], s: [0.6, 4.6, 2.6] },
  ])
  return (
    <group>
      <mesh geometry={fork} material={M.burnished} />
      <CylX x0={-0.4} x1={0.4} r={0.25} m={M.steel} y={1.0} z={0} />
    </group>
  )
}

export function MoletaRuedas() {
  const g1 = useMemo(() => knurlGeometry(1), [])
  const g2 = useMemo(() => knurlGeometry(-1), [])
  return (
    <group position={[1.6, 1.0, 0]}>
      <mesh geometry={g1} material={M.steel} position={[0, 1.15, 0]} />
      <mesh geometry={g2} material={M.steel} position={[0, -1.15, 0]} />
      {[1.15, -1.15].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.satin}>
          <cylinderGeometry args={[0.22, 0.22, 2.7, 12]} />
        </mesh>
      ))}
    </group>
  )
}

/* ================================================================== modelos de catálogo */

export type PlatoKind = '3m' | '4m' | 'liso' | 'pinza'

/** Platos y elementos de sujeción (1 unidad = 10 mm). */
export function PlatosModel({ kind, clampD, inverted, jaws4, showKey }: { kind: PlatoKind; clampD: number; inverted: boolean; jaws4: [number, number, number, number]; showKey: boolean }) {
  const R = clampD / 20
  if (kind === '3m') {
    const barX0 = 2.5
    return (
      <group position={[-3, 0, 0]}>
        <Part id="plato-trasero" offset={[-7, 0, 0]} labelAt={[-1.1, 8.6, 0]}>
          <Chuck3BackPlate />
        </Part>
        <Part id="cuerpo" offset={[6, 0, 0]} labelAt={[3.3, 9.4, 0]}>
          <Chuck3Body />
        </Part>
        <Part id="espiral" offset={[-1.5, 0, 0]} labelAt={[2.8, -8.4, 0]}>
          <Chuck3Scroll />
        </Part>
        {PIN3.map((a, i) => (
          <group key={a} rotation={[a, 0, 0]}>
            <Part id="pinones" offset={[6, 5, 0]} noLabel={i !== 1} labelAt={[0.95, 9.4, 0]}>
              <Chuck3Pinion />
            </Part>
          </group>
        ))}
        {JAW3.map((a, i) => (
          <group key={a} rotation={[a, 0, 0]}>
            <Part id="mordazas" offset={[10, 4, 0]} noLabel={i !== 0} labelAt={[8.5, (inverted ? R - 3.3 : R) + 6.4, 0]}>
              <Chuck3Jaw angle={0} clampR={R} inverted={inverted} />
            </Part>
          </group>
        ))}
        {showKey && (
          <group rotation={[PIN3[0], 0, 0]}>
            <Part id="llave" offset={[6, 7, 0]} labelAt={[0.95, 16.4, 4.5]}>
              <group position={[0.95, 0, 0]}>
                <ChuckKey base={7.3} />
              </group>
            </Part>
          </group>
        )}
        <Part id="pieza" offset={[18, 0, 0]} labelAt={[inverted ? 10 : 13, R + 1.2, 0]}>
          {inverted ? <Bar x0={C3.L + 3.2 * 0.66} x1={C3.L + 3.2 * 0.66 + 2.6} r={R} /> : <Bar x0={barX0} x1={C3.L + 9} r={R} />}
        </Part>
      </group>
    )
  }
  if (kind === '4m') {
    const [j1, j2, j3, j4] = jaws4.map((v) => v / 10)
    const bw = 6.0 // ancho de la pieza (eje z)
    const bh = 5.0 // alto de la pieza (eje y)
    const cy = (j1 - j3) / 2
    const cz = (j2 - j4) / 2
    const js = [j1, j2, j3, j4]
    return (
      <group position={[-3, 0, 0]}>
        <Part id="cuerpo" offset={[0, 0, 0]} labelAt={[3.5, 11.2, 0]}>
          <Chuck4Body />
        </Part>
        {JAW4.map((a, i) => (
          <group key={a} rotation={[a, 0, 0]}>
            <Part id="mordazas" offset={[4, 7, 0]} noLabel={i !== 0} labelAt={[9, js[i] + 6.5, 0]}>
              <Chuck4Jaw rIn={js[i]} inverted={inverted} />
            </Part>
            <Part id="tornillos" offset={[0, 15, 0]} noLabel={i !== 1} labelAt={[5.85, 11.6, 0]}>
              <Chuck4Screw />
            </Part>
          </group>
        ))}
        {showKey && (
          <group rotation={[JAW4[1], 0, 0]}>
            <Part id="llave" offset={[0, 12, 0]} labelAt={[5.85, 18, 4.5]}>
              <group position={[5.85, 2.7, 0]}>
                <ChuckKey base={7.3} />
              </group>
            </Part>
          </group>
        )}
        <Part id="pieza" offset={[16, 0, 0]} labelAt={[12, cy + bh / 2 + 1, cz]}>
          <Smooth p={[0, cy, cz]}>
            <mesh position={[C4.L + 4.2, 0, 0]} material={M.cast}>
              <boxGeometry args={[8.4, bh, bw]} />
            </mesh>
            <CylX x0={C4.L + 8.4} x1={C4.L + 9.6} r={1.6} m={M.turned} />
          </Smooth>
        </Part>
      </group>
    )
  }
  if (kind === 'liso') {
    return (
      <group position={[-6, 0, 0]}>
        <Part id="plato-liso" offset={[0, 0, 0]} labelAt={[1.2, 10.8, 0]}>
          <PlatoLiso />
        </Part>
        <Part id="perno" offset={[9, 0, 0]} labelAt={[6.6, -8.5, 0]}>
          <PernoArrastre />
        </Part>
        <Part id="punto" offset={[6, 0, 0]} labelAt={[3.5, 2.6, 2]}>
          <group position={[4.85, 0, 0]}>
            <PuntoFijo />
          </group>
        </Part>
        <Part id="brida" offset={[10, 0, 0]} labelAt={[0, 8.2, 0]}>
          <group position={[8.6, 0, 0]} rotation={[0.19, 0, 0]}>
            <Brida barR={2} />
          </group>
        </Part>
        <Part id="pieza" offset={[14, 0, 0]} labelAt={[16, 3.2, 0]}>
          <Bar x0={4.4} x1={22} r={2} centerL centerR />
        </Part>
      </group>
    )
  }
  return (
    <group position={[-2, 0, 0]}>
      <Part id="portapinzas" offset={[-6, 0, 0]} labelAt={[-4, 5.4, 0]}>
        <Portapinzas />
      </Part>
      <Part id="pinza" offset={[7, 0, 0]} labelAt={[-0.6, 3.2, 0]}>
        <group position={[0.9, 0, 0]}>
          <Pinza boreR={1.0} />
        </group>
      </Part>
      <Part id="tuerca" offset={[12, 0, 0]} labelAt={[0.5, 5.0, 0]}>
        <TuercaPinza />
      </Part>
      <Part id="pieza" offset={[18, 0, 0]} labelAt={[6, 1.9, 0]}>
        <Bar x0={-3.6} x1={10} r={1.0} />
      </Part>
    </group>
  )
}

export type PuntoKind = 'fijo' | 'giratorio' | 'mandril' | 'luneta-fija' | 'luneta-movil'

/** Puntos, mandril portabrocas y lunetas (1 unidad = 10 mm). */
export function PuntosModel({ kind, tool, barD, spin }: { kind: PuntoKind; tool: 'broca' | 'mecha'; barD: number; spin: boolean }) {
  const R = barD / 20
  if (kind === 'fijo') {
    return (
      <group position={[2, 0, 0]}>
        <Part id="cono" offset={[-3, 0, 0]} labelAt={[-7, 1.9, 0]}>
          <PuntoFijoCola />
        </Part>
        <Part id="punta" offset={[0, 0, 0]} labelAt={[-0.9, 1.9, 0]}>
          <PuntoFijoPunta />
        </Part>
        <Part id="pieza" offset={[6, 0, 0]} labelAt={[4, 3.6, 0]}>
          <Spin speed={spin ? 3 : 0}>
            <Bar x0={-0.35} x1={8} r={2.5} centerL />
          </Spin>
        </Part>
      </group>
    )
  }
  if (kind === 'giratorio') {
    return (
      <group position={[3, 0, 0]}>
        <Part id="cuerpo" offset={[-4, 0, 0]} labelAt={[-7, 3.3, 0]}>
          <PuntoGiratorioCuerpo />
        </Part>
        <Part id="rodamiento-trasero" offset={[2.5, 0, 0]} labelAt={[-8.75, 3.0, 0]}>
          <PuntoGiratorioRodamientos which="a" />
        </Part>
        <Part id="rodamiento-delantero" offset={[5, 0, 0]} labelAt={[-5.2, 3.0, 0]}>
          <PuntoGiratorioRodamientos which="b" />
        </Part>
        <Part id="punta" offset={[10, 0, 0]} labelAt={[-1.5, 2.6, 0]}>
          <Spin speed={spin ? 6 : 0}>
            <PuntoGiratorioPunta />
            <mesh position={[-3.4, 1.61, 0]} material={M.hole}>
              <boxGeometry args={[0.6, 0.02, 0.25]} />
            </mesh>
          </Spin>
        </Part>
      </group>
    )
  }
  if (kind === 'mandril') {
    const g = tool === 'broca' ? 0.5 : 0.4
    return (
      <group position={[-2, 0, 0]}>
        <Part id="cono" offset={[-7, 0, 0]} labelAt={[-5, 1.8, 0]}>
          <MandrilCono />
        </Part>
        <Part id="cuerpo" offset={[0, 0, 0]} labelAt={[4.4, 3.4, 0]}>
          <MandrilCuerpo />
        </Part>
        <Part id="mordazas" offset={[5, 0, 0]} labelAt={[7, 2.4, 0]}>
          <MandrilMordazas g={g} />
        </Part>
        <Part id="llave" offset={[0, 5, 0]} labelAt={[1, 7.5, 2.5]}>
          <MandrilLlave />
        </Part>
        <Part id="herramienta" offset={[8, 0, 0]} labelAt={[14, 1.4, 0]}>
          {tool === 'broca' ? <Broca x0={6.6} r={0.5} L={13} shank={3} /> : <MechaCentrar x0={6.8} />}
        </Part>
      </group>
    )
  }
  const s = 0.42
  if (kind === 'luneta-fija') {
    return (
      <group scale={s} position={[0, -12 * s, 0]}>
        <Part id="bancada" offset={[0, 0, 0]} labelAt={[-13, -1, 17]}>
          <BedSection x0={-16} x1={16} ribStep={14} />
        </Part>
        <Part id="cuerpo" offset={[0, 0, 0]} labelAt={[0, 30.5, 0]}>
          <LunetaFijaCuerpo />
        </Part>
        {[0, 120, 240].map((d, i) => (
          <group key={d} position={[0, BED.center, 0]} rotation={[d * D, 0, 0]}>
            <Part id="patines" offset={[0, 6, 0]} noLabel={i !== 1} labelAt={[0, 17, 0]}>
              <PatinLuneta r={R} />
            </Part>
          </group>
        ))}
        <Part id="zapata" offset={[0, -6, 0]} labelAt={[0, -4.5, 14]}>
          <LunetaZapata />
        </Part>
        <Part id="bulon" offset={[0, -10, 0]} labelAt={[0, -7.5, 2]}>
          <LunetaBulon />
        </Part>
        <Part id="tuerca" offset={[0, 6, 0]} labelAt={[0, 7.5, 2]}>
          <LunetaTuerca />
        </Part>
        <Part id="pieza" offset={[22, 0, 0]} labelAt={[14, BED.center + R + 1.5, 0]}>
          <group position={[0, BED.center, 0]}>
            <Spin speed={spin ? 4 : 0}>
              <Bar x0={-14} x1={16} r={R} />
              <mesh position={[16.01, R * 0.5, 0]} rotation={[0, 0, -Math.PI / 2]} material={M.hole}>
                <cylinderGeometry args={[R * 0.12, R * 0.12, 0.02, 10]} />
              </mesh>
            </Spin>
          </group>
        </Part>
      </group>
    )
  }
  return (
    <group scale={s} position={[0, -12 * s, 0]}>
      <Part id="carro" offset={[0, -4, 0]} labelAt={[6, 4, 17]}>
        <B p={[3, 3.4, 0]} s={[22, 3.4, 30]} m={M.paint} />
        <B p={[3, 6.0, 5]} s={[8, 1.8, 16]} m={M.paintDark} />
      </Part>
      <Part id="cuerpo" offset={[0, 7, 0]} labelAt={[0, 30, -6]}>
        <LunetaMovilCuerpo />
      </Part>
      {[0, -90].map((d, i) => (
        <group key={d} position={[0, BED.center, 0]} rotation={[d * D, 0, 0]}>
          <Part id="patines" offset={[0, 5, 0]} noLabel={i !== 0} labelAt={[0, 16.5, 0]}>
            <PatinLuneta r={R} housing={7.5} />
          </Part>
        </group>
      ))}
      <Part id="tornillos" offset={[0, 12, 0]} labelAt={[0, 9.5, -7]}>
        {[-11, -6].map((z) => (
          <group key={z} position={[0, 9, z]}>
            <mesh position={[0, -1.6, 0]} material={M.steel}>
              <cylinderGeometry args={[0.6, 0.6, 4.6, 12]} />
            </mesh>
            <mesh position={[0, 0.9, 0]} material={M.steel}>
              <cylinderGeometry args={[1.05, 1.05, 0.9, 6]} />
            </mesh>
          </group>
        ))}
      </Part>
      <Part id="herramienta" offset={[0, 4, 8]} labelAt={[4, BED.center + 3, 9]}>
        <group position={[4, BED.center - HSS.S, R + HSS.head + 0.05]} rotation={[0, Math.PI / 2, 0]}>
          <IntegralCuerpo />
        </group>
      </Part>
      <Part id="pieza" offset={[22, 0, 0]} labelAt={[14, BED.center + R + 1.5, 0]}>
        <group position={[0, BED.center, 0]}>
          <Spin speed={spin ? 4 : 0}>
            <Bar x0={-14} x1={16} r={R} />
            <mesh position={[16.01, R * 0.5, 0]} rotation={[0, 0, -Math.PI / 2]} material={M.hole}>
              <cylinderGeometry args={[R * 0.12, R * 0.12, 0.02, 10]} />
            </mesh>
          </Spin>
        </group>
      </Part>
    </group>
  )
}

export type ToolKind = 'integral' | 'portainserto' | 'tronzar' | 'roscar' | 'interior' | 'moleta'

/** Herramientas de corte (1 unidad = 10 mm). Todas apuntan a +x con la cara de corte hacia arriba. */
export function HerramientasModel({ kind, angles }: { kind: ToolKind; angles: boolean }) {
  if (kind === 'integral') {
    return (
      <group position={[3, -0.8, 0]}>
        <Part id="vastago" offset={[-3, 0, 0]} labelAt={[-6, 2.3, 0]}>
          <IntegralCuerpo />
        </Part>
        {angles && (
          <>
            <Part id="cara-ataque" labelAt={[1.0, 2.2, -0.6]}>
              <IntegralCara which="ataque" />
            </Part>
            <Part id="flanco" labelAt={[1.4, 0.5, 1.4]}>
              <IntegralCara which="flanco" />
            </Part>
            <Part id="filo" labelAt={[2.0, 2.4, 1.2]}>
              <IntegralCara which="filo" />
            </Part>
            <AngulosHerramienta x={4.0} k={1.25} />
          </>
        )}
      </group>
    )
  }
  if (kind === 'portainserto') {
    const c = portaInsertCenter()
    return (
      <group position={[3, -1, 0]}>
        <Part id="cuerpo" offset={[-3, 0, 0]} labelAt={[-6, 2.8, 0]}>
          <PortainsertoCuerpo />
        </Part>
        <Part id="asiento" offset={[0, 1.6, 0]} labelAt={[c[0] + 0.6, 1.9, c[2] - 0.8]}>
          <PortainsertoAsiento />
        </Part>
        <Part id="inserto" offset={[0, 3.2, 0]} labelAt={[c[0] + 0.8, 2.6, c[2] - 1]}>
          <PortainsertoInserto />
        </Part>
        <Part id="tornillo" offset={[0, 5.2, 0]} labelAt={[c[0], 3.0, c[2]]}>
          <PortainsertoTornillo />
        </Part>
      </group>
    )
  }
  if (kind === 'tronzar') {
    return (
      <group position={[3, -1.4, 0]}>
        <Part id="portacuchilla" offset={[-4, 0, 0]} labelAt={[-5, 3.8, 0]}>
          <TronzarBloque />
        </Part>
        <Part id="cuchilla" offset={[3, 0, 0]} labelAt={[-1, 3.4, -1.15]}>
          <TronzarCuchilla />
        </Part>
        <Part id="inserto" offset={[6, 0, 0]} labelAt={[2.4, 3.6, -1.15]}>
          <TronzarInserto />
        </Part>
      </group>
    )
  }
  if (kind === 'roscar') {
    return (
      <group position={[3, -1, 0]}>
        <Part id="cuerpo" offset={[-3, 0, 0]} labelAt={[-6, 2.8, 0]}>
          <RoscarCuerpo />
        </Part>
        <Part id="asiento" offset={[0, 1.4, 0]} labelAt={[ROSCA_C[0], 1.7, ROSCA_C[2] - 1]}>
          <RoscarAsiento />
        </Part>
        <Part id="inserto" offset={[0, 2.8, 0]} labelAt={[ROSCA_C[0] + 1.2, 2.4, ROSCA_C[2]]}>
          <RoscarInserto />
          {angles && <Angulo60 />}
        </Part>
        <Part id="tornillo" offset={[0, 4.6, 0]} labelAt={[ROSCA_C[0], 2.8, ROSCA_C[2]]}>
          <RoscarTornillo />
        </Part>
      </group>
    )
  }
  if (kind === 'interior') {
    return (
      <group position={[6, 0, 0]}>
        <Part id="barra" offset={[-3, 0, 0]} labelAt={[-8, 1.6, 0]}>
          <InteriorBarra />
        </Part>
        <Part id="inserto" offset={[0, 2.4, 0]} labelAt={[1.3, 1.4, -0.6]}>
          <InteriorInserto />
        </Part>
        <Part id="tornillo" offset={[0, 4, 0]} labelAt={[1.0, 1.6, -0.45]}>
          <InteriorTornillo />
        </Part>
      </group>
    )
  }
  return (
    <group position={[3, -1, 0]}>
      <Part id="cuerpo" offset={[-3, 0, 0]} labelAt={[-5, 2.8, 0]}>
        <MoletaCuerpo />
      </Part>
      <Part id="ruedas" offset={[4, 0, 0]} labelAt={[1.6, 3.6, 0]}>
        <MoletaRuedas />
      </Part>
    </group>
  )
}
