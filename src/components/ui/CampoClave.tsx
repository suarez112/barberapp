import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";
import { CLAVE_MAX, REQUISITOS_CLAVE } from "../../utils/clave";
import CampoTexto, { PropsCampo } from "./CampoTexto";


// Campo de contraseña con un ojo para mostrar u ocultar lo escrito
type Props = Omit<PropsCampo, "secureTextEntry" | "derecha"> & {
  // Contraseña nueva: muestra debajo los requisitos con marca verde al cumplirlos
  requisitos?: boolean;
  // "Confirma tu contraseña": la contraseña con la que se compara en vivo.
  // En este campo no se puede copiar ni pegar (hay que escribirla de nuevo).
  confirmaDe?: string;
};

export default function CampoClave({ requisitos = false, confirmaDe, ...props }: Props) {
  const esConfirmacion = confirmaDe !== undefined;
  const { colors } = useAppTheme();
  const [visible, setVisible] = useState(false);
  const valor = props.value ?? "";
  const verde = colors.exitoTexto;

  // Cada línea dice si se cumple, también para el lector de pantalla
  const linea = (cumple: boolean, texto: string) => (
    <View
      accessible
      accessibilityLabel={`${texto}: ${cumple ? "cumple" : "no cumple"}`}
      style={styles.linea}
    >
      <Ionicons
        name={cumple ? "checkmark-circle" : "ellipse-outline"}
        size={16}
        color={cumple ? verde : colors.textSecondary}
      />
      <Text style={[styles.textoLinea, { color: cumple ? verde : colors.textSecondary }]}>
        {texto}
      </Text>
    </View>
  );

  const coinciden = confirmaDe !== undefined && valor === confirmaDe;

  return (
    <View style={styles.contenedor}>
      <CampoTexto
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        placeholder={esConfirmacion ? "Confirma tu contraseña" : "ej: tu contraseña"}
        maxLength={CLAVE_MAX}
        {...props}
        {...(esConfirmacion
          ? {
              // Sin menú de copiar/pegar; y un texto que entra de golpe (pegado desde el
              // teclado o el portapapeles) se ignora: solo se acepta lo que se escribe
              contextMenuHidden: true,
              onChangeText: (texto: string) => {
                if (texto.length - valor.length > 1) return;
                props.onChangeText?.(texto);
              },
            }
          : null)}
        style={[styles.campo, props.style]}
        secureTextEntry={!visible}
        derecha={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            accessibilityHint={
              visible ? "Vuelve a esconder lo que escribiste" : "Muestra lo que escribiste"
            }
            onPress={() => setVisible((v) => !v)}
            style={styles.ojo}
          >
            <Ionicons
              name={visible ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={colors.textSecondary}
            />
          </Pressable>
        }
      />
      {requisitos ? (
        <View accessibilityLiveRegion="polite" style={styles.requisitos}>
          {REQUISITOS_CLAVE.map((r) => (
            <View key={r.texto}>{linea(r.cumple(valor), r.texto)}</View>
          ))}
        </View>
      ) : null}
      {confirmaDe !== undefined && valor ? (
        <View accessibilityLiveRegion="polite" style={styles.requisitos}>
          <Text
            style={[styles.textoLinea, styles.negrita, { color: coinciden ? verde : colors.error }]}
          >
            <Ionicons
              name={coinciden ? "checkmark-circle" : "close-circle"}
              size={14}
              color={coinciden ? verde : colors.error}
            />{" "}
            {coinciden ? "Coinciden" : "No coinciden"}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginBottom: 12 },
  // El margen lo pone el contenedor, debajo de los requisitos
  campo: { marginBottom: 0 },
  ojo: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  requisitos: { marginTop: 6, gap: 2 },
  linea: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 20 },
  textoLinea: { fontSize: 12, lineHeight: 16 },
  negrita: { fontWeight: "bold" },
});
