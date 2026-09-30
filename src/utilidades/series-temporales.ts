/**
 * Motor de agregación temporal en el cliente.
 *
 * ¿Por qué existe si el backend ya agrega en SQL?
 *
 *   - El SQL devuelve SOLO los cubos con datos. En un gráfico temporal eso
 *     deja huecos invisibles: si no hay mediciones de 12:00 a 12:30, los
 *     puntos 11:59 y 12:31 quedan pegados y parece que el tiempo no avanzó.
 *   - El intervalo por minuto (vista "en vivo") necesita recalcularse con
 *     cada refresco sobre las últimas mediciones, sin ir al servidor.
 *
 * Estas funciones son PURAS: reciben datos y devuelven la malla temporal
 * completa, anclada a `ahora`. Así el gráfico siempre avanza y los huecos
 * se ven como huecos.
 */

/** Un punto de la malla temporal (puede no tener datos). */
export interface PuntoTemporal {
  /** Instante del cubo (ISO). */
  instante: string;
  /** Etiqueta corta para el eje X. */
  etiqueta: string;
  /** Etiqueta completa para el tooltip (con día de la semana y fecha larga). */
  etiquetaLarga: string;
  /**
   * Periodo que cubre el punto, p. ej. "14:00 – 14:59" o "todo el día".
   *
   * Un punto NO es un instante: es el promedio de todo un periodo. Sin este
   * texto, un punto de la agrupación "por mes" parecería ser un dato del día
   * que aparece en la fecha.
   */
  rangoPeriodo: string;
  media: number | null;
  minimo: number | null;
  maximo: number | null;
  muestras: number;
  /** [mín, máx] listo para el área de rango de Recharts. */
  banda: [number, number] | null;
}

/** Entrada mínima: cualquier cubo agregado (venga del backend o de aquí). */
export interface CuboEntrada {
  cubo: string | Date;
  media: number | null;
  minimo: number | null;
  maximo: number | null;
  muestras: number;
}

/** Milisegundos por intervalo. */
const MS: Record<string, number> = {
  minuto: 60_000,
  hora: 3_600_000,
  dia: 86_400_000,
  semana: 604_800_000,
};

/**
 * Trunca una fecha al inicio de su intervalo.
 *
 * Para `mes` no se usa aritmética de milisegundos (los meses tienen distinta
 * duración): se ajusta directamente al día 1.
 */
export function truncar(fecha: Date, intervalo: string): Date {
  const d = new Date(fecha);
  switch (intervalo) {
    case 'minuto':
      d.setSeconds(0, 0);
      break;
    case 'hora':
      d.setMinutes(0, 0, 0);
      break;
    case 'dia':
      d.setHours(0, 0, 0, 0);
      break;
    case 'semana': {
      d.setHours(0, 0, 0, 0);
      // Semana que empieza en lunes (convención en España).
      const dia = (d.getDay() + 6) % 7;
      d.setDate(d.getDate() - dia);
      break;
    }
    case 'mes':
      d.setHours(0, 0, 0, 0);
      d.setDate(1);
      break;
    default:
      d.setMinutes(0, 0, 0);
  }
  return d;
}

/** Avanza una fecha un intervalo completo. */
export function avanzar(fecha: Date, intervalo: string): Date {
  const d = new Date(fecha);
  if (intervalo === 'mes') {
    // Los meses no tienen duración fija: se avanza de uno en uno.
    d.setMonth(d.getMonth() + 1);
    return d;
  }
  return new Date(d.getTime() + (MS[intervalo] ?? MS.hora));
}

/** Comprueba si dos fechas caen en el mismo cubo. */
function mismoCubo(a: Date, b: Date, intervalo: string): boolean {
  if (intervalo === 'mes') {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
  }
  return a.getTime() === b.getTime();
}

/**
 * Construye la malla temporal COMPLETA desde `desde` hasta `hasta`,
 * rellenando con `null` los intervalos sin datos.
 *
 * Es la pieza que hace que el gráfico "avance": el eje siempre termina en
 * `hasta` (normalmente ahora mismo), haya datos o no.
 *
 * @param cubos     Cubos con datos (pueden venir desordenados).
 * @param intervalo Intervalo de agrupación.
 * @param desde     Inicio de la malla.
 * @param hasta     Fin de la malla (se ancla al presente).
 * @param limite    Máximo de puntos (protege el render).
 */
export function rellenarMalla(
  cubos: CuboEntrada[],
  intervalo: string,
  desde: Date,
  hasta: Date,
  limite = 2000
): PuntoTemporal[] {
  /*
   * Sin agrupar: NO se rellena la malla.
   *
   * Cada cubo es una medición real con su marca de tiempo exacta. Inventar
   * puntos intermedios vacíos no tendría sentido: el hueco entre dos
   * mediciones es el intervalo de muestreo (p. ej. 2 s), no una falta de
   * datos. Además, truncar a minutos colapsaría varias mediciones en el mismo
   * instante y `porInstante` se quedaría solo con la última, que es
   * exactamente el fallo que `sin_agrupar` viene a resolver.
   */
  if (intervalo === 'sin_agrupar') {
    return cubos
      .map((c) => aPunto(c, intervalo, true))
      .sort((a, b) => (a.instante < b.instante ? -1 : 1))
      .slice(0, limite);
  }

  // Índice por instante truncado para localizar cada cubo en O(1).
  const porInstante = new Map<number, CuboEntrada>();
  for (const c of cubos) {
    const clave = truncar(new Date(c.cubo), intervalo).getTime();
    porInstante.set(clave, c);
  }

  const puntos: PuntoTemporal[] = [];
  let cursor = truncar(desde, intervalo);
  const fin = hasta.getTime();

  // ¿El rango cruza más de un día? Entonces las etiquetas de hora/minuto
  // deben incluir el día para no ser ambiguas.
  const abarcaVariosDias =
    truncar(desde, 'dia').getTime() !== truncar(hasta, 'dia').getTime();

  // Si el rango es enorme para el intervalo pedido, no se genera la malla
  // completa: se devuelven solo los cubos con datos (evita colgar el render).
  const estimado = estimarPuntos(desde, hasta, intervalo);
  if (estimado > limite) {
    return cubos
      .map((c) => aPunto(c, intervalo, abarcaVariosDias))
      .sort((a, b) => (a.instante < b.instante ? -1 : 1));
  }

  while (cursor.getTime() <= fin && puntos.length < limite) {
    const cubo = porInstante.get(cursor.getTime());
    puntos.push(
      cubo
        ? aPunto(cubo, intervalo, abarcaVariosDias)
        : {
            instante: cursor.toISOString(),
            ...etiquetas(cursor, intervalo, abarcaVariosDias),
            media: null,
            minimo: null,
            maximo: null,
            muestras: 0,
            banda: null,
          }
    );
    cursor = avanzar(cursor, intervalo);
  }

  return puntos;
}

/** Número aproximado de puntos que generaría la malla. */
export function estimarPuntos(
  desde: Date,
  hasta: Date,
  intervalo: string
): number {
  if (intervalo === 'mes') {
    const meses =
      (hasta.getFullYear() - desde.getFullYear()) * 12 +
      (hasta.getMonth() - desde.getMonth());
    return Math.max(1, meses + 1);
  }
  const paso = MS[intervalo] ?? MS.hora;
  return Math.max(1, Math.floor((hasta.getTime() - desde.getTime()) / paso) + 1);
}

/**
 * Etiquetas del eje X y del tooltip según el intervalo.
 *
 * Devuelve DOS cosas con propósitos distintos:
 *
 *   - `etiqueta`: texto corto para el EJE X. Debe caber; si el rango cruza
 *     varios días, incluye el día ("24 sep 14:00") para no ser ambiguo.
 *   - `etiquetaLarga`: texto completo para el TOOLTIP, donde hay espacio.
 *     Describe el periodo con precisión ("lunes, 28 de septiembre de 2026,
 *     14:00"), incluye el rango que abarca ("14:00 – 14:59") y nombra
 *     correctamente semanas y meses.
 *
 * `rangoPeriodo` es el texto del intervalo que cubre el punto. Es importante
 * porque cada punto NO es un instante, sino el promedio de todo un periodo:
 * sin él, un punto de "septiembre" parecería ser un dato del día 28.
 *
 * `abarcaVariosDias` solo afecta a la etiqueta CORTA del eje (minutos/horas).
 */
export function etiquetas(
  fecha: Date,
  intervalo: string,
  abarcaVariosDias = false
): { etiqueta: string; etiquetaLarga: string; rangoPeriodo: string } {
  const p = (n: number) => String(n).padStart(2, '0');
  const meses = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
  ];
  const mesesLargos = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  const diasLargos = [
    'domingo', 'lunes', 'martes', 'miércoles',
    'jueves', 'viernes', 'sábado',
  ];

  const hora = `${p(fecha.getHours())}:${p(fecha.getMinutes())}`;
  const dia = `${fecha.getDate()} ${meses[fecha.getMonth()]}`;
  const anio = fecha.getFullYear();
  const diaLargo = `${fecha.getDate()} de ${mesesLargos[fecha.getMonth()]} de ${anio}`;

  /** Suma minutos y devuelve "HH:mm". Se usa para el fin del periodo. */
  const sumarMinutos = (min: number) => {
    const d = new Date(fecha);
    d.setMinutes(d.getMinutes() + min);
    return `${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  switch (intervalo) {
    case 'minuto':
      return {
        etiqueta: abarcaVariosDias ? `${dia} ${hora}` : hora,
        etiquetaLarga: `${diasLargos[fecha.getDay()]}, ${diaLargo}, ${hora}`,
        rangoPeriodo: `${hora} – ${sumarMinutos(1)}`,
      };

    case 'hora':
      return {
        etiqueta: abarcaVariosDias ? `${dia} ${hora}` : hora,
        etiquetaLarga: `${diasLargos[fecha.getDay()]}, ${diaLargo}, ${hora}`,
        rangoPeriodo: `${hora} – ${sumarMinutos(59)}`,
      };

    case 'dia':
      return {
        etiqueta: dia,
        etiquetaLarga: `${diasLargos[fecha.getDay()]}, ${diaLargo}`,
        rangoPeriodo: 'todo el día',
      };

    case 'semana': {
      // Semana que empieza en lunes: se muestra el intervalo completo.
      const fin = new Date(fecha);
      fin.setDate(fin.getDate() + 6);
      const finTexto = `${fin.getDate()} ${meses[fin.getMonth()]}`;
      return {
        etiqueta: `Sem ${semanaDelAno(fecha)}`,
        etiquetaLarga: `Semana del ${dia} al ${finTexto} de ${fin.getFullYear()}`,
        rangoPeriodo: `del ${dia} al ${finTexto}`,
      };
    }

    case 'mes':
      return {
        etiqueta: `${meses[fecha.getMonth()]} ${String(anio).slice(2)}`,
        etiquetaLarga: `${mesesLargos[fecha.getMonth()]} de ${anio}`,
        rangoPeriodo: `${mesesLargos[fecha.getMonth()]} completo`,
      };

    default:
      return {
        etiqueta: hora,
        etiquetaLarga: `${diaLargo}, ${hora}`,
        rangoPeriodo: `${hora} – ${sumarMinutos(59)}`,
      };
  }
}

/** Número de semana ISO aproximado. */
function semanaDelAno(fecha: Date): number {
  const inicio = new Date(fecha.getFullYear(), 0, 1);
  const dias = Math.floor((fecha.getTime() - inicio.getTime()) / 86_400_000);
  return Math.ceil((dias + inicio.getDay() + 1) / 7);
}

/** Convierte un cubo con datos en un punto de la malla. */
function aPunto(
  c: CuboEntrada,
  intervalo: string,
  abarcaVariosDias = false
): PuntoTemporal {
  const fecha = truncar(new Date(c.cubo), intervalo);
  return {
    instante: fecha.toISOString(),
    ...etiquetas(fecha, intervalo, abarcaVariosDias),
    media: c.media,
    minimo: c.minimo,
    maximo: c.maximo,
    muestras: c.muestras,
    banda:
      c.minimo !== null && c.maximo !== null ? [c.minimo, c.maximo] : null,
  };
}

/**
 * Agrega mediciones CRUDAS por intervalo, en el cliente.
 *
 * Se usa para la vista "en vivo" (por minuto) sobre las últimas
 * mediciones: así el gráfico se recalcula en cada refresco sin pedir al
 * servidor una consulta por minuto.
 */
export function agregarMediciones(
  mediciones: Array<{ valor_numerico: number | null; registrado_en: string }>,
  intervalo: string
): CuboEntrada[] {
  const acumulado = new Map<
    number,
    { suma: number; minimo: number; maximo: number; muestras: number }
  >();

  for (const m of mediciones) {
    if (m.valor_numerico === null || m.valor_numerico === undefined) continue;
    const clave = truncar(new Date(m.registrado_en), intervalo).getTime();
    const actual = acumulado.get(clave);
    if (actual) {
      actual.suma += m.valor_numerico;
      actual.minimo = Math.min(actual.minimo, m.valor_numerico);
      actual.maximo = Math.max(actual.maximo, m.valor_numerico);
      actual.muestras += 1;
    } else {
      acumulado.set(clave, {
        suma: m.valor_numerico,
        minimo: m.valor_numerico,
        maximo: m.valor_numerico,
        muestras: 1,
      });
    }
  }

  return [...acumulado.entries()]
    .map(([instante, a]) => ({
      cubo: new Date(instante),
      media: a.suma / a.muestras,
      minimo: a.minimo,
      maximo: a.maximo,
      muestras: a.muestras,
    }))
    .sort((a, b) => a.cubo.getTime() - b.cubo.getTime());
}

/**
 * ¿El cubo corresponde al intervalo en curso? Sirve para resaltar el punto
 * actual (el que todavía se está llenando).
 */
export function esCuboActual(
  instante: string,
  intervalo: string,
  ahora: Date
): boolean {
  return mismoCubo(
    truncar(new Date(instante), intervalo),
    truncar(ahora, intervalo),
    intervalo
  );
}
