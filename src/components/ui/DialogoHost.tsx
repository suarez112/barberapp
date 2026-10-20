import { Ionicons } from "@expo/vector-icons";
import { ComponentProps, useSyncExternalStore } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES, textoSobre } from "@/theme/paleta";
import { dialogoActual, suscribirDialogos, TipoDialogo } from "@/utils/dialogos";

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
  const dialogo = useSyncExternalStore(suscribirDialogos, dialogoActual, dialogoActual);
  if (!dialogo) return null;

  const { icono, color = colors.primary } = ESTILO[dialogo.tipo];
  const esConfirmacion = dialogo.tipo === "confirmacion";
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
          style={[s.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
        >
          <View style={[s.aro, { backgroundColor: `${color}33` }]}>
            <View style={[s.circulo, { backgroundColor: color }]}>
              <Ionicons name={icono} size={34} color={textoSobre(color)} />
            </View>
          </View>

          <Text style={[s.titulo, { color: colors.textPrimary }]}>{dialogo.titulo}</Text>
          {dialogo.mensaje ? (
            <Text style={[s.mensaje, { color: colors.textSecondary }]}>{dialogo.mensaje}</Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityHint={esConfirmacion ? "Confirma y continúa" : "Cierra este aviso"}
            style={({ pressed }) => [
              s.boton,
              { backgroundColor: colorAceptar },
              pressed && s.presionado,
            ]}
            onPress={() => dialogo.responder(true)}
          >
            <Text style={[s.textoBoton, { color: textoSobre(colorAceptar) }]}>
              {(esConfirmacion && dialogo.textoAceptar) || "ACEPTAR"}
            </Text>
          </Pressable>

          {esConfirmacion && (
            <Pressable
              accessibilityRole="button"
              accessibilityHint="Cierra sin hacer cambios"
              style={({ pressed }) => [
                s.botonSecundario,
                { borderColor: colors.cardBorder },
                pressed && s.presionado,
              ]}
              onPress={() => dialogo.responder(false)}
            >
              <Text style={[s.textoSecundario, { color: colors.textPrimary }]}>
                {dialogo.textoCancelar ?? "CANCELAR"}
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
    backgroundColor: "rgba(0, 0, 0, 0.8)",
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
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  textoBoton: { fontWeight: "bold", fontSize: 14, letterSpacing: 1 },
  botonSecundario: {
    width: "100%",
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    marginTop: 10,
  },
  textoSecundario: { fontWeight: "bold", fontSize: 13, letterSpacing: 1 },
  presionado: { opacity: 0.7 },
});
