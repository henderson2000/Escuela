import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Part } from '../../Part'
import { useCanvasTexture } from '../../helpers'
import { useKeepRendering } from '../../keepRendering'
import { canvasTex } from './soldaduraShared'
import { Cable, CM, drawTraces, Keyboard, Monitor, Rj45, type V3 } from '../compuShared'

/** Paquete de datos que recorre una poligonal (vuelve a empezar al llegar). */
function Packet({ pts, color, speed = 3, label }: { pts: V3[]; color: string; speed?: number; label?: string }) {
  const ref = useRef<THREE.Group>(null)
  const t = useRef(0)
  const lens = useMemo(() => {
    const out: number[] = []
    for (let i = 0; i < pts.length - 1; i++) out.push(new THREE.Vector3(...pts[i]).distanceTo(new THREE.Vector3(...pts[i + 1])))
    return out
  }, [pts])
  const total = lens.reduce((a, b) => a + b, 0)
  useKeepRendering(true, 40)
  const tex = useCanvasTexture(
    128,
    64,
    (ctx, w, h) => {
      ctx.fillStyle = color
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#0b1018'
      ctx.font = 'bold 34px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(label ?? '', w / 2, 45)
    },
    [label, color],
  )
  useFrame((_, dt) => {
    const g = ref.current
    if (!g || total === 0) return
    t.current = (t.current + Math.min(dt, 0.05) * speed) % (total + 1.2)
    let d = Math.min(t.current, total)
    let k = 0
    while (k < lens.length - 1 && d > lens[k]) d -= lens[k++]
    const a = new THREE.Vector3(...pts[k])
    const b = new THREE.Vector3(...pts[k + 1])
    g.position.copy(a.lerp(b, lens[k] ? d / lens[k] : 0))
  })
  return (
    <group ref={ref} position={pts[0]}>
      <RoundedBox args={[0.62, 0.32, 0.32]} radius={0.06} smoothness={3}>
        <meshStandardMaterial map={tex} emissive={color} emissiveIntensity={0.45} roughness={0.4} />
      </RoundedBox>
      <pointLight color={color} intensity={1.5} distance={1.8} />
    </group>
  )
}

/* ================================================================== Von Neumann */

export interface VonNeumannParams {
  paso: number
  a: number
  b: number
}

export const VN_PASOS = [
  'El programa y los datos están guardados en la MISMA memoria: esa es la idea de Von Neumann.',
  'Entrada → memoria: el usuario escribe el primer número (A) y se guarda en la memoria.',
  'Entrada → memoria: se escribe el segundo número (B).',
  'La unidad de control lee la instrucción SUMAR y lleva A y B a la unidad aritmético-lógica.',
  'La ALU hace la cuenta y el resultado vuelve a la memoria (C).',
  'Memoria → salida: el resultado aparece en el monitor.',
]

export const VN_PARTS = [
  { id: 'uc', name: 'Unidad de control', desc: 'Controla todas las operaciones del sistema: busca cada instrucción en la memoria, la interpreta y ordena qué hacer. Está dentro del procesador, en el mismo chip de silicio que la ALU.' },
  { id: 'alu', name: 'Unidad aritmético-lógica (ALU)', desc: 'Realiza las operaciones aritméticas (sumar, restar…) y lógicas (comparar, Y, O…). También está dentro del procesador.' },
  { id: 'memoria', name: 'Unidad de memoria', desc: 'Guarda los programas y los datos que se usan durante los cálculos. En el modelo de Von Neumann están en la MISMA memoria: acá, cada chip del módulo de RAM es una celda con su dirección.' },
  { id: 'entrada', name: 'Dispositivo de entrada', desc: 'Introduce datos y programas en la memoria (teclado, mouse…). El teclado se conecta por USB.' },
  { id: 'salida', name: 'Dispositivo de salida', desc: 'Muestra los resultados de los cálculos (monitor, impresora…). El monitor se conecta por HDMI.' },
  { id: 'buses', name: 'Buses', desc: 'Los caminos por donde viajan los datos, las direcciones y las órdenes de control entre las partes: son las pistas de cobre de la placa base (y los cables, hacia afuera).' },
]

// placa base (x: -3.5 a 3.5, z: -2.7 a 2.7) apoyada en la mesa (y = -0.6)
const VB = { x: 3.5, z: 2.7, top: -0.42 }
const MEM_Z = -1.55
const CPU_Z = 1.15
const IN_P: V3 = [-5.0, 0.0, 0.7]
const PORT_L: V3 = [-3.45, -0.25, 0.3]
const PORT_R: V3 = [3.45, -0.25, 0.3]
const MEM_P: V3 = [0, -0.25, MEM_Z + 0.35]
const CPU_P: V3 = [0, -0.1, CPU_Z - 0.4]
const OUT_P: V3 = [5.4, 0.55, -0.15]
const BUS_L: V3 = [-2.7, -0.25, -0.9]
const BUS_R: V3 = [2.7, -0.25, -0.9]

/** Celdas de la memoria: arriba el programa, abajo los datos. */
function memCells(a: number, b: number, paso: number) {
  const c = a + b
  const pc = paso === 0 ? -1 : paso <= 2 ? paso - 1 : paso <= 4 ? 2 : 3
  return [
    { addr: '0', txt: 'LEER A', hot: pc === 0 },
    { addr: '1', txt: 'LEER B', hot: pc === 1 },
    { addr: '2', txt: 'SUMAR', sub: 'A+B → C', hot: pc === 2 },
    { addr: '3', txt: 'MOSTRAR C', hot: pc === 3 },
    { addr: '4', txt: `A = ${paso >= 1 ? a : '?'}`, hot: paso === 1, data: true },
    { addr: '5', txt: `B = ${paso >= 2 ? b : '?'}`, hot: paso === 2, data: true },
    { addr: '6', txt: `C = ${paso >= 4 ? c : '?'}`, hot: paso === 4, data: true },
    { addr: '7', txt: '—', hot: false, data: true },
  ]
}

function MemChip({ addr, txt, sub, hot, data }: { addr: string; txt: string; sub?: string; hot: boolean; data?: boolean }) {
  const tex = useCanvasTexture(
    256,
    200,
    (ctx, w, h) => {
      ctx.fillStyle = hot ? '#2a1f05' : '#141518'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = hot ? '#fbbf24' : 'rgba(160,166,176,0.35)'
      ctx.lineWidth = hot ? 8 : 3
      ctx.strokeRect(6, 6, w - 12, h - 12)
      ctx.fillStyle = data ? '#7dd3fc' : '#c4b5fd'
      ctx.font = 'bold 30px ui-monospace, monospace'
      ctx.fillText(`#${addr}`, 20, 44)
      ctx.fillStyle = hot ? '#fde68a' : '#eef0f3'
      ctx.textAlign = 'center'
      const f = txt.length > 7 ? 38 : 50
      ctx.font = `bold ${f}px ui-monospace, monospace`
      ctx.fillText(txt, w / 2, sub ? 112 : 130)
      if (sub) {
        ctx.font = 'bold 30px ui-monospace, monospace'
        ctx.fillText(sub, w / 2, 160)
      }
    },
    [addr, txt, sub, hot, data],
  )
  return (
    <group>
      <mesh material={CM.chip} castShadow>
        <boxGeometry args={[1.0, 0.78, 0.08]} />
      </mesh>
      <mesh position={[0, 0, 0.041]}>
        <planeGeometry args={[0.98, 0.76]} />
        <meshStandardMaterial map={tex} roughness={0.45} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={hot ? 0.6 : 0.25} />
      </mesh>
    </group>
  )
}

const RAM_PCB = canvasTex(1024, 560, (ctx, w, h) => {
  ctx.fillStyle = '#1d4a35'
  ctx.fillRect(0, 0, w, h)
  drawTraces(ctx, w, h, 30, 8, 'rgba(120,170,110,0.4)')
  ctx.fillStyle = '#e8efe9'
  ctx.font = 'bold 30px system-ui'
  ctx.fillText('MEMORIA RAM · programa y datos juntos', 30, 44)
  ctx.font = 'bold 24px system-ui'
  ctx.fillStyle = '#c4b5fd'
  ctx.fillText('PROGRAMA (instrucciones)', 30, 92)
  ctx.fillStyle = '#7dd3fc'
  ctx.fillText('DATOS', 30, 300)
})

const BOARD_TEX = canvasTex(1400, 1080, (ctx, w, h) => {
  // la placa ocupa x -3.5..3.5 y z -2.7..2.7 → 200 px por unidad
  const S = 200
  const P = (x: number, z: number): [number, number] => [(x + 3.5) * S, (z + 2.7) * S]
  ctx.fillStyle = '#173b2b'
  ctx.fillRect(0, 0, w, h)
  drawTraces(ctx, w, h, 90, 21, 'rgba(110,160,100,0.35)')
  // buses: haces de 8 pistas de cobre entre la entrada, la memoria, el procesador y la salida
  const bus = (pts: [number, number][], label?: string) => {
    for (let k = -3.5; k <= 3.5; k++) {
      ctx.strokeStyle = 'rgba(214,170,90,0.95)'
      ctx.lineWidth = 4
      ctx.beginPath()
      pts.forEach(([x, z], i) => {
        const [px, py] = P(x, z)
        const off = k * 9
        const horiz = i < pts.length - 1 ? Math.abs(pts[i + 1][0] - x) > Math.abs(pts[i + 1][1] - z) : Math.abs(x - pts[i - 1][0]) > Math.abs(z - pts[i - 1][1])
        const qx = px + (horiz ? 0 : off)
        const qy = py + (horiz ? off : 0)
        if (i === 0) ctx.moveTo(qx, qy)
        else ctx.lineTo(qx, qy)
      })
      ctx.stroke()
    }
    if (label) {
      const [x, z] = pts[1]
      const [px, py] = P(x, z)
      ctx.fillStyle = '#f2f5f2'
      ctx.font = 'bold 28px system-ui'
      ctx.fillText(label, px + 20, py - 30)
    }
  }
  bus(
    [
      [-3.5, 0.3],
      [-2.7, 0.3],
      [-2.7, -0.9],
      [-0.4, -0.9],
    ],
    'BUS DE DATOS',
  )
  bus([
    [0.4, -0.9],
    [2.7, -0.9],
    [2.7, 0.3],
    [3.5, 0.3],
  ])
  bus(
    [
      [-0.35, MEM_Z + 0.2],
      [-0.35, CPU_Z - 0.9],
    ],
    '',
  )
  bus([
    [0.35, MEM_Z + 0.2],
    [0.35, CPU_Z - 0.9],
  ])
  ctx.fillStyle = '#f2f5f2'
  ctx.font = 'bold 26px system-ui'
  const [lx, ly] = P(0.6, 0.0)
  ctx.fillText('BUS DE DIRECCIONES Y CONTROL', lx, ly)
  // agujeros de montaje
  for (const [x, z] of [
    [-3.3, -2.5],
    [3.3, -2.5],
    [-3.3, 2.5],
    [3.3, 2.5],
  ]) {
    const [px, py] = P(x, z)
    ctx.fillStyle = '#c9a25c'
    ctx.beginPath()
    ctx.arc(px, py, 18, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#0c0d0f'
    ctx.beginPath()
    ctx.arc(px, py, 9, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = '#f2f5f2'
  ctx.font = 'bold 30px system-ui'
  const [tx, ty] = P(-3.3, 2.55)
  ctx.fillText('PLACA BASE · ITS VILLADA', tx + 40, ty)
})
if (BOARD_TEX) BOARD_TEX.wrapS = BOARD_TEX.wrapT = THREE.ClampToEdgeWrapping

/** Pastilla de silicio (die) del procesador, con su texto: se ilumina cuando trabaja. */
function Die({ title, lines, on, color }: { title: string; lines: string[]; on: boolean; color: string }) {
  const tex = useCanvasTexture(
    512,
    400,
    (ctx, w, h) => {
      ctx.fillStyle = '#16183a'
      ctx.fillRect(0, 0, w, h)
      // bloques funcionales del chip (como se ven en una foto del silicio)
      for (let i = 0; i < 70; i++) {
        const x = (i * 97) % w
        const y = ((i * 53) % h) * 0.95
        ctx.fillStyle = `rgba(${90 + ((i * 31) % 80)},${80 + ((i * 17) % 60)},${160 + ((i * 13) % 80)},0.12)`
        ctx.fillRect(x, y, 40 + ((i * 7) % 80), 20 + ((i * 11) % 50))
      }
      ctx.strokeStyle = 'rgba(200,190,255,0.08)'
      for (let x = 0; x < w; x += 8) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }
      ctx.fillStyle = on ? color : '#e5e7eb'
      ctx.textAlign = 'center'
      ctx.font = 'bold 56px system-ui'
      ctx.fillText(title, w / 2, 110)
      ctx.font = 'bold 84px ui-monospace, monospace'
      lines.forEach((l, i) => ctx.fillText(l, w / 2, 250 + i * 90))
    },
    [title, lines.join('|'), on, color],
  )
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[1.85, 0.05, 1.45]} />
        <meshStandardMaterial color="#2a2c45" metalness={0.6} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.026, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.8, 1.4]} />
        <meshStandardMaterial map={tex} roughness={0.2} metalness={0.3} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={on ? 0.7 : 0.3} />
      </mesh>
    </group>
  )
}

export function VonNeumannModel({ paso, a, b }: VonNeumannParams) {
  const c = a + b
  const cells = memCells(a, b, paso)
  const route: Record<number, { pts: V3[]; color: string; label: string }> = {
    1: { pts: [IN_P, PORT_L, [-2.7, -0.25, 0.3], BUS_L, MEM_P], color: '#fbbf24', label: String(a) },
    2: { pts: [IN_P, PORT_L, [-2.7, -0.25, 0.3], BUS_L, MEM_P], color: '#fbbf24', label: String(b) },
    3: { pts: [MEM_P, CPU_P], color: '#60a5fa', label: `${a},${b}` },
    4: { pts: [CPU_P, MEM_P], color: '#4ade80', label: String(c) },
    5: { pts: [MEM_P, BUS_R, [2.7, -0.25, 0.3], PORT_R, OUT_P], color: '#4ade80', label: String(c) },
  }
  const r = route[paso]
  const screen = useCanvasTexture(
    512,
    288,
    (ctx, w, h) => {
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#64748b'
      ctx.font = '22px ui-monospace, monospace'
      ctx.fillText('> programa: sumar', 20, 40)
      ctx.fillStyle = '#4ade80'
      ctx.font = 'bold 120px ui-monospace, monospace'
      ctx.textAlign = 'center'
      ctx.fillText(paso >= 5 ? String(c) : '_', w / 2, 200)
    },
    [paso, c],
  )
  return (
    <group>
      <Part id="buses" offset={[0, -0.8, 0]} labelAt={[-2.7, -0.2, -0.55]}>
        {/* placa base con las pistas de los buses */}
        <mesh position={[0, VB.top - 0.04, 0]} material={CM.pcbGreen} castShadow receiveShadow>
          <boxGeometry args={[VB.x * 2, 0.08, VB.z * 2]} />
        </mesh>
        <mesh position={[0, VB.top + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[VB.x * 2, VB.z * 2]} />
          <meshStandardMaterial map={BOARD_TEX ?? undefined} roughness={0.42} metalness={0.25} />
        </mesh>
        {/* separadores que la levantan de la mesa */}
        {[-1, 1].map((sx) =>
          [-1, 1].map((sz) => (
            <mesh key={`${sx}${sz}`} position={[sx * 3.3, -0.53, sz * 2.5]} material={CM.nickel}>
              <cylinderGeometry args={[0.07, 0.07, 0.14, 6]} />
            </mesh>
          )),
        )}
        {/* puertos USB (teclado) y HDMI (monitor) en los bordes */}
        <mesh position={[PORT_L[0] - 0.05, VB.top + 0.12, PORT_L[2]]} material={CM.steel}>
          <boxGeometry args={[0.3, 0.22, 0.4]} />
        </mesh>
        <mesh position={[PORT_R[0] + 0.05, VB.top + 0.1, PORT_R[2]]} material={CM.steel}>
          <boxGeometry args={[0.3, 0.18, 0.5]} />
        </mesh>
        {/* zócalo del procesador y ranura de la memoria */}
        <mesh position={[0, VB.top + 0.03, CPU_Z]} material={CM.steel}>
          <boxGeometry args={[4.6, 0.06, 2.3]} />
        </mesh>
        <mesh position={[0, VB.top + 0.12, MEM_Z]} material={CM.slot}>
          <boxGeometry args={[4.9, 0.24, 0.22]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 2.55, VB.top + 0.22, MEM_Z]} material={CM.slot}>
            <boxGeometry args={[0.2, 0.42, 0.26]} />
          </mesh>
        ))}
        {/* cables: USB del teclado y HDMI al monitor */}
        <Cable r={0.05} pts={[[-5.0, -0.55, 0.15], [-4.4, -0.55, 0.0], [-3.9, -0.4, 0.3], [PORT_L[0] - 0.2, VB.top + 0.12, PORT_L[2]]]} />
        <Cable r={0.06} pts={[[PORT_R[0] + 0.2, VB.top + 0.1, PORT_R[2]], [4.1, -0.5, 0.2], [4.9, -0.55, -0.4], [5.4, 0.2, -0.55], [5.4, 0.9, -0.5]]} />
      </Part>

      <Part id="memoria" offset={[0, 0.6, -1.6]} labelAt={[0, 2.35, MEM_Z]}>
        <group position={[0, VB.top + 0.25 + 1.25, MEM_Z]}>
          {/* módulo de RAM parado en su ranura (agrandado para poder leer las celdas) */}
          <mesh material={CM.pcbGreen} castShadow>
            <boxGeometry args={[4.8, 2.5, 0.04]} />
          </mesh>
          <mesh position={[0, 0, 0.021]}>
            <planeGeometry args={[4.8, 2.5]} />
            <meshStandardMaterial map={RAM_PCB ?? undefined} roughness={0.45} />
          </mesh>
          {/* contactos dorados */}
          <mesh position={[0, -1.18, 0.022]} material={CM.gold}>
            <boxGeometry args={[4.6, 0.14, 0.005]} />
          </mesh>
          {cells.map((cell, i) => (
            <group key={i} position={[-1.68 + (i % 4) * 1.12, i < 4 ? 0.45 : -0.6, 0.06]}>
              <MemChip {...cell} />
            </group>
          ))}
        </group>
      </Part>

      <group position={[0, VB.top + 0.06, CPU_Z]}>
        {/* procesador: sustrato verde con dos pastillas de silicio a la vista */}
        <mesh position={[0, 0.03, 0]} material={CM.pcbGreen} castShadow>
          <boxGeometry args={[4.3, 0.06, 2.0]} />
        </mesh>
        {Array.from({ length: 14 }, (_, i) => (
          <mesh key={i} position={[-1.9 + (i % 7) * 0.63, 0.07, i < 7 ? -0.88 : 0.88]} material={CM.gold}>
            <boxGeometry args={[0.12, 0.03, 0.06]} />
          </mesh>
        ))}
        <Part id="uc" offset={[-0.8, 1.2, 0.6]} labelAt={[-1.05, 0.5, 0.2]}>
          <group position={[-1.05, 0.085, 0]}>
            <Die title="U. CONTROL" lines={[paso === 3 ? 'SUMAR' : paso >= 1 && paso <= 2 ? 'LEER' : paso === 5 ? 'MOSTRAR' : '—']} on={paso >= 1 && paso !== 4} color="#93c5fd" />
          </group>
        </Part>
        <Part id="alu" offset={[0.8, 1.2, 0.6]} labelAt={[1.05, 0.5, 0.2]}>
          <group position={[1.05, 0.085, 0]}>
            <Die title="ALU" lines={[paso >= 4 ? `${a}+${b}=${c}` : paso === 3 ? `${a} + ${b}` : '—']} on={paso === 3 || paso === 4} color="#86efac" />
          </group>
        </Part>
      </group>

      <Part id="entrada" offset={[-1.5, 0, 0]} labelAt={[-5.3, 0.1, 1.2]}>
        <group position={[-5.3, -0.6, 1.0]} rotation={[0, 0.12, 0]} scale={0.6}>
          <Keyboard hot={paso === 1 || paso === 2} />
        </group>
      </Part>
      <Part id="salida" offset={[1.5, 0, 0]} labelAt={[5.4, 2.55, -0.2]}>
        <group position={[5.4, -0.6, -0.2]} rotation={[0, -0.25, 0]}>
          <Monitor w={2.9} screen={screen} />
        </group>
      </Part>
      {r && <Packet key={paso} pts={r.pts} color={r.color} label={r.label} speed={3.5} />}
    </group>
  )
}

/* ================================================================== red */

export type Topologia = 'estrella' | 'bus' | 'anillo'

export interface RedParams {
  topologia: Topologia
  desde: number
  hasta: number
}

export const NODOS = ['PC 1', 'PC 2', 'PC 3', 'Impresora', 'Servidor']

export const RED_PARTS = [
  { id: 'nodos', name: 'Nodos', desc: 'Computadoras, servidores, impresoras o cualquier dispositivo conectado. Cada uno tiene una dirección IP única. Algunos son clientes (piden servicios) y otros servidores (los dan).' },
  { id: 'enlaces', name: 'Enlaces', desc: 'Las conexiones entre nodos: cables de cobre (UTP con fichas RJ45, o coaxial en las redes en bus antiguas), fibra óptica o inalámbricas (Wi-Fi). Su calidad y velocidad definen qué tan rápida es la red.' },
  { id: 'switch', name: 'Switch (concentrador)', desc: 'En la topología de estrella, todos los nodos se conectan a este equipo central, que reenvía cada paquete sólo al destinatario. Cada boca tiene una luz que titila cuando pasan datos.' },
  { id: 'paquete', name: 'Paquete de datos', desc: 'La información viaja dividida en paquetes, con la dirección de origen y de destino. Los protocolos (como TCP/IP) fijan las reglas.' },
]

function nodePos(topo: Topologia, k: number): V3 {
  if (topo === 'bus') return [-5 + k * 2.5, 0, k % 2 ? 1.9 : -1.9]
  const a = (k / NODOS.length) * Math.PI * 2 - Math.PI / 2
  const R = 4
  return [Math.cos(a) * R, 0, Math.sin(a) * R]
}

function routeOf(topo: Topologia, from: number, to: number): V3[] {
  const y = 0.35
  const p = (k: number): V3 => {
    const [x, , z] = nodePos(topo, k)
    return [x, y, z]
  }
  if (topo === 'estrella') return [p(from), [0, y, 0], p(to)]
  if (topo === 'bus') {
    const [fx, , fz] = p(from)
    const [tx, , tz] = p(to)
    return [
      [fx, y, fz],
      [fx, y, 0],
      [tx, y, 0],
      [tx, y, tz],
    ]
  }
  // anillo: siempre en el mismo sentido
  const out: V3[] = [p(from)]
  let k = from
  while (k !== to) {
    k = (k + 1) % NODOS.length
    out.push(p(k))
  }
  return out
}

const SIGN = (text: string, sub: string, accent: string) =>
  canvasTex(256, 96, (ctx, w, h) => {
    ctx.fillStyle = '#f4f5f7'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = accent
    ctx.fillRect(0, 0, 10, h)
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 36px system-ui'
    ctx.fillText(text, 24, 44)
    ctx.font = '24px ui-monospace, monospace'
    ctx.fillStyle = '#334155'
    ctx.fillText(sub, 24, 80)
  })

/** Puesto de trabajo: monitor chico con su nombre e IP y la torre al lado. */
function Workstation({ label, role }: { label: string; role: 'origen' | 'destino' | null }) {
  const ip = `192.168.0.${10 + NODOS.indexOf(label)}`
  const tex = useCanvasTexture(
    384,
    216,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h)
      g.addColorStop(0, '#0f2a4a')
      g.addColorStop(1, '#1e1b4b')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      if (role) {
        ctx.strokeStyle = role === 'origen' ? '#f59e0b' : '#22c55e'
        ctx.lineWidth = 14
        ctx.strokeRect(7, 7, w - 14, h - 14)
      }
      ctx.fillStyle = '#f1f5f9'
      ctx.font = 'bold 56px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(label, w / 2, 92)
      ctx.font = '34px ui-monospace, monospace'
      ctx.fillStyle = '#7dd3fc'
      ctx.fillText(ip, w / 2, 148)
      if (role) {
        ctx.font = 'bold 26px system-ui'
        ctx.fillStyle = role === 'origen' ? '#fbbf24' : '#4ade80'
        ctx.fillText(role.toUpperCase(), w / 2, 192)
      }
    },
    [label, role],
  )
  return (
    <group>
      <Monitor w={1.55} screen={tex} glow={0.95} />
      {/* torre */}
      <group position={[1.05, 0, -0.2]}>
        <RoundedBox args={[0.42, 1.0, 0.9]} radius={0.03} smoothness={2} position={[0, 0.52, 0]} material={CM.chassis} castShadow />
        <mesh position={[0, 0.92, 0.452]} material={CM.ledBlue}>
          <circleGeometry args={[0.03, 16]} />
        </mesh>
      </group>
      {/* teclado */}
      <group position={[0, 0, 0.55]} scale={0.32}>
        <Keyboard />
      </group>
    </group>
  )
}

const PRINTER_SIGN = SIGN('Impresora', '192.168.0.13', '#64748b')
const SERVER_SIGN = SIGN('Servidor', '192.168.0.14', '#64748b')

function LaserPrinter() {
  return (
    <group>
      <RoundedBox args={[1.25, 0.85, 1.15]} radius={0.06} smoothness={3} position={[0, 0.43, 0]} material={CM.plasticWhite} castShadow />
      <mesh position={[0, 0.86, -0.1]} rotation={[-0.08, 0, 0]} material={CM.plasticGray}>
        <boxGeometry args={[0.9, 0.04, 0.6]} />
      </mesh>
      <mesh position={[0.4, 0.68, 0.581]} material={CM.plastic}>
        <boxGeometry args={[0.3, 0.12, 0.01]} />
      </mesh>
      <mesh position={[0, 0.15, 0.62]} material={CM.plasticGray}>
        <boxGeometry args={[1.0, 0.18, 0.1]} />
      </mesh>
      <mesh position={[-0.15, 0.55, 0.581]}>
        <planeGeometry args={[0.6, 0.22]} />
        <meshStandardMaterial map={PRINTER_SIGN ?? undefined} roughness={0.5} />
      </mesh>
    </group>
  )
}

function Server() {
  return (
    <group>
      <RoundedBox args={[0.75, 1.7, 1.3]} radius={0.04} smoothness={2} position={[0, 0.85, 0]} material={CM.chassis} castShadow />
      {/* bahías de discos con sus luces */}
      {Array.from({ length: 6 }, (_, i) => (
        <group key={i} position={[0, 1.42 - i * 0.16, 0.655]}>
          <mesh material={CM.aluDark}>
            <boxGeometry args={[0.6, 0.13, 0.02]} />
          </mesh>
          <mesh position={[0.24, 0, 0.012]} material={i % 3 === 0 ? CM.ledAmber : CM.ledGreen}>
            <boxGeometry args={[0.04, 0.03, 0.005]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.4, 0.652]}>
        <planeGeometry args={[0.62, 0.23]} />
        <meshStandardMaterial map={SERVER_SIGN ?? undefined} roughness={0.5} />
      </mesh>
    </group>
  )
}

const SWITCH_LABEL = canvasTex(512, 64, (ctx, w, h) => {
  ctx.fillStyle = '#2a2d33'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#e5e7eb'
  ctx.font = 'bold 30px system-ui'
  ctx.fillText('SWITCH 8 bocas · 10/100/1000', 16, 42)
})

export function RedModel({ topologia, desde, hasta }: RedParams) {
  const pos = NODOS.map((_, k) => nodePos(topologia, k))
  const same = desde === hasta
  // dónde sale el cable de cada nodo (atrás, a nivel del piso)
  const jack = (k: number): V3 => [pos[k][0] + 0.75, 0.05, pos[k][2] - 0.55]
  const portX = (k: number) => -0.56 + k * 0.16
  const cables: { pts: V3[]; color: string; plugs?: boolean; r?: number }[] = []
  if (topologia === 'estrella')
    pos.forEach((_, k) => {
      const [x, , z] = jack(k)
      cables.push({ pts: [[x, 0.05, z], [x * 0.55, 0.03, z * 0.55 + 0.5], [portX(k), 0.03, 0.95], [portX(k), 0.2, 0.62]], color: '#2f6fd6', plugs: true })
    })
  else if (topologia === 'bus') {
    cables.push({ pts: [[-6.2, 0.06, 0], [6.2, 0.06, 0]], color: '#111', r: 0.06 })
    pos.forEach((_, k) => {
      const [x, , z] = jack(k)
      cables.push({ pts: [[x, 0.05, z], [pos[k][0], 0.05, z * 0.5], [pos[k][0], 0.06, 0]], color: '#111', r: 0.04 })
    })
  } else
    pos.forEach((_, k) => {
      const n = (k + 1) % pos.length
      const [ax, , az] = jack(k)
      const [bx, , bz] = jack(n)
      cables.push({ pts: [[ax, 0.05, az], [(ax + bx) / 2 * 0.92, 0.03, (az + bz) / 2 * 0.92], [bx - 0.3, 0.05, bz]], color: '#f97316', plugs: true })
    })
  const cableMats = useMemo(() => ({ '#2f6fd6': new THREE.MeshStandardMaterial({ color: '#2f6fd6', roughness: 0.45 }), '#111': new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.6 }), '#f97316': new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.45 }) }) as Record<string, THREE.Material>, [])
  return (
    <group>
      <Part id="enlaces" offset={[0, -0.6, 0]} labelAt={topologia === 'bus' ? [-5.8, 0.4, 0] : [2.3, 0.4, -2.6]}>
        {cables.map((c, i) => (
          <Cable key={`${topologia}-${i}`} pts={c.pts} r={c.r ?? 0.035} material={cableMats[c.color]} />
        ))}
        {topologia === 'bus' && (
          <>
            {/* conectores en T y terminadores de 50 Ω de la red coaxial */}
            {pos.map((p, k) => (
              <mesh key={k} position={[p[0], 0.06, 0]} rotation={[0, 0, Math.PI / 2]} material={CM.nickel}>
                <cylinderGeometry args={[0.08, 0.08, 0.3, 16]} />
              </mesh>
            ))}
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 6.25, 0.06, 0]} rotation={[0, 0, Math.PI / 2]} material={CM.gold}>
                <cylinderGeometry args={[0.09, 0.09, 0.18, 16]} />
              </mesh>
            ))}
          </>
        )}
        {topologia === 'anillo' &&
          pos.map((_, k) => {
            const [x, , z] = jack(k)
            return (
              <group key={k} position={[x, 0.08, z]} rotation={[0, -Math.PI / 2, 0]} scale={1.2}>
                <Rj45 color="#f97316" />
              </group>
            )
          })}
        <mesh position={[0, -0.1, 0]} receiveShadow>
          <cylinderGeometry args={[7.2, 7.2, 0.1, 64]} />
          <meshStandardMaterial color="#2a2f38" roughness={0.92} />
        </mesh>
      </Part>
      <Part id="nodos" offset={[0, 1, 0]} labelAt={[pos[0][0], 2.0, pos[0][2]]}>
        {pos.map((p, k) => {
          const role = k === desde && !same ? 'origen' : k === hasta && !same ? 'destino' : null
          return (
            <group key={k} position={p}>
              {/* aro de color en el piso: origen (naranja) y destino (verde) */}
              {role && (
                <mesh position={[0.3, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[1.05, 1.2, 48]} />
                  <meshBasicMaterial color={role === 'origen' ? '#f59e0b' : '#22c55e'} toneMapped={false} />
                </mesh>
              )}
              {k < 3 ? <Workstation label={NODOS[k]} role={role} /> : k === 3 ? <LaserPrinter /> : <Server />}
            </group>
          )
        })}
      </Part>
      {topologia === 'estrella' && (
        <Part id="switch" offset={[0, 1.2, 0]} labelAt={[0, 0.7, 0]}>
          <group position={[0, 0.17, 0]}>
            <RoundedBox args={[1.6, 0.3, 0.9]} radius={0.03} smoothness={2} material={CM.aluDark} castShadow />
            <mesh position={[0, 0.151, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.4, 0.18]} />
              <meshStandardMaterial map={SWITCH_LABEL ?? undefined} roughness={0.5} />
            </mesh>
            {Array.from({ length: 8 }, (_, k) => (
              <group key={k} position={[portX(k), 0.0, 0.451]}>
                <mesh material={CM.slot}>
                  <boxGeometry args={[0.13, 0.12, 0.01]} />
                </mesh>
                <mesh position={[0, 0.09, 0]} material={k < 5 ? CM.ledGreen : CM.plastic}>
                  <boxGeometry args={[0.035, 0.025, 0.006]} />
                </mesh>
              </group>
            ))}
          </group>
          {pos.map((_, k) => (
            <group key={k} position={[portX(k), 0.18, 0.66]} scale={1}>
              <Rj45 />
            </group>
          ))}
        </Part>
      )}
      {!same && (
        <Part id="paquete" offset={[0, 1.5, 0]} labelAt={[0, 1.2, 0]}>
          <Packet key={`${topologia}-${desde}-${hasta}`} pts={routeOf(topologia, desde, hasta)} color="#facc15" label="IP" speed={3} />
        </Part>
      )}
    </group>
  )
}

/* ================================================================== pantalla */

export interface PantallaParams {
  resolucion: number
  zoom: boolean
}

export const PANTALLA_PARTS = [
  { id: 'pixeles', name: 'Píxeles', desc: 'Cada cuadradito es un píxel: el ladrillo más pequeño de una imagen digital. Muestra un solo color.' },
  { id: 'subpixeles', name: 'Subpíxeles R, G, B', desc: 'Cada píxel de la pantalla tiene tres luces: roja, verde y azul. Mezclándolas con distinta intensidad se forman todos los colores.' },
  { id: 'marco', name: 'Marco de la pantalla', desc: 'El monitor con su marco, su pie y la electrónica atrás. La cantidad de píxeles a lo ancho y a lo alto es la resolución.' },
]

/** Carita sonriente que se dibuja a cualquier resolución. */
function colorAt(u: number, v: number): [number, number, number] {
  const dx = u - 0.5
  const dy = v - 0.5
  const r = Math.hypot(dx, dy)
  if (r > 0.47) return [0.05, 0.25, 0.55]
  if (r > 0.42) return [0.55, 0.35, 0.0]
  const eye = (ex: number) => Math.hypot(u - ex, v - 0.36) < 0.07
  if (eye(0.36) || eye(0.64)) return [0.1, 0.08, 0.05]
  if (Math.abs(r - 0.25) < 0.045 && v > 0.55) return [0.75, 0.1, 0.1]
  return [1, 0.82, 0.1]
}

export function PantallaModel({ resolucion, zoom }: PantallaParams) {
  const n = resolucion
  const size = 6
  const cell = size / n
  const pix = useRef<THREE.InstancedMesh>(null)
  const subs = useRef<THREE.InstancedMesh>(null)
  const invalidate = useThree((st) => st.invalidate)
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const c = new THREE.Color()
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const k = y * n + x
        const [r, g, b] = colorAt((x + 0.5) / n, (y + 0.5) / n)
        const px = -size / 2 + (x + 0.5) * cell
        const py = size / 2 - (y + 0.5) * cell
        if (pix.current) {
          m.makeScale(cell * 0.92, cell * 0.92, 1).setPosition(px, py, 0)
          pix.current.setMatrixAt(k, m)
          pix.current.setColorAt(k, c.setRGB(r, g, b, THREE.SRGBColorSpace))
        }
        if (subs.current)
          [r, g, b].forEach((val, j) => {
            m.makeScale(cell * 0.26, cell * 0.8, 1).setPosition(px + (j - 1) * cell * 0.31, py, 0.02)
            subs.current!.setMatrixAt(k * 3 + j, m)
            const base = j === 0 ? [1, 0, 0] : j === 1 ? [0, 1, 0] : [0, 0, 1]
            subs.current!.setColorAt(k * 3 + j, c.setRGB(base[0] * (0.06 + val), base[1] * (0.06 + val), base[2] * (0.06 + val)))
          })
      }
    if (pix.current) {
      pix.current.instanceMatrix.needsUpdate = true
      if (pix.current.instanceColor) pix.current.instanceColor.needsUpdate = true
    }
    if (subs.current) {
      subs.current.instanceMatrix.needsUpdate = true
      if (subs.current.instanceColor) subs.current.instanceColor.needsUpdate = true
    }
    invalidate()
  }, [n, cell, zoom, invalidate])
  const bez = 0.12
  const chin = 0.42
  return (
    <group position={[0, 3.4, 0]}>
      <Part id="marco" offset={[0, 0, -1.5]} labelAt={[-3.4, 3.4, 0.2]}>
        {/* marco fino y mentón con el LED */}
        <RoundedBox args={[size + bez * 2, size + bez + chin, 0.28]} radius={0.05} smoothness={3} position={[0, -(chin - bez) / 2, -0.17]} material={CM.plastic} castShadow />
        <mesh position={[0, 0, -0.025]}>
          <planeGeometry args={[size, size]} />
          <meshBasicMaterial color="#030405" />
        </mesh>
        <mesh position={[size / 2 - 0.3, -size / 2 - chin / 2, -0.025]} material={CM.ledBlue}>
          <circleGeometry args={[0.03, 16]} />
        </mesh>
        {/* carcasa trasera, cuello y pie */}
        <RoundedBox args={[size * 0.6, size * 0.55, 0.45]} radius={0.2} smoothness={4} position={[0, -0.3, -0.5]} material={CM.plastic} castShadow />
        <RoundedBox args={[0.55, 3.4, 0.16]} radius={0.06} smoothness={3} position={[0, -2.1, -0.8]} rotation={[0.05, 0, 0]} material={CM.aluDark} castShadow />
        <mesh position={[0, -3.75, -0.6]} scale={[1, 1, 0.6]} material={CM.aluDark} castShadow receiveShadow>
          <cylinderGeometry args={[1.5, 1.6, 0.1, 48]} />
        </mesh>
      </Part>
      {!zoom ? (
        <Part id="pixeles" offset={[0, 0, 1]} labelAt={[size / 2 - cell / 2, size / 2 - cell / 2, 0.2]}>
          <instancedMesh key={`p${n}`} ref={pix} args={[undefined, undefined, n * n]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial toneMapped={false} />
          </instancedMesh>
        </Part>
      ) : (
        <Part id="subpixeles" offset={[0, 0, 1]} labelAt={[size / 2 - cell / 2, size / 2 - cell / 2, 0.2]}>
          <instancedMesh key={`s${n}`} ref={subs} args={[undefined, undefined, n * n * 3]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial toneMapped={false} />
          </instancedMesh>
        </Part>
      )}
    </group>
  )
}
