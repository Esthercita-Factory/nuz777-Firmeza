using Firmeza.Domain.Enums;

namespace Firmeza.Application.Dtos.Dashboard;

public sealed record DashboardResponse(
    int ActiveProductCount,
    int ActiveCustomerCount,
    int SaleCount,
    decimal SalesTotal,
    IReadOnlyList<RecentSaleResponse> RecentSales,
    int PendingSaleCount,
    IReadOnlyList<SalesStatusDistributionResponse> StatusDistribution,
    IReadOnlyList<SalesTrendPointResponse> Trend);

public sealed record RecentSaleResponse(
    Guid Id,
    string SaleNumber,
    string CustomerName,
    DateTimeOffset SaleDate,
    decimal Total,
    SaleStatus Status);

public sealed record SalesStatusDistributionResponse(
    SaleStatus Status,
    int Count,
    decimal Total);

public sealed record SalesTrendPointResponse(
    string Date,
    string Label,
    decimal Total,
    int Count);
