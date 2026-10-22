// Desafíos con puntos (juego "Desafíos de código"). Cada uno es como una lección, pero sin pistas largas.
import { lines, type Lesson } from './types'

import { WEB_CHALLENGES } from './challenges-web'
import { JAVA_CHALLENGES } from './challenges-java'

const BASE: Lesson[] = [
  {
    id: 'd-tabla',
    kind: 'java',
    title: 'Tabla de multiplicar',
    intro: <p>Leé un número entero y mostrá su tabla de multiplicar del 1 al 10.</p>,
    task: (
      <p>
        Si la entrada es <code>7</code>, la salida tiene que ser 10 líneas con el formato <code>7 x 1 = 7</code> … <code>7 x 10 = 70</code>.
      </p>
    ),
    starter: 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        // tu código\n    }\n}\n',
    solution:
      'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        for (int i = 1; i <= 10; i++) {\n            System.out.println(n + " x " + i + " = " + (n * i));\n        }\n    }\n}\n',
    sampleInput: '7',
    tests: [
      { text: 'Con 7: primera línea "7 x 1 = 7"', input: '7', check: (o) => lines(o)[0] === '7 x 1 = 7' },
      { text: 'Con 7: última línea "7 x 10 = 70"', input: '7', check: (o) => lines(o)[9] === '7 x 10 = 70' && lines(o).length === 10 },
      { text: 'Con 12: "12 x 5 = 60" en la quinta línea', input: '12', check: (o) => lines(o)[4] === '12 x 5 = 60' },
    ],
  },
  {
    id: 'd-tarjeta',
    kind: 'web',
    title: 'Tarjeta de presentación',
    intro: <p>Armá una tarjeta con tu nombre y tu curso.</p>,
    task: (
      <p>
        Un <code>div</code> con clase <code>tarjeta</code> que tenga adentro un <code>h2</code> con un nombre y un <code>p</code> con el curso.
        La tarjeta tiene que tener borde, esquinas redondeadas (<code>border-radius</code>) y un color de fondo.
      </p>
    ),
    edit: ['html', 'css'],
    starter: { html: '', css: '' },
    solution: {
      html: '<div class="tarjeta">\n  <h2>Ana Pérez</h2>\n  <p>3ro B</p>\n</div>\n',
      css: '.tarjeta {\n  border: 2px solid #333;\n  border-radius: 12px;\n  background: #e0f2fe;\n  padding: 16px;\n}\n',
    },
    tests: [
      { text: 'Hay un div con clase "tarjeta"', test: (c) => !!c.$('div.tarjeta') },
      { text: 'Adentro hay un h2 con texto', test: (c) => c.text('.tarjeta h2').length > 0 },
      { text: 'Adentro hay un p con texto', test: (c) => c.text('.tarjeta p').length > 0 },
      { text: 'La tarjeta tiene borde', test: (c) => parseFloat(c.style('.tarjeta', 'border-top-width')) > 0 && c.style('.tarjeta', 'border-top-style') !== 'none' },
      { text: 'Tiene esquinas redondeadas', test: (c) => parseFloat(c.style('.tarjeta', 'border-top-left-radius')) > 0 },
      { text: 'Tiene color de fondo', test: (c) => !/rgba\(0, 0, 0, 0\)|transparent/.test(c.style('.tarjeta', 'background-color')) },
    ],
  },
]

/** todos los desafíos, alternando un poco los de web y Java */
export const CHALLENGES: Lesson[] = (() => {
  const web = [BASE[1], ...WEB_CHALLENGES]
  const java = [BASE[0], ...JAVA_CHALLENGES]
  const out: Lesson[] = []
  for (let i = 0; i < Math.max(web.length, java.length); i++) {
    if (java[i]) out.push(java[i])
    if (web[i]) out.push(web[i])
  }
  return out
})()
