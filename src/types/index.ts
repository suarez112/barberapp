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

export interface EmpresaConfig {
  id: string;
  codigoAcceso: string;
  nombre: string;
  colorPrimario: string;
  colorSecundario: string;
  horarioApertura: string; // formato 24 horas, ej: "09:00"
  horarioCierre: string; // formato 24 horas, ej: "20:00"
  barberos: Barbero[];
  servicios: Servicio[];
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
