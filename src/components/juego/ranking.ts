import type { Resultado } from "./datos";
import { enviarPartida, pedirRanking } from "./telemetria";

// Ranking ONLINE: el servidor guarda las partidas de todos los que entran por el QR. Este módulo mantiene una copia
// en el dispositivo (para mostrar algo al instante y si no hay Internet) y una lista de partidas PENDIENTES que se
// reintentan solas hasta que el servidor las recibe. Se avisa en vivo a otras ventanas del mismo navegador por
// BroadcastChannel/"storage" y se consulta al servidor cada 3 s.

const CLAVE = "avenir_juego_ranking_v1";       // copia de lo que dijo el servidor
const CLAVE_PEND = "avenir_juego_pendientes_v1"; // partidas que todavía no llegaron al servidor
const CANAL = "avenir-juego";
const MAXIMO = 100;

const leer = (clave: string): Resultado[] => {
    try {
        const crudo = localStorage.getItem(clave);
        const lista = crudo ? JSON.parse(crudo) : [];
        return Array.isArray(lista) ? lista : [];
    } catch {
        return [];
    }
};
const escribir = (clave: string, lista: Resultado[]) => {
    try { localStorage.setItem(clave, JSON.stringify(lista)); } catch { /* sin espacio: se sigue sin guardar */ }
};
const avisar = () => { try { new BroadcastChannel(CANAL).postMessage("cambio"); } catch { /* navegador sin BroadcastChannel */ } };

/** Ranking a mostrar: lo del servidor más las partidas pendientes de este dispositivo. */
export function leerRanking(): Resultado[] {
    return ordenar([...leer(CLAVE), ...leer(CLAVE_PEND)]).slice(0, MAXIMO);
}

export function ordenar(lista: Resultado[]): Resultado[] {
    return [...lista].sort((a, b) =>
        b.puntos - a.puntos || b.encontrados - a.encontrados || b.segundosRestantes - a.segundosRestantes || a.fecha.localeCompare(b.fecha));
}

let enviando = false;
async function enviarPendientes() {
    if (enviando) return;
    enviando = true;
    try {
        for (const r of leer(CLAVE_PEND)) {
            if (await enviarPartida(r)) escribir(CLAVE_PEND, leer(CLAVE_PEND).filter((x) => x.id !== r.id));
            else break; // sin conexión: se reintenta en la próxima vuelta
        }
    } finally { enviando = false; }
}

export function guardarResultado(r: Resultado) {
    escribir(CLAVE_PEND, [...leer(CLAVE_PEND), r]);
    avisar();
    void enviarPendientes().then(sincronizarRanking);
}

/** Baja el ranking del servidor y lo deja en la copia local. Devuelve false si no hubo respuesta. */
export async function sincronizarRanking(): Promise<boolean> {
    await enviarPendientes();
    const rta = await pedirRanking(MAXIMO);
    if (!rta || !Array.isArray(rta.ranking)) return false;
    escribir(CLAVE, rta.ranking);
    return true;
}

export function reiniciarRanking() {
    try { localStorage.removeItem(CLAVE); localStorage.removeItem(CLAVE_PEND); } catch { /* nada */ }
    avisar();
}

/** Avisa cada vez que el ranking cambia (en cualquier ventana o en el servidor). Devuelve la función para dejar de escuchar. */
export function suscribirRanking(alCambiar: () => void): () => void {
    let canal: BroadcastChannel | null = null;
    try { canal = new BroadcastChannel(CANAL); canal.onmessage = () => alCambiar(); } catch { /* nada */ }
    const alStorage = (e: StorageEvent) => { if (e.key === CLAVE || e.key === CLAVE_PEND || e.key === null) alCambiar(); };
    window.addEventListener("storage", alStorage);
    let vivo = true;
    const vuelta = () => { void sincronizarRanking().finally(() => { if (vivo) alCambiar(); }); };
    vuelta();
    const intervalo = window.setInterval(vuelta, 3000);
    return () => { vivo = false; canal?.close(); window.removeEventListener("storage", alStorage); window.clearInterval(intervalo); };
}
