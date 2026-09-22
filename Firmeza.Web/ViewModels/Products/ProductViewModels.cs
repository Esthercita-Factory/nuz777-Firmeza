using System.ComponentModel.DataAnnotations;

namespace Firmeza.Web.ViewModels.Products;

public class ProductFormViewModel
{
    public Guid Id { get; set; }

    [Display(Name = "SKU")]
    [Required(ErrorMessage = "El SKU es obligatorio.")]
    [StringLength(30)]
    public string Sku { get; set; } = string.Empty;

    [Display(Name = "Nombre")]
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(120)]
    public string Name { get; set; } = string.Empty;

    [Display(Name = "Descripción")]
    [StringLength(1000)]
    public string? Description { get; set; }

    [Display(Name = "Categoría")]
    [Required(ErrorMessage = "La categoría es obligatoria.")]
    [StringLength(80)]
    public string Category { get; set; } = string.Empty;

    [Display(Name = "Unidad de venta")]
    [Required(ErrorMessage = "La unidad de venta es obligatoria.")]
    [StringLength(30)]
    public string Unit { get; set; } = "Unidad";

    [Display(Name = "Precio")]
    [Range(
        typeof(decimal),
        "0.01",
        "999999999999.99",
        ErrorMessage = "El precio debe ser mayor que cero.",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true)]
    public decimal Price { get; set; }

    [Display(Name = "Stock")]
    [Range(0, int.MaxValue, ErrorMessage = "El stock no puede ser negativo.")]
    public int Stock { get; set; }

    [Display(Name = "Activo")]
    public bool IsActive { get; set; } = true;
}

public class ProductListItemViewModel
{
    public Guid Id { get; init; }
    public string Sku { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public string Unit { get; init; } = string.Empty;
    public decimal Price { get; init; }
    public int Stock { get; init; }
    public bool IsActive { get; init; }
}
