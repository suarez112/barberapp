import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";
import { DatosDePago, rutaQrPago, TipoQr } from "../api";
import BotonCopiar from "./BotonCopiar";
import ImagenQr from "./ImagenQr";

const NOMBRE_QR: Record<TipoQr, string> = { nequi: "QR de Nequi", breb: "QR de Bre-B" };

type Props = { pago: DatosDePago; token: string };

// Formas de pago activas: Nequi y llave Bre-B con botón Copiar, y los códigos QR grandes
export default function FormasDePago({ pago, token }: Props) {
  const { colors } = useAppTheme();

  const dato = (titulo: string, valor: string, nombre: string) => (
    <View key={titulo} style={[styles.forma, { borderColor: colors.cardBorder }]}>
      <View style={styles.datos}>
        <Text style={[styles.titulo, { color: colors.textSecondary }]}>{titulo.toUpperCase()}</Text>
        <Text selectable style={[styles.valor, { color: colors.textPrimary }]}>
          {valor}
        </Text>
      </View>
      <BotonCopiar texto={valor} nombre={nombre} />
    </View>
  );

  return (
    <View style={styles.lista}>
      <Text style={[styles.titular, { color: colors.textSecondary }]}>
        A nombre de <Text style={{ color: colors.textPrimary, fontWeight: "bold" }}>{pago.titular}</Text>
      </Text>
      {pago.formas.map((f) => {
        if (f.tipo === "nequi") return dato("Nequi", f.numero, "el número de Nequi");
        if (f.tipo === "llave_breb") return dato("Llave Bre-B", f.llave, "la llave Bre-B");
        return (
          <View key="qr" style={[styles.forma, styles.formaQr, { borderColor: colors.cardBorder }]}>
            <Text style={[styles.titulo, { color: colors.textSecondary }]}>CÓDIGO QR</Text>
            <View style={styles.qrs}>
              {f.imagenes.map((img) => (
                <View key={img.tipo} style={styles.qr}>
                  <ImagenQr ruta={rutaQrPago(img.tipo)} token={token} etiqueta={NOMBRE_QR[img.tipo]} />
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { gap: 12 },
  titular: { fontSize: 14 },
  forma: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  formaQr: { flexDirection: "column", alignItems: "stretch" },
  datos: { flexShrink: 1 },
  titulo: { fontSize: 11, fontWeight: "bold", letterSpacing: 0.8, marginBottom: 4 },
  valor: { fontSize: 20, fontWeight: "bold" },
  qrs: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 20 },
  qr: { flexGrow: 1, flexBasis: 240, maxWidth: 340 },
});
