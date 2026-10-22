import type { Track, WebCtx } from '../types'

/* ------------------------------------------------------------------ ayudas para las pruebas */

/** minúsculas y sin tildes, para comparar textos sin ser tan estrictos */
const low = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
/** texto de un elemento normalizado */
const txt = (el: Element | null | undefined) => low((el?.textContent ?? '').replace(/\s+/g, ' '))
/** b aparece después de a en el documento */
const after = (a: Element | null, b: Element | null) => !!a && !!b && !!(a.compareDocumentPosition(b) & 4)
/** el campo tiene una etiqueta <label> asociada (con for o envolviéndolo) */
const labeled = (el: Element) => ((el as HTMLInputElement).labels?.length ?? 0) > 0
const inputs = (c: WebCtx, type: string) => c.$$('input').filter((i) => (i as HTMLInputElement).type === type) as HTMLInputElement[]

export const HTML_TRACK: Track = {
  id: 'html',
  title: 'HTML',
  icon: '🧱',
  desc: 'La estructura de las páginas web: títulos, textos, imágenes, links, listas, tablas y formularios.',
  modules: [
    /* ================================================================ 1. PRIMEROS PASOS */
    {
      id: 'html-primeros',
      title: 'Primeros pasos',
      desc: 'Qué es HTML, cómo se escribe una etiqueta y cómo se arma un documento completo.',
      lessons: [
        {
          id: 'html-1',
          kind: 'web',
          title: 'Tu primer título',
          intro: (
            <>
              <p>
                <b>HTML</b> es el lenguaje con el que se arma la estructura de una página web. Se escribe con <b>etiquetas</b>: una
                que abre y otra que cierra, con el contenido en el medio.
              </p>
              <pre>
                <code>{'<h1>Esto es un título</h1>'}</code>
              </pre>
              <p>
                <code>h1</code> es el título más importante de la página. Hay seis niveles, de <code>h1</code> a <code>h6</code>.
              </p>
            </>
          ),
          task: (
            <p>
              Agregá un título <code>h1</code> que diga <b>ITS Villada</b>.
            </p>
          ),
          hint: (
            <p>
              Escribí <code>{'<h1>ITS Villada</h1>'}</code>. Fijate que la etiqueta que cierra lleva una barra <code>/</code>.
            </p>
          ),
          edit: ['html'],
          starter: { html: '<!-- Escribí tu código abajo -->\n', css: '' },
          solution: { html: '<h1>ITS Villada</h1>\n', css: '' },
          tests: [
            { text: 'Hay un elemento <h1>', test: (c) => !!c.$('h1') },
            { text: 'El <h1> dice "ITS Villada"', test: (c) => c.text('h1').toLowerCase() === 'its villada' },
            { text: 'La etiqueta <h1> está cerrada con </h1>', test: (c) => /<\/h1>/i.test(c.html) },
          ],
        },
        {
          id: 'html-titulos',
          kind: 'web',
          title: 'Títulos de h1 a h6',
          intro: (
            <>
              <p>
                Los títulos van de <code>h1</code> (el más importante) a <code>h6</code> (el menos importante). Se usan como el
                índice de un libro: un solo <code>h1</code> por página y después subtítulos.
              </p>
              <pre>
                <code>{'<h1>Club Atlético Barrio Jardín</h1>\n<h2>Fútbol</h2>\n<h3>Categoría 2010</h3>'}</code>
              </pre>
              <p>El navegador los muestra más grandes o más chicos según el nivel, pero lo importante es el orden que le dan al contenido.</p>
            </>
          ),
          task: (
            <p>
              Debajo del <code>h1</code>, agregá un <code>h2</code> que diga <b>Especialidades</b> y, después, un <code>h3</code> que diga{' '}
              <b>Computación</b>.
            </p>
          ),
          hint: <p>Cada título va en su propia línea, con su etiqueta de apertura y de cierre. El h2 va antes que el h3.</p>,
          edit: ['html'],
          starter: { html: '<h1>Mi escuela</h1>\n', css: '' },
          solution: { html: '<h1>Mi escuela</h1>\n<h2>Especialidades</h2>\n<h3>Computación</h3>\n', css: '' },
          tests: [
            { text: 'Sigue estando el <h1> "Mi escuela"', test: (c) => txt(c.$('h1')) === 'mi escuela' },
            { text: 'Hay un <h2> que dice "Especialidades"', test: (c) => txt(c.$('h2')) === 'especialidades' },
            { text: 'Hay un <h3> que dice "Computación"', test: (c) => txt(c.$('h3')) === 'computacion' },
            { text: 'El orden es h1, después h2, después h3', test: (c) => after(c.$('h1'), c.$('h2')) && after(c.$('h2'), c.$('h3')) },
          ],
        },
        {
          id: 'html-parrafos',
          kind: 'web',
          title: 'Párrafos',
          intro: (
            <>
              <p>
                El texto común va dentro de párrafos, con la etiqueta <code>p</code>. Cada párrafo empieza en una línea nueva y deja un
                espacio con el siguiente.
              </p>
              <pre>
                <code>{'<p>Córdoba es conocida como La Docta.</p>\n<p>Tiene la universidad más antigua del país.</p>'}</code>
              </pre>
              <p>
                Ojo: si en el código apretás Enter o ponés muchos espacios, el navegador los junta en uno solo. Para separar textos
                hay que usar etiquetas.
              </p>
            </>
          ),
          task: (
            <p>
              Debajo del título, escribí <b>dos párrafos</b> (<code>p</code>) contando algo de Córdoba. El primero tiene que mencionar
              la palabra <b>Córdoba</b>.
            </p>
          ),
          hint: (
            <p>
              Usá <code>{'<p>'}</code> y <code>{'</p>'}</code> para cada párrafo. Son dos pares de etiquetas.
            </p>
          ),
          edit: ['html'],
          starter: { html: '<h1>Mi ciudad</h1>\nCórdoba es la segunda ciudad más grande de Argentina.\n', css: '' },
          solution: {
            html: '<h1>Mi ciudad</h1>\n<p>Córdoba es la segunda ciudad más grande de Argentina.</p>\n<p>En verano mucha gente va a las sierras.</p>\n',
            css: '',
          },
          tests: [
            { text: 'Hay al menos dos párrafos <p>', test: (c) => c.$$('p').length >= 2 },
            { text: 'Los párrafos tienen texto', test: (c) => c.$$('p').length > 0 && c.$$('p').every((p) => txt(p).length >= 5) },
            { text: 'El primer párrafo menciona "Córdoba"', test: (c) => txt(c.$('p')).includes('cordoba') },
            { text: 'Los párrafos están después del h1', test: (c) => after(c.$('h1'), c.$('p')) },
          ],
        },
        {
          id: 'html-comentarios',
          kind: 'web',
          title: 'Comentarios',
          intro: (
            <>
              <p>
                Un <b>comentario</b> es una nota en el código que el navegador <b>no muestra</b>. Sirve para explicar o para
                &quot;apagar&quot; una parte sin borrarla.
              </p>
              <pre>
                <code>{'<!-- Esto es un comentario -->\n<!-- <p>Este párrafo no se ve</p> -->'}</code>
              </pre>
              <p>
                Empieza con <code>{'<!--'}</code> y termina con <code>{'-->'}</code>.
              </p>
            </>
          ),
          task: (
            <p>
              El precio del buffet todavía no está confirmado. <b>Comentá</b> el segundo párrafo (el del precio) para que no se vea,
              pero sin borrarlo. El párrafo del menú tiene que seguir viéndose.
            </p>
          ),
          hint: (
            <p>
              Poné <code>{'<!--'}</code> justo antes del <code>{'<p>'}</code> del precio y <code>{'-->'}</code> después de su{' '}
              <code>{'</p>'}</code>.
            </p>
          ),
          edit: ['html'],
          starter: {
            html: '<h1>Buffet de la escuela</h1>\n<p>Hoy hay sándwich de milanesa.</p>\n<p>Precio nuevo: todavía no confirmado.</p>\n',
            css: '',
          },
          solution: {
            html: '<h1>Buffet de la escuela</h1>\n<p>Hoy hay sándwich de milanesa.</p>\n<!-- <p>Precio nuevo: todavía no confirmado.</p> -->\n',
            css: '',
          },
          tests: [
            { text: 'Hay un comentario <!-- … -->', test: (c) => /<!--[\s\S]*?-->/.test(c.html) },
            { text: 'El texto del precio no se ve en la página', test: (c) => !txt(c.doc.body).includes('confirmado') },
            { text: 'El precio sigue en el código, dentro del comentario', test: (c) => /<!--[\s\S]*confirmado[\s\S]*?-->/i.test(c.html) },
            { text: 'El párrafo de la milanesa se sigue viendo', test: (c) => c.$$('p').some((p) => txt(p).includes('milanesa')) },
          ],
        },
        {
          id: 'html-estructura',
          kind: 'web',
          title: 'La estructura de un documento',
          intro: (
            <>
              <p>Una página completa tiene siempre la misma estructura básica:</p>
              <pre>
                <code>
                  {
                    '<!DOCTYPE html>\n<html lang="es">\n  <head>\n    <meta charset="utf-8">\n    <title>Nombre en la pestaña</title>\n  </head>\n  <body>\n    Lo que se ve en la página\n  </body>\n</html>'
                  }
                </code>
              </pre>
              <ul>
                <li>
                  <code>{'<!DOCTYPE html>'}</code> avisa que es HTML moderno.
                </li>
                <li>
                  <code>head</code> tiene información <i>sobre</i> la página: <code>meta charset</code> (para que se vean bien las
                  tildes y la ñ) y el <code>title</code> que aparece en la pestaña.
                </li>
                <li>
                  <code>body</code> tiene todo lo que se ve.
                </li>
              </ul>
            </>
          ),
          task: (
            <p>
              Armá el documento completo: <code>{'<!DOCTYPE html>'}</code>, <code>html</code> con <code>lang=&quot;es&quot;</code>,{' '}
              <code>head</code> con <code>{'<meta charset="utf-8">'}</code> y un <code>title</code> que diga <b>Taller de Computación</b>, y
              el <code>h1</code> que ya está dentro del <code>body</code>.
            </p>
          ),
          hint: <p>Copiá la estructura del ejemplo y mové el h1 adentro del body. El title va dentro del head, no del body.</p>,
          edit: ['html'],
          starter: { html: '<h1>Bienvenidos al taller</h1>\n', css: '' },
          solution: {
            html: '<!DOCTYPE html>\n<html lang="es">\n  <head>\n    <meta charset="utf-8">\n    <title>Taller de Computación</title>\n  </head>\n  <body>\n    <h1>Bienvenidos al taller</h1>\n  </body>\n</html>\n',
            css: '',
          },
          tests: [
            { text: 'Empieza con <!DOCTYPE html>', test: (c) => /^\s*<!doctype html>/i.test(c.html) },
            { text: 'La etiqueta <html> tiene lang="es"', test: (c) => /<html[^>]*\blang=["']?es/i.test(c.html) },
            { text: 'En el <head> hay <meta charset="utf-8">', test: (c) => /<head[\s\S]*<meta\s+charset=["']?utf-8[\s\S]*<\/head>/i.test(c.html) },
            { text: 'El título de la pestaña es "Taller de Computación"', test: (c) => low(c.doc.title) === 'taller de computacion' },
            { text: 'El h1 está dentro del <body>', test: (c) => /<body[\s>]/i.test(c.html) && !!c.$('body h1') },
          ],
        },
        {
          id: 'html-proyecto-presentacion',
          kind: 'web',
          title: 'Mini-proyecto: Mi presentación',
          intro: (
            <>
              <p>
                🛠 <b>Mini-proyecto.</b> Juntá todo lo del módulo para armar una página que te presente: documento completo, títulos,
                párrafos y algún comentario para organizarte.
              </p>
              <pre>
                <code>{'<h1>Hola, soy Martina</h1>\n<h2>Sobre mí</h2>\n<p>Tengo 15 años y vivo en Alta Córdoba.</p>\n<!-- sección de gustos -->\n<h2>Lo que me gusta</h2>\n<p>…</p>'}</code>
              </pre>
            </>
          ),
          task: (
            <>
              <p>Armá tu página de presentación con:</p>
              <ul>
                <li>
                  La estructura completa (<code>DOCTYPE</code>, <code>html</code>, <code>head</code> con <code>title</code>,{' '}
                  <code>body</code>).
                </li>
                <li>
                  Un <code>h1</code> con tu nombre.
                </li>
                <li>
                  Al menos <b>dos</b> <code>h2</code> (por ejemplo &quot;Sobre mí&quot; y &quot;Lo que me gusta&quot;).
                </li>
                <li>
                  Al menos <b>tres</b> párrafos y <b>un</b> comentario.
                </li>
              </ul>
            </>
          ),
          edit: ['html'],
          starter: {
            html: '<!DOCTYPE html>\n<html lang="es">\n  <head>\n    <meta charset="utf-8">\n    <title></title>\n  </head>\n  <body>\n\n  </body>\n</html>\n',
            css: '',
          },
          solution: {
            html: '<!DOCTYPE html>\n<html lang="es">\n  <head>\n    <meta charset="utf-8">\n    <title>Presentación de Martina</title>\n  </head>\n  <body>\n    <h1>Hola, soy Martina</h1>\n    <h2>Sobre mí</h2>\n    <p>Tengo 15 años y vivo en Alta Córdoba.</p>\n    <p>Voy a 3er año del ITS Villada.</p>\n    <!-- gustos -->\n    <h2>Lo que me gusta</h2>\n    <p>Me gusta programar y jugar al vóley.</p>\n  </body>\n</html>\n',
            css: '',
          },
          tests: [
            { text: 'Tiene <!DOCTYPE html> y la página tiene un <title> con texto', test: (c) => /^\s*<!doctype html>/i.test(c.html) && c.doc.title.trim().length > 0 },
            { text: 'Hay un <h1> con texto', test: (c) => txt(c.$('h1')).length > 0 },
            { text: 'Hay al menos dos <h2>', test: (c) => c.$$('h2').filter((h) => txt(h)).length >= 2 },
            { text: 'Hay al menos tres párrafos con texto', test: (c) => c.$$('p').filter((p) => txt(p)).length >= 3 },
            { text: 'Hay al menos un comentario', test: (c) => /<!--[\s\S]*?-->/.test(c.html) },
          ],
        },
      ],
    },

    /* ================================================================ 2. TEXTO */
    {
      id: 'html-texto',
      title: 'Texto y listas',
      desc: 'Resaltar palabras, cortar líneas y armar listas con viñetas o numeradas.',
      lessons: [
        {
          id: 'html-strong-em',
          kind: 'web',
          title: 'Resaltar: strong y em',
          intro: (
            <>
              <p>Para marcar palabras dentro de un texto:</p>
              <ul>
                <li>
                  <code>strong</code>: algo <b>importante</b> (se ve en negrita).
                </li>
                <li>
                  <code>em</code>: algo con <i>énfasis</i> (se ve en cursiva).
                </li>
              </ul>
              <pre>
                <code>{'<p>Mañana hay <strong>acto</strong>, vengan con <em>guardapolvo</em>.</p>'}</code>
              </pre>
              <p>Estas etiquetas van dentro del párrafo, rodeando solo las palabras que querés marcar.</p>
            </>
          ),
          task: (
            <p>
              En el párrafo, poné la palabra <b>prueba</b> dentro de un <code>strong</code> y la palabra <b>calculadora</b> dentro de un{' '}
              <code>em</code>.
            </p>
          ),
          hint: (
            <p>
              Quedaría algo como <code>{'hay <strong>prueba</strong> de…'}</code>. Hacé lo mismo con <code>em</code> para la otra palabra.
            </p>
          ),
          edit: ['html'],
          starter: { html: '<p>El jueves hay prueba de matemática. No se olviden la calculadora.</p>\n', css: '' },
          solution: {
            html: '<p>El jueves hay <strong>prueba</strong> de matemática. No se olviden la <em>calculadora</em>.</p>\n',
            css: '',
          },
          tests: [
            { text: 'La palabra "prueba" está en un <strong>', test: (c) => txt(c.$('p strong')) === 'prueba' },
            { text: 'La palabra "calculadora" está en un <em>', test: (c) => txt(c.$('p em')) === 'calculadora' },
            { text: 'El resto del texto sigue en el párrafo', test: (c) => txt(c.$('p')).startsWith('el jueves hay prueba de matematica') },
            { text: '"prueba" se ve en negrita', test: (c) => Number(c.style('p strong', 'font-weight')) >= 600 },
          ],
        },
        {
          id: 'html-br-hr',
          kind: 'web',
          title: 'Cortar líneas y separar: br y hr',
          intro: (
            <>
              <p>
                <code>{'<br>'}</code> hace un salto de línea dentro de un mismo párrafo. <code>{'<hr>'}</code> dibuja una línea
                horizontal para separar partes. Las dos son etiquetas <b>vacías</b>: no tienen contenido ni etiqueta de cierre.
              </p>
              <pre>
                <code>{'<p>Primera línea<br>Segunda línea</p>\n<hr>\n<p>Otra parte</p>'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              En el párrafo de la dirección, usá <code>{'<br>'}</code> para que <b>ITS Villada</b>, <b>Córdoba Capital</b> y{' '}
              <b>Argentina</b> queden en tres líneas distintas. Después, poné un <code>{'<hr>'}</code> antes del título{' '}
              <b>Contacto</b>.
            </p>
          ),
          hint: <p>Necesitás dos br (entre las tres partes) y un hr entre el párrafo y el segundo h2.</p>,
          edit: ['html'],
          starter: {
            html: '<h2>Dirección</h2>\n<p>ITS Villada Córdoba Capital Argentina</p>\n<h2>Contacto</h2>\n<p>Preguntá en secretaría.</p>\n',
            css: '',
          },
          solution: {
            html: '<h2>Dirección</h2>\n<p>ITS Villada<br>Córdoba Capital<br>Argentina</p>\n<hr>\n<h2>Contacto</h2>\n<p>Preguntá en secretaría.</p>\n',
            css: '',
          },
          tests: [
            { text: 'El primer párrafo tiene al menos dos <br>', test: (c) => (c.$('p')?.querySelectorAll('br').length ?? 0) >= 2 },
            { text: 'El texto de la dirección sigue completo', test: (c) => /villada.*cordoba capital.*argentina/.test(txt(c.$('p'))) },
            { text: 'Hay un <hr>', test: (c) => !!c.$('hr') },
            { text: 'El <hr> está antes del título "Contacto"', test: (c) => after(c.$('hr'), c.$$('h2').find((h) => txt(h) === 'contacto') ?? null) && after(c.$('p'), c.$('hr')) },
          ],
        },
        {
          id: 'html-listas',
          kind: 'web',
          title: 'Listas: ul y ol',
          intro: (
            <>
              <p>Hay dos tipos de listas:</p>
              <ul>
                <li>
                  <code>ul</code> (<i>unordered list</i>): con viñetas, cuando el orden no importa.
                </li>
                <li>
                  <code>ol</code> (<i>ordered list</i>): numerada, cuando el orden importa (pasos, posiciones).
                </li>
              </ul>
              <p>
                Cada elemento de la lista va en un <code>li</code>:
              </p>
              <pre>
                <code>{'<ul>\n  <li>Cuaderno</li>\n  <li>Lápiz</li>\n</ul>\n<ol>\n  <li>Prender la PC</li>\n  <li>Abrir el editor</li>\n</ol>'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              Debajo de <b>Útiles para el taller</b> armá una lista <code>ul</code> con al menos <b>3</b> útiles. Debajo de{' '}
              <b>Pasos para soldar</b> armá una lista <code>ol</code> con al menos <b>4</b> pasos.
            </p>
          ),
          hint: (
            <p>
              Adentro de <code>ul</code> y de <code>ol</code> solo van <code>li</code>. Cada útil o paso es un <code>li</code>.
            </p>
          ),
          edit: ['html'],
          starter: { html: '<h2>Útiles para el taller</h2>\n\n<h2>Pasos para soldar</h2>\n\n', css: '' },
          solution: {
            html: '<h2>Útiles para el taller</h2>\n<ul>\n  <li>Soldador</li>\n  <li>Estaño</li>\n  <li>Pinza</li>\n</ul>\n<h2>Pasos para soldar</h2>\n<ol>\n  <li>Calentar el soldador</li>\n  <li>Limpiar la punta</li>\n  <li>Apoyar en la unión</li>\n  <li>Agregar el estaño</li>\n</ol>\n',
            css: '',
          },
          tests: [
            { text: 'Hay una lista <ul> con al menos 3 <li>', test: (c) => c.$$('ul > li').length >= 3 },
            { text: 'Hay una lista <ol> con al menos 4 <li>', test: (c) => c.$$('ol > li').length >= 4 },
            { text: 'Todos los <li> tienen texto', test: (c) => c.$$('li').length > 0 && c.$$('li').every((l) => txt(l).length > 0) },
            { text: 'La <ul> va después del primer título y la <ol> después del segundo', test: (c) => { const h = c.$$('h2'); return after(h[0], c.$('ul')) && after(c.$('ul'), h[1]) && after(h[1], c.$('ol')) } },
          ],
        },
        {
          id: 'html-anidadas',
          kind: 'web',
          title: 'Listas anidadas',
          intro: (
            <>
              <p>
                Una lista puede tener otra lista adentro. La lista de adentro va <b>dentro de un <code>li</code></b>, después del texto:
              </p>
              <pre>
                <code>{'<ul>\n  <li>Fútbol\n    <ul>\n      <li>Primera</li>\n      <li>Reserva</li>\n    </ul>\n  </li>\n  <li>Básquet</li>\n</ul>'}</code>
              </pre>
              <p>
                Un error común es poner la <code>ul</code> de adentro directamente en la otra <code>ul</code>, sin <code>li</code>.
              </p>
            </>
          ),
          task: (
            <p>
              Completá la lista de deportes del club: adentro de <b>Fútbol</b> y adentro de <b>Básquet</b> agregá una lista{' '}
              <code>ul</code> con al menos <b>2 categorías</b> cada una.
            </p>
          ),
          hint: (
            <p>
              Antes del <code>{'</li>'}</code> de Fútbol abrí una <code>{'<ul>'}</code> nueva con sus <code>li</code>, y cerrala antes de cerrar el li de Fútbol.
            </p>
          ),
          edit: ['html'],
          starter: { html: '<h2>Deportes del club</h2>\n<ul>\n  <li>Fútbol</li>\n  <li>Básquet</li>\n</ul>\n', css: '' },
          solution: {
            html: '<h2>Deportes del club</h2>\n<ul>\n  <li>Fútbol\n    <ul>\n      <li>Primera</li>\n      <li>Infantiles</li>\n    </ul>\n  </li>\n  <li>Básquet\n    <ul>\n      <li>Mayores</li>\n      <li>Sub 17</li>\n    </ul>\n  </li>\n</ul>\n',
            css: '',
          },
          tests: [
            { text: 'Hay al menos dos listas dentro de un <li>', test: (c) => c.$$('li > ul, li > ol').length >= 2 },
            { text: 'Cada lista de adentro tiene al menos 2 <li>', test: (c) => { const n = c.$$('li > ul, li > ol'); return n.length >= 2 && n.every((u) => u.querySelectorAll(':scope > li').length >= 2) } },
            { text: 'La sublista de Fútbol está dentro del li de Fútbol', test: (c) => c.$$('li').some((l) => txt(l).startsWith('futbol') && !!l.querySelector('ul, ol')) },
            { text: 'No hay listas puestas directamente dentro de otra lista (sin li)', test: (c) => c.$$('ul > ul, ul > ol, ol > ul, ol > ol').length === 0 },
          ],
        },
        {
          id: 'html-proyecto-receta',
          kind: 'web',
          title: 'Mini-proyecto: Receta de empanadas',
          intro: (
            <>
              <p>
                🛠 <b>Mini-proyecto.</b> Las empanadas cordobesas llevan azúcar arriba. Armá la página de la receta usando todo lo del
                módulo: títulos, párrafos, <code>strong</code>/<code>em</code>, listas y <code>hr</code>.
              </p>
              <pre>
                <code>{'<h1>Empanadas cordobesas</h1>\n<p>Receta de mi <em>abuela</em>.</p>\n<h2>Ingredientes</h2>\n<ul>…</ul>\n<hr>\n<h2>Preparación</h2>\n<ol>…</ol>'}</code>
              </pre>
            </>
          ),
          task: (
            <>
              <p>La receta tiene que tener:</p>
              <ul>
                <li>
                  Un <code>h1</code> con el nombre de la receta y un párrafo con al menos un <code>strong</code>.
                </li>
                <li>
                  Un <code>h2</code> &quot;Ingredientes&quot; con una <code>ul</code> de al menos <b>4</b> ingredientes.
                </li>
                <li>
                  Un <code>hr</code> y después un <code>h2</code> &quot;Preparación&quot; con una <code>ol</code> de al menos <b>3</b> pasos.
                </li>
              </ul>
            </>
          ),
          edit: ['html'],
          starter: { html: '<h1>Empanadas cordobesas</h1>\n\n', css: '' },
          solution: {
            html: '<h1>Empanadas cordobesas</h1>\n<p>La receta de mi <em>abuela</em>, con <strong>azúcar</strong> arriba.</p>\n<h2>Ingredientes</h2>\n<ul>\n  <li>Tapas de empanada</li>\n  <li>Carne picada</li>\n  <li>Cebolla</li>\n  <li>Pasas de uva</li>\n</ul>\n<hr>\n<h2>Preparación</h2>\n<ol>\n  <li>Rehogar la cebolla</li>\n  <li>Agregar la carne</li>\n  <li>Rellenar, cerrar y hornear</li>\n</ol>\n',
            css: '',
          },
          tests: [
            { text: 'Hay un <h1> y un párrafo con un <strong>', test: (c) => !!c.$('h1') && !!c.$('p strong') },
            { text: 'Hay un h2 "Ingredientes"', test: (c) => c.$$('h2').some((h) => txt(h) === 'ingredientes') },
            { text: 'Hay una <ul> con al menos 4 ingredientes', test: (c) => c.$$('ul > li').filter((l) => txt(l)).length >= 4 },
            { text: 'Hay un <hr> y un h2 "Preparación" después', test: (c) => after(c.$('hr'), c.$$('h2').find((h) => txt(h) === 'preparacion') ?? null) },
            { text: 'Hay una <ol> con al menos 3 pasos', test: (c) => c.$$('ol > li').filter((l) => txt(l)).length >= 3 },
          ],
        },
      ],
    },

    /* ================================================================ 3. LINKS E IMÁGENES */
    {
      id: 'html-links',
      title: 'Links e imágenes',
      desc: 'Enlazar páginas, moverse dentro de una página y mostrar imágenes.',
      lessons: [
        {
          id: 'html-links-a',
          kind: 'web',
          title: 'Links con a',
          intro: (
            <>
              <p>
                Los links se hacen con la etiqueta <code>a</code> y el <b>atributo</b> <code>href</code>, que dice a dónde lleva. Los
                atributos van dentro de la etiqueta que abre, con la forma <code>nombre=&quot;valor&quot;</code>.
              </p>
              <pre>
                <code>{'<a href="https://www.google.com">Buscar en Google</a>'}</code>
              </pre>
              <p>
                Con <code>target=&quot;_blank&quot;</code> el link se abre en una pestaña nueva:
              </p>
              <pre>
                <code>{'<a href="https://…" target="_blank">Abrir aparte</a>'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              Convertí la palabra <b>Wikipedia</b> del párrafo en un link a <code>https://es.wikipedia.org/wiki/Córdoba_(Argentina)</code> que
              se abra en una <b>pestaña nueva</b>.
            </p>
          ),
          hint: (
            <p>
              Rodeá la palabra con <code>{'<a href="…">'}</code> y <code>{'</a>'}</code>, y agregale el atributo target.
            </p>
          ),
          edit: ['html'],
          starter: { html: '<p>Leé más sobre nuestra ciudad en Wikipedia.</p>\n', css: '' },
          solution: {
            html: '<p>Leé más sobre nuestra ciudad en <a href="https://es.wikipedia.org/wiki/Córdoba_(Argentina)" target="_blank">Wikipedia</a>.</p>\n',
            css: '',
          },
          tests: [
            { text: 'Hay un link <a> dentro del párrafo', test: (c) => !!c.$('p a') },
            { text: 'El texto del link es "Wikipedia"', test: (c) => txt(c.$('a')) === 'wikipedia' },
            { text: 'El href lleva a https://es.wikipedia.org/…', test: (c) => /^https:\/\/es\.wikipedia\.org\/wiki\/c/i.test(c.$('a')?.getAttribute('href') ?? '') },
            { text: 'Se abre en una pestaña nueva (target="_blank")', test: (c) => c.$('a')?.getAttribute('target') === '_blank' },
          ],
        },
        {
          id: 'html-rutas',
          kind: 'web',
          title: 'Rutas y links internos',
          intro: (
            <>
              <p>El <code>href</code> puede ser:</p>
              <ul>
                <li>
                  <b>Absoluto</b>: la dirección completa, con <code>https://</code>. Para ir a otro sitio.
                </li>
                <li>
                  <b>Relativo</b>: el camino hasta otro archivo de <i>tu</i> sitio. <code>horarios.html</code> está en la misma carpeta;{' '}
                  <code>paginas/horarios.html</code> está dentro de la carpeta <code>paginas</code>; <code>../index.html</code> está una
                  carpeta más arriba.
                </li>
                <li>
                  <b>Interno</b>: <code>#algo</code> salta al elemento que tiene <code>id=&quot;algo&quot;</code> en la misma página.
                </li>
              </ul>
              <pre>
                <code>{'<a href="#fixture">Ver fixture</a>\n…\n<h2 id="fixture">Fixture</h2>'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              En el menú, hacé que <b>Horarios</b> sea un link a <code>paginas/horarios.html</code> y que <b>Contacto</b> sea un link interno
              a <code>#contacto</code>. Después, poné <code>id=&quot;contacto&quot;</code> en el título <b>Contacto</b> de abajo.
            </p>
          ),
          hint: <p>El link interno usa el numeral (#) en el href; el id del título se escribe sin numeral.</p>,
          edit: ['html'],
          starter: {
            html: '<p>Menú: Horarios | Contacto</p>\n<h1>Taller de Computación</h1>\n<p>Bienvenidos a la página del taller.</p>\n<h2>Contacto</h2>\n<p>Escribinos a taller@escuela.edu.ar</p>\n',
            css: '',
          },
          solution: {
            html: '<p>Menú: <a href="paginas/horarios.html">Horarios</a> | <a href="#contacto">Contacto</a></p>\n<h1>Taller de Computación</h1>\n<p>Bienvenidos a la página del taller.</p>\n<h2 id="contacto">Contacto</h2>\n<p>Escribinos a taller@escuela.edu.ar</p>\n',
            css: '',
          },
          tests: [
            { text: '"Horarios" es un link a paginas/horarios.html', test: (c) => c.$$('a').some((a) => txt(a) === 'horarios' && a.getAttribute('href') === 'paginas/horarios.html') },
            { text: '"Contacto" es un link a #contacto', test: (c) => c.$$('a').some((a) => txt(a) === 'contacto' && a.getAttribute('href') === '#contacto') },
            { text: 'El título h2 "Contacto" tiene id="contacto"', test: (c) => c.$('#contacto')?.tagName === 'H2' },
          ],
        },
        {
          id: 'html-img',
          kind: 'web',
          title: 'Imágenes',
          intro: (
            <>
              <p>
                Las imágenes se ponen con <code>img</code>, una etiqueta vacía (sin cierre). Atributos importantes:
              </p>
              <ul>
                <li>
                  <code>src</code>: la dirección de la imagen.
                </li>
                <li>
                  <code>alt</code>: una descripción. La leen los lectores de pantalla y se muestra si la imagen no carga. ¡Siempre
                  ponela!
                </li>
                <li>
                  <code>width</code>: el ancho en píxeles (el alto se ajusta solo).
                </li>
              </ul>
              <pre>
                <code>{'<img src="https://picsum.photos/id/1018/400/250" alt="Montañas con nubes" width="200">'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              Agregá una imagen con <code>src=&quot;https://picsum.photos/id/1015/600/400&quot;</code>, un <code>alt</code> que describa la
              foto (es un río entre montañas) y <code>width=&quot;300&quot;</code>.
            </p>
          ),
          hint: (
            <p>
              Es una sola etiqueta: <code>{'<img src="…" alt="…" width="…">'}</code>.
            </p>
          ),
          edit: ['html'],
          starter: { html: '<h2>Paseo por las sierras</h2>\n\n<p>El domingo fuimos al río.</p>\n', css: '' },
          solution: {
            html: '<h2>Paseo por las sierras</h2>\n<img src="https://picsum.photos/id/1015/600/400" alt="Un río entre montañas" width="300">\n<p>El domingo fuimos al río.</p>\n',
            css: '',
          },
          tests: [
            { text: 'Hay una imagen <img>', test: (c) => !!c.$('img') },
            { text: 'El src es https://picsum.photos/id/1015/600/400', test: (c) => c.$('img')?.getAttribute('src') === 'https://picsum.photos/id/1015/600/400' },
            { text: 'Tiene un alt que describe la imagen (al menos 5 letras)', test: (c) => (c.$('img')?.getAttribute('alt') ?? '').trim().length >= 5 },
            { text: 'Tiene width="300"', test: (c) => c.$('img')?.getAttribute('width') === '300' },
          ],
        },
        {
          id: 'html-figure',
          kind: 'web',
          title: 'Imágenes con epígrafe y como link',
          intro: (
            <>
              <p>
                Para ponerle un epígrafe a una imagen se usa <code>figure</code> con <code>figcaption</code>. Y si ponés una{' '}
                <code>img</code> dentro de un <code>a</code>, la imagen se vuelve un link.
              </p>
              <pre>
                <code>{'<figure>\n  <a href="https://…">\n    <img src="…" alt="…">\n  </a>\n  <figcaption>Texto debajo de la foto</figcaption>\n</figure>'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              Meté la imagen dentro de un <code>figure</code>, agregale un <code>figcaption</code> que diga <b>Dique San Roque</b> y hacé
              que la imagen sea un link a <code>https://picsum.photos/id/1036/1200/800</code> (la foto grande).
            </p>
          ),
          hint: <p>El orden de adentro hacia afuera es: img dentro de a, y el a y el figcaption dentro de figure.</p>,
          edit: ['html'],
          starter: { html: '<h2>Lugares de Córdoba</h2>\n<img src="https://picsum.photos/id/1036/300/200" alt="Un lago con montañas">\n', css: '' },
          solution: {
            html: '<h2>Lugares de Córdoba</h2>\n<figure>\n  <a href="https://picsum.photos/id/1036/1200/800">\n    <img src="https://picsum.photos/id/1036/300/200" alt="Un lago con montañas">\n  </a>\n  <figcaption>Dique San Roque</figcaption>\n</figure>\n',
            css: '',
          },
          tests: [
            { text: 'La imagen está dentro de un <figure>', test: (c) => !!c.$('figure img') },
            { text: 'Hay un <figcaption> que dice "Dique San Roque"', test: (c) => txt(c.$('figure figcaption')) === 'dique san roque' },
            { text: 'La imagen está dentro de un link a la foto grande', test: (c) => c.$('a img')?.closest('a')?.getAttribute('href') === 'https://picsum.photos/id/1036/1200/800' },
            { text: 'La imagen conserva su alt', test: (c) => (c.$('img')?.getAttribute('alt') ?? '').length > 0 },
          ],
        },
        {
          id: 'html-proyecto-lugar',
          kind: 'web',
          title: 'Mini-proyecto: Mi lugar favorito',
          intro: (
            <>
              <p>
                🛠 <b>Mini-proyecto.</b> Armá una página sobre tu lugar favorito de Córdoba (una plaza, un club, las sierras, el
                estadio…). Usá imágenes, links y listas.
              </p>
              <p>
                Imágenes que podés usar: <code>https://picsum.photos/id/1011/400/250</code>, <code>…/id/1043/400/250</code>,{' '}
                <code>…/id/1050/400/250</code>.
              </p>
            </>
          ),
          task: (
            <>
              <p>La página tiene que tener:</p>
              <ul>
                <li>
                  Un <code>h1</code> con el nombre del lugar y al menos <b>un párrafo</b> describiéndolo.
                </li>
                <li>
                  Un <code>figure</code> con una <code>img</code> (con <code>alt</code>) y un <code>figcaption</code>.
                </li>
                <li>
                  Una lista con al menos <b>3</b> cosas para hacer ahí.
                </li>
                <li>
                  Un link externo (<code>https://…</code>) que se abra en una pestaña nueva.
                </li>
              </ul>
            </>
          ),
          edit: ['html'],
          starter: { html: '<h1>Mi lugar favorito</h1>\n\n', css: '' },
          solution: {
            html: '<h1>Parque Sarmiento</h1>\n<p>Es el parque más grande de la ciudad.</p>\n<figure>\n  <img src="https://picsum.photos/id/1043/400/250" alt="Árboles de un parque">\n  <figcaption>El lago del parque</figcaption>\n</figure>\n<h2>Qué se puede hacer</h2>\n<ul>\n  <li>Andar en bici</li>\n  <li>Tomar mate</li>\n  <li>Ir al zoológico</li>\n</ul>\n<p>Más información en <a href="https://es.wikipedia.org/wiki/Parque_Sarmiento_(C%C3%B3rdoba)" target="_blank">Wikipedia</a>.</p>\n',
            css: '',
          },
          tests: [
            { text: 'Hay un <h1> y al menos un párrafo con texto', test: (c) => !!c.$('h1') && c.$$('p').some((p) => txt(p).length >= 10) },
            { text: 'Hay un <figure> con una <img> que tiene alt', test: (c) => (c.$('figure img')?.getAttribute('alt') ?? '').trim().length > 0 },
            { text: 'El figure tiene un <figcaption> con texto', test: (c) => txt(c.$('figure figcaption')).length > 0 },
            { text: 'Hay una lista con al menos 3 elementos', test: (c) => c.$$('ul, ol').some((l) => l.querySelectorAll(':scope > li').length >= 3) },
            { text: 'Hay un link https:// que se abre en pestaña nueva', test: (c) => c.$$('a').some((a) => /^https:\/\//.test(a.getAttribute('href') ?? '') && a.getAttribute('target') === '_blank') },
          ],
        },
      ],
    },

    /* ================================================================ 4. TABLAS */
    {
      id: 'html-tablas',
      title: 'Tablas',
      desc: 'Datos en filas y columnas: horarios, precios, tablas de posiciones.',
      lessons: [
        {
          id: 'html-tabla',
          kind: 'web',
          title: 'Tu primera tabla',
          intro: (
            <>
              <p>
                Una tabla se arma con <code>table</code>. Adentro van las filas (<code>tr</code>, <i>table row</i>) y en cada fila las
                celdas (<code>td</code>, <i>table data</i>).
              </p>
              <pre>
                <code>{'<table>\n  <tr>\n    <td>Alfajor</td>\n    <td>$800</td>\n  </tr>\n  <tr>\n    <td>Gaseosa</td>\n    <td>$1200</td>\n  </tr>\n</table>'}</code>
              </pre>
              <p>Se escribe fila por fila, de izquierda a derecha.</p>
            </>
          ),
          task: (
            <p>
              Armá una tabla con los precios del buffet: al menos <b>3 filas</b>, cada una con <b>2 celdas</b> (producto y precio).
            </p>
          ),
          hint: (
            <p>
              Cada producto es un <code>tr</code> con dos <code>td</code> adentro.
            </p>
          ),
          edit: ['html'],
          starter: { html: '<h2>Precios del buffet</h2>\n\n', css: 'table, td { border: 1px solid #999; border-collapse: collapse; padding: 4px 8px; }\n' },
          solution: {
            html: '<h2>Precios del buffet</h2>\n<table>\n  <tr>\n    <td>Alfajor</td>\n    <td>$800</td>\n  </tr>\n  <tr>\n    <td>Gaseosa</td>\n    <td>$1200</td>\n  </tr>\n  <tr>\n    <td>Sándwich</td>\n    <td>$2500</td>\n  </tr>\n</table>\n',
            css: 'table, td { border: 1px solid #999; border-collapse: collapse; padding: 4px 8px; }\n',
          },
          tests: [
            { text: 'Hay una <table>', test: (c) => !!c.$('table') },
            { text: 'La tabla tiene al menos 3 filas <tr>', test: (c) => c.$$('table tr').length >= 3 },
            { text: 'Cada fila tiene 2 celdas <td>', test: (c) => c.$$('table tr').length > 0 && c.$$('table tr').every((r) => r.querySelectorAll(':scope > td').length === 2) },
            { text: 'Las celdas tienen texto', test: (c) => c.$$('td').length > 0 && c.$$('td').every((d) => txt(d).length > 0) },
          ],
        },
        {
          id: 'html-th-caption',
          kind: 'web',
          title: 'Encabezados y título de la tabla',
          intro: (
            <>
              <p>
                Las celdas de encabezado se hacen con <code>th</code> en vez de <code>td</code> (se ven en negrita y centradas). Y la
                tabla puede tener un título con <code>caption</code>, que va primero dentro de <code>table</code>.
              </p>
              <pre>
                <code>{'<table>\n  <caption>Goleadores</caption>\n  <tr>\n    <th>Jugador</th>\n    <th>Goles</th>\n  </tr>\n  <tr>\n    <td>Juan</td>\n    <td>7</td>\n  </tr>\n</table>'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              En la tabla de posiciones, cambiá las celdas de la primera fila por <code>th</code> y agregá un <code>caption</code> que
              diga <b>Liga del barrio</b>.
            </p>
          ),
          hint: (
            <p>
              Solo cambian las celdas de la primera fila: <code>{'<td>Equipo</td>'}</code> pasa a ser <code>{'<th>Equipo</th>'}</code>. El caption va justo después de <code>{'<table>'}</code>.
            </p>
          ),
          edit: ['html'],
          starter: {
            html: '<table>\n  <tr>\n    <td>Equipo</td>\n    <td>PJ</td>\n    <td>Puntos</td>\n  </tr>\n  <tr>\n    <td>Los Halcones</td>\n    <td>5</td>\n    <td>13</td>\n  </tr>\n  <tr>\n    <td>Villa Allende FC</td>\n    <td>5</td>\n    <td>10</td>\n  </tr>\n  <tr>\n    <td>Unión San Vicente</td>\n    <td>5</td>\n    <td>7</td>\n  </tr>\n</table>\n',
            css: 'table, th, td { border: 1px solid #999; border-collapse: collapse; padding: 4px 8px; }\nth { background: #dbeafe; }\n',
          },
          solution: {
            html: '<table>\n  <caption>Liga del barrio</caption>\n  <tr>\n    <th>Equipo</th>\n    <th>PJ</th>\n    <th>Puntos</th>\n  </tr>\n  <tr>\n    <td>Los Halcones</td>\n    <td>5</td>\n    <td>13</td>\n  </tr>\n  <tr>\n    <td>Villa Allende FC</td>\n    <td>5</td>\n    <td>10</td>\n  </tr>\n  <tr>\n    <td>Unión San Vicente</td>\n    <td>5</td>\n    <td>7</td>\n  </tr>\n</table>\n',
            css: 'table, th, td { border: 1px solid #999; border-collapse: collapse; padding: 4px 8px; }\nth { background: #dbeafe; }\n',
          },
          tests: [
            { text: 'La tabla tiene un <caption> que dice "Liga del barrio"', test: (c) => txt(c.$('table caption')) === 'liga del barrio' },
            { text: 'La primera fila tiene 3 celdas <th>', test: (c) => (c.$('table tr')?.querySelectorAll(':scope > th').length ?? 0) === 3 },
            { text: 'La primera fila ya no tiene <td>', test: (c) => (c.$('table tr')?.querySelectorAll(':scope > td').length ?? 1) === 0 },
            { text: 'Las filas de los equipos siguen con <td>', test: (c) => c.$$('table tr').slice(1).length === 3 && c.$$('table tr').slice(1).every((r) => r.querySelectorAll('td').length === 3) },
          ],
        },
        {
          id: 'html-thead',
          kind: 'web',
          title: 'thead y tbody',
          intro: (
            <>
              <p>
                Las tablas se pueden dividir en partes: <code>thead</code> (el encabezado) y <code>tbody</code> (el cuerpo con los datos).
                Así queda más ordenado y se entiende qué es cada parte de la tabla.
              </p>
              <pre>
                <code>{'<table>\n  <thead>\n    <tr><th>Día</th><th>Materia</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>Lunes</td><td>Taller</td></tr>\n  </tbody>\n</table>'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              Meté la fila de encabezados en un <code>thead</code> y las filas de datos en un <code>tbody</code>.
            </p>
          ),
          hint: <p>El thead envuelve solo la primera fila. El tbody envuelve todas las demás.</p>,
          edit: ['html'],
          starter: {
            html: '<table>\n  <tr><th>Día</th><th>Materia</th><th>Aula</th></tr>\n  <tr><td>Lunes</td><td>Taller</td><td>Lab 2</td></tr>\n  <tr><td>Miércoles</td><td>Matemática</td><td>12</td></tr>\n  <tr><td>Viernes</td><td>Física</td><td>8</td></tr>\n</table>\n',
            css: 'table, th, td { border: 1px solid #999; border-collapse: collapse; padding: 4px 8px; }\nthead { background: #fde68a; }\n',
          },
          solution: {
            html: '<table>\n  <thead>\n    <tr><th>Día</th><th>Materia</th><th>Aula</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>Lunes</td><td>Taller</td><td>Lab 2</td></tr>\n    <tr><td>Miércoles</td><td>Matemática</td><td>12</td></tr>\n    <tr><td>Viernes</td><td>Física</td><td>8</td></tr>\n  </tbody>\n</table>\n',
            css: 'table, th, td { border: 1px solid #999; border-collapse: collapse; padding: 4px 8px; }\nthead { background: #fde68a; }\n',
          },
          tests: [
            { text: 'Hay un <thead> con la fila de <th>', test: (c) => c.$$('thead tr').length === 1 && c.$$('thead th').length === 3 },
            { text: 'Hay un <tbody> con las 3 filas de datos', test: (c) => c.$$('tbody tr').length === 3 && c.$$('tbody th').length === 0 },
            { text: 'El thead está antes que el tbody', test: (c) => after(c.$('thead'), c.$('tbody')) },
          ],
        },
        {
          id: 'html-proyecto-horario',
          kind: 'web',
          title: 'Mini-proyecto: El horario del curso',
          intro: (
            <>
              <p>
                🛠 <b>Mini-proyecto.</b> Pasá el horario de tu curso a una tabla bien armada, con título, encabezado y cuerpo.
              </p>
              <pre>
                <code>{'<table>\n  <caption>Horario de 3ro B</caption>\n  <thead>\n    <tr><th>Hora</th><th>Lunes</th> … </tr>\n  </thead>\n  <tbody>\n    <tr><td>7:30</td><td>Taller</td> … </tr>\n  </tbody>\n</table>'}</code>
              </pre>
            </>
          ),
          task: (
            <>
              <p>La tabla tiene que tener:</p>
              <ul>
                <li>
                  Un <code>caption</code> con el nombre del curso.
                </li>
                <li>
                  Un <code>thead</code> con <b>6</b> <code>th</code>: Hora, Lunes, Martes, Miércoles, Jueves y Viernes.
                </li>
                <li>
                  Un <code>tbody</code> con al menos <b>3</b> filas, cada una con <b>6</b> celdas.
                </li>
              </ul>
            </>
          ),
          edit: ['html'],
          starter: {
            html: '<table>\n\n</table>\n',
            css: 'table, th, td { border: 1px solid #999; border-collapse: collapse; padding: 4px 8px; }\nthead { background: #c7d2fe; }\ncaption { font-weight: bold; margin-bottom: 6px; }\n',
          },
          solution: {
            html: '<table>\n  <caption>Horario de 3ro B</caption>\n  <thead>\n    <tr><th>Hora</th><th>Lunes</th><th>Martes</th><th>Miércoles</th><th>Jueves</th><th>Viernes</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>7:30</td><td>Taller</td><td>Lengua</td><td>Física</td><td>Taller</td><td>Inglés</td></tr>\n    <tr><td>9:00</td><td>Taller</td><td>Matemática</td><td>Química</td><td>Taller</td><td>Historia</td></tr>\n    <tr><td>10:30</td><td>Ed. Física</td><td>Matemática</td><td>Geografía</td><td>Dibujo</td><td>Lengua</td></tr>\n  </tbody>\n</table>\n',
            css: 'table, th, td { border: 1px solid #999; border-collapse: collapse; padding: 4px 8px; }\nthead { background: #c7d2fe; }\ncaption { font-weight: bold; margin-bottom: 6px; }\n',
          },
          tests: [
            { text: 'Tiene un <caption> con texto', test: (c) => txt(c.$('table caption')).length > 0 },
            { text: 'El <thead> tiene 6 <th>', test: (c) => c.$$('thead th').length === 6 },
            { text: 'Los encabezados van de "Hora" a "Viernes"', test: (c) => { const h = c.$$('thead th').map(txt); return h[0] === 'hora' && h[1] === 'lunes' && h[5] === 'viernes' } },
            { text: 'El <tbody> tiene al menos 3 filas de 6 celdas', test: (c) => { const r = c.$$('tbody tr'); return r.length >= 3 && r.every((x) => x.querySelectorAll('td, th').length === 6) } },
          ],
        },
      ],
    },

    /* ================================================================ 5. FORMULARIOS */
    {
      id: 'html-forms',
      title: 'Formularios',
      desc: 'Campos de texto, opciones, listas desplegables y botones para pedir datos.',
      lessons: [
        {
          id: 'html-form-texto',
          kind: 'web',
          title: 'form, label e input',
          intro: (
            <>
              <p>
                Los formularios van dentro de <code>form</code>. Un campo para escribir es un <code>input</code> (etiqueta vacía). Cada
                campo lleva un <code>label</code> que dice qué hay que poner; el <code>for</code> del label tiene que coincidir con el{' '}
                <code>id</code> del input.
              </p>
              <pre>
                <code>{'<form>\n  <label for="apodo">Apodo:</label>\n  <input type="text" id="apodo" name="apodo">\n</form>'}</code>
              </pre>
              <p>
                El <code>name</code> es el nombre con el que se manda el dato. Si hacés clic en el label, el cursor va al campo.
              </p>
            </>
          ),
          task: (
            <p>
              Dentro del <code>form</code>, agregá un <code>label</code> que diga <b>Nombre:</b> y un <code>input</code> de texto con{' '}
              <code>id=&quot;nombre&quot;</code> y <code>name=&quot;nombre&quot;</code>, conectados entre sí.
            </p>
          ),
          hint: (
            <p>
              El label necesita <code>for=&quot;nombre&quot;</code> para conectarse con el input que tiene ese id.
            </p>
          ),
          edit: ['html'],
          starter: { html: '<h2>Inscripción al torneo de ajedrez</h2>\n<form>\n\n</form>\n', css: '' },
          solution: {
            html: '<h2>Inscripción al torneo de ajedrez</h2>\n<form>\n  <label for="nombre">Nombre:</label>\n  <input type="text" id="nombre" name="nombre">\n</form>\n',
            css: '',
          },
          tests: [
            { text: 'Hay un input de texto dentro del form', test: (c) => c.$$('form input').some((i) => (i as HTMLInputElement).type === 'text') },
            { text: 'El input tiene id="nombre" y name="nombre"', test: (c) => c.$('input#nombre')?.getAttribute('name') === 'nombre' },
            { text: 'Hay un label que dice "Nombre:"', test: (c) => txt(c.$('label')).replace(/:$/, '') === 'nombre' },
            { text: 'El label está conectado al input (for="nombre")', test: (c) => !!c.$('#nombre') && labeled(c.$('#nombre')!) },
          ],
        },
        {
          id: 'html-form-tipos',
          kind: 'web',
          title: 'Tipos de input',
          intro: (
            <>
              <p>
                Cambiando el <code>type</code> del input, el navegador ayuda con el dato:
              </p>
              <ul>
                <li>
                  <code>email</code>: controla que tenga forma de mail.
                </li>
                <li>
                  <code>number</code>: solo números; con <code>min</code> y <code>max</code> se pone un rango.
                </li>
                <li>
                  <code>password</code>: oculta lo que se escribe.
                </li>
              </ul>
              <pre>
                <code>{'<label for="goles">Goles:</label>\n<input type="number" id="goles" min="0" max="20">'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              Agregá al formulario tres campos, cada uno con su <code>label</code> conectado: un <b>email</b>, una <b>edad</b> de tipo{' '}
              <code>number</code> con <code>min=&quot;12&quot;</code> y <code>max=&quot;19&quot;</code>, y una <b>contraseña</b>.
            </p>
          ),
          hint: <p>Copiá el par label + input del nombre tres veces y cambiá el type, el id y el for de cada uno.</p>,
          edit: ['html'],
          starter: {
            html: '<form>\n  <label for="nombre">Nombre:</label>\n  <input type="text" id="nombre" name="nombre">\n  <br>\n\n</form>\n',
            css: 'label { display: inline-block; width: 110px; }\ninput { margin-bottom: 8px; }\n',
          },
          solution: {
            html: '<form>\n  <label for="nombre">Nombre:</label>\n  <input type="text" id="nombre" name="nombre">\n  <br>\n  <label for="email">Email:</label>\n  <input type="email" id="email" name="email">\n  <br>\n  <label for="edad">Edad:</label>\n  <input type="number" id="edad" name="edad" min="12" max="19">\n  <br>\n  <label for="clave">Contraseña:</label>\n  <input type="password" id="clave" name="clave">\n</form>\n',
            css: 'label { display: inline-block; width: 110px; }\ninput { margin-bottom: 8px; }\n',
          },
          tests: [
            { text: 'Hay un input type="email" con label', test: (c) => inputs(c, 'email').some(labeled) },
            { text: 'Hay un input type="number" con label', test: (c) => inputs(c, 'number').some(labeled) },
            { text: 'El número tiene min="12" y max="19"', test: (c) => inputs(c, 'number').some((i) => i.min === '12' && i.max === '19') },
            { text: 'Hay un input type="password" con label', test: (c) => inputs(c, 'password').some(labeled) },
          ],
        },
        {
          id: 'html-form-opciones',
          kind: 'web',
          title: 'Opciones: radio, checkbox y select',
          intro: (
            <>
              <p>Para elegir entre opciones:</p>
              <ul>
                <li>
                  <code>radio</code>: se elige <b>una sola</b>. Todos los del grupo llevan el <b>mismo</b> <code>name</code>.
                </li>
                <li>
                  <code>checkbox</code>: casillas que se marcan o no.
                </li>
                <li>
                  <code>select</code> con <code>option</code>: una lista desplegable.
                </li>
              </ul>
              <pre>
                <code>
                  {
                    '<input type="radio" id="m" name="turno" value="manana">\n<label for="m">Mañana</label>\n\n<input type="checkbox" id="foto" name="foto">\n<label for="foto">Acepto salir en fotos</label>\n\n<select name="anio">\n  <option>1ro</option>\n  <option>2do</option>\n</select>'
                  }
                </code>
              </pre>
            </>
          ),
          task: (
            <p>
              Agregá al formulario: dos <b>radio</b> para elegir el turno (<b>Mañana</b> y <b>Tarde</b>) con el mismo <code>name</code>, un{' '}
              <code>select</code> para el curso con al menos <b>3</b> <code>option</code> y un <b>checkbox</b> que diga{' '}
              <b>Traigo mi notebook</b>.
            </p>
          ),
          hint: <p>Si los radios tienen distinto name, se pueden marcar los dos a la vez. Revisá que el name sea igual.</p>,
          edit: ['html'],
          starter: { html: '<h2>Taller de robótica</h2>\n<form>\n\n</form>\n', css: 'select, label { margin: 4px; }\n' },
          solution: {
            html: '<h2>Taller de robótica</h2>\n<form>\n  <p>Turno:\n    <input type="radio" id="manana" name="turno" value="manana">\n    <label for="manana">Mañana</label>\n    <input type="radio" id="tarde" name="turno" value="tarde">\n    <label for="tarde">Tarde</label>\n  </p>\n  <label for="curso">Curso:</label>\n  <select id="curso" name="curso">\n    <option>3ro A</option>\n    <option>3ro B</option>\n    <option>3ro C</option>\n  </select>\n  <p>\n    <input type="checkbox" id="note" name="note">\n    <label for="note">Traigo mi notebook</label>\n  </p>\n</form>\n',
            css: 'select, label { margin: 4px; }\n',
          },
          tests: [
            { text: 'Hay al menos dos inputs type="radio"', test: (c) => inputs(c, 'radio').length >= 2 },
            { text: 'Los radios tienen el mismo name', test: (c) => { const r = inputs(c, 'radio'); return r.length >= 2 && !!r[0].name && r.every((x) => x.name === r[0].name) } },
            { text: 'Hay un select con al menos 3 option', test: (c) => c.$$('select').some((s) => s.querySelectorAll('option').length >= 3) },
            { text: 'Hay un checkbox con un label "Traigo mi notebook"', test: (c) => inputs(c, 'checkbox').some((i) => Array.from(i.labels ?? []).some((l) => txt(l) === 'traigo mi notebook')) },
          ],
        },
        {
          id: 'html-form-textarea',
          kind: 'web',
          title: 'Textarea, botones y campos obligatorios',
          intro: (
            <>
              <ul>
                <li>
                  <code>textarea</code>: un campo para textos largos. Tiene etiqueta de cierre.
                </li>
                <li>
                  <code>button</code>: un botón. Con <code>type=&quot;submit&quot;</code> manda el formulario.
                </li>
                <li>
                  <code>required</code>: un atributo sin valor que hace que el campo sea obligatorio.
                </li>
                <li>
                  <code>placeholder</code>: un texto de ejemplo gris que se borra al escribir.
                </li>
              </ul>
              <pre>
                <code>{'<input type="text" id="dni" required>\n<textarea id="msg" name="msg" placeholder="Escribí acá…"></textarea>\n<button type="submit">Mandar</button>'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              Hacé que el campo <b>Nombre</b> sea obligatorio, agregá un <code>textarea</code> con <code>name=&quot;consulta&quot;</code> y un{' '}
              <code>placeholder</code>, y un botón <code>submit</code> que diga <b>Enviar</b>.
            </p>
          ),
          hint: (
            <p>
              <code>required</code> se agrega dentro del <code>{'<input …>'}</code> del nombre, sin valor.
            </p>
          ),
          edit: ['html'],
          starter: {
            html: '<h2>Consultas al centro de estudiantes</h2>\n<form>\n  <label for="nombre">Nombre:</label>\n  <input type="text" id="nombre" name="nombre">\n  <br>\n  <label for="consulta">Consulta:</label>\n  <br>\n\n</form>\n',
            css: 'textarea { width: 260px; height: 80px; }\n',
          },
          solution: {
            html: '<h2>Consultas al centro de estudiantes</h2>\n<form>\n  <label for="nombre">Nombre:</label>\n  <input type="text" id="nombre" name="nombre" required>\n  <br>\n  <label for="consulta">Consulta:</label>\n  <br>\n  <textarea id="consulta" name="consulta" placeholder="¿Qué querés preguntar?"></textarea>\n  <br>\n  <button type="submit">Enviar</button>\n</form>\n',
            css: 'textarea { width: 260px; height: 80px; }\n',
          },
          tests: [
            { text: 'El campo nombre es obligatorio (required)', test: (c) => !!(c.$('#nombre') as HTMLInputElement | null)?.required },
            { text: 'Hay un textarea con name="consulta"', test: (c) => c.$('textarea')?.getAttribute('name') === 'consulta' },
            { text: 'El textarea tiene un placeholder', test: (c) => (c.$('textarea')?.getAttribute('placeholder') ?? '').trim().length > 0 },
            { text: 'Hay un botón submit que dice "Enviar"', test: (c) => c.$$('button, input[type=submit]').some((b) => (b as HTMLButtonElement).type === 'submit' && (txt(b) === 'enviar' || low((b as HTMLInputElement).value ?? '') === 'enviar')) },
          ],
        },
        {
          id: 'html-proyecto-inscripcion',
          kind: 'web',
          title: 'Mini-proyecto: Ficha de inscripción al taller',
          intro: (
            <>
              <p>
                🛠 <b>Mini-proyecto.</b> La escuela abre un taller extracurricular de robótica los sábados. Armá la ficha de inscripción
                completa con todo lo que viste en el módulo.
              </p>
              <p>Recordá: cada campo con su label, los radios del mismo grupo con el mismo name.</p>
            </>
          ),
          task: (
            <>
              <p>
                Dentro de un <code>form</code>:
              </p>
              <ul>
                <li>Nombre y apellido (texto, <b>obligatorio</b>) y email (<code>type=&quot;email&quot;</code>).</li>
                <li>
                  Un <code>select</code> de curso con al menos 3 opciones.
                </li>
                <li>Al menos 2 radios para el nivel (por ejemplo &quot;Nunca programé&quot; / &quot;Ya programé&quot;).</li>
                <li>
                  Un checkbox &quot;Tengo autorización de mi familia&quot; y un <code>textarea</code> para comentarios.
                </li>
                <li>Un botón para enviar.</li>
                <li>
                  <b>Todos</b> los campos (input, select y textarea) con su <code>label</code>.
                </li>
              </ul>
            </>
          ),
          edit: ['html'],
          starter: {
            html: '<h1>Inscripción: Taller de robótica</h1>\n<form>\n\n</form>\n',
            css: 'form { display: grid; gap: 6px; max-width: 360px; }\n',
          },
          solution: {
            html: '<h1>Inscripción: Taller de robótica</h1>\n<form>\n  <label for="nombre">Nombre y apellido</label>\n  <input type="text" id="nombre" name="nombre" required>\n  <label for="email">Email</label>\n  <input type="email" id="email" name="email">\n  <label for="curso">Curso</label>\n  <select id="curso" name="curso">\n    <option>3ro A</option>\n    <option>3ro B</option>\n    <option>3ro C</option>\n  </select>\n  <div>\n    <input type="radio" id="n0" name="nivel" value="nunca">\n    <label for="n0">Nunca programé</label>\n    <input type="radio" id="n1" name="nivel" value="ya">\n    <label for="n1">Ya programé</label>\n  </div>\n  <div>\n    <input type="checkbox" id="aut" name="aut">\n    <label for="aut">Tengo autorización de mi familia</label>\n  </div>\n  <label for="com">Comentarios</label>\n  <textarea id="com" name="com"></textarea>\n  <button type="submit">Inscribirme</button>\n</form>\n',
            css: 'form { display: grid; gap: 6px; max-width: 360px; }\n',
          },
          tests: [
            { text: 'Hay un campo de texto obligatorio y uno de email', test: (c) => inputs(c, 'text').some((i) => i.required) && inputs(c, 'email').length > 0 },
            { text: 'Hay un select con al menos 3 opciones', test: (c) => c.$$('form select').some((s) => s.querySelectorAll('option').length >= 3) },
            { text: 'Hay al menos 2 radios con el mismo name', test: (c) => { const r = inputs(c, 'radio'); return r.length >= 2 && !!r[0].name && r.every((x) => x.name === r[0].name) } },
            { text: 'Hay un checkbox, un textarea y un botón submit', test: (c) => inputs(c, 'checkbox').length > 0 && !!c.$('form textarea') && c.$$('form button, form input[type=submit]').some((b) => (b as HTMLButtonElement).type === 'submit') },
            { text: 'Todos los campos tienen su label', test: (c) => { const f = c.$$('form input, form select, form textarea').filter((e) => !['submit', 'button', 'hidden', 'reset'].includes((e as HTMLInputElement).type)); return f.length >= 6 && f.every(labeled) } },
          ],
        },
      ],
    },

    /* ================================================================ 6. ESTRUCTURA SEMÁNTICA */
    {
      id: 'html-semantica',
      title: 'Estructura semántica',
      desc: 'Etiquetas que dicen qué es cada parte de la página, y class/id para identificarlas.',
      lessons: [
        {
          id: 'html-semanticas',
          kind: 'web',
          title: 'header, nav, main y footer',
          intro: (
            <>
              <p>
                Las etiquetas <b>semánticas</b> dicen <i>qué es</i> cada parte de la página. Se ven igual que un <code>div</code>, pero
                ayudan a los buscadores, a los lectores de pantalla y a quien lee el código.
              </p>
              <ul>
                <li>
                  <code>header</code>: la cabecera (logo, título).
                </li>
                <li>
                  <code>nav</code>: el menú de navegación.
                </li>
                <li>
                  <code>main</code>: el contenido principal (uno solo por página).
                </li>
                <li>
                  <code>footer</code>: el pie (contacto, derechos).
                </li>
              </ul>
              <pre>
                <code>{'<header>\n  <h1>Mi sitio</h1>\n  <nav> <a href="#">Inicio</a> </nav>\n</header>\n<main> … </main>\n<footer> … </footer>'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              Cambiá los <code>div</code> por las etiquetas semánticas que correspondan: <code>header</code> (con el <code>nav</code>{' '}
              adentro), <code>main</code> y <code>footer</code>. Fijate en la clase de cada div para saber qué es.
            </p>
          ),
          hint: <p>Cambiá tanto la etiqueta que abre como la que cierra. El div &quot;menu&quot; pasa a ser nav.</p>,
          edit: ['html'],
          starter: {
            html: '<div class="cabecera">\n  <h1>Club Atlético Barrio Jardín</h1>\n  <div class="menu">\n    <a href="#">Inicio</a>\n    <a href="#">Deportes</a>\n    <a href="#">Socios</a>\n  </div>\n</div>\n<div class="contenido">\n  <h2>Bienvenidos</h2>\n  <p>Inscripciones abiertas para fútbol y vóley.</p>\n</div>\n<div class="pie">\n  <p>Club Atlético Barrio Jardín · Córdoba</p>\n</div>\n',
            css: '',
          },
          solution: {
            html: '<header>\n  <h1>Club Atlético Barrio Jardín</h1>\n  <nav>\n    <a href="#">Inicio</a>\n    <a href="#">Deportes</a>\n    <a href="#">Socios</a>\n  </nav>\n</header>\n<main>\n  <h2>Bienvenidos</h2>\n  <p>Inscripciones abiertas para fútbol y vóley.</p>\n</main>\n<footer>\n  <p>Club Atlético Barrio Jardín · Córdoba</p>\n</footer>\n',
            css: '',
          },
          tests: [
            { text: 'Hay un <header> con el h1', test: (c) => !!c.$('header h1') },
            { text: 'Los links están en un <nav> dentro del header', test: (c) => c.$$('header nav a').length >= 3 },
            { text: 'El h2 y el párrafo están en un <main>', test: (c) => !!c.$('main h2') && !!c.$('main p') },
            { text: 'Hay un <footer> después del main', test: (c) => txt(c.$('footer')).length > 0 && after(c.$('main'), c.$('footer')) },
            { text: 'Ya no quedan esos div', test: (c) => c.$$('div').length === 0 },
          ],
        },
        {
          id: 'html-section-article',
          kind: 'web',
          title: 'section y article',
          intro: (
            <>
              <ul>
                <li>
                  <code>section</code>: una parte de la página con un tema (normalmente empieza con un título).
                </li>
                <li>
                  <code>article</code>: un contenido que tiene sentido solo, como una noticia o una publicación.
                </li>
              </ul>
              <pre>
                <code>{'<section>\n  <h2>Noticias</h2>\n  <article>\n    <h3>Ganamos la feria de ciencias</h3>\n    <p>…</p>\n  </article>\n</section>'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              Dentro del <code>main</code>, armá una <code>section</code> con un <code>h2</code> que diga <b>Noticias</b> y al menos{' '}
              <b>dos</b> <code>article</code>, cada uno con un <code>h3</code> y un <code>p</code>.
            </p>
          ),
          hint: <p>Las dos noticias van una debajo de la otra, cada una en su propio article, y los dos adentro de la section.</p>,
          edit: ['html'],
          starter: { html: '<main>\n\n</main>\n', css: 'article { border-left: 4px solid #0ea5e9; padding-left: 10px; margin: 10px 0; }\n' },
          solution: {
            html: '<main>\n  <section>\n    <h2>Noticias</h2>\n    <article>\n      <h3>Feria de ciencias</h3>\n      <p>3ro B presentó un robot seguidor de línea.</p>\n    </article>\n    <article>\n      <h3>Torneo intercolegial</h3>\n      <p>El equipo de vóley pasó a semifinales.</p>\n    </article>\n  </section>\n</main>\n',
            css: 'article { border-left: 4px solid #0ea5e9; padding-left: 10px; margin: 10px 0; }\n',
          },
          tests: [
            { text: 'Hay una <section> dentro del main', test: (c) => !!c.$('main section') },
            { text: 'La section tiene un h2 "Noticias"', test: (c) => txt(c.$('section h2')) === 'noticias' },
            { text: 'Hay al menos 2 <article> dentro de la section', test: (c) => c.$$('section article').length >= 2 },
            { text: 'Cada article tiene un h3 y un p con texto', test: (c) => c.$$('article').length >= 2 && c.$$('article').every((a) => txt(a.querySelector('h3')) && txt(a.querySelector('p'))) },
          ],
        },
        {
          id: 'html-div-span',
          kind: 'web',
          title: 'div, span, class e id',
          intro: (
            <>
              <p>
                Cuando ninguna etiqueta semántica sirve, se usa <code>div</code> (una caja, ocupa todo el ancho) o <code>span</code> (un
                pedacito dentro de un texto). Solos no cambian cómo se ve nada: sirven para agrupar partes y, con un id o una clase, encontrarlas desde JavaScript.
              </p>
              <p>
                Para identificarlos se usan atributos: <code>class</code> (un grupo, se puede repetir) e <code>id</code> (único en la página).
              </p>
              <pre>
                <code>{'<div id="principal">\n  <div class="tarjeta">…</div>\n  <p>El <span class="resaltado">viernes</span> no hay clases.</p>\n</div>'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              El CSS ya está hecho. Poné <code>id=&quot;principal&quot;</code> al <code>div</code> de afuera, meté cada jugador en un{' '}
              <code>div</code> con <code>class=&quot;tarjeta&quot;</code> y rodeá la palabra <b>sábado</b> con un <code>span</code> de clase{' '}
              <code>resaltado</code>.
            </p>
          ),
          hint: (
            <p>
              Cada tarjeta envuelve un h3 y su p. El span va dentro del último párrafo, solo alrededor de la palabra.
            </p>
          ),
          edit: ['html'],
          starter: {
            html: '<div>\n  <h3>Lucía Gómez</h3>\n  <p>Arquera</p>\n  <h3>Tomás Díaz</h3>\n  <p>Delantero</p>\n  <p>Próximo partido: el sábado a las 10.</p>\n</div>\n',
            css: '#principal { background: #f1f5f9; padding: 10px; }\n.tarjeta { background: white; border: 1px solid #94a3b8; border-radius: 8px; padding: 6px 12px; margin: 8px 0; }\n.resaltado { background: #fde047; font-weight: bold; }\n',
          },
          solution: {
            html: '<div id="principal">\n  <div class="tarjeta">\n    <h3>Lucía Gómez</h3>\n    <p>Arquera</p>\n  </div>\n  <div class="tarjeta">\n    <h3>Tomás Díaz</h3>\n    <p>Delantero</p>\n  </div>\n  <p>Próximo partido: el <span class="resaltado">sábado</span> a las 10.</p>\n</div>\n',
            css: '#principal { background: #f1f5f9; padding: 10px; }\n.tarjeta { background: white; border: 1px solid #94a3b8; border-radius: 8px; padding: 6px 12px; margin: 8px 0; }\n.resaltado { background: #fde047; font-weight: bold; }\n',
          },
          tests: [
            { text: 'El div de afuera tiene id="principal"', test: (c) => c.$('#principal')?.tagName === 'DIV' },
            { text: 'Hay dos div.tarjeta, cada uno con un h3 y un p', test: (c) => c.$$('div.tarjeta').length === 2 && c.$$('div.tarjeta').every((d) => d.querySelector('h3') && d.querySelector('p')) },
            { text: 'Hay un span.resaltado que dice "sábado"', test: (c) => txt(c.$('span.resaltado')) === 'sabado' },
            { text: 'El span está dentro de un párrafo', test: (c) => !!c.$('p span.resaltado') },
          ],
        },
        {
          id: 'html-proyecto-curso',
          kind: 'web',
          title: 'Mini-proyecto: La página de mi curso',
          intro: (
            <>
              <p>
                🛠 <b>Proyecto final de HTML.</b> Armá la página de tu curso con todo lo que aprendiste: estructura completa, etiquetas
                semánticas, listas o tablas, imágenes y links. En el curso de CSS le vas a dar estilo.
              </p>
              <pre>
                <code>{'<header>\n  <h1>3ro B · ITS Villada</h1>\n  <nav>…</nav>\n</header>\n<main>\n  <section id="horario">…</section>\n  <section id="proyectos">…</section>\n</main>\n<footer>…</footer>'}</code>
              </pre>
            </>
          ),
          task: (
            <>
              <p>La página tiene que tener:</p>
              <ul>
                <li>
                  <code>{'<!DOCTYPE html>'}</code> y un <code>title</code>.
                </li>
                <li>
                  Un <code>header</code> con un <code>h1</code> y un <code>nav</code> con al menos <b>3</b> links.
                </li>
                <li>
                  Un <code>main</code> con al menos <b>2</b> <code>section</code>, cada una con su <code>h2</code>.
                </li>
                <li>
                  Una lista o una tabla, y una imagen con <code>alt</code>.
                </li>
                <li>
                  Un <code>footer</code> con texto.
                </li>
              </ul>
            </>
          ),
          edit: ['html'],
          starter: {
            html: '<!DOCTYPE html>\n<html lang="es">\n  <head>\n    <meta charset="utf-8">\n    <title>Mi curso</title>\n  </head>\n  <body>\n\n  </body>\n</html>\n',
            css: '',
          },
          solution: {
            html: '<!DOCTYPE html>\n<html lang="es">\n  <head>\n    <meta charset="utf-8">\n    <title>3ro B</title>\n  </head>\n  <body>\n    <header>\n      <h1>3ro B · ITS Villada</h1>\n      <nav>\n        <a href="#horario">Horario</a>\n        <a href="#proyectos">Proyectos</a>\n        <a href="#contacto">Contacto</a>\n      </nav>\n    </header>\n    <main>\n      <section id="horario">\n        <h2>Horario</h2>\n        <ul>\n          <li>Lunes: Taller</li>\n          <li>Martes: Matemática</li>\n        </ul>\n      </section>\n      <section id="proyectos">\n        <h2>Proyectos</h2>\n        <img src="https://picsum.photos/id/0/300/200" alt="Una notebook sobre la mesa">\n        <p>Este año hicimos una estación meteorológica.</p>\n      </section>\n    </main>\n    <footer id="contacto">\n      <p>3ro B · Córdoba · 2026</p>\n    </footer>\n  </body>\n</html>\n',
            css: '',
          },
          tests: [
            { text: 'Tiene <!DOCTYPE html> y un title', test: (c) => /^\s*<!doctype html>/i.test(c.html) && c.doc.title.trim().length > 0 },
            { text: 'El header tiene un h1 y un nav con al menos 3 links', test: (c) => !!c.$('header h1') && c.$$('header nav a').length >= 3 },
            { text: 'El main tiene al menos 2 section con h2', test: (c) => c.$$('main section').filter((s) => s.querySelector('h2')).length >= 2 },
            { text: 'Hay una lista o tabla y una imagen con alt', test: (c) => !!c.$('main li, main td') && c.$$('img').some((i) => (i.getAttribute('alt') ?? '').trim().length > 0) },
            { text: 'Hay un footer con texto', test: (c) => txt(c.$('footer')).length > 0 },
          ],
        },
      ],
    },
  ],
}
