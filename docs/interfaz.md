# Interfaz: componentes, tema y formularios

## Tema y colores

**Todo color vive en `theme/paleta.ts`** (`crearPaleta` por tema + `COLORES` para rellenos fijos).

- Tema claro: fondo claro, tarjetas blancas, texto/títulos/enlaces en negro o gris oscuro (`primaryText` es oscuro ahí); el amarillo del negocio solo es fondo (botones, pestaña activa = `seleccionBg`/`seleccionTexto`, elementos seleccionados = `cardSelectedBg`) con texto negro.
- Colores de estado, iguales en todas partes: rojo `COLORES.rojo` (bloqueado, error, cancelado, vencido), verde `verde` (activo, completado), naranja `naranja` (aviso), azul `azul` (info y cita pendiente: etiqueta, punto del resumen y chip "Pendientes", en ambos temas), gris `neutro` (inactivo). Como texto: `peligroTexto`/`exitoTexto`/`avisoTexto`/`infoTexto`.
- `Insignia` y los botones de estado eligen texto negro o blanco con `textoSobre()`.
- Variantes de `Boton`: `primario`, `secundario` (colores de tarjeta del tema + borde; reemplaza al antiguo "neutro" negro) y `peligro`.
- Colores en código: `colors.primaryText` (color del negocio ajustado a 4,5:1 sobre el fondo) para texto/íconos; `colors.onPrimary` (negro o blanco) para texto sobre fondo `colors.primary`; `colors.inputBorder` y `colors.error` para campos. Nunca escribir texto con `colors.primary` ni un `#000` fijo.

## Fotos y banderas

- `components/FotoBarbero.tsx`: la foto se recorta centrada (`resizeMode="cover"`); sin foto, las iniciales van sobre `colors.inicialesBg` con `colors.inicialesTexto` (tema claro: círculo gris claro, letra oscura). La insignia de cámara es un círculo blanco con borde y ícono oscuros en ambos temas.
- Banderas de teléfono: imágenes pequeñas (`components/ui/Bandera.tsx`, flagcdn.com por código ISO, cae al código si no carga) porque Windows/web dibujan los emoji de bandera como letras. `TelefonoConBandera` muestra un teléfono guardado; `utils/telefonos.ts` `telefonoMostrado()` da `{ pais, texto }`. `AvisoPrivacidad` empieza plegado ("Ver aviso de privacidad").

## Diálogos

Nunca usar `Alert.alert`. Usar `utils/dialogos.ts`: `avisar(titulo, mensaje?, tipo)` (`exito` | `error` | `aviso`, botón Aceptar) y `confirmar({ titulo, mensaje, destructivo? })` (Aceptar/Cancelar, devuelve boolean). `components/ui/DialogoHost.tsx`, montado una vez en `AppProviders`, los muestra de a uno con el estilo del modal de confirmación de reserva.

## Formularios y accesibilidad

- `components/ui/CampoTexto.tsx` es la base de todo campo: `etiqueta` visible arriba (obligatoria), `placeholder` solo como ejemplo ("ej: ejemplo@gmail.com"), `ayuda` (accessibilityHint), `error` en rojo bajo el campo y anunciado, `obligatorio` agrega " *". Caja de al menos 48 px; slots `izquierda`/`derecha`. `style` es el contenedor, `estiloTexto` el texto escrito.
- `centrado`: texto centrado (códigos de negocio) con el cursor también centrado (Android pone el cursor al inicio de un placeholder centrado, así que el ejemplo se oculta mientras el campo vacío tiene foco).
- Siempre el `keyboardType` correcto (`email-address`, `phone-pad`, `numeric`/`number-pad`) y `autoComplete` + `textContentType`.
- La validación devuelve un mensaje por campo que dice qué corregir (`cuenta/formulario/validarEmpresa.ts`: `Errores<K>`, `sinErrores`, `hayErrores`; `hooks/useFormularioEdicion.ts` tiene `errores`/`setErrores`). Cambiar un campo limpia su error. `utils/dialogos.ts` `avisarCamposConError()` solo indica mirar los campos rojos.
- `components/ui/Boton.tsx` exige `ayuda` (accessibilityHint); la etiqueta por defecto es el título en minúsculas de oración para que TalkBack no deletree mayúsculas. `BotonIcono` exige `etiqueta`. Todo elemento tocable lleva `accessibilityLabel` + `accessibilityHint` y al menos 44 x 44 px.
- `components/ui/CampoClave.tsx`: todo campo de contraseña (ojo para mostrar/ocultar, placeholder de ejemplo). `requisitos` muestra bajo una contraseña nueva la lista en vivo de `utils/clave.ts` (`REQUISITOS_CLAVE`: 8+ caracteres, mayúscula, minúscula, número, especial; `claveValida`/`MENSAJE_CLAVE` son la misma regla que `claveNueva` del backend) con un check verde cada una. `confirmaDe={clave}` en el campo de confirmación usa el placeholder "Confirma tu contraseña", bloquea copiar/pegar solo en ese campo (`contextMenuHidden` + ignora texto que entra de golpe) y muestra "Coinciden / No coinciden" al escribir.
- `components/ui/CampoTelefono.tsx` + `hooks/useTelefono.ts`: todo campo de teléfono. Bandera + selector de país (Colombia por defecto, lista con búsqueda de `data/paises.ts`), formatea al escribir (Colombia: `(300) 000-0000`, placeholder "ej: (300) 123-4567"; otros países: su formato nacional y un ejemplo de libphonenumber); escribir o pegar "+52 …" cambia el país. `validar()` devuelve `{ telefono, indicativo }` en E.164 o fija el error del campo; eso es lo que se envía al backend. Reglas en `utils/telefonos.ts` (`libphonenumber-js/max`, mismo `normalizarTelefono` del backend).
- `components/ui/CampoPrecio.tsx` + `utils/formato.ts` `leerPrecio()`: los precios muestran puntos de miles al escribir ("35.000") y se envían como pesos enteros (35000). Nunca `Number("35.000")` (da 35).
- `components/ui/Desplegable.tsx`: lista en modal (`buscable` agrega búsqueda; las listas sin búsqueda abren desplazadas a la opción elegida). Se usa para duración del servicio, empleados, departamento, municipio y horas.
- `components/layout/Pantalla.tsx` usa `keyboardShouldPersistTaps="handled"`, así botones y opciones de desplegables (los modales reciben toques por este ScrollView) funcionan al primer toque con el teclado abierto.

## Teléfonos en la app

Llegan en E.164 (`+573000000000`) desde la migración 011 del backend. Se muestran con `utils/telefonos.ts` `telefonoConBandera()` (p. ej. "🇨🇴 +57 300 000 0000") y los enlaces de WhatsApp se arman con `numeroParaWhatsApp()`; ambos manejan E.164 y números antiguos solo con dígitos (nunca anteponer el indicativo a un número que empieza con `+`).

## Calendario

- Los días salen de `utils/fechas.ts` (`diasDelMes`, `crearDia`, `diaDeHoy`) con la fecha real; `components/ui/SelectorDias.tsx` maneja la navegación por mes (`desde`/`hasta` ocultan días fuera del rango y desactivan las flechas) y, al abrir o cambiar de mes, se desplaza para dejar visible hoy (o el día elegido). La reserva permite desde hoy hasta 14 días después en hora de Colombia (`hoyColombiaISO`, `DIAS_MAXIMOS_RESERVA`), como el backend.
- Cada día tiene su horario (`Empresa.horario`, 0 = domingo … 6 = sábado); `utils/disponibilidad.ts` `horarioDelDia()` no ofrece horas en días cerrados.
