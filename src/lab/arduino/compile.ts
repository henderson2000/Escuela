// Traduce un programa de Arduino (C/C++ del IDE: setup(), loop(), pinMode, digitalWrite…) a JavaScript
// que se puede ejecutar en el navegador, paso a paso y con un reloj simulado.
//
// 1) Transformaciones línea por línea (sin cambiar la cantidad de líneas, para que los errores
//    apunten a la línea correcta): tipos → let/function, arreglos {..} → [..], #define → const, casts.
// 2) Se analiza el resultado con acorn y se agregan los `await` (delay y funciones del usuario),
//    controles en los bucles (para poder frenarlos y que no cuelguen la página) y la conversión a
//    entero en las variables int (5 / 2 da 2, como en Arduino).

import * as acorn from 'acorn'
import { ancestor, simple } from 'acorn-walk'

export interface CompileError {
  line: number
  message: string
}

export interface Compiled {
  js: string
  functions: string[]
}

const TYPE =
  '(?:unsigned\\s+long|unsigned\\s+int|unsigned\\s+char|long\\s+long|unsigned|signed|int|long|short|float|double|bool|boolean|byte|char|word|String|size_t|uint8_t|int8_t|uint16_t|int16_t|uint32_t|int32_t)'
const INT_TYPES = /^(unsigned|signed|int|long|short|byte|word|size_t|u?int(8|16|32)_t|unsigned\s+(long|int|char)|long\s+long)$/

/** Funciones de la placa que tardan (hay que esperarlas). */
const ASYNC_BUILTINS = new Set(['delay', 'delayMicroseconds', 'pulseIn'])

/** En C el punto y coma es obligatorio (en JavaScript no): se avisa como lo haría el IDE de Arduino. */
function missingSemicolon(lines: string[]): number | null {
  let block = false
  for (let i = 0; i < lines.length; i++) {
    let l = lines[i]
    if (block) {
      if (l.includes('*/')) block = false
      continue
    }
    if (/^\s*\/\*/.test(l) && !l.includes('*/')) {
      block = true
      continue
    }
    l = l.replace(/\/\*.*?\*\//g, '').replace(/\/\/.*$/, '').replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '""').trim()
    if (!l || l.startsWith('#')) continue
    if (/[;{},:]$/.test(l) || /[-+*/%&|=<>!?(\[]$/.test(l)) continue
    if (/^(else|do)\b/.test(l)) continue
    if (/^(if|for|while|switch|else\s+if)\b.*\)$/.test(l)) continue
    // función definida con la llave en la línea siguiente
    if (/\)\s*$/.test(l) && lines[i + 1]?.trim().startsWith('{')) continue
    // cierre de una condición o llamada que empezó en otra línea
    if ((l.match(/\)/g)?.length ?? 0) > (l.match(/\(/g)?.length ?? 0)) {
      if (/\)\s*$/.test(l) && !/;$/.test(l) && !/^\)/.test(l)) {
        // "  b)" de un if partido en dos líneas: se acepta
        continue
      }
    }
    // la siguiente línea continúa la expresión
    const next = lines[i + 1]?.trim() ?? ''
    if (/^[-+*/%&|=<>?.:)]/.test(next)) continue
    return i + 1
  }
  return null
}

export function compileArduino(src: string): { ok: true; out: Compiled } | { ok: false; error: CompileError } {
  const intVars = new Set<string>()
  const lines = src.replace(/\r\n?/g, '\n').split('\n')
  const semi = missingSemicolon(lines)
  if (semi) return { ok: false, error: { line: semi, message: 'Falta un punto y coma ( ; ) al final de esta línea.' } }
  let inBlockComment = false
  const out = lines.map((raw) => {
    let line = raw
    // se deja intacto lo comentado
    if (inBlockComment) {
      if (line.includes('*/')) inBlockComment = false
      return line
    }
    if (/^\s*\/\*/.test(line) && !line.includes('*/')) {
      inBlockComment = true
      return line
    }
    const code = line.replace(/\/\/.*$/, '')
    const comment = line.slice(code.length)
    line = code
    if (/^\s*#\s*include\b/.test(line)) return '//' + raw
    const def = line.match(/^\s*#\s*define\s+(\w+)\s+(.+?)\s*$/)
    if (def) return `const ${def[1]} = ${def[2]};${comment}`
    // objetos de librerías: Servo motor;  →  let motor = new Servo();
    line = line.replace(/^(\s*)Servo\s+([\w\s,]+);/, (_m, ind: string, names: string) => `${ind}let ${names.split(',').map((n) => `${n.trim()} = new Servo()`).join(', ')};`)
    // casts: (int) x  →  __int(x)  ·  (float) x  →  (x)
    line = line.replace(/\(\s*(?:int|long|byte|unsigned\s+long|unsigned\s+int)\s*\)\s*([\w.]+(?:\([^()]*\))?)/g, '__int($1)')
    line = line.replace(/\(\s*(?:float|double)\s*\)\s*/g, '')
    // definición de función: tipo nombre(tipo a, tipo b) {
    line = line.replace(
      new RegExp(`^(\\s*)(?:static\\s+|inline\\s+)*(?:const\\s+)?(?:void|${TYPE})\\s*[*&]?\\s+(\\w+)\\s*\\(([^)]*)\\)\\s*(\\{?)`),
      (_m, ind: string, name: string, params: string, brace: string) => {
        const ps = params
          .split(',')
          .map((p) => p.trim())
          .filter((p) => p && p !== 'void')
          .map((p) => {
            const m = p.replace(/\[\s*\d*\s*\]/g, '').match(/(\w+)\s*(=.*)?$/)
            const n = m ? m[1] : p
            if (INT_TYPES.test(p.replace(/\s+\w+\s*(=.*)?$/, '').replace(/^const\s+/, '').trim())) intVars.add(n)
            return n + (m?.[2] ? ' ' + m[2] : '')
          })
        return `${ind}async function ${name}(${ps.join(', ')}) ${brace}`
      },
    )
    // declaraciones de variables (también las del for): [const] tipo a = 1, b, c[3] = {..};
    line = line.replace(new RegExp(`(^\\s*|[;({]\\s*|\\bfor\\s*\\(\\s*)(?:static\\s+|volatile\\s+)*(const\\s+)?(${TYPE})\\s+(?=[A-Za-z_])`, 'g'), (_m, pre: string, cst: string | undefined, type: string) => {
      const after = raw.slice(raw.indexOf(type) + type.length)
      const names = after.split(/[;)]/)[0].split(',').map((s) => s.trim().match(/^(\w+)/)?.[1])
      if (INT_TYPES.test(type.trim())) names.forEach((n) => n && intVars.add(n))
      return `${pre}${cst ? 'const ' : 'let '}`
    })
    // arreglos: a[] = {1, 2}  →  a = [1, 2]   ·   a[5];  →  a = __array(5);
    line = line.replace(/(\w+)\s*\[\s*\d*\s*\]\s*=\s*\{([^{}]*)\}/g, '$1 = [$2]')
    line = line.replace(/(\blet\s+|,\s*)(\w+)\s*\[\s*(\w+)\s*\]\s*(?=[;,])/g, '$1$2 = __array($3)')
    // literales de C que JavaScript no entiende
    line = line.replace(/\b(\d+)[uUlL]+\b/g, '$1').replace(/\b(\d+\.\d*)[fF]\b/g, '$1')
    line = line.replace(/\bB([01]{1,8})\b/g, '0b$1')
    return line + comment
  })

  const js = out.join('\n')
  let ast: acorn.Node
  try {
    ast = acorn.parse(js, { ecmaVersion: 2022, sourceType: 'script', locations: true, allowAwaitOutsideFunction: true })
  } catch (e) {
    const err = e as SyntaxError & { loc?: { line: number } }
    return { ok: false, error: { line: err.loc?.line ?? 1, message: explainSyntax(err.message) } }
  }

  const functions: string[] = []
  simple(ast, {
    FunctionDeclaration(n) {
      const f = n as acorn.FunctionDeclaration
      if (f.id) functions.push(f.id.name)
    },
  })
  const userFns = new Set(functions)

  // cambios de texto: se recorren los nodos de adentro hacia afuera (los internos tienen `order` menor).
  // En una misma posición, los cierres de los nodos internos van primero y las aperturas de los externos también.
  const ins: { at: number; end: number; text: string; order: number; open: boolean }[] = []
  let seq = 0
  const open = (at: number, text: string) => ins.push({ at, end: at, text, order: seq++, open: true })
  const close = (at: number, text: string) => ins.push({ at, end: at, text, order: seq++, open: false })
  const replace = (at: number, end: number, text: string) => ins.push({ at, end, text, order: seq++, open: true })

  ancestor(ast, {
    CallExpression(n) {
      const c = n as acorn.CallExpression
      if (c.callee.type === 'Identifier' && (userFns.has(c.callee.name) || ASYNC_BUILTINS.has(c.callee.name))) {
        open(c.start, '(await ')
        close(c.end, ')')
      }
    },
    ForStatement(n) {
      loopGuard((n as acorn.ForStatement).body)
    },
    WhileStatement(n) {
      loopGuard((n as acorn.WhileStatement).body)
    },
    DoWhileStatement(n) {
      loopGuard((n as acorn.DoWhileStatement).body)
    },
    AssignmentExpression(n) {
      const a = n as acorn.AssignmentExpression
      if (a.left.type !== 'Identifier' || !intVars.has(a.left.name)) return
      if (a.operator === '/=') {
        // x /= y  →  x = __int(x / (y))   (el tramo entre "x" y "y" sólo tiene el operador)
        replace(a.left.end, a.right.start, ` = __int(${a.left.name} / (`)
        close(a.end, '))')
      } else if (a.operator === '=') {
        open(a.right.start, '__int(')
        close(a.right.end, ')')
      }
    },
    VariableDeclarator(n) {
      const d = n as acorn.VariableDeclarator
      if (d.id.type === 'Identifier' && intVars.has(d.id.name) && d.init && d.init.type !== 'ArrayExpression' && d.init.type !== 'NewExpression') {
        open(d.init.start, '__int(')
        close(d.init.end, ')')
      }
    },
  })

  function loopGuard(body: acorn.Statement) {
    if (body.type === 'BlockStatement') open(body.start + 1, ' await __tick();')
    else {
      open(body.start, '{ await __tick(); ')
      close(body.end, ' }')
    }
  }

  // se aplican de atrás para adelante. En la misma posición, lo último que se aplica queda más a la izquierda:
  // primero las aperturas (de la interna a la externa) y después los cierres (de la externa a la interna).
  const sorted = [...ins].sort((a, b) => {
    if (a.at !== b.at) return b.at - a.at
    if (a.open !== b.open) return a.open ? -1 : 1
    return a.open ? a.order - b.order : b.order - a.order
  })
  let res = js
  for (const i of sorted) res = res.slice(0, i.at) + i.text + res.slice(i.end)

  if (!userFns.has('setup')) return { ok: false, error: { line: 1, message: 'Falta la función void setup() { … }.' } }
  if (!userFns.has('loop')) return { ok: false, error: { line: 1, message: 'Falta la función void loop() { … }.' } }
  return { ok: true, out: { js: res, functions } }
}

function explainSyntax(msg: string): string {
  const m = msg.replace(/\s*\(\d+:\d+\)\s*$/, '')
  if (/Unexpected token/.test(m)) return 'Hay algo que no se entiende en esta línea: revisá que no falte un punto y coma ( ; ), un paréntesis o una llave.'
  if (/Unterminated string/.test(m)) return 'Falta cerrar las comillas de un texto.'
  if (/Unexpected end of input|Unterminated template/.test(m)) return 'Falta cerrar una llave } (cada { necesita su }).'
  if (/Identifier '(\w+)' has already been declared/.test(m)) return `La variable ${m.match(/'(\w+)'/)![1]} está declarada dos veces.`
  if (/Unexpected character/.test(m)) return 'Hay un carácter raro en esta línea.'
  if (/Assigning to rvalue/.test(m)) return 'No se puede asignar un valor ahí. ¿Quisiste comparar con == ?'
  return m
}
