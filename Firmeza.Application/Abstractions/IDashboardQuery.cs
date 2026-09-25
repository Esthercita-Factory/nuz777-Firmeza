using Firmeza.Domain.Enums;

namespace Firmeza.Application.Abstractions;

public sealed record DashboardSnapshot(
    int ActiveProductCount,
    int ActiveCustomerCount,
    int SaleCount,
    decimal SalesTotal,
    IReadOnlyList<(Guid Id, string SaleNumber, string CustomerName, DateTimeOffset SaleDate, decimal Total, SaleStatus Status)> RecentSales);

public interface IDashboardQuery
{
    Task<DashboardSnapshot> GetAsync(CancellationToken cancellationToken = default);
}
