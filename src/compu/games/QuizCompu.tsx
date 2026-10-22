import { QuizGame, shuffle, type QuizRound } from '../../games/QuizGame'
import './quiz.css'

type Lang = 'html' | 'js'

interface Q {
  lang: Lang
  /** las opciones son lo que muestra la consola (se ven con letra de código) */
  out?: boolean
  prompt: string
  code: string
  /** la primera opción es la correcta (después se mezclan) */
  options: string[]
  explain: string
}

const LANG_NAME: Record<Lang, string> = { html: 'HTML', js: 'JavaScript' }

/* ------------------------------------------------------------------ preguntas */

const POOL: Q[] = [
  /* ---------------------------------------------------------------- HTML */
  { lang: 'html', prompt: '¿Cuál es el título más importante de la página?', code: '<h1>…</h1>  <h3>…</h3>  <h6>…</h6>  <title>…</title>', options: ['h1', 'h6', 'h3', 'title'], explain: 'Los títulos van de h1 (el más importante) a h6. title es el nombre de la pestaña, no un título de la página.' },
  { lang: 'html', prompt: '¿Qué etiqueta hace una lista numerada?', code: '<??>\n  <li>Calentar el soldador</li>\n  <li>Limpiar la punta</li>\n</??>', options: ['ol', 'ul', 'li', 'list'], explain: 'ol (ordered list) numera los elementos; ul pone viñetas.' },
  { lang: 'html', prompt: '¿Qué se ve en la página?', code: '<p>Hola<br>Córdoba</p>', options: ['"Hola" y "Córdoba" en dos líneas', '"Hola Córdoba" en una línea', '"Hola<br>Córdoba"', 'Una línea horizontal entre las dos palabras'], explain: 'br es un salto de línea dentro del párrafo.' },
  { lang: 'html', prompt: '¿Qué se ve en la página?', code: '<!-- Precio: $2500 -->\n<p>Menú del día</p>', options: ['Solo "Menú del día"', '"Precio: $2500" y "Menú del día"', 'Solo "Precio: $2500"', 'Un error'], explain: 'Lo que está entre <!-- y --> es un comentario: el navegador no lo muestra.' },
  { lang: 'html', prompt: '¿Qué atributo describe la imagen para quien no la puede ver?', code: '<img src="cancha.jpg" ??="Cancha del club">', options: ['alt', 'src', 'title', 'desc'], explain: 'alt es el texto alternativo: lo leen los lectores de pantalla y aparece si la imagen no carga.' },
  { lang: 'html', prompt: '¿Dónde va la etiqueta <title>?', code: '<html>\n  <head> … </head>\n  <body> … </body>\n</html>', options: ['Dentro de <head>', 'Dentro de <body>', 'Antes de <html>', 'Después de </html>'], explain: 'head tiene información sobre la página, como el title que aparece en la pestaña.' },
  { lang: 'html', prompt: '¿Qué hace este link?', code: '<a href="#contacto">Contacto</a>\n…\n<h2 id="contacto">Contacto</h2>', options: ['Salta al h2 de la misma página', 'Abre la página contacto.html', 'Abre una pestaña nueva', 'No hace nada'], explain: 'Un href que empieza con # lleva al elemento con ese id en la misma página.' },
  { lang: 'html', prompt: '¿Qué agrega target="_blank"?', code: '<a href="https://www.cba.gov.ar" target="_blank">Gobierno</a>', options: ['Abre el link en una pestaña nueva', 'Pinta el link de negro', 'Hace que el link no funcione', 'Descarga la página'], explain: '_blank abre el destino en una pestaña o ventana nueva.' },
  { lang: 'html', prompt: '¿Qué etiqueta es una fila de una tabla?', code: '<table>\n  <??>\n    <td>Talleres</td><td>13</td>\n  </??>\n</table>', options: ['tr', 'td', 'th', 'row'], explain: 'tr (table row) es la fila; td y th son celdas.' },
  { lang: 'html', prompt: 'Con estos dos radios, ¿cuántas opciones se pueden marcar a la vez?', code: '<input type="radio" name="turno" value="m"> Mañana\n<input type="radio" name="turno" value="t"> Tarde', options: ['Una sola', 'Las dos', 'Ninguna', 'Depende del navegador'], explain: 'Los radios con el mismo name forman un grupo: solo se puede elegir uno.' },
  { lang: 'html', prompt: '¿Qué se ve con este input?', code: '<input type="password">', options: ['Un campo que oculta lo que escribís', 'Un botón', 'Una casilla para tildar', 'Un campo que solo acepta números'], explain: 'type="password" muestra puntitos en lugar de las letras.' },
  { lang: 'html', prompt: '¿Con qué se conecta el label?', code: '<label for="dni">DNI</label>\n<input type="text" id="dni">', options: ['Con el elemento que tiene id="dni"', 'Con el elemento que tiene name="dni"', 'Con el elemento que tiene class="dni"', 'Con el siguiente párrafo'], explain: 'El for del label tiene que coincidir con el id del campo.' },
  { lang: 'html', prompt: '¿Qué etiqueta semántica va para el menú de navegación?', code: '<header>\n  <h1>Club</h1>\n  <??> <a href="#">Inicio</a> <a href="#">Socios</a> </??>\n</header>', options: ['nav', 'menu', 'footer', 'section'], explain: 'nav marca un bloque de links de navegación.' },
  { lang: 'html', prompt: '¿Qué diferencia hay entre div y span?', code: '<div>…</div>\n<span>…</span>', options: ['div es una caja de bloque; span va dentro del texto', 'span es más grande que div', 'div solo sirve para imágenes', 'No hay ninguna diferencia'], explain: 'div ocupa todo el ancho (block); span es inline, para un pedacito de texto.' },
  { lang: 'html', prompt: '¿Qué se ve en la página?', code: '<p>Hay <strong>prueba</strong> el jueves</p>', options: ['La palabra "prueba" en negrita', 'La palabra "prueba" tachada', 'La palabra "prueba" en cursiva', 'Solo "prueba"'], explain: 'strong marca algo importante y el navegador lo muestra en negrita.' },
  { lang: 'html', prompt: '¿Qué hace el atributo required?', code: '<input type="email" required>', options: ['No deja enviar el formulario si el campo está vacío', 'Oculta el campo', 'Pone el campo en rojo siempre', 'Escribe un mail de ejemplo'], explain: 'required hace que el campo sea obligatorio.' },
  { lang: 'html', prompt: '¿Cuál es la celda de encabezado de una tabla?', code: '<tr><??>Equipo</??><??>Puntos</??></tr>', options: ['th', 'td', 'thead', 'caption'], explain: 'th es una celda de encabezado (negrita y centrada). thead es la parte que agrupa esas filas.' },

  { lang: 'html', prompt: '¿Qué se ve en la página?', code: '<ul>\n  <li>Fútbol</li>\n  <li>Vóley</li>\n</ul>', options: ['Dos ítems con viñetas', 'Dos ítems numerados 1 y 2', '"Fútbol Vóley" en una línea', 'Una tabla de dos filas'], explain: 'ul es una lista sin orden: cada li aparece con una viñeta (un puntito).' },
  { lang: 'html', prompt: '¿Qué campo sirve para escribir un texto largo, de varias líneas?', code: '<label for="msj">Mensaje</label>\n<?? id="msj"></??>', options: ['textarea', 'input', 'text', 'p'], explain: 'textarea es un campo de varias líneas; input es de una sola línea.' },
  { lang: 'html', prompt: '¿Qué hace colspan="2"?', code: '<tr>\n  <td colspan="2">Recreo</td>\n</tr>', options: ['La celda ocupa el ancho de dos columnas', 'Repite la celda dos veces', 'La celda ocupa dos filas', 'Pone dos espacios de margen'], explain: 'colspan une columnas; para unir filas se usa rowspan.' },
  { lang: 'html', prompt: '¿Qué se ve con este input?', code: '<input type="checkbox" id="acepto">\n<label for="acepto">Acepto</label>', options: ['Una casilla para tildar', 'Un círculo para elegir una opción', 'Un campo para escribir', 'Un botón que dice Acepto'], explain: 'checkbox es una casilla que se tilda y destilda. Varias casillas se pueden marcar a la vez.' },
  { lang: 'html', prompt: '¿Qué etiqueta va al pie de la página, con los datos de contacto o el ©?', code: '<body>\n  <header>…</header>\n  <main>…</main>\n  <??>© 2026 ITS Villada</??>\n</body>', options: ['footer', 'bottom', 'aside', 'end'], explain: 'footer es el pie de la página (o de una sección).' },
  { lang: 'html', prompt: '¿Qué atributo indica qué archivo de imagen se muestra?', code: '<img ??="escudo.png" alt="Escudo de la escuela">', options: ['src', 'href', 'alt', 'link'], explain: 'src (source) es la dirección de la imagen. href es para los links.' },

  /* ---------------------------------------------------------------- JAVASCRIPT: ¿qué muestra? */
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'console.log("1" + 2);', options: ['12', '3', '1 2', 'Error'], explain: 'Si uno de los dos es texto, + pega: "1" + 2 da el texto "12".' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'console.log(1 + 2 + "3");', options: ['33', '123', '6', '15'], explain: 'Se resuelve de izquierda a derecha: 1 + 2 = 3 (números) y después 3 + "3" = "33".' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'console.log("Total: " + 3 + 4);', options: ['Total: 34', 'Total: 7', 'Total: 3 + 4', 'Error'], explain: 'Como empieza con un texto, se va pegando: "Total: 3" y después "Total: 34".' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'console.log("5" - 2);', options: ['3', '52', '5-2', 'NaN'], explain: 'El signo - solo sirve para restar números, así que JavaScript convierte "5" en 5: da 3. (Con + hubiera pegado los textos.)' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'console.log(Number("12") + 3);', options: ['15', '123', '12 3', 'NaN'], explain: 'Number convierte el texto "12" en el número 12, y 12 + 3 = 15.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'console.log(Number("hola"));', options: ['NaN', '0', 'hola', 'undefined'], explain: 'NaN (Not a Number) es el resultado cuando un texto no se puede convertir en número.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'console.log(typeof 42);', options: ['number', 'string', '42', 'int'], explain: 'typeof dice el tipo de un valor. En JavaScript los números enteros y con coma son todos number.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'console.log(typeof "42");', options: ['string', 'number', '42', 'text'], explain: 'Entre comillas es un texto (string), aunque tenga dígitos adentro.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'console.log(typeof true);', options: ['boolean', 'string', 'true', 'number'], explain: 'true y false son valores de tipo boolean.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'console.log(5 === "5");', options: ['false', 'true', '5', 'Error'], explain: '=== compara el valor y el tipo: un número nunca es === a un texto.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'console.log(5 == "5");', options: ['true', 'false', '55', 'Error'], explain: '== convierte antes de comparar, así que da true. Por eso conviene usar === siempre.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'console.log(7 % 3);', options: ['1', '2', '2.33', '0'], explain: '% es el resto de la división: 7 = 3 × 2 + 1.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'console.log(7 / 2);', options: ['3.5', '3', '4', '3,5'], explain: 'En JavaScript la división da con decimales. Los decimales se escriben con punto.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'console.log(Math.floor(7 / 2));', options: ['3', '3.5', '4', '7'], explain: 'Math.floor redondea para abajo: 3.5 queda en 3.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'console.log(10 - 2 * 3);', options: ['4', '24', '-4', '6'], explain: 'La multiplicación se hace antes que la resta: 10 - 6 = 4.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'let x = 10;\nx += 5;\nx = x * 2;\nconsole.log(x);', options: ['30', '25', '20', '15'], explain: 'x += 5 deja 15 y después x * 2 da 30.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'let a = 5;\nlet b = a;\nb = 8;\nconsole.log(a);', options: ['5', '8', '13', 'undefined'], explain: 'b = a copia el valor. Cambiar b después no cambia a.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'const nota = 6;\nif (nota >= 7) {\n  console.log("Aprobado");\n} else {\n  console.log("Recupera");\n}', options: ['Recupera', 'Aprobado', 'Aprobado\nRecupera', 'Nada'], explain: '6 >= 7 es falso, así que se ejecuta el else.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'const n = 15;\nif (n > 20) {\n  console.log("A");\n} else if (n > 10) {\n  console.log("B");\n} else {\n  console.log("C");\n}', options: ['B', 'A', 'C', 'B\nC'], explain: 'n > 20 es falso; n > 10 es verdadero, así que muestra B y no sigue mirando el resto.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'console.log(5 > 3 && 2 > 4);', options: ['false', 'true', '5', 'Error'], explain: '&& necesita que las dos condiciones sean verdaderas, y 2 > 4 es falso.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'console.log(5 > 3 || 2 > 4);', options: ['true', 'false', '3', 'Error'], explain: '|| alcanza con que una sea verdadera, y 5 > 3 lo es.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'let t = "";\nfor (let i = 1; i <= 4; i++) {\n  t = t + i;\n}\nconsole.log(t);', options: ['1234', '10', '123', '4'], explain: 't es un texto, así que cada número se pega al final: "1", "12", "123", "1234".' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'let suma = 0;\nfor (let i = 1; i <= 4; i++) {\n  suma = suma + i;\n}\nconsole.log(suma);', options: ['10', '4', '6', '1234'], explain: 'suma es un número: 1 + 2 + 3 + 4 = 10.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'for (let i = 0; i < 3; i++) {\n  console.log(i);\n}', options: ['0\n1\n2', '1\n2\n3', '0\n1\n2\n3', '3'], explain: 'i vale 0, 1 y 2. Cuando llega a 3, la condición i < 3 es falsa y el for termina.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'let n = 1;\nwhile (n < 20) {\n  n = n * 3;\n}\nconsole.log(n);', options: ['27', '9', '20', '81'], explain: 'n pasa por 1, 3, 9 y 27. Con 27 la condición n < 20 es falsa y sale del while.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'let c = 0;\nfor (let i = 0; i < 3; i++) {\n  for (let j = 0; j < 2; j++) {\n    c++;\n  }\n}\nconsole.log(c);', options: ['6', '5', '3', '2'], explain: 'El for de adentro da 2 vueltas por cada una de las 3 del de afuera: 3 × 2 = 6.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'function doble(n) {\n  return n * 2;\n}\nconsole.log(doble(4) + 1);', options: ['9', '10', '8', '41'], explain: 'doble(4) devuelve 8, y 8 + 1 = 9.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'function saludar(nombre) {\n  return "Hola, " + nombre + "!";\n}\nconsole.log(saludar("Ana"));', options: ['Hola, Ana!', 'Hola, nombre!', 'Hola,Ana!', 'undefined'], explain: 'Al llamar a la función, nombre vale "Ana" y se pegan los textos (con el espacio que está entre las comillas).' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'function avisar() {\n  console.log("Hola");\n}\nconsole.log("Chau");', options: ['Chau', 'Hola\nChau', 'Chau\nHola', 'Hola'], explain: 'Definir una función no la ejecuta: avisar nunca se llamó, así que solo se muestra Chau.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'const notas = [10, 20, 30];\nconsole.log(notas[1]);', options: ['20', '10', '30', 'undefined'], explain: 'Las posiciones de un arreglo empiezan en 0: notas[0] es 10 y notas[1] es 20.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'const notas = [5, 8, 2];\nconsole.log(notas[3]);', options: ['undefined', '2', 'Error', '0'], explain: 'Con 3 elementos las posiciones son 0, 1 y 2. La posición 3 no existe y da undefined.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'const merienda = ["mate", "facturas"];\nmerienda.push("tortitas");\nconsole.log(merienda.length);', options: ['3', '2', '1', 'tortitas'], explain: 'push agrega un elemento al final, así que el arreglo pasa a tener 3.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'const letras = ["a", "b", "c"];\nlet t = "";\nfor (let i = letras.length - 1; i >= 0; i--) {\n  t = t + letras[i];\n}\nconsole.log(t);', options: ['cba', 'abc', 'cb', 'ba'], explain: 'i empieza en la última posición (2) y baja hasta 0: se pegan c, b y a.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'console.log("Villada".length);', options: ['7', '6', '8', 'Villada'], explain: 'length cuenta los caracteres: V-i-l-l-a-d-a son 7.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'const s = "Hola";\nconsole.log(s[1]);', options: ['o', 'H', 'l', 'undefined'], explain: 'Las posiciones de un texto también empiezan en 0: H es la 0 y o es la 1.' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'console.log("Córdoba".toUpperCase());', options: ['CÓRDOBA', 'Córdoba', 'córdoba', 'CORDOBA'], explain: 'toUpperCase pasa todas las letras a mayúscula (las tildes se mantienen).' },
  { lang: 'js', out: true, prompt: '¿Qué muestra la consola?', code: 'const materias = 3 + 2;\nconsole.log(`Tengo ${materias} materias`);', options: ['Tengo 5 materias', 'Tengo ${materias} materias', 'Tengo 3 + 2 materias', 'Tengo materias materias'], explain: 'Entre comillas invertidas, ${…} se reemplaza por el valor de lo que está adentro.' },

  /* ---------------------------------------------------------------- JAVASCRIPT: la página */
  { lang: 'js', prompt: '¿Qué devuelve esta línea?', code: '<h1 id="titulo">Bienvenidos</h1>\n\nconst t = document.getElementById("titulo");', options: ['El elemento h1 que tiene id="titulo"', 'El texto "titulo"', 'Todos los h1 de la página', 'El texto "Bienvenidos"'], explain: 'getElementById busca en la página el elemento con ese id y lo devuelve, para poder cambiarlo.' },
  { lang: 'js', prompt: '¿Qué pasa en la página?', code: '<p id="msj">Hola</p>\n\nconst p = document.getElementById("msj");\np.textContent = "Chau";', options: ['El párrafo pasa a decir "Chau"', 'El párrafo dice "HolaChau"', 'Aparece un párrafo nuevo con "Chau"', 'Nada, porque falta console.log'], explain: 'textContent es el texto del elemento: al asignarle un valor, se reemplaza el que tenía.' },
  { lang: 'js', prompt: '¿Cuándo se ejecuta la función saludar?', code: 'const b = document.getElementById("boton");\nb.addEventListener("click", saludar);', options: ['Cada vez que tocan el botón', 'Una sola vez, al cargar la página', 'Nunca', 'Cuando pasan el mouse por encima'], explain: 'addEventListener("click", …) deja la función esperando: se ejecuta en cada clic.' },
  { lang: 'js', prompt: 'Si en el campo escribieron 5, ¿qué muestra la consola?', code: '<input id="edad" type="number">\n\nconst campo = document.getElementById("edad");\nconsole.log(campo.value + 1);', options: ['51', '6', '5', 'NaN'], explain: 'value siempre es un texto ("5"), así que + pega: "51". Para sumar hay que usar Number(campo.value).' },
  { lang: 'js', prompt: '¿Qué hace este código?', code: '<ul id="lista"></ul>\n\nconst li = document.createElement("li");\nli.textContent = "Leche";\ndocument.getElementById("lista").appendChild(li);', options: ['Agrega el ítem "Leche" al final de la lista', 'Borra la lista', 'Cambia el id de la lista por "Leche"', 'Nada: el li no se ve hasta que se recarga'], explain: 'createElement crea un elemento nuevo y appendChild lo pone adentro de la lista, al final.' },
  { lang: 'js', prompt: 'En la página no hay ningún elemento con id="foto". ¿Qué muestra la consola?', code: 'console.log(document.getElementById("foto"));', options: ['null', 'undefined', 'foto', '""'], explain: 'Si no encuentra el id, getElementById devuelve null. Si después usás ese null (por ejemplo null.textContent), da error.' },
]

/* ------------------------------------------------------------------ rondas */

function toRound(q: Q): QuizRound {
  // las opciones que son código se muestran con letra de código; las frases, con letra normal
  const isCode = (t: string) => q.out || (!/^[A-ZÁÉÍÓÚ"][a-záéíóúñ]/.test(t) && !/ (y|de|la|el|que|en) /.test(t))
  const opts = shuffle(q.options.map((label, i) => ({ id: `o${i}`, label: isCode(label) ? <code className="quiz-opt">{label}</code> : label })))
  return {
    prompt: (
      <>
        <span className={`quiz-lang ${q.lang}`}>{LANG_NAME[q.lang]}</span> {q.prompt}
      </>
    ),
    visual: <pre className="quiz-code">{q.code}</pre>,
    options: opts,
    answer: 'o0',
    explain: q.explain,
  }
}

/** 10 preguntas: 4 de HTML y 6 de JavaScript, mezcladas */
function makeRounds(): QuizRound[] {
  const by = (l: Lang, n: number) => shuffle(POOL.filter((q) => q.lang === l)).slice(0, n)
  return shuffle([...by('html', 4), ...by('js', 6)]).map(toRound)
}

export const QUIZ_POOL_SIZE = POOL.length

export function QuizCompu() {
  return (
    <QuizGame
      game="compu-quiz"
      title="¿Qué hace este código?"
      icon="🤔"
      info="Leé un pedacito de HTML o JavaScript y adiviná qué hace, qué se ve o qué muestra la consola. Cuanto más rápido, más puntos."
      intro={
        <p>
          10 preguntas mezcladas: 4 de HTML y 6 de JavaScript. Respuesta correcta: 15 puntos + hasta 5 de bonus por rapidez (máximo 200).
        </p>
      }
      makeRounds={makeRounds}
    />
  )
}
