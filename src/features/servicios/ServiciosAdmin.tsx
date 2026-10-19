import { StyleSheet, Text, View } from "react-native";
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
import { Servicio } from "@/types";
import { avisar, confirmar } from "@/utils/dialogos";
import { formatearPesos } from "@/utils/formato";
import { useNegocio } from "../negocio/NegocioProvider";
import { useAvisarError } from "../sesion/useAvisarError";
import { actualizarServicio, crearServicio, eliminarServicio } from "./api";

const VACIO = { nombre: "", precio: "", duracion: "" };

const aCampos = (s: Servicio) => ({
  nombre: s.nombre,
  precio: s.precio.toString(),
  duracion: String(s.duracionMin ?? parseInt(s.duracion, 10)),
});

export default function ServiciosAdmin({ token }: { token: string }) {
  const { colors } = useAppTheme();
  const { servicios, setServicios } = useNegocio();
  const avisarError = useAvisarError();
  const { abierto, alternar, enEdicion, campos, cambiar, editar, reiniciar } =
    useFormularioEdicion(VACIO, aCampos);

  const guardar = async () => {
    const precio = Number(campos.precio.replace(/[^\d.]/g, ""));
    const duracionMin = parseInt(campos.duracion, 10);
    if (!campos.nombre.trim() || !campos.precio.trim() || isNaN(precio)) {
      avisar("Datos Incompletos", "Escribe el nombre y precio del servicio.");
      return;
    }
    if (isNaN(duracionMin) || duracionMin < 1 || duracionMin > 1440) {
      avisar("Duración inválida", "Escribe la duración en minutos (ej: 30).");
      return;
    }
    const datos = { nombre: campos.nombre.trim(), duracionMin, precio };

    try {
      if (enEdicion) {
        const actualizado = await actualizarServicio(token, enEdicion.id, datos);
        setServicios((prev) => prev.map((s) => (s.id === actualizado.id ? actualizado : s)));
        avisar("¡Actualizado!", `Servicio "${actualizado.nombre}" modificado con éxito.`, "exito");
      } else {
        const nuevo = await crearServicio(token, datos);
        setServicios((prev) => [...prev, nuevo]);
        avisar("¡Servicio Creado!", `${nuevo.nombre} agregado al catálogo.`, "exito");
      }
      reiniciar();
    } catch (e) {
      avisarError(e, { titulo: "No se pudo guardar el servicio" });
    }
  };

  const eliminar = async (s: Servicio) => {
    const ok = await confirmar({
      titulo: "Confirmar",
      mensaje: `¿Eliminar servicio "${s.nombre}"? Las citas ya agendadas no cambian.`,
      destructivo: true,
    });
    if (!ok) return;
    try {
      await eliminarServicio(token, s.id);
      setServicios((prev) => prev.filter((x) => x.id !== s.id));
      if (enEdicion?.id === s.id) reiniciar();
    } catch (e) {
      avisarError(e, { titulo: "No se pudo eliminar" });
    }
  };

  return (
    <>
      <Acordeon
        titulo={enEdicion ? "✏️ EDITANDO SERVICIO" : "➕ AGREGAR NUEVO SERVICIO"}
        abierto={abierto}
        onAlternar={alternar}
        style={styles.acordeon}
      >
        <CampoTexto
          placeholder="Nombre del Servicio"
          value={campos.nombre}
          onChangeText={cambiar("nombre")}
        />
        <CampoTexto
          placeholder="Precio en $ (Ej: 35000)"
          keyboardType="numeric"
          value={campos.precio}
          onChangeText={cambiar("precio")}
        />
        <CampoTexto
          placeholder="Duración en minutos (Ej: 45)"
          keyboardType="numeric"
          value={campos.duracion}
          onChangeText={cambiar("duracion")}
        />
        <BotonesFormulario
          tituloGuardar={enEdicion ? "GUARDAR CAMBIOS" : "AGREGAR SERVICIO"}
          onGuardar={guardar}
          onCancelar={reiniciar}
        />
      </Acordeon>

      <TituloSeccion style={styles.tituloLista}>
        SERVICIOS ACTIVOS ({servicios.length})
      </TituloSeccion>
      {servicios.map((s) => (
        <TarjetaFila key={s.id}>
          <View style={styles.flex}>
            <Text style={[estilosTexto.titulo, { color: colors.textPrimary }]}>
              {s.nombre}
            </Text>
            <Text style={[estilosTexto.subtitulo, { color: colors.textSecondary }]}>
              {s.duracion} · ${formatearPesos(s.precio)}
            </Text>
          </View>
          <View style={styles.acciones}>
            <BotonIcono
              icono="create-outline"
              color={colors.primary}
              etiqueta={`Editar ${s.nombre}`}
              onPress={() => editar(s)}
            />
            <BotonIcono
              icono="trash-outline"
              color={COLORES.peligro}
              etiqueta={`Eliminar ${s.nombre}`}
              onPress={() => eliminar(s)}
            />
          </View>
        </TarjetaFila>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  acordeon: { marginTop: 20 },
  tituloLista: { marginTop: 20 },
  flex: { flex: 1 },
  acciones: { flexDirection: "row", gap: 12 },
});
