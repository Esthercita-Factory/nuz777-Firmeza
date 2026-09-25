# Firmeza

API REST para gestionar productos, clientes y ventas de un negocio de materiales de construccion.

## Arquitectura

La solucion usa arquitectura limpia con dependencias dirigidas hacia el dominio:

- `Firmeza.Domain`: entidades, enums y reglas puras de negocio.
- `Firmeza.Application`: casos de uso, DTOs, puertos y resultados.
- `Firmeza.Infrastructure`: PostgreSQL, EF Core, Identity, repositorios y JWT.
- `Firmeza.Api`: endpoints HTTP, autenticacion Bearer, Swagger y middleware.
- `Firmeza.Web`: panel Razor MVC legacy que comparte Domain e Infrastructure mientras se construye el cliente separado.
- `Firmeza.Tests`: pruebas unitarias de dominio y casos de uso.

La API no depende del proyecto MVC. El MVC se conserva temporalmente para no perder el cliente actual y usa el mismo contexto y las mismas migraciones.

## Endpoints principales

- `POST /api/auth/login`: obtiene access token y refresh token.
- `POST /api/auth/register`: registra un usuario con rol `Cliente`.
- `POST /api/auth/refresh`: rota un refresh token.
- `GET /api/auth/me`: perfil del usuario autenticado.
- `GET|POST /api/products` y `GET|PUT|DELETE /api/products/{id}`.
- `GET|POST /api/customers` y `GET|PUT|DELETE /api/customers/{id}`.
- `GET|POST /api/sales` y `GET /api/sales/{id}`.
- `GET /api/dashboard`.
- `GET /health`.

Los endpoints de negocio requieren `Authorization: Bearer <access-token>`. Swagger esta disponible en `/swagger` en desarrollo.

## Requisitos

- .NET SDK 10.
- PostgreSQL 16 o Docker Desktop.
- Node.js 22 y npm solo si se ejecuta el panel MVC legacy.

## Ejecucion local de la API

1. Inicia PostgreSQL con Docker Compose. El puerto publicado localmente es `5433`:

   ```bash
   docker compose up -d db
   ```

2. Restaura y compila:

   ```bash
   dotnet restore Firmeza.sln
   dotnet build Firmeza.sln
   ```

3. Ejecuta la API:

   ```bash
   dotnet run --project Firmeza.Api --launch-profile http
   ```

   Queda disponible en `http://localhost:5180` y Swagger en `http://localhost:5180/swagger`.

La API aplica las migraciones pendientes y crea los roles y el administrador inicial al arrancar. En produccion reemplaza `SeedAdmin:Password` y `Jwt:SigningKey` mediante variables de entorno o un gestor de secretos.

## Migraciones EF Core

Las migraciones estan en `Firmeza.Infrastructure/Persistence/Migrations`. El manifiesto local `dotnet-tools.json` fija `dotnet-ef` en la version 10.0.12.

```bash
dotnet tool restore
dotnet tool run dotnet-ef migrations add NombreDeLaMigracion --project Firmeza.Infrastructure --startup-project Firmeza.Infrastructure
dotnet tool run dotnet-ef database update --project Firmeza.Infrastructure --startup-project Firmeza.Infrastructure
dotnet tool run dotnet-ef migrations has-pending-model-changes --project Firmeza.Infrastructure --startup-project Firmeza.Infrastructure
```

La migracion `AddRefreshTokens` agrega el almacenamiento necesario para rotar y revocar refresh tokens.

## Pruebas

```bash
dotnet test Firmeza.sln
```

## Docker completo

```bash
docker compose up --build
```

La API queda disponible en `http://localhost:8080` y PostgreSQL en `localhost:5433`.

## Panel MVC legacy

El panel existente sigue disponible para transicion:

```bash
cd Firmeza.Web
npm install
npm run build
dotnet run --project Firmeza.Web --launch-profile http
```

El objetivo de la siguiente fase es sustituirlo por un cliente independiente que consuma la API.

## Documentacion tecnica

- `docs/capas-y-validaciones.md`: responsabilidades y flujo de validacion.
- `docs/diagrams.md`: modelo entidad-relacion.
