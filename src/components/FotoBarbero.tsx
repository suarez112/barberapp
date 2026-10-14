import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image, Text, TouchableOpacity, View } from "react-native";

type Props = {
  nombre: string;
  foto?: string;
  color: string;
  size?: number;
  editable?: boolean;
  forma?: "circulo" | "rectangulo";
  onCambiar?: (uri: string) => void;
};

export default function FotoBarbero({
  nombre,
  foto,
  color,
  size = 56,
  editable = false,
  forma = "circulo",
  onCambiar,
}: Props) {
  // Si no hay foto, se muestran las iniciales (Jhon Álvarez -> JA)
  const iniciales = nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

  const elegirFoto = async () => {
    if (!onCambiar) return;
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 5], // recorte vertical, como un afiche
      quality: 0.6,
    });
    if (!resultado.canceled) {
      onCambiar(resultado.assets[0].uri);
    }
  };

  // ---------- FORMA RECTANGULAR (vista del cliente) ----------
  // Los márgenes negativos cancelan el espacio interno de la tarjeta (12)
  // para que la foto llegue hasta los bordes.
  if (forma === "rectangulo") {
    return (
      <View style={{ marginHorizontal: -12, marginTop: -12, marginBottom: 10 }}>
        {foto ? (
          <Image
            source={{ uri: foto }}
            style={{ width: "100%", aspectRatio: 4 / 5 }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: "100%",
              aspectRatio: 4 / 5,
              backgroundColor: "#262626",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color, fontWeight: "bold", fontSize: 40 }}>
              {iniciales}
            </Text>
          </View>
        )}
      </View>
    );
  }

  // ---------- FORMA CIRCULAR (pantalla del administrador) ----------
  const circulo = foto ? (
    <Image
      source={{ uri: foto }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: color,
      }}
    />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: color,
        backgroundColor: "#262626",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color, fontWeight: "bold", fontSize: size / 3 }}>
        {iniciales}
      </Text>
    </View>
  );

  if (!editable) {
    return <View style={{ marginBottom: 8 }}>{circulo}</View>;
  }

  return (
    <TouchableOpacity
      onPress={elegirFoto}
      activeOpacity={0.8}
      style={{ width: size, height: size, marginBottom: 8 }}
    >
      {circulo}
      <View
        style={{
          position: "absolute",
          right: -2,
          bottom: -2,
          backgroundColor: color,
          borderRadius: 10,
          padding: 3,
        }}
      >
        <Ionicons name="camera" size={12} color="#000" />
      </View>
    </TouchableOpacity>
  );
}
