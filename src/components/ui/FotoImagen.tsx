import { Image, ImageProps } from "expo-image";
import { useAppTheme } from "@/theme/ThemeProvider";

type Props = Omit<ImageProps, "source"> & {
  uri: string;
  // En listas la foto se pide con prioridad baja para no frenar lo que ya se ve
  enLista?: boolean;
};

// Foto remota con caché en memoria y disco, fondo de espera y fundido suave.
// El tamaño lo da siempre el `style` de quien la usa (ancho y alto, o ancho + aspectRatio),
// así el espacio queda reservado y la pantalla no salta al cargar.
export default function FotoImagen({ uri, enLista = false, style, ...resto }: Props) {
  const { colors } = useAppTheme();
  return (
    <Image
      source={{ uri }}
      cachePolicy="memory-disk"
      recyclingKey={uri}
      priority={enLista ? "low" : "normal"}
      transition={150}
      contentFit="cover"
      style={[{ backgroundColor: colors.inputBg }, style]}
      {...resto}
    />
  );
}
