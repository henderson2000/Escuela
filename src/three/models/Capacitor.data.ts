// Datos de Capacitor (partes, textos y cálculos) sin three.js: los usan las páginas de teoría y del taller,
// que así no tienen que esperar a que se descargue el 3D.

export function formatCap(uF: number): string {
  if (uF >= 1) return `${Number(uF.toFixed(2)).toString().replace('.', ',')} µF`
  if (uF >= 0.001) return `${Number((uF * 1000).toFixed(2)).toString().replace('.', ',')} nF`
  return `${Number((uF * 1e6).toFixed(1)).toString().replace('.', ',')} pF`
}

/** Código de 3 cifras de los capacitores cerámicos (en pF): 104 = 10 × 10⁴ pF = 100 nF */
export function ceramicCode(uF: number): string {
  const pF = Math.round(uF * 1e6)
  if (pF < 100) return String(pF)
  const exp = Math.floor(Math.log10(pF)) - 1
  const two = Math.round(pF / 10 ** exp)
  return `${two}${exp}`
}
