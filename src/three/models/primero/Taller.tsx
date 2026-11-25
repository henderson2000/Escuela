import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import { Part } from '../../Part'
import { BallPeenHammer, CenterPunch, Scriber, SteelRule, SurfaceGauge, SurfacePlate, TrySquare } from './herramientas'
import { useCanvasTexture } from '../../helpers'

// Herramientas e instrumentos de banco. 1 unidad = 1 cm.

const STEEL = { color: '#c9ced5', metalness: 0.95, roughness: 0.25 }
const DARK_STEEL = { color: '#5a6069', metalness: 0.85, roughness: 0.4 }
const CAST = { color: '#2f5f8a', metalness: 0.4, roughness: 0.55 }

export const INSTRUMENTOS_PARTS = [
  { id: 'marmol', name: 'Mármol de trazado', desc: 'Placa de granito o fundición perfectamente plana: es la base de referencia para trazar con el gramil.' },
  { id: 'regla', name: 'Regla metálica', desc: 'De acero inoxidable, graduada en milímetros. Se usa para medir, controlar que una cara sea plana (paralelismo) y guiar la punta de trazar. Las más comunes miden 300 mm.' },
  { id: 'escuadra', name: 'Escuadra de 90°', desc: 'Controla que dos caras formen ángulo recto ("estén a escuadra") y sirve para trazar líneas perpendiculares.' },
  { id: 'gramil', name: 'Gramil', desc: 'Traza líneas paralelas a la base a una altura exacta. Se apoya en el mármol; conviene verificar la medida con la regla antes de trazar.' },
  { id: 'punta', name: 'Punta de trazar', desc: 'Varilla de acero templado con punta afilada: raya el metal como un lápiz. Las líneas se ven mejor sobre una capa de sulfato de cobre.' },
  { id: 'granete', name: 'Granete (punto)', desc: 'Barra de acero templado con punta cónica de 120°. Golpeándolo con el martillo marca los centros de los agujeros para que la mecha no se desvíe.' },
  { id: 'martillo', name: 'Martillo de banco', desc: 'Para golpear el granete, la sierra o el cincel. ¡Como el que vas a fabricar en el taller!' },
]

export function InstrumentosModel() {
  return (
    <group>
      <Part id="marmol" offset={[0, -3, 0]} labelAt={[-17, 0.5, 11.5]}>
        <SurfacePlate w={40} d={26} h={6} />
      </Part>
      <Part id="regla" offset={[0, 3, 6]} labelAt={[-10, 0.6, 10.5]}>
        <group position={[-3, 0, 10.5]}>
          <SteelRule length={30} />
        </group>
      </Part>
      <Part id="escuadra" offset={[0, 3, -6]} labelAt={[8, 1.5, -10.5]}>
        <group position={[-2, 0, -12]}>
          <TrySquare blade={20} stock={12} />
        </group>
      </Part>
      <Part id="gramil" offset={[-5, 3, -4]} labelAt={[-13, 24, -8.5]}>
        <group position={[-13, 0, -8.5]} rotation={[0, Math.PI, 0]}>
          <SurfaceGauge height={10} />
        </group>
      </Part>
      <Part id="punta" offset={[0, 3, 0]} labelAt={[12, 1.2, -4]}>
        <group position={[9.5, 0.28, -4]} rotation={[0, 0.1, 0]}>
          <Scriber />
        </group>
      </Part>
      <Part id="granete" offset={[4, 3, 0]} labelAt={[8, 1.5, -0.5]}>
        <group position={[2, 0.5, -0.5]} rotation={[0, 0.15, 0]}>
          <CenterPunch />
        </group>
      </Part>
      <Part id="martillo" offset={[0, 4, 4]} labelAt={[-15, 3.2, 4]}>
        {/* acostado: la cabeza apoya de costado y el mango baja apenas hasta la mesa */}
        <group position={[-15, 1.25, 4]} rotation={[0, 1.52, 0]}>
          <group rotation={[-Math.PI / 2 + 0.02, 0, 0]}>
            <BallPeenHammer len={30} />
          </group>
        </group>
      </Part>
    </group>
  )
}

/* ================================================================== morsa */

export interface MorsaParams {
  apertura: number
  pieza: boolean
}

export const MORSA_PARTS = [
  { id: 'base', name: 'Base', desc: 'Se atornilla al banco de trabajo. La altura de la morsa tiene que quedar a la altura del codo del operario.' },
  { id: 'fija', name: 'Mordaza fija', desc: 'Parte del cuerpo de la morsa que no se mueve.' },
  { id: 'movil', name: 'Mordaza móvil', desc: 'Se acerca o se aleja de la fija al girar el tornillo. Junto con la fija aprietan la pieza.' },
  { id: 'mordazas', name: 'Mordientes (bocas)', desc: 'Placas de acero estriadas que agarran la pieza. Para no marcar piezas terminadas se usan "boquillas" de aluminio o cobre.' },
  { id: 'tornillo', name: 'Tornillo (husillo)', desc: 'Tornillo de rosca que mueve la mordaza móvil.' },
  { id: 'palanca', name: 'Palanca (manija)', desc: 'Se gira con la mano para apretar o aflojar. Nunca se golpea ni se le pone un caño de prolongación.' },
  { id: 'pieza', name: 'Pieza', desc: 'La barra del martillo, sujeta firme y sobresaliendo poco de las mordazas para que no vibre al limar.' },
]

export function MorsaModel({ apertura, pieza }: MorsaParams) {
  const open = 2.4 + (apertura / 100) * 8 // separación entre mordientes (cm)
  const jaws = useCanvasTexture(
    64,
    64,
    (ctx, w, h) => {
      ctx.fillStyle = '#9aa1aa'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#555b63'
      ctx.lineWidth = 3
      for (let k = -h; k < w + h; k += 8) {
        ctx.beginPath()
        ctx.moveTo(k, 0)
        ctx.lineTo(k + h, h)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(k + h, 0)
        ctx.lineTo(k, h)
        ctx.stroke()
      }
    },
    [],
  )
  jaws.wrapS = jaws.wrapT = THREE.RepeatWrapping
  jaws.repeat.set(4, 1)
  return (
    <group>
      <Part id="base" offset={[0, -3, 0]} labelAt={[0, 1, 6]}>
        <RoundedBox args={[14, 2, 10]} radius={0.4} position={[0, 1, 0]} castShadow receiveShadow>
          <meshStandardMaterial {...CAST} />
        </RoundedBox>
        <mesh position={[0, 3, 0]} castShadow>
          <cylinderGeometry args={[4, 4.4, 2, 32]} />
          <meshStandardMaterial {...CAST} />
        </mesh>
      </Part>
      <Part id="fija" offset={[0, 0, -4]} labelAt={[0, 13, -6]}>
        <RoundedBox args={[13, 8, 5]} radius={0.4} position={[0, 8, -4]} castShadow>
          <meshStandardMaterial {...CAST} />
        </RoundedBox>
        {/* yunque chico detrás */}
        <mesh position={[0, 12.4, -5.2]}>
          <boxGeometry args={[6, 0.8, 2.6]} />
          <meshStandardMaterial {...DARK_STEEL} />
        </mesh>
      </Part>
      <Part id="movil" offset={[0, 0, 6]} labelAt={[0, 13, open + 2]}>
        <group position={[0, 0, open]}>
          <RoundedBox args={[13, 7, 4.6]} radius={0.4} position={[0, 8.6, 1.8]} castShadow>
            <meshStandardMaterial {...CAST} />
          </RoundedBox>
          {/* guía que entra en el cuerpo */}
          <mesh position={[0, 6.5, -2.5 - open / 2]}>
            <boxGeometry args={[5, 2.6, 6 + open]} />
            <meshStandardMaterial {...CAST} />
          </mesh>
        </group>
      </Part>
      <Part id="mordazas" offset={[0, 4, 0]} labelAt={[6.5, 12.5, 0]}>
        <mesh position={[0, 10.8, -1.3]} castShadow>
          <boxGeometry args={[12, 2.6, 0.6]} />
          <meshStandardMaterial map={jaws} {...STEEL} />
        </mesh>
        <mesh position={[0, 10.8, open - 0.95]} castShadow>
          <boxGeometry args={[12, 2.6, 0.6]} />
          <meshStandardMaterial map={jaws} {...STEEL} />
        </mesh>
      </Part>
      <Part id="tornillo" offset={[0, -2, 4]} labelAt={[0, 4.5, open + 9]}>
        <mesh position={[0, 6, open + 2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.7, 0.7, 16, 20]} />
          <meshStandardMaterial {...STEEL} />
        </mesh>
      </Part>
      <Part id="palanca" offset={[0, -2, 8]} labelAt={[5, 6, open + 5]}>
        <group position={[0, 6, open + 4.6]} rotation={[0, 0, (apertura / 100) * Math.PI * 3]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.45, 0.45, 13, 16]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
          {[-6.7, 6.7].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <sphereGeometry args={[0.8, 16, 12]} />
              <meshStandardMaterial {...STEEL} />
            </mesh>
          ))}
        </group>
      </Part>
      {pieza && open < 3.4 && (
        <Part id="pieza" offset={[0, 6, 0]} labelAt={[-8, 13.2, 0]}>
          <mesh position={[-1, 11.6, (open - 2.25) / 2]} castShadow>
            <boxGeometry args={[11, 2.2, 2.2]} />
            <meshStandardMaterial color="#b9bec6" metalness={0.9} roughness={0.35} />
          </mesh>
        </Part>
      )}
    </group>
  )
}
