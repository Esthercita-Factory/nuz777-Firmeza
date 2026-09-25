using Firmeza.Application.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Firmeza.Api.Infrastructure;

/// <summary>
/// Convierte los <see cref="Result"/> de Application en respuestas HTTP con ProblemDetails,
/// para que los controladores no repitan el mapeo de errores.
/// </summary>
public sealed class ResultToHttpFilter : IAsyncResultFilter
{
    public async Task OnResultExecutionAsync(ResultExecutingContext context, ResultExecutionDelegate next)
    {
        if (context.Result is not ObjectResult { Value: Result result } objectResult)
        {
            await next();
            return;
        }

        if (result.IsSuccess)
        {
            if (result is IValueResult valueResult)
            {
                objectResult.Value = valueResult.Value;
            }

            await next();
            return;
        }

        context.Result = BuildErrorResult(result.Error!, context.HttpContext);
        await next();
    }

    internal static ObjectResult BuildErrorResult(Error error, HttpContext httpContext)
    {
        var problem = new ProblemDetails
        {
            Status = StatusCodeFor(error.Code),
            Title = TitleFor(error.Code),
            Detail = error.Message,
            Instance = httpContext.Request.Path
        };

        if (error.Failures is not null)
        {
            problem.Extensions["errors"] = error.Failures;
        }

        return new ObjectResult(problem) { StatusCode = problem.Status!.Value };
    }

    private static int StatusCodeFor(ErrorCode code) => code switch
    {
        ErrorCode.Validation => StatusCodes.Status400BadRequest,
        ErrorCode.Unauthorized => StatusCodes.Status401Unauthorized,
        ErrorCode.Forbidden => StatusCodes.Status403Forbidden,
        ErrorCode.NotFound => StatusCodes.Status404NotFound,
        ErrorCode.Conflict => StatusCodes.Status409Conflict,
        ErrorCode.BusinessRule => StatusCodes.Status422UnprocessableEntity,
        _ => StatusCodes.Status500InternalServerError
    };

    private static string TitleFor(ErrorCode code) => code switch
    {
        ErrorCode.Validation => "Solicitud invalida",
        ErrorCode.Unauthorized => "No autenticado",
        ErrorCode.Forbidden => "Acceso denegado",
        ErrorCode.NotFound => "Recurso no encontrado",
        ErrorCode.Conflict => "Conflicto con el estado actual",
        ErrorCode.BusinessRule => "Regla de negocio",
        _ => "Error inesperado"
    };
}
