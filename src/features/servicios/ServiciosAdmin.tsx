import { StyleSheet, Text, View } from "react-native";
import Acordeon from "@/components/ui/Acordeon";
import BotonesFormulario from "@/components/ui/BotonesFormulario";
import BotonIcono from "@/components/ui/BotonIcono";
import CampoPrecio from "@/components/ui/CampoPrecio";
import CampoTexto from "@/components/ui/CampoTexto";
import Desplegable from "@/components/ui/Desplegable";
import { estilosTexto } from "@/components/ui/estilosTexto";
import TarjetaFila from "@/components/ui/TarjetaFila";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useFormularioEdicion } from "@/hooks/useFormularioEdicion";
import { useAppTheme } from "@/theme/ThemeProvider";
import { Servicio } from "@/types";
import { avisar, avisarCamposConError, confirmar } from "@/utils/dialogos";
import { formatearPesos, leerPrecio, textoDuracion } from "@/utils/formato";
import { useNegocio } from "../negocio/NegocioProvider";
import { useAvisarError } from "../sesion/useAvisarError";
import { useGuia } from "../guia/guiaContexto";
import { actualizarServicio, crearServicio, eliminarServicio } from "./api";

// Duraciones que se ofrecen al crear o editar un servicio: de 10 min a 2 h 30, de 10 en 10
const OPCIONES_DURACION = Array.from({ length: 15 }, (_, i) => {
  const minutos = (i + 1) * 10;
  return { valor: minutos, etiqueta: textoDuracion(minutos) };
});

type Campos = { nombre: string; precio: string; duracion: number | null };

const VACIO: Campos = { nombre: "", precio: "", duracion: null };

const aCampos = (s: Servicio): Campos => ({
  nombre: s.nombre,
  precio: formatearPesos(s.precio),
  duracion: s.duracionMin ?? (parseInt(s.duracion, 10) || null),
});

export default function ServiciosAdmin({ token }: { token: string }) {
  const { colors } = useAppTheme();
  const { servicios, setServicios } = useNegocio();
  const avisarError = useAvisarError();
  const { refrescar: refrescarGuia } = useGuia();
  const { abierto, alternar, enEdicion, campos, cambiar, errores, setErrores, editar, reiniciar } =
    useFormularioEdicion(VACIO, aCampos);

  const guardar = async () => {
    const precio = leerPrecio(campos.precio);
    const duracionMin = campos.duracion;
    const nuevos = {
      ...(!campos.nombre.trim() ? { nombre: "Escribe el nombre del servicio, por ejemplo Corte clásico." } : {}),
      ...(isNaN(precio) ? { precio: "Escribe el precio en pesos, por ejemplo 35.000." } : {}),
      ...(!duracionMin ? { duracion: "Elige cuánto dura el servicio." } : {}),
    };
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0 || !duracionMin) {
      avisarCamposConError();
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
        refrescarGuia();
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
          etiqueta="Nombre del servicio"
          obligatorio
          error={errores.nombre}
          ayuda="Así lo verán los clientes al reservar"
          placeholder="ej: Corte clásico"
          autoCapitalize="sentences"
          maxLength={100}
          value={campos.nombre}
          onChangeText={cambiar("nombre")}
        />
        <CampoPrecio
          etiqueta="Precio"
          obligatorio
          error={errores.precio}
          ayuda="En pesos, sin centavos"
          placeholder="ej: 35.000"
          value={campos.precio}
          onChangeText={cambiar("precio")}
        />
        <Desplegable
          etiqueta="Duración"
          obligatorio
          error={errores.duracion}
          ayuda="Elige cuánto dura el servicio"
          placeholder="Elige la duración del servicio"
          opciones={OPCIONES_DURACION}
          valor={campos.duracion}
          onCambiar={cambiar("duracion")}
        />
        <BotonesFormulario
          tituloGuardar={enEdicion ? "GUARDAR CAMBIOS" : "AGREGAR SERVICIO"}
          ayudaGuardar={enEdicion ? "Guarda los cambios del servicio" : "Agrega el servicio al catálogo"}
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
              {s.duracionMin ? textoDuracion(s.duracionMin) : s.duracion} · $
              {formatearPesos(s.precio)}
            </Text>
          </View>
          <View style={styles.acciones}>
            <BotonIcono
              icono="create-outline"
              color={colors.primaryText}
              etiqueta={`Editar ${s.nombre}`}
              ayuda="Abre el servicio en el formulario de arriba"
              onPress={() => editar(s)}
            />
            <BotonIcono
              icono="trash-outline"
              color={colors.peligroTexto}
              etiqueta={`Eliminar ${s.nombre}`}
              ayuda="Pide confirmación antes de eliminarlo"
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
