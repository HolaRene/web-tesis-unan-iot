"use client";

/**
 * Devuelve el instante actual y lo refresca periódicamente.
 *
 * Se necesita un hook en lugar de llamar a `Date.now()` durante el render:
 * React exige que el render sea PURO, y leer el reloj lo hace impuro (el
 * resultado cambiaría entre renders sin que cambie nada más).
 *
 * Con este hook, el "ahora" llega como estado y los gráficos pueden anclarse
 * a él sin violar las reglas de React.
 */
import { useEffect, useState } from "react";

/**
 * @param intervaloMs Cada cuánto se actualiza el valor. Por defecto 10 s,
 *                    suficiente para que un eje temporal se vea avanzar.
 */
export function useAhora(intervaloMs = 10_000): Date {
  const [ahora, setAhora] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), intervaloMs);
    return () => clearInterval(id);
  }, [intervaloMs]);

  return ahora;
}
