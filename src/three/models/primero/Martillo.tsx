import { useMemo } from 'react'
import * as THREE from 'three'
import { Part } from '../../Part'
import { Label } from '../../Label'
import { useCanvasTexture } from '../../helpers'
import type { MartilloParams } from './Martillo.data'
export { ETAPAS, martilloParts } from './Martillo.data'
export type { MartilloParams } from './Martillo.data'

const S = 2.2 // lado (cm)
const LEN = 9.5
const PENA = 3.5
const TIP = 0.5
const C1 = 4.5
const C2 = 5.5
const R = 0.5

/** Peña: el perfil de costado (trapecio) se extruye a lo ancho. */
function penaGeometry() {
  const sh = new THREE.Shape()
  sh.moveTo(0, 0)
  sh.lineTo(PENA, 0)
  sh.lineTo(PENA, S)
  sh.lineTo(0, TIP)
  sh.closePath()
  return new THREE.ExtrudeGeometry(sh, { depth: S, bevelEnabled: false }).translate(0, 0, -S / 2)
}

/** Resto de la cabeza (de 35 a 95 mm), vista desde arriba con el ojo, extruida hacia arriba. */
function bodyGeometry(withHole: boolean) {
  const sh = new THREE.Shape()
  sh.moveTo(PENA, -S / 2)
  sh.lineTo(LEN, -S / 2)
  sh.lineTo(LEN, S / 2)
  sh.lineTo(PENA, S / 2)
  sh.closePath()
  if (withHole) {
    const h = new THREE.Path()
    h.absarc(C1, 0, R, Math.PI / 2, (3 * Math.PI) / 2, false)
    h.lineTo(C2, -R)
    h.absarc(C2, 0, R, -Math.PI / 2, Math.PI / 2, false)
    h.lineTo(C1, R)
    sh.holes.push(h)
  }
  // la forma está en el plano (x, z): se extruye en y
  return new THREE.ExtrudeGeometry(sh, { depth: S, bevelEnabled: false, curveSegments: 20 }).rotateX(Math.PI / 2).translate(0, S, 0)
}

type P3 = [number, number, number]
const DIM_COLOR = '#facc15'
const ARROW = new THREE.ConeGeometry(0.07, 0.24, 12).translate(0, -0.12, 0)
const DIM_MAT = new THREE.MeshBasicMaterial({ color: DIM_COLOR })

/**
 * Cota como en el plano: líneas auxiliares que salen de la pieza (a → la, b → lb, con un poquito de
 * sobrante), línea de cota con flechas entre la y lb, y el número en el medio, del lado de afuera.
 */
function Dim({ a, b, la, lb, text, push = [0, 0, 0] }: { a: P3; b: P3; la: P3; lb: P3; text: string; push?: P3 }) {
  const { lines, arrows, mid } = useMemo(() => {
    const A = new THREE.Vector3(...a)
    const B = new THREE.Vector3(...b)
    const LA = new THREE.Vector3(...la)
    const LB = new THREE.Vector3(...lb)
    // las auxiliares pasan 1,5 mm de la línea de cota
    const ext = (from: THREE.Vector3, to: THREE.Vector3) => {
      const d = to.clone().sub(from)
      const len = d.length()
      return len < 1e-6 ? to.clone() : to.clone().add(d.multiplyScalar(0.15 / len))
    }
    const pts = [A, ext(A, LA), B, ext(B, LB), LA, LB]
    const dir = LB.clone().sub(LA).normalize()
    const q1 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().negate())
    const q2 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
    const m = LA.clone().add(LB).multiplyScalar(0.5).add(new THREE.Vector3(...push))
    return {
      lines: new THREE.BufferGeometry().setFromPoints(pts),
      arrows: [
        { p: LA, q: q1 },
        { p: LB, q: q2 },
      ],
      mid: [m.x, m.y, m.z] as P3,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.join(), b.join(), la.join(), lb.join(), push.join()])
  return (
    <group>
      <lineSegments geometry={lines}>
        <lineBasicMaterial color={DIM_COLOR} />
      </lineSegments>
      {/* las flechas apuntan hacia afuera, contra las líneas auxiliares */}
      {arrows.map((ar, i) => (
        <mesh key={i} geometry={ARROW} material={DIM_MAT} position={ar.p} quaternion={ar.q} />
      ))}
      <Label position={mid} center style={{ pointerEvents: 'none' }}>
        <div className="dim-tag">{text}</div>
      </Label>
    </group>
  )
}

export function MartilloModel({ etapa, cotas, caras }: MartilloParams) {
  const pena = useMemo(penaGeometry, [])
  const body = useMemo(() => bodyGeometry(etapa >= 4), [etapa])
  const traced = useCanvasTexture(
    512,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#b06a3b'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#f5e7d6'
      ctx.lineWidth = 3
      for (const x of [35, 45, 55]) {
        ctx.beginPath()
        ctx.moveTo((x / 95) * w, 0)
        ctx.lineTo((x / 95) * w, h)
        ctx.stroke()
      }
      ctx.beginPath()
      ctx.moveTo(0, h / 2)
      ctx.lineTo(w, h / 2)
      ctx.stroke()
    },
    [],
  )
  const steel =
    etapa === 0
      ? { color: '#4a4d52', metalness: 0.5, roughness: 0.85 }
      : etapa === 2
        ? { map: traced, metalness: 0.5, roughness: 0.5 }
        : etapa >= 5
          ? { color: '#d9dde2', metalness: 1, roughness: 0.12 }
          : { color: '#b9bec6', metalness: 0.95, roughness: 0.35 }
  const full = etapa < 4 // antes de cortar la peña la barra está entera
  return (
    <group position={[-LEN / 2, 0, 0]}>
      <Part id="cuerpo" labelAt={[LEN * 0.75, S + 0.5, 0]}>
        {full ? (
          <mesh position={[(etapa === 0 ? LEN + 0.5 : LEN) / 2, S / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[etapa === 0 ? LEN + 0.5 : LEN, S, S]} />
            <meshStandardMaterial key={etapa} {...steel} />
          </mesh>
        ) : (
          <mesh geometry={body} castShadow receiveShadow>
            <meshStandardMaterial key={etapa} {...steel} side={THREE.DoubleSide} />
          </mesh>
        )}
        {etapa === 2 && (
          <>
            {/* diagonal de la peña y oblongo trazados */}
            <mesh position={[PENA / 2, (TIP + S) / 2, S / 2 + 0.005]} rotation={[0, 0, Math.atan2(S - TIP, PENA)]}>
              <planeGeometry args={[Math.hypot(PENA, S - TIP), 0.04]} />
              <meshBasicMaterial color="#f5e7d6" />
            </mesh>
            <mesh position={[(C1 + C2) / 2, S + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[R - 0.03, R, 32]} />
              <meshBasicMaterial color="#f5e7d6" />
            </mesh>
            {[C1, C2].map((x) => (
              <mesh key={x} position={[x, S + 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.06, 12]} />
                <meshBasicMaterial color="#1b1b1d" />
              </mesh>
            ))}
          </>
        )}
        {etapa === 3 &&
          [C1, (C1 + C2) / 2, C2].map((x) => (
            <mesh key={x} position={[x, S + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[R * 0.98, 28]} />
              <meshStandardMaterial color="#0d0f12" />
            </mesh>
          ))}
      </Part>
      {etapa >= 4 && (
        <Part id="pena" offset={[-2, 0, 0]} labelAt={[1.2, S, 0]}>
          <mesh geometry={pena} castShadow receiveShadow>
            <meshStandardMaterial key={etapa} {...steel} />
          </mesh>
        </Part>
      )}
      {etapa >= 3 && (
        <Part id="ojo" offset={[0, 2.5, 0]} labelAt={[(C1 + C2) / 2, S + 0.9, 0]}>
          <mesh position={[(C1 + C2) / 2, S + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[R + 0.05, R + 0.12, 32]} />
            <meshBasicMaterial color="#36c2ff" transparent opacity={0.45} />
          </mesh>
        </Part>
      )}
      {etapa >= 5 && (
        <Part id="cabo" offset={[0, -3, 0]} labelAt={[(C1 + C2) / 2, -6, 0]}>
          <mesh position={[(C1 + C2) / 2, S - 9, 0]} castShadow>
            <boxGeometry args={[C2 - C1 + 2 * R - 0.05, 18, 2 * R - 0.05]} />
            <meshStandardMaterial color="#b98552" roughness={0.45} metalness={0.05} />
          </mesh>
        </Part>
      )}
      {caras && (
        <>
          {[
            { n: 1, p: [LEN / 2, S / 2, S / 2 + 0.02] as [number, number, number] },
            { n: 6, p: [LEN / 2, S / 2, -S / 2 - 0.02] as [number, number, number] },
            { n: 3, p: [LEN / 2, S + 0.02, 0] as [number, number, number] },
            { n: 4, p: [LEN / 2, -0.02, 0] as [number, number, number] },
            { n: 2, p: [LEN + 0.02, S / 2, 0] as [number, number, number] },
            { n: 5, p: [-0.02, S / 2, 0] as [number, number, number] },
          ].map((c) => (
            <Label key={c.n} position={c.p} center style={{ pointerEvents: 'none' }}>
              <div className="face-tag">{c.n}</div>
            </Label>
          ))}
        </>
      )}
      {cotas && (
        <group>
          {/* largo total, abajo del frente */}
          <Dim a={[0, 0, S / 2]} b={[LEN, 0, S / 2]} la={[0, -0.9, S / 2]} lb={[LEN, -0.9, S / 2]} text="95" push={[0, -0.35, 0]} />
          {/* largo de la peña, arriba del frente */}
          <Dim a={[0, TIP, S / 2]} b={[PENA, S, S / 2]} la={[0, S + 0.9, S / 2]} lb={[PENA, S + 0.9, S / 2]} text="35" push={[0, 0.35, 0]} />
          {/* alto de la punta y lado de la barra */}
          <Dim a={[0, 0, S / 2]} b={[0, TIP, S / 2]} la={[-0.9, 0, S / 2]} lb={[-0.9, TIP, S / 2]} text="5" push={[-0.45, 0, 0]} />
          <Dim a={[LEN, 0, S / 2]} b={[LEN, S, S / 2]} la={[LEN + 0.9, 0, S / 2]} lb={[LEN + 0.9, S, S / 2]} text="□22" push={[0.55, 0, 0]} />
          {/* centros del ojo, medidos desde la punta, sobre la cara de arriba */}
          <Dim a={[0, TIP, -S / 2]} b={[C1, S, 0]} la={[0, S, -S / 2 - 0.9]} lb={[C1, S, -S / 2 - 0.9]} text="45" push={[0, 0, -0.35]} />
          <Dim a={[0, TIP, -S / 2]} b={[C2, S, 0]} la={[0, S, -S / 2 - 1.8]} lb={[C2, S, -S / 2 - 1.8]} text="55" push={[0, 0, -0.35]} />
          {/* ancho del ojo, llevado afuera por la derecha */}
          <Dim a={[C2, S, -R]} b={[C2, S, R]} la={[LEN + 1.9, S, -R]} lb={[LEN + 1.9, S, R]} text="10" push={[0.5, 0, 0]} />
        </group>
      )}
    </group>
  )
}
