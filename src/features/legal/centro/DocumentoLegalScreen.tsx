import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, Platform, type ScrollViewInstance, StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import TextoMarkdown, { seccionesDe } from "@/components/ui/TextoMarkdown";
import Tocable from "@/components/ui/Tocable";
import { useAppTheme } from "@/theme/ThemeProvider";
import { TipoDocumento } from "../api";
import { useDocumentoLegal } from "../useDocumentoLegal";
import PaginaLegal from "./PaginaLegal";
import { ENTRADAS_LEGALES, textoFecha } from "./secciones";

const esWeb = Platform.OS === "web";

// Ancla con la que se abrió la página en la web (/legales/terminos#4-datos-que-tratamos);
// "" si no hay o viene mal escrita
function anclaInicial() {
  if (!esWeb || typeof window === "undefined") return "";
  try {
    return decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return "";
  }
}

// En la web cada título lleva su id en el HTML: se baja hasta él con el navegador
// (las posiciones de onLayout no se actualizan en la web cuando algo de arriba cambia de alto)
function bajarEnWeb(id: string, animado: boolean) {
  const sinMovimiento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: animado && !sinMovimiento ? "smooth" : "auto", block: "start" });
}

// Página pública de un documento legal: título, versión y fecha (del backend), índice de
// secciones con anclas, el texto y "Volver a Legales"
export default function DocumentoLegalScreen({ tipo }: { tipo: TipoDocumento }) {
  const { colors } = useAppTheme();
  const entrada = ENTRADAS_LEGALES.find((e) => e.clave === tipo)!;
  const { documento, guardado, error, noPublicado, reintentar } = useDocumentoLegal(tipo);
  const scroll = useRef<ScrollViewInstance>(null);
  // Celular: posición del texto dentro del scroll y de cada título dentro del texto
  const inicioTexto = useRef(0);
  const posiciones = useRef(new Map<string, number>());
  const pendiente = useRef<string | null>(null);
  if (pendiente.current === null) pendiente.current = anclaInicial();

  const secciones = useMemo(() => (documento ? seccionesDe(documento.contenido) : []), [documento]);
  const fecha = documento ? textoFecha(documento) : null;

  const irA = (id: string) => {
    if (esWeb) {
      bajarEnWeb(id, true);
      // Se conserva el estado que guarda expo-router en el historial
      window.history.replaceState(window.history.state, "", `#${id}`);
      return;
    }
    const y = posiciones.current.get(id);
    if (y !== undefined) scroll.current?.scrollTo({ y: inicioTexto.current + y - 8, animated: true });
  };

  // Web: al abrir con un ancla baja hasta ella cuando el texto (y sus tablas, que se miden
  // antes de dibujarse) ya está en pantalla
  const hayTexto = !!documento;
  useEffect(() => {
    const ancla = pendiente.current;
    if (!esWeb || !hayTexto || !ancla) return;
    pendiente.current = "";
    const espera = setTimeout(() => bajarEnWeb(ancla, false), 150);
    return () => clearTimeout(espera);
  }, [hayTexto]);

  const alMedirTitulo = esWeb ? undefined : (id: string, y: number) => posiciones.current.set(id, y);

  const reintentarBoton = (
    <Boton
      titulo="REINTENTAR"
      ayuda="Vuelve a descargar el documento"
      variante="secundario"
      onPress={reintentar}
      style={styles.reintentar}
    />
  );

  return (
    <PaginaLegal tituloPestana={documento?.titulo ?? entrada.nombre} activa={tipo} scrollRef={scroll}>
      <Link href="/legales" dismissTo asChild>
        <Tocable
          accessibilityRole="link"
          accessibilityLabel="Volver a Legales"
          accessibilityHint="Abre el índice de documentos legales"
          style={styles.volver}
        >
          <Ionicons name="arrow-back-outline" size={18} color={colors.primaryText} />
          <Text style={[styles.textoVolver, { color: colors.primaryText }]}>Volver a Legales</Text>
        </Tocable>
      </Link>

      {documento ? (
        <>
          <Text accessibilityRole="header" style={[styles.titulo, { color: colors.textPrimary }]}>
            {documento.titulo}
          </Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {[`Versión ${documento.version}`, fecha].filter(Boolean).join(" · ")}
          </Text>

          {guardado ? (
            <View style={[styles.aviso, { borderColor: colors.cardBorder }]}>
              <Text accessibilityLiveRegion="polite" style={[styles.textoAviso, { color: colors.textSecondary }]}>
                {error
                  ? "No se pudo descargar: estás viendo la última versión guardada en tu celular."
                  : "Mostrando la versión guardada en tu celular mientras se actualiza…"}
              </Text>
              {error ? reintentarBoton : null}
            </View>
          ) : null}

          {secciones.length > 1 ? (
            <View
              accessibilityRole="navigation"
              accessibilityLabel="Índice de secciones"
              style={[styles.indice, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
            >
              <Text style={[styles.tituloIndice, { color: colors.textPrimary }]}>Contenido</Text>
              {secciones.map((s) => (
                <Tocable
                  key={s.id}
                  accessibilityRole="link"
                  accessibilityLabel={s.texto}
                  accessibilityHint="Baja a esta sección del documento"
                  style={styles.opcionIndice}
                  onPress={() => irA(s.id)}
                >
                  <Text style={[styles.textoIndice, { color: colors.primaryText }]}>{s.texto}</Text>
                </Tocable>
              ))}
            </View>
          ) : null}

          <View onLayout={(e) => (inicioTexto.current = e.nativeEvent.layout.y)}>
            <TextoMarkdown contenido={documento.contenido} sinTituloPrincipal alMedirTitulo={alMedirTitulo} />
          </View>
        </>
      ) : noPublicado ? (
        <View style={styles.estado}>
          <Text accessibilityRole="header" style={[styles.titulo, styles.centrado, { color: colors.textPrimary }]}>
            {entrada.nombre}
          </Text>
          <Text accessibilityLiveRegion="polite" style={[styles.textoEstado, { color: colors.textSecondary }]}>
            Este documento todavía no está publicado. Vuelve a consultarlo más tarde.
          </Text>
        </View>
      ) : error ? (
        <View style={styles.estado}>
          <Text accessibilityLiveRegion="polite" style={[styles.textoEstado, { color: colors.peligroTexto }]}>
            {error}
          </Text>
          {reintentarBoton}
        </View>
      ) : (
        <View style={styles.estado}>
          <ActivityIndicator color={colors.primaryText} />
          <Text style={[styles.textoEstado, { color: colors.textSecondary }]}>Cargando…</Text>
        </View>
      )}
    </PaginaLegal>
  );
}

const styles = StyleSheet.create({
  volver: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, alignSelf: "flex-start", paddingRight: 8 },
  textoVolver: { fontSize: 14, fontWeight: "bold" },
  titulo: { fontSize: 22, fontWeight: "bold", marginTop: 8 },
  centrado: { textAlign: "center" },
  meta: { fontSize: 13, marginTop: 6, marginBottom: 16 },
  aviso: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 16 },
  textoAviso: { fontSize: 12, lineHeight: 17, textAlign: "center" },
  indice: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 20 },
  tituloIndice: { fontSize: 14, fontWeight: "bold", marginBottom: 4 },
  opcionIndice: { minHeight: 44, justifyContent: "center" },
  textoIndice: { fontSize: 14, lineHeight: 20, textDecorationLine: "underline" },
  estado: { paddingVertical: 40, alignItems: "center", gap: 10 },
  textoEstado: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  reintentar: { alignSelf: "stretch", marginTop: 8 },
});
