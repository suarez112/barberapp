import { ReactNode, useState } from "react";
import {
  Platform,
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

// Campo de texto accesible: etiqueta arriba, recuadro de 50 px y el error debajo
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
            borderColor: error
              ? colors.error
              : enfocado
                ? colors.inputBorderFoco
                : colors.inputBorder,
          },
          // El borde de enfoque va en la caja entera (con el ojo, la bandera o el "$" adentro)
          error || enfocado ? styles.cajaResaltada : null,
          multiline ? styles.cajaMultilinea : styles.cajaUnaLinea,
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
            sinContornoWeb,
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
    borderRadius: 8,
    // Borde + relleno suman siempre 2 px: al enfocar o con error el borde crece y el
    // relleno se achica, así la caja no cambia de tamaño
    borderWidth: 1,
    padding: 1,
  },
  cajaResaltada: { borderWidth: 2, padding: 0 },
  // 50 px con o sin ícono y con cualquier tamaño de letra: botones internos de 46 px
  // + 2 px de borde/relleno arriba y abajo
  cajaUnaLinea: { height: 50 },
  cajaMultilinea: { minHeight: 50, alignItems: "stretch" },
  bloqueado: { opacity: 0.7 },
  // Sin borde ni alto propio: el borde, el tamaño y el color de enfoque son solo de la caja
  texto: {
    flex: 1,
    alignSelf: "stretch",
    borderWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 0,
    fontSize: 15,
  },
  multilinea: { minHeight: 90, paddingVertical: 12, textAlignVertical: "top" },
  centrado: { textAlign: "center" },
  error: { fontSize: 12, marginTop: 4, lineHeight: 16 },
});

// En web el navegador dibuja su propio contorno alrededor del <input> (un recuadro dentro de
// la caja, cortado junto al ojo o la bandera). Chrome ignora outline-width: 0 si el estilo es
// "auto", por eso también va outlineStyle: "none" (no está en los tipos de React Native).
const sinContornoWeb =
  Platform.OS === "web" ? ({ outlineStyle: "none", outlineWidth: 0 } as unknown as TextStyle) : null;
