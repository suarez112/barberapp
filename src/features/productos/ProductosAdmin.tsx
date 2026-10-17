import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
import { Producto } from "@/types";
import { avisar, confirmar } from "@/utils/dialogos";
import { formatearPesos } from "@/utils/formato";
import { elegirImagenCuadrada } from "@/utils/imagenes";
import { useNegocio } from "../negocio/NegocioProvider";

type Campos = { nombre: string; precio: string; foto?: string };

const VACIO: Campos = { nombre: "", precio: "", foto: undefined };

const aCampos = (p: Producto): Campos => ({
  nombre: p.nombre,
  precio: p.precio.toString(),
  foto: p.foto,
});

export default function ProductosAdmin() {
  const { colors } = useAppTheme();
  const { empresa, productos, setProductos } = useNegocio();
  const { abierto, alternar, enEdicion, campos, cambiar, editar, reiniciar } =
    useFormularioEdicion(VACIO, aCampos);

  if (!empresa) return null;
  const delNegocio = productos.filter((p) => p.empresaId === empresa.id);

  const elegirFoto = async () => {
    const uri = await elegirImagenCuadrada();
    if (uri) cambiar("foto")(uri);
  };

  const guardar = () => {
    const precio = parseInt(campos.precio.replace(/\D/g, ""), 10);
    if (!campos.nombre.trim() || !precio) {
      avisar("Faltan datos", "Escribe el nombre y el precio del producto.");
      return;
    }
    const datos = { nombre: campos.nombre.trim(), precio, foto: campos.foto };

    if (enEdicion) {
      setProductos(
        productos.map((p) => (p.id === enEdicion.id ? { ...p, ...datos } : p)),
      );
    } else {
      setProductos([
        ...productos,
        { id: Date.now().toString(), empresaId: empresa.id, ...datos },
      ]);
    }
    reiniciar();
  };

  const eliminar = async (p: Producto) => {
    const ok = await confirmar({
      titulo: "Confirmar",
      mensaje: `¿Eliminar producto "${p.nombre}"?`,
      textoConfirmar: "Eliminar",
      destructivo: true,
    });
    if (!ok) return;
    setProductos(productos.filter((x) => x.id !== p.id));
    if (enEdicion?.id === p.id) reiniciar();
  };

  return (
    <View>
      <Acordeon
        titulo={enEdicion ? "✏️ EDITANDO PRODUCTO" : "➕ AGREGAR NUEVO PRODUCTO"}
        abierto={abierto}
        onAlternar={alternar}
        style={styles.acordeon}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Elegir foto del producto"
          onPress={elegirFoto}
          style={[styles.foto, { borderColor: colors.cardBorder }]}
        >
          {campos.foto ? (
            <Image source={{ uri: campos.foto }} style={styles.llenar} contentFit="cover" />
          ) : (
            <>
              <Ionicons name="camera" size={28} color={colors.textSecondary} />
              <Text style={[styles.agregarFoto, { color: colors.textSecondary }]}>
                Agregar foto
              </Text>
            </>
          )}
        </Pressable>
        <CampoTexto
          placeholder="Nombre del Producto"
          value={campos.nombre}
          onChangeText={cambiar("nombre")}
        />
        <CampoTexto
          placeholder="Precio en $ (Ej: 25000)"
          keyboardType="numeric"
          value={campos.precio}
          onChangeText={cambiar("precio")}
        />
        <BotonesFormulario
          tituloGuardar={enEdicion ? "GUARDAR CAMBIOS" : "AGREGAR PRODUCTO"}
          onGuardar={guardar}
          onCancelar={reiniciar}
        />
      </Acordeon>

      <TituloSeccion style={styles.tituloLista}>
        PRODUCTOS ACTIVOS ({delNegocio.length})
      </TituloSeccion>
      {delNegocio.map((p) => (
        <TarjetaFila key={p.id}>
          {p.foto ? (
            <Image source={{ uri: p.foto }} style={styles.miniatura} contentFit="cover" />
          ) : (
            <View style={[styles.miniatura, { backgroundColor: colors.inputBg }]}>
              <Ionicons name="cube-outline" size={22} color={colors.textSecondary} />
            </View>
          )}
          <View style={styles.flex}>
            <Text style={[estilosTexto.titulo, { color: colors.textPrimary }]}>
              {p.nombre}
            </Text>
            <Text style={[estilosTexto.subtitulo, { color: colors.textSecondary }]}>
              ${formatearPesos(p.precio)}
            </Text>
          </View>
          <View style={styles.acciones}>
            <BotonIcono
              icono="create-outline"
              color={colors.primary}
              etiqueta={`Editar ${p.nombre}`}
              onPress={() => editar(p)}
            />
            <BotonIcono
              icono="trash-outline"
              color={COLORES.peligro}
              etiqueta={`Eliminar ${p.nombre}`}
              onPress={() => eliminar(p)}
            />
          </View>
        </TarjetaFila>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  acordeon: { marginTop: 15 },
  tituloLista: { marginTop: 20 },
  foto: {
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    overflow: "hidden",
  },
  llenar: { width: "100%", height: "100%" },
  agregarFoto: { marginTop: 4 },
  miniatura: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  flex: { flex: 1 },
  acciones: { flexDirection: "row", gap: 12 },
});
