import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Tocable from "@/components/ui/Tocable";
import Boton from "@/components/ui/Boton";
import CampoTexto from "@/components/ui/CampoTexto";
import SelectorDias from "@/components/ui/SelectorDias";
import TextoInfo from "@/components/ui/TextoInfo";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useNegocio } from "@/features/negocio/NegocioProvider";
import { useAppTheme } from "@/theme/ThemeProvider";
import { horarioDelDia } from "@/utils/disponibilidad";
import { crearDia, mesCorto } from "@/utils/fechas";
import { EstadoReserva } from "../hooks/useReserva";
import CampoTelefono from "./CampoTelefono";
import SelectorHoras from "./SelectorHoras";
import SelectorProfesional from "./SelectorProfesional";
import SelectorServicio from "./SelectorServicio";

type Props = {
  reserva: EstadoReserva;
  // Oculto cuando el cliente entró por enlace: ese negocio es fijo
  onCambiarCodigo?: () => void;
};

export default function FormularioReserva({ reserva, onCambiarCodigo }: Props) {
  const { colors } = useAppTheme();
  const { empresa, barberos, servicios } = useNegocio();
  const {
    barbero,
    servicio,
    dia,
    hora,
    nombre,
    celular,
    indicativo,
    aceptaHabeasData,
    primerDia,
    ultimoDia,
    horariosDisponibles,
    elegirBarbero,
    elegirServicio,
    elegirDia,
    elegirHora,
    setNombre,
    cambiarTelefono,
    elegirPais,
    alternarHabeasData,
    agendar,
  } = reserva;

  return (
    <View>
      <View style={styles.encabezado}>
        <TituloSeccion style={styles.sinMargen}>
          PASO 1 · SELECCIONA PROFESIONAL
        </TituloSeccion>
        {onCambiarCodigo ? (
          <Tocable accessibilityRole="button" onPress={onCambiarCodigo}>
            <Text style={[styles.enlace, { color: colors.textSecondary }]}>
              Cambiar Código
            </Text>
          </Tocable>
        ) : null}
      </View>
      <SelectorProfesional
        barberos={barberos}
        seleccionado={barbero}
        onSeleccionar={elegirBarbero}
      />

      <TituloSeccion>SERVICIO</TituloSeccion>
      <SelectorServicio
        servicios={servicios}
        seleccionado={servicio}
        onSeleccionar={elegirServicio}
      />

      <TituloSeccion>PASO 2 · DÍA</TituloSeccion>
      <SelectorDias
        desde={primerDia}
        hasta={ultimoDia}
        seleccionado={dia}
        onSeleccionar={elegirDia}
      />
      <Text style={[styles.limite, { color: colors.textSecondary }]}>
        Puedes reservar desde hoy hasta el {crearDia(ultimoDia).num} de{" "}
        {mesCorto(ultimoDia).toLowerCase()}.
      </Text>

      <TituloSeccion>
        HORA DISPONIBLE ({horariosDisponibles.length} DISPONIBLES)
      </TituloSeccion>
      {!barbero || !servicio ? (
        <TextoInfo>⚠️ Selecciona primero un profesional y un servicio.</TextoInfo>
      ) : empresa && !horarioDelDia(empresa, dia.fechaFull) ? (
        <TextoInfo>El negocio no atiende este día. Elige otra fecha.</TextoInfo>
      ) : (
        <SelectorHoras
          horarios={horariosDisponibles}
          horaSel={hora}
          onSeleccionar={elegirHora}
          colors={colors}
        />
      )}

      <TituloSeccion>PASO 3 · TUS DATOS</TituloSeccion>
      <CampoTelefono
        telefono={celular}
        indicativo={indicativo}
        onCambiarTelefono={cambiarTelefono}
        onElegirPais={elegirPais}
      />
      <CampoTexto
        placeholder="Nombre Completo"
        value={nombre}
        onChangeText={setNombre}
      />

      <Tocable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: aceptaHabeasData }}
        style={styles.habeasData}
        onPress={alternarHabeasData}
      >
        <Ionicons
          name={aceptaHabeasData ? "checkbox" : "square-outline"}
          size={22}
          color={colors.primary}
        />
        <Text style={[styles.textoHabeasData, { color: colors.textSecondary }]}>
          Autorizo el tratamiento de mis datos personales exclusivamente para la
          gestión de mi cita (Ley 1581 de 2012).
        </Text>
      </Tocable>

      <Boton titulo="CONFIRMAR RESERVA" onPress={agendar} />
    </View>
  );
}

const styles = StyleSheet.create({
  limite: { fontSize: 12, marginTop: -8, marginBottom: 12 },
  encabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  sinMargen: { marginTop: 0 },
  enlace: { fontSize: 11, textDecorationLine: "underline" },
  habeasData: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 10,
    paddingHorizontal: 4,
  },
  textoHabeasData: { flex: 1, fontSize: 11, lineHeight: 14 },
});
