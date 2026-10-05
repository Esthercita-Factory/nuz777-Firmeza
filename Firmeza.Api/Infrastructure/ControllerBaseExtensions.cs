using System.Security.Claims;
using Firmeza.Domain.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Firmeza.Api.Infrastructure;

/// <summary>
/// Helpers para decidir el alcance de una peticion segun el rol.
///
/// La API es la unica que restringe de verdad: el guard del frontend solo oculta
/// enlaces, pero con el token de un cliente un curl llega igual a los endpoints.
/// </summary>
public static class ControllerBaseExtensions
{
    public static bool IsAdministrator(this ControllerBase controller)
        => controller.User.IsInRole(ApplicationRoles.Administrator);

    public static bool IsCustomer(this ControllerBase controller)
        => controller.User.IsInRole(ApplicationRoles.Customer);

    public static string? UserId(this ControllerBase controller)
        => controller.User.FindFirstValue(ClaimTypes.NameIdentifier);

    /// <summary>
    /// Id del cliente asociado a la cuenta autenticada. Lo resuelve el servidor a
    /// partir del correo del token; nunca se toma de la peticion, asi que un
    /// cliente no puede pedir datos de otro.
    /// </summary>
    public static string? AuthenticatedEmail(this ControllerBase controller)
        => controller.User.FindFirstValue(ClaimTypes.Email)
            ?? controller.User.FindFirstValue("email");

    public static ObjectResult Forbidden(this ControllerBase controller, string message)
        => controller.StatusCode(StatusCodes.Status403Forbidden, new ProblemDetails
        {
            Title = "Acceso denegado",
            Detail = message,
            Status = StatusCodes.Status403Forbidden
        });

    public static ObjectResult NotFoundProblem(this ControllerBase controller, string detail)
        => controller.StatusCode(StatusCodes.Status404NotFound, new ProblemDetails
        {
            Title = "Recurso no encontrado",
            Detail = detail,
            Status = StatusCodes.Status404NotFound
        });
}