import React, { useEffect, useState } from "react";
import { HardHat, PenLine, Trash2 } from "lucide-react";
import api from "../../service/api";
import { tienePermiso } from "../../service/authHelper";
import { textoError, cabeceras } from "../../service/errores";
import "../insumos/insumos.css";
import "../relevamientos/relevamientos.css";
import FirmaCanvas from "../firma/FirmaCanvas";
import type { ConstanciaEpp, ResumenEpp, Semaforo } from "../../interfaces/Sst";

interface UsuarioLista { idUsuario: number; nombre: string; apellido: string; activo?: boolean; }
interface InsumoLista { idInsumo: number; nombre: string; categoria: string; stockActual: number; unidadMedida?: string; activo?: boolean; }

const CLASE: Record<Semaforo, string> = { VIGENTE: "BAJO", POR_VENCER: "MEDIO", VENCIDO: "CRITICO" };
const TEXTO: Record<Semaforo, string> = { VIGENTE: "Al día", POR_VENCER: "Por reponer", VENCIDO: "Reposición vencida" };

const EppComponent: React.FC = () => {
    const puedeVer = tienePermiso("VER_EPP");
    const puedeCrear = tienePermiso("CREAR_EPP");
    const puedeEliminar = tienePermiso("ELIMINAR_EPP");

    const [lista, setLista] = useState<ConstanciaEpp[]>([]);
    const [resumen, setResumen] = useState<ResumenEpp | null>(null);
    const [usuarios, setUsuarios] = useState<UsuarioLista[]>([]);
    const [insumos, setInsumos] = useState<InsumoLista[]>([]);

    const [idUsuario, setIdUsuario] = useState<number | "">("");
    const [idInsumo, setIdInsumo] = useState<number | "">("");
    const [cantidad, setCantidad] = useState("1");
    const [meses, setMeses] = useState("6");
    const [observaciones, setObservaciones] = useState("");
    const [firma, setFirma] = useState<string | null>(null);
    const [reinicioFirma, setReinicioFirma] = useState(0);

    const [firmandoId, setFirmandoId] = useState<number | null>(null);
    const [firmaPosterior, setFirmaPosterior] = useState<string | null>(null);

    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    const cargar = async () => {
        try {
            const [l, r, i] = await Promise.all([api.get("/epp/constancias", cabeceras()), api.get("/epp/resumen", cabeceras()), api.get("/insumos", cabeceras())]);
            setLista(Array.isArray(l.data) ? l.data : []);
            setResumen(r.data);
            setInsumos(Array.isArray(i.data) ? i.data.filter((x: InsumoLista) => x.categoria === "EPP" && x.activo !== false) : []);
        } catch (err) { console.error("Error al cargar EPP", err); }
    };

    useEffect(() => {
        if (!puedeVer) return;
        cargar();
        api.get("/usuarios", cabeceras()).then((r) => setUsuarios(Array.isArray(r.data) ? r.data.filter((u: UsuarioLista) => u.activo !== false) : [])).catch(() => setUsuarios([]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const insumoElegido = insumos.find((i) => i.idInsumo === Number(idInsumo));

    const handleCrear = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setMensaje("");
        try {
            await api.post("/epp/constancias", { idUsuario: idUsuario || null, idInsumo: idInsumo || null, cantidad, mesesReposicion: meses, observaciones, firma: firma || undefined }, cabeceras());
            setMensaje(firma ? "Entrega registrada y firmada. Se descontó del stock." : "Entrega registrada. Falta la firma del trabajador.");
            setObservaciones(""); setFirma(null); setReinicioFirma((n) => n + 1);
            await cargar();
        } catch (err: any) { setError(textoError(err, "Error al registrar la entrega.")); }
    };

    const guardarFirma = async (id: number) => {
        setError(""); setMensaje("");
        try {
            await api.put(`/epp/constancias/${id}/firmar`, { firma: firmaPosterior }, cabeceras());
            setFirmandoId(null); setFirmaPosterior(null);
            await cargar();
        } catch (err: any) { setError(textoError(err, "No se pudo guardar la firma.")); }
    };

    const eliminar = async (id: number) => {
        if (!window.confirm("¿Dar de baja esta constancia? El stock no se devuelve.")) return;
        try { await api.delete(`/epp/constancias/${id}`, cabeceras()); await cargar(); } catch (err: any) { setError(textoError(err, "No se pudo dar de baja.")); }
    };

    if (!puedeVer) {
        return <div className="insumos-container"><div className="insumos-card"><p className="txt-vacio">No tenés permiso para ver las entregas de EPP.</p></div></div>;
    }

    return (
        <div className="insumos-container">
            <div className="insumos-card">
                <h1 style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}><HardHat size={24} color="#059669" /> ENTREGA DE EPP CON FIRMA</h1>
                <div className="rel-resumen" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
                    <div className="rel-dato"><b>{resumen?.total ?? 0}</b><span>Constancias</span></div>
                    <div className={`rel-dato ${(resumen?.sinFirmar ?? 0) > 0 ? "alerta" : ""}`}><b>{resumen?.sinFirmar ?? 0}</b><span>Sin firmar</span></div>
                    <div className="rel-dato"><b style={{ color: "#a16207" }}>{resumen?.porReponer ?? 0}</b><span>Por reponer</span></div>
                    <div className={`rel-dato ${(resumen?.reposicionVencida ?? 0) > 0 ? "alerta" : ""}`}><b>{resumen?.reposicionVencida ?? 0}</b><span>Reposición vencida</span></div>
                </div>
            </div>

            {puedeCrear && (
                <div className="insumos-card">
                    <h1>REGISTRAR ENTREGA</h1>
                    <form onSubmit={handleCrear} className="rel-form-grid">
                        <div className="rel-campo"><label>Trabajador *</label>
                            <select className="form-input" value={idUsuario} onChange={(e) => setIdUsuario(e.target.value as unknown as number)} required>
                                <option value="" disabled>Seleccione al trabajador</option>
                                {usuarios.map((u) => <option key={u.idUsuario} value={u.idUsuario}>{u.nombre} {u.apellido}</option>)}
                            </select></div>
                        <div className="rel-campo"><label>Elemento de protección *</label>
                            <select className="form-input" value={idInsumo} onChange={(e) => setIdInsumo(e.target.value as unknown as number)} required>
                                <option value="" disabled>Seleccione el EPP</option>
                                {insumos.map((i) => <option key={i.idInsumo} value={i.idInsumo}>{i.nombre} (stock {i.stockActual})</option>)}
                            </select></div>
                        <div className="rel-campo"><label>Cantidad *</label>
                            <input type="number" className="form-input" min={1} max={insumoElegido?.stockActual} step={1} value={cantidad} onChange={(e) => setCantidad(e.target.value)} required />
                            {insumoElegido && <span className="rel-ayuda">Disponible: {insumoElegido.stockActual}</span>}</div>
                        <div className="rel-campo"><label>Reposición en (meses) *</label>
                            <input type="number" className="form-input" min={1} max={60} step={1} value={meses} onChange={(e) => setMeses(e.target.value)} required /></div>
                        <div className="rel-campo ancho"><label>Observaciones</label>
                            <input className="form-input" value={observaciones} maxLength={500} onChange={(e) => setObservaciones(e.target.value)} placeholder="Opcional" /></div>
                        <div className="rel-campo ancho"><label>Firma del trabajador (podés firmar ahora o después)</label>
                            <FirmaCanvas key={reinicioFirma} onChange={setFirma} /></div>
                        <div className="rel-form-pie"><button type="submit" className="rel-btn">Registrar entrega</button></div>
                    </form>
                    {error && <p className="msg-error">{error}</p>}
                    {mensaje && <p className="msg-exito">{mensaje}</p>}
                </div>
            )}

            <div className="insumos-card">
                <h1>CONSTANCIAS DE ENTREGA</h1>
                {!puedeCrear && error && <p className="msg-error">{error}</p>}
                <div className="tabla-simetrica-wrapper">
                    <table className="tabla-insumos tabla-tarjetas-movil">
                        <thead><tr><th>Trabajador</th><th>Elemento</th><th style={{ textAlign: "center" }}>Cant.</th><th>Entrega</th><th>Reposición</th><th style={{ textAlign: "center" }}>Firma</th><th>Acciones</th></tr></thead>
                        <tbody>
                            {lista.length > 0 ? lista.map((c) => (
                                <React.Fragment key={c.idConstancia}>
                                    <tr>
                                        <td data-label="Trabajador">{c.entrega.usuario.nombre} {c.entrega.usuario.apellido}</td>
                                        <td data-label="Elemento">{c.entrega.insumo.nombre}</td>
                                        <td data-label="Cant." style={{ textAlign: "center" }}>{c.entrega.cantidad}</td>
                                        <td data-label="Entrega">{c.entrega.fechaEntrega}</td>
                                        <td data-label="Reposición">{c.fechaReposicion}<span style={{ display: "block", marginTop: 4 }}><span className={`rel-badge ${CLASE[c.semaforo]}`}>{TEXTO[c.semaforo]}</span></span></td>
                                        <td data-label="Firma" style={{ textAlign: "center" }}>{c.firmada ? <span className="rel-badge CERRADO">Firmada</span> : <span className="rel-badge CRITICO">Pendiente</span>}</td>
                                        <td data-label="Acciones">
                                            <div className="rel-acciones-tabla">
                                                {!c.firmada && puedeCrear && <button className="rel-btn azul chico" onClick={() => { setFirmandoId(firmandoId === c.idConstancia ? null : c.idConstancia); setFirmaPosterior(null); }}><PenLine size={12} /> Firmar</button>}
                                                {puedeEliminar && <button className="rel-btn rojo chico" onClick={() => eliminar(c.idConstancia)} aria-label="Dar de baja"><Trash2 size={12} /></button>}
                                            </div>
                                        </td>
                                    </tr>
                                    {firmandoId === c.idConstancia && (
                                        <tr><td colSpan={7}>
                                            <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column", gap: 8, padding: 8 }}>
                                                <b style={{ fontSize: "0.85rem" }}>Firma de {c.entrega.usuario.nombre} {c.entrega.usuario.apellido}</b>
                                                <FirmaCanvas onChange={setFirmaPosterior} />
                                                <div><button className="rel-btn" disabled={!firmaPosterior} onClick={() => guardarFirma(c.idConstancia)}>Guardar firma</button></div>
                                            </div>
                                        </td></tr>
                                    )}
                                </React.Fragment>
                            )) : <tr><td colSpan={7} className="txt-vacio">No hay entregas registradas todavía.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EppComponent;
