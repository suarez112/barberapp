# API, errores y fotos

## URL del backend

`src/services/api/config.ts` resuelve `API_BASE_URL` en este orden:

1. Variable de entorno `EXPO_PUBLIC_API_URL` (ver `.env.example`);
2. web: `http://localhost:4000`;
3. la IP del servidor de Expo (`Constants.expoConfig.hostUri`) en el puerto 4000, para que un teléfono físico llegue al PC;
4. respaldo: `http://10.0.2.2:4000` en el emulador Android, `http://localhost:4000` en otros casos.

## Cliente HTTP

`src/services/api/http.ts` exporta `request<T>(ruta, { method, body, token, signal, tiempoLimiteMs })`: cuerpo JSON, `Authorization: Bearer <token>` si hay token, 15 s de límite por defecto. El límite rechaza la llamada misma (Promise.race), no solo el abort: expo/fetch lee el cuerpo con `text()` nativo, que ignora `abort()`, así que una lectura atascada esperaría para siempre.

- `signal` cancela a propósito (p. ej. al salir de una pantalla): lanza `PeticionCancelada` (`esCancelada(e)`), que **nunca se muestra**. Las cargas de pantalla la obtienen de `hooks/useSenalDeSalida.ts` (aborta al desmontar). expo/fetch reporta igual un timeout y una cancelación ("fetch failed: Fetch request has been canceled"); `request()` los distingue.
- Error de servidor (4xx/5xx) -> `ApiError` con el `{ error }` del backend y `status`.
- Fallo de red, timeout o respuesta no JSON -> `ErrorDeConexion` (`motivo`: `sin-conexion` | `tiempo-agotado` | `respuesta-invalida`).
- `ErrorDeEnvio`: la app no pudo armar la petición (p. ej. archivo ilegible); nunca se reporta como "sin conexión".
- `mensajeDeError(error, porDefecto)` devuelve el texto para el usuario.
- Un cuerpo `FormData` se envía como multipart (sin `Content-Type` JSON).
- Cada feature declara sus llamadas en su `api.ts` (sesion, cuenta, negocio, agenda, clientes, equipo, servicios, productos, bloqueos, cartera). Los endpoints nuevos se agregan igual; las pantallas no llaman `fetch`.

## Mensajes de error

`services/api/errores.ts` `describirError()` convierte cualquier error en `{ titulo, mensaje }`. **El título siempre sale del tipo de error, nunca de la pantalla**, para que título y mensaje coincidan:

- sin conexión; tiempo agotado;
- 401 "Sesión vencida" (el login pasa `tituloNoAutorizado: "Datos incorrectos"`);
- 402 "Suscripción vencida", o "Negocio inactivo" para empleados;
- 403 "Sin permiso"; 404 "No encontrado"; 409 "No disponible" (o `tituloConflicto`);
- 413 archivo muy grande; 429; 5xx "Error del servidor";
- el `titulo` de la pantalla solo se usa en 400 (validación); un error desconocido de la app muestra "Algo salió mal".

Nunca pasar un `porDefecto` que adivine la causa (p. ej. "contraseña incorrecta"). `registrarCausa()` registra con `console.log` la causa que no viene del servidor (nunca `console.error` para fallos de conexión: en desarrollo abre la pantalla roja de Expo con texto técnico) y omite las cancelaciones. Las acciones del panel usan `features/sesion/useAvisarError.ts`, que además cierra la sesión en 401. La reserva muestra 403 (teléfono en lista negra o negocio sin recibir reservas) y 409 (horario ocupado o bloqueado) con el mensaje del backend.

## Fotos

`utils/imagenes.ts` `elegirFoto()` (verifica JPG/PNG/WEBP y 5 MB como el backend) y `formularioFoto()` (campo multipart `foto`). En Android/iOS la parte es `new File(uri)` de `expo-file-system`: el `fetch` global del SDK 57 es `expo/fetch` y rechaza la parte antigua `{ uri, name, type }` de React Native con "Unsupported FormDataPart implementation". Las subidas tienen 60 s de límite.
