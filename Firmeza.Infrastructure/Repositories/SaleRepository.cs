using Firmeza.Application.Abstractions;
using Firmeza.Application.Common;
using Firmeza.Domain.Entities;
using Firmeza.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Firmeza.Infrastructure.Repositories;

public sealed class SaleRepository : ISaleRepository
{
    private readonly ApplicationDbContext _db;

    public SaleRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<Sale>> ListAsync(SaleFilter filter, PageRequest page, CancellationToken cancellationToken = default)
    {
        var query = _db.Sales.AsNoTracking().Include(sale => sale.Customer).AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Term))
        {
            var term = filter.Term;
            query = query.Where(sale => sale.SaleNumber.Contains(term) || sale.Customer.FullName.Contains(term));
        }

        if (filter.Status is not null)
        {
            query = query.Where(sale => sale.Status == filter.Status);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(sale => sale.SaleDate)
            .Skip(page.Skip)
            .Take(page.Take)
            .ToListAsync(cancellationToken);

        return new PagedResult<Sale> { Items = items, TotalCount = totalCount };
    }

    public Task<Sale?> FindWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
        => _db.Sales
            .AsNoTracking()
            .Include(sale => sale.Customer)
            .Include(sale => sale.Details)
            .ThenInclude(detail => detail.Product)
            .FirstOrDefaultAsync(sale => sale.Id == id, cancellationToken);

    public Task<Sale?> FindByNumberAsync(string saleNumber, CancellationToken cancellationToken = default)
        => _db.Sales.FirstOrDefaultAsync(sale => sale.SaleNumber == saleNumber, cancellationToken);

    public async Task AddAsync(Sale sale, CancellationToken cancellationToken = default)
    {
        await _db.Sales.AddAsync(sale, cancellationToken);
    }
}
