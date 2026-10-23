import { useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Part, useParts } from '../../Part'
import { useCanvasTexture } from '../../helpers'

// 1 unidad = 1 mm. El cable va a lo largo del eje X: vaina hasta x = 0, aislación hasta x = 14 y cobre pelado hasta x = 21.
const X0 = -34
const X_VAINA = 0
const X_AISL = 14
const X_END = 21

export type CableTipo = 'unipolar' | 'tpr' | 'desnudo' | 'esmaltado'
export type Funcion = 'fase' | 'neutro' | 'tierra' | 'retorno' | 'cc+' | 'cc-'
export type Aislacion = 'pvc' | 'silicona' | 'goma'

export interface CableParams {
  tipo: CableTipo
  conductores: number
  hebras: 'unifilar' | 'multifilar'
  seccion: number
  funcion: Funcion
  aislacion: Aislacion
}

export const FUNCION_INFO: Record<Funcion, { name: string; color: string; corriente: string }> = {
  fase: { name: 'Fase (L1)', color: '#7a4a24', corriente: 'alterna' },
  neutro: { name: 'Neutro (N)', color: '#4fb3e8', corriente: 'alterna' },
  tierra: { name: 'Puesta a tierra (PE)', color: 'vy', corriente: 'alterna' },
  retorno: { name: 'Retorno de iluminación (R)', color: '#f2f2ee', corriente: 'alterna' },
  'cc+': { name: 'Positivo (+)', color: '#d62828', corriente: 'continua' },
  'cc-': { name: 'Negativo (−)', color: '#1b1b1d', corriente: 'continua' },
}

/** Colores de los conductores de un cable multipolar de alterna, según la cantidad. */
export const TPR_COLORS: Record<number, { color: string; name: string }[]> = {
  2: [
    { color: '#7a4a24', name: 'marrón (fase)' },
    { color: '#4fb3e8', name: 'celeste (neutro)' },
  ],
  3: [
    { color: '#7a4a24', name: 'marrón (fase)' },
    { color: '#4fb3e8', name: 'celeste (neutro)' },
    { color: 'vy', name: 'verde y amarillo (tierra)' },
  ],
  4: [
    { color: '#7a4a24', name: 'marrón (L1)' },
    { color: '#1b1b1d', name: 'negro (L2)' },
    { color: '#c1121f', name: 'rojo (L3)' },
    { color: '#4fb3e8', name: 'celeste (neutro)' },
  ],
  5: [
    { color: '#7a4a24', name: 'marrón (L1)' },
    { color: '#1b1b1d', name: 'negro (L2)' },
    { color: '#c1121f', name: 'rojo (L3)' },
    { color: '#4fb3e8', name: 'celeste (neutro)' },
    { color: 'vy', name: 'verde y amarillo (tierra)' },
  ],
}

const COPPER = { color: '#c8743c', metalness: 1, roughness: 0.28 }

const copperR = (s: number) => Math.sqrt(s / Math.PI)
const insulT = (s: number, a: Aislacion) => (a === 'goma' ? 0.9 : 0.6) + (s >= 6 ? 0.2 : 0)

/** Material de la aislación: verde y amarillo se dibuja con franjas. */
function Insulation({ color, aislacion }: { color: string; aislacion: Aislacion }) {
  const stripes = useCanvasTexture(
    64,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#2f9e44'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#f5d000'
      for (let y = -w; y < h + w; y += 40) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y + 26)
        ctx.lineTo(w, y + 44)
        ctx.lineTo(0, y + 18)
        ctx.fill()
      }
    },
    [],
  )
  const rough = aislacion === 'silicona' ? 0.75 : aislacion === 'goma' ? 0.85 : 0.45
  if (color === 'vy') {
    stripes.wrapS = stripes.wrapT = THREE.RepeatWrapping
    stripes.repeat.set(1, 6)
    return <meshStandardMaterial map={stripes} roughness={rough} />
  }
  return <meshStandardMaterial color={color} roughness={rough} />
}

/** Hebras de cobre retorcidas (multifilar) o un solo alambre (unifilar). */
function Copper({ r, hebras, from, to }: { r: number; hebras: 'unifilar' | 'multifilar'; from: number; to: number }) {
  const len = to - from
  const strands = useMemo(() => {
    if (hebras === 'unifilar') return null
    const n = r > 1.2 ? 19 : 7
    const rs = n === 7 ? r / 3 : r / 5
    const pos: [number, number][] = [[0, 0]]
    for (let k = 0; k < 6; k++) pos.push([Math.cos((k * Math.PI) / 3) * rs * 2, Math.sin((k * Math.PI) / 3) * rs * 2])
    if (n === 19) for (let k = 0; k < 12; k++) pos.push([Math.cos((k * Math.PI) / 6) * rs * 3.9, Math.sin((k * Math.PI) / 6) * rs * 3.9])
    // cada hebra (menos la del centro) es una hélice
    return pos.map(([y, z], i) => {
      if (i === 0) return new THREE.CylinderGeometry(rs, rs, len, 10).rotateZ(Math.PI / 2).translate(from + len / 2, 0, 0)
      const r0 = Math.hypot(y, z)
      const a0 = Math.atan2(z, y)
      const pts: THREE.Vector3[] = []
      for (let k = 0; k <= 40; k++) {
        const t = k / 40
        const a = a0 + t * len * 0.35
        pts.push(new THREE.Vector3(from + t * len, Math.cos(a) * r0, Math.sin(a) * r0))
      }
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, rs * 0.95, 8, false)
    })
  }, [r, hebras, from, len])
  if (!strands)
    return (
      <mesh position={[from + len / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[r, r, len, 24]} />
        <meshStandardMaterial {...COPPER} />
      </mesh>
    )
  return (
    <group>
      {strands.map((g, i) => (
        <mesh key={i} geometry={g} castShadow>
          <meshStandardMaterial {...COPPER} />
        </mesh>
      ))}
    </group>
  )
}

/** posiciones (y, z) de los conductores dentro de la vaina */
function layout(n: number, ri: number): [number, number][] {
  if (n === 1) return [[0, 0]]
  const rc = ri / Math.sin(Math.PI / n) + 0.05
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + Math.PI / 2
    return [Math.cos(a) * rc, Math.sin(a) * rc]
  })
}

export function cableParts(p: CableParams) {
  const parts = []
  if (p.tipo === 'tpr')
    parts.push({
      id: 'vaina',
      name: 'Vaina (cubierta exterior)',
      desc: 'Manguera de material aislante y protector que envuelve a todos los conductores. En el TPR (taller pesado reforzado) es gruesa y resistente a golpes y raspones.',
    })
  if (p.tipo === 'unipolar' || p.tipo === 'tpr')
    parts.push({
      id: 'aislacion',
      name: 'Aislación',
      desc: `Cubre a cada conductor para que la corriente no pase de uno a otro. Su color indica la función. Material: ${p.aislacion === 'pvc' ? 'PVC (el más usado en las casas)' : p.aislacion === 'silicona' ? 'silicona (aguanta altas temperaturas)' : 'goma / EPR (flexible, resiste la humedad)'}.`,
    })
  if (p.tipo === 'esmaltado')
    parts.push({ id: 'aislacion', name: 'Esmalte (barniz)', desc: 'Una capa finísima de barniz aislante. Permite enrollar muchas vueltas juntas: bobinas de motores, transformadores y relés.' })
  parts.push({
    id: 'conductor',
    name: p.hebras === 'multifilar' ? 'Conductor multifilar (cobre)' : 'Conductor unifilar (cobre)',
    desc:
      p.hebras === 'multifilar'
        ? `Muchas hebras finas de cobre retorcidas: es flexible. Sección ${String(p.seccion).replace('.', ',')} mm².`
        : `Un solo alambre de cobre: es rígido. Sección ${String(p.seccion).replace('.', ',')} mm².`,
  })
  return parts
}

export function CableModel(p: CableParams) {
  const rc = copperR(p.seccion)
  const t = insulT(p.seccion, p.aislacion)
  const ri = rc + t
  const n = p.tipo === 'tpr' ? p.conductores : 1
  const pos = layout(n, ri)
  const colors = p.tipo === 'tpr' ? TPR_COLORS[n] ?? TPR_COLORS[3] : [{ color: FUNCION_INFO[p.funcion].color === 'vy' ? 'vy' : FUNCION_INFO[p.funcion].color, name: '' }]
  const rv = n === 1 ? ri + 1 : Math.max(...pos.map(([y, z]) => Math.hypot(y, z))) + ri + 1.1
  const bare = p.tipo === 'desnudo'
  const enamel = p.tipo === 'esmaltado'
  return (
    <group position={[-2, 0, 0]}>
      {p.tipo === 'tpr' && (
        <Part id="vaina" offset={[0, rv * 2 + 6, 0]} labelAt={[X0 + 8, rv + 1.5, 0]}>
          <mesh position={[(X0 + X_VAINA) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
            <cylinderGeometry args={[rv, rv, X_VAINA - X0, 48]} />
            <meshStandardMaterial color={p.aislacion === 'silicona' ? '#b9bcc2' : '#232427'} roughness={0.7} />
          </mesh>
          {/* tapa del corte, para que se vea el relleno */}
          <mesh position={[X_VAINA + 0.01, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <ringGeometry args={[rv - 1, rv, 48]} />
            <meshStandardMaterial color="#3a3b40" side={THREE.DoubleSide} />
          </mesh>
        </Part>
      )}
      {!bare && (
        <Part id="aislacion" offset={[0, 0, 0]} labelAt={[X_AISL - 3, rv + 1.5, 0]}>
          {pos.map(([y, z], i) => (
            <Spread key={i} y={y} z={z}>
              <mesh position={[(X0 + X_AISL) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[enamel ? rc + 0.05 : ri, enamel ? rc + 0.05 : ri, X_AISL - X0, 40]} />
                {enamel ? <meshStandardMaterial color="#b4551f" metalness={0.6} roughness={0.15} /> : <Insulation color={colors[i]?.color ?? '#888'} aislacion={p.aislacion} />}
              </mesh>
            </Spread>
          ))}
        </Part>
      )}
      <Part id="conductor" offset={[6, 0, 0]} labelAt={[X_END - 2, rc + 2, 0]}>
        {pos.map(([y, z], i) => (
          <Spread key={i} y={y} z={z}>
            <Copper r={rc} hebras={p.hebras} from={bare ? X0 : X_AISL - 1} to={X_END} />
          </Spread>
        ))}
      </Part>
    </group>
  )
}

/** Conductor dentro del cable: al despiezar se separa de los demás (así se ve cada uno con su color). */
function Spread({ y, z, children }: { y: number; z: number; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  const { explode } = useParts()
  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    const k = 1 + explode * 2.2
    const f = 1 - Math.exp(-dt * 8)
    g.position.y += (y * k - g.position.y) * f
    g.position.z += (z * k - g.position.z) * f
  })
  return (
    <group ref={ref} position={[0, y, z]}>
      {children}
    </group>
  )
}
