import { ReactNode } from "react";
import { View } from "react-native";
import { COLORES_LANDING as C } from "@/theme/paleta";
import { T, columnasIguales, cuadricula, Icono, useAnchos } from "./componentes";

// Dibujos de ejemplo de la página principal. Son solo ilustrativos: sus números están
// escritos aquí y no se piden al servidor.

const EJEMPLO = "Ejemplo ilustrativo";

function Barras({ alturas, activa, alto }: { alturas: number[]; activa: number; alto: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, height: alto, marginTop: 4 }}>
      {alturas.map((h, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: `${h}%`,
            backgroundColor: i === activa ? C.amarillo : C.borde,
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
          }}
        />
      ))}
    </View>
  );
}

function Avatar({ letra }: { letra: string }) {
  return (
    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.oscuro, alignItems: "center", justifyContent: "center" }}>
      <T style={{ color: C.amarillo, fontSize: 10, fontWeight: "800" }}>{letra}</T>
    </View>
  );
}

function Pastilla({ texto, tipo, grande }: { texto: string; tipo: "ok" | "pendiente"; grande?: boolean }) {
  return (
    <View
      style={{
        backgroundColor: tipo === "ok" ? C.verdeFondo : C.azulFondo,
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 999,
      }}
    >
      <T style={{ color: tipo === "ok" ? C.verdeOscuro : C.azul, fontSize: grande ? 12 : 10, fontWeight: "700" }}>{texto}</T>
    </View>
  );
}

function Tarjeta({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[{ backgroundColor: C.blanco, borderRadius: 14, padding: 16 }, style]}>{children}</View>;
}

function Etiq({ children }: { children: string }) {
  return <T style={{ fontSize: 12, color: C.gris, fontWeight: "600" }}>{children}</T>;
}

function Linea({ children, primera }: { children: ReactNode; primera?: boolean }) {
  const { movil } = useAnchos();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 9,
        gap: movil ? 8 : 0,
        borderTopWidth: primera ? 0 : 1,
        borderTopColor: C.fondoGris,
      }}
    >
      {children}
    </View>
  );
}

function Marco({ children }: { children: ReactNode }) {
  const { movil } = useAnchos();
  return (
    <View
      accessible
      accessibilityLabel={`${EJEMPLO}`}
      style={{ backgroundColor: C.oscuro, borderRadius: movil ? 18 : 22, padding: movil ? 16 : 26 }}
    >
      <T style={{ color: C.grisClaro, fontSize: 12, marginBottom: 12 }}>{EJEMPLO}</T>
      {children}
    </View>
  );
}

// ---- Panel de la portada ----
export function PanelEjemplo() {
  const { movil, tablet } = useAnchos();
  const kpi = (titulo: string, valor: string, amarillo?: boolean) => (
    <View
      style={{
        backgroundColor: amarillo ? C.amarilloClaro : C.blanco,
        borderColor: amarillo ? C.amarilloOscuro : C.borde,
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
      }}
    >
      <T style={{ color: C.gris, fontSize: 11, fontWeight: "600", marginBottom: 4 }}>{titulo}</T>
      <T style={{ fontSize: 18, fontWeight: "700" }}>{valor}</T>
    </View>
  );
  const cita = (hora: string, servicio: string, con: string, tipo: "ok" | "pendiente", texto: string, primera?: boolean) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 8,
        borderTopWidth: primera ? 0 : 1,
        borderTopColor: C.fondoGris,
      }}
    >
      <T style={{ fontWeight: "700", fontSize: 12, width: 40 }}>{hora}</T>
      <View style={{ flex: 1 }}>
        <T style={{ fontSize: 12 }}>{servicio}</T>
        <T style={{ fontSize: 12, color: C.gris }}>{con}</T>
      </View>
      <Pastilla texto={texto} tipo={tipo} />
    </View>
  );
  return (
    <View
      accessible
      accessibilityLabel="Ejemplo ilustrativo del panel de un negocio"
      style={{
        backgroundColor: C.fondoGris,
        borderRadius: 20,
        padding: 18,
        boxShadow: "0 30px 60px rgba(0,0,0,0.35)",
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <T style={{ fontSize: 16, fontWeight: "700" }}>Resumen de hoy</T>
        <T style={{ color: C.gris, fontSize: 12 }}>{EJEMPLO}</T>
      </View>
      <View style={[movil ? columnasIguales(2, 10) : columnasIguales(3, 10), { marginBottom: 12 }]}>
        {kpi("Citas de hoy", "14")}
        {kpi("Ingresos del día", "$480.000", true)}
        {kpi("Profesionales", "4")}
      </View>
      <View style={movil ? columnasIguales(1, 10) : cuadricula("minmax(0, 1.2fr) minmax(0, 0.8fr)", 10)}>
        <View style={panel}>
          <T style={tituloPanel}>Próximas citas</T>
          {cita("9:00", "Servicio A", "Con Andrés", "ok", "Confirmada", true)}
          {cita("10:00", "Servicio B", "Con Laura", "ok", "Confirmada")}
          {cita("11:30", "Servicio C", "Con Camilo", "pendiente", "Pendiente")}
        </View>
        <View style={panel}>
          <T style={tituloPanel}>Ingresos de la semana</T>
          <Barras alturas={[40, 55, 48, 70, 92, 80]} activa={4} alto={92} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 }}>
            <Avatar letra="A" />
            <Avatar letra="L" />
            <Avatar letra="C" />
            <Avatar letra="M" />
            <T style={{ color: C.gris, fontSize: 12 }}>Tu equipo</T>
          </View>
        </View>
      </View>
      {!movil && (
        <View
          style={{
            position: "absolute",
            left: tablet ? 12 : -28,
            bottom: -22,
            backgroundColor: C.oscuro,
            borderColor: C.bordeOscuro,
            borderWidth: 1,
            borderRadius: 14,
            paddingVertical: 12,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Icono nombre="campana" color={C.amarillo} tamano={22} />
          <T style={{ color: C.blanco, fontSize: 13 }}>
            Nueva reserva recibida <T style={{ color: C.amarillo, fontWeight: "700", fontSize: 13 }}>a las 10:42 p. m.</T>
          </T>
        </View>
      )}
    </View>
  );
}

const panel = { backgroundColor: C.blanco, borderColor: C.borde, borderWidth: 1, borderRadius: 12, padding: 12 } as const;
const tituloPanel = { fontSize: 12, color: C.textoSuave, marginBottom: 10, fontWeight: "700" } as const;

// ---- Dibujos de las funciones ----
function HoraChip({ texto, activa }: { texto: string; activa?: boolean }) {
  return (
    <View
      style={{
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: activa ? C.amarilloClaro : C.fondoGris,
        borderWidth: activa ? 2 : 0,
        borderColor: C.amarilloOscuro,
      }}
    >
      <T style={{ fontWeight: activa ? "700" : "600", fontSize: 14 }}>{texto}</T>
    </View>
  );
}

export function DibujoReservas() {
  return (
    <Marco>
      <Tarjeta>
        <Etiq>Elige una hora · Miércoles</Etiq>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          <HoraChip texto="9:00" />
          <HoraChip texto="10:00" activa />
          <HoraChip texto="11:30" />
          <HoraChip texto="2:00" />
          <HoraChip texto="3:30" />
        </View>
      </Tarjeta>
      <Tarjeta style={{ marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <Etiq>Cita confirmada</Etiq>
          <T style={{ fontWeight: "700" }}>Miércoles · 10:00 a. m.</T>
        </View>
        <Pastilla texto="Listo" tipo="ok" grande />
      </Tarjeta>
    </Marco>
  );
}

export function DibujoEquipo() {
  const fila = (letra: string, nombre: string, citas: string, valor: string, primera?: boolean) => (
    <Linea primera={primera}>
      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        <Avatar letra={letra} />
        <T style={{ fontSize: 14 }}>{nombre}</T>
      </View>
      <T style={{ color: C.gris, fontSize: 13 }}>{citas}</T>
      <T style={{ fontWeight: "700", fontSize: 14 }}>{valor}</T>
    </Linea>
  );
  return (
    <Marco>
      <Tarjeta>
        <View style={{ marginBottom: 6 }}>
          <Etiq>Tu equipo esta semana</Etiq>
        </View>
        {fila("A", "Andrés", "18 citas", "$540.000", true)}
        {fila("L", "Laura", "15 citas", "$610.000")}
        {fila("C", "Camilo", "12 citas", "$360.000")}
      </Tarjeta>
    </Marco>
  );
}

export function DibujoFinanzas() {
  return (
    <Marco>
      <Tarjeta>
        <Etiq>Ingresos del mes</Etiq>
        <T style={{ fontSize: 28, fontWeight: "800" }}>$8.250.000</T>
        <View style={{ marginTop: 12 }}>
          <Barras alturas={[35, 50, 45, 62, 58, 75, 95, 70]} activa={6} alto={80} />
        </View>
      </Tarjeta>
      <Tarjeta style={{ marginTop: 10 }}>
        <Linea primera>
          <T style={{ fontSize: 14 }}>Comisiones del equipo</T>
          <T style={{ fontWeight: "700", fontSize: 14 }}>$3.300.000</T>
        </Linea>
        <Linea>
          <T style={{ fontSize: 14 }}>Para el negocio</T>
          <T style={{ fontWeight: "700", fontSize: 14, color: C.verdeOscuro }}>$4.950.000</T>
        </Linea>
      </Tarjeta>
    </Marco>
  );
}

export function DibujoCrecimiento() {
  const fila = (servicio: string, veces: string, valor: string, verde?: boolean, primera?: boolean) => (
    <Linea primera={primera}>
      <T style={{ fontSize: 14 }}>{servicio}</T>
      <T style={{ color: C.gris, fontSize: 13 }}>{veces}</T>
      <T style={{ fontWeight: "700", fontSize: 14, color: verde ? C.verdeOscuro : C.texto }}>{valor}</T>
    </Linea>
  );
  return (
    <Marco>
      <Tarjeta>
        <View style={{ marginBottom: 6 }}>
          <Etiq>Servicios más rentables del mes</Etiq>
        </View>
        {fila("Servicio A", "42 veces", "$1.890.000", true, true)}
        {fila("Servicio B", "30 veces", "$1.200.000")}
        {fila("Servicio C", "25 veces", "$750.000")}
      </Tarjeta>
      <Tarjeta style={{ marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Etiq>Comparado con el mes anterior</Etiq>
          <T style={{ fontWeight: "700", fontSize: 20 }}>Ingresos en aumento</T>
        </View>
        <Icono nombre="tendencia" color={C.verdeOscuro} tamano={36} />
      </Tarjeta>
    </Marco>
  );
}
