import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Part } from '../../Part'
import { useCanvasTexture } from '../../helpers'
import { useKeepRendering } from '../../keepRendering'

const PCB = { color: '#1f3a2c', roughness: 0.55 }
const DARK = { color: '#1b1d22', roughness: 0.55, metalness: 0.2 }
const ALU = { color: '#b9bec6', roughness: 0.32, metalness: 0.85 }
const CHIP = { color: '#16181c', roughness: 0.4 }

/** Ventilador: marco + aspas que giran si `on`. */
function Fan({ r = 0.5, on, axis = 'x' }: { r?: number; on: boolean; axis?: 'x' | 'y' | 'z' }) {
  const blades = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (on && blades.current) blades.current.rotation.y += Math.min(dt, 0.05) * 14
  })
  const rot: [number, number, number] = axis === 'x' ? [0, 0, Math.PI / 2] : axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0]
  return (
    <group rotation={rot}>
      <mesh>
        <torusGeometry args={[r, r * 0.08, 8, 40]} />
        <meshStandardMaterial {...DARK} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r * 1.02, r * 0.06, 6, 4]} />
        <meshStandardMaterial {...DARK} />
      </mesh>
      <group ref={blades}>
        <mesh>
          <cylinderGeometry args={[r * 0.28, r * 0.28, r * 0.25, 20]} />
          <meshStandardMaterial color="#2a2d33" />
        </mesh>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} rotation={[0.35, (i / 7) * Math.PI * 2, 0]} position={[Math.cos((i / 7) * Math.PI * 2) * r * 0.55, 0, -Math.sin((i / 7) * Math.PI * 2) * r * 0.55]}>
            <boxGeometry args={[r * 0.55, 0.02, r * 0.3]} />
            <meshStandardMaterial color="#30343b" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/* ================================================================== gabinete */

export interface PcParams {
  encendida: boolean
}

export const PC_PARTS = [
  { id: 'gabinete', name: 'Gabinete', desc: 'La caja de chapa que contiene y protege los componentes. Tiene el botón de encendido, puertos USB al frente y ventilación.' },
  { id: 'tapa', name: 'Tapa lateral', desc: 'Se saca para ver y cambiar las piezas. Esta es de vidrio templado.' },
  { id: 'placa', name: 'Placa base (motherboard)', desc: 'El componente principal: conecta a todos los demás. Tiene ranuras y conectores para el procesador, la RAM, el disco y la placa de video. Los datos viajan entre ellos como señales eléctricas.' },
  { id: 'cpu', name: 'Procesador (CPU)', desc: 'El cerebro de la computadora. Recibe instrucciones y datos de la RAM, los procesa y envía los resultados a la memoria o a los dispositivos de salida.' },
  { id: 'cooler', name: 'Disipador y ventilador (cooler)', desc: 'El procesador calienta mucho al trabajar: el disipador de aluminio y el ventilador sacan ese calor.' },
  { id: 'ram', name: 'Memoria RAM', desc: 'Memoria de acceso aleatorio: guarda temporalmente los datos y programas que la CPU está usando. Es rápida pero volátil: se borra al apagar.' },
  { id: 'gpu', name: 'Placa de video (GPU)', desc: 'Procesa y genera las imágenes que se ven en el monitor. Tiene su propio procesador y memoria. Trabaja junto con la CPU en programas y juegos.' },
  { id: 'fuente', name: 'Fuente de alimentación', desc: 'Transforma los 220 V de alterna del enchufe en las tensiones continuas bajas (12 V, 5 V, 3,3 V) que usan las piezas.' },
  { id: 'disco', name: 'Disco rígido (HDD)', desc: 'Almacenamiento principal: guarda en forma permanente los programas y archivos, aunque la compu esté apagada. Usa discos magnéticos que giran.' },
  { id: 'ssd', name: 'Disco sólido (SSD M.2)', desc: 'Almacenamiento con memorias flash, sin partes móviles: es mucho más rápido que el HDD y aguanta mejor los golpes.' },
]

export function PcModel({ encendida }: PcParams) {
  useKeepRendering(encendida)
  const W = 2.1
  const H = 4.4
  const D = 4.4
  const front = useCanvasTexture(
    128,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#17191e'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#2a2e36'
      for (let y = 30; y < h - 40; y += 8) {
        ctx.beginPath()
        ctx.moveTo(14, y)
        ctx.lineTo(w - 14, y)
        ctx.stroke()
      }
    },
    [],
  )
  return (
    <group position={[0, H / 2, 0]}>
      {/* chapa del gabinete: piso, techo, frente, fondo y lado izquierdo */}
      <Part id="gabinete" offset={[0, 0, 0]} labelAt={[0.4, H / 2 + 0.35, -D / 2 + 0.4]}>
        <mesh position={[-W / 2, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.06, H, D]} />
          <meshStandardMaterial {...DARK} />
        </mesh>
        <mesh position={[0, -H / 2, 0]} receiveShadow>
          <boxGeometry args={[W, 0.06, D]} />
          <meshStandardMaterial {...DARK} />
        </mesh>
        <mesh position={[0, H / 2, 0]}>
          <boxGeometry args={[W, 0.06, D]} />
          <meshStandardMaterial {...DARK} />
        </mesh>
        <mesh position={[0, 0, -D / 2]}>
          <boxGeometry args={[W, H, 0.06]} />
          <meshStandardMaterial {...DARK} />
        </mesh>
        <mesh position={[0, 0, D / 2 + 0.05]} castShadow>
          <boxGeometry args={[W, H, 0.1]} />
          <meshStandardMaterial map={front} roughness={0.6} />
        </mesh>
        {/* botón de encendido y LED */}
        <mesh position={[0, H / 2 - 0.35, D / 2 + 0.11]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.04, 24]} />
          <meshStandardMaterial color="#3a3e46" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, H / 2 - 0.35, D / 2 + 0.135]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.1, 0.012, 8, 24]} />
          <meshStandardMaterial color="#36c2ff" emissive="#36c2ff" emissiveIntensity={encendida ? 2.5 : 0} />
        </mesh>
        {[-0.3, 0.3].map((x) => (
          <mesh key={x} position={[x, H / 2 - 0.75, D / 2 + 0.11]}>
            <boxGeometry args={[0.28, 0.1, 0.02]} />
            <meshStandardMaterial color="#0a0a0c" />
          </mesh>
        ))}
        {/* ventilador trasero */}
        <group position={[0, H / 2 - 0.9, -D / 2 + 0.2]}>
          <Fan r={0.55} on={encendida} axis="z" />
        </group>
      </Part>

      {/* luz interna (tira LED) para que se vean las piezas */}
      <pointLight position={[0.4, 1.4, 0.6]} intensity={encendida ? 6 : 3} distance={6} color={encendida ? '#cfe8ff' : '#ffffff'} />
      <Part id="tapa" offset={[3.2, 0, 0]} labelAt={[W / 2 + 0.1, 1.2, 0]}>
        <mesh position={[W / 2, 0, 0]}>
          <boxGeometry args={[0.04, H, D]} />
          <meshPhysicalMaterial color="#9fb4c8" transparent opacity={0.16} roughness={0.05} />
        </mesh>
      </Part>

      {/* placa base contra el lado izquierdo */}
      <Part id="placa" offset={[-0.8, 0, 0]} labelAt={[-W / 2 + 0.2, -0.2, 1.7]}>
        <mesh position={[-W / 2 + 0.1, 0.55, -0.3]} castShadow>
          <boxGeometry args={[0.05, 3.0, 2.5]} />
          <meshStandardMaterial {...PCB} />
        </mesh>
        {/* zócalo del procesador */}
        <mesh position={[-W / 2 + 0.14, 1.25, -0.3]}>
          <boxGeometry args={[0.04, 0.6, 0.6]} />
          <meshStandardMaterial color="#c9c3b2" roughness={0.6} />
        </mesh>
        {/* ranuras de RAM y PCIe */}
        {[0.35, 0.5].map((z) => (
          <mesh key={z} position={[-W / 2 + 0.15, 1.2, z]}>
            <boxGeometry args={[0.06, 1.3, 0.06]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        ))}
        <mesh position={[-W / 2 + 0.15, 0.1, -0.3]}>
          <boxGeometry args={[0.06, 0.07, 1.8]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        {/* chipset y capacitores */}
        <mesh position={[-W / 2 + 0.15, -0.45, 0.4]}>
          <boxGeometry args={[0.06, 0.4, 0.4]} />
          <meshStandardMaterial {...ALU} />
        </mesh>
      </Part>

      <Part id="cpu" offset={[0.6, 0.6, 0]} labelAt={[-W / 2 + 0.3, 1.25, -1.1]}>
        <mesh position={[-W / 2 + 0.18, 1.25, -0.3]}>
          <boxGeometry args={[0.04, 0.45, 0.45]} />
          <meshStandardMaterial color="#c8ccd2" metalness={0.9} roughness={0.25} />
        </mesh>
      </Part>

      <Part id="cooler" offset={[1.8, 0.9, 0]} labelAt={[-W / 2 + 0.9, 2.35, -0.5]}>
        <group position={[-W / 2 + 0.6, 1.25, -0.3]}>
          {Array.from({ length: 9 }, (_, i) => (
            <mesh key={i} position={[0, 0, -0.32 + i * 0.08]}>
              <boxGeometry args={[0.7, 0.9, 0.03]} />
              <meshStandardMaterial {...ALU} />
            </mesh>
          ))}
          <group position={[0.42, 0, 0]}>
            <Fan r={0.45} on={encendida} axis="x" />
          </group>
        </group>
      </Part>

      <Part id="ram" offset={[1.3, 0, 0.4]} labelAt={[-W / 2 + 0.5, 1.85, 1.05]}>
        {[0.35, 0.5].map((z) => (
          <group key={z} position={[-W / 2 + 0.3, 1.2, z]}>
            <mesh>
              <boxGeometry args={[0.3, 1.25, 0.03]} />
              <meshStandardMaterial {...PCB} />
            </mesh>
            {Array.from({ length: 4 }, (_, k) => (
              <mesh key={k} position={[0.02, -0.45 + k * 0.3, 0.02]}>
                <boxGeometry args={[0.18, 0.2, 0.02]} />
                <meshStandardMaterial {...CHIP} />
              </mesh>
            ))}
            <mesh position={[0.1, 0, 0.02]}>
              <boxGeometry args={[0.1, 1.25, 0.015]} />
              <meshStandardMaterial color="#c1121f" />
            </mesh>
          </group>
        ))}
      </Part>

      <Part id="gpu" offset={[1.6, -0.4, 0]} labelAt={[0.2, 0.45, 1.2]}>
        <group position={[-W / 2 + 0.85, 0.0, -0.1]}>
          <RoundedBox args={[1.3, 0.38, 2.6]} radius={0.04}>
            <meshStandardMaterial color="#25282f" roughness={0.45} metalness={0.4} />
          </RoundedBox>
          {[-0.65, 0.65].map((z) => (
            <group key={z} position={[0, -0.2, z]}>
              <Fan r={0.38} on={encendida} axis="y" />
            </group>
          ))}
          <mesh position={[-0.55, 0.0, 1.32]}>
            <boxGeometry args={[0.25, 0.32, 0.04]} />
            <meshStandardMaterial {...ALU} />
          </mesh>
        </group>
      </Part>

      <Part id="fuente" offset={[1.4, -0.8, 0]} labelAt={[0, -H / 2 + 1.2, -1.2]}>
        <mesh position={[0, -H / 2 + 0.5, -D / 2 + 0.95]} castShadow>
          <boxGeometry args={[1.9, 0.86, 1.6]} />
          <meshStandardMaterial color="#202227" roughness={0.6} metalness={0.3} />
        </mesh>
        <group position={[0, -H / 2 + 0.94, -D / 2 + 0.95]}>
          <Fan r={0.45} on={encendida} axis="y" />
        </group>
      </Part>

      <Part id="disco" offset={[1.2, -0.3, 1.4]} labelAt={[0, -H / 2 + 1.3, D / 2 - 0.6]}>
        <group position={[0.1, -H / 2 + 0.55, D / 2 - 0.9]}>
          <mesh castShadow>
            <boxGeometry args={[1.0, 0.26, 1.45]} />
            <meshStandardMaterial {...ALU} />
          </mesh>
          <mesh position={[0, 0.135, 0.1]}>
            <boxGeometry args={[0.7, 0.01, 0.9]} />
            <meshStandardMaterial color="#e4e6ea" />
          </mesh>
        </group>
      </Part>

      <Part id="ssd" offset={[1.2, 0, 0]} labelAt={[-W / 2 + 0.3, -0.75, -1.3]}>
        <group position={[-W / 2 + 0.15, -0.6, -0.6]}>
          <mesh>
            <boxGeometry args={[0.03, 0.22, 0.8]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          {[-0.2, 0.15].map((z) => (
            <mesh key={z} position={[0.02, 0, z]}>
              <boxGeometry args={[0.02, 0.17, 0.25]} />
              <meshStandardMaterial {...CHIP} />
            </mesh>
          ))}
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
        { id: 'tapa', name: 'Tapa', desc: 'Cierra el disco herméticamente: una sola partícula de polvo puede rayar el plato.' },
        { id: 'plato', name: 'Plato magnético', desc: 'Disco de aluminio o vidrio recubierto de material magnético. Gira a 5400 o 7200 vueltas por minuto. Los datos se guardan como zonas magnetizadas (unos y ceros).' },
        { id: 'motor', name: 'Motor (eje)', desc: 'Hace girar los platos a velocidad constante.' },
        { id: 'cabezal', name: 'Brazo y cabezal de lectura/escritura', desc: 'Se mueve sobre el plato flotando a una distancia microscópica: lee y escribe los datos.' },
        { id: 'carcasa', name: 'Carcasa', desc: 'Base de aluminio que sostiene todo.' },
        { id: 'controladora', name: 'Placa controladora', desc: 'Electrónica que maneja el motor y el cabezal y se comunica con la placa base por el cable SATA.' },
      ]
    : [
        { id: 'tapa', name: 'Carcasa', desc: 'Protege la placa. Al no tener partes móviles, el SSD aguanta golpes y no hace ruido.' },
        { id: 'flash', name: 'Chips de memoria flash', desc: 'Guardan los datos en forma permanente sin partes móviles (como un pendrive, pero mucho más rápido).' },
        { id: 'controlador', name: 'Controlador', desc: 'El "cerebro" del SSD: reparte y ordena los datos entre los chips de memoria.' },
        { id: 'placa', name: 'Placa', desc: 'Circuito impreso que une los chips y el conector.' },
        { id: 'conector', name: 'Conector SATA', desc: 'Por acá se conecta a la placa base (datos) y a la fuente (alimentación).' },
      ]

export function DiscoModel({ tipo, encendido }: DiscoParams) {
  useKeepRendering(encendido && tipo === 'hdd')
  const plate = useRef<THREE.Group>(null)
  const arm = useRef<THREE.Group>(null)
  useFrame(({ clock }, dt) => {
    if (!encendido || tipo !== 'hdd') return
    if (plate.current) plate.current.rotation.y += Math.min(dt, 0.05) * 20
    if (arm.current) arm.current.rotation.y = -0.25 + Math.sin(clock.elapsedTime * 2.2) * 0.32
  })
  const label = useCanvasTexture(
    512,
    360,
    (ctx, w, h) => {
      ctx.fillStyle = tipo === 'hdd' ? '#d9dce1' : '#1b1d22'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = tipo === 'hdd' ? '#1b1d22' : '#e6e8ec'
      ctx.font = 'bold 54px system-ui'
      ctx.fillText(tipo === 'hdd' ? 'HDD 1 TB' : 'SSD 480 GB', 40, 110)
      ctx.font = '30px system-ui'
      ctx.fillText(tipo === 'hdd' ? '7200 RPM · SATA III' : 'SATA III · 550 MB/s', 40, 170)
      ctx.fillText('ITS Villada', 40, 230)
    },
    [tipo],
  )
  if (tipo === 'ssd')
    return (
      <group>
        <Part id="tapa" offset={[0, 1.8, 0]} labelAt={[0, 0.5, 0]}>
          <mesh position={[0, 0.32, 0]} castShadow>
            <boxGeometry args={[2.8, 0.12, 4.0]} />
            <meshStandardMaterial color="#25282f" metalness={0.5} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.385, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2.0, 1.4]} />
            <meshStandardMaterial map={label} />
          </mesh>
        </Part>
        <Part id="flash" offset={[0, 0.9, 0]} labelAt={[0.6, 0.4, -0.8]}>
          {[-1.2, -0.3, 0.6].map((z) => (
            <mesh key={z} position={[0.5, 0.12, z]}>
              <boxGeometry args={[1.0, 0.1, 0.7]} />
              <meshStandardMaterial {...CHIP} />
            </mesh>
          ))}
        </Part>
        <Part id="controlador" offset={[0, 0.9, 0]} labelAt={[-0.6, 0.4, -0.5]}>
          <mesh position={[-0.6, 0.12, -0.5]}>
            <boxGeometry args={[0.8, 0.1, 0.8]} />
            <meshStandardMaterial color="#2b2f36" metalness={0.5} />
          </mesh>
        </Part>
        <Part id="placa" offset={[0, 0, 0]} labelAt={[-1, 0.2, 1.2]}>
          <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.6, 0.06, 3.8]} />
            <meshStandardMaterial {...PCB} />
          </mesh>
        </Part>
        <Part id="conector" offset={[0, 0, 1.2]} labelAt={[0, 0.3, 2.05]}>
          <mesh position={[0, 0.1, 1.95]}>
            <boxGeometry args={[1.6, 0.16, 0.15]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </Part>
      </group>
    )
  return (
    <group>
      <Part id="carcasa" offset={[0, -0.6, 0]} labelAt={[1.3, 0.1, 1.7]}>
        <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.9, 0.3, 4.1]} />
          <meshStandardMaterial {...ALU} />
        </mesh>
      </Part>
      <Part id="controladora" offset={[0, -1.4, 0]} labelAt={[0, -0.05, 1.5]}>
        <mesh position={[0, -0.03, 0]}>
          <boxGeometry args={[2.6, 0.05, 3.6]} />
          <meshStandardMaterial {...PCB} />
        </mesh>
        <mesh position={[0, -0.06, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.6, 1.1]} />
          <meshStandardMaterial map={label} side={THREE.DoubleSide} />
        </mesh>
      </Part>
      <Part id="motor" offset={[0, 0.6, 0]} labelAt={[-0.3, 0.75, 0.6]}>
        <mesh position={[-0.3, 0.45, 0.6]}>
          <cylinderGeometry args={[0.18, 0.18, 0.3, 24]} />
          <meshStandardMaterial color="#d0d3d8" metalness={0.9} roughness={0.2} />
        </mesh>
      </Part>
      <Part id="plato" offset={[0, 1.1, 0]} labelAt={[0.6, 0.6, 1.4]}>
        <group ref={plate} position={[-0.3, 0.36, 0.6]}>
          <mesh>
            <cylinderGeometry args={[1.25, 1.25, 0.04, 64]} />
            <meshStandardMaterial color="#cfd6dd" metalness={1} roughness={0.08} />
          </mesh>
          <mesh position={[0.55, 0.025, 0]}>
            <boxGeometry args={[0.6, 0.002, 0.04]} />
            <meshStandardMaterial color="#9aa3ad" />
          </mesh>
        </group>
      </Part>
      <Part id="cabezal" offset={[0, 1.6, -0.6]} labelAt={[0.9, 0.7, -1.4]}>
        <group ref={arm} position={[0.95, 0.42, -1.35]} rotation={[0, -0.25, 0]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.2, 20]} />
            <meshStandardMaterial color="#5b6270" metalness={0.6} />
          </mesh>
          <mesh position={[-0.75, 0, 0.85]} rotation={[0, Math.atan2(0.85, -0.75) + Math.PI / 2, 0]}>
            <boxGeometry args={[0.12, 0.03, 2.2]} />
            <meshStandardMaterial color="#c0c4ca" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      </Part>
      <Part id="tapa" offset={[0, 2.4, 0]} labelAt={[0, 0.65, 0]}>
        <mesh position={[0, 0.52, 0]}>
          <boxGeometry args={[2.85, 0.04, 4.05]} />
          <meshStandardMaterial color="#c7ccd3" transparent opacity={0.12} metalness={0.6} />
        </mesh>
      </Part>
    </group>
  )
}

/* ================================================================== periféricos */

export interface PerifParams {
  resaltar: 'todos' | 'entrada' | 'salida'
}

export const PERIF_PARTS = [
  { id: 'monitor', name: 'Monitor (salida)', desc: 'Dispositivo de salida: muestra la información al usuario.' },
  { id: 'parlantes', name: 'Parlantes (salida)', desc: 'Dispositivo de salida: transforman la señal en sonido.' },
  { id: 'impresora', name: 'Impresora (salida)', desc: 'Dispositivo de salida: pasa la información al papel.' },
  { id: 'teclado', name: 'Teclado (entrada)', desc: 'Dispositivo de entrada: con él el usuario ingresa datos y comandos.' },
  { id: 'mouse', name: 'Mouse (entrada)', desc: 'Dispositivo de entrada: mueve el puntero y permite hacer clic.' },
  { id: 'webcam', name: 'Cámara web (entrada)', desc: 'Dispositivo de entrada: captura imagen (y sonido, con su micrófono).' },
]

const KIND: Record<string, 'entrada' | 'salida'> = { monitor: 'salida', parlantes: 'salida', impresora: 'salida', teclado: 'entrada', mouse: 'entrada', webcam: 'entrada' }

export function PerifericosModel({ resaltar }: PerifParams) {
  const dim = (id: string) => resaltar !== 'todos' && KIND[id] !== resaltar
  const mat = (id: string, color: string) => ({ color, transparent: dim(id), opacity: dim(id) ? 0.18 : 1, roughness: 0.5 })
  const screen = useCanvasTexture(
    512,
    300,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h)
      g.addColorStop(0, '#0f2a4a')
      g.addColorStop(1, '#3b1a5a')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 40px system-ui'
      ctx.fillText('ITS Villada', 40, 80)
      ctx.font = '24px system-ui'
      ctx.fillStyle = '#9fe0ff'
      ctx.fillText('entrada → proceso → salida', 40, 130)
    },
    [],
  )
  const keys = useMemo(() => {
    const k: [number, number][] = []
    for (let r = 0; r < 5; r++) for (let c = 0; c < 14; c++) k.push([-2.1 + c * 0.32, -0.55 + r * 0.28])
    return k
  }, [])
  return (
    <group>
      <Part id="monitor" offset={[0, 1.5, -1]} labelAt={[0, 3.6, -1.6]}>
        <group position={[0, 0, -1.6]}>
          <mesh position={[0, 2.0, 0]} castShadow>
            <boxGeometry args={[4.4, 2.6, 0.14]} />
            <meshStandardMaterial {...mat('monitor', '#15171b')} />
          </mesh>
          <mesh position={[0, 2.05, 0.075]}>
            <planeGeometry args={[4.15, 2.35]} />
            <meshStandardMaterial map={screen} transparent={dim('monitor')} opacity={dim('monitor') ? 0.18 : 1} emissive="#ffffff" emissiveMap={screen} emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[0, 0.45, -0.05]}>
            <boxGeometry args={[0.2, 0.9, 0.1]} />
            <meshStandardMaterial {...mat('monitor', '#2a2d33')} />
          </mesh>
          <mesh position={[0, 0.03, 0]}>
            <boxGeometry args={[1.4, 0.06, 0.8]} />
            <meshStandardMaterial {...mat('monitor', '#2a2d33')} />
          </mesh>
        </group>
      </Part>
      <Part id="webcam" offset={[0, 1.2, 0]} labelAt={[0, 3.75, -1.4]}>
        <mesh position={[0, 3.42, -1.55]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.2, 20]} />
          <meshStandardMaterial {...mat('webcam', '#111')} />
        </mesh>
      </Part>
      <Part id="parlantes" offset={[1.2, 0, 0]} labelAt={[3.0, 1.4, -1.4]}>
        {[-3, 3].map((x) => (
          <group key={x} position={[x, 0.6, -1.4]}>
            <mesh castShadow>
              <boxGeometry args={[0.8, 1.2, 0.7]} />
              <meshStandardMaterial {...mat('parlantes', '#1d1f24')} />
            </mesh>
            <mesh position={[0, 0.1, 0.36]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.26, 0.26, 0.02, 24]} />
              <meshStandardMaterial {...mat('parlantes', '#3b3f47')} />
            </mesh>
          </group>
        ))}
      </Part>
      <Part id="teclado" offset={[0, 0.6, 1.2]} labelAt={[0, 0.5, 0.8]}>
        <group position={[-0.3, 0.06, 0.8]}>
          <mesh castShadow>
            <boxGeometry args={[4.7, 0.12, 1.65]} />
            <meshStandardMaterial {...mat('teclado', '#22252b')} />
          </mesh>
          {keys.map(([x, z], i) => (
            <mesh key={i} position={[x, 0.09, z]}>
              <boxGeometry args={[0.27, 0.07, 0.24]} />
              <meshStandardMaterial {...mat('teclado', '#3a3e46')} />
            </mesh>
          ))}
        </group>
      </Part>
      <Part id="mouse" offset={[0.8, 0.6, 0.8]} labelAt={[2.9, 0.45, 0.9]}>
        <mesh position={[2.9, 0.12, 0.9]} scale={[0.32, 0.18, 0.52]} castShadow>
          <sphereGeometry args={[1, 24, 16]} />
          <meshStandardMaterial {...mat('mouse', '#26292f')} />
        </mesh>
      </Part>
      <Part id="impresora" offset={[1.5, 0.4, 0]} labelAt={[-4.4, 1.2, 0.3]}>
        <group position={[-4.4, 0.35, 0.2]}>
          <RoundedBox args={[1.9, 0.7, 1.4]} radius={0.08} castShadow>
            <meshStandardMaterial {...mat('impresora', '#e7e8eb')} />
          </RoundedBox>
          <mesh position={[0, 0.36, -0.35]} rotation={[-0.5, 0, 0]}>
            <boxGeometry args={[1.3, 0.01, 0.8]} />
            <meshStandardMaterial {...mat('impresora', '#ffffff')} />
          </mesh>
          <mesh position={[0, 0.1, 0.71]}>
            <boxGeometry args={[1.2, 0.06, 0.02]} />
            <meshStandardMaterial {...mat('impresora', '#111')} />
          </mesh>
        </group>
      </Part>
    </group>
  )
}
