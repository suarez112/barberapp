import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { describirError } from "@/services/api/errores";
import { useAppTheme } from "@/theme/ThemeProvider";
import { Producto } from "@/types";
import { formatearPesos } from "@/utils/formato";
import { listarCatalogo } from "./api";

// Catálogo de productos que ve el cliente (solo lectura)
export default function CatalogoProductos({ codigo }: { codigo: string }) {
  const { colors } = useAppTheme();
  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    listarCatalogo(codigo)
      .then((lista) => vigente && setProductos(lista))
      .catch(
        (e) =>
          vigente &&
          setError(
            describirError(e, {
              titulo: "",
              porDefecto: "No se pudo cargar el catálogo.",
            }).mensaje,
          ),
      );
    return () => {
      vigente = false;
    };
  }, [codigo]);

  if (error) {
    return <Text style={[styles.vacio, { color: colors.textSecondary }]}>{error}</Text>;
  }
  if (!productos) return <ActivityIndicator color={colors.primaryText} style={styles.vacio} />;
  if (productos.length === 0) {
    return (
      <Text style={[styles.vacio, { color: colors.textSecondary }]}>
        Pronto habrá productos disponibles.
      </Text>
    );
  }

  return (
    <View style={styles.grilla}>
      {productos.map((p) => (
        <View
          key={p.id}
          style={[
            styles.tarjeta,
            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          ]}
        >
          {p.fotoUrl ? (
            <Image
              source={{ uri: p.fotoUrl }}
              style={styles.foto}
              contentFit="cover"
              accessibilityLabel={`Foto de ${p.nombre}`}
            />
          ) : (
            <View style={[styles.foto, styles.sinFoto, { backgroundColor: colors.inputBg }]}>
              <Ionicons name="cube-outline" size={36} color={colors.textSecondary} />
            </View>
          )}
          <View style={styles.cuerpo}>
            <Text numberOfLines={2} style={[styles.nombre, { color: colors.textPrimary }]}>
              {p.nombre}
            </Text>
            {p.descripcion ? (
              <Text
                numberOfLines={3}
                style={[styles.descripcion, { color: colors.textSecondary }]}
              >
                {p.descripcion}
              </Text>
            ) : null}
            <Text style={[styles.precio, { color: colors.primaryText }]}>
              ${formatearPesos(p.precio)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  vacio: { textAlign: "center", marginTop: 20 },
  grilla: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tarjeta: { width: "48%", borderWidth: 1, borderRadius: 10, overflow: "hidden" },
  foto: { width: "100%", aspectRatio: 1 },
  sinFoto: { alignItems: "center", justifyContent: "center" },
  cuerpo: { padding: 10 },
  nombre: { fontWeight: "bold" },
  descripcion: { fontSize: 11, marginTop: 2 },
  precio: { fontWeight: "bold", marginTop: 4 },
});
