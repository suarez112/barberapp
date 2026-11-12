import Cuadricula from "@/components/layout/Cuadricula";
import { useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Switch, Text, View } from "react-native";
import FotoBarbero from "@/components/FotoBarbero";
import Boton from "@/components/ui/Boton";
import BotonesFormulario from "@/components/ui/BotonesFormulario";
import BotonIcono from "@/components/ui/BotonIcono";
import CampoTexto from "@/components/ui/CampoTexto";
import CampoClave from "@/components/ui/CampoClave";
import { claveValida, MENSAJE_CLAVE } from "@/utils/clave";
import Desplegable from "@/components/ui/Desplegable";
import { estilosTexto } from "@/components/ui/estilosTexto";
import TarjetaFila from "@/components/ui/TarjetaFila";
import TituloSeccion from "@/components/ui/TituloSeccion";
import VentanaFormulario from "@/components/ui/VentanaFormulario";
import { useFormularioEdicion } from "@/hooks/useFormularioEdicion";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { ApiError } from "@/services/api/http";
import { Barbero, RolEquipo } from "@/types";
import { avisar, avisarCamposConError, confirmar } from "@/utils/dialogos";
import { useNegocio } from "../negocio/NegocioProvider";
import { useSesion } from "../sesion/SesionProvider";
import { useAvisarError } from "../sesion/useAvisarError";
import { Personal } from "../sesion/usePersonal";
import {
  actualizarProfesional,
  cambiarYoAtiendo,
  crearProfesional,
  eliminarProfesional,
  subirFotoProfesional,
} from "./api";
import { FotoElegida } from "@/utils/imagenes";
import { Suscripcion } from "../cuenta/api";
import FuncionBloqueada from "../planes/FuncionBloqueada";
import { AVISO_SIN_REEMBOLSO, calcularCargoNuevo, textoCargoNuevo } from "../planes/cobro";
import { useFunciones } from "../planes/funcionesContexto";
import PlanesModal from "../planes/PlanesModal";
import PrivacidadTelefonos from "./PrivacidadTelefonos";
import { useYoAtiendo } from "./useYoAtiendo";
import { PAGOS_EN_APP } from "@/config/pagos";
import IconoEnLinea from "@/components/ui/IconoEnLinea";

const ROLES = [
  { valor: "admin", etiqueta: "Administrador" },
  { valor: "empleado", etiqueta: "Empleado" },
] as const;

// Igual que el backend: un empleado atiende clientes por defecto; un administrador no
const atiendePorDefecto = (rol: RolEquipo) => rol === "empleado";

type Campos = {
  nombre: string;
  usuario: string;
  clave: string;
  especialidad: string;
  porcentaje: string;
  rol: RolEquipo;
  atiendeClientes: boolean;
};

const VACIO: Campos = {
  nombre: "",
  usuario: "",
  clave: "",
  especialidad: "",
  porcentaje: "",
  rol: "empleado",
  atiendeClientes: true,
};
const PORCENTAJE_POR_DEFECTO = 50;

const rolDe = (b: Barbero): RolEquipo => b.rol ?? (b.esAdmin ? "admin" : "empleado");

const aCampos = (b: Barbero): Campos => ({
  nombre: b.nombre,
  usuario: b.usuario,
  clave: "",
  especialidad: b.especialidad,
  porcentaje: b.porcentajeGanancia.toString(),
  rol: rolDe(b),
  atiendeClientes: b.atiendeClientes ?? atiendePorDefecto(rolDe(b)),
});

// 409 del backend cuando el negocio ya tiene el máximo de profesionales
const esEquipoLleno = (e: unknown) =>
  e instanceof ApiError && e.status === 409 && /hasta \d+ profesionales/i.test(e.message);

type Props = {
  personal: Personal;
  // Plan y cupo del equipo (null mientras carga)
  suscripcion: Suscripcion | null;
  // Se agregó o retiró a alguien: hay que volver a consultar el cupo
  onEquipoCambiado?: () => void;
};

export default function EquipoAdmin({ personal, suscripcion, onEquipoCambiado }: Props) {
  const { colors } = useAppTheme();
  const { barberos, setBarberos } = useNegocio();
  const { actualizarBarberoLogueado } = useSesion();
  const avisarError = useAvisarError();
  const { incluida, planes } = useFunciones();
  // Roles y comisiones son del plan Equipo en adelante; sin ellas esos campos no se envían
  const puedeRoles = incluida("roles");
  const puedeComisiones = incluida("comisiones");
  const { abierto, alternar, enEdicion, campos, cambiar, errores, setErrores, editar, reiniciar } =
    useFormularioEdicion(VACIO, aCampos);
  const [verPlanes, setVerPlanes] = useState(false);
  const [guardando, setGuardando] = useState(false);
  // Evita dos guardados seguidos (dos toques rápidos llegan antes de que cambie el estado)
  const guardandoRef = useRef(false);
  const token = personal.token;
  const soyYo = (id: string) => personal.barbero?.id === id;

  // Cuenta de administración (la de correo): es la primera fila de la lista. Su perfil de
  // profesional solo existe si alguna vez activó "Yo también atiendo clientes".
  const cuentaAdmin = !!personal.esCuentaAdmin;
  const yo = useYoAtiendo(token, cuentaAdmin);
  const [editandoMiPerfil, setEditandoMiPerfil] = useState(false);
  const miPerfilId = yo.estado?.barberoId ?? null;
  const miPerfil = miPerfilId ? (barberos.find((b) => b.id === miPerfilId) ?? yo.estado?.perfil ?? null) : null;
  const atiendoYo = yo.estado?.atiendeClientes ?? false;
  // Los demás, con quien usa la app (un integrante administrador) primero
  const otros = barberos
    .filter((b) => b.id !== miPerfilId)
    .sort((a, b) => Number(soyYo(b.id)) - Number(soyYo(a.id)));

  // Cierra la ventana y vacía el formulario
  const cerrar = () => {
    reiniciar();
    setEditandoMiPerfil(false);
  };

  // Agrega o reemplaza al profesional en la lista (agenda y reservas quedan al día)
  const reflejar = (b: Barbero) =>
    setBarberos((prev) => (prev.some((x) => x.id === b.id) ? prev.map((x) => (x.id === b.id ? b : x)) : [...prev, b]));

  const editarMiPerfil = () => {
    if (!yo.estado) return;
    const base: Barbero = miPerfil ?? {
      id: "",
      nombre: personal.nombre,
      usuario: "",
      esAdmin: true,
      rol: "admin",
      especialidad: "",
      porcentajeGanancia: PORCENTAJE_POR_DEFECTO,
    };
    editar({ ...base, atiendeClientes: atiendoYo });
    setEditandoMiPerfil(true);
  };

  // Reemplaza al integrante en la lista (y en la sesión si es quien está usando la app)
  const reemplazar = (b: Barbero) => {
    setBarberos((prev) => prev.map((x) => (x.id === b.id ? b : x)));
    if (soyYo(b.id)) actualizarBarberoLogueado(b);
  };

  const guardar = async () => {
    if (guardandoRef.current) return;
    guardandoRef.current = true;
    setGuardando(true);
    try {
      await (editandoMiPerfil ? guardarMiPerfil() : validarYGuardar());
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  };

  const validarYGuardar = async () => {
    const clave = campos.clave.trim();
    const pct = campos.porcentaje.trim() ? Number(campos.porcentaje) : PORCENTAJE_POR_DEFECTO;
    const nuevos = {
      ...(!campos.nombre.trim() ? { nombre: "Escribe el nombre del integrante." } : {}),
      ...(!campos.usuario.trim() ? { usuario: "Escribe el usuario con el que entrará a la app." } : {}),
      ...(!enEdicion && !clave
        ? { clave: "Escribe una contraseña nueva." }
        : clave && !claveValida(clave)
          ? { clave: MENSAJE_CLAVE }
          : {}),
      ...(puedeComisiones && (isNaN(pct) || pct < 0 || pct > 100)
        ? { porcentaje: "Escribe un número de 0 a 100, por ejemplo 50." }
        : {}),
    };
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      avisarCamposConError();
      return;
    }

    // Antes de guardar: si suma un profesional al cobro, mostrar cuánto; si lo quita, avisar que no hay reembolso
    const sumaCobro = campos.atiendeClientes && (!enEdicion || enEdicion.atiendeClientes === false);
    const restaCobro = !campos.atiendeClientes && !!enEdicion && enEdicion.atiendeClientes !== false;
    if (!PAGOS_EN_APP) {
      // En el celular no se habla de cobros
    } else if (sumaCobro) {
      const cobro =
        planes && suscripcion
          ? textoCargoNuevo(calcularCargoNuevo(planes, suscripcion, suscripcion.profesionalesCobrados))
          : "Esto suma un profesional a tu cobro.";
      const ok = await confirmar({
        titulo: "Sumar un profesional a tu cobro",
        mensaje: `${campos.nombre.trim()} atenderá clientes y cuenta como un profesional más.
${cobro}`,
      });
      if (!ok) return;
    } else if (restaCobro) {
      const ok = await confirmar({
        titulo: "Dejar de cobrar a este profesional",
        mensaje: `${campos.nombre.trim()} ya no atenderá clientes.
${AVISO_SIN_REEMBOLSO}`,
        destructivo: true,
      });
      if (!ok) return;
    }

    const datos = {
      nombre: campos.nombre.trim(),
      usuario: campos.usuario.trim().toLowerCase(),
      especialidad: campos.especialidad.trim() || null,
      ...(puedeComisiones ? { porcentajeGanancia: pct } : {}),
      // Sin roles todos son empleados; al editar no se toca el rol que ya tenían
      ...(puedeRoles ? { rol: campos.rol } : enEdicion ? {} : { rol: "empleado" as const }),
      atiendeClientes: campos.atiendeClientes,
      // Al editar, la contraseña vacía deja la actual
      ...(clave ? { clave } : {}),
    };

    try {
      if (enEdicion) {
        reemplazar(await actualizarProfesional(token, enEdicion.id, datos));
        avisar("¡Actualizado!", `Los datos de "${datos.nombre}" han sido guardados.`, "exito");
      } else {
        const nuevo = await crearProfesional(token, datos);
        setBarberos((prev) => [...prev, nuevo]);
        onEquipoCambiado?.();
        avisar(
          "¡Éxito!",
          `${nuevo.nombre} registrado${puedeComisiones ? ` con ${nuevo.porcentajeGanancia}% de ganancia` : ""}. Entra con el usuario "${nuevo.usuario}".`,
          "exito",
        );
      }
      cerrar();
    } catch (e) {
      if (esEquipoLleno(e)) {
        avisarEquipoLleno((e as ApiError).message);
        return;
      }
      avisarError(e, { titulo: "No se pudo guardar", tituloConflicto: "Usuario en uso" });
    }
  };

  // Perfil de la cuenta de administración: el interruptor va por /equipo/yo-atiendo (el backend
  // ajusta el cobro) y nombre, especialidad y comisión por PATCH /equipo/:id
  const guardarMiPerfil = async () => {
    const conPerfil = !!miPerfil || campos.atiendeClientes;
    const pct = campos.porcentaje.trim() ? Number(campos.porcentaje) : PORCENTAJE_POR_DEFECTO;
    const nuevos = conPerfil
      ? {
          ...(!campos.nombre.trim() ? { nombre: "Escribe tu nombre como lo verán tus clientes." } : {}),
          ...(puedeComisiones && (isNaN(pct) || pct < 0 || pct > 100)
            ? { porcentaje: "Escribe un número de 0 a 100, por ejemplo 50." }
            : {}),
        }
      : {};
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      avisarCamposConError();
      return;
    }

    const cambiaAtiende = campos.atiendeClientes !== atiendoYo;
    if (cambiaAtiende && !campos.atiendeClientes) {
      const ok = await confirmar({
        titulo: "Dejar de atender clientes",
        mensaje: `Dejarás de aparecer al reservar y de recibir citas nuevas. Tus citas actuales se conservan.
${PAGOS_EN_APP ? AVISO_SIN_REEMBOLSO : ""}`.trim(),
        destructivo: true,
      });
      if (!ok) return;
    } else if (cambiaAtiende && PAGOS_EN_APP) {
      const cobro =
        planes && suscripcion
          ? textoCargoNuevo(calcularCargoNuevo(planes, suscripcion, suscripcion.profesionalesCobrados))
          : "Esto suma un profesional a tu cobro.";
      const ok = await confirmar({
        titulo: "Sumar un profesional a tu cobro",
        mensaje: `Atender clientes tú también cuenta como un profesional más.
${cobro}`,
      });
      if (!ok) return;
    }

    try {
      let perfil = miPerfil;
      if (cambiaAtiende) {
        const estado = await cambiarYoAtiendo(token, campos.atiendeClientes);
        yo.setEstado(estado);
        perfil = estado.perfil;
        if (perfil) reflejar(perfil);
        onEquipoCambiado?.();
      }
      if (perfil) {
        const especialidad = campos.especialidad.trim();
        const datos = {
          ...(campos.nombre.trim() !== perfil.nombre ? { nombre: campos.nombre.trim() } : {}),
          ...(especialidad !== (perfil.especialidad ?? "") ? { especialidad: especialidad || null } : {}),
          ...(puedeComisiones && pct !== perfil.porcentajeGanancia ? { porcentajeGanancia: pct } : {}),
        };
        if (Object.keys(datos).length > 0) {
          const actualizado = await actualizarProfesional(token, perfil.id, datos);
          reflejar(actualizado);
          yo.setEstado((e) => (e ? { ...e, perfil: actualizado } : e));
        }
      }
      avisar(
        "¡Actualizado!",
        !cambiaAtiende
          ? "Tus datos quedaron guardados."
          : campos.atiendeClientes
            ? "Ahora también atiendes clientes."
            : "Dejaste de recibir reservas nuevas. Tus citas se conservan.",
        "exito",
      );
      cerrar();
    } catch (e) {
      if (esEquipoLleno(e)) {
        avisarEquipoLleno((e as ApiError).message);
        return;
      }
      avisarError(e, { titulo: "No se pudo guardar", tituloConflicto: "No se pudo activar" });
    }
  };

  // Mensaje del backend: el negocio ya tiene el máximo de profesionales
  const avisarEquipoLleno = (mensaje: string) => {
    onEquipoCambiado?.();
    avisar("Equipo completo", mensaje, "aviso");
  };

  const eliminar = async (b: Barbero) => {
    const ok = await confirmar({
      titulo: "Confirmar",
      mensaje: `¿Deseas retirar a ${b.nombre} del equipo? Ya no podrá iniciar sesión ni recibir reservas.${
        b.atiendeClientes === false ? "" : `
${PAGOS_EN_APP ? AVISO_SIN_REEMBOLSO : ""}`
      }`.trim(),
      destructivo: true,
    });
    if (!ok) return;
    try {
      await eliminarProfesional(token, b.id);
      setBarberos((prev) => prev.filter((x) => x.id !== b.id));
      onEquipoCambiado?.();
      if (enEdicion?.id === b.id) cerrar();
      avisar("Eliminado", `${b.nombre} retirado.`, "exito");
    } catch (e) {
      // 409: tiene citas pendientes
      avisarError(e, { titulo: "No se pudo eliminar", tituloConflicto: "Tiene citas pendientes" });
    }
  };

  const cambiarFoto = async (b: Barbero, foto: FotoElegida) => {
    try {
      const { foto: url } = await subirFotoProfesional(token, b.id, foto);
      const actualizado = { ...b, foto: url };
      if (b.id === miPerfilId) {
        reflejar(actualizado);
        yo.setEstado((e) => (e ? { ...e, perfil: actualizado } : e));
      } else {
        reemplazar(actualizado);
      }
    } catch (e) {
      avisarError(e, { titulo: "No se pudo subir la foto" });
    }
  };

  const lleno = !!suscripcion && suscripcion.cupoDisponible <= 0;
  // Foto del que se edita (la de la lista, que se actualiza al cambiarla)
  const fotoEdicion = enEdicion?.id
    ? (barberos.find((b) => b.id === enEdicion.id) ?? (editandoMiPerfil ? miPerfil : null))
    : null;

  return (
    <>
      {suscripcion ? (
        <View
          style={[
            styles.cupo,
            { backgroundColor: colors.cardBg, borderColor: lleno ? colors.avisoTexto : colors.cardBorder },
          ]}
        >
          <Text style={[styles.textoCupo, { color: colors.textPrimary }]}>
            {lleno ? (
              <>
                <IconoEnLinea nombre="warning-outline" color={colors.avisoTexto} /> Llegaste al máximo:{" "}
              </>
            ) : (
              "Tu equipo: "
            )}
            {suscripcion.profesionalesCobrados} de {planes?.maximoProfesionales ?? 10} profesionales que atienden
            clientes · nivel {suscripcion.planEquipo.nombre}.
          </Text>
          <Text style={[styles.ayuda, { color: colors.textSecondary }]}>
            {lleno
              ? "Para agregar a alguien más, retira primero a quien ya no trabaje en el negocio."
              : PAGOS_EN_APP
                ? "Cada profesional que atiende clientes suma a tu cobro. Los administradores que no atienden no se cobran."
                : "Solo cuentan los profesionales que atienden clientes."}
          </Text>
          {PAGOS_EN_APP ? (
            <Boton
              titulo="VER PLANES"
              ayuda="Muestra el precio según la cantidad de profesionales"
              variante="secundario"
              onPress={() => setVerPlanes(true)}
              style={styles.botonPlanes}
            />
          ) : null}
        </View>
      ) : null}

      {PAGOS_EN_APP ? (
        <PlanesModal visible={verPlanes} onCerrar={() => setVerPlanes(false)} suscripcion={suscripcion} />
      ) : null}

      <Boton
        titulo="REGISTRAR NUEVO INTEGRANTE"
        ayuda="Abre una ventana para agregar a alguien al equipo"
        onPress={alternar}
        style={styles.nuevo}
      />

      {/* Crear y editar en una ventana: la lista de abajo no se mueve */}
      <VentanaFormulario
        visible={abierto}
        titulo={editandoMiPerfil ? "Mi perfil" : enEdicion ? `Editar a ${enEdicion.nombre}` : "Nuevo integrante"}
        descripcion={
          editandoMiPerfil
            ? "Tú · Administrador. Tu usuario y tu contraseña son los de tu cuenta."
            : enEdicion
              ? undefined
              : "Entrará a la app con el usuario y la contraseña que le pongas."
        }
        ocupado={guardando}
        onCerrar={cerrar}
      >
        {fotoEdicion ? (
          <View style={styles.fotoEdicion}>
            <FotoBarbero
              nombre={fotoEdicion.nombre}
              foto={fotoEdicion.foto}
              color={colors.primaryText}
              size={88}
              editable
              onCambiar={(foto) => cambiarFoto(fotoEdicion, foto)}
            />
            <Text style={[styles.ayuda, styles.flex, { color: colors.textSecondary }]}>
              Toca la foto para cambiarla: es la que ven los clientes al reservar.
            </Text>
          </View>
        ) : null}

        {editandoMiPerfil ? (
          <View
            style={[styles.interruptor, { backgroundColor: colors.inputBg, borderColor: colors.cardBorder }]}
          >
            <View style={styles.flex}>
              <Text style={[styles.textoInterruptor, { color: colors.textPrimary }]}>
                Yo también atiendo clientes
              </Text>
              <Text style={[styles.ayuda, { color: colors.textSecondary }]}>
                {campos.atiendeClientes
                  ? `Apareces al reservar y recibes citas.${PAGOS_EN_APP ? " Cuentas como un profesional en tu cobro." : ""}`
                  : `No apareces al reservar.${PAGOS_EN_APP ? " No cuentas en tu cobro." : ""}`}
              </Text>
            </View>
            <Switch
              accessibilityLabel="Yo también atiendo clientes"
              accessibilityHint="Si está activo, apareces como profesional al reservar y recibes citas"
              value={campos.atiendeClientes}
              onValueChange={cambiar("atiendeClientes")}
              trackColor={{ true: colors.primary, false: colors.cardBorder }}
              thumbColor={COLORES.blanco}
            />
          </View>
        ) : null}

        {editandoMiPerfil && !miPerfil && !campos.atiendeClientes ? (
          <Text style={[styles.ayuda, { color: colors.textSecondary }]}>
            Activa &quot;Yo también atiendo clientes&quot; para tener foto, especialidad y comisión.
          </Text>
        ) : (
          <CampoTexto
            etiqueta="Nombre completo"
            obligatorio
            error={errores.nombre}
            ayuda={editandoMiPerfil ? "Tu nombre como lo verán los clientes al reservar" : "Nombre del integrante como lo verán los clientes"}
            placeholder="ej: Carlos Gómez"
            autoCapitalize="words"
            autoComplete="off"
            maxLength={100}
            value={campos.nombre}
            onChangeText={cambiar("nombre")}
          />
        )}

        {!editandoMiPerfil ? (
          <>
            <CampoTexto
              etiqueta="Usuario para ingresar"
              obligatorio
              error={errores.usuario}
              ayuda="Con este usuario y su contraseña entrará a la app"
              placeholder="ej: carlos.gomez"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              maxLength={50}
              value={campos.usuario}
              onChangeText={cambiar("usuario")}
            />
            <CampoClave
              etiqueta={enEdicion ? "Nueva contraseña" : "Contraseña"}
              obligatorio={!enEdicion}
              error={errores.clave}
              ayuda={
                enEdicion
                  ? "Déjala vacía para no cambiarla. Mínimo 8 caracteres con mayúscula, minúscula, número y carácter especial"
                  : "Mínimo 8 caracteres con mayúscula, minúscula, número y carácter especial"
              }
              placeholder={enEdicion ? "ej: vacía = no cambiar" : "ej: MiClave#2026"}
              autoComplete="off"
              textContentType="newPassword"
              // Al editar, vacía no cambia nada: los requisitos aparecen al escribir
              requisitos={!enEdicion || !!campos.clave}
              value={campos.clave}
              onChangeText={cambiar("clave")}
            />
            {puedeRoles ? (
              <>
                <Desplegable
                  etiqueta="Rol"
                  ayuda="Administrador maneja todo el negocio; Empleado solo su agenda y su cartera"
                  titulo="Rol"
                  placeholder="Rol"
                  opciones={ROLES}
                  valor={campos.rol}
                  // Nadie se quita a sí mismo el rol de administrador
                  deshabilitado={enEdicion ? soyYo(enEdicion.id) : false}
                  onCambiar={(rol) => {
                    cambiar("rol")(rol);
                    // En un integrante nuevo, el interruptor sigue el valor por defecto del rol
                    if (!enEdicion) cambiar("atiendeClientes")(atiendePorDefecto(rol));
                  }}
                />
                <Text style={[styles.ayuda, { color: colors.textSecondary }]}>
                  {campos.rol === "admin"
                    ? "Administrador: maneja todo el negocio, igual que la cuenta de la empresa."
                    : "Empleado: solo ve su agenda y su cartera."}
                </Text>
              </>
            ) : (
              <FuncionBloqueada
                funcion="roles"
                nombre="Roles de administrador y empleado"
                detalle="Mientras tanto, todos los integrantes son empleados."
              />
            )}
            <View
              style={[styles.interruptor, { backgroundColor: colors.inputBg, borderColor: colors.cardBorder }]}
            >
              <View style={styles.flex}>
                <Text style={[styles.textoInterruptor, { color: colors.textPrimary }]}>
                  Atiende clientes
                </Text>
                <Text style={[styles.ayuda, { color: colors.textSecondary }]}>
                  {campos.atiendeClientes
                    ? "Aparece al reservar y recibe citas."
                    : "No aparece al reservar."}
                </Text>
              </View>
              <Switch
                accessibilityLabel="Atiende clientes"
                accessibilityHint="Si está activo, aparece al reservar y recibe citas"
                value={campos.atiendeClientes}
                onValueChange={cambiar("atiendeClientes")}
                trackColor={{ true: colors.primary, false: colors.cardBorder }}
                thumbColor={COLORES.blanco}
              />
            </View>
          </>
        ) : null}

        {!editandoMiPerfil || miPerfil || campos.atiendeClientes ? (
          <>
            <CampoTexto
              etiqueta="Especialidad (opcional)"
              ayuda="Lo que mejor hace, se muestra a los clientes"
              placeholder="ej: Colorimetría · Manicure"
              autoCapitalize="sentences"
              maxLength={100}
              value={campos.especialidad}
              onChangeText={cambiar("especialidad")}
            />
            {puedeComisiones ? (
              <CampoTexto
                etiqueta={editandoMiPerfil ? "Tu comisión (%)" : "Comisión (%)"}
                error={errores.porcentaje}
                ayuda={
                  editandoMiPerfil
                    ? "Porcentaje de cada servicio que ganas tú, de 0 a 100. Vacío = 50"
                    : "Porcentaje de cada servicio que gana el integrante, de 0 a 100. Vacío = 50"
                }
                placeholder="ej: 50"
                keyboardType="numeric"
                maxLength={3}
                value={campos.porcentaje}
                onChangeText={cambiar("porcentaje")}
              />
            ) : (
              <FuncionBloqueada
                funcion="comisiones"
                nombre="Comisiones y pago a profesionales"
                detalle="Mientras tanto, la comisión de cada integrante queda en el valor inicial (50 %)."
              />
            )}
          </>
        ) : null}

        <BotonesFormulario
          tituloGuardar={enEdicion ? "GUARDAR CAMBIOS" : "REGISTRAR INTEGRANTE"}
          ayudaGuardar={
            editandoMiPerfil
              ? "Guarda tu perfil de profesional"
              : enEdicion
                ? "Guarda los cambios del integrante"
                : "Agrega al integrante al equipo"
          }
          onGuardar={guardar}
          onCancelar={guardando ? () => {} : cerrar}
        />
      </VentanaFormulario>

      <PrivacidadTelefonos token={token} />

      <TituloSeccion style={styles.tituloLista}>
        INTEGRANTES REGISTRADOS ({otros.length + (cuentaAdmin ? 1 : 0)})
      </TituloSeccion>
      <Cuadricula>
        {/* La cuenta de administración siempre va primero */}
        {cuentaAdmin ? (
          <TarjetaFila>
            <View style={styles.flex}>
              {miPerfil ? (
                <FotoBarbero
                  nombre={miPerfil.nombre}
                  foto={miPerfil.foto}
                  color={colors.primaryText}
                  editable
                  onCambiar={(foto) => cambiarFoto(miPerfil, foto)}
                />
              ) : (
                <FotoBarbero nombre={personal.nombre} color={colors.primaryText} />
              )}
              <Text style={[estilosTexto.titulo, { color: colors.textPrimary }]}>
                {miPerfil?.nombre ?? personal.nombre}{" "}
                <IconoEnLinea nombre="shield-checkmark-outline" color={colors.primaryText} />
              </Text>
              {yo.error ? (
                <>
                  <Text style={[estilosTexto.subtitulo, { color: colors.peligroTexto }]}>{yo.error}</Text>
                  <Boton
                    titulo="REINTENTAR"
                    ayuda="Vuelve a cargar tu perfil"
                    variante="secundario"
                    onPress={yo.reintentar}
                    style={styles.reintentar}
                  />
                </>
              ) : !yo.estado ? (
                <ActivityIndicator color={colors.primaryText} style={styles.cargandoYo} />
              ) : (
                <>
                  <Text style={[estilosTexto.subtitulo, { color: colors.textSecondary }]}>
                    Tú · Administrador · {atiendoYo ? "Atiende clientes" : "No atiende clientes"}
                  </Text>
                  {miPerfil ? (
                    <Text style={[estilosTexto.subtitulo, { color: colors.textSecondary }]}>
                      {miPerfil.especialidad || "Sin especialidad"}
                      {puedeComisiones ? ` · Comisión: ${miPerfil.porcentajeGanancia}%` : ""}
                    </Text>
                  ) : null}
                </>
              )}
            </View>
            {yo.estado ? (
              <View style={styles.acciones}>
                <BotonIcono
                  icono="create-outline"
                  color={colors.primaryText}
                  etiqueta="Editar mi perfil"
                  ayuda="Abre tus datos en una ventana para editarlos"
                  onPress={editarMiPerfil}
                />
              </View>
            ) : null}
          </TarjetaFila>
        ) : null}

        {otros.map((b) => (
          <TarjetaFila key={b.id}>
            <View style={styles.flex}>
              <FotoBarbero
                nombre={b.nombre}
                foto={b.foto}
                color={colors.primaryText}
                editable
                onCambiar={(foto) => cambiarFoto(b, foto)}
              />
              <Text style={[estilosTexto.titulo, { color: colors.textPrimary }]}>
                {b.nombre}{" "}
                {b.esAdmin ? <IconoEnLinea nombre="shield-checkmark-outline" color={colors.primaryText} /> : null}
              </Text>
              <Text style={[estilosTexto.subtitulo, { color: colors.textSecondary }]}>
                {soyYo(b.id) ? "Tú · " : ""}
                {rolDe(b) === "admin" ? "Administrador" : "Empleado"}
                {b.atiendeClientes === false ? " · No atiende clientes" : " · Atiende clientes"}
              </Text>
              <Text style={[estilosTexto.subtitulo, { color: colors.textSecondary }]}>
                {b.especialidad || "Sin especialidad"}
                {puedeComisiones ? ` · Comisión: ${b.porcentajeGanancia}%` : ""}
              </Text>
              {b.usuario ? (
                <Text style={[styles.usuario, { color: colors.textSecondary }]}>Usuario: {b.usuario}</Text>
              ) : null}
            </View>

            <View style={styles.acciones}>
              <BotonIcono
                icono="create-outline"
                color={colors.primaryText}
                etiqueta={`Editar a ${b.nombre}`}
                ayuda="Abre sus datos en una ventana para editarlos"
                onPress={() => editar(b)}
              />
              {!soyYo(b.id) ? (
                <BotonIcono
                  icono="trash-outline"
                  color={colors.peligroTexto}
                  etiqueta={`Retirar a ${b.nombre}`}
                  ayuda="Pide confirmación antes de retirarlo del equipo"
                  onPress={() => eliminar(b)}
                />
              ) : null}
            </View>
          </TarjetaFila>
        ))}
      </Cuadricula>
    </>
  );
}

const styles = StyleSheet.create({
  nuevo: { marginTop: 15 },
  cupo: { borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 15 },
  textoCupo: { fontSize: 13, fontWeight: "bold" },
  botonPlanes: { marginTop: 10 },
  tituloLista: { marginTop: 20 },
  flex: { flex: 1 },
  usuario: { fontSize: 12, marginTop: 2 },
  ayuda: { fontSize: 12, marginTop: 2, marginBottom: 8 },
  interruptor: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    marginBottom: 10,
  },
  textoInterruptor: { fontSize: 14, fontWeight: "600" },
  acciones: { flexDirection: "row", gap: 12 },
  fotoEdicion: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  reintentar: { marginTop: 8 },
  cargandoYo: { alignSelf: "flex-start", marginTop: 6 },
});
