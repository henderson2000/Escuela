import { useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import { latheGeometry } from '../../helpers'
import { canvasTex, normalTex, rng } from '../segundo/soldaduraShared'

/* ------------------------------------------------------------------ */
/* Herramientas de banco a escala real (1 unidad = 1 cm), compartidas  */
/* por Ajuste y Hojalatería: martillos, escuadras, gramil, punta,      */
/* granete, compás, tijera, bigornia y mármol de trazar.               */
/* ------------------------------------------------------------------ */

export type V3 = [number, number, number]

/** Moleteado en diamante (relieve del agarre de las puntas y granetes). */
const KNURL_N = normalTex(
  64,
  (x, y) => {
    const a = Math.abs(((x + y) % 8) - 4)
    const b = Math.abs(((x - y + 64) % 8) - 4)
    return Math.min(a, b) / 4
  },
  2.2,
  [10, 6],
)

/** Veta de madera a lo largo del mango (v de la textura = a lo largo). */
const WOOD = canvasTex(128, 1024, (ctx, w, h) => {
  ctx.fillStyle = '#c99760'
  ctx.fillRect(0, 0, w, h)
  const r = rng(17)
  for (let i = 0; i < 46; i++) {
    const x0 = r() * w
    ctx.strokeStyle = r() < 0.6 ? `rgba(120,72,34,${0.12 + r() * 0.2})` : `rgba(235,195,140,${0.1 + r() * 0.15})`
    ctx.lineWidth = 0.8 + r() * 2.6
    ctx.beginPath()
    for (let y = 0; y <= h; y += 16) ctx.lineTo(x0 + Math.sin(y / 130 + i) * 5 + Math.sin(y / 37 + i * 2) * 1.5, y)
    ctx.stroke()
  }
})

/** Granito negro del mármol de trazar: grano fino con motas claras. */
const GRANITE = canvasTex(
  512,
  512,
  (ctx, w, h) => {
    ctx.fillStyle = '#25272b'
    ctx.fillRect(0, 0, w, h)
    const r = rng(5)
    for (let i = 0; i < 9000; i++) {
      const g = r()
      ctx.fillStyle = g < 0.7 ? `rgba(10,10,12,${0.5 * r()})` : g < 0.93 ? `rgba(120,122,128,${0.5 * r()})` : `rgba(220,222,226,${0.6 * r()})`
      const s = 1 + r() * 3
      ctx.fillRect(r() * w, r() * h, s, s)
    }
  },
  [3, 2],
)

const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p)

export const TM = {
  forged: std({ color: '#3a3e45', metalness: 0.8, roughness: 0.42 }),
  polished: std({ color: '#d4d9df', metalness: 1, roughness: 0.16 }),
  steel: std({ color: '#bfc5cc', metalness: 0.95, roughness: 0.28 }),
  blued: std({ color: '#2b3442', metalness: 0.85, roughness: 0.32 }),
  knurl: std({ color: '#aab0b8', metalness: 0.95, roughness: 0.38, normalMap: KNURL_N ?? undefined, normalScale: new THREE.Vector2(1.4, 1.4) }),
  wood: new THREE.MeshPhysicalMaterial({ map: WOOD ?? undefined, roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.35 }),
  grip: std({ color: '#c1121f', roughness: 0.55 }),
  brass: std({ color: '#c9a15a', metalness: 1, roughness: 0.3 }),
  hammertone: std({ color: '#3c5d78', metalness: 0.45, roughness: 0.5 }),
  granite: std({ map: GRANITE ?? undefined, roughness: 0.22, metalness: 0.05 }),
  graniteSide: std({ map: GRANITE ?? undefined, roughness: 0.6, color: '#d8d8d8' }),
}

/* ------------------------------------------------------------------ escala grabada */

/** Escala en milímetros grabada (textura para reglas y escuadras). */
export function scaleTex(lengthCm: number, widthPx = 128) {
  return canvasTex(Math.round(lengthCm * 70), widthPx, (ctx, w, h) => {
    ctx.fillStyle = '#d3d8de'
    ctx.fillRect(0, 0, w, h)
    // cepillado del acero
    for (let y = 0; y < h; y += 2) {
      ctx.fillStyle = `rgba(${(y * 37) % 2 ? '255,255,255' : '60,64,70'},0.05)`
      ctx.fillRect(0, y, w, 1)
    }
    ctx.strokeStyle = '#16181c'
    ctx.fillStyle = '#16181c'
    ctx.font = `bold ${Math.round(h * 0.24)}px system-ui`
    const mm = lengthCm * 10
    for (let i = 0; i <= mm; i++) {
      const x = 8 + (i / mm) * (w - 16)
      const l = i % 10 === 0 ? h * 0.42 : i % 5 === 0 ? h * 0.3 : h * 0.18
      ctx.lineWidth = i % 10 === 0 ? 2.4 : 1.4
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, l)
      ctx.stroke()
      if (i % 10 === 0 && i > 0 && i < mm) ctx.fillText(String(i / 10), x - (i >= 100 ? 14 : 7), h * 0.72)
    }
  })
}

/** Regla metálica de acero inoxidable (apoya en y = 0, a lo largo de x). */
export function SteelRule({ length = 30 }: { length?: number }) {
  const tex = useMemo(() => scaleTex(length), [length])
  const L = length + 1.2
  return (
    <group position={[0, 0.04, 0]}>
      <mesh castShadow receiveShadow material={TM.steel}>
        <boxGeometry args={[L, 0.08, 2.5]} />
      </mesh>
      <mesh position={[-0.6 + 0.6, 0.041, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[length + 0.2, 2.5]} />
        <meshStandardMaterial map={tex ?? undefined} metalness={0.7} roughness={0.32} />
      </mesh>
      {/* agujero para colgarla */}
      <mesh position={[L / 2 - 0.6, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.25, 20]} />
        <meshBasicMaterial color="#111" />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ martillos */

/** Mango de madera ovalado, más grueso en la punta. Sale del ojo (y = 0) hacia −y. */
function handleGeometry(len: number, r = 0.78) {
  return latheGeometry(
    [
      [0, -len],
      [r * 0.85, -len + 0.25],
      [r * 1.25, -len + 1.4],
      [r * 1.2, -len * 0.7],
      [r * 0.95, -len * 0.4],
      [r * 0.86, -3],
      [r, -1.35],
      [r * 0.95, 1.3],
      [0, 1.32],
    ],
    28,
    0.3,
  ).scale(1, 1, 0.72)
}

/**
 * Martillo de bola (de banco) de 300 g: boca redonda pulida, ojo con mejillas, cuello y bola.
 * La cabeza va a lo largo de x (boca en −x), el mango sale hacia −y. Origen = centro del ojo.
 */
export function BallPeenHammer({ len = 30 }: { len?: number }) {
  const head = useMemo(
    () =>
      latheGeometry(
        [
          [0, -5],
          [1.08, -5],
          [1.25, -4.82],
          [1.25, -3.3],
          [0.92, -2.5],
          [0.92, -1.9],
          [1.12, -1.5],
          [1.12, 1.5],
          [0.84, 2.0],
          [0.78, 2.9],
          [0.95, 3.35],
          [1.14, 3.85],
          [1.2, 4.3],
          [1.1, 4.8],
          [0.82, 5.18],
          [0.42, 5.42],
          [0, 5.48],
        ],
        40,
        0.08,
      ).rotateZ(-Math.PI / 2),
    [],
  )
  const handle = useMemo(() => handleGeometry(len), [len])
  return (
    <group>
      <mesh geometry={head} material={TM.forged} castShadow />
      {/* mejillas planas alrededor del ojo */}
      <RoundedBox args={[3.0, 2.5, 2.15]} radius={0.35} smoothness={3} material={TM.forged} castShadow />
      {/* boca pulida y bola pulida */}
      <mesh position={[-5.005, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={TM.polished}>
        <circleGeometry args={[1.08, 32]} />
      </mesh>
      <mesh position={[4.6, 0, 0]} material={TM.polished}>
        <sphereGeometry args={[0.92, 24, 16, 0, Math.PI * 2, 0, Math.PI]} />
      </mesh>
      <mesh geometry={handle} material={TM.wood} castShadow />
      {/* cuña de acero clavada en la madera, arriba del ojo */}
      <mesh position={[0, 1.27, 0]} material={TM.steel}>
        <boxGeometry args={[0.1, 0.04, 1.3]} />
      </mesh>
    </group>
  )
}

/** Martillo de hojalatero: boca cuadrada plana y peña en cuña (el filo queda a lo ancho, cruzado al mango). */
export function TinsmithHammer({ len = 32 }: { len?: number }) {
  const head = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-5.5, -1.0)
    s.lineTo(1.6, -1.0)
    s.lineTo(5.3, -0.14)
    s.quadraticCurveTo(5.6, 0, 5.3, 0.14)
    s.lineTo(1.6, 1.0)
    s.lineTo(-5.5, 1.0)
    s.closePath()
    return new THREE.ExtrudeGeometry(s, { depth: 1.9, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 2 }).translate(0, 0, -0.95)
  }, [])
  const handle = useMemo(() => handleGeometry(len, 0.72), [len])
  return (
    <group>
      <mesh geometry={head} material={TM.forged} castShadow />
      <mesh position={[-5.59, 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={TM.polished}>
        <planeGeometry args={[1.9, 1.9]} />
      </mesh>
      <mesh geometry={handle} material={TM.wood} castShadow />
      <mesh position={[0, 1.33, 0]} material={TM.steel}>
        <boxGeometry args={[0.1, 0.04, 1.2]} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ trazado */

/** Escuadra de 90° con talón: talón grueso de acero pavonado con remaches y hoja graduada. Apoyada plana. */
export function TrySquare({ blade = 20, stock = 12 }: { blade?: number; stock?: number }) {
  const tex = useMemo(() => scaleTex(blade, 96), [blade])
  return (
    <group>
      {/* talón */}
      <RoundedBox args={[1.6, 1.1, stock]} radius={0.08} smoothness={2} position={[-0.8, 0.55, stock / 2]} material={TM.blued} castShadow receiveShadow />
      {[2, stock / 2, stock - 2].map((z) => (
        <mesh key={z} position={[-0.8, 1.105, z]} rotation={[-Math.PI / 2, 0, 0]} material={TM.brass}>
          <circleGeometry args={[0.22, 16]} />
        </mesh>
      ))}
      {/* hoja: sale del talón a 90° */}
      <mesh position={[blade / 2 - 0.8, 0.55, 1.3]} material={TM.steel} castShadow>
        <boxGeometry args={[blade + 1.6, 0.16, 2.6]} />
      </mesh>
      <mesh position={[blade / 2 + 0.05, 0.631, 1.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[blade - 0.2, 2.6]} />
        <meshStandardMaterial map={tex ?? undefined} metalness={0.7} roughness={0.32} />
      </mesh>
    </group>
  )
}

/** Escuadra plana de hojalatero (en L, chapa de 2 mm graduada en los dos brazos). Apoyada plana. */
export function FlatSquare({ a = 30, b = 20, w = 3 }: { a?: number; b?: number; w?: number }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, 0)
    s.lineTo(a, 0)
    s.lineTo(a, w)
    s.lineTo(w, w)
    s.lineTo(w, b)
    s.lineTo(0, b)
    s.closePath()
    // alivio redondo en el rincón interior
    const hole = new THREE.Path()
    hole.absarc(w + 0.25, w + 0.25, 0.2, 0, Math.PI * 2, true)
    s.holes.push(hole)
    return new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: false, curveSegments: 16 }).rotateX(Math.PI / 2).translate(0, 0.2, 0)
  }, [a, b, w])
  const ta = useMemo(() => scaleTex(a, 96), [a])
  const tb = useMemo(() => scaleTex(b, 96), [b])
  return (
    <group>
      <mesh geometry={geo} material={TM.steel} castShadow receiveShadow />
      <mesh position={[a / 2, 0.201, w / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[a, w]} />
        <meshStandardMaterial map={ta ?? undefined} metalness={0.7} roughness={0.32} />
      </mesh>
      <mesh position={[w / 2, 0.202, (b + w) / 2]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
        <planeGeometry args={[b - w, w]} />
        <meshStandardMaterial map={tb ?? undefined} metalness={0.7} roughness={0.32} />
      </mesh>
    </group>
  )
}

/** Punta de trazar de 20 cm: cuerpo moleteado, una punta recta y la otra doblada a 90°. Eje = x. */
export function Scriber() {
  const body = useMemo(() => latheGeometry([[0, -10], [0.12, -9.2], [0.2, -7.5], [0.22, -6], [0.22, 6], [0.2, 7], [0, 7.1]], 20, 0.2).rotateZ(-Math.PI / 2), [])
  const grip = useMemo(() => new THREE.CylinderGeometry(0.28, 0.28, 8, 24, 1).rotateZ(Math.PI / 2), [])
  const bent = useMemo(() => {
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(7, 0, 0), new THREE.Vector3(8.2, 0, 0), new THREE.Vector3(8.8, 0, 0.35), new THREE.Vector3(9.0, 0, 1.3)])
    return new THREE.TubeGeometry(c, 20, 0.17, 10, false)
  }, [])
  return (
    <group>
      <mesh geometry={body} material={TM.polished} castShadow />
      <mesh geometry={grip} position={[-0.5, 0, 0]} material={TM.knurl} castShadow />
      <mesh geometry={bent} material={TM.polished} castShadow />
      <mesh position={[9.0, 0, 1.6]} rotation={[Math.PI / 2, 0, 0]} material={TM.polished}>
        <coneGeometry args={[0.17, 0.6, 12]} />
      </mesh>
    </group>
  )
}

/** Granete de 12 cm: punta cónica, cuerpo moleteado y cabeza achaflanada (algo aplastada por los golpes). Eje = x. */
export function CenterPunch() {
  const g = useMemo(
    () =>
      latheGeometry(
        [
          [0, 0],
          [0.2, 0.12],
          [0.32, 1.6],
          [0.48, 2.6],
          [0.48, 10.6],
          [0.4, 11.0],
          [0.42, 11.6],
          [0.36, 11.9],
          [0, 11.95],
        ],
        24,
        0.1,
      ).rotateZ(-Math.PI / 2),
    [],
  )
  const grip = useMemo(() => new THREE.CylinderGeometry(0.5, 0.5, 6.5, 24, 1).rotateZ(Math.PI / 2), [])
  return (
    <group>
      <mesh geometry={g} material={TM.polished} castShadow />
      <mesh geometry={grip} position={[6.4, 0, 0]} material={TM.knurl} castShadow />
    </group>
  )
}

/** Gramil: base de fundición pintada, columna, brida con tuerca moleteada y la aguja de trazar. */
export function SurfaceGauge({ height = 10 }: { height?: number }) {
  const needle = useMemo(() => {
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(5, 0, 0), new THREE.Vector3(-8, 0, 0), new THREE.Vector3(-9.3, -0.2, 0), new THREE.Vector3(-9.8, -1.1, 0)])
    return new THREE.TubeGeometry(c, 30, 0.16, 10, false)
  }, [])
  return (
    <group>
      {/* base con la cara de abajo rectificada */}
      <RoundedBox args={[9, 2.4, 6]} radius={0.35} smoothness={3} position={[0, 1.2, 0]} material={TM.hammertone} castShadow receiveShadow />
      <mesh position={[0, 0.06, 0]} material={TM.polished}>
        <boxGeometry args={[8.6, 0.12, 5.6]} />
      </mesh>
      {/* tornillo de ajuste fino */}
      <mesh position={[3.4, 2.6, 0]} material={TM.knurl}>
        <cylinderGeometry args={[0.75, 0.75, 0.6, 24]} />
      </mesh>
      {/* columna */}
      <mesh position={[0, 2.6, 0]} material={TM.steel}>
        <cylinderGeometry args={[0.9, 1.1, 0.6, 24]} />
      </mesh>
      <mesh position={[0, 2.4 + 11, 0]} material={TM.polished} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 22, 20]} />
      </mesh>
      {/* brida que se desliza por la columna, con su tuerca moleteada */}
      <group position={[0, height, 0]}>
        <RoundedBox args={[1.6, 1.6, 1.6]} radius={0.2} smoothness={2} material={TM.blued} castShadow />
        <mesh position={[0, 0, 1.05]} rotation={[Math.PI / 2, 0, 0]} material={TM.knurl}>
          <cylinderGeometry args={[0.7, 0.7, 0.5, 24]} />
        </mesh>
        <mesh geometry={needle} material={TM.polished} castShadow />
      </group>
    </group>
  )
}

/** Mármol de trazar de granito negro con los cantos achaflanados (arriba en y = 0). */
export function SurfacePlate({ w = 40, d = 26, h = 6 }: { w?: number; d?: number; h?: number }) {
  return (
    <group>
      <RoundedBox args={[w, h, d]} radius={0.3} smoothness={2} position={[0, -h / 2, 0]} material={TM.graniteSide} castShadow receiveShadow />
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} material={TM.granite} receiveShadow>
        <planeGeometry args={[w - 0.5, d - 0.5]} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ hojalatería */

/** Compás de puntas: cabeza con resorte, patas cónicas templadas y arco con tornillo de fijación. Apoyado plano. */
export function Dividers({ open = 0.22, len = 15 }: { open?: number; len?: number }) {
  const leg = useMemo(() => latheGeometry([[0, -len], [0.12, -len + 1.2], [0.2, -len + 3], [0.3, -1], [0.32, 0]], 16, 0.2), [len])
  const arc = useMemo(() => {
    const c = new THREE.EllipseCurve(0, 0, len * 0.55, len * 0.55, -Math.PI / 2 - open * 1.3, -Math.PI / 2 + open * 1.3, false, 0)
    const pts = c.getPoints(24).map((p) => new THREE.Vector3(p.x, p.y, 0))
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.1, 6, false)
  }, [len, open])
  return (
    // en el plano xy (patas hacia −y) y después acostado sobre la mesa
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.45, 0]}>
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={leg} rotation={[0, 0, s * open]} material={TM.steel} castShadow />
      ))}
      {/* cabeza: arco del resorte y perilla moleteada */}
      <mesh position={[0, 0.9, 0]} material={TM.steel}>
        <torusGeometry args={[0.75, 0.18, 10, 24, Math.PI]} />
      </mesh>
      <mesh position={[0, 1.9, 0]} material={TM.knurl}>
        <cylinderGeometry args={[0.35, 0.35, 1.4, 16]} />
      </mesh>
      <mesh geometry={arc} material={TM.steel} />
      <mesh position={[Math.sin(open) * len * 0.55 + 0.4, -Math.cos(open) * len * 0.55, 0]} rotation={[0, 0, Math.PI / 2]} material={TM.knurl}>
        <cylinderGeometry args={[0.35, 0.35, 0.6, 16]} />
      </mesh>
    </group>
  )
}

/** Mitad de la tijera: hoja con el filo y mango curvo con su cubierta de PVC. En el plano xz (y = espesor). */
function SnipHalf({ side }: { side: 1 | -1 }) {
  const blade = useMemo(() => {
    const s = new THREE.Shape()
    // el filo queda sobre z = 0 (donde cruzan las dos hojas)
    s.moveTo(-1.2, -0.9 * side)
    s.lineTo(0, -0.95 * side)
    s.quadraticCurveTo(4.5, -1.05 * side, 7.6, -0.15 * side)
    s.lineTo(7.8, 0)
    s.lineTo(0, 0)
    s.lineTo(-1.2, 0.3 * side)
    s.closePath()
    return new THREE.ExtrudeGeometry(s, { depth: 0.28, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 1 }).rotateX(Math.PI / 2)
  }, [side])
  const handle = useMemo(() => {
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(-1, 0, -0.2 * side), new THREE.Vector3(-5, 0, 0.6 * side), new THREE.Vector3(-11, 0, 1.6 * side), new THREE.Vector3(-17, 0, 1.9 * side), new THREE.Vector3(-19.3, 0, 1.5 * side)])
    return { steel: new THREE.TubeGeometry(c, 40, 0.32, 8, false), curve: c }
  }, [side])
  const grip = useMemo(() => {
    const pts = handle.curve.getPoints(40).slice(16)
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.55, 12, false)
  }, [handle])
  return (
    <group>
      <mesh geometry={blade} material={TM.steel} castShadow />
      <mesh geometry={handle.steel} material={TM.forged} castShadow />
      <mesh geometry={grip} material={TM.grip} castShadow />
    </group>
  )
}

/** Tijera de hojalatero de corte recto (unos 26 cm), apenas abierta. Acostada sobre la mesa, punta hacia +x. */
export function TinSnips({ open = 0.08 }: { open?: number }) {
  return (
    <group position={[0, 0.6, 0]}>
      <group rotation={[0, open, 0]} position={[0, 0.16, 0]}>
        <SnipHalf side={1} />
      </group>
      <group rotation={[0, -open, 0]} position={[0, -0.16, 0]}>
        <SnipHalf side={-1} />
      </group>
      {/* bulón y tuerca del eje */}
      <mesh position={[0, 0.05, 0]} material={TM.polished}>
        <cylinderGeometry args={[0.45, 0.45, 0.85, 6]} />
      </mesh>
    </group>
  )
}

/** Bigornia de hojalatero: mesa de trabajo pulida, cuerno cónico, cuerno cuadrado, cintura y pie. */
export function Bigornia() {
  const horn = useMemo(() => latheGeometry([[2.5, 0], [2.4, 0.6], [1.9, 3.5], [1.0, 8], [0.3, 11.2], [0, 11.5]], 32, 0.2).rotateZ(-Math.PI / 2), [])
  return (
    <group>
      {/* pie con su falda */}
      <RoundedBox args={[12, 1.6, 9]} radius={0.3} smoothness={2} position={[0, 0.8, 0]} material={TM.forged} castShadow receiveShadow />
      <mesh position={[0, 2.6, 0]} rotation={[0, Math.PI / 4, 0]} material={TM.forged} castShadow>
        <cylinderGeometry args={[2.4, 4.6, 2.2, 4]} />
      </mesh>
      {/* cintura */}
      <mesh position={[0, 7.4, 0]} rotation={[0, Math.PI / 4, 0]} material={TM.forged} castShadow>
        <cylinderGeometry args={[3.1, 2.3, 7.6, 4]} />
      </mesh>
      {/* cuerpo y mesa */}
      <RoundedBox args={[9, 3.4, 6.4]} radius={0.35} smoothness={3} position={[0, 12.6, 0]} material={TM.forged} castShadow />
      <mesh position={[0, 14.31, 0]} rotation={[-Math.PI / 2, 0, 0]} material={TM.polished}>
        <planeGeometry args={[8.4, 5.8]} />
      </mesh>
      {/* cuerno cónico (para curvar) y cuerno cuadrado (para cantos y esquinas) */}
      <mesh geometry={horn} position={[4.3, 13.1, 0]} material={TM.forged} castShadow />
      <mesh position={[-7.6, 13.3, 0]} rotation={[Math.PI / 4, 0, Math.PI / 2]} material={TM.forged} castShadow>
        <cylinderGeometry args={[0.55, 2.1, 7.2, 4]} />
      </mesh>
    </group>
  )
}
