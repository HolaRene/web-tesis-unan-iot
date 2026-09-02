"use client";

/**
 * Proveedor de tema claro/oscuro basado en next-themes.
 *
 * Aplica el atributo `class` en el root (tal como usa Tailwind v4 con la
 * variante .dark) y evita parpadeos al cargar.
 */
import { ThemeProvider as ProveedorNextTemas } from "next-themes";
import type { ReactNode } from "react";

interface ProveedorTemasProps {
  children: ReactNode;
}

export function ProveedorTemas({ children }: ProveedorTemasProps) {
  return (
    <ProveedorNextTemas
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ProveedorNextTemas>
  );
}
