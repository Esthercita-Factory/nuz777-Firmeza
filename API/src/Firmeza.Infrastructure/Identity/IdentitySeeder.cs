using Firmeza.Domain.Entities;
using Firmeza.Domain.Identity;
using Firmeza.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Firmeza.Infrastructure.Identity;

public static class IdentitySeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var provider = scope.ServiceProvider;

        var configuration = provider.GetRequiredService<IConfiguration>();
        var roleManager = provider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = provider.GetRequiredService<UserManager<ApplicationUser>>();

        foreach (var role in new[] { ApplicationRoles.Administrator, ApplicationRoles.Customer })
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                var result = await roleManager.CreateAsync(new IdentityRole(role));
                EnsureSucceeded(result, $"No se pudo crear el rol {role}.");
            }
        }

        var email = configuration["SeedAdmin:Email"] ?? "admin@firmeza.local";
        var password = configuration["SeedAdmin:Password"] ?? "Admin123!";
        var admin = await userManager.FindByEmailAsync(email);

        if (admin is null)
        {
            admin = new ApplicationUser
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true,
                FullName = "Administrador Firmeza"
            };

            var result = await userManager.CreateAsync(admin, password);
            EnsureSucceeded(result, "No se pudo crear el administrador inicial.");
        }

        if (!await userManager.IsInRoleAsync(admin, ApplicationRoles.Administrator))
        {
            var result = await userManager.AddToRoleAsync(admin, ApplicationRoles.Administrator);
            EnsureSucceeded(result, "No se pudo asignar el rol de administrador.");
        }

        var db = provider.GetRequiredService<ApplicationDbContext>();
        if (!await db.Products.AnyAsync())
        {
            var now = DateTimeOffset.UtcNow;
            db.Products.AddRange(
                new Product
                {
                    Sku = "CEM-001",
                    Name = "Cemento Gris Argos 50kg Uso General",
                    Description = "Cemento portland para elaboración de morteros, concretos y pega de mampostería estructural.",
                    Category = "Cementos",
                    Unit = "Bulto",
                    Price = 34500,
                    Stock = 120,
                    IsActive = true,
                    CreatedAt = now
                },
                new Product
                {
                    Sku = "ACE-001",
                    Name = "Varilla Corrugada 1/2\" x 6m W60",
                    Description = "Acero estructural de alta resistencia para refuerzo de vigas, columnas y zapatas de cimentación.",
                    Category = "Aceros",
                    Unit = "Unidad",
                    Price = 28900,
                    Stock = 250,
                    IsActive = true,
                    CreatedAt = now
                },
                new Product
                {
                    Sku = "LAD-001",
                    Name = "Ladrillo Limpio Tolete 24x12x6 cm",
                    Description = "Ladrillo cerámico macizo de arcilla cocida para muros estructurales y divisorios a la vista.",
                    Category = "Mampostería",
                    Unit = "Unidad",
                    Price = 1450,
                    Stock = 1500,
                    IsActive = true,
                    CreatedAt = now
                },
                new Product
                {
                    Sku = "TUB-001",
                    Name = "Tubo PVC Sanitario 3\" x 6m Pavco",
                    Description = "Tubería de PVC para evacuación de aguas residuales y ventilación con unión mecánica.",
                    Category = "Tuberías",
                    Unit = "Tubo",
                    Price = 56000,
                    Stock = 80,
                    IsActive = true,
                    CreatedAt = now
                },
                new Product
                {
                    Sku = "ARE-001",
                    Name = "Arena de Peña Lavada x m³",
                    Description = "Árido fino libre de materia orgánica para mezcla de concretos, revoques y pañetes.",
                    Category = "Agregados",
                    Unit = "m³",
                    Price = 85000,
                    Stock = 40,
                    IsActive = true,
                    CreatedAt = now
                },
                new Product
                {
                    Sku = "HER-001",
                    Name = "Pala Redonda Herragro Cabo Madera",
                    Description = "Herramienta forjada en acero al carbono con cabo de madera seleccionada para excavación y mezcla.",
                    Category = "Herramientas",
                    Unit = "Unidad",
                    Price = 38500,
                    Stock = 65,
                    IsActive = true,
                    CreatedAt = now
                },
                new Product
                {
                    Sku = "PIN-001",
                    Name = "Pintura Vinilo Tipo 1 Blanco 5 Gal",
                    Description = "Pintura arquitectónica base agua de alto cubrimiento y lavabilidad para interiores y fachadas.",
                    Category = "Acabados",
                    Unit = "Cuñete",
                    Price = 165000,
                    Stock = 35,
                    IsActive = true,
                    CreatedAt = now
                },
                new Product
                {
                    Sku = "ELE-001",
                    Name = "Cable THHN/THWN-2 Calibre 12 AWG x 100m",
                    Description = "Conductor de cobre electrolítico con aislamiento termoplástico para instalaciones eléctricas seguras.",
                    Category = "Eléctricos",
                    Unit = "Rollo",
                    Price = 245000,
                    Stock = 50,
                    IsActive = true,
                    CreatedAt = now
                }
            );
            await db.SaveChangesAsync();
        }
    }

    private static void EnsureSucceeded(IdentityResult result, string message)
    {
        if (result.Succeeded)
        {
            return;
        }

        var errors = string.Join(", ", result.Errors.Select(error => error.Description));
        throw new InvalidOperationException($"{message} {errors}");
    }
}
