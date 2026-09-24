using System.ComponentModel.DataAnnotations;

namespace Firmeza.Web.Presentation.ViewModels.Customers;

public class CustomerFormViewModel
{
    public Guid Id { get; set; }

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
    [Range(18, 120, ErrorMessage = "La edad debe estar entre 18 y 120 años.")]
    public int Age { get; set; }

    [Display(Name = "Correo")]
    [Required(ErrorMessage = "El correo es obligatorio.")]
    [EmailAddress(ErrorMessage = "El correo no tiene un formato válido.")]
    [StringLength(160)]
    public string Email { get; set; } = string.Empty;

    [Display(Name = "Teléfono")]
    [Required(ErrorMessage = "El teléfono es obligatorio.")]
    [Phone(ErrorMessage = "El teléfono no tiene un formato válido.")]
    [StringLength(30)]
    public string Phone { get; set; } = string.Empty;

    [Display(Name = "Dirección")]
    [StringLength(240)]
    public string? Address { get; set; }

    [Display(Name = "Activo")]
    public bool IsActive { get; set; } = true;
}

public class CustomerListItemViewModel
{
    public Guid Id { get; init; }
    public string Document { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public int Age { get; init; }
    public string Email { get; init; } = string.Empty;
    public string Phone { get; init; } = string.Empty;
    public bool IsActive { get; init; }
}
