/**
 * Descripción legible de una regla de alerta.
 *
 * ──────────────────────────────────────────────────────────────────────
 * POR QUÉ EXISTE ESTE ARCHIVO
 * ──────────────────────────────────────────────────────────────────────
 * El operador se guarda en la base de datos como `>`, `entre` o `es_true`.
 * Pintarlo tal cual produce listas como esta:
 *
 *     Temperatura alta · >
 *     Humedad baja · <
 *     Rango seguro · entre
 *
 * Que no dice nada: falta el VALOR, que es lo único que permite distinguir
 * dos reglas del mismo canal.
 *
 * Aquí se centraliza la traducción de operador + valores a texto legible,
 * para que la lista de reglas y el formulario digan exactamente lo mismo.
 */
import type { LucideIcon } from "lucide-react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Equal,
  CheckCircle2,
  XCircle,
  Type,
} from "lucide-react";

export interface DefinicionOperador {
  valor: string;
  /** Símbolo corto, el que se pinta grande. */
  simbolo: string;
  etiqueta: string;
  descripcion: string;
  Icono: LucideIcon;
}

/**
 * Catálogo de operadores numéricos.
 *
 * El orden importa: es el que se muestra en el selector, de más a menos
 * frecuente.
 */
export const OPERADORES_NUMERICOS: DefinicionOperador[] = [
  {
    valor: ">",
    simbolo: ">",
    etiqueta: "Mayor que",
    descripcion: "Avisar cuando supere el límite",
    Icono: ArrowUp,
  },
  {
    valor: ">=",
    simbolo: "≥",
    etiqueta: "Mayor o igual",
    descripcion: "Avisar al llegar o superar",
    Icono: ArrowUp,
  },
  {
    valor: "<",
    simbolo: "<",
    etiqueta: "Menor que",
    descripcion: "Avisar cuando baje del límite",
    Icono: ArrowDown,
  },
  {
    valor: "<=",
    simbolo: "≤",
    etiqueta: "Menor o igual",
    descripcion: "Avisar al llegar o bajar",
    Icono: ArrowDown,
  },
  {
    valor: "=",
    simbolo: "=",
    etiqueta: "Igual a",
    descripcion: "Avisar si coincide exactamente",
    Icono: Equal,
  },
  {
    valor: "entre",
    simbolo: "↔",
    etiqueta: "Entre dos valores",
    descripcion: "Avisar dentro de un rango",
    Icono: ArrowUpDown,
  },
  {
    valor: "fuera_de_rango",
    simbolo: "⇹",
    etiqueta: "Fuera de rango",
    descripcion: "Avisar si se sale del rango",
    Icono: ArrowUpDown,
  },
];

export const OPERADORES_BOOLEANOS: DefinicionOperador[] = [
  {
    valor: "es_true",
    simbolo: "✓",
    etiqueta: "Está activo",
    descripcion: "Avisar cuando el valor sea verdadero",
    Icono: CheckCircle2,
  },
  {
    valor: "es_false",
    simbolo: "✗",
    etiqueta: "Está inactivo",
    descripcion: "Avisar cuando el valor sea falso",
    Icono: XCircle,
  },
];

export const OPERADORES_TEXTO: DefinicionOperador[] = [
  {
    valor: "igual_a",
    simbolo: "=",
    etiqueta: "Es igual a",
    descripcion: "Coincidencia exacta",
    Icono: Equal,
  },
  {
    valor: "diferente_de",
    simbolo: "≠",
    etiqueta: "Es distinto de",
    descripcion: "Cualquier valor salvo ese",
    Icono: Type,
  },
  {
    valor: "contiene",
    simbolo: "∋",
    etiqueta: "Contiene",
    descripcion: "Avisar si incluye ese texto",
    Icono: Type,
  },
];

/** Devuelve el catálogo que corresponde a un tipo de dato. */
export function operadoresDe(tipoDato?: string | null): DefinicionOperador[] {
  const tipo = (tipoDato ?? "text").toLowerCase();
  if (tipo.startsWith("numer")) return OPERADORES_NUMERICOS;
  if (tipo === "boolean") return OPERADORES_BOOLEANOS;
  if (tipo === "text") return OPERADORES_TEXTO;
  return [];
}

/** Busca la definición de un operador concreto. */
export function buscarOperador(
  tipoDato: string | null | undefined,
  operador: string
): DefinicionOperador | undefined {
  return operadoresDe(tipoDato).find((o) => o.valor === operador);
}

/** Campos de una regla que influyen en cómo se describe. */
export interface DatosReglaDescribible {
  operador: string;
  valor_referencia_numerico?: number | null;
  valor_referencia_texto?: string | null;
  valor_min?: number | null;
  valor_max?: number | null;
}

/**
 * Convierte el operador y sus valores en una expresión corta y completa.
 *
 *     { operador: '>',  valor_referencia_numerico: 30 }  →  "> 30 °C"
 *     { operador: 'entre', valor_min: 40, valor_max: 60 } →  "40 – 60 °C"
 *     { operador: 'es_true' }                              →  "activo"
 */
export function expresionCondicion(
  regla: DatosReglaDescribible,
  unidad?: string | null
): string {
  const u = unidad ? ` ${unidad}` : "";
  const n = (v: number | null | undefined) =>
    v === null || v === undefined ? "…" : String(v);

  switch (regla.operador) {
    case ">":
      return `> ${n(regla.valor_referencia_numerico)}${u}`;
    case ">=":
      return `≥ ${n(regla.valor_referencia_numerico)}${u}`;
    case "<":
      return `< ${n(regla.valor_referencia_numerico)}${u}`;
    case "<=":
      return `≤ ${n(regla.valor_referencia_numerico)}${u}`;
    case "=":
      return `= ${n(regla.valor_referencia_numerico)}${u}`;
    case "entre":
      return `${n(regla.valor_min)} – ${n(regla.valor_max)}${u}`;
    case "fuera_de_rango":
      return `fuera de ${n(regla.valor_min)} – ${n(regla.valor_max)}${u}`;
    case "es_true":
      return "activo";
    case "es_false":
      return "inactivo";
    case "igual_a":
      return `= «${regla.valor_referencia_texto || "…"}»`;
    case "diferente_de":
      return `≠ «${regla.valor_referencia_texto || "…"}»`;
    case "contiene":
      return `contiene «${regla.valor_referencia_texto || "…"}»`;
    default:
      return regla.operador;
  }
}

/**
 * Explica la regla en una frase.
 *
 *     "Se activa cuando el valor está por encima de 30 °C"
 *
 * A diferencia de `expresionCondicion`, aquí se usa lenguaje natural, que es
 * lo que hace falta para revisar una regla sin tener que traducir símbolos.
 */
export function resumenCondicion(
  regla: DatosReglaDescribible,
  unidad?: string | null
): string {
  const u = unidad ? ` ${unidad}` : "";
  const n = (v: number | null | undefined) =>
    v === null || v === undefined ? "…" : String(v);

  switch (regla.operador) {
    case ">":
      return `esté por encima de ${n(regla.valor_referencia_numerico)}${u}`;
    case ">=":
      return `llegue o supere ${n(regla.valor_referencia_numerico)}${u}`;
    case "<":
      return `esté por debajo de ${n(regla.valor_referencia_numerico)}${u}`;
    case "<=":
      return `llegue o baje de ${n(regla.valor_referencia_numerico)}${u}`;
    case "=":
      return `sea exactamente ${n(regla.valor_referencia_numerico)}${u}`;
    case "entre":
      return `esté entre ${n(regla.valor_min)}${u} y ${n(regla.valor_max)}${u}`;
    case "fuera_de_rango":
      return `quede fuera del rango ${n(regla.valor_min)}${u} – ${n(regla.valor_max)}${u}`;
    case "es_true":
      return "esté activo";
    case "es_false":
      return "esté inactivo";
    case "igual_a":
      return `sea igual a «${regla.valor_referencia_texto || "…"}»`;
    case "diferente_de":
      return `sea distinto de «${regla.valor_referencia_texto || "…"}»`;
    case "contiene":
      return `contenga «${regla.valor_referencia_texto || "…"}»`;
    default:
      return "cumpla la condición configurada";
  }
}
