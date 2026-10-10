using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Firmeza.Application.Abstractions;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;

namespace Firmeza.Infrastructure.Security;

public sealed class JwtTokenService : ITokenService
{
    public const string SubjectClaim = "sub";
    public const string EmailClaim = "email";
    public const string NameClaim = "name";
    public const string RoleClaim = "role";

    private readonly JwtTokenOptions _options;
    private readonly IClock _clock;

    public JwtTokenService(JwtTokenOptions options, IClock clock)
    {
        _options = options;
        _clock = clock;
    }

    public TokenPair CreateTokenPair(UserAccount user, IReadOnlyCollection<string> roles)
    {
        var now = _clock.UtcNow;
        var accessExpiresAt = now.AddMinutes(_options.AccessTokenMinutes);
        var refreshExpiresAt = now.AddDays(_options.RefreshTokenDays);

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey)),
            SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(SubjectClaim, user.Id),
            new(EmailClaim, user.Email),
            new(NameClaim, user.FullName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
        };
        claims.AddRange(roles.Select(role => new Claim(RoleClaim, role)));

        var jwt = new JwtSecurityToken(
            _options.Issuer,
            _options.Audience,
            claims,
            now.UtcDateTime,
            accessExpiresAt.UtcDateTime,
            credentials);
        var token = new JwtSecurityTokenHandler().WriteToken(jwt);

        return new TokenPair(token, accessExpiresAt, CreateRefreshToken(), refreshExpiresAt);
    }

    public string HashRefreshToken(string refreshToken)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken)));

    private static string CreateRefreshToken()
        => Base64UrlEncoder.Encode(RandomNumberGenerator.GetBytes(64));
}
