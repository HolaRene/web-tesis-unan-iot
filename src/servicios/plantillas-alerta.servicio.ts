/**
 * Servicio de plantillas de alerta.
 *
 * Las plantillas son perfiles de entorno (quirófano, sala limpia, centro de
 * datos, cadena de frío) que la API lee de archivos JSON del repositorio.
 * Aplicarlas a un canal crea reglas normales a partir de ellas.
 */
import { api } from "@/servicios/api";

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
}

export interface ResultadoAplicarPlantilla {
  plantilla: string;
  canal_id: string;
  creadas: number;
  omitidas: { nombre: string; variable: string; motivo: string }[];
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
