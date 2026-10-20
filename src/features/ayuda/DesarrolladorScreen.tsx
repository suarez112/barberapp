import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { Image, Linking, StyleSheet, Text, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Tocable from "@/components/ui/Tocable";
import { DESARROLLADOR as D } from "@/config/app";
import { useAppTheme } from "@/theme/ThemeProvider";
import { avisar } from "@/utils/dialogos";
import { useVolver } from "./volverAyuda";

type Enlace = {
  icono: ComponentProps<typeof Ionicons>["name"];
  texto: string;
  url: string;
};

const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");

// Tarjeta del desarrollador; los datos salen de src/config/app.ts y un dato vacío oculta su botón
export default function DesarrolladorScreen() {
  const { colors } = useAppTheme();
  const volver = useVolver();

  const todos: Enlace[] = [
    { icono: "logo-github", texto: "GitHub", url: D.github.trim() },
    { icono: "logo-linkedin", texto: "LinkedIn", url: D.linkedin.trim() },
    { icono: "mail-outline", texto: "Correo", url: D.correo.trim() ? `mailto:${D.correo.trim()}` : "" },
    {
      icono: "logo-whatsapp",
      texto: "WhatsApp",
      url: D.whatsapp.trim() ? `https://wa.me/${D.whatsapp.replace(/\D/g, "")}` : "",
    },
  ];
  const enlaces = todos.filter((e) => e.url !== "");

  const abrir = (e: Enlace) =>
    Linking.openURL(e.url).catch(() =>
      avisar("No se pudo abrir", `No se pudo abrir ${e.texto} en este celular.`, "error"),
    );

  return (
    <Pantalla cabecera={{ onVolver: volver }}>
      <View style={styles.contenedor}>
        <Text style={[styles.titulo, { color: colors.primaryText }]}>CONOCE AL DESARROLLADOR</Text>
        <View
          style={[styles.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
        >
          {D.foto.trim() ? (
            <Image
              accessibilityLabel={`Foto de ${D.nombre}`}
              source={{ uri: D.foto.trim() }}
              style={styles.foto}
            />
          ) : (
            <View style={[styles.foto, styles.iniciales, { backgroundColor: colors.primary }]}>
              <Text style={[styles.textoIniciales, { color: colors.onPrimary }]}>
                {iniciales(D.nombre)}
              </Text>
            </View>
          )}
          <Text style={[styles.nombre, { color: colors.textPrimary }]}>{D.nombre}</Text>
          {D.profesion ? (
            <Text style={[styles.profesion, { color: colors.primaryText }]}>{D.profesion}</Text>
          ) : null}
          {D.descripcion ? (
            <Text style={[styles.descripcion, { color: colors.textSecondary }]}>{D.descripcion}</Text>
          ) : null}
          <View style={styles.enlaces}>
            {enlaces.map((e) => (
              <Tocable
                key={e.texto}
                accessibilityRole="button"
                accessibilityLabel={e.texto}
                accessibilityHint={`Abre ${e.texto} para contactar al desarrollador`}
                style={[styles.enlace, { borderColor: colors.cardBorder }]}
                onPress={() => abrir(e)}
              >
                <Ionicons name={e.icono} size={22} color={colors.primaryText} />
                <Text style={[styles.textoEnlace, { color: colors.textPrimary }]}>{e.texto}</Text>
              </Tocable>
            ))}
          </View>
        </View>
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginTop: 24 },
  titulo: { fontSize: 18, fontWeight: "bold", textAlign: "center", letterSpacing: 1, marginBottom: 20 },
  tarjeta: { borderWidth: 1, borderRadius: 12, padding: 20, alignItems: "center" },
  foto: { width: 110, height: 110, borderRadius: 55 },
  iniciales: { alignItems: "center", justifyContent: "center" },
  textoIniciales: { fontSize: 38, fontWeight: "bold" },
  nombre: { fontSize: 20, fontWeight: "bold", marginTop: 14, textAlign: "center" },
  profesion: { fontSize: 14, fontWeight: "600", marginTop: 2, textAlign: "center" },
  descripcion: { fontSize: 14, lineHeight: 20, marginTop: 12, textAlign: "center" },
  enlaces: { alignSelf: "stretch", marginTop: 18, gap: 10 },
  enlace: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 8,
  },
  textoEnlace: { fontSize: 15, fontWeight: "600" },
});
