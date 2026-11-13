import React, { useEffect, useState } from "react";
import { GraduationCap, PenLine, Trash2, UserPlus } from "lucide-react";
import api from "../../service/api";
import { tienePermiso } from "../../service/authHelper";
import { textoError, hoyISO, cabeceras } from "../../service/errores";
import "../insumos/insumos.css";
import "../relevamientos/relevamientos.css";
import FirmaCanvas from "../firma/FirmaCanvas";
import type { Empresa } from "../../interfaces/Empresa";
import type { Capacitacion, ResumenCapacitaciones, SemaforoCapacitacion } from "../../interfaces/Sst";

// Los semáforos reutilizan las clases de color de severidad: verde / amarillo / rojo.
const CLASE: Record<SemaforoCapacitacion, string> = { VIGENTE: "BAJO", SIN_VENCIMIENTO: "BORRADOR", PROGRAMADA: "EN_CURSO", POR_VENCER: "MEDIO", VENCIDO: "CRITICO" };
const TEXTO: Record<SemaforoCapacitacion, string> = { VIGENTE: "Vigente", SIN_VENCIMIENTO: "No vence", PROGRAMADA: "Programada", POR_VENCER: "Por vencer", VENCIDO: "Vencido" };

const CapacitacionesComponent: React.FC = () => {
    const puedeVer = tienePermiso("VER_CAPACITACIONES");
    const puedeCrear = tienePermiso("CREAR_CAPACITACIONES");
    const puedeEliminar = tienePermiso("ELIMINAR_CAPACITACIONES");

    const [lista, setLista] = useState<Capacitacion[]>([]);
    const [resumen, setResumen] = useState<ResumenCapacitaciones | null>(null);
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [abierta, setAbierta] = useState<number | null>(null);

    const [idEmpresa, setIdEmpresa] = useState<number | "">("");
    const [tema, setTema] = useState("");
    const [fecha, setFecha] = useState(hoyISO());
    const [duracion, setDuracion] = useState("2");
    const [instructor, setInstructor] = useState("");
    const [vigencia, setVigencia] = useState("12");

    const [nombre, setNombre] = useState("");
    const [dni, setDni] = useState("");
    const [firmandoId, setFirmandoId] = useState<number | null>(null);
    const [firma, setFirma] = useState<string | null>(null);

    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [errorDetalle, setErrorDetalle] = useState("");

    const cargar = async () => {
        try {
            const [l, r] = await Promise.all([api.get("/capacitaciones", cabeceras()), api.get("/capacitaciones/resumen", cabeceras())]);
            setLista(Array.isArray(l.data) ? l.data : []);
            setResumen(r.data);
        } catch (err) { console.error("Error al cargar capacitaciones", err); }
    };

    useEffect(() => {
        if (!puedeVer) return;
        cargar();
        api.get("/empresas", cabeceras()).then((r) => setEmpresas(Array.isArray(r.data) ? r.data.filter((e: Empresa) => e.activo) : [])).catch(() => setEmpresas([]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCrear = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setMensaje("");
        try {
            await api.post("/capacitaciones", { idEmpresa: idEmpresa || null, tema, fecha, duracionHoras: duracion, instructor, vigenciaMeses: vigencia }, cabeceras());
            setMensaje("Capacitación cargada.");
            setTema(""); setInstructor("");
            await cargar();
        } catch (err: any) { setError(textoError(err, "Error al cargar la capacitación.")); }
    };

    const ejecutar = async (accion: () => Promise<unknown>, porDefecto: string) => {
        setErrorDetalle("");
        try { await accion(); await cargar(); } catch (err: any) { setErrorDetalle(textoError(err, porDefecto)); }
    };

    const agregarAsistente = (c: Capacitacion) => ejecutar(async () => {
        await api.post(`/capacitaciones/${c.idCapacitacion}/asistentes`, { nombre, dni }, cabeceras());
        setNombre(""); setDni("");
    }, "No se pudo agregar al asistente.");

    const guardarFirma = (c: Capacitacion, idAsistente: number) => ejecutar(async () => {
        await api.put(`/capacitaciones/${c.idCapacitacion}/asistentes/${idAsistente}/firmar`, { firma }, cabeceras());
        setFirmandoId(null); setFirma(null);
    }, "No se pudo guardar la firma.");

    const eliminar = async (c: Capacitacion) => {
        if (!window.confirm(`¿Dar de baja la capacitación "${c.tema}"?`)) return;
        await ejecutar(() => api.delete(`/capacitaciones/${c.idCapacitacion}`, cabeceras()), "No se pudo dar de baja.");
    };

    if (!puedeVer) {
        return <div className="insumos-container"><div className="insumos-card"><p className="txt-vacio">No tenés permiso para ver las capacitaciones.</p></div></div>;
    }

    return (
        <div className="insumos-container">
            <div className="insumos-card">
                <h1 style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}><GraduationCap size={24} color="#059669" /> CAPACITACIONES</h1>
                <div className="rel-resumen" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(104px, 1fr))" }}>
                    <div className="rel-dato"><b>{resumen?.total ?? 0}</b><span>Total</span></div>
                    <div className={`rel-dato ${(resumen?.vencidas ?? 0) > 0 ? "alerta" : ""}`}><b>{resumen?.vencidas ?? 0}</b><span>Certificados vencidos</span></div>
                    <div className="rel-dato"><b style={{ color: "#a16207" }}>{resumen?.porVencer ?? 0}</b><span>Por vencer</span></div>
                    <div className="rel-dato"><b>{resumen?.programadas ?? 0}</b><span>Programadas</span></div>
                    <div className={`rel-dato ${(resumen?.sinFirmar ?? 0) > 0 ? "alerta" : ""}`}><b>{resumen?.sinFirmar ?? 0}</b><span>Firmas pendientes</span></div>
                </div>
            </div>

            {puedeCrear && (
                <div className="insumos-card">
                    <h1>CARGAR CAPACITACIÓN</h1>
                    <form onSubmit={handleCrear} className="rel-form-grid">
                        <div className="rel-campo"><label>Empresa / Sede *</label>
                            <select className="form-input" value={idEmpresa} onChange={(e) => setIdEmpresa(e.target.value as unknown as number)} required>
                                <option value="" disabled>Seleccione una empresa</option>
                                {empresas.map((emp) => <option key={emp.idEmpresa} value={emp.idEmpresa}>{emp.nombre}</option>)}
                            </select></div>
                        <div className="rel-campo"><label>Fecha *</label>
                            <input type="date" className="form-input" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
                            <span className="rel-ayuda">Si es una fecha futura queda programada.</span></div>
                        <div className="rel-campo ancho"><label>Tema *</label>
                            <input className="form-input" value={tema} maxLength={200} onChange={(e) => setTema(e.target.value)} required placeholder="Ej: Uso de matafuegos y evacuación" /></div>
                        <div className="rel-campo"><label>Duración (horas) *</label>
                            <input type="number" className="form-input" min={0.5} max={24} step={0.5} value={duracion} onChange={(e) => setDuracion(e.target.value)} required /></div>
                        <div className="rel-campo"><label>Instructor</label>
                            <input className="form-input" value={instructor} maxLength={120} onChange={(e) => setInstructor(e.target.value)} /></div>
                        <div className="rel-campo"><label>Vigencia del certificado (meses)</label>
                            <input type="number" className="form-input" min={0} max={120} step={1} value={vigencia} onChange={(e) => setVigencia(e.target.value)} />
                            <span className="rel-ayuda">0 = no vence.</span></div>
                        <div className="rel-form-pie"><button type="submit" className="rel-btn">Cargar capacitación</button></div>
                    </form>
                    {error && <p className="msg-error">{error}</p>}
                    {mensaje && <p className="msg-exito">{mensaje}</p>}
                </div>
            )}

            <div className="insumos-card">
                <h1>REGISTRO DE CAPACITACIONES</h1>
                {lista.length === 0 ? <p className="rel-vacio">Todavía no hay capacitaciones cargadas.</p> : (
                    <div className="rel-lista">
                        {lista.map((c) => {
                            const abiertaTarjeta = abierta === c.idCapacitacion;
                            return (
                                <article key={c.idCapacitacion} className={`rel-hallazgo sev-${CLASE[c.semaforo] === "BORRADOR" ? "BAJO" : CLASE[c.semaforo] === "EN_CURSO" ? "MEDIO" : CLASE[c.semaforo]}`}>
                                    <div className="rel-hallazgo-top">
                                        <span className={`rel-badge ${CLASE[c.semaforo]}`}>{TEXTO[c.semaforo]}</span>
                                        <span className="rel-meta">{c.fecha}</span>
                                    </div>
                                    <p><b>{c.tema}</b></p>
                                    <div className="rel-meta">
                                        <span><b>Empresa:</b> {c.empresa?.nombre}</span>
                                        <span><b>Duración:</b> {c.duracionHoras} h</span>
                                        {c.instructor && <span><b>Instructor:</b> {c.instructor}</span>}
                                    </div>
                                    <div className="rel-meta">
                                        <span><b>Firmaron:</b> {c.firmados}/{c.totalAsistentes}</span>
                                        {c.fechaVencimientoCertificado && (
                                            <span className={c.semaforo === "VENCIDO" ? "vencido" : ""}><b>Certificado hasta:</b> {c.fechaVencimientoCertificado}
                                                {c.diasRestantes != null && ` (${c.diasRestantes < 0 ? `venció hace ${Math.abs(c.diasRestantes)} días` : `en ${c.diasRestantes} días`})`}</span>
                                        )}
                                    </div>
                                    <div className="rel-hallazgo-acciones">
                                        <button className="rel-btn gris chico" onClick={() => { setErrorDetalle(""); setFirmandoId(null); setAbierta(abiertaTarjeta ? null : c.idCapacitacion); }}>{abiertaTarjeta ? "Ocultar" : "Asistentes"}</button>
                                        {puedeEliminar && <button className="rel-btn rojo chico" onClick={() => eliminar(c)} aria-label="Dar de baja"><Trash2 size={12} /></button>}
                                    </div>

                                    {abiertaTarjeta && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                            {errorDetalle && <div className="rel-aviso error">{errorDetalle}</div>}
                                            {c.asistentes.length === 0 && <p className="rel-vacio" style={{ padding: 10 }}>Todavía no hay asistentes.</p>}
                                            {c.asistentes.map((a) => (
                                                <div key={a.idAsistente} className="rel-reco" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                                        <span>{a.nombre}{a.dni && <span className="rel-ayuda"> · DNI {a.dni}</span>}</span>
                                                        {a.firmado ? <span className="rel-badge CERRADO">Firmó</span> : (puedeCrear && c.semaforo !== "PROGRAMADA" && (
                                                            <button className="rel-btn azul chico" onClick={() => { setFirmandoId(firmandoId === a.idAsistente ? null : a.idAsistente); setFirma(null); }}><PenLine size={12} /> Firmar</button>
                                                        ))}
                                                    </div>
                                                    {firmandoId === a.idAsistente && (
                                                        <>
                                                            <FirmaCanvas onChange={setFirma} />
                                                            <div><button className="rel-btn" disabled={!firma} onClick={() => guardarFirma(c, a.idAsistente)}>Guardar firma</button></div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                            {c.semaforo === "PROGRAMADA" && c.asistentes.length > 0 && <span className="rel-ayuda">La asistencia se firma recién cuando se realiza la capacitación.</span>}
                                            {puedeCrear && (
                                                <div className="rel-bloque rel-form-grid">
                                                    <div className="rel-campo"><label>Nuevo asistente</label>
                                                        <input className="form-input" value={nombre} maxLength={120} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre y apellido" /></div>
                                                    <div className="rel-campo"><label>DNI</label>
                                                        <input className="form-input" value={dni} inputMode="numeric" onChange={(e) => setDni(e.target.value)} placeholder="Opcional" /></div>
                                                    <div className="rel-form-pie"><button className="rel-btn" onClick={() => agregarAsistente(c)}><UserPlus size={14} /> Agregar</button></div>
                                                </div>
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

export default CapacitacionesComponent;
