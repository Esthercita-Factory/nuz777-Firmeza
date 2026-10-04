# Firmeza

API REST para gestionar productos, clientes y ventas de un negocio de materiales de construccion.

## Arquitectura

La solucion usa arquitectura limpia con dependencias dirigidas hacia el dominio:

- `Firmeza.Domain`: entidades, enums y reglas puras de negocio.
- `Firmeza.Application`: casos de uso, DTOs, puertos y resultados.
- `Firmeza.Infrastructure`: PostgreSQL, EF Core, Identity, repositorios y JWT.
- `Firmeza.Api`: endpoints HTTP, autenticacion Bearer, Swagger y middleware. Aplica migraciones y crea el administrador inicial.
- `client`: cliente Angular 22 (standalone, signals, Tailwind) que consume la API.
- `Firmeza.Web`: host del cliente Angular. Sirve los estaticos de `wwwroot` y resuelve las rutas del router con fallback a `index.html`.
- `Firmeza.Tests`: pruebas unitarias de dominio y casos de uso.

El navegador llama **directo** a `Firmeza.Api` (URL en `client/src/app/Services/Api.Service.ts`), por eso la API habilita CORS para los origenes del cliente. `Firmeza.Web` no accede a la base de datos: solo publica la SPA compilada.

## Endpoints principales

- `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/refresh`, `GET /api/auth/me`.
- `GET|POST /api/products`, `GET|PUT|DELETE /api/products/{id}`.
- `GET /api/products/export/excel`, `GET /api/products/export/pdf`.
- `GET|POST /api/customers`, `GET|PUT|DELETE /api/customers/{id}`.
- `GET /api/customers/export/excel`, `GET /api/customers/export/pdf`.
- `GET|POST /api/sales`, `GET /api/sales/{id}`, `DELETE /api/sales/{id}`, `GET /api/sales/{id}/receipt`.
- `GET /api/sales/export/excel`, `GET /api/sales/export/pdf`.
- `POST /api/imports/excel`, `GET /api/imports/template`.
- `GET /api/dashboard`.
- `GET /health`.

Los endpoints de negocio requieren `Authorization: Bearer <access-token>`. Swagger esta disponible en `/swagger` cuando `Swagger:Enabled` es `true`, por defecto en desarrollo.

## Requisitos

- .NET SDK 10.
- PostgreSQL 16 o Docker Desktop.
- Node.js 22 y npm para el cliente Angular.

## Ejecucion local

1. Base de datos (puerto local `5433`):

   ```bash
   docker compose up -d db
   ```

2. Compilar todo (el build de .NET publica tambien el cliente Angular si `client/node_modules` existe):

   ```bash
   dotnet restore Firmeza.sln
   dotnet build Firmeza.sln
   ```

3. Levantar la API en `http://localhost:5180`:

   ```bash
   dotnet run --project Firmeza.Api --launch-profile http
   ```

4. Cliente Angular con recarga en caliente en `http://localhost:4200`:

   ```bash
   cd client
   npm install
   npm start
   ```

   O bien el host compilado en `http://localhost:5161`:

   ```bash
   npm run build:publish   # publica en Firmeza.Web/wwwroot
   dotnet run --project Firmeza.Web
   ```

La URL de la API esta en `client/src/app/Services/Api.Service.ts` (`API_URL`). Si la API se mueve de puerto, cambia ese valor y rebuild.

En produccion reemplaza `SeedAdmin:Password` y `Jwt:SigningKey` mediante variables de entorno o un gestor de secretos.

## Cliente Angular

Estructura en `client/src/app`:

```
Services/     Api.Service.ts (URL + toApiError), auth.service.ts, dashboard.service.ts,
              products.service.ts, customers.service.ts, sales.service.ts, imports.service.ts
Guards/       auth.guard.ts (AuthGuard y AdminGuard)
Interceptors/ auth.interceptor.ts (Bearer + refresh ante 401)
router/       app.routes.ts
Views/        Home, Auth, Layout, Dashboard, Products, Customers, Sales, Imports, Errors, Shared
```

Rutas: `/` landing publica, `/login`, `/register`, `/sin-acceso`, y dentro del panel (`/dashboard`, `/productos`, `/clientes`, `/ventas`, `/carga-masiva`) protegido por rol `Administrador`. El token y el refresh token viven en `localStorage`; el interceptor renueva la sesion ante un `401`.

## Migraciones EF Core

Las migraciones estan en `Firmeza.Infrastructure/Persistence/Migrations`. El manifiesto local `dotnet-tools.json` fija `dotnet-ef` en la version 10.0.12.

```bash
dotnet tool restore
dotnet tool run dotnet-ef migrations add NombreDeLaMigracion --project Firmeza.Infrastructure --startup-project Firmeza.Infrastructure
dotnet tool run dotnet-ef database update --project Firmeza.Infrastructure --startup-project Firmeza.Infrastructure
```

## Pruebas

```bash
dotnet test Firmeza.sln
```

## Docker completo

```bash
docker compose up --build
```

El compose levanta PostgreSQL, la API y el host web con el cliente Angular ya compilado. API en `http://localhost:8080`, Swagger en `http://localhost:8080/swagger`, panel en `http://localhost:8081` y PostgreSQL en `localhost:5433`. La API acepta CORS desde `http://localhost:8081` mediante `Cors__AllowedOrigins__0`.

Las imagenes publicadas en GHCR son `ghcr.io/esthercita-factory/nuz777-firmeza-api:latest` y `ghcr.io/esthercita-factory/nuz777-firmeza-web:latest`. Para usarlas sin reconstruirlas: `docker compose pull` y despues `docker compose up -d`.

## Documentacion tecnica

- `docs/capas-y-validaciones.md`: responsabilidades y flujo de validacion.
- `docs/diagrams.md`: modelo entidad-relacion.
