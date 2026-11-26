// Datos de Hojalateria (partes, textos y cálculos) sin three.js: los usan las páginas de teoría y del taller,
// que así no tienen que esperar a que se descargue el 3D.

export const HERRAMIENTAS_PARTS = [
  { id: 'tijera', name: 'Tijera de hojalatero', desc: 'Corta chapas de hasta 1 mm de espesor. La de corte recto es la más usada: cortes rectos o apenas curvos.' },
  { id: 'martillo', name: 'Martillo de hojalatero', desc: 'Martillo liviano con una boca plana y otra en cuña: asienta pliegues y cierra dobladillos sin marcar la chapa.' },
  { id: 'bigornia', name: 'Bigornia', desc: 'Bloque de acero fundido con dos extremos cónicos de distinta forma. Sirve de apoyo para enderezar o dar forma a la chapa.' },
  { id: 'compas', name: 'Compás de punta seca', desc: 'Traza círculos y arcos sobre la chapa; también compara y traslada medidas.' },
  { id: 'punta', name: 'Punta de trazar', desc: 'Varilla de acero templado afilada: se toma como un lápiz para rayar la chapa.' },
  { id: 'granete', name: 'Granete', desc: 'Punta cónica a 120°: marca puntos golpeando con el martillo (también hay automáticos, que se accionan con la mano).' },
  { id: 'escuadra', name: 'Escuadra de 90°', desc: 'Comprueba que la chapa esté cortada a escuadra y traza perpendiculares y líneas a 45°.' },
]

export const PLEGADORA_PARTS = [
  { id: 'bancada', name: 'Bancada', desc: 'Estructura de la máquina. Las manuales chicas pliegan chapa de hasta 1 mm de espesor.' },
  { id: 'pisador', name: 'Pisador (punzón)', desc: 'Aprieta la chapa contra la mesa justo sobre la línea de plegado. Junto con la matriz forman las herramientas de la plegadora.' },
  { id: 'aleta', name: 'Aleta plegadora (matriz)', desc: 'Se levanta con las manijas y dobla la chapa alrededor del pisador.' },
  { id: 'manijas', name: 'Manijas', desc: 'Se levantan para plegar. El ángulo se controla mirando la chapa (o con un tope).' },
  { id: 'chapa', name: 'Chapa', desc: 'Chapa galvanizada Nº 30 (fina). La línea de plegado tiene que quedar justo en el borde del pisador.' },
]

export const ENGRAFADO_PARTS = [
  { id: 'chapa1', name: 'Chapa 1 con su gancho', desc: 'En el extremo se pliega un gancho (en la engrafadora o la plegadora).' },
  { id: 'chapa2', name: 'Chapa 2 con su gancho', desc: 'El gancho se pliega en posición opuesta al de la otra chapa, para que se puedan cruzar.' },
]
