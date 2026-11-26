import { useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeepRendering } from "../../keepRendering";
import * as THREE from "three";
import { Part, useParts } from "../../Part";
import { useCanvasTexture } from "../../helpers";
import type { Poly, PanelSpec } from './Plegado.data'
export { boxSpec, budineraSpec } from './Plegado.data'
export { stage } from './Plegado.data'
export type { Poly, PanelSpec, ChildSpec } from './Plegado.data'

const S = 0.1; // mm → unidades (cm)
const T = 0.6; // espesor dibujado (mm), exagerado para que se vea

export type SheetFinish = "inox" | "galv";

/**
 * Chapa galvanizada: la "flor" del zinc. Cristales irregulares de 1 cm más o menos, cada uno con su
 * brillo según hacia dónde quedó orientado, con bordes finos más oscuros y una veta tipo pluma adentro.
 */
function drawSpangle(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const N = 24;
  const cell = w / N;
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pts: { x: number; y: number; base: number; c: number; s: number; slope: number }[] = [];
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const a = rnd() * Math.PI * 2;
      pts.push({
        x: (i + 0.15 + 0.7 * rnd()) * cell,
        y: (j + 0.15 + 0.7 * rnd()) * cell,
        base: 170 + rnd() * 44,
        c: Math.cos(a),
        s: Math.sin(a),
        slope: (0.25 + rnd() * 0.45) * (rnd() < 0.5 ? -1 : 1),
      });
    }
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let py = 0; py < h; py++) {
    const cj = Math.floor(py / cell);
    for (let px = 0; px < w; px++) {
      const ci = Math.floor(px / cell);
      let b1 = Infinity;
      let b2 = Infinity;
      let best = pts[0];
      let bx = 0;
      let by = 0;
      for (let dj = -1; dj <= 1; dj++)
        for (let di = -1; di <= 1; di++) {
          const ai = ci + di;
          const aj = cj + dj;
          const ii = (ai + N) % N;
          const jj = (aj + N) % N;
          const q = pts[jj * N + ii];
          // repetir los cristales del otro lado para que la textura no tenga costuras
          const sx = q.x + (ai - ii) * cell;
          const sy = q.y + (aj - jj) * cell;
          const dd = (px - sx) ** 2 + (py - sy) ** 2;
          if (dd < b1) {
            b2 = b1;
            b1 = dd;
            best = q;
            bx = px - sx;
            by = py - sy;
          } else if (dd < b2) b2 = dd;
        }
      const along = bx * best.c + by * best.s;
      const across = -bx * best.s + by * best.c;
      let v = best.base + along * best.slope + 5 * Math.sin(across * 0.55 + Math.abs(along) * 0.35);
      const edge = Math.sqrt(b2) - Math.sqrt(b1);
      if (edge < 1.6) v -= 22 * (1 - edge / 1.6);
      const k = (py * w + px) * 4;
      d[k] = Math.max(0, Math.min(255, v - 4));
      d[k + 1] = Math.max(0, Math.min(255, v - 1));
      d[k + 2] = Math.max(0, Math.min(255, v + 4));
      d[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

/** Textura de la chapa: acero inoxidable cepillado (rayas finas en un solo sentido) o galvanizada (flor de zinc). */
function useSheetTexture(finish: SheetFinish) {
  const tex = useCanvasTexture(
    1024,
    1024,
    (ctx, w, h) => {
      if (finish === "galv") return drawSpangle(ctx, w, h);
      ctx.fillStyle = "#c4c9cf";
      ctx.fillRect(0, 0, w, h);
      let seed = 7;
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      ctx.filter = "blur(0.8px)";
      for (let k = 0; k < 2600; k++) {
        const y = rnd() * h;
        const x = rnd() * w;
        const len = 80 + rnd() * 500;
        const light = rnd() < 0.5;
        ctx.strokeStyle = light ? `rgba(255,255,255,${0.04 + rnd() * 0.08})` : `rgba(70,76,84,${0.03 + rnd() * 0.07})`;
        ctx.lineWidth = 0.6 + rnd() * 1.6;
        ctx.beginPath();
        ctx.moveTo(x - len / 2, y);
        ctx.lineTo(x + len / 2, y);
        ctx.stroke();
        // las rayas que se salen por un borde siguen por el otro (textura sin costuras)
        ctx.beginPath();
        ctx.moveTo(x - len / 2 - w, y);
        ctx.lineTo(x + len / 2 - w, y);
        ctx.moveTo(x - len / 2 + w, y);
        ctx.lineTo(x + len / 2 + w, y);
        ctx.stroke();
      }
      ctx.filter = "none";
    },
    [finish],
  );
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1 / 260, 1 / 260);
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
  // los recortes se marcan sobre el plano de la chapa: relleno rojo suave y el contorno por donde se corta
  const flat = useMemo(() => {
    if (!scrap) return null;
    const sh = new THREE.Shape(poly.map(([u, v]) => new THREE.Vector2(u, v)));
    const fill = new THREE.ShapeGeometry(sh).rotateX(Math.PI / 2);
    const pts = [...poly, poly[0]].map(([u, v]) => new THREE.Vector3(u, 0, v));
    const line = new THREE.BufferGeometry().setFromPoints(pts);
    return { fill, line };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, scrap]);
  if (flat)
    return (
      <group position={[0, -T / 2, 0]}>
        <mesh geometry={flat.fill} renderOrder={2}>
          <meshBasicMaterial color="#ef4444" transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <lineLoop geometry={flat.line} renderOrder={3} onUpdate={(l) => l.computeLineDistances()}>
          <lineDashedMaterial color="#dc2626" dashSize={3} gapSize={2} />
        </lineLoop>
      </group>
    );
  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial
        map={map}
        color="#ffffff"
        metalness={0.85}
        roughness={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/** Radio del pliegue: llena la cuña que queda entre dos paneles para que el doblez se vea redondeado. */
function Bend({ u0, u1, angle }: { u0: number; u1: number; angle: number }) {
  const a = Math.abs(angle);
  const geo = useMemo(() => {
    if (a < 0.01) return null;
    const sh = new THREE.Shape();
    sh.moveTo(0, 0);
    // arco en el plano (v, y) desde "hacia abajo" (−90°) girando hacia +v
    sh.absarc(0, 0, T, -Math.PI / 2, -Math.PI / 2 + a, false);
    sh.lineTo(0, 0);
    // extruido a lo largo de la bisagra (eje u = X)
    return new THREE.ExtrudeGeometry(sh, { depth: u1 - u0, bevelEnabled: false, curveSegments: 10 })
      .rotateY(Math.PI / 2)
      .translate(u0, 0, 0);
  }, [a, u0, u1]);
  if (!geo) return null;
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color="#c4c9cf" metalness={0.85} roughness={0.3} side={THREE.DoubleSide} />
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
            {!ch.panel.scrap && <Bend u0={hingeSpan(ch.panel.poly)[0]} u1={hingeSpan(ch.panel.poly)[1]} angle={ch.angle} />}
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

/** Tramo de la bisagra: los puntos del panel que están sobre v = 0. */
function hingeSpan(p: Poly): [number, number] {
  const us = p.filter((q) => Math.abs(q[1]) < 1e-6).map((q) => q[0]);
  return us.length >= 2 ? [Math.min(...us), Math.max(...us)] : [0, 0];
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
  finish = "inox",
}: {
  root: PanelSpec;
  lift?: number;
  finish?: SheetFinish;
}) {
  const map = useSheetTexture(finish);
  const firsts = firstOfEachPart(root);
  return (
    <group scale={S} position={[0, lift, 0]}>
      <PanelNode spec={root} map={map} firsts={firsts} depth={0} />
    </group>
  );
}

/** Pieza que se pliega suavemente hasta el avance pedido (en vez de saltar de golpe). */
export function FoldingSheet({
  target,
  make,
  lift = 0,
  finish = "inox",
}: {
  target: number;
  make: (p: number) => PanelSpec;
  lift?: number;
  finish?: SheetFinish;
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
  return <SheetModel root={root} lift={lift} finish={finish} />;
}
