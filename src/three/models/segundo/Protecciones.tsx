import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Part } from '../../Part'
import { latheGeometry, useCanvasTexture } from '../../helpers'
import { useKeepRendering } from '../../keepRendering'
import { Bulb, EM, PorcelainHolder, ScrewHead } from '../electricShared'

const metalMat = { color: '#c9ccd1', metalness: 0.9, roughness: 0.3 }
const copper = { color: '#c27a3a', metalness: 0.85, roughness: 0.35 }

/* ================================================================== carcasa de los aparatos de riel DIN */

// Perfil de costado de un aparato modular (escala 0,08 unidades por mm): 70 mm de fondo y 90 mm de alto,
// con la ventana frontal de 45 mm y el canal del riel DIN atrás. x = fondo (atrás → adelante), y = alto.
const OUTER: [number, number][] = [
  [-2.8, -3.6],
  [0.9, -3.6],
  [0.9, -1.85],
  [2.8, -1.85],
  [2.8, 1.85],
  [0.9, 1.85],
  [0.9, 3.6],
  [-2.8, 3.6],
  [-2.8, 1.45],
  [-2.35, 1.45],
  [-2.35, -1.45],
  [-2.8, -1.45],
]
const INNER: [number, number][] = [
  [-2.65, -3.45],
  [0.75, -3.45],
  [0.75, -1.7],
  [2.65, -1.7],
  [2.65, 1.7],
  [0.75, 1.7],
  [0.75, 3.45],
  [-2.65, 3.45],
  [-2.65, 1.6],
  [-2.2, 1.6],
  [-2.2, -1.6],
  [-2.65, -1.6],
]
const shapeOf = (pts: [number, number][]) => new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)))

/**
 * Media carcasa abierta (se ve el interior desde +z) y, si no está en corte, la tapa transparente.
 * `width` = ancho del aparato (1,44 por polo).
 */
function Housing({ width, corte, face }: { width: number; corte: boolean; face?: THREE.Texture | null }) {
  const geo = useMemo(() => {
    const rim = shapeOf(OUTER)
    rim.holes.push(new THREE.Path(INNER.map(([x, y]) => new THREE.Vector2(x, y))))
    return {
      back: new THREE.ExtrudeGeometry(shapeOf(OUTER), { depth: 0.12, bevelEnabled: false }),
      rim: new THREE.ExtrudeGeometry(rim, { depth: width, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 }),
      cover: new THREE.ExtrudeGeometry(shapeOf(OUTER), { depth: 0.04, bevelEnabled: false }),
    }
  }, [width])
  const z0 = -width / 2
  return (
    <group>
      <mesh geometry={geo.back} position={[0, 0, z0]} material={EM.housingIn} receiveShadow />
      <mesh geometry={geo.rim} position={[0, 0, z0]} material={EM.housing} castShadow receiveShadow />
      {/* nervios internos que sostienen las piezas */}
      {[
        [-1.6, 2.2, 1.6, 0.1],
        [-0.4, -0.2, 0.1, 1.6],
        [-2.0, -0.6, 0.9, 0.1],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, z0 + 0.3]} material={EM.housingIn}>
          <boxGeometry args={[w, h, 0.5]} />
        </mesh>
      ))}
      {!corte && (
        <mesh geometry={geo.cover} position={[0, 0, -z0 - 0.02]}>
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.16} roughness={0.08} depthWrite={false} />
        </mesh>
      )}
      {/* frente impreso de la ventana */}
      {face && (
        <mesh position={[2.81, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[width - 0.08, 3.6]} />
          <meshStandardMaterial map={face} roughness={0.5} />
        </mesh>
      )}
      {/* tramo de riel DIN (perfil sombrero de 35 mm) */}
      <group position={[-2.95, 0, 0]}>
        <mesh material={EM.nickel}>
          <boxGeometry args={[0.08, 2.0, width + 2.4]} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[0.28, s * 1.0, 0]} material={EM.nickel}>
              <boxGeometry args={[0.56, 0.08, width + 2.4]} />
            </mesh>
            <mesh position={[0.56, s * 1.22, 0]} material={EM.nickel}>
              <boxGeometry args={[0.08, 0.5, width + 2.4]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

/** Borne de jaula con su tornillo, que se ajusta desde el hombro de adelante. */
function Terminal({ y }: { y: number }) {
  const s = Math.sign(y)
  return (
    <group position={[-0.3, y, 0]}>
      <mesh material={EM.nickel}>
        <boxGeometry args={[0.95, 0.62, 0.95]} />
      </mesh>
      {/* tornillo: va del hombro (x = 0,9) hasta la jaula */}
      <mesh position={[0.75, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={EM.steel}>
        <cylinderGeometry args={[0.13, 0.13, 0.8, 12]} />
      </mesh>
      <ScrewHead r={0.26} position={[1.18, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
      {/* boca por donde entra el cable */}
      <mesh position={[0, s * 0.35, 0]} rotation={[s * -Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.6, 0.6]} />
        <meshStandardMaterial color="#1b1c1f" />
      </mesh>
    </group>
  )
}

/** Palanca que asoma por el frente; gira en (2,2 ; 0,55). `up` = cerrado. */
function Toggle({ up, color = '#26282c' }: { up: boolean; color?: string }) {
  return (
    <group position={[2.2, 0.55, 0]} rotation={[0, 0, up ? 0.45 : -0.45]}>
      <mesh position={[0.25, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={EM.housingIn}>
        <cylinderGeometry args={[0.3, 0.3, 1.0, 20]} />
      </mesh>
      <RoundedBox args={[1.35, 0.42, 0.95]} radius={0.12} smoothness={3} position={[1.05, 0, 0]} castShadow>
        <meshStandardMaterial color={color} roughness={0.4} />
      </RoundedBox>
    </group>
  )
}

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
  { id: 'carcasa', name: 'Carcasa', desc: 'De material aislante y autoextinguible, de 18 mm de ancho por polo. Atrás tiene el canal que se encastra en el riel DIN; adelante, la ventana de 45 mm con la palanca y los datos (curva C, 16 A, 230/400 V, 4500 A).' },
  { id: 'palanca', name: 'Palanca de maniobra', desc: 'Arriba = cerrado (ON). Cuando el interruptor dispara, baja sola. Se rearma subiéndola a mano.' },
  { id: 'contactos', name: 'Contactos', desc: 'Uno fijo y uno móvil, con pastillas de aleación de plata. Al separarse cortan la corriente. Una malla de cobre flexible lleva la corriente al contacto móvil.' },
  { id: 'bimetal', name: 'Bimetal (parte térmica)', desc: 'Dos metales soldados que se dilatan distinto. Con una SOBRECARGA se calienta, se curva de a poco y destraba el mecanismo. Tarda segundos o minutos: depende de cuánto se pase la corriente.' },
  { id: 'bobina', name: 'Bobina (parte magnética)', desc: 'Con un CORTOCIRCUITO la corriente es enorme: la bobina se vuelve un imán fuerte, el percutor golpea y abre los contactos en milésimas de segundo.' },
  { id: 'camara', name: 'Cámara apagachispas', desc: 'Placas metálicas que dividen y enfrían el arco eléctrico que se forma al abrir los contactos.' },
  { id: 'bornes', name: 'Bornes', desc: 'Jaulas con tornillo donde se ajustan los cables: arriba la entrada (de la línea) y abajo la salida (a los circuitos).' },
]

function Bimetal({ bend }: { bend: number }) {
  // tira curva: se arma con una curva cuya flecha depende de la temperatura
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 12; i++) {
      const t = i / 12
      pts.push(new THREE.Vector3(Math.sin(t * Math.PI * 0.5) * bend * 0.7, -t * 1.9, 0))
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.08, 6, false)
  }, [bend])
  return (
    <group>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial color="#b45309" metalness={0.7} roughness={0.35} emissive="#ef4444" emissiveIntensity={bend * 1.2} />
      </mesh>
      <mesh geometry={geo} position={[0.11, 0, 0]}>
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}

function usePiaFace() {
  return useCanvasTexture(
    96,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#f2f1ec'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#1d1f23'
      ctx.textAlign = 'center'
      ctx.font = 'bold 30px Arial'
      ctx.fillText('C16', w / 2, h - 82)
      ctx.font = '15px Arial'
      ctx.fillText('230/400V~', w / 2, h - 58)
      ctx.strokeRect(w / 2 - 22, h - 46, 44, 22)
      ctx.fillText('4500', w / 2, h - 30)
      ctx.fillStyle = '#16a34a'
      ctx.fillRect(w / 2 - 8, 22, 16, 10)
    },
    [],
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
  const face = usePiaFace()
  const braid = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.0, 0.55, 0), new THREE.Vector3(0.5, 0.1, 0.2), new THREE.Vector3(0.95, -0.3, 0)]), 20, 0.07, 6, false), [])
  return (
    <group position={[0, 0.2, 0]}>
      <Part id="carcasa" offset={[0, 0, -3]} labelAt={[-2.4, 3.9, 0]}>
        <Housing width={1.44} corte={corte} face={face} />
      </Part>
      <Part id="palanca" offset={[1.5, 0, 1]} labelAt={[3.6, 1.6, 0.5]}>
        <Toggle up={!open} />
        {/* biela que une la palanca con el mecanismo del contacto */}
        <mesh position={[1.75, -0.05, 0.1]} rotation={[0, 0, open ? 0.9 : 1.2]} material={EM.steel}>
          <cylinderGeometry args={[0.04, 0.04, 1.1, 8]} />
        </mesh>
      </Part>
      <Part id="bornes" offset={[0, 0, 1.5]} labelAt={[-0.3, 3.4, 0.6]}>
        <Terminal y={2.85} />
        <Terminal y={-2.85} />
        {/* pletina que baja del borne de abajo hacia el contacto fijo y la cámara */}
        <mesh position={[-0.75, -2.2, 0]} material={EM.copper}>
          <boxGeometry args={[0.12, 0.9, 0.5]} />
        </mesh>
      </Part>
      <Part id="bobina" offset={[-1.5, 0.5, 1]} labelAt={[-1.5, 2.5, 0.6]}>
        <group position={[-1.5, 1.35, 0]}>
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
      <Part id="bimetal" offset={[1.5, 0.5, 1]} labelAt={[0.3, 1.6, 0.6]}>
        <group position={[-0.1, 2.45, 0]}>
          <Bimetal bend={heat} />
        </group>
        {/* malla flexible de cobre hasta el contacto móvil */}
        <mesh geometry={braid} position={[-0.1, 0, 0]}>
          <meshStandardMaterial {...copper} roughness={0.7} />
        </mesh>
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
      <Part id="camara" offset={[-1.5, -1, 1]} labelAt={[-1.7, -1.4, 0.7]}>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} position={[-1.55, -2.5 + i * 0.22, 0]}>
            <boxGeometry args={[1.0, 0.07, 0.95]} />
            <meshStandardMaterial color="#6b7280" metalness={0.8} roughness={0.35} />
          </mesh>
        ))}
        {/* soportes de fibra que sostienen las placas */}
        {[-0.48, 0.48].map((z) => (
          <mesh key={z} position={[-1.55, -1.85, z]}>
            <boxGeometry args={[1.1, 1.6, 0.05]} />
            <meshStandardMaterial color="#5b4636" roughness={0.8} />
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
  { id: 'carcasa', name: 'Carcasa', desc: 'Aislante, de 2 módulos (bipolar, 36 mm). Se monta en el riel DIN, en general antes del termomagnético.' },
  { id: 'toroide', name: 'Transformador toroidal', desc: 'Anillo de hierro por el que pasan la fase y el neutro. Si las dos corrientes son iguales sus efectos se anulan; si no (se escapa corriente a tierra), aparece una diferencia.' },
  { id: 'fase', name: 'Conductor de fase', desc: 'La corriente que ENTRA al circuito.' },
  { id: 'neutro', name: 'Conductor de neutro', desc: 'La corriente que VUELVE. Por la ley de Kirchhoff, si no hay fugas, es igual a la de la fase.' },
  { id: 'bobina', name: 'Bobina detectora', desc: 'Arrollada sobre el toroide. Cuando hay diferencia de corrientes genera una señal que acciona el relé.' },
  { id: 'rele', name: 'Relé de disparo', desc: 'Recibe la señal de la bobina y abre los contactos en menos de 30 ms.' },
  { id: 'test', name: 'Botón de prueba (T)', desc: 'Provoca una fuga artificial para comprobar que el diferencial funciona. Se recomienda probarlo una vez por mes.' },
]

function Arrow({ dir, color, scale }: { dir: 1 | -1; color: string; scale: number }) {
  return (
    <group rotation={[0, 0, dir === 1 ? 0 : Math.PI]} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.3, 0]}>
        <coneGeometry args={[0.2, 0.42, 12]} />
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
  const W = 2.88
  const face = useCanvasTexture(
    192,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#f2f1ec'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#1d1f23'
      ctx.textAlign = 'center'
      ctx.font = 'bold 26px Arial'
      ctx.fillText('ID 2×25A', w / 2, h - 96)
      ctx.font = 'bold 22px Arial'
      ctx.fillText(`IΔn ${sensibilidad} mA`, w / 2, h - 70)
      ctx.fillStyle = tripped ? '#dc2626' : '#16a34a'
      ctx.fillRect(w / 2 - 60, h - 52, 120, 30)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 18px Arial'
      ctx.fillText(tripped ? 'DISPARÓ' : 'CERRADO', w / 2, h - 31)
      ctx.fillStyle = '#1d1f23'
      ctx.font = '16px Arial'
      ctx.fillText(`fuga: ${fuga} mA`, w / 2, h - 6)
    },
    [tripped, fuga, sensibilidad],
  )
  const iN = Math.max(0.2, 1 - fuga / 100)
  const TX = -0.9 // centro del toroide (en x)
  const TY = 0.55
  return (
    <group>
      <Part id="carcasa" offset={[0, 0, -3]} labelAt={[-2.4, 3.9, 0]}>
        <Housing width={W} corte={false} face={face} />
        <Toggle up={!tripped} color="#1d4ed8" />
        <Terminal y={2.85} />
        <Terminal y={-2.85} />
      </Part>
      <Part id="toroide" offset={[0, 0, 2]} labelAt={[0.5, TY + 0.4, 0.6]}>
        {/* anillo horizontal: la fase y el neutro lo atraviesan por el medio */}
        <mesh position={[TX, TY, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[1.0, 0.3, 16, 40]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.4} emissive="#a855f7" emissiveIntensity={Math.min(1.5, fuga / 20)} />
        </mesh>
      </Part>
      <Part id="fase" offset={[-1, 0, 1]} labelAt={[TX, 2.4, -0.4]}>
        <mesh position={[TX, 0.4, -0.35]}>
          <cylinderGeometry args={[0.12, 0.12, 4.6, 12]} />
          <meshStandardMaterial color="#7c4a21" roughness={0.5} />
        </mesh>
        <group position={[TX - 0.45, -1.2, -0.35]}>
          <Arrow dir={-1} color="#f59e0b" scale={1} />
        </group>
      </Part>
      <Part id="neutro" offset={[1, 0, 1]} labelAt={[TX, 2.4, 0.4]}>
        <mesh position={[TX, 0.4, 0.35]}>
          <cylinderGeometry args={[0.12, 0.12, 4.6, 12]} />
          <meshStandardMaterial color="#5ab4e5" roughness={0.5} />
        </mesh>
        <group position={[TX + 0.45, -1.2, 0.35]}>
          <Arrow dir={1} color="#38bdf8" scale={iN} />
        </group>
      </Part>
      <Part id="bobina" offset={[2, 0, 1]} labelAt={[0.4, -0.4, 0.6]}>
        {/* vueltas de alambre esmaltado alrededor del tubo del toroide, del lado de adelante */}
        {Array.from({ length: 9 }, (_, i) => {
          const a = -0.7 + i * 0.16
          return (
            <mesh key={i} position={[TX + Math.cos(a) * 1.0, TY, Math.sin(a) * 1.0]} rotation={[0, -a, 0]}>
              <torusGeometry args={[0.36, 0.04, 6, 16]} />
              <meshStandardMaterial {...copper} />
            </mesh>
          )
        })}
      </Part>
      <Part id="rele" offset={[2, -1, 1]} labelAt={[0.3, -2.3, 0.6]}>
        <group position={[0.1, -1.7, 0]}>
          <RoundedBox args={[0.9, 0.8, 0.9]} radius={0.08} smoothness={2}>
            <meshStandardMaterial color="#1e3a8a" roughness={0.5} />
          </RoundedBox>
          <mesh position={[0, 0.55 + (tripped ? 0.25 : 0), 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.4, 10]} />
            <meshStandardMaterial {...metalMat} />
          </mesh>
        </group>
      </Part>
      <Part id="test" offset={[1.5, 0, 0]} labelAt={[3.3, -1.0, 0.6]}>
        <mesh position={[2.88, -0.95, 0.75]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.22, 20]} />
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
  { id: 'cuerpo', name: 'Cuerpo y funda', desc: 'Instrumento portátil. La funda de goma lo protege de golpes y tiene un pie para dejarlo inclinado.' },
  { id: 'display', name: 'Display', desc: 'Pantalla de cristal líquido donde se lee la medición con su unidad (y si es alterna, AC).' },
  { id: 'selector', name: 'Llave selectora', desc: 'Elige la magnitud y el rango: V~ (tensión alterna), V⎓ (continua), A (corriente) y Ω (resistencia, ¡siempre sin tensión!).' },
  { id: 'bornes', name: 'Bornes', desc: 'COM (negro, común), VΩmA (rojo) y 10A (para corrientes grandes). Para medir corriente se pasa la punta roja al borne A.' },
  { id: 'puntas', name: 'Puntas de prueba', desc: 'Cables con fichas banana y puntas aisladas con protección para los dedos. Se toman sólo de la parte aislada.' },
  { id: 'lampara', name: 'Lámpara que se mide', desc: 'Lámpara de 60 W / 220 V en su portalámparas, conectada a la red. Mirá dónde apoya cada punta según lo que mide.' },
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

/** Ángulo de la perilla (rad, 0 = arriba, positivo = hacia la derecha) de cada posición seleccionable. */
const DIAL: Record<ModoMulti, number> = { OFF: 0, 'V~': -0.55, A: 1.75, Ω: 0.95 }
/** Rótulos del dial (algunos son rangos que no se usan en esta actividad, como en el instrumento real). */
const DIAL_LABELS: [string, number, string][] = [
  ['OFF', 0, '#f8fafc'],
  ['V~', -0.55, '#fca5a5'],
  ['V⎓', -1.1, '#f8fafc'],
  ['mV', -1.6, '#f8fafc'],
  ['→|', -2.1, '#f8fafc'],
  ['Ω', 0.95, '#93c5fd'],
  ['hFE', 0.45, '#f8fafc'],
  ['A', 1.75, '#fde68a'],
  ['mA', 2.25, '#fde68a'],
]

/** Punta de prueba: ficha banana atrás, cable, mango con protección para los dedos y aguja. Eje = −y (aguja abajo). */
function Probe({ color }: { color: string }) {
  const g = useMemo(
    () =>
      latheGeometry(
        [
          [0.01, 0.15],
          [0.09, 0.3],
          [0.13, 0.8],
          [0.24, 0.85],
          [0.24, 0.98],
          [0.15, 1.05],
          [0.15, 2.9],
          [0.11, 3.1],
          [0.01, 3.15],
        ],
        24,
        0.05,
      ),
    [],
  )
  return (
    <group>
      <mesh position={[0, 0.08, 0]} material={EM.nickel}>
        <cylinderGeometry args={[0.025, 0.012, 0.36, 8]} />
      </mesh>
      <mesh geometry={g} castShadow>
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
    </group>
  )
}

export function MultimetroModel(p: MultimetroParams) {
  const l = lectura(p)
  const S = 0.58 // cm → unidades
  const disp = useCanvasTexture(
    480,
    200,
    (ctx, w, h) => {
      ctx.fillStyle = p.modo === 'OFF' ? '#6a7563' : '#b9c8a4'
      ctx.fillRect(0, 0, w, h)
      if (p.modo === 'OFF') return
      ctx.fillStyle = 'rgba(17,17,17,0.08)'
      ctx.font = 'bold 120px monospace'
      ctx.textAlign = 'right'
      ctx.fillText('8.8.8.8', w - 30, 150)
      ctx.fillStyle = '#111'
      ctx.fillText(l.text.replace(/ [VA]$/, ''), w - 30, 150)
      ctx.font = 'bold 30px Arial'
      ctx.textAlign = 'left'
      ctx.fillText(p.modo === 'V~' || p.modo === 'A' ? 'AC' : '', 18, 40)
      ctx.textAlign = 'right'
      ctx.fillText(p.modo === 'V~' ? 'V' : p.modo === 'A' ? 'A' : 'Ω', w - 18, 190)
      ctx.fillText('AUTO', w - 18, 40)
    },
    [l.text, p.modo],
  )
  const plate = useCanvasTexture(
    512,
    1024,
    (ctx, w, h) => {
      ctx.fillStyle = '#2b2d31'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#e5e7eb'
      ctx.textAlign = 'center'
      ctx.font = 'bold 30px Arial'
      ctx.fillText('DIGITAL MULTIMETER', w / 2, 360)
      // anillo del dial con sus rótulos
      const cx = w / 2
      const cy = 610
      ctx.strokeStyle = '#4b5563'
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.arc(cx, cy, 170, 0, Math.PI * 2)
      ctx.stroke()
      ctx.font = 'bold 30px Arial'
      for (const [t, a, c] of DIAL_LABELS) {
        ctx.fillStyle = c
        ctx.fillText(t, cx + Math.sin(a) * 205, cy - Math.cos(a) * 205 + 11)
        ctx.fillRect(cx + Math.sin(a) * 172 - 3, cy - Math.cos(a) * 172 - 3, 6, 6)
      }
      // bornes
      ;[
        ['10A', 110, '#fde68a'],
        ['COM', 256, '#e5e7eb'],
        ['VΩmA', 402, '#fca5a5'],
      ].forEach(([t, x, c]) => {
        ctx.fillStyle = c as string
        ctx.fillText(t as string, x as number, 860)
      })
      ctx.font = '18px Arial'
      ctx.fillStyle = '#fca5a5'
      ctx.fillText('CAT III 600V', 256, 990)
    },
    [],
  )
  const idx = DIAL[p.modo]
  // lámpara de prueba
  const glow = (p.modo === 'V~' && p.conexion === 'paralelo') || (p.modo === 'A' && p.conexion === 'serie') || (p.modo === 'OFF' && p.conexion === 'paralelo') ? 0.85 : 0
  const LX = 6.2
  const holderS = 0.03
  const term = (s: number): THREE.Vector3 => new THREE.Vector3(LX + s * 12 * holderS, 14.8 * holderS, 6 * holderS + 0.6)
  // dónde apoyan las puntas: en paralelo, sobre los dos bornes; en serie, en el corte del cable marrón
  const cut = new THREE.Vector3(LX - 2.2, 0.08, 2.4)
  const redTip = p.conexion === 'paralelo' ? term(1) : cut.clone().add(new THREE.Vector3(0.35, 0, 0))
  const blackTip = p.conexion === 'paralelo' ? term(-1) : cut.clone().add(new THREE.Vector3(-0.35, 0, 0))
  // bornes del multímetro en coordenadas de la escena (el instrumento está inclinado)
  const tilt = -0.38
  const MX = -1.6
  const jack = (x: number) => {
    const v = new THREE.Vector3(x * S, -6.0 * S, 1.95 * S).applyAxisAngle(new THREE.Vector3(1, 0, 0), tilt)
    return v.add(new THREE.Vector3(MX, 7.6 * S * Math.cos(tilt) + 0.1, 0))
  }
  const redJack = jack(p.modo === 'A' ? -2.2 : 2.2)
  const comJack = jack(0)
  const lead = (a: THREE.Vector3, tip: THREE.Vector3) => {
    const top = tip.clone().add(new THREE.Vector3(-0.35, 1.9, 0.5))
    return new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([a, a.clone().add(new THREE.Vector3(0, -0.6, 0.6)), new THREE.Vector3((a.x + top.x) / 2, 0.12, Math.max(a.z, top.z) + 1.2), top.clone().add(new THREE.Vector3(-0.2, 0.6, 0.3)), top]),
      60,
      0.07,
      8,
      false,
    )
  }
  const probeRot = (tip: THREE.Vector3) => {
    const top = tip.clone().add(new THREE.Vector3(-0.35, 1.9, 0.5))
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(tip).normalize())
    return q
  }
  // cable de la lámpara a la red: marrón (fase) y celeste (neutro), con el corte en serie
  const brownA = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(LX + 2.6, 0.08, 4.4), new THREE.Vector3(LX, 0.08, 3.4), new THREE.Vector3(cut.x + 0.45, 0.08, cut.z)]), 30, 0.07, 8, false), [cut.x, cut.z])
  const brownB = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(cut.x - 0.45, 0.08, cut.z), new THREE.Vector3(LX - 1.6, 0.2, 0.9), term(-1).clone().setY(term(-1).y + 0.05)]), 30, 0.07, 8, false), [])
  const brownFull = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(LX + 2.6, 0.08, 4.4), new THREE.Vector3(LX, 0.08, 3.4), new THREE.Vector3(cut.x, 0.08, cut.z), new THREE.Vector3(LX - 1.6, 0.2, 0.9), term(-1)]), 50, 0.07, 8, false), [])
  const blue = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(LX + 2.9, 0.08, 4.2), new THREE.Vector3(LX + 1.6, 0.2, 1.4), term(1)]), 30, 0.07, 8, false), [])
  return (
    <group>
      <group position={[MX, 7.6 * S * Math.cos(tilt) + 0.1, 0]} rotation={[tilt, 0, 0]}>
        <group scale={S}>
          <Part id="cuerpo" offset={[0, 0, -2.5]} labelAt={[-4.5, -5, 1]}>
            <RoundedBox args={[7.6, 15.2, 3.6]} radius={0.9} smoothness={4} castShadow receiveShadow>
              <meshStandardMaterial color="#f2b705" roughness={0.85} />
            </RoundedBox>
            <RoundedBox args={[6.4, 13.6, 0.4]} radius={0.3} smoothness={3} position={[0, 0, 1.75]}>
              <meshStandardMaterial map={plate} roughness={0.55} />
            </RoundedBox>
            {/* pie para dejarlo inclinado */}
            <mesh position={[0, -2, -2.1]} rotation={[0.55, 0, 0]}>
              <boxGeometry args={[4.8, 9, 0.3]} />
              <meshStandardMaterial color="#26282c" roughness={0.6} />
            </mesh>
            {/* botones HOLD y luz */}
            {[-1.6, 1.6].map((x, i) => (
              <RoundedBox key={x} args={[1.6, 0.7, 0.35]} radius={0.15} smoothness={2} position={[x, 2.2, 2.05]}>
                <meshStandardMaterial color={i ? '#f2b705' : '#3b82f6'} roughness={0.5} />
              </RoundedBox>
            ))}
          </Part>
          <Part id="display" offset={[0, 1, 1.5]} labelAt={[0, 7.5, 2]}>
            <RoundedBox args={[5.6, 2.9, 0.2]} radius={0.15} smoothness={2} position={[0, 4.9, 1.98]}>
              <meshStandardMaterial color="#111214" roughness={0.3} />
            </RoundedBox>
            <mesh position={[0, 4.9, 2.09]}>
              <planeGeometry args={[5.0, 2.3]} />
              <meshStandardMaterial map={disp} roughness={0.25} />
            </mesh>
          </Part>
          <Part id="selector" offset={[0, 0, 2]} labelAt={[3, 0.2, 2]}>
            <group position={[0, -0.95, 2.05]} rotation={[0, 0, -idx]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[1.75, 1.8, 0.6, 40]} />
                <meshStandardMaterial color="#1b1c1f" roughness={0.45} />
              </mesh>
              {/* aleta para agarrarla y puntero */}
              <RoundedBox args={[0.9, 3.4, 0.5]} radius={0.2} smoothness={3} position={[0, 0, 0.5]}>
                <meshStandardMaterial color="#26282c" roughness={0.45} />
              </RoundedBox>
              <mesh position={[0, 1.35, 0.76]}>
                <boxGeometry args={[0.18, 0.6, 0.02]} />
                <meshStandardMaterial color="#f8fafc" />
              </mesh>
            </group>
          </Part>
          <Part id="bornes" offset={[0, -1, 1.5]} labelAt={[0, -7.6, 2]}>
            {[
              [-2.2, '#dc2626'],
              [0, '#111'],
              [2.2, '#dc2626'],
            ].map(([x, c]) => (
              <group key={x as number} position={[x as number, -6.0, 1.95]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.48, 0.48, 0.25, 24]} />
                  <meshStandardMaterial color={c as string} roughness={0.4} />
                </mesh>
                <mesh position={[0, 0, 0.13]}>
                  <circleGeometry args={[0.2, 16]} />
                  <meshStandardMaterial color="#0a0a0a" />
                </mesh>
              </group>
            ))}
          </Part>
        </group>
      </group>
      <Part id="puntas" offset={[0, 1, 2]} labelAt={[redTip.x - 0.6, redTip.y + 2.4, redTip.z + 0.4]}>
        <mesh geometry={lead(redJack, redTip)}>
          <meshStandardMaterial color="#dc2626" roughness={0.55} />
        </mesh>
        <mesh geometry={lead(comJack, blackTip)}>
          <meshStandardMaterial color="#141414" roughness={0.55} />
        </mesh>
        <group position={redTip} quaternion={probeRot(redTip)}>
          <Probe color="#dc2626" />
        </group>
        <group position={blackTip} quaternion={probeRot(blackTip)}>
          <Probe color="#141414" />
        </group>
      </Part>
      <Part id="lampara" offset={[2, 0, 0]} labelAt={[LX, 3.6, 0.6]}>
        <group position={[LX, 0, 0.6]}>
          <PorcelainHolder scale={holderS} />
          <group position={[0, (36 - 21) * holderS, 0]}>
            <Bulb glow={glow} scale={holderS} />
          </group>
        </group>
        <mesh geometry={blue}>
          <meshStandardMaterial color="#5ab4e5" roughness={0.5} />
        </mesh>
        {p.conexion === 'serie' ? (
          <>
            <mesh geometry={brownA}>
              <meshStandardMaterial color="#7c4a21" roughness={0.5} />
            </mesh>
            <mesh geometry={brownB}>
              <meshStandardMaterial color="#7c4a21" roughness={0.5} />
            </mesh>
            {/* puntas peladas en el corte */}
            {[0.45, -0.45].map((dx) => (
              <mesh key={dx} position={[cut.x + dx * 0.8, 0.08, cut.z]} rotation={[0, 0, Math.PI / 2]} material={EM.copper}>
                <cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />
              </mesh>
            ))}
          </>
        ) : (
          <mesh geometry={brownFull}>
            <meshStandardMaterial color="#7c4a21" roughness={0.5} />
          </mesh>
        )}
      </Part>
    </group>
  )
}
