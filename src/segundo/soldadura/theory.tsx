import { useState } from 'react'
import type { Topic } from '../../data/theory'
import { Field, Formula, Readout, Segmented, Slider } from '../../components/ui'
import { SubLink } from '../../lib/nav'
import { filtroDin, recomendada } from '../../three/models/segundo/Soldadura'
import './s2.css'

const fmt = (n: number, d = 2) => (Number.isFinite(n) ? Number(n.toFixed(d)).toString().replace('.', ',') : '—')

/* ------------------------------------------------------------------ tablas del apunte */

/** Chapas de acero laminadas en frío: calibre, espesor (mm), peso (kg/m²). */
export const CHAPAS_FRIO: [number, number, number][] = [
  [12, 2.5, 19.8],
  [14, 2.0, 15.84],
  [16, 1.6, 12.6],
  [18, 1.25, 9.9],
  [19, 1.07, 8.47],
  [20, 0.9, 7.12],
  [21, 0.8, 6.35],
  [22, 0.7, 5.54],
  [23, 0.65, 5.15],
  [24, 0.56, 4.35],
  [25, 0.5, 3.96],
  [26, 0.45, 3.56],
  [27, 0.4, 3.16],
  [28, 0.35, 2.77],
  [30, 0.3, 2.38],
]

/** Chapas laminadas en caliente: pulgadas, espesor (mm), peso (kg/m²). */
export const CHAPAS_CALIENTE: [string, number, number][] = [
  ['1/16"', 1.6, 12.6],
  ['—', 2.0, 15.84],
  ['—', 2.5, 19.8],
  ['—', 2.8, 22.17],
  ['1/8"', 3.2, 25.32],
  ['5/32"', 4.0, 31.7],
  ['3/16"', 4.75, 37.7],
  ['1/4"', 6.35, 50.24],
  ['5/16"', 8.0, 62.8],
  ['3/8"', 9.5, 75.36],
  ['7/16"', 11.11, 88.0],
  ['1/2"', 12.7, 100.5],
  ['9/16"', 14.3, 113.05],
  ['5/8"', 15.8, 125.6],
  ['3/4"', 19.05, 150.7],
  ['7/8"', 22.2, 175.85],
  ['1"', 25.4, 201.0],
]

/* ------------------------------------------------------------------ simuladores */

function Intensidad() {
  const [d, setD] = useState(2.5)
  const [lo, hi] = recomendada(d)
  return (
    <div className="calc">
      <Field label="Diámetro del electrodo">
        <Segmented<number> value={d} onChange={setD} options={[2, 2.5, 3.25, 4, 5].map((x) => ({ value: x, label: `${fmt(x)} mm` }))} />
      </Field>
      <Formula>
        {fmt(d)} mm × 35 A = {fmt(lo, 1)} A · {fmt(d)} mm × 40 A = {fmt(hi, 1)} A
      </Formula>
      <Readout label="Regulá la máquina entre" value={`${Math.round(lo)} y ${Math.round(hi)} A`} />
      <Readout label="Filtro de la máscara" value={`DIN ${filtroDin(lo).din}${filtroDin(hi).din !== filtroDin(lo).din ? ` a ${filtroDin(hi).din}` : ''}`} />
    </div>
  )
}

function Filtro() {
  const [a, setA] = useState(100)
  const f = filtroDin(a)
  return (
    <div className="calc">
      <Slider label="Intensidad" value={a} min={40} max={499} step={1} onChange={setA} format={(x) => `${x} A`} />
      <div className="s2-glass" style={{ background: `rgba(10, 60, 30, ${0.45 + (f.din - 10) * 0.15})` }}>
        <span>DIN {f.din}</span>
      </div>
      <Readout label="Rango" value={f.rango} />
    </div>
  )
}

function PesoChapa() {
  const [k, setK] = useState(4)
  const [ancho, setAncho] = useState(1)
  const [largo, setLargo] = useState(2)
  const [cal, mm, kg] = CHAPAS_FRIO[k]
  return (
    <div className="calc">
      <Field label="Chapa laminada en frío">
        <select className="input" value={k} onChange={(e) => setK(Number(e.target.value))}>
          {CHAPAS_FRIO.map(([c, e], i) => (
            <option key={c} value={i}>
              Calibre Nº {c} · {fmt(e)} mm
            </option>
          ))}
        </select>
      </Field>
      <Slider label="Ancho" value={ancho} min={0.25} max={1.5} step={0.05} onChange={setAncho} format={(x) => `${fmt(x)} m`} />
      <Slider label="Largo" value={largo} min={0.5} max={3} step={0.1} onChange={setLargo} format={(x) => `${fmt(x)} m`} />
      <Formula>
        Peso = {fmt(ancho)} m × {fmt(largo)} m × {fmt(kg)} kg/m²
      </Formula>
      <Readout label={`Chapa Nº ${cal} (${fmt(mm)} mm)`} value={`${fmt(ancho * largo * kg, 1)} kg`} />
    </div>
  )
}

/* ------------------------------------------------------------------ temas */

export const SOLDADURA2_TOPICS: Topic[] = [
  {
    id: 's2-seguridad',
    title: 'Normas de seguridad',
    icon: '⚠️',
    summary: 'Familiarización con el equipo, descargas eléctricas, radiaciones, humos, fuego y chispas.',
    content: (
      <>
        <p>
          La soldadura es segura cuando se toman las precauciones debidas. <b>Nunca</b> se usa un equipo sin haber recibido instrucciones completas sobre su
          manejo (<b>familiarización con el equipo</b>), y las recomendaciones del fabricante se siguen siempre. Ante una avería se avisa al responsable del
          sector: no se repara por iniciativa propia.
        </p>
        <h4>⚡ Las descargas eléctricas pueden causar la muerte</h4>
        <ol>
          <li>No tocar partes eléctricamente vivas.</li>
          <li>Usar ropa seca, guantes en buen estado y equipo de seguridad.</li>
          <li>Aislarse de la pieza y de tierra pisando superficies aislantes y secas.</li>
          <li>Desconectar la máquina antes de moverla o hacerle mantenimiento.</li>
          <li>Apagar el equipo cuando no se usa.</li>
          <li>Nunca usar cables rotos, dañados o de sección no recomendada.</li>
          <li>La pieza debe tener una buena conexión a tierra.</li>
          <li>No tocar el electrodo mientras está en contacto con la pieza.</li>
          <li>Usar sólo máquinas en buen estado; reparar o cambiar las piezas dañadas.</li>
          <li>Mantener las cubiertas de las máquinas en su lugar y atornilladas.</li>
        </ol>
        <h4>☀️ Las radiaciones queman ojos y piel; el ruido daña el oído</h4>
        <p>
          Careta con el filtro adecuado, lentes de seguridad, biombos o cortinas para proteger a los demás, ropa resistente a la llama (lana y cuero), zapatos
          industriales y protectores auditivos si hay mucho ruido.
        </p>
        <h4>💨 Humos y gases</h4>
        <p>
          Soldar con buena ventilación o con aspiración localizada. Mantener la cabeza lejos de los humos. No soldar cerca de desengrasantes, limpiadores o
          aerosoles: con el calor y la radiación forman gases tóxicos.
        </p>
        <h4>🔥 Fuego y explosiones</h4>
        <p>
          No soldar donde las chispas alcancen materiales inflamables; alejarlos o cubrirlos. Mesas con ranuras para que caigan las chispas. Tener un{' '}
          <b>matafuego</b> a mano. Conectar la <b>pinza de masa lo más cerca posible</b> de la soldadura.
        </p>
        <h4>✨ Chispas y metal caliente</h4>
        <p>Usar protector facial o lentes al picar la escoria o amolar: una partícula puede lesionar gravemente un ojo.</p>
      </>
    ),
    activities: [
      { id: 's2-t1-1', type: 'mc', q: '¿Qué es la familiarización con el equipo?', options: ['Recibir instrucciones completas sobre su manejo antes de usarlo', 'Usarlo hasta aprender solo', 'Repararlo uno mismo', 'Leer la marca'], answer: 0, explain: 'Usarlo sin instrucciones puede causar accidentes serios.' },
      { id: 's2-t1-2', type: 'mc', q: 'La máquina tiene una avería. ¿Qué hacés?', options: ['Aviso al responsable del sector', 'La arreglo yo', 'Sigo soldando', 'Le pido a un compañero que la abra'], answer: 0, explain: 'La decisión es del responsable.' },
      { id: 's2-t1-3', type: 'mc', q: '¿Dónde se conecta la pinza de masa?', options: ['Lo más cerca posible de la zona de soldadura', 'Lo más lejos posible', 'En la mesa de al lado', 'En el piso'], answer: 0, explain: 'Así la corriente no recorre grandes distancias.' },
      { id: 's2-t1-4', type: 'mc', q: '¿Por qué no se suelda cerca de aerosoles o desengrasantes?', options: ['El calor y la radiación forman gases tóxicos o pueden explotar', 'Porque manchan', 'Porque enfrían la pieza', 'No hay problema'], answer: 0, explain: 'También pueden incendiarse.' },
      { id: 's2-t1-5', type: 'mc', q: '¿Qué ropa conviene para soldar?', options: ['De lana y cuero, resistente a la llama', 'De nailon', 'De poliéster', 'Cualquiera'], answer: 0, explain: 'Las fibras sintéticas se derriten.' },
    ],
  },
  {
    id: 's2-proteccion',
    title: 'Protección personal y de la vista',
    icon: '🥽',
    summary: 'Máscara, lentes, guantes, delantal y zapatos. Radiaciones invisibles y el filtro DIN adecuado.',
    content: (
      <>
        <p>
          El equipo básico: <b>máscara de soldar</b> (ojos, cara y cuello), <b>lentes de seguridad</b>, <b>guantes de cuero</b> de puño largo,{' '}
          <b>delantal de cuero</b> y <b>zapatos de seguridad</b> que cubran los tobillos. En vertical o sobre cabeza: cofia, polainas y mangas o casaca de
          cuero. Es de uso personal.
        </p>
        <h4>La vista</h4>
        <p>
          El arco produce luz y calor (que percibimos) y radiaciones <b>invisibles</b>: infrarrojos, ultravioleta y rayos X. Ante la luz intensa los ojos se
          cierran por reflejo, pero las radiaciones invisibles son más peligrosas: enrojecimiento, lagrimeo, dolor de cabeza y, con exposiciones repetidas,
          inflamación de la córnea, úlceras, quemaduras y la <b>catarata profesional</b>.
        </p>
        <p>
          Se usa un <b>vidrio inactínico</b> (filtro) adecuado, protegido por un vidrio transparente que se cambia cuando hace falta. Las máscaras tienen un
          visor de <b>105 × 50 mm</b>; las <b>fotosensibles</b> se oscurecen solas (tono regulable de 9 a 13) al encenderse el arco, así el soldador nunca
          mira el arco sin protección.
        </p>
        <Filtro />
        <p>
          <SubLink to="/componentes/epp">Ver el equipo en 3D</SubLink>.
        </p>
      </>
    ),
    activities: [
      { id: 's2-t2-1', type: 'mc', q: '¿Qué radiaciones del arco son invisibles?', options: ['Infrarrojos, ultravioleta y rayos X', 'Sólo la luz', 'El calor', 'Ninguna'], answer: 0, explain: 'Son las más peligrosas.' },
      { id: 's2-t2-2', type: 'mc', q: '¿Qué lesión pueden causar las exposiciones repetidas?', options: ['La catarata profesional', 'Miopía', 'Daltonismo', 'Ninguna'], answer: 0, explain: 'Por daños graves del cristalino.' },
      { id: 's2-t2-3', type: 'num', q: '¿Qué filtro DIN corresponde a 250 A?', answer: 12, tolerance: 0, unit: '', explain: '175 – 299 A → DIN 12.' },
      { id: 's2-t2-4', type: 'mc', q: '¿Qué ventaja tiene la máscara fotosensible?', options: ['El soldador nunca mira el arco sin protección', 'Es más barata', 'No necesita filtro', 'Es transparente siempre'], answer: 0, explain: 'Se oscurece sola al encender el arco.' },
    ],
  },
  {
    id: 's2-soldadura',
    title: 'Qué es soldar',
    icon: '🔥',
    summary: 'Definición e importancia de la soldadura.',
    content: (
      <>
        <p>
          <b>Soldar</b> es unir sólidamente y de manera permanente dos piezas metálicas (o dos partes de una misma pieza, al reparar una rotura) para que
          resistan los esfuerzos como si fueran una sola pieza. Casi siempre se logra <b>elevando la temperatura</b> de las superficies a unir y, si hace
          falta, del <b>material de aporte</b>.
        </p>
        <h4>Importancia</h4>
        <p>
          Las uniones soldadas bien proyectadas son <b>más livianas y resistentes</b> que las fijaciones con tornillos, remaches y, a veces, que las piezas
          fundidas. Además se usa para <b>reparar</b> y reconstruir piezas, rellenar zonas gastadas y aplicar capas duras que resisten la corrosión, la
          abrasión, los impactos y el desgaste.
        </p>
      </>
    ),
    activities: [
      { id: 's2-t3-1', type: 'mc', q: '¿Cómo es la unión soldada?', options: ['Sólida y permanente', 'Desmontable', 'Provisoria', 'Con tornillos'], answer: 0, explain: 'Como si fuera una sola pieza.' },
      { id: 's2-t3-2', type: 'mc', q: '¿Por qué se volvió tan importante?', options: ['Las uniones son más livianas y resistentes que con tornillos o remaches', 'Es más lenta', 'No necesita equipo', 'Sólo sirve para decorar'], answer: 0, explain: 'Y además sirve para reparar.' },
    ],
  },
  {
    id: 's2-proceso',
    title: 'Soldadura con electrodo revestido',
    icon: '〰️',
    summary: 'Características del proceso, el charco de fusión, el cordón y la escoria.',
    content: (
      <>
        <p>
          Es el proceso de soldadura por arco <b>más conocido y usado</b>: versátil, flexible, simple y de bajo costo. Sirve para reparación, fabricación y
          construcción, para casi cualquier espesor y en posiciones diversas.
        </p>
        <p>
          Como el electrodo es corto, se consume rápido: el soldador interrumpe para cambiarlo y tiene que <b>picar y limpiar</b> el punto de inicio. El arco
          funciona <b>menos de la mitad</b> del tiempo total, pero un soldador eficiente igual es muy productivo.
        </p>
        <h4>Cómo se forma el cordón</h4>
        <ol>
          <li>Con el arco encendido, la temperatura sube casi al instante entre la punta del electrodo y la pieza.</li>
          <li>El metal del electrodo se funde y es proyectado en gotitas hacia un pequeño cráter fundido: el <b>charco de fusión</b>.</li>
          <li>Al desplazar el electrodo, las gotas llenan el charco y, al solidificarse una junto a otra, forman el <b>cordón</b>.</li>
          <li>El revestimiento fundido flota sobre el metal y, al tomar contacto con el aire, forma la <b>escoria</b>.</li>
          <li>Cuando el cordón se enfría, la escoria se saca con la <b>piqueta</b> y se limpia con <b>cepillo de acero</b>.</li>
        </ol>
        <p>
          <SubLink to="/componentes/cordon">Probalo en el simulador del cordón</SubLink>.
        </p>
      </>
    ),
    activities: [
      { id: 's2-t4-1', type: 'mc', q: '¿Qué es el charco de fusión?', options: ['El cráter donde se mezclan el metal del electrodo y el de la pieza', 'El agua para enfriar', 'La escoria', 'El revestimiento'], answer: 0, explain: 'Al avanzar se va formando el cordón.' },
      { id: 's2-t4-2', type: 'mc', q: '¿Con qué se saca la escoria?', options: ['Piqueta y cepillo de acero', 'Lima', 'Tijera', 'Agua'], answer: 0, explain: 'Recién ahí se ve el cordón real.' },
      { id: 's2-t4-3', type: 'mc', q: '¿Qué parte del tiempo funciona el arco?', options: ['Menos de la mitad', 'Todo el tiempo', 'El 90 %', 'Nunca'], answer: 0, explain: 'Por los cambios de electrodo y la limpieza.' },
    ],
  },
  {
    id: 's2-arco',
    title: 'El arco eléctrico',
    icon: '⚡',
    summary: 'Unos 4000 °C a través de un gas ionizado. Pinzas y cables. Corriente alterna y continua.',
    content: (
      <>
        <p>
          El arco es la fuente de calor: una forma sencilla de producir mucho calor, unos <b>4000 °C</b>. Es una <b>descarga eléctrica entre dos electrodos a
          través de un gas ionizado</b>.
        </p>
        <p>
          El aire normalmente no conduce. Para encender el arco se hace un breve <b>contacto</b> entre el electrodo y la pieza (un cortocircuito): circula una
          gran corriente que calienta la punta del electrodo y la pieza. El revestimiento se funde y produce gases que se <b>ionizan</b> fácilmente; ese gas
          es el camino de la corriente y mantiene el arco al separar un poco el electrodo.
        </p>
        <h4>Pinzas y cables</h4>
        <ul>
          <li>
            <b>Pinza porta electrodo</b>: sujeta el electrodo con buen contacto eléctrico y aísla al soldador.
          </li>
          <li>
            <b>Pinza de masa</b>: cierra el circuito entre la máquina, la pieza y el electrodo.
          </li>
          <li>
            <b>Cables</b>: de sección adecuada a la intensidad.
          </li>
        </ul>
        <h4>Complemento: corriente alterna y continua</h4>
        <p className="hint">Esto no está desarrollado en el apunte, pero lo pregunta la guía de autoevaluación (pregunta 13).</p>
        <ul>
          <li>
            <b>Alterna (transformador)</b>: más simple, barata y robusta; casi no tiene soplo magnético; el arco es menos estable y no sirve con todos los
            electrodos.
          </li>
          <li>
            <b>Continua (rectificador o inverter)</b>: arco más estable y suave, se puede elegir la polaridad, sirve con todos los electrodos y en chapa fina;
            es más cara y puede tener soplo magnético.
          </li>
        </ul>
      </>
    ),
    activities: [
      { id: 's2-t5-1', type: 'mc', q: '¿Qué es el arco eléctrico?', options: ['Una descarga eléctrica a través de un gas ionizado', 'Una llama de gas', 'Un cable caliente', 'Una chispa de la amoladora'], answer: 0, explain: 'Entre el electrodo y la pieza.' },
      { id: 's2-t5-2', type: 'mc', q: '¿Cómo se enciende el arco?', options: ['Con un breve contacto entre electrodo y pieza', 'Con un encendedor', 'Acercando sin tocar', 'Con agua'], answer: 0, explain: 'Un cortocircuito momentáneo.' },
      { id: 's2-t5-3', type: 'mc', q: '¿Qué mantiene el arco encendido al separar el electrodo?', options: ['El gas ionizado del revestimiento', 'El aire frío', 'La escoria', 'El cable de masa'], answer: 0, explain: 'Es el camino de la corriente.' },
    ],
  },
  {
    id: 's2-electrodos',
    title: 'Electrodos: elección y diámetro',
    icon: '🥢',
    summary: 'Alma y revestimiento. Los cinco factores para elegir y de qué depende el diámetro.',
    content: (
      <>
        <p>
          El <b>alma</b> es una varilla de metal conductor (acero dulce para los aceros al carbono). El <b>revestimiento</b> le da las propiedades a cada tipo
          de electrodo. <SubLink to="/componentes/electrodo">Ver el electrodo en 3D</SubLink>.
        </p>
        <h4>Para elegir el electrodo se analiza:</h4>
        <ol>
          <li>La naturaleza del metal base.</li>
          <li>El espesor de la sección a soldar.</li>
          <li>El tipo de máquina disponible y la corriente que entrega.</li>
          <li>En qué posición o posiciones se soldará.</li>
          <li>El tipo de unión y la facilidad de fijación de la pieza.</li>
        </ol>
        <h4>El diámetro</h4>
        <p>
          Depende sobre todo del <b>espesor</b> de las piezas y de la <b>preparación de la junta</b>. No siempre conviene uno más grueso para más espesor: un
          electrodo grande calienta más la pieza y puede deformarla o perforarla. En una junta en V de varias pasadas, la primera se hace con un electrodo{' '}
          <b>más fino</b> (buena penetración en el vértice) y las siguientes con uno más grueso.
        </p>
      </>
    ),
    activities: [
      { id: 's2-t6-1', type: 'mc', q: '¿De qué depende principalmente el diámetro del electrodo?', options: ['Del espesor de las piezas y la preparación de la junta', 'Del color de la pieza', 'De la marca', 'De la hora'], answer: 0, explain: 'Factores principales.' },
      { id: 's2-t6-2', type: 'mc', q: 'En una junta en V de varias pasadas, la primera pasada se hace con…', options: ['Un electrodo de diámetro menor', 'El electrodo más grueso', 'Sin electrodo', 'Con soldadura de punto'], answer: 0, explain: 'Asegura penetración en el vértice.' },
      { id: 's2-t6-3', type: 'mc', q: '¿Cuál NO es un factor para elegir el electrodo?', options: ['El color del revestimiento', 'El metal base', 'La posición', 'La máquina disponible'], answer: 0, explain: 'Son: metal base, espesor, máquina, posición y unión.' },
    ],
  },
  {
    id: 's2-intensidad',
    title: 'La intensidad de corriente',
    icon: '🎛️',
    summary: '35 a 40 A por mm de diámetro. Qué pasa si está alta o baja y cuándo regularla.',
    content: (
      <>
        <p>
          La intensidad debe alcanzar para fundir el electrodo y la pieza. Depende del <b>diámetro</b> y del <b>revestimiento</b>; el fabricante indica en
          tablas el mínimo y el máximo.
        </p>
        <Formula>Regla práctica: 35 a 40 A por cada mm de diámetro</Formula>
        <Intensidad />
        <div className="s2-two">
          <div>
            <h4>Intensidad exagerada</h4>
            <ul>
              <li>Arco demasiado fuerte.</li>
              <li>Excesiva fusión: peligro de perforar.</li>
              <li>Depósito exagerado.</li>
              <li>Mordeduras al costado del cordón.</li>
              <li>Mucha salpicadura.</li>
              <li>Cordón muy irregular.</li>
            </ul>
          </div>
          <div>
            <h4>Intensidad baja</h4>
            <ul>
              <li>El arco se apaga fácilmente.</li>
              <li>Poca penetración.</li>
              <li>Depósito escaso.</li>
              <li>Falta de fusión: no se unen las piezas.</li>
              <li>Cordón muy fino e irregular.</li>
            </ul>
          </div>
        </div>
        <p>
          Se regula <b>cada vez</b> que se empieza un trabajo nuevo, se cambia el diámetro del electrodo o cambia la posición. Las máquinas actuales tienen
          regulación continua (manija o volante); las antiguas, por escalones.
        </p>
      </>
    ),
    activities: [
      { id: 's2-t7-1', type: 'num', q: 'Electrodo de 2,5 mm: ¿intensidad mínima con 35 A/mm? (A)', answer: 87.5, tolerance: 0.01, unit: 'A', explain: '2,5 × 35 = 87,5 A.' },
      { id: 's2-t7-2', type: 'num', q: 'Electrodo de 4 mm: ¿intensidad máxima con 40 A/mm? (A)', answer: 160, tolerance: 0.01, unit: 'A', explain: '4 × 40 = 160 A.' },
      { id: 's2-t7-3', type: 'mc', q: 'El arco se apaga todo el tiempo y el cordón sale fino. ¿Qué pasa?', options: ['La intensidad es baja', 'La intensidad es alta', 'El filtro es oscuro', 'La masa está cerca'], answer: 0, explain: 'Hay que subirla.' },
      { id: 's2-t7-4', type: 'mc', q: '¿Cuándo hay que regular la intensidad?', options: ['En cada trabajo nuevo, al cambiar de electrodo o de posición', 'Una vez al año', 'Nunca', 'Sólo si se rompe la máquina'], answer: 0, explain: 'Tres situaciones.' },
    ],
  },
  {
    id: 's2-tecnica',
    title: 'Técnica: arco, avance y ángulo',
    icon: '✍️',
    summary: 'Cómo encender el arco, qué longitud mantener, a qué velocidad avanzar y con qué ángulo.',
    content: (
      <>
        <h4>Inicio del arco</h4>
        <ol>
          <li>Elegido el electrodo, se verifica el equipo, se enciende y se regula la intensidad.</li>
          <li>Se coloca el extremo sin revestimiento en la pinza.</li>
          <li>
            Se <b>raspa</b> la punta sobre la pieza con un movimiento tangencial, <b>como para encender un fósforo</b> (a veces hay que golpear suavemente).
          </li>
          <li>Se separa el electrodo unos milímetros para mantener el arco y se lo ubica en posición.</li>
          <li>Se avanza lento y parejo, buscando un cordón homogéneo en ancho, altura y penetración.</li>
        </ol>
        <h4>Longitud del arco</h4>
        <p>
          Distancia entre la punta del electrodo y la pieza: <b>aproximadamente igual al diámetro</b> del electrodo. Como el electrodo se consume, hay que ir
          bajando la pinza. Muy corto: inclusiones de escoria y el electrodo se pega. Muy largo: dispersa el calor, gotas gruesas, poca penetración, bordes
          irregulares y se apaga fácil.
        </p>
        <h4>Velocidad de avance</h4>
        <p>
          <b>Constante</b>. Cada pausa ensancha el cordón y cada apuro lo angosta; al solidificarse se notan los cambios.
        </p>
        <h4>Ángulo del electrodo</h4>
        <p>
          Hay un ángulo <b>transversal</b> y uno <b>de avance</b> (en la dirección de la soldadura). A tope: transversal <b>90°</b> y de avance <b>60° a
          80°</b>. En ángulo: transversal <b>45°</b> y de avance unos <b>60°</b>, con el cordón justo en el vértice. Acercarlo a la vertical aumenta la
          penetración; menos de 45° la reduce mucho y agranda el charco.
        </p>
        <h4>Complemento: soplo magnético</h4>
        <p className="hint">No está desarrollado en el apunte, pero lo preguntan las preguntas 25 y 26 de la guía.</p>
        <p>
          Es la <b>desviación del arco</b> por los campos magnéticos que crea la propia corriente de soldadura, sobre todo con corriente continua, cerca de los
          extremos de la pieza o de la pinza de masa. Se corrige: cambiando de lugar la pinza de masa, inclinando el electrodo hacia el lado contrario al
          soplo, acortando el arco, soldando hacia una zona ya soldada o con puntos de fijación, o usando <b>corriente alterna</b>.
        </p>
      </>
    ),
    activities: [
      { id: 's2-t8-1', type: 'mc', q: '¿Cómo se enciende el arco?', options: ['Raspando la punta sobre la pieza, como un fósforo', 'Acercando sin tocar', 'Apoyando el revestimiento', 'Con un soplete'], answer: 0, explain: 'Después se separa unos milímetros.' },
      { id: 's2-t8-2', type: 'mc', q: 'A tope, ¿qué ángulos se usan?', options: ['Transversal 90° y de avance 60° a 80°', 'Transversal 45° y de avance 30°', 'Los dos de 90°', 'Los dos de 45°'], answer: 0, explain: 'En ángulo: 45° y 60°.' },
      { id: 's2-t8-3', type: 'mc', q: 'El electrodo se pega a la pieza. ¿Qué pasa?', options: ['El arco es demasiado corto', 'El arco es muy largo', 'La velocidad es alta', 'El filtro es claro'], answer: 0, explain: 'También puede quedar escoria atrapada.' },
      { id: 's2-t8-4', type: 'mc', q: '¿Qué es el soplo magnético?', options: ['La desviación del arco por campos magnéticos', 'El viento del taller', 'El gas del revestimiento', 'Un tipo de electrodo'], answer: 0, explain: 'Se corrige moviendo la masa, inclinando el electrodo o usando alterna.' },
    ],
  },
  {
    id: 's2-posiciones',
    title: 'Uniones y posiciones',
    icon: '📐',
    summary: 'A tope, en ángulo, en T y solapada. Plana, horizontal, vertical y sobre cabeza: 1G, 2F, 3G, 4F…',
    content: (
      <>
        <p>
          <b>Tipo de unión</b>: cómo están ubicadas las piezas entre sí. <b>A tope</b>, <b>en ángulo</b>, <b>en T</b> y <b>solapadas</b>.
        </p>
        <p>
          <b>Posición</b>: cómo se presentan las piezas. <b>Plana</b>, <b>horizontal</b>, <b>vertical</b> y <b>sobre cabeza</b>.
        </p>
        <table className="s2-table">
          <thead>
            <tr>
              <th>Posición</th>
              <th>A tope (G)</th>
              <th>En ángulo / T (F)</th>
              <th>Dificultad</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Plana</td>
              <td>1G</td>
              <td>1F</td>
              <td>La más fácil y de mejor calidad</td>
            </tr>
            <tr>
              <td>Horizontal</td>
              <td>2G</td>
              <td>2F</td>
              <td>2G más difícil; 2F común</td>
            </tr>
            <tr>
              <td>Vertical</td>
              <td>3G</td>
              <td>3F</td>
              <td>Mucha habilidad (ascendente o descendente)</td>
            </tr>
            <tr>
              <td>Sobre cabeza</td>
              <td>4G</td>
              <td>4F</td>
              <td>Poco común, muy difícil</td>
            </tr>
          </tbody>
        </table>
        <p>
          Siempre que se pueda, se acomoda la unión en <b>posición plana</b>. <SubLink to="/componentes/uniones">Ver en 3D</SubLink>.
        </p>
      </>
    ),
    activities: [
      { id: 's2-t9-1', type: 'mc', q: '¿Qué significa 4F?', options: ['Unión en ángulo sobre cabeza', 'Unión a tope plana', 'Cuatro filetes', 'Unión vertical a tope'], answer: 0, explain: '4 = sobre cabeza, F = en ángulo.' },
      { id: 's2-t9-2', type: 'mc', q: '¿Cuáles son las uniones más comunes?', options: ['En ángulo (1F, 2F) y en T (2F)', 'Sobre cabeza', 'Vertical descendente', '4G'], answer: 0, explain: 'Después le sigue la unión a tope 1G.' },
      { id: 's2-t9-3', type: 'mc', q: '¿Por qué conviene soldar en posición plana?', options: ['Es más fácil y el cordón sale de mejor calidad', 'Usa menos electrodos', 'No hace falta máscara', 'No hay escoria'], answer: 0, explain: 'Siempre que se pueda.' },
    ],
  },
  {
    id: 's2-chapas',
    title: 'Tablas de chapas',
    icon: '📊',
    summary: 'Espesor y peso por m² de las chapas laminadas en frío (por calibre) y en caliente (por pulgadas).',
    content: (
      <>
        <p>El anexo del apunte trae dos tablas de pesos y medidas de chapas de acero:</p>
        <div className="s2-two">
          <table className="s2-table">
            <caption>Laminadas en frío</caption>
            <thead>
              <tr>
                <th>Calibre</th>
                <th>mm</th>
                <th>kg/m²</th>
              </tr>
            </thead>
            <tbody>
              {CHAPAS_FRIO.map(([c, e, k]) => (
                <tr key={c}>
                  <td>{c}</td>
                  <td>{fmt(e)}</td>
                  <td>{fmt(k)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table className="s2-table">
            <caption>Laminadas en caliente</caption>
            <thead>
              <tr>
                <th>Pulg.</th>
                <th>mm</th>
                <th>kg/m²</th>
              </tr>
            </thead>
            <tbody>
              {CHAPAS_CALIENTE.map(([p, e, k]) => (
                <tr key={e}>
                  <td>{p}</td>
                  <td>{fmt(e)}</td>
                  <td>{fmt(k)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>A mayor número de calibre, menor espesor. El peso es proporcional al espesor: el acero pesa unos 7,9 kg por m² y por mm.</p>
        <PesoChapa />
      </>
    ),
    activities: [
      { id: 's2-t10-1', type: 'num', q: '¿Qué espesor tiene la chapa calibre Nº 18? (mm)', answer: 1.25, tolerance: 0.01, unit: 'mm', explain: 'Tabla de laminadas en frío.' },
      { id: 's2-t10-2', type: 'num', q: '¿Cuánto pesa 1 m² de chapa de 1/4"? (kg)', answer: 50.24, tolerance: 0.01, unit: 'kg', explain: '6,35 mm → 50,24 kg/m².' },
      { id: 's2-t10-3', type: 'num', q: '¿Cuánto pesa una chapa Nº 20 de 1 m × 2 m? (kg)', answer: 14.24, tolerance: 0.02, unit: 'kg', explain: '2 m² × 7,12 kg/m².' },
    ],
  },
]
