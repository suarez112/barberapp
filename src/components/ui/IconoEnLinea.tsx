import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";

type Props = {
  nombre: ComponentProps<typeof Ionicons>["name"];
  color: string;
  tamano?: number;
};

// Ícono dentro de un texto en lugar de un emoji: se ve igual en todos los equipos y el
// lector de pantalla no lo lee (es decorativo; el texto de al lado dice lo que significa)
export default function IconoEnLinea({ nombre, color, tamano = 14 }: Props) {
  return (
    <Ionicons
      name={nombre}
      size={tamano}
      color={color}
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
