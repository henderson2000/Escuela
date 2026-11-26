// Datos de Actuators (partes, textos y cálculos) sin three.js: los usan las páginas de teoría y del taller,
// que así no tienen que esperar a que se descargue el 3D.

/* ------------------------------------------------------------------ */
/* Transistor NPN en encapsulado TO-92                                 */
/* ------------------------------------------------------------------ */

export const TRANSISTORS = {
  BC547: { pins: ['C', 'B', 'E'], beta: 200, icMax: 100, label: 'BC547' },
  '2N2222': { pins: ['E', 'B', 'C'], beta: 150, icMax: 600, label: '2N2222' },
} as const
