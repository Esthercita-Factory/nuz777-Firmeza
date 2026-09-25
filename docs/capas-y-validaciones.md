# Firmeza: capas y validaciones

```text
Cliente HTTP -> API -> Application -> Domain
                         |
                         v
                    Infrastructure -> PostgreSQL
```

## Capas

1. **API**: controllers, autenticacion JWT, Swagger, CORS, validacion HTTP y ProblemDetails.
2. **Application**: casos de uso, DTOs, paginacion, puertos de repositorio y `Result`.
3. **Domain**: entidades, enums, errores de dominio y reglas puras como `InventoryCalculator`.
4. **Infrastructure**: EF Core, PostgreSQL, Identity, repositorios, transacciones y servicio JWT.

El proyecto `Firmeza.Web` es un cliente MVC legacy temporal. No forma parte del flujo de la API y reutiliza las capas Domain e Infrastructure para compartir el esquema.

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
| Totales y redondeo | `InventoryCalculator` en Domain |
| Descuento concurrente de stock | Transaccion + `SELECT ... FOR UPDATE` |
| Contraseña y lockout | ASP.NET Core Identity |
| Access tokens | JWT Bearer |
| Refresh tokens | Hash SHA-256, rotacion y revocacion en `refresh_tokens` |
| Errores esperados | `Result` convertido a ProblemDetails |
| Excepciones no esperadas | `ExceptionHandlingMiddleware` |
