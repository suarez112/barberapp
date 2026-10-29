# Teléfonos con bandera, accesibilidad de formularios y Mi suscripción (frontend)

Objective: country/flag phone input with libphonenumber-js, accessible form fields and buttons, richer "Mi suscripción".
Branch: feature/registro-empresa. Delivery: single branch, commit + push (user request). Test runner: none (user asked for no automated tests); checks = `npx tsc --noEmit`, `npx expo lint`, `npx expo export` when Metro is unreachable, curl against the backend on :4000.

## Specs

- S1 Phone field: "En todos los campos de teléfono, usa un campo con selector de país y bandera, compatible con React Native y Expo Go (NO uses react-international-phone, que es solo para web). Colombia (+57) por defecto."
- S2 Format/validate: "Formatea el número mientras se escribe (ej: 316 278 1393) y valida con libphonenumber-js, con las mismas reglas que el backend."
- S3 Send: "Envía al backend el número en formato E.164."
- S4 Display: "Donde se muestre un teléfono guardado, píntalo con su bandera y formato legible (ej: 🇨🇴 +57 316 278 1393)."
- S5 Labels: "Etiqueta visible arriba de cada campo; el placeholder solo como ejemplo (ej: "ej: ejemplo@gmail.com"), nunca en lugar de la etiqueta."
- S6 Screen readers: "accessibilityLabel y accessibilityHint en cada campo y botón, para lectores de pantalla como TalkBack."
- S7 Keyboards: "Teclado correcto según el campo (email-address, phone-pad, numeric) y autocompletado (autoComplete / textContentType)."
- S8 Errors: "Mensajes de error debajo del campo que digan qué corregir."
- S9 Touch/contrast: "Botones y zonas táctiles de al menos 44 px, y buen contraste de colores en modo claro y oscuro."
- S10 Active plan: "Si el plan está activo, muestra: "Plan mensual/anual · Activo", la fecha de pago, la fecha de vencimiento, los días restantes y, si aplica, "incluye X días de prueba que te quedaban"."
- S11 Trial: "Si está en prueba, agrega un botón "Activar plan ahora" que lleve a la pantalla de planes (sin pagos reales todavía; muestra un aviso de "Pagos disponibles próximamente")."

## Tasks

| ID | Specs | Route | Status | Commit |
| --- | --- | --- | --- | --- |
| T1 | S1-S4 | inline | done (tsc, lint, export, curl POST /citas) | commit 1 |
| T2 | S5-S9 | inline | done (tsc, lint, export) | commit 1 |
| T3 | S10-S11 | inline | done (tsc, lint, export) | commit 2 |

Route evidence: one parent session; T1 and T2 share the field component (CampoTexto), so no independent parallel units: everything runs inline.

## Log

- L1 (2026-10-19) User request: "1. Teléfonos con bandera … 2. Accesibilidad en TODOS los campos de formularios … 3. Mi suscripción … Haz commit y push. Dame un resumen sencillo y una lista corta de qué debo probar en el celular." (full text in the thread; specs above quote it verbatim).
- L2 (2026-10-19) Evidence: `npx tsc --noEmit` and `npx expo lint` clean. Phone helpers run with tsx: "3162781393" -> "316 278 1393", "+52 55 1234 5678" switches to MX, display "🇨🇴 +57 316 278 1393". Backend POST /api/v1/citas with fake ids (nothing created): "123" -> 400 "El número de teléfono no es válido…"; "+573162781393", "+525512345678" and "3162781393" pass validation (404 "Servicio o profesional no encontrado"). No PRUEBA data was created (no API to delete client accounts, so registration was not exercised with a valid body). Subscription field `diasPruebaSumados` confirmed in backend empresas.servicio.ts:190.
- L3 Exceptions: the weekly block grid cells are 44 px tall but their width depends on the screen (7 columns); WCAG contrast of company colors is enforced with `primaryText`/`onPrimary` computed at runtime.
