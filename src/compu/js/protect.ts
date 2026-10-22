// Prepara el código JavaScript del alumno antes de ejecutarlo:
//  - revisa que esté bien escrito (errores de sintaxis con número de línea, en castellano)
//  - agrega una protección en cada bucle para que un bucle infinito no cuelgue la página
import { parse } from 'acorn'
import { simple } from 'acorn-walk'
import type { Node } from 'acorn'

export interface CodeError {
  line: number
  message: string
  hint: string | null
}

const SYNTAX_HINTS: [RegExp, string][] = [
  [/Unterminated string constant/, 'Falta cerrar las comillas de un texto.'],
  [/Unterminated template/, 'Falta cerrar el texto con la comilla invertida `.'],
  [/Unexpected token \(\d+:\d+\)$/, 'Hay un símbolo que sobra o que falta (revisá paréntesis, llaves, comas y comillas).'],
  [/Unexpected token/, 'Hay un símbolo que sobra o que falta (revisá paréntesis, llaves, comas y comillas).'],
  [/Unexpected character/, 'Hay un carácter que JavaScript no entiende (¿comillas “curvas” copiadas de otro lado?).'],
  [/Identifier '(\w+)' has already been declared/, 'La variable $1 ya estaba declarada: no la declares dos veces con let o const.'],
  [/Assigning to rvalue/, 'No se puede asignar ahí: para comparar se usa === (no =).'],
  [/'return' outside of function/, 'return sólo se puede usar dentro de una función.'],
  [/Unexpected keyword/, 'Hay una palabra reservada en un lugar donde no va.'],
  [/Unexpected end of input|Unexpected token \(.*\)$/, 'Parece que falta cerrar una llave } o un paréntesis ).'],
]

export function hintFor(message: string, table: [RegExp, string][]): string | null {
  for (const [re, es] of table) {
    const m = re.exec(message)
    if (m) return es.replace(/\$(\d)/g, (_, k) => m[Number(k)] ?? '')
  }
  return null
}

/** Devuelve el código protegido, o el error de sintaxis. */
export function protect(code: string): { code: string } | { error: CodeError } {
  let ast: Node
  try {
    ast = parse(code, { ecmaVersion: 'latest', sourceType: 'script', allowReturnOutsideFunction: false, locations: true }) as Node
  } catch (e) {
    const err = e as SyntaxError & { loc?: { line: number } }
    let message = err.message.replace(/\s*\(\d+:\d+\)$/, '')
    if (/Unexpected token/.test(message) && code.split('{').length > code.split('}').length) message += ' (falta cerrar una llave })'
    return { error: { line: err.loc?.line ?? 0, message, hint: hintFor(err.message, SYNTAX_HINTS) } }
  }
  const ins: { at: number; text: string }[] = []
  const guard = (body: Node & { type: string; start: number; end: number }) => {
    if (body.type === 'BlockStatement') ins.push({ at: body.start + 1, text: '__g();' })
    else {
      ins.push({ at: body.start, text: '{__g();' })
      ins.push({ at: body.end, text: '}' })
    }
  }
  const loop = (n: Node) => guard((n as unknown as { body: Node & { type: string; start: number; end: number } }).body)
  simple(ast, {
    WhileStatement: loop,
    DoWhileStatement: loop,
    ForStatement: loop,
    ForInStatement: loop,
    ForOfStatement: loop,
  })
  ins.sort((a, b) => b.at - a.at)
  let out = code
  for (const i of ins) out = out.slice(0, i.at) + i.text + out.slice(i.at)
  return { code: out }
}

/** Código que define la protección de bucles (se ejecuta antes del programa). */
export const GUARD_SRC = `var __t0 = 0, __last = 0, __n = 0;
function __g() {
  if ((++__n & 255) !== 0) return;
  var now = Date.now();
  // si pasó un rato desde la última vuelta, es otra ejecución (por ejemplo, otro clic): se reinicia el reloj
  if (now - __last > 150) __t0 = now;
  __last = now;
  if (now - __t0 > 2500) throw new Error('__BUCLE__');
}`

const RUNTIME_HINTS: [RegExp, string][] = [
  [/__BUCLE__/, 'El programa tardó demasiado y se cortó. ¿Hay un bucle que nunca termina? Revisá la condición y que la variable cambie en cada vuelta.'],
  [/^(\w+) is not defined/, 'No existe nada llamado «$1»: ¿lo declaraste con let o const? ¿Está bien escrito? (mayúsculas y minúsculas importan)'],
  [/Cannot access '(\w+)' before initialization/, 'Usaste «$1» antes de la línea donde lo declarás.'],
  [/Assignment to constant variable/, 'Intentaste cambiar una constante (const). Si el valor tiene que cambiar, declarala con let.'],
  [/(\S+) is not a function/, '«$1» no es una función: revisá el nombre (por ejemplo console.log, document.getElementById) y los paréntesis.'],
  [/Cannot read properties of (null|undefined) \(reading '(\w+)'\)/, 'Intentaste usar .$2 sobre algo que es $1. Si es un elemento de la página, revisá que el id exista y esté bien escrito.'],
  [/Cannot set properties of (null|undefined) \(setting '(\w+)'\)/, 'Intentaste cambiar .$2 de algo que es $1. Si es un elemento de la página, revisá que el id exista y esté bien escrito.'],
  [/Maximum call stack size exceeded/, 'Una función se llama a sí misma sin parar.'],
]

export function explainRuntime(message: string): string | null {
  return hintFor(message, RUNTIME_HINTS)
}

/** Convierte un valor como lo mostraría la consola del navegador. */
export const FORMAT_SRC = `function __fmt(v, depth) {
  depth = depth || 0;
  if (typeof v === 'string') return depth ? "'" + v + "'" : v;
  if (v === null) return 'null';
  if (v === undefined) return 'undefined';
  if (typeof v === 'function') return 'ƒ ' + (v.name || '') + '()';
  if (Array.isArray(v)) return depth > 2 ? '[…]' : '[' + v.map(function (x) { return __fmt(x, depth + 1); }).join(', ') + ']';
  if (typeof v === 'object') {
    if (typeof Element !== 'undefined' && v instanceof Element) return '<' + v.tagName.toLowerCase() + (v.id ? ' id="' + v.id + '"' : '') + '>';
    if (depth > 2) return '{…}';
    var ks = Object.keys(v);
    return '{' + ks.map(function (k) { return k + ': ' + __fmt(v[k], depth + 1); }).join(', ') + '}';
  }
  return String(v);
}`
