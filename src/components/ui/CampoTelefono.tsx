import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from "react-native";
import { PAISES, nombrePais } from "@/data/paises";
import type { EstadoTelefono } from "@/hooks/useTelefono";
import { useAppTheme } from "@/theme/ThemeProvider";
import { bandera, indicativoDe } from "@/utils/telefonos";
import CampoTexto from "./CampoTexto";
import Tocable from "./Tocable";

type Props = {
  telefono: EstadoTelefono;
  etiqueta?: string;
  ayuda?: string;
  obligatorio?: boolean;
  style?: StyleProp<ViewStyle>;
  onSubmitEditing?: () => void;
};

const simplificar = (texto: string) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Teléfono con bandera y país (Colombia por defecto); se formatea mientras se escribe
export default function CampoTelefono({
  telefono,
  etiqueta = "Celular",
  ayuda = "Escribe el número sin el indicativo. Para otro país, toca la bandera.",
  obligatorio,
  style,
  onSubmitEditing,
}: Props) {
  const { colors } = useAppTheme();
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const { pais, indicativo } = telefono;

  const visibles = useMemo(() => {
    const texto = simplificar(busqueda.trim());
    if (!texto) return PAISES;
    return PAISES.filter(
      (p) =>
        simplificar(p.nombre).includes(texto) || indicativoDe(p.codigo).startsWith(texto.replace("+", "")),
    );
  }, [busqueda]);

  const cerrar = () => {
    setAbierto(false);
    setBusqueda("");
  };

  return (
    <>
      <CampoTexto
        etiqueta={etiqueta}
        ayuda={ayuda}
        obligatorio={obligatorio}
        error={telefono.error}
        style={style}
        placeholder={pais === "CO" ? "ej: 316 278 1393" : "ej: número de celular"}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        maxLength={20}
        value={telefono.texto}
        onChangeText={telefono.cambiarTexto}
        onSubmitEditing={onSubmitEditing}
        izquierda={
          <Tocable
            accessibilityRole="button"
            accessibilityLabel={`País: ${nombrePais(pais)}, más ${indicativo}`}
            accessibilityHint="Abre la lista de países para cambiar el indicativo"
            onPress={() => setAbierto(true)}
            style={[styles.pais, { borderRightColor: colors.inputBorder }]}
          >
            <Text style={styles.bandera}>{bandera(pais)}</Text>
            <Text style={[styles.indicativo, { color: colors.textPrimary }]}>+{indicativo}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
          </Tocable>
        }
      />

      <Modal visible={abierto} transparent animationType="fade" onRequestClose={cerrar}>
        <Pressable style={styles.fondo} onPress={cerrar} accessibilityLabel="Cerrar lista de países">
          {/* El Pressable interno evita que tocar la lista cierre el modal */}
          <Pressable
            style={[styles.lista, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
          >
            <Text style={[styles.titulo, { color: colors.primaryText }]}>ELIGE EL PAÍS</Text>
            <CampoTexto
              etiqueta="Buscar país"
              ayuda="Escribe el nombre del país o su indicativo"
              placeholder="ej: México o 52"
              autoCorrect={false}
              value={busqueda}
              onChangeText={setBusqueda}
            />
            <FlatList
              data={visibles}
              keyExtractor={(p) => p.codigo}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={[styles.vacio, { color: colors.textSecondary }]}>
                  No hay países con ese nombre
                </Text>
              }
              renderItem={({ item }) => {
                const activo = item.codigo === pais;
                return (
                  <Tocable
                    accessibilityRole="button"
                    accessibilityState={{ selected: activo }}
                    accessibilityLabel={`${item.nombre}, más ${indicativoDe(item.codigo)}`}
                    accessibilityHint="Elige este país para el teléfono"
                    style={[styles.opcion, { borderBottomColor: colors.cardBorder }]}
                    onPress={() => {
                      telefono.elegirPais(item.codigo);
                      cerrar();
                    }}
                  >
                    <Text style={styles.bandera}>{bandera(item.codigo)}</Text>
                    <Text
                      style={[
                        styles.nombre,
                        { color: activo ? colors.primaryText : colors.textPrimary },
                        activo && styles.negrita,
                      ]}
                    >
                      {item.nombre}
                    </Text>
                    <Text style={{ color: colors.textSecondary }}>+{indicativoDe(item.codigo)}</Text>
                  </Tocable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pais: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 48,
    paddingHorizontal: 10,
    borderRightWidth: 1,
  },
  bandera: { fontSize: 20 },
  indicativo: { fontWeight: "bold", fontSize: 15 },
  fondo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  lista: { borderWidth: 1, borderRadius: 16, padding: 16, maxHeight: "100%" },
  titulo: { fontSize: 13, fontWeight: "bold", letterSpacing: 1, marginBottom: 10 },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  nombre: { flex: 1, fontSize: 15 },
  negrita: { fontWeight: "bold" },
  vacio: { textAlign: "center", paddingVertical: 20 },
});
