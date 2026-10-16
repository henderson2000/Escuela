import { useMemo } from 'react'
import * as THREE from 'three'
import { Part } from '../Part'
import { Wire, metal } from '../helpers'
import { COLORS, type ColorName } from '../../lib/resistor'

const LEN = 2.4 // largo del cuerpo
const HALF = LEN / 2

/** radio del cuerpo "hueso de perro" según la posición a lo largo del eje */
function bodyRadius(y: number) {
  const a = Math.abs(y)
  if (a > HALF - 0.45) return 0.42 - Math.max(0, a - (HALF - 0.08)) * 2.2
  if (a > HALF - 0.6) return 0.36 + ((a - (HALF - 0.6)) / 0.15) * 0.06
  return 0.36
}

function bandPositions(count: number): number[] {
  return count === 4 ? [-0.82, -0.5, -0.18, 0.78] : [-0.86, -0.58, -0.3, -0.02, 0.8]
}

export interface ResistorProps {
  bands: ColorName[]
  /** si true, las patas van rectas (útil en miniaturas) */
  straight?: boolean
}

export function ResistorModel({ bands, straight }: ResistorProps) {
  const bodyGeo = useMemo(() => {
    const pts: THREE.Vector2[] = []
    const n = 60
    for (let i = 0; i <= n; i++) {
      const y = -HALF + (LEN * i) / n
      pts.push(new THREE.Vector2(Math.max(bodyRadius(y), 0.06), y))
    }
    pts.unshift(new THREE.Vector2(0.001, -HALF))
    pts.push(new THREE.Vector2(0.001, HALF))
    return new THREE.LatheGeometry(pts, 48)
  }, [])

  const spiralGeo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const turns = 7
    for (let i = 0; i <= 400; i++) {
      const t = i / 400
      const ang = t * turns * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(ang) * 0.305, -0.85 + t * 1.7, Math.sin(ang) * 0.305))
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.022, 6, false)
  }, [])

  const metalFilm = bands.length === 5
  const bodyColor = metalFilm ? '#4f86c6' : '#d9c29a'
  // el grupo está rotado: +y local queda a la izquierda, así que se invierte el orden
  const ys = bandPositions(bands.length).map((v) => -v)

  return (
    // el cuerpo se modela vertical y se acuesta con la rotación
    <group rotation={[0, 0, Math.PI / 2]}>
      <Part id="nucleo" labelAt={[-1.2, -0.4, 0.3]} offset={[0, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.29, 0.29, LEN - 0.3, 32]} />
          <meshStandardMaterial color="#f2efe8" roughness={0.8} />
        </mesh>
      </Part>

      <Part id="pelicula" labelAt={[1.25, -0.3, 0]} offset={[0.9, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.3, 0.3, 1.72, 32, 1, true]} />
          <meshStandardMaterial color={metalFilm ? '#7a7f88' : '#2a2a2a'} metalness={metalFilm ? 0.7 : 0.1} roughness={0.5} />
        </mesh>
        <mesh geometry={spiralGeo}>
          <meshStandardMaterial color="#f2efe8" roughness={0.8} />
        </mesh>
      </Part>

      {[-1, 1].map((s) => (
        <Part key={s} id="tapas" noLabel={s > 0} offset={[0, s * 0.9, 0]} labelAt={[0.5, s * (HALF - 0.1), 0]}>
          <mesh position={[0, s * (HALF - 0.2), 0]}>
            <cylinderGeometry args={[0.335, 0.335, 0.36, 32]} />
            <meshStandardMaterial {...metal} />
          </mesh>
        </Part>
      ))}

      <Part id="cuerpo" offset={[2.0, 0, 0]} labelAt={[-0.75, -0.1, 0.4]}>
        <mesh geometry={bodyGeo} castShadow>
          <meshStandardMaterial color={bodyColor} roughness={0.45} />
        </mesh>
      </Part>

      <Part id="bandas" offset={[3.1, 0, 0]} labelAt={[0.95, 0.8, 0]}>
        {bands.map((b, i) => {
          const y = ys[i]
          const r = bodyRadius(y) + 0.012
          const c = COLORS[b]
          const shiny = b === 'dorado' || b === 'plateado'
          return (
            <mesh key={i} position={[0, y, 0]}>
              <cylinderGeometry args={[r, r, 0.17, 40]} />
              <meshStandardMaterial color={c.hex} metalness={shiny ? 0.8 : 0.05} roughness={shiny ? 0.3 : 0.5} />
            </mesh>
          )
        })}
      </Part>

      {[-1, 1].map((s) => (
        <Part key={s} id="terminales" noLabel={s < 0} offset={[0, s * 1.4, 0]} labelAt={[-1.1, s * (HALF + 1.0), 0]}>
          {straight ? (
            <Wire points={[[0, s * (HALF - 0.1), 0], [0, s * (HALF + 1.6), 0]]} radius={0.04} />
          ) : (
            <Wire points={legPoints(s)} radius={0.04} />
          )}
        </Part>
      ))}
    </group>
  )
}

/** Pata que sale del cuerpo y dobla hacia abajo.
 * El grupo está rotado 90°: en coordenadas locales, -x es "abajo" y +x es "arriba". */
function legPoints(s: number): [number, number, number][] {
  const y0 = s * (HALF - 0.1)
  const y1 = s * (HALF + 0.7)
  return [
    [0, y0, 0],
    [0, y1 - s * 0.12, 0],
    [-0.04, y1 - s * 0.03, 0],
    [-0.12, y1, 0],
    [-1.6, y1, 0],
  ]
}
