import { codeOnly, lines, norm, type CourseModule, type Track } from '../types'

/* ------------------------------------------------------------------ ayudas */

/** saca el salto de línea inicial de un bloque de código escrito entre comillas invertidas */
const J = (s: string) => s.replace(/^\n/, '')

/** textos entre comillas del código (sin contar comentarios) */
const strs = (code: string) =>
  code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .match(/"(?:[^"\\\n]|\\.)*"/g) ?? []

/** cuántas veces aparece una expresión */
const count = (re: RegExp, s: string) => (s.match(new RegExp(re.source, 'g' + re.flags.replace('g', ''))) ?? []).length

/** líneas de la salida aceptando coma decimal (7,50 → 7.50) */
const L = (o: string) => lines(o.replace(/(\d),(\d)/g, '$1.$2'))

/** la salida tiene una línea igual a s (sin importar espacios a los costados) */
const hasLine = (o: string, s: string) => L(o).includes(s)

/** el código usa Scanner y lo lee de verdad */
const usa = (code: string, re: RegExp) => re.test(codeOnly(code))

/* ================================================================== 1. Primeros pasos */

const PRIMEROS: CourseModule = {
  id: 'java-primeros',
  title: 'Primeros pasos',
  desc: 'Escribir en pantalla, comentarios y la estructura de un programa.',
  lessons: [
    {
      id: 'java-1',
      kind: 'java',
      title: 'Hola, mundo',
      intro: (
        <>
          <p>Todo programa de Java tiene una clase y un método <code>main</code>, que es donde empieza a ejecutarse:</p>
          <pre>
            <code>{'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hola");\n  }\n}'}</code>
          </pre>
          <p>
            <code>System.out.println</code> escribe un texto en la consola y pasa a la línea siguiente. Cada instrucción termina
            con punto y coma <code>;</code>.
          </p>
        </>
      ),
      task: (
        <p>
          Hacé que el programa muestre <b>dos líneas</b>: primero <code>Hola, mundo</code> y después <code>Estoy en el ITS Villada</code>.
        </p>
      ),
      hint: <p>Usá dos veces System.out.println, una debajo de la otra.</p>,
      starter: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hola, mundo");\n    }\n}\n',
      solution: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hola, mundo");\n        System.out.println("Estoy en el ITS Villada");\n    }\n}\n',
      tests: [
        { text: 'La primera línea es "Hola, mundo"', check: (out) => lines(out)[0] === 'Hola, mundo' },
        { text: 'La segunda línea es "Estoy en el ITS Villada"', check: (out) => lines(out)[1] === 'Estoy en el ITS Villada' },
        { text: 'Muestra exactamente dos líneas', check: (out) => norm(out).split('\n').length === 2 },
        { text: 'Usa System.out.println', check: (_o, code) => /System\.out\.println/.test(codeOnly(code)) },
      ],
    },
    {
      id: 'java-print',
      kind: 'java',
      title: 'print y println',
      intro: (
        <>
          <p>
            Hay dos formas de escribir: <code>System.out.println</code> escribe y <b>baja de línea</b>; <code>System.out.print</code> escribe
            y se queda <b>en la misma línea</b>.
          </p>
          <pre>
            <code>{'System.out.print("Hola ");\nSystem.out.print("a ");\nSystem.out.println("todos");\nSystem.out.println("Chau");'}</code>
          </pre>
          <p>
            Eso muestra <code>Hola a todos</code> en una línea y <code>Chau</code> en la siguiente. Ojo con los espacios: si no los
            ponés vos dentro de las comillas, las palabras quedan pegadas.
          </p>
        </>
      ),
      task: (
        <>
          <p>El kiosco quiere mostrar sus productos en una sola línea. Hacé que la salida sea exactamente:</p>
          <pre>
            <code>{'Alfajor Gaseosa Turrón\nTotal: 3 productos'}</code>
          </pre>
          <p>
            La primera línea tiene que armarse con <b>tres</b> <code>System.out.print</code> (uno por producto).
          </p>
        </>
      ),
      hint: <p>Después del último print usá un println para bajar de línea (o poné el último producto con println).</p>,
      starter: J(`
public class Main {
    public static void main(String[] args) {
        System.out.println("Alfajor");
        System.out.println("Gaseosa");
        System.out.println("Turrón");
        System.out.println("Total: 3 productos");
    }
}
`),
      solution: J(`
public class Main {
    public static void main(String[] args) {
        System.out.print("Alfajor ");
        System.out.print("Gaseosa ");
        System.out.print("Turrón");
        System.out.println();
        System.out.println("Total: 3 productos");
    }
}
`),
      tests: [
        { text: 'La primera línea es "Alfajor Gaseosa Turrón"', check: (o) => lines(o)[0] === 'Alfajor Gaseosa Turrón' },
        { text: 'La segunda línea es "Total: 3 productos"', check: (o) => lines(o)[1] === 'Total: 3 productos' },
        { text: 'Muestra exactamente dos líneas', check: (o) => lines(o).length === 2 },
        { text: 'Usa al menos tres System.out.print', check: (_o, c) => count(/System\.out\.print\s*\(/, codeOnly(c)) >= 3 },
      ],
    },
    {
      id: 'java-comentarios',
      kind: 'java',
      title: 'Comentarios',
      intro: (
        <>
          <p>
            Un <b>comentario</b> es texto que Java ignora: sirve para explicar el código o para «apagar» una línea sin borrarla.
          </p>
          <pre>
            <code>{'// comentario de una línea\n/* comentario\n   de varias líneas */\n// System.out.println("esta línea no se ejecuta");'}</code>
          </pre>
        </>
      ),
      task: (
        <>
          <p>
            El programa tiene dos líneas de prueba que empiezan con <code>BORRAR</code>. <b>No las borres</b>: convertilas en comentario
            con <code>//</code>. Además, agregá un comentario (al principio del <code>main</code>) que explique qué hace el programa.
          </p>
          <p>La salida tiene que quedar así:</p>
          <pre>
            <code>{'Receta: tostado\nIngredientes: pan, jamón y queso'}</code>
          </pre>
        </>
      ),
      hint: <p>Poné // al principio de cada línea que no querés que se ejecute.</p>,
      starter: J(`
public class Main {
    public static void main(String[] args) {
        System.out.println("Receta: tostado");
        System.out.println("BORRAR: prueba 1");
        System.out.println("Ingredientes: pan, jamón y queso");
        System.out.println("BORRAR: prueba 2");
    }
}
`),
      solution: J(`
public class Main {
    public static void main(String[] args) {
        // Muestra la receta del tostado del buffet
        System.out.println("Receta: tostado");
        // System.out.println("BORRAR: prueba 1");
        System.out.println("Ingredientes: pan, jamón y queso");
        // System.out.println("BORRAR: prueba 2");
    }
}
`),
      tests: [
        { text: 'Muestra "Receta: tostado" y después "Ingredientes: pan, jamón y queso"', check: (o) => lines(o)[0] === 'Receta: tostado' && lines(o)[1] === 'Ingredientes: pan, jamón y queso' },
        { text: 'No muestra las líneas de prueba (solo dos líneas)', check: (o) => lines(o).length === 2 && !o.includes('BORRAR') },
        { text: 'Las líneas BORRAR siguen en el código, como comentario', check: (_o, c) => /\/\/.*BORRAR: prueba 1/.test(c) && /\/\/.*BORRAR: prueba 2/.test(c) },
        { text: 'Hay al menos un comentario más que explica el programa', check: (_o, c) => count(/\/\/|\/\*/, c) >= 3 },
      ],
    },
  ],
}

/* ================================================================== 2. Variables y tipos */

const VARIABLES: CourseModule = {
  id: 'java-variables',
  title: 'Variables y tipos',
  desc: 'Guardar datos: int, double, String, boolean, char y constantes.',
  lessons: [
    {
      id: 'java-variables',
      kind: 'java',
      title: 'Variables: int y String',
      intro: (
        <>
          <p>
            Una <b>variable</b> es una caja con nombre donde guardás un dato. En Java hay que decir de qué <b>tipo</b> es: <code>int</code> para
            números enteros, <code>String</code> para textos (entre comillas).
          </p>
          <pre>
            <code>{'String club = "Talleres";\nint socios = 120;\nSystem.out.println(club + " tiene " + socios + " socios");\nsocios = 125;   // asignación: cambia el valor'}</code>
          </pre>
          <p>
            Con <code>+</code> se <b>concatena</b>: se pegan textos y variables. La variable va <b>sin comillas</b>; si le ponés comillas
            se muestra la palabra, no el valor.
          </p>
        </>
      ),
      task: (
        <>
          <p>Usando las variables <code>nombre</code> y <code>edad</code> (sin escribir los valores dentro de los textos):</p>
          <ol>
            <li>
              Mostrá <code>Me llamo Tomás y tengo 15 años</code>
            </li>
            <li>
              Cambiá el valor de <code>edad</code> a 16 con una asignación (<code>edad = 16;</code>) y mostrá <code>Ahora Tomás tiene 16 años</code>
            </li>
          </ol>
        </>
      ),
      hint: <p>{'"Me llamo " + nombre + " y tengo " + edad + " años"'}</p>,
      starter: J(`
public class Main {
    public static void main(String[] args) {
        String nombre = "Tomás";
        int edad = 15;
        // tu código
    }
}
`),
      solution: J(`
public class Main {
    public static void main(String[] args) {
        String nombre = "Tomás";
        int edad = 15;
        System.out.println("Me llamo " + nombre + " y tengo " + edad + " años");
        edad = 16;
        System.out.println("Ahora " + nombre + " tiene " + edad + " años");
    }
}
`),
      tests: [
        { text: 'Primera línea: "Me llamo Tomás y tengo 15 años"', check: (o) => lines(o)[0] === 'Me llamo Tomás y tengo 15 años' },
        { text: 'Segunda línea: "Ahora Tomás tiene 16 años"', check: (o) => lines(o)[1] === 'Ahora Tomás tiene 16 años' },
        { text: 'Cambia edad con una asignación', check: (_o, c) => /\bedad\s*(=\s*16|=\s*edad\s*\+\s*1|\+=\s*1|\+\+)/.test(codeOnly(c).replace(/int\s+edad\s*=\s*15/, '')) },
        { text: 'Usa las variables: "Tomás", 15 y 16 no están escritos dentro de los textos', check: (_o, c) => strs(c).filter((s) => s.includes('Tomás')).length === 1 && !strs(c).some((s) => /1[56]/.test(s)) },
      ],
    },
    {
      id: 'java-tipos',
      kind: 'java',
      title: 'double, boolean y char',
      intro: (
        <>
          <p>Otros tipos que vas a usar todo el tiempo:</p>
          <ul>
            <li>
              <code>double</code>: números con decimales. Se escriben con <b>punto</b>: <code>double precio = 1250.5;</code>
            </li>
            <li>
              <code>boolean</code>: solo puede valer <code>true</code> (verdadero) o <code>false</code> (falso).
            </li>
            <li>
              <code>char</code>: un solo carácter, entre comillas <b>simples</b>: <code>{"char letra = 'A';"}</code>
            </li>
          </ul>
          <pre>
            <code>{'double altura = 1.68;\nboolean esSocio = true;\nchar division = \'B\';\nSystem.out.println("División: " + division);'}</code>
          </pre>
        </>
      ),
      task: (
        <>
          <p>
            Declará <code>double temperatura = 31.5</code>, <code>boolean llueve = false</code> y <code>{"char turno = 'M'"}</code>, y
            mostralas usando las variables. La salida tiene que ser:
          </p>
          <pre>
            <code>{'Temperatura en Córdoba: 31.5\n¿Llueve?: false\nTurno: M'}</code>
          </pre>
        </>
      ),
      hint: <p>Cada línea es un texto fijo + la variable, por ejemplo "Turno: " + turno.</p>,
      starter: J(`
public class Main {
    public static void main(String[] args) {
        // declará las variables acá

        System.out.println("Temperatura en Córdoba: 31.5");
    }
}
`),
      solution: J(`
public class Main {
    public static void main(String[] args) {
        double temperatura = 31.5;
        boolean llueve = false;
        char turno = 'M';
        System.out.println("Temperatura en Córdoba: " + temperatura);
        System.out.println("¿Llueve?: " + llueve);
        System.out.println("Turno: " + turno);
    }
}
`),
      tests: [
        { text: 'Línea 1: "Temperatura en Córdoba: 31.5"', check: (o) => lines(o)[0] === 'Temperatura en Córdoba: 31.5' },
        { text: 'Línea 2: "¿Llueve?: false"', check: (o) => lines(o)[1] === '¿Llueve?: false' },
        { text: 'Línea 3: "Turno: M"', check: (o) => lines(o)[2] === 'Turno: M' },
        { text: 'Declara variables double, boolean y char', check: (_o, c) => /\bdouble\s+\w+\s*=/.test(codeOnly(c)) && /\bboolean\s+\w+\s*=/.test(codeOnly(c)) && /\bchar\s+\w+\s*=\s*'/.test(codeOnly(c)) },
        { text: 'Los valores no están escritos dentro de los textos', check: (_o, c) => !strs(c).some((s) => /31\.5|false|: M/.test(s)) },
      ],
    },
    {
      id: 'java-concatenar',
      kind: 'java',
      title: 'Concatenar y constantes',
      intro: (
        <>
          <p>
            Cuidado: <code>+</code> suma números, pero si a la izquierda hay un texto, <b>pega</b>. Java lee de izquierda a derecha:
          </p>
          <pre>
            <code>{'int a = 2, b = 3;\nSystem.out.println("Suma: " + a + b);    // Suma: 23  (pegó)\nSystem.out.println("Suma: " + (a + b));  // Suma: 5   (sumó primero)'}</code>
          </pre>
          <p>
            Una <b>constante</b> es una variable que no puede cambiar. Se marca con <code>final</code> y por costumbre se escribe en
            MAYÚSCULAS:
          </p>
          <pre>
            <code>{'final int PRECIO_ENTRADA = 2500;'}</code>
          </pre>
        </>
      ),
      task: (
        <>
          <p>
            El programa muestra <code>Productos: 32</code> en vez de sumar. Arreglalo para que muestre <code>Productos: 5</code>. Después
            declará una constante <code>final int PRECIO = 800;</code> y mostrá el total a pagar (productos × precio), calculado en el
            programa:
          </p>
          <pre>
            <code>{'Productos: 5\nTotal: $4000'}</code>
          </pre>
        </>
      ),
      hint: <p>Usá paréntesis: (alfajores + turrones). Para el total: (alfajores + turrones) * PRECIO.</p>,
      starter: J(`
public class Main {
    public static void main(String[] args) {
        int alfajores = 3;
        int turrones = 2;
        System.out.println("Productos: " + alfajores + turrones);
    }
}
`),
      solution: J(`
public class Main {
    public static void main(String[] args) {
        final int PRECIO = 800;
        int alfajores = 3;
        int turrones = 2;
        System.out.println("Productos: " + (alfajores + turrones));
        System.out.println("Total: $" + (alfajores + turrones) * PRECIO);
    }
}
`),
      tests: [
        { text: 'Primera línea: "Productos: 5"', check: (o) => lines(o)[0] === 'Productos: 5' },
        { text: 'Segunda línea: "Total: $4000"', check: (o) => lines(o)[1] === 'Total: $4000' },
        { text: 'Declara una constante con final', check: (_o, c) => /\bfinal\s+(int|double)\s+[A-Z_][A-Z0-9_]*\s*=/.test(codeOnly(c)) },
        { text: 'Los resultados se calculan (5 y 4000 no están escritos en los textos)', check: (_o, c) => !strs(c).some((s) => /5|4000/.test(s)) },
      ],
    },
  ],
}

/* ================================================================== 3. Operadores */

const OPERADORES: CourseModule = {
  id: 'java-operadores',
  title: 'Operadores',
  desc: 'Cuentas: división entera, resto, casting y la clase Math.',
  lessons: [
    {
      id: 'java-aritmetica',
      kind: 'java',
      title: 'División entera y resto',
      intro: (
        <>
          <p>
            Los operadores son <code>+ - * /</code> y <code>%</code>. Cuando dividís dos <code>int</code>, el resultado es <b>entero</b> (se
            descarta lo que sobra), y <code>%</code> da el <b>resto</b> de la división:
          </p>
          <pre>
            <code>{'System.out.println(17 / 5);  // 3\nSystem.out.println(17 % 5);  // 2\nSystem.out.println(10 % 2);  // 0  (10 es par)'}</code>
          </pre>
          <p>
            Desde esta lección el programa ya trae un <code>Scanner</code> que lee los datos del recuadro <b>Entrada</b> (lo vas a ver bien
            en el módulo 4). Las pruebas lo ejecutan con distintas entradas.
          </p>
        </>
      ),
      task: (
        <>
          <p>
            La película del ciclo de cine de la cooperadora dura <code>minutos</code> minutos. Mostrá cuántas horas y minutos son, con
            este formato exacto:
          </p>
          <pre>
            <code>{'Entrada: 135\nSalida:  135 minutos son 2 horas y 15 minutos'}</code>
          </pre>
        </>
      ),
      hint: <p>Las horas son minutos / 60 y lo que sobra es minutos % 60.</p>,
      sampleInput: '135',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int minutos = sc.nextInt();
        System.out.println(minutos + " minutos son ...");
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int minutos = sc.nextInt();
        int horas = minutos / 60;
        int resto = minutos % 60;
        System.out.println(minutos + " minutos son " + horas + " horas y " + resto + " minutos");
    }
}
`),
      tests: [
        { text: 'Con 135: "135 minutos son 2 horas y 15 minutos"', input: '135', check: (o) => lines(o)[0] === '135 minutos son 2 horas y 15 minutos' },
        { text: 'Con 200: "200 minutos son 3 horas y 20 minutos"', input: '200', check: (o) => lines(o)[0] === '200 minutos son 3 horas y 20 minutos' },
        { text: 'Con 45: "45 minutos son 0 horas y 45 minutos"', input: '45', check: (o) => lines(o)[0] === '45 minutos son 0 horas y 45 minutos' },
        { text: 'Usa el operador %', check: (_o, c) => /%/.test(codeOnly(c)) },
      ],
    },
    {
      id: 'java-casting',
      kind: 'java',
      title: 'Promedios y casting',
      intro: (
        <>
          <p>
            Si sumás tres notas <code>int</code> y dividís por 3, Java hace división <b>entera</b>: <code>(7 + 8 + 8) / 3</code> da{' '}
            <code>7</code>, no <code>7.67</code>. Para tener decimales, uno de los dos tiene que ser <code>double</code>. Eso se logra con un{' '}
            <b>casting</b> o dividiendo por <code>3.0</code>:
          </p>
          <pre>
            <code>{'double p = (double) (a + b + c) / 3;   // casting a double\ndouble q = (a + b + c) / 3.0;          // también funciona\nint entero = (int) 7.9;                // 7 (corta los decimales)\nSystem.out.printf("%.2f%n", p);        // muestra con 2 decimales'}</code>
          </pre>
          <p>
            <code>printf</code> con <code>%.2f</code> muestra un número con 2 decimales y <code>%n</code> baja de línea.
          </p>
        </>
      ),
      task: (
        <>
          <p>El programa lee tres notas enteras, pero el promedio sale mal. Arreglalo y agregá la parte entera del promedio:</p>
          <pre>
            <code>{'Entrada: 7 8 8\nSalida:\nPromedio: 7.67\nParte entera: 7'}</code>
          </pre>
        </>
      ),
      hint: <p>Hacé el casting (double) antes de dividir, y (int) promedio para la parte entera.</p>,
      sampleInput: '7 8 8',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n1 = sc.nextInt();
        int n2 = sc.nextInt();
        int n3 = sc.nextInt();
        double promedio = (n1 + n2 + n3) / 3;
        System.out.printf("Promedio: %.2f%n", promedio);
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n1 = sc.nextInt();
        int n2 = sc.nextInt();
        int n3 = sc.nextInt();
        double promedio = (double) (n1 + n2 + n3) / 3;
        System.out.printf("Promedio: %.2f%n", promedio);
        System.out.println("Parte entera: " + (int) promedio);
    }
}
`),
      tests: [
        { text: 'Con 7 8 8: "Promedio: 7.67" y "Parte entera: 7"', input: '7 8 8', check: (o) => L(o)[0] === 'Promedio: 7.67' && L(o)[1] === 'Parte entera: 7' },
        { text: 'Con 10 9 9: "Promedio: 9.33" y "Parte entera: 9"', input: '10 9 9', check: (o) => L(o)[0] === 'Promedio: 9.33' && L(o)[1] === 'Parte entera: 9' },
        { text: 'Con 4 5 5: "Promedio: 4.67" y "Parte entera: 4"', input: '4 5 5', check: (o) => L(o)[0] === 'Promedio: 4.67' && L(o)[1] === 'Parte entera: 4' },
        { text: 'Usa un casting a int', check: (_o, c) => /\(\s*int\s*\)/.test(codeOnly(c)) },
      ],
    },
    {
      id: 'java-math',
      kind: 'java',
      title: 'La clase Math',
      intro: (
        <>
          <p>
            <code>Math</code> trae funciones matemáticas listas para usar:
          </p>
          <pre>
            <code>{'Math.sqrt(25)      // 5.0   raíz cuadrada\nMath.pow(2, 3)     // 8.0   potencia\nMath.max(4, 9)     // 9     el mayor\nMath.min(4, 9)     // 4     el menor\nMath.abs(-7)       // 7     valor absoluto\nMath.round(2.6)    // 3     redondeo'}</code>
          </pre>
        </>
      ),
      task: (
        <>
          <p>
            En el taller hay que apoyar una escalera: el pie queda a <code>a</code> metros de la pared y tiene que llegar a <code>b</code>{' '}
            metros de altura. El largo de la escalera es la hipotenusa: √(a² + b²). Mostrá el largo y el mayor de los dos catetos, ambos
            con 2 decimales:
          </p>
          <pre>
            <code>{'Entrada: 3 4\nSalida:\nEscalera: 5.00 m\nCateto mayor: 4.00 m'}</code>
          </pre>
        </>
      ),
      hint: <p>Math.sqrt(a * a + b * b) y Math.max(a, b). Para mostrar: printf con %.2f.</p>,
      sampleInput: '3 4',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double a = sc.nextDouble();
        double b = sc.nextDouble();
        double escalera = a + b;
        System.out.printf("Escalera: %.2f m%n", escalera);
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double a = sc.nextDouble();
        double b = sc.nextDouble();
        double escalera = Math.sqrt(a * a + b * b);
        System.out.printf("Escalera: %.2f m%n", escalera);
        System.out.printf("Cateto mayor: %.2f m%n", Math.max(a, b));
    }
}
`),
      tests: [
        { text: 'Con 3 4: "Escalera: 5.00 m" y "Cateto mayor: 4.00 m"', input: '3 4', check: (o) => L(o)[0] === 'Escalera: 5.00 m' && L(o)[1] === 'Cateto mayor: 4.00 m' },
        { text: 'Con 1.5 2: "Escalera: 2.50 m" y "Cateto mayor: 2.00 m"', input: '1.5 2', check: (o) => L(o)[0] === 'Escalera: 2.50 m' && L(o)[1] === 'Cateto mayor: 2.00 m' },
        { text: 'Con 6 2.5: "Escalera: 6.50 m" y "Cateto mayor: 6.00 m"', input: '6 2.5', check: (o) => L(o)[0] === 'Escalera: 6.50 m' && L(o)[1] === 'Cateto mayor: 6.00 m' },
        { text: 'Usa Math.sqrt y Math.max', check: (_o, c) => usa(c, /Math\.sqrt\s*\(/) && usa(c, /Math\.max\s*\(/) },
      ],
    },
    {
      id: 'java-proy-vuelto',
      kind: 'java',
      title: 'Mini-proyecto: el vuelto del kiosco',
      intro: (
        <>
          <p>
            <b>Mini-proyecto.</b> Vas a juntar lo del módulo: variables, división entera y resto. La idea es calcular el vuelto y decir
            con qué billetes darlo, usando primero los más grandes.
          </p>
          <pre>
            <code>{'int billetes = vuelto / 1000;   // cuántos de 1000 entran\nvuelto = vuelto % 1000;         // lo que queda para los siguientes'}</code>
          </pre>
        </>
      ),
      task: (
        <>
          <p>
            Se leen el <b>precio</b> y lo que <b>paga</b> el cliente (enteros). Mostrá el vuelto y cuántos billetes de $1000, $500 y $100
            hay que dar; lo que sobra va en monedas. Formato exacto:
          </p>
          <pre>
            <code>{'Entrada: 1350 5000\nSalida:\nVuelto: $3650\nBilletes de $1000: 3\nBilletes de $500: 1\nBilletes de $100: 1\nMonedas: $50'}</code>
          </pre>
        </>
      ),
      hint: <p>Calculá el vuelto, y en cada paso usá / para contar billetes y % para quedarte con el resto.</p>,
      sampleInput: '1350 5000',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int precio = sc.nextInt();
        int pago = sc.nextInt();
        int vuelto = pago - precio;
        System.out.println("Vuelto: $" + vuelto);
        // billetes de 1000, 500, 100 y monedas
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int precio = sc.nextInt();
        int pago = sc.nextInt();
        int vuelto = pago - precio;
        System.out.println("Vuelto: $" + vuelto);
        int resto = vuelto;
        System.out.println("Billetes de $1000: " + resto / 1000);
        resto = resto % 1000;
        System.out.println("Billetes de $500: " + resto / 500);
        resto = resto % 500;
        System.out.println("Billetes de $100: " + resto / 100);
        resto = resto % 100;
        System.out.println("Monedas: $" + resto);
    }
}
`),
      tests: [
        {
          text: 'Con 1350 5000: vuelto $3650 → 3, 1, 1 y monedas $50',
          input: '1350 5000',
          check: (o) => norm(lines(o).join('\n')) === 'Vuelto: $3650\nBilletes de $1000: 3\nBilletes de $500: 1\nBilletes de $100: 1\nMonedas: $50',
        },
        {
          text: 'Con 780 1000: vuelto $220 → 0, 0, 2 y monedas $20',
          input: '780 1000',
          check: (o) => norm(lines(o).join('\n')) === 'Vuelto: $220\nBilletes de $1000: 0\nBilletes de $500: 0\nBilletes de $100: 2\nMonedas: $20',
        },
        {
          text: 'Con 2000 2000: vuelto $0 → todo en 0',
          input: '2000 2000',
          check: (o) => norm(lines(o).join('\n')) === 'Vuelto: $0\nBilletes de $1000: 0\nBilletes de $500: 0\nBilletes de $100: 0\nMonedas: $0',
        },
      ],
    },
  ],
}

/* ================================================================== 4. Entrada con Scanner */

const ENTRADA: CourseModule = {
  id: 'java-entrada',
  title: 'Entrada con Scanner',
  desc: 'Leer textos y números que escribe el usuario.',
  lessons: [
    {
      id: 'java-nextline',
      kind: 'java',
      title: 'Leer un texto: nextLine',
      intro: (
        <>
          <p>
            Para leer lo que escribe el usuario se usa un <code>Scanner</code>. Hay que importarlo arriba de todo y crearlo una vez:
          </p>
          <pre>
            <code>{'import java.util.Scanner;\n...\nScanner sc = new Scanner(System.in);\nString frase = sc.nextLine();   // lee toda la línea\nString palabra = sc.next();     // lee una sola palabra'}</code>
          </pre>
          <p>
            Acá lo que «escribe el usuario» está en el recuadro <b>Entrada</b>. No hace falta mostrar mensajes del tipo «Ingresá tu
            nombre»: las pruebas miran solo lo que pide la consigna.
          </p>
        </>
      ),
      task: (
        <>
          <p>Leé el nombre completo (puede tener varias palabras) y saludá:</p>
          <pre>
            <code>{'Entrada: Ana Pérez\nSalida:\nHola, Ana Pérez\nBienvenido/a al taller de Computación'}</code>
          </pre>
        </>
      ),
      hint: <p>String nombre = sc.nextLine(); y después "Hola, " + nombre.</p>,
      sampleInput: 'Ana Pérez',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // leé el nombre acá
        System.out.println("Hola");
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String nombre = sc.nextLine();
        System.out.println("Hola, " + nombre);
        System.out.println("Bienvenido/a al taller de Computación");
    }
}
`),
      tests: [
        { text: 'Con "Ana Pérez": "Hola, Ana Pérez"', input: 'Ana Pérez', check: (o) => lines(o)[0] === 'Hola, Ana Pérez' },
        { text: 'Con "Juan Martín Díaz": "Hola, Juan Martín Díaz" (lee la línea entera)', input: 'Juan Martín Díaz', check: (o) => lines(o)[0] === 'Hola, Juan Martín Díaz' },
        { text: 'Segunda línea: "Bienvenido/a al taller de Computación"', input: 'Ana Pérez', check: (o) => lines(o)[1] === 'Bienvenido/a al taller de Computación' },
      ],
    },
    {
      id: 'java-nextint',
      kind: 'java',
      title: 'Leer números: nextInt y nextDouble',
      intro: (
        <>
          <p>Para leer números:</p>
          <pre>
            <code>{'int cantidad = sc.nextInt();       // entero\ndouble precio = sc.nextDouble();   // con decimales (se escribe con punto: 450.5)'}</code>
          </pre>
          <p>Los números pueden venir en la misma línea separados por espacios, o en líneas distintas: el Scanner los separa solo.</p>
        </>
      ),
      task: (
        <>
          <p>Leé la cantidad (entero) y el precio unitario (decimal) de una compra y mostrá:</p>
          <pre>
            <code>{'Entrada: 3 450.5\nSalida:\nCantidad: 3\nTotal: $1351.50'}</code>
          </pre>
          <p>El total va con 2 decimales.</p>
        </>
      ),
      hint: <p>System.out.printf("Total: $%.2f%n", cantidad * precio);</p>,
      sampleInput: '3 450.5',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int cantidad = sc.nextInt();
        double precio = 0; // leelo con nextDouble
        System.out.println("Cantidad: " + cantidad);
        System.out.printf("Total: $%.2f%n", cantidad * precio);
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int cantidad = sc.nextInt();
        double precio = sc.nextDouble();
        System.out.println("Cantidad: " + cantidad);
        System.out.printf("Total: $%.2f%n", cantidad * precio);
    }
}
`),
      tests: [
        { text: 'Con 3 450.5: "Cantidad: 3" y "Total: $1351.50"', input: '3 450.5', check: (o) => L(o)[0] === 'Cantidad: 3' && L(o)[1] === 'Total: $1351.50' },
        { text: 'Con 2 1200: "Total: $2400.00"', input: '2 1200', check: (o) => L(o)[0] === 'Cantidad: 2' && L(o)[1] === 'Total: $2400.00' },
        { text: 'Con 5 99.9 (en dos líneas): "Total: $499.50"', input: '5\n99.9', check: (o) => L(o)[1] === 'Total: $499.50' },
      ],
    },
    {
      id: 'java-buffer',
      kind: 'java',
      title: 'Ojo: nextLine después de nextInt',
      intro: (
        <>
          <p>
            Una trampa clásica: <code>nextInt()</code> lee el número pero <b>deja el Enter</b> pendiente. Si después llamás a{' '}
            <code>nextLine()</code>, lee ese Enter y devuelve un texto vacío.
          </p>
          <pre>
            <code>{'int edad = sc.nextInt();\nsc.nextLine();                 // descarta el Enter que quedó\nString nombre = sc.nextLine(); // ahora sí lee el nombre'}</code>
          </pre>
        </>
      ),
      task: (
        <>
          <p>
            El programa lee la edad y después el nombre completo, pero el nombre sale vacío. Arreglalo:
          </p>
          <pre>
            <code>{'Entrada:\n15\nLucía Gómez\nSalida:\nLucía Gómez tiene 15 años'}</code>
          </pre>
        </>
      ),
      hint: <p>Agregá un sc.nextLine(); suelto entre el nextInt y el nextLine que lee el nombre.</p>,
      sampleInput: '15\nLucía Gómez',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int edad = sc.nextInt();
        String nombre = sc.nextLine();
        System.out.println(nombre + " tiene " + edad + " años");
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int edad = sc.nextInt();
        sc.nextLine();
        String nombre = sc.nextLine();
        System.out.println(nombre + " tiene " + edad + " años");
    }
}
`),
      tests: [
        { text: 'Con 15 y "Lucía Gómez": "Lucía Gómez tiene 15 años"', input: '15\nLucía Gómez', check: (o) => lines(o)[0] === 'Lucía Gómez tiene 15 años' },
        { text: 'Con 17 y "Mateo Ruiz Paz": "Mateo Ruiz Paz tiene 17 años"', input: '17\nMateo Ruiz Paz', check: (o) => lines(o)[0] === 'Mateo Ruiz Paz tiene 17 años' },
        { text: 'Lee el nombre con nextLine', check: (_o, c) => usa(c, /nextLine\s*\(/) },
      ],
    },
    {
      id: 'java-proy-promedios',
      kind: 'java',
      title: 'Mini-proyecto: calculadora de promedios',
      intro: (
        <>
          <p>
            <b>Mini-proyecto.</b> Un programa que sirva de verdad: le cargás tu nombre y las notas de los 4 trabajos prácticos y te dice
            el promedio, la mejor y la peor nota.
          </p>
          <pre>
            <code>{'double mayor = Math.max(Math.max(a, b), Math.max(c, d));'}</code>
          </pre>
        </>
      ),
      task: (
        <>
          <p>
            Leé el nombre (primera línea, puede tener espacios) y después 4 notas con decimales. Mostrá con este formato (promedio con
            2 decimales, las notas con 1):
          </p>
          <pre>
            <code>{'Entrada:\nAna Pérez\n7 9 5.5 7.5\nSalida:\nAlumno/a: Ana Pérez\nPromedio: 7.25\nNota más alta: 9.0\nNota más baja: 5.5'}</code>
          </pre>
        </>
      ),
      hint: <p>Leé el nombre con nextLine y las notas con nextDouble. Para la más alta y la más baja combiná Math.max y Math.min.</p>,
      sampleInput: 'Ana Pérez\n7 9 5.5 7.5',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String nombre = sc.nextLine();
        // leé las 4 notas

        System.out.println("Alumno/a: " + nombre);
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String nombre = sc.nextLine();
        double a = sc.nextDouble();
        double b = sc.nextDouble();
        double c = sc.nextDouble();
        double d = sc.nextDouble();
        double promedio = (a + b + c + d) / 4;
        double alta = Math.max(Math.max(a, b), Math.max(c, d));
        double baja = Math.min(Math.min(a, b), Math.min(c, d));
        System.out.println("Alumno/a: " + nombre);
        System.out.printf("Promedio: %.2f%n", promedio);
        System.out.printf("Nota más alta: %.1f%n", alta);
        System.out.printf("Nota más baja: %.1f%n", baja);
    }
}
`),
      tests: [
        {
          text: 'Con Ana Pérez y 7 9 5.5 7.5: promedio 7.25, alta 9.0, baja 5.5',
          input: 'Ana Pérez\n7 9 5.5 7.5',
          check: (o) => L(o).join('\n') === 'Alumno/a: Ana Pérez\nPromedio: 7.25\nNota más alta: 9.0\nNota más baja: 5.5',
        },
        {
          text: 'Con Juan Díaz y 4 6 10 8: promedio 7.00, alta 10.0, baja 4.0',
          input: 'Juan Díaz\n4 6 10 8',
          check: (o) => L(o).join('\n') === 'Alumno/a: Juan Díaz\nPromedio: 7.00\nNota más alta: 10.0\nNota más baja: 4.0',
        },
        {
          text: 'Con Sofi y 8.5 8.5 8.5 8.5: promedio 8.50, alta y baja 8.5',
          input: 'Sofi\n8.5 8.5 8.5 8.5',
          check: (o) => L(o).join('\n') === 'Alumno/a: Sofi\nPromedio: 8.50\nNota más alta: 8.5\nNota más baja: 8.5',
        },
      ],
    },
  ],
}

/* ================================================================== 5. Decisiones */

const DECISIONES: CourseModule = {
  id: 'java-decisiones',
  title: 'Decisiones',
  desc: 'if, else, else if, operadores lógicos y switch.',
  lessons: [
    {
      id: 'java-if',
      kind: 'java',
      title: 'if y else',
      intro: (
        <>
          <p>
            Con <code>if</code> el programa decide: si la condición es verdadera hace una cosa, si no (<code>else</code>) hace otra.
          </p>
          <pre>
            <code>{'if (edad >= 18) {\n    System.out.println("Puede votar");\n} else {\n    System.out.println("Todavía no vota");\n}'}</code>
          </pre>
          <p>
            Comparadores: <code>==</code> igual, <code>!=</code> distinto, <code>{'<'}</code>, <code>{'<='}</code>, <code>{'>'}</code>,{' '}
            <code>{'>='}</code>. Ojo: <code>=</code> (un solo igual) es asignar, no comparar.
          </p>
        </>
      ),
      task: (
        <>
          <p>
            Leé una nota (puede tener decimales). Si es 6 o más mostrá <code>Aprobado</code>; si no, <code>Desaprobado</code>.
          </p>
          <pre>
            <code>{'Entrada: 8        Salida: Aprobado\nEntrada: 5.5      Salida: Desaprobado'}</code>
          </pre>
        </>
      ),
      hint: <p>if (nota {'>='} 6) {'{ … }'} else {'{ … }'}</p>,
      sampleInput: '8',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double nota = sc.nextDouble();
        System.out.println("Aprobado");
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double nota = sc.nextDouble();
        if (nota >= 6) {
            System.out.println("Aprobado");
        } else {
            System.out.println("Desaprobado");
        }
    }
}
`),
      tests: [
        { text: 'Con 8: "Aprobado"', input: '8', check: (o) => lines(o).join('|') === 'Aprobado' },
        { text: 'Con 6: "Aprobado" (el 6 aprueba)', input: '6', check: (o) => lines(o).join('|') === 'Aprobado' },
        { text: 'Con 5.5: "Desaprobado"', input: '5.5', check: (o) => lines(o).join('|') === 'Desaprobado' },
        { text: 'Con 2: "Desaprobado"', input: '2', check: (o) => lines(o).join('|') === 'Desaprobado' },
      ],
    },
    {
      id: 'java-elseif',
      kind: 'java',
      title: 'Varias opciones: else if',
      intro: (
        <>
          <p>
            Cuando hay más de dos caminos se encadenan con <code>else if</code>. Java prueba las condiciones <b>en orden</b> y ejecuta
            solo la primera que se cumple:
          </p>
          <pre>
            <code>{'if (goles == 0) {\n    System.out.println("Sin goles");\n} else if (goles < 3) {\n    System.out.println("Algunos goles");\n} else {\n    System.out.println("¡Goleada!");\n}'}</code>
          </pre>
        </>
      ),
      task: (
        <>
          <p>Leé la temperatura de hoy en Córdoba y mostrá un mensaje según estos rangos:</p>
          <ul>
            <li>
              menos de 10 → <code>Hace frío</code>
            </li>
            <li>
              de 10 a menos de 25 → <code>Está lindo</code>
            </li>
            <li>
              de 25 a menos de 35 → <code>Hace calor</code>
            </li>
            <li>
              35 o más → <code>Ola de calor</code>
            </li>
          </ul>
        </>
      ),
      hint: <p>Ordená las condiciones de menor a mayor: if (t {'<'} 10) … else if (t {'<'} 25) … else if (t {'<'} 35) … else …</p>,
      sampleInput: '18',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double t = sc.nextDouble();
        if (t < 10) {
            System.out.println("Hace frío");
        } else {
            System.out.println("Está lindo");
        }
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double t = sc.nextDouble();
        if (t < 10) {
            System.out.println("Hace frío");
        } else if (t < 25) {
            System.out.println("Está lindo");
        } else if (t < 35) {
            System.out.println("Hace calor");
        } else {
            System.out.println("Ola de calor");
        }
    }
}
`),
      tests: [
        { text: 'Con 4: "Hace frío"', input: '4', check: (o) => lines(o).join('|') === 'Hace frío' },
        { text: 'Con 10: "Está lindo"', input: '10', check: (o) => lines(o).join('|') === 'Está lindo' },
        { text: 'Con 24.9: "Está lindo"', input: '24.9', check: (o) => lines(o).join('|') === 'Está lindo' },
        { text: 'Con 25: "Hace calor"', input: '25', check: (o) => lines(o).join('|') === 'Hace calor' },
        { text: 'Con 38: "Ola de calor"', input: '38', check: (o) => lines(o).join('|') === 'Ola de calor' },
      ],
    },
    {
      id: 'java-logicos',
      kind: 'java',
      title: 'Operadores lógicos: && y ||',
      intro: (
        <>
          <p>Para combinar condiciones:</p>
          <ul>
            <li>
              <code>&&</code> (y): se cumple si <b>las dos</b> son verdaderas.
            </li>
            <li>
              <code>||</code> (o): se cumple si <b>al menos una</b> es verdadera.
            </li>
            <li>
              <code>!</code> (no): da vuelta el valor.
            </li>
          </ul>
          <pre>
            <code>{'if (edad >= 13 && edad <= 17) { ... }   // entre 13 y 17\nif (dia == 6 || dia == 7) { ... }       // sábado o domingo'}</code>
          </pre>
        </>
      ),
      task: (
        <>
          <p>
            La cooperadora da una beca si el promedio es <b>8 o más y</b> tiene <b>menos de 10 faltas</b>, <b>o</b> si el promedio es{' '}
            <b>9 o más</b> (aunque tenga faltas). Leé el promedio y las faltas y mostrá <code>Le corresponde la beca</code> o{' '}
            <code>No le corresponde la beca</code>.
          </p>
          <pre>
            <code>{'Entrada: 8.5 3     Salida: Le corresponde la beca\nEntrada: 8.5 12    Salida: No le corresponde la beca\nEntrada: 9.2 15    Salida: Le corresponde la beca'}</code>
          </pre>
        </>
      ),
      hint: <p>(promedio {'>='} 8 && faltas {'<'} 10) || promedio {'>='} 9</p>,
      sampleInput: '8.5 3',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double promedio = sc.nextDouble();
        int faltas = sc.nextInt();
        if (promedio >= 8) {
            System.out.println("Le corresponde la beca");
        } else {
            System.out.println("No le corresponde la beca");
        }
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double promedio = sc.nextDouble();
        int faltas = sc.nextInt();
        if ((promedio >= 8 && faltas < 10) || promedio >= 9) {
            System.out.println("Le corresponde la beca");
        } else {
            System.out.println("No le corresponde la beca");
        }
    }
}
`),
      tests: [
        { text: 'Con 8.5 y 3 faltas: le corresponde', input: '8.5 3', check: (o) => lines(o).join('|') === 'Le corresponde la beca' },
        { text: 'Con 8.5 y 12 faltas: no le corresponde', input: '8.5 12', check: (o) => lines(o).join('|') === 'No le corresponde la beca' },
        { text: 'Con 9.2 y 15 faltas: le corresponde', input: '9.2 15', check: (o) => lines(o).join('|') === 'Le corresponde la beca' },
        { text: 'Con 7 y 0 faltas: no le corresponde', input: '7 0', check: (o) => lines(o).join('|') === 'No le corresponde la beca' },
        { text: 'Usa && y ||', check: (_o, c) => usa(c, /&&/) && usa(c, /\|\|/) },
      ],
    },
    {
      id: 'java-switch',
      kind: 'java',
      title: 'switch',
      intro: (
        <>
          <p>
            <code>switch</code> elige según el <b>valor exacto</b> de una variable. Hay dos formas de escribirlo:
          </p>
          <pre>
            <code>{'switch (opcion) {          // forma clásica: no te olvides el break\n    case 1:\n        System.out.println("Uno");\n        break;\n    default:\n        System.out.println("Otro");\n}\n\nswitch (opcion) {          // forma nueva, con flecha\n    case 1 -> System.out.println("Uno");\n    case 2, 3 -> System.out.println("Dos o tres");\n    default -> System.out.println("Otro");\n}'}</code>
          </pre>
        </>
      ),
      task: (
        <>
          <p>
            Leé un número del 1 al 7 y mostrá el nombre del día (<code>Lunes</code>, <code>Martes</code>, <code>Miércoles</code>,{' '}
            <code>Jueves</code>, <code>Viernes</code>, <code>Sábado</code>, <code>Domingo</code>). Si el número no está entre 1 y 7,
            mostrá <code>Día inválido</code>. Usá <code>switch</code>.
          </p>
        </>
      ),
      hint: <p>Un case por día y default para el resto.</p>,
      sampleInput: '3',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int dia = sc.nextInt();
        switch (dia) {
            case 1 -> System.out.println("Lunes");
            default -> System.out.println("Día inválido");
        }
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int dia = sc.nextInt();
        switch (dia) {
            case 1 -> System.out.println("Lunes");
            case 2 -> System.out.println("Martes");
            case 3 -> System.out.println("Miércoles");
            case 4 -> System.out.println("Jueves");
            case 5 -> System.out.println("Viernes");
            case 6 -> System.out.println("Sábado");
            case 7 -> System.out.println("Domingo");
            default -> System.out.println("Día inválido");
        }
    }
}
`),
      tests: [
        { text: 'Con 1: "Lunes"', input: '1', check: (o) => lines(o).join('|') === 'Lunes' },
        { text: 'Con 3: "Miércoles"', input: '3', check: (o) => lines(o).join('|') === 'Miércoles' },
        { text: 'Con 6: "Sábado"', input: '6', check: (o) => lines(o).join('|') === 'Sábado' },
        { text: 'Con 9: "Día inválido"', input: '9', check: (o) => lines(o).join('|') === 'Día inválido' },
        { text: 'Usa switch', check: (_o, c) => usa(c, /\bswitch\s*\(/) },
      ],
    },
    {
      id: 'java-proy-kiosco',
      kind: 'java',
      title: 'Mini-proyecto: kiosco con menú',
      intro: (
        <>
          <p>
            <b>Mini-proyecto.</b> El kiosco de la cooperadora necesita un programa para cobrar. Muestra el menú, lee qué producto se
            lleva y cuántos, y calcula el total (con descuento si la compra es grande).
          </p>
        </>
      ),
      task: (
        <>
          <p>Primero mostrá este menú (tal cual):</p>
          <pre>
            <code>{'=== Kiosco de la cooperadora ===\n1. Alfajor ($800)\n2. Gaseosa ($1200)\n3. Turrón ($300)\n4. Sándwich de miga ($1500)'}</code>
          </pre>
          <p>
            Después leé la opción y la cantidad. Si la opción no existe, mostrá <code>Opción inválida</code> y nada más. Si existe,
            mostrá <code>Llevás N x Producto</code> y <code>Subtotal: $X</code>. Si el subtotal es <b>mayor a $5000</b> hay 10% de
            descuento: mostrá <code>Descuento: $D</code>. Al final, <code>Total: $T</code>. Ejemplos (después del menú):
          </p>
          <pre>
            <code>{'Entrada: 1 3\nLlevás 3 x Alfajor\nSubtotal: $2400\nTotal: $2400\n\nEntrada: 4 5\nLlevás 5 x Sándwich de miga\nSubtotal: $7500\nDescuento: $750\nTotal: $6750'}</code>
          </pre>
        </>
      ),
      hint: <p>Con un switch guardá el nombre y el precio en variables; después hacé las cuentas una sola vez. El descuento es subtotal / 10.</p>,
      sampleInput: '4 5',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println("=== Kiosco de la cooperadora ===");
        System.out.println("1. Alfajor ($800)");
        System.out.println("2. Gaseosa ($1200)");
        System.out.println("3. Turrón ($300)");
        System.out.println("4. Sándwich de miga ($1500)");
        int opcion = sc.nextInt();
        int cantidad = sc.nextInt();
        if (opcion == 1) {
            System.out.println("Llevás " + cantidad + " x Alfajor");
        }
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println("=== Kiosco de la cooperadora ===");
        System.out.println("1. Alfajor ($800)");
        System.out.println("2. Gaseosa ($1200)");
        System.out.println("3. Turrón ($300)");
        System.out.println("4. Sándwich de miga ($1500)");
        int opcion = sc.nextInt();
        int cantidad = sc.nextInt();
        String producto = "";
        int precio = 0;
        switch (opcion) {
            case 1 -> { producto = "Alfajor"; precio = 800; }
            case 2 -> { producto = "Gaseosa"; precio = 1200; }
            case 3 -> { producto = "Turrón"; precio = 300; }
            case 4 -> { producto = "Sándwich de miga"; precio = 1500; }
        }
        if (precio == 0) {
            System.out.println("Opción inválida");
        } else {
            int subtotal = precio * cantidad;
            System.out.println("Llevás " + cantidad + " x " + producto);
            System.out.println("Subtotal: $" + subtotal);
            int total = subtotal;
            if (subtotal > 5000) {
                int descuento = subtotal / 10;
                System.out.println("Descuento: $" + descuento);
                total = subtotal - descuento;
            }
            System.out.println("Total: $" + total);
        }
    }
}
`),
      tests: [
        { text: 'Muestra el menú de 5 líneas al principio', input: '1 3', check: (o) => lines(o).slice(0, 5).join('|') === '=== Kiosco de la cooperadora ===|1. Alfajor ($800)|2. Gaseosa ($1200)|3. Turrón ($300)|4. Sándwich de miga ($1500)' },
        { text: 'Con 1 3: "Llevás 3 x Alfajor", "Subtotal: $2400", "Total: $2400" (sin descuento)', input: '1 3', check: (o) => lines(o).slice(5).join('|') === 'Llevás 3 x Alfajor|Subtotal: $2400|Total: $2400' },
        { text: 'Con 4 5: subtotal $7500, descuento $750 y total $6750', input: '4 5', check: (o) => lines(o).slice(5).join('|') === 'Llevás 5 x Sándwich de miga|Subtotal: $7500|Descuento: $750|Total: $6750' },
        { text: 'Con 2 2: subtotal $2400 sin descuento', input: '2 2', check: (o) => lines(o).slice(5).join('|') === 'Llevás 2 x Gaseosa|Subtotal: $2400|Total: $2400' },
        { text: 'Con 7 1: "Opción inválida" y nada más', input: '7 1', check: (o) => lines(o).slice(5).join('|') === 'Opción inválida' },
      ],
    },
  ],
}

/* ================================================================== 6. Repeticiones */

const REPETICIONES: CourseModule = {
  id: 'java-repeticiones',
  title: 'Repeticiones',
  desc: 'while, for, do-while, acumuladores, contadores, break y continue.',
  lessons: [
    {
      id: 'java-while',
      kind: 'java',
      title: 'while',
      intro: (
        <>
          <p>
            <code>while</code> repite un bloque <b>mientras</b> la condición sea verdadera. Algo adentro tiene que cambiar, si no, el bucle
            no termina nunca:
          </p>
          <pre>
            <code>{'int i = 1;\nwhile (i <= 3) {\n    System.out.println("Vuelta " + i);\n    i = i + 1;\n}'}</code>
          </pre>
        </>
      ),
      task: (
        <>
          <p>Leé un número y hacé una cuenta regresiva hasta 1, y al final mostrá <code>¡Despegue!</code>:</p>
          <pre>
            <code>{'Entrada: 3\nSalida:\n3\n2\n1\n¡Despegue!'}</code>
          </pre>
        </>
      ),
      hint: <p>while (n {'>'} 0) {'{'} mostrá n y restale 1 {'}'}</p>,
      sampleInput: '5',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        // cuenta regresiva
        System.out.println("¡Despegue!");
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        while (n > 0) {
            System.out.println(n);
            n = n - 1;
        }
        System.out.println("¡Despegue!");
    }
}
`),
      tests: [
        { text: 'Con 3: 3, 2, 1, ¡Despegue!', input: '3', check: (o) => lines(o).join('|') === '3|2|1|¡Despegue!' },
        { text: 'Con 5: 5, 4, 3, 2, 1, ¡Despegue!', input: '5', check: (o) => lines(o).join('|') === '5|4|3|2|1|¡Despegue!' },
        { text: 'Con 1: 1, ¡Despegue!', input: '1', check: (o) => lines(o).join('|') === '1|¡Despegue!' },
        { text: 'Usa while', check: (_o, c) => usa(c, /\bwhile\s*\(/) },
      ],
    },
    {
      id: 'java-for',
      kind: 'java',
      title: 'for',
      intro: (
        <>
          <p>
            Cuando sabés cuántas veces repetir, <code>for</code> junta en una línea el inicio, la condición y el paso:
          </p>
          <pre>
            <code>{'for (int i = 1; i <= 5; i++) {\n    System.out.println(i);\n}\n// i++ es lo mismo que i = i + 1'}</code>
          </pre>
        </>
      ),
      task: (
        <>
          <p>En Educación Física hay que dar <code>n</code> vueltas a la cancha. Leé n y mostrá:</p>
          <pre>
            <code>{'Entrada: 3\nSalida:\nVuelta 1 de 3\nVuelta 2 de 3\nVuelta 3 de 3\n¡Terminaste!'}</code>
          </pre>
        </>
      ),
      hint: <p>for (int i = 1; i {'<='} n; i++)</p>,
      sampleInput: '3',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        System.out.println("Vuelta 1 de " + n);
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        for (int i = 1; i <= n; i++) {
            System.out.println("Vuelta " + i + " de " + n);
        }
        System.out.println("¡Terminaste!");
    }
}
`),
      tests: [
        { text: 'Con 3: tres vueltas y "¡Terminaste!"', input: '3', check: (o) => lines(o).join('|') === 'Vuelta 1 de 3|Vuelta 2 de 3|Vuelta 3 de 3|¡Terminaste!' },
        { text: 'Con 6: seis vueltas (la última es "Vuelta 6 de 6")', input: '6', check: (o) => lines(o).length === 7 && lines(o)[5] === 'Vuelta 6 de 6' && lines(o)[6] === '¡Terminaste!' },
        { text: 'Usa un bucle for', check: (_o, c) => usa(c, /\bfor\s*\(/) },
      ],
    },
    {
      id: 'java-acumuladores',
      kind: 'java',
      title: 'Acumuladores y contadores',
      intro: (
        <>
          <p>Dos patrones que vas a usar siempre dentro de un bucle:</p>
          <ul>
            <li>
              <b>Acumulador</b>: va sumando valores. <code>suma += x;</code> es lo mismo que <code>suma = suma + x;</code>
            </li>
            <li>
              <b>Contador</b>: cuenta cuántas veces pasa algo. <code>cont++;</code> suma 1.
            </li>
          </ul>
          <pre>
            <code>{'double suma = 0;\nint aprobados = 0;\nfor (int i = 0; i < n; i++) {\n    double nota = sc.nextDouble();\n    suma += nota;\n    if (nota >= 6) aprobados++;\n}'}</code>
          </pre>
          <p>
            También existen <code>-=</code>, <code>*=</code>, <code>/=</code> y <code>--</code>.
          </p>
        </>
      ),
      task: (
        <>
          <p>
            Primero se lee cuántos días hay (<code>n</code>) y después la temperatura máxima de cada día en Córdoba. Mostrá el promedio
            (2 decimales) y cuántos días pasaron de 30 grados (más de 30):
          </p>
          <pre>
            <code>{'Entrada:\n5\n28 31.5 25 33 19.5\nSalida:\nPromedio: 27.40\nDías de más de 30 grados: 2'}</code>
          </pre>
        </>
      ),
      hint: <p>Un acumulador para la suma y un contador para los días calurosos; el promedio se calcula después del for.</p>,
      sampleInput: '5\n28 31.5 25 33 19.5',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        double suma = 0;
        int calurosos = 0;
        for (int i = 0; i < n; i++) {
            double t = sc.nextDouble();
            // acumulá y contá
        }
        System.out.printf("Promedio: %.2f%n", suma / n);
        System.out.println("Días de más de 30 grados: " + calurosos);
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        double suma = 0;
        int calurosos = 0;
        for (int i = 0; i < n; i++) {
            double t = sc.nextDouble();
            suma += t;
            if (t > 30) {
                calurosos++;
            }
        }
        System.out.printf("Promedio: %.2f%n", suma / n);
        System.out.println("Días de más de 30 grados: " + calurosos);
    }
}
`),
      tests: [
        { text: 'Con 28 31.5 25 33 19.5: promedio 27.40 y 2 días', input: '5\n28 31.5 25 33 19.5', check: (o) => L(o).join('|') === 'Promedio: 27.40|Días de más de 30 grados: 2' },
        { text: 'Con 10 12 14: promedio 12.00 y 0 días', input: '3\n10 12 14', check: (o) => L(o).join('|') === 'Promedio: 12.00|Días de más de 30 grados: 0' },
        { text: 'Con 35 36 30 31: promedio 33.00 y 3 días (30 no cuenta)', input: '4\n35 36 30 31', check: (o) => L(o).join('|') === 'Promedio: 33.00|Días de más de 30 grados: 3' },
      ],
    },
    {
      id: 'java-dowhile',
      kind: 'java',
      title: 'do-while: validar datos',
      intro: (
        <>
          <p>
            <code>do … while</code> es como <code>while</code>, pero la condición se revisa <b>al final</b>: el bloque se ejecuta al menos
            una vez. Es ideal para pedir un dato hasta que sea válido:
          </p>
          <pre>
            <code>{'int edad;\ndo {\n    edad = sc.nextInt();\n} while (edad < 0);   // si es negativa, vuelve a pedir'}</code>
          </pre>
        </>
      ),
      task: (
        <>
          <p>
            En la feria de ciencias hay que elegir una mesa del 1 al 10. Leé números hasta que llegue uno válido. Por cada número
            inválido mostrá <code>Número inválido</code>; cuando llegue uno válido mostrá <code>Mesa elegida: X</code>.
          </p>
          <pre>
            <code>{'Entrada: 15 0 4\nSalida:\nNúmero inválido\nNúmero inválido\nMesa elegida: 4'}</code>
          </pre>
        </>
      ),
      hint: <p>Dentro del do: leé el número y, si está fuera de rango, mostrá el mensaje. La condición del while es «está fuera de rango».</p>,
      sampleInput: '15 0 4',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int mesa = sc.nextInt();
        System.out.println("Mesa elegida: " + mesa);
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int mesa;
        do {
            mesa = sc.nextInt();
            if (mesa < 1 || mesa > 10) {
                System.out.println("Número inválido");
            }
        } while (mesa < 1 || mesa > 10);
        System.out.println("Mesa elegida: " + mesa);
    }
}
`),
      tests: [
        { text: 'Con 15 0 4: dos inválidos y "Mesa elegida: 4"', input: '15 0 4', check: (o) => lines(o).join('|') === 'Número inválido|Número inválido|Mesa elegida: 4' },
        { text: 'Con 7: directamente "Mesa elegida: 7"', input: '7', check: (o) => lines(o).join('|') === 'Mesa elegida: 7' },
        { text: 'Con -3 11 10: dos inválidos y "Mesa elegida: 10"', input: '-3 11 10', check: (o) => lines(o).join('|') === 'Número inválido|Número inválido|Mesa elegida: 10' },
        { text: 'Usa do-while', check: (_o, c) => usa(c, /\bdo\s*\{/) },
      ],
    },
    {
      id: 'java-break',
      kind: 'java',
      title: 'break y continue',
      intro: (
        <>
          <p>Dentro de un bucle:</p>
          <ul>
            <li>
              <code>break</code> corta el bucle y sigue con lo que está después.
            </li>
            <li>
              <code>continue</code> saltea lo que queda de esta vuelta y pasa a la siguiente.
            </li>
          </ul>
          <pre>
            <code>{'while (true) {          // «para siempre»… hasta un break\n    int x = sc.nextInt();\n    if (x == 0) break;     // fin de los datos\n    if (x < 0) continue;   // este no lo uso\n    System.out.println(x);\n}'}</code>
          </pre>
        </>
      ),
      task: (
        <>
          <p>
            Se leen los importes de las ventas de la rifa. Un <code>0</code> indica el final (lo que venga después no se lee). Los
            números <b>negativos</b> son errores de carga y se ignoran. Mostrá la suma y cuántas ventas válidas hubo:
          </p>
          <pre>
            <code>{'Entrada: 500 -20 300 0 999\nSalida:\nSuma: 800\nVentas válidas: 2'}</code>
          </pre>
        </>
      ),
      hint: <p>while (true) con break cuando llega el 0 y continue cuando es negativo.</p>,
      sampleInput: '500 -20 300 0 999',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int suma = 0;
        int ventas = 0;
        // leé hasta el 0

        System.out.println("Suma: " + suma);
        System.out.println("Ventas válidas: " + ventas);
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int suma = 0;
        int ventas = 0;
        while (true) {
            int x = sc.nextInt();
            if (x == 0) break;
            if (x < 0) continue;
            suma += x;
            ventas++;
        }
        System.out.println("Suma: " + suma);
        System.out.println("Ventas válidas: " + ventas);
    }
}
`),
      tests: [
        { text: 'Con 500 -20 300 0 999: suma 800 y 2 ventas (el 999 no cuenta)', input: '500 -20 300 0 999', check: (o) => lines(o).join('|') === 'Suma: 800|Ventas válidas: 2' },
        { text: 'Con -5 -6 100 0: suma 100 y 1 venta', input: '-5 -6 100 0', check: (o) => lines(o).join('|') === 'Suma: 100|Ventas válidas: 1' },
        { text: 'Con 0: suma 0 y 0 ventas', input: '0', check: (o) => lines(o).join('|') === 'Suma: 0|Ventas válidas: 0' },
        { text: 'Usa break y continue', check: (_o, c) => usa(c, /\bbreak\s*;/) && usa(c, /\bcontinue\s*;/) },
      ],
    },
    {
      id: 'java-anidados',
      kind: 'java',
      title: 'Bucles anidados',
      intro: (
        <>
          <p>
            Un bucle puede ir <b>adentro</b> de otro. Por cada vuelta del de afuera, el de adentro da todas sus vueltas. Sirve para
            filas y columnas:
          </p>
          <pre>
            <code>{'for (int fila = 1; fila <= 2; fila++) {\n    for (int col = 1; col <= 3; col++) {\n        System.out.print("* ");\n    }\n    System.out.println();   // fin de la fila\n}\n// * * *\n// * * *'}</code>
          </pre>
        </>
      ),
      task: (
        <>
          <p>
            Leé <code>n</code> y dibujá una escalera de <code>#</code>: la fila 1 tiene un <code>#</code>, la fila 2 tiene dos, y así hasta
            n (sin espacios entre los #).
          </p>
          <pre>
            <code>{'Entrada: 4\nSalida:\n#\n##\n###\n####'}</code>
          </pre>
        </>
      ),
      hint: <p>El for de adentro va de 1 hasta el número de fila actual.</p>,
      sampleInput: '4',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        for (int i = 1; i <= n; i++) {
            System.out.print("#");
        }
        System.out.println();
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        for (int fila = 1; fila <= n; fila++) {
            for (int j = 1; j <= fila; j++) {
                System.out.print("#");
            }
            System.out.println();
        }
    }
}
`),
      tests: [
        { text: 'Con 4: #, ##, ###, ####', input: '4', check: (o) => lines(o).join('|') === '#|##|###|####' },
        { text: 'Con 1: una sola línea con #', input: '1', check: (o) => lines(o).join('|') === '#' },
        { text: 'Con 6: 6 filas, la última con 6 #', input: '6', check: (o) => lines(o).length === 6 && lines(o)[5] === '######' && lines(o)[2] === '###' },
        { text: 'Usa dos bucles for (uno dentro del otro)', check: (_o, c) => count(/\bfor\s*\(/, codeOnly(c)) >= 2 },
      ],
    },
    {
      id: 'java-proy-adivinar',
      kind: 'java',
      title: 'Mini-proyecto: adiviná el número',
      intro: (
        <>
          <p>
            <b>Mini-proyecto.</b> El clásico juego: alguien piensa un número y el otro lo tiene que adivinar con pistas «más alto» o «más
            bajo». Como acá la entrada está escrita de antemano, el <b>primer</b> número es el secreto (lo pone un compañero) y los
            siguientes son los intentos.
          </p>
        </>
      ),
      task: (
        <>
          <p>
            Leé el número secreto y después intentos hasta acertar. Para cada intento mostrá <code>Más alto</code> (si el secreto es
            mayor) o <code>Más bajo</code> (si es menor). Cuando acierta, mostrá <code>¡Correcto!</code> y en otra línea{' '}
            <code>Intentos: N</code> (contando el que acertó). No leas más después de acertar.
          </p>
          <pre>
            <code>{'Entrada: 37 50 20 37\nSalida:\nMás bajo\nMás alto\n¡Correcto!\nIntentos: 3'}</code>
          </pre>
        </>
      ),
      hint: <p>Un bucle que lee un intento por vuelta, un contador de intentos y un break (o una condición) cuando acierta.</p>,
      sampleInput: '37 50 20 37',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int secreto = sc.nextInt();
        int intento = sc.nextInt();
        if (intento == secreto) {
            System.out.println("¡Correcto!");
        }
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int secreto = sc.nextInt();
        int intentos = 0;
        while (true) {
            int intento = sc.nextInt();
            intentos++;
            if (intento < secreto) {
                System.out.println("Más alto");
            } else if (intento > secreto) {
                System.out.println("Más bajo");
            } else {
                System.out.println("¡Correcto!");
                break;
            }
        }
        System.out.println("Intentos: " + intentos);
    }
}
`),
      tests: [
        { text: 'Con 37 50 20 37: Más bajo, Más alto, ¡Correcto!, Intentos: 3', input: '37 50 20 37', check: (o) => lines(o).join('|') === 'Más bajo|Más alto|¡Correcto!|Intentos: 3' },
        { text: 'Con 8 8: ¡Correcto! en 1 intento', input: '8 8', check: (o) => lines(o).join('|') === '¡Correcto!|Intentos: 1' },
        { text: 'Con 50 10 90 60 40 50: cuatro pistas y 5 intentos', input: '50 10 90 60 40 50', check: (o) => lines(o).join('|') === 'Más alto|Más bajo|Más bajo|Más alto|¡Correcto!|Intentos: 5' },
        { text: 'Con 5 5 9 9: no sigue después de acertar', input: '5 5 9 9', check: (o) => lines(o).join('|') === '¡Correcto!|Intentos: 1' },
      ],
    },
  ],
}

/* ================================================================== 7. Métodos */

const METODOS: CourseModule = {
  id: 'java-metodos',
  title: 'Métodos',
  desc: 'Dividir el programa en partes: parámetros, return, sobrecarga y alcance.',
  lessons: [
    {
      id: 'java-metodo',
      kind: 'java',
      title: 'Definir y llamar un método',
      intro: (
        <>
          <p>
            Un <b>método</b> es un bloque de código con nombre que podés usar (llamar) las veces que quieras. Así no repetís código.
            Por ahora los escribimos dentro de <code>Main</code>, con <code>static</code>:
          </p>
          <pre>
            <code>{'public class Main {\n    static void saludar() {          // definición\n        System.out.println("¡Hola!");\n    }\n\n    public static void main(String[] args) {\n        saludar();                     // llamada\n        saludar();\n    }\n}'}</code>
          </pre>
          <p>
            <code>void</code> quiere decir que el método no devuelve ningún valor: solo hace algo.
          </p>
        </>
      ),
      task: (
        <>
          <p>
            Creá un método <code>static void linea()</code> que muestre una línea de 20 signos <code>=</code>, y usalo para que el programa
            muestre exactamente:
          </p>
          <pre>
            <code>{'====================\nBoletín - 3er año\n====================\nTaller de Computación\n===================='}</code>
          </pre>
          <p>
            La línea de <code>=</code> tiene que estar escrita <b>una sola vez</b> en el código (dentro del método).
          </p>
        </>
      ),
      hint: <p>En el main: linea(); println del título; linea(); println del taller; linea();</p>,
      starter: J(`
public class Main {
    // definí el método linea() acá

    public static void main(String[] args) {
        System.out.println("====================");
        System.out.println("Boletín - 3er año");
        System.out.println("====================");
        System.out.println("Taller de Computación");
        System.out.println("====================");
    }
}
`),
      solution: J(`
public class Main {
    static void linea() {
        System.out.println("====================");
    }

    public static void main(String[] args) {
        linea();
        System.out.println("Boletín - 3er año");
        linea();
        System.out.println("Taller de Computación");
        linea();
    }
}
`),
      tests: [
        { text: 'La salida es exactamente la del ejemplo (5 líneas)', check: (o) => lines(o).join('|') === '====================|Boletín - 3er año|====================|Taller de Computación|====================' },
        { text: 'Define el método static void linea()', check: (_o, c) => usa(c, /static\s+void\s+linea\s*\(\s*\)/) },
        { text: 'Llama a linea() tres veces', check: (_o, c) => count(/\blinea\s*\(\s*\)\s*;/, codeOnly(c)) >= 3 },
        { text: 'Los signos = están escritos una sola vez', check: (_o, c) => strs(c).filter((s) => s.includes('==')).length === 1 },
      ],
    },
    {
      id: 'java-return',
      kind: 'java',
      title: 'Parámetros y return',
      intro: (
        <>
          <p>
            Un método puede recibir datos (<b>parámetros</b>) y devolver un resultado con <code>return</code>. En vez de <code>void</code>{' '}
            se pone el tipo de lo que devuelve:
          </p>
          <pre>
            <code>{'static double promedio(double a, double b) {\n    return (a + b) / 2;\n}\n...\ndouble p = promedio(7, 9);   // p vale 8.0'}</code>
          </pre>
        </>
      ),
      task: (
        <>
          <p>
            Completá el método <code>static double aFahrenheit(double c)</code> para que devuelva la temperatura en grados Fahrenheit
            (F = C × 9 / 5 + 32). El main ya lee los °C y muestra el resultado con 1 decimal:
          </p>
          <pre>
            <code>{'Entrada: 36.5\nSalida:  36.5 °C = 97.7 °F'}</code>
          </pre>
        </>
      ),
      hint: <p>return c * 9 / 5 + 32;</p>,
      sampleInput: '36.5',
      starter: J(`
import java.util.Scanner;

public class Main {
    static double aFahrenheit(double c) {
        return 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double c = sc.nextDouble();
        System.out.printf("%.1f °C = %.1f °F%n", c, aFahrenheit(c));
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    static double aFahrenheit(double c) {
        return c * 9 / 5 + 32;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double c = sc.nextDouble();
        System.out.printf("%.1f °C = %.1f °F%n", c, aFahrenheit(c));
    }
}
`),
      tests: [
        { text: 'Con 0: "0.0 °C = 32.0 °F"', input: '0', check: (o) => L(o)[0] === '0.0 °C = 32.0 °F' },
        { text: 'Con 36.5: "36.5 °C = 97.7 °F"', input: '36.5', check: (o) => L(o)[0] === '36.5 °C = 97.7 °F' },
        { text: 'Con -10: "-10.0 °C = 14.0 °F"', input: '-10', check: (o) => L(o)[0] === '-10.0 °C = 14.0 °F' },
        { text: 'El cálculo está en el método aFahrenheit, con return', check: (_o, c) => /static\s+double\s+aFahrenheit\s*\(\s*double\s+\w+\s*\)\s*\{[^}]*return[^;]*\d/.test(codeOnly(c)) },
      ],
    },
    {
      id: 'java-sobrecarga',
      kind: 'java',
      title: 'Sobrecarga de métodos',
      intro: (
        <>
          <p>
            Puede haber varios métodos con el <b>mismo nombre</b> si reciben parámetros distintos (en cantidad o tipo). Java elige cuál
            usar según cómo lo llames. Eso se llama <b>sobrecarga</b>:
          </p>
          <pre>
            <code>{'static int mayor(int a, int b) { return Math.max(a, b); }\nstatic int mayor(int a, int b, int c) { return Math.max(a, Math.max(b, c)); }\n...\nmayor(3, 8);      // usa el primero\nmayor(3, 8, 5);   // usa el segundo'}</code>
          </pre>
        </>
      ),
      task: (
        <>
          <p>
            Hay que calcular cuánta pintura lleva cada pared del taller. Escribí <b>dos</b> métodos llamados <code>area</code>:
          </p>
          <ul>
            <li>
              <code>area(double lado)</code> → área de un cuadrado (lado × lado)
            </li>
            <li>
              <code>area(double base, double altura)</code> → área de un rectángulo
            </li>
          </ul>
          <p>Se leen el lado, la base y la altura. Mostrá (2 decimales):</p>
          <pre>
            <code>{'Entrada: 3 4 5\nSalida:\nCuadrado: 9.00\nRectángulo: 20.00'}</code>
          </pre>
        </>
      ),
      hint: <p>El main llama area(lado) y area(base, altura).</p>,
      sampleInput: '3 4 5',
      starter: J(`
import java.util.Scanner;

public class Main {
    static double area(double lado) {
        return lado * lado;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double lado = sc.nextDouble();
        double base = sc.nextDouble();
        double altura = sc.nextDouble();
        System.out.printf("Cuadrado: %.2f%n", area(lado));
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    static double area(double lado) {
        return lado * lado;
    }

    static double area(double base, double altura) {
        return base * altura;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double lado = sc.nextDouble();
        double base = sc.nextDouble();
        double altura = sc.nextDouble();
        System.out.printf("Cuadrado: %.2f%n", area(lado));
        System.out.printf("Rectángulo: %.2f%n", area(base, altura));
    }
}
`),
      tests: [
        { text: 'Con 3 4 5: "Cuadrado: 9.00" y "Rectángulo: 20.00"', input: '3 4 5', check: (o) => L(o).join('|') === 'Cuadrado: 9.00|Rectángulo: 20.00' },
        { text: 'Con 2.5 1.5 2: "Cuadrado: 6.25" y "Rectángulo: 3.00"', input: '2.5 1.5 2', check: (o) => L(o).join('|') === 'Cuadrado: 6.25|Rectángulo: 3.00' },
        { text: 'Hay dos métodos llamados area (uno con 1 parámetro y otro con 2)', check: (_o, c) => usa(c, /static\s+\w+\s+area\s*\(\s*double\s+\w+\s*\)/) && usa(c, /static\s+\w+\s+area\s*\(\s*double\s+\w+\s*,\s*double\s+\w+\s*\)/) },
      ],
    },
    {
      id: 'java-alcance',
      kind: 'java',
      title: 'Alcance de las variables',
      intro: (
        <>
          <p>
            Una variable <b>solo existe dentro de las llaves</b> <code>{'{ }'}</code> donde se declaró (su <b>alcance</b>). Si la declarás
            adentro de un <code>for</code>, afuera no existe; y además se vuelve a crear en cada vuelta.
          </p>
          <pre>
            <code>{'for (int i = 0; i < 3; i++) {\n    int x = 5;\n}\nSystem.out.println(x);   // ERROR: cannot find symbol'}</code>
          </pre>
          <p>
            Lo mismo pasa con los métodos: las variables del <code>main</code> no se ven desde otro método (por eso se pasan como
            parámetros). Cuando el compilador dice <code>cannot find symbol</code> casi siempre es esto (o un nombre mal escrito).
          </p>
        </>
      ),
      task: (
        <>
          <p>
            Este programa cuenta cuántos alumnos aprobaron, pero <b>no compila</b>. Probalo, leé el error y arreglalo moviendo la
            declaración al lugar correcto. Primero se lee la cantidad de notas y después las notas:
          </p>
          <pre>
            <code>{'Entrada:\n4\n7 5 9 6\nSalida:\nAprobados: 3 de 4'}</code>
          </pre>
        </>
      ),
      hint: <p>El contador tiene que declararse (en 0) antes del for, para que exista después y no se reinicie en cada vuelta.</p>,
      sampleInput: '4\n7 5 9 6',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        for (int i = 0; i < n; i++) {
            int aprobados = 0;
            double nota = sc.nextDouble();
            if (nota >= 6) {
                aprobados++;
            }
        }
        System.out.println("Aprobados: " + aprobados + " de " + n);
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int aprobados = 0;
        for (int i = 0; i < n; i++) {
            double nota = sc.nextDouble();
            if (nota >= 6) {
                aprobados++;
            }
        }
        System.out.println("Aprobados: " + aprobados + " de " + n);
    }
}
`),
      tests: [
        { text: 'Con 7 5 9 6: "Aprobados: 3 de 4"', input: '4\n7 5 9 6', check: (o) => lines(o).join('|') === 'Aprobados: 3 de 4' },
        { text: 'Con 2 3 4: "Aprobados: 0 de 3"', input: '3\n2 3 4', check: (o) => lines(o).join('|') === 'Aprobados: 0 de 3' },
        { text: 'Con 10 6 8 6.5 9: "Aprobados: 5 de 5"', input: '5\n10 6 8 6.5 9', check: (o) => lines(o).join('|') === 'Aprobados: 5 de 5' },
      ],
    },
    {
      id: 'java-proy-calculadora',
      kind: 'java',
      title: 'Mini-proyecto: calculadora con métodos',
      intro: (
        <>
          <p>
            <b>Mini-proyecto.</b> Una calculadora que lee una cuenta como <code>7 / 2</code> y la resuelve. El cálculo va en un método
            aparte, y el main se ocupa de leer, validar y mostrar.
          </p>
          <pre>
            <code>{"char op = sc.next().charAt(0);   // lee un símbolo: '+', '-', '*', '/'"}</code>
          </pre>
        </>
      ),
      task: (
        <>
          <p>
            Escribí <code>static double calcular(double a, char op, double b)</code> que resuelva <code>+ - * /</code>. En el main:
          </p>
          <ul>
            <li>
              si la operación no es ninguna de esas cuatro → <code>Operación inválida</code>
            </li>
            <li>
              si es una división por cero → <code>No se puede dividir por cero</code>
            </li>
            <li>
              si no → <code>Resultado: X</code> con 2 decimales
            </li>
          </ul>
          <pre>
            <code>{'Entrada: 7 / 2   Salida: Resultado: 3.50\nEntrada: 5 / 0   Salida: No se puede dividir por cero\nEntrada: 3 % 4   Salida: Operación inválida'}</code>
          </pre>
        </>
      ),
      hint: <p>Dentro de calcular usá un switch sobre op. En el main, primero revisá si op es válida y si es división por cero.</p>,
      sampleInput: '7 / 2',
      starter: J(`
import java.util.Scanner;

public class Main {
    // escribí el método calcular acá

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double a = sc.nextDouble();
        char op = sc.next().charAt(0);
        double b = sc.nextDouble();
        System.out.printf("Resultado: %.2f%n", a + b);
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    static double calcular(double a, char op, double b) {
        switch (op) {
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            default: return a / b;
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double a = sc.nextDouble();
        char op = sc.next().charAt(0);
        double b = sc.nextDouble();
        if (op != '+' && op != '-' && op != '*' && op != '/') {
            System.out.println("Operación inválida");
        } else if (op == '/' && b == 0) {
            System.out.println("No se puede dividir por cero");
        } else {
            System.out.printf("Resultado: %.2f%n", calcular(a, op, b));
        }
    }
}
`),
      tests: [
        { text: 'Con 8 + 2: "Resultado: 10.00"', input: '8 + 2', check: (o) => L(o).join('|') === 'Resultado: 10.00' },
        { text: 'Con 7 / 2: "Resultado: 3.50"', input: '7 / 2', check: (o) => L(o).join('|') === 'Resultado: 3.50' },
        { text: 'Con 3 * 4.5: "Resultado: 13.50"', input: '3 * 4.5', check: (o) => L(o).join('|') === 'Resultado: 13.50' },
        { text: 'Con 5 / 0: "No se puede dividir por cero"', input: '5 / 0', check: (o) => lines(o).join('|') === 'No se puede dividir por cero' },
        { text: 'Con 3 % 4: "Operación inválida"', input: '3 % 4', check: (o) => lines(o).join('|') === 'Operación inválida' },
      ],
    },
  ],
}

/* ================================================================== 8. Arreglos */

const ARREGLOS: CourseModule = {
  id: 'java-arreglos',
  title: 'Arreglos',
  desc: 'Guardar muchos datos juntos: recorrer, máximo, promedio, búsqueda y matrices.',
  lessons: [
    {
      id: 'java-arreglo',
      kind: 'java',
      title: 'Declarar y recorrer un arreglo',
      intro: (
        <>
          <p>
            Un <b>arreglo</b> guarda varios valores del mismo tipo, numerados desde <b>0</b>. Se crea con un tamaño fijo y se recorre con
            un for:
          </p>
          <pre>
            <code>{'int[] notas = new int[3];       // 3 lugares: notas[0], notas[1], notas[2]\nnotas[0] = 8;\nint[] goles = {2, 0, 3};        // creado con valores\nfor (int i = 0; i < goles.length; i++) {\n    System.out.println(goles[i]);\n}'}</code>
          </pre>
          <p>
            <code>.length</code> es la cantidad de elementos. El último está en la posición <code>length - 1</code>.
          </p>
        </>
      ),
      task: (
        <>
          <p>
            Se lee la cantidad de notas y después las notas. El programa ya las guarda y las muestra. Agregá una segunda línea con las
            notas <b>al revés</b>:
          </p>
          <pre>
            <code>{'Entrada:\n3\n8 7 9\nSalida:\nNotas: 8 7 9\nAl revés: 9 7 8'}</code>
          </pre>
        </>
      ),
      hint: <p>Un for que empiece en notas.length - 1 y vaya bajando (i--) hasta 0.</p>,
      sampleInput: '3\n8 7 9',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] notas = new int[n];
        for (int i = 0; i < n; i++) {
            notas[i] = sc.nextInt();
        }
        System.out.print("Notas:");
        for (int i = 0; i < n; i++) {
            System.out.print(" " + notas[i]);
        }
        System.out.println();
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] notas = new int[n];
        for (int i = 0; i < n; i++) {
            notas[i] = sc.nextInt();
        }
        System.out.print("Notas:");
        for (int i = 0; i < n; i++) {
            System.out.print(" " + notas[i]);
        }
        System.out.println();
        System.out.print("Al revés:");
        for (int i = n - 1; i >= 0; i--) {
            System.out.print(" " + notas[i]);
        }
        System.out.println();
    }
}
`),
      tests: [
        { text: 'Con 8 7 9: "Notas: 8 7 9" y "Al revés: 9 7 8"', input: '3\n8 7 9', check: (o) => lines(o).join('|') === 'Notas: 8 7 9|Al revés: 9 7 8' },
        { text: 'Con 10 4 6 2 7: "Al revés: 7 2 6 4 10"', input: '5\n10 4 6 2 7', check: (o) => lines(o)[1] === 'Al revés: 7 2 6 4 10' },
        { text: 'Con una sola nota (5): "Al revés: 5"', input: '1\n5', check: (o) => lines(o)[1] === 'Al revés: 5' },
      ],
    },
    {
      id: 'java-maxmin',
      kind: 'java',
      title: 'Máximo, mínimo y promedio',
      intro: (
        <>
          <p>
            Para encontrar el máximo se arranca suponiendo que es el primero y se compara con todos los demás:
          </p>
          <pre>
            <code>{'double max = datos[0];\nfor (int i = 1; i < datos.length; i++) {\n    if (datos[i] > max) {\n        max = datos[i];\n    }\n}'}</code>
          </pre>
          <p>
            La ventaja del arreglo es que podés recorrer los datos <b>varias veces</b>: por ejemplo, primero calcular el promedio y
            después contar cuántos lo superan.
          </p>
        </>
      ),
      task: (
        <>
          <p>
            Se lee la cantidad de días y la temperatura de cada día. Mostrá la máxima y la mínima (1 decimal), el promedio (2
            decimales) y cuántos días estuvieron <b>por encima</b> del promedio:
          </p>
          <pre>
            <code>{'Entrada:\n4\n12 35.5 20 27.5\nSalida:\nMáxima: 35.5\nMínima: 12.0\nPromedio: 23.75\nDías sobre el promedio: 2'}</code>
          </pre>
        </>
      ),
      hint: <p>Guardá todo en un double[]. Un primer recorrido para max, min y suma; un segundo para contar los que superan el promedio.</p>,
      sampleInput: '4\n12 35.5 20 27.5',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        double[] t = new double[n];
        for (int i = 0; i < n; i++) {
            t[i] = sc.nextDouble();
        }
        // tu código
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        double[] t = new double[n];
        for (int i = 0; i < n; i++) {
            t[i] = sc.nextDouble();
        }
        double max = t[0];
        double min = t[0];
        double suma = 0;
        for (int i = 0; i < n; i++) {
            if (t[i] > max) max = t[i];
            if (t[i] < min) min = t[i];
            suma += t[i];
        }
        double prom = suma / n;
        int sobre = 0;
        for (int i = 0; i < n; i++) {
            if (t[i] > prom) sobre++;
        }
        System.out.printf("Máxima: %.1f%n", max);
        System.out.printf("Mínima: %.1f%n", min);
        System.out.printf("Promedio: %.2f%n", prom);
        System.out.println("Días sobre el promedio: " + sobre);
    }
}
`),
      tests: [
        { text: 'Con 12 35.5 20 27.5: 35.5, 12.0, 23.75 y 2 días', input: '4\n12 35.5 20 27.5', check: (o) => L(o).join('|') === 'Máxima: 35.5|Mínima: 12.0|Promedio: 23.75|Días sobre el promedio: 2' },
        { text: 'Con -2 5.5 8 3 0.5: 8.0, -2.0, 3.00 y 2 días', input: '5\n-2 5.5 8 3 0.5', check: (o) => L(o).join('|') === 'Máxima: 8.0|Mínima: -2.0|Promedio: 3.00|Días sobre el promedio: 2' },
        { text: 'Con 30 30 30: todo 30 y 0 días', input: '3\n30 30 30', check: (o) => L(o).join('|') === 'Máxima: 30.0|Mínima: 30.0|Promedio: 30.00|Días sobre el promedio: 0' },
      ],
    },
    {
      id: 'java-busqueda',
      kind: 'java',
      title: 'Buscar en un arreglo',
      intro: (
        <>
          <p>
            Para buscar un valor se recorre el arreglo hasta encontrarlo. Un truco común es usar una variable que empieza en{' '}
            <code>-1</code> («no lo encontré») y se cambia cuando aparece:
          </p>
          <pre>
            <code>{'int pos = -1;\nfor (int i = 0; i < datos.length; i++) {\n    if (datos[i] == buscado) {\n        pos = i;\n        break;          // me quedo con el primero\n    }\n}'}</code>
          </pre>
        </>
      ),
      task: (
        <>
          <p>
            El club tiene una lista de números de socio. Se lee la cantidad, los números y al final el número a buscar. Mostrá{' '}
            <code>Encontrado en la posición X</code> (la posición del arreglo, empezando en 0; si se repite, la primera) o{' '}
            <code>No encontrado</code>.
          </p>
          <pre>
            <code>{'Entrada:\n5\n10 20 30 20 50\n20\nSalida:\nEncontrado en la posición 1'}</code>
          </pre>
        </>
      ),
      hint: <p>Guardá los socios en un int[], leé el buscado y recorré con un for.</p>,
      sampleInput: '5\n10 20 30 20 50\n20',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] socios = new int[n];
        for (int i = 0; i < n; i++) {
            socios[i] = sc.nextInt();
        }
        int buscado = sc.nextInt();
        // buscá
        System.out.println("No encontrado");
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] socios = new int[n];
        for (int i = 0; i < n; i++) {
            socios[i] = sc.nextInt();
        }
        int buscado = sc.nextInt();
        int pos = -1;
        for (int i = 0; i < n; i++) {
            if (socios[i] == buscado) {
                pos = i;
                break;
            }
        }
        if (pos == -1) {
            System.out.println("No encontrado");
        } else {
            System.out.println("Encontrado en la posición " + pos);
        }
    }
}
`),
      tests: [
        { text: 'Busca 20 en 10 20 30 20 50: posición 1 (la primera)', input: '5\n10 20 30 20 50\n20', check: (o) => lines(o).join('|') === 'Encontrado en la posición 1' },
        { text: 'Busca 50: posición 4 (el último)', input: '5\n10 20 30 20 50\n50', check: (o) => lines(o).join('|') === 'Encontrado en la posición 4' },
        { text: 'Busca 7 en una lista de un solo 7: posición 0', input: '1\n7\n7', check: (o) => lines(o).join('|') === 'Encontrado en la posición 0' },
        { text: 'Busca 9 en 1 2 3: "No encontrado"', input: '3\n1 2 3\n9', check: (o) => lines(o).join('|') === 'No encontrado' },
      ],
    },
    {
      id: 'java-matriz',
      kind: 'java',
      title: 'Matrices',
      intro: (
        <>
          <p>
            Una <b>matriz</b> es un arreglo de dos dimensiones: filas y columnas, como una planilla. Se recorre con dos for anidados:
          </p>
          <pre>
            <code>{'int[][] m = new int[2][3];        // 2 filas, 3 columnas\nm[0][2] = 5;                      // fila 0, columna 2\nfor (int f = 0; f < m.length; f++) {\n    for (int c = 0; c < m[f].length; c++) {\n        System.out.print(m[f][c] + " ");\n    }\n    System.out.println();\n}'}</code>
          </pre>
        </>
      ),
      task: (
        <>
          <p>
            Planilla de notas: se lee la cantidad de alumnos y, para cada uno, sus notas de los <b>3 trimestres</b>. Guardalas en una
            matriz <code>int[][]</code> y mostrá el promedio de cada alumno y el promedio general (todo con 2 decimales):
          </p>
          <pre>
            <code>{'Entrada:\n2\n7 8 9\n4 5 6\nSalida:\nAlumno 1: 8.00\nAlumno 2: 5.00\nPromedio general: 6.50'}</code>
          </pre>
        </>
      ),
      hint: <p>new int[n][3]. Para cada fila sumá sus 3 columnas; el promedio general es la suma de todo dividido n * 3.</p>,
      sampleInput: '2\n7 8 9\n4 5 6',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        // creá la matriz y cargá las notas

    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[][] notas = new int[n][3];
        for (int f = 0; f < n; f++) {
            for (int c = 0; c < 3; c++) {
                notas[f][c] = sc.nextInt();
            }
        }
        double total = 0;
        for (int f = 0; f < n; f++) {
            int suma = 0;
            for (int c = 0; c < 3; c++) {
                suma += notas[f][c];
            }
            total += suma;
            System.out.printf("Alumno %d: %.2f%n", f + 1, suma / 3.0);
        }
        System.out.printf("Promedio general: %.2f%n", total / (n * 3));
    }
}
`),
      tests: [
        { text: 'Con 7 8 9 / 4 5 6: 8.00, 5.00 y general 6.50', input: '2\n7 8 9\n4 5 6', check: (o) => L(o).join('|') === 'Alumno 1: 8.00|Alumno 2: 5.00|Promedio general: 6.50' },
        { text: 'Con 3 alumnos: 10.00, 7.00, 2.00 y general 6.33', input: '3\n10 10 10\n6 7 8\n1 2 3', check: (o) => L(o).join('|') === 'Alumno 1: 10.00|Alumno 2: 7.00|Alumno 3: 2.00|Promedio general: 6.33' },
        { text: 'Usa una matriz int[][]', check: (_o, c) => usa(c, /int\s*\[\s*\]\s*\[\s*\]/) && usa(c, /new\s+int\s*\[[^\]]+\]\s*\[[^\]]+\]/) },
      ],
    },
    {
      id: 'java-proy-boletin',
      kind: 'java',
      title: 'Mini-proyecto: boletín de notas',
      intro: (
        <>
          <p>
            <b>Mini-proyecto.</b> Un boletín para todo el curso: se cargan los alumnos con sus notas y el programa arma el resumen.
            Vas a usar dos arreglos «paralelos»: en la misma posición de cada uno está el mismo alumno.
          </p>
          <pre>
            <code>{'String[] nombres = new String[n];\ndouble[] promedios = new double[n];\n// nombres[2] y promedios[2] son del mismo alumno'}</code>
          </pre>
        </>
      ),
      task: (
        <>
          <p>
            Se lee la cantidad de alumnos y, para cada uno, una línea con el nombre (una palabra) y 3 notas. Mostrá una línea por alumno
            con su promedio (2 decimales) y si está <code>Aprobado</code> (6 o más) o <code>Desaprobado</code>; después el mejor promedio
            (si hay empate, el primero) y cuántos aprobaron:
          </p>
          <pre>
            <code>{'Entrada:\n3\nAna 7 8 8\nLuis 5 4 6\nSofi 9 9 9\nSalida:\nAna: 7.67 - Aprobado\nLuis: 5.00 - Desaprobado\nSofi: 9.00 - Aprobado\nMejor promedio: Sofi (9.00)\nAprobados: 2 de 3'}</code>
          </pre>
        </>
      ),
      hint: <p>Primero cargá los dos arreglos; después recorrelos para mostrar, buscar el mejor y contar aprobados.</p>,
      sampleInput: '3\nAna 7 8 8\nLuis 5 4 6\nSofi 9 9 9',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        String[] nombres = new String[n];
        double[] promedios = new double[n];
        // cargá los datos

    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        String[] nombres = new String[n];
        double[] promedios = new double[n];
        for (int i = 0; i < n; i++) {
            nombres[i] = sc.next();
            double a = sc.nextDouble();
            double b = sc.nextDouble();
            double c = sc.nextDouble();
            promedios[i] = (a + b + c) / 3;
        }
        int mejor = 0;
        int aprobados = 0;
        for (int i = 0; i < n; i++) {
            String estado = promedios[i] >= 6 ? "Aprobado" : "Desaprobado";
            System.out.printf("%s: %.2f - %s%n", nombres[i], promedios[i], estado);
            if (promedios[i] >= 6) aprobados++;
            if (promedios[i] > promedios[mejor]) mejor = i;
        }
        System.out.printf("Mejor promedio: %s (%.2f)%n", nombres[mejor], promedios[mejor]);
        System.out.println("Aprobados: " + aprobados + " de " + n);
    }
}
`),
      tests: [
        {
          text: 'Con Ana, Luis y Sofi: el boletín del ejemplo',
          input: '3\nAna 7 8 8\nLuis 5 4 6\nSofi 9 9 9',
          check: (o) => L(o).join('|') === 'Ana: 7.67 - Aprobado|Luis: 5.00 - Desaprobado|Sofi: 9.00 - Aprobado|Mejor promedio: Sofi (9.00)|Aprobados: 2 de 3',
        },
        {
          text: 'Con un empate (Tomi y Mica con 6.00): el mejor es Tomi, el primero',
          input: '2\nTomi 6 6 6\nMica 5.5 6 6.5',
          check: (o) => L(o).join('|') === 'Tomi: 6.00 - Aprobado|Mica: 6.00 - Aprobado|Mejor promedio: Tomi (6.00)|Aprobados: 2 de 2',
        },
        {
          text: 'Con un solo alumno desaprobado: "Aprobados: 0 de 1"',
          input: '1\nJuli 2 3 4',
          check: (o) => L(o).join('|') === 'Juli: 3.00 - Desaprobado|Mejor promedio: Juli (3.00)|Aprobados: 0 de 1',
        },
        { text: 'Usa arreglos String[] y double[]', check: (_o, c) => usa(c, /String\s*\[\s*\]/) && usa(c, /double\s*\[\s*\]/) },
      ],
    },
  ],
}

/* ================================================================== 9. Strings */

const STRINGS: CourseModule = {
  id: 'java-strings',
  title: 'Textos (String)',
  desc: 'Recorrer letras, cortar textos, comparar bien y separar con split.',
  lessons: [
    {
      id: 'java-charat',
      kind: 'java',
      title: 'length y charAt',
      intro: (
        <>
          <p>
            Un <code>String</code> es una secuencia de caracteres numerados desde 0, como un arreglo:
          </p>
          <pre>
            <code>{'String s = "Villada";\ns.length()          // 7\ns.charAt(0)         // \'V\'\ns.charAt(s.length() - 1)   // \'a\' (la última)\ns.toLowerCase()     // "villada"\nfor (int i = 0; i < s.length(); i++) {\n    char c = s.charAt(i);\n}'}</code>
          </pre>
          <p>
            Los <code>char</code> se comparan con <code>==</code> y comillas simples: <code>{"c == 'a'"}</code>.
          </p>
        </>
      ),
      task: (
        <>
          <p>
            Leé una línea de texto y mostrá su largo (contando espacios), la primera letra, la última y cuántas vocales tiene (a, e,
            i, o, u, en mayúscula o minúscula):
          </p>
          <pre>
            <code>{'Entrada: Hola Mundo\nSalida:\nLargo: 10\nPrimera: H\nÚltima: o\nVocales: 4'}</code>
          </pre>
        </>
      ),
      hint: <p>Recorré con un for y charAt(i). Pasar el texto a minúsculas antes simplifica la comparación.</p>,
      sampleInput: 'Hola Mundo',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine();
        System.out.println("Largo: " + s.length());
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine();
        System.out.println("Largo: " + s.length());
        System.out.println("Primera: " + s.charAt(0));
        System.out.println("Última: " + s.charAt(s.length() - 1));
        String m = s.toLowerCase();
        int vocales = 0;
        for (int i = 0; i < m.length(); i++) {
            char c = m.charAt(i);
            if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') {
                vocales++;
            }
        }
        System.out.println("Vocales: " + vocales);
    }
}
`),
      tests: [
        { text: 'Con "Hola Mundo": 10, H, o y 4 vocales', input: 'Hola Mundo', check: (o) => lines(o).join('|') === 'Largo: 10|Primera: H|Última: o|Vocales: 4' },
        { text: 'Con "Villada": 7, V, a y 3 vocales', input: 'Villada', check: (o) => lines(o).join('|') === 'Largo: 7|Primera: V|Última: a|Vocales: 3' },
        { text: 'Con "ITS": cuenta la I mayúscula como vocal', input: 'ITS', check: (o) => lines(o).join('|') === 'Largo: 3|Primera: I|Última: S|Vocales: 1' },
        { text: 'Usa charAt', check: (_o, c) => usa(c, /\.charAt\s*\(/) },
      ],
    },
    {
      id: 'java-substring',
      kind: 'java',
      title: 'indexOf y substring',
      intro: (
        <>
          <p>Para buscar y cortar partes de un texto:</p>
          <pre>
            <code>{'String s = "taller-3B";\ns.indexOf("-")        // 6  (posición del guion; -1 si no está)\ns.substring(0, 6)     // "taller"  (desde 0 hasta ANTES de 6)\ns.substring(7)        // "3B"      (desde 7 hasta el final)\ns.contains("3B")      // true'}</code>
          </pre>
        </>
      ),
      task: (
        <>
          <p>
            Leé un mail y separá el usuario (lo que está antes de la <code>@</code>) del dominio (lo que está después). Si no tiene{' '}
            <code>@</code>, mostrá <code>Mail inválido</code>.
          </p>
          <pre>
            <code>{'Entrada: ana.perez@itsv.edu.ar\nSalida:\nUsuario: ana.perez\nDominio: itsv.edu.ar'}</code>
          </pre>
        </>
      ),
      hint: <p>int arroba = mail.indexOf("@"); si es -1 es inválido; si no, substring(0, arroba) y substring(arroba + 1).</p>,
      sampleInput: 'ana.perez@itsv.edu.ar',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String mail = sc.nextLine();
        System.out.println("Usuario: " + mail);
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String mail = sc.nextLine();
        int arroba = mail.indexOf("@");
        if (arroba == -1) {
            System.out.println("Mail inválido");
        } else {
            System.out.println("Usuario: " + mail.substring(0, arroba));
            System.out.println("Dominio: " + mail.substring(arroba + 1));
        }
    }
}
`),
      tests: [
        { text: 'Con ana.perez@itsv.edu.ar: usuario ana.perez y dominio itsv.edu.ar', input: 'ana.perez@itsv.edu.ar', check: (o) => lines(o).join('|') === 'Usuario: ana.perez|Dominio: itsv.edu.ar' },
        { text: 'Con juan@gmail.com: usuario juan y dominio gmail.com', input: 'juan@gmail.com', check: (o) => lines(o).join('|') === 'Usuario: juan|Dominio: gmail.com' },
        { text: 'Con sinarroba.com: "Mail inválido"', input: 'sinarroba.com', check: (o) => lines(o).join('|') === 'Mail inválido' },
        { text: 'Usa indexOf y substring', check: (_o, c) => usa(c, /\.indexOf\s*\(/) && usa(c, /\.substring\s*\(/) },
      ],
    },
    {
      id: 'java-equals',
      kind: 'java',
      title: 'Comparar textos: equals',
      intro: (
        <>
          <p>
            Los textos <b>no</b> se comparan con <code>==</code> (eso compara si son el mismo objeto en memoria, no si dicen lo mismo).
            Se usa <code>equals</code>:
          </p>
          <pre>
            <code>{'if (clave.equals("1234")) { ... }              // exacto (distingue mayúsculas)\nif (curso.equalsIgnoreCase("3b")) { ... }      // "3B", "3b" → iguales\nString grito = nombre.toUpperCase();           // "ANA"'}</code>
          </pre>
        </>
      ),
      task: (
        <>
          <p>
            Pantalla de ingreso a la compu del laboratorio. Se leen el usuario y la contraseña (una palabra cada uno). El usuario
            correcto es <code>admin</code> (sin importar mayúsculas) y la contraseña es <code>Villada2024</code> (exacta). Si los dos están
            bien, mostrá <code>Bienvenido/a, ADMIN</code> (el usuario en mayúsculas); si no, <code>Usuario o contraseña incorrectos</code>.
          </p>
          <p>El código actual usa <code>==</code> y no anda nunca: arreglalo.</p>
        </>
      ),
      hint: <p>usuario.equalsIgnoreCase("admin") && clave.equals("Villada2024")</p>,
      sampleInput: 'admin Villada2024',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String usuario = sc.next();
        String clave = sc.next();
        if (usuario == "admin" && clave == "Villada2024") {
            System.out.println("Bienvenido/a, " + usuario);
        } else {
            System.out.println("Usuario o contraseña incorrectos");
        }
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String usuario = sc.next();
        String clave = sc.next();
        if (usuario.equalsIgnoreCase("admin") && clave.equals("Villada2024")) {
            System.out.println("Bienvenido/a, " + usuario.toUpperCase());
        } else {
            System.out.println("Usuario o contraseña incorrectos");
        }
    }
}
`),
      tests: [
        { text: 'Con admin Villada2024: "Bienvenido/a, ADMIN"', input: 'admin Villada2024', check: (o) => lines(o).join('|') === 'Bienvenido/a, ADMIN' },
        { text: 'Con Admin Villada2024: también entra', input: 'Admin Villada2024', check: (o) => lines(o).join('|') === 'Bienvenido/a, ADMIN' },
        { text: 'Con admin villada2024: la contraseña distingue mayúsculas', input: 'admin villada2024', check: (o) => lines(o).join('|') === 'Usuario o contraseña incorrectos' },
        { text: 'Con pepe Villada2024: usuario incorrecto', input: 'pepe Villada2024', check: (o) => lines(o).join('|') === 'Usuario o contraseña incorrectos' },
        { text: 'No compara textos con ==', check: (_o, c) => !/==\s*""|""\s*==/.test(codeOnly(c)) },
      ],
    },
    {
      id: 'java-split',
      kind: 'java',
      title: 'Separar con split',
      intro: (
        <>
          <p>
            <code>split</code> corta un texto en partes usando un separador y devuelve un <b>arreglo</b> de String. <code>trim()</code> saca
            los espacios de los costados:
          </p>
          <pre>
            <code>{'String[] partes = "Ana;Luis;Sofi".split(";");\n// partes[0] = "Ana", partes[1] = "Luis", partes[2] = "Sofi"\n"  hola ".trim()   // "hola"'}</code>
          </pre>
        </>
      ),
      task: (
        <>
          <p>
            La cooperadora anota la lista de compras en una sola línea separada por comas. Mostrala numerada (sin espacios de más) y el
            total de productos:
          </p>
          <pre>
            <code>{'Entrada: pan, leche ,yerba\nSalida:\n1. pan\n2. leche\n3. yerba\nTotal: 3 productos'}</code>
          </pre>
        </>
      ),
      hint: <p>linea.split(","), y para cada parte: (i + 1) + ". " + partes[i].trim()</p>,
      sampleInput: 'pan, leche ,yerba',
      starter: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String linea = sc.nextLine();
        System.out.println("1. " + linea);
    }
}
`),
      solution: J(`
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String linea = sc.nextLine();
        String[] partes = linea.split(",");
        for (int i = 0; i < partes.length; i++) {
            System.out.println((i + 1) + ". " + partes[i].trim());
        }
        System.out.println("Total: " + partes.length + " productos");
    }
}
`),
      tests: [
        { text: 'Con "pan, leche ,yerba": lista de 3 y "Total: 3 productos"', input: 'pan, leche ,yerba', check: (o) => lines(o).join('|') === '1. pan|2. leche|3. yerba|Total: 3 productos' },
        { text: 'Con 5 productos: "5. servilletas" y "Total: 5 productos"', input: 'azucar,cafe,  te,galletitas , servilletas', check: (o) => lines(o).join('|') === '1. azucar|2. cafe|3. te|4. galletitas|5. servilletas|Total: 5 productos' },
        { text: 'Usa split', check: (_o, c) => usa(c, /\.split\s*\(/) },
      ],
    },
  ],
}
