using Firmeza.Application.Abstractions;
using Firmeza.Application.Common;
using Firmeza.Application.Dtos.Dashboard;

namespace Firmeza.Application.Services.Dashboard;

public interface IDashboardService
{
    Task<Result<DashboardResponse>> GetAsync(CancellationToken cancellationToken = default);
}

public sealed class DashboardService : IDashboardService
{
    private readonly IDashboardQuery _dashboardQuery;

    public DashboardService(IDashboardQuery dashboardQuery)
    {
        _dashboardQuery = dashboardQuery;
    }

    public async Task<Result<DashboardResponse>> GetAsync(CancellationToken cancellationToken = default)
    {
        var snapshot = await _dashboardQuery.GetAsync(cancellationToken);

        return Result.Success(new DashboardResponse(
            snapshot.ActiveProductCount,
            snapshot.ActiveCustomerCount,
            snapshot.SaleCount,
            snapshot.SalesTotal,
            snapshot.RecentSales
                .Select(sale => new RecentSaleResponse(
                    sale.Id,
                    sale.SaleNumber,
                    sale.CustomerName,
                    sale.SaleDate,
                    sale.Total,
                    sale.Status))
                .ToList()));
    }
}
