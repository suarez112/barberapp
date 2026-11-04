# Arquitectura y estructura del proyecto

App de agendamiento para barberías (Expo SDK 57, React Native 0.86, Expo Router, TypeScript). Este repositorio es solo el frontend.

## Backend

- Está en la carpeta hermana `agendamiento-backend` (Express + PostgreSQL, puerto `4000`, rutas bajo `/api/v1`).
- Sus endpoints, contratos y mensajes de error están en el `AGENTS.md` de esa carpeta.
- Backend y Expo ya corren en desarrollo (`npm run dev` y `npx expo start`).

## Comandos

```bash
npm install
npx expo start        # luego a (Android), w (web) o el QR con Expo Go
npx expo lint
npx tsc --noEmit
```

## Carpetas

```
src/
  app/             Rutas de Expo Router (cada archivo es una pantalla). Delgadas: reexportan una pantalla de features.
  config/app.ts    APP_NOMBRE, APP_LEMA y CONTACTO (correo del desarrollador en Ayuda > "Contacto"; vacío oculta la sección)
  features/<área>/ Una carpeta por área: pantallas/tabs, components/, hooks, un Provider de contexto y api.ts
                   (admin, agenda, bloqueos, cartera, clientes, cuenta, equipo, inicio, legal, micuenta,
                   negocio, notificaciones, panel, productos, reservas, servicios, sesion, superadmin)
  features/cuenta/formulario/  formulario de negocio compartido por registro y "Mi negocio": CamposEmpresa (código con
                   disponibilidad en vivo, departamento/municipio de GET /api/v1/ubicaciones, horario en 7 filas con
                   Abierto/Cerrado y desplegables, "Copiar el horario del lunes a todos los días" = `copiarLunes`), validarEmpresa
  components/      UI compartida: ui/ (botones, campos, selectores), layout/ (Pantalla, AppHeader: barra fija de 56 px con
                   nombre del negocio e ícono de menú que abre MenuCabecera: "Tema" y, con `onSalir`, "Cerrar sesión")
  providers/       AppProviders.tsx: orden de contextos (Negocio > Theme > Sesion > Cuenta > RestaurarSesion > Agenda)
  services/api/    config.ts (URL del backend), http.ts (fetch), errores.ts (error -> mensaje claro)
  data/            solo datos estáticos (paises.ts: países de libphonenumber-js, Colombia primero y luego A-Z). Sin negocios ni clientes de ejemplo.
  theme/, constants/, hooks/, types/, utils/
```

## Rutas (`src/app/`)

| Ruta | Pantalla | Notas |
| --- | --- | --- |
| `_layout.tsx` | Stack raíz sin cabecera, envuelto en AppProviders | Navegación: un solo Stack |
| `index.tsx` | Selección de rol: "Soy empresa", "Soy cliente", enlace a login con la línea gris "Negocios, equipos de trabajo y clientes registrados" | Redirige `/?codigo=X` a `/cliente?codigo=X`. Con sesión guardada va a `/panel`, `/admin` o `/mis-negocios` |
| `registro.tsx` | `features/cuenta/RegistroEmpresaScreen` | Registro de empresa |
| `login.tsx` | Login único: "Correo o usuario" + contraseña (`POST /api/v1/login`) | Enlace "¿Olvidaste tu contraseña?" |
| `recuperar-clave.tsx` | `features/sesion/RecuperarClaveScreen` | Paso 1: correo -> `POST /cuentas/solicitar-recuperacion` (mismo mensaje exista o no la cuenta). Paso 2: código de 6 dígitos + nueva contraseña -> `POST /cuentas/restablecer-contrasena`, luego `/login`. El personal sin correo pide ayuda a su administrador |
| `cliente.tsx` | `features/reservas/ClienteScreen` | Reserva del cliente y perfil público. Sin negocio: "Continuar como invitado" (código) o "Crear cuenta / Iniciar sesión"; un cliente con sesión va a `/mis-negocios`. `/cliente?codigo=X` (enlace web, QR, "Mis negocios") abre el negocio directo |
| `cuenta-cliente.tsx` | `features/cuenta/CuentaClienteScreen` | Login de cliente (con "¿Olvidaste tu contraseña?" -> `/recuperar-clave`) y registro opcional |
| `mis-negocios.tsx` | `features/micuenta/MisNegociosScreen` | Negocios guardados: agregar por código, quitar, abrir para reservar |
| `mis-citas.tsx` | `features/micuenta/MisCitasScreen` | Citas reservadas con la sesión de cliente |
| `panel.tsx` | `features/panel/PanelScreen` (token de personal) | Un miembro con rol admin recibe `features/admin/PanelAdministrador`; un empleado, `PanelNegocio` |
| `admin.tsx` | `features/admin/AdminPanelScreen` (token de cuenta) | -> `PanelAdministrador` (PanelNegocio + banner de suscripción + "Mi negocio"; con suscripción vencida: `PanelVencido` solo con "Planes" y "Mi negocio") |
| `superadmin.tsx` | `features/superadmin/SuperadminScreen` | SOLO WEB (ver [superadmin.md](superadmin.md)) |

Ambos paneles renderizan `features/panel/PanelNegocio.tsx`, que cambia de pestaña internamente (`components/PanelTabBar.tsx`), no con tabs de Expo Router. Todo admin (cuenta de empresa o miembro con rol `admin`) ve Agenda, Bloqueos, Clientes, Cartera, Equipo (equipo/servicios/productos) y Mi negocio; un empleado (rol `empleado`) solo ve Agenda y Cartera (las suyas).

Roles y redirecciones: `/admin` va a `/login` sin sesión de cuenta y a `/cliente` si `rol = cliente`; `/mis-negocios` y `/mis-citas` van a `/cliente` sin sesión de cliente; `/panel` va a `/login` sin sesión de personal y a `/admin` para el admin de la cuenta.

## Intro y ayuda

- `app/index.tsx` muestra primero `inicio/AnimacionInicio` (una vez por arranque, también con sesión guardada) y luego la selección de rol, o redirige al panel si hay sesión guardada. Orden: splash nativo (logo sobre negro) -> intro -> selección de rol / panel.
- Intro (2,4 s, siempre oscura, colores fijos): un valor compartido de Reanimated `t` maneja capas estáticas de `react-native-svg` (chispa + rayos + partículas, anillos giratorios, nubes + rayos alrededor del logo) y una barra dorada "Cargando..." con chispa en la punta. Imagen de referencia: `docs/referencias/intro-referencia.png`. Con "reducir movimiento" solo muestra el logo con un brillo suave (1,4 s). En Expo Go el splash y el ícono son los de Expo; solo se ve la intro.
- El menú de cabecera (`MenuCabecera`) tiene "Ayuda" -> `/ayuda` (`features/ayuda/AyudaScreen`): PQRS (`/pqrs`, `features/pqrs`: formulario como invitado o con token de cuenta, `POST /api/v1/pqrs`, más "Mis solicitudes" de `GET /api/v1/pqrs/mias` con radicado y estado, solo con sesión de cuenta), "Contacto" (`CONTACTO.correo` y botón `mailto:`), "Acerca de" (`/acerca-de`: versión de app.json, Política de datos y Términos) y, con sesión de cuenta, "Eliminar mi cuenta" (confirmar, contraseña, confirmación final, `POST /api/v1/cuentas/eliminar`; un 409 pregunta si cerrar también el negocio y reintenta con `eliminarNegocio: true`). Una contraseña incorrecta ahí es 401 y no debe cerrar la sesión.
- Sin textos de pago en registro ni login; en Planes los botones dicen "PAGOS DISPONIBLES PRÓXIMAMENTE".

## Tema

`theme/ThemeProvider.tsx` guarda `preferencia` (`sistema` por defecto | `claro` | `oscuro`, en SecureStore con `theme/preferenciaTema.ts`; solo memoria en web). "Tema" en `MenuCabecera` lista las tres opciones. El splash nativo (`app.json`, expo-splash-screen: `assets/logo.png`, fondo claro/oscuro) se mantiene hasta leer el tema guardado.
