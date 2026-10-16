import { useMemo } from 'react'
import * as THREE from 'three'
import { Part } from '../Part'
import { Wire, latheGeometry, metal, tinned, useCanvasTexture } from '../helpers'

export type CapType = 'electrolitico' | 'ceramico'

export interface CapacitorProps {
  type: CapType
  /** capacidad en microfaradios */
  uF: number
  volts: number
  sleeve?: string
}

export function formatCap(uF: number): string {
  if (uF >= 1) return `${Number(uF.toFixed(2)).toString().replace('.', ',')} µF`
  if (uF >= 0.001) return `${Number((uF * 1000).toFixed(2)).toString().replace('.', ',')} nF`
  return `${Number((uF * 1e6).toFixed(1)).toString().replace('.', ',')} pF`
}

/** Código de 3 cifras de los capacitores cerámicos (en pF): 104 = 10 × 10⁴ pF = 100 nF */
export function ceramicCode(uF: number): string {
  const pF = Math.round(uF * 1e6)
  if (pF < 100) return String(pF)
  const exp = Math.floor(Math.log10(pF)) - 1
  const two = Math.round(pF / 10 ** exp)
  return `${two}${exp}`
}

export function CapacitorModel(props: CapacitorProps) {
  return props.type === 'electrolitico' ? <Electrolytic {...props} /> : <Ceramic {...props} />
}

/** Banda en espiral (bobinado de las armaduras), extruida hacia arriba. */
function spiralGeometry(rIn: number, rOut: number, turns: number, thick: number, height: number, phase = 0) {
  const n = Math.round(turns * 90)
  const outer: THREE.Vector2[] = []
  const inner: THREE.Vector2[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const a = t * turns * Math.PI * 2 + phase
    const r = rIn + t * (rOut - rIn)
    outer.push(new THREE.Vector2(Math.cos(a) * (r + thick / 2), Math.sin(a) * (r + thick / 2)))
    inner.push(new THREE.Vector2(Math.cos(a) * (r - thick / 2), Math.sin(a) * (r - thick / 2)))
  }
  const shape = new THREE.Shape([...outer, ...inner.reverse()])
  const g = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: 1 })
  g.rotateX(-Math.PI / 2)
  return g
}

// Electrolítico de 100 µF 25 V: Ø6,3 × 11 mm (1 unidad = 4 mm)
const CR = 0.79
const CH = 2.75
const LEAD_R = 0.0625
const LEAD_X = 0.3125 // patas separadas 2,5 mm

/** perfil de la lata: fondo, ranura de cierre (crimp) y borde superior redondeado */
function canProfile(extra = 0): [number, number][] {
  const r = CR + extra
  return [
    [0, 0.08],
    [r - 0.08, 0.08],
    [r - 0.01, 0.1],
    [r, 0.16],
    [r, 0.34],
    [r - 0.06, 0.4],
    [r - 0.07, 0.44],
    [r - 0.06, 0.48],
    [r, 0.54],
    [r, CH - 0.06],
    [r - 0.015, CH - 0.02],
    [r - 0.05, CH],
    [0, CH],
  ]
}

function Electrolytic({ uF, volts, sleeve = '#1b2f6e' }: CapacitorProps) {
  const label = formatCap(uF).replace(' ', '')
  const tex = useCanvasTexture(
    1024,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = sleeve
      ctx.fillRect(0, 0, w, h)
      // franja del negativo con signos "−"
      const sx = w * 0.04
      const sw = w * 0.16
      ctx.fillStyle = '#c9ccd6'
      ctx.fillRect(sx, 0, sw, h)
      ctx.fillStyle = sleeve
      ctx.font = 'bold 70px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (let i = 0; i < 5; i++) ctx.fillText('−', sx + sw / 2, 60 + i * 95)
      // texto impreso en vertical, como en los capacitores reales
      ctx.fillStyle = '#e8ecf5'
      ctx.save()
      ctx.translate(w * 0.4, h / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.font = 'bold 66px sans-serif'
      ctx.fillText(`${label}  ${volts}V`, 0, -48)
      ctx.font = '42px sans-serif'
      ctx.fillText('105°C   (M)', 0, 30)
      ctx.restore()
      ctx.font = 'bold 36px sans-serif'
      ctx.save()
      ctx.translate(w * 0.62, h / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText('LOW ESR', 0, 0)
      ctx.restore()
      // el valor se repite del otro lado, como en los reales
      ctx.save()
      ctx.translate(w * 0.84, h / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.font = 'bold 54px sans-serif'
      ctx.fillText(`${label}  ${volts}V`, 0, 0)
      ctx.restore()
    },
    [label, volts, sleeve],
  )

  const sleeveGeo = useMemo(() => {
    // termocontraíble: sigue la lata y se dobla sobre los bordes
    const prof: [number, number][] = [
      [CR - 0.12, 0.06],
      [CR - 0.02, 0.07],
      [CR + 0.015, 0.12],
      ...canProfile(0.015).slice(3, 10),
      [CR + 0.012, CH - 0.04],
      [CR - 0.02, CH - 0.005],
      [CR - 0.09, CH + 0.005],
    ]
    return latheGeometry(prof, 72)
  }, [])
  const canGeo = useMemo(() => latheGeometry(canProfile(0), 72), [])
  const foil = useMemo(() => spiralGeometry(0.08, CR - 0.1, 5, 0.03, CH - 0.75), [])
  const paper = useMemo(() => spiralGeometry(0.08, CR - 0.1, 5, 0.05, CH - 0.65, Math.PI), [])

  return (
    <group position={[0, -0.9, 0]}>
      <Part id="funda" offset={[2.0, 0, 0]} labelAt={[1.0, 1.9, 0]}>
        <mesh geometry={sleeveGeo} rotation={[0, -Math.PI * 0.47, 0]} castShadow>
          <meshPhysicalMaterial map={tex} roughness={0.32} clearcoat={0.6} clearcoatRoughness={0.25} side={THREE.DoubleSide} />
        </mesh>
      </Part>

      <Part id="lata" offset={[-2.0, 0, 0]} labelAt={[-1.0, 1.2, 0]}>
        <mesh geometry={canGeo}>
          <meshStandardMaterial {...metal} roughness={0.22} side={THREE.DoubleSide} />
        </mesh>
      </Part>

      <Part id="valvula" offset={[-2.0, 0.35, 0]} labelAt={[-1.3, CH + 0.35, 0]}>
        {/* marcas estampadas en la tapa: se abren si hay sobrepresión */}
        {[0, Math.PI / 2].map((r) => (
          <mesh key={r} position={[0, CH + 0.003, 0]} rotation={[0, r, 0]}>
            <boxGeometry args={[1.05, 0.006, 0.035]} />
            <meshStandardMaterial color="#7d8188" metalness={0.9} roughness={0.55} />
          </mesh>
        ))}
      </Part>

      {/* bobinado interno: armaduras (aluminio) y dieléctrico (papel con electrolito) */}
      <Part id="armaduras" offset={[0, 1.6, 0]} labelAt={[0.9, 2.3, 0]}>
        <mesh geometry={foil} position={[0, 0.5, 0]}>
          <meshStandardMaterial {...metal} roughness={0.35} />
        </mesh>
        {/* lengüetas que conectan cada armadura con su pata */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * LEAD_X, 0.34, 0]}>
            <boxGeometry args={[0.06, 0.34, 0.12]} />
            <meshStandardMaterial {...metal} />
          </mesh>
        ))}
      </Part>
      <Part id="dielectrico" offset={[0, 0.8, 0]} labelAt={[-0.9, 1.8, 0.2]}>
        <mesh geometry={paper} position={[0, 0.45, 0]}>
          <meshStandardMaterial color="#c9a46a" roughness={0.9} />
        </mesh>
      </Part>

      <Part id="tapon" offset={[0, -0.8, 0]} labelAt={[1.0, 0.0, 0]}>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[CR - 0.06, CR - 0.06, 0.08, 48]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.95} />
        </mesh>
      </Part>

      <Part id="positivo" offset={[0.5, -1.5, 0]} labelAt={[0.75, -2.1, 0]}>
        <Wire points={[[LEAD_X, 0.3, 0], [LEAD_X, -4.4, 0]]} radius={LEAD_R} {...tinned} />
      </Part>
      <Part id="negativo" offset={[-0.5, -1.5, 0]} labelAt={[-0.75, -1.7, 0]}>
        <Wire points={[[-LEAD_X, 0.3, 0], [-LEAD_X, -3.6, 0]]} radius={LEAD_R} {...tinned} />
      </Part>
    </group>
  )
}

// Cerámico multicapa / disco de 100 nF: Ø5 mm (1 unidad = 4 mm)
function Ceramic({ uF }: CapacitorProps) {
  const code = ceramicCode(uF)
  const tex = useCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#d6a23c'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#3a2508'
      ctx.font = 'bold 84px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(code, w / 2, h * 0.45)
      ctx.font = 'bold 40px sans-serif'
      ctx.fillText('50V', w / 2, h * 0.75)
    },
    [code],
  )
  const coat = <meshPhysicalMaterial color="#d6a23c" roughness={0.45} clearcoat={0.5} clearcoatRoughness={0.4} />
  const legs = (s: number): [number, number, number][] => [
    [s * 0.17, -0.3, 0],
    [s * 0.17, -0.75, 0],
    [s * 0.42, -0.95, 0],
    [s * 0.62, -1.1, 0],
    [s * 0.62, -1.35, 0],
    [s * 0.62, -3.6, 0],
  ]
  return (
    <group position={[0, -1.7, 0]}>
      <Part id="cuerpo" offset={[0, 0, 1.6]} labelAt={[0.9, 0.8, 0]}>
        {/* recubrimiento por inmersión: disco con una "gota" donde salen las patas */}
        <mesh scale={[1, 1, 0.36]} castShadow>
          <sphereGeometry args={[0.66, 48, 32]} />
          {coat}
        </mesh>
        <mesh position={[0, -0.5, 0]} scale={[1.2, 1, 0.55]}>
          <sphereGeometry args={[0.26, 32, 16]} />
          {coat}
        </mesh>
        <mesh position={[0, 0.03, 0.25]}>
          <circleGeometry args={[0.36, 40]} />
          <meshPhysicalMaterial map={tex} roughness={0.45} clearcoat={0.5} transparent opacity={0.97} />
        </mesh>
      </Part>
      <Part id="placas" offset={[0, 0, 0.8]} labelAt={[0.9, 0.2, 0.3]}>
        {[-0.05, 0.05].map((z) => (
          <mesh key={z} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.012, 48]} />
            <meshStandardMaterial {...metal} color="#e3e5ea" />
          </mesh>
        ))}
      </Part>
      <Part id="dielectrico" offset={[0, 0, -0.5]} labelAt={[-0.9, 0.3, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 0.088, 48]} />
          <meshStandardMaterial color="#f0ede4" roughness={0.9} />
        </mesh>
      </Part>
      <Part id="terminales" offset={[0, -1.0, 0]} labelAt={[0.9, -2.0, 0]}>
        <Wire points={legs(-1)} radius={0.0625} {...tinned} smooth={0.3} />
        <Wire points={legs(1)} radius={0.0625} {...tinned} smooth={0.3} />
      </Part>
    </group>
  )
}
