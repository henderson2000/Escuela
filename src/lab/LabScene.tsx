import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { LocalEnvironment, hasWebGL } from '../three/Viewer'
import { PartsContext, type PartsState } from '../three/Part'
import { HtmlLayerContext } from '../three/Label'
import { ErrorBoundary } from '../components/ErrorBoundary'

export type ViewName = 'iso' | 'top' | 'front' | 'side' | 'fit'

/** Pedido de cámara: cambia `n` cada vez que se pide (aunque sea la misma vista o la misma parte). */
export interface CameraRequest {
  view?: ViewName
  part?: string | null
  n: number
}

const DIRS: Record<Exclude<ViewName, 'fit'>, THREE.Vector3> = {
  iso: new THREE.Vector3(0.75, 0.95, 1.1).normalize(),
  top: new THREE.Vector3(0, 1, 0.0001).normalize(),
  front: new THREE.Vector3(0, 0.38, 1).normalize(),
  side: new THREE.Vector3(1, 0.38, 0).normalize(),
}

/* ------------------------------------------------------------------ mesa de trabajo */

/** Base de corte autocicatrizante (la típica plancha verde de taller), con cuadrícula de 1 cm y regla. */
function Bench() {
  const tex = useMemo(() => {
    const S = 1024
    const c = document.createElement('canvas')
    c.width = S
    c.height = S
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#1f423c'
    ctx.fillRect(0, 0, S, S)
    // grano muy suave del material
    const img = ctx.getImageData(0, 0, S, S)
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 7
      img.data[i] += n
      img.data[i + 1] += n
      img.data[i + 2] += n
    }
    ctx.putImageData(img, 0, 0)
    // 10 cm de plancha por textura: líneas cada 1 cm y más marcadas cada 5 cm
    const step = S / 10
    for (let i = 0; i <= 10; i++) {
      const strong = i % 5 === 0
      ctx.strokeStyle = strong ? 'rgba(220,240,230,0.42)' : 'rgba(220,240,230,0.2)'
      ctx.lineWidth = strong ? 3 : 1.6
      ctx.beginPath()
      ctx.moveTo(i * step, 0)
      ctx.lineTo(i * step, S)
      ctx.moveTo(0, i * step)
      ctx.lineTo(S, i * step)
      ctx.stroke()
      // marcas de medio centímetro
      ctx.strokeStyle = 'rgba(220,240,230,0.12)'
      ctx.lineWidth = 1
      for (let k = 0; k < 10; k++) {
        ctx.beginPath()
        ctx.moveTo(i * step + step / 2, k * step + step * 0.42)
        ctx.lineTo(i * step + step / 2, k * step + step * 0.58)
        ctx.moveTo(k * step + step * 0.42, i * step + step / 2)
        ctx.lineTo(k * step + step * 0.58, i * step + step / 2)
        ctx.stroke()
      }
    }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(4, 4)
    t.anisotropy = 8
    return t
  }, [])
  useEffect(() => () => tex.dispose(), [tex])
  return (
    <group>
      {/* plancha de 40 × 40 cm (1 unidad = 1 cm) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial map={tex} roughness={0.95} metalness={0} envMapIntensity={0.35} />
      </mesh>
      {/* canto de la plancha */}
      <mesh position={[0, -0.16, 0]} receiveShadow>
        <boxGeometry args={[40, 0.3, 40]} />
        <meshStandardMaterial color="#244a45" roughness={0.9} />
      </mesh>
      {/* mesa de madera clara alrededor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.32, 0]} receiveShadow>
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial color="#6d5a45" roughness={0.8} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ apoyar el modelo sobre la mesa */

/** Caja de un modelo, sin contar lo marcado con `userData.noBounds` (lámparas, rayos de luz…). */
function measure(root: THREE.Object3D): THREE.Box3 {
  const box = new THREE.Box3()
  const tmp = new THREE.Box3()
  const visit = (o: THREE.Object3D) => {
    if (o.userData?.noBounds || !o.visible) return
    const m = o as THREE.Mesh | THREE.InstancedMesh
    if ((m as THREE.Mesh).isMesh && m.geometry) {
      if ((m as THREE.InstancedMesh).isInstancedMesh) {
        const im = m as THREE.InstancedMesh
        if (im.count > 0) {
          im.computeBoundingBox()
          if (im.boundingBox) tmp.copy(im.boundingBox).applyMatrix4(im.matrixWorld)
          else tmp.makeEmpty()
        } else tmp.makeEmpty()
      } else {
        if (!m.geometry.boundingBox) m.geometry.computeBoundingBox()
        tmp.copy(m.geometry.boundingBox!).applyMatrix4(m.matrixWorld)
      }
      const ok = [tmp.min.x, tmp.min.y, tmp.min.z, tmp.max.x, tmp.max.y, tmp.max.z].every(Number.isFinite)
      if (ok && !tmp.isEmpty()) box.union(tmp)
      else if (!tmp.isEmpty()) console.warn('[lab] caja inválida en', o.name || o.type, tmp)
    }
    o.children.forEach(visit)
  }
  visit(root)
  return box
}

/** Centra el modelo y lo apoya sobre la plancha. Informa su tamaño para encuadrar la cámara. */
function Grounded({ children, onBox, k }: { children: ReactNode; onBox: (b: THREE.Box3) => void; k: string }) {
  const ref = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const frames = useRef(0)
  const invalidate = useThree((s) => s.invalidate)
  const place = () => {
    const g = inner.current
    const outer = ref.current
    if (!g || !outer) return
    outer.position.set(0, 0, 0)
    outer.updateMatrixWorld(true)
    const box = measure(g)
    if (box.isEmpty() || !Number.isFinite(box.min.y)) return
    const c = box.getCenter(new THREE.Vector3())
    outer.position.set(-c.x, -box.min.y, -c.z)
    outer.updateMatrixWorld(true)
    onBox(measure(g))
  }
  useLayoutEffect(() => {
    frames.current = 0
    place()
    invalidate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k])
  // algunos modelos terminan de armarse (instancias, texturas) en los primeros cuadros: se vuelve a medir
  useFrame(() => {
    if (frames.current > 3) return
    frames.current++
    if (frames.current === 3) place()
    invalidate()
  })
  return (
    <group ref={ref}>
      <group ref={inner}>{children}</group>
    </group>
  )
}

/* ------------------------------------------------------------------ cámara que vuela */

function CameraRig({
  request,
  box,
  registry,
}: {
  request: CameraRequest
  box: RefObject<THREE.Box3 | null>
  registry: RefObject<Map<string, THREE.Group>>
}) {
  const { camera, controls, invalidate } = useThree() as unknown as {
    camera: THREE.PerspectiveCamera
    controls: OrbitControlsImpl | null
    invalidate: () => void
  }
  const goal = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null)

  useEffect(() => {
    const b = box.current
    if (!b || !controls) return
    const fov = (camera.fov * Math.PI) / 180
    // el lado más angosto del visor manda (en pantallas angostas se aleja más)
    const aspect = Math.min(camera.aspect, 1)
    const fit = (sphereR: number) => (sphereR / Math.sin(Math.atan(Math.tan(fov / 2) * aspect))) * 1.18
    if (request.part) {
      const g = registry.current.get(request.part)
      if (!g) return
      const pb = new THREE.Box3().setFromObject(g)
      if (pb.isEmpty()) return
      const center = pb.getCenter(new THREE.Vector3())
      const r = Math.max(pb.getBoundingSphere(new THREE.Sphere()).radius, 0.35)
      // se mantiene el ángulo actual, pero siempre mirando un poco desde arriba
      const dir = camera.position.clone().sub(controls.target).normalize()
      if (dir.y < 0.45) dir.setY(0.45).normalize()
      goal.current = { pos: center.clone().addScaledVector(dir, Math.max(fit(r) * 1.25, 1.4)), target: center }
    } else {
      const sphere = b.getBoundingSphere(new THREE.Sphere())
      const center = sphere.center.clone()
      const v = request.view ?? 'iso'
      const dir = v === 'fit' ? camera.position.clone().sub(controls.target).normalize() : DIRS[v].clone()
      goal.current = { pos: center.clone().addScaledVector(dir, fit(sphere.radius)), target: center }
    }
    invalidate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request.n, controls])

  // si el usuario agarra la cámara, se cancela el vuelo
  useEffect(() => {
    if (!controls) return
    const stop = () => (goal.current = null)
    controls.addEventListener('start', stop)
    return () => controls.removeEventListener('start', stop)
  }, [controls])

  useFrame((_, dt) => {
    const g = goal.current
    if (!g || !controls) return
    const k = 1 - Math.exp(-dt * 6)
    camera.position.lerp(g.pos, k)
    controls.target.lerp(g.target, k)
    controls.update()
    if (camera.position.distanceTo(g.pos) < 0.005 && controls.target.distanceTo(g.target) < 0.005) goal.current = null
    invalidate()
  })
  return null
}

/* ------------------------------------------------------------------ escena */

export interface LabSceneProps {
  children: ReactNode
  /** cambia al cambiar de componente: vuelve a apoyar y encuadrar */
  modelKey: string
  parts: Partial<PartsState>
  camera: CameraRequest
  /** se dibuja junto al modelo (mismo sistema de coordenadas), por ejemplo los pines resaltados */
  overlay?: ReactNode
  onBackgroundClick?: () => void
}

export function LabScene({ children, modelKey, parts, camera, overlay, onBackgroundClick }: LabSceneProps) {
  const layer = useRef<HTMLDivElement>(null)
  const registry = useRef(new Map<string, THREE.Group>())
  const box = useRef<THREE.Box3 | null>(null)
  const register = useRef((id: string, g: THREE.Group | null) => {
    if (g) registry.current.set(id, g)
    else registry.current.delete(id)
  }).current
  const [first, setFirst] = useStateN()

  const ctx: PartsState = { explode: 0, labels: false, hidden: {}, selected: null, names: {}, ...parts, register }

  if (!hasWebGL()) return <div className="no-webgl">No se pudo mostrar el 3D en esta computadora.</div>

  return (
    <div className="labx-canvas">
      <div ref={layer} className="html-layer" />
      <ErrorBoundary fallback={(err) => <div className="no-webgl">No se pudo mostrar el 3D: {err.message}</div>}>
        <Canvas
          shadows
          frameloop="demand"
          dpr={[1, 2]}
          camera={{ position: [8, 9, 11], fov: 35, near: 0.05, far: 400 }}
          gl={{ antialias: true, powerPreference: 'high-performance', toneMappingExposure: 0.88 }}
          onPointerMissed={onBackgroundClick}
        >
          <color attach="background" args={['#1a2230']} />
          <fog attach="fog" args={['#1a2230', 45, 120]} />
          <LocalEnvironment />
          <hemisphereLight args={['#f4f7ff', '#3b3227', 0.55]} />
          <directionalLight
            position={[6, 14, 8]}
            intensity={1.7}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0004}
            shadow-normalBias={0.02}
            shadow-camera-left={-12}
            shadow-camera-right={12}
            shadow-camera-top={12}
            shadow-camera-bottom={-12}
            shadow-camera-near={1}
            shadow-camera-far={40}
            shadow-radius={4}
          />
          <directionalLight position={[-8, 6, -6]} intensity={0.5} color="#a9c4ff" />
          <Bench />
          <Suspense fallback={null}>
            <HtmlLayerContext.Provider value={layer}>
              <PartsContext.Provider value={ctx}>
                <Grounded
                  k={modelKey}
                  onBox={(b) => {
                    box.current = b
                    setFirst()
                  }}
                >
                  {children}
                  {overlay}
                </Grounded>
              </PartsContext.Provider>
            </HtmlLayerContext.Provider>
            <ContactShadows position={[0, 0.002, 0]} opacity={0.5} scale={30} blur={2.2} far={4} resolution={1024} />
          </Suspense>
          <OrbitControls makeDefault enableDamping dampingFactor={0.12} minDistance={0.6} maxDistance={60} maxPolarAngle={Math.PI / 2 - 0.03} />
          <CameraRig request={{ ...camera, n: camera.n * 1000 + first }} box={box} registry={registry} />
        </Canvas>
      </ErrorBoundary>
    </div>
  )
}

/** Contador que se incrementa (para volver a encuadrar cuando el modelo ya se midió). */
function useStateN(): [number, () => void] {
  const [n, setN] = useState(0)
  return [n, () => setN((x) => x + 1)]
}
