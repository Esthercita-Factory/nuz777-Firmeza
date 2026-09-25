using System.ComponentModel.DataAnnotations;
using Firmeza.Domain.Enums;

namespace Firmeza.Application.Dtos.Sales;

public sealed class SaleRequest
{
    [Display(Name = "Cliente")]
    [Required(ErrorMessage = "El cliente es obligatorio.")]
    public Guid CustomerId { get; set; }

    [Display(Name = "Estado")]
    public SaleStatus? Status { get; set; }

    [Display(Name = "Lineas")]
    [Required(ErrorMessage = "La venta debe tener al menos una linea.")]
    [MinLength(1, ErrorMessage = "La venta debe tener al menos una linea.")]
    public List<SaleLineRequest> Lines { get; set; } = [];
}

public sealed class SaleLineRequest
{
    [Display(Name = "Producto")]
    [Required(ErrorMessage = "El producto es obligatorio.")]
    public Guid ProductId { get; set; }

    [Display(Name = "Cantidad")]
    [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser mayor que cero.")]
    public int Quantity { get; set; }

    [Display(Name = "Precio unitario")]
    [Range(typeof(decimal), "0.01", "999999999999.99", ErrorMessage = "El precio unitario debe ser mayor que cero.")]
    public decimal? UnitPrice { get; set; }
}

public sealed record SaleSummaryResponse(
    Guid Id,
    string SaleNumber,
    Guid CustomerId,
    string CustomerName,
    DateTimeOffset SaleDate,
    SaleStatus Status,
    decimal Total,
    int LineCount);

public sealed record SaleLineResponse(
    Guid Id,
    Guid ProductId,
    string ProductSku,
    string ProductName,
    int Quantity,
    decimal UnitPrice,
    decimal Subtotal);

public sealed record SaleResponse(
    Guid Id,
    string SaleNumber,
    Guid CustomerId,
    string CustomerName,
    string CustomerDocument,
    DateTimeOffset SaleDate,
    SaleStatus Status,
    decimal Total,
    string? CreatedByUserId,
    IReadOnlyList<SaleLineResponse> Lines);

public sealed record SaleQuery
{
    public string? Q { get; init; }

    public SaleStatus? Status { get; init; }

    public int Page { get; init; } = 1;

    public int PageSize { get; init; } = 20;
}
