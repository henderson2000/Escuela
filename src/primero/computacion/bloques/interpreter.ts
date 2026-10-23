// Ejecuta un programa de bloques (formato JSON de Blockly) sobre un mapa y devuelve cada paso.
import { DX, DY, atGoal, cellKey, cloneState, oilHere, screwHere, wallAhead, type Dir, type Level, type MapState } from './world'

export interface JBlock {
  type: string
  id: string
  fields?: Record<string, unknown>
  inputs?: Record<string, { block?: JBlock; shadow?: JBlock }>
  next?: { block?: JBlock }
}

export interface Program {
  blocks?: { blocks?: JBlock[] }
  variables?: { name: string; id: string }[]
}

export interface Step {
  blockId: string
  state: MapState
  say?: string
}

export interface RunResult {
  steps: Step[]
  final: MapState
  error?: string
  /** bloque donde ocurrió el error */
  errorBlock?: string
  said: number[]
}

const MAX_OPS = 3000

class Stop extends Error {
  blockId?: string
  constructor(msg: string, blockId?: string) {
    super(msg)
    this.blockId = blockId
  }
}

const inputBlock = (b: JBlock, name: string) => b.inputs?.[name]?.block ?? b.inputs?.[name]?.shadow
const numField = (b: JBlock, name: string) => Number(b.fields?.[name] ?? 0)
const textField = (b: JBlock, name: string) => String(b.fields?.[name] ?? '').trim().toLowerCase()

export function topBlocks(p: Program): JBlock[] {
  return p.blocks?.blocks ?? []
}

/** cantidad de bloques del programa (sin «al empezar» ni los numeritos de los huecos) */
export function countBlocks(p: Program): number {
  let n = 0
  const walk = (b?: JBlock, shadow = false) => {
    if (!b) return
    if (!shadow && b.type !== 'al_empezar') n++
    for (const inp of Object.values(b.inputs ?? {})) {
      if (inp.block) walk(inp.block)
      else if (inp.shadow) walk(inp.shadow, true)
    }
    walk(b.next?.block)
  }
  topBlocks(p).forEach((b) => walk(b))
  return n
}

export function run(p: Program, start: MapState): RunResult {
  let s = cloneState(start)
  const steps: Step[] = []
  const said: number[] = []
  let ops = 0
  const vars = new Map<string, number>()
  const varName = (b: JBlock) => {
    const v = b.fields?.VAR as { id?: string; name?: string } | undefined
    const id = v?.id
    return (p.variables?.find((x) => x.id === id)?.name ?? v?.name ?? 'x').toLowerCase()
  }
  const procs = new Map<string, JBlock | undefined>()
  for (const b of topBlocks(p)) if (b.type === 'procedimiento') procs.set(textField(b, 'NAME'), inputBlock(b, 'STACK'))

  const tick = (id: string) => {
    if (++ops > MAX_OPS) throw new Stop('El programa no termina nunca: ¿hay una repetición sin fin? Revisá la condición de corte.', id)
  }
  const push = (id: string, say?: string) => steps.push({ blockId: id, state: cloneState(s), say })

  const evalBool = (b: JBlock | undefined, owner: JBlock): boolean => {
    if (!b) throw new Stop('Falta la condición: encastrá un sensor (por ejemplo «hay tornillo») en el hueco.', owner.id)
    tick(b.id)
    switch (b.type) {
      case 'hay_tornillo':
        return screwHere(s)
      case 'hay_aceite':
        return oilHere(s)
      case 'hay_pared':
        return wallAhead(s)
      case 'en_meta':
        return atGoal(s)
      case 'no':
        return !evalBool(inputBlock(b, 'BOOL'), b)
      case 'logic_boolean':
        return b.fields?.BOOL === 'TRUE'
      default:
        throw new Stop('Ese bloque no es una condición.', b.id)
    }
  }

  const evalNum = (b: JBlock | undefined, owner: JBlock): number => {
    if (!b) throw new Stop('Falta un número en el hueco.', owner.id)
    switch (b.type) {
      case 'math_number':
        return numField(b, 'NUM')
      case 'variables_get':
        return vars.get(varName(b)) ?? 0
      default:
        throw new Stop('Ese bloque no da un número.', b.id)
    }
  }

  const exec = (b: JBlock | undefined, depth = 0) => {
    if (depth > 60) throw new Stop('Demasiados procedimientos uno adentro del otro: ¿un procedimiento se usa a sí mismo?', b?.id)
    for (let cur = b; cur; cur = cur.next?.block) {
      tick(cur.id)
      switch (cur.type) {
        case 'avanzar': {
          if (wallAhead(s)) throw new Stop('¡Choque! Adelante hay una caja o el borde del taller.', cur.id)
          s = { ...s, x: s.x + DX[s.dir], y: s.y + DY[s.dir] }
          push(cur.id)
          break
        }
        case 'girar_izq':
          s = { ...s, dir: ((s.dir + 3) % 4) as Dir }
          push(cur.id)
          break
        case 'girar_der':
          s = { ...s, dir: ((s.dir + 1) % 4) as Dir }
          push(cur.id)
          break
        case 'juntar': {
          if (!screwHere(s)) throw new Stop('Acá no hay ningún tornillo para juntar.', cur.id)
          const screws = new Set(s.screws)
          screws.delete(cellKey(s.x, s.y))
          s = { ...s, screws }
          push(cur.id)
          break
        }
        case 'limpiar': {
          if (!oilHere(s)) throw new Stop('Acá no hay aceite para limpiar.', cur.id)
          const oil = new Set(s.oil)
          oil.delete(cellKey(s.x, s.y))
          s = { ...s, oil }
          push(cur.id)
          break
        }
        case 'repetir': {
          const n = Math.max(0, Math.min(100, Math.floor(numField(cur, 'TIMES'))))
          for (let i = 0; i < n; i++) exec(inputBlock(cur, 'DO'), depth)
          break
        }
        case 'si':
          if (evalBool(inputBlock(cur, 'COND'), cur)) exec(inputBlock(cur, 'DO'), depth)
          break
        case 'si_sino':
          if (evalBool(inputBlock(cur, 'COND'), cur)) exec(inputBlock(cur, 'DO'), depth)
          else exec(inputBlock(cur, 'ELSE'), depth)
          break
        case 'repetir_hasta':
          while (!evalBool(inputBlock(cur, 'COND'), cur)) exec(inputBlock(cur, 'DO'), depth)
          break
        case 'mientras':
          while (evalBool(inputBlock(cur, 'COND'), cur)) exec(inputBlock(cur, 'DO'), depth)
          break
        case 'variables_set':
          vars.set(varName(cur), evalNum(inputBlock(cur, 'VALUE'), cur))
          push(cur.id)
          break
        case 'math_change':
          vars.set(varName(cur), (vars.get(varName(cur)) ?? 0) + evalNum(inputBlock(cur, 'DELTA'), cur))
          push(cur.id)
          break
        case 'decir': {
          const v = evalNum(inputBlock(cur, 'VALUE'), cur)
          said.push(v)
          push(cur.id, String(v))
          break
        }
        case 'hacer': {
          const name = textField(cur, 'NAME')
          if (!procs.has(name)) throw new Stop(`No existe un procedimiento llamado «${name}». Definilo con el bloque «definir».`, cur.id)
          exec(procs.get(name), depth + 1)
          break
        }
        default:
          throw new Stop('Hay un bloque que el robot no entiende.', cur.id)
      }
    }
  }

  try {
    const starts = topBlocks(p).filter((b) => b.type === 'al_empezar')
    if (starts.length === 0) throw new Stop('Falta el bloque «al empezar»: el programa arranca ahí.')
    if (starts.length > 1) throw new Stop('Hay más de un bloque «al empezar». Dejá uno solo.', starts[1].id)
    exec(starts[0].next?.block)
  } catch (e) {
    if (e instanceof Stop) return { steps, final: s, error: e.message, errorBlock: e.blockId, said }
    throw e
  }
  return { steps, final: s, said }
}

/** ¿Cumplió el objetivo del nivel en este mapa? Devuelve null si está bien o el motivo. */
export function checkGoal(level: Level, start: MapState, r: RunResult): string | null {
  if (r.error) return r.error
  const f = r.final
  if (f.screws.size > 0) return f.screws.size === 1 ? 'Quedó 1 tornillo sin juntar.' : `Quedaron ${f.screws.size} tornillos sin juntar.`
  if (f.oil.size > 0) return f.oil.size === 1 ? 'Quedó 1 mancha de aceite sin limpiar.' : `Quedaron ${f.oil.size} manchas de aceite sin limpiar.`
  if (start.goal && !atGoal(f)) return 'El robot no llegó a la meta 🏁.'
  if (level.say) {
    const want = level.say(start)
    if (r.said.length === 0) return `Falta decir cuántos tornillos juntaste (eran ${want}).`
    if (r.said[r.said.length - 1] !== want) return `El robot dijo ${r.said[r.said.length - 1]}, pero juntó ${want}.`
  }
  return null
}
