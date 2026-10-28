// Datos del juego "Inspector Avenir": los peligros del taller, los niveles de riesgo y los rangos.
// Los niveles y tipos de riesgo son los mismos que usa el sistema real (Parámetros IPER).

export type Nivel = "BAJA" | "MEDIA" | "ALTA" | "CRITICA";

export const NIVELES: { id: Nivel; etiqueta: string; color: string; orden: number }[] = [
    { id: "BAJA", etiqueta: "Baja", color: "#22C55E", orden: 0 },
    { id: "MEDIA", etiqueta: "Media", color: "#EAB308", orden: 1 },
    { id: "ALTA", etiqueta: "Alta", color: "#F97316", orden: 2 },
    { id: "CRITICA", etiqueta: "Crítica", color: "#EF4444", orden: 3 },
];

export const colorDeNivel = (n: Nivel) => NIVELES.find((x) => x.id === n)!.color;
export const etiquetaDeNivel = (n: Nivel) => NIVELES.find((x) => x.id === n)!.etiqueta;
export const ordenDeNivel = (n: Nivel) => NIVELES.find((x) => x.id === n)!.orden;

export interface Peligro {
    id: string;
    titulo: string;
    tipo: string;
    nivel: Nivel;
    descripcion: string;
    medida: string;
    pista: string;
    /** Posición del marcador en la escena (viewBox 1200 x 650). */
    x: number;
    y: number;
}

export const PELIGROS: Peligro[] = [
    {
        id: "tablero", titulo: "Tablero eléctrico abierto", tipo: "Eléctrico", nivel: "CRITICA",
        descripcion: "El tablero está sin tapa y con cables pelados a la vista: riesgo de electrocución y de incendio.",
        medida: "Cerrar y señalizar el tablero, bloqueo y etiquetado (LOTO) y mantenimiento solo por personal habilitado.",
        pista: "Algo de la pared izquierda echa chispas.", x: 110, y: 235,
    },
    {
        id: "torno", titulo: "Máquina sin protección", tipo: "Mecánico", nivel: "CRITICA",
        descripcion: "El resguardo del torno está retirado y la parte giratoria queda expuesta: atrapamiento y proyección de partículas.",
        medida: "Reponer el resguardo con enclavamiento, procedimiento de bloqueo y capacitación del operador.",
        pista: "Mirá bien la máquina del centro: le falta algo.", x: 450, y: 370,
    },
    {
        id: "salida", titulo: "Salida de emergencia bloqueada", tipo: "Incendio", nivel: "CRITICA",
        descripcion: "Hay cajas y pallets frente a la puerta de salida: ante un incendio no se puede evacuar.",
        medida: "Mantener las vías de evacuación libres, demarcadas y señalizadas, con inspecciones periódicas.",
        pista: "¿Podrías salir rápido por la puerta verde?", x: 1130, y: 350,
    },
    {
        id: "derrame", titulo: "Derrame de aceite en el piso", tipo: "Caída de personas", nivel: "ALTA",
        descripcion: "Hay aceite en el piso, junto a la máquina: resbalones y caídas del personal.",
        medida: "Limpiar de inmediato con material absorbente, señalizar la zona y corregir la fuga de origen.",
        pista: "El piso brilla donde no debería.", x: 470, y: 548,
    },
    {
        id: "soldador", titulo: "Soldador sin protección", tipo: "Físico", nivel: "ALTA",
        descripcion: "Está soldando sin careta, sin guantes y con la cabeza descubierta: radiación, quemaduras y chispas.",
        medida: "Careta de soldar, guantes, delantal y calzado; capacitación y control del uso de EPP.",
        pista: "Una luz muy intensa… y nadie se cubre.", x: 660, y: 400,
    },
    {
        id: "quimicos", titulo: "Bidones sin rotular", tipo: "Químico", nivel: "ALTA",
        descripcion: "Los bidones no tienen etiqueta y uno pierde líquido: no se sabe qué contienen ni cómo actuar.",
        medida: "Rotulado según SGA, hojas de seguridad a mano, bandeja de contención y almacenamiento separado.",
        pista: "Esos bidones del piso no dicen qué tienen adentro.", x: 150, y: 480,
    },
    {
        id: "estanteria", titulo: "Estantería sobrecargada", tipo: "Mecánico", nivel: "MEDIA",
        descripcion: "Las cajas pesadas están arriba de todo, desparejas y sobresaliendo: pueden caer sobre el personal.",
        medida: "Respetar la carga máxima, anclar la estantería y colocar lo pesado abajo y bien apilado.",
        pista: "Alguna caja está a punto de caerse.", x: 995, y: 240,
    },
    {
        id: "extintor", titulo: "Extintor vencido y obstruido", tipo: "Incendio", nivel: "MEDIA",
        descripcion: "El extintor tiene la carga vencida y está tapado por cajas: no se llega a usarlo a tiempo.",
        medida: "Despejar y señalizar el acceso, recargar y controlar los extintores de forma periódica.",
        pista: "¿Dónde está el extintor? ¿Está al alcance?", x: 860, y: 375,
    },
    {
        id: "ergonomia", titulo: "Levantamiento de carga", tipo: "Ergonómico", nivel: "MEDIA",
        descripcion: "Levanta una caja pesada con la espalda encorvada: lesiones lumbares a mediano plazo.",
        medida: "Usar ayudas mecánicas, técnica de levantamiento con piernas flexionadas y rotación de tareas.",
        pista: "Esa postura no es buena para la espalda.", x: 985, y: 540,
    },
    {
        id: "luz", titulo: "Luminaria apagada", tipo: "Físico", nivel: "BAJA",
        descripcion: "Un tubo fluorescente está quemado sobre una zona de paso: menos visibilidad.",
        medida: "Reemplazar el tubo y programar el control de iluminación en el mantenimiento preventivo.",
        pista: "Mirá para arriba: hay una luz que no es como las otras.", x: 265, y: 80,
    },
];

export interface Seguro {
    id: string;
    titulo: string;
    mensaje: string;
}

export const SEGUROS: Seguro[] = [
    { id: "botiquin", titulo: "Botiquín señalizado", mensaje: "El botiquín está completo, a la vista y señalizado. Esto está en regla." },
    { id: "cartel", titulo: "Cartel de EPP", mensaje: "La señal de uso obligatorio de casco está bien ubicada. Esto está en regla." },
];

export const TOTAL_TIEMPO = 75;
export const PENALIZACION_FALSA_ALARMA = 40;
export const SEGUNDOS_FALSA_ALARMA = 3;
export const COSTO_PISTA = 50;
export const PISTAS_MAXIMAS = 2;

export const RANGOS = [
    { desde: 1800, nombre: "Maestro de la Prevención", color: "#6EE7B7" },
    { desde: 1300, nombre: "Inspector Senior", color: "#FDE047" },
    { desde: 800, nombre: "Inspector", color: "#93C5FD" },
    { desde: 0, nombre: "Aprendiz de Prevención", color: "#E5E7EB" },
];

export const rangoDe = (puntos: number) => RANGOS.find((r) => puntos >= r.desde)!;

export interface Hallazgo {
    id: string;
    nivelElegido: Nivel;
}

export interface Resultado {
    id: string;
    nombre: string;
    empresa: string;
    puntos: number;
    encontrados: number;
    exactos: number;
    falsasAlarmas: number;
    segundosRestantes: number;
    fecha: string;
}

export const calcularPuntosHallazgo = (peligro: Peligro, elegido: Nivel) => {
    const dif = Math.abs(ordenDeNivel(peligro.nivel) - ordenDeNivel(elegido));
    return 100 + (dif === 0 ? 100 : dif === 1 ? 50 : 0);
};
