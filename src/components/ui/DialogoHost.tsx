import { comoFrase } from "@/components/ui/Boton";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES, textoSobre } from "@/theme/paleta";
import {
  dialogoActual,
  suscribirDialogos,
  TipoDialogo,
} from "@/utils/dialogos";
import { Ionicons } from "@expo/vector-icons";
import { ComponentProps, useSyncExternalStore } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Icono = ComponentProps<typeof Ionicons>["name"];

const ESTILO: Record<TipoDialogo, { icono: Icono; color?: string }> = {
  exito: { icono: "checkmark", color: COLORES.verde },
  error: { icono: "close", color: COLORES.rojo },
  aviso: { icono: "alert", color: COLORES.naranja },
  // Sin color fijo: usa el color del negocio
  confirmacion: { icono: "help" },
};

// Muestra los avisos de utils/dialogos con el mismo estilo del modal de cita confirmada
export default function DialogoHost() {
  const { colors } = useAppTheme();
  const dialogo = useSyncExternalStore(
    suscribirDialogos,
    dialogoActual,
    dialogoActual,
  );
  if (!dialogo) return null;

  const { icono, color = colors.primary } = ESTILO[dialogo.tipo];
  const esConfirmacion = dialogo.tipo === "confirmacion";
  const textoPorDefecto = esConfirmacion
    ? dialogo.destructivo
      ? "ELIMINAR"
      : "CONFIRMAR"
    : "ENTENDIDO";
  const textoAceptar = (
    (esConfirmacion && dialogo.textoAceptar) ||
    textoPorDefecto
  ).toUpperCase();
  const textoCancelar = (dialogo.textoCancelar ?? "VOLVER").toUpperCase();
  const colorAceptar = dialogo.destructivo ? COLORES.rojo : colors.primary;

  return (
    <Modal
      key={dialogo.id}
      animationType="fade"
      transparent
      visible
      onRequestClose={() => dialogo.responder(false)}
    >
      <View style={s.overlay}>
        <View
          accessibilityRole="alert"
          style={[
            s.tarjeta,
            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          ]}
        >
          <View style={[s.aro, { backgroundColor: `${color}33` }]}>
            <View style={[s.circulo, { backgroundColor: color }]}>
              <Ionicons name={icono} size={34} color={textoSobre(color)} />
            </View>
          </View>

          <Text style={[s.titulo, { color: colors.textPrimary }]}>
            {dialogo.titulo}
          </Text>
          {dialogo.mensaje ? (
            <Text style={[s.mensaje, { color: colors.textSecondary }]}>
              {dialogo.mensaje}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={comoFrase(textoAceptar)}
            accessibilityHint={
              esConfirmacion ? "Confirma y continúa" : "Cierra este aviso"
            }
            style={({ pressed, hovered }) => [
              s.boton,
              Platform.OS === "web" && s.webInteractivo,
              { backgroundColor: colorAceptar },
              hovered && s.hover,
              pressed && s.presionado,
            ]}
            onPress={() => dialogo.responder(true)}
          >
            <Text style={[s.textoBoton, { color: textoSobre(colorAceptar) }]}>
              {textoAceptar}
            </Text>
          </Pressable>

          {esConfirmacion && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={comoFrase(textoCancelar)}
              accessibilityHint="Cierra sin hacer cambios"
              style={({ pressed, hovered }) => [
                s.botonSecundario,
                Platform.OS === "web" && s.webInteractivo,
                {
                  borderColor: colors.secundarioBorde,
                  backgroundColor: colors.secundarioBg,
                },
                hovered && s.hover,
                pressed && s.presionado,
              ]}
              onPress={() => dialogo.responder(false)}
            >
              <Text
                style={[s.textoSecundario, { color: colors.secundarioTexto }]}
              >
                {textoCancelar}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORES.velo,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  tarjeta: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    alignItems: "center",
  },
  aro: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  circulo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: { fontSize: 20, fontWeight: "bold", textAlign: "center" },
  mensaje: { fontSize: 14, lineHeight: 20, marginTop: 8, textAlign: "center" },
  boton: {
    width: "100%",
    minHeight: 48,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  textoBoton: { fontWeight: "bold", fontSize: 14, letterSpacing: 1 },
  botonSecundario: {
    width: "100%",
    minHeight: 46,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  textoSecundario: { fontWeight: "bold", fontSize: 13, letterSpacing: 1 },
  webInteractivo: {
    cursor: "pointer",
    transitionProperty: "transform, opacity",
    transitionDuration: "150ms",
    transitionTimingFunction: "ease-out",
  } as any,
  hover: { opacity: 0.9 },
  presionado: { opacity: 0.78, transform: [{ scale: 0.97 }] },
});
