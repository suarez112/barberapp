import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Acordeon from "@/components/ui/Acordeon";
import BotonesFormulario from "@/components/ui/BotonesFormulario";
import BotonIcono from "@/components/ui/BotonIcono";
import CampoTexto from "@/components/ui/CampoTexto";
import { estilosTexto } from "@/components/ui/estilosTexto";
import TarjetaFila from "@/components/ui/TarjetaFila";
import TextoInfo from "@/components/ui/TextoInfo";
import TituloSeccion from "@/components/ui/TituloSeccion";
import Tocable from "@/components/ui/Tocable";
import { useFormularioEdicion } from "@/hooks/useFormularioEdicion";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { Producto } from "@/types";
import { avisar, confirmar } from "@/utils/dialogos";
import { formatearPesos } from "@/utils/formato";
import { elegirFoto, FotoElegida } from "@/utils/imagenes";
import { useAvisarError } from "../sesion/useAvisarError";
import {
  actualizarProducto,
  crearProducto,
  eliminarProducto,
  listarProductos,
  quitarFotoProducto,
  subirFotoProducto,
} from "./api";

type Campos = {
  nombre: string;
  precio: string;
  descripcion: string;
  // Foto guardada en el servidor y foto nueva elegida (aún sin subir)
  fotoUrl: string | null;
  fotoNueva: FotoElegida | null;
  quitarFoto: boolean;
};

const VACIO: Campos = {
  nombre: "",
  precio: "",
  descripcion: "",
  fotoUrl: null,
  fotoNueva: null,
  quitarFoto: false,
};

const aCampos = (p: Producto): Campos => ({
  nombre: p.nombre,
  precio: String(p.precio),
  descripcion: p.descripcion ?? "",
  fotoUrl: p.fotoUrl,
  fotoNueva: null,
  quitarFoto: false,
});

export default function ProductosAdmin({ token }: { token: string }) {
  const { colors } = useAppTheme();
  const avisarError = useAvisarError();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const { abierto, alternar, enEdicion, campos, cambiar, editar, reiniciar } =
    useFormularioEdicion(VACIO, aCampos);

  const cargar = useCallback(
    () =>
      listarProductos(token)
        .then(setProductos)
        .catch((e) => avisarError(e, { titulo: "No se pudieron cargar los productos" }))
        .finally(() => setCargando(false)),
    // avisarError cambia en cada render; basta el token
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token],
  );

  useEffect(() => {
    cargar();
  }, [cargar]);

  const elegir = async () => {
    const foto = await elegirFoto({ aspecto: [1, 1] });
    if (foto) {
      cambiar("fotoNueva")(foto);
      cambiar("quitarFoto")(false);
    }
  };

  const quitarFoto = () => {
    cambiar("fotoNueva")(null);
    cambiar("quitarFoto")(true);
  };

  const guardar = async () => {
    const precio = Number(campos.precio.replace(/[^\d.]/g, ""));
    if (!campos.nombre.trim() || !campos.precio.trim() || isNaN(precio)) {
      avisar("Faltan datos", "Escribe el nombre y el precio del producto.");
      return;
    }
    if (guardando) return;
    const datos = {
      nombre: campos.nombre.trim(),
      precio,
      descripcion: campos.descripcion.trim() || null,
    };

    setGuardando(true);
    try {
      // Primero los datos; la foto se sube aparte cuando el producto ya existe
      const producto = enEdicion
        ? await actualizarProducto(token, enEdicion.id, datos)
        : await crearProducto(token, datos);
      if (campos.fotoNueva) {
        await subirFotoProducto(token, producto.id, campos.fotoNueva);
      } else if (campos.quitarFoto && enEdicion?.fotoUrl) {
        await quitarFotoProducto(token, producto.id);
      }
      avisar(
        enEdicion ? "¡Actualizado!" : "¡Producto creado!",
        `${producto.nombre} quedó guardado en el catálogo.`,
      );
      reiniciar();
    } catch (e) {
      avisarError(e, { titulo: "No se pudo guardar el producto" });
    } finally {
      setGuardando(false);
      // Recarga aunque falle la foto: los datos pudieron guardarse
      cargar();
    }
  };

  const eliminar = async (p: Producto) => {
    const ok = await confirmar({
      titulo: "Confirmar",
      mensaje: `¿Eliminar producto "${p.nombre}"?`,
      textoConfirmar: "Eliminar",
      destructivo: true,
    });
    if (!ok) return;
    try {
      await eliminarProducto(token, p.id);
      setProductos((prev) => prev.filter((x) => x.id !== p.id));
      if (enEdicion?.id === p.id) reiniciar();
    } catch (e) {
      avisarError(e, { titulo: "No se pudo eliminar" });
    }
  };

  const fotoMostrada = campos.fotoNueva?.uri ?? (campos.quitarFoto ? null : campos.fotoUrl);

  return (
    <View>
      <Acordeon
        titulo={enEdicion ? "✏️ EDITANDO PRODUCTO" : "➕ AGREGAR NUEVO PRODUCTO"}
        abierto={abierto}
        onAlternar={alternar}
        style={styles.acordeon}
      >
        <Tocable
          accessibilityRole="button"
          accessibilityLabel="Elegir foto del producto"
          onPress={elegir}
          style={[styles.foto, { borderColor: colors.cardBorder }]}
        >
          {fotoMostrada ? (
            <Image source={{ uri: fotoMostrada }} style={styles.llenar} contentFit="cover" />
          ) : (
            <>
              <Ionicons name="camera" size={28} color={colors.textSecondary} />
              <Text style={[styles.agregarFoto, { color: colors.textSecondary }]}>
                Agregar foto (opcional)
              </Text>
            </>
          )}
        </Tocable>
        {fotoMostrada ? (
          <Tocable accessibilityRole="button" onPress={quitarFoto}>
            <Text style={[styles.quitarFoto, { color: COLORES.peligro }]}>Quitar foto</Text>
          </Tocable>
        ) : null}
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
        <CampoTexto
          placeholder="Descripción (opcional)"
          value={campos.descripcion}
          onChangeText={cambiar("descripcion")}
          multiline
        />
        <BotonesFormulario
          tituloGuardar={
            guardando ? "GUARDANDO…" : enEdicion ? "GUARDAR CAMBIOS" : "AGREGAR PRODUCTO"
          }
          onGuardar={guardar}
          onCancelar={reiniciar}
        />
      </Acordeon>

      <TituloSeccion style={styles.tituloLista}>
        PRODUCTOS ACTIVOS ({productos.length})
      </TituloSeccion>
      {cargando ? <ActivityIndicator color={colors.primary} /> : null}
      {!cargando && productos.length === 0 ? (
        <TextoInfo>Aún no has agregado productos.</TextoInfo>
      ) : null}
      {productos.map((p) => (
        <TarjetaFila key={p.id}>
          {p.fotoUrl ? (
            <Image source={{ uri: p.fotoUrl }} style={styles.miniatura} contentFit="cover" />
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
              {p.descripcion ? ` · ${p.descripcion}` : ""}
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
    marginBottom: 6,
    overflow: "hidden",
  },
  llenar: { width: "100%", height: "100%" },
  agregarFoto: { marginTop: 4 },
  quitarFoto: { fontSize: 12, fontWeight: "bold", marginBottom: 10, textAlign: "right" },
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
