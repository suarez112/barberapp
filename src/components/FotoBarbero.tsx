import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import FotoImagen from "@/components/ui/FotoImagen";
import { COLORES } from "@/theme/paleta";
import { useAppTheme } from "@/theme/ThemeProvider";
import { elegirFoto as abrirGaleria, FotoElegida } from "@/utils/imagenes";

type Props = {
  nombre: string;
  foto?: string;
  color: string;
  size?: number;
  editable?: boolean;
  forma?: "circulo" | "rectangulo";
  // Si devuelve una promesa, se muestra un indicador mientras se sube la foto
  onCambiar?: (foto: FotoElegida) => void | Promise<void>;
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
  const { colors } = useAppTheme();
  const [subiendo, setSubiendo] = useState(false);
  // Si no hay foto, se muestran las iniciales (Jhon Álvarez -> JA)
  const iniciales = nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

  const elegirFoto = async () => {
    if (!onCambiar || subiendo) return;
    // Recorte vertical, como un afiche
    const foto = await abrirGaleria({ aspecto: [4, 5], calidad: 0.6 });
    if (!foto) return;
    setSubiendo(true);
    try {
      await onCambiar(foto);
    } finally {
      setSubiendo(false);
    }
  };

  // ---------- FORMA RECTANGULAR (vista del cliente) ----------
  // Los márgenes negativos cancelan el espacio interno de la tarjeta (12)
  // para que la foto llegue hasta los bordes.
  if (forma === "rectangulo") {
    return (
      <View style={{ marginHorizontal: -12, marginTop: -12, marginBottom: 10 }}>
        {foto ? (
          <FotoImagen uri={foto} enLista style={{ width: "100%", aspectRatio: 4 / 5 }} />
        ) : (
          <View
            style={{
              width: "100%",
              aspectRatio: 4 / 5,
              backgroundColor: colors.inicialesBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.inicialesTexto, fontWeight: "bold", fontSize: 40 }}>
              {iniciales}
            </Text>
          </View>
        )}
      </View>
    );
  }

  // ---------- FORMA CIRCULAR (pantalla del administrador) ----------
  const circulo = foto ? (
    <FotoImagen
      uri={foto}
      enLista
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
        backgroundColor: colors.inicialesBg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: colors.inicialesTexto, fontWeight: "bold", fontSize: size / 3 }}>
        {iniciales}
      </Text>
    </View>
  );

  if (!editable) {
    return <View style={{ marginBottom: 8 }}>{circulo}</View>;
  }

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Foto de ${nombre}`}
      accessibilityHint={subiendo ? "Subiendo la foto" : "Abre tu galería para cambiar la foto"}
      accessibilityState={{ busy: subiendo }}
      onPress={elegirFoto}
      activeOpacity={0.8}
      style={{ width: size, height: size, marginBottom: 8 }}
    >
      {circulo}
      {subiendo ? (
        <View
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: "rgba(0,0,0,0.55)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator color={COLORES.blanco} />
        </View>
      ) : null}
      {/* Círculo blanco con borde e ícono oscuros: se ve igual en tema claro y oscuro */}
      <View
        style={{
          position: "absolute",
          right: -4,
          bottom: -4,
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: COLORES.blanco,
          borderWidth: 1.5,
          borderColor: COLORES.negro,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="camera" size={13} color={COLORES.negro} />
      </View>
    </TouchableOpacity>
  );
}
