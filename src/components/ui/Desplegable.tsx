import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  ViewStyle,
} from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";
import Tocable from "./Tocable";

export type OpcionDesplegable<T extends string | number> = { valor: T; etiqueta: string };

type Props<T extends string | number> = {
  opciones: readonly OpcionDesplegable<T>[];
  valor: T | null;
  onCambiar: (valor: T) => void;
  // Texto cuando no hay nada elegido
  placeholder: string;
  // Título de la lista (por defecto el placeholder)
  titulo?: string;
  // Muestra un buscador arriba de la lista (útil con muchas opciones)
  buscable?: boolean;
  deshabilitado?: boolean;
  style?: StyleProp<ViewStyle>;
};

// Alto fijo de cada opción en las listas sin buscador: permite abrirlas ya
// desplazadas hasta la opción elegida (ej. las horas)
const ALTO_OPCION = 52;

// Sin tildes ni mayúsculas, para buscar "bogota" y encontrar "BOGOTÁ, D.C."
const simplificar = (texto: string) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Campo que abre una lista para elegir una opción
export default function Desplegable<T extends string | number>({
  opciones,
  valor,
  onCambiar,
  placeholder,
  titulo,
  buscable = false,
  deshabilitado = false,
  style,
}: Props<T>) {
  const { colors } = useAppTheme();
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const elegida = opciones.find((o) => o.valor === valor);
  const visibles = useMemo(() => {
    const texto = simplificar(busqueda.trim());
    return texto ? opciones.filter((o) => simplificar(o.etiqueta).includes(texto)) : opciones;
  }, [opciones, busqueda]);

  const indiceElegido = buscable ? -1 : opciones.findIndex((o) => o.valor === valor);

  const cerrar = () => {
    setAbierto(false);
    setBusqueda("");
  };

  return (
    <>
      <Tocable
        accessibilityRole="button"
        accessibilityLabel={titulo ?? placeholder}
        accessibilityHint={elegida ? `Elegido: ${elegida.etiqueta}` : undefined}
        accessibilityState={{ disabled: deshabilitado }}
        disabled={deshabilitado}
        onPress={() => setAbierto(true)}
        style={[
          styles.campo,
          { backgroundColor: colors.inputBg, borderColor: colors.cardBorder },
          deshabilitado && styles.deshabilitado,
          style,
        ]}
      >
        <Text
          numberOfLines={1}
          style={[styles.texto, { color: elegida ? colors.textPrimary : colors.textSecondary }]}
        >
          {elegida?.etiqueta ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </Tocable>

      <Modal visible={abierto} transparent animationType="fade" onRequestClose={cerrar}>
        <Pressable style={styles.overlay} onPress={cerrar}>
          {/* El Pressable interno evita que tocar la lista cierre el modal */}
          <Pressable
            style={[styles.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
          >
            <Text style={[styles.titulo, { color: colors.primary }]}>{titulo ?? placeholder}</Text>
            {buscable ? (
              <TextInput
                placeholder="Buscar…"
                placeholderTextColor={colors.textSecondary}
                value={busqueda}
                onChangeText={setBusqueda}
                autoCorrect={false}
                style={[
                  styles.buscador,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.cardBorder,
                    color: colors.textPrimary,
                  },
                ]}
              />
            ) : null}
            <FlatList
              data={visibles}
              keyExtractor={(o) => String(o.valor)}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={20}
              {...(indiceElegido > 2
                ? {
                    initialScrollIndex: indiceElegido - 2,
                    getItemLayout: (_: unknown, i: number) => ({
                      length: ALTO_OPCION,
                      offset: ALTO_OPCION * i,
                      index: i,
                    }),
                  }
                : {})}
              ListEmptyComponent={
                <Text style={[styles.vacio, { color: colors.textSecondary }]}>Sin resultados</Text>
              }
              renderItem={({ item }) => {
                const activa = item.valor === valor;
                return (
                  <Tocable
                    accessibilityRole="button"
                    accessibilityState={{ selected: activa }}
                    onPress={() => {
                      onCambiar(item.valor);
                      cerrar();
                    }}
                    style={[
                      styles.opcion,
                      { borderColor: colors.cardBorder },
                      !buscable && styles.altoFijo,
                    ]}
                  >
                    <Text
                      style={[
                        styles.textoOpcion,
                        { color: activa ? colors.primary : colors.textPrimary },
                        activa && styles.activa,
                      ]}
                    >
                      {item.etiqueta}
                    </Text>
                    {activa ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
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
  campo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    gap: 8,
  },
  deshabilitado: { opacity: 0.5 },
  texto: { flex: 1, fontSize: 14 },
  // Anclado arriba: si estuviera centrado, al esconderse el teclado la lista se
  // movería bajo el dedo y el primer toque no elegiría nada
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  tarjeta: { borderRadius: 20, borderWidth: 1, padding: 16, maxHeight: "100%" },
  titulo: { fontSize: 13, fontWeight: "bold", letterSpacing: 1, marginBottom: 10 },
  buscador: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 8 },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  altoFijo: { height: ALTO_OPCION, paddingVertical: 0 },
  textoOpcion: { fontSize: 15 },
  activa: { fontWeight: "bold" },
  vacio: { textAlign: "center", paddingVertical: 20 },
});
