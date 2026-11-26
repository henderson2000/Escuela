// Datos de Torno (partes, textos y cálculos) sin three.js: los usan las páginas de teoría y del taller,
// que así no tienen que esperar a que se descargue el 3D.

export const NOSE_X = -47

export const CHUCK_X = NOSE_X + 2.2

export const JAWS_FRONT = CHUCK_X + 6.6 + 3.2

export const LUNETA_X = 30

export const RPMS = [45, 63, 90, 125, 180, 250, 355, 500, 710, 1000, 1400, 2000]

export type Montaje = 'aire' | 'contrapunta' | 'puntas' | 'luneta'

export type Avance = 'cilindrar' | 'neutro' | 'frentear'

export interface TornoParams {
  rpmIdx: number
  on: boolean
  carro: number // 0–100 %
  trans: number // radio en la punta de la herramienta (mm)
  charriot: number // grados respecto del eje del torno
  contrapunta: number // 0–100 %
  manguito: number // mm que sobresale el cañón
  montaje: Montaje
  avance: Avance
  tuerca: boolean
  tapa: boolean
}

/** Posiciones que dependen de los parámetros (todo en unidades de 10 mm). */
export function tornoLayout(p: TornoParams) {
  let xt = -5 + (69 * p.contrapunta) / 100
  if (p.montaje === 'luneta') xt = Math.max(xt, 52)
  const qe = Math.max(2, Math.min(10, p.manguito / 10))
  const tailTip = xt - qe - 10.2
  const barR = p.montaje === 'luneta' ? 1.25 : 2
  const barX0 = p.montaje === 'puntas' ? -40.0 : -41
  const barX1 = p.montaje === 'aire' ? JAWS_FRONT + 12 : p.montaje === 'luneta' ? LUNETA_X + 10 : tailTip + 0.45
  const xcMin = -29
  let xcMax = p.montaje === 'luneta' ? LUNETA_X - 25 : xt - 21
  if (xcMax < xcMin) xcMax = xcMin
  const xc = xcMin + ((xcMax - xcMin) * p.carro) / 100
  const tipR = Math.max(1.0, Math.min(10, p.trans / 10))
  const cz = tipR + 12
  const toolX = xc - 4.4
  return { xt, qe, tailTip, barR, barX0, barX1, xc, cz, tipR, toolX, jawsFront: JAWS_FRONT }
}
