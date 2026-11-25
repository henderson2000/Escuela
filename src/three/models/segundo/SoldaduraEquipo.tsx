import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Part, type Vec3 } from '../../Part'
import { useCanvasTexture } from '../../helpers'
import { useKeepRendering } from '../../keepRendering'
import { GLOW, HOT_GRAD, MILL_TEX, PLASTIC_N, POWDER_N, beadGeometry, blotch, canvasTex, drawPlate, rng, speckle } from './soldaduraShared'

/* ------------------------------------------------------------------ */
/* Puesto de soldadura por arco con electrodo revestido.               */
/* Se dibuja en escala real (1 unidad = 10 cm, el piso en y = 0) y     */
/* después se achica para que entre en el visor.                       */
/* ------------------------------------------------------------------ */

export interface EquipoParams {
  amperaje: number
  encendido: boolean
  soldando: boolean
}

const v3 = (a: Vec3) => new THREE.Vector3(...a)

/* ================================================================== materiales */

const std = (color: string, metalness: number, roughness: number, extra: THREE.MeshPhysicalMaterialParameters = {}) =>
  new THREE.MeshPhysicalMaterial({ color, metalness, roughness, ...extra })

// mesa: hierro negro con salpicaduras y óxido
const TABLE_TEX = canvasTex(
  512,
  512,
  (ctx, w, h) => {
    ctx.fillStyle = '#6c6f74'
    ctx.fillRect(0, 0, w, h)
    blotch(ctx, w, h, 40, 'rgba(120,66,30,0.4)', 60, 3)
    blotch(ctx, w, h, 30, 'rgba(20,20,22,0.45)', 50, 5)
    speckle(ctx, w, h, 26, 7)
    // salpicaduras pegadas: puntitos claros con sombra
    const r = rng(11)
    for (let i = 0; i < 420; i++) {
      const x = r() * w
      const y = r() * h
      const s = 0.8 + r() * 2.2
      ctx.fillStyle = 'rgba(15,15,15,0.6)'
      ctx.beginPath()
      ctx.arc(x + 0.8, y + 0.8, s, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = `rgba(${150 + r() * 60},${150 + r() * 50},${150 + r() * 40},0.9)`
      ctx.beginPath()
      ctx.arc(x, y, s * 0.8, 0, Math.PI * 2)
      ctx.fill()
    }
  },
  [1, 1],
)

const MAT = {
  table: std('#c3c6ca', 0.55, 0.6, { map: TABLE_TEX ?? undefined }),
  tableDark: std('#a3a6ab', 0.55, 0.58, { map: TABLE_TEX ?? undefined }),
  mill: std('#e3e6ea', 0.6, 0.55, { map: MILL_TEX ?? undefined }),
  bead: std('#a9adb3', 0.85, 0.36),
  slag: std('#2d2a27', 0.1, 0.22, { clearcoat: 0.9, clearcoatRoughness: 0.15 }),
  case: std('#1f5aa8', 0.25, 0.42, { clearcoat: 0.25, clearcoatRoughness: 0.5, normalMap: POWDER_N ?? undefined, normalScale: new THREE.Vector2(0.35, 0.35) }),
  bezel: std('#1b1c1f', 0.05, 0.55, { normalMap: PLASTIC_N ?? undefined, normalScale: new THREE.Vector2(0.3, 0.3) }),
  rubber: std('#151515', 0, 0.72),
  cable: std('#121212', 0, 0.55, { clearcoat: 0.2, clearcoatRoughness: 0.6 }),
  brass: std('#c9a24d', 0.95, 0.3),
  copper: std('#c27a4a', 0.95, 0.32),
  zinc: std('#b9bec4', 0.9, 0.35),
  steel: std('#c4c8cd', 0.92, 0.3),
  dark: std('#0b0b0c', 0.2, 0.8),
  red: std('#b91c1c', 0.05, 0.45),
  yellow: std('#e3b20f', 0.05, 0.45),
  wood: std('#9a6a3c', 0, 0.7),
  flux: std('#cbbf9f', 0, 0.9),
  white: std('#e8e8e8', 0, 0.5),
}

/* ================================================================== arco */

/** Arco eléctrico: resplandor, luz que parpadea, chispas con trayectoria y humo. `u` = tamaño (1 = 10 cm). */
function Arc({ power, u = 1 }: { power: number; u?: number }) {
  const core = useRef<THREE.Mesh>(null)
  const glow = useRef<THREE.Sprite>(null)
  const halo = useRef<THREE.Sprite>(null)
  const light = useRef<THREE.PointLight>(null)
  const warm = useRef<THREE.PointLight>(null)
  const sparks = useRef<THREE.InstancedMesh>(null)
  const smoke = useRef<THREE.Group>(null)
  const N = 48
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const seeds = useMemo(() => {
    const r = rng(29)
    return Array.from({ length: N }, () => {
      const a = r() * Math.PI * 2
      const sp = 0.6 + r() * 1.4
      return { vx: Math.cos(a) * sp * 1.2 + 0.4, vz: Math.sin(a) * sp, vy: 0.8 + r() * 1.6, life: 0.35 + r() * 0.5, off: r() }
    })
  }, [])
  useKeepRendering(true)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const f = 0.8 + Math.sin(t * 61) * 0.1 + Math.sin(t * 23.7) * 0.08 + Math.sin(t * 7.3) * 0.05
    core.current?.scale.setScalar(f)
    glow.current?.scale.setScalar(u * 1.1 * f * (0.7 + power * 0.5))
    halo.current?.scale.setScalar(u * 4 * (0.85 + 0.15 * f) * (0.6 + power * 0.4))
    if (light.current) light.current.intensity = 7 * power * f
    if (warm.current) warm.current.intensity = 1.2 * power * (0.9 + 0.1 * Math.sin(t * 13))
    const m = sparks.current
    if (m) {
      const g = 4.2
      seeds.forEach((s, i) => {
        const k = ((t / s.life + s.off) % 1) * s.life
        const vx = s.vx * power
        const vy = s.vy * power
        const vz = s.vz * power
        const p = new THREE.Vector3(vx * k, vy * k - 0.5 * g * k * k, vz * k).multiplyScalar(u)
        const v = new THREE.Vector3(vx, vy - g * k, vz)
        dummy.position.copy(p)
        dummy.lookAt(p.clone().add(v))
        const len = Math.min(0.12, v.length() * 0.035) * u
        const fade = 1 - k / s.life
        dummy.scale.set(fade, fade, len / (0.01 * u))
        dummy.updateMatrix()
        m.setMatrixAt(i, dummy.matrix)
      })
      m.instanceMatrix.needsUpdate = true
    }
    smoke.current?.children.forEach((c, i) => {
      const k = (t * 0.35 + i / 6) % 1
      c.position.set(Math.sin(i * 2.1 + t * 0.6) * 0.15 * u * k, (0.1 + k * 2.4) * u, Math.cos(i * 1.7) * 0.1 * u * k)
      c.scale.setScalar(u * (0.25 + k * 1.1))
      ;((c as THREE.Sprite).material as THREE.SpriteMaterial).opacity = 0.16 * Math.sin(k * Math.PI)
    })
  })
  return (
    <group>
      <mesh ref={core}>
        <sphereGeometry args={[0.035 * u, 16, 12]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <sprite ref={glow}>
        <spriteMaterial map={GLOW ?? undefined} color="#dff4ff" blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
      <sprite ref={halo}>
        <spriteMaterial map={GLOW ?? undefined} color="#5fb4ff" opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
      <pointLight ref={light} color="#d6efff" distance={60 * u} decay={1.2} position={[0, 0.9 * u, 0.2 * u]} />
      <pointLight ref={warm} color="#ff8a3d" distance={6 * u} decay={2} position={[0, 0.08 * u, 0]} />
      <instancedMesh ref={sparks} args={[undefined, undefined, N]} frustumCulled={false}>
        <boxGeometry args={[0.006 * u, 0.006 * u, 0.01 * u]} />
        <meshBasicMaterial color="#ffd27a" toneMapped={false} />
      </instancedMesh>
      <group ref={smoke}>
        {Array.from({ length: 6 }, (_, i) => (
          <sprite key={i}>
            <spriteMaterial map={GLOW ?? undefined} color="#9ca3af" transparent opacity={0.1} depthWrite={false} />
          </sprite>
        ))}
      </group>
      {/* charco de fusión */}
      <mesh position={[0, -0.028 * u, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.25, 1, 1]}>
        <circleGeometry args={[0.055 * u, 24]} />
        <meshBasicMaterial color="#ffe08a" toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ================================================================== mesa de soldar */

const TABLE = { w: 10, d: 6, h: 8.5 }

function Mesa() {
  const { w, d, h } = TABLE
  const tube = 0.4
  const bars = Math.round(w / 0.55)
  return (
    <group>
      {/* planchuelas de canto: por las ranuras caen las chispas y la escoria */}
      {Array.from({ length: bars }, (_, i) => (
        <mesh key={i} position={[-w / 2 + tube + 0.15 + (i * (w - 2 * tube - 0.3)) / (bars - 1), h - 0.25, 0]} material={MAT.table} castShadow receiveShadow>
          <boxGeometry args={[0.1, 0.5, d - 2 * tube]} />
        </mesh>
      ))}
      {/* marco de caño estructural */}
      {[-1, 1].map((s) => (
        <mesh key={`fz${s}`} position={[0, h - tube / 2, s * (d / 2 - tube / 2)]} material={MAT.tableDark} castShadow receiveShadow>
          <boxGeometry args={[w, tube, tube]} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`fx${s}`} position={[s * (w / 2 - tube / 2), h - tube / 2, 0]} material={MAT.tableDark} castShadow receiveShadow>
          <boxGeometry args={[tube, tube, d - 2 * tube]} />
        </mesh>
      ))}
      {/* patas, travesaños y regatones */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <group key={`${sx}${sz}`} position={[sx * (w / 2 - tube / 2 - 0.1), 0, sz * (d / 2 - tube / 2 - 0.1)]}>
            <mesh position={[0, (h - tube) / 2 + 0.06, 0]} material={MAT.tableDark} castShadow>
              <boxGeometry args={[tube, h - tube - 0.12, tube]} />
            </mesh>
            <mesh position={[0, 0.04, 0]} material={MAT.rubber}>
              <cylinderGeometry args={[0.28, 0.3, 0.08, 20]} />
            </mesh>
          </group>
        )),
      )}
      {[-1, 1].map((sz) => (
        <mesh key={`rx${sz}`} position={[0, 1.6, sz * (d / 2 - tube / 2 - 0.1)]} material={MAT.tableDark} castShadow>
          <boxGeometry args={[w - 0.4, 0.3, 0.3]} />
        </mesh>
      ))}
      {[-1, 1].map((sx) => (
        <mesh key={`rz${sx}`} position={[sx * (w / 2 - tube / 2 - 0.1), 1.6, 0]} material={MAT.tableDark} castShadow>
          <boxGeometry args={[0.3, 0.3, d - 0.4]} />
        </mesh>
      ))}
      {/* bandeja de abajo, donde se juntan las colillas */}
      <mesh position={[0, 1.78, 0]} material={MAT.tableDark} receiveShadow>
        <boxGeometry args={[w - 0.6, 0.05, d - 0.6]} />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => {
        const r = rng(40 + i)
        return (
          <group key={i} position={[-3 + r() * 6, 1.83, -2 + r() * 4]} rotation={[0, r() * 6, Math.PI / 2]}>
            <mesh material={MAT.flux}>
              <cylinderGeometry args={[0.025, 0.025, 0.35 + r() * 0.3, 8]} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

/* ================================================================== máquina inverter */

const MACH = { w: 2.4, h: 3.8, d: 5, x: -8.2, z: 0.4 }
const ampAngle = (a: number) => Math.PI * 0.75 + ((a - 40) / 160) * Math.PI * 1.5
/** posición del enchufe Dinse (+ porta electrodo a la derecha, − masa a la izquierda), en coordenadas del mundo */
const socket = (s: 1 | -1): THREE.Vector3 => new THREE.Vector3(MACH.x + s * 0.62, 0.14 + MACH.h / 2 - 1.15, MACH.z + MACH.d / 2 + 0.25)

function Maquina({ amperaje, encendido }: { amperaje: number; encendido: boolean }) {
  const { w, h, d } = MACH
  const PW = 2.1
  const PH = 3.5
  const k = 200 // píxeles por unidad
  const panel = useCanvasTexture(
    PW * k,
    PH * k,
    (ctx, W, H) => {
      ctx.fillStyle = '#222428'
      ctx.fillRect(0, 0, W, H)
      speckle(ctx, W, H, 8, 3)
      const X = (x: number) => W / 2 + x * k
      const Y = (y: number) => H / 2 - y * k
      // banda de color de arriba
      ctx.fillStyle = '#1f5aa8'
      ctx.fillRect(0, 0, W, 0.34 * k)
      ctx.fillStyle = '#fff'
      ctx.font = `800 ${0.2 * k}px system-ui, sans-serif`
      ctx.textBaseline = 'middle'
      ctx.fillText('MMA 200', 0.12 * k, 0.17 * k)
      ctx.font = `600 ${0.09 * k}px system-ui, sans-serif`
      ctx.textAlign = 'right'
      ctx.fillText('INVERTER DC', W - 0.12 * k, 0.17 * k)
      // ventana del display
      ctx.fillStyle = '#0a0a0b'
      ctx.fillRect(X(-0.75), Y(1.42), 1.0 * k, 0.46 * k)
      ctx.textAlign = 'center'
      ctx.fillStyle = '#c9ccd1'
      ctx.font = `600 ${0.075 * k}px system-ui, sans-serif`
      ctx.fillText('CORRIENTE (A)', X(-0.25), Y(0.88))
      ctx.textAlign = 'left'
      ctx.fillText('ON', X(0.56), Y(1.3))
      ctx.fillText('⚠ TEMP', X(0.56), Y(1.06))
      // escala alrededor de la perilla
      const cx = X(0)
      const cy = Y(0.3)
      ctx.strokeStyle = '#d4d7db'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(cx, cy, 0.62 * k, Math.PI * 0.75, Math.PI * 2.25)
      ctx.stroke()
      ctx.fillStyle = '#e5e7eb'
      ctx.font = `700 ${0.085 * k}px system-ui, sans-serif`
      ctx.textAlign = 'center'
      for (let a = 40; a <= 200; a += 10) {
        const an = ampAngle(a)
        const big = a % 40 === 0
        const r0 = 0.62 * k
        const r1 = (big ? 0.71 : 0.67) * k
        ctx.lineWidth = big ? 4 : 2
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0)
        ctx.lineTo(cx + Math.cos(an) * r1, cy + Math.sin(an) * r1)
        ctx.stroke()
        if (big) ctx.fillText(String(a), cx + Math.cos(an) * 0.83 * k, cy + Math.sin(an) * 0.83 * k)
      }
      // triángulo de "más corriente"
      ctx.fillStyle = '#e3b20f'
      ctx.beginPath()
      ctx.moveTo(X(-0.35), Y(-0.48))
      ctx.lineTo(X(0.35), Y(-0.38))
      ctx.lineTo(X(0.35), Y(-0.48))
      ctx.fill()
      // bornes
      ctx.font = `900 ${0.26 * k}px system-ui, sans-serif`
      ctx.fillStyle = '#e5e7eb'
      ctx.fillText('−', X(-0.62), Y(-0.72))
      ctx.fillStyle = '#ef4444'
      ctx.fillText('+', X(0.62), Y(-0.72))
      // advertencia
      ctx.fillStyle = '#e3b20f'
      ctx.beginPath()
      ctx.moveTo(X(0), Y(-1.42))
      ctx.lineTo(X(0.13), Y(-1.64))
      ctx.lineTo(X(-0.13), Y(-1.64))
      ctx.fill()
      ctx.fillStyle = '#111'
      ctx.font = `900 ${0.15 * k}px system-ui, sans-serif`
      ctx.fillText('!', X(0), Y(-1.56))
    },
    [],
  )
  const display = useCanvasTexture(
    256,
    112,
    (ctx, W, H) => {
      ctx.fillStyle = '#100405'
      ctx.fillRect(0, 0, W, H)
      ctx.font = 'bold 84px "Courier New", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#2a0b0c'
      ctx.fillText('888', W / 2, H / 2 + 4)
      if (encendido) {
        ctx.fillStyle = '#ff3b30'
        ctx.shadowColor = '#ff3b30'
        ctx.shadowBlur = 12
        ctx.fillText(String(amperaje).padStart(3, ' '), W / 2, H / 2 + 4)
      }
    },
    [amperaje, encendido],
  )
  const plate = useCanvasTexture(
    256,
    320,
    (ctx, W, H) => {
      ctx.fillStyle = '#e9e9e6'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#111'
      ctx.font = 'bold 22px system-ui'
      ctx.fillText('DATOS TÉCNICOS', 16, 34)
      ctx.font = '16px system-ui'
      const rows = ['Entrada: 220 V ~ 50 Hz', 'Consumo máx.: 7,2 kVA', 'Tensión en vacío: 68 V', 'Corriente: 20 – 200 A', 'Ciclo de trabajo: 60 % a 160 A', 'Electrodos: 1,6 – 4 mm', 'Protección: IP21S', 'Clase de aislación: F']
      rows.forEach((r, i) => ctx.fillText(r, 16, 72 + i * 28))
      ctx.strokeStyle = '#111'
      ctx.lineWidth = 2
      ctx.strokeRect(6, 6, W - 12, H - 12)
    },
    [],
  )
  const ang = ampAngle(amperaje)
  const cy = 0.14 + h / 2
  const front = d / 2 + 0.25
  return (
    <group position={[MACH.x, 0, MACH.z]}>
      <Part id="maquina" offset={[-2, 0, 0]} labelAt={[0, h + 1.2, 0]}>
        <group position={[0, cy, 0]}>
          {/* gabinete de chapa pintada */}
          <RoundedBox args={[w, h, d - 0.6]} radius={0.08} smoothness={3} material={MAT.case} castShadow receiveShadow />
          {/* marcos de plástico de adelante y de atrás (también son las patas) */}
          {[-1, 1].map((s) => (
            <RoundedBox key={s} args={[w + 0.2, h + 0.2, 0.5]} radius={0.14} smoothness={4} position={[0, 0, s * (d / 2 - 0.25)]} material={MAT.bezel} castShadow />
          ))}
          {/* frente */}
          <mesh position={[0, 0, front + 0.001]}>
            <planeGeometry args={[PW, PH]} />
            <meshStandardMaterial map={panel} roughness={0.6} />
          </mesh>
          {/* rejillas de ventilación de los costados */}
          {[-1, 1].map((s) =>
            Array.from({ length: 9 }, (_, i) =>
              [-1, 1].map((c) => (
                <mesh key={`${s}${i}${c}`} position={[s * (w / 2 + 0.002), -1.1 + i * 0.26, c * 0.85]} rotation={[0, (s * Math.PI) / 2, 0]} material={MAT.dark}>
                  <planeGeometry args={[1.2, 0.07]} />
                </mesh>
              )),
            ),
          )}
          {/* placa de datos */}
          <mesh position={[w / 2 + 0.003, 0.9, 1.35]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.8, 1.0]} />
            <meshStandardMaterial map={plate} roughness={0.5} />
          </mesh>
          {/* manija de arriba */}
          <ManijaTop h={h} d={d} />
          {/* atrás: rejilla del ventilador, llave de encendido y cable de alimentación */}
          <group position={[0, 0, -front - 0.001]} rotation={[0, Math.PI, 0]}>
            {[0.18, 0.32, 0.46, 0.6].map((r) => (
              <mesh key={r} position={[0, 0.5, 0.02]} material={MAT.dark}>
                <torusGeometry args={[r, 0.025, 6, 40]} />
              </mesh>
            ))}
            <mesh position={[0, 0.5, 0.005]} material={MAT.dark}>
              <circleGeometry args={[0.66, 40]} />
            </mesh>
            <mesh position={[0, 0.5, 0.03]} material={MAT.bezel}>
              <cylinderGeometry args={[0.1, 0.1, 0.04, 16]} />
            </mesh>
            <mesh position={[0.55, 1.35, 0.06]} material={MAT.dark}>
              <boxGeometry args={[0.36, 0.5, 0.06]} />
            </mesh>
            <mesh position={[0.55, 1.35, 0.11]} rotation={[encendido ? -0.25 : 0.25, 0, 0]} material={encendido ? MAT.red : MAT.bezel}>
              <boxGeometry args={[0.26, 0.4, 0.08]} />
            </mesh>
            <mesh position={[-0.6, -1.25, 0.12]} rotation={[Math.PI / 2, 0, 0]} material={MAT.bezel}>
              <cylinderGeometry args={[0.1, 0.14, 0.3, 14]} />
            </mesh>
          </group>
        </group>
        <CableTubo
          pts={[
            [0.6, cy - 1.25, -front - 0.3],
            [0.65, cy - 1.6, -front - 0.8],
            [0.8, 0.07, -front - 1.4],
            [1.6, 0.07, -front - 2.2],
            [3.2, 0.07, -front - 2.0],
          ]}
          r={0.05}
        />
        {/* bornes Dinse con las fichas enchufadas */}
        {([-1, 1] as const).map((s) => (
          <group key={s} position={[s * 0.62, cy - 1.15, front]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.03]} material={MAT.bezel}>
              <cylinderGeometry args={[0.26, 0.28, 0.06, 28]} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.065]} material={MAT.brass}>
              <torusGeometry args={[0.12, 0.02, 8, 24]} />
            </mesh>
            <FichaDinse color={s === 1 ? MAT.red : MAT.bezel} />
          </group>
        ))}
      </Part>
      <Part id="regulador" offset={[0, 0, 2]} labelAt={[0, cy + 0.3, front + 0.6]}>
        <group position={[0, cy, front]}>
          {/* display */}
          <mesh position={[-0.25, 1.19, 0.012]}>
            <planeGeometry args={[0.9, 0.38]} />
            <meshStandardMaterial map={display} emissiveMap={display} emissive={encendido ? '#ffffff' : '#000000'} emissiveIntensity={encendido ? 1.6 : 0} roughness={0.15} toneMapped={false} />
          </mesh>
          {/* leds de encendido y de temperatura */}
          {[
            [1.3, '#22c55e', encendido],
            [1.06, '#f59e0b', false],
          ].map(([y, c, on]) => (
            <mesh key={String(y)} position={[0.47, y as number, 0.01]}>
              <sphereGeometry args={[0.045, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color={on ? (c as string) : '#333'} emissive={c as string} emissiveIntensity={on ? 3 : 0} toneMapped={!on} />
            </mesh>
          ))}
          {/* perilla de la corriente */}
          <group position={[0, 0.3, 0]} rotation={[0, 0, -ang]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.04]} material={MAT.bezel}>
              <cylinderGeometry args={[0.5, 0.5, 0.08, 40]} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.24]}>
              <cylinderGeometry args={[0.36, 0.4, 0.32, 30]} />
              <meshStandardMaterial color="#202124" roughness={0.5} flatShading />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.405]} material={MAT.zinc}>
              <cylinderGeometry args={[0.3, 0.3, 0.02, 30]} />
            </mesh>
            {/* marca de la perilla (apunta a la corriente elegida) */}
            <mesh position={[0.45, 0, 0.085]} material={MAT.white}>
              <boxGeometry args={[0.12, 0.035, 0.01]} />
            </mesh>
            <mesh position={[0.2, 0, 0.42]} material={MAT.white}>
              <boxGeometry args={[0.18, 0.03, 0.01]} />
            </mesh>
          </group>
        </group>
      </Part>
    </group>
  )
}

function ManijaTop({ h, d }: { h: number; d: number }) {
  const geo = useMemo(() => {
    const y0 = h / 2 + 0.05
    const c = new THREE.CatmullRomCurve3(
      [
        [0, y0, d / 2 - 0.35],
        [0, y0 + 0.4, d / 2 - 0.55],
        [0, y0 + 0.5, d / 2 - 1.0],
        [0, y0 + 0.5, -d / 2 + 1.0],
        [0, y0 + 0.4, -d / 2 + 0.55],
        [0, y0, -d / 2 + 0.35],
      ].map((p) => v3(p as Vec3)),
    )
    return new THREE.TubeGeometry(c, 60, 0.12, 14, false)
  }, [h, d])
  return <mesh geometry={geo} material={MAT.bezel} castShadow />
}

/** Ficha Dinse: capuchón de goma que se enchufa y se traba con un cuarto de vuelta. */
function FichaDinse({ color }: { color: THREE.Material }) {
  const geo = useMemo(() => {
    const pts = [
      [0, 0],
      [0.2, 0],
      [0.2, 0.08],
      [0.21, 0.1],
      [0.21, 0.35],
      [0.18, 0.4],
      [0.17, 0.62],
      [0.14, 0.8],
      [0.11, 0.9],
      [0.09, 1.0],
      [0, 1.0],
    ].map(([r, y]) => new THREE.Vector2(r, y))
    return new THREE.LatheGeometry(pts, 28)
  }, [])
  return (
    <group position={[0, 0, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh geometry={geo} material={MAT.rubber} castShadow />
      {/* anillo de color para reconocer el borne */}
      <mesh position={[0, 0.25, 0]} material={color}>
        <cylinderGeometry args={[0.215, 0.215, 0.08, 28]} />
      </mesh>
      {/* nervaduras de agarre */}
      {[0.5, 0.58, 0.66].map((y) => (
        <mesh key={y} position={[0, y, 0]} material={MAT.rubber}>
          <torusGeometry args={[0.17 - (y - 0.5) * 0.12, 0.012, 6, 28]} />
        </mesh>
      ))}
    </group>
  )
}

function CableTubo({ pts, r = 0.09, material = MAT.cable }: { pts: Vec3[]; r?: number; material?: THREE.Material }) {
  const geo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(v3), false, 'centripetal'), 160, r, 12, false), [JSON.stringify(pts), r])
  return <mesh geometry={geo} material={material} castShadow receiveShadow />
}

/* ================================================================== pinza porta electrodo */

/**
 * Pinza tipo tenaza con mango aislado. Coordenadas propias: el electrodo sale del agarre (origen) hacia −z,
 * el mango va hacia −x y las mandíbulas abren en y (palanca arriba).
 */
function Portaelectrodo() {
  const handle = useMemo(() => {
    const pts: THREE.Vector2[] = [new THREE.Vector2(0, 0)]
    pts.push(new THREE.Vector2(0.12, 0), new THREE.Vector2(0.14, 0.05))
    for (let i = 0; i <= 12; i++) {
      const y = 0.1 + i * 0.09
      pts.push(new THREE.Vector2(0.16 + (i % 2 ? 0.012 : 0) + Math.sin((i / 12) * Math.PI) * 0.02, y))
    }
    pts.push(new THREE.Vector2(0.15, 1.28), new THREE.Vector2(0.12, 1.33), new THREE.Vector2(0, 1.34))
    return new THREE.LatheGeometry(pts, 28)
  }, [])
  return (
    <group>
      {/* mango aislado, con nervaduras */}
      <mesh geometry={handle} position={[-0.38, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={MAT.bezel} castShadow />
      <mesh position={[-0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={MAT.yellow}>
        <cylinderGeometry args={[0.15, 0.15, 0.08, 28]} />
      </mesh>
      {/* cuello */}
      <mesh position={[-0.22, -0.04, 0]} rotation={[0, 0, Math.PI / 2]} material={MAT.bezel}>
        <cylinderGeometry args={[0.1, 0.12, 0.34, 20]} />
      </mesh>
      {/* mandíbula de abajo (fija) y de arriba (palanca), forradas de plástico */}
      <mesh position={[0.15, -0.12, 0]} material={MAT.bezel} castShadow>
        <boxGeometry args={[0.62, 0.15, 0.26]} />
      </mesh>
      <mesh position={[0.15, 0.12, 0]} material={MAT.bezel} castShadow>
        <boxGeometry args={[0.62, 0.15, 0.26]} />
      </mesh>
      {/* contactos de cobre con las ranuras donde se apoya el electrodo */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0.2, s * 0.035, 0]} material={MAT.copper}>
          <boxGeometry args={[0.44, 0.04, 0.22]} />
        </mesh>
      ))}
      {/* palanca que se aprieta para abrir */}
      <group position={[-0.1, 0.2, 0]} rotation={[0, 0, 0.2]}>
        <mesh position={[-0.55, 0, 0]} material={MAT.bezel} castShadow>
          <boxGeometry args={[1.1, 0.08, 0.2]} />
        </mesh>
      </group>
      {/* resorte del pivote */}
      <mesh position={[-0.12, 0.02, 0]} material={MAT.steel}>
        <cylinderGeometry args={[0.03, 0.03, 0.3, 10]} />
      </mesh>
    </group>
  )
}

/** Base de una pieza local (x = −mango, y = palanca, z = −electrodo) a partir de las direcciones del mundo. */
function holderMatrix(grip: THREE.Vector3, electrodeDir: THREE.Vector3, handleDir: THREE.Vector3) {
  const E = electrodeDir.clone().normalize()
  const H = handleDir.clone().sub(E.clone().multiplyScalar(handleDir.dot(E))).normalize()
  const x = H.clone().negate()
  const z = E.clone().negate()
  const y = new THREE.Vector3().crossVectors(z, x)
  const m = new THREE.Matrix4().makeBasis(x, y, z)
  m.setPosition(grip)
  return m
}

/* ================================================================== electrodo */

const TIP_HOT = new THREE.MeshBasicMaterial({ color: '#ffd27a', toneMapped: false })

function Electrodo({ length, hot }: { length: number; hot: boolean }) {
  const label = useCanvasTexture(
    256,
    32,
    (ctx, W, H) => {
      ctx.fillStyle = '#cbbf9f'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#2b4a8a'
      ctx.font = 'bold 22px system-ui'
      ctx.textBaseline = 'middle'
      ctx.fillText('E6013', 20, H / 2)
      ctx.fillText('E6013', 150, H / 2)
    },
    [],
  )
  const bare = 0.25
  const rc = 0.016
  const rf = 0.027
  const coat = length - bare - 0.02
  return (
    <group>
      {/* extremo de agarre, sin revestimiento */}
      <mesh position={[0, 0, -bare / 2 + 0.08]} rotation={[Math.PI / 2, 0, 0]} material={MAT.steel}>
        <cylinderGeometry args={[rc, rc, bare, 10]} />
      </mesh>
      {/* revestimiento */}
      <mesh position={[0, 0, -(bare - 0.08) - coat / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[rf, rf, coat, 14]} />
        <meshStandardMaterial map={label} roughness={0.9} />
      </mesh>
      {/* punta: el alma asoma un poco dentro de la "copita" de revestimiento */}
      <mesh position={[0, 0, -(bare - 0.08) - coat - 0.01]} rotation={[Math.PI / 2, 0, 0]} material={hot ? TIP_HOT : MAT.steel}>
        <cylinderGeometry args={[rc, rc, 0.02, 10]} />
      </mesh>
      {hot && (
        <mesh position={[0, 0, -(bare - 0.08) - coat + 0.06]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[rf * 1.02, rf * 1.02, 0.12, 14]} />
          <meshStandardMaterial color="#5a2a10" emissive="#ff6a1a" emissiveIntensity={1.2} roughness={0.8} />
        </mesh>
      )}
    </group>
  )
}

/* ================================================================== pinza de masa */

function PinzaMasa() {
  // pinza a resorte mordiendo el caño del marco de la mesa. Coordenadas propias: muerde en el origen,
  // el cuerpo sale hacia +z, abre en y.
  const seg = (a: Vec3, b: Vec3, wdt: number, th: number, mat: THREE.Material, key: string) => {
    const A = v3(a)
    const B = v3(b)
    const dir = B.clone().sub(A)
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().normalize())
    return (
      <mesh key={key} position={A.clone().add(B).multiplyScalar(0.5)} quaternion={q} material={mat} castShadow>
        <boxGeometry args={[wdt, th, dir.length()]} />
      </mesh>
    )
  }
  const spring = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 120; i++) {
      const a = (i / 120) * Math.PI * 2 * 5
      pts.push(new THREE.Vector3(-0.14 + (i / 120) * 0.28, Math.sin(a) * 0.09, Math.cos(a) * 0.09))
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 240, 0.014, 6, false)
  }, [])
  return (
    <group>
      {/* brazo de arriba */}
      {seg([0, 0.24, -0.05], [0, 0.28, 0.75], 0.36, 0.07, MAT.copper, 'a1')}
      {seg([0, 0.28, 0.75], [0, 0.6, 1.6], 0.3, 0.07, MAT.copper, 'a2')}
      {seg([0, 0.62, 1.35], [0, 0.82, 1.9], 0.32, 0.14, MAT.red, 'a3')}
      {/* brazo de abajo */}
      {seg([0, -0.24, -0.05], [0, -0.28, 0.75], 0.36, 0.07, MAT.copper, 'b1')}
      {seg([0, -0.28, 0.75], [0, -0.6, 1.6], 0.3, 0.07, MAT.copper, 'b2')}
      {seg([0, -0.62, 1.35], [0, -0.82, 1.9], 0.32, 0.14, MAT.red, 'b3')}
      {/* dientes de las mandíbulas */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, s * 0.2, 0.02]} material={MAT.copper}>
          <boxGeometry args={[0.36, 0.06, 0.18]} />
        </mesh>
      ))}
      {/* eje y resorte */}
      <mesh position={[0, 0, 0.75]} rotation={[0, 0, Math.PI / 2]} material={MAT.steel}>
        <cylinderGeometry args={[0.035, 0.035, 0.5, 12]} />
      </mesh>
      <group position={[0, 0, 0.75]}>
        <mesh geometry={spring} material={MAT.steel} />
      </group>
      {[-1, 1].map((s) => seg([s * 0.18, 0.28, 0.65], [s * 0.18, -0.28, 0.65], 0.04, 0.05, MAT.copper, `ear${s}`))}
      {/* terminal del cable, abulonado al brazo de abajo */}
      <mesh position={[0, -0.36, 1.05]} rotation={[0.35, 0, 0]} material={MAT.copper}>
        <boxGeometry args={[0.18, 0.05, 0.4]} />
      </mesh>
      <mesh position={[0, -0.3, 1.0]} material={MAT.zinc}>
        <cylinderGeometry args={[0.06, 0.06, 0.1, 6]} />
      </mesh>
    </group>
  )
}

/* ================================================================== piqueta y cepillo */

function Piqueta() {
  const handleGeo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const turns = 26
    for (let i = 0; i <= turns * 14; i++) {
      const a = (i / 14) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(a) * 0.075, Math.sin(a) * 0.075, 0.12 + (i / (turns * 14)) * 1.5))
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), turns * 28, 0.02, 6, false)
  }, [])
  const wedge = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, -0.1)
    s.lineTo(0.75, -0.012)
    s.lineTo(0.75, 0.012)
    s.lineTo(0, 0.1)
    s.closePath()
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: false })
    g.translate(0, 0, -0.1)
    return g
  }, [])
  return (
    <group>
      {/* cabeza: una punta y un cincel */}
      <mesh material={MAT.steel} castShadow>
        <boxGeometry args={[0.32, 0.2, 0.2]} />
      </mesh>
      <mesh geometry={wedge} position={[0.16, 0, 0]} material={MAT.steel} castShadow />
      <mesh position={[-0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={MAT.steel} castShadow>
        <cylinderGeometry args={[0.1, 0.005, 0.7, 4]} />
      </mesh>
      {/* mango de resorte (no se calienta) y puño */}
      <mesh geometry={handleGeo} material={MAT.steel} castShadow />
      <mesh position={[0, 0, 1.72]} rotation={[Math.PI / 2, 0, 0]} material={MAT.red}>
        <cylinderGeometry args={[0.09, 0.08, 0.3, 16]} />
      </mesh>
    </group>
  )
}

const BRISTLE = canvasTex(64, 64, (ctx, w, h) => {
  ctx.fillStyle = '#6b6f74'
  ctx.fillRect(0, 0, w, h)
  const r = rng(91)
  for (let x = 0; x < w; x++) {
    const v = 90 + r() * 120
    ctx.fillStyle = `rgb(${v},${v},${v + 6})`
    ctx.fillRect(x, 0, 1, h)
  }
})

function Cepillo() {
  return (
    <group>
      <mesh position={[0, 0.22, 0]} material={MAT.wood} castShadow>
        <boxGeometry args={[1.5, 0.14, 0.32]} />
      </mesh>
      <mesh position={[1.25, 0.3, 0]} rotation={[0, 0, 0.12]} material={MAT.wood} castShadow>
        <boxGeometry args={[1.1, 0.1, 0.24]} />
      </mesh>
      <mesh position={[-0.05, 0.075, 0]} castShadow>
        <boxGeometry args={[1.3, 0.15, 0.28]} />
        <meshStandardMaterial map={BRISTLE ?? undefined} metalness={0.7} roughness={0.5} />
      </mesh>
    </group>
  )
}

/* ================================================================== pieza con el cordón */

const PIECE = { x: 0.6, z: 0.2, len: 2.6, half: 0.9, t: 0.06 }
const BEAD = { from: -1.1, to: 0.45, w: 0.1, h: 0.028, pitch: 0.022 }

function Pieza({ soldando }: { soldando: boolean }) {
  const top = TABLE.h
  const { len, half, t } = PIECE
  const pxu = 300
  const surface = useMemo(
    () =>
      canvasTex(len * pxu, half * 2 * pxu, (ctx, W, H) => {
        const xA = (BEAD.to + len / 2) * pxu
        // franja amolada junto a la junta, la junta todavía abierta adelante del arco y los colores de revenido
        drawPlate(ctx, W, H, { yc: H / 2, ground: 0.2 * pxu, gap: [xA, W], tint: [(BEAD.from + len / 2) * pxu, xA, 0.15 * pxu] })
      }),
    [len, half],
  )
  const hotLen = 0.32
  const L = BEAD.to - BEAD.from
  const coldLen = soldando ? L - hotLen : L
  const geoCold = useMemo(() => beadGeometry({ len: coldLen, width: BEAD.w, height: BEAD.h, pitch: BEAD.pitch, irregular: 0.25, crater: !soldando }), [coldLen, soldando])
  const geoHot = useMemo(() => beadGeometry({ len: hotLen, width: BEAD.w, height: BEAD.h, pitch: BEAD.pitch, irregular: 0.25, start: false, phase0: L - hotLen }), [L])
  // escoria: cubre el cordón menos el primer tramo, que ya se limpió con la piqueta
  const clean = 0.55
  const geoSlag = useMemo(
    () => beadGeometry({ len: coldLen - clean, width: BEAD.w * 1.12, height: BEAD.h * 1.35, pitch: 0.06, irregular: 0.5, start: true, crater: !soldando }),
    [coldLen, soldando],
  )
  return (
    <group position={[PIECE.x, top, PIECE.z]}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, t / 2, s * (half / 2 + 0.006)]} material={MAT.mill} castShadow receiveShadow>
          <boxGeometry args={[len, t, half - 0.012]} />
        </mesh>
      ))}
      <mesh position={[0, t + 0.0012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[len, half * 2]} />
        <meshStandardMaterial map={surface ?? undefined} metalness={0.6} roughness={0.55} />
      </mesh>
      {/* puntos de soldadura que fijan las chapas antes de soldar */}
      <mesh position={[len / 2 - 0.12, t, 0]} scale={[1.4, 0.5, 1]} material={MAT.bead}>
        <sphereGeometry args={[0.04, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <group position={[BEAD.from, t, 0]}>
        <mesh geometry={geoCold} material={MAT.bead} castShadow />
        <mesh geometry={geoSlag} position={[clean, 0.001, 0]} material={MAT.slag} />
        {soldando && (
          <mesh geometry={geoHot} position={[coldLen, 0, 0]}>
            <meshStandardMaterial color="#3a2a20" metalness={0.5} roughness={0.5} emissive="#ffffff" emissiveMap={HOT_GRAD ?? undefined} emissiveIntensity={2.2} toneMapped={false} />
          </mesh>
        )}
      </group>
    </group>
  )
}

/* ================================================================== conjunto */

export function EquipoModel({ amperaje, encendido, soldando }: EquipoParams) {
  const arc = encendido && soldando
  const power = amperaje / 120
  const top = TABLE.h

  // punta del electrodo sobre el cráter, con el arco (≈ 3 mm) entre medio
  const tip = new THREE.Vector3(PIECE.x + BEAD.to, top + PIECE.t + 0.03, PIECE.z)
  const eLen = arc ? 2.1 : 3.5
  const pose = useMemo(() => {
    if (arc) {
      // ángulo de avance de unos 70°: la parte de arriba del electrodo se inclina hacia donde se avanza
      const E = new THREE.Vector3(-Math.sin(0.35), -Math.cos(0.35), -0.05).normalize()
      const grip = tip.clone().sub(E.clone().multiplyScalar(eLen - 0.08))
      return holderMatrix(grip, E, new THREE.Vector3(0.15, 0.35, 1))
    }
    // apoyada sobre la mesa, sin el arco
    return holderMatrix(new THREE.Vector3(-1.2, top + 0.21, 1.2), new THREE.Vector3(-1, 0, -0.18), new THREE.Vector3(0.1, 0, 1))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arc, eLen])
  const handleEnd = new THREE.Vector3(-1.72, 0, 0).applyMatrix4(pose)
  const sP = socket(1)
  const sM = socket(-1)
  const clampAt = new THREE.Vector3(3.6, top - 0.2, TABLE.d / 2 - 0.12)
  const lug = clampAt.clone().add(new THREE.Vector3(0, -0.36, 1.25))

  const porta: Vec3[] = [
    [sP.x, sP.y, sP.z + 1.0],
    [sP.x + 0.1, sP.y - 0.5, sP.z + 1.6],
    [sP.x + 0.6, 0.09, sP.z + 2.3],
    [-4.5, 0.09, 5.4],
    [-2.4, 0.09, 4.9],
    [handleEnd.x - 0.3, 2.5, handleEnd.z + 1.6],
    [handleEnd.x, handleEnd.y - 1.6, handleEnd.z + 1.1],
    [handleEnd.x, handleEnd.y - 0.15, handleEnd.z + 0.3],
    [handleEnd.x, handleEnd.y, handleEnd.z],
  ]
  const masa: Vec3[] = [
    [sM.x, sM.y, sM.z + 1.0],
    [sM.x - 0.1, sM.y - 0.5, sM.z + 1.5],
    [sM.x + 0.3, 0.09, sM.z + 2.6],
    [-5, 0.09, 6.2],
    [1, 0.09, 6.0],
    [lug.x + 0.3, 2.0, lug.z + 1.3],
    [lug.x, lug.y - 1.2, lug.z + 0.5],
    [lug.x, lug.y - 0.1, lug.z + 0.05],
    [lug.x, lug.y, lug.z - 0.2],
  ]

  return (
    <group scale={0.55} position={[1.2, -3.9, 0]}>
      <Part id="mesa" offset={[0, -2.5, 0]} labelAt={[3.5, top - 0.2, -TABLE.d / 2]}>
        <Mesa />
      </Part>
      <Part id="pieza" offset={[0, 1.5, 0]} labelAt={[PIECE.x - 0.8, top + 0.2, PIECE.z - 0.6]}>
        <Pieza soldando={arc} />
      </Part>
      <Part id="piqueta" offset={[1, 1.5, 1]} labelAt={[3.0, top + 0.3, 1.8]}>
        <group position={[3.0, top + 0.1, 0.9]} rotation={[0, -0.5, 0]}>
          <Piqueta />
        </group>
        <group position={[3.6, top, -1.4]} rotation={[0, 0.4, 0]}>
          <Cepillo />
        </group>
      </Part>
      <Maquina amperaje={amperaje} encendido={encendido} />
      <Part id="cables" offset={[0, 0, 1.5]} labelAt={[-3.5, 0.6, 5.2]}>
        <CableTubo pts={porta} />
        <CableTubo pts={masa} />
      </Part>
      <Part id="masa" offset={[0, 0, 1.5]} labelAt={[clampAt.x, clampAt.y + 0.9, clampAt.z + 0.8]}>
        <group position={clampAt}>
          <PinzaMasa />
        </group>
      </Part>
      <Part id="porta" offset={[0, 1.2, 1]} labelAt={[handleEnd.x, handleEnd.y + 0.5, handleEnd.z]}>
        <group matrixAutoUpdate={false} matrix={pose}>
          <Portaelectrodo />
        </group>
      </Part>
      <Part id="electrodo" offset={[0, 1.4, 0.4]} labelAt={[tip.x - 0.3, tip.y + 1.0, tip.z]}>
        <group matrixAutoUpdate={false} matrix={pose}>
          <Electrodo length={eLen} hot={arc} />
        </group>
      </Part>
      {arc && (
        <group position={tip}>
          <Arc power={power} />
        </group>
      )}
    </group>
  )
}
