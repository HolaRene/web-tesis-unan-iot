"use client";

/**
 * Cabecera del panel autenticado.
 * Contiene el botón de colapso de la barra lateral, el selector de tema y el
 * menú del usuario con la acción de cerrar sesión.
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, LogOut, User as UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { SelectorTema } from "@/components/layout/selector-tema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSesion } from "@/hooks/use-sesion";

const titulosPorRuta: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/areas": "Áreas",
  "/dispositivos": "Dispositivos",
  "/sensores": "Sensores",
  "/mediciones": "Mediciones",
  "/alertas": "Alertas",
  "/camaras": "Cámaras",
  "/integraciones": "Integraciones",
  "/configuracion": "Configuración",
};

export function CabeceraPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const { usuario, perfil, esDemo, cerrarSesion } = useSesion();

  const tituloActual = pathname.split("/")[1] ?? "panel";
  const titulo =
    titulosPorRuta[`/${tituloActual}`] ?? "Panel de control";

  function manejarCerrarSesion() {
    cerrarSesion();
    router.push("/iniciar-sesion");
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background px-4 transition-[width,height] lg:px-6">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mr-1 h-4" />
      <h1 className="text-base font-semibold tracking-tight">{titulo}</h1>

      <div className="ml-auto flex items-center gap-2">
        {esDemo && (
          <span className="hidden rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground sm:inline-flex">
            Modo demo
          </span>
        )}
        <SelectorTema />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Menú de usuario"
                title="Menú de usuario"
              >
                <UserIcon className="size-4" aria-hidden />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">
                    {perfil?.nombre ?? usuario?.email ?? "Sesión"}
                  </span>
                  {perfil && (
                    <span className="truncate text-xs font-normal text-muted-foreground">
                      {perfil.email}
                    </span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/mi-perfil" className="w-full" />}>
                <UserIcon className="size-4" aria-hidden />
                Mi perfil
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/" className="w-full" />}>
                <Home className="size-4" aria-hidden />
                Ir a la web pública
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                render={
                  <button
                    type="button"
                    className="w-full"
                    onClick={manejarCerrarSesion}
                  />
                }
              >
                <LogOut className="size-4" aria-hidden />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
