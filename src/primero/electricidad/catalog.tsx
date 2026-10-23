import type { ComponentDef } from '../../catalog/types'
import { Field, Formula, Readout, Segmented, Slider, Toggle } from '../../components/ui'
import { AtomoModel, atomParts, type AtomoParams } from '../../three/models/primero/Atomo'
import { CableModel, cableParts, FUNCION_INFO, TPR_COLORS, type CableParams, type Funcion } from '../../three/models/primero/Cable'
import { CircuitoModel, circuitoParts, solve, type CircuitoParams } from '../../three/models/primero/Circuito'
import { ELEMENTS, KIND_NAMES, SHELL_NAMES, shellsWithCharge } from './atoms'

const fmt = (n: number, d = 2) => (Number.isFinite(n) ? Number(n.toFixed(d)).toString().replace('.', ',') : '—')

/* ------------------------------------------------------------------ átomo */

function AtomoControls({ params, set }: { params: AtomoParams; set: (p: Partial<AtomoParams>) => void }) {
  const el = ELEMENTS.find((e) => e.sym === params.sym) ?? ELEMENTS[0]
  const shells = shellsWithCharge(el, params.charge)
  const electrons = shells.reduce((a, b) => a + b, 0)
  return (
    <>
      <Field label="Elemento">
        <select className="input" value={params.sym} onChange={(e) => set({ sym: e.target.value, charge: 0 })}>
          {ELEMENTS.map((e) => (
            <option key={e.sym} value={e.sym}>
              {e.name} ({e.sym}) · Z = {e.z}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Carga del átomo">
        <Segmented<number>
          value={params.charge}
          onChange={(charge) => set({ charge })}
          options={[
            { value: 1, label: 'Pierde 1 e⁻' },
            { value: 0, label: 'Neutro' },
            { value: -1, label: 'Gana 1 e⁻' },
          ]}
        />
      </Field>
      <Toggle label="Electrones girando" value={params.spin} onChange={(spin) => set({ spin })} />
      <Readout label="Protones (+)" value={el.z} />
      <Readout label="Electrones (−)" value={electrons} />
      <Readout label="Neutrones" value={el.n} />
      <Readout label="Capas" value={shells.map((n, i) => `${SHELL_NAMES[i]}: ${n}`).join(' · ')} />
      <Readout label="Electrones de valencia" value={shells[shells.length - 1]} />
      <Readout
        label="El átomo es"
        value={params.charge === 0 ? 'neutro' : params.charge > 0 ? 'un ion positivo (catión)' : 'un ion negativo (anión)'}
      />
      <p className="hint">
        {el.note} Tipo: <b>{KIND_NAMES[el.kind]}</b>.
      </p>
    </>
  )
}

const atomo: ComponentDef = {
  id: 'atomo',
  name: 'El átomo',
  category: 'La materia',
  icon: '⚛️',
  short: 'Núcleo con protones y neutrones, y electrones en capas K, L, M y N. Elegí el elemento y mirá sus electrones de valencia.',
  parts: (p) => atomParts(p as AtomoParams),
  camera: [0, 5.5, 8.5],
  target: [0, 0, 0],
  shadowY: -3.6,
  defaultParams: { sym: 'Cu', charge: 0, spin: true },
  render: (p) => <AtomoModel {...(p as AtomoParams)} />,
  Controls: AtomoControls as ComponentDef['Controls'],
  theory: (
    <>
      <p>
        El <b>átomo</b> es la parte más pequeña de la materia que conserva las propiedades de un elemento químico. Tiene un{' '}
        <b>núcleo</b> con <b>protones</b> (carga positiva) y <b>neutrones</b> (sin carga), y alrededor se mueven los <b>electrones</b>{' '}
        (carga negativa).
      </p>
      <p>
        Si tiene tantos protones como electrones es <b>neutro</b>. Si pierde o gana electrones se convierte en un <b>ion</b>: positivo
        si pierde, negativo si gana.
      </p>
      <p>
        Los electrones se ordenan en <b>capas</b>: K (hasta 2), L (hasta 8), M (hasta 18) y N (hasta 32). Los de la capa más externa son
        los <b>electrones de valencia</b>: participan en los enlaces y tienen mucha influencia en cómo conduce un material.
      </p>
    </>
  ),
  activities: [
    { id: 'e1-at-1', type: 'mc', q: '¿Qué carga tiene el protón?', options: ['Positiva (+)', 'Negativa (−)', 'No tiene carga', 'Depende del átomo'], answer: 0, explain: 'Protón +, electrón −, neutrón sin carga.' },
    { id: 'e1-at-2', type: 'mc', q: '¿Dónde están los protones y los neutrones?', options: ['En el núcleo', 'En la capa K', 'En la capa de valencia', 'Girando alrededor del núcleo'], answer: 0, explain: 'El núcleo tiene protones y neutrones; los electrones están afuera, en capas.' },
    { id: 'e1-at-3', type: 'num', q: '¿Cuántos electrones entran, como máximo, en la capa L?', answer: 8, tolerance: 0, unit: 'electrones', explain: 'K: 2, L: 8, M: 18, N: 32.' },
    { id: 'e1-at-4', type: 'num', q: 'El cobre tiene 29 electrones repartidos en K, L, M y N. ¿Cuántos tiene en la capa N (de valencia)?', answer: 1, tolerance: 0, unit: 'electrones', explain: '29 = 2 + 8 + 18 + 1: un solo electrón de valencia, poco ligado. Por eso conduce tan bien.' },
    { id: 'e1-at-5', type: 'mc', q: 'Un átomo neutro pierde un electrón. ¿Qué pasa?', options: ['Se convierte en un ion positivo', 'Se convierte en un ion negativo', 'Sigue neutro', 'Pierde un protón también'], answer: 0, explain: 'Queda con un protón de más que electrones: carga total positiva.' },
  ],
}

/* ------------------------------------------------------------------ cable */

function CableControls({ params, set }: { params: CableParams; set: (p: Partial<CableParams>) => void }) {
  const secciones = [1, 1.5, 2.5, 4, 6, 10]
  return (
    <>
      <Field label="Tipo de cable">
        <select className="input" value={params.tipo} onChange={(e) => set({ tipo: e.target.value as CableParams['tipo'] })}>
          <option value="unipolar">Unipolar con aislación básica</option>
          <option value="tpr">TPR (taller pesado reforzado), varios conductores</option>
          <option value="desnudo">Desnudo (sin aislación)</option>
          <option value="esmaltado">Alambre esmaltado</option>
        </select>
      </Field>
      {params.tipo === 'tpr' && (
        <Field label="Cantidad de conductores">
          <Segmented<number>
            value={params.conductores}
            onChange={(conductores) => set({ conductores })}
            options={[
              { value: 2, label: 'Bipolar' },
              { value: 3, label: 'Tripolar' },
              { value: 4, label: 'Tetrapolar' },
              { value: 5, label: 'Pentapolar' },
            ]}
          />
        </Field>
      )}
      {params.tipo === 'unipolar' && (
        <Field label="Función (color)">
          <select className="input" value={params.funcion} onChange={(e) => set({ funcion: e.target.value as Funcion })}>
            {(Object.keys(FUNCION_INFO) as Funcion[]).map((f) => (
              <option key={f} value={f}>
                {FUNCION_INFO[f].name} · corriente {FUNCION_INFO[f].corriente}
              </option>
            ))}
          </select>
        </Field>
      )}
      {params.tipo !== 'esmaltado' && (
        <Field label="Hebras">
          <Segmented<'unifilar' | 'multifilar'>
            value={params.hebras}
            onChange={(hebras) => set({ hebras })}
            options={[
              { value: 'unifilar', label: 'Unifilar (alambre)' },
              { value: 'multifilar', label: 'Multifilar' },
            ]}
          />
        </Field>
      )}
      <Field label={`Sección: ${String(params.seccion).replace('.', ',')} mm²`}>
        <input type="range" min={0} max={secciones.length - 1} value={Math.max(0, secciones.indexOf(params.seccion))} onChange={(e) => set({ seccion: secciones[Number(e.target.value)] })} />
      </Field>
      {(params.tipo === 'unipolar' || params.tipo === 'tpr') && (
        <Field label="Aislación">
          <Segmented<CableParams['aislacion']>
            value={params.aislacion}
            onChange={(aislacion) => set({ aislacion })}
            options={[
              { value: 'pvc', label: 'PVC' },
              { value: 'silicona', label: 'Silicona' },
              { value: 'goma', label: 'Goma (EPR)' },
            ]}
          />
        </Field>
      )}
      <Readout label="Diámetro del cobre" value={`${fmt(2 * Math.sqrt(params.seccion / Math.PI), 2)} mm`} />
      {params.tipo === 'tpr' && <p className="hint">Colores: {TPR_COLORS[params.conductores].map((c) => c.name).join(', ')}.</p>}
      {params.tipo === 'unipolar' && (
        <p className="hint">
          Se usa en corriente {FUNCION_INFO[params.funcion].corriente} como <b>{FUNCION_INFO[params.funcion].name.toLowerCase()}</b>.
        </p>
      )}
    </>
  )
}

const cable: ComponentDef = {
  id: 'cable',
  name: 'Cables eléctricos',
  category: 'Cables',
  icon: '🧵',
  short: 'Unipolar, TPR, desnudo o esmaltado. Cambiá la cantidad de conductores, las hebras, la sección y la aislación.',
  parts: (p) => cableParts(p as CableParams),
  camera: [14, 20, 58],
  target: [-6, 0, 0],
  shadowY: -9,
  defaultParams: { tipo: 'tpr', conductores: 3, hebras: 'multifilar', seccion: 2.5, funcion: 'fase', aislacion: 'pvc' },
  render: (p) => <CableModel {...(p as CableParams)} />,
  Controls: CableControls as ComponentDef['Controls'],
  theory: (
    <>
      <p>
        Un <b>cable eléctrico</b> es una manguera de material aislante y protector que contiene uno o varios conductores aislados,
        generalmente de <b>cobre</b> o <b>aluminio</b>.
      </p>
      <ul>
        <li>
          <b>Por el color</b> (corriente alterna): marrón = fase, celeste = neutro, verde y amarillo = tierra, blanco = retorno. En
          continua: rojo = positivo, negro = negativo.
        </li>
        <li>
          <b>Por la cantidad de conductores</b>: unipolar, bipolar, tripolar, tetrapolar, pentapolar. (En realidad un cable no tiene
          polos: tiene conductores).
        </li>
        <li>
          <b>Por las hebras</b>: unifilar (un alambre) o multifilar (muchas hebras, más flexible). A igual sección conducen lo mismo.
        </li>
        <li>
          <b>Por la sección</b>: en las casas, 1; 1,5; 2,5; 4; 6 y 10 mm².
        </li>
      </ul>
    </>
  ),
  activities: [
    { id: 'e1-cb-1', type: 'mc', q: 'En una instalación de corriente alterna, ¿de qué color es el neutro?', options: ['Celeste', 'Marrón', 'Verde y amarillo', 'Rojo'], answer: 0, explain: 'Neutro = celeste.' },
    { id: 'e1-cb-2', type: 'mc', q: '¿Qué color se usa para la puesta a tierra (PE)?', options: ['Verde y amarillo', 'Negro', 'Blanco', 'Celeste'], answer: 0, explain: 'La tierra siempre es verde y amarillo.' },
    { id: 'e1-cb-3', type: 'mc', q: '¿Qué ventaja tiene un cable multifilar frente a uno unifilar de la misma sección?', options: ['Es más flexible', 'Conduce el doble de corriente', 'No necesita aislación', 'Es más barato siempre'], answer: 0, explain: 'A igual sección conducen prácticamente lo mismo; el multifilar es más flexible.' },
    { id: 'e1-cb-4', type: 'mc', q: '¿Para qué se usa el alambre esmaltado?', options: ['Para bobinas de motores, transformadores y relés', 'Para la puesta a tierra', 'Para alargues', 'Para cables enterrados'], answer: 0, explain: 'El esmalte es una capa finísima de barniz: permite enrollar muchas vueltas juntas.' },
    { id: 'e1-cb-5', type: 'mc', q: 'Un cable para alargues y herramientas portátiles, con cubierta reforzada, es…', options: ['TPR (taller pesado reforzado)', 'Desnudo', 'Esmaltado', 'Sumergible'], answer: 0, explain: 'El TPR es flexible y tiene una vaina resistente a golpes.' },
  ],
}

/* ------------------------------------------------------------------ circuito */

function CircuitoControls({ params, set }: { params: CircuitoParams; set: (p: Partial<CircuitoParams>) => void }) {
  const s = solve(params)
  return (
    <>
      <Field label="Circuito">
        <Segmented<CircuitoParams['modo']>
          value={params.modo}
          onChange={(modo) => set({ modo })}
          options={[
            { value: 'una', label: 'Una lámpara' },
            { value: 'serie', label: 'Serie' },
            { value: 'paralelo', label: 'Paralelo' },
          ]}
        />
      </Field>
      <Toggle label="Interruptor cerrado" value={params.cerrado} onChange={(cerrado) => set({ cerrado })} />
      <Slider label="Tensión de la pila U" value={params.u} min={1.5} max={24} step={1.5} onChange={(u) => set({ u })} format={(x) => `${fmt(x, 1)} V`} />
      <Slider label={params.modo === 'una' ? 'Resistencia R' : 'Resistencia R1'} value={params.r1} min={10} max={200} step={5} onChange={(r1) => set({ r1 })} format={(x) => `${x} Ω`} />
      {params.modo !== 'una' && <Slider label="Resistencia R2" value={params.r2} min={10} max={200} step={5} onChange={(r2) => set({ r2 })} format={(x) => `${x} Ω`} />}
      <Readout label="Resistencia equivalente" value={`${fmt(s.req, 1)} Ω`} />
      <Readout label="Corriente total I" value={params.cerrado ? `${fmt(s.i * 1000, 0)} mA` : '0 (circuito abierto)'} />
      {params.modo !== 'una' && params.cerrado && (
        <>
          <Readout label="En R1" value={`${fmt(s.u1, 2)} V · ${fmt(s.i1 * 1000, 0)} mA`} />
          <Readout label="En R2" value={`${fmt(s.u2, 2)} V · ${fmt(s.i2 * 1000, 0)} mA`} />
        </>
      )}
      <Formula>
        {params.modo === 'una' && <>I = U / R = {fmt(params.u, 1)} V / {params.r1} Ω</>}
        {params.modo === 'serie' && <>Req = R1 + R2 = {params.r1} + {params.r2} = {fmt(s.req, 1)} Ω</>}
        {params.modo === 'paralelo' && (
          <>
            Req = R1·R2 / (R1+R2) = {params.r1}·{params.r2} / {params.r1 + params.r2} = {fmt(s.req, 1)} Ω
          </>
        )}
      </Formula>
    </>
  )
}

const circuito: ComponentDef = {
  id: 'circuito',
  name: 'Circuito con lámparas',
  category: 'Circuitos',
  icon: '💡',
  short: 'Pila, interruptor y lámparas: una sola, en serie o en paralelo. Cambiá la tensión y las resistencias y mirá los electrones moverse.',
  parts: (p) => circuitoParts(p as CircuitoParams),
  camera: [0, 9, 9],
  target: [0, 0.4, 0],
  shadowY: -0.32,
  defaultParams: { modo: 'serie', u: 9, r1: 40, r2: 40, cerrado: true },
  render: (p) => <CircuitoModel {...(p as CircuitoParams)} />,
  Controls: CircuitoControls as ComponentDef['Controls'],
  theory: (
    <>
      <p>
        Un <b>circuito</b> es un camino cerrado por donde circulan los electrones: sale del borne negativo de la pila, pasa por las cargas
        (las lámparas) y vuelve al positivo. Si el interruptor está abierto, el camino se corta y no hay corriente.
      </p>
      <p>
        En <b>serie</b> la corriente es la misma en todas las lámparas y la tensión se reparte: Req = R1 + R2. En <b>paralelo</b> todas
        reciben la misma tensión y la corriente se reparte: Req = R1·R2 / (R1 + R2).
      </p>
      <p>Probá: en serie, ¿qué pasa con el brillo si agregás resistencia? ¿Y en paralelo?</p>
    </>
  ),
  activities: [
    { id: 'e1-ci-1', type: 'num', q: 'Una lámpara de 30 Ω se conecta a una pila de 9 V. ¿Qué corriente circula? (en A)', answer: 0.3, tolerance: 0.01, unit: 'A', explain: 'I = U / R = 9 / 30 = 0,3 A.' },
    { id: 'e1-ci-2', type: 'num', q: 'Dos lámparas de 40 Ω y 20 Ω en serie. ¿Cuál es la resistencia equivalente?', answer: 60, tolerance: 0, unit: 'Ω', explain: 'En serie se suman: 40 + 20 = 60 Ω.' },
    { id: 'e1-ci-3', type: 'num', q: 'Dos lámparas de 60 Ω en paralelo. ¿Cuál es la resistencia equivalente?', answer: 30, tolerance: 0, unit: 'Ω', explain: 'R1·R2/(R1+R2) = 3600/120 = 30 Ω. Dos iguales en paralelo: la mitad.' },
    { id: 'e1-ci-4', type: 'mc', q: 'En un circuito en serie se quema una lámpara. ¿Qué pasa con la otra?', options: ['Se apaga: el circuito queda abierto', 'Brilla más', 'Sigue igual', 'Se quema también'], answer: 0, explain: 'En serie hay un solo camino: si se corta, no circula corriente por ninguna.' },
    { id: 'e1-ci-5', type: 'mc', q: 'En un circuito en paralelo, ¿qué es igual para todas las lámparas?', options: ['La tensión', 'La corriente', 'La resistencia', 'La potencia'], answer: 0, explain: 'En paralelo todas quedan conectadas a la misma tensión de la pila.' },
  ],
}

export const ELECTRICIDAD1_CATALOG: ComponentDef[] = [atomo, cable, circuito]
