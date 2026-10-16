"use client";

/**
 * Asistente de direccionamiento del actuador.
 *
 * ────────────────────────────────────────────────────────────────────
 * QUÉ PROBLEMA RESUELVE
 * ────────────────────────────────────────────────────────────────────
 * Un PLC no entiende «LED-1». Solo entiende «en la dirección 100, pon un 1».
 * La dirección física es un dato de la INSTALACIÓN, y sin él el comando llega
 * al equipo y no ocurre nada, sin ningún error visible.
 *
 * Este bloque pide los datos que cada protocolo necesita, con la ayuda
 * necesaria para no equivocarse: un fallo aquí se manifiesta como «el botón
 * no hace nada», que es de los más difíciles de diagnosticar.
 *
 * ────────────────────────────────────────────────────────────────────
 * POR QUÉ EL FORMULARIO CAMBIA SEGÚN EL PROTOCOLO
 * ────────────────────────────────────────────────────────────────────
 * Modbus necesita dirección y tipo de registro; GPIO necesita un pin. Mostrar
 * todos los campos a la vez invitaría a rellenar los que no tocan y a guardar
 * una configuración incoherente.
 */
import { Cpu, Globe, Network, Radio } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Protocolos disponibles, con su descripción. */
export const PROTOCOLOS = [
  {
    valor: "modbus",
    etiqueta: "Modbus (PLC)",
    detalle: "coil o registro + dirección numérica",
    Icono: Network,
  },
  {
    valor: "gpio",
    etiqueta: "GPIO (ESP32 / Arduino)",
    detalle: "número de pin físico",
    Icono: Cpu,
  },
  {
    valor: "mqtt",
    etiqueta: "MQTT",
    detalle: "tema propio; si se omite, se deriva del código",
    Icono: Radio,
  },
  {
    valor: "http",
    etiqueta: "HTTP",
    detalle: "el equipo expone su propia URL",
    Icono: Globe,
  },
] as const;

export type Protocolo = (typeof PROTOCOLOS)[number]["valor"];

/**
 * Valores del asistente.
 *
 * Se guardan como texto porque un input numérico vacío es una cadena; se
 * convierten a número al enviar.
 */
export interface BorradorDireccion {
  tipoModbus: string;
  direccionModbus: string;
  unidadModbus: string;
  pinGpio: string;
  nivelActivo: string;
  topicoMqtt: string;
  urlHttp: string;
  metodoHttp: string;
}

export const BORRADOR_VACIO: BorradorDireccion = {
  tipoModbus: "coil",
  direccionModbus: "",
  unidadModbus: "1",
  pinGpio: "",
  nivelActivo: "1",
  topicoMqtt: "",
  urlHttp: "",
  metodoHttp: "POST",
};

/** Reconstruye el borrador a partir de la configuración guardada. */
export function borradorDesdeConfiguracion(
  protocolo: string | null | undefined,
  cfg: Record<string, unknown> | null | undefined
): BorradorDireccion {
  const c = (cfg ?? {}) as Record<string, unknown>;
  const txt = (v: unknown) => (v === null || v === undefined ? "" : String(v));

  return {
    tipoModbus: txt(c.tipo) || "coil",
    direccionModbus: txt(c.direccion),
    unidadModbus: txt(c.unidad_id) || "1",
    pinGpio: txt(c.pin),
    nivelActivo: txt(c.nivel_activo) || "1",
    topicoMqtt: txt(c.topico),
    urlHttp: txt(c.url),
    metodoHttp: txt(c.metodo) || "POST",
  };
}

/**
 * Convierte el borrador en la configuración que espera la API.
 *
 * Devuelve solo los campos del protocolo elegido, y convierte a número los
 * que lo son: la API los valida como enteros y `"100"` sería rechazado.
 */
export function configuracionDesdeBorrador(
  protocolo: string,
  b: BorradorDireccion
): Record<string, unknown> {
  if (protocolo === "modbus") {
    return {
      tipo: b.tipoModbus,
      direccion: aNumero(b.direccionModbus),
      unidad_id: b.unidadModbus ? aNumero(b.unidadModbus) : 1,
    };
  }

  if (protocolo === "gpio") {
    return {
      pin: aNumero(b.pinGpio),
      nivel_activo: aNumero(b.nivelActivo),
    };
  }

  if (protocolo === "http") {
    return {
      url: b.urlHttp.trim(),
      metodo: b.metodoHttp,
    };
  }

  // MQTT: el tema es opcional (se deriva del código si falta).
  return b.topicoMqtt.trim() ? { topico: b.topicoMqtt.trim() } : {};
}

/**
 * Convierte a número, o a NaN si no es válido (la API lo rechazará).
 *
 * ⚠️ El caso de la cadena VACÍA es importante: `Number("")` devuelve **0**,
 * no NaN. Y 0 es una dirección Modbus perfectamente válida, así que un campo
 * vacío se guardaría como «dirección 0» y el botón accionaría **otra salida**
 * del PLC, distinta de la que se cree configurada.
 *
 * Por eso se comprueba explícitamente si el texto está vacío.
 */
function aNumero(v: string): number {
  if (v.trim() === "") return Number.NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : Number.NaN;
}

export function AsistenteDireccion({
  protocolo,
  borrador,
  onProtocolo,
  onBorrador,
}: {
  protocolo: string;
  borrador: BorradorDireccion;
  onProtocolo: (p: string) => void;
  onBorrador: (b: Partial<BorradorDireccion>) => void;
}) {
  return (
    <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
      <div className="grid gap-2">
        <Label htmlFor="act-protocolo">Protocolo de accionamiento</Label>
        <Select
          value={protocolo}
          onValueChange={(v) => onProtocolo((v as string) ?? "mqtt")}
        >
          <SelectTrigger id="act-protocolo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROTOCOLOS.map((p) => (
              <SelectItem key={p.valor} value={p.valor}>
                {p.etiqueta} — {p.detalle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Determina cómo se acciona el actuador y qué datos de dirección hacen
          falta. Sin ellos, el comando no dice al equipo <em>dónde</em>{" "}
          escribir.
        </p>
      </div>

      {/* ── MODBUS ── */}
      {protocolo === "modbus" ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="act-tipo-modbus">Tipo de registro</Label>
              <Select
                value={borrador.tipoModbus}
                onValueChange={(v) =>
                  onBorrador({ tipoModbus: (v as string) ?? "coil" })
                }
              >
                <SelectTrigger id="act-tipo-modbus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coil">Coil (FC5)</SelectItem>
                  <SelectItem value="holding">Registro holding (FC6)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="act-direccion">Dirección</Label>
              <Input
                id="act-direccion"
                type="number"
                min={0}
                max={65535}
                placeholder="100"
                value={borrador.direccionModbus}
                onChange={(e) =>
                  onBorrador({ direccionModbus: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="act-unidad">Unidad Modbus</Label>
              <Input
                id="act-unidad"
                type="number"
                min={0}
                max={255}
                placeholder="1"
                value={borrador.unidadModbus}
                onChange={(e) => onBorrador({ unidadModbus: e.target.value })}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            El PLC solo entiende «en la dirección <strong>100</strong>, pon un{" "}
            <strong>1</strong>». Esa dirección es el cableado de la instalación,
            no algo que el software pueda deducir. La unidad distingue varios
            PLC o gateways en la misma red.
          </p>
        </div>
      ) : null}

      {/* ── GPIO ── */}
      {protocolo === "gpio" ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="act-pin">Pin</Label>
              <Input
                id="act-pin"
                type="number"
                min={0}
                max={255}
                placeholder="2"
                value={borrador.pinGpio}
                onChange={(e) => onBorrador({ pinGpio: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="act-nivel">Nivel que lo activa</Label>
              <Select
                value={borrador.nivelActivo}
                onValueChange={(v) => onBorrador({ nivelActivo: (v as string) ?? "1" })}
              >
                <SelectTrigger id="act-nivel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Alto (1) — lo habitual</SelectItem>
                  <SelectItem value="0">Bajo (0) — relé invertido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Muchos módulos de relé se activan con nivel <strong>bajo</strong>{" "}
            (0 V): escribir un 1 los apagaría. Configurarlo aquí evita tener que
            invertir la lógica en el firmware, que es donde peor se encuentra.
          </p>
        </div>
      ) : null}

      {/* ── MQTT ── */}
      {protocolo === "mqtt" ? (
        <div className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="act-topico">Tema MQTT (opcional)</Label>
            <Input
              id="act-topico"
              placeholder="hospital/quirofano/cmd/EXTRACTOR"
              value={borrador.topicoMqtt}
              onChange={(e) => onBorrador({ topicoMqtt: e.target.value })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Si se deja vacío, se publica en{" "}
            <code>hospital/quirofano/cmd/&lt;código del actuador&gt;</code>. Un
            ESP32 puede entonces decidir qué pin activar según el código.
          </p>
        </div>
      ) : null}

      {/* ── HTTP ── */}
      {protocolo === "http" ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
            <div className="grid gap-2">
              <Label htmlFor="act-url">URL</Label>
              <Input
                id="act-url"
                placeholder="http://192.168.1.50/rele"
                value={borrador.urlHttp}
                onChange={(e) => onBorrador({ urlHttp: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="act-metodo">Método</Label>
              <Select
                value={borrador.metodoHttp}
                onValueChange={(v) => onBorrador({ metodoHttp: (v as string) ?? "POST" })}
              >
                <SelectTrigger id="act-metodo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            La API no llama a esta URL: la incluye en el comando para que la use
            quien lo entregue (Node-RED o un script de integración).
          </p>
        </div>
      ) : null}
    </div>
  );
}
