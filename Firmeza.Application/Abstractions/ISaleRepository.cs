using Firmeza.Application.Common;
using Firmeza.Domain.Entities;
using Firmeza.Domain.Enums;

namespace Firmeza.Application.Abstractions;

public sealed record SaleFilter(string? Term, SaleStatus? Status);

public interface ISaleRepository
{
    Task<PagedResult<Sale>> ListAsync(SaleFilter filter, PageRequest page, CancellationToken cancellationToken = default);

    Task<Sale?> FindWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Sale?> FindByNumberAsync(string saleNumber, CancellationToken cancellationToken = default);

    Task AddAsync(Sale sale, CancellationToken cancellationToken = default);
}
