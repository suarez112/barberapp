import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import TextoMarkdown from "@/components/ui/TextoMarkdown";
import { describirError, registrarCausa } from "@/services/api/errores";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { DocumentoLegal, TipoDocumento, obtenerDocumentoLegal } from "./api";

// Los textos casi nunca cambian: se piden una vez por cada vez que se abre la app
const cache = new Map<TipoDocumento, DocumentoLegal>();

type Props = {
  // Documento a mostrar; null = modal cerrado
  tipo: TipoDocumento | null;
  onCerrar: () => void;
};

// Política de datos o Términos en un modal con el estilo de los avisos de la app
export default function DocumentoLegalModal({ tipo, onCerrar }: Props) {
  const { colors } = useAppTheme();
  const [intento, setIntento] = useState(0);
  // Error del último intento de cargar ese documento
  const [fallo, setFallo] = useState<{ tipo: TipoDocumento; intento: number; mensaje: string } | null>(
    null,
  );
  // Al cargar, el documento queda en la caché y el modal vuelve a dibujarse
  const [, setCargados] = useState(0);

  const documento = tipo ? (cache.get(tipo) ?? null) : null;
  const error = fallo && fallo.tipo === tipo && fallo.intento === intento ? fallo.mensaje : null;

  useEffect(() => {
    if (!tipo || cache.has(tipo)) return;
    const controlador = new AbortController();
    obtenerDocumentoLegal(tipo, controlador.signal)
      .then((doc) => {
        cache.set(tipo, doc);
        setCargados((n) => n + 1);
      })
      .catch((e) => {
        if (controlador.signal.aborted) return;
        registrarCausa("Documento legal", e);
        setFallo({
          tipo,
          intento,
          mensaje: describirError(e, {
            titulo: "",
            porDefecto: "No se pudo cargar el documento.",
          }).mensaje,
        });
      });
    return () => controlador.abort();
  }, [tipo, intento]);

  return (
    <Modal animationType="fade" transparent visible={tipo !== null} onRequestClose={onCerrar}>
      <View style={styles.overlay}>
        <View
          style={[styles.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
        >
          {documento ? (
            <>
              <Text style={[styles.version, { color: colors.textSecondary }]}>
                Versión {documento.version}
              </Text>
              <ScrollView style={styles.contenido} showsVerticalScrollIndicator>
                <TextoMarkdown contenido={documento.contenido} />
              </ScrollView>
            </>
          ) : error ? (
            <View style={styles.estado}>
              <Text style={[styles.error, { color: COLORES.peligro }]}>{error}</Text>
              <Pressable
                accessibilityRole="button"
                style={[styles.botonSecundario, { borderColor: colors.cardBorder }]}
                onPress={() => setIntento((n) => n + 1)}
              >
                <Text style={[styles.textoSecundario, { color: colors.textPrimary }]}>
                  REINTENTAR
                </Text>
              </Pressable>
            </View>
          ) : (
            <ActivityIndicator color={colors.primary} style={styles.estado} />
          )}

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.boton,
              { backgroundColor: colors.primary },
              pressed && styles.presionado,
            ]}
            onPress={onCerrar}
          >
            <Text style={styles.textoBoton}>CERRAR</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  tarjeta: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "90%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  version: { fontSize: 11, textAlign: "right", marginBottom: 4 },
  contenido: { flexGrow: 0 },
  estado: { paddingVertical: 30, alignItems: "center" },
  error: { fontSize: 14, textAlign: "center" },
  boton: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
  },
  textoBoton: { color: COLORES.textoSobrePrimario, fontWeight: "bold", fontSize: 14, letterSpacing: 1 },
  botonSecundario: {
    alignSelf: "stretch",
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    marginTop: 14,
  },
  textoSecundario: { fontWeight: "bold", fontSize: 13, letterSpacing: 1 },
  presionado: { opacity: 0.7 },
});
