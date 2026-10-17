import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import BotonIcono from "@/components/ui/BotonIcono";
import { estilosTexto } from "@/components/ui/estilosTexto";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { useNotificaciones } from "./NotificacionesProvider";

type Props = { visible: boolean; onCerrar: () => void };

export default function ModalNotificaciones({ visible, onCerrar }: Props) {
  const { colors } = useAppTheme();
  const { notificaciones, eliminar, limpiar } = useNotificaciones();

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onCerrar}
    >
      <View style={styles.fondo}>
        <View
          style={[
            styles.tarjeta,
            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.cabecera}>
            <View style={styles.fila}>
              <Ionicons name="notifications" size={18} color={colors.primary} />
              <Text style={[styles.titulo, { color: colors.textPrimary }]}>
                Notificaciones
              </Text>
            </View>

            <View style={[styles.fila, styles.accionesCabecera]}>
              {notificaciones.length > 0 ? (
                <Pressable accessibilityRole="button" onPress={limpiar}>
                  <Text style={styles.limpiar}>Limpiar todas</Text>
                </Pressable>
              ) : null}
              <BotonIcono
                icono="close"
                tamano={22}
                color={colors.textSecondary}
                etiqueta="Cerrar notificaciones"
                onPress={onCerrar}
              />
            </View>
          </View>

          <ScrollView style={styles.lista}>
            {notificaciones.length === 0 ? (
              <Text
                style={[
                  estilosTexto.subtitulo,
                  styles.vacio,
                  { color: colors.textSecondary },
                ]}
              >
                No tienes notificaciones por revisar.
              </Text>
            ) : (
              notificaciones.map((n) => (
                <View
                  key={n.id}
                  style={[styles.item, { backgroundColor: colors.headerBg }]}
                >
                  <View style={styles.itemCabecera}>
                    <Text
                      style={[
                        estilosTexto.titulo,
                        styles.itemTitulo,
                        { color: colors.primary },
                      ]}
                    >
                      {n.titulo}
                    </Text>
                    <BotonIcono
                      icono="trash-outline"
                      tamano={16}
                      color={colors.textSecondary}
                      etiqueta="Eliminar notificación"
                      onPress={() => eliminar(n.id)}
                    />
                  </View>
                  <Text
                    style={[
                      estilosTexto.subtitulo,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {n.mensaje}
                  </Text>
                  <Text
                    style={[
                      estilosTexto.subtitulo,
                      styles.itemFecha,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {n.fecha}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  tarjeta: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    elevation: 10,
    boxShadow: "0px 4px 5px rgba(0, 0, 0, 0.3)",
  },
  cabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
    paddingBottom: 10,
  },
  fila: { flexDirection: "row", alignItems: "center", gap: 6 },
  accionesCabecera: { gap: 12 },
  titulo: { fontSize: 15, fontWeight: "bold" },
  limpiar: { fontSize: 11, color: COLORES.peligro, fontWeight: "bold" },
  lista: { maxHeight: 300, marginTop: 10 },
  vacio: { textAlign: "center", paddingVertical: 20 },
  item: { padding: 10, borderRadius: 6, marginBottom: 8 },
  itemCabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  itemTitulo: { fontSize: 13, flex: 1 },
  itemFecha: { fontSize: 10, textAlign: "right" },
});
