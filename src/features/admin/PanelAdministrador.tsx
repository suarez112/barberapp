import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import TextoInfo from "@/components/ui/TextoInfo";
import { useAppTheme } from "@/theme/ThemeProvider";
import PanelNegocio from "../panel/PanelNegocio";
import { useCerrarSesion } from "../sesion/useCerrarSesion";
import { Personal } from "../sesion/usePersonal";
import AvisoPrueba from "./components/AvisoPrueba";
import DatosNegocio from "./components/DatosNegocio";
import FotoNegocio from "./components/FotoNegocio";
import PruebaVencida from "./components/PruebaVencida";
import { useMiEmpresa } from "./useMiEmpresa";

// Panel de cualquier administrador: la cuenta de la empresa (/admin) o un
// integrante con rol Administrador (/panel). Los dos ven las mismas pestañas,
// incluida "Mi negocio".
export default function PanelAdministrador({ personal }: { personal: Personal }) {
  const { colors } = useAppTheme();
  const cerrarSesion = useCerrarSesion();
  const {
    prueba,
    perfil,
    bloqueo,
    cargando,
    errorCarga,
    recargar,
    guardarDatos,
    guardarFoto,
  } = useMiEmpresa(personal.token);

  // La tarjeta del panel de la cuenta muestra el nombre de la administradora, no su correo
  const conNombre: Personal = personal.esCuentaAdmin && perfil?.nombreAdministradora
    ? { ...personal, nombre: perfil.nombreAdministradora }
    : personal;

  // 402: la prueba o la suscripción terminó
  if (bloqueo) {
    return (
      <Pantalla cabecera={{ onSalir: cerrarSesion }}>
        <PruebaVencida mensaje={bloqueo} onSalir={cerrarSesion} />
      </Pantalla>
    );
  }

  const miNegocio = (
    <View>
      <Text style={[styles.titulo, { color: colors.primary }]}>MI NEGOCIO</Text>
      <Text style={[styles.correo, { color: colors.textSecondary }]}>
        Sesión: {conNombre.nombre}
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
            <Text selectable style={[styles.codigoValor, { color: colors.primary }]}>
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

      <Boton
        titulo="CERRAR SESIÓN"
        variante="peligro"
        onPress={cerrarSesion}
        style={styles.salir}
      />
    </View>
  );

  return (
    <PanelNegocio
      personal={conNombre}
      encabezado={prueba ? <AvisoPrueba prueba={prueba} /> : null}
      miNegocio={miNegocio}
    />
  );
}

const styles = StyleSheet.create({
  correo: { fontSize: 12, marginTop: 4 },
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
  salir: { marginTop: 30 },
});
