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
- **Never modify the backend from this repository.** Frontend changes only.

## Folder structure

```
src/
  app/             Expo Router routes (each file is a screen). Keep them thin: they re-export a feature screen.
    _layout.tsx    root Stack (no header) wrapped in AppProviders
    index.tsx      role selection: "Soy empresa", "Soy cliente", login link (redirects /?codigo=X to /cliente?codigo=X;
                   with a saved session it goes straight to /panel or /admin)
    registro.tsx   -> features/cuenta/RegistroEmpresaScreen (company registration)
    login.tsx      -> login with two modes: staff (usuario) and company account (correo)
    cliente.tsx    -> features/reservas/ClienteScreen (customer booking + public business profile)
    panel.tsx      -> features/panel/PanelScreen (staff panel, staff token)
    admin.tsx      -> features/admin/AdminPanelScreen (company admin panel, account token: same
                   sections as the staff admin plus "Mi negocio")
  features/<name>/ one folder per business area: screen/tab components, components/, hooks, a React
                   context Provider for shared state and an api.ts with its backend calls
                   (admin, agenda, bloqueos, cartera, clientes, cuenta, equipo, inicio, negocio,
                   panel, productos, reservas, servicios, sesion)
  components/      shared UI: ui/ (buttons, inputs, selectors...), layout/ (Pantalla, AppHeader)
  providers/       AppProviders.tsx: global context order (Negocio > Theme > Sesion > Cuenta > RestaurarSesion > Agenda)
  services/api/    config.ts (backend URL), http.ts (fetch wrapper), errores.ts (error -> clear message)
  data/            static data only (paises.ts: phone country codes). No demo businesses or fake clients.
  theme/, constants/, hooks/, types/, utils/
```

Navigation is a single Stack. Both panels render `features/panel/PanelNegocio.tsx`, which switches tabs internally (`components/PanelTabBar.tsx`), not with Expo Router tabs: Agenda, Bloqueos and Cartera for everyone; Clientes and Equipo (team/services/products) for admins; "Mi negocio" only for the account admin.

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
- `src/services/api/http.ts` exports `request<T>(ruta, { method, body, token })`: JSON body, `Authorization: Bearer <token>` when a token is passed, 15 s timeout.
  - Server error (4xx/5xx) -> `ApiError` with the backend `{ error }` message and `status`.
  - Network failure, timeout or non-JSON response -> `ErrorDeConexion`.
  - `mensajeDeError(error, porDefecto)` returns the text to show the user.
- Each feature declares its calls in its own `api.ts` (sesion, cuenta, negocio, agenda, clientes, equipo, servicios, productos, bloqueos, cartera). Add new endpoints the same way; do not call `fetch` from screens.
- Errors: `services/api/errores.ts` `describirError()` turns an error into `{ titulo, mensaje }` (connection, 401 session expired, 402 trial ended, 403 no permission, 409 conflict with a custom title). Panel actions use `features/sesion/useAvisarError.ts`, which also logs out on 401. Booking shows 403 (blacklisted phone) and 409 (busy or blocked slot) with the backend message.
- Photos: `utils/imagenes.ts` `elegirFoto()` (checks JPG/PNG/WEBP and 5 MB like the backend) and `formularioFoto()` (multipart field `foto`).

## Session and token

- Two session types, one at a time: staff (`features/sesion/SesionProvider.tsx`, `useSesion()`, login `POST /api/v1/auth/login`) and account (`features/cuenta/CuentaProvider.tsx`, `useCuenta()`, login `POST /api/v1/cuentas/login`, `rol` `admin` | `cliente`). Logging into one closes the other.
- **The session is persisted** with `expo-secure-store` (`features/sesion/sesionGuardada.ts`, key `sesion`): `iniciarSesion`/`iniciarCuenta` save it, `cerrarSesion`/`cerrarCuenta` delete it. On web there is no secure storage, so it stays in memory only.
- `features/sesion/RestaurarSesionProvider.tsx` reads the saved session when the app opens; screens wait for `useSesionLista().lista` before redirecting. An expired token gets 401 on the first call and the session is closed.
- `features/sesion/usePersonal.ts` gives one view of whoever uses the business panel (`token`, `esAdmin`, `barbero` or null for the account admin, `esCuentaAdmin`). The account admin token works on every staff endpoint as the business admin.
- `features/sesion/useCerrarSesion.ts` closes both sessions, deletes the saved one and clears business and agenda data. The header button "Cerrar sesión" and Android back in a panel use it.
- The panel (`features/panel/useCargarPanel.ts`) loads `GET /api/v1/empresas/actual` and `GET /api/v1/citas/agenda` with that token; login only stores the session.
- Account admin: `/admin` shows trial days (`AvisoPrueba`), the expired-trial screen on 402 (`PruebaVencida`) and "Mi negocio" (profile, photo, client code).
- Roles: `/admin` redirects to `/login` without an account session and to `/cliente` for `rol = cliente`; `/panel` redirects to `/login` without a staff session and to `/admin` for the account admin.
- `request()` sends a `FormData` body as multipart (no JSON `Content-Type`).

## Calendar

- Days come from `utils/fechas.ts` (`diasDelMes`, `crearDia`, `diaDeHoy`) for the real current date; `components/ui/SelectorDias.tsx` owns month navigation (`desde` hides past days in booking).
- `features/bloqueos/BloqueoSemanal.tsx` shows real weeks (from the current one) and manages weekly blocks with `/api/v1/bloqueos` (they repeat every week on that weekday). Booking reads the public blocks (`GET /api/v1/citas/bloqueos`) through `AgendaProvider.cargarOcupacion` and `utils/disponibilidad.ts` never offers those times.
