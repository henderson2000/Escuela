import { useEffect, useRef } from 'react'
import type { ComponentDef } from './types'
import { BuzzerModel, ServoModel, TRANSISTORS, TransistorModel, type TransistorName } from '../three/models/Actuators'
import { Field, Formula, Readout, Segmented, Slider, Toggle } from '../components/ui'

const fmt = (n: number, d = 2) => n.toFixed(d).replace('.', ',')

/* ------------------------------------------------------------------ servo */

export const servo: ComponentDef = {
  id: 'servo',
  name: 'Servomotor SG90',
  category: 'Actuadores',
  icon: '⟲',
  short: 'Motor que gira a un ángulo exacto (0° a 180°) según el pulso que recibe.',
  camera: [4.6, 4.4, 7.2],
  target: [0, 0.8, 0],
  shadowY: -0.7,
  defaultParams: { angle: 90 },
  render: (p) => <ServoModel angle={p.angle} />,
  Controls: ({ params, set }) => {
    const pulse = 1 + params.angle / 180
    return (
      <>
        <Slider label="Ángulo" value={params.angle} min={0} max={180} onChange={(angle) => set({ angle })} format={(v) => `${v}°`} />
        <div className="row wrap">
          {[0, 45, 90, 135, 180].map((a) => (
            <button key={a} type="button" className="btn small" onClick={() => set({ angle: a })}>
              {a}°
            </button>
          ))}
        </div>
        <Readout label="Ancho del pulso" value={`${fmt(pulse)} ms (cada 20 ms)`} />
        <svg viewBox="0 0 300 70" className="mini-circuit" aria-label="Señal PWM del servo">
          <polyline points={`10,60 10,15 ${10 + pulse * 40},15 ${10 + pulse * 40},60 150,60 150,15 ${150 + pulse * 40},15 ${150 + pulse * 40},60 290,60`} />
          <text x="10" y="10" className="svg-label small">5V</text>
        </svg>
        <pre className="code">{`#include <Servo.h>
Servo miServo;

void setup() {
  miServo.attach(9);   // señal en el pin 9
}

void loop() {
  miServo.write(${params.angle});  // ángulo en grados
}`}</pre>
      </>
    )
  },
  parts: [
    { id: 'eje', name: 'Eje de salida y brazo', desc: 'El brazo (horn) es lo que mueve el mecanismo que conectemos. Se atornilla al eje de salida.' },
    { id: 'engranajes', name: 'Caja de engranajes', desc: 'Reduce la velocidad del motor y multiplica la fuerza (torque). El motor gira muy rápido; el eje de salida, lento y con fuerza.' },
    { id: 'motor', name: 'Motor de corriente continua', desc: 'Un motorcito DC que gira hacia un lado u otro según la polaridad que le aplique el circuito de control.' },
    { id: 'potenciometro', name: 'Potenciómetro de realimentación', desc: 'Está unido al eje de salida: así el circuito “sabe” en qué ángulo está el brazo y lo compara con el pedido.' },
    { id: 'placa', name: 'Circuito de control', desc: 'Lee el pulso de la señal, lo compara con la posición del potenciómetro y mueve el motor hasta que coinciden.' },
    { id: 'carcasa', name: 'Carcasa con orejas', desc: 'Caja plástica con orejas para atornillar el servo a la estructura.' },
    { id: 'tapa', name: 'Tapa superior', desc: 'Cierra la caja de engranajes y sostiene el eje de salida.' },
    { id: 'cables', name: 'Cables', desc: 'Marrón = GND, rojo = alimentación (5 V), naranja = señal (a un pin digital del Arduino).' },
  ],
  theory: (
    <>
      <p>
        Un <strong>servomotor</strong> es un motor con “cerebro”: no gira sin parar, sino que se ubica en el{' '}
        <strong>ángulo</strong> que le pedimos (el SG90 va de 0° a 180°) y se queda ahí haciendo fuerza.
      </p>
      <h4>¿Cómo se le indica el ángulo?</h4>
      <p>
        Con una señal <strong>PWM</strong>: cada 20 ms recibe un pulso. El <em>ancho</em> del pulso dice el ángulo:
      </p>
      <ul>
        <li>≈ 1 ms → 0°</li>
        <li>≈ 1,5 ms → 90°</li>
        <li>≈ 2 ms → 180°</li>
      </ul>
      <p>
        Adentro, el circuito compara ese pulso con la posición que mide el <strong>potenciómetro</strong> y mueve el motor
        hasta que coinciden. Eso se llama <strong>control de lazo cerrado</strong> (realimentación).
      </p>
      <Formula>pulso (ms) ≈ 1 + ángulo / 180</Formula>
      <p className="tip">Un servo consume bastante corriente al arrancar. Con uno solo, el 5V del Arduino alcanza; con varios conviene una fuente aparte (con GND común).</p>
    </>
  ),
  activities: [
    { id: 'srv-1', type: 'mc', q: '¿Qué hace un servomotor que no hace un motor común?', options: ['Gira más rápido', 'Se ubica en un ángulo preciso', 'Funciona sin electricidad', 'Emite sonido'], answer: 1, explain: 'El servo se posiciona en el ángulo que se le pide.' },
    { id: 'srv-2', type: 'mc', q: 'En el SG90, el cable naranja es…', options: ['GND', '5 V', 'La señal', 'No se usa'], answer: 2, explain: 'Marrón GND, rojo 5 V, naranja señal.' },
    { id: 'srv-3', type: 'num', q: '¿De cuántos milisegundos es el pulso para ubicar el servo en 90°?', answer: 1.5, tolerance: 0.05, unit: 'ms', explain: '1 + 90/180 = 1,5 ms.' },
    { id: 'srv-4', type: 'mc', q: '¿Para qué sirve el potenciómetro que tiene adentro?', options: ['Para regular el volumen', 'Para medir la posición del eje', 'Para limitar la corriente', 'Para encenderlo'], answer: 1, explain: 'Mide la posición y permite el control de lazo cerrado.' },
    { id: 'srv-5', type: 'mc', q: '¿Qué instrucción mueve el servo a 45°?', options: ['digitalWrite(9, 45)', 'miServo.write(45)', 'analogRead(45)', 'delay(45)'], answer: 1, explain: 'Con la librería Servo: miServo.write(45).' },
  ],
}

/* ------------------------------------------------------------------ buzzer */

function BuzzerControls({ params, set }: { params: { type: 'activo' | 'pasivo'; freq: number; playing: boolean }; set: (p: object) => void }) {
  const ctx = useRef<AudioContext | null>(null)
  const osc = useRef<OscillatorNode | null>(null)
  const freq = params.type === 'activo' ? 2300 : params.freq

  const stop = () => {
    osc.current?.stop()
    osc.current = null
  }
  useEffect(() => {
    if (!params.playing) return stop()
    try {
      ctx.current ??= new AudioContext()
      const o = ctx.current.createOscillator()
      const gain = ctx.current.createGain()
      gain.gain.value = 0.05
      o.type = 'square'
      o.frequency.value = freq
      o.connect(gain).connect(ctx.current.destination)
      o.start()
      osc.current = o
    } catch {
      /* sin audio en este navegador */
    }
    return stop
  }, [params.playing, freq])
  useEffect(() => () => stop(), [])

  return (
    <>
      <Field label="Tipo">
        <Segmented<'activo' | 'pasivo'>
          value={params.type}
          options={[
            { value: 'activo', label: 'Activo' },
            { value: 'pasivo', label: 'Pasivo' },
          ]}
          onChange={(type) => set({ type })}
        />
      </Field>
      {params.type === 'pasivo' && (
        <Slider label="Frecuencia" value={params.freq} min={200} max={4000} step={10} onChange={(f) => set({ freq: f })} format={(v) => `${v} Hz`} />
      )}
      <Toggle label="Sonar (con sonido real)" value={params.playing} onChange={(playing) => set({ playing })} />
      <Readout label="Frecuencia" value={`${freq} Hz${params.type === 'activo' ? ' (fija)' : ''}`} />
      <Readout label="Período" value={`${fmt(1000 / freq, 3)} ms`} />
      <pre className="code">
        {params.type === 'activo'
          ? `digitalWrite(8, HIGH); // suena\ndelay(500);\ndigitalWrite(8, LOW);  // se calla`
          : `tone(8, ${freq});  // frecuencia en Hz\ndelay(500);\nnoTone(8);`}
      </pre>
    </>
  )
}

export const buzzer: ComponentDef = {
  id: 'buzzer',
  name: 'Buzzer',
  category: 'Actuadores',
  icon: '♪',
  short: 'Produce sonido con un disco piezoeléctrico que vibra. Activo o pasivo.',
  camera: [2.4, 2.4, 3.8],
  target: [0, 0, 0],
  shadowY: -2.3,
  defaultParams: { type: 'pasivo', freq: 1000, playing: false },
  render: (p) => <BuzzerModel playing={p.playing} active={p.type === 'activo'} />,
  Controls: BuzzerControls as ComponentDef['Controls'],
  parts: (p) => [
    { id: 'carcasa', name: 'Carcasa', desc: 'Cilindro plástico que funciona como caja de resonancia: amplifica el sonido. El agujero de arriba deja salir el sonido. Tiene marcado el “+”.' },
    { id: 'disco', name: 'Disco piezoeléctrico', desc: 'Un disco de bronce con una capa de cerámica piezoeléctrica. Cuando se le aplica tensión se deforma; si la tensión cambia muchas veces por segundo, vibra y produce sonido.' },
    ...(p.type === 'activo'
      ? [{ id: 'oscilador', name: 'Oscilador interno', desc: 'Circuito que genera solo la frecuencia (≈2,3 kHz). Por eso al buzzer activo alcanza con darle 5 V para que suene.' }]
      : []),
    { id: 'base', name: 'Base', desc: p.type === 'activo' ? 'Sellada (en el activo suele venir cerrada con resina negra).' : 'En el pasivo se ve la placa verde: no tiene oscilador, hay que mandarle la frecuencia desde el Arduino.' },
    { id: 'positivo', name: 'Terminal positivo (+)', desc: 'Pata larga, del lado marcado con “+”.' },
    { id: 'negativo', name: 'Terminal negativo (−)', desc: 'Pata corta, a GND.' },
  ],
  theory: (
    <>
      <p>
        El <strong>buzzer</strong> convierte una señal eléctrica en sonido usando el <strong>efecto piezoeléctrico</strong>:
        ciertos cristales se deforman cuando se les aplica tensión. Si la tensión cambia rápido, el disco vibra y mueve el aire.
      </p>
      <ul>
        <li>
          <strong>Activo</strong>: tiene un oscilador adentro. Con <code>digitalWrite(pin, HIGH)</code> ya suena, siempre con el
          mismo tono.
        </li>
        <li>
          <strong>Pasivo</strong>: hay que generarle la frecuencia con <code>tone(pin, frecuencia)</code>. Permite tocar
          melodías.
        </li>
      </ul>
      <Formula>período T = 1 / f &nbsp;&nbsp;·&nbsp;&nbsp; La4 = 440 Hz</Formula>
      <p>
        La <strong>frecuencia</strong> (Hz = vibraciones por segundo) define si el sonido es grave o agudo. El oído humano
        escucha aproximadamente de 20 Hz a 20 000 Hz.
      </p>
      <p className="tip">Truco para distinguirlos: con una pila de 3–5 V, el activo suena; el pasivo sólo hace “clic”.</p>
    </>
  ),
  activities: [
    { id: 'bz-1', type: 'mc', q: '¿Qué buzzer suena con sólo conectarlo a 5 V?', options: ['El activo', 'El pasivo', 'Ninguno', 'Los dos igual'], answer: 0, explain: 'El activo tiene un oscilador interno.' },
    { id: 'bz-2', type: 'mc', q: '¿Qué función del Arduino genera una frecuencia en un buzzer pasivo?', options: ['analogRead()', 'tone()', 'pinMode()', 'Serial.print()'], answer: 1, explain: 'tone(pin, frecuencia) y noTone(pin) para callarlo.' },
    { id: 'bz-3', type: 'num', q: '¿Cuál es el período (en ms) de un sonido de 1000 Hz?', answer: 1, tolerance: 0.02, unit: 'ms', explain: 'T = 1 / 1000 Hz = 0,001 s = 1 ms.' },
    { id: 'bz-4', type: 'mc', q: 'Si aumenta la frecuencia, el sonido se vuelve…', options: ['Más grave', 'Más agudo', 'Más fuerte', 'No cambia'], answer: 1, explain: 'Más frecuencia = sonido más agudo.' },
    { id: 'bz-5', type: 'mc', q: 'El efecto que hace vibrar el disco se llama…', options: ['Efecto Joule', 'Efecto piezoeléctrico', 'Efecto Doppler', 'Efecto fotoeléctrico'], answer: 1, explain: 'Piezoeléctrico: el cristal se deforma con la tensión.' },
  ],
}

/* ------------------------------------------------------------------ transistor */

function TransistorControls({ params, set }: { params: { model: TransistorName; ib: number }; set: (p: object) => void }) {
  const t = TRANSISTORS[params.model]
  const vcc = 5
  const rc = 150 // resistencia de carga (LED + resistencia)
  const vled = 2
  const icSat = ((vcc - vled - 0.2) / rc) * 1000 // mA
  const icLin = (t.beta * params.ib) / 1000 // mA (ib en µA)
  const on = params.ib > 0
  const sat = icLin >= icSat
  const ic = on ? Math.min(icLin, icSat) : 0
  const state = !on ? 'Corte' : sat ? 'Saturación' : 'Activo (amplifica)'
  return (
    <>
      <Field label="Modelo">
        <Segmented<TransistorName>
          value={params.model}
          options={(Object.keys(TRANSISTORS) as TransistorName[]).map((k) => ({ value: k, label: k }))}
          onChange={(model) => set({ model })}
        />
      </Field>
      <Readout label="Patas (mirando la cara plana)" value={t.pins.join(' · ')} />
      <Readout label="Ganancia típica (β = hFE)" value={t.beta} />
      <h4 className="panel-sub">Usado como llave para prender un LED a 5 V</h4>
      <Slider label="Corriente de base" value={params.ib} min={0} max={300} step={5} onChange={(ib) => set({ ib })} format={(v) => `${v} µA`} />
      <Formula>I<sub>C</sub> = β × I<sub>B</sub> = {t.beta} × {params.ib} µA = {fmt(icLin, 1)} mA</Formula>
      <Readout label="Corriente real de colector" value={`${fmt(ic, 1)} mA${sat ? ' (limitada por el circuito)' : ''}`} />
      <Readout label="Estado" value={state} />
      <div className="led-preview" style={{ opacity: 0.1 + 0.9 * (ic / icSat) }} aria-hidden />
    </>
  )
}

export const transistor: ComponentDef = {
  id: 'transistor',
  name: 'Transistor NPN',
  category: 'Componentes básicos',
  icon: '⏚',
  short: 'Llave electrónica y amplificador: una corriente chica en la base controla una grande.',
  camera: [3.2, 1.8, 5.4],
  target: [0, -0.5, 0],
  shadowY: -2.7,
  defaultParams: { model: 'BC547', ib: 50 },
  render: (p) => {
    const t = TRANSISTORS[p.model as TransistorName]
    return <TransistorModel model={p.model} conducting={(t.beta * p.ib) / 1000 / 18} />
  },
  Controls: TransistorControls as ComponentDef['Controls'],
  parts: [
    { id: 'encapsulado', name: 'Encapsulado TO-92', desc: 'Cuerpo de plástico negro con una cara plana donde está impreso el modelo. Mirando la cara plana se identifican las patas.' },
    { id: 'chip', name: 'Chip de silicio', desc: 'Tres capas de silicio N-P-N. La capa del medio (base, P) es finísima: una pequeña corriente en ella deja pasar una corriente mucho mayor entre colector y emisor.' },
    { id: 'hilos', name: 'Hilos de conexión', desc: 'Alambres de oro que unen el chip con las patas.' },
    { id: 'terminales', name: 'Terminales C · B · E', desc: 'Colector, base y emisor. ¡El orden cambia según el modelo! BC547 = C B E; 2N2222 = E B C. Siempre hay que mirar la hoja de datos.' },
  ],
  theory: (
    <>
      <p>
        El <strong>transistor</strong> es el componente más importante de la electrónica: adentro de un microcontrolador hay
        millones. Un transistor <strong>NPN</strong> tiene tres patas:
      </p>
      <ul>
        <li><strong>Base (B)</strong>: la “canilla”. Una corriente chica acá controla todo.</li>
        <li><strong>Colector (C)</strong>: por donde entra la corriente grande (desde la carga).</li>
        <li><strong>Emisor (E)</strong>: por donde sale, normalmente a GND.</li>
      </ul>
      <Formula>I<sub>C</sub> = β × I<sub>B</sub></Formula>
      <h4>Tres estados</h4>
      <ul>
        <li><strong>Corte</strong>: sin corriente de base, no conduce (llave abierta).</li>
        <li><strong>Activo</strong>: la corriente de colector es β veces la de base: amplifica.</li>
        <li><strong>Saturación</strong>: conduce todo lo que el circuito permite (llave cerrada).</li>
      </ul>
      <p>
        Con el Arduino se usa como <strong>llave</strong>: un pin (≈20 mA máx.) maneja a través de una resistencia de base
        (≈1 kΩ) cargas que necesitan más corriente, como motores, tiras de LEDs o relés.
      </p>
      <p className="tip">Con motores o relés, agregá un diodo en paralelo con la carga (diodo “de rueda libre”) para proteger al transistor.</p>
    </>
  ),
  activities: [
    { id: 'tr-1', type: 'mc', q: '¿Qué pata del transistor controla la corriente?', options: ['Colector', 'Base', 'Emisor', 'Ninguna'], answer: 1, explain: 'La base controla el paso de corriente entre colector y emisor.' },
    { id: 'tr-2', type: 'num', q: 'Un transistor con β = 100 recibe 0,5 mA en la base. ¿Cuántos mA puede pasar por el colector?', answer: 50, tolerance: 0.01, unit: 'mA', explain: 'Ic = β × Ib = 100 × 0,5 mA = 50 mA.' },
    { id: 'tr-3', type: 'mc', q: 'Cuando el transistor conduce todo lo que el circuito permite, está en…', options: ['Corte', 'Activo', 'Saturación', 'Reposo'], answer: 2, explain: 'Saturación = llave cerrada.' },
    { id: 'tr-4', type: 'mc', q: 'Mirando la cara plana de un BC547, el orden de las patas es…', options: ['E B C', 'C B E', 'B C E', 'B E C'], answer: 1, explain: 'BC547: colector, base, emisor. (El 2N2222 es al revés: E B C.)' },
    { id: 'tr-5', type: 'mc', q: '¿Por qué se usa un transistor para manejar un motor con el Arduino?', options: ['Porque el pin no entrega suficiente corriente', 'Para que gire al revés', 'Porque el motor es digital', 'No hace falta'], answer: 0, explain: 'Un pin entrega ≈20 mA; el transistor maneja corrientes mucho mayores.' },
  ],
}
