import { useEffect, useState } from 'react'
import type { ComponentDef } from './types'
import { ResistorModel } from '../three/models/Resistor'
import {
  COLORS,
  DIGIT_COLORS,
  MULTIPLIER_COLORS,
  TOLERANCE_COLORS,
  bandsToValue,
  formatOhms,
  valueToBands,
  type BandCount,
  type ColorName,
} from '../lib/resistor'
import { Field, Readout, Segmented, Formula } from '../components/ui'
import { ColorCodeTable } from '../components/ColorCodeTable'

function BandPicker({ index, total, value, onChange }: { index: number; total: number; value: ColorName; onChange: (c: ColorName) => void }) {
  const isTol = index === total - 1
  const isMult = index === total - 2
  const list = isTol ? TOLERANCE_COLORS : isMult ? MULTIPLIER_COLORS : DIGIT_COLORS
  const title = isTol ? 'Tolerancia' : isMult ? 'Multiplicador' : `Cifra ${index + 1}`
  return (
    <div className="band-picker">
      <span className="band-title">{title}</span>
      <div className="swatches">
        {list.map((c) => (
          <button
            key={c.name}
            type="button"
            title={c.label}
            className={`swatch ${c.name === value ? 'active' : ''}`}
            style={{ background: c.hex }}
            onClick={() => onChange(c.name)}
          />
        ))}
      </div>
      <span className="band-name">{COLORS[value].label}</span>
    </div>
  )
}

function ResistorControls({ params, set }: { params: { count: BandCount; bands: ColorName[] }; set: (p: object) => void }) {
  const { ohms, tolerance } = bandsToValue(params.bands)
  const [text, setText] = useState(String(ohms))
  useEffect(() => {
    setText(String(ohms))
  }, [ohms])

  const applyText = (t: string) => {
    setText(t)
    const clean = t.trim().toLowerCase().replace(',', '.')
    const m = clean.match(/^([\d.]+)\s*([kmr]?)/)
    if (!m) return
    let v = parseFloat(m[1])
    if (m[2] === 'k') v *= 1e3
    if (m[2] === 'm') v *= 1e6
    if (!isFinite(v) || v <= 0) return
    set({ bands: valueToBands(v, params.count, tolerance) })
  }

  return (
    <>
      <Field label="Cantidad de bandas">
        <Segmented<BandCount>
          value={params.count}
          options={[
            { value: 4, label: '4 bandas' },
            { value: 5, label: '5 bandas' },
          ]}
          onChange={(count) => set({ count, bands: valueToBands(ohms, count, count === 5 && tolerance === 5 ? 1 : tolerance) })}
        />
      </Field>
      <Field label="Valor (podés escribir 220, 4.7k, 1M…)">
        <input className="input" value={text} onChange={(e) => applyText(e.target.value)} />
      </Field>
      {params.bands.map((b, i) => (
        <BandPicker
          key={i}
          index={i}
          total={params.bands.length}
          value={b}
          onChange={(c) => {
            const bands = [...params.bands]
            bands[i] = c
            set({ bands })
          }}
        />
      ))}
      <Readout label="Valor nominal" value={formatOhms(ohms)} />
      <Readout label="Tolerancia" value={`± ${String(tolerance).replace('.', ',')} %`} />
      <Readout
        label="Rango real"
        value={`${formatOhms(ohms * (1 - tolerance / 100))} – ${formatOhms(ohms * (1 + tolerance / 100))}`}
      />
    </>
  )
}

export const resistor: ComponentDef = {
  id: 'resistencia',
  name: 'Resistencia',
  category: 'Componentes básicos',
  icon: '▭',
  short: 'Se opone al paso de la corriente. Su valor se lee con el código de colores.',
  camera: [0, 1.6, 6.5],
  shadowY: -2,
  defaultParams: { count: 4, bands: valueToBands(220, 4, 5) },
  render: (p) => <ResistorModel bands={p.bands} />,
  Controls: ResistorControls as ComponentDef['Controls'],
  parts: [
    { id: 'cuerpo', name: 'Cuerpo / recubrimiento', desc: 'Capa de pintura o laca aislante que protege el interior. En las de película de carbono suele ser beige; en las de película metálica (más precisas, 5 bandas) suele ser celeste.' },
    { id: 'bandas', name: 'Bandas de colores', desc: 'Indican el valor en ohms (Ω) y la tolerancia. Se leen empezando por la banda más cercana a un extremo; la de tolerancia (dorada, plateada, marrón…) queda separada del resto.' },
    { id: 'pelicula', name: 'Película resistiva', desc: 'Capa finísima de carbono o metal depositada sobre el núcleo. Se le talla una espiral: cuanto más larga y angosta es la espiral, mayor es la resistencia.' },
    { id: 'nucleo', name: 'Núcleo cerámico', desc: 'Cilindro de cerámica (aislante) que sirve de soporte a la película resistiva y disipa el calor.' },
    { id: 'tapas', name: 'Tapas metálicas', desc: 'Casquillos que hacen contacto con la película resistiva y a los que se sueldan los terminales.' },
    { id: 'terminales', name: 'Terminales (patas)', desc: 'Alambres de cobre estañado. La resistencia NO tiene polaridad: se puede conectar en cualquier sentido.' },
  ],
  theory: (
    <>
      <p>
        Una <strong>resistencia</strong> (o resistor) es un componente que <em>limita la corriente</em> que circula por un
        circuito. Su valor se mide en <strong>ohms (Ω)</strong>. Se usa, por ejemplo, para que un LED no se queme o para
        armar divisores de tensión.
      </p>
      <Formula>V = I × R &nbsp;→&nbsp; I = V / R</Formula>
      <h4>¿Cómo se lee el código de colores?</h4>
      <ol>
        <li>Poné la banda de tolerancia (dorada o plateada) a la derecha.</li>
        <li>Las primeras 2 bandas (o 3 en las de 5 bandas) son <strong>cifras</strong>.</li>
        <li>La siguiente es el <strong>multiplicador</strong>: la cantidad de ceros que se agregan.</li>
        <li>La última es la <strong>tolerancia</strong>: cuánto puede variar el valor real.</li>
      </ol>
      <p>
        Ejemplo: <em>rojo – rojo – marrón – dorado</em> = 2, 2, ×10 → <strong>220 Ω ± 5 %</strong>.
      </p>
      <ColorCodeTable />
      <h4>Potencia</h4>
      <p>
        Las resistencias se calientan. La potencia que disipan es <strong>P = V × I = I² × R</strong>. Las comunes de
        aula soportan <strong>¼ W</strong> (0,25 W); si se supera, se queman.
      </p>
      <p className="tip">Truco para recordar el orden de colores: “<strong>N</strong>i <strong>M</strong>e <strong>R</strong>ompas <strong>N</strong>ada <strong>A</strong>sí <strong>V</strong>a <strong>A</strong>l <strong>V</strong>iaje <strong>G</strong>ran <strong>B</strong>urro” (negro, marrón, rojo, naranja, amarillo, verde, azul, violeta, gris, blanco).</p>
    </>
  ),
  activities: [
    { id: 'res-1', type: 'mc', q: '¿En qué unidad se mide la resistencia eléctrica?', options: ['Voltios (V)', 'Amperes (A)', 'Ohms (Ω)', 'Watts (W)'], answer: 2, explain: 'La resistencia se mide en ohms, en honor a Georg Ohm.' },
    { id: 'res-2', type: 'mc', q: 'Una resistencia tiene las bandas marrón – negro – rojo – dorado. ¿Cuál es su valor?', options: ['100 Ω', '1 kΩ', '10 kΩ', '102 Ω'], answer: 1, explain: 'Marrón = 1, negro = 0, rojo = ×100 → 10 × 100 = 1000 Ω = 1 kΩ.' },
    { id: 'res-3', type: 'mc', q: 'Bandas amarillo – violeta – naranja – dorado:', options: ['4,7 kΩ', '47 kΩ', '470 Ω', '473 Ω'], answer: 1, explain: 'Amarillo = 4, violeta = 7, naranja = ×1000 → 47 000 Ω = 47 kΩ.' },
    { id: 'res-4', type: 'num', q: 'Por una resistencia de 220 Ω conectada a 5 V, ¿cuántos miliamperes (mA) circulan? (redondeá)', answer: 22.7, tolerance: 0.05, unit: 'mA', explain: 'I = V / R = 5 / 220 = 0,0227 A ≈ 22,7 mA.' },
    { id: 'res-5', type: 'mc', q: '¿La resistencia tiene polaridad?', options: ['Sí, la pata larga es el positivo', 'No, se puede conectar en cualquier sentido', 'Sí, la banda dorada marca el negativo'], answer: 1, explain: 'La resistencia no tiene polaridad.' },
    { id: 'res-6', type: 'mc', q: '¿Qué significa una banda de tolerancia dorada?', options: ['± 1 %', '± 5 %', '± 10 %', '± 20 %'], answer: 1, explain: 'Dorado = ± 5 %. Plateado = ± 10 %. Marrón = ± 1 %.' },
    { id: 'res-7', type: 'num', q: 'Una resistencia de 100 Ω tiene 5 V. ¿Qué potencia disipa en watts?', answer: 0.25, tolerance: 0.02, unit: 'W', explain: 'P = V² / R = 25 / 100 = 0,25 W. ¡Justo el límite de una resistencia de ¼ W!' },
  ],
}
