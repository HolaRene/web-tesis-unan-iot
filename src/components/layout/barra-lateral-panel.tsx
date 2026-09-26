"use client";

/**
 * Barra lateral del panel autenticado.
 * Construida con el Sidebar de shadcn/ui y enlaces internos de Next.js.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  itemsConfiguracionPanel,
  itemsNavegacionPanel,
  type ItemNavegacion,
} from "@/configuracion/navegacion";
import { infoSitio } from "@/configuracion/sitio";
import { Logo } from "@/components/layout/logo";

/** Determina si un ítem corresponde a la ruta activa (por prefijo). */
function esRutaActiva(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function EnlaceMenu({ item, esActivo }: { item: ItemNavegacion; esActivo: boolean }) {
  return (
    <SidebarMenuItem key={item.href}>
      <SidebarMenuButton
        isActive={esActivo}
        tooltip={item.etiqueta}
        render={<Link href={item.href} />}
      >
        <item.icono />
        <span>{item.etiqueta}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function BarraLateralPanel() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              isActive={pathname === "/dashboard"}
              render={<Link href="/dashboard" />}
            >
              <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg">
                <Logo tamano={32} />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {infoSitio.nombre}
                </span>
                <span className="truncate text-xs">Panel de control</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Seguridad y datos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {itemsNavegacionPanel.map((item) => (
                <EnlaceMenu
                  key={item.href}
                  item={item}
                  esActivo={esRutaActiva(pathname, item.href)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {itemsConfiguracionPanel.map((item) => (
                <EnlaceMenu
                  key={item.href}
                  item={item}
                  esActivo={esRutaActiva(pathname, item.href)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <EnlaceMenu
            item={{ href: "/", etiqueta: "Volver a la web", icono: Home }}
            esActivo={false}
          />
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
