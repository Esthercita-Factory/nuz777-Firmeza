using Firmeza.Application.Abstractions;
using Firmeza.Application.Common;
using Firmeza.Domain.Entities;
using Firmeza.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Firmeza.Infrastructure.Repositories;

public sealed class ProductRepository : IProductRepository
{
    private readonly ApplicationDbContext _db;

    public ProductRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<Product>> ListAsync(ProductFilter filter, PageRequest page, CancellationToken cancellationToken = default)
    {
        var query = ApplyFilter(_db.Products.AsNoTracking(), filter);
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(product => product.IsActive)
            .ThenBy(product => product.Name)
            .Skip(page.Skip)
            .Take(page.Take)
            .ToListAsync(cancellationToken);

        return new PagedResult<Product> { Items = items, TotalCount = totalCount };
    }

    public Task<Product?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => _db.Products.FirstOrDefaultAsync(product => product.Id == id, cancellationToken);

    /// <summary>
    /// Bloquea las filas de los productos indicados con FOR UPDATE para evitar
    /// que dos ventas simultaneas descuenten el mismo stock. Debe invocarse
    /// dentro de la transaccion abierta por IUnitOfWork.
    /// </summary>
    public async Task<IReadOnlyList<Product>> FindByIdsForUpdateAsync(IReadOnlyCollection<Guid> ids, CancellationToken cancellationToken = default)
    {
        if (ids.Count == 0)
        {
            return [];
        }

        var array = ids.ToArray();

        return await _db.Products
            .FromSqlInterpolated($"SELECT * FROM products WHERE \"Id\" = ANY ({array}) FOR UPDATE")
            .ToListAsync(cancellationToken);
    }

    public Task<bool> SkuExistsAsync(string sku, Guid? excludedId = null, CancellationToken cancellationToken = default)
        => _db.Products.AnyAsync(product => product.Sku == sku && (excludedId == null || product.Id != excludedId), cancellationToken);

    public Task<bool> HasSalesAsync(Guid id, CancellationToken cancellationToken = default)
        => _db.SaleDetails.AnyAsync(detail => detail.ProductId == id, cancellationToken);

    public async Task AddAsync(Product product, CancellationToken cancellationToken = default)
    {
        await _db.Products.AddAsync(product, cancellationToken);
    }

    public void Remove(Product product) => _db.Products.Remove(product);

    private static IQueryable<Product> ApplyFilter(IQueryable<Product> query, ProductFilter filter)
    {
        if (!string.IsNullOrWhiteSpace(filter.Term))
        {
            var term = filter.Term;
            query = query.Where(product =>
                product.Name.Contains(term)
                || product.Sku.Contains(term)
                || product.Category.Contains(term));
        }

        return filter.OnlyActive ? query.Where(product => product.IsActive) : query;
    }
}
