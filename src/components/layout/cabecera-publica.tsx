"use client";

/**
 * Cabecera de la sección pública (landing y páginas /acerca, /tecnologias).
 * Incluye enlaces de navegación y botón para ingresar al sistema.
 */
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { SelectorTema } from "@/components/layout/selector-tema";
import { Logo } from "@/components/layout/logo";
import { infoSitio, navegacionPublica } from "@/configuracion/sitio";

export function CabeceraPublica() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-medium"
          aria-label={`${infoSitio.nombre} - inicio`}
        >
          {/* Logo + nombre de la plataforma. */}
          <Logo tamano={40} conNombre prioridad />
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Navegación principal"
        >
          {navegacionPublica.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              className="rounded-3xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {enlace.etiqueta}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <SelectorTema />
          <Link
            href="/iniciar-sesion"
            className={buttonVariants({ size: "sm" })}
          >
            Ingresar al sistema
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
