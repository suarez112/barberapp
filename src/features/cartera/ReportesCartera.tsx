import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import TarjetaDesplegable from "@/components/ui/TarjetaDesplegable";
import { COLORES } from "@/theme/paleta";
import { useAppTheme } from "@/theme/ThemeProvider";
import { textoRango } from "@/utils/fechas";
import { formatearPesos } from "@/utils/formato";
import {
  CeldaDemanda,
  ReporteDemanda,
  ReporteOcupacion,
  ReporteServiciosRentables,
  ReportesCartera as Reportes,
} from "./api";
import FuncionBloqueada from "../planes/FuncionBloqueada";
import { decimal, DIAS, horaLegible, NOMBRE_DIA } from "./EstadisticasCartera";

const dinero = (n: number) => `$${formatearPesos(n)}`;
const porcentaje = (n: number) => `${decimal(n)}%`;

type Props = {
  reportes: Reportes | null;
  error: string | null;
  cargando: boolean;
  onReintentar: () => void;
};

// Tres tarjetas del administrador (Semana, Mes y Rango): ocupación del equipo, qué
// servicios dejan más dinero y en qué días y horas hay más citas. Cerradas por defecto.
export default function ReportesCartera({ reportes, error, cargando, onReintentar }: Props) {
  const { colors } = useAppTheme();

  if (!reportes) {
    return error ? (
      <View style={s.estado}>
        <Text style={[s.error, { color: colors.peligroTexto }]}>{error}</Text>
        <Boton
          titulo="REINTENTAR"
          ayuda="Vuelve a cargar la ocupación, los servicios rentables y la demanda"
          variante="secundario"
          onPress={onReintentar}
        />
      </View>
    ) : (
      <ActivityIndicator color={colors.primaryText} style={s.cargando} />
    );
  }

  const { ocupacion, serviciosRentables, demanda } = reportes;
  const sinDatos = ocupacion?.calculadoHasta === null;
  const mejor = serviciosRentables?.servicios.find(
    (x) => x.servicioId === serviciosRentables.servicioMayorIngresoPorHora,
  );

  return (
    <View style={cargando ? s.actualizando : undefined}>
      {ocupacion ? (
        <TarjetaDesplegable
          titulo="OCUPACIÓN"
          valor={sinDatos ? "Aún sin datos" : porcentaje(ocupacion.total.porcentajeOcupacion)}
        >
          <Ocupacion ocupacion={ocupacion} />
        </TarjetaDesplegable>
      ) : (
        <FuncionBloqueada funcion="ocupacion_profesional" nombre="Ocupación por profesional" />
      )}

      {serviciosRentables ? (
        <TarjetaDesplegable
          titulo="SERVICIOS MÁS RENTABLES"
          valor={mejor ? `${mejor.nombre} · ${dinero(mejor.ingresoPorHora)}/h` : "Sin citas completadas"}
        >
          <ServiciosRentables reporte={serviciosRentables} />
        </TarjetaDesplegable>
      ) : (
        <FuncionBloqueada funcion="servicios_rentables" nombre="Servicios más rentables" />
      )}

      {demanda ? (
        <TarjetaDesplegable
          titulo="DEMANDA POR DÍA Y HORA"
          valor={
            demanda.pico
              ? `${NOMBRE_DIA[demanda.pico.dia]} ${horaLegible(`${demanda.pico.hora.slice(0, 2)}:00`)}`
              : "Sin citas"
          }
        >
          <Demanda demanda={demanda} />
        </TarjetaDesplegable>
      ) : (
        <FuncionBloqueada funcion="demanda" nombre="Demanda por día y hora" />
      )}
    </View>
  );
}

function Ocupacion({ ocupacion }: { ocupacion: ReporteOcupacion }) {
  const { colors } = useAppTheme();
  const { total, porProfesional, calculadoHasta, desde, hasta } = ocupacion;

  if (calculadoHasta === null) {
    return (
      <Text style={[s.ayuda, { color: colors.textSecondary }]}>
        Este período aún no empieza: no hay ocupación que medir.
      </Text>
    );
  }

  return (
    <View>
      <Text style={[s.ayuda, { color: colors.textSecondary }]}>
        Horas con cita sobre las horas de atención de cada profesional (sin contar sus bloqueos).
        {calculadoHasta < hasta ? ` Se mide hasta ${textoRango(desde, calculadoHasta)}.` : ""}
      </Text>
      <Text style={[s.resumen, { color: colors.textPrimary }]}>
        Todo el equipo: {porcentaje(total.porcentajeOcupacion)} · {decimal(total.horasOcupadas)} h de{" "}
        {decimal(total.horasDisponibles)} h
      </Text>
      {porProfesional.length === 0 ? (
        <Text style={[s.ayuda, { color: colors.textSecondary }]}>
          No hay profesionales que atiendan clientes en este período.
        </Text>
      ) : (
        porProfesional.map((p) => (
          <View
            key={p.barberoId}
            accessible
            accessibilityLabel={`${p.nombre}: ${porcentaje(p.porcentajeOcupacion)} de ocupación, ${decimal(p.horasOcupadas)} horas de ${decimal(p.horasDisponibles)}`}
            style={s.filaBarra}
          >
            <View style={s.etiquetaBarra}>
              <Text numberOfLines={1} style={[s.nombreBarra, { color: colors.textPrimary }]}>
                {p.nombre}
              </Text>
              <Text numberOfLines={1} style={[s.detalleBarra, { color: colors.textSecondary }]}>
                {decimal(p.horasOcupadas)} h de {decimal(p.horasDisponibles)} h
              </Text>
            </View>
            <View style={[s.pista, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              {p.porcentajeOcupacion > 0 ? (
                <View
                  style={[
                    s.relleno,
                    {
                      // 100 % ocupado = barra llena
                      width: `${Math.min(100, p.porcentajeOcupacion)}%`,
                      backgroundColor: COLORES.barra,
                    },
                  ]}
                />
              ) : null}
            </View>
            <Text style={[s.valorBarra, { color: colors.textPrimary }]}>
              {porcentaje(p.porcentajeOcupacion)}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

function ServiciosRentables({ reporte }: { reporte: ReporteServiciosRentables }) {
  const { colors } = useAppTheme();
  const { total, servicios, servicioMayorIngreso, servicioMayorIngresoPorHora } = reporte;

  if (servicios.length === 0) {
    return (
      <Text style={[s.ayuda, { color: colors.textSecondary }]}>
        No hay citas completadas en este período.
      </Text>
    );
  }

  return (
    <View>
      <Text style={[s.ayuda, { color: colors.textSecondary }]}>
        Solo citas completadas. &quot;Por hora&quot; es lo que deja cada hora de trabajo del servicio.
      </Text>
      <Text style={[s.resumen, { color: colors.textPrimary }]}>
        Total: {dinero(total.ingresos)} en {decimal(total.horasTrabajadas)} h ·{" "}
        {dinero(total.ingresoPorHora)} por hora
      </Text>
      {servicios.map((x) => (
        <View key={x.servicioId} style={[s.servicio, { borderTopColor: colors.cardBorder }]}>
          <View style={s.cabeceraServicio}>
            <Text numberOfLines={2} style={[s.nombreServicio, { color: colors.textPrimary }]}>
              {x.nombre}
            </Text>
            <Text style={[s.ingresoServicio, { color: colors.textPrimary }]}>{dinero(x.ingresos)}</Text>
          </View>
          <Text style={[s.detalleBarra, { color: colors.textSecondary }]}>
            {x.citas} {x.citas === 1 ? "cita" : "citas"} · {decimal(x.horasTrabajadas)} h ·{" "}
            {dinero(x.ingresoPorHora)} por hora · ticket {dinero(x.ticketPromedio)}
          </Text>
          <View style={s.marcas}>
            {x.servicioId === servicioMayorIngreso ? (
              <Text style={[s.marca, { backgroundColor: colors.primary, color: colors.onPrimary }]}>
                Mayor ingreso
              </Text>
            ) : null}
            {x.servicioId === servicioMayorIngresoPorHora ? (
              <Text style={[s.marca, { backgroundColor: colors.primary, color: colors.onPrimary }]}>
                Mejor por hora
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

// Citas de cada día de la semana (columnas, lunes primero) por hora de inicio (filas).
// Cuanto más fuerte el color, más citas; el número siempre está escrito.
function Demanda({ demanda }: { demanda: ReporteDemanda }) {
  const { colors } = useAppTheme();

  if (demanda.totalCitas === 0 || demanda.mapa.length === 0) {
    return (
      <Text style={[s.ayuda, { color: colors.textSecondary }]}>No hay citas en este período.</Text>
    );
  }

  // Se junta por hora en punto ("10:30" cuenta en las 10)
  const citas = new Map<string, number>();
  for (const c of demanda.mapa as CeldaDemanda[]) {
    const llave = `${c.dia}|${c.hora.slice(0, 2)}`;
    citas.set(llave, (citas.get(llave) ?? 0) + c.citas);
  }
  const horas = [...new Set(demanda.mapa.map((c) => c.hora.slice(0, 2)))].sort();
  const maximo = Math.max(1, ...citas.values());

  return (
    <View>
      <Text style={[s.ayuda, { color: colors.textSecondary }]}>
        Citas no canceladas por día y hora de inicio. Más oscuro = más citas.
      </Text>
      <View style={s.filaMapa}>
        <View style={s.horaMapa} />
        {DIAS.map((d) => (
          <Text key={d.dia} style={[s.diaMapa, { color: colors.textSecondary }]}>
            {d.nombre.slice(0, 3)}
          </Text>
        ))}
      </View>
      {horas.map((hh) => (
        <View key={hh} style={s.filaMapa}>
          <Text style={[s.horaMapa, { color: colors.textSecondary }]}>
            {horaLegible(`${hh}:00`).replace(":00", "")}
          </Text>
          {DIAS.map((d) => {
            const n = citas.get(`${d.dia}|${hh}`) ?? 0;
            const fuerza = n / maximo;
            return (
              <View
                key={d.dia}
                accessible
                accessibilityLabel={`${d.nombre} ${horaLegible(`${hh}:00`)}: ${n} ${n === 1 ? "cita" : "citas"}`}
                style={[s.celda, { borderColor: colors.cardBorder }]}
              >
                {n > 0 ? (
                  // El color va en una capa aparte para que el número no pierda fuerza
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      { backgroundColor: colors.primary, opacity: 0.25 + 0.75 * fuerza },
                    ]}
                  />
                ) : null}
                <Text
                  style={[
                    s.numeroCelda,
                    { color: n === 0 ? colors.textSecondary : fuerza > 0.5 ? colors.onPrimary : colors.textPrimary },
                  ]}
                >
                  {n || ""}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  estado: { marginTop: 10 },
  error: { fontSize: 13, marginVertical: 10 },
  cargando: { marginVertical: 20 },
  actualizando: { opacity: 0.6 },
  ayuda: { fontSize: 11, marginBottom: 8 },
  resumen: { fontSize: 13, fontWeight: "bold", marginBottom: 8 },
  filaBarra: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44 },
  etiquetaBarra: { width: 96 },
  nombreBarra: { fontSize: 13, fontWeight: "600" },
  detalleBarra: { fontSize: 11 },
  pista: { flex: 1, height: 18, borderRadius: 5, borderWidth: 1, overflow: "hidden" },
  relleno: { height: "100%", borderRadius: 4 },
  valorBarra: { width: 52, fontSize: 13, fontWeight: "bold", textAlign: "right" },
  servicio: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 8, gap: 2 },
  cabeceraServicio: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  nombreServicio: { flex: 1, fontSize: 13, fontWeight: "bold" },
  ingresoServicio: { fontSize: 13, fontWeight: "bold" },
  marcas: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  marca: {
    fontSize: 10,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 2,
  },
  filaMapa: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 3 },
  horaMapa: { width: 40, fontSize: 10 },
  diaMapa: { flex: 1, fontSize: 10, fontWeight: "bold", textAlign: "center" },
  celda: {
    flex: 1,
    height: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 4,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  numeroCelda: { fontSize: 10, fontWeight: "bold" },
});
