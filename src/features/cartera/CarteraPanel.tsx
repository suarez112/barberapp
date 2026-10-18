import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Cita } from "@/types";

type Periodo = "DIARIO" | "SEMANAL" | "MENSUAL";

type Props = {
  colors: {
    primary: string;
    cardBg: string;
    cardBorder: string;
    textPrimary: string;
    textSecondary: string;
  };
  nombre: string;
  porcentaje: number;
  citas: Cita[]; // citas del profesional que se está viendo
};

const MESES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];
const MESES_LARGOS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

// Convierte "2026-10-11" en una fecha
const aFecha = (fechaStr: string) => {
  const [y, m, d] = fechaStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const dinero = (n: number) => `$${n.toLocaleString("es-CO")}`;

// Calcula desde qué día hasta qué día va el periodo.
// "atras" = cuántos periodos hacia atrás (0 = el actual).
const calcularRango = (periodo: Periodo, atras: number) => {
  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

  if (periodo === "DIARIO") {
    const d = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate() - atras,
    );
    return {
      inicio: d,
      fin: d,
      etiqueta: `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`,
    };
  }

  if (periodo === "SEMANAL") {
    // Semana de lunes a domingo
    const desdeLunes = (hoy.getDay() + 6) % 7;
    const inicio = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate() - desdeLunes - 7 * atras,
    );
    const fin = new Date(
      inicio.getFullYear(),
      inicio.getMonth(),
      inicio.getDate() + 6,
    );
    const etiqueta =
      inicio.getMonth() === fin.getMonth()
        ? `${inicio.getDate()}–${fin.getDate()} ${MESES[fin.getMonth()]} ${fin.getFullYear()}`
        : `${inicio.getDate()} ${MESES[inicio.getMonth()]} – ${fin.getDate()} ${MESES[fin.getMonth()]} ${fin.getFullYear()}`;
    return { inicio, fin, etiqueta };
  }

  // MENSUAL
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - atras, 1);
  const fin = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0);
  return {
    inicio,
    fin,
    etiqueta: `${MESES_LARGOS[inicio.getMonth()]} ${inicio.getFullYear()}`,
  };
};

export default function CarteraPanel({
  colors,
  nombre,
  porcentaje,
  citas,
}: Props) {
  const [periodo, setPeriodo] = useState<Periodo>("DIARIO");
  const [atras, setAtras] = useState(0);

  const cambiarPeriodo = (p: Periodo) => {
    setPeriodo(p);
    setAtras(0); // al cambiar de periodo, volvemos al actual
  };

  const rango = calcularRango(periodo, atras); // lo que se está mirando
  const rangoActual = calcularRango(periodo, 0); // hoy / esta semana / este mes

  const dentroDe = (c: any, r: { inicio: Date; fin: Date }) => {
    const f = aFecha(c.fecha);
    return f >= r.inicio && f <= r.fin;
  };

  // LO GANADO: citas completadas dentro del periodo que se está mirando
  const completadas = citas
    .filter((c) => c.estado === "COMPLETADA" && dentroDe(c, rango))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const bruto = completadas.reduce((sum, c) => sum + c.precio, 0);
  const ganancia = (bruto * porcentaje) / 100;

  // LA PROYECCIÓN: citas confirmadas por realizar en el periodo ACTUAL
  const porRealizar = citas.filter(
    (c) => c.estado === "CONFIRMADA" && dentroDe(c, rangoActual),
  );
  const proyBruto = porRealizar.reduce((sum, c) => sum + c.precio, 0);
  const proyGanancia = (proyBruto * porcentaje) / 100;

  const etiquetaActual =
    periodo === "DIARIO"
      ? "HOY"
      : periodo === "SEMANAL"
        ? "ESTA SEMANA"
        : "ESTE MES";

  return (
    <View>
      <Text style={[s.titulo, { color: colors.primary }]}>
        💰 CARTERA Y GANANCIAS DE {nombre.toUpperCase()}
      </Text>

      {/* Selector Diario / Semanal / Mensual */}
      <View
        style={[
          s.segmento,
          { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
        ]}
      >
        {(
          [
            { valor: "DIARIO", texto: "Diario" },
            { valor: "SEMANAL", texto: "Semanal" },
            { valor: "MENSUAL", texto: "Mensual" },
          ] as { valor: Periodo; texto: string }[]
        ).map((op) => (
          <TouchableOpacity
            key={op.valor}
            style={[
              s.btnSegmento,
              periodo === op.valor && { backgroundColor: colors.primary },
            ]}
            onPress={() => cambiarPeriodo(op.valor)}
          >
            <Text
              style={[
                s.textoSegmento,
                { color: periodo === op.valor ? "#000" : colors.textSecondary },
              ]}
            >
              {op.texto}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Navegador: flecha izquierda = periodo anterior, derecha = volver hacia hoy */}
      <View
        style={[
          s.navegador,
          { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
        ]}
      >
        <TouchableOpacity onPress={() => setAtras(atras + 1)} style={s.flecha}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={[s.etiquetaRango, { color: colors.textPrimary }]}>
          {rango.etiqueta}
        </Text>

        <TouchableOpacity
          disabled={atras === 0}
          onPress={() => setAtras(atras - 1)}
          style={[s.flecha, { opacity: atras === 0 ? 0.25 : 1 }]}
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Tarjetas de lo ganado */}
      <View style={s.filaTarjetas}>
        <View
          style={[
            s.tarjeta,
            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[s.numero, { color: colors.textPrimary }]}>
            {dinero(bruto)}
          </Text>
          <Text style={[s.textoTarjeta, { color: colors.textSecondary }]}>
            Recaudo Bruto
          </Text>
        </View>

        <View
          style={[
            s.tarjeta,
            { backgroundColor: colors.cardBg, borderColor: colors.primary },
          ]}
        >
          <Text style={[s.numero, { color: colors.primary }]}>
            {dinero(ganancia)}
          </Text>
          <Text
            style={[
              s.textoTarjeta,
              { color: colors.primary, fontWeight: "bold" },
            ]}
          >
            Tu Comisión ({porcentaje}%)
          </Text>
        </View>
      </View>

      {/* Desglose de lo ganado */}
      <Text style={[s.titulo, { color: colors.primary, marginTop: 20 }]}>
        DESGLOSE DE CITAS COMPLETADAS ({completadas.length})
      </Text>

      {completadas.length === 0 ? (
        <Text style={s.infoText}>
          No hay servicios completados en este periodo.
        </Text>
      ) : (
        completadas.map((c) => (
          <View
            key={c.id}
            style={[
              s.filaCita,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[s.tituloCita, { color: colors.textPrimary }]}>
                {c.servicio}
              </Text>
              <Text style={[s.subCita, { color: colors.textSecondary }]}>
                Cliente: {c.cliente} · {c.hora} ({c.fecha})
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[s.precioCita, { color: colors.primary }]}>
                +{dinero((c.precio * porcentaje) / 100)}
              </Text>
              <Text style={{ fontSize: 9, color: colors.textSecondary }}>
                Ganancia ({porcentaje}%)
              </Text>
            </View>
          </View>
        ))
      )}

      {/* Proyección: siempre del periodo actual */}
      <Text style={[s.titulo, { color: colors.primary, marginTop: 25 }]}>
        📈 PROYECCIÓN · {etiquetaActual}
      </Text>

      <View style={s.filaTarjetas}>
        <View
          style={[
            s.tarjeta,
            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[s.numero, { color: colors.textPrimary }]}>
            {porRealizar.length}
          </Text>
          <Text style={[s.textoTarjeta, { color: colors.textSecondary }]}>
            Citas por realizar
          </Text>
        </View>

        <View
          style={[
            s.tarjeta,
            { backgroundColor: colors.cardBg, borderColor: colors.primary },
          ]}
        >
          <Text style={[s.numero, { color: colors.primary }]}>
            {dinero(proyGanancia)}
          </Text>
          <Text
            style={[
              s.textoTarjeta,
              { color: colors.primary, fontWeight: "bold" },
            ]}
          >
            Podrías ganar ({porcentaje}%)
          </Text>
        </View>
      </View>

      <Text style={[s.nota, { color: colors.textSecondary }]}>
        Para ver el detalle de cada cita, revisa la pestaña Citas.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  titulo: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
    marginTop: 15,
    marginBottom: 10,
  },
  segmento: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    padding: 4,
    marginBottom: 12,
  },
  btnSegmento: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  textoSegmento: { fontSize: 11, fontWeight: "bold" },
  navegador: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  flecha: { paddingHorizontal: 12, paddingVertical: 4 },
  etiquetaRango: { fontSize: 16, fontWeight: "bold" },
  filaTarjetas: { flexDirection: "row", gap: 10, marginTop: 4 },
  tarjeta: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  numero: { fontSize: 20, fontWeight: "bold" },
  textoTarjeta: { fontSize: 11, marginTop: 4, textAlign: "center" },
  filaCita: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  tituloCita: { fontSize: 14, fontWeight: "bold" },
  subCita: { fontSize: 12, marginTop: 4 },
  precioCita: { fontSize: 12, fontWeight: "bold" },
  infoText: { color: "#EF4444", fontSize: 13, marginVertical: 10 },
  nota: { fontSize: 11, marginTop: 8 },
});
