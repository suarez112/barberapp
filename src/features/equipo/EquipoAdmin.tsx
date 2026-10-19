import { StyleSheet, Text, View } from "react-native";
import FotoBarbero from "@/components/FotoBarbero";
import Acordeon from "@/components/ui/Acordeon";
import BotonesFormulario from "@/components/ui/BotonesFormulario";
import BotonIcono from "@/components/ui/BotonIcono";
import CampoTexto from "@/components/ui/CampoTexto";
import { estilosTexto } from "@/components/ui/estilosTexto";
import TarjetaFila from "@/components/ui/TarjetaFila";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useFormularioEdicion } from "@/hooks/useFormularioEdicion";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { Barbero } from "@/types";
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

const VACIO = { nombre: "", usuario: "", clave: "", especialidad: "", porcentaje: "" };
const PORCENTAJE_POR_DEFECTO = 50;

const aCampos = (b: Barbero) => ({
  nombre: b.nombre,
  usuario: b.usuario,
  clave: "",
  especialidad: b.especialidad,
  porcentaje: b.porcentajeGanancia.toString(),
});

export default function EquipoAdmin({ personal }: { personal: Personal }) {
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
      // Al editar, la contraseña vacía deja la actual
      ...(clave ? { clave } : {}),
    };

    try {
      if (enEdicion) {
        reemplazar(await actualizarProfesional(token, enEdicion.id, datos));
        avisar("¡Actualizado!", `Los datos de "${datos.nombre}" han sido guardados.`);
      } else {
        const nuevo = await crearProfesional(token, datos);
        setBarberos((prev) => [...prev, nuevo]);
        avisar(
          "¡Éxito!",
          `${nuevo.nombre} registrado con ${nuevo.porcentajeGanancia}% de ganancia. Entra con el usuario "${nuevo.usuario}".`,
        );
      }
      reiniciar();
    } catch (e) {
      avisarError(e, { titulo: "No se pudo guardar", tituloConflicto: "Usuario en uso" });
    }
  };

  const eliminar = async (b: Barbero) => {
    const ok = await confirmar({
      titulo: "Confirmar",
      mensaje: `¿Deseas retirar a ${b.nombre} del equipo? Ya no podrá iniciar sesión ni recibir reservas.`,
      textoConfirmar: "Eliminar",
      destructivo: true,
    });
    if (!ok) return;
    try {
      await eliminarProfesional(token, b.id);
      setBarberos((prev) => prev.filter((x) => x.id !== b.id));
      if (enEdicion?.id === b.id) reiniciar();
      avisar("Eliminado", `${b.nombre} retirado.`);
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
        <CampoTexto
          placeholder={enEdicion ? "Nueva contraseña (vacía = no cambiar)" : "Contraseña (mínimo 8)"}
          secureTextEntry
          value={campos.clave}
          onChangeText={cambiar("clave")}
        />
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
              {b.nombre} {b.esAdmin ? "👑 (Admin)" : null}
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
  acciones: { flexDirection: "row", gap: 12 },
});
