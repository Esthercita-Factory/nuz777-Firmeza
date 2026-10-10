using System.Text;
using Firmeza.Application.Abstractions;
using Firmeza.Application.Services.BulkImport;
using Firmeza.Domain.Entities;
using NSubstitute;
using OfficeOpenXml;
using Xunit;

namespace Firmeza.Tests.Application;

public class BulkImportTests
{
    public BulkImportTests()
    {
        ExcelPackage.License.SetNonCommercialOrganization("Firmeza");
    }

    [Theory]
    [InlineData("código", ImportTargetEntity.Product, "Sku")]
    [InlineData("SKU", ImportTargetEntity.Product, "Sku")]
    [InlineData("cod_producto", ImportTargetEntity.Product, "Sku")]
    [InlineData("nombre_producto", ImportTargetEntity.Product, "Name")]
    [InlineData("precio", ImportTargetEntity.Product, "Price")]
    [InlineData("stock", ImportTargetEntity.Product, "Stock")]
    [InlineData("cédula", ImportTargetEntity.Customer, "Document")]
    [InlineData("DNI", ImportTargetEntity.Customer, "Document")]
    [InlineData("cliente", ImportTargetEntity.Customer, "FullName")]
    [InlineData("teléfono", ImportTargetEntity.Customer, "Phone")]
    [InlineData("factura", ImportTargetEntity.Sale, "SaleNumber")]
    [InlineData("cantidad", ImportTargetEntity.Sale, "Quantity")]
    public void HeaderMatcher_MatchesKnownAliasesCorrectly(string header, ImportTargetEntity expectedEntity, string expectedField)
    {
        var match = HeaderMatcher.Match(header);

        Assert.NotNull(match);
        Assert.Equal(expectedEntity, match.Value.Entity);
        Assert.Equal(expectedField, match.Value.Field);
    }

    [Fact]
    public void HeaderMatcher_DisambiguatesNombre_WhenCustomerAndProductAreBothPresent()
    {
        // En una hoja con cliente y producto, si la columna es "cliente" y otra es "nombre", "nombre" se asume producto
        var headers = new[] { "Documento", "Cliente", "Nombre", "Precio" };
        var match = HeaderMatcher.Match("Nombre", headers);

        Assert.NotNull(match);
        Assert.Equal(ImportTargetEntity.Product, match.Value.Entity);
        Assert.Equal("Name", match.Value.Field);
    }

    [Fact]
    public async Task ImportFromExcelAsync_ValidatesMandatoryFields_AndLogsErrors()
    {
        // Arrange: Crear un Excel en memoria con filas incompletas
        using var package = new ExcelPackage();
        var ws = package.Workbook.Worksheets.Add("Incompletos");
        ws.Cells[1, 1].Value = "Código";
        ws.Cells[1, 2].Value = "Nombre";
        ws.Cells[1, 3].Value = "Precio";
        ws.Cells[1, 4].Value = "Stock";
        ws.Cells[1, 5].Value = "Documento";
        ws.Cells[1, 6].Value = "Cliente";

        // Fila 2: Producto sin precio ni stock
        ws.Cells[2, 1].Value = "PROD-ERR";
        ws.Cells[2, 2].Value = "Producto Incompleto";
        ws.Cells[2, 5].Value = "12345";
        ws.Cells[2, 6].Value = "Juan Perez";

        // Fila 3: Cliente sin documento (solo nombre)
        ws.Cells[3, 1].Value = "PROD-OK";
        ws.Cells[3, 2].Value = "Cemento 50kg";
        ws.Cells[3, 3].Value = 25000m;
        ws.Cells[3, 4].Value = 10;
        ws.Cells[3, 6].Value = "Cliente Sin Doc";

        var stream = new MemoryStream(package.GetAsByteArray());

        var products = Substitute.For<IProductRepository>();
        var customers = Substitute.For<ICustomerRepository>();
        var sales = Substitute.For<ISaleRepository>();
        var unitOfWork = TestDoubles.UnitOfWork(out _);
        var clock = new TestClock();
        var currentUser = TestDoubles.CurrentUser();

        var service = new BulkImportService(products, customers, sales, unitOfWork, clock, currentUser);

        // Act
        var result = await service.ImportFromExcelAsync(stream);

        // Assert
        Assert.NotEmpty(result.Errors);
        Assert.Contains(result.Errors, e => e.Field.Contains("Precio") || e.Field.Contains("Stock"));
        Assert.Contains(result.Errors, e => e.Field.Contains("Documento"));
    }

    [Fact]
    public async Task GenerateImportTemplateAsync_GeneratesValidExcelWorkbook()
    {
        var products = Substitute.For<IProductRepository>();
        var customers = Substitute.For<ICustomerRepository>();
        var sales = Substitute.For<ISaleRepository>();
        var unitOfWork = TestDoubles.UnitOfWork(out _);
        var clock = new TestClock();
        var currentUser = TestDoubles.CurrentUser();

        var service = new BulkImportService(products, customers, sales, unitOfWork, clock, currentUser);

        var bytes = await service.GenerateImportTemplateAsync();

        Assert.NotNull(bytes);
        Assert.NotEmpty(bytes);

        using var ms = new MemoryStream(bytes);
        using var package = new ExcelPackage(ms);
        Assert.True(package.Workbook.Worksheets.Count >= 2);
        Assert.NotNull(package.Workbook.Worksheets["Datos_Desnormalizados"]);
        Assert.NotNull(package.Workbook.Worksheets["Instrucciones"]);
    }
}
