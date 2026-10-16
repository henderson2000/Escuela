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
/* Potenciómetro rotativo de 16 mm (1 unidad = 10 mm)                  */
/* ------------------------------------------------------------------ */

const POT_R = 0.8

export function PotentiometerModel({ angle }: { angle: number }) {
  const sweep = (300 * Math.PI) / 180
  // ángulo 0 = extremo del terminal 1; los terminales salen hacia adelante (+z)
  const rot = ((240 - angle) * Math.PI) / 180
  const trackGeo = useMemo(() => {
    const g = new THREE.RingGeometry(0.36, 0.62, 64, 1, 0, sweep)
    g.rotateX(-Math.PI / 2)
    g.rotateY(-Math.PI / 3) // la abertura de 60° queda hacia los terminales
    return g
  }, [sweep])
  const shaftGeo = useMemo(() => gearGeometry(18, 0.3, 1.1, 0, 0.9), [])
  const canGeo = useMemo(
    () =>
      latheGeometry([
        [POT_R, 0.12],
        [POT_R, 0.6],
        [POT_R - 0.03, 0.64],
        [0.36, 0.64],
      ]),
    [],
  )
  const threadRings = Array.from({ length: 8 }, (_, i) => 0.7 + i * 0.07)
  const base = useCanvasTexture(
    512,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#2b2118'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#e8e2d0'
      ctx.font = 'bold 64px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('B10K', w / 2, h / 2)
    },
    [],
  )

  return (
    <group position={[0, -0.5, 0]}>
      <Part id="base" offset={[0, -0.9, 0]} labelAt={[1.0, 0.05, 0]}>
        <mesh position={[0, 0.06, 0]} castShadow>
          <cylinderGeometry args={[POT_R - 0.01, POT_R - 0.01, 0.12, 64]} />
          <meshStandardMaterial map={base} color="#5a4636" roughness={0.75} />
        </mesh>
      </Part>
      <Part id="pista" offset={[0, 0.7, 0]} labelAt={[-1.0, 0.3, 0]}>
        <mesh geometry={trackGeo} position={[0, 0.125, 0]}>
          <meshStandardMaterial color="#1e1a17" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
      </Part>
      <Part id="cursor" offset={[0, 1.3, 0]} labelAt={[0.6, 0.45, 0.4]}>
        <group position={[0, 0.2, 0]} rotation={[0, rot, 0]}>
          <mesh position={[0.25, 0, 0]}>
            <boxGeometry args={[0.5, 0.03, 0.16]} />
            <meshStandardMaterial {...metal} color="#d8b46a" />
          </mesh>
          {[-0.04, 0.04].map((z) => (
            <mesh key={z} position={[0.5, -0.04, z]} rotation={[0, 0, -0.5]}>
              <boxGeometry args={[0.12, 0.015, 0.03]} />
              <meshStandardMaterial {...metal} color="#d8b46a" />
            </mesh>
          ))}
        </group>
      </Part>
      <Part id="carcasa" offset={[0, 2.0, 0]} labelAt={[1.05, 0.5, 0]}>
        <mesh geometry={canGeo}>
          <meshStandardMaterial {...metal} roughness={0.35} side={THREE.DoubleSide} />
        </mesh>
        {/* pestaña anti-giro y lengüetas que muerden la base */}
        <mesh position={[-0.55, 0.72, 0]}>
          <boxGeometry args={[0.08, 0.16, 0.2]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((a) => (
          <mesh key={a} position={[Math.cos(a) * (POT_R + 0.01), 0.08, Math.sin(a) * (POT_R + 0.01)]} rotation={[0, -a, 0]}>
            <boxGeometry args={[0.03, 0.18, 0.16]} />
            <meshStandardMaterial {...metal} />
          </mesh>
        ))}
        {/* buje roscado M7 con tuerca */}
        <mesh position={[0, 0.98, 0]}>
          <cylinderGeometry args={[0.33, 0.33, 0.68, 40]} />
          <meshStandardMaterial {...metal} color="#c3c6cb" roughness={0.35} />
        </mesh>
        {threadRings.map((y) => (
          <mesh key={y} position={[0, y + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.335, 0.018, 6, 40]} />
            <meshStandardMaterial {...metal} color="#c3c6cb" roughness={0.35} />
          </mesh>
        ))}
        <mesh position={[0, 0.72, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 0.14, 6]} />
          <meshStandardMaterial {...metal} roughness={0.3} />
        </mesh>
      </Part>
      <Part id="eje" offset={[0, 3.0, 0]} labelAt={[0.55, 2.2, 0]}>
        <group rotation={[0, rot, 0]}>
          <mesh geometry={shaftGeo} position={[0, 1.32, 0]} castShadow>
            <meshStandardMaterial color="#d3d6db" metalness={0.9} roughness={0.3} flatShading />
          </mesh>
          <mesh position={[0, 1.33, 0]}>
            <cylinderGeometry args={[0.27, 0.27, 0.02, 30]} />
            <meshStandardMaterial color="#d3d6db" metalness={0.9} roughness={0.3} />
          </mesh>
          {/* ranura para destornillador: marca hacia dónde apunta */}
          <mesh position={[0, 2.43, 0]}>
            <boxGeometry args={[0.62, 0.02, 0.07]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh position={[0.2, 2.435, 0]}>
            <boxGeometry args={[0.2, 0.02, 0.04]} />
            <meshStandardMaterial color="#e33" />
          </mesh>
        </group>
      </Part>
      <Part id="terminales" offset={[0, -1.2, 0.6]} labelAt={[0.9, -1.4, 1.1]}>
        {[-0.5, 0, 0.5].map((x) => (
          <group key={x}>
            {/* lengüeta plana con agujero, que sale de la base y baja */}
            <mesh position={[x, 0.06, POT_R + 0.12]}>
              <boxGeometry args={[0.2, 0.04, 0.3]} />
              <meshStandardMaterial {...tinned} />
            </mesh>
            <mesh position={[x, 0.08, POT_R + 0.16]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.03, 0.06, 16]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            <Wire points={[[x, 0.06, POT_R + 0.27], [x, -0.05, POT_R + 0.3], [x, -1.4, POT_R + 0.3]]} radius={0.04} square smooth={0.2} {...tinned} />
          </group>
        ))}
        <Label position={[-0.5, -1.6, POT_R + 0.3]} center style={{ pointerEvents: 'none' }}>
          <div className="pin-tag">1</div>
        </Label>
        <Label position={[0, -1.6, POT_R + 0.3]} center style={{ pointerEvents: 'none' }}>
          <div className="pin-tag">2 (cursor)</div>
        </Label>
        <Label position={[0.5, -1.6, POT_R + 0.3]} center style={{ pointerEvents: 'none' }}>
          <div className="pin-tag">3</div>
        </Label>
      </Part>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Pulsador táctil 6 × 6 × 5 mm (modelado en mm y escalado)            */
/* ------------------------------------------------------------------ */

export function ButtonModel({ pressed }: { pressed: boolean }) {
  const cap = useRef<THREE.Group>(null)
  const dome = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (cap.current) cap.current.position.y += ((pressed ? -0.3 : 0) - cap.current.position.y) * 0.3
    if (dome.current) dome.current.scale.y += ((pressed ? 0.3 : 1) - dome.current.scale.y) * 0.3
  })
  const plateGeo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-3, -3)
    s.lineTo(3, -3)
    s.lineTo(3, 3)
    s.lineTo(-3, 3)
    s.closePath()
    const h = new THREE.Path()
    h.absarc(0, 0, 1.85, 0, Math.PI * 2, true)
    s.holes.push(h)
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: false, curveSegments: 32 })
    g.rotateX(-Math.PI / 2)
    return g
  }, [])
  const legPts = (sx: number, sz: number): [number, number, number][] => [
    [sx * 2.9, 0.6, sz * 2.25],
    [sx * 3.4, 0.6, sz * 2.25],
    [sx * 3.45, 0.2, sz * 2.25],
    [sx * 3.25, -0.6, sz * 2.25],
    [sx * 3.25, -1.1, sz * 2.25],
    [sx * 3.4, -1.5, sz * 2.25],
    [sx * 3.25, -1.9, sz * 2.25],
    [sx * 3.25, -3.4, sz * 2.25],
  ]

  return (
    <group scale={0.36} position={[0, -0.6, 0]}>
      <Part id="base" offset={[0, -1.5, 0]} labelAt={[3.6, 1.2, 2]}>
        <mesh position={[0, 1.75, 0]} castShadow>
          <boxGeometry args={[6, 3.5, 6]} />
          <meshStandardMaterial color="#141414" roughness={0.55} />
        </mesh>
        {/* patitas de apoyo en las esquinas */}
        {[
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ].map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x * 2.5, -0.15, z * 2.5]}>
            <boxGeometry args={[0.8, 0.3, 0.8]} />
            <meshStandardMaterial color="#141414" roughness={0.6} />
          </mesh>
        ))}
      </Part>
      <Part id="contactos" offset={[0, 1.2, 0]} labelAt={[-3.4, 3.4, 1]}>
        <mesh position={[0, 3.45, 0]}>
          <boxGeometry args={[4.6, 0.12, 0.9]} />
          <meshStandardMaterial {...metal} color={pressed ? '#9dffb0' : '#cfd2d6'} />
        </mesh>
        <mesh ref={dome} position={[0, 3.5, 0]}>
          <sphereGeometry args={[1.6, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2.6]} />
          <meshStandardMaterial {...metal} side={THREE.DoubleSide} />
        </mesh>
      </Part>
      <Part id="tapa" offset={[0, 2.8, 0]} labelAt={[3.4, 3.8, -2]}>
        <mesh geometry={plateGeo} position={[0, 3.5, 0]}>
          <meshStandardMaterial {...metal} roughness={0.3} />
        </mesh>
        {/* lengüetas dobladas que sujetan la tapa al cuerpo */}
        {[-1, 1].map((sx) =>
          [-1, 1].map((sz) => (
            <mesh key={`${sx}${sz}`} position={[sx * 3.05, 2.9, sz * 1.6]}>
              <boxGeometry args={[0.15, 1.3, 1.2]} />
              <meshStandardMaterial {...metal} roughness={0.3} />
            </mesh>
          )),
        )}
      </Part>
      <Part id="boton" offset={[0, 4.6, 0]} labelAt={[2.2, 5.6, 0]}>
        <group ref={cap}>
          <mesh position={[0, 4.3, 0]}>
            <cylinderGeometry args={[1.75, 1.8, 1.5, 40]} />
            <meshStandardMaterial color="#1c1c1c" roughness={0.45} />
          </mesh>
          <mesh position={[0, 5.05, 0]} scale={[1, 0.12, 1]}>
            <sphereGeometry args={[1.75, 40, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#1c1c1c" roughness={0.45} />
          </mesh>
        </group>
      </Part>
      <Part id="terminales" offset={[0, -2.5, 0]} labelAt={[4.2, -2.4, 2.4]}>
        {[
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ].map(([sx, sz]) => (
          <Wire key={`${sx}${sz}`} points={legPts(sx, sz)} radius={0.3} square smooth={0.15} {...tinned} />
        ))}
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
