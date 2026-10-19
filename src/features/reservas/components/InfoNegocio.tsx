import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ComponentProps, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { obtenerPerfilPublico, PerfilPublico } from "@/features/negocio/api";
import { useAppTheme } from "@/theme/ThemeProvider";
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
      .catch((error) => console.error("Error al cargar el perfil:", error));
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
});
