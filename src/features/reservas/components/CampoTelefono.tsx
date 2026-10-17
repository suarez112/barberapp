import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Tocable from "@/components/ui/Tocable";
import CampoTexto from "@/components/ui/CampoTexto";
import { PAISES } from "@/data/paises";
import { useAppTheme } from "@/theme/ThemeProvider";

type Props = {
  telefono: string;
  indicativo: string;
  onCambiarTelefono: (valor: string) => void;
  onElegirPais: (indicativo: string) => void;
};

// Teléfono con indicativo del país (se detecta solo o se elige de la lista)
export default function CampoTelefono({
  telefono,
  indicativo,
  onCambiarTelefono,
  onElegirPais,
}: Props) {
  const { colors } = useAppTheme();
  const [mostrarPaises, setMostrarPaises] = useState(false);
  const nombrePais =
    PAISES.find((p) => p.indicativo === indicativo)?.nombre ?? `+${indicativo}`;

  const elegir = (nuevo: string) => {
    onElegirPais(nuevo);
    setMostrarPaises(false);
  };

  return (
    <>
      <View style={styles.fila}>
        <Tocable
          style={[
            styles.botonPais,
            { backgroundColor: colors.inputBg, borderColor: colors.cardBorder },
          ]}
          onPress={() => setMostrarPaises(true)}
          accessibilityRole="button"
          accessibilityLabel="Elegir indicativo del país"
        >
          <Text style={[styles.negrita, { color: colors.textPrimary }]}>
            +{indicativo}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
        </Tocable>
        <CampoTexto
          style={styles.campo}
          placeholder="Teléfono / Celular"
          keyboardType="phone-pad"
          value={telefono}
          onChangeText={onCambiarTelefono}
        />
      </View>
      {telefono.trim() !== "" ? (
        <Text style={[styles.pista, { color: colors.textSecondary }]}>
          País: {nombrePais} · si no es, toca el +{indicativo} para cambiarlo
        </Text>
      ) : null}

      <Modal
        visible={mostrarPaises}
        transparent
        animationType="fade"
        onRequestClose={() => setMostrarPaises(false)}
      >
        <Pressable style={styles.fondo} onPress={() => setMostrarPaises(false)}>
          <View
            style={[
              styles.lista,
              { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
            ]}
          >
            <ScrollView style={styles.scroll}>
              {PAISES.map((p) => (
                <Tocable
                  key={p.indicativo}
                  accessibilityRole="button"
                  style={styles.pais}
                  onPress={() => elegir(p.indicativo)}
                >
                  <Text
                    style={[
                      styles.negrita,
                      {
                        color:
                          p.indicativo === indicativo
                            ? colors.primary
                            : colors.textPrimary,
                      },
                    ]}
                  >
                    {p.nombre}
                  </Text>
                  <Text style={{ color: colors.textSecondary }}>
                    +{p.indicativo}
                  </Text>
                </Tocable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: "row", gap: 8 },
  botonPais: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  negrita: { fontWeight: "bold" },
  campo: { flex: 1 },
  pista: { fontSize: 11, marginTop: -4, marginBottom: 10 },
  fondo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 24,
  },
  lista: { borderWidth: 1, borderRadius: 10, padding: 8 },
  scroll: { maxHeight: 380 },
  pais: { flexDirection: "row", justifyContent: "space-between", padding: 12 },
});
