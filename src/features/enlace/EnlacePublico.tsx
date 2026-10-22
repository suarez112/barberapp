import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Share, StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import { registrarCausa } from "@/services/api/errores";
import { useAppTheme } from "@/theme/ThemeProvider";
import { avisar } from "@/utils/dialogos";

type Props = {
  enlace: string;
  nombreNegocio: string;
};

// Enlace público del negocio con sus botones Copiar y Compartir
export default function EnlacePublico({ enlace, nombreNegocio }: Props) {
  const { colors } = useAppTheme();

  const copiar = async () => {
    try {
      await Clipboard.setStringAsync(enlace);
      avisar("Enlace copiado", "Ya puedes pegarlo en WhatsApp, Instagram o donde quieras.", "exito");
    } catch (error) {
      registrarCausa("Copiar enlace", error);
      avisar("No se pudo copiar", "Intenta de nuevo o anota el enlace.", "error");
    }
  };

  const compartir = async () => {
    try {
      await Share.share({ message: `Reserva tu cita en ${nombreNegocio}: ${enlace}` });
    } catch (error) {
      registrarCausa("Compartir enlace", error);
      avisar("No se pudo compartir", "Intenta de nuevo o copia el enlace.", "error");
    }
  };

  return (
    <View>
      <View style={[styles.caja, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <Ionicons name="link-outline" size={20} color={colors.primaryText} />
        <Text
          selectable
          accessibilityLabel={`Enlace público: ${enlace}`}
          style={[styles.enlace, { color: colors.textPrimary }]}
        >
          {enlace}
        </Text>
      </View>
      <View style={styles.botones}>
        <Boton
          titulo="COPIAR"
          ayuda="Copia el enlace de tu negocio"
          variante="secundario"
          onPress={copiar}
          style={styles.boton}
        />
        <Boton
          titulo="COMPARTIR"
          ayuda="Abre las opciones para enviar el enlace de tu negocio"
          onPress={compartir}
          style={styles.boton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  caja: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: 48,
  },
  enlace: { flex: 1, fontSize: 14, fontWeight: "600" },
  botones: { flexDirection: "row", gap: 8, marginTop: 8 },
  boton: { flex: 1 },
});
