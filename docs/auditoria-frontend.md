# Auditoría del frontend

Fecha: 2026-11-11 · Rama: `chore/auditoria-frontend` · Alcance: todo `src/`, `app.json`, `render.yaml`, `package.json`, `.gitignore`.

Auditoría de **solo lectura**: no se cambió código. Cada hallazgo se comprobó en el archivo y la línea indicados. Lo que no se pudo comprobar no está en la lista (ver "Lo que no se revisó").

Comprobaciones automáticas: `npx tsc --noEmit` sin errores y `npx expo lint` sin errores.

## Resumen

| Gravedad | Cantidad |
| --- | --- |
| Alta | 2 |
| Media | 7 |
| Baja | 14 |

**Pagos: no hay claves ni datos sensibles en el frontend.** No se encontró ninguna llave de Wompi (pública, privada ni de integridad), ni tokens, ni secretos en el código, en `app.json`, en `render.yaml` ni en `.env.example`. La única variable pública es `EXPO_PUBLIC_API_URL`. Los hallazgos de pagos (M6, M7, B1, B2) son de robustez y experiencia, no de fuga de datos.

## Gravedad alta

### A1. Las notificaciones push no se pueden registrar en ningún build
- **Dónde:** `app.json:1-61` (no existe `extra.eas.projectId`); `src/features/notificaciones/nativo.ts:73-77`. Tampoco hay `eas.json` en el repo.
- **Qué pasa:** sin `projectId` la función devuelve `no-disponible` y solo escribe un mensaje en la consola. La persona nunca recibe avisos de citas y la app no se lo dice.
- **Arreglo:** ejecutar `eas init` (agrega el `projectId` a `app.json`) y probar en un development build.
- **Esfuerzo:** bajo.

### A2. La app todavía tiene la identidad de la plantilla
- **Dónde:** `app.json:4` (`"slug": "app"`), `app.json:8` (`"scheme": "app"`), `app.json:17` (`"package": "com.anonymous.app"`).
- **Qué pasa:** el `package` de Android no se puede cambiar después de publicar en la tienda. El esquema `app` es genérico: otra app instalada puede registrar el mismo y recibir los enlaces profundos.
- **Arreglo:** definir el identificador definitivo, el `slug` y un esquema propio antes del primer build de tienda.
- **Esfuerzo:** bajo ahora; imposible después de publicar.

## Gravedad media

### M1. El sitio web no envía Content-Security-Policy
- **Dónde:** `render.yaml:29-45` (hay `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` y HSTS, pero no CSP). HSTS en `render.yaml:44-45` no incluye `includeSubDomains`.
- **Qué pasa:** en la web el token de sesión vive en la memoria de la página. Sin CSP, un script inyectado podría leerlo o cambiar el destino del pago.
- **Arreglo:** agregar una CSP que solo permita el propio dominio, la API y las fuentes que la app usa. Probar en un deploy de prueba porque una CSP mal escrita rompe la página.
- **Esfuerzo:** medio.

### M2. `.gitignore` no ignora el archivo `.env`
- **Dónde:** `.gitignore:34` (solo `.env*.local`). `git check-ignore .env` confirma que no está ignorado.
- **Qué pasa:** hoy no hay ningún `.env` versionado, pero si alguien crea uno, `git add .` lo sube.
- **Arreglo:** agregar `.env` y `.env.*` con la excepción `!.env.example`.
- **Esfuerzo:** bajo.

### M3. La URL de la API cae en `localhost` sin avisar y no exige HTTPS
- **Dónde:** `src/services/api/config.ts:13-16` y `src/services/api/config.ts:23-25`.
- **Qué pasa:** si un build de producción se hace sin `EXPO_PUBLIC_API_URL`, la web llama a `http://localhost:4000` y el celular a `http://10.0.2.2:4000`. La app parece "sin conexión" y no hay nada que indique la causa. Tampoco se rechaza una URL `http://` en producción (por ahí viajan tokens y contraseñas).
- **Arreglo:** fuera de desarrollo (`__DEV__` falso), fallar con un error claro si falta la variable o no empieza por `https://`.
- **Esfuerzo:** bajo.

### M4. Hay 62 textos de menos de 12 px
- **Dónde:** 1 de 8 px, 4 de 9 px, 12 de 10 px y 45 de 11 px. Ejemplos: `src/features/bloqueos/BloqueoSemanal.tsx:665`, `:677`, `:679`; `src/components/ui/SelectorDias.tsx:174`, `:176`; `src/components/ui/Bandera.tsx:46`; `src/components/ui/Insignia.tsx:35`; `src/features/cartera/ReportesCartera.tsx:308`, `:317`, `:318`, `:328`; `src/features/reservas/components/SelectorHoras.tsx:193`; `src/features/reservas/components/ConfirmacionCita.tsx:260`; `src/features/equipo/EquipoAdmin.tsx:763`.
- **Qué pasa:** son difíciles de leer en el celular, sobre todo para personas mayores. El mínimo recomendado es 12 px.
- **Arreglo:** subir a 12 px y revisar que las cuadrículas (bloqueos, mapa de calor) sigan cabiendo.
- **Esfuerzo:** medio (hay que mirar cada pantalla).

### M5. Colores escritos fuera de `theme/paleta.ts`
- **Dónde:** `src/app/index.tsx:38`; `src/components/layout/BotonCabecera.tsx:29`, `:34`; `src/components/layout/PanelAdaptable.tsx:63-65`; `src/components/layout/PantallaMarca.tsx:118`; `src/components/ui/ZonaFoto.tsx:29-30`, `:38-39`; `src/features/admin/components/FotoNegocio.tsx:48`, `:108`; `src/features/bloqueos/BloqueoSemanal.tsx:46-51`; `src/features/enlace/CodigoQr.tsx:81`; `src/features/inicio/AnimacionInicio.tsx:21-24`; `src/features/superadmin/CategoriasSuperadmin.tsx:119`; `src/features/superadmin/graficos/colores.ts:6-7`; `src/features/agenda/components/BotonNuevaCita.tsx:33`. Además, fondos `rgba(...)` de modales repetidos con cinco opacidades distintas (0.4, 0.5, 0.6, 0.7 y 0.8), por ejemplo `src/components/ui/DialogoHost.tsx:92` y `src/components/layout/MenuCabecera.tsx:166`.
- **Qué pasa:** rompe la regla del proyecto ("todo color va en `theme/paleta.ts`"). Efecto visible: `src/app/index.tsx:38` pinta la pantalla de blanco mientras carga, también en tema oscuro.
- **Arreglo:** mover estos valores a la paleta y dejar una sola opacidad para el fondo de los modales.
- **Esfuerzo:** medio.

### M6. El pago no compara el monto de la orden con el precio mostrado, ni revisa la URL de la pasarela
- **Dónde:** `src/features/pagos/PagoPasarela.tsx:92-93` y `:117`.
- **Qué pasa:** el precio del resumen lo calcula la app (`precioPara`, línea 117). La orden que devuelve el backend trae su propio `monto`, pero la app no lo usa: redirige directo. Si los dos números difieren, la persona ve un precio y la pasarela cobra otro. Además `window.location.assign(creada.urlPago)` acepta cualquier URL sin comprobar que sea `https://`.
- **Arreglo:** si `creada.monto` no coincide con el precio mostrado, detenerse y avisar. Antes de redirigir, comprobar que la URL sea `https:`.
- **Esfuerzo:** bajo.

### M7. En la web la sesión se pierde al recargar y al volver de pagar
- **Dónde:** `src/features/sesion/sesionGuardada.ts:15-18`; se nota en `src/features/pagos/ConfirmarPagoScreen.tsx:102` ("te pedirá iniciar sesión").
- **Qué pasa:** es una decisión de seguridad correcta (el token no se guarda en el navegador), pero después de pagar la persona tiene que iniciar sesión otra vez, y también cada vez que recarga la página.
- **Alternativas:** dejarlo así (más seguro, más incómodo) o que el backend maneje la sesión web con una cookie `HttpOnly` (cómodo y seguro, pero requiere cambios en el backend). No usar `localStorage` para el token.
- **Esfuerzo:** alto (depende del backend).

## Gravedad baja

| # | Hallazgo | Dónde | Esfuerzo |
| --- | --- | --- | --- |
| B1 | El título del error de consulta de pago es fijo y descarta el título según el tipo de error (regla del proyecto) | `src/features/pagos/ConfirmarPagoScreen.tsx:50`, `:75` | Bajo |
| B2 | Indicadores de carga sin `accessibilityLabel` | `src/features/pagos/PagoPasarela.tsx:102`, `:115`; `src/features/pagos/ConfirmarPagoScreen.tsx:85`, `:114` | Bajo |
| B3 | Tocables sin `accessibilityLabel` o sin `accessibilityHint` | `src/components/ui/Desplegable.tsx:124` (sin etiqueta); `src/components/ui/CampoTelefono.tsx:84` (sin ayuda); `src/components/ui/DialogoHost.tsx:52`, `:68` (sin etiqueta propia) | Bajo |
| B4 | Emojis usados como iconos (el lector de pantalla los lee en voz alta y se ven distinto en cada celular) | `src/features/cartera/CarteraPanel.tsx:138`; `src/features/cartera/TableroCartera.tsx:222`; `src/features/cartera/EstadisticasCartera.tsx:167`; `src/features/cartera/ProyeccionCartera.tsx:69`; `src/features/panel/components/PerfilBadge.tsx:22-25`, `:33`; `src/features/panel/components/SelectorSupervision.tsx:27`, `:56`; `src/features/equipo/EquipoAdmin.tsx:394`, `:661`, `:715`; `src/features/productos/ProductosAdmin.tsx:163`; `src/features/agenda/components/TarjetaCita.tsx:110`; `src/features/reservas/components/FormularioReserva.tsx:87`; `src/features/reservas/components/SelectorHoras.tsx:18` | Medio |
| B5 | Opciones mal escritas en el plugin de la barra de navegación: `"Style"` (con mayúscula) se ignora, el plugin lee `style`; `"hidden"` es el texto `"false"` y debería ser el booleano `false` | `app.json:35-38` | Bajo |
| B6 | El mapa (WebView) permite navegar a cualquier origen y no valida que las coordenadas recibidas sean números | `src/features/admin/components/MapaUbicacion.native.tsx:97`, `:85` | Bajo |
| B7 | Se guarda la sesión dentro de una función de `setState` (debe ser pura; puede ejecutarse dos veces) | `src/features/sesion/SesionProvider.tsx:36-42` | Bajo |
| B8 | La sesión guardada se lee con `JSON.parse` sin validar su forma | `src/features/sesion/sesionGuardada.ts:21` | Bajo |
| B9 | Paquetes instalados sin ningún `import` en `src/`: `@expo/ui`, `expo-device`, `expo-glass-effect`, `expo-symbols`, `expo-web-browser` | `package.json:6`, `:11`, `:14`, `:27`, `:29` | Bajo |
| B10 | Sigue el script de la plantilla que mueve o borra `src/` | `package.json:52`; `scripts/reset-project.js` | Bajo |
| B11 | Descarga de reportes con `fetch` propio que repite la lógica de errores y tiempo límite de `http.ts` | `src/features/cartera/exportarReporte.ts:29-46` | Medio |
| B12 | Archivos muy grandes, difíciles de mantener | `src/features/equipo/EquipoAdmin.tsx` (779 líneas); `src/features/bloqueos/BloqueoSemanal.tsx` (717); `src/features/landing/LandingScreen.tsx` (655); `src/features/agenda/components/NuevaCitaHoja.tsx` (634) | Alto |
| B13 | `AGENTS.md` dice Expo SDK 57 y el proyecto usa SDK 58 | `AGENTS.md:3`; `package.json:8` | Bajo |
| B14 | Un número con forma de celular en un documento versionado; confirmar que es inventado (regla: sin teléfonos reales en el repo) | `odd/tasks/telefonos-accesibilidad-suscripcion.md:33` | Bajo |

Nota de mantenimiento: hay 19 `eslint-disable react-hooks/exhaustive-deps` en `src/` (por ejemplo `src/features/clientes/useClientes.ts:89`, `:113` y `src/features/panel/PanelNegocio.tsx:126`, `:134`). No son errores, pero cada uno es un punto donde un efecto puede quedarse con datos viejos.

## Lo que está bien

- Ninguna clave de pasarela en el frontend: la orden y la URL de pago las crea el backend (`src/features/pagos/api.ts:19-20`).
- La referencia de pago la genera el backend con 12 bytes aleatorios y la consulta pública tiene límite de intentos, así que no se puede adivinar.
- El token se guarda cifrado en el celular (`expo-secure-store`) y solo en memoria en la web. No se usa `localStorage`, `sessionStorage` ni cookies.
- Ningún `console.log` escribe tokens, contraseñas ni datos de clientes.
- Las URL de mapa y WhatsApp las arma el backend, no las escribe el negocio.
- Leaflet se carga con verificación de integridad (`MapaUbicacion.native.tsx:20`, `:27`).
- Reglas del proyecto que sí se cumplen: no hay `Alert.alert`, no hay `TextInput` fuera de `CampoTexto`, ninguna pantalla llama `fetch`, no hay texto con `colors.primary`.
- Las animaciones principales respetan "reducir movimiento" (`AnimacionInicio.tsx:178`, `LandingScreen.tsx:178`).
- No se bloquea el tamaño de letra del sistema (no hay `allowFontScaling={false}`).

## Lo que no se revisó

- **`npm audit`:** no se ejecutó (envía la lista de dependencias a un servicio externo). Conviene correrlo a mano.
- **Contraste de colores y tamaño real de los botones (44 x 44 px):** hay que medirlos en un teléfono; no se pueden comprobar leyendo el código.
- **El archivo `.env`:** no se leyó. Solo se confirmó que no existe en la carpeta ni está versionado.
- **El backend:** solo se leyó para confirmar dos hechos de pagos (formato de la referencia y origen de las URL).

## Pendiente de documentación

Este informe todavía no tiene su línea en `docs/README.md` (la auditoría fue de solo lectura).
