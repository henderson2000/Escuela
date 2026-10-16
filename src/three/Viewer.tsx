import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { PartsContext, type PartsState, type Vec3 } from './Part'
import { HtmlLayerContext } from './Label'
import { ErrorBoundary } from '../components/ErrorBoundary'

/** Entorno de iluminación generado localmente (sin descargar HDRIs): hace que los metales se vean reales. */
function LocalEnvironment() {
  const { gl, scene } = useThree()
  useEffect(() => {
    let env: THREE.Texture | null = null
    const pmrem = new THREE.PMREMGenerator(gl)
    try {
      env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
      scene.environment = env
      scene.environmentIntensity = 0.75
    } catch {
      // algunas placas de video viejas no lo soportan: se ve igual, con menos reflejos
    }
    return () => {
      scene.environment = null
      env?.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])
  return null
}

/** Avisa si el navegador pierde el contexto 3D (pasa en algunas computadoras con poca memoria de video). */
function ContextWatcher({ onLost }: { onLost: () => void }) {
  const { gl } = useThree()
  useEffect(() => {
    const el = gl.domElement
    const h = (e: Event) => {
      e.preventDefault()
      onLost()
    }
    el.addEventListener('webglcontextlost', h)
    return () => el.removeEventListener('webglcontextlost', h)
  }, [gl, onLost])
  return null
}

let webglSupport: boolean | null = null
export function hasWebGL(): boolean {
  if (webglSupport !== null) return webglSupport
  try {
    const c = document.createElement('canvas')
    const ctx = c.getContext('webgl2') ?? c.getContext('webgl')
    webglSupport = !!ctx
    ;(ctx as WebGLRenderingContext | null)?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    webglSupport = false
  }
  return webglSupport
}

function NoWebGL({ reason, onRetry }: { reason?: string; onRetry?: () => void }) {
  return (
    <div className="no-webgl">
      <strong>No se pudo mostrar el modelo 3D en esta computadora.</strong>
      <span>
        Probá con Chrome, Edge o Firefox actualizados y revisá que esté activada la{' '}
        <em>aceleración por hardware</em> (Configuración → Sistema). El resto de la página funciona igual.
      </span>
      {reason && <code>{reason}</code>}
      {onRetry && (
        <button type="button" className="btn small primary" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  )
}

interface ViewerProps {
  children: ReactNode
  camera?: Vec3
  target?: Vec3
  parts?: Partial<PartsState>
  autoRotate?: boolean
  shadowY?: number
  className?: string
  onBackgroundClick?: () => void
}

export function Viewer({
  children,
  camera = [4, 3, 5],
  target = [0, 0, 0],
  parts,
  autoRotate = false,
  shadowY = -1.5,
  className = 'viewer',
  onBackgroundClick,
}: ViewerProps) {
  const ctx: PartsState = {
    explode: 0,
    labels: false,
    hidden: {},
    selected: null,
    names: {},
    ...parts,
  }
  const layer = useRef<HTMLDivElement>(null)
  const [attempt, setAttempt] = useState(0)
  const [lost, setLost] = useState(false)

  if (!hasWebGL()) {
    return (
      <div className={className}>
        <NoWebGL />
      </div>
    )
  }

  return (
    <div className={className}>
      <div ref={layer} className="html-layer" />
      {lost ? (
        <NoWebGL
          reason="Se perdió el contexto 3D."
          onRetry={() => {
            setLost(false)
            setAttempt((a) => a + 1)
          }}
        />
      ) : (
        <ErrorBoundary
          key={attempt}
          fallback={(err, retry) => (
            <NoWebGL
              reason={err.message}
              onRetry={() => {
                retry()
                setAttempt((a) => a + 1)
              }}
            />
          )}
        >
          <Canvas
            camera={{ position: camera, fov: 40, near: 0.05, far: 200 }}
            dpr={[1, 2]}
            onPointerMissed={onBackgroundClick}
            gl={{ antialias: true, preserveDrawingBuffer: false, powerPreference: 'default' }}
          >
            <color attach="background" args={['#10151f']} />
            <ContextWatcher onLost={() => setLost(true)} />
            <LocalEnvironment />
            <hemisphereLight args={['#ffffff', '#334', 0.7]} />
            <directionalLight position={[5, 8, 5]} intensity={1.7} />
            <directionalLight position={[-6, 4, -4]} intensity={0.6} color="#9bb8ff" />
            <directionalLight position={[0, 3, 8]} intensity={0.5} />
            <pointLight position={[0, 6, -6]} intensity={20} color="#ffffff" />
            <Suspense fallback={null}>
              <HtmlLayerContext.Provider value={layer}>
                <PartsContext.Provider value={ctx}>{children}</PartsContext.Provider>
              </HtmlLayerContext.Provider>
              <ContactShadows position={[0, shadowY, 0]} opacity={0.55} scale={20} blur={2.4} far={6} />
            </Suspense>
            <OrbitControls
              makeDefault
              target={target}
              enableDamping
              autoRotate={autoRotate}
              autoRotateSpeed={1.5}
              minDistance={0.5}
              maxDistance={60}
            />
          </Canvas>
        </ErrorBoundary>
      )}
    </div>
  )
}
