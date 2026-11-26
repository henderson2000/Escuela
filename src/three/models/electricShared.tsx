import { useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import { latheGeometry } from '../helpers'
import { canvasTex, rng } from './segundo/soldaduraShared'

/* ------------------------------------------------------------------ */
/* Piezas eléctricas compartidas (Electricidad 1ro y 2do): lámpara      */
/* incandescente con rosca E27, aparatos modulares de riel DIN, llave   */
/* de luz y tablero de madera. Se modelan en milímetros y se escalan.   */
/* ------------------------------------------------------------------ */

const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p)

export const EM = {
  housing: std({ color: '#efeeea', roughness: 0.48, metalness: 0 }),
  housingIn: std({ color: '#dcdad4', roughness: 0.6 }),
  toggle: std({ color: '#26282c', roughness: 0.4 }),
  toggleBlue: std({ color: '#1d4ed8', roughness: 0.4 }),
  brass: std({ color: '#c9a15a', metalness: 1, roughness: 0.3 }),
  nickel: std({ color: '#d4d7dc', metalness: 1, roughness: 0.22 }),
  copper: std({ color: '#c47a4c', metalness: 1, roughness: 0.3 }),
  silver: std({ color: '#e6e8ec', metalness: 1, roughness: 0.18 }),
  steel: std({ color: '#9aa1a9', metalness: 0.85, roughness: 0.35 }),
  porcelain: new THREE.MeshPhysicalMaterial({ color: '#f4f1ea', roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.2 }),
  blackGlass: std({ color: '#151517', roughness: 0.2 }),
  plasticWhite: std({ color: '#f6f5f1', roughness: 0.35 }),
}

/* ------------------------------------------------------------------ madera */

/** Terciado / fenólico del tablero de práctica (vetas suaves, sin costuras a la vista). */
export const PLYWOOD = canvasTex(
  1024,
  1024,
  (ctx, w, h) => {
    ctx.fillStyle = '#c69a68'
    ctx.fillRect(0, 0, w, h)
    const r = rng(23)
    for (let i = 0; i < 140; i++) {
      const y0 = r() * h
      ctx.strokeStyle = r() < 0.6 ? `rgba(130,84,45,${0.06 + r() * 0.12})` : `rgba(235,200,150,${0.06 + r() * 0.1})`
      ctx.lineWidth = 1 + r() * 4
      ctx.beginPath()
      for (let x = -20; x <= w + 20; x += 24) ctx.lineTo(x, y0 + Math.sin(x / 140 + i) * 9 + Math.sin(x / 41 + i * 3) * 2)
      ctx.stroke()
    }
    // nudos
    for (let i = 0; i < 4; i++) {
      const x = r() * w
      const y = r() * h
      for (let k = 6; k > 0; k--) {
        ctx.strokeStyle = `rgba(110,68,34,${0.08 + k * 0.03})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.ellipse(x, y, 6 + k * 7, 3 + k * 3, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
  },
  [1, 1],
)

/** Cabeza de tornillo Phillips (mirando a +z), radio r. */
export function ScrewHead({ r = 0.1, position, rotation, mat = EM.nickel }: { r?: number; position?: [number, number, number]; rotation?: [number, number, number]; mat?: THREE.Material }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={mat}>
        <cylinderGeometry args={[r, r * 1.05, r * 0.5, 20]} />
      </mesh>
      {[0, Math.PI / 2].map((a) => (
        <mesh key={a} position={[0, 0, r * 0.26]} rotation={[0, 0, a]}>
          <boxGeometry args={[r * 1.3, r * 0.22, r * 0.1]} />
          <meshStandardMaterial color="#3b3f45" metalness={0.6} roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ lámpara incandescente */

const GLASS = new THREE.MeshPhysicalMaterial({ color: '#fffdf6', roughness: 0.04, metalness: 0, transmission: 0.92, thickness: 0.6, ior: 1.5, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide })

/**
 * Lámpara incandescente A60 con rosca Edison E27 (medidas en mm: 60 × 105). El casquillo queda abajo,
 * en y = 0, y la ampolla hacia +y. `glow` de 0 a 1.
 */
export function Bulb({ glow = 0, scale = 0.01 }: { glow?: number; scale?: number }) {
  const geo = useMemo(() => {
    const glass = latheGeometry(
      [
        [12.5, 24],
        [13.5, 29],
        [16.5, 37],
        [22.5, 47],
        [27.5, 57],
        [29.8, 67],
        [29.4, 77],
        [26.8, 87],
        [21, 96],
        [12, 102.5],
        [0.01, 105],
      ],
      48,
      1.2,
    )
    // casquillo roscado: el radio sube y baja como los filetes
    const thread: [number, number][] = []
    for (let y = 3; y <= 24; y += 0.6) thread.push([13 + 0.85 * Math.sin((y / 3.6) * Math.PI * 2), y])
    const base = latheGeometry(thread, 40, 0.6)
    const insul = latheGeometry(
      [
        [0.01, -0.5],
        [4, -0.5],
        [4.5, 0.5],
        [9.5, 1.2],
        [11, 3],
      ],
      32,
      0.5,
    )
    // filamento en espiral entre los dos soportes
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 240; i++) {
      const t = i / 240
      const a = t * Math.PI * 2 * 16
      pts.push(new THREE.Vector3(-8 + t * 16, 62 + Math.cos(a) * 1.1 + Math.sin(t * Math.PI) * 2, Math.sin(a) * 1.1))
    }
    const fil = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.28, 5, false)
    const support = (x: number) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(x * 0.15, 38, 0), new THREE.Vector3(x * 0.6, 50, 0), new THREE.Vector3(x, 62, 0)]), 12, 0.25, 5, false)
    return { glass, base, insul, fil, sup: [support(-8), support(8)] }
  }, [])
  const hot = glow > 0.02
  return (
    <group scale={scale}>
      <mesh geometry={geo.base} material={EM.brass} castShadow />
      <mesh geometry={geo.insul} material={EM.blackGlass} />
      <mesh position={[0, -1, 0]} material={EM.brass}>
        <cylinderGeometry args={[3.2, 3.6, 1.2, 16]} />
      </mesh>
      {/* tallo de vidrio con los soportes y el filamento */}
      <mesh position={[0, 31, 0]} material={GLASS}>
        <cylinderGeometry args={[2.4, 5.5, 14, 16, 1, true]} />
      </mesh>
      {geo.sup.map((g, i) => (
        <mesh key={i} geometry={g} material={EM.nickel} />
      ))}
      <mesh geometry={geo.fil}>
        <meshStandardMaterial color={hot ? '#ffd27a' : '#555'} emissive="#ffb347" emissiveIntensity={glow * 9} toneMapped={!hot} />
      </mesh>
      <mesh geometry={geo.glass} castShadow>
        <meshPhysicalMaterial color="#fffdf6" roughness={0.04} transmission={0.92} thickness={0.6} ior={1.5} transparent opacity={0.5 + glow * 0.2} emissive="#ffcc66" emissiveIntensity={glow * 0.55} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {hot && <pointLight position={[0, 62, 0]} color="#ffcf7a" intensity={glow * 9} distance={7} decay={2} />}
    </group>
  )
}

/** Portalámparas de porcelana con rosca E27 y sus dos bornes (para apoyar o atornillar); la lámpara va arriba. */
export function PorcelainHolder({ scale = 0.01 }: { scale?: number }) {
  const body = useMemo(
    () =>
      latheGeometry(
        [
          [0.01, 0],
          [26, 0],
          [27, 3],
          [27, 10],
          [22, 13],
          [19, 15],
          [19, 34],
          [17, 36],
          [15.5, 36],
        ],
        48,
        0.8,
      ),
    [],
  )
  return (
    <group scale={scale}>
      <mesh geometry={body} material={EM.porcelain} castShadow receiveShadow />
      {/* bornes con sus tornillos */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 12, 13.2, 6]}>
          <mesh material={EM.brass}>
            <boxGeometry args={[7, 1.2, 6]} />
          </mesh>
          <mesh position={[0, 1.6, 0]} material={EM.brass}>
            <cylinderGeometry args={[2.2, 2.2, 1.6, 16]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ aparatos de riel DIN */

/** Frente impreso de un aparato modular (texto, curva, esquema). */
function useDinFace(label: string, sub: string, kind: 'pia' | 'dif', poles: number) {
  return useMemo(
    () =>
      canvasTex(160 * poles, 400, (ctx, w, h) => {
        ctx.fillStyle = '#f2f1ec'
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = '#1d1f23'
        ctx.textAlign = 'center'
        ctx.font = `bold ${kind === 'dif' ? 44 : 56}px Arial`
        ctx.fillText(label, w / 2, 64)
        ctx.font = '26px Arial'
        sub.split('\n').forEach((l, i) => ctx.fillText(l, w / 2, 104 + i * 30))
        // esquema: contacto + bobina (o toroide)
        ctx.strokeStyle = '#1d1f23'
        ctx.lineWidth = 3
        for (let p = 0; p < poles; p++) {
          const x = (w / poles) * (p + 0.5)
          ctx.beginPath()
          ctx.moveTo(x, h - 120)
          ctx.lineTo(x, h - 96)
          ctx.lineTo(x + 14, h - 70)
          ctx.moveTo(x, h - 64)
          ctx.lineTo(x, h - 40)
          ctx.stroke()
        }
        if (kind === 'dif') {
          ctx.beginPath()
          ctx.ellipse(w / 2, h - 54, w * 0.32, 9, 0, 0, Math.PI * 2)
          ctx.stroke()
        }
        ctx.font = '20px Arial'
        ctx.fillText('IEC 60898', w / 2, h - 12)
      }),
    [label, sub, kind, poles],
  )
}

/**
 * Aparato modular de riel DIN visto de frente (interruptor termomagnético o diferencial), con medidas reales
 * en mm: 18 mm por polo, 90 mm de alto, ventana frontal de 45 mm, bornes con tornillo arriba y abajo.
 * Se apoya con la espalda en z = 0. `on` = palanca arriba.
 */
export function DinModule({ poles = 2, label, sub, on, kind, scale = 0.05 }: { poles?: number; label: string; sub: string; on: boolean; kind: 'pia' | 'dif'; scale?: number }) {
  const W = 17.6 * poles
  const face = useDinFace(label, sub, kind, poles)
  return (
    <group scale={scale}>
      {/* cuerpo de atrás (90 mm) y hombros donde están los tornillos de los bornes */}
      <RoundedBox args={[W, 90, 44]} radius={2} smoothness={3} position={[0, 0, 22]} material={EM.housing} castShadow />
      {/* ventana frontal de 45 mm que asoma por la tapa del tablero */}
      <RoundedBox args={[W - 1, 45, 22]} radius={2.5} smoothness={3} position={[0, 0, 53]} material={EM.housing} castShadow />
      <mesh position={[0, -5, 64.05]}>
        <planeGeometry args={[W - 3, 30]} />
        <meshStandardMaterial map={face ?? undefined} roughness={0.5} />
      </mesh>
      {/* palanca (una por aparato, con puente entre polos) */}
      <group position={[0, 13, 60]} rotation={[on ? -0.5 : 0.5, 0, 0]}>
        <RoundedBox args={[W * 0.62, 7, 18]} radius={1.6} smoothness={3} position={[0, 0, 7]} material={kind === 'dif' ? EM.toggleBlue : EM.toggle} castShadow />
      </group>
      {/* indicador de estado */}
      <mesh position={[W / 2 - 4, 5, 64.06]}>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color={on ? '#dc2626' : '#16a34a'} roughness={0.5} />
      </mesh>
      {kind === 'dif' && (
        <group position={[-W / 2 + 7, 4, 64]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[3.6, 3.6, 2.4, 20]} />
            <meshStandardMaterial color="#facc15" roughness={0.4} />
          </mesh>
        </group>
      )}
      {/* tornillos de los bornes, en los hombros de arriba y abajo */}
      {Array.from({ length: poles }, (_, p) =>
        [1, -1].map((sy) => (
          <group key={`${p}${sy}`} position={[-W / 2 + 8.8 + p * 17.6, sy * 34, 44]}>
            <mesh position={[0, 0, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[4.2, 4.2, 1, 20]} />
              <meshStandardMaterial color="#2a2c30" roughness={0.6} />
            </mesh>
            <ScrewHead r={3.2} mat={EM.nickel} />
          </group>
        )),
      )}
    </group>
  )
}

/* ------------------------------------------------------------------ llave de luz */

/** Llave de un punto (o de combinación) con su bastidor y tapa, de embutir. Frente hacia +z, apoya en z = 0. */
export function WallSwitch({ on, two, scale = 0.012 }: { on: boolean; two?: boolean; scale?: number }) {
  return (
    <group scale={scale}>
      {/* caja rectangular de chapa (asoma apenas) y tapa de 70 × 120 mm */}
      <RoundedBox args={[70, 120, 8]} radius={3} smoothness={4} position={[0, 0, 4]} material={EM.plasticWhite} castShadow />
      <RoundedBox args={[56, 92, 3]} radius={2} smoothness={3} position={[0, 0, 8.8]} material={EM.housingIn} />
      {[-1, 1].map((s) => (
        <ScrewHead key={s} r={2.4} position={[0, s * 50, 8.2]} mat={EM.plasticWhite} />
      ))}
      {/* tecla basculante */}
      <group position={[0, 0, 10]} rotation={[on ? -0.12 : 0.12, 0, 0]}>
        <RoundedBox args={[22, 40, 5]} radius={1.8} smoothness={3} position={[0, 0, 2.5]} material={EM.plasticWhite} castShadow />
        <mesh position={[0, on ? 14 : -14, 5.1]}>
          <planeGeometry args={[6, 2]} />
          <meshStandardMaterial color={two ? '#64748b' : '#9ca3af'} />
        </mesh>
      </group>
    </group>
  )
}
