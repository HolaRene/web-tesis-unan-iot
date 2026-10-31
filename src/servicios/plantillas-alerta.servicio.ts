/**
 * Servicio de normas (plantillas de alerta).
 *
 * Una norma es un perfil de entorno: quirófano (ASHRAE 170), sala limpia
 * (ISO 14644), centro de datos, cadena de frío… y también las que cree el
 * propio administrador («Invernadero», «Cámara fría»).
 *
 * Viven en base de datos. Las de `origen = 'sistema'` se siembran desde los
 * JSON del repositorio, pero se pueden editar; solo las de `usuario` se
 * pueden borrar.
 *
 * Aplicar una norma a un canal o a un área COPIA sus reglas a
 * `reglas_alerta`: a partir de ahí son reglas normales y editables.
 */
import { api } from "@/servicios/api";
import type { NivelMedicion } from "@/tipos";

export interface ReglaPlantilla {
  variable: string;
  tipos_variable: string[];
  nombre: string;
  operador: string;
  valor_referencia_numerico?: number | null;
  valor_min?: number | null;
  valor_max?: number | null;
  valor_referencia_texto?: string | null;
  severidad: "info" | "warning" | "critical";
  retardo_segundos?: number | null;
  histeresis?: number | null;
  mensaje?: string | null;
}

export interface PlantillaAlerta {
  id: string;
  nombre: string;
  descripcion: string;
  norma: string;
  notas: string[];
  reglas: ReglaPlantilla[];
  /** `sistema` = sembrada desde el repositorio (no borrable). */
  origen?: "sistema" | "usuario";
  activo?: boolean;
}

export interface ResultadoAplicarPlantilla {
  plantilla: string;
  canal_id: string;
  creadas: number;
  omitidas: { nombre: string; variable: string; motivo: string }[];
}

/** Resultado de aplicar una norma a TODOS los canales de un área. */
export interface ResultadoAplicarArea {
  plantilla: string;
  area_id: string;
  creadas: number;
  /** Reglas que ya existían con el mismo nombre y la misma norma. */
  repetidas: number;
  omitidas: { canal: string; variable: string; motivo: string }[];
  canales: number;
}

/** Datos para crear o editar una norma. */
export interface DatosNorma {
  id?: string;
  nombre: string;
  descripcion?: string | null;
  norma: string;
  notas?: string[];
  reglas: ReglaPlantilla[];
}

export async function listarPlantillas(): Promise<PlantillaAlerta[]> {
  const r = await api.obtener<PlantillaAlerta[]>("/plantillas-alerta");
  return Array.isArray(r.datos) ? r.datos : [];
}

export async function aplicarPlantilla(
  plantillaId: string,
  canalId: string
): Promise<ResultadoAplicarPlantilla> {
  const r = await api.enviar<ResultadoAplicarPlantilla>(
    `/plantillas-alerta/${plantillaId}/aplicar`,
    { canal_id: canalId }
  );
  return r.datos;
}

/**
 * Aplica una norma a TODOS los canales de un área.
 *
 * Es idempotente: las reglas que ya existían no se duplican y se informan
 * como `repetidas`.
 */
export async function aplicarPlantillaAArea(
  plantillaId: string,
  areaId: string
): Promise<ResultadoAplicarArea> {
  const r = await api.enviar<ResultadoAplicarArea>(
    `/plantillas-alerta/${plantillaId}/aplicar-area`,
    { area_id: areaId }
  );
  return r.datos;
}

/** Crea una norma propia (solo admin en la API). */
export async function crearPlantilla(
  datos: DatosNorma
): Promise<PlantillaAlerta> {
  const r = await api.enviar<PlantillaAlerta>("/plantillas-alerta", datos);
  return r.datos;
}

/** Edita una norma. Las de sistema también se pueden editar. */
export async function actualizarPlantilla(
  id: string,
  datos: Omit<DatosNorma, "id">
): Promise<PlantillaAlerta> {
  const r = await api.enviar<PlantillaAlerta>(
    `/plantillas-alerta/${id}`,
    datos,
    "PUT"
  );
  return r.datos;
}

/** Borra una norma propia. Las de sistema devuelven 400. */
export async function eliminarPlantilla(id: string): Promise<void> {
  await api.eliminar(`/plantillas-alerta/${id}`);
}

/**
 * Pide al backend el nivel de un valor con unas reglas dadas.
 *
 * Se usa en la vista previa del formulario de reglas. NO se calcula en el
 * navegador a propósito: habría dos implementaciones de la clasificación y
 * podrían discrepar entre el panel y las alertas.
 */
export async function evaluarNivel(
  valor: number | null,
  reglas: ReglaPlantilla[],
  calidad?: string
): Promise<NivelMedicion> {
  const r = await api.enviar<{ nivel: NivelMedicion }>(
    "/plantillas-alerta/evaluar",
    { valor, reglas, calidad }
  );
  return r.datos.nivel;
}
