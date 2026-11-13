import React, { useEffect, useState } from "react";
import { Gauge, Trash2 } from "lucide-react";
import api from "../../service/api";
import { tienePermiso } from "../../service/authHelper";
import { textoError, hoyISO, cabeceras } from "../../service/errores";
import "../insumos/insumos.css";
import "../relevamientos/relevamientos.css";
import type { Empresa } from "../../interfaces/Empresa";
import type { Medicion, TipoMedicion, LimitesMedicion, ResumenMediciones } from "../../interfaces/Sst";

const TIPOS: { valor: TipoMedicion; texto: string }[] = [
    { valor: "RUIDO", texto: "Ruido" },
    { valor: "ILUMINACION", texto: "Iluminación" },
    { valor: "PUESTA_A_TIERRA", texto: "Puesta a tierra" },
    { valor: "CARGA_TERMICA", texto: "Carga térmica" },
    { valor: "OTRO", texto: "Otro" },
];

const MedicionesComponent: React.FC = () => {
    const puedeVer = tienePermiso("VER_MEDICIONES");
    const puedeCrear = tienePermiso("CREAR_MEDICIONES");
    const puedeEliminar = tienePermiso("ELIMINAR_MEDICIONES");

    const [lista, setLista] = useState<Medicion[]>([]);
    const [resumen, setResumen] = useState<ResumenMediciones | null>(null);
    const [limites, setLimites] = useState<LimitesMedicion>({});
    const [empresas, setEmpresas] = useState<Empresa[]>([]);

    const [idEmpresa, setIdEmpresa] = useState<number | "">("");
    const [tipo, setTipo] = useState<TipoMedicion>("RUIDO");
    const [fecha, setFecha] = useState(hoyISO());
    const [sector, setSector] = useState("");
    const [valor, setValor] = useState("");
    const [limite, setLimite] = useState("");
    const [unidad, setUnidad] = useState("");
    const [sentido, setSentido] = useState("MAXIMO");
    const [instrumento, setInstrumento] = useState("");
    const [responsable, setResponsable] = useState("");
    const [proxima, setProxima] = useState("");
    const [observaciones, setObservaciones] = useState("");

    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    const cargar = async () => {
        try {
            const [l, r] = await Promise.all([api.get("/mediciones", cabeceras()), api.get("/mediciones/resumen", cabeceras())]);
            setLista(Array.isArray(l.data) ? l.data : []);
            setResumen(r.data);
        } catch (err) { console.error("Error al cargar mediciones", err); }
    };

    useEffect(() => {
        if (!puedeVer) return;
        cargar();
        api.get("/mediciones/limites", cabeceras()).then((r) => setLimites(r.data || {})).catch(() => setLimites({}));
        api.get("/empresas", cabeceras()).then((r) => setEmpresas(Array.isArray(r.data) ? r.data.filter((e: Empresa) => e.activo) : [])).catch(() => setEmpresas([]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const ref = limites[tipo];
    const esOtro = tipo === "OTRO";

    const handleCrear = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setMensaje("");
        try {
            await api.post("/mediciones", {
                idEmpresa: idEmpresa || null, tipo, fecha, sector, valorMedido: valor, limite: limite || undefined,
                unidad: esOtro ? unidad : undefined, sentido: esOtro ? sentido : undefined,
                instrumento, responsable, proximaMedicion: proxima || undefined, observaciones,
            }, cabeceras());
            setMensaje(proxima ? "Medición cargada. La próxima medición quedó en Vencimientos legales." : "Medición cargada.");
            setSector(""); setValor(""); setLimite(""); setObservaciones("");
            await cargar();
        } catch (err: any) { setError(textoError(err, "Error al cargar la medición.")); }
    };

    const eliminar = async (id: number) => {
        if (!window.confirm("¿Dar de baja esta medición?")) return;
        try { await api.delete(`/mediciones/${id}`, cabeceras()); await cargar(); } catch (err: any) { setError(textoError(err, "No se pudo dar de baja.")); }
    };

    if (!puedeVer) {
        return <div className="insumos-container"><div className="insumos-card"><p className="txt-vacio">No tenés permiso para ver las mediciones.</p></div></div>;
    }

    return (
        <div className="insumos-container">
            <div className="insumos-card">
                <h1 style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}><Gauge size={24} color="#059669" /> MEDICIONES DE HIGIENE</h1>
                <div className="rel-resumen" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
                    <div className="rel-dato"><b>{resumen?.total ?? 0}</b><span>Mediciones</span></div>
                    <div className="rel-dato"><b style={{ color: "#15803d" }}>{resumen?.conformes ?? 0}</b><span>Conformes</span></div>
                    <div className={`rel-dato ${(resumen?.noConformes ?? 0) > 0 ? "alerta" : ""}`}><b>{resumen?.noConformes ?? 0}</b><span>No conformes</span></div>
                </div>
                <p className="rel-ayuda" style={{ marginTop: 10 }}>Los límites precargados son valores de referencia. Confirmalos con la normativa vigente y con el protocolo de medición de la actividad antes de usarlos en un informe.</p>
            </div>

            {puedeCrear && (
                <div className="insumos-card">
                    <h1>CARGAR MEDICIÓN</h1>
                    <form onSubmit={handleCrear} className="rel-form-grid">
                        <div className="rel-campo"><label>Empresa / Sede *</label>
                            <select className="form-input" value={idEmpresa} onChange={(e) => setIdEmpresa(e.target.value as unknown as number)} required>
                                <option value="" disabled>Seleccione una empresa</option>
                                {empresas.map((emp) => <option key={emp.idEmpresa} value={emp.idEmpresa}>{emp.nombre}</option>)}
                            </select></div>
                        <div className="rel-campo"><label>Tipo *</label>
                            <select className="form-input" value={tipo} onChange={(e) => setTipo(e.target.value as TipoMedicion)}>
                                {TIPOS.map((t) => <option key={t.valor} value={t.valor}>{t.texto}</option>)}
                            </select>
                            {ref && <span className="rel-ayuda">{ref.limite != null ? `Referencia: ${ref.sentido === "MINIMO" ? "mínimo" : "máximo"} ${ref.limite} ${ref.unidad ?? ""}. ` : ""}{ref.nota}</span>}</div>
                        <div className="rel-campo"><label>Fecha *</label>
                            <input type="date" className="form-input" value={fecha} max={hoyISO()} onChange={(e) => setFecha(e.target.value)} required /></div>
                        <div className="rel-campo"><label>Sector / punto de medición *</label>
                            <input className="form-input" value={sector} maxLength={120} onChange={(e) => setSector(e.target.value)} required placeholder="Ej: Taller de corte" /></div>
                        <div className="rel-campo"><label>Valor medido{ref?.unidad ? ` (${ref.unidad})` : ""} *</label>
                            <input type="number" className="form-input" min={0} step="any" value={valor} onChange={(e) => setValor(e.target.value)} required /></div>
                        <div className="rel-campo"><label>Límite legal{ref?.limite != null ? "" : " *"}</label>
                            <input type="number" className="form-input" min={0} step="any" value={limite} onChange={(e) => setLimite(e.target.value)}
                                required={ref?.limite == null} placeholder={ref?.limite != null ? `Por defecto ${ref.limite}` : "Obligatorio"} /></div>
                        {esOtro && (
                            <>
                                <div className="rel-campo"><label>Unidad *</label>
                                    <input className="form-input" value={unidad} maxLength={20} onChange={(e) => setUnidad(e.target.value)} required placeholder="Ej: ppm" /></div>
                                <div className="rel-campo"><label>El límite es un *</label>
                                    <select className="form-input" value={sentido} onChange={(e) => setSentido(e.target.value)}>
                                        <option value="MAXIMO">Máximo (no se puede superar)</option>
                                        <option value="MINIMO">Mínimo (hay que alcanzarlo)</option>
                                    </select></div>
                            </>
                        )}
                        <div className="rel-campo"><label>Instrumento</label>
                            <input className="form-input" value={instrumento} maxLength={120} onChange={(e) => setInstrumento(e.target.value)} /></div>
                        <div className="rel-campo"><label>Responsable de la medición</label>
                            <input className="form-input" value={responsable} maxLength={120} onChange={(e) => setResponsable(e.target.value)} /></div>
                        <div className="rel-campo"><label>Próxima medición</label>
                            <input type="date" className="form-input" value={proxima} min={fecha} onChange={(e) => setProxima(e.target.value)} />
                            <span className="rel-ayuda">Se carga sola como vencimiento legal.</span></div>
                        <div className="rel-campo ancho"><label>Observaciones</label>
                            <input className="form-input" value={observaciones} maxLength={300} onChange={(e) => setObservaciones(e.target.value)} placeholder="Opcional" /></div>
                        <div className="rel-form-pie"><button type="submit" className="rel-btn">Cargar medición</button></div>
                    </form>
                    {error && <p className="msg-error">{error}</p>}
                    {mensaje && <p className="msg-exito">{mensaje}</p>}
                </div>
            )}

            <div className="insumos-card">
                <h1>REGISTRO DE MEDICIONES</h1>
                {!puedeCrear && error && <p className="msg-error">{error}</p>}
                <div className="tabla-simetrica-wrapper">
                    <table className="tabla-insumos tabla-tarjetas-movil">
                        <thead><tr><th style={{ textAlign: "center" }}>Resultado</th><th>Fecha</th><th>Empresa</th><th>Tipo</th><th>Sector</th><th>Medido</th><th>Límite</th><th>Acciones</th></tr></thead>
                        <tbody>
                            {lista.length > 0 ? lista.map((m) => (
                                <tr key={m.idMedicion}>
                                    <td data-label="Resultado" style={{ textAlign: "center" }}><span className={`rel-badge ${m.conforme ? "BAJO" : "CRITICO"}`}>{m.conforme ? "Conforme" : "No conforme"}</span></td>
                                    <td data-label="Fecha">{m.fecha}</td>
                                    <td data-label="Empresa">{m.empresa?.nombre}</td>
                                    <td data-label="Tipo">{TIPOS.find((t) => t.valor === m.tipo)?.texto ?? m.tipo}</td>
                                    <td data-label="Sector">{m.sector}</td>
                                    <td data-label="Medido"><b>{m.valorMedido}</b> {m.unidad}</td>
                                    <td data-label="Límite">{m.sentido === "MINIMO" ? "≥" : "≤"} {m.limite} {m.unidad}</td>
                                    <td data-label="Acciones">{puedeEliminar && <button className="rel-btn rojo chico" onClick={() => eliminar(m.idMedicion)} aria-label="Dar de baja"><Trash2 size={12} /></button>}</td>
                                </tr>
                            )) : <tr><td colSpan={8} className="txt-vacio">No hay mediciones cargadas todavía.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MedicionesComponent;
