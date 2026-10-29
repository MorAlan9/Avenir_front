import { API_BASE_URL } from "../../service/api";
import type { Resultado } from "./datos";

// Demo pública (QR): registra a cada visitante, manda sus interacciones y su partida al servidor, y lee el ranking
// online y la actividad en vivo. Todo es "sin cuenta": el navegador genera un identificador al azar. Si el servidor
// no responde (Internet, o Render despertando) NADA se rompe: el juego sigue y el ranking cae al del dispositivo.

const CLAVE_SID = "avenir_juego_sid_v1";
const BASE = `${API_BASE_URL}/public/juego`;

export const MODULO_TITULOS: Record<string, string> = {
    panel: "Panel de control", empresas: "Empresas", relevamientos: "Relevamientos", iper: "Historial IPER",
    insumos: "Insumos y EPP", estadisticas: "Estadísticas", roles: "Roles y permisos",
};

export type TipoEvento = "MODULO" | "MAPA" | "JUEGO_INICIO" | "HALLAZGO" | "FALSA_ALARMA" | "PISTA" | "JUEGO_FIN";

export interface EventoVivo { id: number; nombre: string; tipo: TipoEvento; detalle: string; fecha: string }
export interface ActividadVivo { eventos: EventoVivo[]; ultimoId: number; enLinea: number; modulos: Record<string, number> }
export interface RankingRemoto { ranking: Resultado[]; partidas: number; visitantes: number }

export function sid(): string {
    try {
        let v = localStorage.getItem(CLAVE_SID);
        if (!v || !/^[A-Za-z0-9_-]{8,40}$/.test(v)) {
            v = "v" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
            localStorage.setItem(CLAVE_SID, v);
        }
        return v;
    } catch {
        return "anon" + Math.random().toString(36).slice(2, 12);
    }
}

async function pedir<T>(ruta: string, opciones: RequestInit = {}, ms = 12000): Promise<T | null> {
    const control = new AbortController();
    const t = window.setTimeout(() => control.abort(), ms);
    try {
        const r = await fetch(`${BASE}${ruta}`, { ...opciones, signal: control.signal, headers: { "Content-Type": "application/json" } });
        return r.ok ? ((await r.json()) as T) : null;
    } catch {
        return null;
    } finally {
        window.clearTimeout(t);
    }
}

const enviar = (ruta: string, cuerpo: unknown, ms?: number) => pedir<{ ok: boolean }>(ruta, { method: "POST", body: JSON.stringify(cuerpo), keepalive: true }, ms);

export function registrarVisita(nombre?: string, empresa?: string) {
    void enviar("/visita", { sid: sid(), nombre, empresa });
}

export function evento(tipo: TipoEvento, detalle = "", nombre?: string) {
    void enviar("/evento", { sid: sid(), tipo, detalle, nombre });
}

/** Devuelve true si el servidor guardó la partida (si no, queda pendiente en el dispositivo y se reintenta). */
export async function enviarPartida(r: Resultado): Promise<boolean> {
    const rta = await enviar("/partida", {
        sid: sid(), nombre: r.nombre, empresa: r.empresa, puntos: r.puntos, encontrados: r.encontrados, exactos: r.exactos,
        falsasAlarmas: r.falsasAlarmas, segundosRestantes: r.segundosRestantes,
    }, 60000);
    return !!rta?.ok;
}

export const pedirRanking = (limite = 30) => pedir<RankingRemoto>(`/ranking?limite=${limite}`);
export const pedirActividad = (desde: number) => pedir<ActividadVivo>(`/actividad?desde=${desde}`);

/** Frase corta de lo que hizo alguien, para la pantalla en vivo. */
export function frase(e: EventoVivo): string {
    switch (e.tipo) {
        case "MODULO": return `abrió ${MODULO_TITULOS[e.detalle] ?? e.detalle}`;
        case "MAPA": return "usó el mapa de empresas";
        case "JUEGO_INICIO": return "empezó a jugar a Inspector Avenir";
        case "HALLAZGO": return `encontró un riesgo: ${e.detalle}`;
        case "FALSA_ALARMA": return "dio una falsa alarma";
        case "PISTA": return "pidió una pista";
        case "JUEGO_FIN": return `terminó la partida (${e.detalle})`;
        default: return "hizo algo";
    }
}
