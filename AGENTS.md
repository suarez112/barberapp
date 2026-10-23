This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

---

# Project guide — agendamiento app (frontend)

Barbershop booking app (Expo SDK 57, React Native 0.86, Expo Router, TypeScript). **This repository is only the frontend.**

## Backend

- Lives in `C:\Users\eduar_9\agendamiento-backend` (Express + PostgreSQL, port `4000`, routes under `/api/v1`).
- Its endpoints, request/response contracts and error messages are documented in `C:\Users\eduar_9\agendamiento-backend\AGENTS.md`. Read it before wiring a new call.
- **Never modify the backend from this repository.** Frontend changes only. You may read its `AGENTS.md` and code; when the backend changed, read its recent commits first.

## Working rules (every thread)

- The backend is already running on port 4000 (`npm run dev`) and Expo is already running (`npx expo start`). Use them; **never start or stop them**.
- **Do not use the Android emulator.** The user tests the visual part on their phone.
- To verify a change: make sure the app compiles (`npx tsc --noEmit`, `npx expo lint`; if Metro is not reachable, `npx expo export --platform android --output-dir <temp dir outside the repo>`, then delete that dir), and call the backend endpoints used by the changed screens (e.g. with `curl`) to confirm that what the app sends matches what the backend expects.
- Test data you create must start with "PRUEBA" (names, codes, users) and must be deleted when you finish.
- Do not write automated tests and do not request reviews unless the user asks.
- Explain what you did in plain, simple language. Commit and push only when the user asks.

## Folder structure

```
src/
  app/             Expo Router routes (each file is a screen). Keep them thin: they re-export a feature screen.
    _layout.tsx    root Stack (no header) wrapped in AppProviders
    index.tsx      role selection: "Soy empresa", "Soy cliente", login link with the small gray line "Negocios, equipos de trabajo y clientes registrados" below it (redirects /?codigo=X to /cliente?codigo=X;
                   with a saved session it goes straight to /panel, /admin or /mis-negocios)
    registro.tsx   -> features/cuenta/RegistroEmpresaScreen (company registration; form in cuenta/formulario/)
    login.tsx      -> single login: "Correo o usuario" + password (POST /api/v1/login), link "¿Olvidaste tu contraseña?"
    recuperar-clave.tsx -> features/sesion/RecuperarClaveScreen (step 1: email -> POST /cuentas/solicitar-recuperacion,
                   same message whether the account exists or not; step 2: 6-digit code + new password ->
                   POST /cuentas/restablecer-contrasena, then /login). Staff without email ask their admin
    cliente.tsx    -> features/reservas/ClienteScreen (customer booking + public business profile). Without a business:
                   "Continuar como invitado" (code) or "Crear cuenta / Iniciar sesión"; a client with a session
                   is sent to /mis-negocios. /cliente?codigo=X (web link, QR, "Mis negocios") opens the business directly
    cuenta-cliente.tsx -> features/cuenta/CuentaClienteScreen (client login with "¿Olvidaste tu contraseña?" -> /recuperar-clave,
                   + optional client registration)
    mis-negocios.tsx   -> features/micuenta/MisNegociosScreen (saved businesses: add by code, remove, open to book)
    mis-citas.tsx      -> features/micuenta/MisCitasScreen (appointments booked with the client session)
    panel.tsx      -> features/panel/PanelScreen (staff panel, staff token; a member with role
                   admin gets features/admin/PanelAdministrador, an employee PanelNegocio)
    superadmin.tsx -> WEB ONLY platform-owner panel (features/superadmin/SuperadminScreen). The import is guarded with
                   `process.env.EXPO_OS === "web"`, which Metro resolves at build time: the Android/iOS bundles do not contain
                   the panel (checked by exporting both and searching the text) and /superadmin there redirects to "/".
                   A `superadmin.web.tsx` would NOT work: Expo Router bundles every file under src/app on every platform
    admin.tsx      -> features/admin/AdminPanelScreen (company account, account token) ->
                   features/admin/PanelAdministrador (PanelNegocio + subscription banner + "Mi negocio";
                   expired subscription: PanelVencido with only "Planes" and "Mi negocio")
  config/app.ts    APP_NOMBRE (name shown in the intro animation, header, "Acerca de" and the superadmin panel; "Agendality" and the slogan `APP_LEMA`) and CONTACTO (`correo` of the developer shown in Help > "Contacto"; an empty value hides the section)
  features/cuenta/formulario/ business form shared by registration and "Mi negocio": CamposEmpresa (code with live availability,
                   department/municipality from GET /api/v1/ubicaciones, schedule as 7 rows with Abierto/Cerrado switch and
                   opening/closing dropdowns, "Copiar el horario del lunes a todos los días" = `copiarLunes`), validarEmpresa
  features/<name>/ one folder per business area: screen/tab components, components/, hooks, a React
                   context Provider for shared state and an api.ts with its backend calls
                   (admin, agenda, bloqueos, cartera, clientes, cuenta, equipo, inicio, legal, micuenta,
                   negocio, notificaciones, panel, productos, reservas, servicios, sesion, superadmin)
  components/      shared UI: ui/ (buttons, inputs, selectors...), layout/ (Pantalla, AppHeader: fixed 56 px bar, business name and a menu
                   icon that opens MenuCabecera, a bottom sheet with "Tema claro/oscuro" and, with `onSalir`, "Cerrar sesión")
  providers/       AppProviders.tsx: global context order (Negocio > Theme > Sesion > Cuenta > RestaurarSesion > Agenda)
  services/api/    config.ts (backend URL), http.ts (fetch wrapper), errores.ts (error -> clear message)
  data/            static data only (paises.ts: every country libphonenumber-js knows, ISO code + Spanish name, Colombia first, then A-Z). No demo businesses or fake clients.
  theme/, constants/, hooks/, types/, utils/
```

Navigation is a single Stack. Both panels render `features/panel/PanelNegocio.tsx`, which switches tabs internally (`components/PanelTabBar.tsx`), not with Expo Router tabs: every admin (company account or team member with role `admin`) sees the same tabs: Agenda, Bloqueos, Clientes, Cartera, Equipo (team/services/products) and Mi negocio; an employee (role `empleado`) only sees Agenda and Cartera (their own).

## Running the app

```bash
npm install
npx expo start        # then press a (Android), w (web) or scan the QR with Expo Go
npx expo lint
npx tsc --noEmit
```

Start the backend first (`npm run dev` in the backend folder) so API calls work.

## Backend URL and API calls

- `src/services/api/config.ts` resolves `API_BASE_URL` in this order:
  1. `EXPO_PUBLIC_API_URL` environment variable (see `.env.example`);
  2. web: `http://localhost:4000`;
  3. the IP of the Expo dev server (`Constants.expoConfig.hostUri`) on port 4000, so a physical phone reaches the PC;
  4. fallback: `http://10.0.2.2:4000` on the Android emulator, `http://localhost:4000` elsewhere.
- `src/services/api/http.ts` exports `request<T>(ruta, { method, body, token, signal, tiempoLimiteMs })`: JSON body, `Authorization: Bearer <token>` when a token is passed, 15 s timeout by default. The timeout rejects the call itself (Promise.race), not only the abort: expo/fetch reads the body with the native `text()`, which ignores `abort()`, so a stalled read would otherwise wait forever.
  - `signal` cancels the request on purpose (e.g. leaving a screen): it throws `PeticionCancelada` (`esCancelada(e)`), which is **never shown** to the user. Screen loads get it from `hooks/useSenalDeSalida.ts` (aborts on unmount). expo/fetch reports both a timeout and a cancel as "fetch failed: Fetch request has been canceled"; `request()` tells them apart itself.
  - Server error (4xx/5xx) -> `ApiError` with the backend `{ error }` message and `status`.
  - Network failure, timeout or non-JSON response -> `ErrorDeConexion`.
  - `mensajeDeError(error, porDefecto)` returns the text to show the user.
- Each feature declares its calls in its own `api.ts` (sesion, cuenta, negocio, agenda, clientes, equipo, servicios, productos, bloqueos, cartera). Add new endpoints the same way; do not call `fetch` from screens.
- Errors: `request()` throws `ApiError` (server answered), `ErrorDeConexion` with `motivo` `sin-conexion` | `tiempo-agotado` | `respuesta-invalida`, or `ErrorDeEnvio` (the app could not build the request, e.g. an unreadable file; never reported as "no connection"). `services/api/errores.ts` `describirError()` turns any of them into `{ titulo, mensaje }`. **The title always comes from the error type, never from the screen**, so title and message match: no connection, timeout, 401 "Sesión vencida" (login passes `tituloNoAutorizado: "Datos incorrectos"`), 402 "Suscripción vencida" or "Negocio inactivo" for employees, 403 "Sin permiso", 404 "No encontrado", 409 "No disponible" (or `tituloConflicto`), 413 file too large, 429, 5xx "Error del servidor"; the screen `titulo` is only used for 400 (validation) and an unknown app error shows "Algo salió mal". Never pass a `porDefecto` that guesses the cause (e.g. "wrong password"); `registrarCausa()` logs the non-server cause with `console.log` (never `console.error` for connection failures: in development it opens Expo's red screen with the technical text) and skips cancelled requests. Panel actions use `features/sesion/useAvisarError.ts`, which also logs out on 401. Booking shows 403 (blacklisted phone or business not receiving bookings) and 409 (busy or blocked slot) with the backend message.
- Photos: `utils/imagenes.ts` `elegirFoto()` (checks JPG/PNG/WEBP and 5 MB like the backend) and `formularioFoto()` (multipart field `foto`). On Android/iOS the part is `new File(uri)` from `expo-file-system`: the SDK 57 global `fetch` is `expo/fetch`, which rejects the old React Native `{ uri, name, type }` part with "Unsupported FormDataPart implementation". Uploads get a 60 s timeout.

## UI building blocks

- Theme and colors: **every color lives in `theme/paleta.ts`** (`crearPaleta` per theme + `COLORES` for fixed fills). Light theme = light background, white cards, text/titles/links in black or dark gray (`primaryText` is dark there); the business yellow is only a background (buttons, active tab = `seleccionBg`/`seleccionTexto`, selected items = `cardSelectedBg`) with black text. Status colors are the same everywhere: red `COLORES.rojo` (blocked, error, cancelled, expired), green `verde` (active, completed), orange `naranja` (warning), blue `azul` (info and a pending cita: tag, summary dot and "Pendientes" chip, in both themes), gray `neutro` (inactive); as text use `peligroTexto`/`exitoTexto`/`avisoTexto`/`infoTexto`. `Insignia` and status buttons pick black or white text with `textoSobre()`. `Boton` variants: `primario`, `secundario` (theme card colors + border, replaces the old black "neutro") and `peligro`.
- Team photos (`components/FotoBarbero.tsx`): the photo is cropped centered (`resizeMode="cover"`); without one, the initials sit on `colors.inicialesBg` with `colors.inicialesTexto` (light theme: light gray circle, dark letter).
- Phone flags are small images (`components/ui/Bandera.tsx`, flagcdn.com by ISO code, falls back to the code if it cannot load) because Windows/web draw flag emoji as letters. `TelefonoConBandera` shows a saved phone; `utils/telefonos.ts` `telefonoMostrado()` gives `{ pais, texto }`. `AvisoPrivacidad` starts folded ("Ver aviso de privacidad").
- Dialogs: never call `Alert.alert`. Use `utils/dialogos.ts`: `avisar(titulo, mensaje?, tipo)` (`exito` | `error` | `aviso`, button Aceptar) and `confirmar({ titulo, mensaje, destructivo? })` (Aceptar/Cancelar, resolves to a boolean). `components/ui/DialogoHost.tsx`, mounted once in `AppProviders`, renders them one at a time with the booking-confirmation modal style.
- Form fields (accessibility rules for every form):
  - `components/ui/CampoTexto.tsx` is the base of every field: visible `etiqueta` above (required prop), `placeholder` only as an example ("ej: ejemplo@gmail.com"), `ayuda` (accessibilityHint), `error` shown in red under the field and announced, `obligatorio` adds " *". Box at least 48 px tall; `izquierda`/`derecha` slots for adornments. `style` is the container, `estiloTexto` the typed text.
  - Always set the right `keyboardType` (`email-address`, `phone-pad`, `numeric`/`number-pad`) and `autoComplete` + `textContentType`.
  - Validation returns one message per field that says what to fix (`cuenta/formulario/validarEmpresa.ts`: `Errores<K>`, `sinErrores`, `hayErrores`; `hooks/useFormularioEdicion.ts` has `errores`/`setErrores`). Changing a field clears its error. `utils/dialogos.ts` `avisarCamposConError()` only tells the user to look at the red fields.
  - `components/ui/Boton.tsx` requires `ayuda` (accessibilityHint); the label defaults to the title in sentence case so TalkBack does not spell capitals. `BotonIcono` needs `etiqueta`. Every touchable needs `accessibilityLabel` + `accessibilityHint` and at least 44 x 44 px.
  - Colors: `colors.primaryText` (business color adjusted to 4.5:1 on the background) for text/icons, `colors.onPrimary` (black or white) for text on a `colors.primary` background, `colors.inputBorder` and `colors.error` for fields. Never write text with `colors.primary` or a fixed `#000`.
- `components/ui/CampoClave.tsx`: every password field (eye icon to show/hide, example placeholder by default). `requisitos` shows under a new password the live list from `utils/clave.ts` (`REQUISITOS_CLAVE`: 8+ characters, uppercase, lowercase, number, special; `claveValida`/`MENSAJE_CLAVE` are the same rule as the backend `claveNueva`) with a green check each; `confirmaDe={clave}` on the confirmation field uses the placeholder "Confirma tu contraseña", blocks copy/paste only in that field (`contextMenuHidden` + ignores text that enters at once) and shows "Coinciden / No coinciden" while typing.
- `CampoTexto` `centrado`: centered text (business codes) with the cursor centered too (Android puts the cursor at the start of a centered placeholder, so the example hides while the empty field is focused).
- `components/ui/CampoTelefono.tsx` + `hooks/useTelefono.ts`: every phone field. Flag + country picker (Colombia by default, searchable list from `data/paises.ts`), formats while typing (Colombia: `(316) 278-1393`, placeholder "ej: (300) 123-4567"; other countries: their national format and a libphonenumber example), typing or pasting "+52 …" switches the country. `validar()` returns `{ telefono, indicativo }` in E.164 or sets the field error; send that to the backend. Rules in `utils/telefonos.ts` (`libphonenumber-js/max`, same `normalizarTelefono` as the backend).
- `components/ui/CampoPrecio.tsx` + `utils/formato.ts` `leerPrecio()`: prices show thousands dots while typing ("35.000") and are sent as whole pesos (35000). Never use `Number("35.000")` (that is 35).
- `components/ui/Desplegable.tsx`: dropdown in a modal (`buscable` adds a search box; lists without search open scrolled to the chosen option). Used for service duration, employees, department, municipality and hours.
- `components/layout/Pantalla.tsx` uses `keyboardShouldPersistTaps="handled"`, so buttons and dropdown options (modals receive touches through this ScrollView) work on the first tap with the keyboard open.

## Session and token

- Two session types, one at a time: staff (`features/sesion/SesionProvider.tsx`, `useSesion()`) and account (`features/cuenta/CuentaProvider.tsx`, `useCuenta()`, `rol` `admin` | `cliente`). Logging into one closes the other.
- `features/sesion/useIniciarSesion.ts` uses the single login `POST /api/v1/login` (email or username): `tipo: "admin"` opens the account session (`/admin`), `tipo: "cliente"` the client account session (`/mis-negocios`, keeps `debeAceptarDocumentos` in the saved user), `tipo: "personal"` the staff session (`/panel`). A 402 for an employee shows "Negocio inactivo".
- The panel card shows the admin's `nombreAdministradora` (from `GET /api/v1/admin/empresa`), not the email.
- **The session is persisted** with `expo-secure-store` (`features/sesion/sesionGuardada.ts`, key `sesion`): `iniciarSesion`/`iniciarCuenta` save it, `cerrarSesion`/`cerrarCuenta` delete it. On web there is no secure storage, so it stays in memory only.
- `features/sesion/RestaurarSesionProvider.tsx` reads the saved session when the app opens; screens wait for `useSesionLista().lista` before redirecting. An expired token gets 401 on the first call and the session is closed.
- `features/sesion/usePersonal.ts` gives one view of whoever uses the business panel (`token`, `esAdmin`, `barbero` or null for the account admin, `esCuentaAdmin`). The account admin token works on every staff endpoint as the business admin.
- `features/sesion/useCerrarSesion.ts` closes both sessions, deletes the saved one and clears business and agenda data. "Cerrar sesión" in the header menu and Android back in a panel ask for confirmation first (`panel/useSalirDelPanel.ts`: `useConfirmarCerrarSesion`, `useSalirDelPanel`).
- The panel (`features/panel/useCargarPanel.ts`) loads `GET /api/v1/empresas/actual` and `GET /api/v1/citas/agenda` with that token; login only stores the session.
- Admins (`features/admin/PanelAdministrador.tsx`, account or team admin, `useMiEmpresa(token)`): `GET /api/v1/admin/empresa/suscripcion` (works even when expired) drives `AvisoSuscripcion` (banner when `mostrarRecordatorio`: always in the trial, last 7 days of a plan), the "Mi suscripción" section (`MiSuscripcion`: active plan shows "Plan mensual · Activo", payment date, due date, days left and "Incluye X días de prueba que te quedaban" from `diasPruebaSumados`; plan and seats used; "ACTIVAR PLAN AHORA" in the trial or "CAMBIAR DE PLAN" opens `planes/PlanesModal`) and, with `estado = "vencida"`, `PanelVencido` ("Planes" with the backend plans, no real payments, and "Mi negocio"). `hooks/useRefrescoDiario.ts` reloads the subscription when the app returns to the foreground and at Colombia midnight; a 402 from the panel load also reloads it. Employees of an expired business see "Negocio inactivo" (`useCargarPanel` `inactivo`).
- Clients with an account (`features/micuenta/`, `/api/v1/mi-cuenta/...`): saved businesses and "Mis citas". Booking (`reservas/hooks/useReserva.ts`) sends the client token, shows the account name/phone instead of the fields, and hides the consent checkbox unless `debeAceptarDocumentos` is true (set at login, or when POST /citas answers 400 "Publicamos una nueva versión…"). Businesses with `recibiendoReservas: false` show "Este negocio no está recibiendo reservas por ahora".
- Data consent (`features/legal/`): `CasillaAutorizacion` (unchecked by default; above it `AvisoPrivacidad` shows the short privacy notice from GET /api/v1/legal/aviso-privacidad, kept in memory and saved in the phone like the other documents, hidden if it cannot be loaded) with links that open `DocumentoLegalModal` (GET /api/v1/legal/politica-datos and /terminos, markdown rendered by `components/ui/TextoMarkdown.tsx`; 10 s limit, error with "Reintentar"; the last downloaded text is saved in the phone by `legal/documentosGuardados.ts` with expo-file-system and shown when there is no connection). Required in company registration, client registration and guest booking; send `ACEPTACION` (`aceptaPoliticaDatos` + `aceptaTerminos` true).
- Notificaciones push (`features/notificaciones/`, `expo-notifications`, backend `PUT/DELETE /api/v1/dispositivos`): they **do not work in Expo Go** (nor on web); they need a development build with Firebase (FCM V1). `nativo.ts` only loads `expo-notifications` (dynamic import) outside Expo Go, so the app still opens there; it also sets the foreground handler, the Android channel `default` and gets the Expo push token (needs `extra.eas.projectId`, created by `eas init`). `NotificacionesProvider` (inside RestaurarSesion) asks the permission **only after a login** (a session restored at app start just refreshes the token, never asks), registers the token with the session token and, in `useCerrarSesion`, deletes it **before** the session is closed (`desregistrar`, 5 s limit, errors ignored). The header menu (`MenuCabecera`) shows "Notificaciones: activadas/desactivadas" when there is a session; the choice is saved in SecureStore (`preferencia.ts`, key `notificaciones`) and it re-checks the permission when the app returns to the foreground (e.g. from the phone settings). `ManejadorNotificaciones` (cold start with `getLastNotificationResponseAsync` + listener) reads `data.tipo`/`data.citaId`: `cita_nueva` and `cita_cancelada_por_cliente` open the panel (`citaPendiente` -> `PanelNegocio` picks the Agenda tab, the day and the professional of that cita, reloads the agenda once if the cita is not there, and `TarjetaCita` shows it highlighted); `cita_cancelada` and `recordatorio` open `/mis-citas?citaId=X` (card highlighted). An alert for another kind of session is ignored.
- Equipo (`features/equipo/EquipoAdmin.tsx`): role dropdown "Administrador / Empleado" (`rol`) and switch "Atiende clientes" (`atiendeClientes`). Shows "Tu equipo: X de N personas del plan Y" from the subscription (passed down by `PanelAdministrador` → `PanelNegocio` → `NegocioTab`); when full, a warning with "VER PLANES". A 409 "Tu equipo ya tiene…" (plan seat limit) shows the backend message with "VER PLANES". Adding or removing someone reloads the subscription.
- Plans (`features/planes/`): `GET /api/v1/planes` (Básico 3, Equipo 5, Pro 10 people; prices from the backend). `ListaPlanes` has a Mensual/Anual selector, marks the current plan and disables plans smaller than the active team; choosing one only says "Pagos disponibles próximamente". `PlanesModal` opens it full screen from Mi suscripción ("ACTIVAR PLAN AHORA" in the trial, "CAMBIAR DE PLAN" otherwise) and from Equipo. "Mi suscripción" shows "Plan: Básico · hasta 3 personas" and "Cupo usado: 2 de 3 personas".
- Cartera (`features/cartera/CarteraPanel.tsx`): admins get `TableroCartera` (`GET /api/v1/cartera/resumen?periodo=hoy|semana|mes|rango`, `useResumenCartera`): period filter Hoy/Semana/Mes/Rango (two `SelectorDias`, max 366 days, limited to registration date..today). Hoy/Semana/Mes have back/forward arrows (`cartera/periodoVisible.ts`): the current period is requested as before; a past one (or one cut by the registration date, `fechaRegistro` from `/admin/empresa/suscripcion` via `useFechaRegistro`) is requested as `rango` (never after today, never before registration); each arrow is disabled at its limit and the visible range is always shown between them; cards (ventas totales, ganancia del negocio, citas completadas), horizontal bars of appointments per professional drawn with plain Views (most to least) and, on tap, that professional's detail (citas, ventas, ganancia, para el negocio). Employees keep `MiCartera` (`GET /cartera`, Diario/Semanal/Mensual with arrows, only their own). Both show `ProyeccionCartera` (confirmed appointments of the current period). The first filter is labelled "Día" (value `hoy`). Dates use `utils/fechas.ts` `fechaConDia`/`textoRango` ("Lun 19 de octubre de 2026", "Lun 19 – Dom 25 de octubre de 2026"), also in the Agenda title. The three summary cards and the professional bars are always visible. Below them, `EstadisticasCartera` (admin only, same `GET /cartera/resumen` response) draws every statistic inside a `components/ui/TarjetaDesplegable` (closed by default, title + key figure always visible): "Comparado con", ticket promedio, cancellation rate, `VentasPorDia` (plain-View columns, summed by week when the period has more than 31 days), `serviciosMasVendidos`, busiest days and hours (`ocupacion`, 12-hour text, busiest one bold), new vs recurring clients and the `PagoProfesionales` table (`aPagar` per professional + total). With the "Día" filter, "Ventas por día" and the busiest days/hours are not shown. "Comparado con" has a dropdown (Período anterior, Mismo período del mes pasado, Mismo período del año pasado, Elegir fechas) that sends `comparar` (+ `compararDesde`/`compararHasta`, max 366 days) to `GET /cartera/resumen`; changing it keeps the previous summary on screen while the new one loads (`useResumenCartera` `cargando`) and it goes back to "Período anterior" when the period filter changes. The up/down arrow and % come from `comparacion.variacionPorcentaje` (`null` = "Nuevo", `0` = "Sin cambios"); `comparacion.aviso` is shown when the compared range starts before the business registration. Charts live in `cartera/GraficosCartera.tsx`.
- Business card for clients (`reservas/components/InfoNegocio.tsx`): "Código del negocio: X" with Copiar (`expo-clipboard`) and Compartir (React Native `Share`), and "Cómo llegar" that opens the backend `googleMapsUrl` (built from the saved coordinates when there are any; hidden when null). Guests who typed a code get "Cambiar de negocio" at the bottom of this card (`onCambiarNegocio`); it is the only place to change business.
- Map location (`admin/components/UbicacionNegocio.tsx`, in Mi negocio): an OpenStreetMap map with a draggable pin (`MapaUbicacion.native.tsx`: Leaflet 1.9.4 from unpkg with SRI inside `react-native-webview`, OSM tiles, no API key, works in Expo Go and in builds; the page talks to the app with `postMessage`/`injectJavaScript`; tapping the map also moves the pin; `MapaUbicacion.tsx` is the web fallback that only shows the coordinates). `react-native-maps` was removed: the app has no Google Maps key. "Usar mi ubicación actual" (`expo-location`, foreground only) watches the GPS with `BestForNavigation` until ±25 m or 20 s, keeps the best reading, shows "Precisión: ±X m" (green ≤25, amber ≤50, red above, with a warning) and puts the pin there. Nothing is sent until "Guardar ubicación": `PATCH /admin/empresa` with `latitud` + `longitud` (6 decimals) and `precisionUbicacion` only when the pin is the GPS reading (moving it by hand sends `null`).
- Agenda (`features/agenda/AgendaTab.tsx`): one icon button switches list / timeline (it shows the icon of the view it will switch to), day selector (starts today), summary boxes (citas without cancelled, completadas, pendientes) and `components/ui/Chips.tsx` filter Todas/Pendientes/Completadas/Canceladas. The title shows the professional and the date with its weekday (`fechaConDia`); the selected filter chip is always the theme yellow (the status tags of each cita keep their color). `TarjetaCita`: "Marcar completada"/"Cancelar cita" (and "Bloquear"/"Desbloquear" in `TarjetaCliente`) are compact buttons inside a 44 px tall touch area; big hour on the left, name/service/price on the right, colored status tag (`ESTADO_CITA`: CONFIRMADA = "Pendiente"), WhatsApp button; "Completada por X a las HH:MM" small and gray, with an inline "⚠️ N h después" for admins when it was registered late.
- Clientes (`features/clientes/ClientesTab.tsx`): search by name or phone digits, chips Todos/Bloqueados (`enListaNegra`), `TarjetaCliente` with name, Activo/Inactivo from the backend `estado` (never computed in the app), phone with flag, "Última visita" (or "Próxima cita" when `fechaUltimaCita` is in the future), total citas, a "Ver citas" expandable row (`HistorialCitas`) and a small Bloquear/Desbloquear action with confirmation.
- Phones arrive in E.164 (`+573001234567`) since backend migration 011. Show them with `utils/telefonos.ts` `telefonoConBandera()` ("🇨🇴 +57 316 278 1393") and build WhatsApp links with `numeroParaWhatsApp()`; both handle E.164 and old digit-only numbers (never prepend the country code to a number that starts with `+`).
- Roles: `/admin` redirects to `/login` without an account session and to `/cliente` for `rol = cliente`; `/mis-negocios` and `/mis-citas` redirect to `/cliente` without a client session; `/panel` redirects to `/login` without a staff session and to `/admin` for the account admin.
- `request()` sends a `FormData` body as multipart (no JSON `Content-Type`).

## Intro and help

- `app/index.tsx` shows `inicio/AnimacionInicio` (logo + name, ~1.8 s, once per app launch) and then the role selection; with a saved session it redirects straight to the panel with no animation.
- The header menu (`MenuCabecera`) has "Ayuda" -> `/ayuda` (`features/ayuda/AyudaScreen`): PQRS (`/pqrs`, `features/pqrs`: form as guest or with the account token, `POST /api/v1/pqrs`, plus "Mis solicitudes" from `GET /api/v1/pqrs/mias` with radicado and status, account sessions only), a simple "Contacto" section (`CONTACTO.correo` from `config/app.ts` and a button that opens `mailto:`; there is no developer screen any more), "Acerca de" (`/acerca-de`: version from app.json, Política de datos and Términos) and, with an account session, "Eliminar mi cuenta" (confirm, password, final confirm, `POST /api/v1/cuentas/eliminar`; a 409 asks whether to close the business too and retries with `eliminarNegocio: true`). A wrong password is a 401 there and must not close the session.
- No payment texts in registration or login; in Planes the plan buttons read "PAGOS DISPONIBLES PRÓXIMAMENTE".

## Calendar

- Days come from `utils/fechas.ts` (`diasDelMes`, `crearDia`, `diaDeHoy`) for the real current date; `components/ui/SelectorDias.tsx` owns month navigation (`desde`/`hasta` hide days outside the range and disable the arrows) and, when it opens or the month changes, scrolls so today (or the selected day) is visible. Booking allows today through 14 days later in Colombia time (`hoyColombiaISO`, `DIAS_MAXIMOS_RESERVA`), like the backend.
- Each day has its own schedule (`Empresa.horario`, 0 = Sunday … 6 = Saturday); `utils/disponibilidad.ts` `horarioDelDia()` offers no hours on closed days.
- `features/bloqueos/BloqueoSemanal.tsx` shows real weeks (from the current one). Only the admin blocks: mode "Solo ese día" (`fecha`) or "Cada semana" (`diaSemana`); tapping an hour blocks/frees it, tapping a day header blocks the whole day (`todoElDia`). Closed days ("Cerrado" under the date) and hours outside that day's `horario` ("—") are disabled, because the backend rejects them; an older block already outside the schedule can still be freed. Backend 400 messages are shown as they come. Colors: free gray, one day red X, weekly orange ↻, appointment green ✓, with a legend. Staff only see their blocks. Booking reads the public blocks (`GET /api/v1/citas/bloqueos`) through `AgendaProvider.cargarOcupacion` and `utils/disponibilidad.ts` never offers those times.

## Superadmin panel (web only, `/superadmin`)

- `features/superadmin/`: `SuperadminScreen` (login or panel), `LoginSuperadmin` (correo, contraseña and the 6-digit authenticator code, `POST /api/v1/superadmin/login`), `PanelSuperadmin` (desktop side menu: Inicio, Negocios, PQRS, Actividad, theme toggle, "Cerrar sesión"; icons only under 900 px), one file per section (`InicioSuperadmin`, `NegociosSuperadmin` + `DetalleNegocio`, `PqrsSuperadmin` + `DetallePqrs`, `ActividadSuperadmin`), `api.ts` (all calls under `/api/v1/superadmin`), `useCargar.ts` (loads a list with the token; keeps the previous data while the next page loads) and `components/` (`Tabla`, `Paginacion`, `ModalAccion`, `AccionNegocioModal`, `Ficha`, `EstadoCarga`, `Encabezado`).
- The superadmin token (1 hour) lives **only in memory** (`SuperadminProvider`): it is never saved with SecureStore or the browser storage, so reloading the page asks for the login again. A 401 closes the session (`cerrarSiVencio` / `avisarError`).
- Estimated income (`IngresosSuperadmin`, below the Inicio charts, `GET /api/v1/superadmin/ingresos`): two `GraficoColumnas` (SVG, web) cards, last 12 months and per year, with the best month and best year (`mejorMes`/`mejorAnio`) drawn at full color, in bold and repeated in text. It is the sum of plan prices at each activation, not real payments, so both cards carry the "ESTIMADO" badge and the backend `nota`.
- Business actions: Activar plan (periodo + optional team plan + optional motivo), Extender prueba (1-365 days; only shown while `suscripcion.estadoGuardado` is `trial`), Suspender / Reactivar (motivo required, plus a final `confirmar`). The backend writes each one in the audit log.
- Never show customer names or phones here: the backend only returns counts for a business.
- The panel has no account creation: the superadmin is created in the backend with `npm run dev:crear-superadmin -- correo`.

## Auto refresh and blocks table

- `features/panel/RefrescoPanel.tsx` `useRefrescoPanel(refrescar)` is used by Agenda, Bloqueos, Clientes and Cartera: the open tab reloads silently on pull-to-refresh (`Pantalla` `alRefrescar`, errors shown), when the app returns to the foreground, every 30 s while open and when a push for a cita arrives with the app open (`avisosRecibidos` in `NotificacionesProvider`). A failed automatic reload keeps what was on screen.
- Bloqueos (`bloqueos/BloqueoSemanal.tsx`) reads `GET /api/v1/bloqueos/calendario?desde&hasta&barberoId` for the shown week: cells follow `intervaloMinutos`, appointments are green over their real start/end (partial fill when they cover part of a cell) and a cell with a cita cannot be blocked ("Hay una cita en ese horario").
- `FotoBarbero` camera badge: white circle with dark border and icon in both themes.

## Theme, splash and documents (added)

- Theme: `theme/ThemeProvider.tsx` keeps `preferencia` (`sistema` default | `claro` | `oscuro`, saved in SecureStore by `theme/preferenciaTema.ts`; memory only on web). "Tema" in `MenuCabecera` lists the three options. The native splash (`app.json` expo-splash-screen: `assets/logo.png`, light/dark background) stays until the saved theme is read.
- Intro (`inicio/AnimacionInicio`, 1.8 s): logo with soft glow, name, slogan and a spinner. In Expo Go the native splash/icon are Expo's own (SDK 52+), only the intro shows; the splash and icon from `app.json` appear only in a development/installed build.
- Consent (`legal/CasillaAutorizacion`): short text with links to the Política and Términos always visible; full `AvisoPrivacidad` folded below. The register / confirm buttons stay disabled until the box is checked.
- New document version (`legal/ModalNuevaVersion`, mounted in `AppProviders`): with any session token it calls `GET /api/v1/legal/estado`; `vigente: false` shows a modal that cannot be dismissed, with the document links and the checkbox, and `POST /api/v1/legal/aceptar` on accept. A failed check never blocks the user.

## Cancellation policy, WhatsApp contact and admin reports (added)

- Business WhatsApp (optional): `CamposEmpresa` takes a `whatsapp` phone state (`useTelefono`, with `validarOpcional()` and `cargar(e164)`); registration and "Mi negocio" send `whatsappContacto` (E.164) + `indicativoWhatsapp`, and an empty field removes it. "Mi negocio" also edits `anticipacionCancelacionHoras` (0 to 48) and `zonaHoraria` (`data/zonasHorarias.ts`, same zones as the backend; a 409 for pending appointments shows the backend message).
- "Mis citas" (`micuenta/MisCitasScreen.tsx`): `puedeCancelar` / `puedeReprogramar` come from the backend. Past the limit both buttons are disabled with "Faltan menos de X horas: contacta directamente al negocio" and, when the public profile has `whatsappUrl`, a WhatsApp button. `components/ReprogramarCitaModal.tsx` uses `GET /citas/disponibilidad` and `PATCH /mi-cuenta/citas/:id/reprogramar`; the client cita has no `servicioId`, so the service is found by name in `GET /empresas/validar/:codigo`.
- Cartera (admin, Semana / Mes / Rango only): `cartera/ReportesCartera.tsx` draws "Ocupación", "Servicios más rentables" and "Demanda por día y hora" (heat map) from `GET /api/v1/reportes/{ocupacion,servicios-rentables,demanda}` (`useReportesCartera`).
