import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { canvasTex, normalTex, rng, smoothNoise } from './segundo/soldaduraShared'

/* ------------------------------------------------------------------ */
/* Piezas compartidas por los modelos de Computación: materiales,       */
/* ventiladores de 120 mm, monitor, teclado, mouse y cables. Todo a      */
/* escala real (1 unidad = 10 cm) y con texturas generadas.             */
/* ------------------------------------------------------------------ */

export type V3 = [number, number, number]

const nS = smoothNoise(5, 18)
const nF = smoothNoise(9, 64)
/** pintura en polvo / plástico texturado de los gabinetes */
export const TEXTURE_N = normalTex(256, (x, y) => nS(x, y, 256) * 0.5 + nF(x, y, 256) * 0.5 + (((x * 7919 + y * 104729) % 89) / 89) * 0.18, 1.1, [3, 3])
/** aluminio cepillado (rayas finas en un sentido) */
export const BRUSHED_N = normalTex(256, (x, y) => Math.sin(y * 1.7 + Math.sin(x * 0.05) * 2) * 0.4 + (((y * 104729) % 53) / 53) * 0.8, 0.9, [2, 2])

const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p)

export const CM = {
  chassis: std({ color: '#1b1d21', roughness: 0.6, metalness: 0.3, normalMap: TEXTURE_N, normalScale: new THREE.Vector2(0.3, 0.3) }),
  chassisIn: std({ color: '#141518', roughness: 0.75, metalness: 0.2, normalMap: TEXTURE_N, normalScale: new THREE.Vector2(0.25, 0.25) }),
  plastic: std({ color: '#1c1d20', roughness: 0.55, metalness: 0.05, normalMap: TEXTURE_N, normalScale: new THREE.Vector2(0.15, 0.15) }),
  plasticGloss: std({ color: '#111214', roughness: 0.18, metalness: 0.1 }),
  plasticGray: std({ color: '#3a3d43', roughness: 0.5, metalness: 0.05 }),
  plasticWhite: std({ color: '#e9eaec', roughness: 0.42, metalness: 0.02, normalMap: TEXTURE_N, normalScale: new THREE.Vector2(0.1, 0.1) }),
  rubber: std({ color: '#0f0f10', roughness: 0.92 }),
  alu: std({ color: '#c8cdd3', roughness: 0.3, metalness: 0.9, normalMap: BRUSHED_N, normalScale: new THREE.Vector2(0.15, 0.15) }),
  aluDark: std({ color: '#55595f', roughness: 0.38, metalness: 0.85, normalMap: BRUSHED_N, normalScale: new THREE.Vector2(0.15, 0.15) }),
  nickel: std({ color: '#d9dce0', roughness: 0.16, metalness: 1 }),
  copper: std({ color: '#c47a4c', roughness: 0.28, metalness: 1 }),
  gold: std({ color: '#d8b15a', roughness: 0.26, metalness: 1 }),
  steel: std({ color: '#a9aeb5', roughness: 0.35, metalness: 0.85 }),
  chip: std({ color: '#141518', roughness: 0.42, metalness: 0.1 }),
  slot: std({ color: '#0d0e10', roughness: 0.5 }),
  slotGray: std({ color: '#6e737b', roughness: 0.45 }),
  ivory: std({ color: '#e8e2d0', roughness: 0.6 }),
  pcbGreen: std({ color: '#1f4d33', roughness: 0.45, metalness: 0.1 }),
  pcbBlack: std({ color: '#25272b', roughness: 0.45, metalness: 0.1 }),
  capAlu: std({ color: '#2b2f36', roughness: 0.35, metalness: 0.6 }),
  ferrite: std({ color: '#2a2b2e', roughness: 0.7 }),
  sleeve: std({ color: '#141416', roughness: 0.8, normalMap: TEXTURE_N, normalScale: new THREE.Vector2(0.8, 0.8) }),
  sataRed: std({ color: '#a51d24', roughness: 0.5 }),
  ledBlue: std({ color: '#36c2ff', emissive: '#36c2ff', emissiveIntensity: 2.5 }),
  ledGreen: std({ color: '#4ade80', emissive: '#22c55e', emissiveIntensity: 2 }),
  ledAmber: std({ color: '#fbbf24', emissive: '#f59e0b', emissiveIntensity: 2 }),
  glass: new THREE.MeshPhysicalMaterial({ color: '#6b7a88', roughness: 0.04, metalness: 0, transparent: true, opacity: 0.12, clearcoat: 1, clearcoatRoughness: 0.03, depthWrite: false, side: THREE.DoubleSide }),
}

/* ------------------------------------------------------------------ texto impreso */

/** Etiqueta de texto sobre fondo, para chips, discos y placas. */
export function useLabel(w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, deps: unknown[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => canvasTex(w, h, draw), deps)
}

/** Atenúa (deja casi transparente) todo lo que tenga adentro, sin tocar los materiales compartidos. */
const ghosts = new WeakMap<THREE.Material, THREE.Material>()
function ghostOf(m: THREE.Material) {
  let g = ghosts.get(m)
  if (!g) {
    g = m.clone()
    g.transparent = true
    g.opacity = 0.14
    g.depthWrite = false
    ghosts.set(m, g)
  }
  return g
}
export function Dim({ on, children }: { on: boolean; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  useLayoutEffect(() => {
    ref.current?.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh || Array.isArray(m.material)) return
      const ud = m.userData as { orig?: THREE.Material }
      if (on) {
        if (!ud.orig || (m.material !== ghosts.get(ud.orig) && m.material !== ud.orig)) ud.orig = m.material
        m.material = ghostOf(ud.orig)
      } else if (ud.orig) {
        if (m.material === ghosts.get(ud.orig)) m.material = ud.orig
        delete ud.orig
      }
    })
  })
  return <group ref={ref}>{children}</group>
}

/* ------------------------------------------------------------------ ventilador */

/** Aspas curvas de ventilador (superficie helicoidal con comba), eje = z local. */
function bladesGeometry(R: number, hub: number, n: number, depth: number) {
  const parts: THREE.BufferGeometry[] = []
  const S = 10
  const T = 8
  for (let b = 0; b < n; b++) {
    const pos: number[] = []
    const uv: number[] = []
    const idx: number[] = []
    for (let i = 0; i <= S; i++) {
      const s = i / S
      const rr = hub * 0.96 + (R - hub * 0.96) * s
      const chord = ((Math.PI * 2) / n) * (0.78 - 0.12 * s)
      const sweep = 0.42 * s * s
      for (let j = 0; j <= T; j++) {
        const t = j / T
        const th = (b * Math.PI * 2) / n + sweep + (t - 0.5) * chord
        const z = (0.5 - t) * depth * (0.8 - 0.35 * s) + Math.sin(t * Math.PI) * depth * 0.1
        pos.push(rr * Math.cos(th), rr * Math.sin(th), z)
        uv.push(t, s)
      }
    }
    for (let i = 0; i < S; i++)
      for (let j = 0; j < T; j++) {
        const a = i * (T + 1) + j
        const c = a + T + 1
        idx.push(a, c, a + 1, a + 1, c, c + 1)
      }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.setIndex(idx)
    g.computeVertexNormals()
    parts.push(g.toNonIndexed())
  }
  const hubG = new THREE.CylinderGeometry(hub, hub, depth * 0.8, 32, 1, false).rotateX(Math.PI / 2).toNonIndexed()
  return mergeGeometries([...parts, hubG])!
}

/** Marco cuadrado de ventilador de 120 mm, con el agujero redondo y los de los tornillos. */
function frameGeometry(s: number, depth: number) {
  const h = s / 2
  const r = s * 0.07
  const sh = new THREE.Shape()
  sh.moveTo(-h + r, -h)
  sh.lineTo(h - r, -h)
  sh.quadraticCurveTo(h, -h, h, -h + r)
  sh.lineTo(h, h - r)
  sh.quadraticCurveTo(h, h, h - r, h)
  sh.lineTo(-h + r, h)
  sh.quadraticCurveTo(-h, h, -h, h - r)
  sh.lineTo(-h, -h + r)
  sh.quadraticCurveTo(-h, -h, -h + r, -h)
  const hole = new THREE.Path()
  hole.absarc(0, 0, s * 0.475, 0, Math.PI * 2, true)
  sh.holes.push(hole)
  for (const [x, y] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    const p = new THREE.Path()
    p.absarc(x * s * 0.41, y * s * 0.41, s * 0.022, 0, Math.PI * 2, true)
    sh.holes.push(p)
  }
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelSize: s * 0.006, bevelThickness: s * 0.006, bevelSegments: 1, curveSegments: 40 })
  g.translate(0, 0, -depth / 2)
  return g
}

const geoCache = new Map<string, THREE.BufferGeometry>()
function cached(key: string, make: () => THREE.BufferGeometry) {
  let g = geoCache.get(key)
  if (!g) geoCache.set(key, (g = make()))
  return g
}

const HUB_LABEL = canvasTex(128, 128, (ctx, w, h) => {
  ctx.fillStyle = '#1a1b1e'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = '#6b7079'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(w / 2, h / 2, w * 0.38, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = '#c9ccd1'
  ctx.font = 'bold 22px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText('120 mm', w / 2, h / 2 - 2)
  ctx.font = '15px system-ui'
  ctx.fillText('DC 12V 0.20A', w / 2, h / 2 + 20)
})

/**
 * Ventilador de gabinete de 120 mm (o del tamaño que se pida). El aire pasa a lo largo del eje z local.
 * `frame = false` deja sólo el rotor (para la placa de video, que tiene su propio marco).
 */
export function Fan({ size = 1.2, depth = 0.25, on, speed = 16, frame = true, blades = 7, bladeMat }: { size?: number; depth?: number; on: boolean; speed?: number; frame?: boolean; blades?: number; bladeMat?: THREE.Material }) {
  const rotor = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (on && rotor.current) rotor.current.rotation.z -= Math.min(dt, 0.05) * speed
  })
  const R = size * 0.46
  const hub = size * 0.16
  const bl = cached(`bl${R}|${hub}|${blades}|${depth}`, () => bladesGeometry(R, hub, blades, depth * 0.72))
  const fr = cached(`fr${size}|${depth}`, () => frameGeometry(size, depth))
  return (
    <group>
      {frame && (
        <>
          <mesh geometry={fr} material={CM.plastic} castShadow />
          {/* soportes del motor, del lado de atrás */}
          {[0, 1, 2, 3].map((k) => (
            <mesh key={k} position={[Math.cos((k * Math.PI) / 2 + 0.4) * size * 0.32, Math.sin((k * Math.PI) / 2 + 0.4) * size * 0.32, -depth / 2 + 0.02]} rotation={[0, 0, (k * Math.PI) / 2 + 0.4]} material={CM.plastic}>
              <boxGeometry args={[size * 0.32, size * 0.03, 0.03]} />
            </mesh>
          ))}
          <mesh position={[0, 0, -depth / 2 + 0.03]} rotation={[Math.PI / 2, 0, 0]} material={CM.plastic}>
            <cylinderGeometry args={[hub * 1.05, hub * 1.05, 0.05, 32]} />
          </mesh>
        </>
      )}
      <group ref={rotor}>
        <mesh geometry={bl} material={bladeMat ?? BLADE} castShadow />
        <mesh position={[0, 0, depth * 0.36 + 0.002]}>
          <circleGeometry args={[hub * 0.92, 32]} />
          <meshStandardMaterial map={HUB_LABEL ?? undefined} roughness={0.5} />
        </mesh>
      </group>
    </group>
  )
}
// las aspas son una superficie sin espesor: se ven de los dos lados
const BLADE = std({ color: '#1e1f23', roughness: 0.45, metalness: 0.05, side: THREE.DoubleSide })

/* ------------------------------------------------------------------ cables */

/** Cable redondo que pasa por los puntos dados (curva suave). */
export function Cable({ pts, r = 0.04, material = CM.rubber, tension = 0.5, segments }: { pts: V3[]; r?: number; material?: THREE.Material; tension?: number; segments?: number }) {
  const geo = useMemo(() => {
    const c = new THREE.CatmullRomCurve3(
      pts.map((p) => new THREE.Vector3(...p)),
      false,
      'catmullrom',
      tension,
    )
    return new THREE.TubeGeometry(c, segments ?? Math.max(16, pts.length * 14), r, 10, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(pts), r, tension, segments])
  return <mesh geometry={geo} material={material} castShadow />
}

/** Ficha RJ45 con su capuchón, apuntando hacia -z local (hacia el equipo). */
export function Rj45({ color = '#2f6fd6' }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 0, -0.07]}>
        <boxGeometry args={[0.118, 0.08, 0.2]} />
        <meshPhysicalMaterial color="#e8f1f5" roughness={0.1} transmission={0.6} thickness={0.05} transparent opacity={0.7} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[-0.045 + i * 0.013, 0.035, -0.14]} material={CM.gold}>
          <boxGeometry args={[0.006, 0.012, 0.04]} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.08]}>
        <cylinderGeometry args={[0.05, 0.07, 0.16, 16]} />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ monitor */

/**
 * Monitor de pantalla plana: marco fino, mentón con el logo, carcasa trasera con bulto,
 * cuello inclinable y pie. La base apoya en y = 0; la pantalla queda mirando a +z.
 */
export function Monitor({ w = 5.3, h, screen, glow = 0.85, children, lift }: { w?: number; h?: number; screen?: THREE.Texture | null; glow?: number; children?: ReactNode; lift?: number }) {
  const H = h ?? (w * 9) / 16
  const bez = w * 0.008
  const chin = w * 0.028
  const T = 0.09
  const cy = lift ?? H / 2 + w * 0.16
  const neckH = cy - 0.06
  return (
    <group>
      <group position={[0, cy, 0]} rotation={[-0.06, 0, 0]}>
        {/* panel con su marco */}
        <RoundedBox args={[w + bez * 2, H + bez + chin, T]} radius={Math.min(0.03, T / 2 - 0.001)} smoothness={3} position={[0, -(chin - bez) / 2, 0]} material={CM.plastic} castShadow />
        {/* carcasa trasera con la electrónica y la fuente */}
        <RoundedBox args={[w * 0.62, H * 0.62, 0.2]} radius={0.08} smoothness={4} position={[0, -H * 0.06, -T / 2 - 0.06]} material={CM.plastic} castShadow />
        {/* vidrio de la pantalla (antirreflejo) */}
        <mesh position={[0, 0, T / 2 + 0.001]}>
          <planeGeometry args={[w, H]} />
          {screen ? (
            <meshStandardMaterial color="#000000" emissive="#ffffff" emissiveMap={screen} emissiveIntensity={glow} roughness={0.35} metalness={0} />
          ) : (
            <meshStandardMaterial color="#07080a" roughness={0.3} metalness={0.2} />
          )}
        </mesh>
        {children && <group position={[0, 0, T / 2 + 0.002]}>{children}</group>}
        {/* LED de encendido en el mentón */}
        <mesh position={[w / 2 - 0.15, -H / 2 - chin / 2, T / 2 + 0.002]} material={CM.ledBlue}>
          <circleGeometry args={[0.012, 12]} />
        </mesh>
      </group>
      {/* cuello y pie */}
      <RoundedBox args={[w * 0.07, neckH, 0.07]} radius={0.03} smoothness={3} position={[0, neckH / 2 + 0.02, -T / 2 - 0.22]} rotation={[0.08, 0, 0]} material={CM.aluDark} castShadow />
      <mesh position={[0, 0.02, -0.12]} scale={[1, 1, 0.62]} material={CM.aluDark} castShadow receiveShadow>
        <cylinderGeometry args={[w * 0.12, w * 0.13, 0.04, 48]} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ teclado */

interface Key {
  x: number
  y: number
  w: number
  h: number
  label: string
}

/** Teclado completo en español (105 teclas): fila de funciones, bloque principal, flechas y numérico. */
function keyboardLayout(): Key[] {
  const keys: Key[] = []
  const row = (y: number, x0: number, spec: string) => {
    let x = x0
    for (const tok of spec.split(' ')) {
      const [lab, ws, hs] = tok.split(':')
      const w = ws ? Number(ws) : 1
      if (lab === '_') {
        x += w
        continue
      }
      keys.push({ x, y, w, h: hs ? Number(hs) : 1, label: lab.replace(/~/g, ' ') })
      x += w
    }
  }
  row(0, 0, 'Esc _ F1 F2 F3 F4 _:0.5 F5 F6 F7 F8 _:0.5 F9 F10 F11 F12 _:0.25 ImpPt Bloq Pausa')
  row(1.5, 0, 'º 1 2 3 4 5 6 7 8 9 0 \' ¡ ⟵:2 _:0.25 Ins Inicio RePág _:0.25 Num / * -')
  row(2.5, 0, '⇥:1.5 Q W E R T Y U I O P ` + Ç:1.5 _:0.25 Supr Fin AvPág _:0.25 7 8 9 +:1:2')
  row(3.5, 0, 'Mayús:1.75 A S D F G H J K L Ñ ´ Intro:2.25 _:3.5 4 5 6')
  row(4.5, 0, '⇧:2.25 Z X C V B N M , . - ⇧:2.75 _:1.25 ↑ _:1.25 1 2 3 ⏎:1:2')
  row(5.5, 0, 'Ctrl:1.25 ⊞:1.25 Alt:1.25 ~:6.25 AltGr:1.25 ⊞:1.25 ☰:1.25 Ctrl:1.25 _:0.25 ← ↓ → _:0.25 0:2 .')
  return keys
}

const KB = keyboardLayout()
const KU = 0.19 // 19 mm entre teclas
const KB_W = 22.5 * KU
const KB_D = 6.5 * KU

const KB_LEGEND = canvasTex(2048, Math.round((2048 * KB_D) / KB_W), (ctx, w, h) => {
  ctx.clearRect(0, 0, w, h)
  const s = w / KB_W
  ctx.fillStyle = '#e8ebef'
  ctx.textBaseline = 'top'
  for (const k of KB) {
    const px = k.x * KU * s
    const py = k.y * KU * s
    const big = k.label.length === 1
    ctx.font = `${big ? 600 : 500} ${big ? 26 : 15}px system-ui, sans-serif`
    ctx.fillText(k.label, px + 0.03 * KU * s + 9, py + 0.03 * KU * s + 8)
  }
})

/** Tecla con forma: base más ancha que la superficie y la cara de arriba apenas cóncava. */
const KEYCAP = (() => {
  const g = new THREE.BoxGeometry(1, 1, 1, 4, 1, 4)
  const p = g.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < p.count; i++) {
    if (p.getY(i) > 0) {
      p.setX(i, p.getX(i) * 0.84)
      p.setZ(i, p.getZ(i) * 0.84 - 0.03)
      const r = p.getX(i) ** 2 + p.getZ(i) ** 2
      p.setY(i, 0.5 - 0.06 * (1 - r * 2))
    }
  }
  g.computeVertexNormals()
  return g
})()

const KEY_MAT = std({ color: '#1a1b1f', roughness: 0.7, metalness: 0.02, normalMap: TEXTURE_N, normalScale: new THREE.Vector2(0.1, 0.1) })

/** Teclado completo. Apoya en y = 0, mira hacia +z (el usuario). `hot` ilumina las teclas. */
export function Keyboard({ hot = false }: { hot?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const keyH = 0.075
  const top = 0.13
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const mat = new THREE.Matrix4()
    KB.forEach((k, i) => {
      const cx = -KB_W / 2 + (k.x + k.w / 2) * KU
      const cz = -KB_D / 2 + (k.y + k.h / 2) * KU
      mat.makeScale(k.w * KU - 0.022, keyH, k.h * KU - 0.022).setPosition(cx, top - keyH / 2 + 0.035, cz)
      m.setMatrixAt(i, mat)
    })
    m.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <group>
      {/* carcasa con inclinación hacia el usuario */}
      <RoundedBox args={[KB_W + 0.18, 0.08, KB_D + 0.2]} radius={0.035} smoothness={3} position={[0, 0.05, 0]} rotation={[0.04, 0, 0]} material={CM.plastic} castShadow receiveShadow />
      <mesh position={[0, 0.095, 0]} rotation={[-Math.PI / 2 + 0.04, 0, 0]} material={CM.chassisIn}>
        <planeGeometry args={[KB_W + 0.04, KB_D + 0.04]} />
      </mesh>
      <group rotation={[0.04, 0, 0]}>
        <instancedMesh ref={ref} args={[KEYCAP, KEY_MAT, KB.length]} material={hot ? KEY_HOT : KEY_MAT} castShadow />
        <mesh position={[0, top + 0.031, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[KB_W, KB_D]} />
          <meshBasicMaterial map={KB_LEGEND ?? undefined} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-2} toneMapped={false} />
        </mesh>
      </group>
      {/* LEDs de Bloq Num / Mayús */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[KB_W / 2 - 0.55 + i * 0.18, 0.096, -KB_D / 2 - 0.02]} rotation={[-Math.PI / 2, 0, 0]} material={i === 0 ? CM.ledGreen : CM.plastic}>
          <planeGeometry args={[0.05, 0.02]} />
        </mesh>
      ))}
    </group>
  )
}
const KEY_HOT = std({ color: '#b98b16', roughness: 0.5, emissive: '#f59e0b', emissiveIntensity: 0.35 })
export const KEYBOARD_SIZE = { w: KB_W + 0.18, d: KB_D + 0.2 }

/* ------------------------------------------------------------------ mouse */

const MOUSE_GEO = (() => {
  const g = new THREE.SphereGeometry(1, 48, 32)
  const p = g.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i)
    let y = p.getY(i)
    const z = p.getZ(i)
    // más ancho atrás (donde apoya la palma), más bajo adelante, base plana
    x *= 0.3 * (1 + 0.14 * -z) * (1 - 0.08 * z * z)
    y = y < 0 ? y * 0.03 : y * 0.19 * (1 - 0.32 * Math.max(0, z)) * (1 + 0.1 * Math.max(0, -z))
    p.setXYZ(i, x, y, z * 0.6)
  }
  g.computeVertexNormals()
  return g
})()

/** Mouse óptico de 12 cm: dos botones, ruedita de goma y patines. Apoya en y = 0 y apunta a -z. */
export function Mouse() {
  return (
    <group>
      <mesh geometry={MOUSE_GEO} material={CM.plastic} castShadow position={[0, 0.02, 0]} rotation={[0, Math.PI, 0]} />
      {/* separación entre los dos botones */}
      <mesh position={[0, 0.17, -0.3]} rotation={[-0.25, 0, 0]} material={CM.slot}>
        <boxGeometry args={[0.012, 0.03, 0.34]} />
      </mesh>
      {/* ruedita */}
      <mesh position={[0, 0.2, -0.24]} rotation={[0, 0, Math.PI / 2]} material={CM.rubber}>
        <cylinderGeometry args={[0.045, 0.045, 0.035, 20]} />
      </mesh>
      {/* cable */}
      <Cable pts={[[0, 0.04, -0.6], [0, 0.03, -0.9], [0.15, 0.02, -1.4], [0.1, 0.02, -2.0]]} r={0.018} />
    </group>
  )
}

/* ------------------------------------------------------------------ placa impresa */

/** Dibuja pistas de cobre (líneas finas paralelas con codos a 45°) en un canvas de placa. */
export function drawTraces(ctx: CanvasRenderingContext2D, w: number, h: number, n: number, seed: number, color = 'rgba(70,120,90,0.55)') {
  const r = rng(seed)
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  for (let i = 0; i < n; i++) {
    const x = r() * w
    const y = r() * h
    const k = 2 + Math.floor(r() * 7)
    const sp = 6
    const dir = r() < 0.5
    const segs = 2 + Math.floor(r() * 3)
    ctx.lineWidth = 1.6
    for (let j = 0; j < k; j++) {
      ctx.beginPath()
      let cx = x + (dir ? 0 : j * sp)
      let cy = y + (dir ? j * sp : 0)
      ctx.moveTo(cx, cy)
      for (let s = 0; s < segs; s++) {
        const L = 30 + r() * 140
        const a = Math.floor(r() * 8) * (Math.PI / 4)
        cx += Math.cos(a) * L
        cy += Math.sin(a) * L
        ctx.lineTo(cx, cy)
      }
      ctx.stroke()
    }
  }
  // vías
  ctx.fillStyle = 'rgba(180,170,120,0.6)'
  for (let i = 0; i < n * 3; i++) {
    ctx.beginPath()
    ctx.arc(r() * w, r() * h, 2.2, 0, Math.PI * 2)
    ctx.fill()
  }
}
