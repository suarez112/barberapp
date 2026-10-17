const FORMATO_PESOS = new Intl.NumberFormat("es-CO");

// 25000 -> "25.000" (sin el signo; la vista decide si antepone "$")
export const formatearPesos = (valor: number) => FORMATO_PESOS.format(valor);

// "Ana" -> "ana" sin espacios extremos, para comparar textos que escriben personas
export const normalizar = (texto: string) => texto.trim().toLowerCase();
