/**
 * Configuración general del sitio/plataforma.
 *
 * Centraliza datos de marca, enlaces de navegación pública y otros valores
 * reutilizables que no dependen del entorno de ejecución.
 */

export const infoSitio = {
  /** Nombre corto de la plataforma. */
  nombre: "MonitorIT",
  /** Subtítulo descriptivo para headers, pies y metadatos. */
  eslogan: "Monitorización inteligente para entornos conectados",
  /** Descripción oficial de la plataforma. */
  descripcion:
    "Plataforma genérica de monitorización e integración IoT/industrial. Centraliza datos de sensores, PLC, dispositivos IoT y otras fuentes para supervisión local y remota.",
} as const;

/** Enlaces de navegación de la sección pública. */
export const navegacionPublica = [
  { etiqueta: "Inicio", href: "/" },
  { etiqueta: "Características", href: "/#caracteristicas" },
  { etiqueta: "Arquitectura", href: "/#arquitectura" },
  { etiqueta: "Tecnologías", href: "/#tecnologias" },
] as const;
