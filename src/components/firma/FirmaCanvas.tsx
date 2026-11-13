import React, { useRef, useState } from "react";
import { Eraser } from "lucide-react";

interface Props {
    /** Recibe la firma como imagen PNG (data URL) o null si se borra. */
    onChange: (firma: string | null) => void;
}

/** Cuadro para firmar con el mouse o con el dedo. */
const FirmaCanvas: React.FC<Props> = ({ onChange }) => {
    const ref = useRef<HTMLCanvasElement>(null);
    const dibujando = useRef(false);
    const [vacio, setVacio] = useState(true);

    const posicion = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = ref.current!;
        const r = canvas.getBoundingClientRect();
        return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
    };

    const empezar = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = ref.current!;
        try { canvas.setPointerCapture(e.pointerId); } catch { /* si el navegador no puede capturar el puntero, se firma igual */ }
        const ctx = canvas.getContext("2d")!;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#0f172a";
        const { x, y } = posicion(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 0.1, y + 0.1);
        ctx.stroke();
        dibujando.current = true;
    };

    const mover = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!dibujando.current) return;
        const ctx = ref.current!.getContext("2d")!;
        const { x, y } = posicion(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const terminar = () => {
        if (!dibujando.current) return;
        dibujando.current = false;
        setVacio(false);
        onChange(ref.current!.toDataURL("image/png"));
    };

    const limpiar = () => {
        const canvas = ref.current!;
        canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
        setVacio(true);
        onChange(null);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <canvas
                ref={ref}
                width={600}
                height={200}
                onPointerDown={empezar}
                onPointerMove={mover}
                onPointerUp={terminar}
                onPointerLeave={terminar}
                style={{ width: "100%", height: "auto", aspectRatio: "3 / 1", background: "#fff", border: "1px dashed #94a3b8", borderRadius: 8, touchAction: "none", cursor: "crosshair" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span className="rel-ayuda">{vacio ? "Firmá en el recuadro con el mouse o el dedo." : "Firma lista."}</span>
                <button type="button" className="rel-btn gris chico" onClick={limpiar}><Eraser size={13} /> Borrar</button>
            </div>
        </div>
    );
};

export default FirmaCanvas;
