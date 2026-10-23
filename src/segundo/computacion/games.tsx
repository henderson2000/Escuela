import type { GameDef } from '../../games/registry'
import { QuizGame, pickOne, shuffle, type QuizRound } from '../../games/QuizGame'
import { PartsGame } from '../../games/PartsGame'
import { run } from './pseudo/interpreter'

const mk = (prompt: string, emoji: string, ok: string, wrong: string[], explain?: string): QuizRound => ({
  prompt,
  visual: <span className="quiz-emoji">{emoji}</span>,
  options: shuffle([ok, ...new Set(wrong.filter((w) => w !== ok))].slice(0, 4)).map((x) => ({ id: x, label: x })),
  answer: ok,
  explain,
})

/* ------------------------------------------------------------------ redes */

const REDES: [string, string, string, string[], string][] = [
  ['La red de computadoras del laboratorio de la escuela.', '🏫', 'LAN', ['MAN', 'WAN', 'No es una red'], 'Área local: un edificio.'],
  ['Una red que une las oficinas de la municipalidad en toda la ciudad.', '🏙️', 'MAN', ['LAN', 'WAN', 'Bus'], 'Área metropolitana.'],
  ['Internet.', '🌎', 'WAN', ['LAN', 'MAN', 'Anillo'], 'La red de área amplia más grande.'],
  ['Todos los nodos se conectan a un switch central.', '⭐', 'Topología estrella', ['Topología bus', 'Topología anillo', 'WAN'], 'Si se corta un cable, sólo queda afuera ese nodo.'],
  ['Todos los nodos cuelgan de un único cable troncal.', '➖', 'Topología bus', ['Topología estrella', 'Topología anillo', 'MAN'], 'Si se corta el troncal, se cae la red.'],
  ['Cada nodo se conecta con el siguiente y el último con el primero.', '⭕', 'Topología anillo', ['Topología bus', 'Topología estrella', 'LAN'], 'Los datos dan la vuelta.'],
  ['Identifica de forma única a cada nodo de la red.', '🏷️', 'La dirección IP', ['El enlace', 'El protocolo TCP', 'La topología'], 'Por ejemplo 192.168.0.10.'],
  ['Garantiza que los datos lleguen completos y en orden.', '📦', 'TCP', ['IP', 'Wi-Fi', 'PNG'], 'IP transmite; TCP asegura la entrega.'],
  ['Un nodo que da servicios a otros (archivos, páginas).', '🗄️', 'Servidor', ['Cliente', 'Enlace', 'Protocolo'], 'El que pide es el cliente.'],
  ['Un cable de fibra óptica entre dos edificios.', '🧵', 'Un enlace', ['Un nodo', 'Un protocolo', 'Una IP'], 'También el cobre o el Wi-Fi.'],
  ['Varias computadoras usan la misma impresora.', '🖨️', 'Compartir recursos', ['Escalabilidad', 'Acceso remoto', 'Topología'], 'Una ventaja de las redes.'],
  ['Desde tu casa abrís un archivo que está en la compu de la escuela.', '🏠', 'Acceso remoto', ['Compartir recursos', 'Centralización', 'Escalabilidad'], 'Flexibilidad y movilidad.'],
  ['La red crece: se agregan 20 computadoras nuevas.', '📈', 'Escalabilidad', ['Acceso remoto', 'Protocolo', 'Topología bus'], 'La red se adapta.'],
  ['Una red donde el usuario no nota que hay varios equipos.', '🫥', 'Sistema distribuido', ['Red en bus', 'Maestro/esclavo', 'LAN'], 'La división es invisible para el usuario.'],
]

/* ------------------------------------------------------------------ ¿qué muestra? */

function pseudoRound(): QuizRound {
  const k = Math.floor(Math.random() * 5)
  let src = ''
  const a = 2 + Math.floor(Math.random() * 8)
  const b = 2 + Math.floor(Math.random() * 8)
  if (k === 0) src = `a <- ${a}\nb <- ${b}\na <- a + b\nEscribir a * 2`
  else if (k === 1) src = `x <- ${a}\nSi x MOD 2 = 0 Entonces\n    Escribir "par"\nSiNo\n    Escribir "impar"\nFinSi`
  else if (k === 2) src = `s <- 0\nPara i <- 1 Hasta ${Math.min(a, 6)} Hacer\n    s <- s + i\nFinPara\nEscribir s`
  else if (k === 3) src = `c <- ${a}\nMientras c > ${Math.max(0, a - 3)} Hacer\n    c <- c - 1\nFinMientras\nEscribir c`
  else src = `n <- ${a}\nSi n > ${b} Y n < 9 Entonces\n    Escribir "sí"\nSiNo\n    Escribir "no"\nFinSi`
  const full = `Algoritmo juego\n${src}\nFinAlgoritmo`
  const ok = run(full, []).output.join(' ')
  const wrong =
    k === 1 || k === 4
      ? [k === 1 ? (ok === 'par' ? 'impar' : 'par') : ok === 'sí' ? 'no' : 'sí', 'Da error', 'No muestra nada']
      : [String(Number(ok) + 1), String(Number(ok) - 1), String(Number(ok) * 2), String(Number(ok) + 2)]
  return {
    prompt: '¿Qué muestra este pseudocódigo?',
    visual: <pre className="c2-code-q">{src}</pre>,
    options: shuffle([ok, ...shuffle(wrong.filter((w) => w !== ok)).slice(0, 3)]).map((x) => ({ id: x, label: x })),
    answer: ok,
    explain: 'Seguilo línea por línea anotando el valor de cada variable (prueba de escritorio).',
  }
}

/* ------------------------------------------------------------------ imagen */

function imagenRound(): QuizRound {
  const k = Math.floor(Math.random() * 4)
  if (k === 0) {
    const w = pickOne([10, 20, 50, 100])
    const h = pickOne([10, 20, 40])
    return mk(`Una imagen de ${w} × ${h}. ¿Cuántos píxeles tiene?`, '🟩', `${w * h}`, [`${w + h}`, `${w * h * 3}`, `${(w * h) / 2}`], `${w} × ${h}.`)
  }
  if (k === 1) {
    const w = pickOne([10, 20, 100])
    const bytes = pickOne([1, 3])
    return mk(`${w} × ${w} píxeles con ${bytes * 8} bits por píxel, sin comprimir. ¿Bytes?`, '💾', `${w * w * bytes}`, [`${w * w * bytes * 8}`, `${w * w * (bytes === 1 ? 3 : 1)}`, `${w * 2 * bytes}`], `${w * w} píxeles × ${bytes} byte(s).`)
  }
  if (k === 2)
    return pickOne([
      mk('Un logo que va encima de una foto, con fondo transparente.', '🔲', 'PNG', ['JPEG', 'BMP', 'TXT'], 'PNG admite transparencia.'),
      mk('Cien fotos de la excursión para mandar por mensaje.', '📸', 'JPEG', ['PNG', 'BMP', 'TXT'], 'Comprime mucho.'),
      mk('Una captura de pantalla con texto que tiene que verse nítido.', '🖥️', 'PNG', ['JPEG', 'MP3', 'TXT'], 'Comprime sin perder calidad.'),
    ])
  return pickOne([
    mk('¿Qué es un píxel?', '🧱', 'El punto más pequeño de una imagen digital', ['Un formato de imagen', 'Un tipo de cable', 'Una red'], 'El "ladrillo" de la imagen.'),
    mk('Con más resolución, una foto…', '🔍', 'Se ve más nítida pero ocupa más', ['Ocupa menos', 'Se ve borrosa', 'Pierde colores'], 'Más píxeles, más bytes.'),
    mk('¿Qué tres colores mezcla cada píxel de la pantalla?', '🌈', 'Rojo, verde y azul', ['Rojo, amarillo y azul', 'Blanco y negro', 'Cian y magenta'], 'RGB.'),
    mk('Comprimir una imagen en JPEG…', '🗜️', 'Achica el archivo y puede perder algo de calidad', ['Agranda el archivo', 'Agrega transparencia', 'Sube la resolución'], 'Equilibrio entre calidad y espacio.'),
  ])
}

export const COMPU2_GAMES: GameDef[] = [
  {
    id: 'c2-partes',
    title: '¿Qué parte es?',
    icon: '🔍',
    desc: 'El modelo de Von Neumann, la red y la pantalla en 3D: identificá la parte marcada.',
    max: '200',
    component: () => <PartsGame game="c2-partes" />,
  },
  {
    id: 'c2-redes',
    title: 'Redes',
    icon: '🌐',
    desc: 'LAN, MAN o WAN; estrella, bus o anillo; nodos, enlaces, protocolos y ventajas.',
    max: '200',
    component: () => (
      <QuizGame
        game="c2-redes"
        title="Redes"
        icon="🌐"
        info="10 situaciones. Rápido = más puntos."
        intro={<p>Tipos de redes, topologías y componentes.</p>}
        makeRounds={() => shuffle(REDES).slice(0, 10).map(([p, e, ok, w, ex]) => mk(p, e, ok, w, ex))}
      />
    ),
  },
  {
    id: 'c2-pseudo',
    title: '¿Qué muestra?',
    icon: '🧾',
    desc: 'Pseudocódigos cortos con números distintos cada vez: hacé la prueba de escritorio.',
    max: '200',
    component: () => (
      <QuizGame
        game="c2-pseudo"
        title="¿Qué muestra?"
        icon="🧾"
        info="10 programas cortos."
        intro={<p>Seguí cada línea y anotá cuánto vale cada variable.</p>}
        makeRounds={() => Array.from({ length: 10 }, pseudoRound)}
      />
    ),
  },
  {
    id: 'c2-imagen',
    title: 'Imagen digital',
    icon: '🖼️',
    desc: 'Píxeles, resolución, bytes y formatos.',
    max: '200',
    component: () => (
      <QuizGame
        game="c2-imagen"
        title="Imagen digital"
        icon="🖼️"
        info="10 preguntas."
        intro={<p>bytes = ancho × alto × bits ÷ 8 · JPEG comprime · PNG admite transparencia.</p>}
        makeRounds={() => Array.from({ length: 10 }, imagenRound)}
      />
    ),
  },
]
