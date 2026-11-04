# Reglas para el agente

App móvil Expo/React Native (Expo SDK 57, Expo Router, TypeScript) de agendamiento para barberías. Este repo es solo el frontend. La documentación está en docs/README.md. Léela solo cuando la tarea lo necesite.

## Expo

- Expo cambia en cada SDK: antes de tocar APIs de Expo, EAS o React Native, lee la versión de `expo` en `package.json` y consulta los docs de esa versión (`https://docs.expo.dev/versions/v<major>.0.0/`) o `https://docs.expo.dev/llms.txt`. No respondas de memoria.
- Instala paquetes con `npx expo install <paquete>` (o `bunx` si hay `bun.lock`), nunca con npm/yarn add.
- Navegación solo con Expo Router; las rutas viven en `src/app/` y son delgadas. Código que no es ruta va fuera de `src/app/`.
- Si no existen `ios/` y `android/`, no los crees ni edites a mano: configura en `app.json` y config plugins.
- Expo Go solo trae sus módulos nativos; con código nativo nuevo hace falta development build.
- Prefiere módulos de Expo sobre librerías de terceros.
- Antes de dar una tarea por terminada, ejecuta `npx expo lint` y `npx tsc --noEmit` (en cambios de diseño, ver más abajo).

## Backend

- Está en la carpeta hermana `agendamiento-backend`. **Nunca lo modifiques desde este repo.** Puedes leer su `AGENTS.md` y código (si cambió, lee sus commits recientes) antes de conectar un endpoint.
- Backend (puerto 4000) y Expo ya están corriendo: úsalos, nunca los inicies ni los detengas.
- No uses el emulador de Android: el usuario prueba lo visual en su teléfono.
- Para verificar: que compile (`npx tsc --noEmit`, `npx expo lint`; si Metro no responde, `npx expo export --platform android --output-dir <carpeta temporal fuera del repo>` y bórrala) y llama con `curl` a los endpoints de las pantallas cambiadas para confirmar que lo que envía la app es lo que espera el backend.
- Datos de prueba: deben empezar con "PRUEBA" y se borran al terminar.

## Código

- Las llamadas al backend van en el `api.ts` de cada feature; las pantallas no llaman `fetch`.
- Todo color va en `theme/paleta.ts`; nunca texto con `colors.primary` ni `#000` fijo.
- Nunca `Alert.alert`: usa `avisar`/`confirmar` de `utils/dialogos.ts`.
- Todo campo usa `CampoTexto` (con etiqueta), `CampoClave`, `CampoTelefono` o `CampoPrecio`; todo tocable lleva `accessibilityLabel` + `accessibilityHint` y al menos 44 x 44 px.
- El título de un error sale del tipo de error, nunca de la pantalla; no pases un `porDefecto` que adivine la causa.

## Flujo de trabajo

- Rama nueva por cada cambio; commits claros en español (conventional commits). Nunca "Co-Authored-By" ni atribución de IA.
- No hagas push ni commit sin que el usuario lo pida (salvo que la tarea lo indique).
- Haz solo lo que se pide; si ves otra mejora, anótala al final de la respuesta y no la hagas.
- Cambios de diseño: solo typecheck y pruebas de los archivos que toques. Sin verificadores independientes ni suite completa salvo que el usuario lo pida.
- Cambios que modifican datos guardados: avisa y espera confirmación del usuario.
- No escribas pruebas automáticas ni pidas revisiones salvo que el usuario lo pida.
- Si cambias algo importante, actualiza su documento en docs/.

## Seguridad

- Nunca leas ni escribas el `.env`; nunca pongas claves reales en archivos.
- No uses `npm audit fix --force` ni `--legacy-peer-deps`.
- No pongas claves, contraseñas, tokens, teléfonos o correos reales ni datos de clientes en el repo ni en docs/.

## Documentación

- AGENTS.md es solo para reglas: nunca pongas documentación aquí. Va en docs/ con una línea en docs/README.md.
- Si AGENTS.md pasa de unas 60 líneas, avisa al usuario y propón qué mover.

## Respuestas

- Cortas y en lenguaje simple: qué cambiaste y qué debe probar el usuario.
