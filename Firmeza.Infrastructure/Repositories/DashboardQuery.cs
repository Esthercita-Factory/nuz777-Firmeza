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

        return new DashboardSnapshot(activeProductCount, activeCustomerCount, saleCount, salesTotal, recentSales);
    }
}
