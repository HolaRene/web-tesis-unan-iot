/**
 * Tipos de las entidades principales de la plataforma.
 *
 * Los nombres de campos coinciden con lo que devuelve la API REST
 * (columnas de la BD en español/snake_case). Los endpoints del backend
 * siguen convención en inglés:
 *
 *   /api/v1/areas            -> Áreas
 *   /api/v1/devices          -> Dispositivos
 *   /api/v1/variable-types   -> Tipos de variable
 *   /api/v1/sensors          -> Sensores
 *   /api/v1/measurements     -> Mediciones
 *   /api/v1/thresholds       -> Umbrales
 *   /api/v1/alerts           -> Alertas
 *   /api/v1/cameras          -> Cámaras
 *   /api/v1/integrations     -> Integraciones
 */

/** Área de la instalación. Endpoint: GET /api/v1/areas */
export interface Area {
  id: string;
  nombre: string;
  tipo: string | null;
  descripcion: string | null;
  ubicacion: string | null;
  activo: boolean;
  creado_en: string;
}

/** Dispositivo (PLC, ESP32, gateway, cámara IP, etc.). GET /api/v1/devices */
export interface Dispositivo {
  id: string;
  area_id: string | null;
  nombre: string;
  tipo: string;
  fabricante: string | null;
  modelo: string | null;
  identificador: string | null;
  protocolo: string | null;
  direccion_ip: string | null;
  estado: string;
  metadatos: Record<string, unknown> | null;
  ultima_conexion: string | null;
  creado_en: string;
}

/** Tipo de variable medida (temperatura, humedad, CO2, ...). GET /api/v1/variable-types */
export interface TipoVariable {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  tipo_dato: string;
  unidad_default: string | null;
}

/** Sensor vinculado a un dispositivo. GET /api/v1/sensors */
export interface Sensor {
  id: string;
  dispositivo_id: string | null;
  tipo_variable_id: string | null;
  nombre: string;
  codigo: string;
  fabricante: string | null;
  modelo: string | null;
  unidad: string | null;
  rango_min: string | null;
  rango_max: string | null;
  precision: string | null;
  activo: boolean;
  configuracion: Record<string, unknown> | null;
  creado_en: string;
}

/** Medición registrada de un sensor. GET /api/v1/measurements */
export interface Medicion {
  id: number;
  sensor_id: string;
  valor_numerico: number | null;
  valor_texto: string | null;
  valor_booleano: boolean | null;
  valor_json: Record<string, unknown> | null;
  calidad: string;
  registrado_en: string;
  metadatos: Record<string, unknown> | null;
}

/** Umbral de alerta para un sensor. GET /api/v1/thresholds */
export interface Umbral {
  id: string;
  sensor_id: string | null;
  /** Valores numéricos enviados como string por precisión NUMERIC en la BD. */
  valor_min: string | null;
  valor_max: string | null;
  severidad: string | null;
  activo: boolean;
  creado_en: string;
}

/** Estado posible de una alerta. */
export type EstadoAlerta = "active" | "acknowledged" | "resolved";

/** Alerta generada por el sistema. GET /api/v1/alerts */
export interface Alerta {
  id: string;
  sensor_id: string | null;
  medicion_id: number | null;
  tipo: string | null;
  severidad: string | null;
  mensaje: string | null;
  estado: string; // EstadoAlerta
  iniciada_en: string;
  reconocida_en: string | null;
  finalizada_en: string | null;
  metadatos: Record<string, unknown> | null;
}

/** Cámara IP vinculada a un dispositivo. GET /api/v1/cameras */
export interface Camara {
  id: string;
  dispositivo_id: string | null;
  protocolo: string | null;
  ruta_stream: string | null;
  grabacion_habilitada: boolean;
  configuracion: Record<string, unknown> | null;
}

/** Integración externa (ej. ThingsBoard Cloud). GET /api/v1/integrations */
export interface Integracion {
  id: string;
  dispositivo_id: string | null;
  plataforma: string | null;
  tipo: string | null;
  id_externo: string | null;
  activo: boolean;
  configuracion: Record<string, unknown> | null;
  creado_en: string;
}

/**
 * API Key por usuario (integración IoT: Node-RED, scripts, gateways).
 * Endpoints: GET/POST/DELETE /api/v1/claves-api
 * Nota: la API NUNCA devuelve la clave completa después de crearla; solo
 * se muestra una única vez en la creación (`claveCompleta`).
 */
export interface ClaveApi {
  id: string;
  usuario_id: string;
  nombre: string;
  prefijo: string;
  activa: boolean;
  /** Permisos por clave, ej. { "mediciones:crear": true } */
  permisos: Record<string, boolean> | null;
  ultimo_uso: string | null;
  expira_en: string | null;
  creado_en: string;
}

/** Permisos reconocidos por la API para las claves. */
export const PERMISOS_CLAVE_API = [
  "mediciones:crear",
  "comandos:enviar",
  "estado:actualizar",
] as const;

export type PermisoClaveApi = (typeof PERMISOS_CLAVE_API)[number];

/** Respuesta de la creación de una API Key (clave completa visible 1 vez). */
export interface ClaveApiCreada {
  clave: ClaveApi;
  /** Clave completa, visible una sola vez al crearla. */
  claveCompleta: string;
  /** Prefijo legible de la clave. */
  prefijo: string;
}

/** Totales globales del dashboard. */
export interface TotalesDashboard {
  areas: number;
  dispositivos: number;
  sensores: number;
  mediciones: number;
  alertas_activas: number;
}

/**
 * Medición con la relación legible al sensor (incluye el id y el código),
 * para saber a qué medición corresponde cada dato.
 */
export interface MedicionConSensor extends Medicion {
  sensor_codigo: string | null;
  sensor_nombre: string | null;
  unidad: string | null;
  dispositivo_nombre: string | null;
}

export interface AlertaResumen {
  id: string;
  severidad: string | null;
  mensaje: string | null;
  estado: string;
  iniciada_en: string;
  sensor_codigo: string | null;
}

/** Respuesta de GET /api/v1/dashboard/resumen. */
export interface ResumenDirectorDashboard {
  totales: TotalesDashboard;
  ultimas_mediciones: MedicionConSensor[];
  dispositivos_recientes: Dispositivo[];
  ultimas_alertas: AlertaResumen[];
}

/**
 * Actuador (salida digital, relé, etc.) vinculado a un dispositivo.
 * Endpoint: GET/POST/PATCH/DELETE /api/v1/actuadores
 */
export interface Actuador {
  id: string;
  dispositivo_id: string;
  nombre: string;
  codigo: string;
  tipo: string;
  estado_actual: string | null;
  activo: boolean;
  configuracion: Record<string, unknown> | null;
  creado_en: string;
  dispositivo_nombre?: string | null;
  area_nombre?: string | null;
}



