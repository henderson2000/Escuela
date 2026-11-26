// Datos de Instalacion (partes, textos y cálculos) sin three.js: los usan las páginas de teoría y del taller,
// que así no tienen que esperar a que se descargue el 3D.

export type Circuito2 = 'simple' | 'serie' | 'paralelo' | 'escalera'

export type Falla = 'ninguna' | 'cortocircuito' | 'sobrecarga' | 'fuga'

export interface InstalacionParams {
  circuito: Circuito2
  s1: boolean
  s2: boolean
  falla: Falla
  /** interruptor termomagnético cerrado (arriba) */
  pia: boolean
  /** interruptor diferencial cerrado (arriba) */
  dif: boolean
  /** qué protección actuó la última vez */
  disparo: '' | 'magnetico' | 'termico' | 'diferencial'
}

/** Resistencia de una lámpara incandescente de 60 W a 220 V. */
export const R_LAMP = (220 * 220) / 60

/** Estado eléctrico: qué lámparas encienden y con cuánta potencia. */
export function estado(p: InstalacionParams) {
  const energia = p.pia && p.dif
  let h1 = false
  let h2 = false
  let serie = false
  if (energia) {
    if (p.circuito === 'simple') h1 = p.s1
    else if (p.circuito === 'serie') h1 = h2 = serie = p.s1
    else if (p.circuito === 'paralelo') h1 = h2 = p.s1
    else h1 = p.s1 === p.s2
  }
  // en serie cada lámpara recibe la mitad de la tensión: un cuarto de la potencia
  const uLamp = serie ? 110 : 220
  const pLamp = (uLamp * uLamp) / R_LAMP
  const n = (h1 ? 1 : 0) + (h2 ? 1 : 0)
  const pTotal = serie ? (220 * 220) / (2 * R_LAMP) : n * 60
  return { energia, h1, h2, uLamp, pLamp, pTotal, i: pTotal / 220, glow: pLamp / 60 }
}

export function instalacionParts(p: InstalacionParams) {
  const parts = [
    { id: 'panel', name: 'Tablero de práctica', desc: 'Base de madera donde se arma la instalación "a la vista", con los mismos materiales que en una casa.' },
    { id: 'tablero', name: 'Tablero de protecciones', desc: 'Caja metálica con riel DIN. Recibe la línea (F y N a 220 V) y contiene el interruptor diferencial y el termomagnético.' },
    { id: 'diferencial', name: 'Interruptor diferencial', desc: 'Compara la corriente que va por la fase con la que vuelve por el neutro. Si se escapa más de 30 mA (por una persona o una falla de aislamiento) se dispara. Protege a las PERSONAS. El botón T sirve para probarlo.' },
    { id: 'pia', name: 'Interruptor termomagnético (PIA)', desc: 'Protege la INSTALACIÓN: su parte térmica corta las sobrecargas y su parte magnética, los cortocircuitos.' },
    { id: 'conductores', name: 'Conductores', desc: 'Fase marrón, neutro celeste y tierra verde-amarilla (colores normalizados). El retorno (de la llave a la lámpara) es negro y los puentes, rojos. Los puntos amarillos muestran la corriente: en alterna va y viene.' },
    { id: 'jabalina', name: 'Puesta a tierra (jabalina)', desc: 'Jabalina de acero cobreado de 1,5 m clavada en el suelo, con su cámara de inspección. El conductor verde-amarillo baja desde el tablero y se ajusta a la jabalina con un tomacable de bronce. Si una carcasa queda con tensión por una falla, la corriente se va a tierra por acá y el diferencial dispara.' },
    { id: 'h1', name: 'Lámpara H1', desc: 'Portalámparas sobre caja octogonal con una lámpara de 60 W / 220 V.' },
    { id: 's1', name: p.circuito === 'escalera' ? 'Llave de combinación S1' : 'Interruptor S1', desc: p.circuito === 'escalera' ? 'Llave de combinación (desviador): conecta su borne común con uno u otro de los dos conductores que van a S2.' : 'Interruptor de un punto: abre o cierra la fase que va a la lámpara. Siempre se corta la FASE, nunca el neutro.' },
  ]
  if (p.circuito === 'serie' || p.circuito === 'paralelo') parts.push({ id: 'h2', name: 'Lámpara H2', desc: p.circuito === 'serie' ? 'En serie con H1: la corriente pasa por las dos y cada una recibe sólo 110 V, por eso alumbran poco.' : 'En paralelo con H1: las dos reciben los 220 V y alumbran normal.' })
  if (p.circuito === 'escalera') parts.push({ id: 's2', name: 'Llave de combinación S2', desc: 'Con S1 y S2 se prende y se apaga la misma lámpara desde dos lugares (por ejemplo, abajo y arriba de una escalera).' })
  return parts
}
