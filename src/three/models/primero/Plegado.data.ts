// Datos de Plegado (partes, textos y cálculos) sin three.js: los usan las páginas de teoría y del taller,
// que así no tienen que esperar a que se descargue el 3D.

// Motor de plegado de chapa. Cada panel es un polígono plano (en mm) con sus hijos colgados de una bisagra.
// Coordenadas locales del panel: u a lo largo de la bisagra (eje X), v alejándose de ella (eje Z), la chapa hacia −Y.

export type Poly = [number, number][];

export interface PanelSpec {
  poly: Poly;
  part: string;
  scrap?: boolean;
  children?: ChildSpec[];
}

export interface ChildSpec {
  /** punto de la bisagra en el panel padre (mm) */
  at: [number, number];
  /** giro del sistema del hijo dentro del plano del padre (rad) */
  phi: number;
  /** ángulo de plegado (rad) según el avance 0..1; positivo = hacia arriba (+Y del padre) */
  angle: number;
  panel: PanelSpec;
}

/* ================================================================== caja, tapa y budinera */

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** tramo del avance total (0..1) que le toca a una operación */
export const stage = (p: number, a: number, b: number) =>
  clamp01((p - a) / (b - a));

export const rect = (w: number, h: number): Poly => [
  [0, 0],
  [w, 0],
  [w, h],
  [0, h],
];

/** pestaña de ancho w y alto h con chaflanes a 45° en las puntas */
export const flange = (w: number, h: number): Poly => [
  [0, 0],
  [w, 0],
  [w - h, h],
  [h, h],
];

/**
 * Caja o tapa plegada: fondo (a × b), paredes de alto h con pestaña de 5 mm, y orejas triangulares en las
 * paredes largas que se doblan sobre las cortas.
 */
export function boxSpec(o: {
  a: number;
  b: number;
  h: number;
  f: number;
  p: number;
  mismoSentido: boolean;
  showScrap: boolean;
}): PanelSpec {
  const { a, b, h, f, p } = o;
  const k1 = stage(p, 0, 0.25); // pestañas
  const k2 = stage(p, 0.25, 0.5); // paredes largas
  const k3 = stage(p, 0.5, 0.75); // paredes cortas
  const k4 = stage(p, 0.75, 1); // orejas
  const H = Math.PI / 2;
  const hemLong = Math.PI * k1 * -1; // hacia afuera de la caja
  const hemShort = Math.PI * k1 * (o.mismoSentido ? -1 : 1);
  const ear = (side: 1 | -1): ChildSpec => ({
    at: side === 1 ? [0, 0] : [b, h + f],
    phi: side === 1 ? -H : H,
    // se pliegan hacia adentro y quedan apoyadas por fuera de la cabecera
    angle: H * 0.97 * k4,
    panel: {
      part: "orejas",
      poly:
        side === 1
          ? [
              [0, 0],
              [h + f, 0],
              [h + f, h + f],
            ]
          : [
              [0, 0],
              [h + f, 0],
              [0, h + f],
            ],
    },
  });
  const longWall = (): PanelSpec => ({
    part: "laterales",
    poly: rect(b, h),
    children: [
      {
        at: [0, h],
        phi: 0,
        angle: hemLong,
        panel: { part: "pestanas", poly: rect(b, f) },
      },
      ear(1),
      ear(-1),
    ],
  });
  const shortWall = (): PanelSpec => ({
    part: "cabeceras",
    poly: rect(a, h),
    children: [
      {
        at: [0, h],
        phi: 0,
        angle: hemShort,
        panel: { part: "pestanas", poly: flange(a, f) },
      },
    ],
  });
  const children: ChildSpec[] = [
    { at: [a / 2, b / 2], phi: Math.PI / 2, angle: H * k2, panel: longWall() },
    {
      at: [-a / 2, -b / 2],
      phi: -Math.PI / 2,
      angle: H * k2,
      panel: longWall(),
    },
    { at: [-a / 2, b / 2], phi: 0, angle: H * k3, panel: shortWall() },
    { at: [a / 2, -b / 2], phi: Math.PI, angle: H * k3, panel: shortWall() },
  ];
  // recortes que se sacan con la tijera (sólo con la chapa plana)
  if (o.showScrap && p === 0)
    for (const [sx, sz] of [
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ])
      {
        // el recorte es la mitad de la esquina que no es oreja: se calcula directo sobre el fondo
        const cx = (sx * a) / 2;
        const cz = (sz * b) / 2;
        const hf = h + f;
        children.push({
          at: [0, 0],
          phi: 0,
          angle: 0,
          panel: {
            part: "recortes",
            scrap: true,
            poly: [
              [cx, cz],
              [cx + sx * hf, cz + sz * hf],
              [cx, cz + sz * hf],
            ],
          },
        });
      }
  return {
    part: "fondo",
    poly: [
      [-a / 2, -b / 2],
      [a / 2, -b / 2],
      [a / 2, b / 2],
      [-a / 2, b / 2],
    ],
    children,
  };
}

/** Budinera: fondo 74 × 207, paredes de 55 mm inclinadas hacia afuera, cabeceras trapezoidales y dobladillo de 8 mm. */
export function budineraSpec(p: number): PanelSpec {
  const a = 74;
  const b = 207;
  const h = 55;
  const f = 8;
  const lean = 0.33; // inclinación de las paredes (rad) ≈ 19°
  const k2 = stage(p, 0, 0.35); // paredes largas
  const k3 = stage(p, 0.35, 0.7); // cabeceras
  const k1 = stage(p, 0.7, 1); // dobladillo
  const up = Math.PI / 2 - lean;
  const dx = h * Math.tan(lean); // cuánto se abre la cabecera en el borde (≈ 18 mm)
  // la pared larga se alarga en las puntas para cerrar contra la cabecera inclinada
  const longWall = (): PanelSpec => ({
    part: "laterales",
    poly: [
      [0, 0],
      [b, 0],
      [b + dx, h],
      [-dx, h],
    ],
    children: [
      {
        at: [-dx, h],
        phi: 0,
        angle: -Math.PI * k1,
        panel: { part: "dobladillo", poly: rect(b + 2 * dx, f) },
      },
    ],
  });
  const head = (): PanelSpec => ({
    part: "cabeceras",
    poly: [
      [0, 0],
      [a, 0],
      [a + dx, h],
      [-dx, h],
    ],
    children: [
      {
        at: [-dx, h],
        phi: 0,
        angle: -Math.PI * k1,
        panel: { part: "dobladillo", poly: rect(a + 2 * dx, f) },
      },
    ],
  });
  return {
    part: "fondo",
    poly: [
      [-a / 2, -b / 2],
      [a / 2, -b / 2],
      [a / 2, b / 2],
      [-a / 2, b / 2],
    ],
    children: [
      {
        at: [a / 2, b / 2],
        phi: Math.PI / 2,
        angle: up * k2,
        panel: longWall(),
      },
      {
        at: [-a / 2, -b / 2],
        phi: -Math.PI / 2,
        angle: up * k2,
        panel: longWall(),
      },
      { at: [-a / 2, b / 2], phi: 0, angle: up * k3, panel: head() },
      { at: [a / 2, -b / 2], phi: Math.PI, angle: up * k3, panel: head() },
    ],
  };
}
