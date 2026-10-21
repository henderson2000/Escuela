import type { ComponentDef, Params, PartInfo } from '../catalog/types'
import { Field, Readout, Segmented, Toggle } from '../components/ui'
import { LOGO_PROGRAMS, LogoModel, logoIO, logoInputs, logoOutputs, useLogoIO, type LogoProgram } from '../three/models/Logo'

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
      <Field label="Entradas (tocá para dar o quitar tensión)">
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
      </Field>
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

export const LOGO_CATALOG: ComponentDef[] = [logo]
