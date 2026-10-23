# 🛠 ITS Villada · Talleres

Plataforma de los talleres del ITS Villada: modelos en **3D** que se modifican y se **despiezan**, **teoría**,
**actividades** con corrección automática, simuladores y **juegos**. Se usa libremente, **sin iniciar sesión**: el
progreso, los intentos y los mejores puntajes quedan guardados en cada computadora. No hay ranking.

## Estructura de la plataforma

Al entrar se elige el año (**1ro, 2do o 3ro**). Cada año tiene **4 rotaciones** y cada rotación es un taller.
- **1ro:** Electricidad, Computación, Hojalatería y Ajuste.
- **2do:** Electrónica, Computación, Electricidad y Soldadura.
- **3ro:** Electrónica (con todo el contenido), Computación, Electricidad y Torno.

Por ahora tienen contenido los cuatro talleres de 1ro (**Electricidad**, **Computación**, **Hojalatería** y **Ajuste**) y los cuatro de 3ro (**Electrónica**, **Computación**, **Electricidad (LOGO!)** y **Torno**); el resto muestra "Próximamente". El contenido de cada taller se registra en [`src/subjects/`](src/subjects) (un archivo por taller, que se descarga recién cuando se entra). Los años y talleres se configuran en
[`src/data/curriculum.ts`](src/data/curriculum.ts).

## Qué incluye (1er año)

| Taller | Contenido |
| --- | --- |
| **Electricidad** | 3D: átomo (protones, neutrones y electrones por capas), cables (conductor, aislante, colores) y un circuito con pila, lámparas y llave (serie/paralelo, con la corriente animada). Teoría: 8 temas (materia y átomo, conductores y aislantes, colores de cables, magnitudes, Ley de Ohm, CC/CA, serie y paralelo) con simuladores. Guía de 35 ejercicios y 4 juegos. |
| **Computación** | 3D: la computadora por dentro, disco rígido / SSD y periféricos. Teoría: 7 temas (qué es una computadora, hardware y software, binario, internet, algoritmos, pensamiento computacional). **Bloques**: 12 niveles propios con Blockly (un robot que junta tornillos y limpia aceite; secuencias, repetir, condicionales y procedimientos) que se corrigen solos. 4 juegos. |
| **Hojalatería** | 3D: la caja cartuchera, su tapa y la budinera plegándose operación por operación con las medidas de los planos, herramientas, plegadora y engrafado. Teoría: 7 temas (chapas y calibre, hojalata y galvanizado, trazado con el desarrollo interactivo de cada plano, corte, golpe, plegado y uniones, soldadura por punto). Guía de planos y ciclos y 4 juegos. |
| **Ajuste** | 3D: la lima (formas, picados y grados), el martillo de peña etapa por etapa con las cotas del plano, instrumentos de medición y trazado y la morsa. Teoría: 8 temas de limado. Guía con el trabajo práctico, el plano y el ciclo de fabricación, y 4 juegos. |

Los niveles de Bloques usan [Blockly](https://developers.google.com/blockly) (incluido en la página; sus imágenes y sonidos están en `public/blockly/`).

## Qué incluye (taller de Electrónica, 3er año)

| Sección | Contenido |
| --- | --- |
| **Componentes 3D** | Resistencia (4/5 bandas, se edita el valor y cambian los colores), LED, capacitor, **transistor NPN**, protoboard (tocás un orificio y se iluminan los conectados), **Arduino UNO** (modelado con medidas reales), potenciómetro, pulsador, LDR, sensor ultrasónico HC-SR04, DHT11, **servomotor SG90** y **buzzer** (suena de verdad). Cada uno con: mostrar/ocultar partes, nombres, despiece animado y descripción de cada pieza. |
| **Teoría** | Tensión/corriente/resistencia, Ley de Ohm, potencia, serie y paralelo, divisor de tensión, PWM y símbolos, con calculadoras interactivas. |
| **Actividades** | Más de 90 ejercicios con corrección automática y progreso guardado en cada computadora. Las opciones se muestran mezcladas (siempre en el mismo orden para cada pregunta). |
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

## Agregar un taller (por ejemplo, de 2do)

Cada taller es un paquete aparte que se descarga recién cuando alguien entra, así que sumar talleres no hace más
lenta la plataforma.

1. Crear `src/subjects/<taller>-<año>.tsx` copiando uno existente (por ejemplo `src/subjects/torno.tsx`): ahí van la
   página de inicio del taller, su catálogo 3D, los temas de teoría, los juegos y sus páginas propias.
2. En `src/subjects/index.ts`, agregar su menú en `SUBJECT_NAV` y su carga en `LOADERS`, con la clave `"<año>/<taller>"`
   (por ejemplo `'1/electricidad': () => import('./electricidad-1')`).
3. En `src/data/curriculum.ts`, poner `ready: true` y una descripción en esa rotación.

Pautas para que siga andando fluido:
- Las páginas pesadas (editores, simuladores) se cargan con `lazyNamed(...)` (ver `src/subjects/computacion.tsx`).
- Los modelos 3D con una animación que sigue sola (algo que gira o parpadea) llaman a `useKeepRendering(activo)`
  (`src/three/keepRendering.ts`); el resto del tiempo el visor no dibuja y no gasta la computadora.
- Las imágenes van en `public/img/` y se usan como `img/archivo.jpg` (nunca desde otro sitio). Conviene JPG para fotos
  y PNG sólo si hace falta transparencia, de menos de ~100 KB cada una.

## Rendimiento

- La primera carga baja unos 280 KB; cada taller, su 3D, el editor de código y el simulador se descargan aparte
  cuando se usan (y empiezan a bajarse al pasar el mouse por la tarjeta del taller).
- El visor 3D sólo dibuja cuando algo se mueve, baja la resolución mientras se gira y se detiene si no está en
  pantalla. Libera solo la memoria de video de las piezas que ya no se usan.
- Ninguna parte de la página depende de otros sitios (imágenes, letras e íconos son propios).

## Publicar la página (GitHub Pages, gratis)

1. En GitHub, en este repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Cada vez que se sube un cambio, la página se vuelve a publicar sola en `https://henderson2000.github.io/Escuela/`
   (también se puede lanzar a mano en **Actions → Publicar en GitHub Pages → Run workflow**).
3. **Dominio propio**: en **Settings → Pages → Custom domain** se escribe el dominio (por ejemplo
   `talleres.ejemplo.edu.ar`) y en el proveedor del dominio se agrega un registro `CNAME` que apunte a
   `henderson2000.github.io`. No hay que cambiar nada del código: la página funciona en cualquier dirección o carpeta.
   En Netlify o Cloudflare Pages también funciona tal cual (se publica la carpeta `dist/`; `public/_headers` ya trae
   las reglas de caché).

## Uso en el aula

- No hace falta ingresar: los alumnos entran y usan todo.
- El progreso (lecciones y actividades resueltas), los intentos y los mejores puntajes se guardan en el navegador de
  cada computadora. Si se borran los datos del navegador, se pierde ese progreso.
- **📊 Progreso** (`#/progreso`, también desde el contador 💡 y el inicio): lo resuelto en cada taller, el mejor
  puntaje de cada juego y los intentos usados. Desde ahí se puede **descargar una copia** del progreso, **cargarla**
  (en la misma u otra computadora) y **borrar todo** (pide escribir BORRAR).
- **💡 Lamparitas**: se empieza con 0. Se ganan una sola vez por cosa resuelta (actividad +5 al primer intento, +2 si antes se respondió mal; lección de Computación +20,
  mini-proyecto +40, ejercicio de la guía LOGO! +30 (+10 si lo marca el alumno), juegos por puntos +1 cada 20 puntos)
  y se gastan en pistas (−30) o en ver la solución de una lección de Computación (−100; esa lección deja de pagar).
  Los valores están en `BULBS` (`src/lib/scores.ts`).
- En **Juegos**, cada nivel muestra cuántos intentos por puntos quedan en esa computadora. Si se cierra la página a
  mitad de un intento (el navegador avisa antes) o se abandona, ese intento queda usado con 0 puntos. Para cambiar la
  cantidad de intentos: `MAX_ATTEMPTS` en `src/lib/config.ts`.
- **Sin conexión**: la versión publicada guarda en la computadora lo que ya se abrió, así que si se corta internet en
  el aula sigue funcionando. Al volver la conexión se descarga sola la versión nueva.

## Desarrollo

```bash
npm install
npm run dev                  # http://localhost:5173
npm run build                # genera dist/
```

## Estructura

```
src/
  subjects/     un archivo por taller (contenido, páginas propias y grupos de progreso) + menú de cada taller
  catalog/      fichas de cada componente de Electrónica: partes, teoría, actividades y controles
  three/        visor 3D, sistema de partes despiezables y modelos procedurales
  games/        juegos comunes, sus niveles y el manejo de intentos
  data/         temas de teoría de Electrónica y estructura de años/talleres
  logo/         taller de Electricidad (LOGO!): simulador, guía, teoría, juegos y modelos
  compu/        taller de Computación: curso HTML + JavaScript, editor, ejecución de código y juegos
  torno/        taller de Torno: catálogo 3D, teoría, guía y juegos
  primero/      talleres de 1er año (electricidad, computacion con sus bloques, hojalateria, ajuste)
  lib/          puntajes y lamparitas (guardados en la computadora), carga diferida, utilidades
  pages/        páginas comunes (inicio, años, componentes, teoría, actividades, juegos, progreso)
public/sw.js    guarda la plataforma para usarla sin conexión
public/blockly/ imágenes y sonidos del editor de bloques
public/img/     imágenes de las lecciones (se usan como img/archivo.jpg)
```

Para agregar un componente nuevo: crear su modelo en `src/three/models/`, su ficha en `src/catalog/` y sumarlo a
`src/catalog/index.ts`.
