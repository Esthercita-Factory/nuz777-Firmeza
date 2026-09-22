# Firmeza

Panel administrativo Razor MVC para gestionar productos, clientes y ventas de un negocio de materiales de construccion.

## Stack

- ASP.NET Core MVC sobre .NET 10.
- PostgreSQL con Entity Framework Core y Npgsql.
- ASP.NET Core Identity con roles `Administrador` y `Cliente`.
- Tailwind CSS 4 procesado por Vite.
- EPPlus y QuestPDF instalados para futuras exportaciones.
- xUnit para pruebas unitarias.

## Funcionalidades

- Dashboard con metricas de productos, clientes y ventas.
- CRUD de productos con busqueda, filtro de activos y validacion de SKU.
- CRUD de clientes con busqueda, validacion de documento, correo, telefono y edad.
- Consulta de ventas y detalle de lineas.
- Registro de clientes y login administrativo.
- Acceso a las rutas del panel restringido al rol `Administrador`.
- Migracion automatica al iniciar la aplicacion mediante `Database.MigrateAsync()`.

## Requisitos

- .NET SDK 10.
- Node.js 22 o superior y npm.
- PostgreSQL 16 o Docker Desktop.

## Instalacion local

1. Clona el repositorio:

   ```bash
   git clone https://github.com/Esthercita-Factory/nuz777-Firmeza.git
   cd nuz777-Firmeza
   ```

2. Inicia PostgreSQL con Docker Compose. El puerto publicado en la maquina local es `5433`:

   ```bash
   docker compose up -d db
   ```

3. Restaura las dependencias .NET:

   ```bash
   dotnet restore Firmeza.sln
   ```

4. Instala las dependencias frontend y genera los assets de Tailwind:

   ```bash
   cd Firmeza.Web
   npm install
   npm run build
   cd ..
   ```

5. Ejecuta la aplicacion:

   ```bash
   dotnet run --project Firmeza.Web
   ```

La aplicacion aplica las migraciones pendientes y crea los roles y el administrador inicial al arrancar. Los valores de `SeedAdmin:Email` y `SeedAdmin:Password` estan en `appsettings.json` para desarrollo; deben reemplazarse por variables de entorno en produccion.

## Migraciones EF Core

Toda la estructura de la base de datos, incluidas las tablas de Identity, se encuentra en `Firmeza.Web/Data/Migrations`. No se usa un script SQL manual.

```bash
dotnet ef migrations add NombreDeLaMigracion --project Firmeza.Web
dotnet ef database update --project Firmeza.Web
```

Si `dotnet ef` no esta disponible globalmente:

```bash
dotnet tool install --global dotnet-ef --version 10.0.12
```

## Frontend

```bash
cd Firmeza.Web
npm install
npm run build
# Desarrollo con compilacion automatica:
npm run dev
```

Tailwind 4 se configura mediante `@tailwindcss/vite` y `Assets/styles/app.css`. No se usan `tailwind.config.js` ni `postcss.config.js`.

## Pruebas

```bash
dotnet test Firmeza.sln
```

## Docker completo

```bash
docker compose up --build
```

## Ejecucion local

```bash
docker compose up -d db
dotnet run --project Firmeza.Web --launch-profile http
```

La aplicacion queda disponible en `http://localhost:5161` y PostgreSQL en el puerto local `5433`.

Para ejecutar aplicacion y base de datos dentro de Docker:

```bash
docker compose up --build
```

En ese caso, la aplicacion queda disponible en `http://localhost:8080`.

## Documentacion tecnica

Los diagramas entidad-relacion y de clases estan en `docs/diagrams.md`.
