using Firmeza.Application.Abstractions;
using Firmeza.Application.Common;
using Firmeza.Application.Dtos.CustomerRequests;
using Firmeza.Application.Services.CustomerRequests;
using Firmeza.Domain.Entities;
using Firmeza.Domain.Enums;
using Firmeza.Tests.Common;
using NSubstitute;

namespace Firmeza.Tests.Application;

public class CustomerRequestServiceTests
{
    private readonly ICustomerRequestRepository _requests = TestDoubles.CustomerSignupRepository();
    private readonly ICustomerRepository _customers = TestDoubles.CustomerRepository();
    private readonly ICurrentUserService _currentUser = TestDoubles.CurrentUser("admin-1");
    private readonly TestTransactionScope _transaction = new();
    private readonly IUnitOfWork _unitOfWork;
    private readonly TestClock _clock = new();
    private readonly CustomerRequestService _sut;

    public CustomerRequestServiceTests()
    {
        var unitOfWork = Substitute.For<IUnitOfWork>();
        unitOfWork.BeginTransactionAsync(Arg.Any<CancellationToken>()).Returns(_transaction);
        _unitOfWork = unitOfWork;
        _sut = new CustomerRequestService(_requests, _customers, _currentUser, _clock, _unitOfWork);
    }

    private CustomerSignupRequest Pending(string? document = null) => new()
    {
        Id = Guid.NewGuid(),
        UserId = "user-9",
        Document = document ?? "901234567",
        FullName = "Luis Torres",
        Age = 34,
        Email = "luis@correo.com",
        Phone = "3001112233",
        Address = "Cra 10 #20-30",
        Status = CustomerRequestStatus.Pending,
        CreatedAt = _clock.UtcNow
    };

    [Fact]
    public async Task ListAsync_ReturnsOnlyTheRequestedStatus()
    {
        var solicitud = Pending();
        _requests
            .ListAsync(
                Arg.Is<CustomerRequestFilter>(f => f.Status == CustomerRequestStatus.Pending && f.Term == null),
                Arg.Any<PageRequest>(),
                Arg.Any<CancellationToken>())
            .Returns(new PagedResult<CustomerSignupRequest> { Items = [solicitud], TotalCount = 1 });

        var result = await _sut.ListAsync(new CustomerRequestQuery { Status = CustomerRequestStatus.Pending });

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value!.Items);
        Assert.Equal("Luis Torres", result.Value.Items[0].FullName);
        Assert.Equal(CustomerRequestStatus.Pending, result.Value.Items[0].Status);
        Assert.Equal(1, result.Value.TotalCount);
        Assert.Equal(1, result.Value.Page);
        Assert.Equal(20, result.Value.PageSize);
    }

    [Fact]
    public async Task ListAsync_TrimsTheSearchTerm()
    {
        _requests
            .ListAsync(Arg.Any<CustomerRequestFilter>(), Arg.Any<PageRequest>(), Arg.Any<CancellationToken>())
            .Returns(new PagedResult<CustomerSignupRequest> { Items = [], TotalCount = 0 });

        await _sut.ListAsync(new CustomerRequestQuery { Q = "  901234567  " });

        await _requests.Received(1).ListAsync(
            Arg.Is<CustomerRequestFilter>(f => f.Term == "901234567"),
            Arg.Any<PageRequest>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ListAsync_ForwardsTheRequestedPage()
    {
        _requests
            .ListAsync(Arg.Any<CustomerRequestFilter>(), Arg.Any<PageRequest>(), Arg.Any<CancellationToken>())
            .Returns(new PagedResult<CustomerSignupRequest> { Items = [], TotalCount = 47 });

        var result = await _sut.ListAsync(new CustomerRequestQuery { Page = 3, PageSize = 20 });

        Assert.Equal(3, result.Value!.Page);
        Assert.Equal(20, result.Value.PageSize);
        Assert.Equal(47, result.Value.TotalCount);
        // 47 registros en paginas de 20 -> 3 paginas.
        Assert.Equal(3, result.Value.TotalPages);

        await _requests.Received(1).ListAsync(
            Arg.Any<CustomerRequestFilter>(),
            Arg.Is<PageRequest>(p => p.Page == 3 && p.Take == 20),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ApproveAsync_CreatesTheCustomerAndMarksTheRequest()
    {
        var solicitud = Pending();
        _requests.FindByIdAsync(solicitud.Id, Arg.Any<CancellationToken>()).Returns(solicitud);
        _customers.DocumentExistsAsync(solicitud.Document, null, Arg.Any<CancellationToken>()).Returns(false);

        var result = await _sut.ApproveAsync(solicitud.Id);

        Assert.True(result.IsSuccess);
        Assert.Equal(CustomerRequestStatus.Approved, result.Value!.Status);
        Assert.NotNull(result.Value.CustomerId);

        await _customers.Received(1).AddAsync(
            Arg.Is<Customer>(c =>
                c.Document == solicitud.Document &&
                c.FullName == solicitud.FullName &&
                c.Age == solicitud.Age &&
                c.Phone == solicitud.Phone &&
                c.IsActive),
            Arg.Any<CancellationToken>());

        // El Id del cliente lo genera la base, por eso hay dos guardados:
        // uno para insertar el cliente y otro para colgarlo de la solicitud.
        await _unitOfWork.Received(2).SaveChangesAsync(Arg.Any<CancellationToken>());
        Assert.Equal(CustomerRequestStatus.Approved, solicitud.Status);
        Assert.Equal("admin-1", solicitud.ReviewedByUserId);
        Assert.NotNull(solicitud.CustomerId);
        Assert.Equal(_clock.UtcNow, solicitud.ReviewedAt);
        Assert.True(_transaction.Committed);
    }

    [Fact]
    public async Task ApproveAsync_RejectsWhenTheDocumentIsAlreadyTakenByACustomer()
    {
        var solicitud = Pending();
        _requests.FindByIdAsync(solicitud.Id, Arg.Any<CancellationToken>()).Returns(solicitud);
        _customers.DocumentExistsAsync(solicitud.Document, null, Arg.Any<CancellationToken>()).Returns(true);

        var result = await _sut.ApproveAsync(solicitud.Id);

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorCode.Conflict, result.Error!.Code);
        Assert.Equal(CustomerRequestStatus.Pending, solicitud.Status);
        await _customers.DidNotReceive().AddAsync(Arg.Any<Customer>(), Arg.Any<CancellationToken>());
        Assert.True(_transaction.RolledBack);
    }

    [Fact]
    public async Task ApproveAsync_RejectsWhenTheRequestWasAlreadyReviewed()
    {
        var solicitud = Pending();
        solicitud.Status = CustomerRequestStatus.Rejected;
        _requests.FindByIdAsync(solicitud.Id, Arg.Any<CancellationToken>()).Returns(solicitud);

        var result = await _sut.ApproveAsync(solicitud.Id);

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorCode.BusinessRule, result.Error!.Code);
        await _customers.DidNotReceive().AddAsync(Arg.Any<Customer>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ApproveAsync_ReturnsNotFoundWhenTheRequestDoesNotExist()
    {
        _requests.FindByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns((CustomerSignupRequest?)null);

        var result = await _sut.ApproveAsync(Guid.NewGuid());

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorCode.NotFound, result.Error!.Code);
    }

    [Fact]
    public async Task RejectAsync_MarksRejectedAndDoesNotCreateTheCustomer()
    {
        var solicitud = Pending();
        _requests.FindByIdAsync(solicitud.Id, Arg.Any<CancellationToken>()).Returns(solicitud);

        var result = await _sut.RejectAsync(solicitud.Id);

        Assert.True(result.IsSuccess);
        Assert.Equal(CustomerRequestStatus.Rejected, result.Value!.Status);
        Assert.Null(result.Value.CustomerId);
        Assert.Equal(CustomerRequestStatus.Rejected, solicitud.Status);
        Assert.Equal(_clock.UtcNow, solicitud.ReviewedAt);
        await _customers.DidNotReceive().AddAsync(Arg.Any<Customer>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task RejectAsync_RejectsWhenTheRequestWasAlreadyReviewed()
    {
        var solicitud = Pending();
        solicitud.Status = CustomerRequestStatus.Approved;
        _requests.FindByIdAsync(solicitud.Id, Arg.Any<CancellationToken>()).Returns(solicitud);

        var result = await _sut.RejectAsync(solicitud.Id);

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorCode.BusinessRule, result.Error!.Code);
        await _unitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}