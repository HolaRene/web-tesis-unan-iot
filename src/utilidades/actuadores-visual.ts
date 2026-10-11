/**
 * Presentación de actuadores según su tipo.
 *
 * ────────────────────────────────────────────────────────────────────
 * POR QUÉ UN WIDGET DISTINTO POR TIPO
 * ────────────────────────────────────────────────────────────────────
 * No todos los actuadores se controlan igual:
 *
 *   - Un RELÉ o un LED tienen dos estados y se quedan ahí: el control
 *     natural es un INTERRUPTOR.
 *   - Un BUZZER o una SIRENA son pulsaciones momentáneas: un interruptor
 *     no representa "hazlo sonar ahora".
 *   - Una VÁLVULA o un MOTOR pueden tener más de dos posiciones.
 *   - Algunos actuadores son de SOLO LECTURA (sensores de estado, contadores):
 *     mostrar un botón que no hace nada confunde.
 *
 * ────────────────────────────────────────────────────────────────────
 * POR QUÉ POR PALABRA CLAVE Y NO POR LISTA CERRADA
 * ────────────────────────────────────────────────────────────────────
 * El campo `tipo` de la base de datos es TEXTO LIBRE: no hay un catálogo
 * cerrado que validar. Si se hiciera una lista exacta, cualquier tipo nuevo
 * ("zumbador", "electrovalvula") caería en el caso genérico.
 *
 * Emparejando por palabra clave, un tipo desconocido encuentra su widget sin
 * tocar código.
 */
import {
  Bell,
  Fan,
  Lightbulb,
  Lock,
  ToggleLeft,
  Volume2,
  Waves,
  type LucideIcon,
} from "lucide-react";

/**
 * Forma de control que se ofrece para un actuador.
 *
 *   - `interruptor` → dos estados estables (encendido/apagado)
 *   - `pulsador`    → acción momentánea (sonar mientras se pulsa)
 *   - `multi`       → varios estados posibles (abrir/cerrar/parar)
 *   - `solo-lectura` → no se puede accionar desde aquí
 */
export type FormaControl = "interruptor" | "pulsador" | "multi" | "solo-lectura";

/** Descripción completa de un tipo de actuador. */
export interface PerfilActuador {
  forma: FormaControl;
  icono: LucideIcon;
  /** Texto del comando para encender/activar. */
  comandoOn: string;
  /** Texto del comando para apagar/desactivar. */
  comandoOff: string;
  /** Etiqueta del botón de encendido. */
  etiquetaOn: string;
  /** Etiqueta del botón de apagado. */
  etiquetaOff: string;
  /**
   * Estados que cuentan como "activo".
   *
   * Se compara en minúsculas contra `estado_actual`. Incluye sinónimos
   * porque cada instalación nombra los estados a su manera.
   */
  estadosActivos: string[];
}

/**
 * Perfiles por palabra clave, de más específico a más genérico.
 *
 * El orden importa: gana la primera coincidencia.
 */
const PERFILES: Array<{ claves: string[]; perfil: PerfilActuador }> = [
  {
    // Buzzer, sirena, zumbador: acción momentánea.
    claves: ["buzzer", "zumbador", "sirena", "alarma", "bocina", "timbre"],
    perfil: {
      forma: "pulsador",
      icono: Volume2,
      comandoOn: "ON",
      comandoOff: "OFF",
      etiquetaOn: "Hacer sonar",
      etiquetaOff: "Silenciar",
      estadosActivos: ["on", "activo", "sonando", "true", "1"],
    },
  },
  {
    // Aviso luminoso: también momentáneo, pero con otro icono.
    claves: ["baliza", "luz", "piloto", "lampara", "lámpara"],
    perfil: {
      forma: "pulsador",
      icono: Bell,
      comandoOn: "ON",
      comandoOff: "OFF",
      etiquetaOn: "Encender",
      etiquetaOff: "Apagar",
      estadosActivos: ["on", "activo", "encendido", "true", "1"],
    },
  },
  {
    // Válvulas: pueden tener posiciones intermedias.
    claves: ["valvula", "válvula", "valve", "compuerta"],
    perfil: {
      forma: "multi",
      icono: Waves,
      comandoOn: "ON",
      comandoOff: "OFF",
      etiquetaOn: "Abrir",
      etiquetaOff: "Cerrar",
      estadosActivos: ["on", "abierto", "abierta", "open", "true", "1"],
    },
  },
  {
    claves: ["motor", "bomba", "pump", "ventilador", "fan", "extractor"],
    perfil: {
      forma: "interruptor",
      icono: Fan,
      comandoOn: "ON",
      comandoOff: "OFF",
      etiquetaOn: "Arrancar",
      etiquetaOff: "Parar",
      estadosActivos: ["on", "activo", "encendido", "running", "true", "1"],
    },
  },
  {
    claves: ["cerradura", "puerta", "candado", "lock", "acceso"],
    perfil: {
      forma: "multi",
      icono: Lock,
      comandoOn: "ON",
      comandoOff: "OFF",
      etiquetaOn: "Abrir",
      etiquetaOff: "Cerrar",
      estadosActivos: ["on", "abierto", "abierta", "open", "true", "1"],
    },
  },
  {
    // Relé, LED, salida digital: el caso más común, dos estados estables.
    claves: ["rele", "relé", "relay", "led", "digital", "salida", "switch"],
    perfil: {
      forma: "interruptor",
      icono: Lightbulb,
      comandoOn: "ON",
      comandoOff: "OFF",
      etiquetaOn: "Encender",
      etiquetaOff: "Apagar",
      estadosActivos: ["on", "activo", "encendido", "true", "1"],
    },
  },
];

/** Perfil para un tipo de actuador desconocido. */
const PERFIL_GENERICO: PerfilActuador = {
  forma: "interruptor",
  icono: ToggleLeft,
  comandoOn: "ON",
  comandoOff: "OFF",
  etiquetaOn: "Activar",
  etiquetaOff: "Desactivar",
  estadosActivos: ["on", "activo", "encendido", "abierto", "true", "1"],
};

/**
 * Devuelve el perfil de presentación de un actuador.
 *
 * @param tipo       Campo `tipo` del actuador (texto libre).
 * @param codigo     Código del actuador, por si el tipo es genérico.
 */
export function perfilDeActuador(
  tipo?: string | null,
  codigo?: string | null
): PerfilActuador {
  const texto = `${tipo ?? ""} ${codigo ?? ""}`
    .toLowerCase()
    // Sin acentos, para que "válvula" y "valvula" coincidan igual.
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  for (const { claves, perfil } of PERFILES) {
    if (claves.some((k) => texto.includes(k))) return perfil;
  }

  return PERFIL_GENERICO;
}

/**
 * ¿Está el actuador en un estado "activo"?
 *
 * Se comprueba contra varios sinónimos porque `estado_actual` es texto libre
 * y cada instalación usa los suyos ("on", "encendido", "abierto"…).
 *
 * Un estado vacío NO se considera activo: es más seguro mostrar "apagado"
 * que dar por hecho que algo está en marcha.
 */
export function estaActivo(
  estadoActual: string | null | undefined,
  perfil: PerfilActuador
): boolean {
  if (!estadoActual) return false;
  const e = estadoActual.toLowerCase().trim();
  return perfil.estadosActivos.includes(e);
}
