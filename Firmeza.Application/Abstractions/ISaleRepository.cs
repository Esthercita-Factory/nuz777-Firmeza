using Firmeza.Application.Common;
using Firmeza.Domain.Entities;
using Firmeza.Domain.Enums;

namespace Firmeza.Application.Abstractions;

/// <param name="CustomerId">
/// Cuando viene informado, limita el listado a las ventas de ese cliente. Lo usa
/// el portal del cliente para que no vea operaciones de otros.
/// </param>
public sealed record SaleFilter(string? Term, SaleStatus? Status, Guid? CustomerId = null);

public interface ISaleRepository
{
    Task<PagedResult<Sale>> ListAsync(SaleFilter filter, PageRequest page, CancellationToken cancellationToken = default);

    Task<Sale?> FindWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Sale?> FindByNumberAsync(string saleNumber, CancellationToken cancellationToken = default);

    /// <summary>Carga la venta con sus lineas para borrarla o actualizarla (tracking + FOR UPDATE).</summary>
    Task<Sale?> FindByIdForUpdateAsync(Guid id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Sale>> GetAllWithDetailsAsync(CancellationToken cancellationToken = default);

    Task AddAsync(Sale sale, CancellationToken cancellationToken = default);

    void Remove(Sale sale);
}