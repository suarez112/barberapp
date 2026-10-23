import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import { useAppTheme } from "@/theme/ThemeProvider";
import { FormatoExportacion, PeriodoResumen, rutaExportacion } from "./api";
import { descargarReporte } from "./exportarReporte";
import FuncionBloqueada from "../planes/FuncionBloqueada";
import { useFunciones } from "../planes/funcionesContexto";
import { useAvisarError } from "../sesion/useAvisarError";

type Props = {
  token: string;
  periodo: PeriodoResumen;
  desde: string;
  hasta: string;
};

// Botón "Exportar" (plan Pro): elegir Excel o PDF y descargar o compartir el reporte del período.
export default function ExportarCartera({ token, periodo, desde, hasta }: Props) {
  const { colors } = useAppTheme();
  const { incluida } = useFunciones();
  const avisarError = useAvisarError();
  const [abierto, setAbierto] = useState(false);
  const [exportando, setExportando] = useState<FormatoExportacion | null>(null);

  if (!incluida("exportar_reportes")) {
    return (
      <FuncionBloqueada
        funcion="exportar_reportes"
        titulo="Exportar reporte"
        detalle="Descarga el reporte del período en Excel o PDF."
      />
    );
  }

  const exportar = async (formato: FormatoExportacion) => {
    if (exportando) return;
    setExportando(formato);
    try {
      await descargarReporte(
        rutaExportacion(periodo, periodo === "rango" ? { desde, hasta } : null, formato),
        token,
        `reporte-${desde}-a-${hasta}.${formato}`,
        formato,
      );
      setAbierto(false);
    } catch (e) {
      avisarError(e, { titulo: "No se pudo exportar" });
    } finally {
      setExportando(null);
    }
  };

  return (
    <View style={styles.contenedor}>
      <Boton
        titulo="EXPORTAR"
        ayuda="Muestra las opciones para descargar el reporte en Excel o PDF"
        variante="secundario"
        onPress={() => setAbierto((a) => !a)}
        deshabilitado={!!exportando}
      />
      {abierto ? (
        <View style={[styles.opciones, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[styles.ayuda, { color: colors.textSecondary }]}>
            Se exporta el período que ves en pantalla.
          </Text>
          <Boton
            titulo={exportando === "xlsx" ? "PREPARANDO EXCEL…" : "EXCEL (.XLSX)"}
            etiqueta="Exportar en Excel"
            ayuda="Descarga el reporte como hoja de cálculo de Excel y abre las opciones para guardarlo o enviarlo"
            variante="secundario"
            onPress={() => exportar("xlsx")}
            deshabilitado={!!exportando}
          />
          <Boton
            titulo={exportando === "pdf" ? "PREPARANDO PDF…" : "PDF"}
            etiqueta="Exportar en PDF"
            ayuda="Descarga el reporte como PDF y abre las opciones para guardarlo o enviarlo"
            variante="secundario"
            onPress={() => exportar("pdf")}
            deshabilitado={!!exportando}
          />
          {exportando ? <ActivityIndicator color={colors.primaryText} style={styles.cargando} /> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginTop: 12 },
  opciones: { borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 8, gap: 8 },
  ayuda: { fontSize: 12 },
  cargando: { marginTop: 4 },
});
