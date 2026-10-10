# Firmeza ERP & Portal Web

Sistema integral de gestión comercial, inventario, facturación y tienda virtual para materiales de construcción y acabados.

---

## Arquitectura

La solución está construida bajo los principios de **Arquitectura Limpia** con flujo unidireccional de dependencias hacia el núcleo de dominio:

- **`API/src/Firmeza.Domain`**: Entidades, enumeraciones, excepciones de dominio y reglas puras de cálculo (como `InventoryCalculator.SplitTaxInclusive`).
- **`API/src/Firmeza.Application`**: Casos de uso, DTOs, validaciones, abstracciones de repositorio (`ISaleRepository`, `IProductRepository`, etc.) y contratos de infraestructura (`IMailService`).
- **`API/src/Firmeza.Infrastructure`**: Persistencia con PostgreSQL y EF Core, ASP.NET Core Identity, JWT Tokens, generación de documentos QuestPDF y despacho SMTP de correo.
- **`API/src/Firmeza.Api`**: API REST en .NET 10, autenticación Bearer, autorización basada en roles (`Administrador` / `Cliente`), políticas CORS, Swagger y endpoints de salud.
- **`client`**: Aplicación SPA en Angular (Standalone components, Signals, Tailwind CSS) que consume la API directamente.
- **`API/src/Firmeza.Web`**: Servidor host de distribución de la SPA estática compilada con fallback HTML5.
- **`API/src/Firmeza.Tests`**: Pruebas unitarias y de integración para dominio, servicios y seguridad.

---

## Matriz de Endpoints por Rol

### 1. Endpoints Públicos / Anónimos
No requieren cabecera `Authorization`.

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/auth/login` | Autenticación con email y contraseña. Retorna JWT y Refresh Token. |
| `POST` | `/api/auth/register` | Registro público de clientes. Crea solicitud de acceso. |
| `POST` | `/api/auth/refresh` | Renovación de access token usando refresh token. |
| `GET` | `/health` | Verificación de estado de salud del servicio. |
| `GET` | `/api/products` *(público)* | Catálogo de materiales disponibles para la tienda virtual. |

### 2. Endpoints para Rol Cliente (`Cliente`)
Requieren `Authorization: Bearer <token>` con rol `Cliente`.

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/auth/me` | Obtiene el perfil y datos del usuario autenticado. |
| `POST` | `/api/sales` | Crea un pedido/compra desde el carrito con cálculo de IVA y comprobante. |
| `GET` | `/api/sales` | Historial de pedidos realizados por el cliente autenticado. |
| `GET` | `/api/sales/{id}` | Detalle de un pedido específico del cliente. |
| `GET` | `/api/sales/{id}/receipt` | Descarga directa del comprobante oficial de venta en PDF. |

### 3. Endpoints para Rol Administrador (`Administrador`)
Requieren `Authorization: Bearer <token>` con rol `Administrador`.

| Módulo | Métodos y Rutas | Descripción |
|---|---|---|
| **Dashboard** | `GET /api/dashboard` | Indicadores KPIs, distribución de pedidos y tendencia de ventas. |
| **Productos** | `POST /api/products`<br>`PUT /api/products/{id}`<br>`DELETE /api/products/{id}`<br>`GET /api/products/export/excel`<br>`GET /api/products/export/pdf` | Gestión completa de inventario, stock, precios y exportaciones oficiales. |
| **Clientes** | `GET /api/customers`<br>`POST /api/customers`<br>`GET\|PUT\|DELETE /api/customers/{id}`<br>`GET /api/customers/export/excel`<br>`GET /api/customers/export/pdf` | Gestión del directorio de clientes comerciales y reportes. |
| **Solicitudes** | `GET /api/customer-requests`<br>`POST /api/customer-requests/{id}/review` | Revisión, aprobación o rechazo de solicitudes de registro de clientes. |
| **Ventas / ERP** | `GET /api/sales`<br>`GET /api/sales/{id}`<br>`PUT /api/sales/{id}/decision`<br>`DELETE /api/sales/{id}`<br>`GET /api/sales/export/excel`<br>`GET /api/sales/export/pdf` | Control global de operaciones, aprobación/entrega con notas, cancelación y auditoría. |
| **Carga Masiva**| `POST /api/imports/excel`<br>`GET /api/imports/template` | Importación masiva de catálogo vía Excel XLSX con validación estricta fila a fila. |

---

## Requisitos de Entorno

- **.NET SDK 10**.
- **Node.js 20+** y **npm** (para cliente Angular).
- **PostgreSQL 16** (o Docker).
- **Docker** y **Docker Compose** (recomendado para despliegues).

---

## Ejecución Local (Desarrollo)

1. **Base de Datos PostgreSQL (puerto `5433` local)**:
   ```bash
   docker compose up -d db
   ```

2. **Compilar solución**:
   ```bash
   dotnet restore Firmeza.sln
   dotnet build Firmeza.sln
   ```

3. **Iniciar API Backend (`http://localhost:5180`)**:
   ```bash
   dotnet run --project API/src/Firmeza.Api --launch-profile http
   ```
   > Swagger UI estará disponible en `http://localhost:5180/swagger`.

4. **Iniciar Cliente Angular (`http://localhost:4200`)**:
   ```bash
   cd client
   npm install
   npm start
   ```

---

## Ejecución de Pruebas

### Pruebas Unitarias y de Integración Backend (.NET)
Ejecuta los 144 tests automatizados de dominio, casos de uso, exports, cálculos de IVA y seguridad:
```bash
dotnet test Firmeza.sln
```

### Pruebas Frontend (Angular / Vitest)
Ejecuta las pruebas de componentes, guards, interceptores y servicios:
```bash
cd client
npm test -- --watch=false
```

---

## Despliegue con Docker

El proyecto incluye configuración lista para producción en [`docker-compose.yml`](docker-compose.yml) y variables de ejemplo en [`.env.example`](.env.example):

```bash
# 1. Copiar y ajustar variables de entorno
cp .env.example .env

# 2. Levantar la pila completa (Base de datos, API y Servidor Web SPA)
docker compose up -d --build
```

- **Portal Web / ERP**: `http://localhost:8081`
- **API Backend**: `http://localhost:8080`
- **Documentación Swagger**: `http://localhost:8080/swagger`
- **Base de Datos**: `localhost:5433`

---

## Documentación Técnica Adicional

- [**Flujo de Compra y Ciclo de Venta**](docs/flujo-compra-cliente.md): Explicación detallada del recorrido del cliente, transaccionalidad y emisión de comprobantes.
- [**Configuración SMTP y Envío de Correo**](docs/configuracion-smtp.md): Guía para configurar Gmail, Outlook, SendGrid y servidores personalizados.
- [**Capas y Validaciones**](docs/capas-y-validaciones.md): Responsabilidades arquitectónicas y manejo de errores.
- [**Diagramas y Modelo de Datos**](docs/diagrams.md): Diagrama Entidad-Relación y estructuras relacionales.
