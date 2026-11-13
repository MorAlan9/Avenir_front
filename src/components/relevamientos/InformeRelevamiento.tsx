import React from "react";
import { Printer, X } from "lucide-react";
import type { Relevamiento, Severidad } from "../../interfaces/Relevamiento";
import logoAvenir from "../../assets/avenir-logo.png";

interface Props {
    relevamiento: Relevamiento;
    onCerrar: () => void;
}

const SEV: Severidad[] = ["CRITICO", "ALTO", "MEDIO", "BAJO"];
const TEXTO_SEV: Record<Severidad, string> = { CRITICO: "Crítico", ALTO: "Alto", MEDIO: "Medio", BAJO: "Bajo" };
const TEXTO_ESTADO: Record<string, string> = { ENCONTRADO: "Encontrado", EN_CORRECCION: "En corrección", RESUELTO: "Resuelto" };
const TEXTO_REL: Record<string, string> = { BORRADOR: "Borrador", PENDIENTE: "Borrador", EN_CURSO: "En curso", EN_PROGRESO: "En curso", CERRADO: "Cerrado" };

/** Informe del relevamiento listo para imprimir o guardar como PDF desde el navegador. */
const InformeRelevamiento: React.FC<Props> = ({ relevamiento: r, onCerrar }) => {
    const hallazgos = [...r.hallazgos].sort((a, b) => SEV.indexOf((a.severidad as Severidad) || "MEDIO") - SEV.indexOf((b.severidad as Severidad) || "MEDIO"));
    const porSeveridad = SEV.map((s) => ({ s, n: r.hallazgos.filter((h) => ((h.severidad as Severidad) || "MEDIO") === s).length }));
    const resueltos = r.hallazgos.filter((h) => h.estado === "RESUELTO").length;
    const generales = r.archivos.filter((a) => !a.idHallazgo);
    const esImagen = (tipo?: string) => !!tipo && tipo.startsWith("image/");

    return (
        <div className="informe-overlay">
            <div className="informe-barra informe-no-imprimir">
                <span>Vista previa del informe</span>
                <span style={{ display: "flex", gap: 8 }}>
                    <button className="rel-btn" onClick={() => window.print()}><Printer size={14} /> Imprimir / Guardar PDF</button>
                    <button className="rel-btn gris" onClick={onCerrar}><X size={14} /> Cerrar</button>
                </span>
            </div>

            <div className="informe-hoja">
                <header className="informe-cabecera">
                    <img src={logoAvenir} alt="Avenir" style={{ height: 46 }} />
                    <div>
                        <h1>Informe de relevamiento</h1>
                        <p>Higiene y Seguridad en el Trabajo</p>
                    </div>
                </header>

                <table className="informe-datos">
                    <tbody>
                        <tr><th>Empresa / Sede</th><td>{r.empresa?.nombre}</td><th>Fecha</th><td>{r.fecha}</td></tr>
                        <tr><th>Técnico</th><td>{r.tecnico ? `${r.tecnico.nombre} ${r.tecnico.apellido}` : "—"}</td><th>Estado</th><td>{TEXTO_REL[r.estado] ?? r.estado}{r.fechaCierre ? ` (cerrado el ${r.fechaCierre})` : ""}</td></tr>
                        {r.observaciones && <tr><th>Observaciones</th><td colSpan={3}>{r.observaciones}</td></tr>}
                    </tbody>
                </table>

                <h2>Resumen</h2>
                <table className="informe-resumen">
                    <thead><tr><th>Hallazgos</th>{porSeveridad.map((x) => <th key={x.s}>{TEXTO_SEV[x.s]}</th>)}<th>Resueltos</th></tr></thead>
                    <tbody><tr><td>{r.hallazgos.length}</td>{porSeveridad.map((x) => <td key={x.s}>{x.n}</td>)}<td>{resueltos} de {r.hallazgos.length}</td></tr></tbody>
                </table>

                <h2>Hallazgos</h2>
                {hallazgos.length === 0 ? <p>No se registraron hallazgos.</p> : hallazgos.map((h, i) => {
                    const sev = ((h.severidad as Severidad) || "MEDIO");
                    return (
                        <section key={h.idHallazgo} className={`informe-hallazgo sev-${sev}`}>
                            <div className="informe-hallazgo-top">
                                <b>{i + 1}. {h.descripcion}</b>
                                <span>{TEXTO_SEV[sev]} · {TEXTO_ESTADO[h.estado] ?? h.estado}</span>
                            </div>
                            <p className="informe-meta">
                                {h.tipoRiesgo?.nombre ? `Tipo de riesgo: ${h.tipoRiesgo.nombre}. ` : ""}
                                {h.sector ? `Sector: ${h.sector}. ` : ""}
                                {h.responsable ? `Responsable: ${h.responsable}. ` : ""}
                                {`Detectado: ${h.fechaDeteccion}. `}
                                {h.fechaLimite ? `Fecha límite: ${h.fechaLimite}. ` : ""}
                                {h.fechaResolucion ? `Resuelto: ${h.fechaResolucion}.` : ""}
                            </p>
                            {h.recomendacion && <p><b>Acción recomendada:</b> {h.recomendacion}</p>}
                            {(h.fotos?.length ?? 0) > 0 && (
                                <div className="informe-fotos">
                                    {h.fotos!.filter((f) => esImagen(f.tipoContenido)).map((f) => <img key={f.idArchivo} src={f.url} alt={f.nombreArchivo} />)}
                                </div>
                            )}
                        </section>
                    );
                })}

                {generales.length > 0 && (
                    <>
                        <h2>Documentación adjunta</h2>
                        <div className="informe-fotos">
                            {generales.filter((a) => esImagen(a.tipoContenido)).map((a) => <img key={a.idArchivo} src={a.url} alt={a.nombreArchivo} />)}
                        </div>
                        <ul>{generales.filter((a) => !esImagen(a.tipoContenido)).map((a) => <li key={a.idArchivo}>{a.nombreArchivo}</li>)}</ul>
                    </>
                )}

                <h2>Conclusión</h2>
                <p>{r.conclusion || "El relevamiento todavía no tiene conclusión final."}</p>

                <div className="informe-firmas">
                    <div><span /> Firma del técnico</div>
                    <div><span /> Conformidad del cliente</div>
                </div>
                <p className="informe-pie">Informe generado el {new Date().toLocaleDateString("es-AR")}.</p>
            </div>
        </div>
    );
};

export default InformeRelevamiento;
