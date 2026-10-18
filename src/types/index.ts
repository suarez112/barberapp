export interface Barbero {
  id: string;
  nombre: string;
  usuario: string;
  clave: string;
  esAdmin: boolean;
  especialidad: string;
  equipo: string;
  porcentajeGanancia: number;
  foto?: string;
}

export interface Servicio {
  id: string;
  nombre: string;
  duracion: string; // ej: "40 min"
  precio: number;
}

export interface Empresa {
  id: string;
  codigoAcceso: string;
  nombre: string;
  colorPrimario: string;
  colorSecundario: string;
  horarioApertura: string; // formato 24 horas, ej: "09:00"
  horarioCierre: string; // formato 24 horas, ej: "20:00"
}

// Datos completos de un negocio (los datos de prueba locales usan esta forma)
export interface EmpresaConfig extends Empresa {
  barberos: Barbero[];
  servicios: Servicio[];
}

export interface Producto {
  id: string;
  empresaId: string;
  nombre: string;
  precio: number;
  foto?: string;
}

export type EstadoCita = "CONFIRMADA" | "COMPLETADA" | "CANCELADA";

// Lo mínimo que se necesita para saber si un horario está ocupado
export interface HorarioOcupado {
  barberoId: string;
  fecha: string; // "2026-10-15"
  hora: string; // "09:40 AM"
  duracionMin?: number;
  estado: EstadoCita;
}

export interface Cita extends HorarioOcupado {
  id: string;
  cliente: string;
  telefono: string;
  indicativo?: string;
  servicio: string;
  barberoNombre: string;
  empresaId: string;
  precio: number;
  completadaEn?: string;
  completadaPor?: string;
  canceladaEn?: string;
  canceladaPor?: string;
}

// Un día del calendario que se muestra en los selectores
export interface Dia {
  id: string;
  diaNom: string; // "JUE"
  num: string; // "15"
  fechaFull: string; // "2026-10-15"
  diaNumero: number;
}

export interface ClienteRegistrado {
  telefono: string;
  indicativo?: string; // ej: "57"; si falta se asume Colombia
  nombre: string;
  fechaUltimaCita?: string;
  totalCitas?: number;
}

export interface ElementoListaNegra {
  id: string;
  nombre: string;
  telefono: string;
}

// Un bloqueo ahora es un RANGO de tiempo, medido en minutos desde la medianoche.
// Ejemplo: de 12:00 a 13:00 -> desdeMin: 720, hastaMin: 780
// Un día completo -> desdeMin: 0, hastaMin: 1440
export interface BloqueoHorario {
  id: string;
  barberoId: string;
  fechaBase: string;
  diasSemana: string[];
  desdeMin: number;
  hastaMin: number;
  frecuencia: "PUNTUAL" | "SEMANAL_RECURRENTE";
}

export interface NotificacionCliente {
  id: string;
  titulo: string;
  mensaje: string;
  fecha: string;
}
