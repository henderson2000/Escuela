import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Part } from '../Part'
import { useCanvasTexture } from '../helpers'
import { useKeepRendering } from '../keepRendering'
import { FlatChip, SmdLed, SolderJoints, TactSwitch, blackPlastic, goldC, nickel, tin } from './Arduino'
import type { PinGroup } from './Arduino'

// Arduino Nano (V3) a escala: 43,2 × 17,8 mm (1 unidad = 10 mm). El USB queda a la izquierda.
export const NANO_L = 4.32
export const NANO_W = 1.78
const T = 0.16
const P = 0.254
const ROW = 0.762 // las dos filas de pines están a 15,24 mm (0,6")
const FIRST = -NANO_L / 2 + 0.382

/** Fila de adelante (+z) y de atrás (−z), empezando del lado del USB. */
export const NANO_FRONT = ['D13', '3V3', 'REF', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', '5V', 'RST', 'GND', 'VIN']
export const NANO_BACK = ['D12', 'D11', 'D10', 'D9', 'D8', 'D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'GND2', 'RST2', 'RX0', 'TX1']

export function nanoPinPositions(): Record<string, [number, number]> {
  const pos: Record<string, [number, number]> = {}
  NANO_FRONT.forEach((n, i) => (pos[n] = [FIRST + i * P, ROW]))
  NANO_BACK.forEach((n, i) => (pos[n] = [FIRST + i * P, -ROW]))
  return pos
}

/** Nombre del pin del Nano como lo nombra el UNO (para reusar las descripciones). */
export function nanoToUno(n: string): string {
  if (n === '3V3') return '3.3V'
  if (n === 'REF') return 'AREF'
  if (n.startsWith('RST')) return 'RESET'
  if (n === 'GND2') return 'GND'
  if (n === 'RX0') return '0'
  if (n === 'TX1') return '1'
  if (/^D\d+$/.test(n)) return n.slice(1)
  return n
}

export function nanoPinGroup(n: string): PinGroup {
  const u = nanoToUno(n)
  if (u.startsWith('GND')) return 'ground'
  if (['5V', '3.3V', 'VIN'].includes(u)) return 'power'
  if (['0', '1'].includes(u)) return 'bus'
  if (['RESET', 'AREF'].includes(u)) return 'control'
  if (u.startsWith('A')) return 'analog'
  if (['3', '5', '6', '9', '10', '11'].includes(u)) return 'pwm'
  return 'digital'
}

/** Altura de la punta de los pines (el Nano se apoya sobre ellos). */
export const NANO_PIN_DOWN = 0.62
const MASK = '#005f6b'

/* ------------------------------------------------------------------ piezas */

/** Tira de pines macho soldada hacia abajo: plástico negro bajo la placa y pines dorados. */
function DownHeader({ z, n }: { z: number; n: number }) {
  const pins = useRef<THREE.InstancedMesh>(null)
  const w = n * P
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    for (let i = 0; i < n; i++) {
      m.makeTranslation(FIRST + i * P, -T / 2 - 0.25, z)
      pins.current?.setMatrixAt(i, m)
    }
    if (pins.current) pins.current.instanceMatrix.needsUpdate = true
  }, [n, z])
  return (
    <group>
      <RoundedBox args={[w - 0.01, 0.25, P - 0.01]} radius={0.02} smoothness={2} position={[FIRST + (w - P) / 2, -T / 2 - 0.125, z]} castShadow>
        <meshStandardMaterial {...blackPlastic} />
      </RoundedBox>
      <instancedMesh ref={pins} args={[undefined, undefined, n]} castShadow>
        <boxGeometry args={[0.064, NANO_PIN_DOWN + 0.02, 0.064]} />
        <meshStandardMaterial {...goldC} />
      </instancedMesh>
    </group>
  )
}

/** Mini-USB tipo B (el del Nano oficial). */
function MiniUsb() {
  return (
    <group>
      <RoundedBox args={[0.92, 0.4, 0.77]} radius={0.03} smoothness={3} position={[0, 0.2, 0]} castShadow>
        <meshStandardMaterial {...nickel} />
      </RoundedBox>
      <mesh position={[-0.461, 0.2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.62, 0.25]} />
        <meshStandardMaterial color="#0c0c0d" roughness={0.9} />
      </mesh>
      <mesh position={[-0.36, 0.2, 0]}>
        <boxGeometry args={[0.2, 0.08, 0.42]} />
        <meshStandardMaterial color="#121214" roughness={0.6} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0.25, 0.03, s * 0.42]}>
          <boxGeometry args={[0.3, 0.06, 0.08]} />
          <meshStandardMaterial {...tin} />
        </mesh>
      ))}
    </group>
  )
}

/** ATmega328P en encapsulado TQFP-32 (7 × 7 mm), girado 45° como en la placa. */
function Tqfp() {
  const legs = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const v = new THREE.Vector3()
    const s = new THREE.Vector3(1, 1, 1)
    let k = 0
    for (let side = 0; side < 4; side++) {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (side * Math.PI) / 2)
      for (let i = 0; i < 8; i++) {
        v.set(-0.28 + i * 0.08, 0.02, 0.4).applyQuaternion(q)
        m.compose(v, q, s)
        legs.current?.setMatrixAt(k++, m)
      }
    }
    if (legs.current) legs.current.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <group>
      <FlatChip w={0.7} d={0.7} h={0.1} label={'ATMEGA\n328P'} />
      <instancedMesh ref={legs} args={[undefined, undefined, 32]}>
        <boxGeometry args={[0.03, 0.025, 0.12]} />
        <meshStandardMaterial {...tin} />
      </instancedMesh>
    </group>
  )
}

/* ------------------------------------------------------------------ modelo */

export interface NanoProps {
  powered: boolean
  blink: boolean
  led13?: boolean
}

export const NANO_PARTS = [
  { id: 'micro', name: 'Microcontrolador ATmega328P', desc: 'El mismo cerebro que el UNO, pero en un encapsulado de montaje superficial (TQFP de 32 patas, 7 × 7 mm): por eso la placa es tanto más chica. Tiene 2 entradas analógicas más (A6 y A7).' },
  { id: 'usb', name: 'Conector Mini-USB', desc: 'Para programarlo y alimentarlo con 5 V desde la computadora. Las versiones nuevas o los clones traen Micro-USB o USB-C.' },
  { id: 'usbchip', name: 'Chip USB (abajo)', desc: 'Del lado de abajo: traduce el USB a comunicación serie. El Nano original usa un FT232RL; muchos clones usan el CH340 (hay que instalar su driver).' },
  { id: 'regulador', name: 'Regulador de 5 V (abajo)', desc: 'También abajo: baja la tensión de VIN (7 a 12 V) a 5 V. Es chico, así que no conviene pedirle mucha corriente.' },
  { id: 'cristal', name: 'Resonador de 16 MHz', desc: 'Marca el ritmo del microcontrolador: 16 millones de pulsos por segundo.' },
  { id: 'reset', name: 'Botón RESET', desc: 'Reinicia el programa. Está en el medio de la placa.' },
  { id: 'icsp', name: 'Conector ICSP', desc: 'Seis contactos para programar el microcontrolador directamente (por ejemplo, para grabarle el bootloader).' },
  { id: 'leds', name: 'LEDs indicadores', desc: 'POW (alimentado), L (pin 13), TX y RX (comunicación con la compu).' },
  { id: 'pinesA', name: 'Fila de pines: analógicos y alimentación', desc: 'D13, 3V3, REF, A0 a A7, 5V, RST, GND y VIN. A6 y A7 son sólo entradas analógicas.' },
  { id: 'pinesD', name: 'Fila de pines: digitales', desc: 'D12 a D2, GND, RST, RX0 y TX1. Los marcados con ~ (D3, D5, D6, D9, D10, D11) tienen PWM.' },
  { id: 'placa', name: 'Placa de circuito impreso', desc: 'Doble faz, con componentes de los dos lados. Los pines van soldados hacia abajo para enchufarlo directo en la protoboard: cada fila queda de un lado del canal central.' },
]

export function NanoModel({ powered, blink, led13 }: NanoProps) {
  const pins = nanoPinPositions()
  const y = T / 2

  const { boardGeo, faceGeo } = useMemo(() => {
    const s = new THREE.Shape()
    const r = 0.05
    const x0 = -NANO_L / 2
    const z0 = -NANO_W / 2
    s.moveTo(x0 + r, z0)
    s.lineTo(x0 + NANO_L - r, z0)
    s.quadraticCurveTo(x0 + NANO_L, z0, x0 + NANO_L, z0 + r)
    s.lineTo(x0 + NANO_L, z0 + NANO_W - r)
    s.quadraticCurveTo(x0 + NANO_L, z0 + NANO_W, x0 + NANO_L - r, z0 + NANO_W)
    s.lineTo(x0 + r, z0 + NANO_W)
    s.quadraticCurveTo(x0, z0 + NANO_W, x0, z0 + NANO_W - r)
    s.lineTo(x0, z0 + r)
    s.quadraticCurveTo(x0, z0, x0 + r, z0)
    // agujeros de montaje en las cuatro esquinas
    for (const [hx, hz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const h = new THREE.Path()
      h.absarc(hx * (NANO_L / 2 - 0.13), hz * (NANO_W / 2 - 0.13), 0.065, 0, Math.PI * 2, true)
      s.holes.push(h)
    }
    const body = new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false, curveSegments: 12 })
    body.rotateX(Math.PI / 2)
    body.translate(0, T / 2, 0)
    const face = new THREE.ShapeGeometry(s, 12)
    face.rotateX(Math.PI / 2)
    const pos = face.attributes.position
    const uv = new Float32Array(pos.count * 2)
    for (let i = 0; i < pos.count; i++) {
      uv[i * 2] = (pos.getX(i) + NANO_L / 2) / NANO_L
      uv[i * 2 + 1] = 1 - (pos.getZ(i) + NANO_W / 2) / NANO_W
    }
    face.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
    // la cara de arriba tiene que mirar hacia +y
    const idx = face.getIndex()
    if (idx) {
      const a = idx.array as unknown as number[]
      for (let i = 0; i < a.length; i += 3) [a[i + 1], a[i + 2]] = [a[i + 2], a[i + 1]]
      idx.needsUpdate = true
    }
    face.computeVertexNormals()
    return { boardGeo: body, faceGeo: face }
  }, [])

  const silk = useCanvasTexture(
    2160,
    890,
    (ctx, w, h) => {
      const sx = (x: number) => ((x + NANO_L / 2) / NANO_L) * w
      const sz = (z: number) => ((z + NANO_W / 2) / NANO_W) * h
      ctx.fillStyle = MASK
      ctx.fillRect(0, 0, w, h)
      // pistas bajo la máscara
      ctx.strokeStyle = '#0b7783'
      ctx.lineCap = 'round'
      ctx.lineWidth = 8
      for (let i = 0; i < 15; i++) {
        const x = sx(FIRST + i * P)
        ctx.beginPath()
        ctx.moveTo(x, sz(ROW) - 30)
        ctx.lineTo(x + ((i % 3) - 1) * 18, sz(0.32))
        ctx.lineTo(sx(0.35) + (i - 7) * 14, sz(0.12))
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x, sz(-ROW) + 30)
        ctx.lineTo(x - ((i % 3) - 1) * 18, sz(-0.32))
        ctx.lineTo(sx(0.35) + (i - 7) * 14, sz(-0.12))
        ctx.stroke()
      }
      // pads de los pines (cobre estañado)
      ctx.fillStyle = '#d5d8dc'
      for (const [x, z] of Object.values(pins)) {
        ctx.beginPath()
        ctx.arc(sx(x), sz(z), 34, 0, Math.PI * 2)
        ctx.fill()
      }
      for (const [hx, hz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        ctx.beginPath()
        ctx.arc(sx(hx * (NANO_L / 2 - 0.13)), sz(hz * (NANO_W / 2 - 0.13)), 40, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = '#0a0a0a'
      for (const [x, z] of Object.values(pins)) {
        ctx.beginPath()
        ctx.arc(sx(x), sz(z), 15, 0, Math.PI * 2)
        ctx.fill()
      }
      // serigrafía
      ctx.fillStyle = '#f6f6f0'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = 'bold 36px Arial, sans-serif'
      for (const [n, [x, z]] of Object.entries(pins)) {
        const label = n.replace(/2$/, '').replace('REF', 'REF').replace('RX0', 'RX0').replace('TX1', 'TX1')
        ctx.fillText(label, sx(x), sz(z) + (z > 0 ? -62 : 62))
      }
      ctx.font = 'bold 74px Arial, sans-serif'
      ctx.fillText('ARDUINO NANO', sx(1.2), sz(0.42))
      ctx.font = '600 40px Arial, sans-serif'
      ctx.fillText('V3', sx(1.2), sz(0.62) - 8)
      ctx.fillText('RESET', sx(0.05), sz(-0.42))
      ctx.fillText('ICSP', sx(1.9), sz(-0.42))
      ;[
        ['TX', -1.05, 0.48],
        ['RX', -0.86, 0.48],
        ['L', -0.67, 0.48],
        ['POW', -0.45, 0.48],
      ].forEach(([t, x, z]) => ctx.fillText(t as string, sx(x as number), sz(z as number)))
      ctx.lineWidth = 5
      ctx.strokeStyle = '#f6f6f0'
      ctx.strokeRect(sx(1.62), sz(-0.33), sx(0) - sx(-0.55), sz(0.38) - sz(0))
    },
    [],
  )

  // abajo: chip USB y regulador (se ven al girar la placa)
  const lRef = useRef<THREE.MeshStandardMaterial>(null)
  const external = led13 !== undefined
  useKeepRendering(powered && blink && !external, 8)
  useFrame(({ clock }) => {
    const on = powered && (external ? !!led13 : blink && Math.floor(clock.elapsedTime) % 2 === 0)
    if (lRef.current) {
      lRef.current.emissiveIntensity = on ? 4 : 0
      lRef.current.color.set(on ? '#ffb347' : '#e9e6da')
    }
  })

  const joints = useMemo(() => Object.values(pins), [pins])

  return (
    // apoyado sobre las puntas de los pines
    <group position={[0, T / 2 + 0.25 + NANO_PIN_DOWN, 0]}>
      <Part id="placa" offset={[0, -0.6, 0]} labelAt={[1.6, 0.1, NANO_W / 2]}>
        <mesh geometry={boardGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#d8cf9c" roughness={0.75} />
        </mesh>
        <mesh geometry={faceGeo} position={[0, y + 0.0012, 0]} receiveShadow>
          <meshPhysicalMaterial map={silk} roughness={0.5} clearcoat={0.25} clearcoatRoughness={0.45} />
        </mesh>
        <mesh position={[0, -y - 0.0012, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[NANO_L - 0.02, NANO_W - 0.02]} />
          <meshStandardMaterial color="#00545f" roughness={0.5} />
        </mesh>
        {/* los pines se sueldan del lado de arriba (el plástico queda abajo) */}
        <group rotation={[Math.PI, 0, 0]}>
          <SolderJoints points={joints} />
        </group>
        {/* pasivos SMD */}
        {[
          [-0.3, 0.35], [-0.15, 0.35], [0.6, 0.38], [0.75, 0.38], [0.9, -0.38], [-0.3, -0.38], [-1.25, -0.3], [-1.25, 0.25], [0.95, 0.38], [0.45, -0.38],
        ].map(([x, z], i) => (
          <group key={i} position={[x, y, z]}>
            <mesh position={[0, 0.022, 0]}>
              <boxGeometry args={[0.11, 0.044, 0.08]} />
              <meshStandardMaterial color={i % 3 ? '#141416' : '#b48a55'} roughness={0.6} />
            </mesh>
            {[-1, 1].map((sd) => (
              <mesh key={sd} position={[sd * 0.068, 0.022, 0]}>
                <boxGeometry args={[0.03, 0.048, 0.082]} />
                <meshStandardMaterial {...tin} />
              </mesh>
            ))}
          </group>
        ))}
      </Part>

      <Part id="usb" offset={[-0.9, 0.5, 0]} labelAt={[-NANO_L / 2, 0.5, 0]}>
        <group position={[-NANO_L / 2 + 0.38, y, 0]}>
          <MiniUsb />
        </group>
      </Part>

      <Part id="micro" offset={[0, 1, 0]} labelAt={[0.55, 0.4, 0]}>
        <group position={[0.55, y, 0]} rotation={[0, Math.PI / 4, 0]}>
          <Tqfp />
        </group>
      </Part>

      <Part id="usbchip" offset={[0, -1, 0]} labelAt={[-0.5, -0.4, 0]}>
        <group position={[-0.5, -y, 0]} rotation={[Math.PI, 0, 0]}>
          <FlatChip w={1.02} d={0.53} h={0.15} legs={14} label={'FT232RL'} />
        </group>
      </Part>

      <Part id="regulador" offset={[0, -1, 0]} labelAt={[1.1, -0.4, 0]}>
        <group position={[1.1, -y, 0.1]} rotation={[Math.PI, 0, 0]}>
          <FlatChip w={0.65} d={0.35} h={0.16} label="1117" />
        </group>
      </Part>

      <Part id="cristal" offset={[0, 0.8, 0]} labelAt={[-0.1, 0.3, 0.2]}>
        <group position={[-0.1, y, 0.22]}>
          <RoundedBox args={[0.32, 0.1, 0.13]} radius={0.02} smoothness={2} position={[0, 0.05, 0]}>
            <meshStandardMaterial color="#c79a4c" roughness={0.55} />
          </RoundedBox>
        </group>
      </Part>

      <Part id="reset" offset={[0, 0.9, 0]} labelAt={[0.05, 0.5, -0.2]}>
        <group position={[0.05, y, -0.12]} scale={[0.75, 0.75, 0.75]}>
          <TactSwitch />
        </group>
      </Part>

      <Part id="icsp" offset={[0.4, 0.8, 0]} labelAt={[1.9, 0.5, 0]}>
        <group position={[1.9, y, 0]}>
          {[0, 1].map((i) =>
            [0, 1, 2].map((j) => (
              <mesh key={`${i}${j}`} position={[(i - 0.5) * P, 0.004, (j - 1) * P]}>
                <cylinderGeometry args={[0.07, 0.07, 0.008, 16]} />
                <meshStandardMaterial {...tin} />
              </mesh>
            )),
          )}
        </group>
      </Part>

      <Part id="leds" offset={[0, 0.7, 0]} labelAt={[-0.75, 0.3, 0.3]}>
        <SmdLed position={[-1.05, y, 0.3]} color="#ffd23f" />
        <SmdLed position={[-0.86, y, 0.3]} color="#ffd23f" />
        <SmdLed position={[-0.67, y, 0.3]} color="#ffb347" matRef={lRef} />
        <SmdLed position={[-0.45, y, 0.3]} color="#3dff6e" on={powered} />
      </Part>

      <Part id="pinesA" offset={[0, -0.8, 0.5]} labelAt={[0, -0.5, ROW]}>
        <DownHeader z={ROW} n={15} />
      </Part>
      <Part id="pinesD" offset={[0, -0.8, -0.5]} labelAt={[0, -0.5, -ROW]}>
        <DownHeader z={-ROW} n={15} />
      </Part>
    </group>
  )
}
