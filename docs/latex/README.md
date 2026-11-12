# Informe académico LaTeX

El informe describe el incremento real y el diseño candidato por separado. `main.tex` incluye once capítulos, bitácora, bibliografía y fuentes Mermaid. Los fragmentos se leen de archivos reales de `server/`; no son código de ejemplo presentado como evidencia.

## Compilar desde el repositorio

Ejecutar desde `docs/latex/`, conservando el árbol del repositorio:

```powershell
xelatex -interaction=nonstopmode -halt-on-error main.tex
bibtex main
xelatex -interaction=nonstopmode -halt-on-error main.tex
xelatex -interaction=nonstopmode -halt-on-error main.tex
```

También puede usarse `latexmk -xelatex -interaction=nonstopmode -halt-on-error main.tex` cuando latexmk y sus dependencias estén disponibles. El documento ofrece una rama de compatibilidad para pdfLaTeX, pero XeLaTeX es la opción preferida. Deben estar disponibles babel español, fontspec para XeLaTeX, lmodern para pdfLaTeX, listings, TikZ, hyperref, longtable y booktabs. La instalación de paquetes y la compilación no se dan por hechas: consultar la evidencia final de la sesión.

Cuando XeLaTeX no disponga de su formato, puede intentarse la alternativa sin cambiar las fuentes:

```powershell
pdflatex -interaction=nonstopmode -halt-on-error main.tex
bibtex main
pdflatex -interaction=nonstopmode -halt-on-error main.tex
pdflatex -interaction=nonstopmode -halt-on-error main.tex
```

En este entorno XeLaTeX falló porque faltaba `xelatex.fmt` y su generación no logró completarse, con la unidad del perfil sin espacio disponible. Se añadió Latin Modern a la rama pdfLaTeX para evitar la generación de fuentes bitmap en esa unidad. El resultado final de la alternativa figura en la tabla de evidencia; la presencia de fuentes `.tex` por sí sola no demuestra la generación de PDF.

## Preparar Overleaf sin perder los fragmentos reales

Desde la raíz del repositorio:

```powershell
powershell -NoProfile -File .\docs\latex\preparar-overleaf.ps1
```

El script copia **archivos reales actuales** a `docs/latex/codigo/server/`, las fuentes Mermaid a `docs/latex/diagramas/`, las capturas reales a `imagenes/` y escribe un manifiesto SHA-256. No cambia la implementación. Después se sube el contenido de `docs/latex/` como raíz de un proyecto Overleaf, se selecciona `main.tex` y el compilador XeLaTeX y se recompila. No se suben `.env`, bases SQLite, `node_modules` ni carpetas de coordinación. Se pueden omitir archivos auxiliares de compilación.

Al preparar la copia autónoma, `main.tex` utiliza los archivos copiados cuando no encuentra el repositorio superior. Los listados Mermaid también tienen una ruta alternativa local. Ejecutar de nuevo el preparador después de cualquier cambio en los archivos fuente. Las copias son material generado; los originales del repositorio continúan siendo la fuente de verdad.

## Datos por confirmar y evidencia

- Portada: facultad, denominación oficial de escuela y apellidos de Franshesco y Daniela.
- Escudo: añadir una imagen institucional autorizada en `imagenes/escudo-unsaac.png`; mientras no exista se muestra un espacio indicado.
- Pruebas: actualizar `tablas/evidencia.tex` únicamente con resultados reales.
- Revisión humana, integración, ceremonias y validación cliente: pendientes hasta contar con registro.
- Las fuentes Mermaid de inscripción y asistencia describen diseño futuro, no funcionalidades ejecutadas.

Los diagramas de arquitectura y estados se dibujan con TikZ dentro del informe; las fuentes completas se incluyen como listados. El renderizado de los Mermaid no ha sido verificado con un motor Mermaid. Para sustituirlos o ampliar figuras se pueden exportar a SVG/PDF/PNG y añadirlos a `imagenes/`, conservando sus fuentes.
