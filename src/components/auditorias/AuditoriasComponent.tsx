import React, { useEffect, useState } from "react";
import { ClipboardCheck, Lock } from "lucide-react";
import api from "../../service/api";
import { tienePermiso } from "../../service/authHelper";
import { textoError, hoyISO, cabeceras } from "../../service/errores";
import "../insumos/insumos.css";
import "../relevamientos/relevamientos.css";
import type { Empresa } from "../../interfaces/Empresa";
import type { Auditoria, PlantillaAuditoria, ResultadoAuditoria } from "../../interfaces/Sst";

const AuditoriasComponent: React.FC = () => {
    const puedeVer = tienePermiso("VER_AUDITORIAS");
    const puedeCrear = tienePermiso("CREAR_AUDITORIAS");
    const puedeEditar = tienePermiso("EDITAR_AUDITORIAS");

    const [lista, setLista] = useState<Auditoria[]>([]);
    const [plantillas, setPlantillas] = useState<PlantillaAuditoria[]>([]);
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [seleccionada, setSeleccionada] = useState<Auditoria | null>(null);

    const [idEmpresa, setIdEmpresa] = useState<number | "">("");
    const [idPlantilla, setIdPlantilla] = useState<number | "">("");
    const [fecha, setFecha] = useState(hoyISO());

    // Observación que se está escribiendo para un ítem marcado como NO CUMPLE.
    const [pidiendoObs, setPidiendoObs] = useState<number | null>(null);
    const [obs, setObs] = useState("");

    const [error, setError] = useState("");
    const [errorDetalle, setErrorDetalle] = useState("");
    const [mensajeDetalle, setMensajeDetalle] = useState("");

    const cargar = async () => {
        try {
            const r = await api.get("/auditorias", cabeceras());
            setLista(Array.isArray(r.data) ? r.data : []);
        } catch (err) { console.error("Error al cargar auditorías", err); }
    };

    const refrescar = async (id: number) => {
        try {
            const r = await api.get(`/auditorias/${id}`, cabeceras());
            setSeleccionada(r.data);
        } catch (err) { console.error(err); }
        await cargar();
    };

    useEffect(() => {
        if (!puedeVer) return;
        cargar();
        api.get("/auditorias/plantillas", cabeceras()).then((r) => setPlantillas(Array.isArray(r.data) ? r.data : [])).catch(() => setPlantillas([]));
        api.get("/empresas", cabeceras()).then((r) => setEmpresas(Array.isArray(r.data) ? r.data.filter((e: Empresa) => e.activo) : [])).catch(() => setEmpresas([]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const abrir = (a: Auditoria) => {
        setErrorDetalle(""); setMensajeDetalle(""); setPidiendoObs(null); setObs("");
        setSeleccionada(a);
    };

    const handleCrear = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            const r = await api.post("/auditorias", { idEmpresa: idEmpresa || null, idPlantilla: idPlantilla || null, fecha }, cabeceras());
            await cargar();
            abrir(r.data);
        } catch (err: any) { setError(textoError(err, "Error al crear la auditoría.")); }
    };

    const responder = async (idRespuesta: number, resultado: ResultadoAuditoria, observacion?: string) => {
        if (!seleccionada) return;
        setErrorDetalle(""); setMensajeDetalle("");
        try {
            await api.put(`/auditorias/respuestas/${idRespuesta}`, { resultado, observacion }, cabeceras());
            setPidiendoObs(null); setObs("");
            await refrescar(seleccionada.idAuditoria);
        } catch (err: any) { setErrorDetalle(textoError(err, "No se pudo guardar la respuesta.")); }
    };

    const cerrar = async () => {
        if (!seleccionada) return;
        setErrorDetalle(""); setMensajeDetalle("");
        try {
            const r = await api.post(`/auditorias/${seleccionada.idAuditoria}/cerrar`, {}, cabeceras());
            const a: Auditoria = r.data;
            const incumplidos = a.respuestas.filter((x) => x.resultado === "NO_CUMPLE").length;
            setMensajeDetalle(incumplidos > 0
                ? `Auditoría cerrada. Se generó el relevamiento #${a.idRelevamiento} con ${incumplidos} hallazgo${incumplidos > 1 ? "s" : ""}.`
                : "Auditoría cerrada. No hubo incumplimientos: no se generaron hallazgos.");
            await refrescar(seleccionada.idAuditoria);
        } catch (err: any) { setErrorDetalle(textoError(err, "No se pudo cerrar la auditoría.")); }
    };

    if (!puedeVer) {
        return <div className="insumos-container"><div className="insumos-card"><p className="txt-vacio">No tenés permiso para ver las auditorías.</p></div></div>;
    }

    const cerrada = seleccionada?.estado === "CERRADA";
    const total = seleccionada?.respuestas.length ?? 0;
    const respondidas = total - (seleccionada?.pendientes ?? 0);

    return (
        <div className="insumos-container">
            {puedeCrear && (
                <div className="insumos-card">
                    <h1 style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}><ClipboardCheck size={24} color="#059669" /> NUEVA AUDITORÍA</h1>
                    <form onSubmit={handleCrear} className="rel-form-grid">
                        <div className="rel-campo"><label>Empresa / Sede *</label>
                            <select className="form-input" value={idEmpresa} onChange={(e) => setIdEmpresa(e.target.value as unknown as number)} required>
                                <option value="" disabled>Seleccione una empresa</option>
                                {empresas.map((emp) => <option key={emp.idEmpresa} value={emp.idEmpresa}>{emp.nombre}</option>)}
                            </select></div>
                        <div className="rel-campo"><label>Plantilla (por rubro) *</label>
                            <select className="form-input" value={idPlantilla} onChange={(e) => setIdPlantilla(e.target.value as unknown as number)} required>
                                <option value="" disabled>Seleccione la plantilla</option>
                                {plantillas.map((p) => <option key={p.idPlantilla} value={p.idPlantilla}>{p.rubro} — {p.nombre} ({p.items.length} ítems)</option>)}
                            </select></div>
                        <div className="rel-campo"><label>Fecha *</label>
                            <input type="date" className="form-input" value={fecha} max={hoyISO()} onChange={(e) => setFecha(e.target.value)} required /></div>
                        <div className="rel-form-pie"><button type="submit" className="rel-btn">Empezar auditoría</button></div>
                    </form>
                    {error && <p className="msg-error">{error}</p>}
                    <p className="rel-ayuda" style={{ marginTop: 8 }}>Al cerrarla, cada ítem que no cumple se convierte en un hallazgo dentro de un relevamiento nuevo.</p>
                </div>
            )}

            <div className="insumos-card">
                <h1>AUDITORÍAS</h1>
                <div className="tabla-simetrica-wrapper">
                    <table className="tabla-insumos tabla-tarjetas-movil">
                        <thead><tr><th>Fecha</th><th>Empresa</th><th>Plantilla</th><th style={{ textAlign: "center" }}>Estado</th><th style={{ textAlign: "center" }}>Cumplimiento</th><th>Acciones</th></tr></thead>
                        <tbody>
                            {lista.length > 0 ? lista.map((a) => (
                                <tr key={a.idAuditoria}>
                                    <td data-label="Fecha">{a.fecha}</td>
                                    <td data-label="Empresa">{a.empresa?.nombre}</td>
                                    <td data-label="Plantilla">{a.plantilla?.nombre}</td>
                                    <td data-label="Estado" style={{ textAlign: "center" }}><span className={`rel-badge ${a.estado === "CERRADA" ? "CERRADO" : "EN_CURSO"}`}>{a.estado === "CERRADA" ? "Cerrada" : `Abierta (${a.pendientes} sin responder)`}</span></td>
                                    <td data-label="Cumplimiento" style={{ textAlign: "center" }}>{a.cumplimiento != null ? `${a.cumplimiento}%` : "—"}</td>
                                    <td data-label="Acciones"><button className="rel-btn azul chico" onClick={() => abrir(a)}>{a.estado === "CERRADA" ? "Ver" : "Continuar"}</button></td>
                                </tr>
                            )) : <tr><td colSpan={6} className="txt-vacio">Todavía no hay auditorías.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {seleccionada && (
                <div className="insumos-card rel-detalle">
                    <div className="rel-head">
                        <div>
                            <h2 className="rel-titulo">{seleccionada.plantilla.nombre}</h2>
                            <p className="rel-subtitulo">{seleccionada.empresa?.nombre} · {seleccionada.fecha} · {respondidas}/{total} ítems respondidos{seleccionada.cumplimiento != null ? ` · Cumplimiento ${seleccionada.cumplimiento}%` : ""}</p>
                        </div>
                        <span className={`rel-badge ${cerrada ? "CERRADO" : "EN_CURSO"}`}>{cerrada ? "Cerrada" : "Abierta"}</span>
                    </div>
                    {errorDetalle && <div className="rel-aviso error">{errorDetalle}</div>}
                    {mensajeDetalle && <div className="rel-aviso exito">{mensajeDetalle}</div>}
                    {cerrada && seleccionada.idRelevamiento && <div className="rel-aviso info">Los incumplimientos están en el relevamiento #{seleccionada.idRelevamiento} (menú Relevamientos).</div>}

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {seleccionada.respuestas.map((r) => (
                            <div key={r.idRespuesta} className="rel-bloque" style={{ display: "flex", flexDirection: "column", gap: 8, borderLeft: `4px solid ${r.resultado === "CUMPLE" ? "#22c55e" : r.resultado === "NO_CUMPLE" ? "#dc2626" : r.resultado === "NO_APLICA" ? "#94a3b8" : "#e2e8f0"}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                                    <span>{r.item.texto} {r.item.critico && <span className="rel-badge CRITICO" style={{ marginLeft: 6 }}>Crítico</span>}</span>
                                    {!cerrada && puedeEditar ? (
                                        <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                            <button className={`rel-btn chico ${r.resultado === "CUMPLE" ? "" : "gris"}`} onClick={() => responder(r.idRespuesta, "CUMPLE")}>Cumple</button>
                                            <button className={`rel-btn chico ${r.resultado === "NO_CUMPLE" ? "rojo" : "gris"}`} onClick={() => { setPidiendoObs(r.idRespuesta); setObs(r.observacion || ""); }}>No cumple</button>
                                            <button className={`rel-btn chico ${r.resultado === "NO_APLICA" ? "azul" : "gris"}`} onClick={() => responder(r.idRespuesta, "NO_APLICA")}>No aplica</button>
                                        </span>
                                    ) : (
                                        <span className={`rel-badge ${r.resultado === "CUMPLE" ? "BAJO" : r.resultado === "NO_CUMPLE" ? "CRITICO" : "BORRADOR"}`}>
                                            {r.resultado === "CUMPLE" ? "Cumple" : r.resultado === "NO_CUMPLE" ? "No cumple" : r.resultado === "NO_APLICA" ? "No aplica" : "Sin responder"}</span>
                                    )}
                                </div>
                                {r.resultado === "NO_CUMPLE" && r.observacion && pidiendoObs !== r.idRespuesta && <div className="rel-reco"><b>Qué se encontró: </b>{r.observacion}</div>}
                                {pidiendoObs === r.idRespuesta && (
                                    <div className="rel-form-grid">
                                        <div className="rel-campo ancho"><label>Qué se encontró *</label>
                                            <input className="form-input" value={obs} maxLength={300} onChange={(e) => setObs(e.target.value)} placeholder="Describí el incumplimiento (mínimo 5 caracteres)" autoFocus /></div>
                                        <div className="rel-form-pie">
                                            <button className="rel-btn gris" onClick={() => setPidiendoObs(null)}>Cancelar</button>
                                            <button className="rel-btn rojo" onClick={() => responder(r.idRespuesta, "NO_CUMPLE", obs)}>Guardar</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {!cerrada && puedeEditar && (
                        <div className="rel-cierre">
                            <p>{seleccionada.pendientes > 0 ? `Faltan responder ${seleccionada.pendientes} ítem${seleccionada.pendientes > 1 ? "s" : ""} para poder cerrar.` : "Todos los ítems están respondidos. Al cerrar, los incumplimientos pasan a ser hallazgos."}</p>
                            <div><button className="rel-btn rojo" disabled={seleccionada.pendientes > 0} onClick={cerrar}><Lock size={14} /> Cerrar auditoría</button></div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AuditoriasComponent;
