import { File, Paths } from "expo-file-system";
import { Platform } from "react-native";
import { DocumentoLegal, TipoDocumento } from "./api";

// Última versión descargada de cada documento, guardada en el celular para
// poder leerla sin conexión. En la web no hay archivos: no se guarda nada.
const archivo = (tipo: TipoDocumento) => new File(Paths.document, `legal-${tipo}.json`);

export async function leerDocumentoGuardado(tipo: TipoDocumento): Promise<DocumentoLegal | null> {
  if (Platform.OS === "web") return null;
  try {
    const f = archivo(tipo);
    if (!f.exists) return null;
    const doc = JSON.parse(await f.text()) as DocumentoLegal;
    return typeof doc?.contenido === "string" ? doc : null;
  } catch {
    return null;
  }
}

export function guardarDocumento(tipo: TipoDocumento, doc: DocumentoLegal) {
  if (Platform.OS === "web") return;
  try {
    archivo(tipo).write(JSON.stringify(doc));
  } catch (e) {
    // Sin copia guardada el documento se sigue mostrando: solo se registra
    console.log("No se pudo guardar el documento legal", String(e));
  }
}
