import { DatosEmpresa, DiaHorarioEnvio, PerfilEmpresa } from "../api";
import { claveValida, MENSAJE_CLAVE } from "@/utils/clave";

// Horario de un día en el formulario
export type DiaFormulario = { dia: number; abierto: boolean; apertura: string; cierre: string };

// Lo que se escribe en el formulario del negocio (registro y "Mi negocio")
export type ValoresEmpresa = {
  nombre: string;
  categoria: string;
  codigoAcceso: string;
  nombreAdministradora: string;
  numeroEmpleados: number | null;
  departamento: string | null;
  ciudad: string | null;
  direccion: string;
  dias: DiaFormulario[]; // los 7, 0 = domingo … 6 = sábado
};

const APERTURA = "08:00";
const CIERRE = "19:00";
const DE_LUNES_A_SABADO = [1, 2, 3, 4, 5, 6];

const diasIguales = (abiertos: number[], apertura: string, cierre: string): DiaFormulario[] =>
  Array.from({ length: 7 }, (_, dia) => ({ dia, abierto: abiertos.includes(dia), apertura, cierre }));

// Pone el horario del lunes (abierto o cerrado, apertura y cierre) en los 7 días
export const copiarLunes = (dias: DiaFormulario[]): DiaFormulario[] => {
  const lunes = dias.find((d) => d.dia === 1);
  return lunes ? dias.map((d) => ({ ...lunes, dia: d.dia })) : dias;
};

export const VALORES_VACIOS: ValoresEmpresa = {
  nombre: "",
  categoria: "",
  codigoAcceso: "",
  nombreAdministradora: "",
  numeroEmpleados: null,
  departamento: null,
  ciudad: null,
  direccion: "",
  dias: diasIguales(DE_LUNES_A_SABADO, APERTURA, CIERRE),
};

export const valoresDesdePerfil = (p: PerfilEmpresa): ValoresEmpresa => {
  const dias = Array.from({ length: 7 }, (_, dia) => {
    const h = p.horario.find((x) => x.dia === dia);
    return {
      dia,
      abierto: !!h?.abierto,
      apertura: h?.apertura ?? APERTURA,
      cierre: h?.cierre ?? CIERRE,
    };
  });
  return {
    nombre: p.nombre,
    categoria: p.categoria,
    codigoAcceso: p.codigoAcceso,
    nombreAdministradora: p.nombreAdministradora,
    numeroEmpleados: p.numeroEmpleados,
    departamento: p.departamento,
    ciudad: p.departamento ? p.ciudad : null,
    direccion: p.direccion,
    dias,
  };
};

// Código del negocio: solo letras sin tildes y números, máximo 10, en mayúsculas.
// "central 10" -> "CENTRAL10", "Peña" -> "PEA"
export const limpiarCodigo = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);

const DIAS_NOMBRE = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

// Mismas reglas y mensajes que el backend (empresas.esquemas.ts), para avisar
// antes de enviar. El backend vuelve a validar y su mensaje se muestra igual.
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USUARIO = /^[A-Za-z0-9._]{4,20}$/;
const CODIGO = /^[A-Z0-9]{1,10}$/;

// Errores por campo: cada mensaje dice qué corregir y se muestra debajo del campo
export type Errores<K extends string> = Partial<Record<K, string>>;

// Quita los errores de los campos que la persona acaba de cambiar
export const sinErrores = <K extends string>(errores: Errores<K>, claves: string[]): Errores<K> => {
  if (!claves.some((k) => k in errores)) return errores;
  const copia = { ...errores };
  for (const k of claves) delete copia[k as K];
  return copia;
};

export const hayErrores = (errores: Errores<string>) => Object.keys(errores).length > 0;

// Campos con error que se limpian al cambiar estos valores (el horario es un solo error)
export const camposCambiados = (cambios: Partial<ValoresEmpresa>) =>
  Object.keys(cambios).map((k) => (k === "dias" ? "horario" : k));

const revisarTexto = (valor: string, queEscribir: string, max: number) => {
  if (!valor.trim()) return `Escribe ${queEscribir}.`;
  if (valor.trim().length > max) return `Acorta el texto: máximo ${max} caracteres.`;
  return null;
};

const revisarHorario = (dias: DiaFormulario[]) => {
  const abiertos = dias.filter((d) => d.abierto);
  if (abiertos.length === 0) return "Elige al menos un día en que abre el negocio.";
  // "HH:MM" se compara bien como texto
  const mal = abiertos.find((d) => d.cierre <= d.apertura);
  return mal
    ? `El ${DIAS_NOMBRE[mal.dia]} la hora de cierre debe ser después de la de apertura: cambia una de las dos.`
    : null;
};

export type CampoEmpresa =
  | "nombre"
  | "categoria"
  | "nombreAdministradora"
  | "numeroEmpleados"
  | "codigoAcceso"
  | "departamento"
  | "ciudad"
  | "direccion"
  | "horario";

export type Resultado =
  | { ok: true; datos: DatosEmpresa }
  | { ok: false; errores: Errores<CampoEmpresa> };

// Sin valores nulos: solo los campos con error
const limpiarErrores = <K extends string>(errores: Record<K, string | null>): Errores<K> =>
  Object.fromEntries(Object.entries(errores).filter(([, v]) => v)) as Errores<K>;

export function validarEmpresa(v: ValoresEmpresa): Resultado {
  const dias = v.dias;
  const errores = limpiarErrores<CampoEmpresa>({
    nombre: revisarTexto(v.nombre, "el nombre del negocio", 100),
    categoria: revisarTexto(v.categoria, "la categoría, por ejemplo Barbería", 60),
    nombreAdministradora: revisarTexto(v.nombreAdministradora, "el nombre de quien administra", 120),
    numeroEmpleados: !v.numeroEmpleados ? "Elige cuántas personas trabajan en el negocio." : null,
    codigoAcceso: !v.codigoAcceso
      ? "Escribe un código para tu negocio, por ejemplo CENTRAL10."
      : !CODIGO.test(v.codigoAcceso)
        ? "Usa solo letras sin tildes ni ñ y números, sin espacios, máximo 10."
        : null,
    departamento: !v.departamento ? "Elige el departamento del negocio." : null,
    ciudad: !v.ciudad ? "Elige el municipio del negocio." : null,
    direccion: revisarTexto(v.direccion, "la dirección del negocio", 200),
    horario: revisarHorario(dias),
  });

  if (hayErrores(errores)) return { ok: false, errores };

  const horario: DiaHorarioEnvio[] = dias.map((d) =>
    d.abierto
      ? { dia: d.dia, abierto: true, apertura: d.apertura, cierre: d.cierre }
      : { dia: d.dia, abierto: false },
  );

  return {
    ok: true,
    datos: {
      nombre: v.nombre.trim(),
      categoria: v.categoria.trim(),
      codigoAcceso: v.codigoAcceso,
      direccion: v.direccion.trim(),
      departamento: v.departamento ?? "",
      ciudad: v.ciudad ?? "",
      horario,
      nombreAdministradora: v.nombreAdministradora.trim(),
      numeroEmpleados: v.numeroEmpleados ?? 1,
    },
  };
}

// Acceso de la administradora (solo en el registro)
export type ValoresAcceso = { correo: string; usuario: string; clave: string; confirmacion: string };

export const ACCESO_VACIO: ValoresAcceso = { correo: "", usuario: "", clave: "", confirmacion: "" };

const ERROR_CORREO = "Escribe un correo válido, por ejemplo nombre@gmail.com.";
const ERROR_USUARIO = "Usa de 4 a 20 caracteres: solo letras, números, punto o guion bajo, sin espacios.";
const ERROR_CONFIRMACION = "Las contraseñas no coinciden: escríbela igual en los dos campos.";

const revisarCorreo = (correo: string) =>
  !CORREO.test(correo) || correo.length > 254 ? ERROR_CORREO : null;

export const validarAcceso = (a: ValoresAcceso): Errores<keyof ValoresAcceso> => {
  const correo = a.correo.trim().toLowerCase();
  return limpiarErrores<keyof ValoresAcceso>({
    correo: !correo ? "Escribe tu correo." : revisarCorreo(correo),
    usuario: !a.usuario.trim()
      ? "Escribe un nombre de usuario."
      : !USUARIO.test(a.usuario.trim())
        ? ERROR_USUARIO
        : null,
    clave: claveValida(a.clave) ? null : MENSAJE_CLAVE,
    confirmacion: a.clave !== a.confirmacion ? ERROR_CONFIRMACION : null,
  });
};

// Cuenta opcional de cliente: correo o usuario (al menos uno), mismas reglas que el backend.
// El teléfono lo valida su propio campo (useTelefono).
export type ValoresCliente = {
  nombre: string;
  correo: string;
  usuario: string;
  clave: string;
  confirmacion: string;
};

export const CLIENTE_VACIO: ValoresCliente = {
  nombre: "",
  correo: "",
  usuario: "",
  clave: "",
  confirmacion: "",
};

export const validarCliente = (c: ValoresCliente): Errores<keyof ValoresCliente> => {
  const correo = c.correo.trim().toLowerCase();
  const usuario = c.usuario.trim();
  const sinAcceso = !correo && !usuario;
  return limpiarErrores<keyof ValoresCliente>({
    nombre: revisarTexto(c.nombre, "tu nombre completo", 100),
    correo: sinAcceso
      ? "Escribe tu correo o un nombre de usuario para poder iniciar sesión."
      : correo
        ? revisarCorreo(correo)
        : null,
    usuario: usuario && !USUARIO.test(usuario) ? ERROR_USUARIO : null,
    clave: claveValida(c.clave) ? null : MENSAJE_CLAVE,
    confirmacion: c.clave !== c.confirmacion ? ERROR_CONFIRMACION : null,
  });
};
