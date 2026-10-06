using Firmeza.Application.Abstractions;
using Firmeza.Application.Common;
using Firmeza.Application.Dtos.Auth;

namespace Firmeza.Application.Services.Auth;

public interface IAuthService
{
    Task<Result<TokenResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);

    Task<Result<UserResponse>> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);

    Task<Result<TokenResponse>> RefreshAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default);

    Task<Result<UserResponse>> GetProfileAsync(CancellationToken cancellationToken = default);
}
