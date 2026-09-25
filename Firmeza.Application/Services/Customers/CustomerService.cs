using Firmeza.Application.Abstractions;
using Firmeza.Application.Common;
using Firmeza.Application.Dtos.Customers;
using Firmeza.Domain.Entities;

namespace Firmeza.Application.Services.Customers;

public sealed class CustomerService : ICustomerService
{
    private readonly ICustomerRepository _customers;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IClock _clock;

    public CustomerService(ICustomerRepository customers, IUnitOfWork unitOfWork, IClock clock)
    {
        _customers = customers;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    public async Task<Result<PagedResponse<CustomerResponse>>> ListAsync(CustomerQuery query, CancellationToken cancellationToken = default)
    {
        var page = new PageRequest { Page = query.Page, PageSize = query.PageSize };
        var result = await _customers.ListAsync(new CustomerFilter(query.Q?.Trim(), query.OnlyActive), page, cancellationToken);

        return Result.Success(new PagedResponse<CustomerResponse>
        {
            Items = result.Items.Select(ToResponse).ToList(),
            Page = page.Page,
            PageSize = page.Take,
            TotalCount = result.TotalCount
        });
    }

    public async Task<Result<CustomerResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var customer = await _customers.FindByIdAsync(id, cancellationToken);

        return customer is null
            ? Result.Failure<CustomerResponse>(Error.EntityNotFound("Cliente", id))
            : Result.Success(ToResponse(customer));
    }

    public async Task<Result<CustomerResponse>> CreateAsync(CustomerRequest request, CancellationToken cancellationToken = default)
    {
        var document = request.Document.Trim();
        var email = NormalizeEmail(request.Email);

        if (await _customers.DocumentExistsAsync(document, null, cancellationToken))
        {
            return Result.Failure<CustomerResponse>(Error.Conflict("Ya existe un cliente con ese documento."));
        }

        if (await _customers.EmailExistsAsync(email, null, cancellationToken))
        {
            return Result.Failure<CustomerResponse>(Error.Conflict("Ya existe un cliente con ese correo."));
        }

        var customer = new Customer
        {
            Document = document,
            Email = email,
            CreatedAt = _clock.UtcNow
        };

        Apply(request, customer);
        await _customers.AddAsync(customer, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(ToResponse(customer));
    }

    public async Task<Result<CustomerResponse>> UpdateAsync(Guid id, CustomerRequest request, CancellationToken cancellationToken = default)
    {
        var customer = await _customers.FindByIdAsync(id, cancellationToken);
        if (customer is null)
        {
            return Result.Failure<CustomerResponse>(Error.EntityNotFound("Cliente", id));
        }

        var document = request.Document.Trim();
        var email = NormalizeEmail(request.Email);

        if (await _customers.DocumentExistsAsync(document, id, cancellationToken))
        {
            return Result.Failure<CustomerResponse>(Error.Conflict("Ya existe un cliente con ese documento."));
        }

        if (await _customers.EmailExistsAsync(email, id, cancellationToken))
        {
            return Result.Failure<CustomerResponse>(Error.Conflict("Ya existe un cliente con ese correo."));
        }

        Apply(request, customer);
        customer.Document = document;
        customer.Email = email;
        customer.UpdatedAt = _clock.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(ToResponse(customer));
    }

    public async Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var customer = await _customers.FindByIdAsync(id, cancellationToken);
        if (customer is null)
        {
            return Result.Success();
        }

        if (await _customers.HasSalesAsync(id, cancellationToken))
        {
            return Result.Failure(Error.Conflict("No se puede eliminar un cliente que tiene ventas asociadas."));
        }

        _customers.Remove(customer);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    private static void Apply(CustomerRequest request, Customer customer)
    {
        customer.FullName = request.FullName.Trim();
        customer.Age = request.Age;
        customer.Phone = request.Phone.Trim();
        customer.Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim();
        customer.IsActive = request.IsActive;
    }

    private static CustomerResponse ToResponse(Customer customer) => new(
        customer.Id,
        customer.Document,
        customer.FullName,
        customer.Age,
        customer.Email,
        customer.Phone,
        customer.Address,
        customer.IsActive,
        customer.CreatedAt,
        customer.UpdatedAt);
}
