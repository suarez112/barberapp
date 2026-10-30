import Cuadricula from "@/components/layout/Cuadricula";
import { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import FotoBarbero from "@/components/FotoBarbero";
import Acordeon from "@/components/ui/Acordeon";
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
import AtiendoClientes from "../admin/components/AtiendoClientes";
import { PAGOS_EN_APP } from "@/config/pagos";

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
  const token = personal.token;
  const soyYo = (id: string) => personal.barbero?.id === id;

  // Reemplaza al integrante en la lista (y en la sesión si es quien está usando la app)
  const reemplazar = (b: Barbero) => {
    setBarberos((prev) => prev.map((x) => (x.id === b.id ? b : x)));
    if (soyYo(b.id)) actualizarBarberoLogueado(b);
  };

  const guardar = async () => {
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
      reiniciar();
    } catch (e) {
      if (esEquipoLleno(e)) {
        avisarEquipoLleno((e as ApiError).message);
        return;
      }
      avisarError(e, { titulo: "No se pudo guardar", tituloConflicto: "Usuario en uso" });
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
      if (enEdicion?.id === b.id) reiniciar();
      avisar("Eliminado", `${b.nombre} retirado.`, "exito");
    } catch (e) {
      // 409: tiene citas pendientes
      avisarError(e, { titulo: "No se pudo eliminar", tituloConflicto: "Tiene citas pendientes" });
    }
  };

  const cambiarFoto = async (b: Barbero, foto: FotoElegida) => {
    try {
      const { foto: url } = await subirFotoProfesional(token, b.id, foto);
      reemplazar({ ...b, foto: url });
    } catch (e) {
      avisarError(e, { titulo: "No se pudo subir la foto" });
    }
  };

  const lleno = !!suscripcion && suscripcion.cupoDisponible <= 0;

  return (
    <>
      {/* Solo la cuenta de la empresa; un integrante administrador usa "Atiende clientes" más abajo */}
      {personal.esCuentaAdmin ? (
        <AtiendoClientes token={token} suscripcion={suscripcion} onEquipoCambiado={onEquipoCambiado} />
      ) : null}

      {suscripcion ? (
        <View
          style={[
            styles.cupo,
            { backgroundColor: colors.cardBg, borderColor: lleno ? colors.avisoTexto : colors.cardBorder },
          ]}
        >
          <Text style={[styles.textoCupo, { color: colors.textPrimary }]}>
            {lleno ? "⚠️ Llegaste al máximo: " : "Tu equipo: "}
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

      <Acordeon
        titulo={enEdicion ? "✏️ EDITANDO INTEGRANTE" : "➕ REGISTRAR NUEVO INTEGRANTE"}
        abierto={abierto}
        onAlternar={alternar}
        style={styles.acordeon}
      >
        <CampoTexto
          etiqueta="Nombre completo"
          obligatorio
          error={errores.nombre}
          ayuda="Nombre del integrante como lo verán los clientes"
          placeholder="ej: Carlos Gómez"
          autoCapitalize="words"
          autoComplete="off"
          maxLength={100}
          value={campos.nombre}
          onChangeText={cambiar("nombre")}
        />
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
            etiqueta="Comisión (%)"
            error={errores.porcentaje}
            ayuda="Porcentaje de cada servicio que gana el integrante, de 0 a 100. Vacío = 50"
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
        <BotonesFormulario
          tituloGuardar={enEdicion ? "GUARDAR CAMBIOS" : "REGISTRAR INTEGRANTE"}
          ayudaGuardar={enEdicion ? "Guarda los cambios del integrante" : "Agrega al integrante al equipo"}
          onGuardar={guardar}
          onCancelar={reiniciar}
        />
      </Acordeon>

      <TituloSeccion style={styles.tituloLista}>
        INTEGRANTES REGISTRADOS ({barberos.length})
      </TituloSeccion>
      <Cuadricula>
      {barberos.map((b) => (
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
              {b.nombre} {b.esAdmin ? "👑" : null}
            </Text>
            <Text style={[estilosTexto.subtitulo, { color: colors.textSecondary }]}>
              {rolDe(b) === "admin" ? "Administrador" : "Empleado"}
              {b.atiendeClientes === false ? " · No atiende clientes" : " · Atiende clientes"}
            </Text>
            <Text style={[estilosTexto.subtitulo, { color: colors.textSecondary }]}>
              {b.especialidad || "Sin especialidad"}
              {puedeComisiones ? ` · Comisión: ${b.porcentajeGanancia}%` : ""}
            </Text>
            <Text style={[styles.usuario, { color: colors.textSecondary }]}>
              Usuario: {b.usuario}
            </Text>
          </View>

          <View style={styles.acciones}>
            <BotonIcono
              icono="create-outline"
              color={colors.primaryText}
              etiqueta={`Editar a ${b.nombre}`}
              ayuda="Abre sus datos en el formulario de arriba"
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
  acordeon: { marginTop: 15 },
  cupo: { borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 15 },
  textoCupo: { fontSize: 13, fontWeight: "bold" },
  botonPlanes: { marginTop: 10 },
  tituloLista: { marginTop: 20 },
  flex: { flex: 1 },
  usuario: { fontSize: 10, marginTop: 2 },
  ayuda: { fontSize: 11, marginTop: 2, marginBottom: 8 },
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
});
