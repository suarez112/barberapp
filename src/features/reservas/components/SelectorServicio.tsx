import { StyleSheet, Text, View } from "react-native";
import { estilosTexto } from "@/components/ui/estilosTexto";
import { useAppTheme } from "@/theme/ThemeProvider";
import { Servicio } from "@/types";
import { formatearPesos } from "@/utils/formato";
import TarjetaOpcion, { estilosCuadricula } from "./TarjetaOpcion";

type Props = {
  servicios: Servicio[];
  seleccionado: Servicio | null;
  onSeleccionar: (s: Servicio) => void;
};

export default function SelectorServicio({
  servicios,
  seleccionado,
  onSeleccionar,
}: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={estilosCuadricula.cuadricula}>
      {servicios.map((s) => (
        <TarjetaOpcion
          key={s.id}
          seleccionada={seleccionado?.id === s.id}
          etiqueta={`${s.nombre}, ${s.duracion}, ${formatearPesos(s.precio)} pesos`}
          ayuda="Elige este servicio para tu cita"
          onPress={() => onSeleccionar(s)}
        >
          <Text style={[estilosTexto.titulo, { color: colors.textPrimary }]}>
            {s.nombre}
          </Text>
          <Text style={[styles.precio, { color: colors.primaryText }]}>
            {s.duracion} · ${formatearPesos(s.precio)}
          </Text>
        </TarjetaOpcion>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  precio: { fontSize: 12, fontWeight: "bold", marginTop: 6 },
});
