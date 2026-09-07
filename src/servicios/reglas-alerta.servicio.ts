/**
 * Servicio Reglas de Alerta. /api/v1/reglas-alerta
 */
import { api } from './api';
import type { ReglaAlerta } from '@/tipos';

export function obtenerReglas(filtros?: { canal_id?: string }): Promise<ReglaAlerta[]> {
  const p = filtros?.canal_id ? `?canal_id=${encodeURIComponent(filtros.canal_id)}` : '';
  return api.obtener<ReglaAlerta[]>(`/reglas-alerta${p}`).then((r) => r.datos);
}

export function crearReglaAlerta(datos: {
  canal_id: string;
  nombre: string;
  operador: string;
  severidad: 'info' | 'warning' | 'critical';
  valor_referencia_numerico?: number | null;
  valor_referencia_texto?: string | null;
  valor_min?: number | null;
  valor_max?: number | null;
  mensaje?: string | null;
  activa?: boolean;
}): Promise<ReglaAlerta> {
  return api.enviar<ReglaAlerta>('/reglas-alerta', datos, 'POST').then((r) => r.datos);
}
