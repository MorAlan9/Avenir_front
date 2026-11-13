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

// ---------------- Capacitaciones
export type SemaforoCapacitacion = "PROGRAMADA" | "SIN_VENCIMIENTO" | "VIGENTE" | "POR_VENCER" | "VENCIDO";

export interface AsistenteCapacitacion {
    idAsistente: number;
    nombre: string;
    dni?: string | null;
    firmado: boolean;
    fechaFirma?: string | null;
}

export interface Capacitacion {
    idCapacitacion: number;
    empresa: Empresa;
    tema: string;
    fecha: string;
    duracionHoras: number;
    instructor?: string | null;
    vigenciaMeses: number;
    fechaVencimientoCertificado?: string | null;
    semaforo: SemaforoCapacitacion;
    diasRestantes?: number | null;
    totalAsistentes: number;
    firmados: number;
    asistentes: AsistenteCapacitacion[];
}

export interface ResumenCapacitaciones {
    total: number; programadas: number; vencidas: number; porVencer: number; vigentes: number; sinFirmar: number;
}

// ---------------- EPP
export interface ConstanciaEpp {
    idConstancia: number;
    entrega: {
        idEntrega: number;
        usuario: { idUsuario: number; nombre: string; apellido: string };
        insumo: { idInsumo: number; nombre: string; unidadMedida?: string };
        cantidad: number;
        fechaEntrega: string;
        observaciones?: string | null;
    };
    fechaReposicion: string;
    firmada: boolean;
    fechaFirma?: string | null;
    diasRestantes: number;
    semaforo: Semaforo;
}

export interface ResumenEpp { total: number; sinFirmar: number; reposicionVencida: number; porReponer: number; }

// ---------------- Mediciones
export type TipoMedicion = "RUIDO" | "ILUMINACION" | "PUESTA_A_TIERRA" | "CARGA_TERMICA" | "OTRO";

export interface Medicion {
    idMedicion: number;
    empresa: Empresa;
    tipo: TipoMedicion;
    fecha: string;
    sector: string;
    valorMedido: number;
    limite: number;
    sentido: "MAXIMO" | "MINIMO";
    unidad: string;
    instrumento?: string | null;
    responsable?: string | null;
    proximaMedicion?: string | null;
    observaciones?: string | null;
    conforme: boolean;
}

export type LimitesMedicion = Record<string, { unidad: string | null; sentido: string | null; limite: number | null; nota: string }>;
export interface ResumenMediciones { total: number; conformes: number; noConformes: number; }

// ---------------- Auditorias
export interface ItemPlantilla { idItem: number; texto: string; orden: number; critico: boolean; }
export interface PlantillaAuditoria { idPlantilla: number; nombre: string; rubro: string; items: ItemPlantilla[]; }
export type ResultadoAuditoria = "CUMPLE" | "NO_CUMPLE" | "NO_APLICA";

export interface RespuestaAuditoria {
    idRespuesta: number;
    item: ItemPlantilla;
    resultado?: ResultadoAuditoria | null;
    observacion?: string | null;
}

export interface Auditoria {
    idAuditoria: number;
    empresa: Empresa;
    plantilla: PlantillaAuditoria;
    fecha: string;
    estado: "ABIERTA" | "CERRADA";
    idRelevamiento?: number | null;
    pendientes: number;
    cumplimiento?: number | null;
    respuestas: RespuestaAuditoria[];
}

// ---------------- Emergencias
export type TipoSimulacro = "EVACUACION" | "INCENDIO" | "SISMO" | "DERRAME" | "OTRO";
export type RolBrigada = "JEFE_EMERGENCIA" | "EVACUACION" | "PRIMEROS_AUXILIOS" | "CONTRA_INCENDIO";

export interface Simulacro {
    idSimulacro: number;
    empresa: Empresa;
    tipo: TipoSimulacro;
    fecha: string;
    estado: "PROGRAMADO" | "REALIZADO";
    participantes?: number | null;
    tiempoEvacuacionSeg?: number | null;
    objetivoSeg: number;
    observaciones?: string | null;
    cumpleObjetivo?: boolean | null;
}

export interface Brigadista { idBrigadista: number; empresa: Empresa; nombre: string; rol: RolBrigada; telefono?: string | null; }

export interface ResumenEmergencia {
    simulacrosRealizados: number;
    ultimoSimulacro: string | null;
    diasDesdeUltimoSimulacro: number | null;
    semaforoSimulacros: "SIN_SIMULACROS" | "VIGENTE" | "POR_VENCER" | "VENCIDO";
    cicloDias: number;
    cumplioObjetivoUltimo: boolean | null;
    brigadistas: number;
    rolesFaltantes: RolBrigada[];
    brigadaCompleta: boolean;
}
