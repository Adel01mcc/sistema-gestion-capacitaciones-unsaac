# Guion de exposición (5-7 minutos)

1. **Referencia:** «Mi punto de partida es Punto Inicio Fran, etiqueta
   `punto-inicio-fran` en `98f8d5a`, que ya incluye a Brenda y Adel. Mis cambios
   posteriores son los que comparo con esa versión. La entrega se identifica
   mediante el commit Punto final fran 1 en dev/franshesco». Mostrar la etiqueta,
   historial y diff. Aclarar que los rótulos sin commit pertenecen a capturas previas.
2. **Problema:** abrir `antes/server/services/user-service.js`. «El mismo módulo
   validaba, consultaba SQLite, comprobaba permisos, calculaba hashes y guardaba.
   No faltaba autenticación; el problema era la concentración de responsabilidades».
3. **Solución:** abrir `server/services/user-management.js` y `composition.js`.
   «El caso de uso recibe repositorio, hashing, reloj, auditoría y transacción.
   SQL está en repositorios, esquemas en validation y reglas en user-policy.
   SRP agrupa responsabilidades y DIP permite probar el negocio con colaboradores
   en memoria». Mostrar el primer test de `franshesco-users.test.js`.
4. **Permisos:** «El backend comprueba sesión y permisos; ocultar botones no basta.
   users.manage no concede roles.manage. Se conserva el último administrador y
   se reevalúan permisos después de scrypt, por si cambiaron durante la espera».
   Mostrar test de revocación y el de autorización directa de roles.
5. **Observer:** «Capacitaciones anuncia un hecho mediante events; no conoce al
   servicio de avisos. La composición suscribe un consumidor que crea los avisos.
   El evento se guarda con la capacitación y se publica después del commit.
   Si falla el consumidor, el evento queda pendiente y se puede reintentar sin
   duplicar avisos internos». Abrir observer, composición y prueba de fallo/reintento.
6. **Demostración:** crear una capacitación programada, abrir Avisos, modificar
   lugar/título, actualizar Avisos y marcar uno como leído. Recargar y mostrar
   que sigue leído. Los datos de demo son ficticios. Las capacitaciones iniciales
   de la semilla no reciben avisos retroactivos.
7. **Comprobación:** «Antes pasaban 75 pruebas y cuatro casos de navegador;
   después pasan 95 y cinco. Probé duplicados simultáneos, rollback, permisos,
   propiedad de avisos, fallos, reintentos y reinicio. Para 100 de 404 cuentas
   ficticias, la consulta bajó de 302 a cuatro SELECT, sin contar autenticación.
   Eso no demuestra 400 usuarios conectados ni un rendimiento en producción».

## Respuestas breves

- **¿Cambiaste la arquitectura?** Conservé el monolito modular por capas; mejoré
  los límites internos y la composición, sin microservicios ni dependencias nuevas.
- **¿Todo es refactorización?** Separar responsabilidades conserva el contrato.
  La bandeja y los eventos son una ampliación funcional solicitada, distinguida
  de la refactorización y cubierta por nuevas pruebas.
- **¿Observer y outbox son lo mismo?** No. Observer organiza suscripciones;
  outbox persiste el evento para recuperarlo si falla la entrega.
- **¿Se avisa a 400 participantes?** No automáticamente: V1 no tiene inscripciones.
  El alcance actual son gestores e instructor asignado. La política comercial
  de destinatarios sigue pendiente de confirmación con Paz Sur.
- **¿Envían WhatsApp?** No. Un recordatorio manual prellenado puede ser una
  ampliación posterior. No se confunde abrir un chat con enviar un mensaje.
- **¿Por qué no State/Strategy?** Mi patrón es Observer. Conservo la evaluación
  de Adel sobre estados; no añado otros patrones sin algoritmos/comportamientos
  que los justifiquen.
- **¿Qué falta?** Revisión humana y cliente, integración por PR, políticas de
  retención y, si se requiere, worker/canales externos con sus propias garantías.
