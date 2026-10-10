using Firmeza.Domain.Errors;
using Microsoft.AspNetCore.Mvc;

namespace Firmeza.Api.Middleware;

/// <summary>
/// Traduce las excepciones de dominio y de infraestructura a respuestas ProblemDetails.
/// </summary>
public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            _logger.LogInformation("Peticion cancelada por el cliente: {Path}", context.Request.Path);
        }
        catch (Exception exception)
        {
            await WriteAsync(context, exception);
        }
    }

    private async Task WriteAsync(HttpContext context, Exception exception)
    {
        if (context.Response.HasStarted)
        {
            _logger.LogError(exception, "Error despues de iniciar la respuesta.");
            throw exception;
        }

        var (status, title, detail) = exception switch
        {
            EntityNotFoundException => (StatusCodes.Status404NotFound, "Recurso no encontrado", exception.Message),
            DuplicateEntityException => (StatusCodes.Status409Conflict, "Conflicto con el estado actual", exception.Message),
            BusinessRuleViolationException => (StatusCodes.Status422UnprocessableEntity, "Regla de negocio", exception.Message),
            UnauthorizedAccessException => (StatusCodes.Status403Forbidden, "Acceso denegado", exception.Message),
            _ => (StatusCodes.Status500InternalServerError, "Error inesperado", "Ocurrio un error al procesar la solicitud.")
        };

        if (status >= StatusCodes.Status500InternalServerError)
        {
            _logger.LogError(exception, "Fallo no controlado en {Method} {Path}", context.Request.Method, context.Request.Path);
        }
        else
        {
            _logger.LogWarning(exception, "Error de dominio en {Method} {Path}", context.Request.Method, context.Request.Path);
        }

        context.Response.Clear();
        context.Response.StatusCode = status;
        context.Response.ContentType = "application/problem+json";

        await context.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = detail,
            Instance = context.Request.Path
        });
    }
}
