import type { ComponentDef } from './types'
import { BreadboardModel } from '../three/models/Breadboard'
import { ArduinoModel } from '../three/models/Arduino'
import { Field, Segmented, Toggle } from '../components/ui'

export const breadboard: ComponentDef = {
  id: 'protoboard',
  name: 'Protoboard',
  category: 'Placas',
  icon: '⣿',
  short: 'Placa para armar circuitos sin soldar. Tocá un orificio para ver con cuáles está conectado.',
  camera: [0, 7.5, 7],
  shadowY: -1.4,
  defaultParams: { cols: 30 },
  render: (p) => <BreadboardModel cols={p.cols} />,
  Controls: ({ params, set }) => (
    <>
      <Field label="Tamaño">
        <Segmented<number>
          value={params.cols}
          options={[
            { value: 17, label: 'Mini (170 pts)' },
            { value: 30, label: 'Media (400 pts)' },
          ]}
          onChange={(cols) => set({ cols })}
        />
      </Field>
      <p className="hint">
        👆 Hacé clic en cualquier orificio: se iluminan en verde todos los que están conectados entre sí. Después
        ocultá el <strong>cuerpo</strong> (o usá “despiezar”) para ver las tiras metálicas de adentro.
      </p>
    </>
  ),
  parts: [
    { id: 'cuerpo', name: 'Cuerpo plástico y orificios', desc: 'Plástico aislante con orificios separados 2,54 mm (0,1 pulgada), la misma distancia que las patas de los integrados y de los pines del Arduino.' },
    { id: 'rieles', name: 'Rieles de alimentación', desc: 'Las filas marcadas con rojo (+) y azul (−) a lo largo de los bordes. Están conectadas en HORIZONTAL y se usan para llevar 5 V y GND a todo el circuito.' },
    { id: 'canal', name: 'Canal central', desc: 'Separa las dos mitades. Los circuitos integrados (chips) se colocan encima del canal, para que cada pata quede en una columna distinta.' },
    { id: 'tiras', name: 'Tiras metálicas (clips)', desc: 'Láminas de metal debajo de los orificios. Cada columna de 5 orificios (a–e o f–j) es UNA tira: todo lo que se enchufe en esa columna queda conectado.' },
    { id: 'adhesivo', name: 'Base adhesiva', desc: 'Lámina de abajo que mantiene las tiras en su lugar y permite pegar la protoboard a una base.' },
  ],
  theory: (
    <>
      <p>
        La <strong>protoboard</strong> (o <em>breadboard</em>) permite armar y probar circuitos <strong>sin soldar</strong>.
        Adentro tiene tiras metálicas que conectan grupos de orificios.
      </p>
      <ul>
        <li><strong>Zona central</strong>: cada <strong>columna de 5 orificios</strong> (a-e y f-j) está conectada en vertical.</li>
        <li><strong>Rieles</strong>: las filas de los bordes (+ rojo, − azul) están conectadas en horizontal.</li>
        <li><strong>Canal central</strong>: corta la conexión entre la mitad de arriba y la de abajo.</li>
      </ul>
      <h4>Errores típicos</h4>
      <ul>
        <li>Poner las dos patas de un componente en la misma columna: ¡queda en cortocircuito y no hace nada!</li>
        <li>Olvidarse de que algunas protoboards tienen el riel cortado a la mitad.</li>
        <li>Conectar 5 V y GND en el mismo riel (cortocircuito).</li>
      </ul>
      <p className="tip">Convención de colores de cables: rojo para positivo, negro (o azul) para GND, otros colores para señales.</p>
    </>
  ),
  activities: [
    { id: 'pb-1', type: 'mc', q: 'En la zona central, ¿cómo están conectados los orificios?', options: ['Todos entre sí', 'En columnas de 5 (vertical)', 'En filas horizontales completas', 'No están conectados'], answer: 1, explain: 'Cada columna de 5 orificios forma una tira conectada.' },
    { id: 'pb-2', type: 'mc', q: '¿Para qué se usan los rieles con líneas roja y azul?', options: ['Para decorar', 'Para la alimentación (+ y −)', 'Para los LEDs', 'Para los datos'], answer: 1, explain: 'Los rieles distribuyen la alimentación por toda la placa.' },
    { id: 'pb-3', type: 'mc', q: 'Si ponés las dos patas de una resistencia en la misma columna (a12 y c12)…', options: ['Funciona normal', 'Queda en cortocircuito: la corriente no pasa por ella', 'Se quema la protoboard', 'Duplica su valor'], answer: 1, explain: 'Ambas patas quedan en la misma tira: la resistencia queda “puenteada”.' },
    { id: 'pb-4', type: 'mc', q: '¿Por qué los chips se colocan sobre el canal central?', options: ['Porque entran mejor', 'Para que cada pata quede en una columna distinta y no se cortocircuiten', 'Para que se enfríen', 'No importa dónde se pongan'], answer: 1, explain: 'El canal separa las patas de los dos lados del integrado.' },
    { id: 'pb-5', type: 'mc', q: '¿Están conectados los orificios e10 y f10?', options: ['Sí', 'No, los separa el canal central'], answer: 1, explain: 'e10 está en la tira a-e y f10 en la tira f-j: el canal las separa.' },
    { id: 'pb-6', type: 'num', q: '¿Cuántos milímetros hay entre dos orificios vecinos?', answer: 2.54, tolerance: 0.01, unit: 'mm', explain: '2,54 mm = 0,1 pulgada, el paso estándar.' },
  ],
}

export const arduino: ComponentDef = {
  id: 'arduino',
  name: 'Arduino UNO',
  category: 'Placas',
  icon: '∞',
  short: 'Placa con microcontrolador programable: lee sensores y controla actuadores.',
  camera: [0, 7.5, 7.5],
  shadowY: -1.6,
  defaultParams: { powered: true, blink: true },
  render: (p) => <ArduinoModel powered={p.powered} blink={p.blink} />,
  Controls: ({ params, set }) => (
    <>
      <Toggle label="Conectado al USB (LED ON)" value={params.powered} onChange={(powered) => set({ powered })} />
      <Toggle label="Programa Blink (LED L en el pin 13)" value={params.blink} onChange={(blink) => set({ blink })} />
      <pre className="code">{`void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH); // prende
  delay(1000);            // espera 1 s
  digitalWrite(13, LOW);  // apaga
  delay(1000);
}`}</pre>
    </>
  ),
  parts: [
    { id: 'micro', name: 'Microcontrolador ATmega328P', desc: 'El “cerebro”: una computadora completa en un chip (CPU, 32 KB de memoria Flash para el programa, 2 KB de RAM). Ejecuta el programa que cargamos.' },
    { id: 'usb', name: 'Conector USB', desc: 'Sirve para programar la placa desde la computadora y también para alimentarla con 5 V.' },
    { id: 'usbchip', name: 'Chip USB (ATmega16U2)', desc: 'Traduce la comunicación USB de la compu a comunicación serie (TX/RX) que entiende el microcontrolador.' },
    { id: 'jack', name: 'Jack de alimentación', desc: 'Entrada para una fuente externa de 7 a 12 V (por ejemplo, una batería de 9 V).' },
    { id: 'regulador', name: 'Regulador de tensión', desc: 'Baja la tensión del jack a 5 V estables para alimentar la placa.' },
    { id: 'capacitores', name: 'Capacitores de filtro', desc: 'Electrolíticos que estabilizan la alimentación y filtran el ruido.' },
    { id: 'cristal', name: 'Cristal y resonador de 16 MHz', desc: 'Marcan el “ritmo” (reloj): 16 millones de pulsos por segundo. El cristal metálico es del chip USB y el resonador cerámico (naranja, al lado del ATmega) es del microcontrolador.' },
    { id: 'reset', name: 'Botón RESET', desc: 'Reinicia el programa desde el principio.' },
    { id: 'icsp', name: 'Conectores ICSP', desc: 'Dos grupos de 6 pines para programar los chips directamente, sin USB (programación “en el circuito”): uno para el ATmega328P (a la derecha) y otro para el chip USB.' },
    { id: 'leds', name: 'LEDs indicadores', desc: 'ON: placa alimentada. L: conectado al pin 13 (el del ejemplo Blink). TX/RX: parpadean al enviar/recibir datos.' },
    { id: 'digitales', name: 'Pines digitales 0–13', desc: 'Entradas o salidas que sólo tienen dos estados: HIGH (5 V) o LOW (0 V). Los marcados con ~ (3, 5, 6, 9, 10, 11) pueden generar PWM para “simular” valores intermedios. 0 y 1 se usan para la comunicación serie.' },
    { id: 'analogicos', name: 'Entradas analógicas A0–A5', desc: 'Leen tensiones entre 0 y 5 V y las convierten en un número de 0 a 1023 (conversor analógico-digital de 10 bits). Ideales para potenciómetros y LDR.' },
    { id: 'alimentacion', name: 'Pines de alimentación', desc: '5V y 3.3V entregan tensión para los circuitos; GND es la referencia (negativo); VIN es la tensión que entra por el jack.' },
    { id: 'placa', name: 'Placa de circuito impreso (PCB)', desc: 'Placa de fibra de vidrio con pistas de cobre (se ven más claras bajo la pintura) que conectan todos los componentes. Tiene 4 agujeros para atornillarla y muchos componentes SMD chiquitos (resistencias y capacitores de montaje superficial).' },
  ],
  theory: (
    <>
      <p>
        <strong>Arduino UNO</strong> es una placa de desarrollo con un <strong>microcontrolador</strong> que podemos
        programar para que lea <strong>entradas</strong> (sensores, pulsadores) y controle <strong>salidas</strong> (LEDs,
        motores, buzzers).
      </p>
      <h4>Estructura de un programa</h4>
      <ul>
        <li><code>setup()</code>: se ejecuta <strong>una sola vez</strong> al encender. Se configuran los pines.</li>
        <li><code>loop()</code>: se repite <strong>para siempre</strong>.</li>
      </ul>
      <h4>Funciones básicas</h4>
      <ul>
        <li><code>pinMode(pin, OUTPUT / INPUT)</code>: define si el pin es salida o entrada.</li>
        <li><code>digitalWrite(pin, HIGH / LOW)</code>: pone 5 V o 0 V en una salida.</li>
        <li><code>digitalRead(pin)</code>: lee si una entrada está en HIGH o LOW.</li>
        <li><code>analogRead(A0)</code>: lee una tensión de 0–5 V como un número de 0 a 1023.</li>
        <li><code>analogWrite(pin, 0–255)</code>: PWM en los pines con ~.</li>
        <li><code>delay(ms)</code>: espera milisegundos.</li>
      </ul>
      <p className="tip">Cada pin digital entrega como máximo ≈ 20 mA (40 mA absoluto). Para motores o muchos LEDs hace falta un transistor o un driver.</p>
    </>
  ),
  activities: [
    { id: 'ard-1', type: 'mc', q: '¿Cuántas veces se ejecuta la función setup()?', options: ['Una sola vez', 'Para siempre', 'Cada 1 segundo', 'Nunca'], answer: 0, explain: 'setup() corre una vez al encender o resetear.' },
    { id: 'ard-2', type: 'mc', q: '¿Qué valor devuelve analogRead() si en A0 hay 5 V?', options: ['5', '255', '1023', '100'], answer: 2, explain: 'El conversor es de 10 bits: 0 V → 0 y 5 V → 1023.' },
    { id: 'ard-3', type: 'num', q: 'analogRead(A0) devuelve 512. ¿Cuántos voltios hay aproximadamente en A0?', answer: 2.5, tolerance: 0.03, unit: 'V', explain: 'V = 512 × 5 / 1023 ≈ 2,5 V.' },
    { id: 'ard-4', type: 'mc', q: '¿Qué significa el símbolo ~ junto a algunos pines digitales?', options: ['Que son analógicos', 'Que pueden generar PWM', 'Que están rotos', 'Que son de 3,3 V'], answer: 1, explain: 'Los pines con ~ pueden usar analogWrite() (PWM).' },
    { id: 'ard-5', type: 'mc', q: '¿Cuál es el “cerebro” del Arduino UNO?', options: ['El cristal', 'El regulador', 'El ATmega328P', 'El conector USB'], answer: 2, explain: 'El ATmega328P es el microcontrolador que ejecuta el programa.' },
    { id: 'ard-6', type: 'mc', q: '¿A qué pin está conectado el LED “L” de la placa?', options: ['Pin 0', 'Pin 13', 'A0', '5V'], answer: 1, explain: 'El LED L está conectado al pin 13.' },
    { id: 'ard-7', type: 'num', q: '¿A cuántos MHz funciona el reloj del Arduino UNO?', answer: 16, tolerance: 0, unit: 'MHz', explain: '16 MHz: 16 millones de ciclos por segundo.' },
  ],
}
