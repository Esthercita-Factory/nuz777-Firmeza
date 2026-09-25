using System.ComponentModel.DataAnnotations;

namespace Firmeza.Application.Dtos.Products;

public sealed class ProductRequest
{
    [Display(Name = "Codigo de producto")]
    [Required(ErrorMessage = "El codigo es obligatorio.")]
    [StringLength(30)]
    public string Sku { get; set; } = string.Empty;

    [Display(Name = "Nombre")]
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(120)]
    public string Name { get; set; } = string.Empty;

    [Display(Name = "Descripcion")]
    [StringLength(1000)]
    public string? Description { get; set; }

    [Display(Name = "Categoria")]
    [Required(ErrorMessage = "La categoria es obligatoria.")]
    [StringLength(80)]
    public string Category { get; set; } = string.Empty;

    [Display(Name = "Unidad de venta")]
    [Required(ErrorMessage = "La unidad de venta es obligatoria.")]
    [StringLength(30)]
    public string Unit { get; set; } = "Unidad";

    [Display(Name = "Precio")]
    [Range(typeof(decimal), "0.01", "999999999999.99", ErrorMessage = "El precio debe ser mayor que cero.")]
    public decimal Price { get; set; }

    [Display(Name = "Stock")]
    [Range(0, int.MaxValue, ErrorMessage = "El stock no puede ser negativo.")]
    public int Stock { get; set; }

    [Display(Name = "Activo")]
    public bool IsActive { get; set; } = true;
}

public sealed record ProductResponse(
    Guid Id,
    string Sku,
    string Name,
    string? Description,
    string Category,
    string Unit,
    decimal Price,
    int Stock,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt);

public sealed record ProductQuery
{
    public string? Q { get; init; }

    public bool OnlyActive { get; init; }

    public int Page { get; init; } = 1;

    public int PageSize { get; init; } = 20;
}
