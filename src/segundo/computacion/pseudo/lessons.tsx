import type { ReactNode } from 'react'

export interface PseudoTest {
  inputs: string[]
  expect: string[]
}

export interface PseudoLesson {
  id: string
  title: string
  teoria: ReactNode
  consigna: ReactNode
  start: string
  tests: PseudoTest[]
  /** palabras que el programa tiene que usar (al menos una de cada grupo) */
  usa?: string[][]
  hint: string
  solucion: string
}

export const pseudoActivityId = (id: string) => `c2-ps-${id}`

const A = (body: string, name = 'ejercicio') => `Algoritmo ${name}\n${body}\nFinAlgoritmo\n`

export const LESSONS: PseudoLesson[] = [
  {
    id: 'hola',
    title: 'Hola, mundo',
    teoria: (
      <>
        <p>
          Todo programa en pseudocódigo empieza con <code>Algoritmo nombre</code> y termina con <code>FinAlgoritmo</code>. Entre medio van las
          instrucciones, una por línea, que se ejecutan <b>en orden</b>, de arriba hacia abajo.
        </p>
        <p>
          <code>Escribir</code> muestra algo en la pantalla. Los textos van entre comillas.
        </p>
      </>
    ),
    consigna: (
      <>
        Hacé que el programa muestre <code>Hola, mundo</code>.
      </>
    ),
    start: A('    // escribí acá tu instrucción', 'saludo'),
    tests: [{ inputs: [], expect: ['Hola, mundo'] }],
    usa: [['escribir']],
    hint: 'Escribir "Hola, mundo"',
    solucion: A('    Escribir "Hola, mundo"', 'saludo'),
  },
  {
    id: 'variables',
    title: 'Variables',
    teoria: (
      <>
        <p>
          Una <b>variable</b> es un lugar de la memoria con un nombre, donde se guarda un dato. Con <code>&lt;-</code> se le <b>asigna</b> un valor:{' '}
          <code>edad &lt;- 14</code>. Se puede <b>definir</b> antes su tipo: <code>Definir edad Como Entero</code> (también Real, Caracter o Logico).
        </p>
        <p>
          <code>Escribir</code> puede mostrar varias cosas separadas por comas, y las junta: <code>Escribir "Tengo ", edad, " años"</code>.
        </p>
      </>
    ),
    consigna: (
      <>
        Guardá <code>"Ana"</code> en la variable <code>nombre</code> y <code>14</code> en <code>edad</code>, y mostrá <code>Ana tiene 14 años</code>{' '}
        usando las variables.
      </>
    ),
    start: A('    Definir nombre Como Caracter\n    Definir edad Como Entero\n    nombre <- "Ana"\n    // asigná la edad y escribí el mensaje\n', 'variables'),
    tests: [{ inputs: [], expect: ['Ana tiene 14 años'] }],
    usa: [['edad'], ['nombre']],
    hint: 'edad <- 14  y después  Escribir nombre, " tiene ", edad, " años"',
    solucion: A('    Definir nombre Como Caracter\n    Definir edad Como Entero\n    nombre <- "Ana"\n    edad <- 14\n    Escribir nombre, " tiene ", edad, " años"', 'variables'),
  },
  {
    id: 'leer',
    title: 'Leer datos',
    teoria: (
      <>
        <p>
          <code>Leer variable</code> espera que el usuario escriba un dato y lo guarda en la variable. Acá los datos se escriben en el recuadro{' '}
          <b>Entrada</b>, uno por renglón.
        </p>
        <p>Es buena costumbre pedir el dato con un mensaje antes de leerlo.</p>
      </>
    ),
    consigna: (
      <>
        Leé un nombre y saludá: si escriben <code>Juan</code>, el programa muestra <code>Hola, Juan</code>.
      </>
    ),
    start: A('    Definir nombre Como Caracter\n    Escribir "¿Cómo te llamás?"\n    // leé el nombre y saludá\n', 'saludar'),
    tests: [
      { inputs: ['Juan'], expect: ['Hola, Juan'] },
      { inputs: ['Sofía'], expect: ['Hola, Sofía'] },
    ],
    usa: [['leer']],
    hint: 'Leer nombre  y después  Escribir "Hola, ", nombre',
    solucion: A('    Definir nombre Como Caracter\n    Escribir "¿Cómo te llamás?"\n    Leer nombre\n    Escribir "Hola, ", nombre', 'saludar'),
  },
  {
    id: 'suma',
    title: 'Operaciones',
    teoria: (
      <>
        <p>
          Operadores aritméticos: <code>+</code> suma, <code>-</code> resta, <code>*</code> multiplicación, <code>/</code> división, <code>^</code>{' '}
          potencia y <code>MOD</code> resto de la división.
        </p>
        <p>Se respeta el orden de las operaciones: primero potencias, después multiplicaciones y divisiones, al final sumas y restas. Los paréntesis cambian el orden.</p>
      </>
    ),
    consigna: (
      <>
        Leé dos números y mostrá <code>La suma es X</code>.
      </>
    ),
    start: A('    Definir a, b Como Real\n    Escribir "Primer número:"\n    Leer a\n    Escribir "Segundo número:"\n    Leer b\n    // mostrá la suma\n', 'suma'),
    tests: [
      { inputs: ['3', '4'], expect: ['La suma es 7'] },
      { inputs: ['10', '-2'], expect: ['La suma es 8'] },
      { inputs: ['2.5', '1.5'], expect: ['La suma es 4'] },
    ],
    hint: 'Escribir "La suma es ", a + b',
    solucion: A('    Definir a, b Como Real\n    Escribir "Primer número:"\n    Leer a\n    Escribir "Segundo número:"\n    Leer b\n    Escribir "La suma es ", a + b', 'suma'),
  },
  {
    id: 'promedio',
    title: 'Promedio',
    teoria: (
      <>
        <p>
          ¡Cuidado con el orden! <code>a + b + c / 3</code> divide sólo <code>c</code>. Para el promedio hay que sumar primero:{' '}
          <code>(a + b + c) / 3</code>.
        </p>
      </>
    ),
    consigna: (
      <>
        Leé tres notas y mostrá <code>Promedio: X</code> (sin redondear).
      </>
    ),
    start: A('    Definir n1, n2, n3, prom Como Real\n    Leer n1\n    Leer n2\n    Leer n3\n    // calculá y mostrá el promedio\n', 'promedio'),
    tests: [
      { inputs: ['7', '8', '9'], expect: ['Promedio: 8'] },
      { inputs: ['6', '7', '7'], expect: ['Promedio: 6.666667'] },
      { inputs: ['10', '4', '1'], expect: ['Promedio: 5'] },
    ],
    hint: 'prom <- (n1 + n2 + n3) / 3',
    solucion: A('    Definir n1, n2, n3, prom Como Real\n    Leer n1\n    Leer n2\n    Leer n3\n    prom <- (n1 + n2 + n3) / 3\n    Escribir "Promedio: ", prom', 'promedio'),
  },
  {
    id: 'si',
    title: 'Decisiones: Si',
    teoria: (
      <>
        <p>
          <code>Si condición Entonces … SiNo … FinSi</code> ejecuta un camino u otro según la condición. Comparaciones: <code>=</code>,{' '}
          <code>&lt;&gt;</code> (distinto), <code>&lt;</code>, <code>&gt;</code>, <code>&lt;=</code> y <code>&gt;=</code>.
        </p>
      </>
    ),
    consigna: (
      <>
        Leé una edad. Si es 18 o más mostrá <code>Es mayor de edad</code>; si no, <code>Es menor de edad</code>.
      </>
    ),
    start: A('    Definir edad Como Entero\n    Leer edad\n    Si  Entonces\n        \n    SiNo\n        \n    FinSi\n', 'edad'),
    tests: [
      { inputs: ['20'], expect: ['Es mayor de edad'] },
      { inputs: ['18'], expect: ['Es mayor de edad'] },
      { inputs: ['12'], expect: ['Es menor de edad'] },
    ],
    usa: [['si']],
    hint: 'Si edad >= 18 Entonces',
    solucion: A('    Definir edad Como Entero\n    Leer edad\n    Si edad >= 18 Entonces\n        Escribir "Es mayor de edad"\n    SiNo\n        Escribir "Es menor de edad"\n    FinSi', 'edad'),
  },
  {
    id: 'par',
    title: 'Par o impar (MOD)',
    teoria: (
      <>
        <p>
          <code>MOD</code> da el <b>resto</b> de una división entera: <code>7 MOD 2</code> es 1 y <code>8 MOD 2</code> es 0. Un número es par si{' '}
          <code>n MOD 2 = 0</code>.
        </p>
      </>
    ),
    consigna: (
      <>
        Leé un número entero y mostrá <code>Par</code> o <code>Impar</code>.
      </>
    ),
    start: A('    Definir n Como Entero\n    Leer n\n    // decidí si es par\n', 'paridad'),
    tests: [
      { inputs: ['4'], expect: ['Par'] },
      { inputs: ['7'], expect: ['Impar'] },
      { inputs: ['0'], expect: ['Par'] },
    ],
    usa: [['mod']],
    hint: 'Si n MOD 2 = 0 Entonces',
    solucion: A('    Definir n Como Entero\n    Leer n\n    Si n MOD 2 = 0 Entonces\n        Escribir "Par"\n    SiNo\n        Escribir "Impar"\n    FinSi', 'paridad'),
  },
  {
    id: 'notas',
    title: 'Decisiones anidadas',
    teoria: (
      <>
        <p>
          Un <code>Si</code> puede ir dentro de otro (anidado). También se pueden unir condiciones con <code>Y</code> (las dos tienen que cumplirse) y{' '}
          <code>O</code> (alcanza con una): <code>Si nota &gt;= 4 Y nota &lt; 7 Entonces</code>.
        </p>
      </>
    ),
    consigna: (
      <>
        Leé una nota. Si es 7 o más: <code>Aprobado</code>. Si es 4 o más (pero menos de 7): <code>Recupera</code>. Si no: <code>Desaprobado</code>.
      </>
    ),
    start: A('    Definir nota Como Real\n    Leer nota\n', 'nota'),
    tests: [
      { inputs: ['9'], expect: ['Aprobado'] },
      { inputs: ['7'], expect: ['Aprobado'] },
      { inputs: ['5'], expect: ['Recupera'] },
      { inputs: ['4'], expect: ['Recupera'] },
      { inputs: ['2'], expect: ['Desaprobado'] },
    ],
    usa: [['si']],
    hint: 'Primero preguntá  Si nota >= 7 ; en el SiNo, otro  Si nota >= 4 .',
    solucion: A('    Definir nota Como Real\n    Leer nota\n    Si nota >= 7 Entonces\n        Escribir "Aprobado"\n    SiNo\n        Si nota >= 4 Entonces\n            Escribir "Recupera"\n        SiNo\n            Escribir "Desaprobado"\n        FinSi\n    FinSi', 'nota'),
  },
  {
    id: 'mientras',
    title: 'Repetir: Mientras',
    teoria: (
      <>
        <p>
          <code>Mientras condición Hacer … FinMientras</code> repite las instrucciones <b>mientras</b> la condición sea verdadera. Dentro del ciclo algo tiene
          que cambiar para que alguna vez termine (si no, es un bucle infinito).
        </p>
        <p>
          Un <b>contador</b> es una variable que aumenta de a uno: <code>c &lt;- c + 1</code>.
        </p>
      </>
    ),
    consigna: (
      <>
        Leé un número N y mostrá los números del 1 al N, uno por renglón, usando <code>Mientras</code>.
      </>
    ),
    start: A('    Definir n, c Como Entero\n    Leer n\n    c <- 1\n', 'contar'),
    tests: [
      { inputs: ['3'], expect: ['1', '2', '3'] },
      { inputs: ['5'], expect: ['1', '2', '3', '4', '5'] },
    ],
    usa: [['mientras']],
    hint: 'Mientras c <= n Hacer  …  Escribir c  …  c <- c + 1  …  FinMientras',
    solucion: A('    Definir n, c Como Entero\n    Leer n\n    c <- 1\n    Mientras c <= n Hacer\n        Escribir c\n        c <- c + 1\n    FinMientras', 'contar'),
  },
  {
    id: 'para',
    title: 'Repetir: Para',
    teoria: (
      <>
        <p>
          <code>Para i &lt;- 1 Hasta 10 Hacer … FinPara</code> repite un número conocido de veces: la variable <code>i</code> toma los valores 1, 2, 3…
          hasta 10. Con <code>Con Paso 2</code> avanza de a dos.
        </p>
      </>
    ),
    consigna: (
      <>
        Leé un número y mostrá su tabla de multiplicar del 1 al 10, con el formato <code>3 x 1 = 3</code>.
      </>
    ),
    start: A('    Definir n, i Como Entero\n    Leer n\n', 'tabla'),
    tests: [
      { inputs: ['3'], expect: Array.from({ length: 10 }, (_, k) => `3 x ${k + 1} = ${3 * (k + 1)}`) },
      { inputs: ['7'], expect: Array.from({ length: 10 }, (_, k) => `7 x ${k + 1} = ${7 * (k + 1)}`) },
    ],
    usa: [['para']],
    hint: 'Escribir n, " x ", i, " = ", n * i',
    solucion: A('    Definir n, i Como Entero\n    Leer n\n    Para i <- 1 Hasta 10 Hacer\n        Escribir n, " x ", i, " = ", n * i\n    FinPara', 'tabla'),
  },
  {
    id: 'acumulador',
    title: 'Acumuladores',
    teoria: (
      <>
        <p>
          Un <b>acumulador</b> guarda una suma que va creciendo: empieza en 0 y en cada vuelta se le suma algo: <code>suma &lt;- suma + num</code>. Es el
          ejemplo del apunte: "mientras el contador sea menor que 5, leer un número y sumarlo".
        </p>
      </>
    ),
    consigna: (
      <>
        Leé 5 números y mostrá <code>Suma: X</code>.
      </>
    ),
    start: A('    Definir c Como Entero\n    Definir num, suma Como Real\n    c <- 0\n    suma <- 0\n', 'acumular'),
    tests: [
      { inputs: ['1', '2', '3', '4', '5'], expect: ['Suma: 15'] },
      { inputs: ['10', '0', '-3', '7', '1'], expect: ['Suma: 15'] },
      { inputs: ['2', '2', '2', '2', '2'], expect: ['Suma: 10'] },
    ],
    usa: [['mientras', 'para', 'repetir']],
    hint: 'Mientras c < 5 Hacer  Leer num  suma <- suma + num  c <- c + 1  FinMientras',
    solucion: A('    Definir c Como Entero\n    Definir num, suma Como Real\n    c <- 0\n    suma <- 0\n    Mientras c < 5 Hacer\n        Leer num\n        suma <- suma + num\n        c <- c + 1\n    FinMientras\n    Escribir "Suma: ", suma', 'acumular'),
  },
  {
    id: 'repetir',
    title: 'Repetir … Hasta Que',
    teoria: (
      <>
        <p>
          <code>Repetir … Hasta Que condición</code> ejecuta las instrucciones <b>al menos una vez</b> y repite hasta que la condición sea verdadera. Sirve
          para pedir un dato hasta que sea correcto.
        </p>
      </>
    ),
    consigna: (
      <>
        Pedí la contraseña hasta que escriban <code>villada</code>. Cada vez que se equivocan mostrá <code>Incorrecta</code> y, al final,{' '}
        <code>Acceso permitido</code>.
      </>
    ),
    start: A('    Definir clave Como Caracter\n', 'clave'),
    tests: [
      { inputs: ['villada'], expect: ['Acceso permitido'] },
      { inputs: ['hola', '1234', 'villada'], expect: ['Incorrecta', 'Incorrecta', 'Acceso permitido'] },
    ],
    usa: [['repetir', 'mientras']],
    hint: 'Repetir  Leer clave  Si clave <> "villada" Entonces Escribir "Incorrecta" FinSi  Hasta Que clave = "villada"',
    solucion: A(
      '    Definir clave Como Caracter\n    Repetir\n        Escribir "Contraseña:"\n        Leer clave\n        Si clave <> "villada" Entonces\n            Escribir "Incorrecta"\n        FinSi\n    Hasta Que clave = "villada"\n    Escribir "Acceso permitido"',
      'clave',
    ),
  },
  {
    id: 'mayor',
    title: 'Desafío: el mayor',
    teoria: (
      <>
        <p>
          Para encontrar el mayor de varios números se guarda el primero como "mayor hasta ahora" y se compara cada número nuevo con él: si es más grande,
          se reemplaza.
        </p>
      </>
    ),
    consigna: (
      <>
        Leé una cantidad N y después N números. Mostrá <code>El mayor es X</code>.
      </>
    ),
    start: A('    Definir n, i Como Entero\n    Definir num, mayor Como Real\n    Leer n\n', 'mayor'),
    tests: [
      { inputs: ['3', '4', '9', '2'], expect: ['El mayor es 9'] },
      { inputs: ['4', '-5', '-2', '-8', '-3'], expect: ['El mayor es -2'] },
      { inputs: ['1', '7'], expect: ['El mayor es 7'] },
    ],
    usa: [['si'], ['mientras', 'para', 'repetir']],
    hint: 'Leé el primer número y guardalo en mayor. Después, con un Para de 2 a N, leé cada número y si num > mayor, mayor <- num.',
    solucion: A(
      '    Definir n, i Como Entero\n    Definir num, mayor Como Real\n    Leer n\n    Leer mayor\n    Para i <- 2 Hasta n Hacer\n        Leer num\n        Si num > mayor Entonces\n            mayor <- num\n        FinSi\n    FinPara\n    Escribir "El mayor es ", mayor',
      'mayor',
    ),
  },
  {
    id: 'factorial',
    title: 'Desafío: factorial',
    teoria: (
      <>
        <p>
          El <b>factorial</b> de N (se escribe N!) es la multiplicación de todos los números de 1 a N: 5! = 1 × 2 × 3 × 4 × 5 = 120. Por definición, 0! =
          1. Es un acumulador que multiplica: empieza en 1.
        </p>
      </>
    ),
    consigna: (
      <>
        Leé N y mostrá <code>N! = resultado</code> (por ejemplo, <code>5! = 120</code>).
      </>
    ),
    start: A('    Definir n, i, f Como Entero\n    Leer n\n', 'factorial'),
    tests: [
      { inputs: ['5'], expect: ['5! = 120'] },
      { inputs: ['1'], expect: ['1! = 1'] },
      { inputs: ['0'], expect: ['0! = 1'] },
      { inputs: ['7'], expect: ['7! = 5040'] },
    ],
    usa: [['mientras', 'para', 'repetir']],
    hint: 'f <- 1  y después  Para i <- 1 Hasta n … f <- f * i … FinPara',
    solucion: A('    Definir n, i, f Como Entero\n    Leer n\n    f <- 1\n    Para i <- 1 Hasta n Hacer\n        f <- f * i\n    FinPara\n    Escribir n, "! = ", f', 'factorial'),
  },
]

export const getLesson = (id?: string) => LESSONS.find((l) => l.id === id)
