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
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    ProductId = Guid.NewGuid(),
                    Product = new Product { Name = "Varilla de Acero 1/2", Sku = "VAR-003" },
                    Quantity = 10,
                    UnitPrice = 28000m,
                    Subtotal = 280000m
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    ProductId = Guid.NewGuid(),
                    Product = new Product { Name = "Ladrillo Limpio", Sku = "LAD-004" },
                    Quantity = 200,
                    UnitPrice = 1200m,
                    Subtotal = 240000m
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    ProductId = Guid.NewGuid(),
                    Product = new Product { Name = "Pintura Blanca Cuñete", Sku = "PIN-005" },
                    Quantity = 5,
                    UnitPrice = 120000m,
                    Subtotal = 600000m
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    ProductId = Guid.NewGuid(),
                    Product = new Product { Name = "Tubo PVC 1/2 pulgada", Sku = "TUB-006" },
                    Quantity = 8,
                    UnitPrice = 15000m,
                    Subtotal = 120000m
                }
            },
            DecisionNote = "Aprobado con descuento corporativo del 5%."
        };

        // Act
        var pdfBytes = service.GenerateReceiptPdf(sale);

        // Assert
        Assert.NotNull(pdfBytes);
        Assert.True(pdfBytes.Length > 100);
        File.WriteAllBytes("/tmp/test_receipt.pdf", pdfBytes);

        // Los archivos PDF válidos comienzan con la firma "%PDF-"
        var header = Encoding.ASCII.GetString(pdfBytes, 0, 5);
        Assert.Equal("%PDF-", header);
    }
}
