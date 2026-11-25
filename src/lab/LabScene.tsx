import { Suspense, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { LocalEnvironment, hasWebGL } from '../three/Viewer'
import { PartsContext, type PartsState } from '../three/Part'
import { HtmlLayerContext } from '../three/Label'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { ENV_BG, Environment, type EnvName } from './environments'

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
  const last = useRef<THREE.Box3 | null>(null)
  const place = (force = false) => {
    const g = inner.current
    const outer = ref.current
    if (!g || !outer) return
    const prevPos = outer.position.clone()
    outer.position.set(0, 0, 0)
    outer.updateMatrixWorld(true)
    const box = measure(g)
    if (box.isEmpty() || !Number.isFinite(box.min.y)) {
      outer.position.copy(prevPos)
      outer.updateMatrixWorld(true)
      return
    }
    // sólo se vuelve a encuadrar si el modelo cambió de tamaño de verdad (terminó de cargarse, por ejemplo)
    const size = box.getSize(new THREE.Vector3()).length()
    const prev = last.current?.getSize(new THREE.Vector3()).length() ?? 0
    const c = box.getCenter(new THREE.Vector3())
    outer.position.set(-c.x, -box.min.y, -c.z)
    outer.updateMatrixWorld(true)
    if (force || Math.abs(size - prev) > prev * 0.03) {
      last.current = box
      onBox(measure(g))
    }
  }
  useLayoutEffect(() => {
    frames.current = 0
    last.current = null
    place(true)
    invalidate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k])
  // algunos modelos terminan de armarse en los primeros cuadros o segundos (instancias, texturas, partes que
  // se descargan aparte): se vuelve a medir durante un rato
  useFrame(() => {
    if (frames.current > 150) return
    frames.current++
    if (frames.current === 3 || frames.current % 15 === 0) place()
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
  /** dónde se apoyan los modelos (plancha de electrónica, taller, cabina de soldadura…) */
  environment?: EnvName
  children: ReactNode
  /** cambia al cambiar de componente: vuelve a apoyar y encuadrar */
  modelKey: string
  parts: Partial<PartsState>
  camera: CameraRequest
  /** se dibuja junto al modelo (mismo sistema de coordenadas), por ejemplo los pines resaltados */
  overlay?: ReactNode
  onBackgroundClick?: () => void
}

export function LabScene({ children, modelKey, parts, camera, overlay, onBackgroundClick, environment = 'electronica' }: LabSceneProps) {
  const [size, setSize] = useState(4)
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
          <color attach="background" args={[ENV_BG[environment]]} />
          <fog attach="fog" args={[ENV_BG[environment], size * 14, size * 45]} />
          <LocalEnvironment />
          <hemisphereLight args={['#f4f7ff', '#3b3227', 0.55]} />
          <SunLight size={size} />
          <directionalLight position={[-8, 6, -6]} intensity={0.5} color="#a9c4ff" />
          <Environment name={environment} size={size} />
          <WakeFor deps={[modelKey, size, environment]} ms={3000} />
          <Suspense fallback={null}>
            <HtmlLayerContext.Provider value={layer}>
              <PartsContext.Provider value={ctx}>
                <Grounded
                  k={modelKey}
                  onBox={(b) => {
                    box.current = b
                    const r = b.getBoundingSphere(new THREE.Sphere()).radius
                    if (Number.isFinite(r) && Math.abs(r - size) > 0.05) setSize(r)
                    setFirst()
                  }}
                >
                  {children}
                  {overlay}
                </Grounded>
              </PartsContext.Provider>
            </HtmlLayerContext.Provider>
            <ContactShadows position={[0, 0.003, 0]} opacity={0.5} scale={size * 7} blur={2.2} far={size * 1.2} resolution={1024} />
          </Suspense>
          <OrbitControls makeDefault enableDamping dampingFactor={0.12} minDistance={size * 0.04} maxDistance={size * 12} maxPolarAngle={Math.PI / 2 - 0.03} />
          <CameraRig request={{ ...camera, n: camera.n * 1000 + first }} box={box} registry={registry} />
        </Canvas>
      </ErrorBoundary>
    </div>
  )
}

/**
 * El visor dibuja sólo cuando algo cambia. Después de cambiar de modelo o de entorno se sigue dibujando un rato,
 * para que terminen de aparecer las texturas, las sombras y las piezas que se arman en los primeros cuadros.
 */
function WakeFor({ deps, ms }: { deps: unknown[]; ms: number }) {
  const invalidate = useThree((s) => s.invalidate)
  const until = useRef(0)
  useEffect(() => {
    until.current = performance.now() + ms
    invalidate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useFrame(() => {
    if (performance.now() < until.current) invalidate()
  })
  return null
}

/** Luz principal con la sombra ajustada al tamaño del modelo (un torno y un LED no miden lo mismo). */
function SunLight({ size }: { size: number }) {
  const ref = useRef<THREE.DirectionalLight>(null)
  useLayoutEffect(() => {
    const l = ref.current
    if (!l) return
    const s = size * 2.2
    l.position.set(size * 0.9, size * 2.4, size * 1.3)
    const cam = l.shadow.camera
    cam.left = -s
    cam.right = s
    cam.top = s
    cam.bottom = -s
    cam.near = size * 0.1
    cam.far = size * 8
    cam.updateProjectionMatrix()
    l.shadow.normalBias = size * 0.004
    l.shadow.needsUpdate = true
  }, [size])
  return <directionalLight ref={ref} intensity={1.7} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-radius={4} />
}

/** Contador que se incrementa (para volver a encuadrar cuando el modelo ya se midió). */
function useStateN(): [number, () => void] {
  const [n, setN] = useState(0)
  return [n, () => setN((x) => x + 1)]
}
