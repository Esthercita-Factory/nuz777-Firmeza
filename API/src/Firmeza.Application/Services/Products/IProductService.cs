using Firmeza.Application.Abstractions;
using Firmeza.Application.Common;
using Firmeza.Application.Dtos.Products;

namespace Firmeza.Application.Services.Products;

public interface IProductService
{
    Task<Result<PagedResponse<ProductResponse>>> ListAsync(ProductQuery query, CancellationToken cancellationToken = default);

    Task<Result<ProductResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Result<ProductResponse>> CreateAsync(ProductRequest request, CancellationToken cancellationToken = default);

    Task<Result<ProductResponse>> UpdateAsync(Guid id, ProductRequest request, CancellationToken cancellationToken = default);

    Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
