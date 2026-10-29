import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { IdPlanEquipo } from "@/features/cuenta/api";
import { nivelPara, precioPara } from "@/features/planes/cobro";
import { usePlanes } from "@/features/planes/usePlanes";
import { COLORES_LANDING as C } from "@/theme/paleta";
import {
  BotonLanding,
  CajaIcono,
  EncabezadoSeccion,
  EnlaceTexto,
  Icono,
  NombreIcono,
  Seccion,
  T,
  columnasIguales,
  cuadricula,
  useAnchos,
} from "./componentes";

// Los precios NO se escriben aquí: vienen del backend (GET /api/v1/planes), el mismo lugar
// que usa la pantalla de planes de la app. Si cambian allá, cambian aquí.
const pesos = (n: number) => `$${Math.round(n).toLocaleString("es-CO")}`;

const NIVELES: { id: IdPlanEquipo; icono: NombreIcono; texto: string }[] = [
  { id: "emprendedor", icono: "persona", texto: "Agenda en línea, recordatorios, enlace y QR, cartera y reportes básicos." },
  { id: "equipo", icono: "equipo", texto: "Todo lo anterior, más agenda por profesional, permisos y comisiones." },
  {
    id: "pro",
    icono: "rayo",
    texto: "Todo lo anterior, más servicios más rentables, reportes avanzados y exportar a Excel y PDF.",
  },
];

export default function SeccionPlanes({ hrefRegistro }: { hrefRegistro: "/registro" }) {
  const { tablet, movil } = useAnchos();
  const { planes, error, reintentar } = usePlanes();
  const [profesionales, setProfesionales] = useState(3);

  return (
    <Seccion id="planes">
      <EncabezadoSeccion
        etiqueta="Precios claros"
        titulo="Pagas solo por los profesionales que usas"
        texto="Sin contratos ni costos ocultos. Prueba todo gratis durante 15 días, sin tarjeta."
      />
      {!planes ? (
        <View style={{ alignItems: "flex-start", gap: 8 }}>
          {error ? (
            <>
              <T style={{ color: C.textoSuave }}>{error}</T>
              <EnlaceTexto etiqueta="Reintentar" ayuda="Vuelve a cargar los precios" onPress={reintentar} style={{ fontWeight: "700" }} />
            </>
          ) : (
            <ActivityIndicator color={C.oscuro} accessibilityLabel="Cargando los precios" />
          )}
        </View>
      ) : (
        <View style={tablet ? columnasIguales(1, 24) : cuadricula("minmax(0, 1.1fr) minmax(0, 0.9fr)", 24)}>
          <TarjetaPrecio
            planes={planes}
            profesionales={profesionales}
            setProfesionales={setProfesionales}
            hrefRegistro={hrefRegistro}
            movil={movil}
          />
          <View style={{ gap: 14 }}>
            {NIVELES.map((n) => {
              const nivel = planes.niveles.find((x) => x.id === n.id);
              if (!nivel) return null;
              const activo = nivelPara(planes, profesionales).id === n.id;
              const rango =
                nivel.profesionalesDesde === nivel.profesionalesHasta
                  ? `${nivel.profesionalesHasta} profesional`
                  : `${nivel.profesionalesDesde} a ${nivel.profesionalesHasta} profesionales`;
              return (
                <View
                  key={n.id}
                  accessible
                  accessibilityLabel={`${nivel.nombre}, ${rango}${activo ? ", tu nivel actual en la calculadora" : ""}`}
                  style={{
                    flexDirection: "row",
                    gap: 16,
                    alignItems: "flex-start",
                    backgroundColor: activo ? C.amarilloSuave : C.blanco,
                    borderColor: activo ? C.amarilloOscuro : C.borde,
                    borderWidth: activo ? 2 : 1,
                    borderRadius: 18,
                    padding: movil ? 18 : 24,
                    paddingVertical: movil ? 18 : 22,
                  }}
                >
                  <CajaIcono fondo={n.id === "equipo" ? C.amarillo : n.id === "pro" ? C.oscuro : C.amarilloClaro}>
                    <Icono nombre={n.icono} color={n.id === "pro" ? C.amarillo : C.oscuro} tamano={22} />
                  </CajaIcono>
                  <View style={{ flex: 1 }}>
                    <T style={{ fontSize: 17, fontWeight: "700", marginBottom: 4 }}>
                      {nivel.nombre} <T style={{ fontSize: 13, fontWeight: "600", color: C.gris }}>{rango}</T>
                    </T>
                    <T style={{ fontSize: 14, lineHeight: 22, color: C.textoSuave }}>{n.texto}</T>
                  </View>
                </View>
              );
            })}
            <T style={{ fontSize: 13, color: C.gris, marginHorizontal: 4 }}>
              Tu nivel cambia solo según la cantidad de profesionales. No tienes que elegirlo.
            </T>
          </View>
        </View>
      )}
    </Seccion>
  );
}

function TarjetaPrecio({
  planes,
  profesionales,
  setProfesionales,
  hrefRegistro,
  movil,
}: {
  planes: NonNullable<ReturnType<typeof usePlanes>["planes"]>;
  profesionales: number;
  setProfesionales: (n: number) => void;
  hrefRegistro: "/registro";
  movil: boolean;
}) {
  const total = precioPara(planes, profesionales);
  const maximo = planes.maximoProfesionales;
  const descuento = Math.round(planes.descuentoAnual * 100);
  const fila = (a: string, b: string) => (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: C.bordeOscuro,
      }}
    >
      <T style={{ color: C.grisMuyClaro, fontSize: 15, flexShrink: 1 }}>{a}</T>
      <T style={{ color: C.blanco, fontWeight: "700", fontSize: 15, textAlign: "right" }}>{b}</T>
    </View>
  );
  return (
    <View style={{ backgroundColor: C.oscuro, borderRadius: 22, padding: movil ? 26 : 36 }}>
      <T style={{ color: C.grisClaro, fontSize: 14, fontWeight: "600" }}>Primer profesional</T>
      <T style={{ color: C.blanco, fontSize: movil ? 40 : 52, fontWeight: "800", letterSpacing: -1 }}>
        {pesos(planes.precioPrimerProfesional)}{" "}
        <T style={{ color: C.grisClaro, fontSize: 17, fontWeight: "500" }}>/ mes</T>
      </T>
      {fila("Cada profesional adicional", `${pesos(planes.precioProfesionalAdicional)} / mes`)}
      {fila("Máximo por negocio", `${maximo} profesionales`)}
      {fila("Pago anual", `${descuento}% de descuento`)}

      <View style={{ marginVertical: 24, backgroundColor: C.oscuro2, borderRadius: 14, padding: 18 }}>
        <T style={{ color: C.grisClaro, fontSize: 13, marginBottom: 10 }}>
          Calcula tu precio · ¿Cuántos profesionales tienes?
        </T>
        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <BotonContador
            simbolo="−"
            etiqueta="Quitar profesional"
            ayuda={`Baja la cantidad de profesionales, mínimo 1`}
            desactivado={profesionales <= 1}
            onPress={() => setProfesionales(Math.max(1, profesionales - 1))}
          />
          <T
            accessibilityLiveRegion="polite"
            accessibilityLabel={`${profesionales} ${profesionales === 1 ? "profesional" : "profesionales"}`}
            style={{ color: C.blanco, fontSize: 22, fontWeight: "800", minWidth: 30, textAlign: "center" }}
          >
            {profesionales}
          </T>
          <BotonContador
            simbolo="+"
            etiqueta="Agregar profesional"
            ayuda={`Sube la cantidad de profesionales, máximo ${maximo}`}
            desactivado={profesionales >= maximo}
            onPress={() => setProfesionales(Math.min(maximo, profesionales + 1))}
          />
          <View style={{ marginLeft: "auto", alignItems: "flex-end" }} accessibilityLiveRegion="polite">
            <T style={{ color: C.amarillo, fontSize: 22, fontWeight: "800" }}>{pesos(total.mensual)} / mes</T>
            <T style={{ color: C.grisClaro, fontSize: 12 }}>o {pesos(total.anual)} al año</T>
          </View>
        </View>
      </View>
      <BotonLanding
        variante="amarillo"
        etiqueta="Prueba gratis 15 días"
        href={hrefRegistro}
        ayuda="Abre el registro de tu negocio"
        anchoCompleto
      />
    </View>
  );
}

function BotonContador({
  simbolo,
  etiqueta,
  ayuda,
  desactivado,
  onPress,
}: {
  simbolo: string;
  etiqueta: string;
  ayuda: string;
  desactivado: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityHint={ayuda}
      accessibilityState={{ disabled: desactivado }}
      disabled={desactivado}
      onPress={onPress}
      style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: C.bordeBoton,
        backgroundColor: C.oscuro,
        alignItems: "center",
        justifyContent: "center",
        opacity: desactivado ? 0.4 : 1,
      }}
    >
      <T style={{ color: C.blanco, fontSize: 20 }}>{simbolo}</T>
    </Pressable>
  );
}
