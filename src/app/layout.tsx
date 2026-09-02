import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ProveedorTemas } from "@/components/proveedores/proveedor-temas";
import { ProveedorSesion } from "@/components/proveedores/proveedor-sesion";
import { infoSitio } from "@/configuracion/sitio";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: infoSitio.nombre,
    template: `%s · ${infoSitio.nombre}`,
  },
  description: infoSitio.descripcion,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", "font-sans", inter.variable)}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ProveedorTemas>
          <ProveedorSesion>{children}</ProveedorSesion>
        </ProveedorTemas>
      </body>
    </html>
  );
}
