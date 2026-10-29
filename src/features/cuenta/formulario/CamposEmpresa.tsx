import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import Boton from "@/components/ui/Boton";
import CampoTelefono from "@/components/ui/CampoTelefono";
import CampoTexto, { PropsCampo } from "@/components/ui/CampoTexto";
import Desplegable from "@/components/ui/Desplegable";
import Tocable from "@/components/ui/Tocable";
import TituloSeccion from "@/components/ui/TituloSeccion";
import type { EstadoTelefono } from "@/hooks/useTelefono";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { horario24AMinutos, minutosAHora } from "@/utils/disponibilidad";
import { useCategorias } from "../../categorias/useCategorias";
import { EstadoCodigo, useCodigoDisponible } from "./useCodigoDisponible";
import { useUbicaciones } from "./useUbicaciones";
import {
  CampoEmpresa,
  copiarLunes,
  DiaFormulario,
  Errores,
  horarioUniforme,
  limpiarCodigo,
  unificarHorario,
  ValoresEmpresa,
} from "./validarEmpresa";

// 0 = domingo … 6 = sábado (como en el backend), mostrados de lunes a domingo
const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];
const DIAS_LARGOS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

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
  // WhatsApp de contacto (opcional): su estado lo lleva quien usa el formulario
  whatsapp: EstadoTelefono;
};

// Campos de la empresa: los usan el registro y la edición de "Mi negocio"
export default function CamposEmpresa({
  valores,
  onCambiar,
  codigoActual,
  errores = {},
  whatsapp,
}: Props) {
  const { colors } = useAppTheme();
  const { departamentos, error: errorUbicaciones, reintentar } = useUbicaciones();
  const estadoCodigo = useCodigoDisponible(valores.codigoAcceso, codigoActual);
  const { categorias, error: errorCategorias, reintentar: reintentarCategorias } = useCategorias();
  // La categoría actual siempre se ofrece, aunque ya no esté activa
  const opcionesCategoria = (categorias ?? []).map((c) => ({ valor: c.nombre, etiqueta: c.nombre }));
  if (valores.categoria && !opcionesCategoria.some((o) => o.valor === valores.categoria)) {
    opcionesCategoria.push({ valor: valores.categoria, etiqueta: valores.categoria });
  }

  const campo = (
    clave: "nombre" | "nombreAdministradora" | "direccion",
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

  // Por defecto un solo horario para todos los días. Si el negocio ya guardó horarios distintos,
  // arranca desmarcada para no esconderlos; al marcar o desmarcar manualmente manda la elección.
  const [eligioMismo, setEligioMismo] = useState<boolean | null>(null);
  const mismoHorario = eligioMismo ?? horarioUniforme(valores.dias);
  const diaBase = valores.dias.find((d) => d.abierto) ?? valores.dias[0];

  const cambiarMismoHorario = () => {
    const nuevo = !mismoHorario;
    setEligioMismo(nuevo);
    if (nuevo) onCambiar({ dias: unificarHorario(valores.dias) });
  };

  const cambiarHorarioComun = (c: { apertura?: string; cierre?: string }) =>
    onCambiar({ dias: valores.dias.map((d) => ({ ...d, ...c })) });

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
      {errorCategorias ? (
        <View>
          <Text style={[styles.ayuda, { color: colors.error }]}>{errorCategorias}</Text>
          <Boton
            titulo="REINTENTAR"
            ayuda="Vuelve a cargar las categorías"
            variante="secundario"
            onPress={reintentarCategorias}
          />
        </View>
      ) : !categorias ? (
        <ActivityIndicator color={colors.primaryText} style={styles.cargando} />
      ) : (
        <Desplegable
          etiqueta="Categoría"
          obligatorio
          error={errores.categoria}
          ayuda="Elige qué tipo de negocio es"
          placeholder="Elige la categoría"
          buscable
          opciones={opcionesCategoria}
          valor={valores.categoria || null}
          onCambiar={(nombre) => onCambiar({ categoria: nombre })}
        />
      )}
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
            variante="secundario"
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

      <TituloSeccion>CONTACTO</TituloSeccion>
      <CampoTelefono
        telefono={whatsapp}
        etiqueta="WhatsApp de contacto del negocio"
        ayuda="Opcional. Tus clientes lo ven cuando ya no pueden cancelar o reprogramar solos. Para otro país, toca la bandera."
      />

      <TituloSeccion>HORARIO DE ATENCIÓN</TituloSeccion>
      {errores.horario ? (
        <Text accessibilityLiveRegion="polite" style={[styles.ayuda, { color: colors.error }]}>
          {errores.horario}
        </Text>
      ) : null}
      <Tocable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: mismoHorario }}
        accessibilityLabel="Mismo horario todos los días"
        accessibilityHint="Marcada, usas un solo horario de apertura y cierre. Desmarcada, eliges el horario de cada día"
        onPress={cambiarMismoHorario}
        style={styles.casilla}
      >
        <Ionicons
          name={mismoHorario ? "checkbox" : "square-outline"}
          size={26}
          color={colors.primaryText}
        />
        <Text style={[styles.textoCasilla, { color: colors.textPrimary }]}>
          Mismo horario todos los días
        </Text>
      </Tocable>
      {mismoHorario && diaBase ? (
        <View>
          {horas(diaBase.apertura, diaBase.cierre, cambiarHorarioComun)}
          <Text style={[styles.etiquetaDias, { color: colors.textPrimary }]}>Días que abre</Text>
          <View style={styles.diasElegibles}>
            {ORDEN_DIAS.map((dia) => {
              const abierto = valores.dias.find((x) => x.dia === dia)?.abierto ?? false;
              return (
                <Tocable
                  key={dia}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: abierto }}
                  accessibilityLabel={DIAS_LARGOS[dia]}
                  accessibilityHint={abierto ? "Marcado: el negocio abre este día" : "Sin marcar: el negocio cierra este día"}
                  onPress={() => cambiarDia(dia, { abierto: !abierto })}
                  style={[
                    styles.diaElegible,
                    abierto
                      ? { backgroundColor: colors.seleccionBg, borderColor: colors.primary }
                      : { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                  ]}
                >
                  <Text
                    style={[
                      styles.textoDiaElegible,
                      { color: abierto ? colors.seleccionTexto : colors.textPrimary },
                    ]}
                  >
                    {DIAS_CORTOS[dia]}
                  </Text>
                </Tocable>
              );
            })}
          </View>
        </View>
      ) : (
        <>
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
                  variante="secundario"
                  onPress={copiarHorarioDelLunes}
                  style={styles.copiar}
                />
              ) : null}
            </View>
          );
        })}
        </>
      )}
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
  casilla: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 48, marginBottom: 6 },
  textoCasilla: { flex: 1, fontSize: 14, fontWeight: "bold" },
  etiquetaDias: { fontSize: 14, fontWeight: "bold", marginBottom: 6 },
  diasElegibles: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  diaElegible: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  textoDiaElegible: { fontSize: 13, fontWeight: "bold" },
});
