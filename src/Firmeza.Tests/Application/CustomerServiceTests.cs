using Firmeza.Application.Common;
using Firmeza.Application.Dtos.Customers;
using Firmeza.Application.Services.Customers;
using Firmeza.Domain.Entities;
using Firmeza.Tests.Common;
using NSubstitute;

namespace Firmeza.Tests.Application;

public class CustomerServiceTests
{
    private readonly ICustomerRepository _customers = TestDoubles.CustomerRepository();
    private readonly IUnitOfWork _unitOfWork = TestDoubles.UnitOfWork(out _);
    private readonly TestClock _clock = new();
    private readonly CustomerService _sut;

    public CustomerServiceTests()
    {
        _sut = new CustomerService(_customers, _unitOfWork, _clock);
    }

    [Fact]
    public async Task CreateAsync_LowercasesEmailAndTrimsFields()
    {
        _customers.DocumentExistsAsync("900123", null, Arg.Any<CancellationToken>()).Returns(false);
        _customers.EmailExistsAsync("ana@correo.com", null, Arg.Any<CancellationToken>()).Returns(false);

        var result = await _sut.CreateAsync(new CustomerRequest
        {
            Document = " 900123 ",
            FullName = " Ana Ruiz ",
            Age = 30,
            Email = " ANA@Correo.COM ",
            Phone = " 3001234567 ",
            Address = "   "
        });

        Assert.True(result.IsSuccess);
        Assert.Equal("900123", result.Value!.Document);
        Assert.Equal("Ana Ruiz", result.Value.FullName);
        Assert.Equal("ana@correo.com", result.Value.Email);
        Assert.Equal("3001234567", result.Value.Phone);
        Assert.Null(result.Value.Address);
        Assert.Equal(_clock.UtcNow, result.Value.CreatedAt);
    }

    [Fact]
    public async Task CreateAsync_ReturnsConflictWhenDocumentAlreadyExists()
    {
        _customers.DocumentExistsAsync("900123", null, Arg.Any<CancellationToken>()).Returns(true);

        var result = await _sut.CreateAsync(new CustomerRequest
        {
            Document = "900123",
            FullName = "Ana Ruiz",
            Age = 30,
            Email = "ana@correo.com",
            Phone = "3001234567"
        });

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorCode.Conflict, result.Error!.Code);
    }

    [Fact]
    public async Task CreateAsync_ReturnsConflictWhenEmailAlreadyExists()
    {
        _customers.DocumentExistsAsync("900123", null, Arg.Any<CancellationToken>()).Returns(false);
        _customers.EmailExistsAsync("ana@correo.com", null, Arg.Any<CancellationToken>()).Returns(true);

        var result = await _sut.CreateAsync(new CustomerRequest
        {
            Document = "900123",
            FullName = "Ana Ruiz",
            Age = 30,
            Email = "ana@correo.com",
            Phone = "3001234567"
        });

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorCode.Conflict, result.Error!.Code);
    }

    [Fact]
    public async Task DeleteAsync_BlocksCustomersWithSales()
    {
        var id = Guid.NewGuid();
        _customers.FindByIdAsync(id, Arg.Any<CancellationToken>()).Returns(new Customer { Id = id });
        _customers.HasSalesAsync(id, Arg.Any<CancellationToken>()).Returns(true);

        var result = await _sut.DeleteAsync(id);

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorCode.Conflict, result.Error!.Code);
    }

    [Fact]
    public async Task DeleteAsync_RemovesCustomerWithoutSales()
    {
        var id = Guid.NewGuid();
        var customer = new Customer { Id = id };
        _customers.FindByIdAsync(id, Arg.Any<CancellationToken>()).Returns(customer);
        _customers.HasSalesAsync(id, Arg.Any<CancellationToken>()).Returns(false);

        var result = await _sut.DeleteAsync(id);

        Assert.True(result.IsSuccess);
        _customers.Received(1).Remove(customer);
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
