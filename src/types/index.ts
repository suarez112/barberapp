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
  duracion: string;
  precio: number;
}

export interface EmpresaConfig {
  id: string;
  codigoAcceso: string;
  nombre: string;
  colorPrimario: string;
  colorSecundario: string;
  barberos: Barbero[];
  servicios: Servicio[];
}

export interface ClienteRegistrado {
  telefono: string;
  nombre: string;
  fechaUltimaCita?: string;
  totalCitas?: number;
}

export interface ElementoListaNegra {
  id: string;
  nombre: string;
  telefono: string;
}

export interface BloqueoHorario {
  id: string;
  barberoId: string;
  fechaBase: string;
  diasSemana: string[];
  hora: string;
  frecuencia: "PUNTUAL" | "SEMANAL_RECURRENTE";
}

export interface NotificacionCliente {
  id: string;
  titulo: string;
  mensaje: string;
  fecha: string;
}
