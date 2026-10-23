import { PlanSuscripcion, Suscripcion } from "../cuenta/api";
import { NivelPlan, PrecioPlan, RespuestaPlanes } from "./api";

// Cuentas del cobro por profesional, para mostrarlas antes de que el backend las haga.
// El backend es quien cobra de verdad: esto es una estimación con sus mismas reglas.

const CARGO_MINIMO = 10000;

export const nivelPara = (planes: RespuestaPlanes, profesionales: number): NivelPlan =>
  planes.niveles.find((n) => profesionales <= n.profesionalesHasta) ?? planes.niveles[planes.niveles.length - 1];

// Un negocio paga como mínimo un profesional
export const precioPara = (planes: RespuestaPlanes, profesionales: number): PrecioPlan => {
  const n = Math.min(Math.max(profesionales, 1), planes.maximoProfesionales);
  return planes.precios.find((p) => p.profesionales === n) ?? planes.precios[planes.precios.length - 1];
};

const aFecha = (iso: string) => {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d));
};

export type CargoNuevo = {
  // Cargo de hoy; null si no se cobra nada ahora (prueba, vencido o cabe en lo ya pagado)
  cargoHoy: number | null;
  // Cuánto paga el negocio por periodo desde la renovación, con el profesional nuevo
  nuevoValor: number;
  periodo: PlanSuscripcion;
};

// Qué pasa al sumar un profesional que atiende clientes. `cobrados` son los de hoy.
export const calcularCargoNuevo = (
  planes: RespuestaPlanes,
  suscripcion: Suscripcion | null,
  cobrados: number,
): CargoNuevo => {
  const periodo: PlanSuscripcion = suscripcion?.plan ?? "mensual";
  const nuevo = cobrados + 1;
  const nuevoValor = precioPara(planes, nuevo)[periodo];
  const pagados = suscripcion?.profesionalesPagados ?? cobrados;
  const vigente = suscripcion?.estado === "activa" && !!suscripcion.fechaFin && (suscripcion.diasRestantes ?? 0) > 0;
  // Reemplazar a alguien dentro de lo ya pagado no cuesta
  if (!vigente || !suscripcion?.plan || nuevo <= pagados) return { cargoHoy: null, nuevoValor, periodo };

  // El puesto que se suma cuesta lo que sube el total
  const puesto =
    nuevo <= 1
      ? precioPara(planes, 1)[suscripcion.plan]
      : precioPara(planes, nuevo)[suscripcion.plan] - precioPara(planes, nuevo - 1)[suscripcion.plan];
  const fin = aFecha(suscripcion.fechaFin!);
  const inicio = new Date(fin);
  if (suscripcion.plan === "anual") inicio.setUTCFullYear(inicio.getUTCFullYear() - 1);
  else inicio.setUTCMonth(inicio.getUTCMonth() - 1);
  const diasPeriodo = Math.round((fin.getTime() - inicio.getTime()) / 86400000);
  const proporcional = Math.round((puesto * (suscripcion.diasRestantes ?? 0)) / diasPeriodo);
  return { cargoHoy: Math.max(CARGO_MINIMO, proporcional), nuevoValor, periodo };
};

const pesos = (n: number) => `$${Math.round(n).toLocaleString("es-CO")}`;

// Texto del aviso que se muestra antes de confirmar que se suma a alguien
export const textoCargoNuevo = (c: CargoNuevo) => {
  const sufijo = c.periodo === "mensual" ? "al mes" : "al año";
  const hoy =
    c.cargoHoy === null
      ? "Ahora no se te cobra nada por este profesional."
      : `Se te cobrará ${pesos(c.cargoHoy)} ahora (valor proporcional a los días que faltan de tu periodo; el mínimo es ${pesos(CARGO_MINIMO)}).`;
  return `${hoy}\nDesde tu próxima renovación pagarás ${pesos(c.nuevoValor)} ${sufijo}.`;
};

export const AVISO_SIN_REEMBOLSO =
  "No se devuelve dinero por lo ya pagado. Tu próxima renovación se ajusta a los profesionales que queden.";
