using System.ComponentModel.DataAnnotations;

namespace Firmeza.Application.Dtos.Auth;

public sealed class LoginRequest
{
    [Display(Name = "Correo")]
    [Required(ErrorMessage = "El correo es obligatorio.")]
    [EmailAddress(ErrorMessage = "Ingresa un correo valido.")]
    public string Email { get; set; } = string.Empty;

    [Display(Name = "Contrasena")]
    [Required(ErrorMessage = "La contrasena es obligatoria.")]
    public string Password { get; set; } = string.Empty;
}

public sealed class RegisterRequest
{
    [Display(Name = "Documento")]
    [Required(ErrorMessage = "El documento es obligatorio.")]
    [StringLength(30)]
    public string Document { get; set; } = string.Empty;

    [Display(Name = "Nombre completo")]
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [RegularExpression(@"^[a-zA-ZÁÉÍÓÚÜÑáéíóúüñ' -]+$", ErrorMessage = "El nombre solo puede contener letras y espacios.")]
    [StringLength(120)]
    public string FullName { get; set; } = string.Empty;

    [Display(Name = "Edad")]
    [Range(18, 120, ErrorMessage = "La edad debe estar entre 18 y 120 anios.")]
    public int Age { get; set; }

    [Display(Name = "Correo")]
    [Required(ErrorMessage = "El correo es obligatorio.")]
    [EmailAddress(ErrorMessage = "Ingresa un correo valido.")]
    [StringLength(160)]
    public string Email { get; set; } = string.Empty;

    [Display(Name = "Telefono")]
    [Required(ErrorMessage = "El telefono es obligatorio.")]
    [StringLength(30)]
    public string Phone { get; set; } = string.Empty;

    [Display(Name = "Direccion")]
    [StringLength(240)]
    public string? Address { get; set; }

    [Display(Name = "Contrasena")]
    [Required(ErrorMessage = "La contrasena es obligatoria.")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "La contrasena debe tener al menos 8 caracteres.")]
    public string Password { get; set; } = string.Empty;

    [Display(Name = "Confirmar contrasena")]
    [Compare(nameof(Password), ErrorMessage = "Las contrasenas no coinciden.")]
    public string ConfirmPassword { get; set; } = string.Empty;
}

public sealed class RefreshTokenRequest
{
    [Display(Name = "Refresh token")]
    [Required(ErrorMessage = "El refresh token es obligatorio.")]
    public string RefreshToken { get; set; } = string.Empty;
}

public sealed record TokenResponse(
    string TokenType,
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAt,
    string RefreshToken,
    DateTimeOffset RefreshTokenExpiresAt,
    UserResponse User);

public sealed record UserResponse(string Id, string Email, string FullName, IReadOnlyList<string> Roles);
