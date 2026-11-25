import * as THREE from 'three'

/* ------------------------------------------------------------------ */
/* Utilidades compartidas por los modelos de soldadura: cordones con   */
/* sus ondas, texturas de cuero, de chapa y de pintura (todo generado, */
/* sin descargar imágenes).                                            */
/* ------------------------------------------------------------------ */

const hasDoc = typeof document !== 'undefined'

/** Ruido suave periódico (suma de senos con fases fijas: siempre igual, sin costuras). */
export function smoothNoise(seed: number, freq: number) {
  const k = Array.from({ length: 6 }, (_, i) => ({
    fx: Math.round(freq * (1 + ((seed * 7 + i * 13) % 5) * 0.3)),
    fy: Math.round(freq * (1 + ((seed * 3 + i * 11) % 7) * 0.25)),
    p: (seed * 1.7 + i * 2.3) % (Math.PI * 2),
  }))
  return (x: number, y: number, size: number) =>
    k.reduce((s, q) => s + Math.sin(((x * q.fx) / size) * Math.PI * 2 + q.p) * Math.cos(((y * q.fy) / size) * Math.PI * 2 - q.p), 0) / k.length
}

/** Mapa de normales a partir de una función de altura. */
export function normalTex(size: number, height: (x: number, y: number) => number, strength: number, repeat: [number, number] = [1, 1]) {
  if (!hasDoc) return null
  const h = new Float32Array(size * size)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) h[y * size + x] = height(x, y)
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(size, size)
  const at = (x: number, y: number) => h[((y + size) % size) * size + ((x + size) % size)]
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength
      const n = new THREE.Vector3(-dx, -dy, 1).normalize()
      const i = (y * size + x) * 4
      img.data[i] = (n.x * 0.5 + 0.5) * 255
      img.data[i + 1] = (n.y * 0.5 + 0.5) * 255
      img.data[i + 2] = (n.z * 0.5 + 0.5) * 255
      img.data[i + 3] = 255
    }
  ctx.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeat[0], repeat[1])
  return t
}

/** Textura de color dibujada con canvas (se crea una sola vez). */
export function canvasTex(w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, repeat: [number, number] = [1, 1], color = true) {
  if (!hasDoc) return null
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  draw(ctx, w, h)
  const t = new THREE.CanvasTexture(c)
  if (color) t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeat[0], repeat[1])
  t.anisotropy = 8
  return t
}

/** Pseudoaleatorio con semilla (siempre el mismo dibujo). */
export function rng(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

export function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number, seed = 1) {
  const r = rng(seed)
  const img = ctx.getImageData(0, 0, w, h)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * amount
    img.data[i] += n
    img.data[i + 1] += n
    img.data[i + 2] += n
  }
  ctx.putImageData(img, 0, 0)
}

export function blotch(ctx: CanvasRenderingContext2D, w: number, h: number, n: number, color: string, max: number, seed = 2) {
  const r = rng(seed)
  for (let i = 0; i < n; i++) {
    const x = r() * w
    const y = r() * h
    const rad = 6 + r() * max
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
    g.addColorStop(0, color)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
}

/* ================================================================== texturas de superficie */

const nA = smoothNoise(4, 17)
const nB = smoothNoise(9, 43)
/** Cuero (guantes, delantal, polainas): granulado irregular con poros. */
export const LEATHER_N = normalTex(256, (x, y) => nA(x, y, 256) * 0.6 + nB(x, y, 256) * 0.4 + (((x * 7919 + y * 104729) % 97) / 97) * 0.12, 2.6, [3, 3])

const nC = smoothNoise(2, 31)
/** Plástico texturado de la máscara y de los mangos ("piel" fina de inyección). */
export const PLASTIC_N = normalTex(128, (x, y) => nC(x, y, 128), 1.2, [6, 6])

/** Pintura en polvo (gabinete de la máquina): granulado muy fino. */
const nD = smoothNoise(6, 57)
export const POWDER_N = normalTex(256, (x, y) => nD(x, y, 256) + (((x * 31 + y * 17) % 13) / 13) * 0.25, 1.4, [4, 4])

/** Chapa laminada en caliente: cascarilla gris azulada con manchas. */
export const MILL_TEX = canvasTex(
  512,
  512,
  (ctx, w, h) => {
    ctx.fillStyle = '#545a62'
    ctx.fillRect(0, 0, w, h)
    blotch(ctx, w, h, 50, 'rgba(70,80,100,0.35)', 70, 13)
    blotch(ctx, w, h, 30, 'rgba(120,90,70,0.2)', 50, 17)
    speckle(ctx, w, h, 22, 19)
  },
  [1, 1],
)

/** Pinta una chapa con su cascarilla, la franja amolada junto a la junta y los colores de revenido. */
export function drawPlate(ctx: CanvasRenderingContext2D, W: number, H: number, opts: { yc: number; ground: number; tint?: [number, number, number]; gap?: [number, number]; seed?: number }) {
  const sd = opts.seed ?? 21
  ctx.fillStyle = '#5a6068'
  ctx.fillRect(0, 0, W, H)
  blotch(ctx, W, H, 40, 'rgba(70,82,100,0.4)', Math.max(W, H) * 0.06, sd)
  blotch(ctx, W, H, 18, 'rgba(120,90,60,0.25)', Math.max(W, H) * 0.04, sd + 2)
  speckle(ctx, W, H, 18, sd + 8)
  const { yc, ground } = opts
  if (ground > 0) {
    const g = ctx.createLinearGradient(0, yc - ground, 0, yc + ground)
    g.addColorStop(0, 'rgba(190,195,200,0)')
    g.addColorStop(0.25, 'rgba(190,195,200,0.85)')
    g.addColorStop(0.75, 'rgba(190,195,200,0.85)')
    g.addColorStop(1, 'rgba(190,195,200,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, yc - ground, W, ground * 2)
    const r = rng(sd + 10)
    ctx.strokeStyle = 'rgba(230,232,236,0.35)'
    ctx.lineWidth = 1
    for (let i = 0; i < W * 0.6; i++) {
      const x = r() * W
      const y = yc + (r() - 0.5) * ground * 1.8
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + 6 + r() * 10, y - 4 - r() * 6)
      ctx.stroke()
    }
  }
  if (opts.gap) {
    ctx.fillStyle = '#0d0e10'
    ctx.fillRect(opts.gap[0], yc - 3, opts.gap[1] - opts.gap[0], 6)
  }
  if (opts.tint) drawHeatTint(ctx, opts.tint[0], opts.tint[1], yc, opts.tint[2])
}

/* ================================================================== cordón con ondas */

/**
 * Cordón de soldadura como una "loma" sobre la pieza, a lo largo de +x desde 0 hasta `len`, centrado en z = 0.
 * Las ondas (escamas) tienen forma de media luna con la panza hacia el avance, como las de un cordón real.
 * Las coordenadas de textura van: u a lo largo (0 → 1), v de un borde al otro.
 */
export function beadGeometry({
  len,
  width,
  height,
  pitch,
  irregular = 0,
  start = true,
  crater = true,
  phase0 = 0,
}: {
  len: number
  width: number
  height: number
  /** distancia entre ondas */
  pitch: number
  /** 0 = parejo, 1 = muy desparejo */
  irregular?: number
  /** el cordón arranca afinándose (si no, empalma con otro tramo) */
  start?: boolean
  /** termina con el cráter final */
  crater?: boolean
  /** corrimiento de las ondas (para empalmar tramos) */
  phase0?: number
}) {
  const NX = Math.min(900, Math.max(80, Math.round((len / pitch) * 7)))
  const NZ = 20
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  const ss = (e0: number, e1: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)
  }
  for (let i = 0; i <= NX; i++) {
    const t = i / NX
    const x = t * len
    const q = (x + phase0) / width
    const wob = 1 + irregular * (Math.sin(q * 1.3) * 0.5 + Math.sin(q * 3.7 + 1) * 0.3 + Math.sin(q * 9.1 + 2) * 0.2) * 0.35
    const e0 = start ? ss(0, width * 0.7, x) : 1
    const e1 = crater ? ss(0, width * 0.55, len - x) : 1
    const hw = (width / 2) * wob * (0.45 + 0.55 * Math.min(e0, e1 * 0.5 + 0.5))
    // el cráter final queda hundido y el arranque, más bajo
    const hh = height * wob * e0 * (crater ? 0.45 + 0.55 * ss(0, width * 0.9, len - x) : 1)
    for (let j = 0; j <= NZ; j++) {
      const s = -1 + (2 * j) / NZ
      const prof = Math.pow(Math.max(0, 1 - s * s), 0.55)
      // escamas: la panza de la media luna mira hacia adelante (+x)
      const ph = (x + phase0 + 0.55 * hw * s * s) / pitch
      const saw = ph - Math.floor(ph)
      const ripple = Math.pow(saw, 1.6) - 0.4
      const y = hh * prof * (1 + 0.1 * ripple) - (Math.abs(s) > 0.999 ? height * 0.05 : 0)
      pos.push(x, y, s * hw)
      uv.push(t, (s + 1) / 2)
    }
  }
  for (let i = 0; i < NX; i++)
    for (let j = 0; j < NZ; j++) {
      const a = i * (NZ + 1) + j
      const b = a + NZ + 1
      idx.push(a, a + 1, b, b, a + 1, b + 1)
    }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/** Gradiente del metal recién solidificado: oscuro → rojo → amarillo en el cráter (u = 1). */
export const HOT_GRAD = canvasTex(
  256,
  4,
  (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0)
    g.addColorStop(0, '#000000')
    g.addColorStop(0.35, '#3a0800')
    g.addColorStop(0.7, '#c2410c')
    g.addColorStop(0.9, '#fb923c')
    g.addColorStop(1, '#fff1b8')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  },
  [1, 1],
)
if (HOT_GRAD) HOT_GRAD.wrapS = HOT_GRAD.wrapT = THREE.ClampToEdgeWrapping

/** Mancha de luz radial (resplandor del arco, humo). */
export const GLOW = canvasTex(128, 128, (ctx, w, h) => {
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.25, 'rgba(255,255,255,0.55)')
  g.addColorStop(0.6, 'rgba(255,255,255,0.12)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
})
if (GLOW) GLOW.wrapS = GLOW.wrapT = THREE.ClampToEdgeWrapping

/**
 * Colores de revenido alrededor de un cordón, sobre la chapa: pajizo, marrón, violeta y azul,
 * cada vez más cerca del cordón. Se dibuja sobre un canvas ya pintado.
 * (x0, x1) es el tramo soldado en píxeles y `yc` la línea de la junta.
 */
export function drawHeatTint(ctx: CanvasRenderingContext2D, x0: number, x1: number, yc: number, halfPx: number) {
  const bands: [number, string][] = [
    [1.0, 'rgba(200,175,120,0.22)'],
    [0.8, 'rgba(150,100,60,0.3)'],
    [0.62, 'rgba(105,75,115,0.35)'],
    [0.46, 'rgba(60,80,135,0.4)'],
    [0.3, 'rgba(40,40,44,0.6)'],
  ]
  for (const [k, col] of bands) {
    const hh = halfPx * k
    for (let x = x0; x < x1; x += 2) {
      // el ancho de la zona afectada respira un poco, como en una soldadura de verdad
      const fade = Math.min(1, (x - x0) / (halfPx * 1.2))
      const wv = hh * (0.95 + 0.05 * Math.sin((x / halfPx) * 0.7)) * fade
      ctx.fillStyle = col
      ctx.fillRect(x, yc - wv, 2, wv * 2)
    }
  }
}
