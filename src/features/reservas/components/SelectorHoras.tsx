import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Paleta } from "@/theme/paleta";
import { horario24AMinutos } from "@/utils/disponibilidad";
import type { HoraDisponible } from "../../agenda/api";

type Props = {
  horarios: HoraDisponible[];
  // Hora elegida en el formato de la reserva ("09:40 AM")
  horaSel: string;
  onSeleccionar: (hora: string) => void;
  colors: Paleta;
};

// Las horas se reparten en tres momentos del día (en minutos desde la medianoche)
const GRUPOS = [
  { nombre: "Mañana", icono: "☀️", desde: 0, hasta: 720 }, // antes de las 12:00
  { nombre: "Tarde", icono: "🌤️", desde: 720, hasta: 1080 }, // 12:00 a 5:59 PM
  { nombre: "Noche", icono: "🌙", desde: 1080, hasta: 1440 }, // 6:00 PM en adelante
];

// "13:00" -> "1:00": solo la hora de inicio; el momento del día lo da el grupo
const horaCorta = (inicio: string) => {
  const min = horario24AMinutos(inicio);
  return `${Math.floor(min / 60) % 12 || 12}:${String(min % 60).padStart(2, "0")}`;
};

const grupoDeHora = (horarios: HoraDisponible[], hora: string): string | undefined => {
  const elegida = horarios.find((h) => h.hora === hora);
  if (!elegida) return undefined;
  const min = horario24AMinutos(elegida.inicio);
  return GRUPOS.find((g) => min >= g.desde && min < g.hasta)?.nombre;
};

export default function SelectorHoras({
  horarios,
  horaSel,
  onSeleccionar,
  colors,
}: Props) {
  // Cada momento del día es un desplegable; empiezan cerrados salvo el de la hora elegida
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>(() => {
    const grupo = grupoDeHora(horarios, horaSel);
    return grupo ? { [grupo]: true } : {};
  });
  const [horaPrevia, setHoraPrevia] = useState(horaSel);

  const alternarGrupo = (nombre: string) =>
    setAbiertos((prev) => ({ ...prev, [nombre]: !prev[nombre] }));

  // Si cambia la hora seleccionada, se abre el grupo que la contiene
  // (ajuste durante el render en vez de un efecto: evita un render extra)
  if (horaSel !== horaPrevia) {
    setHoraPrevia(horaSel);
    const grupo = grupoDeHora(horarios, horaSel);
    if (grupo) setAbiertos((prev) => ({ ...prev, [grupo]: true }));
  }

  if (horarios.length === 0) {
    return (
      <Text style={[s.sinHoras, { color: colors.peligroTexto }]}>
        No hay horas disponibles para este día. Prueba con otro día u otro
        profesional.
      </Text>
    );
  }

  return (
    <View>
      {GRUPOS.map((grupo) => {
        const horasDelGrupo = horarios.filter((h) => {
          const min = horario24AMinutos(h.inicio);
          return min >= grupo.desde && min < grupo.hasta;
        });

        // Si no hay horas en ese momento del día, no se muestra el grupo
        if (horasDelGrupo.length === 0) return null;

        const abierto = !!abiertos[grupo.nombre];
        const haySeleccion = horasDelGrupo.some((h) => h.hora === horaSel);

        return (
          <View key={grupo.nombre} style={{ marginBottom: 10 }}>
            <TouchableOpacity
              style={[
                s.cabeceraGrupo,
                {
                  backgroundColor: colors.cardBg,
                  borderColor:
                    haySeleccion && !abierto
                      ? colors.primary
                      : colors.cardBorder,
                },
              ]}
              onPress={() => alternarGrupo(grupo.nombre)}
              accessibilityRole="button"
              accessibilityState={{ expanded: abierto }}
              accessibilityLabel={`${grupo.nombre}, ${horasDelGrupo.length} horas disponibles`}
              accessibilityHint={abierto ? "Oculta estas horas" : "Muestra estas horas"}
            >
              <Text style={[s.tituloGrupo, { color: colors.textSecondary }]}>
                {grupo.icono} {grupo.nombre.toUpperCase()} (
                {horasDelGrupo.length})
              </Text>
              <Ionicons
                name={abierto ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {abierto && (
              <View style={[s.grid, { marginTop: 8 }]}>
                {horasDelGrupo.map((h) => {
                  const esSel = horaSel === h.hora;
                  return (
                    <TouchableOpacity
                      key={h.hora}
                      style={[
                        s.chip,
                        {
                          backgroundColor: colors.cardBg,
                          borderColor: colors.cardBorder,
                        },
                        esSel && {
                          borderColor: colors.primary,
                          backgroundColor: colors.primary,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: esSel }}
                      accessibilityLabel={`${h.hora}${h.pegada ? ", recomendada" : ""}`}
                      accessibilityHint="Elige esta hora para la cita"
                      onPress={() => onSeleccionar(h.hora)}
                    >
                      <Text
                        style={[
                          s.textoChip,
                          { color: esSel ? colors.onPrimary : colors.textPrimary },
                        ]}
                      >
                        {horaCorta(h.inicio)}
                      </Text>
                      {/* El renglón existe siempre: así todas las casillas miden lo mismo */}
                      <Text
                        style={[
                          s.textoMarca,
                          { color: esSel ? colors.onPrimary : colors.primaryText },
                        ]}
                      >
                        {h.pegada ? "★ Recomendada" : " "}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  cabeceraGrupo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  tituloGrupo: {
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    width: "31%",
    height: 56,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  textoChip: { fontSize: 14, fontWeight: "bold" },
  textoMarca: { fontSize: 10, fontWeight: "bold", lineHeight: 13 },
  sinHoras: { fontSize: 13, marginVertical: 10 },
});
