import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import CampoTelefono from "@/components/ui/CampoTelefono";
import CampoTexto from "@/components/ui/CampoTexto";
import SelectorDias from "@/components/ui/SelectorDias";
import TextoInfo from "@/components/ui/TextoInfo";
import TituloSeccion from "@/components/ui/TituloSeccion";
import CasillaAutorizacion from "@/features/legal/CasillaAutorizacion";
import { useNegocio } from "@/features/negocio/NegocioProvider";
import { useAppTheme } from "@/theme/ThemeProvider";
import { horarioDelDia } from "@/utils/disponibilidad";
import { crearDia, mesCorto } from "@/utils/fechas";
import { telefonoMostrado } from "@/utils/telefonos";
import TelefonoConBandera from "@/components/ui/TelefonoConBandera";
import { EstadoReserva } from "../hooks/useReserva";
import SelectorHoras from "./SelectorHoras";
import SelectorProfesional from "./SelectorProfesional";
import SelectorServicio from "./SelectorServicio";

type Props = {
  reserva: EstadoReserva;
};

export default function FormularioReserva({ reserva }: Props) {
  const { colors } = useAppTheme();
  const { empresa, barberos, servicios } = useNegocio();
  const {
    barbero,
    servicio,
    dia,
    hora,
    nombre,
    errorNombre,
    telefono,
    datosCuenta,
    pedirAutorizacion,
    aceptaDatos,
    errorAutorizacion,
    primerDia,
    ultimoDia,
    horariosDisponibles,
    cargandoHoras,
    errorHoras,
    recargarHoras,
    elegirBarbero,
    elegirServicio,
    elegirDia,
    elegirHora,
    cambiarNombre,
    cambiarAceptaDatos,
    agendar,
  } = reserva;

  return (
    <View>
      <TituloSeccion>PASO 1 · SELECCIONA PROFESIONAL</TituloSeccion>
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
      ) : errorHoras ? (
        <View>
          <TextoInfo>{errorHoras}</TextoInfo>
          <Boton
            titulo="REINTENTAR"
            ayuda="Vuelve a cargar las horas disponibles"
            variante="secundario"
            onPress={recargarHoras}
          />
        </View>
      ) : cargandoHoras && horariosDisponibles.length === 0 ? (
        <ActivityIndicator color={colors.primaryText} />
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
          accessible
          accessibilityLabel={`Reservas con tu cuenta: ${datosCuenta.nombre}, ${telefonoMostrado(
            datosCuenta.telefono,
            datosCuenta.indicativo,
          ).texto}`}
          style={[styles.cuenta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
        >
          <Ionicons name="person-circle-outline" size={28} color={colors.primaryText} />
          <View style={styles.textosCuenta}>
            <Text style={[styles.nombreCuenta, { color: colors.textPrimary }]}>
              {datosCuenta.nombre}
            </Text>
            <TelefonoConBandera
              telefono={datosCuenta.telefono}
              indicativo={datosCuenta.indicativo}
              style={[styles.detalleCuenta, { color: colors.textSecondary }]}
              sufijo=" · Reservas con tu cuenta"
            />
          </View>
        </View>
      ) : (
        <>
          <CampoTelefono
            telefono={telefono}
            etiqueta="Celular"
            obligatorio
            ayuda="El negocio te contactará a este número. Para otro país, toca la bandera."
          />
          <CampoTexto
            etiqueta="Nombre completo"
            obligatorio
            error={errorNombre}
            ayuda="Así te verá el negocio en su agenda"
            placeholder="ej: Ana Pérez"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            maxLength={100}
            value={nombre}
            onChangeText={cambiarNombre}
          />
        </>
      )}

      {pedirAutorizacion ? (
        <CasillaAutorizacion
          aceptada={aceptaDatos}
          error={errorAutorizacion}
          onCambiar={cambiarAceptaDatos}
        />
      ) : null}

      <Boton
        titulo="CONFIRMAR RESERVA"
        ayuda="Envía la reserva con el profesional, servicio, día y hora elegidos"
        deshabilitado={!hora || (pedirAutorizacion && !aceptaDatos)}
        onPress={agendar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  limite: { fontSize: 12, marginTop: -8, marginBottom: 12 },
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
