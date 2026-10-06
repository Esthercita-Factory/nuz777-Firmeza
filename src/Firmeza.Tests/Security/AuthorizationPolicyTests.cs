using System.Reflection;
using Firmeza.Domain.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;

namespace Firmeza.Tests.Security;

/// <summary>
/// Guardas de autorizacion por endpoint.
///
/// Estos tests no arrancan la API: inspeccionan los atributos declarados en los
/// controllers. Existen para que nadie pueda aflojar un [Authorize] o cambiar un
/// endpoint de Administrador a Cliente sin que el build se caiga.
///
/// El escenario que Motivation: un Cliente del portal publico podia llamar a
/// /api/imports y /api/customers porque esos controllers solo tenian [Authorize]
/// sin Roles, que en ASP.NET significa "cualquier usuario autenticado".
/// </summary>
public class AuthorizationPolicyTests
{
    private const string AdminRole = ApplicationRoles.Administrator;

    /// <summary>Endpoints que el Cliente NO puede tocar: son de administracion.</summary>
    private static readonly string[] AdminOnlyEndpoints =
    [
        "POST api/customers",
        "PUT api/customers/{id}",
        "DELETE api/customers/{id}",
        "GET api/customers",
        "GET api/dashboard",
        "GET api/imports/template",
        "POST api/imports/excel",
        "PUT api/products/{id}",
        "DELETE api/products/{id}",
        "POST api/products",
        "GET api/products/export/excel",
        "GET api/products/export/pdf",
        "POST api/customer-requests/{id}/approve",
        "POST api/customer-requests/{id}/reject",
        "GET api/customer-requests",
        "PUT api/sales/{id}",
        "DELETE api/sales/{id}",
        "GET api/sales/export/excel",
        "GET api/sales/export/pdf"
    ];

    /// <summary>Endpoints que el Cliente SI puede usar: comprar en linea.</summary>
    private static readonly string[] CustomerAllowedEndpoints =
    [
        "GET api/products",
        "GET api/products/{id}",
        "GET api/sales",
        "POST api/sales",
        "GET api/sales/{id}",
        "GET api/sales/{id}/receipt"
    ];

    public static TheoryData<string, string, string> AdminEndpoints => BuildTheory(AdminOnlyEndpoints);

    public static TheoryData<string, string, string> CustomerEndpoints => BuildTheory(CustomerAllowedEndpoints);

    private static TheoryData<string, string, string> BuildTheory(string[] endpoints)
    {
        var data = new TheoryData<string, string, string>();
        foreach (var endpoint in endpoints)
        {
            var parts = endpoint.Split(' ', 2);
            data.Add(parts[0], parts[1], endpoint);
        }

        return data;
    }

    private static IEnumerable<MethodInfo> GetActions()
        => typeof(Program).Assembly
            .GetTypes()
            .Where(type => type is { IsClass: true, IsAbstract: false } && typeof(ControllerBase).IsAssignableFrom(type))
            .SelectMany(controller => controller
                .GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
                .Where(method => method.GetCustomAttributes<HttpMethodAttribute>().Any()));

    /// <summary>
    /// Quita las constraints de ruta ({id:guid} -> {id}) para poder comparar
    /// contra nombres simples, y normaliza barras.
    /// </summary>
    private static string Normalize(string template)
        => System.Text.RegularExpressions.Regex.Replace(template, ":([a-zA-Z]+)", string.Empty)
            .Trim('/')
            .Replace("//", "/");

    /// <summary>
    /// Devuelve la accion que coincide con metodo + ruta, o falla si no existe.
    /// Asi el test no pasa en silencio cuando alguien renombra un endpoint.
    /// </summary>
    private static MethodInfo RequireAction(string httpMethod, string route)
        => GetActions().SingleOrDefault(action =>
        {
            // [HttpGet("x")] guarda la ruta en HttpMethodAttribute.Template, no en
            // RouteAttribute: leer RouteAttribute devolveria una plantilla vacia.
            var httpAttribute = action.GetCustomAttributes<HttpMethodAttribute>().FirstOrDefault(attr =>
                string.Equals(attr.HttpMethods.FirstOrDefault(), httpMethod, StringComparison.OrdinalIgnoreCase));

            if (httpAttribute is null)
            {
                return false;
            }

            var prefix = action.DeclaringType!
                .GetCustomAttributes<RouteAttribute>()
                .FirstOrDefault()?.Template ?? string.Empty;

            return Normalize($"{prefix}/{httpAttribute.Template}") == Normalize(route);
        }) ?? throw new InvalidOperationException(
            $"No se encontro el endpoint '{httpMethod} {route}'. Si se renombro, actualiza la lista de este test.");

    /// <summary>
    /// Rol efectivo de una accion: el atributo de la accion si existe y trae roles,
    /// si no el de la clase. Asi el test cubre tanto [Authorize(Roles=...)] por
    /// endpoint como el cerrado a nivel de controller.
    /// </summary>
    private static string? EffectiveRoles(MethodInfo action)
    {
        var onAction = action.GetCustomAttributes<AuthorizeAttribute>().FirstOrDefault(attr => attr.Roles is not null);
        if (onAction is not null)
        {
            return onAction.Roles;
        }

        return action.DeclaringType!
            .GetCustomAttributes<AuthorizeAttribute>()
            .FirstOrDefault(attr => attr.Roles is not null)
            ?.Roles;
    }

    [Theory]
    [MemberData(nameof(AdminEndpoints))]
    public void AdminEndpoints_RequireTheAdministratorRole(string httpMethod, string route, string endpoint)
    {
        var action = RequireAction(httpMethod, route);

        Assert.Equal(AdminRole, EffectiveRoles(action));
    }

    [Theory]
    [MemberData(nameof(CustomerEndpoints))]
    public void CustomerEndpoints_AreNotRestrictedToAdministrators(string httpMethod, string route, string endpoint)
    {
        // Puede haber [Authorize] a nivel de clase, pero nunca [Authorize(Roles = Administrador)]
        // sobre un endpoint que el Cliente necesita para comprar.
        var action = RequireAction(httpMethod, route);

        Assert.Null(EffectiveRoles(action));
    }

    [Fact]
    public void EveryBusinessEndpoint_RequiresAuthentication()
    {
        // Cualquier endpoint de negocio sin ningun [Authorize] (ni en la accion ni
        // en la clase) seria publico.
        var publicEndpoints = GetActions()
            .Where(action =>
            {
                var hasActionAuthorize = action.GetCustomAttributes<AuthorizeAttribute>().Any();
                var hasClassAuthorize = action.DeclaringType!.GetCustomAttributes<AuthorizeAttribute>().Any();
                var isAuthEndpoint = action.DeclaringType!.Name.Contains("Auth");

                return !hasActionAuthorize && !hasClassAuthorize && !isAuthEndpoint;
            })
            .Select(action => $"{action.DeclaringType!.Name}.{action.Name}")
            .ToList();

        Assert.Empty(publicEndpoints);
    }

    [Fact]
    public void CustomerAndRequestControllers_AreAdministratorOnlyAtClassLevel()
    {
        // Estos dos exponen datos de toda la empresa: la restriccion va en la clase,
        // asi ningun endpoint futuro los abre por descuido.
        foreach (var controllerName in new[] { "CustomersController", "CustomerRequestsController", "DashboardController", "ImportsController" })
        {
            var controller = typeof(Program).Assembly.GetTypes().Single(type => type.Name == controllerName);
            var authorize = controller.GetCustomAttributes<AuthorizeAttribute>().Single();

            Assert.Equal(AdminRole, authorize.Roles);
        }
    }
}