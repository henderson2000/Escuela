import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Label } from '../Label'
import { Part } from '../Part'
import { MalePin, Wire, darkPlastic, metal, useCanvasTexture } from '../helpers'

/* ------------------------------------------------------------------ */
/* Sensor ultrasónico HC-SR04                                          */
/* ------------------------------------------------------------------ */

export function UltrasonicModel({ distanceCm, showWaves }: { distanceCm: number; showWaves: boolean }) {
  const pcbTex = useCanvasTexture(
    900,
    400,
    (ctx, w, h) => {
      ctx.fillStyle = '#1d5fb8'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 34px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('HC-SR04', w / 2, 60)
      ctx.font = 'bold 40px sans-serif'
      ctx.fillText('T', w * 0.21, h * 0.5)
      ctx.fillText('R', w * 0.79, h * 0.5)
      ctx.font = 'bold 22px sans-serif'
      ;['Vcc', 'Trig', 'Echo', 'Gnd'].forEach((t, i) => ctx.fillText(t, w / 2 + (i - 1.5) * 52, h - 22))
    },
    [],
  )
  const meshTex = useCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#555'
      ctx.lineWidth = 3
      for (let i = 0; i < w; i += 14) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i + h, h)
        ctx.moveTo(i, 0)
        ctx.lineTo(i - h, h)
        ctx.stroke()
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
    out.current.position.set(-1.3 + goT * 1.3, 0, 1.35 + goT * travel)
    out.current.scale.setScalar(0.6 + goT * 1.4)
    back.current.position.set(backT * 1.3, 0, wallZ - backT * travel)
    back.current.scale.setScalar(2 - backT * 1.2)
  })

  return (
    <group>
      <Part id="placa" offset={[0, 0, -1.2]} labelAt={[0, 1.25, 0]}>
        <mesh castShadow>
          <boxGeometry args={[4.5, 2.0, 0.16]} />
          <meshStandardMaterial color="#1d5fb8" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.081]}>
          <planeGeometry args={[4.5, 2.0]} />
          <meshStandardMaterial map={pcbTex} roughness={0.5} />
        </mesh>
      </Part>
      {[
        { id: 'emisor', x: -1.3 },
        { id: 'receptor', x: 1.3 },
      ].map(({ id, x }) => (
        <Part key={id} id={id} offset={[x > 0 ? 0.8 : -0.8, 0, 1.2]} labelAt={[x, 1.1, 0.8]}>
          <mesh position={[x, 0, 0.68]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.8, 0.8, 1.2, 48, 1, true]} />
            <meshStandardMaterial {...metal} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[x, 0, 1.25]}>
            <circleGeometry args={[0.78, 48]} />
            <meshStandardMaterial map={meshTex} />
          </mesh>
          {/* disco piezoeléctrico interno */}
          <mesh position={[x, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.06, 32]} />
            <meshStandardMaterial {...metal} color="#d6b65a" />
          </mesh>
        </Part>
      ))}
      <Part id="cristal" offset={[0, 0.9, 0.6]} labelAt={[0, 0.6, 0.3]}>
        <mesh position={[0, 0.55, 0.2]} rotation={[0, 0, 0]}>
          <capsuleGeometry args={[0.14, 0.35, 8, 16]} />
          <meshStandardMaterial {...metal} />
        </mesh>
      </Part>
      <Part id="circuito" offset={[0, 0, -1.8]} labelAt={[0, -0.4, -0.3]}>
        {[-1.2, 0, 1.2].map((x) => (
          <mesh key={x} position={[x, -0.1, -0.14]}>
            <boxGeometry args={[0.8, 0.5, 0.1]} />
            <meshStandardMaterial {...darkPlastic} />
          </mesh>
        ))}
      </Part>
      <Part id="pines" offset={[0, -0.9, 0]} labelAt={[0.8, -1.5, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <group key={i}>
            <MalePin position={[(i - 1.5) * 0.254, -1.25, 0]} length={0.6} />
          </group>
        ))}
        <mesh position={[0, -1.08, 0]}>
          <boxGeometry args={[4 * 0.254, 0.2, 0.25]} />
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
/* LDR (fotorresistencia)                                              */
/* ------------------------------------------------------------------ */

export function ldrResistance(lightPct: number): number {
  // aproximación logarítmica: ~1 MΩ en oscuridad, ~200 Ω a pleno sol
  const lg = Math.log10(1e6) - (lightPct / 100) * (Math.log10(1e6) - Math.log10(200))
  return Math.round(10 ** lg)
}

function serpentine(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  ctx.strokeStyle = color
  ctx.lineWidth = w * 0.035
  ctx.lineCap = 'round'
  ctx.beginPath()
  const n = 7
  for (let i = 0; i < n; i++) {
    const y = h * (0.22 + (i * 0.56) / (n - 1))
    const x1 = w * 0.18
    const x2 = w * 0.82
    if (i === 0) ctx.moveTo(x1, y)
    if (i % 2 === 0) {
      ctx.lineTo(x2, y)
      if (i < n - 1) ctx.lineTo(x2, h * (0.22 + ((i + 1) * 0.56) / (n - 1)))
    } else {
      ctx.lineTo(x1, y)
      if (i < n - 1) ctx.lineTo(x1, h * (0.22 + ((i + 1) * 0.56) / (n - 1)))
    }
  }
  ctx.stroke()
}

export function LdrModel({ light }: { light: number }) {
  const track = useCanvasTexture(512, 512, (ctx, w, h) => serpentine(ctx, w, h, '#c4561c'), [])
  const electrodes = useCanvasTexture(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#d8dade'
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, w * 0.47, Math.PI / 2, (3 * Math.PI) / 2)
      ctx.lineTo(w * 0.16, h * 0.03)
      ctx.lineTo(w * 0.16, h * 0.97)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, w * 0.47, -Math.PI / 2, Math.PI / 2)
      ctx.lineTo(w * 0.84, h * 0.97)
      ctx.lineTo(w * 0.84, h * 0.03)
      ctx.fill()
      // "peines" que entran entre las vueltas de la pista
      for (let i = 0; i < 6; i++) {
        const y = h * (0.22 + ((i + 0.5) * 0.56) / 6)
        if (i % 2 === 0) ctx.fillRect(w * 0.16, y - 6, w * 0.6, 12)
        else ctx.fillRect(w * 0.24, y - 6, w * 0.6, 12)
      }
    },
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
        <mesh castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.18, 48]} />
          <meshStandardMaterial color="#f1ebdc" roughness={0.8} />
        </mesh>
      </Part>
      <Part id="electrodos" offset={[0, 0.7, 0]} labelAt={[-0.8, 0.12, 0]}>
        <mesh position={[0, 0.093, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.48, 48]} />
          <meshStandardMaterial map={electrodes} transparent alphaTest={0.1} metalness={0.8} roughness={0.3} />
        </mesh>
      </Part>
      <Part id="pista" offset={[0, 1.4, 0]} labelAt={[0.8, 0.12, 0]}>
        <mesh position={[0, 0.096, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.48, 48]} />
          <meshStandardMaterial map={track} transparent alphaTest={0.1} roughness={0.6} />
        </mesh>
      </Part>
      <Part id="recubrimiento" offset={[0, 2.1, 0]} labelAt={[0, 0.35, 0]}>
        <mesh position={[0, 0.1, 0]} scale={[1, 0.18, 1]}>
          <sphereGeometry args={[0.5, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.25} roughness={0.05} depthWrite={false} />
        </mesh>
      </Part>
      <Part id="terminales" offset={[0, -1.8, 0]} labelAt={[0.6, -1.5, 0]}>
        <Wire points={[[-0.3, 0, 0], [-0.3, -2.5, 0]]} radius={0.035} />
        <Wire points={[[0.3, 0, 0], [0.3, -2.5, 0]]} radius={0.035} />
      </Part>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Potenciómetro rotativo                                              */
/* ------------------------------------------------------------------ */

export function PotentiometerModel({ angle }: { angle: number }) {
  const sweep = (300 * Math.PI) / 180
  const trackGeo = useMemo(() => new THREE.TorusGeometry(0.52, 0.08, 8, 64, sweep), [sweep])
  const rot = -(angle * Math.PI) / 180 + (Math.PI * 150) / 180 + Math.PI / 2
  return (
    <group position={[0, -0.3, 0]}>
      <Part id="base" offset={[0, -0.9, 0]} labelAt={[1.0, 0, 0]}>
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.85, 0.85, 0.2, 48]} />
          <meshStandardMaterial color="#26407a" roughness={0.6} />
        </mesh>
      </Part>
      <Part id="pista" offset={[0, 0.6, 0]} labelAt={[-1.0, 0.25, 0]}>
        <mesh geometry={trackGeo} position={[0, 0.24, 0]} rotation={[-Math.PI / 2, 0, (Math.PI * 210) / 180 - Math.PI / 2 + Math.PI]}>
          <meshStandardMaterial color="#2a2a2a" roughness={0.7} />
        </mesh>
      </Part>
      <Part id="cursor" offset={[0, 1.2, 0]} labelAt={[0.6, 0.4, 0.4]}>
        <group position={[0, 0.3, 0]} rotation={[0, rot, 0]}>
          <mesh position={[0.28, 0, 0]}>
            <boxGeometry args={[0.56, 0.03, 0.12]} />
            <meshStandardMaterial {...metal} />
          </mesh>
          <mesh position={[0.52, -0.03, 0]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshStandardMaterial {...metal} />
          </mesh>
        </group>
      </Part>
      <Part id="carcasa" offset={[0, 2.0, 0]} labelAt={[1.0, 0.5, 0]}>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.88, 0.88, 0.5, 48, 1, true]} />
          <meshStandardMaterial {...metal} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.88, 0.88, 0.02, 48]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.4, 32]} />
          <meshStandardMaterial {...metal} color="#b8bcc2" />
        </mesh>
      </Part>
      <Part id="eje" offset={[0, 3.0, 0]} labelAt={[0.5, 1.9, 0]}>
        <group rotation={[0, rot, 0]}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 1.2, 24]} />
            <meshStandardMaterial color="#d0d3d8" metalness={0.8} roughness={0.35} flatShading />
          </mesh>
          {/* marca para ver hacia dónde apunta */}
          <mesh position={[0.2, 2.11, 0]}>
            <boxGeometry args={[0.3, 0.02, 0.06]} />
            <meshStandardMaterial color="#d22" />
          </mesh>
        </group>
      </Part>
      <Part id="terminales" offset={[0, -1.2, 0.6]} labelAt={[0.9, -1.4, 1.1]}>
        {[-0.5, 0, 0.5].map((x) => (
          <group key={x}>
            <mesh position={[x, 0.1, 0.95]}>
              <boxGeometry args={[0.14, 0.04, 0.3]} />
              <meshStandardMaterial {...metal} />
            </mesh>
            <mesh position={[x, -0.9, 1.08]}>
              <boxGeometry args={[0.12, 2.0, 0.04]} />
              <meshStandardMaterial {...metal} />
            </mesh>
          </group>
        ))}
        <Label position={[-0.5, -2.1, 1.1]} center style={{ pointerEvents: 'none' }}>
          <div className="pin-tag">1</div>
        </Label>
        <Label position={[0, -2.1, 1.1]} center style={{ pointerEvents: 'none' }}>
          <div className="pin-tag">2 (cursor)</div>
        </Label>
        <Label position={[0.5, -2.1, 1.1]} center style={{ pointerEvents: 'none' }}>
          <div className="pin-tag">3</div>
        </Label>
      </Part>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Pulsador táctil 6×6 mm                                              */
/* ------------------------------------------------------------------ */

export function ButtonModel({ pressed }: { pressed: boolean }) {
  const cap = useRef<THREE.Group>(null)
  const dome = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (cap.current) cap.current.position.y += ((pressed ? -0.12 : 0) - cap.current.position.y) * 0.3
    if (dome.current) dome.current.scale.y += ((pressed ? 0.25 : 1) - dome.current.scale.y) * 0.3
  })
  return (
    <group scale={2.2} position={[0, -0.4, 0]}>
      <Part id="base" offset={[0, -0.5, 0]} labelAt={[0.6, 0.1, 0.3]}>
        <mesh position={[0, 0.17, 0]} castShadow>
          <boxGeometry args={[0.6, 0.34, 0.6]} />
          <meshStandardMaterial {...darkPlastic} />
        </mesh>
      </Part>
      <Part id="contactos" offset={[0, 0.25, 0]} labelAt={[-0.55, 0.38, 0.2]}>
        <mesh position={[0, 0.345, 0]}>
          <boxGeometry args={[0.5, 0.01, 0.08]} />
          <meshStandardMaterial {...metal} color={pressed ? '#7dff9a' : '#cfd2d6'} />
        </mesh>
        <mesh ref={dome} position={[0, 0.35, 0]}>
          <sphereGeometry args={[0.18, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial {...metal} side={THREE.DoubleSide} />
        </mesh>
      </Part>
      <Part id="tapa" offset={[0, 0.7, 0]} labelAt={[0.55, 0.42, -0.3]}>
        <mesh position={[0, 0.37, 0]}>
          <boxGeometry args={[0.62, 0.02, 0.62]} />
          <meshStandardMaterial {...metal} transparent opacity={0.9} />
        </mesh>
      </Part>
      <Part id="boton" offset={[0, 1.3, 0]} labelAt={[0.35, 0.65, 0]}>
        <group ref={cap}>
          <mesh position={[0, 0.48, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.22, 32]} />
            <meshStandardMaterial color="#222" roughness={0.6} />
          </mesh>
        </group>
      </Part>
      <Part id="terminales" offset={[0, -0.6, 0]} labelAt={[0.5, -0.4, 0.4]}>
        {[
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ].map(([sx, sz]) => (
          <Wire
            key={`${sx}${sz}`}
            points={[
              [sx * 0.3, 0.05, sz * 0.25],
              [sx * 0.36, 0.0, sz * 0.25],
              [sx * 0.36, -0.15, sz * 0.25],
              [sx * 0.33, -0.25, sz * 0.25],
              [sx * 0.33, -0.45, sz * 0.25],
            ]}
            radius={0.02}
          />
        ))}
      </Part>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* DHT11: temperatura y humedad                                        */
/* ------------------------------------------------------------------ */

export function Dht11Model() {
  const front = useCanvasTexture(
    310,
    400,
    (ctx, w, h) => {
      ctx.fillStyle = '#3f8fd8'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#0d2238'
      for (let r = 0; r < 7; r++)
        for (let c = 0; c < 5; c++) ctx.fillRect(22 + c * 56, 30 + r * 44, 40, 28)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 26px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('DHT11', w / 2, h - 30)
    },
    [],
  )
  return (
    <group position={[0, 0.2, 0]}>
      <Part id="carcasa" offset={[0, 0, 1.6]} labelAt={[1.0, 0.9, 0.3]}>
        <mesh position={[0, 0, 0.18]} castShadow>
          <boxGeometry args={[1.55, 2.0, 0.24]} />
          <meshStandardMaterial color="#3f8fd8" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.301]}>
          <planeGeometry args={[1.55, 2.0]} />
          <meshStandardMaterial map={front} roughness={0.6} />
        </mesh>
      </Part>
      <Part id="tapa" offset={[0, 0, -1.2]} labelAt={[-1.0, 0.8, -0.2]}>
        <mesh position={[0, 0, -0.18]}>
          <boxGeometry args={[1.55, 2.0, 0.2]} />
          <meshStandardMaterial color="#3f8fd8" roughness={0.6} />
        </mesh>
      </Part>
      <Part id="humedad" offset={[0.9, 0.2, 0.8]} labelAt={[-0.2, 0.75, 0.2]}>
        <mesh position={[-0.2, 0.3, 0.02]}>
          <boxGeometry args={[0.7, 0.8, 0.04]} />
          <meshStandardMaterial color="#6b4a2a" roughness={0.5} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[-0.2, 0.0 + i * 0.15, 0.045]}>
            <boxGeometry args={[0.6, 0.04, 0.01]} />
            <meshStandardMaterial {...metal} color="#e2c072" />
          </mesh>
        ))}
      </Part>
      <Part id="termistor" offset={[-0.8, 0.4, 0.8]} labelAt={[0.5, 0.65, 0.2]}>
        <mesh position={[0.45, 0.4, 0.05]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <Wire points={[[0.42, 0.32, 0.05], [0.42, -0.1, 0.0]]} radius={0.012} />
        <Wire points={[[0.48, 0.32, 0.05], [0.48, -0.1, 0.0]]} radius={0.012} />
      </Part>
      <Part id="chip" offset={[0, -0.6, 0.8]} labelAt={[0, -0.25, 0.2]}>
        <mesh position={[0.1, -0.5, 0.03]}>
          <boxGeometry args={[0.45, 0.3, 0.06]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      </Part>
      <Part id="pines" offset={[0, -1.0, 0]} labelAt={[0.7, -1.6, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <MalePin key={i} position={[(i - 1.5) * 0.254, -1.4, 0]} length={0.9} />
        ))}
        <Label position={[0, -2.05, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="pin-tag">VCC · DATA · NC · GND</div>
        </Label>
      </Part>
    </group>
  )
}
