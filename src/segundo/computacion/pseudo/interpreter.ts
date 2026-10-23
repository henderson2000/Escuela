// Intérprete de pseudocódigo en castellano (estilo PSeInt): Algoritmo, Definir, Escribir, Leer, asignación (<- o =),
// Si/SiNo/FinSi, Segun, Mientras, Para, Repetir/Hasta Que. Sin distinguir mayúsculas y con o sin tildes.

export type Value = number | string | boolean

export class PseudoError extends Error {
  line: number
  constructor(message: string, line: number) {
    super(message)
    this.line = line
  }
}

/* ================================================================== léxico */

type Tok = { t: 'num'; v: number } | { t: 'str'; v: string } | { t: 'id'; v: string; raw: string } | { t: 'op'; v: string }

/** saca tildes y pasa a minúsculas: "Según" → "segun" */
export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

function lex(line: string, n: number): Tok[] {
  const out: Tok[] = []
  let i = 0
  while (i < line.length) {
    const c = line[i]
    if (c === ' ' || c === '\t' || c === ';') {
      i++
      continue
    }
    if (c === '/' && line[i + 1] === '/') break
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(line[i + 1] ?? ''))) {
      let j = i
      while (j < line.length && /[0-9.]/.test(line[j])) j++
      out.push({ t: 'num', v: Number(line.slice(i, j)) })
      i = j
      continue
    }
    if (c === '"' || c === "'" || c === '“' || c === '”') {
      const close = c === '“' ? '”' : c
      let j = i + 1
      while (j < line.length && line[j] !== close && !(close === '"' && line[j] === '”')) j++
      if (j >= line.length) throw new PseudoError('Falta cerrar las comillas del texto.', n)
      out.push({ t: 'str', v: line.slice(i + 1, j) })
      i = j + 1
      continue
    }
    if (/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ_]/.test(c)) {
      let j = i
      while (j < line.length && /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ_0-9]/.test(line[j])) j++
      const raw = line.slice(i, j)
      out.push({ t: 'id', v: norm(raw), raw })
      i = j
      continue
    }
    const two = line.slice(i, i + 2)
    if (['<-', '<=', '>=', '<>', '==', '!=', '&&', '||'].includes(two)) {
      out.push({ t: 'op', v: two === '==' ? '=' : two === '!=' ? '<>' : two === '&&' ? 'y' : two === '||' ? 'o' : two })
      i += 2
      continue
    }
    if ('+-*/^%()=<>,:[]'.includes(c)) {
      out.push({ t: 'op', v: c === '%' ? 'mod' : c })
      i++
      continue
    }
    if (c === '←') {
      out.push({ t: 'op', v: '<-' })
      i++
      continue
    }
    throw new PseudoError(`No entiendo el símbolo «${c}».`, n)
  }
  return out
}

/* ================================================================== expresiones */

type Expr =
  | { k: 'lit'; v: Value }
  | { k: 'var'; name: string; raw: string }
  | { k: 'un'; op: string; e: Expr }
  | { k: 'bin'; op: string; a: Expr; b: Expr }
  | { k: 'call'; fn: string; args: Expr[] }

const FUNCS = ['raiz', 'rc', 'abs', 'trunc', 'redon', 'azar', 'aleatorio', 'longitud', 'mayusculas', 'minusculas', 'concatenar', 'subcadena', 'convertiranumero', 'convertiratexto']

class ExprParser {
  i = 0
  toks: Tok[]
  line: number
  constructor(toks: Tok[], line: number) {
    this.toks = toks
    this.line = line
  }
  peek() {
    return this.toks[this.i]
  }
  isOp(v: string) {
    const t = this.peek()
    return !!t && ((t.t === 'op' && t.v === v) || (t.t === 'id' && t.v === v))
  }
  eat(v: string) {
    if (!this.isOp(v)) throw new PseudoError(`Se esperaba «${v}».`, this.line)
    this.i++
  }
  parse(): Expr {
    return this.or()
  }
  or(): Expr {
    let a = this.and()
    while (this.isOp('o')) {
      this.i++
      a = { k: 'bin', op: 'o', a, b: this.and() }
    }
    return a
  }
  and(): Expr {
    let a = this.not()
    while (this.isOp('y')) {
      this.i++
      a = { k: 'bin', op: 'y', a, b: this.not() }
    }
    return a
  }
  not(): Expr {
    if (this.isOp('no') || this.isOp('!')) {
      this.i++
      return { k: 'un', op: 'no', e: this.not() }
    }
    return this.cmp()
  }
  cmp(): Expr {
    let a = this.add()
    for (;;) {
      const t = this.peek()
      if (t && t.t === 'op' && ['=', '<>', '<', '>', '<=', '>='].includes(t.v)) {
        this.i++
        a = { k: 'bin', op: t.v, a, b: this.add() }
      } else return a
    }
  }
  add(): Expr {
    let a = this.mul()
    for (;;) {
      const t = this.peek()
      if (t && t.t === 'op' && (t.v === '+' || t.v === '-')) {
        this.i++
        a = { k: 'bin', op: t.v, a, b: this.mul() }
      } else return a
    }
  }
  mul(): Expr {
    let a = this.pow()
    for (;;) {
      const t = this.peek()
      if (t && ((t.t === 'op' && (t.v === '*' || t.v === '/' || t.v === 'mod')) || (t.t === 'id' && t.v === 'mod'))) {
        this.i++
        a = { k: 'bin', op: t.v, a, b: this.pow() }
      } else return a
    }
  }
  pow(): Expr {
    const a = this.unary()
    if (this.isOp('^')) {
      this.i++
      return { k: 'bin', op: '^', a, b: this.pow() }
    }
    return a
  }
  unary(): Expr {
    if (this.isOp('-')) {
      this.i++
      return { k: 'un', op: '-', e: this.unary() }
    }
    if (this.isOp('+')) {
      this.i++
      return this.unary()
    }
    return this.primary()
  }
  primary(): Expr {
    const t = this.peek()
    if (!t) throw new PseudoError('Falta un valor al final de la expresión.', this.line)
    this.i++
    if (t.t === 'num') return { k: 'lit', v: t.v }
    if (t.t === 'str') return { k: 'lit', v: t.v }
    if (t.t === 'op' && t.v === '(') {
      const e = this.parse()
      this.eat(')')
      return e
    }
    if (t.t === 'id') {
      if (t.v === 'verdadero') return { k: 'lit', v: true }
      if (t.v === 'falso') return { k: 'lit', v: false }
      if (t.v === 'pi') return { k: 'lit', v: Math.PI }
      if (FUNCS.includes(t.v) && this.isOp('(')) {
        this.i++
        const args: Expr[] = []
        if (!this.isOp(')'))
          for (;;) {
            args.push(this.parse())
            if (this.isOp(',')) this.i++
            else break
          }
        this.eat(')')
        return { k: 'call', fn: t.v, args }
      }
      if (KEYWORDS.has(t.v)) throw new PseudoError(`«${t.raw}» es una palabra reservada: no se puede usar como valor.`, this.line)
      return { k: 'var', name: t.v, raw: t.raw }
    }
    throw new PseudoError(`No esperaba «${t.v}» acá.`, this.line)
  }
}

const KEYWORDS = new Set(
  'algoritmo proceso finalgoritmo finproceso definir como escribir imprimir mostrar leer si entonces sino finsi mientras hacer finmientras para hasta con paso finpara repetir que segun finsegun de otro modo y o no mod'.split(' '),
)

/* ================================================================== sentencias */

type Stmt =
  | { k: 'write'; line: number; exprs: Expr[]; newline: boolean }
  | { k: 'read'; line: number; vars: { name: string; raw: string }[] }
  | { k: 'assign'; line: number; name: string; e: Expr }
  | { k: 'define'; line: number; names: string[]; tipo: string }
  | { k: 'if'; line: number; cond: Expr; then: Stmt[]; else: Stmt[] }
  | { k: 'while'; line: number; cond: Expr; body: Stmt[] }
  | { k: 'repeat'; line: number; cond: Expr; body: Stmt[] }
  | { k: 'for'; line: number; v: string; from: Expr; to: Expr; step: Expr | null; body: Stmt[] }
  | { k: 'switch'; line: number; e: Expr; cases: { vals: Expr[]; body: Stmt[] }[]; other: Stmt[] }

interface Line {
  n: number
  toks: Tok[]
}

const head = (l: Line | undefined) => (l && l.toks[0]?.t === 'id' ? l.toks[0].v : '')
const isEnd = (l: Line | undefined, ...words: string[]) => {
  if (!l) return false
  const h = head(l)
  if (words.includes(h)) return true
  // "Fin Si", "Fin Mientras"…
  if (h === 'fin' && l.toks[1]?.t === 'id') return words.includes('fin' + (l.toks[1] as { v: string }).v)
  return false
}

const TIPOS = ['entero', 'real', 'numero', 'numerico', 'caracter', 'texto', 'cadena', 'logico']

export interface Program {
  name: string
  body: Stmt[]
}

export function parse(src: string): Program {
  const lines: Line[] = []
  src.split(/\r?\n/).forEach((text, k) => {
    const toks = lex(text, k + 1)
    if (toks.length) lines.push({ n: k + 1, toks })
  })
  let i = 0
  let name = ''
  const first = lines[0]
  if (first && (head(first) === 'algoritmo' || head(first) === 'proceso')) {
    name = (first.toks[1] as { raw?: string })?.raw ?? ''
    i = 1
  }

  function exprOf(toks: Tok[], n: number, from = 0): Expr {
    const p = new ExprParser(toks.slice(from), n)
    const e = p.parse()
    if (p.i < toks.length - from) {
      const t = toks[from + p.i]
      throw new PseudoError(`Sobra «${t.t === 'id' ? t.raw : t.v}» en la línea. ¿Falta un operador o una coma?`, n)
    }
    return e
  }

  /** separa una lista "a, b, c" respetando paréntesis */
  function splitCommas(toks: Tok[]): Tok[][] {
    const parts: Tok[][] = [[]]
    let depth = 0
    for (const t of toks) {
      if (t.t === 'op' && t.v === '(') depth++
      if (t.t === 'op' && t.v === ')') depth--
      if (t.t === 'op' && t.v === ',' && depth === 0) parts.push([])
      else parts[parts.length - 1].push(t)
    }
    return parts
  }

  function indexOfWord(toks: Tok[], w: string, from = 0) {
    for (let k = from; k < toks.length; k++) if (toks[k].t === 'id' && (toks[k] as { v: string }).v === w) return k
    return -1
  }

  function block(stop: (l: Line) => boolean, what: string, start: number): Stmt[] {
    const out: Stmt[] = []
    for (;;) {
      const l = lines[i]
      if (!l) throw new PseudoError(`Falta cerrar el bloque que empieza en la línea ${start} (${what}).`, start)
      if (stop(l)) return out
      const h = head(l)
      if (h === 'finalgoritmo' || h === 'finproceso' || ['finsi', 'finmientras', 'finpara', 'finsegun', 'hasta'].includes(h))
        throw new PseudoError(`Falta cerrar el bloque que empieza en la línea ${start} (${what}) antes de «${(l.toks[0] as { raw: string }).raw}».`, l.n)
      out.push(stmt())
    }
  }

  function stmt(): Stmt {
    const l = lines[i++]
    const { n, toks } = l
    const h = head(l)
    if (h === 'escribir' || h === 'imprimir' || h === 'mostrar') {
      let rest = toks.slice(1)
      let newline = true
      const sin = indexOfWord(rest, 'sin')
      if (sin >= 0 && (rest[sin + 1] as { v?: string })?.v === 'saltar') {
        newline = false
        rest = rest.slice(0, sin)
      }
      if (!rest.length) return { k: 'write', line: n, exprs: [], newline }
      return { k: 'write', line: n, exprs: splitCommas(rest).map((p) => exprOf(p, n)), newline }
    }
    if (h === 'leer') {
      const vars = splitCommas(toks.slice(1)).map((p) => {
        if (p.length !== 1 || p[0].t !== 'id') throw new PseudoError('Después de Leer va el nombre de una variable.', n)
        return { name: p[0].v, raw: p[0].raw }
      })
      if (!vars.length) throw new PseudoError('Después de Leer va el nombre de una variable.', n)
      return { k: 'read', line: n, vars }
    }
    if (h === 'definir') {
      const como = indexOfWord(toks, 'como')
      if (como < 0) throw new PseudoError('Falta «Como»: Definir edad Como Entero.', n)
      const tipo = (toks[como + 1] as { v?: string })?.v ?? ''
      if (!TIPOS.includes(tipo)) throw new PseudoError('El tipo puede ser Entero, Real, Caracter (o Texto) o Logico.', n)
      const names = splitCommas(toks.slice(1, como)).map((p) => {
        if (p.length !== 1 || p[0].t !== 'id') throw new PseudoError('Nombres de variables separados por comas.', n)
        return p[0].v
      })
      return { k: 'define', line: n, names, tipo }
    }
    if (h === 'si') {
      const ent = indexOfWord(toks, 'entonces')
      const cond = exprOf(ent >= 0 ? toks.slice(0, ent) : toks, n, 1)
      const then = block((x) => isEnd(x, 'sino', 'finsi'), 'Si … FinSi', n)
      let els: Stmt[] = []
      if (head(lines[i]) === 'sino') {
        const sl = lines[i]
        // "SiNo Si …" (encadenado)
        if (sl.toks.length > 1 && (sl.toks[1] as { v?: string }).v === 'si') {
          lines[i] = { n: sl.n, toks: sl.toks.slice(1) }
          els = [stmt()]
          return { k: 'if', line: n, cond, then, else: els }
        }
        i++
        els = block((x) => isEnd(x, 'finsi'), 'SiNo … FinSi', n)
      }
      i++ // FinSi
      return { k: 'if', line: n, cond, then, else: els }
    }
    if (h === 'mientras') {
      const hacer = indexOfWord(toks, 'hacer')
      const cond = exprOf(hacer >= 0 ? toks.slice(0, hacer) : toks, n, 1)
      const body = block((x) => isEnd(x, 'finmientras'), 'Mientras … FinMientras', n)
      i++
      return { k: 'while', line: n, cond, body }
    }
    if (h === 'repetir') {
      const body = block((x) => head(x) === 'hasta', 'Repetir … Hasta Que', n)
      const end = lines[i++]
      const hasQue = (end.toks[1] as { v?: string })?.v === 'que'
      const cond = exprOf(end.toks, end.n, hasQue ? 2 : 1)
      return { k: 'repeat', line: n, cond, body }
    }
    if (h === 'para') {
      const v = toks[1]
      if (!v || v.t !== 'id') throw new PseudoError('Para i <- 1 Hasta 10 Hacer', n)
      const asg = toks[2]
      if (!asg || asg.t !== 'op' || (asg.v !== '<-' && asg.v !== '=')) throw new PseudoError('Falta «<-» después de la variable del Para.', n)
      const hasta = indexOfWord(toks, 'hasta')
      if (hasta < 0) throw new PseudoError('Falta «Hasta» en el Para.', n)
      const con = indexOfWord(toks, 'con', hasta)
      const hacer = indexOfWord(toks, 'hacer', hasta)
      const toEnd = con >= 0 ? con : hacer >= 0 ? hacer : toks.length
      const from = exprOf(toks.slice(3, hasta), n)
      const to = exprOf(toks.slice(hasta + 1, toEnd), n)
      let step: Expr | null = null
      if (con >= 0) {
        const paso = indexOfWord(toks, 'paso', con)
        step = exprOf(toks.slice(paso + 1, hacer >= 0 ? hacer : toks.length), n)
      }
      const body = block((x) => isEnd(x, 'finpara'), 'Para … FinPara', n)
      i++
      return { k: 'for', line: n, v: v.v, from, to, step, body }
    }
    if (h === 'segun') {
      const hacer = indexOfWord(toks, 'hacer')
      const e = exprOf(hacer >= 0 ? toks.slice(0, hacer) : toks, n, 1)
      const cases: { vals: Expr[]; body: Stmt[] }[] = []
      let other: Stmt[] = []
      for (;;) {
        const cl = lines[i]
        if (!cl) throw new PseudoError('Falta FinSegun.', n)
        if (isEnd(cl, 'finsegun')) {
          i++
          break
        }
        if (head(cl) === 'de' && (cl.toks[1] as { v?: string })?.v === 'otro') {
          i++
          other = block((x) => isEnd(x, 'finsegun'), 'De Otro Modo', cl.n)
          continue
        }
        const colon = cl.toks.findIndex((t) => t.t === 'op' && t.v === ':')
        if (colon < 0) throw new PseudoError('Cada opción del Segun termina con «:» (por ejemplo  1: ).', cl.n)
        i++
        const vals = splitCommas(cl.toks.slice(0, colon)).map((p) => exprOf(p, cl.n))
        // puede haber una sentencia en la misma línea después de los dos puntos
        const tail = cl.toks.slice(colon + 1)
        const body: Stmt[] = []
        if (tail.length) {
          lines.splice(i, 0, { n: cl.n, toks: tail })
          body.push(stmt())
        }
        body.push(
          ...block(
            (x) => isEnd(x, 'finsegun') || (head(x) === 'de' && (x.toks[1] as { v?: string })?.v === 'otro') || x.toks.some((t) => t.t === 'op' && t.v === ':'),
            'Segun',
            cl.n,
          ),
        )
        cases.push({ vals, body })
      }
      return { k: 'switch', line: n, e, cases, other }
    }
    if (['finsi', 'finmientras', 'finpara', 'sino', 'finsegun', 'hasta', 'fin'].includes(h))
      throw new PseudoError(`«${(toks[0] as { raw: string }).raw}» no cierra ningún bloque abierto.`, n)
    // asignación
    if (toks[0]?.t === 'id' && toks[1]?.t === 'op' && (toks[1].v === '<-' || toks[1].v === '=')) {
      if (KEYWORDS.has(toks[0].v)) throw new PseudoError(`«${toks[0].raw}» es una palabra reservada.`, n)
      if (toks.length < 3) throw new PseudoError('Falta el valor a asignar.', n)
      return { k: 'assign', line: n, name: toks[0].v, e: exprOf(toks, n, 2) }
    }
    if (toks[0]?.t === 'id' && !KEYWORDS.has(toks[0].v)) throw new PseudoError(`No entiendo la instrucción. ¿Querías asignar?  ${toks[0].raw} <- valor`, n)
    throw new PseudoError('No entiendo esta instrucción.', n)
  }

  const body: Stmt[] = []
  while (i < lines.length) {
    const h = head(lines[i])
    if (h === 'finalgoritmo' || h === 'finproceso' || (h === 'fin' && ['algoritmo', 'proceso'].includes((lines[i].toks[1] as { v?: string })?.v ?? ''))) {
      i++
      if (i < lines.length) throw new PseudoError('Hay instrucciones después de FinAlgoritmo.', lines[i].n)
      return { name, body }
    }
    body.push(stmt())
  }
  if (name) throw new PseudoError('Falta FinAlgoritmo al final.', lines[lines.length - 1]?.n ?? 1)
  return { name, body }
}

/* ================================================================== ejecución */

export interface RunResult {
  output: string[]
  error?: PseudoError
  /** variables al terminar */
  vars: Record<string, Value>
  steps: number
  inputsUsed: number
}

export const MAX_STEPS = 200000

export function fmtValue(v: Value): string {
  if (typeof v === 'boolean') return v ? 'VERDADERO' : 'FALSO'
  if (typeof v === 'number') {
    if (Number.isInteger(v)) return String(v)
    return String(Number(v.toFixed(6)))
  }
  return v
}

export function run(src: string, inputs: string[]): RunResult {
  const output: string[] = ['']
  const vars: Record<string, Value> = {}
  const types: Record<string, string> = {}
  let steps = 0
  let inp = 0
  const write = (s: string) => (output[output.length - 1] += s)
  const tick = (line: number) => {
    if (++steps > MAX_STEPS) throw new PseudoError('El programa no termina nunca: ¿hay un bucle sin fin? Revisá que la condición pueda cambiar.', line)
  }

  function num(v: Value, line: number, what: string): number {
    if (typeof v === 'number') return v
    if (typeof v === 'boolean') throw new PseudoError(`No se puede hacer ${what} con un valor lógico.`, line)
    throw new PseudoError(`No se puede hacer ${what} con el texto "${v}". ¿Faltan comillas o sobra alguna?`, line)
  }

  function ev(e: Expr, line: number): Value {
    switch (e.k) {
      case 'lit':
        return e.v
      case 'var':
        if (!(e.name in vars)) throw new PseudoError(`La variable «${e.raw}» todavía no tiene valor. ¿La leíste o le asignaste algo antes?`, line)
        return vars[e.name]
      case 'un': {
        const v = ev(e.e, line)
        if (e.op === 'no') {
          if (typeof v !== 'boolean') throw new PseudoError('NO se usa con una condición (verdadero o falso).', line)
          return !v
        }
        return -num(v, line, 'una resta')
      }
      case 'bin': {
        if (e.op === 'y' || e.op === 'o') {
          const a = ev(e.a, line)
          if (typeof a !== 'boolean') throw new PseudoError(`«${e.op.toUpperCase()}» une dos condiciones (por ejemplo  x > 0 Y x < 10).`, line)
          if (e.op === 'y' && !a) return false
          if (e.op === 'o' && a) return true
          const b = ev(e.b, line)
          if (typeof b !== 'boolean') throw new PseudoError(`«${e.op.toUpperCase()}» une dos condiciones.`, line)
          return b
        }
        const a = ev(e.a, line)
        const b = ev(e.b, line)
        if (['=', '<>', '<', '>', '<=', '>='].includes(e.op)) {
          if (typeof a !== typeof b) {
            if (e.op === '=') return false
            if (e.op === '<>') return true
            throw new PseudoError('No se puede comparar un número con un texto.', line)
          }
          const x = typeof a === 'string' ? norm(a) : a
          const y = typeof b === 'string' ? norm(b as string) : b
          switch (e.op) {
            case '=':
              return x === y
            case '<>':
              return x !== y
            case '<':
              return x < y
            case '>':
              return x > y
            case '<=':
              return x <= y
            default:
              return x >= y
          }
        }
        if (e.op === '+' && (typeof a === 'string' || typeof b === 'string')) return fmtValue(a) + fmtValue(b)
        const x = num(a, line, e.op === '+' ? 'una suma' : e.op === '-' ? 'una resta' : e.op === '*' ? 'una multiplicación' : 'una división')
        const y = num(b, line, e.op === '+' ? 'una suma' : e.op === '-' ? 'una resta' : e.op === '*' ? 'una multiplicación' : 'una división')
        switch (e.op) {
          case '+':
            return x + y
          case '-':
            return x - y
          case '*':
            return x * y
          case '/':
            if (y === 0) throw new PseudoError('División por cero.', line)
            return x / y
          case 'mod':
            if (y === 0) throw new PseudoError('MOD por cero.', line)
            return x % y
          default:
            return Math.pow(x, y)
        }
      }
      case 'call': {
        const a = e.args.map((x) => ev(x, line))
        const n0 = () => num(a[0], line, e.fn)
        switch (e.fn) {
          case 'raiz':
          case 'rc':
            return Math.sqrt(n0())
          case 'abs':
            return Math.abs(n0())
          case 'trunc':
            return Math.trunc(n0())
          case 'redon':
            return Math.round(n0())
          case 'azar':
          case 'aleatorio':
            return Math.floor(Math.random() * n0())
          case 'longitud':
            return String(a[0]).length
          case 'mayusculas':
            return String(a[0]).toUpperCase()
          case 'minusculas':
            return String(a[0]).toLowerCase()
          case 'concatenar':
            return a.map(fmtValue).join('')
          case 'subcadena':
            return String(a[0]).slice(num(a[1], line, 'subcadena'), num(a[2], line, 'subcadena') + 1)
          case 'convertiranumero':
            return Number(String(a[0]).replace(',', '.'))
          default:
            return fmtValue(a[0])
        }
      }
    }
  }

  function cond(e: Expr, line: number): boolean {
    const v = ev(e, line)
    if (typeof v !== 'boolean') throw new PseudoError('La condición tiene que dar verdadero o falso (por ejemplo  edad >= 18 ).', line)
    return v
  }

  function assign(name: string, v: Value, line: number) {
    const t = types[name]
    if (t === 'entero' && typeof v === 'number') v = Math.trunc(v)
    if (t && ['entero', 'real', 'numero', 'numerico'].includes(t) && typeof v !== 'number') throw new PseudoError('Esa variable es numérica y le querés guardar un texto.', line)
    vars[name] = v
  }

  function exec(list: Stmt[]) {
    for (const s of list) {
      tick(s.line)
      switch (s.k) {
        case 'write':
          write(s.exprs.map((e) => fmtValue(ev(e, s.line))).join(''))
          if (s.newline) output.push('')
          break
        case 'read':
          for (const v of s.vars) {
            if (inp >= inputs.length) throw new PseudoError(`El programa quiere leer «${v.raw}» pero no hay más datos en la entrada.`, s.line)
            const raw = inputs[inp++].trim()
            const t = types[v.name]
            const asNum = Number(raw.replace(',', '.'))
            let val: Value = raw
            if (t === 'logico') val = ['verdadero', 'v', 'si', '1'].includes(norm(raw))
            else if (t && ['caracter', 'texto', 'cadena'].includes(t)) val = raw
            else if (raw !== '' && Number.isFinite(asNum)) val = asNum
            assign(v.name, val, s.line)
          }
          break
        case 'define':
          for (const n of s.names) types[n] = s.tipo
          break
        case 'assign':
          assign(s.name, ev(s.e, s.line), s.line)
          break
        case 'if':
          exec(cond(s.cond, s.line) ? s.then : s.else)
          break
        case 'while':
          while (cond(s.cond, s.line)) {
            tick(s.line)
            exec(s.body)
          }
          break
        case 'repeat':
          do {
            tick(s.line)
            exec(s.body)
          } while (!cond(s.cond, s.line))
          break
        case 'for': {
          const from = num(ev(s.from, s.line), s.line, 'el Para')
          const to = num(ev(s.to, s.line), s.line, 'el Para')
          const step = s.step ? num(ev(s.step, s.line), s.line, 'el Para') : 1
          if (step === 0) throw new PseudoError('El paso del Para no puede ser 0.', s.line)
          vars[s.v] = from
          while (step > 0 ? (vars[s.v] as number) <= to : (vars[s.v] as number) >= to) {
            tick(s.line)
            exec(s.body)
            vars[s.v] = (vars[s.v] as number) + step
          }
          break
        }
        case 'switch': {
          const v = ev(s.e, s.line)
          const hit = s.cases.find((c) => c.vals.some((x) => ev(x, s.line) === v))
          exec(hit ? hit.body : s.other)
          break
        }
      }
    }
  }

  try {
    const prog = parse(src)
    exec(prog.body)
    if (output[output.length - 1] === '') output.pop()
    return { output, vars, steps, inputsUsed: inp }
  } catch (err) {
    if (output[output.length - 1] === '') output.pop()
    const e = err instanceof PseudoError ? err : new PseudoError(String((err as Error).message ?? err), 0)
    return { output, error: e, vars, steps, inputsUsed: inp }
  }
}

/** Palabras clave que usa un programa (para exigir, por ejemplo, un Mientras). */
export function usesKeyword(src: string, word: string) {
  const w = norm(word)
  return src
    .split(/\r?\n/)
    .map((l) => norm(l.replace(/\/\/.*$/, '').replace(/"[^"]*"/g, '')))
    .some((l) => new RegExp(`(^|[^a-z])${w}([^a-z]|$)`).test(l))
}
