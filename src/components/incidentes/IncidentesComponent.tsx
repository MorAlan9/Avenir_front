import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Lock, Unlock, Search } from "lucide-react";
import api from "../../service/api";
import { tienePermiso } from "../../service/authHelper";
import { textoError, hoyISO } from "../../service/errores";
import "../insumos/insumos.css";
import "../relevamientos/relevamientos.css";
import type { Empresa } from "../../interfaces/Empresa";
import type { Incidente, IndicadoresIncidentes, TipoIncidente, GravedadIncidente } from "../../interfaces/Sst";

const obtenerHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

const ETIQUETA: Record<string, string> = {
    ACCIDENTE_CON_BAJA: "Accidente con baja",
    ACCIDENTE_SIN_BAJA: "Accidente sin baja",
    INCIDENTE: "Incidente (casi accidente)",
    LEVE: "Leve",
    MODERADO: "Moderado",
    GRAVE: "Grave",
    ABIERTO: "Abierto",
    EN_INVESTIGACION: "En investigación",
    CERRADO: "Cerrado",
};

// Reutiliza los colores de severidad del módulo de relevamientos.
const CLASE_GRAVEDAD: Record<string, string> = { LEVE: "BAJO", MODERADO: "MEDIO", GRAVE: "CRITICO" };

const IncidentesComponent: React.FC = () => {
    const puedeVer = tienePermiso("VER_INCIDENTES");
    const puedeCrear = tienePermiso("CREAR_INCIDENTES");
    const puedeEditar = tienePermiso("EDITAR_INCIDENTES");

    const [incidentes, setIncidentes] = useState<Incidente[]>([]);
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [indicadores, setIndicadores] = useState<IndicadoresIncidentes | null>(null);
    const [horas, setHoras] = useState("");
    const [abierto, setAbierto] = useState<number | null>(null);

    const [idEmpresa, setIdEmpresa] = useState<number | "">("");
    const [fecha, setFecha] = useState(hoyISO());
    const [tipo, setTipo] = useState<TipoIncidente>("INCIDENTE");
    const [gravedad, setGravedad] = useState<GravedadIncidente>("LEVE");
    const [afectado, setAfectado] = useState("");
    const [diasPerdidos, setDiasPerdidos] = useState("");
    const [descripcion, setDescripcion] = useState("");

    const [causas, setCausas] = useState("");
    const [accionDesc, setAccionDesc] = useState("");
    const [accionResp, setAccionResp] = useState("");
    const [accionFecha, setAccionFecha] = useState("");

    const [errorForm, setErrorForm] = useState("");
    const [mensajeForm, setMensajeForm] = useState("");
    const [errorDetalle, setErrorDetalle] = useState("");

    const esAccidente = tipo !== "INCIDENTE";

    const cargar = async (horasTexto: string = horas) => {
        try {
            const [lista, ind] = await Promise.all([
                api.get("/incidentes", obtenerHeaders()),
                api.get("/incidentes/indicadores" + (horasTexto ? `?horasTrabajadas=${encodeURIComponent(horasTexto)}` : ""), obtenerHeaders()),
            ]);
            setIncidentes(Array.isArray(lista.data) ? lista.data : []);
            setIndicadores(ind.data);
        } catch (err) {
            console.error("Error al cargar incidentes", err);
        }
    };

    useEffect(() => {
        if (!puedeVer) return;
        cargar();
        api.get("/empresas", obtenerHeaders())
            .then((r) => setEmpresas(Array.isArray(r.data) ? r.data.filter((e: Empresa) => e.activo) : []))
            .catch(() => setEmpresas([]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCrear = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorForm(""); setMensajeForm("");
        try {
            await api.post("/incidentes", {
                idEmpresa: idEmpresa || null, fecha, tipo, gravedad, afectado, descripcion,
                diasPerdidos: tipo === "ACCIDENTE_CON_BAJA" ? diasPerdidos : null,
            }, obtenerHeaders());
            setMensajeForm("Evento registrado. Quedó abierto: falta investigarlo.");
            setDescripcion(""); setAfectado(""); setDiasPerdidos("");
            await cargar();
        } catch (err: any) {
            setErrorForm(textoError(err, "Error al registrar el evento."));
        }
    };

    const ejecutar = async (accion: () => Promise<unknown>, porDefecto: string) => {
        setErrorDetalle("");
        try {
            await accion();
            await cargar();
        } catch (err: any) {
            setErrorDetalle(textoError(err, porDefecto));
        }
    };

    const cambiarEstado = (i: Incidente, estado: string) =>
        ejecutar(() => api.put(`/incidentes/${i.idIncidente}/estado`, { estado, causas: causas || undefined }, obtenerHeaders()), "No se pudo cambiar el estado.");

    const agregarAccion = (i: Incidente) =>
        ejecutar(async () => {
            await api.post(`/incidentes/${i.idIncidente}/acciones`,
                { descripcion: accionDesc, responsable: accionResp, fechaLimite: accionFecha || null }, obtenerHeaders());
            setAccionDesc(""); setAccionResp(""); setAccionFecha("");
        }, "No se pudo agregar la acción.");

    const cumplirAccion = (idAccion: number) =>
        ejecutar(() => api.put(`/incidentes/acciones/${idAccion}/cumplir`, {}, obtenerHeaders()), "No se pudo marcar la acción.");

    const abrirTarjeta = (i: Incidente) => {
        setErrorDetalle("");
        setCausas(i.causas || "");
        setAbierto(abierto === i.idIncidente ? null : i.idIncidente);
    };

    if (!puedeVer) {
        return (
            <div className="insumos-container"><div className="insumos-card">
                <p className="txt-vacio">No tenés permiso para ver los accidentes e incidentes.</p>
            </div></div>
        );
    }

    return (
        <div className="insumos-container">
            <div className="insumos-card">
                <h1 style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
                    <AlertTriangle size={24} color="#dc2626" /> ACCIDENTES E INCIDENTES
                </h1>
                <div className="rel-resumen" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(104px, 1fr))" }}>
                    <div className={`rel-dato ${indicadores?.diasSinAccidentes === 0 ? "alerta" : ""}`}>
                        <b>{indicadores?.diasSinAccidentes ?? "—"}</b><span>Días sin accidentes</span>
                    </div>
                    <div className="rel-dato"><b>{indicadores?.accidentesConBaja ?? 0}</b><span>Con baja</span></div>
                    <div className="rel-dato"><b>{indicadores?.accidentesSinBaja ?? 0}</b><span>Sin baja</span></div>
                    <div className="rel-dato"><b>{indicadores?.incidentes ?? 0}</b><span>Incidentes</span></div>
                    <div className="rel-dato"><b>{indicadores?.diasPerdidos ?? 0}</b><span>Días perdidos</span></div>
                    <div className={`rel-dato ${(indicadores?.abiertos ?? 0) > 0 ? "alerta" : ""}`}><b>{indicadores?.abiertos ?? 0}</b><span>Sin cerrar</span></div>
                    <div className={`rel-dato ${(indicadores?.accionesVencidas ?? 0) > 0 ? "alerta" : ""}`}><b>{indicadores?.accionesVencidas ?? 0}</b><span>Acciones vencidas</span></div>
                </div>
                <div className="rel-bloque" style={{ marginTop: 14 }}>
                    <div className="rel-form-grid">
                        <div className="rel-campo">
                            <label>Horas-hombre trabajadas en el período</label>
                            <input className="form-input" type="number" min={1} value={horas} onChange={(e) => setHoras(e.target.value)} placeholder="Ej: 120000" />
                            <span className="rel-ayuda">Se usa para calcular los índices.</span>
                        </div>
                        <div className="rel-campo">
                            <label>Índice de frecuencia</label>
                            <b style={{ fontSize: "1.3rem" }}>{indicadores?.indiceFrecuencia ?? "—"}</b>
                            <span className="rel-ayuda">Accidentes con baja × 1.000.000 ÷ horas</span>
                        </div>
                        <div className="rel-campo">
                            <label>Índice de gravedad</label>
                            <b style={{ fontSize: "1.3rem" }}>{indicadores?.indiceGravedad ?? "—"}</b>
                            <span className="rel-ayuda">Días perdidos × 1.000 ÷ horas</span>
                        </div>
                        <div className="rel-form-pie" style={{ gridColumn: "auto", alignSelf: "end" }}>
                            <button className="rel-btn azul" onClick={() => cargar(horas)}><Search size={14} /> Calcular</button>
                        </div>
                    </div>
                </div>
            </div>

            {puedeCrear && (
                <div className="insumos-card">
                    <h1>REGISTRAR EVENTO</h1>
                    <form onSubmit={handleCrear} className="rel-form-grid">
                        <div className="rel-campo">
                            <label>Empresa / Sede *</label>
                            <select className="form-input" value={idEmpresa} onChange={(e) => setIdEmpresa(e.target.value as unknown as number)} required>
                                <option value="" disabled>Seleccione una empresa</option>
                                {empresas.map((emp) => <option key={emp.idEmpresa} value={emp.idEmpresa}>{emp.nombre}</option>)}
                            </select>
                        </div>
                        <div className="rel-campo">
                            <label>Fecha del evento *</label>
                            <input type="date" className="form-input" value={fecha} max={hoyISO()} onChange={(e) => setFecha(e.target.value)} required />
                        </div>
                        <div className="rel-campo">
                            <label>Tipo *</label>
                            <select className="form-input" value={tipo} onChange={(e) => setTipo(e.target.value as TipoIncidente)}>
                                <option value="INCIDENTE">Incidente (casi accidente)</option>
                                <option value="ACCIDENTE_SIN_BAJA">Accidente sin baja</option>
                                <option value="ACCIDENTE_CON_BAJA">Accidente con baja</option>
                            </select>
                        </div>
                        <div className="rel-campo">
                            <label>Gravedad *</label>
                            <select className="form-input" value={gravedad} onChange={(e) => setGravedad(e.target.value as GravedadIncidente)}>
                                <option value="LEVE">Leve</option>
                                <option value="MODERADO">Moderado</option>
                                <option value="GRAVE">Grave</option>
                            </select>
                        </div>
                        {esAccidente && (
                            <div className="rel-campo">
                                <label>Persona afectada *</label>
                                <input className="form-input" value={afectado} maxLength={120} onChange={(e) => setAfectado(e.target.value)} required />
                            </div>
                        )}
                        {tipo === "ACCIDENTE_CON_BAJA" && (
                            <div className="rel-campo">
                                <label>Días perdidos *</label>
                                <input className="form-input" type="number" min={1} step={1} value={diasPerdidos} onChange={(e) => setDiasPerdidos(e.target.value)} required />
                            </div>
                        )}
                        <div className="rel-campo ancho">
                            <label>Qué pasó *</label>
                            <textarea className="form-input" value={descripcion} maxLength={500} onChange={(e) => setDescripcion(e.target.value)} required
                                placeholder="Descripción del evento: dónde, cuándo y cómo ocurrió" />
                        </div>
                        <div className="rel-form-pie"><button type="submit" className="rel-btn">Registrar evento</button></div>
                    </form>
                    {errorForm && <p className="msg-error">{errorForm}</p>}
                    {mensajeForm && <p className="msg-exito">{mensajeForm}</p>}
                </div>
            )}

            <div className="insumos-card">
                <h1>REGISTRO DE EVENTOS</h1>
                {incidentes.length === 0 ? <p className="rel-vacio">No hay eventos registrados. 👍</p> : (
                    <div className="rel-lista">
                        {incidentes.map((i) => {
                            const abiertaTarjeta = abierto === i.idIncidente;
                            const pendientes = i.acciones.filter((a) => a.estado !== "HECHA").length;
                            return (
                                <article key={i.idIncidente} className={`rel-hallazgo sev-${CLASE_GRAVEDAD[i.gravedad]}`}>
                                    <div className="rel-hallazgo-top">
                                        <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                            <span className={`rel-badge ${CLASE_GRAVEDAD[i.gravedad]}`}>{ETIQUETA[i.gravedad]}</span>
                                            <span className={`rel-badge ${i.estado === "ABIERTO" ? "BORRADOR" : i.estado === "CERRADO" ? "CERRADO" : "EN_CURSO"}`}>{ETIQUETA[i.estado]}</span>
                                        </span>
                                        <span className="rel-meta">{i.fecha}</span>
                                    </div>
                                    <p><b>{ETIQUETA[i.tipo]}</b> — {i.empresa?.nombre}</p>
                                    <p>{i.descripcion}</p>
                                    <div className="rel-meta">
                                        {i.afectado && <span><b>Afectado:</b> {i.afectado}</span>}
                                        {i.diasPerdidos > 0 && <span><b>Días perdidos:</b> {i.diasPerdidos}</span>}
                                        <span><b>Acciones:</b> {i.acciones.length - pendientes}/{i.acciones.length} hechas</span>
                                    </div>
                                    <div className="rel-hallazgo-acciones">
                                        <button className="rel-btn gris chico" onClick={() => abrirTarjeta(i)}>{abiertaTarjeta ? "Ocultar" : "Gestionar"}</button>
                                    </div>

                                    {abiertaTarjeta && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                            {errorDetalle && <div className="rel-aviso error">{errorDetalle}</div>}
                                            {i.causas && i.estado === "CERRADO" && <div className="rel-reco"><b>Causas: </b>{i.causas}</div>}

                                            <b style={{ fontSize: "0.85rem" }}>Acciones correctivas</b>
                                            {i.acciones.length === 0 && <p className="rel-vacio" style={{ padding: 10 }}>Todavía no hay acciones.</p>}
                                            {i.acciones.map((a) => (
                                                <div key={a.idAccion} className="rel-reco" style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                                                    <span>
                                                        {a.descripcion}
                                                        <span className="rel-meta" style={{ marginTop: 4 }}>
                                                            {a.responsable && <span><b>Responsable:</b> {a.responsable}</span>}
                                                            <span className={a.vencida ? "vencido" : ""}><b>Límite:</b> {a.fechaLimite}{a.vencida ? " (vencida)" : ""}</span>
                                                        </span>
                                                    </span>
                                                    {a.estado === "HECHA"
                                                        ? <span className="rel-badge CERRADO">Hecha</span>
                                                        : puedeEditar && i.estado !== "CERRADO" && (
                                                            <button className="rel-btn chico" onClick={() => cumplirAccion(a.idAccion)}><CheckCircle2 size={13} /> Cumplida</button>
                                                        )}
                                                </div>
                                            ))}

                                            {puedeEditar && i.estado !== "CERRADO" && (
                                                <div className="rel-bloque rel-form-grid">
                                                    <div className="rel-campo ancho"><label>Nueva acción correctiva</label>
                                                        <input className="form-input" value={accionDesc} maxLength={300} onChange={(e) => setAccionDesc(e.target.value)} placeholder="Qué hay que hacer" /></div>
                                                    <div className="rel-campo"><label>Responsable</label>
                                                        <input className="form-input" value={accionResp} maxLength={120} onChange={(e) => setAccionResp(e.target.value)} /></div>
                                                    <div className="rel-campo"><label>Fecha límite</label>
                                                        <input type="date" className="form-input" value={accionFecha} min={i.fecha} onChange={(e) => setAccionFecha(e.target.value)} /></div>
                                                    <div className="rel-form-pie"><button className="rel-btn" onClick={() => agregarAccion(i)}>Agregar acción</button></div>
                                                </div>
                                            )}

                                            {puedeEditar && i.estado !== "CERRADO" && (
                                                <div className="rel-cierre">
                                                    <div className="rel-campo">
                                                        <label>Causas de la investigación * (para cerrar)</label>
                                                        <textarea className="form-input" value={causas} maxLength={500} onChange={(e) => setCausas(e.target.value)}
                                                            placeholder="Causas inmediatas y causas raíz" />
                                                    </div>
                                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                                        {i.estado === "ABIERTO" && <button className="rel-btn azul" onClick={() => cambiarEstado(i, "EN_INVESTIGACION")}>Iniciar investigación</button>}
                                                        {i.estado === "EN_INVESTIGACION" && (
                                                            <button className="rel-btn rojo" onClick={() => cambiarEstado(i, "CERRADO")}><Lock size={14} /> Cerrar evento</button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {puedeEditar && i.estado === "CERRADO" && (
                                                <div><button className="rel-btn ambar" onClick={() => cambiarEstado(i, "EN_INVESTIGACION")}><Unlock size={14} /> Reabrir</button></div>
                                            )}
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default IncidentesComponent;
