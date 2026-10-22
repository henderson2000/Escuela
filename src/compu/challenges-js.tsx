// Desafíos de JavaScript (consola y página). Ver el formato en course/js.tsx.
import { codeOnly, lines, type DomLesson, type JsLesson } from './types'

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
  {
    id: 'dj-fizzbuzz',
    kind: 'js',
    title: 'FizzBuzz',
    intro: <p>El clásico de las entrevistas de programación.</p>,
    task: (
      <p>
        Pedí un número <code>n</code> con prompt y mostrá, una por línea, los números del <b>1 al n</b>. Pero si el número es múltiplo de 3
        mostrá <code>Fizz</code>, si es múltiplo de 5 mostrá <code>Buzz</code> y si es múltiplo de 3 y de 5 a la vez mostrá{' '}
        <code>FizzBuzz</code>.
      </p>
    ),
    starter: 'const n = Number(prompt("Hasta qué número:"));\n// tu código\n',
    solution: 'const n = Number(prompt("Hasta qué número:"));\nfor (let i = 1; i <= n; i++) {\n  if (i % 15 === 0) {\n    console.log("FizzBuzz");\n  } else if (i % 3 === 0) {\n    console.log("Fizz");\n  } else if (i % 5 === 0) {\n    console.log("Buzz");\n  } else {\n    console.log(i);\n  }\n}\n',
    sampleInput: '15',
    tests: [
      { text: 'Con 5: 1, 2, Fizz, 4, Buzz', input: '5', check: (o) => lines(o).join(',') === '1,2,Fizz,4,Buzz' },
      { text: 'Con 15: 15 líneas y la última es FizzBuzz', input: '15', check: (o) => { const l = lines(o); return l.length === 15 && l[14] === 'FizzBuzz' && l[9] === 'Buzz' && l[8] === 'Fizz' && l[6] === '7' } },
      { text: 'Con 31: la línea 30 es FizzBuzz y la 31 es 31', input: '31', check: (o) => { const l = lines(o); return l.length === 31 && l[29] === 'FizzBuzz' && l[30] === '31' && l[26] === 'Fizz' && l[24] === 'Buzz' } },
    ],
  },
  {
    id: 'dj-primo',
    kind: 'js',
    title: '¿Es primo?',
    intro: <p>Un número primo es mayor que 1 y solo se puede dividir (sin resto) por 1 y por sí mismo.</p>,
    task: (
      <p>
        Pedí un número entero con prompt y mostrá <b>una sola línea</b>: <code>primo</code> si es primo, o <code>no es primo</code> si no
        lo es (el 0 y el 1 no son primos).
      </p>
    ),
    starter: 'const n = Number(prompt("Número:"));\n// tu código\n',
    solution: 'const n = Number(prompt("Número:"));\nlet primo = n > 1;\nfor (let d = 2; d * d <= n; d++) {\n  if (n % d === 0) {\n    primo = false;\n  }\n}\nif (primo) {\n  console.log("primo");\n} else {\n  console.log("no es primo");\n}\n',
    sampleInput: '7',
    tests: [
      { text: 'Con 7: primo', input: '7', check: (o) => lines(o).join('|') === 'primo' },
      { text: 'Con 9: no es primo', input: '9', check: (o) => lines(o).join('|') === 'no es primo' },
      { text: 'Con 2: primo', input: '2', check: (o) => lines(o).join('|') === 'primo' },
      { text: 'Con 1: no es primo', input: '1', check: (o) => lines(o).join('|') === 'no es primo' },
      { text: 'Con 97: primo', input: '97', check: (o) => lines(o).join('|') === 'primo' },
      { text: 'Con 91: no es primo', input: '91', check: (o) => lines(o).join('|') === 'no es primo' },
    ],
  },
  {
    id: 'dj-vocales',
    kind: 'js',
    title: 'Contar vocales',
    intro: <p>Recorré un texto letra por letra.</p>,
    task: (
      <p>
        Pedí una frase con prompt y mostrá <code>Vocales: N</code>, donde N es la cantidad de vocales. Cuentan las mayúsculas y las
        minúsculas, y también las vocales con tilde (<code>á é í ó ú</code>).
      </p>
    ),
    starter: 'const frase = prompt("Frase:");\n// tu código\n',
    solution: 'const frase = prompt("Frase:");\nlet n = 0;\nfor (const letra of frase.toLowerCase()) {\n  if ("aeiouáéíóú".includes(letra)) {\n    n++;\n  }\n}\nconsole.log("Vocales: " + n);\n',
    sampleInput: 'Hola Mundo',
    tests: [
      { text: 'Con "Hola Mundo": Vocales: 4', input: 'Hola Mundo', check: (o) => lines(o).join('|') === 'Vocales: 4' },
      { text: 'Con "ITS VILLADA": Vocales: 4', input: 'ITS VILLADA', check: (o) => lines(o).join('|') === 'Vocales: 4' },
      { text: 'Con "Computación y Electrónica": Vocales: 10', input: 'Computación y Electrónica', check: (o) => lines(o).join('|') === 'Vocales: 10' },
      { text: 'Con "xyz 123": Vocales: 0', input: 'xyz 123', check: (o) => lines(o).join('|') === 'Vocales: 0' },
    ],
  },
  {
    id: 'dj-mayor',
    kind: 'js',
    title: 'El mayor de todos',
    intro: <p>Primero te dicen cuántos números van a venir, y después llegan de a uno.</p>,
    task: (
      <p>
        Con el primer prompt pedí la <b>cantidad</b> de números. Después pedí esa cantidad de números (un prompt por número) y mostrá{' '}
        <code>Mayor: X</code>, con el más grande de todos. Los números pueden ser negativos.
      </p>
    ),
    starter: 'const cantidad = Number(prompt("¿Cuántos números?"));\n// tu código\n',
    solution: 'const cantidad = Number(prompt("¿Cuántos números?"));\nlet mayor = Number(prompt("Número:"));\nfor (let i = 1; i < cantidad; i++) {\n  const x = Number(prompt("Número:"));\n  if (x > mayor) {\n    mayor = x;\n  }\n}\nconsole.log("Mayor: " + mayor);\n',
    sampleInput: '4\n3\n18\n7\n12',
    tests: [
      { text: 'Con 4 números (3, 18, 7, 12): Mayor: 18', input: '4\n3\n18\n7\n12', check: (o) => lines(o).join('|') === 'Mayor: 18' },
      { text: 'Con 3 negativos (-5, -2, -9): Mayor: -2', input: '3\n-5\n-2\n-9', check: (o) => lines(o).join('|') === 'Mayor: -2' },
      { text: 'Con un solo número (42): Mayor: 42', input: '1\n42', check: (o) => lines(o).join('|') === 'Mayor: 42' },
      { text: 'Solo lee la cantidad pedida (2 números de 3 que hay: 5, 1, 99): Mayor: 5', input: '2\n5\n1\n99', check: (o) => lines(o).join('|') === 'Mayor: 5' },
    ],
  },
  {
    id: 'dj-notas',
    kind: 'js',
    title: 'Promedio y aprobados',
    intro: <p>La planilla de notas de un trimestre.</p>,
    task: (
      <>
        <p>
          Con el primer prompt pedí la <b>cantidad</b> de alumnos y después una nota por alumno. Mostrá <b>dos líneas</b>:
        </p>
        <ul>
          <li>
            <code>Promedio: X</code> con el promedio redondeado a <b>2 decimales</b> (con <code>toFixed(2)</code>);
          </li>
          <li>
            <code>Aprobados: N</code> con la cantidad de notas mayores o iguales a 6.
          </li>
        </ul>
      </>
    ),
    starter: 'const cantidad = Number(prompt("¿Cuántos alumnos?"));\n// tu código\n',
    solution: 'const cantidad = Number(prompt("¿Cuántos alumnos?"));\nlet suma = 0;\nlet aprobados = 0;\nfor (let i = 0; i < cantidad; i++) {\n  const nota = Number(prompt("Nota:"));\n  suma += nota;\n  if (nota >= 6) {\n    aprobados++;\n  }\n}\nconsole.log("Promedio: " + (suma / cantidad).toFixed(2));\nconsole.log("Aprobados: " + aprobados);\n',
    sampleInput: '4\n7\n5\n6\n9',
    tests: [
      { text: 'Con 7, 5, 6, 9: Promedio: 6.75 y Aprobados: 3', input: '4\n7\n5\n6\n9', check: (o) => lines(o).join('|') === 'Promedio: 6.75|Aprobados: 3' },
      { text: 'Con 4, 5, 8: Promedio: 5.67 y Aprobados: 1', input: '3\n4\n5\n8', check: (o) => lines(o).join('|') === 'Promedio: 5.67|Aprobados: 1' },
      { text: 'Con 10, 6: Promedio: 8.00 y Aprobados: 2', input: '2\n10\n6', check: (o) => lines(o).join('|') === 'Promedio: 8.00|Aprobados: 2' },
      { text: 'Con 5.5, 2, 3: Promedio: 3.50 y Aprobados: 0', input: '3\n5.5\n2\n3', check: (o) => lines(o).join('|') === 'Promedio: 3.50|Aprobados: 0' },
    ],
  },
  {
    id: 'dj-palindromo',
    kind: 'js',
    title: 'Palíndromos',
    intro: <p>Un palíndromo se lee igual al derecho y al revés, como «reconocer».</p>,
    task: (
      <p>
        Pedí una frase con prompt y mostrá <code>Es palíndromo</code> o <code>No es palíndromo</code>. No importan las mayúsculas ni los
        espacios: <code>Anita lava la tina</code> es palíndromo.
      </p>
    ),
    starter: 'const frase = prompt("Frase:");\n// tu código\n',
    solution: 'const frase = prompt("Frase:");\nconst limpia = frase.toLowerCase().split(" ").join("");\nconst alReves = limpia.split("").reverse().join("");\nif (limpia === alReves) {\n  console.log("Es palíndromo");\n} else {\n  console.log("No es palíndromo");\n}\n',
    sampleInput: 'reconocer',
    tests: [
      { text: 'Con "reconocer": Es palíndromo', input: 'reconocer', check: (o) => lines(o).join('|') === 'Es palíndromo' },
      { text: 'Con "Villada": No es palíndromo', input: 'Villada', check: (o) => lines(o).join('|') === 'No es palíndromo' },
      { text: 'Con "Anita lava la tina": Es palíndromo', input: 'Anita lava la tina', check: (o) => lines(o).join('|') === 'Es palíndromo' },
      { text: 'Con "Neuquen": Es palíndromo', input: 'Neuquen', check: (o) => lines(o).join('|') === 'Es palíndromo' },
      { text: 'Con "casa": No es palíndromo', input: 'casa', check: (o) => lines(o).join('|') === 'No es palíndromo' },
    ],
  },
  {
    id: 'dj-cajero',
    kind: 'js',
    title: 'Cajero automático',
    intro: <p>El cajero entrega billetes de $1000, $500, $200 y $100, y siempre la menor cantidad de billetes posible.</p>,
    task: (
      <>
        <p>Pedí un monto con prompt.</p>
        <ul>
          <li>
            Si no es mayor que 0 o no es múltiplo de 100, mostrá solo <code>Monto inválido</code>.
          </li>
          <li>
            Si no, mostrá <b>4 líneas</b>, de la más grande a la más chica, con el formato <code>1000: 3</code>, <code>500: 1</code>,{' '}
            <code>200: 0</code>, <code>100: 2</code> (también las que dan 0).
          </li>
        </ul>
      </>
    ),
    starter: 'const monto = Number(prompt("Monto:"));\n// tu código\n',
    solution: 'const monto = Number(prompt("Monto:"));\nif (monto <= 0 || monto % 100 !== 0) {\n  console.log("Monto inválido");\n} else {\n  let resto = monto;\n  const billetes = [1000, 500, 200, 100];\n  for (const b of billetes) {\n    const cant = Math.floor(resto / b);\n    resto = resto - cant * b;\n    console.log(b + ": " + cant);\n  }\n}\n',
    sampleInput: '3800',
    tests: [
      { text: 'Con 3800: 3, 1, 1, 1', input: '3800', check: (o) => lines(o).join('|') === '1000: 3|500: 1|200: 1|100: 1' },
      { text: 'Con 700: 0, 1, 1, 0', input: '700', check: (o) => lines(o).join('|') === '1000: 0|500: 1|200: 1|100: 0' },
      { text: 'Con 2400: 2, 0, 2, 0', input: '2400', check: (o) => lines(o).join('|') === '1000: 2|500: 0|200: 2|100: 0' },
      { text: 'Con 250: Monto inválido', input: '250', check: (o) => lines(o).join('|') === 'Monto inválido' },
      { text: 'Con 0: Monto inválido', input: '0', check: (o) => lines(o).join('|') === 'Monto inválido' },
    ],
  },
  {
    id: 'dj-contador',
    kind: 'dom',
    title: 'Contador de clics',
    intro: <p>Un contador con tres botones: sumar, restar y volver a cero.</p>,
    task: (
      <p>
        El número está en <code>#valor</code> y empieza en <code>0</code>. El botón <code>#mas</code> le suma 1, <code>#menos</code> le resta
        1 (puede quedar negativo) y <code>#reset</code> lo vuelve a 0.
      </p>
    ),
    edit: ['js'],
    starter: {
      html: '<h1>Contador</h1>\n<p id="valor">0</p>\n<button id="menos">−</button>\n<button id="mas">+</button>\n<button id="reset">Reset</button>\n',
      js: '// tu código\n',
    },
    solution: {
      html: '<h1>Contador</h1>\n<p id="valor">0</p>\n<button id="menos">−</button>\n<button id="mas">+</button>\n<button id="reset">Reset</button>\n',
      js: 'let n = 0;\nconst valor = document.getElementById("valor");\nfunction mostrar() {\n  valor.textContent = n;\n}\ndocument.getElementById("mas").addEventListener("click", function () {\n  n++;\n  mostrar();\n});\ndocument.getElementById("menos").addEventListener("click", function () {\n  n--;\n  mostrar();\n});\ndocument.getElementById("reset").addEventListener("click", function () {\n  n = 0;\n  mostrar();\n});\n',
    },
    tests: [
      { text: 'Empieza en 0', test: (c) => c.text('#valor') === '0' },
      { text: '3 veces + muestra 3', test: (c) => c.click('#mas') && c.click('#mas') && c.click('#mas') && c.text('#valor') === '3' },
      { text: '+ + − muestra 1', test: (c) => c.click('#mas') && c.click('#mas') && c.click('#menos') && c.text('#valor') === '1' },
      { text: '− − muestra -2', test: (c) => c.click('#menos') && c.click('#menos') && c.text('#valor') === '-2' },
      { text: 'Reset vuelve a 0 y se puede seguir contando', test: (c) => { for (let i = 0; i < 4; i++) c.click('#mas'); c.click('#reset'); const a = c.text('#valor'); c.click('#mas'); return a === '0' && c.text('#valor') === '1' } },
      { text: 'El programa no tiene errores', test: (c) => c.click('#mas') && c.errors.length === 0 },
    ],
  },
  {
    id: 'dj-imc',
    kind: 'dom',
    title: 'Calculadora de IMC',
    intro: <p>El índice de masa corporal es el peso (en kg) dividido la altura (en metros) al cuadrado.</p>,
    task: (
      <p>
        Al tocar <code>#calcular</code>, leé <code>#peso</code> y <code>#altura</code> y mostrá en <code>#resultado</code> el texto{' '}
        <code>IMC: X</code>, con X redondeado a <b>1 decimal</b> (con <code>toFixed(1)</code>). Si el peso o la altura no son mayores que
        0 (o están vacíos), mostrá <code>Datos inválidos</code>.
      </p>
    ),
    edit: ['js'],
    starter: {
      html: '<h1>IMC</h1>\n<label for="peso">Peso (kg)</label>\n<input id="peso" type="number">\n<label for="altura">Altura (m)</label>\n<input id="altura" type="number" step="0.01">\n<button id="calcular">Calcular</button>\n<p id="resultado"></p>\n',
      js: '// tu código\n',
    },
    solution: {
      html: '<h1>IMC</h1>\n<label for="peso">Peso (kg)</label>\n<input id="peso" type="number">\n<label for="altura">Altura (m)</label>\n<input id="altura" type="number" step="0.01">\n<button id="calcular">Calcular</button>\n<p id="resultado"></p>\n',
      js: 'document.getElementById("calcular").addEventListener("click", function () {\n  const peso = Number(document.getElementById("peso").value);\n  const altura = Number(document.getElementById("altura").value);\n  const res = document.getElementById("resultado");\n  if (peso > 0 && altura > 0) {\n    res.textContent = "IMC: " + (peso / (altura * altura)).toFixed(1);\n  } else {\n    res.textContent = "Datos inválidos";\n  }\n});\n',
    },
    tests: [
      { text: '70 kg y 1.75 m: IMC: 22.9', test: (c) => c.type('#peso', '70') && c.type('#altura', '1.75') && c.click('#calcular') && c.text('#resultado') === 'IMC: 22.9' },
      { text: '50 kg y 1.6 m: IMC: 19.5', test: (c) => c.type('#peso', '50') && c.type('#altura', '1.6') && c.click('#calcular') && c.text('#resultado') === 'IMC: 19.5' },
      { text: '90 kg y 1.8 m: IMC: 27.8', test: (c) => c.type('#peso', '90') && c.type('#altura', '1.8') && c.click('#calcular') && c.text('#resultado') === 'IMC: 27.8' },
      { text: 'Sin altura: Datos inválidos', test: (c) => c.type('#peso', '60') && c.click('#calcular') && c.text('#resultado') === 'Datos inválidos' },
      { text: 'Peso negativo: Datos inválidos', test: (c) => c.type('#peso', '-60') && c.type('#altura', '1.7') && c.click('#calcular') && c.text('#resultado') === 'Datos inválidos' },
      { text: 'Calcula de nuevo cada vez que se toca el botón', test: (c) => { c.type('#peso', '70'); c.type('#altura', '1.75'); c.click('#calcular'); c.type('#peso', '90'); c.type('#altura', '1.8'); c.click('#calcular'); return c.text('#resultado') === 'IMC: 27.8' } },
    ],
  },
  {
    id: 'dj-tareas',
    kind: 'dom',
    title: 'Lista de tareas',
    intro: <p>Una lista de pendientes que crece a medida que agregás tareas.</p>,
    task: (
      <>
        <p>
          Al tocar <code>#agregar</code>, agregá al final de la lista <code>#lista</code> un <code>li</code> con el texto escrito en{' '}
          <code>#nueva</code> (sin los espacios de los costados) y dejá el campo vacío.
        </p>
        <p>
          Si el texto está vacío (o son solo espacios) no se agrega nada. El párrafo <code>#cuenta</code> siempre muestra{' '}
          <code>Tareas: N</code> con la cantidad de tareas de la lista.
        </p>
      </>
    ),
    edit: ['js'],
    starter: {
      html: '<h1>Pendientes</h1>\n<input id="nueva" type="text">\n<button id="agregar">Agregar</button>\n<ul id="lista"></ul>\n<p id="cuenta">Tareas: 0</p>\n',
      js: '// tu código\n',
    },
    solution: {
      html: '<h1>Pendientes</h1>\n<input id="nueva" type="text">\n<button id="agregar">Agregar</button>\n<ul id="lista"></ul>\n<p id="cuenta">Tareas: 0</p>\n',
      js: 'const nueva = document.getElementById("nueva");\nconst lista = document.getElementById("lista");\nconst cuenta = document.getElementById("cuenta");\nlet total = 0;\n\ndocument.getElementById("agregar").addEventListener("click", function () {\n  const texto = nueva.value.trim();\n  if (texto === "") {\n    return;\n  }\n  const li = document.createElement("li");\n  li.textContent = texto;\n  lista.appendChild(li);\n  total++;\n  cuenta.textContent = "Tareas: " + total;\n  nueva.value = "";\n});\n',
    },
    tests: [
      { text: 'Al principio: lista vacía y "Tareas: 0"', test: (c) => c.$$('#lista li').length === 0 && c.text('#cuenta') === 'Tareas: 0' },
      { text: 'Agregar "Estudiar" crea un li con ese texto', test: (c) => c.type('#nueva', 'Estudiar') && c.click('#agregar') && c.$$('#lista li').map((l) => l.textContent).join('|') === 'Estudiar' },
      { text: 'Después de agregar, el campo queda vacío', test: (c) => c.type('#nueva', 'Estudiar') && c.click('#agregar') && (c.$('#nueva') as HTMLInputElement).value === '' },
      { text: 'Tres tareas en orden y "Tareas: 3"', test: (c) => { for (const t of ['Soldar', 'Programar', 'Entregar TP']) { c.type('#nueva', t); c.click('#agregar') } return c.$$('#lista li').map((l) => l.textContent).join('|') === 'Soldar|Programar|Entregar TP' && c.text('#cuenta') === 'Tareas: 3' } },
      { text: 'Saca los espacios de los costados', test: (c) => c.type('#nueva', '   Leer   ') && c.click('#agregar') && c.$('#lista li')?.textContent === 'Leer' },
      { text: 'No agrega tareas vacías ni de solo espacios', test: (c) => { c.click('#agregar'); c.type('#nueva', '    '); c.click('#agregar'); c.type('#nueva', 'Ok'); c.click('#agregar'); return c.$$('#lista li').length === 1 && c.text('#cuenta') === 'Tareas: 1' } },
    ],
  },
  {
    id: 'dj-adivina',
    kind: 'dom',
    title: 'Adiviná el número',
    intro: <p>El número secreto está guardado en el HTML, en el atributo <code>data-secreto</code> de <code>#juego</code>.</p>,
    task: (
      <>
        <p>
          Leé el secreto desde el atributo (no lo escribas en el JavaScript). Cada vez que se toque <code>#probar</code>, compará el número
          de <code>#intento</code> con el secreto y mostrá en <code>#pista</code>:
        </p>
        <ul>
          <li>
            <code>Más alto</code> si el intento es menor que el secreto;
          </li>
          <li>
            <code>Más bajo</code> si es mayor;
          </li>
          <li>
            <code>¡Adivinaste! Intentos: N</code> si es igual, donde N cuenta todos los intentos hechos (incluido este).
          </li>
        </ul>
      </>
    ),
    edit: ['js'],
    starter: {
      html: '<div id="juego" data-secreto="42">\n  <h1>Adiviná el número (1 a 100)</h1>\n  <input id="intento" type="number" min="1" max="100">\n  <button id="probar">Probar</button>\n  <p id="pista">Escribí un número</p>\n</div>\n',
      js: '// tu código\n',
    },
    solution: {
      html: '<div id="juego" data-secreto="42">\n  <h1>Adiviná el número (1 a 100)</h1>\n  <input id="intento" type="number" min="1" max="100">\n  <button id="probar">Probar</button>\n  <p id="pista">Escribí un número</p>\n</div>\n',
      js: 'const juego = document.getElementById("juego");\nconst pista = document.getElementById("pista");\nlet intentos = 0;\n\ndocument.getElementById("probar").addEventListener("click", function () {\n  const secreto = Number(juego.dataset.secreto);\n  const n = Number(document.getElementById("intento").value);\n  intentos++;\n  if (n < secreto) {\n    pista.textContent = "Más alto";\n  } else if (n > secreto) {\n    pista.textContent = "Más bajo";\n  } else {\n    pista.textContent = "¡Adivinaste! Intentos: " + intentos;\n  }\n});\n',
    },
    tests: [
      { text: 'Con 10: Más alto', test: (c) => c.type('#intento', '10') && c.click('#probar') && c.text('#pista') === 'Más alto' },
      { text: 'Con 80: Más bajo', test: (c) => c.type('#intento', '80') && c.click('#probar') && c.text('#pista') === 'Más bajo' },
      { text: 'Con 42 de entrada: ¡Adivinaste! Intentos: 1', test: (c) => c.type('#intento', '42') && c.click('#probar') && c.text('#pista') === '¡Adivinaste! Intentos: 1' },
      { text: '50, 30, 42: ¡Adivinaste! Intentos: 3', test: (c) => { const r: string[] = []; for (const v of ['50', '30', '42']) { c.type('#intento', v); c.click('#probar'); r.push(c.text('#pista')) } return r.join('|') === 'Más bajo|Más alto|¡Adivinaste! Intentos: 3' } },
      { text: 'Lee el secreto del atributo data-secreto (sin escribir 42 en el código)', test: (c) => !/42/.test(codeOnly(c.js)) && /dataset|getAttribute/.test(c.js) },
    ],
  },
]
