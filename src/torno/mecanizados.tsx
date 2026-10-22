import { useEffect, useRef, type ReactNode } from 'react'
import type { ComponentDef, Params, PartInfo } from '../catalog/types'
import { Formula, Readout, Segmented, Slider, Toggle } from '../components/ui'
import { MecanizadosModel, OP_DURATION, opReadouts, type MecParams, type OpId } from '../three/models/TornoMecanizados'

/** Como Field, pero sin <label> (un label con botones adentro "aprieta" el primero al tocar el título). */
function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      {children}
    </div>
  )
}

const OPS: { value: OpId; label: string; hint: string }[] = [
  { value: 'frenteado', label: 'Frenteado', hint: 'Desbaste frontal: la herramienta, centrada en altura, recorre la cara de la pieza avanzando hacia el eje (así se forma mejor la viruta y hay menos vibración). La pieza queda 3 mm más corta y con la cara limpia.' },
  { value: 'cilindrado', label: 'Cilindrado', hint: 'Desbaste lateral: el transversal da la penetración (profundidad de pasada) y el longitudinal avanza paralelo al eje. Fijate el escalón entre el tramo cortado y el bruto. Con el portainsertos a 90° del eje, el filo queda a κr ≈ 92–93°.' },
  { value: 'perforado', label: 'Perforado', hint: 'Primero la mecha de centrar marca el centro; después la broca, en el mandril clavado en el manguito, perfora en el eje. Se avanza con el volante de la contrapunta, que queda bloqueada sobre la bancada. La pieza gira; la broca no.' },
  { value: 'conico', label: 'Cono con charriot', hint: 'Se aflojan las tuercas de la base del charriot y se lo gira el ángulo del cono. La penetración se da con el transversal y el avance a mano con el charriot, siguiendo la generatriz del cono. La carrera es corta y la terminación algo imperfecta.' },
  { value: 'contrapunta', label: 'Cono con contrapunta', hint: 'Montaje entre puntas. Se corre lateralmente el cuerpo de la contrapunta (tornillos de registro y regla milimetrada): el eje de la pieza queda inclinado y la herramienta, que avanza paralela a la bancada, saca más material de un lado. Sirve para conos largos y poco pronunciados (desplazamiento exagerado en el dibujo).' },
  { value: 'ranurado', label: 'Ranurado / tronzado', hint: 'Una herramienta de perfil delgado penetra perpendicular al eje: el avance coincide con la penetración. Si llega al centro corta la pieza (tronzado).' },
  { value: 'roscado', label: 'Roscado', hint: 'Con la tuerca partida cerrada, la herramienta avanza un paso por cada vuelta y labra una hélice. Varias pasadas: se para, se retira con el transversal, se vuelve en contramarcha y se profundiza con el charriot "en flanco".' },
  { value: 'moleteado', label: 'Moleteado', hint: 'La moleta (dos ruedas con labrado cruzado) se aprieta contra la pieza y avanza: dibuja un grabado para mejorar el agarre. Es la única operación del torno que no saca viruta.' },
  { value: 'interior', label: 'Torneado interior', hint: 'Requiere un perforado previo para que entre la barra de interiores. Aquí la penetración es hacia afuera (agranda el diámetro) y el avance hacia el plato. Activá "Ver en corte" para mirar adentro.' },
]

function useLoop(params: Params, set: (p: Params) => void) {
  const pr = useRef(params)
  const st = useRef(set)
  pr.current = params
  st.current = set
  const hold = useRef(0)
  useEffect(() => {
    if (!params.play) return
    const dt = 0.05
    const id = window.setInterval(() => {
      const p = pr.current as MecParams
      if (p.progreso >= 100) {
        hold.current += dt
        if (hold.current > 1.4) {
          hold.current = 0
          st.current({ progreso: 0 })
        }
        return
      }
      const inc = (100 * dt * p.velocidad) / OP_DURATION[p.op]
      st.current({ progreso: Math.min(100, p.progreso + inc) })
    }, dt * 1000)
    return () => window.clearInterval(id)
  }, [params.play])
}

function MecControls({ params, set }: { params: Params; set: (p: Params) => void }) {
  const p = params as MecParams
  useLoop(params, set)
  const op = OPS.find((o) => o.value === p.op)!
  return (
    <>
      <Group label="Operación (del apunte)">
        <Segmented<OpId> value={p.op} options={OPS.map((o) => ({ value: o.value, label: o.label }))} onChange={(v) => set({ op: v, progreso: 0 })} />
      </Group>
      <p className="hint">{op.hint}</p>
      <Toggle label="Mecanizar (animación continua)" value={p.play} onChange={(play) => set({ play, ...(play ? { progreso: 0 } : {}) })} />
      <Slider label="Progreso" value={Math.round(p.progreso)} min={0} max={100} onChange={(progreso) => set({ progreso, play: false })} format={(v) => `${v} %`} />
      <Group label="Velocidad de la animación">
        <Segmented<number>
          value={p.velocidad}
          options={[
            { value: 0.5, label: '×0,5' },
            { value: 1, label: '×1' },
            { value: 2, label: '×2' },
          ]}
          onChange={(velocidad) => set({ velocidad })}
        />
      </Group>
      {p.op === 'conico' && <Slider label="Giro del charriot α" value={p.angulo} min={5} max={25} onChange={(angulo) => set({ angulo, progreso: 0 })} format={(v) => `${v}°`} />}
      {p.op === 'ranurado' && <Toggle label="Llegar al centro (tronzar)" value={p.tronzar} onChange={(tronzar) => set({ tronzar, progreso: 0 })} />}
      {(p.op === 'perforado' || p.op === 'interior') && <Toggle label="Ver en corte (sacar un cuarto)" value={p.corte} onChange={(corte) => set({ corte })} />}
      <Toggle label="Flechas de los movimientos" value={p.flechas} onChange={(flechas) => set({ flechas })} />
      {opReadouts(p).map(([l, v]) => (
        <Readout key={l} label={l} value={v} />
      ))}
      {p.op === 'contrapunta' && <Formula>e = (Ø mayor − Ø menor) × largo total / (largo del cono × 2)</Formula>}
      {p.op === 'roscado' && <Formula>β = 90° − α/2 → métrica (60°): β = 60° · Whitworth (55°): β = 62° 30′</Formula>}
    </>
  )
}

const TOOL_NAME: Record<OpId, [string, string]> = {
  frenteado: ['Portainsertos (plaquita rómbica)', 'Cuerpo con plaquita de metal duro. Al frentear, el filo forma un ángulo chico contra la cara; conviene avanzar hacia el eje.'],
  cilindrado: ['Portainsertos de cilindrar', 'Colocado perpendicular al eje: entre el cuerpo y el apoyo de la plaquita hay 2 o 3° de diferencia, así el filo queda a 92–93° de la superficie.'],
  perforado: ['Mecha de centrar / broca', 'Primero la mecha de centrar (cono de 60°) y después la broca helicoidal. No giran: la que gira es la pieza.'],
  conico: ['Portainsertos', 'Va en la torre, que gira junto con el charriot: la punta avanza siguiendo la generatriz del cono.'],
  contrapunta: ['Portainsertos de cilindrar', 'Avanza paralelo a la bancada, como en un cilindrado común: el cono lo produce la contrapunta corrida.'],
  ranurado: ['Herramienta de ranurar / tronzar', 'Cuchilla delgada con inserto: su filo principal es el frontal. Trabajarla de costado le agrega esfuerzos.'],
  roscado: ['Herramienta de roscar 60°', 'Plaquita con el perfil del filete métrico, perfectamente centrada y perpendicular a la pieza.'],
  moleteado: ['Moleta de dos ruedas', 'Dos ruedas labradas en sentidos opuestos que giran arrastradas por la pieza y dejan un grabado cruzado.'],
  interior: ['Barra de interiores', 'Barra larga y de formato especial con una plaquita chica en la punta; entra en el agujero previamente perforado.'],
}

const mecParts = (p: Params): PartInfo[] => {
  const op = p.op as OpId
  const [tn, td] = TOOL_NAME[op]
  const list: PartInfo[] = [
    {
      id: 'pieza',
      name: 'Pieza',
      desc:
        op === 'contrapunta'
          ? 'Barra con agujeros de centro en ambas puntas, montada entre puntas: su eje queda inclinado por el desplazamiento de la contrapunta.'
          : op === 'interior'
            ? 'Pieza ya perforada con broca: la barra de interiores agranda el agujero. En rojo, el corte del material.'
            : 'Barra de acero que gira con el plato (movimiento de corte). El tramo brillante es el que ya mecanizó la herramienta.',
    },
    { id: 'herramienta', name: tn, desc: td },
    op === 'contrapunta'
      ? { id: 'plato', name: 'Plato liso, perno y punto', desc: 'En el husillo va el punto y el plato liso; su perno empuja la brida y hace girar la pieza.' }
      : { id: 'plato', name: 'Plato universal de 3 mordazas', desc: 'Sujeta y centra la pieza; gira con el husillo.' },
  ]
  if (op === 'contrapunta') {
    list.push({ id: 'brida', name: 'Brida (perro) de arrastre', desc: 'Apretada sobre la pieza; su cola es empujada por el perno del plato liso.' })
    list.push({ id: 'punto', name: 'Punto giratorio', desc: 'En el manguito de la contrapunta corrida: su eje sigue paralelo al del torno, pero desplazado.' })
  }
  if (op === 'perforado' || op === 'contrapunta')
    list.push({
      id: 'contrapunta',
      name: op === 'contrapunta' ? 'Contrapunta (corrida lateralmente)' : 'Contrapunta',
      desc: op === 'contrapunta' ? 'El cuerpo se corre sobre su base con los tornillos de registro laterales, según la regla milimetrada de atrás.' : 'Bloqueada sobre la bancada; su volante saca el manguito y empuja el mandril con la herramienta.',
    })
  if (op === 'perforado') list.push({ id: 'mandril', name: 'Mandril portabrocas', desc: 'Clavado por su cono Morse en el agujero cónico del manguito; aprieta la mecha con sus tres mordazas.' })
  if (op !== 'perforado') list.push({ id: 'torre', name: 'Torre portaherramientas', desc: 'Sujeta la herramienta con la punta a la altura del eje de la pieza.' })
  list.push({
    id: 'carro',
    name: 'Carros (longitudinal, transversal y charriot)',
    desc:
      op === 'conico'
        ? 'El charriot está girado el ángulo del cono: se avanza a mano con su volante.'
        : op === 'roscado'
          ? 'El longitudinal lo mueve el tornillo patrón (tuerca partida cerrada); el charriot, girado a 60°, da la penetración en flanco.'
          : 'El longitudinal da el avance paralelo al eje; el transversal, la penetración; el charriot, ajustes finos y conos.',
  })
  if (op !== 'moleteado') list.push({ id: 'viruta', name: 'Viruta', desc: 'Material arrancado por el filo. Nunca se toca con la mano: se saca con gancho o pincel y con el torno parado.' })
  list.push({ id: 'bancada', name: 'Bancada y cabezal', desc: 'Tramo de la bancada con sus guías y el cabezal fijo con el husillo.' })
  return list
}

export const mecanizados: ComponentDef = {
  id: 'mecanizados',
  name: 'Mecanizados en el torno',
  category: 'Mecanizados',
  icon: '🌀',
  short: 'Frenteado, cilindrado, perforado, conos, ranurado y tronzado, roscado, moleteado y torneado interior, animados paso a paso.',
  camera: [0.6, 4.5, 3.0],
  target: [0.3, 1.75, 0.1],
  shadowY: -2.82,
  defaultParams: { op: 'cilindrado', play: true, progreso: 0, velocidad: 1, angulo: 15, tronzar: true, corte: true, flechas: true } satisfies MecParams,
  render: (p) => <MecanizadosModel {...(p as MecParams)} />,
  Controls: MecControls,
  parts: mecParts,
  theory: (
    <>
      <p>
        En el torno siempre se obtienen <strong>volúmenes de revolución</strong>: cilindros, conos, perforados en el eje, ranuras, roscas y torneados interiores.
        Como primera medida, la herramienta debe estar <strong>perfectamente centrada en altura</strong> (en algunas operaciones se admite levemente por arriba).
        Para centrarla se usa de referencia un punto en la contrapunta, un calibre con la altura del eje sobre la bancada, o se hace tangencia en el frente del
        material girando.
      </p>
      <p>En todas: el <strong>movimiento de corte</strong> es el giro de la pieza; el <strong>avance</strong> y la <strong>penetración</strong> los dan los carros.</p>
      <h4>Frenteado (desbaste frontal)</h4>
      <p>
        Limpia el frente de la pieza. El cuerpo de la herramienta y el filo principal deben formar un ángulo pequeño contra la cara. Conviene un ángulo de
        entrada cercano a 90° y <strong>avanzar hacia el eje</strong>: mejora la viruta y reduce el riesgo de vibración.
      </p>
      <h4>Cilindrado (desbaste lateral)</h4>
      <p>
        Penetración perpendicular al eje con el <strong>carro transversal</strong> y avance paralelo al eje con el <strong>longitudinal</strong>. Se recomienda que
        el filo forme con la superficie un ángulo levemente mayor a 90° (<strong>κr ≈ 92–93°</strong>): se logra poniendo el portainsertos perpendicular al eje.
      </p>
      <h4>Perforado</h4>
      <p>
        En la cara frontal, en la dirección del eje: gira el plato con el material y la broca, en el <strong>mandril portabrocas</strong> clavado en el manguito,
        entra con el volante de la contrapunta, que queda <strong>bloqueada sobre la bancada</strong>. Antes se marca el centro con la mecha de centrar. Para
        diámetros grandes hay brocas de cola cónica.
      </p>
      <h4>Desbaste cónico con el charriot</h4>
      <p>
        Se aflojan las tuercas de adelante y de atrás de la base del charriot y se lo gira el ángulo del cono sobre el carro transversal. Se avanza con el charriot
        en lugar del longitudinal: sólo <strong>a mano</strong>, con terminación algo imperfecta y carrera limitada.
      </p>
      <h4>Cono desplazando la contrapunta</h4>
      <p>
        Para conos largos y poco pronunciados, sólo en <strong>montaje entre puntas</strong>: se corre el cuerpo de la contrapunta con los tornillos de registro
        laterales. El eje de la pieza queda desalineado y el longitudinal, que va paralelo a la bancada, desbasta más en un extremo.
      </p>
      <Formula>Desplazamiento = (Ø mayor − Ø menor) × largo total / (largo del cono × 2)</Formula>
      <p>Ejemplo del apunte: (100 − 80) × 300 / (200 × 2) = 15 mm.</p>
      <h4>Ranurado y tronzado</h4>
      <p>
        Una herramienta de perfil delgado penetra perpendicular al eje; el avance coincide con la penetración. Si la ranura es más ancha que la herramienta se
        desplaza paralela al eje, con cuidado: el filo principal es el frontal. Si llega al centro corta la pieza: <strong>tronzado</strong>.
      </p>
      <h4>Roscado</h4>
      <p>
        La pieza gira a pocas rpm y la herramienta de perfil (60° métrica, 55° Whitworth) avanza paralela al eje labrando una hélice: el{' '}
        <strong>avance es igual al paso</strong> (tuerca partida cerrada sobre el tornillo patrón). Si el filete es profundo se penetra con el charriot{' '}
        <strong>en flanco</strong>, inclinado:
      </p>
      <Formula>β = 90° − α/2 (métrica: 60° · Whitworth: 62° 30′)</Formula>
      <p>
        Se hace tangencia y se ponen los nonios en cero; al final de cada pasada se para sin abrir la tuerca, se retira con el transversal, se vuelve en
        contramarcha, se recupera el cero y se profundiza una o dos décimas con el charriot. Profundidad métrica: h ≈ 0,6134 × P.
      </p>
      <h4>Moleteado</h4>
      <p>
        Es la <strong>única operación del torno que no desprende viruta</strong>: una o dos ruedas labradas comprimen la superficie y dejan un grabado para que
        no se deslice al agarrarla.
      </p>
      <h4>Torneados interiores</h4>
      <p>
        Todas las operaciones exteriores (menos el moleteado) se pueden hacer adentro, pero antes la pieza <strong>debe estar perforada</strong> para que entre la
        herramienta, que suele ser larga y de formato especial (barra de interiores).
      </p>
    </>
  ),
  activities: [
    { id: 'mec-1', type: 'mc', q: '¿En qué dirección conviene avanzar al frentear?', options: ['Desde el centro hacia afuera', 'Hacia el eje de la pieza', 'Paralelo al eje', 'Da lo mismo'], answer: 1, explain: 'El apunte recomienda avanzar hacia el eje: mejor formación de viruta y menos vibración.' },
    { id: 'mec-2', type: 'num', q: 'En el cilindrado, ¿cuántos grados (aprox.) se recomienda que forme el filo con la superficie de la pieza? (valor inferior del rango)', answer: 92, tolerance: 0.015, unit: '°', explain: 'Levemente mayor a 90°: entre 92° y 93°.' },
    { id: 'mec-3', type: 'mc', q: 'Al perforar en el torno, ¿con qué se hace avanzar la broca?', options: ['Con el carro longitudinal', 'Con el volante de la contrapunta, bloqueada en la bancada', 'Con el charriot', 'Con el tornillo patrón'], answer: 1, explain: 'El mandril va en el manguito y se introduce con el volante de la contrapunta, que queda bloqueada.' },
    { id: 'mec-4', type: 'num', q: 'Calculá el desplazamiento de la contrapunta: Ø mayor 100 mm, Ø menor 80 mm, largo del cono 200 mm, distancia entre puntas 300 mm.', answer: 15, tolerance: 0.01, unit: 'mm', explain: '(100 − 80) × 300 / (200 × 2) = 15 mm.' },
    { id: 'mec-5', type: 'mc', q: '¿Cuál es el inconveniente del desbaste cónico con el charriot?', options: ['Sólo sirve entre puntas', 'Se avanza sólo a mano y con carrera limitada', 'No se puede inclinar', 'Necesita la tuerca partida'], answer: 1, explain: 'El charriot se mueve a mano, con carrera corta y terminación algo imperfecta.' },
    { id: 'mec-6', type: 'num', q: 'Rosca Whitworth (α = 55°): ¿cuántos grados se inclina el charriot? (β = 90° − α/2)', answer: 62.5, tolerance: 0.005, unit: '°', explain: 'β = 90 − 27,5 = 62,5° (62° 30′).' },
    { id: 'mec-7', type: 'mc', q: 'En el roscado, el avance por vuelta de la pieza es igual a…', options: ['La profundidad del filete', 'El paso de la rosca', 'El diámetro interior', 'Medio paso'], answer: 1, explain: 'fn = p: la herramienta avanza un paso por vuelta.' },
    { id: 'mec-8', type: 'mc', q: '¿Qué operación del torno no saca viruta?', options: ['Tronzado', 'Moleteado', 'Roscado', 'Torneado interior'], answer: 1, explain: 'La moleta comprime la superficie.' },
    { id: 'mec-9', type: 'mc', q: '¿Qué hace falta antes de un torneado interior?', options: ['Moletear la pieza', 'Perforarla para que entre la herramienta', 'Correr la contrapunta', 'Tronzarla'], answer: 1, explain: 'La pieza debe estar perforada previamente.' },
    { id: 'mec-10', type: 'mc', q: '¿Qué operación hace una herramienta de perfil delgado que penetra hasta el centro de la pieza?', options: ['Frenteado', 'Tronzado', 'Cilindrado', 'Moleteado'], answer: 1, explain: 'Al llegar al centro corta la pieza: tronzado.' },
  ],
}
