import { cssOnly, type Track, type WebCtx } from '../types'

/* ------------------------------------------------------------------ ayudas para las pruebas */

const px = (s: string) => parseFloat(s) || 0
const clear = (s: string) => !s || s === 'transparent' || s === 'rgba(0, 0, 0, 0)'
const near = (a: number, b: number, tol = 1.5) => Math.abs(a - b) <= tol
const box = (c: WebCtx, sel: string) => c.$(sel)?.getBoundingClientRect() ?? null
const boxes = (c: WebCtx, sel: string) => c.$$(sel).map((e) => e.getBoundingClientRect())

type AnyRule = CSSRule & { selectorText?: string; style?: CSSStyleDeclaration; cssRules?: CSSRuleList; conditionText?: string; media?: MediaList }
/** todas las reglas del CSS del alumno (incluye las que están dentro de @media) */
export function allRules(c: WebCtx): AnyRule[] {
  const out: AnyRule[] = []
  const walk = (list: CSSRuleList) => {
    for (const r of Array.from(list) as AnyRule[]) {
      out.push(r)
      if (r.cssRules) walk(r.cssRules)
    }
  }
  for (const s of Array.from(c.doc.styleSheets)) {
    try {
      walk(s.cssRules)
    } catch {
      /* hoja no accesible */
    }
  }
  return out
}
/** reglas cuyo selector cumple la condición */
const rulesFor = (c: WebCtx, sel: RegExp) => allRules(c).filter((r) => r.selectorText && sel.test(r.selectorText))
/** reglas @media cuya condición cumple la expresión */
const mediaFor = (c: WebCtx, cond: RegExp) => allRules(c).filter((r) => r.media && r.cssRules && cond.test(r.conditionText ?? r.media.mediaText))
/** columnas de una grilla según el estilo calculado */
const tracks = (c: WebCtx, sel: string) => c.style(sel, 'grid-template-columns').split(' ').filter((x) => x && x !== 'none')

const CARD_HTML = '<div class="jugador">\n  <h2>Lionel Ríos</h2>\n  <p class="posicion">Mediocampista</p>\n  <p class="numero">10</p>\n</div>\n'
const NAV_HTML =
  '<header class="barra">\n  <div class="logo">⚽ Club Barrio Jardín</div>\n  <nav>\n    <a href="#">Inicio</a>\n    <a href="#">Deportes</a>\n    <a href="#">Socios</a>\n    <a href="#">Contacto</a>\n  </nav>\n</header>\n'

export const CSS_TRACK: Track = {
  id: 'css',
  title: 'CSS',
  icon: '🎨',
  desc: 'El diseño de las páginas: colores, letras, cajas, espacios y cómo acomodar los elementos.',
  modules: [
    /* ================================================================ 1. SELECTORES */
    {
      id: 'css-primeros',
      title: 'Selectores y reglas',
      desc: 'Cómo se escribe una regla y cómo elegir a qué elementos se aplica.',
      lessons: [
        {
          id: 'css-1',
          kind: 'web',
          title: 'Cambiar el color de un título',
          intro: (
            <>
              <p>
                <b>CSS</b> le da estilo al HTML. Una regla tiene un <b>selector</b> (a quién se aplica) y entre llaves las{' '}
                <b>propiedades</b> con su valor:
              </p>
              <pre>
                <code>{'h1 {\n  color: red;\n}'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              En <code>styles.css</code>, hacé que el título <code>h1</code> sea de color <b>azul</b> (<code>blue</code>).
            </p>
          ),
          hint: <p>Escribí una regla con el selector <code>h1</code> y la propiedad <code>color: blue;</code></p>,
          edit: ['css'],
          starter: { html: '<h1>Taller de Computación</h1>\n<p>Aprendiendo CSS en el ITS Villada.</p>\n', css: '/* Escribí tus reglas acá */\n' },
          solution: { html: '<h1>Taller de Computación</h1>\n<p>Aprendiendo CSS en el ITS Villada.</p>\n', css: 'h1 {\n  color: blue;\n}\n' },
          tests: [
            { text: 'Hay una regla para h1', test: (c) => /(^|[\s,}])h1\s*[{,]/.test(c.css) },
            { text: 'El título se ve azul', test: (c) => c.style('h1', 'color') === 'rgb(0, 0, 255)' },
            { text: 'El párrafo no cambió de color', test: (c) => c.style('p', 'color') !== 'rgb(0, 0, 255)' },
          ],
        },
        {
          id: 'css-clase',
          kind: 'web',
          title: 'Selector de clase',
          intro: (
            <>
              <p>
                El selector de etiqueta (<code>p</code>) cambia <b>todos</b> los párrafos. Para cambiar solo algunos, en el HTML se les
                pone una <code>class</code> y en el CSS se la selecciona con un <b>punto</b>:
              </p>
              <pre>
                <code>{'<p class="aviso">¡Mañana no hay clases!</p>\n\n.aviso {\n  color: red;\n}'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              Hacé que <b>solo</b> los párrafos con clase <code>aviso</code> sean de color <code>red</code>. El párrafo del buffet tiene que
              quedar como está.
            </p>
          ),
          hint: <p>El selector empieza con un punto y sigue con el nombre de la clase, sin espacios.</p>,
          edit: ['css'],
          starter: {
            html: '<h2>Cartelera</h2>\n<p class="aviso">Mañana no hay clases por jornada docente.</p>\n<p>El buffet abre a las 7:30.</p>\n<p class="aviso">El viernes se entregan boletines.</p>\n',
            css: '',
          },
          solution: {
            html: '<h2>Cartelera</h2>\n<p class="aviso">Mañana no hay clases por jornada docente.</p>\n<p>El buffet abre a las 7:30.</p>\n<p class="aviso">El viernes se entregan boletines.</p>\n',
            css: '.aviso {\n  color: red;\n}\n',
          },
          tests: [
            { text: 'Hay una regla con el selector .aviso', test: (c) => /\.aviso\b/.test(cssOnly(c.css)) },
            { text: 'Los dos avisos se ven rojos', test: (c) => c.$$('.aviso').length === 2 && c.$$('.aviso').every((p) => c.win.getComputedStyle(p).color === 'rgb(255, 0, 0)') },
            { text: 'El párrafo del buffet no es rojo', test: (c) => c.style('p:not(.aviso)', 'color') !== 'rgb(255, 0, 0)' },
          ],
        },
        {
          id: 'css-id',
          kind: 'web',
          title: 'Selector de id y color de fondo',
          intro: (
            <>
              <p>
                Un elemento con <code>id</code> se selecciona con <code>#</code>. Como el id es único, la regla se aplica a un solo
                elemento.
              </p>
              <p>
                Además de <code>color</code> (el color del texto) existe <code>background-color</code>, el color de fondo:
              </p>
              <pre>
                <code>{'#resultado {\n  background-color: lightgreen;\n}'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              Al título con <code>id=&quot;campeon&quot;</code> ponele fondo <code>yellow</code> y texto <code>navy</code>. Los otros títulos
              no cambian.
            </p>
          ),
          hint: <p>Usá #campeon como selector y poné las dos propiedades en la misma regla, cada una terminada en punto y coma.</p>,
          edit: ['css'],
          starter: {
            html: '<h2>Torneo de truco 2025</h2>\n<h2 id="campeon">Campeón: 3ro B</h2>\n<h2>Subcampeón: 5to A</h2>\n',
            css: '',
          },
          solution: {
            html: '<h2>Torneo de truco 2025</h2>\n<h2 id="campeon">Campeón: 3ro B</h2>\n<h2>Subcampeón: 5to A</h2>\n',
            css: '#campeon {\n  background-color: yellow;\n  color: navy;\n}\n',
          },
          tests: [
            { text: 'Hay una regla con #campeon', test: (c) => /#campeon\b/.test(cssOnly(c.css)) },
            { text: 'El campeón tiene fondo amarillo', test: (c) => c.style('#campeon', 'background-color') === 'rgb(255, 255, 0)' },
            { text: 'El campeón tiene texto navy', test: (c) => c.style('#campeon', 'color') === 'rgb(0, 0, 128)' },
            { text: 'Los otros títulos no tienen fondo', test: (c) => c.$$('h2:not(#campeon)').every((h) => clear(c.win.getComputedStyle(h).backgroundColor)) },
          ],
        },
        {
          id: 'css-agrupar',
          kind: 'web',
          title: 'Agrupar y combinar selectores',
          intro: (
            <>
              <p>Dos formas de combinar selectores:</p>
              <ul>
                <li>
                  <b>Con coma</b> (agrupar): la misma regla para varios. <code>{'h1, h2 { … }'}</code>
                </li>
                <li>
                  <b>Con espacio</b> (descendiente): elementos que están <i>dentro</i> de otro. <code>{'.menu a { … }'}</code> son los{' '}
                  <code>a</code> que están dentro de <code>.menu</code>.
                </li>
              </ul>
              <pre>
                <code>{'h1, h2 {\n  color: purple;\n}\n.menu a {\n  color: orange;\n}'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              Con <b>una sola regla</b>, poné <code>h1</code> y <code>h2</code> de color <code>green</code>. Con otra regla, poné de color{' '}
              <code>orange</code> solo los links que están dentro de <code>.menu</code> (el link del párrafo no cambia).
            </p>
          ),
          hint: <p>La primera regla usa una coma entre h1 y h2. La segunda tiene un espacio entre .menu y a.</p>,
          edit: ['css'],
          starter: {
            html: '<nav class="menu">\n  <a href="#">Inicio</a>\n  <a href="#">Fixture</a>\n</nav>\n<h1>Liga escolar</h1>\n<h2>Fecha 3</h2>\n<p>Mirá el <a href="#">reglamento</a>.</p>\n',
            css: '',
          },
          solution: {
            html: '<nav class="menu">\n  <a href="#">Inicio</a>\n  <a href="#">Fixture</a>\n</nav>\n<h1>Liga escolar</h1>\n<h2>Fecha 3</h2>\n<p>Mirá el <a href="#">reglamento</a>.</p>\n',
            css: 'h1, h2 {\n  color: green;\n}\n.menu a {\n  color: orange;\n}\n',
          },
          tests: [
            { text: 'Una sola regla agrupa h1 y h2 con coma', test: (c) => rulesFor(c, /^(h1\s*,\s*h2|h2\s*,\s*h1)$/).length > 0 },
            { text: 'h1 y h2 se ven verdes', test: (c) => c.style('h1', 'color') === 'rgb(0, 128, 0)' && c.style('h2', 'color') === 'rgb(0, 128, 0)' },
            { text: 'Los links del menú son naranjas', test: (c) => c.$$('.menu a').every((a) => c.win.getComputedStyle(a).color === 'rgb(255, 165, 0)') },
            { text: 'El link del párrafo no es naranja', test: (c) => c.style('p a', 'color') !== 'rgb(255, 165, 0)' },
          ],
        },
        {
          id: 'css-cascada',
          kind: 'web',
          title: 'Cascada y especificidad',
          intro: (
            <>
              <p>Cuando dos reglas le ponen distinto valor a lo mismo, ¿cuál gana?</p>
              <ol>
                <li>
                  Gana la más <b>específica</b>: un <code>#id</code> le gana a una <code>.clase</code>, y una clase le gana a una{' '}
                  <code>etiqueta</code>. Si un selector combina varias cosas, se suman.
                </li>
                <li>
                  Si son igual de específicas, gana la que está <b>más abajo</b> (eso es la <i>cascada</i>).
                </li>
              </ol>
              <pre>
                <code>{'#noticias p   → 1 id + 1 etiqueta\n.urgente      → 1 clase      (pierde)\n#noticias .urgente → 1 id + 1 clase (gana)'}</code>
              </pre>
              <p>
                Existe <code>!important</code> para forzar, pero es una mala costumbre: acá no vale usarlo.
              </p>
            </>
          ),
          task: (
            <p>
              La regla <code>.urgente</code> no funciona porque <code>#noticias p</code> es más específica. Arreglá el CSS para que el
              párrafo urgente se vea <b>rojo</b>, sin tocar el HTML y sin <code>!important</code>. Los demás párrafos quedan como están.
            </p>
          ),
          hint: <p>Hacé el selector de .urgente más específico: por ejemplo, agregándole el id del contenedor adelante.</p>,
          edit: ['css'],
          starter: {
            html: '<div id="noticias">\n  <p>Se viene la feria de ciencias.</p>\n  <p class="urgente">¡Hoy cierra la inscripción!</p>\n  <p>Nuevo horario de biblioteca.</p>\n</div>\n<p>Este párrafo está afuera.</p>\n',
            css: 'p {\n  color: gray;\n}\n#noticias p {\n  color: black;\n}\n.urgente {\n  color: red;\n}\n',
          },
          solution: {
            html: '<div id="noticias">\n  <p>Se viene la feria de ciencias.</p>\n  <p class="urgente">¡Hoy cierra la inscripción!</p>\n  <p>Nuevo horario de biblioteca.</p>\n</div>\n<p>Este párrafo está afuera.</p>\n',
            css: 'p {\n  color: gray;\n}\n#noticias p {\n  color: black;\n}\n#noticias .urgente {\n  color: red;\n}\n',
          },
          tests: [
            { text: 'El párrafo urgente se ve rojo', test: (c) => c.style('.urgente', 'color') === 'rgb(255, 0, 0)' },
            { text: 'Los otros párrafos de noticias siguen negros', test: (c) => c.$$('#noticias p:not(.urgente)').every((p) => c.win.getComputedStyle(p).color === 'rgb(0, 0, 0)') },
            { text: 'El párrafo de afuera sigue gris', test: (c) => c.style('body > p', 'color') === 'rgb(128, 128, 128)' },
            { text: 'No se usa !important', test: (c) => !/!\s*important/i.test(cssOnly(c.css)) },
          ],
        },
      ],
    },

    /* ================================================================ 2. COLORES Y TEXTO */
    {
      id: 'css-texto',
      title: 'Colores y texto',
      desc: 'Formas de escribir colores, tipos de letra, tamaños y alineación.',
      lessons: [
        {
          id: 'css-colores',
          kind: 'web',
          title: 'Nombres, hexadecimal y rgb',
          intro: (
            <>
              <p>Un color se puede escribir de varias formas:</p>
              <ul>
                <li>
                  <b>Nombre</b>: <code>red</code>, <code>navy</code>, <code>gold</code>… (hay unos 140).
                </li>
                <li>
                  <b>Hexadecimal</b>: <code>#</code> y seis dígitos (rojo, verde, azul de <code>00</code> a <code>ff</code>):{' '}
                  <code>#ff0000</code> es rojo.
                </li>
                <li>
                  <b>rgb</b>: tres números de 0 a 255: <code>rgb(255, 0, 0)</code> también es rojo.
                </li>
              </ul>
              <pre>
                <code>{'body {\n  background-color: #e0f2fe;\n}\nh1 {\n  color: rgb(3, 105, 161);\n}'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              Poné el fondo del <code>body</code> en <code>#fef3c7</code>, el <code>h1</code> en <code>#b91c1c</code> y el <code>p</code> en{' '}
              <code>rgb(30, 64, 175)</code>.
            </p>
          ),
          hint: <p>Son tres reglas: body, h1 y p. El body lleva background-color; los otros dos, color.</p>,
          edit: ['css'],
          starter: { html: '<h1>Instituto Técnico</h1>\n<p>Formando técnicos en Córdoba.</p>\n', css: '' },
          solution: {
            html: '<h1>Instituto Técnico</h1>\n<p>Formando técnicos en Córdoba.</p>\n',
            css: 'body {\n  background-color: #fef3c7;\n}\nh1 {\n  color: #b91c1c;\n}\np {\n  color: rgb(30, 64, 175);\n}\n',
          },
          tests: [
            { text: 'El fondo de la página es #fef3c7', test: (c) => c.style('body', 'background-color') === 'rgb(254, 243, 199)' },
            { text: 'El h1 es #b91c1c', test: (c) => c.style('h1', 'color') === 'rgb(185, 28, 28)' },
            { text: 'El párrafo es rgb(30, 64, 175)', test: (c) => c.style('p', 'color') === 'rgb(30, 64, 175)' },
          ],
        },
        {
          id: 'css-fuentes',
          kind: 'web',
          title: 'Tipo y tamaño de letra',
          intro: (
            <>
              <p>
                <code>font-family</code> elige la letra. Se ponen varias separadas por coma, por si la primera no está instalada; al
                final va una genérica (<code>sans-serif</code>, <code>serif</code> o <code>monospace</code>).
              </p>
              <p>
                <code>font-size</code> es el tamaño. Por ahora usá píxeles (<code>px</code>). El texto normal suele medir 16px.
              </p>
              <pre>
                <code>{'body {\n  font-family: Verdana, sans-serif;\n}\nh1 {\n  font-size: 48px;\n}'}</code>
              </pre>
              <p>
                Si le ponés la letra al <code>body</code>, la <b>heredan</b> todos los elementos de adentro.
              </p>
            </>
          ),
          task: (
            <p>
              Poné al <code>body</code> la letra <code>Arial, sans-serif</code>. Hacé el <code>h1</code> de <code>40px</code> y los párrafos
              de <code>18px</code>.
            </p>
          ),
          hint: <p>La letra va en body (así la heredan todos); los tamaños, en reglas para h1 y para p.</p>,
          edit: ['css'],
          starter: { html: '<h1>Club de lectura</h1>\n<p>Nos juntamos los martes en la biblioteca.</p>\n<p>Este mes: "El Eternauta".</p>\n', css: '' },
          solution: {
            html: '<h1>Club de lectura</h1>\n<p>Nos juntamos los martes en la biblioteca.</p>\n<p>Este mes: "El Eternauta".</p>\n',
            css: 'body {\n  font-family: Arial, sans-serif;\n}\nh1 {\n  font-size: 40px;\n}\np {\n  font-size: 18px;\n}\n',
          },
          tests: [
            { text: 'Los párrafos usan Arial (heredada del body)', test: (c) => /^"?arial"?\s*,\s*sans-serif$/i.test(c.style('p', 'font-family')) && /arial/i.test(c.style('body', 'font-family')) },
            { text: 'El h1 mide 40px', test: (c) => c.style('h1', 'font-size') === '40px' },
            { text: 'Los párrafos miden 18px', test: (c) => c.$$('p').every((p) => c.win.getComputedStyle(p).fontSize === '18px') },
          ],
        },
        {
          id: 'css-alineacion',
          kind: 'web',
          title: 'Negrita, alineación e interlineado',
          intro: (
            <>
              <ul>
                <li>
                  <code>font-weight</code>: el grosor. <code>bold</code> (o <code>700</code>) es negrita; <code>normal</code> (o{' '}
                  <code>400</code>) es lo común.
                </li>
                <li>
                  <code>text-align</code>: <code>left</code>, <code>center</code>, <code>right</code> o <code>justify</code>.
                </li>
                <li>
                  <code>line-height</code>: el espacio entre líneas. Un número sin unidad multiplica el tamaño de letra:{' '}
                  <code>1.5</code> es una vez y media.
                </li>
              </ul>
              <pre>
                <code>{'h2 {\n  text-align: right;\n}\n.precio {\n  font-weight: bold;\n}\np {\n  line-height: 2;\n}'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              Centrá el <code>h1</code>, poné en negrita los elementos con clase <code>precio</code> y dale a los párrafos un{' '}
              <code>line-height</code> de <code>1.6</code>.
            </p>
          ),
          hint: <p>Son tres propiedades distintas en tres reglas: h1, .precio y p.</p>,
          edit: ['css'],
          starter: {
            html: '<h1>Menú del buffet</h1>\n<p>Tostado de jamón y queso: <span class="precio">$2500</span>. Viene con una bebida chica a elección y se puede pedir en pan árabe o pan de miga.</p>\n<p>Medialunas: <span class="precio">$500</span> cada una.</p>\n',
            css: '',
          },
          solution: {
            html: '<h1>Menú del buffet</h1>\n<p>Tostado de jamón y queso: <span class="precio">$2500</span>. Viene con una bebida chica a elección y se puede pedir en pan árabe o pan de miga.</p>\n<p>Medialunas: <span class="precio">$500</span> cada una.</p>\n',
            css: 'h1 {\n  text-align: center;\n}\n.precio {\n  font-weight: bold;\n}\np {\n  line-height: 1.6;\n}\n',
          },
          tests: [
            { text: 'El h1 está centrado', test: (c) => c.style('h1', 'text-align') === 'center' },
            { text: 'Los precios están en negrita', test: (c) => c.$$('.precio').every((p) => Number(c.win.getComputedStyle(p).fontWeight) >= 700) },
            { text: 'Los párrafos tienen interlineado de 1.6', test: (c) => near(px(c.style('p', 'line-height')) / px(c.style('p', 'font-size')), 1.6, 0.02) },
            { text: 'Los párrafos siguen alineados a la izquierda', test: (c) => ['start', 'left'].includes(c.style('p', 'text-align')) },
          ],
        },
        {
          id: 'css-decoracion',
          kind: 'web',
          title: 'Subrayado y mayúsculas',
          intro: (
            <>
              <ul>
                <li>
                  <code>text-decoration</code>: <code>underline</code> (subrayado), <code>line-through</code> (tachado) o{' '}
                  <code>none</code> (nada). Muy usado para sacarle el subrayado a los links.
                </li>
                <li>
                  <code>text-transform</code>: <code>uppercase</code> (todo en mayúsculas), <code>lowercase</code> o{' '}
                  <code>capitalize</code>.
                </li>
              </ul>
              <pre>
                <code>{'a {\n  text-decoration: none;\n}\nh3 {\n  text-transform: uppercase;\n}'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              Sacale el subrayado a todos los links, pero hacé que el link con clase <code>activo</code> sí esté subrayado. Además,
              poné el <code>h2</code> en mayúsculas con <code>text-transform</code> (sin cambiar el HTML).
            </p>
          ),
          hint: <p>Una regla para a con none y otra más abajo para .activo con underline.</p>,
          edit: ['css'],
          starter: {
            html: '<nav>\n  <a href="#">Inicio</a>\n  <a href="#" class="activo">Horarios</a>\n  <a href="#">Contacto</a>\n</nav>\n<h2>Horarios de cursado</h2>\n',
            css: '',
          },
          solution: {
            html: '<nav>\n  <a href="#">Inicio</a>\n  <a href="#" class="activo">Horarios</a>\n  <a href="#">Contacto</a>\n</nav>\n<h2>Horarios de cursado</h2>\n',
            css: 'a {\n  text-decoration: none;\n}\n.activo {\n  text-decoration: underline;\n}\nh2 {\n  text-transform: uppercase;\n}\n',
          },
          tests: [
            { text: 'Los links comunes no están subrayados', test: (c) => c.$$('a:not(.activo)').every((a) => c.win.getComputedStyle(a).textDecorationLine === 'none') },
            { text: 'El link .activo está subrayado', test: (c) => c.style('.activo', 'text-decoration-line') === 'underline' },
            { text: 'El h2 se ve en mayúsculas', test: (c) => c.style('h2', 'text-transform') === 'uppercase' },
            { text: 'El HTML del h2 no cambió', test: (c) => c.text('h2') === 'Horarios de cursado' },
          ],
        },
        {
          id: 'css-proyecto-afiche',
          kind: 'web',
          title: 'Mini-proyecto: Afiche del torneo',
          intro: (
            <>
              <p>
                🛠 <b>Mini-proyecto.</b> El centro de estudiantes organiza un torneo intercolegial de fútbol 5. El HTML del afiche ya
                está; diseñalo con colores y letras para que llame la atención.
              </p>
              <p>Podés elegir los colores que quieras: probá con hexadecimales y rgb.</p>
            </>
          ),
          task: (
            <>
              <p>Requisitos del diseño:</p>
              <ul>
                <li>
                  El <code>.afiche</code> tiene un color de fondo (que no sea blanco) y su texto no es negro.
                </li>
                <li>
                  El <code>h1</code> está centrado, en mayúsculas y mide al menos <code>36px</code>.
                </li>
                <li>
                  La <code>.fecha</code> está en negrita.
                </li>
                <li>
                  Se usa una <code>font-family</code> que termina en <code>sans-serif</code>.
                </li>
                <li>
                  El link de inscripción no está subrayado.
                </li>
              </ul>
            </>
          ),
          edit: ['css'],
          starter: {
            html: '<div class="afiche">\n  <h1>Torneo intercolegial</h1>\n  <p class="fecha">Sábado 14 de noviembre · 9 hs</p>\n  <p>Cancha del club Barrio Jardín</p>\n  <p>Equipos de 5 + 2 suplentes. ¡Traé tu equipo!</p>\n  <p><a href="#">Inscribite acá</a></p>\n</div>\n',
            css: '',
          },
          solution: {
            html: '<div class="afiche">\n  <h1>Torneo intercolegial</h1>\n  <p class="fecha">Sábado 14 de noviembre · 9 hs</p>\n  <p>Cancha del club Barrio Jardín</p>\n  <p>Equipos de 5 + 2 suplentes. ¡Traé tu equipo!</p>\n  <p><a href="#">Inscribite acá</a></p>\n</div>\n',
            css: '.afiche {\n  background-color: #14532d;\n  color: #f0fdf4;\n  font-family: Verdana, sans-serif;\n}\nh1 {\n  text-align: center;\n  text-transform: uppercase;\n  font-size: 40px;\n  color: #facc15;\n}\n.fecha {\n  font-weight: bold;\n}\na {\n  color: #facc15;\n  text-decoration: none;\n}\n',
          },
          tests: [
            { text: 'El afiche tiene fondo de color (no blanco)', test: (c) => { const b = c.style('.afiche', 'background-color'); return !clear(b) && b !== 'rgb(255, 255, 255)' } },
            { text: 'El texto del afiche no es negro', test: (c) => c.style('.afiche p', 'color') !== 'rgb(0, 0, 0)' },
            { text: 'El h1 está centrado, en mayúsculas y mide 36px o más', test: (c) => c.style('h1', 'text-align') === 'center' && c.style('h1', 'text-transform') === 'uppercase' && px(c.style('h1', 'font-size')) >= 36 },
            { text: 'La fecha está en negrita', test: (c) => Number(c.style('.fecha', 'font-weight')) >= 700 },
            { text: 'La letra termina en sans-serif', test: (c) => /sans-serif$/.test(c.style('.afiche p', 'font-family')) },
            { text: 'El link no está subrayado', test: (c) => c.style('.afiche a', 'text-decoration-line') === 'none' },
          ],
        },
      ],
    },

    /* ================================================================ 3. MODELO DE CAJA */
    {
      id: 'css-caja',
      title: 'Modelo de caja',
      desc: 'Todo elemento es una caja: ancho, alto, relleno, borde y margen.',
      lessons: [
        {
          id: 'css-ancho-alto',
          kind: 'web',
          title: 'Ancho y alto',
          intro: (
            <>
              <p>
                Cada elemento es una <b>caja</b>. Con <code>width</code> y <code>height</code> se elige su ancho y su alto:
              </p>
              <pre>
                <code>{'.pizarron {\n  width: 400px;\n  height: 200px;\n  background-color: darkgreen;\n}'}</code>
              </pre>
              <p>
                Un <code>div</code> sin ancho ocupa todo el ancho disponible, y su alto depende de lo que tenga adentro.
              </p>
            </>
          ),
          task: (
            <p>
              Hacé que la <code>.cancha</code> mida <code>300px</code> de ancho y <code>150px</code> de alto, con fondo <code>green</code>.
            </p>
          ),
          hint: <p>Tres propiedades en la regla .cancha: width, height y background-color.</p>,
          edit: ['css'],
          starter: { html: '<div class="cancha"></div>\n<p>Cancha de fútbol 5 (vista de arriba).</p>\n', css: '' },
          solution: {
            html: '<div class="cancha"></div>\n<p>Cancha de fútbol 5 (vista de arriba).</p>\n',
            css: '.cancha {\n  width: 300px;\n  height: 150px;\n  background-color: green;\n}\n',
          },
          tests: [
            { text: 'La cancha mide 300px de ancho', test: (c) => c.style('.cancha', 'width') === '300px' },
            { text: 'La cancha mide 150px de alto', test: (c) => c.style('.cancha', 'height') === '150px' },
            { text: 'La cancha es verde', test: (c) => c.style('.cancha', 'background-color') === 'rgb(0, 128, 0)' },
          ],
        },
        {
          id: 'css-padding',
          kind: 'web',
          title: 'Relleno: padding',
          intro: (
            <>
              <p>
                <code>padding</code> es el espacio <b>de adentro</b>, entre el contenido y el borde. Se puede escribir con 1, 2 o 4
                valores:
              </p>
              <pre>
                <code>{'padding: 10px;              /* los 4 lados */\npadding: 10px 30px;         /* arriba/abajo  izquierda/derecha */\npadding: 5px 10px 15px 20px; /* arriba derecha abajo izquierda (como el reloj) */'}</code>
              </pre>
              <p>
                También existen <code>padding-top</code>, <code>padding-left</code>, etc.
              </p>
            </>
          ),
          task: (
            <p>
              Dale al <code>.boton</code> un relleno de <code>10px</code> arriba y abajo y <code>24px</code> a los costados.
            </p>
          ),
          hint: <p>Con dos valores alcanza: primero el vertical y después el horizontal.</p>,
          edit: ['css'],
          starter: {
            html: '<a class="boton" href="#">Inscribirme</a>\n',
            css: '.boton {\n  display: inline-block;\n  background-color: #2563eb;\n  color: white;\n  text-decoration: none;\n}\n',
          },
          solution: {
            html: '<a class="boton" href="#">Inscribirme</a>\n',
            css: '.boton {\n  display: inline-block;\n  background-color: #2563eb;\n  color: white;\n  text-decoration: none;\n  padding: 10px 24px;\n}\n',
          },
          tests: [
            { text: 'Relleno de 10px arriba y abajo', test: (c) => c.style('.boton', 'padding-top') === '10px' && c.style('.boton', 'padding-bottom') === '10px' },
            { text: 'Relleno de 24px a izquierda y derecha', test: (c) => c.style('.boton', 'padding-left') === '24px' && c.style('.boton', 'padding-right') === '24px' },
            { text: 'El botón sigue siendo azul', test: (c) => c.style('.boton', 'background-color') === 'rgb(37, 99, 235)' },
          ],
        },
        {
          id: 'css-borde',
          kind: 'web',
          title: 'Bordes y esquinas redondeadas',
          intro: (
            <>
              <p>
                <code>border</code> tiene tres partes: grosor, estilo (<code>solid</code>, <code>dashed</code>, <code>dotted</code>) y
                color. <code>border-radius</code> redondea las esquinas.
              </p>
              <pre>
                <code>{'.foto {\n  border: 3px dashed orange;\n  border-radius: 20px;\n}'}</code>
              </pre>
              <p>
                Con <code>border-radius: 50%</code> en una caja cuadrada se hace un círculo.
              </p>
            </>
          ),
          task: (
            <p>
              Ponele a la <code>.tarjeta</code> un borde <code>2px solid #2563eb</code> y esquinas redondeadas de <code>12px</code>.
            </p>
          ),
          hint: <p>border lleva los tres valores separados por espacios, sin comas.</p>,
          edit: ['css'],
          starter: {
            html: '<div class="tarjeta">\n  <h3>Credencial de estudiante</h3>\n  <p>Valentina Sosa · 3ro A</p>\n</div>\n',
            css: '.tarjeta {\n  width: 260px;\n  padding: 12px;\n}\n',
          },
          solution: {
            html: '<div class="tarjeta">\n  <h3>Credencial de estudiante</h3>\n  <p>Valentina Sosa · 3ro A</p>\n</div>\n',
            css: '.tarjeta {\n  width: 260px;\n  padding: 12px;\n  border: 2px solid #2563eb;\n  border-radius: 12px;\n}\n',
          },
          tests: [
            { text: 'El borde es de 2px en los cuatro lados', test: (c) => ['top', 'right', 'bottom', 'left'].every((s) => c.style('.tarjeta', `border-${s}-width`) === '2px') },
            { text: 'El borde es sólido (solid)', test: (c) => c.style('.tarjeta', 'border-top-style') === 'solid' },
            { text: 'El borde es de color #2563eb', test: (c) => c.style('.tarjeta', 'border-left-color') === 'rgb(37, 99, 235)' },
            { text: 'Las esquinas tienen 12px de radio', test: (c) => c.style('.tarjeta', 'border-top-left-radius') === '12px' && c.style('.tarjeta', 'border-bottom-right-radius') === '12px' },
          ],
        },
        {
          id: 'css-margin',
          kind: 'web',
          title: 'Margen y centrar una caja',
          intro: (
            <>
              <p>
                <code>margin</code> es el espacio <b>de afuera</b>: separa la caja de las demás. Se escribe igual que el padding.
              </p>
              <p>
                Truco: una caja con ancho fijo y <code>margin: 0 auto</code> queda <b>centrada</b> (el navegador reparte el espacio
                sobrante a los costados).
              </p>
              <pre>
                <code>{'.contenido {\n  width: 600px;\n  margin: 0 auto;\n}'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              Separá cada <code>.fila</code> de la siguiente con un margen de abajo de <code>20px</code> y centrá horizontalmente la caja{' '}
              <code>.centro</code> (ya tiene ancho).
            </p>
          ),
          hint: <p>margin-bottom para las filas; margin con auto a los costados para el centro.</p>,
          edit: ['css'],
          starter: {
            html: '<div class="fila">1° Talleres</div>\n<div class="fila">2° Belgrano</div>\n<div class="fila">3° Instituto</div>\n<div class="centro">Tabla de posiciones</div>\n',
            css: '.fila {\n  background-color: #e0e7ff;\n  padding: 8px;\n}\n.centro {\n  width: 200px;\n  background-color: #fde68a;\n  text-align: center;\n}\n',
          },
          solution: {
            html: '<div class="fila">1° Talleres</div>\n<div class="fila">2° Belgrano</div>\n<div class="fila">3° Instituto</div>\n<div class="centro">Tabla de posiciones</div>\n',
            css: '.fila {\n  background-color: #e0e7ff;\n  padding: 8px;\n  margin-bottom: 20px;\n}\n.centro {\n  width: 200px;\n  background-color: #fde68a;\n  text-align: center;\n  margin: 0 auto;\n}\n',
          },
          tests: [
            { text: 'Las filas tienen 20px de margen abajo', test: (c) => c.$$('.fila').every((f) => c.win.getComputedStyle(f).marginBottom === '20px') },
            { text: 'Entre fila y fila se ven 20px de separación', test: (c) => { const b = boxes(c, '.fila'); return b.length === 3 && near(b[1].top - b[0].bottom, 20) } },
            { text: 'La caja .centro está centrada', test: (c) => { const b = box(c, '.centro'); const w = c.doc.body.getBoundingClientRect(); return !!b && b.left > w.left + 1 && near(b.left - w.left, w.right - b.right) } },
          ],
        },
        {
          id: 'css-box-sizing',
          kind: 'web',
          title: 'box-sizing: cuánto mide de verdad',
          intro: (
            <>
              <p>
                Por defecto, <code>width</code> es solo el ancho del <b>contenido</b>. El padding y el borde se suman afuera: una caja de{' '}
                <code>200px</code> con <code>20px</code> de padding y <code>5px</code> de borde mide en total 200 + 40 + 10 ={' '}
                <b>250px</b>.
              </p>
              <p>
                Con <code>box-sizing: border-box</code> el ancho incluye padding y borde: la caja mide exactamente lo que dice{' '}
                <code>width</code>. Por eso muchas páginas empiezan con:
              </p>
              <pre>
                <code>{'* {\n  box-sizing: border-box;\n}'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              La <code>.caja</code> debería medir <code>200px</code> en total, pero mide 250px. Arreglalo con <code>box-sizing</code> sin
              cambiar el width, el padding ni el borde.
            </p>
          ),
          hint: <p>Agregá box-sizing a la regla de .caja (o a todos con el selector *).</p>,
          edit: ['css'],
          starter: {
            html: '<div class="regla">200px</div>\n<div class="caja">Soy una caja</div>\n',
            css: '.regla {\n  width: 200px;\n  background: #fca5a5;\n  font-size: 12px;\n}\n.caja {\n  width: 200px;\n  padding: 20px;\n  border: 5px solid #334155;\n}\n',
          },
          solution: {
            html: '<div class="regla">200px</div>\n<div class="caja">Soy una caja</div>\n',
            css: '.regla {\n  width: 200px;\n  background: #fca5a5;\n  font-size: 12px;\n}\n.caja {\n  box-sizing: border-box;\n  width: 200px;\n  padding: 20px;\n  border: 5px solid #334155;\n}\n',
          },
          tests: [
            { text: 'La caja usa box-sizing: border-box', test: (c) => c.style('.caja', 'box-sizing') === 'border-box' },
            { text: 'La caja mide 200px en total (igual que la regla roja)', test: (c) => (c.$('.caja') as HTMLElement | null)?.offsetWidth === 200 },
            { text: 'El padding sigue siendo 20px y el borde 5px', test: (c) => c.style('.caja', 'padding-left') === '20px' && c.style('.caja', 'border-left-width') === '5px' },
          ],
        },
        {
          id: 'css-proyecto-jugador',
          kind: 'web',
          title: 'Mini-proyecto: Tarjeta de jugador',
          intro: (
            <>
              <p>
                🛠 <b>Mini-proyecto.</b> Diseñá la tarjeta de un jugador del equipo de la escuela, como las figuritas. Una propiedad nueva:{' '}
                <code>box-shadow</code> le pone sombra a una caja:
              </p>
              <pre>
                <code>{'box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);\n/*  x   y  difuminado  color (con transparencia) */'}</code>
              </pre>
            </>
          ),
          task: (
            <>
              <p>La tarjeta (<code>.jugador</code>) tiene que:</p>
              <ul>
                <li>
                  Medir <code>220px</code> de ancho <b>en total</b> (contando padding y borde) y estar centrada en la página.
                </li>
                <li>Tener padding de al menos 12px, un borde visible y esquinas redondeadas (10px o más).</li>
                <li>Tener sombra y un color de fondo.</li>
                <li>
                  Mostrar el <code>.numero</code> en grande (al menos 48px) y centrado.
                </li>
              </ul>
            </>
          ),
          edit: ['css'],
          starter: { html: CARD_HTML, css: '' },
          solution: {
            html: CARD_HTML,
            css: '* {\n  box-sizing: border-box;\n}\n.jugador {\n  width: 220px;\n  margin: 20px auto;\n  padding: 16px;\n  border: 4px solid #facc15;\n  border-radius: 14px;\n  background-color: #1e3a8a;\n  color: white;\n  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.35);\n  font-family: Arial, sans-serif;\n}\n.numero {\n  font-size: 56px;\n  text-align: center;\n  font-weight: bold;\n  margin: 0;\n}\n',
          },
          tests: [
            { text: 'Mide 220px de ancho en total', test: (c) => (c.$('.jugador') as HTMLElement | null)?.offsetWidth === 220 },
            { text: 'Está centrada en la página', test: (c) => { const b = box(c, '.jugador'); const w = c.doc.body.getBoundingClientRect(); return !!b && b.left > w.left + 1 && near(b.left - w.left, w.right - b.right) } },
            { text: 'Padding de 12px o más y borde visible', test: (c) => px(c.style('.jugador', 'padding-left')) >= 12 && px(c.style('.jugador', 'border-top-width')) > 0 && c.style('.jugador', 'border-top-style') !== 'none' },
            { text: 'Esquinas redondeadas de 10px o más', test: (c) => px(c.style('.jugador', 'border-top-left-radius')) >= 10 },
            { text: 'Tiene sombra y color de fondo', test: (c) => c.style('.jugador', 'box-shadow') !== 'none' && !clear(c.style('.jugador', 'background-color')) },
            { text: 'El número mide 48px o más y está centrado', test: (c) => px(c.style('.numero', 'font-size')) >= 48 && c.style('.numero', 'text-align') === 'center' },
          ],
        },
      ],
    },

    /* ================================================================ 4. DISPLAY Y POSICIÓN */
    {
      id: 'css-display',
      title: 'Display y posición',
      desc: 'Elementos en bloque o en línea, ocultar cosas y ubicar una caja encima de otra.',
      lessons: [
        {
          id: 'css-display-tipos',
          kind: 'web',
          title: 'block, inline, inline-block y none',
          intro: (
            <>
              <p>
                La propiedad <code>display</code> decide cómo se acomoda una caja:
              </p>
              <ul>
                <li>
                  <code>block</code>: ocupa todo el ancho y empieza en una línea nueva (<code>div</code>, <code>p</code>, <code>h1</code>).
                </li>
                <li>
                  <code>inline</code>: va dentro del texto, sin cortar la línea; <b>no</b> acepta width ni height (<code>a</code>,{' '}
                  <code>span</code>, <code>strong</code>).
                </li>
                <li>
                  <code>inline-block</code>: va en línea pero sí acepta width, height y padding vertical.
                </li>
                <li>
                  <code>none</code>: el elemento desaparece, no ocupa lugar.
                </li>
              </ul>
              <pre>
                <code>{'.menu a { display: block; }\n.oculto { display: none; }'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              Hacé que los links de <code>.menu</code> queden uno debajo del otro (<code>block</code>), que cada <code>.etiqueta</code> sea{' '}
              <code>inline-block</code> con <code>width: 90px</code>, y que el párrafo <code>.secreto</code> no se muestre.
            </p>
          ),
          hint: <p>Necesitás tres reglas, cada una con un display distinto.</p>,
          edit: ['css'],
          starter: {
            html: '<nav class="menu">\n  <a href="#">Inicio</a>\n  <a href="#">Materias</a>\n  <a href="#">Profes</a>\n</nav>\n<p>\n  <span class="etiqueta">HTML</span>\n  <span class="etiqueta">CSS</span>\n  <span class="etiqueta">Java</span>\n</p>\n<p class="secreto">Respuestas de la prueba: …</p>\n',
            css: '.etiqueta {\n  background-color: #ddd6fe;\n  text-align: center;\n}\n',
          },
          solution: {
            html: '<nav class="menu">\n  <a href="#">Inicio</a>\n  <a href="#">Materias</a>\n  <a href="#">Profes</a>\n</nav>\n<p>\n  <span class="etiqueta">HTML</span>\n  <span class="etiqueta">CSS</span>\n  <span class="etiqueta">Java</span>\n</p>\n<p class="secreto">Respuestas de la prueba: …</p>\n',
            css: '.etiqueta {\n  background-color: #ddd6fe;\n  text-align: center;\n  display: inline-block;\n  width: 90px;\n}\n.menu a {\n  display: block;\n}\n.secreto {\n  display: none;\n}\n',
          },
          tests: [
            { text: 'Los links del menú son block (uno debajo del otro)', test: (c) => { const b = boxes(c, '.menu a'); return c.style('.menu a', 'display') === 'block' && b.length === 3 && b[1].top >= b[0].bottom - 1 } },
            { text: 'Las etiquetas son inline-block', test: (c) => c.$$('.etiqueta').every((e) => c.win.getComputedStyle(e).display === 'inline-block') },
            { text: 'Las etiquetas miden 90px de ancho y siguen en la misma línea', test: (c) => { const b = boxes(c, '.etiqueta'); return b.length === 3 && b.every((x) => near(x.width, 90)) && near(b[0].top, b[2].top) } },
            { text: 'El párrafo .secreto no se muestra', test: (c) => c.style('.secreto', 'display') === 'none' },
          ],
        },
        {
          id: 'css-position',
          kind: 'web',
          title: 'position: relative y absolute',
          intro: (
            <>
              <p>
                Con <code>position: absolute</code> un elemento sale del flujo normal y se ubica con <code>top</code>,{' '}
                <code>right</code>, <code>bottom</code> y <code>left</code>, medidos desde el contenedor más cercano que tenga{' '}
                <code>position: relative</code>.
              </p>
              <pre>
                <code>{'.foto {\n  position: relative;\n}\n.sello {\n  position: absolute;\n  top: 10px;\n  left: 10px;\n}'}</code>
              </pre>
              <p>Así se hacen los carteles de &quot;Nuevo&quot; u &quot;Oferta&quot; sobre una tarjeta.</p>
            </>
          ),
          task: (
            <p>
              Ubicá el cartel <code>.nuevo</code> en la <b>esquina de arriba a la derecha</b> de la <code>.producto</code> (pegado al borde:{' '}
              <code>top: 0</code> y <code>right: 0</code>).
            </p>
          ),
          hint: <p>El contenedor necesita position: relative; el cartel, position: absolute y las dos distancias.</p>,
          edit: ['css'],
          starter: {
            html: '<div class="producto">\n  <span class="nuevo">NUEVO</span>\n  <h3>Remera del egresado</h3>\n  <p>Talles S a XL · $15000</p>\n</div>\n',
            css: '.producto {\n  width: 260px;\n  padding: 24px 16px 12px;\n  border: 2px solid #0f172a;\n  border-radius: 10px;\n}\n.nuevo {\n  background-color: #dc2626;\n  color: white;\n  padding: 4px 8px;\n  font-size: 12px;\n}\n',
          },
          solution: {
            html: '<div class="producto">\n  <span class="nuevo">NUEVO</span>\n  <h3>Remera del egresado</h3>\n  <p>Talles S a XL · $15000</p>\n</div>\n',
            css: '.producto {\n  width: 260px;\n  padding: 24px 16px 12px;\n  border: 2px solid #0f172a;\n  border-radius: 10px;\n  position: relative;\n}\n.nuevo {\n  background-color: #dc2626;\n  color: white;\n  padding: 4px 8px;\n  font-size: 12px;\n  position: absolute;\n  top: 0;\n  right: 0;\n}\n',
          },
          tests: [
            { text: 'La .producto tiene position: relative', test: (c) => c.style('.producto', 'position') === 'relative' },
            { text: 'El cartel tiene position: absolute', test: (c) => c.style('.nuevo', 'position') === 'absolute' },
            { text: 'El cartel está arriba a la derecha de la tarjeta', test: (c) => { const p = c.$('.producto') as HTMLElement | null; const n = box(c, '.nuevo'); if (!p || !n) return false; const r = p.getBoundingClientRect(); return near(n.top, r.top + p.clientTop) && near(n.right, r.right - (p.offsetWidth - p.clientWidth - p.clientLeft)) } },
          ],
        },
      ],
    },

    /* ================================================================ 5. FLEXBOX */
    {
      id: 'css-flex',
      title: 'Flexbox',
      desc: 'Acomodar elementos en fila o columna, repartir el espacio y centrar.',
      lessons: [
        {
          id: 'css-flex-intro',
          kind: 'web',
          title: 'display: flex',
          intro: (
            <>
              <p>
                <b>Flexbox</b> sirve para acomodar elementos en una fila (o columna). Se pone <code>display: flex</code> en el{' '}
                <b>contenedor</b> y sus hijos directos se ponen uno al lado del otro.
              </p>
              <pre>
                <code>{'.fila {\n  display: flex;\n}'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              Hacé que las tres <code>.caja</code> queden <b>una al lado de la otra</b> usando flexbox en <code>.fila</code>.
            </p>
          ),
          hint: <p>El display: flex va en el padre (.fila), no en las cajas.</p>,
          edit: ['css'],
          starter: {
            html: '<div class="fila">\n  <div class="caja">Fútbol</div>\n  <div class="caja">Vóley</div>\n  <div class="caja">Handball</div>\n</div>\n',
            css: '.caja {\n  width: 100px;\n  padding: 16px;\n  margin: 4px;\n  background-color: #bbf7d0;\n  text-align: center;\n}\n',
          },
          solution: {
            html: '<div class="fila">\n  <div class="caja">Fútbol</div>\n  <div class="caja">Vóley</div>\n  <div class="caja">Handball</div>\n</div>\n',
            css: '.fila {\n  display: flex;\n}\n.caja {\n  width: 100px;\n  padding: 16px;\n  margin: 4px;\n  background-color: #bbf7d0;\n  text-align: center;\n}\n',
          },
          tests: [
            { text: '.fila tiene display: flex', test: (c) => c.style('.fila', 'display') === 'flex' },
            { text: 'Las tres cajas están a la misma altura', test: (c) => { const b = boxes(c, '.caja'); return b.length === 3 && near(b[0].top, b[1].top) && near(b[1].top, b[2].top) } },
            { text: 'Están en orden de izquierda a derecha', test: (c) => { const b = boxes(c, '.caja'); return b.length === 3 && b[0].right <= b[1].left + 1 && b[1].right <= b[2].left + 1 } },
          ],
        },
        {
          id: 'css-justify',
          kind: 'web',
          title: 'justify-content: repartir en la fila',
          intro: (
            <>
              <p>
                <code>justify-content</code> reparte los elementos a lo largo de la fila:
              </p>
              <ul>
                <li>
                  <code>flex-start</code> (al principio, es lo normal), <code>center</code>, <code>flex-end</code>
                </li>
                <li>
                  <code>space-between</code>: el primero pegado a la izquierda, el último a la derecha y el resto repartido.
                </li>
                <li>
                  <code>space-around</code> / <code>space-evenly</code>: espacio también en los extremos.
                </li>
              </ul>
              <pre>
                <code>{'.botones {\n  display: flex;\n  justify-content: center;\n}'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              En el marcador, hacé que el equipo local quede a la izquierda, el visitante a la derecha y el resultado en el medio,
              usando <code>space-between</code>.
            </p>
          ),
          hint: <p>Agregá justify-content al contenedor que ya tiene display: flex.</p>,
          edit: ['css'],
          starter: {
            html: '<div class="marcador">\n  <div class="equipo">Talleres</div>\n  <div class="resultado">2 - 1</div>\n  <div class="equipo">Belgrano</div>\n</div>\n',
            css: '.marcador {\n  display: flex;\n  background-color: #0f172a;\n  color: white;\n  padding: 12px;\n  font-size: 20px;\n}\n.resultado {\n  color: #facc15;\n  font-weight: bold;\n}\n',
          },
          solution: {
            html: '<div class="marcador">\n  <div class="equipo">Talleres</div>\n  <div class="resultado">2 - 1</div>\n  <div class="equipo">Belgrano</div>\n</div>\n',
            css: '.marcador {\n  display: flex;\n  justify-content: space-between;\n  background-color: #0f172a;\n  color: white;\n  padding: 12px;\n  font-size: 20px;\n}\n.resultado {\n  color: #facc15;\n  font-weight: bold;\n}\n',
          },
          tests: [
            { text: 'El marcador usa justify-content: space-between', test: (c) => c.style('.marcador', 'justify-content') === 'space-between' },
            { text: 'El visitante está pegado a la derecha', test: (c) => { const m = c.$('.marcador') as HTMLElement | null; const b = boxes(c, '.marcador > div'); if (!m || b.length !== 3) return false; return near(b[2].right, m.getBoundingClientRect().right - 12) } },
            { text: 'El marcador sigue siendo flex', test: (c) => c.style('.marcador', 'display') === 'flex' },
          ],
        },
        {
          id: 'css-align-gap',
          kind: 'web',
          title: 'align-items y gap',
          intro: (
            <>
              <ul>
                <li>
                  <code>align-items</code> acomoda los elementos en la otra dirección (en una fila, de arriba a abajo):{' '}
                  <code>flex-start</code>, <code>center</code>, <code>flex-end</code> o <code>stretch</code> (estirar, es lo normal).
                </li>
                <li>
                  <code>gap</code> pone espacio <b>entre</b> los elementos, sin tener que usar márgenes.
                </li>
              </ul>
              <pre>
                <code>{'.barra {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n}'}</code>
              </pre>
              <p>
                El clásico &quot;centrar algo en el medio de una caja&quot; es <code>justify-content: center</code> +{' '}
                <code>align-items: center</code>.
              </p>
            </>
          ),
          task: (
            <p>
              En la <code>.barra</code> (que mide 100px de alto), centrá verticalmente los elementos con <code>align-items</code> y
              separalos con un <code>gap</code> de <code>16px</code>.
            </p>
          ),
          hint: <p>Las dos propiedades van en .barra, junto al display: flex.</p>,
          edit: ['css'],
          starter: {
            html: '<div class="barra">\n  <div class="icono">🎵</div>\n  <div class="tema">Rodrigo – La mano de Dios</div>\n  <button>▶</button>\n</div>\n',
            css: '.barra {\n  display: flex;\n  height: 100px;\n  background-color: #ede9fe;\n  padding: 0 12px;\n}\n.icono {\n  font-size: 40px;\n}\n',
          },
          solution: {
            html: '<div class="barra">\n  <div class="icono">🎵</div>\n  <div class="tema">Rodrigo – La mano de Dios</div>\n  <button>▶</button>\n</div>\n',
            css: '.barra {\n  display: flex;\n  align-items: center;\n  gap: 16px;\n  height: 100px;\n  background-color: #ede9fe;\n  padding: 0 12px;\n}\n.icono {\n  font-size: 40px;\n}\n',
          },
          tests: [
            { text: 'La barra usa align-items: center', test: (c) => c.style('.barra', 'align-items') === 'center' },
            { text: 'El texto del tema está centrado verticalmente', test: (c) => { const b = box(c, '.barra'); const t = box(c, '.tema'); return !!b && !!t && near(t.top + t.height / 2, b.top + b.height / 2, 2) } },
            { text: 'Hay 16px de gap entre los elementos', test: (c) => c.style('.barra', 'column-gap') === '16px' },
            { text: 'Se nota la separación entre el ícono y el tema', test: (c) => { const i = box(c, '.icono'); const t = box(c, '.tema'); return !!i && !!t && near(t.left - i.right, 16) } },
          ],
        },
        {
          id: 'css-direction-wrap',
          kind: 'web',
          title: 'flex-direction y flex-wrap',
          intro: (
            <>
              <ul>
                <li>
                  <code>flex-direction: column</code> pone los elementos en columna (uno debajo del otro). Lo normal es{' '}
                  <code>row</code>.
                </li>
                <li>
                  <code>flex-wrap: wrap</code> deja que los elementos pasen a la línea siguiente cuando no entran. Sin eso, flexbox los
                  aprieta todos en una sola fila.
                </li>
              </ul>
              <pre>
                <code>{'.lateral {\n  display: flex;\n  flex-direction: column;\n}\n.fotos {\n  display: flex;\n  flex-wrap: wrap;\n}'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              Poné los links del <code>.lateral</code> en columna y hacé que las figuritas de <code>.album</code> pasen a otra fila
              cuando no entran (sin achicarse).
            </p>
          ),
          hint: <p>Cada contenedor ya tiene display: flex; a cada uno le falta una propiedad distinta.</p>,
          edit: ['css'],
          starter: {
            html: '<nav class="lateral">\n  <a href="#">Álbum</a>\n  <a href="#">Repetidas</a>\n  <a href="#">Faltantes</a>\n</nav>\n<div class="album">\n  <div class="figu">1</div><div class="figu">2</div><div class="figu">3</div><div class="figu">4</div><div class="figu">5</div><div class="figu">6</div><div class="figu">7</div><div class="figu">8</div>\n</div>\n',
            css: '.lateral {\n  display: flex;\n  gap: 6px;\n  margin-bottom: 12px;\n}\n.album {\n  display: flex;\n  gap: 8px;\n  width: 300px;\n}\n.figu {\n  width: 80px;\n  height: 100px;\n  flex-shrink: 0;\n  background-color: #fef08a;\n  border: 2px solid #ca8a04;\n}\n',
          },
          solution: {
            html: '<nav class="lateral">\n  <a href="#">Álbum</a>\n  <a href="#">Repetidas</a>\n  <a href="#">Faltantes</a>\n</nav>\n<div class="album">\n  <div class="figu">1</div><div class="figu">2</div><div class="figu">3</div><div class="figu">4</div><div class="figu">5</div><div class="figu">6</div><div class="figu">7</div><div class="figu">8</div>\n</div>\n',
            css: '.lateral {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  margin-bottom: 12px;\n}\n.album {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n  width: 300px;\n}\n.figu {\n  width: 80px;\n  height: 100px;\n  flex-shrink: 0;\n  background-color: #fef08a;\n  border: 2px solid #ca8a04;\n}\n',
          },
          tests: [
            { text: 'El lateral usa flex-direction: column', test: (c) => c.style('.lateral', 'flex-direction') === 'column' },
            { text: 'Los links del lateral quedan uno debajo del otro', test: (c) => { const b = boxes(c, '.lateral a'); return b.length === 3 && b[1].top >= b[0].bottom - 1 && b[2].top >= b[1].bottom - 1 } },
            { text: 'El álbum usa flex-wrap: wrap', test: (c) => c.style('.album', 'flex-wrap') === 'wrap' },
            { text: 'Las figuritas no se salen del álbum', test: (c) => { const a = box(c, '.album'); const f = boxes(c, '.figu'); return !!a && f.length === 8 && f.every((x) => x.right <= a.right + 1) } },
          ],
        },
        {
          id: 'css-flex-1',
          kind: 'web',
          title: 'flex: 1 para ocupar el espacio que sobra',
          intro: (
            <>
              <p>
                En un hijo de un contenedor flex, <code>flex: 1</code> significa &quot;crecé y ocupá todo el espacio que sobre&quot;. Si
                varios hijos tienen <code>flex: 1</code>, se reparten el espacio en partes iguales; con <code>flex: 2</code> uno toma el
                doble.
              </p>
              <pre>
                <code>{'.pagina { display: flex; }\n.menu  { width: 150px; }\n.contenido { flex: 1; }'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              El <code>.lateral</code> mide 150px. Hacé que <code>.principal</code> ocupe <b>todo el resto</b> del ancho con{' '}
              <code>flex: 1</code>.
            </p>
          ),
          hint: <p>flex: 1 se pone en el hijo que tiene que crecer, no en el contenedor.</p>,
          edit: ['css'],
          starter: {
            html: '<div class="pagina">\n  <aside class="lateral">Menú</aside>\n  <main class="principal">Contenido de la clase de hoy</main>\n</div>\n',
            css: '.pagina {\n  display: flex;\n  gap: 10px;\n}\n.lateral {\n  width: 150px;\n  background-color: #cbd5e1;\n  padding: 10px;\n}\n.principal {\n  background-color: #e0f2fe;\n  padding: 10px;\n}\n',
          },
          solution: {
            html: '<div class="pagina">\n  <aside class="lateral">Menú</aside>\n  <main class="principal">Contenido de la clase de hoy</main>\n</div>\n',
            css: '.pagina {\n  display: flex;\n  gap: 10px;\n}\n.lateral {\n  width: 150px;\n  background-color: #cbd5e1;\n  padding: 10px;\n}\n.principal {\n  flex: 1;\n  background-color: #e0f2fe;\n  padding: 10px;\n}\n',
          },
          tests: [
            { text: '.principal tiene flex-grow 1 (flex: 1)', test: (c) => c.style('.principal', 'flex-grow') === '1' },
            { text: '.principal llega hasta el borde derecho', test: (c) => { const p = box(c, '.principal'); const g = box(c, '.pagina'); return !!p && !!g && near(p.right, g.right) } },
            { text: 'El lateral sigue midiendo 150px de contenido', test: (c) => c.style('.lateral', 'width') === '150px' },
          ],
        },
        {
          id: 'css-proyecto-nav',
          kind: 'web',
          title: 'Mini-proyecto: Barra de navegación',
          intro: (
            <>
              <p>
                🛠 <b>Mini-proyecto.</b> Casi todas las páginas tienen una barra arriba con el logo a la izquierda y el menú a la
                derecha. Armala con flexbox para la página del club.
              </p>
              <p>Pensá qué elemento es el contenedor en cada caso: la barra contiene al logo y al nav; el nav contiene a los links.</p>
            </>
          ),
          task: (
            <>
              <ul>
                <li>
                  La <code>.barra</code> es flex, con el logo a la izquierda y el <code>nav</code> a la derecha, centrados verticalmente.
                </li>
                <li>
                  La barra tiene un color de fondo y padding.
                </li>
                <li>
                  El <code>nav</code> es flex con un <code>gap</code> de al menos <code>12px</code>.
                </li>
                <li>Los links no están subrayados y son de color blanco.</li>
              </ul>
            </>
          ),
          edit: ['css'],
          starter: { html: NAV_HTML, css: 'body {\n  margin: 0;\n  font-family: Arial, sans-serif;\n}\n' },
          solution: {
            html: NAV_HTML,
            css: 'body {\n  margin: 0;\n  font-family: Arial, sans-serif;\n}\n.barra {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  background-color: #1e3a8a;\n  color: white;\n  padding: 12px 20px;\n}\n.logo {\n  font-weight: bold;\n  font-size: 20px;\n}\nnav {\n  display: flex;\n  gap: 16px;\n}\nnav a {\n  color: white;\n  text-decoration: none;\n}\n',
          },
          tests: [
            { text: 'La barra es flex con space-between', test: (c) => c.style('.barra', 'display') === 'flex' && c.style('.barra', 'justify-content') === 'space-between' },
            { text: 'Los elementos de la barra están centrados verticalmente', test: (c) => c.style('.barra', 'align-items') === 'center' },
            { text: 'La barra tiene fondo de color y padding', test: (c) => !clear(c.style('.barra', 'background-color')) && px(c.style('.barra', 'padding-top')) > 0 },
            { text: 'El nav es flex con gap de 12px o más', test: (c) => c.style('nav', 'display') === 'flex' && px(c.style('nav', 'column-gap')) >= 12 },
            { text: 'Los links son blancos y sin subrayado', test: (c) => c.$$('nav a').every((a) => { const s = c.win.getComputedStyle(a); return s.color === 'rgb(255, 255, 255)' && s.textDecorationLine === 'none' }) },
          ],
        },
      ],
    },

    /* ================================================================ 6. GRID */
    {
      id: 'css-grid',
      title: 'Grid',
      desc: 'Grillas de filas y columnas para galerías y diseños de página.',
      lessons: [
        {
          id: 'css-grid-intro',
          kind: 'web',
          title: 'display: grid y columnas',
          intro: (
            <>
              <p>
                <b>Grid</b> acomoda los elementos en una grilla. En el contenedor se pone <code>display: grid</code> y se definen las
                columnas con <code>grid-template-columns</code>. La unidad <code>fr</code> es &quot;una parte del espacio libre&quot;:
              </p>
              <pre>
                <code>{'.grilla {\n  display: grid;\n  grid-template-columns: 1fr 1fr;  /* dos columnas iguales */\n}'}</code>
              </pre>
              <p>Los elementos se van ubicando solos: llenan una fila y pasan a la siguiente.</p>
            </>
          ),
          task: (
            <p>
              Hacé que <code>.grilla</code> sea una grilla de <b>3 columnas iguales</b> usando <code>fr</code>.
            </p>
          ),
          hint: <p>grid-template-columns lleva un valor por cada columna.</p>,
          edit: ['css'],
          starter: {
            html: '<div class="grilla">\n  <div>Lengua</div><div>Matemática</div><div>Historia</div>\n  <div>Taller</div><div>Física</div><div>Inglés</div>\n</div>\n',
            css: '.grilla div {\n  background-color: #fecaca;\n  padding: 14px;\n  border: 1px solid #b91c1c;\n}\n',
          },
          solution: {
            html: '<div class="grilla">\n  <div>Lengua</div><div>Matemática</div><div>Historia</div>\n  <div>Taller</div><div>Física</div><div>Inglés</div>\n</div>\n',
            css: '.grilla {\n  display: grid;\n  grid-template-columns: 1fr 1fr 1fr;\n}\n.grilla div {\n  background-color: #fecaca;\n  padding: 14px;\n  border: 1px solid #b91c1c;\n}\n',
          },
          tests: [
            { text: '.grilla tiene display: grid', test: (c) => c.style('.grilla', 'display') === 'grid' },
            { text: 'Tiene 3 columnas', test: (c) => tracks(c, '.grilla').length === 3 },
            { text: 'Las 3 columnas son iguales', test: (c) => { const t = tracks(c, '.grilla').map(px); return t.length === 3 && near(t[0], t[1]) && near(t[1], t[2]) } },
            { text: 'Quedan 2 filas de 3 materias', test: (c) => { const b = boxes(c, '.grilla > div'); return b.length === 6 && near(b[0].top, b[2].top) && b[3].top > b[0].top + 5 && near(b[3].left, b[0].left) } },
          ],
        },
        {
          id: 'css-grid-repeat',
          kind: 'web',
          title: 'repeat() y gap',
          intro: (
            <>
              <p>
                Para no escribir <code>1fr</code> muchas veces se usa <code>repeat(cantidad, tamaño)</code>. Y igual que en flexbox,{' '}
                <code>gap</code> separa filas y columnas.
              </p>
              <pre>
                <code>{'.calendario {\n  display: grid;\n  grid-template-columns: repeat(7, 1fr);\n  gap: 4px;\n}'}</code>
              </pre>
              <p>
                También se pueden mezclar: <code>200px 1fr</code> es una columna fija y otra que ocupa el resto.
              </p>
            </>
          ),
          task: (
            <p>
              Armá una grilla de <b>4 columnas iguales</b> usando <code>repeat</code>, con un <code>gap</code> de <code>10px</code>.
            </p>
          ),
          hint: <p>Adentro de repeat van dos cosas separadas por coma: cuántas columnas y de qué tamaño.</p>,
          edit: ['css'],
          starter: {
            html: '<div class="fixture">\n  <div>Fecha 1</div><div>Fecha 2</div><div>Fecha 3</div><div>Fecha 4</div>\n  <div>Fecha 5</div><div>Fecha 6</div><div>Fecha 7</div><div>Fecha 8</div>\n</div>\n',
            css: '.fixture {\n  display: grid;\n}\n.fixture div {\n  background-color: #bae6fd;\n  padding: 12px;\n  text-align: center;\n}\n',
          },
          solution: {
            html: '<div class="fixture">\n  <div>Fecha 1</div><div>Fecha 2</div><div>Fecha 3</div><div>Fecha 4</div>\n  <div>Fecha 5</div><div>Fecha 6</div><div>Fecha 7</div><div>Fecha 8</div>\n</div>\n',
            css: '.fixture {\n  display: grid;\n  grid-template-columns: repeat(4, 1fr);\n  gap: 10px;\n}\n.fixture div {\n  background-color: #bae6fd;\n  padding: 12px;\n  text-align: center;\n}\n',
          },
          tests: [
            { text: 'Se usa repeat() en grid-template-columns', test: (c) => /grid-template-columns\s*:\s*repeat\(/i.test(cssOnly(c.css)) },
            { text: 'Hay 4 columnas iguales', test: (c) => { const t = tracks(c, '.fixture').map(px); return t.length === 4 && t.every((x) => near(x, t[0])) } },
            { text: 'El gap es de 10px entre filas y columnas', test: (c) => c.style('.fixture', 'row-gap') === '10px' && c.style('.fixture', 'column-gap') === '10px' },
          ],
        },
        {
          id: 'css-grid-span',
          kind: 'web',
          title: 'Ocupar varias columnas',
          intro: (
            <>
              <p>
                Un elemento de la grilla puede ocupar más de una celda con <code>grid-column: span N</code> (y{' '}
                <code>grid-row: span N</code> para filas):
              </p>
              <pre>
                <code>{'.portada {\n  grid-column: span 3;  /* ocupa 3 columnas */\n}'}</code>
              </pre>
            </>
          ),
          task: (
            <p>
              En la grilla de noticias (3 columnas), hacé que la noticia <code>.destacada</code> ocupe <b>2 columnas</b>.
            </p>
          ),
          hint: <p>La propiedad va en .destacada, no en la grilla.</p>,
          edit: ['css'],
          starter: {
            html: '<div class="noticias">\n  <article class="destacada">¡Ganamos la Olimpíada de Robótica!</article>\n  <article>Nuevo laboratorio</article>\n  <article>Acto del 20 de junio</article>\n  <article>Torneo de ajedrez</article>\n  <article>Feria del libro</article>\n</div>\n',
            css: '.noticias {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 8px;\n}\narticle {\n  background-color: #e2e8f0;\n  padding: 16px;\n}\n.destacada {\n  background-color: #fbbf24;\n  font-weight: bold;\n}\n',
          },
          solution: {
            html: '<div class="noticias">\n  <article class="destacada">¡Ganamos la Olimpíada de Robótica!</article>\n  <article>Nuevo laboratorio</article>\n  <article>Acto del 20 de junio</article>\n  <article>Torneo de ajedrez</article>\n  <article>Feria del libro</article>\n</div>\n',
            css: '.noticias {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 8px;\n}\narticle {\n  background-color: #e2e8f0;\n  padding: 16px;\n}\n.destacada {\n  background-color: #fbbf24;\n  font-weight: bold;\n  grid-column: span 2;\n}\n',
          },
          tests: [
            { text: 'La destacada ocupa 2 columnas', test: (c) => { const d = box(c, '.destacada'); const o = box(c, 'article:not(.destacada)'); return !!d && !!o && near(d.width, o.width * 2 + 8, 2) } },
            { text: 'Las otras noticias ocupan una columna cada una', test: (c) => { const b = boxes(c, 'article:not(.destacada)'); return b.length === 4 && b.every((x) => near(x.width, b[0].width)) } },
            { text: 'La grilla sigue teniendo 3 columnas', test: (c) => tracks(c, '.noticias').length === 3 },
          ],
        },
        {
          id: 'css-proyecto-galeria',
          kind: 'web',
          title: 'Mini-proyecto: Galería del viaje de estudios',
          intro: (
            <>
              <p>
                🛠 <b>Mini-proyecto.</b> Armá la galería de fotos del viaje de estudios a las sierras. Cada &quot;foto&quot; es una caja
                con un emoji y un epígrafe. Usá grid para la grilla y lo del modelo de caja para que cada foto se vea prolija.
              </p>
            </>
          ),
          task: (
            <>
              <ul>
                <li>
                  <code>.galeria</code> es una grilla de <b>3 columnas iguales</b> con un <code>gap</code> de al menos 8px.
                </li>
                <li>
                  La galería mide como máximo <code>720px</code> (<code>max-width</code>) y está centrada.
                </li>
                <li>
                  Cada <code>.foto</code> tiene fondo, esquinas redondeadas y el texto centrado.
                </li>
                <li>
                  La primera foto (<code>.portada</code>) ocupa las 3 columnas.
                </li>
              </ul>
            </>
          ),
          edit: ['css'],
          starter: {
            html: '<h1>Viaje de estudios 2026</h1>\n<div class="galeria">\n  <div class="foto portada">🏔️<p>Llegando a La Cumbrecita</p></div>\n  <div class="foto">🏞️<p>El río</p></div>\n  <div class="foto">🔥<p>Fogón</p></div>\n  <div class="foto">🥾<p>Trekking</p></div>\n  <div class="foto">🐴<p>Cabalgata</p></div>\n  <div class="foto">⛺<p>Campamento</p></div>\n  <div class="foto">🌄<p>Amanecer</p></div>\n</div>\n',
            css: '.foto {\n  font-size: 40px;\n  padding: 12px;\n}\n.foto p {\n  font-size: 14px;\n  margin: 4px 0 0;\n}\n',
          },
          solution: {
            html: '<h1>Viaje de estudios 2026</h1>\n<div class="galeria">\n  <div class="foto portada">🏔️<p>Llegando a La Cumbrecita</p></div>\n  <div class="foto">🏞️<p>El río</p></div>\n  <div class="foto">🔥<p>Fogón</p></div>\n  <div class="foto">🥾<p>Trekking</p></div>\n  <div class="foto">🐴<p>Cabalgata</p></div>\n  <div class="foto">⛺<p>Campamento</p></div>\n  <div class="foto">🌄<p>Amanecer</p></div>\n</div>\n',
            css: '.galeria {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 10px;\n  max-width: 720px;\n  margin: 0 auto;\n}\n.foto {\n  font-size: 40px;\n  padding: 12px;\n  background-color: #dcfce7;\n  border-radius: 10px;\n  text-align: center;\n}\n.foto p {\n  font-size: 14px;\n  margin: 4px 0 0;\n}\n.portada {\n  grid-column: span 3;\n  background-color: #bbf7d0;\n}\n',
          },
          tests: [
            { text: 'La galería es una grilla de 3 columnas iguales', test: (c) => { const t = tracks(c, '.galeria').map(px); return c.style('.galeria', 'display') === 'grid' && t.length === 3 && near(t[0], t[2]) } },
            { text: 'El gap es de 8px o más', test: (c) => px(c.style('.galeria', 'column-gap')) >= 8 && px(c.style('.galeria', 'row-gap')) >= 8 },
            { text: 'Tiene max-width: 720px y está centrada', test: (c) => { const b = box(c, '.galeria'); const w = c.doc.body.getBoundingClientRect(); return c.style('.galeria', 'max-width') === '720px' && !!b && near(b.left - w.left, w.right - b.right) } },
            { text: 'Las fotos tienen fondo, esquinas redondeadas y texto centrado', test: (c) => c.$$('.foto').every((f) => { const s = c.win.getComputedStyle(f); return !clear(s.backgroundColor) && px(s.borderTopLeftRadius) > 0 && s.textAlign === 'center' }) },
            { text: 'La portada ocupa las 3 columnas', test: (c) => { const p = box(c, '.portada'); const g = c.$('.galeria') as HTMLElement | null; return !!p && !!g && near(p.width, g.clientWidth, 2) } },
          ],
        },
      ],
    },

    /* ================================================================ 7. RESPONSIVE Y PSEUDO-CLASES */
    {
      id: 'css-responsive',
      title: 'Pseudo-clases y responsive',
      desc: 'Estilos al pasar el mouse, para ciertos hijos, y diseños que se adaptan al celular.',
      lessons: [
        {
          id: 'css-hover',
          kind: 'web',
          title: ':hover — al pasar el mouse',
          intro: (
            <>
              <p>
                Una <b>pseudo-clase</b> selecciona un elemento en un <i>estado</i>. <code>:hover</code> se aplica mientras el mouse
                está encima:
              </p>
              <pre>
                <code>{'.boton {\n  background-color: green;\n}\n.boton:hover {\n  background-color: darkgreen;\n}'}</code>
              </pre>
              <p>
                <code>cursor: pointer</code> muestra la manito, para que se note que se puede hacer clic. Probá pasar el mouse por la
                vista previa.
              </p>
            </>
          ),
          task: (
            <p>
              Hacé que el <code>.boton</code> muestre la manito (<code>cursor: pointer</code>) y que al pasar el mouse su fondo cambie a{' '}
              <code>#1d4ed8</code>. Cuando el mouse no está encima, tiene que seguir con su color de siempre.
            </p>
          ),
          hint: <p>Escribí una regla nueva con el selector .boton:hover (sin espacio antes de los dos puntos).</p>,
          edit: ['css'],
          starter: {
            html: '<a class="boton" href="#">Descargar apunte</a>\n',
            css: '.boton {\n  display: inline-block;\n  padding: 10px 20px;\n  background-color: #3b82f6;\n  color: white;\n  text-decoration: none;\n  border-radius: 8px;\n}\n',
          },
          solution: {
            html: '<a class="boton" href="#">Descargar apunte</a>\n',
            css: '.boton {\n  display: inline-block;\n  padding: 10px 20px;\n  background-color: #3b82f6;\n  color: white;\n  text-decoration: none;\n  border-radius: 8px;\n  cursor: pointer;\n}\n.boton:hover {\n  background-color: #1d4ed8;\n}\n',
          },
          tests: [
            { text: 'El botón muestra la manito (cursor: pointer)', test: (c) => c.style('.boton', 'cursor') === 'pointer' },
            { text: 'Hay una regla .boton:hover', test: (c) => rulesFor(c, /\.boton:hover/).length > 0 },
            { text: 'En :hover el fondo es #1d4ed8', test: (c) => rulesFor(c, /\.boton:hover/).some((r) => { const v = r.style?.getPropertyValue('background-color') ?? ''; return /^(#1d4ed8|rgb\(29, 78, 216\))$/i.test(v.trim()) }) },
            { text: 'Sin el mouse encima sigue con su color (#3b82f6)', test: (c) => c.style('.boton', 'background-color') === 'rgb(59, 130, 246)' },
          ],
        },
        {
          id: 'css-nth-child',
          kind: 'web',
          title: ':first-child y :nth-child',
          intro: (
            <>
              <p>Otras pseudo-clases eligen elementos según su posición entre sus hermanos:</p>
              <ul>
                <li>
                  <code>:first-child</code> / <code>:last-child</code>: el primero / el último.
                </li>
                <li>
                  <code>:nth-child(3)</code>: el tercero. <code>:nth-child(even)</code>: los pares; <code>:nth-child(odd)</code>: los
                  impares.
                </li>
              </ul>
              <pre>
                <code>{'li:first-child {\n  color: gold;\n}\ntr:nth-child(odd) {\n  background-color: #eee;\n}'}</code>
              </pre>
              <p>Pintar una fila sí y una no (&quot;cebra&quot;) hace que las tablas se lean mucho mejor.</p>
            </>
          ),
          task: (
            <p>
              En la tabla de posiciones, pintá las filas <b>pares</b> del <code>tbody</code> con fondo <code>#e5e7eb</code> y poné en{' '}
              <b>negrita</b> la primera fila del <code>tbody</code> (el puntero). Sin agregar clases al HTML.
            </p>
          ),
          hint: <p>Usá tbody tr:nth-child(even) para la cebra y tbody tr:first-child para el puntero.</p>,
          edit: ['css'],
          starter: {
            html: '<table>\n  <thead><tr><th>Equipo</th><th>Pts</th></tr></thead>\n  <tbody>\n    <tr><td>3ro B</td><td>15</td></tr>\n    <tr><td>3ro A</td><td>12</td></tr>\n    <tr><td>4to C</td><td>10</td></tr>\n    <tr><td>5to A</td><td>7</td></tr>\n    <tr><td>3ro C</td><td>4</td></tr>\n  </tbody>\n</table>\n',
            css: 'table {\n  border-collapse: collapse;\n  width: 260px;\n}\nth, td {\n  padding: 6px 10px;\n  text-align: left;\n}\nthead {\n  background-color: #1f2937;\n  color: white;\n}\n',
          },
          solution: {
            html: '<table>\n  <thead><tr><th>Equipo</th><th>Pts</th></tr></thead>\n  <tbody>\n    <tr><td>3ro B</td><td>15</td></tr>\n    <tr><td>3ro A</td><td>12</td></tr>\n    <tr><td>4to C</td><td>10</td></tr>\n    <tr><td>5to A</td><td>7</td></tr>\n    <tr><td>3ro C</td><td>4</td></tr>\n  </tbody>\n</table>\n',
            css: 'table {\n  border-collapse: collapse;\n  width: 260px;\n}\nth, td {\n  padding: 6px 10px;\n  text-align: left;\n}\nthead {\n  background-color: #1f2937;\n  color: white;\n}\ntbody tr:nth-child(even) {\n  background-color: #e5e7eb;\n}\ntbody tr:first-child {\n  font-weight: bold;\n}\n',
          },
          tests: [
            { text: 'Las filas 2 y 4 del tbody tienen fondo #e5e7eb', test: (c) => { const r = c.$$('tbody tr'); return r.length === 5 && [1, 3].every((i) => c.win.getComputedStyle(r[i]).backgroundColor === 'rgb(229, 231, 235)') } },
            { text: 'Las filas 1, 3 y 5 no tienen ese fondo', test: (c) => { const r = c.$$('tbody tr'); return r.length === 5 && [0, 2, 4].every((i) => c.win.getComputedStyle(r[i]).backgroundColor !== 'rgb(229, 231, 235)') } },
            { text: 'La primera fila del tbody está en negrita', test: (c) => Number(c.style('tbody tr:first-child td', 'font-weight')) >= 700 },
            { text: 'Las demás filas no están en negrita', test: (c) => c.$$('tbody tr:not(:first-child) td').every((d) => Number(c.win.getComputedStyle(d).fontWeight) < 700) },
            { text: 'No se agregaron clases al HTML', test: (c) => !/class=/i.test(c.html) },
          ],
        },
        {
          id: 'css-media',
          kind: 'web',
          title: 'Media queries: adaptarse al celular',
          intro: (
            <>
              <p>
                Una <b>media query</b> aplica reglas solo cuando se cumple una condición, por ejemplo cuando la pantalla es angosta. Así
                una misma página se ve bien en la compu y en el celular (diseño <i>responsive</i>).
              </p>
              <pre>
                <code>{'.columnas {\n  display: flex;\n}\n@media (max-width: 600px) {\n  .columnas {\n    flex-direction: column;\n  }\n}'}</code>
              </pre>
              <p>
                <code>max-width: 600px</code> = &quot;si la pantalla mide 600px o menos&quot;. Probalo achicando la ventana del
                navegador.
              </p>
            </>
          ),
          task: (
            <p>
              Agregá una media query para pantallas de <b>600px o menos</b> que ponga las dos <code>.col</code> de <code>.columnas</code>{' '}
              una debajo de la otra (<code>flex-direction: column</code>). En pantallas grandes tienen que seguir una al lado de la otra.
            </p>
          ),
          hint: (
            <p>
              Dentro de <code>{'@media (max-width: 600px) { … }'}</code> va una regla completa para .columnas, con sus propias llaves.
            </p>
          ),
          edit: ['css'],
          starter: {
            html: '<div class="columnas">\n  <div class="col">📅 Próximos exámenes</div>\n  <div class="col">📢 Avisos del curso</div>\n</div>\n',
            css: '.columnas {\n  display: flex;\n  gap: 12px;\n}\n.col {\n  flex: 1;\n  background-color: #fae8ff;\n  padding: 20px;\n}\n',
          },
          solution: {
            html: '<div class="columnas">\n  <div class="col">📅 Próximos exámenes</div>\n  <div class="col">📢 Avisos del curso</div>\n</div>\n',
            css: '.columnas {\n  display: flex;\n  gap: 12px;\n}\n.col {\n  flex: 1;\n  background-color: #fae8ff;\n  padding: 20px;\n}\n@media (max-width: 600px) {\n  .columnas {\n    flex-direction: column;\n  }\n}\n',
          },
          tests: [
            { text: 'Hay una media query con max-width: 600px', test: (c) => mediaFor(c, /max-width:\s*600px/).length > 0 },
            { text: 'Adentro hay una regla para .columnas con flex-direction: column', test: (c) => mediaFor(c, /max-width:\s*600px/).some((m) => (Array.from(m.cssRules!) as AnyRule[]).some((r) => /\.columnas/.test(r.selectorText ?? '') && r.style?.getPropertyValue('flex-direction') === 'column')) },
            { text: 'Funciona según el ancho de la vista previa', test: (c) => c.style('.columnas', 'display') === 'flex' && c.style('.columnas', 'flex-direction') === (c.win.matchMedia('(max-width: 600px)').matches ? 'column' : 'row') },
          ],
        },
        {
          id: 'css-proyecto-club',
          kind: 'web',
          title: 'Mini-proyecto: La página del club',
          intro: (
            <>
              <p>
                🛠 <b>Proyecto final de CSS.</b> El club del barrio necesita su página. El HTML ya está: diseñala con todo lo que
                aprendiste. Tiene que verse bien en la compu y en el celular.
              </p>
              <p>Ideas: una sombra o un cambio de color en :hover para las tarjetas, colores del club, una letra linda.</p>
            </>
          ),
          task: (
            <>
              <ul>
                <li>
                  La <code>.barra</code> es flex, con el logo y el menú en los extremos (<code>space-between</code>).
                </li>
                <li>
                  <code>.deportes</code> es una grilla de <b>3 columnas</b> con gap.
                </li>
                <li>
                  Con <code>@media (max-width: 700px)</code>, la grilla pasa a <b>1 columna</b>.
                </li>
                <li>
                  Las <code>.tarjeta</code> tienen padding, esquinas redondeadas y una regla <code>:hover</code> que cambie algo.
                </li>
                <li>
                  El <code>footer</code> tiene el texto centrado.
                </li>
              </ul>
            </>
          ),
          edit: ['css'],
          starter: {
            html: NAV_HTML + '<main>\n  <h1>Hacete socio</h1>\n  <section class="deportes">\n    <article class="tarjeta"><h2>⚽ Fútbol</h2><p>Infantiles y juveniles.</p></article>\n    <article class="tarjeta"><h2>🏐 Vóley</h2><p>Femenino y mixto.</p></article>\n    <article class="tarjeta"><h2>🏀 Básquet</h2><p>Desde los 8 años.</p></article>\n    <article class="tarjeta"><h2>🥋 Judo</h2><p>Martes y jueves.</p></article>\n    <article class="tarjeta"><h2>♟️ Ajedrez</h2><p>Sábados a la mañana.</p></article>\n    <article class="tarjeta"><h2>🏓 Ping-pong</h2><p>Todos los días.</p></article>\n  </section>\n</main>\n<footer>Club Barrio Jardín · Córdoba</footer>\n',
            css: 'body {\n  margin: 0;\n  font-family: Arial, sans-serif;\n}\n',
          },
          solution: {
            html: NAV_HTML + '<main>\n  <h1>Hacete socio</h1>\n  <section class="deportes">\n    <article class="tarjeta"><h2>⚽ Fútbol</h2><p>Infantiles y juveniles.</p></article>\n    <article class="tarjeta"><h2>🏐 Vóley</h2><p>Femenino y mixto.</p></article>\n    <article class="tarjeta"><h2>🏀 Básquet</h2><p>Desde los 8 años.</p></article>\n    <article class="tarjeta"><h2>🥋 Judo</h2><p>Martes y jueves.</p></article>\n    <article class="tarjeta"><h2>♟️ Ajedrez</h2><p>Sábados a la mañana.</p></article>\n    <article class="tarjeta"><h2>🏓 Ping-pong</h2><p>Todos los días.</p></article>\n  </section>\n</main>\n<footer>Club Barrio Jardín · Córdoba</footer>\n',
            css: 'body {\n  margin: 0;\n  font-family: Arial, sans-serif;\n}\n.barra {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 12px 20px;\n  background-color: #065f46;\n  color: white;\n}\nnav {\n  display: flex;\n  gap: 14px;\n}\nnav a {\n  color: white;\n  text-decoration: none;\n}\nmain {\n  padding: 16px;\n}\n.deportes {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 12px;\n}\n.tarjeta {\n  padding: 12px;\n  border-radius: 12px;\n  background-color: #ecfdf5;\n}\n.tarjeta:hover {\n  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);\n}\nfooter {\n  text-align: center;\n  padding: 12px;\n}\n@media (max-width: 700px) {\n  .deportes {\n    grid-template-columns: 1fr;\n  }\n}\n',
          },
          tests: [
            { text: 'La barra es flex con space-between', test: (c) => c.style('.barra', 'display') === 'flex' && c.style('.barra', 'justify-content') === 'space-between' },
            { text: '.deportes es una grilla con gap', test: (c) => c.style('.deportes', 'display') === 'grid' && px(c.style('.deportes', 'column-gap')) > 0 },
            { text: 'Hay una @media (max-width: 700px) que cambia las columnas de .deportes', test: (c) => mediaFor(c, /max-width:\s*700px/).some((m) => (Array.from(m.cssRules!) as AnyRule[]).some((r) => /\.deportes/.test(r.selectorText ?? '') && !!r.style?.getPropertyValue('grid-template-columns'))) },
            { text: 'La grilla tiene 3 columnas (o 1 si la vista previa mide 700px o menos)', test: (c) => tracks(c, '.deportes').length === (c.win.matchMedia('(max-width: 700px)').matches ? 1 : 3) },
            { text: 'Las tarjetas tienen padding, esquinas redondeadas y una regla :hover', test: (c) => px(c.style('.tarjeta', 'padding-top')) > 0 && px(c.style('.tarjeta', 'border-top-left-radius')) > 0 && rulesFor(c, /\.tarjeta:hover/).some((r) => (r.style?.length ?? 0) > 0) },
            { text: 'El footer tiene el texto centrado', test: (c) => c.style('footer', 'text-align') === 'center' },
          ],
        },
      ],
    },
  ],
}
