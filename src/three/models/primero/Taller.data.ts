// Datos de Taller (partes, textos y cálculos) sin three.js: los usan las páginas de teoría y del taller,
// que así no tienen que esperar a que se descargue el 3D.

export const INSTRUMENTOS_PARTS = [
  { id: 'marmol', name: 'Mármol de trazado', desc: 'Placa de granito o fundición perfectamente plana: es la base de referencia para trazar con el gramil.' },
  { id: 'regla', name: 'Regla metálica', desc: 'De acero inoxidable, graduada en milímetros. Se usa para medir, controlar que una cara sea plana (paralelismo) y guiar la punta de trazar. Las más comunes miden 300 mm.' },
  { id: 'escuadra', name: 'Escuadra de 90°', desc: 'Controla que dos caras formen ángulo recto ("estén a escuadra") y sirve para trazar líneas perpendiculares.' },
  { id: 'gramil', name: 'Gramil', desc: 'Traza líneas paralelas a la base a una altura exacta. Se apoya en el mármol; conviene verificar la medida con la regla antes de trazar.' },
  { id: 'punta', name: 'Punta de trazar', desc: 'Varilla de acero templado con punta afilada: raya el metal como un lápiz. Las líneas se ven mejor sobre una capa de sulfato de cobre.' },
  { id: 'granete', name: 'Granete (punto)', desc: 'Barra de acero templado con punta cónica de 120°. Golpeándolo con el martillo marca los centros de los agujeros para que la mecha no se desvíe.' },
  { id: 'martillo', name: 'Martillo de banco', desc: 'Para golpear el granete, la sierra o el cincel. ¡Como el que vas a fabricar en el taller!' },
]

export const MORSA_PARTS = [
  { id: 'base', name: 'Base', desc: 'Se atornilla al banco de trabajo. La altura de la morsa tiene que quedar a la altura del codo del operario.' },
  { id: 'fija', name: 'Mordaza fija', desc: 'Parte del cuerpo de la morsa que no se mueve.' },
  { id: 'movil', name: 'Mordaza móvil', desc: 'Se acerca o se aleja de la fija al girar el tornillo. Junto con la fija aprietan la pieza.' },
  { id: 'mordazas', name: 'Mordientes (bocas)', desc: 'Placas de acero estriadas que agarran la pieza. Para no marcar piezas terminadas se usan "boquillas" de aluminio o cobre.' },
  { id: 'tornillo', name: 'Tornillo (husillo)', desc: 'Tornillo de rosca que mueve la mordaza móvil.' },
  { id: 'palanca', name: 'Palanca (manija)', desc: 'Se gira con la mano para apretar o aflojar. Nunca se golpea ni se le pone un caño de prolongación.' },
  { id: 'pieza', name: 'Pieza', desc: 'La barra del martillo, sujeta firme y sobresaliendo poco de las mordazas para que no vibre al limar.' },
]
