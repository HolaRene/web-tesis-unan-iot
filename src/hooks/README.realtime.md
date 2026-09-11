# Realtime — Parte 6: frontend (cliente WebSocket)

> Estado: ✅ implementado.
> Depende de: Partes 1–5 (backend).

## Objetivo

Cargar los dispositivos por **REST** una vez y, a partir de ahí, mantenerlos
actualizados por **WebSocket** con `queryClient.setQueryData()`, **sin**
refrescar toda la lista cada 15 segundos.

## Archivos creados

| Archivo | Descripción |
|---|---|
| `src/tipos/realtime.ts` | Tipos de eventos y payloads (espejo del backend). |
| `src/configuracion/realtime.ts` | `urlWebSocket(token)`, `RECONEXION_MS`, `POLLING_RESPALDO_MS`. |
| `src/hooks/use-realtime.ts` | Conexión WS + reconexión + invalidación al reconectar. |
| `src/hooks/use-eventos-dispositivos.ts` | Traduce eventos de dispositivo a `setQueryData`. |

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/tipos/index.ts` | Exporta los tipos realtime. |
| `src/components/dispositivos/gestion-dispositivos.tsx` | Usa `useEventosDispositivos()`; polling 15 s → **90 s**. |
| `src/components/dispositivos/detalle-dispositivo.tsx` | Usa `useEventosDispositivos()`; polling 15 s → **90 s**. |

## Cómo funciona

```
REST   GET /dispositivos          → carga inicial (TanStack Query)
WS     dispositivo:online         → setQueryData parchea estado + ultima_conexion
WS     dispositivo:offline        → setQueryData parchea estado + ultima_conexion
WS     dispositivo:actualizado    → setQueryData parchea estado/IP/metadatos
```

El parche se aplica a **dos claves**:

- `["dispositivos"]` → reemplaza solo el elemento afectado dentro del array.
- `["dispositivo", id]` → actualiza el detalle si está en caché.

Ninguna de las dos hace refetch: es actualización pura de caché.

## Caso de ejemplo (lista)

```
ESP32-Q2 · Online  · Última conexión: hace 3 segundos
```

Llega `dispositivo:offline` → la fila pasa **inmediatamente** a:

```
ESP32-Q2 · Offline · Última conexión: hace 6 minutos
```

…sin esperar al polling.

## Desconexión y reconexión

- Si el WS se cae, los dispositivos **siguen actualizándose en PostgreSQL**
  (el frontend no pierde la fuente de verdad; solo se queda "ciego" un rato).
- El hook reintenta cada `RECONEXION_MS` (3 s).
- **Al reconectar**, invalida **una vez** `["dispositivos"]` para recuperar
  cualquier cambio ocurrido mientras estaba desconectado, y luego continúa con
  actualizaciones realtime.

## Polling: qué pasó con los 15 s

| Antes | Ahora |
|---|---|
| `refetchInterval: 15_000` (hardcodeado) | `refetchInterval: POLLING_RESPALDO_MS` = **90 s** |

El polling **no se eliminó del todo**: queda como *fallback* poco frecuente por
si el WebSocket no está disponible (red corporativa que bloquea WS, backend sin
la capa realtime, etc.). Con WS funcionando, el trabajo de refresco es
prácticamente nulo.

> Si preferís eliminar el polling por completo, basta con quitar
> `refetchInterval` de esas dos queries; el WS seguiría actualizando. Se dejó el
> respaldo a propósito.

## Modo demo

En modo demo (`esSesionDemo`) el hook **no abre el WebSocket** (no hay backend
real); la app sigue funcionando con las queries normales.
