namespace Firmeza.Web.ViewModels;

public class DashboardViewModel
{
    public int ProductCount { get; init; }
    public int CustomerCount { get; init; }
    public int SaleCount { get; init; }
    public decimal SalesTotal { get; init; }
    public IEnumerable<RecentSaleViewModel> RecentSales { get; init; } = [];
}

public class RecentSaleViewModel
{
    public Guid Id { get; init; }
    public string SaleNumber { get; init; } = string.Empty;
    public string CustomerName { get; init; } = string.Empty;
    public DateTimeOffset SaleDate { get; init; }
    public decimal Total { get; init; }
    public string Status { get; init; } = string.Empty;
}
