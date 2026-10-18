import { Ionicons } from "@expo/vector-icons";
import { Dispatch, SetStateAction, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BloqueoHorario, Cita } from "@/types";
import {
  bloqueoAplicaEseDia,
  horaAMinutos,
  horario24AMinutos,
  minutosAHora,
} from "@/utils/disponibilidad";

const NOMBRES_DIA = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SÁB"];
const PASO = 30; // cada casilla de la tabla = 30 minutos

type Modo = "PUNTUAL" | "SEMANAL_RECURRENTE";

type Props = {
  colors: {
    primary: string;
    cardBg: string;
    cardBorder: string;
    textPrimary: string;
    textSecondary: string;
    inputBg: string;
  };
  barberoId: string;
  barberoNombre: string;
  bloqueos: BloqueoHorario[];
  setBloqueos: Dispatch<SetStateAction<BloqueoHorario[]>>;
  citas: Cita[];
  apertura: string; // "09:00"
  cierre: string; // "20:00"
};

// Fuera del componente: generar ids no es parte del render
const nuevoIdBloqueo = () => `${Date.now()}_${Math.random()}`;

const esDiaCompleto = (b: BloqueoHorario) =>
  b.desdeMin <= 0 && b.hastaMin >= 1440;

export default function BloqueoSemanal({
  colors,
  barberoId,
  barberoNombre,
  bloqueos,
  setBloqueos,
  citas,
  apertura,
  cierre,
}: Props) {
  // Número de día del lunes de la semana que se ve (5 = lunes 5 de octubre)
  const [inicioDia, setInicioDia] = useState(5);
  const [modo, setModo] = useState<Modo>("PUNTUAL");

  const inicioNegocio = horario24AMinutos(apertura);
  const finNegocio = horario24AMinutos(cierre);

  // Las filas de la tabla: una cada 30 minutos entre apertura y cierre
  const filas: number[] = [];
  for (let t = inicioNegocio; t < finNegocio; t += PASO) filas.push(t);

  const dias = Array.from({ length: 7 }, (_, i) => {
    const f = new Date(2026, 9, inicioDia + i);
    const mes = f.getMonth();
    const num = f.getDate();
    return {
      diaNom: NOMBRES_DIA[f.getDay()],
      num,
      enMes: mes === 9,
      fechaFull: `${f.getFullYear()}-${String(mes + 1).padStart(2, "0")}-${String(num).padStart(2, "0")}`,
    };
  });

  const diasDelMes = dias.filter((d) => d.enMes);
  const etiquetaSemana = `${diasDelMes[0].num} – ${diasDelMes[diasDelMes.length - 1].num} OCT`;

  // ¿Hay un bloqueo que toque este rango de tiempo?
  const buscarBloqueo = (
    fecha: string,
    diaNom: string,
    ini: number,
    fin: number,
  ) =>
    bloqueos.find(
      (b) =>
        b.barberoId === barberoId &&
        bloqueoAplicaEseDia(b, fecha, diaNom) &&
        ini < b.hastaMin &&
        b.desdeMin < fin,
    );

  const buscarBloqueoDiaCompleto = (fecha: string, diaNom: string) =>
    bloqueos.find(
      (b) =>
        b.barberoId === barberoId &&
        bloqueoAplicaEseDia(b, fecha, diaNom) &&
        esDiaCompleto(b),
    );

  const citaActiva = (c: any) =>
    c.barberoId === barberoId &&
    c.estado !== "RECHAZADA" &&
    c.estado !== "CANCELADA";

  // ¿Hay una cita que ocupe este rango de tiempo?
  const hayCita = (fecha: string, ini: number, fin: number) =>
    citas.some((c) => {
      if (!citaActiva(c) || c.fecha !== fecha) return false;
      const ci = horaAMinutos(c.hora);
      const cf = ci + (c.duracionMin ?? 40);
      return ini < cf && ci < fin;
    });

  const hayCitasEseDia = (fecha: string) =>
    citas.some((c) => citaActiva(c) && c.fecha === fecha);

  const crear = (
    dia: { diaNom: string; fechaFull: string },
    desdeMin: number,
    hastaMin: number,
  ) => {
    const nuevo: BloqueoHorario = {
      id: nuevoIdBloqueo(),
      barberoId,
      fechaBase: dia.fechaFull,
      diasSemana: [dia.diaNom],
      desdeMin,
      hastaMin,
      frecuencia: modo,
    };
    setBloqueos((prev) => [...prev, nuevo]);
  };

  const quitar = (b: BloqueoHorario, diaNom: string) => {
    setBloqueos((prev) =>
      prev.flatMap((x) => {
        if (x.id !== b.id) return [x];
        if (x.frecuencia === "SEMANAL_RECURRENTE" && x.diasSemana.length > 1) {
          return [
            { ...x, diasSemana: x.diasSemana.filter((d) => d !== diaNom) },
          ];
        }
        return [];
      }),
    );
  };

  const avisoCambiarModo = (b: BloqueoHorario) => {
    Alert.alert(
      "Cambia el modo",
      b.frecuencia === "PUNTUAL"
        ? "Esto está bloqueado solo para ese día. Cambia a 'Solo ese día' para liberarlo."
        : "Esto se repite cada semana. Cambia a 'Cada semana' para liberarlo.",
    );
  };

  const tocarCelda = (
    dia: { diaNom: string; fechaFull: string; enMes: boolean },
    ini: number,
  ) => {
    if (!dia.enMes) return;
    const fin = ini + PASO;

    if (hayCita(dia.fechaFull, ini, fin)) {
      Alert.alert("Hay una cita", "Ese espacio ya tiene una cita agendada.");
      return;
    }

    const existente = buscarBloqueo(dia.fechaFull, dia.diaNom, ini, fin);
    if (existente) {
      if (esDiaCompleto(existente)) {
        Alert.alert(
          "Día bloqueado",
          "Este día está bloqueado completo. Toca el día arriba para liberarlo.",
        );
        return;
      }
      if (existente.frecuencia !== modo) {
        avisoCambiarModo(existente);
        return;
      }
      quitar(existente, dia.diaNom);
      return;
    }
    crear(dia, ini, fin);
  };

  const tocarDia = (dia: {
    diaNom: string;
    fechaFull: string;
    enMes: boolean;
  }) => {
    if (!dia.enMes) return;

    const existente = buscarBloqueoDiaCompleto(dia.fechaFull, dia.diaNom);
    if (existente) {
      if (existente.frecuencia !== modo) {
        avisoCambiarModo(existente);
        return;
      }
      quitar(existente, dia.diaNom);
      return;
    }

    if (hayCitasEseDia(dia.fechaFull)) {
      Alert.alert(
        "Ese día tiene citas",
        "Hay citas agendadas ese día. Bloquea solo los espacios libres.",
      );
      return;
    }
    crear(dia, 0, 1440);
  };

  const estiloBloqueo = (frecuencia: Modo) =>
    frecuencia === "PUNTUAL"
      ? {
          backgroundColor: "#7F1D1D",
          borderColor: "#EF4444",
          simbolo: "✕",
          texto: "#FECACA",
        }
      : {
          backgroundColor: "#854D0E",
          borderColor: "#EAB308",
          simbolo: "↻",
          texto: "#FDE68A",
        };

  return (
    <View style={{ marginTop: 10 }}>
      <Text style={[s.titulo, { color: colors.primary }]}>
        HORARIO DE {barberoNombre.toUpperCase()}
      </Text>

      <View
        style={[
          s.segmento,
          { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
        ]}
      >
        {(
          [
            { valor: "PUNTUAL", texto: "Solo ese día" },
            { valor: "SEMANAL_RECURRENTE", texto: "Cada semana" },
          ] as { valor: Modo; texto: string }[]
        ).map((op) => (
          <TouchableOpacity
            key={op.valor}
            style={[
              s.btnSegmento,
              modo === op.valor && { backgroundColor: colors.primary },
            ]}
            onPress={() => setModo(op.valor)}
          >
            <Text
              style={[
                s.textoSegmento,
                { color: modo === op.valor ? "#000" : colors.textSecondary },
              ]}
            >
              {op.texto}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[s.ayuda, { color: colors.textSecondary }]}>
        Horario del negocio: {minutosAHora(inicioNegocio)} a{" "}
        {minutosAHora(finNegocio)}. Cada casilla es de 30 minutos. Toca una
        casilla para bloquearla o liberarla, o toca el día de arriba para
        bloquear el día completo.
      </Text>

      <View
        style={[
          s.tarjeta,
          { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
        ]}
      >
        <View style={s.navSemana}>
          <TouchableOpacity
            disabled={inicioDia <= -2}
            onPress={() => setInicioDia(inicioDia - 7)}
            style={{ opacity: inicioDia <= -2 ? 0.3 : 1 }}
          >
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[s.textoSemana, { color: colors.textPrimary }]}>
            {etiquetaSemana}
          </Text>
          <TouchableOpacity
            disabled={inicioDia >= 26}
            onPress={() => setInicioDia(inicioDia + 7)}
            style={{ opacity: inicioDia >= 26 ? 0.3 : 1 }}
          >
            <Ionicons name="chevron-forward" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={s.fila}>
          <View style={s.colHora} />
          {dias.map((d) => {
            const bloqueoDia = buscarBloqueoDiaCompleto(d.fechaFull, d.diaNom);
            const est = bloqueoDia
              ? estiloBloqueo(bloqueoDia.frecuencia)
              : null;
            return (
              <TouchableOpacity
                key={d.fechaFull}
                disabled={!d.enMes}
                onPress={() => tocarDia(d)}
                style={[
                  s.cabDia,
                  {
                    backgroundColor: est ? est.backgroundColor : colors.inputBg,
                    borderColor: est ? est.borderColor : colors.cardBorder,
                    opacity: d.enMes ? 1 : 0.25,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "bold",
                    color: est ? est.texto : colors.textSecondary,
                  }}
                >
                  {d.diaNom}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "bold",
                    color: est ? est.texto : colors.textPrimary,
                  }}
                >
                  {d.num}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {filas.map((ini) => (
          <View key={ini} style={s.fila}>
            <View style={s.colHora}>
              <Text style={{ fontSize: 9, color: colors.textSecondary }}>
                {minutosAHora(ini)}
              </Text>
            </View>
            {dias.map((d) => {
              const conCita = d.enMes && hayCita(d.fechaFull, ini, ini + PASO);
              const bloqueo = d.enMes
                ? buscarBloqueo(d.fechaFull, d.diaNom, ini, ini + PASO)
                : undefined;
              const est = bloqueo ? estiloBloqueo(bloqueo.frecuencia) : null;

              let fondo = colors.inputBg;
              let borde = colors.cardBorder;
              let simbolo = "";
              let colorSimbolo = colors.textSecondary;
              if (conCita) {
                fondo = "#166534";
                borde = "#22C55E";
                simbolo = "✓";
                colorSimbolo = "#DCFCE7";
              } else if (est) {
                fondo = est.backgroundColor;
                borde = est.borderColor;
                simbolo = est.simbolo;
                colorSimbolo = est.texto;
              }

              return (
                <TouchableOpacity
                  key={d.fechaFull + ini}
                  disabled={!d.enMes}
                  onPress={() => tocarCelda(d, ini)}
                  style={[
                    s.celda,
                    {
                      backgroundColor: fondo,
                      borderColor: borde,
                      opacity: d.enMes ? 1 : 0.2,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 11, color: colorSimbolo }}>
                    {simbolo}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <View style={s.leyenda}>
        <ItemLeyenda
          color={colors.inputBg}
          borde={colors.cardBorder}
          texto="Libre"
          colorTexto={colors.textSecondary}
        />
        <ItemLeyenda
          color="#7F1D1D"
          borde="#EF4444"
          texto="✕ Solo ese día"
          colorTexto={colors.textSecondary}
        />
        <ItemLeyenda
          color="#854D0E"
          borde="#EAB308"
          texto="↻ Cada semana"
          colorTexto={colors.textSecondary}
        />
        <ItemLeyenda
          color="#166534"
          borde="#22C55E"
          texto="✓ Con cita"
          colorTexto={colors.textSecondary}
        />
      </View>
    </View>
  );
}

function ItemLeyenda({
  color,
  borde,
  texto,
  colorTexto,
}: {
  color: string;
  borde: string;
  texto: string;
  colorTexto: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginRight: 14,
        marginBottom: 6,
      }}
    >
      <View
        style={{
          width: 14,
          height: 14,
          borderRadius: 3,
          borderWidth: 1,
          backgroundColor: color,
          borderColor: borde,
        }}
      />
      <Text style={{ fontSize: 10, color: colorTexto }}>{texto}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  titulo: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 10,
  },
  segmento: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    padding: 4,
    marginBottom: 8,
  },
  btnSegmento: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  textoSegmento: { fontSize: 12, fontWeight: "bold" },
  ayuda: { fontSize: 11, lineHeight: 15, marginBottom: 10 },
  tarjeta: { borderRadius: 10, borderWidth: 1, padding: 8 },
  navSemana: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  textoSemana: { fontSize: 14, fontWeight: "bold", letterSpacing: 1 },
  fila: { flexDirection: "row", alignItems: "center" },
  colHora: { width: 52, justifyContent: "center" },
  cabDia: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    marginHorizontal: 1.5,
    marginBottom: 4,
  },
  celda: {
    flex: 1,
    height: 28,
    borderRadius: 4,
    borderWidth: 1,
    marginHorizontal: 1.5,
    marginVertical: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  leyenda: { flexDirection: "row", flexWrap: "wrap", marginTop: 12 },
});
