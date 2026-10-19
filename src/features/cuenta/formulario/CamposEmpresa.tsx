import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Switch, Text, TextInputProps, View } from "react-native";
import Boton from "@/components/ui/Boton";
import CampoTexto from "@/components/ui/CampoTexto";
import Desplegable from "@/components/ui/Desplegable";
import Tocable from "@/components/ui/Tocable";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { horario24AMinutos, minutosAHora } from "@/utils/disponibilidad";
import { EstadoCodigo, useCodigoDisponible } from "./useCodigoDisponible";
import { useUbicaciones } from "./useUbicaciones";
import { DiaFormulario, limpiarCodigo, ValoresEmpresa } from "./validarEmpresa";

// 0 = domingo … 6 = sábado (como en el backend), mostrados de lunes a domingo
const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];
const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
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
};

// Campos de la empresa: los usan el registro y la edición de "Mi negocio"
export default function CamposEmpresa({ valores, onCambiar, codigoActual }: Props) {
  const { colors } = useAppTheme();
  const { departamentos, error: errorUbicaciones, reintentar } = useUbicaciones();
  const estadoCodigo = useCodigoDisponible(valores.codigoAcceso, codigoActual);

  const etiqueta = (texto: string) => (
    <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>{texto}</Text>
  );

  const campo = (
    clave: "nombre" | "categoria" | "nombreAdministradora" | "direccion",
    texto: string,
    props: TextInputProps = {},
  ) => (
    <View>
      {etiqueta(texto)}
      <CampoTexto
        accessibilityLabel={texto}
        value={valores[clave]}
        onChangeText={(t) => onCambiar({ [clave]: t })}
        {...props}
      />
    </View>
  );

  const departamento = departamentos?.find((d) => d.nombre === valores.departamento);
  const colorCodigo =
    estadoCodigo === "disponible"
      ? COLORES.exitoClaro
      : estadoCodigo === "en-uso"
        ? COLORES.peligro
        : colors.textSecondary;

  const cambiarDia = (dia: number, cambios: Partial<DiaFormulario>) =>
    onCambiar({ dias: valores.dias.map((d) => (d.dia === dia ? { ...d, ...cambios } : d)) });

  const alternarDiaAbierto = (dia: number) =>
    onCambiar({
      diasAbiertos: valores.diasAbiertos.includes(dia)
        ? valores.diasAbiertos.filter((d) => d !== dia)
        : [...valores.diasAbiertos, dia],
    });

  // Al cambiar de modo se conserva lo elegido en el otro
  const alternarMismoHorario = () => {
    if (valores.mismoHorario) {
      onCambiar({
        mismoHorario: false,
        dias: valores.dias.map((d) => ({
          ...d,
          abierto: valores.diasAbiertos.includes(d.dia),
          apertura: valores.apertura,
          cierre: valores.cierre,
        })),
      });
      return;
    }
    const primero = valores.dias.find((d) => d.abierto);
    onCambiar({
      mismoHorario: true,
      diasAbiertos: valores.dias.filter((d) => d.abierto).map((d) => d.dia),
      apertura: primero?.apertura ?? valores.apertura,
      cierre: primero?.cierre ?? valores.cierre,
    });
  };

  const horas = (
    apertura: string,
    cierre: string,
    onCambio: (c: { apertura?: string; cierre?: string }) => void,
    nombre = "",
  ) => (
    <View style={styles.fila}>
      <View style={styles.columna}>
        {etiqueta("Abre")}
        <Desplegable
          titulo={`Hora de apertura${nombre}`}
          placeholder="Abre"
          opciones={opcionesHora(apertura)}
          valor={apertura}
          onCambiar={(h) => onCambio({ apertura: h })}
        />
      </View>
      <View style={styles.columna}>
        {etiqueta("Cierra")}
        <Desplegable
          titulo={`Hora de cierre${nombre}`}
          placeholder="Cierra"
          opciones={opcionesHora(cierre)}
          valor={cierre}
          onCambiar={(h) => onCambio({ cierre: h })}
        />
      </View>
    </View>
  );

  return (
    <View>
      <TituloSeccion>DATOS DEL NEGOCIO</TituloSeccion>
      {campo("nombre", "Nombre del negocio *", { maxLength: 100 })}
      {campo("categoria", "Categoría * (ej. Barbería, Salón de belleza)", { maxLength: 60 })}
      {campo("nombreAdministradora", "Nombre de quien administra *", { maxLength: 120 })}
      {etiqueta("Número de empleados *")}
      <Desplegable
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
        accessibilityLabel="Código del negocio"
        placeholder="Ej: CENTRAL10"
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={10}
        value={valores.codigoAcceso}
        onChangeText={(t) => onCambiar({ codigoAcceso: limpiarCodigo(t) })}
        style={styles.codigo}
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
          <Text style={[styles.ayuda, { color: COLORES.peligro }]}>{errorUbicaciones}</Text>
          <Boton titulo="REINTENTAR" variante="neutro" onPress={reintentar} />
        </View>
      ) : !departamentos ? (
        <ActivityIndicator color={colors.primary} style={styles.cargando} />
      ) : (
        <>
          {etiqueta("Departamento *")}
          <Desplegable
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
          {etiqueta("Municipio *")}
          <Desplegable
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
      {campo("direccion", "Dirección *", { maxLength: 200, placeholder: "Ej: Calle 10 # 20-30" })}

      <TituloSeccion>HORARIO DE ATENCIÓN</TituloSeccion>
      <Tocable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: valores.mismoHorario }}
        onPress={alternarMismoHorario}
        style={styles.casilla}
      >
        <Ionicons
          name={valores.mismoHorario ? "checkbox" : "square-outline"}
          size={22}
          color={colors.primary}
        />
        <Text style={[styles.textoCasilla, { color: colors.textPrimary }]}>
          Mismo horario todos los días
        </Text>
      </Tocable>

      {valores.mismoHorario ? (
        <>
          {etiqueta("Días que abre *")}
          <View style={styles.dias}>
            {ORDEN_DIAS.map((dia) => {
              const activo = valores.diasAbiertos.includes(dia);
              return (
                <Tocable
                  key={dia}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: activo }}
                  accessibilityLabel={DIAS_LARGOS[dia]}
                  onPress={() => alternarDiaAbierto(dia)}
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
                    {DIAS_CORTOS[dia]}
                  </Text>
                </Tocable>
              );
            })}
          </View>
          {horas(valores.apertura, valores.cierre, (c) => onCambiar(c))}
        </>
      ) : (
        ORDEN_DIAS.map((dia) => {
          const d = valores.dias.find((x) => x.dia === dia);
          if (!d) return null;
          return (
            <View
              key={dia}
              style={[styles.tarjetaDia, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
            >
              <View style={styles.cabeceraDia}>
                <Text style={[styles.nombreDia, { color: colors.textPrimary }]}>
                  {DIAS_LARGOS[dia]}
                </Text>
                <Text style={[styles.estadoDia, { color: colors.textSecondary }]}>
                  {d.abierto ? "Abierto" : "Cerrado"}
                </Text>
                <Switch
                  accessibilityLabel={`${DIAS_LARGOS[dia]} abierto`}
                  value={d.abierto}
                  onValueChange={(abierto) => cambiarDia(dia, { abierto })}
                  trackColor={{ true: colors.primary, false: colors.cardBorder }}
                  thumbColor={COLORES.blanco}
                />
              </View>
              {d.abierto
                ? horas(d.apertura, d.cierre, (c) => cambiarDia(dia, c), ` del ${DIAS_LARGOS[dia].toLowerCase()}`)
                : null}
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  etiqueta: { fontSize: 12, marginBottom: 4 },
  ayuda: { fontSize: 12, marginBottom: 8 },
  cargando: { marginVertical: 12 },
  codigo: { fontSize: 18, fontWeight: "bold", letterSpacing: 3, marginBottom: 4 },
  estadoCodigo: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 22, marginBottom: 6 },
  textoCodigo: { fontSize: 12 },
  negrita: { fontWeight: "bold", fontSize: 13 },
  casilla: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6, marginBottom: 10 },
  textoCasilla: { fontSize: 14, fontWeight: "600" },
  dias: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  dia: { borderWidth: 1, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  textoDia: { fontSize: 12, fontWeight: "bold" },
  fila: { flexDirection: "row", gap: 10 },
  columna: { flex: 1 },
  tarjetaDia: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingTop: 6, marginBottom: 8 },
  cabeceraDia: { flexDirection: "row", alignItems: "center", paddingBottom: 6, gap: 8 },
  nombreDia: { flex: 1, fontSize: 14, fontWeight: "bold" },
  estadoDia: { fontSize: 12 },
});
