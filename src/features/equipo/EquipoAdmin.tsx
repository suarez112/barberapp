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

const VACIO = { nombre: "", usuario: "", clave: "", especialidad: "", porcentaje: "" };
const ESPECIALIDAD_POR_DEFECTO = "Estilista · Especialista";
const PORCENTAJE_POR_DEFECTO = 50;

const aCampos = (b: Barbero) => ({
  nombre: b.nombre,
  usuario: b.usuario,
  clave: b.clave,
  especialidad: b.especialidad,
  porcentaje: b.porcentajeGanancia.toString(),
});

export default function EquipoAdmin() {
  const { colors } = useAppTheme();
  const { empresa, barberos, setBarberos } = useNegocio();
  const { barbero: logueado, actualizarBarberoLogueado } = useSesion();
  const { abierto, alternar, enEdicion, campos, cambiar, editar, reiniciar } =
    useFormularioEdicion(VACIO, aCampos);

  const guardar = () => {
    if (!campos.nombre.trim() || !campos.usuario.trim() || !campos.clave.trim()) {
      avisar(
        "Datos Incompletos",
        "Completa Nombre, Usuario y Contraseña para el integrante.",
      );
      return;
    }

    const pct = parseFloat(campos.porcentaje);
    const datos = {
      nombre: campos.nombre.trim(),
      usuario: campos.usuario.trim().toLowerCase(),
      clave: campos.clave.trim(),
      especialidad: campos.especialidad.trim() || ESPECIALIDAD_POR_DEFECTO,
      porcentajeGanancia: isNaN(pct) ? PORCENTAJE_POR_DEFECTO : pct,
    };

    if (enEdicion) {
      setBarberos(
        barberos.map((b) => (b.id === enEdicion.id ? { ...b, ...datos } : b)),
      );
      if (logueado?.id === enEdicion.id) actualizarBarberoLogueado(datos);
      avisar("¡Actualizado!", `Los datos de "${campos.nombre}" han sido guardados.`);
    } else {
      const nuevo: Barbero = {
        id: Date.now().toString(),
        esAdmin: false,
        equipo: `${empresa?.nombre} TEAM`,
        ...datos,
      };
      setBarberos([...barberos, nuevo]);
      avisar(
        "¡Éxito!",
        `${nuevo.nombre} registrado con ${nuevo.porcentajeGanancia}% de ganancia.`,
      );
    }
    reiniciar();
  };

  const eliminar = async (b: Barbero) => {
    if (b.esAdmin) {
      avisar(
        "Acción no permitida",
        "No se puede eliminar la cuenta del Administrador principal.",
      );
      return;
    }
    const ok = await confirmar({
      titulo: "Confirmar",
      mensaje: `¿Deseas retirar a ${b.nombre} del equipo?`,
      textoConfirmar: "Eliminar",
      destructivo: true,
    });
    if (!ok) return;
    setBarberos(barberos.filter((x) => x.id !== b.id));
    if (enEdicion?.id === b.id) reiniciar();
    avisar("Eliminado", `${b.nombre} retirado.`);
  };

  const cambiarFoto = (id: string, foto: string) => {
    setBarberos(barberos.map((b) => (b.id === id ? { ...b, foto } : b)));
    if (logueado?.id === id) actualizarBarberoLogueado({ foto });
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
          placeholder="Contraseña"
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
              onCambiar={(uri) => cambiarFoto(b.id, uri)}
            />
            <Text style={[estilosTexto.titulo, { color: colors.textPrimary }]}>
              {b.nombre} {b.esAdmin ? "👑 (Admin)" : null}
            </Text>
            <Text style={[estilosTexto.subtitulo, { color: colors.textSecondary }]}>
              {b.especialidad} · Comisión: {b.porcentajeGanancia}%
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
            {!b.esAdmin ? (
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
