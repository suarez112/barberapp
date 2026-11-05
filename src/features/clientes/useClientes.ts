import { useCallback, useEffect, useRef, useState } from "react";
import { useSenalDeSalida } from "@/hooks/useSenalDeSalida";
import { esCancelada } from "@/services/api/http";
import { avisar } from "@/utils/dialogos";
import { useAvisarError } from "../sesion/useAvisarError";
import {
  agregarAListaNegra,
  Bloqueado,
  Cliente,
  listarBloqueados,
  listarClientesPagina,
  quitarDeListaNegra,
} from "./api";

// Clientes por página: pocos al inicio y "Ver más" pide los siguientes
const POR_PAGINA = 20;
// Máximo que acepta el backend en una sola página
const LIMITE_MAXIMO = 50;
// Espera tras la última tecla antes de buscar en el servidor
const ESPERA_BUSQUEDA_MS = 350;

// Clientes del negocio, por páginas y con búsqueda en el servidor, y la lista de bloqueados
export function useClientes(token: string) {
  const avisarError = useAvisarError();
  const senal = useSenalDeSalida();
  const [busqueda, setBusqueda] = useState("");
  // Texto que de verdad se busca (la búsqueda, sin espacios sobrantes y con espera)
  const [q, setQ] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [siguienteCursor, setSiguienteCursor] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bloqueados, setBloqueados] = useState<Bloqueado[]>([]);
  // Cada carga de la primera página anula las anteriores (ej. al seguir escribiendo)
  const controlPrimera = useRef<AbortController | null>(null);
  // Sube con cada primera página: una página de "Ver más" de una búsqueda anterior se descarta
  const generacion = useRef(0);
  const cantidadCargada = useRef(0);
  useEffect(() => {
    cantidadCargada.current = clientes.length;
  }, [clientes.length]);

  useEffect(() => {
    const nuevo = busqueda.trim();
    if (nuevo === q) return;
    const t = setTimeout(() => {
      setCargando(true);
      setError(null);
      setQ(nuevo);
    }, ESPERA_BUSQUEDA_MS);
    return () => clearTimeout(t);
  }, [busqueda, q]);

  // Primera página de la búsqueda actual. limite > POR_PAGINA al refrescar, para no perder lo ya cargado
  const cargarPrimera = useCallback(
    (limite: number = POR_PAGINA) => {
      controlPrimera.current?.abort();
      generacion.current += 1;
      const control = new AbortController();
      controlPrimera.current = control;
      // También se corta al salir de la pantalla
      senal()?.addEventListener("abort", () => control.abort(), { once: true });
      return listarClientesPagina(
        token,
        { limite, q: q || undefined },
        control.signal,
      ).then((pagina) => {
        setClientes(pagina.datos);
        setSiguienteCursor(pagina.siguienteCursor);
        setError(null);
        setCargando(false);
      });
    },
    [token, q, senal],
  );

  // Sin cambiar "cargando": lo marca quien la llama (la búsqueda o el botón Reintentar)
  const cargar = useCallback(
    () =>
      cargarPrimera().catch((e) => {
        // Una búsqueda más nueva la reemplazó, o se salió de la pestaña
        if (esCancelada(e)) return;
        setCargando(false);
        setError("No se pudieron cargar los clientes.");
        avisarError(e, { titulo: "No se pudieron cargar los clientes" });
      }),
    // avisarError cambia en cada render; basta cargarPrimera
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cargarPrimera],
  );

  const recargar = () => {
    setCargando(true);
    setError(null);
    return cargar();
  };

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cargarBloqueados = useCallback(
    () => listarBloqueados(token, senal()).then(setBloqueados),
    [token, senal],
  );

  useEffect(() => {
    cargarBloqueados().catch((e) => {
      if (esCancelada(e)) return;
      avisarError(e, { titulo: "No se pudieron cargar los bloqueados" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargarBloqueados]);

  const verMas = async () => {
    if (!siguienteCursor || cargandoMas) return;
    setCargandoMas(true);
    const deEstaBusqueda = generacion.current;
    try {
      const pagina = await listarClientesPagina(
        token,
        { limite: POR_PAGINA, cursor: siguienteCursor, q: q || undefined },
        senal(),
      );
      if (deEstaBusqueda !== generacion.current) return;
      // Sin repetidos por si la lista se refrescó mientras tanto
      setClientes((actuales) => {
        const ids = new Set(actuales.map((c) => c.id));
        return [...actuales, ...pagina.datos.filter((c) => !ids.has(c.id))];
      });
      setSiguienteCursor(pagina.siguienteCursor);
    } catch (e) {
      if (!esCancelada(e))
        avisarError(e, { titulo: "No se pudieron cargar más clientes" });
    } finally {
      setCargandoMas(false);
    }
  };

  // Actualización silenciosa (sin cargando ni avisos) que conserva lo ya cargado; el que la llama decide qué hacer con un error
  const refrescar = useCallback(
    () =>
      Promise.all([
        cargarPrimera(
          Math.min(
            Math.max(cantidadCargada.current, POR_PAGINA),
            LIMITE_MAXIMO,
          ),
        ),
        cargarBloqueados(),
      ]).then(() => undefined),
    [cargarPrimera, cargarBloqueados],
  );

  const bloquear = async (cliente: Cliente) => {
    try {
      const registro = await agregarAListaNegra(token, cliente.id);
      avisar(
        "Cliente bloqueado",
        `${cliente.nombre} ya no podrá agendar.`,
        "exito",
      );
      // Se marca en la lista sin perder las páginas ya cargadas
      setClientes((cs) =>
        cs.map((c) =>
          c.id === cliente.id
            ? { ...c, enListaNegra: true, listaNegraId: registro.id }
            : c,
        ),
      );
      await cargarBloqueados().catch(() => {});
      return true;
    } catch (e) {
      avisarError(e, { titulo: "No se pudo bloquear" });
      return false;
    }
  };

  // id = id del registro en la lista negra
  const desbloquear = async (id: string, nombre: string) => {
    try {
      await quitarDeListaNegra(token, id);
      avisar("Desbloqueado", `${nombre} ya puede agendar citas.`, "exito");
      setClientes((cs) =>
        cs.map((c) =>
          c.listaNegraId === id
            ? { ...c, enListaNegra: false, listaNegraId: null }
            : c,
        ),
      );
      setBloqueados((bs) => bs.filter((b) => b.id !== id));
    } catch (e) {
      avisarError(e, { titulo: "No se pudo desbloquear" });
    }
  };

  return {
    busqueda,
    setBusqueda,
    // Hay texto escrito (aunque todavía no se haya buscado)
    buscando: busqueda.trim() !== "",
    clientes,
    hayMas: siguienteCursor !== null,
    verMas,
    cargandoMas,
    cargando,
    error,
    recargar,
    refrescar,
    bloqueados,
    bloquear,
    desbloquear,
  };
}

export type EstadoClientes = ReturnType<typeof useClientes>;
