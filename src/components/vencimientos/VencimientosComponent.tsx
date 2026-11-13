import React, { useEffect, useState } from "react";
import { CalendarClock, RefreshCw, Trash2 } from "lucide-react";
import api from "../../service/api";
import { tienePermiso } from "../../service/authHelper";
import { textoError, hoyISO } from "../../service/errores";
import "../insumos/insumos.css";
import "../relevamientos/relevamientos.css";
import type { Empresa } from "../../interfaces/Empresa";
import type { Vencimiento, ResumenVencimientos, TipoVencimiento, Semaforo } from "../../interfaces/Sst";

const obtenerHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

const TIPOS: { valor: TipoVencimiento; texto: string }[] = [
    { valor: "MATAFUEGOS", texto: "Matafuegos" },
    { valor: "HABILITACION", texto: "Habilitación" },
    { valor: "SEGURO", texto: "Seguro" },
    { valor: "ART", texto: "ART" },
    { valor: "MEDICION", texto: "Medición (ruido, iluminación, PAT)" },
    { valor: "CAPACITACION", texto: "Capacitación" },
    { valor: "OTRO", texto: "Otro" },
];

// El semáforo reutiliza los colores de severidad: verde / amarillo / rojo.
const CLASE_SEMAFORO: Record<Semaforo, string> = { VIGENTE: "BAJO", POR_VENCER: "MEDIO", VENCIDO: "CRITICO" };
const TEXTO_SEMAFORO: Record<Semaforo, string> = { VIGENTE: "Vigente", POR_VENCER: "Por vencer", VENCIDO: "Vencido" };

const VencimientosComponent: React.FC = () => {
    const puedeVer = tienePermiso("VER_VENCIMIENTOS");
    const puedeCrear = tienePermiso("CREAR_VENCIMIENTOS");
    const puedeEditar = tienePermiso("EDITAR_VENCIMIENTOS");
    const puedeEliminar = tienePermiso("ELIMINAR_VENCIMIENTOS");

    const [lista, setLista] = useState<Vencimiento[]>([]);
    const [resumen, setResumen] = useState<ResumenVencimientos | null>(null);
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [filtro, setFiltro] = useState<"TODOS" | Semaforo>("TODOS");

    const [idEmpresa, setIdEmpresa] = useState<number | "">("");
    const [tipo, setTipo] = useState<TipoVencimiento>("MATAFUEGOS");
    const [descripcion, setDescripcion] = useState("");
    const [fechaVencimiento, setFechaVencimiento] = useState("");
    const [notas, setNotas] = useState("");

    const [renovandoId, setRenovandoId] = useState<number | null>(null);
    const [nuevaFecha, setNuevaFecha] = useState("");

    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    const cargar = async () => {
        try {
            const [l, r] = await Promise.all([api.get("/vencimientos", obtenerHeaders()), api.get("/vencimientos/resumen", obtenerHeaders())]);
            setLista(Array.isArray(l.data) ? l.data : []);
            setResumen(r.data);
        } catch (err) {
            console.error("Error al cargar vencimientos", err);
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
        setError(""); setMensaje("");
        try {
            await api.post("/vencimientos", { idEmpresa: idEmpresa || null, tipo, descripcion, fechaVencimiento: fechaVencimiento || null, notas }, obtenerHeaders());
            setMensaje("Vencimiento cargado.");
            setDescripcion(""); setFechaVencimiento(""); setNotas("");
            await cargar();
        } catch (err: any) {
            setError(textoError(err, "Error al cargar el vencimiento."));
        }
    };

    const handleRenovar = async (id: number) => {
        setError(""); setMensaje("");
        try {
            await api.put(`/vencimientos/${id}/renovar`, { fechaVencimiento: nuevaFecha || null }, obtenerHeaders());
            setRenovandoId(null); setNuevaFecha("");
            setMensaje("Vencimiento renovado.");
            await cargar();
        } catch (err: any) {
            setError(textoError(err, "No se pudo renovar."));
        }
    };

    const handleEliminar = async (id: number) => {
        if (!window.confirm("¿Dar de baja este vencimiento?")) return;
        setError(""); setMensaje("");
        try {
            await api.delete(`/vencimientos/${id}`, obtenerHeaders());
            await cargar();
        } catch (err: any) {
            setError(textoError(err, "No se pudo eliminar."));
        }
    };

    if (!puedeVer) {
        return (
            <div className="insumos-container"><div className="insumos-card">
                <p className="txt-vacio">No tenés permiso para ver los vencimientos.</p>
            </div></div>
        );
    }

    const visibles = filtro === "TODOS" ? lista : lista.filter((v) => v.semaforo === filtro);
    const textoDias = (v: Vencimiento) =>
        v.diasRestantes < 0 ? `hace ${Math.abs(v.diasRestantes)} día${v.diasRestantes === -1 ? "" : "s"}` : v.diasRestantes === 0 ? "vence hoy" : `en ${v.diasRestantes} día${v.diasRestantes === 1 ? "" : "s"}`;

    return (
        <div className="insumos-container">
            <div className="insumos-card">
                <h1 style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
                    <CalendarClock size={24} color="#059669" /> VENCIMIENTOS Y LEGAJO LEGAL
                </h1>
                <div className="rel-resumen">
                    <div className="rel-dato"><b>{resumen?.total ?? 0}</b><span>Total</span></div>
                    <div className={`rel-dato ${(resumen?.vencidos ?? 0) > 0 ? "alerta" : ""}`}><b>{resumen?.vencidos ?? 0}</b><span>Vencidos</span></div>
                    <div className="rel-dato"><b style={{ color: "#a16207" }}>{resumen?.porVencer ?? 0}</b><span>Por vencer ({resumen?.diasAviso ?? 30} días)</span></div>
                    <div className="rel-dato"><b style={{ color: "#15803d" }}>{resumen?.vigentes ?? 0}</b><span>Vigentes</span></div>
                </div>
            </div>

            {puedeCrear && (
                <div className="insumos-card">
                    <h1>CARGAR VENCIMIENTO</h1>
                    <form onSubmit={handleCrear} className="rel-form-grid">
                        <div className="rel-campo">
                            <label>Empresa / Sede *</label>
                            <select className="form-input" value={idEmpresa} onChange={(e) => setIdEmpresa(e.target.value as unknown as number)} required>
                                <option value="" disabled>Seleccione una empresa</option>
                                {empresas.map((emp) => <option key={emp.idEmpresa} value={emp.idEmpresa}>{emp.nombre}</option>)}
                            </select>
                        </div>
                        <div className="rel-campo">
                            <label>Tipo *</label>
                            <select className="form-input" value={tipo} onChange={(e) => setTipo(e.target.value as TipoVencimiento)}>
                                {TIPOS.map((t) => <option key={t.valor} value={t.valor}>{t.texto}</option>)}
                            </select>
                        </div>
                        <div className="rel-campo">
                            <label>Vence el *</label>
                            <input type="date" className="form-input" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} required />
                        </div>
                        <div className="rel-campo ancho">
                            <label>Descripción *</label>
                            <input className="form-input" value={descripcion} maxLength={200} onChange={(e) => setDescripcion(e.target.value)} required
                                placeholder="Ej: Matafuego ABC 5 kg — depósito, recarga anual" />
                        </div>
                        <div className="rel-campo ancho">
                            <label>Notas</label>
                            <input className="form-input" value={notas} maxLength={300} onChange={(e) => setNotas(e.target.value)} placeholder="Opcional" />
                        </div>
                        <div className="rel-form-pie"><button type="submit" className="rel-btn">Cargar vencimiento</button></div>
                    </form>
                    {error && <p className="msg-error">{error}</p>}
                    {mensaje && <p className="msg-exito">{mensaje}</p>}
                </div>
            )}

            <div className="insumos-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                    <h1 style={{ margin: 0, border: "none", padding: 0 }}>CALENDARIO DE VENCIMIENTOS</h1>
                    <select className="form-input" style={{ width: "auto" }} value={filtro} onChange={(e) => setFiltro(e.target.value as "TODOS" | Semaforo)}>
                        <option value="TODOS">Todos</option>
                        <option value="VENCIDO">Vencidos</option>
                        <option value="POR_VENCER">Por vencer</option>
                        <option value="VIGENTE">Vigentes</option>
                    </select>
                </div>
                {!puedeCrear && error && <p className="msg-error">{error}</p>}
                <div className="tabla-simetrica-wrapper">
                    <table className="tabla-insumos tabla-tarjetas-movil">
                        <thead>
                            <tr><th style={{ textAlign: "center" }}>Estado</th><th>Empresa</th><th>Tipo</th><th>Descripción</th><th>Vence</th><th>Acciones</th></tr>
                        </thead>
                        <tbody>
                            {visibles.length > 0 ? visibles.map((v) => (
                                <tr key={v.idVencimiento}>
                                    <td data-label="Estado" style={{ textAlign: "center" }}>
                                        <span className={`rel-badge ${CLASE_SEMAFORO[v.semaforo]}`}>{TEXTO_SEMAFORO[v.semaforo]}</span>
                                    </td>
                                    <td data-label="Empresa">{v.empresa?.nombre}</td>
                                    <td data-label="Tipo">{TIPOS.find((t) => t.valor === v.tipo)?.texto ?? v.tipo}</td>
                                    <td data-label="Descripción">{v.descripcion}{v.notas && <span className="rel-ayuda" style={{ display: "block" }}>{v.notas}</span>}</td>
                                    <td data-label="Vence">{v.fechaVencimiento}<span className="rel-ayuda" style={{ display: "block" }}>{textoDias(v)}</span></td>
                                    <td data-label="Acciones">
                                        {renovandoId === v.idVencimiento ? (
                                            <div className="rel-acciones-tabla">
                                                <input type="date" className="form-input" style={{ width: "auto" }} min={hoyISO()} value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} />
                                                <button className="rel-btn chico" onClick={() => handleRenovar(v.idVencimiento)}>Guardar</button>
                                                <button className="rel-btn gris chico" onClick={() => setRenovandoId(null)}>Cancelar</button>
                                            </div>
                                        ) : (
                                            <div className="rel-acciones-tabla">
                                                {puedeEditar && <button className="rel-btn azul chico" onClick={() => { setRenovandoId(v.idVencimiento); setNuevaFecha(""); }}><RefreshCw size={12} /> Renovar</button>}
                                                {puedeEliminar && <button className="rel-btn rojo chico" onClick={() => handleEliminar(v.idVencimiento)}><Trash2 size={12} /></button>}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} className="txt-vacio">No hay vencimientos para mostrar.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VencimientosComponent;
