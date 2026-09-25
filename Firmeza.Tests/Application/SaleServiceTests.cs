using Firmeza.Application.Common;
using Firmeza.Application.Dtos.Sales;
using Firmeza.Application.Services.Sales;
using Firmeza.Domain.Entities;
using Firmeza.Domain.Enums;
using Firmeza.Tests.Common;
using NSubstitute;

namespace Firmeza.Tests.Application;

public class SaleServiceTests
{
    private readonly ISaleRepository _sales = TestDoubles.SaleRepository();
    private readonly IProductRepository _products = TestDoubles.ProductRepository();
    private readonly ICustomerRepository _customers = TestDoubles.CustomerRepository();
    private readonly ICurrentUserService _currentUser = TestDoubles.CurrentUser();
    private readonly TestTransactionScope _transaction = new();
    private readonly IUnitOfWork _unitOfWork;
    private readonly TestClock _clock = new();
    private readonly SaleService _sut;

    private readonly Customer _customer = new() { Id = Guid.NewGuid(), FullName = "Ana Ruiz", Document = "900123", IsActive = true };

    public SaleServiceTests()
    {
        var unitOfWork = Substitute.For<IUnitOfWork>();
        unitOfWork.BeginTransactionAsync(Arg.Any<CancellationToken>()).Returns(_transaction);
        _unitOfWork = unitOfWork;
        _sut = new SaleService(_sales, _products, _customers, _currentUser, _unitOfWork, _clock);
    }

    private Product Product(int stock = 100, decimal price = 10m)
        => new() { Id = Guid.NewGuid(), Sku = "SKU-1", Name = "Cemento", Price = price, Stock = stock, IsActive = true };

    [Fact]
    public async Task CreateAsync_ComputesTotalsAndDecrementsStock()
    {
        var product = Product(stock: 10, price: 12.50m);
        _customers.FindByIdAsync(_customer.Id, Arg.Any<CancellationToken>()).Returns(_customer);
        _products.FindByIdsForUpdateAsync(Arg.Any<IReadOnlyCollection<Guid>>(), Arg.Any<CancellationToken>()).Returns([product]);

        var result = await _sut.CreateAsync(new SaleRequest
        {
            CustomerId = _customer.Id,
            Lines = [new SaleLineRequest { ProductId = product.Id, Quantity = 3 }]
        });

        Assert.True(result.IsSuccess);
        Assert.Equal(37.50m, result.Value!.Total);
        Assert.Equal(SaleStatus.Pending, result.Value.Status);
        Assert.StartsWith($"VTA-{_clock.UtcNow:yyyyMMdd}-", result.Value.SaleNumber, StringComparison.Ordinal);
        Assert.Equal("user-1", result.Value.CreatedByUserId);
        Assert.Equal(7, product.Stock);
        Assert.True(_transaction.Committed);
    }

    [Fact]
    public async Task CreateAsync_UsesProductPriceWhenUnitPriceIsOmitted()
    {
        var product = Product(price: 99.99m);
        _customers.FindByIdAsync(_customer.Id, Arg.Any<CancellationToken>()).Returns(_customer);
        _products.FindByIdsForUpdateAsync(Arg.Any<IReadOnlyCollection<Guid>>(), Arg.Any<CancellationToken>()).Returns([product]);

        var result = await _sut.CreateAsync(new SaleRequest
        {
            CustomerId = _customer.Id,
            Lines = [new SaleLineRequest { ProductId = product.Id, Quantity = 2 }]
        });

        Assert.Equal(199.98m, result.Value!.Total);
        Assert.Equal(99.99m, result.Value.Lines.Single().UnitPrice);
    }

    [Fact]
    public async Task CreateAsync_MergesRepeatedLinesForTheSameProduct()
    {
        var product = Product(stock: 50, price: 5m);
        _customers.FindByIdAsync(_customer.Id, Arg.Any<CancellationToken>()).Returns(_customer);
        _products.FindByIdsForUpdateAsync(Arg.Any<IReadOnlyCollection<Guid>>(), Arg.Any<CancellationToken>()).Returns([product]);

        var result = await _sut.CreateAsync(new SaleRequest
        {
            CustomerId = _customer.Id,
            Lines =
            [
                new SaleLineRequest { ProductId = product.Id, Quantity = 2 },
                new SaleLineRequest { ProductId = product.Id, Quantity = 3 }
            ]
        });

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value!.Lines);
        Assert.Equal(5, result.Value.Lines[0].Quantity);
        Assert.Equal(25m, result.Value.Total);
        Assert.Equal(45, product.Stock);
    }

    [Fact]
    public async Task CreateAsync_RejectsInsufficientStock()
    {
        var product = Product(stock: 1, price: 5m);
        _customers.FindByIdAsync(_customer.Id, Arg.Any<CancellationToken>()).Returns(_customer);
        _products.FindByIdsForUpdateAsync(Arg.Any<IReadOnlyCollection<Guid>>(), Arg.Any<CancellationToken>()).Returns([product]);

        var result = await _sut.CreateAsync(new SaleRequest
        {
            CustomerId = _customer.Id,
            Lines = [new SaleLineRequest { ProductId = product.Id, Quantity = 4 }]
        });

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorCode.BusinessRule, result.Error!.Code);
        Assert.Equal(1, product.Stock);
        await _sales.DidNotReceive().AddAsync(Arg.Any<Sale>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CreateAsync_RejectsInactiveProduct()
    {
        var product = Product();
        product.IsActive = false;
        _customers.FindByIdAsync(_customer.Id, Arg.Any<CancellationToken>()).Returns(_customer);
        _products.FindByIdsForUpdateAsync(Arg.Any<IReadOnlyCollection<Guid>>(), Arg.Any<CancellationToken>()).Returns([product]);

        var result = await _sut.CreateAsync(new SaleRequest
        {
            CustomerId = _customer.Id,
            Lines = [new SaleLineRequest { ProductId = product.Id, Quantity = 1 }]
        });

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorCode.BusinessRule, result.Error!.Code);
    }

    [Fact]
    public async Task CreateAsync_ReturnsNotFoundWhenCustomerDoesNotExist()
    {
        _customers.FindByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns((Customer?)null);

        var result = await _sut.CreateAsync(new SaleRequest
        {
            CustomerId = Guid.NewGuid(),
            Lines = [new SaleLineRequest { ProductId = Guid.NewGuid(), Quantity = 1 }]
        });

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorCode.NotFound, result.Error!.Code);
    }

    [Fact]
    public async Task CreateAsync_RejectsInactiveCustomer()
    {
        _customer.IsActive = false;
        _customers.FindByIdAsync(_customer.Id, Arg.Any<CancellationToken>()).Returns(_customer);

        var result = await _sut.CreateAsync(new SaleRequest
        {
            CustomerId = _customer.Id,
            Lines = [new SaleLineRequest { ProductId = Guid.NewGuid(), Quantity = 1 }]
        });

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorCode.BusinessRule, result.Error!.Code);
    }

    [Fact]
    public async Task CreateAsync_RequiresAtLeastOneLine()
    {
        var result = await _sut.CreateAsync(new SaleRequest { CustomerId = _customer.Id, Lines = [] });

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorCode.Validation, result.Error!.Code);
    }

    [Fact]
    public async Task GetByIdAsync_IncludesLines()
    {
        var sale = new Sale
        {
            Id = Guid.NewGuid(),
            SaleNumber = "VTA-20260314-ABC123",
            Customer = _customer,
            Total = 15m,
            Status = SaleStatus.Confirmed,
            Details =
            [
                new SaleDetail
                {
                    ProductId = Guid.NewGuid(),
                    Product = new Product { Sku = "SKU-1", Name = "Cemento" },
                    Quantity = 1,
                    UnitPrice = 15m,
                    Subtotal = 15m
                }
            ]
        };
        _sales.FindWithDetailsAsync(sale.Id, Arg.Any<CancellationToken>()).Returns(sale);

        var result = await _sut.GetByIdAsync(sale.Id);

        Assert.True(result.IsSuccess);
        Assert.Equal("Cemento", result.Value!.Lines.Single().ProductName);
        Assert.Equal("Ana Ruiz", result.Value.CustomerName);
    }
}
