import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import TarjetaDesplegable from "@/components/ui/TarjetaDesplegable";
import { useAppTheme } from "@/theme/ThemeProvider";
import { formatearPesos } from "@/utils/formato";
import {
  ClienteDestacado,
  MesTendencia,
  ReporteMejoresClientes,
  ReporteRetencion,
  ReportesAvanzados as Reportes,
  ReporteTendencia,
} from "./api";
import FuncionBloqueada from "../planes/FuncionBloqueada";
import { useFunciones } from "../planes/funcionesContexto";

const dinero = (n: number) => `$${formatearPesos(n)}`;

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const nombreMes = (mes: string) => {
  const [anio, numero] = mes.split("-");
  return `${MESES[Number(numero) - 1] ?? numero} ${anio}`;
};

// "2026-10-21" o instante ISO → "21 oct"
const fechaCorta = (texto: string) => {
  const fecha = new Date(texto.length === 10 ? `${texto}T12:00:00` : texto);
  return isNaN(fecha.getTime()) ? "" : `${fecha.getDate()} ${MESES[fecha.getMonth()]}`;
};

type Props = {
  reportes: Reportes | null;
  error: string | null;
  cargando: boolean;
  onReintentar: () => void;
};

// Tres tarjetas del plan Pro (Semana, Mes y Rango): mejores clientes, clientes que vuelven y
// tendencia mes a mes. Sin el plan se muestran con candado y "Disponible en plan Pro".
export default function ReportesAvanzados({ reportes, error, cargando, onReintentar }: Props) {
  const { colors } = useAppTheme();
  const { incluida } = useFunciones();

  if (!incluida("reportes_avanzados")) {
    return (
      <View>
        <FuncionBloqueada funcion="reportes_avanzados" titulo="Mejores clientes" />
        <FuncionBloqueada funcion="reportes_avanzados" titulo="Clientes que vuelven" />
        <FuncionBloqueada funcion="reportes_avanzados" titulo="Tendencia mes a mes" />
      </View>
    );
  }

  if (!reportes) {
    return error ? (
      <View style={s.estado}>
        <Text style={[s.error, { color: colors.peligroTexto }]}>{error}</Text>
        <Boton
          titulo="REINTENTAR"
          ayuda="Vuelve a cargar los reportes avanzados"
          variante="secundario"
          onPress={onReintentar}
        />
      </View>
    ) : (
      <ActivityIndicator color={colors.primaryText} style={s.cargando} />
    );
  }

  const { mejoresClientes, retencion, tendencia } = reportes;
  const primero = mejoresClientes?.masGastan[0];

  return (
    <View style={cargando ? s.actualizando : undefined}>
      {mejoresClientes ? (
        <TarjetaDesplegable
          titulo="MEJORES CLIENTES"
          valor={primero ? `${primero.nombre} · ${dinero(primero.gasto)}` : "Sin citas completadas"}
        >
          <MejoresClientes reporte={mejoresClientes} />
        </TarjetaDesplegable>
      ) : (
        <FuncionBloqueada funcion="reportes_avanzados" titulo="Mejores clientes" />
      )}

      {retencion ? (
        <TarjetaDesplegable
          titulo="CLIENTES QUE VUELVEN"
          valor={retencion.totalClientes === 0 ? "Sin clientes" : `${retencion.porcentajeVolvieron}%`}
        >
          <Retencion reporte={retencion} />
        </TarjetaDesplegable>
      ) : (
        <FuncionBloqueada funcion="reportes_avanzados" titulo="Clientes que vuelven" />
      )}

      {tendencia ? (
        <TarjetaDesplegable
          titulo="TENDENCIA MES A MES"
          valor={tendencia.meses.length > 0 ? `${tendencia.meses.length} mes(es)` : "Sin datos"}
        >
          <Tendencia reporte={tendencia} />
        </TarjetaDesplegable>
      ) : (
        <FuncionBloqueada funcion="reportes_avanzados" titulo="Tendencia mes a mes" />
      )}
    </View>
  );
}

function ListaClientes({ titulo, clientes }: { titulo: string; clientes: ClienteDestacado[] }) {
  const { colors } = useAppTheme();
  return (
    <View style={s.bloque}>
      <Text style={[s.subtitulo, { color: colors.primaryText }]}>{titulo}</Text>
      {clientes.map((c, i) => (
        <View
          key={c.clienteId}
          accessible
          accessibilityLabel={`${i + 1}. ${c.nombre}: ${c.visitas} visitas, ${dinero(c.gasto)}`}
          style={s.fila}
        >
          <Text style={[s.posicion, { color: colors.textSecondary }]}>{i + 1}</Text>
          <View style={s.texto}>
            <Text numberOfLines={1} style={[s.nombre, { color: colors.textPrimary }]}>
              {c.nombre}
            </Text>
            <Text style={[s.detalle, { color: colors.textSecondary }]}>
              {c.visitas} {c.visitas === 1 ? "visita" : "visitas"} · ticket {dinero(c.ticketPromedio)}
              {c.ultimaVisita ? ` · última ${fechaCorta(c.ultimaVisita)}` : ""}
            </Text>
          </View>
          <Text style={[s.valor, { color: colors.textPrimary }]}>{dinero(c.gasto)}</Text>
        </View>
      ))}
    </View>
  );
}

function MejoresClientes({ reporte }: { reporte: ReporteMejoresClientes }) {
  const { colors } = useAppTheme();
  if (reporte.totalClientes === 0) {
    return (
      <Text style={[s.ayuda, { color: colors.textSecondary }]}>
        No hay citas completadas en este período.
      </Text>
    );
  }
  return (
    <View>
      <Text style={[s.ayuda, { color: colors.textSecondary }]}>
        Solo cuentan las citas completadas. {reporte.totalClientes}{" "}
        {reporte.totalClientes === 1 ? "cliente" : "clientes"} en el período.
      </Text>
      <ListaClientes titulo="QUIÉNES MÁS GASTAN" clientes={reporte.masGastan} />
      <ListaClientes titulo="QUIÉNES MÁS VIENEN" clientes={reporte.masVienen} />
    </View>
  );
}

function Retencion({ reporte }: { reporte: ReporteRetencion }) {
  const { colors } = useAppTheme();
  if (reporte.totalClientes === 0) {
    return (
      <Text style={[s.ayuda, { color: colors.textSecondary }]}>
        No hay clientes con citas completadas en este período.
      </Text>
    );
  }
  const filas: [string, string][] = [
    ["Clientes del período", String(reporte.totalClientes)],
    ["Volvieron (2 o más citas)", `${reporte.volvieron} · ${reporte.porcentajeVolvieron}%`],
    ["Vinieron una sola vez", `${reporte.unaSolaVez} · ${reporte.porcentajeUnaSolaVez}%`],
  ];
  return (
    <View>
      <View
        accessible
        accessibilityLabel={`${reporte.porcentajeVolvieron}% de los clientes volvieron`}
        style={[s.pista, { backgroundColor: colors.inputBorder }]}
      >
        <View
          style={[s.relleno, { width: `${reporte.porcentajeVolvieron}%`, backgroundColor: colors.primary }]}
        />
      </View>
      {filas.map(([etiqueta, valor]) => (
        <View key={etiqueta} style={s.filaDato}>
          <Text style={[s.detalle, { color: colors.textSecondary }]}>{etiqueta}</Text>
          <Text style={[s.valor, { color: colors.textPrimary }]}>{valor}</Text>
        </View>
      ))}
    </View>
  );
}

const variacion = (n: number | null) =>
  n === null ? "Nuevo" : n === 0 ? "Sin cambios" : `${n > 0 ? "▲" : "▼"} ${Math.abs(n)}%`;

function Tendencia({ reporte }: { reporte: ReporteTendencia }) {
  const { colors } = useAppTheme();
  if (reporte.meses.length === 0) {
    return <Text style={[s.ayuda, { color: colors.textSecondary }]}>No hay meses que mostrar.</Text>;
  }
  const maximo = Math.max(1, ...reporte.meses.map((m) => m.ventas));
  const color = (n: number | null) =>
    n === null || n === 0 ? colors.textSecondary : n > 0 ? colors.exitoTexto : colors.peligroTexto;

  const mes = (m: MesTendencia) => (
    <View
      key={m.mes}
      accessible
      accessibilityLabel={`${nombreMes(m.mes)}: ventas ${dinero(m.ventas)}, ${m.citas} citas, ${m.canceladas} canceladas. Ventas ${variacion(m.variacionVentas)}`}
      style={s.mes}
    >
      <View style={s.filaDato}>
        <Text style={[s.nombre, { color: colors.textPrimary }]}>{nombreMes(m.mes)}</Text>
        <Text style={[s.valor, { color: colors.textPrimary }]}>{dinero(m.ventas)}</Text>
      </View>
      <View style={[s.pista, { backgroundColor: colors.inputBorder }]}>
        <View style={[s.relleno, { width: `${(m.ventas / maximo) * 100}%`, backgroundColor: colors.primary }]} />
      </View>
      <View style={s.filaDato}>
        <Text style={[s.detalle, { color: colors.textSecondary }]}>
          {m.citas} citas · {m.canceladas} canceladas
        </Text>
        <Text style={[s.detalle, { color: color(m.variacionVentas) }]}>
          Ventas {variacion(m.variacionVentas)}
        </Text>
      </View>
    </View>
  );

  return (
    <View>
      <Text style={[s.ayuda, { color: colors.textSecondary }]}>
        Ventas de cada mes y cómo cambiaron frente al mes anterior.
      </Text>
      {reporte.meses.map(mes)}
    </View>
  );
}

const s = StyleSheet.create({
  estado: { marginTop: 10, gap: 8 },
  error: { fontSize: 13 },
  cargando: { marginVertical: 20 },
  actualizando: { opacity: 0.6 },
  ayuda: { fontSize: 12, marginBottom: 8 },
  bloque: { marginTop: 8 },
  subtitulo: { fontSize: 11, fontWeight: "bold", letterSpacing: 0.5, marginBottom: 4 },
  fila: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44 },
  posicion: { width: 18, fontSize: 13, fontWeight: "bold" },
  texto: { flex: 1 },
  nombre: { fontSize: 13, fontWeight: "600" },
  detalle: { fontSize: 11 },
  valor: { fontSize: 13, fontWeight: "bold" },
  filaDato: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 3 },
  pista: { height: 10, borderRadius: 5, overflow: "hidden", marginVertical: 4 },
  relleno: { height: "100%", borderRadius: 5 },
  mes: { marginTop: 8 },
});
