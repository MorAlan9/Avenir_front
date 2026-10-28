import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import logo from "../../assets/avenir-logo.png";
import "./juego.css";
import { PELIGROS } from "./datos";

const Certificado: React.FC = () => {
    const [q] = useSearchParams();
    const nombre = q.get("n") || "Inspector/a";
    const empresa = q.get("e") || "";
    const puntos = q.get("p") || "0";
    const encontrados = q.get("f") || "0";
    const exactos = q.get("x") || "0";
    const rango = q.get("r") || "Inspector";
    const fecha = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });

    useEffect(() => {
        const t = window.setTimeout(() => window.print(), 700);
        return () => window.clearTimeout(t);
    }, []);

    return (
        <div className="jg-cert-pagina">
            <div className="jg-cert">
                <span className="aro" style={{ width: "150mm", height: "150mm", right: "-40mm", bottom: "-60mm" }} />
                <span className="aro" style={{ width: "100mm", height: "100mm", left: "-30mm", top: "-40mm" }} />
                <div className="contenido">
                    <img className="logo" src={logo} alt="Avenir" />
                    <div className="sup">Certificado de participación</div>
                    <h1>Inspector <em>Avenir</em></h1>
                    <div className="otorga">Se otorga el rango de <b>{rango}</b> a</div>
                    <div className="nombre">{nombre}</div>
                    {empresa && <div className="emp">{empresa}</div>}
                    <p className="texto">por identificar y clasificar riesgos laborales en el desafío de inspección de Avenir, aplicando los mismos niveles del Análisis de Riesgos (IPER) del sistema.</p>
                    <div className="datos">
                        <div><b>{puntos}</b><small>Puntos</small></div>
                        <div><b>{encontrados}/{PELIGROS.length}</b><small>Riesgos hallados</small></div>
                        <div><b>{exactos}</b><small>Bien clasificados</small></div>
                    </div>
                </div>
                <div className="pie"><span>{fecha}</span><span className="firma">Equipo Avenir</span></div>
            </div>
            <div className="jg-cert-aviso">Si no se abrió la impresión: <button onClick={() => window.print()}>Imprimir / guardar PDF</button></div>
        </div>
    );
};

export default Certificado;
