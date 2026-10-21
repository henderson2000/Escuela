import { GATE_EXPR, GATE_NAMES, GateSymbol, gateEval, type Gate, type GateStyle } from '../GateSymbols'
import { QuizGame, pickOne, shuffle, type QuizRound } from './QuizGame'

const GATES: Gate[] = ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR']
const STYLE_NAMES: Record<GateStyle, string> = { ansi: 'símbolo ANSI', iec: 'símbolo del LOGO! (IEC)', contactos: 'equivalente en contactos' }

function options(right: Gate, label: (g: Gate) => string) {
  const others = shuffle(GATES.filter((g) => g !== right)).slice(0, 3)
  return shuffle([right, ...others]).map((g) => ({ id: g, label: label(g) }))
}

function TruthMini({ gate }: { gate: Gate }) {
  const rows = gate === 'NOT' ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]]
  return (
    <table className="tt mini">
      <thead>
        <tr>
          <th>a</th>
          {gate !== 'NOT' && <th>b</th>}
          <th className="out">z</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((v, k) => (
              <td key={k}>{v}</td>
            ))}
            <td className="out">{gateEval(gate, r[0], r[1] ?? 0)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function makeRound(): QuizRound {
  const gate = pickOne(GATES)
  const style = pickOne<GateStyle>(['ansi', 'iec', 'contactos'])
  const kind = pickOne(['nombre', 'nombre', 'salida', 'tabla', 'expresion'] as const)
  if (kind === 'salida') {
    const a = Math.round(Math.random())
    const b = gate === 'NOT' ? 0 : Math.round(Math.random())
    const z = gateEval(gate, a, b)
    return {
      prompt: (
        <>
          Con a = {a}
          {gate !== 'NOT' && <> y b = {b}</>}, ¿cuánto vale la salida z?
        </>
      ),
      visual: <GateSymbol gate={gate} style={style} width={260} values={{ a, b: gate === 'NOT' ? undefined : b }} />,
      options: [
        { id: '0', label: 'z = 0' },
        { id: '1', label: 'z = 1' },
      ],
      answer: String(z),
      explain: (
        <>
          Es una {GATE_NAMES[gate]}: {GATE_EXPR[gate]}.
        </>
      ),
    }
  }
  if (kind === 'tabla') {
    return {
      prompt: '¿Qué función tiene esta tabla de la verdad?',
      visual: <TruthMini gate={gate} />,
      options: options(gate, (g) => GATE_NAMES[g]),
      answer: gate,
      explain: <>Es la tabla de la {GATE_NAMES[gate]}.</>,
    }
  }
  if (kind === 'expresion') {
    return {
      prompt: '¿Qué expresión corresponde a este símbolo?',
      visual: <GateSymbol gate={gate} style={style} width={260} />,
      options: options(gate, (g) => GATE_EXPR[g]),
      answer: gate,
      explain: (
        <>
          Es una {GATE_NAMES[gate]}: {GATE_EXPR[gate]}.
        </>
      ),
    }
  }
  return {
    prompt: <>¿Qué función es? (está dibujada como {STYLE_NAMES[style]})</>,
    visual: <GateSymbol gate={gate} style={style} width={260} />,
    options: options(gate, (g) => GATE_NAMES[g]),
    answer: gate,
    explain: <>Es una {GATE_NAMES[gate]}.</>,
  }
}

export function GatesGame() {
  return (
    <QuizGame
      game="logo-compuertas"
      title="Compuertas al toque"
      icon="🔣"
      info="Reconocé funciones lógicas dibujadas como símbolo ANSI, como bloque del LOGO! o como contactos. Cuanto más rápido, más puntos."
      intro={<p>10 preguntas. Respuesta correcta: 15 puntos + hasta 5 de bonus por rapidez (máximo 200).</p>}
      makeRounds={() => Array.from({ length: 10 }, makeRound)}
    />
  )
}
