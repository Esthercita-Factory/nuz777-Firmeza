using System.Security.Claims;
using Firmeza.Application.Abstractions;
using Microsoft.AspNetCore.Http;

namespace Firmeza.Infrastructure.Security;

public sealed class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated == true;

    public string? UserId => Principal?.FindFirstValue(JwtTokenService.SubjectClaim);

    public string? Email => Principal?.FindFirstValue(JwtTokenService.EmailClaim);

    public IReadOnlyList<string> Roles => IsAuthenticated
        ? [.. Principal!.FindAll(JwtTokenService.RoleClaim).Select(claim => claim.Value)]
        : [];

    public bool IsInRole(string role) => IsAuthenticated && Principal!.IsInRole(role);

    private ClaimsPrincipal? Principal => _httpContextAccessor.HttpContext?.User;
}
