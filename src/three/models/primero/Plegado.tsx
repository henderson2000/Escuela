import { useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeepRendering } from "../../keepRendering";
import * as THREE from "three";
import { Part, useParts } from "../../Part";
import { useCanvasTexture } from "../../helpers";

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

const S = 0.1; // mm → unidades (cm)
const T = 0.6; // espesor dibujado (mm), exagerado para que se vea

function useGalvanized() {
  const tex = useCanvasTexture(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = "#b8bec6";
      ctx.fillRect(0, 0, w, h);
      // "flor" del zinc: cristales irregulares con brillos distintos
      let seed = 11;
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let k = 0; k < 220; k++) {
        const x = rnd() * w;
        const y = rnd() * h;
        const r = 10 + rnd() * 36;
        const g = 160 + Math.floor(rnd() * 70);
        ctx.fillStyle = `rgb(${g},${g + 4},${g + 10})`;
        ctx.beginPath();
        const n = 5 + Math.floor(rnd() * 3);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + rnd() * 0.6;
          const rr = r * (0.6 + rnd() * 0.5);
          if (i === 0) ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
          else ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
        }
        ctx.closePath();
        ctx.fill();
      }
    },
    [],
  );
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1 / 140, 1 / 140);
  return tex;
}

function PanelMesh({
  poly,
  scrap,
  map,
}: {
  poly: Poly;
  scrap?: boolean;
  map: THREE.Texture;
}) {
  // la forma no cambia al plegar (sólo los ángulos): se arma una sola vez
  const key = poly.map((q) => q.join(",")).join(";");
  const geo = useMemo(() => {
    const sh = new THREE.Shape(poly.map(([u, v]) => new THREE.Vector2(u, v)));
    return new THREE.ExtrudeGeometry(sh, {
      depth: T,
      bevelEnabled: false,
    }).rotateX(Math.PI / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return (
    <mesh geometry={geo} castShadow receiveShadow>
      {scrap ? (
        <meshStandardMaterial
          color="#ef4444"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      ) : (
        <meshStandardMaterial
          map={map}
          color="#ffffff"
          metalness={0.65}
          roughness={0.38}
          side={THREE.DoubleSide}
        />
      )}
    </mesh>
  );
}

function PanelNode({
  spec,
  map,
  firsts,
  depth,
}: {
  spec: PanelSpec;
  map: THREE.Texture;
  firsts: Set<PanelSpec>;
  depth: number;
}) {
  const c = centroid(spec.poly);
  // al despiezar, cada panel se aleja de su bisagra (y el fondo queda quieto)
  const off = depth === 0 ? 0 : 18 + depth * 6;
  return (
    <>
      <Part
        id={spec.part}
        noLabel={!firsts.has(spec)}
        labelAt={[c[0], 2, c[1]]}
        offset={[0, 0, off]}
      >
        <PanelMesh poly={spec.poly} scrap={spec.scrap} map={map} />
      </Part>
      <Follow off={off}>
        {spec.children?.map((ch, i) => (
          <group
            key={i}
            position={[ch.at[0], 0, ch.at[1]]}
            rotation={[0, ch.phi, 0]}
          >
            <group rotation={[-ch.angle, 0, 0]}>
              <PanelNode
                spec={ch.panel}
                map={map}
                firsts={firsts}
                depth={depth + 1}
              />
            </group>
          </group>
        ))}
      </Follow>
    </>
  );
}

/** Grupo que se desplaza junto con su panel al despiezar (así los pliegues hijos no quedan atrás). */
function Follow({ off, children }: { off: number; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const { explode } = useParts();
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    g.position.z += (off * explode - g.position.z) * (1 - Math.exp(-dt * 8));
  });
  return <group ref={ref}>{children}</group>;
}

/** El primer panel de cada parte (recorriendo el árbol) es el que lleva la etiqueta. */
function firstOfEachPart(root: PanelSpec) {
  const seen = new Set<string>();
  const out = new Set<PanelSpec>();
  const walk = (p: PanelSpec) => {
    if (!seen.has(p.part)) {
      seen.add(p.part);
      out.add(p);
    }
    p.children?.forEach((c) => walk(c.panel));
  };
  walk(root);
  return out;
}

const centroid = (p: Poly): [number, number] => [
  p.reduce((a, q) => a + q[0], 0) / p.length,
  p.reduce((a, q) => a + q[1], 0) / p.length,
];

/** Dibuja una pieza de chapa a partir de su panel raíz (el fondo). */
export function SheetModel({
  root,
  lift = 0,
}: {
  root: PanelSpec;
  lift?: number;
}) {
  const map = useGalvanized();
  const firsts = firstOfEachPart(root);
  return (
    <group scale={S} position={[0, lift, 0]}>
      <PanelNode spec={root} map={map} firsts={firsts} depth={0} />
    </group>
  );
}

/* ================================================================== caja, tapa y budinera */

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
/** tramo del avance total (0..1) que le toca a una operación */
export const stage = (p: number, a: number, b: number) =>
  clamp01((p - a) / (b - a));

const rect = (w: number, h: number): Poly => [
  [0, 0],
  [w, 0],
  [w, h],
  [0, h],
];
/** pestaña de ancho w y alto h con chaflanes a 45° en las puntas */
const flange = (w: number, h: number): Poly => [
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
      children.push({
        at: [(sx * a) / 2, (sz * b) / 2],
        phi:
          sx === sz
            ? sx === 1
              ? 0
              : Math.PI
            : sx === 1
              ? -Math.PI / 2
              : Math.PI / 2,
        angle: 0,
        panel: {
          part: "recortes",
          scrap: true,
          poly: [
            [0, 0],
            [h + f, h + f],
            [0, h + f],
          ],
        },
      });
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

/** Pieza que se pliega suavemente hasta el avance pedido (en vez de saltar de golpe). */
export function FoldingSheet({
  target,
  make,
  lift = 0,
}: {
  target: number;
  make: (p: number) => PanelSpec;
  lift?: number;
}) {
  const [p, setP] = useState(target);
  const cur = useRef(target);
  const moving = Math.abs(p - target) > 1e-3;
  useKeepRendering(moving);
  useFrame((_, dt) => {
    const d = target - cur.current;
    if (Math.abs(d) < 1e-3) {
      if (cur.current !== target) {
        cur.current = target;
        setP(target);
      }
      return;
    }
    // como mucho un cuarto del plegado total por segundo, para que se vea cada pliegue
    const step =
      Math.sign(d) * Math.min(Math.abs(d), Math.min(dt, 0.05) * 0.35);
    cur.current += step;
    setP(cur.current);
  });
  const root = useMemo(() => make(p), [make, p]);
  return <SheetModel root={root} lift={lift} />;
}
