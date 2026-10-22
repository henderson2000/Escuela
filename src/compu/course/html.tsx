import type { Track } from '../types'

export const HTML_TRACK: Track = {
  id: 'html',
  title: 'HTML',
  icon: '🧱',
  desc: 'La estructura de las páginas web: títulos, textos, imágenes, links, listas, tablas y formularios.',
  modules: [
    {
      id: 'html-primeros',
      title: 'Primeros pasos',
      desc: 'Qué es HTML y cómo se escribe una etiqueta.',
      lessons: [
        {
          id: 'html-1',
          kind: 'web',
          title: 'Tu primer título',
          intro: (
            <>
              <p>
                <b>HTML</b> es el lenguaje con el que se arma la estructura de una página web. Se escribe con <b>etiquetas</b>: una
                que abre y otra que cierra, con el contenido en el medio.
              </p>
              <pre>
                <code>{'<h1>Esto es un título</h1>'}</code>
              </pre>
              <p>
                <code>h1</code> es el título más importante de la página. Hay seis niveles, de <code>h1</code> a <code>h6</code>.
              </p>
            </>
          ),
          task: (
            <p>
              Agregá un título <code>h1</code> que diga <b>ITS Villada</b>.
            </p>
          ),
          hint: (
            <p>
              Escribí <code>{'<h1>ITS Villada</h1>'}</code>. Fijate que la etiqueta que cierra lleva una barra <code>/</code>.
            </p>
          ),
          edit: ['html'],
          starter: { html: '<!-- Escribí tu código abajo -->\n', css: '' },
          solution: { html: '<h1>ITS Villada</h1>\n', css: '' },
          tests: [
            { text: 'Hay un elemento <h1>', test: (c) => !!c.$('h1') },
            { text: 'El <h1> dice "ITS Villada"', test: (c) => c.text('h1').toLowerCase() === 'its villada' },
            { text: 'La etiqueta <h1> está cerrada con </h1>', test: (c) => /<\/h1>/i.test(c.html) },
          ],
        },
      ],
    },
  ],
}
