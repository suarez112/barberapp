export interface Barbero {
  id: string;
  nombre: string;
  usuario: string;
  esAdmin: boolean;
  especialidad: string;
  equipo?: string;
  porcentajeGanancia: number;
  foto?: string;
}

export interface Servicio {
  id: string;
  nombre: string;
  duracion: string; // ej: "40 min"
  duracionMin?: number;
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

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  fotoUrl: string | null;
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

// Horario en que un profesional no atiende (vista pública, sin motivo).
// Se repite cada semana (diaSemana: 0 = domingo … 6 = sábado); los bloqueos
// antiguos de un solo día traen fecha y diaSemana null.
export interface BloqueoHorario {
  barberoId: string;
  diaSemana: number | null;
  fecha: string | null;
  horaInicio: string; // "12:00"
  horaFin: string; // "13:00"
}
