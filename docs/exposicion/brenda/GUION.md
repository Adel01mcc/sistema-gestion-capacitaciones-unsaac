# Guion de exposición individual
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
