# 🛠 ITS Villada · Talleres

Plataforma de los talleres del ITS Villada: modelos en **3D** que se modifican y se **despiezan**, **teoría**,
**actividades** con corrección automática, simuladores y **juegos**. Se usa libremente, **sin iniciar sesión**: el
progreso, los intentos y los mejores puntajes quedan guardados en cada computadora. No hay ranking.

## Estructura de la plataforma

Al entrar se elige el año (**1ro, 2do o 3ro**). Cada año tiene **4 rotaciones** y cada rotación es un taller.
- **1ro:** Electricidad, Computación, Hojalatería y Ajuste.
- **2do:** Electrónica, Computación, Electricidad y Soldadura.
- **3ro:** Electrónica (con todo el contenido), Computación, Electricidad y Torno.

Por ahora tienen contenido los cuatro talleres de 3ro (**Electrónica**, **Computación**, **Electricidad (LOGO!)** y **Torno**); el resto muestra "Próximamente". El contenido de cada taller se registra en [`src/subjects.tsx`](src/subjects.tsx). Los años y talleres se configuran en
[`src/data/curriculum.ts`](src/data/curriculum.ts).

## Qué incluye (taller de Electrónica, 3er año)

| Sección | Contenido |
| --- | --- |
| **Componentes 3D** | Resistencia (4/5 bandas, se edita el valor y cambian los colores), LED, capacitor, **transistor NPN**, protoboard (tocás un orificio y se iluminan los conectados), **Arduino UNO** (modelado con medidas reales), potenciómetro, pulsador, LDR, sensor ultrasónico HC-SR04, DHT11, **servomotor SG90** y **buzzer** (suena de verdad). Cada uno con: mostrar/ocultar partes, nombres, despiece animado y descripción de cada pieza. |
| **Teoría** | Tensión/corriente/resistencia, Ley de Ohm, potencia, serie y paralelo, divisor de tensión, PWM y símbolos, con calculadoras interactivas. |
| **Actividades** | Más de 90 ejercicios con corrección automática y progreso guardado por alumno. |
| **Juegos** | 🔌 *Conexiones en la protoboard* (circuitos reales en 3D con el Arduino, 6 niveles) · 📐 *Completá el plano* (6 niveles) · 🎨 *Código de colores contrarreloj* · 🔍 *¿Qué parte es?* |
| **Puntajes** | Sin iniciar sesión. Cada juego/nivel se puede jugar **2 veces por puntos en cada computadora** (el intento cuenta desde que empieza); después se sigue practicando sin sumar. Queda guardado el mejor intento. |

## Qué incluye (taller de Electricidad, 3er año: automatización con LOGO!)

| Sección | Contenido |
| --- | --- |
| **Equipos en 3D** | LOGO! 8 (con su display mostrando el estado de entradas y salidas y un tablero de prueba), contactor, pulsadores, hongo y lámpara piloto. |
| **Teoría** | 9 temas del apunte: automatización y PLC, lógica cableada vs. programada (ciclo de scan), partes del LOGO!, señales NA/NC, compuertas, arranque de motor, temporizadores, set-reset y relé de impulsos, marcas y contador. Con simuladores chicos y ~50 actividades. |
| **Simulador** | Editor de bloques FUP (como LOGO!Soft Comfort): entradas I1–I8 (pulsador NA/NC, interruptor, contacto NC con retención), salidas Q1–Q8, AND, OR, NOT, NAND, NOR, XOR, TON, TOF, RS, relé de impulsos, generador de impulsos y contador. Simulación en vivo con velocidad ×1/×10/×60. |
| **Guía** | Los 32 ejercicios de la guía de ejercitación. 30 tienen corrección automática (el programa se prueba solo), 2 los corrige el docente. |
| **Juegos** | 🤖 *Programá el LOGO!* (8 niveles × 100) · 🔣 *Compuertas al toque* (200) · ⏱ *Diagramas de tiempo* (200). |

## Qué incluye (taller de Computación, 3er año)

| Sección | Contenido |
| --- | --- |
| **Curso** | 2 recorridos con lecciones cortas: **HTML** y **JavaScript básico** (consola y páginas con botones, campos y listas). Cada lección tiene explicación, consigna, editor con colores, vista previa en vivo o consola y una lista de requisitos que se corrige sola. Mini-proyectos al final de cada módulo. El progreso queda guardado por alumno. |
| **JavaScript** | Corre en el navegador al instante. Los errores aparecen con su número de línea y una explicación en castellano; los bucles infinitos se cortan solos. Las respuestas de `prompt()` se escriben en el recuadro «Entrada». |
| **Taller libre** | Página con HTML + JavaScript y consola de JavaScript, con descarga de los archivos. |
| **Juegos** | 🧩 *Desafíos de código* (HTML y JavaScript, 100 c/u) · ❓ *¿Qué hace este código?* (200). |

Para revisar el curso después de cambiar lecciones: `npm run dev` y abrir `/verify-course.html` (prueba que cada solución pase y cada código inicial no).

## Qué incluye (taller de Torno, 3er año)

| Sección | Contenido |
| --- | --- |
| **Torno en 3D** | Torno paralelo completo (encender, velocidades, carros, charriot, contrapunta, montajes al aire / plato y contrapunta / entre puntas / con luneta, lira, tuerca partida), platos y elementos de sujeción, puntos y lunetas, herramientas de corte. |
| **Teoría** | 11 temas del apunte de torneado, con calculadoras de rpm, conos y roscas. |
| **Guía** | 49 ejercicios (rpm, conos, roscas, montajes, herramientas, seguridad) con corrección automática. |
| **Juegos** | 🔍 *¿Qué parte es?* · *¿Cómo lo mecanizo?* · *Seguridad en el taller* · *Calculá rápido* (200 cada uno). |

## Publicar la página (GitHub Pages, gratis)

1. En GitHub, en este repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Cada vez que se sube un cambio, la página se vuelve a publicar sola en `https://henderson2000.github.io/Escuela/`
   (también se puede lanzar a mano en **Actions → Publicar en GitHub Pages → Run workflow**).

## Uso en el aula

- No hace falta ingresar: los alumnos entran y usan todo.
- El progreso (lecciones y actividades resueltas), los intentos y los mejores puntajes se guardan en el navegador de
  cada computadora. Si se borran los datos del navegador, se pierde ese progreso.
- En **Juegos**, cada nivel muestra cuántos intentos por puntos quedan en esa computadora. Si se cierra la página a
  mitad de un intento, ese intento queda usado con 0 puntos. Para cambiar la cantidad de intentos: `MAX_ATTEMPTS` en
  `src/lib/config.ts`.

> La carpeta `supabase/` y el código del modo online quedan de una versión anterior con ranking; hoy no se usan.

## Desarrollo

```bash
npm install
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
  lib/          código de colores, protoboard, análisis de circuitos, puntajes guardados en la computadora
  pages/        páginas de la app
supabase/       (sin uso) base de datos de la versión anterior con ranking
```

Para agregar un componente nuevo: crear su modelo en `src/three/models/`, su ficha en `src/catalog/` y sumarlo a
`src/catalog/index.ts`.
