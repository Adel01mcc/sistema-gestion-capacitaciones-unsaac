# Presentación grupal Paz Sur — LaTeX Beamer

**Objetivo:** reunir las diapositivas de Brenda, Adel, Franshesco y Daniela en un único PDF con estilo azul UNSAAC.

## Dónde colocar la carpeta

Al descomprimir el ZIP en la raíz del repositorio se creará `docs/presentacion/`, con `main.tex`, `secciones/` e `imagenes/`. No sobrescribir `docs/latex/main.tex`, que es el informe grupal.

## Archivos

- `main.tex`: portada, estilo compartido y orden de las secciones. Un integrante lo mantiene.
- `secciones/01_brenda.tex`: contenido de HU-01 y HU-02, con antes/después y pruebas.
- `secciones/02_adel.tex`: plantilla pendiente de Adel.
- `secciones/03_franshesco.tex`: plantilla pendiente de Franshesco.
- `secciones/04_daniela.tex`: plantilla pendiente de Daniela.
- `secciones/00_contexto.tex`, `secciones/05_cierre.tex`: apertura y cierre.
- `imagenes/`: escudo y cuatro imágenes de código tomadas de fragmentos de `src/Users.tsx`.

## Cómo compilar

En la carpeta que contiene `main.tex`:

```bash
pdflatex -interaction=nonstopmode -halt-on-error main.tex
pdflatex -interaction=nonstopmode -halt-on-error main.tex
```

Usar VS Code/LaTeX Workshop u Overleaf si `pdflatex` no está instalado.

## Cómo dividir el trabajo

Cada compañero edita solo su archivo `secciones/0x_nombre.tex`, agrega sus imágenes en `imagenes/` con nombres exclusivos y realiza un Pull Request. La persona encargada de integración revisa y actualiza `main.tex` si cambia el orden. Así se evitan conflictos en el archivo principal.

## Evidencia de Brenda

- Antes HU-01: `eb00464`; después HU-01: `4cab7eb`.
- Antes HU-02: `4cab7eb`; después HU-02: `6ccf4ca`.
- `npm run check`: 28 pruebas aprobadas, 0 fallidas y build correcto, para el proyecto completo.
- Pruebas manuales: registro de usuarios, asignación de roles y edición de permisos.

Los fragmentos de código están resumidos y reacomodados en saltos de línea para que sean legibles en una diapositiva, sin cambiar la lógica de la fuente. Para una auditoría exacta, consultar el repositorio y los commits indicados.

**Nota:** las secciones de Adel, Franshesco y Daniela contienen marcadores pendientes y no deben presentarse como trabajo concluido. No atribuir Observer, State o Strategy como implementados sin verificar el código.
