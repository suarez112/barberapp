import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useAppTheme } from "@/theme/ThemeProvider";
import { avisarCamposConError, confirmar } from "@/utils/dialogos";
import { horario24AMinutos, minutosAHora } from "@/utils/disponibilidad";
import { DatosEmpresa, PerfilEmpresa } from "../../cuenta/api";
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
  onGuardar: (cambios: Partial<DatosEmpresa>) => Promise<boolean>;
};

const DIAS_LARGOS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];

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
  ) as Partial<DatosEmpresa>;
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

  const editar = (valores: ValoresEmpresa | null) => {
    setErrores({});
    setEdicion(valores);
  };

  const guardar = async () => {
    if (!edicion || guardando) return;
    const resultado = validarEmpresa(edicion);
    if (!resultado.ok) {
      setErrores(resultado.errores);
      avisarCamposConError();
      return;
    }
    const cambios = cambiosEntre(perfil, resultado.datos);
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
      <View>
        <CamposEmpresa
          valores={edicion}
          codigoActual={perfil.codigoAcceso}
          errores={errores}
          onCambiar={(c) => {
            setEdicion((v) => (v ? { ...v, ...c } : v));
            setErrores((e) => sinErrores(e, camposCambiados(c)));
          }}
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
      </View>
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
  ];

  return (
    <View>
      <TituloSeccion>DATOS DEL NEGOCIO</TituloSeccion>
      <View style={[styles.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        {filas.map(([etiqueta, valor]) => (
          <View key={etiqueta} style={styles.fila}>
            <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>{etiqueta}</Text>
            <Text style={[styles.valor, { color: colors.textPrimary }]}>{valor}</Text>
          </View>
        ))}
      </View>

      <TituloSeccion>HORARIO</TituloSeccion>
      <View style={[styles.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        {ORDEN_DIAS.map((dia) => {
          const h = perfil.horario.find((x) => x.dia === dia);
          return (
            <View key={dia} style={styles.fila}>
              <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>
                {DIAS_LARGOS[dia]}
              </Text>
              <Text style={[styles.valor, { color: h?.abierto ? colors.textPrimary : colors.textSecondary }]}>
                {h?.abierto ? `${hora(h.apertura)} a ${hora(h.cierre)}` : "Cerrado"}
              </Text>
            </View>
          );
        })}
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 6 },
  fila: { flexDirection: "row", paddingVertical: 5, gap: 10 },
  etiqueta: { width: 100, fontSize: 12 },
  valor: { flex: 1, fontSize: 13, fontWeight: "600" },
  nota: { fontSize: 12, marginBottom: 8 },
});
