// Datos de Led (partes, textos y cálculos) sin three.js: los usan las páginas de teoría y del taller,
// que así no tienen que esperar a que se descargue el 3D.

export const LED_COLORS = {
  rojo: { label: 'Rojo', hex: '#ff2a2a', vf: 2.0, lambda: '620–630 nm' },
  naranja: { label: 'Naranja', hex: '#ff7a1a', vf: 2.1, lambda: '600–610 nm' },
  amarillo: { label: 'Amarillo', hex: '#ffd21a', vf: 2.1, lambda: '585–595 nm' },
  verde: { label: 'Verde', hex: '#2aff5a', vf: 2.2, lambda: '520–570 nm' },
  azul: { label: 'Azul', hex: '#2a6bff', vf: 3.2, lambda: '460–470 nm' },
  blanco: { label: 'Blanco', hex: '#f4f7ff', vf: 3.2, lambda: 'espectro amplio' },
} as const
