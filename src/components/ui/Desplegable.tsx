import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";
import CampoTexto from "./CampoTexto";
import Tocable from "./Tocable";

export type OpcionDesplegable<T extends string | number> = { valor: T; etiqueta: string };

type Props<T extends string | number> = {
  opciones: readonly OpcionDesplegable<T>[];
  valor: T | null;
  onCambiar: (valor: T) => void;
  // Etiqueta visible arriba del campo
  etiqueta: string;
  // Qué se elige, para el lector de pantalla
  ayuda?: string;
  // Qué corregir; se muestra debajo
  error?: string | null;
  obligatorio?: boolean;
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
  etiqueta,
  ayuda,
  error,
  obligatorio = false,
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
      <View style={[styles.contenedor, style]}>
        <Text style={[styles.etiqueta, { color: colors.textPrimary }]}>
          {etiqueta}
          {obligatorio ? " *" : ""}
        </Text>
        <Tocable
          accessibilityRole="button"
          accessibilityLabel={`${etiqueta}${obligatorio ? ", obligatorio" : ""}: ${
            elegida?.etiqueta ?? "sin elegir"
          }`}
          accessibilityHint={[error ? `Error: ${error}` : null, ayuda ?? "Abre la lista de opciones"]
            .filter(Boolean)
            .join(". ")}
          accessibilityState={{ disabled: deshabilitado }}
          disabled={deshabilitado}
          onPress={() => setAbierto(true)}
          style={[
            styles.campo,
            {
              backgroundColor: colors.inputBg,
              borderColor: error ? colors.error : colors.inputBorder,
            },
            error ? styles.campoConError : null,
            deshabilitado && styles.deshabilitado,
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
        {error ? (
          <Text accessibilityLiveRegion="polite" style={[styles.error, { color: colors.error }]}>
            {error}
          </Text>
        ) : null}
      </View>

      <Modal visible={abierto} transparent animationType="fade" onRequestClose={cerrar}>
        <Pressable style={styles.overlay} onPress={cerrar}>
          {/* El Pressable interno evita que tocar la lista cierre el modal */}
          <Pressable
            style={[styles.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
          >
            <Text style={[styles.titulo, { color: colors.primaryText }]}>{titulo ?? etiqueta}</Text>
            {buscable ? (
              <CampoTexto
                etiqueta="Buscar"
                ayuda="Filtra la lista mientras escribes"
                placeholder="ej: escribe parte del nombre"
                value={busqueda}
                onChangeText={setBusqueda}
                autoCorrect={false}
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
                    accessibilityLabel={item.etiqueta}
                    accessibilityHint={`Elige esta opción para ${etiqueta.toLowerCase()}`}
                    onPress={() => {
                      onCambiar(item.valor);
                      cerrar();
                    }}
                    style={[
                      styles.opcion,
                      { borderColor: colors.cardBorder },
                      activa && { backgroundColor: colors.cardSelectedBg },
                      !buscable && styles.altoFijo,
                    ]}
                  >
                    <Text
                      style={[
                        styles.textoOpcion,
                        { color: activa ? colors.primaryText : colors.textPrimary },
                        activa && styles.activa,
                      ]}
                    >
                      {item.etiqueta}
                    </Text>
                    {activa ? <Ionicons name="checkmark" size={18} color={colors.primaryText} /> : null}
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
  contenedor: { marginBottom: 12 },
  etiqueta: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  campo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  campoConError: { borderWidth: 2 },
  error: { fontSize: 12, marginTop: 4, lineHeight: 16 },
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
