// Componentes de la mesa de trabajo que no están en el juego de la protoboard:
// LDR, buzzer, servo SG90 y sensor ultrasónico HC-SR04.
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Wire, useCanvasTexture } from '../../three/helpers'
import { Label } from '../../three/Label'
import { useKeepRendering } from '../../three/keepRendering'
import type { Placed } from '../../lib/circuit'

const legMetal = { color: '#c9ccd1', metalness: 0.9, roughness: 0.3 }

interface Props {
  item: Placed
  termPos: (t: string) => THREE.Vector3
  /** altura de la mesa (debajo de la protoboard) en coordenadas de la escena */
  floorY: number
  /** borde delantero de la protoboard (z) */
  frontZ: number
  angle?: number
  sounding?: boolean
  distance?: number
  onClick?: () => void
}

export function BenchItem(p: Props) {
  const handlers = p.onClick
    ? {
        onClick: (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          p.onClick!()
        },
        onPointerOver: () => (document.body.style.cursor = 'not-allowed'),
        onPointerOut: () => (document.body.style.cursor = ''),
      }
    : {}
  return (
    <group {...handlers}>
      {p.item.kind === 'ldr' && <Ldr {...p} />}
      {p.item.kind === 'buzzer' && <Buzzer {...p} />}
      {p.item.kind === 'servo' && <Servo {...p} />}
      {p.item.kind === 'ultrasonico' && <Ultrasonic {...p} />}
    </group>
  )
}

/* ------------------------------------------------------------------ LDR */

function Ldr({ item, termPos }: Props) {
  const [a, b] = item.legs.map(termPos)
  const mid = a.clone().add(b).multiplyScalar(0.5)
  const ang = Math.atan2(-(b.z - a.z), b.x - a.x)
  const face = useCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#efe7d6'
      ctx.fillRect(0, 0, w, h)
      // pista de sulfuro de cadmio en zigzag entre los dos peines
      ctx.strokeStyle = '#c45a2a'
      ctx.lineWidth = 13
      ctx.lineJoin = 'round'
      ctx.beginPath()
      for (let i = 0; i < 8; i++) {
        const y = 40 + i * 25
        ctx.lineTo(i % 2 ? 210 : 46, y)
        ctx.lineTo(i % 2 ? 46 : 210, y)
      }
      ctx.stroke()
      ctx.fillStyle = '#c9a14a'
      ctx.fillRect(18, 0, 22, h)
      ctx.fillRect(w - 40, 0, 22, h)
    },
    [],
  )
  const top = mid.y + 0.55
  return (
    <group>
      {[a, b].map((p, i) => (
        <Wire key={i} points={[[p.x, p.y, p.z], [p.x, p.y + 0.3, p.z], [mid.x + (p.x - mid.x) * 0.35, top - 0.2, mid.z + (p.z - mid.z) * 0.35]]} radius={0.016} {...legMetal} />
      ))}
      <group position={[mid.x, top, mid.z]} rotation={[0, ang, 0]}>
        <mesh rotation={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.25, 0.25, 0.1, 32]} />
          <meshStandardMaterial color="#e8e0cf" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.051, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.24, 32]} />
          <meshPhysicalMaterial map={face} roughness={0.2} clearcoat={1} />
        </mesh>
      </group>
    </group>
  )
}

/* ------------------------------------------------------------------ buzzer */

function Buzzer({ item, termPos, sounding }: Props) {
  const [a, b] = item.legs.map(termPos)
  const mid = a.clone().add(b).multiplyScalar(0.5)
  const ring = useRef<THREE.Mesh>(null)
  const body = useRef<THREE.Group>(null)
  useKeepRendering(!!sounding, 30)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (ring.current) {
      const k = (t * 2.2) % 1
      ring.current.visible = !!sounding
      ring.current.scale.setScalar(1 + k * 1.6)
      ;(ring.current.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - k)
    }
    if (body.current) body.current.position.x = sounding ? Math.sin(t * 90) * 0.006 : 0
  })
  const y = mid.y + 0.18
  return (
    <group>
      {[a, b].map((p, i) => (
        <Wire key={i} points={[[p.x, p.y, p.z], [p.x, y, p.z]]} radius={0.016} {...legMetal} />
      ))}
      <group ref={body} position={[mid.x, y, mid.z]}>
        <mesh position={[0, 0.24, 0]} castShadow>
          <cylinderGeometry args={[0.6, 0.6, 0.48, 40]} />
          <meshStandardMaterial color="#141416" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.481, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.05, 0.12, 24]} />
          <meshStandardMaterial color="#2a2a2e" />
        </mesh>
        <mesh position={[0, 0.482, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.05, 20]} />
          <meshStandardMaterial color="#000" />
        </mesh>
        <mesh ref={ring} position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
          <ringGeometry args={[0.6, 0.66, 40]} />
          <meshBasicMaterial color="#ffd400" transparent opacity={0.5} depthWrite={false} />
        </mesh>
      </group>
      <Label position={[a.x, a.y + 0.15, a.z]} center style={{ pointerEvents: 'none' }}>
        <div className="pin-tag">+</div>
      </Label>
    </group>
  )
}

/* ------------------------------------------------------------------ servo SG90 */

function Servo({ item, termPos, floorY, frontZ, angle = 90 }: Props) {
  const ps = item.legs.map(termPos)
  const mid = ps[1]
  // el cuerpo queda apoyado en la mesa, delante de la protoboard
  const body = new THREE.Vector3(mid.x, floorY, frontZ + 2.2)
  const horn = useRef<THREE.Group>(null)
  const target = ((angle - 90) * Math.PI) / 180
  useFrame((_, dt) => {
    if (!horn.current) return
    // el servo real tarda ~0,1 s cada 60°
    const cur = horn.current.rotation.y
    const step = Math.sign(target - cur) * Math.min(Math.abs(target - cur), dt * 10)
    horn.current.rotation.y = cur + step
  })
  useKeepRendering(true, 30)
  const colors = ['#6b3e1f', '#c81e1e', '#f28c18']
  const label = useCanvasTexture(
    256,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#1d4ed8'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 44px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('SG90', w / 2, 58)
      ctx.font = '22px Arial'
      ctx.fillText('MICRO SERVO 9g', w / 2, 96)
    },
    [],
  )
  return (
    <group>
      {/* conector y cable de tres hilos */}
      <mesh position={[mid.x, mid.y + 0.25, mid.z]}>
        <boxGeometry args={[0.78, 0.5, 0.26]} />
        <meshStandardMaterial color="#111" roughness={0.6} />
      </mesh>
      {ps.map((p, i) => (
        <Wire
          key={i}
          points={[
            [p.x, p.y + 0.5, p.z],
            [p.x, p.y + 1.2, p.z + 0.4],
            [body.x - 0.15 + i * 0.15, floorY + 1.6, (p.z + body.z) / 2 + 0.6],
            [body.x - 0.15 + i * 0.15, floorY + 1.2, body.z - 0.7],
          ]}
          radius={0.04}
          color={colors[i]}
          metalness={0.05}
          roughness={0.55}
        />
      ))}
      <group position={[body.x, floorY, body.z]}>
        <RoundedBox args={[2.3, 2.25, 1.22]} radius={0.06} smoothness={3} position={[0, 1.125, 0]} castShadow>
          <meshPhysicalMaterial color="#2f6fe0" roughness={0.35} transmission={0.25} thickness={0.5} clearcoat={0.4} />
        </RoundedBox>
        {/* orejas de montaje */}
        <RoundedBox args={[3.2, 0.25, 1.22]} radius={0.04} smoothness={2} position={[0, 1.7, 0]} castShadow>
          <meshPhysicalMaterial color="#2f6fe0" roughness={0.35} transmission={0.25} thickness={0.3} />
        </RoundedBox>
        <mesh position={[0, 1.15, 0.612]}>
          <planeGeometry args={[1.6, 0.8]} />
          <meshStandardMaterial map={label} />
        </mesh>
        <RoundedBox args={[1.2, 0.5, 1.22]} radius={0.05} smoothness={2} position={[0.55, 2.5, 0]} castShadow>
          <meshPhysicalMaterial color="#2f6fe0" roughness={0.35} transmission={0.25} thickness={0.3} />
        </RoundedBox>
        <mesh position={[0.6, 2.85, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 0.3, 24]} />
          <meshStandardMaterial color="#e9e9e4" roughness={0.5} />
        </mesh>
        {/* brazo (horn) que gira */}
        <group ref={horn} position={[0.6, 3.04, 0]}>
          <mesh>
            <cylinderGeometry args={[0.28, 0.28, 0.1, 24]} />
            <meshStandardMaterial color="#f5f5f0" roughness={0.45} />
          </mesh>
          <mesh position={[0, 0, -0.9]}>
            <boxGeometry args={[0.32, 0.1, 1.8]} />
            <meshStandardMaterial color="#f5f5f0" roughness={0.45} />
          </mesh>
          <mesh position={[0, 0, -1.8]}>
            <cylinderGeometry args={[0.16, 0.16, 0.1, 20]} />
            <meshStandardMaterial color="#f5f5f0" roughness={0.45} />
          </mesh>
        </group>
      </group>
      <Label position={[body.x, floorY + 3.5, body.z]} center style={{ pointerEvents: 'none' }}>
        <div className="pin-tag">{Math.round(angle)}°</div>
      </Label>
    </group>
  )
}

/* ------------------------------------------------------------------ HC-SR04 */

function Ultrasonic({ item, termPos, distance = 30 }: Props) {
  const ps = item.legs.map(termPos)
  const a = ps[0]
  const d = ps[3]
  const mid = a.clone().add(d).multiplyScalar(0.5)
  const ang = Math.atan2(-(d.z - a.z), d.x - a.x)
  const board = useCanvasTexture(
    512,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#1c5bb8'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 26px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('HC-SR04', w / 2, 40)
      ctx.font = 'bold 22px Arial'
      ;['Vcc', 'Trig', 'Echo', 'Gnd'].forEach((t, i) => ctx.fillText(t, w / 2 - 96 + i * 64, h - 18))
      ctx.fillText('T', 70, 40)
      ctx.fillText('R', w - 70, 40)
    },
    [],
  )
  const wall = Math.min(distance, 40)
  const mesh = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const x = c.getContext('2d')!
    x.fillStyle = '#9aa0a6'
    x.fillRect(0, 0, 64, 64)
    x.fillStyle = '#2b2f33'
    for (let i = 0; i < 64; i += 8) for (let j = 0; j < 64; j += 8) x.fillRect(i + 2, j + 2, 4, 4)
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(3, 3)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  return (
    <group>
      {ps.map((p, i) => (
        <mesh key={i} position={[p.x, p.y + 0.15, p.z]}>
          <boxGeometry args={[0.064, 0.3, 0.064]} />
          <meshStandardMaterial color="#d8b25a" metalness={1} roughness={0.25} />
        </mesh>
      ))}
      <group position={[mid.x, mid.y + 0.3, mid.z]} rotation={[0, ang, 0]}>
        <mesh position={[0, 1.0, 0]} castShadow>
          <boxGeometry args={[4.5, 2.0, 0.16]} />
          <meshStandardMaterial color="#1c5bb8" roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.0, 0.081]}>
          <planeGeometry args={[4.5, 2.0]} />
          <meshStandardMaterial map={board} roughness={0.5} />
        </mesh>
        {[-1.3, 1.3].map((x) => (
          <group key={x} position={[x, 1.15, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh position={[0, 0.6, 0]} castShadow>
              <cylinderGeometry args={[0.8, 0.8, 1.2, 40, 1, true]} />
              <meshStandardMaterial color="#cfd3d8" metalness={0.9} roughness={0.3} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 1.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.78, 40]} />
              <meshStandardMaterial map={mesh} roughness={0.8} />
            </mesh>
          </group>
        ))}
        {/* obstáculo frente al sensor */}
        {distance <= 40 && (
          <mesh position={[0, 1.2, 1.3 + wall]} userData={{ noBounds: true }}>
            <boxGeometry args={[5, 3, 0.2]} />
            <meshStandardMaterial color="#a8763e" roughness={0.8} transparent opacity={0.85} />
          </mesh>
        )}
      </group>
      <Label position={[mid.x, mid.y + 2.8, mid.z]} center style={{ pointerEvents: 'none' }}>
        <div className="pin-tag">obstáculo a {Math.round(distance)} cm</div>
      </Label>
    </group>
  )
}
