using System.ComponentModel.DataAnnotations;
using Firmeza.Application.Common;
using Firmeza.Domain.Enums;

namespace Firmeza.Application.Dtos.Sales;

public sealed class SaleRequest
{
    /// <summary>
    /// Cliente de la venta.
    ///
    /// Opcional a proposito: cuando quien compra es un Cliente del portal, la API
    /// lo sustituye por su propia ficha e ignora este valor. Si fuera [Required],
    /// el request fallaria en el binding antes de llegar al controller. La
    /// validacion real la hacen SalesController y SaleService.
    /// </summary>
    [Display(Name = "Cliente")]
    public Guid? CustomerId { get; set; }

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
    [DecimalRange("0.01", "999999999999.99", ErrorMessage = "El precio unitario debe ser mayor que cero.")]
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

/// <summary>
/// Base e IVA de la venta. Los precios son con IVA incluido, asi que ambos se
/// derivan del total en el dominio y llegan calculados: el cliente no los
/// recalcula y el panel coincide con el comprobante PDF.
/// </summary>
public sealed record SaleTaxesResponse(decimal SubtotalBase, decimal Tax, decimal Rate);

public sealed record SaleResponse(
    Guid Id,
    string SaleNumber,
    Guid CustomerId,
    string CustomerName,
    string CustomerDocument,
    DateTimeOffset SaleDate,
    SaleStatus Status,
    decimal Total,
    SaleTaxesResponse Taxes,
    string? CreatedByUserId,
    IReadOnlyList<SaleLineResponse> Lines);

/// <summary>Cambio de estado de una venta. Solo el administrador lo puede pedir.</summary>
public sealed class UpdateSaleStatusRequest
{
    [Display(Name = "Estado")]
    [Required(ErrorMessage = "El estado es obligatorio.")]
    public SaleStatus Status { get; set; }
}

public sealed record SaleQuery
{
    public string? Q { get; init; }

    public SaleStatus? Status { get; init; }

    public int Page { get; init; } = 1;

    // 10 por pagina: con 11 registros ya se ve la paginacion.
    public int PageSize { get; init; } = 10;

    /// <summary>
    /// Lo fija el servidor segun el rol: el Administrador ve todas las ventas
    /// (null), el Cliente solo las propias. No se toma del cuerpo de la peticion,
    /// para que un cliente no pueda pedir las ventas de otro.
    /// </summary>
    public Guid? CustomerId { get; init; }
}
