using System.Security.Claims;
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

        return user is null ? null : await ToAccountAsync(user);
    }

    public async Task<UserAccount?> FindByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(id);

        return user is null ? null : await ToAccountAsync(user);
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

        return OperationResult<UserAccount>.Success(await ToAccountAsync(user));
    }

    public async Task<OperationResult<(UserAccount User, bool IsNewUser)>> FindOrCreateExternalUserAsync(
        ExternalUserRegistration registration,
        string defaultRole,
        bool allowCreate = true,
        CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByLoginAsync(registration.Provider, registration.ProviderKey);
        if (user is not null)
        {
            await SyncAvatarClaimAsync(user, registration.AvatarUrl);
            return OperationResult<(UserAccount, bool)>.Success((await ToAccountAsync(user), false));
        }

        user = await _userManager.FindByEmailAsync(registration.Email);
        var isNewUser = false;

        if (user is null)
        {
            if (!allowCreate)
            {
                return OperationResult<(UserAccount, bool)>.Failure(
                    ["La cuenta de este usuario fue eliminada o no se encuentra registrada en el sistema."]);
            }

            user = new ApplicationUser
            {
                UserName = registration.Email,
                Email = registration.Email,
                EmailConfirmed = true,
                FullName = string.IsNullOrWhiteSpace(registration.FullName) ? registration.Email : registration.FullName
            };

            var createResult = await _userManager.CreateAsync(user);
            if (!createResult.Succeeded)
            {
                return OperationResult<(UserAccount, bool)>.Failure(
                    createResult.Errors.Select(error => error.Description).ToList());
            }

            var roleResult = await _userManager.AddToRoleAsync(user, defaultRole);
            if (!roleResult.Succeeded)
            {
                await _userManager.DeleteAsync(user);
                return OperationResult<(UserAccount, bool)>.Failure(
                    roleResult.Errors.Select(error => error.Description).ToList());
            }

            isNewUser = true;
        }

        var loginInfo = new UserLoginInfo(registration.Provider, registration.ProviderKey, registration.Provider);
        var addLoginResult = await _userManager.AddLoginAsync(user, loginInfo);
        if (!addLoginResult.Succeeded)
        {
            if (isNewUser)
            {
                await _userManager.DeleteAsync(user);
            }

            return OperationResult<(UserAccount, bool)>.Failure(
                addLoginResult.Errors.Select(error => error.Description).ToList());
        }

        await SyncAvatarClaimAsync(user, registration.AvatarUrl);

        return OperationResult<(UserAccount, bool)>.Success((await ToAccountAsync(user), isNewUser));
    }

    public async Task DeleteAsync(string userId, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return;
        }

        await _userManager.DeleteAsync(user);
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

        return SignInAttempt.Success(await ToAccountAsync(user));
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

    private async Task SyncAvatarClaimAsync(ApplicationUser user, string? avatarUrl)
    {
        if (string.IsNullOrWhiteSpace(avatarUrl))
        {
            return;
        }

        var claims = await _userManager.GetClaimsAsync(user);
        var existingAvatar = claims.FirstOrDefault(c => c.Type == "picture" || c.Type == "avatar_url");
        if (existingAvatar is null)
        {
            await _userManager.AddClaimAsync(user, new Claim("picture", avatarUrl));
        }
        else if (existingAvatar.Value != avatarUrl)
        {
            await _userManager.ReplaceClaimAsync(user, existingAvatar, new Claim("picture", avatarUrl));
        }
    }

    private async Task<UserAccount> ToAccountAsync(ApplicationUser user)
    {
        var claims = await _userManager.GetClaimsAsync(user);
        var avatarUrl = claims.FirstOrDefault(c => c.Type == "picture" || c.Type == "avatar_url")?.Value;

        return new(
            user.Id,
            user.Email ?? user.UserName ?? string.Empty,
            user.FullName,
            user.EmailConfirmed,
            avatarUrl);
    }
}
