// Datos de Computadora (partes, textos y cálculos) sin three.js: los usan las páginas de teoría y del taller,
// que así no tienen que esperar a que se descargue el 3D.

export const PC_PARTS = [
  { id: 'gabinete', name: 'Gabinete', desc: 'La caja de chapa de acero que contiene y protege los componentes. Tiene el botón de encendido y los USB arriba, un frente de malla para que entre aire y ventiladores que lo hacen circular.' },
  { id: 'tapa', name: 'Tapa lateral', desc: 'Se saca (con los 4 tornillos de mano) para ver y cambiar las piezas. Esta es de vidrio templado.' },
  { id: 'placa', name: 'Placa base (motherboard)', desc: 'El componente principal: conecta a todos los demás. Tiene el zócalo del procesador, las ranuras de RAM, las PCIe para la placa de video y los conectores para discos y fuente. Los datos viajan entre ellos como señales eléctricas por las pistas de cobre.' },
  { id: 'cpu', name: 'Procesador (CPU)', desc: 'El cerebro de la computadora. Recibe instrucciones y datos de la RAM, los procesa y envía los resultados a la memoria o a los dispositivos de salida. Va en el zócalo, debajo del cooler.' },
  { id: 'cooler', name: 'Disipador y ventilador (cooler)', desc: 'El procesador calienta mucho al trabajar: los caños de cobre (heatpipes) llevan el calor a las aletas de aluminio y el ventilador lo saca.' },
  { id: 'ram', name: 'Memoria RAM', desc: 'Memoria de acceso aleatorio: guarda temporalmente los datos y programas que la CPU está usando. Es rápida pero volátil: se borra al apagar. Acá hay dos módulos de 16 GB.' },
  { id: 'gpu', name: 'Placa de video (GPU)', desc: 'Procesa y genera las imágenes que se ven en el monitor. Tiene su propio procesador y memoria, sus ventiladores y se conecta en la ranura PCIe x16. El monitor se enchufa atrás, en sus salidas HDMI y DisplayPort.' },
  { id: 'fuente', name: 'Fuente de alimentación', desc: 'Transforma los 220 V de alterna del enchufe en las tensiones continuas bajas (12 V, 5 V, 3,3 V) que usan las piezas. Los cables mallados las llevan a la placa base, a la placa de video y a los discos.' },
  { id: 'disco', name: 'Disco rígido (HDD)', desc: 'Almacenamiento: guarda en forma permanente los programas y archivos, aunque la compu esté apagada. Usa discos magnéticos que giran. Se conecta con un cable SATA de datos (rojo) y uno de alimentación.' },
  { id: 'ssd', name: 'Disco sólido (SSD M.2)', desc: 'Almacenamiento con memorias flash, sin partes móviles: es mucho más rápido que el HDD y aguanta mejor los golpes. Va atornillado directo en la placa base.' },
]

/* ================================================================== HDD y SSD */

export interface DiscoParams {
  tipo: 'hdd' | 'ssd'
  encendido: boolean
}

export const discoParts = (p: DiscoParams) =>
  p.tipo === 'hdd'
    ? [
        { id: 'tapa', name: 'Tapa', desc: 'Cierra el disco herméticamente: una sola partícula de polvo puede rayar el plato. Esta es transparente, como los discos de muestra, para poder ver adentro.' },
        { id: 'plato', name: 'Plato magnético', desc: 'Disco de aluminio o vidrio pulido como un espejo y recubierto de material magnético. Gira a 7200 vueltas por minuto. Los datos se guardan como zonas magnetizadas (unos y ceros) en pistas circulares.' },
        { id: 'motor', name: 'Motor (eje)', desc: 'Motor sin escobillas que hace girar los platos a velocidad constante. La abrazadera con tornillos sujeta los platos al eje.' },
        { id: 'cabezal', name: 'Brazo y cabezal de lectura/escritura', desc: 'Lo mueve una bobina entre imanes (actuador). En la punta, el cabezal flota sobre el plato a unos pocos nanómetros: lee y escribe los datos. Al apagar, se estaciona en la rampa del costado.' },
        { id: 'carcasa', name: 'Carcasa', desc: 'Base de aluminio fundido que sostiene todo, con los agujeros para atornillarla al gabinete.' },
        { id: 'controladora', name: 'Placa controladora', desc: 'Electrónica (abajo del disco) que maneja el motor y el cabezal y se comunica con la placa base por el cable SATA.' },
      ]
    : [
        { id: 'tapa', name: 'Carcasa', desc: 'Protege la placa. Al no tener partes móviles, el SSD aguanta golpes y no hace ruido.' },
        { id: 'flash', name: 'Chips de memoria flash', desc: 'Guardan los datos en forma permanente sin partes móviles (como un pendrive, pero mucho más rápido).' },
        { id: 'controlador', name: 'Controlador', desc: 'El "cerebro" del SSD: reparte y ordena los datos entre los chips de memoria. A su lado hay un chip de memoria caché.' },
        { id: 'placa', name: 'Placa', desc: 'Circuito impreso que une los chips y el conector.' },
        { id: 'conector', name: 'Conector SATA', desc: 'Por acá se conecta a la placa base (datos, el conector chico) y a la fuente (alimentación, el largo).' },
      ]

export const PERIF_PARTS = [
  { id: 'monitor', name: 'Monitor (salida)', desc: 'Dispositivo de salida: muestra la información al usuario. Este es de 22 pulgadas, Full HD (1920 × 1080 píxeles).' },
  { id: 'parlantes', name: 'Parlantes (salida)', desc: 'Dispositivo de salida: transforman la señal eléctrica en sonido. El cono grande (woofer) hace los graves y el chico (tweeter) los agudos.' },
  { id: 'impresora', name: 'Impresora (salida)', desc: 'Dispositivo de salida: pasa la información al papel. Esta es multifunción: arriba tiene un escáner, que es de entrada.' },
  { id: 'teclado', name: 'Teclado (entrada)', desc: 'Dispositivo de entrada: con él el usuario ingresa datos y comandos. Este es en español (tiene la Ñ) y tiene teclado numérico.' },
  { id: 'mouse', name: 'Mouse (entrada)', desc: 'Dispositivo de entrada: un sensor óptico mira la mesa para mover el puntero; tiene dos botones y una ruedita.' },
  { id: 'webcam', name: 'Cámara web (entrada)', desc: 'Dispositivo de entrada: captura imagen (y sonido, con su micrófono). Se engancha arriba del monitor.' },
]
