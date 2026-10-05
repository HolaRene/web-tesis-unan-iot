/**
 * Catálogo de rutas RTSP por fabricante.
 *
 * ────────────────────────────────────────────────────────────────────
 * POR QUÉ EXISTE
 * ────────────────────────────────────────────────────────────────────
 * Cada marca usa una ruta distinta para el mismo concepto, y las cámaras
 * multi-canal (una HikVision de 2 canales, un NVR de 8) exponen CADA canal
 * en una ruta diferente. Memorizar esas rutas es innecesario y propenso a
 * errores.
 *
 * Este catálogo las centraliza para que el formulario las rellene solo.
 *
 * ────────────────────────────────────────────────────────────────────
 * CÓMO SE GUARDA EN LA BASE DE DATOS
 * ────────────────────────────────────────────────────────────────────
 * Solo se guarda el PATH (p. ej. `/Streaming/Channels/201`), NUNCA la URL
 * completa. La API rechaza cualquier valor con `://` o `@`, porque las
 * credenciales RTSP viven en MediaMTX, no en la plataforma.
 *
 * Por eso este archivo construye dos cosas distintas:
 *
 *   - `rutaStream`   → lo que se guarda (PATH)
 *   - `urlCompleta`  → lo que se pega en MediaMTX (URL con credenciales)
 *
 * La segunda es solo para MOSTRARLA y copiarla; no se almacena.
 */

/** Un canal concreto de una marca. */
export interface CanalFabricante {
  /** Número de canal (1, 2, 3…). */
  numero: number;
  /** Etiqueta legible: "Canal 1 · principal". */
  etiqueta: string;
  /** PATH que se guarda en la base de datos. */
  rutaStream: string;
  /**
   * Nombre sugerido para la cámara.
   * Se usa como plantilla: `<nombre de cámara> - Canal <n>`.
   */
  sufijo: string;
}

/** Un fabricante con sus rutas y canales. */
export interface Fabricante {
  id: string;
  nombre: string;
  /** Notas útiles que se muestran en el formulario. */
  nota?: string;
  /** Tipo de codificación del stream principal. */
  codecPrincipal: string;
  /** Canales disponibles (al menos el 1). */
  canales: CanalFabricante[];
}

/**
 * Genera el PATH del stream principal de una HikVision.
 *
 * La numeración es `<canal>01`: el primer dígito es el canal y `01` indica
 * "stream principal". El secundario (menos calidad, menos ancho de banda)
 * sería `<canal>02`.
 *
 *   Canal 1 → 101      Canal 2 → 201      Canal 3 → 301
 */
function hikvisionPrincipal(canal: number): string {
  return `/Streaming/Channels/${canal}01`;
}

/** Igual que la anterior pero para el stream secundario (substream). */
export function hikvisionSecundario(canal: number): string {
  return `/Streaming/Channels/${canal}02`;
}

export const FABRICANTES: Fabricante[] = [
  {
    id: "hikvision",
    nombre: "HikVision",
    nota: "Los canales se numeran como <canal>01 (principal) y <canal>02 (secundario).",
    codecPrincipal: "H.264 / H.265",
    canales: [
      {
        numero: 1,
        etiqueta: "Canal 1 · principal",
        rutaStream: hikvisionPrincipal(1),
        sufijo: "Canal 1",
      },
      {
        numero: 2,
        etiqueta: "Canal 2 · principal",
        rutaStream: hikvisionPrincipal(2),
        sufijo: "Canal 2",
      },
      {
        numero: 3,
        etiqueta: "Canal 3 · principal",
        rutaStream: hikvisionPrincipal(3),
        sufijo: "Canal 3",
      },
      {
        numero: 4,
        etiqueta: "Canal 4 · principal",
        rutaStream: hikvisionPrincipal(4),
        sufijo: "Canal 4",
      },
    ],
  },
  {
    id: "dahua",
    nombre: "Dahua",
    nota: "`subtype=0` es el stream principal; `subtype=1` el secundario.",
    codecPrincipal: "H.264 / H.265",
    canales: [
      {
        numero: 1,
        etiqueta: "Canal 1 · principal",
        rutaStream: "/cam/realmonitor?channel=1&subtype=0",
        sufijo: "Canal 1",
      },
      {
        numero: 2,
        etiqueta: "Canal 2 · principal",
        rutaStream: "/cam/realmonitor?channel=2&subtype=0",
        sufijo: "Canal 2",
      },
      {
        numero: 3,
        etiqueta: "Canal 3 · principal",
        rutaStream: "/cam/realmonitor?channel=3&subtype=0",
        sufijo: "Canal 3",
      },
      {
        numero: 4,
        etiqueta: "Canal 4 · principal",
        rutaStream: "/cam/realmonitor?channel=4&subtype=0",
        sufijo: "Canal 4",
      },
    ],
  },
  {
    id: "axis",
    nombre: "Axis",
    nota: "Axis suele exponer `streamprofile=1` como perfil principal.",
    codecPrincipal: "H.264 / H.265",
    canales: [
      {
        numero: 1,
        etiqueta: "Perfil 1 · principal",
        rutaStream: "/axis-media/media.amp?streamprofile=1",
        sufijo: "Perfil 1",
      },
      {
        numero: 2,
        etiqueta: "Perfil 2 · secundario",
        rutaStream: "/axis-media/media.amp?streamprofile=2",
        sufijo: "Perfil 2",
      },
    ],
  },
  {
    id: "reolink",
    nombre: "Reolink",
    nota: "`h264Preview_01_main` es el principal y `_sub` el secundario.",
    codecPrincipal: "H.264",
    canales: [
      {
        numero: 1,
        etiqueta: "Canal 1 · principal",
        rutaStream: "/h264Preview_01_main",
        sufijo: "Canal 1",
      },
      {
        numero: 2,
        etiqueta: "Canal 2 · principal",
        rutaStream: "/h264Preview_02_main",
        sufijo: "Canal 2",
      },
    ],
  },
  {
    id: "genérica",
    nombre: "Genérica / otra marca",
    nota: "Escribe la ruta a mano. Debe empezar por «/» y no incluir credenciales.",
    codecPrincipal: "H.264",
    canales: [
      {
        numero: 1,
        etiqueta: "Ruta manual",
        rutaStream: "/",
        sufijo: "",
      },
    ],
  },
];

/** Busca un fabricante por su id. */
export function obtenerFabricante(id: string): Fabricante | undefined {
  return FABRICANTES.find((f) => f.id === id);
}

/** Devuelve los canales de un fabricante (o los de la opción genérica). */
export function canalesDe(fabricanteId: string): CanalFabricante[] {
  return obtenerFabricante(fabricanteId)?.canales ?? [];
}

/**
 * Construye la URL RTSP completa, SOLO para mostrarla y copiarla.
 *
 * ⚠️ Esta cadena lleva usuario y contraseña. Nunca se guarda en la base de
 * datos ni se envía al backend: su único destino es la configuración de
 * MediaMTX, en el servidor.
 */
export function urlRtspCompleta(opciones: {
  direccionIp: string;
  puerto?: number;
  rutaStream: string;
  usuario: string;
  password: string;
}): string {
  const { direccionIp, puerto = 554, rutaStream, usuario, password } = opciones;

  if (!direccionIp || !rutaStream) return "";

  const ruta = rutaStream.startsWith("/") ? rutaStream : `/${rutaStream}`;
  const credenciales = usuario
    ? `${encodeURIComponent(usuario)}:${encodeURIComponent(password)}@`
    : "";

  return `rtsp://${credenciales}${direccionIp}:${puerto}${ruta}`;
}

/**
 * Sugiere una ruta WebRTC para MediaMTX a partir del nombre de la cámara.
 *
 * MediaMTX usa la ruta como identificador del stream. Se normaliza a
 * minúsculas y sin acentos para evitar problemas de codificación en la URL.
 */
export function sugerirRutaWebrtc(nombre: string, sufijo?: string): string {
  const base = `${nombre} ${sufijo ?? ""}`
    .normalize("NFD")
    // Elimina los acentos (marcas diacríticas) tras la descomposición NFD.
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `/${base || "camara"}`;
}
