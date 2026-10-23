import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Part } from '../../Part'
import { useCanvasTexture } from '../../helpers'
import { useKeepRendering } from '../../keepRendering'

export type Modo = 'una' | 'serie' | 'paralelo'

export interface CircuitoParams {
  modo: Modo
  u: number
  r1: number
  r2: number
  cerrado: boolean
}

/** Resuelve el circuito: corriente total y por cada lámpara, tensión en cada una. */
export function solve(p: CircuitoParams) {
  if (!p.cerrado) return { req: p.modo === 'una' ? p.r1 : p.modo === 'serie' ? p.r1 + p.r2 : (p.r1 * p.r2) / (p.r1 + p.r2), i: 0, i1: 0, i2: 0, u1: 0, u2: 0 }
  if (p.modo === 'una') {
    const i = p.u / p.r1
    return { req: p.r1, i, i1: i, i2: 0, u1: p.u, u2: 0 }
  }
  if (p.modo === 'serie') {
    const req = p.r1 + p.r2
    const i = p.u / req
    return { req, i, i1: i, i2: i, u1: i * p.r1, u2: i * p.r2 }
  }
  const req = (p.r1 * p.r2) / (p.r1 + p.r2)
  const i1 = p.u / p.r1
  const i2 = p.u / p.r2
  return { req, i: i1 + i2, i1, i2, u1: p.u, u2: p.u }
}

const Y = 0.25 // altura de los cables sobre el tablero
const XL = -4.2
const XR = 4.2
const ZT = -2.6
const ZB = 2.6

type Seg = { a: [number, number]; b: [number, number]; i: number; color: string }

/** Tramos de cable con la corriente (en A) que pasa por cada uno. */
function segments(p: CircuitoParams, s: ReturnType<typeof solve>): Seg[] {
  const red = '#d62828'
  const black = '#1f1f22'
  const sw: [number, number] = [-1.6, ZT]
  // tramos cortos que unen los bornes de la pila con las esquinas del tablero
  const fromNeg: Seg = { a: [XL, 1.95], b: [XL, ZB], i: s.i, color: black }
  const toPos: Seg = { a: [XL, ZT], b: [XL, -1.95], i: s.i, color: red }
  if (p.modo === 'paralelo') {
    return [
      fromNeg,
      { a: [XL, ZB], b: [1.4, ZB], i: s.i, color: black },
      { a: [1.4, ZB], b: [XR, ZB], i: s.i2, color: black },
      { a: [1.4, ZB], b: [1.4, ZT], i: s.i1, color: '#6b7280' },
      { a: [XR, ZB], b: [XR, ZT], i: s.i2, color: '#6b7280' },
      { a: [XR, ZT], b: [1.4, ZT], i: s.i2, color: red },
      { a: [1.4, ZT], b: sw, i: s.i, color: red },
      { a: sw, b: [XL, ZT], i: s.i, color: red },
      toPos,
    ]
  }
  return [
    fromNeg,
    { a: [XL, ZB], b: [XR, ZB], i: s.i, color: black },
    { a: [XR, ZB], b: [XR, ZT], i: s.i, color: '#6b7280' },
    { a: [XR, ZT], b: sw, i: s.i, color: red },
    { a: sw, b: [XL, ZT], i: s.i, color: red },
    toPos,
  ]
}

function Wire({ seg }: { seg: Seg }) {
  const geo = useMemo(() => {
    const a = new THREE.Vector3(seg.a[0], Y, seg.a[1])
    const b = new THREE.Vector3(seg.b[0], Y, seg.b[1])
    return new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 2, 0.07, 10, false)
  }, [seg.a, seg.b])
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color={seg.color} roughness={0.5} />
    </mesh>
  )
}

/** Electrones que avanzan por los cables (de − a +), más rápido cuanta más corriente. */
function Electrons({ segs }: { segs: Seg[] }) {
  const refs = useRef<(THREE.InstancedMesh | null)[]>([])
  const phase = useRef(0)
  const m = useMemo(() => new THREE.Matrix4(), [])
  const SP = 0.55
  useFrame((_, dt) => {
    phase.current += Math.min(dt, 0.05)
    segs.forEach((s, k) => {
      const mesh = refs.current[k]
      if (!mesh) return
      const len = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1])
      const n = Math.max(1, Math.floor(len / SP))
      const off = (phase.current * Math.min(s.i, 2) * 4) % SP
      for (let j = 0; j < n; j++) {
        const t = s.i > 0 ? ((j * SP + off) % len) / len : j / n
        m.makeTranslation(s.a[0] + (s.b[0] - s.a[0]) * t, Y + 0.02, s.a[1] + (s.b[1] - s.a[1]) * t)
        mesh.setMatrixAt(j, m)
      }
      mesh.count = s.i > 0 ? n : 0
      mesh.instanceMatrix.needsUpdate = true
    })
  })
  return (
    <group>
      {segs.map((s, k) => {
        const len = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1])
        return (
          <instancedMesh key={`${k}-${len.toFixed(2)}`} ref={(el) => (refs.current[k] = el)} args={[undefined, undefined, Math.max(1, Math.floor(len / SP))]}>
            <sphereGeometry args={[0.09, 10, 8]} />
            <meshStandardMaterial color="#60a5fa" emissive="#2563eb" emissiveIntensity={1.2} />
          </instancedMesh>
        )
      })}
    </group>
  )
}

function Lamp({ position, glow, rotY = 0 }: { position: [number, number, number]; glow: number; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* portalámpara */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.48, 0.5, 24]} />
        <meshStandardMaterial color="#e8e2d0" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.27, 0.27, 0.3, 20]} />
        <meshStandardMaterial color="#b9bcc2" metalness={0.9} roughness={0.3} />
      </mesh>
      {/* ampolla */}
      <mesh position={[0, 1.15, 0]}>
        <sphereGeometry args={[0.5, 32, 24]} />
        <meshPhysicalMaterial color="#fff8e1" emissive="#ffcc55" emissiveIntensity={glow * 2.4} transparent opacity={0.55 + glow * 0.4} roughness={0.1} transmission={0.4} />
      </mesh>
      {/* filamento */}
      <mesh position={[0, 1.1, 0]}>
        <torusGeometry args={[0.12, 0.018, 6, 20, Math.PI]} />
        <meshStandardMaterial color="#333" emissive="#ffb000" emissiveIntensity={glow * 6} />
      </mesh>
      {glow > 0.02 && <pointLight position={[0, 1.2, 0]} color="#ffd27a" intensity={glow * 9} distance={6} />}
    </group>
  )
}

function Battery({ u }: { u: number }) {
  // la etiqueta se dibuja a lo largo de la pila (la textura da la vuelta al cilindro)
  const label = useCanvasTexture(
    256,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#1e3a8a'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#facc15'
      ctx.fillRect(0, h * 0.72, w, h * 0.28)
      ctx.save()
      ctx.translate(w * 0.5, h * 0.4)
      ctx.rotate(-Math.PI / 2)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 92px system-ui'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${String(u).replace('.', ',')} V`, 0, 0)
      ctx.restore()
      ctx.save()
      ctx.translate(w * 0.5, h * 0.86)
      ctx.rotate(-Math.PI / 2)
      ctx.fillStyle = '#1e3a8a'
      ctx.font = 'bold 80px system-ui'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('+', 0, 0)
      ctx.restore()
    },
    [u],
  )
  return (
    <group position={[XL - 0.15, 0.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.6, 0.6, 3.4, 40, 1, true]} />
        <meshStandardMaterial map={label} roughness={0.4} />
      </mesh>
      <mesh position={[0, -1.71, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.04, 40]} />
        <meshStandardMaterial color="#c0c4ca" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.71, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.04, 40]} />
        <meshStandardMaterial color="#c0c4ca" metalness={0.9} roughness={0.3} />
      </mesh>
      {/* borne + (hacia el cable rojo) */}
      <mesh position={[0, -1.82, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.2, 20]} />
        <meshStandardMaterial color="#d0d3d8" metalness={0.9} roughness={0.25} />
      </mesh>
    </group>
  )
}

function Switch({ closed }: { closed: boolean }) {
  return (
    <group position={[-1.6, 0, ZT]}>
      <mesh position={[0.6, 0.12, 0]} castShadow>
        <boxGeometry args={[1.6, 0.24, 0.7]} />
        <meshStandardMaterial color="#2b2d33" roughness={0.6} />
      </mesh>
      <group position={[0, 0.3, 0]} rotation={[0, 0, closed ? -0.02 : 0.55]}>
        <mesh position={[0.6, 0, 0]} castShadow>
          <boxGeometry args={[1.3, 0.08, 0.22]} />
          <meshStandardMaterial color="#c0c4ca" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[1.25, 0.12, 0]}>
          <sphereGeometry args={[0.13, 14, 10]} />
          <meshStandardMaterial color="#d62828" />
        </mesh>
      </group>
    </group>
  )
}

export function circuitoParts(p: CircuitoParams) {
  const parts = [
    { id: 'pila', name: 'Pila (fuente)', desc: `Separa cargas por una reacción química y genera una tensión de ${String(p.u).replace('.', ',')} V entre sus bornes + y −. Es corriente continua.` },
    { id: 'interruptor', name: 'Interruptor', desc: 'Abre o cierra el circuito. Abierto, no circula corriente; cerrado, los electrones pueden recorrer todo el camino.' },
    { id: 'lampara1', name: p.modo === 'una' ? 'Lámpara (R)' : 'Lámpara R1', desc: `Es la carga: transforma la energía eléctrica en luz y calor. Tiene ${p.r1} Ω de resistencia.` },
  ]
  if (p.modo !== 'una') parts.push({ id: 'lampara2', name: 'Lámpara R2', desc: `Segunda carga, de ${p.r2} Ω. Está en ${p.modo === 'serie' ? 'serie: la misma corriente pasa por las dos' : 'paralelo: las dos reciben la misma tensión'}.` })
  parts.push({ id: 'cables', name: 'Cables', desc: 'Conductores de cobre que unen todo. En corriente continua: rojo para el positivo (+) y negro para el negativo (−). Los puntitos azules son electrones: salen del − y vuelven al +.' })
  parts.push({ id: 'tablero', name: 'Tablero', desc: 'Base de madera (aislante) donde se arma el circuito.' })
  return parts
}

export function CircuitoModel(p: CircuitoParams) {
  const s = solve(p)
  const segs = segments(p, s)
  const pmax = 3
  const glow1 = Math.min(1, (s.i1 * s.u1) / pmax)
  const glow2 = Math.min(1, (s.i2 * s.u2) / pmax)
  useKeepRendering(p.cerrado && s.i > 0)
  const l1: [number, number, number] = p.modo === 'paralelo' ? [1.4, 0, 0] : p.modo === 'serie' ? [1.6, 0, ZT] : [XR, 0, 0]
  const l2: [number, number, number] = p.modo === 'paralelo' ? [XR, 0, 0] : [XR, 0, 0]
  return (
    <group>
      <Part id="tablero" offset={[0, -1.5, 0]} labelAt={[-3.5, 0, 3.7]}>
        <mesh position={[0, -0.15, 0]} receiveShadow castShadow>
          <boxGeometry args={[10.6, 0.3, 7.4]} />
          <meshStandardMaterial color="#b07d4f" roughness={0.8} />
        </mesh>
      </Part>
      <Part id="cables" offset={[0, 0.9, 0]} labelAt={[0, 0.4, ZB]}>
        {segs.map((sg, k) => (
          <Wire key={`${p.modo}-${k}`} seg={sg} />
        ))}
        <Electrons key={p.modo} segs={segs} />
      </Part>
      <Part id="pila" offset={[-2.5, 0, 0]} labelAt={[XL, 1.6, 0]}>
        <Battery u={p.u} />
      </Part>
      <Part id="interruptor" offset={[0, 1.6, -1.5]} labelAt={[-1, 1.1, ZT]}>
        <Switch closed={p.cerrado} />
      </Part>
      <Part id="lampara1" offset={[0, 2.2, 0]} labelAt={[l1[0], 2, l1[2]]}>
        <group position={l1}>
          <Lamp position={[0, 0, 0]} glow={glow1} />
        </group>
      </Part>
      {p.modo !== 'una' && (
        <Part id="lampara2" offset={[2.2, 2.2, 0]} labelAt={[l2[0], 2, l2[2]]}>
          <group position={l2}>
            <Lamp position={[0, 0, 0]} glow={glow2} />
          </group>
        </Part>
      )}
    </group>
  )
}
