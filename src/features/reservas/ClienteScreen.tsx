import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Selector from "@/components/ui/Selector";
import { useNegocio } from "@/features/negocio/NegocioProvider";
import { useAbrirNegocio } from "@/features/negocio/useAbrirNegocio";
import CatalogoProductos from "@/features/productos/CatalogoProductos";
import { useAppTheme } from "@/theme/ThemeProvider";
import ConfirmacionCita from "./components/ConfirmacionCita";
import FormularioReserva from "./components/FormularioReserva";
import InfoNegocio from "./components/InfoNegocio";
import IngresoCodigo from "./components/IngresoCodigo";
import { useReserva } from "./hooks/useReserva";

type Vista = "RESERVAR" | "PRODUCTOS";

const VISTAS = [
  { id: "RESERVAR", label: "Reservar" },
  { id: "PRODUCTOS", label: "Productos" },
] as const;

export default function ClienteScreen() {
  // Enlace o QR del negocio: ej. /cliente?codigo=INFINITY entra directo
  const { codigo } = useLocalSearchParams<{ codigo?: string }>();
  const codigoEnlace = (typeof codigo === "string" ? codigo : "")
    .trim()
    .toUpperCase();
  const modoEnlace = codigoEnlace !== "";

  const { back, canGoBack, replace } = useRouter();
  const { empresa, salirDelNegocio } = useNegocio();
  const abrirNegocio = useAbrirNegocio();

  useEffect(() => {
    if (codigoEnlace) abrirNegocio(codigoEnlace);
    // Solo al cambiar el código del enlace
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigoEnlace]);

  const volver = () => {
    if (canGoBack()) back();
    else replace("/");
  };

  return (
    <Pantalla
      cabecera={{
        onVolver: modoEnlace ? undefined : volver,
        mostrarNotificaciones: true,
      }}
    >
      {empresa ? (
        // key: al cambiar de negocio, el formulario empieza de cero
        <VistaNegocio
          key={empresa.id}
          onCambiarCodigo={modoEnlace ? undefined : salirDelNegocio}
        />
      ) : (
        <IngresoCodigo />
      )}
    </Pantalla>
  );
}

function VistaNegocio({ onCambiarCodigo }: { onCambiarCodigo?: () => void }) {
  const { colors } = useAppTheme();
  const { empresa, productos } = useNegocio();
  const [vista, setVista] = useState<Vista>("RESERVAR");
  // Vive aquí (y no en el formulario) para no perder lo escrito al ver productos
  const reserva = useReserva();
  const { confirmacion, cerrarConfirmacion } = reserva;

  if (!empresa) return null;

  return (
    <View>
      <InfoNegocio codigo={empresa.codigoAcceso} />
      <Selector
        opciones={VISTAS}
        valor={vista}
        onCambiar={setVista}
        style={styles.selectorVista}
        textStyle={styles.textoVista}
      />

      {vista === "PRODUCTOS" ? (
        <View style={styles.productos}>
          <CatalogoProductos
            colors={colors}
            modo="cliente"
            empresaId={empresa.id}
            productos={productos}
          />
        </View>
      ) : (
        <FormularioReserva reserva={reserva} onCambiarCodigo={onCambiarCodigo} />
      )}

      <ConfirmacionCita
        visible={confirmacion !== null}
        datos={confirmacion}
        colors={colors}
        onCerrar={cerrarConfirmacion}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  selectorVista: { marginTop: 10, marginBottom: 6 },
  textoVista: { fontSize: 14 },
  productos: { marginTop: 10 },
});
