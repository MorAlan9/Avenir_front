import React, { useEffect, useRef, useState } from "react";
import logo from "../../assets/avenir-logo.png";
import "./juego.css";
import { leerRanking, ordenar, suscribirRanking } from "./ranking";
import { rangoDe, type Resultado } from "./datos";
import { frase, MODULO_TITULOS, pedirActividad, type EventoVivo } from "./telemetria";

// Pantalla grande del stand: se actualiza sola cuando alguien termina de jugar (otra ventana del mismo navegador).
const RankingEnVivo: React.FC = () => {
    const [lista, setLista] = useState<Resultado[]>(() => ordenar(leerRanking()));
    const [nuevo, setNuevo] = useState<string | null>(null);
    const vistos = useRef(new Set(lista.map((r) => r.id)));
    const [feed, setFeed] = useState<EventoVivo[]>([]);
    const [enLinea, setEnLinea] = useState(0);
    const [modulos, setModulos] = useState<Record<string, number>>({});
    const ultimoId = useRef(0);

    // Actividad en vivo de TODOS los que entraron por el QR: qué abren y qué riesgos encuentran.
    useEffect(() => {
        let vivo = true;
        const vuelta = async () => {
            const a = await pedirActividad(ultimoId.current);
            if (!vivo || !a) return;
            ultimoId.current = Math.max(ultimoId.current, a.ultimoId);
            setEnLinea(a.enLinea);
            setModulos(a.modulos ?? {});
            if (a.eventos.length) setFeed((f) => [...a.eventos.slice().reverse(), ...f].slice(0, 12));
        };
        void vuelta();
        const t = window.setInterval(vuelta, 2500);
        return () => { vivo = false; window.clearInterval(t); };
    }, []);
    const maxModulo = Math.max(1, ...Object.values(modulos));

    useEffect(() => suscribirRanking(() => {
        const l = ordenar(leerRanking());
        const reciente = l.find((r) => !vistos.current.has(r.id));
        l.forEach((r) => vistos.current.add(r.id));
        if (reciente) { setNuevo(reciente.id); window.setTimeout(() => setNuevo(null), 2200); }
        setLista(l);
    }), []);

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
                    <div>
                    <div className="jg-lista">
                        {lista.slice(3, 10).map((r, i) => (
                            <div key={r.id} className={`jg-fila${nuevo === r.id ? " nuevo" : ""}`}>
                                <span className="pos">{i + 4}</span>
                                <span>{r.nombre}{r.empresa ? ` · ${r.empresa}` : ""}</span>
                                <span className="pts">{r.puntos}</span>
                            </div>
                        ))}
                    </div>
                    <div className="jg-vivo">
                        <h2><i className="jg-punto" /> En vivo · {enLinea} {enLinea === 1 ? "persona" : "personas"} ahora</h2>
                        {feed.length === 0 ? <p className="jg-vivo-vacio">Esperando actividad… escaneá el QR y probá un módulo.</p> : (
                            <ul>{feed.map((e) => <li key={e.id}><b>{e.nombre}</b> {frase(e)}</li>)}</ul>
                        )}
                        {Object.keys(modulos).length > 0 && (
                            <div className="jg-modulos">
                                {Object.entries(modulos).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id, n]) => (
                                    <div key={id}><span>{MODULO_TITULOS[id] ?? id}</span><div><i style={{ width: `${(n / maxModulo) * 100}%` }} /></div><em>{n}</em></div>
                                ))}
                            </div>
                        )}
                    </div>
                    </div>
                </div>
                <div className="jg-rk-pie">
                    <span>Escaneá el QR y jugá desde tu celular · {lista.length} {lista.length === 1 ? "inspector" : "inspectores"} en el ranking</span>
                </div>
            </div>
        </div>
    );
};

export default RankingEnVivo;
