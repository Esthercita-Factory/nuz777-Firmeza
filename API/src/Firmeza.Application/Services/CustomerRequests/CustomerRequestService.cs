using Firmeza.Application.Abstractions;
using Firmeza.Application.Common;
using Firmeza.Application.Dtos.CustomerRequests;
using Firmeza.Domain.Entities;
using Firmeza.Domain.Enums;

namespace Firmeza.Application.Services.CustomerRequests;

public sealed class CustomerRequestService : ICustomerRequestService
{
    private readonly ICustomerRequestRepository _requests;
    private readonly ICustomerRepository _customers;
    private readonly ICurrentUserService _currentUser;
    private readonly IClock _clock;
    private readonly IUnitOfWork _unitOfWork;

    public CustomerRequestService(
        ICustomerRequestRepository requests,
        ICustomerRepository customers,
        ICurrentUserService currentUser,
        IClock clock,
        IUnitOfWork unitOfWork)
    {
        _requests = requests;
        _customers = customers;
        _currentUser = currentUser;
        _clock = clock;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<PagedResponse<CustomerRequestResponse>>> ListAsync(
        CustomerRequestQuery query,
        CancellationToken cancellationToken = default)
    {
        var page = new PageRequest { Page = query.Page, PageSize = query.PageSize };
        var result = await _requests.ListAsync(new CustomerRequestFilter(query.Q?.Trim(), query.Status), page, cancellationToken);

        return Result.Success(new PagedResponse<CustomerRequestResponse>
        {
            Items = result.Items.Select(ToResponse).ToList(),
            Page = page.Page,
            PageSize = page.Take,
            TotalCount = result.TotalCount
        });
    }

    public async Task<Result<CustomerRequestReviewResponse>> ApproveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync(cancellationToken);

        var request = await _requests.FindByIdAsync(id, cancellationToken);
        if (request is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Result.Failure<CustomerRequestReviewResponse>(Error.EntityNotFound("Solicitud", id));
        }

        if (request.Status != CustomerRequestStatus.Pending)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Result.Failure<CustomerRequestReviewResponse>(
                Error.BusinessRule($"La solicitud ya fue revisada ({request.Status})."));
        }

        // El documento pudo haberse tomado como cliente desde el panel mientras
        // la solicitud estava pendiente.
        if (await _customers.DocumentExistsAsync(request.Document, null, cancellationToken))
        {
            await transaction.RollbackAsync(cancellationToken);
            return Result.Failure<CustomerRequestReviewResponse>(
                Error.Conflict($"Ya existe un cliente con el documento {request.Document}."));
        }

        var now = _clock.UtcNow;
        var customer = new Customer
        {
            Document = request.Document,
            FullName = request.FullName,
            Age = request.Age,
            Email = request.Email,
            Phone = request.Phone,
            Address = request.Address,
            IsActive = true,
            CreatedAt = now
        };

        // El Id lo genera la base (gen_random_uuid). Hay que Insertar primero para
// que EF lo traiga de vuelta con RETURNING: si se asigna el CustomerId antes
// de que exista la fila en customers, la FK se viola.
        await _customers.AddAsync(customer, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        request.Status = CustomerRequestStatus.Approved;
        request.ReviewedAt = now;
        request.ReviewedByUserId = _currentUser.UserId;
        request.CustomerId = customer.Id;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return Result.Success(new CustomerRequestReviewResponse(
            request.Id,
            request.Status,
            customer.Id,
            $"Solicitud aprobada. {customer.FullName} ya aparece en la lista de clientes."));
    }

    public async Task<Result<CustomerRequestReviewResponse>> RejectAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var request = await _requests.FindByIdAsync(id, cancellationToken);
        if (request is null)
        {
            return Result.Failure<CustomerRequestReviewResponse>(Error.EntityNotFound("Solicitud", id));
        }

        if (request.Status != CustomerRequestStatus.Pending)
        {
            return Result.Failure<CustomerRequestReviewResponse>(
                Error.BusinessRule($"La solicitud ya fue revisada ({request.Status})."));
        }

        request.Status = CustomerRequestStatus.Rejected;
        request.ReviewedAt = _clock.UtcNow;
        request.ReviewedByUserId = _currentUser.UserId;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(new CustomerRequestReviewResponse(
            request.Id,
            request.Status,
            null,
            $"Solicitud descartada. {request.FullName} no fue agregado a la lista de clientes."));
    }

    private static CustomerRequestResponse ToResponse(CustomerSignupRequest request) => new(
        request.Id,
        request.UserId,
        request.Document,
        request.FullName,
        request.Age,
        request.Email,
        request.Phone,
        request.Address,
        request.Status,
        request.CreatedAt,
        request.ReviewedAt,
        request.ReviewedByUserId,
        request.CustomerId);
}