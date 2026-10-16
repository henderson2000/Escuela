import type { ComponentDef } from './types'
import { ButtonModel, Dht11Model, LdrModel, PotentiometerModel, UltrasonicModel, ldrResistance } from '../three/models/Sensors'
import { Formula, Readout, Slider, Toggle } from '../components/ui'
import { formatOhms } from '../lib/resistor'

const fmt = (n: number, d = 2) => n.toFixed(d).replace('.', ',')

export const ultrasonic: ComponentDef = {
  id: 'ultrasonico',
  name: 'Sensor ultrasónico HC-SR04',
  category: 'Sensores y entradas',
  icon: '◎◎',
  short: 'Mide distancias con sonido (como un murciélago): emite un pulso y espera el eco.',
  camera: [8, 4.5, 7],
  target: [0, 0, 2.5],
  shadowY: -1.9,
  defaultParams: { d: 50, waves: true },
  render: (p) => <UltrasonicModel distanceCm={p.d} showWaves={p.waves} />,
  Controls: ({ params, set }) => {
    const t = (2 * params.d) / 34300
    return (
      <>
        <Slider label="Distancia al obstáculo" value={params.d} min={2} max={400} onChange={(d) => set({ d })} format={(v) => `${v} cm`} />
        <Toggle label="Mostrar ondas" value={params.waves} onChange={(waves) => set({ waves })} />
        <Formula>t = 2 × d / v<sub>sonido</sub></Formula>
        <Readout label="Tiempo del eco (pin Echo en HIGH)" value={`${fmt(t * 1e6, 0)} µs`} />
        <Readout label="Distancia = t × 0,0343 / 2" value={`${params.d} cm`} />
      </>
    )
  },
  parts: [
    { id: 'emisor', name: 'Emisor (T)', desc: 'Transductor que emite un pulso de ultrasonido de 40 kHz (inaudible para nosotros) cuando el pin Trig recibe un pulso de 10 µs.' },
    { id: 'receptor', name: 'Receptor (R)', desc: 'Micrófono de ultrasonido que capta el eco que rebota en el obstáculo.' },
    { id: 'cristal', name: 'Cristal oscilador', desc: 'Genera la frecuencia de referencia para el circuito.' },
    { id: 'circuito', name: 'Circuito de control', desc: 'Chips en la parte trasera: generan el pulso, amplifican el eco y miden el tiempo.' },
    { id: 'placa', name: 'Placa (PCB)', desc: 'Circuito impreso que une todo.' },
    { id: 'pines', name: 'Pines Vcc · Trig · Echo · Gnd', desc: 'Vcc = 5 V, Trig = disparo (salida del Arduino), Echo = devuelve un pulso tan largo como el viaje del sonido (entrada del Arduino), Gnd = tierra.' },
  ],
  theory: (
    <>
      <p>
        El <strong>HC-SR04</strong> mide distancias de 2 cm a 4 m. Funciona como el sonar de un murciélago: emite un
        sonido muy agudo (40 kHz) y mide cuánto tarda en volver el eco.
      </p>
      <ol>
        <li>El Arduino manda un pulso de 10 µs al pin <strong>Trig</strong>.</li>
        <li>El sensor emite 8 pulsos de ultrasonido.</li>
        <li>El pin <strong>Echo</strong> se pone en HIGH hasta que vuelve el eco.</li>
        <li>Con <code>pulseIn(echo, HIGH)</code> medimos ese tiempo.</li>
      </ol>
      <Formula>distancia (cm) = tiempo (µs) × 0,0343 / 2</Formula>
      <p>Se divide por 2 porque el sonido hace el viaje de ida <em>y</em> de vuelta. El sonido viaja a ≈ 343 m/s = 0,0343 cm/µs.</p>
    </>
  ),
  activities: [
    { id: 'us-1', type: 'mc', q: '¿Por qué se divide por 2 al calcular la distancia?', options: ['Porque el sensor tiene 2 cilindros', 'Porque el sonido va y vuelve', 'Por la tolerancia', 'Para pasar a metros'], answer: 1, explain: 'El tiempo medido incluye la ida y la vuelta del sonido.' },
    { id: 'us-2', type: 'num', q: 'El pin Echo estuvo en HIGH 1166 µs. ¿A cuántos cm está el objeto?', answer: 20, tolerance: 0.03, unit: 'cm', explain: '1166 × 0,0343 / 2 ≈ 20 cm.' },
    { id: 'us-3', type: 'mc', q: '¿Qué pin dispara la medición?', options: ['Echo', 'Trig', 'Vcc', 'Gnd'], answer: 1, explain: 'Trig (trigger = gatillo) inicia la medición.' },
    { id: 'us-4', type: 'mc', q: '¿Por qué no escuchamos el sonido del sensor?', options: ['Porque es muy bajo', 'Porque es de 40 kHz, más agudo que lo que oímos (≈20 kHz)', 'Porque no emite sonido', 'Porque es luz'], answer: 1, explain: 'El oído humano llega hasta ≈ 20 kHz; 40 kHz es ultrasonido.' },
  ],
}

export const ldr: ComponentDef = {
  id: 'ldr',
  name: 'LDR (fotorresistencia)',
  category: 'Sensores y entradas',
  icon: '☀',
  short: 'Resistencia que cambia con la luz: mucha luz → poca resistencia.',
  camera: [2.2, 3.0, 3.6],
  target: [0, -0.3, 0],
  shadowY: -2.6,
  defaultParams: { light: 50 },
  render: (p) => <LdrModel light={p.light} />,
  Controls: ({ params, set }) => {
    const r = ldrResistance(params.light)
    const fixed = 10000
    const vout = (5 * fixed) / (r + fixed)
    return (
      <>
        <Slider label="Luz ambiente" value={params.light} min={0} max={100} onChange={(light) => set({ light })} format={(v) => `${v} %`} />
        <Readout label="Resistencia del LDR" value={formatOhms(r)} />
        <h4 className="panel-sub">Divisor con resistencia fija de 10 kΩ a 5 V</h4>
        <Formula>V<sub>A0</sub> = 5 V × 10 kΩ / (R<sub>LDR</sub> + 10 kΩ)</Formula>
        <Readout label="Tensión en A0" value={`${fmt(vout)} V`} />
        <Readout label="analogRead(A0)" value={Math.round((vout / 5) * 1023)} />
      </>
    )
  },
  parts: [
    { id: 'pista', name: 'Pista de sulfuro de cadmio', desc: 'El material sensible (CdS), en forma de zigzag. Cuando le llega luz, se liberan electrones y conduce mejor: baja su resistencia.' },
    { id: 'electrodos', name: 'Electrodos', desc: 'Dos “peines” metálicos que hacen contacto a cada lado de la pista.' },
    { id: 'base', name: 'Base cerámica', desc: 'Soporte aislante.' },
    { id: 'recubrimiento', name: 'Recubrimiento transparente', desc: 'Capa de resina que protege la pista pero deja pasar la luz.' },
    { id: 'terminales', name: 'Terminales', desc: 'Sin polaridad.' },
  ],
  theory: (
    <>
      <p>
        La <strong>LDR</strong> (<em>Light Dependent Resistor</em>) es una resistencia cuyo valor depende de la luz:
      </p>
      <ul>
        <li>Oscuridad → resistencia <strong>alta</strong> (cientos de kΩ o 1 MΩ).</li>
        <li>Mucha luz → resistencia <strong>baja</strong> (algunos cientos de Ω).</li>
      </ul>
      <p>
        El Arduino no mide resistencias, mide <strong>tensiones</strong>. Por eso se arma un <strong>divisor de tensión</strong>
        con una resistencia fija (por ejemplo 10 kΩ) y se lee el punto medio con <code>analogRead()</code>.
      </p>
      <Formula>V<sub>out</sub> = V<sub>in</sub> × R<sub>2</sub> / (R<sub>1</sub> + R<sub>2</sub>)</Formula>
      <p className="tip">Usos: luces que se prenden solas de noche, seguidores de luz, alarmas.</p>
    </>
  ),
  activities: [
    { id: 'ldr-1', type: 'mc', q: 'Si a una LDR le llega más luz, su resistencia…', options: ['Aumenta', 'Disminuye', 'No cambia', 'Se hace cero'], answer: 1, explain: 'Más luz → menos resistencia.' },
    { id: 'ldr-2', type: 'mc', q: '¿Por qué la LDR se usa con una resistencia fija formando un divisor?', options: ['Para protegerla', 'Porque el Arduino mide tensiones, no resistencias', 'Para que brille', 'No hace falta'], answer: 1, explain: 'El divisor convierte el cambio de resistencia en un cambio de tensión.' },
    { id: 'ldr-3', type: 'num', q: 'Divisor a 5 V: LDR = 10 kΩ arriba y resistencia fija de 10 kΩ abajo. ¿Cuántos V hay en el medio?', answer: 2.5, tolerance: 0.02, unit: 'V', explain: '5 × 10 / (10 + 10) = 2,5 V.' },
    { id: 'ldr-4', type: 'mc', q: '¿De qué material es la pista sensible?', options: ['Cobre', 'Sulfuro de cadmio', 'Silicio', 'Carbono'], answer: 1, explain: 'Las LDR comunes usan sulfuro de cadmio (CdS).' },
  ],
}

export const potentiometer: ComponentDef = {
  id: 'potenciometro',
  name: 'Potenciómetro',
  category: 'Sensores y entradas',
  icon: '◔',
  short: 'Resistencia variable con perilla. Funciona como divisor de tensión.',
  camera: [3.4, 3.4, 6],
  target: [0, 0, 0],
  shadowY: -2.4,
  defaultParams: { angle: 150, total: 10 },
  render: (p) => <PotentiometerModel angle={p.angle} />,
  Controls: ({ params, set }) => {
    const frac = params.angle / 300
    const r13 = params.total * 1000
    const r12 = r13 * frac
    const vout = 5 * frac
    return (
      <>
        <Slider label="Giro de la perilla" value={params.angle} min={0} max={300} onChange={(angle) => set({ angle })} format={(v) => `${v}°`} />
        <Readout label="Resistencia total (1–3)" value={formatOhms(r13)} />
        <Readout label="Entre 1 y cursor (1–2)" value={formatOhms(Math.round(r12))} />
        <Readout label="Entre cursor y 3 (2–3)" value={formatOhms(Math.round(r13 - r12))} />
        <h4 className="panel-sub">Conectado a 5 V y GND, cursor a A0</h4>
        <Readout label="Tensión en el cursor" value={`${fmt(vout)} V`} />
        <Readout label="analogRead(A0)" value={Math.round(frac * 1023)} />
      </>
    )
  },
  parts: [
    { id: 'pista', name: 'Pista resistiva', desc: 'Arco de carbono con forma de herradura. Sus extremos son los terminales 1 y 3: entre ellos siempre está la resistencia total.' },
    { id: 'cursor', name: 'Cursor (escobilla)', desc: 'Contacto metálico que se desliza por la pista al girar el eje. Está conectado al terminal 2 (el del medio).' },
    { id: 'eje', name: 'Eje / perilla', desc: 'Al girarlo se mueve el cursor. Un giro completo es de unos 300°.' },
    { id: 'carcasa', name: 'Carcasa metálica', desc: 'Protege la pista y sostiene el buje roscado del eje.' },
    { id: 'base', name: 'Base', desc: 'Soporte plástico donde está impresa la pista.' },
    { id: 'terminales', name: 'Terminales 1 · 2 · 3', desc: 'Extremos: 5 V y GND. Medio (cursor): la tensión variable que va a una entrada analógica.' },
  ],
  theory: (
    <>
      <p>
        El <strong>potenciómetro</strong> es una resistencia con un tercer contacto móvil (el cursor). Al girar la perilla
        cambia cuánta pista hay de cada lado del cursor.
      </p>
      <p>
        Conectado entre 5 V y GND funciona como un <strong>divisor de tensión</strong>: el cursor entrega una tensión entre
        0 y 5 V proporcional al giro. Con <code>analogRead()</code> la leemos como un número de 0 a 1023.
      </p>
      <Formula>V<sub>cursor</sub> = 5 V × (giro / giro máximo)</Formula>
      <p className="tip">Usos: control de volumen, brillo de un LED, velocidad de un motor, posición de un servo.</p>
    </>
  ),
  activities: [
    { id: 'pot-1', type: 'mc', q: '¿Qué terminal del potenciómetro es el cursor?', options: ['El de la izquierda', 'El del medio', 'El de la derecha', 'Cualquiera'], answer: 1, explain: 'El terminal central es el cursor.' },
    { id: 'pot-2', type: 'num', q: 'Potenciómetro de 10 kΩ girado a la mitad. ¿Cuántos kΩ hay entre el terminal 1 y el cursor?', answer: 5, tolerance: 0.02, unit: 'kΩ', explain: 'A la mitad del recorrido, el cursor divide la pista en 5 kΩ + 5 kΩ.' },
    { id: 'pot-3', type: 'mc', q: 'Si conecto 5 V y GND a los extremos, ¿qué rango de tensión da el cursor?', options: ['Siempre 5 V', 'Entre 0 y 5 V', 'Entre 0 y 10 V', 'Siempre 2,5 V'], answer: 1, explain: 'El cursor recorre todo el rango entre los extremos.' },
    { id: 'pot-4', type: 'num', q: 'analogRead(A0) da 1023 con un potenciómetro. ¿Cuántos voltios hay en el cursor?', answer: 5, tolerance: 0.02, unit: 'V', explain: '1023 es el máximo → 5 V.' },
  ],
}

export const button: ComponentDef = {
  id: 'pulsador',
  name: 'Pulsador',
  category: 'Sensores y entradas',
  icon: '⏺',
  short: 'Interruptor momentáneo: conecta mientras está apretado.',
  camera: [2.8, 2.6, 4.2],
  target: [0, 0, 0],
  shadowY: -1.5,
  defaultParams: { pressed: false },
  render: (p) => <ButtonModel pressed={p.pressed} />,
  Controls: ({ params, set }) => (
    <>
      <button
        type="button"
        className={`btn big ${params.pressed ? 'primary' : ''}`}
        onPointerDown={() => set({ pressed: true })}
        onPointerUp={() => set({ pressed: false })}
        onPointerLeave={() => params.pressed && set({ pressed: false })}
      >
        {params.pressed ? '¡Apretado!' : 'Mantené apretado'}
      </button>
      <Readout label="Estado del circuito" value={params.pressed ? '🟢 Cerrado: pasa corriente' : '⚪ Abierto: no pasa corriente'} />
      <Readout label="digitalRead(2) con pull-down" value={params.pressed ? 'HIGH (1)' : 'LOW (0)'} />
    </>
  ),
  parts: [
    { id: 'boton', name: 'Botón', desc: 'La parte que se aprieta. Empuja la lámina de contacto.' },
    { id: 'tapa', name: 'Tapa metálica', desc: 'Sujeta el botón y la lámina dentro de la base.' },
    { id: 'contactos', name: 'Lámina y contactos', desc: 'Una lámina metálica con forma de domo. Al apretar, se aplasta y une los dos contactos internos: el circuito se cierra. Al soltar, vuelve a su forma (por eso es “momentáneo”).' },
    { id: 'base', name: 'Base plástica', desc: 'Cuerpo aislante de 6 × 6 mm.' },
    { id: 'terminales', name: 'Terminales (4)', desc: 'Tiene 4 patas, pero están unidas de a pares: las patas enfrentadas siempre están conectadas. El botón une un par con el otro.' },
  ],
  theory: (
    <>
      <p>
        El <strong>pulsador</strong> es un interruptor <strong>normalmente abierto</strong>: sólo conecta mientras lo
        mantenemos apretado.
      </p>
      <h4>Resistencia pull-down</h4>
      <p>
        Si un pin de entrada no está conectado a nada, “flota” y lee valores al azar. Por eso se agrega una resistencia
        (10 kΩ) del pin a GND: sin apretar lee <strong>LOW</strong>, y al apretar el pulsador conecta el pin a 5 V y lee
        <strong> HIGH</strong>.
      </p>
      <p>
        También se puede usar <code>pinMode(2, INPUT_PULLUP)</code>: la resistencia está adentro del Arduino conectada a
        5 V, y la lógica se invierte (apretado = LOW).
      </p>
      <p className="tip">Rebote: al apretar, los contactos “rebotan” unos milisegundos. Se soluciona con un pequeño delay o un capacitor.</p>
    </>
  ),
  activities: [
    { id: 'btn-1', type: 'mc', q: 'Un pulsador “normalmente abierto”…', options: ['Conduce siempre', 'Conduce sólo mientras está apretado', 'Nunca conduce', 'Conduce al soltarlo'], answer: 1, explain: 'Normalmente abierto: conecta sólo al apretarlo.' },
    { id: 'btn-2', type: 'mc', q: '¿Para qué sirve la resistencia pull-down?', options: ['Para que el LED brille más', 'Para que la entrada lea LOW cuando no se aprieta (que no “flote”)', 'Para bajar la tensión a 3,3 V', 'Para nada'], answer: 1, explain: 'Fija la entrada en LOW mientras el pulsador está abierto.' },
    { id: 'btn-3', type: 'mc', q: 'Con INPUT_PULLUP, ¿qué lee el pin cuando apretás el pulsador (conectado a GND)?', options: ['HIGH', 'LOW', '1023', 'Nada'], answer: 1, explain: 'Con pull-up la lógica se invierte: apretado = LOW.' },
    { id: 'btn-4', type: 'mc', q: 'Un pulsador de 4 patas…', options: ['Tiene 4 contactos independientes', 'Tiene 2 pares de patas que ya están unidas entre sí', 'Tiene polaridad', 'Necesita 2 botones'], answer: 1, explain: 'Las patas están unidas de a pares; el botón une los dos pares.' },
  ],
}

export const dht11: ComponentDef = {
  id: 'dht11',
  name: 'Sensor DHT11',
  category: 'Sensores y entradas',
  icon: '🌡',
  short: 'Mide temperatura y humedad y envía los datos en forma digital por un solo cable.',
  camera: [2.4, 1.2, 4.2],
  target: [0, -0.2, 0],
  shadowY: -2.4,
  defaultParams: { temp: 24, hum: 55 },
  render: () => <Dht11Model />,
  Controls: ({ params, set }) => (
    <>
      <Slider label="Temperatura del ambiente" value={params.temp} min={0} max={50} onChange={(temp) => set({ temp })} format={(v) => `${v} °C`} />
      <Slider label="Humedad relativa" value={params.hum} min={20} max={90} onChange={(hum) => set({ hum })} format={(v) => `${v} %`} />
      <div className="lcd">
        <div>Temp: {params.temp}.0 C</div>
        <div>Hum:  {params.hum}.0 %</div>
      </div>
      <p className="hint">Rango del DHT11: 0–50 °C (±2 °C) y 20–90 % de humedad (±5 %).</p>
    </>
  ),
  parts: [
    { id: 'carcasa', name: 'Carcasa con rejilla', desc: 'Frente perforado para que el aire llegue a los sensores.' },
    { id: 'humedad', name: 'Sensor de humedad', desc: 'Sustrato con dos electrodos en peine. Absorbe vapor de agua del aire y cambia su resistencia (más humedad → menos resistencia).' },
    { id: 'termistor', name: 'Termistor NTC', desc: 'Resistencia que baja cuando sube la temperatura (NTC = coeficiente de temperatura negativo).' },
    { id: 'chip', name: 'Microcontrolador interno', desc: 'Mide los dos sensores, los convierte en números y los envía al Arduino por un solo cable de datos.' },
    { id: 'tapa', name: 'Tapa trasera', desc: 'Cierra el sensor.' },
    { id: 'pines', name: 'Pines VCC · DATA · NC · GND', desc: 'VCC 3–5 V, DATA va a un pin digital (con resistencia pull-up de 10 kΩ), NC no se conecta, GND a tierra.' },
  ],
  theory: (
    <>
      <p>
        El <strong>DHT11</strong> combina un sensor de <strong>humedad</strong> y un <strong>termistor</strong> con un
        pequeño microcontrolador que envía los datos ya convertidos en forma <strong>digital</strong> por un único pin.
      </p>
      <p>
        En Arduino se usa la librería <code>DHT</code>: <code>dht.readTemperature()</code> y <code>dht.readHumidity()</code>.
        Conviene leerlo como máximo una vez cada 1–2 segundos.
      </p>
      <p className="tip">Hermano mayor: el DHT22 (blanco) es más preciso y tiene más rango.</p>
    </>
  ),
  activities: [
    { id: 'dht-1', type: 'mc', q: '¿Qué mide el DHT11?', options: ['Luz y sonido', 'Temperatura y humedad', 'Distancia', 'Presión'], answer: 1, explain: 'Temperatura y humedad relativa.' },
    { id: 'dht-2', type: 'mc', q: 'Un termistor NTC, cuando sube la temperatura…', options: ['Aumenta su resistencia', 'Disminuye su resistencia', 'Emite luz', 'No cambia'], answer: 1, explain: 'NTC = coeficiente negativo: más temperatura, menos resistencia.' },
    { id: 'dht-3', type: 'mc', q: '¿Cuántos cables de datos usa el DHT11?', options: ['1', '2', '4', '8'], answer: 0, explain: 'Un solo pin de datos (DATA).' },
  ],
}
