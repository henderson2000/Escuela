import { useMemo } from 'react'
import * as THREE from 'three'
import { Part } from '../../Part'
import { latheGeometry, useCanvasTexture } from '../../helpers'

// 1 unidad = 1 cm. La lima va a lo largo del eje X: punta en x = 0, cuerpo hacia +x, espiga y mango al final.

export type Forma = 'plana' | 'paralela' | 'mediacana' | 'redonda' | 'cuadrada' | 'triangular'
export type Picado = 'simple' | 'doble' | 'escofina'
export type Grado = 'basta' | 'bastarda' | 'fina' | 'extrafina'

export interface LimaParams {
  forma: Forma
  pulgadas: number
  picado: Picado
  grado: Grado
  seccion: boolean
}

export const FORMA_INFO: Record<Forma, { name: string; uso: string }> = {
  plana: { name: 'Plana de punta', uso: 'Superficies planas exteriores. La más común.' },
  paralela: { name: 'Plana paralela (sin punta)', uso: 'Superficies planas y bordes rectos; mantiene el ancho hasta la punta.' },
  mediacana: { name: 'Media caña', uso: 'Una cara plana y otra curva: pasa de superficies planas a curvas (cóncavas).' },
  redonda: { name: 'Redonda', uso: 'Superficies cóncavas y para agrandar agujeros.' },
  cuadrada: { name: 'Cuadrada', uso: 'Agujeros cuadrados y ranuras (chaveteros).' },
  triangular: { name: 'Triangular', uso: 'Ángulos agudos e internos (caras a 60°).' },
}

export const GRADO_INFO: Record<Grado, { name: string; dientes: string; uso: string; paso: number }> = {
  basta: { name: 'Basta (gruesa)', dientes: 'pocos dientes grandes', uso: 'Desbaste agresivo: arranca mucho material.', paso: 34 },
  bastarda: { name: 'Bastarda (entrefina)', dientes: 'dientes medianos', uso: 'Uso intermedio: la de todos los días en el taller.', paso: 22 },
  fina: { name: 'Fina', dientes: 'muchos dientes chicos', uso: 'Afinado y acabado de buena calidad.', paso: 13 },
  extrafina: { name: 'Extrafina', dientes: 'dientes muy chicos y numerosos', uso: 'Acabado de máxima calidad y precisión.', paso: 8 },
}

/** Contorno de la sección transversal (cm) según la forma. */
export function sectionShape(f: Forma): [number, number][] {
  const pts: [number, number][] = []
  if (f === 'plana' || f === 'paralela') return [[-1, -0.25], [1, -0.25], [1, 0.25], [-1, 0.25]]
  if (f === 'cuadrada') return [[-0.38, -0.38], [0.38, -0.38], [0.38, 0.38], [-0.38, 0.38]]
  if (f === 'triangular') {
    const r = 0.7
    for (let k = 0; k < 3; k++) {
      const a = Math.PI / 2 + (k * 2 * Math.PI) / 3
      pts.push([Math.cos(a) * r, Math.sin(a) * r - 0.1])
    }
    return pts
  }
  if (f === 'redonda') {
    for (let k = 0; k < 28; k++) {
      const a = (k / 28) * Math.PI * 2
      pts.push([Math.cos(a) * 0.42, Math.sin(a) * 0.42])
    }
    return pts
  }
  // media caña: base plana y arco arriba
  pts.push([-1, -0.18], [1, -0.18])
  for (let k = 1; k < 20; k++) {
    const a = (k / 20) * Math.PI
    pts.push([Math.cos(a), -0.18 + Math.sin(a) * 0.55])
  }
  return pts
}

/** Cuerpo de la lima: la sección se "estira" a lo largo de X y se afina hacia la punta. */
function loft(section: [number, number][], len: number, taper: (t: number) => [number, number]) {
  const n = section.length
  const seg = 40
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  // perímetro para las coordenadas de textura
  const per = [0]
  for (let k = 1; k <= n; k++) {
    const a = section[k - 1]
    const b = section[k % n]
    per.push(per[k - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]))
  }
  for (let i = 0; i <= seg; i++) {
    const t = i / seg
    const [sw, sh] = taper(t)
    for (let k = 0; k <= n; k++) {
      const [y, z] = section[k % n]
      pos.push(t * len, z * sh, y * sw)
      uv.push(t, per[k] / per[n])
    }
  }
  const row = n + 1
  for (let i = 0; i < seg; i++)
    for (let k = 0; k < n; k++) {
      const a = i * row + k
      const b = (i + 1) * row + k
      idx.push(a, b, a + 1, b, b + 1, a + 1)
    }
  // tapas
  for (const [i, flip] of [
    [0, true],
    [seg, false],
  ] as [number, boolean][]) {
    const [sw, sh] = taper(i / seg)
    const c = pos.length / 3
    pos.push((i / seg) * len, 0, 0)
    uv.push(0, 0)
    const ring = pos.length / 3
    for (let k = 0; k < n; k++) {
      const [y, z] = section[k]
      pos.push((i / seg) * len, z * sh, y * sw)
      uv.push(0, 0)
    }
    for (let k = 0; k < n; k++) {
      const a = ring + k
      const b = ring + ((k + 1) % n)
      if (flip) idx.push(c, a, b)
      else idx.push(c, b, a)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

export function limaParts(p: LimaParams) {
  return [
    { id: 'punta', name: 'Punta', desc: 'El extremo opuesto al mango.' },
    { id: 'cuerpo', name: 'Cuerpo', desc: `La parte activa, con los dientes (picado ${p.picado}). Mide ${p.pulgadas}" (${(p.pulgadas * 2.54).toFixed(1).replace('.', ',')} cm): el tamaño de la lima es el largo del cuerpo.` },
    { id: 'espiga', name: 'Espiga', desc: 'Extremo puntiagudo, sin dientes, que se inserta dentro del mango.' },
    { id: 'mango', name: 'Mango', desc: 'La empuñadura. Tiene que estar siempre en buen estado: una espiga sin mango puede lastimar la mano.' },
  ]
}

export function LimaModel(p: LimaParams) {
  const L = p.pulgadas * 2.54
  const sec = useMemo(() => sectionShape(p.forma), [p.forma])
  const tip = p.forma === 'paralela' ? 0.98 : 0.58
  const taper = (t: number): [number, number] => {
    // t = 0 en la punta: los últimos 2/3 del cuerpo son parejos y se afina el tercio de la punta
    const k = t < 0.36 ? tip + (1 - tip) * (t / 0.36) : 1
    return p.forma === 'paralela' ? [1, t < 0.36 ? 0.85 + 0.15 * (t / 0.36) : 1] : [k, Math.max(0.65, k)]
  }
  const body = useMemo(() => loft(sec, L, taper), [sec, L, p.forma])
  const paso = GRADO_INFO[p.grado].paso
  const teeth = useCanvasTexture(
    1024,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#9097a1'
      ctx.fillRect(0, 0, w, h)
      ctx.lineWidth = Math.max(2, paso / 4)
      if (p.picado === 'escofina') {
        ctx.fillStyle = '#3d424a'
        for (let y = 0; y < h; y += paso * 0.9)
          for (let x = ((y / paso) % 2) * paso * 0.5; x < w; x += paso) {
            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineTo(x + paso * 0.45, y + paso * 0.35)
            ctx.lineTo(x, y + paso * 0.6)
            ctx.fill()
          }
        return
      }
      const lines = (angle: number, color: string, step: number) => {
        ctx.strokeStyle = color
        const dx = Math.tan(angle) * h
        for (let x = -h * 2; x < w + h * 2; x += step) {
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x + dx, h)
          ctx.stroke()
        }
      }
      lines(0.5, '#3d424a', paso)
      if (p.picado === 'doble') lines(-0.75, '#555b64', paso * 1.25)
    },
    [p.picado, p.grado],
  )
  teeth.wrapS = teeth.wrapT = THREE.RepeatWrapping
  teeth.repeat.set(Math.round(L / 6), 1)
  const handle = useMemo(
    () =>
      latheGeometry(
        [
          [0.0, 0],
          [0.85, 0.05],
          [1.15, 1.2],
          [1.25, 5],
          [1.18, 9],
          [1.0, 10.6],
          [0.6, 11.1],
          [0, 11.2],
        ],
        40,
      ).rotateZ(-Math.PI / 2),
    [],
  )
  const tang = useMemo(() => new THREE.CylinderGeometry(0.12, 0.35, 5.5, 4).rotateZ(Math.PI / 2).rotateX(Math.PI / 4), [])
  return (
    <group position={[-(L + 14.5) / 2, 2, 0]}>
      <Part id="punta" offset={[-3, 0, 0]} labelAt={[0.3, 1.1, 0]}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.18, 12, 8]} />
          <meshStandardMaterial color="#facc15" emissive="#a16207" emissiveIntensity={0.4} transparent opacity={0.85} />
        </mesh>
      </Part>
      <Part id="cuerpo" offset={[0, 0, 0]} labelAt={[L * 0.55, 1.4, 0]}>
        <mesh geometry={body} castShadow receiveShadow>
          <meshStandardMaterial map={teeth} bumpMap={teeth} bumpScale={4} color="#c2c8d0" metalness={0.85} roughness={0.42} />
        </mesh>
        {p.seccion && (
          <group position={[L * 0.6, 4.2, 0]}>
            {/* la sección, agrandada al doble y mirando de frente */}
            <mesh scale={2}>
              <extrudeGeometry args={[new THREE.Shape(sec.map(([y, z]) => new THREE.Vector2(y, z))), { depth: 0.12, bevelEnabled: false }]} />
              <meshStandardMaterial color="#f97316" />
            </mesh>
            <mesh position={[0, -2.4, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 2.8, 6]} />
              <meshBasicMaterial color="#f97316" />
            </mesh>
          </group>
        )}
      </Part>
      <Part id="espiga" offset={[3.5, 0, 0]} labelAt={[L + 2.6, 0.9, 0]}>
        <mesh geometry={tang} position={[L + 2.7, 0, 0]} castShadow>
          <meshStandardMaterial color="#6b7079" metalness={0.8} roughness={0.5} />
        </mesh>
      </Part>
      <Part id="mango" offset={[8, 0, 0]} labelAt={[L + 9, 1.8, 0]}>
        <group position={[L + 3.3, 0, 0]}>
          <mesh geometry={handle} castShadow>
            <meshStandardMaterial color="#9a6a3a" roughness={0.6} />
          </mesh>
          {/* virola metálica */}
          <mesh position={[0.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[1.0, 0.95, 1.1, 32]} />
            <meshStandardMaterial color="#c9ccd1" metalness={0.9} roughness={0.25} />
          </mesh>
        </group>
      </Part>
    </group>
  )
}
