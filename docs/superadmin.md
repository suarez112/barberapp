# Panel superadmin (solo web, `/superadmin`)

## Cómo está aislado de móvil

`src/app/superadmin.tsx` importa el panel protegido con `process.env.EXPO_OS === "web"`, que Metro resuelve al compilar: los bundles de Android/iOS no contienen el panel (comprobado exportando ambos y buscando el texto) y `/superadmin` allí redirige a `/`. Un `superadmin.web.tsx` NO serviría: Expo Router incluye todo archivo de `src/app` en todas las plataformas.

## Estructura (`features/superadmin/`)

- `SuperadminScreen` (login o panel), `LoginSuperadmin` (correo, contraseña y código de 6 dígitos del autenticador, `POST /api/v1/superadmin/login`).
- `PanelSuperadmin`: menú lateral en escritorio (Inicio, Negocios, PQRS, Actividad, cambio de tema, "Cerrar sesión"; solo íconos bajo 900 px).
- Un archivo por sección: `InicioSuperadmin`, `NegociosSuperadmin` + `DetalleNegocio`, `PqrsSuperadmin` + `DetallePqrs`, `ActividadSuperadmin`.
- `api.ts` (todas las llamadas bajo `/api/v1/superadmin`), `useCargar.ts` (carga una lista con el token y conserva los datos previos mientras llega la siguiente página) y `components/` (`Tabla`, `Paginacion`, `ModalAccion`, `AccionNegocioModal`, `Ficha`, `EstadoCarga`, `Encabezado`).

## Sesión

El token del superadmin (1 hora) vive **solo en memoria** (`SuperadminProvider`): nunca se guarda con SecureStore ni en el almacenamiento del navegador, así que recargar la página pide el login de nuevo. Un 401 cierra la sesión (`cerrarSiVencio` / `avisarError`).

## Ingresos estimados

`IngresosSuperadmin`, bajo los gráficos de Inicio (`GET /api/v1/superadmin/ingresos`): dos tarjetas `GraficoColumnas` (SVG, web), últimos 12 meses y por año, con el mejor mes y el mejor año (`mejorMes`/`mejorAnio`) a todo color, en negrita y repetidos en texto. Es la suma de precios de plan en cada activación, no pagos reales: ambas tarjetas llevan la insignia "ESTIMADO" y la `nota` del backend.

## Acciones sobre negocios

Activar plan (período + plan de equipo opcional + motivo opcional), Extender prueba (1-365 días; solo visible mientras `suscripcion.estadoGuardado` es `trial`), Suspender / Reactivar (motivo obligatorio más un `confirmar` final). El backend registra cada una en el log de auditoría.

## Reglas de datos

- Nunca mostrar nombres ni teléfonos de clientes aquí: el backend solo devuelve conteos por negocio.
- El panel no crea cuentas: el superadmin se crea en el backend con `npm run dev:crear-superadmin -- <correo>`.
