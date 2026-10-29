// Pone nombre accesible a lo que no lo tiene (botones de solo ícono, campos sin <label>), para que un lector de
// pantalla (NVDA, JAWS, TalkBack, VoiceOver) diga "Eliminar" o "Fecha" en vez de "botón" o "campo de edición".
// Se corre sobre toda la página y se repite cuando cambia el DOM. No pisa nada que ya tenga nombre.

const ICONOS: Record<string, string> = {
    menu: "Abrir o cerrar el menú", x: "Cerrar", trash: "Eliminar", "trash-2": "Eliminar", pencil: "Editar", "square-pen": "Editar",
    search: "Buscar", eye: "Mostrar contraseña", "eye-off": "Ocultar contraseña", plus: "Agregar", minus: "Quitar",
    "chevron-left": "Anterior", "chevron-right": "Siguiente", "chevron-down": "Desplegar", "chevron-up": "Contraer",
    "arrow-left": "Volver", "arrow-right": "Siguiente", "map-pin": "Ver en el mapa", map: "Ver en el mapa",
    download: "Descargar", "refresh-cw": "Actualizar", "rotate-cw": "Actualizar", check: "Confirmar", save: "Guardar",
    "locate-fixed": "Usar mi ubicación", "message-circle": "Mensaje", "life-buoy": "Ayuda", "circle-help": "Ayuda",
    "circle-question-mark": "Ayuda", "log-out": "Cerrar sesión", sun: "Cambiar a tema claro", moon: "Cambiar a tema oscuro",
    "external-link": "Abrir en otra pestaña", upload: "Subir archivo", camera: "Cámara", history: "Ver historial",
    clock: "Hora", calendar: "Calendario", "file-text": "Documento", "circle-x": "Cerrar", "circle-check": "Confirmar",
};

const norm = (t: string | null | undefined) => (t ?? "").replace(/\s+/g, " ").trim();

function nombreDeIcono(el: Element): string {
    const svg = el.querySelector("svg");
    if (!svg) return "";
    for (const c of Array.from(svg.classList)) {
        const m = /^lucide-(.+)$/.exec(c);
        if (m && ICONOS[m[1]]) return ICONOS[m[1]];
    }
    return "";
}

function tieneNombre(el: Element): boolean {
    if (norm(el.getAttribute("aria-label")) || norm(el.getAttribute("aria-labelledby")) || norm(el.getAttribute("title"))) return true;
    return norm(el.textContent) !== "" || !!el.querySelector("img[alt]:not([alt=''])");
}

function etiquetaCercana(el: Element): string {
    const id = el.getAttribute("id");
    if (id) {
        const l = document.querySelector(`label[for="${CSS.escape(id)}"]`);
        if (l && norm(l.textContent)) return norm(l.textContent);
    }
    const envolvente = el.closest("label");
    if (envolvente && norm(envolvente.textContent)) return norm(envolvente.textContent);
    // etiqueta hermana anterior (patrón <div><label>Fecha</label><input/></div>) o texto previo
    let prev: Element | null = el.previousElementSibling;
    for (let i = 0; prev && i < 3; i++, prev = prev.previousElementSibling) {
        if (/^(LABEL|SPAN|P|STRONG|H\d|SMALL|DIV)$/.test(prev.tagName) && !prev.querySelector("input,select,textarea") && norm(prev.textContent).length <= 60 && norm(prev.textContent)) return norm(prev.textContent);
    }
    const padre = el.parentElement;
    if (padre) {
        const l = padre.querySelector(":scope > label, :scope > span");
        if (l && norm(l.textContent) && norm(l.textContent).length <= 60) return norm(l.textContent);
    }
    return "";
}

let contador = 0;

/** <div><label>Fecha</label><input/></div> sin "for": se asocian (tocar la etiqueta enfoca el campo y el lector la lee). */
function asociarEtiquetas(raiz: ParentNode) {
    raiz.querySelectorAll("label:not([for])").forEach((l) => {
        if (l.querySelector("input,select,textarea")) return; // ya envuelve al campo
        const campo = l.nextElementSibling;
        if (!campo || !/^(INPUT|SELECT|TEXTAREA)$/.test(campo.tagName)) return;
        if ((campo as HTMLInputElement).type === "hidden") return;
        if (!campo.id) campo.id = `av-campo-${++contador}`;
        l.setAttribute("for", campo.id);
    });
}

export function mejorarNombres(raiz: ParentNode = document) {
    asociarEtiquetas(raiz);
    raiz.querySelectorAll("button, [role='button'], a[href]").forEach((el) => {
        if (tieneNombre(el)) return;
        el.setAttribute("aria-label", nombreDeIcono(el) || "Acción");
    });
    raiz.querySelectorAll("input:not([type='hidden']):not([type='submit']):not([type='button']), select, textarea").forEach((el) => {
        if (el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby")) return;
        const id = el.getAttribute("id");
        if (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) return;
        if (el.closest("label") && norm(el.closest("label")!.textContent)) return;
        const nombre = norm(el.getAttribute("placeholder")) || norm(el.getAttribute("title")) || etiquetaCercana(el)
            || (el.tagName === "SELECT" ? "Seleccionar una opción" : (el.getAttribute("type") === "date" ? "Fecha" : "Campo de texto"));
        el.setAttribute("aria-label", nombre.replace(/\s*\*\s*$/, ""));
    });
    raiz.querySelectorAll("th").forEach((th) => {
        if (norm(th.textContent) || th.querySelector(".av-sr-only")) return;
        const t = document.createElement("span");
        t.className = "av-sr-only";
        t.textContent = "Acciones";
        th.appendChild(t);
    });
    raiz.querySelectorAll("img:not([alt])").forEach((img) => img.setAttribute("alt", ""));
}
