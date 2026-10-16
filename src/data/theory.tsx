import { useState, type ReactNode } from 'react'
import type { Activity } from '../catalog/types'
import { Formula, Readout, Segmented, Slider } from '../components/ui'
import { SYMBOL_NAMES, SymbolIcon, type SymbolKind } from '../components/Symbols'
import { formatOhms } from '../lib/resistor'

export interface Topic {
  id: string
  title: string
  icon: string
  summary: string
  content: ReactNode
  activities: Activity[]
}

const fmt = (n: number, d = 2) => (Number.isFinite(n) ? Number(n.toFixed(d)).toString().replace('.', ',') : '—')

function OhmCalc() {
  const [solve, setSolve] = useState<'V' | 'I' | 'R'>('I')
  const [v, setV] = useState(9)
  const [i, setI] = useState(20)
  const [r, setR] = useState(470)
  const V = solve === 'V' ? (i / 1000) * r : v
  const I = solve === 'I' ? (v / r) * 1000 : i
  const R = solve === 'R' ? v / (i / 1000) : r
  return (
    <div className="calc">
      <div className="ohm-triangle" aria-hidden>
        <span className={solve === 'V' ? 'on' : ''}>V</span>
        <span className={solve === 'I' ? 'on' : ''}>I</span>
        <span className={solve === 'R' ? 'on' : ''}>R</span>
      </div>
      <Segmented<'V' | 'I' | 'R'>
        value={solve}
        options={[
          { value: 'V', label: 'Calcular V' },
          { value: 'I', label: 'Calcular I' },
          { value: 'R', label: 'Calcular R' },
        ]}
        onChange={setSolve}
      />
      {solve !== 'V' && <Slider label="Tensión" value={v} min={1} max={24} step={0.5} onChange={setV} format={(x) => `${fmt(x, 1)} V`} />}
      {solve !== 'I' && <Slider label="Corriente" value={i} min={1} max={500} onChange={setI} format={(x) => `${x} mA`} />}
      {solve !== 'R' && <Slider label="Resistencia" value={r} min={10} max={10000} step={10} onChange={setR} format={(x) => formatOhms(x)} />}
      <Formula>
        {solve === 'V' && <>V = I × R = {fmt(I / 1000, 3)} A × {fmt(R, 0)} Ω = <strong>{fmt(V)} V</strong></>}
        {solve === 'I' && <>I = V / R = {fmt(V, 1)} V / {fmt(R, 0)} Ω = <strong>{fmt(I)} mA</strong></>}
        {solve === 'R' && <>R = V / I = {fmt(V, 1)} V / {fmt(I / 1000, 3)} A = <strong>{formatOhms(R)}</strong></>}
      </Formula>
      <Readout label="Potencia (P = V × I)" value={`${fmt(V * (I / 1000), 3)} W`} />
    </div>
  )
}

function SeriesParallelCalc() {
  const [mode, setMode] = useState<'serie' | 'paralelo'>('serie')
  const [rs, setRs] = useState([220, 330, 470])
  const total = mode === 'serie' ? rs.reduce((a, b) => a + b, 0) : 1 / rs.reduce((a, b) => a + 1 / b, 0)
  return (
    <div className="calc">
      <Segmented<'serie' | 'paralelo'>
        value={mode}
        options={[
          { value: 'serie', label: 'Serie' },
          { value: 'paralelo', label: 'Paralelo' },
        ]}
        onChange={setMode}
      />
      <svg viewBox="0 0 320 140" className="mini-circuit">
        {mode === 'serie' ? (
          <>
            <path d="M10 70 H30" />
            {rs.map((_, k) => (
              <g key={k} transform={`translate(${30 + k * 90} 50)`}>
                <path d="M0 20 H18 L22 10 L30 30 L38 10 L46 30 L54 10 L58 20 H80" />
              </g>
            ))}
            <path d="M300 70 H310" />
            {rs.map((r, k) => (
              <text key={k} x={70 + k * 90} y={40} className="svg-label">{formatOhms(r)}</text>
            ))}
          </>
        ) : (
          <>
            <path d="M10 70 H60 M260 70 H310" />
            <path d={`M60 ${70 - (rs.length - 1) * 20} V${70 + (rs.length - 1) * 20} M260 ${70 - (rs.length - 1) * 20} V${70 + (rs.length - 1) * 20}`} />
            {rs.map((r, k) => {
              const y = 70 + (k - (rs.length - 1) / 2) * 40
              return (
                <g key={k}>
                  <path d={`M60 ${y} H120 M200 ${y} H260`} />
                  <g transform={`translate(120 ${y - 20})`}>
                    <path d="M0 20 H18 L22 10 L30 30 L38 10 L46 30 L54 10 L58 20 H80" />
                  </g>
                  <text x={160} y={y - 14} className="svg-label">{formatOhms(r)}</text>
                </g>
              )
            })}
          </>
        )}
      </svg>
      {rs.map((r, k) => (
        <Slider
          key={k}
          label={`R${k + 1}`}
          value={r}
          min={10}
          max={2000}
          step={10}
          onChange={(v) => setRs(rs.map((x, j) => (j === k ? v : x)))}
          format={formatOhms}
        />
      ))}
      <div className="row">
        {rs.length < 4 && (
          <button className="btn small" type="button" onClick={() => setRs([...rs, 1000])}>
            + Agregar resistencia
          </button>
        )}
        {rs.length > 2 && (
          <button className="btn small" type="button" onClick={() => setRs(rs.slice(0, -1))}>
            − Quitar
          </button>
        )}
      </div>
      <Formula>
        {mode === 'serie' ? 'R total = R1 + R2 + …' : '1 / R total = 1/R1 + 1/R2 + …'} = <strong>{formatOhms(Math.round(total * 10) / 10)}</strong>
      </Formula>
    </div>
  )
}

function DividerCalc() {
  const [vin, setVin] = useState(5)
  const [r1, setR1] = useState(10000)
  const [r2, setR2] = useState(10000)
  const vout = (vin * r2) / (r1 + r2)
  return (
    <div className="calc">
      <Slider label="V entrada" value={vin} min={1} max={12} step={0.5} onChange={setVin} format={(x) => `${fmt(x, 1)} V`} />
      <Slider label="R1 (arriba)" value={r1} min={100} max={47000} step={100} onChange={setR1} format={formatOhms} />
      <Slider label="R2 (abajo)" value={r2} min={100} max={47000} step={100} onChange={setR2} format={formatOhms} />
      <Formula>
        V<sub>out</sub> = {fmt(vin, 1)} × {formatOhms(r2)} / ({formatOhms(r1)} + {formatOhms(r2)}) = <strong>{fmt(vout)} V</strong>
      </Formula>
    </div>
  )
}

function PwmDemo() {
  const [duty, setDuty] = useState(25)
  const pts: string[] = []
  for (let k = 0; k < 4; k++) {
    const x0 = 10 + k * 75
    const xOn = x0 + (75 * duty) / 100
    pts.push(`${x0},60 ${x0},${duty > 0 ? 15 : 60} ${xOn},${duty > 0 ? 15 : 60} ${xOn},60 ${x0 + 75},60`)
  }
  return (
    <div className="calc">
      <Slider label="Ciclo de trabajo" value={duty} min={0} max={100} onChange={setDuty} format={(x) => `${x} %`} />
      <svg viewBox="0 0 320 75" className="mini-circuit">
        <polyline points={pts.join(' ')} />
        <text x="2" y="12" className="svg-label small">5V</text>
        <text x="2" y="72" className="svg-label small">0V</text>
      </svg>
      <Readout label="analogWrite(pin, …)" value={Math.round((duty / 100) * 255)} />
      <Readout label="Tensión promedio" value={`${fmt((5 * duty) / 100)} V`} />
      <div className="pwm-led" style={{ opacity: 0.1 + (0.9 * duty) / 100 }} />
    </div>
  )
}

function SymbolGallery() {
  return (
    <div className="symbol-grid">
      {(Object.keys(SYMBOL_NAMES) as SymbolKind[]).map((k) => (
        <div key={k} className="symbol-card">
          <SymbolIcon kind={k} />
          <span>{SYMBOL_NAMES[k]}</span>
        </div>
      ))}
    </div>
  )
}

export const TOPICS: Topic[] = [
  {
    id: 'electricidad',
    title: 'Tensión, corriente y resistencia',
    icon: '⚡',
    summary: 'Las tres magnitudes básicas y la analogía del agua.',
    content: (
      <>
        <p>
          La electricidad es el movimiento de <strong>electrones</strong> por un conductor. Para entenderla sirve pensar en
          agua que circula por una cañería:
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Magnitud</th>
                <th>Símbolo</th>
                <th>Unidad</th>
                <th>Analogía del agua</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Tensión (voltaje)</td>
                <td>V</td>
                <td>Voltio (V)</td>
                <td>La presión que empuja el agua</td>
              </tr>
              <tr>
                <td>Corriente (intensidad)</td>
                <td>I</td>
                <td>Ampere (A)</td>
                <td>La cantidad de agua que pasa por segundo</td>
              </tr>
              <tr>
                <td>Resistencia</td>
                <td>R</td>
                <td>Ohm (Ω)</td>
                <td>Lo angosta que es la cañería</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul>
          <li>Un <strong>circuito</strong> es un camino cerrado: fuente → cables → carga → vuelta a la fuente.</li>
          <li>Si el camino se corta (<strong>circuito abierto</strong>), la corriente no circula.</li>
          <li>Un <strong>cortocircuito</strong> es un camino sin resistencia: la corriente se dispara y algo se quema.</li>
          <li>Corriente <strong>continua (CC)</strong>: siempre en el mismo sentido (pilas, USB). <strong>Alterna (CA)</strong>: cambia de sentido (enchufe, 220 V 50 Hz).</li>
        </ul>
        <p className="tip">Múltiplos que vamos a usar todo el tiempo: 1 kΩ = 1000 Ω · 1 MΩ = 1 000 000 Ω · 1 mA = 0,001 A.</p>
      </>
    ),
    activities: [
      { id: 'el-1', type: 'mc', q: '¿En qué unidad se mide la corriente?', options: ['Voltio', 'Ampere', 'Ohm', 'Watt'], answer: 1, explain: 'La corriente se mide en amperes (A).' },
      { id: 'el-2', type: 'mc', q: 'En la analogía del agua, la tensión es…', options: ['La cañería', 'La presión que empuja', 'La cantidad de agua', 'La canilla'], answer: 1, explain: 'La tensión es la “presión” que empuja a los electrones.' },
      { id: 'el-3', type: 'num', q: '¿Cuántos ohms son 4,7 kΩ?', answer: 4700, tolerance: 0, unit: 'Ω', explain: '4,7 × 1000 = 4700 Ω.' },
      { id: 'el-4', type: 'num', q: '¿Cuántos amperes son 250 mA?', answer: 0.25, tolerance: 0, unit: 'A', explain: '250 / 1000 = 0,25 A.' },
      { id: 'el-5', type: 'mc', q: 'Un cortocircuito es…', options: ['Un circuito muy corto', 'Un camino sin resistencia por donde la corriente se dispara', 'Un cable cortado', 'Un circuito apagado'], answer: 1, explain: 'Cortocircuito = camino de resistencia casi nula.' },
    ],
  },
  {
    id: 'ohm',
    title: 'Ley de Ohm',
    icon: 'Ω',
    summary: 'V = I × R. Calculadora interactiva.',
    content: (
      <>
        <p>
          Georg Ohm descubrió que, en una resistencia, la <strong>corriente es proporcional a la tensión</strong>: si
          duplicamos la tensión, se duplica la corriente.
        </p>
        <Formula>V = I × R &nbsp;&nbsp;·&nbsp;&nbsp; I = V / R &nbsp;&nbsp;·&nbsp;&nbsp; R = V / I</Formula>
        <p>Truco: tapá con el dedo la que querés calcular en el triángulo V / (I · R).</p>
        <OhmCalc />
      </>
    ),
    activities: [
      { id: 'ohm-1', type: 'num', q: 'Una resistencia de 1 kΩ conectada a 9 V. ¿Cuántos mA circulan?', answer: 9, tolerance: 0.01, unit: 'mA', explain: 'I = 9 / 1000 = 0,009 A = 9 mA.' },
      { id: 'ohm-2', type: 'num', q: 'Por una resistencia de 100 Ω circulan 50 mA. ¿Qué tensión tiene?', answer: 5, tolerance: 0.01, unit: 'V', explain: 'V = 0,05 × 100 = 5 V.' },
      { id: 'ohm-3', type: 'num', q: 'A 12 V circulan 0,5 A. ¿Cuánto vale la resistencia?', answer: 24, tolerance: 0.01, unit: 'Ω', explain: 'R = 12 / 0,5 = 24 Ω.' },
      { id: 'ohm-4', type: 'mc', q: 'Si se duplica la resistencia y la tensión queda igual, la corriente…', options: ['Se duplica', 'Se reduce a la mitad', 'Queda igual', 'Se hace cero'], answer: 1, explain: 'I = V / R: con el doble de R, la mitad de I.' },
    ],
  },
  {
    id: 'potencia',
    title: 'Potencia eléctrica',
    icon: '🔥',
    summary: 'Cuánta energía por segundo consume o disipa un componente.',
    content: (
      <>
        <p>
          La <strong>potencia</strong> indica cuánta energía por segundo consume un componente. Se mide en <strong>watts (W)</strong>.
        </p>
        <Formula>P = V × I &nbsp;&nbsp;·&nbsp;&nbsp; P = I² × R &nbsp;&nbsp;·&nbsp;&nbsp; P = V² / R</Formula>
        <p>
          En una resistencia, toda esa potencia se convierte en <strong>calor</strong>. Por eso existen resistencias de ¼ W,
          ½ W, 1 W, 5 W…: hay que elegir una que aguante la potencia del circuito (con margen).
        </p>
        <p className="tip">Energía = potencia × tiempo. Lo que paga la factura de luz son kWh: 1000 W durante 1 hora.</p>
      </>
    ),
    activities: [
      { id: 'pot-e1', type: 'num', q: 'Un LED usa 2 V y 20 mA. ¿Qué potencia consume en mW?', answer: 40, tolerance: 0.01, unit: 'mW', explain: 'P = 2 × 0,02 = 0,04 W = 40 mW.' },
      { id: 'pot-e2', type: 'num', q: 'Una lámpara de 12 V consume 2 A. ¿Cuántos W tiene?', answer: 24, tolerance: 0.01, unit: 'W', explain: 'P = 12 × 2 = 24 W.' },
      { id: 'pot-e3', type: 'mc', q: 'En una resistencia, la potencia se transforma en…', options: ['Luz', 'Calor', 'Sonido', 'Movimiento'], answer: 1, explain: 'Efecto Joule: la resistencia se calienta.' },
    ],
  },
  {
    id: 'serie-paralelo',
    title: 'Circuitos serie y paralelo',
    icon: '⫘',
    summary: 'Cómo se combinan las resistencias. Calculadora interactiva.',
    content: (
      <>
        <h4>Serie</h4>
        <p>
          Los componentes están <strong>uno detrás del otro</strong>: hay un solo camino. La corriente es la <strong>misma</strong> en
          todos y las tensiones se reparten. Si uno se corta, se apagan todos (como las guirnaldas viejas).
        </p>
        <Formula>R<sub>total</sub> = R1 + R2 + R3 + …</Formula>
        <h4>Paralelo</h4>
        <p>
          Los componentes comparten los <strong>mismos dos puntos</strong>: hay varios caminos. La tensión es la
          <strong> misma</strong> en todos y la corriente se reparte. Así están conectados los enchufes de tu casa.
        </p>
        <Formula>1 / R<sub>total</sub> = 1/R1 + 1/R2 + … &nbsp;&nbsp;(dos iguales: R / 2)</Formula>
        <SeriesParallelCalc />
      </>
    ),
    activities: [
      { id: 'sp-1', type: 'num', q: '¿Cuánto da 220 Ω + 330 Ω en serie?', answer: 550, tolerance: 0, unit: 'Ω', explain: 'En serie se suman: 550 Ω.' },
      { id: 'sp-2', type: 'num', q: 'Dos resistencias de 1 kΩ en paralelo. ¿Cuántos Ω da?', answer: 500, tolerance: 0.01, unit: 'Ω', explain: 'Dos iguales en paralelo: la mitad, 500 Ω.' },
      { id: 'sp-3', type: 'mc', q: 'En un circuito en serie, la corriente…', options: ['Es la misma en todos los componentes', 'Se reparte', 'Es cero', 'Depende del color'], answer: 0, explain: 'En serie hay un solo camino: la misma corriente.' },
      { id: 'sp-4', type: 'mc', q: 'Los enchufes de una casa están conectados en…', options: ['Serie', 'Paralelo'], answer: 1, explain: 'En paralelo: todos reciben 220 V y si uno se desconecta los demás siguen.' },
      { id: 'sp-5', type: 'mc', q: 'En paralelo, la resistencia total es…', options: ['Mayor que la mayor', 'Menor que la menor', 'Igual a la suma', 'Siempre 0'], answer: 1, explain: 'Agregar caminos facilita el paso: la total siempre es menor que la menor.' },
    ],
  },
  {
    id: 'divisor',
    title: 'Divisor de tensión',
    icon: '⅟',
    summary: 'Dos resistencias en serie para obtener una tensión menor.',
    content: (
      <>
        <p>
          Dos resistencias en serie se “reparten” la tensión de manera proporcional a su valor. En el punto medio aparece
          una tensión menor:
        </p>
        <Formula>V<sub>out</sub> = V<sub>in</sub> × R2 / (R1 + R2)</Formula>
        <p>
          Es la base del potenciómetro y de cómo se leen sensores resistivos (LDR, termistor) con el Arduino.
        </p>
        <DividerCalc />
      </>
    ),
    activities: [
      { id: 'div-1', type: 'num', q: 'Vin = 9 V, R1 = 2 kΩ, R2 = 1 kΩ. ¿Cuánto vale Vout?', answer: 3, tolerance: 0.01, unit: 'V', explain: '9 × 1 / (2 + 1) = 3 V.' },
      { id: 'div-2', type: 'mc', q: 'Si R1 = R2, la tensión de salida es…', options: ['Igual a Vin', 'La mitad de Vin', 'Cero', 'El doble'], answer: 1, explain: 'Iguales → se reparten mitad y mitad.' },
    ],
  },
  {
    id: 'senales',
    title: 'Señales digitales, analógicas y PWM',
    icon: '⎍',
    summary: 'Cómo “habla” el Arduino con el mundo.',
    content: (
      <>
        <ul>
          <li><strong>Digital</strong>: sólo dos valores, HIGH (5 V, 1) o LOW (0 V, 0). Ej.: pulsador, LED prendido/apagado.</li>
          <li><strong>Analógica</strong>: cualquier valor dentro de un rango. Ej.: potenciómetro, LDR, temperatura.</li>
        </ul>
        <p>
          El Arduino lee analógicas con <code>analogRead()</code> (0–1023). Para <em>generar</em> algo parecido a una
          salida analógica usa <strong>PWM</strong>: prende y apaga muy rápido. El porcentaje del tiempo que está prendido
          (ciclo de trabajo) define la tensión promedio y, por ejemplo, el brillo de un LED.
        </p>
        <PwmDemo />
      </>
    ),
    activities: [
      { id: 'sig-1', type: 'mc', q: '¿Cuántos estados tiene una señal digital?', options: ['1', '2', '10', 'Infinitos'], answer: 1, explain: 'Dos: HIGH y LOW.' },
      { id: 'sig-2', type: 'num', q: 'Con analogWrite(9, 127), ¿qué tensión promedio sale aproximadamente (V)?', answer: 2.5, tolerance: 0.03, unit: 'V', explain: '127/255 ≈ 50 % de 5 V ≈ 2,5 V.' },
      { id: 'sig-3', type: 'mc', q: 'Un potenciómetro entrega una señal…', options: ['Digital', 'Analógica'], answer: 1, explain: 'Puede dar cualquier tensión entre 0 y 5 V.' },
    ],
  },
  {
    id: 'simbolos',
    title: 'Símbolos y esquemas',
    icon: '⌁',
    summary: 'El “idioma” de los planos electrónicos.',
    content: (
      <>
        <p>
          Un <strong>esquema</strong> (o plano) dibuja un circuito con símbolos estandarizados. No muestra cómo se ven los
          componentes, sino <strong>cómo están conectados</strong>. Las líneas son cables.
        </p>
        <SymbolGallery />
        <p className="tip">En el juego “Completá el plano” vas a tener que reconocer estos símbolos.</p>
      </>
    ),
    activities: [
      { id: 'sym-1', type: 'mc', q: 'En un esquema, una línea en zigzag representa…', options: ['Un capacitor', 'Una resistencia', 'Un LED', 'Un cable'], answer: 1, explain: 'El zigzag es el símbolo de la resistencia.' },
      { id: 'sym-2', type: 'mc', q: 'Dos líneas paralelas iguales (| |) representan…', options: ['Una pila', 'Un capacitor', 'Un interruptor', 'Masa'], answer: 1, explain: 'Dos placas paralelas = capacitor.' },
      { id: 'sym-3', type: 'mc', q: 'En el símbolo de la pila, la línea larga es…', options: ['El negativo', 'El positivo'], answer: 1, explain: 'La línea larga es el positivo.' },
    ],
  },
]

export const getTopic = (id: string) => TOPICS.find((t) => t.id === id)
