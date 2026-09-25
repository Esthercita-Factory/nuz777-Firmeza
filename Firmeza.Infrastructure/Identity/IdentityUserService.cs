using Firmeza.Application.Abstractions;
using Microsoft.AspNetCore.Identity;

namespace Firmeza.Infrastructure.Identity;

public sealed class IdentityUserService : IUserService
{
    private static readonly Lazy<string> DummyPasswordHash = new(() =>
        new PasswordHasher<ApplicationUser>().HashPassword(new ApplicationUser { Id = "dummy" }, Guid.NewGuid().ToString("N")));

    private readonly UserManager<ApplicationUser> _userManager;

    public IdentityUserService(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<UserAccount?> FindByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByEmailAsync(email);

        return user is null ? null : ToAccount(user);
    }

    public async Task<UserAccount?> FindByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(id);

        return user is null ? null : ToAccount(user);
    }

    public async Task<OperationResult<UserAccount>> RegisterAsync(UserRegistration registration, string role, CancellationToken cancellationToken = default)
    {
        var user = new ApplicationUser
        {
            UserName = registration.Email,
            Email = registration.Email,
            EmailConfirmed = true,
            FullName = registration.FullName
        };

        var created = await _userManager.CreateAsync(user, registration.Password);
        if (!created.Succeeded)
        {
            return OperationResult<UserAccount>.Failure(created.Errors.Select(error => error.Description).ToList());
        }

        var roleResult = await _userManager.AddToRoleAsync(user, role);
        if (!roleResult.Succeeded)
        {
            await _userManager.DeleteAsync(user);
            return OperationResult<UserAccount>.Failure(roleResult.Errors.Select(error => error.Description).ToList());
        }

        return OperationResult<UserAccount>.Success(ToAccount(user));
    }

    public async Task<SignInAttempt> SignInAsync(string email, string password, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user is null)
        {
            new PasswordHasher<ApplicationUser>().VerifyHashedPassword(new ApplicationUser { Id = "dummy" }, DummyPasswordHash.Value, password);
            return SignInAttempt.InvalidCredentials();
        }

        if (await _userManager.IsLockedOutAsync(user))
        {
            return SignInAttempt.LockedOut();
        }

        if (!await _userManager.CheckPasswordAsync(user, password))
        {
            await _userManager.AccessFailedAsync(user);
            return SignInAttempt.InvalidCredentials();
        }

        if (!await _userManager.IsEmailConfirmedAsync(user))
        {
            return SignInAttempt.NotAllowed();
        }

        await _userManager.ResetAccessFailedCountAsync(user);

        return SignInAttempt.Success(ToAccount(user));
    }

    public async Task<IReadOnlyList<string>> GetRolesAsync(string userId, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return [];
        }

        var roles = await _userManager.GetRolesAsync(user);

        return [.. roles];
    }

    private static UserAccount ToAccount(ApplicationUser user) => new(
        user.Id,
        user.Email ?? user.UserName ?? string.Empty,
        user.FullName,
        user.EmailConfirmed);
}
