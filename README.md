# ⚡ Electrónica 3D

Web app para aprender electrónica en la escuela: los estudiantes ven los componentes en **3D**, los modifican,
los **despiezan** para ver sus partes, estudian la **teoría**, resuelven **actividades** y compiten en **juegos**
que suman puntos a un **ranking online** del curso.

## Estructura de la plataforma

Al entrar se elige el año (**1ro, 2do o 3ro**). Cada año tiene **4 rotaciones** y cada rotación es un taller.
- **1ro:** Electricidad, Computación, Hojalatería y Ajuste.
- **2do:** Electrónica, Computación, Electricidad y Soldadura.
- **3ro:** Electrónica (con todo el contenido), Computación, Electricidad y Torno.

Por ahora tienen contenido **Electrónica** y **Electricidad (LOGO!)** de 3ro; el resto muestra "Próximamente". El contenido de cada taller se registra en [`src/subjects.tsx`](src/subjects.tsx). Los años y talleres se configuran en
[`src/data/curriculum.ts`](src/data/curriculum.ts).

## Qué incluye (taller de Electrónica, 3er año)

| Sección | Contenido |
| --- | --- |
| **Componentes 3D** | Resistencia (4/5 bandas, se edita el valor y cambian los colores), LED, capacitor, **transistor NPN**, protoboard (tocás un orificio y se iluminan los conectados), **Arduino UNO** (modelado con medidas reales), potenciómetro, pulsador, LDR, sensor ultrasónico HC-SR04, DHT11, **servomotor SG90** y **buzzer** (suena de verdad). Cada uno con: mostrar/ocultar partes, nombres, despiece animado y descripción de cada pieza. |
| **Teoría** | Tensión/corriente/resistencia, Ley de Ohm, potencia, serie y paralelo, divisor de tensión, PWM y símbolos, con calculadoras interactivas. |
| **Actividades** | Más de 90 ejercicios con corrección automática y progreso guardado por alumno. |
| **Juegos** | 🔌 *Conexiones en la protoboard* (circuitos reales en 3D con el Arduino, 6 niveles) · 📐 *Completá el plano* (6 niveles) · 🎨 *Código de colores contrarreloj* · 🔍 *¿Qué parte es?* |
| **Ranking online** | Los alumnos entran con **nombre, apellido y curso**. Cada juego/nivel se puede jugar **2 veces por puntos** (el intento cuenta desde que empieza); después pueden seguir practicando sin sumar. En el ranking cuenta el mejor intento de cada nivel. Zona docente con PIN para devolver intentos o borrar alumnos, y descarga de planilla CSV. |

## Qué incluye (taller de Electricidad, 3er año: automatización con LOGO!)

| Sección | Contenido |
| --- | --- |
| **Equipos en 3D** | LOGO! 8 (con su display mostrando el estado de entradas y salidas y un tablero de prueba), contactor, pulsadores, hongo y lámpara piloto. |
| **Teoría** | 9 temas del apunte: automatización y PLC, lógica cableada vs. programada (ciclo de scan), partes del LOGO!, señales NA/NC, compuertas, arranque de motor, temporizadores, set-reset y relé de impulsos, marcas y contador. Con simuladores chicos y ~50 actividades. |
| **Simulador** | Editor de bloques FUP (como LOGO!Soft Comfort): entradas I1–I8 (pulsador NA/NC, interruptor, contacto NC con retención), salidas Q1–Q8, AND, OR, NOT, NAND, NOR, XOR, TON, TOF, RS, relé de impulsos, generador de impulsos y contador. Simulación en vivo con velocidad ×1/×10/×60. |
| **Guía** | Los 32 ejercicios de la guía de ejercitación. 30 tienen corrección automática (el programa se prueba solo), 2 los corrige el docente. |
| **Juegos** | 🤖 *Programá el LOGO!* (8 niveles × 100) · 🔣 *Compuertas al toque* (200) · ⏱ *Diagramas de tiempo* (200). Cada taller tiene su propio ranking. |

## Puesta en marcha (una sola vez)

### 1. Base de datos del ranking (Supabase, gratis)

1. Crear una cuenta en <https://supabase.com> y un proyecto nuevo (cualquier nombre, región São Paulo).
2. Abrir **SQL Editor → New query**, pegar todo el contenido de [`supabase/schema.sql`](supabase/schema.sql),
   **cambiar el PIN docente** (línea marcada `CAMBIÁ ESTE PIN`) y tocar **Run**.
3. En **Project Settings → API** copiar:
   - **Project URL** (algo como `https://abcd1234.supabase.co`)
   - **anon public key** (una clave larga que empieza con `eyJ…`). Esta clave es pública a propósito: la base sólo
     permite lo que definen las funciones del script (no se pueden cargar puntos a mano ni saltear el límite).

### 2. Publicar la página (GitHub Pages, gratis)

1. En GitHub, en este repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. **Settings → Secrets and variables → Actions → pestaña Variables → New repository variable**, crear dos:
   - `SUPABASE_URL` = la Project URL
   - `SUPABASE_ANON_KEY` = la anon public key
3. Ir a **Actions → Publicar en GitHub Pages → Run workflow**. En un par de minutos la página queda en
   `https://henderson2000.github.io/Escuela/`. Cada vez que se sube un cambio, se vuelve a publicar sola.

Sin el paso 1 la app funciona igual, pero en **modo local** (los puntos quedan en cada computadora).

## Uso en el aula

- Cada alumno entra con **nombre y apellido** y su **curso**, siempre igual (no distingue mayúsculas ni espacios).
- En **Juegos**, cada nivel muestra cuántos intentos le quedan. Si cierra la página a mitad de un intento, ese
  intento queda usado con 0 puntos.
- **Zona docente** (abajo en Ranking): con el PIN se pueden devolver los intentos a un alumno (por ejemplo, si se le
  cortó internet) o borrarlo. También se descarga la planilla con todos los puntajes.
- Para cambiar la cantidad de intentos: en Supabase, tabla `settings`, fila `max_attempts` (y en
  `src/lib/config.ts`, `MAX_ATTEMPTS`, para que la página muestre el mismo número).
- Para empezar un ciclo nuevo de cero: en el SQL Editor, `delete from players;` (borra alumnos e intentos).

> Importante: el ingreso es sólo con nombre (sin contraseña), pensado para usar en clase con el docente presente.
> Un alumno podría entrar con el nombre de otro; si pasa, desde la zona docente se le devuelven los intentos.

## Desarrollo

```bash
npm install
cp .env.example .env.local   # opcional: datos de Supabase para probar el ranking online
npm run dev                  # http://localhost:5173
npm run build                # genera dist/
```

## Estructura

```
src/
  catalog/      fichas de cada componente: partes, teoría, actividades y controles
  three/        visor 3D, sistema de partes despiezables y modelos procedurales
  games/        los 4 juegos, sus niveles y el manejo de intentos
  data/         temas de teoría
  lib/          código de colores, protoboard, análisis de circuitos, ranking (local/online)
  pages/        páginas de la app
supabase/       script de la base de datos del ranking
```

Para agregar un componente nuevo: crear su modelo en `src/three/models/`, su ficha en `src/catalog/` y sumarlo a
`src/catalog/index.ts`.
