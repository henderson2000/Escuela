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

export interface JavaTest {
  text: string
  /** lo que se escribe en la entrada (System.in) para esta prueba */
  input?: string
  /** recibe la salida del programa (System.out) y el código fuente */
  check: (out: string, code: string) => boolean
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

export interface JavaLesson extends LessonBase {
  kind: 'java'
  starter: string
  solution: string
  tests: JavaTest[]
  /** entrada de ejemplo que aparece cargada en el recuadro «Entrada» */
  sampleInput?: string
}

export type Lesson = WebLesson | JavaLesson

export interface CourseModule {
  id: string
  title: string
  desc: string
  lessons: Lesson[]
}

export interface Track {
  id: 'html' | 'css' | 'java'
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

/** quita comentarios y textos del código Java para buscar palabras clave sin falsos positivos */
export const codeOnly = (src: string) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')

/** quita comentarios del CSS / HTML */
export const cssOnly = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')
