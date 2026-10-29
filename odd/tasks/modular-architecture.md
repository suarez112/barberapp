# Modular architecture refactor

Objective: split the 4146-line `src/app/index.tsx` monolith into feature modules, shared UI, services and routes without changing user-visible behavior.
Branch: `refactor/modular-architecture` (baseline `ccaed27`). Delivery: ask-on-risk. Test runner: none in project (verification = `tsc --noEmit`, `expo lint`, Android emulator smoke test against `agendamiento-backend`).

## Specs

- S1 — "Usando buenas practicas haz que la aplicación sea mas mantenible y modular para que sea escalable al largo plazo". Interpreted scope: feature-based (screaming) folders, typed domain models (no `any` for citas/días), a single HTTP client, theme via context instead of a recomputed `colors` object, reusable UI atoms, Expo Router routes per screen. Existing behavior and copy must be preserved.
- S2 — "Utiliza un emulador para verificar los cambios en un dispositivo real, corre los procesos necesarios para lanzar este emulador si no está disponible a la primers." Verify on the `Pixel_7_Pro` AVD.
- S3 — "Utiliza y corre el backend ubicado en agendamiento-backend". App must talk to the running backend from the emulator.
- S4 (assumption) — Lint must run (AGENTS.md: "Run lint and typecheck before declaring any task done"); ESLint is not installed, so it is added as a dev dependency.

## Tasks

- [x] T1 — S1: core layer (domain types, API config + HTTP client + endpoint modules, theme provider, utils, shared UI atoms). Route: inline. Commit `9c1a4dd`.
- [x] T2 — S1: state providers per domain (negocio, sesión, agenda, clientes, notificaciones). Route: inline. Commit `9c1a4dd`.
- [x] T3 — S1: client flow as routes (`/`, `/cliente`) with reservation feature components/hooks. Route: inline. Commit `5335e07`.
- [x] T4 — S1: login + panel (`/login`, `/panel`) with agenda, clientes, negocio, bloqueos, cartera tabs as feature components. Route: inline. Commit `5335e07`.
- [x] T5 — S4: ESLint setup + lint clean. Route: inline. Commit `014692f`.
- [x] T6 — S2, S3: emulator smoke test (role select, code entry, booking, login, panel tabs). Route: inline. Evidence in L4.

Route evidence: one parent session, units depend on each other (shared types/providers), no Writer trigger reason.

## Log

- L1 (2026-10-17) — User request: "Usando buenas practicas haz que la aplicación sea mas mantenible y modular para que sea escalable al largo plazo / Utiliza un emulador para verificar los cambios en un dispositivo real, corre los procesos necesarios para lanzar este emulador si no está disponible a la primers. / Utiliza y corre el backend ubicado en agendamiento-backend / Audita el código actual y ayudame a encontrar puntos de mejora para optimizar mi app, usando las skills /vercel-react-best-practices y"
- L2 — Baseline: uncommitted WIP committed as `ccaed27` on the feature branch. `tsc` passes; `expo lint` fails (eslint missing). Backend already listening on :4000 with DB OK. Engram MCP unavailable this session: mirror pending.
- L3 — Discovery: backend business id is `emp_1` while local mock `EMPRESAS_DB` uses `infinity`, so the old link mode (`?codigo=`) would POST appointments with a wrong `empresaId`. Link mode now resolves the business through the API.
- L4 — Emulator verification (Pixel_7_Pro, Expo Go, backend on :4000): role screen; client code entry `INFINITY` (button and keyboard Enter); booking Jhon Álvarez · Corte Clásico · LUN 19 · 08:30 AM → "¡Cita confirmada!" and row present in `/api/v1/citas/ocupadas`; Android back bug found (business stayed active on role screen) and fixed with `useFocusEffect`, re-verified; login `jhon/1234`; agenda shows the booking; "Cancelar cita" → CANCELADA and slot freed in backend; tabs Bloqueos/Clientes/Cartera/Negocio render; service "Tinte" created; logout returns to login; deep link `exp://…/--/?codigo=INFINITY` opens the business without back arrow nor "Cambiar Código".
- L5 — Checks: `npx tsc --noEmit` exit 0; `npx expo lint` exit 0 (4 pre-existing react-hooks errors fixed). Lockfile diff: 258 packages added, 0 versions changed.
- L6 — Risk: item 6 (no automated tests cover the refactored UI) and item 5 (new dev dependencies). Independent verifier launched; native review due (`high_risk`).
- L7 — Independent verifier: no blockers; S1 and S4 pass. Advisories fixed in `d70920f` (Android back on panel asks to log out, non-JSON → connection error, invalid date guard, non-dismissable confirms, Tocable press feedback, release env var documented). Re-verified on emulator: back on panel → "Cerrar Sesión" dialog, Cancelar stays, confirm returns to login. `tsc` and `expo lint` exit 0.
- L8 — Native review: preflight STATUS → START returned consent envelope (risk medium, 91 files) for range `ccaed27..d70920f`; awaiting user decision.
