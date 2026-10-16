import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Part } from '../Part'
import { Label } from '../Label'
import { Wire, darkPlastic, metal, useCanvasTexture } from '../helpers'

/** Engranaje recto extruido (dientes trapezoidales). */
function useGear(teeth: number, r: number, depth: number, hole = 0.04) {
  return useMemo(() => {
    const s = new THREE.Shape()
    const rIn = r * 0.86
    for (let i = 0; i < teeth; i++) {
      const a0 = (i / teeth) * Math.PI * 2
      const step = (Math.PI * 2) / teeth
      const pts: [number, number][] = [
        [rIn, a0],
        [r, a0 + step * 0.2],
        [r, a0 + step * 0.5],
        [rIn, a0 + step * 0.7],
      ]
      pts.forEach(([rr, a], k) => {
        const x = Math.cos(a) * rr
        const y = Math.sin(a) * rr
        if (i === 0 && k === 0) s.moveTo(x, y)
        else s.lineTo(x, y)
      })
    }
    s.closePath()
    const h = new THREE.Path()
    h.absarc(0, 0, hole, 0, Math.PI * 2, true)
    s.holes.push(h)
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 8 })
    g.rotateX(-Math.PI / 2)
    return g
  }, [teeth, r, depth, hole])
}

/* ------------------------------------------------------------------ */
/* Servomotor SG90                                                     */
/* ------------------------------------------------------------------ */

export function ServoModel({ angle }: { angle: number }) {
  // medidas reales aprox. (1 unidad = 10 mm): cuerpo 22,8 × 12,2 × 22,7 mm
  const W = 2.28
  const D = 1.22
  const H = 2.27
  const shaftX = W / 2 - 0.6
  const label = useCanvasTexture(
    512,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#1d4fb8'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#fff'
      ctx.textAlign = 'center'
      ctx.font = 'bold 76px sans-serif'
      ctx.fillText('SG90', w / 2, h * 0.48)
      ctx.font = '30px sans-serif'
      ctx.fillText('MICRO SERVO 9g', w / 2, h * 0.75)
    },
    [],
  )
  const gearBig = useGear(36, 0.42, 0.08)
  const gearMid = useGear(28, 0.32, 0.08)
  const gearSmall = useGear(10, 0.12, 0.14)
  const horn = useRef<THREE.Group>(null)
  const gearRef = useRef<THREE.Group>(null)
  const target = ((angle - 90) * Math.PI) / 180

  useFrame(() => {
    if (horn.current) {
      const cur = horn.current.rotation.y
      horn.current.rotation.y += (-target - cur) * 0.12
      if (gearRef.current) gearRef.current.rotation.y = horn.current.rotation.y
    }
  })

  const shell = (
    <meshPhysicalMaterial color="#2a62d8" transparent opacity={0.82} roughness={0.25} clearcoat={0.6} />
  )

  return (
    <group position={[0, -0.6, 0]}>
      <Part id="carcasa" offset={[0, 0, 1.8]} labelAt={[-1.4, 1.6, 0.6]}>
        <mesh position={[0, H / 2, 0]} castShadow>
          <boxGeometry args={[W, H * 0.62, D]} />
          {shell}
        </mesh>
        {/* orejas de montaje */}
        <mesh position={[0, H * 0.72, 0]}>
          <boxGeometry args={[3.22, 0.25, D]} />
          {shell}
        </mesh>
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 1.4, H * 0.72 + 0.126, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.07, 0.12, 20]} />
            <meshStandardMaterial color="#0b1d44" />
          </mesh>
        ))}
        <mesh position={[0, H / 2 + 0.05, D / 2 + 0.002]}>
          <planeGeometry args={[1.8, 0.9]} />
          <meshStandardMaterial map={label} />
        </mesh>
      </Part>
      <Part id="tapa" offset={[0, 1.7, 0]} labelAt={[-0.8, 2.7, 0]}>
        <mesh position={[0, H * 0.84 + 0.2, 0]}>
          <boxGeometry args={[W, 0.4, D]} />
          {shell}
        </mesh>
        <mesh position={[shaftX, H * 0.84 + 0.48, 0]}>
          <cylinderGeometry args={[0.6, 0.6, 0.16, 32]} />
          {shell}
        </mesh>
      </Part>
      <Part id="engranajes" offset={[0, 0.9, 0]} labelAt={[0.2, 2.25, 0.7]}>
        <group ref={gearRef} position={[shaftX, H * 0.84 + 0.1, 0]}>
          <mesh geometry={gearBig}>
            <meshStandardMaterial color="#f2f2ee" roughness={0.6} />
          </mesh>
        </group>
        <mesh geometry={gearMid} position={[shaftX - 0.62, H * 0.84 + 0.18, 0]}>
          <meshStandardMaterial color="#f2f2ee" roughness={0.6} />
        </mesh>
        <mesh geometry={gearSmall} position={[shaftX - 0.62, H * 0.84 + 0.04, 0]}>
          <meshStandardMaterial color="#e8e8e2" roughness={0.6} />
        </mesh>
      </Part>
      <Part id="eje" offset={[0, 2.5, 0]} labelAt={[shaftX + 0.6, 3.3, 0]}>
        <group ref={horn} position={[shaftX, H * 0.84 + 0.62, 0]}>
          <mesh>
            <cylinderGeometry args={[0.2, 0.2, 0.3, 24]} />
            <meshStandardMaterial color="#f5f5f2" roughness={0.5} />
          </mesh>
          {/* brazo (horn) */}
          <mesh position={[0.7, 0.12, 0]}>
            <boxGeometry args={[1.4, 0.08, 0.32]} />
            <meshStandardMaterial color="#f5f5f2" roughness={0.5} />
          </mesh>
          <mesh position={[1.4, 0.12, 0]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.08, 20]} />
            <meshStandardMaterial color="#f5f5f2" roughness={0.5} />
          </mesh>
          {[0.5, 0.8, 1.1, 1.4].map((x) => (
            <mesh key={x} position={[x, 0.165, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.035, 12]} />
              <meshStandardMaterial color="#555" />
            </mesh>
          ))}
        </group>
      </Part>
      <Part id="motor" offset={[0, 0, -2.0]} labelAt={[-0.5, 0.5, -0.7]}>
        <mesh position={[-0.45, 0.85, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 1.2, 28]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        <mesh position={[-0.45, 1.5, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
          <meshStandardMaterial {...metal} />
        </mesh>
      </Part>
      <Part id="potenciometro" offset={[2.0, 0, -1.4]} labelAt={[0.8, 0.4, -0.7]}>
        <mesh position={[shaftX, 0.85, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.5, 24]} />
          <meshStandardMaterial color="#2b3a55" metalness={0.3} roughness={0.5} />
        </mesh>
      </Part>
      <Part id="placa" offset={[0, -1.6, 0]} labelAt={[0.9, -0.1, 0.4]}>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[2.0, 0.08, 1.0]} />
          <meshStandardMaterial color="#1f6b35" roughness={0.6} />
        </mesh>
        <mesh position={[0.3, 0.27, 0.1]}>
          <boxGeometry args={[0.4, 0.06, 0.3]} />
          <meshStandardMaterial {...darkPlastic} />
        </mesh>
      </Part>
      <Part id="cables" offset={[-1.4, 0, 0]} labelAt={[-2.6, 0.4, 0]}>
        {[
          ['#6b3a1e', -0.08],
          ['#e02424', 0],
          ['#f28a10', 0.08],
        ].map(([c, z]) => (
          <Wire
            key={c as string}
            points={[
              [-W / 2 + 0.1, 0.35, z as number],
              [-W / 2 - 0.5, 0.3, z as number],
              [-W / 2 - 1.2, 0.0, (z as number) * 1.2],
              [-W / 2 - 1.8, -0.3, (z as number) * 1.2],
            ]}
            radius={0.04}
            color={c as string}
            metalness={0.05}
            roughness={0.6}
          />
        ))}
        <mesh position={[-W / 2 - 2.05, -0.38, 0]} rotation={[0, 0, -0.4]}>
          <boxGeometry args={[0.5, 0.26, 0.78]} />
          <meshStandardMaterial {...darkPlastic} />
        </mesh>
        <Label position={[-W / 2 - 2.0, -0.9, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="pin-tag">marrón GND · rojo 5V · naranja señal</div>
        </Label>
      </Part>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Buzzer piezoeléctrico                                               */
/* ------------------------------------------------------------------ */

export function BuzzerModel({ playing, active }: { playing: boolean; active: boolean }) {
  const R = 0.6
  const H = 0.95
  const rings = useRef<THREE.Group>(null)
  const disc = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (rings.current) {
      rings.current.visible = playing
      rings.current.children.forEach((m, i) => {
        const p = (t * 0.9 + i / 3) % 1
        m.position.y = H + 0.1 + p * 1.6
        m.scale.setScalar(0.6 + p * 1.6)
        ;((m as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.8
      })
    }
    if (disc.current) disc.current.position.y = H - 0.18 + (playing ? Math.sin(t * 80) * 0.01 : 0)
  })
  const top = useCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#151515'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 54px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('+', w * 0.78, h * 0.32)
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, w * 0.07, 0, Math.PI * 2)
      ctx.fill()
    },
    [],
  )

  return (
    <group position={[0, -0.3, 0]}>
      <Part id="carcasa" offset={[0, 0, 2.0]} labelAt={[1.0, 0.6, 0]}>
        <mesh position={[0, H / 2, 0]} castShadow>
          <cylinderGeometry args={[R, R, H, 48, 1, true]} />
          <meshStandardMaterial color="#141414" roughness={0.55} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, H, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[R, 48]} />
          <meshStandardMaterial map={top} roughness={0.5} />
        </mesh>
      </Part>
      <Part id="disco" offset={[0, 1.5, 0]} labelAt={[0.9, 1.1, 0]}>
        <mesh ref={disc} position={[0, H - 0.18, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 0.02, 40]} />
          <meshStandardMaterial color="#d6b65a" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, H - 0.165, 0]}>
          <cylinderGeometry args={[0.33, 0.33, 0.02, 40]} />
          <meshStandardMaterial color="#f2f0ea" roughness={0.8} />
        </mesh>
      </Part>
      {active && (
        <Part id="oscilador" offset={[0, 0.8, 0]} labelAt={[-0.9, 0.4, 0]}>
          <mesh position={[0, 0.25, 0]}>
            <boxGeometry args={[0.7, 0.05, 0.7]} />
            <meshStandardMaterial color="#1f6b35" />
          </mesh>
          <mesh position={[0.1, 0.31, 0]}>
            <boxGeometry args={[0.25, 0.08, 0.18]} />
            <meshStandardMaterial {...darkPlastic} />
          </mesh>
        </Part>
      )}
      <Part id="base" offset={[0, -0.7, 0]} labelAt={[-0.9, 0.0, 0]}>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[R - 0.01, R - 0.01, 0.06, 48]} />
          <meshStandardMaterial color={active ? '#222' : '#1f6b35'} roughness={0.8} />
        </mesh>
      </Part>
      <Part id="positivo" offset={[0.5, -1.2, 0]} labelAt={[0.65, -1.7, 0]}>
        <Wire points={[[0.33, 0.05, 0], [0.33, -2.3, 0]]} radius={0.035} />
      </Part>
      <Part id="negativo" offset={[-0.5, -1.2, 0]} labelAt={[-0.65, -1.4, 0]}>
        <Wire points={[[-0.33, 0.05, 0], [-0.33, -1.9, 0]]} radius={0.035} />
      </Part>
      <group ref={rings}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.5, 0.02, 8, 48]} />
            <meshBasicMaterial color="#5ad1ff" transparent opacity={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Transistor NPN en encapsulado TO-92                                 */
/* ------------------------------------------------------------------ */

export const TRANSISTORS = {
  BC547: { pins: ['C', 'B', 'E'], beta: 200, icMax: 100, label: 'BC547' },
  '2N2222': { pins: ['E', 'B', 'C'], beta: 150, icMax: 600, label: '2N2222' },
} as const
export type TransistorName = keyof typeof TRANSISTORS

const PIN_NAMES: Record<string, string> = { C: 'Colector', B: 'Base', E: 'Emisor' }

export function TransistorModel({ model, conducting }: { model: TransistorName; conducting: number }) {
  const t = TRANSISTORS[model]
  const R = 0.55
  const H = 0.9
  // cuerpo con forma de "D": medio cilindro con una cara plana
  const bodyGeo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-R, 0)
    s.lineTo(R, 0)
    s.absarc(0, 0, R, 0, Math.PI, false)
    s.closePath()
    const g = new THREE.ExtrudeGeometry(s, { depth: H, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2, curveSegments: 40 })
    g.rotateX(-Math.PI / 2)
    return g
  }, [])
  const face = useCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#161616'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#d8d8d8'
      ctx.textAlign = 'center'
      ctx.font = 'bold 50px sans-serif'
      ctx.fillText(t.label, w / 2, h * 0.42)
      ctx.font = '34px sans-serif'
      ctx.fillText('NPN', w / 2, h * 0.68)
    },
    [model],
  )
  const glow = Math.min(1, conducting)

  return (
    <group position={[0, -0.2, 0]}>
      <Part id="encapsulado" offset={[0, 0, -2.2]} labelAt={[0.9, 0.9, -0.3]}>
        <mesh geometry={bodyGeo} castShadow>
          <meshStandardMaterial color="#161616" roughness={0.45} transparent opacity={0.92} />
        </mesh>
        <mesh position={[0, H / 2, 0.03]}>
          <planeGeometry args={[1.0, 0.8]} />
          <meshStandardMaterial map={face} roughness={0.5} />
        </mesh>
      </Part>
      <Part id="chip" offset={[0, 0.8, 1.0]} labelAt={[0.35, 0.8, 0]}>
        <mesh position={[0, 0.55, -0.15]}>
          <boxGeometry args={[0.22, 0.22, 0.05]} />
          <meshStandardMaterial color="#5a5f6a" metalness={0.6} roughness={0.3} emissive="#ffb020" emissiveIntensity={glow * 2} />
        </mesh>
      </Part>
      <Part id="hilos" offset={[0, 0.8, 1.0]} labelAt={[-0.5, 0.8, 0]}>
        <Wire points={[[-0.04, 0.58, -0.13], [-0.18, 0.7, -0.13], [-0.254, 0.45, -0.15]]} radius={0.006} color="#e8c56a" />
        <Wire points={[[0.04, 0.58, -0.13], [0.18, 0.7, -0.13], [0.254, 0.45, -0.15]]} radius={0.006} color="#e8c56a" />
      </Part>
      <Part id="terminales" offset={[0, -1.0, 0]} labelAt={[0.8, -1.4, 0]}>
        {t.pins.map((p, i) => {
          const x = (i - 1) * 0.254
          return (
            <group key={i}>
              <Wire points={[[x, 0.6, -0.15], [x, -0.1, -0.15], [x, -2.4, -0.15]]} radius={0.03} />
              <Label position={[x, -2.6, -0.15]} center style={{ pointerEvents: 'none' }}>
                <div className="pin-tag" title={PIN_NAMES[p]}>
                  {p}
                </div>
              </Label>
            </group>
          )
        })}
        {/* marco metálico (lead frame) sobre el que se pega el chip */}
        <mesh position={[0, 0.5, -0.17]}>
          <boxGeometry args={[0.3, 0.12, 0.03]} />
          <meshStandardMaterial {...metal} />
        </mesh>
      </Part>
    </group>
  )
}
