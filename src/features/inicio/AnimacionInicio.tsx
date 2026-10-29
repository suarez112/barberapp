import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import { Image, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Stop } from "react-native-svg";
import { APP_NOMBRE } from "@/config/app";

// Total of the whole intro (the brief asks for 2.5 s at most)
const DURACION_MS = 2400;
const DURACION_MOVIMIENTO_REDUCIDO_MS = 1400;

// The intro is always dark, whatever the app theme is: fixed colors on purpose
const FONDO = "#000000";
const ORO = "#FFC107";
const ORO_CLARO = "#FFE27A";
const ORO_OSCURO = "#FF9800";

const logoImagen = require("../../../assets/logo.png");

// ---------- Static drawings (built once; the animation only moves/fades them) ----------

// Small deterministic random generator so the bolts look the same on every launch
function aleatorio(semilla: number) {
  let a = semilla;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Punto = { x: number; y: number };

// A jagged line from (rIni) to (rFin) along an angle, in a -100..100 box
function ramaIrregular(angulo: number, rIni: number, rFin: number, sacudida: number, azar: () => number): Punto[] {
  const pasos = 7;
  const puntos: Punto[] = [];
  for (let i = 0; i <= pasos; i++) {
    const r = rIni + ((rFin - rIni) * i) / pasos;
    const desvio = i === 0 ? 0 : (azar() - 0.5) * sacudida;
    puntos.push({
      x: Math.cos(angulo) * r - Math.sin(angulo) * desvio,
      y: Math.sin(angulo) * r + Math.cos(angulo) * desvio,
    });
  }
  return puntos;
}

function aTrazo(puntos: Punto[]) {
  return puntos.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
}

// Bolts that leave from the center, each with two thinner branches
function crearRayos(cantidad: number, rIni: number, rFin: number, semilla: number): string[] {
  const azar = aleatorio(semilla);
  const trazos: string[] = [];
  for (let i = 0; i < cantidad; i++) {
    const angulo = ((Math.PI * 2) / cantidad) * i + (azar() - 0.5) * 0.5;
    const largo = rFin * (0.6 + azar() * 0.4);
    const principal = ramaIrregular(angulo, rIni, largo, 14, azar);
    trazos.push(aTrazo(principal));
    for (let b = 0; b < 2; b++) {
      const origen = principal[2 + Math.floor(azar() * 3)];
      const anguloRama = angulo + (azar() > 0.5 ? 1 : -1) * (0.4 + azar() * 0.5);
      const rama = ramaIrregular(anguloRama, 0, largo * 0.38, 9, azar).map((p) => ({
        x: p.x + origen.x,
        y: p.y + origen.y,
      }));
      trazos.push(aTrazo(rama));
    }
  }
  return trazos;
}

function crearParticulas(cantidad: number, semilla: number) {
  const azar = aleatorio(semilla);
  return Array.from({ length: cantidad }, () => {
    const angulo = azar() * Math.PI * 2;
    const r = 8 + azar() * 80;
    return { x: Math.cos(angulo) * r, y: Math.sin(angulo) * r, radio: 0.5 + azar() * 1.4 };
  });
}

function Rayos({ trazos, grosor }: { trazos: string[]; grosor: number }) {
  return (
    <Svg width="100%" height="100%" viewBox="-100 -100 200 200">
      {trazos.map((d, i) => (
        <Path key={`halo${i}`} d={d} stroke={ORO_OSCURO} strokeOpacity={0.35} strokeWidth={grosor * 3.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ))}
      {trazos.map((d, i) => (
        <Path key={`nucleo${i}`} d={d} stroke={ORO_CLARO} strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ))}
    </Svg>
  );
}

function Resplandor({ id }: { id: string }) {
  return (
    <Svg width="100%" height="100%" viewBox="-100 -100 200 200">
      <Defs>
        <RadialGradient id={id} cx="0" cy="0" r="100" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
          <Stop offset="0.12" stopColor={ORO_CLARO} stopOpacity={0.95} />
          <Stop offset="0.4" stopColor={ORO} stopOpacity={0.4} />
          <Stop offset="1" stopColor={ORO_OSCURO} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={0} cy={0} r={100} fill={`url(#${id})`} />
    </Svg>
  );
}

// Two crossing tilted rings, with a wide soft stroke under a thin bright one (a cheap glow)
function Anillos({ angulos, rx, ry }: { angulos: number[]; rx: number; ry: number }) {
  return (
    <Svg width="100%" height="100%" viewBox="-100 -100 200 200">
      {angulos.map((a) => (
        <Ellipse key={`h${a}`} cx={0} cy={0} rx={rx} ry={ry} rotation={a} stroke={ORO_OSCURO} strokeOpacity={0.3} strokeWidth={7} fill="none" />
      ))}
      {angulos.map((a) => (
        <Ellipse key={`m${a}`} cx={0} cy={0} rx={rx} ry={ry} rotation={a} stroke={ORO} strokeOpacity={0.85} strokeWidth={2.4} fill="none" />
      ))}
      {angulos.map((a) => (
        <Ellipse key={`f${a}`} cx={0} cy={0} rx={rx + 2} ry={ry - 2} rotation={a} stroke={ORO_CLARO} strokeOpacity={0.9} strokeWidth={0.8} fill="none" />
      ))}
    </Svg>
  );
}

function Nubes() {
  const manchas = [
    { x: -45, y: -40, r: 55 },
    { x: 50, y: -30, r: 50 },
    { x: -55, y: 35, r: 50 },
    { x: 45, y: 50, r: 55 },
    { x: 0, y: 0, r: 60 },
  ];
  return (
    <Svg width="100%" height="100%" viewBox="-100 -100 200 200">
      <Defs>
        <RadialGradient id="nube" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#4A4D55" stopOpacity={0.85} />
          <Stop offset="1" stopColor="#1A1B1F" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {manchas.map((m, i) => (
        <Circle key={i} cx={m.x} cy={m.y} r={m.r} fill="url(#nube)" />
      ))}
    </Svg>
  );
}

function Particulas({ puntos }: { puntos: { x: number; y: number; radio: number }[] }) {
  return (
    <Svg width="100%" height="100%" viewBox="-100 -100 200 200">
      {puntos.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={p.radio} fill={i % 3 === 0 ? "#FFFFFF" : ORO_CLARO} />
      ))}
    </Svg>
  );
}

// ---------- Intro ----------

const fijo = Extrapolation.CLAMP;

export default function AnimacionInicio({ onTerminar }: { onTerminar: () => void }) {
  const reducirMovimiento = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const t = useSharedValue(0);

  // Everything is drawn in a square a bit wider than the screen, so the bolts reach the edges
  const lado = Math.min(width, height) * 1.15;
  const ladoLogo = Math.min(width * 0.58, 260);
  const anchoBarra = Math.min(width * 0.62, 280);

  const rayosChispa = useMemo(() => crearRayos(9, 4, 100, 11), []);
  const rayosLogo = useMemo(() => crearRayos(11, 40, 100, 29), []);
  const particulas = useMemo(() => crearParticulas(34, 7), []);

  useEffect(() => {
    const duracion = reducirMovimiento ? DURACION_MOVIMIENTO_REDUCIDO_MS : DURACION_MS;
    if (!reducirMovimiento) {
      t.value = withTiming(1, { duration: DURACION_MS, easing: Easing.linear });
    }
    const espera = setTimeout(onTerminar, duracion);
    return () => clearTimeout(espera);
  }, [t, reducirMovimiento, onTerminar]);

  // Moment 1: the spark
  const estiloChispa = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.04, 0.28, 0.4, 0.7, 1], [0, 1, 1, 0.4, 0.55, 0.5], fijo),
    transform: [{ scale: interpolate(t.value, [0, 0.1, 0.4, 1], [0.1, 0.7, 1.1, 1.3], fijo) }],
  }));
  const estiloRayosChispa = useAnimatedStyle(() => {
    const parpadeo = 0.75 + 0.25 * Math.sin(t.value * 160);
    return {
      opacity: interpolate(t.value, [0, 0.03, 0.2, 0.42], [0, 1, 1, 0], fijo) * parpadeo,
      transform: [{ scale: interpolate(t.value, [0, 0.3], [0.15, 1.05], fijo) }, { rotate: `${t.value * 25}deg` }],
    };
  });
  const estiloParticulas = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.03, 0.18, 0.4], [0, 1, 0.8, 0], fijo),
    transform: [{ scale: interpolate(t.value, [0, 0.4], [0.1, 1.15], fijo) }],
  }));

  // Moment 2: rings of light spinning around the center
  const estiloAnillosA = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0.2, 0.36, 0.62, 0.82], [0, 1, 1, 0], fijo),
    transform: [
      { scale: interpolate(t.value, [0.2, 0.62, 0.82], [0.3, 1, 1.35], fijo) },
      { rotate: `${t.value * 540}deg` },
    ],
  }));
  const estiloAnillosB = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0.24, 0.4, 0.62, 0.82], [0, 1, 1, 0], fijo),
    transform: [
      { scale: interpolate(t.value, [0.24, 0.62, 0.82], [0.25, 0.9, 1.25], fijo) },
      { rotate: `${-t.value * 720}deg` },
    ],
  }));

  // Moment 3: logo with energy around it
  const estiloNubes = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0.55, 0.8], [0, 0.9], fijo),
    transform: [{ scale: interpolate(t.value, [0.55, 1], [0.7, 1.1], fijo) }],
  }));
  const estiloRayosLogo = useAnimatedStyle(() => {
    const parpadeo = 0.6 + 0.4 * Math.abs(Math.sin(t.value * 90));
    return {
      opacity: interpolate(t.value, [0.58, 0.72, 1], [0, 1, 1], fijo) * parpadeo,
      transform: [
        { scale: interpolate(t.value, [0.58, 1], [0.6, 1], fijo) },
        { rotate: `${Math.sin(t.value * 60) * 3}deg` },
      ],
    };
  });
  const estiloLogo = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0.3, 0.45], [0, 1], fijo),
    transform: [{ scale: interpolate(t.value, [0.3, 0.5, 0.72, 0.82, 1], [0.2, 0.5, 1.08, 1, 1], fijo) }],
  }));

  // Loading bar: fills over the whole intro, with a bright spark at its tip
  const estiloRelleno = useAnimatedStyle(() => ({ width: t.value * anchoBarra }));
  const estiloPuntaBarra = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.03, 0.97, 1], [0, 1, 1, 0.4], fijo),
    transform: [{ translateX: t.value * anchoBarra - 14 }],
  }));

  const capa = { width: lado, height: lado, position: "absolute" as const };

  if (reducirMovimiento) {
    // "Reduce motion" is on: only the logo with a soft glow, nothing moves
    return (
      <View style={styles.contenedor} accessible accessibilityLabel={`${APP_NOMBRE}, cargando`}>
        <StatusBar style="light" />
        <View style={styles.escenario}>
          <View style={[capa, { opacity: 0.55 }]}>
            <Resplandor id="brilloSuave" />
          </View>
          <Image accessibilityIgnoresInvertColors source={logoImagen} style={{ width: ladoLogo, height: ladoLogo }} resizeMode="contain" />
        </View>
        <Text style={styles.texto}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.contenedor} accessible accessibilityLabel={`${APP_NOMBRE}, cargando`}>
      <StatusBar style="light" />
      <View style={styles.escenario}>
        <Animated.View style={[capa, estiloNubes]}>
          <Nubes />
        </Animated.View>
        <Animated.View style={[capa, estiloChispa]}>
          <Resplandor id="chispa" />
        </Animated.View>
        <Animated.View style={[capa, estiloParticulas]}>
          <Particulas puntos={particulas} />
        </Animated.View>
        <Animated.View style={[capa, estiloRayosChispa]}>
          <Rayos trazos={rayosChispa} grosor={0.9} />
        </Animated.View>
        <Animated.View style={[capa, estiloAnillosA]}>
          <Anillos angulos={[0, 60, 120]} rx={88} ry={42} />
        </Animated.View>
        <Animated.View style={[capa, estiloAnillosB]}>
          <Anillos angulos={[30, 90]} rx={74} ry={34} />
        </Animated.View>
        <Animated.View style={[capa, estiloRayosLogo]}>
          <Rayos trazos={rayosLogo} grosor={0.8} />
        </Animated.View>
        <Animated.Image
          accessibilityIgnoresInvertColors
          source={logoImagen}
          style={[{ width: ladoLogo * 1.0, height: ladoLogo * 1.0 }, estiloLogo]}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.texto}>Cargando...</Text>
      <View style={[styles.barra, { width: anchoBarra + 4 }]}>
        <Animated.View style={[styles.relleno, estiloRelleno]} />
        <Animated.View style={[styles.punta, estiloPuntaBarra]}>
          <Svg width={28} height={28} viewBox="-100 -100 200 200">
            <Defs>
              <RadialGradient id="puntaBarra" cx="0" cy="0" r="100" gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
                <Stop offset="0.35" stopColor={ORO_CLARO} stopOpacity={0.8} />
                <Stop offset="1" stopColor={ORO} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={0} cy={0} r={100} fill="url(#puntaBarra)" />
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: FONDO, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  escenario: { flex: 1, width: "100%", alignItems: "center", justifyContent: "center" },
  texto: { color: ORO, fontSize: 18, fontWeight: "600", letterSpacing: 0.5, marginBottom: 16 },
  barra: {
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: ORO,
    marginBottom: 72,
    justifyContent: "center",
    overflow: "visible",
  },
  relleno: { height: 6, borderRadius: 3, backgroundColor: ORO, marginLeft: 0 },
  punta: { position: "absolute", left: 0, top: -9, width: 28, height: 28 },
});
