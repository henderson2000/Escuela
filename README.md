# ⚡ Electrónica 3D

Web app para aprender electrónica en la escuela: los estudiantes ven los componentes en **3D**, los modifican,
los **despiezan** para ver sus partes, estudian la **teoría**, resuelven **actividades** y compiten en **juegos**
que suman puntos a un **ranking** anual.

## Qué incluye

| Sección | Contenido |
| --- | --- |
| **Componentes 3D** | Resistencia (4/5 bandas, se edita el valor y cambian los colores), LED (color, encendido, calculadora de resistencia), capacitor (electrolítico/cerámico), protoboard (tocás un orificio y se iluminan los conectados), Arduino UNO (Blink), potenciómetro, pulsador, LDR, sensor ultrasónico HC-SR04 y DHT11. Cada uno con: mostrar/ocultar partes, nombres de las partes, despiece animado y descripción de cada pieza. |
| **Teoría** | Tensión/corriente/resistencia, Ley de Ohm, potencia, serie y paralelo, divisor de tensión, señales digitales/analógicas/PWM y símbolos. Con calculadoras interactivas. |
| **Actividades** | Más de 70 ejercicios (opción múltiple y numéricos) con corrección automática y progreso guardado por alumno. |
| **Juegos** | 🔌 *Conexiones en la protoboard* (armar circuitos reales en 3D con el Arduino, 6 niveles) · 📐 *Completá el plano* (símbolos en esquemas, 6 niveles) · 🎨 *Código de colores contrarreloj* · 🔍 *¿Qué parte es?* |
| **Ranking** | Puntaje = suma del **mejor** resultado de cada juego/nivel (repetir sólo suma si se supera el récord). Filtro por curso, exportar CSV, exportar/importar JSON. |

## Cómo usarla

```bash
npm install
npm run dev      # desarrollo en http://localhost:5173
npm run build    # genera la carpeta dist/ lista para publicar
```

La carpeta `dist/` es un sitio estático: se puede subir a GitHub Pages, Netlify, Vercel o abrirse desde un servidor
local en el aula. No necesita internet para los modelos 3D (todo se genera por código).

## Puntajes entre varias computadoras

Por ahora los datos se guardan en el navegador de cada computadora (`localStorage`). Para juntar los puntos de
todo el curso: en **Ranking → Zona docente**, exportar en cada PC y luego importar todos los archivos en la del
docente (no se duplican partidas). Un próximo paso posible es agregar un backend (por ejemplo Supabase o Firebase)
para tener un ranking compartido en tiempo real.

## Estructura

```
src/
  catalog/      fichas de cada componente: partes, teoría, actividades y controles
  three/        visor 3D, sistema de partes despiezables y modelos procedurales
  games/        los 4 juegos y sus niveles
  data/         temas de teoría
  lib/          código de colores, protoboard, análisis de circuitos y puntajes
  pages/        páginas de la app
```

Para agregar un componente nuevo: crear su modelo en `src/three/models/`, su ficha en `src/catalog/` y sumarlo a
`src/catalog/index.ts`. Para agregar otra materia más adelante, el mismo esquema (catálogo + teoría + actividades)
se puede replicar.
