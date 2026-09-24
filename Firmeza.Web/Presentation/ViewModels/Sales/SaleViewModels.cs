namespace Firmeza.Web.Presentation.ViewModels.Sales;

public class SaleListItemViewModel
{
    public Guid Id { get; init; }
    public string SaleNumber { get; init; } = string.Empty;
    public string CustomerName { get; init; } = string.Empty;
    public DateTimeOffset SaleDate { get; init; }
    public string Status { get; init; } = string.Empty;
    public decimal Total { get; init; }
}

public class SaleDetailsViewModel
{
    public Guid Id { get; init; }
    public string SaleNumber { get; init; } = string.Empty;
    public string CustomerName { get; init; } = string.Empty;
    public string CustomerDocument { get; init; } = string.Empty;
    public DateTimeOffset SaleDate { get; init; }
    public string Status { get; init; } = string.Empty;
    public decimal Total { get; init; }
    public IEnumerable<SaleDetailViewModel> Details { get; init; } = [];
}

public class SaleDetailViewModel
{
    public string ProductName { get; init; } = string.Empty;
    public string ProductSku { get; init; } = string.Empty;
    public int Quantity { get; init; }
    public decimal UnitPrice { get; init; }
    public decimal Subtotal { get; init; }
}
