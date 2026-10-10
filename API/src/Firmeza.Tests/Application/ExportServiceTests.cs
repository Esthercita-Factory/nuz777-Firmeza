using System.Text;
using Firmeza.Application.Abstractions;
using Firmeza.Application.Services.Exports;
using Firmeza.Domain.Entities;
using Firmeza.Domain.Enums;
using Firmeza.Tests.Common;
using NSubstitute;
using Xunit;

namespace Firmeza.Tests.Application;

public class ExportServiceTests
{
    private readonly IProductRepository _products = Substitute.For<IProductRepository>();
    private readonly ICustomerRepository _customers = Substitute.For<ICustomerRepository>();
    private readonly ISaleRepository _sales = Substitute.For<ISaleRepository>();
    private readonly TestClock _clock = new();
    private readonly ExportService _sut;

    public ExportServiceTests()
    {
        _sut = new ExportService(_products, _customers, _sales, _clock);
    }

    [Fact]
    public async Task ExportProductsToPdfAsync_GeneratesValidPdf()
    {
        _products.GetAllAsync(Arg.Any<CancellationToken>()).Returns(new List<Product>
        {
            new() { Id = Guid.NewGuid(), Name = "Cemento 50kg", Sku = "CEM-001", Price = 45000, Stock = 100, Unit = "Bulto", Category = "Cementos", IsActive = true }
        });

        var bytes = await _sut.ExportProductsToPdfAsync();

        Assert.NotNull(bytes);
        Assert.True(bytes.Length > 100);
        Assert.Equal("%PDF-", Encoding.ASCII.GetString(bytes, 0, 5));
    }

    [Fact]
    public async Task ExportCustomersToPdfAsync_GeneratesValidPdf()
    {
        _customers.GetAllAsync(Arg.Any<CancellationToken>()).Returns(new List<Customer>
        {
            new() { Id = Guid.NewGuid(), FullName = "Constructora Firmeza", Document = "900123456", Email = "obra@firmeza.com", Phone = "3001234567", Address = "Calle 10 # 20", IsActive = true }
        });

        var bytes = await _sut.ExportCustomersToPdfAsync();

        Assert.NotNull(bytes);
        Assert.True(bytes.Length > 100);
        Assert.Equal("%PDF-", Encoding.ASCII.GetString(bytes, 0, 5));
    }

    [Fact]
    public async Task ExportSalesToPdfAsync_GeneratesValidPdf()
    {
        _sales.GetAllWithDetailsAsync(Arg.Any<CancellationToken>()).Returns(new List<Sale>
        {
            new()
            {
                Id = Guid.NewGuid(),
                SaleNumber = "VEN-001",
                SaleDate = DateTimeOffset.UtcNow,
                Status = SaleStatus.Confirmed,
                Total = 150000,
                Customer = new Customer { FullName = "Cliente Prueba", Document = "12345" },
                Details = new List<SaleDetail>
                {
                    new() { Product = new Product { Name = "Tubo PVC", Sku = "PVC-1" }, Quantity = 5, UnitPrice = 30000, Subtotal = 150000 }
                }
            }
        });

        var bytes = await _sut.ExportSalesToPdfAsync();

        Assert.NotNull(bytes);
        Assert.True(bytes.Length > 100);
        Assert.Equal("%PDF-", Encoding.ASCII.GetString(bytes, 0, 5));
    }

    [Fact]
    public async Task ExportSalesToPdfAsync_With25Sales_ChecksOutput()
    {
        var salesList = new List<Sale>();
        for (int i = 1; i <= 25; i++)
        {
            salesList.Add(new Sale
            {
                Id = Guid.NewGuid(),
                SaleNumber = $"VTA-20261009-TEST{i:D2}",
                SaleDate = DateTimeOffset.UtcNow,
                Status = SaleStatus.Confirmed,
                Total = 150000,
                Customer = new Customer { FullName = $"Cliente de Prueba {i}", Document = $"10020030{i:D2}" },
                Details = new List<SaleDetail>
                {
                    new() { Product = new Product { Name = "Cemento 50kg", Sku = "CEM-001" }, Quantity = 2, UnitPrice = 75000, Subtotal = 150000 }
                }
            });
        }
        _sales.GetAllWithDetailsAsync(Arg.Any<CancellationToken>()).Returns(salesList);

        var bytes = await _sut.ExportSalesToPdfAsync();
        await File.WriteAllBytesAsync("/tmp/test_25_sales.pdf", bytes);
    }
}
