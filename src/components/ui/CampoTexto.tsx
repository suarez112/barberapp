import { ReactNode, useState } from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";

export type PropsCampo = Omit<TextInputProps, "style"> & {
  // Etiqueta visible arriba del campo (el placeholder es solo un ejemplo)
  etiqueta: string;
  // Qué escribir o qué pasa, para TalkBack / VoiceOver
  ayuda?: string;
  // Qué corregir; se muestra debajo del campo y se anuncia
  error?: string | null;
  // Agrega " *" a la etiqueta y "obligatorio" para el lector de pantalla
  obligatorio?: boolean;
  // Estilo del contenedor (márgenes, ancho)
  style?: StyleProp<ViewStyle>;
  // Estilo del texto escrito
  estiloTexto?: StyleProp<TextStyle>;
  // Contenido dentro del recuadro, a los lados del texto (ej. "$", un ojo, una bandera)
  izquierda?: ReactNode;
  derecha?: ReactNode;
  // Texto centrado (ej. un código): el cursor también queda en el centro
  centrado?: boolean;
};

// Campo de texto accesible: etiqueta arriba, recuadro de al menos 48 px y el error debajo
export default function CampoTexto({
  etiqueta,
  ayuda,
  error,
  obligatorio = false,
  style,
  estiloTexto,
  izquierda,
  derecha,
  centrado = false,
  editable = true,
  multiline,
  ...props
}: PropsCampo) {
  const { colors } = useAppTheme();
  const [enfocado, setEnfocado] = useState(false);
  // Android pone el cursor al inicio del placeholder aunque esté centrado:
  // mientras se escribe en un campo centrado vacío, el ejemplo se oculta
  const ocultarEjemplo = centrado && enfocado && !props.value;
  const hint = [error ? `Error: ${error}` : null, ayuda].filter(Boolean).join(". ");

  return (
    <View style={[styles.contenedor, style]}>
      <Text style={[styles.etiqueta, { color: colors.textPrimary }]}>
        {etiqueta}
        {obligatorio ? " *" : ""}
      </Text>
      <View
        style={[
          styles.caja,
          {
            backgroundColor: colors.inputBg,
            borderColor: error ? colors.error : colors.inputBorder,
          },
          error ? styles.cajaConError : null,
          !editable && styles.bloqueado,
        ]}
      >
        {izquierda}
        <TextInput
          accessibilityLabel={obligatorio ? `${etiqueta}, obligatorio` : etiqueta}
          accessibilityHint={hint || undefined}
          accessibilityState={{ disabled: !editable }}
          placeholderTextColor={colors.textSecondary}
          editable={editable}
          multiline={multiline}
          {...props}
          placeholder={ocultarEjemplo ? undefined : props.placeholder}
          onFocus={(e) => {
            setEnfocado(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setEnfocado(false);
            props.onBlur?.(e);
          }}
          style={[
            styles.texto,
            { color: colors.textPrimary },
            multiline && styles.multilinea,
            estiloTexto,
            centrado && styles.centrado,
          ]}
        />
        {derecha}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={[styles.error, { color: colors.error }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginBottom: 12 },
  etiqueta: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  caja: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
  },
  cajaConError: { borderWidth: 2 },
  bloqueado: { opacity: 0.7 },
  texto: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  multilinea: { minHeight: 90, textAlignVertical: "top" },
  centrado: { textAlign: "center" },
  error: { fontSize: 12, marginTop: 4, lineHeight: 16 },
});
