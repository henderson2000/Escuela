import { useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import { Part } from '../../Part'
import { latheGeometry } from '../../helpers'

// Herramientas y máquinas de hojalatería. 1 unidad = 1 cm.

const STEEL = { color: '#c9ced5', metalness: 0.95, roughness: 0.25 }
const DARK = { color: '#3b4049', metalness: 0.7, roughness: 0.45 }
const RED = { color: '#c1121f', roughness: 0.5 }
const GALV = { color: '#c3c9d1', metalness: 0.7, roughness: 0.35 }

export const HERRAMIENTAS_PARTS = [
  { id: 'tijera', name: 'Tijera de hojalatero', desc: 'Corta chapas de hasta 1 mm de espesor. La de corte recto es la más usada: cortes rectos o apenas curvos.' },
  { id: 'martillo', name: 'Martillo de hojalatero', desc: 'Martillo liviano con una boca plana y otra en cuña: asienta pliegues y cierra dobladillos sin marcar la chapa.' },
  { id: 'bigornia', name: 'Bigornia', desc: 'Bloque de acero fundido con dos extremos cónicos de distinta forma. Sirve de apoyo para enderezar o dar forma a la chapa.' },
  { id: 'compas', name: 'Compás de punta seca', desc: 'Traza círculos y arcos sobre la chapa; también compara y traslada medidas.' },
  { id: 'punta', name: 'Punta de trazar', desc: 'Varilla de acero templado afilada: se toma como un lápiz para rayar la chapa.' },
  { id: 'granete', name: 'Granete', desc: 'Punta cónica a 120°: marca puntos golpeando con el martillo (también hay automáticos, que se accionan con la mano).' },
  { id: 'escuadra', name: 'Escuadra de 90°', desc: 'Comprueba que la chapa esté cortada a escuadra y traza perpendiculares y líneas a 45°.' },
]

/** Hoja de tijera (perfil plano extruido). */
function Blade({ flip }: { flip: number }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, 0)
    s.quadraticCurveTo(5, 0.9 * flip, 9, 0.15 * flip)
    s.lineTo(9, -0.2 * flip)
    s.quadraticCurveTo(4.5, -0.25 * flip, 0, -0.5 * flip)
    s.closePath()
    return new THREE.ExtrudeGeometry(s, { depth: 0.25, bevelEnabled: false })
  }, [flip])
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial {...STEEL} />
    </mesh>
  )
}

export function HerramientasModel() {
  const anvilHorn = useMemo(() => new THREE.ConeGeometry(1.6, 9, 32).rotateZ(Math.PI / 2), [])
  const punch = useMemo(() => latheGeometry([[0, 0], [0.22, 0.13], [0.3, 2.5], [0.42, 3.4], [0.42, 10], [0.36, 10.6], [0, 10.7]], 24).rotateZ(-Math.PI / 2), [])
  return (
    <group>
      {/* banco */}
      <mesh position={[0, -1, 0]} receiveShadow>
        <boxGeometry args={[60, 2, 34]} />
        <meshStandardMaterial color="#8a6a48" roughness={0.85} />
      </mesh>
      <Part id="tijera" offset={[0, 4, 4]} labelAt={[-18, 2.5, 8]}>
        <group position={[-24, 0.3, 8]} rotation={[-Math.PI / 2, 0, 0.2]}>
          <group position={[9, 0, 0]}>
            <Blade flip={1} />
            <group position={[0, 0, 0.3]}>
              <Blade flip={-1} />
            </group>
          </group>
          {[1, -1].map((s) => (
            <mesh key={s} position={[-2.5, 0.9 * s, 0.25]} rotation={[0, 0, 0.18 * s]} castShadow>
              <boxGeometry args={[11, 0.7, 0.7]} />
              <meshStandardMaterial {...RED} />
            </mesh>
          ))}
          <mesh position={[8.6, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 0.9, 16]} />
            <meshStandardMaterial {...DARK} />
          </mesh>
        </group>
      </Part>
      <Part id="martillo" offset={[0, 4, 0]} labelAt={[-8, 3, -8]}>
        <group position={[-8, 1, -8]} rotation={[0, 0.4, 0]}>
          <mesh position={[0, 0.6, 0]} castShadow>
            <boxGeometry args={[1.6, 1.6, 7]} />
            <meshStandardMaterial {...DARK} />
          </mesh>
          <mesh position={[0, 0.6, -4.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.8, 0.8, 1.4, 24]} />
            <meshStandardMaterial {...DARK} />
          </mesh>
          <mesh position={[0, 0.3, 4.1]} rotation={[0.25, 0, 0]} castShadow>
            <boxGeometry args={[1.6, 0.5, 1.6]} />
            <meshStandardMaterial {...DARK} />
          </mesh>
          <mesh position={[11, 0.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.6, 0.7, 20, 16]} />
            <meshStandardMaterial color="#b98552" roughness={0.5} />
          </mesh>
        </group>
      </Part>
      <Part id="bigornia" offset={[0, 6, -4]} labelAt={[16, 9, -6]}>
        <group position={[16, 0, -6]}>
          <mesh position={[0, 2, 0]} castShadow>
            <cylinderGeometry args={[2.6, 3.6, 4, 24]} />
            <meshStandardMaterial {...DARK} />
          </mesh>
          <mesh position={[0, 5.2, 0]} castShadow>
            <boxGeometry args={[6, 2.6, 3.6]} />
            <meshStandardMaterial {...DARK} />
          </mesh>
          <mesh geometry={anvilHorn} position={[7.4, 5.4, 0]} castShadow>
            <meshStandardMaterial {...DARK} />
          </mesh>
          <mesh position={[-5.5, 5.6, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
            <coneGeometry args={[1.3, 5, 4]} />
            <meshStandardMaterial {...DARK} />
          </mesh>
        </group>
      </Part>
      <Part id="compas" offset={[0, 4, 4]} labelAt={[4, 2, 10]}>
        <group position={[4, 0.3, 9]} rotation={[-Math.PI / 2, 0, -0.3]}>
          {[-0.18, 0.18].map((a) => (
            <mesh key={a} position={[Math.sin(a) * 6, 6 - Math.cos(a) * 6, 0]} rotation={[0, 0, a]} castShadow>
              <cylinderGeometry args={[0.2, 0.06, 12, 12]} />
              <meshStandardMaterial {...STEEL} />
            </mesh>
          ))}
          <mesh position={[0, 6.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.6, 0.6, 0.5, 16]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
        </group>
      </Part>
      <Part id="punta" offset={[0, 4, 4]} labelAt={[14, 1.5, 10]}>
        <mesh position={[14, 0.3, 10]} rotation={[0, 0.3, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.22, 0.03, 15, 12]} />
          <meshStandardMaterial {...STEEL} />
        </mesh>
      </Part>
      <Part id="granete" offset={[0, 4, 4]} labelAt={[22, 1.5, 6]}>
        <mesh geometry={punch} position={[19, 0.45, 5]} rotation={[0, -0.4, 0]} castShadow>
          <meshStandardMaterial {...STEEL} />
        </mesh>
      </Part>
      <Part id="escuadra" offset={[0, 4, -4]} labelAt={[-22, 2, -8]}>
        <group position={[-24, 0.1, -12]}>
          <mesh position={[0, 0, 4]} castShadow>
            <boxGeometry args={[1.8, 0.25, 10]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
          <mesh position={[3.6, 0, -0.1]} castShadow>
            <boxGeometry args={[9, 0.25, 1.8]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
        </group>
      </Part>
    </group>
  )
}

/* ================================================================== plegadora manual */

export interface PlegadoraParams {
  angulo: number
}

export const PLEGADORA_PARTS = [
  { id: 'bancada', name: 'Bancada', desc: 'Estructura de la máquina. Las manuales chicas pliegan chapa de hasta 1 mm de espesor.' },
  { id: 'pisador', name: 'Pisador (punzón)', desc: 'Aprieta la chapa contra la mesa justo sobre la línea de plegado. Junto con la matriz forman las herramientas de la plegadora.' },
  { id: 'aleta', name: 'Aleta plegadora (matriz)', desc: 'Se levanta con las manijas y dobla la chapa alrededor del pisador.' },
  { id: 'manijas', name: 'Manijas', desc: 'Se levantan para plegar. El ángulo se controla mirando la chapa (o con un tope).' },
  { id: 'chapa', name: 'Chapa', desc: 'Chapa galvanizada Nº 30 (fina). La línea de plegado tiene que quedar justo en el borde del pisador.' },
]

export function PlegadoraModel({ angulo }: PlegadoraParams) {
  const a = (angulo * Math.PI) / 180
  const L = 40
  return (
    <group>
      <Part id="bancada" offset={[0, -4, 0]} labelAt={[-18, 2, 4]}>
        <mesh position={[0, 4, 0.8]} castShadow receiveShadow>
          <boxGeometry args={[L + 6, 3, 9]} />
          <meshStandardMaterial {...DARK} />
        </mesh>
        {[-L / 2 - 1.5, L / 2 + 1.5].map((x) => (
          <mesh key={x} position={[x, 3, 2]} castShadow>
            <boxGeometry args={[3, 6, 12]} />
            <meshStandardMaterial {...DARK} />
          </mesh>
        ))}
      </Part>
      <Part id="pisador" offset={[0, 5, 0]} labelAt={[0, 10.5, -2]}>
        <mesh position={[0, 8.2, -1.6]} castShadow>
          <boxGeometry args={[L, 2.2, 3.2]} />
          <meshStandardMaterial color="#2f5f8a" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0, 9.8, -1.6]}>
          <boxGeometry args={[L - 6, 1, 1]} />
          <meshStandardMaterial {...STEEL} />
        </mesh>
      </Part>
      {/* aleta + manijas giran sobre el borde de la mesa (y = 5.6, z = 0) */}
      <group position={[0, 5.6, 0]} rotation={[-a, 0, 0]}>
        <Part id="aleta" offset={[0, 0, 3]} labelAt={[10, 0.6, 3]}>
          <mesh position={[0, -0.6, 2.2]} castShadow>
            <boxGeometry args={[L, 1.2, 4.4]} />
            <meshStandardMaterial color="#2f5f8a" metalness={0.4} roughness={0.5} />
          </mesh>
        </Part>
        <Part id="manijas" offset={[0, 0, 5]} labelAt={[L / 2 + 2, 0, 9]}>
          {[-L / 2 + 2, L / 2 - 2].map((x) => (
            <group key={x} position={[x, -0.6, 4.4]}>
              <mesh position={[0, 0, 4]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.45, 0.45, 8, 14]} />
                <meshStandardMaterial {...STEEL} />
              </mesh>
              <mesh position={[0, 0, 8.4]}>
                <sphereGeometry args={[0.9, 16, 12]} />
                <meshStandardMaterial color="#111" />
              </mesh>
            </group>
          ))}
        </Part>
      </group>
      <Part id="chapa" offset={[0, 7, 0]} labelAt={[-10, 6.6, -6]}>
        {/* parte apretada bajo el pisador */}
        <mesh position={[0, 5.62, -6]} castShadow receiveShadow>
          <boxGeometry args={[L - 8, 0.06, 12]} />
          <meshStandardMaterial {...GALV} />
        </mesh>
        {/* parte que se pliega con la aleta */}
        <group position={[0, 5.62, 0]} rotation={[-a, 0, 0]}>
          <mesh position={[0, 0, 1.5]} castShadow>
            <boxGeometry args={[L - 8, 0.06, 3]} />
            <meshStandardMaterial {...GALV} />
          </mesh>
        </group>
      </Part>
    </group>
  )
}

/* ================================================================== engrafado */

export interface EngrafadoParams {
  paso: number
}

export const ENGRAFADO_PARTS = [
  { id: 'chapa1', name: 'Chapa 1 con su gancho', desc: 'En el extremo se pliega un gancho (en la engrafadora o la plegadora).' },
  { id: 'chapa2', name: 'Chapa 2 con su gancho', desc: 'El gancho se pliega en posición opuesta al de la otra chapa, para que se puedan cruzar.' },
]

/** Perfil (x, y) de una chapa con gancho en la punta, en cm. */
function hookProfile(closed: number): THREE.Shape {
  const t = 0.08
  const g = 0.6 - 0.45 * closed // altura del gancho
  const s = new THREE.Shape()
  s.moveTo(-12, 0)
  s.lineTo(0, 0)
  s.lineTo(0, g + t)
  s.lineTo(-1.2, g + t)
  s.lineTo(-1.2, g)
  s.lineTo(-t, g)
  s.lineTo(-t, t)
  s.lineTo(-12, t)
  s.closePath()
  return s
}

export function EngrafadoModel({ paso }: EngrafadoParams) {
  // paso: 0 ganchos separados · 1 enganchados · 2 aplastados (remachados)
  const near = Math.min(1, paso)
  const closed = Math.max(0, paso - 1)
  const g1 = useMemo(() => new THREE.ExtrudeGeometry(hookProfile(closed), { depth: 14, bevelEnabled: false }).translate(0, 0, -7), [closed])
  const gap = 4 * (1 - near)
  return (
    <group position={[0, 2, 0]}>
      <Part id="chapa1" offset={[-4, 0, 0]} labelAt={[-6, 1.2, 0]}>
        <mesh geometry={g1} position={[-gap / 2 + 0.6, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial {...GALV} side={THREE.DoubleSide} />
        </mesh>
      </Part>
      <Part id="chapa2" offset={[4, 0, 0]} labelAt={[6, 1.2, 0]}>
        {/* la misma chapa girada 180°: el gancho queda enfrentado */}
        <mesh geometry={g1} position={[gap / 2 - 0.6, (0.6 - 0.45 * closed) + 0.08, 0]} rotation={[0, 0, Math.PI]} castShadow receiveShadow>
          <meshStandardMaterial {...GALV} side={THREE.DoubleSide} />
        </mesh>
      </Part>
      {/* referencia: base de apoyo */}
      <RoundedBox args={[30, 0.6, 18]} radius={0.2} position={[0, -0.4, 0]} receiveShadow>
        <meshStandardMaterial color="#5b6270" />
      </RoundedBox>
    </group>
  )
}
