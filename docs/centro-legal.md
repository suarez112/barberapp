# Centro legal y reaceptación de documentos

## Centro legal (público)

- `/legales` lista la Política de datos, los Términos y el Aviso de privacidad; cada uno tiene su ruta (`/legales/<doc>`) y un atajo (`/terminos`, `/politica-de-datos`, `/aviso-privacidad`).
- El texto sale de `GET /api/v1/legal/<tipo>` (markdown). Se guarda una copia en el celular y se usa si no hay conexión (`useDocumentoLegal`).
- "Vigente desde" sale de `vigenteDesde` (`textoVigencia` en `features/legal/centro/secciones.ts`). Si el backend no lo envía se muestra "Publicado el …". La app no escribe ninguna fecha: viene de `documentos_legales.vigente_desde` del backend.

## Reaceptación cuando hay una versión nueva

- `ModalNuevaVersion` (montado en `AppProviders`) pregunta `GET /legal/estado` al abrir sesión. Si `vigente:false` bloquea la app: muestra las versiones nuevas, tres enlaces (uno por documento, se abren en un modal encima sin perder el estado) y la casilla. Aceptar llama `POST /legal/aceptar`.
- Cliente: el login trae `debeAceptarDocumentos`; la reserva muestra la casilla y envía la aceptación con la cita.
- Si `POST /citas` falla con 400 y la reserva se envió sin aceptación, `useReserva` consulta `/legal/estado`: con `vigente:false` muestra la casilla ("Documentos actualizados"). No se lee el texto del error porque el backend responde un 400 genérico sin código.
