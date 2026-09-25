using Firmeza.Application.Abstractions;
using Firmeza.Application.Common;
using Firmeza.Domain.Entities;
using Firmeza.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Firmeza.Infrastructure.Repositories;

public sealed class CustomerRepository : ICustomerRepository
{
    private readonly ApplicationDbContext _db;

    public CustomerRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<Customer>> ListAsync(CustomerFilter filter, PageRequest page, CancellationToken cancellationToken = default)
    {
        var query = ApplyFilter(_db.Customers.AsNoTracking(), filter);
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(customer => customer.IsActive)
            .ThenBy(customer => customer.FullName)
            .Skip(page.Skip)
            .Take(page.Take)
            .ToListAsync(cancellationToken);

        return new PagedResult<Customer> { Items = items, TotalCount = totalCount };
    }

    public Task<Customer?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => _db.Customers.FirstOrDefaultAsync(customer => customer.Id == id, cancellationToken);

    public Task<bool> DocumentExistsAsync(string document, Guid? excludedId = null, CancellationToken cancellationToken = default)
        => _db.Customers.AnyAsync(customer => customer.Document == document && (excludedId == null || customer.Id != excludedId), cancellationToken);

    public Task<bool> EmailExistsAsync(string email, Guid? excludedId = null, CancellationToken cancellationToken = default)
        => _db.Customers.AnyAsync(customer => customer.Email == email && (excludedId == null || customer.Id != excludedId), cancellationToken);

    public Task<bool> HasSalesAsync(Guid id, CancellationToken cancellationToken = default)
        => _db.Sales.AnyAsync(sale => sale.CustomerId == id, cancellationToken);

    public async Task AddAsync(Customer customer, CancellationToken cancellationToken = default)
    {
        await _db.Customers.AddAsync(customer, cancellationToken);
    }

    public void Remove(Customer customer) => _db.Customers.Remove(customer);

    private static IQueryable<Customer> ApplyFilter(IQueryable<Customer> query, CustomerFilter filter)
    {
        if (!string.IsNullOrWhiteSpace(filter.Term))
        {
            var term = filter.Term;
            query = query.Where(customer =>
                customer.FullName.Contains(term)
                || customer.Document.Contains(term)
                || customer.Email.Contains(term));
        }

        return filter.OnlyActive ? query.Where(customer => customer.IsActive) : query;
    }
}
