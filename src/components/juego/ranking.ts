import type { Resultado } from "./datos";

// El ranking vive en el dispositivo del stand (localStorage) y se avisa en vivo a otras
// pestañas/ventanas del mismo navegador (la pantalla grande del ranking) por BroadcastChannel
// y por el evento "storage". No usa servidor: anda sin Internet.

const CLAVE = "avenir_juego_ranking_v1";
const CANAL = "avenir-juego";
const MAXIMO = 100;

export function leerRanking(): Resultado[] {
    try {
        const crudo = localStorage.getItem(CLAVE);
        const lista = crudo ? JSON.parse(crudo) : [];
        return Array.isArray(lista) ? lista : [];
    } catch {
        return [];
    }
}

export function ordenar(lista: Resultado[]): Resultado[] {
    return [...lista].sort((a, b) =>
        b.puntos - a.puntos || b.encontrados - a.encontrados || b.segundosRestantes - a.segundosRestantes || a.fecha.localeCompare(b.fecha));
}

export function guardarResultado(r: Resultado) {
    const lista = ordenar([...leerRanking(), r]).slice(0, MAXIMO);
    try { localStorage.setItem(CLAVE, JSON.stringify(lista)); } catch { /* sin espacio: se sigue sin guardar */ }
    try { new BroadcastChannel(CANAL).postMessage("cambio"); } catch { /* navegador sin BroadcastChannel */ }
}

export function reiniciarRanking() {
    try { localStorage.removeItem(CLAVE); } catch { /* nada */ }
    try { new BroadcastChannel(CANAL).postMessage("cambio"); } catch { /* nada */ }
}

/** Avisa cada vez que el ranking cambia (en cualquier ventana). Devuelve la función para dejar de escuchar. */
export function suscribirRanking(alCambiar: () => void): () => void {
    let canal: BroadcastChannel | null = null;
    try { canal = new BroadcastChannel(CANAL); canal.onmessage = () => alCambiar(); } catch { /* nada */ }
    const alStorage = (e: StorageEvent) => { if (e.key === CLAVE || e.key === null) alCambiar(); };
    window.addEventListener("storage", alStorage);
    const intervalo = window.setInterval(alCambiar, 3000);
    return () => { canal?.close(); window.removeEventListener("storage", alStorage); window.clearInterval(intervalo); };
}
