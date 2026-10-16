import { Suspense, useEffect, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { PartsContext, type PartsState, type Vec3 } from './Part'
import { HtmlLayerContext } from './Label'

/** Entorno de iluminación generado localmente (sin descargar HDRIs): hace que los metales se vean reales. */
function LocalEnvironment() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    scene.environmentIntensity = 0.6
    return () => {
      scene.environment = null
      env.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])
  return null
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
  return (
    <div className={className}>
      <div ref={layer} className="html-layer" />
      <Canvas
        camera={{ position: camera, fov: 40, near: 0.05, far: 200 }}
        dpr={[1, 2]}
        onPointerMissed={onBackgroundClick}
        gl={{ antialias: true, preserveDrawingBuffer: false }}
      >
        <color attach="background" args={['#10151f']} />
        <LocalEnvironment />
        <hemisphereLight args={['#ffffff', '#334', 0.9]} />
        <directionalLight position={[5, 8, 5]} intensity={1.6} />
        <directionalLight position={[-6, 4, -4]} intensity={0.6} color="#9bb8ff" />
        <pointLight position={[0, 6, -6]} intensity={20} color="#ffffff" />
        <Suspense fallback={null}>
          <HtmlLayerContext.Provider value={layer}>
            <PartsContext.Provider value={ctx}>{children}</PartsContext.Provider>
          </HtmlLayerContext.Provider>
          <ContactShadows position={[0, shadowY, 0]} opacity={0.5} scale={20} blur={2.4} far={6} />
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
    </div>
  )
}
