// Datos de Compu2 (partes, textos y cálculos) sin three.js: los usan las páginas de teoría y del taller,
// que así no tienen que esperar a que se descargue el 3D.

export const VN_PASOS = [
  'El programa y los datos están guardados en la MISMA memoria: esa es la idea de Von Neumann.',
  'Entrada → memoria: el usuario escribe el primer número (A) y se guarda en la memoria.',
  'Entrada → memoria: se escribe el segundo número (B).',
  'La unidad de control lee la instrucción SUMAR y lleva A y B a la unidad aritmético-lógica.',
  'La ALU hace la cuenta y el resultado vuelve a la memoria (C).',
  'Memoria → salida: el resultado aparece en el monitor.',
]

export const VN_PARTS = [
  { id: 'uc', name: 'Unidad de control', desc: 'Controla todas las operaciones del sistema: busca cada instrucción en la memoria, la interpreta y ordena qué hacer. Está dentro del procesador, en el mismo chip de silicio que la ALU.' },
  { id: 'alu', name: 'Unidad aritmético-lógica (ALU)', desc: 'Realiza las operaciones aritméticas (sumar, restar…) y lógicas (comparar, Y, O…). También está dentro del procesador.' },
  { id: 'memoria', name: 'Unidad de memoria', desc: 'Guarda los programas y los datos que se usan durante los cálculos. En el modelo de Von Neumann están en la MISMA memoria: acá, cada chip del módulo de RAM es una celda con su dirección.' },
  { id: 'entrada', name: 'Dispositivo de entrada', desc: 'Introduce datos y programas en la memoria (teclado, mouse…). El teclado se conecta por USB.' },
  { id: 'salida', name: 'Dispositivo de salida', desc: 'Muestra los resultados de los cálculos (monitor, impresora…). El monitor se conecta por HDMI.' },
  { id: 'buses', name: 'Buses', desc: 'Los caminos por donde viajan los datos, las direcciones y las órdenes de control entre las partes: son las pistas de cobre de la placa base (y los cables, hacia afuera).' },
]

export const NODOS = ['PC 1', 'PC 2', 'PC 3', 'Impresora', 'Servidor']

export const RED_PARTS = [
  { id: 'nodos', name: 'Nodos', desc: 'Computadoras, servidores, impresoras o cualquier dispositivo conectado. Cada uno tiene una dirección IP única. Algunos son clientes (piden servicios) y otros servidores (los dan).' },
  { id: 'enlaces', name: 'Enlaces', desc: 'Las conexiones entre nodos: cables de cobre (UTP con fichas RJ45, o coaxial en las redes en bus antiguas), fibra óptica o inalámbricas (Wi-Fi). Su calidad y velocidad definen qué tan rápida es la red.' },
  { id: 'switch', name: 'Switch (concentrador)', desc: 'En la topología de estrella, todos los nodos se conectan a este equipo central, que reenvía cada paquete sólo al destinatario. Cada boca tiene una luz que titila cuando pasan datos.' },
  { id: 'paquete', name: 'Paquete de datos', desc: 'La información viaja dividida en paquetes, con la dirección de origen y de destino. Los protocolos (como TCP/IP) fijan las reglas.' },
]

export const PANTALLA_PARTS = [
  { id: 'pixeles', name: 'Píxeles', desc: 'Cada cuadradito es un píxel: el ladrillo más pequeño de una imagen digital. Muestra un solo color.' },
  { id: 'subpixeles', name: 'Subpíxeles R, G, B', desc: 'Cada píxel de la pantalla tiene tres luces: roja, verde y azul. Mezclándolas con distinta intensidad se forman todos los colores.' },
  { id: 'marco', name: 'Marco de la pantalla', desc: 'El monitor con su marco, su pie y la electrónica atrás. La cantidad de píxeles a lo ancho y a lo alto es la resolución.' },
]
