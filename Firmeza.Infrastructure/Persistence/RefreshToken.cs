namespace Firmeza.Infrastructure.Persistence;

/// <summary>
/// Entidad de persistencia de los refresh tokens. No vive en Domain porque
/// es un detalle de infraestructura (almacenamiento de sesiones de la API).
/// </summary>
public class RefreshToken
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string TokenHash { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }
    public string? ReplacedByTokenHash { get; set; }
}
