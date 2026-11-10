# Pagos del plan con Wompi (solo web)

En Android e iOS no hay precios ni pagos: las pantallas de esta página redirigen a `/` fuera de la web. Los pagos manuales (Nequi, Bre-B, QR y comprobante por WhatsApp) ya no existen en la app ni en el backend.

## Flujo

1. `/pagar` (`features/pagos/PagarScreen.tsx` → `PagoPasarela.tsx`). Desde Planes ("PAGAR MI PLAN" cierra la ventana de planes y navega) llega `/pagar?profesionales=<n>&periodo=<mensual|anual>`: si ambos son válidos, la pantalla solo confirma (resumen + PAGAR). Entrando directo (correo, "INTENTAR OTRA VEZ", aviso antiguo) o con parámetros inválidos, el administrador elige profesionales (1 a 10) y periodo con los valores por defecto. En los dos casos el mínimo son los que ya atienden (`profesionalesCobrados`) y el máximo `maximoProfesionales`. El precio sale de `GET /api/v1/planes`.
2. `POST /api/v1/pagos/ordenes` con `{ profesionales, periodo }`. La respuesta 201 trae `urlPago` y la app abre esa dirección (checkout de Wompi). Errores que se muestran con el mensaje del servidor: 409 (menos profesionales de los que atienden, o negocio cancelado), 403 (negocio suspendido) y 503 (pagos sin configurar).
3. Wompi vuelve a `<URL_PAGOS>/<referencia>?id=<transacción>`. En la app esa ruta es `src/app/pagar/[referencia].tsx` → `ConfirmarPagoScreen.tsx`, así que `URL_PAGOS` del backend es **`https://agendality.com/pagar`**.
4. La pantalla llama `GET /api/v1/pagos/ordenes/:referencia/estado?id=...` (público, sin sesión). Responde `aprobado`, `pendiente` o `rechazado`. Si está pendiente reintenta sola con esperas crecientes (unos 50 s en total) y luego deja un botón para consultar a mano.
5. Aprobado: "IR A MI PANEL" abre el panel, que vuelve a pedir la suscripción. Rechazado: "INTENTAR OTRA VEZ" vuelve a `/pagar` y crea una orden nueva (el backend no limita las órdenes de Wompi por negocio).

Estados de una orden: `pendiente`, `aprobada`, `rechazada` y `anulada`. Ya no hay "Pendiente de verificación" ni `motivoRevision`. Los avisos `pago_aprobado` y `pago_rechazado` ya no llegan, pero los antiguos se siguen mostrando en la campana.

## Probar en local con el sandbox de Wompi

Lo que cambia es la configuración del backend (sus variables van solo en su `.env`, nunca en este repo):

- `PROVEEDOR_PAGO=wompi`, las cuatro llaves `WOMPI_*` de **pruebas** (`pub_test_…`, `prv_test_…`, `test_events_…`, `test_integrity_…`) y `NODE_ENV=development`.
- `URL_PAGOS` con la dirección donde abres la web en tu PC más `/pagar`, por ejemplo `http://localhost:8081/pagar`.
- El webhook de Wompi es opcional para probar: al volver, la pantalla ya le pregunta el estado al backend, que lo confirma con Wompi. Para probarlo hace falta una URL pública hacia `/api/v1/pagos/webhook`.
