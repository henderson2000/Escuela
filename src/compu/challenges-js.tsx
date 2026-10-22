// Desafíos de JavaScript (consola y página). Ver el formato en course/js.tsx.
import { lines, type DomLesson, type JsLesson } from './types'

export const JS_CHALLENGES: (JsLesson | DomLesson)[] = [
  {
    id: 'dj-tabla',
    kind: 'js',
    title: 'Tabla de multiplicar',
    intro: <p>Pedí un número con prompt y mostrá su tabla de multiplicar del 1 al 10.</p>,
    task: (
      <p>
        Si responden <code>7</code>, la salida son 10 líneas con el formato <code>7 x 1 = 7</code> … <code>7 x 10 = 70</code>.
      </p>
    ),
    starter: 'const n = Number(prompt("Número:"));\n// tu código\n',
    solution: 'const n = Number(prompt("Número:"));\nfor (let i = 1; i <= 10; i++) {\n  console.log(n + " x " + i + " = " + n * i);\n}\n',
    sampleInput: '7',
    tests: [
      { text: 'Con 7: primera línea "7 x 1 = 7"', input: '7', check: (o) => lines(o)[0] === '7 x 1 = 7' },
      { text: 'Con 7: última línea "7 x 10 = 70"', input: '7', check: (o) => lines(o)[9] === '7 x 10 = 70' && lines(o).length === 10 },
      { text: 'Con 12: "12 x 5 = 60" en la quinta línea', input: '12', check: (o) => lines(o)[4] === '12 x 5 = 60' },
    ],
  },
]
