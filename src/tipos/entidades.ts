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
