import { useEffect, useState } from 'react'
import type { Topic } from '../../data/theory'
import { Readout, Slider } from '../../components/ui'
import { Desarrollo } from './Desarrollo'
import './h1.css'

/* ------------------------------------------------------------------ simuladores chicos */

function Laminado() {
  const [t, setT] = useState(0)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setT((x) => (x + 1) % 100), 50)
    return () => window.clearInterval(id)
  }, [])
  const x = t * 3
  return (
    <div className="calc">
      <svg viewBox="0 0 300 120" className="h1-svg" role="img" aria-label="Laminado de la chapa entre dos rodillos">
        <rect x={0} y={50} width={150} height={22} className="slab" />
        <rect x={150} y={56} width={150} height={8} className="sheet" />
        <g transform={`rotate(${t * 7.2} 150 30)`}>
          <circle cx={150} cy={30} r={26} className="roll" />
          <line x1={150} y1={8} x2={150} y2={52} className="spoke" />
        </g>
        <g transform={`rotate(${-t * 7.2} 150 90)`}>
          <circle cx={150} cy={90} r={26} className="roll" />
          <line x1={150} y1={68} x2={150} y2={112} className="spoke" />
        </g>
        <path d={`M${(x % 120) + 10} 61 l10 0 l-4 -4 m4 4 l-4 4`} className="arrow" />
      </svg>
      <p className="hint">Dos cilindros de acero muy duro, lisos y paralelos, giran a la misma velocidad y en sentido contrario: la planchuela gruesa sale convertida en hoja.</p>
    </div>
  )
}

function CorteSelector() {
  const [e, setE] = useState(0.5)
  const tool = e <= 1 ? { n: 'Tijera de hojalatero', t: 'Corte manual hasta 1 mm.' } : e <= 3 ? { n: 'Cizalla', t: 'Cuchilla fija y otra móvil con palanca, y un prensa-chapa. Hasta 3 mm.' } : e <= 12.7 ? { n: 'Guillotina', t: 'La cuchilla superior baja paralela a la inferior (pedal o hidráulica). Hasta 12,7 mm, en chapas grandes.' } : { n: 'Plasma o sierra sensitiva', t: 'Para espesores mayores: corte por plasma o por fricción (amoladora, sierra sensitiva).' }
  return (
    <div className="calc">
      <Slider label="Espesor de la chapa" value={e} min={0.3} max={16} step={0.1} onChange={setE} format={(x) => `${x.toFixed(1).replace('.', ',')} mm`} />
      <Readout label="Conviene usar" value={tool.n} />
      <p className="hint">{tool.t}</p>
    </div>
  )
}

// tabla de chapas de acero laminadas en frío del apunte de Soldadura
const CALIBRES: [number, number][] = [
  [30, 0.3],
  [28, 0.35],
  [26, 0.45],
  [24, 0.56],
  [22, 0.7],
  [20, 0.9],
  [18, 1.25],
  [16, 1.6],
  [14, 2],
  [12, 2.5],
]

function Calibre() {
  const [i, setI] = useState(0)
  const [n, mm] = CALIBRES[i]
  return (
    <div className="calc">
      <Slider label="Calibre (Nº)" value={i} min={0} max={CALIBRES.length - 1} step={1} onChange={setI} format={() => `Nº ${n}`} />
      <svg viewBox="0 0 300 50" className="h1-svg" role="img" aria-label={`Chapa de ${mm} mm`}>
        <rect x={20} y={25 - mm * 8} width={260} height={Math.max(2, mm * 16)} className="sheet" />
      </svg>
      <Readout label="Espesor" value={`${String(mm).replace('.', ',')} mm`} />
      <p className="hint">A mayor número de calibre, MENOR espesor: es inversamente proporcional. Los proyectos del taller usan chapa Nº 30 (muy fina).</p>
    </div>
  )
}

/* ------------------------------------------------------------------ temas */

export const HOJALATERIA1_TOPICS: Topic[] = [
  {
    id: 'h1-intro',
    title: 'Hojalatería y chapas',
    icon: '🔨',
    summary: 'Qué es la hojalatería, la chapa de acero blando, el laminado y el calibre.',
    content: (
      <>
        <p>
          <b>Hojalatería</b> es el trabajo con hojalata, pero el nombre se extendió a todo el trabajo manual de modelado de{' '}
          <b>chapas finas</b> para hacer objetos y utensilios. También se dice <b>zinguería</b> cuando se trabaja con chapa de zinc.
        </p>
        <h4>Chapas de acero blando</h4>
        <p>
          Una <b>chapa</b> es una lámina delgada de metal que se usa en construcciones mecánicas: carrocerías, muebles, puertas y ventanas.
          Se fabrican de <b>1 a 12 mm</b>. Las comunes son de acero blando (<b>IRAM 1010</b>) y se hacen a partir de planchuelas gruesas
          reducidas a hojas con <b>rodillos laminadores</b>.
        </p>
        <Laminado />
        <p>Según el uso, tienen tratamientos contra la oxidación y la corrosión: cromado, pintura, galvanizado.</p>
        <h4>El calibre</h4>
        <p>
          El espesor de la chapa se llama <b>calibre</b> y se indica con un número convencional, <b>inversamente proporcional</b> al espesor
          en milímetros.
        </p>
        <Calibre />
      </>
    ),
    activities: [
      { id: 'h1-t1-1', type: 'mc', q: '¿Qué es la zinguería?', options: ['El trabajo con chapas de zinc', 'Soldar con estaño', 'Pintar chapas', 'Tornear zinc'], answer: 0, explain: 'Como su nombre lo indica.' },
      { id: 'h1-t1-2', type: 'mc', q: '¿Cómo se fabrican las chapas a partir de planchuelas gruesas?', options: ['Con rodillos laminadores', 'Con lima', 'Con soldadura', 'Con la plegadora'], answer: 0, explain: 'Dos cilindros duros que giran en sentido contrario.' },
      { id: 'h1-t1-3', type: 'mc', q: 'Una chapa calibre 30 comparada con una calibre 20 es…', options: ['Más fina', 'Más gruesa', 'Igual', 'De otro metal'], answer: 0, explain: 'A mayor número, menor espesor.' },
      { id: 'h1-t1-4', type: 'mc', q: '¿De qué acero son las chapas comunes?', options: ['Acero blando IRAM 1010', 'Acero inoxidable siempre', 'Acero templado', 'Fundición gris'], answer: 0, explain: 'Acero de bajo carbono, fácil de trabajar.' },
    ],
  },
  {
    id: 'h1-hojalata',
    title: 'Hojalata y chapa galvanizada',
    icon: '🥫',
    summary: 'El acero para envasar y la chapa con zinc de los techos y canaletas.',
    content: (
      <>
        <h4>La hojalata</h4>
        <p>
          Desde su aparición en <b>1810</b>, la hojalata está en los productos de todos los días. Los fabricantes la llaman{' '}
          <b>acero para envasar</b>: latas de verduras (tomates, arvejas, choclo), frutas (duraznos, peras), lácteos (leche en polvo,
          cacao), la mayoría de los aerosoles, latas de picadillo y pescado, y envases de aceite de oliva y pinturas de calidad.
        </p>
        <h4>La chapa galvanizada</h4>
        <p>
          Es chapa de acero laminada recubierta en las dos caras con una capa de <b>zinc</b>. Se nota por la cristalización del zinc en forma
          de pequeñas hojas (la "flor"). Con ella se hacen chapas onduladas o trapezoidales para techos, cañerías, canaletas y recipientes. Los
          proyectos del taller son de <b>chapa galvanizada Nº 30</b>.
        </p>
      </>
    ),
    activities: [
      { id: 'h1-t2-1', type: 'mc', q: '¿Cómo llaman los fabricantes a la hojalata?', options: ['Acero para envasar', 'Chapa de techo', 'Acero templado', 'Zinguería'], answer: 0, explain: 'Por su uso en latas y envases.' },
      { id: 'h1-t2-2', type: 'mc', q: '¿Con qué está recubierta la chapa galvanizada?', options: ['Con zinc', 'Con estaño', 'Con pintura', 'Con cobre'], answer: 0, explain: 'En las dos caras.' },
      { id: 'h1-t2-3', type: 'mc', q: '¿Cuál de estos productos se hace con chapa galvanizada?', options: ['Una canaleta', 'Una lata de tomates', 'Un aerosol', 'Una lata de leche en polvo'], answer: 0, explain: 'Techos, cañerías, canaletas y recipientes.' },
      { id: 'h1-t2-4', type: 'num', q: '¿En qué año apareció la hojalata?', answer: 1810, tolerance: 0, unit: '', explain: 'Desde 1810 se usa para envasar.' },
    ],
  },
  {
    id: 'h1-trazado',
    title: 'Medir y trazar: el desarrollo',
    icon: '📐',
    summary: 'Punta de trazar, granete, compás, regla, cinta, escuadra y gramil. El plano operación por operación.',
    content: (
      <>
        <ul>
          <li>
            <b>Punta de trazar</b>: varilla de acero templado con puntas afiladas; se toma como un lápiz.
          </li>
          <li>
            <b>Punto o granete</b>: barra de acero templado con punta cónica a <b>120°</b>. Marca puntos. Hay de golpe (con martillo) y
            automáticos (de mano).
          </li>
          <li>
            <b>Compás de punta seca</b>: traza círculos y arcos, y compara y traslada medidas.
          </li>
          <li>
            <b>Regla metálica</b>: de acero inoxidable, semirrígida o flexible, graduada en mm o pulgadas. Las más usadas son de 300 mm; las
            largas, de 1 m.
          </li>
          <li>
            <b>Cinta métrica</b>: lámina de acero graduada y flexible que se enrolla; de 1 a 10 m.
          </li>
          <li>
            <b>Escuadra de 90°</b>: comprueba que la chapa esté cortada a escuadra y traza perpendiculares y líneas a 45°.
          </li>
          <li>
            <b>Gramil</b>: traza paralelas al borde de la chapa; reduce errores y ahorra tiempo. Antes de trazar se verifica la medida con la
            regla.
          </li>
        </ul>
        <h4>El desarrollo de los proyectos</h4>
        <p>Mové la operación y mirá cómo se va trazando y cortando el desarrollo de cada pieza:</p>
        <Desarrollo />
      </>
    ),
    activities: [
      { id: 'h1-t3-1', type: 'mc', q: '¿Qué herramienta traza paralelas al borde de la chapa?', options: ['El gramil', 'El granete', 'La tijera', 'La bigornia'], answer: 0, explain: 'Hay que verificar la medida con la regla antes de trazar.' },
      { id: 'h1-t3-2', type: 'mc', q: '¿Cuál es la medida más usada de regla metálica?', options: ['300 mm', '50 mm', '3 m', '10 m'], answer: 0, explain: 'Las más largas son de 1 m.' },
      { id: 'h1-t3-3', type: 'mc', q: 'Para comprobar que la chapa esté cortada a escuadra se usa…', options: ['La escuadra de 90°', 'El compás', 'La cinta métrica', 'El martillo'], answer: 0, explain: 'También traza perpendiculares y líneas a 45°.' },
      { id: 'h1-t3-4', type: 'mc', q: '¿Por qué se traza en las dos caras de la chapa?', options: ['Porque se pliega hacia los dos lados y hay que ver las líneas', 'Por costumbre', 'Para que pese menos', 'No se traza'], answer: 0, explain: 'Lo indican todos los ciclos de fabricación.' },
    ],
  },
  {
    id: 'h1-corte',
    title: 'Herramientas y máquinas de corte',
    icon: '✂️',
    summary: 'Tijera hasta 1 mm, cizalla hasta 3 mm, guillotina hasta 12,7 mm.',
    content: (
      <>
        <ul>
          <li>
            <b>Tijera de hojalatero</b>: la herramienta principal. Corta chapas de hasta <b>1 mm</b>. La de corte recto es la más usada (cortes
            chicos o apenas curvos); hay otras para corte continuo y curvas.
          </li>
          <li>
            <b>Cizalla</b>: para más espesor. Cuchilla fija y otra superior móvil accionada con una palanca, y un <b>prensa-chapa</b> regulable
            para que la chapa no se levante. Hasta <b>3 mm</b>.
          </li>
          <li>
            <b>Guillotina</b>: para planchas grandes; la cuchilla superior baja paralela a la inferior, con pedal o con cilindros hidráulicos.
            Desde décimas de mm hasta <b>12,7 mm</b>.
          </li>
        </ul>
        <CorteSelector />
      </>
    ),
    activities: [
      { id: 'h1-t4-1', type: 'num', q: '¿Hasta qué espesor corta la cizalla? (mm)', answer: 3, tolerance: 0, unit: 'mm', explain: 'Para más, la guillotina.' },
      { id: 'h1-t4-2', type: 'num', q: '¿Hasta qué espesor corta la guillotina? (mm)', answer: 12.7, tolerance: 0, unit: 'mm', explain: 'Según su tamaño.' },
      { id: 'h1-t4-3', type: 'mc', q: '¿Para qué sirve el prensa-chapa de la cizalla?', options: ['Para que la chapa no se levante al cortar', 'Para plegar', 'Para medir', 'Para soldar'], answer: 0, explain: 'Se regula según el espesor.' },
      { id: 'h1-t4-4', type: 'mc', q: 'Tenés que cortar chapa Nº 30 para la caja. ¿Qué usás?', options: ['Tijera de hojalatero', 'Guillotina hidráulica', 'Plasma', 'Sierra sensitiva'], answer: 0, explain: 'Es muy fina: menos de 1 mm.' },
    ],
  },
  {
    id: 'h1-golpe',
    title: 'Golpear y apoyar',
    icon: '🔩',
    summary: 'Martillo de hojalatero, bigornia, yunque y calzo o sufridera.',
    content: (
      <>
        <ul>
          <li>
            <b>Martillo de hojalatero</b>: además del martillo común, en hojalatería se usa el martillo para chapa u hojalatero.
          </li>
          <li>
            <b>Bigornia</b>: bloque de acero fundido con dos extremos cónicos de formas distintas. Para enderezar o dar forma a chapas de
            mediano espesor.
          </li>
          <li>
            <b>Yunque</b>: parecido a la bigornia pero más grande; para golpes fuertes. Se usa más en forja y herrería.
          </li>
          <li>
            <b>Calzo o sufridera</b>: bloque de acero donde se apoya la chapa para golpearla y darle forma. En el taller se usa uno
            rectangular sujeto en la morsa para que no se mueva.
          </li>
        </ul>
      </>
    ),
    activities: [
      { id: 'h1-t5-1', type: 'mc', q: '¿Qué tiene de particular la bigornia?', options: ['Dos extremos cónicos de formas distintas', 'Es de madera', 'Corta chapa', 'Tiene una palanca'], answer: 0, explain: 'Es un bloque de acero fundido.' },
      { id: 'h1-t5-2', type: 'mc', q: '¿Dónde se sujeta el calzo en el taller?', options: ['En la morsa', 'En el piso', 'En la plegadora', 'No se sujeta'], answer: 0, explain: 'Así no se mueve al golpear.' },
      { id: 'h1-t5-3', type: 'mc', q: '¿Dónde se usa más el yunque?', options: ['En forja y herrería', 'En electrónica', 'En computación', 'Para trazar'], answer: 0, explain: 'Para golpes con fuerza considerable.' },
    ],
  },
  {
    id: 'h1-plegado',
    title: 'Plegar y unir',
    icon: '📎',
    summary: 'Plegadora (punzón y matriz), engrafado y bombo hojalatero.',
    content: (
      <>
        <ul>
          <li>
            <b>Plegadora</b>: hace los pliegues. Sus herramientas son el <b>punzón</b> y la <b>matriz</b>, de formas distintas según el
            pliegue. Las manuales a palanca son para piezas chicas y hasta <b>1 mm</b>; las <b>oleohidráulicas</b>, para más espesor y piezas
            grandes.
          </li>
          <li>
            <b>Engrafadora</b>: une chapas por <b>engrafado</b> (engargolado): en los extremos se pliegan ganchos opuestos que se cruzan, se
            enlazan y se aplastan. Queda una unión firme y duradera.
          </li>
          <li>
            <b>Bombo hojalatero</b>: cuerpo de placa de acero con 305 mm de garganta; con una manija mueve dos rodillos y hace refuerzos en
            paneles (techos, cubiertas, campanas).
          </li>
        </ul>
        <p className="hint">Probá la plegadora y el engrafado en la sección 3D.</p>
      </>
    ),
    activities: [
      { id: 'h1-t6-1', type: 'mc', q: '¿Qué es el engrafado?', options: ['Una unión con ganchos opuestos que se enlazan y se aplastan', 'Un tipo de soldadura', 'Un corte con plasma', 'Un pegamento'], answer: 0, explain: 'También se llama engargolado.' },
      { id: 'h1-t6-2', type: 'mc', q: '¿Qué máquina hace refuerzos en paneles con rodillos?', options: ['El bombo hojalatero', 'La guillotina', 'La punzonadora', 'La cizalla'], answer: 0, explain: 'Tiene 305 mm de garganta.' },
      { id: 'h1-t6-3', type: 'mc', q: '¿Cuándo conviene una plegadora oleohidráulica?', options: ['Con chapa gruesa o piezas grandes', 'Con chapa Nº 30 chica', 'Para cortar', 'Nunca'], answer: 0, explain: 'Tiene más fuerza.' },
    ],
  },
  {
    id: 'h1-soldadura-corte',
    title: 'Soldadura por punto y máquinas de corte',
    icon: '⚡',
    summary: 'Soldadura por punto y por roldana; corte por plasma, por fricción y punzonado.',
    content: (
      <>
        <h4>Soldadura por punto</h4>
        <p>
          Es el procedimiento más común y sencillo de soldadura por <b>resistencia</b>. El calor lo genera la resistencia eléctrica que ofrece la
          pieza al paso de una corriente de alta intensidad. Se usa para unir chapas de hasta <b>3 mm</b>. La <b>soldadura por roldana</b>{' '}
          usa el mismo principio con dos rodillos de cobre: hace una costura a lo largo de la chapa y no en un solo punto. Con ella se cierran
          las esquinas de la budinera.
        </p>
        <h4>Máquinas de corte</h4>
        <ul>
          <li>
            <b>Plasma</b>: un chorro de gas ionizado a alta velocidad conduce la electricidad, funde el metal y lo sopla.
          </li>
          <li>
            <b>Fricción</b>: amoladora y sierra sensitiva; cortan cualquier material.
          </li>
          <li>
            <b>Punzonadora</b>: corta, perfora y conforma chapa con un punzón y una matriz, como una prensa.
          </li>
        </ul>
      </>
    ),
    activities: [
      { id: 'h1-t7-1', type: 'mc', q: '¿De dónde sale el calor en la soldadura por punto?', options: ['De la resistencia de la pieza al paso de una corriente muy alta', 'De una llama de gas', 'De un soldador de estaño', 'Del sol'], answer: 0, explain: 'Por eso es soldadura por resistencia.' },
      { id: 'h1-t7-2', type: 'num', q: '¿Hasta qué espesor se suelda por punto? (mm)', answer: 3, tolerance: 0, unit: 'mm', explain: 'Chapas de no más de 3 mm.' },
      { id: 'h1-t7-3', type: 'mc', q: '¿Qué diferencia a la soldadura por roldana?', options: ['Usa rodillos de cobre y hace una costura continua', 'Usa estaño', 'No usa electricidad', 'Sólo une plásticos'], answer: 0, explain: 'Suelda a lo largo, no en un punto.' },
      { id: 'h1-t7-4', type: 'mc', q: '¿Qué es el plasma en el corte por plasma?', options: ['Gas ionizado a alta velocidad', 'Agua a presión', 'Una sierra', 'Un láser de luz'], answer: 0, explain: 'Conduce la electricidad y funde el metal.' },
    ],
  },
]
