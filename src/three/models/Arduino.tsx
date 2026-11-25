import { useLayoutEffect, useMemo, useRef, type Ref } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Part } from '../Part'
import { useCanvasTexture } from '../helpers'
import { useKeepRendering } from '../keepRendering'

// Arduino UNO R3 a escala, con las medidas del plano oficial: 68,6 × 53,3 mm (1 unidad = 10 mm).
// Las posiciones de los componentes se toman en mm desde la esquina inferior izquierda de la placa
// (el conector USB queda a la izquierda, los pines digitales arriba).
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

/** Grupo de cada pin (para colorearlos al pasar el mouse). */
export type PinGroup = 'power' | 'ground' | 'digital' | 'pwm' | 'analog' | 'bus' | 'control' | 'nc'
export function unoPinGroup(n: string): PinGroup {
  if (n.startsWith('GND')) return 'ground'
  if (['5V', '3.3V', 'VIN', 'IOREF'].includes(n)) return 'power'
  if (['SDA', 'SCL', '0', '1'].includes(n)) return 'bus'
  if (['RESET', 'AREF'].includes(n)) return 'control'
  if (n === 'NC') return 'nc'
  if (n.startsWith('A')) return 'analog'
  if (['3', '5', '6', '9', '10', '11'].includes(n)) return 'pwm'
  return 'digital'
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

// colores y materiales de una placa real
const MASK = '#005f6b' // máscara antisoldante del UNO
const MASK_TRACE = '#0b7783' // pistas de cobre vistas a través de la máscara
const FR4 = '#d8cf9c' // canto de la placa (fibra de vidrio)
export const nickel = { color: '#d4d7db', metalness: 1, roughness: 0.28 }
export const tin = { color: '#e3e6ea', metalness: 1, roughness: 0.22 }
export const legMetal = { color: '#a9adb3', metalness: 1, roughness: 0.38 }
export const goldC = { color: '#d8b25a', metalness: 1, roughness: 0.25 }
export const blackPlastic = { color: '#151517', metalness: 0, roughness: 0.55 }
export const epoxy = { color: '#1a1a1c', metalness: 0, roughness: 0.62 }

/* ------------------------------------------------------------------ pistas y serigrafía */

/** Pistas de cobre (mm). Recorridos simplificados pero con la lógica de una placa real: del header al chip. */
function traces(): { w: number; pts: [number, number][] }[] {
  const t: { w: number; pts: [number, number][] }[] = []
  // pines digitales 13..0 → patas del ATmega
  for (let i = 0; i < 18; i++) {
    const hx = 18.8 + i * 2.54 + (i >= 10 ? 4.06 : 0) - (i >= 10 ? 0 : 0)
    if (hx > 64) continue
    const chipX = 33 + (i % 14) * 2.54
    t.push({ w: 0.3, pts: [[hx, 49.5], [hx, 46 - (i % 3)], [chipX + 1.2, 23.5 + (i % 4) * 0.9], [chipX + 1.2, 17.6]] })
  }
  // analógicos → patas inferiores del chip
  for (let i = 0; i < 6; i++) {
    const hx = 50.8 + i * 2.54
    t.push({ w: 0.3, pts: [[hx, 3.8], [hx, 6], [hx - 6 + i, 7.6]] })
  }
  // alimentación (pistas gruesas)
  t.push({ w: 1.0, pts: [[12.4, 7.6], [15, 7.6], [17, 9.5], [24, 9.5], [27, 6.5], [38, 6.5], [38, 3.8]] })
  t.push({ w: 0.8, pts: [[10, 30], [13, 27], [20, 27], [24, 22], [36, 22]] })
  t.push({ w: 0.8, pts: [[3, 24], [3, 20], [14, 20], [20, 15]] })
  t.push({ w: 0.6, pts: [[33, 3.8], [33, 6], [30, 9], [30, 18]] })
  // USB → 16U2
  t.push({ w: 0.3, pts: [[9.8, 37], [14, 37], [19.5, 37.5]] })
  t.push({ w: 0.3, pts: [[9.8, 39], [14, 39], [19.5, 38.8]] })
  // 16U2 → TX/RX → ATmega
  t.push({ w: 0.25, pts: [[25, 36], [30, 33], [40, 33], [55, 26], [60.5, 17.6]] })
  t.push({ w: 0.25, pts: [[25, 37], [31, 34], [41, 34], [56, 27], [63, 17.6]] })
  // ICSP → SPI
  t.push({ w: 0.25, pts: [[62.2, 24.5], [55, 24], [51, 19], [50.5, 17.6]] })
  t.push({ w: 0.25, pts: [[64.7, 24.5], [64.7, 21], [58, 20], [53, 17.6]] })
  // LED L y resistencias
  t.push({ w: 0.25, pts: [[29.5, 43], [33, 43], [36, 46], [29, 46.2]] })
  t.push({ w: 0.25, pts: [[23.5, 44], [23.5, 41], [21, 38]] })
  // reset
  t.push({ w: 0.3, pts: [[8.5, 49.5], [12, 47], [12, 42], [16, 40], [40, 40], [45, 36], [65, 36], [65, 18]] })
  // cristal
  t.push({ w: 0.3, pts: [[26.5, 29], [24, 31], [23, 35]] })
  t.push({ w: 0.3, pts: [[31.5, 29], [33, 31], [26, 35.5]] })
  return t
}

const VIAS: [number, number][] = [
  [22, 28], [35, 22], [44, 30], [52, 26], [58, 30], [40, 40], [20, 24], [62, 14], [16, 33], [27, 47.5],
  [47, 37], [54, 43], [60, 40], [12, 14], [36, 27], [43, 24], [31, 44], [57, 33], [49, 45], [24, 12],
]

/* ------------------------------------------------------------------ piezas */

function FemaleHeader({ x, z, n }: { x: number; z: number; n: number }) {
  const w = n * P
  const H = 0.85
  const holes = useRef<THREE.InstancedMesh>(null)
  const contacts = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    for (let i = 0; i < n; i++) {
      m.makeTranslation(-w / 2 + P / 2 + i * P, H / 2 + 0.0015, 0)
      holes.current?.setMatrixAt(i, m)
      m.makeTranslation(-w / 2 + P / 2 + i * P, H / 2 - 0.06, 0)
      contacts.current?.setMatrixAt(i, m)
    }
    if (holes.current) holes.current.instanceMatrix.needsUpdate = true
    if (contacts.current) contacts.current.instanceMatrix.needsUpdate = true
  }, [n, w])
  return (
    <group position={[x + w / 2 - P / 2, PCB_T / 2 + H / 2, z]}>
      <RoundedBox args={[w - 0.012, H, P - 0.012]} radius={0.018} smoothness={2} castShadow>
        <meshStandardMaterial {...blackPlastic} />
      </RoundedBox>
      {/* bocas cuadradas con su chaflán y el contacto dorado al fondo */}
      <instancedMesh ref={holes} args={[undefined, undefined, n]}>
        <boxGeometry args={[0.105, 0.002, 0.105]} />
        <meshStandardMaterial color="#030303" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={contacts} args={[undefined, undefined, n]}>
        <boxGeometry args={[0.06, 0.02, 0.05]} />
        <meshStandardMaterial {...goldC} />
      </instancedMesh>
      {/* separaciones moldeadas entre pines */}
      {Array.from({ length: n - 1 }, (_, i) => (
        <mesh key={i} position={[-w / 2 + P * (i + 1), H / 2 - 0.1, P / 2 - 0.004]}>
          <boxGeometry args={[0.014, 0.2, 0.01]} />
          <meshStandardMaterial color="#050505" roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

function MaleHeader2x3({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RoundedBox args={[P * 2 - 0.01, 0.25, P * 3 - 0.01]} radius={0.02} smoothness={2} position={[0, 0.125, 0]} castShadow>
        <meshStandardMaterial {...blackPlastic} />
      </RoundedBox>
      {[0, 1].map((i) =>
        [0, 1, 2].map((j) => (
          <mesh key={`${i}${j}`} position={[(i - 0.5) * P, 0.42, (j - 1) * P]} castShadow>
            <boxGeometry args={[0.064, 0.6, 0.064]} />
            <meshStandardMaterial {...goldC} />
          </mesh>
        )),
      )}
    </group>
  )
}

/** Chip DIP-28 en su zócalo, con las patas dobladas, la muesca y el grabado láser. */
function Atmega() {
  const L = 3.6
  const text = useCanvasTexture(
    1024,
    256,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = 'rgba(205,205,205,0.85)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = '600 70px "Consolas", "Menlo", monospace'
      ctx.fillText('ATMEGA328P-PU', w / 2, h * 0.36)
      ctx.font = '48px "Consolas", "Menlo", monospace'
      ctx.fillText('AU 2246  e3', w / 2, h * 0.72)
    },
    [],
  )
  const legGeo = useMemo(() => {
    // perfil de una pata DIP: hombro ancho que se angosta para entrar en el zócalo
    const s = new THREE.Shape()
    s.moveTo(-0.075, 0)
    s.lineTo(0.075, 0)
    s.lineTo(0.075, 0.09)
    s.lineTo(0.03, 0.15)
    s.lineTo(0.03, 0.36)
    s.lineTo(-0.03, 0.36)
    s.lineTo(-0.03, 0.15)
    s.lineTo(-0.075, 0.09)
    s.closePath()
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.025, bevelEnabled: false })
    g.translate(0, 0, -0.0125)
    g.rotateX(Math.PI) // hacia abajo
    return g
  }, [])
  const shoulderGeo = useMemo(() => new THREE.BoxGeometry(0.075, 0.025, 0.12), [])
  return (
    <group>
      {/* zócalo de 28 pines */}
      <RoundedBox args={[L + 0.15, 0.32, 1.0]} radius={0.02} smoothness={2} position={[0, 0.16, 0]} castShadow>
        <meshStandardMaterial color="#1d1d20" roughness={0.6} />
      </RoundedBox>
      <mesh position={[0, 0.322, 0]}>
        <boxGeometry args={[L - 0.3, 0.004, 0.36]} />
        <meshStandardMaterial color="#09090a" roughness={0.9} />
      </mesh>
      {Array.from({ length: 14 }, (_, i) =>
        [-1, 1].map((sd) => (
          <mesh key={`h${i}${sd}`} position={[-1.651 + i * P, 0.323, sd * 0.381]}>
            <boxGeometry args={[0.09, 0.004, 0.09]} />
            <meshStandardMaterial color="#050505" />
          </mesh>
        )),
      )}
      {/* cuerpo del chip */}
      <RoundedBox args={[L - 0.04, 0.34, 0.65]} radius={0.03} smoothness={3} position={[0, 0.53, 0]} castShadow>
        <meshStandardMaterial {...epoxy} />
      </RoundedBox>
      {/* grabado (el chip va con la muesca hacia el borde derecho de la placa) */}
      <mesh position={[0, 0.7015, 0]} rotation={[-Math.PI / 2, 0, Math.PI]}>
        <planeGeometry args={[2.5, 0.62]} />
        <meshStandardMaterial map={text} transparent roughness={0.7} depthWrite={false} />
      </mesh>
      <mesh position={[L / 2 - 0.02, 0.702, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.1, 24, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color="#0b0b0c" roughness={0.8} />
      </mesh>
      {[-1.2, 1.2].map((x) => (
        <mesh key={x} position={[x, 0.7015, x > 0 ? 0.16 : -0.16]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.07, 24]} />
          <meshStandardMaterial color="#121214" roughness={0.35} />
        </mesh>
      ))}
      {/* patas: hombro horizontal y pata hacia el zócalo */}
      {Array.from({ length: 14 }, (_, i) =>
        [-1, 1].map((sd) => (
          <group key={`${i}${sd}`} position={[-1.651 + i * P, 0, sd * 0.381]}>
            <mesh geometry={shoulderGeo} position={[0, 0.5, -sd * 0.045]}>
              <meshStandardMaterial {...legMetal} />
            </mesh>
            <mesh geometry={legGeo} position={[0, 0.5, 0]}>
              <meshStandardMaterial {...legMetal} />
            </mesh>
          </group>
        )),
      )}
    </group>
  )
}

/** Conector USB tipo B, de chapa niquelada estampada. */
function UsbB() {
  const W = 1.2
  const H = 1.09
  const Lx = 1.6
  return (
    <group>
      <RoundedBox args={[Lx, H, W]} radius={0.04} smoothness={3} position={[0, H / 2, 0]} castShadow>
        <meshStandardMaterial {...nickel} />
      </RoundedBox>
      {/* boca: recuadro hundido con la lengüeta blanca */}
      <mesh position={[-Lx / 2 - 0.001, H * 0.46, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.86, 0.78]} />
        <meshStandardMaterial color="#0d0d0e" roughness={0.9} />
      </mesh>
      <mesh position={[-Lx / 2 + 0.2, H * 0.47, 0]}>
        <boxGeometry args={[0.42, 0.32, 0.5]} />
        <meshStandardMaterial color="#f1efe6" roughness={0.55} />
      </mesh>
      {[-0.12, 0.12].map((zz) =>
        [-1, 1].map((yy) => (
          <mesh key={`${zz}${yy}`} position={[-Lx / 2 + 0.005, H * 0.47 + yy * 0.165, zz]}>
            <boxGeometry args={[0.01, 0.006, 0.07]} />
            <meshStandardMaterial {...goldC} />
          </mesh>
        )),
      )}
      {/* chanfles de la boca (típicos del USB-B) */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[-Lx / 2 - 0.004, H * 0.46 + 0.28, s * 0.36]} rotation={[0, -Math.PI / 2, s * Math.PI / 4]}>
          <planeGeometry args={[0.18, 0.18]} />
          <meshStandardMaterial {...nickel} />
        </mesh>
      ))}
      {/* estampados de la chapa */}
      <mesh position={[0.15, H + 0.004, 0]}>
        <boxGeometry args={[0.9, 0.008, 0.5]} />
        <meshStandardMaterial {...nickel} roughness={0.38} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[-0.2, H * 0.55, s * (W / 2 + 0.004)]}>
          <boxGeometry args={[0.36, 0.22, 0.008]} />
          <meshStandardMaterial {...nickel} roughness={0.38} />
        </mesh>
      ))}
    </group>
  )
}

/** Jack de alimentación de 2,1 mm. */
function BarrelJack() {
  return (
    <group>
      <RoundedBox args={[1.42, 1.1, 0.9]} radius={0.05} smoothness={3} position={[0.12, 0.55, 0]} castShadow>
        <meshStandardMaterial color="#141416" roughness={0.45} />
      </RoundedBox>
      <mesh position={[-0.62, 0.55, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.44, 0.44, 0.22, 40]} />
        <meshStandardMaterial color="#141416" roughness={0.45} />
      </mesh>
      <mesh position={[-0.735, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.32, 0.035, 10, 40]} />
        <meshStandardMaterial color="#1e1e21" roughness={0.4} />
      </mesh>
      <mesh position={[-0.734, 0.55, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <circleGeometry args={[0.32, 40]} />
        <meshStandardMaterial color="#030303" roughness={1} />
      </mesh>
      <mesh position={[-0.6, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.105, 0.105, 0.26, 20]} />
        <meshStandardMaterial {...nickel} />
      </mesh>
    </group>
  )
}

/** Capacitor electrolítico SMD (tipo "V-chip") sobre su base plástica. */
function SmdElectrolytic() {
  const top = useCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#cfd3d8'
      ctx.fillRect(0, 0, w, h)
      // franja negra de polaridad
      ctx.fillStyle = '#16161a'
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(w * 0.28, 0)
      ctx.lineTo(w * 0.28, h)
      ctx.lineTo(0, h)
      ctx.fill()
      // cruz de alivio
      ctx.strokeStyle = '#8f949b'
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.moveTo(w * 0.5, h * 0.3)
      ctx.lineTo(w * 0.5, h * 0.7)
      ctx.moveTo(w * 0.3, h * 0.5)
      ctx.lineTo(w * 0.7, h * 0.5)
      ctx.stroke()
      ctx.fillStyle = '#16161a'
      ctx.font = 'bold 40px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('47', w * 0.64, h * 0.22)
    },
    [],
  )
  return (
    <group>
      <RoundedBox args={[0.66, 0.1, 0.66]} radius={0.03} smoothness={2} position={[0, 0.05, 0]}>
        <meshStandardMaterial color="#202024" roughness={0.6} />
      </RoundedBox>
      <mesh position={[0, 0.37, 0]} castShadow>
        <cylinderGeometry args={[0.31, 0.31, 0.54, 40]} />
        <meshStandardMaterial color="#c9cdd2" metalness={0.85} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.375, 0]}>
        <torusGeometry args={[0.312, 0.012, 8, 40]} />
        <meshStandardMaterial color="#9aa0a7" metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.641, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.31, 40]} />
        <meshStandardMaterial map={top} metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  )
}

/** Integrado plano (QFN / SOIC / SOT) genérico con su marca. */
export function FlatChip({ w, d, h = 0.09, label, legs = 0 }: { w: number; d: number; h?: number; label?: string; legs?: number }) {
  const tex = useCanvasTexture(
    256,
    256,
    (ctx, cw, ch) => {
      ctx.clearRect(0, 0, cw, ch)
      if (!label) return
      ctx.fillStyle = 'rgba(190,190,190,0.8)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = '600 44px "Consolas", monospace'
      label.split('\n').forEach((l, i, a) => ctx.fillText(l, cw / 2, ch / 2 + (i - (a.length - 1) / 2) * 52))
    },
    [label],
  )
  return (
    <group>
      <RoundedBox args={[w, h, d]} radius={Math.min(0.012, h / 3)} smoothness={2} position={[0, h / 2, 0]} castShadow>
        <meshStandardMaterial {...epoxy} />
      </RoundedBox>
      {label && (
        <mesh position={[0, h + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w * 0.9, d * 0.9]} />
          <meshStandardMaterial map={tex} transparent depthWrite={false} roughness={0.7} />
        </mesh>
      )}
      <mesh position={[-w / 2 + 0.06, h + 0.0015, -d / 2 + 0.06]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.025, 12]} />
        <meshStandardMaterial color="#2c2c30" />
      </mesh>
      {legs > 0 &&
        Array.from({ length: legs }, (_, i) =>
          [-1, 1].map((sd) => (
            <mesh key={`${i}${sd}`} position={[-w / 2 + (w / legs) * (i + 0.5), 0.015, sd * (d / 2 + 0.04)]}>
              <boxGeometry args={[0.045, 0.03, 0.1]} />
              <meshStandardMaterial {...tin} />
            </mesh>
          )),
        )}
    </group>
  )
}

/** Componentes SMD pasivos (resistencias negras con extremos estañados y capacitores color arena). */
const SMD_PARTS: { x: number; y: number; r: number; kind: 'R' | 'C' | 'RN' }[] = [
  { x: 24, y: 45.5, r: 0, kind: 'R' },
  { x: 26.5, y: 45.5, r: 0, kind: 'R' },
  { x: 29, y: 45.5, r: 0, kind: 'R' },
  { x: 31.5, y: 45.5, r: 0, kind: 'C' },
  { x: 18.5, y: 33, r: 1, kind: 'C' },
  { x: 18.5, y: 30.5, r: 1, kind: 'R' },
  { x: 33, y: 31.5, r: 0, kind: 'C' },
  { x: 35.5, y: 31.5, r: 0, kind: 'C' },
  { x: 36, y: 27, r: 1, kind: 'R' },
  { x: 38.5, y: 27, r: 1, kind: 'R' },
  { x: 41, y: 27, r: 1, kind: 'C' },
  { x: 55, y: 22, r: 0, kind: 'C' },
  { x: 58, y: 22, r: 0, kind: 'R' },
  { x: 47, y: 23.5, r: 0, kind: 'C' },
  { x: 24, y: 19, r: 1, kind: 'R' },
  { x: 26.5, y: 19, r: 1, kind: 'C' },
  { x: 26, y: 33.5, r: 1, kind: 'RN' },
  { x: 14.5, y: 41.5, r: 0, kind: 'C' },
  { x: 14.5, y: 34, r: 0, kind: 'C' },
  { x: 52, y: 36, r: 0, kind: 'R' },
  { x: 49, y: 39.5, r: 1, kind: 'C' },
  { x: 59.5, y: 42, r: 0, kind: 'C' },
  { x: 20.5, y: 22.5, r: 0, kind: 'C' },
  { x: 32.5, y: 21, r: 1, kind: 'R' },
]

function SmdPassives() {
  const bodies = useRef<THREE.InstancedMesh>(null)
  const ends = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const v = new THREE.Vector3()
    const s = new THREE.Vector3(1, 1, 1)
    const c = new THREE.Color()
    let e = 0
    SMD_PARTS.forEach((p, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.r ? Math.PI / 2 : 0)
      const big = p.kind === 'RN'
      s.set(big ? 1.6 : 1, 1, big ? 1.4 : 1)
      m.compose(v.set(X(p.x), PCB_T / 2 + 0.022, Z(p.y)), q, s)
      bodies.current?.setMatrixAt(i, m)
      bodies.current?.setColorAt(i, c.set(p.kind === 'C' ? '#b48a55' : '#141416'))
      for (const sd of [-1, 1]) {
        const off = new THREE.Vector3(sd * (big ? 0.1 : 0.068), 0, 0).applyQuaternion(q)
        m.compose(v.set(X(p.x) + off.x, PCB_T / 2 + 0.022, Z(p.y) + off.z), q, s.set(1, 1, big ? 1.4 : 1))
        ends.current?.setMatrixAt(e++, m)
      }
    })
    if (bodies.current) {
      bodies.current.instanceMatrix.needsUpdate = true
      if (bodies.current.instanceColor) bodies.current.instanceColor.needsUpdate = true
    }
    if (ends.current) ends.current.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <>
      <instancedMesh ref={bodies} args={[undefined, undefined, SMD_PARTS.length]} castShadow>
        <boxGeometry args={[0.11, 0.044, 0.08]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={ends} args={[undefined, undefined, SMD_PARTS.length * 2]}>
        <boxGeometry args={[0.03, 0.048, 0.082]} />
        <meshStandardMaterial {...tin} />
      </instancedMesh>
    </>
  )
}

/** LED SMD (0805): cuerpo blanco con lente de color que se enciende. */
export function SmdLed({ position, color, on, matRef }: { position: [number, number, number]; color: string; on?: boolean; matRef?: Ref<THREE.MeshStandardMaterial> }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.2, 0.04, 0.125]} />
        <meshStandardMaterial color="#f4f2ea" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.15, 0.03, 0.115]} />
        <meshStandardMaterial
          ref={matRef}
          color={on ? color : '#e9e6da'}
          emissive={color}
          emissiveIntensity={on ? 4 : 0}
          roughness={0.2}
          transparent
          opacity={0.92}
        />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.09, 0.02, 0]}>
          <boxGeometry args={[0.03, 0.042, 0.128]} />
          <meshStandardMaterial {...tin} />
        </mesh>
      ))}
      {on && <pointLight position={[0, 0.25, 0]} color={color} intensity={0.25} distance={1.2} />}
    </group>
  )
}

/** Cristal metálico HC-49/S. */
export function Crystal() {
  const geo = useMemo(() => {
    const s = new THREE.Shape()
    const L = 0.55
    const r = 0.19
    s.moveTo(-L / 2, -r)
    s.lineTo(L / 2, -r)
    s.absarc(L / 2, 0, r, -Math.PI / 2, Math.PI / 2, false)
    s.lineTo(-L / 2, r)
    s.absarc(-L / 2, 0, r, Math.PI / 2, Math.PI * 1.5, false)
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.34, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 3, curveSegments: 16 })
    g.rotateX(-Math.PI / 2)
    return g
  }, [])
  const label = useCanvasTexture(
    256,
    128,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = 'rgba(40,40,44,0.8)'
      ctx.font = 'bold 42px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('16.000', w / 2, h / 2)
    },
    [],
  )
  return (
    <group>
      <mesh geometry={geo} position={[0, 0.02, 0]} castShadow>
        <meshStandardMaterial {...nickel} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.381, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.7, 0.3]} />
        <meshStandardMaterial map={label} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Pulsador táctil de 6 × 6 mm. */
export function TactSwitch() {
  return (
    <group>
      <RoundedBox args={[0.6, 0.2, 0.6]} radius={0.02} smoothness={2} position={[0, 0.1, 0]} castShadow>
        <meshStandardMaterial color="#26262a" roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 0.205, 0]}>
        <boxGeometry args={[0.6, 0.012, 0.6]} />
        <meshStandardMaterial {...nickel} roughness={0.35} />
      </mesh>
      {[[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]].map(([a, b]) => (
        <mesh key={`${a}${b}`} position={[a, 0.215, b]}>
          <sphereGeometry args={[0.025, 8, 6]} />
          <meshStandardMaterial {...nickel} />
        </mesh>
      ))}
      <mesh position={[0, 0.27, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.18, 0.12, 32]} />
        <meshStandardMaterial color="#c8262a" roughness={0.45} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.33, 0.04, 0]}>
          <boxGeometry args={[0.06, 0.08, 0.5]} />
          <meshStandardMaterial {...tin} />
        </mesh>
      ))}
    </group>
  )
}

/** Puntos de soldadura de los componentes pasantes, vistos desde abajo. */
export function SolderJoints({ points }: { points: [number, number][] }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const pads = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    points.forEach(([x, z], i) => {
      m.makeTranslation(x, -PCB_T / 2 - 0.035, z)
      ref.current?.setMatrixAt(i, m)
      m.makeTranslation(x, -PCB_T / 2 - 0.002, z)
      pads.current?.setMatrixAt(i, m)
    })
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true
    if (pads.current) pads.current.instanceMatrix.needsUpdate = true
  }, [points])
  return (
    <>
      <instancedMesh ref={pads} args={[undefined, undefined, points.length]}>
        <cylinderGeometry args={[0.085, 0.085, 0.004, 16]} />
        <meshStandardMaterial {...tin} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={ref} args={[undefined, undefined, points.length]}>
        <coneGeometry args={[0.07, 0.07, 16]} />
        <meshStandardMaterial {...tin} roughness={0.18} />
      </instancedMesh>
    </>
  )
}

/* ------------------------------------------------------------------ modelo */

export interface ArduinoProps {
  powered: boolean
  blink: boolean
  /** estado del LED L controlado desde afuera (simulación); si se pasa, manda sobre `blink` */
  led13?: boolean
}

export function ArduinoModel({ powered, blink, led13 }: ArduinoProps) {
  const pins = arduinoPinPositions()
  const y = PCB_T / 2

  // placa con su contorno real y agujeros de montaje; tapas de máscara y canto de fibra de vidrio
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
  const faceGeo = useMemo(() => {
    const g = new THREE.ShapeGeometry(shape, 24)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position
    const uv = new Float32Array(pos.count * 2)
    for (let i = 0; i < pos.count; i++) {
      uv[i * 2] = (pos.getX(i) - LEFT) / UNO_W
      uv[i * 2 + 1] = 1 - (pos.getZ(i) + UNO_D / 2) / UNO_D
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
    return g
  }, [shape])

  const TEX_W = 2744
  const TEX_H = 2136
  const drawCopper = (ctx: CanvasRenderingContext2D, w: number, h: number, color: string, via: string) => {
    const mx = (mm: number) => (mm / 68.58) * w
    const my = (mm: number) => h - (mm / 53.34) * h
    ctx.strokeStyle = color
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const t of traces()) {
      ctx.lineWidth = mx(t.w)
      ctx.beginPath()
      t.pts.forEach(([a, b], i) => (i ? ctx.lineTo(mx(a), my(b)) : ctx.moveTo(mx(a), my(b))))
      ctx.stroke()
    }
    // plano de masa (zona sombreada) bajo el regulador
    ctx.fillStyle = color
    ctx.globalAlpha = 0.45
    ctx.fillRect(mx(14), my(13), mx(10), mx(6))
    ctx.globalAlpha = 1
    ctx.fillStyle = via
    for (const [a, b] of VIAS) {
      ctx.beginPath()
      ctx.arc(mx(a), my(b), mx(0.42), 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const silk = useCanvasTexture(
    TEX_W,
    TEX_H,
    (ctx, w, h) => {
      const s = w / UNO_W
      const px = (x: number) => (x - LEFT) * s
      const pz = (z: number) => (z + UNO_D / 2) * s
      const mx = (mm: number) => (mm / 68.58) * w
      const my = (mm: number) => h - (mm / 53.34) * h
      // máscara con una variación muy suave (no es un color plano)
      const grad = ctx.createLinearGradient(0, 0, w, h)
      grad.addColorStop(0, '#006874')
      grad.addColorStop(1, MASK)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)
      drawCopper(ctx, w, h, MASK_TRACE, '#c8cdd2')
      // anillos de cobre estañado alrededor de los agujeros de montaje
      ctx.fillStyle = '#c8cdd2'
      for (const [hx, hy] of HOLES_MM) {
        ctx.beginPath()
        ctx.arc(mx(hx), my(hy), mx(2.6), 0, Math.PI * 2)
        ctx.fill()
      }
      // ---- serigrafía blanca
      ctx.fillStyle = '#f7f7f2'
      ctx.strokeStyle = '#f7f7f2'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const font = (px: number, weight = 700, italic = false) => (ctx.font = `${italic ? 'italic ' : ''}${weight} ${px}px "Arial", "Helvetica", sans-serif`)
      font(70)
      ctx.fillText('DIGITAL (PWM~)', px(pins['4'][0]), pz(pins['4'][1]) + 250)
      ctx.fillText('POWER', px((pins['3.3V'][0] + pins['GND'][0]) / 2), pz(pins['5V'][1]) - 255)
      ctx.fillText('ANALOG IN', px((pins['A2'][0] + pins['A3'][0]) / 2), pz(pins['A2'][1]) - 255)
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.moveTo(px(pins['7'][0]) - 10, pz(pins['7'][1]) + 205)
      ctx.lineTo(px(pins['0'][0]) + 10, pz(pins['0'][1]) + 205)
      ctx.moveTo(px(pins['13'][0]) - 10, pz(pins['13'][1]) + 205)
      ctx.lineTo(px(pins['8'][0]) + 10, pz(pins['8'][1]) + 205)
      ctx.stroke()
      // nombre de cada pin, en vertical, con su recuadro
      font(46)
      const vertical = (n: string, txt: string, dir: 1 | -1) => {
        ctx.save()
        ctx.translate(px(pins[n][0]), pz(pins[n][1]) + dir * 125)
        ctx.rotate(-Math.PI / 2)
        ctx.fillText(txt, 0, 0)
        ctx.restore()
      }
      for (const n of DIGITAL_PINS) vertical(n, ['3', '5', '6', '9', '10', '11'].includes(n) ? `~${n}` : n, 1)
      vertical('GND2', 'GND', 1)
      vertical('AREF', 'AREF', 1)
      vertical('SDA', 'SDA', 1)
      vertical('SCL', 'SCL', 1)
      vertical('1', 'TX▸1', 1)
      vertical('0', 'RX◂0', 1)
      ;['IOREF', 'RESET', '3.3V', '5V', 'GND', 'VIN'].forEach((n) => vertical(n, n === '3.3V' ? '3V3' : n, -1))
      vertical('GND3', 'GND', -1)
      ANALOG_PINS.forEach((n) => vertical(n, n, -1))
      // contorno de los headers
      ctx.lineWidth = 5
      const headerBox = (a: string, b: string) => {
        const x0 = px(pins[a][0]) - 0.16 * s
        const x1 = px(pins[b][0]) + 0.16 * s
        const zc = pz(pins[a][1])
        ctx.strokeRect(x0, zc - 0.16 * s, x1 - x0, 0.32 * s)
      }
      headerBox('SCL', '8')
      headerBox('7', '0')
      headerBox('NC', 'VIN')
      headerBox('A0', 'A5')
      // logo e identificación
      font(300, 800, true)
      ctx.fillText('UNO', mx(49), my(29))
      ctx.lineWidth = 15
      ctx.beginPath()
      ctx.ellipse(mx(35.2), my(39), mx(2.7), mx(2.1), 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(mx(40.6), my(39), mx(2.7), mx(2.1), 0, 0, Math.PI * 2)
      ctx.stroke()
      font(70, 900)
      ctx.fillText('−', mx(35.2), my(39))
      ctx.fillText('+', mx(40.6), my(39))
      font(98, 800)
      ctx.textAlign = 'left'
      ctx.fillText('ARDUINO', mx(44.2), my(39))
      ctx.textAlign = 'center'
      font(44, 600)
      ctx.fillText('MADE IN ITALY', mx(49), my(23))
      font(52)
      ctx.fillText('ON', mx(56.8), my(32.2))
      ctx.fillText('L', mx(27.4), my(43))
      ctx.fillText('TX', mx(27.4), my(39.7))
      ctx.fillText('RX', mx(27.4), my(36.4))
      ctx.fillText('RESET', mx(6.3), my(45.2))
      ctx.fillText('ICSP', mx(64), my(31.6))
      ctx.fillText('ICSP2', mx(17.5), my(42.6))
      ctx.fillText('IOREF', mx(31), my(8.2))
      font(40, 600)
      ctx.fillText('1', mx(61.6), my(22.8))
      ctx.fillText('16U2', mx(22.5), my(33.6))
      // contornos de componentes
      ctx.lineWidth = 6
      ctx.strokeRect(mx(29), my(18.5), mx(37.6), mx(12))
      ctx.strokeRect(mx(61), my(31), mx(6), mx(8.2))
      ctx.strokeRect(mx(14.5), my(48.5), mx(6), mx(8.2))
      for (const cx of [18.5, 25]) {
        ctx.beginPath()
        ctx.arc(mx(cx), my(15), mx(3.6), 0, Math.PI * 2)
        ctx.stroke()
      }
      // marcas de pasivos
      font(30, 600)
      ;[
        ['R1', 23.5, 47.5],
        ['C1', 31.5, 47.5],
        ['RN1', 26, 36.6],
        ['C3', 33, 29.6],
        ['Y1', 29, 26.4],
        ['U1', 47.8, 20.5],
        ['D1', 12, 10.8],
        ['F1', 9.8, 25.5],
      ].forEach(([t, a, b]) => ctx.fillText(t as string, mx(a as number), my(b as number)))
    },
    [],
  )
  const bump = useCanvasTexture(
    1372,
    1068,
    (ctx, w, h) => {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, w, h)
      drawCopper(ctx, w, h, '#ffffff', '#ffffff')
    },
    [],
  )
  // dorso: verde azulado más oscuro, con el mapa de pines y pistas
  const back = useCanvasTexture(
    1372,
    1068,
    (ctx, w, h) => {
      ctx.fillStyle = '#0a6f7a'
      ctx.fillRect(0, 0, w, h)
      ctx.save()
      ctx.translate(w, 0)
      ctx.scale(-1, 1) // visto desde abajo queda espejado
      drawCopper(ctx, w, h, '#15868f', '#c8cdd2')
      ctx.restore()
      ctx.fillStyle = '#f2f2ec'
      ctx.textAlign = 'center'
      ctx.font = 'bold 70px Arial, sans-serif'
      ctx.fillText('UNO  R3', w * 0.5, h * 0.48)
      ctx.font = '600 30px Arial, sans-serif'
      ctx.fillText('Placa de desarrollo · ATmega328P · 5 V · 16 MHz', w * 0.5, h * 0.56)
    },
    [],
  )
  // las texturas de color y de relieve usan espacio de color distinto
  useLayoutEffect(() => {
    bump.colorSpace = THREE.NoColorSpace
    bump.needsUpdate = true
  }, [bump])

  const backGeo = useMemo(() => {
    const g = faceGeo.clone()
    g.rotateX(Math.PI)
    return g
  }, [faceGeo])

  // puntos de soldadura de abajo: headers, ICSP, zócalo, USB, jack, pulsador y cristal
  const joints = useMemo(() => {
    const pts: [number, number][] = []
    for (const k of Object.keys(pins)) pts.push(pins[k])
    for (let i = 0; i < 14; i++) for (const sd of [-1, 1]) pts.push([X(47.8) - 1.651 + i * P, Z(12.3) + sd * 0.381])
    for (const [cx, cy, rot] of [[64, 27, 0], [17.5, 46.5, 1]] as const)
      for (let i = 0; i < 2; i++)
        for (let j = 0; j < 3; j++) {
          const a = (i - 0.5) * P
          const b = (j - 1) * P
          pts.push(rot ? [X(cx) + b, Z(cy) + a] : [X(cx) + a, Z(cy) + b])
        }
    for (const [a, b] of [[8.8, 36.8], [8.8, 39.3], [6.8, 36.8], [6.8, 39.3], [5, 31.9], [5, 44.3]]) pts.push([X(a), Z(b)])
    for (const [a, b] of [[10.5, 7.6], [4.5, 7.6], [7.6, 3.5]]) pts.push([X(a), Z(b)])
    for (const [a, b] of [[3, 47], [9.5, 47], [3, 52], [9.5, 52]]) pts.push([X(a), Z(b)])
    for (const [a, b] of [[26.6, 29], [31.4, 29]]) pts.push([X(a), Z(b)])
    return pts
  }, [pins])

  const lRef = useRef<THREE.MeshStandardMaterial>(null)
  const txRef = useRef<THREE.MeshStandardMaterial>(null)
  const external = led13 !== undefined
  useKeepRendering(powered && blink && !external, 8)
  useFrame(({ clock }) => {
    const on = powered && (external ? !!led13 : blink && Math.floor(clock.elapsedTime) % 2 === 0)
    if (lRef.current) {
      lRef.current.emissiveIntensity = on ? 4 : 0
      lRef.current.color.set(on ? '#ffb347' : '#e9e6da')
    }
    // TX parpadea muy de vez en cuando (como cuando la placa manda datos)
    if (txRef.current) {
      const tx = powered && blink && !external && clock.elapsedTime % 3 < 0.12
      txRef.current.emissiveIntensity = tx ? 4 : 0
      txRef.current.color.set(tx ? '#ffd23f' : '#e9e6da')
    }
  })

  return (
    <group position={[0, -0.3, 0]}>
      <Part id="placa" offset={[0, -1.2, 0]} labelAt={[UNO_W / 2 - 0.6, -0.1, UNO_D / 2]}>
        <mesh geometry={boardGeo} castShadow receiveShadow>
          <meshStandardMaterial color={FR4} roughness={0.75} />
        </mesh>
        <mesh geometry={faceGeo} position={[0, y + 0.0012, 0]} receiveShadow>
          <meshPhysicalMaterial map={silk} bumpMap={bump} bumpScale={1.2} roughness={0.5} clearcoat={0.25} clearcoatRoughness={0.45} envMapIntensity={0.6} />
        </mesh>
        <mesh geometry={backGeo} position={[0, -y - 0.0012, 0]}>
          <meshPhysicalMaterial map={back} roughness={0.45} clearcoat={0.4} clearcoatRoughness={0.35} />
        </mesh>
        <SmdPassives />
        <SolderJoints points={joints} />
        {/* diodo de protección, fusible reseteable y regulador de 3,3 V */}
        <group position={[X(12), y, Z(12.5)]}>
          <FlatChip w={0.42} d={0.26} h={0.2} label="M7" />
        </group>
        <group position={[X(9.8), y, Z(28)]} rotation={[0, Math.PI / 2, 0]}>
          <RoundedBox args={[0.45, 0.12, 0.32]} radius={0.02} smoothness={2} position={[0, 0.06, 0]}>
            <meshStandardMaterial color="#d6c25a" roughness={0.6} />
          </RoundedBox>
        </group>
        <group position={[X(21.5), y, Z(25)]}>
          <FlatChip w={0.29} d={0.16} h={0.11} legs={3} />
        </group>
        <group position={[X(55), y, Z(44.5)]}>
          <FlatChip w={0.49} d={0.39} h={0.15} legs={4} label="358" />
        </group>
      </Part>

      <Part id="usb" offset={[-1.2, 1.0, 0]} labelAt={[X(2), 1.4, Z(38)]}>
        <group position={[X(1.6), y, Z(38.1)]}>
          <UsbB />
        </group>
      </Part>

      <Part id="usbchip" offset={[0, 1.4, 0]} labelAt={[X(22.5), 0.4, Z(37)]}>
        <group position={[X(22.5), y, Z(37)]} rotation={[0, Math.PI / 4, 0]}>
          <FlatChip w={0.5} d={0.5} h={0.09} label={'MEGA\n16U2'} />
        </group>
      </Part>

      <Part id="jack" offset={[-1.2, 1.0, 0]} labelAt={[X(4), 1.4, Z(7.6)]}>
        <group position={[X(5.3), y, Z(7.6)]}>
          <BarrelJack />
        </group>
      </Part>

      <Part id="regulador" offset={[0, 1.4, 0.4]} labelAt={[X(18), 0.6, Z(8)]}>
        <group position={[X(18), y, Z(8)]}>
          {/* NCP1117 en encapsulado SOT-223: cuerpo, aleta disipadora y tres patas */}
          <group position={[0, 0, 0.05]}>
            <FlatChip w={0.65} d={0.35} h={0.16} label="1117" />
          </group>
          <mesh position={[0, 0.015, -0.28]}>
            <boxGeometry args={[0.32, 0.03, 0.22]} />
            <meshStandardMaterial {...tin} />
          </mesh>
          {[-0.23, 0, 0.23].map((dx) => (
            <mesh key={dx} position={[dx, 0.015, 0.33]}>
              <boxGeometry args={[0.07, 0.03, 0.16]} />
              <meshStandardMaterial {...tin} />
            </mesh>
          ))}
        </group>
      </Part>

      <Part id="capacitores" offset={[0, 1.6, 0]} labelAt={[X(21.5), 1.0, Z(15)]}>
        {[18.5, 25].map((mmx) => (
          <group key={mmx} position={[X(mmx), y, Z(15)]}>
            <SmdElectrolytic />
          </group>
        ))}
      </Part>

      <Part id="micro" offset={[0, 1.6, 0]} labelAt={[X(47.8), 0.9, Z(12.3)]}>
        <group position={[X(47.8), y, Z(12.3)]}>
          <Atmega />
        </group>
      </Part>

      <Part id="cristal" offset={[0, 1.4, 0]} labelAt={[X(29), 0.6, Z(29)]}>
        <group position={[X(29), y, Z(29)]}>
          <Crystal />
        </group>
        {/* resonador cerámico de 16 MHz del ATmega328P */}
        <group position={[X(41), y, Z(21)]}>
          <RoundedBox args={[0.32, 0.1, 0.13]} radius={0.02} smoothness={2} position={[0, 0.05, 0]}>
            <meshStandardMaterial color="#c79a4c" roughness={0.55} />
          </RoundedBox>
          {[-1, 0, 1].map((s) => (
            <mesh key={s} position={[s * 0.11, 0.012, 0]}>
              <boxGeometry args={[0.05, 0.024, 0.14]} />
              <meshStandardMaterial {...tin} />
            </mesh>
          ))}
        </group>
      </Part>

      <Part id="reset" offset={[0, 1.4, 0]} labelAt={[X(6.3), 0.5, Z(49.5)]}>
        <group position={[X(6.3), y, Z(49.5)]}>
          <TactSwitch />
        </group>
      </Part>

      <Part id="icsp" offset={[0, 1.4, 0]} labelAt={[X(64), 0.9, Z(27)]}>
        <MaleHeader2x3 position={[X(64), y, Z(27)]} />
        <MaleHeader2x3 position={[X(17.5), y, Z(46.5)]} rotation={Math.PI / 2} />
      </Part>

      <Part id="leds" offset={[0, 1.2, 0]} labelAt={[X(29.5), 0.4, Z(40)]}>
        <SmdLed position={[X(56.8), y, Z(34)]} color="#3dff6e" on={powered} />
        <SmdLed position={[X(29.8), y, Z(43)]} color="#ffb347" matRef={lRef} />
        <SmdLed position={[X(29.8), y, Z(39.7)]} color="#ffd23f" matRef={txRef} />
        <SmdLed position={[X(29.8), y, Z(36.4)]} color="#ffd23f" />
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
