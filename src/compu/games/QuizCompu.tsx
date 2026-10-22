import { QuizGame, shuffle, type QuizRound } from '../../games/QuizGame'
import './quiz.css'

type Lang = 'html' | 'css' | 'java'

interface Q {
  lang: Lang
  prompt: string
  code: string
  /** la primera opción es la correcta (después se mezclan) */
  options: string[]
  explain: string
}

const LANG_NAME: Record<Lang, string> = { html: 'HTML', css: 'CSS', java: 'Java' }

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

  /* ---------------------------------------------------------------- CSS */
  { lang: 'css', prompt: '¿De qué color queda el párrafo?', code: 'p { color: red; }\np { color: blue; }', options: ['Azul', 'Rojo', 'Violeta (se mezclan)', 'Negro'], explain: 'Las dos reglas son igual de específicas: gana la que está más abajo (cascada).' },
  { lang: 'css', prompt: '¿De qué color queda el título?', code: '<h1 id="t" class="t">Hola</h1>\n\n#t { color: red; }\n.t { color: green; }', options: ['Rojo', 'Verde', 'Negro', 'Depende del orden'], explain: 'Un id es más específico que una clase, así que gana #t aunque esté arriba.' },
  { lang: 'css', prompt: '¿De qué color queda el párrafo?', code: '<div><p class="x">Hola</p></div>\n\n.x { color: green; }\ndiv p { color: orange; }', options: ['Verde', 'Naranja', 'Negro', 'Depende del navegador'], explain: 'Una clase (.x) le gana a dos etiquetas (div p), aunque esté más arriba.' },
  { lang: 'css', prompt: '¿A qué elementos se aplica este selector?', code: '.menu a { color: white; }', options: ['A los links que están dentro de .menu', 'A los links con clase menu', 'A .menu y a todos los links', 'Solo al primer link'], explain: 'El espacio es el selector descendiente: elementos a dentro de un elemento con clase menu.' },
  { lang: 'css', prompt: '¿A qué elementos se aplica este selector?', code: 'h1, h2 { color: navy; }', options: ['A todos los h1 y a todos los h2', 'Solo a los h2 dentro de h1', 'Solo al primer h1', 'A ninguno: la coma es un error'], explain: 'La coma agrupa: la misma regla para varios selectores.' },
  { lang: 'css', prompt: '¿Cuánto mide de ancho en total la caja?', code: '.caja {\n  width: 200px;\n  padding: 10px;\n  border: 5px solid black;\n}', options: ['230px', '200px', '215px', '210px'], explain: 'Por defecto (content-box): 200 + 10 + 10 de padding + 5 + 5 de borde = 230px.' },
  { lang: 'css', prompt: '¿Cuánto mide de ancho en total la caja?', code: '.caja {\n  box-sizing: border-box;\n  width: 200px;\n  padding: 10px;\n  border: 5px solid black;\n}', options: ['200px', '230px', '170px', '215px'], explain: 'Con border-box, el width ya incluye padding y borde.' },
  { lang: 'css', prompt: '¿Cuánto margen queda a la izquierda?', code: 'p { margin: 10px 20px; }', options: ['20px', '10px', '30px', '0'], explain: 'Con dos valores: el primero es arriba/abajo y el segundo izquierda/derecha.' },
  { lang: 'css', prompt: '¿Cuánto padding queda a la izquierda?', code: 'div { padding: 1px 2px 3px 4px; }', options: ['4px', '1px', '2px', '3px'], explain: 'Con cuatro valores el orden es como el reloj: arriba, derecha, abajo, izquierda.' },
  { lang: 'css', prompt: '¿Qué color es?', code: 'color: #ff0000;', options: ['Rojo', 'Verde', 'Azul', 'Blanco'], explain: 'En hexadecimal van rojo, verde y azul: ff es el máximo de rojo y 00 nada de los otros.' },
  { lang: 'css', prompt: '¿Qué color es?', code: 'background-color: rgb(0, 0, 255);', options: ['Azul', 'Rojo', 'Negro', 'Verde'], explain: 'rgb(rojo, verde, azul): solo azul al máximo.' },
  { lang: 'css', prompt: '¿Qué pasa con el elemento?', code: '.aviso { display: none; }', options: ['Desaparece y no ocupa lugar', 'Se vuelve transparente pero ocupa su lugar', 'Se pone en gris', 'Queda en una línea'], explain: 'display: none lo saca de la página por completo.' },
  { lang: 'css', prompt: '¿Cómo quedan los hijos de .fila?', code: '.fila {\n  display: flex;\n  justify-content: center;\n}', options: ['En fila, centrados horizontalmente', 'Uno debajo del otro', 'En fila, pegados a la derecha', 'Centrados solo verticalmente'], explain: 'flex pone los hijos en fila y justify-content: center los junta en el medio de esa fila.' },
  { lang: 'css', prompt: '¿Cómo quedan los hijos de .lista?', code: '.lista {\n  display: flex;\n  flex-direction: column;\n}', options: ['Uno debajo del otro', 'Uno al lado del otro', 'Superpuestos', 'En una grilla de 2 columnas'], explain: 'flex-direction: column cambia la dirección a vertical.' },
  { lang: 'css', prompt: '¿Cuántas columnas tiene la grilla?', code: '.galeria {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n}', options: ['3 columnas iguales', '1 columna de 3fr', '3 filas', '4 columnas'], explain: 'repeat(3, 1fr) es lo mismo que 1fr 1fr 1fr.' },
  { lang: 'css', prompt: '¿Cuándo se aplica esta regla?', code: '.boton:hover { background: darkgreen; }', options: ['Mientras el mouse está encima del botón', 'Cuando se hace doble clic', 'Siempre', 'Cuando la página carga'], explain: ':hover es el estado de "mouse encima".' },
  { lang: 'css', prompt: '¿Qué filas se pintan?', code: 'tr:nth-child(even) { background: #eee; }', options: ['Las pares (2ª, 4ª, 6ª…)', 'Las impares (1ª, 3ª, 5ª…)', 'Solo la primera', 'Todas'], explain: 'even = pares, odd = impares.' },
  { lang: 'css', prompt: '¿Cuándo se aplica lo de adentro?', code: '@media (max-width: 600px) {\n  .menu { flex-direction: column; }\n}', options: ['Cuando la pantalla mide 600px o menos', 'Cuando la pantalla mide más de 600px', 'Siempre', 'Solo al imprimir'], explain: 'max-width: 600px = "hasta 600px de ancho": pantallas angostas como la del celular.' },
  { lang: 'css', prompt: '¿Qué tamaño de letra tiene el span?', code: '<p>Hola <span>Córdoba</span></p>\n\np { font-size: 20px; }\nspan { font-size: 2em; }', options: ['40px', '20px', '2px', '32px'], explain: 'em es relativo a la letra del padre: 2 × 20px = 40px.' },
  { lang: 'css', prompt: '¿Qué forma tiene la caja?', code: '.luz {\n  width: 60px;\n  height: 60px;\n  border-radius: 50%;\n}', options: ['Un círculo', 'Un cuadrado', 'Un óvalo acostado', 'Un triángulo'], explain: 'Una caja cuadrada con border-radius: 50% queda redonda.' },
  { lang: 'css', prompt: '¿Qué selector elige solo el párrafo con clase aviso?', code: '<p class="aviso">¡Atención!</p>\n<p>Texto común</p>', options: ['p.aviso', 'p .aviso', '#aviso', 'p, .aviso'], explain: 'p.aviso (sin espacio) es "un p que además tiene la clase aviso". Con espacio buscaría un .aviso dentro de un p.' },
  { lang: 'css', prompt: '¿Qué hace esta regla con los links?', code: 'a { text-decoration: none; }', options: ['Les saca el subrayado', 'Los oculta', 'Los pone en negrita', 'Los deja sin color'], explain: 'text-decoration: none quita el subrayado.' },

  /* ---------------------------------------------------------------- JAVA */
  { lang: 'java', prompt: '¿Qué imprime?', code: 'int a = 7 / 2;\nSystem.out.println(a);', options: ['3', '3.5', '4', '3.0'], explain: 'La división entre dos int es entera: se descarta la parte decimal.' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'System.out.println(7 % 3);', options: ['1', '2', '2.33', '0'], explain: '% es el resto de la división: 7 = 3 × 2 + 1.' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'System.out.println("1" + 2 + 3);', options: ['123', '6', '15', '33'], explain: 'Se evalúa de izquierda a derecha: "1" + 2 da "12" (texto), y "12" + 3 da "123".' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'System.out.println(1 + 2 + "3");', options: ['33', '123', '6', '15'], explain: 'Primero 1 + 2 = 3 (números), después 3 + "3" = "33".' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'double d = 7 / 2;\nSystem.out.println(d);', options: ['3.0', '3.5', '3', '4.0'], explain: '7 / 2 se calcula como int (da 3) y recién después se guarda en el double: 3.0.' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'System.out.println(7 / 2.0);', options: ['3.5', '3', '3.0', '4'], explain: 'Si uno de los dos es decimal, la división es decimal.' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'int x = 5;\nx += 3;\nx *= 2;\nSystem.out.println(x);', options: ['16', '11', '13', '10'], explain: 'x += 3 deja 8; x *= 2 deja 16.' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'int i = 5;\ni++;\nSystem.out.println(i);', options: ['6', '5', '7', 'i++'], explain: 'i++ suma 1 a la variable.' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'for (int i = 0; i < 3; i++) {\n    System.out.print(i);\n}', options: ['012', '0123', '123', '333'], explain: 'i vale 0, 1 y 2; cuando llega a 3 la condición i < 3 es falsa y termina.' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'for (int i = 1; i <= 10; i += 3) {\n    System.out.print(i + " ");\n}', options: ['1 4 7 10', '1 4 7', '1 3 6 9', '3 6 9'], explain: 'Empieza en 1 y suma 3: 1, 4, 7, 10. El 13 ya no cumple i <= 10.' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'int nota = 6;\nif (nota >= 7) {\n    System.out.println("Aprobado");\n} else {\n    System.out.println("Recupera");\n}', options: ['Recupera', 'Aprobado', 'Aprobado y Recupera', 'Nada'], explain: '6 >= 7 es falso, así que se ejecuta el else.' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'int n = 10;\nif (n > 5 && n < 8) {\n    System.out.println("A");\n} else if (n >= 10) {\n    System.out.println("B");\n} else {\n    System.out.println("C");\n}', options: ['B', 'A', 'C', 'AB'], explain: 'n < 8 es falso, así que el primer if no entra; n >= 10 es verdadero: imprime B.' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'String s = "Villada";\nSystem.out.println(s.length());', options: ['7', '6', '8', 'Villada'], explain: 'length() cuenta los caracteres: V-i-l-l-a-d-a son 7.' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'System.out.println("Hola".charAt(1));', options: ['o', 'H', 'l', 'a'], explain: 'Las posiciones empiezan en 0: H es la 0, o es la 1.' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'int suma = 0;\nfor (int i = 1; i <= 4; i++) {\n    suma += i;\n}\nSystem.out.println(suma);', options: ['10', '4', '6', '15'], explain: '1 + 2 + 3 + 4 = 10.' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'int n = 1;\nwhile (n < 20) {\n    n *= 3;\n}\nSystem.out.println(n);', options: ['27', '9', '20', '18'], explain: 'n pasa por 1, 3, 9, 27. Con 27 la condición n < 20 es falsa y sale.' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'System.out.println(10 - 2 * 3);', options: ['4', '24', '-4', '6'], explain: 'La multiplicación se hace antes que la resta: 10 - 6 = 4.' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'System.out.println((10 - 2) * 3);', options: ['24', '4', '16', '30'], explain: 'Los paréntesis se resuelven primero: 8 × 3 = 24.' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'int a = 3, b = 4;\nSystem.out.println(a + b + "!");', options: ['7!', '34!', 'a + b!', '7'], explain: 'Primero se suman los números (7) y después se pega el "!".' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'System.out.println("Total: " + 3 + 4);', options: ['Total: 34', 'Total: 7', 'Total: 3 + 4', 'Total:34'], explain: 'Como empieza con un texto, todo lo que sigue se va pegando: "Total: 3" y después "Total: 34".' },
  { lang: 'java', prompt: '¿Qué imprime?', code: "System.out.println('a' + 1);", options: ['98', 'a1', 'b', '97'], explain: "Un char sumado a un int da un int: 'a' es el 97 en la tabla de caracteres, más 1 es 98." },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'int x = 10;\nSystem.out.println(x == 10);', options: ['true', 'false', '10', 'x == 10'], explain: '== compara y da un boolean: x vale 10, entonces true.' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'System.out.println(5 > 3 && 2 > 4);', options: ['false', 'true', '5', 'Error'], explain: '&& necesita que las dos sean verdaderas, y 2 > 4 es falso.' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'System.out.println(5 > 3 || 2 > 4);', options: ['true', 'false', '3', 'Error'], explain: '|| alcanza con que una sea verdadera, y 5 > 3 lo es.' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'int x = 17;\nif (x % 2 == 0) {\n    System.out.println("par");\n} else {\n    System.out.println("impar");\n}', options: ['impar', 'par', '1', '8'], explain: '17 % 2 es 1 (no es 0), así que es impar.' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'int c = 0;\nfor (int i = 0; i < 3; i++) {\n    for (int j = 0; j < 2; j++) {\n        c++;\n    }\n}\nSystem.out.println(c);', options: ['6', '5', '3', '2'], explain: 'El for de adentro da 2 vueltas por cada una de las 3 vueltas del de afuera: 3 × 2 = 6.' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'String t = "";\nfor (int i = 3; i > 0; i--) {\n    t += i;\n}\nSystem.out.println(t);', options: ['321', '123', '6', '3210'], explain: 'i vale 3, 2 y 1, y se van pegando al texto. Con 0 la condición i > 0 es falsa.' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'int a = 5;\nint b = a;\nb = 8;\nSystem.out.println(a);', options: ['5', '8', '13', '0'], explain: 'b = a copia el valor. Cambiar b después no cambia a.' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'System.out.println(Math.max(3, 9));', options: ['9', '3', '12', '39'], explain: 'Math.max devuelve el mayor de los dos.' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'System.out.println(20 / 3 * 3);', options: ['18', '20', '20.0', '6'], explain: '20 / 3 es 6 (división entera) y 6 × 3 = 18.' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'String nombre = "Ana";\nSystem.out.println("Hola, " + nombre + "!");', options: ['Hola, Ana!', 'Hola, nombre!', 'Hola,Ana!', '"Hola, " + nombre + "!"'], explain: 'Se reemplaza la variable por su valor y se pegan los textos (incluidos los espacios que están entre comillas).' },
  { lang: 'java', prompt: '¿Qué imprime?', code: 'int puntos = 0;\npuntos = puntos + 3;\npuntos = puntos + 1;\nSystem.out.println(puntos);', options: ['4', '3', '1', '0'], explain: 'Ganó (3) y empató (1): 0 + 3 + 1 = 4.' },
]

/* ------------------------------------------------------------------ rondas */

function toRound(q: Q): QuizRound {
  // las opciones que son código se muestran con letra de código; las frases, con letra normal
  const isCode = (t: string) => q.lang === 'java' || (!/^[A-ZÁÉÍÓÚ"][a-záéíóúñ]/.test(t) && !/ (y|de|la|el|que|en) /.test(t))
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

/** 10 preguntas: 3 de HTML, 3 de CSS y 4 de Java, mezcladas */
function makeRounds(): QuizRound[] {
  const by = (l: Lang, n: number) => shuffle(POOL.filter((q) => q.lang === l)).slice(0, n)
  return shuffle([...by('html', 3), ...by('css', 3), ...by('java', 4)]).map(toRound)
}

export const QUIZ_POOL_SIZE = POOL.length

export function QuizCompu() {
  return (
    <QuizGame
      game="compu-quiz"
      title="¿Qué hace este código?"
      icon="🤔"
      info="Leé un pedacito de HTML, CSS o Java y adiviná qué hace, qué se ve o qué imprime. Cuanto más rápido, más puntos."
      intro={
        <p>
          10 preguntas mezcladas de HTML, CSS y Java. Respuesta correcta: 15 puntos + hasta 5 de bonus por rapidez (máximo 200). En las de
          Java, el código está adentro del <code>main</code>.
        </p>
      }
      makeRounds={makeRounds}
    />
  )
}
