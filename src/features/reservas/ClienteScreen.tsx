import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import PantallaAviso from "@/components/ui/PantallaAviso";
import Selector from "@/components/ui/Selector";
import { useCuenta } from "@/features/cuenta/CuentaProvider";
import { useNegocio } from "@/features/negocio/NegocioProvider";
import { useAbrirNegocio } from "@/features/negocio/useAbrirNegocio";
import CatalogoProductos from "@/features/productos/CatalogoProductos";
import { useAppTheme } from "@/theme/ThemeProvider";
import ConfirmacionCita from "./components/ConfirmacionCita";
import FormularioReserva from "./components/FormularioReserva";
import InfoNegocio from "./components/InfoNegocio";
import IngresoCodigo from "./components/IngresoCodigo";
import OpcionesCliente from "./components/OpcionesCliente";
import { useReserva } from "./hooks/useReserva";

type Vista = "RESERVAR" | "PRODUCTOS";

const VISTAS = [
  { id: "RESERVAR", label: "Reservar" },
  { id: "PRODUCTOS", label: "Productos" },
] as const;

// "Soy cliente": como invitado (con el código, el enlace o el QR) o con su cuenta
export default function ClienteScreen() {
  const { colors } = useAppTheme();
  // Enlace o QR del negocio: ej. /cliente?codigo=INFINITY entra directo.
  // "Mis negocios" también abre así el negocio elegido.
  const { codigo } = useLocalSearchParams<{ codigo?: string }>();
  const codigoEnlace = (typeof codigo === "string" ? codigo : "")
    .trim()
    .toUpperCase();
  const modoEnlace = codigoEnlace !== "";

  const { back, canGoBack, replace } = useRouter();
  const { empresa, salirDelNegocio } = useNegocio();
  const { usuario } = useCuenta();
  const conCuenta = usuario?.rol === "cliente";
  const abrirNegocio = useAbrirNegocio();
  // Eligió "Continuar como invitado": se pide el código
  const [invitado, setInvitado] = useState(false);

  useEffect(() => {
    if (codigoEnlace) abrirNegocio(codigoEnlace);
    // Solo al cambiar el código del enlace
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigoEnlace]);

  const volver = () => {
    if (invitado && !empresa) setInvitado(false);
    else if (canGoBack()) back();
    else replace("/");
  };

  // Con cuenta, el inicio del cliente es "Mis negocios"
  if (conCuenta && !modoEnlace && !empresa) return <Redirect href="/mis-negocios" />;

  const contenido = () => {
    // key: al cambiar de negocio, el formulario empieza de cero.
    // Con enlace o con cuenta el negocio es fijo: se cambia volviendo atrás.
    if (empresa) {
      return (
        <VistaNegocio
          key={empresa.id}
          onCambiarCodigo={modoEnlace || conCuenta ? undefined : salirDelNegocio}
        />
      );
    }
    if (modoEnlace) {
      // Desde "Mis negocios" (o mientras se vuelve a esa pantalla) se espera el negocio
      return conCuenta ? (
        <ActivityIndicator color={colors.primaryText} style={styles.cargando} />
      ) : (
        <IngresoCodigo />
      );
    }
    return invitado ? (
      <IngresoCodigo />
    ) : (
      <OpcionesCliente onInvitado={() => setInvitado(true)} />
    );
  };

  return (
    // El enlace web o el QR no tiene adónde volver; con cuenta se vuelve a "Mis negocios"
    <Pantalla cabecera={{ onVolver: modoEnlace && !conCuenta ? undefined : volver }}>
      {contenido()}
    </Pantalla>
  );
}

function VistaNegocio({ onCambiarCodigo }: { onCambiarCodigo?: () => void }) {
  const { colors } = useAppTheme();
  const { empresa } = useNegocio();
  const [vista, setVista] = useState<Vista>("RESERVAR");
  // Vive aquí (y no en el formulario) para no perder lo escrito al ver productos
  const reserva = useReserva();
  const { confirmacion, cerrarConfirmacion } = reserva;

  if (!empresa) return null;

  // Suscripción vencida: el backend rechazaría la reserva (403)
  if (empresa.recibiendoReservas === false) {
    return (
      <View>
        <InfoNegocio codigo={empresa.codigoAcceso} />
        <PantallaAviso
          icono="calendar-clear-outline"
          titulo="Este negocio no está recibiendo reservas por ahora"
          mensaje="Intenta más tarde o comunícate directamente con el negocio."
        >
          {onCambiarCodigo ? (
            <Boton
              titulo="CAMBIAR CÓDIGO"
              ayuda="Vuelve a escribir el código de otro negocio"
              variante="neutro"
              onPress={onCambiarCodigo}
              style={styles.botonAviso}
            />
          ) : null}
        </PantallaAviso>
      </View>
    );
  }

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
          <CatalogoProductos codigo={empresa.codigoAcceso} />
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
  botonAviso: { marginTop: 24, alignSelf: "stretch" },
  cargando: { marginTop: 40 },
});
