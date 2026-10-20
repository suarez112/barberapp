import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import TextoInfo from "@/components/ui/TextoInfo";
import { describirError } from "@/services/api/errores";
import { useAppTheme } from "@/theme/ThemeProvider";
import { formatearPesos } from "@/utils/formato";
import { CitaHistorial, obtenerHistorial } from "../api";

const ETIQUETA_ESTADO = {
  CONFIRMADA: "Pendiente",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
} as const;

// Citas de un cliente, de la más reciente a la más antigua
export default function HistorialCitas({
  token,
  clienteId,
}: {
  token: string;
  clienteId: string;
}) {
  const { colors } = useAppTheme();
  const [citas, setCitas] = useState<CitaHistorial[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    obtenerHistorial(token, clienteId)
      .then((r) => vigente && setCitas(r.citas))
      .catch(
        (e) =>
          vigente &&
          setError(
            describirError(e, {
              titulo: "",
              porDefecto: "No se pudo cargar el historial.",
            }).mensaje,
          ),
      );
    return () => {
      vigente = false;
    };
  }, [token, clienteId]);

  if (error) return <TextoInfo>{error}</TextoInfo>;
  if (!citas) return <ActivityIndicator color={colors.primaryText} style={styles.margen} />;
  if (citas.length === 0) return <TextoInfo>Este cliente aún no tiene citas.</TextoInfo>;

  return (
    <View style={[styles.caja, { borderColor: colors.cardBorder }]}>
      {citas.map((c) => (
        <View key={c.id} style={styles.fila}>
          <View style={styles.flex}>
            <Text style={[styles.titulo, { color: colors.textPrimary }]}>
              {c.fecha} · {c.hora}
            </Text>
            <Text style={[styles.detalle, { color: colors.textSecondary }]}>
              {c.servicio} con {c.barberoNombre} · ${formatearPesos(c.precio)}
            </Text>
          </View>
          <Text style={[styles.estado, { color: colors.primaryText }]}>
            {ETIQUETA_ESTADO[c.estado] ?? c.estado}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  margen: { marginVertical: 10 },
  caja: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  fila: { flexDirection: "row", alignItems: "center", gap: 8 },
  flex: { flex: 1 },
  titulo: { fontSize: 12, fontWeight: "bold" },
  detalle: { fontSize: 11, marginTop: 2 },
  estado: { fontSize: 10, fontWeight: "bold" },
});
