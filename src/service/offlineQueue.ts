
export interface FichajePendiente {
    id: string;
    tipo: "ingreso" | "egreso";
    payload: Record<string, unknown>;
    creadoEn: string;
}

const CLAVE = "avenir_fichajes_pendientes";

// La cola es del DISPOSITIVO, no de la sesión: sobrevive a "Salir" y al login (ver
// limpiarSesionConservandoPendientes) para no perder fichajes hechos sin conexión.
// El backend registra cada fichaje a nombre de quien tiene la sesión abierta, así que
// cada persona solo ve y envía los suyos (se identifican por payload.emailUsuario).
function leerTodos(): FichajePendiente[] {
    try {
        const raw = localStorage.getItem(CLAVE);
        const lista = raw ? JSON.parse(raw) : [];
        return Array.isArray(lista) ? lista : [];
    } catch {
        return [];
    }
}

function esDeLaSesionActual(item: FichajePendiente): boolean {
    const emailSesion = (localStorage.getItem("email") || "").trim().toLowerCase();
    const emailItem = String(item.payload?.emailUsuario ?? "").trim().toLowerCase();
    return emailSesion !== "" && emailSesion === emailItem;
}

/** Fichajes pendientes de envío de la persona que tiene la sesión abierta. */
export function obtenerPendientes(): FichajePendiente[] {
    return leerTodos().filter(esDeLaSesionActual);
}

function guardar(lista: FichajePendiente[]) {
    localStorage.setItem(CLAVE, JSON.stringify(lista));
}

/**
 * Reemplaza a `localStorage.clear()` al cerrar sesión o iniciar una nueva: limpia todo
 * (token, rol, tema, etc.) pero conserva la cola de fichajes sin enviar.
 */
export function limpiarSesionConservandoPendientes() {
    let cola: string | null = null;
    try { cola = localStorage.getItem(CLAVE); } catch { /* sin acceso: no hay nada que conservar */ }
    localStorage.clear();
    if (cola) {
        try { localStorage.setItem(CLAVE, cola); } catch { /* cuota o modo privado: no es critico */ }
    }
}

export function encolarFichaje(tipo: "ingreso" | "egreso", payload: Record<string, unknown>): FichajePendiente {
    const item: FichajePendiente = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        tipo,
        payload,
        creadoEn: new Date().toISOString()
    };
    const lista = leerTodos();
    lista.push(item);
    guardar(lista);
    return item;
}

export function quitarPendiente(id: string) {
    guardar(leerTodos().filter((p) => p.id !== id));
}

export function contarPendientes(): number {
    return obtenerPendientes().length;
}

export function esErrorDeRed(err: any): boolean {
    return !!err?.request && !err?.response;
}

export function formatearFechaLocalISO(fecha: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}:${pad(fecha.getSeconds())}`;
}
