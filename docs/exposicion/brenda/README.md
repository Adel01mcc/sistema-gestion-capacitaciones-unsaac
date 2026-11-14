# Exposición individual de Brenda

Abrir `main.tex` como archivo principal. Presentación en páginas horizontales (clase article; sin Beamer), autónoma respecto de docs/latex; conservar la subcarpeta fragmentos. No requiere shell-escape, bibliografía externa ni imágenes para compilar.

Desde esta carpeta:

```powershell
pdflatex --disable-installer -interaction=nonstopmode -halt-on-error main.tex
pdflatex --disable-installer -interaction=nonstopmode -halt-on-error main.tex
pdflatex --disable-installer -interaction=nonstopmode -halt-on-error comparaciones.tex
pdftoppm -png -r 160 comparaciones.pdf comparacion
```

Las páginas 1 y 2 de comparaciones.pdf corresponden a HU-01 y HU-02. Cada lámina contiene código ANTES y DESPUÉS con commit y archivo. Se pueden exportar como páginas completas; para imágenes separadas recortar cada bloque sin quitar la referencia. Son representaciones tipográficas de código auténtico, no capturas de una ejecución.

`GUION.md`: explicación sencilla por diapositiva. `COMMITS.txt` y `MANIFIESTO.json`: trazabilidad. `generar_documentacion.py`: preparación documental reproducible que lee Git y solo escribe dentro de esta carpeta. `VERIFICACION.md`: estado real de compilación y comprobaciones.

Decisión documental del 14/11/2026: se sigue la instrucción expresa de crear solo documentación nueva. No se modifican capítulos, bitácora ni decisiones técnicas existentes; la trazabilidad y decisiones de esta entrega quedan aquí. No se añaden dependencias de la aplicación. No se ejecutan check/build/test para evitar escrituras ajenas a este destino. Los resultados funcionales de Brenda se registran como declaración, separados del antecedente de V1.


## Recursos finales
- main.tex / main.pdf: 15 diapositivas, incluyendo portada y anexos.
- comparaciones.tex / comparaciones.pdf: dos láminas exportables.
- HU01_antes.png, HU01_despues.png, HU01_comparacion.png.
- HU02_antes.png, HU02_despues.png, HU02_comparacion.png.
- fragmentos/: 12 copias literales de código, exclusivamente para documentación.
- FUENTES_SHA256.txt: huellas de las fuentes consultadas.

Los scripts de preparación registran las adaptaciones realizadas: generar_documentacion.py, adaptar_latex.py, finalizar_recursos.py y normalizar_fragmentos.py. No es necesario ejecutarlos para compilar. No regenerar sobre las fuentes finales sin aplicar todas las adaptaciones: la generación inicial usa Beamer, ausente en este equipo; la versión final usa article y el entorno diapositiva. verificar_fragmentos.py permite comprobar las copias finales sin alterar el código fuente. Los logs y revision-hu01.png documentan la comprobación local.
