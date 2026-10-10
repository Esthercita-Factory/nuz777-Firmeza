using Firmeza.Application.Abstractions;
using Firmeza.Application.Common;
using Firmeza.Application.Dtos.CustomerRequests;
using Firmeza.Domain.Entities;
using Firmeza.Domain.Enums;

namespace Firmeza.Application.Services.CustomerRequests;

public interface ICustomerRequestService
{
    Task<Result<PagedResponse<CustomerRequestResponse>>> ListAsync(CustomerRequestQuery query, CancellationToken cancellationToken = default);

    Task<Result<CustomerRequestReviewResponse>> ApproveAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Result<CustomerRequestReviewResponse>> RejectAsync(Guid id, CancellationToken cancellationToken = default);
}