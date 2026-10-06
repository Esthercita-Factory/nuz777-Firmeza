using Firmeza.Application.Abstractions;
using Firmeza.Application.Common;
using Firmeza.Domain.Entities;
using Firmeza.Domain.Enums;
using Firmeza.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Firmeza.Infrastructure.Repositories;

public sealed class CustomerRequestRepository : ICustomerRequestRepository
{
    private readonly ApplicationDbContext _db;

    public CustomerRequestRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<CustomerSignupRequest>> ListAsync(
        CustomerRequestFilter filter,
        PageRequest page,
        CancellationToken cancellationToken = default)
    {
        var query = _db.CustomerRequests.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(filter.Term))
        {
            var term = filter.Term;
            query = query.Where(request =>
                request.FullName.Contains(term) ||
                request.Document.Contains(term) ||
                request.Email.Contains(term));
        }

        if (filter.Status is not null)
        {
            query = query.Where(request => request.Status == filter.Status);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(request => request.CreatedAt)
            .Skip(page.Skip)
            .Take(page.Take)
            .ToListAsync(cancellationToken);

        return new PagedResult<CustomerSignupRequest> { Items = items, TotalCount = totalCount };
    }

    public async Task<CustomerSignupRequest?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await _db.CustomerRequests.FirstOrDefaultAsync(request => request.Id == id, cancellationToken);

    public Task<bool> DocumentExistsAsync(string document, CancellationToken cancellationToken = default)
        => _db.CustomerRequests.AnyAsync(request => request.Document == document, cancellationToken);

    public Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default)
        => _db.CustomerRequests.AnyAsync(request => request.Email == email, cancellationToken);

    public async Task AddAsync(CustomerSignupRequest request, CancellationToken cancellationToken = default)
        => await _db.CustomerRequests.AddAsync(request, cancellationToken);
}