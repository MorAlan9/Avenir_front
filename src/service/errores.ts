/** Saca un texto legible de un error de axios, sea cual sea la forma de la respuesta del servidor. */
export const textoError = (err: any, porDefecto: string): string => {
    const data = err?.response?.data;
    if (typeof data === "string" && data.trim()) return data;
    if (data && typeof data === "object") return data.mensaje || data.message || porDefecto;
    return porDefecto;
};

export const hoyISO = (): string => new Date().toISOString().split("T")[0];

/** Cabecera Authorization con el token de la sesion, lista para pasarle a axios. */
export const cabeceras = () => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};
