// Host del cliente Angular (client/). Sirve los estaticos de wwwroot con fallback de la SPA.
// El navegador llama directo a Firmeza.Api, que expone CORS para este origen.
var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/error");
    app.UseHsts();
}

if (app.Configuration.GetValue("Https:Enabled", true))
{
    app.UseHttpsRedirection();
}

app.UseDefaultFiles();
app.UseStaticFiles();

// Rutas del cliente Angular (/, /login, /dashboard, ...) resueltas por el router.
app.MapFallbackToFile("index.html");

app.Run();
