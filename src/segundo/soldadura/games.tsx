import type { GameDef } from '../../games/registry'
import { QuizGame, pickOne, shuffle, type QuizRound } from '../../games/QuizGame'
import { PartsGame } from '../../games/PartsGame'
import { filtroDin } from '../../three/models/segundo/Soldadura'

const mk = (prompt: string, emoji: string, ok: string, wrong: string[], explain?: string): QuizRound => ({
  prompt,
  visual: <span className="quiz-emoji">{emoji}</span>,
  options: shuffle([ok, ...wrong]).map((x) => ({ id: x, label: x })),
  answer: ok,
  explain,
})

const f = (n: number) => Number(n.toFixed(2)).toString().replace('.', ',')

/* ------------------------------------------------------------------ ¿bien o mal? */

const SEGURIDAD: [string, string, boolean, string][] = [
  ['Suelda con guantes de cuero secos y en buen estado.', '🧤', true, 'Ropa seca y guantes sanos: regla contra descargas.'],
  ['Usa un cable con la aislación rota "porque todavía anda".', '⚠️', false, 'Nunca se usan cables rotos o dañados.'],
  ['Mueve la máquina encendida a otro lugar.', '🔌', false, 'Hay que desconectarla antes de moverla.'],
  ['Conecta la pinza de masa cerca de la zona a soldar.', '🧲', true, 'Así la corriente no recorre grandes distancias.'],
  ['Mira el arco un segundo sin máscara para ver si prendió.', '👀', false, 'Las radiaciones invisibles dañan la vista enseguida.'],
  ['Pica la escoria con lentes de seguridad puestos.', '🥽', true, 'Una partícula puede lastimar gravemente un ojo.'],
  ['Suelda al lado de unos aerosoles de pintura.', '🧯', false, 'Pueden explotar o formar gases tóxicos.'],
  ['Tiene un matafuego a mano en el puesto de soldadura.', '🧯', true, 'Para casos de emergencia.'],
  ['Le presta su máscara a un compañero y se queda mirando sin protección.', '🤝', false, 'El equipo es personal y nadie mira sin protección.'],
  ['Suelda en un lugar cerrado sin ventilación.', '💨', false, 'Hace falta ventilación o aspiración de humos.'],
  ['Usa ropa de lana y cuero.', '🧥', true, 'Resisten la llama.'],
  ['La máquina falla y la abre para arreglarla él mismo.', '🔧', false, 'Se avisa al responsable del sector.'],
  ['Coloca biombos para proteger a los compañeros de los destellos.', '🧱', true, 'Las radiaciones también dañan a los de alrededor.'],
  ['Toca el electrodo mientras está apoyado en la pieza.', '✋', false, 'Está eléctricamente vivo.'],
  ['Pisa sobre una tarima seca y aislante.', '🪵', true, 'Se aísla de la pieza y de tierra.'],
  ['Cambia el vidrio transparente de la máscara cuando está salpicado.', '🪟', true, 'Protege al vidrio inactínico.'],
]

/* ------------------------------------------------------------------ electrodo e intensidad */

function electrodoRound(): QuizRound {
  const k = Math.floor(Math.random() * 4)
  const d = pickOne([2, 2.5, 3.25, 4, 5])
  if (k === 0) {
    const lo = Math.round(35 * d)
    const hi = Math.round(40 * d)
    return mk(`Electrodo de ${f(d)} mm. ¿Entre qué valores regulás la intensidad?`, '🎛️', `${lo} – ${hi} A`, [`${Math.round(lo / 2)} – ${Math.round(hi / 2)} A`, `${lo * 2} – ${hi * 2} A`, `${Math.round(10 * d)} – ${Math.round(15 * d)} A`], `35 a 40 A por mm: ${f(d)} × 35 y ${f(d)} × 40.`)
  }
  if (k === 1) {
    const a = pickOne([60, 90, 120, 150, 200, 250, 320, 400])
    const din = filtroDin(a).din
    return mk(`Soldás con ${a} A. ¿Qué filtro DIN usás?`, '🥽', `DIN ${din}`, [10, 11, 12, 13].filter((x) => x !== din).map((x) => `DIN ${x}`), `Tabla: 40–79 A → 10 · 80–174 A → 11 · 175–299 A → 12 · 300–499 A → 13.`)
  }
  if (k === 2) {
    const a = pickOne([80, 100, 130, 160])
    const ok = a / 40
    return mk(`Tenés que soldar con ${a} A como máximo (40 A/mm). ¿Qué diámetro de electrodo?`, '🥢', `${f(ok)} mm`, [`${f(ok * 2)} mm`, `${f(ok / 2)} mm`, `${f(ok + 1.5)} mm`], `${a} / 40 = ${f(ok)} mm.`)
  }
  return mk(`Electrodo de ${f(d)} mm. ¿Qué longitud de arco mantenés?`, '📏', `Unos ${f(d)} mm`, [`Unos ${f(d * 3)} mm`, 'Cero: apoyado', `Unos ${f(d * 10)} mm`], 'Aproximadamente igual al diámetro.')
}

/* ------------------------------------------------------------------ defectos */

const DEFECTOS: [string, string, string, string[], string][] = [
  ['Muchas salpicaduras y mordeduras a los costados del cordón.', '💥', 'Intensidad demasiado alta', ['Intensidad baja', 'Avance lento', 'Arco corto'], 'Hay que bajar la intensidad.'],
  ['El arco se apaga y el cordón queda fino, sin fundir la pieza.', '🕯️', 'Intensidad baja', ['Intensidad alta', 'Ángulo de 90°', 'Filtro oscuro'], 'Falta de fusión.'],
  ['El electrodo se pega a la pieza a cada rato.', '🧲', 'Arco demasiado corto', ['Arco largo', 'Intensidad alta', 'Avance rápido'], 'También puede quedar escoria atrapada.'],
  ['Gotas gruesas, poca penetración y bordes desparejos.', '🌧️', 'Arco demasiado largo', ['Arco corto', 'Intensidad justa', 'Pinza de masa cerca'], 'Mantener el arco igual al diámetro.'],
  ['El cordón se ensancha en algunos lugares.', '〰️', 'Pausas en la velocidad de avance', ['Avance constante', 'Intensidad baja', 'Electrodo fino'], 'Cada pausa deja más material.'],
  ['El cordón queda angosto y con poco material.', '➖', 'Avance demasiado rápido', ['Avance lento', 'Arco corto', 'Intensidad alta'], 'Se apuró el avance.'],
  ['Poca penetración y un charco enorme; en chapa fina se perfora.', '📐', 'Ángulo de electrodo menor a 45°', ['Ángulo de 70°', 'Arco corto', 'Escoria picada'], 'Acercar el electrodo a la vertical aumenta la penetración.'],
  ['El arco se desvía hacia un costado, sobre todo cerca del borde.', '🧭', 'Soplo magnético', ['Electrodo húmedo', 'Filtro claro', 'Mesa con ranuras'], 'Mover la masa, inclinar el electrodo o usar alterna.'],
  ['Se perforó la chapa fina con un electrodo muy grueso.', '🕳️', 'Demasiado calor por el diámetro del electrodo', ['Electrodo muy fino', 'Arco corto', 'Avance rápido'], 'Un electrodo grande calienta más la pieza.'],
  ['No se ve bien el cordón: está cubierto por una capa oscura y vidriosa.', '🪨', 'Falta sacar la escoria', ['Intensidad alta', 'Es el revestimiento sin fundir', 'Es óxido normal'], 'Se saca con piqueta y cepillo de acero.'],
  ['La primera pasada de una junta en V no penetró en el vértice.', '🔻', 'Se usó un electrodo demasiado grueso en la raíz', ['Se usó uno fino', 'El filtro era claro', 'La masa estaba cerca'], 'La primera pasada va con diámetro menor.'],
  ['Hay escoria atrapada dentro del cordón.', '⚫', 'Arco demasiado corto o ángulo incorrecto', ['Arco largo solamente', 'Velocidad constante', 'Buena limpieza'], 'Y hay que limpiar bien antes de cada pasada.'],
]

export const SOLDADURA2_GAMES: GameDef[] = [
  {
    id: 's2-partes',
    title: '¿Qué parte es?',
    icon: '🔍',
    desc: 'El equipo, el electrodo, el cordón, la protección personal y las uniones en 3D: identificá la parte marcada.',
    max: '200',
    component: () => <PartsGame game="s2-partes" />,
  },
  {
    id: 's2-seguridad',
    title: '¿Seguro o peligroso?',
    icon: '⚠️',
    desc: 'Situaciones del taller de soldadura: ¿está bien o mal?',
    max: '200',
    component: () => (
      <QuizGame
        game="s2-seguridad"
        title="¿Seguro o peligroso?"
        icon="⚠️"
        info="10 situaciones: decidí si está bien o mal."
        intro={<p>Descargas, radiaciones, humos, fuego, chispas y protección personal.</p>}
        makeRounds={() =>
          shuffle(SEGURIDAD)
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
  {
    id: 's2-electrodo',
    title: 'Electrodo, amperes y filtro',
    icon: '🎛️',
    desc: 'Intensidad según el diámetro, filtro DIN según la intensidad y longitud de arco. Números distintos cada vez.',
    max: '200',
    component: () => (
      <QuizGame
        game="s2-electrodo"
        title="Electrodo, amperes y filtro"
        icon="🎛️"
        info="10 preguntas rápidas."
        intro={<p>35 a 40 A por mm · DIN 10, 11, 12 o 13 según los amperes · arco ≈ diámetro.</p>}
        makeRounds={() => Array.from({ length: 10 }, electrodoRound)}
      />
    ),
  },
  {
    id: 's2-defectos',
    title: '¿Qué salió mal?',
    icon: '🔎',
    desc: 'Te muestran cómo quedó el cordón: encontrá la causa.',
    max: '200',
    component: () => (
      <QuizGame
        game="s2-defectos"
        title="¿Qué salió mal?"
        icon="🔎"
        info="10 cordones con problemas."
        intro={<p>Intensidad, longitud de arco, velocidad, ángulo y diámetro.</p>}
        makeRounds={() => shuffle(DEFECTOS).slice(0, 10).map(([p, e, ok, w, ex]) => mk(p, e, ok, w, ex))}
      />
    ),
  },
]
