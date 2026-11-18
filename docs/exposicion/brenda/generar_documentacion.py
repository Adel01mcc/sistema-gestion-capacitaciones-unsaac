from pathlib import Path
import subprocess, hashlib, json, re
root=Path.cwd(); out=root/'docs/exposicion/brenda'
def git(*args): return subprocess.check_output(['git',*args]).decode('utf-8')
def write(name,text): (out/name).write_text(text,encoding='utf-8')
commits=['eb00464','4cab7eb','6ccf4ca']
sources={c:git('show',c+':src/Users.tsx') for c in commits}
manifest=[]
def extract(name,c,start,end=None):
    lines=sources[c].splitlines()
    a=next(i for i,l in enumerate(lines) if start in l)
    if end is None: b=a+1
    elif isinstance(end,int): b=a+end
    else: b=next(i for i in range(a+1,len(lines)) if end in lines[i])+1
    data='\n'.join(lines[a:b])+'\n'; write('fragmentos/'+name+'.txt',data)
    manifest.append(dict(fragmento=name,commit=git('rev-parse',c).strip(),archivo='src/Users.tsx',inicio=a+1,fin=b,sha256=hashlib.sha256(data.encode()).hexdigest()))
extract('hu01_antes','eb00464','    const payload:', '    try { await request')
extract('hu01_despues','4cab7eb','      const payload = prepareUserPayload',3)
extract('hu01_payload','4cab7eb','function prepareUserPayload(', '  return payload;')
# Include the closing brace exactly, without synthesizing code.
p=out/'fragmentos/hu01_payload.txt'; p.write_text(p.read_text(encoding='utf-8')+'}\n',encoding='utf-8'); manifest[-1]['fin']+=1; manifest[-1]['sha256']=hashlib.sha256(p.read_bytes()).hexdigest()
extract('hu01_guardar','4cab7eb','async function saveUser(',6)
extract('hu01_inicial','4cab7eb','function initialUserForm(',13)
extract('hu02_antes','4cab7eb','    try { await request(`/users/${user.id}/roles`')
extract('hu02_despues','6ccf4ca','      await saveUserRoles',2)
extract('hu02_guardar_roles','6ccf4ca','async function saveUserRoles(',6)
extract('hu02_guardar_permisos','6ccf4ca','async function saveRolePermissions(',6)
extract('hu02_seleccion','6ccf4ca','function toggleSelection(',6)
extract('hu02_catalogo','6ccf4ca','async function loadRoleCatalog()',8)
extract('hu02_nombre','6ccf4ca','    const cleanName',6)
for m in manifest:
    actual=(out/('fragmentos/'+m['fragmento']+'.txt')).read_text(encoding='utf-8')
    expected='\n'.join(git('show',m['commit']+':'+m['archivo']).splitlines()[m['inicio']-1:m['fin']])+'\n'
    assert actual==expected,m
for hu,a,b in [('HU01','eb00464','4cab7eb'),('HU02','4cab7eb','6ccf4ca')]:
    actual=(root/(hu+'_comparacion.txt')).read_text(encoding='utf-8-sig').replace('\r\n','\n').rstrip()
    expected=git('diff',a,b,'--','src/Users.tsx').replace('\r\n','\n').rstrip()
    assert actual==expected,hu+' comparacion no coincide'
write('MANIFIESTO.json',json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
write('COMMITS.txt','\n'.join(git('show','-s','--format=%H%nPadre: %P%nAsunto: %s',c) for c in commits)+'\nRama actual: '+git('branch','--show-current')+'Respaldo V1: '+git('rev-parse','respaldo/brenda-v1'))
preamble=r'''\documentclass[aspectratio=169,10pt]{beamer}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage[spanish]{babel}
\usepackage{lmodern}
\usepackage{listings}
\usepackage{booktabs}
\definecolor{paz}{RGB}{22,62,81}
\definecolor{acento}{RGB}{0,125,137}
\setbeamercolor{structure}{fg=paz}
\setbeamercolor{frametitle}{fg=white,bg=paz}
\setbeamercolor{block title}{fg=white,bg=acento}
\setbeamercolor{block body}{bg=black!3}
\setbeamertemplate{navigation symbols}{}
\setbeamertemplate{footline}{\hspace{4mm}\scriptsize Brenda L. Mayhuire Chacón\hfill Paz Sur\hspace{5mm}\insertframenumber\hspace{4mm}\vspace{2mm}}
\setbeamersize{text margin left=7mm,text margin right=7mm}
\lstset{basicstyle=\ttfamily\scriptsize,breaklines=true,columns=fullflexible,keepspaces=true,showstringspaces=false,frame=single,rulecolor=\color{black!15},backgroundcolor=\color{black!2},tabsize=2}
\newcommand{\codigo}[1]{\lstinputlisting{fragmentos/#1.txt}}
\newcommand{\fuente}[1]{{\tiny\color{paz}Fuente: \texttt{src/Users.tsx}; #1. Rangos exactos en MANIFIESTO.json.}\par}
'''
comparison1=r'''\begin{frame}{HU-01: del envío mezclado a tareas identificables}
\begin{block}{ANTES · eb00464 · preparación y petición dentro de submit}
\codigo{hu01_antes}
\end{block}
\begin{block}{DESPUÉS · 4cab7eb · submit coordina el guardado}
\codigo{hu01_despues}
\end{block}
\fuente{eb00464 y 4cab7eb}
\small Cambio: extraer preparación y envío. Mejora: localizar cada tarea y leer el flujo con mayor facilidad. Las reglas de documento, contraseña y roles se conservan.
\end{frame}
'''
comparison2=r'''\begin{frame}{HU-02: separar la asignación de roles del formulario}
\begin{block}{ANTES · 4cab7eb · petición HTTP dentro de submit}
\codigo{hu02_antes}
\end{block}
\begin{columns}[T]
\begin{column}{.38\textwidth}
\begin{block}{DESPUÉS · 6ccf4ca · llamada}
\codigo{hu02_despues}
\end{block}
\end{column}
\begin{column}{.59\textwidth}
\begin{block}{DESPUÉS · función extraída}
\codigo{hu02_guardar_roles}
\end{block}
\end{column}
\end{columns}
\fuente{4cab7eb y 6ccf4ca}
\small Cambio: concentrar URL, método y JSON en una función. El formulario mantiene la validación, mensajes y estado de guardado.
\end{frame}
'''
write('comparaciones.tex',preamble+'\n\\begin{document}\n'+comparison1+comparison2+'\\end{document}\n')
main=r'''\title{Sistema de Gestión de Capacitaciones de Paz Sur}
\subtitle{Documentación individual · HU-01 y HU-02}
\author{Brenda Lucía Mayhuire Chacón\\Product Owner y desarrolladora frontend}
\institute{Universidad Nacional de San Antonio Abad del Cusco\\Escuela Profesional de Ingeniería Informática y de Sistemas\\Curso: Ingeniería de Software I}
\date{14 de noviembre de 2026}
\begin{document}
\begin{frame}\titlepage\end{frame}
\begin{frame}{2. Objetivo y responsabilidades}
\begin{block}{Objetivo individual}
Mejorar la claridad y mantenibilidad del frontend de registro de usuarios y gestión de roles, conservando su contrato con la API.
\end{block}
\begin{itemize}
\item Como Product Owner: ordenar necesidades, aclarar criterios de aceptación y mantener la relación entre requisitos, cambios y comprobaciones.
\item Como desarrolladora frontend: refactorizar formularios React/TypeScript, separar preparación de datos y peticiones, y comprobar los flujos afectados.
\item Alcance demostrado: dos commits sobre \texttt{src/Users.tsx}. La V1 es la base del sistema, no una contribución individual atribuida íntegramente a Brenda.
\end{itemize}
\small Los roles personales proceden de la declaración de Brenda en el encargo. No se acreditan reuniones, aceptación del cliente ni revisiones humanas adicionales.
\end{frame}
\begin{frame}{3. Gestión de configuración y trazabilidad}
\begin{itemize}
\item Rama real: \texttt{feature/brenda-mayhuire}; permite identificar el trabajo individual.
\item Respaldo real: \texttt{respaldo/brenda-v1} apunta a \texttt{eb00464}. Conserva una referencia Git de la V1; no es un respaldo certificado de la base de datos.
\item Secuencia comprobada: \texttt{eb00464} (V1) $\rightarrow$ \texttt{4cab7eb} (HU-01) $\rightarrow$ \texttt{6ccf4ca} (HU-02).
\item Cada refactorización cambia únicamente \texttt{src/Users.tsx}. Los TXT de comparación coinciden con los diffs de esos pares de commits.
\item Trazabilidad: HU $\rightarrow$ criterio CA $\rightarrow$ commit $\rightarrow$ archivo y líneas $\rightarrow$ comprobación. El manifiesto registra hashes de fragmentos.
\end{itemize}
\small Inspección local del 14/11/2026; no se consultó GitHub ni se efectuaron commit, push o merge. Se preservaron los cambios locales preexistentes.
\end{frame}
\begin{frame}{4. Requisitos y criterios documentados}
\small
\textbf{HU-01:} Como administrador, registrar usuarios con datos y acceso protegido.
\begin{itemize}
\item CA-01-1: alta autenticada, contraseña de 12 a 128 caracteres, respuesta 201 y consulta sin contraseña/hash.
\item CA-01-2: correo/documento duplicado: 409; entradas inválidas: 422, sin alta parcial.
\item CA-01-3: exigir sesión y permisos; \texttt{users.manage} sin \texttt{roles.manage} solo permite altas participantes; normalizar opcionales vacíos.
\end{itemize}
\textbf{HU-02:} Asignar roles y gestionar permisos para controlar operaciones.
\begin{itemize}
\item CA-02-1: \texttt{roles.manage}, roles existentes y permisos efectivos consultables.
\item CA-02-2: rechazar acceso insuficiente/código inexistente sin cambios parciales.
\item CA-02-3: proteger rol administrador y última administración activa.
\end{itemize}
\scriptsize Fuente: BACKLOG y CRITERIOS\_ACEPTACION, CA-01/02-1 a 3. Son criterios existentes, pendientes de validación de negocio según el repositorio. Brenda reporta pruebas manuales de alta, roles y permisos; no acredita por ello todos los casos negativos. No se añaden criterios aprobados nuevos.
\end{frame}
\begin{frame}{5. Diseño de software aplicado a los cambios}
\begin{itemize}
\item \textbf{SRP:} \texttt{initialUserForm} inicializa; \texttt{prepareUserPayload} prepara; \texttt{saveUser} envía; \texttt{submit} coordina la interacción.
\item \textbf{Cohesión:} cada función reúne instrucciones de una tarea concreta.
\item \textbf{Acoplamiento:} los manejadores delegan detalles HTTP en funciones con nombre; estas siguen dependiendo de \texttt{request} y del contrato de API.
\item \textbf{Modularidad funcional:} extracción dentro de \texttt{Users.tsx}; no se crearon archivos de servicio ni módulos independientes.
\item \textbf{Reutilización real:} \texttt{toggleSelection} se usa tanto en opciones de roles como de permisos. No se demuestra reutilización externa de las otras funciones.
\end{itemize}
\small Mejora observada por lectura: responsabilidades más localizables. No se midieron tiempos de mantenimiento ni rendimiento.
\end{frame}
'''
main+=comparison1+r'''\begin{frame}{HU-01: qué hacen las funciones extraídas}
\begin{columns}[T]
\begin{column}{.58\textwidth}
\codigo{hu01_payload}
\end{column}
\begin{column}{.39\textwidth}
\small\texttt{prepareUserPayload} copia el formulario; convierte documento vacío en \texttt{null}; omite contraseña vacía al editar; añade roles solo en el alta.
\medskip

\texttt{initialUserForm} concentra valores iniciales y tipa el estado con \texttt{UserFormData}.
\medskip

\texttt{saveUser} selecciona POST para alta o PUT para edición. La autorización sigue en el servidor.
\end{column}
\end{columns}
\fuente{4cab7eb; fragmentos auxiliares incluidos en la carpeta fragmentos}
\end{frame}
'''+comparison2+r'''\begin{frame}{HU-02: guardar permisos y reutilizar la selección}
\begin{columns}[T]
\begin{column}{.53\textwidth}
\codigo{hu02_guardar_permisos}
\small\texttt{saveRolePermissions} envía nombre y permisos por PUT. No decide quién está autorizado.
\end{column}
\begin{column}{.44\textwidth}
\codigo{hu02_seleccion}
\small\texttt{toggleSelection} agrega o retira códigos; al marcar uno existente evita duplicarlo. Se comparte entre roles y permisos.
\end{column}
\end{columns}
\medskip
\small Hay un ajuste funcional adicional: \texttt{RoleForm} aplica \texttt{name.trim()} y rechaza un nombre vacío antes de enviar. No es únicamente un cambio de formato.
\fuente{6ccf4ca}
\end{frame}
\begin{frame}{HU-02: cargar catálogos sin mezclar la presentación}
\codigo{hu02_catalogo}
\begin{itemize}
\item \texttt{loadRoleCatalog} conserva las dos consultas concurrentes con \texttt{Promise.all} y devuelve un objeto con roles y permisos.
\item \texttt{RolesPage} conserva el manejo de carga, error y cancelación lógica mediante la variable \texttt{active}.
\item La concurrencia ya existía antes: la mejora es la ubicación y claridad de la tarea, sin una aceleración demostrada.
\end{itemize}
\fuente{6ccf4ca; comparación con 4cab7eb}
\end{frame}
\begin{frame}{Patrones candidatos del proyecto completo}
\small
\begin{description}
\item[Observer] Notificar a suscriptores cuando cambia un evento; candidato para alertas de capacitaciones. El proyecto ya usa eventos de navegador para sesión expirada, pero estos commits no implementan un Observer propio para alertas.
\item[State] Encapsular comportamiento que cambia según el estado; candidato si crece la lógica de capacitación. El mapa de transiciones actual no demuestra una implementación GoF de State; \texttt{useState} tampoco.
\item[Strategy] Intercambiar algoritmos bajo un contrato común; candidato para políticas distintas de evaluación o certificación si se confirman. No se identificaron estrategias intercambiables en estas refactorizaciones.
\end{description}
\begin{block}{Evaluación del aporte individual}
Extracción de funciones, reducción de duplicación y aplicación de principios de diseño. No hay evidencia de que HU-01/HU-02 introduzcan Observer, State o Strategy. Una función auxiliar y SRP no son patrones GoF.
\end{block}
\scriptsize Referencia local: ARQUITECTURA, sección 9; inspección de Users.tsx y api.ts.
\end{frame}
\begin{frame}{Pruebas: resultado, procedencia y alcance}
\begin{block}{Resultado reportado por Brenda}
\texttt{npm run check}: 28 pruebas aprobadas, 0 fallidas y compilación exitosa. Registro recibido en el encargo; sin fecha/hora ni log de esa ejecución adjuntos.
\end{block}
\begin{itemize}
\item Las 28 pertenecen al conjunto automatizado del proyecto: API, seguridad y persistencia; no son 28 pruebas exclusivas del frontend de Brenda.
\item Antecedente independiente: \texttt{docs/PRUEBAS.md}, 12/11/2026, registra 28 aprobadas y build de V1; no certifica por sí solo los commits posteriores.
\item Pruebas manuales reportadas: registro de usuarios, asignación de roles y edición de permisos. No se inventan capturas ni casos adicionales ejecutados.
\item Esta preparación verificó fuentes y diffs; no repitió pruebas ni compiló la aplicación para respetar el alcance de documentación.
\end{itemize}
\scriptsize Propuestas de regresión, aún no acreditadas: selección repetida sin duplicados, nombre de rol solo con espacios y respuestas de error en formularios. No son nuevos criterios de negocio aprobados.
\end{frame}
\begin{frame}{Conclusiones y aprendizaje}
\begin{itemize}
\item La mantenibilidad mejora al poder ubicar inicialización, preparación y comunicación HTTP por separado.
\item Los formularios conservan la interacción; las funciones extraídas describen tareas concretas y permiten compartir la selección.
\item Aprendizaje: justificar el diseño con cambios verificables; distinguir un principio SOLID de un patrón GoF y separar refactorización de ajustes funcionales.
\item Como Product Owner, la trazabilidad permite explicar qué necesidad atiende cada cambio y qué evidencia falta para aceptarlo.
\end{itemize}
\begin{block}{Estado de la entrega individual}
Refactorizaciones terminadas según Brenda, con evidencia Git y verificaciones reportadas. No se declara ``Hecha'' la historia completa sin revisión humana e integración exigidas por la Definition of Done.
\end{block}
\end{frame}
\appendix
\begin{frame}{Anexo A. Commits y fuentes utilizadas}
\small
\begin{tabular}{ll}\toprule Referencia & Evidencia \\\midrule
\texttt{eb00464} & Base funcional V1 y respaldo Git \\
\texttt{4cab7eb} & HU-01; padre: \texttt{eb00464} \\
\texttt{6ccf4ca} & HU-02; padre: \texttt{4cab7eb} \\\bottomrule\end{tabular}
\medskip

\textbf{Código:} \texttt{src/Users.tsx} en los tres commits; \texttt{src/api.ts} para contexto HTTP/CSRF.
\medskip

\textbf{Comparaciones:} \texttt{HU01\_comparacion.txt}, \texttt{HU02\_comparacion.txt}; igualdad comprobada contra \texttt{git diff}.
\medskip

\textbf{Documentos:} README; DIAGNOSTICO\_INICIAL; IMPLEMENTATION\_CONTRACT; REQUISITOS; BACKLOG; CRITERIOS\_ACEPTACION; PROCESO\_DESARROLLO; ARQUITECTURA; PRUEBAS, en \texttt{docs/} salvo README.
\end{frame}
\begin{frame}{Anexo B. Reproducibilidad y límites}
\begin{itemize}
\item \texttt{COMMITS.txt}: identificadores completos y referencia del respaldo.
\item \texttt{MANIFIESTO.json}: commit, ruta, líneas originales y SHA-256 de cada fragmento; extracción literal sin reescribir código.
\item \texttt{comparaciones.tex}: dos láminas independientes para exportar a PNG o PDF; mismo contenido que las diapositivas 6 y 8.
\item \texttt{VERIFICACION.md}: comandos, fecha, resultados y limitaciones de la preparación documental.
\item La asignación personal de los commits se basa en la declaración de Brenda; los metadatos Git no son prueba suficiente de identidad. No se modificaron autorías.
\end{itemize}
\small No se reproducen secretos, base de datos ni cambios locales ajenos. Se conservan documentos previos sin actualizarlos por la restricción explícita del encargo.
\end{frame}
\end{document}
'''
write('main.tex',preamble+main)
write('GUION.md','''# Guion de exposición individual
Brenda Lucía Mayhuire Chacón — Ingeniería de Software I

1. **Portada.** Soy Brenda Lucía Mayhuire Chacón, Product Owner y desarrolladora frontend. Presentaré las mejoras de registro de usuarios y de roles y permisos.
2. **Participación.** Mi objetivo fue hacer más fácil entender y mantener estos formularios. Como Product Owner relaciono las necesidades con los criterios; como desarrolladora trabajé en estas dos refactorizaciones. La base V1 es del proyecto y no la presento como trabajo exclusivamente mío.
3. **Configuración.** Trabajé en feature/brenda-mayhuire. El respaldo/brenda-v1 conserva el commit original eb00464. Luego están 4cab7eb para usuarios y 6ccf4ca para roles. Así podemos recuperar y comparar el contenido real sin depender de capturas.
4. **Requisitos.** HU-01 permite registrar usuarios con datos válidos y acceso autorizado. HU-02 permite asignar roles y permisos con protección de la administración. Estos criterios ya estaban documentados, aunque la validación de negocio sigue pendiente. Reporté pruebas manuales de los tres flujos; eso no significa haber comprobado cada rechazo posible.
5. **Diseño.** Separé tareas en funciones con nombres concretos. Cada una reúne instrucciones que tienen el mismo propósito. Las funciones siguen en Users.tsx. La selección se comparte entre roles y permisos.
6. **Comparación HU-01 — señalar ANTES.** Aquí submit preparaba los datos y también enviaba la petición. El documento vacío se convertía en null y se cuidaba no cambiar una contraseña vacía al editar. **Señalar DESPUÉS.** Ahora prepareUserPayload prepara los datos y saveUser los envía; submit coordina y confirma que terminó. Conservé esas reglas. La mejora es poder encontrar cada tarea con facilidad; no estoy afirmando que sea más rápido.
7. **Detalle HU-01.** initialUserForm reúne los valores iniciales. prepareUserPayload hace una copia y ajusta los datos. saveUser decide si se registra con POST o se edita con PUT. El servidor mantiene la autoridad para aceptar la operación.
8. **Comparación HU-02 — señalar ANTES.** La URL y el envío de roles estaban escritos directamente en el formulario. **Señalar DESPUÉS.** El formulario llama a saveUserRoles y esta función concentra la petición. Si se revisa cómo se envían los roles, hay un lugar concreto donde buscar. El formulario sigue mostrando errores y el estado de guardado.
9. **Permisos y selección.** saveRolePermissions envía nombre y permisos. toggleSelection agrega o retira una opción y se usa en ambos selectores. Además evita agregar de nuevo un código ya seleccionado. También se rechaza un nombre de rol que solo tiene espacios. Estos últimos son pequeños cambios de comportamiento y los distingo de la extracción de funciones.
10. **Catálogos.** loadRoleCatalog consulta roles y permisos y entrega ambos resultados. Las consultas ya se ejecutaban juntas; no atribuyo una mejora de velocidad a esta extracción.
11. **Patrones.** Observer podría servir para avisos; State, para comportamientos según el estado; Strategy, para elegir políticas de evaluación. En mis cambios hay funciones auxiliares y principios de diseño, pero no evidencia de haber añadido esos patrones GoF. Usar useState no significa implementar State.
12. **Pruebas.** Ejecuté npm run check y reporté 28 aprobadas, cero fallidas y compilación exitosa. Son pruebas del proyecto, no 28 pruebas exclusivas de mi frontend. Comprobé manualmente el registro, la asignación de roles y la edición de permisos. Este documento no inventa un log de esa ejecución ni una revisión de otra persona.
13. **Conclusión.** Aprendí a separar tareas, compartir lógica repetida y explicar los cambios con evidencia. Los commits permiten comprobar qué cambió. La revisión humana e integración son pasos distintos y no los doy por realizados.
14–15. **Anexos.** Aquí están las fuentes y el manifiesto con commits y líneas para comprobar los fragmentos.

## Preguntas probables
- **¿Aplicaste un patrón de diseño?** No identifiqué un patrón GoF introducido por estos commits; apliqué separación de responsabilidades y extracción de funciones.
- **¿Cambiaste el backend?** Los dos commits de refactorización solo cambian src/Users.tsx; las peticiones siguen pasando por request.
- **¿Son módulos nuevos?** Son funciones dentro del mismo archivo. Es una mejora de organización, con límites.
- **¿Todo conserva exactamente el comportamiento?** HU-01 conserva las reglas mostradas; HU-02 también añade prevención de duplicados y rechazo local de nombre vacío tras trim.
- **¿Las 28 pruebas bastan para cerrar la HU?** No acreditan por sí solas todos los criterios ni reemplazan revisión humana e integración.
''')
write('README.md','''# Exposición individual de Brenda

Abrir `main.tex` como archivo principal. Presentación Beamer 16:9, autónoma respecto de docs/latex; conservar la subcarpeta fragmentos. No requiere shell-escape, bibliografía externa ni imágenes para compilar.

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
''')
print('Documentos creados; '+str(len(manifest))+' fragmentos cotejados; ambas comparaciones TXT coinciden con Git.')
