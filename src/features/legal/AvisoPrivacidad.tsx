import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import TextoMarkdown from "@/components/ui/TextoMarkdown";
import Tocable from "@/components/ui/Tocable";
import { registrarCausa } from "@/services/api/errores";
import { useAppTheme } from "@/theme/ThemeProvider";
import { DocumentoLegal, obtenerDocumentoLegal } from "./api";
import { guardarDocumento, leerDocumentoGuardado } from "./documentosGuardados";

// El texto casi nunca cambia: se pide una vez por cada vez que se abre la app
let enMemoria: DocumentoLegal | null = null;

// Aviso de privacidad corto, junto a la casilla de autorización. Empieza plegado:
// "Ver aviso de privacidad" lo despliega. Si no hay conexión
// muestra la última copia guardada; si tampoco la hay, no muestra nada (la casilla
// sigue con sus enlaces a la política y los términos completos).
export default function AvisoPrivacidad() {
  const { colors } = useAppTheme();
  const [documento, setDocumento] = useState<DocumentoLegal | null>(enMemoria);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (enMemoria) return;
    const controlador = new AbortController();
    let vigente = true;

    leerDocumentoGuardado("aviso-privacidad").then((guardado) => {
      if (guardado && vigente) setDocumento((actual) => actual ?? guardado);
    });
    obtenerDocumentoLegal("aviso-privacidad", controlador.signal)
      .then((doc) => {
        enMemoria = doc;
        guardarDocumento("aviso-privacidad", doc);
        if (vigente) setDocumento(doc);
      })
      .catch((e) => {
        if (!controlador.signal.aborted) registrarCausa("Aviso de privacidad", e);
      });
    return () => {
      vigente = false;
      controlador.abort();
    };
  }, []);

  if (!documento) return null;

  const texto = abierto ? "Ocultar aviso de privacidad" : "Ver aviso de privacidad";

  return (
    <View style={styles.contenedor}>
      <Tocable
        accessibilityRole="button"
        accessibilityState={{ expanded: abierto }}
        accessibilityLabel={texto}
        accessibilityHint={abierto ? "Pliega el aviso" : "Despliega el aviso de privacidad"}
        onPress={() => setAbierto(!abierto)}
        style={styles.enlace}
      >
        <Text style={[styles.textoEnlace, { color: colors.primaryText }]}>{texto}</Text>
        <Ionicons name={abierto ? "chevron-up" : "chevron-down"} size={16} color={colors.primaryText} />
      </Tocable>
      {abierto ? (
        <View
          style={[styles.caja, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
        >
          <Text style={[styles.titulo, { color: colors.textSecondary }]}>AVISO DE PRIVACIDAD</Text>
          <TextoMarkdown contenido={documento.contenido} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginBottom: 4 },
  enlace: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, paddingLeft: 46 },
  textoEnlace: { fontSize: 13, fontWeight: "bold", textDecorationLine: "underline" },
  caja: { borderWidth: 1, borderRadius: 10, padding: 12 },
  titulo: { fontSize: 11, fontWeight: "bold", letterSpacing: 1, marginBottom: 4 },
});
