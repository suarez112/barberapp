import { Ionicons } from "@expo/vector-icons";
import {
  AccessibilityInfo,
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import Boton from "@/components/ui/Boton";
import CampoTexto, { PropsCampo } from "@/components/ui/CampoTexto";
import Desplegable from "@/components/ui/Desplegable";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { horario24AMinutos, minutosAHora } from "@/utils/disponibilidad";
import { EstadoCodigo, useCodigoDisponible } from "./useCodigoDisponible";
import { useUbicaciones } from "./useUbicaciones";
import {
  CampoEmpresa,
  copiarLunes,
  DiaFormulario,
  Errores,
  limpiarCodigo,
  ValoresEmpresa,
} from "./validarEmpresa";

// 0 = domingo … 6 = sábado (como en el backend), mostrados de lunes a domingo
const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];
const DIAS_LARGOS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const EMPLEADOS = Array.from({ length: 10 }, (_, i) => ({
  valor: i + 1,
  etiqueta: i === 0 ? "1 empleado" : `${i + 1} empleados`,
}));

const a24 = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

// Horas cada 30 minutos de 5:00 AM a 11:30 PM (más la guardada, si es otra)
const HORAS = Array.from({ length: 38 }, (_, i) => a24(5 * 60 + i * 30));
const opcionesHora = (actual: string) =>
  [...new Set([...HORAS, actual])]
    .sort()
    .map((h) => ({ valor: h, etiqueta: minutosAHora(horario24AMinutos(h)) }));

const TEXTO_CODIGO: Record<EstadoCodigo, string> = {
  vacio: "Letras y números, sin espacios, máximo 10.",
  actual: "Es el código actual de tu negocio.",
  verificando: "Verificando…",
  disponible: "Disponible",
  "en-uso": "Ya está en uso",
  "sin-verificar": "No se pudo verificar ahora; se revisará al guardar.",
};

type Props = {
  valores: ValoresEmpresa;
  onCambiar: (cambios: Partial<ValoresEmpresa>) => void;
  // En "Mi negocio": el código que ya tiene el negocio
  codigoActual?: string;
  // Qué corregir en cada campo (se muestra debajo)
  errores?: Errores<CampoEmpresa>;
};

// Campos de la empresa: los usan el registro y la edición de "Mi negocio"
export default function CamposEmpresa({ valores, onCambiar, codigoActual, errores = {} }: Props) {
  const { colors } = useAppTheme();
  const { departamentos, error: errorUbicaciones, reintentar } = useUbicaciones();
  const estadoCodigo = useCodigoDisponible(valores.codigoAcceso, codigoActual);

  const campo = (
    clave: "nombre" | "categoria" | "nombreAdministradora" | "direccion",
    texto: string,
    props: Omit<PropsCampo, "etiqueta">,
  ) => (
    <CampoTexto
      etiqueta={texto}
      obligatorio
      error={errores[clave]}
      value={valores[clave]}
      onChangeText={(t) => onCambiar({ [clave]: t })}
      {...props}
    />
  );

  const departamento = departamentos?.find((d) => d.nombre === valores.departamento);
  const colorCodigo =
    estadoCodigo === "disponible"
      ? colors.exitoTexto
      : estadoCodigo === "en-uso"
        ? colors.peligroTexto
        : colors.textSecondary;

  const cambiarDia = (dia: number, cambios: Partial<DiaFormulario>) =>
    onCambiar({ dias: valores.dias.map((d) => (d.dia === dia ? { ...d, ...cambios } : d)) });

  const copiarHorarioDelLunes = () => {
    onCambiar({ dias: copiarLunes(valores.dias) });
    AccessibilityInfo.announceForAccessibility("Se copió el horario del lunes a todos los días");
  };

  const horas = (
    apertura: string,
    cierre: string,
    onCambio: (c: { apertura?: string; cierre?: string }) => void,
    nombre = "",
  ) => (
    <View style={styles.fila}>
      <Desplegable
        etiqueta="Abre"
        titulo={`Hora de apertura${nombre}`}
        ayuda={`Elige la hora de apertura${nombre}`}
        placeholder="Abre"
        opciones={opcionesHora(apertura)}
        valor={apertura}
        onCambiar={(h) => onCambio({ apertura: h })}
        style={styles.columna}
      />
      <Desplegable
        etiqueta="Cierra"
        titulo={`Hora de cierre${nombre}`}
        ayuda={`Elige la hora de cierre${nombre}`}
        placeholder="Cierra"
        opciones={opcionesHora(cierre)}
        valor={cierre}
        onCambiar={(h) => onCambio({ cierre: h })}
        style={styles.columna}
      />
    </View>
  );

  return (
    <View>
      <TituloSeccion>DATOS DEL NEGOCIO</TituloSeccion>
      {campo("nombre", "Nombre del negocio", {
        maxLength: 100,
        placeholder: "ej: Barbería Central",
        ayuda: "Así verán tu negocio los clientes",
        autoCapitalize: "words",
        autoComplete: "organization",
        textContentType: "organizationName",
      })}
      {campo("categoria", "Categoría", {
        maxLength: 60,
        placeholder: "ej: Barbería o Salón de belleza",
        ayuda: "Qué tipo de negocio es",
        autoCapitalize: "sentences",
      })}
      {campo("nombreAdministradora", "Nombre de quien administra", {
        maxLength: 120,
        placeholder: "ej: Ana Pérez",
        ayuda: "Nombre de la persona a cargo del negocio",
        autoCapitalize: "words",
        autoComplete: "name",
        textContentType: "name",
      })}
      <Desplegable
        etiqueta="Número de empleados"
        obligatorio
        error={errores.numeroEmpleados}
        ayuda="Elige cuántas personas trabajan en el negocio"
        placeholder="Elige el número de empleados"
        opciones={EMPLEADOS}
        valor={valores.numeroEmpleados}
        onCambiar={(n) => onCambiar({ numeroEmpleados: n })}
      />

      <TituloSeccion>CÓDIGO DEL NEGOCIO</TituloSeccion>
      <Text style={[styles.ayuda, { color: colors.textSecondary }]}>
        Tus clientes lo escriben en &quot;Soy cliente&quot; para ver tu negocio y reservar.
      </Text>
      <CampoTexto
        etiqueta="Código del negocio"
        obligatorio
        error={errores.codigoAcceso}
        ayuda="Letras y números, sin espacios, máximo 10. Debajo se indica si está disponible"
        placeholder="ej: CENTRAL10"
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        maxLength={10}
        value={valores.codigoAcceso}
        onChangeText={(t) => onCambiar({ codigoAcceso: limpiarCodigo(t) })}
        estiloTexto={styles.codigo}
        style={styles.campoCodigo}
        centrado
      />
      <View style={styles.estadoCodigo}>
        {estadoCodigo === "verificando" ? (
          <ActivityIndicator size="small" color={colors.textSecondary} />
        ) : estadoCodigo === "disponible" || estadoCodigo === "en-uso" ? (
          <Ionicons
            name={estadoCodigo === "disponible" ? "checkmark-circle" : "close-circle"}
            size={16}
            color={colorCodigo}
          />
        ) : null}
        <Text
          accessibilityLiveRegion="polite"
          style={[
            styles.textoCodigo,
            { color: colorCodigo },
            (estadoCodigo === "disponible" || estadoCodigo === "en-uso") && styles.negrita,
          ]}
        >
          {TEXTO_CODIGO[estadoCodigo]}
        </Text>
      </View>

      <TituloSeccion>UBICACIÓN</TituloSeccion>
      {errorUbicaciones ? (
        <View>
          <Text style={[styles.ayuda, { color: colors.error }]}>{errorUbicaciones}</Text>
          <Boton
            titulo="REINTENTAR"
            ayuda="Vuelve a cargar los departamentos y municipios"
            variante="neutro"
            onPress={reintentar}
          />
        </View>
      ) : !departamentos ? (
        <ActivityIndicator color={colors.primaryText} style={styles.cargando} />
      ) : (
        <>
          <Desplegable
            etiqueta="Departamento"
            obligatorio
            error={errores.departamento}
            ayuda="Abre la lista de departamentos de Colombia"
            placeholder="Elige el departamento"
            buscable
            opciones={departamentos.map((d) => ({ valor: d.nombre, etiqueta: d.nombre }))}
            valor={valores.departamento}
            onCambiar={(nombre) =>
              // Otro departamento: el municipio elegido ya no aplica
              nombre !== valores.departamento &&
              onCambiar({ departamento: nombre, ciudad: null })
            }
          />
          <Desplegable
            etiqueta="Municipio"
            obligatorio
            error={errores.ciudad}
            ayuda={departamento ? "Abre la lista de municipios" : "Primero elige el departamento"}
            placeholder={departamento ? "Elige el municipio" : "Primero elige el departamento"}
            buscable
            deshabilitado={!departamento}
            opciones={(departamento?.municipios ?? []).map((m) => ({
              valor: m.nombre,
              etiqueta: m.nombre,
            }))}
            valor={valores.ciudad}
            onCambiar={(nombre) => onCambiar({ ciudad: nombre })}
          />
        </>
      )}
      {campo("direccion", "Dirección", {
        maxLength: 200,
        placeholder: "ej: Calle 10 # 20-30",
        ayuda: "Dirección del local, sin el municipio",
        autoComplete: "street-address",
        textContentType: "fullStreetAddress",
      })}

      <TituloSeccion>HORARIO DE ATENCIÓN</TituloSeccion>
      {errores.horario ? (
        <Text accessibilityLiveRegion="polite" style={[styles.ayuda, { color: colors.error }]}>
          {errores.horario}
        </Text>
      ) : null}
      {ORDEN_DIAS.map((dia) => {
        const d = valores.dias.find((x) => x.dia === dia);
        if (!d) return null;
        return (
          <View key={dia}>
            <View
              style={[
                styles.tarjetaDia,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.cabeceraDia}>
                <Text style={[styles.nombreDia, { color: colors.textPrimary }]}>
                  {DIAS_LARGOS[dia]}
                </Text>
                <Text style={[styles.estadoDia, { color: colors.textSecondary }]}>
                  {d.abierto ? "Abierto" : "Cerrado"}
                </Text>
                <Switch
                  accessibilityLabel={`${DIAS_LARGOS[dia]}: ${d.abierto ? "abierto" : "cerrado"}`}
                  accessibilityHint="Abre o cierra el negocio este día"
                  value={d.abierto}
                  onValueChange={(abierto) => cambiarDia(dia, { abierto })}
                  trackColor={{ true: colors.primary, false: colors.cardBorder }}
                  thumbColor={COLORES.blanco}
                />
              </View>
              {d.abierto
                ? horas(
                    d.apertura,
                    d.cierre,
                    (c) => cambiarDia(dia, c),
                    ` del ${DIAS_LARGOS[dia].toLowerCase()}`,
                  )
                : null}
            </View>
            {dia === 1 ? (
              <Boton
                titulo="Copiar el horario del lunes a todos los días"
                ayuda="Pone en los siete días el mismo horario del lunes, abierto o cerrado"
                variante="neutro"
                onPress={copiarHorarioDelLunes}
                style={styles.copiar}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  ayuda: { fontSize: 12, marginBottom: 8 },
  cargando: { marginVertical: 12 },
  codigo: { fontSize: 18, fontWeight: "bold", letterSpacing: 3 },
  campoCodigo: { marginBottom: 4 },
  estadoCodigo: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 22, marginBottom: 6 },
  textoCodigo: { fontSize: 12 },
  negrita: { fontWeight: "bold", fontSize: 13 },
  fila: { flexDirection: "row", gap: 8 },
  // minWidth 0: en pantallas angostas las dos horas se reparten el ancho
  columna: { flex: 1, minWidth: 0, marginBottom: 8 },
  tarjetaDia: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, marginBottom: 8 },
  cabeceraDia: { flexDirection: "row", alignItems: "center", minHeight: 48, gap: 8 },
  nombreDia: { flex: 1, fontSize: 14, fontWeight: "bold" },
  estadoDia: { fontSize: 12 },
  copiar: { marginBottom: 12 },
});
