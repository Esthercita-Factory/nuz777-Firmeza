using Firmeza.Application.Abstractions;
using Firmeza.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Firmeza.Infrastructure.Repositories;

public sealed class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly ApplicationDbContext _db;
    private readonly IClock _clock;

    public RefreshTokenRepository(ApplicationDbContext db, IClock clock)
    {
        _db = db;
        _clock = clock;
    }

    public async Task StoreAsync(RefreshTokenData token, CancellationToken cancellationToken = default)
    {
        await _db.RefreshTokens.AddAsync(
            new RefreshToken
            {
                Id = token.Id,
                UserId = token.UserId,
                TokenHash = token.TokenHash,
                ExpiresAt = token.ExpiresAt,
                CreatedAt = token.CreatedAt,
                RevokedAt = token.RevokedAt,
                ReplacedByTokenHash = token.ReplacedByTokenHash
            },
            cancellationToken);
    }

    public async Task<RefreshTokenData?> FindActiveByHashAsync(string tokenHash, CancellationToken cancellationToken = default)
    {
        var now = _clock.UtcNow;
        var token = await _db.RefreshTokens
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.TokenHash == tokenHash && item.RevokedAt == null && item.ExpiresAt > now, cancellationToken);

        return token is null ? null : ToData(token);
    }

    public async Task RevokeAsync(string tokenHash, DateTimeOffset revokedAt, string? replacedByTokenHash, CancellationToken cancellationToken = default)
    {
        var token = await _db.RefreshTokens.FirstOrDefaultAsync(item => item.TokenHash == tokenHash, cancellationToken);
        if (token is null)
        {
            return;
        }

        token.RevokedAt = revokedAt;
        token.ReplacedByTokenHash = replacedByTokenHash;
    }

    public async Task RevokeAllForUserAsync(string userId, DateTimeOffset revokedAt, CancellationToken cancellationToken = default)
    {
        var tokens = await _db.RefreshTokens
            .Where(token => token.UserId == userId && token.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var token in tokens)
        {
            token.RevokedAt = revokedAt;
        }
    }

    private static RefreshTokenData ToData(RefreshToken token) => new(
        token.Id,
        token.UserId,
        token.TokenHash,
        token.ExpiresAt,
        token.CreatedAt,
        token.RevokedAt,
        token.ReplacedByTokenHash);
}
