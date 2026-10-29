import React, { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, MapPin, ShieldCheck } from "lucide-react";
import { evento } from "./telemetria";

// Empresas FICTICIAS de la demo (mismas coordenadas que la demo local). La ubicación del visitante se usa solo en su
// dispositivo para dibujar el mapa y calcular distancias: no se envía ni se guarda en ningún lado.
const EMPRESAS = [
    { id: 1, nombre: "Metalúrgica Sierras", rubro: "Metalmecánica", lat: -31.4767, lng: -64.1356 },
    { id: 2, nombre: "Alimentos del Centro", rubro: "Alimentos", lat: -31.4586, lng: -64.3604 },
    { id: 3, nombre: "Construcciones Mediterránea", rubro: "Construcción", lat: -31.4241, lng: -64.4978 },
    { id: 4, nombre: "Transportes Docta", rubro: "Transporte", lat: -31.6521, lng: -63.9091 },
    { id: 5, nombre: "Frigorífico San Jorge", rubro: "Frigorífico", lat: -31.654, lng: -64.4283 },
];

const pin = (color: string, texto: string) => L.divIcon({
    className: "",
    html: `<div style="background:${color};color:#fff;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:grid;place-items:center;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4)"><span style="transform:rotate(45deg);font:800 13px Inter,sans-serif">${texto}</span></div>`,
    iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28],
});

const km = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const r = 6371, rad = (x: number) => (x * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * r * Math.asin(Math.sqrt(h));
};

const Encuadre: React.FC<{ puntos: [number, number][] }> = ({ puntos }) => {
    const map = useMap();
    React.useEffect(() => {
        map.invalidateSize();
        if (puntos.length > 1) map.fitBounds(L.latLngBounds(puntos), { padding: [40, 40], maxZoom: 13 });
        const t = window.setTimeout(() => map.invalidateSize(), 400);
        return () => window.clearTimeout(t);
    }, [puntos, map]);
    return null;
};

type Estado = { fase: "reposo" } | { fase: "buscando" } | { fase: "listo"; lat: number; lng: number; precision: number } | { fase: "error"; texto: string };

const MapaDemo: React.FC = () => {
    const [estado, setEstado] = useState<Estado>({ fase: "reposo" });

    const usarUbicacion = () => {
        if (!navigator.geolocation) { setEstado({ fase: "error", texto: "Tu navegador no permite usar la ubicación." }); return; }
        setEstado({ fase: "buscando" });
        evento("MAPA"); // solo avisa que usó el mapa: la ubicación NO se envía
        navigator.geolocation.getCurrentPosition(
            (p) => setEstado({ fase: "listo", lat: p.coords.latitude, lng: p.coords.longitude, precision: p.coords.accuracy }),
            (e) => setEstado({ fase: "error", texto: e.code === 1 ? "No diste permiso para la ubicación. Podés seguir viendo el mapa." : "No pudimos obtener tu ubicación. Probá de nuevo." }),
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
        );
    };

    const yo = estado.fase === "listo" ? { lat: estado.lat, lng: estado.lng } : null;
    const distancias = useMemo(() => (yo ? EMPRESAS.map((e) => ({ ...e, d: km(yo, e) })).sort((a, b) => a.d - b.d) : []), [yo?.lat, yo?.lng]);
    const cercana = distancias[0];
    const puntos = useMemo<[number, number][]>(() => (yo && cercana ? [[yo.lat, yo.lng], [cercana.lat, cercana.lng]] : EMPRESAS.map((e) => [e.lat, e.lng] as [number, number])), [yo?.lat, yo?.lng, cercana?.id]);

    return (
        <div className="dm-mapa">
            <div className="dm-mapa-cab">
                <div>
                    <h3>Visitas con ubicación</h3>
                    <p>Así ve Avenir dónde están las empresas y qué tan lejos queda cada visita (con eso calcula los viáticos por km).</p>
                </div>
                <button className="jg-btn jg-btn-mint" onClick={usarUbicacion} disabled={estado.fase === "buscando"}>
                    <LocateFixed size={18} style={{ verticalAlign: "-3px" }} /> {estado.fase === "buscando" ? "Buscando…" : "Usar mi ubicación"}
                </button>
            </div>
            <div className="dm-mapa-caja">
                <MapContainer center={[-31.5, -64.3]} zoom={9} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
                    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Encuadre puntos={puntos} />
                    {EMPRESAS.map((e) => (
                        <Marker key={e.id} position={[e.lat, e.lng]} icon={pin("#0F6B45", String(e.id))}>
                            <Popup><b>{e.nombre}</b><br />{e.rubro} · empresa de ejemplo</Popup>
                        </Marker>
                    ))}
                    {yo && <Marker position={[yo.lat, yo.lng]} icon={pin("#2563EB", "Yo")}><Popup><b>Vos estás acá</b></Popup></Marker>}
                    {yo && cercana && <Polyline positions={[[yo.lat, yo.lng], [cercana.lat, cercana.lng]]} pathOptions={{ color: "#2563EB", dashArray: "6 8", weight: 3 }} />}
                </MapContainer>
            </div>
            {estado.fase === "error" && <p className="dm-mapa-aviso">{estado.texto}</p>}
            {estado.fase === "listo" && cercana && (
                <div className="dm-mapa-res">
                    <p><MapPin size={16} style={{ verticalAlign: "-3px" }} /> La empresa más cercana es <b>{cercana.nombre}</b>, a <b>{cercana.d.toFixed(1).replace(".", ",")} km</b> en línea recta de donde estás.</p>
                    <ul>{distancias.map((e) => (<li key={e.id}><span>{e.id}. {e.nombre}</span><b>{e.d.toFixed(0)} km</b></li>))}</ul>
                </div>
            )}
            <p className="dm-mapa-priv"><ShieldCheck size={14} style={{ verticalAlign: "-2px" }} /> Tu ubicación se usa solo en tu dispositivo para mostrarte el mapa: no se envía ni se guarda.</p>
        </div>
    );
};

export default MapaDemo;
