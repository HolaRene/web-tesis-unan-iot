/**
 * Configuración de los ítems de navegación del panel.
 */
import {
  BookOpen,
  Activity,
  AlertTriangle,
  Camera,
  Cog,
  Gauge,
  LayoutDashboard,
  MapPin,
  PlugZap,
  RadioTower,
  ToggleRight,
  type LucideIcon,
} from "lucide-react";

export interface ItemNavegacion {
  href: string;
  etiqueta: string;
  icono: LucideIcon;
}

/** Rutas protegidas del panel. */
export const itemsNavegacionPanel: ItemNavegacion[] = [
  { href: "/dashboard", etiqueta: "Dashboard", icono: LayoutDashboard },
  { href: "/areas", etiqueta: "Áreas", icono: MapPin },
  { href: "/dispositivos", etiqueta: "Dispositivos", icono: RadioTower },
  { href: "/sensores", etiqueta: "Sensores", icono: Activity },
  { href: "/canales", etiqueta: "Canales", icono: Gauge },
  { href: "/mediciones", etiqueta: "Mediciones", icono: Activity },
  { href: "/normas", etiqueta: "Normas", icono: BookOpen },
  { href: "/alertas", etiqueta: "Alertas", icono: AlertTriangle },
  { href: "/actuadores", etiqueta: "Actuadores", icono: ToggleRight },
  { href: "/camaras", etiqueta: "Cámaras", icono: Camera },
  { href: "/integraciones", etiqueta: "Integraciones", icono: PlugZap },
];

/** Ítems de la sección inferior (configuración). */
export const itemsConfiguracionPanel: ItemNavegacion[] = [
  { href: "/configuracion", etiqueta: "Configuración", icono: Cog },
];
