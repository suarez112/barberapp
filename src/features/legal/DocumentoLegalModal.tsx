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
import { DocumentoLegal, TipoDocumento, obtenerDocumentoLegal } from "./api";
import { guardarDocumento, leerDocumentoGuardado } from "./documentosGuardados";

// Los textos casi nunca cambian: se piden una vez por cada vez que se abre la app
const cache = new Map<TipoDocumento, DocumentoLegal>();

type Props = {
  // Documento a mostrar; null = modal cerrado
  tipo: TipoDocumento | null;
  onCerrar: () => void;
};

// Lo que se sabe de un intento de carga ("politica-datos:0", "terminos:1"…)
type Estado = {
  clave: string;
  documento: DocumentoLegal | null;
  // El documento es la copia guardada en el celular, no la recién descargada
  guardado: boolean;
  error: string | null;
};

// Política de datos o Términos en un modal con el estilo de los avisos de la app.
// Si no hay conexión muestra la última versión descargada; si tampoco la hay,
// el error con "Reintentar".
export default function DocumentoLegalModal({ tipo, onCerrar }: Props) {
  const { colors } = useAppTheme();
  const [intento, setIntento] = useState(0);
  const [estado, setEstado] = useState<Estado | null>(null);

  const clave = tipo ? `${tipo}:${intento}` : "";
  const actual = estado?.clave === clave ? estado : null;
  const enMemoria = tipo ? cache.get(tipo) : undefined;
  const documento = enMemoria ?? actual?.documento ?? null;
  const guardado = !enMemoria && !!actual?.guardado;
  const error = enMemoria ? null : (actual?.error ?? null);

  useEffect(() => {
    if (!tipo || cache.has(tipo)) return;
    const esteIntento = `${tipo}:${intento}`;
    const controlador = new AbortController();
    let vigente = true;
    const actualizar = (cambios: (previo: Estado) => Partial<Estado>) =>
      vigente &&
      setEstado((e) => {
        const previo =
          e?.clave === esteIntento
            ? e
            : { clave: esteIntento, documento: null, guardado: false, error: null };
        return { ...previo, ...cambios(previo) };
      });

    // La copia guardada se muestra de inmediato mientras llega la versión al día
    leerDocumentoGuardado(tipo).then((doc) => {
      if (doc && !cache.has(tipo))
        actualizar((p) => (p.documento ? {} : { documento: doc, guardado: true }));
    });

    obtenerDocumentoLegal(tipo, controlador.signal)
      .then((doc) => {
        cache.set(tipo, doc);
        guardarDocumento(tipo, doc);
        actualizar(() => ({ documento: doc, guardado: false, error: null }));
      })
      .catch((e) => {
        if (controlador.signal.aborted) return;
        registrarCausa("Documento legal", e);
        actualizar(() => ({
          error: describirError(e, {
            titulo: "",
            porDefecto: "No se pudo cargar el documento.",
          }).mensaje,
        }));
      });
    return () => {
      vigente = false;
      controlador.abort();
    };
  }, [tipo, intento]);

  const reintentar = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Reintentar"
      accessibilityHint="Vuelve a descargar el documento"
      style={[styles.botonSecundario, { borderColor: colors.cardBorder }]}
      onPress={() => setIntento((n) => n + 1)}
    >
      <Text style={[styles.textoSecundario, { color: colors.textPrimary }]}>REINTENTAR</Text>
    </Pressable>
  );

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
              {guardado ? (
                <View style={styles.aviso}>
                  <Text
                    accessibilityLiveRegion="polite"
                    style={[styles.textoAviso, { color: colors.textSecondary }]}
                  >
                    {error
                      ? "No se pudo descargar: estás viendo la última versión guardada en tu celular."
                      : "Mostrando la versión guardada en tu celular mientras se actualiza…"}
                  </Text>
                  {error ? reintentar : null}
                </View>
              ) : null}
            </>
          ) : error ? (
            <View style={styles.estado}>
              <Text accessibilityLiveRegion="polite" style={[styles.error, { color: colors.peligroTexto }]}>
                {error}
              </Text>
              {reintentar}
            </View>
          ) : (
            <View style={styles.estado}>
              <ActivityIndicator color={colors.primaryText} />
              <Text style={[styles.textoAviso, { color: colors.textSecondary }]}>Cargando…</Text>
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            accessibilityHint="Cierra el documento"
            style={({ pressed }) => [
              styles.boton,
              { backgroundColor: colors.primary },
              pressed && styles.presionado,
            ]}
            onPress={onCerrar}
          >
            <Text style={[styles.textoBoton, { color: colors.onPrimary }]}>CERRAR</Text>
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
  // flexShrink: con un texto largo el botón Cerrar sigue a la vista
  contenido: { flexGrow: 0, flexShrink: 1 },
  estado: { paddingVertical: 30, alignItems: "center", gap: 8 },
  aviso: { marginTop: 10 },
  textoAviso: { fontSize: 12, lineHeight: 17, textAlign: "center" },
  error: { fontSize: 14, textAlign: "center" },
  boton: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
  },
  textoBoton: { fontWeight: "bold", fontSize: 14, letterSpacing: 1 },
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
