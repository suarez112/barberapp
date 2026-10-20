import { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import { useAppTheme } from "@/theme/ThemeProvider";

type Props = {
  titulo: string;
  descripcion?: string;
  textoConfirmar: string;
  ayudaConfirmar: string;
  destructivo?: boolean;
  enviando: boolean;
  onConfirmar: () => void;
  onCerrar: () => void;
  children: ReactNode;
};

// Ventana centrada para una acción con campos (plan, días, motivo...)
export default function ModalAccion({
  titulo,
  descripcion,
  textoConfirmar,
  ayudaConfirmar,
  destructivo = false,
  enviando,
  onConfirmar,
  onCerrar,
  children,
}: Props) {
  const { colors } = useAppTheme();
  return (
    <Modal visible transparent animationType="fade" onRequestClose={enviando ? undefined : onCerrar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar ventana"
        accessibilityHint="Cancela la acción"
        disabled={enviando}
        style={styles.fondo}
        onPress={onCerrar}
      />
      <View pointerEvents="box-none" style={styles.centro}>
        <View style={[styles.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text accessibilityRole="header" style={[styles.titulo, { color: colors.textPrimary }]}>
              {titulo}
            </Text>
            {descripcion ? (
              <Text style={[styles.descripcion, { color: colors.textSecondary }]}>{descripcion}</Text>
            ) : null}
            {children}
            <Boton
              titulo={enviando ? "ENVIANDO..." : textoConfirmar}
              ayuda={ayudaConfirmar}
              variante={destructivo ? "peligro" : "primario"}
              deshabilitado={enviando}
              onPress={onConfirmar}
              style={styles.confirmar}
            />
            <Boton
              titulo="CANCELAR"
              ayuda="Cierra la ventana sin hacer cambios"
              variante="neutro"
              deshabilitado={enviando}
              onPress={onCerrar}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(0,0,0,0.6)" },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  tarjeta: { width: "100%", maxWidth: 480, maxHeight: "90%", borderWidth: 1, borderRadius: 12, padding: 24 },
  titulo: { fontSize: 20, fontWeight: "bold", marginBottom: 6 },
  descripcion: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  confirmar: { marginTop: 16 },
});
