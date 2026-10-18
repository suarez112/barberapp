import { StyleSheet, Text, TextInputProps, View } from "react-native";
import CampoTexto from "@/components/ui/CampoTexto";
import Tocable from "@/components/ui/Tocable";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { ValoresEmpresa } from "./validarEmpresa";

// 0 = domingo … 6 = sábado (como en el backend), mostrados de lunes a domingo
const DIAS = [
  { valor: 1, label: "Lun" },
  { valor: 2, label: "Mar" },
  { valor: 3, label: "Mié" },
  { valor: 4, label: "Jue" },
  { valor: 5, label: "Vie" },
  { valor: 6, label: "Sáb" },
  { valor: 0, label: "Dom" },
];

type Props = {
  valores: ValoresEmpresa;
  onCambiar: (cambios: Partial<ValoresEmpresa>) => void;
};

// Campos de la empresa: los usan el registro y la edición de "Mi negocio"
export default function CamposEmpresa({ valores, onCambiar }: Props) {
  const { colors } = useAppTheme();

  const campo = (
    clave: Exclude<keyof ValoresEmpresa, "diasAtencion">,
    etiqueta: string,
    props: TextInputProps = {},
  ) => (
    <View>
      <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>
        {etiqueta}
      </Text>
      <CampoTexto
        accessibilityLabel={etiqueta}
        value={valores[clave]}
        onChangeText={(texto) => onCambiar({ [clave]: texto })}
        {...props}
      />
    </View>
  );

  const alternarDia = (dia: number) =>
    onCambiar({
      diasAtencion: valores.diasAtencion.includes(dia)
        ? valores.diasAtencion.filter((d) => d !== dia)
        : [...valores.diasAtencion, dia],
    });

  return (
    <View>
      <TituloSeccion>DATOS DEL NEGOCIO</TituloSeccion>
      {campo("nombre", "Nombre del negocio *", { maxLength: 100 })}
      {campo("categoria", "Categoría * (ej. Barbería, Salón de belleza)", {
        maxLength: 60,
      })}
      {campo("nit", "NIT (opcional)", { keyboardType: "numbers-and-punctuation", maxLength: 20 })}
      {campo("nombreAdministradora", "Nombre de quien administra *", {
        maxLength: 120,
      })}
      {campo("numeroEmpleados", "Número de empleados *", {
        keyboardType: "number-pad",
        maxLength: 5,
      })}

      <TituloSeccion>CONTACTO Y UBICACIÓN</TituloSeccion>
      {campo("telefono", "Teléfono *", { keyboardType: "phone-pad", maxLength: 20 })}
      {campo("correo", "Correo *", {
        keyboardType: "email-address",
        autoCapitalize: "none",
        autoComplete: "email",
        maxLength: 254,
      })}
      {campo("direccion", "Dirección *", { maxLength: 200 })}
      {campo("ciudad", "Ciudad *", { maxLength: 100 })}

      <TituloSeccion>HORARIO DE ATENCIÓN</TituloSeccion>
      <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>
        Días de atención *
      </Text>
      <View style={styles.dias}>
        {DIAS.map((d) => {
          const activo = valores.diasAtencion.includes(d.valor);
          return (
            <Tocable
              key={d.valor}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: activo }}
              accessibilityLabel={d.label}
              onPress={() => alternarDia(d.valor)}
              style={[
                styles.dia,
                { borderColor: colors.cardBorder, backgroundColor: colors.cardBg },
                activo && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.textoDia,
                  { color: activo ? COLORES.textoSobrePrimario : colors.textSecondary },
                ]}
              >
                {d.label}
              </Text>
            </Tocable>
          );
        })}
      </View>
      <View style={styles.fila}>
        <View style={styles.columna}>
          {campo("horarioApertura", "Abre (HH:MM) *", {
            keyboardType: "numbers-and-punctuation",
            placeholder: "08:00",
            maxLength: 5,
          })}
        </View>
        <View style={styles.columna}>
          {campo("horarioCierre", "Cierra (HH:MM) *", {
            keyboardType: "numbers-and-punctuation",
            placeholder: "19:00",
            maxLength: 5,
          })}
        </View>
      </View>

      {campo("logoUrl", "Dirección web del logo (opcional)", {
        keyboardType: "url",
        autoCapitalize: "none",
        placeholder: "https://…",
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  etiqueta: { fontSize: 12, marginBottom: 4 },
  dias: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  dia: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  textoDia: { fontSize: 12, fontWeight: "bold" },
  fila: { flexDirection: "row", gap: 10 },
  columna: { flex: 1 },
});
