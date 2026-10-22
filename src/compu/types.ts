import type { ReactNode } from 'react'

/** Lo que ve una prueba de una lección web (HTML/CSS). */
export interface WebCtx {
  doc: Document
  win: Window
  /** código del alumno */
  html: string
  css: string
  $: (sel: string) => Element | null
  $$: (sel: string) => Element[]
  /** estilo calculado de una propiedad del primer elemento que coincide (o '' si no existe) */
  style: (sel: string, prop: string) => string
  /** texto visible normalizado (sin espacios repetidos) */
  text: (sel: string) => string
}

export interface WebTest {
  /** lo que se pide, en castellano (se muestra como lista de requisitos) */
  text: string
  test: (c: WebCtx) => boolean
}

/** Prueba de un programa de consola: mira lo que escribió con console.log. */
export interface JsTest {
  text: string
  /** respuestas para los prompt(), una por línea */
  input?: string
  /** recibe la salida (console.log) y el código fuente */
  check: (out: string, code: string) => boolean
}

/** Lo que ve una prueba de una lección de JavaScript con HTML. */
export interface DomCtx extends WebCtx {
  js: string
  /** lo que el programa escribió con console.log (cada llamada es un elemento) */
  logs: string[]
  /** errores que hubo al ejecutar */
  errors: string[]
  /** hace clic en el primer elemento que coincide (false si no existe) */
  click: (sel: string) => boolean
  /** escribe un valor en un campo y avisa los eventos input y change (false si no existe) */
  type: (sel: string, value: string) => boolean
  /** aprieta una tecla sobre un elemento (keydown + keyup) */
  press: (sel: string, key: string) => boolean
}

export interface DomTest {
  text: string
  test: (c: DomCtx) => boolean
}

export interface DomCode {
  html: string
  js: string
}

export interface WebCode {
  html: string
  css: string
}

interface LessonBase {
  id: string
  title: string
  /** explicación corta del tema (antes de la consigna) */
  intro: ReactNode
  /** qué tiene que hacer el alumno */
  task: ReactNode
  hint?: ReactNode
}

export interface WebLesson extends LessonBase {
  kind: 'web'
  /** qué archivos se pueden editar */
  edit: ('html' | 'css')[]
  starter: WebCode
  solution: WebCode
  tests: WebTest[]
}

/** Programa de JavaScript en consola (console.log, prompt). */
export interface JsLesson extends LessonBase {
  kind: 'js'
  starter: string
  solution: string
  tests: JsTest[]
  /** respuestas de ejemplo que aparecen cargadas en el recuadro «Entrada» */
  sampleInput?: string
}

/** Página con HTML y JavaScript (botones, campos, textos que cambian). */
export interface DomLesson extends LessonBase {
  kind: 'dom'
  /** qué archivos se pueden editar */
  edit: ('html' | 'js')[]
  starter: DomCode
  solution: DomCode
  tests: DomTest[]
}

export type Lesson = WebLesson | JsLesson | DomLesson

export interface CourseModule {
  id: string
  title: string
  desc: string
  lessons: Lesson[]
}

export interface Track {
  id: 'html' | 'js'
  title: string
  icon: string
  desc: string
  modules: CourseModule[]
}

/* ------------------------------------------------------------------ ayudas para escribir pruebas */

/** Normaliza la salida: saca espacios al final de cada línea y líneas vacías al final. */
export const norm = (s: string) =>
  s
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trimEnd())
    .join('\n')
    .replace(/\n+$/, '')

/** líneas no vacías de la salida */
export const lines = (s: string) =>
  norm(s)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

/** quita comentarios y textos del código (JavaScript) para buscar palabras clave sin falsos positivos */
export const codeOnly = (src: string) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')

/** quita comentarios del CSS / HTML */
export const cssOnly = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')
