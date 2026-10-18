import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useAppTheme } from "@/theme/ThemeProvider";
import { avisar } from "@/utils/dialogos";
import { textoDiasAtencion } from "@/utils/formato";
import { DatosEmpresa, PerfilEmpresa } from "../../cuenta/api";
import CamposEmpresa from "../../cuenta/formulario/CamposEmpresa";
import {
  ValoresEmpresa,
  validarEmpresa,
  valoresDesdePerfil,
} from "../../cuenta/formulario/validarEmpresa";

type Props = {
  perfil: PerfilEmpresa;
  onGuardar: (cambios: Partial<DatosEmpresa>) => Promise<boolean>;
};

// Solo se envían los campos que cambiaron
const cambiosEntre = (antes: DatosEmpresa, despues: DatosEmpresa) =>
  Object.fromEntries(
    (Object.keys(despues) as (keyof DatosEmpresa)[])
      .filter((k) => JSON.stringify(antes[k]) !== JSON.stringify(despues[k]))
      .map((k) => [k, despues[k]]),
  ) as Partial<DatosEmpresa>;

// Datos de la empresa: lectura y edición
export default function DatosNegocio({ perfil, onGuardar }: Props) {
  const { colors } = useAppTheme();
  const [edicion, setEdicion] = useState<ValoresEmpresa | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (!edicion || guardando) return;
    const resultado = validarEmpresa(edicion);
    if (!resultado.ok) {
      avisar("Revisa el formulario", resultado.error);
      return;
    }
    const original = validarEmpresa(valoresDesdePerfil(perfil));
    const cambios = original.ok
      ? cambiosEntre(original.datos, resultado.datos)
      : resultado.datos;
    if (Object.keys(cambios).length === 0) {
      setEdicion(null);
      return;
    }
    setGuardando(true);
    const ok = await onGuardar(cambios);
    setGuardando(false);
    if (ok) setEdicion(null);
  };

  if (edicion) {
    return (
      <View>
        <CamposEmpresa
          valores={edicion}
          onCambiar={(c) => setEdicion((v) => (v ? { ...v, ...c } : v))}
        />
        <Text style={[styles.nota, { color: colors.textSecondary }]}>
          Cambiar el correo aquí cambia el correo de contacto del negocio, no el
          correo con el que inicias sesión.
        </Text>
        <Boton
          titulo={guardando ? "GUARDANDO…" : "GUARDAR CAMBIOS"}
          onPress={guardar}
        />
        <Boton
          titulo="CANCELAR"
          variante="neutro"
          onPress={() => setEdicion(null)}
        />
      </View>
    );
  }

  const filas: [string, string][] = [
    ["Nombre", perfil.nombre],
    ["Categoría", perfil.categoria],
    ["NIT", perfil.nit ?? "—"],
    ["Administra", perfil.nombreAdministradora],
    ["Empleados", String(perfil.numeroEmpleados)],
    ["Teléfono", perfil.telefono],
    ["Correo", perfil.correo],
    ["Dirección", perfil.direccion],
    ["Ciudad", perfil.ciudad],
    ["Días", textoDiasAtencion(perfil.diasAtencion)],
    ["Horario", `${perfil.horarioApertura} a ${perfil.horarioCierre}`],
    ["Logo (web)", perfil.logoUrl ?? "—"],
  ];

  return (
    <View>
      <TituloSeccion>DATOS DEL NEGOCIO</TituloSeccion>
      <View
        style={[
          styles.tarjeta,
          { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
        ]}
      >
        {filas.map(([etiqueta, valor]) => (
          <View key={etiqueta} style={styles.fila}>
            <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>
              {etiqueta}
            </Text>
            <Text style={[styles.valor, { color: colors.textPrimary }]}>
              {valor}
            </Text>
          </View>
        ))}
      </View>
      <Boton
        titulo="EDITAR DATOS"
        onPress={() => setEdicion(valoresDesdePerfil(perfil))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 6 },
  fila: { flexDirection: "row", paddingVertical: 5, gap: 10 },
  etiqueta: { width: 90, fontSize: 12 },
  valor: { flex: 1, fontSize: 13, fontWeight: "600" },
  nota: { fontSize: 12, marginBottom: 8 },
});
