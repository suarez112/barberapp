import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { ComponentProps, useEffect, useState } from "react";
import { Linking, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { registrarCausa } from "@/services/api/errores";
import { obtenerPerfilPublico, PerfilPublico } from "@/features/negocio/api";
import { useAppTheme } from "@/theme/ThemeProvider";
import { avisar } from "@/utils/dialogos";
import { resumenHorario, textoDiasAtencion } from "@/utils/formato";

// Tarjeta con la foto y los datos del negocio que ve el cliente
export default function InfoNegocio({ codigo }: { codigo: string }) {
  const { colors } = useAppTheme();
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);

  useEffect(() => {
    let vigente = true;
    obtenerPerfilPublico(codigo)
      .then((p) => vigente && setPerfil(p))
      // Sin perfil se puede reservar igual: la tarjeta simplemente no aparece
      .catch((error) => registrarCausa("Perfil del negocio", error));
    return () => {
      vigente = false;
    };
  }, [codigo]);

  if (!perfil) return null;

  const ubicacion = [perfil.direccion, perfil.ciudad, perfil.departamento]
    .filter(Boolean)
    .join(", ");
  const horario = perfil.horario?.length
    ? resumenHorario(perfil.horario) || null
    : perfil.horarioApertura && perfil.horarioCierre
      ? `${perfil.diasAtencion?.length ? `${textoDiasAtencion(perfil.diasAtencion)} · ` : ""}${perfil.horarioApertura} a ${perfil.horarioCierre}`
      : null;

  const copiarCodigo = async () => {
    try {
      await Clipboard.setStringAsync(perfil.codigoAcceso);
      avisar("Código copiado", `Ya puedes pegar el código ${perfil.codigoAcceso}.`, "exito");
    } catch (error) {
      registrarCausa("Copiar código", error);
      avisar("No se pudo copiar", "Intenta de nuevo o anota el código.", "error");
    }
  };

  const compartirCodigo = async () => {
    try {
      await Share.share({
        message: `Reserva tu cita en ${perfil.nombre}. Abre la app y escribe el código del negocio: ${perfil.codigoAcceso}`,
      });
    } catch (error) {
      registrarCausa("Compartir código", error);
      avisar("No se pudo compartir", "Intenta de nuevo o copia el código.", "error");
    }
  };

  const comoLlegar = async () => {
    if (!perfil.googleMapsUrl) return;
    try {
      await Linking.openURL(perfil.googleMapsUrl);
    } catch (error) {
      registrarCausa("Cómo llegar", error);
      avisar("No se pudo abrir el mapa", "Revisa que tengas Google Maps o un navegador.", "error");
    }
  };

  const boton = (
    icono: ComponentProps<typeof Ionicons>["name"],
    texto: string,
    onPress: () => void,
  ) => (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.boton,
        { borderColor: colors.primary },
        pressed && styles.presionado,
      ]}
    >
      <Ionicons name={icono} size={16} color={colors.primary} />
      <Text style={[styles.textoBoton, { color: colors.primary }]}>{texto}</Text>
    </Pressable>
  );

  const dato = (icono: ComponentProps<typeof Ionicons>["name"], texto: string | null) =>
    texto ? (
      <View style={styles.dato}>
        <Ionicons name={icono} size={14} color={colors.primary} />
        <Text style={[styles.textoDato, { color: colors.textSecondary }]}>{texto}</Text>
      </View>
    ) : null;

  return (
    <View
      style={[
        styles.tarjeta,
        { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
      ]}
    >
      {perfil.fotoUrl ? (
        <Image
          source={{ uri: perfil.fotoUrl }}
          style={styles.foto}
          contentFit="cover"
          accessibilityLabel={`Foto de ${perfil.nombre}`}
        />
      ) : null}
      <View style={styles.cuerpo}>
        <Text style={[styles.nombre, { color: colors.textPrimary }]}>
          {perfil.nombre}
        </Text>
        {perfil.categoria ? (
          <Text style={[styles.categoria, { color: colors.primary }]}>
            {perfil.categoria}
          </Text>
        ) : null}
        {dato("location-outline", ubicacion || null)}
        {dato("time-outline", horario)}

        <View style={[styles.codigo, { borderColor: colors.cardBorder }]}>
          <Text style={[styles.textoCodigo, { color: colors.textSecondary }]}>
            Código del negocio:{" "}
            <Text style={[styles.valorCodigo, { color: colors.textPrimary }]}>
              {perfil.codigoAcceso}
            </Text>
          </Text>
          <View style={styles.botones}>
            {boton("copy-outline", "Copiar", copiarCodigo)}
            {boton("share-social-outline", "Compartir", compartirCodigo)}
          </View>
        </View>

        {perfil.googleMapsUrl ? (
          <View style={styles.botones}>{boton("navigate-outline", "Cómo llegar", comoLlegar)}</View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 10,
  },
  foto: { width: "100%", aspectRatio: 16 / 9 },
  cuerpo: { padding: 14, gap: 4 },
  nombre: { fontSize: 16, fontWeight: "bold" },
  categoria: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
  dato: { flexDirection: "row", alignItems: "center", gap: 6 },
  textoDato: { fontSize: 12, flex: 1 },
  codigo: { borderTopWidth: 1, marginTop: 8, paddingTop: 10, gap: 8 },
  textoCodigo: { fontSize: 13 },
  valorCodigo: { fontWeight: "bold", letterSpacing: 1 },
  botones: { flexDirection: "row", gap: 10 },
  boton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 9,
    marginTop: 2,
  },
  presionado: { opacity: 0.7 },
  textoBoton: { fontSize: 13, fontWeight: "bold" },
});
