import { DatosEmpresa, DiaHorarioEnvio, PerfilEmpresa } from "../api";

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
  // true: los días abiertos comparten un solo horario (diasAbiertos, apertura, cierre).
  // false: cada día tiene el suyo (dias).
  mismoHorario: boolean;
  diasAbiertos: number[];
  apertura: string;
  cierre: string;
  dias: DiaFormulario[]; // los 7, 0 = domingo … 6 = sábado
};

const APERTURA = "08:00";
const CIERRE = "19:00";
const DE_LUNES_A_SABADO = [1, 2, 3, 4, 5, 6];

const diasIguales = (abiertos: number[], apertura: string, cierre: string): DiaFormulario[] =>
  Array.from({ length: 7 }, (_, dia) => ({ dia, abierto: abiertos.includes(dia), apertura, cierre }));

export const VALORES_VACIOS: ValoresEmpresa = {
  nombre: "",
  categoria: "",
  codigoAcceso: "",
  nombreAdministradora: "",
  numeroEmpleados: null,
  departamento: null,
  ciudad: null,
  direccion: "",
  mismoHorario: true,
  diasAbiertos: DE_LUNES_A_SABADO,
  apertura: APERTURA,
  cierre: CIERRE,
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
  const abiertos = dias.filter((d) => d.abierto);
  // Si todos los días abiertos tienen el mismo horario, se muestra la casilla marcada
  const mismoHorario = abiertos.every(
    (d) => d.apertura === abiertos[0]?.apertura && d.cierre === abiertos[0]?.cierre,
  );
  return {
    nombre: p.nombre,
    categoria: p.categoria,
    codigoAcceso: p.codigoAcceso,
    nombreAdministradora: p.nombreAdministradora,
    numeroEmpleados: p.numeroEmpleados,
    departamento: p.departamento,
    ciudad: p.departamento ? p.ciudad : null,
    direccion: p.direccion,
    mismoHorario,
    diasAbiertos: abiertos.map((d) => d.dia),
    apertura: abiertos[0]?.apertura ?? APERTURA,
    cierre: abiertos[0]?.cierre ?? CIERRE,
    dias,
  };
};

// Horario de los 7 días según el modo elegido
export const horarioDeValores = (v: ValoresEmpresa): DiaFormulario[] =>
  v.mismoHorario ? diasIguales(v.diasAbiertos, v.apertura, v.cierre) : v.dias;

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

const obligatorio = (campo: string) => `El campo "${campo}" es obligatorio`;

const revisarTexto = (valor: string, campo: string, max: number) => {
  if (!valor.trim()) return obligatorio(campo);
  if (valor.trim().length > max) return `El campo "${campo}" admite máximo ${max} caracteres`;
  return null;
};

const revisarHorario = (dias: DiaFormulario[]) => {
  const abiertos = dias.filter((d) => d.abierto);
  if (abiertos.length === 0) return "El negocio debe abrir al menos un día";
  // "HH:MM" se compara bien como texto
  const mal = abiertos.find((d) => d.cierre <= d.apertura);
  return mal
    ? `El ${DIAS_NOMBRE[mal.dia]}, la hora de cierre debe ser posterior a la de apertura`
    : null;
};

export type Resultado = { ok: true; datos: DatosEmpresa } | { ok: false; error: string };

export function validarEmpresa(v: ValoresEmpresa): Resultado {
  const dias = horarioDeValores(v);
  const error =
    revisarTexto(v.nombre, "nombre", 100) ??
    revisarTexto(v.categoria, "categoría", 60) ??
    revisarTexto(v.nombreAdministradora, "nombre de la administradora", 120) ??
    (!v.numeroEmpleados ? "Elige el número de empleados" : null) ??
    (!CODIGO.test(v.codigoAcceso)
      ? "El código del negocio solo puede tener letras (sin tildes ni ñ) y números, sin espacios, máximo 10 caracteres"
      : null) ??
    (!v.departamento ? "Elige el departamento" : null) ??
    (!v.ciudad ? "Elige el municipio" : null) ??
    revisarTexto(v.direccion, "dirección", 200) ??
    revisarHorario(dias);

  if (error) return { ok: false, error };

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

export const validarAcceso = (a: ValoresAcceso) => {
  const correo = a.correo.trim().toLowerCase();
  if (!correo) return obligatorio("correo");
  if (!CORREO.test(correo) || correo.length > 254) return "El correo no es válido";
  if (!USUARIO.test(a.usuario.trim()))
    return "El usuario debe tener entre 4 y 20 caracteres: solo letras, números, punto y guion bajo";
  if (a.clave.length < 8 || a.clave.length > 64)
    return "La contraseña debe tener entre 8 y 64 caracteres";
  if (a.clave !== a.confirmacion) return "Las contraseñas no coinciden";
  return null;
};

// Cuenta opcional de cliente: correo o usuario (al menos uno), mismas reglas que el backend
export type ValoresCliente = {
  nombre: string;
  telefono: string;
  correo: string;
  usuario: string;
  clave: string;
  confirmacion: string;
};

export const CLIENTE_VACIO: ValoresCliente = {
  nombre: "",
  telefono: "",
  correo: "",
  usuario: "",
  clave: "",
  confirmacion: "",
};

export const validarCliente = (c: ValoresCliente) => {
  const errorNombre = revisarTexto(c.nombre, "nombre", 100);
  if (errorNombre) return errorNombre;
  if (!c.telefono.trim()) return 'El campo "teléfono" es obligatorio';
  const correo = c.correo.trim().toLowerCase();
  const usuario = c.usuario.trim();
  if (!correo && !usuario) return "Escribe tu correo o un nombre de usuario para iniciar sesión";
  if (correo && (!CORREO.test(correo) || correo.length > 254)) return "El correo no es válido";
  if (usuario && !USUARIO.test(usuario))
    return "El usuario debe tener entre 4 y 20 caracteres: solo letras, números, punto y guion bajo";
  if (c.clave.length < 8 || c.clave.length > 64)
    return "La contraseña debe tener entre 8 y 64 caracteres";
  if (c.clave !== c.confirmacion) return "Las contraseñas no coinciden";
  return null;
};
