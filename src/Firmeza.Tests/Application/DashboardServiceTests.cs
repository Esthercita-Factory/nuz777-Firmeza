using Firmeza.Application.Abstractions;
using Firmeza.Application.Services.Dashboard;
using Firmeza.Domain.Enums;
using NSubstitute;
using Xunit;

namespace Firmeza.Tests.Application;

public class DashboardServiceTests
{
    [Fact]
    public async Task GetAsync_ReturnsMappedSnapshot()
    {
        var dashboardQuery = Substitute.For<IDashboardQuery>();
        var date = new DateTimeOffset(2026, 10, 7, 0, 0, 0, TimeSpan.Zero);

        var snapshot = new DashboardSnapshot(
            ActiveProductCount: 15,
            ActiveCustomerCount: 8,
            SaleCount: 22,
            SalesTotal: 1500000m,
            RecentSales:
            [
                (Guid.NewGuid(), "VTA-0001", "Juan Perez", date, 50000m, SaleStatus.Pending)
            ],
            PendingSaleCount: 3,
            StatusDistribution:
            [
                (SaleStatus.Pending, 3, 150000m),
                (SaleStatus.Confirmed, 10, 800000m),
                (SaleStatus.Delivered, 7, 500000m),
                (SaleStatus.Cancelled, 2, 50000m)
            ],
            Trend:
            [
                ("2026-10-07", "07 oct", 50000m, 1)
            ]);

        dashboardQuery.GetAsync(Arg.Any<CancellationToken>()).Returns(snapshot);

        var sut = new DashboardService(dashboardQuery);
        var result = await sut.GetAsync();

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Equal(15, result.Value.ActiveProductCount);
        Assert.Equal(8, result.Value.ActiveCustomerCount);
        Assert.Equal(22, result.Value.SaleCount);
        Assert.Equal(1500000m, result.Value.SalesTotal);
        Assert.Equal(3, result.Value.PendingSaleCount);
        Assert.Single(result.Value.RecentSales);
        Assert.Equal(4, result.Value.StatusDistribution.Count);
        Assert.Single(result.Value.Trend);
    }
}
