using Firmeza.Application.Abstractions;
using Firmeza.Application.Common;
using Firmeza.Application.Dtos.Auth;
using Firmeza.Domain.Identity;

namespace Firmeza.Application.Services.Auth;

public sealed class AuthService : IAuthService
{
    private readonly IUserService _users;
    private readonly ITokenService _tokens;
    private readonly IRefreshTokenRepository _refreshTokens;
    private readonly ICurrentUserService _currentUser;
    private readonly IClock _clock;
    private readonly IUnitOfWork _unitOfWork;

    public AuthService(
        IUserService users,
        ITokenService tokens,
        IRefreshTokenRepository refreshTokens,
        ICurrentUserService currentUser,
        IClock clock,
        IUnitOfWork unitOfWork)
    {
        _users = users;
        _tokens = tokens;
        _refreshTokens = refreshTokens;
        _currentUser = currentUser;
        _clock = clock;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<TokenResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _users.SignInAsync(request.Email.Trim(), request.Password, cancellationToken);

        switch (result.Outcome)
        {
            case SignInOutcome.LockedOut:
                return Result.Failure<TokenResponse>(Error.Unauthorized("La cuenta esta bloqueada por intentos de acceso fallidos."));
            case SignInOutcome.NotAllowed:
                return Result.Failure<TokenResponse>(Error.Forbidden("El correo no esta confirmado."));
            case SignInOutcome.InvalidCredentials:
                return Result.Failure<TokenResponse>(Error.Unauthorized("Correo o contrasena incorrectos."));
        }

        var user = result.User!;
        var roles = await _users.GetRolesAsync(user.Id, cancellationToken);

        return await IssueTokensAsync(user, roles, cancellationToken);
    }

    public async Task<Result<UserResponse>> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        if (!string.Equals(request.Password, request.ConfirmPassword, StringComparison.Ordinal))
        {
            return Result.Failure<UserResponse>(
                Error.Validation(new Dictionary<string, string[]> { [nameof(request.ConfirmPassword)] = ["Las contrasenas no coinciden."] }));
        }

        var registration = new UserRegistration(
            request.Email.Trim().ToLowerInvariant(),
            request.FullName.Trim(),
            request.Password);

        var created = await _users.RegisterAsync(registration, ApplicationRoles.Customer, cancellationToken);
        if (!created.Succeeded || created.Value is null)
        {
            return Result.Failure<UserResponse>(Error.Validation(MapIdentityErrors(created.Errors)));
        }

        return Result.Success(new UserResponse(
            created.Value.Id,
            created.Value.Email,
            created.Value.FullName,
            [ApplicationRoles.Customer]));
    }

    public async Task<Result<TokenResponse>> RefreshAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        var currentHash = _tokens.HashRefreshToken(request.RefreshToken);
        var stored = await _refreshTokens.FindActiveByHashAsync(currentHash, cancellationToken);
        if (stored is null)
        {
            return Result.Failure<TokenResponse>(Error.Unauthorized("El refresh token es invalido o expiro."));
        }

        var user = await _users.FindByIdAsync(stored.UserId, cancellationToken);
        if (user is null)
        {
            await _refreshTokens.RevokeAsync(currentHash, _clock.UtcNow, null, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return Result.Failure<TokenResponse>(Error.Unauthorized("El refresh token es invalido o expiro."));
        }

        var roles = await _users.GetRolesAsync(user.Id, cancellationToken);
        var response = await IssueTokensAsync(user, roles, cancellationToken);
        if (response.IsFailure)
        {
            return response;
        }

        var now = _clock.UtcNow;
        var rotatedHash = _tokens.HashRefreshToken(response.Value!.RefreshToken);

        await _refreshTokens.RevokeAsync(currentHash, now, rotatedHash, cancellationToken);
        await _refreshTokens.StoreAsync(
            new RefreshTokenData(
                Guid.NewGuid().ToString("N"),
                user.Id,
                rotatedHash,
                response.Value.RefreshTokenExpiresAt,
                now,
                null,
                null),
            cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return response;
    }

    public async Task<Result<UserResponse>> GetProfileAsync(CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId;
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Result.Failure<UserResponse>(Error.Unauthorized("No hay una sesion activa."));
        }

        var user = await _users.FindByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            return Result.Failure<UserResponse>(Error.EntityNotFound("Usuario", userId));
        }

        var roles = await _users.GetRolesAsync(user.Id, cancellationToken);

        return Result.Success(new UserResponse(user.Id, user.Email, user.FullName, roles));
    }

    private async Task<Result<TokenResponse>> IssueTokensAsync(
        UserAccount user,
        IReadOnlyList<string> roles,
        CancellationToken cancellationToken)
    {
        var pair = _tokens.CreateTokenPair(user, roles);
        var now = _clock.UtcNow;

        await _refreshTokens.StoreAsync(
            new RefreshTokenData(
                Guid.NewGuid().ToString("N"),
                user.Id,
                _tokens.HashRefreshToken(pair.RefreshToken),
                pair.RefreshTokenExpiresAt,
                now,
                null,
                null),
            cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(new TokenResponse(
            "Bearer",
            pair.AccessToken,
            pair.AccessTokenExpiresAt,
            pair.RefreshToken,
            pair.RefreshTokenExpiresAt,
            new UserResponse(user.Id, user.Email, user.FullName, roles)));
    }

    private static Dictionary<string, string[]> MapIdentityErrors(IReadOnlyList<string> errors)
    {
        var failures = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);

        foreach (var error in errors)
        {
            failures[string.Empty] = failures.TryGetValue(string.Empty, out var existing)
                ? [.. existing, error]
                : [error];
        }

        return failures;
    }
}
