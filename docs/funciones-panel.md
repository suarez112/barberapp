# Funciones del panel y de las reservas

## Equipo (`features/equipo/EquipoAdmin.tsx`)

Registrar y editar un integrante se hace en `components/ui/VentanaFormulario` (ventana modal: hoja desde abajo en el celular, centrada desde 600 px); la lista no se mueve. La cuenta de la empresa ve arriba un resumen de "Yo también atiendo clientes" (`admin/components/AtiendoClientes`) con "EDITAR MI PERFIL", que abre en otra ventana el interruptor, la foto y la comisión. Desplegable de rol "Administrador / Empleado" (`rol`) e interruptor "Atiende clientes" (`atiendeClientes`). Muestra "Tu equipo: X de N personas del plan Y" desde la suscripción (pasada por `PanelAdministrador` → `PanelNegocio` → `NegocioTab`); cuando está lleno, un aviso con "VER PLANES". Un 409 "Tu equipo ya tiene…" (límite de cupos) muestra el mensaje del backend con "VER PLANES". Agregar o quitar a alguien recarga la suscripción.

## Planes (`features/planes/`)

`GET /api/v1/planes` (Básico 3, Equipo 5, Pro 10 personas; precios del backend). `ListaPlanes` tiene selector Mensual/Anual, marca el plan actual y desactiva planes menores al equipo activo; elegir uno solo dice "Pagos disponibles próximamente". `PlanesModal` lo abre a pantalla completa desde Mi suscripción ("ACTIVAR PLAN AHORA" en la prueba, "CAMBIAR DE PLAN" en otro caso) y desde Equipo. "Mi suscripción" muestra "Plan: Básico · hasta 3 personas" y "Cupo usado: 2 de 3 personas".

## Cartera (`features/cartera/CarteraPanel.tsx`)

- Admins: `TableroCartera` (`GET /api/v1/cartera/resumen?periodo=hoy|semana|mes|rango`, `useResumenCartera`). Filtro Hoy/Semana/Mes/Rango (dos `SelectorDias`, máx. 366 días, limitado a fecha de registro..hoy). El primer filtro se llama "Día" (valor `hoy`).
- Hoy/Semana/Mes tienen flechas atrás/adelante (`cartera/periodoVisible.ts`): el período actual se pide como siempre; uno pasado (o cortado por la fecha de registro, `fechaRegistro` de `/admin/empresa/suscripcion` vía `useFechaRegistro`) se pide como `rango` (nunca después de hoy ni antes del registro); cada flecha se desactiva en su límite y siempre se muestra el rango visible entre ellas.
- Siempre visibles: tarjetas (ventas totales, ganancia del negocio, citas completadas) y barras horizontales de citas por profesional dibujadas con Views (de más a menos); al tocar, el detalle de ese profesional (citas, ventas, ganancia, para el negocio).
- Debajo, `EstadisticasCartera` (solo admin, misma respuesta de `GET /cartera/resumen`) dibuja cada estadística dentro de `components/ui/TarjetaDesplegable` (cerrada por defecto, con título y cifra clave visibles): "Comparado con", ticket promedio, tasa de cancelación, `VentasPorDia` (columnas con Views, sumadas por semana si el período pasa de 31 días), `serviciosMasVendidos`, días y horas más ocupados (`ocupacion`, texto de 12 horas, el más ocupado en negrita), clientes nuevos vs recurrentes y la tabla `PagoProfesionales` (`aPagar` por profesional + total). Con el filtro "Día" no se muestran "Ventas por día" ni los días/horas más ocupados.
- "Comparado con" tiene un desplegable (Período anterior, Mismo período del mes pasado, Mismo período del año pasado, Elegir fechas) que envía `comparar` (+ `compararDesde`/`compararHasta`, máx. 366 días) a `GET /cartera/resumen`; al cambiarlo se mantiene el resumen anterior en pantalla mientras carga el nuevo (`useResumenCartera` `cargando`) y vuelve a "Período anterior" al cambiar el filtro de período. La flecha arriba/abajo y el % salen de `comparacion.variacionPorcentaje` (`null` = "Nuevo", `0` = "Sin cambios"); `comparacion.aviso` se muestra cuando el rango comparado empieza antes del registro del negocio. Gráficos en `cartera/GraficosCartera.tsx`.
- Empleados: `MiCartera` (`GET /cartera`, Diario/Semanal/Mensual con flechas, solo lo suyo). Ambos muestran `ProyeccionCartera` (citas confirmadas del período actual).
- Fechas con `utils/fechas.ts` `fechaConDia`/`textoRango` ("Lun 19 de octubre de 2026", "Lun 19 – Dom 25 de octubre de 2026"), también en el título de la Agenda.
- Reportes (admin, solo Semana / Mes / Rango): `cartera/ReportesCartera.tsx` dibuja "Ocupación", "Servicios más rentables" y "Demanda por día y hora" (mapa de calor) desde `GET /api/v1/reportes/{ocupacion,servicios-rentables,demanda}` (`useReportesCartera`).

## Tarjeta del negocio para clientes (`reservas/components/InfoNegocio.tsx`)

"Código del negocio: X" con Copiar (`expo-clipboard`) y Compartir (`Share` de React Native), y "Cómo llegar" que abre el `googleMapsUrl` del backend (armado con las coordenadas guardadas; oculto si es null). Los invitados que escribieron un código ven "Cambiar de negocio" al final de esta tarjeta (`onCambiarNegocio`); es el único lugar para cambiar de negocio.

## Ubicación en el mapa (`admin/components/UbicacionNegocio.tsx`, en Mi negocio)

Mapa de OpenStreetMap con pin arrastrable (`MapaUbicacion.native.tsx`: Leaflet 1.9.4 desde unpkg con SRI dentro de `react-native-webview`, teselas OSM, sin API key, funciona en Expo Go y en builds; la página se comunica con la app por `postMessage`/`injectJavaScript`; tocar el mapa también mueve el pin; `MapaUbicacion.tsx` es el respaldo web que solo muestra coordenadas). `react-native-maps` se quitó: la app no tiene clave de Google Maps. "Usar mi ubicación actual" (`expo-location`, solo primer plano) observa el GPS con `BestForNavigation` hasta ±25 m o 20 s, guarda la mejor lectura, muestra "Precisión: ±X m" (verde ≤25, ámbar ≤50, rojo más, con aviso) y pone el pin ahí. Nada se envía hasta "Guardar ubicación": `PATCH /admin/empresa` con `latitud` + `longitud` (6 decimales) y `precisionUbicacion` solo cuando el pin es la lectura del GPS (moverlo a mano envía `null`).

## Agenda (`features/agenda/AgendaTab.tsx`)

- Un botón con ícono alterna lista / línea de tiempo (muestra el ícono de la vista a la que cambiará), selector de día (empieza hoy), cajas de resumen (citas sin canceladas, completadas, pendientes) y `components/ui/Chips.tsx` con filtros Todas/Pendientes/Completadas/Canceladas. El título muestra profesional y fecha con día de la semana (`fechaConDia`); el chip de filtro elegido es siempre el amarillo del tema (las etiquetas de estado de cada cita conservan su color).
- `TarjetaCita`: "Marcar completada"/"Cancelar cita" (y "Bloquear"/"Desbloquear" en `TarjetaCliente`) son botones compactos dentro de un área táctil de 44 px; hora grande a la izquierda, nombre/servicio/precio a la derecha, etiqueta de estado coloreada (`ESTADO_CITA`: CONFIRMADA = "Pendiente"), botón de WhatsApp; "Completada por X a las HH:MM" pequeño y gris, con "⚠️ N h después" en línea para admins cuando se registró tarde.

## Clientes (`features/clientes/ClientesTab.tsx`)

Búsqueda por nombre o dígitos del teléfono, chips Todos/Bloqueados (`enListaNegra`), `TarjetaCliente` con nombre, Activo/Inactivo del `estado` del backend (nunca calculado en la app), teléfono con bandera, "Última visita" (o "Próxima cita" si `fechaUltimaCita` es futura), total de citas, fila desplegable "Ver citas" (`HistorialCitas`) y una acción pequeña Bloquear/Desbloquear con confirmación.

## Bloqueos (`features/bloqueos/BloqueoSemanal.tsx`)

- Muestra semanas reales (desde la actual). Solo el admin bloquea: modo "Solo ese día" (`fecha`) o "Cada semana" (`diaSemana`); tocar una hora bloquea/libera, tocar el encabezado de un día bloquea todo el día (`todoElDia`). Los días cerrados ("Cerrado" bajo la fecha) y las horas fuera del `horario` de ese día ("—") están desactivados porque el backend los rechaza; un bloqueo antiguo ya fuera del horario aún se puede liberar. Los mensajes 400 del backend se muestran tal cual. Colores: libre gris, un día rojo X, semanal naranja ↻, cita verde ✓, con leyenda. El personal solo ve sus bloqueos.
- La reserva lee los bloqueos públicos (`GET /api/v1/citas/bloqueos`) con `AgendaProvider.cargarOcupacion` y `utils/disponibilidad.ts` nunca ofrece esas horas.
- Lee `GET /api/v1/bloqueos/calendario?desde&hasta&barberoId` para la semana mostrada: las celdas siguen `intervaloMinutos`, las citas son verdes sobre su inicio/fin real (relleno parcial si cubren parte de una celda) y una celda con cita no se puede bloquear ("Hay una cita en ese horario").

## Refresco automático

`features/panel/RefrescoPanel.tsx` `useRefrescoPanel(refrescar)` lo usan Agenda, Bloqueos, Clientes y Cartera: la pestaña abierta se recarga en silencio al deslizar para refrescar (`Pantalla` `alRefrescar`, errores visibles), al volver la app a primer plano, cada 30 s mientras está abierta y cuando llega un push de cita con la app abierta (`avisosRecibidos` en `NotificacionesProvider`). Una recarga automática fallida conserva lo que había en pantalla.

## Política de cancelación, WhatsApp y citas del cliente

- WhatsApp del negocio (opcional): `CamposEmpresa` recibe un estado de teléfono `whatsapp` (`useTelefono`, con `validarOpcional()` y `cargar(e164)`); registro y "Mi negocio" envían `whatsappContacto` (E.164) + `indicativoWhatsapp`, y un campo vacío lo elimina. "Mi negocio" también edita `anticipacionCancelacionHoras` (0 a 48) y `zonaHoraria` (`data/zonasHorarias.ts`, mismas zonas del backend; un 409 por citas pendientes muestra el mensaje del backend).
- "Mis citas" (`micuenta/MisCitasScreen.tsx`): `puedeCancelar` / `puedeReprogramar` vienen del backend. Pasado el límite, ambos botones se desactivan con "Faltan menos de X horas: contacta directamente al negocio" y, si el perfil público tiene `whatsappUrl`, un botón de WhatsApp. `components/ReprogramarCitaModal.tsx` usa `GET /citas/disponibilidad` y `PATCH /mi-cuenta/citas/:id/reprogramar`; la cita del cliente no trae `servicioId`, así que el servicio se busca por nombre en `GET /empresas/validar/:codigo`.
