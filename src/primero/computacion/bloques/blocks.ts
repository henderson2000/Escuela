// Bloques en castellano para el robot del taller (Blockly).
import * as Blockly from 'blockly/core'
import 'blockly/blocks'
import * as Es from 'blockly/msg/es'
import type { ToolboxBlock } from './world'

let ready = false

const MOVE = 210
const ACTION = 35
const CONTROL = 120
const SENSOR = 290
const VARS = 330
const PROC = 260

export function setupBlocks() {
  if (ready) return
  ready = true
  Blockly.setLocale(Es as unknown as Record<string, string>)
  Blockly.common.defineBlocksWithJsonArray([
    { type: 'al_empezar', message0: '▶ al empezar', nextStatement: null, colour: 45, tooltip: 'El programa arranca acá.' },
    { type: 'avanzar', message0: '⬆ avanzar', previousStatement: null, nextStatement: null, colour: MOVE, tooltip: 'Avanza una casilla hacia donde mira.' },
    { type: 'girar_izq', message0: '↺ girar a la izquierda', previousStatement: null, nextStatement: null, colour: MOVE, tooltip: 'Gira 90° sin moverse.' },
    { type: 'girar_der', message0: '↻ girar a la derecha', previousStatement: null, nextStatement: null, colour: MOVE, tooltip: 'Gira 90° sin moverse.' },
    { type: 'juntar', message0: '🔩 juntar tornillo', previousStatement: null, nextStatement: null, colour: ACTION, tooltip: 'Junta el tornillo de la casilla donde está.' },
    { type: 'limpiar', message0: '🧽 limpiar aceite', previousStatement: null, nextStatement: null, colour: ACTION, tooltip: 'Limpia la mancha de aceite de la casilla.' },
    {
      type: 'repetir',
      message0: '🔁 repetir %1 veces',
      args0: [{ type: 'field_number', name: 'TIMES', value: 3, min: 0, max: 100, precision: 1 }],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      colour: CONTROL,
      tooltip: 'Repite lo de adentro la cantidad de veces indicada.',
    },
    {
      type: 'si',
      message0: '❓ si %1 entonces',
      args0: [{ type: 'input_value', name: 'COND', check: 'Boolean' }],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      colour: CONTROL,
      tooltip: 'Si la condición es verdadera, hace lo de adentro.',
    },
    {
      type: 'si_sino',
      message0: '❓ si %1 entonces',
      args0: [{ type: 'input_value', name: 'COND', check: 'Boolean' }],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      message2: 'si no',
      message3: '%1',
      args3: [{ type: 'input_statement', name: 'ELSE' }],
      previousStatement: null,
      nextStatement: null,
      colour: CONTROL,
      tooltip: 'Si la condición es verdadera hace lo primero; si no, lo segundo.',
    },
    {
      type: 'repetir_hasta',
      message0: '🔁 repetir hasta que %1',
      args0: [{ type: 'input_value', name: 'COND', check: 'Boolean' }],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      colour: CONTROL,
      tooltip: 'Repite lo de adentro hasta que la condición se cumpla.',
    },
    {
      type: 'mientras',
      message0: '🔁 mientras %1',
      args0: [{ type: 'input_value', name: 'COND', check: 'Boolean' }],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      colour: CONTROL,
      tooltip: 'Repite lo de adentro mientras la condición sea verdadera.',
    },
    { type: 'no', message0: 'no %1', args0: [{ type: 'input_value', name: 'BOOL', check: 'Boolean' }], output: 'Boolean', colour: SENSOR, tooltip: 'Da vuelta la condición: verdadero ↔ falso.' },
    { type: 'hay_tornillo', message0: 'hay tornillo acá', output: 'Boolean', colour: SENSOR, tooltip: 'Verdadero si en la casilla del robot hay un tornillo.' },
    { type: 'hay_aceite', message0: 'hay aceite acá', output: 'Boolean', colour: SENSOR, tooltip: 'Verdadero si en la casilla hay aceite.' },
    { type: 'hay_pared', message0: 'hay pared adelante', output: 'Boolean', colour: SENSOR, tooltip: 'Verdadero si adelante hay una caja o el borde.' },
    { type: 'en_meta', message0: 'llegué a la meta', output: 'Boolean', colour: SENSOR, tooltip: 'Verdadero si el robot está en la meta.' },
    {
      type: 'decir',
      message0: '💬 decir %1',
      args0: [{ type: 'input_value', name: 'VALUE', check: 'Number' }],
      previousStatement: null,
      nextStatement: null,
      colour: VARS,
      tooltip: 'El robot dice un número.',
    },
    {
      type: 'procedimiento',
      message0: '🧩 definir %1',
      args0: [{ type: 'field_input', name: 'NAME', text: 'juntar fila' }],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'STACK' }],
      colour: PROC,
      tooltip: 'Un bloque propio: lo de adentro se ejecuta cada vez que se usa «hacer» con este nombre.',
    },
    {
      type: 'hacer',
      message0: '🧩 hacer %1',
      args0: [{ type: 'field_input', name: 'NAME', text: 'juntar fila' }],
      previousStatement: null,
      nextStatement: null,
      colour: PROC,
      tooltip: 'Ejecuta el procedimiento con ese nombre.',
    },
  ])
}

/** Caja de bloques del nivel (lista simple, sin categorías). */
export function toolboxFor(items: ToolboxBlock[]): Blockly.utils.toolbox.ToolboxDefinition {
  const contents: Blockly.utils.toolbox.ToolboxItemInfo[] = []
  for (const it of items) {
    if (it === 'variables') {
      contents.push(
        { kind: 'block', type: 'variables_set', fields: { VAR: { name: 'tornillos' } }, inputs: { VALUE: { shadow: { type: 'math_number', fields: { NUM: 0 } } } } } as Blockly.utils.toolbox.BlockInfo,
        { kind: 'block', type: 'math_change', fields: { VAR: { name: 'tornillos' } }, inputs: { DELTA: { shadow: { type: 'math_number', fields: { NUM: 1 } } } } } as Blockly.utils.toolbox.BlockInfo,
        { kind: 'block', type: 'variables_get', fields: { VAR: { name: 'tornillos' } } } as Blockly.utils.toolbox.BlockInfo,
      )
    } else if (it === 'procedimiento') {
      contents.push({ kind: 'block', type: 'procedimiento' }, { kind: 'block', type: 'hacer' })
    } else if (it === 'decir') {
      contents.push({ kind: 'block', type: 'decir', inputs: { VALUE: { shadow: { type: 'math_number', fields: { NUM: 0 } } } } } as Blockly.utils.toolbox.BlockInfo)
    } else contents.push({ kind: 'block', type: it })
  }
  return { kind: 'flyoutToolbox', contents }
}

export const darkTheme = () =>
  Blockly.Theme.defineTheme('villada-oscuro', {
    name: 'villada-oscuro',
    base: Blockly.Themes.Classic,
    componentStyles: {
      workspaceBackgroundColour: '#0f1522',
      toolboxBackgroundColour: '#161e2e',
      flyoutBackgroundColour: '#161e2e',
      flyoutOpacity: 1,
      scrollbarColour: '#3b4a63',
      insertionMarkerColour: '#36c2ff',
      cursorColour: '#36c2ff',
    },
    fontStyle: { family: 'system-ui, sans-serif', size: 12, weight: '600' },
  })

export { Blockly }
