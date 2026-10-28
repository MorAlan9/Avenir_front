import React, { useEffect, useRef, useState } from "react";
import logo from "../../assets/avenir-logo.png";
import "./juego.css";
import { leerRanking, ordenar, reiniciarRanking, suscribirRanking } from "./ranking";
import { rangoDe, type Resultado } from "./datos";

// Pantalla grande del stand: se actualiza sola cuando alguien termina de jugar (otra ventana del mismo navegador).
const RankingEnVivo: React.FC = () => {
    const [lista, setLista] = useState<Resultado[]>(() => ordenar(leerRanking()));
    const [nuevo, setNuevo] = useState<string | null>(null);
    const vistos = useRef(new Set(lista.map((r) => r.id)));

    useEffect(() => suscribirRanking(() => {
        const l = ordenar(leerRanking());
        const reciente = l.find((r) => !vistos.current.has(r.id));
        l.forEach((r) => vistos.current.add(r.id));
        if (reciente) { setNuevo(reciente.id); window.setTimeout(() => setNuevo(null), 2200); }
        setLista(l);
    }), []);

    const reiniciar = () => {
        if (window.confirm("¿Borrar TODO el ranking?")) { reiniciarRanking(); vistos.current.clear(); setLista([]); }
    };

    const podio = [lista[1], lista[0], lista[2]];
    const clases = ["p2", "p1", "p3"];
    const posiciones = [2, 1, 3];

    return (
        <div className="jg-root">
            <div className="jg-aros"><i /><i /><i /></div>
            <div className="jg-ranking">
                <div className="jg-rk-cab">
                    <h1>Ranking <em>Inspector Avenir</em></h1>
                    <div className="jg-logo-chip"><img src={logo} alt="Avenir" /></div>
                </div>
                <div className="jg-rk-cuerpo">
                    <div>
                        {lista.length === 0 ? (
                            <div className="jg-vacio" style={{ fontSize: "1.4rem" }}>Todavía nadie jugó. ¡Acercate a la tablet y encontrá los riesgos!</div>
                        ) : (
                            <div className="jg-podio">
                                {podio.map((r, i) => r ? (
                                    <div key={r.id} className={`jg-puesto ${clases[i]}`}>
                                        <div className="medalla">{posiciones[i]}</div>
                                        <b>{r.nombre}</b>
                                        <small>{r.empresa || rangoDe(r.puntos).nombre}</small>
                                        <div className="pts">{r.puntos}</div>
                                    </div>
                                ) : <div key={i} />)}
                            </div>
                        )}
                    </div>
                    <div className="jg-lista">
                        {lista.slice(3, 10).map((r, i) => (
                            <div key={r.id} className={`jg-fila${nuevo === r.id ? " nuevo" : ""}`}>
                                <span className="pos">{i + 4}</span>
                                <span>{r.nombre}{r.empresa ? ` · ${r.empresa}` : ""}</span>
                                <span className="pts">{r.puntos}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="jg-rk-pie">
                    <span>Jugá en la tablet · {lista.length} {lista.length === 1 ? "inspector" : "inspectores"} participaron</span>
                    <button onDoubleClick={reiniciar} title="Doble clic para reiniciar">reiniciar</button>
                </div>
            </div>
        </div>
    );
};

export default RankingEnVivo;
