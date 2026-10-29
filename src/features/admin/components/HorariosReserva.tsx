import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import Desplegable from "@/components/ui/Desplegable";
import { useAppTheme } from "@/theme/ThemeProvider";
import { horario24AMinutos, minutosAHora } from "@/utils/disponibilidad";
import { PerfilEmpresa } from "../../cuenta/api";

const INTERVALOS = [10, 20, 30, 40, 50, 60].map((m) => ({
  valor: m,
  etiqueta: m === 60 ? "Cada 60 minutos (1 hora)" : `Cada ${m} minutos`,
}));
const DIAS_LARGOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];
const HORAS_EN_EJEMPLO = 4;

// 570 -> "9:30" (sin cero inicial ni AM/PM, como lo ven los clientes)
const horaCorta = (total: number) => {
  const h = Math.floor(total / 60) % 12 || 12;
  return `${h}:${String(total % 60).padStart(2, "0")}`;
};

// Primer día abierto de la semana (sin horario por día, el horario general)
const primerDiaAbierto = (perfil: PerfilEmpresa) => {
  if (!perfil.horario?.length)
    return { dia: null, apertura: perfil.horarioApertura, cierre: perfil.horarioCierre };
  for (const dia of ORDEN_DIAS) {
    const h = perfil.horario.find((x) => x.dia === dia);
    if (h?.abierto && h.apertura && h.cierre)
      return { dia, apertura: h.apertura, cierre: h.cierre };
  }
  return null;
};

// Las primeras horas que verían los clientes: la apertura y luego las horas del
// reloj que siguen el intervalo (con 30: 9:00, 9:30, 10:00…)
const ejemploDeHoras = (apertura: number, cierre: number, intervalo: number) => {
  const horas = [apertura];
  let siguiente = (Math.floor(apertura / intervalo) + 1) * intervalo;
  while (horas.length < HORAS_EN_EJEMPLO && siguiente < cierre) {
    horas.push(siguiente);
    siguiente += intervalo;
  }
  return horas;
};

type Props = {
  perfil: PerfilEmpresa;
  onGuardar: (minutos: number) => Promise<boolean>;
};

// "Horarios de reserva": cada cuánto pueden agendar los clientes
export default function HorariosReserva({ perfil, onGuardar }: Props) {
  const { colors } = useAppTheme();
  const [elegido, setElegido] = useState(perfil.intervaloMinutos);
  const [guardando, setGuardando] = useState(false);

  const abierto = primerDiaAbierto(perfil);
  const ejemplo = abierto
    ? ejemploDeHoras(
        horario24AMinutos(abierto.apertura),
        horario24AMinutos(abierto.cierre),
        elegido,
      )
    : [];
  const cambio = elegido !== perfil.intervaloMinutos;

  const guardar = async () => {
    if (guardando) return;
    setGuardando(true);
    await onGuardar(elegido);
    setGuardando(false);
  };

  return (
    <View>
      <View style={[styles.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <Desplegable
          etiqueta="Cada cuánto pueden agendar tus clientes"
          ayuda="Elige cada cuántos minutos se ofrece una hora para reservar"
          placeholder="Elige el intervalo"
          opciones={INTERVALOS}
          valor={elegido}
          onCambiar={setElegido}
          deshabilitado={guardando}
        />
        {abierto ? (
          <View accessible accessibilityLabel={`Ejemplo. Tus clientes verán: ${ejemplo.map(minutosAHora).join(", ")}`}>
            <Text style={[styles.ejemplo, { color: colors.textPrimary }]}>
              Tus clientes verán: {ejemplo.map(horaCorta).join(", ")}…
            </Text>
            <Text style={[styles.nota, { color: colors.textSecondary }]}>
              Ejemplo con el horario del {abierto.dia === null ? "negocio" : DIAS_LARGOS[abierto.dia]} (
              {minutosAHora(horario24AMinutos(abierto.apertura))} a{" "}
              {minutosAHora(horario24AMinutos(abierto.cierre))}). Además, la app recomienda las
              horas que no dejan huecos entre citas.
            </Text>
          </View>
        ) : (
          <Text style={[styles.nota, { color: colors.textSecondary }]}>
            Abre al menos un día en el horario para ver el ejemplo.
          </Text>
        )}
      </View>
      <Boton
        titulo={guardando ? "GUARDANDO…" : "GUARDAR HORARIOS DE RESERVA"}
        ayuda="Guarda cada cuántos minutos pueden agendar tus clientes"
        deshabilitado={!cambio || guardando}
        onPress={guardar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 6 },
  ejemplo: { fontSize: 14, fontWeight: "700", marginTop: 4 },
  nota: { fontSize: 12, marginTop: 4 },
});
