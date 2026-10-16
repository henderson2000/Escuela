// Código de colores de resistencias (IEC 60062)

export type ColorName =
  | 'negro' | 'marron' | 'rojo' | 'naranja' | 'amarillo' | 'verde'
  | 'azul' | 'violeta' | 'gris' | 'blanco' | 'dorado' | 'plateado'

export interface BandColor {
  name: ColorName
  label: string
  hex: string
  digit?: number
  multiplier?: number
  tolerance?: number
}

export const COLORS: Record<ColorName, BandColor> = {
  negro: { name: 'negro', label: 'Negro', hex: '#151515', digit: 0, multiplier: 1 },
  marron: { name: 'marron', label: 'Marrón', hex: '#6b3a1e', digit: 1, multiplier: 10, tolerance: 1 },
  rojo: { name: 'rojo', label: 'Rojo', hex: '#d11b1b', digit: 2, multiplier: 100, tolerance: 2 },
  naranja: { name: 'naranja', label: 'Naranja', hex: '#f07a10', digit: 3, multiplier: 1e3 },
  amarillo: { name: 'amarillo', label: 'Amarillo', hex: '#f5d90a', digit: 4, multiplier: 1e4 },
  verde: { name: 'verde', label: 'Verde', hex: '#1f9d3a', digit: 5, multiplier: 1e5, tolerance: 0.5 },
  azul: { name: 'azul', label: 'Azul', hex: '#1d4fd6', digit: 6, multiplier: 1e6, tolerance: 0.25 },
  violeta: { name: 'violeta', label: 'Violeta', hex: '#7b2fbe', digit: 7, multiplier: 1e7, tolerance: 0.1 },
  gris: { name: 'gris', label: 'Gris', hex: '#8a8a8a', digit: 8, multiplier: 1e8, tolerance: 0.05 },
  blanco: { name: 'blanco', label: 'Blanco', hex: '#f4f4f4', digit: 9, multiplier: 1e9 },
  dorado: { name: 'dorado', label: 'Dorado', hex: '#c9a227', multiplier: 0.1, tolerance: 5 },
  plateado: { name: 'plateado', label: 'Plateado', hex: '#c0c0c8', multiplier: 0.01, tolerance: 10 },
}

export const DIGIT_COLORS = (Object.values(COLORS) as BandColor[]).filter((c) => c.digit !== undefined)
export const MULTIPLIER_COLORS = (Object.values(COLORS) as BandColor[]).filter((c) => c.multiplier !== undefined)
export const TOLERANCE_COLORS = (Object.values(COLORS) as BandColor[]).filter((c) => c.tolerance !== undefined)

export type BandCount = 4 | 5

/** Devuelve los colores de las bandas a partir de un valor en ohms. */
export function valueToBands(ohms: number, count: BandCount, tolerance: number): ColorName[] {
  const sig = count === 4 ? 2 : 3
  const { digits, exp } = normalize(ohms, sig)
  const digitColors = digits.map((d) => DIGIT_COLORS.find((c) => c.digit === d)!.name)
  const mult = MULTIPLIER_COLORS.find((c) => Math.abs(Math.log10(c.multiplier!) - exp) < 1e-9)
  const tol = TOLERANCE_COLORS.find((c) => c.tolerance === tolerance) ?? COLORS.dorado
  return [...digitColors, mult ? mult.name : 'negro', tol.name]
}

/** Valor representable más cercano con la cantidad de cifras significativas de la resistencia. */
export function normalize(ohms: number, sig: number): { digits: number[]; exp: number; value: number } {
  let v = Math.max(ohms, 0.01 * 10 ** (sig - 1))
  let exp = Math.floor(Math.log10(v)) - (sig - 1)
  let mant = Math.round(v / 10 ** exp)
  if (mant >= 10 ** sig) {
    mant = Math.round(mant / 10)
    exp += 1
  }
  exp = Math.min(Math.max(exp, -2), 9)
  mant = Math.min(Math.max(Math.round(v / 10 ** exp), 0), 10 ** sig - 1)
  const digits = String(mant).padStart(sig, '0').split('').map(Number)
  return { digits, exp, value: mant * 10 ** exp }
}

export function bandsToValue(bands: ColorName[]): { ohms: number; tolerance: number } {
  const tolColor = COLORS[bands[bands.length - 1]]
  const multColor = COLORS[bands[bands.length - 2]]
  const digits = bands.slice(0, bands.length - 2).map((b) => COLORS[b].digit ?? 0)
  const base = digits.reduce((acc, d) => acc * 10 + d, 0)
  return { ohms: round(base * (multColor.multiplier ?? 1)), tolerance: tolColor.tolerance ?? 20 }
}

function round(x: number) {
  return Math.round(x * 1000) / 1000
}

export function formatOhms(ohms: number): string {
  if (ohms >= 1e6) return `${trim(ohms / 1e6)} MΩ`
  if (ohms >= 1e3) return `${trim(ohms / 1e3)} kΩ`
  return `${trim(ohms)} Ω`
}

function trim(x: number) {
  return Number(x.toFixed(2)).toString().replace('.', ',')
}

/** Serie E12, la más usada en el aula. */
export const E12 = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2]

export function randomE12(minExp = 1, maxExp = 5): number {
  const base = E12[Math.floor(Math.random() * E12.length)]
  const exp = minExp + Math.floor(Math.random() * (maxExp - minExp + 1))
  return Math.round(base * 10 ** exp)
}
