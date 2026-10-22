// Desafíos web con puntos (juego "Desafíos de código"). Las consignas son precisas porque las pruebas son estrictas.
import type { WebCtx, WebLesson } from './types'

const px = (s: string) => parseFloat(s) || 0
const clear = (s: string) => !s || s === 'transparent' || s === 'rgba(0, 0, 0, 0)'
const near = (a: number, b: number, tol = 1.5) => Math.abs(a - b) <= tol
const box = (c: WebCtx, sel: string) => c.$(sel)?.getBoundingClientRect() ?? null
const low = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
const labeled = (el: Element) => ((el as HTMLInputElement).labels?.length ?? 0) > 0
const inputs = (c: WebCtx, type: string) => c.$$('input').filter((i) => (i as HTMLInputElement).type === type) as HTMLInputElement[]
const tracks = (c: WebCtx, sel: string) => c.style(sel, 'grid-template-columns').split(' ').filter((x) => x && x !== 'none')

type AnyRule = CSSRule & { selectorText?: string; style?: CSSStyleDeclaration; cssRules?: CSSRuleList; conditionText?: string; media?: MediaList }
function allRules(c: WebCtx): AnyRule[] {
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

const STAGE_HTML = '<div class="escenario">\n  <div class="actor">¡Hola!</div>\n</div>\n'
const STAGE_CSS = '.escenario {\n  width: 400px;\n  height: 300px;\n  background-color: #1e293b;\n}\n.actor {\n  width: 100px;\n  height: 60px;\n  background-color: #f59e0b;\n}\n'
const SIDE_HTML = '<div class="contenedor">\n  <aside class="lateral">Menú del aula virtual</aside>\n  <main class="principal">Tareas de la semana</main>\n</div>\n'

export const WEB_CHALLENGES: WebLesson[] = [
  {
    id: 'dw-menu',
    kind: 'web',
    title: 'Menú horizontal',
    intro: <p>Armá el menú de la página del centro de estudiantes.</p>,
    task: (
      <p>
        Un <code>nav</code> con clase <code>menu</code> que tenga adentro exactamente <b>4 links</b>: Inicio, Noticias, Fixture y Contacto
        (en ese orden). El nav es flex con <code>justify-content: space-between</code>, tiene color de fondo y al menos{' '}
        <code>10px</code> de padding. Los links son blancos y sin subrayado.
      </p>
    ),
    edit: ['html', 'css'],
    starter: { html: '', css: '' },
    solution: {
      html: '<nav class="menu">\n  <a href="#">Inicio</a>\n  <a href="#">Noticias</a>\n  <a href="#">Fixture</a>\n  <a href="#">Contacto</a>\n</nav>\n',
      css: '.menu {\n  display: flex;\n  justify-content: space-between;\n  background-color: #7c3aed;\n  padding: 12px;\n}\n.menu a {\n  color: white;\n  text-decoration: none;\n}\n',
    },
    tests: [
      { text: 'Hay un nav.menu con 4 links: Inicio, Noticias, Fixture, Contacto', test: (c) => c.$$('nav.menu a').map((a) => low(a.textContent ?? '')).join(',') === 'inicio,noticias,fixture,contacto' },
      { text: 'El nav es flex con space-between', test: (c) => c.style('nav.menu', 'display') === 'flex' && c.style('nav.menu', 'justify-content') === 'space-between' },
      { text: 'El nav tiene fondo de color y padding de 10px o más', test: (c) => !clear(c.style('nav.menu', 'background-color')) && ['top', 'right', 'bottom', 'left'].every((s) => px(c.style('nav.menu', `padding-${s}`)) >= 10) },
      { text: 'Los links son blancos y sin subrayado', test: (c) => c.$$('nav.menu a').length === 4 && c.$$('nav.menu a').every((a) => { const s = c.win.getComputedStyle(a); return s.color === 'rgb(255, 255, 255)' && s.textDecorationLine === 'none' }) },
    ],
  },
  {
    id: 'dw-semaforo',
    kind: 'web',
    title: 'Semáforo',
    intro: <p>Dibujá un semáforo solo con HTML y CSS.</p>,
    task: (
      <p>
        Un <code>div.semaforo</code> con fondo <code>#111827</code> y adentro <b>3</b> <code>div.luz</code> en columna (flex) separadas
        por un <code>gap</code> de al menos <code>8px</code>. Cada luz es un <b>círculo</b> de <code>60px</code> × <code>60px</code>, y
        sus colores son, de arriba hacia abajo, <code>red</code>, <code>yellow</code> y <code>green</code>.
      </p>
    ),
    edit: ['html', 'css'],
    starter: { html: '', css: '' },
    solution: {
      html: '<div class="semaforo">\n  <div class="luz roja"></div>\n  <div class="luz amarilla"></div>\n  <div class="luz verde"></div>\n</div>\n',
      css: '.semaforo {\n  display: inline-flex;\n  flex-direction: column;\n  gap: 10px;\n  padding: 12px;\n  background-color: #111827;\n  border-radius: 12px;\n}\n.luz {\n  width: 60px;\n  height: 60px;\n  border-radius: 50%;\n}\n.roja { background-color: red; }\n.amarilla { background-color: yellow; }\n.verde { background-color: green; }\n',
    },
    tests: [
      { text: 'Hay un .semaforo con fondo #111827 y 3 .luz adentro', test: (c) => c.style('.semaforo', 'background-color') === 'rgb(17, 24, 39)' && c.$$('.semaforo .luz').length === 3 },
      { text: 'Las luces están en columna con gap de 8px o más', test: (c) => { const b = c.$$('.luz').map((l) => l.getBoundingClientRect()); return /flex/.test(c.style('.semaforo', 'display')) && c.style('.semaforo', 'flex-direction') === 'column' && px(c.style('.semaforo', 'row-gap')) >= 8 && b.length === 3 && b[1].top - b[0].bottom >= 7.5 && b[2].top - b[1].bottom >= 7.5 } },
      { text: 'Cada luz es un círculo de 60px × 60px', test: (c) => c.$$('.luz').length === 3 && c.$$('.luz').every((l) => { const r = l.getBoundingClientRect(); const s = c.win.getComputedStyle(l); return near(r.width, 60) && near(r.height, 60) && (px(s.borderTopLeftRadius) >= 30 || s.borderTopLeftRadius === '50%') }) },
      { text: 'Los colores son rojo, amarillo y verde (de arriba hacia abajo)', test: (c) => { const l = c.$$('.luz').sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top).map((e) => c.win.getComputedStyle(e).backgroundColor); return l.join('|') === 'rgb(255, 0, 0)|rgb(255, 255, 0)|rgb(0, 128, 0)' } },
    ],
  },
  {
    id: 'dw-centrar',
    kind: 'web',
    title: 'Centrado perfecto',
    intro: <p>El problema más famoso de CSS: centrar una caja adentro de otra.</p>,
    task: (
      <p>
        Sin tocar el HTML, hacé que <code>.actor</code> quede <b>exactamente en el centro</b> (horizontal y vertical) de{' '}
        <code>.escenario</code>. Las dos cajas tienen que conservar su tamaño (400×300 y 100×60).
      </p>
    ),
    edit: ['css'],
    starter: { html: STAGE_HTML, css: STAGE_CSS },
    solution: {
      html: STAGE_HTML,
      css: '.escenario {\n  width: 400px;\n  height: 300px;\n  background-color: #1e293b;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}\n.actor {\n  width: 100px;\n  height: 60px;\n  background-color: #f59e0b;\n}\n',
    },
    tests: [
      { text: 'El actor está centrado horizontalmente', test: (c) => { const e = box(c, '.escenario'); const a = box(c, '.actor'); return !!e && !!a && near(a.left - e.left, e.right - a.right) } },
      { text: 'El actor está centrado verticalmente', test: (c) => { const e = box(c, '.escenario'); const a = box(c, '.actor'); return !!e && !!a && near(a.top - e.top, e.bottom - a.bottom) } },
      { text: 'El escenario sigue midiendo 400×300', test: (c) => { const e = box(c, '.escenario'); return !!e && near(e.width, 400) && near(e.height, 300) } },
      { text: 'El actor sigue midiendo 100×60', test: (c) => { const a = box(c, '.actor'); return !!a && near(a.width, 100) && near(a.height, 60) } },
    ],
  },
  {
    id: 'dw-tabla',
    kind: 'web',
    title: 'Tabla de posiciones',
    intro: <p>La tabla de la liga intercursos, prolija y fácil de leer.</p>,
    task: (
      <p>
        Una <code>table</code> con <code>caption</code> &quot;Posiciones&quot;, un <code>thead</code> con tres <code>th</code>: Equipo, PJ y
        Pts (con color de fondo), y un <code>tbody</code> con <b>4</b> filas de 3 celdas. Las filas <b>pares</b> del tbody tienen color de
        fondo y las impares no (usá una pseudo-clase, sin clases en las filas).
      </p>
    ),
    edit: ['html', 'css'],
    starter: { html: '', css: '' },
    solution: {
      html: '<table>\n  <caption>Posiciones</caption>\n  <thead>\n    <tr><th>Equipo</th><th>PJ</th><th>Pts</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>3ro B</td><td>4</td><td>10</td></tr>\n    <tr><td>4to A</td><td>4</td><td>9</td></tr>\n    <tr><td>3ro A</td><td>4</td><td>6</td></tr>\n    <tr><td>5to C</td><td>4</td><td>1</td></tr>\n  </tbody>\n</table>\n',
      css: 'table {\n  border-collapse: collapse;\n}\nth, td {\n  padding: 6px 12px;\n}\nth {\n  background-color: #0f766e;\n  color: white;\n}\ntbody tr:nth-child(even) {\n  background-color: #ccfbf1;\n}\n',
    },
    tests: [
      { text: 'La tabla tiene caption "Posiciones"', test: (c) => low(c.text('table caption')) === 'posiciones' },
      { text: 'El thead tiene Equipo, PJ y Pts con color de fondo', test: (c) => { const h = c.$$('thead th'); return h.map((x) => low(x.textContent ?? '')).join(',') === 'equipo,pj,pts' && h.every((x) => !clear(c.win.getComputedStyle(x).backgroundColor) || !clear(c.win.getComputedStyle(x.parentElement!).backgroundColor) || !clear(c.style('thead', 'background-color'))) } },
      { text: 'El tbody tiene 4 filas de 3 celdas', test: (c) => { const r = c.$$('tbody tr'); return r.length === 4 && r.every((x) => x.querySelectorAll('td').length === 3) } },
      { text: 'Filas pares con fondo, impares sin fondo', test: (c) => { const r = c.$$('tbody tr').map((x) => c.win.getComputedStyle(x).backgroundColor); return r.length === 4 && !clear(r[1]) && !clear(r[3]) && clear(r[0]) && clear(r[2]) } },
      { text: 'Las filas no tienen clases', test: (c) => c.$$('tbody tr[class]').length === 0 },
    ],
  },
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
    id: 'dw-boton',
    kind: 'web',
    title: 'Botón con estilo',
    intro: <p>Un botón que dan ganas de apretar.</p>,
    task: (
      <p>
        Al <code>button.boton</code> que ya está, dale fondo <code>#16a34a</code>, texto blanco, padding <code>12px 24px</code>, sin
        borde, esquinas de <code>8px</code> y <code>cursor: pointer</code>. Con <code>:hover</code>, el fondo tiene que cambiar a otro
        color.
      </p>
    ),
    edit: ['css'],
    starter: { html: '<button class="boton">Quiero participar</button>\n', css: '' },
    solution: {
      html: '<button class="boton">Quiero participar</button>\n',
      css: '.boton {\n  background-color: #16a34a;\n  color: white;\n  padding: 12px 24px;\n  border: none;\n  border-radius: 8px;\n  cursor: pointer;\n}\n.boton:hover {\n  background-color: #15803d;\n}\n',
    },
    tests: [
      { text: 'Fondo #16a34a y texto blanco', test: (c) => c.style('.boton', 'background-color') === 'rgb(22, 163, 74)' && c.style('.boton', 'color') === 'rgb(255, 255, 255)' },
      { text: 'Padding 12px arriba/abajo y 24px a los costados', test: (c) => c.style('.boton', 'padding-top') === '12px' && c.style('.boton', 'padding-bottom') === '12px' && c.style('.boton', 'padding-left') === '24px' && c.style('.boton', 'padding-right') === '24px' },
      { text: 'Sin borde y con esquinas de 8px', test: (c) => (c.style('.boton', 'border-top-style') === 'none' || px(c.style('.boton', 'border-top-width')) === 0) && c.style('.boton', 'border-top-left-radius') === '8px' },
      { text: 'cursor: pointer', test: (c) => c.style('.boton', 'cursor') === 'pointer' },
      { text: 'En :hover el fondo es de otro color', test: (c) => allRules(c).some((r) => /\.boton:hover/.test(r.selectorText ?? '') && (() => { const v = (r.style?.getPropertyValue('background-color') ?? '').trim(); return !!v && !/^(#16a34a|rgb\(22, 163, 74\))$/i.test(v) })()) },
    ],
  },
  {
    id: 'dw-grilla',
    kind: 'web',
    title: 'Vidriera de la cooperadora',
    intro: <p>La cooperadora vende productos con el logo de la escuela. Armá la vidriera.</p>,
    task: (
      <p>
        Un <code>div.tienda</code> con <b>6</b> <code>div.producto</code> (cada uno con un <code>h3</code> y un <code>p</code> con el
        precio). La tienda es una grilla de <b>3 columnas iguales</b> con <code>gap: 12px</code>. Cada producto tiene borde y padding. El
        primer producto tiene además la clase <code>oferta</code> y ocupa <b>2 columnas</b>.
      </p>
    ),
    edit: ['html', 'css'],
    starter: { html: '', css: '' },
    solution: {
      html: '<div class="tienda">\n  <div class="producto oferta"><h3>Buzo</h3><p>$25000</p></div>\n  <div class="producto"><h3>Remera</h3><p>$12000</p></div>\n  <div class="producto"><h3>Taza</h3><p>$6000</p></div>\n  <div class="producto"><h3>Gorra</h3><p>$8000</p></div>\n  <div class="producto"><h3>Llavero</h3><p>$2000</p></div>\n  <div class="producto"><h3>Cuaderno</h3><p>$4000</p></div>\n</div>\n',
      css: '.tienda {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 12px;\n}\n.producto {\n  border: 2px solid #475569;\n  padding: 10px;\n}\n.oferta {\n  grid-column: span 2;\n  background-color: #fef08a;\n}\n',
    },
    tests: [
      { text: '6 productos con h3 y p', test: (c) => { const p = c.$$('.tienda > .producto'); return p.length === 6 && p.every((x) => (x.querySelector('h3')?.textContent ?? '').trim() && (x.querySelector('p')?.textContent ?? '').trim()) } },
      { text: 'Grilla de 3 columnas iguales con gap de 12px', test: (c) => { const t = tracks(c, '.tienda').map(px); return c.style('.tienda', 'display') === 'grid' && t.length === 3 && near(t[0], t[1]) && near(t[1], t[2]) && c.style('.tienda', 'column-gap') === '12px' && c.style('.tienda', 'row-gap') === '12px' } },
      { text: 'Cada producto tiene borde y padding', test: (c) => c.$$('.producto').length === 6 && c.$$('.producto').every((p) => { const s = c.win.getComputedStyle(p); return px(s.borderTopWidth) > 0 && s.borderTopStyle !== 'none' && px(s.paddingTop) > 0 }) },
      { text: 'El primero es .oferta y ocupa 2 columnas', test: (c) => { const f = c.$('.tienda > .producto'); const o = c.$$('.producto')[1]; if (!f || !o || !f.classList.contains('oferta')) return false; return near(f.getBoundingClientRect().width, o.getBoundingClientRect().width * 2 + 12, 2) } },
    ],
  },
  {
    id: 'dw-responsive',
    kind: 'web',
    title: 'Aula virtual responsive',
    intro: <p>Un diseño de dos columnas que en el celular se apila.</p>,
    task: (
      <p>
        Sin tocar el HTML: <code>.contenedor</code> es flex; <code>.lateral</code> mide <code>200px</code> de ancho (contenido) y{' '}
        <code>.principal</code> ocupa todo el resto con <code>flex: 1</code>. Con <code>@media (max-width: 600px)</code>, el contenedor
        pasa a <code>flex-direction: column</code>.
      </p>
    ),
    edit: ['css'],
    starter: { html: SIDE_HTML, css: '.lateral {\n  background-color: #cbd5e1;\n}\n.principal {\n  background-color: #e0f2fe;\n}\n' },
    solution: {
      html: SIDE_HTML,
      css: '.contenedor {\n  display: flex;\n}\n.lateral {\n  width: 200px;\n  background-color: #cbd5e1;\n}\n.principal {\n  flex: 1;\n  background-color: #e0f2fe;\n}\n@media (max-width: 600px) {\n  .contenedor {\n    flex-direction: column;\n  }\n}\n',
    },
    tests: [
      { text: '.contenedor es flex', test: (c) => c.style('.contenedor', 'display') === 'flex' },
      { text: '.lateral mide 200px y .principal tiene flex: 1', test: (c) => c.style('.lateral', 'width') === '200px' && c.style('.principal', 'flex-grow') === '1' },
      { text: 'Hay una @media (max-width: 600px) con flex-direction: column para .contenedor', test: (c) => allRules(c).some((m) => !!m.media && !!m.cssRules && /max-width:\s*600px/.test(m.conditionText ?? m.media.mediaText) && (Array.from(m.cssRules) as AnyRule[]).some((r) => /\.contenedor/.test(r.selectorText ?? '') && r.style?.getPropertyValue('flex-direction') === 'column')) },
      { text: 'Funciona según el ancho de la vista previa', test: (c) => { const m = c.win.matchMedia('(max-width: 600px)').matches; const p = box(c, '.principal'); const k = box(c, '.contenedor'); return c.style('.contenedor', 'flex-direction') === (m ? 'column' : 'row') && !!p && !!k && near(p.right, k.right) } },
    ],
  },
]
