import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import TextoInfo from "@/components/ui/TextoInfo";
import { useRefrescoDiario } from "@/hooks/useRefrescoDiario";
import { useAppTheme } from "@/theme/ThemeProvider";
import PanelNegocio from "../panel/PanelNegocio";
import { useConfirmarCerrarSesion } from "../panel/useSalirDelPanel";
import { Personal } from "../sesion/usePersonal";
import AvisoSuscripcion from "./components/AvisoSuscripcion";
import DatosNegocio from "./components/DatosNegocio";
import HorariosReserva from "./components/HorariosReserva";
import UbicacionNegocio from "./components/UbicacionNegocio";
import FotoNegocio from "./components/FotoNegocio";
import MiSuscripcion from "./components/MiSuscripcion";
import PanelVencido from "./PanelVencido";
import { useMiEmpresa } from "./useMiEmpresa";

// Panel de cualquier administrador: la cuenta de la empresa (/admin) o un
// integrante con rol Administrador (/panel). Los dos ven las mismas pestañas,
// incluida "Mi negocio". Con la suscripción vencida solo Planes y Mi negocio.
export default function PanelAdministrador({ personal }: { personal: Personal }) {
  const { colors } = useAppTheme();
  const cerrarSesion = useConfirmarCerrarSesion();
  const {
    suscripcion,
    perfil,
    cargando,
    errorCarga,
    recargar,
    actualizarSuscripcion,
    guardarDatos,
    guardarFoto,
    guardarUbicacion,
    guardarIntervalo,
  } = useMiEmpresa(personal.token);

  // Los días restantes cambian a medianoche; también puede haber cambiado
  // el plan mientras la app estaba cerrada
  useRefrescoDiario(actualizarSuscripcion);

  // La tarjeta del panel de la cuenta muestra el nombre de la administradora, no su correo
  const conNombre: Personal = personal.esCuentaAdmin && perfil?.nombreAdministradora
    ? { ...personal, nombre: perfil.nombreAdministradora }
    : personal;

  // Primero se sabe si la suscripción está vigente, para no abrir un panel que respondería 402
  if (cargando && !suscripcion) {
    return (
      <Pantalla cabecera={{ onSalir: cerrarSesion }}>
        <ActivityIndicator color={colors.primaryText} style={styles.cargando} />
      </Pantalla>
    );
  }

  const miNegocio = (
    <View>
      <Text style={[styles.titulo, { color: colors.primaryText }]}>MI NEGOCIO</Text>
      <Text style={[styles.correo, { color: colors.textSecondary }]}>
        Sesión: {conNombre.nombre}
      </Text>

      {cargando && !perfil ? (
        <ActivityIndicator color={colors.primaryText} style={styles.cargando} />
      ) : null}

      {errorCarga ? (
        <View>
          <TextoInfo>{errorCarga}</TextoInfo>
          <Boton
            titulo="REINTENTAR"
            ayuda="Vuelve a cargar los datos del negocio"
            variante="secundario"
            onPress={recargar}
          />
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
            <Text selectable style={[styles.codigoValor, { color: colors.primaryText }]}>
              {perfil.codigoAcceso}
            </Text>
            <Text style={[styles.codigoEtiqueta, { color: colors.textSecondary }]}>
              Lo escriben en &quot;Soy cliente&quot; para ver tu negocio y reservar.
            </Text>
          </View>

          {suscripcion ? <MiSuscripcion suscripcion={suscripcion} /> : null}
          <FotoNegocio fotoUrl={perfil.fotoUrl} onGuardar={guardarFoto} />
          <DatosNegocio perfil={perfil} onGuardar={guardarDatos} />
          <HorariosReserva perfil={perfil} onGuardar={guardarIntervalo} />
          <UbicacionNegocio perfil={perfil} onGuardar={guardarUbicacion} />
        </>
      ) : null}
    </View>
  );

  if (suscripcion?.estado === "vencida") {
    return <PanelVencido suscripcion={suscripcion} miNegocio={miNegocio} />;
  }

  return (
    <PanelNegocio
      personal={conNombre}
      encabezado={suscripcion ? <AvisoSuscripcion suscripcion={suscripcion} /> : null}
      miNegocio={miNegocio}
      onSuscripcionVencida={actualizarSuscripcion}
      suscripcion={suscripcion}
      onEquipoCambiado={actualizarSuscripcion}
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
});
