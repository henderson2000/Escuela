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
]
