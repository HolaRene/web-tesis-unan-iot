# Realtime — Cobertura de vistas (auditoría y arreglo)

> Estado: ✅ corregido.

## El problema

Los eventos llegaban bien por WebSocket, pero **no todas las vistas los
escuchaban** y **varias claves de caché no estaban cubiertas**. Resultado: los
contadores y valores de los canales, y los historiales, se quedaban congelados.

Dos causas concretas:

1. **Vistas sin listener.** `vista-canales.tsx` y `detalle-canal.tsx` no
   montaban ningún hook de eventos y no tenían `refetchInterval`. Cargaban una
   vez y nunca más.
2. **Claves de caché sin cubrir.** El hook solo tocaba `["mediciones"]` y
   `["canales"]`, pero existían más claves reales:
   `["canal-hist", id]`, `["canal", id]`, `["sensor-hist", id]`,
   `["canales-sensor", id]`.

## Auditoría de claves (antes)

| Clave | Vista | ¿Actualizaba? |
|---|---|---|
| `["dispositivos"]` | /dispositivos | ✅ por `dispositivo:*` |
| `["dispositivo", id]` | detalle | ✅ |
| `["alertas"]` | /alertas | ✅ por `alerta:*` |
| `["mediciones", filtros]` | /mediciones | ⚠️ solo insertaba |
| `["mediciones","historial",limite]` | /mediciones (historial) | ⚠️ parcial |
| `["canal-hist", id]` | detalle de canal | ❌ congelado |
| `["canal", id]` | detalle de canal | ❌ congelado |
| `["canales", "grilla"]` | /canales | ❌ congelado |
| `["sensor-hist", id]` | detalle de sensor | ❌ congelado |
| `["canales-sensor", id]` | detalle de sensor | ❌ congelado |

## Arreglo

### 1. `use-eventos-mediciones` cubre todas las claves

`medicion:nueva` (uno por lote):
- `["mediciones", ...]` → **inserta** las mediciones al inicio (sin duplicar por id).
- `["canal-hist", canal_id]` → **añade el punto** al final de la serie.

`canal:actualizado` (uno por canal):
- `["canales", ...]` → parchea `ultimo_valor_*`, `ultimo_registrado_en` y **suma 1** al contador.
- `["canal", canal_id]` → parchea el detalle.

### 2. Payload enriquecido en el backend

Para poder parchear **sin refetch**, el evento ahora incluye los datos de
presentación del canal:

```jsonc
// medicion:nueva → mediciones[]
{
  "id": 101,
  "canal_id": "uuid",
  "canal_codigo": "DHT22-01-TEMPERATURA",
  "canal_nombre": "DHT22 · Temperatura",   // ← nuevo
  "canal_unidad": "°C",                    // ← nuevo
  "canal_tipo_dato": "numeric",            // ← nuevo
  "sensor_id": "uuid",
  "valor_numerico": 25.2,
  "registrado_en": "..."
}
```

`canal:actualizado` lleva los mismos tres campos nuevos.

### 3. Vistas con listener + polling de respaldo

| Archivo | Cambio |
|---|---|
| `canales/vista-canales.tsx` | `useEventosMediciones()` + `refetchInterval: 90s` |
| `canales/detalle-canal.tsx` | `useEventosMediciones()` + 90s en canal e historial |
| `sensores/vista-detalle-sensor.tsx` | `useEventosMediciones()` + 90s en sensor e historial |
| `mediciones/historial-mediciones.tsx` | `useEventosMediciones()` |

## Por qué insertar en vez de invalidar

Insertar el punto en la serie **no dispara un refetch**: la gráfica se mueve al
instante, sin parpadeo ni pérdida del scroll. Invalidar provocaría un
`GET` completo por cada medición (con 5 s de intervalo y varios sensores, es
tráfico innecesario).

El contador de `cantidad_mediciones` se **incrementa** localmente por la misma
razón.

## Al reconectar

Se invalidan **una vez** todas las claves afectadas para recuperar lo perdido:

```
["mediciones"] · ["canales"] · ["canal-hist"] · ["canal"]
```

## Deuda conocida (menor)

- `["sensor-hist", id]` y `["canales-sensor", id]` **no** se parchean en vivo:
  esas vistas usan el polling de respaldo de 90 s. Se puede añadir el parcheo
  cuando se quiera, igual que se hizo con `["canal-hist"]`.
- Las gráficas de `/mediciones` (`PanelesGraficosMediciones`) se recalculan a
  partir de la lista, que **sí** se inserta: por eso se actualizan solas.
