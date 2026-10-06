using Firmeza.Application.Abstractions;
using Firmeza.Application.Common;
using Firmeza.Application.Dtos.Customers;
using Firmeza.Domain.Entities;

namespace Firmeza.Application.Services.Customers;

public interface ICustomerService
{
    Task<Result<PagedResponse<CustomerResponse>>> ListAsync(CustomerQuery query, CancellationToken cancellationToken = default);

    Task<Result<CustomerResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Result<CustomerResponse>> CreateAsync(CustomerRequest request, CancellationToken cancellationToken = default);

    Task<Result<CustomerResponse>> UpdateAsync(Guid id, CustomerRequest request, CancellationToken cancellationToken = default);

    Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
