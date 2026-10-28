import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Gamepad2, ArrowRight, Trophy, MousePointerClick } from "lucide-react";
import logo from "../../assets/avenir-logo.png";
import "./juego.css";
import "./demo.css";

// Página de la demo pública (QR del folleto): el juego + un recorrido interactivo por el sistema con capturas
// de la demo local (datos ficticios). No usa el backend, así que anda sin cuenta y sin Internet lenta.
const MODULOS = [
    { id: "panel", titulo: "Panel de control", img: "/demo/panel.jpg", texto: "Una sola entrada para todo el equipo: el menú muestra los módulos según el rol de cada persona." },
    { id: "empresas", titulo: "Empresas", img: "/demo/empresas.jpg", texto: "Alta de empresas clientes con su CUIT y dirección en el mapa, para asignarles visitas y relevamientos." },
    { id: "relevamientos", titulo: "Relevamientos", img: "/demo/relevamientos.jpg", texto: "El técnico registra los hallazgos de cada visita (con fotos) y se sigue cuántos están resueltos." },
    { id: "iper", titulo: "Historial IPER", img: "/demo/iper.jpg", texto: "Matriz de identificación de peligros y evaluación de riesgos: nivel, estado y reporte en PDF." },
    { id: "insumos", titulo: "Insumos y EPP", img: "/demo/insumos.jpg", texto: "Catálogo con stock y stock mínimo; entregas de elementos de protección al personal." },
    { id: "estadisticas", titulo: "Estadísticas", img: "/demo/estadisticas.jpg", texto: "Asistencia, horas trabajadas, viáticos y relevamientos en gráficos para decidir rápido." },
    { id: "roles", titulo: "Roles y permisos", img: "/demo/roles.jpg", texto: "48 permisos por módulo: cada persona ve y hace solo lo que le corresponde." },
];

const DemoPublica: React.FC = () => {
    const [actual, setActual] = useState(MODULOS[0].id);
    const m = MODULOS.find((x) => x.id === actual)!;
    return (
        <div className="jg-root dm-root">
            <div className="jg-aros"><i /><i /><i /></div>
            <div className="dm-wrap">
                <header className="dm-cab">
                    <div className="jg-logo-chip"><img src={logo} alt="Avenir" /></div>
                    <Link className="dm-link" to="/">Ir a la web de Avenir <ArrowRight size={16} /></Link>
                </header>
                <h1 className="dm-titulo">Probá <em>Avenir</em>: jugá y recorré el sistema</h1>
                <p className="dm-baj">Elegí cómo querés conocernos. Todo es una demo con datos ficticios.</p>

                <div className="dm-cards">
                    <Link to="/juego" className="dm-card dm-card-juego">
                        <Gamepad2 size={34} />
                        <h2>Inspector Avenir: el juego</h2>
                        <p>Encontrá los 10 riesgos escondidos en el taller, clasificalos y llevate tu certificado. ¡Entrás al ranking!</p>
                        <span className="jg-btn jg-btn-mint">Jugar ahora <ArrowRight size={16} style={{ verticalAlign: "-3px" }} /></span>
                    </Link>
                    <a href="#recorrido" className="dm-card">
                        <MousePointerClick size={34} />
                        <h2>Recorré el sistema</h2>
                        <p>Tocá cada módulo y mirá cómo se ve Avenir por dentro: empresas, relevamientos, riesgos IPER, insumos y más.</p>
                        <span className="jg-btn jg-btn-ghost">Ver el recorrido</span>
                    </a>
                </div>

                <section id="recorrido" className="dm-recorrido">
                    <div className="dm-tabs" role="tablist">
                        {MODULOS.map((x) => (
                            <button key={x.id} role="tab" aria-selected={x.id === actual} className={`dm-tab${x.id === actual ? " on" : ""}`} onClick={() => setActual(x.id)}>{x.titulo}</button>
                        ))}
                    </div>
                    <div className="dm-visor">
                        <img key={m.id} src={m.img} alt={`Pantalla de ${m.titulo}`} className="dm-img" />
                        <div className="dm-pie"><b>{m.titulo}</b><span>{m.texto}</span></div>
                    </div>
                </section>

                <footer className="dm-fin">
                    <Link to="/juego/ranking" className="dm-link"><Trophy size={16} /> Ver el ranking en vivo</Link>
                    <span>¿Querés probarlo con tu equipo? Pedí tu usuario de prueba en el stand.</span>
                </footer>
            </div>
        </div>
    );
};

export default DemoPublica;
