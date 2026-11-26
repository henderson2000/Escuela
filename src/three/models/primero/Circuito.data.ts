// Datos de Circuito (partes, textos y cálculos) sin three.js: los usan las páginas de teoría y del taller,
// que así no tienen que esperar a que se descargue el 3D.

export type Modo = 'una' | 'serie' | 'paralelo'

export interface CircuitoParams {
  modo: Modo
  u: number
  r1: number
  r2: number
  cerrado: boolean
}

/** Resuelve el circuito: corriente total y por cada lámpara, tensión en cada una. */
export function solve(p: CircuitoParams) {
  if (!p.cerrado) return { req: p.modo === 'una' ? p.r1 : p.modo === 'serie' ? p.r1 + p.r2 : (p.r1 * p.r2) / (p.r1 + p.r2), i: 0, i1: 0, i2: 0, u1: 0, u2: 0 }
  if (p.modo === 'una') {
    const i = p.u / p.r1
    return { req: p.r1, i, i1: i, i2: 0, u1: p.u, u2: 0 }
  }
  if (p.modo === 'serie') {
    const req = p.r1 + p.r2
    const i = p.u / req
    return { req, i, i1: i, i2: i, u1: i * p.r1, u2: i * p.r2 }
  }
  const req = (p.r1 * p.r2) / (p.r1 + p.r2)
  const i1 = p.u / p.r1
  const i2 = p.u / p.r2
  return { req, i: i1 + i2, i1, i2, u1: p.u, u2: p.u }
}

export function circuitoParts(p: CircuitoParams) {
  const parts = [
    { id: 'pila', name: 'Pila (fuente)', desc: `Separa cargas por una reacción química y genera una tensión de ${String(p.u).replace('.', ',')} V entre sus bornes + y −. Es corriente continua.` },
    { id: 'interruptor', name: 'Interruptor', desc: 'Abre o cierra el circuito. Abierto, no circula corriente; cerrado, los electrones pueden recorrer todo el camino.' },
    { id: 'lampara1', name: p.modo === 'una' ? 'Lámpara (R)' : 'Lámpara R1', desc: `Es la carga: transforma la energía eléctrica en luz y calor. Tiene ${p.r1} Ω de resistencia.` },
  ]
  if (p.modo !== 'una') parts.push({ id: 'lampara2', name: 'Lámpara R2', desc: `Segunda carga, de ${p.r2} Ω. Está en ${p.modo === 'serie' ? 'serie: la misma corriente pasa por las dos' : 'paralelo: las dos reciben la misma tensión'}.` })
  parts.push({ id: 'cables', name: 'Cables', desc: 'Conductores de cobre que unen todo. En corriente continua: rojo para el positivo (+) y negro para el negativo (−). Los puntitos azules son electrones: salen del − y vuelven al +.' })
  parts.push({ id: 'tablero', name: 'Tablero', desc: 'Base de madera (aislante) donde se arma el circuito.' })
  return parts
}
