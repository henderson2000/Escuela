import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Part } from '../../Part'
import { useCanvasTexture } from '../../helpers'
import { useKeepRendering } from '../../keepRendering'

const metalMat = { color: '#c9ccd1', metalness: 0.9, roughness: 0.3 }
const copper = { color: '#c27a3a', metalness: 0.85, roughness: 0.35 }

/* ================================================================== termomagnético */

export type Situacion = 'normal' | 'sobrecarga' | 'cortocircuito'

export interface PiaParams {
  situacion: Situacion
  /** cambia cada vez que se rearma (reinicia la animación) */
  rearme: number
  corte: boolean
}

/** Tiempo que tarda en disparar (s) según la situación (curva C, valores ilustrativos). */
export const TIEMPO_DISPARO: Record<Situacion, number> = { normal: Infinity, sobrecarga: 6, cortocircuito: 0.05 }

export const PIA_PARTS = [
  { id: 'carcasa', name: 'Carcasa', desc: 'De material aislante y autoextinguible. Se encastra en el riel DIN del tablero.' },
  { id: 'palanca', name: 'Palanca de maniobra', desc: 'Arriba = cerrado (ON). Cuando el interruptor dispara, baja sola. Se rearma subiéndola a mano.' },
  { id: 'contactos', name: 'Contactos', desc: 'Uno fijo y uno móvil, de aleación de plata. Al separarse cortan la corriente.' },
  { id: 'bimetal', name: 'Bimetal (parte térmica)', desc: 'Dos metales soldados que se dilatan distinto. Con una SOBRECARGA se calienta, se curva de a poco y destraba el mecanismo. Tarda segundos o minutos: depende de cuánto se pase la corriente.' },
  { id: 'bobina', name: 'Bobina (parte magnética)', desc: 'Con un CORTOCIRCUITO la corriente es enorme: la bobina se vuelve un imán fuerte, el percutor golpea y abre los contactos en milésimas de segundo.' },
  { id: 'camara', name: 'Cámara apagachispas', desc: 'Placas metálicas que dividen y enfrían el arco eléctrico que se forma al abrir los contactos.' },
  { id: 'bornes', name: 'Bornes', desc: 'Tornillos donde se conectan los cables: arriba la entrada (de la línea) y abajo la salida (a los circuitos).' },
]

function Bimetal({ bend }: { bend: number }) {
  // tira curva: se arma con una curva cuya flecha depende de la temperatura
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 12; i++) {
      const t = i / 12
      pts.push(new THREE.Vector3(Math.sin(t * Math.PI * 0.5) * bend * 0.8, -t * 2.2, 0))
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.09, 6, false)
  }, [bend])
  return (
    <group>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial color="#b45309" metalness={0.7} roughness={0.35} emissive="#ef4444" emissiveIntensity={bend * 1.2} />
      </mesh>
      <mesh geometry={geo} position={[0.12, 0, 0]}>
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}

export function PiaModel({ situacion, rearme, corte }: PiaParams) {
  const key = `${situacion}-${rearme}`
  const [st, setSt] = useState({ key, t: 0 })
  const start = useRef<{ key: string; t0: number }>({ key: '', t0: 0 })
  const t = st.key === key ? st.t : 0
  const disparo = TIEMPO_DISPARO[situacion]
  const tripped = t >= disparo
  const animating = situacion !== 'normal' && t < disparo + 0.5
  useKeepRendering(animating)
  useFrame(({ clock }) => {
    if (situacion === 'normal') return
    if (start.current.key !== key) start.current = { key, t0: clock.elapsedTime }
    const el = clock.elapsedTime - start.current.t0
    if (st.key !== key || (Math.abs(el - st.t) > 0.03 && st.t < disparo + 0.5)) setSt({ key, t: el })
  })
  const heat = situacion === 'sobrecarga' ? Math.min(1, t / disparo) : situacion === 'cortocircuito' ? 0.15 : 0.05
  const strike = situacion === 'cortocircuito' && t >= disparo ? 1 : 0
  const open = tripped
  const arc = open && t < disparo + 0.35
  return (
    <group position={[0, 0.2, 0]}>
      <Part id="carcasa" offset={[0, 0, -3]} labelAt={[-1.9, 3.6, 0]}>
        {/* media carcasa: el frente queda abierto para ver el interior */}
        <mesh position={[0, 0, -0.55]} castShadow receiveShadow>
          <boxGeometry args={[4, 7, 0.3]} />
          <meshStandardMaterial color="#f1f1ee" roughness={0.5} />
        </mesh>
        {corte ? null : (
          <mesh position={[0, 0, 0.6]}>
            <boxGeometry args={[4, 7, 0.05]} />
            <meshPhysicalMaterial color="#ffffff" transparent opacity={0.18} roughness={0.1} />
          </mesh>
        )}
        {/* paredes de la media carcasa */}
        {[-2, 2].map((x) => (
          <mesh key={x} position={[x, 0, 0]} castShadow>
            <boxGeometry args={[0.15, 7, 1.4]} />
            <meshStandardMaterial color="#e9e9e4" roughness={0.5} />
          </mesh>
        ))}
        <mesh position={[0, 3.45, 0]}>
          <boxGeometry args={[4.15, 0.15, 1.4]} />
          <meshStandardMaterial color="#e9e9e4" roughness={0.5} />
        </mesh>
        <mesh position={[0, -3.45, 0]}>
          <boxGeometry args={[4.15, 0.15, 1.4]} />
          <meshStandardMaterial color="#e9e9e4" roughness={0.5} />
        </mesh>
        {/* encastre para el riel DIN */}
        <mesh position={[0, 0, -0.85]}>
          <boxGeometry args={[4, 1.4, 0.3]} />
          <meshStandardMaterial color="#d4d4cf" roughness={0.5} />
        </mesh>
      </Part>
      <Part id="palanca" offset={[0, 1.5, 1]} labelAt={[0.9, 4.4, 0.5]}>
        <mesh position={[0, 3.55, 0]}>
          <boxGeometry args={[1.2, 0.12, 0.9]} />
          <meshStandardMaterial color="#d4d4cf" roughness={0.5} />
        </mesh>
        <group position={[0, 3.5, 0]} rotation={[0, 0, open ? -0.6 : 0.6]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[0.4, 1.0, 0.6]} />
            <meshStandardMaterial color="#18181b" roughness={0.4} />
          </mesh>
        </group>
      </Part>
      <Part id="bornes" offset={[1.5, 0, 0]} labelAt={[1.5, 3.4, 0.4]}>
        {[2.9, -2.9].map((y) => (
          <group key={y} position={[1.3, y, 0]}>
            <mesh>
              <boxGeometry args={[0.8, 0.5, 0.7]} />
              <meshStandardMaterial {...metalMat} />
            </mesh>
            <mesh position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.12, 16]} />
              <meshStandardMaterial {...metalMat} />
            </mesh>
          </group>
        ))}
      </Part>
      <Part id="bobina" offset={[-1.5, 0.5, 1]} labelAt={[-1.1, 2.6, 0.6]}>
        <group position={[-0.9, 1.5, 0]}>
          {Array.from({ length: 9 }, (_, i) => (
            <mesh key={i} position={[0, -0.6 + i * 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.36, 0.06, 8, 20]} />
              <meshStandardMaterial {...copper} emissive="#f97316" emissiveIntensity={situacion === 'cortocircuito' && !open ? 1.5 : 0} />
            </mesh>
          ))}
          {/* percutor */}
          <mesh position={[0, -1.0 - strike * 0.5, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 1.5, 12]} />
            <meshStandardMaterial {...metalMat} />
          </mesh>
        </group>
      </Part>
      <Part id="bimetal" offset={[1.5, 0.5, 1]} labelAt={[0.8, 1.9, 0.6]}>
        <group position={[0.6, 1.6, 0]}>
          <Bimetal bend={heat} />
        </group>
      </Part>
      <Part id="contactos" offset={[0, 0, 1.5]} labelAt={[-0.2, -0.3, 0.8]}>
        {/* fijo */}
        <mesh position={[-0.2, -0.9, 0]}>
          <boxGeometry args={[0.8, 0.25, 0.4]} />
          <meshStandardMaterial {...copper} />
        </mesh>
        <mesh position={[-0.2, -0.72, 0]}>
          <boxGeometry args={[0.3, 0.12, 0.3]} />
          <meshStandardMaterial color="#e5e7eb" metalness={1} roughness={0.2} />
        </mesh>
        {/* móvil */}
        <group position={[0.8, -0.2, 0]} rotation={[0, 0, open ? 0.55 : 0]}>
          <mesh position={[-0.75, -0.25, 0]}>
            <boxGeometry args={[1.5, 0.22, 0.4]} />
            <meshStandardMaterial {...copper} />
          </mesh>
          <mesh position={[-1.0, -0.4, 0]}>
            <boxGeometry args={[0.3, 0.12, 0.3]} />
            <meshStandardMaterial color="#e5e7eb" metalness={1} roughness={0.2} />
          </mesh>
        </group>
        {arc && (
          <mesh position={[-0.3, -0.45, 0.2]}>
            <sphereGeometry args={[0.3, 12, 10]} />
            <meshStandardMaterial color="#e0f2fe" emissive="#7dd3fc" emissiveIntensity={4} transparent opacity={0.8} />
          </mesh>
        )}
      </Part>
      <Part id="camara" offset={[-1.5, -1, 1]} labelAt={[-1.1, -1.6, 0.7]}>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} position={[-1.2, -2.4 + i * 0.22, 0]}>
            <boxGeometry args={[1.0, 0.07, 0.8]} />
            <meshStandardMaterial color="#6b7280" metalness={0.8} roughness={0.35} />
          </mesh>
        ))}
      </Part>
    </group>
  )
}

/* ================================================================== diferencial */

export interface DiferencialParams {
  fuga: number
  sensibilidad: number
  rearme: number
}

export const DIF_PARTS = [
  { id: 'carcasa', name: 'Carcasa', desc: 'Aislante, de 2 módulos (bipolar). Se monta en el riel DIN, en general antes del termomagnético.' },
  { id: 'toroide', name: 'Transformador toroidal', desc: 'Anillo de hierro por el que pasan la fase y el neutro. Si las dos corrientes son iguales sus efectos se anulan; si no (se escapa corriente a tierra), aparece una diferencia.' },
  { id: 'fase', name: 'Conductor de fase', desc: 'La corriente que ENTRA al circuito.' },
  { id: 'neutro', name: 'Conductor de neutro', desc: 'La corriente que VUELVE. Por la ley de Kirchhoff, si no hay fugas, es igual a la de la fase.' },
  { id: 'bobina', name: 'Bobina detectora', desc: 'Arrollada sobre el toroide. Cuando hay diferencia de corrientes genera una señal que acciona el relé.' },
  { id: 'rele', name: 'Relé de disparo', desc: 'Recibe la señal de la bobina y abre los contactos en menos de 30 ms.' },
  { id: 'test', name: 'Botón de prueba (T)', desc: 'Provoca una fuga artificial para comprobar que el diferencial funciona. Se recomienda probarlo una vez por mes.' },
]

function Arrow({ y, dir, color, scale }: { y: number; dir: 1 | -1; color: string; scale: number }) {
  return (
    <group position={[0, y, 0.9]} rotation={[0, 0, dir === 1 ? 0 : Math.PI]} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.3, 0]}>
        <coneGeometry args={[0.22, 0.45, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.07, 0.07, 0.4, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
}

export function DiferencialModel({ fuga, sensibilidad }: DiferencialParams) {
  const tripped = fuga >= sensibilidad
  const face = useCanvasTexture(
    256,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = tripped ? '#f87171' : '#4ade80'
      ctx.font = 'bold 30px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(tripped ? 'DISPARÓ' : 'CERRADO', w / 2, 48)
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '22px system-ui'
      ctx.fillText(`Fuga: ${fuga} mA`, w / 2, 92)
    },
    [tripped, fuga],
  )
  const iF = 1
  const iN = Math.max(0.2, 1 - fuga / 100)
  return (
    <group>
      <Part id="carcasa" offset={[0, 0, -3]} labelAt={[-2.3, 3.6, 0]}>
        <mesh position={[0, 0, -0.6]} receiveShadow castShadow>
          <boxGeometry args={[5, 7, 0.3]} />
          <meshStandardMaterial color="#f1f1ee" roughness={0.5} />
        </mesh>
        <mesh position={[0, 3.0, -0.4]}>
          <planeGeometry args={[2.4, 1.2]} />
          <meshStandardMaterial map={face} />
        </mesh>
      </Part>
      <Part id="toroide" offset={[0, 0, 2]} labelAt={[1.7, 0.6, 0.6]}>
        <mesh>
          <torusGeometry args={[1.3, 0.38, 16, 40]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.4} emissive="#a855f7" emissiveIntensity={Math.min(1.5, fuga / 20)} />
        </mesh>
      </Part>
      <Part id="fase" offset={[-1, 0, 1]} labelAt={[-0.45, 2.6, 0.3]}>
        <mesh position={[-0.45, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 6, 12]} />
          <meshStandardMaterial color="#7c4a21" />
        </mesh>
        <group position={[-0.45, -2.2, 0]}>
          <Arrow y={0} dir={-1} color="#f59e0b" scale={iF} />
        </group>
      </Part>
      <Part id="neutro" offset={[1, 0, 1]} labelAt={[0.45, 2.6, 0.3]}>
        <mesh position={[0.45, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 6, 12]} />
          <meshStandardMaterial color="#5ab4e5" />
        </mesh>
        <group position={[0.45, -2.2, 0]}>
          <Arrow y={0} dir={1} color="#38bdf8" scale={iN} />
        </group>
      </Part>
      <Part id="bobina" offset={[2, 0, 1]} labelAt={[1.6, -1.4, 0.4]}>
        {Array.from({ length: 8 }, (_, i) => {
          const a = -0.9 + i * 0.12
          return (
            <mesh key={i} position={[Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0]} rotation={[0, 0, a]}>
              <torusGeometry args={[0.45, 0.05, 6, 16]} />
              <meshStandardMaterial {...copper} />
            </mesh>
          )
        })}
      </Part>
      <Part id="rele" offset={[2, -1, 1]} labelAt={[1.8, -2.6, 0.6]}>
        <group position={[1.8, -2.4, 0]}>
          <mesh>
            <boxGeometry args={[1.0, 0.8, 0.8]} />
            <meshStandardMaterial color="#1e3a8a" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.55 + (tripped ? 0.25 : 0), 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.4, 10]} />
            <meshStandardMaterial {...metalMat} />
          </mesh>
        </group>
      </Part>
      <Part id="test" offset={[-1.5, 1, 1]} labelAt={[-1.8, 1.9, 0.6]}>
        <mesh position={[-1.8, 1.6, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.3, 20]} />
          <meshStandardMaterial color="#facc15" roughness={0.4} />
        </mesh>
      </Part>
    </group>
  )
}

/* ================================================================== multímetro */

export type ModoMulti = 'V~' | 'A' | 'Ω' | 'OFF'

export interface MultimetroParams {
  modo: ModoMulti
  /** dónde está conectado: en paralelo con la lámpara o en serie */
  conexion: 'paralelo' | 'serie'
}

export const MULTI_PARTS = [
  { id: 'cuerpo', name: 'Cuerpo y funda', desc: 'Instrumento portátil. La funda de goma lo protege de golpes.' },
  { id: 'display', name: 'Display', desc: 'Pantalla digital donde se lee la medición con su unidad.' },
  { id: 'selector', name: 'Llave selectora', desc: 'Elige la magnitud y el rango: V~ (tensión alterna), V⎓ (continua), A (corriente) y Ω (resistencia, ¡siempre sin tensión!).' },
  { id: 'bornes', name: 'Bornes', desc: 'COM (negro, común) y V/Ω (rojo). Para medir corriente se pasa la punta roja al borne A.' },
  { id: 'puntas', name: 'Puntas de prueba', desc: 'Cables con puntas aisladas. Se toman sólo de la parte aislada.' },
]

/** Lectura del multímetro midiendo una lámpara de 60 W / 220 V. */
export function lectura({ modo, conexion }: MultimetroParams): { text: string; ok: boolean; msg: string } {
  if (modo === 'OFF') return { text: '', ok: true, msg: 'Apagado.' }
  if (modo === 'V~')
    return conexion === 'paralelo'
      ? { text: '220.4 V', ok: true, msg: 'Bien: la tensión se mide en PARALELO con el elemento.' }
      : { text: '0.0 V', ok: false, msg: 'Así no: en serie el voltímetro corta el circuito (tiene resistencia muy alta) y la lámpara se apaga.' }
  if (modo === 'A')
    return conexion === 'serie'
      ? { text: '0.27 A', ok: true, msg: 'Bien: la corriente se mide en SERIE, abriendo el circuito e intercalando el amperímetro.' }
      : { text: 'FUSE', ok: false, msg: '¡Peligro! En paralelo el amperímetro (resistencia casi cero) hace un cortocircuito: se quema su fusible o el instrumento.' }
  return { text: '---', ok: false, msg: 'La resistencia se mide SIEMPRE sin tensión: hay que cortar la energía y desconectar el elemento. Una lámpara de 60 W fría mide unos 60 Ω.' }
}

const MODES: ModoMulti[] = ['OFF', 'V~', 'A', 'Ω']

export function MultimetroModel(p: MultimetroParams) {
  const l = lectura(p)
  const disp = useCanvasTexture(
    320,
    140,
    (ctx, w, h) => {
      ctx.fillStyle = p.modo === 'OFF' ? '#56614f' : '#b7c9a0'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#111'
      ctx.font = 'bold 64px monospace'
      ctx.textAlign = 'right'
      ctx.fillText(l.text, w - 18, 92)
      ctx.font = 'bold 22px system-ui'
      ctx.textAlign = 'left'
      if (p.modo !== 'OFF') ctx.fillText(p.modo === 'V~' ? 'AC' : p.modo === 'A' ? 'AC' : '', 14, 30)
    },
    [l.text, p.modo],
  )
  const dial = useCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#1f2937'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#f8fafc'
      ctx.font = 'bold 28px system-ui'
      ctx.textAlign = 'center'
      MODES.forEach((m, i) => {
        const a = -Math.PI / 2 + (i - 1.5) * 0.7
        ctx.fillStyle = m === p.modo ? '#facc15' : '#f8fafc'
        ctx.fillText(m, w / 2 + Math.cos(a) * 100, h / 2 + Math.sin(a) * 100 + 10)
      })
    },
    [p.modo],
  )
  const idx = MODES.indexOf(p.modo)
  return (
    <group rotation={[-0.5, 0, 0]}>
      <Part id="cuerpo" offset={[0, 0, -1.5]} labelAt={[-2.2, -3.6, 0.6]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[4.4, 8, 1.2]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.45]}>
          <boxGeometry args={[3.8, 7.4, 0.4]} />
          <meshStandardMaterial color="#27272a" roughness={0.5} />
        </mesh>
      </Part>
      <Part id="display" offset={[0, 0.6, 1.2]} labelAt={[0, 3.6, 0.8]}>
        <mesh position={[0, 2.5, 0.67]}>
          <planeGeometry args={[3.2, 1.4]} />
          <meshStandardMaterial map={disp} roughness={0.3} />
        </mesh>
      </Part>
      <Part id="selector" offset={[0, 0, 1.5]} labelAt={[1.6, 0.4, 0.8]}>
        <mesh position={[0, 0, 0.66]}>
          <planeGeometry args={[3.2, 3.2]} />
          <meshStandardMaterial map={dial} />
        </mesh>
        <group position={[0, 0, 0.75]} rotation={[0, 0, -(idx - 1.5) * 0.7]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.9, 0.9, 0.3, 32]} />
            <meshStandardMaterial color="#111827" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.55, 0.18]}>
            <boxGeometry args={[0.18, 0.7, 0.1]} />
            <meshStandardMaterial color="#facc15" />
          </mesh>
        </group>
      </Part>
      <Part id="bornes" offset={[0, -1, 1]} labelAt={[0, -2.5, 0.8]}>
        {[
          [-1.1, '#dc2626'],
          [0, '#111'],
          [1.1, '#dc2626'],
        ].map(([x, c]) => (
          <mesh key={x as number} position={[x as number, -3.0, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.28, 0.28, 0.2, 20]} />
            <meshStandardMaterial color={c as string} roughness={0.4} />
          </mesh>
        ))}
      </Part>
      <Part id="puntas" offset={[0, -2, 1]} labelAt={[2.6, -4.6, 0.8]}>
        <Lead from={[0, -3.0, 0.8]} to={[-1.6, -5.4, 1.6]} color="#111" />
        <Lead from={[p.modo === 'A' ? -1.1 : 1.1, -3.0, 0.8]} to={[1.8, -5.4, 1.6]} color="#dc2626" />
      </Part>
    </group>
  )
}

function Lead({ from, to, color }: { from: [number, number, number]; to: [number, number, number]; color: string }) {
  const geo = useMemo(() => {
    const mid = new THREE.Vector3((from[0] + to[0]) / 2, Math.min(from[1], to[1]) - 0.6, (from[2] + to[2]) / 2 + 0.6)
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(...from), mid, new THREE.Vector3(...to)])
    return new THREE.TubeGeometry(c, 30, 0.08, 8, false)
  }, [from, to])
  return (
    <>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={to} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.12, 1.2, 12]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[to[0], to[1] - 0.8, to[2] - 0.25]} rotation={[0.3, 0, 0]}>
        <coneGeometry args={[0.06, 0.5, 8]} />
        <meshStandardMaterial color="#d1d5db" metalness={0.9} roughness={0.3} />
      </mesh>
    </>
  )
}
