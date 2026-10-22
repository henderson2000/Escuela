// Desafíos web con puntos (juego "Desafíos de código"). Las consignas son precisas porque las pruebas son estrictas.
import type { WebCtx, WebLesson } from './types'

const low = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
const txt = (el: Element | null | undefined) => low(el?.textContent ?? '')
const labeled = (el: Element) => ((el as HTMLInputElement).labels?.length ?? 0) > 0
const inputs = (c: WebCtx, type: string) => c.$$('input').filter((i) => (i as HTMLInputElement).type === type) as HTMLInputElement[]
/** hijos directos que son de cierta etiqueta */
const kids = (el: Element | null | undefined, tag: string) => (el ? Array.from(el.children).filter((k) => k.tagName === tag.toUpperCase()) : [])

export const WEB_CHALLENGES: WebLesson[] = [
  {
    id: 'dw-form',
    kind: 'web',
    title: 'Formulario del interescolar',
    intro: <p>La inscripción al torneo interescolar tiene que validar los datos sola.</p>,
    task: (
      <p>
        Un <code>form</code> con: nombre (<code>text</code>, obligatorio), email (<code>email</code>, obligatorio), edad (
        <code>number</code> con <code>min=&quot;13&quot;</code> y <code>max=&quot;18&quot;</code>), un <code>select</code> de deporte con al
        menos 3 opciones, <b>2 radios</b> de categoría con el mismo name y un botón <code>submit</code>. <b>Todos</b> los campos con su{' '}
        <code>label</code> conectado.
      </p>
    ),
    edit: ['html'],
    starter: { html: '<form>\n\n</form>\n', css: '' },
    solution: {
      html: '<form>\n  <label for="nombre">Nombre</label>\n  <input type="text" id="nombre" name="nombre" required>\n  <label for="email">Email</label>\n  <input type="email" id="email" name="email" required>\n  <label for="edad">Edad</label>\n  <input type="number" id="edad" name="edad" min="13" max="18">\n  <label for="deporte">Deporte</label>\n  <select id="deporte" name="deporte">\n    <option>Fútbol</option>\n    <option>Vóley</option>\n    <option>Básquet</option>\n  </select>\n  <input type="radio" id="fem" name="cat" value="f"><label for="fem">Femenino</label>\n  <input type="radio" id="mas" name="cat" value="m"><label for="mas">Masculino</label>\n  <button type="submit">Inscribir</button>\n</form>\n',
      css: '',
    },
    tests: [
      { text: 'Nombre (text) y email (email) obligatorios', test: (c) => inputs(c, 'text').some((i) => i.required) && inputs(c, 'email').some((i) => i.required) },
      { text: 'Edad number con min 13 y max 18', test: (c) => inputs(c, 'number').some((i) => i.min === '13' && i.max === '18') },
      { text: 'Select con al menos 3 opciones', test: (c) => c.$$('form select').some((s) => s.querySelectorAll('option').length >= 3) },
      { text: '2 radios con el mismo name', test: (c) => { const r = inputs(c, 'radio'); return r.length === 2 && !!r[0].name && r[0].name === r[1].name } },
      { text: 'Botón submit', test: (c) => c.$$('form button, form input[type=submit]').some((b) => (b as HTMLButtonElement).type === 'submit') },
      { text: 'Todos los campos tienen label', test: (c) => { const f = c.$$('form input, form select, form textarea').filter((e) => !['submit', 'button', 'hidden', 'reset'].includes((e as HTMLInputElement).type)); return f.length >= 6 && f.every(labeled) } },
    ],
  },
  {
    id: 'dw-club',
    kind: 'web',
    title: 'La página del club',
    intro: <p>El Club Atlético Barrio Jardín quiere una página con la estructura semántica bien armada.</p>,
    task: (
      <>
        <p>Dentro del <code>body</code>, en este orden:</p>
        <ul>
          <li>
            un <code>header</code> con un <code>h1</code> que diga <b>Club Atlético Barrio Jardín</b> y, también dentro del header, un{' '}
            <code>nav</code> con <b>al menos 3 links</b> <code>a</code> con <code>href</code>;
          </li>
          <li>
            un <code>main</code> con <b>al menos 2</b> <code>section</code>, cada una con su <code>h2</code> y al menos un <code>p</code>;
          </li>
          <li>
            un <code>aside</code> (fuera del main) con un <code>h2</code> que diga <b>Próximos partidos</b>;
          </li>
          <li>
            un <code>footer</code> con un <code>p</code> que contenga el texto <b>© 2026</b>.
          </li>
        </ul>
        <p>
          Tiene que haber <b>un solo</b> <code>h1</code> en toda la página.
        </p>
      </>
    ),
    edit: ['html'],
    starter: { html: '<!DOCTYPE html>\n<html lang="es">\n<head>\n  <meta charset="utf-8">\n  <title>Club Atlético Barrio Jardín</title>\n</head>\n<body>\n  <div>Club Atlético Barrio Jardín</div>\n\n</body>\n</html>\n', css: '' },
    solution: {
      html: '<!DOCTYPE html>\n<html lang="es">\n<head>\n  <meta charset="utf-8">\n  <title>Club Atlético Barrio Jardín</title>\n</head>\n<body>\n  <header>\n    <h1>Club Atlético Barrio Jardín</h1>\n    <nav>\n      <a href="#futbol">Fútbol</a>\n      <a href="#voley">Vóley</a>\n      <a href="#socios">Socios</a>\n    </nav>\n  </header>\n  <main>\n    <section id="futbol">\n      <h2>Fútbol</h2>\n      <p>Entrenamientos martes y jueves a las 18.</p>\n    </section>\n    <section id="voley">\n      <h2>Vóley</h2>\n      <p>Categorías sub 14 y sub 16.</p>\n    </section>\n  </main>\n  <aside>\n    <h2>Próximos partidos</h2>\n    <p>Sábado vs. Talleres</p>\n  </aside>\n  <footer>\n    <p>© 2026 Club Atlético Barrio Jardín</p>\n  </footer>\n</body>\n</html>\n',
      css: '',
    },
    tests: [
      { text: 'header con el h1 "Club Atlético Barrio Jardín"', test: (c) => txt(c.$('header > h1')) === 'club atletico barrio jardin' },
      { text: 'Un solo h1 en la página', test: (c) => c.$$('h1').length === 1 },
      { text: 'nav dentro del header con al menos 3 links con href', test: (c) => c.$$('header nav a[href]').filter((a) => a.getAttribute('href')!.trim() && txt(a)).length >= 3 },
      { text: 'main con al menos 2 section, cada una con h2 y p', test: (c) => { const s = c.$$('main section'); return s.length >= 2 && s.every((x) => txt(x.querySelector('h2')) && txt(x.querySelector('p'))) } },
      { text: 'aside fuera del main con el h2 "Próximos partidos"', test: (c) => c.$$('aside').some((a) => !a.closest('main') && txt(a.querySelector('h2')) === 'proximos partidos') },
      { text: 'footer con un p que contiene "© 2026"', test: (c) => c.$$('footer p').some((p) => (p.textContent ?? '').includes('© 2026')) },
      { text: 'El orden es header, main, aside, footer (hijos del body)', test: (c) => { const t = Array.from(c.doc.body.children).map((e) => e.tagName).filter((n) => ['HEADER', 'MAIN', 'ASIDE', 'FOOTER'].includes(n)); return t.join(',') === 'HEADER,MAIN,ASIDE,FOOTER' } },
    ],
  },
  {
    id: 'dw-horarios',
    kind: 'web',
    title: 'Horarios del taller',
    intro: <p>Armá la tabla de horarios del taller de 3er año.</p>,
    task: (
      <>
        <p>
          Una <code>table</code> con un <code>caption</code> que diga <b>Horarios del taller</b>, un <code>thead</code> y un{' '}
          <code>tbody</code>:
        </p>
        <ul>
          <li>
            el <code>thead</code> tiene <b>una fila</b> con <b>4</b> <code>th</code>: <b>Hora</b>, <b>Lunes</b>, <b>Martes</b> y{' '}
            <b>Miércoles</b>, en ese orden;
          </li>
          <li>
            el <code>tbody</code> tiene <b>exactamente 3 filas</b>. La primera y la tercera tienen 4 celdas <code>td</code> (la hora y una
            materia por día);
          </li>
          <li>
            la <b>segunda fila</b> tiene la hora <b>10:00</b> en un <code>td</code> y después <b>un solo</b> <code>td</code> que dice{' '}
            <b>Recreo</b> y ocupa los 3 días con <code>colspan=&quot;3&quot;</code>.
          </li>
        </ul>
      </>
    ),
    edit: ['html'],
    starter: { html: '<table>\n  <tr>\n    <td>Hora</td>\n    <td>Lunes</td>\n  </tr>\n</table>\n', css: '' },
    solution: {
      html: '<table>\n  <caption>Horarios del taller</caption>\n  <thead>\n    <tr>\n      <th>Hora</th>\n      <th>Lunes</th>\n      <th>Martes</th>\n      <th>Miércoles</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>8:00</td>\n      <td>Computación</td>\n      <td>Electrónica</td>\n      <td>Dibujo</td>\n    </tr>\n    <tr>\n      <td>10:00</td>\n      <td colspan="3">Recreo</td>\n    </tr>\n    <tr>\n      <td>10:20</td>\n      <td>Mecánica</td>\n      <td>Computación</td>\n      <td>Electricidad</td>\n    </tr>\n  </tbody>\n</table>\n',
      css: '',
    },
    tests: [
      { text: 'caption "Horarios del taller"', test: (c) => txt(c.$('table > caption')) === 'horarios del taller' },
      { text: 'thead con una fila de 4 th: Hora, Lunes, Martes, Miércoles', test: (c) => { const r = c.$$('table > thead > tr'); return r.length === 1 && Array.from(r[0].children).map((x) => (x.tagName === 'TH' ? txt(x) : '?')).join('|') === 'hora|lunes|martes|miercoles' } },
      { text: 'tbody con exactamente 3 filas', test: (c) => c.$$('table > tbody > tr').length === 3 },
      { text: 'Filas 1 y 3 con 4 td con texto', test: (c) => { const r = c.$$('table > tbody > tr'); return r.length === 3 && [r[0], r[2]].every((f) => { const d = kids(f, 'td'); return f.children.length === 4 && d.length === 4 && d.every((x) => txt(x)) }) } },
      { text: 'Fila 2: "10:00" y un td "Recreo" con colspan="3"', test: (c) => { const f = c.$$('table > tbody > tr')[1]; const d = kids(f, 'td'); return !!f && f.children.length === 2 && d.length === 2 && txt(d[0]) === '10:00' && txt(d[1]) === 'recreo' && (d[1] as HTMLTableCellElement).colSpan === 3 } },
    ],
  },
  {
    id: 'dw-materias',
    kind: 'web',
    title: 'Materias por año',
    intro: <p>Hacé una lista con los años del ciclo básico y, adentro de cada año, sus materias.</p>,
    task: (
      <>
        <p>
          Un <code>h1</code> que diga <b>Materias del ciclo básico</b> y después <b>una</b> lista <code>ul</code> con <b>exactamente 3</b>{' '}
          <code>li</code>. Cada <code>li</code> empieza con el nombre del año (<b>1er año</b>, <b>2do año</b> y <b>3er año</b>, en ese
          orden) y adentro tiene una lista <b>numerada</b> <code>ol</code> con <b>al menos 3</b> materias.
        </p>
        <p>
          En la lista de <b>3er año</b> tiene que estar <b>Computación</b>.
        </p>
      </>
    ),
    edit: ['html'],
    starter: { html: '<h1>Materias del ciclo básico</h1>\n<ul>\n  <li>1er año</li>\n  <li>2do año</li>\n  <li>3er año</li>\n</ul>\n', css: '' },
    solution: {
      html: '<h1>Materias del ciclo básico</h1>\n<ul>\n  <li>1er año\n    <ol>\n      <li>Matemática</li>\n      <li>Lengua</li>\n      <li>Dibujo técnico</li>\n    </ol>\n  </li>\n  <li>2do año\n    <ol>\n      <li>Física</li>\n      <li>Historia</li>\n      <li>Electricidad</li>\n    </ol>\n  </li>\n  <li>3er año\n    <ol>\n      <li>Química</li>\n      <li>Computación</li>\n      <li>Electrónica</li>\n    </ol>\n  </li>\n</ul>\n',
      css: '',
    },
    tests: [
      { text: 'h1 "Materias del ciclo básico"', test: (c) => txt(c.$('h1')) === 'materias del ciclo basico' },
      { text: 'Una ul principal con exactamente 3 li', test: (c) => { const u = c.$$('ul').filter((x) => !x.parentElement?.closest('ul, ol')); return u.length === 1 && kids(u[0], 'li').length === 3 && u[0].children.length === 3 } },
      { text: 'Los li empiezan con "1er año", "2do año" y "3er año"', test: (c) => { const u = c.$$('ul').find((x) => !x.parentElement?.closest('ul, ol')); const li = kids(u, 'li'); return li.length === 3 && ['1er ano', '2do ano', '3er ano'].every((y, i) => low(li[i].firstChild?.textContent ?? '') === y) } },
      { text: 'Cada año tiene adentro un ol con al menos 3 materias', test: (c) => { const u = c.$$('ul').find((x) => !x.parentElement?.closest('ul, ol')); const li = kids(u, 'li'); return li.length === 3 && li.every((l) => { const o = kids(l, 'ol'); return o.length === 1 && kids(o[0], 'li').filter((m) => txt(m)).length >= 3 }) } },
      { text: 'En 3er año está "Computación"', test: (c) => { const u = c.$$('ul').find((x) => !x.parentElement?.closest('ul, ol')); const l = kids(u, 'li')[2]; return !!l && kids(kids(l, 'ol')[0], 'li').some((m) => txt(m) === 'computacion') } },
    ],
  },
  {
    id: 'dw-producto',
    kind: 'web',
    title: 'Ficha de producto',
    intro: <p>La cooperadora vende kits de electrónica y necesita la ficha de uno.</p>,
    task: (
      <>
        <p>
          Un <code>article</code> con, en este orden:
        </p>
        <ol>
          <li>
            un <code>h2</code> que diga <b>Kit de soldadura</b>;
          </li>
          <li>
            una imagen <code>img</code> con <code>src=&quot;kit.jpg&quot;</code> y un <code>alt</code> que describa la imagen (al menos 10
            letras);
          </li>
          <li>
            un <code>p</code> con el precio, que contenga <b>$15000</b>;
          </li>
          <li>
            una lista <code>ul</code> con <b>al menos 4</b> características;
          </li>
          <li>
            un link <code>a</code> que diga <b>Comprar</b>, lleve a <code>https://cooperadora.example/kit</code> y se abra en una{' '}
            <b>pestaña nueva</b>.
          </li>
        </ol>
      </>
    ),
    edit: ['html'],
    starter: { html: '<article>\n  <h2>Kit de soldadura</h2>\n\n</article>\n', css: '' },
    solution: {
      html: '<article>\n  <h2>Kit de soldadura</h2>\n  <img src="kit.jpg" alt="Soldador con soporte y rollo de estaño">\n  <p>Precio: $15000</p>\n  <ul>\n    <li>Soldador de 40 W</li>\n    <li>Soporte con esponja</li>\n    <li>Rollo de estaño</li>\n    <li>Desoldador</li>\n  </ul>\n  <a href="https://cooperadora.example/kit" target="_blank">Comprar</a>\n</article>\n',
      css: '',
    },
    tests: [
      { text: 'article con el h2 "Kit de soldadura"', test: (c) => txt(c.$('article h2')) === 'kit de soldadura' },
      { text: 'img con src="kit.jpg" dentro del article', test: (c) => c.$('article img')?.getAttribute('src') === 'kit.jpg' },
      { text: 'La imagen tiene un alt de al menos 10 letras', test: (c) => (c.$('article img')?.getAttribute('alt') ?? '').replace(/[^a-záéíóúñü]/gi, '').length >= 10 },
      { text: 'Un p con "$15000"', test: (c) => c.$$('article p').some((p) => (p.textContent ?? '').replace(/\s/g, '').includes('$15000')) },
      { text: 'ul con al menos 4 características', test: (c) => kids(c.$('article ul'), 'li').filter((l) => txt(l)).length >= 4 },
      { text: 'Link "Comprar" a https://cooperadora.example/kit en pestaña nueva', test: (c) => c.$$('article a').some((a) => txt(a) === 'comprar' && a.getAttribute('href') === 'https://cooperadora.example/kit' && a.getAttribute('target') === '_blank') },
      { text: 'El orden es h2, img, p, ul, a', test: (c) => { const els = ['h2', 'img', 'p', 'ul', 'a'].map((t) => c.$(`article ${t}`)); return els.every(Boolean) && els.every((e, i) => i === 0 || !!(els[i - 1]!.compareDocumentPosition(e!) & 4)) } },
    ],
  },
  {
    id: 'dw-anclas',
    kind: 'web',
    title: 'Menú con anclas',
    intro: <p>Una página larga sobre la escuela, con un menú que lleva a cada parte sin cambiar de página.</p>,
    task: (
      <>
        <p>
          Un <code>nav</code> con <b>exactamente 4</b> links que digan <b>Historia</b>, <b>Especialidades</b>, <b>Talleres</b> y{' '}
          <b>Contacto</b> (en ese orden). Cada link lleva con un ancla (<code>#…</code>) a una <code>section</code> de la misma página.
        </p>
        <p>
          Las 4 <code>section</code> van después del nav, tienen los <code>id</code> <code>historia</code>, <code>especialidades</code>,{' '}
          <code>talleres</code> y <code>contacto</code>, y cada una empieza con un <code>h2</code> con el mismo nombre que su link.
        </p>
      </>
    ),
    edit: ['html'],
    starter: { html: '<nav>\n  <a href="historia.html">Historia</a>\n</nav>\n\n<section>\n  <h2>Historia</h2>\n  <p>La escuela fue fundada en 1945.</p>\n</section>\n', css: '' },
    solution: {
      html: '<nav>\n  <a href="#historia">Historia</a>\n  <a href="#especialidades">Especialidades</a>\n  <a href="#talleres">Talleres</a>\n  <a href="#contacto">Contacto</a>\n</nav>\n\n<section id="historia">\n  <h2>Historia</h2>\n  <p>La escuela fue fundada en 1945.</p>\n</section>\n<section id="especialidades">\n  <h2>Especialidades</h2>\n  <p>Electrónica, Mecánica, Computación…</p>\n</section>\n<section id="talleres">\n  <h2>Talleres</h2>\n  <p>De 1er a 3er año se rota por todos los talleres.</p>\n</section>\n<section id="contacto">\n  <h2>Contacto</h2>\n  <p>Escribinos a la secretaría.</p>\n</section>\n',
      css: '',
    },
    tests: [
      { text: 'nav con exactamente 4 links: Historia, Especialidades, Talleres, Contacto', test: (c) => c.$$('nav a').map(txt).join('|') === 'historia|especialidades|talleres|contacto' },
      { text: 'Los links van a #historia, #especialidades, #talleres y #contacto', test: (c) => c.$$('nav a').map((a) => a.getAttribute('href')).join('|') === '#historia|#especialidades|#talleres|#contacto' },
      { text: 'Hay una section con cada id', test: (c) => ['historia', 'especialidades', 'talleres', 'contacto'].every((id) => c.doc.getElementById(id)?.tagName === 'SECTION') },
      { text: 'Cada section empieza con su h2', test: (c) => ['historia', 'especialidades', 'talleres', 'contacto'].every((id) => { const s = c.doc.getElementById(id); return s?.firstElementChild?.tagName === 'H2' && txt(s.firstElementChild) === id }) },
      { text: 'Las sections están después del nav', test: (c) => { const n = c.$('nav'); return !!n && c.$$('section').length >= 4 && c.$$('section').every((s) => !!(n.compareDocumentPosition(s) & 4) && !n.contains(s)) } },
    ],
  },
]
