import { useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { Part, type Vec3 } from '../Part'
import { Wire, useCanvasTexture } from '../helpers'
import {
  B,
  BED,
  Bar,
  BedSection,
  Brida,
  Chuck3,
  CylX,
  Handwheel,
  Lever,
  M,
  PernoArrastre,
  PlatoLiso,
  Portainserto,
  PuntoFijo,
  PuntoGiratorioCuerpo,
  PuntoGiratorioPunta,
  LunetaFijaCuerpo,
  LunetaZapata,
  LunetaBulon,
  LunetaTuerca,
  PatinLuneta,
  Smooth,
  Spin,
  boxesGeometry,
  gearX,
  ni,
  revolve,
  type BoxSpec,
} from './TornoAccesorios'

/* ------------------------------------------------------------------ */
/* Torno paralelo de taller escolar (≈ 1000 mm entre puntas,           */
/* volteo 360 mm). Se modela con 1 unidad = 10 mm y todo el conjunto   */
/* se achica ×0,1 (en pantalla 1 unidad = 100 mm).                     */
/* x = a lo largo de la bancada (cabezal a la izquierda, −x),          */
/* y = arriba (bancada en y = 0, eje del husillo en y = 18),           */
/* z = hacia el operario (+z = frente del torno).                      */
/* ------------------------------------------------------------------ */

const D = Math.PI / 180
const AXIS = BED.center // 18 → 180 mm de altura de puntas
const BED_X0 = -92
const BED_X1 = 90
const HS = { x0: -92, x1: -49, top: 42, z0: -18, z1: 16 }
const NOSE_X = -47 // cara de la nariz del husillo
const CHUCK_X = NOSE_X + 2.2
const JAWS_FRONT = CHUCK_X + 6.6 + 3.2
const NORTON = { x0: -92, x1: -56, y0: -26, y1: -4, z0: 17, z1: 26.5 }
const RODS = { z: 22.3, screwY: -9, feedY: -15, ctrlY: -20, x0: -56, x1: 89 }
const APRON = { y0: -25, y1: 1.7, z0: 18.6, z1: 26.5, hw: 14 }
const FLOOR = -90
const TRAY_Y = -32.5
const PED_L = { x0: -92, x1: -56 }
const PED_R = { x0: 58, x1: 90 }
const COVER = { x0: -99.5, x1: -92, y0: -64, y1: 40, z0: -18, z1: 26.5 }
const MOTOR = { y: -58, z: -9 }
const PULLEY_HS = { y: 10, z: -9, r: 6 }
const PULLEY_M = { y: MOTOR.y, z: MOTOR.z, r: 3.5 }
const GEAR_X = -96.6
const LUNETA_X = 30

export const RPMS = [45, 63, 90, 125, 180, 250, 355, 500, 710, 1000, 1400, 2000]

export type Montaje = 'aire' | 'contrapunta' | 'puntas' | 'luneta'
export type Avance = 'cilindrar' | 'neutro' | 'frentear'

export interface TornoParams {
  rpmIdx: number
  on: boolean
  carro: number // 0–100 %
  trans: number // radio en la punta de la herramienta (mm)
  charriot: number // grados respecto del eje del torno
  contrapunta: number // 0–100 %
  manguito: number // mm que sobresale el cañón
  montaje: Montaje
  avance: Avance
  tuerca: boolean
  tapa: boolean
}

/** Posiciones que dependen de los parámetros (todo en unidades de 10 mm). */
export function tornoLayout(p: TornoParams) {
  let xt = -5 + (69 * p.contrapunta) / 100
  if (p.montaje === 'luneta') xt = Math.max(xt, 52)
  const qe = Math.max(2, Math.min(10, p.manguito / 10))
  const tailTip = xt - qe - 10.2
  const barR = p.montaje === 'luneta' ? 1.25 : 2
  const barX0 = p.montaje === 'puntas' ? -40.0 : -41
  const barX1 = p.montaje === 'aire' ? JAWS_FRONT + 12 : p.montaje === 'luneta' ? LUNETA_X + 10 : tailTip + 0.45
  const xcMin = -29
  let xcMax = p.montaje === 'luneta' ? LUNETA_X - 25 : xt - 21
  if (xcMax < xcMin) xcMax = xcMin
  const xc = xcMin + ((xcMax - xcMin) * p.carro) / 100
  const tipR = Math.max(1.0, Math.min(10, p.trans / 10))
  const cz = tipR + 12
  const toolX = xc - 4.4
  return { xt, qe, tailTip, barR, barX0, barX1, xc, cz, tipR, toolX, jawsFront: JAWS_FRONT }
}

/* ================================================================== texturas */

function useRpmPlate() {
  return useCanvasTexture(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#d9d4c3'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#2a2a2a'
      ctx.lineWidth = 6
      ctx.strokeRect(8, 8, w - 16, h - 16)
      ctx.fillStyle = '#1d1d1d'
      ctx.font = 'bold 40px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('VELOCIDADES  (r.p.m.)', w / 2, 60)
      ctx.font = 'bold 34px Arial, sans-serif'
      RPMS.forEach((r, i) => {
        const col = i < 6 ? 0 : 1
        const row = i % 6
        const x = col === 0 ? w * 0.28 : w * 0.72
        const y = 120 + row * 62
        ctx.fillStyle = col === 0 ? '#1f4f8a' : '#8a1f1f'
        ctx.fillText(`${col === 0 ? 'I' : 'II'}-${row + 1}`, x - 70, y)
        ctx.fillStyle = '#1d1d1d'
        ctx.fillText(String(r), x + 50, y)
      })
      ctx.beginPath()
      ctx.moveTo(w / 2, 90)
      ctx.lineTo(w / 2, h - 30)
      ctx.lineWidth = 3
      ctx.stroke()
    },
    [],
  )
}

function useNortonPlate() {
  return useCanvasTexture(
    512,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#d9d4c3'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#2a2a2a'
      ctx.lineWidth = 5
      ctx.strokeRect(6, 6, w - 12, h - 12)
      ctx.fillStyle = '#1d1d1d'
      ctx.font = 'bold 26px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('CAJA NORTON — AVANCES Y ROSCAS', w / 2, 38)
      ctx.font = '20px Arial, sans-serif'
      const cols = ['1', '2', '3', '4', '5', '6', '7', '8']
      const rows: [string, string[]][] = [
        ['mm/v', ['0,05', '0,07', '0,10', '0,14', '0,20', '0,28', '0,40', '0,56']],
        ['P mm', ['0,75', '1', '1,25', '1,5', '1,75', '2', '2,5', '3']],
        ['h/1"', ['28', '24', '20', '19', '16', '14', '12', '11']],
      ]
      cols.forEach((c, i) => ctx.fillText(c, 110 + i * 50, 80))
      rows.forEach(([lab, vals], r) => {
        ctx.textAlign = 'left'
        ctx.fillText(lab, 16, 125 + r * 45)
        ctx.textAlign = 'center'
        vals.forEach((v, i) => ctx.fillText(v, 110 + i * 50, 125 + r * 45))
      })
    },
    [],
  )
}

/** Tambor graduado (nonio): 100 divisiones alrededor de un cilindro. */
function useDialTexture(div = 100, labelEvery = 10, bg = '#c9ccd0') {
  return useCanvasTexture(
    1024,
    64,
    (ctx, w, h) => {
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#111'
      ctx.font = 'bold 20px Arial, sans-serif'
      ctx.textAlign = 'center'
      for (let i = 0; i < div; i++) {
        const x = (i / div) * w
        const big = i % labelEvery === 0
        ctx.fillRect(x, 0, 2, big ? 30 : i % 5 === 0 ? 22 : 14)
        if (big) ctx.fillText(String(i), x + 1, 54)
      }
    },
    [div, labelEvery, bg],
  )
}

function useSwivelScale() {
  return useCanvasTexture(
    1024,
    48,
    (ctx, w, h) => {
      ctx.fillStyle = '#c9ccd0'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#111'
      ctx.font = 'bold 16px Arial, sans-serif'
      ctx.textAlign = 'center'
      for (let d = 0; d < 360; d += 2) {
        const x = (d / 360) * w
        const big = d % 10 === 0
        ctx.fillRect(x, 0, 2, big ? 20 : 11)
        if (d % 30 === 0) {
          const v = d <= 90 ? d : d <= 270 ? Math.abs(180 - d) : 360 - d
          ctx.fillText(String(v), x + 1, 40)
        }
      }
    },
    [],
  )
}

/** Rosca cuadrada del tornillo patrón: una banda helicoidal por paso. */
function useThreadTexture(repeat: number) {
  const t = useCanvasTexture(
    128,
    64,
    (ctx, w, h) => {
      ctx.fillStyle = '#5e6268'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#d4d7db'
      // banda inclinada que da una vuelta por cada paso
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(0, h * 0.5)
      ctx.lineTo(w, h)
      ctx.lineTo(w, h * 0.5)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(0, -h * 0.5 + h)
      ctx.lineTo(0, h)
      ctx.lineTo(w * 0.0, h)
      ctx.fill()
    },
    [],
  )
  return useMemo(() => {
    const c = t.clone()
    c.wrapS = THREE.RepeatWrapping
    c.wrapT = THREE.RepeatWrapping
    c.repeat.set(1, repeat)
    c.needsUpdate = true
    return c
  }, [t, repeat])
}

/* ================================================================== piezas del torno */

function Rack() {
  const geo = useMemo(() => {
    const list: BoxSpec[] = [{ p: [(-54 + 86) / 2, -2.2, 17.7], s: [140, 1.2, 1.4] }]
    for (let x = -53.5; x < 86; x += 0.94) list.push({ p: [x, -3.05, 17.7], s: [0.45, 0.6, 1.4] })
    return boxesGeometry(list)
  }, [])
  return <mesh geometry={geo} material={M.satin} />
}

function Bancada() {
  return (
    <group>
      <BedSection x0={BED_X0} x1={BED_X1} />
      <Rack />
      {/* patines de apoyo de la bancada sobre los pies */}
      <B p={[(PED_L.x0 + PED_L.x1) / 2, -29.75, 0]} s={[30, 3.5, 34]} m={M.paintDark} />
      <B p={[(PED_R.x0 + PED_R.x1) / 2, -29.75, 0]} s={[28, 3.5, 34]} m={M.paintDark} />
      {/* chapa con el nombre */}
      <B p={[20, -14, 17.05]} s={[14, 4, 0.1]} m={M.steel} />
    </group>
  )
}

function Pedestal({ x0, x1, open }: { x0: number; x1: number; open: boolean }) {
  const geo = useMemo(() => {
    const w = x1 - x0
    const cx = (x0 + x1) / 2
    const y0 = FLOOR + 4
    const y1 = TRAY_Y
    const h = y1 - y0
    const cy = (y0 + y1) / 2
    const t = 1.5
    const list: BoxSpec[] = [
      { p: [cx, cy, -19 + t / 2], s: [w, h, t] },
      { p: [x0 + t / 2, cy, 0], s: [t, h, 38] },
      { p: [x1 - t / 2, cy, 0], s: [t, h, 38] },
      { p: [cx, y1 - t / 2, 0], s: [w, t, 38] },
      { p: [cx, y0 + t / 2, 0], s: [w, t, 38] },
    ]
    if (open) {
      list.push({ p: [cx, y1 - 4, 19 - t / 2], s: [w, 8, t] })
      list.push({ p: [cx, y0 + 4, 19 - t / 2], s: [w, 8, t] })
      list.push({ p: [x0 + 2, cy, 19 - t / 2], s: [4, h, t] })
      list.push({ p: [x1 - 2, cy, 19 - t / 2], s: [4, h, t] })
    } else {
      list.push({ p: [cx, cy, 19 - t / 2], s: [w, h, t] })
    }
    return boxesGeometry(list)
  }, [x0, x1, open])
  const cx = (x0 + x1) / 2
  return (
    <group>
      <mesh geometry={geo} material={M.paint} />
      {/* zócalo */}
      <B p={[cx, FLOOR + 2, 0]} s={[x1 - x0 + 2, 4, 40]} m={M.paintDark} />
      {!open && (
        <>
          {/* puerta con manija y rejilla */}
          <B p={[cx, (FLOOR + 4 + TRAY_Y) / 2, 19.1]} s={[x1 - x0 - 6, TRAY_Y - FLOOR - 12, 0.3]} m={M.paintDark} />
          <B p={[x1 - 6, (FLOOR + TRAY_Y) / 2 + 4, 19.6]} s={[1.2, 6, 0.9]} m={M.black} />
          {[0, 1, 2, 3, 4].map((i) => (
            <B key={i} p={[cx - 4, -70 + i * 2, 19.3]} s={[14, 0.6, 0.12]} m={M.black} />
          ))}
        </>
      )}
    </group>
  )
}

function Bandeja() {
  const geo = useMemo(
    () =>
      boxesGeometry([
        { p: [-1, TRAY_Y + 0.5, 1.5], s: [188, 1, 51] },
        { p: [-1, TRAY_Y + 3, -24], s: [188, 6, 0.8] },
        { p: [-1, TRAY_Y + 3, 27], s: [188, 6, 0.8] },
        { p: [-95, TRAY_Y + 3, 1.5], s: [0.8, 6, 51] },
        { p: [93, TRAY_Y + 3, 1.5], s: [0.8, 6, 51] },
      ]),
    [],
  )
  return <mesh geometry={geo} material={M.satin} />
}

/** Cabezal fijo: caja de fundición, palancas selectoras de velocidad, placa de velocidades, visor de aceite. */
function Cabezal({ rpmIdx }: { rpmIdx: number }) {
  const plate = useRpmPlate()
  const w = HS.x1 - HS.x0
  const h = HS.top
  const d = HS.z1 - HS.z0
  const gama = rpmIdx < 6 ? -35 * D : 35 * D
  const sel = -60 * D + (rpmIdx % 6) * 24 * D
  const lever = (x: number, y: number, ang: number, color: THREE.Material) => (
    <group position={[x, y, HS.z1]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.3]} material={M.black}>
        <cylinderGeometry args={[3.2, 3.2, 0.6, 32]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 1.2]} material={M.steel}>
        <cylinderGeometry args={[1.4, 1.6, 1.8, 24]} />
      </mesh>
      <Smooth r={[0, 0, ang]}>
        <group position={[0, 0, 1.6]}>
          <Lever len={5.5} r={0.45} knob={0.95} knobMat={color} />
        </group>
      </Smooth>
    </group>
  )
  return (
    <group>
      <RoundedBox args={[w, h, d]} radius={2.2} smoothness={3} position={[(HS.x0 + HS.x1) / 2, h / 2, (HS.z0 + HS.z1) / 2]} material={M.paint} />
      {/* tapa superior y tapón de llenado de aceite */}
      <B p={[(HS.x0 + HS.x1) / 2 - 2, h + 0.4, -1]} s={[w - 10, 0.8, d - 8]} m={M.paintDark} />
      <mesh position={[-84, h + 1.6, -8]} material={M.black}>
        <cylinderGeometry args={[1.4, 1.4, 1.6, 16]} />
      </mesh>
      {/* placa de velocidades */}
      <mesh position={[-60, 31, HS.z1 + 0.05]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial map={plate} roughness={0.6} />
      </mesh>
      {/* palancas: gama (I / II) y selector de 6 velocidades */}
      {lever(-84, 30, gama, M.red)}
      {lever(-73, 30, sel, M.black)}
      {/* selector del sentido de avance (inversor) */}
      {lever(-84, 12, rpmIdx >= 0 ? 20 * D : 0, M.black)}
      {/* visor del nivel de aceite */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[-72, 8, HS.z1 + 0.2]} material={M.steel}>
        <cylinderGeometry args={[1.8, 1.8, 0.4, 24]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[-72, 8, HS.z1 + 0.45]}>
        <cylinderGeometry args={[1.3, 1.3, 0.1, 24]} />
        <meshPhysicalMaterial color="#c79a2c" roughness={0.1} clearcoat={1} />
      </mesh>
    </group>
  )
}

/** Husillo: eje hueco de acero templado con la nariz donde se monta el plato. */
function Husillo() {
  const geo = useMemo(
    () =>
      revolve(
        [
          [2.6, -95],
          [3.6, -95],
          [3.6, -52],
          [5.5, -52],
          [5.5, -49.2],
          [8.5, -49.2],
          [8.5, NOSE_X],
          [2.6, NOSE_X],
          [2.6, -95],
        ],
        48,
      ),
    [],
  )
  return (
    <group>
      <mesh geometry={geo} material={M.steel} />
      {[0, 120, 240].map((a) => (
        <group key={a} rotation={[a * D, 0, 0]}>
          <CylX x0={-48.6} x1={-47.6} r={0.9} m={M.burnished} y={7.2} seg={12} />
        </group>
      ))}
    </group>
  )
}

/** Tablero eléctrico: parada de emergencia, marcha, parada, piloto y llave del refrigerante. */
function Mando({ on }: { on: boolean }) {
  return (
    <group position={[-56, 10, HS.z1]}>
      <RoundedBox args={[11, 13, 2]} radius={0.5} smoothness={2} position={[0, 0, 1]} material={M.satin} />
      {/* parada de emergencia (hongo rojo sobre fondo amarillo) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3, 2.1]} material={M.yellow}>
        <cylinderGeometry args={[2.6, 2.6, 0.2, 32]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3, 2.7]} material={M.black}>
        <cylinderGeometry args={[0.9, 1.0, 1.2, 20]} />
      </mesh>
      <mesh position={[0, 3, 3.3]} rotation={[-Math.PI / 2, 0, 0]} material={M.red}>
        <sphereGeometry args={[2.0, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2.4]} />
      </mesh>
      {/* marcha (verde), parada (negro), piloto, refrigerante */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[-3, -2.5, 2.3]}>
        <cylinderGeometry args={[1.0, 1.0, 0.6, 20]} />
        <meshStandardMaterial color="#2a9a46" roughness={0.4} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -2.5, 2.3]} material={M.black}>
        <cylinderGeometry args={[1.0, 1.0, 0.6, 20]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[3, -2.5, 2.3]}>
        <cylinderGeometry args={[0.8, 0.8, 0.6, 20]} />
        <meshStandardMaterial color={on ? '#fff7c0' : '#7d7a62'} emissive={on ? '#ffd84a' : '#000000'} emissiveIntensity={on ? 1.2 : 0} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -5.2, 2.2]} material={M.black}>
        <cylinderGeometry args={[0.8, 0.8, 0.4, 16]} />
      </mesh>
      <B p={[0, -5.2, 2.5]} s={[0.4, 1.4, 0.4]} m={M.steel} />
    </group>
  )
}

/** Caja Norton con su placa de avances, la palanca oscilante y los selectores. */
function Norton() {
  const plate = useNortonPlate()
  const { x0, x1, y0, y1, z0, z1 } = NORTON
  return (
    <group>
      <RoundedBox args={[x1 - x0, y1 - y0, z1 - z0]} radius={1.2} smoothness={2} position={[(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]} material={M.paint} />
      <mesh position={[-74, -8.5, z1 + 0.05]}>
        <planeGeometry args={[20, 7]} />
        <meshStandardMaterial map={plate} roughness={0.6} />
      </mesh>
      {/* ranura con los 8 agujeros de la palanca oscilante */}
      <B p={[-74, -18, z1 + 0.05]} s={[26, 3, 0.1]} m={M.satin} />
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[-84.5 + i * 3, -18, z1 + 0.12]} material={M.hole}>
          <cylinderGeometry args={[0.55, 0.55, 0.1, 12]} />
        </mesh>
      ))}
      <group position={[-75.5, -20.5, z1]} rotation={[Math.PI / 2 - 0.35, 0, 0]}>
        <Lever len={6} r={0.5} knob={1.0} />
      </group>
      {/* selectores giratorios (A–B–C y I–II) */}
      {[-89, -59].map((x) => (
        <group key={x} position={[x, -12, z1]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.6]} material={M.black}>
            <cylinderGeometry args={[1.6, 1.8, 1.2, 20]} />
          </mesh>
          <B p={[0, 0.9, 1.25]} s={[0.5, 1.8, 0.4]} m={M.steel} />
        </group>
      ))}
      {/* palanca de conexión barra / tornillo patrón */}
      <group position={[-59, -22, z1]} rotation={[Math.PI / 2 + 0.25, 0, 0]}>
        <Lever len={4} r={0.4} knob={0.8} knobMat={M.red} />
      </group>
    </group>
  )
}

/** Tapa de la lira y de las poleas (se abre girando sobre la bisagra trasera). */
function TapaLira({ open }: { open: boolean }) {
  const geo = useMemo(() => {
    const { x0, x1, y0, y1, z0, z1 } = COVER
    const t = 0.9
    const w = x1 - x0
    const cx = (x0 + x1) / 2
    const cy = (y0 + y1) / 2
    // coordenadas relativas a la bisagra (x1, z0)
    const list: BoxSpec[] = [
      { p: [x0 + t / 2, cy, (z0 + z1) / 2], s: [t, y1 - y0, z1 - z0] },
      { p: [cx, y1 - t / 2, (z0 + z1) / 2], s: [w, t, z1 - z0] },
      { p: [cx, y0 + t / 2, (z0 + z1) / 2], s: [w, t, z1 - z0] },
      { p: [cx, cy, z0 + t / 2], s: [w, y1 - y0, t] },
      { p: [cx, cy, z1 - t / 2], s: [w, y1 - y0, t] },
    ]
    const g = boxesGeometry(list)
    g.translate(-x1, 0, -z0)
    return g
  }, [])
  return (
    <group position={[COVER.x1, 0, COVER.z0]}>
      <Smooth r={[0, open ? -100 * D : 0, 0]} rate={4}>
        <mesh geometry={geo} material={M.paint} />
        {/* manija */}
        <B p={[COVER.x0 - COVER.x1 - 0.8, -10, COVER.z1 - COVER.z0 - 3]} s={[1.2, 8, 1.2]} m={M.black} />
      </Smooth>
    </group>
  )
}

/** Centros de las tres ruedas de la lira (conductora, intermedia, conducida). */
function liraLayout() {
  const c1 = { y: 2, z: 6, r: 4.5 }
  const c3 = { y: -14, z: 20, r: 5.2 }
  const r2 = 8
  const d12 = (c1.r + r2) * 0.95
  const d23 = (c3.r + r2) * 0.95
  const dx = c3.z - c1.z
  const dy = c3.y - c1.y
  const d = Math.hypot(dx, dy)
  const a = (d12 * d12 - d23 * d23 + d * d) / (2 * d)
  const h = Math.sqrt(Math.max(0, d12 * d12 - a * a))
  const mz = c1.z + (a * dx) / d
  const my = c1.y + (a * dy) / d
  // de las dos soluciones, la que queda más abajo y atrás (lejos de la caja Norton)
  const s1 = { z: mz + (h * dy) / d, y: my - (h * dx) / d }
  const s2 = { z: mz - (h * dy) / d, y: my + (h * dx) / d }
  const c2 = { ...(s1.z < s2.z ? s1 : s2), r: r2 }
  return { c1, c2, c3 }
}

function Lira({ speed }: { speed: number }) {
  const { c1, c2, c3 } = useMemo(liraLayout, [])
  const g1 = useMemo(() => gearX(24, c1.r, 1.6, 0.6, 0.88, GEAR_X), [c1.r])
  const g2 = useMemo(() => gearX(42, c2.r, 1.6, 0.6, 0.92, GEAR_X), [c2.r])
  const g3 = useMemo(() => gearX(28, c3.r, 1.6, 0.6, 0.89, GEAR_X), [c3.r])
  const arm = useMemo(() => {
    const L = Math.hypot(c2.z - c3.z, c2.y - c3.y)
    const ang = Math.atan2(c2.y - c3.y, c2.z - c3.z)
    const g = new THREE.BoxGeometry(0.8, 3.2, L + 3.2)
    g.translate(-94.4, 0, L / 2)
    // giro en el plano yz: el eje +z del brazo apunta de c3 a c2
    g.rotateX(-ang)
    g.translate(0, c3.y, c3.z)
    return g
  }, [c2, c3])
  const gear = (c: { y: number; z: number }, geo: THREE.BufferGeometry, k: number) => (
    <group position={[0, c.y, c.z]}>
      <Spin speed={speed * k}>
        <mesh geometry={geo} material={M.satin} />
        <CylX x0={GEAR_X - 0.6} x1={-92} r={0.9} m={M.steel} seg={16} />
        <CylX x0={GEAR_X - 0.7} x1={GEAR_X} r={1.4} m={M.burnished} seg={6} />
      </Spin>
    </group>
  )
  return (
    <group>
      <mesh geometry={arm} material={M.burnished} />
      {gear(c1, g1, 1)}
      {gear(c2, g2, -c1.r / c2.r)}
      {gear(c3, g3, c1.r / c3.r)}
    </group>
  )
}

/** Poleas escalonadas y correas en V (motor → eje de entrada del cabezal). */
function Poleas({ speed }: { speed: number }) {
  const belts = useMemo(() => {
    const R1 = PULLEY_HS.r - 0.5
    const R2 = PULLEY_M.r - 0.5
    const dy = PULLEY_HS.y - PULLEY_M.y
    const del = Math.asin((R1 - R2) / dy)
    const pts: THREE.Vector3[] = []
    const n = 28
    // vuelta alrededor de la polea de arriba (de un lado al otro por arriba)
    for (let i = 0; i <= n; i++) {
      const a = -del + ((Math.PI + 2 * del) * i) / n
      pts.push(new THREE.Vector3(0, PULLEY_HS.y + Math.sin(a) * R1, PULLEY_HS.z + Math.cos(a) * R1))
    }
    for (let i = 0; i <= n; i++) {
      const a = Math.PI + del + ((Math.PI - 2 * del) * i) / n
      pts.push(new THREE.Vector3(0, PULLEY_M.y + Math.sin(a) * R2, PULLEY_M.z + Math.cos(a) * R2))
    }
    const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.1)
    const base = new THREE.TubeGeometry(curve, 160, 0.55, 5, true)
    const gs = [-97.6, -96.2, -94.8].map((x) => {
      const g = base.clone()
      g.translate(x, 0, 0)
      return ni(g)
    })
    return mergeGeometries(gs)!
  }, [])
  const pulley = (r: number, x0: number, x1: number) =>
    revolve(
      [
        [0.8, x0],
        [r, x0],
        [r, x0 + 0.25],
        [r - 0.9, x0 + 0.7],
        [r, x0 + 1.15],
        [r - 0.9, x0 + 1.6],
        [r, x0 + 2.05],
        [r - 0.9, x0 + 2.5],
        [r, x0 + 2.95],
        [r, x1],
        [0.8, x1],
        [0.8, x0],
      ],
      40,
    )
  const p1 = useMemo(() => pulley(PULLEY_HS.r, -98.6, -93.8), [])
  const p2 = useMemo(() => pulley(PULLEY_M.r, -98.6, -93.8), [])
  return (
    <group>
      <mesh geometry={belts} material={M.rubber} />
      <group position={[0, PULLEY_HS.y, PULLEY_HS.z]}>
        <Spin speed={speed * 0.6}>
          <mesh geometry={p1} material={M.cast} />
          <CylX x0={-93.8} x1={-92} r={1.0} m={M.steel} seg={16} />
        </Spin>
      </group>
      <group position={[0, PULLEY_M.y, PULLEY_M.z]}>
        <Spin speed={speed * 0.6 * (PULLEY_HS.r / PULLEY_M.r)}>
          <mesh geometry={p2} material={M.cast} />
        </Spin>
      </group>
    </group>
  )
}

/** Motor eléctrico trifásico (carcasa con aletas, ventilador, caja de bornes) dentro del pie izquierdo. */
function Motor() {
  const fins = useMemo(() => {
    const list: BoxSpec[] = []
    for (let i = 0; i < 28; i++) list.push({ p: [-76, 7.4, 0], s: [16, 1.0, 0.35], rx: (i / 28) * Math.PI * 2 })
    return boxesGeometry(list)
  }, [])
  const body = useMemo(
    () =>
      revolve(
        [
          [1.2, -86.5],
          [6.2, -86.5],
          [7.0, -85],
          [7.0, -67],
          [6.6, -66],
          [6.6, -60],
          [1.2, -60],
        ],
        48,
      ),
    [],
  )
  return (
    <group position={[0, MOTOR.y, MOTOR.z]}>
      <mesh geometry={body} material={M.blue} />
      <mesh geometry={fins} material={M.blue} />
      {/* rejilla del ventilador */}
      {[2, 3.5, 5].map((r) => (
        <mesh key={r} position={[-59.9, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={M.black}>
          <torusGeometry args={[r, 0.18, 6, 32]} />
        </mesh>
      ))}
      {/* caja de bornes */}
      <B p={[-76, 8.6, 0]} s={[6, 3, 6]} m={M.blue} />
      <B p={[-76, 10.2, 0]} s={[6.4, 0.4, 6.4]} m={M.blue} />
      {/* patas y base */}
      <B p={[-81, -7.6, 0]} s={[2, 3, 12]} m={M.blue} />
      <B p={[-70, -7.6, 0]} s={[2, 3, 12]} m={M.blue} />
      <B p={[-75.5, -9.8, 0]} s={[22, 1.4, 16]} m={M.cast} />
      {/* eje hacia la polea */}
      <CylX x0={-98.6} x1={-86.5} r={0.9} m={M.steel} seg={16} />
      {/* chapa característica */}
      <B p={[-76, 3.8, 6.1]} s={[5, 2.6, 0.1]} m={M.steel} r={[-0.6, 0, 0]} />
    </group>
  )
}

/** Tornillo patrón (rosca cuadrada), barra de avances (hexagonal), barra de mando y soporte del extremo. */
function TornilloPatron({ speed }: { speed: number }) {
  const L = RODS.x1 - RODS.x0
  const tex = useThreadTexture(L / 0.6)
  return (
    <group position={[(RODS.x0 + RODS.x1) / 2, RODS.screwY, RODS.z]}>
      <Spin speed={speed}>
        <mesh rotation={[0, 0, -Math.PI / 2]}>
          <cylinderGeometry args={[1.6, 1.6, L, 24, 1]} />
          <meshStandardMaterial map={tex} bumpMap={tex} bumpScale={2} metalness={0.9} roughness={0.32} />
        </mesh>
      </Spin>
    </group>
  )
}

function BarraAvances({ speed }: { speed: number }) {
  const L = RODS.x1 - RODS.x0
  return (
    <group position={[(RODS.x0 + RODS.x1) / 2, RODS.feedY, RODS.z]}>
      <Spin speed={speed}>
        <mesh rotation={[0, 0, -Math.PI / 2]} material={M.steel}>
          <cylinderGeometry args={[1.2, 1.2, L, 6, 1]} />
        </mesh>
      </Spin>
    </group>
  )
}

function BarraMando() {
  return (
    <group>
      <CylX x0={RODS.x0} x1={RODS.x1} r={0.8} m={M.steel} y={RODS.ctrlY} z={RODS.z} seg={16} />
      {/* soporte del extremo derecho (cojinetes de las tres barras) */}
      <RoundedBox args={[4, 20, 7.4]} radius={0.6} smoothness={2} position={[90.5, -14, RODS.z]} material={M.paint} />
    </group>
  )
}

/** Delantal: volante del carro, palanca de 3 posiciones, palanca de tuerca partida y palanca de marcha. */
function Delantal({ avance, tuerca, on }: { avance: Avance; tuerca: boolean; on: boolean }) {
  const { y0, y1, z0, z1, hw } = APRON
  const tilt = avance === 'cilindrar' ? 0.5 : avance === 'frentear' ? -0.5 : 0
  return (
    <group>
      <RoundedBox args={[hw * 2, y1 - y0, z1 - z0]} radius={1.0} smoothness={2} position={[0, (y0 + y1) / 2, (z0 + z1) / 2]} material={M.paint} />
      {/* volante del carro longitudinal */}
      <group position={[-6, -8, z1]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 1.0]} material={M.steel}>
          <cylinderGeometry args={[1.2, 1.4, 2, 20]} />
        </mesh>
        <group position={[0, 0, 2.2]}>
          <Handwheel r={6.5} spokes={3} />
        </group>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.4]}>
          <cylinderGeometry args={[2.4, 2.4, 0.8, 40]} />
          <meshStandardMaterial color="#c9ccd0" metalness={0.85} roughness={0.35} />
        </mesh>
      </group>
      {/* palanca de 3 posiciones: arriba cilindrar, medio neutro, abajo frentear */}
      <group position={[8, -14, z1]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.5]} material={M.steel}>
          <cylinderGeometry args={[1.3, 1.3, 1, 20]} />
        </mesh>
        <B p={[0, 0, 0.05]} s={[1, 6.5, 0.1]} m={M.black} />
        <Smooth r={[Math.PI / 2 - tilt, 0, 0]}>
          <Lever len={5} r={0.45} knob={0.9} />
        </Smooth>
      </group>
      {/* palanca de la tuerca partida (cierra sobre el tornillo patrón) */}
      <group position={[11, -4, z1]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.5]} material={M.steel}>
          <cylinderGeometry args={[1.1, 1.1, 1, 20]} />
        </mesh>
        <Smooth r={[Math.PI / 2 - (tuerca ? -0.7 : 0.45), 0, 0]}>
          <Lever len={4.2} r={0.4} knob={0.8} knobMat={M.red} />
        </Smooth>
      </group>
      {/* palanca de encendido y apagado (sobre la barra de mando) */}
      <group position={[hw + 1.2, RODS.ctrlY, RODS.z]}>
        <mesh rotation={[0, 0, -Math.PI / 2]} material={M.steel}>
          <cylinderGeometry args={[1.3, 1.3, 2.4, 16]} />
        </mesh>
        <Smooth r={[on ? 0.55 : -0.1, 0, 0]}>
          <Lever len={9} r={0.45} knob={1.0} />
        </Smooth>
      </group>
      {/* visor de aceite */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[-10, -20, z1 + 0.1]}>
        <cylinderGeometry args={[1.0, 1.0, 0.2, 16]} />
        <meshPhysicalMaterial color="#c79a2c" roughness={0.1} clearcoat={1} />
      </mesh>
    </group>
  )
}

/** Carro longitudinal (puente y alas que apoyan sobre las guías exteriores). */
function CarroLongitudinal() {
  const geo = useMemo(
    () =>
      boxesGeometry([
        { p: [0, 3.35, (-19 + APRON.z1) / 2], s: [18, 3.3, 19 + APRON.z1] },
        { p: [0, 3.35, 14.2], s: [38, 3.3, 8.6] },
        { p: [0, 3.0, -14], s: [38, 4.0, 8] },
        // guía cola de milano del transversal
        { p: [0, 5.3, 2], s: [10, 0.6, 40] },
      ]),
    [],
  )
  return (
    <group>
      <mesh geometry={geo} material={M.paint} />
      {/* soporte del volante del transversal */}
      <B p={[0, 6.5, APRON.z1 + 0.75]} s={[6, 5, 1.5]} m={M.paint} />
      {/* tornillos de los limpiaguías */}
      {[-18, 18].map((x) => (
        <B key={x} p={[x, 2.5, 14.2]} s={[0.6, 2.6, 7]} m={M.black} />
      ))}
    </group>
  )
}

/** Carro transversal: el carro se mueve (cz) y el volante con nonio queda en el carro longitudinal. */
function CarroTransversal({ cz }: { cz: number }) {
  const dial = useDialTexture()
  const geo = useMemo(
    () =>
      boxesGeometry([
        { p: [0, 6.5, -10], s: [16, 3, 24] },
        { p: [0, 7.9, -10], s: [12, 0.4, 22] },
      ]),
    [],
  )
  return (
    <group>
      <Smooth p={[0, 0, cz]}>
        <mesh geometry={geo} material={M.paint} />
        {/* tornillos de la regla de ajuste (chaveta) */}
        {[-18, -10, -2].map((z) => (
          <mesh key={z} position={[8.05, 6.5, z]} rotation={[0, 0, Math.PI / 2]} material={M.steel}>
            <cylinderGeometry args={[0.45, 0.45, 0.4, 6]} />
          </mesh>
        ))}
      </Smooth>
      {/* volante con nonio graduado */}
      <group position={[0, 6.5, APRON.z1 + 1.5]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 1.2]}>
          <cylinderGeometry args={[2.0, 2.0, 2.4, 48]} />
          <meshStandardMaterial map={dial} metalness={0.8} roughness={0.35} />
        </mesh>
        <group position={[0, 0, 3.2]}>
          <Handwheel r={4.2} spokes={3} />
        </group>
      </group>
    </group>
  )
}

/** Carro superior (charriot): base giratoria graduada, guías, y su volante. */
function Charriot({ cz, ang }: { cz: number; ang: number }) {
  const scale = useSwivelScale()
  const dial = useDialTexture(50, 10)
  const geo = useMemo(
    () =>
      boxesGeometry([
        { p: [0, 10.2, 0], s: [18, 2, 9] },
        { p: [0, 12.1, 0], s: [12, 1.8, 8] },
        { p: [10.5, 10.4, 0], s: [3, 2.4, 3.6] },
      ]),
    [],
  )
  return (
    <group position={[0, 0, cz]}>
      <Smooth p={[0, 0, 0]}>
        {/* plataforma giratoria graduada */}
        <mesh position={[0, 8.6, 0]}>
          <cylinderGeometry args={[7, 7, 1.2, 64]} />
          <meshStandardMaterial map={scale} metalness={0.8} roughness={0.35} />
        </mesh>
        {/* tuercas de fijación del giro (adelante y atrás) */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0, 9.0, s * 7.6]} material={M.steel}>
            <cylinderGeometry args={[0.9, 0.9, 1.4, 6]} />
          </mesh>
        ))}
      </Smooth>
      <Smooth r={[0, -ang * D, 0]}>
        <mesh geometry={geo} material={M.paint} />
        <mesh position={[0, 9.25, 0]} material={M.steel}>
          <cylinderGeometry args={[4.6, 4.6, 0.1, 6]} />
        </mesh>
        {/* índice sobre la escala */}
        <B p={[0, 9.0, 7.05]} s={[0.25, 0.7, 0.2]} m={M.red} r={[0, 0, 0]} />
        {/* volante del charriot con su tambor */}
        <group position={[13.2, 10.4, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.6]}>
            <cylinderGeometry args={[1.5, 1.5, 1.2, 40]} />
            <meshStandardMaterial map={dial} metalness={0.8} roughness={0.35} />
          </mesh>
          <group position={[0, 0, 1.8]}>
            <Handwheel r={3.2} spokes={2} />
          </group>
        </group>
      </Smooth>
    </group>
  )
}

/** Torre portaherramientas de 4 posiciones con el portainsertos en el lado izquierdo. */
function TorrePortaherramientas({ cz }: { cz: number }) {
  const geo = useMemo(
    () =>
      boxesGeometry([
        { p: [0, 14, 0], s: [10, 2, 10] },
        { p: [0, 16.7, 0], s: [3.2, 3.4, 3.2] },
        { p: [0, 19.9, 0], s: [10, 3, 10] },
      ]),
    [],
  )
  const screws: Vec3[] = []
  for (const [sx, sz] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]) {
    for (const k of [-2.6, 2.6]) screws.push(sx ? [sx * 3.4, 22.0, k] : [k, 22.0, sz * 3.4])
  }
  return (
    <group position={[0, 0, cz]}>
      <mesh geometry={geo} material={M.burnished} />
      {screws.map((p, i) => (
        <group key={i} position={p}>
          <mesh material={M.steel}>
            <cylinderGeometry args={[0.6, 0.6, 1.2, 6]} />
          </mesh>
        </group>
      ))}
      {/* manija de bloqueo central */}
      <mesh position={[0, 22.4, 0]} material={M.steel}>
        <cylinderGeometry args={[1.0, 1.2, 2.0, 16]} />
      </mesh>
      <group position={[0, 23, 0]} rotation={[0, 0, -Math.PI / 2 + 0.25]}>
        <Lever len={8} r={0.45} knob={0.9} />
      </group>
      {/* suplemento y portainsertos: la punta queda a la altura del eje */}
      <B p={[-3.25, 15.5, -1.5]} s={[3.0, 1.0, 13]} m={M.satin} />
      <group position={[-3.25, 16, -8.85]} rotation={[0, Math.PI / 2, 0]}>
        <Portainserto />
      </group>
    </group>
  )
}

/** Refrigerante: manguera articulada sobre el carro (boquilla apuntando a la herramienta). */
function ManagueraArticulada() {
  const pts: Vec3[] = [
    [7, 5.2, -17],
    [7, 18, -16],
    [5, 28, -10],
    [1, 27, -1],
    [-3, 22.5, 3.5],
  ]
  const curve = useMemo(() => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), [])
  const balls = useMemo(() => {
    const gs: THREE.BufferGeometry[] = []
    const n = 22
    for (let i = 0; i <= n; i++) {
      const p = curve.getPoint(i / n)
      const s = new THREE.SphereGeometry(0.75, 10, 8)
      s.translate(p.x, p.y, p.z)
      gs.push(s)
    }
    const m = mergeGeometries(gs)!
    gs.forEach((g) => g.dispose())
    return m
  }, [curve])
  return (
    <group>
      <mesh geometry={balls} material={M.blue} />
      <B p={[7, 5.6, -17]} s={[3, 1, 3]} m={M.steel} />
    </group>
  )
}

function Bomba({ xc }: { xc: number }) {
  return (
    <group>
      <group position={[76, TRAY_Y - 6, -21.5]}>
        <mesh position={[0, 0, 0]} material={M.blue}>
          <cylinderGeometry args={[2.5, 2.5, 7, 24]} />
        </mesh>
        <B p={[0, 4.2, 0]} s={[4.5, 1.6, 4.5]} m={M.blue} />
      </group>
      <Wire
        points={[
          [76, TRAY_Y - 1.6, -21.5],
          [74, -24, -22.5],
          [Math.max(-20, xc + 30), -12, -23],
          [xc + 7, -2, -21],
          [xc + 7, 4.8, -17.6],
        ]}
        radius={0.6}
        color="#1f2a37"
        metalness={0.1}
        roughness={0.7}
        smooth={0.5}
      />
    </group>
  )
}

/** Protección del plato (pantalla transparente abisagrada sobre el cabezal). */
function Proteccion() {
  const t0 = -0.08 * Math.PI
  const t1 = 0.72 * Math.PI
  const { shell, arcs } = useMemo(() => {
    const shell = new THREE.CylinderGeometry(12, 12, 15, 40, 1, true, t0, t1 - t0)
    // eje del cilindro → x; el ángulo θ queda en (y = r·sen θ, z = r·cos θ)
    shell.rotateZ(Math.PI / 2)
    const arc = (x: number) => {
      const pts = Array.from({ length: 25 }, (_, i) => {
        const t = t0 + ((t1 - t0) * i) / 24
        return new THREE.Vector3(x, 12 * Math.sin(t), 12 * Math.cos(t))
      })
      return ni(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.35, 6, false))
    }
    return { shell, arcs: mergeGeometries([arc(-7.5), arc(7.5)])! }
  }, [t0, t1])
  return (
    <group position={[-40.5, AXIS, 0]}>
      <mesh geometry={shell}>
        <meshPhysicalMaterial color="#d6e6f2" transparent opacity={0.25} roughness={0.05} metalness={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh geometry={arcs} material={M.yellow} />
      {/* brazo y bisagra sobre el cabezal */}
      <B p={[-7.5, 8.5, -6]} s={[1.6, 7, 1.6]} m={M.yellow} />
      <CylX x0={-9.5} x1={-6} r={1.1} m={M.steel} y={5.5} z={-6} />
    </group>
  )
}

/** Contrapunta: base, cuerpo, cañón (manguito), volante y palancas de bloqueo. */
function Contrapunta({ qe, empty }: { qe: number; empty: boolean }) {
  const scale = useDialTexture(100, 10, '#d9dbde')
  return (
    <group>
      {/* base sobre las guías interiores, con tornillos de registro laterales */}
      <B p={[12, 3.85, 0]} s={[24, 4.3, 26]} m={M.paint} />
      <B p={[12, 5.9, 0]} s={[22, 0.2, 18]} m={M.paintDark} />
      <RoundedBox args={[22, 10, 16]} radius={1.2} smoothness={2} position={[12, 11, 0]} material={M.paint} />
      <CylX x0={0} x1={26} r={5.5} m={M.paint} y={AXIS} seg={40} />
      <B p={[12, 14.5, 0]} s={[22, 4, 11]} m={M.paint} />
      {[3, 21].map((x) => (
        <mesh key={x} position={[x, 3.6, 13.3]} rotation={[Math.PI / 2, 0, 0]} material={M.steel}>
          <cylinderGeometry args={[0.7, 0.7, 1.2, 4]} />
        </mesh>
      ))}
      {/* regla milimetrada del desplazamiento lateral (atrás) */}
      <B p={[12, 5.2, -13.06]} s={[8, 1.4, 0.1]} m={M.steel} />
      {/* cañón (pínula) con su escala */}
      <Smooth p={[-qe, 0, 0]}>
        <group position={[0, AXIS, 0]}>
          <mesh position={[4, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <cylinderGeometry args={[3.2, 3.2, 8, 40]} />
            <meshStandardMaterial map={scale} metalness={0.9} roughness={0.25} />
          </mesh>
          <CylX x0={-0.01} x1={0.4} r={3.2} m={M.steel} />
          {empty && (
            <mesh position={[-0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={M.hole}>
              <cylinderGeometry args={[1.25, 1.25, 0.04, 24]} />
            </mesh>
          )}
        </group>
      </Smooth>
      {/* tapa trasera y volante */}
      <CylX x0={26} x1={28.5} r={3.0} r2={2.4} m={M.paint} y={AXIS} />
      <group position={[29.5, AXIS, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Handwheel r={7} spokes={3} />
      </group>
      {/* palanca de bloqueo del manguito (arriba) */}
      <group position={[4, AXIS + 5.2, 0]} rotation={[0, 0, 0.35]}>
        <mesh material={M.steel}>
          <cylinderGeometry args={[1.0, 1.0, 1.2, 16]} />
        </mesh>
        <group rotation={[-Math.PI / 2 + 0.3, 0, 0]}>
          <Lever len={6} r={0.4} knob={0.8} />
        </group>
      </group>
      {/* palanca de bloqueo sobre la bancada (atrás, a la derecha) */}
      <group position={[21, 5, -13.6]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={M.steel}>
          <cylinderGeometry args={[1.0, 1.0, 1.2, 16]} />
        </mesh>
        <group rotation={[0, 0, -0.5]}>
          <Lever len={9} r={0.45} knob={1.0} />
        </group>
      </group>
    </group>
  )
}

/** Gira los hijos con el ángulo compartido del husillo (todo lo que gira con la pieza queda en fase). */
function Rot({ angle, sign = 1, children }: { angle: { current: number }; sign?: number; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (ref.current) ref.current.rotation.x = angle.current * sign
  })
  return <group ref={ref}>{children}</group>
}

/** Pieza a mecanizar: tramo en bruto y tramo ya cilindrado (a la derecha de la herramienta). */
function Pieza({ x0, x1, r, toolX, tipR, centerL, centerR }: { x0: number; x1: number; r: number; toolX: number; tipR: number; centerL: boolean; centerR: boolean }) {
  const cut = tipR < r - 0.05 && toolX > x0 + 1 && toolX < x1 - 0.5
  if (!cut) return <Bar x0={x0} x1={x1} r={r} centerL={centerL} centerR={centerR} />
  return (
    <group>
      <Bar x0={x0} x1={toolX} r={r} centerL={centerL} />
      <Bar x0={toolX - 0.01} x1={x1} r={tipR} centerR={centerR} m={M.turned} />
    </group>
  )
}

/* ================================================================== conjunto */

export function TornoModel(p: TornoParams) {
  const L = tornoLayout(p)
  const rpm = RPMS[p.rpmIdx] ?? 500
  // velocidad "de pantalla": proporcional a las rpm pero legible (2000 rpm → ≈ 4 vueltas por segundo)
  const w = p.on ? (rpm / 60) * 0.12 * Math.PI * 2 + 0.6 : 0
  const angle = useRef(0)
  const omega = useRef(0)
  useFrame((_, dt) => {
    omega.current += (w - omega.current) * (1 - Math.exp(-dt * 2.5))
    angle.current += omega.current * Math.min(dt, 0.05)
  })
  const feedSpeed = p.on ? w * 0.25 : 0
  const screwSpeed = p.on ? w * 0.2 : 0
  const mont = p.montaje
  const withChuck = mont !== 'puntas'
  const withCenter = mont === 'contrapunta' || mont === 'puntas'
  const xc = L.xc
  return (
    <group scale={0.1}>
      <Part id="bancada" labelAt={[20, -8, 18]}>
        <Bancada />
      </Part>
      <Part id="patas" offset={[0, -14, 0]} labelAt={[74, -50, 21]}>
        <Pedestal x0={PED_L.x0} x1={PED_L.x1} open />
        <Pedestal x0={PED_R.x0} x1={PED_R.x1} open={false} />
        <Bandeja />
      </Part>
      <Part id="motor" offset={[0, -14, 30]} labelAt={[-76, -44, 0]}>
        <Motor />
      </Part>
      <Part id="poleas" offset={[-14, 0, 0]} labelAt={[-96, -24, -9]}>
        <Poleas speed={w} />
      </Part>
      <Part id="lira" offset={[-24, 0, 0]} labelAt={[-96, 10, 14]}>
        <Lira speed={w * 0.5} />
      </Part>
      <Part id="tapa" offset={[-36, 0, 0]} labelAt={[-100, 41, 4]}>
        <TapaLira open={p.tapa} />
      </Part>
      <Part id="cabezal" offset={[0, 34, -12]} labelAt={[-70, 45, 6]}>
        <Cabezal rpmIdx={p.rpmIdx} />
      </Part>
      <Part id="mando" offset={[0, 34, 0]} labelAt={[-56, 19, 18]}>
        <Mando on={p.on} />
      </Part>
      <Part id="husillo" offset={[-6, 0, 0]} labelAt={[-50, AXIS + 11, 0]}>
        <group position={[0, AXIS, 0]}>
          <Rot angle={angle}>
            <Husillo />
          </Rot>
        </group>
      </Part>
      <Part id="proteccion" offset={[6, 18, 8]} labelAt={[-40, AXIS + 14, 0]}>
        <Proteccion />
      </Part>
      {withChuck ? (
        <Part id="plato" offset={[12, 0, 0]} labelAt={[-41, AXIS + 10, 4]}>
          <group position={[CHUCK_X, AXIS, 0]}>
            <Rot angle={angle}>
              <Chuck3 clampR={L.barR} />
            </Rot>
          </group>
        </Part>
      ) : (
        <>
          <Part id="plato-liso" offset={[12, 0, 0]} labelAt={[-43, AXIS + 11.5, 4]}>
            <group position={[NOSE_X + 2.6, AXIS, 0]}>
              <Rot angle={angle}>
                <PlatoLiso />
                <PernoArrastre />
              </Rot>
            </group>
          </Part>
          <Part id="punto-husillo" offset={[20, 0, 0]} labelAt={[-40, AXIS + 3.5, 0]}>
            <group position={[NOSE_X + 2.6 + 4.85, AXIS, 0]}>
              <Rot angle={angle}>
                <PuntoFijo />
              </Rot>
            </group>
          </Part>
          <Part id="brida" offset={[25, 0, 0]} labelAt={[-35.8, AXIS + 9, 0]}>
            <group position={[NOSE_X + 2.6 + 8.6, AXIS, 0]}>
              <Rot angle={angle}>
                <group rotation={[0.19, 0, 0]}>
                  <Brida barR={2} />
                </group>
              </Rot>
            </group>
          </Part>
        </>
      )}
      <Part id="pieza" offset={[30, 0, 0]} labelAt={[(L.barX0 + L.barX1) / 2 + 6, AXIS + L.barR + 2.5, 0]}>
        <group position={[0, AXIS, 0]}>
          <Rot angle={angle}>
            <Pieza x0={L.barX0} x1={L.barX1} r={L.barR} toolX={L.toolX} tipR={L.tipR} centerL={mont === 'puntas'} centerR={withCenter} />
          </Rot>
        </group>
      </Part>
      {mont === 'luneta' && (
        <Part id="luneta" offset={[38, 0, 0]} labelAt={[LUNETA_X, 31.5, 0]}>
          <group position={[LUNETA_X, 0, 0]}>
            <LunetaFijaCuerpo />
            <LunetaZapata />
            <LunetaBulon />
            <LunetaTuerca />
            {[0, 120, 240].map((d) => (
              <group key={d} position={[0, AXIS, 0]} rotation={[d * D, 0, 0]}>
                <PatinLuneta r={L.barR} />
              </group>
            ))}
          </group>
        </Part>
      )}
      <Part id="norton" offset={[0, 0, 14]} labelAt={[-74, -1, 28]}>
        <Norton />
      </Part>
      <Part id="tornillo-patron" offset={[0, -6, 10]} labelAt={[40, RODS.screwY + 3, RODS.z + 2]}>
        <TornilloPatron speed={p.tuerca ? screwSpeed * 2 : screwSpeed} />
      </Part>
      <Part id="barra-avances" offset={[0, -6, 10]} labelAt={[55, RODS.feedY - 2.5, RODS.z + 2]}>
        <BarraAvances speed={p.avance === 'neutro' ? feedSpeed * 0.6 : feedSpeed} />
        <BarraMando />
      </Part>
      <Smooth p={[xc, 0, 0]}>
        <Part id="delantal" offset={[0, -6, 10]} labelAt={[0, -26.5, 27]}>
          <Delantal avance={p.avance} tuerca={p.tuerca} on={p.on} />
        </Part>
        <Part id="carro-longitudinal" offset={[0, 2, 5]} labelAt={[16, 6.5, 14]}>
          <CarroLongitudinal />
        </Part>
        <Part id="carro-transversal" offset={[0, 7.5, 11]} labelAt={[0, 9.5, 30]}>
          <CarroTransversal cz={L.cz} />
        </Part>
        <Part id="charriot" offset={[0, 15, 15]} labelAt={[12, 13.5, L.cz + 3]}>
          <Charriot cz={L.cz} ang={p.charriot} />
        </Part>
        <Part id="torre" offset={[0, 25, 18]} labelAt={[3, 25.5, L.cz]}>
          <TorrePortaherramientas cz={L.cz} />
        </Part>
        <Part id="refrigeracion" offset={[0, 0, -14]} labelAt={[6, 30, -12]}>
          <ManagueraArticulada />
        </Part>
      </Smooth>
      <Part id="refrigeracion" offset={[0, 0, -14]} noLabel>
        <Bomba xc={xc} />
      </Part>
      <Smooth p={[L.xt, 0, 0]}>
        <Part id="contrapunta" offset={[48, 0, 0]} labelAt={[14, 28, 0]}>
          <Contrapunta qe={L.qe} empty={!withCenter} />
        </Part>
        {withCenter && (
          <Part id="punto" offset={[38, 0, 0]} labelAt={[-L.qe - 6, AXIS + 4.5, 0]}>
            <Smooth p={[-L.qe - 10.2, AXIS, 0]}>
              <group rotation={[0, Math.PI, 0]}>
                <PuntoGiratorioCuerpo />
                <Rot angle={angle} sign={-1}>
                  <PuntoGiratorioPunta />
                </Rot>
              </group>
            </Smooth>
          </Part>
        )}
      </Smooth>
    </group>
  )
}

export const TORNO_DIMS = { axisMm: 180, jawsFrontX: JAWS_FRONT }
