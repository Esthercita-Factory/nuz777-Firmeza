using Firmeza.Application.Common;
using Firmeza.Domain.Entities;
using Firmeza.Domain.Enums;

namespace Firmeza.Application.Abstractions;

public sealed record CustomerRequestFilter(string? Term, CustomerRequestStatus? Status);

public interface ICustomerRequestRepository
{
    Task<PagedResult<CustomerSignupRequest>> ListAsync(CustomerRequestFilter filter, PageRequest page, CancellationToken cancellationToken = default);

    Task<CustomerSignupRequest?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>True si ya hay una solicitud (de cualquier estado) con ese documento.</summary>
    Task<bool> DocumentExistsAsync(string document, CancellationToken cancellationToken = default);

    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default);

    Task AddAsync(CustomerSignupRequest request, CancellationToken cancellationToken = default);
}