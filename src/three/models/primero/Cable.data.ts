// Datos de Cable (partes, textos y cálculos) sin three.js: los usan las páginas de teoría y del taller,
// que así no tienen que esperar a que se descargue el 3D.

export type CableTipo = 'unipolar' | 'tpr' | 'desnudo' | 'esmaltado'

export type Funcion = 'fase' | 'neutro' | 'tierra' | 'retorno' | 'cc+' | 'cc-'

export type Aislacion = 'pvc' | 'silicona' | 'goma'

export interface CableParams {
  tipo: CableTipo
  conductores: number
  hebras: 'unifilar' | 'multifilar'
  seccion: number
  funcion: Funcion
  aislacion: Aislacion
}

export const FUNCION_INFO: Record<Funcion, { name: string; color: string; corriente: string }> = {
  fase: { name: 'Fase (L1)', color: '#7a4a24', corriente: 'alterna' },
  neutro: { name: 'Neutro (N)', color: '#4fb3e8', corriente: 'alterna' },
  tierra: { name: 'Puesta a tierra (PE)', color: 'vy', corriente: 'alterna' },
  retorno: { name: 'Retorno de iluminación (R)', color: '#f2f2ee', corriente: 'alterna' },
  'cc+': { name: 'Positivo (+)', color: '#d62828', corriente: 'continua' },
  'cc-': { name: 'Negativo (−)', color: '#1b1b1d', corriente: 'continua' },
}

/** Colores de los conductores de un cable multipolar de alterna, según la cantidad. */
export const TPR_COLORS: Record<number, { color: string; name: string }[]> = {
  2: [
    { color: '#7a4a24', name: 'marrón (fase)' },
    { color: '#4fb3e8', name: 'celeste (neutro)' },
  ],
  3: [
    { color: '#7a4a24', name: 'marrón (fase)' },
    { color: '#4fb3e8', name: 'celeste (neutro)' },
    { color: 'vy', name: 'verde y amarillo (tierra)' },
  ],
  4: [
    { color: '#7a4a24', name: 'marrón (L1)' },
    { color: '#1b1b1d', name: 'negro (L2)' },
    { color: '#c1121f', name: 'rojo (L3)' },
    { color: '#4fb3e8', name: 'celeste (neutro)' },
  ],
  5: [
    { color: '#7a4a24', name: 'marrón (L1)' },
    { color: '#1b1b1d', name: 'negro (L2)' },
    { color: '#c1121f', name: 'rojo (L3)' },
    { color: '#4fb3e8', name: 'celeste (neutro)' },
    { color: 'vy', name: 'verde y amarillo (tierra)' },
  ],
}

export function cableParts(p: CableParams) {
  const parts = []
  if (p.tipo === 'tpr')
    parts.push({
      id: 'vaina',
      name: 'Vaina (cubierta exterior)',
      desc: 'Manguera de material aislante y protector que envuelve a todos los conductores. En el TPR (taller pesado reforzado) es gruesa y resistente a golpes y raspones.',
    })
  if (p.tipo === 'unipolar' || p.tipo === 'tpr')
    parts.push({
      id: 'aislacion',
      name: 'Aislación',
      desc: `Cubre a cada conductor para que la corriente no pase de uno a otro. Su color indica la función. Material: ${p.aislacion === 'pvc' ? 'PVC (el más usado en las casas)' : p.aislacion === 'silicona' ? 'silicona (aguanta altas temperaturas)' : 'goma / EPR (flexible, resiste la humedad)'}.`,
    })
  if (p.tipo === 'esmaltado')
    parts.push({ id: 'aislacion', name: 'Esmalte (barniz)', desc: 'Una capa finísima de barniz aislante. Permite enrollar muchas vueltas juntas: bobinas de motores, transformadores y relés.' })
  parts.push({
    id: 'conductor',
    name: p.hebras === 'multifilar' ? 'Conductor multifilar (cobre)' : 'Conductor unifilar (cobre)',
    desc:
      p.hebras === 'multifilar'
        ? `Muchas hebras finas de cobre retorcidas: es flexible. Sección ${String(p.seccion).replace('.', ',')} mm².`
        : `Un solo alambre de cobre: es rígido. Sección ${String(p.seccion).replace('.', ',')} mm².`,
  })
  return parts
}
