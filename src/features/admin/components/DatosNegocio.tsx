import { ReactNode, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import Desplegable from "@/components/ui/Desplegable";
import SeccionPlegable from "@/components/ui/SeccionPlegable";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { ZONAS_HORARIAS } from "@/data/zonasHorarias";
import { useTelefono } from "@/hooks/useTelefono";
import { useAppTheme } from "@/theme/ThemeProvider";
import { telefonoMostrado } from "@/utils/telefonos";
import { avisarCamposConError, confirmar } from "@/utils/dialogos";
import { horario24AMinutos, minutosAHora } from "@/utils/disponibilidad";
import { CambiosEmpresa, DatosEmpresa, PerfilEmpresa } from "../../cuenta/api";
import CamposEmpresa from "../../cuenta/formulario/CamposEmpresa";
import {
  CampoEmpresa,
  camposCambiados,
  Errores,
  sinErrores,
  ValoresEmpresa,
  validarEmpresa,
  valoresDesdePerfil,
} from "../../cuenta/formulario/validarEmpresa";

type Props = {
  perfil: PerfilEmpresa;
  onGuardar: (cambios: CambiosEmpresa) => Promise<boolean>;
};

const DIAS_LARGOS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];

// 0 a 48 horas de anticipación mínima para cancelar o reprogramar
const OPCIONES_ANTICIPACION = Array.from({ length: 49 }, (_, h) => ({
  valor: h,
  etiqueta: h === 0 ? "Sin límite (hasta el último momento)" : h === 1 ? "1 hora" : `${h} horas`,
}));

const textoAnticipacion = (h: number) =>
  h === 0 ? "Sin límite" : h === 1 ? "1 hora" : `${h} horas`;

// Zona horaria: las conocidas más la que ya tenga el negocio, si es otra
const opcionesZona = (actual: string) =>
  ZONAS_HORARIAS.some((z) => z.valor === actual)
    ? ZONAS_HORARIAS
    : [...ZONAS_HORARIAS, { valor: actual, etiqueta: actual }];

const nombreZona = (zona: string) =>
  ZONAS_HORARIAS.find((z) => z.valor === zona)?.etiqueta ?? zona;

const hora = (hhmm: string | null) => (hhmm ? minutosAHora(horario24AMinutos(hhmm)) : "");

// Solo se envían los campos que cambiaron. Departamento y municipio van juntos.
const cambiosEntre = (antes: PerfilEmpresa, despues: DatosEmpresa) => {
  const cambios = Object.fromEntries(
    (Object.keys(despues) as (keyof DatosEmpresa)[])
      .filter((k) => {
        const anterior =
          k === "horario"
            ? antes.horario.map((h) =>
                h.abierto
                  ? { dia: h.dia, abierto: true, apertura: h.apertura, cierre: h.cierre }
                  : { dia: h.dia, abierto: false },
              )
            : antes[k];
        return JSON.stringify(anterior) !== JSON.stringify(despues[k]);
      })
      .map((k) => [k, despues[k]]),
  ) as CambiosEmpresa;
  if (cambios.departamento || cambios.ciudad) {
    cambios.departamento = despues.departamento;
    cambios.ciudad = despues.ciudad;
  }
  return cambios;
};

// Datos de la empresa: lectura y edición
export default function DatosNegocio({ perfil, onGuardar }: Props) {
  const { colors } = useAppTheme();
  const [edicion, setEdicion] = useState<ValoresEmpresa | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Errores<CampoEmpresa>>({});
  const whatsapp = useTelefono();
  const [anticipacion, setAnticipacion] = useState(perfil.anticipacionCancelacionHoras);
  const [zona, setZona] = useState(perfil.zonaHoraria);

  const editar = (valores: ValoresEmpresa | null) => {
    setErrores({});
    if (valores) {
      whatsapp.cargar(perfil.whatsappContacto);
      setAnticipacion(perfil.anticipacionCancelacionHoras);
      setZona(perfil.zonaHoraria);
    }
    setEdicion(valores);
  };

  const guardar = async () => {
    if (!edicion || guardando) return;
    const resultado = validarEmpresa(edicion);
    const contacto = whatsapp.validarOpcional();
    if (!resultado.ok || contacto === null) {
      setErrores(resultado.ok ? {} : resultado.errores);
      avisarCamposConError();
      return;
    }
    const cambios = cambiosEntre(perfil, resultado.datos);
    // WhatsApp: vacío lo quita; solo se envía si cambió
    const nuevoWhatsapp = contacto === "vacio" ? null : contacto.telefono;
    if (nuevoWhatsapp !== perfil.whatsappContacto) {
      cambios.whatsappContacto = nuevoWhatsapp;
      if (contacto !== "vacio") cambios.indicativoWhatsapp = contacto.indicativo;
    }
    if (anticipacion !== perfil.anticipacionCancelacionHoras) {
      cambios.anticipacionCancelacionHoras = anticipacion;
    }
    if (zona !== perfil.zonaHoraria) cambios.zonaHoraria = zona;
    if (Object.keys(cambios).length === 0) {
      editar(null);
      return;
    }
    if (cambios.codigoAcceso) {
      const ok = await confirmar({
        titulo: "Cambiar código del negocio",
        mensaje: `Tus clientes deberán usar el nuevo código ${cambios.codigoAcceso} para ver tu negocio y reservar. El código ${perfil.codigoAcceso} dejará de funcionar de inmediato.`,
      });
      if (!ok) return;
    }
    setGuardando(true);
    const ok = await onGuardar(cambios);
    setGuardando(false);
    if (ok) editar(null);
  };

  if (edicion) {
    return (
      <SeccionPlegable titulo="Datos del negocio" icono="storefront-outline" abiertaAlInicio>
        <CamposEmpresa
          valores={edicion}
          codigoActual={perfil.codigoAcceso}
          errores={errores}
          whatsapp={whatsapp}
          onCambiar={(c) => {
            setEdicion((v) => (v ? { ...v, ...c } : v));
            setErrores((e) => sinErrores(e, camposCambiados(c)));
          }}
        />
        <TituloSeccion>CANCELAR Y REPROGRAMAR</TituloSeccion>
        <Desplegable
          etiqueta="Anticipación mínima para cancelar o reprogramar"
          ayuda="Cuántas horas antes de la cita puede un cliente con cuenta cancelarla o cambiarla. Después debe escribirte"
          placeholder="Elige las horas"
          opciones={OPCIONES_ANTICIPACION}
          valor={anticipacion}
          onCambiar={setAnticipacion}
        />
        <TituloSeccion>ZONA HORARIA</TituloSeccion>
        <Desplegable
          etiqueta="Zona horaria del negocio"
          ayuda="Las horas de tu horario y de las citas se cuentan en esta zona. Para cambiarla no puedes tener citas pendientes"
          placeholder="Elige la zona horaria"
          buscable
          opciones={opcionesZona(perfil.zonaHoraria)}
          valor={zona}
          onCambiar={setZona}
        />
        <Boton
          titulo={guardando ? "GUARDANDO…" : "GUARDAR CAMBIOS"}
          ayuda="Guarda los datos del negocio"
          deshabilitado={guardando}
          onPress={guardar}
        />
        <Boton
          titulo="CANCELAR"
          ayuda="Descarta los cambios"
          variante="secundario"
          onPress={() => editar(null)}
        />
      </SeccionPlegable>
    );
  }

  const filas: [string, string][] = [
    ["Nombre", perfil.nombre],
    ["Categoría", perfil.categoria],
    ["Administra", perfil.nombreAdministradora],
    ["Empleados", String(perfil.numeroEmpleados)],
    ["Departamento", perfil.departamento ?? "Sin elegir"],
    ["Municipio", perfil.ciudad],
    ["Dirección", perfil.direccion],
    [
      "WhatsApp",
      perfil.whatsappContacto
        ? telefonoMostrado(perfil.whatsappContacto).texto
        : "Sin configurar",
    ],
  ];

  const tarjeta = (children: ReactNode) => (
    <View style={[styles.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
      {children}
    </View>
  );
  const fila = (etiqueta: string, valor: string, color = colors.textPrimary) => (
    <View key={etiqueta} style={styles.fila}>
      <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>{etiqueta}</Text>
      <Text style={[styles.valor, { color }]}>{valor}</Text>
    </View>
  );

  return (
    <>
      <SeccionPlegable titulo="Datos del negocio" icono="storefront-outline" abiertaAlInicio>
        {tarjeta(filas.map(([etiqueta, valor]) => fila(etiqueta, valor)))}
        {!perfil.departamento ? (
          <Text style={[styles.nota, { color: colors.primaryText }]}>
            Completa el departamento y el municipio de tu negocio en &quot;Editar datos&quot;.
          </Text>
        ) : null}
        <Boton
          titulo="EDITAR DATOS"
          ayuda="Abre el formulario para cambiar los datos y el horario del negocio"
          onPress={() => editar(valoresDesdePerfil(perfil))}
        />
      </SeccionPlegable>

      <SeccionPlegable titulo="Horario" icono="time-outline" abiertaAlInicio>
        {tarjeta(
          ORDEN_DIAS.map((dia) => {
            const h = perfil.horario.find((x) => x.dia === dia);
            return fila(
              DIAS_LARGOS[dia],
              h?.abierto ? `${hora(h.apertura)} a ${hora(h.cierre)}` : "Cerrado",
              h?.abierto ? colors.textPrimary : colors.textSecondary,
            );
          }),
        )}
      </SeccionPlegable>

      <SeccionPlegable titulo="Cancelaciones" icono="close-circle-outline">
        {tarjeta(fila("Cancelar o reprogramar", textoAnticipacion(perfil.anticipacionCancelacionHoras)))}
        <Text style={[styles.nota, { color: colors.textSecondary }]}>
          Para cambiarlo toca &quot;Editar datos&quot; en Datos del negocio.
        </Text>
      </SeccionPlegable>

      <SeccionPlegable titulo="Zona horaria" icono="globe-outline">
        {tarjeta(fila("Zona horaria", nombreZona(perfil.zonaHoraria)))}
        <Text style={[styles.nota, { color: colors.textSecondary }]}>
          Para cambiarla toca &quot;Editar datos&quot; en Datos del negocio.
        </Text>
      </SeccionPlegable>
    </>
  );
}

const styles = StyleSheet.create({
  tarjeta: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 6 },
  fila: { flexDirection: "row", paddingVertical: 5, gap: 10 },
  etiqueta: { width: 100, fontSize: 12 },
  valor: { flex: 1, fontSize: 13, fontWeight: "600" },
  nota: { fontSize: 12, marginBottom: 8 },
});
