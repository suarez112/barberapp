import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import TextoInfo from "@/components/ui/TextoInfo";
import { useRefrescoDiario } from "@/hooks/useRefrescoDiario";
import { useAppTheme } from "@/theme/ThemeProvider";
import { GuiaContext, useGuia } from "../guia/guiaContexto";
import PrimerosPasos from "../guia/PrimerosPasos";
import { useGuiaInicial } from "../guia/useGuiaInicial";
import { useNotificaciones } from "../notificaciones/NotificacionesProvider";
import PanelNegocio from "../panel/PanelNegocio";
import { useConfirmarCerrarSesion } from "../panel/useSalirDelPanel";
import { Personal } from "../sesion/usePersonal";
import { FuncionesProvider } from "../planes/FuncionesProvider";
import { useFunciones } from "../planes/funcionesContexto";
import AtiendoClientes from "./components/AtiendoClientes";
import AvisoSuscripcion from "./components/AvisoSuscripcion";
import DatosNegocio from "./components/DatosNegocio";
import EnlacePublicoNegocio from "./components/EnlacePublicoNegocio";
import HorariosReserva from "./components/HorariosReserva";
import UbicacionNegocio from "./components/UbicacionNegocio";
import FotoNegocio from "./components/FotoNegocio";
import MiSuscripcion from "./components/MiSuscripcion";
import PanelVencido from "./PanelVencido";
import { useMiEmpresa } from "./useMiEmpresa";

// Abre Planes cuando se tocó un aviso de la prueba gratuita. Va dentro de FuncionesProvider.
function AbrirPlanesPendiente() {
  const { planesPendiente, limpiarPlanesPendiente } = useNotificaciones();
  const { abrirPlanes } = useFunciones();
  useEffect(() => {
    if (!planesPendiente) return;
    abrirPlanes();
    limpiarPlanesPendiente();
  }, [planesPendiente, abrirPlanes, limpiarPlanesPendiente]);
  return null;
}

// Vuelve a mostrar los primeros pasos si el administrador los ocultó sin terminarlos
function MostrarGuia() {
  const { guia, mostrar } = useGuia();
  if (!guia?.oculta || guia.completa) return null;
  return (
    <Boton
      titulo="MOSTRAR PRIMEROS PASOS"
      ayuda="Vuelve a mostrar la guía de primeros pasos en el panel"
      variante="secundario"
      onPress={mostrar}
      style={styles.mostrarGuia}
    />
  );
}

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
    guardarDatos: guardarDatosNegocio,
    guardarFoto,
    guardarUbicacion,
    guardarIntervalo,
  } = useMiEmpresa(personal.token);

  const guia = useGuiaInicial(personal.token);

  // Los días restantes cambian a medianoche; también puede haber cambiado
  // el plan mientras la app estaba cerrada
  useRefrescoDiario(actualizarSuscripcion);

  // Guardar "Mi negocio" marca el paso del horario en la guía
  const guardarDatos: typeof guardarDatosNegocio = async (...args) => {
    const resultado = await guardarDatosNegocio(...args);
    guia.refrescar();
    return resultado;
  };

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

          <MostrarGuia />
          {suscripcion ? <MiSuscripcion suscripcion={suscripcion} /> : null}
          {/* Solo la cuenta de la empresa: un integrante administrador usa "Atiende clientes" en Equipo */}
          {personal.esCuentaAdmin ? (
            <AtiendoClientes token={personal.token} suscripcion={suscripcion} onEquipoCambiado={actualizarSuscripcion} />
          ) : null}
          <EnlacePublicoNegocio perfil={perfil} />
          <FotoNegocio fotoUrl={perfil.fotoUrl} onGuardar={guardarFoto} />
          <DatosNegocio perfil={perfil} onGuardar={guardarDatos} />
          <HorariosReserva perfil={perfil} onGuardar={guardarIntervalo} />
          <UbicacionNegocio perfil={perfil} onGuardar={guardarUbicacion} />
        </>
      ) : null}
    </View>
  );

  // Las funciones del plan se piden una sola vez para todo el panel (candados, Mi suscripción)
  if (suscripcion?.estado === "vencida") {
    return (
      <FuncionesProvider token={personal.token} suscripcion={suscripcion}>
        <PanelVencido suscripcion={suscripcion} miNegocio={miNegocio} />
      </FuncionesProvider>
    );
  }

  return (
    <GuiaContext.Provider value={guia}>
      <FuncionesProvider token={personal.token} suscripcion={suscripcion}>
        <AbrirPlanesPendiente />
        <PanelNegocio
          personal={conNombre}
          encabezado={(pestana, irA) => (
            <>
              {suscripcion ? <AvisoSuscripcion suscripcion={suscripcion} /> : null}
              <PrimerosPasos pestana={pestana} nombreNegocio={perfil?.nombre ?? ""} onIr={irA} />
            </>
          )}
          miNegocio={miNegocio}
          onSuscripcionVencida={actualizarSuscripcion}
          suscripcion={suscripcion}
          onEquipoCambiado={actualizarSuscripcion}
        />
      </FuncionesProvider>
    </GuiaContext.Provider>
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
  mostrarGuia: { marginTop: 12 },
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
