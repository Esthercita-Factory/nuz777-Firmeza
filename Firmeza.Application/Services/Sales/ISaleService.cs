using Firmeza.Application.Abstractions;
using Firmeza.Application.Common;
using Firmeza.Application.Dtos.Sales;
using Firmeza.Domain.Enums;

namespace Firmeza.Application.Services.Sales;

public interface ISaleService
{
    Task<Result<PagedResponse<SaleSummaryResponse>>> ListAsync(SaleQuery query, CancellationToken cancellationToken = default);

    Task<Result<SaleResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Result<SaleResponse>> CreateAsync(SaleRequest request, CancellationToken cancellationToken = default);

    Task<Result<SaleResponse>> UpdateAsync(Guid id, SaleRequest request, CancellationToken cancellationToken = default);

    /// <summary>Avanza el estado de la venta (confirmar, entregar, cancelar).</summary>
    Task<Result<SaleResponse>> ChangeStatusAsync(Guid id, SaleStatus status, CancellationToken cancellationToken = default);

    Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
