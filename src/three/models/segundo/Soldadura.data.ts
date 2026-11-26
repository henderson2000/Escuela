// Datos de Soldadura (partes, textos y cálculos) sin three.js: los usan las páginas de teoría y del taller,
// que así no tienen que esperar a que se descargue el 3D.

export const EQUIPO_PARTS = [
  { id: 'maquina', name: 'Máquina de soldar', desc: 'Transforma la corriente de la red en una corriente de baja tensión y alta intensidad. Tiene una manija o volante para regular la intensidad (en las más viejas, por escalones).' },
  { id: 'regulador', name: 'Regulación de la intensidad', desc: 'Se gradúa según el diámetro del electrodo: entre 35 y 40 A por cada milímetro. Hay que regularla en cada trabajo nuevo, al cambiar de electrodo o de posición.' },
  { id: 'cables', name: 'Cables', desc: 'Unen la máquina con la pinza porta electrodo y con la pinza de masa. Deben tener la sección adecuada a la corriente; nunca se usan rotos o dañados.' },
  { id: 'porta', name: 'Pinza porta electrodo', desc: 'Sujeta el electrodo con buen contacto eléctrico y aísla al soldador. El electrodo se toma por su extremo sin revestimiento.' },
  { id: 'electrodo', name: 'Electrodo', desc: 'Conduce la corriente y, al fundirse, es el material de aporte.' },
  { id: 'masa', name: 'Pinza de masa', desc: 'Cierra el circuito entre la máquina, la pieza y el electrodo. Se conecta lo más cerca posible de la zona de soldadura.' },
  { id: 'pieza', name: 'Pieza a soldar', desc: 'Dos chapas que se van a unir.' },
  { id: 'mesa', name: 'Mesa de soldar', desc: 'Con ranuras por donde caen las chispas y la escoria caliente.' },
  { id: 'piqueta', name: 'Piqueta y cepillo de acero', desc: 'Con la piqueta se golpea la escoria hasta que salta, y con el cepillo se limpia el cordón. Siempre con lentes de seguridad: la escoria sale caliente y en astillas.' },
]

export const ELECTRODO_PARTS = [
  { id: 'alma', name: 'Alma', desc: 'Varilla de metal conductor (para aceros al carbono, de acero dulce). Conduce la corriente y, al fundirse, es el material de aporte. El diámetro del electrodo es el diámetro del alma.' },
  { id: 'revestimiento', name: 'Revestimiento', desc: 'La parte más importante: facilita el encendido del arco, genera gases que protegen el baño del aire, limpia óxidos e impurezas y forma la escoria que retarda el enfriamiento.' },
  { id: 'agarre', name: 'Extremo de agarre', desc: 'Punta sin revestimiento que se coloca en la pinza porta electrodo para hacer contacto.' },
  { id: 'punta', name: 'Punta de encendido', desc: 'Extremo donde se enciende el arco raspando la pieza, como un fósforo.' },
]

/* ================================================================== simulador del cordón */

export interface CordonParams {
  diametro: number
  corriente: number
  /** longitud de arco en múltiplos del diámetro */
  arco: number
  /** velocidad de avance relativa (1 = correcta) */
  velocidad: number
  /** ángulo de avance (°) */
  angulo: number
  escoria: boolean
}

export interface Diagnostico {
  ancho: number
  alto: number
  penetracion: number
  mordeduras: boolean
  salpicaduras: number
  irregular: number
  problemas: string[]
  nota: number
}

export const recomendada = (d: number) => [35 * d, 40 * d] as const

export function diagnosticar(p: CordonParams): Diagnostico {
  const [lo, hi] = recomendada(p.diametro)
  const q = p.corriente / ((lo + hi) / 2)
  const problemas: string[] = []
  let nota = 10
  if (p.corriente > hi * 1.1) {
    problemas.push('Intensidad muy alta: arco demasiado fuerte, mucha salpicadura, mordeduras al costado del cordón y riesgo de perforar la pieza.')
    nota -= 3
  } else if (p.corriente < lo * 0.9) {
    problemas.push('Intensidad baja: el arco se apaga fácil, poca penetración, falta de fusión y cordón fino e irregular.')
    nota -= 3
  }
  if (p.arco > 1.5) {
    problemas.push('Arco demasiado largo: dispersa el calor, gotas gruesas, poca penetración, bordes desparejos y tiende a apagarse.')
    nota -= 2.5
  } else if (p.arco < 0.7) {
    problemas.push('Arco demasiado corto: el electrodo se pega a la pieza y puede quedar escoria atrapada en el cordón.')
    nota -= 2
  }
  if (p.velocidad > 1.35) {
    problemas.push('Avance muy rápido: el cordón queda angosto y con poco material.')
    nota -= 1.5
  } else if (p.velocidad < 0.7) {
    problemas.push('Avance muy lento: el cordón se ensancha y se deposita demasiado material.')
    nota -= 1.5
  }
  if (p.angulo < 45) {
    problemas.push('Ángulo menor a 45°: mucho menos penetración, el charco crece demasiado y en chapa fina se puede perforar.')
    nota -= 2
  } else if (p.angulo < 60 || p.angulo > 80) {
    problemas.push('Para una unión a tope el ángulo de avance conviene entre 60° y 80°.')
    nota -= 0.5
  }
  const angF = p.angulo < 45 ? 0.55 : 0.75 + ((Math.min(p.angulo, 90) - 45) / 45) * 0.35
  return {
    ancho: Math.max(0.5, p.diametro * 2.3 * Math.sqrt(q) * Math.pow(p.velocidad, -0.6) * (p.arco > 1.5 ? 1.15 : 1)),
    alto: Math.max(0.4, p.diametro * 0.75 * Math.pow(p.velocidad, -0.5) * (q < 0.85 ? 1.15 : 1)),
    penetracion: Math.max(0.2, p.diametro * 0.7 * q * angF * (p.arco > 1.5 ? 0.6 : 1)),
    mordeduras: p.corriente > hi * 1.1,
    salpicaduras: Math.max(0, (q - 1.05) * 60) + Math.max(0, (p.arco - 1.4) * 40),
    irregular: Math.min(1, Math.max(0, Math.abs(q - 1) * 2 - 0.15) + Math.max(0, p.arco - 1.5) * 0.8 + (p.arco < 0.7 ? 0.3 : 0)),
    problemas,
    nota: Math.max(1, Math.round(nota)),
  }
}

export const CORDON_PARTS = [
  { id: 'pieza', name: 'Pieza (metal base)', desc: 'Dos chapas unidas a tope. En el corte del frente se ve cuánto penetró la soldadura.' },
  { id: 'cordon', name: 'Cordón de soldadura', desc: 'Las gotitas de metal fundido llenan el charco y, al solidificarse una junto a otra, forman el cordón. Se ve parejo cuando el avance y el arco son constantes.' },
  { id: 'penetracion', name: 'Zona fundida (penetración)', desc: 'Donde se mezclaron el metal del electrodo y el de la pieza. Una buena penetración une las piezas en todo su espesor.' },
  { id: 'escoria', name: 'Escoria', desc: 'El revestimiento fundido flota sobre el metal y se solidifica encima: protege el cordón y retarda su enfriamiento. Se saca con la piqueta y el cepillo de acero.' },
  { id: 'salpicaduras', name: 'Salpicaduras', desc: 'Gotitas de metal proyectadas a los costados. Aparecen con mucha intensidad o con el arco muy largo.' },
]

export const EPP_PARTS = [
  { id: 'mascara', name: 'Máscara de soldar', desc: 'Protege los ojos, la cara y el cuello. Su visor (105 × 50 mm) lleva el vidrio inactínico; las automáticas se oscurecen solas (tono 9 a 13) al encenderse el arco.' },
  { id: 'vidrio', name: 'Vidrio inactínico (filtro)', desc: 'Deja pasar sólo parte de la luz y frena los rayos ultravioleta e infrarrojos. Su número DIN depende de la intensidad. Adelante lleva un vidrio transparente que lo protege de las chispas.' },
  { id: 'lentes', name: 'Lentes de seguridad', desc: 'Protegen los ojos de chispas y partículas calientes, sobre todo al picar la escoria o amolar.' },
  { id: 'guantes', name: 'Guantes de cuero', desc: 'De puño largo: protegen manos y muñecas. Flexibles para trabajar cómodo.' },
  { id: 'delantal', name: 'Delantal de cuero', desc: 'Protege el torso de chispas y salpicaduras de escoria.' },
  { id: 'zapatos', name: 'Zapatos de seguridad', desc: 'Cubren los tobillos para evitar quemaduras por salpicaduras.' },
]

/** Número de filtro DIN según la intensidad (electrodo revestido, tabla del apunte). */
export function filtroDin(a: number) {
  if (a < 40) return { din: 10, rango: 'menos de 40 A (se usa el 10)' }
  if (a < 80) return { din: 10, rango: '40 – 79 A' }
  if (a < 175) return { din: 11, rango: '80 – 174 A' }
  if (a < 300) return { din: 12, rango: '175 – 299 A' }
  return { din: 13, rango: '300 – 499 A' }
}

/* ================================================================== uniones y posiciones */

export type Union = 'tope' | 'angulo' | 't' | 'solapada'

export type Posicion = 'plana' | 'horizontal' | 'vertical' | 'sobrecabeza'

export interface UnionParams {
  union: Union
  posicion: Posicion
}

export const UNION_PARTS = [
  { id: 'pieza1', name: 'Pieza 1', desc: 'Una de las chapas a unir.' },
  { id: 'pieza2', name: 'Pieza 2', desc: 'La otra chapa. El TIPO DE UNIÓN es cómo están ubicadas una respecto de la otra.' },
  { id: 'cordon', name: 'Cordón', desc: 'Donde se deposita la soldadura: en la junta (a tope) o en el vértice (en ángulo, en T, solapada).' },
  { id: 'piso', name: 'Referencia (piso)', desc: 'La POSICIÓN es cómo está la unión respecto del piso: plana, horizontal, vertical o sobre cabeza.' },
]

export function designacion({ union, posicion }: UnionParams) {
  const n = { plana: 1, horizontal: 2, vertical: 3, sobrecabeza: 4 }[posicion]
  return `${n}${union === 'tope' ? 'G' : 'F'}`
}
