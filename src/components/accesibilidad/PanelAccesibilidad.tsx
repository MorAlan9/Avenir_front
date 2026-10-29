import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Accessibility, Minus, Plus, Volume2, VolumeX, RotateCcw, X } from "lucide-react";
import { aplicar, guardar, leer, POR_DEFECTO, ZOOMS, type Preferencias } from "./preferencias";
import { mejorarNombres } from "./nombres";

// Panel de accesibilidad para baja visión, ceguera parcial o total, dislexia, temblor/poca precisión motriz y sensibilidad al
// movimiento. Se ofrece en todas las pantallas (salvo el juego de quiosco, que tiene su propia interfaz) y recuerda la
// elección en el dispositivo. Además, de fondo, completa los nombres que faltan para lectores de pantalla.

const SIN_PANEL = ["/juego"];

const PanelAccesibilidad: React.FC = () => {
    const { pathname } = useLocation();
    const [pref, setPref] = useState<Preferencias>(() => leer());
    const [abierto, setAbierto] = useState(false);
    const [leyendo, setLeyendo] = useState(false);
    const botonRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const hayVoz = typeof window !== "undefined" && "speechSynthesis" in window;

    useEffect(() => { aplicar(pref); guardar(pref); }, [pref]);

    // Nombres accesibles que faltan (botones de ícono, campos sin etiqueta) – se repite cuando cambia la pantalla
    useEffect(() => {
        let t = 0;
        const correr = () => { window.clearTimeout(t); t = window.setTimeout(() => mejorarNombres(document), 250); };
        correr();
        const obs = new MutationObserver(correr);
        obs.observe(document.body, { childList: true, subtree: true });
        return () => { window.clearTimeout(t); obs.disconnect(); };
    }, []);

    const cerrar = useCallback(() => { setAbierto(false); botonRef.current?.focus(); }, []);

    useEffect(() => {
        if (!abierto) return;
        panelRef.current?.querySelector<HTMLElement>("button, input")?.focus();
        const alTeclear = (e: KeyboardEvent) => { if (e.key === "Escape") cerrar(); };
        document.addEventListener("keydown", alTeclear);
        return () => document.removeEventListener("keydown", alTeclear);
    }, [abierto, cerrar]);

    useEffect(() => () => { if (hayVoz) window.speechSynthesis.cancel(); }, [hayVoz]);

    if (SIN_PANEL.some((p) => pathname === p || pathname.startsWith(p + "/"))) return null;
    const publico = pathname !== "/home";

    const cambiar = (c: Partial<Preferencias>) => setPref((p) => ({ ...p, ...c }));
    const tamano = (d: number) => cambiar({ texto: Math.min(4, Math.max(0, pref.texto + d)) as Preferencias["texto"] });

    const leerPantalla = () => {
        if (!hayVoz) return;
        if (leyendo) { window.speechSynthesis.cancel(); setLeyendo(false); return; }
        const zona = document.querySelector<HTMLElement>("#contenido-principal") ?? document.querySelector<HTMLElement>("main") ?? document.body;
        const texto = (zona.innerText || "").replace(/\s+/g, " ").trim().slice(0, 4000);
        if (!texto) return;
        const voz = new SpeechSynthesisUtterance(texto);
        voz.lang = "es-AR";
        voz.rate = 0.95;
        voz.onend = () => setLeyendo(false);
        voz.onerror = () => setLeyendo(false);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(voz);
        setLeyendo(true);
    };

    const interruptor = (clave: keyof Preferencias, titulo: string) => (
        <label className="av-sw">
            <span>{titulo}</span>
            <input type="checkbox" role="switch" checked={pref[clave] as boolean} onChange={(e) => cambiar({ [clave]: e.target.checked } as Partial<Preferencias>)} />
        </label>
    );

    return (
        <>
            <button
                ref={botonRef}
                type="button"
                className={`av-a11y-btn${publico ? " av-publico" : ""}`}
                aria-label="Opciones de accesibilidad"
                aria-haspopup="dialog"
                aria-expanded={abierto}
                title="Accesibilidad: tamaño de texto, contraste, lectura en voz alta"
                onClick={() => setAbierto((a) => !a)}
            >
                <Accessibility size={26} aria-hidden="true" />
            </button>

            {abierto && (
                <div ref={panelRef} className={`av-a11y-panel${publico ? " av-publico" : ""}`} role="dialog" aria-label="Opciones de accesibilidad">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <h2>Accesibilidad</h2>
                        <button type="button" className="av-op" aria-label="Cerrar el panel de accesibilidad" onClick={cerrar} style={{ minWidth: 44, justifyContent: "center" }}><X size={18} aria-hidden="true" /></button>
                    </div>
                    <p className="av-ayuda">Ajustá la pantalla a tu forma de usarla. Se guarda en este dispositivo. Podés moverte con la tecla Tab y cerrar esto con Esc.</p>

                    <fieldset>
                        <legend>Tamaño del texto: {Math.round(ZOOMS[pref.texto] * 100)} %</legend>
                        <div className="av-a11y-fila">
                            <button type="button" className="av-op" onClick={() => tamano(-1)} disabled={pref.texto === 0} aria-label="Achicar el texto"><Minus size={18} aria-hidden="true" /> Menos</button>
                            <button type="button" className="av-op" onClick={() => tamano(1)} disabled={pref.texto === 4} aria-label="Agrandar el texto"><Plus size={18} aria-hidden="true" /> Más</button>
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend>Visión</legend>
                        <div style={{ display: "grid", gap: 8 }}>
                            {interruptor("contraste", "Alto contraste")}
                            {interruptor("fuenteLegible", "Letra y espaciado fáciles de leer")}
                            {interruptor("espaciado", "Más espacio entre renglones")}
                            {interruptor("focoFuerte", "Resaltar dónde estoy (foco) y los enlaces")}
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend>Movimiento</legend>
                        {interruptor("sinAnimaciones", "Quitar animaciones y efectos")}
                    </fieldset>

                    {hayVoz && (
                        <fieldset>
                            <legend>Lectura en voz alta</legend>
                            <button type="button" className="av-op av-primario" onClick={leerPantalla} aria-pressed={leyendo}>
                                {leyendo ? <><VolumeX size={18} aria-hidden="true" /> Detener la lectura</> : <><Volume2 size={18} aria-hidden="true" /> Leer esta pantalla</>}
                            </button>
                        </fieldset>
                    )}

                    <div className="av-a11y-pie">
                        <button type="button" className="av-op av-peligro" onClick={() => { setPref({ ...POR_DEFECTO }); if (hayVoz) window.speechSynthesis.cancel(); setLeyendo(false); }}><RotateCcw size={16} aria-hidden="true" /> Restablecer</button>
                        <button type="button" className="av-op" onClick={cerrar}>Listo</button>
                    </div>
                </div>
            )}
        </>
    );
};

export default PanelAccesibilidad;
