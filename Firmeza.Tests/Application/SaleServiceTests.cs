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

    [Fact]
    public async Task GetByIdAsync_ReturnsTaxesThatAddUpToTheTotal()
    {
        var sale = new Sale
        {
            Id = Guid.NewGuid(),
            SaleNumber = "VTA-20260314-ABC123",
            Customer = _customer,
            Total = 325000m,
            Status = SaleStatus.Confirmed,
            Details = []
        };
        _sales.FindWithDetailsAsync(sale.Id, Arg.Any<CancellationToken>()).Returns(sale);

        var result = await _sut.GetByIdAsync(sale.Id);

        Assert.True(result.IsSuccess);
        var taxes = result.Value!.Taxes;
        Assert.Equal(0.19m, taxes.Rate);
        // El panel ya no recalcula: base + IVA tiene que cuadrar con el total.
        Assert.Equal(sale.Total, taxes.SubtotalBase + taxes.Tax);
        Assert.Equal(325000m, taxes.SubtotalBase + taxes.Tax);
    }

    [Fact]
    public async Task CreateAsync_ReturnsTaxesInTheResponse()
    {
        var product = Product(stock: 10, price: 32500m);
        _customers.FindByIdAsync(_customer.Id, Arg.Any<CancellationToken>()).Returns(_customer);
        _products.FindByIdsForUpdateAsync(Arg.Any<IReadOnlyCollection<Guid>>(), Arg.Any<CancellationToken>()).Returns([product]);

        var result = await _sut.CreateAsync(new SaleRequest
        {
            CustomerId = _customer.Id,
            Lines = [new SaleLineRequest { ProductId = product.Id, Quantity = 10 }]
        });

        Assert.True(result.IsSuccess);
        Assert.Equal(325000m, result.Value!.Total);
        Assert.Equal(result.Value.Total, result.Value.Taxes.SubtotalBase + result.Value.Taxes.Tax);
    }

    [Fact]
    public async Task DeleteAsync_RestoresStockAndRemovesSale()
    {
        var product = Product(stock: 4);
        var sale = PendingSale((product.Id, 3));
        _sales.FindByIdForUpdateAsync(sale.Id, Arg.Any<CancellationToken>()).Returns(sale);
        _products.FindByIdsForUpdateAsync(Arg.Any<IReadOnlyCollection<Guid>>(), Arg.Any<CancellationToken>()).Returns([product]);

        var result = await _sut.DeleteAsync(sale.Id);

        Assert.True(result.IsSuccess);
        Assert.Equal(7, product.Stock);
        _sales.Received(1).Remove(sale);
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
        Assert.True(_transaction.Committed);
    }

    [Fact]
    public async Task DeleteAsync_SumsQuantitiesOfRepeatedProducts()
    {
        var product = Product(stock: 0);
        var sale = PendingSale((product.Id, 2), (product.Id, 5));
        _sales.FindByIdForUpdateAsync(sale.Id, Arg.Any<CancellationToken>()).Returns(sale);
        _products.FindByIdsForUpdateAsync(Arg.Any<IReadOnlyCollection<Guid>>(), Arg.Any<CancellationToken>()).Returns([product]);

        var result = await _sut.DeleteAsync(sale.Id);

        Assert.True(result.IsSuccess);
        Assert.Equal(7, product.Stock);
        await _products.Received(1).FindByIdsForUpdateAsync(
            Arg.Is<IReadOnlyCollection<Guid>>(ids => ids.Single() == product.Id),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DeleteAsync_RejectsDeliveredSale()
    {
        var product = Product(stock: 4);
        var sale = PendingSale((product.Id, 3));
        sale.Status = SaleStatus.Delivered;
        _sales.FindByIdForUpdateAsync(sale.Id, Arg.Any<CancellationToken>()).Returns(sale);
        _products.FindByIdsForUpdateAsync(Arg.Any<IReadOnlyCollection<Guid>>(), Arg.Any<CancellationToken>()).Returns([product]);

        var result = await _sut.DeleteAsync(sale.Id);

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorCode.BusinessRule, result.Error!.Code);
        Assert.Equal(4, product.Stock);
        _sales.DidNotReceive().Remove(Arg.Any<Sale>());
        await _unitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DeleteAsync_ReturnsNotFoundWhenSaleDoesNotExist()
    {
        _sales.FindByIdForUpdateAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns((Sale?)null);

        var result = await _sut.DeleteAsync(Guid.NewGuid());

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorCode.NotFound, result.Error!.Code);
        _sales.DidNotReceive().Remove(Arg.Any<Sale>());
    }

    [Fact]
    public async Task UpdateAsync_ReturnsTheQuantityItHadConsumedToStock()
    {
        var product = Product(stock: 5); // 10 comprados menos 5 de esta venta
        var sale = PendingSale((product.Id, 5));
        _customers.FindByIdAsync(_customer.Id, Arg.Any<CancellationToken>()).Returns(_customer);
        _sales.FindByIdForUpdateAsync(sale.Id, Arg.Any<CancellationToken>()).Returns(sale);
        _products.FindByIdsForUpdateAsync(Arg.Any<IReadOnlyCollection<Guid>>(), Arg.Any<CancellationToken>()).Returns([product]);

        var result = await _sut.UpdateAsync(sale.Id, new SaleRequest
        {
            CustomerId = _customer.Id,
            Lines = [new SaleLineRequest { ProductId = product.Id, Quantity = 8 }]
        });

        Assert.True(result.IsSuccess);
        // 5 + 5 devueltos - 8 nuevos = 2
        Assert.Equal(2, product.Stock);
        Assert.Equal(8, result.Value!.Lines.Single().Quantity);
        Assert.Equal(80m, result.Value.Total);
        Assert.True(_transaction.Committed);
    }

    [Fact]
    public async Task UpdateAsync_RemovesLinesNoLongerPresent()
    {
        var cemento = Product(stock: 90);
        var ladrillo = new Product { Id = Guid.NewGuid(), Sku = "LAD-004", Name = "Ladrillo", Price = 5m, Stock = 40, IsActive = true };
        var sale = PendingSale((cemento.Id, 10), (ladrillo.Id, 8));
        _customers.FindByIdAsync(_customer.Id, Arg.Any<CancellationToken>()).Returns(_customer);
        _sales.FindByIdForUpdateAsync(sale.Id, Arg.Any<CancellationToken>()).Returns(sale);
        _products.FindByIdsForUpdateAsync(Arg.Any<IReadOnlyCollection<Guid>>(), Arg.Any<CancellationToken>()).Returns([cemento, ladrillo]);

        var result = await _sut.UpdateAsync(sale.Id, new SaleRequest
        {
            CustomerId = _customer.Id,
            Lines = [new SaleLineRequest { ProductId = cemento.Id, Quantity = 4 }]
        });

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value!.Lines);
        // Cemento: 90 + 10 - 4 = 96. Ladrillo: se devuelve todo, 40 + 8 = 48.
        Assert.Equal(96, cemento.Stock);
        Assert.Equal(48, ladrillo.Stock);
    }

    [Fact]
    public async Task UpdateAsync_RejectsDeliveredSale()
    {
        var product = Product(stock: 5);
        var sale = PendingSale((product.Id, 5));
        sale.Status = SaleStatus.Delivered;
        _customers.FindByIdAsync(_customer.Id, Arg.Any<CancellationToken>()).Returns(_customer);
        _sales.FindByIdForUpdateAsync(sale.Id, Arg.Any<CancellationToken>()).Returns(sale);
        _products.FindByIdsForUpdateAsync(Arg.Any<IReadOnlyCollection<Guid>>(), Arg.Any<CancellationToken>()).Returns([product]);

        var result = await _sut.UpdateAsync(sale.Id, new SaleRequest
        {
            CustomerId = _customer.Id,
            Lines = [new SaleLineRequest { ProductId = product.Id, Quantity = 1 }]
        });

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorCode.BusinessRule, result.Error!.Code);
        Assert.Equal(5, product.Stock);
        Assert.True(_transaction.RolledBack);
        await _unitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateAsync_RollsBackWhenStockIsInsufficient()
    {
        var product = Product(stock: 2);
        var sale = PendingSale((product.Id, 5));
        _customers.FindByIdAsync(_customer.Id, Arg.Any<CancellationToken>()).Returns(_customer);
        _sales.FindByIdForUpdateAsync(sale.Id, Arg.Any<CancellationToken>()).Returns(sale);
        _products.FindByIdsForUpdateAsync(Arg.Any<IReadOnlyCollection<Guid>>(), Arg.Any<CancellationToken>()).Returns([product]);

        // Se devuelven 5 (stock 7) y se piden 9: no alcanza.
        var result = await _sut.UpdateAsync(sale.Id, new SaleRequest
        {
            CustomerId = _customer.Id,
            Lines = [new SaleLineRequest { ProductId = product.Id, Quantity = 9 }]
        });

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorCode.BusinessRule, result.Error!.Code);
        Assert.True(_transaction.RolledBack);
        await _unitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateAsync_KeepsCurrentStatusWhenRequestDoesNotSendOne()
    {
        var product = Product(stock: 5);
        var sale = PendingSale((product.Id, 5));
        sale.Status = SaleStatus.Confirmed;
        _customers.FindByIdAsync(_customer.Id, Arg.Any<CancellationToken>()).Returns(_customer);
        _sales.FindByIdForUpdateAsync(sale.Id, Arg.Any<CancellationToken>()).Returns(sale);
        _products.FindByIdsForUpdateAsync(Arg.Any<IReadOnlyCollection<Guid>>(), Arg.Any<CancellationToken>()).Returns([product]);

        var result = await _sut.UpdateAsync(sale.Id, new SaleRequest
        {
            CustomerId = _customer.Id,
            Status = null,
            Lines = [new SaleLineRequest { ProductId = product.Id, Quantity = 2 }]
        });

        Assert.True(result.IsSuccess);
        Assert.Equal(SaleStatus.Confirmed, result.Value!.Status);
    }

    private Sale PendingSale(params (Guid ProductId, int Quantity)[] lines)
        => new()
        {
            Id = Guid.NewGuid(),
            SaleNumber = "VTA-20260314-ABC123",
            Customer = _customer,
            Total = 30m,
            Status = SaleStatus.Pending,
            Details = lines
                .Select(line => new SaleDetail { ProductId = line.ProductId, Quantity = line.Quantity })
                .ToList()
        };
}
