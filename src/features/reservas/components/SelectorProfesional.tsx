import { StyleSheet, Text, View } from "react-native";
import FotoBarbero from "@/components/FotoBarbero";
import { estilosTexto } from "@/components/ui/estilosTexto";
import { useAppTheme } from "@/theme/ThemeProvider";
import { Barbero } from "@/types";
import TarjetaOpcion, { estilosCuadricula } from "./TarjetaOpcion";

type Props = {
  barberos: Barbero[];
  seleccionado: Barbero | null;
  onSeleccionar: (b: Barbero) => void;
};

export default function SelectorProfesional({
  barberos,
  seleccionado,
  onSeleccionar,
}: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={estilosCuadricula.cuadricula}>
      {barberos.map((b) => (
        <TarjetaOpcion
          key={b.id}
          seleccionada={seleccionado?.id === b.id}
          etiqueta={[b.nombre, b.especialidad].filter(Boolean).join(", ")}
          ayuda="Elige este profesional para tu cita"
          onPress={() => onSeleccionar(b)}
        >
          <FotoBarbero
            nombre={b.nombre}
            foto={b.foto}
            color={colors.primaryText}
            forma="rectangulo"
          />
          <Text style={[estilosTexto.titulo, { color: colors.textPrimary }]}>
            {b.nombre}
          </Text>
          <Text style={[estilosTexto.subtitulo, { color: colors.textSecondary }]}>
            {b.especialidad}
          </Text>
          <Text style={[styles.equipo, { color: colors.apagadoTexto }]}>{b.equipo}</Text>
        </TarjetaOpcion>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  equipo: { fontSize: 10, fontWeight: "bold", marginTop: 8 },
});
