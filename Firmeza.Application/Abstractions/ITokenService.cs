namespace Firmeza.Application.Abstractions;

public sealed record TokenPair(string AccessToken, DateTimeOffset AccessTokenExpiresAt, string RefreshToken, DateTimeOffset RefreshTokenExpiresAt);

public interface ITokenService
{
    TokenPair CreateTokenPair(UserAccount user, IReadOnlyCollection<string> roles);

    string HashRefreshToken(string refreshToken);
}
