// Entornos 3D del laboratorio: dónde se apoyan los modelos de cada especialidad.
// Todo se dibuja con texturas generadas en el momento (sin descargar imágenes) y se adapta al tamaño
// del modelo: `size` es el radio de la esfera que lo envuelve.
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { EnvName } from '../lib/subject'

export type { EnvName }

/** Color de fondo y niebla de cada entorno. */
export const ENV_BG: Record<EnvName, string> = {
  electronica: '#1a2230',
  taller: '#2a2d31',
  soldadura: '#17181b',
  computacion: '#262a33',
  electricidad: '#2a2f36',
  banco: '#2a2d31',
}

function useTex(w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, repeat: [number, number] = [1, 1], deps: unknown[] = []) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')!
    draw(ctx, w, h)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(repeat[0], repeat[1])
    t.anisotropy = 8
    return t
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(() => () => tex.dispose(), [tex])
  return tex
}

/** Ruido suave para que ninguna superficie sea un color plano. */
function noise(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
  const img = ctx.getImageData(0, 0, w, h)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * amount
    img.data[i] += n
    img.data[i + 1] += n
    img.data[i + 2] += n
  }
  ctx.putImageData(img, 0, 0)
}

function blotches(ctx: CanvasRenderingContext2D, w: number, h: number, n: number, color: string, max: number) {
  for (let i = 0; i < n; i++) {
    const x = Math.random() * w
    const y = Math.random() * h
    const r = 10 + Math.random() * max
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, color)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
}

/* ------------------------------------------------------------------ superficies */

function useConcrete(repeat: number) {
  return useTex(
    1024,
    1024,
    (ctx, w, h) => {
      ctx.fillStyle = '#86847e'
      ctx.fillRect(0, 0, w, h)
      blotches(ctx, w, h, 60, 'rgba(60,58,52,0.18)', 120)
      blotches(ctx, w, h, 30, 'rgba(200,198,190,0.12)', 90)
      noise(ctx, w, h, 26)
      // juntas de dilatación
      ctx.strokeStyle = 'rgba(40,40,38,0.65)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(0, 2)
      ctx.lineTo(w, 2)
      ctx.moveTo(2, 0)
      ctx.lineTo(2, h)
      ctx.stroke()
    },
    [repeat, repeat],
    [repeat],
  )
}

function useWall(base: string, lower: string, ratio: number) {
  return useTex(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = base
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = lower
      ctx.fillRect(0, h * (1 - ratio), w, h * ratio)
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.fillRect(0, h * (1 - ratio) - 3, w, 6)
      noise(ctx, w, h, 10)
    },
    [1, 1],
    [base, lower, ratio],
  )
}

/** Tablero perforado con las siluetas de las herramientas (típico de los talleres). */
function usePegboard() {
  return useTex(1024, 512, (ctx, w, h) => {
    ctx.fillStyle = '#c9a874'
    ctx.fillRect(0, 0, w, h)
    noise(ctx, w, h, 14)
    ctx.fillStyle = 'rgba(60,40,20,0.55)'
    for (let x = 16; x < w; x += 32) for (let y = 16; y < h; y += 32) ctx.fillRect(x - 3, y - 3, 6, 6)
    // siluetas pintadas
    ctx.fillStyle = 'rgba(30,30,32,0.75)'
    const tool = (x: number, y: number, draw: () => void) => {
      ctx.save()
      ctx.translate(x, y)
      draw()
      ctx.restore()
    }
    // martillo
    tool(110, 90, () => {
      ctx.fillRect(-8, 0, 16, 260)
      ctx.fillRect(-55, -10, 110, 40)
    })
    // llave fija
    tool(260, 100, () => {
      ctx.fillRect(-10, 20, 20, 240)
      ctx.beginPath()
      ctx.arc(0, 0, 36, 0, Math.PI * 2)
      ctx.fill()
    })
    // pinza
    tool(400, 90, () => {
      ctx.beginPath()
      ctx.moveTo(-14, 0)
      ctx.lineTo(14, 0)
      ctx.lineTo(30, 270)
      ctx.lineTo(10, 270)
      ctx.lineTo(0, 120)
      ctx.lineTo(-10, 270)
      ctx.lineTo(-30, 270)
      ctx.closePath()
      ctx.fill()
    })
    // destornilladores
    for (let i = 0; i < 4; i++)
      tool(530 + i * 60, 80, () => {
        ctx.fillRect(-14, 0, 28, 110)
        ctx.fillRect(-4, 110, 8, 180 - i * 20)
      })
    // escuadra
    tool(840, 90, () => {
      ctx.fillRect(0, 0, 26, 300)
      ctx.fillRect(0, 274, 150, 26)
    })
  })
}

/* ------------------------------------------------------------------ piezas del ambiente */

function Floor({ size, map, color = '#ffffff', roughness = 0.9, metalness = 0, y = 0 }: { size: number; map?: THREE.Texture; color?: string; roughness?: number; metalness?: number; y?: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y - 0.001, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial map={map} color={color} roughness={roughness} metalness={metalness} envMapIntensity={0.4} />
    </mesh>
  )
}

/** Dos paredes en esquina, detrás del modelo (sólo se ven desde adelante). */
function Walls({ dist, height, map, color = '#ffffff' }: { dist: number; height: number; map?: THREE.Texture; color?: string }) {
  const len = dist * 6
  return (
    <group>
      <mesh position={[0, height / 2, -dist]} receiveShadow>
        <planeGeometry args={[len, height]} />
        <meshStandardMaterial map={map} color={color} roughness={0.92} side={THREE.FrontSide} envMapIntensity={0.3} />
      </mesh>
      <mesh position={[-dist, height / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[len, height]} />
        <meshStandardMaterial map={map} color={color} roughness={0.92} side={THREE.FrontSide} envMapIntensity={0.3} />
      </mesh>
    </group>
  )
}

/** Franja de seguridad amarilla y negra alrededor de la zona de la máquina. */
function SafetyFrame({ half, width }: { half: number; width: number }) {
  const tex = useTex(
    256,
    32,
    (ctx, w, h) => {
      ctx.fillStyle = '#f2c40f'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#151515'
      for (let x = -h; x < w + h; x += 32) {
        ctx.beginPath()
        ctx.moveTo(x, h)
        ctx.lineTo(x + 16, h)
        ctx.lineTo(x + 16 + h, 0)
        ctx.lineTo(x + h, 0)
        ctx.fill()
      }
      noise(ctx, w, h, 20)
    },
    [Math.max(1, Math.round((half * 2) / (width * 8))), 1],
    [half, width],
  )
  return (
    <group position={[0, 0.002, 0]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, (i * Math.PI) / 2]} position={[Math.sin((i * Math.PI) / 2) * half, 0, Math.cos((i * Math.PI) / 2) * half]} receiveShadow>
          <planeGeometry args={[half * 2 + width, width]} />
          <meshStandardMaterial map={tex} roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

function Sign({ position, rotation = [0, 0, 0], w, text, sub, color = '#1d4ed8' }: { position: [number, number, number]; rotation?: [number, number, number]; w: number; text: string; sub?: string; color?: string }) {
  const tex = useTex(
    512,
    256,
    (ctx, cw, ch) => {
      ctx.fillStyle = '#f4f4ef'
      ctx.fillRect(0, 0, cw, ch)
      ctx.fillStyle = color
      ctx.fillRect(0, 0, cw, 84)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 54px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(text, cw / 2, 62)
      if (sub) {
        ctx.fillStyle = '#111'
        ctx.font = 'bold 38px Arial'
        sub.split('\n').forEach((l, i) => ctx.fillText(l, cw / 2, 140 + i * 48))
      }
      ctx.strokeStyle = '#111'
      ctx.lineWidth = 6
      ctx.strokeRect(3, 3, cw - 6, ch - 6)
    },
    [1, 1],
    [text, sub, color],
  )
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[w, w / 2]} />
      <meshStandardMaterial map={tex} roughness={0.6} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ entornos */

function Taller({ size }: { size: number }) {
  const floor = useConcrete(8)
  const wall = useWall('#d9d6cf', '#3d6b5c', 0.32)
  const peg = usePegboard()
  const d = size * 2.6
  const h = size * 3.2
  return (
    <group>
      <Floor size={size * 40} map={floor} />
      <SafetyFrame half={size * 1.6} width={size * 0.12} />
      <Walls dist={d} height={h} map={wall} />
      <mesh position={[size * 0.4, h * 0.55, -d + 0.01]}>
        <planeGeometry args={[size * 2.4, size * 1.2]} />
        <meshStandardMaterial map={peg} roughness={0.85} />
      </mesh>
      <Sign position={[-d + 0.01, h * 0.6, size * 0.6]} rotation={[0, Math.PI / 2, 0]} w={size * 1.1} text="SEGURIDAD" sub={'Usá anteojos\ny ropa ajustada'} color="#15803d" />
    </group>
  )
}

function Banco({ size }: { size: number }) {
  const steel = useTex(
    1024,
    1024,
    (ctx, w, h) => {
      ctx.fillStyle = '#8c939b'
      ctx.fillRect(0, 0, w, h)
      // cepillado
      for (let y = 0; y < h; y++) {
        ctx.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '0,0,0'},${Math.random() * 0.06})`
        ctx.fillRect(0, y, w, 1)
      }
      // rayones y marcas de uso
      ctx.strokeStyle = 'rgba(40,44,50,0.25)'
      for (let i = 0; i < 70; i++) {
        ctx.lineWidth = Math.random() * 2
        ctx.beginPath()
        const x = Math.random() * w
        const y = Math.random() * h
        ctx.moveTo(x, y)
        ctx.lineTo(x + (Math.random() - 0.5) * 220, y + (Math.random() - 0.5) * 40)
        ctx.stroke()
      }
      blotches(ctx, w, h, 14, 'rgba(70,60,40,0.12)', 140)
    },
    [3, 3],
  )
  const wall = useWall('#d9d6cf', '#3d6b5c', 0.25)
  const peg = usePegboard()
  const floor = useConcrete(6)
  const top = size * 7
  const d = size * 2.2
  return (
    <group>
      {/* tapa del banco de acero con su canto */}
      <Floor size={top} map={steel} roughness={0.45} metalness={0.6} />
      <mesh position={[0, -size * 0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[top, size * 0.2, top]} />
        <meshStandardMaterial color="#5f656c" metalness={0.6} roughness={0.5} />
      </mesh>
      <Floor size={size * 60} map={floor} y={-size * 3} />
      <Walls dist={d} height={size * 3} map={wall} />
      <mesh position={[0, size * 1.4, -d + 0.01]}>
        <planeGeometry args={[size * 3, size * 1.5]} />
        <meshStandardMaterial map={peg} roughness={0.85} />
      </mesh>
    </group>
  )
}

function Soldadura({ size }: { size: number }) {
  const plate = useTex(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#6f747a'
      ctx.fillRect(0, 0, w, h)
      noise(ctx, w, h, 22)
      // chapa antideslizante (rombos en relieve)
      for (let y = 0; y < h; y += 32)
        for (let x = (y / 32) % 2 ? 16 : 0; x < w; x += 32) {
          ctx.save()
          ctx.translate(x + 8, y + 8)
          ctx.rotate(((x + y) / 32) % 2 ? Math.PI / 4 : -Math.PI / 4)
          ctx.fillStyle = 'rgba(210,214,220,0.55)'
          ctx.fillRect(-11, -2.5, 22, 5)
          ctx.fillStyle = 'rgba(20,20,22,0.45)'
          ctx.fillRect(-11, 2.5, 22, 2)
          ctx.restore()
        }
      blotches(ctx, w, h, 10, 'rgba(30,25,20,0.35)', 80)
    },
    [10, 10],
  )
  const brick = useTex(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#3a3a3c'
      ctx.fillRect(0, 0, w, h)
      const bh = 32
      const bw = 96
      for (let row = 0; row * bh < h; row++)
        for (let x = row % 2 ? -bw / 2 : 0; x < w; x += bw) {
          const g = 70 + Math.random() * 25
          ctx.fillStyle = `rgb(${g},${g * 0.98},${g * 0.95})`
          ctx.fillRect(x + 3, row * bh + 3, bw - 6, bh - 6)
        }
      noise(ctx, w, h, 16)
      blotches(ctx, w, h, 16, 'rgba(0,0,0,0.25)', 120)
    },
    [4, 3],
  )
  const curtain = useTex(
    256,
    256,
    (ctx, w, h) => {
      // tiras de cortina de soldar con pliegues
      for (let x = 0; x < w; x++) {
        const k = 0.55 + 0.25 * Math.sin((x / w) * Math.PI * 8) + 0.1 * Math.sin((x / w) * Math.PI * 23)
        ctx.fillStyle = `rgba(${Math.round(230 * k)},${Math.round(90 * k)},${Math.round(20 * k)},1)`
        ctx.fillRect(x, 0, 1, h)
      }
    },
    [1, 1],
  )
  const d = size * 2.4
  const h = size * 3.2
  return (
    <group>
      <Floor size={size * 30} map={plate} roughness={0.55} metalness={0.5} />
      <Walls dist={d} height={h} map={brick} />
      {/* cortinas de soldar a los costados */}
      <mesh position={[d * 1.05, h * 0.42, -d * 0.1]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[d * 2, h * 0.84]} />
        <meshStandardMaterial map={curtain} transparent opacity={0.72} side={THREE.DoubleSide} roughness={0.5} depthWrite={false} />
      </mesh>
      <Sign position={[size * 0.6, h * 0.62, -d + 0.01]} w={size * 1.2} text="¡PELIGRO!" sub={'Arco eléctrico\nUsá la máscara'} color="#dc2626" />
    </group>
  )
}

function Computacion({ size }: { size: number }) {
  const wood = useTex(
    1024,
    1024,
    (ctx, w, h) => {
      ctx.fillStyle = '#a8794e'
      ctx.fillRect(0, 0, w, h)
      // vetas
      for (let i = 0; i < 160; i++) {
        const y = Math.random() * h
        ctx.strokeStyle = `rgba(${Math.random() < 0.5 ? '90,55,28' : '200,150,100'},${0.08 + Math.random() * 0.16})`
        ctx.lineWidth = 1 + Math.random() * 4
        ctx.beginPath()
        ctx.moveTo(0, y)
        for (let x = 0; x <= w; x += 32) ctx.lineTo(x, y + Math.sin(x / 90 + i) * 6)
        ctx.stroke()
      }
      noise(ctx, w, h, 10)
    },
    [3, 3],
  )
  const wall = useWall('#cfd6df', '#cfd6df', 0)
  const pad = useTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#1d222b'
    ctx.fillRect(0, 0, w, h)
    noise(ctx, w, h, 12)
  })
  const top = size * 9
  const d = size * 2.3
  return (
    <group>
      <Floor size={top} map={wood} roughness={0.55} />
      <mesh position={[0, -size * 0.12, 0]} receiveShadow>
        <boxGeometry args={[top, size * 0.24, top]} />
        <meshStandardMaterial color="#7a5434" roughness={0.6} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[size * 2.8, size * 2.2]} />
        <meshStandardMaterial map={pad} roughness={0.95} />
      </mesh>
      <Floor size={size * 60} color="#56514b" y={-size * 3} />
      <Walls dist={d} height={size * 3.2} map={wall} />
    </group>
  )
}

function Electricidad({ size }: { size: number }) {
  const tiles = useTex(
    512,
    512,
    (ctx, w, h) => {
      const n = 4
      const s = w / n
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          const g = 190 + Math.random() * 18
          ctx.fillStyle = `rgb(${g},${g - 4},${g - 10})`
          ctx.fillRect(i * s, j * s, s, s)
        }
      ctx.strokeStyle = 'rgba(80,80,80,0.6)'
      ctx.lineWidth = 3
      for (let i = 0; i <= n; i++) {
        ctx.beginPath()
        ctx.moveTo(i * s, 0)
        ctx.lineTo(i * s, h)
        ctx.moveTo(0, i * s)
        ctx.lineTo(w, i * s)
        ctx.stroke()
      }
      noise(ctx, w, h, 10)
    },
    [12, 12],
  )
  const wall = useWall('#e4e2dc', '#9aa3ad', 0.12)
  const d = size * 2.3
  const h = size * 3
  return (
    <group>
      <Floor size={size * 40} map={tiles} roughness={0.6} />
      <Walls dist={d} height={h} map={wall} />
      {/* bandeja portacables a lo largo de la pared */}
      <mesh position={[0, h * 0.82, -d + size * 0.08]}>
        <boxGeometry args={[d * 6, size * 0.12, size * 0.16]} />
        <meshStandardMaterial color="#b9bec4" metalness={0.8} roughness={0.35} />
      </mesh>
      {/* caño de bajada hasta la bandeja */}
      <mesh position={[-size * 0.6, h * 0.41, -d + size * 0.06]}>
        <cylinderGeometry args={[size * 0.035, size * 0.035, h * 0.82, 16]} />
        <meshStandardMaterial color="#d6d3cc" roughness={0.6} />
      </mesh>
      <Sign position={[size * 0.8, h * 0.55, -d + 0.01]} w={size * 1.1} text="RIESGO ELÉCTRICO" sub={'Cortá la energía\nantes de trabajar'} color="#ca8a04" />
    </group>
  )
}

/** Plancha de corte verde de electrónica (cuadrícula de 1 cm: los modelos de electrónica están en cm). */
function Electronica() {
  const tex = useTex(
    1024,
    1024,
    (ctx, S) => {
      ctx.fillStyle = '#1f423c'
      ctx.fillRect(0, 0, S, S)
      noise(ctx, S, S, 7)
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
      }
    },
    [4, 4],
  )
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial map={tex} roughness={0.95} metalness={0} envMapIntensity={0.35} />
      </mesh>
      <mesh position={[0, -0.16, 0]} receiveShadow>
        <boxGeometry args={[40, 0.3, 40]} />
        <meshStandardMaterial color="#244a45" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.32, 0]} receiveShadow>
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial color="#6d5a45" roughness={0.8} />
      </mesh>
    </group>
  )
}

export function Environment({ name, size }: { name: EnvName; size: number }) {
  // se redondea para no regenerar todo por cambios mínimos de tamaño
  const s = Math.max(0.5, Math.round(size * 4) / 4)
  switch (name) {
    case 'taller':
      return <Taller size={s} />
    case 'banco':
      return <Banco size={s} />
    case 'soldadura':
      return <Soldadura size={s} />
    case 'computacion':
      return <Computacion size={s} />
    case 'electricidad':
      return <Electricidad size={s} />
    default:
      return <Electronica />
  }
}
