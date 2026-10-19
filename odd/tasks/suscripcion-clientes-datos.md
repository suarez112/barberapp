# Suscripción, clientes registrados y autorización de datos (frontend)

Objective: wire backend commit 21c3f76 (subscription plans, client accounts, data consent) into the app.
Branch: feature/registro-empresa. Delivery: single branch, commit + push (user request). Test runner: none (user asked for no automated tests); checks = `npx tsc --noEmit`, `npx expo lint`, `npx expo export` when Metro is unreachable, curl against the backend on :4000.

## Specs

- S1 Banner: "Banner con los días restantes que se actualiza cada día y cada vez que la app vuelve a abrirse: siempre durante la prueba, y en los últimos 7 días de un plan." (GET /api/v1/admin/empresa/suscripcion)
- S2 Mi suscripción: "En Mi negocio, una sección "Mi suscripción" con estado, plan (mensual/anual), fecha de pago, fecha de fin y días restantes."
- S3 Vencida: "Si está vencida: el admin solo puede usar Mi negocio y una pantalla "Tu prueba/suscripción terminó, elige un plan" (con planes mensual y anual de muestra, sin pagos reales todavía). Los empleados ven un aviso de negocio inactivo. Los clientes ven "Este negocio no está recibiendo reservas por ahora"."
- S4 Entrada cliente: "En "Soy cliente", dos opciones: "Continuar como invitado" (código, como ahora) o "Crear cuenta / Iniciar sesión"."
- S5 Con cuenta: "pantalla "Mis negocios" con los negocios guardados (agregar con código, quitar) para entrar directo a reservar; sus datos se llenan solos al reservar; y una pantalla "Mis citas"."
- S6 Sesión: "La sesión del cliente también se guarda con expo-secure-store."
- S7 Web: "La versión web por enlace o QR debe seguir funcionando igual."
- S8 Casilla: "En el registro de empresa, el registro de cliente y la confirmación de reserva como invitado, agrega una casilla SIN MARCAR: "Autorizo el tratamiento de mis datos personales y acepto los Términos y Condiciones", con enlaces que abran cada documento en un modal con el estilo de la app. Sin marcarla no se puede continuar." (GET /api/v1/legal/politica-datos, /api/v1/legal/terminos)
- S9 Re-aceptación: "Un cliente con sesión iniciada que ya aceptó no ve la casilla al reservar. Solo se le vuelve a mostrar si el backend indica que hay una versión nueva."

## Tasks

| ID | Specs | Route | Status | Commit |
| --- | --- | --- | --- | --- |
| T1 | S1, S2, S3 | inline | pending | |
| T2 | S8, S9 (legal modal + checkbox) | inline | pending | |
| T3 | S4, S5, S6, S7, S9 | inline | pending | |

Route evidence: one parent session, no Writer trigger (units depend on each other: T3 reuses T2's checkbox), so everything runs inline.

## Log

- L1 (2026-10-19) User request: "1. Suscripción (usa GET /api/v1/admin/empresa/suscripcion) … 2. Clientes registrados (opcional, usa /api/v1/mi-cuenta/...) … 3. Autorización de datos (usa /api/v1/legal/politica-datos y /api/v1/legal/terminos) … Haz commit y push. Dame un resumen sencillo y una lista corta de qué debo probar yo en el celular, incluyendo cómo usar los comandos npm run dev:simular-vencimiento y npm run dev:activar-plan del backend." (full text in the thread; specs above quote it verbatim).
- L2 Decisions: the unified login now answers `tipo: "cliente"` (backend no longer returns 403), so the client fallback through /cuentas/login is removed. A new legal version is detected from `debeAceptarDocumentos` at login and from the POST /citas 400 "Publicamos una nueva versión…" message.
