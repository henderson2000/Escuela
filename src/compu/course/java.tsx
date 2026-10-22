import { codeOnly, lines, norm, type Track } from '../types'

export const JAVA_TRACK: Track = {
  id: 'java',
  title: 'Java',
  icon: '☕',
  desc: 'Programación: variables, decisiones, repeticiones, métodos, arreglos y objetos. El código se ejecuta de verdad en el navegador.',
  modules: [
    {
      id: 'java-primeros',
      title: 'Primeros pasos',
      desc: 'Escribir en pantalla y entender la estructura de un programa.',
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
      ],
    },
  ],
}
