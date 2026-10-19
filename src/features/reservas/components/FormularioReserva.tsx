import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Tocable from "@/components/ui/Tocable";
import Boton from "@/components/ui/Boton";
import CampoTexto from "@/components/ui/CampoTexto";
import SelectorDias from "@/components/ui/SelectorDias";
import TextoInfo from "@/components/ui/TextoInfo";
import TituloSeccion from "@/components/ui/TituloSeccion";
import CasillaAutorizacion from "@/features/legal/CasillaAutorizacion";
import { useNegocio } from "@/features/negocio/NegocioProvider";
import { useAppTheme } from "@/theme/ThemeProvider";
import { horarioDelDia } from "@/utils/disponibilidad";
import { crearDia, mesCorto } from "@/utils/fechas";
import { telefonoVisible } from "@/utils/formato";
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
    datosCuenta,
    pedirAutorizacion,
    aceptaDatos,
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
    setAceptaDatos,
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
      {datosCuenta ? (
        // Cliente con sesión: sus datos se llenan solos
        <View
          style={[styles.cuenta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
        >
          <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
          <View style={styles.textosCuenta}>
            <Text style={[styles.nombreCuenta, { color: colors.textPrimary }]}>
              {datosCuenta.nombre}
            </Text>
            <Text style={[styles.detalleCuenta, { color: colors.textSecondary }]}>
              {telefonoVisible(datosCuenta.telefono, datosCuenta.indicativo)} · Reservas con tu
              cuenta
            </Text>
          </View>
        </View>
      ) : (
        <>
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
        </>
      )}

      {pedirAutorizacion ? (
        <CasillaAutorizacion aceptada={aceptaDatos} onCambiar={setAceptaDatos} />
      ) : null}

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
  cuenta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  textosCuenta: { flex: 1 },
  nombreCuenta: { fontSize: 14, fontWeight: "bold" },
  detalleCuenta: { fontSize: 12, marginTop: 2 },
});
