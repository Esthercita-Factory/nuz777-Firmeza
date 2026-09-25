using Firmeza.Domain.Enums;

namespace Firmeza.Application.Dtos.Dashboard;

public sealed record DashboardResponse(
    int ActiveProductCount,
    int ActiveCustomerCount,
    int SaleCount,
    decimal SalesTotal,
    IReadOnlyList<RecentSaleResponse> RecentSales);

public sealed record RecentSaleResponse(
    Guid Id,
    string SaleNumber,
    string CustomerName,
    DateTimeOffset SaleDate,
    decimal Total,
    SaleStatus Status);
