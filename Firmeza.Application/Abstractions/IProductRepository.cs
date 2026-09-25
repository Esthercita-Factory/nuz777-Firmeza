using Firmeza.Application.Common;
using Firmeza.Domain.Entities;

namespace Firmeza.Application.Abstractions;

public sealed record ProductFilter(string? Term, bool OnlyActive);

public interface IProductRepository
{
    Task<PagedResult<Product>> ListAsync(ProductFilter filter, PageRequest page, CancellationToken cancellationToken = default);

    Task<Product?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Product>> FindByIdsForUpdateAsync(IReadOnlyCollection<Guid> ids, CancellationToken cancellationToken = default);

    Task<bool> SkuExistsAsync(string sku, Guid? excludedId = null, CancellationToken cancellationToken = default);

    Task<bool> HasSalesAsync(Guid id, CancellationToken cancellationToken = default);

    Task AddAsync(Product product, CancellationToken cancellationToken = default);

    void Remove(Product product);
}
