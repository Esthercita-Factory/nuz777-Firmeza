using System.Security.Claims;
using Firmeza.Application.Abstractions;
using Firmeza.Application.Dtos.Auth;
using Firmeza.Application.Services.Auth;
using Firmeza.Infrastructure.Identity;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;

namespace Firmeza.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IAuthenticationSchemeProvider _schemeProvider;

    public AuthController(
        IAuthService auth,
        SignInManager<ApplicationUser> signInManager,
        IAuthenticationSchemeProvider schemeProvider)
    {
        _auth = auth;
        _signInManager = signInManager;
        _schemeProvider = schemeProvider;
    }

    /// <summary>Autentica un usuario y devuelve el par de tokens.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(TokenResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<TokenResponse>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
        => Ok(await _auth.LoginAsync(request, cancellationToken));

    /// <summary>Registra un cliente y devuelve el perfil creado.</summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UserResponse>> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await _auth.RegisterAsync(request, cancellationToken);

        return result.IsSuccess ? StatusCode(StatusCodes.Status201Created, result.Value) : BadRequest(result);
    }

    /// <summary>Renueva el access token usando un refresh token valido (rotacion).</summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(TokenResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<TokenResponse>> Refresh([FromBody] RefreshTokenRequest request, CancellationToken cancellationToken)
        => Ok(await _auth.RefreshAsync(request, cancellationToken));

    /// <summary>Perfil del usuario autenticado.</summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserResponse>> Me(CancellationToken cancellationToken)
        => Ok(await _auth.GetProfileAsync(cancellationToken));

    /// <summary>Elimina la cuenta y todos los datos personales del cliente autenticado.</summary>
    [HttpDelete("me")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult> DeleteMe(CancellationToken cancellationToken)
    {
        var result = await _auth.DeleteAccountAsync(cancellationToken);
        if (result.IsFailure)
        {
            return BadRequest(result);
        }

        await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);
        return NoContent();
    }

    /// <summary>Completa los datos del cliente registrado con OAuth y genera la solicitud comercial.</summary>
    [HttpPost("complete-profile")]
    [Authorize]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserResponse>> CompleteProfile(
        [FromBody] CompleteProfileRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _auth.CompleteProfileAsync(request, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result);
    }

    /// <summary>Inicia el flujo OAuth 2.0 con GitHub.</summary>
    [HttpGet("external-login")]
    [AllowAnonymous]
    public async Task<IActionResult> ExternalLogin(
        [FromQuery] string provider,
        [FromQuery] string returnUrl = "https://firmeza.clandev.com/auth/callback",
        [FromQuery] string mode = "login")
    {
        var safeReturnUrl = NormalizeReturnUrl(returnUrl);

        if (string.IsNullOrWhiteSpace(provider))
        {
            return Redirect(QueryHelpers.AddQueryString(safeReturnUrl, "error", "Proveedor OAuth no especificado."));
        }

        var scheme = await _schemeProvider.GetSchemeAsync(provider);
        if (scheme is null)
        {
            return Redirect(QueryHelpers.AddQueryString(
                safeReturnUrl,
                "error",
                $"El proveedor {provider} no esta configurado en el servidor (agrega ClientId y ClientSecret en appsettings)."));
        }

        var callbackUrl = Url.Action(nameof(ExternalLoginCallback), "Auth", new { returnUrl = safeReturnUrl, mode }, Request.Scheme);
        var properties = _signInManager.ConfigureExternalAuthenticationProperties(provider, callbackUrl);
        return Challenge(properties, provider);
    }

    /// <summary>Callback del proveedor externo OAuth 2.0 y emision de JWT.</summary>
    [HttpGet("external-callback")]
    [AllowAnonymous]
    public async Task<IActionResult> ExternalLoginCallback(
        [FromQuery] string returnUrl = "https://firmeza.clandev.com/auth/callback",
        [FromQuery] string mode = "login",
        [FromQuery] string? remoteError = null,
        CancellationToken cancellationToken = default)
    {
        var safeReturnUrl = NormalizeReturnUrl(returnUrl);

        if (!string.IsNullOrWhiteSpace(remoteError))
        {
            return Redirect(QueryHelpers.AddQueryString(safeReturnUrl, "error", $"Error del proveedor externo: {remoteError}"));
        }

        var info = await _signInManager.GetExternalLoginInfoAsync();
        if (info is null)
        {
            return Redirect(QueryHelpers.AddQueryString(safeReturnUrl, "error", "No se pudo obtener la informacion del proveedor externo."));
        }

        var providerKey = info.ProviderKey;
        var provider = info.LoginProvider;
        var email = info.Principal.FindFirstValue(ClaimTypes.Email)
            ?? info.Principal.FindFirstValue("urn:github:email");
        var name = info.Principal.FindFirstValue(ClaimTypes.Name)
            ?? info.Principal.FindFirstValue("urn:github:name")
            ?? info.Principal.Identity?.Name;
        var avatarUrl = info.Principal.FindFirstValue("urn:github:avatar")
            ?? info.Principal.FindFirstValue("avatar_url")
            ?? info.Principal.FindFirstValue("picture");

        if (string.IsNullOrWhiteSpace(email))
        {
            var fallbackUsername = info.Principal.Identity?.Name ?? providerKey;
            email = $"{fallbackUsername}@{provider.ToLowerInvariant()}.oauth.local";
        }

        var fullName = string.IsNullOrWhiteSpace(name) ? email.Split('@')[0] : name;
        var allowCreate = string.Equals(mode, "register", StringComparison.OrdinalIgnoreCase);

        var result = await _auth.ExternalLoginAsync(
            new ExternalUserRegistration(provider, providerKey, email, fullName, avatarUrl),
            allowCreate,
            cancellationToken);

        await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);

        if (result.IsFailure || result.Value is null)
        {
            var errMsg = result.Error?.Message ?? "No fue posible autenticar la cuenta externa.";
            return Redirect(QueryHelpers.AddQueryString(safeReturnUrl, "error", errMsg));
        }

        var tokens = result.Value;
        var redirectParams = new Dictionary<string, string?>
        {
            ["accessToken"] = tokens.AccessToken,
            ["accessTokenExpiresAt"] = tokens.AccessTokenExpiresAt.ToString("O"),
            ["refreshToken"] = tokens.RefreshToken,
            ["refreshTokenExpiresAt"] = tokens.RefreshTokenExpiresAt.ToString("O"),
            ["avatarUrl"] = tokens.User.AvatarUrl ?? avatarUrl
        };

        return Redirect(QueryHelpers.AddQueryString(safeReturnUrl, redirectParams));
    }

    private static string NormalizeReturnUrl(string? returnUrl)
    {
        if (string.IsNullOrWhiteSpace(returnUrl))
        {
            return "https://firmeza.clandev.com/auth/callback";
        }

        if (Uri.TryCreate(returnUrl, UriKind.Absolute, out var uri))
        {
            if (uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
                uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase) ||
                uri.Host.Equals("firmeza.clandev.com", StringComparison.OrdinalIgnoreCase) ||
                uri.Host.EndsWith(".clandev.com", StringComparison.OrdinalIgnoreCase))
            {
                return returnUrl;
            }
        }

        return "https://firmeza.clandev.com/auth/callback";
    }
}
