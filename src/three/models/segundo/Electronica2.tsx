import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Part } from '../../Part'
import { latheGeometry, useCanvasTexture } from '../../helpers'
import { useKeepRendering } from '../../keepRendering'
import { canvasTex, normalTex, smoothNoise } from './soldaduraShared'
import { CM, Cable, type V3 } from '../compuShared'
import { EM } from '../electricShared'
import { COLORS, valueToBands } from '../../../lib/resistor'
import {  diagnosticarPunto, fuenteValores } from './Electronica2.data'
import type {  PuntoParams, Resultado, PcbParams, Etapa } from './Electronica2.data'
export { FUENTE_ETAPAS, FUENTE_PARTS, PCB_ETAPAS, PUNTO_PARTS, SOLDADOR_PARTS, diagnosticarPunto, fuenteValores, pcbParts } from './Electronica2.data'
export type { Estano, PuntoParams, Resultado, PcbParams, Etapa } from './Electronica2.data'

/* ------------------------------------------------------------------ */
/* Electrónica de 2do año: estación de soldado, punto de soldadura,     */
/* fabricación de un circuito impreso y fuente de alimentación lineal.  */
/* ------------------------------------------------------------------ */

const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p)
const SOLDER = std({ color: '#dfe3e8', metalness: 1, roughness: 0.16 })
const SOLDER_DULL = std({ color: '#9ea4ab', metalness: 0.7, roughness: 0.75, normalMap: normalTex(128, (x, y) => smoothNoise(3, 24)(x, y, 128), 3, [3, 3]) ?? undefined })
const FR4 = std({ color: '#c9c08a', roughness: 0.55, metalness: 0, transparent: true, opacity: 0.96 })
const FR4_EDGE = std({ color: '#b7ad74', roughness: 0.7 })
const COPPER = std({ color: '#d98c5f', metalness: 1, roughness: 0.22 })
const TIN_LEAD = std({ color: '#cfd3d8', metalness: 1, roughness: 0.25 })
const FLUX = new THREE.MeshPhysicalMaterial({ color: '#c98a2a', roughness: 0.15, transmission: 0.5, thickness: 0.2, transparent: true, opacity: 0.55, depthWrite: false })

/* ================================================================== resistencia axial */

/** Resistencia de carbón con sus bandas, a lo largo de x, centrada en el origen (unidades: mm). */
function AxialResistor({ ohms, len = 6.3, d = 2.4 }: { ohms: number; len?: number; d?: number }) {
  const bands = valueToBands(ohms, 4, 5)
  const body = useMemo(
    () =>
      latheGeometry(
        [
          [0.01, -len / 2],
          [d * 0.42, -len / 2 + 0.1],
          [d * 0.5, -len / 2 + 0.6],
          [d * 0.43, -len / 2 + 1.4],
          [d * 0.43, len / 2 - 1.4],
          [d * 0.5, len / 2 - 0.6],
          [d * 0.42, len / 2 - 0.1],
          [0.01, len / 2],
        ],
        28,
        0.1,
      ).rotateZ(Math.PI / 2),
    [len, d],
  )
  const xs = [-len * 0.3, -len * 0.16, -len * 0.02, len * 0.3]
  return (
    <group>
      <mesh geometry={body} castShadow>
        <meshStandardMaterial color="#d9c29a" roughness={0.55} />
      </mesh>
      {bands.map((b, i) => (
        <mesh key={i} position={[xs[i], 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[d * (i === 0 || i === 3 ? 0.51 : 0.445), d * (i === 0 || i === 3 ? 0.51 : 0.445), 0.42, 24, 1, true]} />
          <meshStandardMaterial color={COLORS[b].hex} roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

/* ================================================================== 1 · estación de soldado */

export interface SoldadorParams {
  encendido: boolean
  temperatura: number
}

function Spiral({ r0, r1, len, turns }: { r0: number; r1: number; len: number; turns: number }) {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const n = turns * 24
    for (let i = 0; i <= n; i++) {
      const t = i / n
      const a = t * turns * Math.PI * 2
      const r = r0 + (r1 - r0) * t
      pts.push(new THREE.Vector3(t * len, Math.cos(a) * r, Math.sin(a) * r))
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, 0.09, 6, false)
  }, [r0, r1, len, turns])
  return <mesh geometry={geo} material={EM.steel} castShadow />
}

/** Soldador tipo lápiz: punta en el origen y el mango hacia +x (unidades: cm). */
function Iron({ hot }: { hot: number }) {
  const geo = useMemo(() => {
    const tip = latheGeometry(
      [
        [0.01, 0],
        [0.06, 0.15],
        [0.16, 0.9],
        [0.2, 1.8],
        [0.24, 2.6],
      ],
      24,
      0.05,
    ).rotateZ(-Math.PI / 2)
    const grip = latheGeometry(
      [
        [0.42, 0],
        [0.6, 0.4],
        [0.62, 1.2],
        [0.58, 2.2],
        [0.66, 4.2],
        [0.72, 6.6],
        [0.62, 8.2],
        [0.38, 8.8],
        [0.3, 10.6],
        [0.2, 11.2],
      ],
      32,
      0.08,
    ).rotateZ(-Math.PI / 2)
    return { tip, grip }
  }, [])
  // la punta caliente toma un tono algo más oscuro y dorado (óxido fino)
  const tipColor = new THREE.Color('#c9ccd1').lerp(new THREE.Color('#b08d57'), hot * 0.5)
  return (
    <group>
      <mesh geometry={geo.tip} castShadow>
        <meshStandardMaterial color={tipColor} metalness={1} roughness={0.25} />
      </mesh>
      {/* tubo de acero con la resistencia adentro y la tuerca que sujeta la punta */}
      <Part id="resistencia" offset={[0, 1.2, 0]} labelAt={[4.5, 0.7, 0]}>
        <mesh position={[5.0, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.34, 0.36, 4.8, 24]} />
          <meshStandardMaterial color="#b7bcc3" metalness={0.95} roughness={0.32} emissive="#7a2a10" emissiveIntensity={hot * 0.12} />
        </mesh>
        <mesh position={[2.9, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={EM.nickel}>
          <cylinderGeometry args={[0.42, 0.42, 0.5, 6]} />
        </mesh>
      </Part>
      <Part id="mango" offset={[0, 1.6, 0]} labelAt={[12, 1.1, 0]}>
        <mesh geometry={geo.grip} position={[7.4, 0, 0]} castShadow>
          <meshStandardMaterial color="#1f3b7a" roughness={0.45} />
        </mesh>
        {[9.6, 10.2, 10.8, 11.4, 12.0].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.66, 0.06, 8, 28]} />
            <meshStandardMaterial color="#141414" roughness={0.85} />
          </mesh>
        ))}
      </Part>
    </group>
  )
}

function SpoolLabel() {
  return useCanvasTexture(
    256,
    64,
    (ctx, w, h) => {
      ctx.fillStyle = '#f2f2ee'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#1e3a8a'
      ctx.font = 'bold 24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Sn60 Pb40 · 1 mm', w / 2, 28)
      ctx.font = '18px Arial'
      ctx.fillText('flux 2,2 % · 100 g', w / 2, 52)
    },
    [],
  )
}

export function SoldadorModel({ encendido, temperatura }: SoldadorParams) {
  const actual = encendido ? temperatura : 25
  const hot = encendido ? Math.min(1, (temperatura - 150) / 300) : 0
  useKeepRendering(encendido, 6)
  const display = useCanvasTexture(
    256,
    96,
    (ctx, w, h) => {
      ctx.fillStyle = '#100607'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = encendido ? '#ff3b2e' : '#3a1414'
      ctx.font = 'bold 74px monospace'
      ctx.textAlign = 'right'
      ctx.fillText(encendido ? String(Math.round(actual)) : '---', w - 52, 76)
      ctx.font = 'bold 30px Arial'
      ctx.fillText('°C', w - 8, 40)
    },
    [encendido, actual],
  )
  const panel = useCanvasTexture(
    512,
    384,
    (ctx, w, h) => {
      ctx.fillStyle = '#202226'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#e5e7eb'
      ctx.font = 'bold 30px Arial'
      ctx.fillText('ESTACIÓN DE SOLDADO', 26, 46)
      ctx.font = '22px Arial'
      ctx.fillStyle = '#9ca3af'
      ctx.fillText('48 W · 200 – 480 °C', 26, 80)
      ctx.fillStyle = '#e5e7eb'
      ctx.textAlign = 'center'
      ;['200', '300', '400', '480'].forEach((t, i) => {
        const a = -Math.PI * 0.75 + (i / 3) * Math.PI * 1.5
        ctx.fillText(t, 380 + Math.sin(a) * 92, 262 - Math.cos(a) * 92 + 8)
      })
    },
    [],
  )
  const spoolLabel = SpoolLabel()
  // perilla: 200 °C a la izquierda, 480 °C a la derecha
  const knobA = -Math.PI * 0.75 + ((temperatura - 200) / 280) * Math.PI * 1.5
  // el soldador descansa dentro del espiral del soporte
  const SX = 3
  const ironPos: V3 = [SX - 0.6, 3.2, 0.2]
  const ironRot: V3 = [0, 0.15, 0.55]
  // punto del eje del soldador (x = distancia desde la punta) en coordenadas de la escena: ahí sale el cable del mango
  const onIron = (x: number): V3 => {
    const v = new THREE.Vector3(x, 0, 0).applyEuler(new THREE.Euler(...ironRot)).add(new THREE.Vector3(...ironPos))
    return [v.x, v.y, v.z]
  }
  const spoolWire = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 60; i++) {
      const t = i / 60
      pts.push(new THREE.Vector3(12 - t * 3.5, 2.6 - t * 2.45 + Math.sin(t * Math.PI) * 1.2, 2.8 + t * 2.6))
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.05, 6, false)
  }, [])
  return (
    <group>
      {/* ---------------------------------------- estación */}
      <Part id="estacion" offset={[-3, 0, 0]} labelAt={[-7, 9.2, 0]}>
        <group position={[-7, 0, 0]}>
          <RoundedBox args={[9, 8.2, 12]} radius={0.5} smoothness={3} position={[0, 4.1, 0]} material={CM.chassis} castShadow receiveShadow />
          <mesh position={[0, 4.1, 6.01]}>
            <planeGeometry args={[8.4, 7.6]} />
            <meshStandardMaterial map={panel} roughness={0.5} />
          </mesh>
          <mesh position={[-1.9, 5.0, 6.03]}>
            <planeGeometry args={[3.6, 1.35]} />
            <meshStandardMaterial color="#000" emissive="#ffffff" emissiveMap={display} emissiveIntensity={1} />
          </mesh>
          {/* perilla de temperatura */}
          <group position={[1.75, 3.2, 6.0]} rotation={[0, 0, -knobA]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[1.15, 1.25, 0.9, 32]} />
              <meshStandardMaterial color="#141416" roughness={0.45} />
            </mesh>
            <mesh position={[0, 0.8, 0.46]}>
              <boxGeometry args={[0.14, 0.5, 0.02]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
          </group>
          {/* llave de encendido, luz de calentamiento y zócalo del soldador */}
          <RoundedBox args={[1.1, 0.7, 0.4]} radius={0.12} smoothness={2} position={[-2.9, 1.4, 6.05]}>
            <meshStandardMaterial color={encendido ? '#dc2626' : '#3f1212'} emissive="#dc2626" emissiveIntensity={encendido ? 0.6 : 0} roughness={0.4} />
          </RoundedBox>
          <mesh position={[-0.7, 1.4, 6.05]}>
            <circleGeometry args={[0.16, 16]} />
            <meshStandardMaterial color="#000" emissive="#f59e0b" emissiveIntensity={encendido ? 2 : 0} />
          </mesh>
          <mesh position={[1.75, 1.0, 6.05]} rotation={[Math.PI / 2, 0, 0]} material={EM.nickel}>
            <cylinderGeometry args={[0.55, 0.55, 0.3, 24]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 4.1, 0.2, 5.4]} material={CM.rubber}>
              <cylinderGeometry args={[0.4, 0.4, 0.4, 16]} />
            </mesh>
          ))}
        </group>
        {/* cable del soldador, del zócalo al mango */}
        <Cable r={0.16} pts={[[-5.25, 1.0, 6.3], [-4.6, 0.2, 8.4], [2, 0.2, 9.4], [13, 0.2, 7], [onIron(23.5)[0], 0.4, onIron(23.5)[2] + 1.2], onIron(21.2), onIron(19.2), onIron(18.5)]} />
      </Part>

      {/* ---------------------------------------- soporte con esponja */}
      <Part id="soporte" offset={[0, -1, 2]} labelAt={[SX - 1, 1.6, -3]}>
        <group position={[SX, 0, 0]}>
          <RoundedBox args={[10, 1.4, 7]} radius={0.35} smoothness={3} position={[0, 0.7, 0]} material={CM.chassis} castShadow receiveShadow />
          {/* bandeja de la esponja */}
          <mesh position={[0.5, 1.45, 1.6]} material={CM.plasticGray}>
            <boxGeometry args={[6, 0.3, 3]} />
          </mesh>
          {/* columna y espiral */}
          <mesh position={[-3.5, 2.2, -1.6]} rotation={[0, 0, 0.5]} material={EM.steel}>
            <cylinderGeometry args={[0.25, 0.3, 2.4, 12]} />
          </mesh>
        </group>
        <group position={ironPos} rotation={ironRot}>
          <group position={[1.2, 0, 0]}>
            <Spiral r0={0.7} r1={1.25} len={7.5} turns={9} />
          </group>
        </group>
      </Part>
      <Part id="esponja" offset={[0, 1, 2]} labelAt={[SX + 2, 3, 2]}>
        <RoundedBox args={[5.6, 0.7, 2.6]} radius={0.2} smoothness={2} position={[SX + 0.5, 1.95, 1.6]} castShadow>
          <meshStandardMaterial color="#f2c230" roughness={0.95} />
        </RoundedBox>
        <mesh position={[SX + 0.5, 2.31, 1.6]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.3, 2.2]} />
          <meshStandardMaterial color="#b98a12" roughness={1} />
        </mesh>
        {/* viruta de bronce en su copa */}
        <mesh position={[SX + 3.8, 1.9, -1.8]} material={EM.steel}>
          <cylinderGeometry args={[1.2, 1.1, 1.2, 24, 1, true]} />
        </mesh>
        <mesh position={[SX + 3.8, 2.2, -1.8]}>
          <sphereGeometry args={[1.05, 14, 10]} />
          <meshStandardMaterial color="#c9a15a" metalness={0.9} roughness={0.7} wireframe />
        </mesh>
      </Part>

      {/* ---------------------------------------- soldador */}
      <group position={ironPos} rotation={ironRot}>
        <Part id="punta" offset={[-1.5, 0, 0]} labelAt={[0.3, 0.8, 0]}>
          <Iron hot={hot} />
        </Part>
      </group>

      {/* ---------------------------------------- carrete de estaño */}
      <Part id="esta" offset={[2, 0, 0]} labelAt={[12, 6, 2.8]}>
        <group position={[12, 2.8, 2.8]} rotation={[0, -0.4, 0]}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[0, 0, s * 1.3]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[2.8, 2.8, 0.2, 40]} />
              <meshStandardMaterial color="#d61f2c" roughness={0.45} />
            </mesh>
          ))}
          <mesh rotation={[Math.PI / 2, 0, 0]} material={TIN_LEAD}>
            <cylinderGeometry args={[2.3, 2.3, 2.4, 40]} />
          </mesh>
          <mesh position={[0, 0, 1.41]}>
            <planeGeometry args={[3.2, 0.8]} />
            <meshStandardMaterial map={spoolLabel} />
          </mesh>
        </group>
        <mesh geometry={spoolWire} material={TIN_LEAD} />
      </Part>
    </group>
  )
}

/** Perfil (radio, alto) del estaño alrededor de la pata, en mm. */
function jointProfile(r: Resultado): [number, number][] {
  const P = 1.2 // radio del pad
  const L = 0.32 // radio de la pata
  if (r === 'buena' || r === 'puente' || r === 'levantada') {
    // cono cóncavo: r = L + (P - L)(1 - t)^2.2
    return Array.from({ length: 14 }, (_, i) => {
      const t = i / 13
      return [L + (P - L) * Math.pow(1 - t, 2.2) + 0.02, t * 1.5] as [number, number]
    })
  }
  if (r === 'poco')
    return Array.from({ length: 10 }, (_, i) => {
      const t = i / 9
      return [L + (0.62 - L) * Math.pow(1 - t, 2) + 0.01, t * 0.55] as [number, number]
    })
  if (r === 'exceso')
    return Array.from({ length: 18 }, (_, i) => {
      const t = i / 17
      const a = -Math.PI / 2 + t * Math.PI * 0.95
      return [Math.max(L + 0.01, Math.cos(a) * 1.55 + (t < 0.15 ? 0 : 0)), 1.05 + Math.sin(a) * 1.05] as [number, number]
    })
  // fría: bolita apoyada, que casi no toca el pad
  return Array.from({ length: 16 }, (_, i) => {
    const t = i / 15
    const a = -Math.PI / 2 + t * Math.PI * 0.9
    return [Math.max(L + 0.01, Math.cos(a) * 0.9), 0.95 + Math.sin(a) * 0.82] as [number, number]
  })
}

export function PuntoModel(p: PuntoParams) {
  const d = diagnosticarPunto(p)
  const joint = useMemo(() => latheGeometry(jointProfile(d.r), 40, 0.05), [d.r])
  const goodJoint = useMemo(() => latheGeometry(jointProfile('buena'), 40, 0.05), [])
  const burnt = d.r === 'levantada'
  const PITCH = 2.54
  const board = useCanvasTexture(
    512,
    384,
    (ctx, w, h) => {
      ctx.fillStyle = '#cdbf80'
      ctx.fillRect(0, 0, w, h)
      // trama de la fibra de vidrio
      ctx.strokeStyle = 'rgba(120,110,60,0.12)'
      for (let i = 0; i < w; i += 6) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, h)
        ctx.stroke()
      }
      if (burnt) {
        const g = ctx.createRadialGradient(w * 0.42, h / 2, 10, w * 0.42, h / 2, 140)
        g.addColorStop(0, 'rgba(70,40,10,0.85)')
        g.addColorStop(1, 'rgba(70,40,10,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      }
    },
    [burnt],
  )
  // pads: el de la izquierda es el que se suelda; el de la derecha es el vecino
  const pads: V3[] = [
    [-PITCH / 2, 0, 0],
    [PITCH / 2, 0, 0],
  ]
  const leadTop = d.r === 'exceso' ? 2.4 : 2.0
  return (
    <group scale={1.2}>
      <Part id="placa" offset={[0, -2.5, 0]} labelAt={[-4.5, 0.2, 3]}>
        <mesh position={[0, -0.8, 0]} castShadow receiveShadow>
          <boxGeometry args={[12, 1.6, 8]} />
          <meshStandardMaterial map={board} roughness={0.6} />
        </mesh>
      </Part>
      <Part id="pad" offset={[0, 0.6, 0]} labelAt={[pads[1][0] + 0.4, 0.4, 1.6]}>
        {pads.map((q, i) => (
          <group key={i} position={q} rotation={burnt && i === 0 ? [0, 0, 0.25] : [0, 0, 0]}>
            <mesh position={[0, burnt && i === 0 ? 0.35 : 0.02, 0]} material={COPPER}>
              <cylinderGeometry args={[1.2, 1.2, 0.05, 40]} />
            </mesh>
          </group>
        ))}
        {/* pistas que salen de cada pad */}
        {pads.map((q, i) => (
          <mesh key={i} position={[q[0], 0.02, i ? 2.4 : -2.4]} material={COPPER}>
            <boxGeometry args={[0.6, 0.05, 3.2]} />
          </mesh>
        ))}
      </Part>
      <Part id="pata" offset={[0, 1.2, 0]} labelAt={[pads[0][0] - 0.2, leadTop + 0.5, 0]}>
        {pads.map((q, i) => (
          <mesh key={i} position={[q[0], leadTop / 2 - 1.2, 0]} material={TIN_LEAD}>
            <cylinderGeometry args={[0.3, 0.3, leadTop + 2.4, 12]} />
          </mesh>
        ))}
        {/* corte en bisel del alicate */}
        {pads.map((q, i) => (
          <mesh key={`c${i}`} position={[q[0], leadTop, 0]} rotation={[0, 0, 0.5]} material={TIN_LEAD}>
            <cylinderGeometry args={[0.3, 0.3, 0.05, 12]} />
          </mesh>
        ))}
      </Part>
      <Part id="estano" offset={[0, 2.2, 0]} labelAt={[pads[0][0] - 1.4, 1.6, 0]}>
        <mesh geometry={joint} position={[pads[0][0], burnt ? 0.36 : 0.05, 0]} material={d.r === 'fria' ? SOLDER_DULL : SOLDER} castShadow />
        {/* el vecino ya estaba bien soldado */}
        <mesh geometry={goodJoint} position={[pads[1][0], 0.05, 0]} material={SOLDER} castShadow />
        {d.r === 'puente' && (
          <mesh position={[0, 0.35, 0]} scale={[1.6, 0.42, 0.65]} material={SOLDER}>
            <sphereGeometry args={[1, 24, 14]} />
          </mesh>
        )}
      </Part>
      <Part id="flux" offset={[0, 0.8, 1.5]} labelAt={[pads[0][0] + 0.2, 0.3, 1.9]}>
        <mesh position={[pads[0][0], 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} material={FLUX}>
          <ringGeometry args={[1.25, d.r === 'fria' ? 1.5 : 1.85, 40]} />
        </mesh>
      </Part>
      <Part id="componente" offset={[0, -2, 0]} labelAt={[0, -3.6, 2]}>
        {/* resistencia del otro lado de la placa, con sus patas dobladas */}
        <group position={[0, -2.9, 0]}>
          <AxialResistor ohms={220} len={6.3} d={2.4} />
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 3.7, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={TIN_LEAD}>
              <cylinderGeometry args={[0.3, 0.3, 1.2, 10]} />
            </mesh>
          ))}
        </group>
      </Part>
    </group>
  )
}

// Diseño de la placa (mm, origen en el centro, 50 × 32 mm): LED intermitente con 555.
const BW = 50
const BH = 32
interface Pad {
  x: number
  y: number
  r: number
  sq?: boolean
}
const IC: Pad[] = Array.from({ length: 8 }, (_, i) => ({ x: -6 + (i < 4 ? i : 7 - i) * 2.54, y: i < 4 ? -3.81 : 3.81, r: 0.9, sq: i === 0 }))
const PADS: Pad[] = [
  ...IC,
  // R1, R2 (10,16 mm), C1, LED, R3, bornera
  { x: -19, y: -9, r: 1.1 },
  { x: -8.84, y: -9, r: 1.1 },
  { x: -19, y: 9, r: 1.1 },
  { x: -8.84, y: 9, r: 1.1 },
  { x: 6, y: 9.5, r: 1.1, sq: true },
  { x: 11.08, y: 9.5, r: 1.1 },
  { x: 8, y: -9.5, r: 1.1, sq: true },
  { x: 10.54, y: -9.5, r: 1.1 },
  { x: 14, y: 0, r: 1.1 },
  { x: 14, y: -5.08, r: 1.1 },
  { x: 20, y: 5, r: 1.4, sq: true },
  { x: 20, y: -0.08, r: 1.4 },
]
const TRACES: [number, number][][] = [
  [
    [-19, -9],
    [-19, 9],
  ],
  [
    [-8.84, -9],
    [-6, -9],
    [-6, -3.81],
  ],
  [
    [-8.84, 9],
    [-3.46, 9],
    [-3.46, 3.81],
  ],
  [
    [-0.92, 3.81],
    [-0.92, 6.5],
    [6, 6.5],
    [6, 9.5],
  ],
  [
    [1.62, -3.81],
    [4, -3.81],
    [4, -9.5],
    [8, -9.5],
  ],
  [
    [11.08, 9.5],
    [14, 9.5],
    [14, 0],
  ],
  [
    [10.54, -9.5],
    [14, -9.5],
    [14, -5.08],
  ],
  [
    [20, 5],
    [20, 12.5],
    [-19, 12.5],
    [-19, 9],
  ],
  [
    [20, -0.08],
    [20, -13],
    [-3.46, -13],
    [-3.46, -3.81],
  ],
]

function drawLayout(ctx: CanvasRenderingContext2D, w: number, _h: number, color: string, holes: boolean) {
  const s = w / BW
  const X = (x: number) => (x + BW / 2) * s
  const Y = (y: number) => (BH / 2 - y) * s
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 1.1 * s
  for (const t of TRACES) {
    ctx.beginPath()
    t.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))))
    ctx.stroke()
  }
  for (const p of PADS) {
    if (p.sq) ctx.fillRect(X(p.x) - p.r * s, Y(p.y) - p.r * s, p.r * 2 * s, p.r * 2 * s)
    else {
      ctx.beginPath()
      ctx.arc(X(p.x), Y(p.y), p.r * s, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  if (holes) {
    ctx.fillStyle = '#111'
    for (const p of PADS) {
      ctx.beginPath()
      ctx.arc(X(p.x), Y(p.y), 0.42 * s, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

const COPPER_FULL = canvasTex(1000, 640, (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, '#e9a57a')
  g.addColorStop(0.5, '#d98c5f')
  g.addColorStop(1, '#e8a173')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  // rayas del lijado con virulana
  for (let i = 0; i < 900; i++) {
    ctx.strokeStyle = `rgba(${i % 2 ? '255,230,210' : '120,60,30'},0.08)`
    ctx.beginPath()
    const x = (i * 97) % w
    const y = (i * 61) % h
    ctx.moveTo(x, y)
    ctx.lineTo(x + 30 + (i % 40), y + ((i % 7) - 3))
    ctx.stroke()
  }
})

export function PcbModel({ etapa }: PcbParams) {
  const layer = (color: string, holes: boolean) => canvasTex(1000, 640, (ctx, w, h) => drawLayout(ctx, w, h, color, holes))
  const tex = useMemo(
    () => ({
      toner: layer('#141414', false),
      copper: layer('#ffffff', false),
      copperHoles: layer('#ffffff', true),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const S = 0.12 // mm → unidades
  const flip = etapa >= 4
  const spin = useRef<THREE.Group>(null)
  useKeepRendering(true, 30)
  useFrame((_, dt) => {
    if (!spin.current) return
    const target = flip ? Math.PI : 0
    spin.current.rotation.x += (target - spin.current.rotation.x) * Math.min(1, dt * 3)
  })
  const copperMap = etapa >= 3 ? tex.copperHoles : tex.copper
  return (
    <group scale={S} position={[0, 1.6 * S + 0.4, 0]}>
      <group ref={spin}>
        <Part id="sustrato" offset={[0, -8, 0]} labelAt={[-BW / 2 + 4, -1.6, BH / 2]}>
          <mesh position={[0, -0.8, 0]} material={[FR4_EDGE, FR4_EDGE, FR4, FR4, FR4_EDGE, FR4_EDGE]} castShadow receiveShadow>
            <boxGeometry args={[BW, 1.6, BH]} />
          </mesh>
        </Part>
        <Part id="cobre" offset={[0, 5, 0]} labelAt={[-BW / 2 + 8, 0.5, -BH / 2 + 3]}>
          {etapa < 2 ? (
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[BW, BH]} />
              <meshStandardMaterial map={COPPER_FULL ?? undefined} metalness={1} roughness={0.25} />
            </mesh>
          ) : (
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[BW, BH]} />
              <meshStandardMaterial color={etapa === 2 ? '#c98057' : '#e19468'} map={COPPER_FULL ?? undefined} alphaMap={copperMap ?? undefined} alphaTest={0.5} metalness={1} roughness={etapa >= 4 ? 0.35 : 0.22} />
            </mesh>
          )}
        </Part>
        {(etapa === 1 || etapa === 2) && (
          <Part id="toner" offset={[0, 9, 0]} labelAt={[0, 0.6, 3]}>
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[BW, BH]} />
              <meshStandardMaterial color="#121212" roughness={0.7} alphaMap={tex.copper ?? undefined} alphaTest={0.5} />
            </mesh>
          </Part>
        )}
        {etapa >= 3 && (
          <Part id="agujeros" offset={[0, 0, 0]} labelAt={[IC[0].x, 0.5, -IC[0].y]}>
            {PADS.map((q, i) => (
              <mesh key={i} position={[q.x, -0.8, -q.y]}>
                <cylinderGeometry args={[0.43, 0.43, 1.66, 10, 1, true]} />
                <meshStandardMaterial color="#2a2616" side={THREE.BackSide} />
              </mesh>
            ))}
          </Part>
        )}
        {etapa >= 4 && (
          <Part id="componentes" offset={[0, -10, 0]} labelAt={[0, -9, 0]}>
            <Components />
          </Part>
        )}
      </group>
    </group>
  )
}

/** Componentes del LED intermitente, del lado sin cobre (y negativo, la placa se da vuelta), con las soldaduras del otro. */
function Components() {
  const below = -1.6
  const joint = useMemo(() => latheGeometry(jointProfile('buena'), 24, 0.05), [])
  const capLabel = useCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#1b3f8f'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#c7ccd6'
      ctx.fillRect(w * 0.4, 0, w * 0.2, h)
      ctx.fillStyle = '#e8ebf0'
      ctx.font = 'bold 34px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('10µF', w * 0.2, h / 2)
    },
    [],
  )
  const icLabel = useCanvasTexture(
    256,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#141518'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#d6d9de'
      ctx.font = 'bold 44px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('NE555P', w / 2, 70)
      ctx.beginPath()
      ctx.arc(26, h / 2, 10, 0, Math.PI * 2)
      ctx.fill()
    },
    [],
  )
  return (
    <group>
      {/* soldaduras del lado del cobre */}
      {PADS.map((q, i) => (
        <mesh key={i} geometry={joint} position={[q.x, 0.02, -q.y]} scale={[q.r / 1.2, 0.9, q.r / 1.2]} material={SOLDER} />
      ))}
      <group position={[0, below, 0]} rotation={[Math.PI, 0, 0]}>
        {/* 555 en encapsulado DIP-8 */}
        <group position={[-2.19, 1.7, 0]}>
          <RoundedBox args={[9.8, 3.2, 6.4]} radius={0.3} smoothness={2} material={CM.chip} castShadow />
          <mesh position={[0, 1.61, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[9.4, 6]} />
            <meshStandardMaterial map={icLabel} roughness={0.45} />
          </mesh>
        </group>
        {/* resistencias */}
        {[
          [-13.92, 9, 10000],
          [-13.92, -9, 1000],
        ].map(([x, y, v]) => (
          <group key={v} position={[x, 1.4, y]}>
            <AxialResistor ohms={v} len={6.3} d={2.4} />
          </group>
        ))}
        <group position={[8.54, 1.4, 9.5]} rotation={[0, 0, 0]}>
          <AxialResistor ohms={330} len={3.6} d={1.6} />
        </group>
        {/* capacitor electrolítico */}
        <group position={[14, 6.5, -2.54]}>
          <mesh castShadow>
            <cylinderGeometry args={[2.5, 2.5, 11, 32]} />
            <meshStandardMaterial map={capLabel} roughness={0.35} />
          </mesh>
          <mesh position={[0, 5.51, 0]} rotation={[-Math.PI / 2, 0, 0]} material={EM.nickel}>
            <circleGeometry args={[2.3, 32]} />
          </mesh>
        </group>
        {/* LED rojo de 5 mm */}
        <group position={[9.27, 0, -9.5]}>
          <mesh position={[0, 4.5, 0]}>
            <cylinderGeometry args={[2.5, 2.5, 5, 24]} />
            <meshPhysicalMaterial color="#ff3b3b" transmission={0.4} thickness={2} roughness={0.15} emissive="#ff2a1a" emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[0, 7, 0]}>
            <sphereGeometry args={[2.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshPhysicalMaterial color="#ff3b3b" transmission={0.4} thickness={2} roughness={0.15} emissive="#ff2a1a" emissiveIntensity={0.6} />
          </mesh>
        </group>
        {/* bornera de dos tornillos */}
        <group position={[20, 5, 2.46]}>
          <RoundedBox args={[7.5, 10, 10]} radius={0.3} smoothness={2} castShadow>
            <meshStandardMaterial color="#1f7a3a" roughness={0.5} />
          </RoundedBox>
          {[-2.54, 2.54].map((z) => (
            <mesh key={z} position={[0, 5.05, z]} rotation={[-Math.PI / 2, 0, 0]} material={EM.nickel}>
              <circleGeometry args={[1.5, 20]} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  )
}

export interface FuenteParams {
  etapa: Etapa
  /** corriente que toma la carga (mA) */
  carga: number
}

/** Pantalla del osciloscopio con la forma de onda de la etapa elegida. */
function useScope(etapa: Etapa, carga: number) {
  return useCanvasTexture(
    640,
    480,
    (ctx, w, h) => {
      ctx.fillStyle = '#061008'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = 'rgba(120,200,140,0.22)'
      ctx.lineWidth = 1
      for (let i = 0; i <= 10; i++) {
        ctx.beginPath()
        ctx.moveTo((i * w) / 10, 0)
        ctx.lineTo((i * w) / 10, h)
        ctx.stroke()
      }
      for (let j = 0; j <= 8; j++) {
        ctx.beginPath()
        ctx.moveTo(0, (j * h) / 8)
        ctx.lineTo(w, (j * h) / 8)
        ctx.stroke()
      }
      const v = fuenteValores(carga)
      // escala: red 100 V/div, el resto 5 V/div; 5 ms/div (2,5 ciclos en pantalla)
      const vdiv = etapa === 'red' ? 100 : 5
      const mid = etapa === 'red' || etapa === 'secundario' ? h / 2 : h * 0.875
      const f = (t: number) => {
        const ph = t * 2 * Math.PI * 50
        if (etapa === 'red') return 311 * Math.sin(ph)
        if (etapa === 'secundario') return v.vp * Math.sin(ph)
        if (etapa === 'rectificada') return Math.max(0, Math.abs(v.vp * Math.sin(ph)) - 1.4)
        if (etapa === 'filtrada') {
          // diente de sierra: carga en el pico y descarga lineal
          const k = (t * 100) % 1
          return v.vrect - v.ripple * Math.min(1, k / 0.85) + (k > 0.85 ? v.ripple * ((k - 0.85) / 0.15) : 0)
        }
        return v.vout
      }
      ctx.strokeStyle = '#7dff9a'
      ctx.shadowColor = '#7dff9a'
      ctx.shadowBlur = 8
      ctx.lineWidth = 3
      ctx.beginPath()
      for (let x = 0; x <= w; x += 2) {
        const t = (x / w) * 0.05
        const y = mid - (f(t) / vdiv) * (h / 8)
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.fillStyle = '#b8ffc6'
      ctx.font = 'bold 22px monospace'
      ctx.fillText(`CH1 ${vdiv} V/div   5 ms/div`, 12, 26)
      const txt =
        etapa === 'red'
          ? '220 V ef · 311 V pico'
          : etapa === 'secundario'
            ? `12 V ef · ${v.vp.toFixed(1)} V pico`
            : etapa === 'rectificada'
              ? `pulsante · ${v.vrect.toFixed(1)} V pico · 100 Hz`
              : etapa === 'filtrada'
                ? `${v.vdc.toFixed(1)} V · ripple ${v.ripple.toFixed(2)} V`
                : v.regula
                  ? '12,0 V continua'
                  : `¡no regula! ${v.vout.toFixed(1)} V`
      ctx.fillText(txt.replace('.', ','), 12, h - 14)
    },
    [etapa, carga],
  )
}

/** Transformador de chapas EI con su carrete y los cables de primario y secundario. Base en y = 0. */
function Transformer() {
  const lam = useMemo(
    () =>
      canvasTex(256, 256, (ctx, w, h) => {
        ctx.fillStyle = '#4b4f55'
        ctx.fillRect(0, 0, w, h)
        for (let y = 0; y < h; y += 4) {
          ctx.fillStyle = y % 8 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.25)'
          ctx.fillRect(0, y, w, 2)
        }
      }),
    [],
  )
  return (
    <group>
      {/* paquete de chapas EI */}
      <mesh position={[0, 2.2, 0]} castShadow>
        <boxGeometry args={[5.6, 4.4, 3.2]} />
        <meshStandardMaterial map={lam ?? undefined} metalness={0.6} roughness={0.5} />
      </mesh>
      {/* carrete con el bobinado (se ve el papel aislante) */}
      <RoundedBox args={[2.8, 3.0, 4.6]} radius={0.25} smoothness={3} position={[0, 2.2, 0]} castShadow>
        <meshStandardMaterial color="#e8d9a8" roughness={0.75} />
      </RoundedBox>
      {/* escuadras de montaje */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 3.3, 0.06, 0]} material={EM.steel}>
          <boxGeometry args={[1.4, 0.12, 3.2]} />
        </mesh>
      ))}
      {/* cables: primario negro (220 V), secundario rojo (12 V) */}
      {[-0.4, 0.4].map((z) => (
        <Cable key={`p${z}`} r={0.09} material={CM.rubber} pts={[[-1.2, 3.6, 2.2 + z * 0], [-1.6, 3.2, 3.0], [-3.8, 0.4, 3.6 + z]]} />
      ))}
      {[-0.4, 0.4].map((z) => (
        <Cable key={`s${z}`} r={0.09} material={CM.sataRed} pts={[[1.2, 3.6, 2.2], [1.6, 3.2, 3.0], [4.4, 0.6, 2.0 + z]]} />
      ))}
    </group>
  )
}

/** Diodo 1N4007 acostado sobre la placa, a lo largo de x. */
function Diode({ position, rotY = 0 }: { position: V3; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.52, 16]} />
        <meshStandardMaterial color="#141416" roughness={0.35} />
      </mesh>
      <mesh position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.142, 0.142, 0.06, 16]} />
        <meshStandardMaterial color="#c9ccd1" />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} material={TIN_LEAD}>
        <cylinderGeometry args={[0.02, 0.02, 1.2, 6]} />
      </mesh>
    </group>
  )
}

export function FuenteModel({ etapa, carga }: FuenteParams) {
  const scope = useScope(etapa, carga)
  // dónde apoya la punta del osciloscopio en cada etapa
  const probeAt: Record<Etapa, V3> = {
    red: [-6.6, 0.55, 1.6],
    secundario: [-0.6, 0.55, 1.5],
    rectificada: [1.9, 0.6, 1.2],
    filtrada: [4.3, 2.9, 0.8],
    regulada: [8.2, 0.6, 1.6],
  }
  const tip = new THREE.Vector3(...probeAt[etapa])
  const probeTop = tip.clone().add(new THREE.Vector3(-0.6, 2.6, 1.4))
  const SCOPE: V3 = [-2, 0, -7.5]
  const lead = useMemo(
    () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([probeTop, probeTop.clone().add(new THREE.Vector3(0, 1.2, 0.6)), new THREE.Vector3(SCOPE[0] + 3.3, 1.5, SCOPE[2] + 3.4), new THREE.Vector3(SCOPE[0] + 3.3, 1.8, SCOPE[2] + 2.3)]), 40, 0.07, 8, false),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [etapa],
  )
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), probeTop.clone().sub(tip).normalize())
  const regLabel = useCanvasTexture(
    128,
    96,
    (ctx, w, h) => {
      ctx.fillStyle = '#141518'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#d6d9de'
      ctx.font = 'bold 30px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('L7812', w / 2, 44)
      ctx.font = '18px Arial'
      ctx.fillText('CV', w / 2, 74)
    },
    [],
  )
  const capLabel = useCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#121418'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#9ba3ad'
      ctx.fillRect(w * 0.4, 0, w * 0.2, h)
      ctx.fillStyle = '#e8ebf0'
      ctx.font = 'bold 30px Arial'
      ctx.textAlign = 'center'
      ctx.save()
      ctx.translate(w * 0.2, h / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText('2200µF 25V', 0, 10)
      ctx.restore()
    },
    [],
  )
  return (
    <group>
      {/* placa base de la fuente */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[19, 0.3, 7.5]} />
        <meshStandardMaterial color="#2f6b3e" roughness={0.5} />
      </mesh>
      <Part id="fusible" offset={[-1, 0, 2]} labelAt={[-7.5, 1.4, 1.6]}>
        <group position={[-7.4, 0.3, 1.6]}>
          {/* portafusible con fusible de vidrio */}
          <mesh position={[0, 0.3, 0]} material={CM.plastic}>
            <boxGeometry args={[2.4, 0.5, 0.9]} />
          </mesh>
          <mesh position={[0, 0.75, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.25, 0.25, 1.6, 16]} />
            <meshPhysicalMaterial color="#ffffff" transmission={0.9} roughness={0.05} thickness={0.2} transparent opacity={0.6} />
          </mesh>
          {[-0.85, 0.85].map((x) => (
            <mesh key={x} position={[x, 0.75, 0]} rotation={[0, 0, Math.PI / 2]} material={EM.nickel}>
              <cylinderGeometry args={[0.27, 0.27, 0.35, 16]} />
            </mesh>
          ))}
        </group>
        <Cable r={0.22} material={CM.rubber} pts={[[-9.5, 0.4, 0.4], [-11.5, 0.3, 1.5], [-12.5, 0.25, 4]]} />
      </Part>
      <Part id="transformador" offset={[-2, 2, -1]} labelAt={[-4.8, 5.2, 0]}>
        <group position={[-4.8, 0.3, -0.6]}>
          <Transformer />
        </group>
      </Part>
      <Part id="puente" offset={[0, 2, 1]} labelAt={[1.2, 1.3, 1.2]}>
        {/* cuatro diodos en rombo */}
        <Diode position={[0.6, 0.55, 0.4]} rotY={0.785} />
        <Diode position={[1.8, 0.55, 0.4]} rotY={-0.785} />
        <Diode position={[0.6, 0.55, -0.8]} rotY={-0.785} />
        <Diode position={[1.8, 0.55, -0.8]} rotY={0.785} />
      </Part>
      <Part id="capacitor" offset={[0, 3, 0]} labelAt={[4.3, 3.6, 0]}>
        <group position={[4.3, 1.75, -0.6]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.8, 0.8, 2.9, 36]} />
            <meshStandardMaterial map={capLabel} roughness={0.35} />
          </mesh>
          <mesh position={[0, 1.46, 0]} rotation={[-Math.PI / 2, 0, 0]} material={EM.nickel}>
            <circleGeometry args={[0.74, 32]} />
          </mesh>
        </group>
      </Part>
      <Part id="regulador" offset={[0, 3, -1.5]} labelAt={[6.6, 3.9, -1.6]}>
        <group position={[6.6, 0.3, -1.6]}>
          {/* TO-220: cuerpo negro con su lengüeta metálica atornillada al disipador */}
          <mesh position={[0, 1.55, 0.25]} material={CM.chip}>
            <boxGeometry args={[1.0, 0.9, 0.45]} />
          </mesh>
          <mesh position={[0, 1.55, 0.481]}>
            <planeGeometry args={[0.95, 0.7]} />
            <meshStandardMaterial map={regLabel} />
          </mesh>
          <mesh position={[0, 2.25, 0]} material={EM.nickel}>
            <boxGeometry args={[1.0, 0.6, 0.13]} />
          </mesh>
          {[-0.25, 0, 0.25].map((x) => (
            <mesh key={x} position={[x, 0.55, 0.25]} material={TIN_LEAD}>
              <boxGeometry args={[0.07, 1.1, 0.04]} />
            </mesh>
          ))}
          {/* disipador de aluminio con aletas */}
          <group position={[0, 1.7, -0.5]}>
            <mesh material={CM.aluDark}>
              <boxGeometry args={[2.4, 3, 0.15]} />
            </mesh>
            {Array.from({ length: 7 }, (_, i) => (
              <mesh key={i} position={[-1.05 + i * 0.35, 0, -0.45]} material={CM.aluDark}>
                <boxGeometry args={[0.1, 3, 0.9]} />
              </mesh>
            ))}
          </group>
        </group>
      </Part>
      <Part id="salida" offset={[1.5, 1, 0]} labelAt={[8.4, 2.2, 1.6]}>
        <group position={[8.2, 0.3, 1.6]}>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.5, 20]} />
            <meshStandardMaterial color="#2aff5a" emissive="#22c55e" emissiveIntensity={1.6} transparent opacity={0.9} />
          </mesh>
          <mesh position={[0, 0.95, 0]}>
            <sphereGeometry args={[0.25, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#2aff5a" emissive="#22c55e" emissiveIntensity={1.6} transparent opacity={0.9} />
          </mesh>
        </group>
        <group position={[8.6, 0.3, -1.4]}>
          <RoundedBox args={[1.0, 1.0, 2.0]} radius={0.06} smoothness={2} position={[0, 0.5, 0]}>
            <meshStandardMaterial color="#1f7a3a" roughness={0.5} />
          </RoundedBox>
          {[-0.5, 0.5].map((z, i) => (
            <mesh key={z} position={[0, 1.01, z]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.28, 20]} />
              <meshStandardMaterial color={i ? '#dc2626' : '#111'} />
            </mesh>
          ))}
        </group>
      </Part>
      {/* ---------------------------------------- osciloscopio y su punta */}
      <Part id="osciloscopio" offset={[0, 0, -3]} labelAt={[SCOPE[0] - 4, 6.4, SCOPE[2]]}>
        <group position={SCOPE}>
          <RoundedBox args={[12, 6.4, 4.2]} radius={0.4} smoothness={3} position={[0, 3.2, 0]} material={CM.plasticGray} castShadow receiveShadow />
          <mesh position={[-1.6, 3.4, 2.11]}>
            <planeGeometry args={[7.2, 5.0]} />
            <meshStandardMaterial color="#000" emissive="#ffffff" emissiveMap={scope} emissiveIntensity={1} />
          </mesh>
          {/* perillas y conector BNC del canal 1 */}
          {[
            [3.6, 4.9],
            [4.9, 4.9],
            [3.6, 3.4],
            [4.9, 3.4],
          ].map(([x, y], i) => (
            <mesh key={i} position={[x, y, 2.2]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.45, 0.48, 0.4, 24]} />
              <meshStandardMaterial color="#1b1c1f" roughness={0.45} />
            </mesh>
          ))}
          <mesh position={[5.3, 1.8, 2.25]} rotation={[Math.PI / 2, 0, 0]} material={EM.nickel}>
            <cylinderGeometry args={[0.3, 0.3, 0.5, 16]} />
          </mesh>
        </group>
        <mesh geometry={lead}>
          <meshStandardMaterial color="#1d4ed8" roughness={0.5} />
        </mesh>
        <group position={tip} quaternion={q}>
          <mesh position={[0, 0.06, 0]} material={EM.nickel}>
            <cylinderGeometry args={[0.03, 0.01, 0.3, 8]} />
          </mesh>
          <mesh position={[0, 1.4, 0]}>
            <cylinderGeometry args={[0.18, 0.15, 2.4, 16]} />
            <meshStandardMaterial color="#1d4ed8" roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <torusGeometry args={[0.24, 0.06, 8, 20]} />
            <meshStandardMaterial color="#1b1c1f" />
          </mesh>
        </group>
      </Part>
    </group>
  )
}
