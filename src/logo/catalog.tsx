import type { ReactNode } from 'react'
import type { ComponentDef, Params, PartInfo } from '../catalog/types'
import { Field, Readout, Segmented, Slider, Toggle } from '../components/ui'
import {
  ContactorModel,
  LAMP_COLOR_OPTIONS,
  MotorBreakerModel,
  LOGO_PROGRAMS,
  LogoModel,
  PushbuttonsModel,
  logoIO,
  logoInputs,
  logoOutputs,
  useLogoIO,
  type BreakerState,
  type LampColor,
  type TripCause,
  type LogoProgram,
} from '../three/models/Logo'

/** Como Field, pero sin <label> (un label con botones adentro "aprieta" el primero al tocar el título). */
function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      {children}
    </div>
  )
}

/* ================================================================== LOGO! */

function LogoControls({ params, set }: { params: Params; set: (p: Params) => void }) {
  const st = useLogoIO()
  const inputs = logoInputs(st)
  const outputs = params.powered ? logoOutputs(st) : [false, false, false, false]
  const prog = LOGO_PROGRAMS.find((p) => p.value === params.program)!
  return (
    <>
      <Toggle label="Alimentado (L1 – N: 230 V)" value={params.powered} onChange={(powered) => set({ powered })} />
      <Field label="Programa cargado">
        <Segmented<LogoProgram>
          value={params.program}
          options={LOGO_PROGRAMS.map((p) => ({ value: p.value, label: p.label }))}
          onChange={(program) => set({ program })}
        />
      </Field>
      <p className="hint">{prog.desc}</p>
      <Group label="Entradas (tocá para dar o quitar tensión)">
        <div className="row wrap">
          {inputs.map((v, i) => (
            <button
              key={i}
              type="button"
              className={`btn small ${v ? 'primary' : ''}`}
              aria-pressed={v}
              onClick={() => logoIO.toggle(i)}
            >
              I{i + 1} {v ? '● 1' : '○ 0'}
            </button>
          ))}
        </div>
      </Group>
      <Readout label="Salidas" value={outputs.map((v, i) => `Q${i + 1}=${v ? 1 : 0}`).join('  ')} />
      <Toggle label="Mostrar tablero de prueba" value={params.showBoard} onChange={(showBoard) => set({ showBoard })} />
      <Toggle label="Mostrar riel DIN" value={params.rail} onChange={(rail) => set({ rail })} />
      {params.showBoard ? (
        <p className="hint">
          👆 Mantené apretado un pulsador del tablero (con el mouse) para mandar tensión a I1–I4: mirá cómo cambia el
          display y se prenden las lámparas de Q1–Q4.
        </p>
      ) : (
        <p className="hint">En el display, los números de las entradas y salidas activas aparecen “invertidos” (cuadradito negro).</p>
      )}
    </>
  )
}

const logoParts = (p: Params): PartInfo[] => [
  { id: 'carcasa', name: 'Carcasa (frente y cuerpo)', desc: 'Caja de plástico aislante gris claro, de 4 módulos de ancho (71,5 × 90 × 60 mm). Tiene la forma escalonada de los equipos para riel DIN: la parte central sobresale para asomar por la “ventana” de 45 mm de las tapas de los tableros, y los bornes quedan escondidos detrás de la tapa.' },
  { id: 'display', name: 'Display LCD', desc: 'Pantalla monocromática retroiluminada de 6 renglones × 16 caracteres. Muestra la fecha y hora, el estado de las entradas (I) y salidas (Q) —las activas aparecen invertidas—, los menús y el programa cuando se edita desde el frente.' },
  { id: 'teclado', name: 'Teclado (cursores, ESC y OK)', desc: 'Seis teclas: las cuatro flechas ◀ ▲ ▼ ▶ para moverse por los menús y el programa, OK para confirmar/entrar y ESC para volver o salir. Con ellas se puede programar el LOGO! sin computadora y pasar de STOP a RUN.' },
  { id: 'alimentacion', name: 'Bornera de alimentación (L1, N)', desc: 'Por acá entra la alimentación del equipo: L1 (fase) y N (neutro), de 115 a 240 V AC/DC en el modelo 230RCE. Siempre protegida con un interruptor termomagnético o fusible.' },
  { id: 'entradas', name: 'Bornera de entradas (I1–I8)', desc: 'Ocho entradas digitales. Una entrada vale 1 cuando le llega tensión de la fase (L1) a través de un pulsador, interruptor, final de carrera o sensor, y vale 0 cuando no le llega. En el 230RCE se usa la misma tensión que la alimentación.' },
  { id: 'salidas', name: 'Bornera de salidas (Q1–Q4)', desc: 'Cada salida Q tiene dos bornes (1 y 2): son los extremos de un contacto de relé. Cuando el programa pone Q en 1, el contacto se cierra y deja pasar la corriente de la carga (lámpara, bobina de contactor, electroválvula…).' },
  { id: 'reles', name: 'Relés de salida', desc: 'Cuatro relés soldados a la placa: la bobina la maneja el microprocesador y el contacto sale a los bornes Q. Son contactos libres de potencial (no entregan tensión, sólo cierran un circuito), así que cada salida puede manejar una tensión distinta. Corriente máxima: unos 10 A con carga resistiva y 3 A con carga inductiva (bobinas, motores).' },
  { id: 'cpu', name: 'Placa CPU', desc: 'Placa con el microprocesador que ejecuta el programa, la memoria no volátil donde queda guardado (aunque se corte la luz), el reloj de tiempo real con su respaldo, el chip de Ethernet y los micropulsadores de las teclas.' },
  { id: 'fuente', name: 'Fuente interna y placa de potencia', desc: 'Fuente conmutada que convierte los 115–240 V de L1–N en las tensiones bajas que usan los circuitos (transformador de ferrita, capacitores de filtro, varistor de protección contra sobretensiones). En esta placa van también los relés y las borneras.' },
  { id: 'ethernet', name: 'Puerto Ethernet (RJ45)', desc: 'Conector de red: sirve para cargar y leer el programa desde la PC con LOGO!Soft Comfort, para ver el estado en línea, para comunicarse con otros LOGO!, paneles o PLC y para el servidor web integrado.' },
  { id: 'microsd', name: 'Ranura para micro SD', desc: 'Detrás de una tapita: con una tarjeta micro SD se puede copiar el programa de un LOGO! a otro, guardar una copia de seguridad o registrar datos (data log).' },
  { id: 'clip', name: 'Clip de riel DIN', desc: 'Corredera con resorte de la parte de atrás. Se engancha arriba en el ala del riel y abajo el clip se traba solo. Para sacarlo se tira de la lengüeta con un destornillador plano.' },
  ...(p.rail ? [{ id: 'riel', name: 'Riel DIN 35 mm', desc: 'Perfil metálico normalizado (EN 60715) “sombrero” de 35 × 7,5 mm que se atornilla al fondo del tablero. Sobre él se montan, uno al lado del otro, el LOGO!, las térmicas, los contactores y las borneras.' }] : []),
  ...(p.showBoard
    ? [{ id: 'tablero', name: 'Tablero de prueba', desc: 'Cuatro pulsadores que llevan la fase (L1) a I1–I4 y cuatro lámparas piloto conectadas a Q1–Q4. Los bornes “1” de las salidas están puenteados a la fase: cuando un relé cierra, la corriente pasa de 1 a 2, llega a la lámpara y vuelve por el neutro.' }]
    : []),
]

export const logo: ComponentDef = {
  id: 'logo',
  name: 'Siemens LOGO! 8',
  category: 'Automatización',
  icon: '🟩',
  short: 'Módulo lógico programable (un “PLC compacto”): lee pulsadores y sensores y maneja lámparas, contactores y motores.',
  camera: [6, 3.5, 17],
  target: [0, 0, 0],
  shadowY: -4.8,
  defaultParams: { program: 'directo', powered: true, rail: true, showBoard: false },
  render: (p) => <LogoModel program={p.program} powered={p.powered} rail={p.rail} showBoard={p.showBoard} />,
  Controls: LogoControls,
  parts: logoParts,
  theory: (
    <>
      <p>
        El <strong>LOGO!</strong> de Siemens es un <strong>módulo lógico inteligente</strong>: un pequeño{' '}
        <strong>PLC</strong> (controlador lógico programable) pensado para automatizaciones chicas y medianas, como
        portones, iluminación, bombas, cintas transportadoras o riego. Salió al mercado en <strong>1996</strong> y
        reemplaza a muchos relés, temporizadores y contadores cableados por un <strong>programa</strong>.
      </p>
      <h4>¿Qué tiene adentro?</h4>
      <ul>
        <li>Un microprocesador que ejecuta el programa y una memoria donde queda guardado aunque se corte la luz.</li>
        <li>
          <strong>8 entradas</strong> digitales (I1–I8) y <strong>4 salidas a relé</strong> (Q1–Q4) en el módulo base;
          se le pueden agregar módulos de ampliación al costado.
        </li>
        <li>Display, teclado de 6 teclas, reloj de tiempo real, puerto Ethernet y ranura micro SD.</li>
      </ul>
      <h4>¿Cómo se programa?</h4>
      <p>
        El programa se arma uniendo <strong>bloques de función</strong>: 8 funciones básicas (AND, OR, NOT, NAND, NOR,
        XOR, flancos…) y unas 37 funciones especiales (temporizadores, contadores, relé autoenclavador, reloj semanal,
        etc.). Un LOGO! 8 admite programas de hasta <strong>400 bloques</strong>. Se puede programar desde el frente con
        las teclas, o mucho más cómodo desde la PC con <strong>LOGO!Soft Comfort</strong> y bajarlo por Ethernet.
      </p>
      <h4>¿Cómo se conecta?</h4>
      <ul>
        <li>
          <strong>Alimentación</strong>: L1 (fase) y N (neutro), de 115 a 240 V en el modelo 230RCE, con su
          protección.
        </li>
        <li>
          <strong>Entradas</strong>: a cada borne I le llega la fase <em>a través</em> de un pulsador, interruptor o
          sensor. Si hay tensión, la entrada vale <strong>1</strong>; si no, vale <strong>0</strong>.
        </li>
        <li>
          <strong>Salidas</strong>: cada Q es un <strong>contacto de relé</strong> (bornes 1 y 2). No “entrega”
          tensión: cierra el circuito de la carga. Por eso se lleva la fase al borne 1 y la carga se conecta entre el
          borne 2 y el neutro.
        </li>
      </ul>
      <p className="tip">
        Una salida a relé soporta unos 10 A con carga resistiva (lámparas incandescentes, resistencias) pero sólo unos 3 A
        con carga inductiva. Para un motor se usa un <strong>contactor</strong>: el LOGO! maneja la bobina y el
        contactor maneja el motor.
      </p>
      <h4>El ciclo de programa</h4>
      <p>El LOGO! trabaja repitiendo siempre los mismos tres pasos, muchas veces por segundo:</p>
      <ol>
        <li>
          <strong>Lee las entradas</strong> y guarda su estado (la “imagen” de las entradas).
        </li>
        <li>
          <strong>Ejecuta el programa</strong>, bloque por bloque, con esos valores.
        </li>
        <li>
          <strong>Escribe las salidas</strong>: prende o apaga los relés según el resultado.
        </li>
      </ol>
      <p>
        En el display, la pantalla de estado muestra <code>I:12345678</code> y <code>Q:1234</code>: los números que
        aparecen con fondo negro (invertidos) son las entradas o salidas que están en 1.
      </p>
    </>
  ),
  activities: [
    { id: 'logo-1', type: 'num', q: '¿Cuántas entradas digitales tiene un LOGO! 8 230RCE (módulo base, sin ampliaciones)?', answer: 8, tolerance: 0, unit: 'entradas', explain: 'Tiene 8 entradas, de I1 a I8.' },
    { id: 'logo-2', type: 'num', q: '¿Y cuántas salidas a relé?', answer: 4, tolerance: 0, unit: 'salidas', explain: 'Tiene 4 salidas a relé: Q1, Q2, Q3 y Q4.' },
    { id: 'logo-3', type: 'mc', q: 'En el LOGO!, ¿qué indica la letra Q en un borne?', options: ['Una entrada', 'Una salida', 'El neutro', 'La tierra'], answer: 1, explain: 'I = entradas (input), Q = salidas. Cada Q es un contacto de relé.' },
    { id: 'logo-4', type: 'mc', q: '¿Cómo se conectan los bornes L1 y N?', options: ['L1 a la fase y N al neutro de la alimentación', 'A un pulsador', 'A la lámpara', 'No se conectan'], answer: 0, explain: 'L1 y N alimentan el equipo (115–240 V en el 230RCE).' },
    { id: 'logo-5', type: 'num', q: '¿Cuál es, aproximadamente, la corriente máxima que conviene manejar con una salida a relé si la carga es inductiva (una bobina, un motor chico)?', answer: 3, tolerance: 0, unit: 'A', explain: 'Unos 3 A con carga inductiva (y hasta 10 A con carga resistiva). Para motores más grandes se usa un contactor.' },
    { id: 'logo-6', type: 'mc', q: '¿Cuál es el orden del ciclo de programa del LOGO!?', options: ['Escribe salidas → lee entradas → ejecuta', 'Lee entradas → ejecuta el programa → escribe salidas', 'Ejecuta → lee entradas → descansa', 'Sólo ejecuta cuando se toca OK'], answer: 1, explain: 'Lee entradas, ejecuta el programa y escribe las salidas, y vuelve a empezar continuamente.' },
    { id: 'logo-7', type: 'mc', q: 'En el display aparece “I:12345678” con el 3 en un cuadradito negro. ¿Qué significa?', options: ['Que la entrada I3 está en 1 (tiene tensión)', 'Que la entrada I3 está rota', 'Que la salida Q3 está activa', 'Que falta programar I3'], answer: 0, explain: 'Los números invertidos indican entradas (o salidas) activas.' },
    { id: 'logo-8', type: 'mc', q: 'Programa “Y (AND)”: Q1 = I1 · I2. Si I1 = 1 e I2 = 0, ¿cuánto vale Q1?', options: ['1', '0'], answer: 1, explain: 'La AND da 1 sólo si todas sus entradas están en 1.' },
    { id: 'logo-9', type: 'mc', q: '¿Por qué se dice que las salidas a relé son “libres de potencial”?', options: ['Porque entregan 24 V', 'Porque son un contacto que sólo cierra un circuito: la tensión la pone la instalación', 'Porque no consumen energía', 'Porque no tienen bornes'], answer: 1, explain: 'El relé es un contacto: hay que llevarle la tensión (por ejemplo la fase al borne 1).' },
    { id: 'logo-10', type: 'mc', q: '¿Con qué programa de PC se programa el LOGO!?', options: ['Arduino IDE', 'LOGO!Soft Comfort', 'Excel', 'Paint'], answer: 1, explain: 'LOGO!Soft Comfort permite dibujar el programa con bloques, simularlo y cargarlo por Ethernet.' },
  ],
}


/* ================================================================== contactor */

export const contactor: ComponentDef = {
  id: 'contactor',
  name: 'Contactor tripolar',
  category: 'Mando y potencia',
  icon: '🧲',
  short: 'Interruptor electromagnético: una bobina chica (A1–A2) abre y cierra los contactos de potencia de un motor.',
  camera: [6, 4, 11],
  target: [0, 0, 0],
  shadowY: -3.1,
  defaultParams: { energized: false },
  render: (p) => <ContactorModel energized={p.energized} />,
  Controls: ({ params, set }) => (
    <>
      <Toggle label="Bobina energizada (230 V entre A1 y A2)" value={params.energized} onChange={(energized) => set({ energized })} />
      <Readout label="Contactos principales 1-2, 3-4, 5-6" value={params.energized ? 'CERRADOS' : 'abiertos'} />
      <Readout label="Contacto auxiliar 13-14 (NA)" value={params.energized ? 'CERRADO' : 'abierto'} />
      <p className="hint">
        Ocultá la <strong>carcasa</strong> (o despiezá) y prendé y apagá la bobina: el electroimán atrae la armadura, que
        arrastra el portacontactos y los puentes de cobre cierran los tres polos y el 13-14 al mismo tiempo.
      </p>
    </>
  ),
  parts: [
    { id: 'carcasa', name: 'Carcasa aislante', desc: 'Caja de plástico termoestable que aísla y sostiene todo. Tiene separadores entre polos que funcionan como cámaras apagachispas: al abrir con carga se forma un arco eléctrico que hay que enfriar y cortar rápido. Se monta en riel DIN de 35 mm.' },
    { id: 'bobina', name: 'Bobina (A1–A2)', desc: 'Miles de vueltas de alambre de cobre esmaltado. Al conectarle su tensión (en este modelo 230 V AC entre A1 y A2) crea un campo magnético en el núcleo. Consume muy poco (unos pocos watts), por eso la puede manejar un pulsador, un relé o una salida del LOGO!.' },
    { id: 'nucleo', name: 'Núcleo fijo (E) con espiras de sombra', desc: 'Paquete de chapas de hierro silicio en forma de E (laminado para reducir las pérdidas por corrientes parásitas). Las espiras de cobre en las patas (espiras de sombra) evitan que la armadura vibre y zumbe cuando la corriente alterna pasa por cero.' },
    { id: 'armadura', name: 'Armadura móvil', desc: 'La otra mitad del circuito magnético. Cuando la bobina se energiza, el núcleo la atrae y se mueve unos milímetros hacia atrás, arrastrando el portacontactos.' },
    { id: 'resortes', name: 'Resortes de retorno', desc: 'Empujan la armadura hacia afuera. Cuando se corta la tensión de la bobina, son los que abren los contactos: el contactor vuelve solo a su posición de reposo.' },
    { id: 'portacontactos', name: 'Portacontactos', desc: 'Pieza de plástico unida a la armadura que lleva todos los puentes móviles, así que todos los polos se abren y cierran juntos. Asoma por el frente como indicador de posición y pulsador de prueba (sólo para pruebas sin tensión).' },
    { id: 'contactosMoviles', name: 'Puentes de contacto móviles', desc: 'Barras de cobre con pastillas de aleación de plata en los extremos. Cada puente une los dos contactos fijos de un polo (por ejemplo 1 con 2) cortando en dos puntos. Un resorte de presión asegura buen contacto aunque las pastillas se gasten.' },
    { id: 'contactosFijos', name: 'Contactos fijos principales', desc: 'Chapas de cobre que van de cada borne hasta una pastilla de plata. Son los tres polos de potencia: 1-2, 3-4 y 5-6, por donde pasa la corriente del motor (hasta 12 A en AC-3).' },
    { id: 'auxiliar', name: 'Contacto auxiliar 13-14 (NA)', desc: 'Contacto chico normal abierto que se mueve junto con los principales. No es para la potencia sino para el circuito de mando: autorretención, señalización (lámpara “en marcha”) o avisarle a un PLC que el contactor cerró.' },
    { id: 'bornes', name: 'Bornes de potencia', desc: 'Arriba la entrada de la línea (1/L1, 3/L2, 5/L3) y abajo la salida al motor (2/T1, 4/T2, 6/T3). Además el 13 y el 14 del contacto auxiliar. Tornillos con jaula que aprieta el cable.' },
    { id: 'bornesBobina', name: 'Bornes de bobina A1 y A2', desc: 'Por acá se alimenta la bobina. Es el circuito de mando: se cablea con pulsadores, contactos auxiliares o con una salida Q del LOGO!.' },
    { id: 'riel', name: 'Riel DIN 35 mm', desc: 'El contactor se engancha en el riel igual que el LOGO!, las térmicas y los guardamotores.' },
  ],
  theory: (
    <>
      <p>
        El <strong>contactor</strong> es un interruptor que se acciona con un <strong>electroimán</strong>. Sirve para
        prender y apagar cargas grandes (motores, resistencias, iluminación) a distancia, con una señal de mando chica.
        Puede maniobrar millones de veces.
      </p>
      <h4>Sus tres circuitos</h4>
      <ul>
        <li>
          <strong>Bobina (A1–A2)</strong>: es el circuito de <em>mando</em>. Consume pocos watts.
        </li>
        <li>
          <strong>Contactos principales</strong> (1-2, 3-4, 5-6 o L1-T1, L2-T2, L3-T3): son el circuito de{' '}
          <em>potencia</em>. Por ellos pasa la corriente del motor.
        </li>
        <li>
          <strong>Contactos auxiliares</strong> (13-14 NA, 21-22 NC…): son chicos y se usan en el circuito de mando.
        </li>
      </ul>
      <h4>¿Cómo funciona?</h4>
      <ol>
        <li>Se aplica tensión entre A1 y A2: la bobina magnetiza el núcleo.</li>
        <li>El núcleo atrae la armadura, que arrastra el portacontactos.</li>
        <li>Los puentes móviles cierran todos los contactos principales y el 13-14 a la vez.</li>
        <li>Al cortar la tensión de la bobina, los resortes devuelven todo a reposo: los contactos se abren.</li>
      </ol>
      <h4>Autorretención (enclavamiento)</h4>
      <p>
        Con un pulsador de <strong>marcha</strong> (NA) se energiza la bobina. Si en <strong>paralelo</strong> con ese
        pulsador se conecta el contacto auxiliar <strong>13-14</strong>, al cerrar el contactor la bobina queda
        alimentada por su propio contacto: aunque se suelte el pulsador, sigue andando. Para pararlo se abre el
        circuito con un pulsador de <strong>parada</strong> (NC) en serie.
      </p>
      <p className="tip">
        ¿Por qué el LOGO! maneja la bobina y no el motor directamente? Porque una salida a relé del LOGO! aguanta unos
        pocos amperes (≈ 3 A en carga inductiva) y un solo polo, mientras que un motor trifásico necesita cortar las
        tres fases con corrientes de arranque de 6 a 8 veces la nominal. El LOGO! sólo le da los 230 V a A1–A2 y el
        contactor hace el trabajo pesado.
      </p>
    </>
  ),
  activities: [
    { id: 'logo-cont-1', type: 'mc', q: '¿Entre qué bornes se conecta la bobina de un contactor?', options: ['1 y 2', 'A1 y A2', '13 y 14', 'L1 y N'], answer: 1, explain: 'La bobina siempre se identifica con A1 y A2.' },
    { id: 'logo-cont-2', type: 'mc', q: '¿Qué pasa con los contactos principales cuando se corta la tensión de la bobina?', options: ['Quedan cerrados', 'Los resortes los abren', 'Se cierran más fuerte', 'Se queman'], answer: 1, explain: 'Sin campo magnético, los resortes de retorno separan la armadura y los contactos se abren.' },
    { id: 'logo-cont-3', type: 'mc', q: '¿Para qué se usa el contacto auxiliar 13-14 en un arranque directo?', options: ['Para alimentar el motor', 'Para la autorretención: se conecta en paralelo con el pulsador de marcha', 'Para medir la corriente', 'No se usa nunca'], answer: 1, explain: 'El 13-14 en paralelo con marcha mantiene la bobina energizada al soltar el pulsador.' },
    { id: 'logo-cont-4', type: 'num', q: '¿Cuántos contactos principales (polos de potencia) tiene un contactor tripolar?', answer: 3, tolerance: 0, unit: 'polos', explain: 'Tres: 1-2, 3-4 y 5-6, uno para cada fase.' },
    { id: 'logo-cont-5', type: 'mc', q: '¿Por qué conviene que el LOGO! maneje la bobina del contactor y no el motor directamente?', options: ['Porque el LOGO! no tiene salidas', 'Porque la salida a relé soporta poca corriente y un solo polo; el contactor corta las 3 fases y la corriente de arranque', 'Porque el motor funciona con 24 V', 'Porque así gasta más'], answer: 1, explain: 'La bobina consume poco: el LOGO! la maneja sin problemas y el contactor maneja la potencia.' },
    { id: 'logo-cont-6', type: 'mc', q: 'Los bornes 2/T1, 4/T2 y 6/T3 se conectan a…', options: ['La línea de alimentación', 'El motor', 'La bobina', 'El pulsador de parada'], answer: 1, explain: 'Los números pares (T) son la salida hacia la carga; los impares (L) la entrada de la línea.' },
  ],
}

/* ================================================================== pulsadores */

function HoldButton({ label, active, onChange }: { label: string; active: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      className={`btn small ${active ? 'primary' : ''}`}
      aria-pressed={active}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId)
        onChange(true)
      }}
      onPointerUp={() => onChange(false)}
      onPointerCancel={() => onChange(false)}
      onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && onChange(true)}
      onKeyUp={() => onChange(false)}
    >
      {label}
    </button>
  )
}

function PushbuttonsControls({ params, set }: { params: Params; set: (p: Params) => void }) {
  const sig = (v: boolean) => (v ? '1 (llega tensión)' : '0 (no llega)')
  return (
    <>
      <Group label="Pulsadores (mantené apretado)">
        <div className="row wrap">
          <HoldButton label="🟢 Marcha" active={params.green} onChange={(green) => set({ green })} />
          <HoldButton label="🔴 Parada" active={params.red} onChange={(red) => set({ red })} />
        </div>
      </Group>
      <Toggle
        label={params.estop ? 'Hongo enclavado (girá para desenclavar)' : 'Hongo de emergencia (golpear)'}
        value={params.estop}
        onChange={(estop) => set({ estop })}
      />
      <Toggle label="Lámpara piloto encendida" value={params.lampOn} onChange={(lampOn) => set({ lampOn })} />
      <Field label="Color de la lámpara">
        <Segmented<LampColor>
          value={params.lampColor}
          options={LAMP_COLOR_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          onChange={(lampColor) => set({ lampColor })}
        />
      </Field>
      <h4>Señal que recibiría el LOGO!</h4>
      <Readout label="Marcha (NA 13-14)" value={sig(params.green)} />
      <Readout label="Parada (NC 11-12)" value={sig(!params.red)} />
      <Readout label="Emergencia (NC 11-12)" value={sig(!params.estop)} />
      <p className="hint">Girá el modelo para ver atrás los bloques de contacto: tienen ventanas para ver cómo se mueve el puente.</p>
    </>
  )
}

export const pulsadores: ComponentDef = {
  id: 'pulsadores',
  name: 'Pulsadores, hongo y lámpara piloto',
  category: 'Mando y potencia',
  icon: '🔴',
  short: 'Elementos de mando y señalización de 22 mm: marcha (NA), parada (NC), parada de emergencia y lámpara piloto.',
  camera: [4.5, 3.5, 17],
  target: [0, 0, -0.8],
  shadowY: -3.6,
  defaultParams: { green: false, red: false, estop: false, lampColor: 'verde', lampOn: true },
  render: (p) => <PushbuttonsModel green={p.green} red={p.red} estop={p.estop} lampColor={p.lampColor} lampOn={p.lampOn} />,
  Controls: PushbuttonsControls,
  parts: [
    { id: 'chapa', name: 'Chapa del tablero', desc: 'Puerta o frente del tablero, con agujeros de 22,5 mm. Los aparatos se colocan desde adelante y se ajustan desde atrás con el adaptador. Debajo de cada uno va un portarrótulo que dice qué hace.' },
    { id: 'marcha', name: 'Pulsador verde de marcha', desc: 'Botón rasante (para que no se accione sin querer) de color verde, con el símbolo “I”. Lleva un bloque NA: sólo cierra el circuito mientras se lo mantiene apretado. Al soltarlo, un resorte lo devuelve.' },
    { id: 'parada', name: 'Pulsador rojo de parada', desc: 'Botón rojo con el símbolo “O”. Lleva un bloque NC: en reposo deja pasar la corriente y al apretarlo la corta.' },
    { id: 'hongo', name: 'Parada de emergencia (hongo)', desc: 'Cabeza roja grande en forma de hongo sobre fondo amarillo, fácil de golpear en una emergencia. Es enclavable: queda apretado hasta que alguien lo gira (o lo desbloquea con llave) a propósito. Usa contactos NC de apertura positiva.' },
    { id: 'lampara', name: 'Lámpara piloto', desc: 'Lente de color que señaliza un estado: verde “en marcha”, rojo “falla / parado”, amarillo “advertencia”, blanco “tensión presente”, azul “acción obligatoria”. Hoy casi todas usan un LED interno.' },
    { id: 'adaptadores', name: 'Adaptadores de fijación', desc: 'Piezas de plástico que aprietan el aparato contra la chapa desde atrás (con un tornillo o una tuerca) y donde se enganchan los bloques de contacto.' },
    { id: 'bloqueNA', name: 'Bloque de contacto NA (13-14)', desc: 'Contacto normal abierto: en reposo el puente está separado y no hay conducción. Al apretar el botón, el vástago empuja el puente y une 13 con 14. Se identifica en verde y con números terminados en 3-4.' },
    { id: 'bloqueNC', name: 'Bloques de contacto NC (11-12)', desc: 'Contacto normal cerrado: en reposo el puente une 11 con 12. Al apretar, el vástago separa el puente (apertura positiva: lo arranca mecánicamente aunque las pastillas estén soldadas). Se identifica en rojo y con números terminados en 1-2.' },
    { id: 'bloqueLed', name: 'Bloque LED (X1-X2)', desc: 'Portalámparas con un LED y su resistencia, alimentado entre X1 y X2 (por ejemplo desde una salida Q del LOGO! o desde el 13-14 de un contactor).' },
  ],
  theory: (
    <>
      <p>
        Los <strong>pulsadores</strong> y las <strong>lámparas piloto</strong> son la forma en que una persona le da
        órdenes a una máquina y ve en qué estado está. Los industriales son de <strong>22 mm</strong> (el diámetro del
        agujero en la chapa) y se arman por partes: el cabezal de adelante y los bloques de contacto atrás.
      </p>
      <h4>Contacto NA y NC</h4>
      <ul>
        <li>
          <strong>NA (normal abierto, NO)</strong>: en reposo está abierto; se cierra mientras se aprieta. Bornes 13-14.
        </li>
        <li>
          <strong>NC (normal cerrado)</strong>: en reposo está cerrado; se abre al apretar. Bornes 11-12.
        </li>
      </ul>
      <h4>¿Por qué la parada y la emergencia usan NC?</h4>
      <p>
        Por <strong>seguridad positiva</strong> (o “a prueba de fallas”): la máquina sólo puede andar mientras el circuito
        de parada esté cerrado. Si un cable de la parada se corta, se suelta o se afloja un borne, el circuito se abre y{' '}
        <strong>la máquina se detiene</strong>. Si la parada fuera NA, un cable cortado haría que el botón no funcione y
        nadie se daría cuenta hasta que lo necesite.
      </p>
      <h4>Colores (IEC 60204-1)</h4>
      <ul>
        <li>Verde: marcha / arranque.</li>
        <li>Rojo: parada. Hongo rojo sobre fondo amarillo: parada de emergencia.</li>
        <li>Lámparas: verde en marcha, rojo falla, amarillo advertencia, blanco tensión, azul acción obligatoria.</li>
      </ul>
      <h4>¿Cómo lo ve el LOGO!?</h4>
      <p>
        A cada entrada le llega la fase a través del contacto. Con un <strong>NA</strong>, en reposo la entrada vale{' '}
        <strong>0</strong> y al apretar vale 1. Con un <strong>NC</strong> es al revés: en reposo la entrada vale{' '}
        <strong>1</strong> y al apretar la parada (o si se corta el cable) pasa a 0. Por eso en el programa la parada se
        usa “tal cual”: la salida puede estar activa sólo mientras esa entrada esté en 1.
      </p>
      <p className="tip">El hongo de emergencia queda enclavado: para volver a arrancar hay que desenclavarlo girándolo y después dar marcha de nuevo. Nunca debe arrancar la máquina solo por desenclavarlo.</p>
    </>
  ),
  activities: [
    { id: 'logo-pul-1', type: 'mc', q: 'Un pulsador NA en reposo (sin apretar)…', options: ['Deja pasar la corriente', 'No deja pasar la corriente', 'Depende del color', 'Está en cortocircuito'], answer: 1, explain: 'NA = normal abierto: sólo conduce mientras se lo aprieta.' },
    { id: 'logo-pul-2', type: 'mc', q: '¿Por qué el pulsador de parada se conecta con un contacto NC?', options: ['Porque es más barato', 'Porque si se corta un cable la máquina se detiene (seguridad positiva)', 'Porque el LOGO! no lee contactos NA', 'Por el color rojo'], answer: 1, explain: 'Con NC, cualquier falla en el cableado abre el circuito y para la máquina.' },
    { id: 'logo-pul-3', type: 'mc', q: 'La parada (NC) está conectada a I2 y nadie la toca. ¿Qué valor muestra el LOGO! en I2?', options: ['0', '1'], answer: 1, explain: 'El NC en reposo está cerrado: le llega tensión a la entrada → 1.' },
    { id: 'logo-pul-4', type: 'mc', q: '¿Cómo es la parada de emergencia?', options: ['Botón verde rasante', 'Hongo rojo sobre fondo amarillo, enclavable', 'Lámpara azul', 'Llave selectora negra'], answer: 1, explain: 'Hongo rojo, fondo amarillo, queda enclavado hasta desbloquearlo.' },
    { id: 'logo-pul-5', type: 'mc', q: '¿Qué números tienen los bornes de un bloque NA?', options: ['11-12', '13-14', 'A1-A2', 'X1-X2'], answer: 1, explain: 'Terminados en 3-4 son NA (13-14); terminados en 1-2 son NC (11-12).' },
    { id: 'logo-pul-6', type: 'num', q: '¿De cuántos milímetros es el agujero estándar para pulsadores y lámparas industriales?', answer: 22, tolerance: 0.03, unit: 'mm', explain: 'Son los aparatos “de 22 mm” (agujero de 22,3–22,5 mm).' },
  ],
}


/* ================================================================== guardamotor */

function BreakerControls({ params, set }: { params: Params; set: (p: Params) => void }) {
  const st = params.state as BreakerState
  const cause = params.cause as TripCause
  const on = st === 'on'
  return (
    <>
      <div className="row wrap">
        <button type="button" className={`btn small ${on ? 'primary' : ''}`} onClick={() => set({ state: 'on', cause: null })}>
          I · Encender
        </button>
        <button type="button" className={`btn small ${st === 'off' ? 'primary' : ''}`} onClick={() => set({ state: 'off', cause: null })}>
          O · Apagar
        </button>
      </div>
      <Slider label="Regulación térmica Ir" value={params.setting} min={4.5} max={6.3} step={0.1} onChange={(setting) => set({ setting })} format={(v) => `${v.toFixed(1).replace('.', ',')} A`} />
      <Group label="Simular una falla (con el guardamotor encendido)">
        <div className="row wrap">
          <button type="button" className="btn small" disabled={!on} onClick={() => set({ state: 'trip', cause: 'termico' })}>
            🔥 Sobrecarga
          </button>
          <button type="button" className="btn small" disabled={!on} onClick={() => set({ state: 'trip', cause: 'magnetico' })}>
            ⚡ Cortocircuito
          </button>
        </div>
      </Group>
      <Readout label="Estado" value={on ? 'Encendido (I)' : st === 'off' ? 'Apagado (O)' : 'Disparado (TRIP)'} />
      <Readout label="Contactos principales" value={on ? 'cerrados' : 'abiertos'} />
      <Readout label="Auxiliar 13-14 / 21-22" value={on ? 'cerrado / abierto' : 'abierto / cerrado'} />
      {st === 'trip' && (
        <p className="hint">
          {cause === 'termico'
            ? `Disparo térmico: la corriente superó ${String(params.setting).replace('.', ',')} A durante un rato, los bimetales se calentaron, se doblaron y empujaron la barra de disparo.`
            : `Disparo magnético: en un cortocircuito la corriente es enorme (más de ${Math.round(params.setting * 13)} A) y las bobinas atraen su núcleo al instante.`}{' '}
          Para rearmar hay que llevar la manija a O y después a I.
        </p>
      )}
    </>
  )
}

export const guardamotor: ComponentDef = {
  id: 'guardamotor',
  name: 'Guardamotor',
  category: 'Mando y potencia',
  icon: '🛡️',
  short: 'Interruptor que protege al motor contra sobrecargas (térmico) y cortocircuitos (magnético). Se regula a la corriente del motor.',
  camera: [6, 4, 15],
  target: [0, 0, 0],
  shadowY: -5.0,
  defaultParams: { state: 'on', setting: 5.5, cause: null },
  render: (p) => <MotorBreakerModel state={p.state} setting={p.setting} cause={p.cause} />,
  Controls: BreakerControls,
  parts: [
    { id: 'carcasa', name: 'Carcasa', desc: 'Caja aislante de 45 mm de ancho, del mismo alto de “ventana” que los contactores, para armar arrancadores compactos guardamotor + contactor sobre el riel DIN.' },
    { id: 'manija', name: 'Manija giratoria (I / O / TRIP)', desc: 'Se gira a I para conectar y a O para desconectar. Si el guardamotor dispara solo, la manija queda en TRIP: así se ve desde afuera que hubo una falla. Muchas se pueden trabar con candado en O para trabajar seguro.' },
    { id: 'regulacion', name: 'Dial de regulación y botón TEST', desc: 'Con un destornillador se ajusta la corriente Ir del disparo térmico a la corriente nominal del motor (la de la chapa característica). El botón TEST simula un disparo para probar el mecanismo.' },
    { id: 'mecanismo', name: 'Mecanismo de disparo libre', desc: 'Cerrojo con resorte que mantiene cerrados los contactos. Cuando el térmico o el magnético empujan la barra de disparo, el cerrojo se suelta y los contactos se abren de golpe, aunque alguien sostenga la manija en I (“disparo libre”).' },
    { id: 'contactos', name: 'Contactos principales', desc: 'Tres polos con doble interrupción (puente móvil y pastillas de plata). Abren las tres fases a la vez, tanto a mano como por disparo.' },
    { id: 'camaras', name: 'Cámaras apagachispas', desc: 'Pilas de placas de acero que dividen el arco eléctrico en muchos arcos cortos para enfriarlo y apagarlo en milisegundos. Así el guardamotor puede cortar corrientes de cortocircuito muy grandes.' },
    { id: 'disparoMagnetico', name: 'Disparadores magnéticos', desc: 'Una bobina de pocas vueltas de alambre grueso por polo. Con corriente normal no hace nada; en un cortocircuito (unas 13 veces Ir) el campo es tan fuerte que atrae al núcleo y dispara al instante.' },
    { id: 'bimetales', name: 'Disparadores térmicos (bimetales)', desc: 'Dos metales soldados que se dilatan distinto, calentados por la corriente del motor. Si el motor consume más de lo regulado durante un tiempo (sobrecarga), se curvan y empujan la barra de disparo. Funcionan como el relé térmico.' },
    { id: 'bornes', name: 'Bornes de potencia', desc: 'Arriba la línea (1/L1, 3/L2, 5/L3) y abajo la salida al contactor o al motor (2/T1, 4/T2, 6/T3).' },
    { id: 'auxiliar', name: 'Contacto auxiliar lateral (13-14 / 21-22)', desc: 'Bloque que se agrega al costado: un NA y un NC que copian el estado del guardamotor. Se usan para señalizar “disparo” o avisarle al LOGO! que el motor quedó sin protección (por ejemplo, el NA en serie con la bobina del contactor o a una entrada I).' },
    { id: 'riel', name: 'Riel DIN 35 mm', desc: 'Se monta en el mismo riel, normalmente justo a la izquierda o arriba del contactor que comanda el motor.' },
  ],
  theory: (
    <>
      <p>
        El <strong>guardamotor</strong> (interruptor automático de protección de motores) reúne en un solo aparato un
        seccionador con manija, una <strong>protección térmica</strong> regulable y una <strong>protección magnética</strong>.
      </p>
      <ul>
        <li>
          <strong>Térmica (sobrecarga)</strong>: bimetales que se curvan si el motor consume más corriente que la regulada
          (Ir) durante un tiempo: por ejemplo, si está muy cargado o le falta una fase. Cuanto mayor la sobrecarga, más
          rápido dispara.
        </li>
        <li>
          <strong>Magnética (cortocircuito)</strong>: bobinas que disparan en milisegundos cuando la corriente supera unas
          13 veces Ir.
        </li>
      </ul>
      <h4>¿Cómo se regula?</h4>
      <p>
        Se pone el dial en la <strong>corriente nominal del motor</strong> que figura en su chapa (para 380/400 V). Si se
        regula muy alto el motor no queda protegido; si se regula muy bajo dispara sin motivo.
      </p>
      <h4>Guardamotor + contactor + LOGO!</h4>
      <p>
        En un arranque directo automatizado, el guardamotor <strong>protege</strong>, el contactor{' '}
        <strong>conecta y desconecta</strong> el motor y el LOGO! <strong>decide</strong> cuándo (manejando la bobina del
        contactor). El contacto auxiliar del guardamotor puede entrar al LOGO! para avisar que hubo un disparo.
      </p>
      <p className="tip">Después de un disparo, antes de rearmar (O → I) hay que buscar la causa: motor trabado, falta de fase, cortocircuito en los cables…</p>
    </>
  ),
  activities: [
    { id: 'logo-gm-1', type: 'mc', q: '¿Qué parte del guardamotor actúa ante una sobrecarga (motor muy cargado)?', options: ['El disparador magnético', 'Los bimetales (térmico)', 'El contacto auxiliar', 'La manija'], answer: 1, explain: 'Los bimetales se calientan y se curvan si la corriente supera la regulada durante un tiempo.' },
    { id: 'logo-gm-2', type: 'mc', q: '¿Y ante un cortocircuito?', options: ['Los bimetales', 'El disparador magnético', 'Nadie: hace falta un fusible', 'El botón TEST'], answer: 1, explain: 'El magnético dispara al instante con corrientes muy altas.' },
    { id: 'logo-gm-3', type: 'num', q: 'Un motor tiene en su chapa 5,2 A a 400 V. ¿En cuántos amperes regulás el guardamotor?', answer: 5.2, tolerance: 0.02, unit: 'A', explain: 'Se regula a la corriente nominal del motor.' },
    { id: 'logo-gm-4', type: 'mc', q: 'La manija quedó en la posición TRIP. ¿Qué significa?', options: ['Que está encendido', 'Que disparó por una falla', 'Que está mal instalado', 'Que falta el neutro'], answer: 1, explain: 'TRIP indica que el guardamotor se abrió solo por un disparo térmico o magnético.' },
    { id: 'logo-gm-5', type: 'mc', q: 'En un tablero con LOGO!, guardamotor y contactor, ¿quién conecta y desconecta el motor en cada arranque?', options: ['El guardamotor', 'El contactor, comandado por el LOGO!', 'El LOGO! directamente', 'El riel DIN'], answer: 1, explain: 'El contactor maniobra; el guardamotor sólo protege y sirve para seccionar.' },
  ],
}

export const LOGO_CATALOG: ComponentDef[] = [logo, contactor, pulsadores, guardamotor]
