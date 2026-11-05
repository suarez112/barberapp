# Sesión, cuentas, consentimiento y notificaciones

## Tipos de sesión

Hay dos, una a la vez: personal (`features/sesion/SesionProvider.tsx`, `useSesion()`) y cuenta (`features/cuenta/CuentaProvider.tsx`, `useCuenta()`, `rol` `admin` | `cliente`). Entrar a una cierra la otra.

- `features/sesion/useIniciarSesion.ts` usa el login único `POST /api/v1/login` (correo o usuario): `tipo: "admin"` abre la sesión de cuenta (`/admin`), `tipo: "cliente"` la de cliente (`/mis-negocios`; guarda `debeAceptarDocumentos` en el usuario guardado), `tipo: "personal"` la de personal (`/panel`). Un 402 para un empleado muestra "Negocio inactivo".
- La tarjeta del panel muestra `nombreAdministradora` del admin (de `GET /api/v1/admin/empresa`), no el correo.
- **La sesión se guarda** con `expo-secure-store` (`features/sesion/sesionGuardada.ts`, clave `sesion`): `iniciarSesion`/`iniciarCuenta` la guardan, `cerrarSesion`/`cerrarCuenta` la borran. En web no hay almacenamiento seguro: queda solo en memoria.
- `features/sesion/RestaurarSesionProvider.tsx` lee la sesión guardada al abrir la app; las pantallas esperan `useSesionLista().lista` antes de redirigir. Un token vencido recibe 401 en la primera llamada y la sesión se cierra.
- `features/sesion/usePersonal.ts` da una vista única de quien usa el panel (`token`, `esAdmin`, `barbero` o null para el admin de la cuenta, `esCuentaAdmin`). El token del admin de la cuenta sirve en todos los endpoints de personal como admin del negocio.
- `features/sesion/useCerrarSesion.ts` cierra ambas sesiones, borra la guardada y limpia datos de negocio y agenda. "Cerrar sesión" en el menú de cabecera y el botón atrás de Android en un panel piden confirmación (`panel/useSalirDelPanel.ts`: `useConfirmarCerrarSesion`, `useSalirDelPanel`).
- El panel (`features/panel/useCargarPanel.ts`) carga `GET /api/v1/empresas/actual` y `GET /api/v1/citas/agenda` con ese token; el login solo guarda la sesión.

## Administradores y suscripción

`features/admin/PanelAdministrador.tsx` (admin de cuenta o de equipo, `useMiEmpresa(token)`): `GET /api/v1/admin/empresa/suscripcion` (funciona aun vencida) alimenta:

- `AvisoSuscripcion` (banner cuando `mostrarRecordatorio`: siempre en la prueba, últimos 7 días de un plan; en la web trae "VER PLAN Y PAGOS", que abre "Plan y pagos", o "VER PLANES" sin pagos manuales; en el celular solo informa);
- "Plan y pagos" (web con pagos manuales, `PagoManual`): no es pestaña. Se abre con la tarjeta de Mi negocio, el banner, los candados o `/pagar` (`pestanaInicial="MI_PLAN"`); `PanelNegocio` lo muestra con "VOLVER A MI NEGOCIO" y marca Mi negocio en el menú. Así el panel tiene como máximo 6 pestañas;
- "Mi suscripción" (`MiSuscripcion`: plan activo muestra "Plan mensual · Activo", fecha de pago, vencimiento, días restantes e "Incluye X días de prueba que te quedaban" de `diasPruebaSumados`; plan y cupos usados; "ACTIVAR PLAN AHORA" en la prueba o "CAMBIAR DE PLAN" abre `planes/PlanesModal`);
- con `estado = "vencida"`, `PanelVencido` ("Planes" con los planes del backend, sin pagos reales, y "Mi negocio").

`hooks/useRefrescoDiario.ts` recarga la suscripción al volver la app a primer plano y a la medianoche de Colombia; un 402 al cargar el panel también la recarga. Los empleados de un negocio vencido ven "Negocio inactivo" (`useCargarPanel` `inactivo`).

## Clientes con cuenta

`features/micuenta/`, `/api/v1/mi-cuenta/...`: negocios guardados y "Mis citas". La reserva (`reservas/hooks/useReserva.ts`) envía el token de cliente, muestra nombre/teléfono de la cuenta en vez de los campos y oculta la casilla de consentimiento salvo que `debeAceptarDocumentos` sea true (se fija al entrar, o cuando `POST /citas` responde 400 "Publicamos una nueva versión…"). Los negocios con `recibiendoReservas: false` muestran "Este negocio no está recibiendo reservas por ahora".

## Consentimiento de datos (`features/legal/`)

- `CasillaAutorizacion` (desmarcada por defecto): texto corto con enlaces a la Política y los Términos siempre visibles; el `AvisoPrivacidad` completo va plegado debajo (aviso corto de `GET /api/v1/legal/aviso-privacidad`, en memoria y guardado en el teléfono como los otros documentos; oculto si no carga). Los botones de registro/confirmar quedan desactivados hasta marcar la casilla.
- Los enlaces abren `DocumentoLegalModal` (`GET /api/v1/legal/politica-datos` y `/terminos`, markdown renderizado por `components/ui/TextoMarkdown.tsx`; 10 s de límite, error con "Reintentar"; el último texto descargado se guarda en el teléfono con `legal/documentosGuardados.ts` (expo-file-system) y se muestra sin conexión).
- Obligatorio en registro de empresa, registro de cliente y reserva como invitado; enviar `ACEPTACION` (`aceptaPoliticaDatos` + `aceptaTerminos` en true).
- Nueva versión de documentos (`legal/ModalNuevaVersion`, montado en `AppProviders`): con cualquier token de sesión llama `GET /api/v1/legal/estado`; `vigente: false` muestra un modal que no se puede cerrar, con los enlaces y la casilla, y `POST /api/v1/legal/aceptar` al aceptar. Un chequeo fallido nunca bloquea al usuario.

## Notificaciones push (`features/notificaciones/`)

`expo-notifications`, backend `PUT/DELETE /api/v1/dispositivos`. **No funcionan en Expo Go ni en web**; requieren un development build con Firebase (FCM V1).

- `nativo.ts` solo carga `expo-notifications` (import dinámico) fuera de Expo Go, así la app abre igual; también fija el handler en primer plano, el canal Android `default` y obtiene el token push de Expo (necesita `extra.eas.projectId`, creado por `eas init`).
- `NotificacionesProvider` (dentro de RestaurarSesion) pide el permiso **solo tras un login** (una sesión restaurada al abrir solo refresca el token, nunca pide), registra el token con el token de sesión y, en `useCerrarSesion`, lo borra **antes** de cerrar la sesión (`desregistrar`, 5 s de límite, errores ignorados).
- `MenuCabecera` muestra "Notificaciones: activadas/desactivadas" cuando hay sesión; la elección se guarda en SecureStore (`preferencia.ts`, clave `notificaciones`) y se revisa el permiso al volver la app a primer plano (p. ej. desde los ajustes del teléfono).
- `ManejadorNotificaciones` (arranque en frío con `getLastNotificationResponseAsync` + listener) lee `data.tipo`/`data.citaId`: `cita_nueva` y `cita_cancelada_por_cliente` abren el panel (`citaPendiente` -> `PanelNegocio` elige la pestaña Agenda, el día y el profesional de esa cita, recarga la agenda una vez si la cita no está, y `TarjetaCita` la muestra resaltada); `cita_cancelada` y `recordatorio` abren `/mis-citas?citaId=X` (tarjeta resaltada). Una alerta de otro tipo de sesión se ignora.
