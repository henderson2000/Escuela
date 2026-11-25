import { useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { Part } from '../../Part'
import { useKeepRendering } from '../../keepRendering'
import { canvasTex, rng } from '../segundo/soldaduraShared'
import { Cable, CM, Dim, drawTraces, Fan, Keyboard, Monitor, Mouse, TEXTURE_N, type V3 } from '../compuShared'

/* ================================================================== texturas impresas */

/** Etiqueta del disco rígido (la misma va en el gabinete y en el modelo del disco). */
const HDD_LABEL = canvasTex(640, 440, (ctx, w) => {
  ctx.fillStyle = '#f2f2ef'
  ctx.fillRect(0, 0, w, 440)
  ctx.fillStyle = '#16181c'
  ctx.fillRect(0, 0, w, 70)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 44px system-ui'
  ctx.fillText('HDD 1 TB', 24, 50)
  ctx.font = '22px system-ui'
  ctx.fillText('3,5" · 7200 RPM', w - 210, 44)
  ctx.fillStyle = '#16181c'
  ctx.font = 'bold 26px system-ui'
  ctx.fillText('SATA 6 Gb/s · caché 64 MB', 24, 118)
  ctx.font = '20px ui-monospace, monospace'
  ;['MODELO: ITS-1000SATA', 'S/N: VLD2026-0417', 'DC +5V 0.55A   +12V 0.45A', 'FABRICADO: 11/2026'].forEach((t, i) => ctx.fillText(t, 24, 162 + i * 30))
  // código de barras
  const r = rng(11)
  for (let x = 24; x < 360; ) {
    const bw = 1 + Math.floor(r() * 4)
    if (r() > 0.4) ctx.fillRect(x, 300, bw, 90)
    x += bw + 1
  }
  ctx.strokeStyle = '#16181c'
  ctx.lineWidth = 3
  ctx.strokeRect(420, 290, 190, 110)
  ctx.font = 'bold 17px system-ui'
  ctx.fillText('No abrir: el polvo', 432, 330)
  ctx.fillText('raya los platos', 432, 356)
  ctx.fillText('⚠ garantía', 432, 386)
})

const RAM_TEX = canvasTex(512, 128, (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, '#2a2d33')
  g.addColorStop(1, '#17191d')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#b3121f'
  ctx.beginPath()
  ctx.moveTo(w * 0.62, 0)
  ctx.lineTo(w * 0.7, 0)
  ctx.lineTo(w * 0.56, h)
  ctx.lineTo(w * 0.48, h)
  ctx.fill()
  ctx.fillStyle = '#e8eaee'
  ctx.font = 'bold 30px system-ui'
  ctx.fillText('DDR5', 26, 58)
  ctx.font = '20px system-ui'
  ctx.fillText('16 GB · 5600 MHz', 26, 92)
})

const CPU_TEX = canvasTex(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#c3c7cc'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(40,44,50,0.85)'
  ctx.font = 'bold 26px system-ui'
  ctx.fillText('CPU', 26, 70)
  ctx.font = '17px system-ui'
  ctx.fillText('6 núcleos · 12 hilos', 26, 104)
  ctx.fillText('3,7 GHz · 65 W', 26, 130)
  ctx.font = '14px ui-monospace, monospace'
  ctx.fillText('L2604B · VILLADA', 26, 200)
  ctx.fillRect(w - 48, h - 48, 22, 22)
})

const PSU_LABEL = canvasTex(640, 380, (ctx, w, h) => {
  ctx.fillStyle = '#f1f1ee'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#121316'
  ctx.font = 'bold 40px system-ui'
  ctx.fillText('FUENTE 550 W', 24, 54)
  ctx.font = 'bold 20px system-ui'
  ctx.fillText('80 PLUS BRONZE · ATX 3.0', 24, 88)
  ctx.font = '19px system-ui'
  ctx.fillText('ENTRADA: 220-240 V ~ 50 Hz  4 A', 24, 124)
  // tabla de salidas
  const cols = ['SALIDA', '+3,3V', '+5V', '+12V', '-12V', '+5Vsb']
  const amps = ['CORRIENTE', '20 A', '20 A', '45 A', '0,3 A', '2,5 A']
  ctx.lineWidth = 2
  cols.forEach((c, i) => {
    const x = 24 + i * 100
    ctx.strokeRect(x, 146, 100, 80)
    ctx.font = 'bold 18px system-ui'
    ctx.fillText(c, x + 8, 176)
    ctx.font = '18px system-ui'
    ctx.fillText(amps[i], x + 8, 212)
  })
  ctx.font = 'bold 18px system-ui'
  ctx.fillText('⚠ ALTA TENSIÓN ADENTRO: NO ABRIR', 24, 270)
  ctx.font = '16px system-ui'
  ctx.fillText('Transforma la alterna del enchufe en continua de baja tensión.', 24, 300)
})

const GPU_EDGE = canvasTex(1024, 96, (ctx, w, h) => {
  ctx.fillStyle = '#16171a'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#e6e8eb'
  ctx.font = 'bold 44px system-ui'
  ctx.fillText('GPU · 8 GB GDDR6', 40, 64)
  const g = ctx.createLinearGradient(w * 0.6, 0, w, 0)
  g.addColorStop(0, '#22d3ee')
  g.addColorStop(1, '#a855f7')
  ctx.fillStyle = g
  ctx.fillRect(w * 0.6, h * 0.42, w * 0.37, 10)
})

const SSD_STICKER = canvasTex(512, 146, (ctx, w, h) => {
  ctx.fillStyle = '#16181c'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#e6e8eb'
  ctx.font = 'bold 40px system-ui'
  ctx.fillText('NVMe SSD 1 TB', 24, 62)
  ctx.font = '24px system-ui'
  ctx.fillText('M.2 2280 · PCIe 4.0 · 7000 MB/s', 24, 106)
})

/** Malla del frente: chapa con agujeros hexagonales (blanco = chapa, negro = agujero). */
const HEX_MESH = canvasTex(
  256,
  256,
  (ctx, w, h) => {
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#000'
    const R = 8
    const dx = R * Math.sqrt(3) + 5
    const dy = R * 1.5 + 4.5
    for (let row = -1; row * dy < h + R; row++)
      for (let col = -1; col * dx < w + R; col++) {
        const cx = col * dx + (row % 2 ? dx / 2 : 0)
        const cy = row * dy
        ctx.beginPath()
        for (let k = 0; k < 6; k++) {
          const a = Math.PI / 6 + (k * Math.PI) / 3
          ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R)
        }
        ctx.fill()
      }
  },
  [5, 10],
  false,
)

const MESH_MAT = new THREE.MeshStandardMaterial({ color: '#1d1f23', roughness: 0.5, metalness: 0.5, alphaMap: HEX_MESH ?? undefined, transparent: true, depthWrite: false, side: THREE.DoubleSide })

/* ================================================================== gabinete */

export interface PcParams {
  encendida: boolean
}

export const PC_PARTS = [
  { id: 'gabinete', name: 'Gabinete', desc: 'La caja de chapa de acero que contiene y protege los componentes. Tiene el botón de encendido y los USB arriba, un frente de malla para que entre aire y ventiladores que lo hacen circular.' },
  { id: 'tapa', name: 'Tapa lateral', desc: 'Se saca (con los 4 tornillos de mano) para ver y cambiar las piezas. Esta es de vidrio templado.' },
  { id: 'placa', name: 'Placa base (motherboard)', desc: 'El componente principal: conecta a todos los demás. Tiene el zócalo del procesador, las ranuras de RAM, las PCIe para la placa de video y los conectores para discos y fuente. Los datos viajan entre ellos como señales eléctricas por las pistas de cobre.' },
  { id: 'cpu', name: 'Procesador (CPU)', desc: 'El cerebro de la computadora. Recibe instrucciones y datos de la RAM, los procesa y envía los resultados a la memoria o a los dispositivos de salida. Va en el zócalo, debajo del cooler.' },
  { id: 'cooler', name: 'Disipador y ventilador (cooler)', desc: 'El procesador calienta mucho al trabajar: los caños de cobre (heatpipes) llevan el calor a las aletas de aluminio y el ventilador lo saca.' },
  { id: 'ram', name: 'Memoria RAM', desc: 'Memoria de acceso aleatorio: guarda temporalmente los datos y programas que la CPU está usando. Es rápida pero volátil: se borra al apagar. Acá hay dos módulos de 16 GB.' },
  { id: 'gpu', name: 'Placa de video (GPU)', desc: 'Procesa y genera las imágenes que se ven en el monitor. Tiene su propio procesador y memoria, sus ventiladores y se conecta en la ranura PCIe x16. El monitor se enchufa atrás, en sus salidas HDMI y DisplayPort.' },
  { id: 'fuente', name: 'Fuente de alimentación', desc: 'Transforma los 220 V de alterna del enchufe en las tensiones continuas bajas (12 V, 5 V, 3,3 V) que usan las piezas. Los cables mallados las llevan a la placa base, a la placa de video y a los discos.' },
  { id: 'disco', name: 'Disco rígido (HDD)', desc: 'Almacenamiento: guarda en forma permanente los programas y archivos, aunque la compu esté apagada. Usa discos magnéticos que giran. Se conecta con un cable SATA de datos (rojo) y uno de alimentación.' },
  { id: 'ssd', name: 'Disco sólido (SSD M.2)', desc: 'Almacenamiento con memorias flash, sin partes móviles: es mucho más rápido que el HDD y aguanta mejor los golpes. Va atornillado directo en la placa base.' },
]

// medidas del gabinete (1 unidad = 10 cm): torre mediana ATX
const W = 2.2
const D = 4.6
const Y0 = 0.1
const Y1 = 4.7
const H = Y1 - Y0
// placa base ATX (30,5 × 24,4 cm) atornillada sobre la bandeja, con el borde de los conectores contra la parte de atrás
const BX = -0.995
const BYC = 2.975
const BZC = -0.9

/** Espacio de la placa base: [u hacia atrás, v hacia arriba, n hacia afuera de la placa]. */
function OnBoard({ children }: { children: ReactNode }) {
  return (
    <group position={[BX, BYC, BZC]} rotation={[0, Math.PI / 2, 0]}>
      {children}
    </group>
  )
}
/** Pasa un punto de la placa a coordenadas del gabinete. */
const board = (u: number, v: number, n: number): V3 => [BX + n, BYC + v, BZC - u]

/** Aletas apiladas (disipadores): una sola malla. */
function stack(count: number, pitch: number, size: V3, axis: 0 | 1 | 2) {
  const gs: THREE.BufferGeometry[] = []
  for (let i = 0; i < count; i++) {
    const g = new THREE.BoxGeometry(...size)
    const o: V3 = [0, 0, 0]
    o[axis] = (i - (count - 1) / 2) * pitch
    g.translate(...o)
    gs.push(g)
  }
  return mergeGeometries(gs)!
}

const MB_TEX = canvasTex(976, 1220, (ctx, w, h) => {
  const S = 400
  const P = (u: number, v: number): [number, number] => [(u + 1.22) * S, (1.525 - v) * S]
  ctx.fillStyle = '#1a1c1f'
  ctx.fillRect(0, 0, w, h)
  drawTraces(ctx, w, h, 70, 5, 'rgba(70,76,84,0.55)')
  // zona del zócalo
  ctx.strokeStyle = 'rgba(220,220,220,0.7)'
  ctx.lineWidth = 2
  const [sx, sy] = P(0.32 - 0.3, 0.62 + 0.3)
  ctx.strokeRect(sx, sy, 0.6 * S, 0.6 * S)
  ctx.fillStyle = 'rgba(230,230,230,0.85)'
  const txt = (t: string, u: number, v: number, size = 18) => {
    ctx.font = `bold ${size}px system-ui`
    const [x, y] = P(u, v)
    ctx.fillText(t, x, y)
  }
  txt('CPU1', 0.08, 0.96)
  txt('DIMM_A1', -0.46, 1.38, 14)
  txt('A2', -0.54, 1.38, 14)
  txt('DIMM_B1', -0.68, 1.38, 14)
  txt('B2', -0.76, 1.38, 14)
  txt('PCIEX16_1', -0.2, -0.2)
  txt('PCIEX1_1', 0.3, -0.6, 15)
  txt('PCIEX16_2 (x4)', -0.2, -1.0, 15)
  txt('M.2_1 (PCIe 4.0)', -0.55, 0.22, 15)
  txt('SATA6G_1-4', -1.18, -1.22, 15)
  txt('ATX_24P', -1.18, 0.95, 15)
  txt('CPU_8P', 0.52, 1.52, 15)
  txt('BIOS', -0.05, -1.32, 14)
  txt('ITS-B760M · VILLADA', -1.05, -1.47, 22)
  // agujeros de montaje con su anillo de cobre
  for (const u of [-1.12, -0.05, 1.12])
    for (const v of [1.42, 0.1, -1.42]) {
      const [x, y] = P(u, v)
      ctx.fillStyle = '#c9a25c'
      ctx.beginPath()
      ctx.arc(x, y, 16, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#0c0d0f'
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.fill()
    }
})
if (MB_TEX) MB_TEX.wrapS = MB_TEX.wrapT = THREE.ClampToEdgeWrapping

function Slot({ u, v, len, horizontal, color = CM.slot, latch = true }: { u: number; v: number; len: number; horizontal?: boolean; color?: THREE.Material; latch?: boolean }) {
  const s: V3 = horizontal ? [len, 0.075, 0.1] : [0.075, len, 0.1]
  return (
    <group position={[u, v, 0.05]}>
      <mesh material={color} castShadow>
        <boxGeometry args={s} />
      </mesh>
      <mesh position={[0, 0, 0.051]} material={CM.chip}>
        <boxGeometry args={horizontal ? [len - 0.04, 0.018, 0.002] : [0.018, len - 0.04, 0.002]} />
      </mesh>
      {latch &&
        (horizontal ? (
          <mesh position={[-len / 2 - 0.03, 0, 0.02]} material={color}>
            <boxGeometry args={[0.06, 0.09, 0.12]} />
          </mesh>
        ) : (
          [-1, 1].map((k) => (
            <mesh key={k} position={[0, (k * len) / 2 + k * 0.03, 0.03]} material={color}>
              <boxGeometry args={[0.085, 0.06, 0.14]} />
            </mesh>
          ))
        ))}
    </group>
  )
}

/** Módulo de RAM DDR5 con su disipador; apoya en la ranura (u, v) de la placa. */
function RamStick({ u, v }: { u: number; v: number }) {
  return (
    <group position={[u, v, 0.1]}>
      <mesh position={[0, 0, 0.17]} material={CM.pcbGreen}>
        <boxGeometry args={[0.012, 1.33, 0.32]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.016, 0, 0.21]}>
          <mesh material={CM.aluDark} castShadow>
            <boxGeometry args={[0.012, 1.34, 0.38]} />
          </mesh>
          <mesh position={[s * 0.007, 0, 0]} rotation={[0, (s * Math.PI) / 2, 0]}>
            <planeGeometry args={[1.34, 0.36]} />
            <meshStandardMaterial map={RAM_TEX ?? undefined} roughness={0.4} metalness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function PcModel({ encendida }: PcParams) {
  useKeepRendering(encendida)
  const coolerFins = useMemo(() => stack(44, 0.026, [0.52, 1.24, 0.005], 2), [])
  const gpuFins = useMemo(() => stack(80, 0.033, [0.006, 0.34, 1.04], 0), [])
  const shroud = useMemo(() => {
    const L = 2.8
    const Hh = 1.2
    const sh = new THREE.Shape()
    sh.moveTo(-L / 2, 0)
    sh.lineTo(L / 2, 0)
    sh.lineTo(L / 2, Hh)
    sh.lineTo(-L / 2 + 0.12, Hh)
    sh.lineTo(-L / 2, Hh - 0.12)
    for (const c of [-0.62, 0.62]) {
      const p = new THREE.Path()
      p.absarc(c, Hh / 2 + 0.02, 0.47, 0, Math.PI * 2, true)
      sh.holes.push(p)
    }
    return new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, curveSegments: 48 })
  }, [])
  const ioPorts = useMemo(() => {
    // conectores del panel de atrás: USB, red, audio y video
    const r = rng(4)
    return Array.from({ length: 11 }, (_, i) => ({ v: 1.42 - i * 0.135, c: i === 4 ? '#e9eaec' : i > 8 ? ['#22c55e', '#ec4899'][i - 9] : r() < 0.5 ? '#1d4ed8' : '#0f1012' }))
  }, [])
  const ledOn = encendida ? CM.ledBlue : CM.plastic
  return (
    <group>
      {/* ---------------------------------------------------- chapa del gabinete */}
      <Part id="gabinete" offset={[0, 0, 0]} labelAt={[0, Y1 + 0.35, 1.9]}>
        {/* lado izquierdo (bandeja de la placa base) con pasacables de goma */}
        <mesh position={[-W / 2, (Y0 + Y1) / 2, 0]} material={CM.chassis} castShadow receiveShadow>
          <boxGeometry args={[0.03, H, D]} />
        </mesh>
        {[3.6, 2.4, 1.4].map((y) => (
          <RoundedBox key={y} args={[0.012, 0.75, 0.16]} radius={0.005} smoothness={2} position={[-W / 2 + 0.02, y, 0.62]} material={CM.rubber} />
        ))}
        {/* piso con patas de goma */}
        <mesh position={[0, Y0, 0]} material={CM.chassisIn} receiveShadow>
          <boxGeometry args={[W, 0.03, D]} />
        </mesh>
        {[-1, 1].map((sx) =>
          [-1, 1].map((sz) => (
            <mesh key={`${sx}${sz}`} position={[sx * (W / 2 - 0.22), Y0 / 2, sz * (D / 2 - 0.35)]} material={CM.rubber} castShadow>
              <cylinderGeometry args={[0.14, 0.16, Y0, 24]} />
            </mesh>
          )),
        )}
        {/* techo: chapa con filtro de malla y, adelante, los botones y puertos */}
        <mesh position={[0, Y1, 1.95]} material={CM.chassis} castShadow>
          <boxGeometry args={[W, 0.04, 0.7]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[(s * (W - 0.14)) / 2, Y1, -0.35]} material={CM.chassis}>
            <boxGeometry args={[0.14, 0.04, D - 0.7]} />
          </mesh>
        ))}
        <mesh position={[0, Y1 + 0.005, -0.35]} rotation={[-Math.PI / 2, 0, 0]} material={MESH_MAT}>
          <planeGeometry args={[W - 0.28, D - 0.7]} />
        </mesh>
        <group position={[0, Y1 + 0.02, 1.95]}>
          <mesh position={[0.55, 0.01, 0]} material={CM.nickel}>
            <cylinderGeometry args={[0.1, 0.1, 0.03, 32]} />
          </mesh>
          <mesh position={[0.55, 0.026, 0]} rotation={[-Math.PI / 2, 0, 0]} material={ledOn}>
            <ringGeometry args={[0.105, 0.125, 32]} />
          </mesh>
          <mesh position={[0.25, 0.005, 0]} material={CM.plasticGray}>
            <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
          </mesh>
          {[-0.55, -0.3].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <mesh material={CM.slot}>
                <boxGeometry args={[0.15, 0.02, 0.06]} />
              </mesh>
              <mesh position={[0, 0.011, -0.008]} material={CM.ledBlue}>
                <boxGeometry args={[0.12, 0.002, 0.018]} />
              </mesh>
            </group>
          ))}
          <RoundedBox args={[0.1, 0.02, 0.04]} radius={0.009} smoothness={2} position={[-0.08, 0, 0]} material={CM.slot} />
          <mesh position={[0.05, 0.005, 0]} material={CM.slot}>
            <cylinderGeometry args={[0.022, 0.022, 0.02, 16]} />
          </mesh>
        </group>
        {/* atrás: chapa y tapas de las ranuras de expansión */}
        <mesh position={[0, (Y0 + Y1) / 2, -D / 2]} material={CM.chassis} castShadow>
          <boxGeometry args={[W, H, 0.03]} />
        </mesh>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} position={[-0.38, BYC - 0.32 - i * 0.2032 - 0.05, -D / 2 - 0.02]} material={i < 3 ? CM.steel : CM.chassis}>
            <boxGeometry args={[1.18, 0.16, 0.012]} />
          </mesh>
        ))}
        {/* frente: marco de plástico y malla; detrás, dos ventiladores que meten aire */}
        {[-1, 1].map((s) => (
          <RoundedBox key={s} args={[0.14, H, 0.14]} radius={0.03} smoothness={3} position={[(s * (W - 0.14)) / 2, (Y0 + Y1) / 2, D / 2 + 0.05]} material={CM.plastic} castShadow />
        ))}
        <RoundedBox args={[W, 0.22, 0.14]} radius={0.03} smoothness={3} position={[0, Y0 + 0.11, D / 2 + 0.05]} material={CM.plastic} />
        <RoundedBox args={[W, 0.12, 0.14]} radius={0.03} smoothness={3} position={[0, Y1 - 0.06, D / 2 + 0.05]} material={CM.plastic} />
        <mesh position={[0, (Y0 + 0.22 + Y1 - 0.12) / 2, D / 2 + 0.1]} material={MESH_MAT}>
          <planeGeometry args={[W - 0.28, H - 0.34]} />
        </mesh>
        {[1.95, 3.3].map((y) => (
          <group key={y} position={[-0.05, y, D / 2 - 0.16]}>
            <Fan on={encendida} />
          </group>
        ))}
        {/* ventilador de atrás: saca el aire caliente */}
        <group position={[0.25, 3.72, -D / 2 + 0.15]}>
          <Fan on={encendida} />
        </group>
        {/* jaula del disco rígido */}
        {[-0.92, 0.32].map((x) => (
          <mesh key={x} position={[x, 0.65, 1.3]} material={CM.chassisIn} castShadow>
            <boxGeometry args={[0.02, 1.05, 1.6]} />
          </mesh>
        ))}
        <mesh position={[-0.3, 1.18, 1.3]} material={CM.chassisIn}>
          <boxGeometry args={[1.26, 0.02, 1.6]} />
        </mesh>
        {/* luz interna para ver las piezas */}
        <pointLight position={[0.6, 4.2, 0.4]} intensity={encendida ? 16 : 11} distance={8} color={encendida ? '#dcefff' : '#ffffff'} />
        <pointLight position={[0.7, 1.5, 0.9]} intensity={encendida ? 9 : 6} distance={6} color="#ffffff" />
        {/* tira de LED bajo el techo */}
        <mesh position={[0.2, Y1 - 0.04, 0]} material={encendida ? CM.ledBlue : CM.plastic}>
          <boxGeometry args={[0.03, 0.015, D - 0.8]} />
        </mesh>
      </Part>

      {/* ---------------------------------------------------- tapa de vidrio */}
      <Part id="tapa" offset={[3.6, 0, 0]} labelAt={[W / 2 + 0.1, 1.4, 1.2]}>
        <mesh position={[W / 2 + 0.02, (Y0 + Y1) / 2, 0]} material={CM.glass}>
          <boxGeometry args={[0.04, H - 0.04, D - 0.04]} />
        </mesh>
        {[-1, 1].map((sy) =>
          [-1, 1].map((sz) => (
            <mesh key={`${sy}${sz}`} position={[W / 2 + 0.07, (Y0 + Y1) / 2 + sy * (H / 2 - 0.25), sz * (D / 2 - 0.25)]} rotation={[0, 0, Math.PI / 2]} material={CM.nickel}>
              <cylinderGeometry args={[0.075, 0.075, 0.07, 20]} />
            </mesh>
          )),
        )}
      </Part>

      {/* ---------------------------------------------------- placa base */}
      <Part id="placa" offset={[-1.8, 0, 0]} labelAt={[BX + 0.1, 1.7, -0.1]}>
        <OnBoard>
          <mesh material={CM.pcbBlack} castShadow receiveShadow>
            <boxGeometry args={[2.44, 3.05, 0.016]} />
          </mesh>
          <mesh position={[0, 0, 0.0085]}>
            <planeGeometry args={[2.44, 3.05]} />
            <meshStandardMaterial map={MB_TEX ?? undefined} roughness={0.5} metalness={0.15} />
          </mesh>
          {/* tornillos de los separadores */}
          {[-1.12, -0.05, 1.12].map((u) =>
            [1.42, 0.1, -1.42].map((v) => (
              <mesh key={`${u}${v}`} position={[u, v, 0.02]} rotation={[Math.PI / 2, 0, 0]} material={CM.nickel}>
                <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} />
              </mesh>
            )),
          )}
          {/* zócalo LGA: marco de acero y palanca */}
          <group position={[0.32, 0.62, 0.02]}>
            <mesh material={CM.steel}>
              <boxGeometry args={[0.5, 0.5, 0.04]} />
            </mesh>
            <mesh position={[0.29, 0, 0.02]} material={CM.steel}>
              <cylinderGeometry args={[0.01, 0.01, 0.5, 8]} />
            </mesh>
          </group>
          {/* disipadores de los reguladores de tensión (VRM) y cubierta del panel de conectores */}
          <group position={[0.43, 1.3, 0.13]}>
            <RoundedBox args={[0.92, 0.22, 0.26]} radius={0.02} smoothness={2} material={CM.aluDark} castShadow />
            {Array.from({ length: 9 }, (_, i) => (
              <mesh key={i} position={[-0.4 + i * 0.1, 0, 0.131]} material={CM.chip}>
                <boxGeometry args={[0.03, 0.2, 0.004]} />
              </mesh>
            ))}
          </group>
          <RoundedBox args={[0.26, 1.55, 0.34]} radius={0.03} smoothness={2} position={[1.08, 0.72, 0.17]} material={CM.aluDark} castShadow />
          {/* capacitores sólidos alrededor del zócalo */}
          {Array.from({ length: 7 }, (_, i) => (
            <mesh key={i} position={[-0.05 + i * 0.12, 1.07, 0.05]} rotation={[Math.PI / 2, 0, 0]} material={CM.capAlu}>
              <cylinderGeometry args={[0.035, 0.035, 0.09, 14]} />
            </mesh>
          ))}
          {/* ranuras: 4 de RAM, PCIe x16 reforzada, x1 y x16 (x4) */}
          {[-0.42, -0.515, -0.64, -0.735].map((u, i) => (
            <Slot key={u} u={u} v={0.62} len={1.42} color={i % 2 ? CM.slot : CM.slotGray} />
          ))}
          <Slot u={0.2} v={-0.32} len={0.9} horizontal color={CM.steel} />
          <Slot u={0.5} v={-0.72} len={0.3} horizontal />
          <Slot u={0.2} v={-1.12} len={0.9} horizontal />
          {/* conector de 24 pines (de costado) y de 8 pines del procesador */}
          <mesh position={[-1.13, 0.55, 0.08]} material={CM.slot}>
            <boxGeometry args={[0.16, 0.55, 0.15]} />
          </mesh>
          <mesh position={[0.75, 1.47, 0.08]} material={CM.slot}>
            <boxGeometry args={[0.2, 0.09, 0.15]} />
          </mesh>
          {/* disipador del chipset */}
          <group position={[-0.6, -0.85, 0.05]}>
            <RoundedBox args={[0.55, 0.45, 0.08]} radius={0.02} smoothness={2} material={CM.aluDark} castShadow />
            <mesh position={[0, 0, 0.041]} material={CM.alu}>
              <boxGeometry args={[0.4, 0.04, 0.003]} />
            </mesh>
          </group>
          {/* 4 puertos SATA en ángulo, pila CR2032, chip del BIOS y cubierta del audio */}
          {[0, 1].map((r) =>
            [0, 1].map((c) => (
              <mesh key={`${r}${c}`} position={[-1.16, -1.0 - r * 0.12, 0.03 + c * 0.07]} material={CM.slot}>
                <boxGeometry args={[0.12, 0.1, 0.06]} />
              </mesh>
            )),
          )}
          <mesh position={[0.2, -0.92, 0.015]} rotation={[Math.PI / 2, 0, 0]} material={CM.nickel}>
            <cylinderGeometry args={[0.1, 0.1, 0.03, 32]} />
          </mesh>
          <mesh position={[-0.05, -1.25, 0.012]} material={CM.chip}>
            <boxGeometry args={[0.1, 0.07, 0.015]} />
          </mesh>
          <RoundedBox args={[0.28, 0.45, 0.06]} radius={0.02} smoothness={2} position={[1.0, -1.15, 0.04]} material={CM.plasticGray} />
          {/* panel de conectores traseros (sale por el agujero del gabinete) */}
          {ioPorts.map((p, i) => (
            <mesh key={i} position={[1.24, p.v, 0.12]}>
              <boxGeometry args={[0.06, 0.09, i === 4 ? 0.16 : 0.13]} />
              <meshStandardMaterial color={p.c} roughness={0.5} />
            </mesh>
          ))}
        </OnBoard>
      </Part>

      {/* ---------------------------------------------------- procesador */}
      <Part id="cpu" offset={[1.0, 0.9, 0]} labelAt={[BX + 0.1, BYC + 0.62, BZC - 0.62]}>
        <OnBoard>
          <group position={[0.32, 0.62, 0.05]}>
            <mesh material={CM.pcbGreen}>
              <boxGeometry args={[0.375, 0.375, 0.012]} />
            </mesh>
            <RoundedBox args={[0.32, 0.32, 0.035]} radius={0.012} smoothness={2} position={[0, 0, 0.02]} material={CM.nickel} />
            <mesh position={[0, 0, 0.0381]}>
              <planeGeometry args={[0.3, 0.3]} />
              <meshStandardMaterial map={CPU_TEX ?? undefined} metalness={0.8} roughness={0.32} />
            </mesh>
          </group>
        </OnBoard>
      </Part>

      {/* ---------------------------------------------------- cooler de torre */}
      <Part id="cooler" offset={[2.6, 1.2, 0]} labelAt={[0.65, 4.45, -1.2]}>
        <OnBoard>
          <group position={[0.32, 0.62, 0]}>
            {/* base de cobre niquelado y puente de sujeción */}
            <mesh position={[0, 0, 0.12]} material={CM.nickel}>
              <boxGeometry args={[0.38, 0.4, 0.06]} />
            </mesh>
            <mesh position={[0, 0, 0.17]} material={CM.steel}>
              <boxGeometry args={[0.12, 0.8, 0.03]} />
            </mesh>
            {/* 4 heatpipes en U: suben desde la base y atraviesan las aletas */}
            {[-0.27, -0.09, 0.09, 0.27].map((v, i) =>
              [-1, 1].map((s) => (
                <mesh key={`${v}${s}`} position={[s * (0.12 + (i % 2) * 0.04), v, 0.85]} rotation={[Math.PI / 2, 0, 0]} material={CM.copper} castShadow>
                  <cylinderGeometry args={[0.03, 0.03, 1.42, 12]} />
                </mesh>
              )),
            )}
            {[-0.27, -0.09, 0.09, 0.27].map((v, i) => (
              <mesh key={v} position={[0, v, 0.15]} rotation={[0, 0, Math.PI / 2]} material={CM.copper}>
                <cylinderGeometry args={[0.03, 0.03, 0.24 + (i % 2) * 0.08, 12]} />
              </mesh>
            ))}
            {/* aletas de aluminio y tapa */}
            <mesh geometry={coolerFins} position={[0, 0, 0.98]} material={CM.alu} castShadow />
            <RoundedBox args={[0.54, 1.26, 0.04]} radius={0.015} smoothness={2} position={[0, 0, 1.56]} material={CM.aluDark} castShadow />
            {[-0.27, -0.09, 0.09, 0.27].map((v, i) =>
              [-1, 1].map((s) => (
                <mesh key={`c${v}${s}`} position={[s * (0.12 + (i % 2) * 0.04), v, 1.585]} rotation={[Math.PI / 2, 0, 0]} material={CM.nickel}>
                  <cylinderGeometry args={[0.032, 0.032, 0.02, 12]} />
                </mesh>
              )),
            )}
            {/* ventilador de 120 mm adelante de las aletas (empuja el aire hacia atrás) */}
            <group position={[-0.4, 0, 0.98]} rotation={[0, Math.PI / 2, 0]}>
              <Fan on={encendida} />
            </group>
          </group>
        </OnBoard>
      </Part>

      {/* ---------------------------------------------------- RAM */}
      <Part id="ram" offset={[2.0, 0.6, 0.6]} labelAt={[BX + 0.5, 4.35, -0.3]}>
        <OnBoard>
          <RamStick u={-0.515} v={0.62} />
          <RamStick u={-0.735} v={0.62} />
        </OnBoard>
      </Part>

      {/* ---------------------------------------------------- placa de video */}
      <Part id="gpu" offset={[2.4, -0.4, 0.8]} labelAt={[0.35, BYC - 0.2, 0.4]}>
        <OnBoard>
          <group position={[0, -0.32, 0]}>
            {/* placa impresa con su conector de borde dentro de la ranura */}
            <mesh position={[-0.25, 0.03, 0.66]} material={CM.pcbBlack}>
              <boxGeometry args={[2.75, 0.016, 1.2]} />
            </mesh>
            {/* backplate de aluminio arriba */}
            <mesh position={[-0.25, 0.055, 0.67]} material={CM.aluDark} castShadow>
              <boxGeometry args={[2.72, 0.02, 1.18]} />
            </mesh>
            {/* aletas del disipador y heatpipes */}
            <mesh geometry={gpuFins} position={[-0.25, -0.17, 0.66]} material={CM.alu} />
            {[0.35, 0.55, 0.75].map((n) => (
              <mesh key={n} position={[-0.25, -0.07, n]} rotation={[0, 0, Math.PI / 2]} material={CM.nickel}>
                <cylinderGeometry args={[0.028, 0.028, 2.6, 10]} />
              </mesh>
            ))}
            {/* carcasa (shroud) con los agujeros de los ventiladores */}
            <mesh geometry={shroud} position={[-0.25, -0.36, 0.06]} rotation={[Math.PI / 2, 0, 0]} material={CM.plasticGloss} castShadow />
            {[-0.62, 0.62].map((c) => (
              <group key={c} position={[-0.25 + c, -0.37, 0.68]} rotation={[Math.PI / 2, 0, 0]}>
                <Fan on={encendida} size={1.0} depth={0.12} frame={false} blades={11} speed={12} />
              </group>
            ))}
            {/* canto que mira al vidrio, con el nombre y la tira de luz */}
            <mesh position={[-0.25, -0.15, 1.275]}>
              <planeGeometry args={[2.72, 0.42]} />
              <meshStandardMaterial map={GPU_EDGE ?? undefined} roughness={0.4} emissive="#ffffff" emissiveMap={GPU_EDGE ?? undefined} emissiveIntensity={encendida ? 0.35 : 0} />
            </mesh>
            {/* chapa trasera con las salidas de video */}
            <mesh position={[1.17, -0.18, 0.6]} material={CM.steel}>
              <boxGeometry args={[0.012, 0.5, 1.2]} />
            </mesh>
            {[0.2, 0.42, 0.64, 0.86].map((n, i) => (
              <mesh key={n} position={[1.19, -0.02, n]} material={CM.slot}>
                <boxGeometry args={[0.03, 0.08, i === 3 ? 0.17 : 0.2]} />
              </mesh>
            ))}
            {/* conector de alimentación de 8 pines */}
            <mesh position={[-0.9, 0.0, 1.3]} material={CM.slot}>
              <boxGeometry args={[0.2, 0.08, 0.1]} />
            </mesh>
          </group>
        </OnBoard>
      </Part>

      {/* ---------------------------------------------------- SSD M.2 */}
      <Part id="ssd" offset={[1.6, 0, 0.3]} labelAt={[BX + 0.1, BYC + 0.02, BZC + 0.15]}>
        <OnBoard>
          <group position={[-0.15, 0.02, 0.03]}>
            <mesh material={CM.pcbBlack}>
              <boxGeometry args={[0.8, 0.22, 0.012]} />
            </mesh>
            <mesh position={[0.02, 0, 0.009]}>
              <planeGeometry args={[0.7, 0.2]} />
              <meshStandardMaterial map={SSD_STICKER ?? undefined} roughness={0.5} />
            </mesh>
            <mesh position={[-0.42, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={CM.nickel}>
              <cylinderGeometry args={[0.025, 0.025, 0.03, 12]} />
            </mesh>
          </group>
        </OnBoard>
      </Part>

      {/* ---------------------------------------------------- fuente y cables */}
      <Part id="fuente" offset={[2.0, -0.7, -0.6]} labelAt={[0.55, 1.15, -1.5]}>
        <group position={[-0.25, Y0 + 0.46, -1.47]}>
          <RoundedBox args={[1.5, 0.86, 1.6]} radius={0.025} smoothness={2} material={CM.chassis} castShadow receiveShadow />
          {/* ventilador hacia arriba, con su rejilla */}
          <group position={[0, 0.44, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <Fan on={encendida} frame={false} size={1.3} depth={0.12} />
          </group>
          {[0.18, 0.32, 0.46, 0.6].map((r) => (
            <mesh key={r} position={[0, 0.44, 0]} rotation={[Math.PI / 2, 0, 0]} material={CM.chassis}>
              <torusGeometry args={[r, 0.008, 6, 48]} />
            </mesh>
          ))}
          <mesh position={[0.751, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[1.4, 0.8]} />
            <meshStandardMaterial map={PSU_LABEL ?? undefined} roughness={0.55} />
          </mesh>
          {/* enchufe IEC y llave I/O, atrás */}
          <mesh position={[0.35, 0.1, -0.81]} material={CM.slot}>
            <boxGeometry args={[0.28, 0.2, 0.03]} />
          </mesh>
          <mesh position={[0.0, 0.1, -0.81]} material={CM.slot}>
            <boxGeometry args={[0.1, 0.16, 0.04]} />
          </mesh>
          {/* conectores modulares del frente */}
          {[-0.5, -0.25, 0, 0.25].map((x) => (
            <mesh key={x} position={[x, -0.1, 0.81]} material={CM.slot}>
              <boxGeometry args={[0.18, 0.12, 0.03]} />
            </mesh>
          ))}
        </group>
        {/* 24 pines a la placa base, 8 pines a la placa de video y al procesador, SATA al disco */}
        <Cable material={CM.sleeve} r={0.075} pts={[[-0.5, Y0 + 0.36, -0.66], [-0.55, 0.75, -0.1], [-0.82, 1.6, 0.85], [-0.85, 2.9, 0.85], [-0.84, 3.48, 0.62], board(-1.21, 0.55, 0.08)]} />
        <Cable material={CM.sleeve} r={0.045} pts={[[0.0, Y0 + 0.36, -0.66], [0.35, 1.2, -0.3], [0.4, 2.3, 0.05], board(-0.9, -0.29, 1.42), board(-0.9, -0.32, 1.36)]} />
        <Cable material={CM.sleeve} r={0.035} pts={[board(0.75, 1.47, 0.18), board(0.75, 1.62, 0.2), [-1.06, Y1 - 0.06, BZC - 0.6]]} />
        <Cable material={CM.sataRed} r={0.018} pts={[board(-1.24, -1.0, 0.05), [-0.9, 1.7, 0.55], [-0.7, 0.9, 0.5], [-0.62, 0.5, 0.48]]} />
        <Cable material={CM.sleeve} r={0.025} pts={[[0.25, Y0 + 0.36, -0.66], [0.3, 0.3, 0.1], [0.05, 0.5, 0.45], [-0.15, 0.5, 0.48]]} />
      </Part>

      {/* ---------------------------------------------------- disco rígido en su jaula */}
      <Part id="disco" offset={[2.0, -0.4, 1.6]} labelAt={[0.2, 0.95, 1.3]}>
        <group position={[-0.3, 0.5, 1.3]}>
          <RoundedBox args={[1.02, 0.26, 1.47]} radius={0.02} smoothness={2} material={CM.alu} castShadow />
          <mesh position={[0, 0.131, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.9, 1.25]} />
            <meshStandardMaterial map={HDD_LABEL ?? undefined} roughness={0.5} />
          </mesh>
          {/* conectores SATA de datos y alimentación (hacia atrás) */}
          <mesh position={[-0.25, -0.02, -0.74]} material={CM.slot}>
            <boxGeometry args={[0.22, 0.06, 0.03]} />
          </mesh>
          <mesh position={[0.15, -0.02, -0.74]} material={CM.slot}>
            <boxGeometry args={[0.38, 0.06, 0.03]} />
          </mesh>
        </group>
      </Part>
    </group>
  )
}

/* ================================================================== HDD y SSD */

export interface DiscoParams {
  tipo: 'hdd' | 'ssd'
  encendido: boolean
}

export const discoParts = (p: DiscoParams) =>
  p.tipo === 'hdd'
    ? [
        { id: 'tapa', name: 'Tapa', desc: 'Cierra el disco herméticamente: una sola partícula de polvo puede rayar el plato. Esta es transparente, como los discos de muestra, para poder ver adentro.' },
        { id: 'plato', name: 'Plato magnético', desc: 'Disco de aluminio o vidrio pulido como un espejo y recubierto de material magnético. Gira a 7200 vueltas por minuto. Los datos se guardan como zonas magnetizadas (unos y ceros) en pistas circulares.' },
        { id: 'motor', name: 'Motor (eje)', desc: 'Motor sin escobillas que hace girar los platos a velocidad constante. La abrazadera con tornillos sujeta los platos al eje.' },
        { id: 'cabezal', name: 'Brazo y cabezal de lectura/escritura', desc: 'Lo mueve una bobina entre imanes (actuador). En la punta, el cabezal flota sobre el plato a unos pocos nanómetros: lee y escribe los datos. Al apagar, se estaciona en la rampa del costado.' },
        { id: 'carcasa', name: 'Carcasa', desc: 'Base de aluminio fundido que sostiene todo, con los agujeros para atornillarla al gabinete.' },
        { id: 'controladora', name: 'Placa controladora', desc: 'Electrónica (abajo del disco) que maneja el motor y el cabezal y se comunica con la placa base por el cable SATA.' },
      ]
    : [
        { id: 'tapa', name: 'Carcasa', desc: 'Protege la placa. Al no tener partes móviles, el SSD aguanta golpes y no hace ruido.' },
        { id: 'flash', name: 'Chips de memoria flash', desc: 'Guardan los datos en forma permanente sin partes móviles (como un pendrive, pero mucho más rápido).' },
        { id: 'controlador', name: 'Controlador', desc: 'El "cerebro" del SSD: reparte y ordena los datos entre los chips de memoria. A su lado hay un chip de memoria caché.' },
        { id: 'placa', name: 'Placa', desc: 'Circuito impreso que une los chips y el conector.' },
        { id: 'conector', name: 'Conector SATA', desc: 'Por acá se conecta a la placa base (datos, el conector chico) y a la fuente (alimentación, el largo).' },
      ]

const CAST = new THREE.MeshStandardMaterial({ color: '#b4b9bf', roughness: 0.55, metalness: 0.75, normalMap: TEXTURE_N, normalScale: new THREE.Vector2(0.35, 0.35) })
const PLATTER_RINGS = canvasTex(512, 512, (ctx, w, h) => {
  ctx.fillStyle = '#c9cfd6'
  ctx.fillRect(0, 0, w, h)
  for (let r = 40; r < w / 2; r += 2) {
    ctx.strokeStyle = r % 6 ? 'rgba(255,255,255,0.12)' : 'rgba(150,160,175,0.16)'
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2)
    ctx.stroke()
  }
})

const chipLabel = (t: string, sub: string) =>
  canvasTex(256, 180, (ctx, w, h) => {
    ctx.fillStyle = '#141518'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(210,214,220,0.85)'
    ctx.font = 'bold 34px system-ui'
    ctx.fillText(t, 20, 70)
    ctx.font = '22px ui-monospace, monospace'
    ctx.fillText(sub, 20, 112)
    ctx.beginPath()
    ctx.arc(26, h - 26, 8, 0, Math.PI * 2)
    ctx.fill()
  })
const NAND_TEX = chipLabel('NAND', '3D TLC 128G')
const CTRL_TEX = chipLabel('CTRL', 'SATA 6G')
const DRAM_TEX = chipLabel('DRAM', '512 MB')
const SSD_LABEL = canvasTex(512, 360, (ctx, w, h) => {
  ctx.fillStyle = '#1b1d22'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#e6e8ec'
  ctx.font = 'bold 54px system-ui'
  ctx.fillText('SSD 480 GB', 40, 110)
  ctx.font = '30px system-ui'
  ctx.fillText('SATA III · 550 MB/s', 40, 170)
  ctx.fillText('2,5" · 7 mm', 40, 220)
  ctx.font = '22px ui-monospace, monospace'
  ctx.fillStyle = '#9aa1ab'
  ctx.fillText('S/N VLD-SSD-0417', 40, 300)
})
const SSD_PCB = canvasTex(512, 720, (ctx, w, h) => {
  ctx.fillStyle = '#1d4a35'
  ctx.fillRect(0, 0, w, h)
  drawTraces(ctx, w, h, 40, 3, 'rgba(120,170,110,0.45)')
})

/** Brazo del actuador: angosto en la punta, con un agujero de alivianamiento. */
function armGeometry(L: number) {
  const s = new THREE.Shape()
  s.moveTo(0, -0.17)
  s.lineTo(L * 0.35, -0.12)
  s.lineTo(L, -0.035)
  s.lineTo(L, 0.035)
  s.lineTo(L * 0.35, 0.12)
  s.lineTo(0, 0.17)
  s.absarc(0, 0, 0.17, Math.PI / 2, (Math.PI * 3) / 2, false)
  const hole = new THREE.Path()
  hole.moveTo(0.35, -0.05)
  hole.lineTo(0.75, -0.035)
  hole.lineTo(0.75, 0.035)
  hole.lineTo(0.35, 0.05)
  hole.lineTo(0.35, -0.05)
  s.holes.push(hole)
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.035, bevelEnabled: false })
  g.rotateX(-Math.PI / 2)
  return g
}

const HDD_WALLS = (() => {
  const o = new THREE.Shape()
  o.moveTo(-1.45, -2.05)
  o.lineTo(1.45, -2.05)
  o.lineTo(1.45, 2.05)
  o.lineTo(-1.45, 2.05)
  o.lineTo(-1.45, -2.05)
  const hole = new THREE.Path()
  hole.moveTo(-1.36, -1.96)
  hole.lineTo(-1.36, 1.96)
  hole.lineTo(1.36, 1.96)
  hole.lineTo(1.36, -1.96)
  hole.lineTo(-1.36, -1.96)
  o.holes.push(hole)
  const g = new THREE.ExtrudeGeometry(o, { depth: 0.56, bevelEnabled: false })
  g.rotateX(-Math.PI / 2)
  return g
})()

export function DiscoModel({ tipo, encendido }: DiscoParams) {
  useKeepRendering(encendido && tipo === 'hdd')
  const plate = useRef<THREE.Group>(null)
  const arm = useRef<THREE.Group>(null)
  // el brazo gira alrededor de su eje (atrás a la derecha) y barre el plato entre las pistas
  const PIV: V3 = [0.85, 0, -1.35]
  const PC: V3 = [0, 0, 0.55]
  const L = 2.05
  const th0 = -1.99
  useFrame(({ clock }, dt) => {
    if (tipo !== 'hdd') return
    if (encendido && plate.current) plate.current.rotation.y -= Math.min(dt, 0.05) * 22
    if (arm.current) {
      const target = encendido ? th0 - (0.42 + Math.sin(clock.elapsedTime * 2.1) * 0.17 + Math.sin(clock.elapsedTime * 5.3) * 0.03) : th0 - 0.72
      arm.current.rotation.y += (target - arm.current.rotation.y) * Math.min(1, dt * 8)
    }
  })
  const armG = useMemo(() => armGeometry(L), [])
  if (tipo === 'ssd')
    return (
      <group>
        <Part id="tapa" offset={[0, 1.8, 0]} labelAt={[0, 0.55, 0]}>
          <RoundedBox args={[2.8, 0.1, 4.0]} radius={0.04} smoothness={3} position={[0, 0.33, 0]} material={CM.aluDark} castShadow />
          <mesh position={[0, 0.381, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2.3, 1.62]} />
            <meshStandardMaterial map={SSD_LABEL ?? undefined} roughness={0.45} />
          </mesh>
          {/* carcasa de abajo */}
          <mesh position={[0, -0.06, 0]} material={CM.aluDark} castShadow receiveShadow>
            <boxGeometry args={[2.8, 0.06, 4.0]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 1.37, 0.13, 0]} material={CM.aluDark}>
              <boxGeometry args={[0.06, 0.34, 4.0]} />
            </mesh>
          ))}
        </Part>
        <Part id="flash" offset={[0, 0.9, 0]} labelAt={[0.6, 0.45, -0.8]}>
          {[-1.25, -0.35, 0.55].map((z) => (
            <group key={z} position={[0.55, 0.1, z]}>
              <mesh material={CM.chip} castShadow>
                <boxGeometry args={[0.95, 0.08, 0.7]} />
              </mesh>
              <mesh position={[0, 0.041, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.9, 0.65]} />
                <meshStandardMaterial map={NAND_TEX ?? undefined} roughness={0.45} />
              </mesh>
            </group>
          ))}
        </Part>
        <Part id="controlador" offset={[0, 0.9, 0]} labelAt={[-0.6, 0.45, -0.5]}>
          <group position={[-0.6, 0.1, -0.5]}>
            <mesh material={CM.chip} castShadow>
              <boxGeometry args={[0.75, 0.08, 0.75]} />
            </mesh>
            <mesh position={[0, 0.041, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.7, 0.7]} />
              <meshStandardMaterial map={CTRL_TEX ?? undefined} roughness={0.45} />
            </mesh>
          </group>
          <group position={[-0.6, 0.09, 0.45]}>
            <mesh material={CM.chip}>
              <boxGeometry args={[0.6, 0.06, 0.4]} />
            </mesh>
            <mesh position={[0, 0.031, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.56, 0.36]} />
              <meshStandardMaterial map={DRAM_TEX ?? undefined} roughness={0.45} />
            </mesh>
          </group>
        </Part>
        <Part id="placa" offset={[0, 0, 0]} labelAt={[-1, 0.2, 1.2]}>
          <mesh position={[0, 0.03, 0]} castShadow receiveShadow material={CM.pcbGreen}>
            <boxGeometry args={[2.55, 0.05, 3.7]} />
          </mesh>
          <mesh position={[0, 0.056, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2.55, 3.7]} />
            <meshStandardMaterial map={SSD_PCB ?? undefined} roughness={0.45} />
          </mesh>
          {/* componentes chicos (capacitores y resistencias SMD) */}
          {Array.from({ length: 26 }, (_, i) => (
            <mesh key={i} position={[-1.1 + (i % 13) * 0.17, 0.07, 1.05 + Math.floor(i / 13) * 0.18]} material={i % 3 ? CM.ivory : CM.chip}>
              <boxGeometry args={[0.08, 0.04, 0.05]} />
            </mesh>
          ))}
        </Part>
        <Part id="conector" offset={[0, 0, 1.2]} labelAt={[0, 0.35, 2.05]}>
          <group position={[0, 0.12, 1.92]}>
            <mesh position={[0.55, 0, 0]} material={CM.slot}>
              <boxGeometry args={[0.55, 0.16, 0.16]} />
            </mesh>
            <mesh position={[-0.35, 0, 0]} material={CM.slot}>
              <boxGeometry args={[0.95, 0.16, 0.16]} />
            </mesh>
            {Array.from({ length: 22 }, (_, i) => (
              <mesh key={i} position={[i < 7 ? 0.34 + i * 0.06 : -0.78 + (i - 7) * 0.058, 0, 0.081]} material={CM.gold}>
                <boxGeometry args={[0.025, 0.07, 0.004]} />
              </mesh>
            ))}
          </group>
        </Part>
      </group>
    )
  return (
    <group>
      <Part id="carcasa" offset={[0, -0.6, 0]} labelAt={[1.45, 0.35, 1.6]}>
        {/* fondo y paredes de aluminio fundido */}
        <mesh position={[0, 0.06, 0]} material={CAST} castShadow receiveShadow>
          <boxGeometry args={[2.9, 0.12, 4.1]} />
        </mesh>
        <mesh geometry={HDD_WALLS} position={[0, 0.12, 0]} material={CAST} castShadow />
        {/* agujeros roscados de los costados */}
        {[-1, 1].map((s) =>
          [-1.4, 0.1, 1.6].map((z) => (
            <mesh key={`${s}${z}`} position={[s * 1.452, 0.35, z]} rotation={[0, 0, Math.PI / 2]} material={CM.slot}>
              <cylinderGeometry args={[0.06, 0.06, 0.01, 16]} />
            </mesh>
          )),
        )}
        {/* filtro de aire y rampa de estacionamiento del cabezal */}
        <mesh position={[-1.1, 0.3, -1.4]} material={CM.ivory}>
          <boxGeometry args={[0.35, 0.3, 0.12]} />
        </mesh>
        <mesh position={[-1.05, 0.44, -0.5]} rotation={[0, 0.5, 0]} material={CM.plastic}>
          <boxGeometry args={[0.18, 0.1, 0.32]} />
        </mesh>
        {/* imán del actuador (arriba de la bobina) */}
        <mesh position={[1.12, 0.62, -1.62]} rotation={[0, 0.5, 0]} material={CM.nickel} castShadow>
          <boxGeometry args={[0.5, 0.05, 0.42]} />
        </mesh>
        {/* cable plano (flex) del cabezal al conector */}
        <mesh position={[0.5, 0.35, -1.75]} rotation={[0, 0.3, 0]}>
          <boxGeometry args={[0.55, 0.12, 0.012]} />
          <meshStandardMaterial color="#c98a2a" roughness={0.35} metalness={0.2} />
        </mesh>
      </Part>
      <Part id="controladora" offset={[0, -1.4, 0]} labelAt={[0, -0.1, 1.5]}>
        <mesh position={[0, -0.03, -0.3]} material={CM.pcbGreen}>
          <boxGeometry args={[2.7, 0.05, 3.3]} />
        </mesh>
        <mesh position={[0, -0.056, 0.75]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.3, 0.9]} />
          <meshStandardMaterial map={HDD_LABEL ?? undefined} roughness={0.5} />
        </mesh>
        {(
          [
            [-0.5, -0.8, 0.6],
            [0.5, -0.4, 0.45],
            [0.6, 0.6, 0.35],
          ] as V3[]
        ).map(([x, z, s], i) => (
          <mesh key={i} position={[x, -0.075, z]} material={CM.chip}>
            <boxGeometry args={[s, 0.05, s]} />
          </mesh>
        ))}
        {/* conectores SATA (datos y alimentación) en el borde de atrás */}
        <mesh position={[-0.55, 0.12, -2.08]} material={CM.slot}>
          <boxGeometry args={[0.5, 0.18, 0.1]} />
        </mesh>
        <mesh position={[0.4, 0.12, -2.08]} material={CM.slot}>
          <boxGeometry args={[0.9, 0.18, 0.1]} />
        </mesh>
      </Part>
      <Part id="motor" offset={[0, 0.6, 0]} labelAt={[PC[0] - 0.3, 0.85, PC[2]]}>
        <group position={PC}>
          <mesh position={[0, 0.3, 0]} material={CM.nickel}>
            <cylinderGeometry args={[0.34, 0.36, 0.36, 40]} />
          </mesh>
          {/* abrazadera con 6 tornillos */}
          <mesh position={[0, 0.5, 0]} material={CM.steel}>
            <cylinderGeometry args={[0.38, 0.38, 0.03, 40]} />
          </mesh>
          {Array.from({ length: 6 }, (_, i) => (
            <mesh key={i} position={[Math.cos((i * Math.PI) / 3) * 0.25, 0.525, Math.sin((i * Math.PI) / 3) * 0.25]} material={CM.chip}>
              <cylinderGeometry args={[0.04, 0.04, 0.02, 6]} />
            </mesh>
          ))}
        </group>
      </Part>
      <Part id="plato" offset={[0, 1.1, 0]} labelAt={[0.7, 0.75, 1.5]}>
        <group ref={plate} position={[PC[0], 0.46, PC[2]]}>
          <mesh>
            <cylinderGeometry args={[1.33, 1.33, 0.025, 96]} />
            <meshStandardMaterial map={PLATTER_RINGS ?? undefined} color="#f2f5f8" metalness={1} roughness={0.04} />
          </mesh>
          {/* segundo plato, abajo */}
          <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[1.33, 1.33, 0.025, 96]} />
            <meshStandardMaterial color="#c9cfd6" metalness={1} roughness={0.08} />
          </mesh>
        </group>
      </Part>
      <Part id="cabezal" offset={[0, 1.6, -0.6]} labelAt={[PIV[0], 0.85, PIV[2]]}>
        <group position={[PIV[0], 0.5, PIV[2]]}>
          <mesh material={CM.steel}>
            <cylinderGeometry args={[0.17, 0.17, 0.42, 24]} />
          </mesh>
          <group ref={arm} rotation={[0, th0 - 0.72, 0]}>
            <mesh geometry={armG} material={CM.alu} castShadow />
            <mesh geometry={armG} position={[0, -0.2, 0]} material={CM.alu} />
            {/* suspensión y cabezal (slider) en la punta */}
            <mesh position={[L - 0.08, -0.015, 0]} material={CM.nickel}>
              <boxGeometry args={[0.16, 0.01, 0.05]} />
            </mesh>
            <mesh position={[L - 0.02, -0.03, 0]} material={CM.chip}>
              <boxGeometry args={[0.05, 0.02, 0.04]} />
            </mesh>
            {/* bobina del actuador, del otro lado del eje */}
            <mesh position={[-0.38, 0.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.16, 0.05, 8, 24]} />
              <meshStandardMaterial color="#b0662f" metalness={0.8} roughness={0.35} />
            </mesh>
          </group>
        </group>
      </Part>
      <Part id="tapa" offset={[0, 2.4, 0]} labelAt={[0, 0.85, -0.6]}>
        {/* tapa de acrílico (como los discos de muestra) con los tornillos del borde */}
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[2.88, 0.03, 4.08]} />
          <meshPhysicalMaterial color="#dfe8ef" roughness={0.04} metalness={0} transparent opacity={0.18} clearcoat={1} depthWrite={false} />
        </mesh>
        {(
          [
            [-1.32, -1.9],
            [1.32, -1.9],
            [-1.32, 1.9],
            [1.32, 1.9],
            [0, -1.9],
            [0, 1.9],
            [1.32, -0.4],
            [-1.32, 0.55],
          ] as [number, number][]
        ).map(([x, z], i) => (
          <mesh key={i} position={[x, 0.725, z]} material={CM.steel}>
            <cylinderGeometry args={[0.05, 0.05, 0.02, 12]} />
          </mesh>
        ))}
      </Part>
    </group>
  )
}

/* ================================================================== periféricos */

export interface PerifParams {
  resaltar: 'todos' | 'entrada' | 'salida'
}

export const PERIF_PARTS = [
  { id: 'monitor', name: 'Monitor (salida)', desc: 'Dispositivo de salida: muestra la información al usuario. Este es de 22 pulgadas, Full HD (1920 × 1080 píxeles).' },
  { id: 'parlantes', name: 'Parlantes (salida)', desc: 'Dispositivo de salida: transforman la señal eléctrica en sonido. El cono grande (woofer) hace los graves y el chico (tweeter) los agudos.' },
  { id: 'impresora', name: 'Impresora (salida)', desc: 'Dispositivo de salida: pasa la información al papel. Esta es multifunción: arriba tiene un escáner, que es de entrada.' },
  { id: 'teclado', name: 'Teclado (entrada)', desc: 'Dispositivo de entrada: con él el usuario ingresa datos y comandos. Este es en español (tiene la Ñ) y tiene teclado numérico.' },
  { id: 'mouse', name: 'Mouse (entrada)', desc: 'Dispositivo de entrada: un sensor óptico mira la mesa para mover el puntero; tiene dos botones y una ruedita.' },
  { id: 'webcam', name: 'Cámara web (entrada)', desc: 'Dispositivo de entrada: captura imagen (y sonido, con su micrófono). Se engancha arriba del monitor.' },
]

const KIND: Record<string, 'entrada' | 'salida'> = { monitor: 'salida', parlantes: 'salida', impresora: 'salida', teclado: 'entrada', mouse: 'entrada', webcam: 'entrada' }

export const DESKTOP = canvasTex(1024, 576, (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, '#0f2a4a')
  g.addColorStop(0.6, '#1e3a8a')
  g.addColorStop(1, '#3b1a5a')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  // ventana con un editor
  ctx.fillStyle = '#f4f6f8'
  ctx.fillRect(120, 70, 640, 380)
  ctx.fillStyle = '#d7dde4'
  ctx.fillRect(120, 70, 640, 36)
  ;['#ef4444', '#f59e0b', '#22c55e'].forEach((c, i) => {
    ctx.fillStyle = c
    ctx.beginPath()
    ctx.arc(140 + i * 22, 88, 7, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.fillStyle = '#1f2937'
  ctx.font = 'bold 18px system-ui'
  ctx.fillText('ITS Villada · Computación', 220, 94)
  ctx.font = '24px ui-monospace, monospace'
  ;[
    ['#7c3aed', 'Algoritmo', ' sumar'],
    ['#2563eb', '  Leer', ' a, b'],
    ['#2563eb', '  c <-', ' a + b'],
    ['#2563eb', '  Escribir', ' c'],
    ['#7c3aed', 'FinAlgoritmo', ''],
  ].forEach(([c, a, b], i) => {
    ctx.fillStyle = c
    ctx.fillText(a, 150, 160 + i * 44)
    ctx.fillStyle = '#111827'
    ctx.fillText(b, 150 + ctx.measureText(a).width, 160 + i * 44)
  })
  // barra de tareas
  ctx.fillStyle = 'rgba(12,16,24,0.92)'
  ctx.fillRect(0, h - 40, w, 40)
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = ['#38bdf8', '#f59e0b', '#22c55e', '#e5e7eb', '#a78bfa', '#f472b6'][i]
    ctx.fillRect(w / 2 - 130 + i * 44, h - 30, 22, 22)
  }
  ctx.fillStyle = '#e5e7eb'
  ctx.font = '16px system-ui'
  ctx.fillText('10:35', w - 70, h - 14)
})

/** Cono de parlante (perfil girado): borde de goma, cono de papel y el cuello. */
const CONE = new THREE.LatheGeometry(
  (
    [
      [0.27, 0.0],
      [0.26, 0.02],
      [0.235, 0.01],
      [0.09, -0.07],
      [0.085, -0.06],
    ] as [number, number][]
  ).map(([r, y]) => new THREE.Vector2(r, y)),
  40,
).rotateX(Math.PI / 2)
const PAPER = new THREE.MeshStandardMaterial({ color: '#1a1a1c', roughness: 0.85, side: THREE.DoubleSide })

function Speaker({ knob }: { knob?: boolean }) {
  return (
    <group>
      <RoundedBox args={[0.78, 1.25, 0.82]} radius={0.06} smoothness={4} position={[0, 0.625, 0]} material={CM.plastic} castShadow receiveShadow />
      <RoundedBox args={[0.72, 1.18, 0.02]} radius={0.01} smoothness={2} position={[0, 0.625, 0.41]} material={CM.plasticGloss} />
      <group position={[0, 0.48, 0.42]}>
        <mesh geometry={CONE} material={PAPER} />
        <mesh position={[0, 0, -0.045]} scale={[1, 1, 0.5]} rotation={[Math.PI / 2, 0, 0]} material={CM.plasticGloss}>
          <sphereGeometry args={[0.085, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh material={CM.aluDark}>
          <torusGeometry args={[0.28, 0.012, 8, 48]} />
        </mesh>
      </group>
      {/* tweeter de domo */}
      <group position={[0, 0.98, 0.42]}>
        <mesh material={CM.aluDark}>
          <torusGeometry args={[0.1, 0.012, 8, 32]} />
        </mesh>
        <mesh scale={[1, 1, 0.55]} rotation={[Math.PI / 2, 0, 0]} material={CM.nickel}>
          <sphereGeometry args={[0.065, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      </group>
      {/* tubo de graves */}
      <mesh position={[0, 0.14, 0.415]} material={CM.slot}>
        <boxGeometry args={[0.36, 0.06, 0.01]} />
      </mesh>
      {knob && (
        <group position={[0.24, 0.14, 0.43]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh material={CM.aluDark}>
            <cylinderGeometry args={[0.065, 0.07, 0.05, 32]} />
          </mesh>
          <mesh position={[-0.13, 0.0, 0]} material={CM.ledBlue}>
            <cylinderGeometry args={[0.012, 0.012, 0.03, 12]} />
          </mesh>
        </group>
      )}
    </group>
  )
}

const PAGE = canvasTex(256, 360, (ctx, w, h) => {
  ctx.fillStyle = '#fbfbf8'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#1f2937'
  ctx.font = 'bold 22px system-ui'
  ctx.fillText('Informe de taller', 22, 44)
  ctx.fillStyle = '#9ca3af'
  for (let i = 0; i < 14; i++) ctx.fillRect(22, 70 + i * 18, 150 + ((i * 37) % 60), 6)
  ctx.fillStyle = '#3b82f6'
  ctx.fillRect(150, 260, 80, 70)
})

function Printer() {
  return (
    <group>
      <RoundedBox args={[1.95, 0.6, 1.45]} radius={0.06} smoothness={3} position={[0, 0.3, 0]} material={CM.plasticWhite} castShadow receiveShadow />
      {/* tapa del escáner */}
      <RoundedBox args={[1.95, 0.14, 1.45]} radius={0.04} smoothness={3} position={[0, 0.67, 0]} material={CM.plasticGray} castShadow />
      <mesh position={[0, 0.6, 0.726]} material={CM.slot}>
        <boxGeometry args={[1.9, 0.015, 0.01]} />
      </mesh>
      {/* panel de control con pantallita */}
      <group position={[0.6, 0.48, 0.74]} rotation={[-0.3, 0, 0]}>
        <mesh material={CM.plastic}>
          <boxGeometry args={[0.6, 0.16, 0.03]} />
        </mesh>
        <mesh position={[-0.1, 0, 0.016]}>
          <planeGeometry args={[0.24, 0.1]} />
          <meshStandardMaterial color="#000" emissive="#7dd3fc" emissiveIntensity={0.6} />
        </mesh>
        {[0.1, 0.17, 0.24].map((x, i) => (
          <mesh key={x} position={[x, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]} material={i === 2 ? CM.ledGreen : CM.plasticGray}>
            <cylinderGeometry args={[0.022, 0.022, 0.015, 16]} />
          </mesh>
        ))}
      </group>
      {/* boca de salida y bandeja con una hoja impresa */}
      <mesh position={[-0.15, 0.22, 0.726]} material={CM.slot}>
        <boxGeometry args={[1.3, 0.08, 0.01]} />
      </mesh>
      <mesh position={[-0.15, 0.08, 0.95]} rotation={[0.05, 0, 0]} material={CM.plasticGray} castShadow>
        <boxGeometry args={[1.25, 0.02, 0.5]} />
      </mesh>
      <mesh position={[-0.15, 0.1, 0.9]} rotation={[-Math.PI / 2 + 0.05, 0, 0]}>
        <planeGeometry args={[0.84, 1.0]} />
        <meshStandardMaterial map={PAGE ?? undefined} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* alimentador de hojas atrás */}
      <mesh position={[-0.15, 0.92, -0.72]} rotation={[-0.35, 0, 0]} material={CM.plasticGray}>
        <boxGeometry args={[1.25, 0.6, 0.02]} />
      </mesh>
      <mesh position={[-0.15, 0.95, -0.7]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[0.84, 0.5, 0.03]} />
        <meshStandardMaterial color="#f7f7f3" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Webcam() {
  return (
    <group>
      <RoundedBox args={[0.55, 0.16, 0.16]} radius={0.07} smoothness={4} material={CM.plastic} castShadow />
      <mesh position={[0, 0, 0.081]} material={CM.plasticGloss}>
        <circleGeometry args={[0.07, 32]} />
      </mesh>
      <mesh position={[0, 0, 0.085]}>
        <circleGeometry args={[0.035, 32]} />
        <meshPhysicalMaterial color="#0b1530" roughness={0.02} metalness={0.4} clearcoat={1} />
      </mesh>
      <mesh position={[0.16, 0, 0.081]} material={CM.ledGreen}>
        <circleGeometry args={[0.01, 12]} />
      </mesh>
      {/* gancho que se apoya en el monitor */}
      <mesh position={[0, -0.12, -0.06]} material={CM.plastic}>
        <boxGeometry args={[0.2, 0.08, 0.05]} />
      </mesh>
      <mesh position={[0, -0.13, -0.2]} rotation={[0.2, 0, 0]} material={CM.plastic}>
        <boxGeometry args={[0.2, 0.22, 0.04]} />
      </mesh>
    </group>
  )
}

export function PerifericosModel({ resaltar }: PerifParams) {
  const dim = (id: string) => resaltar !== 'todos' && KIND[id] !== resaltar
  const MW = 4.8
  const MH = (MW * 9) / 16
  const cy = MH / 2 + MW * 0.16
  return (
    <group>
      <Part id="monitor" offset={[0, 1.5, -1]} labelAt={[-MW / 2 + 0.4, cy + MH / 2 + 0.3, -1.6]}>
        <Dim on={dim('monitor')}>
          <group position={[0, 0, -1.6]}>
            <Monitor w={MW} screen={DESKTOP} />
          </group>
        </Dim>
      </Part>
      <Part id="webcam" offset={[0, 1.2, 0]} labelAt={[0, cy + MH / 2 + 0.4, -1.45]}>
        <Dim on={dim('webcam')}>
          <group position={[0, cy + MH / 2 + 0.12, -1.57]} rotation={[-0.06, 0, 0]}>
            <Webcam />
          </group>
        </Dim>
      </Part>
      <Part id="parlantes" offset={[1.2, 0, 0]} labelAt={[3.25, 1.5, -1.3]}>
        <Dim on={dim('parlantes')}>
          {[-3.25, 3.25].map((x) => (
            <group key={x} position={[x, 0, -1.3]} rotation={[0, x > 0 ? -0.25 : 0.25, 0]}>
              <Speaker knob={x > 0} />
            </group>
          ))}
        </Dim>
      </Part>
      <Part id="teclado" offset={[0, 0.6, 1.2]} labelAt={[-1.6, 0.4, 0.8]}>
        <Dim on={dim('teclado')}>
          <group position={[-0.35, 0, 0.85]}>
            <Keyboard />
          </group>
        </Dim>
      </Part>
      <Part id="mouse" offset={[0.8, 0.6, 0.8]} labelAt={[2.65, 0.45, 0.9]}>
        <Dim on={dim('mouse')}>
          <group position={[2.65, 0, 0.95]} rotation={[0, 0.1, 0]}>
            <Mouse />
          </group>
        </Dim>
      </Part>
      <Part id="impresora" offset={[-1.5, 0.4, 0]} labelAt={[-4.7, 1.25, 0.6]}>
        <Dim on={dim('impresora')}>
          <group position={[-4.7, 0, 0.35]} rotation={[0, 0.45, 0]}>
            <Printer />
          </group>
        </Dim>
      </Part>
    </group>
  )
}
