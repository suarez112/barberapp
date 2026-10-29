# Company registration, free trial, roles and business profile (frontend)

Branch: `feature/registro-empresa`. Delivery: work-unit commits on the branch, then push. Test runner: none requested (the user asked for no automated tests or reviews; verification = lint, typecheck and the app starting without errors).

## Specs

- S1. Initial screen where the user chooses: "Soy empresa" (company registration form wired to `/api/v1/cuentas/...`, all fields and validations), "Soy cliente" (current client flow: business code + booking), and a link for staff that already has an account to log in.
- S2. Free trial: "En el panel de administrador, muestra cuántos días de prueba quedan." "Si el backend responde que la prueba venció, muestra una pantalla indicando que terminó."
- S3. Roles: "el admin entra al panel de administrador y el cliente solo ve su apartado. Un cliente no puede abrir pantallas de admin."
- S4. "Mi negocio" in the admin panel, wired to `/api/v1/admin/...`: view and edit company data, upload or change the business photo with expo-image-picker (preview before saving).
- S5. "En la vista de cliente, muestra la información del negocio con su foto."
- S6. No-backend fixes: calendar shows the real date (current month and days) and allows changing month in agenda, panel and reservations; remove the invented appointments from the agenda start; delete the Expo Explore example screen if unused.
- S7. Do NOT change Clientes, Equipo, Servicios, Productos, Bloqueo semanal, Cartera, Notificaciones; report in a table whether the backend endpoint each would need exists.
- S8. Commit and push the branch; simple summary and a short manual test list.

## Tasks

- [x] T1 (S6) calendar by real month + month navigation, remove mock appointments, delete Explore template — inline — commit dc0a830
- [x] T2 (S1, S3) account session, role selection, company registration, account login, route guards — inline — second commit
- [x] T3 (S2, S4) admin panel: trial banner, expired-trial screen, "Mi negocio" view/edit/photo — inline — second commit
- [x] T4 (S5) public business profile with photo in the client view — inline — second commit
- [x] T5 (S7, S8) endpoint table, docs, commit and push — inline

## Log

- L1 (2026-10-18) User request, verbatim summary of the numbered list above (S1–S8); constraints: frontend only, never modify `agendamiento-backend`; no automated tests or reviews; only verify the app starts without errors.
- L2 Decision: company admins log in with an account token (`/api/v1/cuentas/login`), which the backend does not accept on `/empresas/actual` or `/citas/...`; registration creates no staff user. So the account admin gets its own `/admin` panel and the staff panel `/panel` stays as is.
- L3 Evidence: `npx tsc --noEmit` and `npx expo lint` clean; `npx expo export --platform android --platform web` bundled both platforms and statically rendered /, /registro, /login, /cliente, /panel, /admin; web dev server: home renders with no console errors, /admin without session redirects to /login, /registro renders 14 inputs. Not exercised end-to-end against the backend (no registration was submitted, to avoid creating data).
- L4 S7 finding: the database has tables `productos`, `clientes`, `bloqueos`, `lista_negra`, but the backend exposes no endpoints for them; team and services are read-only via `GET /empresas/actual`; no notifications endpoint or table.
