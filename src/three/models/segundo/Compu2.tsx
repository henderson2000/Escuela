import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Part } from '../../Part'
import { useCanvasTexture } from '../../helpers'
import { useKeepRendering } from '../../keepRendering'

type V3 = [number, number, number]

function Tube({ pts, color = '#475569', r = 0.08 }: { pts: V3[]; color?: string; r?: number }) {
  const geo = useMemo(() => {
    const path = new THREE.CurvePath<THREE.Vector3>()
    for (let i = 0; i < pts.length - 1; i++) path.add(new THREE.LineCurve3(new THREE.Vector3(...pts[i]), new THREE.Vector3(...pts[i + 1])))
    return new THREE.TubeGeometry(path, pts.length * 8, r, 8, false)
  }, [pts, r])
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
    </mesh>
  )
}

/** Paquete que recorre una poligonal (vuelve a empezar al llegar). */
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
      <mesh>
        <boxGeometry args={[0.7, 0.35, 0.35]} />
        <meshStandardMaterial map={tex} emissive={color} emissiveIntensity={0.35} />
      </mesh>
    </group>
  )
}

function Block({ size, color, title, lines }: { size: V3; color: string; title: string; lines: string[] }) {
  const H = Math.round((512 * size[1]) / size[0])
  const tex = useCanvasTexture(
    512,
    H,
    (ctx, w, h) => {
      ctx.fillStyle = color
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 50px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(title, w / 2, 62)
      const step = Math.min(46, (h - 100) / Math.max(1, lines.length))
      ctx.font = `${Math.round(step * 0.78)}px ui-monospace, monospace`
      lines.forEach((l, i) => ctx.fillText(l, w / 2, 100 + step * 0.7 + i * step))
    },
    [color, title, lines.join('|'), H],
  )
  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, size[2] / 2 + 0.005]}>
        <planeGeometry args={[size[0] * 0.96, size[1] * 0.94]} />
        <meshStandardMaterial map={tex} roughness={0.6} />
      </mesh>
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
  { id: 'uc', name: 'Unidad de control', desc: 'Controla todas las operaciones del sistema: busca cada instrucción en la memoria, la interpreta y ordena qué hacer.' },
  { id: 'alu', name: 'Unidad aritmético-lógica (ALU)', desc: 'Realiza las operaciones aritméticas (sumar, restar…) y lógicas (comparar, Y, O…).' },
  { id: 'memoria', name: 'Unidad de memoria', desc: 'Guarda los programas y los datos que se usan durante los cálculos. En el modelo de Von Neumann están en la MISMA memoria.' },
  { id: 'entrada', name: 'Dispositivo de entrada', desc: 'Introduce datos y programas en la memoria (teclado, mouse…).' },
  { id: 'salida', name: 'Dispositivo de salida', desc: 'Muestra los resultados de los cálculos (monitor, impresora…).' },
  { id: 'buses', name: 'Buses', desc: 'Los caminos por donde viajan los datos, las direcciones y las órdenes de control entre las partes.' },
]

export function VonNeumannModel({ paso, a, b }: VonNeumannParams) {
  const c = a + b
  const mem = [
    '0: LEER A',
    '1: LEER B',
    '2: SUMAR A+B→C',
    '3: MOSTRAR C',
    `A = ${paso >= 1 ? a : '?'}`,
    `B = ${paso >= 2 ? b : '?'}`,
    `C = ${paso >= 4 ? c : '?'}`,
  ]
  const IN: V3 = [-5.2, 0.3, 0]
  const MEM: V3 = [0, 0.3, -1.75]
  const CPU: V3 = [0, 0.3, 2.4]
  const OUT: V3 = [5.2, 0.3, 0]
  const route: Record<number, { pts: V3[]; color: string; label: string }> = {
    1: { pts: [IN, [-5.2, 0.3, -2.2], MEM], color: '#fbbf24', label: String(a) },
    2: { pts: [IN, [-5.2, 0.3, -2.2], MEM], color: '#fbbf24', label: String(b) },
    3: { pts: [MEM, CPU], color: '#60a5fa', label: `${a},${b}` },
    4: { pts: [CPU, MEM], color: '#4ade80', label: String(c) },
    5: { pts: [MEM, [5.2, 0.3, -2.2], OUT], color: '#4ade80', label: String(c) },
  }
  const r = route[paso]
  const screen = useCanvasTexture(
    256,
    160,
    (ctx, w, h) => {
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#4ade80'
      ctx.font = 'bold 64px ui-monospace, monospace'
      ctx.textAlign = 'center'
      ctx.fillText(paso >= 5 ? String(c) : '_', w / 2, 100)
    },
    [paso, c],
  )
  return (
    <group>
      <Part id="buses" offset={[0, -0.8, 0]} labelAt={[-2.6, 0.6, -2.2]}>
        <Tube pts={[IN, [-5.2, 0.3, -2.2], [5.2, 0.3, -2.2], OUT]} />
        <Tube pts={[MEM, CPU]} />
        <mesh position={[0, -0.45, 0]} receiveShadow>
          <boxGeometry args={[13, 0.2, 7.5]} />
          <meshStandardMaterial color="#14532d" roughness={0.8} />
        </mesh>
      </Part>
      <Part id="memoria" offset={[0, 0, -2]} labelAt={[0, 2.4, -2.2]}>
        <group position={[0, 1.6, -2.2]}>
          <Block size={[4.4, 3.8, 0.8]} color="#7c3aed" title="MEMORIA" lines={mem.map((m, i) => (i < 4 && paso && i === Math.min(3, Math.max(0, paso - (paso >= 4 ? 2 : 1))) ? `▶ ${m}` : m))} />
        </group>
      </Part>
      <group position={[0, 0.9, 2.4]}>
        <Part id="uc" offset={[-1.5, 0.8, 1]} labelAt={[-1.1, 1.3, 0]}>
          <group position={[-1.1, 0, 0]}>
            <Block size={[2, 1.6, 1]} color={paso === 3 ? '#2563eb' : '#1e3a8a'} title="U. CONTROL" lines={[paso === 3 ? 'SUMAR' : paso >= 1 && paso <= 2 ? 'LEER' : paso === 5 ? 'MOSTRAR' : '—']} />
          </group>
        </Part>
        <Part id="alu" offset={[1.5, 0.8, 1]} labelAt={[1.1, 1.3, 0]}>
          <group position={[1.1, 0, 0]}>
            <Block size={[2, 1.6, 1]} color={paso === 4 ? '#16a34a' : '#065f46'} title="ALU" lines={[paso >= 4 ? `${a}+${b}=${c}` : paso === 3 ? `${a} + ${b}` : '—']} />
          </group>
        </Part>
      </group>
      <Part id="entrada" offset={[-1.5, 0, 0]} labelAt={[-5.2, 0.9, 0.8]}>
        <group position={[-5.2, 0, 0.8]}>
          <mesh castShadow>
            <boxGeometry args={[2.4, 0.18, 1]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
          {Array.from({ length: 24 }, (_, k) => (
            <mesh key={k} position={[-1 + (k % 8) * 0.29, 0.13, -0.3 + Math.floor(k / 8) * 0.3]}>
              <boxGeometry args={[0.22, 0.08, 0.22]} />
              <meshStandardMaterial color={paso === 1 || paso === 2 ? '#fde68a' : '#e5e7eb'} />
            </mesh>
          ))}
        </group>
      </Part>
      <Part id="salida" offset={[1.5, 0, 0]} labelAt={[5.2, 2.4, 0.4]}>
        <group position={[5.2, 0, 0.4]}>
          <mesh position={[0, 1.2, 0]} castShadow>
            <boxGeometry args={[2.2, 1.5, 0.15]} />
            <meshStandardMaterial color="#111827" />
          </mesh>
          <mesh position={[0, 1.2, 0.08]}>
            <planeGeometry args={[2, 1.3]} />
            <meshStandardMaterial map={screen} emissive="#ffffff" emissiveMap={screen} emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0, 0.25, 0]}>
            <boxGeometry args={[0.2, 0.5, 0.2]} />
            <meshStandardMaterial color="#374151" />
          </mesh>
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
  { id: 'enlaces', name: 'Enlaces', desc: 'Las conexiones entre nodos: cables de cobre, fibra óptica o inalámbricas (Wi-Fi). Su calidad y velocidad definen qué tan rápida es la red.' },
  { id: 'switch', name: 'Switch (concentrador)', desc: 'En la topología de estrella, todos los nodos se conectan a este equipo central, que reenvía cada paquete sólo al destinatario.' },
  { id: 'paquete', name: 'Paquete de datos', desc: 'La información viaja dividida en paquetes, con la dirección de origen y de destino. Los protocolos (como TCP/IP) fijan las reglas.' },
]

function nodePos(topo: Topologia, k: number): V3 {
  if (topo === 'bus') return [-5 + k * 2.5, 0, k % 2 ? 2 : -2]
  const a = (k / NODOS.length) * Math.PI * 2 - Math.PI / 2
  const R = 4
  return [Math.cos(a) * R, 0, Math.sin(a) * R]
}

function routeOf(topo: Topologia, from: number, to: number): V3[] {
  const p = (k: number): V3 => {
    const [x, , z] = nodePos(topo, k)
    return [x, 0.6, z]
  }
  if (topo === 'estrella') return [p(from), [0, 0.6, 0], p(to)]
  if (topo === 'bus') {
    const [fx, , fz] = p(from)
    const [tx, , tz] = p(to)
    return [p(from), [fx, 0.6, 0], [tx, 0.6, 0], [tx, 0.6, tz]].map((q, i) => (i === 0 ? [fx, 0.6, fz] : q)) as V3[]
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

function Computer({ label, color = '#1f2937' }: { label: string; color?: string }) {
  const tex = useCanvasTexture(
    256,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#e2e8f0'
      ctx.font = 'bold 40px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(label, w / 2, 56)
      ctx.font = '26px ui-monospace, monospace'
      ctx.fillStyle = '#7dd3fc'
      ctx.fillText(`192.168.0.${10 + NODOS.indexOf(label)}`, w / 2, 100)
    },
    [label],
  )
  return (
    <group>
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[1.4, 0.5, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[1.6, 1.0, 0.1]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh position={[0, 1.15, 0.06]}>
        <planeGeometry args={[1.5, 0.9]} />
        <meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.4} />
      </mesh>
    </group>
  )
}

export function RedModel({ topologia, desde, hasta }: RedParams) {
  const pos = NODOS.map((_, k) => nodePos(topologia, k))
  const links: V3[][] = []
  if (topologia === 'estrella') pos.forEach(([x, , z]) => links.push([[x, 0.3, z], [0, 0.3, 0]]))
  else if (topologia === 'bus') {
    links.push([[-6, 0.3, 0], [6, 0.3, 0]])
    pos.forEach(([x, , z]) => links.push([[x, 0.3, z], [x, 0.3, 0]]))
  } else pos.forEach(([x, , z], k) => links.push([[x, 0.3, z], [pos[(k + 1) % pos.length][0], 0.3, pos[(k + 1) % pos.length][2]]]))
  const same = desde === hasta
  return (
    <group>
      <Part id="enlaces" offset={[0, -0.6, 0]} labelAt={topologia === 'bus' ? [-5.5, 0.6, 0] : [2.3, 0.6, -2.6]}>
        {links.map((l, k) => (
          <Tube key={`${topologia}-${k}`} pts={l} color="#38bdf8" r={0.06} />
        ))}
        <mesh position={[0, -0.12, 0]} receiveShadow>
          <cylinderGeometry args={[7.2, 7.2, 0.1, 48]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
      </Part>
      <Part id="nodos" offset={[0, 1, 0]} labelAt={[pos[0][0], 2.2, pos[0][2]]}>
        {pos.map((p, k) => (
          <group key={k} position={p}>
            <Computer label={NODOS[k]} color={k === desde ? '#b45309' : k === hasta ? '#15803d' : '#1f2937'} />
          </group>
        ))}
      </Part>
      {topologia === 'estrella' && (
        <Part id="switch" offset={[0, 1.2, 0]} labelAt={[0, 0.9, 0]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[1.6, 0.4, 0.9]} />
            <meshStandardMaterial color="#334155" metalness={0.3} />
          </mesh>
          {Array.from({ length: 6 }, (_, k) => (
            <mesh key={k} position={[-0.6 + k * 0.24, 0.35, 0.46]}>
              <boxGeometry args={[0.14, 0.1, 0.02]} />
              <meshStandardMaterial color="#4ade80" emissive="#22c55e" emissiveIntensity={1} />
            </mesh>
          ))}
        </Part>
      )}
      {!same && (
        <Part id="paquete" offset={[0, 1.5, 0]} labelAt={[0, 1.4, 0]}>
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
  { id: 'marco', name: 'Marco de la pantalla', desc: 'La cantidad de píxeles a lo ancho y a lo alto es la resolución.' },
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
  return (
    <group position={[0, 3.4, 0]}>
      <Part id="marco" offset={[0, 0, -1.5]} labelAt={[-3.4, 3.4, 0.2]}>
        <mesh position={[0, 0, -0.15]} castShadow>
          <boxGeometry args={[size + 0.6, size + 0.6, 0.25]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0, -size / 2 - 1.2, -0.2]}>
          <boxGeometry args={[0.5, 1.8, 0.3]} />
          <meshStandardMaterial color="#1f2937" />
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
