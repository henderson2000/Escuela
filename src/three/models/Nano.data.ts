// Datos de Nano (partes, textos y cálculos) sin three.js: los usan las páginas de teoría y del taller,
// que así no tienen que esperar a que se descargue el 3D.

export const NANO_PARTS = [
  { id: 'micro', name: 'Microcontrolador ATmega328P', desc: 'El mismo cerebro que el UNO, pero en un encapsulado de montaje superficial (TQFP de 32 patas, 7 × 7 mm): por eso la placa es tanto más chica. Tiene 2 entradas analógicas más (A6 y A7).' },
  { id: 'usb', name: 'Conector Mini-USB', desc: 'Para programarlo y alimentarlo con 5 V desde la computadora. Las versiones nuevas o los clones traen Micro-USB o USB-C.' },
  { id: 'usbchip', name: 'Chip USB (abajo)', desc: 'Del lado de abajo: traduce el USB a comunicación serie. El Nano original usa un FT232RL; muchos clones usan el CH340 (hay que instalar su driver).' },
  { id: 'regulador', name: 'Regulador de 5 V (abajo)', desc: 'También abajo: baja la tensión de VIN (7 a 12 V) a 5 V. Es chico, así que no conviene pedirle mucha corriente.' },
  { id: 'cristal', name: 'Resonador de 16 MHz', desc: 'Marca el ritmo del microcontrolador: 16 millones de pulsos por segundo.' },
  { id: 'reset', name: 'Botón RESET', desc: 'Reinicia el programa. Está en el medio de la placa.' },
  { id: 'icsp', name: 'Conector ICSP', desc: 'Seis contactos para programar el microcontrolador directamente (por ejemplo, para grabarle el bootloader).' },
  { id: 'leds', name: 'LEDs indicadores', desc: 'POW (alimentado), L (pin 13), TX y RX (comunicación con la compu).' },
  { id: 'pinesA', name: 'Fila de pines: analógicos y alimentación', desc: 'D13, 3V3, REF, A0 a A7, 5V, RST, GND y VIN. A6 y A7 son sólo entradas analógicas.' },
  { id: 'pinesD', name: 'Fila de pines: digitales', desc: 'D12 a D2, GND, RST, RX0 y TX1. Los marcados con ~ (D3, D5, D6, D9, D10, D11) tienen PWM.' },
  { id: 'placa', name: 'Placa de circuito impreso', desc: 'Doble faz, con componentes de los dos lados. Los pines van soldados hacia abajo para enchufarlo directo en la protoboard: cada fila queda de un lado del canal central.' },
]
