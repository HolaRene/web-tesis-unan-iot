# MonitorIT — Frontend

Plataforma genérica de monitorización e integración IoT/industrial.

Este es el **frontend** de la plataforma, construido con **Next.js (App Router) +
TypeScript**. La primera aplicación es la monitorización ambiental hospitalaria,
pero la arquitectura es reutilizable para industria, agricultura, edificios
inteligentes, laboratorios y otros entornos IoT.

> El monorepo contiene además la API REST en `../api` (Node.js + Express), que
> expone los endpoints bajo `/api/v1`.
>
> 📘 **Modelo multivariable.** Un sensor puede tener varias magnitudes
> (canales): p. ej. un DHT22 aporta temperatura y humedad. El editor de
> magnitudes está en `/sensores` y el detalle en `/sensores/[id]`. Ver
> [`../docs/modelo-multivariable.md`](../docs/modelo-multivariable.md).

## Stack tecnológico

- **Next.js** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **TanStack Query** (caché/estado de datos de la API)
- **React Hook Form + Zod** (formularios y validación)
- **Recharts** (gráficas)
- **date-fns** (fechas)
- **Lucide React** (iconos)
- **HLS.js** (soporte preparado para cámaras IP)
- **next-themes** (modo claro/oscuro)

## Estructura de carpetas

```
src/
├── app/                     # Rutas (App Router)
│   ├── page.tsx             # Página pública de inicio
│   ├── layout.tsx           # Layout raíz (temas + sesión)
│   ├── (publico)/           # /acerca, /tecnologias (layout público)
│   ├── (auth)/              # /iniciar-sesion (layout de autenticación)
│   └── (panel)/             # Rutas protegidas del panel:
│       ├── dashboard/
│       ├── areas/           # incluye areas/[id]
│       ├── dispositivos/
│       ├── sensores/
│       ├── mediciones/
│       ├── alertas/
│       ├── camaras/
│       ├── integraciones/
│       └── configuracion/
├── components/             # Componentes UI y de negocio
│   ├── ui/                  # Componentes de shadcn/ui
│   ├── layout/             # Barra lateral, cabeceras, selector de tema
│   ├── dashboard/          # Piezas del dashboard
│   ├── compartidos/        # Página base "en construcción", estados
│   ├── proveedores/        # QueryProvider, ThemeProvider, proveedor de sesión
│   └── autenticacion/      # Formulario de login, guard de rutas
├── hooks/                  # Hooks (use-sesion)
├── servicios/             # Cliente HTTP y servicios por entidad
├── esquemas/              # Esquemas Zod para formularios
├── tipos/                 # Tipos TypeScript de entidades y respuestas
├── utilidades/            # Formato, estados, sesión, datos de demostración
├── configuracion/          # URL de API, marca y navegación
└── lib/                    # Utilidades de shadcn (cn)
```

## Requisitos previos

- **Node.js** 20 o superior
- **pnpm**

## Instalación

```bash
# Instalar dependencias
pnpm install

# Crear el archivo de entorno a partir de la plantilla
cp .env.example .env.local
```

Configurar en `.env.local` la URL de la API REST (debe apuntar a `/api/v1`):

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

## Desarrollo

```bash
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Compilación

```bash
pnpm build
pnpm start
```

## Notas importantes

### Conexión con la API (aún parcial — datos simulados)

- Las páginas del panel de **dashboard** muestran datos **de demostración /
  mock** (definidos en `src/utilidades/datos-demo.ts`), claramente marcados
  como tales.
- El resto de páginas del panel (`areas`, `dispositivos`, `sensores`,
  `mediciones`, `alertas`, `camaras`, `integraciones`, `configuracion`) son
  páginas **base / en construcción**; no consumen CRUD todavía.
- Ya existe una capa de **servicios** (`src/servicios`) y un cliente HTTP
  reutilizable (`src/servicios/api.ts`) para conectar cada entidad con sus
  endpoints reales.

### Nombre de los endpoints del backend

La GUI usa rutas en español (`/dispositivos`), pero la API REST expone rutas en
inglés:

| Frontend (sección) | Endpoint real de la API  |
| ------------------ | ------------------------ |
| Áreas              | `/api/v1/areas`          |
| Dispositivos       | `/api/v1/devices`        |
| Sensores           | `/api/v1/sensors`        |
| Tipos de variable  | `/api/v1/variable-types` |
| Mediciones         | `/api/v1/measurements`   |
| Umbrales           | `/api/v1/thresholds`     |
| Alertas            | `/api/v1/alerts`         |
| Cámaras            | `/api/v1/cameras`        |
| Integraciones      | `/api/v1/integrations`   |
| Usuarios / auth    | `/api/v1/users`          |

### Autenticación

- Endpoints reales: `POST /api/v1/users/login`, `POST /api/v1/users/registro`,
  `GET /api/v1/users/perfil` con el **perfil propio editado** mediante
  `PATCH /api/v1/users/perfil`.
- Se incluye un **modo demo** para desarrollo (email `demo@monitorit.local` y
  contraseña `demo1234`), claramente identificado. Si el backend responde, se
  autentica contra él; si no está disponible y se usan las credenciales demo,
  se inicia una sesión local de prueba.
- El token JWT se almacena en `localStorage` y se inyecta como `Bearer` por el
  cliente HTTP. La sesión se gestiona en `src/utilidades/sesion.ts` y el guard
  del panel en `src/components/autenticacion/requerir-sesion.tsx`.

### Perfil y cambio de credenciales

- **Edición de perfil** en `/mi-perfil`: permite cambiar el ``nombre`` y, de forma
  opcional, la contraseña. El **email no se puede editar**: queda fijo al
  registrarse y sólo un ``admin`` podría cambiarlo desde la gestión de usuarios.
- El envío usa `PATCH /api/v1/users/perfil` (endpoint propio para cualquier
  usuario autenticado que sólo edita su propia cuenta), **no** el
  `PATCH /users/:id`, que sigue restringido a administradores y que sí permite
  cambiar el email/rol de un usuario.
- Para cambiar la contraseña se exige la **contraseña actual**.
- Tras cambiar la contraseña conviene volver a iniciar sesión con la nueva.
- La edición del `email`, `rol` y estado del usuario es función del **admin**
  (gestión de usuarios), no del propio perfil.

### Cámaras IP

- El componente `src/components/camaras/reproductor-camara.tsx` está preparado
  para recibir URLs **HLS** o **WebRTC**. No se conecta RTSP directamente al
  navegador. La lógica de reproducción se completará cuando el backend entregue
  fuentes válidas (ver comentarios `TODO` en el componente).

## Comandos útiles

```bash
pnpm lint   # Lint de ESLint
pnpm build  # Compila el proyecto para producción
```
