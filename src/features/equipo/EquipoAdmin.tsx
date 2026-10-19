import { StyleSheet, Switch, Text, View } from "react-native";
import FotoBarbero from "@/components/FotoBarbero";
import Acordeon from "@/components/ui/Acordeon";
import BotonesFormulario from "@/components/ui/BotonesFormulario";
import BotonIcono from "@/components/ui/BotonIcono";
import CampoTexto from "@/components/ui/CampoTexto";
import CampoClave from "@/components/ui/CampoClave";
import Desplegable from "@/components/ui/Desplegable";
import { estilosTexto } from "@/components/ui/estilosTexto";
import TarjetaFila from "@/components/ui/TarjetaFila";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useFormularioEdicion } from "@/hooks/useFormularioEdicion";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { ApiError } from "@/services/api/http";
import { Barbero, RolEquipo } from "@/types";
import { avisar, confirmar } from "@/utils/dialogos";
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

// 409 del backend cuando el equipo llegó al número de empleados de Mi negocio
const esEquipoLleno = (e: unknown) =>
  e instanceof ApiError && e.status === 409 && /equipo ya tiene/i.test(e.message);

type Props = {
  personal: Personal;
  // Abre la pestaña Mi negocio; sin ella no se ofrece el botón
  onIrAMiNegocio?: () => void;
};

export default function EquipoAdmin({ personal, onIrAMiNegocio }: Props) {
  const { colors } = useAppTheme();
  const { barberos, setBarberos } = useNegocio();
  const { actualizarBarberoLogueado } = useSesion();
  const avisarError = useAvisarError();
  const { abierto, alternar, enEdicion, campos, cambiar, editar, reiniciar } =
    useFormularioEdicion(VACIO, aCampos);
  const token = personal.token;
  const soyYo = (id: string) => personal.barbero?.id === id;

  // Reemplaza al integrante en la lista (y en la sesión si es quien está usando la app)
  const reemplazar = (b: Barbero) => {
    setBarberos((prev) => prev.map((x) => (x.id === b.id ? b : x)));
    if (soyYo(b.id)) actualizarBarberoLogueado(b);
  };

  const guardar = async () => {
    const clave = campos.clave.trim();
    if (!campos.nombre.trim() || !campos.usuario.trim() || (!enEdicion && !clave)) {
      avisar(
        "Datos Incompletos",
        enEdicion
          ? "Completa Nombre y Usuario del integrante."
          : "Completa Nombre, Usuario y Contraseña para el integrante.",
      );
      return;
    }
    if (clave && (clave.length < 8 || clave.length > 64)) {
      avisar("Contraseña inválida", "La contraseña debe tener entre 8 y 64 caracteres.");
      return;
    }
    const pct = campos.porcentaje.trim() ? Number(campos.porcentaje) : PORCENTAJE_POR_DEFECTO;
    if (isNaN(pct) || pct < 0 || pct > 100) {
      avisar("Comisión inválida", "La comisión debe ser un número de 0 a 100.");
      return;
    }

    const datos = {
      nombre: campos.nombre.trim(),
      usuario: campos.usuario.trim().toLowerCase(),
      especialidad: campos.especialidad.trim() || null,
      porcentajeGanancia: pct,
      rol: campos.rol,
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
        avisar(
          "¡Éxito!",
          `${nuevo.nombre} registrado con ${nuevo.porcentajeGanancia}% de ganancia. Entra con el usuario "${nuevo.usuario}".`,
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

  // Mensaje del backend, con un botón para ir a aumentar el número de empleados
  const avisarEquipoLleno = async (mensaje: string) => {
    if (!onIrAMiNegocio || !/Mi negocio/i.test(mensaje)) {
      avisar("Equipo completo", mensaje, "aviso");
      return;
    }
    const ir = await confirmar({
      titulo: "Equipo completo",
      mensaje,
      textoAceptar: "IR A MI NEGOCIO",
      textoCancelar: "CERRAR",
    });
    if (ir) onIrAMiNegocio();
  };

  const eliminar = async (b: Barbero) => {
    const ok = await confirmar({
      titulo: "Confirmar",
      mensaje: `¿Deseas retirar a ${b.nombre} del equipo? Ya no podrá iniciar sesión ni recibir reservas.`,
      destructivo: true,
    });
    if (!ok) return;
    try {
      await eliminarProfesional(token, b.id);
      setBarberos((prev) => prev.filter((x) => x.id !== b.id));
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

  return (
    <>
      <Acordeon
        titulo={enEdicion ? "✏️ EDITANDO INTEGRANTE" : "➕ REGISTRAR NUEVO INTEGRANTE"}
        abierto={abierto}
        onAlternar={alternar}
        style={styles.acordeon}
      >
        <CampoTexto
          placeholder="Nombre Completo"
          value={campos.nombre}
          onChangeText={cambiar("nombre")}
        />
        <CampoTexto
          placeholder="Usuario para ingresar"
          autoCapitalize="none"
          value={campos.usuario}
          onChangeText={cambiar("usuario")}
        />
        <CampoClave
          placeholder={enEdicion ? "Nueva contraseña (vacía = no cambiar)" : "Contraseña (mínimo 8)"}
          value={campos.clave}
          onChangeText={cambiar("clave")}
        />
        <Desplegable
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
            value={campos.atiendeClientes}
            onValueChange={cambiar("atiendeClientes")}
            trackColor={{ true: colors.primary, false: colors.cardBorder }}
            thumbColor={COLORES.blanco}
          />
        </View>
        <CampoTexto
          placeholder="Especialidad (ej: Colorimetría · Manicure)"
          value={campos.especialidad}
          onChangeText={cambiar("especialidad")}
        />
        <CampoTexto
          placeholder="Porcentaje de Comisión % (Ej: 50)"
          keyboardType="numeric"
          value={campos.porcentaje}
          onChangeText={cambiar("porcentaje")}
        />
        <BotonesFormulario
          tituloGuardar={enEdicion ? "GUARDAR CAMBIOS" : "REGISTRAR INTEGRANTE"}
          onGuardar={guardar}
          onCancelar={reiniciar}
        />
      </Acordeon>

      <TituloSeccion style={styles.tituloLista}>
        INTEGRANTES REGISTRADOS ({barberos.length})
      </TituloSeccion>
      {barberos.map((b) => (
        <TarjetaFila key={b.id}>
          <View style={styles.flex}>
            <FotoBarbero
              nombre={b.nombre}
              foto={b.foto}
              color={colors.primary}
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
              {b.especialidad || "Sin especialidad"} · Comisión: {b.porcentajeGanancia}%
            </Text>
            <Text style={[styles.usuario, { color: colors.textSecondary }]}>
              Usuario: {b.usuario}
            </Text>
          </View>

          <View style={styles.acciones}>
            <BotonIcono
              icono="create-outline"
              color={colors.primary}
              etiqueta={`Editar a ${b.nombre}`}
              onPress={() => editar(b)}
            />
            {!soyYo(b.id) ? (
              <BotonIcono
                icono="trash-outline"
                color={COLORES.peligro}
                etiqueta={`Retirar a ${b.nombre}`}
                onPress={() => eliminar(b)}
              />
            ) : null}
          </View>
        </TarjetaFila>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  acordeon: { marginTop: 15 },
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
