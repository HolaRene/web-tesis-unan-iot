/**
 * Servicio de Canales (magnitudes de un sensor). /api/v1/canales
 */
import { api } from './api';
import type { Canal } from '@/tipos';

export function obtenerCanales(filtros?: {
  sensor_id?: string;
  dispositivo_id?: string;
  area_id?: string;
  buscar?: string;
}): Promise<Canal[]> {
  const p = new URLSearchParams();
  if (filtros?.sensor_id) p.set('sensor_id', filtros.sensor_id);
  if (filtros?.dispositivo_id) p.set('dispositivo_id', filtros.dispositivo_id);
  if (filtros?.area_id) p.set('area_id', filtros.area_id);
  if (filtros?.buscar) p.set('buscar', filtros.buscar);
  const qs = p.toString() ? `?${p.toString()}` : '';
  return api.obtener<Canal[]>(`/canales${qs}`).then((r) => r.datos);
}

export function obtenerCanalPorId(id: string): Promise<Canal> {
  return api.obtener<Canal>(`/canales/${id}`).then((r) => r.datos);
}

export function obtenerMedicionesCanal(
  id: string,
  opciones?: { desde?: string; hasta?: string; limite?: number }
): Promise<{ mediciones: Array<Record<string, unknown>> }> {
  const p = new URLSearchParams();
  if (opciones?.desde) p.set('desde', opciones.desde);
  if (opciones?.hasta) p.set('hasta', opciones.hasta);
  if (opciones?.limite) p.set('limite', String(opciones.limite));
  const qs = p.toString() ? `?${p.toString()}` : '';
  return api.obtener<{ mediciones: Array<Record<string, unknown>> }>(
    `/canales/${id}/mediciones${qs}`
  ).then((r) => r.datos);
}
