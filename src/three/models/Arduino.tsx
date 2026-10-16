import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Part } from '../Part'
import { MalePin, darkPlastic, metal, useCanvasTexture } from '../helpers'

// Medidas reales del Arduino UNO: 68,6 × 53,4 mm (1 unidad = 10 mm)
export const UNO_W = 6.86
export const UNO_D = 5.34
export const PCB_T = 0.16
const P = 0.254

/** Pines de los headers hembra, en el orden en que aparecen sobre la placa. */
export const DIGITAL_PINS = ['13', '12', '11', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', '0']
export const POWER_PINS = ['IOREF', 'RESET', '3.3V', '5V', 'GND', 'GND', 'VIN']
export const ANALOG_PINS = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5']

/** Posición (x, z) de cada pin del Arduino, relativa al centro de la placa. */
export function arduinoPinPositions(): Record<string, [number, number]> {
  const pos: Record<string, [number, number]> = {}
  const left = -UNO_W / 2
  const top = -UNO_D / 2 + 0.25
  const bottom = UNO_D / 2 - 0.25
  // header digital superior: AREF GND 13..8 | 7..0
  const xs1 = 1.88 + left
  const topRow = ['SCL', 'SDA', 'AREF', 'GND2', '13', '12', '11', '10', '9', '8']
  topRow.forEach((n, i) => (pos[n] = [xs1 + i * P, top]))
  const xs2 = xs1 + 9 * P + 0.406
  ;['7', '6', '5', '4', '3', '2', '1', '0'].forEach((n, i) => (pos[n] = [xs2 + i * P, top]))
  // header inferior: alimentación | analógicos
  const xb1 = 2.79 + left
  ;['NC', 'IOREF', 'RESET', '3.3V', '5V', 'GND', 'GND3', 'VIN'].forEach((n, i) => (pos[n] = [xb1 + i * P, bottom]))
  const xb2 = 5.08 + left
  ANALOG_PINS.forEach((n, i) => (pos[n] = [xb2 + i * P, bottom]))
  return pos
}

function FemaleHeader({ x, z, n }: { x: number; z: number; n: number }) {
  const w = n * P
  return (
    <group position={[x + w / 2 - P / 2, PCB_T / 2 + 0.43, z]}>
      <mesh castShadow>
        <boxGeometry args={[w, 0.85, P]} />
        <meshStandardMaterial {...darkPlastic} />
      </mesh>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[-w / 2 + P / 2 + i * P, 0.426, 0]}>
          <boxGeometry args={[0.1, 0.01, 0.1]} />
          <meshStandardMaterial color="#000" />
        </mesh>
      ))}
    </group>
  )
}

function SmdLed({ position, color, on }: { position: [number, number, number]; color: string; on: boolean }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.16, 0.06, 0.08]} />
      <meshStandardMaterial color={on ? color : '#ddd'} emissive={color} emissiveIntensity={on ? 3 : 0} />
    </mesh>
  )
}

export interface ArduinoProps {
  powered: boolean
  blink: boolean
}

export function ArduinoModel({ powered, blink }: ArduinoProps) {
  const pins = arduinoPinPositions()
  const left = -UNO_W / 2
  const y = PCB_T / 2

  const silk = useCanvasTexture(
    1372,
    1068,
    (ctx, w, h) => {
      const s = w / UNO_W
      ctx.fillStyle = '#00838f'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const px = (x: number) => (x - left) * s
      const pz = (z: number) => (z + UNO_D / 2) * s
      ctx.font = 'bold 30px sans-serif'
      ctx.fillText('DIGITAL (PWM ~)', px(pins['5'][0]), pz(pins['5'][1]) + 95)
      ctx.fillText('POWER', px(pins['5V'][0]), pz(pins['5V'][1]) - 95)
      ctx.fillText('ANALOG IN', px(pins['A2'][0] + 0.12), pz(pins['A2'][1]) - 95)
      ctx.font = '20px sans-serif'
      const labelTop = (n: string, txt: string) => {
        ctx.save()
        ctx.translate(px(pins[n][0]), pz(pins[n][1]) + 55)
        ctx.rotate(-Math.PI / 2)
        ctx.fillText(txt, 0, 0)
        ctx.restore()
      }
      for (const n of DIGITAL_PINS) labelTop(n, ['3', '5', '6', '9', '10', '11'].includes(n) ? `~${n}` : n)
      labelTop('GND2', 'GND')
      labelTop('AREF', 'AREF')
      const labelBottom = (n: string, txt: string) => {
        ctx.save()
        ctx.translate(px(pins[n][0]), pz(pins[n][1]) - 55)
        ctx.rotate(-Math.PI / 2)
        ctx.fillText(txt, 0, 0)
        ctx.restore()
      }
      ;['IOREF', 'RESET', '3.3V', '5V', 'GND', 'VIN'].forEach((n) => labelBottom(n, n === '3.3V' ? '3V3' : n))
      labelBottom('GND3', 'GND')
      ANALOG_PINS.forEach((n) => labelBottom(n, n))
      // logo
      ctx.font = 'bold italic 110px sans-serif'
      ctx.fillText('UNO', w * 0.62, h * 0.5)
      ctx.font = 'bold 40px sans-serif'
      ctx.fillText('ARDUINO', w * 0.62, h * 0.6)
      ctx.font = '22px sans-serif'
      ctx.fillText('ON', px(-0.2), pz(0.95) + 34)
      ctx.fillText('L', px(-0.2), pz(-1.2) - 28)
      ctx.fillText('TX', px(-0.65), pz(-0.85) - 26)
      ctx.fillText('RX', px(-0.65), pz(-0.6) + 30)
      // agujeros de montaje
      ctx.fillStyle = '#c8c8c8'
      for (const [hx, hz] of [[-UNO_W / 2 + 1.4, -UNO_D / 2 + 0.25], [UNO_W / 2 - 0.4, -UNO_D / 2 + 0.75], [-UNO_W / 2 + 1.5, UNO_D / 2 - 0.25], [UNO_W / 2 - 0.4, UNO_D / 2 - 1.75]]) {
        ctx.beginPath()
        ctx.arc(px(hx), pz(hz), 18, 0, Math.PI * 2)
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
    lRef.current.color.set(on ? '#ffb000' : '#ddd')
  })

  return (
    <group position={[0, -0.3, 0]}>
      <Part id="placa" offset={[0, -1.2, 0]} labelAt={[UNO_W / 2 - 0.6, -0.1, UNO_D / 2]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[UNO_W, PCB_T, UNO_D]} />
          <meshStandardMaterial color="#00838f" roughness={0.5} />
        </mesh>
        <mesh position={[0, y + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[UNO_W, UNO_D]} />
          <meshStandardMaterial map={silk} roughness={0.5} />
        </mesh>
      </Part>

      <Part id="usb" offset={[-1.2, 1.0, 0]} labelAt={[left + 0.55, 1.4, -UNO_D / 2 + 1.3]}>
        <mesh position={[left + 0.55, y + 0.55, -UNO_D / 2 + 1.3]} castShadow>
          <boxGeometry args={[1.6, 1.1, 1.2]} />
          <meshStandardMaterial {...metal} />
        </mesh>
      </Part>

      <Part id="jack" offset={[-1.2, 1.0, 0]} labelAt={[left + 0.6, 1.4, UNO_D / 2 - 0.75]}>
        <mesh position={[left + 0.6, y + 0.55, UNO_D / 2 - 0.75]} castShadow>
          <boxGeometry args={[1.4, 1.1, 0.9]} />
          <meshStandardMaterial {...darkPlastic} />
        </mesh>
        <mesh position={[left - 0.11, y + 0.6, UNO_D / 2 - 0.75]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.32, 0.32, 0.02, 24]} />
          <meshStandardMaterial color="#000" />
        </mesh>
      </Part>

      <Part id="regulador" offset={[0, 1.4, 0.4]} labelAt={[left + 1.8, 0.6, UNO_D / 2 - 0.6]}>
        <group position={[left + 1.8, y + 0.12, UNO_D / 2 - 0.6]}>
          <mesh>
            <boxGeometry args={[0.65, 0.22, 0.6]} />
            <meshStandardMaterial {...darkPlastic} />
          </mesh>
          <mesh position={[0, -0.08, -0.38]}>
            <boxGeometry args={[0.65, 0.04, 0.3]} />
            <meshStandardMaterial {...metal} />
          </mesh>
        </group>
      </Part>

      <Part id="capacitores" offset={[0, 1.6, 0]} labelAt={[left + 2.1, 1.0, UNO_D / 2 - 1.55]}>
        {[0, 0.75].map((dx) => (
          <group key={dx} position={[left + 1.75 + dx, y + 0.35, UNO_D / 2 - 1.55]}>
            <mesh>
              <cylinderGeometry args={[0.3, 0.3, 0.7, 24]} />
              <meshStandardMaterial {...metal} />
            </mesh>
            <mesh position={[0, -0.25, 0]}>
              <cylinderGeometry args={[0.31, 0.31, 0.2, 24]} />
              <meshStandardMaterial color="#222" />
            </mesh>
          </group>
        ))}
      </Part>

      <Part id="micro" offset={[0, 1.6, 0]} labelAt={[1.15, 0.8, 1.05]}>
        <group position={[1.15, y, 1.05]}>
          {/* zócalo */}
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[3.6, 0.16, 0.85]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[3.5, 0.3, 0.68]} />
            <meshStandardMaterial color="#141414" roughness={0.5} />
          </mesh>
          {Array.from({ length: 14 }, (_, i) => (
            <group key={i}>
              <MalePin position={[-1.65 + i * P, 0.2, 0.39]} length={0.2} />
              <MalePin position={[-1.65 + i * P, 0.2, -0.39]} length={0.2} />
            </group>
          ))}
          <mesh position={[-1.6, 0.455, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.1, 16, -Math.PI / 2, Math.PI]} />
            <meshStandardMaterial color="#444" />
          </mesh>
        </group>
      </Part>

      <Part id="cristal" offset={[0, 1.4, 0]} labelAt={[0.3, 0.5, -0.2]}>
        <mesh position={[0.3, y + 0.12, -0.2]} castShadow>
          <boxGeometry args={[0.45, 0.22, 0.2]} />
          <meshStandardMaterial {...metal} />
        </mesh>
      </Part>

      <Part id="usbchip" offset={[0, 1.4, 0]} labelAt={[left + 2.0, 0.4, -UNO_D / 2 + 1.3]}>
        <mesh position={[left + 2.0, y + 0.05, -UNO_D / 2 + 1.3]} rotation={[0, Math.PI / 4, 0]}>
          <boxGeometry args={[0.5, 0.1, 0.5]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      </Part>

      <Part id="reset" offset={[0, 1.4, 0]} labelAt={[left + 0.9, 0.35, -UNO_D / 2 - 0.15]}>
        <group position={[left + 0.75, y, -UNO_D / 2 + 0.35]}>
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[0.6, 0.2, 0.6]} />
            <meshStandardMaterial {...metal} />
          </mesh>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.12, 24]} />
            <meshStandardMaterial color="#c01818" />
          </mesh>
        </group>
      </Part>

      <Part id="icsp" offset={[0, 1.4, 0]} labelAt={[UNO_W / 2 - 0.45, 0.9, 0.05]}>
        <group position={[UNO_W / 2 - 0.45, y, 0.05]}>
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[P * 2, 0.1, P * 3]} />
            <meshStandardMaterial {...darkPlastic} />
          </mesh>
          {[0, 1].map((i) =>
            [0, 1, 2].map((j) => <MalePin key={`${i}${j}`} position={[(i - 0.5) * P, 0.35, (j - 1) * P]} />),
          )}
        </group>
      </Part>

      <Part id="leds" offset={[0, 1.2, 0]} labelAt={[-0.4, 0.4, -1.0]}>
        <SmdLed position={[-0.2, y + 0.03, 0.95]} color="#30ff60" on={powered} />
        <mesh position={[-0.2, y + 0.03, -1.2]}>
          <boxGeometry args={[0.16, 0.06, 0.08]} />
          <meshStandardMaterial ref={lRef} color="#ddd" emissive="#ffb000" emissiveIntensity={0} />
        </mesh>
        <SmdLed position={[-0.65, y + 0.03, -0.85]} color="#ffd000" on={false} />
        <SmdLed position={[-0.65, y + 0.03, -0.6]} color="#ffd000" on={false} />
      </Part>

      <Part id="digitales" offset={[0, 1.0, -0.6]} labelAt={[0.9, 1.0, -UNO_D / 2 + 0.25]}>
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
