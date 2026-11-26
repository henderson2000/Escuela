// Datos de Protecciones (partes, textos y cálculos) sin three.js: los usan las páginas de teoría y del taller,
// que así no tienen que esperar a que se descargue el 3D.

/* ================================================================== termomagnético */

export type Situacion = 'normal' | 'sobrecarga' | 'cortocircuito'

/** Tiempo que tarda en disparar (s) según la situación (curva C, valores ilustrativos). */
export const TIEMPO_DISPARO: Record<Situacion, number> = { normal: Infinity, sobrecarga: 6, cortocircuito: 0.05 }

export const PIA_PARTS = [
  { id: 'carcasa', name: 'Carcasa', desc: 'De material aislante y autoextinguible, de 18 mm de ancho por polo. Atrás tiene el canal que se encastra en el riel DIN; adelante, la ventana de 45 mm con la palanca y los datos (curva C, 16 A, 230/400 V, 4500 A).' },
  { id: 'palanca', name: 'Palanca de maniobra', desc: 'Arriba = cerrado (ON). Cuando el interruptor dispara, baja sola. Se rearma subiéndola a mano.' },
  { id: 'contactos', name: 'Contactos', desc: 'Uno fijo y uno móvil, con pastillas de aleación de plata. Al separarse cortan la corriente. Una malla de cobre flexible lleva la corriente al contacto móvil.' },
  { id: 'bimetal', name: 'Bimetal (parte térmica)', desc: 'Dos metales soldados que se dilatan distinto. Con una SOBRECARGA se calienta, se curva de a poco y destraba el mecanismo. Tarda segundos o minutos: depende de cuánto se pase la corriente.' },
  { id: 'bobina', name: 'Bobina (parte magnética)', desc: 'Con un CORTOCIRCUITO la corriente es enorme: la bobina se vuelve un imán fuerte, el percutor golpea y abre los contactos en milésimas de segundo.' },
  { id: 'camara', name: 'Cámara apagachispas', desc: 'Placas metálicas que dividen y enfrían el arco eléctrico que se forma al abrir los contactos.' },
  { id: 'bornes', name: 'Bornes', desc: 'Jaulas con tornillo donde se ajustan los cables: arriba la entrada (de la línea) y abajo la salida (a los circuitos).' },
]

export const DIF_PARTS = [
  { id: 'carcasa', name: 'Carcasa', desc: 'Aislante, de 2 módulos (bipolar, 36 mm). Se monta en el riel DIN, en general antes del termomagnético.' },
  { id: 'toroide', name: 'Transformador toroidal', desc: 'Anillo de hierro por el que pasan la fase y el neutro. Si las dos corrientes son iguales sus efectos se anulan; si no (se escapa corriente a tierra), aparece una diferencia.' },
  { id: 'fase', name: 'Conductor de fase', desc: 'La corriente que ENTRA al circuito.' },
  { id: 'neutro', name: 'Conductor de neutro', desc: 'La corriente que VUELVE. Por la ley de Kirchhoff, si no hay fugas, es igual a la de la fase.' },
  { id: 'bobina', name: 'Bobina detectora', desc: 'Arrollada sobre el toroide. Cuando hay diferencia de corrientes genera una señal que acciona el relé.' },
  { id: 'rele', name: 'Relé de disparo', desc: 'Recibe la señal de la bobina y abre los contactos en menos de 30 ms.' },
  { id: 'test', name: 'Botón de prueba (T)', desc: 'Provoca una fuga artificial para comprobar que el diferencial funciona. Se recomienda probarlo una vez por mes.' },
]

/* ================================================================== multímetro */

export type ModoMulti = 'V~' | 'A' | 'Ω' | 'OFF'

export interface MultimetroParams {
  modo: ModoMulti
  /** dónde está conectado: en paralelo con la lámpara o en serie */
  conexion: 'paralelo' | 'serie'
}

export const MULTI_PARTS = [
  { id: 'cuerpo', name: 'Cuerpo y funda', desc: 'Instrumento portátil. La funda de goma lo protege de golpes y tiene un pie para dejarlo inclinado.' },
  { id: 'display', name: 'Display', desc: 'Pantalla de cristal líquido donde se lee la medición con su unidad (y si es alterna, AC).' },
  { id: 'selector', name: 'Llave selectora', desc: 'Elige la magnitud y el rango: V~ (tensión alterna), V⎓ (continua), A (corriente) y Ω (resistencia, ¡siempre sin tensión!).' },
  { id: 'bornes', name: 'Bornes', desc: 'COM (negro, común), VΩmA (rojo) y 10A (para corrientes grandes). Para medir corriente se pasa la punta roja al borne A.' },
  { id: 'puntas', name: 'Puntas de prueba', desc: 'Cables con fichas banana y puntas aisladas con protección para los dedos. Se toman sólo de la parte aislada.' },
  { id: 'lampara', name: 'Lámpara que se mide', desc: 'Lámpara de 60 W / 220 V en su portalámparas, conectada a la red. Mirá dónde apoya cada punta según lo que mide.' },
]

/** Lectura del multímetro midiendo una lámpara de 60 W / 220 V. */
export function lectura({ modo, conexion }: MultimetroParams): { text: string; ok: boolean; msg: string } {
  if (modo === 'OFF') return { text: '', ok: true, msg: 'Apagado.' }
  if (modo === 'V~')
    return conexion === 'paralelo'
      ? { text: '220.4 V', ok: true, msg: 'Bien: la tensión se mide en PARALELO con el elemento.' }
      : { text: '0.0 V', ok: false, msg: 'Así no: en serie el voltímetro corta el circuito (tiene resistencia muy alta) y la lámpara se apaga.' }
  if (modo === 'A')
    return conexion === 'serie'
      ? { text: '0.27 A', ok: true, msg: 'Bien: la corriente se mide en SERIE, abriendo el circuito e intercalando el amperímetro.' }
      : { text: 'FUSE', ok: false, msg: '¡Peligro! En paralelo el amperímetro (resistencia casi cero) hace un cortocircuito: se quema su fusible o el instrumento.' }
  return { text: '---', ok: false, msg: 'La resistencia se mide SIEMPRE sin tensión: hay que cortar la energía y desconectar el elemento. Una lámpara de 60 W fría mide unos 60 Ω.' }
}
