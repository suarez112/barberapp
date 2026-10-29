import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BotonIcono from "@/components/ui/BotonIcono";
import { useAppTheme } from "@/theme/ThemeProvider";
import { Suscripcion } from "../cuenta/api";
import ListaPlanes from "./ListaPlanes";

type Props = {
  visible: boolean;
  onCerrar: () => void;
  suscripcion: Suscripcion | null;
  // Texto bajo el título (ej. por qué se abrieron los planes)
  nota?: string;
};

// Pantalla completa con los planes; se abre desde Mi suscripción y desde Equipo
export default function PlanesModal({ visible, onCerrar, suscripcion, nota }: Props) {
  const { colors } = useAppTheme();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCerrar}>
      <SafeAreaView style={[styles.pantalla, { backgroundColor: colors.bg }]}>
        <View style={styles.cabecera}>
          <Text style={[styles.titulo, { color: colors.primaryText }]}>PLANES</Text>
          <BotonIcono
            icono="close"
            tamano={26}
            color={colors.textPrimary}
            etiqueta="Cerrar planes"
            ayuda="Vuelve a la pantalla anterior"
            onPress={onCerrar}
          />
        </View>
        <ScrollView contentContainerStyle={styles.contenido}>
          {nota ? <Text style={[styles.nota, { color: colors.textSecondary }]}>{nota}</Text> : null}
          <ListaPlanes suscripcion={suscripcion} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  cabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  titulo: { fontSize: 18, fontWeight: "bold", letterSpacing: 1 },
  contenido: { paddingHorizontal: 16, paddingBottom: 30 },
  nota: { fontSize: 13, textAlign: "center", marginTop: 4 },
});
