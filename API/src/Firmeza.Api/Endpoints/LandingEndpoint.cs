using System.Net.Mime;
using System.Text;
using System.Text.Encodings.Web;

namespace Firmeza.Api.Endpoints;

public static class LandingEndpoint
{
    private const string Name = "Firmeza API";
    private const string Version = "v1";

    private static readonly string[] ApiEndpoints =
    [
        "POST /api/auth/login",
        "POST /api/auth/register",
        "POST /api/auth/refresh",
        "GET /api/auth/me",
        "GET|POST /api/products",
        "GET|PUT|DELETE /api/products/{id}",
        "GET|POST /api/customers",
        "GET|PUT|DELETE /api/customers/{id}",
        "GET|POST /api/sales",
        "GET /api/sales/{id}",
        "GET /api/dashboard"
    ];

    public static IEndpointRouteBuilder MapApiLandingPage(this IEndpointRouteBuilder endpoints, bool swaggerEnabled)
    {
        endpoints.MapGet("/", (HttpContext context) =>
            WantsHtml(context.Request)
                ? Results.Content(BuildHtml(swaggerEnabled), "text/html; charset=utf-8")
                : Results.Ok(new
                {
                    name = Name,
                    version = Version,
                    documentation = swaggerEnabled ? "/swagger" : null,
                    health = "/health",
                    endpoints = swaggerEnabled ? ApiEndpoints.Append("GET /swagger").ToArray() : ApiEndpoints
                }));

        endpoints.MapMethods("/", ["HEAD"], () => Results.Ok());

        return endpoints;
    }

    private static bool WantsHtml(HttpRequest request)
    {
        var accept = request.Headers.Accept.ToString();

        return accept.Contains(MediaTypeNames.Text.Html, StringComparison.OrdinalIgnoreCase);
    }

    private static string BuildHtml(bool swaggerEnabled)
    {
        var links = new StringBuilder();

        if (swaggerEnabled)
        {
            links.Append(Link("/swagger", "Swagger UI"));
        }

        links.Append(Link("/health", "Health check"));

        var list = new StringBuilder();
        foreach (var endpoint in ApiEndpoints)
        {
            list.Append("<li><code>").Append(HtmlEncoder.Default.Encode(endpoint)).Append("</code></li>");
        }

        return $$"""
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>{{Name}}</title>
              <style>
                :root { color-scheme: light dark; }
                body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; margin: 0; padding: 2.5rem 1.5rem; line-height: 1.5; }
                main { max-width: 46rem; margin: 0 auto; }
                h1 { margin: 0 0 .25rem; font-size: 1.6rem; }
                p { margin: 0 0 1.5rem; opacity: .75; }
                nav { display: flex; flex-wrap: wrap; gap: .75rem; margin-bottom: 2rem; }
                a.button { display: inline-block; padding: .55rem 1.1rem; border: 1px solid currentColor; border-radius: .5rem; text-decoration: none; }
                ul { padding-left: 1.25rem; }
                li { margin: .2rem 0; }
                code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .9rem; }
                footer { margin-top: 2.5rem; font-size: .85rem; opacity: .6; }
              </style>
            </head>
            <body>
              <main>
                <h1>{{Name}} <small>{{Version}}</small></h1>
                <p>API REST para productos, clientes y ventas. Usa <code>Authorization: Bearer &lt;access-token&gt;</code> en los endpoints de negocio.</p>
                <nav>{{links}}</nav>
                <h2>Endpoints</h2>
                <ul>{{list}}</ul>
                <footer>Firmeza &middot; <a href="/health">/health</a></footer>
              </main>
            </body>
            </html>
            """;
    }

    private static string Link(string href, string label) => $"<a class=\"button\" href=\"{href}\">{label}</a>";
}
