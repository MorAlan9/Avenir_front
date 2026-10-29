import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Clock, Lightbulb, LogOut, Volume2, VolumeX, ShieldCheck, Search, Trophy, Printer, RotateCcw, Play } from "lucide-react";
import logo from "../../assets/avenir-logo.png";
import Escena from "./Escena";
import "./juego.css";
import {
    NIVELES, PELIGROS, SEGUROS, TOTAL_TIEMPO, PENALIZACION_FALSA_ALARMA, SEGUNDOS_FALSA_ALARMA, COSTO_PISTA, PISTAS_MAXIMAS,
    calcularPuntosHallazgo, colorDeNivel, etiquetaDeNivel, ordenDeNivel, rangoDe,
    type Nivel, type Peligro, type Resultado,
} from "./datos";
import { guardarResultado, leerRanking, ordenar, suscribirRanking } from "./ranking";
import { evento, registrarVisita } from "./telemetria";
import {
    estaSilenciado, setSilencio, sonidoAcierto, sonidoCuenta, sonidoError, sonidoFin, sonidoGo, sonidoHallazgo, sonidoRegular, sonidoTic,
} from "./sonidos";

type Fase = "inicio" | "cuenta" | "juego" | "fin";

interface Feedback { clase: "exacto" | "cerca" | "lejos"; titulo: string; texto: string; puntos: number }
interface Onda { id: number; x: number; y: number; mal: boolean }

const SEGUNDOS_INACTIVIDAD_FIN = 60;

const JuegoInspector: React.FC = () => {
    const [fase, setFase] = useState<Fase>("inicio");
    const [nombre, setNombre] = useState("");
    const [empresa, setEmpresa] = useState("");
    const [cuenta, setCuenta] = useState(3);
    const [segundos, setSegundos] = useState(TOTAL_TIEMPO);
    const [encontrados, setEncontrados] = useState<Record<string, Nivel>>({});
    const [puntosBase, setPuntosBase] = useState(0);
    const [falsas, setFalsas] = useState(0);
    const [pistasUsadas, setPistasUsadas] = useState(0);
    const [pista, setPista] = useState<string | null>(null);
    const [evaluando, setEvaluando] = useState<Peligro | null>(null);
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [bloqueado, setBloqueado] = useState(false);
    const [toast, setToast] = useState<{ texto: string; mal: boolean } | null>(null);
    const [ondas, setOndas] = useState<Onda[]>([]);
    const [sacudir, setSacudir] = useState(false);
    const [silencio, setSilencioEstado] = useState(estaSilenciado());
    const [resultado, setResultado] = useState<Resultado | null>(null);
    const [desglose, setDesglose] = useState({ bonoTiempo: 0, bonoLimpio: 0 });
    const [top, setTop] = useState<Resultado[]>(() => ordenar(leerRanking()));

    const restante = useRef(TOTAL_TIEMPO);
    const guardado = useRef(false);
    const idOnda = useRef(0);

    useEffect(() => suscribirRanking(() => setTop(ordenar(leerRanking()))), []);

    const urgente = segundos <= 15 && fase === "juego";
    const total = PELIGROS.length;
    const cantEncontrados = Object.keys(encontrados).length;

    const mostrarToast = useCallback((texto: string, mal = false) => {
        setToast({ texto, mal });
        window.setTimeout(() => setToast((t) => (t && t.texto === texto ? null : t)), 2600);
    }, []);

    const empezar = () => {
        if (!nombre.trim()) return;
        guardado.current = false;
        restante.current = TOTAL_TIEMPO;
        setSegundos(TOTAL_TIEMPO);
        setEncontrados({});
        setPuntosBase(0);
        setFalsas(0);
        setPistasUsadas(0);
        setPista(null);
        setEvaluando(null);
        setFeedback(null);
        setBloqueado(false);
        setResultado(null);
        setCuenta(3);
        registrarVisita(nombre.trim(), empresa.trim());
        evento("JUEGO_INICIO", "", nombre.trim());
        setFase("cuenta");
        sonidoCuenta();
    };

    // Cuenta regresiva 3-2-1
    useEffect(() => {
        if (fase !== "cuenta") return;
        const t = window.setTimeout(() => {
            if (cuenta > 1) { setCuenta(cuenta - 1); sonidoCuenta(); }
            else { sonidoGo(); setFase("juego"); }
        }, 900);
        return () => window.clearTimeout(t);
    }, [fase, cuenta]);

    const terminar = useCallback((enc: Record<string, Nivel>, base: number, falsasN: number, pistasN: number, quedan: number) => {
        if (guardado.current) return;
        guardado.current = true;
        const todos = Object.keys(enc).length === PELIGROS.length;
        const bonoTiempo = todos ? Math.round(quedan) * 4 : 0;
        const bonoLimpio = todos && falsasN === 0 ? 150 : 0;
        const puntos = Math.max(0, base - falsasN * PENALIZACION_FALSA_ALARMA - pistasN * COSTO_PISTA + bonoTiempo + bonoLimpio);
        const exactos = PELIGROS.filter((p) => enc[p.id] === p.nivel).length;
        const r: Resultado = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            nombre: nombre.trim(), empresa: empresa.trim(), puntos,
            encontrados: Object.keys(enc).length, exactos, falsasAlarmas: falsasN,
            segundosRestantes: Math.round(quedan), fecha: new Date().toISOString(),
        };
        guardarResultado(r);
        evento("JUEGO_FIN", `${puntos} pts`, nombre.trim());
        setDesglose({ bonoTiempo, bonoLimpio });
        setResultado(r);
        setPista(null);
        setEvaluando(null);
        setFeedback(null);
        setFase("fin");
        sonidoFin();
    }, [nombre, empresa]);

    // Reloj (se pausa mientras se evalúa un hallazgo)
    useEffect(() => {
        if (fase !== "juego" || evaluando) return;
        let ultimo = performance.now();
        const t = window.setInterval(() => {
            const ahora = performance.now();
            restante.current = Math.max(0, restante.current - (ahora - ultimo) / 1000);
            ultimo = ahora;
            const entero = Math.ceil(restante.current);
            setSegundos((prev) => {
                if (prev !== entero && entero <= 10 && entero > 0) sonidoTic();
                return entero;
            });
            if (restante.current <= 0) {
                window.clearInterval(t);
                terminar(encontradosRef.current, baseRef.current, falsasRef.current, pistasRef.current, 0);
            }
        }, 200);
        return () => window.clearInterval(t);
    }, [fase, evaluando, terminar]);

    // Copias para leer los valores actuales desde el reloj
    const encontradosRef = useRef(encontrados);
    const baseRef = useRef(puntosBase);
    const falsasRef = useRef(falsas);
    const pistasRef = useRef(pistasUsadas);
    useEffect(() => { encontradosRef.current = encontrados; baseRef.current = puntosBase; falsasRef.current = falsas; pistasRef.current = pistasUsadas; });

    // Pista temporal
    useEffect(() => {
        if (!pista) return;
        const t = window.setTimeout(() => setPista(null), 4500);
        return () => window.clearTimeout(t);
    }, [pista]);

    // En la pantalla final, vuelve solo al inicio si nadie toca nada
    useEffect(() => {
        if (fase !== "fin") return;
        let t = window.setTimeout(() => setFase("inicio"), SEGUNDOS_INACTIVIDAD_FIN * 1000);
        const reiniciar = () => { window.clearTimeout(t); t = window.setTimeout(() => setFase("inicio"), SEGUNDOS_INACTIVIDAD_FIN * 1000); };
        window.addEventListener("pointerdown", reiniciar);
        return () => { window.clearTimeout(t); window.removeEventListener("pointerdown", reiniciar); };
    }, [fase]);

    const alPeligro = (id: string) => {
        if (fase !== "juego" || evaluando || bloqueado || encontrados[id]) return;
        const p = PELIGROS.find((x) => x.id === id);
        if (!p) return;
        sonidoHallazgo();
        setPista(null);
        setFeedback(null);
        setEvaluando(p);
    };

    const alSeguro = (id: string) => {
        if (fase !== "juego" || evaluando || bloqueado) return;
        const s = SEGUROS.find((x) => x.id === id);
        sonidoError();
        evento("FALSA_ALARMA");
        setFalsas((f) => f + 1);
        setBloqueado(true);
        setSacudir(true);
        mostrarToast(`Falsa alarma: ${s ? s.mensaje : "eso está en regla."} (−${PENALIZACION_FALSA_ALARMA} pts)`, true);
        window.setTimeout(() => setSacudir(false), 400);
        window.setTimeout(() => setBloqueado(false), SEGUNDOS_FALSA_ALARMA * 1000);
    };

    const alVacio = (x: number, y: number) => {
        if (fase !== "juego" || evaluando) return;
        const id = ++idOnda.current;
        setOndas((o) => [...o, { id, x: (x / 1200) * 100, y: (y / 650) * 100, mal: true }]);
        window.setTimeout(() => setOndas((o) => o.filter((w) => w.id !== id)), 650);
    };

    const elegirNivel = (nivel: Nivel) => {
        if (!evaluando || feedback) return;
        const p = evaluando;
        const pts = calcularPuntosHallazgo(p, nivel);
        const dif = Math.abs(ordenDeNivel(p.nivel) - ordenDeNivel(nivel));
        if (dif === 0) { sonidoAcierto(); setFeedback({ clase: "exacto", titulo: "¡Exacto!", texto: `Nivel de riesgo: ${etiquetaDeNivel(p.nivel)}. ${p.descripcion}`, puntos: pts }); }
        else if (dif === 1) { sonidoRegular(); setFeedback({ clase: "cerca", titulo: "Casi", texto: `Lo clasificaste como ${etiquetaDeNivel(nivel)} y es ${etiquetaDeNivel(p.nivel)}. ${p.descripcion}`, puntos: pts }); }
        else { sonidoError(); setFeedback({ clase: "lejos", titulo: "Lo encontraste, pero lo subestimaste", texto: `Lo clasificaste como ${etiquetaDeNivel(nivel)} y es ${etiquetaDeNivel(p.nivel)}. ${p.descripcion}`, puntos: pts }); }
        evento("HALLAZGO", `${p.titulo} (${etiquetaDeNivel(p.nivel)})`);
        setEncontrados((e) => ({ ...e, [p.id]: nivel }));
        setPuntosBase((b) => b + pts);
    };

    const seguir = () => {
        const todos = Object.keys(encontrados).length >= PELIGROS.length;
        setEvaluando(null);
        setFeedback(null);
        if (todos) terminar(encontrados, puntosBase, falsas, pistasUsadas, restante.current);
    };

    const pedirPista = () => {
        if (pistasUsadas >= PISTAS_MAXIMAS || evaluando || fase !== "juego") return;
        const faltantes = PELIGROS.filter((p) => !encontrados[p.id]).sort((a, b) => ordenDeNivel(b.nivel) - ordenDeNivel(a.nivel));
        if (!faltantes.length) return;
        setPistasUsadas((n) => n + 1);
        evento("PISTA");
        setPista(faltantes[0].id);
        mostrarToast(`Pista: ${faltantes[0].pista} (−${COSTO_PISTA} pts)`);
    };

    const alternarSonido = () => { const nuevo = !silencio; setSilencio(nuevo); setSilencioEstado(nuevo); };

    const puntajeVivo = Math.max(0, puntosBase - falsas * PENALIZACION_FALSA_ALARMA - pistasUsadas * COSTO_PISTA);

    const abrirCertificado = () => {
        if (!resultado) return;
        const q = new URLSearchParams({ n: resultado.nombre, e: resultado.empresa, p: String(resultado.puntos), f: String(resultado.encontrados), x: String(resultado.exactos), r: rangoDe(resultado.puntos).nombre });
        window.open(`/juego/certificado?${q.toString()}`, "_blank");
    };

    const puesto = useMemo(() => (resultado ? ordenar(leerRanking()).findIndex((r) => r.id === resultado.id) + 1 : 0), [resultado, top]);

    /* ---------------- render ---------------- */
    const aros = <div className="jg-aros"><i /><i /><i /></div>;

    if (fase === "inicio") {
        return (
            <div className="jg-root">
                {aros}
                <div className="jg-inicio">
                    <div>
                        <div className="jg-logo-chip"><img src={logo} alt="Avenir" /></div>
                        <div className="jg-eyebrow"><Search size={16} /> Desafío de prevención</div>
                        <h1 className="jg-titulo">Inspector <em>Avenir</em>:<br />cazá los riesgos</h1>
                        <p className="jg-bajada">Este taller tiene {total} peligros escondidos. Encontralos, decidí qué tan graves son y mirá cómo lo resolvería el sistema Avenir.</p>
                        <form className="jg-form" onSubmit={(e) => { e.preventDefault(); empezar(); }}>
                            <input className="jg-input" placeholder="Tu nombre" value={nombre} maxLength={24} onChange={(e) => setNombre(e.target.value)} autoComplete="off" />
                            <input className="jg-input" placeholder="Empresa o escuela (opcional)" value={empresa} maxLength={30} onChange={(e) => setEmpresa(e.target.value)} autoComplete="off" />
                            <button className="jg-btn jg-btn-mint jg-btn-lg" type="submit" disabled={!nombre.trim()} style={{ opacity: nombre.trim() ? 1 : .5 }}><Play size={20} style={{ verticalAlign: "-3px" }} /> ¡Jugar!</button>
                        </form>
                        <div className="jg-reglas">
                            <span><Clock size={16} /> {TOTAL_TIEMPO} segundos</span>
                            <span><ShieldCheck size={16} /> Tocá lo peligroso, no lo que está bien</span>
                            <span><Lightbulb size={16} /> {PISTAS_MAXIMAS} pistas (−{COSTO_PISTA})</span>
                        </div>
                    </div>
                    <div className="jg-lateral">
                        <div className="jg-vista-escena"><Escena encontrados={{}} pista={null} mostrarFaltantes={false} interactivo={false} onPeligro={() => {}} onSeguro={() => {}} onVacio={() => {}} /></div>
                        <div className="jg-top3">
                            <h2>Mejores inspectores</h2>
                            {top.length === 0 && <div className="jg-vacio">Todavía nadie jugó. ¡Sé el primero!</div>}
                            {top.slice(0, 3).map((r, i) => (
                                <div className="jg-fila" key={r.id}><span className="pos">{i + 1}</span><span>{r.nombre}{r.empresa ? ` · ${r.empresa}` : ""}</span><span className="pts">{r.puntos}</span></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (fase === "cuenta") {
        return (<div className="jg-root">{aros}<div className="jg-cuenta"><div><span>Prepará la vista, {nombre.trim()}…</span><b key={cuenta}>{cuenta}</b></div></div></div>);
    }

    if (fase === "fin" && resultado) {
        const rango = rangoDe(resultado.puntos);
        const todos = resultado.encontrados === total;
        return (
            <div className="jg-root">
                {aros}
                <div className="jg-fin">
                    <div className="jg-tarjeta">
                        <span className="jg-rango" style={{ background: rango.color }}>{rango.nombre}</span>
                        <h2 style={{ fontSize: "1.6rem", fontWeight: 800 }}>{todos ? "¡Taller inspeccionado!" : "Se acabó el tiempo"}, {resultado.nombre}</h2>
                        <div className="puntaje-grande">{resultado.puntos}<small>pts</small></div>
                        {puesto > 0 && <p style={{ color: "var(--mint)", fontWeight: 700, marginTop: 6 }}>Puesto n.º {puesto} del ranking</p>}
                        <div className="jg-stats">
                            <div className="jg-stat"><b>{resultado.encontrados}/{total}</b><small>riesgos encontrados</small></div>
                            <div className="jg-stat"><b>{resultado.exactos}</b><small>bien clasificados</small></div>
                            <div className="jg-stat"><b>{resultado.falsasAlarmas}</b><small>falsas alarmas</small></div>
                            <div className="jg-stat"><b>{desglose.bonoTiempo + desglose.bonoLimpio}</b><small>bonus (tiempo + sin errores)</small></div>
                        </div>
                        <div className="jg-btns">
                            <button className="jg-btn jg-btn-mint" onClick={abrirCertificado}><Printer size={18} style={{ verticalAlign: "-3px" }} /> Mi certificado</button>
                            <button className="jg-btn jg-btn-ghost" onClick={() => window.open("/juego/ranking", "_blank")}><Trophy size={18} style={{ verticalAlign: "-3px" }} /> Ranking</button>
                            <button className="jg-btn jg-btn-ghost" onClick={() => setFase("inicio")}><RotateCcw size={18} style={{ verticalAlign: "-3px" }} /> Jugar de nuevo</button>
                        </div>
                    </div>
                    <div className="jg-tarjeta jg-informe">
                        <h3>Informe de inspección</h3>
                        <p className="sub">Así quedaría registrado en Avenir (Relevamientos · IPER). Cada riesgo con su medida de control.</p>
                        {[...PELIGROS].sort((a, b) => ordenDeNivel(b.nivel) - ordenDeNivel(a.nivel)).map((p, i) => {
                            const elegido = encontrados[p.id];
                            return (
                                <div className={`jg-hall${elegido ? "" : " faltante"}`} key={p.id}>
                                    <span className="num" style={{ background: elegido ? colorDeNivel(p.nivel) : undefined }}>{i + 1}</span>
                                    <div>
                                        <b>{p.titulo} <span className="jg-pill" style={{ background: colorDeNivel(p.nivel) }}>{etiquetaDeNivel(p.nivel)}</span></b>
                                        <p>{p.tipo} · {p.medida}</p>
                                    </div>
                                    <div className="estado" style={{ color: !elegido ? "#FCA5A5" : elegido === p.nivel ? "var(--mint)" : "#FDE047" }}>
                                        {!elegido ? "NO LO VISTE" : elegido === p.nivel ? "ACERTASTE" : `PUSISTE ${etiquetaDeNivel(elegido).toUpperCase()}`}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // fase === "juego"
    return (
        <div className="jg-root">
            {aros}
            <div className="jg-hud">
                <div className="marca"><img src={logo} alt="Avenir" /><span>Inspector Avenir</span></div>
                <div className="jg-centro">
                    <div className={`jg-reloj${urgente ? " urgente" : ""}`}>
                        <Clock size={22} /><b>{segundos}</b>
                        <div className="jg-barra"><i style={{ width: `${(segundos / TOTAL_TIEMPO) * 100}%` }} /></div>
                    </div>
                    <div className="jg-puntaje"><small>Puntos</small><b>{puntajeVivo}</b></div>
                    <div className="jg-chips" aria-label={`${cantEncontrados} de ${total} encontrados`}>
                        {PELIGROS.map((p) => (<i key={p.id} className={encontrados[p.id] ? "on" : ""} style={encontrados[p.id] ? { background: colorDeNivel(encontrados[p.id]) } : undefined} />))}
                    </div>
                </div>
                <div className="jg-acciones">
                    <button className="jg-icon-btn jg-pista-btn" onClick={pedirPista} disabled={pistasUsadas >= PISTAS_MAXIMAS || !!evaluando} title="Pedir pista"><Lightbulb size={18} /> {PISTAS_MAXIMAS - pistasUsadas}</button>
                    <button className="jg-icon-btn" onClick={alternarSonido} title="Sonido">{silencio ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
                    <button className="jg-icon-btn" onClick={() => (window.confirm("¿Salir de la partida?") ? setFase("inicio") : null)} title="Salir"><LogOut size={18} /></button>
                </div>
            </div>
            <div className="jg-escena-wrap">
                <div className={`jg-caja-escena${sacudir ? " sacudir" : ""}`}>
                    <Escena encontrados={encontrados} pista={pista} mostrarFaltantes={false} interactivo={!evaluando && !bloqueado}
                        onPeligro={alPeligro} onSeguro={alSeguro} onVacio={alVacio} />
                    {ondas.map((o) => (<span key={o.id} className={`jg-ripple${o.mal ? " mal" : ""}`} style={{ left: `${o.x}%`, top: `${o.y}%` }} />))}
                    {toast && <div className={`jg-toast${toast.mal ? " mal" : ""}`}>{toast.texto}</div>}
                    {evaluando && (
                        <div className="jg-velo">
                            <div className="jg-panel">
                                <span className="tipo"><Search size={13} /> {evaluando.tipo}</span>
                                <h3>{evaluando.titulo}</h3>
                                {!feedback && (
                                    <>
                                        <p className="pregunta">¿Qué nivel de riesgo es?</p>
                                        <div className="jg-niveles">
                                            {NIVELES.map((n) => (<button key={n.id} className="jg-nivel" style={{ background: n.color }} onClick={() => elegirNivel(n.id)}>{n.etiqueta}</button>))}
                                        </div>
                                    </>
                                )}
                                {feedback && (
                                    <>
                                        <div className={`jg-feedback ${feedback.clase}`}><b>{feedback.titulo} · +{feedback.puntos} pts</b>{feedback.texto}</div>
                                        <div className="jg-medida"><b>Medida de control:</b> {evaluando.medida}</div>
                                        <button className="jg-btn jg-btn-mint" onClick={seguir}>{cantEncontrados >= total ? "Ver mi resultado" : "Seguir buscando"}</button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JuegoInspector;
