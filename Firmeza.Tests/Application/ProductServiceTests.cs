using Firmeza.Application.Common;
using Firmeza.Application.Dtos.Products;
using Firmeza.Application.Services.Products;
using Firmeza.Domain.Entities;
using Firmeza.Tests.Common;
using NSubstitute;

namespace Firmeza.Tests.Application;

public class ProductServiceTests
{
    private readonly IProductRepository _products = TestDoubles.ProductRepository();
    private readonly IUnitOfWork _unitOfWork = TestDoubles.UnitOfWork(out _);
    private readonly TestClock _clock = new();
    private readonly ProductService _sut;

    public ProductServiceTests()
    {
        _sut = new ProductService(_products, _unitOfWork, _clock);
    }

    [Fact]
    public async Task CreateAsync_NormalizesSkuAndStampsCreatedAt()
    {
        _products.SkuExistsAsync("LLA-001", null, Arg.Any<CancellationToken>()).Returns(false);

        var result = await _sut.CreateAsync(new ProductRequest
        {
            Sku = "  lla-001 ",
            Name = " Ladrillo ",
            Category = " Mamposteria ",
            Unit = " Unidad ",
            Price = 1250.50m,
            Stock = 100
        });

        Assert.True(result.IsSuccess);
        Assert.Equal("LLA-001", result.Value!.Sku);
        Assert.Equal("Ladrillo", result.Value.Name);
        Assert.Equal(_clock.UtcNow, result.Value.CreatedAt);

        await _products.Received(1).AddAsync(
            Arg.Is<Product>(p => p.Sku == "LLA-001" && p.Name == "Ladrillo" && p.Description == null),
            Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CreateAsync_ReturnsConflictWhenSkuExists()
    {
        _products.SkuExistsAsync("LLA-001", null, Arg.Any<CancellationToken>()).Returns(true);

        var result = await _sut.CreateAsync(new ProductRequest
        {
            Sku = "lla-001",
            Name = "Ladrillo",
            Category = "Mamposteria",
            Price = 1000m
        });

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorCode.Conflict, result.Error!.Code);
        await _unitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNotFoundWhenMissing()
    {
        var id = Guid.NewGuid();
        _products.FindByIdAsync(id, Arg.Any<CancellationToken>()).Returns((Product?)null);

        var result = await _sut.GetByIdAsync(id);

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorCode.NotFound, result.Error!.Code);
    }

    [Fact]
    public async Task UpdateAsync_ExcludesItselfFromSkuUniquenessCheck()
    {
        var id = Guid.NewGuid();
        var product = new Product { Id = id, Sku = "LLA-001", Name = "Ladrillo", Category = "Mamposteria", Unit = "Unidad", Price = 10m };
        _products.FindByIdAsync(id, Arg.Any<CancellationToken>()).Returns(product);
        _products.SkuExistsAsync("LLA-001", id, Arg.Any<CancellationToken>()).Returns(false);

        var result = await _sut.UpdateAsync(id, new ProductRequest
        {
            Sku = "lla-001",
            Name = "Ladrillo hueco",
            Category = "Mamposteria",
            Unit = "Unidad",
            Price = 20m,
            Stock = 5
        });

        Assert.True(result.IsSuccess);
        Assert.Equal("Ladrillo hueco", product.Name);
        Assert.Equal(_clock.UtcNow, product.UpdatedAt);
    }

    [Fact]
    public async Task DeleteAsync_ReturnsConflictWhenProductHasSales()
    {
        var id = Guid.NewGuid();
        _products.FindByIdAsync(id, Arg.Any<CancellationToken>()).Returns(new Product { Id = id });
        _products.HasSalesAsync(id, Arg.Any<CancellationToken>()).Returns(true);

        var result = await _sut.DeleteAsync(id);

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorCode.Conflict, result.Error!.Code);
        _products.DidNotReceive().Remove(Arg.Any<Product>());
    }

    [Fact]
    public async Task DeleteAsync_IsIdempotentWhenProductMissing()
    {
        var id = Guid.NewGuid();
        _products.FindByIdAsync(id, Arg.Any<CancellationToken>()).Returns((Product?)null);

        var result = await _sut.DeleteAsync(id);

        Assert.True(result.IsSuccess);
        await _unitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ListAsync_MapsPagingMetadata()
    {
        _products.ListAsync(Arg.Any<ProductFilter>(), Arg.Any<PageRequest>(), Arg.Any<CancellationToken>())
            .Returns(new PagedResult<Product> { Items = [new Product { Id = Guid.NewGuid(), Sku = "A", Name = "A" }], TotalCount = 41 });

        var result = await _sut.ListAsync(new ProductQuery { Page = 2, PageSize = 10 });

        Assert.True(result.IsSuccess);
        Assert.Equal(41, result.Value!.TotalCount);
        Assert.Equal(2, result.Value.Page);
        Assert.Equal(10, result.Value.PageSize);
        Assert.Single(result.Value.Items);
    }
}
