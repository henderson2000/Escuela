import { codeOnly, lines, type DomCtx, type Track } from '../types'

/* ------------------------------------------------------------------ ayudas para las pruebas */

/** junta espacios repetidos */
const sq = (s: string) => s.replace(/\s+/g, ' ').trim()
/** líneas de la salida, sin espacios de más */
const ls = (out: string) => lines(out).map(sq)
/** la salida es exactamente estas líneas */
const eq = (out: string, exp: string[]) => {
  const l = ls(out)
  return l.length === exp.length && exp.every((e, i) => l[i] === e)
}
/** la última línea de la salida */
const last = (out: string) => ls(out).at(-1) ?? ''
/** código sin comentarios ni textos con comillas, pero con lo de adentro de las plantillas (ahí puede haber código en ${ }) */
const bare = (src: string) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
/** el código (sin comentarios ni textos) cumple la expresión */
const uses = (code: string, re: RegExp) => re.test(bare(code))
/** cuántas veces aparece algo en el código (sin comentarios ni textos); re con /g */
const count = (code: string, re: RegExp) => (bare(code).match(re) ?? []).length

/** valor de un campo de la página */
const val = (c: DomCtx, sel: string) => (c.$(sel) as HTMLInputElement | null)?.value
/** cantidad de elementos que coinciden */
const n = (c: DomCtx, sel: string) => c.$$(sel).length
/** textos de los elementos que coinciden */
const texts = (c: DomCtx, sel: string) => c.$$(sel).map((e) => sq(e.textContent ?? ''))
const noErrors = { text: 'El programa no tiene errores', test: (c: DomCtx) => c.errors.length === 0 }

/** bloque de código de ejemplo */
const Ej = ({ c }: { c: string }) => (
  <pre>
    <code>{c}</code>
  </pre>
)

/** juega «Adiviná el número» con búsqueda binaria usando las pistas de la página */
const jugar = (c: DomCtx) => {
  let lo = 1
  let hi = 100
  for (let k = 1; k <= 10; k++) {
    const m = Math.floor((lo + hi) / 2)
    c.type('#intento', String(m))
    c.click('#probar')
    const p = c.text('#pista')
    if (/adivinaste/i.test(p)) return { m, k, p }
    if (/más alto/i.test(p)) lo = m + 1
    else if (/más bajo/i.test(p)) hi = m - 1
    else return null
  }
  return null
}

/* ------------------------------------------------------------------ páginas de los proyectos */

const HTML_GOLES = `<h1>Clásico del barrio</h1>
<h2>
  <span id="nombreLocal">Los Pibes</span>
  <span id="local">0</span> - <span id="visitante">0</span>
  <span id="nombreVisitante">Villada FC</span>
</h2>
<button id="golLocal">Gol de Los Pibes</button>
<!-- Agregá acá un botón con id="golVisitante" -->
<button id="reiniciar">Reiniciar</button>
<p id="estado">Empate</p>
`

const HTML_PROMEDIO = `<h1>Calculadora de promedio</h1>
<p>Notas del trimestre (del 1 al 10):</p>
<input id="n1" type="number">
<input id="n2" type="number">
<input id="n3" type="number">
<button id="calcular">Calcular</button>
<p id="resultado"></p>
<p id="estado"></p>
`

const HTML_COMPRAS = `<h1>Lista de compras</h1>
<input id="producto" placeholder="¿Qué hay que comprar?">
<button id="agregar">Agregar</button>
<p id="aviso"></p>
<ul id="lista"></ul>
<p id="total">0 productos</p>
<!-- Agregá acá un botón con id="vaciar" -->
`

const HTML_ADIVINA = `<h1>Adiviná el número</h1>
<p>Pensé un número del 1 al 100. ¿Cuál es?</p>
<input id="intento" type="number">
<button id="probar">Probar</button>
<p id="pista"></p>
<p id="intentos">Intentos: 0</p>
<button id="otra" hidden>Jugar otra vez</button>
`

const HTML_CONVERSOR = `<h1>Conversor de unidades</h1>
<input id="cantidad" type="number">
<select id="tipo">
  <option value="cf">°C a °F</option>
  <option value="km">km a millas</option>
  <option value="kg">kg a libras</option>
</select>
<p id="resultado">Escribí una cantidad</p>
`

const HTML_FORM_INICIAL = `<h1>Torneo intercursos</h1>
<form id="inscripcion">
  <label for="nombre">Nombre:</label>
  <input id="nombre">
  <label for="deporte">Deporte:</label>
  <select id="deporte">
    <option>Fútbol</option>
    <option>Vóley</option>
    <option>Handball</option>
  </select>
  <!-- Agregá acá el botón para enviar -->
</form>
<p id="error"></p>
<!-- Agregá acá una lista <ul> con id="anotados" -->
`

const HTML_FORM = `<h1>Torneo intercursos</h1>
<form id="inscripcion">
  <label for="nombre">Nombre:</label>
  <input id="nombre">
  <label for="deporte">Deporte:</label>
  <select id="deporte">
    <option>Fútbol</option>
    <option>Vóley</option>
    <option>Handball</option>
  </select>
  <button type="submit">Anotarme</button>
</form>
<p id="error"></p>
<ul id="anotados"></ul>
`

/** envía el formulario de inscripción tocando su botón */
const enviar = (c: DomCtx) => {
  const b = c.$$('#inscripcion button, #inscripcion input[type=submit]').find((x) => (x as HTMLButtonElement).type === 'submit') as HTMLElement | undefined
  if (!b) return false
  b.click()
  return true
}

export const JS_TRACK: Track = {
  id: 'js',
  title: 'JavaScript',
  icon: '⚡',
  desc: 'Programación básica: variables, decisiones, repeticiones, funciones y arreglos. Después, darle vida a tus páginas HTML con botones y campos.',
  modules: [
    /* ================================================================ 1. PRIMEROS PASOS */
    {
      id: 'js-primeros',
      title: 'Primeros pasos',
      desc: 'Escribir en la consola y entender cómo se ejecuta un programa.',
      lessons: [
        {
          id: 'js-1',
          kind: 'js',
          title: 'Hola, consola',
          intro: (
            <>
              <p>
                <b>JavaScript</b> es el lenguaje de programación de las páginas web. Para empezar vamos a usar la <b>consola</b>:
                con <code>console.log</code> el programa escribe un mensaje.
              </p>
              <pre>
                <code>{'console.log("Hola");\nconsole.log(2 + 3);'}</code>
              </pre>
              <p>Cada instrucción va en una línea y termina, por costumbre, con punto y coma.</p>
            </>
          ),
          task: (
            <p>
              Hacé que el programa muestre <b>dos líneas</b>: primero <code>Hola, mundo</code> y después <code>Estoy en el ITS Villada</code>.
            </p>
          ),
          hint: <p>Usá dos veces console.log, una debajo de la otra.</p>,
          starter: 'console.log("Hola, mundo");\n',
          solution: 'console.log("Hola, mundo");\nconsole.log("Estoy en el ITS Villada");\n',
          tests: [
            { text: 'La primera línea es "Hola, mundo"', check: (out) => lines(out)[0] === 'Hola, mundo' },
            { text: 'La segunda línea es "Estoy en el ITS Villada"', check: (out) => lines(out)[1] === 'Estoy en el ITS Villada' },
            { text: 'Muestra exactamente dos líneas', check: (out) => lines(out).length === 2 },
            { text: 'Usa console.log', check: (_o, code) => /console\.log\s*\(/.test(codeOnly(code)) },
          ],
        },
        {
          id: 'js-varios',
          kind: 'js',
          title: 'Comentarios y varios valores',
          intro: (
            <>
              <p>
                Un <b>comentario</b> es texto para las personas: la computadora lo ignora. Con <code>//</code> se comenta el resto de
                la línea. Sirve para explicar el código o para «apagar» una línea sin borrarla.
              </p>
              <p>
                A <code>console.log</code> le podés pasar <b>varios valores separados por comas</b>: los muestra en la misma línea,
                con un espacio en el medio. Las cuentas se hacen antes de mostrarse.
              </p>
              <Ej c={'// Esto es un comentario\nconsole.log("Recreo a las", 10, "hs");   // Recreo a las 10 hs\nconsole.log("Dos más tres:", 2 + 3);     // Dos más tres: 5\n// console.log("Esta línea no se ejecuta");'} />
            </>
          ),
          task: (
            <>
              <p>
                El programa tiene una línea que <b>no tiene que mostrarse</b>: convertila en comentario (no la borres). Después agregá
                una línea que muestre el texto <code>Horas de taller por semana:</code> y, separado con una coma, la cuenta{' '}
                <code>3 * 2</code>.
              </p>
              <p>Salida esperada:</p>
              <Ej c={'Empieza el taller\nHoras de taller por semana: 6'} />
            </>
          ),
          hint: <p>Poné // al principio de la línea que dice ESTA LÍNEA… y abajo escribí console.log("Horas de taller por semana:", 3 * 2);</p>,
          starter: '// Mi segundo programa\nconsole.log("Empieza el taller");\nconsole.log("ESTA LÍNEA NO TIENE QUE APARECER");\n',
          solution:
            '// Mi segundo programa\nconsole.log("Empieza el taller");\n// console.log("ESTA LÍNEA NO TIENE QUE APARECER");\nconsole.log("Horas de taller por semana:", 3 * 2);\n',
          tests: [
            { text: 'La primera línea es "Empieza el taller"', check: (out) => ls(out)[0] === 'Empieza el taller' },
            { text: 'No aparece "ESTA LÍNEA NO TIENE QUE APARECER"', check: (out) => !out.includes('NO TIENE QUE APARECER') },
            {
              text: 'La línea sigue en el código, como comentario',
              check: (_o, code) => /\/\/.*NO TIENE QUE APARECER|\/\*[\s\S]*NO TIENE QUE APARECER[\s\S]*\*\//.test(code),
            },
            { text: 'Muestra "Horas de taller por semana: 6" en la segunda línea', check: (out) => eq(out, ['Empieza el taller', 'Horas de taller por semana: 6']) },
            { text: 'La cuenta 3 * 2 va después de una coma en console.log', check: (_o, code) => uses(code, /,\s*3\s*\*\s*2\s*\)/) },
          ],
        },
      ],
    },

    /* ================================================================ 2. VARIABLES Y TIPOS */
    {
      id: 'js-variables',
      title: 'Variables y tipos',
      desc: 'Guardar datos con let y const, conocer números, textos y booleanos, y armar mensajes.',
      lessons: [
        {
          id: 'js-variables-1',
          kind: 'js',
          title: 'Guardar datos en variables',
          intro: (
            <>
              <p>
                Una <b>variable</b> es una caja con nombre donde guardamos un dato para usarlo después. Se crean con:
              </p>
              <ul>
                <li>
                  <code>const</code>: el valor <b>no cambia</b> (el nombre de la escuela).
                </li>
                <li>
                  <code>let</code>: el valor <b>puede cambiar</b> (la cantidad de alumnos presentes).
                </li>
              </ul>
              <Ej c={'const escuela = "ITS Villada";\nlet presentes = 28;\nconsole.log(escuela, "tiene", presentes, "presentes");\n\npresentes = presentes + 2;   // llegaron dos tarde\nconsole.log(escuela, "tiene", presentes, "presentes");'} />
              <p>
                Para cambiar una variable <code>let</code> se escribe solo el nombre, sin volver a poner <code>let</code>. Los nombres
                no llevan espacios ni tildes: <code>notaFinal</code>, <code>cantidadDeAlumnos</code>.
              </p>
            </>
          ),
          task: (
            <>
              <p>
                Creá <code>const club = "Talleres"</code> y <code>let goles = 2</code>. Mostrá el mensaje usando las variables. Después
                el equipo hace otro gol: cambiá <code>goles</code> para que valga uno más y volvé a mostrar el mensaje.
              </p>
              <Ej c={'Talleres tiene 2 goles\nTalleres tiene 3 goles'} />
            </>
          ),
          hint: <p>console.log(club, "tiene", goles, "goles"); y para sumar uno: goles = goles + 1;</p>,
          starter: '// Creá las variables club y goles\n',
          solution: 'const club = "Talleres";\nlet goles = 2;\nconsole.log(club, "tiene", goles, "goles");\n\ngoles = goles + 1;\nconsole.log(club, "tiene", goles, "goles");\n',
          tests: [
            { text: 'Muestra "Talleres tiene 2 goles" y después "Talleres tiene 3 goles"', check: (out) => eq(out, ['Talleres tiene 2 goles', 'Talleres tiene 3 goles']) },
            { text: 'Crea club con const', check: (_o, code) => uses(code, /\bconst\s+club\s*=/) },
            { text: 'Crea goles con let', check: (_o, code) => uses(code, /\blet\s+goles\s*=/) },
            {
              text: 'Cambia el valor de goles (sin volver a escribir let)',
              check: (_o, code) => /\bgoles\s*(\+\+|\+=|=(?!=))/.test(codeOnly(code).replace(/\blet\s+goles\s*=/, '')),
            },
            {
              text: 'Usa las variables al mostrar (no escribe "Talleres" de nuevo en console.log)',
              check: (_o, code) => count(code, /console\.log\s*\([^)]*\bclub\b/g) >= 2 || (code.match(/\$\{\s*club\s*\}/g) ?? []).length >= 2,
            },
          ],
        },
        {
          id: 'js-tipos',
          kind: 'js',
          title: 'Números, textos y booleanos',
          intro: (
            <>
              <p>Los datos tienen un <b>tipo</b>. Los tres más usados son:</p>
              <ul>
                <li>
                  <b>number</b> (número): <code>350</code>, <code>2.5</code> (los decimales van con punto).
                </li>
                <li>
                  <b>string</b> (texto): siempre entre comillas, <code>"alfajor"</code>.
                </li>
                <li>
                  <b>boolean</b> (verdadero o falso): <code>true</code> o <code>false</code>.
                </li>
              </ul>
              <p>
                Con <code>typeof</code> preguntamos el tipo. Ojo: <code>"350"</code> entre comillas es un texto, no un número.
              </p>
              <Ej c={'console.log(typeof 15);       // number\nconsole.log(typeof "Córdoba"); // string\nconsole.log(typeof false);    // boolean\nconsole.log(10 + 5);          // 15\nconsole.log("10" + 5);        // 105  (pega los textos)'} />
            </>
          ),
          task: (
            <>
              <p>
                Creá tres constantes: <code>precio</code> con el número 350, <code>producto</code> con el texto <code>"alfajor"</code> y{' '}
                <code>hayStock</code> con <code>true</code>. Mostrá el tipo de cada una con <code>typeof</code> (en ese orden). Después
                mostrá <code>precio + 1</code> y <code>"350" + 1</code>.
              </p>
              <Ej c={'number\nstring\nboolean\n351\n3501'} />
            </>
          ),
          hint: <p>console.log(typeof precio); y así con las otras dos. La última es console.log("350" + 1);</p>,
          starter: '// Creá las constantes acá\n',
          solution:
            'const precio = 350;\nconst producto = "alfajor";\nconst hayStock = true;\n\nconsole.log(typeof precio);\nconsole.log(typeof producto);\nconsole.log(typeof hayStock);\nconsole.log(precio + 1);\nconsole.log("350" + 1);\n',
          tests: [
            { text: 'Las tres primeras líneas son number, string y boolean', check: (out) => ls(out).slice(0, 3).join(' ') === 'number string boolean' },
            { text: 'Después muestra 351 y 3501', check: (out) => eq(out, ['number', 'string', 'boolean', '351', '3501']) },
            { text: 'precio es el número 350 (sin comillas)', check: (_o, code) => uses(code, /\bprecio\s*=\s*350\b/) },
            { text: 'hayStock vale true', check: (_o, code) => uses(code, /\bhayStock\s*=\s*true\b/) },
            { text: 'Usa typeof tres veces', check: (_o, code) => count(code, /\btypeof\b/g) >= 3 },
          ],
        },
        {
          id: 'js-template',
          kind: 'js',
          title: 'Armar mensajes: + y plantillas',
          intro: (
            <>
              <p>
                Para unir textos se usa <code>+</code> (se llama <b>concatenar</b>). Hay que acordarse de los espacios:
              </p>
              <Ej c={'const nombre = "Lucía";\nconsole.log("Hola, " + nombre + "!");   // Hola, Lucía!'} />
              <p>
                Más cómodo: las <b>plantillas</b>, con comillas invertidas <code>{'`'}</code>. Adentro, lo que va entre{' '}
                <code>{'${ }'}</code> se reemplaza por su valor (¡y puede ser una cuenta!):
              </p>
              <Ej c={'const edad = 15;\nconsole.log(`${nombre} tiene ${edad} años`);        // Lucía tiene 15 años\nconsole.log(`El año que viene va a tener ${edad + 1}`);'} />
              <p>
                La comilla invertida <code>{'`'}</code> está en el teclado cerca de la tecla Enter; a veces aparece después de tocar
                la barra espaciadora.
              </p>
            </>
          ),
          task: (
            <>
              <p>Con las constantes que ya están, mostrá dos líneas:</p>
              <ol>
                <li>
                  Con <code>+</code>: <code>Producto: alfajores</code>
                </li>
                <li>
                  Con una plantilla, calculando el total adentro de <code>{'${ }'}</code>: <code>3 alfajores cuestan $1050</code>
                </li>
              </ol>
            </>
          ),
          hint: (
            <p>
              Para la segunda: <code>{'`${cantidad} ${producto} cuestan $${cantidad * precio}`'}</code>. El primer <code>$</code> es
              el signo pesos.
            </p>
          ),
          starter:
            'const producto = "alfajores";\nconst precio = 350;\nconst cantidad = 3;\n\n// 1) Con +\nconsole.log("Producto: ");\n\n// 2) Con una plantilla (comillas invertidas)\n',
          solution:
            'const producto = "alfajores";\nconst precio = 350;\nconst cantidad = 3;\n\n// 1) Con +\nconsole.log("Producto: " + producto);\n\n// 2) Con una plantilla (comillas invertidas)\nconsole.log(`${cantidad} ${producto} cuestan $${cantidad * precio}`);\n',
          tests: [
            { text: 'La primera línea es "Producto: alfajores"', check: (out) => ls(out)[0] === 'Producto: alfajores' },
            { text: 'La segunda línea es "3 alfajores cuestan $1050"', check: (out) => eq(out, ['Producto: alfajores', '3 alfajores cuestan $1050']) },
            { text: 'La primera usa + con la variable producto', check: (_o, code) => uses(code, /""\s*\+\s*producto\b/) },
            { text: 'La segunda usa una plantilla con ${ }', check: (_o, code) => /`[^`]*\$\{[^}]+\}[^`]*`/.test(code) },
            { text: 'El 1050 lo calcula el programa (no está escrito en el código)', check: (_o, code) => !/1050/.test(code) },
          ],
        },
      ],
    },

    /* ================================================================ 3. OPERACIONES */
    {
      id: 'js-operaciones',
      title: 'Operaciones',
      desc: 'Cuentas, paréntesis, resto de la división, redondeo y números al azar.',
      lessons: [
        {
          id: 'js-aritmetica',
          kind: 'js',
          title: 'Cuentas y paréntesis',
          intro: (
            <>
              <p>
                Los operadores son <code>+</code> <code>-</code> <code>*</code> (por) y <code>/</code> (dividido). Igual que en
                Matemática, <b>primero se hacen las multiplicaciones y divisiones</b>, después las sumas y restas. Para cambiar el
                orden se usan paréntesis.
              </p>
              <Ej c={'console.log(2 + 3 * 4);     // 14\nconsole.log((2 + 3) * 4);   // 20\nconsole.log(10 / 4);        // 2.5'} />
            </>
          ),
          task: (
            <>
              <p>
                El programa calcula mal el promedio de tres notas (fijate qué muestra). Arreglalo con paréntesis y mostrá tres
                líneas: la suma, el promedio y cuánto le falta al promedio para llegar a 10.
              </p>
              <Ej c={'Suma: 24\nPromedio: 8\nLe faltan para 10: 2'} />
            </>
          ),
          hint: <p>Guardá la suma en una constante: const suma = nota1 + nota2 + nota3; y el promedio es suma / 3. Lo que falta es 10 - promedio.</p>,
          starter: 'const nota1 = 7;\nconst nota2 = 8;\nconst nota3 = 9;\n\nconst promedio = nota1 + nota2 + nota3 / 3;\nconsole.log("Promedio:", promedio);\n',
          solution:
            'const nota1 = 7;\nconst nota2 = 8;\nconst nota3 = 9;\n\nconst suma = nota1 + nota2 + nota3;\nconst promedio = (nota1 + nota2 + nota3) / 3;\nconsole.log("Suma:", suma);\nconsole.log("Promedio:", promedio);\nconsole.log("Le faltan para 10:", 10 - promedio);\n',
          tests: [
            { text: 'Muestra "Suma: 24"', check: (out) => ls(out)[0] === 'Suma: 24' },
            { text: 'Muestra "Promedio: 8"', check: (out) => ls(out)[1] === 'Promedio: 8' },
            { text: 'Muestra "Le faltan para 10: 2"', check: (out) => eq(out, ['Suma: 24', 'Promedio: 8', 'Le faltan para 10: 2']) },
            {
              text: 'Divide la suma completa por 3 (con paréntesis o con la variable suma)',
              check: (_o, code) => uses(code, /\(\s*nota1\s*\+\s*nota2\s*\+\s*nota3\s*\)\s*\/\s*3|\bsuma\s*\/\s*3/),
            },
            { text: 'Los resultados los calcula el programa (no escribe 24 en el código)', check: (_o, code) => !uses(code, /\b24\b/) },
          ],
        },
        {
          id: 'js-resto',
          kind: 'js',
          title: 'División entera y resto',
          intro: (
            <>
              <p>
                <code>%</code> da el <b>resto</b> de una división. <code>Math.floor</code> redondea <b>para abajo</b> (se queda con la
                parte entera).
              </p>
              <Ej c={'console.log(17 / 5);              // 3.4\nconsole.log(Math.floor(17 / 5));  // 3  (entran 3 veces)\nconsole.log(17 % 5);              // 2  (sobran 2)\nconsole.log(8 % 2 === 0);         // true: 8 es par'} />
              <p>
                Un número es par cuando el resto de dividirlo por 2 es 0. <code>===</code> pregunta «¿es igual?» y da{' '}
                <code>true</code> o <code>false</code>.
              </p>
            </>
          ),
          task: (
            <>
              <p>
                Para el torneo del colegio hay <code>alumnos = 47</code> y se arman equipos de <code>porEquipo = 5</code>. Usando las
                constantes, mostrá cuántos equipos completos se arman, cuántos quedan afuera y si la cantidad de alumnos es par.
              </p>
              <Ej c={'Equipos completos: 9\nQuedan afuera: 2\n¿Cantidad par? false'} />
            </>
          ),
          hint: <p>Math.floor(alumnos / porEquipo), alumnos % porEquipo y alumnos % 2 === 0.</p>,
          starter: 'const alumnos = 47;\nconst porEquipo = 5;\n\nconsole.log("Equipos completos:", alumnos / porEquipo);\n',
          solution:
            'const alumnos = 47;\nconst porEquipo = 5;\n\nconsole.log("Equipos completos:", Math.floor(alumnos / porEquipo));\nconsole.log("Quedan afuera:", alumnos % porEquipo);\nconsole.log("¿Cantidad par?", alumnos % 2 === 0);\n',
          tests: [
            { text: 'Muestra "Equipos completos: 9"', check: (out) => ls(out)[0] === 'Equipos completos: 9' },
            { text: 'Muestra "Quedan afuera: 2"', check: (out) => ls(out)[1] === 'Quedan afuera: 2' },
            { text: 'Muestra "¿Cantidad par? false"', check: (out) => eq(out, ['Equipos completos: 9', 'Quedan afuera: 2', '¿Cantidad par? false']) },
            { text: 'Usa % y Math.floor', check: (_o, code) => uses(code, /%/) && uses(code, /Math\.floor\s*\(/) },
            { text: 'Calcula con las constantes (usa porEquipo en las cuentas)', check: (_o, code) => count(code, /\bporEquipo\b/g) >= 3 },
          ],
        },
        {
          id: 'js-math',
          kind: 'js',
          title: 'Redondear, máximos y azar',
          intro: (
            <>
              <p>
                <code>Math</code> trae funciones útiles:
              </p>
              <ul>
                <li>
                  <code>Math.round(4.6)</code> → 5 (redondea al más cercano). <code>Math.floor(4.6)</code> → 4.
                </li>
                <li>
                  <code>Math.max(3, 9, 5)</code> → 9 y <code>Math.min(3, 9, 5)</code> → 3.
                </li>
                <li>
                  <code>Math.random()</code> da un número al azar entre 0 y 1 (sin llegar a 1).
                </li>
              </ul>
              <p>Para un número entero al azar del 1 al 6 (un dado):</p>
              <Ej c={'const dado = Math.floor(Math.random() * 6) + 1;\nconsole.log("Salió el", dado);'} />
            </>
          ),
          task: (
            <>
              <p>Mostrá tres líneas:</p>
              <ol>
                <li>El precio con 15% de descuento (multiplicá por 0.85), <b>redondeado</b> con Math.round.</li>
                <li>La temperatura máxima de los tres días, con Math.max.</li>
                <li>Un dado al azar del 1 al 6.</li>
              </ol>
              <Ej c={'Precio con descuento: 1049\nTemperatura máxima: 31\nDado: 4'} />
              <p>(El dado puede dar cualquier número del 1 al 6.)</p>
            </>
          ),
          hint: <p>Math.round(precio * 0.85) y Math.max(lunes, martes, miercoles). Para el dado copiá la fórmula del ejemplo.</p>,
          starter:
            'const precio = 1234;\nconst lunes = 24;\nconst martes = 31;\nconst miercoles = 28;\n\nconsole.log("Precio con descuento:", precio * 0.85);\n',
          solution:
            'const precio = 1234;\nconst lunes = 24;\nconst martes = 31;\nconst miercoles = 28;\n\nconsole.log("Precio con descuento:", Math.round(precio * 0.85));\nconsole.log("Temperatura máxima:", Math.max(lunes, martes, miercoles));\nconst dado = Math.floor(Math.random() * 6) + 1;\nconsole.log("Dado:", dado);\n',
          tests: [
            { text: 'Muestra "Precio con descuento: 1049"', check: (out) => ls(out)[0] === 'Precio con descuento: 1049' },
            { text: 'Muestra "Temperatura máxima: 31"', check: (out) => ls(out)[1] === 'Temperatura máxima: 31' },
            { text: 'Muestra "Dado: " y un número entero del 1 al 6', check: (out) => ls(out).length === 3 && /^Dado: [1-6]$/.test(ls(out)[2]) },
            { text: 'Usa Math.round y Math.max', check: (_o, code) => uses(code, /Math\.round\s*\(/) && uses(code, /Math\.max\s*\(/) },
            { text: 'El dado sale de Math.random', check: (_o, code) => uses(code, /Math\.random\s*\(/) },
          ],
        },
      ],
    },

    /* ================================================================ 4. ENTRADA CON PROMPT */
    {
      id: 'js-entrada',
      title: 'Entrada con prompt',
      desc: 'Pedirle datos a quien usa el programa y convertir los textos en números.',
      lessons: [
        {
          id: 'js-prompt',
          kind: 'js',
          title: 'Preguntar con prompt',
          intro: (
            <>
              <p>
                <code>prompt</code> le hace una pregunta a quien usa el programa y <b>devuelve lo que escribió</b>. Lo guardamos en una
                variable:
              </p>
              <Ej c={'const nombre = prompt("¿Cómo te llamás?");\nconsole.log("Hola, " + nombre);'} />
              <p>
                En esta página las respuestas salen del recuadro <b>Entrada</b>: una respuesta por línea, en orden. Cambialas para
                probar tu programa con otros datos. Las preguntas no se muestran en la salida.
              </p>
            </>
          ),
          task: (
            <>
              <p>
                Preguntá el <b>nombre</b> y después el <b>curso</b>. Mostrá un saludo en una sola línea:
              </p>
              <Ej c={'Entrada:  Ana\n          3B\nSalida:   ¡Hola, Ana! Sos de 3B'} />
            </>
          ),
          hint: <p>Hacé dos prompt, cada uno guardado en su constante, y armá el mensaje con + o con una plantilla.</p>,
          sampleInput: 'Ana\n3B',
          starter: 'const nombre = prompt("¿Cómo te llamás?");\nconsole.log("¡Hola!");\n',
          solution: 'const nombre = prompt("¿Cómo te llamás?");\nconst curso = prompt("¿De qué curso sos?");\nconsole.log(`¡Hola, ${nombre}! Sos de ${curso}`);\n',
          tests: [
            { text: 'Con Ana y 3B muestra "¡Hola, Ana! Sos de 3B"', input: 'Ana\n3B', check: (out) => eq(out, ['¡Hola, Ana! Sos de 3B']) },
            { text: 'Con Tomás y 3A muestra "¡Hola, Tomás! Sos de 3A"', input: 'Tomás\n3A', check: (out) => eq(out, ['¡Hola, Tomás! Sos de 3A']) },
            { text: 'Usa prompt dos veces', check: (_o, code) => count(code, /\bprompt\s*\(/g) >= 2 },
          ],
        },
        {
          id: 'js-number',
          kind: 'js',
          title: 'De texto a número',
          intro: (
            <>
              <p>
                ¡Cuidado! <code>prompt</code> siempre devuelve <b>texto</b>. Si sumás dos textos, se pegan: <code>"2" + "3"</code> da{' '}
                <code>"23"</code>. Para hacer cuentas, primero convertí:
              </p>
              <Ej c={'const a = Number(prompt("Primer número"));   // "2"  → 2\nconst b = parseInt("15 años");                 // 15 (se queda con el entero del principio)\nconsole.log(a + b);\nconsole.log(Number("hola"));                   // NaN = «no es un número»'} />
            </>
          ),
          task: (
            <>
              <p>
                Preguntá los goles del <b>primer tiempo</b> y los del <b>segundo tiempo</b>. Mostrá el total y el promedio por tiempo
                (total dividido 2).
              </p>
              <Ej c={'Entrada:  2\n          1\nSalida:   Goles en el partido: 3\n          Promedio por tiempo: 1.5'} />
            </>
          ),
          hint: <p>Envolvé cada prompt con Number( ). Si te da 21 en vez de 3, los estás pegando como textos.</p>,
          sampleInput: '2\n1',
          starter:
            'const primero = prompt("Goles del primer tiempo");\nconst segundo = prompt("Goles del segundo tiempo");\n\nconsole.log("Goles en el partido:", primero + segundo);\n',
          solution:
            'const primero = Number(prompt("Goles del primer tiempo"));\nconst segundo = Number(prompt("Goles del segundo tiempo"));\nconst total = primero + segundo;\n\nconsole.log("Goles en el partido:", total);\nconsole.log("Promedio por tiempo:", total / 2);\n',
          tests: [
            { text: 'Con 2 y 1: total 3 y promedio 1.5', input: '2\n1', check: (out) => eq(out, ['Goles en el partido: 3', 'Promedio por tiempo: 1.5']) },
            { text: 'Con 10 y 5: total 15 (no 105) y promedio 7.5', input: '10\n5', check: (out) => eq(out, ['Goles en el partido: 15', 'Promedio por tiempo: 7.5']) },
            { text: 'Con 0 y 0: total 0 y promedio 0', input: '0\n0', check: (out) => eq(out, ['Goles en el partido: 0', 'Promedio por tiempo: 0']) },
            { text: 'Convierte con Number o parseInt', check: (_o, code) => uses(code, /\b(Number|parseInt|parseFloat)\s*\(/) },
          ],
        },
        {
          id: 'js-mini-vuelto',
          kind: 'js',
          title: 'Mini-proyecto: vuelto del kiosco',
          intro: (
            <>
              <p>
                Juntemos todo: <code>prompt</code>, <code>Number</code>, cuentas y <code>Math.floor</code>. El kiosco del colegio
                necesita un programa que calcule el vuelto.
              </p>
              <p>Pensalo en pasos: 1) pedir los datos, 2) hacer las cuentas guardando cada resultado en una constante, 3) mostrar.</p>
            </>
          ),
          task: (
            <>
              <p>
                Preguntá (en este orden) el <b>precio</b> de un producto, la <b>cantidad</b> y <b>con cuánto paga</b>. Mostrá el total,
                el vuelto y cuántos billetes de $100 entran en el vuelto. Suponé que el dinero siempre alcanza.
              </p>
              <Ej c={'Entrada:  350\n          3\n          2000\nSalida:   Total: $1050\n          Vuelto: $950\n          Billetes de $100: 9'} />
            </>
          ),
          hint: <p>total = precio * cantidad; vuelto = pago - total; billetes = Math.floor(vuelto / 100). Para "$1050" podés usar "Total: $" + total.</p>,
          sampleInput: '350\n3\n2000',
          starter: '// 1) Pedí los datos (acordate de convertirlos a número)\n\n// 2) Calculá\n\n// 3) Mostrá\n',
          solution:
            'const precio = Number(prompt("Precio"));\nconst cantidad = Number(prompt("Cantidad"));\nconst pago = Number(prompt("¿Con cuánto paga?"));\n\nconst total = precio * cantidad;\nconst vuelto = pago - total;\nconst billetes = Math.floor(vuelto / 100);\n\nconsole.log("Total: $" + total);\nconsole.log("Vuelto: $" + vuelto);\nconsole.log("Billetes de $100: " + billetes);\n',
          tests: [
            { text: 'Con 350, 3 y 2000: total $1050, vuelto $950, 9 billetes', input: '350\n3\n2000', check: (out) => eq(out, ['Total: $1050', 'Vuelto: $950', 'Billetes de $100: 9']) },
            { text: 'Con 1200, 2 y 5000: total $2400, vuelto $2600, 26 billetes', input: '1200\n2\n5000', check: (out) => eq(out, ['Total: $2400', 'Vuelto: $2600', 'Billetes de $100: 26']) },
            { text: 'Con 500, 1 y 500: total $500, vuelto $0, 0 billetes', input: '500\n1\n500', check: (out) => eq(out, ['Total: $500', 'Vuelto: $0', 'Billetes de $100: 0']) },
            { text: 'Usa prompt tres veces', check: (_o, code) => count(code, /\bprompt\s*\(/g) >= 3 },
          ],
        },
      ],
    },

    /* ================================================================ 5. DECISIONES */
    {
      id: 'js-decisiones',
      title: 'Decisiones',
      desc: 'Hacer una cosa u otra según los datos: if, else, else if, &&, || y switch.',
      lessons: [
        {
          id: 'js-if',
          kind: 'js',
          title: 'Si pasa esto… (if y else)',
          intro: (
            <>
              <p>
                Con <code>if</code> el programa <b>decide</b>: si la condición es verdadera hace lo de la primera llave; si no, lo
                del <code>else</code>.
              </p>
              <Ej c={'const edad = Number(prompt("¿Cuántos años tenés?"));\nif (edad >= 16) {\n  console.log("Podés votar");\n} else {\n  console.log("Todavía no podés votar");\n}'} />
              <p>
                Comparaciones: <code>&gt;</code> <code>&lt;</code> <code>&gt;=</code> <code>&lt;=</code>, <code>===</code> (es igual)
                y <code>!==</code> (es distinto). Ojo: <code>=</code> solo guarda un valor; para comparar se usa <code>===</code>.
              </p>
            </>
          ),
          task: (
            <>
              <p>
                Preguntá una nota. Si es <b>6 o más</b>, mostrá <code>Aprobado</code>; si no, <code>Desaprobado</code>.
              </p>
              <Ej c={'Entrada: 7   →   Salida: Aprobado\nEntrada: 4   →   Salida: Desaprobado'} />
            </>
          ),
          hint: <p>if (nota &gt;= 6) {'{'} … {'}'} else {'{'} … {'}'}</p>,
          sampleInput: '7',
          starter: 'const nota = Number(prompt("Nota:"));\n\n// Escribí el if acá\nconsole.log("Aprobado");\n',
          solution: 'const nota = Number(prompt("Nota:"));\n\nif (nota >= 6) {\n  console.log("Aprobado");\n} else {\n  console.log("Desaprobado");\n}\n',
          tests: [
            { text: 'Con 7 muestra "Aprobado"', input: '7', check: (out) => eq(out, ['Aprobado']) },
            { text: 'Con 6 muestra "Aprobado" (el 6 aprueba)', input: '6', check: (out) => eq(out, ['Aprobado']) },
            { text: 'Con 4 muestra "Desaprobado"', input: '4', check: (out) => eq(out, ['Desaprobado']) },
            { text: 'Con 5.5 muestra "Desaprobado"', input: '5.5', check: (out) => eq(out, ['Desaprobado']) },
            { text: 'Usa if y else', check: (_o, code) => uses(code, /\bif\s*\(/) && uses(code, /\belse\b/) },
          ],
        },
        {
          id: 'js-else-if',
          kind: 'js',
          title: 'Varios caminos: else if',
          intro: (
            <>
              <p>
                Cuando hay más de dos posibilidades se encadenan con <code>else if</code>. Se revisan <b>en orden</b> y se ejecuta
                solo la primera que se cumple.
              </p>
              <p>
                Para <b>validar</b> que escribieron un número usamos <code>isNaN</code>: da <code>true</code> si el valor <b>no</b> es
                un número (<code>Number("hola")</code> es <code>NaN</code>).
              </p>
              <Ej c={'const temp = Number(prompt("Temperatura en Córdoba"));\nif (isNaN(temp)) {\n  console.log("Eso no es un número");\n} else if (temp >= 30) {\n  console.log("¡A la pileta!");\n} else if (temp >= 15) {\n  console.log("Lindo día");\n} else {\n  console.log("Llevá campera");\n}'} />
            </>
          ),
          task: (
            <>
              <p>Cuota del club según la edad. Preguntá la edad y mostrá:</p>
              <ul>
                <li>
                  si no es un número: <code>Edad inválida</code>
                </li>
                <li>
                  menos de 12: <code>Infantil: $8000</code>
                </li>
                <li>
                  de 12 a 17: <code>Juvenil: $10000</code>
                </li>
                <li>
                  18 o más: <code>Mayor: $14000</code>
                </li>
              </ul>
            </>
          ),
          hint: <p>Primero el if con isNaN(edad), después else if (edad &lt; 12), else if (edad &lt; 18) y el else final.</p>,
          sampleInput: '15',
          starter: 'const edad = Number(prompt("¿Cuántos años tenés?"));\n',
          solution:
            'const edad = Number(prompt("¿Cuántos años tenés?"));\n\nif (isNaN(edad)) {\n  console.log("Edad inválida");\n} else if (edad < 12) {\n  console.log("Infantil: $8000");\n} else if (edad < 18) {\n  console.log("Juvenil: $10000");\n} else {\n  console.log("Mayor: $14000");\n}\n',
          tests: [
            { text: 'Con 8 muestra "Infantil: $8000"', input: '8', check: (out) => eq(out, ['Infantil: $8000']) },
            { text: 'Con 12 muestra "Juvenil: $10000"', input: '12', check: (out) => eq(out, ['Juvenil: $10000']) },
            { text: 'Con 17 muestra "Juvenil: $10000"', input: '17', check: (out) => eq(out, ['Juvenil: $10000']) },
            { text: 'Con 18 muestra "Mayor: $14000"', input: '18', check: (out) => eq(out, ['Mayor: $14000']) },
            { text: 'Con "doce" muestra "Edad inválida"', input: 'doce', check: (out) => eq(out, ['Edad inválida']) },
            { text: 'Usa else if e isNaN', check: (_o, code) => uses(code, /\belse\s+if\b/) && uses(code, /\bisNaN\s*\(/) },
          ],
        },
        {
          id: 'js-logicos',
          kind: 'js',
          title: 'Y, o, no: &&, || y !',
          intro: (
            <>
              <p>Para juntar condiciones:</p>
              <ul>
                <li>
                  <code>&amp;&amp;</code> (y): se tienen que cumplir <b>las dos</b>.
                </li>
                <li>
                  <code>||</code> (o): alcanza con que se cumpla <b>una</b>.
                </li>
                <li>
                  <code>!</code> (no): da vuelta el resultado.
                </li>
              </ul>
              <Ej c={'const dia = prompt("¿Qué día es?");\nif (dia === "sábado" || dia === "domingo") {\n  console.log("No hay clases");\n}\n\nconst llueve = false;\nif (!llueve && dia === "viernes") {\n  console.log("Hay educación física en el patio");\n}'} />
            </>
          ),
          task: (
            <>
              <p>
                Preguntá la <b>asistencia</b> (en %) y después la <b>nota</b>. Mostrá:
              </p>
              <ul>
                <li>
                  <code>Aprobado</code> si la asistencia es 75 o más <b>y</b> la nota es 6 o más;
                </li>
                <li>
                  si no, <code>Libre por faltas</code> cuando la asistencia es menor que 75;
                </li>
                <li>
                  y si no, <code>Desaprobado</code>.
                </li>
              </ul>
              <Ej c={'Entrada: 90 y 7   →  Aprobado\nEntrada: 60 y 9   →  Libre por faltas\nEntrada: 80 y 4   →  Desaprobado'} />
            </>
          ),
          hint: <p>if (asistencia &gt;= 75 &amp;&amp; nota &gt;= 6) … else if (asistencia &lt; 75) … else …</p>,
          sampleInput: '90\n7',
          starter: 'const asistencia = Number(prompt("Asistencia (%)"));\nconst nota = Number(prompt("Nota"));\n\n',
          solution:
            'const asistencia = Number(prompt("Asistencia (%)"));\nconst nota = Number(prompt("Nota"));\n\nif (asistencia >= 75 && nota >= 6) {\n  console.log("Aprobado");\n} else if (asistencia < 75) {\n  console.log("Libre por faltas");\n} else {\n  console.log("Desaprobado");\n}\n',
          tests: [
            { text: 'Con 90 y 7 muestra "Aprobado"', input: '90\n7', check: (out) => eq(out, ['Aprobado']) },
            { text: 'Con 75 y 6 muestra "Aprobado"', input: '75\n6', check: (out) => eq(out, ['Aprobado']) },
            { text: 'Con 60 y 9 muestra "Libre por faltas"', input: '60\n9', check: (out) => eq(out, ['Libre por faltas']) },
            { text: 'Con 80 y 4 muestra "Desaprobado"', input: '80\n4', check: (out) => eq(out, ['Desaprobado']) },
            { text: 'Con 50 y 3 muestra "Libre por faltas"', input: '50\n3', check: (out) => eq(out, ['Libre por faltas']) },
            { text: 'Usa &&', check: (_o, code) => uses(code, /&&/) },
          ],
        },
        {
          id: 'js-switch',
          kind: 'js',
          title: 'Mini-proyecto: menú del kiosco con switch',
          intro: (
            <>
              <p>
                Cuando comparamos <b>una misma variable</b> con muchos valores, <code>switch</code> queda más ordenado que muchos{' '}
                <code>else if</code>. Cada <code>case</code> termina con <code>break</code>, y <code>default</code> es «cualquier
                otro caso».
              </p>
              <Ej c={'const dia = Number(prompt("Número de día (1 a 3)"));\nswitch (dia) {\n  case 1:\n    console.log("Lunes: Lengua");\n    break;\n  case 2:\n    console.log("Martes: Taller");\n    break;\n  default:\n    console.log("Ese día no está");\n}'} />
              <p>
                <code>switch</code> compara con <code>===</code>: si no convertís con <code>Number</code>, los casos tienen que ser
                textos (<code>case "1":</code>).
              </p>
            </>
          ),
          task: (
            <>
              <p>
                El programa ya muestra el menú. Preguntá la opción y, con <code>switch</code>, mostrá qué eligió. Si la opción no
                existe, mostrá <code>Opción inválida</code>.
              </p>
              <Ej c={'Entrada: 1   →   Elegiste: Alfajor - $500\nEntrada: 2   →   Elegiste: Gaseosa - $1200\nEntrada: 3   →   Elegiste: Sándwich de miga - $900\nEntrada: 4   →   Elegiste: Turrón - $300\nEntrada: 9   →   Opción inválida'} />
            </>
          ),
          hint: <p>switch (opcion) {'{'} case 1: console.log("Elegiste: Alfajor - $500"); break; … default: … {'}'}</p>,
          sampleInput: '1',
          starter:
            'console.log("1. Alfajor $500");\nconsole.log("2. Gaseosa $1200");\nconsole.log("3. Sándwich de miga $900");\nconsole.log("4. Turrón $300");\n\nconst opcion = Number(prompt("¿Qué querés?"));\n',
          solution:
            'console.log("1. Alfajor $500");\nconsole.log("2. Gaseosa $1200");\nconsole.log("3. Sándwich de miga $900");\nconsole.log("4. Turrón $300");\n\nconst opcion = Number(prompt("¿Qué querés?"));\n\nswitch (opcion) {\n  case 1:\n    console.log("Elegiste: Alfajor - $500");\n    break;\n  case 2:\n    console.log("Elegiste: Gaseosa - $1200");\n    break;\n  case 3:\n    console.log("Elegiste: Sándwich de miga - $900");\n    break;\n  case 4:\n    console.log("Elegiste: Turrón - $300");\n    break;\n  default:\n    console.log("Opción inválida");\n}\n',
          tests: [
            { text: 'Sigue mostrando el menú (4 líneas) antes de la respuesta', input: '1', check: (out) => ls(out).length === 5 && ls(out)[0] === '1. Alfajor $500' },
            { text: 'Con 1 muestra "Elegiste: Alfajor - $500"', input: '1', check: (out) => last(out) === 'Elegiste: Alfajor - $500' },
            { text: 'Con 3 muestra "Elegiste: Sándwich de miga - $900"', input: '3', check: (out) => last(out) === 'Elegiste: Sándwich de miga - $900' },
            { text: 'Con 4 muestra "Elegiste: Turrón - $300"', input: '4', check: (out) => last(out) === 'Elegiste: Turrón - $300' },
            { text: 'Con 9 muestra "Opción inválida"', input: '9', check: (out) => ls(out).length === 5 && last(out) === 'Opción inválida' },
            { text: 'Usa switch con default', check: (_o, code) => uses(code, /\bswitch\s*\(/) && uses(code, /\bdefault\s*:/) },
          ],
        },
      ],
    },

    /* ================================================================ 6. REPETICIONES */
    {
      id: 'js-repeticiones',
      title: 'Repeticiones',
      desc: 'Repetir instrucciones con while y for, contar, acumular y cortar un bucle con break.',
      lessons: [
        {
          id: 'js-while',
          kind: 'js',
          title: 'Repetir con while',
          intro: (
            <>
              <p>
                <code>while</code> repite lo que está entre llaves <b>mientras</b> la condición sea verdadera. Adentro algo tiene que
                cambiar; si no, el bucle no termina nunca.
              </p>
              <Ej c={'let vuelta = 1;\nwhile (vuelta <= 3) {\n  console.log("Vuelta a la cancha número", vuelta);\n  vuelta = vuelta + 1;   // también se puede escribir vuelta++\n}\nconsole.log("¡A elongar!");'} />
              <p>
                Atajos: <code>x++</code> suma 1, <code>x--</code> resta 1, <code>x += 5</code> suma 5.
              </p>
            </>
          ),
          task: (
            <>
              <p>
                Cuenta regresiva para el recreo: preguntá un número y mostrá desde ese número hasta 1 (uno por línea). Al final
                mostrá <code>¡Recreo!</code>.
              </p>
              <Ej c={'Entrada: 3\nSalida:  3\n         2\n         1\n         ¡Recreo!'} />
            </>
          ),
          hint: <p>let n = inicio; while (n &gt;= 1) {'{'} console.log(n); n--; {'}'}</p>,
          sampleInput: '3',
          starter: 'const inicio = Number(prompt("¿Desde qué número?"));\n\n\nconsole.log("¡Recreo!");\n',
          solution: 'const inicio = Number(prompt("¿Desde qué número?"));\n\nlet n = inicio;\nwhile (n >= 1) {\n  console.log(n);\n  n--;\n}\nconsole.log("¡Recreo!");\n',
          tests: [
            { text: 'Con 3 muestra 3, 2, 1 y ¡Recreo!', input: '3', check: (out) => eq(out, ['3', '2', '1', '¡Recreo!']) },
            { text: 'Con 5 muestra 5, 4, 3, 2, 1 y ¡Recreo!', input: '5', check: (out) => eq(out, ['5', '4', '3', '2', '1', '¡Recreo!']) },
            { text: 'Con 1 muestra 1 y ¡Recreo!', input: '1', check: (out) => eq(out, ['1', '¡Recreo!']) },
            { text: 'Usa while', check: (_o, code) => uses(code, /\bwhile\s*\(/) },
          ],
        },
        {
          id: 'js-for',
          kind: 'js',
          title: 'Repetir con for',
          intro: (
            <>
              <p>
                <code>for</code> es la forma corta de un bucle que <b>cuenta</b>. En una línea tiene las tres partes: desde dónde
                arranca, hasta cuándo sigue y cuánto avanza.
              </p>
              <Ej c={'//   arranca     sigue mientras   avanza\nfor (let i = 1;  i <= 5;          i++) {\n  console.log("Fila", i);\n}'} />
              <p>
                Muestra <code>Fila 1</code> hasta <code>Fila 5</code>.
              </p>
            </>
          ),
          task: (
            <>
              <p>
                Preguntá un número y mostrá su <b>tabla de multiplicar</b> del 1 al 10, con este formato:
              </p>
              <Ej c={'Entrada: 7\nSalida:  7 x 1 = 7\n         7 x 2 = 14\n         …\n         7 x 10 = 70'} />
            </>
          ),
          hint: <p>{'for (let i = 1; i <= 10; i++) { … } y adentro: console.log(`${n} x ${i} = ${n * i}`);'}</p>,
          sampleInput: '7',
          starter: 'const n = Number(prompt("¿Qué tabla querés?"));\n\n',
          solution: 'const n = Number(prompt("¿Qué tabla querés?"));\n\nfor (let i = 1; i <= 10; i++) {\n  console.log(`${n} x ${i} = ${n * i}`);\n}\n',
          tests: [
            {
              text: 'Con 7 muestra la tabla del 7 completa',
              input: '7',
              check: (out) => eq(out, Array.from({ length: 10 }, (_, i) => `7 x ${i + 1} = ${7 * (i + 1)}`)),
            },
            {
              text: 'Con 3 muestra la tabla del 3 completa',
              input: '3',
              check: (out) => eq(out, Array.from({ length: 10 }, (_, i) => `3 x ${i + 1} = ${3 * (i + 1)}`)),
            },
            { text: 'Con 12 empieza en "12 x 1 = 12" y termina en "12 x 10 = 120"', input: '12', check: (out) => ls(out)[0] === '12 x 1 = 12' && last(out) === '12 x 10 = 120' },
            { text: 'Usa for', check: (_o, code) => uses(code, /\bfor\s*\(/) },
          ],
        },
        {
          id: 'js-acumulador',
          kind: 'js',
          title: 'Contadores y acumuladores',
          intro: (
            <>
              <p>Dos ideas que se usan en casi todos los programas con bucles:</p>
              <ul>
                <li>
                  <b>Acumulador</b>: una variable que empieza en 0 y en cada vuelta se le suma algo (<code>total += precio</code>).
                </li>
                <li>
                  <b>Contador</b>: empieza en 0 y suma 1 cada vez que pasa algo (<code>caros++</code>).
                </li>
              </ul>
              <Ej c={'let total = 0;\nlet caros = 0;\nfor (let i = 1; i <= 3; i++) {\n  const precio = Number(prompt("Precio"));\n  total += precio;\n  if (precio > 1000) {\n    caros++;\n  }\n}\nconsole.log("Total:", total, "- Caros:", caros);'} />
            </>
          ),
          task: (
            <>
              <p>
                La cooperadora junta aportes. Preguntá primero <b>cuántas familias</b> aportaron y después el aporte de cada una.
                Mostrá el total y cuántos aportes fueron de <b>$1000 o más</b>.
              </p>
              <Ej c={'Entrada: 3\n         500\n         1000\n         2500\nSalida:  Total recaudado: $4000\n         Aportes de $1000 o más: 2'} />
            </>
          ),
          hint: <p>Un for que va de 1 a la cantidad de familias. Adentro: un prompt, total += aporte y un if para el contador.</p>,
          sampleInput: '3\n500\n1000\n2500',
          starter: 'const familias = Number(prompt("¿Cuántas familias aportaron?"));\nlet total = 0;\n\n',
          solution:
            'const familias = Number(prompt("¿Cuántas familias aportaron?"));\nlet total = 0;\nlet grandes = 0;\n\nfor (let i = 1; i <= familias; i++) {\n  const aporte = Number(prompt("Aporte de la familia " + i));\n  total += aporte;\n  if (aporte >= 1000) {\n    grandes++;\n  }\n}\n\nconsole.log("Total recaudado: $" + total);\nconsole.log("Aportes de $1000 o más: " + grandes);\n',
          tests: [
            { text: 'Con 3 familias (500, 1000, 2500): $4000 y 2 aportes grandes', input: '3\n500\n1000\n2500', check: (out) => eq(out, ['Total recaudado: $4000', 'Aportes de $1000 o más: 2']) },
            { text: 'Con 5 familias (100, 200, 300, 400, 5000): $6000 y 1', input: '5\n100\n200\n300\n400\n5000', check: (out) => eq(out, ['Total recaudado: $6000', 'Aportes de $1000 o más: 1']) },
            { text: 'Con 1 familia (800): $800 y 0', input: '1\n800', check: (out) => eq(out, ['Total recaudado: $800', 'Aportes de $1000 o más: 0']) },
            { text: 'Con 0 familias: $0 y 0', input: '0', check: (out) => eq(out, ['Total recaudado: $0', 'Aportes de $1000 o más: 0']) },
            { text: 'Usa un bucle (for o while)', check: (_o, code) => uses(code, /\b(for|while)\s*\(/) },
          ],
        },
        {
          id: 'js-hasta-fin',
          kind: 'js',
          title: 'Mini-proyecto: hasta que digan «fin» (break)',
          intro: (
            <>
              <p>
                A veces no sabemos cuántas veces repetir: seguimos <b>hasta que escriban una palabra</b>. Un truco es{' '}
                <code>while (true)</code> (repetir para siempre) y salir con <code>break</code>:
              </p>
              <Ej c={'let cantidad = 0;\nwhile (true) {\n  const nombre = prompt("Nombre (o fin)");\n  if (nombre === "fin" || nombre === null) {\n    break;   // sale del bucle\n  }\n  cantidad++;\n}\nconsole.log("Anotados:", cantidad);'} />
              <p>
                <code>prompt</code> devuelve <code>null</code> si cancelan (acá: si se acaban las líneas de la Entrada). Por eso
                también cortamos con <code>null</code>.
              </p>
            </>
          ),
          task: (
            <>
              <p>
                Goles del torneo: pedí los goles de cada partido hasta que escriban <code>fin</code>. Mostrá cuántos partidos se
                jugaron, el total de goles y el máximo en un partido.
              </p>
              <Ej c={'Entrada: 2\n         0\n         5\n         fin\nSalida:  Partidos: 3\n         Goles: 7\n         Máximo en un partido: 5'} />
            </>
          ),
          hint: <p>Tres variables: partidos, goles y maximo. Adentro del while: si la respuesta es "fin", break; si no, convertí a número, sumá y fijate si es mayor que el máximo.</p>,
          sampleInput: '2\n0\n5\nfin',
          starter: 'let partidos = 0;\nlet goles = 0;\nlet maximo = 0;\n\n\nconsole.log("Partidos:", partidos);\nconsole.log("Goles:", goles);\nconsole.log("Máximo en un partido:", maximo);\n',
          solution:
            'let partidos = 0;\nlet goles = 0;\nlet maximo = 0;\n\nwhile (true) {\n  const respuesta = prompt("Goles del partido (o fin)");\n  if (respuesta === "fin" || respuesta === null) {\n    break;\n  }\n  const g = Number(respuesta);\n  partidos++;\n  goles += g;\n  if (g > maximo) {\n    maximo = g;\n  }\n}\n\nconsole.log("Partidos:", partidos);\nconsole.log("Goles:", goles);\nconsole.log("Máximo en un partido:", maximo);\n',
          tests: [
            { text: 'Con 2, 0, 5 y fin: 3 partidos, 7 goles, máximo 5', input: '2\n0\n5\nfin', check: (out) => eq(out, ['Partidos: 3', 'Goles: 7', 'Máximo en un partido: 5']) },
            { text: 'Con 1 y fin: 1 partido, 1 gol, máximo 1', input: '1\nfin', check: (out) => eq(out, ['Partidos: 1', 'Goles: 1', 'Máximo en un partido: 1']) },
            { text: 'Con 3, 3, 1, 4 y fin: 4 partidos, 11 goles, máximo 4', input: '3\n3\n1\n4\nfin', check: (out) => eq(out, ['Partidos: 4', 'Goles: 11', 'Máximo en un partido: 4']) },
            { text: 'Usa break', check: (_o, code) => uses(code, /\bbreak\b/) },
          ],
        },
      ],
    },

    /* ================================================================ 7. FUNCIONES */
    {
      id: 'js-funciones',
      title: 'Funciones',
      desc: 'Ponerle nombre a un pedazo de código para usarlo muchas veces: parámetros, return y funciones flecha.',
      lessons: [
        {
          id: 'js-funcion',
          kind: 'js',
          title: 'Crear funciones',
          intro: (
            <>
              <p>
                Una <b>función</b> es un pedazo de código con nombre. Se <b>declara</b> una vez y se <b>llama</b> todas las veces que
                quieras. Los <b>parámetros</b> son los datos que recibe, entre paréntesis.
              </p>
              <Ej c={'function saludar(nombre) {\n  console.log("Hola, " + nombre + "!");\n}\n\nsaludar("Ana");     // Hola, Ana!\nsaludar("Bruno");   // Hola, Bruno!'} />
            </>
          ),
          task: (
            <>
              <p>
                Escribí la función <code>encabezado(materia, profe)</code> que muestre <b>dos líneas</b>, y llamala tres veces para
                que la salida sea:
              </p>
              <Ej c={'=== Lengua ===\nProfe: Graciela\n=== Matemática ===\nProfe: Roberto\n=== Computación ===\nProfe: Sofía'} />
              <p>
                Los <code>console.log</code> van <b>solo adentro</b> de la función.
              </p>
            </>
          ),
          hint: <p>Adentro: console.log("=== " + materia + " ==="); y console.log("Profe: " + profe); Afuera: encabezado("Lengua", "Graciela"); …</p>,
          starter: 'function encabezado(materia, profe) {\n  // completá\n}\n\nencabezado("Lengua", "Graciela");\n',
          solution:
            'function encabezado(materia, profe) {\n  console.log("=== " + materia + " ===");\n  console.log("Profe: " + profe);\n}\n\nencabezado("Lengua", "Graciela");\nencabezado("Matemática", "Roberto");\nencabezado("Computación", "Sofía");\n',
          tests: [
            {
              text: 'Muestra las seis líneas en orden',
              check: (out) => eq(out, ['=== Lengua ===', 'Profe: Graciela', '=== Matemática ===', 'Profe: Roberto', '=== Computación ===', 'Profe: Sofía']),
            },
            { text: 'Declara function encabezado(materia, profe)', check: (_o, code) => uses(code, /function\s+encabezado\s*\(\s*materia\s*,\s*profe\s*\)/) },
            { text: 'Llama a encabezado tres veces', check: (_o, code) => count(code, /\bencabezado\s*\(/g) >= 4 },
            { text: 'Hay solo dos console.log (los de la función)', check: (_o, code) => count(code, /console\.log\s*\(/g) === 2 },
          ],
        },
        {
          id: 'js-return',
          kind: 'js',
          title: 'Devolver un resultado: return',
          intro: (
            <>
              <p>
                Con <code>return</code> la función <b>devuelve un valor</b> a quien la llamó, que lo puede guardar o mostrar. Es como
                una calculadora: le das datos y te devuelve el resultado.
              </p>
              <Ej c={'function promedio(a, b) {\n  return (a + b) / 2;\n}\n\nconst p = promedio(7, 10);\nconsole.log("Promedio:", p);              // 8.5\nconsole.log("Otro:", promedio(4, 6));    // 5'} />
              <p>
                <b>Alcance</b>: las variables creadas <b>adentro</b> de una función solo existen ahí. Afuera no se pueden usar; por eso
                el resultado se saca con <code>return</code>.
              </p>
            </>
          ),
          task: (
            <>
              <p>
                Escribí <code>precioFinal(precio, descuento)</code> que <b>devuelva</b> el precio con ese porcentaje de descuento,
                redondeado con Math.round. Preguntá el precio y el descuento, y mostrá el precio final y cuánto saldría con 50% off.
              </p>
              <Ej c={'Entrada: 1000\n         20\nSalida:  Precio final: $800\n         Con 50% off: $500'} />
            </>
          ),
          hint: <p>return Math.round(precio - precio * descuento / 100); y después usala dos veces: precioFinal(precio, descuento) y precioFinal(precio, 50).</p>,
          sampleInput: '1000\n20',
          starter: 'function precioFinal(precio, descuento) {\n  // devolvé el resultado con return\n}\n\nconst precio = Number(prompt("Precio"));\nconst descuento = Number(prompt("Descuento (%)"));\n',
          solution:
            'function precioFinal(precio, descuento) {\n  return Math.round(precio - precio * descuento / 100);\n}\n\nconst precio = Number(prompt("Precio"));\nconst descuento = Number(prompt("Descuento (%)"));\n\nconsole.log("Precio final: $" + precioFinal(precio, descuento));\nconsole.log("Con 50% off: $" + precioFinal(precio, 50));\n',
          tests: [
            { text: 'Con 1000 y 20: $800 y $500', input: '1000\n20', check: (out) => eq(out, ['Precio final: $800', 'Con 50% off: $500']) },
            { text: 'Con 1234 y 15: $1049 (redondeado) y $617', input: '1234\n15', check: (out) => eq(out, ['Precio final: $1049', 'Con 50% off: $617']) },
            { text: 'Con 500 y 0: $500 y $250', input: '500\n0', check: (out) => eq(out, ['Precio final: $500', 'Con 50% off: $250']) },
            { text: 'precioFinal usa return', check: (_o, code) => uses(code, /function\s+precioFinal[\s\S]*\breturn\b/) },
            { text: 'Llama a precioFinal dos veces', check: (_o, code) => count(code, /\bprecioFinal\s*\(/g) >= 3 },
          ],
        },
        {
          id: 'js-flecha',
          kind: 'js',
          title: 'Funciones flecha',
          intro: (
            <>
              <p>
                Hay una forma más corta de escribir funciones: la <b>función flecha</b> <code>{'=>'}</code>. Si es una sola cuenta,
                devuelve el resultado sin escribir <code>return</code>.
              </p>
              <Ej c={'// estas dos hacen lo mismo\nfunction doble(n) {\n  return n * 2;\n}\nconst doble2 = (n) => n * 2;\n\nconst esPar = (n) => n % 2 === 0;\nconsole.log(doble2(21), esPar(7));   // 42 false'} />
            </>
          ),
          task: (
            <>
              <p>
                Con <b>funciones flecha</b> escribí <code>superficie(largo, ancho)</code> y <code>perimetro(largo, ancho)</code> de una
                cancha rectangular. Preguntá el largo y el ancho y mostrá:
              </p>
              <Ej c={'Entrada: 100\n         60\nSalida:  Superficie: 6000 m²\n         Perímetro: 320 m'} />
            </>
          ),
          hint: <p>const superficie = (largo, ancho) =&gt; largo * ancho; El perímetro es 2 * (largo + ancho).</p>,
          sampleInput: '100\n60',
          starter: 'const superficie = (largo, ancho) => 0;\n\nconst largo = Number(prompt("Largo"));\nconst ancho = Number(prompt("Ancho"));\n\nconsole.log("Superficie: " + superficie(largo, ancho) + " m²");\n',
          solution:
            'const superficie = (largo, ancho) => largo * ancho;\nconst perimetro = (largo, ancho) => 2 * (largo + ancho);\n\nconst largo = Number(prompt("Largo"));\nconst ancho = Number(prompt("Ancho"));\n\nconsole.log("Superficie: " + superficie(largo, ancho) + " m²");\nconsole.log("Perímetro: " + perimetro(largo, ancho) + " m");\n',
          tests: [
            { text: 'Con 100 y 60: 6000 m² y 320 m', input: '100\n60', check: (out) => eq(out, ['Superficie: 6000 m²', 'Perímetro: 320 m']) },
            { text: 'Con 40 y 20: 800 m² y 120 m', input: '40\n20', check: (out) => eq(out, ['Superficie: 800 m²', 'Perímetro: 120 m']) },
            { text: 'Con 7 y 3: 21 m² y 20 m', input: '7\n3', check: (out) => eq(out, ['Superficie: 21 m²', 'Perímetro: 20 m']) },
            { text: 'Usa dos funciones flecha (=>)', check: (_o, code) => count(code, /=>/g) >= 2 && uses(code, /\bperimetro\s*=/) },
          ],
        },
        {
          id: 'js-mini-calculadora',
          kind: 'js',
          title: 'Mini-proyecto: calculadora',
          intro: (
            <>
              <p>
                Armemos una calculadora con una función para cada operación. Separar el programa en funciones lo hace más fácil de
                leer y de arreglar.
              </p>
              <Ej c={'const sumar = (a, b) => a + b;\n\nfunction dividir(a, b) {\n  return a / b;\n}'} />
            </>
          ),
          task: (
            <>
              <p>
                Escribí las funciones <code>sumar</code>, <code>restar</code>, <code>multiplicar</code> y <code>dividir</code> (como
                quieras: con <code>function</code> o flecha). Preguntá el primer número, la operación (<code>+ - * /</code>) y el
                segundo número. Mostrá <code>Resultado: X</code>.
              </p>
              <ul>
                <li>
                  Si quieren dividir por 0: <code>No se puede dividir por cero</code>
                </li>
                <li>
                  Si la operación no es ninguna de las cuatro: <code>Operación inválida</code>
                </li>
              </ul>
              <Ej c={'Entrada: 8\n         +\n         5\nSalida:  Resultado: 13'} />
            </>
          ),
          hint: <p>Después de las funciones, un if/else if (o un switch) con la operación. El caso de dividir por cero se revisa antes de dividir.</p>,
          sampleInput: '8\n+\n5',
          starter: '// 1) Las cuatro funciones\n\n// 2) Pedir los datos\nconst a = Number(prompt("Primer número"));\nconst op = prompt("Operación (+ - * /)");\nconst b = Number(prompt("Segundo número"));\n\n// 3) Elegir qué hacer\n',
          solution:
            'const sumar = (a, b) => a + b;\nconst restar = (a, b) => a - b;\nconst multiplicar = (a, b) => a * b;\nconst dividir = (a, b) => a / b;\n\nconst a = Number(prompt("Primer número"));\nconst op = prompt("Operación (+ - * /)");\nconst b = Number(prompt("Segundo número"));\n\nif (op === "+") {\n  console.log("Resultado:", sumar(a, b));\n} else if (op === "-") {\n  console.log("Resultado:", restar(a, b));\n} else if (op === "*") {\n  console.log("Resultado:", multiplicar(a, b));\n} else if (op === "/") {\n  if (b === 0) {\n    console.log("No se puede dividir por cero");\n  } else {\n    console.log("Resultado:", dividir(a, b));\n  }\n} else {\n  console.log("Operación inválida");\n}\n',
          tests: [
            { text: '8 + 5 → Resultado: 13', input: '8\n+\n5', check: (out) => eq(out, ['Resultado: 13']) },
            { text: '8 - 10 → Resultado: -2', input: '8\n-\n10', check: (out) => eq(out, ['Resultado: -2']) },
            { text: '6 * 7 → Resultado: 42', input: '6\n*\n7', check: (out) => eq(out, ['Resultado: 42']) },
            { text: '9 / 2 → Resultado: 4.5', input: '9\n/\n2', check: (out) => eq(out, ['Resultado: 4.5']) },
            { text: '5 / 0 → No se puede dividir por cero', input: '5\n/\n0', check: (out) => eq(out, ['No se puede dividir por cero']) },
            { text: '3 % 2 → Operación inválida', input: '3\n%\n2', check: (out) => eq(out, ['Operación inválida']) },
            {
              text: 'Hay funciones sumar, restar, multiplicar y dividir',
              check: (_o, code) => ['sumar', 'restar', 'multiplicar', 'dividir'].every((f) => uses(code, new RegExp(`(function\\s+${f}\\s*\\(|\\b${f}\\s*=)`))),
            },
          ],
        },
      ],
    },

    /* ================================================================ 8. ARREGLOS */
    {
      id: 'js-arreglos',
      title: 'Arreglos',
      desc: 'Guardar listas de datos, recorrerlas, sumarlas y buscar en ellas.',
      lessons: [
        {
          id: 'js-arreglo',
          kind: 'js',
          title: 'Arreglos: listas de datos',
          intro: (
            <>
              <p>
                Un <b>arreglo</b> guarda muchos datos en orden, entre corchetes. Cada uno tiene una posición (<b>índice</b>) que{' '}
                <b>empieza en 0</b>.
              </p>
              <Ej c={'const materias = ["Lengua", "Matemática", "Taller"];\nconsole.log(materias[0]);                    // Lengua\nconsole.log(materias.length);                // 3 (cuántos hay)\nconsole.log(materias[materias.length - 1]);  // Taller (el último)\n\nmaterias.push("Historia");   // agrega al final\nconst sacada = materias.pop();   // saca el último y lo devuelve\nconsole.log(materias);       // [\'Lengua\', \'Matemática\', \'Taller\']'} />
            </>
          ),
          task: (
            <>
              <p>Con la lista de compras:</p>
              <ol>
                <li>
                  Mostrá el primero: <code>Primero: pan</code>
                </li>
                <li>
                  Agregá <code>"galletitas"</code> con push y mostrá el último usando <code>length - 1</code>:{' '}
                  <code>Último: galletitas</code>
                </li>
                <li>
                  Sacalo con pop y mostrá <code>Saqué: galletitas</code>
                </li>
                <li>
                  Mostrá <code>Quedan 3 productos</code> (usando length) y después la lista entera con{' '}
                  <code>console.log(lista)</code>.
                </li>
              </ol>
              <Ej c={"Primero: pan\nÚltimo: galletitas\nSaqué: galletitas\nQuedan 3 productos\n['pan', 'leche', 'yerba']"} />
            </>
          ),
          hint: <p>const sacado = lista.pop(); console.log("Saqué:", sacado); y para la cantidad: "Quedan " + lista.length + " productos".</p>,
          starter: 'const lista = ["pan", "leche", "yerba"];\n\n',
          solution:
            'const lista = ["pan", "leche", "yerba"];\n\nconsole.log("Primero:", lista[0]);\nlista.push("galletitas");\nconsole.log("Último:", lista[lista.length - 1]);\nconst sacado = lista.pop();\nconsole.log("Saqué:", sacado);\nconsole.log("Quedan " + lista.length + " productos");\nconsole.log(lista);\n',
          tests: [
            {
              text: 'Muestra las cinco líneas pedidas',
              check: (out) => eq(out, ['Primero: pan', 'Último: galletitas', 'Saqué: galletitas', 'Quedan 3 productos', "['pan', 'leche', 'yerba']"]),
            },
            { text: 'Usa lista[0] y lista.length - 1', check: (_o, code) => uses(code, /lista\[\s*0\s*\]/) && uses(code, /lista\[\s*lista\.length\s*-\s*1\s*\]/) },
            { text: 'Usa push y pop', check: (_o, code) => uses(code, /\.push\s*\(/) && uses(code, /\.pop\s*\(/) },
            { text: 'La cantidad sale de lista.length', check: (_o, code) => count(code, /lista\.length/g) >= 2 },
          ],
        },
        {
          id: 'js-recorrer',
          kind: 'js',
          title: 'Recorrer un arreglo',
          intro: (
            <>
              <p>Para hacer algo con cada elemento hay dos formas:</p>
              <Ej c={'const notas = [7, 9, 6];\n\n// 1) for con índice: sirve cuando necesitás la posición\nfor (let i = 0; i < notas.length; i++) {\n  console.log("Nota", i + 1, "=", notas[i]);\n}\n\n// 2) for...of: más corto, te da cada elemento directo\nfor (const nota of notas) {\n  console.log(nota);\n}'} />
            </>
          ),
          task: (
            <>
              <p>Con los goles del equipo en cada fecha:</p>
              <ol>
                <li>
                  Con un <code>for</code> con índice, mostrá una línea por fecha: <code>Fecha 1: 2 goles</code> (la fecha es la
                  posición + 1).
                </li>
                <li>
                  Con un <code>for...of</code>, contá las fechas sin goles y mostrá <code>Fechas sin goles: 1</code>.
                </li>
              </ol>
              <Ej c={'Fecha 1: 2 goles\nFecha 2: 0 goles\nFecha 3: 3 goles\nFecha 4: 1 goles\nFecha 5: 4 goles\nFechas sin goles: 1'} />
            </>
          ),
          hint: <p>for (let i = 0; i &lt; goles.length; i++) {'{'} console.log("Fecha " + (i + 1) + ": " + goles[i] + " goles"); {'}'}</p>,
          starter: 'const goles = [2, 0, 3, 1, 4];\n\n',
          solution:
            'const goles = [2, 0, 3, 1, 4];\n\nfor (let i = 0; i < goles.length; i++) {\n  console.log("Fecha " + (i + 1) + ": " + goles[i] + " goles");\n}\n\nlet sinGoles = 0;\nfor (const g of goles) {\n  if (g === 0) {\n    sinGoles++;\n  }\n}\nconsole.log("Fechas sin goles: " + sinGoles);\n',
          tests: [
            {
              text: 'Muestra las cinco fechas y "Fechas sin goles: 1"',
              check: (out) => eq(out, ['Fecha 1: 2 goles', 'Fecha 2: 0 goles', 'Fecha 3: 3 goles', 'Fecha 4: 1 goles', 'Fecha 5: 4 goles', 'Fechas sin goles: 1']),
            },
            { text: 'Usa un for con índice hasta goles.length', check: (_o, code) => uses(code, /for\s*\(\s*let\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*goles\.length/) },
            { text: 'Usa for...of', check: (_o, code) => uses(code, /for\s*\(\s*(const|let)\s+\w+\s+of\s+goles\s*\)/) },
          ],
        },
        {
          id: 'js-sumar',
          kind: 'js',
          title: 'Llenar, sumar y buscar el mayor',
          intro: (
            <>
              <p>
                Un arreglo puede empezar <b>vacío</b> (<code>[]</code>) y llenarse con <code>push</code>. Después se recorre para
                sumar o buscar el mayor:
              </p>
              <Ej c={'const precios = [];\nprecios.push(500);\nprecios.push(1200);\n\nlet suma = 0;\nlet mayor = precios[0];\nfor (const p of precios) {\n  suma += p;\n  if (p > mayor) {\n    mayor = p;\n  }\n}\nconsole.log(suma, mayor);   // 1700 1200'} />
              <p>
                Para redondear a 2 decimales: <code>Math.round(x * 100) / 100</code>.
              </p>
            </>
          ),
          task: (
            <>
              <p>
                Preguntá cuántas notas son y después cada nota, guardándolas en un arreglo <code>notas</code> con push. Mostrá el
                arreglo, el promedio (redondeado a 2 decimales) y la mejor nota.
              </p>
              <Ej c={'Entrada: 3\n         7\n         8\n         9\nSalida:  Notas: [7, 8, 9]\n         Promedio: 8\n         Mejor nota: 9'} />
            </>
          ),
          hint: <p>console.log("Notas:", notas) muestra el arreglo. Si se ve ['7', '8'] con comillas, te faltó convertir con Number.</p>,
          sampleInput: '3\n7\n8\n9',
          starter: 'const cantidad = Number(prompt("¿Cuántas notas?"));\nconst notas = [];\n\n',
          solution:
            'const cantidad = Number(prompt("¿Cuántas notas?"));\nconst notas = [];\n\nfor (let i = 1; i <= cantidad; i++) {\n  notas.push(Number(prompt("Nota " + i)));\n}\n\nlet suma = 0;\nlet mejor = notas[0];\nfor (const nota of notas) {\n  suma += nota;\n  if (nota > mejor) {\n    mejor = nota;\n  }\n}\n\nconsole.log("Notas:", notas);\nconsole.log("Promedio:", Math.round((suma / notas.length) * 100) / 100);\nconsole.log("Mejor nota:", mejor);\n',
          tests: [
            { text: 'Con 7, 8 y 9: [7, 8, 9], promedio 8, mejor 9', input: '3\n7\n8\n9', check: (out) => eq(out, ['Notas: [7, 8, 9]', 'Promedio: 8', 'Mejor nota: 9']) },
            { text: 'Con 10, 6, 7 y 4: promedio 6.75, mejor 10', input: '4\n10\n6\n7\n4', check: (out) => eq(out, ['Notas: [10, 6, 7, 4]', 'Promedio: 6.75', 'Mejor nota: 10']) },
            { text: 'Con 7, 7 y 8: promedio 7.33 (2 decimales), mejor 8', input: '3\n7\n7\n8', check: (out) => eq(out, ['Notas: [7, 7, 8]', 'Promedio: 7.33', 'Mejor nota: 8']) },
            { text: 'Llena el arreglo con push', check: (_o, code) => uses(code, /\bnotas\.push\s*\(/) },
          ],
        },
        {
          id: 'js-buscar',
          kind: 'js',
          title: 'Buscar en un arreglo: includes, indexOf y join',
          intro: (
            <>
              <ul>
                <li>
                  <code>lista.includes(x)</code> → <code>true</code> si x está en la lista.
                </li>
                <li>
                  <code>lista.indexOf(x)</code> → la posición de x (o <code>-1</code> si no está).
                </li>
                <li>
                  <code>lista.join(", ")</code> → arma un texto con todos, separados por lo que le pases.
                </li>
              </ul>
              <Ej c={'const sabores = ["dulce de leche", "chocolate", "frutilla"];\nconsole.log(sabores.includes("chocolate"));  // true\nconsole.log(sabores.indexOf("frutilla"));     // 2\nconsole.log(sabores.join(" - "));             // dulce de leche - chocolate - frutilla'} />
            </>
          ),
          task: (
            <>
              <p>
                Primero mostrá los invitados al cumple con join: <code>Invitados: Ana, Bruno, Camila, Diego, Emilia</code>. Después
                preguntá un nombre y mostrá si está (con su número en la lista, que es la posición + 1) o si no está.
              </p>
              <Ej c={'Entrada: Diego\nSalida:  Invitados: Ana, Bruno, Camila, Diego, Emilia\n         Diego está en la lista (número 4)\n\nEntrada: Pedro\nSalida:  Invitados: Ana, Bruno, Camila, Diego, Emilia\n         Pedro no está en la lista'} />
            </>
          ),
          hint: <p>if (invitados.includes(nombre)) {'{'} … invitados.indexOf(nombre) + 1 … {'}'} else {'{'} … {'}'}</p>,
          sampleInput: 'Diego',
          starter: 'const invitados = ["Ana", "Bruno", "Camila", "Diego", "Emilia"];\n\nconst nombre = prompt("¿A quién buscás?");\n',
          solution:
            'const invitados = ["Ana", "Bruno", "Camila", "Diego", "Emilia"];\n\nconsole.log("Invitados: " + invitados.join(", "));\n\nconst nombre = prompt("¿A quién buscás?");\nif (invitados.includes(nombre)) {\n  console.log(`${nombre} está en la lista (número ${invitados.indexOf(nombre) + 1})`);\n} else {\n  console.log(`${nombre} no está en la lista`);\n}\n',
          tests: [
            { text: 'La primera línea muestra los invitados separados por coma', input: 'Ana', check: (out) => ls(out)[0] === 'Invitados: Ana, Bruno, Camila, Diego, Emilia' },
            { text: 'Con Ana: "Ana está en la lista (número 1)"', input: 'Ana', check: (out) => ls(out).length === 2 && last(out) === 'Ana está en la lista (número 1)' },
            { text: 'Con Diego: "Diego está en la lista (número 4)"', input: 'Diego', check: (out) => last(out) === 'Diego está en la lista (número 4)' },
            { text: 'Con Pedro: "Pedro no está en la lista"', input: 'Pedro', check: (out) => ls(out).length === 2 && last(out) === 'Pedro no está en la lista' },
            { text: 'Usa join e indexOf', check: (_o, code) => uses(code, /\.join\s*\(/) && uses(code, /\.indexOf\s*\(/) },
          ],
        },
        {
          id: 'js-mini-boletin',
          kind: 'js',
          title: 'Mini-proyecto: boletín de notas',
          intro: (
            <>
              <p>
                Juntemos arreglos, bucles y decisiones para armar un boletín. Tip: podés guardar las notas en otro arreglo, en el
                mismo orden que las materias, así <code>materias[i]</code> y <code>notas[i]</code> van juntas.
              </p>
            </>
          ),
          task: (
            <>
              <p>
                Pedí la nota de cada materia (en el orden del arreglo). Mostrá una línea por materia con <code>(aprobada)</code> si
                es 6 o más o <code>(a recuperar)</code> si no. Al final, el promedio (2 decimales) y cuántas hay que recuperar.
              </p>
              <Ej c={'Entrada: 8, 4, 7 y 10 (una por línea)\nSalida:  Lengua: 8 (aprobada)\n         Matemática: 4 (a recuperar)\n         Historia: 7 (aprobada)\n         Computación: 10 (aprobada)\n         Promedio: 7.25\n         Materias a recuperar: 1'} />
            </>
          ),
          hint: <p>Un for de 0 a materias.length - 1: pedí la nota, mostrala con la materia, sumala y contá las desaprobadas. Después del for, mostrá el resumen.</p>,
          sampleInput: '8\n4\n7\n10',
          starter: 'const materias = ["Lengua", "Matemática", "Historia", "Computación"];\n\n',
          solution:
            'const materias = ["Lengua", "Matemática", "Historia", "Computación"];\n\nlet suma = 0;\nlet recuperar = 0;\nfor (let i = 0; i < materias.length; i++) {\n  const nota = Number(prompt("Nota de " + materias[i]));\n  suma += nota;\n  if (nota >= 6) {\n    console.log(`${materias[i]}: ${nota} (aprobada)`);\n  } else {\n    console.log(`${materias[i]}: ${nota} (a recuperar)`);\n    recuperar++;\n  }\n}\n\nconsole.log("Promedio:", Math.round((suma / materias.length) * 100) / 100);\nconsole.log("Materias a recuperar:", recuperar);\n',
          tests: [
            {
              text: 'Con 8, 4, 7 y 10: boletín completo, promedio 7.25 y 1 a recuperar',
              input: '8\n4\n7\n10',
              check: (out) => eq(out, ['Lengua: 8 (aprobada)', 'Matemática: 4 (a recuperar)', 'Historia: 7 (aprobada)', 'Computación: 10 (aprobada)', 'Promedio: 7.25', 'Materias a recuperar: 1']),
            },
            {
              text: 'Con todo 6: todas aprobadas, promedio 6 y 0 a recuperar',
              input: '6\n6\n6\n6',
              check: (out) => eq(out, ['Lengua: 6 (aprobada)', 'Matemática: 6 (aprobada)', 'Historia: 6 (aprobada)', 'Computación: 6 (aprobada)', 'Promedio: 6', 'Materias a recuperar: 0']),
            },
            {
              text: 'Con 2, 9, 5 y 3: promedio 4.75 y 3 a recuperar',
              input: '2\n9\n5\n3',
              check: (out) => eq(out, ['Lengua: 2 (a recuperar)', 'Matemática: 9 (aprobada)', 'Historia: 5 (a recuperar)', 'Computación: 3 (a recuperar)', 'Promedio: 4.75', 'Materias a recuperar: 3']),
            },
            { text: 'Recorre las materias con un bucle', check: (_o, code) => uses(code, /\bfor\s*\(/) && count(code, /\bprompt\s*\(/g) === 1 },
          ],
        },
      ],
    },

    /* ================================================================ 9. TEXTOS */
    {
      id: 'js-textos',
      title: 'Textos',
      desc: 'Trabajar con textos: largo, mayúsculas, buscar, cortar y recorrer letra por letra.',
      lessons: [
        {
          id: 'js-texto',
          kind: 'js',
          title: 'Largo, mayúsculas y espacios',
          intro: (
            <>
              <p>Los textos también tienen herramientas propias:</p>
              <Ej c={'const club = "  Belgrano ";\nconst limpio = club.trim();          // "Belgrano" (saca espacios de los costados)\nconsole.log(limpio.length);          // 8 letras\nconsole.log(limpio.toUpperCase());   // BELGRANO\nconsole.log(limpio.toLowerCase());   // belgrano\nconsole.log(limpio[0]);              // B (la primera letra, como en los arreglos)'} />
            </>
          ),
          task: (
            <>
              <p>
                Preguntá el nombre de un club y <b>sacale los espacios de los costados</b> con trim. Mostrá:
              </p>
              <Ej c={'Entrada: Talleres\nSalida:  En mayúsculas: TALLERES\n         Letras: 8\n         Primera letra: T\n         Última letra: s'} />
            </>
          ),
          hint: <p>La última letra está en la posición nombre.length - 1.</p>,
          sampleInput: 'Talleres',
          starter: 'const nombre = prompt("¿De qué club sos?");\n\n',
          solution:
            'const nombre = prompt("¿De qué club sos?").trim();\n\nconsole.log("En mayúsculas:", nombre.toUpperCase());\nconsole.log("Letras:", nombre.length);\nconsole.log("Primera letra:", nombre[0]);\nconsole.log("Última letra:", nombre[nombre.length - 1]);\n',
          tests: [
            { text: 'Con Talleres: TALLERES, 8, T y s', input: 'Talleres', check: (out) => eq(out, ['En mayúsculas: TALLERES', 'Letras: 8', 'Primera letra: T', 'Última letra: s']) },
            { text: 'Con Instituto: INSTITUTO, 9, I y o', input: 'Instituto', check: (out) => eq(out, ['En mayúsculas: INSTITUTO', 'Letras: 9', 'Primera letra: I', 'Última letra: o']) },
            { text: 'Con "  Racing  " (con espacios): 6 letras, R y g', input: '  Racing  ', check: (out) => eq(out, ['En mayúsculas: RACING', 'Letras: 6', 'Primera letra: R', 'Última letra: g']) },
            { text: 'Usa toUpperCase y trim', check: (_o, code) => uses(code, /\.toUpperCase\s*\(/) && uses(code, /\.trim\s*\(/) },
          ],
        },
        {
          id: 'js-slice',
          kind: 'js',
          title: 'Buscar y cortar: includes, indexOf, slice y split',
          intro: (
            <>
              <Ej c={'const mail = "sofia@villada.edu.ar";\nconsole.log(mail.includes("@"));     // true\nconsole.log(mail.indexOf("@"));      // 5 (posición de la arroba)\nconsole.log(mail.slice(0, 5));       // sofia  (desde 0 hasta antes del 5)\nconsole.log(mail.slice(6));          // villada.edu.ar (desde el 6 hasta el final)\n\nconst partes = "Ana Pérez".split(" ");   // corta en un arreglo\nconsole.log(partes);                      // [\'Ana\', \'Pérez\']'} />
            </>
          ),
          task: (
            <>
              <p>
                Preguntá un mail. Si no tiene <code>@</code>, mostrá <code>Mail inválido</code>. Si tiene, mostrá el usuario (lo que
                está antes de la arroba) y el dominio (lo que está después).
              </p>
              <Ej c={'Entrada: ana.perez@gmail.com\nSalida:  Usuario: ana.perez\n         Dominio: gmail.com\n\nEntrada: juan\nSalida:  Mail inválido'} />
            </>
          ),
          hint: <p>const pos = mail.indexOf("@"); el usuario es mail.slice(0, pos) y el dominio mail.slice(pos + 1). También sirve mail.split("@").</p>,
          sampleInput: 'ana.perez@gmail.com',
          starter: 'const mail = prompt("Tu mail");\n\n',
          solution:
            'const mail = prompt("Tu mail");\n\nif (!mail.includes("@")) {\n  console.log("Mail inválido");\n} else {\n  const pos = mail.indexOf("@");\n  console.log("Usuario:", mail.slice(0, pos));\n  console.log("Dominio:", mail.slice(pos + 1));\n}\n',
          tests: [
            { text: 'Con ana.perez@gmail.com: usuario ana.perez y dominio gmail.com', input: 'ana.perez@gmail.com', check: (out) => eq(out, ['Usuario: ana.perez', 'Dominio: gmail.com']) },
            { text: 'Con tomi_2010@villada.edu.ar: usuario tomi_2010 y dominio villada.edu.ar', input: 'tomi_2010@villada.edu.ar', check: (out) => eq(out, ['Usuario: tomi_2010', 'Dominio: villada.edu.ar']) },
            { text: 'Con juan: "Mail inválido"', input: 'juan', check: (out) => eq(out, ['Mail inválido']) },
            { text: 'Usa includes o indexOf, y slice o split', check: (_o, code) => uses(code, /\.(includes|indexOf)\s*\(/) && uses(code, /\.(slice|split)\s*\(/) },
          ],
        },
        {
          id: 'js-letras',
          kind: 'js',
          title: 'Mini-proyecto: letra por letra (palíndromos)',
          intro: (
            <>
              <p>
                Un texto se puede recorrer como un arreglo, letra por letra, con <code>for...of</code>. Para darlo vuelta, ponemos
                cada letra <b>adelante</b> de lo que ya tenemos:
              </p>
              <Ej c={'const palabra = "taller";\nlet alReves = "";\nfor (const letra of palabra) {\n  alReves = letra + alReves;\n}\nconsole.log(alReves);   // rellat'} />
              <p>
                Un <b>palíndromo</b> se lee igual al derecho y al revés, como <i>neuquen</i> o <i>reconocer</i>.
              </p>
            </>
          ),
          task: (
            <>
              <p>
                Preguntá una palabra y pasala a minúsculas. Con un bucle, armala al revés y contá sus vocales (incluí las que llevan
                tilde: <code>"aeiouáéíóú"</code>). Mostrá:
              </p>
              <Ej c={'Entrada: Neuquen\nSalida:  Al revés: neuquen\n         Vocales: 4\n         Es palíndromo\n\nEntrada: Córdoba\nSalida:  Al revés: abodróc\n         Vocales: 3\n         No es palíndromo'} />
            </>
          ),
          hint: <p>Para saber si una letra es vocal: "aeiouáéíóú".includes(letra). Es palíndromo si alReves === palabra.</p>,
          sampleInput: 'Neuquen',
          starter: 'const palabra = prompt("Escribí una palabra").toLowerCase();\nlet alReves = "";\nlet vocales = 0;\n\n',
          solution:
            'const palabra = prompt("Escribí una palabra").toLowerCase();\nlet alReves = "";\nlet vocales = 0;\n\nfor (const letra of palabra) {\n  alReves = letra + alReves;\n  if ("aeiouáéíóú".includes(letra)) {\n    vocales++;\n  }\n}\n\nconsole.log("Al revés:", alReves);\nconsole.log("Vocales:", vocales);\nif (alReves === palabra) {\n  console.log("Es palíndromo");\n} else {\n  console.log("No es palíndromo");\n}\n',
          tests: [
            { text: 'Con Neuquen: neuquen, 4 vocales, es palíndromo', input: 'Neuquen', check: (out) => eq(out, ['Al revés: neuquen', 'Vocales: 4', 'Es palíndromo']) },
            { text: 'Con Córdoba: abodróc, 3 vocales, no es palíndromo', input: 'Córdoba', check: (out) => eq(out, ['Al revés: abodróc', 'Vocales: 3', 'No es palíndromo']) },
            { text: 'Con reconocer: reconocer, 4 vocales, es palíndromo', input: 'reconocer', check: (out) => eq(out, ['Al revés: reconocer', 'Vocales: 4', 'Es palíndromo']) },
            { text: 'Con Villada: adalliv, 3 vocales, no es palíndromo', input: 'Villada', check: (out) => eq(out, ['Al revés: adalliv', 'Vocales: 3', 'No es palíndromo']) },
            { text: 'Recorre la palabra con un bucle', check: (_o, code) => uses(code, /\b(for|while)\s*\(/) },
          ],
        },
      ],
    },

    /* ================================================================ 10. OBJETOS */
    {
      id: 'js-objetos',
      title: 'Objetos',
      desc: 'Juntar varios datos de una misma cosa con nombre: propiedades y listas de objetos.',
      lessons: [
        {
          id: 'js-objeto',
          kind: 'js',
          title: 'Objetos: datos con nombre',
          intro: (
            <>
              <p>
                Un <b>objeto</b> junta varios datos de una misma cosa. Cada dato es una <b>propiedad</b> con nombre y valor, entre
                llaves. Se lee y se cambia con un punto.
              </p>
              <Ej c={'const alumno = {\n  nombre: "Ana",\n  edad: 15,\n  curso: "3B",\n};\nconsole.log(alumno.nombre);   // Ana\nalumno.edad = 16;             // cumplió años\nconsole.log(alumno);          // {nombre: \'Ana\', edad: 16, curso: \'3B\'}'} />
            </>
          ),
          task: (
            <>
              <p>
                Creá un objeto <code>jugador</code> con <code>nombre</code> "Lionel", <code>camiseta</code> 10 y <code>goles</code> 0.
                Mostrá la primera línea usando las propiedades. Después sumale 2 goles a la propiedad <code>goles</code>, mostrala y
                mostrá el objeto entero.
              </p>
              <Ej c={"Lionel usa la 10\nGoles: 2\n{nombre: 'Lionel', camiseta: 10, goles: 2}"} />
            </>
          ),
          hint: <p>console.log(jugador.nombre, "usa la", jugador.camiseta); y para sumar: jugador.goles += 2;</p>,
          starter: '// Creá el objeto jugador\n\n',
          solution:
            'const jugador = {\n  nombre: "Lionel",\n  camiseta: 10,\n  goles: 0,\n};\n\nconsole.log(jugador.nombre, "usa la", jugador.camiseta);\njugador.goles += 2;\nconsole.log("Goles:", jugador.goles);\nconsole.log(jugador);\n',
          tests: [
            { text: 'Muestra las tres líneas pedidas', check: (out) => eq(out, ['Lionel usa la 10', 'Goles: 2', "{nombre: 'Lionel', camiseta: 10, goles: 2}"]) },
            { text: 'Crea el objeto con llaves y la propiedad nombre', check: (_o, code) => uses(code, /\bjugador\s*=\s*\{[\s\S]*\bnombre\s*:/) },
            { text: 'Cambia jugador.goles', check: (_o, code) => uses(code, /jugador\.goles\s*(\+=|=(?!=)|\+\+)/) },
            { text: 'Lee las propiedades con punto (jugador.nombre)', check: (_o, code) => uses(code, /jugador\.nombre/) },
          ],
        },
        {
          id: 'js-mini-pedido',
          kind: 'js',
          title: 'Mini-proyecto: pedido en el kiosco',
          intro: (
            <>
              <p>
                Lo más común es tener un <b>arreglo de objetos</b>: una lista de productos, de alumnos, de partidos… Se recorre con{' '}
                <code>for...of</code> y se usa cada propiedad:
              </p>
              <Ej c={'const alumnos = [\n  { nombre: "Ana", nota: 8 },\n  { nombre: "Bruno", nota: 5 },\n];\nfor (const a of alumnos) {\n  if (a.nombre === "Bruno") {\n    console.log("Encontré a Bruno, tiene", a.nota);\n  }\n}'} />
            </>
          ),
          task: (
            <>
              <p>
                Pedí productos hasta que escriban <code>fin</code>. Para cada uno buscalo en el arreglo: si está, mostrá su precio y
                sumalo; si no, mostrá <code>No hay …</code>. Al final mostrá el total.
              </p>
              <Ej c={'Entrada: chicle\n         mate cocido\n         alfajor\n         fin\nSalida:  chicle: $150\n         No hay mate cocido\n         alfajor: $500\n         Total: $650'} />
            </>
          ),
          hint: <p>Adentro del while, usá una variable encontrado = null y un for...of que la llene si p.nombre === pedido. Después, if (encontrado) …</p>,
          sampleInput: 'chicle\nmate cocido\nalfajor\nfin',
          starter:
            'const productos = [\n  { nombre: "alfajor", precio: 500 },\n  { nombre: "gaseosa", precio: 1200 },\n  { nombre: "turrón", precio: 300 },\n  { nombre: "chicle", precio: 150 },\n];\n\nlet total = 0;\n\n',
          solution:
            'const productos = [\n  { nombre: "alfajor", precio: 500 },\n  { nombre: "gaseosa", precio: 1200 },\n  { nombre: "turrón", precio: 300 },\n  { nombre: "chicle", precio: 150 },\n];\n\nlet total = 0;\n\nwhile (true) {\n  const pedido = prompt("¿Qué llevás? (o fin)");\n  if (pedido === "fin" || pedido === null) {\n    break;\n  }\n  let encontrado = null;\n  for (const p of productos) {\n    if (p.nombre === pedido) {\n      encontrado = p;\n    }\n  }\n  if (encontrado) {\n    console.log(`${encontrado.nombre}: $${encontrado.precio}`);\n    total += encontrado.precio;\n  } else {\n    console.log("No hay " + pedido);\n  }\n}\n\nconsole.log("Total: $" + total);\n',
          tests: [
            { text: 'Con alfajor y gaseosa: los dos precios y Total: $1700', input: 'alfajor\ngaseosa\nfin', check: (out) => eq(out, ['alfajor: $500', 'gaseosa: $1200', 'Total: $1700']) },
            {
              text: 'Con chicle, mate cocido y chicle: avisa "No hay mate cocido" y Total: $300',
              input: 'chicle\nmate cocido\nchicle\nfin',
              check: (out) => eq(out, ['chicle: $150', 'No hay mate cocido', 'chicle: $150', 'Total: $300']),
            },
            { text: 'Con turrón: "turrón: $300" y Total: $300', input: 'turrón\nfin', check: (out) => eq(out, ['turrón: $300', 'Total: $300']) },
            { text: 'Si escriben fin de entrada: Total: $0', input: 'fin', check: (out) => eq(out, ['Total: $0']) },
            { text: 'Usa la propiedad precio de los objetos', check: (_o, code) => uses(code, /\.precio\b/) },
          ],
        },
      ],
    },

    /* ================================================================ 11. JAVASCRIPT EN LA PÁGINA */
    {
      id: 'js-dom',
      title: 'JavaScript en la página',
      desc: 'Tomar elementos del HTML, cambiar textos y atributos, responder a clics, campos, teclas y formularios.',
      lessons: [
        {
          id: 'js-dom-intro',
          kind: 'dom',
          title: 'Tomar elementos y cambiar textos',
          intro: (
            <>
              <p>
                Ahora JavaScript trabaja con <b>tu página HTML</b>. <code>document</code> es la página entera, y desde ahí tomamos
                elementos:
              </p>
              <ul>
                <li>
                  <code>document.getElementById("aula")</code>: el elemento con <code>id="aula"</code>.
                </li>
                <li>
                  <code>document.querySelector(".profe")</code>: el primero que coincide con un selector (<code>#id</code>,{' '}
                  <code>.clase</code> o una etiqueta como <code>h1</code>).
                </li>
              </ul>
              <p>
                Con <code>textContent</code> leemos o cambiamos su texto. (Existe también <code>innerHTML</code>, que interpreta
                etiquetas, pero para textos usá <code>textContent</code>: es más seguro.)
              </p>
              <Ej c={'const titulo = document.getElementById("titulo");\ntitulo.textContent = "Nuevo título";\nconsole.log(titulo.textContent);'} />
              <p>Tu código se ejecuta después de que se armó la página, así que los elementos ya existen.</p>
            </>
          ),
          task: (
            <>
              <p>Sin tocar el HTML, desde JavaScript:</p>
              <ul>
                <li>
                  Con getElementById, cambiá <code>#titulo</code> a <b>Taller de Computación</b> y <code>#aula</code> a{' '}
                  <b>Aula: Laboratorio 2</b>.
                </li>
                <li>
                  Con querySelector, cambiá el párrafo de clase <code>profe</code> a <b>Profe: Sofía</b>.
                </li>
              </ul>
            </>
          ),
          hint: <p>document.querySelector(".profe").textContent = "Profe: Sofía"; (fijate el punto antes de profe).</p>,
          edit: ['js'],
          starter: {
            html: '<h1 id="titulo">Título</h1>\n<p id="aula">Aula: ...</p>\n<p class="profe">Profe: ...</p>\n',
            js: '// Escribí tu código acá\n',
          },
          solution: {
            html: '<h1 id="titulo">Título</h1>\n<p id="aula">Aula: ...</p>\n<p class="profe">Profe: ...</p>\n',
            js: 'const titulo = document.getElementById("titulo");\ntitulo.textContent = "Taller de Computación";\n\ndocument.getElementById("aula").textContent = "Aula: Laboratorio 2";\ndocument.querySelector(".profe").textContent = "Profe: Sofía";\n',
          },
          tests: [
            { text: 'El título dice "Taller de Computación"', test: (c) => c.text('#titulo') === 'Taller de Computación' },
            { text: '#aula dice "Aula: Laboratorio 2"', test: (c) => c.text('#aula') === 'Aula: Laboratorio 2' },
            { text: 'El párrafo .profe dice "Profe: Sofía"', test: (c) => c.text('.profe') === 'Profe: Sofía' },
            { text: 'Usa getElementById y querySelector', test: (c) => uses(c.js, /getElementById\s*\(/) && uses(c.js, /querySelector\s*\(/) },
            noErrors,
          ],
        },
        {
          id: 'js-dom-1',
          kind: 'dom',
          title: 'Un botón que saluda',
          intro: (
            <>
              <p>
                Desde JavaScript podemos tomar un elemento de la página por su <code>id</code> y cambiarle el texto. Y con{' '}
                <code>addEventListener</code> hacemos que algo pase cuando tocan un botón:
              </p>
              <pre>
                <code>{'const boton = document.getElementById("boton");\nconst mensaje = document.getElementById("mensaje");\n\nboton.addEventListener("click", function () {\n  mensaje.textContent = "¡Me tocaste!";\n});'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              Cuando se toque el botón <code>#saludar</code>, el párrafo <code>#saludo</code> tiene que decir <b>¡Hola, Villada!</b>
            </p>
          ),
          hint: <p>Tomá el botón y el párrafo con document.getElementById y cambiá el textContent dentro de la función del click.</p>,
          edit: ['js'],
          starter: {
            html: '<h1>Saludador</h1>\n<button id="saludar">Saludar</button>\n<p id="saludo">...</p>\n',
            js: '// Escribí tu código acá\n',
          },
          solution: {
            html: '<h1>Saludador</h1>\n<button id="saludar">Saludar</button>\n<p id="saludo">...</p>\n',
            js: 'const boton = document.getElementById("saludar");\nconst saludo = document.getElementById("saludo");\n\nboton.addEventListener("click", function () {\n  saludo.textContent = "¡Hola, Villada!";\n});\n',
          },
          tests: [
            { text: 'Antes de tocar, el párrafo no cambió', test: (c) => c.text('#saludo') === '...' },
            { text: 'Al tocar el botón, el párrafo dice "¡Hola, Villada!"', test: (c) => c.click('#saludar') && c.text('#saludo') === '¡Hola, Villada!' },
            { text: 'El programa no tiene errores', test: (c) => c.errors.length === 0 },
          ],
        },
        {
          id: 'js-dom-input',
          kind: 'dom',
          title: 'Leer lo que escriben',
          intro: (
            <>
              <p>
                Lo que alguien escribe en un <code>{'<input>'}</code> está en su propiedad <code>value</code>. El evento{' '}
                <code>"input"</code> pasa <b>cada vez que se escribe o borra</b> una letra, así que podemos actualizar la página en
                el momento:
              </p>
              <Ej c={'const campo = document.getElementById("club");\nconst vista = document.getElementById("vista");\n\ncampo.addEventListener("input", function () {\n  vista.textContent = "Sos de " + campo.value;\n});'} />
            </>
          ),
          task: (
            <>
              <p>
                Cada vez que escriban en <code>#nombre</code>:
              </p>
              <ul>
                <li>
                  <code>#vista</code> tiene que decir <b>Hola, Ana!</b> (con lo que escribieron), o <b>Escribí tu nombre</b> si el
                  campo quedó vacío;
                </li>
                <li>
                  <code>#letras</code> tiene que decir cuántas letras tiene, por ejemplo <b>3 letras</b>.
                </li>
              </ul>
            </>
          ),
          hint: <p>Adentro de la función del evento input: if (campo.value === "") … else … y para las letras campo.value.length + " letras".</p>,
          edit: ['js'],
          starter: {
            html: '<label for="nombre">Tu nombre:</label>\n<input id="nombre">\n<p id="vista">Escribí tu nombre</p>\n<p id="letras">0 letras</p>\n',
            js: 'const campo = document.getElementById("nombre");\nconst vista = document.getElementById("vista");\n\n',
          },
          solution: {
            html: '<label for="nombre">Tu nombre:</label>\n<input id="nombre">\n<p id="vista">Escribí tu nombre</p>\n<p id="letras">0 letras</p>\n',
            js: 'const campo = document.getElementById("nombre");\nconst vista = document.getElementById("vista");\nconst letras = document.getElementById("letras");\n\ncampo.addEventListener("input", function () {\n  if (campo.value === "") {\n    vista.textContent = "Escribí tu nombre";\n  } else {\n    vista.textContent = "Hola, " + campo.value + "!";\n  }\n  letras.textContent = campo.value.length + " letras";\n});\n',
          },
          tests: [
            { text: 'Al escribir "Ana", #vista dice "Hola, Ana!"', test: (c) => c.type('#nombre', 'Ana') && c.text('#vista') === 'Hola, Ana!' },
            { text: 'Al escribir "Lucía", #letras dice "5 letras"', test: (c) => c.type('#nombre', 'Lucía') && c.text('#letras') === '5 letras' },
            {
              text: 'Si borran todo, #vista vuelve a "Escribí tu nombre" y #letras dice "0 letras"',
              test: (c) => c.type('#nombre', 'Ana') && c.type('#nombre', '') && c.text('#vista') === 'Escribí tu nombre' && c.text('#letras') === '0 letras',
            },
            { text: 'Usa el evento "input"', test: (c) => /addEventListener\s*\(\s*["']input["']/.test(c.js) },
            noErrors,
          ],
        },
        {
          id: 'js-dom-number',
          kind: 'dom',
          title: 'Cuentas con lo que escriben',
          intro: (
            <>
              <p>
                Igual que con <code>prompt</code>, <code>value</code> es siempre <b>texto</b> (aunque el campo sea{' '}
                <code>type="number"</code>). Para sumar hay que convertir con <code>Number</code>. Si el campo está vacío,{' '}
                <code>value</code> es <code>""</code>.
              </p>
              <Ej c={'boton.addEventListener("click", function () {\n  if (campoA.value === "") {\n    salida.textContent = "Falta un número";\n    return;   // corta la función acá\n  }\n  const a = Number(campoA.value);\n  salida.textContent = "El doble es " + a * 2;\n});'} />
            </>
          ),
          task: (
            <>
              <p>
                Recaudación de la cooperadora: al tocar <code>#calcular</code>, <code>#total</code> tiene que mostrar la suma de lo
                juntado en la rifa y en el buffet, por ejemplo <b>Total recaudado: $3800</b>. Si alguno de los dos campos está vacío,
                mostrá <b>Completá los dos campos</b>.
              </p>
            </>
          ),
          hint: <p>Si te muestra $15002300, estás sumando textos: convertí cada value con Number.</p>,
          edit: ['js'],
          starter: {
            html: '<h1>Cooperadora</h1>\n<label for="rifa">Rifa: $</label>\n<input id="rifa" type="number">\n<label for="buffet">Buffet: $</label>\n<input id="buffet" type="number">\n<button id="calcular">Calcular</button>\n<p id="total"></p>\n',
            js: 'const rifa = document.getElementById("rifa");\nconst buffet = document.getElementById("buffet");\nconst total = document.getElementById("total");\n\ndocument.getElementById("calcular").addEventListener("click", function () {\n  total.textContent = "Total recaudado: $" + (rifa.value + buffet.value);\n});\n',
          },
          solution: {
            html: '<h1>Cooperadora</h1>\n<label for="rifa">Rifa: $</label>\n<input id="rifa" type="number">\n<label for="buffet">Buffet: $</label>\n<input id="buffet" type="number">\n<button id="calcular">Calcular</button>\n<p id="total"></p>\n',
            js: 'const rifa = document.getElementById("rifa");\nconst buffet = document.getElementById("buffet");\nconst total = document.getElementById("total");\n\ndocument.getElementById("calcular").addEventListener("click", function () {\n  if (rifa.value === "" || buffet.value === "") {\n    total.textContent = "Completá los dos campos";\n    return;\n  }\n  const suma = Number(rifa.value) + Number(buffet.value);\n  total.textContent = "Total recaudado: $" + suma;\n});\n',
          },
          tests: [
            {
              text: 'Con 1500 y 2300 muestra "Total recaudado: $3800"',
              test: (c) => c.type('#rifa', '1500') && c.type('#buffet', '2300') && c.click('#calcular') && c.text('#total') === 'Total recaudado: $3800',
            },
            {
              text: 'Con 10 y 5 muestra "Total recaudado: $15"',
              test: (c) => c.type('#rifa', '10') && c.type('#buffet', '5') && c.click('#calcular') && c.text('#total') === 'Total recaudado: $15',
            },
            {
              text: 'Si falta el buffet muestra "Completá los dos campos"',
              test: (c) => c.type('#rifa', '700') && c.click('#calcular') && c.text('#total') === 'Completá los dos campos',
            },
            noErrors,
          ],
        },
        {
          id: 'js-dom-atributos',
          kind: 'dom',
          title: 'Cambiar atributos: src, disabled y hidden',
          intro: (
            <>
              <p>Desde JavaScript también se cambian los <b>atributos</b> de los elementos:</p>
              <Ej c={'imagen.src = "img/escudo.png";      // otra imagen\nimagen.alt = "Escudo del club";\nboton.disabled = true;          // botón desactivado (no se puede tocar)\nparrafo.hidden = false;         // mostrar algo que estaba oculto\ncasilla.checked                 // true si la casilla está tildada'} />
              <p>
                El evento <code>"change"</code> avisa cuando tildan o destildan una casilla.
              </p>
              <p>
                Curiosidad: también se puede cambiar cómo se ve algo, por ejemplo <code>titulo.style.color = "red"</code>. En este
                taller no lo vamos a necesitar.
              </p>
            </>
          ),
          task: (
            <>
              <ul>
                <li>
                  Al tocar <code>#voley</code>, la imagen <code>#foto</code> pasa a <code>src="img/pelota-voley.png"</code>; al tocar{' '}
                  <code>#futbol</code>, vuelve a <code>src="img/pelota-futbol.png"</code>.
                </li>
                <li>
                  El botón <code>#enviar</code> empieza desactivado y se activa solo cuando la casilla <code>#acepto</code> está
                  tildada (si la destildan, se desactiva otra vez).
                </li>
                <li>
                  Al tocar <code>#enviar</code>, se muestra el párrafo oculto <code>#gracias</code>.
                </li>
              </ul>
            </>
          ),
          hint: <p>En el change de la casilla: enviar.disabled = !acepto.checked; Y en el click de enviar: gracias.hidden = false;</p>,
          edit: ['js'],
          starter: {
            html: '<h1>Inscripción al torneo</h1>\n<img id="foto" src="img/pelota-futbol.png" alt="Deporte elegido">\n<p>\n  <button id="futbol">Fútbol</button>\n  <button id="voley">Vóley</button>\n</p>\n<label><input type="checkbox" id="acepto"> Acepto el reglamento</label>\n<button id="enviar" disabled>Inscribirme</button>\n<p id="gracias" hidden>¡Listo, ya estás inscripto/a!</p>\n',
            js: 'const foto = document.getElementById("foto");\nconst acepto = document.getElementById("acepto");\nconst enviar = document.getElementById("enviar");\nconst gracias = document.getElementById("gracias");\n\n',
          },
          solution: {
            html: '<h1>Inscripción al torneo</h1>\n<img id="foto" src="img/pelota-futbol.png" alt="Deporte elegido">\n<p>\n  <button id="futbol">Fútbol</button>\n  <button id="voley">Vóley</button>\n</p>\n<label><input type="checkbox" id="acepto"> Acepto el reglamento</label>\n<button id="enviar" disabled>Inscribirme</button>\n<p id="gracias" hidden>¡Listo, ya estás inscripto/a!</p>\n',
            js: 'const foto = document.getElementById("foto");\nconst acepto = document.getElementById("acepto");\nconst enviar = document.getElementById("enviar");\nconst gracias = document.getElementById("gracias");\n\ndocument.getElementById("voley").addEventListener("click", function () {\n  foto.src = "img/pelota-voley.png";\n});\ndocument.getElementById("futbol").addEventListener("click", function () {\n  foto.src = "img/pelota-futbol.png";\n});\n\nacepto.addEventListener("change", function () {\n  enviar.disabled = !acepto.checked;\n});\n\nenviar.addEventListener("click", function () {\n  gracias.hidden = false;\n});\n',
          },
          tests: [
            { text: 'Al tocar Vóley, la imagen es img/pelota-voley.png', test: (c) => c.click('#voley') && c.$('#foto')?.getAttribute('src') === 'img/pelota-voley.png' },
            {
              text: 'Al tocar Vóley y después Fútbol, vuelve a img/pelota-futbol.png',
              test: (c) => c.click('#voley') && c.click('#futbol') && c.$('#foto')?.getAttribute('src') === 'img/pelota-futbol.png',
            },
            { text: 'Al tildar la casilla, #enviar se activa', test: (c) => c.click('#acepto') && !(c.$('#enviar') as HTMLButtonElement).disabled },
            { text: 'Al destildarla, #enviar se desactiva otra vez', test: (c) => c.click('#acepto') && c.click('#acepto') && (c.$('#enviar') as HTMLButtonElement).disabled },
            {
              text: 'Con la casilla tildada, tocar #enviar muestra #gracias',
              test: (c) => (c.$('#gracias') as HTMLElement).hidden && c.click('#acepto') && c.click('#enviar') && !(c.$('#gracias') as HTMLElement).hidden,
            },
            noErrors,
          ],
        },
        {
          id: 'js-dom-lista',
          kind: 'dom',
          title: 'Agregar elementos y la tecla Enter',
          intro: (
            <>
              <p>
                Para agregar algo nuevo a la página: se crea el elemento con <code>createElement</code>, se le pone texto y se mete
                adentro de otro con <code>appendChild</code>.
              </p>
              <Ej c={'const li = document.createElement("li");\nli.textContent = "Traer pendrive";\nlista.appendChild(li);'} />
              <p>
                El evento <code>"keydown"</code> avisa qué tecla apretaron, en <code>evento.key</code>:
              </p>
              <Ej c={'campo.addEventListener("keydown", function (evento) {\n  if (evento.key === "Enter") {\n    agregar();\n  }\n});'} />
              <p>Si dos eventos hacen lo mismo, escribí una función y llamala desde los dos.</p>
            </>
          ),
          task: (
            <>
              <p>
                Al tocar <code>#agregar</code> <b>o</b> apretar Enter en <code>#tarea</code>:
              </p>
              <ul>
                <li>
                  se agrega un <code>{'<li>'}</code> a <code>#lista</code> con el texto escrito (sin espacios de los costados);
                </li>
                <li>el campo se vacía;</li>
                <li>si el campo está vacío (o tiene solo espacios), no se agrega nada.</li>
              </ul>
            </>
          ),
          hint: <p>function agregar() {'{'} const texto = campo.value.trim(); if (texto === "") return; … {'}'}</p>,
          edit: ['js'],
          starter: {
            html: '<h1>Tareas del taller</h1>\n<input id="tarea" placeholder="Nueva tarea">\n<button id="agregar">Agregar</button>\n<ul id="lista"></ul>\n',
            js: 'const campo = document.getElementById("tarea");\nconst lista = document.getElementById("lista");\n\nfunction agregar() {\n  // completá\n}\n',
          },
          solution: {
            html: '<h1>Tareas del taller</h1>\n<input id="tarea" placeholder="Nueva tarea">\n<button id="agregar">Agregar</button>\n<ul id="lista"></ul>\n',
            js: 'const campo = document.getElementById("tarea");\nconst lista = document.getElementById("lista");\n\nfunction agregar() {\n  const texto = campo.value.trim();\n  if (texto === "") {\n    return;\n  }\n  const li = document.createElement("li");\n  li.textContent = texto;\n  lista.appendChild(li);\n  campo.value = "";\n}\n\ndocument.getElementById("agregar").addEventListener("click", agregar);\n\ncampo.addEventListener("keydown", function (evento) {\n  if (evento.key === "Enter") {\n    agregar();\n  }\n});\n',
          },
          tests: [
            {
              text: 'Al escribir "Traer pendrive" y tocar Agregar, aparece en la lista',
              test: (c) => c.type('#tarea', 'Traer pendrive') && c.click('#agregar') && texts(c, '#lista li').join('|') === 'Traer pendrive',
            },
            {
              text: 'Se pueden agregar varias, en orden',
              test: (c) => c.type('#tarea', 'Uno') && c.click('#agregar') && c.type('#tarea', 'Dos') && c.click('#agregar') && texts(c, '#lista li').join('|') === 'Uno|Dos',
            },
            { text: 'Después de agregar, el campo queda vacío', test: (c) => c.type('#tarea', 'Algo') && c.click('#agregar') && val(c, '#tarea') === '' && n(c, '#lista li') === 1 },
            {
              text: 'Con el campo vacío o con espacios no agrega nada',
              test: (c) => c.click('#agregar') && c.type('#tarea', '   ') && c.click('#agregar') && n(c, '#lista li') === 0,
            },
            { text: 'Apretar Enter en el campo también agrega', test: (c) => c.type('#tarea', 'Con Enter') && c.press('#tarea', 'Enter') && texts(c, '#lista li').join('|') === 'Con Enter' },
            { text: 'Otra tecla no agrega', test: (c) => c.type('#tarea', 'Hola') && c.press('#tarea', 'a') && n(c, '#lista li') === 0 },
            { text: 'Usa createElement y appendChild', test: (c) => uses(c.js, /createElement\s*\(/) && uses(c.js, /appendChild\s*\(/) },
            noErrors,
          ],
        },
        {
          id: 'js-dom-form',
          kind: 'dom',
          title: 'Formularios: submit y preventDefault',
          intro: (
            <>
              <p>
                Un <code>{'<form>'}</code> se envía al tocar su botón o al apretar Enter en un campo: pasa el evento{' '}
                <code>"submit"</code>. Normalmente el navegador recarga la página; con <code>evento.preventDefault()</code> lo
                evitamos y nos quedamos con los datos.
              </p>
              <Ej c={'formulario.addEventListener("submit", function (evento) {\n  evento.preventDefault();   // ¡que no recargue!\n  console.log("Nombre:", campo.value);\n});'} />
              <p>
                En un <code>{'<select>'}</code>, <code>value</code> es la opción elegida.
              </p>
            </>
          ),
          task: (
            <>
              <p>
                <b>HTML</b>: agregá dentro del formulario un botón <code>{'<button type="submit">Anotarme</button>'}</code> y, después
                del formulario, una lista <code>{'<ul id="anotados"></ul>'}</code>.
              </p>
              <p>
                <b>JavaScript</b>: al enviar el formulario <code>#inscripcion</code>:
              </p>
              <ul>
                <li>
                  si el nombre está vacío, <code>#error</code> dice <b>Falta el nombre</b> y no se agrega nada;
                </li>
                <li>
                  si no, se agrega a <code>#anotados</code> un <code>{'<li>'}</code> como <b>Ana - Vóley</b>, se vacía el nombre y{' '}
                  <code>#error</code> queda vacío.
                </li>
              </ul>
            </>
          ),
          hint: <p>Adentro del submit: preventDefault, después const nombre = campo.value.trim(); if (nombre === "") {'{'} … return; {'}'} y el resto como en la lista de tareas.</p>,
          edit: ['html', 'js'],
          starter: {
            html: HTML_FORM_INICIAL,
            js: 'const formulario = document.getElementById("inscripcion");\nconst campo = document.getElementById("nombre");\nconst deporte = document.getElementById("deporte");\nconst error = document.getElementById("error");\n\n',
          },
          solution: {
            html: HTML_FORM,
            js: 'const formulario = document.getElementById("inscripcion");\nconst campo = document.getElementById("nombre");\nconst deporte = document.getElementById("deporte");\nconst error = document.getElementById("error");\nconst anotados = document.getElementById("anotados");\n\nformulario.addEventListener("submit", function (evento) {\n  evento.preventDefault();\n  const nombre = campo.value.trim();\n  if (nombre === "") {\n    error.textContent = "Falta el nombre";\n    return;\n  }\n  const li = document.createElement("li");\n  li.textContent = nombre + " - " + deporte.value;\n  anotados.appendChild(li);\n  campo.value = "";\n  error.textContent = "";\n});\n',
          },
          tests: [
            { text: 'El formulario tiene un botón para enviar', test: (c) => c.$$('#inscripcion button, #inscripcion input[type=submit]').some((b) => (b as HTMLButtonElement).type === 'submit') },
            { text: 'Hay una lista <ul id="anotados">', test: (c) => !!c.$('ul#anotados') },
            {
              text: 'Con "Ana" y Vóley, al enviar se agrega "Ana - Vóley"',
              test: (c) => c.type('#nombre', 'Ana') && c.type('#deporte', 'Vóley') && enviar(c) && texts(c, '#anotados li').join('|') === 'Ana - Vóley',
            },
            {
              text: 'Después de anotar, el nombre queda vacío y se puede anotar a otra persona',
              test: (c) =>
                c.type('#nombre', 'Ana') && enviar(c) && val(c, '#nombre') === '' && c.type('#nombre', 'Bruno') && c.type('#deporte', 'Handball') && enviar(c) && texts(c, '#anotados li').join('|') === 'Ana - Fútbol|Bruno - Handball',
            },
            { text: 'Sin nombre, #error dice "Falta el nombre" y no agrega nada', test: (c) => enviar(c) && c.text('#error') === 'Falta el nombre' && n(c, '#anotados li') === 0 },
            { text: 'Después de un error, al anotar bien #error queda vacío', test: (c) => enviar(c) && c.type('#nombre', 'Ana') && enviar(c) && c.text('#error') === '' },
            { text: 'Usa el evento submit y preventDefault', test: (c) => /["']submit["']/.test(c.js) && uses(c.js, /\.preventDefault\s*\(/) },
            noErrors,
          ],
        },
      ],
    },

    /* ================================================================ 12. PROYECTOS EN LA PÁGINA */
    {
      id: 'js-proyectos',
      title: 'Proyectos en la página',
      desc: 'Pequeñas aplicaciones completas: marcador, promedio, lista de compras, juego y conversor.',
      lessons: [
        {
          id: 'js-proy-goles',
          kind: 'dom',
          title: 'Proyecto: contador de goles',
          intro: (
            <>
              <p>
                Un marcador para el clásico del barrio. La idea: guardar los goles en <b>variables</b> (<code>let</code>) y tener una
                función <code>actualizar()</code> que pase esos números a la página. Cada botón cambia la variable y llama a{' '}
                <code>actualizar()</code>.
              </p>
              <Ej c={'let golesLocal = 0;\n\nfunction actualizar() {\n  document.getElementById("local").textContent = golesLocal;\n  // …\n}\n\ndocument.getElementById("golLocal").addEventListener("click", function () {\n  golesLocal++;\n  actualizar();\n});'} />
            </>
          ),
          task: (
            <>
              <ul>
                <li>
                  <b>HTML</b>: agregá el botón <code>{'<button id="golVisitante">Gol de Villada FC</button>'}</code> donde dice el
                  comentario.
                </li>
                <li>
                  Cada botón de gol suma 1 en <code>#local</code> o <code>#visitante</code>.
                </li>
                <li>
                  <code>#estado</code> dice <b>Empate</b>, <b>Gana Los Pibes</b> o <b>Gana Villada FC</b> según el marcador.
                </li>
                <li>
                  <code>#reiniciar</code> vuelve todo a 0 y a <b>Empate</b>.
                </li>
              </ul>
            </>
          ),
          hint: <p>En actualizar(), además de los números, un if / else if / else que compare golesLocal con golesVisitante.</p>,
          edit: ['html', 'js'],
          starter: {
            html: HTML_GOLES,
            js: 'let golesLocal = 0;\nlet golesVisitante = 0;\n\nfunction actualizar() {\n  document.getElementById("local").textContent = golesLocal;\n}\n\n',
          },
          solution: {
            html: HTML_GOLES.replace('<!-- Agregá acá un botón con id="golVisitante" -->', '<button id="golVisitante">Gol de Villada FC</button>'),
            js: 'let golesLocal = 0;\nlet golesVisitante = 0;\n\nfunction actualizar() {\n  document.getElementById("local").textContent = golesLocal;\n  document.getElementById("visitante").textContent = golesVisitante;\n  const estado = document.getElementById("estado");\n  if (golesLocal > golesVisitante) {\n    estado.textContent = "Gana Los Pibes";\n  } else if (golesVisitante > golesLocal) {\n    estado.textContent = "Gana Villada FC";\n  } else {\n    estado.textContent = "Empate";\n  }\n}\n\ndocument.getElementById("golLocal").addEventListener("click", function () {\n  golesLocal++;\n  actualizar();\n});\n\ndocument.getElementById("golVisitante").addEventListener("click", function () {\n  golesVisitante++;\n  actualizar();\n});\n\ndocument.getElementById("reiniciar").addEventListener("click", function () {\n  golesLocal = 0;\n  golesVisitante = 0;\n  actualizar();\n});\n',
          },
          tests: [
            { text: 'Hay un botón con id="golVisitante"', test: (c) => c.$('#golVisitante')?.tagName === 'BUTTON' },
            {
              text: 'Dos goles de Los Pibes: 2 - 0 y "Gana Los Pibes"',
              test: (c) => c.click('#golLocal') && c.click('#golLocal') && c.text('#local') === '2' && c.text('#visitante') === '0' && c.text('#estado') === 'Gana Los Pibes',
            },
            {
              text: 'Un gol de cada uno: 1 - 1 y "Empate"',
              test: (c) => c.click('#golVisitante') && c.click('#golLocal') && c.text('#local') === '1' && c.text('#visitante') === '1' && c.text('#estado') === 'Empate',
            },
            {
              text: 'Tres de Villada FC y uno de Los Pibes: "Gana Villada FC"',
              test: (c) => c.click('#golVisitante') && c.click('#golVisitante') && c.click('#golLocal') && c.click('#golVisitante') && c.text('#visitante') === '3' && c.text('#estado') === 'Gana Villada FC',
            },
            {
              text: 'Reiniciar deja 0 - 0 y "Empate"',
              test: (c) => c.click('#golLocal') && c.click('#golVisitante') && c.click('#golVisitante') && c.click('#reiniciar') && c.text('#local') === '0' && c.text('#visitante') === '0' && c.text('#estado') === 'Empate',
            },
            noErrors,
          ],
        },
        {
          id: 'js-proy-promedio',
          kind: 'dom',
          title: 'Proyecto: calculadora de promedio',
          intro: (
            <>
              <p>
                Una calculadora para saber cómo venís en el trimestre. Antes de calcular, hay que <b>validar</b>: que los tres campos
                tengan un número y que esté entre 1 y 10.
              </p>
              <Ej c={'const nota = Number(campo.value);\nif (campo.value === "" || nota < 1 || nota > 10) {\n  // nota inválida\n}'} />
              <p>
                Tip: guardá los tres valores en un arreglo y recorrelo para validar y sumar.
              </p>
            </>
          ),
          task: (
            <>
              <p>
                Al tocar <code>#calcular</code>:
              </p>
              <ul>
                <li>
                  si alguna nota está vacía o fuera del 1 al 10: <code>#resultado</code> dice <b>Revisá las notas</b> y{' '}
                  <code>#estado</code> queda vacío;
                </li>
                <li>
                  si no: <code>#resultado</code> dice <b>Promedio: 7.67</b> (redondeado a 2 decimales) y <code>#estado</code> dice{' '}
                  <b>Aprobado</b> (6 o más) o <b>Desaprobado</b>.
                </li>
              </ul>
            </>
          ),
          hint: <p>const notas = [n1.value, n2.value, n3.value]; recorrelo con for...of. Para 2 decimales: Math.round(promedio * 100) / 100.</p>,
          edit: ['js'],
          starter: {
            html: HTML_PROMEDIO,
            js: 'const resultado = document.getElementById("resultado");\nconst estado = document.getElementById("estado");\n\ndocument.getElementById("calcular").addEventListener("click", function () {\n  // completá\n});\n',
          },
          solution: {
            html: HTML_PROMEDIO,
            js: 'const resultado = document.getElementById("resultado");\nconst estado = document.getElementById("estado");\n\ndocument.getElementById("calcular").addEventListener("click", function () {\n  const valores = [\n    document.getElementById("n1").value,\n    document.getElementById("n2").value,\n    document.getElementById("n3").value,\n  ];\n  let suma = 0;\n  for (const v of valores) {\n    const nota = Number(v);\n    if (v === "" || isNaN(nota) || nota < 1 || nota > 10) {\n      resultado.textContent = "Revisá las notas";\n      estado.textContent = "";\n      return;\n    }\n    suma += nota;\n  }\n  const promedio = Math.round((suma / valores.length) * 100) / 100;\n  resultado.textContent = "Promedio: " + promedio;\n  if (promedio >= 6) {\n    estado.textContent = "Aprobado";\n  } else {\n    estado.textContent = "Desaprobado";\n  }\n});\n',
          },
          tests: [
            {
              text: 'Con 7, 8 y 8: "Promedio: 7.67" y "Aprobado"',
              test: (c) => c.type('#n1', '7') && c.type('#n2', '8') && c.type('#n3', '8') && c.click('#calcular') && c.text('#resultado') === 'Promedio: 7.67' && c.text('#estado') === 'Aprobado',
            },
            {
              text: 'Con 6, 6 y 6: "Promedio: 6" y "Aprobado"',
              test: (c) => c.type('#n1', '6') && c.type('#n2', '6') && c.type('#n3', '6') && c.click('#calcular') && c.text('#resultado') === 'Promedio: 6' && c.text('#estado') === 'Aprobado',
            },
            {
              text: 'Con 4, 5 y 6: "Promedio: 5" y "Desaprobado"',
              test: (c) => c.type('#n1', '4') && c.type('#n2', '5') && c.type('#n3', '6') && c.click('#calcular') && c.text('#resultado') === 'Promedio: 5' && c.text('#estado') === 'Desaprobado',
            },
            {
              text: 'Con una nota vacía: "Revisá las notas" y #estado vacío',
              test: (c) => c.type('#n1', '7') && c.type('#n3', '8') && c.click('#calcular') && c.text('#resultado') === 'Revisá las notas' && c.text('#estado') === '',
            },
            {
              text: 'Con un 11: "Revisá las notas"',
              test: (c) => c.type('#n1', '11') && c.type('#n2', '8') && c.type('#n3', '8') && c.click('#calcular') && c.text('#resultado') === 'Revisá las notas',
            },
            {
              text: 'Si primero calcula bien y después hay un error, #estado se borra',
              test: (c) =>
                c.type('#n1', '9') && c.type('#n2', '9') && c.type('#n3', '9') && c.click('#calcular') && c.type('#n2', '0') && c.click('#calcular') && c.text('#resultado') === 'Revisá las notas' && c.text('#estado') === '',
            },
            noErrors,
          ],
        },
        {
          id: 'js-proy-compras',
          kind: 'dom',
          title: 'Proyecto: lista de compras',
          intro: (
            <>
              <p>
                Además de mostrar los productos en la página, conviene guardarlos en un <b>arreglo</b>: así podemos preguntar si uno
                ya está (<code>includes</code>) y saber cuántos hay (<code>length</code>).
              </p>
              <Ej c={'const productos = [];\n// al agregar:\nproductos.push(texto);\n// para vaciar la lista de la página:\nlista.textContent = "";'} />
            </>
          ),
          task: (
            <>
              <ul>
                <li>
                  <b>HTML</b>: agregá un botón <code>{'<button id="vaciar">Vaciar lista</button>'}</code>.
                </li>
                <li>
                  Al tocar <code>#agregar</code>: agrega el producto (sin espacios de los costados) como <code>{'<li>'}</code> en{' '}
                  <code>#lista</code> y vacía el campo. Si está vacío, no hace nada.
                </li>
                <li>
                  Si el producto ya está en la lista, no lo agrega y <code>#aviso</code> dice <b>Ya está en la lista</b> (si se
                  agrega bien, <code>#aviso</code> queda vacío).
                </li>
                <li>
                  <code>#total</code> dice <b>0 productos</b>, <b>1 producto</b>, <b>2 productos</b>… (¡ojo con el singular!).
                </li>
                <li>
                  <code>#vaciar</code> borra todo y deja <b>0 productos</b>.
                </li>
              </ul>
            </>
          ),
          hint: <p>Hacé una función mostrarTotal() que use productos.length y un if para el singular. Al vaciar, acordate de vaciar también el arreglo (productos.length = 0 o volver a crear la lista con let).</p>,
          edit: ['html', 'js'],
          starter: {
            html: HTML_COMPRAS,
            js: 'const campo = document.getElementById("producto");\nconst lista = document.getElementById("lista");\nconst productos = [];\n\n',
          },
          solution: {
            html: HTML_COMPRAS.replace('<!-- Agregá acá un botón con id="vaciar" -->', '<button id="vaciar">Vaciar lista</button>'),
            js: 'const campo = document.getElementById("producto");\nconst lista = document.getElementById("lista");\nconst aviso = document.getElementById("aviso");\nconst total = document.getElementById("total");\nlet productos = [];\n\nfunction mostrarTotal() {\n  if (productos.length === 1) {\n    total.textContent = "1 producto";\n  } else {\n    total.textContent = productos.length + " productos";\n  }\n}\n\ndocument.getElementById("agregar").addEventListener("click", function () {\n  const texto = campo.value.trim();\n  if (texto === "") {\n    return;\n  }\n  if (productos.includes(texto)) {\n    aviso.textContent = "Ya está en la lista";\n    return;\n  }\n  productos.push(texto);\n  const li = document.createElement("li");\n  li.textContent = texto;\n  lista.appendChild(li);\n  campo.value = "";\n  aviso.textContent = "";\n  mostrarTotal();\n});\n\ndocument.getElementById("vaciar").addEventListener("click", function () {\n  productos = [];\n  lista.textContent = "";\n  aviso.textContent = "";\n  mostrarTotal();\n});\n',
          },
          tests: [
            { text: 'Hay un botón con id="vaciar"', test: (c) => c.$('#vaciar')?.tagName === 'BUTTON' },
            {
              text: 'Al agregar pan y leche: 2 elementos en la lista y "2 productos"',
              test: (c) => c.type('#producto', 'pan') && c.click('#agregar') && c.type('#producto', 'leche') && c.click('#agregar') && texts(c, '#lista li').join('|') === 'pan|leche' && c.text('#total') === '2 productos',
            },
            { text: 'Con un solo producto dice "1 producto"', test: (c) => c.type('#producto', ' yerba ') && c.click('#agregar') && texts(c, '#lista li').join('|') === 'yerba' && c.text('#total') === '1 producto' && val(c, '#producto') === '' },
            {
              text: 'Un producto repetido no se agrega y avisa "Ya está en la lista"',
              test: (c) => c.type('#producto', 'pan') && c.click('#agregar') && c.type('#producto', 'pan') && c.click('#agregar') && n(c, '#lista li') === 1 && c.text('#aviso') === 'Ya está en la lista',
            },
            { text: 'Con el campo vacío no agrega nada', test: (c) => c.click('#agregar') && n(c, '#lista li') === 0 && c.text('#total') === '0 productos' },
            {
              text: 'Vaciar borra la lista, deja "0 productos" y después se puede volver a agregar lo mismo',
              test: (c) =>
                c.type('#producto', 'pan') && c.click('#agregar') && c.click('#vaciar') && n(c, '#lista li') === 0 && c.text('#total') === '0 productos' && c.type('#producto', 'pan') && c.click('#agregar') && n(c, '#lista li') === 1,
            },
            noErrors,
          ],
        },
        {
          id: 'js-proy-adivina',
          kind: 'dom',
          title: 'Proyecto: adiviná el número',
          intro: (
            <>
              <p>
                Un juego clásico: la computadora piensa un número del 1 al 100 y vos lo tenés que adivinar con pistas. Necesitás:
              </p>
              <ul>
                <li>
                  un número secreto al azar: <code>Math.floor(Math.random() * 100) + 1</code>;
                </li>
                <li>un contador de intentos;</li>
                <li>
                  comparar el intento con el secreto y mostrar una pista.
                </li>
              </ul>
              <p>
                Para «Jugar otra vez», el secreto tiene que estar en una variable <code>let</code> así se puede cambiar.
              </p>
            </>
          ),
          task: (
            <>
              <p>
                Al tocar <code>#probar</code> con el número de <code>#intento</code>:
              </p>
              <ul>
                <li>
                  si no es un número del 1 al 100: <code>#pista</code> dice <b>Escribí un número del 1 al 100</b> (no cuenta como
                  intento);
                </li>
                <li>
                  si no: suma un intento (<code>#intentos</code> dice <b>Intentos: 3</b>) y <code>#pista</code> dice <b>Es más alto</b>,{' '}
                  <b>Es más bajo</b> o <b>¡Adivinaste! Era el 42</b>;
                </li>
                <li>
                  al adivinar: <code>#probar</code> se desactiva y aparece <code>#otra</code>.
                </li>
              </ul>
              <p>
                <code>#otra</code> elige otro número, vuelve a <b>Intentos: 0</b>, borra la pista, activa <code>#probar</code> y se
                vuelve a ocultar.
              </p>
            </>
          ),
          hint: <p>Si el intento es menor que el secreto, la pista es «Es más alto» (el secreto es más alto que lo que dijiste).</p>,
          edit: ['js'],
          starter: {
            html: HTML_ADIVINA,
            js: 'let secreto = Math.floor(Math.random() * 100) + 1;\nlet intentos = 0;\n\nconst campo = document.getElementById("intento");\nconst probar = document.getElementById("probar");\nconst pista = document.getElementById("pista");\n\n',
          },
          solution: {
            html: HTML_ADIVINA,
            js: 'let secreto = Math.floor(Math.random() * 100) + 1;\nlet intentos = 0;\n\nconst campo = document.getElementById("intento");\nconst probar = document.getElementById("probar");\nconst pista = document.getElementById("pista");\nconst textoIntentos = document.getElementById("intentos");\nconst otra = document.getElementById("otra");\n\nprobar.addEventListener("click", function () {\n  const numero = Number(campo.value);\n  if (campo.value === "" || numero < 1 || numero > 100) {\n    pista.textContent = "Escribí un número del 1 al 100";\n    return;\n  }\n  intentos++;\n  textoIntentos.textContent = "Intentos: " + intentos;\n  if (numero < secreto) {\n    pista.textContent = "Es más alto";\n  } else if (numero > secreto) {\n    pista.textContent = "Es más bajo";\n  } else {\n    pista.textContent = "¡Adivinaste! Era el " + secreto;\n    probar.disabled = true;\n    otra.hidden = false;\n  }\n});\n\notra.addEventListener("click", function () {\n  secreto = Math.floor(Math.random() * 100) + 1;\n  intentos = 0;\n  textoIntentos.textContent = "Intentos: 0";\n  pista.textContent = "";\n  campo.value = "";\n  probar.disabled = false;\n  otra.hidden = true;\n});\n',
          },
          tests: [
            {
              text: 'Siguiendo las pistas "Es más alto" / "Es más bajo" se llega a "¡Adivinaste! Era el …"',
              test: (c) => {
                const r = jugar(c)
                return !!r && r.p === `¡Adivinaste! Era el ${r.m}`
              },
            },
            {
              text: 'Cuenta los intentos ("Intentos: N")',
              test: (c) => {
                const r = jugar(c)
                return !!r && c.text('#intentos') === `Intentos: ${r.k}`
              },
            },
            {
              text: 'Vacío o 150: "Escribí un número del 1 al 100" sin contar intento',
              test: (c) =>
                c.click('#probar') && c.text('#pista') === 'Escribí un número del 1 al 100' && c.type('#intento', '150') && c.click('#probar') && c.text('#pista') === 'Escribí un número del 1 al 100' && c.text('#intentos') === 'Intentos: 0',
            },
            {
              text: 'Al adivinar, #probar se desactiva y aparece #otra',
              test: (c) => !!jugar(c) && (c.$('#probar') as HTMLButtonElement).disabled && !(c.$('#otra') as HTMLElement).hidden,
            },
            {
              text: '"Jugar otra vez" reinicia todo y se puede volver a jugar',
              test: (c) =>
                !!jugar(c) && c.click('#otra') && c.text('#intentos') === 'Intentos: 0' && c.text('#pista') === '' && !(c.$('#probar') as HTMLButtonElement).disabled && (c.$('#otra') as HTMLElement).hidden && !!jugar(c),
            },
            { text: 'El número secreto sale de Math.random', test: (c) => uses(c.js, /Math\.random\s*\(/) },
            noErrors,
          ],
        },
        {
          id: 'js-proy-conversor',
          kind: 'dom',
          title: 'Proyecto: conversor de unidades',
          intro: (
            <>
              <p>
                Un conversor que calcula <b>mientras escribís</b>: escuchá el evento <code>"input"</code> del campo y el evento{' '}
                <code>"change"</code> del <code>{'<select>'}</code>, y que los dos llamen a la misma función.
              </p>
              <Ej c={'function convertir() {\n  const tipo = document.getElementById("tipo").value;   // "cf", "km" o "kg"\n  // …\n}\ncampo.addEventListener("input", convertir);\nselect.addEventListener("change", convertir);'} />
              <ul>
                <li>°C a °F: <code>c * 9 / 5 + 32</code></li>
                <li>km a millas: <code>km * 0.621371</code></li>
                <li>kg a libras: <code>kg * 2.20462</code></li>
              </ul>
            </>
          ),
          task: (
            <>
              <p>
                Cada vez que cambie la cantidad o el tipo, <code>#resultado</code> muestra la conversión (millas y libras redondeadas
                a 2 decimales):
              </p>
              <Ej c={'25 °C = 77 °F\n10 km = 6.21 millas\n5 kg = 11.02 libras'} />
              <p>
                Si la cantidad está vacía: <b>Escribí una cantidad</b>.
              </p>
            </>
          ),
          hint: <p>Un switch (tipo) o if / else if con los tres casos. Redondeo: Math.round(x * 100) / 100.</p>,
          edit: ['js'],
          starter: {
            html: HTML_CONVERSOR,
            js: 'const campo = document.getElementById("cantidad");\nconst tipo = document.getElementById("tipo");\nconst resultado = document.getElementById("resultado");\n\nfunction convertir() {\n  // completá\n}\n',
          },
          solution: {
            html: HTML_CONVERSOR,
            js: 'const campo = document.getElementById("cantidad");\nconst tipo = document.getElementById("tipo");\nconst resultado = document.getElementById("resultado");\n\nconst redondear = (x) => Math.round(x * 100) / 100;\n\nfunction convertir() {\n  if (campo.value === "") {\n    resultado.textContent = "Escribí una cantidad";\n    return;\n  }\n  const x = Number(campo.value);\n  switch (tipo.value) {\n    case "cf":\n      resultado.textContent = `${x} °C = ${redondear(x * 9 / 5 + 32)} °F`;\n      break;\n    case "km":\n      resultado.textContent = `${x} km = ${redondear(x * 0.621371)} millas`;\n      break;\n    case "kg":\n      resultado.textContent = `${x} kg = ${redondear(x * 2.20462)} libras`;\n      break;\n  }\n}\n\ncampo.addEventListener("input", convertir);\ntipo.addEventListener("change", convertir);\n',
          },
          tests: [
            { text: 'Con 25 (°C a °F): "25 °C = 77 °F"', test: (c) => c.type('#cantidad', '25') && c.text('#resultado') === '25 °C = 77 °F' },
            { text: 'Con -40: "-40 °C = -40 °F"', test: (c) => c.type('#cantidad', '-40') && c.text('#resultado') === '-40 °C = -40 °F' },
            { text: 'Eligiendo km y escribiendo 10: "10 km = 6.21 millas"', test: (c) => c.type('#tipo', 'km') && c.type('#cantidad', '10') && c.text('#resultado') === '10 km = 6.21 millas' },
            { text: 'Escribiendo 5 y después eligiendo kg: "5 kg = 11.02 libras"', test: (c) => c.type('#cantidad', '5') && c.type('#tipo', 'kg') && c.text('#resultado') === '5 kg = 11.02 libras' },
            { text: 'Si borran la cantidad: "Escribí una cantidad"', test: (c) => c.type('#cantidad', '5') && c.type('#cantidad', '') && c.text('#resultado') === 'Escribí una cantidad' },
            noErrors,
          ],
        },
      ],
    },
  ],
}
