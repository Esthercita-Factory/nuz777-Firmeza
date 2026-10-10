using Firmeza.Domain.Enums;

namespace Firmeza.Application.Abstractions;

public sealed record DashboardSnapshot(
    int ActiveProductCount,
    int ActiveCustomerCount,
    int SaleCount,
    decimal SalesTotal,
    IReadOnlyList<(Guid Id, string SaleNumber, string CustomerName, DateTimeOffset SaleDate, decimal Total, SaleStatus Status)> RecentSales,
    int PendingSaleCount,
    IReadOnlyList<(SaleStatus Status, int Count, decimal Total)> StatusDistribution,
    IReadOnlyList<(string Date, string Label, decimal Total, int Count)> Trend);

public interface IDashboardQuery
{
    Task<DashboardSnapshot> GetAsync(CancellationToken cancellationToken = default);
}
