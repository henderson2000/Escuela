import type { ComponentDef } from './types'
import { LED_COLORS, LedModel, type LedColor } from '../three/models/Led'
import { Field, Formula, Readout, Segmented, Slider, Toggle } from '../components/ui'
import { E12, formatOhms } from '../lib/resistor'

function nextE12(r: number) {
  for (let exp = 0; exp < 7; exp++) for (const b of E12) if (b * 10 ** exp >= r) return Math.round(b * 10 ** exp)
  return r
}

function LedControls({ params, set }: { params: { color: LedColor; on: boolean; vs: number; ma: number }; set: (p: object) => void }) {
  const c = LED_COLORS[params.color]
  const r = ((params.vs - c.vf) / (params.ma / 1000))
  return (
    <>
      <Field label="Color">
        <div className="swatches big">
          {(Object.keys(LED_COLORS) as LedColor[]).map((k) => (
            <button
              key={k}
              type="button"
              title={LED_COLORS[k].label}
              className={`swatch ${k === params.color ? 'active' : ''}`}
              style={{ background: LED_COLORS[k].hex }}
              onClick={() => set({ color: k })}
            />
          ))}
        </div>
      </Field>
      <Toggle label="Encendido" value={params.on} onChange={(on) => set({ on })} />
      <Readout label="Tensión directa (Vf)" value={`${String(c.vf).replace('.', ',')} V`} />
      <Readout label="Longitud de onda" value={c.lambda} />
      <h4 className="panel-sub">Calculadora de resistencia</h4>
      <Field label="Fuente">
        <Segmented<number>
          value={params.vs}
          options={[3.3, 5, 9, 12].map((v) => ({ value: v, label: `${String(v).replace('.', ',')} V` }))}
          onChange={(vs) => set({ vs })}
        />
      </Field>
      <Slider label="Corriente deseada" value={params.ma} min={2} max={20} onChange={(ma) => set({ ma })} format={(v) => `${v} mA`} />
      {r > 0 ? (
        <>
          <Formula>
            R = (V<sub>fuente</sub> − V<sub>f</sub>) / I = ({String(params.vs).replace('.', ',')} − {String(c.vf).replace('.', ',')}) / {params.ma / 1000} A
          </Formula>
          <Readout label="Resistencia calculada" value={formatOhms(Math.round(r))} />
          <Readout label="Valor comercial (E12)" value={formatOhms(nextE12(r))} />
        </>
      ) : (
        <p className="warn">Con {params.vs} V no alcanza para encender un LED {c.label.toLowerCase()} (necesita {c.vf} V).</p>
      )}
    </>
  )
}

export const led: ComponentDef = {
  id: 'led',
  name: 'LED',
  category: 'Componentes básicos',
  icon: '💡',
  short: 'Diodo que emite luz. Tiene polaridad: ánodo (+) y cátodo (−).',
  camera: [3.2, 1.0, 7.4],
  target: [0, -1.0, 0],
  shadowY: -4.05,
  defaultParams: { color: 'rojo', on: true, vs: 5, ma: 15 },
  render: (p) => <LedModel color={p.color} on={p.on} brightness={Math.min(1, p.ma / 15)} />,
  Controls: LedControls as ComponentDef['Controls'],
  parts: [
    { id: 'capsula', name: 'Cápsula de epoxi', desc: 'Resina transparente o coloreada que protege el interior y funciona como lente: concentra la luz hacia arriba.' },
    { id: 'borde', name: 'Borde plano', desc: 'El borde inferior tiene un lado plano: ese lado indica el CÁTODO (−). Muy útil cuando las patas ya están cortadas.' },
    { id: 'chip', name: 'Chip semiconductor', desc: 'El “dado” donde realmente se produce la luz: una unión P-N. Al pasar corriente, los electrones se recombinan y liberan fotones. El material define el color.' },
    { id: 'yunque', name: 'Yunque (copa reflectora)', desc: 'Pieza metálica grande, unida al cátodo. Sostiene el chip y tiene forma de copa para reflejar la luz hacia arriba.' },
    { id: 'poste', name: 'Poste', desc: 'Pieza metálica más chica, unida al ánodo. Se conecta al chip con un hilo de oro.' },
    { id: 'hilo', name: 'Hilo de conexión', desc: 'Alambre de oro finísimo (más fino que un pelo) que une el chip con el poste.' },
    { id: 'anodo', name: 'Ánodo (+) – pata larga', desc: 'Se conecta al positivo (por ejemplo, a un pin del Arduino a través de una resistencia).' },
    { id: 'catodo', name: 'Cátodo (−) – pata corta', desc: 'Se conecta al negativo / GND. Está del lado plano de la cápsula.' },
  ],
  theory: (
    <>
      <p>
        Un <strong>LED</strong> (<em>Light Emitting Diode</em>, diodo emisor de luz) es un diodo: deja pasar la corriente
        en <strong>un solo sentido</strong>, de ánodo a cátodo. Cuando conduce, emite luz.
      </p>
      <ul>
        <li><strong>Ánodo (+)</strong>: pata larga.</li>
        <li><strong>Cátodo (−)</strong>: pata corta, lado plano de la cápsula, pieza grande adentro.</li>
      </ul>
      <h4>¡Siempre con resistencia!</h4>
      <p>
        El LED tiene una <strong>tensión directa (Vf)</strong> casi fija (≈2 V en rojo, ≈3,2 V en azul o blanco). Si se
        conecta directo a 5 V, la corriente sube sin control y el LED se quema. Por eso se pone una resistencia en serie:
      </p>
      <Formula>R = (V<sub>fuente</sub> − V<sub>f</sub>) / I<sub>LED</sub></Formula>
      <p>
        Ejemplo: LED rojo a 5 V con 15 mA → R = (5 − 2) / 0,015 = <strong>200 Ω</strong> → se usa 220 Ω (valor
        comercial).
      </p>
      <p className="tip">Si el LED no enciende, lo primero es darlo vuelta: probablemente esté al revés.</p>
    </>
  ),
  activities: [
    { id: 'led-1', type: 'mc', q: '¿Qué pata del LED es el ánodo (+)?', options: ['La más corta', 'La más larga', 'Da igual, no tiene polaridad'], answer: 1, explain: 'El ánodo es la pata larga; el cátodo, la corta.' },
    { id: 'led-2', type: 'mc', q: 'El lado plano de la cápsula del LED indica…', options: ['El ánodo', 'El cátodo', 'El color', 'La potencia'], answer: 1, explain: 'El lado plano marca el cátodo (−).' },
    { id: 'led-3', type: 'num', q: 'Un LED rojo (Vf = 2 V) se alimenta con 5 V y queremos 15 mA. ¿Qué resistencia necesitamos (en Ω)?', answer: 200, tolerance: 0.03, unit: 'Ω', explain: 'R = (5 − 2) / 0,015 = 200 Ω. En la práctica se usa 220 Ω.' },
    { id: 'led-4', type: 'mc', q: '¿Qué pasa si conectamos un LED directo a 5 V sin resistencia?', options: ['Brilla más y dura más', 'Se quema por exceso de corriente', 'No enciende nunca', 'Funciona igual'], answer: 1, explain: 'Sin resistencia la corriente no tiene límite y el LED se quema.' },
    { id: 'led-5', type: 'mc', q: '¿Qué significa la sigla LED?', options: ['Luz Eléctrica Directa', 'Light Emitting Diode', 'Low Energy Device', 'Línea de Electrones Dirigidos'], answer: 1, explain: 'Light Emitting Diode: diodo emisor de luz.' },
    { id: 'led-6', type: 'mc', q: '¿Dónde se produce la luz dentro del LED?', options: ['En la cápsula', 'En el chip semiconductor', 'En las patas', 'En el hilo de oro'], answer: 1, explain: 'La luz se genera en el chip semiconductor (la unión P-N).' },
  ],
}
