import { Linking } from "react-native";
import { avisar } from "./dialogos";

// Arma el número internacional (solo dígitos). El backend guarda los teléfonos en
// E.164 ("+573001234567"), que ya traen el indicativo. Los antiguos sin "+" usan el
// indicativo guardado en la cita; sin él: 10 dígitos -> Colombia (57);
// 11 a 15 dígitos -> ya traen indicativo.
export const numeroParaWhatsApp = (
  telefono?: string,
  indicativo?: string,
): string | null => {
  const digitos = (telefono ?? "").replace(/\D/g, "");
  if (!digitos) return null;
  const ind = (indicativo ?? "").replace(/\D/g, "");
  let numero: string;
  if ((telefono ?? "").trim().startsWith("+")) numero = digitos;
  else if (ind) numero = `${ind}${digitos}`;
  else if (digitos.length === 10) numero = `57${digitos}`;
  else numero = digitos;
  return numero.length >= 8 && numero.length <= 15 ? numero : null;
};

export const abrirWhatsApp = async (telefono?: string, indicativo?: string) => {
  const numero = numeroParaWhatsApp(telefono, indicativo);
  if (!numero) {
    avisar(
      "Sin número disponible",
      "Este cliente no tiene un número de teléfono válido registrado.",
    );
    return;
  }
  try {
    await Linking.openURL(`https://wa.me/${numero}`);
  } catch (error) {
    console.error("Error al abrir WhatsApp:", error);
    avisar("No se pudo abrir WhatsApp", "Verifica que esté instalado.", "error");
  }
};
