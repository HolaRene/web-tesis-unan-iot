/**
 * Esquemas Zod para formularios de entidades del panel.
 *
 * Corresponden a las entidades Área, Dispositivo y Sensor. Reglas alineadas
 * con las validaciones del backend.
 */
import { z } from "zod";

/** Esquema de creación/edición de un Área. */
export const esquemaArea = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  tipo: z.string().trim().optional(),
  descripcion: z.string().trim().optional(),
  ubicacion: z.string().trim().optional(),
  activo: z.boolean().default(true),
});

/** Tipo inferido del esquema de área. */
export type DatosAreaFormulario = z.infer<typeof esquemaArea>;

/** Estados posibles para un dispositivo. */
const estadosDispositivo = [
  "online",
  "offline",
  "mantenimiento",
  "activo",
] as const;

/** Protocolos comunes soportados. */
const protocolosDispositivo = [
  "modbus-tcp",
  "mqtt",
  "opc-ua",
  "http",
  "rtsp",
  "other",
] as const;

/** Esquema de creación/edición de un Dispositivo. */
export const esquemaDispositivo = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  tipo: z.string().trim().min(1, "El tipo es obligatorio"),
  protocolo: z.enum(protocolosDispositivo).optional(),
  area_id: z.string().uuid("Selecciona un área válida").optional().nullable(),
  direccion_ip: z.string().optional().nullable(),
  fabricante: z.string().trim().optional().nullable(),
  modelo: z.string().trim().optional().nullable(),
  identificador: z.string().trim().optional().nullable(),
  estado: z.enum(estadosDispositivo).default("online"),
});

/** Tipo inferido del esquema de dispositivo. */
export type DatosDispositivoFormulario = z.infer<typeof esquemaDispositivo>;

/** Esquema de creación/edición de un Sensor. */
export const esquemaSensor = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  codigo: z.string().trim().min(1, "El código es obligatorio"),
  dispositivo_id: z.string().uuid().optional().nullable(),
  tipo_variable_id: z.string().uuid().optional().nullable(),
  unidad: z.string().trim().optional().nullable(),
  activo: z.boolean().default(true),
});

/** Tipo inferido del esquema de sensor. */
export type DatosSensorFormulario = z.infer<typeof esquemaSensor>;
