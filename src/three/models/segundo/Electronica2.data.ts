// Datos de Electronica2 (partes, textos y cálculos) sin three.js: los usan las páginas de teoría y del taller,
// que así no tienen que esperar a que se descargue el 3D.

export const SOLDADOR_PARTS = [
  { id: 'estacion', name: 'Estación de soldado', desc: 'Fuente con control de temperatura: se elige la temperatura con la perilla y el display muestra la real. Un sensor en la punta le avisa cuánto calentar (la luz titila cuando calienta).' },
  { id: 'punta', name: 'Punta', desc: 'De cobre recubierto de hierro y níquel. Es lo único que toca el trabajo: tiene que estar siempre limpia y estañada (brillante). Hay cónicas, de cincel y de pala.' },
  { id: 'resistencia', name: 'Resistencia calefactora', desc: 'Va dentro del tubo de acero inoxidable, detrás de la punta: transforma la energía eléctrica en calor (efecto Joule). Junto a ella está el sensor de temperatura.' },
  { id: 'mango', name: 'Mango', desc: 'De plástico que aguanta el calor, con anillos de goma para que no se resbale. Se toma como un lápiz y nunca más adelante de la zona marcada.' },
  { id: 'soporte', name: 'Soporte', desc: 'Espiral de chapa donde se deja el soldador caliente: nunca se apoya sobre la mesa. La base pesada no se vuelca.' },
  { id: 'esponja', name: 'Esponja húmeda', desc: 'De celulosa, húmeda (no empapada): se limpia la punta pasándola rápido. Al lado, la viruta de bronce limpia sin enfriar la punta.' },
  { id: 'esta', name: 'Estaño con flux', desc: 'Alambre de aleación estaño-plomo (60/40) o sin plomo, de 0,8 o 1 mm, con el centro relleno de flux (resina) que limpia el óxido mientras se suelda.' },
]

/* ================================================================== 2 · punto de soldadura */

export type Estano = 'poco' | 'justo' | 'mucho'

export interface PuntoParams {
  temperatura: number
  tiempo: number
  estano: Estano
  puntaLimpia: boolean
}

export type Resultado = 'buena' | 'fria' | 'poco' | 'exceso' | 'puente' | 'levantada'

/** Diagnóstico del punto de soldadura (THT) según cómo se hizo. */
export function diagnosticarPunto(p: PuntoParams): { r: Resultado; titulo: string; texto: string; ok: boolean } {
  if ((p.temperatura > 420 && p.tiempo > 4) || p.tiempo > 6.5)
    return { r: 'levantada', ok: false, titulo: 'Pad levantado y placa quemada', texto: 'Demasiado calor durante demasiado tiempo: el adhesivo del cobre se ablandó, el pad se despegó y la placa se oscureció. Hay que calentar 2 a 3 segundos, no más.' }
  if (p.temperatura < 280 || p.tiempo < 1 || !p.puntaLimpia)
    return {
      r: 'fria',
      ok: false,
      titulo: 'Soldadura fría',
      texto: !p.puntaLimpia
        ? 'La punta oxidada no transmite el calor: el estaño quedó opaco, granulado y no "mojó" el pad. Limpiá la punta en la esponja y estañala.'
        : 'Faltó calor: el estaño no llegó a mojar el pad y la pata, quedó opaco y granulado, como una bolita apoyada. Puede conducir mal o soltarse.',
    }
  if (p.estano === 'poco') return { r: 'poco', ok: false, titulo: 'Poco estaño', texto: 'El estaño no cubre todo el pad y se ve el cobre alrededor de la pata. Es una unión débil: agregá un poco más de estaño.' }
  if (p.estano === 'mucho' && p.tiempo >= 3) return { r: 'puente', ok: false, titulo: 'Puente de estaño', texto: 'Tanto estaño corrió hasta el pad de al lado y los unió: ¡es un cortocircuito! Se saca con malla desoldante.' }
  if (p.estano === 'mucho') return { r: 'exceso', ok: false, titulo: 'Exceso de estaño', texto: 'Quedó una bola que tapa la pata: no se puede ver si el estaño mojó bien adentro. Se saca el sobrante con malla o con la punta limpia.' }
  return { r: 'buena', ok: true, titulo: 'Buena soldadura', texto: 'Cono cóncavo, liso y brillante ("volcán"), que moja todo el pad y sube por la pata. ¡Así tiene que quedar!' }
}

export const PUNTO_PARTS = [
  { id: 'placa', name: 'Placa (FR4)', desc: 'Fibra de vidrio con resina epoxi, de 1,6 mm. Es aislante y del lado de abajo tiene el cobre.' },
  { id: 'pad', name: 'Pad (isla de cobre)', desc: 'El círculo de cobre alrededor del agujero donde se suelda la pata. Lo une a las pistas.' },
  { id: 'pata', name: 'Pata del componente', desc: 'Alambre estañado que atraviesa el agujero. Después de soldar se corta el sobrante con el alicate de corte.' },
  { id: 'estano', name: 'Estaño', desc: 'Al fundirse "moja" el pad y la pata y, al enfriarse, los une eléctrica y mecánicamente.' },
  { id: 'flux', name: 'Residuo de flux', desc: 'La resina que trae el estaño adentro: limpia el óxido mientras se suelda. Queda un poco, color ámbar; se puede limpiar con alcohol isopropílico.' },
  { id: 'componente', name: 'Componente (del otro lado)', desc: 'Una resistencia apoyada del lado de los componentes. Las patas se doblan a la medida de los agujeros.' },
]

/* ================================================================== 3 · fabricación de un circuito impreso */

export interface PcbParams {
  etapa: number
}

export const PCB_ETAPAS = [
  { name: 'Placa virgen', text: 'Placa de pertinax o FR4 con una cara cubierta de cobre. Se corta a medida y se lija el cobre con virulana hasta que brille.' },
  { name: 'Diseño transferido', text: 'El diseño impreso con tóner en papel ilustración se plancha sobre el cobre: el tóner pasa a la placa y la protege.' },
  { name: 'Atacada con percloruro', text: 'En percloruro férrico el cobre sin protección se disuelve. Debajo del tóner quedan las pistas y los pads.' },
  { name: 'Limpia y perforada', text: 'Se saca el tóner con thinner o virulana, y se perfora cada pad con mecha de 0,8 mm (1 mm para las patas gruesas).' },
  { name: 'Componentes soldados', text: 'Los componentes van del lado sin cobre; las patas pasan por los agujeros y se sueldan del lado del cobre.' },
]

export const pcbParts = (p: PcbParams) => {
  const parts = [{ id: 'sustrato', name: 'Sustrato (FR4)', desc: 'Fibra de vidrio con resina epoxi: rígida y aislante. Las placas más baratas son de pertinax (papel con resina), marrones.' }]
  if (p.etapa < 2) parts.push({ id: 'cobre', name: 'Lámina de cobre', desc: 'De 35 micrones: toda la cara está cubierta. Lo que no sea pista se va a disolver.' })
  else parts.push({ id: 'cobre', name: 'Pistas y pads de cobre', desc: 'Lo que quedó de cobre después del ataque: son los "cables" del circuito.' })
  if (p.etapa === 1 || p.etapa === 2) parts.push({ id: 'toner', name: 'Tóner (máscara)', desc: 'Protege el cobre que tiene que quedar. Es el diseño espejado, porque se mira del lado del cobre.' })
  if (p.etapa >= 3) parts.push({ id: 'agujeros', name: 'Agujeros', desc: 'Uno en el centro de cada pad, con mecha de 0,8 a 1 mm, para las patas de los componentes.' })
  if (p.etapa >= 4) parts.push({ id: 'componentes', name: 'Componentes', desc: 'Un LED intermitente con el integrado 555: resistencias, el capacitor que fija el tiempo, el LED y la bornera de alimentación.' })
  return parts
}

/* ================================================================== 4 · fuente de alimentación */

export type Etapa = 'red' | 'secundario' | 'rectificada' | 'filtrada' | 'regulada'

export const FUENTE_ETAPAS: { id: Etapa; name: string }[] = [
  { id: 'red', name: '220 V de la red' },
  { id: 'secundario', name: 'Secundario del transformador' },
  { id: 'rectificada', name: 'Después del puente' },
  { id: 'filtrada', name: 'Después del capacitor' },
  { id: 'regulada', name: 'Salida del 7812' },
]

export const C_FILTRO = 2200e-6

/** Valores de la fuente según la carga: pico del secundario, continua filtrada y ondulación (ripple). */
export function fuenteValores(carga: number) {
  const vp = 12 * Math.SQRT2
  const vrect = vp - 1.4
  const ripple = (carga / 1000) / (100 * C_FILTRO)
  const vdc = vrect - ripple / 2
  const regula = vrect - ripple > 14
  return { vp, vrect, ripple, vdc, vout: regula ? 12 : Math.max(0, vrect - ripple - 2), regula }
}

export const FUENTE_PARTS = [
  { id: 'fusible', name: 'Fusible y cable de red', desc: 'El fusible protege el primario: si hay un cortocircuito se funde y corta. La ficha trae la fase y el neutro de 220 V.' },
  { id: 'transformador', name: 'Transformador 220 V / 12 V', desc: 'Dos bobinados sobre un núcleo de chapas de hierro. Baja la tensión según la relación de vueltas y aísla la salida de la red.' },
  { id: 'puente', name: 'Puente rectificador', desc: 'Cuatro diodos 1N4007: dejan pasar la corriente siempre en el mismo sentido. La alterna se vuelve continua pulsante (onda completa, 100 pulsos por segundo).' },
  { id: 'capacitor', name: 'Capacitor de filtro 2200 µF', desc: 'Se carga en cada pico y entrega energía entre pico y pico: la tensión queda casi continua, con una pequeña ondulación (ripple).' },
  { id: 'regulador', name: 'Regulador 7812 y disipador', desc: 'Integrado que mantiene la salida fija en 12 V aunque cambie la carga o la entrada. Necesita unos 2 V más en la entrada y el disipador para sacar el calor.' },
  { id: 'salida', name: 'LED piloto y bornera', desc: 'El LED con su resistencia avisa que hay tensión. En la bornera se conecta la carga: rojo +12 V, negro GND.' },
  { id: 'osciloscopio', name: 'Osciloscopio', desc: 'Dibuja la tensión en función del tiempo. Con la punta se mide en cada etapa de la fuente para ver cómo cambia la señal.' },
]
