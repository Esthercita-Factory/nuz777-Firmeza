# Firmeza: capas y validaciones

```text
Cliente Angular -> API (CORS) -> Application -> Domain
                                      |
                                      v
                                 Infrastructure -> PostgreSQL

Firmeza.Web -> sirve wwwroot (SPA) + fallback del router
```

## Capas

1. **Cliente Angular** (`client/`): standalone components, signals y formularios con `ngModel`. Guarda access y refresh token en `localStorage` y renueva la sesion desde el interceptor.
2. **Host web** (`Firmeza.Web`): publica la SPA compilada en `wwwroot`. No accede a la base de datos.
3. **API**: controllers, autenticacion JWT, Swagger, CORS, validacion HTTP y ProblemDetails. Es la unica que aplica migraciones.
4. **Application**: casos de uso, DTOs, paginacion, puertos de repositorio y `Result`.
5. **Domain**: entidades, enums, errores de dominio y reglas puras como `InventoryCalculator`.
6. **Infrastructure**: EF Core, PostgreSQL, Identity, repositorios, transacciones y servicio JWT.

## Flujo de una solicitud

```text
JSON HTTP
  -> ApiController y DataAnnotations
  -> Application Service
  -> Repository / UnitOfWork
  -> PostgreSQL
  -> DTO de respuesta o ProblemDetails
```

## Validaciones

| Regla | Ubicacion |
|---|---|
| Campos requeridos, rangos y formato | DTOs de Application mediante DataAnnotations |
| SKU, documento y correo unicos | Application + indices unicos de PostgreSQL |
| Stock disponible y cliente/producto activo | `SaleService` |
| Venta entregada no se puede borrar (409) | `SaleService.DeleteAsync` |
| Stock devuelto al borrar una venta | `SaleService.DeleteAsync` en transaccion con `SELECT ... FOR UPDATE` |
| Totales y redondeo | `InventoryCalculator` en Domain |
| Descuento concurrente de stock | Transaccion + `SELECT ... FOR UPDATE` |
| Contraseña y lockout | ASP.NET Core Identity |
| Access tokens | JWT Bearer |
| Refresh tokens | Hash SHA-256, rotacion y revocacion en `refresh_tokens` |
| Errores esperados | `Result` convertido a ProblemDetails |
| Excepciones no esperadas | `ExceptionHandlingMiddleware` |
| Errores de formulario | `toApiError` muestra `ProblemDetails.errors` por campo |
| Sesion expirada | Interceptor de Angular: renueva con refresh token y reintenta una vez |
| Origen del cliente | Politica CORS de la API (`Cors:AllowedOrigins`) |
