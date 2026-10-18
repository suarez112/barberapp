const FORMATO_PESOS = new Intl.NumberFormat("es-CO");

// 25000 -> "25.000" (sin el signo; la vista decide si antepone "$")
export const formatearPesos = (valor: number) => FORMATO_PESOS.format(valor);

// "Ana" -> "ana" sin espacios extremos, para comparar textos que escriben personas
export const normalizar = (texto: string) => texto.trim().toLowerCase();

const NOMBRES_DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// [1, 2, 3, 4, 5, 6] (0 = domingo) -> "Lun, Mar, Mié, Jue, Vie, Sáb"
export const textoDiasAtencion = (dias: number[]) =>
  [...dias]
    // De lunes a domingo
    .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
    .map((d) => NOMBRES_DIAS[d])
    .join(", ") || "—";
