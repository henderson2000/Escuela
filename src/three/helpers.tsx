import { useMemo } from 'react'
import * as THREE from 'three'
import type { Vec3 } from './Part'

/** Pata/alambre metálico que pasa por varios puntos. */
export function Wire({
  points,
  radius = 0.025,
  color = '#c8c8cc',
  metalness = 0.9,
  roughness = 0.3,
}: {
  points: Vec3[]
  radius?: number
  color?: string
  metalness?: number
  roughness?: number
}) {
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
      false,
      'catmullrom',
      0.1,
    )
    return new THREE.TubeGeometry(curve, Math.max(16, points.length * 12), radius, 10, false)
  }, [JSON.stringify(points), radius])
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  )
}

/** Pata recta con un doblez a 90° (típica de componentes axiales). */
export function bentLeg(start: Vec3, dir: 1 | -1, horiz: number, down: number): Vec3[] {
  const [x, y, z] = start
  const r = 0.12
  return [
    [x, y, z],
    [x + dir * (horiz - r), y, z],
    [x + dir * (horiz - r * 0.3), y - r * 0.3, z],
    [x + dir * horiz, y - r, z],
    [x + dir * horiz, y - down, z],
  ]
}

/** Textura generada con canvas (para textos impresos sin cargar fuentes externas). */
export function useCanvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  deps: unknown[],
) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    draw(ctx, width, height)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    return tex
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

export const metal = { color: '#cfd2d6', metalness: 0.95, roughness: 0.25 }
export const darkPlastic = { color: '#1b1b1d', metalness: 0.1, roughness: 0.6 }
export const gold = { color: '#d9b45a', metalness: 1, roughness: 0.3 }

/** Pin macho cuadrado (tipo header). */
export function MalePin({ position, length = 0.6 }: { position: Vec3; length?: number }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.064, length, 0.064]} />
      <meshStandardMaterial {...gold} />
    </mesh>
  )
}
