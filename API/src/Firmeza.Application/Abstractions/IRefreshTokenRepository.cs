namespace Firmeza.Application.Abstractions;

public sealed record RefreshTokenData(
    string Id,
    string UserId,
    string TokenHash,
    DateTimeOffset ExpiresAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset? RevokedAt,
    string? ReplacedByTokenHash)
{
    public bool IsActive(DateTimeOffset now) => RevokedAt is null && ExpiresAt > now;
}

public interface IRefreshTokenRepository
{
    Task StoreAsync(RefreshTokenData token, CancellationToken cancellationToken = default);

    Task<RefreshTokenData?> FindActiveByHashAsync(string tokenHash, CancellationToken cancellationToken = default);

    Task RevokeAsync(string tokenHash, DateTimeOffset revokedAt, string? replacedByTokenHash, CancellationToken cancellationToken = default);

    Task RevokeAllForUserAsync(string userId, DateTimeOffset revokedAt, CancellationToken cancellationToken = default);
}
