using System.ComponentModel.DataAnnotations;

namespace Firmeza.Application.Dtos.Customers;

public sealed class CustomerRequest
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
    [EmailAddress(ErrorMessage = "El correo no tiene un formato valido.")]
    [StringLength(160)]
    public string Email { get; set; } = string.Empty;

    [Display(Name = "Telefono")]
    [Required(ErrorMessage = "El telefono es obligatorio.")]
    [StringLength(30)]
    public string Phone { get; set; } = string.Empty;

    [Display(Name = "Direccion")]
    [StringLength(240)]
    public string? Address { get; set; }

    [Display(Name = "Activo")]
    public bool IsActive { get; set; } = true;
}

public sealed record CustomerResponse(
    Guid Id,
    string Document,
    string FullName,
    int Age,
    string Email,
    string Phone,
    string? Address,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt);

public sealed record CustomerQuery
{
    public string? Q { get; init; }

    public bool OnlyActive { get; init; }

    public int Page { get; init; } = 1;

    public int PageSize { get; init; } = 20;
}
