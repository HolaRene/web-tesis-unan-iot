"use client";

/**
 * Proveedor global de TanStack Query.
 *
 * Centraliza el QueryClient y configura valores por defecto (caché de 5 min
 * y sin re-fetch en refocus por defecto), ya que el panel consume datos
 * dinámicos de la API REST. Debe envolver las secciones que usen hooks de
 * consulta (dashboard y páginas del panel).
 */
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [cliente] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={cliente}>{children}</QueryClientProvider>
  );
}
