// Datos de Lima (partes, textos y cálculos) sin three.js: los usan las páginas de teoría y del taller,
// que así no tienen que esperar a que se descargue el 3D.

// 1 unidad = 1 cm. La lima va a lo largo del eje X: punta en x = 0, cuerpo hacia +x, espiga y mango al final.

export type Forma = 'plana' | 'paralela' | 'mediacana' | 'redonda' | 'cuadrada' | 'triangular'

export type Picado = 'simple' | 'doble' | 'escofina'

export type Grado = 'basta' | 'bastarda' | 'fina' | 'extrafina'

export interface LimaParams {
  forma: Forma
  pulgadas: number
  picado: Picado
  grado: Grado
  seccion: boolean
}

export const FORMA_INFO: Record<Forma, { name: string; uso: string }> = {
  plana: { name: 'Plana de punta', uso: 'Superficies planas exteriores. La más común.' },
  paralela: { name: 'Plana paralela (sin punta)', uso: 'Superficies planas y bordes rectos; mantiene el ancho hasta la punta.' },
  mediacana: { name: 'Media caña', uso: 'Una cara plana y otra curva: pasa de superficies planas a curvas (cóncavas).' },
  redonda: { name: 'Redonda', uso: 'Superficies cóncavas y para agrandar agujeros.' },
  cuadrada: { name: 'Cuadrada', uso: 'Agujeros cuadrados y ranuras (chaveteros).' },
  triangular: { name: 'Triangular', uso: 'Ángulos agudos e internos (caras a 60°).' },
}

export const GRADO_INFO: Record<Grado, { name: string; dientes: string; uso: string; paso: number }> = {
  basta: { name: 'Basta (gruesa)', dientes: 'pocos dientes grandes', uso: 'Desbaste agresivo: arranca mucho material.', paso: 34 },
  bastarda: { name: 'Bastarda (entrefina)', dientes: 'dientes medianos', uso: 'Uso intermedio: la de todos los días en el taller.', paso: 22 },
  fina: { name: 'Fina', dientes: 'muchos dientes chicos', uso: 'Afinado y acabado de buena calidad.', paso: 13 },
  extrafina: { name: 'Extrafina', dientes: 'dientes muy chicos y numerosos', uso: 'Acabado de máxima calidad y precisión.', paso: 8 },
}

/** Contorno de la sección transversal (cm) según la forma. */
export function sectionShape(f: Forma): [number, number][] {
  const pts: [number, number][] = []
  if (f === 'plana' || f === 'paralela') return [[-1, -0.25], [1, -0.25], [1, 0.25], [-1, 0.25]]
  if (f === 'cuadrada') return [[-0.38, -0.38], [0.38, -0.38], [0.38, 0.38], [-0.38, 0.38]]
  if (f === 'triangular') {
    const r = 0.7
    for (let k = 0; k < 3; k++) {
      const a = Math.PI / 2 + (k * 2 * Math.PI) / 3
      pts.push([Math.cos(a) * r, Math.sin(a) * r - 0.1])
    }
    return pts
  }
  if (f === 'redonda') {
    for (let k = 0; k < 28; k++) {
      const a = (k / 28) * Math.PI * 2
      pts.push([Math.cos(a) * 0.42, Math.sin(a) * 0.42])
    }
    return pts
  }
  // media caña: base plana y arco arriba
  pts.push([-1, -0.18], [1, -0.18])
  for (let k = 1; k < 20; k++) {
    const a = (k / 20) * Math.PI
    pts.push([Math.cos(a), -0.18 + Math.sin(a) * 0.55])
  }
  return pts
}

export function limaParts(p: LimaParams) {
  return [
    { id: 'punta', name: 'Punta', desc: 'El extremo opuesto al mango.' },
    { id: 'cuerpo', name: 'Cuerpo', desc: `La parte activa, con los dientes (picado ${p.picado}). Mide ${p.pulgadas}" (${(p.pulgadas * 2.54).toFixed(1).replace('.', ',')} cm): el tamaño de la lima es el largo del cuerpo.` },
    { id: 'espiga', name: 'Espiga', desc: 'Extremo puntiagudo, sin dientes, que se inserta dentro del mango.' },
    { id: 'mango', name: 'Mango', desc: 'La empuñadura. Tiene que estar siempre en buen estado: una espiga sin mango puede lastimar la mano.' },
  ]
}
