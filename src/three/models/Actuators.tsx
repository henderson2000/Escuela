import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Part } from '../Part'
import { Label } from '../Label'
import { Screw, Wire, darkPlastic, latheGeometry, metal, tinned, useCanvasTexture } from '../helpers'
import { RoundedBox } from '@react-three/drei'
import { useKeepRendering } from '../keepRendering'

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

  const hornGeo = useMemo(() => {
    // brazo afinado con punta redondeada y 6 agujeros, como el que trae el SG90
    const sh = new THREE.Shape()
    sh.moveTo(0, -0.26)
    sh.lineTo(1.5, -0.12)
    sh.absarc(1.5, 0, 0.12, -Math.PI / 2, Math.PI / 2, false)
    sh.lineTo(0, 0.26)
    sh.absarc(0, 0, 0.26, Math.PI / 2, (3 * Math.PI) / 2, false)
    for (let i = 0; i < 6; i++) {
      const x = 0.45 + i * 0.21
      const hole = new THREE.Path()
      hole.absarc(x, 0, 0.035, 0, Math.PI * 2, true)
      sh.holes.push(hole)
    }
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.09, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 24 })
    g.rotateX(-Math.PI / 2)
    return g
  }, [])

  const shell = (
    <meshPhysicalMaterial color="#2a62d8" transparent opacity={0.82} roughness={0.25} clearcoat={0.6} />
  )

  return (
    <group position={[0, -0.6, 0]}>
      <Part id="carcasa" offset={[0, 0, 1.8]} labelAt={[-1.4, 1.6, 0.6]}>
        <RoundedBox args={[W, H * 0.62, D]} radius={0.04} smoothness={3} position={[0, H / 2, 0]} castShadow>
          {shell}
        </RoundedBox>
        {/* tapa inferior (otra pieza, con su línea de unión) */}
        <RoundedBox args={[W, H * 0.19, D]} radius={0.04} smoothness={3} position={[0, H * 0.095, 0]}>
          {shell}
        </RoundedBox>
        <mesh position={[0, H * 0.19, 0]}>
          <boxGeometry args={[W + 0.004, 0.012, D + 0.004]} />
          <meshStandardMaterial color="#0b1d44" />
        </mesh>
        {/* tornillos largos que cierran la caja desde abajo */}
        {[-0.85, 0.85].map((x) => (
          <Screw key={x} position={[x, -0.005, 0]} r={0.09} rotation={[Math.PI, 0, 0]} />
        ))}
        {/* orejas de montaje */}
        <RoundedBox args={[3.22, 0.25, D]} radius={0.04} smoothness={3} position={[0, H * 0.72, 0]}>
          {shell}
        </RoundedBox>
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
          {/* brazo (horn) con sus agujeritos */}
          <mesh geometry={hornGeo} position={[0, 0.16, 0]}>
            <meshStandardMaterial color="#f5f5f2" roughness={0.5} />
          </mesh>
          <Screw position={[0, 0.17, 0]} r={0.08} />
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
        {/* conector hembra de 3 pines (paso 2,54 mm) */}
        <group position={[-W / 2 - 2.0, -0.36, 0]} rotation={[0, 0, -0.4]}>
          <RoundedBox args={[0.6, 0.26, 0.78]} radius={0.03} smoothness={2}>
            <meshStandardMaterial {...darkPlastic} />
          </RoundedBox>
          {[-0.254, 0, 0.254].map((z) => (
            <mesh key={z} position={[-0.301, 0, z]} rotation={[0, -Math.PI / 2, 0]}>
              <planeGeometry args={[0.1, 0.1]} />
              <meshStandardMaterial color="#000" />
            </mesh>
          ))}
        </group>
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
  // buzzer de 12 mm: Ø12 × 9,5 mm, patas a 7,6 mm (1 unidad = 10 mm)
  const R = 0.6
  const H = 0.95
  useKeepRendering(playing)
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
    if (disc.current) disc.current.position.y = H - 0.2 + (playing ? Math.sin(t * 80) * 0.01 : 0)
  })
  // carcasa por revolución: borde superior redondeado y agujero central hundido
  const caseGeo = useMemo(
    () =>
      latheGeometry([
        [R - 0.02, 0],
        [R, 0.03],
        [R, H - 0.07],
        [R - 0.015, H - 0.02],
        [R - 0.06, H],
        [0.12, H],
        [0.1, H - 0.02],
        [0.09, H - 0.2],
      ]),
    [],
  )
  const top = useCanvasTexture(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#121212'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#e8e8e8'
      ctx.font = 'bold 90px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('+', w * 0.8, h * 0.5)
    },
    [],
  )
  const sticker = useCanvasTexture(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#f4f4f0'
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#222'
      ctx.textAlign = 'center'
      ctx.font = 'bold 54px sans-serif'
      ctx.fillText('REMOVE SEAL', w / 2, h * 0.36)
      ctx.fillText('AFTER', w / 2, h * 0.5)
      ctx.fillText('WASHING', w / 2, h * 0.64)
    },
    [],
  )

  return (
    <group position={[0, -0.3, 0]}>
      <Part id="carcasa" offset={[0, 0, 2.0]} labelAt={[1.0, 0.6, 0]}>
        <mesh geometry={caseGeo} castShadow>
          <meshPhysicalMaterial color="#141414" roughness={0.5} clearcoat={0.3} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, H + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.12, R - 0.06, 64]} />
          <meshStandardMaterial map={top} roughness={0.5} />
        </mesh>
        {active && (
          // los buzzers activos vienen con una etiqueta que tapa el agujero (se saca después de lavar la placa)
          <mesh position={[0, H + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.3, 48]} />
            <meshStandardMaterial map={sticker} roughness={0.7} />
          </mesh>
        )}
      </Part>
      <Part id="disco" offset={[0, 1.5, 0]} labelAt={[0.9, 1.1, 0]}>
        <mesh ref={disc} position={[0, H - 0.2, 0]}>
          <cylinderGeometry args={[0.52, 0.52, 0.02, 48]} />
          <meshStandardMaterial color="#d6b65a" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, H - 0.185, 0]}>
          <cylinderGeometry args={[0.34, 0.34, 0.02, 48]} />
          <meshStandardMaterial color="#e9e6dd" roughness={0.8} />
        </mesh>
        <mesh position={[0, H - 0.172, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.008, 48]} />
          <meshStandardMaterial color="#cfd2d6" metalness={0.9} roughness={0.35} />
        </mesh>
      </Part>
      {active && (
        <Part id="oscilador" offset={[0, 0.8, 0]} labelAt={[-0.9, 0.4, 0]}>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.05, 40]} />
            <meshStandardMaterial color="#1f6b35" roughness={0.6} />
          </mesh>
          <mesh position={[0.12, 0.31, 0]}>
            <boxGeometry args={[0.25, 0.08, 0.18]} />
            <meshStandardMaterial {...darkPlastic} />
          </mesh>
          <mesh position={[-0.2, 0.3, 0.1]}>
            <boxGeometry args={[0.12, 0.05, 0.06]} />
            <meshStandardMaterial color="#151515" />
          </mesh>
        </Part>
      )}
      <Part id="base" offset={[0, -0.7, 0]} labelAt={[-0.9, 0.0, 0]}>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[R - 0.02, R - 0.02, 0.06, 48]} />
          <meshStandardMaterial color={active ? '#0d0d0d' : '#1f6b35'} roughness={active ? 0.9 : 0.6} />
        </mesh>
      </Part>
      <Part id="positivo" offset={[0.5, -1.2, 0]} labelAt={[0.65, -1.8, 0]}>
        <Wire points={[[0.38, 0.05, 0], [0.38, -2.6, 0]]} radius={0.03} {...tinned} />
      </Part>
      <Part id="negativo" offset={[-0.5, -1.2, 0]} labelAt={[-0.65, -1.5, 0]}>
        <Wire points={[[-0.38, 0.05, 0], [-0.38, -2.1, 0]]} radius={0.03} {...tinned} />
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
      ctx.fillStyle = '#cfcfcf'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      // impresión láser típica: modelo en dos renglones y código de fecha
      const [a, b] = model === 'BC547' ? ['BC', '547B'] : ['2N', '2222A']
      ctx.font = 'bold 58px sans-serif'
      ctx.fillText(a, w / 2, h * 0.26)
      ctx.fillText(b, w / 2, h * 0.5)
      ctx.font = '36px sans-serif'
      ctx.fillText('331', w / 2, h * 0.74)
    },
    [model],
  )
  const glow = Math.min(1, conducting)

  return (
    <group position={[0, -0.2, 0]}>
      <Part id="encapsulado" offset={[0, 0, -2.2]} labelAt={[0.9, 0.9, -0.3]}>
        <mesh geometry={bodyGeo} castShadow>
          <meshPhysicalMaterial color="#161616" roughness={0.55} clearcoat={0.15} />
        </mesh>
        <mesh position={[0, H / 2, 0.025]}>
          <planeGeometry args={[0.8, 0.8]} />
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
        <Wire points={[[-0.04, 0.58, -0.13], [-0.18, 0.7, -0.13], [-0.29, 0.45, -0.15]]} radius={0.006} color="#e8c56a" smooth={0.5} />
        <Wire points={[[0.04, 0.58, -0.13], [0.18, 0.7, -0.13], [0.29, 0.45, -0.15]]} radius={0.006} color="#e8c56a" smooth={0.5} />
      </Part>
      <Part id="terminales" offset={[0, -1.0, 0]} labelAt={[0.8, -1.4, 0]}>
        {t.pins.map((p, i) => {
          // dentro del cuerpo las patas están a 1,27 mm; afuera se doblan a 2,54 mm
          const x = (i - 1) * 0.29
          const xo = (i - 1) * 0.58
          return (
            <group key={i}>
              <Wire
                points={[[x, 0.6, -0.15], [x, -0.05, -0.15], [x, -0.3, -0.15], [xo, -0.65, -0.15], [xo, -0.9, -0.15], [xo, -3.2, -0.15]]}
                radius={0.05}
                square
                smooth={0.25}
                {...tinned}
              />
              <Label position={[xo, -3.4, -0.15]} center style={{ pointerEvents: 'none' }}>
                <div className="pin-tag" title={PIN_NAMES[p]}>
                  {p}
                </div>
              </Label>
            </group>
          )
        })}
        {/* marco metálico (lead frame) sobre el que se pega el chip */}
        <mesh position={[0, 0.5, -0.17]}>
          <boxGeometry args={[0.36, 0.12, 0.03]} />
          <meshStandardMaterial {...metal} />
        </mesh>
      </Part>
    </group>
  )
}
