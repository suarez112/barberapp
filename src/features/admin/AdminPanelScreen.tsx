import { Redirect, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import TextoInfo from "@/components/ui/TextoInfo";
import { useAppTheme } from "@/theme/ThemeProvider";
import { confirmar } from "@/utils/dialogos";
import { useCuenta } from "../cuenta/CuentaProvider";
import AvisoPrueba from "./components/AvisoPrueba";
import DatosNegocio from "./components/DatosNegocio";
import FotoNegocio from "./components/FotoNegocio";
import PruebaVencida from "./components/PruebaVencida";
import { useMiEmpresa } from "./useMiEmpresa";

// Panel del administrador de la empresa (cuenta de /api/v1/cuentas)
export default function AdminPanelScreen() {
  const { usuario } = useCuenta();

  // Sin sesión de cuenta se va al ingreso; un cliente solo ve su apartado
  if (!usuario) return <Redirect href="/login" />;
  if (usuario.rol !== "admin") return <Redirect href="/cliente" />;

  return <PanelAdmin />;
}

function PanelAdmin() {
  const { colors } = useAppTheme();
  const { usuario, cerrarCuenta } = useCuenta();
  const {
    prueba,
    perfil,
    bloqueo,
    cargando,
    errorCarga,
    recargar,
    guardarDatos,
    guardarFoto,
  } = useMiEmpresa();

  const salir = useCallback(async () => {
    const ok = await confirmar({
      titulo: "Cerrar Sesión",
      mensaje: "¿Deseas salir del panel de tu negocio?",
      textoConfirmar: "Cerrar Sesión",
      destructivo: true,
    });
    if (ok) cerrarCuenta();
  }, [cerrarCuenta]);

  // El botón atrás de Android no saca del panel con la sesión abierta: pide cerrarla
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        salir();
        return true;
      });
      return () => sub.remove();
    }, [salir]),
  );

  if (bloqueo) {
    return (
      <Pantalla cabecera={{ onSalir: cerrarCuenta }}>
        <PruebaVencida mensaje={bloqueo} onSalir={cerrarCuenta} />
      </Pantalla>
    );
  }

  return (
    <Pantalla cabecera={{ onSalir: salir }}>
      <View>
        <Text style={[styles.hola, { color: colors.textSecondary }]}>
          Sesión: {usuario?.correo}
        </Text>

        {prueba ? <AvisoPrueba prueba={prueba} /> : null}

        <Text style={[styles.titulo, { color: colors.primary }]}>
          MI NEGOCIO
        </Text>

        {cargando && !perfil ? (
          <ActivityIndicator color={colors.primary} style={styles.cargando} />
        ) : null}

        {errorCarga ? (
          <View>
            <TextoInfo>{errorCarga}</TextoInfo>
            <Boton titulo="REINTENTAR" variante="neutro" onPress={recargar} />
          </View>
        ) : null}

        {perfil ? (
          <>
            <View
              style={[
                styles.codigo,
                { backgroundColor: colors.cardBg, borderColor: colors.primary },
              ]}
            >
              <Text style={[styles.codigoEtiqueta, { color: colors.textSecondary }]}>
                Código para tus clientes
              </Text>
              <Text
                selectable
                style={[styles.codigoValor, { color: colors.primary }]}
              >
                {perfil.codigoAcceso}
              </Text>
              <Text style={[styles.codigoEtiqueta, { color: colors.textSecondary }]}>
                Lo escriben en &quot;Soy cliente&quot; para ver tu negocio y reservar.
              </Text>
            </View>

            <FotoNegocio fotoUrl={perfil.fotoUrl} onGuardar={guardarFoto} />
            <DatosNegocio perfil={perfil} onGuardar={guardarDatos} />
          </>
        ) : null}
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  hola: { fontSize: 12, marginTop: 12 },
  titulo: {
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
    marginTop: 20,
  },
  cargando: { marginTop: 30 },
  codigo: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 12,
  },
  codigoEtiqueta: { fontSize: 12, textAlign: "center" },
  codigoValor: {
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: 4,
    marginVertical: 6,
  },
});
