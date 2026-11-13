import React, { useEffect, useState } from "react";
import { Siren, Trash2 } from "lucide-react";
import api from "../../service/api";
import { tienePermiso } from "../../service/authHelper";
import { textoError, hoyISO, cabeceras } from "../../service/errores";
import "../insumos/insumos.css";
import "../relevamientos/relevamientos.css";
import type { Empresa } from "../../interfaces/Empresa";
import type { Simulacro, Brigadista, ResumenEmergencia, RolBrigada, TipoSimulacro } from "../../interfaces/Sst";

const TIPOS: Record<TipoSimulacro, string> = { EVACUACION: "Evacuación", INCENDIO: "Incendio", SISMO: "Sismo", DERRAME: "Derrame", OTRO: "Otro" };
const ROLES: Record<RolBrigada, string> = { JEFE_EMERGENCIA: "Jefe de emergencia", EVACUACION: "Evacuación", PRIMEROS_AUXILIOS: "Primeros auxilios", CONTRA_INCENDIO: "Contra incendio" };
const SEMAFORO: Record<string, { clase: string; texto: string }> = {
    SIN_SIMULACROS: { clase: "CRITICO", texto: "Sin simulacros realizados" },
    VIGENTE: { clase: "BAJO", texto: "Simulacros al día" },
    POR_VENCER: { clase: "MEDIO", texto: "Toca hacer un simulacro pronto" },
    VENCIDO: { clase: "CRITICO", texto: "Simulacro vencido" },
};

const EmergenciasComponent: React.FC = () => {
    const puedeVer = tienePermiso("VER_EMERGENCIAS");
    const puedeCrear = tienePermiso("CREAR_EMERGENCIAS");
    const puedeEditar = tienePermiso("EDITAR_EMERGENCIAS");
    const puedeEliminar = tienePermiso("ELIMINAR_EMERGENCIAS");

    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [idEmpresa, setIdEmpresa] = useState<number | "">("");
    const [resumen, setResumen] = useState<ResumenEmergencia | null>(null);
    const [simulacros, setSimulacros] = useState<Simulacro[]>([]);
    const [brigada, setBrigada] = useState<Brigadista[]>([]);

    const [tipo, setTipo] = useState<TipoSimulacro>("EVACUACION");
    const [fecha, setFecha] = useState(hoyISO());
    const [objetivo, setObjetivo] = useState("180");
    const [obsSim, setObsSim] = useState("");

    const [cargandoId, setCargandoId] = useState<number | null>(null);
    const [participantes, setParticipantes] = useState("");
    const [tiempo, setTiempo] = useState("");

    const [nombre, setNombre] = useState("");
    const [rol, setRol] = useState<RolBrigada>("JEFE_EMERGENCIA");
    const [telefono, setTelefono] = useState("");

    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    const cargar = async (id: number | "") => {
        if (!id) return;
        try {
            const [r, s, b] = await Promise.all([
                api.get(`/emergencias/resumen?idEmpresa=${id}`, cabeceras()),
                api.get(`/emergencias/simulacros?idEmpresa=${id}`, cabeceras()),
                api.get(`/emergencias/brigadistas?idEmpresa=${id}`, cabeceras()),
            ]);
            setResumen(r.data);
            setSimulacros(Array.isArray(s.data) ? s.data : []);
            setBrigada(Array.isArray(b.data) ? b.data : []);
        } catch (err) { console.error("Error al cargar emergencias", err); }
    };

    useEffect(() => {
        if (!puedeVer) return;
        api.get("/empresas", cabeceras()).then((r) => {
            const activas: Empresa[] = Array.isArray(r.data) ? r.data.filter((e: Empresa) => e.activo) : [];
            setEmpresas(activas);
            if (activas.length > 0) { setIdEmpresa(activas[0].idEmpresa as number); cargar(activas[0].idEmpresa as number); }
        }).catch(() => setEmpresas([]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const ejecutar = async (accion: () => Promise<unknown>, porDefecto: string, exito?: string) => {
        setError(""); setMensaje("");
        try { await accion(); if (exito) setMensaje(exito); await cargar(idEmpresa); } catch (err: any) { setError(textoError(err, porDefecto)); }
    };

    const crearSimulacro = (e: React.FormEvent) => {
        e.preventDefault();
        return ejecutar(() => api.post("/emergencias/simulacros", { idEmpresa, tipo, fecha, objetivoSeg: objetivo, observaciones: obsSim }, cabeceras()),
            "No se pudo cargar el simulacro.", new Date(fecha) > new Date() ? "Simulacro programado." : "Simulacro cargado: falta registrar el resultado.");
    };

    const registrarResultado = (id: number) => ejecutar(async () => {
        await api.put(`/emergencias/simulacros/${id}/resultado`, { participantes, tiempoEvacuacionSeg: tiempo }, cabeceras());
        setCargandoId(null); setParticipantes(""); setTiempo("");
    }, "No se pudo registrar el resultado.", "Resultado registrado.");

    const crearBrigadista = (e: React.FormEvent) => {
        e.preventDefault();
        return ejecutar(async () => {
            await api.post("/emergencias/brigadistas", { idEmpresa, nombre, rol, telefono }, cabeceras());
            setNombre(""); setTelefono("");
        }, "No se pudo cargar al brigadista.", "Brigadista cargado.");
    };

    if (!puedeVer) {
        return <div className="insumos-container"><div className="insumos-card"><p className="txt-vacio">No tenés permiso para ver el plan de emergencia.</p></div></div>;
    }

    const sem = resumen ? SEMAFORO[resumen.semaforoSimulacros] : null;
    const hoy = hoyISO();

    return (
        <div className="insumos-container">
            <div className="insumos-card">
                <h1 style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}><Siren size={24} color="#dc2626" /> PLAN DE EMERGENCIA Y SIMULACROS</h1>
                <div className="rel-campo" style={{ maxWidth: 360, marginBottom: 14 }}>
                    <label>Empresa / Sede</label>
                    <select className="form-input" value={idEmpresa} onChange={(e) => { const v = e.target.value as unknown as number; setIdEmpresa(v); setError(""); setMensaje(""); cargar(v); }}>
                        {empresas.map((emp) => <option key={emp.idEmpresa} value={emp.idEmpresa}>{emp.nombre}</option>)}
                    </select>
                </div>
                {resumen && sem && (
                    <div className="rel-resumen" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
                        <div className="rel-dato"><span className={`rel-badge ${sem.clase}`}>{sem.texto}</span><span style={{ display: "block", marginTop: 6 }}>Ciclo de {resumen.cicloDias} días</span></div>
                        <div className="rel-dato"><b>{resumen.diasDesdeUltimoSimulacro ?? "—"}</b><span>Días desde el último simulacro</span></div>
                        <div className="rel-dato"><b>{resumen.simulacrosRealizados}</b><span>Simulacros realizados</span></div>
                        <div className={`rel-dato ${resumen.brigadaCompleta ? "" : "alerta"}`}><b>{resumen.brigadistas}</b><span>{resumen.brigadaCompleta ? "Brigadistas · brigada completa" : `Brigadistas · faltan: ${resumen.rolesFaltantes.map((r) => ROLES[r]).join(", ")}`}</span></div>
                    </div>
                )}
                {error && <div className="rel-aviso error" style={{ marginTop: 12 }}>{error}</div>}
                {mensaje && <div className="rel-aviso exito" style={{ marginTop: 12 }}>{mensaje}</div>}
            </div>

            <div className="insumos-card">
                <h1>SIMULACROS</h1>
                {puedeCrear && (
                    <form onSubmit={crearSimulacro} className="rel-bloque rel-form-grid" style={{ marginBottom: 14 }}>
                        <div className="rel-campo"><label>Tipo *</label>
                            <select className="form-input" value={tipo} onChange={(e) => setTipo(e.target.value as TipoSimulacro)}>
                                {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select></div>
                        <div className="rel-campo"><label>Fecha *</label>
                            <input type="date" className="form-input" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
                            <span className="rel-ayuda">Futura = programado. Pasada = cargar el resultado.</span></div>
                        <div className="rel-campo"><label>Tiempo objetivo (segundos)</label>
                            <input type="number" className="form-input" min={30} max={3600} step={1} value={objetivo} onChange={(e) => setObjetivo(e.target.value)} /></div>
                        <div className="rel-campo ancho"><label>Observaciones</label>
                            <input className="form-input" value={obsSim} maxLength={500} onChange={(e) => setObsSim(e.target.value)} placeholder="Opcional" /></div>
                        <div className="rel-form-pie"><button type="submit" className="rel-btn">Cargar simulacro</button></div>
                    </form>
                )}
                {simulacros.length === 0 ? <p className="rel-vacio">Todavía no hay simulacros cargados para esta empresa.</p> : (
                    <div className="rel-lista">
                        {simulacros.map((s) => (
                            <article key={s.idSimulacro} className={`rel-hallazgo sev-${s.estado === "PROGRAMADO" ? "MEDIO" : s.cumpleObjetivo ? "BAJO" : "CRITICO"}`}>
                                <div className="rel-hallazgo-top">
                                    <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                        <span className={`rel-badge ${s.estado === "REALIZADO" ? "CERRADO" : "EN_CURSO"}`}>{s.estado === "REALIZADO" ? "Realizado" : "Programado"}</span>
                                        {s.estado === "REALIZADO" && <span className={`rel-badge ${s.cumpleObjetivo ? "BAJO" : "CRITICO"}`}>{s.cumpleObjetivo ? "Cumplió el objetivo" : "No cumplió el objetivo"}</span>}
                                    </span>
                                    <span className="rel-meta">{s.fecha}</span>
                                </div>
                                <p><b>{TIPOS[s.tipo]}</b></p>
                                <div className="rel-meta">
                                    <span><b>Objetivo:</b> {s.objetivoSeg} s</span>
                                    {s.tiempoEvacuacionSeg != null && <span><b>Tiempo logrado:</b> {s.tiempoEvacuacionSeg} s</span>}
                                    {s.participantes != null && <span><b>Participantes:</b> {s.participantes}</span>}
                                </div>
                                {s.observaciones && <div className="rel-reco">{s.observaciones}</div>}
                                <div className="rel-hallazgo-acciones">
                                    {puedeEditar && s.estado === "PROGRAMADO" && s.fecha <= hoy && <button className="rel-btn azul chico" onClick={() => { setCargandoId(cargandoId === s.idSimulacro ? null : s.idSimulacro); setParticipantes(""); setTiempo(""); }}>Registrar resultado</button>}
                                    {puedeEliminar && <button className="rel-btn rojo chico" onClick={() => { if (window.confirm("¿Dar de baja este simulacro?")) ejecutar(() => api.delete(`/emergencias/simulacros/${s.idSimulacro}`, cabeceras()), "No se pudo dar de baja."); }} aria-label="Dar de baja"><Trash2 size={12} /></button>}
                                </div>
                                {cargandoId === s.idSimulacro && (
                                    <div className="rel-form-grid">
                                        <div className="rel-campo"><label>Participantes *</label>
                                            <input type="number" className="form-input" min={1} step={1} value={participantes} onChange={(e) => setParticipantes(e.target.value)} /></div>
                                        <div className="rel-campo"><label>Tiempo de evacuación (s) *</label>
                                            <input type="number" className="form-input" min={1} step={1} value={tiempo} onChange={(e) => setTiempo(e.target.value)} /></div>
                                        <div className="rel-form-pie"><button className="rel-btn" onClick={() => registrarResultado(s.idSimulacro)}>Guardar resultado</button></div>
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </div>

            <div className="insumos-card">
                <h1>BRIGADA DE EMERGENCIA</h1>
                {puedeCrear && (
                    <form onSubmit={crearBrigadista} className="rel-bloque rel-form-grid" style={{ marginBottom: 14 }}>
                        <div className="rel-campo"><label>Nombre *</label>
                            <input className="form-input" value={nombre} maxLength={120} onChange={(e) => setNombre(e.target.value)} required /></div>
                        <div className="rel-campo"><label>Rol *</label>
                            <select className="form-input" value={rol} onChange={(e) => setRol(e.target.value as RolBrigada)}>
                                {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select></div>
                        <div className="rel-campo"><label>Teléfono</label>
                            <input className="form-input" value={telefono} maxLength={30} onChange={(e) => setTelefono(e.target.value)} placeholder="Opcional" /></div>
                        <div className="rel-form-pie"><button type="submit" className="rel-btn">Agregar a la brigada</button></div>
                    </form>
                )}
                <div className="tabla-simetrica-wrapper">
                    <table className="tabla-insumos tabla-tarjetas-movil">
                        <thead><tr><th>Nombre</th><th>Rol</th><th>Teléfono</th><th>Acciones</th></tr></thead>
                        <tbody>
                            {brigada.length > 0 ? brigada.map((b) => (
                                <tr key={b.idBrigadista}>
                                    <td data-label="Nombre">{b.nombre}</td>
                                    <td data-label="Rol"><span className={`rel-badge ${b.rol === "JEFE_EMERGENCIA" ? "EN_CURSO" : "BORRADOR"}`}>{ROLES[b.rol]}</span></td>
                                    <td data-label="Teléfono">{b.telefono || "—"}</td>
                                    <td data-label="Acciones">{puedeEliminar && <button className="rel-btn rojo chico" onClick={() => { if (window.confirm(`¿Dar de baja a ${b.nombre}?`)) ejecutar(() => api.delete(`/emergencias/brigadistas/${b.idBrigadista}`, cabeceras()), "No se pudo dar de baja."); }} aria-label="Dar de baja"><Trash2 size={12} /></button>}</td>
                                </tr>
                            )) : <tr><td colSpan={4} className="txt-vacio">No hay brigadistas cargados para esta empresa.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EmergenciasComponent;
