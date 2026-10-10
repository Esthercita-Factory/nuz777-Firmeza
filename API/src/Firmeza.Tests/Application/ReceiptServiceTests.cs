using System.Text;
using Firmeza.Application.Abstractions;
using Firmeza.Application.Services.Receipts;
using Firmeza.Domain.Entities;
using Firmeza.Domain.Enums;
using NSubstitute;
using Xunit;

namespace Firmeza.Tests.Application;

public class ReceiptServiceTests
{
    [Fact]
    public void GenerateReceiptPdf_ReturnsValidPdfBytes_WithPdfHeader()
    {
        // Arrange
        var salesRepo = Substitute.For<ISaleRepository>();
        var service = new ReceiptService(salesRepo);

        var sale = new Sale
        {
            Id = Guid.NewGuid(),
            SaleNumber = "FAC-2026-TEST",
            CustomerId = Guid.NewGuid(),
            Customer = new Customer
            {
                Id = Guid.NewGuid(),
                FullName = "Empresa Constructora SAS",
                Document = "900123456-7",
                Phone = "3001234567",
                Email = "contacto@constructora.com",
                Address = "Calle 100 # 15-20"
            },
            SaleDate = DateTimeOffset.UtcNow,
            Status = SaleStatus.Confirmed,
            Total = 119000m,
            Details = new List<SaleDetail>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    ProductId = Guid.NewGuid(),
                    Product = new Product { Name = "Cemento Gris 50kg", Sku = "CEM-001" },
                    Quantity = 2,
                    UnitPrice = 50000m,
                    Subtotal = 100000m
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    ProductId = Guid.NewGuid(),
                    Product = new Product { Name = "Arena Lavada m3", Sku = "ARE-002" },
                    Quantity = 1,
                    UnitPrice = 19000m,
                    Subtotal = 19000m
                }
            }
        };

        // Act
        var pdfBytes = service.GenerateReceiptPdf(sale);

        // Assert
        Assert.NotNull(pdfBytes);
        Assert.True(pdfBytes.Length > 100);

        // Los archivos PDF válidos comienzan con la firma "%PDF-"
        var header = Encoding.ASCII.GetString(pdfBytes, 0, 5);
        Assert.Equal("%PDF-", header);
    }
}
