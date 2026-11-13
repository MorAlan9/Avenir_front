import type { Empresa } from "./Empresa";

export interface TipoRiesgo {
    id: number;
    nombre: string;
    activo?: boolean;
}

export type Severidad = "BAJO" | "MEDIO" | "ALTO" | "CRITICO";
export type EstadoHallazgo = "ENCONTRADO" | "EN_CORRECCION" | "RESUELTO";
export type EstadoRelevamiento = "BORRADOR" | "EN_CURSO" | "CERRADO" | "PENDIENTE" | "EN_PROGRESO";

export interface ArchivoRelevamiento {
    idArchivo?: number;
    idHallazgo?: number | null;
    nombreArchivo: string;
    url: string;
    tipoContenido?: string;
    fechaCarga?: string;
}

export interface Hallazgo {
    idHallazgo?: number;
    tipoRiesgo?: TipoRiesgo | null;
    descripcion: string;
    estado: EstadoHallazgo;
    fechaDeteccion: string;
    fechaResolucion?: string | null;
    severidad?: Severidad | null;
    sector?: string | null;
    recomendacion?: string | null;
    responsable?: string | null;
    fechaLimite?: string | null;
    fotos?: ArchivoRelevamiento[];
}

export interface Relevamiento {
    idRelevamiento?: number;
    empresa: Empresa;
    tecnico?: { idUsuario: number; nombre: string; apellido: string } | null;
    fecha: string;
    observaciones?: string;
    conclusion?: string | null;
    fechaCierre?: string | null;
    estado: EstadoRelevamiento;
    activo?: boolean;
    hallazgos: Hallazgo[];
    archivos: ArchivoRelevamiento[];
}
