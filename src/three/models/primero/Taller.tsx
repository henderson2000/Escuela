import { useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import { Part } from '../../Part'
import { BallPeenHammer, CenterPunch, Scriber, SteelRule, SurfaceGauge, SurfacePlate, TrySquare } from './herramientas'
import { useCanvasTexture } from '../../helpers'
export { INSTRUMENTOS_PARTS, MORSA_PARTS } from './Taller.data'

// Herramientas e instrumentos de banco. 1 unidad = 1 cm.

const STEEL = { color: '#c9ced5', metalness: 0.95, roughness: 0.25 }
const DARK_STEEL = { color: '#5a6069', metalness: 0.85, roughness: 0.4 }
const CAST = { color: '#2f5f8a', metalness: 0.4, roughness: 0.55 }

export function InstrumentosModel() {
  return (
    <group>
      <Part id="marmol" offset={[0, -3, 0]} labelAt={[-17, 0.5, 11.5]}>
        <SurfacePlate w={40} d={26} h={6} />
      </Part>
      <Part id="regla" offset={[0, 3, 6]} labelAt={[-10, 0.6, 10.5]}>
        <group position={[-3, 0, 10.5]}>
          <SteelRule length={30} />
        </group>
      </Part>
      <Part id="escuadra" offset={[0, 3, -6]} labelAt={[8, 1.5, -10.5]}>
        <group position={[-2, 0, -12]}>
          <TrySquare blade={20} stock={12} />
        </group>
      </Part>
      <Part id="gramil" offset={[-5, 3, -4]} labelAt={[-13, 24, -8.5]}>
        <group position={[-13, 0, -8.5]} rotation={[0, Math.PI, 0]}>
          <SurfaceGauge height={10} />
        </group>
      </Part>
      <Part id="punta" offset={[0, 3, 0]} labelAt={[12, 1.2, -4]}>
        <group position={[9.5, 0.28, -4]} rotation={[0, 0.1, 0]}>
          <Scriber />
        </group>
      </Part>
      <Part id="granete" offset={[4, 3, 0]} labelAt={[8, 1.5, -0.5]}>
        <group position={[2, 0.5, -0.5]} rotation={[0, 0.15, 0]}>
          <CenterPunch />
        </group>
      </Part>
      <Part id="martillo" offset={[0, 4, 4]} labelAt={[-15, 3.2, 4]}>
        {/* acostado: la cabeza apoya de costado y el mango baja apenas hasta la mesa */}
        <group position={[-15, 1.25, 4]} rotation={[0, 1.52, 0]}>
          <group rotation={[-Math.PI / 2 + 0.02, 0, 0]}>
            <BallPeenHammer len={30} />
          </group>
        </group>
      </Part>
    </group>
  )
}

/* ================================================================== morsa */

export interface MorsaParams {
  apertura: number
  pieza: boolean
}

/** Cuerpo de fundición: perfil lateral (z, y) extruido a lo ancho (x), centrado. */
function useSideBody(draw: (s: THREE.Shape) => void, width: number) {
  return useMemo(() => {
    const s = new THREE.Shape()
    draw(s)
    const depth = width - 0.5
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.25, bevelThickness: 0.25, bevelSegments: 2, curveSegments: 16 })
    g.translate(0, 0, -depth / 2)
    g.rotateY(-Math.PI / 2) // x del perfil → z del mundo
    g.computeVertexNormals()
    return g
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

function HexBolt({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.62, 0.62, 0.5, 6]} />
        <meshStandardMaterial {...DARK_STEEL} />
      </mesh>
      <mesh position={[0, -0.32, 0]}>
        <cylinderGeometry args={[0.95, 0.95, 0.14, 24]} />
        <meshStandardMaterial {...DARK_STEEL} />
      </mesh>
    </group>
  )
}

export function MorsaModel({ apertura, pieza }: MorsaParams) {
  const open = 2.4 + (apertura / 100) * 8 // separación entre mordientes (cm)
  const jaws = useCanvasTexture(
    64,
    64,
    (ctx, w, h) => {
      ctx.fillStyle = '#9aa1aa'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#555b63'
      ctx.lineWidth = 3
      for (let k = -h; k < w + h; k += 8) {
        ctx.beginPath()
        ctx.moveTo(k, 0)
        ctx.lineTo(k + h, h)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(k + h, 0)
        ctx.lineTo(k, h)
        ctx.stroke()
      }
    },
    [],
  )
  jaws.wrapS = jaws.wrapT = THREE.RepeatWrapping
  jaws.repeat.set(4, 1)
  // rosca del husillo: anillos oscuros a lo largo
  const thread = useCanvasTexture(
    8,
    32,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, '#6c727a')
      g.addColorStop(0.45, '#e2e6ea')
      g.addColorStop(0.55, '#e2e6ea')
      g.addColorStop(1, '#6c727a')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
    },
    [],
  )
  thread.wrapS = thread.wrapT = THREE.RepeatWrapping
  thread.repeat.set(1, 60)

  // perfil del cuerpo fijo con el yunque arriba, atrás
  const fixedGeo = useSideBody((s) => {
    s.moveTo(-1.6, 4.4)
    s.lineTo(-1.6, 12.1)
    s.lineTo(-3.4, 12.1)
    s.lineTo(-3.4, 12.9)
    s.lineTo(-9.2, 12.9)
    s.quadraticCurveTo(-10.6, 12.9, -10.6, 12.3)
    s.lineTo(-9.4, 11.5)
    s.quadraticCurveTo(-7.0, 11.3, -6.9, 9.4)
    s.quadraticCurveTo(-6.9, 5.6, -7.8, 4.4)
    s.lineTo(-1.6, 4.4)
  }, 11)
  // perfil de la mordaza móvil (coordenadas relativas a su posición)
  const movingGeo = useSideBody((s) => {
    s.moveTo(-0.65, 5.0)
    s.lineTo(-0.65, 12.1)
    s.lineTo(2.0, 12.1)
    s.quadraticCurveTo(2.9, 12.1, 3.0, 11.0)
    s.quadraticCurveTo(3.2, 8.4, 3.6, 7.6)
    s.lineTo(3.6, 5.0)
    s.lineTo(-0.65, 5.0)
  }, 11)

  const SCREW_Y = 6.2
  const SCREW_LEN = 18
  const slideLen = open + 5.35
  const turn = (apertura / 100) * Math.PI * 3

  return (
    <group>
      <Part id="base" offset={[0, -3, 0]} labelAt={[0, 1.6, 6.5]}>
        <RoundedBox args={[15, 1.2, 11]} radius={0.3} position={[0, 0.6, 0]} castShadow receiveShadow>
          <meshStandardMaterial {...CAST} />
        </RoundedBox>
        {[-6, 6].flatMap((x) => [-4, 4].map((z) => <HexBolt key={`${x}${z}`} position={[x, 1.55, z]} />))}
        {/* plato giratorio */}
        <mesh position={[0, 1.95, -3]} castShadow>
          <cylinderGeometry args={[5, 5.2, 1.5, 40]} />
          <meshStandardMaterial {...CAST} />
        </mesh>
        <mesh position={[0, 3.6, -3.4]} castShadow>
          <cylinderGeometry args={[4.2, 4.6, 1.8, 40]} />
          <meshStandardMaterial {...CAST} />
        </mesh>
        {/* traba del giro */}
        <group position={[5.1, 2, -3]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.28, 0.28, 2.4, 12]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
          <mesh position={[1.2, 0, 0]}>
            <sphereGeometry args={[0.5, 16, 12]} />
            <meshStandardMaterial color="#1d1f22" roughness={0.6} />
          </mesh>
        </group>
      </Part>
      <Part id="fija" offset={[0, 0, -4]} labelAt={[0, 13.6, -7]}>
        <mesh geometry={fixedGeo} castShadow receiveShadow>
          <meshStandardMaterial {...CAST} />
        </mesh>
        {/* cara del yunque, mecanizada */}
        <mesh position={[0, 12.92, -6.3]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10.4, 5.4]} />
          <meshStandardMaterial {...STEEL} roughness={0.35} polygonOffset polygonOffsetFactor={-1} />
        </mesh>
      </Part>
      <Part id="movil" offset={[0, 0, 6]} labelAt={[0, 13, open + 2]}>
        <group position={[0, 0, open]}>
          <mesh geometry={movingGeo} castShadow receiveShadow>
            <meshStandardMaterial {...CAST} />
          </mesh>
          {/* guía (corredera) que entra en el cuerpo fijo */}
          <mesh position={[0, 8.5, -0.65 - slideLen / 2]} castShadow>
            <boxGeometry args={[4.6, 2.2, slideLen]} />
            <meshStandardMaterial {...CAST} />
          </mesh>
        </group>
      </Part>
      <Part id="mordazas" offset={[0, 4, 0]} labelAt={[6.5, 12.5, 0]}>
        <mesh position={[0, 10.8, -1.3]} castShadow>
          <boxGeometry args={[11.6, 2.6, 0.6]} />
          <meshStandardMaterial map={jaws} {...STEEL} />
        </mesh>
        <mesh position={[0, 10.8, open - 0.95]} castShadow>
          <boxGeometry args={[11.6, 2.6, 0.6]} />
          <meshStandardMaterial map={jaws} {...STEEL} />
        </mesh>
        {/* tornillos de las bocas */}
        {[-3.6, 3.6].flatMap((x) => [
          <mesh key={`f${x}`} position={[x, 10.8, -0.99]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.38, 0.38, 0.04, 16]} />
            <meshStandardMaterial {...DARK_STEEL} />
          </mesh>,
          <mesh key={`m${x}`} position={[x, 10.8, open - 1.26]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.38, 0.38, 0.04, 16]} />
            <meshStandardMaterial {...DARK_STEEL} />
          </mesh>,
        ])}
      </Part>
      <Part id="tornillo" offset={[0, -2, 4]} labelAt={[0, 4.6, open + 1.2]}>
        <group position={[0, SCREW_Y, open]}>
          {/* el husillo es solidario a la mordaza móvil: atraviesa la tuerca del cuerpo y asoma por detrás */}
          <mesh position={[0, 0, 3.6 - SCREW_LEN / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.6, 0.6, SCREW_LEN, 20]} />
            <meshStandardMaterial map={thread} metalness={0.9} roughness={0.35} />
          </mesh>
          {/* buje donde pasa la palanca */}
          <mesh position={[0, 0, 4.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[1.25, 1.25, 1.3, 28]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
        </group>
      </Part>
      <Part id="palanca" offset={[0, -2, 8]} labelAt={[6.5, SCREW_Y, open + 4.3]}>
        <group position={[0, SCREW_Y, open + 4.3]} rotation={[0, 0, turn]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.4, 0.4, 12, 16]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
          {[-6.1, 6.1].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <sphereGeometry args={[0.75, 16, 12]} />
              <meshStandardMaterial {...STEEL} />
            </mesh>
          ))}
        </group>
      </Part>
      {pieza && open < 3.4 && (
        <Part id="pieza" offset={[0, 6, 0]} labelAt={[-8, 13.2, 0]}>
          <mesh position={[-1, 11.6, (open - 2.25) / 2]} castShadow>
            <boxGeometry args={[11, 2.2, 2.2]} />
            <meshStandardMaterial color="#b9bec6" metalness={0.9} roughness={0.35} />
          </mesh>
        </Part>
      )}
    </group>
  )
}
