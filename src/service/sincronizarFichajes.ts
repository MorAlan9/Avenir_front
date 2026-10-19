import api from "./api";
import { obtenerPendientes, quitarPendiente } from "./offlineQueue";

let enCurso: Promise<void> | null = null;

/**
 * Envía en orden los fichajes guardados sin conexión de la persona que tiene la sesión abierta.
 * Hay un solo envío a la vez: si ya hay uno andando (por ejemplo, lo disparó el aviso de
 * "volvió la señal" mientras se abría Ingreso y Egreso), todos esperan al mismo y no se
 * manda ningún fichaje dos veces. Si un envío falla (sin señal o rechazado), corta y deja el
 * resto en la cola para el próximo intento. Nunca lanza error.
 */
export function sincronizarFichajesPendientes(): Promise<void> {
    if (enCurso) return enCurso;

    enCurso = (async () => {
        for (const item of obtenerPendientes()) {
            try {
                const endpoint = item.tipo === "ingreso" ? "/asistencia/ingreso" : "/asistencia/egreso";
                await api.post(endpoint, item.payload);
                quitarPendiente(item.id);
            } catch (err: any) {
                // 400 = el servidor lo rechazó por una regla de negocio (por ejemplo, "ya tenés un
                // ingreso abierto"): reintentar nunca va a funcionar y trabaría a los que siguen.
                // Cualquier otro error (sin señal, sesión vencida, servidor caído) se reintenta después.
                if (err?.response?.status === 400) {
                    console.warn("Fichaje sin conexión rechazado por el servidor; se descarta:", item.tipo, err.response?.data);
                    quitarPendiente(item.id);
                    continue;
                }
                break;
            }
        }
    })().finally(() => { enCurso = null; });

    return enCurso;
}
