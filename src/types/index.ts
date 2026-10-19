export type RolEquipo = "admin" | "empleado";

export interface Barbero {
  id: string;
  nombre: string;
  usuario: string;
  // Igual a rol === "admin"
  esAdmin: boolean;
  rol?: RolEquipo;
  // Recibe reservas como profesional (los que no, no aparecen al reservar)
  atiendeClientes?: boolean;
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
  horarioApertura: string; // apertura más temprana de la semana, ej: "09:00"
  horarioCierre: string; // cierre más tardío de la semana, ej: "20:00"
  // Horario real de cada día (0 = domingo … 6 = sábado)
  horario?: DiaHorario[];
  // false si la suscripción del negocio venció (vista pública de /empresas/validar)
  recibiendoReservas?: boolean;
}

// Horario de un día del negocio. Cerrado: apertura y cierre null.
export interface DiaHorario {
  dia: number;
  abierto: boolean;
  apertura: string | null; // "08:00"
  cierre: string | null; // "19:00"
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
// "semanal": se repite cada semana (diaSemana: 0 = domingo … 6 = sábado).
// "fecha": solo ese día (fecha "2026-10-21"). todoElDia llega como "00:00"–"24:00".
export interface BloqueoHorario {
  barberoId: string;
  tipo?: "semanal" | "fecha";
  diaSemana: number | null;
  fecha: string | null;
  todoElDia?: boolean;
  horaInicio: string; // "12:00"
  horaFin: string; // "13:00"
}
