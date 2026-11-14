from pathlib import Path
p=Path('.')
f=p/'main.tex'; s=f.read_text(encoding='utf-8'); s=s.replace('\\textbf{Documentos:} README;', '\\scriptsize\\textbf{Documentos:} README;'); f.write_text(s,encoding='utf-8')
f=p/'README.md'; s=f.read_text(encoding='utf-8'); s+='''

## Recursos finales
- main.tex / main.pdf: 15 diapositivas, incluyendo portada y anexos.
- comparaciones.tex / comparaciones.pdf: dos láminas exportables.
- HU01_antes.png, HU01_despues.png, HU01_comparacion.png.
- HU02_antes.png, HU02_despues.png, HU02_comparacion.png.
- fragmentos/: 12 copias literales de código, exclusivamente para documentación.
- FUENTES_SHA256.txt: huellas de las fuentes consultadas.

Los scripts de preparación registran las adaptaciones realizadas: generar_documentacion.py, adaptar_latex.py, finalizar_recursos.py y normalizar_fragmentos.py. No es necesario ejecutarlos para compilar. No regenerar sobre las fuentes finales sin aplicar todas las adaptaciones: la generación inicial usa Beamer, ausente en este equipo; la versión final usa article y el entorno diapositiva. verificar_fragmentos.py permite comprobar las copias finales sin alterar el código fuente. Los logs y revision-hu01.png documentan la comprobación local.
'''; f.write_text(s,encoding='utf-8')
