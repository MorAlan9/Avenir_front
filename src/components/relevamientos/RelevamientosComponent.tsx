import React, { useEffect, useState } from "react";
import { ClipboardList, Upload, Trash2, CheckCircle2, FileText, Image as ImageIcon, X, Wrench, Camera, Lock, Unlock } from "lucide-react";
import api from "../../service/api";
import { tienePermiso } from "../../service/authHelper";
import "../insumos/insumos.css";
import "./relevamientos.css";
import type { Empresa } from "../../interfaces/Empresa";
import type { Relevamiento, TipoRiesgo, Hallazgo, Severidad } from "../../interfaces/Relevamiento";
import { usePaginacion } from "../common/usePaginacion";
import { Paginador } from "../common/Paginador";

const obtenerHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

const hoy = () => new Date().toISOString().split("T")[0];

const textoError = (err: any, porDefecto: string): string => {
    const data = err?.response?.data;
    if (typeof data === "string" && data.trim()) return data;
    if (data && typeof data === "object") return data.mensaje || data.message || porDefecto;
    return porDefecto;
};

type EstadoVisible = "BORRADOR" | "EN_CURSO" | "CERRADO";

const normalizarEstado = (estado: string): EstadoVisible => {
    if (estado === "PENDIENTE") return "BORRADOR";
    if (estado === "EN_PROGRESO") return "EN_CURSO";
    return estado as EstadoVisible;
};

const ETIQUETA_ESTADO: Record<string, string> = {
    BORRADOR: "Borrador",
    EN_CURSO: "En curso",
    CERRADO: "Cerrado",
    ENCONTRADO: "Encontrado",
    EN_CORRECCION: "En corrección",
    RESUELTO: "Resuelto",
    BAJO: "Bajo",
    MEDIO: "Medio",
    ALTO: "Alto",
    CRITICO: "Crítico",
};

const SEVERIDADES: Severidad[] = ["BAJO", "MEDIO", "ALTO", "CRITICO"];
const PASOS: { clave: EstadoVisible; texto: string }[] = [
    { clave: "BORRADOR", texto: "Borrador" },
    { clave: "EN_CURSO", texto: "En curso" },
    { clave: "CERRADO", texto: "Cerrado" },
];

const sevDe = (h: Hallazgo): Severidad => (h.severidad as Severidad) || "MEDIO";
const estaVencido = (h: Hallazgo) => !!h.fechaLimite && h.estado !== "RESUELTO" && h.fechaLimite < hoy();

const Badge: React.FC<{ valor: string }> = ({ valor }) => (
    <span className={`rel-badge ${valor}`}>{ETIQUETA_ESTADO[valor] ?? valor}</span>
);

const RelevamientosComponent: React.FC = () => {
    const [relevamientos, setRelevamientos] = useState<Relevamiento[]>([]);
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [tiposRiesgo, setTiposRiesgo] = useState<TipoRiesgo[]>([]);
    const [seleccionado, setSeleccionado] = useState<Relevamiento | null>(null);

    const puedeCrear = tienePermiso("CREAR_RELEVAMIENTOS");
    const puedeEditar = tienePermiso("EDITAR_RELEVAMIENTOS");
    const puedeVer = tienePermiso("VER_RELEVAMIENTOS");

    const [idEmpresa, setIdEmpresa] = useState<number | "">("");
    const [fecha, setFecha] = useState(hoy());
    const [observaciones, setObservaciones] = useState("");

    const [descripcionHallazgo, setDescripcionHallazgo] = useState("");
    const [idTipoRiesgoHallazgo, setIdTipoRiesgoHallazgo] = useState<number | "">("");
    const [severidad, setSeveridad] = useState<Severidad>("MEDIO");
    const [sector, setSector] = useState("");
    const [responsable, setResponsable] = useState("");
    const [fechaLimite, setFechaLimite] = useState("");
    const [recomendacion, setRecomendacion] = useState("");

    const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
    const [subiendoArchivo, setSubiendoArchivo] = useState(false);
    const [subiendoFotoDe, setSubiendoFotoDe] = useState<number | null>(null);

    const [conclusion, setConclusion] = useState("");

    const [errorCrear, setErrorCrear] = useState("");
    const [mensajeCrear, setMensajeCrear] = useState("");
    const [errorDetalle, setErrorDetalle] = useState("");
    const [mensajeDetalle, setMensajeDetalle] = useState("");

    const limpiarAvisosDetalle = () => { setErrorDetalle(""); setMensajeDetalle(""); };

    const cargarRelevamientos = async () => {
        try {
            const res = await api.get("/relevamientos", obtenerHeaders());
            setRelevamientos(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            setRelevamientos([]);
        }
    };

    const cargarEmpresas = async () => {
        try {
            const res = await api.get("/empresas", obtenerHeaders());
            setEmpresas(Array.isArray(res.data) ? res.data.filter((e: Empresa) => e.activo) : []);
        } catch (err) { console.error("Error al cargar empresas", err); }
    };

    const cargarTiposRiesgo = async () => {
        try {
            const res = await api.get("/tipo-riesgo/activos", obtenerHeaders());
            setTiposRiesgo(Array.isArray(res.data) ? res.data : []);
        } catch (err) { console.error("Error al cargar tipos de riesgo", err); }
    };

    useEffect(() => {
        if (!puedeVer) return;
        cargarRelevamientos();
        cargarEmpresas();
        cargarTiposRiesgo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { itemsPagina: relevamientosPagina, pagina, totalPaginas, setPagina, totalItems, porPagina } = usePaginacion(relevamientos, 8);

    const refrescarSeleccionado = async (id: number) => {
        try {
            const res = await api.get(`/relevamientos/${id}`, obtenerHeaders());
            setSeleccionado(res.data);
        } catch (err) { console.error("Error al refrescar el relevamiento", err); }
        cargarRelevamientos();
    };

    const abrirDetalle = (r: Relevamiento) => {
        limpiarAvisosDetalle();
        setConclusion(r.conclusion || "");
        setSeleccionado(r);
    };

    const handleCrear = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorCrear(""); setMensajeCrear("");
        try {
            await api.post("/relevamientos", {
                idEmpresa: idEmpresa || null,
                fecha,
                observaciones,
            }, obtenerHeaders());
            setMensajeCrear("Relevamiento creado en estado Borrador.");
            setIdEmpresa(""); setObservaciones(""); setFecha(hoy());
            cargarRelevamientos();
        } catch (err: any) {
            setErrorCrear(textoError(err, "Error al crear el relevamiento."));
        }
    };

    const cambiarEstadoRelevamiento = async (nuevoEstado: EstadoVisible) => {
        if (!seleccionado?.idRelevamiento) return;
        limpiarAvisosDetalle();
        try {
            await api.put(`/relevamientos/${seleccionado.idRelevamiento}/estado`,
                { estado: nuevoEstado, conclusion: nuevoEstado === "CERRADO" ? conclusion : undefined }, obtenerHeaders());
            setMensajeDetalle(nuevoEstado === "CERRADO" ? "Relevamiento cerrado." : `Relevamiento en estado ${ETIQUETA_ESTADO[nuevoEstado]}.`);
            await refrescarSeleccionado(seleccionado.idRelevamiento);
        } catch (err: any) {
            setErrorDetalle(textoError(err, "No se pudo cambiar el estado del relevamiento."));
        }
    };

    const limpiarFormHallazgo = () => {
        setDescripcionHallazgo(""); setIdTipoRiesgoHallazgo(""); setSeveridad("MEDIO");
        setSector(""); setResponsable(""); setFechaLimite(""); setRecomendacion("");
    };

    const handleAgregarHallazgo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!seleccionado?.idRelevamiento) return;
        limpiarAvisosDetalle();
        try {
            await api.post(`/relevamientos/${seleccionado.idRelevamiento}/hallazgos`, {
                idTipoRiesgo: idTipoRiesgoHallazgo || null,
                descripcion: descripcionHallazgo,
                severidad,
                sector,
                responsable,
                fechaLimite: fechaLimite || null,
                recomendacion,
            }, obtenerHeaders());
            limpiarFormHallazgo();
            setMensajeDetalle("Hallazgo agregado.");
            await refrescarSeleccionado(seleccionado.idRelevamiento);
        } catch (err: any) {
            setErrorDetalle(textoError(err, "Error al agregar el hallazgo."));
        }
    };

    const cambiarEstadoHallazgo = async (idHallazgo: number, estado: "EN_CORRECCION" | "RESUELTO") => {
        if (!seleccionado?.idRelevamiento) return;
        limpiarAvisosDetalle();
        try {
            await api.put(`/relevamientos/hallazgos/${idHallazgo}/estado`, { estado }, obtenerHeaders());
            await refrescarSeleccionado(seleccionado.idRelevamiento);
        } catch (err: any) {
            setErrorDetalle(textoError(err, "No se pudo actualizar el hallazgo."));
        }
    };

    const subirArchivo = async (archivo: File, idHallazgo?: number) => {
        if (!seleccionado?.idRelevamiento) return;
        const formData = new FormData();
        formData.append("archivo", archivo);
        formData.append("emailUsuario", localStorage.getItem("email") || "");
        if (idHallazgo) formData.append("idHallazgo", String(idHallazgo));
        await api.post(`/relevamientos/${seleccionado.idRelevamiento}/archivos`, formData, {
            ...obtenerHeaders(),
            headers: { ...obtenerHeaders().headers, "Content-Type": "multipart/form-data" },
        });
    };

    const handleSubirArchivo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!seleccionado?.idRelevamiento || !archivoSeleccionado) return;
        limpiarAvisosDetalle();
        setSubiendoArchivo(true);
        try {
            await subirArchivo(archivoSeleccionado);
            setArchivoSeleccionado(null);
            setMensajeDetalle("Archivo subido con éxito.");
            await refrescarSeleccionado(seleccionado.idRelevamiento);
        } catch (err: any) {
            setErrorDetalle(textoError(err, "Error al subir el archivo."));
        } finally {
            setSubiendoArchivo(false);
        }
    };

    const handleSubirFoto = async (idHallazgo: number, archivo: File | undefined) => {
        if (!seleccionado?.idRelevamiento || !archivo) return;
        limpiarAvisosDetalle();
        setSubiendoFotoDe(idHallazgo);
        try {
            await subirArchivo(archivo, idHallazgo);
            await refrescarSeleccionado(seleccionado.idRelevamiento);
        } catch (err: any) {
            setErrorDetalle(textoError(err, "Error al subir la foto."));
        } finally {
            setSubiendoFotoDe(null);
        }
    };

    const handleEliminarArchivo = async (idArchivo: number) => {
        if (!seleccionado?.idRelevamiento) return;
        if (!window.confirm("¿Eliminar este archivo?")) return;
        limpiarAvisosDetalle();
        try {
            await api.delete(`/relevamientos/archivos/${idArchivo}`, obtenerHeaders());
            await refrescarSeleccionado(seleccionado.idRelevamiento);
        } catch (err: any) {
            setErrorDetalle(textoError(err, "No se pudo eliminar el archivo."));
        }
    };

    if (!puedeVer) {
        return (
            <div className="insumos-container">
                <div className="insumos-card">
                    <p className="txt-vacio">No tenés permiso para ver los relevamientos.</p>
                </div>
            </div>
        );
    }

    const estadoSel: EstadoVisible | null = seleccionado ? normalizarEstado(seleccionado.estado) : null;
    const cerrado = estadoSel === "CERRADO";
    const hallazgos = seleccionado?.hallazgos ?? [];
    const resueltos = hallazgos.filter((h) => h.estado === "RESUELTO").length;
    const abiertos = hallazgos.length - resueltos;
    const criticosAbiertos = hallazgos.filter((h) => sevDe(h) === "CRITICO" && h.estado !== "RESUELTO").length;
    const vencidos = hallazgos.filter(estaVencido).length;
    const archivosGenerales = (seleccionado?.archivos ?? []).filter((a) => !a.idHallazgo);
    const exigeRecomendacion = severidad === "ALTO" || severidad === "CRITICO";
    const indiceActual = estadoSel ? PASOS.findIndex((p) => p.clave === estadoSel) : -1;

    return (
        <div className="insumos-container">
            {puedeCrear && (
                <div className="insumos-card">
                    <h1 style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
                        <ClipboardList size={24} color="#059669" /> NUEVO RELEVAMIENTO
                    </h1>
                    <form onSubmit={handleCrear} className="rel-form-grid">
                        <div className="rel-campo">
                            <label>Empresa / Sede</label>
                            <select className="form-input" value={idEmpresa} onChange={(e) => setIdEmpresa(e.target.value as unknown as number)} required>
                                <option value="" disabled>Seleccione una empresa</option>
                                {empresas.map((emp) => <option key={emp.idEmpresa} value={emp.idEmpresa}>{emp.nombre}</option>)}
                            </select>
                        </div>
                        <div className="rel-campo">
                            <label>Fecha</label>
                            <input type="date" className="form-input" value={fecha} max={hoy()} onChange={(e) => setFecha(e.target.value)} required />
                        </div>
                        <div className="rel-campo ancho">
                            <label>Observaciones</label>
                            <input className="form-input" value={observaciones} maxLength={500} onChange={(e) => setObservaciones(e.target.value)} placeholder="Opcional" />
                        </div>
                        <div className="rel-form-pie">
                            <button type="submit" className="rel-btn">Crear Relevamiento</button>
                        </div>
                    </form>
                    {errorCrear && <p className="msg-error">{errorCrear}</p>}
                    {mensajeCrear && <p className="msg-exito">{mensajeCrear}</p>}
                </div>
            )}

            <div className="insumos-card">
                <h1 style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
                    <ClipboardList size={24} color="#059669" /> RELEVAMIENTOS
                </h1>
                <div className="tabla-simetrica-wrapper">
                    <table className="tabla-insumos tabla-tarjetas-movil">
                        <thead>
                            <tr>
                                <th>Empresa</th>
                                <th>Fecha</th>
                                <th>Técnico</th>
                                <th style={{ textAlign: "center" }}>Hallazgos</th>
                                <th style={{ textAlign: "center" }}>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {relevamientosPagina.length > 0 ? relevamientosPagina.map((r) => {
                                const res = r.hallazgos.filter((h) => h.estado === "RESUELTO").length;
                                const crit = r.hallazgos.filter((h) => sevDe(h) === "CRITICO" && h.estado !== "RESUELTO").length;
                                return (
                                    <tr key={r.idRelevamiento}>
                                        <td data-label="Empresa">{r.empresa?.nombre}</td>
                                        <td data-label="Fecha">{r.fecha}</td>
                                        <td data-label="Técnico">{r.tecnico ? `${r.tecnico.nombre} ${r.tecnico.apellido}` : "-"}</td>
                                        <td style={{ textAlign: "center" }} data-label="Hallazgos">
                                            <div className="rel-estado-celda">
                                                <span>{res}/{r.hallazgos.length} resueltos</span>
                                                {crit > 0 && <span className="rel-badge CRITICO">{crit} crítico{crit > 1 ? "s" : ""}</span>}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: "center" }} data-label="Estado">
                                            <Badge valor={normalizarEstado(r.estado)} />
                                        </td>
                                        <td data-label="Acciones">
                                            <div className="rel-acciones-tabla">
                                                <button className="rel-btn azul chico" onClick={() => abrirDetalle(r)}>Ver Detalle</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan={6} className="txt-vacio">No hay relevamientos cargados todavía.</td></tr>
                            )}
                        </tbody>
                    </table>
                    <Paginador pagina={pagina} totalPaginas={totalPaginas} totalItems={totalItems} porPagina={porPagina} onCambiarPagina={setPagina} />
                </div>
            </div>

            {seleccionado && estadoSel && (
                <div className="insumos-card rel-detalle">
                    <div className="rel-head">
                        <div>
                            <h2 className="rel-titulo">{seleccionado.empresa?.nombre} — {seleccionado.fecha}</h2>
                            <p className="rel-subtitulo">
                                Técnico: {seleccionado.tecnico ? `${seleccionado.tecnico.nombre} ${seleccionado.tecnico.apellido}` : "sin asignar"}
                                {seleccionado.fechaCierre ? ` · Cerrado el ${seleccionado.fechaCierre}` : ""}
                            </p>
                        </div>
                        <div className="rel-head-acciones">
                            <Badge valor={estadoSel} />
                            <button className="rel-cerrar-x" onClick={() => setSeleccionado(null)} aria-label="Cerrar detalle"><X size={16} /></button>
                        </div>
                    </div>

                    <div className="rel-pasos" aria-label="Ciclo del relevamiento">
                        {PASOS.map((p, i) => (
                            <div key={p.clave} className={`rel-paso ${i < indiceActual ? "hecho" : ""} ${i === indiceActual ? "actual" : ""}`}>
                                <span className="rel-paso-n">{i < indiceActual ? "✓" : i + 1}</span>
                                {p.texto}
                            </div>
                        ))}
                    </div>

                    {errorDetalle && <div className="rel-aviso error">{errorDetalle}</div>}
                    {mensajeDetalle && <div className="rel-aviso exito">{mensajeDetalle}</div>}

                    {seleccionado.observaciones && <p style={{ color: "#475569", margin: 0 }}>{seleccionado.observaciones}</p>}

                    <div className="rel-resumen">
                        <div className="rel-dato"><b>{hallazgos.length}</b><span>Hallazgos</span></div>
                        <div className="rel-dato"><b>{resueltos}</b><span>Resueltos</span></div>
                        <div className="rel-dato"><b>{abiertos}</b><span>Abiertos</span></div>
                        <div className={`rel-dato ${criticosAbiertos > 0 ? "alerta" : ""}`}><b>{criticosAbiertos}</b><span>Críticos abiertos</span></div>
                        <div className={`rel-dato ${vencidos > 0 ? "alerta" : ""}`}><b>{vencidos}</b><span>Vencidos</span></div>
                    </div>

                    <section className="rel-seccion">
                        <h3 className="rel-seccion-titulo">Hallazgos</h3>

                        {puedeCrear && !cerrado && (
                            <form onSubmit={handleAgregarHallazgo} className="rel-bloque rel-form-grid">
                                <div className="rel-campo ancho">
                                    <label>Descripción del hallazgo *</label>
                                    <input className="form-input" value={descripcionHallazgo} maxLength={500}
                                        onChange={(e) => setDescripcionHallazgo(e.target.value)}
                                        placeholder="Ej: Extintor vencido en sector depósito" required />
                                </div>
                                <div className="rel-campo">
                                    <label>Severidad *</label>
                                    <select className="form-input" value={severidad} onChange={(e) => setSeveridad(e.target.value as Severidad)}>
                                        {SEVERIDADES.map((s) => <option key={s} value={s}>{ETIQUETA_ESTADO[s]}</option>)}
                                    </select>
                                </div>
                                <div className="rel-campo">
                                    <label>Tipo de riesgo</label>
                                    <select className="form-input" value={idTipoRiesgoHallazgo} onChange={(e) => setIdTipoRiesgoHallazgo(e.target.value as unknown as number)}>
                                        <option value="">Sin categorizar</option>
                                        {tiposRiesgo.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="rel-campo">
                                    <label>Sector / ubicación</label>
                                    <input className="form-input" value={sector} maxLength={120} onChange={(e) => setSector(e.target.value)} placeholder="Ej: Depósito, planta alta" />
                                </div>
                                <div className="rel-campo">
                                    <label>Responsable de corregirlo</label>
                                    <input className="form-input" value={responsable} maxLength={120} onChange={(e) => setResponsable(e.target.value)} placeholder="Nombre o área" />
                                </div>
                                <div className="rel-campo">
                                    <label>Fecha límite{exigeRecomendacion ? " *" : ""}</label>
                                    <input type="date" className="form-input" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} required={exigeRecomendacion} />
                                </div>
                                <div className="rel-campo ancho">
                                    <label>Recomendación / acción correctiva{exigeRecomendacion ? " *" : ""}</label>
                                    <textarea className="form-input" value={recomendacion} maxLength={500}
                                        onChange={(e) => setRecomendacion(e.target.value)}
                                        placeholder="Qué hay que hacer para corregirlo" required={exigeRecomendacion} />
                                    {exigeRecomendacion && <span className="rel-ayuda">Los hallazgos altos y críticos requieren recomendación y fecha límite.</span>}
                                </div>
                                <div className="rel-form-pie">
                                    <button type="submit" className="rel-btn">Agregar hallazgo</button>
                                </div>
                            </form>
                        )}

                        {hallazgos.length > 0 ? (
                            <div className="rel-lista">
                                {hallazgos.map((h) => {
                                    const sev = sevDe(h);
                                    return (
                                        <article key={h.idHallazgo} className={`rel-hallazgo sev-${sev}`}>
                                            <div className="rel-hallazgo-top">
                                                <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                    <Badge valor={sev} />
                                                    <Badge valor={h.estado} />
                                                </span>
                                                <span className="rel-meta">{h.tipoRiesgo?.nombre || "Sin categorizar"}</span>
                                            </div>
                                            <p>{h.descripcion}</p>
                                            {h.recomendacion && <div className="rel-reco"><b>Acción: </b>{h.recomendacion}</div>}
                                            <div className="rel-meta">
                                                {h.sector && <span><b>Sector:</b> {h.sector}</span>}
                                                {h.responsable && <span><b>Responsable:</b> {h.responsable}</span>}
                                                {h.fechaLimite && <span className={estaVencido(h) ? "vencido" : ""}><b>Límite:</b> {h.fechaLimite}{estaVencido(h) ? " (vencido)" : ""}</span>}
                                                <span><b>Detectado:</b> {h.fechaDeteccion}</span>
                                                {h.fechaResolucion && <span><b>Resuelto:</b> {h.fechaResolucion}</span>}
                                            </div>

                                            {(h.fotos?.length ?? 0) > 0 && (
                                                <div className="rel-fotos">
                                                    {h.fotos!.map((f) => (
                                                        <div key={f.idArchivo} className="rel-foto">
                                                            <a href={f.url} target="_blank" rel="noreferrer" title={f.nombreArchivo}>
                                                                {f.tipoContenido?.startsWith("image/") ? <img src={f.url} alt={f.nombreArchivo} /> : <FileText size={28} />}
                                                            </a>
                                                            {puedeEditar && !cerrado && (
                                                                <button className="rel-foto-x" onClick={() => handleEliminarArchivo(f.idArchivo!)} aria-label="Eliminar foto"><X size={12} /></button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {!cerrado && (
                                                <div className="rel-hallazgo-acciones">
                                                    {puedeCrear && (
                                                        <label className="rel-btn gris chico" style={{ cursor: "pointer" }}>
                                                            <Camera size={13} /> {subiendoFotoDe === h.idHallazgo ? "Subiendo..." : "Agregar foto"}
                                                            <input type="file" accept="image/*,.pdf" hidden disabled={subiendoFotoDe === h.idHallazgo}
                                                                onChange={(e) => { handleSubirFoto(h.idHallazgo!, e.target.files?.[0]); e.target.value = ""; }} />
                                                        </label>
                                                    )}
                                                    {puedeEditar && h.estado === "ENCONTRADO" && (
                                                        <button className="rel-btn ambar chico" onClick={() => cambiarEstadoHallazgo(h.idHallazgo!, "EN_CORRECCION")}>
                                                            <Wrench size={13} /> Iniciar corrección
                                                        </button>
                                                    )}
                                                    {puedeEditar && h.estado !== "RESUELTO" && (
                                                        <button className="rel-btn chico" onClick={() => cambiarEstadoHallazgo(h.idHallazgo!, "RESUELTO")}>
                                                            <CheckCircle2 size={13} /> Resolver
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </article>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="rel-vacio">Todavía no se cargaron hallazgos.</p>
                        )}
                    </section>

                    <section className="rel-seccion">
                        <h3 className="rel-seccion-titulo">Documentación general (fotos / PDFs)</h3>
                        {puedeCrear && !cerrado && (
                            <form onSubmit={handleSubirArchivo} className="rel-subida">
                                <input type="file" className="form-input" accept="image/*,.pdf"
                                    onChange={(e) => setArchivoSeleccionado(e.target.files?.[0] || null)} />
                                <button type="submit" className="rel-btn" disabled={!archivoSeleccionado || subiendoArchivo}>
                                    <Upload size={14} /> {subiendoArchivo ? "Subiendo..." : "Subir archivo"}
                                </button>
                            </form>
                        )}
                        {archivosGenerales.length > 0 ? (
                            <div className="rel-archivos">
                                {archivosGenerales.map((a) => (
                                    <div key={a.idArchivo} className="rel-archivo">
                                        {a.tipoContenido?.startsWith("image/") && <img src={a.url} alt={a.nombreArchivo} />}
                                        <a href={a.url} target="_blank" rel="noreferrer">
                                            {a.tipoContenido?.startsWith("image/") ? <ImageIcon size={14} /> : <FileText size={14} />}
                                            {a.nombreArchivo.length > 22 ? a.nombreArchivo.slice(0, 19) + "..." : a.nombreArchivo}
                                        </a>
                                        {puedeEditar && !cerrado && (
                                            <button className="rel-btn rojo chico" onClick={() => handleEliminarArchivo(a.idArchivo!)}>
                                                <Trash2 size={12} /> Eliminar
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="rel-vacio">No hay archivos generales cargados todavía.</p>
                        )}
                    </section>

                    <section className="rel-seccion">
                        <h3 className="rel-seccion-titulo">Cierre del relevamiento</h3>
                        {cerrado ? (
                            <div className="rel-cierre cerrado">
                                <p><b>Conclusión final:</b> {seleccionado.conclusion || "—"}</p>
                                {puedeEditar && (
                                    <div>
                                        <button className="rel-btn ambar" onClick={() => cambiarEstadoRelevamiento("EN_CURSO")}>
                                            <Unlock size={14} /> Reabrir relevamiento
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : estadoSel === "BORRADOR" ? (
                            <div className="rel-cierre">
                                <p>El relevamiento está en borrador. Se pasa a <b>En curso</b> automáticamente al cargar el primer hallazgo, o podés iniciarlo ahora.</p>
                                {puedeEditar && (
                                    <div>
                                        <button className="rel-btn azul" onClick={() => cambiarEstadoRelevamiento("EN_CURSO")}>Iniciar relevamiento</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="rel-cierre">
                                {criticosAbiertos > 0 && (
                                    <div className="rel-aviso error">
                                        Hay {criticosAbiertos} hallazgo{criticosAbiertos > 1 ? "s" : ""} crítico{criticosAbiertos > 1 ? "s" : ""} sin resolver: hay que resolverlos antes de cerrar.
                                    </div>
                                )}
                                {puedeEditar ? (
                                    <>
                                        <div className="rel-campo">
                                            <label>Conclusión final * (mínimo 20 caracteres)</label>
                                            <textarea className="form-input" value={conclusion} maxLength={1000} onChange={(e) => setConclusion(e.target.value)}
                                                placeholder="Resumen del estado de seguridad e higiene encontrado y próximos pasos" />
                                            <span className="rel-ayuda">{conclusion.trim().length}/1000</span>
                                        </div>
                                        <div>
                                            <button className="rel-btn rojo" onClick={() => cambiarEstadoRelevamiento("CERRADO")}
                                                disabled={conclusion.trim().length < 20 || criticosAbiertos > 0}>
                                                <Lock size={14} /> Cerrar relevamiento
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <p>Solo quien tiene permiso de edición puede cerrar el relevamiento.</p>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
};

export default RelevamientosComponent;
