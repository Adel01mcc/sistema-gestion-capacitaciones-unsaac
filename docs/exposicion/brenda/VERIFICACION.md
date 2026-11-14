# Verificación documental — 14 de noviembre de 2026 (America/Lima)

Alcance: únicamente archivos nuevos en docs/exposicion/brenda/. No se modificaron fuentes, configuración, bases, pruebas ni documentos existentes. No hubo staging, commit, push ni consulta remota a GitHub.

## Comprobaciones ejecutadas

- `git status --short`, `git branch --show-current`: rama feature/brenda-mayhuire. Cambios preexistentes en .env, dos archivos auxiliares SQLite y package-lock.json, además de archivos no rastreados, preservados. No se leyó el contenido de secretos ni la base.
- `git show`, `git rev-parse`, `git branch --contains`: secuencia eb00464 → 4cab7eb → 6ccf4ca; respaldo/brenda-v1 = eb004641b114d8c71f86af08b05f0f9e073baf73. Ambos commits de refactorización cambian src/Users.tsx.
- Lectura UTF-8 de README y documentos enumerados en FUENTES_SHA256.txt. Los criterios CA-01 y CA-02 se conservan como criterios documentados sujetos a validación de negocio; no se inventó aceptación del cliente.
- Comparación programática de HU01_comparacion.txt con `git diff eb00464 4cab7eb -- src/Users.tsx`, y HU02_comparacion.txt con `git diff 4cab7eb 6ccf4ca -- src/Users.tsx`: igualdad, normalizando fin de línea y salto terminal.
- `py verificar_fragmentos.py`: 12 fragmentos cotejados con git show, rangos y SHA-256 correctos. Las copias se normalizaron a LF para que sus hashes sean reproducibles; no se alteraron instrucciones ni espacios del código. MANIFIESTO.json permite comprobar cada rango.
- `py finalizar_recursos.py` durante la preparación: seis PNG renderizados mediante Pillow ya instalado y tipografías locales; no se generó código ficticio ni una captura de ejecución. Los saltos visuales de las líneas largas facilitan la lectura.
- `pdflatex --disable-installer -interaction=nonstopmode -halt-on-error main.tex`: compilación final exitosa, 15 páginas. Se repitió la pasada durante la revisión.
- Mismo comando para comparaciones.tex: compilación final exitosa, 2 páginas.
- `pdftoppm -f 6 -l 6 -scale-to 1500 -png -singlefile main.pdf revision-hu01`: renderizado exitoso. Se inspeccionó visualmente la comparación HU-01 renderizada. No se afirma inspección visual de todas las páginas.
- Lectura de main.log y comparaciones.log: revisar la salida final de compilación; la versión final resolvió el desbordamiento horizontal detectado en el anexo.
- `git diff --numstat -- src server tests`: salida vacía. El estado final solo añade docs/exposicion/ respecto del estado inicial; los cambios previos se preservan.

## Limitaciones y decisiones

El primer intento falló por falta de beamer.cls; al usar article se detectó también falta de booktabs.sty. Se reemplazaron ambas dependencias en las fuentes finales, sin instalación. Se corrigió un conflicto de nombre de entorno usando diapositiva. La clase final es article con geometría horizontal, no Beamer. Los archivos .tex finales se compilan directamente con sus fragmentos.

Los 28 resultados y la compilación de la aplicación son reportados por Brenda, sin log nuevo adjunto; docs/PRUEBAS.md registra además un antecedente de V1 del 12/11/2026. No se ejecutaron npm run check, build, test ni pruebas manuales en esta preparación. No se trasladan los tiempos históricos a la ejecución reportada por Brenda. Los casos adicionales sugeridos son propuestas de regresión, no pruebas ejecutadas ni nuevos criterios aprobados.

La revisión técnica asistida por IA realizada aquí consiste en cotejo de fuentes y análisis de cambios. No es revisión humana por otro integrante, aceptación de Paz Sur ni integración real. Se aplica la Definition of Done de PROCESO_DESARROLLO.md sin declarar cerradas las HU completas.

La instrucción actual identifica a Brenda como Product Owner y desarrolladora frontend y declara su contribución en los commits. Se recoge esa declaración sin cambiar identidades Git ni atribuir toda V1 a Brenda. La documentación histórica que dejaba el rol pendiente no se reescribe.
