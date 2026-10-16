import * as THREE from 'three'
import { Part } from '../Part'
import { Wire, metal, useCanvasTexture } from '../helpers'

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

function Electrolytic({ uF, volts, sleeve = '#1f3fa8' }: CapacitorProps) {
  const R = 0.8
  const H = 2.2
  const tex = useCanvasTexture(
    1024,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = sleeve
      ctx.fillRect(0, 0, w, h)
      // franja del negativo
      ctx.fillStyle = '#d7dbe6'
      ctx.fillRect(w * 0.7, 0, w * 0.13, h)
      ctx.fillStyle = sleeve
      ctx.font = 'bold 90px sans-serif'
      ctx.textAlign = 'center'
      for (let i = 0; i < 4; i++) ctx.fillText('−', w * 0.765, 100 + i * 120)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 72px sans-serif'
      ctx.save()
      ctx.translate(w * 0.5, h / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText(formatCap(uF).replace(' ', ''), 0, -40)
      ctx.fillText(`${volts}V`, 0, 60)
      ctx.restore()
      ctx.font = 'bold 48px sans-serif'
      ctx.fillText('105°C', w * 0.25, h * 0.55)
    },
    [uF, volts, sleeve],
  )

  return (
    <group position={[0, -0.6, 0]}>
      <Part id="funda" offset={[2.2, 0, 0]} labelAt={[1.0, 1.6, 0]}>
        <mesh position={[0, H / 2, 0]} rotation={[0, Math.PI * 0.5, 0]} castShadow>
          <cylinderGeometry args={[R + 0.02, R + 0.02, H, 64, 1, true]} />
          <meshStandardMaterial map={tex} roughness={0.35} side={THREE.DoubleSide} />
        </mesh>
        {/* borde superior de la funda */}
        <mesh position={[0, H - 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[R - 0.02, 0.04, 8, 64]} />
          <meshStandardMaterial color={sleeve} roughness={0.35} />
        </mesh>
      </Part>

      <Part id="lata" offset={[-2.2, 0, 0]} labelAt={[-1.0, 1.0, 0]}>
        <mesh position={[0, H / 2 + 0.02, 0]}>
          <cylinderGeometry args={[R, R, H - 0.04, 64, 1, true]} />
          <meshStandardMaterial {...metal} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, H - 0.02, 0]}>
          <cylinderGeometry args={[R - 0.06, R - 0.06, 0.04, 64]} />
          <meshStandardMaterial {...metal} />
        </mesh>
      </Part>

      <Part id="valvula" offset={[-2.2, 0.3, 0]} labelAt={[-1.4, H + 0.3, 0]}>
        {[0, Math.PI / 2].map((r) => (
          <mesh key={r} position={[0, H + 0.005, 0]} rotation={[0, r, 0]}>
            <boxGeometry args={[1.1, 0.02, 0.04]} />
            <meshStandardMaterial color="#8a8d92" metalness={0.8} roughness={0.5} />
          </mesh>
        ))}
      </Part>

      {/* bobinado interno: armaduras (aluminio) y dieléctrico (papel con electrolito) */}
      <Part id="armaduras" offset={[0, 1.4, 0]} labelAt={[0.9, 2.2, 0]}>
        {[0.2, 0.36, 0.52, 0.68].map((r) => (
          <mesh key={r} position={[0, H / 2 + 0.1, 0]}>
            <cylinderGeometry args={[r, r, H - 0.5, 48, 1, true]} />
            <meshStandardMaterial {...metal} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </Part>
      <Part id="dielectrico" offset={[0, 0.7, 0]} labelAt={[-0.9, 1.8, 0.2]}>
        {[0.28, 0.44, 0.6, 0.74].map((r) => (
          <mesh key={r} position={[0, H / 2 + 0.1, 0]}>
            <cylinderGeometry args={[r, r, H - 0.4, 48, 1, true]} />
            <meshStandardMaterial color="#c9a46a" roughness={0.9} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </Part>

      <Part id="tapon" offset={[0, -0.8, 0]} labelAt={[1.0, 0.1, 0]}>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[R - 0.03, R - 0.03, 0.24, 48]} />
          <meshStandardMaterial color="#222" roughness={0.9} />
        </mesh>
      </Part>

      <Part id="positivo" offset={[0.5, -1.5, 0]} labelAt={[0.8, -1.6, 0]}>
        <Wire points={[[0.3, 0.6, 0], [0.3, -2.6, 0]]} radius={0.05} />
      </Part>
      <Part id="negativo" offset={[-0.5, -1.5, 0]} labelAt={[-0.8, -1.4, 0]}>
        <Wire points={[[-0.3, 0.6, 0], [-0.3, -2.1, 0]]} radius={0.05} />
      </Part>
    </group>
  )
}

function Ceramic({ uF }: CapacitorProps) {
  const code = ceramicCode(uF)
  const tex = useCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#d48a2a'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#2b1a08'
      ctx.font = 'bold 88px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(code, w / 2, h / 2)
    },
    [code],
  )
  return (
    <group position={[0, 0, 0]}>
      <Part id="cuerpo" offset={[0, 0, 1.6]} labelAt={[0.9, 0.8, 0]}>
        <mesh scale={[1, 1, 0.32]} castShadow>
          <sphereGeometry args={[0.8, 48, 32]} />
          <meshStandardMaterial color="#d48a2a" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.262]}>
          <circleGeometry args={[0.5, 40]} />
          <meshStandardMaterial map={tex} transparent opacity={0.95} />
        </mesh>
      </Part>
      <Part id="placas" offset={[0, 0, 0.7]} labelAt={[0.9, 0.2, 0.3]}>
        {[-0.06, 0.06].map((z) => (
          <mesh key={z} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.015, 40]} />
            <meshStandardMaterial {...metal} />
          </mesh>
        ))}
      </Part>
      <Part id="dielectrico" offset={[0, 0, -0.4]} labelAt={[-0.9, 0.3, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.6, 0.6, 0.1, 40]} />
          <meshStandardMaterial color="#f0ede4" roughness={0.9} />
        </mesh>
      </Part>
      <Part id="terminales" offset={[0, -1.2, 0]} labelAt={[0.7, -1.8, 0]}>
        <Wire points={[[-0.25, 0, 0.06], [-0.25, -0.8, 0.06], [-0.25, -2.6, 0.06]]} radius={0.04} />
        <Wire points={[[0.25, 0, -0.06], [0.25, -0.8, -0.06], [0.25, -2.6, -0.06]]} radius={0.04} />
      </Part>
    </group>
  )
}
