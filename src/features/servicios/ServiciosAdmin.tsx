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

const VACIO = { nombre: "", precio: "", duracion: "" };
const DURACION_POR_DEFECTO = "30 min";

const aCampos = (s: Servicio) => ({
  nombre: s.nombre,
  precio: s.precio.toString(),
  duracion: s.duracion,
});

export default function ServiciosAdmin() {
  const { colors } = useAppTheme();
  const { servicios, setServicios } = useNegocio();
  const { abierto, alternar, enEdicion, campos, cambiar, editar, reiniciar } =
    useFormularioEdicion(VACIO, aCampos);

  const guardar = () => {
    if (!campos.nombre.trim() || !campos.precio.trim()) {
      avisar("Datos Incompletos", "Escribe el nombre y precio del servicio.");
      return;
    }
    const datos = {
      nombre: campos.nombre.trim(),
      duracion: campos.duracion.trim() || DURACION_POR_DEFECTO,
      precio: parseFloat(campos.precio) || 0,
    };

    if (enEdicion) {
      setServicios(
        servicios.map((s) => (s.id === enEdicion.id ? { ...s, ...datos } : s)),
      );
      avisar("¡Actualizado!", `Servicio "${campos.nombre}" modificado con éxito.`);
    } else {
      setServicios([...servicios, { id: Date.now().toString(), ...datos }]);
      avisar("¡Servicio Creado!", `${datos.nombre} agregado al catálogo.`);
    }
    reiniciar();
  };

  const eliminar = async (s: Servicio) => {
    const ok = await confirmar({
      titulo: "Confirmar",
      mensaje: `¿Eliminar servicio "${s.nombre}"?`,
      textoConfirmar: "Eliminar",
      destructivo: true,
    });
    if (!ok) return;
    setServicios(servicios.filter((x) => x.id !== s.id));
    if (enEdicion?.id === s.id) reiniciar();
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
          placeholder="Duración estimada (Ej: 45 min)"
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
