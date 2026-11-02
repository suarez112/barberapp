import { useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { ANCHO_MEDIO } from "@/components/layout/PanelAdaptable";
import Boton from "@/components/ui/Boton";
import Insignia from "@/components/ui/Insignia";
import { useAppTheme } from "@/theme/ThemeProvider";
import { formatearPesos } from "@/utils/formato";
import { formatearFecha } from "../../superadmin/formato";
import { OrdenManual } from "../api";
import { ESTADOS_ORDEN } from "../estados";

const CORTO = 5;

// Columnas de la tabla (ancho relativo)
const COLUMNAS = [
  { clave: "fecha", titulo: "Fecha", ancho: 1.4 },
  { clave: "plan", titulo: "Plan", ancho: 1.3 },
  { clave: "periodo", titulo: "Periodo", ancho: 1 },
  { clave: "monto", titulo: "Monto", ancho: 1.1 },
  { clave: "estado", titulo: "Estado", ancho: 1.3 },
  { clave: "motivo", titulo: "Detalle", ancho: 2 },
] as const;

const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

const etiqueta = (o: OrdenManual) =>
  `${ESTADOS_ORDEN[o.estado].texto.toLowerCase()}, plan ${o.plan.nombre} ${o.periodo}, ${formatearPesos(o.monto)} pesos, ${formatearFecha(o.creadaEn, true)}${o.motivoRevision ? `. Motivo: ${o.motivoRevision}` : ""}`;

type Props = { ordenes: OrdenManual[] };

// Historial corto: pagos ya revisados (aprobada, rechazada con su motivo, anulada).
// Tabla en pantalla ancha y tarjetas en el celular.
export default function HistorialPagos({ ordenes }: Props) {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const [todos, setTodos] = useState(false);
  const revisadas = ordenes.filter((o) => o.estado !== "pendiente");
  if (revisadas.length === 0) return null;
  const visibles = todos ? revisadas : revisadas.slice(0, CORTO);
  const tabla = width >= ANCHO_MEDIO;

  const motivo = (o: OrdenManual) =>
    o.estado === "rechazada" && o.motivoRevision ? `Motivo: ${o.motivoRevision}` : (o.motivoRevision ?? "—");

  const celda = (i: number, hijo: React.ReactNode, ultima = false) => (
    <View style={{ flex: COLUMNAS[i].ancho, paddingRight: ultima ? 0 : 8, alignItems: "flex-start" }}>{hijo}</View>
  );

  return (
    <View style={[styles.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
      <Text accessibilityRole="header" style={[styles.titulo, { color: colors.primaryText }]}>
        HISTORIAL DE PAGOS
      </Text>

      {tabla ? (
        <View>
          <View style={[styles.fila, styles.encabezado, { borderColor: colors.cardBorder }]}>
            {COLUMNAS.map((c) => (
              <View key={c.clave} style={{ flex: c.ancho, paddingRight: 8 }}>
                <Text style={[styles.columna, { color: colors.textSecondary }]}>{c.titulo.toUpperCase()}</Text>
              </View>
            ))}
          </View>
          {visibles.map((o) => (
            <View
              key={o.referencia}
              accessible
              accessibilityLabel={etiqueta(o)}
              style={[styles.fila, { borderColor: colors.cardBorder }]}
            >
              {celda(0, <Text style={[styles.celda, { color: colors.textPrimary }]}>{formatearFecha(o.creadaEn, true)}</Text>)}
              {celda(1, <Text style={[styles.celda, { color: colors.textPrimary }]}>{o.plan.nombre}</Text>)}
              {celda(2, <Text style={[styles.celda, { color: colors.textPrimary }]}>{mayuscula(o.periodo)}</Text>)}
              {celda(
                3,
                <Text style={[styles.celda, styles.negrita, { color: colors.textPrimary }]}>${formatearPesos(o.monto)}</Text>,
              )}
              {celda(4, <Insignia texto={ESTADOS_ORDEN[o.estado].texto} color={ESTADOS_ORDEN[o.estado].color} />)}
              {celda(
                5,
                <Text
                  style={[
                    styles.celda,
                    { color: o.estado === "rechazada" ? colors.peligroTexto : colors.textSecondary },
                  ]}
                >
                  {motivo(o)}
                </Text>,
                true,
              )}
            </View>
          ))}
        </View>
      ) : (
        visibles.map((o) => (
          <View
            key={o.referencia}
            accessible
            accessibilityLabel={etiqueta(o)}
            style={[styles.filaTarjeta, { borderColor: colors.cardBorder }]}
          >
            <View style={styles.linea}>
              <Text style={[styles.monto, { color: colors.textPrimary }]}>${formatearPesos(o.monto)}</Text>
              <Insignia texto={ESTADOS_ORDEN[o.estado].texto} color={ESTADOS_ORDEN[o.estado].color} />
            </View>
            <Text style={[styles.detalle, { color: colors.textSecondary }]}>
              Plan {o.plan.nombre} · {o.periodo} · {formatearFecha(o.creadaEn, true)}
            </Text>
            {o.estado === "rechazada" && o.motivoRevision ? (
              <Text style={[styles.motivo, { color: colors.peligroTexto }]}>Motivo: {o.motivoRevision}</Text>
            ) : null}
          </View>
        ))
      )}

      {revisadas.length > CORTO ? (
        <Boton
          titulo={todos ? "VER MENOS" : `VER TODOS (${revisadas.length})`}
          ayuda={todos ? "Muestra solo los pagos más recientes" : "Muestra todos los pagos del historial"}
          variante="secundario"
          onPress={() => setTodos((t) => !t)}
          style={styles.mas}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { borderWidth: 1, borderRadius: 12, padding: 20 },
  titulo: { fontSize: 12, fontWeight: "bold", letterSpacing: 1, marginBottom: 8 },
  fila: { flexDirection: "row", alignItems: "center", minHeight: 52, paddingVertical: 8, borderTopWidth: 1 },
  encabezado: { minHeight: 36, borderTopWidth: 0, borderBottomWidth: 1 },
  columna: { fontSize: 11, fontWeight: "bold", letterSpacing: 0.8 },
  celda: { fontSize: 14 },
  negrita: { fontWeight: "bold" },
  filaTarjeta: { borderTopWidth: 1, paddingVertical: 12, gap: 4 },
  linea: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  monto: { fontSize: 18, fontWeight: "bold" },
  detalle: { fontSize: 13 },
  motivo: { fontSize: 13, fontWeight: "600" },
  mas: { marginTop: 8 },
});
