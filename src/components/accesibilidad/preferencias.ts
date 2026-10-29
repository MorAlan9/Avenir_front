// Preferencias de accesibilidad del usuario: se guardan en el dispositivo (localStorage) y se aplican como
// clases en <html> (ver src/styles/accesibilidad.css). Todo lo de localStorage va protegido: puede estar bloqueado.

const CLAVE = "avenir_a11y_v1";

export interface Preferencias {
    texto: 0 | 1 | 2 | 3 | 4;       // 100 %, 115 %, 130 %, 150 %, 175 %
    contraste: boolean;              // alto contraste
    fuenteLegible: boolean;          // tipografía y espaciado para dislexia / baja visión
    espaciado: boolean;              // interlineado amplio
    sinAnimaciones: boolean;         // reduce movimiento
    focoFuerte: boolean;             // foco y enlaces más marcados
}

export const ZOOMS = [1, 1.15, 1.3, 1.5, 1.75];
export const POR_DEFECTO: Preferencias = { texto: 0, contraste: false, fuenteLegible: false, espaciado: false, sinAnimaciones: false, focoFuerte: false };

export function leer(): Preferencias {
    try {
        const crudo = localStorage.getItem(CLAVE);
        if (!crudo) return { ...POR_DEFECTO };
        const p = JSON.parse(crudo);
        return { ...POR_DEFECTO, ...p, texto: Math.min(4, Math.max(0, Number(p.texto) || 0)) as Preferencias["texto"] };
    } catch {
        return { ...POR_DEFECTO };
    }
}

export function guardar(p: Preferencias) {
    try { localStorage.setItem(CLAVE, JSON.stringify(p)); } catch { /* sin almacenamiento: se aplica igual en esta sesión */ }
}

export function aplicar(p: Preferencias) {
    const h = document.documentElement;
    h.style.setProperty("--av-zoom", String(ZOOMS[p.texto]));
    h.classList.toggle("av-contraste", p.contraste);
    h.classList.toggle("av-fuente-legible", p.fuenteLegible);
    h.classList.toggle("av-espaciado", p.espaciado);
    h.classList.toggle("av-sin-anim", p.sinAnimaciones);
    h.classList.toggle("av-foco-fuerte", p.focoFuerte);
}
