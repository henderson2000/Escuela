// Datos de TornoMecanizados (partes, textos y cálculos) sin three.js: los usan las páginas de teoría y del taller,
// que así no tienen que esperar a que se descargue el 3D.

export type XZ = [number, number]

export const D = Math.PI / 180

export const TAN30 = Math.tan(30 * D)

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a), 0, 1)

export const sm = (t: number) => t * t * (3 - 2 * t)

export type OpId = 'frenteado' | 'cilindrado' | 'perforado' | 'conico' | 'contrapunta' | 'ranurado' | 'roscado' | 'moleteado' | 'interior'

export interface MecParams {
  op: OpId
  play: boolean
  progreso: number // 0–100
  velocidad: number
  angulo: number // ángulo del charriot (desbaste cónico), grados
  tronzar: boolean
  corte: boolean
  flechas: boolean
}

/** Duración de un ciclo completo (s) a velocidad ×1. */
export const OP_DURATION: Record<OpId, number> = {
  frenteado: 8,
  cilindrado: 9,
  perforado: 13,
  conico: 13,
  contrapunta: 12,
  ranurado: 8,
  roscado: 22,
  moleteado: 9,
  interior: 12,
}

/* ================================================================== cinemática de cada operación */

/* ---- frenteado ---- */
export const FR = { R: 2.5, x0: 7, a: 0.3 }

export function kFrente(p: number) {
  const x1 = FR.x0 - FR.a
  let x: number
  let z: number
  let cutR = FR.R
  if (p < 0.12) {
    x = lerp(FR.x0 + 0.9, x1, sm(seg(p, 0, 0.12)))
    z = FR.R + 0.6
  } else if (p < 0.9) {
    x = x1
    z = lerp(FR.R + 0.6, 0, seg(p, 0.12, 0.9))
    cutR = clamp(z, 0, FR.R)
  } else {
    x = lerp(x1, x1 + 1.0, sm(seg(p, 0.9, 1)))
    z = 0
    cutR = 0
  }
  return { tip: [x, z] as XZ, cutR, x1, cutting: p >= 0.12 && p < 0.9 && z < FR.R }
}

/* ---- cilindrado ---- */
export const CI = { R0: 2.5, R1: 1.9, x1: 9, xs: 2 }

export function kCil(p: number) {
  let x: number
  let z: number
  let xc = CI.x1
  if (p < 0.1) {
    x = CI.x1 + 0.6
    z = lerp(CI.R0 + 0.7, CI.R1, sm(seg(p, 0, 0.1)))
  } else if (p < 0.9) {
    x = lerp(CI.x1 + 0.6, CI.xs, seg(p, 0.1, 0.9))
    z = CI.R1
    xc = clamp(x, CI.xs, CI.x1)
  } else {
    x = CI.xs
    z = lerp(CI.R1, CI.R0 + 0.8, sm(seg(p, 0.9, 1)))
    xc = CI.xs
  }
  return { tip: [x, z] as XZ, xc, cutting: p >= 0.1 && p < 0.9 && x < CI.x1 }
}

/* ---- perforado (mecha de centrar y broca en el mandril de la contrapunta) ---- */
export const PE = { R: 2.5, x1: 7, rd: 0.5, depth: 5, cs: 0.6 }

export const MECHA_OFF = 11.95

export const BROCA_OFF = 19.6

export const XT_M = 8 + MECHA_OFF + 0.8 + 1.5

export const XT_B = 8 + BROCA_OFF + 0.8 + 1.5

export function kPerf(p: number) {
  let tool: 'mecha' | 'broca' = 'mecha'
  let tipX = 8
  let xt = XT_M
  let cs = 0
  let dd = 0
  let cutting = false
  if (p < 0.08) tipX = lerp(8, PE.x1, sm(seg(p, 0, 0.08)))
  else if (p < 0.25) {
    tipX = lerp(PE.x1, PE.x1 - PE.cs, seg(p, 0.08, 0.25))
    cs = PE.x1 - tipX
    cutting = true
  } else if (p < 0.3) {
    tipX = lerp(PE.x1 - PE.cs, 8, sm(seg(p, 0.25, 0.3)))
    cs = PE.cs
  } else if (p < 0.35) {
    xt = lerp(XT_M, XT_B, sm(seg(p, 0.3, 0.35)))
    tipX = 8 + (xt - XT_M)
    cs = PE.cs
  } else {
    tool = 'broca'
    xt = XT_B
    cs = PE.cs
    const lp = PE.rd / Math.tan(59 * D)
    if (p < 0.4) tipX = 8
    else if (p < 0.48) tipX = lerp(8, PE.x1, sm(seg(p, 0.4, 0.48)))
    else if (p < 0.9) {
      tipX = lerp(PE.x1, PE.x1 - PE.depth - lp, seg(p, 0.48, 0.9))
      dd = PE.x1 - tipX
      cutting = true
    } else {
      dd = PE.depth + lp
      tipX = lerp(PE.x1 - dd, 8.5, sm(seg(p, 0.9, 1)))
    }
  }
  const off = tool === 'mecha' ? MECHA_OFF : BROCA_OFF
  const qe = xt - (tipX + off + 0.8)
  return { tool, tipX, xt, qe, cs, dd, cutting }
}

/* ---- desbaste cónico con el charriot ---- */
export const CO = { R0: 2.5, x1: 8, Lc: 4, n: 3 }

export function kCon(p: number, angDeg: number) {
  const a = angDeg * D
  const ta = Math.tan(a)
  const n = CO.n
  const k = Math.min(Math.floor(p * n), n - 1)
  const q = p * n - k
  const xsOf = (j: number) => CO.x1 - (CO.Lc * (j + 1)) / n
  const line = (j: number, x: number) => CO.R0 - (x - xsOf(j)) * ta
  const sx = CO.x1 + 0.5
  const start: XZ = [sx, Math.max(0.2, line(k, sx))]
  const ex = xsOf(k) - 0.3
  const end: XZ = [ex, line(k, ex)]
  const dist = Math.hypot(end[0] - start[0], end[1] - start[1])
  let tip: XZ
  let slide = 0
  let done = k // pasadas terminadas
  let partialX: number | null = null
  let cutting = false
  if (q < 0.12) {
    const t = sm(seg(q, 0, 0.12))
    tip = [start[0], lerp(start[1] + 0.8, start[1], t)]
  } else if (q < 0.85) {
    const t = seg(q, 0.12, 0.85)
    tip = [lerp(start[0], end[0], t), lerp(start[1], end[1], t)]
    slide = t * dist
    partialX = tip[0]
    cutting = tip[0] < CO.x1 && tip[1] < CO.R0
  } else {
    const t = sm(seg(q, 0.85, 1))
    done = k + 1
    const nk = Math.min(k + 1, n - 1)
    const back: XZ = k + 1 < n ? [sx, Math.max(0.2, line(nk, sx)) + 0.8] : [end[0] + 0.5, end[1] + 1.0]
    tip = [lerp(end[0], back[0], t), lerp(end[1], back[1], t)]
    slide = dist * (1 - t)
  }
  const r = (x: number) => {
    let v = CO.R0
    for (let j = 0; j < done; j++) v = Math.min(v, line(j, x))
    if (partialX !== null && x >= partialX) v = Math.min(v, line(k, x))
    return Math.max(0.05, v)
  }
  const breaks = [CO.x1]
  for (let j = 0; j < n; j++) breaks.push(xsOf(j))
  return { tip, slide, a, r, partialX, breaks, k, cutting, dMin: 2 * (CO.R0 - CO.Lc * ta) }
}

/* ---- cono desplazando la contrapunta (entre puntas) ---- */
export const CP = { R0: 2.0, Lt: 18, Lc: 12, dr: 0.8, xL: -4.55 }

export const CP_TH = Math.atan(CP.dr / CP.Lc)

export const CP_E = (CP.dr * CP.Lt) / CP.Lc

export function kCP(p: number) {
  const ta = Math.tan(CP_TH)
  const c = Math.cos(CP_TH)
  const s = Math.sin(CP_TH)
  const x0c = CP.Lt - CP.Lc
  const line = (j: number, x: number) => CP.R0 - (x - x0c) * ta + (j === 0 ? CP.dr / 2 : 0)
  const ztOf = (j: number) => (line(j, 0) + 0) * c // r(x') = zt/cos − x'·tan → zt = r(0)·cos
  const xw = (xl: number, zt: number) => CP.xL + (xl - zt * s) / c
  const xlOf = (xw0: number, zt: number) => (xw0 - CP.xL) * c + zt * s
  const k = Math.min(Math.floor(p * 2), 1)
  const q = p * 2 - k
  const zt = ztOf(k)
  const xa = xw(CP.Lt + 0.7, zt)
  const xb = xw(x0c - (k === 0 ? -CP.Lc / 2 : 0) - 0.6, zt)
  let tip: XZ
  let done = k
  let partialXl: number | null = null
  let cutting = false
  if (q < 0.1) tip = [xa, lerp(zt + 0.8, zt, sm(seg(q, 0, 0.1)))]
  else if (q < 0.85) {
    tip = [lerp(xa, xb, seg(q, 0.1, 0.85)), zt]
    partialXl = xlOf(tip[0], zt)
    cutting = partialXl < CP.Lt && line(k, partialXl) < CP.R0
  } else {
    const t = sm(seg(q, 0.85, 1))
    done = k + 1
    const zn = k === 0 ? ztOf(1) : zt
    tip = [lerp(xb, xa, t), lerp(zt, zn, t) + Math.sin(t * Math.PI) * 0.9 + (k === 1 ? t * 0.8 : 0)]
  }
  const r = (xl: number) => {
    let v = CP.R0
    for (let j = 0; j < done; j++) v = Math.min(v, line(j, xl))
    if (partialXl !== null && xl >= partialXl) v = Math.min(v, line(k, xl))
    return v
  }
  const breaks = [x0c, x0c + CP.Lc / 2, CP.Lt]
  return { tip, r, partialXl, breaks, k, cutting }
}

/* ---- ranurado y tronzado ---- */
export const RA = { R: 2.5, x1: 8, xg: 4.5, w: 0.32, dg: 0.8 }

export function kRan(p: number, tronzar: boolean) {
  const rg = tronzar ? 0 : RA.R - RA.dg
  let z: number
  let rc = RA.R
  let fall = 0
  let cutting = false
  if (p < 0.1) z = lerp(RA.R + 1, RA.R, sm(seg(p, 0, 0.1)))
  else if (p < 0.8) {
    z = lerp(RA.R, rg, seg(p, 0.1, 0.8))
    rc = z
    cutting = true
  } else {
    const t = seg(p, 0.8, 1)
    rc = rg
    if (tronzar) {
      fall = seg(p, 0.8, 0.94)
      z = lerp(0, RA.R + 1.2, sm(t))
    } else z = lerp(rg, RA.R + 1, sm(t))
  }
  return { tip: [RA.xg, z] as XZ, rc, fall, cutting }
}

/* ---- roscado (M42 × 4,5, cuatro pasadas, penetración en flanco con el charriot) ---- */
export const RO = { R: 2.1, x1: 9, xr0: 1.6, xr1: 2.2, rr: 1.78, p: 0.45, H: 0.6134 * 0.45, n: 4, xs: 9.7, xe: 1.9 }

export const roD = (k: number) => RO.H * Math.sqrt((k + 1) / RO.n)

export function kRos(p: number) {
  const n = RO.n
  const k = Math.min(Math.floor(p * n), n - 1)
  const q = p * n - k
  const d = roD(k)
  const dl = -d * TAN30 // corrimiento axial por penetrar en flanco
  let xf = RO.xs
  let z: number
  let doneK = k
  let partialX: number | null = null
  let cutting = false
  let infeed = d
  if (q < 0.08) {
    const t = sm(seg(q, 0, 0.08))
    z = lerp(RO.R + 0.5, RO.R - d, t)
    infeed = d * t
  } else if (q < 0.68) {
    xf = lerp(RO.xs, RO.xe, seg(q, 0.08, 0.68))
    z = RO.R - d
    partialX = xf + dl
    cutting = partialX < RO.x1 && partialX > RO.xr1
  } else if (q < 0.76) {
    xf = RO.xe
    doneK = k + 1
    z = lerp(RO.R - d, RO.R + 0.5, sm(seg(q, 0.68, 0.76)))
  } else {
    doneK = k + 1
    xf = lerp(RO.xe, RO.xs, sm(seg(q, 0.76, 1)))
    z = RO.R + 0.5
  }
  const tipX = xf + (q < 0.08 ? lerp(0, dl, sm(seg(q, 0, 0.08))) : dl)
  const passes: { d: number; dl: number; from: number }[] = []
  for (let j = 0; j < doneK; j++) passes.push({ d: roD(j), dl: -roD(j) * TAN30, from: -1e9 })
  if (partialX !== null) passes.push({ d, dl, from: partialX })
  const angle = (2 * Math.PI * (RO.xs - xf)) / RO.p
  return { tip: [tipX, z] as XZ, angle, passes, k, cutting, infeed }
}

/* ---- moleteado ---- */
export const MO = { R: 2.0, x1: 8.5, xa: 3.0, xb: 8.0, rw: 1.0, kd: 0.035, h: 0.09, n: 48, pa: 0.32, dy: 1.15 }

export const MO_ZC = Math.sqrt((MO.R + MO.rw - MO.kd) ** 2 - MO.dy ** 2)

export function kMol(p: number) {
  let x: number
  let z: number
  let from = MO.xb
  if (p < 0.1) {
    x = MO.xb + 0.2
    z = lerp(MO_ZC + 0.8, MO_ZC, sm(seg(p, 0, 0.1)))
  } else if (p < 0.9) {
    x = lerp(MO.xb + 0.2, MO.xa + 0.4, seg(p, 0.1, 0.9))
    z = MO_ZC
    from = clamp(x - 0.4, MO.xa, MO.xb)
  } else {
    x = MO.xa + 0.4
    z = lerp(MO_ZC, MO_ZC + 0.8, sm(seg(p, 0.9, 1)))
    from = MO.xa
  }
  return { tip: [x, z] as XZ, from, working: p >= 0.1 && p < 0.9 }
}

/* ---- torneado interior ---- */
export const IN = { R: 2.5, x1: 7, r0: 0.8, xh: 2.0, rk: [1.1, 1.4], xb: 3.0 }

export function kInt(p: number) {
  const k = Math.min(Math.floor(p * 2), 1)
  const q = p * 2 - k
  const prev = k > 0 ? IN.rk[k - 1] : IN.r0
  const cur = IN.rk[k]
  let x: number
  let z: number
  let done = prev
  let partialX: number | null = null
  if (q < 0.12) {
    x = IN.x1 + 0.6
    z = lerp(prev - 0.15, cur, sm(seg(q, 0, 0.12)))
  } else if (q < 0.82) {
    x = lerp(IN.x1 + 0.6, IN.xb, seg(q, 0.12, 0.82))
    z = cur
    partialX = clamp(x, IN.xb, IN.x1)
  } else if (q < 0.9) {
    x = IN.xb
    z = lerp(cur, cur - 0.25, sm(seg(q, 0.82, 0.9)))
    done = cur
  } else {
    x = lerp(IN.xb, IN.x1 + 0.6, sm(seg(q, 0.9, 1)))
    z = cur - 0.25
    done = cur
  }
  return { tip: [x, z] as XZ, prev, cur, done, partialX, k, cutting: partialX !== null && x < IN.x1 }
}

/* ================================================================== lecturas (para el panel) */

export const f = (v: number, d = 0) => v.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d })

export function opReadouts(prm: MecParams): [string, string][] {
  const p = clamp(prm.progreso / 100, 0, 1)
  switch (prm.op) {
    case 'frenteado': {
      const k = kFrente(p)
      const done = p >= 0.9 ? 1 : p < 0.12 ? 0 : (FR.R - k.cutR) / FR.R
      return [
        ['Largo que sobresale de las mordazas', `${f((p >= 0.12 && k.cutR < FR.R ? k.x1 : FR.x0) * 10)} mm (bruto ${f(FR.x0 * 10)} mm)`],
        ['Profundidad de pasada (axial)', `${f(FR.a * 10)} mm`],
        ['Cara refrentada', `${f(done * 100)} % (avance hacia el eje)`],
      ]
    }
    case 'cilindrado': {
      const k = kCil(p)
      return [
        ['Diámetro', `Ø ${f(CI.R0 * 20)} → Ø ${f(CI.R1 * 20)} mm`],
        ['Profundidad de pasada ap', `${f((CI.R0 - CI.R1) * 10)} mm`],
        ['Largo cilindrado', `${f((CI.x1 - k.xc) * 10)} de ${f((CI.x1 - CI.xs) * 10)} mm`],
        ['Ángulo de posición κr', '≈ 93° (portainsertos a 90° del eje)'],
      ]
    }
    case 'perforado': {
      const k = kPerf(p)
      return [
        ['Herramienta en el mandril', k.tool === 'mecha' ? 'Mecha de centrar (60°)' : `Broca Ø ${f(PE.rd * 20)} mm`],
        ['Profundidad', k.tool === 'mecha' ? `${f(k.cs * 10, 1)} mm (centrado)` : `${f(Math.max(0, k.dd) * 10)} mm`],
        ['Salida del manguito', `${f(k.qe * 10)} mm`],
      ]
    }
    case 'conico': {
      const k = kCon(p, prm.angulo)
      return [
        ['Giro del charriot α', `${f(prm.angulo)}°`],
        ['Cono', `Ø ${f(CO.R0 * 20)} → Ø ${f(k.dMin * 10, 1)} mm en ${f(CO.Lc * 10)} mm`],
        ['Pasada', `${k.k + 1} de ${CO.n} (avance a mano con el charriot)`],
      ]
    }
    case 'contrapunta': {
      const k = kCP(p)
      return [
        ['Desplazamiento de la contrapunta', `e = (${f(CP.R0 * 20)} − ${f((CP.R0 - CP.dr) * 20)}) × ${f(CP.Lt * 10)} / (${f(CP.Lc * 10)} × 2) = ${f(CP_E * 10)} mm`],
        ['Cono', `Ø ${f(CP.R0 * 20)} → Ø ${f((CP.R0 - CP.dr) * 20)} mm, largo ${f(CP.Lc * 10)} mm`],
        ['Pasada', `${k.k + 1} de 2 (avance automático paralelo a la bancada)`],
      ]
    }
    case 'ranurado': {
      const k = kRan(p, prm.tronzar)
      return [
        ['Ancho de la ranura', `${f(RA.w * 10, 1)} mm (ancho del inserto)`],
        ['Profundidad', `${f((RA.R - k.rc) * 10, 1)} mm`],
        ['Diámetro del fondo', k.rc <= 0.001 ? 'pieza tronzada (cortada)' : `Ø ${f(k.rc * 20, 1)} mm`],
      ]
    }
    case 'roscado': {
      const k = kRos(p)
      return [
        ['Rosca', `M${f(RO.R * 20)} × ${f(RO.p * 10, 1)} (paso = avance por vuelta)`],
        ['Pasada', `${k.k + 1} de ${RO.n} — penetración ${f(roD(k.k) * 10, 2)} mm`],
        ['Profundidad del filete h', `0,6134 × P = ${f(RO.H * 10, 2)} mm`],
        ['Charriot en flanco', 'β = 90° − α/2 = 90° − 30° = 60°'],
      ]
    }
    case 'moleteado': {
      const k = kMol(p)
      return [
        ['Largo moleteado', `${f((MO.xb - k.from) * 10)} de ${f((MO.xb - MO.xa) * 10)} mm`],
        ['Viruta', 'ninguna: la moleta comprime el material'],
        ['Diámetro', `Ø ${f(MO.R * 20)} mm (sube un poco en las crestas)`],
      ]
    }
    case 'interior': {
      const k = kInt(p)
      const now = k.partialX !== null ? k.cur : k.done
      return [
        ['Agujero previo (broca)', `Ø ${f(IN.r0 * 20)} mm`],
        ['Diámetro interior', `Ø ${f(now * 20)} mm`],
        ['Pasada', `${k.k + 1} de 2, profundidad ${f((IN.x1 - IN.xb) * 10)} mm`],
      ]
    }
  }
}
