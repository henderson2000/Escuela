// Datos de Martillo (partes, textos y cálculos) sin three.js: los usan las páginas de teoría y del taller,
// que así no tienen que esperar a que se descargue el 3D.

// Plano M01-2020: barra □22 × 95 mm, peña en los primeros 35 mm (baja hasta 5 mm), ojo oblongo de 10 mm de ancho
// con centros a 45 y 55 mm. 1 unidad = 1 cm. La peña queda hacia −x.

export const ETAPAS = [
  { id: 0, name: 'Barra en bruto', ops: 'Recepción del material', text: 'Barra de acero IRAM 1010 de □22 mm, con escoria (la capa oscura de laminación).' },
  { id: 1, name: 'Caras limadas', ops: 'Op. 10 a 60', text: 'Se numeran las caras como un dado (opuestas suman 7) y se liman las 6, controlando paralelismo con la regla y escuadra a 90°.' },
  { id: 2, name: 'Trazado', ops: 'Op. 70 y 80', text: 'Se pinta con sulfato de cobre y se traza con gramil y punta de trazar: eje a 11 mm, líneas a 35, 45 y 55 mm, el oblongo y la diagonal de la peña. Se puntean los centros con el granete.' },
  { id: 3, name: 'Oblongo perforado', ops: 'Op. 90', text: 'En el taladro de banco se perfora el oblongo con mechas sucesivas.' },
  { id: 4, name: 'Peña y ojo terminados', ops: 'Op. 90 y 100', text: 'El ojo se termina con lima redonda; se corta el sobrante de la peña con la sierra y se termina a lima.' },
  { id: 5, name: 'Pulido, cabo y barniz', ops: 'Op. 110', text: 'Se pule con lima fina, tiza y tela esmeril, se coloca el cabo y se barniza.' },
]

export interface MartilloParams {
  etapa: number
  cotas: boolean
  caras: boolean
}

export function martilloParts(p: MartilloParams) {
  const parts = [
    { id: 'cuerpo', name: p.etapa === 0 ? 'Barra de acero' : 'Cuerpo de la cabeza', desc: 'Acero IRAM 1010 (acero de bajo carbono), de sección cuadrada de 22 mm y 95 mm de largo.' },
  ]
  if (p.etapa >= 4) parts.push({ id: 'pena', name: 'Peña', desc: 'La cuña de la cabeza: en 35 mm baja de 22 mm a 5 mm de alto. Se marca con una diagonal y se corta con la sierra.' })
  if (p.etapa >= 3) parts.push({ id: 'ojo', name: 'Ojo (oblongo)', desc: 'Agujero alargado de 10 mm de ancho con centros a 45 y 55 mm de la punta de la peña. Ahí entra el cabo.' })
  if (p.etapa >= 5) parts.push({ id: 'cabo', name: 'Cabo', desc: 'El mango de madera. Se coloca al final y se barniza.' })
  return parts
}
