# Ajustes v2 del frontend (fotos, alertas, login único, registro v2)

Objective: adapt the app to backend commit a567b74 (unified login, registration v2, booking window, one-day blocks) and fix photo uploads.
Branch: feature/registro-empresa. Delivery: single branch, commit + push (user request). Test runner: none (user asked for no automated tests); checks = `npx tsc --noEmit`, `npx expo lint`, Android emulator walkthrough.

## Specs

- S1 Photos: "ERROR AL SUBIR FOTOS (urgente): al guardar la foto de un producto, del negocio o de un barbero sale "Error: Unsupported FormDataPart implementation" en src/services/api/http.ts línea 48, llamado desde subirFotoProducto. Corrige la forma de enviar archivos para que funcione en Expo Go en Android, en todas las fotos de la app. Además, que los mensajes de error digan qué pasó realmente (archivo muy grande, formato no permitido, sin conexión, error del servidor) en vez de siempre "No se pudo conectar con el servidor"."
- S2 Alerts: "reemplaza TODAS las alertas simples del sistema (Alert.alert) por un modal propio con el mismo estilo que el modal de confirmación de cita. Con variantes de éxito, error, aviso y confirmación (botones Aceptar/Cancelar)."
- S3 Passwords: "en TODOS los campos de contraseña de la app, agrega un ícono de ojo para mostrar u ocultar lo escrito."
- S4 Login: "una sola pantalla con "Correo o usuario" y contraseña, usando el nuevo login único del backend."
- S5 Booking: "el calendario del cliente solo debe permitir elegir desde hoy hasta 14 días después (15 días en total). No dejar avanzar fuera de ese rango."
- S6 Blocks (admin only): "Selector arriba con dos modos: "Solo ese día" y "Cada semana"." / "Tocar una hora la bloquea o la libera; tocar el encabezado del día bloquea el día completo." / "Colores: libre (gris), solo ese día (rojo con X), cada semana (naranja con ↻), con cita (verde con ✓). Con leyenda abajo." / "Los barberos no deben ver opciones para bloquear."
- S7 Services/prices: "Duración: un desplegable con opciones como 15 min, 20 min, 30 min, 45 min, 1 hora, 1 h 15 min, 1 h 30 min, 2 horas" / "Precio: mientras se escribe, agregar automáticamente los puntos de miles (35.000), y que 35.000 se guarde como treinta y cinco mil pesos, no como 35. Aplica lo mismo a todos los precios de la app (productos incluidos)."
- S8 Panel card: "muestra el nombre de la administradora en lugar de su correo."
- S9 Registration: remove NIT, phone, contact email, logo URL; "Acceso del administrador": correo, usuario, contraseña + confirmación; employees dropdown 1-10; department then municipality dropdowns, then address; "Mismo horario todos los días" checkbox (days + one schedule) or 7-day list with open/closed switch and open/close dropdowns; business code (letters and numbers, max 10, no spaces) with live availability "Disponible" / "Ya está en uso".
- S10 "Mi negocio": edit location, schedule and business code; "Al cambiar el código, muestra un aviso de que los clientes deberán usar el nuevo código."

## Tasks

| ID | Specs | Route | Status | Commit |
| --- | --- | --- | --- | --- |
| T1 | S1 | inline | done (emulator) | a9a39bd |
| T2 | S2 | inline | done (emulator) | e8fe909 |
| T3 | S3 | inline | done (emulator) | e8fe909 |
| T4 | S4, S8 | inline | done (emulator) | d1b16d2 |
| T5 | S5 | inline | done (emulator) | 55b4f6e |
| T6 | S6 | inline | done (emulator) | 1810f6c |
| T7 | S7 | inline | done (emulator) | 4275cf7 |
| T8 | S9, S10 | inline | done (emulator) | d0af586 |

Route evidence: one agent, sequential units sharing UI primitives (selects, dialogs); no Writer trigger reason.

## Log

- L1 (2026-10-19) User request: the 10 points above, plus "No escribas pruebas automáticas ni pidas revisiones", verify on the Android emulator with test data prefixed "PRUEBA" (deleted at the end), "Haz commit y push".
- L2 Root cause S1: SDK 57 global fetch is `expo/fetch`; `convertFormData` rejects the React Native `{ uri, name, type }` part. Fix: append `new File(uri)` from `expo-file-system`.
- L3 (2026-10-19) Emulator walkthrough (Pixel_7_Pro, Expo Go, backend on :4000) with "PRUEBA" data: registration v2 (code "Ya está en uso"/"Disponible", Santander/Bucaramanga, per-day schedule), business/staff/product photo uploads stored on the server, service 35.000 -> 35000 and 45 min, Mi negocio code change warning, one-day/weekly/full-day blocks with colors and legend, staff sees no block options, booking limited to 19 Oct - 2 Nov with closed/blocked days respected, login with username (staff) and email (admin), "Sin conexión" dialog with backend stopped. Test data and uploaded files deleted afterwards.
- L4 Fixes found during the walkthrough: dropdown options needed two taps with the keyboard open (screen ScrollView now keyboardShouldPersistTaps="handled"), hour lists open at the chosen hour, block symbols drawn as icons so ↻ matches X and ✓.
