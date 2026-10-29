import { Image } from "expo-image";
import Head from "expo-router/head";
import { useRef, useState } from "react";
import { Pressable, ScrollView, type ScrollViewInstance, View } from "react-native";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";
import { CONTACTO } from "@/config/app";
import DocumentoLegalModal from "@/features/legal/DocumentoLegalModal";
import { TipoDocumento } from "@/features/legal/api";
import { COLORES_LANDING as C } from "@/theme/paleta";
import {
  BotonLanding,
  CajaIcono,
  Contenedor,
  EncabezadoSeccion,
  Etiqueta,
  EnlaceTexto,
  FUENTE,
  Icono,
  NombreIcono,
  Seccion,
  T,
  columnasIguales,
  cuadricula,
  useAnchos,
} from "./componentes";
import { DibujoCrecimiento, DibujoEquipo, DibujoFinanzas, DibujoReservas, PanelEjemplo } from "./Ilustraciones";
import SeccionPlanes from "./SeccionPlanes";

// Página principal de Agendality. Solo existe en la web (la importa app/index.tsx únicamente allí).

const logo = require("../../../assets/logo.png");

const TITULO = "Agendality – Software de citas y gestión para negocios";
const DESCRIPCION =
  "Agendality es el software de citas y gestión para negocios: reservas en línea 24/7, agenda por empleado, balance diario, semanal y mensual y reportes para hacer crecer tu establecimiento.";

type IdSeccion = "funciones" | "negocios" | "planes" | "preguntas";

const MENU: { id: IdSeccion; etiqueta: string }[] = [
  { id: "funciones", etiqueta: "Funciones" },
  { id: "negocios", etiqueta: "Negocios" },
  { id: "planes", etiqueta: "Planes" },
  { id: "preguntas", etiqueta: "Preguntas" },
];

const VALORES: { icono: NombreIcono; titulo: string; texto: string }[] = [
  {
    icono: "calendario",
    titulo: "Reservas automáticas 24/7",
    texto: "Deja de perder tiempo agendando por llamadas o mensajes. El software agenda por ti, a cualquier hora.",
  },
  {
    icono: "tendencia",
    titulo: "Proyecta tu crecimiento",
    texto: "Descubre qué servicios te dejan más ganancia y crece de 1 a 10 profesionales sin cambiar de sistema.",
  },
  {
    icono: "equipo",
    titulo: "Gestión de empleados y turnos",
    texto: "Cada empleado tiene su agenda. Tú autorizas cambios, defines horarios y bloqueas turnos.",
  },
  {
    icono: "barras",
    titulo: "Control financiero",
    texto: "Conoce el balance diario, semanal y mensual de tu negocio, sin cuadernos ni hojas de cálculo.",
  },
];

const FUNCIONES: {
  etiqueta: string;
  titulo: string;
  texto: string;
  puntos: string[];
  dibujo: () => React.JSX.Element;
}[] = [
  {
    etiqueta: "Reservas automáticas",
    titulo: "Tu negocio recibe citas aunque esté cerrado",
    texto: "Deja de contestar llamadas y mensajes para agendar. Tu agenda se llena y se actualiza sola, las 24 horas.",
    puntos: [
      "Enlace propio y código QR para promocionar tu negocio",
      "Más tiempo para atender, menos tiempo al teléfono",
      "Recordatorios automáticos que reducen las inasistencias",
    ],
    dibujo: DibujoReservas,
  },
  {
    etiqueta: "Empleados y turnos",
    titulo: "Ten el control total de tu personal",
    texto: "Asigna una agenda a cada empleado y mantén el control de quién atiende, cuándo y cuánto produce.",
    puntos: [
      "Agenda y horarios individuales por empleado",
      "Tú autorizas cambios y bloqueas turnos",
      "Comisiones calculadas automáticamente",
    ],
    dibujo: DibujoEquipo,
  },
  {
    etiqueta: "Control financiero",
    titulo: "Revisa los balances de tu negocio",
    texto: "Mira cuánto entra cada día, semana y mes, y cuánto le corresponde a cada empleado.",
    puntos: [
      "Balance diario, semanal y mensual",
      "Comisiones de empleados calculadas solas",
      "Exporta tus reportes a Excel o PDF",
    ],
    dibujo: DibujoFinanzas,
  },
  {
    etiqueta: "Crecimiento",
    titulo: "Proyecta el crecimiento de tu establecimiento",
    texto: "Toma decisiones con datos reales de tu negocio y crece sin cambiar de herramienta.",
    puntos: [
      "Descubre qué servicios te dejan más ganancia",
      "Reportes avanzados para planear tu negocio",
      "Crece de 1 a 10 profesionales con el mismo sistema",
    ],
    dibujo: DibujoCrecimiento,
  },
];

const CATEGORIAS: { icono: NombreIcono; nombre: string }[] = [
  { icono: "tijeras", nombre: "Barberías" },
  { icono: "peluqueria", nombre: "Peluquerías" },
  { icono: "estrella", nombre: "Salones de belleza" },
  { icono: "spa", nombre: "Spa y estética" },
  { icono: "unas", nombre: "Uñas y pestañas" },
  { icono: "salud", nombre: "Salud y bienestar" },
  { icono: "pesas", nombre: "Entrenamiento" },
];

const PASOS = [
  { titulo: "Crea tu negocio", texto: "Registra tus horarios y los servicios que ofreces, con su precio y duración." },
  { titulo: "Agrega a tu equipo", texto: "Invita a tus profesionales. Cada uno tendrá su propia agenda." },
  {
    titulo: "Comparte y recibe citas",
    texto: "Envía tu enlace o pega tu QR. Las reservas llegan solas y los recordatorios salen automáticos.",
  },
];

const POR_QUE: { icono: NombreIcono; titulo: string; texto: string }[] = [
  { icono: "celular", titulo: "Celular y computador", texto: "Usa la app o la web. Tu información se mantiene igual en ambos." },
  {
    icono: "dinero",
    titulo: "Pagas solo lo que usas",
    texto: "Sin contratos ni permanencia. Agregas o quitas profesionales cuando lo necesites.",
  },
  {
    icono: "mensaje",
    titulo: "Soporte cuando lo necesitas",
    texto: "Si tienes una duda o un problema, escríbenos y te ayudamos.",
  },
];

const PREGUNTAS = [
  {
    q: "¿Necesito tarjeta para la prueba gratis?",
    r: "No. Durante 15 días usas todo sin registrar ningún medio de pago. Al terminar decides si continúas.",
  },
  {
    q: "¿Sirve para mi tipo de negocio?",
    r: "Si atiendes a tus clientes con cita previa, sí. Configuras tus propios servicios, duraciones y precios.",
  },
  {
    q: "¿Mis clientes tienen que descargar algo?",
    r: "No es obligatorio. Pueden reservar desde tu enlace en el navegador o usar la app si la prefieren.",
  },
  {
    q: "¿Puedo usarlo desde el celular y el computador?",
    r: "Sí. Tienes la app móvil y la versión web con la misma información, siempre actualizada.",
  },
  { q: "¿Puedo cancelar cuando quiera?", r: "Sí. No hay permanencia mínima en el plan mensual." },
];

export default function LandingScreen() {
  const { tablet, movil } = useAnchos();
  const reducirMovimiento = useReducedMotion();
  const scroll = useRef<ScrollViewInstance>(null);
  const [documento, setDocumento] = useState<TipoDocumento | null>(null);

  // Solo web: cada sección lleva su id en el HTML. La cabecera está fuera del scroll, así que no hace falta compensarla.
  const irA = (id: IdSeccion) =>
    document.getElementById(id)?.scrollIntoView({ behavior: reducirMovimiento ? "auto" : "smooth", block: "start" });
  const entrada = (retraso: number) => (reducirMovimiento ? undefined : FadeInDown.duration(700).delay(retraso));

  return (
    <View style={{ flex: 1, backgroundColor: C.blanco, overflow: "hidden" }}>
      <Head>
        <title>{TITULO}</title>
        <meta name="description" content={DESCRIPCION} />
      </Head>

      {/* CABECERA */}
      <View
        accessibilityRole="banner"
        style={{ backgroundColor: "rgba(255,255,255,0.97)", borderBottomWidth: 1, borderBottomColor: C.borde, zIndex: 5 }}
      >
        <Contenedor style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 72, gap: 16 }}>
          <Animated.View entering={entrada(0)}>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Agendality, ir al inicio"
              accessibilityHint="Sube al comienzo de la página"
              onPress={() => scroll.current?.scrollTo({ y: 0, animated: !reducirMovimiento })}
              style={{ flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44 }}
            >
              <Image source={logo} accessibilityLabel="" style={{ width: 36, height: 36, borderRadius: 10 }} />
              <T style={{ fontSize: 20, fontWeight: "800", letterSpacing: 0.5 }}>AGENDALITY</T>
            </Pressable>
          </Animated.View>
          {!tablet && (
            <View accessibilityRole="navigation" accessibilityLabel="Secciones de la página" style={{ flexDirection: "row", gap: 28 }}>
              {MENU.map((m) => (
                <EnlaceTexto
                  key={m.id}
                  etiqueta={m.etiqueta}
                  ayuda={`Baja a la sección ${m.etiqueta}`}
                  onPress={() => irA(m.id)}
                  style={{ color: C.textoSuave }}
                />
              ))}
            </View>
          )}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {!movil && (
              <EnlaceTexto etiqueta="Iniciar sesión" ayuda="Abre la pantalla para entrar a tu cuenta" href="/login" style={{ fontWeight: "600" }} />
            )}
            <BotonLanding variante="amarillo" etiqueta="Prueba gratis" href="/registro" ayuda="Abre el registro de tu negocio" chico />
          </View>
        </Contenedor>
      </View>

      <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        {/* PORTADA */}
        <View
          style={{ backgroundColor: C.oscuro, paddingTop: movil ? 56 : 88, paddingBottom: movil ? 72 : 96 }}
        >
          <Contenedor style={tablet ? columnasIguales(1, 56) : { ...cuadricula("repeat(2, minmax(0, 1fr))", 56), alignItems: "center" }}>
            <View style={{ alignItems: "flex-start" }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: "rgba(250,204,21,0.12)",
                  borderColor: "rgba(250,204,21,0.35)",
                  borderWidth: 1,
                  paddingVertical: 6,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                }}
              >
                <Icono nombre="rayo" color={C.amarillo} tamano={14} />
                <T style={{ color: C.amarillo, fontSize: 13, fontWeight: "600", flexShrink: 1 }}>
                  Software de citas y gestión para negocios
                </T>
              </View>
              <Animated.View entering={entrada(150)}>
                <T
                  accessibilityRole="header"
                  aria-level={1}
                  style={{
                    color: C.blanco,
                    fontSize: movil ? 36 : tablet ? 44 : 58,
                    lineHeight: movil ? 38 : tablet ? 47 : 62,
                    fontWeight: "800",
                    letterSpacing: -1.5,
                    marginTop: 20,
                    marginBottom: 20,
                  }}
                >
                  Administra tu negocio y deja que <T style={{ color: C.amarillo }}>tus clientes agenden 24/7.</T>
                </T>
              </Animated.View>
              <T style={{ color: C.grisMuyClaro, fontSize: movil ? 17 : 19, lineHeight: movil ? 27 : 30, maxWidth: 540, marginBottom: 32 }}>
                Automatiza tus reservas, controla el balance diario, semanal y mensual de tu empresa, asigna una agenda a
                cada empleado y proyecta el crecimiento de tu establecimiento.
              </T>
              <View style={{ flexDirection: movil ? "column" : "row", gap: 14, alignSelf: movil ? "stretch" : "flex-start" }}>
                <BotonLanding
                  variante="amarillo"
                  etiqueta="Prueba gratis 15 días"
                  href="/registro"
                  ayuda="Abre el registro de tu negocio"
                  anchoCompleto={movil}
                  icono={<Icono nombre="flecha" color={C.oscuro} tamano={16} />}
                />
                <BotonLanding
                  variante="contorno"
                  etiqueta="Soy cliente, quiero reservar"
                  href="/cliente"
                  ayuda="Abre la pantalla para reservar una cita como cliente"
                  anchoCompleto={movil}
                />
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 18, marginTop: 18 }}>
                {["Sin tarjeta de crédito", "Sin contratos", "Web y app móvil"].map((t) => (
                  <View key={t} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Icono nombre="check" color={C.amarillo} tamano={16} />
                    <T style={{ color: C.grisClaro, fontSize: 14 }}>{t}</T>
                  </View>
                ))}
              </View>
            </View>
            <PanelEjemplo />
          </Contenedor>
        </View>

        {/* 4 BENEFICIOS */}
        <Seccion gris>
          <EncabezadoSeccion
            centrado
            etiqueta="Lo que gana tu negocio"
            titulo="Menos tiempo administrando, más tiempo haciendo crecer tu negocio"
            texto="Agendality hace las tareas repetitivas por ti y te da la información para tomar mejores decisiones."
          />
          <View style={columnasIguales(movil ? 1 : tablet ? 2 : 4, 20)}>
            {VALORES.map((v) => (
              <Tarjeta key={v.titulo} padding={movil ? 22 : 26}>
                <View style={{ marginBottom: 18 }}>
                  <CajaIcono fondo={C.oscuro}>
                    <Icono nombre={v.icono} color={C.amarillo} />
                  </CajaIcono>
                </View>
                <T accessibilityRole="header" style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>{v.titulo}</T>
                <T style={{ fontSize: 15, lineHeight: 24, color: C.textoSuave }}>{v.texto}</T>
              </Tarjeta>
            ))}
          </View>
        </Seccion>

        {/* FUNCIONES EN DETALLE */}
        <Seccion id="funciones">
          <EncabezadoSeccion etiqueta="Funciones" titulo="Todo lo que tu negocio necesita, en una sola herramienta" margenInferior={8} />
          {FUNCIONES.map((f, i) => {
            const invertida = i % 2 === 1;
            const Dibujo = f.dibujo;
            const texto = (
              <View key="texto">
                <Etiqueta>{f.etiqueta}</Etiqueta>
                <T
                  accessibilityRole="header"
                  style={{ fontSize: movil ? 24 : 30, lineHeight: movil ? 29 : 36, fontWeight: "800", letterSpacing: -0.5, marginTop: 10, marginBottom: 14 }}
                >
                  {f.titulo}
                </T>
                <T style={{ fontSize: 17, lineHeight: 27, color: C.textoSuave, marginBottom: 18 }}>{f.texto}</T>
                {f.puntos.map((p) => (
                  <View key={p} style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                    <View style={{ marginTop: 2 }}>
                      <Icono nombre="check" color={C.verde} tamano={20} />
                    </View>
                    <T style={{ fontSize: 15, lineHeight: 22, flex: 1 }}>{p}</T>
                  </View>
                ))}
              </View>
            );
            const dibujo = <Dibujo key="dibujo" />;
            return (
              <View
                key={f.titulo}
                style={[
                  tablet ? columnasIguales(1, movil ? 24 : 56) : columnasIguales(2, 56),
                  { alignItems: "center", paddingVertical: movil ? 28 : 40 },
                ]}
              >
                {invertida && !tablet ? [dibujo, texto] : [texto, dibujo]}
              </View>
            );
          })}
        </Seccion>

        {/* PARA QUIÉN ES */}
        <Seccion gris id="negocios">
          <EncabezadoSeccion
            centrado
            etiqueta="Para quién es"
            titulo="Para cualquier negocio que trabaje con citas"
            texto="Si tu negocio atiende con hora previa, Agendality se adapta a ti."
          />
          <View style={columnasIguales(movil ? 1 : tablet ? 2 : 4, 14)}>
            {CATEGORIAS.map((c) => (
              <View
                key={c.nombre}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  backgroundColor: C.blanco,
                  borderColor: C.borde,
                  borderWidth: 1,
                  borderRadius: 16,
                  padding: 20,
                }}
              >
                <CajaIcono fondo={C.amarilloClaro} tamano={42}>
                  <Icono nombre={c.icono} color={C.oscuro} tamano={22} />
                </CajaIcono>
                <T style={{ fontWeight: "700", fontSize: 15, flexShrink: 1 }}>{c.nombre}</T>
              </View>
            ))}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                backgroundColor: C.oscuro,
                borderColor: C.oscuro,
                borderWidth: 1,
                borderRadius: 16,
                padding: 20,
              }}
            >
              <CajaIcono fondo={C.amarillo} tamano={42}>
                <Icono nombre="mas" color={C.oscuro} tamano={22} />
              </CajaIcono>
              <View style={{ flexShrink: 1 }}>
                <T style={{ color: C.blanco, fontWeight: "700", fontSize: 15 }}>Y muchos más</T>
                <T style={{ color: C.grisMuyClaro, fontSize: 13, marginTop: 2 }}>Si atiendes con cita, es para ti</T>
              </View>
            </View>
          </View>
        </Seccion>

        {/* CÓMO EMPEZAR */}
        <Seccion>
          <EncabezadoSeccion
            etiqueta="Empieza en minutos"
            titulo="Así de fácil es comenzar"
            texto="No necesitas saber de tecnología. Si usas el celular a diario, puedes usar Agendality para tener el control de tu negocio."
          />
          <View style={columnasIguales(movil ? 1 : tablet ? 2 : 3, 20)}>
            {PASOS.map((p, i) => (
              <View key={p.titulo} style={{ backgroundColor: C.oscuro, borderRadius: 18, padding: 28 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: C.amarillo,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 18,
                  }}
                >
                  <T style={{ fontWeight: "800" }}>{i + 1}</T>
                </View>
                <T accessibilityRole="header" style={{ color: C.blanco, fontSize: 19, fontWeight: "700", marginBottom: 8 }}>{p.titulo}</T>
                <T style={{ color: C.grisMuyClaro, lineHeight: 24, fontSize: 15 }}>{p.texto}</T>
              </View>
            ))}
          </View>
        </Seccion>

        {/* POR QUÉ AGENDALITY */}
        <Seccion gris>
          <EncabezadoSeccion
            etiqueta="Por qué Agendality"
            titulo="Hecho para negocios como el tuyo"
            texto="Una herramienta sencilla, a un precio justo y lista para crecer contigo."
          />
          <View style={columnasIguales(movil ? 1 : tablet ? 2 : 3, 20)}>
            {POR_QUE.map((p) => (
              <Tarjeta key={p.titulo} padding={movil ? 22 : 26} fila>
                <CajaIcono fondo={C.amarilloClaro}>
                  <Icono nombre={p.icono} color={C.oscuro} tamano={22} />
                </CajaIcono>
                <View style={{ flex: 1 }}>
                  <T accessibilityRole="header" style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>{p.titulo}</T>
                  <T style={{ fontSize: 15, lineHeight: 24, color: C.textoSuave }}>{p.texto}</T>
                </View>
              </Tarjeta>
            ))}
          </View>
        </Seccion>

        {/* PLANES */}
        <SeccionPlanes hrefRegistro="/registro" />

        {/* PREGUNTAS FRECUENTES */}
        <Seccion gris id="preguntas">
          <EncabezadoSeccion centrado etiqueta="Resolvemos tus dudas" titulo="Preguntas frecuentes" margenInferior={40} />
          <Preguntas />
        </Seccion>

        {/* FRANJA FINAL */}
        <View style={{ paddingVertical: 96 }}>
          <Contenedor>
            <View
              style={{
                backgroundColor: C.amarillo,
                borderRadius: 28,
                padding: movil ? 24 : 56,
                paddingVertical: movil ? 32 : 56,
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 32,
              }}
            >
              <View style={{ flexShrink: 1, flexBasis: movil ? "100%" : 420, flexGrow: 1 }}>
                <T accessibilityRole="header" style={{ fontSize: movil ? 28 : 36, lineHeight: movil ? 33 : 42, fontWeight: "800", letterSpacing: -0.6, marginBottom: 10 }}>
                  Dedica tu tiempo a lo que sabes hacer
                </T>
                <T style={{ fontSize: 17, color: C.oscuro2 }}>
                  Crea tu negocio hoy y deja que Agendality se encargue de la agenda.
                </T>
              </View>
              <View style={{ alignSelf: movil ? "stretch" : "auto", flexBasis: movil ? "100%" : "auto" }}>
                <BotonLanding variante="oscuro" etiqueta="Prueba gratis 15 días" href="/registro" ayuda="Abre el registro de tu negocio" anchoCompleto={movil} />
              </View>
            </View>
          </Contenedor>
        </View>

        {/* PIE DE PÁGINA */}
        <View accessibilityRole="contentinfo" style={{ backgroundColor: C.oscuro, paddingTop: 64, paddingBottom: 32 }}>
          <Contenedor>
            <View
              style={
                movil
                  ? columnasIguales(1, 32)
                  : tablet
                    ? columnasIguales(2, 32)
                    : cuadricula("minmax(0, 1.4fr) repeat(3, minmax(0, 1fr))", 32)
              }
            >
              <View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <Image source={logo} accessibilityLabel="" style={{ width: 36, height: 36, borderRadius: 10 }} />
                  <T style={{ color: C.blanco, fontSize: 20, fontWeight: "800", letterSpacing: 0.5 }}>AGENDALITY</T>
                </View>
                <T style={{ color: C.grisMuyClaro, fontSize: 14, lineHeight: 22, maxWidth: 280 }}>Citas simples, negocios eficientes.</T>
              </View>
              <ColumnaPie titulo="Producto">
                {MENU.map((m) => (
                  <EnlacePie key={m.id} etiqueta={m.etiqueta} ayuda={`Baja a la sección ${m.etiqueta}`} onPress={() => irA(m.id)} />
                ))}
              </ColumnaPie>
              <ColumnaPie titulo="Legal">
                <EnlacePie etiqueta="Política de tratamiento de datos" ayuda="Abre la política de tratamiento de datos" onPress={() => setDocumento("politica-datos")} />
                <EnlacePie etiqueta="Términos y condiciones" ayuda="Abre los términos y condiciones" onPress={() => setDocumento("terminos")} />
                <EnlacePie etiqueta="PQRS" ayuda="Abre el formulario de peticiones, quejas, reclamos y sugerencias" href="/pqrs" />
              </ColumnaPie>
              <ColumnaPie titulo="Contacto">
                {CONTACTO.correo ? (
                  <EnlacePie etiqueta={CONTACTO.correo} ayuda="Abre tu correo para escribirnos" externo={`mailto:${CONTACTO.correo}`} />
                ) : null}
                <EnlacePie etiqueta="Iniciar sesión" ayuda="Abre la pantalla para entrar a tu cuenta" href="/login" />
              </ColumnaPie>
            </View>
            <View style={{ borderTopWidth: 1, borderTopColor: C.bordeOscuro, marginTop: 40, paddingTop: 24 }}>
              <T style={{ color: C.grisClaro, fontSize: 14 }}>© 2026 Agendality. Todos los derechos reservados.</T>
            </View>
          </Contenedor>
        </View>
      </ScrollView>

      <DocumentoLegalModal tipo={documento} onCerrar={() => setDocumento(null)} />
    </View>
  );
}

function Tarjeta({ children, padding, fila }: { children: React.ReactNode; padding: number; fila?: boolean }) {
  return (
    <View
      style={{
        backgroundColor: C.blanco,
        borderColor: C.borde,
        borderWidth: 1,
        borderRadius: 18,
        padding,
        flexDirection: fila ? "row" : "column",
        gap: fila ? 16 : 0,
      }}
    >
      {children}
    </View>
  );
}

function Preguntas() {
  const [abiertas, setAbiertas] = useState<Set<number>>(new Set([0]));
  const alternar = (i: number) =>
    setAbiertas((previas) => {
      const nuevas = new Set(previas);
      if (!nuevas.delete(i)) nuevas.add(i);
      return nuevas;
    });
  return (
    <View style={{ maxWidth: 820, width: "100%", alignSelf: "center" }}>
      {PREGUNTAS.map((p, i) => {
        const abierta = abiertas.has(i);
        return (
          <View key={p.q} style={{ backgroundColor: C.blanco, borderColor: C.borde, borderWidth: 1, borderRadius: 14, marginBottom: 12 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={p.q}
              accessibilityHint={abierta ? "Toca para cerrar la respuesta" : "Toca para ver la respuesta"}
              accessibilityState={{ expanded: abierta }}
              onPress={() => alternar(i)}
              style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, padding: 20, paddingHorizontal: 22, minHeight: 44 }}
            >
              <T style={{ fontWeight: "700", fontSize: 16, flex: 1 }}>{p.q}</T>
              <View style={{ transform: [{ rotate: abierta ? "180deg" : "0deg" }] }}>
                <Icono nombre="chevron" color={C.oscuro} tamano={20} />
              </View>
            </Pressable>
            {abierta && (
              <T style={{ paddingHorizontal: 22, paddingBottom: 20, color: C.textoSuave, lineHeight: 24, fontSize: 15 }}>{p.r}</T>
            )}
          </View>
        );
      })}
    </View>
  );
}

function ColumnaPie({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View>
      <T accessibilityRole="header" style={{ color: C.blanco, fontSize: 14, fontWeight: "700", marginBottom: 14 }}>{titulo}</T>
      {children}
    </View>
  );
}

function EnlacePie({
  etiqueta,
  ayuda,
  onPress,
  href,
  externo,
}: {
  etiqueta: string;
  ayuda: string;
  onPress?: () => void;
  href?: "/pqrs" | "/login";
  externo?: string;
}) {
  const alTocar = externo
    ? () => {
        window.location.href = externo;
      }
    : onPress;
  return (
    <EnlaceTexto etiqueta={etiqueta} ayuda={ayuda} href={href} onPress={alTocar} style={{ color: C.grisMuyClaro, fontSize: 14, fontFamily: FUENTE }} />
  );
}
