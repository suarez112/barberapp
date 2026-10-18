import { Alert, Platform } from "react-native";

// En web, Alert.alert no muestra botones ni ejecuta callbacks: usamos los
// diálogos del navegador para que el flujo funcione igual en todas las plataformas.

export const avisar = (titulo: string, mensaje?: string) => {
  if (Platform.OS === "web") {
    window.alert(mensaje ? `${titulo}\n\n${mensaje}` : titulo);
    return;
  }
  Alert.alert(titulo, mensaje);
};

type OpcionesConfirmar = {
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  textoCancelar?: string;
  destructivo?: boolean;
  // Texto alterno para el diálogo del navegador
  mensajeWeb?: string;
};

export const confirmar = ({
  titulo,
  mensaje,
  textoConfirmar,
  textoCancelar = "Cancelar",
  destructivo = false,
  mensajeWeb,
}: OpcionesConfirmar): Promise<boolean> => {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(mensajeWeb ?? `${titulo}\n\n${mensaje}`));
  }
  return new Promise((resolve) => {
    Alert.alert(titulo, mensaje, [
      { text: textoCancelar, style: "cancel", onPress: () => resolve(false) },
      {
        text: textoConfirmar,
        style: destructivo ? "destructive" : "default",
        onPress: () => resolve(true),
      },
    ]);
  });
};
