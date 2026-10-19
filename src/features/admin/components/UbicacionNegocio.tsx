import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { registrarCausa } from "@/services/api/errores";
import { useAppTheme } from "@/theme/ThemeProvider";
import { avisar, confirmar } from "@/utils/dialogos";
import { PerfilEmpresa } from "../../cuenta/api";

type Props = {
  perfil: PerfilEmpresa;
  onGuardar: (latitud: number, longitud: number) => Promise<boolean>;
};

// Lee el GPS del celular y lo guarda como la ubicación del negocio en el mapa.
// Sirve solo si la persona está dentro del negocio en ese momento.
export default function UbicacionNegocio({ perfil, onGuardar }: Props) {
  const { colors } = useAppTheme();
  const [buscando, setBuscando] = useState(false);
  const guardada = perfil.latitud !== null && perfil.longitud !== null;

  const usarUbicacionActual = async () => {
    if (buscando) return;
    if (guardada) {
      const ok = await confirmar({
        titulo: "Cambiar ubicación",
        mensaje:
          "Se reemplazará la ubicación guardada por el lugar donde estás ahora. Hazlo solo si estás dentro del negocio.",
      });
      if (!ok) return;
    }
    setBuscando(true);
    try {
      const permiso = await Location.requestForegroundPermissionsAsync();
      if (permiso.status !== "granted") {
        avisar(
          "Permiso de ubicación",
          "Para guardar la ubicación del negocio, permite que la app use tu ubicación. Puedes activarlo en los ajustes del celular.",
        );
        return;
      }
      if (!(await Location.hasServicesEnabledAsync())) {
        avisar("Ubicación apagada", "Activa la ubicación (GPS) del celular e intenta de nuevo.");
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      await onGuardar(coords.latitude, coords.longitude);
    } catch (error) {
      registrarCausa("Ubicación del negocio", error);
      avisar(
        "No se pudo leer la ubicación",
        "El celular no pudo obtener tu ubicación. Revisa que el GPS esté activo e intenta de nuevo.",
        "error",
      );
    } finally {
      setBuscando(false);
    }
  };

  const verEnMapa = () => {
    if (perfil.googleMapsUrl) Linking.openURL(perfil.googleMapsUrl).catch(() => {});
  };

  return (
    <View>
      <TituloSeccion>UBICACIÓN EN EL MAPA</TituloSeccion>
      <View
        style={[styles.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
      >
        <Text style={[styles.estado, { color: colors.textPrimary }]}>
          {guardada ? "✓ Ubicación guardada" : "Sin ubicación guardada"}
        </Text>
        <Text style={[styles.nota, { color: colors.textSecondary }]}>
          Usa este botón estando dentro de tu negocio: se guarda el lugar donde está tu celular
          en ese momento. Tus clientes verán el botón &quot;Cómo llegar&quot;.
          {guardada ? "" : " Mientras tanto, el mapa usa la dirección escrita."}
        </Text>
        {guardada && perfil.googleMapsUrl ? (
          <Pressable accessibilityRole="link" onPress={verEnMapa}>
            <View style={styles.enlace}>
              <Ionicons name="map-outline" size={14} color={colors.primary} />
              <Text style={[styles.textoEnlace, { color: colors.primary }]}>Ver en el mapa</Text>
            </View>
          </Pressable>
        ) : null}
      </View>
      <Boton
        titulo={buscando ? "BUSCANDO UBICACIÓN…" : "USAR MI UBICACIÓN ACTUAL"}
        onPress={usarUbicacionActual}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 6, gap: 6 },
  estado: { fontSize: 13, fontWeight: "bold" },
  nota: { fontSize: 12 },
  enlace: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  textoEnlace: { fontSize: 13, fontWeight: "bold" },
});
