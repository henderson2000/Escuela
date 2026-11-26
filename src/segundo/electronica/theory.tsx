import { useState } from 'react'
import type { Topic } from '../../data/theory'
import { Field, Formula, Readout, Segmented, Slider } from '../../components/ui'
import { SubLink } from '../../lib/nav'
import './el2.css'

const fmt = (n: number, d = 2) => (Number.isFinite(n) ? Number(n.toFixed(d)).toString().replace('.', ',') : '—')

/* ------------------------------------------------------------------ calculadoras */

/** Resistencia en serie para un LED. */
function LedCalc() {
  const [vs, setVs] = useState(5)
  const [vf, setVf] = useState(2)
  const [ma, setMa] = useState(15)
  const r = (vs - vf) / (ma / 1000)
  const comerciales = [100, 120, 150, 180, 220, 270, 330, 390, 470, 560, 680, 820, 1000, 1200, 1500, 1800, 2200]
  const elegida = comerciales.find((x) => x >= r) ?? 2200
  const p = (ma / 1000) ** 2 * elegida
  return (
    <div className="calc">
      <Slider label="Tensión de la fuente" value={vs} min={3} max={12} step={0.5} onChange={setVs} format={(x) => `${fmt(x, 1)} V`} />
      <Field label="Color del LED (tensión directa)">
        <Segmented<number>
          value={vf}
          onChange={setVf}
          options={[
            { value: 2, label: 'Rojo 2 V' },
            { value: 2.2, label: 'Verde 2,2 V' },
            { value: 3, label: 'Azul/blanco 3 V' },
          ]}
        />
      </Field>
      <Slider label="Corriente deseada" value={ma} min={5} max={20} step={1} onChange={setMa} format={(x) => `${x} mA`} />
      <Formula>
        R = (V − V<sub>LED</sub>) ÷ I = ({fmt(vs, 1)} − {fmt(vf, 1)}) ÷ {fmt(ma / 1000, 3)} = {fmt(r, 0)} Ω
      </Formula>
      <Readout label="Valor comercial (el siguiente más grande)" value={`${elegida} Ω`} />
      <Readout label="Potencia en la resistencia" value={`${fmt(p * 1000, 1)} mW → alcanza con ¼ W`} />
    </div>
  )
}

/** Transformador: relación de vueltas. */
function TrafoCalc() {
  const [v1, setV1] = useState(220)
  const [v2, setV2] = useState(12)
  const [n1, setN1] = useState(1100)
  const n2 = (n1 * v2) / v1
  return (
    <div className="calc">
      <Slider label="Tensión del primario" value={v1} min={110} max={240} step={10} onChange={setV1} format={(x) => `${x} V`} />
      <Slider label="Tensión del secundario" value={v2} min={3} max={48} step={1} onChange={setV2} format={(x) => `${x} V`} />
      <Slider label="Vueltas del primario" value={n1} min={500} max={2000} step={50} onChange={setN1} />
      <Formula>
        V1 ÷ V2 = N1 ÷ N2 → N2 = {n1} × {v2} ÷ {v1} = {fmt(n2, 0)} vueltas
      </Formula>
      <Readout label="Relación de transformación" value={`${fmt(v1 / v2, 2)} : 1`} />
    </div>
  )
}

/** Fuente: pico, rectificado, ripple y si alcanza para el regulador. */
function FuenteCalc() {
  const [vef, setVef] = useState(12)
  const [i, setI] = useState(500)
  const [c, setC] = useState(2200)
  const [reg, setReg] = useState(12)
  const vp = vef * Math.SQRT2
  const vr = vp - 1.4
  const ripple = i / 1000 / (100 * c * 1e-6)
  const vmin = vr - ripple
  const ok = vmin >= reg + 2
  return (
    <div className="calc">
      <Slider label="Secundario (eficaz)" value={vef} min={6} max={24} step={1} onChange={setVef} format={(x) => `${x} V`} />
      <Slider label="Corriente de la carga" value={i} min={50} max={1500} step={50} onChange={setI} format={(x) => `${x} mA`} />
      <Field label="Capacitor de filtro">
        <Segmented<number> value={c} onChange={setC} options={[470, 1000, 2200, 4700].map((x) => ({ value: x, label: `${x} µF` }))} />
      </Field>
      <Field label="Regulador">
        <Segmented<number>
          value={reg}
          onChange={setReg}
          options={[
            { value: 5, label: '7805' },
            { value: 9, label: '7809' },
            { value: 12, label: '7812' },
          ]}
        />
      </Field>
      <Formula>
        Vp = {vef} × 1,41 = {fmt(vp, 1)} V · rectificada = {fmt(vp, 1)} − 1,4 = {fmt(vr, 1)} V · ripple = {fmt(i / 1000, 2)} ÷ (100 × {fmt(c / 1e6, 4)}) = {fmt(ripple, 2)} V
      </Formula>
      <Readout label="Tensión mínima antes del regulador" value={`${fmt(vmin, 1)} V`} />
      <Readout label={`¿Regula a ${reg} V? (necesita ${reg + 2} V)`} value={<span className={ok ? 'el2-ok' : 'el2-bad'}>{ok ? 'Sí' : 'No: subí el capacitor o el secundario'}</span>} />
    </div>
  )
}

/** Código de los capacitores cerámicos (104 = 10 × 10⁴ pF). */
function CeramicCalc() {
  const [code, setCode] = useState('104')
  const ok = /^\d{3}$/.test(code)
  const pf = ok ? Number(code.slice(0, 2)) * 10 ** Number(code[2]) : NaN
  const show = pf >= 1e6 ? `${fmt(pf / 1e6, 2)} µF` : pf >= 1000 ? `${fmt(pf / 1000, 2)} nF` : `${pf} pF`
  return (
    <div className="calc">
      <Field label="Código impreso (3 cifras)">
        <input className="input" value={code} maxLength={3} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
      </Field>
      <Formula>{ok ? `${code.slice(0, 2)} × 10^${code[2]} pF = ${pf} pF` : 'Escribí tres cifras, por ejemplo 104'}</Formula>
      <Readout label="Valor" value={ok ? show : '—'} />
    </div>
  )
}

/* ------------------------------------------------------------------ temas */

export const ELECTRONICA2_TOPICS: Topic[] = [
  {
    id: 'e2-seguridad',
    title: 'Seguridad en el taller de electrónica',
    icon: '⚠️',
    summary: 'El soldador está a 350 °C, el flux larga humo y el estaño puede tener plomo: reglas para trabajar sin accidentes.',
    content: (
      <>
        <ul className="el2-steps">
          <li>
            El soldador siempre en su <b>soporte</b>. Nunca se agarra por la parte metálica ni se lo alcanza "al vuelo" si se cae: se deja caer.
          </li>
          <li>
            Trabajar con <b>ventilación</b> o un extractor: el humo del flux irrita los ojos y los pulmones. No se respira de cerca.
          </li>
          <li>
            <b>Anteojos de seguridad</b>: al cortar las patas sobrantes con el alicate saltan pedacitos de alambre.
          </li>
          <li>
            El estaño con plomo es tóxico si se ingiere: <b>no comer en la mesa</b> y <b>lavarse las manos</b> al terminar.
          </li>
          <li>
            El cable del soldador lejos de la punta. Desenchufar al terminar y dejar enfriar antes de guardar.
          </li>
          <li>
            Las fuentes y los capacitores grandes pueden quedar cargados: <b>no se toca el lado de 220 V</b> de un circuito enchufado.
          </li>
        </ul>
      </>
    ),
    activities: [
      { id: 'e2-t1-1', type: 'mc', q: 'Se te cae el soldador caliente de la mesa. ¿Qué hacés?', options: ['Lo dejo caer y lo levanto por el mango', 'Lo agarro en el aire', 'Lo atajo con el pie', 'Lo agarro de la punta'], answer: 0, explain: 'Una quemadura con 350 °C es grave: el soldador se reemplaza, la mano no.' },
      { id: 'e2-t1-2', type: 'mc', q: '¿Por qué hay que lavarse las manos después de soldar?', options: ['El estaño puede tener plomo, que es tóxico', 'Porque el flux mancha', 'Para enfriarlas', 'No hace falta'], answer: 0, explain: 'Y no se come ni se toma en la mesa de trabajo.' },
      { id: 'e2-t1-3', type: 'mc', q: '¿Para qué se usan anteojos al cortar las patas sobrantes?', options: ['Saltan pedacitos de alambre', 'Por la luz del soldador', 'Por el humo', 'No se usan'], answer: 0, explain: 'Conviene sostener la pata al cortarla.' },
    ],
  },
  {
    id: 'e2-soldador',
    title: 'El soldador y el estaño',
    icon: '🔥',
    summary: 'Tipos de soldador, puntas, temperatura, aleaciones de estaño (60/40, 63/37, sin plomo) y para qué sirve el flux.',
    content: (
      <>
        <p>
          El <b>soldador de lápiz</b> (25 a 40 W) sirve para electrónica; los de más potencia, para cables gruesos. La <b>estación de soldado</b> controla
          la temperatura con un sensor. <SubLink to="/componentes/soldador">Ver en 3D</SubLink>.
        </p>
        <table className="el2-table">
          <thead>
            <tr>
              <th>Estaño</th>
              <th>Funde a</th>
              <th>Punta</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>60/40 (estaño-plomo)</td>
              <td>183–190 °C</td>
              <td>320–350 °C</td>
              <td>El más fácil de usar</td>
            </tr>
            <tr>
              <td>63/37 (eutéctico)</td>
              <td>183 °C</td>
              <td>320–340 °C</td>
              <td>Pasa de líquido a sólido de golpe</td>
            </tr>
            <tr>
              <td>Sin plomo (SAC305)</td>
              <td>217–220 °C</td>
              <td>360–380 °C</td>
              <td>Obligatorio en productos comerciales</td>
            </tr>
          </tbody>
        </table>
        <p>
          El <b>flux</b> (resina) viene adentro del alambre de estaño: al calentarse limpia el óxido y ayuda a que el estaño "moje" el cobre. Sin flux, el
          estaño no se pega.
        </p>
        <p>
          La punta se mantiene <b>limpia y estañada</b>: se limpia en la esponja húmeda y se le pone una gota de estaño antes de guardarla. Una punta negra
          (oxidada) no transmite el calor.
        </p>
      </>
    ),
    activities: [
      { id: 'e2-t2-1', type: 'mc', q: '¿Para qué sirve el flux?', options: ['Limpia el óxido para que el estaño moje el cobre', 'Enfría la soldadura', 'Colorea el estaño', 'Hace que el estaño funda más caliente'], answer: 0, explain: 'Por eso el alambre de estaño trae resina adentro.' },
      { id: 'e2-t2-2', type: 'num', q: '¿Qué potencia tiene un soldador de lápiz típico para electrónica? (W, el máximo recomendado)', answer: 40, tolerance: 0.1, unit: 'W', explain: 'De 25 a 40 W.' },
      { id: 'e2-t2-3', type: 'mc', q: '¿Por qué el estaño sin plomo necesita la punta más caliente?', options: ['Funde a más temperatura (unos 217 °C)', 'Porque es más grueso', 'Porque no tiene flux', 'No la necesita'], answer: 0, explain: 'Funde más de 30 °C por encima del 60/40.' },
    ],
  },
  {
    id: 'e2-punto',
    title: 'Cómo hacer un buen punto de soldadura',
    icon: '🌋',
    summary: 'Los 5 pasos, el tiempo justo y cómo reconocer una soldadura fría, con exceso, con poco estaño o con puente.',
    content: (
      <>
        <ol className="el2-steps">
          <li>Limpiar la punta en la esponja y estañarla.</li>
          <li>
            Apoyarla tocando a la vez el <b>pad</b> y la <b>pata</b> (1 a 2 segundos).
          </li>
          <li>
            Acercar el estaño del lado opuesto a la punta: lo tiene que fundir <b>la pieza caliente</b>, no el soldador.
          </li>
          <li>Retirar el estaño cuando cubrió el pad, y enseguida retirar el soldador (todo en 2 a 4 segundos).</li>
          <li>No mover el componente hasta que el estaño se ponga sólido. Cortar la pata sobrante.</li>
        </ol>
        <table className="el2-table">
          <thead>
            <tr>
              <th>Cómo se ve</th>
              <th>Qué es</th>
              <th>Por qué</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Cono cóncavo, liso y brillante</td>
              <td>Buena</td>
              <td>Temperatura, tiempo y estaño justos</td>
            </tr>
            <tr>
              <td>Bolita opaca y granulada</td>
              <td>Fría</td>
              <td>Faltó calor, punta sucia o se movió al enfriar</td>
            </tr>
            <tr>
              <td>Bola grande que tapa la pata</td>
              <td>Exceso</td>
              <td>Demasiado estaño</td>
            </tr>
            <tr>
              <td>Se ve cobre alrededor de la pata</td>
              <td>Poco estaño</td>
              <td>Faltó estaño</td>
            </tr>
            <tr>
              <td>Estaño que une dos pads</td>
              <td>Puente</td>
              <td>Exceso: ¡cortocircuito!</td>
            </tr>
            <tr>
              <td>Pad despegado, placa oscura</td>
              <td>Sobrecalentada</td>
              <td>Demasiado tiempo o temperatura</td>
            </tr>
          </tbody>
        </table>
        <p>
          Probalo en el <SubLink to="/componentes/punto">simulador del punto de soldadura</SubLink>.
        </p>
      </>
    ),
    activities: [
      { id: 'e2-t3-1', type: 'mc', q: '¿Quién tiene que fundir el estaño?', options: ['El pad y la pata calientes', 'La punta del soldador directamente', 'El flux', 'Da igual'], answer: 0, explain: 'Si se funde en la punta, cae sobre una pieza fría y queda una soldadura fría.' },
      { id: 'e2-t3-2', type: 'num', q: '¿Cuántos segundos dura, como máximo, un punto de soldadura normal?', answer: 4, tolerance: 0.25, unit: 's', explain: 'De 2 a 4 segundos. Más tiempo puede despegar el pad o dañar el componente.' },
      { id: 'e2-t3-3', type: 'mc', q: 'Dos pads vecinos quedaron unidos por estaño. ¿Qué es y qué provoca?', options: ['Un puente: un cortocircuito', 'Una soldadura fría: un circuito abierto', 'Nada, está bien', 'Un pad levantado'], answer: 0, explain: 'Se saca con malla desoldante.' },
    ],
  },
  {
    id: 'e2-desoldar',
    title: 'Desoldar y reparar',
    icon: '🧽',
    summary: 'Malla desoldante, bomba de vacío y cómo sacar un componente sin levantar los pads.',
    content: (
      <>
        <p>
          <b>Malla desoldante</b>: trenza de cobre con flux. Se apoya sobre el estaño y se calienta encima: el estaño sube por la malla por capilaridad.
          Se corta el pedazo usado.
        </p>
        <p>
          <b>Bomba desoldadora (chupón)</b>: se arma el émbolo, se funde el estaño, se apoya la boquilla y se aprieta el botón: aspira el estaño fundido.
        </p>
        <p>
          Para sacar un componente: se desueldan <b>todas</b> las patas y recién ahí se tira suave. Si se fuerza, se arranca el pad. Para soldaduras
          viejas, conviene agregar un poco de estaño nuevo (trae flux) antes de desoldar.
        </p>
      </>
    ),
    activities: [
      { id: 'e2-t4-1', type: 'mc', q: '¿Cómo saca el estaño la malla desoldante?', options: ['Por capilaridad: el estaño fundido sube por la trenza', 'Lo aspira con aire', 'Lo disuelve', 'Lo enfría'], answer: 0, explain: 'Por eso se usa con la punta encima de la malla.' },
      { id: 'e2-t4-2', type: 'mc', q: 'Una soldadura vieja no se funde bien para desoldarla. ¿Qué conviene hacer?', options: ['Agregar un poco de estaño nuevo, que trae flux', 'Subir el soldador al máximo', 'Tirar del componente', 'Raspar con un cutter'], answer: 0, explain: 'El flux fresco ayuda a que el calor pase.' },
    ],
  },
  {
    id: 'e2-pasivos',
    title: 'Componentes pasivos',
    icon: '🟫',
    summary: 'Resistencias (código de colores y potencia), capacitores (electrolíticos con polaridad y cerámicos con código) e inductores.',
    content: (
      <>
        <p>
          <b>Resistencias</b>: limitan la corriente. El valor se lee con el código de colores (3 bandas de valor y una de tolerancia) y la{' '}
          <b>potencia</b> (¼ W, ½ W…) se nota por el tamaño. La potencia que disipa es P = I² × R.
        </p>
        <p>
          <b>Capacitores</b>: guardan carga. Los <b>electrolíticos</b> (de 1 µF en adelante) tienen <b>polaridad</b>: la franja marca el negativo y la pata
          larga es el positivo; al revés pueden explotar. También tienen una <b>tensión máxima</b> impresa. Los <b>cerámicos</b> (pF y nF) no tienen
          polaridad y traen un código de tres cifras:
        </p>
        <CeramicCalc />
        <p>
          <b>Inductores (bobinas)</b>: alambre enrollado que guarda energía en un campo magnético. Se usan en filtros y fuentes conmutadas.
        </p>
      </>
    ),
    activities: [
      { id: 'e2-t5-1', type: 'mc', q: '¿Cómo se reconoce la pata negativa de un capacitor electrolítico?', options: ['Por la franja con signos −, y es la pata más corta', 'Es la pata más larga', 'Por el color del capacitor', 'No tiene polaridad'], answer: 0, explain: 'Conectarlo al revés puede hacerlo explotar.' },
      { id: 'e2-t5-2', type: 'num', q: 'Un capacitor cerámico dice 104. ¿Cuántos nF tiene?', answer: 100, tolerance: 0, unit: 'nF', explain: '10 × 10⁴ pF = 100 000 pF = 100 nF.' },
      { id: 'e2-t5-3', type: 'num', q: '¿Qué potencia disipa una resistencia de 100 Ω con 0,1 A? (W)', answer: 1, tolerance: 0.01, unit: 'W', explain: 'P = I² × R = 0,01 × 100 = 1 W: necesita una de 1 W o más.' },
    ],
  },
  {
    id: 'e2-semi',
    title: 'Diodos, LEDs y transistores',
    icon: '🔺',
    summary: 'El diodo deja pasar la corriente en un solo sentido, el LED emite luz y el transistor funciona como llave controlada.',
    content: (
      <>
        <p>
          El <b>diodo</b> conduce de ánodo a cátodo (la franja marca el cátodo) y bloquea al revés. Cuando conduce, "se come" unos 0,7 V (silicio). El
          1N4007 aguanta 1 A y 1000 V.
        </p>
        <p>
          El <b>LED</b> es un diodo que emite luz: necesita entre 1,8 y 3,3 V según el color y una <b>resistencia en serie</b> que limite la corriente a
          10–20 mA. La pata larga es el ánodo (+).
        </p>
        <LedCalc />
        <p>
          El <b>transistor NPN</b> (BC547) tiene colector, base y emisor. Una corriente chica en la base (desde un pin, con una resistencia de 1 kΩ)
          permite pasar una corriente hasta 100 a 300 veces mayor de colector a emisor: así se manejan relés, motores y LEDs de potencia.
        </p>
      </>
    ),
    activities: [
      { id: 'e2-t6-1', type: 'num', q: 'LED rojo (2 V) a 5 V con 15 mA. ¿Qué resistencia hace falta? (Ω)', answer: 200, tolerance: 0.01, unit: 'Ω', explain: '(5 − 2) ÷ 0,015 = 200 Ω → se usa 220 Ω, el valor comercial siguiente.' },
      { id: 'e2-t6-2', type: 'mc', q: '¿Qué marca la franja de un diodo?', options: ['El cátodo', 'El ánodo', 'La potencia', 'La tensión'], answer: 0, explain: 'La corriente circula de ánodo a cátodo.' },
      { id: 'e2-t6-3', type: 'num', q: 'Un transistor con ganancia 100 recibe 2 mA en la base. ¿Cuánta corriente puede pasar por el colector? (mA)', answer: 200, tolerance: 0.01, unit: 'mA', explain: 'Ic = β × Ib = 100 × 2 mA.' },
    ],
  },
  {
    id: 'e2-pcb',
    title: 'El circuito impreso',
    icon: '🟩',
    summary: 'Partes de un PCB, THT y SMD, simple y doble faz, y cómo se hace en el taller con el método del planchado.',
    content: (
      <>
        <p>
          Partes: <b>sustrato</b> (FR4 o pertinax), <b>cobre</b> (pistas y pads), <b>máscara antisoldante</b> (verde, en las placas industriales) y{' '}
          <b>serigrafía</b> (los nombres de los componentes).
        </p>
        <p>
          <b>THT</b>: componentes con patas que atraviesan la placa. <b>SMD</b>: se sueldan sobre la superficie, son mucho más chicos. Las placas pueden ser
          de <b>simple faz</b>, <b>doble faz</b> o <b>multicapa</b>.
        </p>
        <ol className="el2-steps">
          <li>Diseñar el circuito (por ejemplo, en KiCad) e imprimirlo espejado con impresora láser.</li>
          <li>Cortar la placa, lijar el cobre con virulana y desengrasar.</li>
          <li>Planchar el papel boca abajo 3 a 5 minutos; remojar y sacar el papel: el tóner queda en el cobre.</li>
          <li>Atacar en percloruro férrico (con guantes y anteojos), moviendo la bandeja, hasta que desaparezca el cobre libre.</li>
          <li>Enjuagar, sacar el tóner con thinner o virulana y perforar con mecha de 0,8 a 1 mm.</li>
          <li>Soldar primero los componentes bajos (resistencias, diodos) y después los altos (capacitores, borneras).</li>
        </ol>
        <p>
          <SubLink to="/componentes/pcb">Seguí los pasos en 3D</SubLink>.
        </p>
      </>
    ),
    activities: [
      { id: 'e2-t7-1', type: 'mc', q: '¿Qué componentes se sueldan primero?', options: ['Los más bajos (resistencias, diodos)', 'Los más altos', 'Los más caros', 'Da igual'], answer: 0, explain: 'Así la placa apoya derecha mientras se sueldan.' },
      { id: 'e2-t7-2', type: 'mc', q: '¿Qué diferencia a un componente SMD de uno THT?', options: ['El SMD se suelda sobre la superficie, sin agujeros', 'El SMD es más grande', 'El THT no lleva estaño', 'No hay diferencia'], answer: 0, explain: 'SMD = montaje superficial.' },
      { id: 'e2-t7-3', type: 'mc', q: '¿Qué protección se usa para trabajar con percloruro férrico?', options: ['Guantes y anteojos: mancha y es corrosivo', 'Ninguna', 'Sólo barbijo', 'Protector auditivo'], answer: 0, explain: 'Y no se tira a la pileta: se guarda para reutilizar y se descarta como residuo peligroso.' },
    ],
  },
  {
    id: 'e2-fuente',
    title: 'La fuente de alimentación',
    icon: '🔋',
    summary: 'Transformador, rectificador, filtro y regulador: de 220 V de alterna a 5 o 12 V de continua.',
    content: (
      <>
        <p>
          <b>1. Transformador</b>: baja la tensión según la relación de vueltas de sus bobinados y aísla de la red.
        </p>
        <TrafoCalc />
        <p>
          <b>2. Rectificador</b>: el <b>puente de 4 diodos</b> da la vuelta a los semiciclos negativos (onda completa, 100 pulsos por segundo). Se pierden
          unos 1,4 V en los dos diodos que conducen. La tensión <b>pico</b> es la eficaz × √2.
        </p>
        <p>
          <b>3. Filtro</b>: un capacitor grande se carga en cada pico y entrega corriente entre pico y pico. Queda una ondulación (<b>ripple</b>):
        </p>
        <Formula>Vripple ≈ I ÷ (100 Hz × C)</Formula>
        <p>
          <b>4. Regulador</b>: el 7805 da 5 V, el 7809 da 9 V y el 7812 da 12 V. Necesita en la entrada al menos 2 V más que la salida, también en el
          punto más bajo del ripple. Lo que sobra lo convierte en calor: por eso lleva disipador.
        </p>
        <FuenteCalc />
        <p>
          <SubLink to="/componentes/fuente">Medí cada etapa con el osciloscopio en 3D</SubLink>.
        </p>
      </>
    ),
    activities: [
      { id: 'e2-t8-1', type: 'num', q: 'Transformador de 220 V a 12 V. Si el primario tiene 1100 vueltas, ¿cuántas tiene el secundario?', answer: 60, tolerance: 0.01, unit: 'vueltas', explain: 'N2 = 1100 × 12 ÷ 220 = 60.' },
      { id: 'e2-t8-2', type: 'num', q: 'Con 1 A y un capacitor de 4700 µF, ¿cuánto ripple hay? (V)', answer: 2.13, tolerance: 0.02, unit: 'V', explain: '1 ÷ (100 × 0,0047) = 2,13 V.' },
      { id: 'e2-t8-3', type: 'mc', q: '¿Qué tensión mínima necesita en la entrada un 7805?', options: ['Unos 7 V', '5 V justos', '3,3 V', '220 V'], answer: 0, explain: '2 V más que la salida.' },
    ],
  },
  {
    id: 'e2-medir',
    title: 'Medir y comprobar',
    icon: '📟',
    summary: 'Continuidad para pistas y soldaduras, prueba de diodo, medición de tensiones y cómo buscar fallas en la placa.',
    content: (
      <>
        <p>
          <b>Continuidad</b> (el pitido): con la placa <b>sin alimentar</b>, se comprueba que una pista no esté cortada y que no haya puentes entre pistas
          vecinas.
        </p>
        <p>
          <b>Prueba de diodo</b>: en directa marca unos 0,5 a 0,7 V (o el LED se prende apenas); al revés marca OL. Si marca 0 en los dos sentidos, está
          en corto; si marca OL en los dos, está abierto.
        </p>
        <p>
          <b>Tensión continua</b>: con la punta negra en GND, se recorre el circuito: entrada del regulador, salida, alimentación del integrado. Así se
          encuentra en qué etapa se pierde la tensión.
        </p>
        <p>
          Antes de alimentar una placa nueva: <b>mirar todas las soldaduras con lupa</b>, revisar la polaridad de electrolíticos, diodos y LEDs, y medir
          que no haya corto entre + y GND.
        </p>
      </>
    ),
    activities: [
      { id: 'e2-t9-1', type: 'mc', q: '¿Cómo se usa la prueba de continuidad?', options: ['Con la placa sin alimentar', 'Con la placa enchufada', 'Sólo con 220 V', 'Con el soldador caliente'], answer: 0, explain: 'Con tensión, la medición es falsa y se puede dañar el instrumento.' },
      { id: 'e2-t9-2', type: 'mc', q: 'Un diodo marca 0 V en los dos sentidos. ¿Qué tiene?', options: ['Está en cortocircuito', 'Está bien', 'Está abierto', 'Está al revés'], answer: 0, explain: 'Uno sano marca ~0,6 V en directa y OL en inversa.' },
      { id: 'e2-t9-3', type: 'mc', q: 'Antes de enchufar una placa recién armada conviene…', options: ['Revisar soldaduras, polaridades y que no haya corto entre + y GND', 'Enchufarla y ver qué pasa', 'Pasarle agua', 'Calentarla con el soldador'], answer: 0, explain: 'La mayoría de las fallas son soldaduras o componentes al revés.' },
    ],
  },
]
