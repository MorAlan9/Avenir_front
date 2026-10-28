import React, { useRef } from "react";
import { PELIGROS, colorDeNivel, type Nivel } from "./datos";

// Escena ilustrada del taller (SVG, viewBox 1200 x 650). Los peligros son zonas táctiles;
// lo que se encuentra se marca con una insignia del color del nivel elegido.

interface Props {
    encontrados: Record<string, Nivel>;
    pista: string | null;
    mostrarFaltantes: boolean;
    interactivo: boolean;
    onPeligro: (id: string) => void;
    onSeguro: (id: string) => void;
    onVacio: (x: number, y: number) => void;
}

const Barril: React.FC<{ x: number; y: number; color: string; inclinado?: boolean }> = ({ x, y, color, inclinado }) => (
    <g transform={inclinado ? `rotate(16 ${x + 30} ${y + 100})` : undefined}>
        <rect x={x} y={y} width="62" height="100" rx="10" fill={color} />
        <rect x={x} y={y + 16} width="62" height="6" fill="#000" opacity=".22" />
        <rect x={x} y={y + 76} width="62" height="6" fill="#000" opacity=".22" />
        <rect x={x + 10} y={y + 34} width="42" height="34" rx="3" fill="#F3F4F6" opacity=".92" />
        <text x={x + 31} y={y + 60} textAnchor="middle" fontSize="24" fontWeight="800" fill="#9CA3AF">?</text>
        <ellipse cx={x + 31} cy={y + 2} rx="30" ry="6" fill="#fff" opacity=".28" />
    </g>
);

const Caja: React.FC<{ x: number; y: number; w: number; h: number; tono?: string }> = ({ x, y, w, h, tono = "#B98A56" }) => (
    <g>
        <rect x={x} y={y} width={w} height={h} rx="3" fill={tono} />
        <rect x={x} y={y} width={w} height="6" fill="#000" opacity=".12" />
        <rect x={x + w / 2 - 4} y={y} width="8" height={h} fill="#E8D3A8" opacity=".55" />
    </g>
);

const Lampara: React.FC<{ x: number; apagada?: boolean }> = ({ x, apagada }) => (
    <g className={apagada ? "jg-parpadeo" : undefined}>
        <rect x={x} y="62" width="74" height="10" rx="4" fill="#8A979D" />
        <rect x={x + 4} y="72" width="66" height="9" rx="4" fill={apagada ? "#454F54" : "#FFF8D6"} />
        {!apagada && <ellipse cx={x + 37} cy="104" rx="64" ry="24" fill="#FFF3B0" opacity=".28" />}
        {apagada && <path d={`M${x + 68} 82 l5 7 l-3 0 l4 8`} stroke="#FFE066" strokeWidth="2.5" fill="none" strokeLinecap="round" className="jg-chispa" />}
    </g>
);

const Escena: React.FC<Props> = ({ encontrados, pista, mostrarFaltantes, interactivo, onPeligro, onSeguro, onVacio }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    const alTocarFondo = (e: React.PointerEvent<SVGSVGElement>) => {
        if (!interactivo) return;
        const destino = e.target as Element;
        if (destino.closest("[data-zona]")) return;
        const svg = svgRef.current;
        if (!svg) return;
        const p = svg.createSVGPoint();
        p.x = e.clientX; p.y = e.clientY;
        const m = svg.getScreenCTM();
        if (!m) return;
        const q = p.matrixTransform(m.inverse());
        onVacio(q.x, q.y);
    };

    const zona = (id: string, x: number, y: number, w: number, h: number, tipo: "peligro" | "seguro", etiqueta: string) => (
        <rect key={id} data-zona={id} x={x} y={y} width={w} height={h} rx="14" fill="transparent"
            className={interactivo ? "jg-zona" : undefined} role="button" aria-label={etiqueta}
            onPointerDown={(e) => { if (!interactivo) return; e.stopPropagation(); tipo === "peligro" ? onPeligro(id) : onSeguro(id); }} />
    );

    return (
        <svg ref={svgRef} className="jg-escena" viewBox="0 0 1200 650" onPointerDown={alTocarFondo} role="img"
            aria-label="Taller metalúrgico con peligros para encontrar">
            <defs>
                <linearGradient id="jgPared" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#EEF3F5" /><stop offset="1" stopColor="#D5DFE3" /></linearGradient>
                <linearGradient id="jgPiso" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B9C0C2" /><stop offset="1" stopColor="#8D9699" /></linearGradient>
                <linearGradient id="jgCielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#BFE6F7" /><stop offset="1" stopColor="#EAF8FD" /></linearGradient>
                <radialGradient id="jgBrillo"><stop offset="0" stopColor="#FFFFFF" stopOpacity="1" /><stop offset="0.35" stopColor="#BFE7FF" stopOpacity=".85" /><stop offset="1" stopColor="#7CC4FF" stopOpacity="0" /></radialGradient>
                <pattern id="jgRayas" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="24" fill="#F4C20D" /><rect x="12" width="12" height="24" fill="#1F2A30" /></pattern>
            </defs>

            {/* ---------- ambiente ---------- */}
            <rect width="1200" height="650" fill="url(#jgPared)" />
            <rect width="1200" height="78" fill="#BCC8CE" />
            <path d="M0 78 H1200" stroke="#9FAEB5" strokeWidth="5" />
            {Array.from({ length: 9 }).map((_, i) => <path key={i} d={`M${i * 150} 78 L${i * 150 + 75} 24 L${i * 150 + 150} 78`} stroke="#A7B6BD" strokeWidth="5" fill="none" />)}
            {[360, 700].map((x) => (
                <g key={x}>
                    <rect x={x} y="104" width="150" height="74" rx="4" fill="url(#jgCielo)" stroke="#8DA0A8" strokeWidth="5" />
                    <path d={`M${x + 50} 104V178M${x + 100} 104V178M${x} 141H${x + 150}`} stroke="#8DA0A8" strokeWidth="3" />
                </g>
            ))}
            <rect y="312" width="1200" height="8" fill="#B4C2C8" />
            <rect y="320" width="1200" height="82" fill="#CBD6DA" />
            <rect y="400" width="1200" height="250" fill="url(#jgPiso)" />
            <rect y="400" width="1200" height="12" fill="#000" opacity=".14" />
            <g stroke="#000" opacity=".07" strokeWidth="2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => <path key={i} d={`M${i * 100} 412 L${i * 100 - (i - 6) * 60} 650`} />)}
                <path d="M0 470H1200M0 540H1200M0 600H1200" />
            </g>
            <path d="M0 626 H1200" stroke="#F4C20D" strokeWidth="7" strokeDasharray="42 24" opacity=".9" />

            {/* luces */}
            <Lampara x={230} apagada />
            <Lampara x={520} /><Lampara x={800} /><Lampara x={1030} />

            {/* cartel decorativo */}
            <g>
                <rect x="240" y="150" width="150" height="64" rx="8" fill="#0F6B45" />
                <rect x="246" y="156" width="138" height="52" rx="5" fill="none" stroke="#fff" strokeWidth="2" opacity=".7" />
                <text x="315" y="178" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff" letterSpacing="1">SEGURIDAD</text>
                <text x="315" y="198" textAnchor="middle" fontSize="15" fontWeight="800" fill="#6EE7B7" letterSpacing="1">ES PRIMERO</text>
            </g>

            {/* ---------- seguro: cartel de EPP ---------- */}
            <g>
                <circle cx="473" cy="190" r="40" fill="#1D4ED8" />
                <circle cx="473" cy="190" r="34" fill="none" stroke="#fff" strokeWidth="3" />
                <path d="M452 198 a21 18 0 0 1 42 0 z" fill="#fff" />
                <rect x="448" y="198" width="50" height="7" rx="3" fill="#fff" />
                <rect x="466" y="170" width="14" height="9" rx="2" fill="#fff" />
                <text x="473" y="230" textAnchor="middle" fontSize="11" fontWeight="800" fill="#1D4ED8">USO OBLIGATORIO</text>
            </g>
            {/* ---------- seguro: botiquín ---------- */}
            <g>
                <rect x="604" y="180" width="54" height="54" rx="8" fill="#fff" stroke="#0F6B45" strokeWidth="4" />
                <rect x="624" y="190" width="14" height="34" rx="2" fill="#16A34A" />
                <rect x="614" y="200" width="34" height="14" rx="2" fill="#16A34A" />
            </g>

            {/* ---------- 1. tablero eléctrico abierto ---------- */}
            <g>
                <path d="M95 90 L134 152 L56 152 Z" fill="#F4C20D" stroke="#1F2A30" strokeWidth="5" strokeLinejoin="round" />
                <path d="M98 108 L88 130 H98 L93 144 L110 122 H100 Z" fill="#1F2A30" />
                <rect x="40" y="160" width="112" height="172" rx="6" fill="#52626B" />
                <rect x="50" y="170" width="92" height="152" rx="3" fill="#232C31" />
                {[0, 1, 2, 3].map((i) => (
                    <g key={i}>
                        <rect x="58" y={180 + i * 34} width="34" height="24" rx="3" fill="#E8ECEE" /><rect x="64" y={186 + i * 34} width="10" height="12" fill="#222" />
                        <rect x="100" y={180 + i * 34} width="34" height="24" rx="3" fill="#E8ECEE" /><rect x="106" y={186 + i * 34} width="10" height="12" fill="#222" />
                    </g>
                ))}
                <path d="M152 160 L214 180 L214 348 L152 332 Z" fill="#6C7E88" stroke="#4A5A63" strokeWidth="3" />
                <path d="M70 322 C 60 360, 92 372, 82 410" stroke="#D62828" strokeWidth="5" fill="none" strokeLinecap="round" />
                <path d="M100 322 C 114 352, 90 380, 104 404" stroke="#1D4ED8" strokeWidth="5" fill="none" strokeLinecap="round" />
                <path d="M126 322 C 142 350, 128 374, 138 398" stroke="#EAB308" strokeWidth="5" fill="none" strokeLinecap="round" />
                <circle cx="82" cy="412" r="4.5" fill="#E0A458" /><circle cx="104" cy="406" r="4.5" fill="#E0A458" /><circle cx="138" cy="400" r="4.5" fill="#E0A458" />
                <g className="jg-chispa">
                    <path d="M96 404 l7 -17 l4 11 l11 -7 l-9 18 l-9 -4 z" fill="#FFE066" />
                    <circle cx="120" cy="392" r="3" fill="#FFF3B0" /><circle cx="86" cy="394" r="2.5" fill="#FFF3B0" />
                </g>
            </g>

            {/* ---------- 8. bidones sin rotular ---------- */}
            <g>
                <ellipse cx="160" cy="548" rx="120" ry="12" fill="#000" opacity=".16" />
                <Barril x={70} y={440} color="#2F6FB2" />
                <Barril x={140} y={432} color="#C0392B" />
                <Barril x={214} y={446} color="#D9A21B" inclinado />
                <path d="M262 540 q16 -8 36 -2 q14 8 -2 14 q-30 6 -40 -4 z" fill="#A3E635" opacity=".75" />
                <g className="jg-humo" fill="none" stroke="#B7E36B" strokeWidth="3" strokeLinecap="round" opacity=".7">
                    <path d="M274 520 q-8 -14 2 -26 q10 -12 -2 -26" /><path d="M292 524 q-8 -14 2 -26 q10 -12 -2 -22" />
                </g>
            </g>

            {/* ---------- 2. torno sin resguardo ---------- */}
            <g>
                <ellipse cx="450" cy="508" rx="150" ry="14" fill="#000" opacity=".18" />
                <rect x="344" y="404" width="212" height="100" rx="4" fill="#3E4C54" />
                <rect x="360" y="418" width="80" height="66" rx="3" fill="#2F3A40" /><rect x="452" y="418" width="88" height="66" rx="3" fill="#2F3A40" />
                <rect x="330" y="360" width="240" height="46" rx="4" fill="#5B6E78" />
                <rect x="336" y="288" width="96" height="76" rx="8" fill="#E8A33A" />
                <circle cx="356" cy="312" r="9" fill="#fff" stroke="#8A5A10" strokeWidth="3" /><circle cx="356" cy="312" r="3" fill="#8A5A10" />
                <rect x="372" y="304" width="46" height="16" rx="3" fill="#2F3A40" /><rect x="376" y="308" width="22" height="8" fill="#6EE7B7" />
                <circle cx="446" cy="330" r="30" fill="#9AA7AD" stroke="#6B7A82" strokeWidth="4" />
                <circle cx="446" cy="330" r="13" fill="#4D5A61" />
                <g className="jg-giro" style={{ transformOrigin: "446px 330px" }}>
                    <path d="M446 300 v10 M476 330 h-10 M446 360 v-10 M416 330 h10" stroke="#3B464C" strokeWidth="6" strokeLinecap="round" />
                </g>
                <rect x="474" y="321" width="78" height="18" rx="3" fill="#C3CCD0" />
                <rect x="540" y="302" width="26" height="62" rx="4" fill="#5B6E78" />
                <rect x="508" y="268" width="50" height="22" rx="4" fill="#2F3A40" /><circle cx="523" cy="279" r="5" fill="#EF4444" />
                <g transform="rotate(-14 306 440)">
                    <rect x="282" y="352" width="46" height="108" rx="6" fill="#9FD3E8" opacity=".5" stroke="#5F8797" strokeWidth="4" />
                </g>
                <g stroke="#F4C20D" strokeWidth="5" strokeDasharray="12 7" fill="none"><rect x="326" y="272" width="108" height="98" rx="10" opacity=".0" /></g>
            </g>

            {/* ---------- 4. derrame de aceite ---------- */}
            <g>
                <ellipse cx="470" cy="550" rx="108" ry="21" fill="#1B2428" opacity=".88" />
                <ellipse cx="452" cy="544" rx="64" ry="9" fill="#fff" opacity=".18" className="jg-brillo" />
                <ellipse cx="520" cy="552" rx="30" ry="5" fill="#6EE7B7" opacity=".12" />
                <path d="M470 504 V532" stroke="#1B2428" strokeWidth="5" strokeLinecap="round" />
                <circle cx="470" cy="538" r="5" fill="#1B2428" />
            </g>

            {/* ---------- 5. soldador sin protección ---------- */}
            <g>
                <ellipse cx="655" cy="510" rx="58" ry="9" fill="#000" opacity=".18" />
                <rect x="630" y="432" width="22" height="74" rx="8" fill="#2E4A74" /><rect x="658" y="432" width="22" height="74" rx="8" fill="#2E4A74" />
                <rect x="626" y="498" width="30" height="12" rx="5" fill="#3B3B3B" /><rect x="656" y="498" width="30" height="12" rx="5" fill="#3B3B3B" />
                <path d="M692 372 L742 396 L736 410 L686 388 Z" fill="#F08A24" />
                <rect x="622" y="344" width="68" height="100" rx="18" fill="#F08A24" />
                <path d="M624 366 L602 410 L616 418 L636 382 Z" fill="#F08A24" />
                <circle cx="608" cy="414" r="8" fill="#E3B08C" /><circle cx="744" cy="400" r="8" fill="#E3B08C" />
                <circle cx="656" cy="322" r="22" fill="#E3B08C" />
                <path d="M634 318 a22 20 0 0 1 44 0 z" fill="#3A2A22" />
                <path d="M644 326 q4 -3 8 0 M660 326 q4 -3 8 0" stroke="#3A2A22" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M744 400 L790 414" stroke="#444" strokeWidth="6" strokeLinecap="round" />
                <rect x="700" y="420" width="120" height="14" fill="#5B6770" />
                <rect x="710" y="434" width="8" height="68" fill="#47525A" /><rect x="802" y="434" width="8" height="68" fill="#47525A" />
                <rect x="730" y="408" width="64" height="12" fill="#9AA6AC" />
                <g className="jg-arco">
                    <circle cx="796" cy="416" r="26" fill="url(#jgBrillo)" />
                    <path d="M796 396 l4 14 l14 -4 l-10 10 l10 10 l-14 -4 l-4 14 l-4 -14 l-14 4 l10 -10 l-10 -10 l14 4 z" fill="#fff" />
                </g>
                <g className="jg-chispas" fill="#FFD166">
                    <circle cx="780" cy="428" r="3" /><circle cx="812" cy="430" r="2.6" /><circle cx="800" cy="440" r="2.2" /><circle cx="822" cy="420" r="2.4" />
                </g>
            </g>

            {/* ---------- 7. extintor vencido y tapado ---------- */}
            <g>
                <rect x="846" y="330" width="26" height="70" rx="9" fill="#C62828" />
                <rect x="852" y="318" width="14" height="14" rx="3" fill="#2B2B2B" />
                <path d="M866 322 q16 0 14 22" stroke="#2B2B2B" strokeWidth="4" fill="none" strokeLinecap="round" />
                <rect x="849" y="352" width="20" height="22" rx="2" fill="#fff" opacity=".9" />
                <rect x="878" y="346" width="16" height="22" rx="2" fill="#fff" stroke="#C62828" strokeWidth="2" />
                <path d="M882 351 l8 12 M890 351 l-8 12" stroke="#C62828" strokeWidth="2.5" />
                <Caja x={826} y={398} w={78} h={52} />
                <Caja x={836} y={360} w={52} h={40} tono="#C9A06B" />
                <Caja x={838} y={448} w={70} h={6} tono="#8A6A3F" />
            </g>

            {/* ---------- 6. estantería sobrecargada ---------- */}
            <g transform="rotate(-1.6 995 250)">
                <rect x="930" y="112" width="8" height="292" fill="#3E6EA8" /><rect x="1052" y="112" width="8" height="292" fill="#3E6EA8" />
                {[204, 292, 380].map((y) => <rect key={y} x="926" y={y} width="138" height="9" fill="#E58E26" />)}
                <Caja x={942} y={332} w={52} h={48} /><Caja x={1002} y={340} w={44} h={40} tono="#C9A06B" />
                <Caja x={946} y={250} w={50} h={42} tono="#C9A06B" /><Caja x={1004} y={254} w={42} h={38} />
                <Caja x={936} y={138} w={64} h={66} /><Caja x={1004} y={150} w={74} h={54} tono="#C9A06B" />
                <g transform="rotate(-14 986 104)"><Caja x={958} y={86} w={54} h={46} /></g>
            </g>

            {/* ---------- 9. levantamiento de carga ---------- */}
            <g>
                <ellipse cx="985" cy="614" rx="68" ry="9" fill="#000" opacity=".18" />
                <rect x="954" y="548" width="22" height="64" rx="8" fill="#2E4A74" /><rect x="980" y="548" width="22" height="64" rx="8" fill="#2E4A74" />
                <rect x="950" y="604" width="30" height="11" rx="5" fill="#3B3B3B" /><rect x="980" y="604" width="30" height="11" rx="5" fill="#3B3B3B" />
                <g transform="rotate(52 980 556)"><rect x="954" y="478" width="50" height="86" rx="16" fill="#3FA796" /></g>
                <circle cx="1036" cy="520" r="19" fill="#E3B08C" /><path d="M1017 516 a19 17 0 0 1 38 0 z" fill="#3A2A22" />
                <path d="M1012 546 L1040 566 L1030 576 L1004 556 Z" fill="#3FA796" />
                <Caja x={1020} y={556} w={78} h={58} />
                <rect x="1046" y="570" width="28" height="16" rx="3" fill="#fff" opacity=".9" />
                <text x="1060" y="582" textAnchor="middle" fontSize="11" fontWeight="800" fill="#7C2D12">25 kg</text>
            </g>

            {/* ---------- 3. salida de emergencia bloqueada ---------- */}
            <g>
                <rect x="1090" y="200" width="82" height="34" rx="6" fill="#12B76A" />
                <text x="1116" y="223" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff">SALIDA</text>
                <circle cx="1152" cy="217" r="4" fill="#fff" /><path d="M1146 232 l5 -9 l5 6 l-3 5" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
                <rect x="1088" y="240" width="88" height="202" rx="4" fill="#1F6F4A" />
                <rect x="1096" y="248" width="72" height="194" rx="3" fill="#3FA46F" />
                <rect x="1100" y="340" width="64" height="9" rx="4" fill="#CBD5D1" />
                <rect x="1044" y="436" width="130" height="16" fill="#A9794A" /><path d="M1054 436 v16 M1090 436 v16 M1126 436 v16 M1162 436 v16" stroke="#7B5632" strokeWidth="3" />
                <Caja x={1050} y={380} w={64} h={56} /><Caja x={1118} y={388} w={54} h={48} tono="#C9A06B" />
                <Caja x={1076} y={326} w={70} h={56} tono="#B07F4C" />
                <rect x="1044" y="452" width="130" height="16" fill="url(#jgRayas)" opacity=".9" />
            </g>

            {/* ---------- marcadores ---------- */}
            {PELIGROS.map((p, i) => {
                const nivel = encontrados[p.id];
                const faltante = !nivel && mostrarFaltantes;
                if (!nivel && !faltante) return null;
                const color = nivel ? colorDeNivel(nivel) : "#E5E7EB";
                return (
                    <g key={p.id} className="jg-marca" style={{ transformOrigin: `${p.x}px ${p.y}px` }}>
                        <circle cx={p.x} cy={p.y} r="34" fill="none" stroke={color} strokeWidth="5" strokeDasharray={nivel ? undefined : "8 6"} />
                        <circle cx={p.x} cy={p.y} r="17" fill={nivel ? color : "#1F2A30"} stroke="#fff" strokeWidth="3" />
                        <text x={p.x} y={p.y + 6} textAnchor="middle" fontSize="18" fontWeight="800" fill={nivel ? "#fff" : "#E5E7EB"}>{nivel ? i + 1 : "!"}</text>
                    </g>
                );
            })}

            {pista && (() => {
                const p = PELIGROS.find((x) => x.id === pista);
                return p ? <circle className="jg-pista" cx={p.x} cy={p.y} r="48" fill="none" stroke="#6EE7B7" strokeWidth="6" /> : null;
            })()}

            {/* ---------- zonas táctiles ---------- */}
            {zona("tablero", 30, 85, 190, 255, "peligro", "Tablero eléctrico")}
            {zona("luz", 200, 40, 130, 90, "peligro", "Luminaria")}
            {zona("quimicos", 40, 405, 250, 170, "peligro", "Bidones")}
            {zona("torno", 275, 270, 310, 240, "peligro", "Máquina")}
            {zona("derrame", 350, 520, 250, 60, "peligro", "Piso")}
            {zona("soldador", 585, 290, 225, 230, "peligro", "Soldador")}
            {zona("extintor", 822, 316, 98, 144, "peligro", "Extintor")}
            {zona("estanteria", 920, 80, 160, 330, "peligro", "Estantería")}
            {zona("ergonomia", 925, 460, 190, 170, "peligro", "Operario levantando carga")}
            {zona("salida", 1040, 195, 150, 275, "peligro", "Salida de emergencia")}
            {zona("botiquin", 598, 172, 66, 74, "seguro", "Botiquín")}
            {zona("cartel", 428, 142, 90, 100, "seguro", "Cartel")}
        </svg>
    );
};

export default Escena;
