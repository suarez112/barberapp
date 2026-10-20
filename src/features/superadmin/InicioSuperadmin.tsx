import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORES, textoSobre } from "@/theme/paleta";
import { useAppTheme } from "@/theme/ThemeProvider";
import { obtenerResumen, ResumenPlataforma } from "./api";
import Encabezado from "./components/Encabezado";
import EstadoCarga from "./components/EstadoCarga";
import EstadisticasSuperadmin from "./EstadisticasSuperadmin";
import { formatearNumero } from "./formato";
import { useCargar } from "./useCargar";

type Tarjeta = {
  clave: string;
  titulo: string;
  icono: ComponentProps<typeof Ionicons>["name"];
  color: string;
  valor: (d: ResumenPlataforma) => number;
};

const TARJETAS: Tarjeta[] = [
  { clave: "total", titulo: "Total de negocios", icono: "storefront-outline", color: COLORES.azul, valor: (d) => d.totalNegocios },
  { clave: "prueba", titulo: "En prueba", icono: "hourglass-outline", color: COLORES.azul, valor: (d) => d.enPrueba },
  { clave: "activos", titulo: "Activos", icono: "checkmark-circle-outline", color: COLORES.verde, valor: (d) => d.activos },
  { clave: "vencidos", titulo: "Vencidos", icono: "alert-circle-outline", color: COLORES.rojo, valor: (d) => d.vencidos },
  { clave: "suspendidos", titulo: "Suspendidos", icono: "pause-circle-outline", color: COLORES.neutro, valor: (d) => d.suspendidos },
  { clave: "nuevos", titulo: "Nuevos este mes", icono: "sparkles-outline", color: COLORES.verde, valor: (d) => d.nuevosEsteMes },
  { clave: "porVencer", titulo: "Por vencer en 7 días", icono: "time-outline", color: COLORES.naranja, valor: (d) => d.porVencerEn7Dias },
  { clave: "citas", titulo: "Citas de hoy", icono: "calendar-outline", color: COLORES.azul, valor: (d) => d.citasHoy },
];

type Props = { onVerNegocio: (id: string) => void };

// Inicio: los contadores de toda la plataforma y, debajo, sus gráficos
export default function InicioSuperadmin({ onVerNegocio }: Props) {
  const { colors } = useAppTheme();
  const { datos, cargando, error, recargar } = useCargar(obtenerResumen, "resumen");

  return (
    <View>
      <Encabezado titulo="Inicio" subtitulo="Resumen de todos los negocios de la plataforma" />
      <EstadoCarga cargando={cargando} error={error} hayDatos={datos !== null} onReintentar={recargar}>
        {datos ? (
          <View style={styles.rejilla}>
            {TARJETAS.map((t) => (
              <View
                key={t.clave}
                accessible
                accessibilityLabel={`${t.titulo}: ${formatearNumero(t.valor(datos))}`}
                style={[styles.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
              >
                <View style={[styles.icono, { backgroundColor: t.color }]}>
                  <Ionicons name={t.icono} size={22} color={textoSobre(t.color)} />
                </View>
                <Text style={[styles.valor, { color: colors.textPrimary }]}>{formatearNumero(t.valor(datos))}</Text>
                <Text style={[styles.titulo, { color: colors.textSecondary }]}>{t.titulo}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </EstadoCarga>
      <EstadisticasSuperadmin onVerNegocio={onVerNegocio} />
    </View>
  );
}

const styles = StyleSheet.create({
  rejilla: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  tarjeta: { flexGrow: 1, flexBasis: 220, borderWidth: 1, borderRadius: 12, padding: 20 },
  icono: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  valor: { fontSize: 34, fontWeight: "bold", marginTop: 14 },
  titulo: { fontSize: 14, marginTop: 2 },
});
