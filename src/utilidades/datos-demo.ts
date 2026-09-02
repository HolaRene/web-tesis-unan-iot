/**
 * DATOS DE DEMOSTRACIÓN (MOCK) PARA EL DASHBOARD.
 *
 * Estos datos son 100% simulados y están claramente marcados. El objetivo es
 * permitir visualizar el aspecto del dashboard sin necesidad de que la API
 * REST esté activa. Cuando se conecte el backend real, esta capa debe
 * reemplazarse por consultas a {src/servicios}.
 */
import type { Alerta, Area, Medicion, Sensor } from "@/tipos";

/**
 * Conjunto de puntos de actividad para la gráfica del dashboard.
 * Se modela con el nombre de la variable de forma dinámica, sin asumir que
 * siempre es temperatura/humedad.
 */
export interface PuntoSerie {
  hora: string;
  valor: number;
}

export interface DispositivoRecienteMock {
  id: string;
  nombre: string;
  tipo: string;
  area: string;
  estado: string;
  ultimaConexion: string;
}

/** Métricas de resumen del dashboard. */
export const resumenMock = {
  areas: 4,
  dispositivos: 12,
  sensores: 28,
  alertasActivas: 3,
  estadoGeneral: "normal",
};

/** Áreas simuladas. */
export const areasMock: Area[] = [
  {
    id: "area-1",
    nombre: "Planta baja",
    tipo: "área",
    descripcion: "Principales espacios habitacionales.",
    ubicacion: "Nivel 1",
    activo: true,
    creado_en: new Date().toISOString(),
  },
  {
    id: "area-2",
    nombre: "Sala de máquinas",
    tipo: "industrial",
    descripcion: "Equipos y tableros de control.",
    ubicacion: "Nivel -1",
    activo: true,
    creado_en: new Date().toISOString(),
  },
];

/** Dispositivos simulados recientes. */
export const dispositivosRecientesMock: DispositivoRecienteMock[] = [
  {
    id: "dev-1",
    nombre: "PLC Principal",
    tipo: "OpenPLC",
    area: "Sala de máquinas",
    estado: "online",
    ultimaConexion: new Date().toISOString(),
  },
  {
    id: "dev-2",
    nombre: "Gateway ESP32",
    tipo: "esp32",
    area: "Planta baja",
    estado: "online",
    ultimaConexion: new Date().toISOString(),
  },
  {
    id: "dev-3",
    nombre: "Cámara IP 01",
    tipo: "camera",
    area: "Planta baja",
    estado: "online",
    ultimaConexion: new Date().toISOString(),
  },
];

/** Alertas simuladas recientes. */
export const alertasRecientesMock: Alerta[] = [
  {
    id: "al-1",
    sensor_id: "s-1",
    medicion_id: 1,
    tipo: "variable",
    severidad: "critico",
    mensaje: "Valor fuera del rango crítico en la sala principal.",
    estado: "active",
    iniciada_en: new Date().toISOString(),
    reconocida_en: null,
    finalizada_en: null,
    metadatos: null,
  },
  {
    id: "al-2",
    sensor_id: "s-2",
    medicion_id: 2,
    tipo: "conexion",
    severidad: "advertencia",
    mensaje: "Dispositivo sin conexión por más de 5 minutos.",
    estado: "acknowledged",
    iniciada_en: new Date().toISOString(),
    reconocida_en: new Date().toISOString(),
    finalizada_en: null,
    metadatos: null,
  },
];

/** Sensores simulados. */
export const sensoresResumidosMock: Sensor[] = [
  {
    id: "s-1",
    dispositivo_id: "dev-1",
    tipo_variable_id: "tv-1",
    nombre: "Temp sala máquinas",
    codigo: "T-SM-01",
    fabricante: null,
    modelo: null,
    unidad: "°C",
    rango_min: null,
    rango_max: null,
    precision: null,
    activo: true,
    configuracion: null,
    creado_en: new Date().toISOString(),
  },
  {
    id: "s-2",
    dispositivo_id: "dev-2",
    tipo_variable_id: "tv-2",
    nombre: "Humedad exterior",
    codigo: "H-EX-02",
    fabricante: null,
    modelo: null,
    unidad: "%",
    rango_min: null,
    rango_max: null,
    precision: null,
    activo: true,
    configuracion: null,
    creado_en: new Date().toISOString(),
  },
];

/** Últimas mediciones simuladas para la gráfica de actividad. */
export const serieActividadMock: PuntoSerie[] = [
  { hora: "08:00", valor: 12 },
  { hora: "09:00", valor: 18 },
  { hora: "10:00", valor: 15 },
  { hora: "11:00", valor: 22 },
  { hora: "12:00", valor: 19 },
  { hora: "13:00", valor: 25 },
  { hora: "14:00", valor: 21 },
];

/** Mediciones simuladas de ejemplo. */
export const ultimasMedicionesMock: Medicion[] = [
  {
    id: 1,
    sensor_id: "s-1",
    valor_numerico: 22.4,
    valor_texto: null,
    valor_booleano: null,
    valor_json: null,
    calidad: "good",
    registrado_en: new Date().toISOString(),
    metadatos: null,
  },
  {
    id: 2,
    sensor_id: "s-2",
    valor_numerico: 41.7,
    valor_texto: null,
    valor_booleano: null,
    valor_json: null,
    calidad: "good",
    registrado_en: new Date().toISOString(),
    metadatos: null,
  },
];
