import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
    Alert,
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Paleta } from "@/theme/paleta";
import { Producto } from "@/types";


interface Props {
  colors: Paleta;
  modo: "admin" | "cliente";
  empresaId: string;
  productos: Producto[];
  onAgregar?: (p: Producto) => void;
  onEliminar?: (id: string) => void;
}

export default function CatalogoProductos({
  colors,
  modo,
  empresaId,
  productos,
  onAgregar,
  onEliminar,
}: Props) {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [foto, setFoto] = useState<string | undefined>(undefined);

  const lista = productos.filter((p) => p.empresaId === empresaId);

  const elegirFoto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!r.canceled && r.assets?.length) setFoto(r.assets[0].uri);
  };

  const guardar = () => {
    const valor = parseInt(precio.replace(/\D/g, ""), 10);
    if (!nombre.trim() || !valor) {
      Alert.alert(
        "Faltan datos",
        "Escribe el nombre y el precio del producto.",
      );
      return;
    }
    onAgregar?.({
      id: Date.now().toString(),
      empresaId,
      nombre: nombre.trim(),
      precio: valor,
      foto,
    });
    setNombre("");
    setPrecio("");
    setFoto(undefined);
  };

  const confirmarEliminar = (p: Producto) =>
    Alert.alert("Eliminar producto", `¿Quitar "${p.nombre}" del catálogo?`, [
      { text: "No", style: "cancel" },
      {
        text: "Sí, eliminar",
        style: "destructive",
        onPress: () => onEliminar?.(p.id),
      },
    ]);

  const input = {
    backgroundColor: colors.inputBg,
    borderColor: colors.cardBorder,
    color: colors.textPrimary,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  } as const;

  return (
    <View>
      {modo === "admin" && (
        <View
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
            borderWidth: 1,
            borderRadius: 10,
            padding: 14,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: colors.primary,
              fontWeight: "bold",
              marginBottom: 10,
            }}
          >
            ➕ NUEVO PRODUCTO
          </Text>

          <TouchableOpacity
            onPress={elegirFoto}
            style={{
              height: 120,
              borderRadius: 8,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: colors.cardBorder,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 10,
              overflow: "hidden",
            }}
          >
            {foto ? (
              <Image
                source={{ uri: foto }}
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <>
                <Ionicons
                  name="camera"
                  size={28}
                  color={colors.textSecondary}
                />
                <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
                  Agregar foto
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TextInput
            style={input}
            placeholder="Nombre del producto"
            placeholderTextColor={colors.textSecondary}
            value={nombre}
            onChangeText={setNombre}
          />
          <TextInput
            style={input}
            placeholder="Precio (ej: 25000)"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={precio}
            onChangeText={setPrecio}
          />

          <TouchableOpacity
            onPress={guardar}
            style={{
              backgroundColor: colors.primary,
              padding: 13,
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ fontWeight: "bold", color: "#000" }}>
              Agregar al catálogo
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {lista.length === 0 ? (
        <Text
          style={{
            color: colors.textSecondary,
            textAlign: "center",
            marginTop: 20,
          }}
        >
          {modo === "admin"
            ? "Aún no has agregado productos."
            : "Pronto habrá productos disponibles."}
        </Text>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {lista.map((p) => (
            <View
              key={p.id}
              style={{
                width: "48%",
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
                borderWidth: 1,
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              {p.foto ? (
                <Image
                  source={{ uri: p.foto }}
                  style={{ width: "100%", aspectRatio: 1 }}
                />
              ) : (
                <View
                  style={{
                    width: "100%",
                    aspectRatio: 1,
                    backgroundColor: colors.inputBg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name="cube-outline"
                    size={36}
                    color={colors.textSecondary}
                  />
                </View>
              )}
              <View style={{ padding: 10 }}>
                <Text
                  numberOfLines={2}
                  style={{ color: colors.textPrimary, fontWeight: "bold" }}
                >
                  {p.nombre}
                </Text>
                <Text
                  style={{
                    color: colors.primary,
                    fontWeight: "bold",
                    marginTop: 4,
                  }}
                >
                  ${p.precio.toLocaleString("es-CO")}
                </Text>
                {modo === "admin" && (
                  <TouchableOpacity
                    onPress={() => confirmarEliminar(p)}
                    style={{ marginTop: 8, alignItems: "center" }}
                  >
                    <Text
                      style={{
                        color: "#EF4444",
                        fontWeight: "bold",
                        fontSize: 12,
                      }}
                    >
                      Eliminar
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
