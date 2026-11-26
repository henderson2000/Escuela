// Datos de Sensors (partes, textos y cálculos) sin three.js: los usan las páginas de teoría y del taller,
// que así no tienen que esperar a que se descargue el 3D.

/* ------------------------------------------------------------------ */
/* LDR GL5528 (1 unidad = 5 mm): disco cerámico Ø5 × 2 mm               */
/* ------------------------------------------------------------------ */

export function ldrResistance(lightPct: number): number {
  // aproximación logarítmica: ~1 MΩ en oscuridad, ~200 Ω a pleno sol
  const lg = Math.log10(1e6) - (lightPct / 100) * (Math.log10(1e6) - Math.log10(200))
  return Math.round(10 ** lg)
}
