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
  /** Perfil normativo del recinto (id de plantilla). */
  perfil_alerta?: string | null;
  creado_en: string;
}

/** Cumplimiento de una magnitud frente al perfil normativo del área. */
export interface CumplimientoMagnitud {
  tipo_codigo: string;
  tipo_nombre: string;
  unidad: string | null;
  valor: number | null;
  medido_en: string | null;
  estado: 'cumple' | 'fuera' | 'sin_datos' | 'sin_regla';
  banda: string | null;
  minimo: number | null;
  maximo: number | null;
  cubierta: boolean;
  requiere_verificacion: boolean;
}

/** GET /api/v1/areas/:id/cumplimiento */
export interface CumplimientoArea {
  area: { id: string; nombre: string; perfil_alerta: string | null };
  perfil: {
    id: string;
    nombre: string;
    norma: string;
    notas: string[];
  } | null;
  magnitudes: CumplimientoMagnitud[];
  resumen: {
    total: number;
    cumple: number;
    fuera: number;
    sin_datos: number;
    sin_regla: number;
  };
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

  /*
   * Campos que el backend añade al listar (JOIN con dispositivos, áreas y
   * tipos de variable). Son opcionales porque no siempre vienen: por ejemplo,
   * al obtener un sensor recién creado.
   */

  /** Id del tipo de variable (la magnitud que mide). */
  tipo_id?: string | null;
  /** Código del tipo de variable, p. ej. TEMPERATURA. */
  tipo_codigo?: string | null;
  /** Nombre legible del tipo, p. ej. "Temperatura". */
  tipo_nombre?: string | null;
  /**
   * Tipo de dato de la magnitud: `numeric`, `boolean`, `text` o `json`.
   * Determina si se puede representar en un gráfico (ver `sePuedeGraficar`).
   */
  tipo_dato?: string | null;
  /** Unidad por defecto del tipo de variable. */
  tipo_unidad?: string | null;

  /** Nombre del dispositivo al que pertenece. */
  dispositivo_nombre?: string | null;
  /** Identificador del dispositivo. */
  dispositivo_identificador?: string | null;
  /** Estado del dispositivo (online/offline). */
  dispositivo_estado?: string | null;
  /** Nombre del área del dispositivo. */
  area_nombre?: string | null;

  /** Último valor numérico registrado. */
  ultimo_valor_numerico?: number | null;
  /** Último valor de texto registrado. */
  ultimo_valor_texto?: string | null;
  /** Fecha del último registro. */
  ultimo_registrado_en?: string | null;
}

/**
 * Magnitud (canal) declarada al crear/editar un sensor.
 *
 * Un mismo sensor físico puede exponer varias magnitudes: p. ej. un DHT22
 * aporta temperatura y humedad relativa. Se envía en `POST/PATCH /sensors`
 * dentro del campo `canales`.
 */
export interface MagnitudSensor {
  tipo_variable_id: string;
  codigo?: string | null;
  nombre?: string | null;
  unidad?: string | null;
  rango_min?: number | null;
  rango_max?: number | null;
  precision_valor?: number | null;
  activo?: boolean;
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

/**
 * Un cubo temporal con las estadísticas de las mediciones que contiene.
 * GET /api/v1/sensors/:id/series
 *
 * El backend agrega en SQL, así que el navegador recibe unos pocos puntos
 * en lugar de todas las mediciones del periodo.
 */
export interface CuboSerie {
  /** Inicio del intervalo (ISO). */
  cubo: string;
  media: number | null;
  minimo: number | null;
  maximo: number | null;
  /** Desviación estándar muestral (null si solo hay una muestra). */
  desviacion: number | null;
  /** Número de mediciones dentro del cubo. */
  muestras: number;
}

/** Respuesta del endpoint de series agregadas. */
export interface SeriesAgregadas {
  sensor_id?: string;
  intervalo: "minuto" | "hora" | "dia" | "semana" | "mes";
  desde: string | null;
  hasta: string | null;
  resumen: {
    media: number | null;
    minimo: number | null;
    maximo: number | null;
    muestras: number;
  };
  series: CuboSerie[];
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

/** Estados posibles de una cámara IP. */
export type EstadoCamara =
  | "activa"
  | "inactiva"
  | "conectada"
  | "desconectada"
  | "error";

/**
 * Cámara IP. GET /api/v1/cameras
 *
 * NOTA DE SEGURIDAD: este tipo NO incluye credenciales RTSP ni la URL
 * completa del stream. `ruta_stream` es el PATH (p. ej. `/stream1`) y
 * `ruta_webrtc` la ruta pública en MediaMTX.
 */
export interface Camara {
  id: string;
  nombre: string;
  descripcion: string | null;
  area_id: string | null;
  dispositivo_id: string | null;
  direccion_ip: string | null;
  puerto_rtsp: number;
  protocolo: string;
  /** PATH del stream en la cámara (p. ej. `/stream1`), nunca la URL completa. */
  ruta_stream: string;
  /** Ruta pública del stream en MediaMTX (p. ej. `/camara-qui-1`). */
  ruta_webrtc: string | null;
  estado: EstadoCamara;
  activa: boolean;
  ultima_conexion: string | null;
  grabacion_habilitada: boolean;
  metadatos: Record<string, unknown>;
  configuracion: Record<string, unknown> | null;
  creado_en: string;
  actualizado_en: string;

  /** Relaciones legibles (vienen resueltas en el listado y el detalle). */
  area_nombre?: string | null;
  dispositivo_nombre?: string | null;
  dispositivo_identificador?: string | null;
}

/** Integración externa (ej. una plataforma cloud). GET /api/v1/integrations */
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
  /** Cómo se acciona: modbus, gpio, mqtt o http. */
  protocolo?: string;
  /** Direccionamiento según el protocolo (dirección Modbus, pin GPIO…). */
  configuracion: Record<string, unknown> | null;
  creado_en: string;
  dispositivo_nombre?: string | null;
  /** Área del dispositivo al que pertenece (el backend lo devuelve). */
  area_id?: string | null;
  area_nombre?: string | null;
  /**
   * Tema MQTT al que se publican las órdenes de este actuador.
   * Si es `null`, se deriva del código.
   */
  topico_mqtt?: string | null;
  /** Momento en que el equipo confirmó el último cambio de estado. */
  ultima_orden_en?: string | null;
}

/**
 * Canal: magnitud concreta de un sensor físico.
 * GET/POST/PATCH /api/v1/canales
 */
export interface Canal {
  id: string;
  sensor_id: string | null;
  tipo_variable_id: string | null;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  unidad: string | null;
  rango_min: number | null;
  rango_max: number | null;
  precision_valor: number | null;
  activo: boolean;

  dispositivo_id?: string | null;
  dispositivo_nombre?: string | null;
  dispositivo_identificador?: string | null;
  area_nombre?: string | null;
  tipo_nombre?: string | null;
  tipo_codigo?: string | null;
  tipo_dato?: string | null;
  tipo_unidad?: string | null;

  ultima_medicion_id?: number | null;
  ultimo_valor_numerico?: number | null;
  ultimo_valor_texto?: string | null;
  ultimo_valor_booleano?: boolean | null;
  ultimo_registrado_en?: string | null;
  cantidad_mediciones?: number | null;
  alerta_activa?: boolean;
}

export interface ReglaAlerta {
  id: string;
  canal_id: string;
  nombre: string;
  descripcion: string | null;
  operador: string;
  valor_referencia_numerico: number | null;
  valor_referencia_texto: string | null;
  valor_referencia_booleano: boolean | null;
  valor_min: number | null;
  valor_max: number | null;
  severidad: 'info' | 'warning' | 'critical';
  mensaje: string | null;
  activa: boolean;
  retardo_segundos: number | null;
  canal_codigo?: string | null;
  tipo_dato?: string | null;
  dispositivo_identificador?: string | null;
  area_nombre?: string | null;
}

export interface IotAlerta {
  id: string;
  canal_id?: string | null;
  regla_id?: string | null;
  sensor_id?: string | null;
  medicion_id?: number | null;
  severidad: string;
  mensaje: string | null;
  estado: string;
  iniciada_en: string;
  reconocida_en: string | null;
  finalizada_en: string | null;
  valor_disparador_numerico?: number | null;
  valor_disparador_texto?: string | null;
}




/**
 * Comando enviado a un actuador.
 *
 * Recorre un ciclo de vida hasta llegar al equipo físico:
 *
 *     pendiente → enviado → ejecutado
 *                    └──────→ fallido
 *
 * `pendiente` es el estado en el que lo deja la web. A partir de ahí lo
 * actualiza Node-RED, que confirma la entrega ('enviado') y, si el equipo
 * responde, la ejecución ('ejecutado').
 */
export type EstadoComando =
  | "pendiente"
  | "enviado"
  | "ejecutado"
  | "fallido"
  | "cancelado";

export interface ComandoActuador {
  id: string;
  actuador_id: string;
  usuario_id: string | null;
  clave_api_id: string | null;
  comando: string;
  valor: Record<string, unknown> | null;
  estado: EstadoComando;
  creado_en: string;
  enviado_en: string | null;
  ejecutado_en: string | null;
  respuesta: Record<string, unknown> | null;
  metadatos: Record<string, unknown> | null;

  /* Relaciones que añade el backend al consultar. */
  actuador_codigo?: string | null;
  actuador_nombre?: string | null;
  /** Tema MQTT de destino. Si es null, se deriva del código del actuador. */
  actuador_topico_mqtt?: string | null;
  actuador_estado_actual?: string | null;
  actuador_tipo?: string | null;
  dispositivo_id?: string | null;
  dispositivo_nombre?: string | null;
  dispositivo_identificador?: string | null;
  area_nombre?: string | null;
  clave_api_nombre?: string | null;
}
