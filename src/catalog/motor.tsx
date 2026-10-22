import type { ComponentDef } from './types'
import { MotorModel } from '../three/models/Motor'
import { Field, Formula, Readout, Segmented, Slider, Toggle } from '../components/ui'

const fmt = (n: number, d = 2) => n.toFixed(d).replace('.', ',')

/* Modelo simple de un motor "130": R del bobinado ≈ 3,5 Ω, sin carga 0,15 A y 11 000 rpm a 6 V. */
const R_ARM = 3.5
const I_VACIO = 0.15
const I_CARGA = 0.8
const KE = (6 - I_VACIO * R_ARM) / 11000 // V por rpm (fuerza contraelectromotriz)

export function motorState(v: number, load: boolean) {
  const iMarcha = load ? I_CARGA : I_VACIO
  if (v <= iMarcha * R_ARM) {
    // no alcanza para vencer el rozamiento / la carga: el motor está trabado
    return { rpm: 0, current: v / R_ARM, stalled: v > 0 }
  }
  return { rpm: (v - iMarcha * R_ARM) / KE, current: iMarcha, stalled: false }
}

type Pol = 'normal' | 'invertida'

export const motor: ComponentDef = {
  id: 'motor',
  name: 'Motor de corriente continua (6 V)',
  category: 'Actuadores',
  icon: '⚙️',
  short: 'Convierte energía eléctrica en giro. Más tensión → más velocidad; invertís la polaridad → gira al revés.',
  camera: [1.4, 5.7, 7.3],
  target: [-0.4, 0, 0],
  shadowY: -0.76,
  defaultParams: { v: 3, pol: 'normal' as Pol, load: false },
  render: (p) => {
    const { rpm } = motorState(p.v, p.load)
    return <MotorModel rpm={rpm} dir={p.pol === 'normal' ? 1 : -1} voltage={p.v} />
  },
  Controls: ({ params, set }) => {
    const { rpm, current, stalled } = motorState(params.v, params.load)
    const sentido = rpm === 0 ? '—' : params.pol === 'normal' ? '↻ horario (visto desde el eje)' : '↺ antihorario (visto desde el eje)'
    return (
      <>
        <Slider label="Tensión aplicada" value={params.v} min={0} max={6} step={0.1} onChange={(v) => set({ v })} format={(v) => `${fmt(v, 1)} V`} />
        <Field label="Polaridad">
          <Segmented<Pol>
            value={params.pol}
            options={[
              { value: 'normal', label: '+ al punto rojo' },
              { value: 'invertida', label: 'Invertida' },
            ]}
            onChange={(pol) => set({ pol })}
          />
        </Field>
        <Toggle label="Frenar el eje (con carga)" value={params.load} onChange={(load) => set({ load })} />
        <Readout label="Velocidad" value={`${Math.round(rpm / 10) * 10} rpm`} />
        <Readout label="Sentido de giro" value={sentido} />
        <Readout label="Corriente" value={`${fmt(current)} A (${Math.round(current * 1000)} mA)`} />
        <Readout label="Potencia eléctrica" value={`${fmt(params.v * current)} W`} />
        {stalled && <p className="hint">⚠️ El motor está trabado: no gira, pero igual circula corriente y se calienta.</p>}
        <p className="hint">
          Un pin del Arduino da como máximo 40 mA (20 mA recomendado): este motor necesita {Math.round(current * 1000)} mA. Siempre
          se maneja con un transistor o un driver (L293D, L298N). La animación está en cámara lenta.
        </p>
      </>
    )
  },
  parts: [
    { id: 'carcasa', name: 'Carcasa de acero', desc: 'Lata de chapa de 20 × 15 mm (redonda con dos lados planos). Además de proteger, cierra el circuito magnético de los imanes. Adelante tiene el buje de bronce sinterizado (autolubricado) donde gira el eje, dos agujeros roscados para fijarlo y ranuras de ventilación.' },
    { id: 'imanes', name: 'Imanes permanentes (N y S)', desc: 'Dos arcos de ferrita pegados por dentro de la carcasa, uno con el polo norte hacia el rotor y el otro con el sur. Crean el campo magnético fijo (el estator).' },
    { id: 'rotor', name: 'Rotor (armadura de 3 polos)', desc: 'Paquete de chapas de acero apiladas (laminadas, para que no circulen corrientes parásitas) con tres bobinados de alambre de cobre esmaltado. Cuando circula corriente, cada bobina se convierte en un electroimán que es atraído y repelido por los imanes.' },
    { id: 'colector', name: 'Colector (conmutador)', desc: 'Cilindro de 3 segmentos de cobre (delgas) aislados entre sí, unido al eje. Cada delga está soldada a las bobinas. Al girar, va cambiando qué bobinas reciben corriente y en qué sentido: así el rotor siempre es empujado hacia el mismo lado.' },
    { id: 'eje', name: 'Eje de acero y piñón', desc: 'Eje de 2 mm que transmite el giro. Asoma unos 8 mm por delante; ahí se coloca un piñón, una polea o una hélice. La cinta roja sirve para ver el giro.' },
    { id: 'escobillas', name: 'Escobillas', desc: 'Dos láminas elásticas de bronce que rozan el colector y le llevan la corriente desde los terminales. Son la parte que más se gasta: por eso los motores con escobillas tienen vida limitada y producen chispas (ruido eléctrico).' },
    { id: 'tapa', name: 'Tapa trasera y terminales', desc: 'Tapa plástica que sostiene las escobillas y el buje trasero. Tiene los dos terminales para soldar los cables; el marcado con un punto rojo es el positivo (+).' },
  ],
  theory: (
    <>
      <p>
        El <strong>motor de corriente continua</strong> (motor DC) transforma energía eléctrica en movimiento de giro. El
        que usamos en el taller es el típico “130”, de 3 a 6 V, el de los autitos de juguete y los robots.
      </p>
      <h4>¿Por qué gira?</h4>
      <p>
        Un conductor por el que circula corriente, dentro de un campo magnético, recibe una <strong>fuerza</strong>. Los
        imanes de la carcasa crean el campo; la corriente circula por las bobinas del rotor. En un lado de cada espira la
        fuerza empuja hacia arriba y en el otro hacia abajo: aparece un par que hace girar el rotor.
      </p>
      <Formula>F = B × I × L</Formula>
      <p>
        Si la corriente no cambiara, el rotor giraría media vuelta y se quedaría quieto alineado con los imanes. Para eso
        está el <strong>colector</strong>: cada vez que una bobina pasa frente a un imán, las escobillas pasan a la delga
        siguiente e <strong>invierten la corriente</strong> en esa bobina. Así el empuje siempre es hacia el mismo lado. El
        rotor de 3 polos asegura que el motor arranque en cualquier posición.
      </p>
      <h4>Velocidad y sentido</h4>
      <ul>
        <li>
          La <strong>velocidad es casi proporcional a la tensión</strong>: a 3 V gira más o menos a la mitad que a 6 V.
          Al girar, el propio motor genera una tensión contraria (fuerza contraelectromotriz) que limita la corriente.
        </li>
        <li>
          Si lo <strong>frenamos</strong> (le ponemos carga), baja la velocidad y <strong>sube la corriente</strong>. Trabado
          del todo consume la corriente máxima (≈ 1,7 A a 6 V) y se calienta.
        </li>
        <li>
          Si <strong>invertimos la polaridad</strong>, la corriente circula al revés por las bobinas y el motor gira en el
          sentido contrario.
        </li>
      </ul>
      <h4>¿Se puede conectar directo al Arduino?</h4>
      <p>
        <strong>No.</strong> Un pin del Arduino entrega como máximo 40 mA, y el motor necesita entre 150 mA (sin carga) y
        más de 1 A al arrancar o si se traba. Además, la bobina, al cortarse la corriente, genera un pico de tensión
        inverso que puede quemar el pin. Por eso se usa:
      </p>
      <ul>
        <li>
          Un <strong>transistor</strong> (por ejemplo TIP120 o un MOSFET) que hace de llave, comandado por un pin PWM, con
          una <strong>fuente aparte</strong> para el motor (GND común).
        </li>
        <li>
          Un <strong>diodo de rueda libre</strong> (1N4007) en paralelo con el motor, en inversa, que descarga ese pico.
        </li>
        <li>
          Para que gire en los dos sentidos, un <strong>puente H</strong>: los drivers <strong>L293D</strong> o{' '}
          <strong>L298N</strong> ya traen todo eso adentro.
        </li>
      </ul>
      <p className="tip">
        Con <code>analogWrite(pin, valor)</code> (PWM) se regula la velocidad: el motor recibe pulsos y “ve” una tensión
        promedio menor.
      </p>
    </>
  ),
  activities: [
    { id: 'motor-1', type: 'mc', q: '¿Qué pieza invierte la corriente en las bobinas para que el rotor siga girando?', options: ['Los imanes', 'El colector (conmutador) con las escobillas', 'La carcasa', 'El buje'], answer: 1, explain: 'El colector, junto con las escobillas, cambia el sentido de la corriente en cada bobina a medida que gira.' },
    { id: 'motor-2', type: 'mc', q: '¿Qué pasa si invertís los cables del motor?', options: ['No gira', 'Gira más rápido', 'Gira en sentido contrario', 'Se quema'], answer: 2, explain: 'Al invertir la polaridad, la corriente circula al revés y la fuerza cambia de sentido.' },
    { id: 'motor-3', type: 'num', q: 'Un motor gira a 11 000 rpm con 6 V. Aproximadamente, ¿a cuántas rpm girará con 3 V (sin carga)?', answer: 5500, tolerance: 0.1, unit: 'rpm', explain: 'La velocidad es casi proporcional a la tensión: la mitad de tensión, más o menos la mitad de velocidad (≈ 5500 rpm).' },
    { id: 'motor-4', type: 'mc', q: '¿Por qué no se conecta el motor directo a un pin digital del Arduino?', options: ['Porque el motor funciona con corriente alterna', 'Porque necesita mucha más corriente que los 40 mA que da un pin', 'Porque gira demasiado lento', 'Porque el Arduino no tiene 5 V'], answer: 1, explain: 'El motor consume cientos de mA (más de 1 A al arrancar). Se usa un transistor o un driver como el L293D.' },
    { id: 'motor-5', type: 'mc', q: '¿Para qué se pone un diodo en paralelo (en inversa) con el motor?', options: ['Para que gire más rápido', 'Para que brille', 'Para descargar el pico de tensión que genera la bobina al cortar la corriente', 'Para cambiar el sentido de giro'], answer: 2, explain: 'Es el diodo de rueda libre: protege al transistor del pico inverso de la bobina.' },
    { id: 'motor-6', type: 'num', q: 'Si frenamos el motor y consume 0,8 A a 6 V, ¿cuántos watts de potencia eléctrica toma?', answer: 4.8, tolerance: 0.02, unit: 'W', explain: 'P = V × I = 6 V × 0,8 A = 4,8 W.' },
    { id: 'motor-7', type: 'mc', q: 'Cuando frenás el eje con los dedos, la corriente del motor…', options: ['Baja', 'Sube', 'No cambia', 'Se hace cero'], answer: 1, explain: 'Al bajar la velocidad baja la fuerza contraelectromotriz y circula más corriente.' },
    { id: 'motor-8', type: 'mc', q: '¿Qué integrado permite manejar un motor en los dos sentidos desde el Arduino?', options: ['LM35', 'L293D (puente H)', '7805', 'NE555'], answer: 1, explain: 'El L293D (o el módulo L298N) es un puente H: invierte la polaridad del motor según las señales del Arduino.' },
  ],
}
