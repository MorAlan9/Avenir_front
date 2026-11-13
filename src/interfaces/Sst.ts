import type { Empresa } from "./Empresa";

export type TipoIncidente = "ACCIDENTE_CON_BAJA" | "ACCIDENTE_SIN_BAJA" | "INCIDENTE";
export type GravedadIncidente = "LEVE" | "MODERADO" | "GRAVE";
export type EstadoIncidente = "ABIERTO" | "EN_INVESTIGACION" | "CERRADO";

export interface AccionCorrectiva {
    idAccion: number;
    descripcion: string;
    responsable?: string | null;
    fechaLimite: string;
    estado: "PENDIENTE" | "HECHA";
    fechaCumplimiento?: string | null;
    vencida?: boolean;
}

export interface Incidente {
    idIncidente: number;
    empresa: Empresa;
    fecha: string;
    tipo: TipoIncidente;
    gravedad: GravedadIncidente;
    afectado?: string | null;
    descripcion: string;
    causas?: string | null;
    diasPerdidos: number;
    estado: EstadoIncidente;
    fechaCierre?: string | null;
    acciones: AccionCorrectiva[];
}

export interface IndicadoresIncidentes {
    diasSinAccidentes: number | null;
    ultimoAccidente: string | null;
    accidentesConBaja: number;
    accidentesSinBaja: number;
    incidentes: number;
    diasPerdidos: number;
    abiertos: number;
    accionesVencidas: number;
    horasTrabajadas: number | null;
    indiceFrecuencia: number | null;
    indiceGravedad: number | null;
}

export type TipoVencimiento = "MATAFUEGOS" | "HABILITACION" | "SEGURO" | "ART" | "MEDICION" | "CAPACITACION" | "OTRO";
export type Semaforo = "VIGENTE" | "POR_VENCER" | "VENCIDO";

export interface Vencimiento {
    idVencimiento: number;
    empresa: Empresa;
    tipo: TipoVencimiento;
    descripcion: string;
    fechaVencimiento: string;
    notas?: string | null;
    diasRestantes: number;
    semaforo: Semaforo;
}

export interface ResumenVencimientos {
    total: number;
    vencidos: number;
    porVencer: number;
    vigentes: number;
    diasAviso: number;
}
