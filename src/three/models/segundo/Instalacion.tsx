import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Part } from '../../Part'
import { useCanvasTexture } from '../../helpers'
import { useKeepRendering } from '../../keepRendering'

export type Circuito2 = 'simple' | 'serie' | 'paralelo' | 'escalera'
export type Falla = 'ninguna' | 'cortocircuito' | 'sobrecarga' | 'fuga'

export interface InstalacionParams {
  circuito: Circuito2
  s1: boolean
  s2: boolean
  falla: Falla
  /** interruptor termomagnético cerrado (arriba) */
  pia: boolean
  /** interruptor diferencial cerrado (arriba) */
  dif: boolean
  /** qué protección actuó la última vez */
  disparo: '' | 'magnetico' | 'termico' | 'diferencial'
}

/** Resistencia de una lámpara incandescente de 60 W a 220 V. */
const R_LAMP = (220 * 220) / 60

/** Estado eléctrico: qué lámparas encienden y con cuánta potencia. */
export function estado(p: InstalacionParams) {
  const energia = p.pia && p.dif
  let h1 = false
  let h2 = false
  let serie = false
  if (energia) {
    if (p.circuito === 'simple') h1 = p.s1
    else if (p.circuito === 'serie') h1 = h2 = serie = p.s1
    else if (p.circuito === 'paralelo') h1 = h2 = p.s1
    else h1 = p.s1 === p.s2
  }
  // en serie cada lámpara recibe la mitad de la tensión: un cuarto de la potencia
  const uLamp = serie ? 110 : 220
  const pLamp = (uLamp * uLamp) / R_LAMP
  const n = (h1 ? 1 : 0) + (h2 ? 1 : 0)
  const pTotal = serie ? (220 * 220) / (2 * R_LAMP) : n * 60
  return { energia, h1, h2, uLamp, pLamp, pTotal, i: pTotal / 220, glow: pLamp / 60 }
}

/* ------------------------------------------------------------------ medidas del tablero de práctica */

const Z = 0.16 // cables apoyados sobre el tablero
const H1: [number, number] = [-1.5, 3.0]
const H2: [number, number] = [3.5, 3.0]
const S1: [number, number] = [-1.5, -2.5]
const S2: [number, number] = [3.5, -2.5]

const COLORS = { fase: '#7c4a21', neutro: '#5ab4e5', retorno: '#1f1f22', tierra: '#3a9a3a', puente: '#d62828' }
type Cond = keyof typeof COLORS

interface Run {
  pts: [number, number][]
  cond: Cond
  /** tramos con corriente según qué lámparas están encendidas */
  on: (h1: boolean, h2: boolean, p: InstalacionParams) => boolean
}

const any = (h1: boolean, h2: boolean) => h1 || h2

function runs(p: InstalacionParams): Run[] {
  const fase: Run = { cond: 'fase', on: any, pts: [[-5.2, 0.2], [-4.3, 0.2], [-4.3, -3.8], [S1[0], -3.8], [S1[0], -3.1]] }
  const n1: Run = { cond: 'neutro', on: (h1) => h1, pts: [[-1.2, 4.4], [-1.2, 2.4]] }
  const n2: Run = { cond: 'neutro', on: (_h1, h2) => h2, pts: [[3.8, 4.4], [3.8, 2.4]] }
  const tierra: Run = { cond: 'tierra', on: () => false, pts: [[-5.2, 1.0], [-4.9, 1.0], [-4.9, 4.8], [4.4, 4.8]] }
  const retS1H1: Run = { cond: 'retorno', on: (h1) => h1, pts: [[S1[0], -1.9], [S1[0], -1.2], [-1.8, -1.2], [-1.8, 2.4]] }
  if (p.circuito === 'simple')
    return [fase, retS1H1, { cond: 'neutro', on: (h1) => h1, pts: [[-5.2, 0.6], [-4.6, 0.6], [-4.6, 4.4], [-1.2, 4.4]] }, n1, tierra]
  if (p.circuito === 'serie')
    return [
      fase,
      retS1H1,
      { cond: 'puente', on: (h1) => h1, pts: [[-1.2, 2.4], [-1.2, 1.6], [3.2, 1.6], [3.2, 2.4]] },
      { cond: 'neutro', on: (_h1, h2) => h2, pts: [[-5.2, 0.6], [-4.6, 0.6], [-4.6, 4.4], [3.8, 4.4]] },
      n2,
      tierra,
    ]
  if (p.circuito === 'paralelo')
    return [
      fase,
      retS1H1,
      { cond: 'retorno', on: (_h1, h2) => h2, pts: [[-1.8, 1.2], [3.2, 1.2], [3.2, 2.4]] },
      { cond: 'neutro', on: any, pts: [[-5.2, 0.6], [-4.6, 0.6], [-4.6, 4.4], [-1.2, 4.4]] },
      { cond: 'neutro', on: (_h1, h2) => h2, pts: [[-1.2, 4.4], [3.8, 4.4]] },
      n1,
      n2,
      tierra,
    ]
  // escalera (combinación): dos conductores "viajeros" entre las llaves
  return [
    fase,
    { cond: 'puente', on: (h1, _h2, q) => h1 && !q.s1, pts: [[S1[0] - 0.25, -1.9], [S1[0] - 0.25, -0.6], [S2[0] - 0.25, -0.6], [S2[0] - 0.25, -1.9]] },
    { cond: 'puente', on: (h1, _h2, q) => h1 && q.s1, pts: [[S1[0] + 0.25, -1.9], [S1[0] + 0.25, -0.9], [S2[0] + 0.25, -0.9], [S2[0] + 0.25, -1.9]] },
    { cond: 'retorno', on: (h1) => h1, pts: [[S2[0], -3.1], [S2[0], -3.5], [4.6, -3.5], [4.6, 1.0], [-1.8, 1.0], [-1.8, 2.4]] },
    { cond: 'neutro', on: (h1) => h1, pts: [[-5.2, 0.6], [-4.6, 0.6], [-4.6, 4.4], [-1.2, 4.4]] },
    n1,
    tierra,
  ]
}

function RunTube({ run }: { run: Run }) {
  const geo = useMemo(() => {
    const path = new THREE.CurvePath<THREE.Vector3>()
    for (let i = 0; i < run.pts.length - 1; i++) {
      const [a, b] = [run.pts[i], run.pts[i + 1]]
      path.add(new THREE.LineCurve3(new THREE.Vector3(a[0], a[1], Z), new THREE.Vector3(b[0], b[1], Z)))
    }
    return new THREE.TubeGeometry(path, run.pts.length * 4, 0.055, 8, false)
  }, [run.pts])
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color={COLORS[run.cond]} roughness={0.45} />
    </mesh>
  )
}

/** Puntos que se mueven en los cables con corriente. Es corriente alterna: van y vienen 50 veces por segundo
 *  (acá, mucho más lento para que se vea). */
function Flow({ list }: { list: { pts: [number, number][] }[] }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const t = useRef(0)
  const m = useMemo(() => new THREE.Matrix4(), [])
  const dots = useMemo(() => {
    const out: { a: [number, number]; b: [number, number]; f: number }[] = []
    for (const r of list)
      for (let i = 0; i < r.pts.length - 1; i++) {
        const [a, b] = [r.pts[i], r.pts[i + 1]]
        const len = Math.hypot(b[0] - a[0], b[1] - a[1])
        const n = Math.max(1, Math.round(len / 0.5))
        for (let k = 0; k < n; k++) out.push({ a, b, f: (k + 0.5) / n })
      }
    return out
  }, [list])
  useFrame((_, dt) => {
    const mesh = ref.current
    if (!mesh) return
    t.current += Math.min(dt, 0.05)
    const sway = Math.sin(t.current * 3) * 0.18
    dots.forEach((d, k) => {
      const len = Math.hypot(d.b[0] - d.a[0], d.b[1] - d.a[1]) || 1
      const f = Math.min(1, Math.max(0, d.f + sway / len))
      m.makeTranslation(d.a[0] + (d.b[0] - d.a[0]) * f, d.a[1] + (d.b[1] - d.a[1]) * f, Z + 0.06)
      mesh.setMatrixAt(k, m)
    })
    mesh.instanceMatrix.needsUpdate = true
  })
  if (!dots.length) return null
  return (
    <instancedMesh key={dots.length} ref={ref} args={[undefined, undefined, dots.length]}>
      <sphereGeometry args={[0.07, 8, 6]} />
      <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={1.4} />
    </instancedMesh>
  )
}

/* ------------------------------------------------------------------ piezas */

function DinDevice({ x, label, sub, on, kind }: { x: number; label: string; sub: string; on: boolean; kind: 'dif' | 'pia' }) {
  const face = useCanvasTexture(
    128,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#f4f4f2'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#222'
      ctx.textAlign = 'center'
      ctx.font = 'bold 26px system-ui'
      ctx.fillText(label, w / 2, 40)
      ctx.font = '18px system-ui'
      sub.split('\n').forEach((l, i) => ctx.fillText(l, w / 2, 66 + i * 22))
      ctx.fillStyle = on ? '#16a34a' : '#dc2626'
      ctx.fillRect(w / 2 - 22, h - 46, 44, 18)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 14px system-ui'
      ctx.fillText(on ? 'ON' : 'OFF', w / 2, h - 32)
      if (kind === 'dif') {
        ctx.fillStyle = '#facc15'
        ctx.beginPath()
        ctx.arc(w / 2, h - 80, 13, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#222'
        ctx.fillText('T', w / 2, h - 75)
      }
    },
    [label, sub, on, kind],
  )
  return (
    <group position={[x, 1.5, 0.9]}>
      <mesh castShadow>
        <boxGeometry args={[0.86, 2.2, 1.4]} />
        <meshStandardMaterial color="#f1f1ee" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.71]}>
        <planeGeometry args={[0.8, 1.6]} />
        <meshStandardMaterial map={face} roughness={0.5} />
      </mesh>
      {/* palanca: arriba = cerrado, abajo = abierto (disparado) */}
      <group position={[0, 0.2, 0.75]} rotation={[on ? -0.55 : 0.55, 0, 0]}>
        <mesh position={[0, 0, 0.22]}>
          <boxGeometry args={[0.36, 0.22, 0.44]} />
          <meshStandardMaterial color={kind === 'dif' ? '#1d4ed8' : '#18181b'} roughness={0.4} />
        </mesh>
      </group>
      {/* bornes */}
      {[-0.2, 0.2].map((dx) => (
        <group key={dx}>
          <mesh position={[dx, 0.95, 0.5]}>
            <cylinderGeometry args={[0.08, 0.08, 0.06, 12]} />
            <meshStandardMaterial color="#c0c4ca" metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[dx, -0.95, 0.5]}>
            <cylinderGeometry args={[0.08, 0.08, 0.06, 12]} />
            <meshStandardMaterial color="#c0c4ca" metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Lamp({ glow }: { glow: number }) {
  return (
    <group>
      {/* caja octogonal y portalámparas */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.2]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.4, 8]} />
        <meshStandardMaterial color="#8a8f96" metalness={0.6} roughness={0.45} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.6]} castShadow>
        <cylinderGeometry args={[0.32, 0.36, 0.45, 20]} />
        <meshStandardMaterial color="#efe9da" roughness={0.6} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.92]}>
        <cylinderGeometry args={[0.2, 0.2, 0.25, 18]} />
        <meshStandardMaterial color="#c0c4ca" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 1.38]}>
        <sphereGeometry args={[0.42, 28, 20]} />
        <meshPhysicalMaterial color="#fff8e1" emissive="#ffcc55" emissiveIntensity={glow * 2.6} transparent opacity={0.5 + glow * 0.45} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0, 1.34]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.016, 6, 18, Math.PI]} />
        <meshStandardMaterial color="#333" emissive="#ffb000" emissiveIntensity={glow * 6} />
      </mesh>
      {glow > 0.02 && <pointLight position={[0, 0, 2]} color="#ffd27a" intensity={glow * 10} distance={7} />}
    </group>
  )
}

function SwitchBox({ on, two }: { on: boolean; two?: boolean }) {
  return (
    <group>
      <mesh position={[0, 0, 0.2]} castShadow>
        <boxGeometry args={[1.0, 1.5, 0.4]} />
        <meshStandardMaterial color="#8a8f96" metalness={0.6} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0, 0.45]} castShadow>
        <boxGeometry args={[1.1, 1.65, 0.1]} />
        <meshStandardMaterial color="#f5f5f0" roughness={0.4} />
      </mesh>
      {/* tecla basculante */}
      <group position={[0, 0, 0.52]} rotation={[on ? -0.18 : 0.18, 0, 0]}>
        <mesh position={[0, 0, 0.06]}>
          <boxGeometry args={[0.5, 0.8, 0.12]} />
          <meshStandardMaterial color={two ? '#e7e5e4' : '#ffffff'} roughness={0.35} />
        </mesh>
      </group>
      {two && (
        <mesh position={[0, -0.6, 0.53]}>
          <boxGeometry args={[0.3, 0.06, 0.02]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
      )}
    </group>
  )
}

function Spark() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.scale.setScalar(0.6 + Math.abs(Math.sin(clock.elapsedTime * 25)) * 0.8)
  })
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[0.25, 0]} />
      <meshStandardMaterial color="#fff" emissive="#fde047" emissiveIntensity={4} />
    </mesh>
  )
}

export function instalacionParts(p: InstalacionParams) {
  const parts = [
    { id: 'panel', name: 'Tablero de práctica', desc: 'Base de madera donde se arma la instalación "a la vista", con los mismos materiales que en una casa.' },
    { id: 'tablero', name: 'Tablero de protecciones', desc: 'Caja metálica con riel DIN. Recibe la línea (F y N a 220 V) y contiene el interruptor diferencial y el termomagnético.' },
    { id: 'diferencial', name: 'Interruptor diferencial', desc: 'Compara la corriente que va por la fase con la que vuelve por el neutro. Si se escapa más de 30 mA (por una persona o una falla de aislamiento) se dispara. Protege a las PERSONAS. El botón T sirve para probarlo.' },
    { id: 'pia', name: 'Interruptor termomagnético (PIA)', desc: 'Protege la INSTALACIÓN: su parte térmica corta las sobrecargas y su parte magnética, los cortocircuitos.' },
    { id: 'conductores', name: 'Conductores', desc: 'Fase marrón, neutro celeste y tierra verde-amarilla (colores normalizados). El retorno (de la llave a la lámpara) es negro y los puentes, rojos. Los puntos amarillos muestran la corriente: en alterna va y viene.' },
    { id: 'h1', name: 'Lámpara H1', desc: 'Portalámparas sobre caja octogonal con una lámpara de 60 W / 220 V.' },
    { id: 's1', name: p.circuito === 'escalera' ? 'Llave de combinación S1' : 'Interruptor S1', desc: p.circuito === 'escalera' ? 'Llave de combinación (desviador): conecta su borne común con uno u otro de los dos conductores que van a S2.' : 'Interruptor de un punto: abre o cierra la fase que va a la lámpara. Siempre se corta la FASE, nunca el neutro.' },
  ]
  if (p.circuito === 'serie' || p.circuito === 'paralelo') parts.push({ id: 'h2', name: 'Lámpara H2', desc: p.circuito === 'serie' ? 'En serie con H1: la corriente pasa por las dos y cada una recibe sólo 110 V, por eso alumbran poco.' : 'En paralelo con H1: las dos reciben los 220 V y alumbran normal.' })
  if (p.circuito === 'escalera') parts.push({ id: 's2', name: 'Llave de combinación S2', desc: 'Con S1 y S2 se prende y se apaga la misma lámpara desde dos lugares (por ejemplo, abajo y arriba de una escalera).' })
  return parts
}

export function InstalacionModel(p: InstalacionParams) {
  const st = estado(p)
  const list = runs(p)
  const active = list.filter((r) => r.on(st.h1, st.h2, p))
  const corto = p.falla === 'cortocircuito' && st.energia
  useKeepRendering(active.length > 0 || corto)
  const tex = useCanvasTexture(
    512,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#b07d4f'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#3b2412'
      ctx.font = 'bold 40px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('F  N  220 V ~', w / 2, h / 2 + 14)
    },
    [],
  )
  return (
    <group position={[0, -0.5, 0]}>
      <Part id="panel" offset={[0, 0, -2.5]} labelAt={[6.5, -4.8, 0.3]}>
        <mesh position={[0, 0, -0.2]} receiveShadow castShadow>
          <boxGeometry args={[18, 11, 0.4]} />
          <meshStandardMaterial color="#b07d4f" roughness={0.85} />
        </mesh>
        <mesh position={[-6.5, 4.95, 0.01]}>
          <planeGeometry args={[3, 0.75]} />
          <meshStandardMaterial map={tex} roughness={0.85} />
        </mesh>
      </Part>
      <Part id="tablero" offset={[-2, 0, 1.5]} labelAt={[-6.5, 4, 1]}>
        <group position={[-6.5, 1.5, 0]}>
          {/* caja con ventana para los aparatos */}
          <mesh position={[0, 0, 0.3]} castShadow>
            <boxGeometry args={[3.4, 4.2, 0.6]} />
            <meshStandardMaterial color="#d9dce0" metalness={0.4} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0.62]}>
            <boxGeometry args={[2.6, 0.12, 0.05]} />
            <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
        {/* acometida */}
        <mesh position={[-6.8, 4.5, Z]}>
          <boxGeometry args={[0.11, 1.8, 0.11]} />
          <meshStandardMaterial color={COLORS.fase} />
        </mesh>
        <mesh position={[-6.2, 4.5, Z]}>
          <boxGeometry args={[0.11, 1.8, 0.11]} />
          <meshStandardMaterial color={COLORS.neutro} />
        </mesh>
      </Part>
      <Part id="diferencial" offset={[-1.5, 0, 3]} labelAt={[-7.1, 3, 2]}>
        <group position={[-7.0, 0, 0]}>
          <DinDevice x={0} label="ID" sub={'2 × 25 A\n30 mA'} on={p.dif} kind="dif" />
        </group>
      </Part>
      <Part id="pia" offset={[0.5, 0, 3]} labelAt={[-6, 3, 2]}>
        <group position={[-6.0, 0, 0]}>
          <DinDevice x={0} label="C10" sub={'2 × 10 A\n3 kA'} on={p.pia} kind="pia" />
        </group>
      </Part>
      <Part id="conductores" offset={[0, 0, 1.2]} labelAt={[0.5, -3.8, 0.4]}>
        {list.map((r, k) => (
          <RunTube key={`${p.circuito}-${k}`} run={r} />
        ))}
        {active.length > 0 && <Flow key={`${p.circuito}-${active.length}-${p.s1}-${p.s2}`} list={active} />}
      </Part>
      <Part id="h1" offset={[0, 1.5, 1.5]} labelAt={[H1[0], H1[1] + 1, 1.5]}>
        <group position={[H1[0], H1[1], 0]}>
          <Lamp glow={st.h1 ? st.glow : 0} />
          {corto && (
            <group position={[0.4, -0.5, 0.6]}>
              <Spark />
            </group>
          )}
        </group>
      </Part>
      {(p.circuito === 'serie' || p.circuito === 'paralelo') && (
        <Part id="h2" offset={[1.5, 1.5, 1.5]} labelAt={[H2[0], H2[1] + 1, 1.5]}>
          <group position={[H2[0], H2[1], 0]}>
            <Lamp glow={st.h2 ? st.glow : 0} />
          </group>
        </Part>
      )}
      <Part id="s1" offset={[0, -1.5, 1.5]} labelAt={[S1[0], S1[1] - 1.1, 1]}>
        <group position={[S1[0], S1[1], 0]}>
          <SwitchBox on={p.s1} two={p.circuito === 'escalera'} />
        </group>
      </Part>
      {p.circuito === 'escalera' && (
        <Part id="s2" offset={[1.5, -1.5, 1.5]} labelAt={[S2[0], S2[1] - 1.1, 1]}>
          <group position={[S2[0], S2[1], 0]}>
            <SwitchBox on={p.s2} two />
          </group>
        </Part>
      )}
    </group>
  )
}
