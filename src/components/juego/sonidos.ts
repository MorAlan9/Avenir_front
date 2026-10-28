// Efectos de sonido generados con Web Audio (sin archivos). Todo falla en silencio si el navegador no lo permite.
let contexto: AudioContext | null = null;
let silenciado = false;

const ctx = () => {
    if (silenciado) return null;
    try {
        if (!contexto) contexto = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        if (contexto.state === "suspended") void contexto.resume();
        return contexto;
    } catch { return null; }
};

const tono = (frecuencia: number, inicio: number, duracion: number, tipo: OscillatorType = "sine", volumen = 0.12) => {
    const c = ctx();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = tipo;
    o.frequency.value = frecuencia;
    const t = c.currentTime + inicio;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volumen, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + duracion + 0.02);
};

export const setSilencio = (v: boolean) => { silenciado = v; };
export const estaSilenciado = () => silenciado;
export const sonidoHallazgo = () => { tono(660, 0, 0.12, "triangle"); tono(990, 0.09, 0.18, "triangle"); };
export const sonidoAcierto = () => { tono(523, 0, 0.1, "triangle"); tono(659, 0.08, 0.1, "triangle"); tono(784, 0.16, 0.22, "triangle"); };
export const sonidoRegular = () => { tono(440, 0, 0.14, "triangle"); };
export const sonidoError = () => { tono(180, 0, 0.22, "sawtooth", 0.1); tono(130, 0.1, 0.25, "sawtooth", 0.1); };
export const sonidoTic = () => { tono(900, 0, 0.04, "square", 0.04); };
export const sonidoCuenta = () => { tono(520, 0, 0.12, "square", 0.07); };
export const sonidoGo = () => { tono(780, 0, 0.3, "square", 0.08); };
export const sonidoFin = () => { tono(392, 0, 0.15, "triangle"); tono(523, 0.14, 0.15, "triangle"); tono(659, 0.28, 0.15, "triangle"); tono(784, 0.42, 0.35, "triangle"); };
