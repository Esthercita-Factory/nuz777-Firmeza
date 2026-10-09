using Firmeza.Application.Abstractions;
using Firmeza.Domain.Enums;
using Firmeza.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Firmeza.Infrastructure.Repositories;

public sealed class DashboardQuery : IDashboardQuery
{
    private const int RecentSalesCount = 5;

    private readonly ApplicationDbContext _db;

    public DashboardQuery(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<DashboardSnapshot> GetAsync(CancellationToken cancellationToken = default)
    {
        var activeProductCount = await _db.Products.CountAsync(product => product.IsActive, cancellationToken);
        var activeCustomerCount = await _db.Customers.CountAsync(customer => customer.IsActive, cancellationToken);
        var saleCount = await _db.Sales.CountAsync(cancellationToken);
        var salesTotal = await _db.Sales
            .Where(sale => sale.Status != SaleStatus.Cancelled)
            .Select(sale => (decimal?)sale.Total)
            .SumAsync(cancellationToken) ?? 0m;

        var recentSales = (await _db.Sales
            .AsNoTracking()
            .Include(sale => sale.Customer)
            .OrderByDescending(sale => sale.SaleDate)
            .Take(RecentSalesCount)
            .Select(sale => new
            {
                sale.Id,
                sale.SaleNumber,
                CustomerName = sale.Customer.FullName,
                sale.SaleDate,
                sale.Total,
                sale.Status
            })
            .ToListAsync(cancellationToken))
            .Select(sale => (sale.Id, sale.SaleNumber, sale.CustomerName, sale.SaleDate, sale.Total, sale.Status))
            .ToList();

        var pendingSaleCount = await _db.Sales
            .CountAsync(sale => sale.Status == SaleStatus.Pending, cancellationToken);

        // Distribucion por estado (para grafico de donas)
        var statusGroups = await _db.Sales
            .GroupBy(s => s.Status)
            .Select(g => new
            {
                Status = g.Key,
                Count = g.Count(),
                Total = g.Sum(s => s.Total)
            })
            .ToListAsync(cancellationToken);

        var allStatuses = new[] { SaleStatus.Pending, SaleStatus.Confirmed, SaleStatus.Delivered, SaleStatus.Cancelled };
        var statusDistribution = allStatuses
            .Select(st =>
            {
                var found = statusGroups.FirstOrDefault(g => g.Status == st);
                return (Status: st, Count: found?.Count ?? 0, Total: found?.Total ?? 0m);
            })
            .ToList();

        // Tendencia de ventas de los ultimos 7 dias (para grafico de tendencia)
        var maxDate = await _db.Sales
            .Where(s => s.Status != SaleStatus.Cancelled)
            .Select(s => (DateTimeOffset?)s.SaleDate)
            .MaxAsync(cancellationToken);

        var todayUtc = new DateTimeOffset(DateTime.UtcNow.Date, TimeSpan.Zero);
        var endDate = maxDate.HasValue
            ? new DateTimeOffset(maxDate.Value.UtcDateTime.Date, TimeSpan.Zero)
            : todayUtc;

        if (todayUtc - endDate <= TimeSpan.FromDays(7))
        {
            endDate = todayUtc;
        }

        var startDate = endDate.AddDays(-6);
        var nextDayAfterEnd = endDate.AddDays(1);

        var salesForTrend = await _db.Sales
            .Where(s => s.SaleDate >= startDate && s.SaleDate < nextDayAfterEnd && s.Status != SaleStatus.Cancelled)
            .Select(s => new { s.SaleDate, s.Total })
            .ToListAsync(cancellationToken);

        var culture = System.Globalization.CultureInfo.GetCultureInfo("es-CO");

        var trend = Enumerable.Range(0, 7)
            .Select(i => startDate.AddDays(i))
            .Select(d =>
            {
                var daySales = salesForTrend.Where(s => s.SaleDate.UtcDateTime.Date == d.UtcDateTime.Date).ToList();
                return (
                    Date: d.ToString("yyyy-MM-dd"),
                    Label: d.ToString("dd MMM", culture),
                    Total: daySales.Sum(s => s.Total),
                    Count: daySales.Count
                );
            })
            .ToList();

        return new DashboardSnapshot(
            activeProductCount,
            activeCustomerCount,
            saleCount,
            salesTotal,
            recentSales,
            pendingSaleCount,
            statusDistribution,
            trend);
    }
}
