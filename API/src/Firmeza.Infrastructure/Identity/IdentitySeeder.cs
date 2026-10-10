using Firmeza.Domain.Identity;
using Microsoft.AspNetCore.Identity;
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
