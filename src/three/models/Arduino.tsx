import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Part } from '../Part'
import { MalePin, darkPlastic, metal, useCanvasTexture } from '../helpers'

// Medidas reales del Arduino UNO R3: 68,6 × 53,3 mm (1 unidad = 10 mm)
export const UNO_W = 6.86
export const UNO_D = 5.34
export const PCB_T = 0.16
const P = 0.254
const LEFT = -UNO_W / 2

/** Pines de los headers hembra, en el orden en que aparecen sobre la placa. */
export const DIGITAL_PINS = ['13', '12', '11', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', '0']
export const POWER_PINS = ['IOREF', 'RESET', '3.3V', '5V', 'GND', 'GND', 'VIN']
export const ANALOG_PINS = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5']

/** Convierte coordenadas del plano oficial (mm, origen abajo a la izquierda) a la escena. */
const X = (mm: number) => mm / 10 + LEFT
const Z = (mm: number) => UNO_D / 2 - mm / 10

/** Posición (x, z) de cada pin del Arduino, relativa al centro de la placa. */
export function arduinoPinPositions(): Record<string, [number, number]> {
  const pos: Record<string, [number, number]> = {}
  const top = -UNO_D / 2 + 0.25
  const bottom = UNO_D / 2 - 0.25
  // header digital superior: SCL SDA AREF GND 13..8 | 7..0
  const xs1 = 1.88 + LEFT
  const topRow = ['SCL', 'SDA', 'AREF', 'GND2', '13', '12', '11', '10', '9', '8']
  topRow.forEach((n, i) => (pos[n] = [xs1 + i * P, top]))
  const xs2 = xs1 + 9 * P + 0.406
  ;['7', '6', '5', '4', '3', '2', '1', '0'].forEach((n, i) => (pos[n] = [xs2 + i * P, top]))
  // header inferior: alimentación | analógicos
  const xb1 = 2.79 + LEFT
  ;['NC', 'IOREF', 'RESET', '3.3V', '5V', 'GND', 'GND3', 'VIN'].forEach((n, i) => (pos[n] = [xb1 + i * P, bottom]))
  const xb2 = 5.08 + LEFT
  ANALOG_PINS.forEach((n, i) => (pos[n] = [xb2 + i * P, bottom]))
  return pos
}

/** Contorno oficial de la placa UNO (mm), con la esquina recortada a la derecha. */
const OUTLINE_MM: [number, number][] = [
  [0, 0],
  [66.04, 0],
  [66.04, 1.27],
  [68.58, 3.81],
  [68.58, 37.85],
  [66.04, 40.39],
  [66.04, 51.82],
  [64.52, 53.34],
  [0, 53.34],
]
const HOLES_MM: [number, number][] = [
  [13.97, 2.54],
  [15.24, 50.8],
  [66.04, 7.62],
  [66.04, 35.56],
]

const PCB_COLOR = '#00878f'

function FemaleHeader({ x, z, n }: { x: number; z: number; n: number }) {
  const w = n * P
  return (
    <group position={[x + w / 2 - P / 2, PCB_T / 2 + 0.43, z]}>
      <mesh castShadow>
        <boxGeometry args={[w - 0.01, 0.85, P - 0.01]} />
        <meshStandardMaterial {...darkPlastic} />
      </mesh>
      {Array.from({ length: n }, (_, i) => (
        <group key={i} position={[-w / 2 + P / 2 + i * P, 0.426, 0]}>
          {/* boca cuadrada y contacto dorado al fondo */}
          <mesh>
            <boxGeometry args={[0.11, 0.004, 0.11]} />
            <meshStandardMaterial color="#050505" />
          </mesh>
          <mesh position={[0, -0.05, 0]}>
            <boxGeometry args={[0.07, 0.01, 0.07]} />
            <meshStandardMaterial color="#c9a227" metalness={0.9} roughness={0.35} />
          </mesh>
        </group>
      ))}
      {/* separaciones entre pines, como en los headers reales */}
      {Array.from({ length: n - 1 }, (_, i) => (
        <mesh key={i} position={[-w / 2 + P * (i + 1), 0.3, 0]}>
          <boxGeometry args={[0.012, 0.25, P]} />
          <meshStandardMaterial color="#000" />
        </mesh>
      ))}
    </group>
  )
}

function SmdLed({ position, color, on }: { position: [number, number, number]; color: string; on: boolean }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.16, 0.05, 0.09]} />
        <meshStandardMaterial color="#f0f0ea" />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[0.1, 0.02, 0.08]} />
        <meshStandardMaterial color={on ? color : '#d8d8d0'} emissive={color} emissiveIntensity={on ? 3 : 0} transparent opacity={0.9} />
      </mesh>
    </group>
  )
}

/** Resistencias y capacitores de montaje superficial (decorativos, en posiciones aproximadas). */
const SMD: { x: number; y: number; r: number; kind: 'R' | 'C' }[] = [
  { x: 24, y: 45.5, r: 0, kind: 'R' },
  { x: 26.5, y: 45.5, r: 0, kind: 'R' },
  { x: 29, y: 45.5, r: 0, kind: 'R' },
  { x: 31.5, y: 45.5, r: 0, kind: 'C' },
  { x: 18.5, y: 33, r: 1, kind: 'C' },
  { x: 18.5, y: 30.5, r: 1, kind: 'R' },
  { x: 30, y: 32, r: 0, kind: 'C' },
  { x: 33, y: 32, r: 0, kind: 'C' },
  { x: 36, y: 27, r: 1, kind: 'R' },
  { x: 38.5, y: 27, r: 1, kind: 'R' },
  { x: 41, y: 27, r: 1, kind: 'C' },
  { x: 55, y: 22, r: 0, kind: 'C' },
  { x: 58, y: 22, r: 0, kind: 'R' },
  { x: 47, y: 23.5, r: 0, kind: 'C' },
  { x: 24, y: 18, r: 1, kind: 'R' },
  { x: 26.5, y: 18, r: 1, kind: 'C' },
]

function SmdParts() {
  return (
    <>
      {SMD.map((c, i) => (
        <group key={i} position={[X(c.x), PCB_T / 2 + 0.025, Z(c.y)]} rotation={[0, c.r ? Math.PI / 2 : 0, 0]}>
          <mesh>
            <boxGeometry args={[0.13, 0.05, 0.07]} />
            <meshStandardMaterial color={c.kind === 'R' ? '#151515' : '#b0895a'} roughness={0.6} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.06, 0, 0]}>
              <boxGeometry args={[0.025, 0.055, 0.072]} />
              <meshStandardMaterial {...metal} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  )
}

/** Chip DIP-28 con patas dobladas, muesca y texto impreso. */
function Atmega() {
  const text = useCanvasTexture(
    1024,
    200,
    (ctx, w, h) => {
      ctx.fillStyle = '#141414'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#bdbdbd'
      ctx.font = 'bold 64px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('ATMEGA328P-PU', w / 2, h * 0.38)
      ctx.font = '40px sans-serif'
      ctx.fillText('1946  ·  Microchip', w / 2, h * 0.75)
    },
    [],
  )
  const legGeo = useMemo(() => {
    // perfil de "ala de gaviota" de una pata DIP
    const s = new THREE.Shape()
    s.moveTo(0, 0)
    s.lineTo(0.06, 0)
    s.lineTo(0.06, 0.12)
    s.lineTo(0.03, 0.16)
    s.lineTo(0.025, 0.42)
    s.lineTo(0.008, 0.42)
    s.lineTo(0.008, 0.16)
    s.lineTo(-0.02, 0.12)
    s.lineTo(-0.02, 0)
    s.closePath()
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: false })
    g.translate(0, 0, -0.02)
    return g
  }, [])
  return (
    <group>
      {/* zócalo */}
      <mesh position={[0, 0.07, 0]}>
        <boxGeometry args={[3.62, 0.14, 0.9]} />
        <meshStandardMaterial color="#222" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.142, 0]}>
        <boxGeometry args={[3.4, 0.005, 0.32]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* cuerpo */}
      <mesh position={[0, 0.33, 0]} castShadow>
        <boxGeometry args={[3.56, 0.24, 0.66]} />
        <meshStandardMaterial color="#161616" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.451, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.6, 0.5]} />
        <meshStandardMaterial map={text} roughness={0.5} />
      </mesh>
      {/* muesca y marca del pin 1 */}
      <mesh position={[-1.78, 0.452, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.1, 20, -Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color="#060606" />
      </mesh>
      <mesh position={[-1.55, 0.452, 0.22]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.04, 16]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
      {Array.from({ length: 14 }, (_, i) =>
        [-1, 1].map((side) => (
          <mesh
            key={`${i}${side}`}
            geometry={legGeo}
            position={[-1.65 + i * P, 0.13, side * 0.33]}
            rotation={[0, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}
          >
            <meshStandardMaterial {...metal} />
          </mesh>
        )),
      )}
    </group>
  )
}

export interface ArduinoProps {
  powered: boolean
  blink: boolean
}

export function ArduinoModel({ powered, blink }: ArduinoProps) {
  const pins = arduinoPinPositions()
  const y = PCB_T / 2

  // placa con su contorno real y agujeros de montaje
  const { boardGeo, shape } = useMemo(() => {
    const shape = new THREE.Shape()
    OUTLINE_MM.forEach(([mx, my], i) => (i === 0 ? shape.moveTo(X(mx), -Z(my)) : shape.lineTo(X(mx), -Z(my))))
    shape.closePath()
    for (const [hx, hy] of HOLES_MM) {
      const h = new THREE.Path()
      h.absarc(X(hx), -Z(hy), 0.16, 0, Math.PI * 2, true)
      shape.holes.push(h)
    }
    const g = new THREE.ExtrudeGeometry(shape, { depth: PCB_T, bevelEnabled: false, curveSegments: 24 })
    g.rotateX(-Math.PI / 2)
    g.translate(0, -PCB_T / 2, 0)
    return { boardGeo: g, shape }
  }, [])
  const topGeo = useMemo(() => {
    const g = new THREE.ShapeGeometry(shape, 24)
    g.rotateX(-Math.PI / 2)
    // UV del plano de arriba según la posición, para que coincida con la textura
    const pos = g.attributes.position
    const uv = new Float32Array(pos.count * 2)
    for (let i = 0; i < pos.count; i++) {
      uv[i * 2] = (pos.getX(i) - LEFT) / UNO_W
      uv[i * 2 + 1] = 1 - (pos.getZ(i) + UNO_D / 2) / UNO_D
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
    return g
  }, [shape])

  const silk = useCanvasTexture(
    2048,
    1594,
    (ctx, w, h) => {
      const s = w / UNO_W
      const px = (x: number) => (x - LEFT) * s
      const pz = (z: number) => (z + UNO_D / 2) * s
      const mx = (mm: number) => (mm / 10) * s
      const my = (mm: number) => h - (mm / 10) * s
      ctx.fillStyle = PCB_COLOR
      ctx.fillRect(0, 0, w, h)
      // pistas de cobre bajo la máscara (más claras)
      ctx.strokeStyle = '#1aa3aa'
      ctx.lineWidth = 7
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      const trace = (pts: [number, number][]) => {
        ctx.beginPath()
        pts.forEach(([a, b], i) => (i ? ctx.lineTo(mx(a), my(b)) : ctx.moveTo(mx(a), my(b))))
        ctx.stroke()
      }
      for (let i = 0; i < 14; i++) {
        const xx = 31 + i * 2.54
        trace([[xx, 16.5], [xx, 20 + (i % 4)], [xx + 2 - (i % 3), 30 + (i % 5)], [Math.min(64, xx + 4), 45], [Math.min(64, xx + 4), 49]])
      }
      for (let i = 0; i < 6; i++) trace([[51 + i * 2.54, 4], [51 + i * 2.54, 7.5]])
      trace([[10, 8], [17, 8], [20, 12], [30, 12]])
      trace([[9, 38], [16, 38], [20, 36]])
      trace([[9, 36], [14, 34], [19, 34]])
      ctx.lineWidth = 14
      trace([[3, 18], [3, 26], [12, 26], [26, 26], [28, 20]])
      // vías
      ctx.fillStyle = '#d9d9d9'
      for (const [a, b] of [[22, 28], [35, 22], [44, 30], [52, 26], [58, 30], [40, 40], [20, 24], [62, 14]]) {
        ctx.beginPath()
        ctx.arc(mx(a), my(b), 9, 0, Math.PI * 2)
        ctx.fill()
      }
      // serigrafía
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = 'bold 58px sans-serif'
      ctx.fillText('DIGITAL (PWM ~)', px(pins['4'][0]), pz(pins['4'][1]) + 190)
      ctx.fillText('POWER', px((pins['3.3V'][0] + pins['GND'][0]) / 2), pz(pins['5V'][1]) - 190)
      ctx.fillText('ANALOG IN', px((pins['A2'][0] + pins['A3'][0]) / 2), pz(pins['A2'][1]) - 190)
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(px(pins['7'][0]), pz(pins['7'][1]) + 150)
      ctx.lineTo(px(pins['0'][0]), pz(pins['0'][1]) + 150)
      ctx.stroke()
      ctx.font = 'bold 38px sans-serif'
      const vertical = (n: string, txt: string, dir: 1 | -1) => {
        ctx.save()
        ctx.translate(px(pins[n][0]), pz(pins[n][1]) + dir * 100)
        ctx.rotate(-Math.PI / 2)
        ctx.fillText(txt, 0, 0)
        ctx.restore()
      }
      for (const n of DIGITAL_PINS) vertical(n, ['3', '5', '6', '9', '10', '11'].includes(n) ? `~${n}` : n, 1)
      vertical('GND2', 'GND', 1)
      vertical('AREF', 'AREF', 1)
      vertical('SDA', 'SDA', 1)
      vertical('SCL', 'SCL', 1)
      vertical('1', 'TX→1', 1)
      vertical('0', 'RX←0', 1)
      ;['IOREF', 'RESET', '3.3V', '5V', 'GND', 'VIN'].forEach((n) => vertical(n, n === '3.3V' ? '3V3' : n, -1))
      vertical('GND3', 'GND', -1)
      ANALOG_PINS.forEach((n) => vertical(n, n, -1))
      // logo
      ctx.font = 'bold italic 230px sans-serif'
      ctx.fillText('UNO', mx(46), my(30))
      ctx.lineWidth = 12
      ctx.beginPath()
      ctx.arc(mx(36.5), my(39), 34, 0, Math.PI * 2)
      ctx.arc(mx(44.5), my(39), 34, Math.PI, Math.PI * 3)
      ctx.stroke()
      ctx.font = 'bold 40px sans-serif'
      ctx.fillText('−', mx(36.5), my(39))
      ctx.fillText('+', mx(44.5), my(39))
      ctx.font = 'bold 70px sans-serif'
      ctx.fillText('ARDUINO', mx(53), my(39))
      ctx.font = '34px sans-serif'
      ctx.fillText('MADE IN ITALY', mx(49), my(23.5))
      ctx.font = 'bold 34px sans-serif'
      ctx.fillText('ON', mx(54.5), my(33.5))
      ctx.fillText('L', mx(27), my(43))
      ctx.fillText('TX', mx(27), my(39.6))
      ctx.fillText('RX', mx(27), my(36.3))
      ctx.fillText('RESET', mx(5.5), my(46.5))
      ctx.fillText('ICSP', mx(60), my(31.5))
      ctx.fillText('AREF', mx(21), my(48.3))
      // contornos de componentes
      ctx.lineWidth = 4
      ctx.strokeRect(mx(29.5), my(17.5), mx(36.5), mx(9.5))
      ctx.strokeRect(mx(59), my(30), mx(5.6), mx(8))
      // zona de los agujeros de montaje (anillos plateados)
      ctx.fillStyle = '#c8c8c8'
      for (const [hx, hy] of HOLES_MM) {
        ctx.beginPath()
        ctx.arc(mx(hx), my(hy), 56, 0, Math.PI * 2)
        ctx.fill()
      }
    },
    [],
  )

  const lRef = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(({ clock }) => {
    if (!lRef.current) return
    const on = powered && blink && Math.floor(clock.elapsedTime) % 2 === 0
    lRef.current.emissiveIntensity = on ? 3 : 0
    lRef.current.color.set(on ? '#ffb000' : '#d8d8d0')
  })

  return (
    <group position={[0, -0.3, 0]}>
      <Part id="placa" offset={[0, -1.2, 0]} labelAt={[UNO_W / 2 - 0.6, -0.1, UNO_D / 2]}>
        <mesh geometry={boardGeo} castShadow receiveShadow>
          <meshStandardMaterial color={PCB_COLOR} roughness={0.5} />
        </mesh>
        <mesh geometry={topGeo} position={[0, y + 0.001, 0]}>
          <meshStandardMaterial map={silk} roughness={0.45} />
        </mesh>
        <SmdParts />
      </Part>

      <Part id="usb" offset={[-1.2, 1.0, 0]} labelAt={[X(2), 1.4, Z(38)]}>
        <group position={[X(1.8), y, Z(38)]}>
          <mesh position={[0, 0.55, 0]} castShadow>
            <boxGeometry args={[1.62, 1.1, 1.2]} />
            <meshStandardMaterial {...metal} />
          </mesh>
          {/* boca del conector */}
          <mesh position={[-0.81, 0.55, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[0.85, 0.75]} />
            <meshStandardMaterial color="#0b0b0b" />
          </mesh>
          <mesh position={[-0.6, 0.55, 0]}>
            <boxGeometry args={[0.42, 0.3, 0.42]} />
            <meshStandardMaterial color="#f2f2ea" roughness={0.6} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[0.2, 0.02, s * 0.62]}>
              <boxGeometry args={[0.4, 0.05, 0.06]} />
              <meshStandardMaterial {...metal} />
            </mesh>
          ))}
        </group>
      </Part>

      <Part id="usbchip" offset={[0, 1.4, 0]} labelAt={[X(23), 0.4, Z(38)]}>
        <group position={[X(23), y + 0.05, Z(38)]} rotation={[0, Math.PI / 4, 0]}>
          <mesh>
            <boxGeometry args={[0.5, 0.09, 0.5]} />
            <meshStandardMaterial color="#121212" roughness={0.5} />
          </mesh>
          <mesh position={[-0.17, 0.046, -0.17]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.03, 12]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        </group>
      </Part>

      <Part id="jack" offset={[-1.2, 1.0, 0]} labelAt={[X(4), 1.4, Z(7.6)]}>
        <group position={[X(5.3), y, Z(7.6)]}>
          <mesh position={[0.15, 0.55, 0]} castShadow>
            <boxGeometry args={[1.45, 1.1, 0.9]} />
            <meshStandardMaterial {...darkPlastic} />
          </mesh>
          <mesh position={[-0.7, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.42, 0.42, 0.16, 32]} />
            <meshStandardMaterial {...darkPlastic} />
          </mesh>
          <mesh position={[-0.79, 0.55, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <circleGeometry args={[0.31, 32]} />
            <meshStandardMaterial color="#050505" />
          </mesh>
          <mesh position={[-0.7, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.1, 0.1, 0.2, 16]} />
            <meshStandardMaterial {...metal} />
          </mesh>
        </group>
      </Part>

      <Part id="regulador" offset={[0, 1.4, 0.4]} labelAt={[X(17), 0.6, Z(9)]}>
        <group position={[X(17.5), y, Z(9)]}>
          <mesh position={[0, 0.09, 0.08]}>
            <boxGeometry args={[0.65, 0.16, 0.36]} />
            <meshStandardMaterial {...darkPlastic} />
          </mesh>
          <mesh position={[0, 0.02, -0.25]}>
            <boxGeometry args={[0.32, 0.03, 0.3]} />
            <meshStandardMaterial {...metal} />
          </mesh>
          {[-0.23, 0, 0.23].map((dx) => (
            <mesh key={dx} position={[dx, 0.02, 0.33]}>
              <boxGeometry args={[0.07, 0.03, 0.14]} />
              <meshStandardMaterial {...metal} />
            </mesh>
          ))}
        </group>
      </Part>

      <Part id="capacitores" offset={[0, 1.6, 0]} labelAt={[X(21.5), 1.0, Z(15)]}>
        {[18.5, 25].map((mmx) => (
          <group key={mmx} position={[X(mmx), y, Z(15)]}>
            <mesh position={[0, 0.06, 0]}>
              <boxGeometry args={[0.66, 0.12, 0.66]} />
              <meshStandardMaterial color="#1b1b1b" />
            </mesh>
            <mesh position={[0, 0.4, 0]}>
              <cylinderGeometry args={[0.3, 0.3, 0.6, 28]} />
              <meshStandardMaterial {...metal} />
            </mesh>
            <mesh position={[-0.08, 0.705, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.3, 28, Math.PI / 2, Math.PI]} />
              <meshStandardMaterial color="#111" />
            </mesh>
          </group>
        ))}
      </Part>

      <Part id="micro" offset={[0, 1.6, 0]} labelAt={[X(47.8), 0.9, Z(12.3)]}>
        <group position={[X(47.8), y, Z(12.3)]}>
          <Atmega />
        </group>
      </Part>

      <Part id="cristal" offset={[0, 1.4, 0]} labelAt={[X(29), 0.6, Z(29)]}>
        {/* cristal de 16 MHz del chip USB */}
        <group position={[X(29), y + 0.18, Z(29)]}>
          <mesh scale={[1, 1, 0.42]}>
            <capsuleGeometry args={[0.18, 0.5, 6, 16]} />
            <meshStandardMaterial {...metal} />
          </mesh>
        </group>
        {/* resonador cerámico de 16 MHz del ATmega328P */}
        <mesh position={[X(41), y + 0.06, Z(21)]}>
          <boxGeometry args={[0.32, 0.12, 0.13]} />
          <meshStandardMaterial color="#c3913f" roughness={0.6} />
        </mesh>
      </Part>

      <Part id="reset" offset={[0, 1.4, 0]} labelAt={[X(7), 0.4, Z(51)]}>
        <group position={[X(6.3), y, Z(49.5)]}>
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[0.6, 0.2, 0.6]} />
            <meshStandardMaterial {...metal} />
          </mesh>
          <mesh position={[0, 0.26, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.12, 24]} />
            <meshStandardMaterial color="#d23030" roughness={0.5} />
          </mesh>
        </group>
      </Part>

      <Part id="icsp" offset={[0, 1.4, 0]} labelAt={[X(63.5), 0.9, Z(27)]}>
        {[
          [63.5, 27],
          [17.5, 46.5],
        ].map(([mx, my]) => (
          <group key={mx} position={[X(mx), y, Z(my)]} rotation={[0, mx < 30 ? Math.PI / 2 : 0, 0]}>
            <mesh position={[0, 0.05, 0]}>
              <boxGeometry args={[P * 2, 0.1, P * 3]} />
              <meshStandardMaterial {...darkPlastic} />
            </mesh>
            {[0, 1].map((i) =>
              [0, 1, 2].map((j) => <MalePin key={`${i}${j}`} position={[(i - 0.5) * P, 0.35, (j - 1) * P]} />),
            )}
          </group>
        ))}
      </Part>

      <Part id="leds" offset={[0, 1.2, 0]} labelAt={[X(28), 0.4, Z(40)]}>
        <SmdLed position={[X(54.5), y + 0.03, Z(32)]} color="#30ff60" on={powered} />
        <group position={[X(29.5), y + 0.03, Z(43)]}>
          <mesh>
            <boxGeometry args={[0.16, 0.05, 0.09]} />
            <meshStandardMaterial color="#f0f0ea" />
          </mesh>
          <mesh position={[0, 0.03, 0]}>
            <boxGeometry args={[0.1, 0.02, 0.08]} />
            <meshStandardMaterial ref={lRef} color="#d8d8d0" emissive="#ffb000" emissiveIntensity={0} />
          </mesh>
        </group>
        <SmdLed position={[X(29.5), y + 0.03, Z(39.6)]} color="#ffd000" on={false} />
        <SmdLed position={[X(29.5), y + 0.03, Z(36.3)]} color="#ffd000" on={false} />
      </Part>

      <Part id="digitales" offset={[0, 1.0, -0.6]} labelAt={[pins['8'][0] + 0.4, 1.0, -UNO_D / 2 + 0.25]}>
        <FemaleHeader x={pins['SCL'][0]} z={pins['SCL'][1]} n={10} />
        <FemaleHeader x={pins['7'][0]} z={pins['7'][1]} n={8} />
      </Part>

      <Part id="alimentacion" offset={[0, 1.0, 0.6]} labelAt={[pins['5V'][0], 1.0, UNO_D / 2 - 0.25]}>
        <FemaleHeader x={pins['NC'][0]} z={pins['NC'][1]} n={8} />
      </Part>

      <Part id="analogicos" offset={[0, 1.0, 0.6]} labelAt={[pins['A2'][0], 1.0, UNO_D / 2 - 0.25]}>
        <FemaleHeader x={pins['A0'][0]} z={pins['A0'][1]} n={6} />
      </Part>
    </group>
  )
}
