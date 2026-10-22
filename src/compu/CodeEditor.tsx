import { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState, Compartment, StateEffect, StateField, RangeSetBuilder } from '@codemirror/state'
import { Decoration, keymap, type DecorationSet } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { java } from '@codemirror/lang-java'
import { oneDark } from '@codemirror/theme-one-dark'

export type Lang = 'html' | 'css' | 'java'

const setErrors = StateEffect.define<number[]>()
const errorField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    deco = deco.map(tr.changes)
    for (const e of tr.effects) {
      if (!e.is(setErrors)) continue
      const b = new RangeSetBuilder<Decoration>()
      for (const n of [...new Set(e.value)].sort((x, y) => x - y)) {
        if (n < 1 || n > tr.state.doc.lines) continue
        const from = tr.state.doc.line(n).from
        b.add(from, from, Decoration.line({ class: 'err-line' }))
      }
      deco = b.finish()
    }
    return deco
  },
  provide: (f) => EditorView.decorations.from(f),
})

const langOf = (l: Lang) => (l === 'html' ? html() : l === 'css' ? css() : java())

const theme = EditorView.theme({
  '&': { fontSize: '14px', height: '100%' },
  '.cm-scroller': { fontFamily: "ui-monospace, 'Cascadia Code', 'Fira Code', Consolas, monospace", lineHeight: '1.5' },
  '.cm-content': { paddingBottom: '40px' },
  '&.cm-focused': { outline: 'none' },
})

/** Editor de código con colores, números de línea, autocierre y sangría automática. */
export function CodeEditor({
  value,
  onChange,
  lang,
  readOnly = false,
  onRun,
  errorLines = [],
}: {
  value: string
  onChange?: (v: string) => void
  lang: Lang
  readOnly?: boolean
  /** Ctrl+Enter */
  onRun?: () => void
  /** líneas a marcar con error */
  errorLines?: number[]
}) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onRunRef = useRef(onRun)
  onRunRef.current = onRun
  const ro = useRef(new Compartment())

  useEffect(() => {
    if (!host.current) return
    const v = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          keymap.of([
            indentWithTab,
            {
              key: 'Mod-Enter',
              run: () => {
                onRunRef.current?.()
                return true
              },
            },
          ]),
          langOf(lang),
          errorField,
          oneDark,
          theme,
          ro.current.of([EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)]),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) onChangeRef.current?.(u.state.doc.toString())
          }),
        ],
      }),
    })
    view.current = v
    return () => {
      v.destroy()
      view.current = null
    }
    // el editor se crea una sola vez por lenguaje
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  // si el valor cambia desde afuera (reiniciar código), se reemplaza el texto
  useEffect(() => {
    const v = view.current
    if (!v) return
    const cur = v.state.doc.toString()
    if (cur !== value) v.dispatch({ changes: { from: 0, to: cur.length, insert: value } })
  }, [value])

  useEffect(() => {
    view.current?.dispatch({ effects: ro.current.reconfigure([EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)]) })
  }, [readOnly])

  // marca las líneas con error
  const errKey = errorLines.join(',')
  useEffect(() => {
    view.current?.dispatch({ effects: setErrors.of(errKey ? errKey.split(',').map(Number) : []) })
  }, [errKey])

  return <div className="code-editor" ref={host} />
}
