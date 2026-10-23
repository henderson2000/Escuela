import { useMemo } from 'react'
import * as THREE from 'three'
import { Part } from '../../Part'
import { Label } from '../../Label'
import { useCanvasTexture } from '../../helpers'

// Plano M01-2020: barra □22 × 95 mm, peña en los primeros 35 mm (baja hasta 5 mm), ojo oblongo de 10 mm de ancho
// con centros a 45 y 55 mm. 1 unidad = 1 cm. La peña queda hacia −x.

export const ETAPAS = [
  { id: 0, name: 'Barra en bruto', ops: 'Recepción del material', text: 'Barra de acero IRAM 1010 de □22 mm, con escoria (la capa oscura de laminación).' },
  { id: 1, name: 'Caras limadas', ops: 'Op. 10 a 60', text: 'Se numeran las caras como un dado (opuestas suman 7) y se liman las 6, controlando paralelismo con la regla y escuadra a 90°.' },
  { id: 2, name: 'Trazado', ops: 'Op. 70 y 80', text: 'Se pinta con sulfato de cobre y se traza con gramil y punta de trazar: eje a 11 mm, líneas a 35, 45 y 55 mm, el oblongo y la diagonal de la peña. Se puntean los centros con el granete.' },
  { id: 3, name: 'Oblongo perforado', ops: 'Op. 90', text: 'En el taladro de banco se perfora el oblongo con mechas sucesivas.' },
  { id: 4, name: 'Peña y ojo terminados', ops: 'Op. 90 y 100', text: 'El ojo se termina con lima redonda; se corta el sobrante de la peña con la sierra y se termina a lima.' },
  { id: 5, name: 'Pulido, cabo y barniz', ops: 'Op. 110', text: 'Se pule con lima fina, tiza y tela esmeril, se coloca el cabo y se barniza.' },
]

export interface MartilloParams {
  etapa: number
  cotas: boolean
  caras: boolean
}

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

function Dim({ a, b, text }: { a: [number, number, number]; b: [number, number, number]; text: string }) {
  const geo = useMemo(() => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]), [a, b])
  const mid: [number, number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
  return (
    <group>
      <lineSegments geometry={geo}>
        <lineBasicMaterial color="#facc15" />
      </lineSegments>
      <Label position={mid} center style={{ pointerEvents: 'none' }}>
        <div className="dim-tag">{text}</div>
      </Label>
    </group>
  )
}

export function martilloParts(p: MartilloParams) {
  const parts = [
    { id: 'cuerpo', name: p.etapa === 0 ? 'Barra de acero' : 'Cuerpo de la cabeza', desc: 'Acero IRAM 1010 (acero de bajo carbono), de sección cuadrada de 22 mm y 95 mm de largo.' },
  ]
  if (p.etapa >= 4) parts.push({ id: 'pena', name: 'Peña', desc: 'La cuña de la cabeza: en 35 mm baja de 22 mm a 5 mm de alto. Se marca con una diagonal y se corta con la sierra.' })
  if (p.etapa >= 3) parts.push({ id: 'ojo', name: 'Ojo (oblongo)', desc: 'Agujero alargado de 10 mm de ancho con centros a 45 y 55 mm de la punta de la peña. Ahí entra el cabo.' })
  if (p.etapa >= 5) parts.push({ id: 'cabo', name: 'Cabo', desc: 'El mango de madera. Se coloca al final y se barniza.' })
  return parts
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
          <Dim a={[0, -0.6, S / 2 + 0.4]} b={[LEN, -0.6, S / 2 + 0.4]} text="95" />
          <Dim a={[0, S + 0.6, S / 2]} b={[PENA, S + 0.6, S / 2]} text="35" />
          <Dim a={[-0.5, 0, S / 2]} b={[-0.5, TIP, S / 2]} text="5" />
          <Dim a={[LEN + 0.5, 0, S / 2]} b={[LEN + 0.5, S, S / 2]} text="□22" />
          <Dim a={[0, S + 0.2, -S / 2 - 0.6]} b={[C1, S + 0.2, -S / 2 - 0.6]} text="45" />
          <Dim a={[0, S + 0.2, -S / 2 - 1.3]} b={[C2, S + 0.2, -S / 2 - 1.3]} text="55" />
          <Dim a={[C2 + 1.2, S + 0.2, -R]} b={[C2 + 1.2, S + 0.2, R]} text="10" />
        </group>
      )}
    </group>
  )
}
