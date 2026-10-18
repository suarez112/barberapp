import { DatosEmpresa, PerfilEmpresa } from "../api";

// Lo que se escribe en el formulario (todo texto, salvo los días)
export type ValoresEmpresa = {
  nombre: string;
  categoria: string;
  nit: string;
  telefono: string;
  correo: string;
  direccion: string;
  ciudad: string;
  diasAtencion: number[];
  horarioApertura: string;
  horarioCierre: string;
  nombreAdministradora: string;
  numeroEmpleados: string;
  logoUrl: string;
};

export const VALORES_VACIOS: ValoresEmpresa = {
  nombre: "",
  categoria: "",
  nit: "",
  telefono: "",
  correo: "",
  direccion: "",
  ciudad: "",
  diasAtencion: [1, 2, 3, 4, 5, 6],
  horarioApertura: "08:00",
  horarioCierre: "19:00",
  nombreAdministradora: "",
  numeroEmpleados: "",
  logoUrl: "",
};

export const valoresDesdePerfil = (p: PerfilEmpresa): ValoresEmpresa => ({
  nombre: p.nombre,
  categoria: p.categoria,
  nit: p.nit ?? "",
  telefono: p.telefono,
  correo: p.correo,
  direccion: p.direccion,
  ciudad: p.ciudad,
  diasAtencion: p.diasAtencion,
  horarioApertura: p.horarioApertura,
  horarioCierre: p.horarioCierre,
  nombreAdministradora: p.nombreAdministradora,
  numeroEmpleados: String(p.numeroEmpleados),
  logoUrl: p.logoUrl ?? "",
});

// Mismas reglas y mensajes que el backend (empresas.esquemas.ts), para avisar
// antes de enviar. El backend vuelve a validar y su mensaje se muestra igual.
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPLEADOS = "El número de empleados debe ser un número entero mayor que cero";

const obligatorio = (campo: string) => `El campo "${campo}" es obligatorio`;

const revisarTexto = (valor: string, campo: string, max: number) => {
  if (!valor.trim()) return obligatorio(campo);
  if (valor.trim().length > max)
    return `El campo "${campo}" admite máximo ${max} caracteres`;
  return null;
};

export type Resultado =
  | { ok: true; datos: DatosEmpresa }
  | { ok: false; error: string };

export function validarEmpresa(v: ValoresEmpresa): Resultado {
  const telefono = v.telefono.trim();
  const nit = v.nit.trim();
  const logoUrl = v.logoUrl.trim();
  const correo = v.correo.trim().toLowerCase();
  const empleados = Number(v.numeroEmpleados.trim());

  const error =
    revisarTexto(v.nombre, "nombre", 100) ??
    revisarTexto(v.categoria, "categoría", 60) ??
    (nit.length > 20 ? "El NIT admite máximo 20 caracteres" : null) ??
    (!/^[0-9\s-]*$/.test(nit)
      ? "El NIT solo puede tener números, espacios y guiones"
      : null) ??
    revisarTexto(telefono, "teléfono", 20) ??
    (telefono.length < 7
      ? "El teléfono debe tener entre 7 y 20 caracteres"
      : null) ??
    (!/^\+?[0-9\s()-]+$/.test(telefono)
      ? "El teléfono solo puede tener números, espacios, paréntesis, guiones y +"
      : null) ??
    (!correo ? obligatorio("correo") : null) ??
    (!CORREO.test(correo) || correo.length > 254
      ? "El correo no es válido"
      : null) ??
    revisarTexto(v.direccion, "dirección", 200) ??
    revisarTexto(v.ciudad, "ciudad", 100) ??
    (v.diasAtencion.length === 0 ? "Elige al menos un día de atención" : null) ??
    (!HORA.test(v.horarioApertura)
      ? "La hora de apertura debe tener el formato HH:MM (24 horas)"
      : null) ??
    (!HORA.test(v.horarioCierre)
      ? "La hora de cierre debe tener el formato HH:MM (24 horas)"
      : null) ??
    // "HH:MM" se compara bien como texto
    (v.horarioCierre <= v.horarioApertura
      ? "La hora de cierre debe ser posterior a la hora de apertura"
      : null) ??
    revisarTexto(v.nombreAdministradora, "nombre de la administradora", 120) ??
    (!v.numeroEmpleados.trim() || !Number.isInteger(empleados) || empleados < 1
      ? EMPLEADOS
      : null) ??
    (empleados > 10_000
      ? "El número de empleados no puede ser mayor que 10000"
      : null) ??
    (logoUrl && !/^https?:\/\/\S+$/.test(logoUrl)
      ? "El logo debe ser una dirección web que empiece por http:// o https://"
      : null);

  if (error) return { ok: false, error };

  return {
    ok: true,
    datos: {
      nombre: v.nombre.trim(),
      categoria: v.categoria.trim(),
      nit: nit || null,
      telefono,
      correo,
      direccion: v.direccion.trim(),
      ciudad: v.ciudad.trim(),
      diasAtencion: [...v.diasAtencion].sort((a, b) => a - b),
      horarioApertura: v.horarioApertura,
      horarioCierre: v.horarioCierre,
      nombreAdministradora: v.nombreAdministradora.trim(),
      numeroEmpleados: empleados,
      logoUrl: logoUrl || null,
    },
  };
}

export const MENSAJE_CLAVE = "La contraseña debe tener entre 8 y 64 caracteres";

export const validarClave = (clave: string, confirmacion: string) => {
  if (clave.length < 8 || clave.length > 64) return MENSAJE_CLAVE;
  if (clave !== confirmacion) return "Las contraseñas no coinciden";
  return null;
};
