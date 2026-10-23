import type { GameDef } from '../../games/registry'
import { QuizGame, shuffle, type QuizRound } from '../../games/QuizGame'
import { PartsGame } from '../../games/PartsGame'

const mk = (prompt: string, emoji: string, ok: string, wrong: string[], explain?: string): QuizRound => ({
  prompt,
  visual: <span className="quiz-emoji">{emoji}</span>,
  options: shuffle([ok, ...wrong]).map((x) => ({ id: x, label: x })),
  answer: ok,
  explain,
})

/* ------------------------------------------------------------------ elegí la lima */

const LIMA_CASES: [string, string, string, string[], string][] = [
  ['Tenés que agrandar un agujero redondo de 12 mm.', '⭕', 'Lima redonda', ['Lima plana', 'Lima cuadrada', 'Lima triangular'], 'Su sección circular entra en el agujero.'],
  ['Hay que hacer un chavetero (ranura cuadrada) en un eje.', '⬛', 'Lima cuadrada', ['Lima redonda', 'Media caña', 'Escofina'], 'Indispensable para ranuras y agujeros cuadrados.'],
  ['Hay que limar el ángulo interno de una escuadra.', '📐', 'Lima triangular', ['Lima redonda', 'Lima plana grande', 'Escofina'], 'Caras a 60°: entra en ángulos agudos.'],
  ['Hay que pasar de una cara plana a una curva cóncava.', '🌙', 'Media caña', ['Cuadrada', 'Triangular', 'Redonda chica'], 'Tiene una cara plana y otra curva.'],
  ['Hay que dejar plana una cara exterior grande de una barra de acero.', '▬', 'Lima plana de picado doble', ['Escofina', 'Lima redonda', 'Lima triangular de 4"'], 'Plana para superficies exteriores; doble para acero.'],
  ['Hay que dar forma a un mango de madera.', '🪵', 'Escofina', ['Lima plana extrafina', 'Lima triangular fina', 'Lima cuadrada'], 'Dientes individuales muy salientes para materiales blandos.'],
  ['Hay que limar una pieza de aluminio sin que se empaste la lima.', '🥫', 'Picado simple', ['Picado doble extrafino', 'Escofina', 'Cualquiera'], 'El simple evita que el material blando se clave en los dientes.'],
  ['Hay que sacar 3 mm de material rápido para acercarse a la medida.', '⚡', 'Lima basta (gruesa)', ['Lima extrafina', 'Lima fina con tiza', 'Tela esmeril'], 'Desbastado: pocos dientes grandes.'],
  ['La pieza ya está a medida: hay que dejarla lisa y brillante.', '✨', 'Lima fina con tiza', ['Lima basta', 'Escofina', 'Lima bastarda sin tiza'], 'Pulido: lima fina, tiza en el picado y poca presión.'],
  ['La superficie a limar mide 15 cm de largo.', '📏', 'Una lima de 10"', ['Una lima de 3"', 'Una de 20"', 'Una de 4"'], 'Ni muy chica (acabado irregular) ni muy grande (sin control).'],
  ['Una pieza diminuta de 2 cm.', '🔩', 'Una lima chica de 4" o 6"', ['Una lima de 20"', 'Una de 14"', 'Una escofina grande'], 'Una lima enorme se tambalea y se pierde el control.'],
  ['Hay que limar dentro de un agujero ciego.', '🕳️', 'Una lima pequeña de perfil adecuado', ['La lima más grande', 'Una escofina', 'Una lima de 14" plana'], 'Tiene que entrar y dejar controlar el movimiento.'],
]

/* ------------------------------------------------------------------ ciclo del martillo */

const CICLO: [string, string, string, string[], string?][] = [
  ['¿Qué se hace primero con la barra?', '🔢', 'Numerar las caras como un dado', ['Perforar el oblongo', 'Pulir', 'Cortar la peña'], 'Op. 10: las opuestas suman 7.'],
  ['Después de numerar las caras, ¿qué cara se lima?', '1️⃣', 'La cara 1, a lo largo, quitando la escoria', ['La cara 6', 'La peña', 'El ojo']],
  ['¿Con qué se controla la escuadra entre cara 1 y cara 2?', '📐', 'Escuadra de 90°', ['Gramil', 'Granete', 'Lima redonda']],
  ['¿Qué se hace después de limar las 6 caras?', '🎨', 'Pintar con sulfato de cobre y trazar', ['Colocar el cabo', 'Barnizar', 'Perforar sin trazar'], 'Op. 70.'],
  ['¿Con qué instrumento se trazan las líneas a 35, 45 y 55 mm?', '📏', 'Gramil sobre el mármol', ['Tijera', 'Martillo', 'Lima fina']],
  ['¿Cómo se marca la forma de la peña?', '📐', 'Con una diagonal entre la línea de 5 mm y la de 35 mm', ['A ojo', 'Con el granete solamente', 'No se marca']],
  ['¿Con qué se marcan los centros del oblongo?', '🎯', 'Granete', ['Gramil', 'Regla', 'Tiza']],
  ['¿Cómo se hace el ojo oblongo?', '🕳️', 'Mechas sucesivas en el taladro de banco y lima redonda', ['Con la sierra', 'Con lima plana', 'Golpeando con el martillo']],
  ['¿Con qué se corta el sobrante de la peña?', '🪚', 'Con la sierra, y se termina a lima', ['Con la tijera de hojalatero', 'Con el granete', 'Con la escofina']],
  ['¿Qué se hace al final del ciclo?', '🏁', 'Pulir, colocar el cabo y barnizar', ['Trazar', 'Numerar caras', 'Limar la cara 1']],
  ['¿Qué material tiene el martillo?', '🔩', 'Acero IRAM 1010', ['Aluminio', 'Bronce', 'Madera']],
  ['¿Qué medida tiene la barra?', '📏', '□22 × 95 mm', ['□10 × 50 mm', '□35 × 200 mm', '□22 × 35 mm']],
]

/* ------------------------------------------------------------------ técnica */

const TECNICA: [string, string, boolean, string][] = [
  ['Un alumno diestro se para con el pie izquierdo adelante.', '🦶', true, 'Diestro: pie izquierdo adelante.'],
  ['Hace fuerza tanto al empujar como al volver la lima.', '↔️', false, 'La presión va sólo en el avance; en el retorno se alivia.'],
  ['Lima con el codo formando unos 90°.', '💪', true, 'Así transmite bien la fuerza.'],
  ['Usa una lima sin mango porque "es un ratito".', '⚠️', false, 'La espiga puede clavarse en la mano.'],
  ['Frota tiza sobre la lima fina antes de pulir.', '🧂', true, 'Evita que las limaduras se claven y rayen.'],
  ['Desbasta con la lima extrafina para no rayar.', '🐢', false, 'El desbaste se hace con lima basta: la fina no avanza.'],
  ['Mueve la lima desde la cadera y los hombros, no sólo con los brazos.', '🧍', true, 'Es más eficiente y menos cansador.'],
  ['Lima toda la superficie siempre en la misma dirección.', '➡️', false, 'Se cambia de dirección en la segunda pasada (cruzado a 45°).'],
  ['La mano inhábil se apoya en la punta de la lima y presiona.', '✋', true, 'La hábil va en el mango.'],
  ['Pone la pieza en la morsa sobresaliendo mucho para "tener más lugar".', '🗜️', false, 'Si sobresale mucho, vibra.'],
  ['Controla con la regla metálica que la cara quede plana.', '📏', true, 'Así se controla el paralelismo.'],
  ['Limpia las limaduras soplando con la boca.', '😮‍💨', false, 'Pueden ir a los ojos: se limpia con un cepillo.'],
  ['Antes de perforar, marca el centro con el granete.', '🎯', true, 'La mecha no se desvía.'],
  ['Usa una lima de 20" para una pieza de 2 cm.', '📏', false, 'Una lima muy grande quita control.'],
]

export const AJUSTE1_GAMES: GameDef[] = [
  {
    id: 'a1-partes',
    title: '¿Qué parte es?',
    icon: '🔍',
    desc: 'La lima, el martillo, los instrumentos y la morsa despiezados en 3D: identificá la parte marcada.',
    max: '200',
    component: () => <PartsGame game="a1-partes" />,
  },
  {
    id: 'a1-lima',
    title: 'Elegí la lima justa',
    icon: '🪚',
    desc: 'Te cuentan un trabajo: elegí la forma, el tamaño, el picado o el grado de corte correcto.',
    max: '200',
    component: () => (
      <QuizGame
        game="a1-lima"
        title="Elegí la lima justa"
        icon="🪚"
        info="10 situaciones del taller. Rápido = más puntos."
        intro={<p>Forma según la geometría, tamaño según la superficie, picado según el material y grado según la etapa.</p>}
        makeRounds={() => shuffle(LIMA_CASES).slice(0, 10).map(([p, e, ok, w, ex]) => mk(p, e, ok, w, ex))}
      />
    ),
  },
  {
    id: 'a1-ciclo',
    title: 'El ciclo del martillo',
    icon: '🔨',
    desc: '¿Qué operación sigue? ¿Con qué herramienta? Repasá el ciclo de fabricación del martillo de peña.',
    max: '200',
    component: () => (
      <QuizGame
        game="a1-ciclo"
        title="El ciclo del martillo"
        icon="🔨"
        info="10 preguntas del ciclo de fabricación."
        intro={<p>De la barra en bruto al martillo terminado: operaciones, herramientas e instrumentos.</p>}
        makeRounds={() => shuffle(CICLO).slice(0, 10).map(([p, e, ok, w, ex]) => mk(p, e, ok, w, ex))}
      />
    ),
  },
  {
    id: 'a1-tecnica',
    title: '¿Bien o mal?',
    icon: '🧍',
    desc: 'Situaciones de limado en el taller: ¿la técnica es correcta?',
    max: '200',
    component: () => (
      <QuizGame
        game="a1-tecnica"
        title="¿Bien o mal?"
        icon="🧍"
        info="10 situaciones: decidí si está bien o mal."
        intro={<p>Postura, agarre, presión, dirección y seguridad.</p>}
        makeRounds={() =>
          shuffle(TECNICA)
            .slice(0, 10)
            .map(([s, e, ok, ex]) => ({
              prompt: s,
              visual: <span className="quiz-emoji">{e}</span>,
              options: [
                { id: 'bien', label: '✔ Está bien' },
                { id: 'mal', label: '✘ Está mal' },
              ],
              answer: ok ? 'bien' : 'mal',
              explain: ex,
            }))
        }
      />
    ),
  },
]
