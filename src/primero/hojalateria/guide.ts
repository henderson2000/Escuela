// Guía de Hojalatería, 1er año: planos, desarrollos y ciclos de fabricación de la caja, la tapa y la budinera.
import type { GuideSection } from '../../lib/subject'

export const HOJALATERIA1_GUIDE: GuideSection[] = [
  {
    id: 'h1g-planos',
    title: 'Lectura de planos y desarrollos',
    intro: 'Mirá los planos (en Teoría → "Medir y trazar" está el desarrollo interactivo) y respondé.',
    activities: [
      { id: 'h1g-p1', type: 'num', q: 'Caja cartuchera (Ej. 01-01): ¿cuánto mide el lado corto del desarrollo? (mm)', answer: 130, tolerance: 0, unit: 'mm', explain: 'Desarrollo de 130 × 290 mm.' },
      { id: 'h1g-p2', type: 'num', q: 'Caja: ¿a cuántos mm del borde va la línea de plegado de los laterales?', answer: 35, tolerance: 0, unit: 'mm', explain: 'Las pestañas a 5 mm y los laterales a 35 mm.' },
      { id: 'h1g-p3', type: 'num', q: 'Caja: si los laterales se pliegan a 35 mm y la pestaña ocupa 5 mm, ¿qué alto tiene la pared? (mm)', answer: 30, tolerance: 0, unit: 'mm', explain: '35 − 5 = 30 mm.' },
      { id: 'h1g-p4', type: 'num', q: 'Caja: ¿cuánto mide el fondo de largo? (290 − 2 × 35, en mm)', answer: 220, tolerance: 0, unit: 'mm', explain: '290 − 70 = 220 mm.' },
      { id: 'h1g-p5', type: 'num', q: 'Tapa (Ej. 02-01): ¿cuánto mide el desarrollo de largo? (mm)', answer: 262, tolerance: 0, unit: 'mm', explain: 'Desarrollo de 102 × 262 mm.' },
      { id: 'h1g-p6', type: 'num', q: 'Tapa: ¿cuánto mide el fondo de ancho? (102 − 2 × 20, en mm)', answer: 62, tolerance: 0, unit: 'mm', explain: '102 − 40 = 62 mm.' },
      { id: 'h1g-p7', type: 'num', q: 'Budinera (Ej. 03): ¿a cuántos mm del borde va el dobladillo?', answer: 8, tolerance: 0, unit: 'mm', explain: 'Líneas a 8 mm y a 63 mm.' },
      { id: 'h1g-p8', type: 'num', q: 'Budinera: ¿cuánto mide el fondo de ancho? (200 − 2 × 63, en mm)', answer: 74, tolerance: 0, unit: 'mm', explain: '200 − 126 = 74 mm.' },
      { id: 'h1g-p9', type: 'mc', q: 'En el plano, ¿qué indica una línea de trazos?', options: ['Una línea de plegado', 'Un corte', 'Una medida', 'Un agujero'], answer: 0, explain: 'Las líneas llenas gruesas son el contorno y los cortes.' },
      { id: 'h1g-p10', type: 'mc', q: '¿Qué material y espesor llevan los tres proyectos?', options: ['Chapa galvanizada Nº 30', 'Hojalata de 3 mm', 'Acero IRAM 1010 de 22 mm', 'Aluminio de 1 mm'], answer: 0, explain: 'Chapa fina, se corta con tijera.' },
    ],
  },
  {
    id: 'h1g-caja',
    title: 'Ciclo de fabricación: caja y tapa de la cartuchera',
    intro: 'Las dos piezas siguen el mismo ciclo; cambian las medidas y el sentido de las pestañas.',
    activities: [
      { id: 'h1g-c1', type: 'mc', q: 'Operación 10: ¿qué se hace?', options: ['Recepción de la materia prima y control dimensional', 'Plegar los laterales', 'Cortar las diagonales', 'Soldar por punto'], answer: 0, explain: 'Siempre se controla la medida de la chapa antes de empezar.' },
      { id: 'h1g-c2', type: 'mc', q: 'Operación 20: ¿con qué se trazan las paralelas a los bordes?', options: ['Con el gramil', 'Con la tijera', 'Con el granete', 'Con la bigornia'], answer: 0, explain: 'En las dos caras de la chapa.' },
      { id: 'h1g-c3', type: 'mc', q: '¿Con qué se corta la chapa en las operaciones 50 y 60?', options: ['Tijera de hojalatero', 'Guillotina', 'Plasma', 'Sierra sensitiva'], answer: 0, explain: 'La chapa Nº 30 es muy fina.' },
      { id: 'h1g-c4', type: 'mc', q: '¿Qué diferencia hay entre la caja y la tapa en la operación 80?', options: ['En la caja las pestañas cortas van en sentido opuesto; en la tapa, en el mismo sentido', 'Ninguna', 'La tapa no tiene pestañas', 'La caja se suelda'], answer: 0, explain: 'Así la tapa calza sobre la caja.' },
      { id: 'h1g-c5', type: 'mc', q: '¿Qué se pliega en la operación 90?', options: ['Los laterales', 'Las pestañas', 'Los triángulos', 'Nada'], answer: 0, explain: 'Por las líneas de 35 mm (caja) o 20 mm (tapa).' },
      { id: 'h1g-c6', type: 'mc', q: '¿Cómo se cierra la caja en la operación 100?', options: ['Plegando los triángulos (orejas) sobre las cabeceras', 'Soldando', 'Con remaches', 'Con pegamento'], answer: 0, explain: 'Plegadora y martillo de hojalatero.' },
      { id: 'h1g-c7', type: 'mc', q: '¿Qué herramientas se usan para plegar?', options: ['Plegadora y martillo de hojalatero', 'Tijera y gramil', 'Granete y compás', 'Soldadora'], answer: 0, explain: 'Operaciones 70 a 100.' },
    ],
  },
  {
    id: 'h1g-budinera',
    title: 'Ciclo de fabricación: budinera',
    intro: 'Paredes inclinadas, esquinas plegadas y dobladillo en el borde.',
    activities: [
      { id: 'h1g-b1', type: 'num', q: 'Operación 30: ¿a cuántos mm de la línea de 63 mm se marca el punto sobre la recta de 8 mm?', answer: 18, tolerance: 0, unit: 'mm', explain: 'Pieza vertical: 18 mm. Así se abre la cabecera.' },
      { id: 'h1g-b2', type: 'num', q: 'Operación 40: con la pieza horizontal, ¿a cuántos mm?', answer: 15, tolerance: 0, unit: 'mm', explain: '15 mm.' },
      { id: 'h1g-b3', type: 'mc', q: 'Operación 90: ¿cómo se pliegan las rectas de 63 mm?', options: ['Con ángulo agudo, hacia el interior', 'A 180°', 'Hacia afuera, planas', 'No se pliegan'], answer: 0, explain: 'Las paredes quedan inclinadas.' },
      { id: 'h1g-b4', type: 'mc', q: 'Operación 110: ¿qué se hace con las rectas de 8 mm?', options: ['Se pliegan hacia el exterior y se cierran con el martillo', 'Se cortan', 'Se sueldan', 'Se trazan'], answer: 0, explain: 'Es el dobladillo: refuerza el borde y no corta.' },
      { id: 'h1g-b5', type: 'mc', q: '¿Cómo se unen los pliegues de las esquinas en la operación 120?', options: ['Con soldadura por punto', 'Con estaño', 'Con tornillos', 'Con engrafado'], answer: 0, explain: 'Soldadura por resistencia.' },
      { id: 'h1g-b6', type: 'mc', q: '¿Por qué el borde de la budinera lleva dobladillo?', options: ['Para reforzarlo y que no corte', 'Para que pese más', 'Por estética solamente', 'Para medir'], answer: 0, explain: 'Un borde de chapa fina sin doblar es filoso.' },
    ],
  },
]
