import { useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Part } from '../../Part'
import { useCanvasTexture } from '../../helpers'
import { useKeepRendering } from '../../keepRendering'

const steel = { color: '#8d939b', metalness: 0.75, roughness: 0.45 }
const brightSteel = { color: '#c9ccd1', metalness: 0.9, roughness: 0.3 }
const copper = { color: '#c27a3a', metalness: 0.85, roughness: 0.35 }

/* ================================================================== arco (compartido) */

function Arc({ power = 1 }: { power?: number }) {
  const core = useRef<THREE.Mesh>(null)
  const light = useRef<THREE.PointLight>(null)
  const sparks = useRef<THREE.InstancedMesh>(null)
  const m = useMemo(() => new THREE.Matrix4(), [])
  const N = 24
  const seeds = useMemo(() => Array.from({ length: N }, (_, i) => ({ a: (i / N) * Math.PI * 2 + i, s: 0.6 + ((i * 37) % 10) / 10, o: (i * 0.137) % 1 })), [])
  useKeepRendering(true, 30)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const f = 0.75 + Math.sin(t * 60) * 0.15 + Math.sin(t * 23) * 0.1
    if (core.current) core.current.scale.setScalar(f)
    if (light.current) light.current.intensity = 14 * power * f
    const mesh = sparks.current
    if (!mesh) return
    seeds.forEach((sd, i) => {
      const k = (t * sd.s + sd.o) % 1
      const r = k * 1.6 * power
      m.makeTranslation(Math.cos(sd.a) * r, 0.05 + Math.sin(k * Math.PI) * 0.9 * sd.s, Math.sin(sd.a) * r)
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
  })
  return (
    <group>
      <mesh ref={core}>
        <sphereGeometry args={[0.16, 16, 12]} />
        <meshStandardMaterial color="#ffffff" emissive="#bfe9ff" emissiveIntensity={6} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.34, 16, 12]} />
        <meshStandardMaterial color="#7dd3fc" emissive="#38bdf8" emissiveIntensity={2} transparent opacity={0.35} />
      </mesh>
      <pointLight ref={light} color="#cfeeff" distance={9} intensity={10} />
      <instancedMesh ref={sparks} args={[undefined, undefined, N]}>
        <sphereGeometry args={[0.03, 6, 4]} />
        <meshStandardMaterial color="#fff7ae" emissive="#fbbf24" emissiveIntensity={4} />
      </instancedMesh>
    </group>
  )
}

/* ================================================================== equipo */

export interface EquipoParams {
  amperaje: number
  encendido: boolean
  soldando: boolean
}

export const EQUIPO_PARTS = [
  { id: 'maquina', name: 'Máquina de soldar', desc: 'Transforma la corriente de la red en una corriente de baja tensión y alta intensidad. Tiene una manija o volante para regular la intensidad (en las más viejas, por escalones).' },
  { id: 'regulador', name: 'Regulación de la intensidad', desc: 'Se gradúa según el diámetro del electrodo: entre 35 y 40 A por cada milímetro. Hay que regularla en cada trabajo nuevo, al cambiar de electrodo o de posición.' },
  { id: 'cables', name: 'Cables', desc: 'Unen la máquina con la pinza porta electrodo y con la pinza de masa. Deben tener la sección adecuada a la corriente; nunca se usan rotos o dañados.' },
  { id: 'porta', name: 'Pinza porta electrodo', desc: 'Sujeta el electrodo con buen contacto eléctrico y aísla al soldador. El electrodo se toma por su extremo sin revestimiento.' },
  { id: 'electrodo', name: 'Electrodo', desc: 'Conduce la corriente y, al fundirse, es el material de aporte.' },
  { id: 'masa', name: 'Pinza de masa', desc: 'Cierra el circuito entre la máquina, la pieza y el electrodo. Se conecta lo más cerca posible de la zona de soldadura.' },
  { id: 'pieza', name: 'Pieza a soldar', desc: 'Dos chapas que se van a unir.' },
  { id: 'mesa', name: 'Mesa de soldar', desc: 'Con ranuras por donde caen las chispas y la escoria caliente.' },
]

function cableGeo(pts: [number, number, number][], r = 0.09) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 60, r, 10, false)
}

export function EquipoModel({ amperaje, encendido, soldando }: EquipoParams) {
  const dial = useCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#e5e7eb'
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, w / 2 - 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#111'
      ctx.font = 'bold 22px system-ui'
      ctx.textAlign = 'center'
      for (let a = 40; a <= 200; a += 40) {
        const ang = Math.PI * 0.75 + ((a - 40) / 160) * Math.PI * 1.5
        ctx.fillText(String(a), w / 2 + Math.cos(ang) * 92, h / 2 + Math.sin(ang) * 92 + 8)
      }
      ctx.font = 'bold 20px system-ui'
      ctx.fillText('A', w / 2, h / 2 + 60)
    },
    [],
  )
  const face = useCanvasTexture(
    256,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#111827'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = encendido ? '#fca5a5' : '#374151'
      ctx.font = 'bold 64px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(encendido ? `${amperaje}A` : '---', w / 2, 86)
    },
    [amperaje, encendido],
  )
  const ang = Math.PI * 0.75 + ((amperaje - 40) / 160) * Math.PI * 1.5
  const arc = encendido && soldando
  // punta del electrodo sobre la junta
  const tip: [number, number, number] = [1.6, 0.42, 0.6]
  const cPorta = useMemo(() => cableGeo([[-3.3, 1.2, 1.2], [-2, 0.2, 2.6], [0.6, 0.3, 2.8], [2.4, 1.6, 1.7]]), [])
  const cMasa = useMemo(() => cableGeo([[-3.3, 0.7, 1.2], [-2.5, 0.05, 1.9], [-1, 0.1, 1.6], [0.0, 0.35, 1.2]]), [])
  return (
    <group position={[0.5, -1, 0]}>
      <Part id="mesa" offset={[0, -1.5, 0]} labelAt={[2.5, -0.1, -1.6]}>
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} position={[1.2, -0.1, -1.6 + i * 0.4]} receiveShadow castShadow>
            <boxGeometry args={[5, 0.2, 0.3]} />
            <meshStandardMaterial {...steel} color="#5b6168" />
          </mesh>
        ))}
        {[-1.2, 3.6].map((x) =>
          [-1.6, 1.6].map((z) => (
            <mesh key={`${x}${z}`} position={[x, -1.4, z]} castShadow>
              <boxGeometry args={[0.2, 2.5, 0.2]} />
              <meshStandardMaterial {...steel} color="#4b5157" />
            </mesh>
          )),
        )}
      </Part>
      <Part id="pieza" offset={[0, 0.8, 0]} labelAt={[2.2, 0.6, -0.8]}>
        <mesh position={[1.6, 0.1, -0.35]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.2, 0.68]} />
          <meshStandardMaterial {...steel} />
        </mesh>
        <mesh position={[1.6, 0.1, 0.39]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.2, 0.68]} />
          <meshStandardMaterial {...steel} />
        </mesh>
        {/* cordón ya hecho detrás del arco */}
        <mesh position={[0.9, 0.22, 0.02]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.1, 1.4, 6, 12]} />
          <meshStandardMaterial color="#6b7280" metalness={0.6} roughness={0.5} />
        </mesh>
      </Part>
      <Part id="maquina" offset={[-1.5, 0, 0]} labelAt={[-4.5, 3.2, 0]}>
        <group position={[-4.5, 1.6, 0]}>
          <mesh castShadow>
            <boxGeometry args={[2.4, 3.2, 2.2]} />
            <meshStandardMaterial color="#1d4ed8" roughness={0.45} metalness={0.2} />
          </mesh>
          <mesh position={[0, 1.85, 0]}>
            <torusGeometry args={[0.6, 0.08, 8, 24, Math.PI]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          {Array.from({ length: 6 }, (_, i) => (
            <mesh key={i} position={[0, -0.9 + i * 0.25, -1.11]}>
              <boxGeometry args={[1.8, 0.08, 0.02]} />
              <meshStandardMaterial color="#0b1f5c" />
            </mesh>
          ))}
          <mesh position={[0, 0.9, 1.11]}>
            <planeGeometry args={[1.4, 0.7]} />
            <meshStandardMaterial map={face} />
          </mesh>
          {/* bornes de salida */}
          {[-0.5, 0.5].map((x) => (
            <mesh key={x} position={[x + 0.6 * 0, -1.0, 1.15]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.2, 16]} />
              <meshStandardMaterial color={x < 0 ? '#111' : '#b91c1c'} />
            </mesh>
          ))}
        </group>
      </Part>
      <Part id="regulador" offset={[-1.5, 0, 1.2]} labelAt={[-4.5, 0.6, 1.4]}>
        <group position={[-4.5, 1.6, 1.12]}>
          <mesh position={[0, -0.05, 0]}>
            <planeGeometry args={[1.3, 1.3]} />
            <meshStandardMaterial map={dial} transparent />
          </mesh>
          <group rotation={[0, 0, -ang + Math.PI / 2]} position={[0, -0.05, 0.08]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.32, 0.32, 0.16, 24]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[0, 0.38, 0.06]}>
              <boxGeometry args={[0.06, 0.32, 0.04]} />
              <meshStandardMaterial color="#f59e0b" />
            </mesh>
          </group>
        </group>
      </Part>
      <Part id="cables" offset={[0, 0.6, 1.2]} labelAt={[-1.2, 0.4, 2.8]}>
        <mesh geometry={cPorta} castShadow>
          <meshStandardMaterial color="#b91c1c" roughness={0.6} />
        </mesh>
        <mesh geometry={cMasa} castShadow>
          <meshStandardMaterial color="#18181b" roughness={0.6} />
        </mesh>
      </Part>
      <Part id="masa" offset={[-0.8, 0.8, 0.8]} labelAt={[0.1, 0.9, 1.0]}>
        <group position={[0.2, 0.3, 0.85]} rotation={[0, -0.4, 0]}>
          <mesh>
            <boxGeometry args={[0.5, 0.12, 0.7]} />
            <meshStandardMaterial {...copper} />
          </mesh>
          <mesh position={[0, 0.2, -0.05]} rotation={[0.25, 0, 0]}>
            <boxGeometry args={[0.45, 0.1, 0.8]} />
            <meshStandardMaterial {...copper} />
          </mesh>
          <mesh position={[0, 0.15, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.15, 0.04, 6, 14]} />
            <meshStandardMaterial {...brightSteel} />
          </mesh>
        </group>
      </Part>
      <Part id="porta" offset={[0.5, 1.6, 0.8]} labelAt={[2.6, 2.4, 1.6]}>
        <group position={[2.45, 1.7, 1.65]} rotation={[-0.75, 0, 0.3]}>
          <mesh>
            <cylinderGeometry args={[0.2, 0.18, 1.4, 16]} />
            <meshStandardMaterial color="#111" roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.85, 0]}>
            <boxGeometry args={[0.3, 0.4, 0.3]} />
            <meshStandardMaterial {...copper} />
          </mesh>
        </group>
      </Part>
      <Part id="electrodo" offset={[0.5, 1.2, 0.4]} labelAt={[2.1, 1.1, 1.4]}>
        {(() => {
          const a = new THREE.Vector3(2.25, 1.15, 1.25)
          const b = new THREE.Vector3(...tip).add(new THREE.Vector3(0, 0.08, 0))
          const mid = a.clone().add(b).multiplyScalar(0.5)
          const dir = b.clone().sub(a)
          const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
          return (
            <mesh position={mid} quaternion={q}>
              <cylinderGeometry args={[0.05, 0.05, dir.length(), 10]} />
              <meshStandardMaterial color="#d6cbb0" roughness={0.8} />
            </mesh>
          )
        })()}
      </Part>
      {arc && (
        <group position={tip}>
          <Arc power={amperaje / 120} />
        </group>
      )}
    </group>
  )
}

/* ================================================================== electrodo */

export interface ElectrodoParams {
  diametro: number
  corte: boolean
}

export const ELECTRODO_PARTS = [
  { id: 'alma', name: 'Alma', desc: 'Varilla de metal conductor (para aceros al carbono, de acero dulce). Conduce la corriente y, al fundirse, es el material de aporte. El diámetro del electrodo es el diámetro del alma.' },
  { id: 'revestimiento', name: 'Revestimiento', desc: 'La parte más importante: facilita el encendido del arco, genera gases que protegen el baño del aire, limpia óxidos e impurezas y forma la escoria que retarda el enfriamiento.' },
  { id: 'agarre', name: 'Extremo de agarre', desc: 'Punta sin revestimiento que se coloca en la pinza porta electrodo para hacer contacto.' },
  { id: 'punta', name: 'Punta de encendido', desc: 'Extremo donde se enciende el arco raspando la pieza, como un fósforo.' },
]

export function ElectrodoModel({ diametro, corte }: ElectrodoParams) {
  const k = diametro / 3.25 // escala visual
  const L = 9
  const rA = 0.22 * k
  const rR = rA * 1.6
  return (
    <group rotation={[0, 0, Math.PI / 2]} position={[0, 0.6, 0]}>
      <Part id="alma" offset={[0, 0, 1.2]} labelAt={[rA, 1.5, 0.4]}>
        <mesh castShadow>
          <cylinderGeometry args={[rA, rA, L, 24]} />
          <meshStandardMaterial {...brightSteel} />
        </mesh>
      </Part>
      <Part id="revestimiento" offset={[0, 0, -1.2]} labelAt={[rR, -1, 0.5]}>
        <mesh position={[0, -0.75, 0]} castShadow>
          <cylinderGeometry args={[rR, rR, L - 1.5, 32, 1, false, corte ? Math.PI * 0.5 : 0, corte ? Math.PI * 1.5 : Math.PI * 2]} />
          <meshStandardMaterial color="#d8ccb0" roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
        {/* bisel de la punta */}
        <mesh position={[0, -L / 2 + 0.05, 0]}>
          <cylinderGeometry args={[rR, rR * 0.85, 0.1, 32]} />
          <meshStandardMaterial color="#cdbf9e" roughness={0.85} />
        </mesh>
      </Part>
      <Part id="agarre" offset={[0, 1.2, 0]} labelAt={[0, L / 2 - 0.4, 0.6]}>
        <mesh position={[0, L / 2 - 0.4, 0]}>
          <torusGeometry args={[rA * 1.01, 0.012, 6, 24]} />
          <meshStandardMaterial color="#e5e7eb" />
        </mesh>
      </Part>
      <Part id="punta" offset={[0, -1.2, 0]} labelAt={[0, -L / 2, 0.6]}>
        <mesh position={[0, -L / 2 - 0.02, 0]}>
          <sphereGeometry args={[rA * 0.9, 12, 8]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.4} />
        </mesh>
      </Part>
    </group>
  )
}

/* ================================================================== simulador del cordón */

export interface CordonParams {
  diametro: number
  corriente: number
  /** longitud de arco en múltiplos del diámetro */
  arco: number
  /** velocidad de avance relativa (1 = correcta) */
  velocidad: number
  /** ángulo de avance (°) */
  angulo: number
  escoria: boolean
}

export interface Diagnostico {
  ancho: number
  alto: number
  penetracion: number
  mordeduras: boolean
  salpicaduras: number
  irregular: number
  problemas: string[]
  nota: number
}

export const recomendada = (d: number) => [35 * d, 40 * d] as const

export function diagnosticar(p: CordonParams): Diagnostico {
  const [lo, hi] = recomendada(p.diametro)
  const q = p.corriente / ((lo + hi) / 2)
  const problemas: string[] = []
  let nota = 10
  if (p.corriente > hi * 1.1) {
    problemas.push('Intensidad muy alta: arco demasiado fuerte, mucha salpicadura, mordeduras al costado del cordón y riesgo de perforar la pieza.')
    nota -= 3
  } else if (p.corriente < lo * 0.9) {
    problemas.push('Intensidad baja: el arco se apaga fácil, poca penetración, falta de fusión y cordón fino e irregular.')
    nota -= 3
  }
  if (p.arco > 1.5) {
    problemas.push('Arco demasiado largo: dispersa el calor, gotas gruesas, poca penetración, bordes desparejos y tiende a apagarse.')
    nota -= 2.5
  } else if (p.arco < 0.7) {
    problemas.push('Arco demasiado corto: el electrodo se pega a la pieza y puede quedar escoria atrapada en el cordón.')
    nota -= 2
  }
  if (p.velocidad > 1.35) {
    problemas.push('Avance muy rápido: el cordón queda angosto y con poco material.')
    nota -= 1.5
  } else if (p.velocidad < 0.7) {
    problemas.push('Avance muy lento: el cordón se ensancha y se deposita demasiado material.')
    nota -= 1.5
  }
  if (p.angulo < 45) {
    problemas.push('Ángulo menor a 45°: mucho menos penetración, el charco crece demasiado y en chapa fina se puede perforar.')
    nota -= 2
  } else if (p.angulo < 60 || p.angulo > 80) {
    problemas.push('Para una unión a tope el ángulo de avance conviene entre 60° y 80°.')
    nota -= 0.5
  }
  const angF = p.angulo < 45 ? 0.55 : 0.75 + ((Math.min(p.angulo, 90) - 45) / 45) * 0.35
  return {
    ancho: Math.max(0.5, p.diametro * 2.3 * Math.sqrt(q) * Math.pow(p.velocidad, -0.6) * (p.arco > 1.5 ? 1.15 : 1)),
    alto: Math.max(0.4, p.diametro * 0.75 * Math.pow(p.velocidad, -0.5) * (q < 0.85 ? 1.15 : 1)),
    penetracion: Math.max(0.2, p.diametro * 0.7 * q * angF * (p.arco > 1.5 ? 0.6 : 1)),
    mordeduras: p.corriente > hi * 1.1,
    salpicaduras: Math.max(0, (q - 1.05) * 60) + Math.max(0, (p.arco - 1.4) * 40),
    irregular: Math.min(1, Math.max(0, Math.abs(q - 1) * 2 - 0.15) + Math.max(0, p.arco - 1.5) * 0.8 + (p.arco < 0.7 ? 0.3 : 0)),
    problemas,
    nota: Math.max(1, Math.round(nota)),
  }
}

export const CORDON_PARTS = [
  { id: 'pieza', name: 'Pieza (metal base)', desc: 'Dos chapas unidas a tope. En el corte del frente se ve cuánto penetró la soldadura.' },
  { id: 'cordon', name: 'Cordón de soldadura', desc: 'Las gotitas de metal fundido llenan el charco y, al solidificarse una junto a otra, forman el cordón. Se ve parejo cuando el avance y el arco son constantes.' },
  { id: 'penetracion', name: 'Zona fundida (penetración)', desc: 'Donde se mezclaron el metal del electrodo y el de la pieza. Una buena penetración une las piezas en todo su espesor.' },
  { id: 'escoria', name: 'Escoria', desc: 'El revestimiento fundido flota sobre el metal y se solidifica encima: protege el cordón y retarda su enfriamiento. Se saca con la piqueta y el cepillo de acero.' },
  { id: 'salpicaduras', name: 'Salpicaduras', desc: 'Gotitas de metal proyectadas a los costados. Aparecen con mucha intensidad o con el arco muy largo.' },
]

function Bead({ d, length, children }: { d: Diagnostico; length: number; children: ReactNode }) {
  const geo = useMemo(() => {
    const segs = 120
    const ring = 14
    const pos: number[] = []
    const idx: number[] = []
    for (let i = 0; i <= segs; i++) {
      const t = i / segs
      const x = -length / 2 + t * length
      const ripple = 1 + Math.sin(t * 70) * 0.05 + (Math.sin(t * 13.7) * 0.5 + Math.sin(t * 31.1) * 0.5) * 0.25 * d.irregular
      const w = (d.ancho / 2) * 0.1 * ripple
      const h = d.alto * 0.1 * ripple
      for (let j = 0; j <= ring; j++) {
        const a = (j / ring) * Math.PI
        pos.push(x, Math.sin(a) * h, Math.cos(a) * w)
      }
    }
    for (let i = 0; i < segs; i++)
      for (let j = 0; j < ring; j++) {
        const a = i * (ring + 1) + j
        const b = a + ring + 1
        idx.push(a, b, a + 1, b, b + 1, a + 1)
      }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    return g
  }, [d.ancho, d.alto, d.irregular, length])
  return (
    <mesh geometry={geo} castShadow>
      {children}
    </mesh>
  )
}

export function CordonModel(p: CordonParams) {
  const d = diagnosticar(p)
  const L = 6
  const T = 0.6 // espesor de chapa
  const spatter = useMemo(() => {
    let s = 7
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
    return Array.from({ length: Math.min(80, Math.round(d.salpicaduras)) }, () => {
      const side = rnd() < 0.5 ? -1 : 1
      return [-L / 2 + rnd() * L, 0.02, side * (d.ancho * 0.05 + 0.05 + rnd() * 0.9)] as [number, number, number]
    })
  }, [d.salpicaduras, d.ancho])
  const penW = Math.min(1.2, d.ancho * 0.06)
  const penD = Math.min(T, d.penetracion * 0.1)
  return (
    <group position={[0, 0, 0]}>
      <Part id="pieza" offset={[0, -1, 0]} labelAt={[-2.6, 0, -1.4]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0, -T / 2, s * 0.8]} castShadow receiveShadow>
            <boxGeometry args={[L, T, 1.6]} />
            <meshStandardMaterial {...steel} />
          </mesh>
        ))}
      </Part>
      <Part id="penetracion" offset={[1.5, -0.5, 0]} labelAt={[L / 2 + 0.1, -0.3, 0.6]}>
        {/* corte del frente: media elipse de metal fundido */}
        <mesh position={[L / 2 + 0.005, 0, 0]} rotation={[0, Math.PI / 2, 0]} scale={[penW, penD, 1]}>
          <circleGeometry args={[1, 32, Math.PI, Math.PI]} />
          <meshStandardMaterial color="#f59e0b" emissive="#b45309" emissiveIntensity={0.4} side={THREE.DoubleSide} />
        </mesh>
      </Part>
      <Part id="cordon" offset={[0, 1.2, 0]} labelAt={[-1, 0.5, 0.4]}>
        <Bead d={d} length={L}>
          <meshStandardMaterial color="#8b9097" metalness={0.65} roughness={0.42} />
        </Bead>
      </Part>
      {p.escoria && (
        <Part id="escoria" offset={[0, 2.2, 0]} labelAt={[1.5, 0.6, 0.3]}>
          <group scale={[1, 1.15, 1.12]} position={[0, 0.01, 0]}>
            <SlagBead d={d} L={L} />
          </group>
        </Part>
      )}
      <Part id="salpicaduras" offset={[0, 0.8, 0]} labelAt={[0, 0.3, 1.4]}>
        {spatter.map((s, i) => (
          <mesh key={i} position={s}>
            <sphereGeometry args={[0.035 + (i % 3) * 0.012, 6, 4]} />
            <meshStandardMaterial color="#4b5563" metalness={0.6} roughness={0.5} />
          </mesh>
        ))}
      </Part>
      {d.mordeduras &&
        [-1, 1].map((s) => (
          <mesh key={s} position={[0, 0.005, s * (d.ancho * 0.05 + 0.04)]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[L, 0.06]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
        ))}
    </group>
  )
}

function SlagBead({ d, L }: { d: Diagnostico; L: number }) {
  return (
    <Bead d={d} length={L}>
      <meshPhysicalMaterial color="#3f3f46" roughness={0.25} clearcoat={0.8} />
    </Bead>
  )
}

/* ================================================================== protección personal */

export interface EppParams {
  amperaje: number
}

export const EPP_PARTS = [
  { id: 'mascara', name: 'Máscara de soldar', desc: 'Protege los ojos, la cara y el cuello. Su visor (105 × 50 mm) lleva el vidrio inactínico; las automáticas se oscurecen solas (tono 9 a 13) al encenderse el arco.' },
  { id: 'vidrio', name: 'Vidrio inactínico (filtro)', desc: 'Deja pasar sólo parte de la luz y frena los rayos ultravioleta e infrarrojos. Su número DIN depende de la intensidad. Adelante lleva un vidrio transparente que lo protege de las chispas.' },
  { id: 'lentes', name: 'Lentes de seguridad', desc: 'Protegen los ojos de chispas y partículas calientes, sobre todo al picar la escoria o amolar.' },
  { id: 'guantes', name: 'Guantes de cuero', desc: 'De puño largo: protegen manos y muñecas. Flexibles para trabajar cómodo.' },
  { id: 'delantal', name: 'Delantal de cuero', desc: 'Protege el torso de chispas y salpicaduras de escoria.' },
  { id: 'zapatos', name: 'Zapatos de seguridad', desc: 'Cubren los tobillos para evitar quemaduras por salpicaduras.' },
]

/** Número de filtro DIN según la intensidad (electrodo revestido, tabla del apunte). */
export function filtroDin(a: number) {
  if (a < 40) return { din: 10, rango: 'menos de 40 A (se usa el 10)' }
  if (a < 80) return { din: 10, rango: '40 – 79 A' }
  if (a < 175) return { din: 11, rango: '80 – 174 A' }
  if (a < 300) return { din: 12, rango: '175 – 299 A' }
  return { din: 13, rango: '300 – 499 A' }
}

export function EppModel({ amperaje }: EppParams) {
  const { din } = filtroDin(amperaje)
  const shade = 0.35 + (din - 9) * 0.12
  const leather = { color: '#a16207', roughness: 0.9 }
  return (
    <group position={[0, -0.6, 0]}>
      <Part id="mascara" offset={[0, 1.5, 0]} labelAt={[-2.8, 3.6, 0]}>
        <group position={[-2.8, 2.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh scale={[1, 0.6, 1.25]} castShadow>
            <sphereGeometry args={[1.1, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#111827" roughness={0.6} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </Part>
      <Part id="vidrio" offset={[0, 1, 1.5]} labelAt={[-2.8, 2.7, 0.9]}>
        <group position={[-2.8, 2.65, 0.66]}>
          <mesh>
            <boxGeometry args={[1.05, 0.5, 0.06]} />
            <meshStandardMaterial color="#14532d" transparent opacity={0.4 + shade * 0.5} metalness={0.2} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <boxGeometry args={[1.05, 0.5, 0.02]} />
            <meshPhysicalMaterial color="#ffffff" transparent opacity={0.2} roughness={0.05} />
          </mesh>
        </group>
      </Part>
      <Part id="lentes" offset={[0, 1, 1]} labelAt={[0, 3.3, 0]}>
        <group position={[0, 2.9, 0]}>
          {[-0.35, 0.35].map((x) => (
            <mesh key={x} position={[x, 0, 0]} scale={[1, 0.75, 0.3]}>
              <sphereGeometry args={[0.3, 20, 12]} />
              <meshPhysicalMaterial color="#cbd5e1" transparent opacity={0.45} roughness={0.05} />
            </mesh>
          ))}
          <mesh position={[0, 0.12, 0]}>
            <boxGeometry args={[1.4, 0.06, 0.06]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
        </group>
      </Part>
      <Part id="guantes" offset={[1.5, 0, 0]} labelAt={[2.6, 2.8, 0]}>
        {[-0.6, 0.6].map((x) => (
          <group key={x} position={[2.6 + x, 1.7, 0]} rotation={[0, 0, x * 0.25]} scale={[x < 0 ? -1 : 1, 1, 1]}>
            {/* palma */}
            <mesh castShadow>
              <boxGeometry args={[0.7, 0.8, 0.28]} />
              <meshStandardMaterial {...leather} color="#ca8a04" />
            </mesh>
            {/* dedos */}
            {[-0.24, -0.08, 0.08, 0.24].map((fx, i) => (
              <mesh key={fx} position={[fx, 0.62 + (i === 1 || i === 2 ? 0.06 : 0), 0]} castShadow>
                <capsuleGeometry args={[0.075, 0.38 + (i === 1 || i === 2 ? 0.1 : 0), 4, 10]} />
                <meshStandardMaterial {...leather} color="#ca8a04" />
              </mesh>
            ))}
            {/* pulgar */}
            <mesh position={[0.45, 0.1, 0]} rotation={[0, 0, -0.8]} castShadow>
              <capsuleGeometry args={[0.08, 0.3, 4, 10]} />
              <meshStandardMaterial {...leather} color="#ca8a04" />
            </mesh>
            {/* puño largo */}
            <mesh position={[0, -0.85, 0]} castShadow>
              <cylinderGeometry args={[0.5, 0.38, 0.9, 20]} />
              <meshStandardMaterial {...leather} color="#b45309" />
            </mesh>
          </group>
        ))}
      </Part>
      <Part id="delantal" offset={[0, 0, -1.5]} labelAt={[0, 1.6, 0.3]}>
        <mesh position={[0, 0.6, -0.3]} castShadow>
          <boxGeometry args={[1.8, 2.8, 0.06]} />
          <meshStandardMaterial {...leather} />
        </mesh>
        <mesh position={[0, 2.3, -0.3]}>
          <torusGeometry args={[0.5, 0.04, 6, 20, Math.PI]} />
          <meshStandardMaterial color="#713f12" />
        </mesh>
      </Part>
      <Part id="zapatos" offset={[0, -1, 1]} labelAt={[0, -1.2, 1.4]}>
        {[-0.5, 0.5].map((x) => (
          <group key={x} position={[x, -1.4, 0.6]}>
            <mesh position={[0, 0, 0.3]} scale={[0.4, 0.3, 0.8]} castShadow>
              <sphereGeometry args={[1, 20, 14]} />
              <meshStandardMaterial color="#292524" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.35, -0.2]} castShadow>
              <cylinderGeometry args={[0.32, 0.36, 0.7, 18]} />
              <meshStandardMaterial color="#292524" roughness={0.7} />
            </mesh>
          </group>
        ))}
      </Part>
    </group>
  )
}

/* ================================================================== uniones y posiciones */

export type Union = 'tope' | 'angulo' | 't' | 'solapada'
export type Posicion = 'plana' | 'horizontal' | 'vertical' | 'sobrecabeza'

export interface UnionParams {
  union: Union
  posicion: Posicion
}

export const UNION_PARTS = [
  { id: 'pieza1', name: 'Pieza 1', desc: 'Una de las chapas a unir.' },
  { id: 'pieza2', name: 'Pieza 2', desc: 'La otra chapa. El TIPO DE UNIÓN es cómo están ubicadas una respecto de la otra.' },
  { id: 'cordon', name: 'Cordón', desc: 'Donde se deposita la soldadura: en la junta (a tope) o en el vértice (en ángulo, en T, solapada).' },
  { id: 'piso', name: 'Referencia (piso)', desc: 'La POSICIÓN es cómo está la unión respecto del piso: plana, horizontal, vertical o sobre cabeza.' },
]

export function designacion({ union, posicion }: UnionParams) {
  const n = { plana: 1, horizontal: 2, vertical: 3, sobrecabeza: 4 }[posicion]
  return `${n}${union === 'tope' ? 'G' : 'F'}`
}

export function UnionModel({ union, posicion }: UnionParams) {
  // la unión se arma "plana" y después se gira según la posición
  const rot: [number, number, number] =
    posicion === 'plana' ? [0, 0, 0] : posicion === 'horizontal' ? [Math.PI / 2, 0, 0] : posicion === 'vertical' ? [Math.PI / 2, 0, Math.PI / 2] : [Math.PI, 0, 0]
  const t = 0.3
  const W = 2
  const L = 5
  let p1: { pos: [number, number, number]; size: [number, number, number] }
  let p2: { pos: [number, number, number]; size: [number, number, number] }
  let bead: { pos: [number, number, number]; r: number }
  if (union === 'tope') {
    p1 = { pos: [0, 0, -W / 2 - 0.03], size: [L, t, W] }
    p2 = { pos: [0, 0, W / 2 + 0.03], size: [L, t, W] }
    bead = { pos: [0, t / 2, 0], r: 0.22 }
  } else if (union === 'solapada') {
    p1 = { pos: [0, 0, -W / 2 + 0.5], size: [L, t, W] }
    p2 = { pos: [0, t, W / 2 - 0.5], size: [L, t, W] }
    bead = { pos: [0, t / 2 + 0.12, 0.5 + 0.12], r: 0.2 }
  } else if (union === 't') {
    p1 = { pos: [0, 0, 0], size: [L, t, W * 1.6] }
    p2 = { pos: [0, W / 2 + t / 2, 0], size: [L, W, t] }
    bead = { pos: [0, t / 2 + 0.12, t / 2 + 0.12], r: 0.2 }
  } else {
    p1 = { pos: [0, 0, -W / 2 + t / 2], size: [L, t, W] }
    p2 = { pos: [0, W / 2 - t / 2, -W + t], size: [L, W, t] }
    bead = { pos: [0, t / 2 + 0.12, -W + t * 1.5 + 0.12], r: 0.2 }
  }
  return (
    <group position={[0, 1.2, 0]}>
      <Part id="piso" offset={[0, -1, 0]} labelAt={[-3, -2.2, 2]}>
        <mesh position={[0, -2.6, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[9, 7]} />
          <meshStandardMaterial color="#334155" roughness={0.9} />
        </mesh>
        <mesh position={[0, -2.58, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.2, 3.3, 48]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
      </Part>
      <group rotation={rot}>
        <Part id="pieza1" offset={[0, -0.8, -0.8]} labelAt={[-2, 0.3, p1.pos[2]]}>
          <mesh position={p1.pos} castShadow receiveShadow>
            <boxGeometry args={p1.size} />
            <meshStandardMaterial {...steel} />
          </mesh>
        </Part>
        <Part id="pieza2" offset={[0, 0.8, 0.8]} labelAt={[2, p2.pos[1] + 0.3, p2.pos[2]]}>
          <mesh position={p2.pos} castShadow receiveShadow>
            <boxGeometry args={p2.size} />
            <meshStandardMaterial {...steel} color="#9aa1a9" />
          </mesh>
        </Part>
        <Part id="cordon" offset={[0, 1.2, 0]} labelAt={[0, bead.pos[1] + 0.4, bead.pos[2]]}>
          <mesh position={bead.pos} rotation={[0, 0, Math.PI / 2]} castShadow>
            <capsuleGeometry args={[bead.r, L - 0.4, 6, 14]} />
            <meshStandardMaterial color="#6b7280" metalness={0.6} roughness={0.45} emissive="#f97316" emissiveIntensity={0.15} />
          </mesh>
        </Part>
      </group>
    </group>
  )
}
