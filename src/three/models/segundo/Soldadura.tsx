import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Part } from '../../Part'
import { useCanvasTexture } from '../../helpers'
import { LEATHER_N, MILL_TEX, PLASTIC_N, beadGeometry, blotch, canvasTex, drawPlate, normalTex, rng, smoothNoise, speckle } from './soldaduraShared'
import {  recomendada, diagnosticar, filtroDin } from './Soldadura.data'
import type { CordonParams, Diagnostico, UnionParams } from './Soldadura.data'
export { CORDON_PARTS, ELECTRODO_PARTS, EPP_PARTS, EQUIPO_PARTS, UNION_PARTS, designacion, diagnosticar, filtroDin, recomendada } from './Soldadura.data'
export type { CordonParams, Diagnostico, Union, Posicion, UnionParams } from './Soldadura.data'

const std = (color: string, metalness: number, roughness: number, extra: THREE.MeshPhysicalMaterialParameters = {}) =>
  new THREE.MeshPhysicalMaterial({ color, metalness, roughness, ...extra })

// granulado del revestimiento del electrodo (polvo prensado)
const nG = smoothNoise(12, 61)
const GRAIN = normalTex(256, (x, y) => nG(x, y, 256) * 0.5 + (((x * 7919 + y * 6271) % 31) / 31) * 0.5, 1.6, [2, 8])

const leather = (color: string) => std(color, 0, 0.82, { normalMap: LEATHER_N ?? undefined, normalScale: new THREE.Vector2(0.9, 0.9), sheen: 0.4, sheenColor: new THREE.Color('#fff1d6'), sheenRoughness: 0.6 })

/** Materiales de los modelos de soldadura. */
const MS = {
  core: std('#cfd3d8', 0.95, 0.25),
  flux: std('#cdbf9f', 0, 0.92, { normalMap: GRAIN ?? undefined }),
  fluxCut: std('#bfb294', 0, 0.95, { side: THREE.DoubleSide }),
  mill: std('#e3e6ea', 0.6, 0.55, { map: MILL_TEX ?? undefined }),
  mill2: std('#f1f3f5', 0.6, 0.52, { map: MILL_TEX ?? undefined }),
  bead: std('#aeb2b8', 0.88, 0.32),
  slag: std('#2d2a27', 0.1, 0.22, { clearcoat: 0.9, clearcoatRoughness: 0.15 }),
  helmet: std('#17181b', 0.05, 0.42, { clearcoat: 0.5, clearcoatRoughness: 0.35, normalMap: PLASTIC_N ?? undefined, normalScale: new THREE.Vector2(0.25, 0.25) }),
  harness: std('#3b3d42', 0, 0.6),
  leather: leather('#c49455'),
  leatherDark: leather('#8a5a2b'),
  apron: leather('#9b6a36'),
  boot: leather('#2f2621'),
  sole: std('#141414', 0, 0.85),
  lace: std('#a08060', 0, 0.8),
  stitch: std('#e8d9b5', 0, 0.8),
  buckle: std('#c9ccd1', 0.9, 0.3),
  stand: std('#3a3d42', 0.6, 0.45),
}

export { EquipoModel, type EquipoParams } from './SoldaduraEquipo'

/* ================================================================== electrodo */

export interface ElectrodoParams {
  diametro: number
  corte: boolean
}

export function ElectrodoModel({ diametro, corte }: ElectrodoParams) {
  const k = diametro / 3.25 // escala visual
  const L = 9
  const rA = 0.22 * k
  const rR = rA * 1.6
  const bare = 0.75
  const coatLen = L - bare
  const label = useCanvasTexture(
    256,
    2048,
    (ctx, w, h) => {
      // u = alrededor del electrodo, v = a lo largo: el texto se escribe "parado" para que quede a lo largo
      // revestimiento rutílico: polvo prensado gris beige, con grano
      ctx.fillStyle = '#d4c8a8'
      ctx.fillRect(0, 0, w, h)
      speckle(ctx, w, h, 30, 5)
      blotch(ctx, w, h, 30, 'rgba(150,135,105,0.25)', 30, 7)
      // impresión de la norma y el diámetro, como en los electrodos de verdad
      ctx.fillStyle = '#23407a'
      ctx.font = 'bold 64px system-ui, sans-serif'
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'
      ctx.save()
      ctx.translate(w * 0.5, h * 0.2)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText(`E6013  ·  ${String(diametro).replace('.', ',')} mm`, 0, 0)
      ctx.restore()
    },
    [diametro],
  )
  const theta0 = corte ? Math.PI * 0.5 : 0
  const thetaL = corte ? Math.PI * 1.5 : Math.PI * 2
  return (
    <group rotation={[0, 0, Math.PI / 2]} position={[0, 0.6, 0]}>
      <Part id="alma" offset={[0, 0, 1.2]} labelAt={[rA, 1.5, 0.4]}>
        <mesh castShadow material={MS.core}>
          <cylinderGeometry args={[rA, rA, L - 0.04, 32]} />
        </mesh>
        {/* chaflán del extremo de agarre */}
        <mesh position={[0, L / 2 - 0.01, 0]} material={MS.core}>
          <cylinderGeometry args={[rA * 0.9, rA, 0.04, 32]} />
        </mesh>
      </Part>
      <Part id="revestimiento" offset={[0, 0, -1.2]} labelAt={[rR, -1, 0.5]}>
        <group position={[0, -bare / 2, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[rR, rR, coatLen - 0.12, 48, 1, true, theta0, thetaL]} />
            <meshStandardMaterial map={label} roughness={0.92} normalMap={GRAIN ?? undefined} normalScale={new THREE.Vector2(0.6, 0.6)} side={THREE.DoubleSide} />
          </mesh>
          {/* hombro del lado del agarre */}
          <mesh position={[0, coatLen / 2 - 0.03, 0]} material={MS.flux}>
            <cylinderGeometry args={[rA * 1.02, rR, 0.12, 48, 1, false, theta0, thetaL]} />
          </mesh>
          {corte && (
            // caras del corte: se ve el espesor del revestimiento alrededor del alma
            <>
              {[theta0, theta0 + thetaL].map((t) => (
                <mesh key={t} position={[Math.sin(t) * (rA + rR) * 0.5, 0, Math.cos(t) * (rA + rR) * 0.5]} rotation={[0, t + Math.PI / 2, 0]} material={MS.fluxCut}>
                  <planeGeometry args={[rR - rA, coatLen - 0.12]} />
                </mesh>
              ))}
            </>
          )}
        </group>
        {/* punta de encendido: bisel del revestimiento y tinta de grafito que ayuda a encender el arco */}
        <mesh position={[0, -L / 2 + 0.09, 0]} material={MS.flux}>
          <cylinderGeometry args={[rR, rR * 0.82, 0.12, 48]} />
        </mesh>
        <mesh position={[0, -L / 2 + 0.24, 0]}>
          <cylinderGeometry args={[rR * 1.005, rR * 1.005, 0.18, 48, 1, true]} />
          <meshStandardMaterial color="#2a2a2c" roughness={0.6} />
        </mesh>
      </Part>
      <Part id="agarre" offset={[0, 1.2, 0]} labelAt={[0, L / 2 - 0.4, 0.6]}>
        {/* funda invisible: hace que el extremo desnudo se pueda tocar para ver qué es */}
        <mesh position={[0, L / 2 - bare / 2, 0]}>
          <cylinderGeometry args={[rA * 1.4, rA * 1.4, bare, 16, 1, true]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </Part>
      <Part id="punta" offset={[0, -1.2, 0]} labelAt={[0, -L / 2, 0.6]}>
        <mesh position={[0, -L / 2 + 0.02, 0]} material={MS.core}>
          <cylinderGeometry args={[rA, rA * 0.96, 0.04, 32]} />
        </mesh>
      </Part>
    </group>
  )
}

/** Cordón con sus escamas: el paso entre ondas crece con la velocidad de avance. */
function useBeadGeo(d: Diagnostico, L: number, velocidad: number, scale = 1, pitch?: number) {
  return useMemo(
    () =>
      beadGeometry({
        len: L,
        width: d.ancho * 0.1 * scale,
        height: d.alto * 0.1 * scale,
        pitch: pitch ?? 0.11 * Math.max(0.6, velocidad),
        irregular: d.irregular,
      }),
    [d.ancho, d.alto, d.irregular, L, velocidad, scale, pitch],
  )
}

export function CordonModel(p: CordonParams) {
  const d = diagnosticar(p)
  const L = 6
  const T = 0.6 // espesor de chapa
  const W = 1.6 // ancho de cada chapa
  const spatter = useMemo(() => {
    const rnd = rng(7)
    return Array.from({ length: Math.min(80, Math.round(d.salpicaduras)) }, () => {
      const side = rnd() < 0.5 ? -1 : 1
      return [-L / 2 + rnd() * L, 0.02, side * (d.ancho * 0.05 + 0.05 + rnd() * 0.9)] as [number, number, number]
    })
  }, [d.salpicaduras, d.ancho])
  const penW = Math.min(1.2, d.ancho * 0.06)
  const penD = Math.min(T, d.penetracion * 0.1)
  // la zona afectada por el calor crece con la intensidad y con un avance lento
  const heat = Math.min(1.4, d.ancho * 0.1 * (0.9 + (p.corriente / recomendada(p.diametro)[1]) * 0.5))
  const pxu = 120
  const top = useMemo(
    () =>
      canvasTex(L * pxu, W * 2 * pxu, (ctx, w, h) => {
        drawPlate(ctx, w, h, { yc: h / 2, ground: 0.45 * pxu, tint: [0, w, heat * pxu], seed: 41 })
      }),
    [heat],
  )
  const bead = useBeadGeo(d, L, p.velocidad)
  const slag = useBeadGeo(d, L, p.velocidad, 1.12, 0.5)
  return (
    <group position={[0, 0, 0]}>
      <Part id="pieza" offset={[0, -1, 0]} labelAt={[-2.6, 0, -1.4]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0, -T / 2, s * (W / 2 + 0.005)]} material={MS.mill} castShadow receiveShadow>
            <boxGeometry args={[L, T, W - 0.01]} />
          </mesh>
        ))}
        <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[L, W * 2]} />
          <meshStandardMaterial map={top ?? undefined} metalness={0.6} roughness={0.5} />
        </mesh>
      </Part>
      <Part id="penetracion" offset={[1.5, -0.5, 0]} labelAt={[L / 2 + 0.1, -0.3, 0.6]}>
        {/* corte del frente: media elipse de metal fundido, con las líneas de fusión */}
        <mesh position={[L / 2 + 0.005, 0, 0]} rotation={[0, Math.PI / 2, 0]} scale={[penW, penD, 1]}>
          <circleGeometry args={[1, 40, Math.PI, Math.PI]} />
          <meshStandardMaterial color="#c9ced4" metalness={0.5} roughness={0.35} emissive="#7a4a20" emissiveIntensity={0.25} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[L / 2 + 0.008, 0, 0]} rotation={[0, Math.PI / 2, 0]} scale={[penW, penD, 1]}>
          <ringGeometry args={[0.96, 1.04, 40, 1, Math.PI, Math.PI]} />
          <meshBasicMaterial color="#3b2a1a" side={THREE.DoubleSide} />
        </mesh>
      </Part>
      <Part id="cordon" offset={[0, 1.2, 0]} labelAt={[-1, 0.5, 0.4]}>
        <mesh geometry={bead} position={[-L / 2, 0, 0]} material={MS.bead} castShadow />
      </Part>
      {p.escoria && (
        <Part id="escoria" offset={[0, 2.2, 0]} labelAt={[1.5, 0.6, 0.3]}>
          <mesh geometry={slag} position={[-L / 2, 0.012, 0]} scale={[1, 1.15, 1]} material={MS.slag} />
        </Part>
      )}
      <Part id="salpicaduras" offset={[0, 0.8, 0]} labelAt={[0, 0.3, 1.4]}>
        <Spatter points={spatter} />
      </Part>
      {d.mordeduras &&
        [-1, 1].map((s) => (
          <mesh key={s} position={[0, 0.006, s * (d.ancho * 0.05 + 0.04)]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[L, 0.06]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
        ))}
    </group>
  )
}

/** Salpicaduras: todas en una sola malla (una sola llamada de dibujo). */
function Spatter({ points }: { points: [number, number, number][] }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const invalidate = useThree((st) => st.invalidate)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    points.forEach((q, i) => {
      const r = 1 + (i % 3) * 0.35
      m.makeScale(r, r * 0.55, r).setPosition(q[0], q[1] - 0.01, q[2])
      mesh.setMatrixAt(i, m)
    })
    mesh.count = points.length
    mesh.instanceMatrix.needsUpdate = true
    invalidate()
  }, [points, invalidate])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 80]}>
      <sphereGeometry args={[0.035, 8, 6]} />
      <meshStandardMaterial color="#7d838b" metalness={0.75} roughness={0.4} />
    </instancedMesh>
  )
}

/* ================================================================== protección personal */

export interface EppParams {
  amperaje: number
}

const hookGeo = (a: THREE.Vector3, b: THREE.Vector3) => {
  const mid = a.clone().add(b).multiplyScalar(0.5).add(new THREE.Vector3(0, -0.12, 0))
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, mid, b]), 16, 0.025, 6, false)
}

/** Perchero de taller donde se cuelga la protección personal (no es una pieza: sólo sostiene). */
function Perchero() {
  const y0 = -1.7
  const bar = 3.05
  const z = -0.7
  const hooks = useMemo(
    () => [
      hookGeo(new THREE.Vector3(-2.8, bar, z), new THREE.Vector3(-2.8, 2.95, -0.3)),
      hookGeo(new THREE.Vector3(0, bar - 0.55, z), new THREE.Vector3(0, 2.3, -0.36)),
      ...[1.82, 3.38].map((x) => hookGeo(new THREE.Vector3(x, bar, z), new THREE.Vector3(x, 2.95, -0.45))),
    ],
    [],
  )
  return (
    <group>
      <mesh position={[0, (y0 + bar + 0.25) / 2, z]} material={MS.stand} castShadow>
        <cylinderGeometry args={[0.06, 0.06, bar + 0.25 - y0, 16]} />
      </mesh>
      <mesh position={[0, bar, z]} rotation={[0, 0, Math.PI / 2]} material={MS.stand} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 7, 16]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 3.5, bar, z]} material={MS.stand}>
          <sphereGeometry args={[0.07, 12, 8]} />
        </mesh>
      ))}
      {/* patas en cruz */}
      <mesh position={[0, y0 + 0.04, z]} material={MS.stand} castShadow>
        <boxGeometry args={[2.4, 0.08, 0.14]} />
      </mesh>
      <mesh position={[0, y0 + 0.04, z - 0.3]} material={MS.stand} castShadow>
        <boxGeometry args={[0.14, 0.08, 1.2]} />
      </mesh>
      {hooks.map((g, i) => (
        <mesh key={i} geometry={g} material={MS.buckle} />
      ))}
    </group>
  )
}

export function EppModel({ amperaje }: EppParams) {
  const { din } = filtroDin(amperaje)
  const shade = Math.min(1, 0.35 + (din - 9) * 0.12)
  const sticker = useCanvasTexture(
    256,
    96,
    (ctx, w, h) => {
      ctx.fillStyle = '#f3f3f0'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#111'
      ctx.font = 'bold 44px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`DIN ${din}`, w / 2, h * 0.42)
      ctx.font = '18px system-ui, sans-serif'
      ctx.fillText('EN 169 · 105 × 50 mm', w / 2, h * 0.8)
    },
    [din],
  )
  // contorno del delantal: pechera angosta, se abre a la cintura y termina redondeado
  const apron = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.5, 1.95)
    s.lineTo(0.5, 1.95)
    s.bezierCurveTo(0.55, 1.4, 0.95, 1.1, 0.95, 0.9)
    s.lineTo(0.95, -0.65)
    s.quadraticCurveTo(0.95, -0.85, 0.75, -0.85)
    s.lineTo(-0.75, -0.85)
    s.quadraticCurveTo(-0.95, -0.85, -0.95, -0.65)
    s.lineTo(-0.95, 0.9)
    s.bezierCurveTo(-0.95, 1.1, -0.55, 1.4, -0.5, 1.95)
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2, curveSegments: 24 })
    // un poco curvado, como cuando se apoya sobre el cuerpo
    const pos = g.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) pos.setZ(i, pos.getZ(i) - pos.getX(i) * pos.getX(i) * 0.18)
    g.computeVertexNormals()
    return g
  }, [])
  const strap = useMemo(() => {
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.45, 1.93, 0.0), new THREE.Vector3(-0.35, 2.45, -0.15), new THREE.Vector3(0, 2.62, -0.25), new THREE.Vector3(0.35, 2.45, -0.15), new THREE.Vector3(0.45, 1.93, 0.0)])
    return new THREE.TubeGeometry(c, 40, 0.035, 8, false)
  }, [])
  const tie = useMemo(() => {
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(0.93, 0.85, -0.15), new THREE.Vector3(1.15, 0.7, -0.35), new THREE.Vector3(1.2, 0.3, -0.45), new THREE.Vector3(1.1, -0.1, -0.4)])
    return new THREE.TubeGeometry(c, 30, 0.03, 8, false)
  }, [])
  // guante de puño largo (mano derecha; la izquierda es el espejo)
  const cuff = useMemo(() => {
    const pts = [
      [0.3, 0],
      [0.32, 0.1],
      [0.42, 0.5],
      [0.5, 0.95],
      [0.52, 1.0],
      [0.47, 1.0],
    ].map(([r, y]) => new THREE.Vector2(r, y))
    return new THREE.LatheGeometry(pts, 32)
  }, [])
  const lens = useMemo(() => new THREE.CylinderGeometry(0.95, 0.95, 0.42, 40, 1, true, -0.75, 1.5), [])
  return (
    <group position={[0, -0.6, 0]}>
      <Perchero />
      <Part id="mascara" offset={[0, 1.5, 0]} labelAt={[-2.8, 3.6, 0]}>
        <group position={[-2.8, 2.4, 0]}>
          {/* casco de termoplástico, cubre cara, orejas y cuello */}
          <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.62, 1.25]} material={MS.helmet} castShadow>
            <sphereGeometry args={[1.1, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          {/* borde reforzado del casco */}
          <mesh scale={[1, 1.25, 1]} material={MS.helmet}>
            <torusGeometry args={[1.1, 0.035, 8, 64]} />
          </mesh>
          {/* arnés de la cabeza con su perilla de ajuste a cada lado */}
          <mesh position={[0, 0.3, -0.3]} rotation={[Math.PI / 2 - 0.25, 0, 0]} scale={[1, 1.15, 1]} material={MS.harness}>
            <torusGeometry args={[0.72, 0.05, 8, 40]} />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 1.06, 0.05, -0.15]} rotation={[0, 0, (s * Math.PI) / 2]}>
              <mesh material={MS.harness}>
                <cylinderGeometry args={[0.2, 0.22, 0.14, 20]} />
              </mesh>
              <mesh position={[0, s * 0.09, 0]} material={MS.helmet}>
                <cylinderGeometry args={[0.13, 0.13, 0.05, 12]} />
              </mesh>
            </group>
          ))}
          {/* portafiltro */}
          <RoundedBox args={[1.4, 0.82, 0.14]} radius={0.05} smoothness={3} position={[0, 0.25, 0.62]} material={MS.helmet} castShadow />
          <mesh position={[0, -0.05, 0.695]}>
            <planeGeometry args={[0.6, 0.2]} />
            <meshStandardMaterial map={sticker} roughness={0.5} />
          </mesh>
        </group>
      </Part>
      <Part id="vidrio" offset={[0, 1, 1.5]} labelAt={[-2.8, 2.8, 0.9]}>
        <group position={[-2.8, 2.65, 0.7]}>
          {/* vidrio inactínico: verde oscuro, más oscuro cuanto mayor es el DIN */}
          <mesh>
            <boxGeometry args={[1.05, 0.5, 0.04]} />
            <meshStandardMaterial color={new THREE.Color('#1d5a36').multiplyScalar(1 - shade * 0.75)} metalness={0} roughness={0.12} envMapIntensity={0.35} />
          </mesh>
          {/* vidrio transparente de protección, adelante */}
          <mesh position={[0, 0, 0.05]}>
            <boxGeometry args={[1.12, 0.56, 0.015]} />
            <meshStandardMaterial color="#e8f0f5" roughness={0.08} transparent opacity={0.1} envMapIntensity={0.3} depthWrite={false} />
          </mesh>
        </group>
      </Part>
      <Part id="lentes" offset={[0, 1, 1]} labelAt={[0, 3.3, 0]}>
        <group position={[0, 2.94, -0.15]}>
          {/* lente envolvente de policarbonato */}
          <mesh geometry={lens}>
            <meshPhysicalMaterial color="#b9cfe0" roughness={0.04} metalness={0.2} clearcoat={1} transparent opacity={0.35} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          {/* puente y patillas */}
          <mesh position={[0, 0.2, 0.92]} material={MS.harness}>
            <boxGeometry args={[1.0, 0.07, 0.07]} />
          </mesh>
          <mesh position={[0, -0.02, 0.93]} material={MS.harness}>
            <boxGeometry args={[0.16, 0.18, 0.06]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.7, 0.16, 0.15]} rotation={[0, s * 0.15, 0]} material={MS.harness}>
              <boxGeometry args={[0.04, 0.07, 1.4]} />
            </mesh>
          ))}
        </group>
      </Part>
      <Part id="guantes" offset={[1.5, 0, 0]} labelAt={[2.6, 1.2, 0]}>
        {[-0.78, 0.78].map((x) => (
          <group key={x} position={[2.6 + x, 1.7, -0.45]} rotation={[0, 0, Math.PI + x * 0.08]} scale={[x < 0 ? -1 : 1, 1, 1]}>
            {/* palma */}
            <RoundedBox args={[0.72, 0.82, 0.3]} radius={0.12} smoothness={3} material={MS.leather} castShadow />
            {/* dedos, con la costura del lado */}
            {[-0.25, -0.085, 0.085, 0.25].map((fx, i) => (
              <mesh key={fx} position={[fx, 0.66 + (i === 1 || i === 2 ? 0.06 : 0), 0]} rotation={[0, 0, -fx * 0.15]} material={MS.leather} castShadow>
                <capsuleGeometry args={[0.078, 0.4 + (i === 1 || i === 2 ? 0.1 : 0) - (i === 3 ? 0.06 : 0), 6, 14]} />
              </mesh>
            ))}
            {/* pulgar */}
            <mesh position={[0.45, 0.08, 0.04]} rotation={[0, 0, -0.85]} material={MS.leather} castShadow>
              <capsuleGeometry args={[0.085, 0.32, 6, 14]} />
            </mesh>
            {/* refuerzo de la palma */}
            <mesh position={[0, 0.05, 0.155]} scale={[1, 1, 0.2]} material={MS.leatherDark}>
              <sphereGeometry args={[0.3, 20, 12]} />
            </mesh>
            {/* puño largo, de otro cuero */}
            <mesh geometry={cuff} position={[0, -1.35, 0]} scale={[1, 1, 0.62]} material={MS.leatherDark} castShadow />
            <mesh position={[0, -0.38, 0]} scale={[1, 1, 0.62]} material={MS.stitch}>
              <torusGeometry args={[0.36, 0.012, 6, 40]} />
            </mesh>
          </group>
        ))}
      </Part>
      <Part id="delantal" offset={[0, 0, -1.5]} labelAt={[0, 1.6, 0.3]}>
        <group position={[0, -0.2, -0.3]}>
          <mesh geometry={apron} material={MS.apron} castShadow receiveShadow />
          <mesh geometry={strap} material={MS.leatherDark} />
          <mesh geometry={tie} material={MS.leatherDark} />
          <mesh geometry={tie} scale={[-1, 1, 1]} material={MS.leatherDark} />
          {/* hebillas */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.45, 1.86, 0.07]} material={MS.buckle}>
              <boxGeometry args={[0.14, 0.1, 0.02]} />
            </mesh>
          ))}
        </group>
      </Part>
      <Part id="zapatos" offset={[0, -1, 1]} labelAt={[0, -1.2, 1.4]}>
        {[-0.5, 0.5].map((x) => (
          <group key={x} position={[x, -1.7, 0.6]}>
            {/* suela de goma antideslizante */}
            <RoundedBox args={[0.74, 0.16, 1.55]} radius={0.07} smoothness={3} position={[0, 0.08, 0.15]} material={MS.sole} castShadow />
            {/* puntera de acero, forrada */}
            <mesh position={[0, 0.2, 0.55]} scale={[0.36, 0.26, 0.42]} material={MS.boot} castShadow>
              <sphereGeometry args={[1, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
            <RoundedBox args={[0.7, 0.42, 1.0]} radius={0.15} smoothness={3} position={[0, 0.36, 0.0]} material={MS.boot} castShadow />
            {/* caña que cubre el tobillo */}
            <mesh position={[0, 0.78, -0.2]} material={MS.boot} castShadow>
              <cylinderGeometry args={[0.3, 0.34, 0.65, 24]} />
            </mesh>
            <mesh position={[0, 1.12, -0.2]} material={MS.leatherDark}>
              <torusGeometry args={[0.3, 0.04, 8, 24]} />
            </mesh>
            {/* cordones */}
            {[0, 1, 2, 3].map((i) => (
              <mesh key={i} position={[0, 0.6 + i * 0.13, 0.08 - i * 0.04]} rotation={[0.3, 0, 0]} material={MS.lace}>
                <boxGeometry args={[0.3, 0.025, 0.03]} />
              </mesh>
            ))}
          </group>
        ))}
      </Part>
    </group>
  )
}

export function UnionModel({ union, posicion }: UnionParams) {
  // la unión se arma "plana" y después se gira según la posición
  const rot: [number, number, number] =
    posicion === 'plana' ? [0, 0, 0] : posicion === 'horizontal' ? [Math.PI / 2, 0, 0] : posicion === 'vertical' ? [Math.PI / 2, 0, Math.PI / 2] : [Math.PI, 0, 0]
  const t = 0.3
  const W = 2
  const L = 5
  let p1: { pos: [number, number, number]; size: [number, number, number] }
  let p2: { pos: [number, number, number]; size: [number, number, number] }
  // cordón: punto medio de su base, inclinación (0 = plano, ±45° = en el rincón) y tamaño
  let bead: { pos: [number, number, number]; tilt: number; w: number; h: number }
  const fw = 0.5
  const a = fw / Math.SQRT2
  if (union === 'tope') {
    p1 = { pos: [0, 0, -W / 2 - 0.03], size: [L, t, W] }
    p2 = { pos: [0, 0, W / 2 + 0.03], size: [L, t, W] }
    bead = { pos: [0, t / 2, 0], tilt: 0, w: 0.42, h: 0.1 }
  } else if (union === 'solapada') {
    p1 = { pos: [0, 0, -W / 2 + 0.5], size: [L, t, W] }
    p2 = { pos: [0, t, W / 2 - 0.5], size: [L, t, W] }
    // rincón entre la cara de arriba de la pieza 1 y el canto de la pieza 2
    bead = { pos: [0, t / 2 + a / 2, -0.5 - a / 2], tilt: -Math.PI / 4, w: fw, h: 0.16 }
  } else if (union === 't') {
    p1 = { pos: [0, 0, 0], size: [L, t, W * 1.6] }
    p2 = { pos: [0, W / 2 + t / 2, 0], size: [L, W, t] }
    bead = { pos: [0, t / 2 + a / 2, t / 2 + a / 2], tilt: Math.PI / 4, w: fw, h: 0.16 }
  } else {
    p1 = { pos: [0, 0, -W / 2 + t / 2], size: [L, t, W] }
    p2 = { pos: [0, W / 2 - t / 2, -W + t], size: [L, W, t] }
    bead = { pos: [0, t / 2 + a / 2, -W + t * 1.5 + a / 2], tilt: Math.PI / 4, w: fw, h: 0.16 }
  }
  const geo = useMemo(() => beadGeometry({ len: L - 0.4, width: bead.w, height: bead.h, pitch: 0.09, irregular: 0.15 }), [bead.w, bead.h])
  return (
    <group position={[0, 1.2, 0]}>
      <Part id="piso" offset={[0, -1, 0]} labelAt={[-3, -2.2, 2]}>
        <mesh position={[0, -2.6, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[9, 7]} />
          <meshStandardMaterial color="#334155" roughness={0.9} transparent opacity={0.55} />
        </mesh>
        <mesh position={[0, -2.58, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.2, 3.3, 48]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      </Part>
      <group rotation={rot}>
        <Part id="pieza1" offset={[0, -0.8, -0.8]} labelAt={[-2, 0.3, p1.pos[2]]}>
          <mesh position={p1.pos} material={MS.mill} castShadow receiveShadow>
            <boxGeometry args={p1.size} />
          </mesh>
        </Part>
        <Part id="pieza2" offset={[0, 0.8, 0.8]} labelAt={[2, p2.pos[1] + 0.3, p2.pos[2]]}>
          <mesh position={p2.pos} material={MS.mill2} castShadow receiveShadow>
            <boxGeometry args={p2.size} />
          </mesh>
        </Part>
        <Part id="cordon" offset={[0, 1.2, 0]} labelAt={[0, bead.pos[1] + 0.4, bead.pos[2]]}>
          <group position={bead.pos} rotation={[bead.tilt, 0, 0]}>
            <mesh geometry={geo} position={[-(L - 0.4) / 2, 0, 0]} material={MS.bead} castShadow />
          </group>
        </Part>
      </group>
    </group>
  )
}
