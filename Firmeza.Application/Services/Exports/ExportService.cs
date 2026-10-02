using System.Drawing;
using System.Globalization;
using Firmeza.Application.Abstractions;
using Firmeza.Domain.Entities;
using Firmeza.Domain.Enums;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Firmeza.Application.Services.Exports;

public sealed class ExportService : IExportService
{
    private readonly IProductRepository _products;
    private readonly ICustomerRepository _customers;
    private readonly ISaleRepository _sales;
    private readonly IClock _clock;

    static ExportService()
    {
        ExcelPackage.License.SetNonCommercialOrganization("Firmeza");
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public ExportService(
        IProductRepository products,
        ICustomerRepository customers,
        ISaleRepository sales,
        IClock clock)
    {
        _products = products;
        _customers = customers;
        _sales = sales;
        _clock = clock;
    }

    // ==========================================
    // PRODUCTOS
    // ==========================================

    public async Task<byte[]> ExportProductsToExcelAsync(CancellationToken cancellationToken = default)
    {
        var products = await _products.GetAllAsync(cancellationToken);
        using var package = new ExcelPackage();
        var ws = package.Workbook.Worksheets.Add("Productos");

        // Título
        ws.Cells[1, 1].Value = "CATÁLOGO DE PRODUCTOS - FIRMEZA";
        ws.Cells[1, 1].Style.Font.Bold = true;
        ws.Cells[1, 1].Style.Font.Size = 14;

        ws.Cells[2, 1].Value = $"Generado el: {_clock.UtcNow.ToLocalTime():dd/MM/yyyy HH:mm}";
        ws.Cells[2, 1].Style.Font.Italic = true;
        ws.Cells[2, 1].Style.Font.Size = 9;

        var headers = new[] { "Código (SKU)", "Nombre", "Categoría", "Unidad", "Precio", "Stock", "Estado", "Descripción" };
        for (var i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cells[4, i + 1];
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Font.Color.SetColor(System.Drawing.Color.White);
            cell.Style.Fill.PatternType = ExcelFillStyle.Solid;
            cell.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.FromArgb(15, 23, 42)); // Slate 900
            cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
        }

        var row = 5;
        foreach (var p in products)
        {
            ws.Cells[row, 1].Value = p.Sku;
            ws.Cells[row, 2].Value = p.Name;
            ws.Cells[row, 3].Value = p.Category;
            ws.Cells[row, 4].Value = p.Unit;

            var cellPrice = ws.Cells[row, 5];
            cellPrice.Value = p.Price;
            cellPrice.Style.Numberformat.Format = "$#,##0.00";
            cellPrice.Style.HorizontalAlignment = ExcelHorizontalAlignment.Right;

            var cellStock = ws.Cells[row, 6];
            cellStock.Value = p.Stock;
            cellStock.Style.HorizontalAlignment = ExcelHorizontalAlignment.Right;

            ws.Cells[row, 7].Value = p.IsActive ? "Activo" : "Inactivo";
            ws.Cells[row, 8].Value = p.Description ?? string.Empty;

            row++;
        }

        ws.Cells[4, 1, row - 1, headers.Length].Style.Border.BorderAround(ExcelBorderStyle.Thin, System.Drawing.Color.LightGray);
        ws.Cells[ws.Dimension.Address].AutoFitColumns();

        return package.GetAsByteArray();
    }

    public async Task<byte[]> ExportProductsToPdfAsync(CancellationToken cancellationToken = default)
    {
        var products = await _products.GetAllAsync(cancellationToken);
        var culture = new CultureInfo("es-CO");
        var generatedAt = _clock.UtcNow.ToLocalTime();

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(28);
                page.DefaultTextStyle(x => x.FontSize(9).FontColor("#1e293b"));

                page.Header().Element(c => ComposeReportHeader(c, "CATÁLOGO DE PRODUCTOS", $"{products.Count} productos registrados", generatedAt));

                page.Content().PaddingTop(12).Table(table =>
                {
                    table.ColumnsDefinition(cols =>
                    {
                        cols.ConstantColumn(85);  // SKU
                        cols.RelativeColumn(3);   // Nombre
                        cols.RelativeColumn(1.5f); // Categoría
                        cols.ConstantColumn(65);  // Unidad
                        cols.RelativeColumn(1.3f); // Precio
                        cols.ConstantColumn(55);  // Stock
                        cols.ConstantColumn(65);  // Estado
                    });

                    table.Header(h =>
                    {
                        h.Cell().Background("#0f172a").Padding(6).Text("Código / SKU").Bold().FontColor("#fff");
                        h.Cell().Background("#0f172a").Padding(6).Text("Nombre del Producto").Bold().FontColor("#fff");
                        h.Cell().Background("#0f172a").Padding(6).Text("Categoría").Bold().FontColor("#fff");
                        h.Cell().Background("#0f172a").Padding(6).Text("Unidad").Bold().FontColor("#fff");
                        h.Cell().Background("#0f172a").Padding(6).AlignRight().Text("Precio").Bold().FontColor("#fff");
                        h.Cell().Background("#0f172a").Padding(6).AlignRight().Text("Stock").Bold().FontColor("#fff");
                        h.Cell().Background("#0f172a").Padding(6).AlignCenter().Text("Estado").Bold().FontColor("#fff");
                    });

                    var idx = 0;
                    foreach (var p in products)
                    {
                        var bg = idx % 2 == 0 ? "#ffffff" : "#f8fafc";
                        table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).Text(p.Sku).Bold();
                        table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).Text(p.Name);
                        table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).Text(p.Category);
                        table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).Text(p.Unit);
                        table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).AlignRight().Text(p.Price.ToString("C2", culture));
                        table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).AlignRight().Text(p.Stock.ToString());
                        table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).AlignCenter().Text(p.IsActive ? "Activo" : "Inactivo").FontColor(p.IsActive ? "#059669" : "#94a3b8");
                        idx++;
                    }
                });

                page.Footer().Element(ComposeReportFooter);
            });
        });

        return doc.GeneratePdf();
    }

    // ==========================================
    // CLIENTES
    // ==========================================

    public async Task<byte[]> ExportCustomersToExcelAsync(CancellationToken cancellationToken = default)
    {
        var customers = await _customers.GetAllAsync(cancellationToken);
        using var package = new ExcelPackage();
        var ws = package.Workbook.Worksheets.Add("Clientes");

        ws.Cells[1, 1].Value = "DIRECTORIO DE CLIENTES - FIRMEZA";
        ws.Cells[1, 1].Style.Font.Bold = true;
        ws.Cells[1, 1].Style.Font.Size = 14;

        ws.Cells[2, 1].Value = $"Generado el: {_clock.UtcNow.ToLocalTime():dd/MM/yyyy HH:mm}";
        ws.Cells[2, 1].Style.Font.Italic = true;
        ws.Cells[2, 1].Style.Font.Size = 9;

        var headers = new[] { "Documento", "Nombre Completo", "Edad", "Correo Electrónico", "Teléfono", "Dirección", "Estado" };
        for (var i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cells[4, i + 1];
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Font.Color.SetColor(System.Drawing.Color.White);
            cell.Style.Fill.PatternType = ExcelFillStyle.Solid;
            cell.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.FromArgb(15, 23, 42));
            cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
        }

        var row = 5;
        foreach (var c in customers)
        {
            ws.Cells[row, 1].Value = c.Document;
            ws.Cells[row, 2].Value = c.FullName;
            ws.Cells[row, 3].Value = c.Age;
            ws.Cells[row, 4].Value = c.Email;
            ws.Cells[row, 5].Value = c.Phone;
            ws.Cells[row, 6].Value = c.Address ?? string.Empty;
            ws.Cells[row, 7].Value = c.IsActive ? "Activo" : "Inactivo";
            row++;
        }

        ws.Cells[4, 1, row - 1, headers.Length].Style.Border.BorderAround(ExcelBorderStyle.Thin, System.Drawing.Color.LightGray);
        ws.Cells[ws.Dimension.Address].AutoFitColumns();

        return package.GetAsByteArray();
    }

    public async Task<byte[]> ExportCustomersToPdfAsync(CancellationToken cancellationToken = default)
    {
        var customers = await _customers.GetAllAsync(cancellationToken);
        var generatedAt = _clock.UtcNow.ToLocalTime();

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(28);
                page.DefaultTextStyle(x => x.FontSize(9).FontColor("#1e293b"));

                page.Header().Element(c => ComposeReportHeader(c, "DIRECTORIO DE CLIENTES", $"{customers.Count} clientes registrados", generatedAt));

                page.Content().PaddingTop(12).Table(table =>
                {
                    table.ColumnsDefinition(cols =>
                    {
                        cols.ConstantColumn(95);  // Documento
                        cols.RelativeColumn(2.5f); // Nombre
                        cols.ConstantColumn(45);  // Edad
                        cols.RelativeColumn(2);   // Correo
                        cols.RelativeColumn(1.3f); // Teléfono
                        cols.RelativeColumn(2);   // Dirección
                        cols.ConstantColumn(60);  // Estado
                    });

                    table.Header(h =>
                    {
                        h.Cell().Background("#0f172a").Padding(6).Text("Documento").Bold().FontColor("#fff");
                        h.Cell().Background("#0f172a").Padding(6).Text("Nombre Completo").Bold().FontColor("#fff");
                        h.Cell().Background("#0f172a").Padding(6).AlignCenter().Text("Edad").Bold().FontColor("#fff");
                        h.Cell().Background("#0f172a").Padding(6).Text("Correo").Bold().FontColor("#fff");
                        h.Cell().Background("#0f172a").Padding(6).Text("Teléfono").Bold().FontColor("#fff");
                        h.Cell().Background("#0f172a").Padding(6).Text("Dirección").Bold().FontColor("#fff");
                        h.Cell().Background("#0f172a").Padding(6).AlignCenter().Text("Estado").Bold().FontColor("#fff");
                    });

                    var idx = 0;
                    foreach (var c in customers)
                    {
                        var bg = idx % 2 == 0 ? "#ffffff" : "#f8fafc";
                        table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).Text(c.Document).Bold();
                        table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).Text(c.FullName);
                        table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).AlignCenter().Text(c.Age.ToString());
                        table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).Text(c.Email);
                        table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).Text(c.Phone);
                        table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).Text(c.Address ?? "-");
                        table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).AlignCenter().Text(c.IsActive ? "Activo" : "Inactivo").FontColor(c.IsActive ? "#059669" : "#94a3b8");
                        idx++;
                    }
                });

                page.Footer().Element(ComposeReportFooter);
            });
        });

        return doc.GeneratePdf();
    }

    // ==========================================
    // VENTAS
    // ==========================================

    public async Task<byte[]> ExportSalesToExcelAsync(CancellationToken cancellationToken = default)
    {
        var sales = await _sales.GetAllWithDetailsAsync(cancellationToken);
        using var package = new ExcelPackage();
        var ws = package.Workbook.Worksheets.Add("Ventas");

        ws.Cells[1, 1].Value = "REPORTE GENERAL DE VENTAS - FIRMEZA";
        ws.Cells[1, 1].Style.Font.Bold = true;
        ws.Cells[1, 1].Style.Font.Size = 14;

        ws.Cells[2, 1].Value = $"Generado el: {_clock.UtcNow.ToLocalTime():dd/MM/yyyy HH:mm}";
        ws.Cells[2, 1].Style.Font.Italic = true;
        ws.Cells[2, 1].Style.Font.Size = 9;

        var headers = new[] { "Nº Venta", "Fecha", "Doc. Cliente", "Cliente", "Estado", "Líneas", "Total" };
        for (var i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cells[4, i + 1];
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Font.Color.SetColor(System.Drawing.Color.White);
            cell.Style.Fill.PatternType = ExcelFillStyle.Solid;
            cell.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.FromArgb(15, 23, 42));
            cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
        }

        var row = 5;
        decimal grandTotal = 0;
        foreach (var s in sales)
        {
            ws.Cells[row, 1].Value = s.SaleNumber;
            ws.Cells[row, 2].Value = s.SaleDate.ToLocalTime().ToString("dd/MM/yyyy HH:mm");
            ws.Cells[row, 3].Value = s.Customer?.Document ?? "-";
            ws.Cells[row, 4].Value = s.Customer?.FullName ?? "-";
            ws.Cells[row, 5].Value = s.Status.ToString();
            ws.Cells[row, 6].Value = s.Details.Count;

            var cellTotal = ws.Cells[row, 7];
            cellTotal.Value = s.Total;
            cellTotal.Style.Numberformat.Format = "$#,##0.00";
            cellTotal.Style.HorizontalAlignment = ExcelHorizontalAlignment.Right;

            if (s.Status != SaleStatus.Cancelled)
            {
                grandTotal += s.Total;
            }

            row++;
        }

        // Fila Total
        ws.Cells[row, 6].Value = "TOTAL (Activas):";
        ws.Cells[row, 6].Style.Font.Bold = true;
        ws.Cells[row, 7].Value = grandTotal;
        ws.Cells[row, 7].Style.Font.Bold = true;
        ws.Cells[row, 7].Style.Numberformat.Format = "$#,##0.00";

        ws.Cells[4, 1, row, headers.Length].Style.Border.BorderAround(ExcelBorderStyle.Thin, System.Drawing.Color.LightGray);
        ws.Cells[ws.Dimension.Address].AutoFitColumns();

        return package.GetAsByteArray();
    }

    public async Task<byte[]> ExportSalesToPdfAsync(CancellationToken cancellationToken = default)
    {
        var sales = await _sales.GetAllWithDetailsAsync(cancellationToken);
        var culture = new CultureInfo("es-CO");
        var generatedAt = _clock.UtcNow.ToLocalTime();
        var grandTotal = sales.Where(s => s.Status != SaleStatus.Cancelled).Sum(s => s.Total);

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(28);
                page.DefaultTextStyle(x => x.FontSize(9).FontColor("#1e293b"));

                page.Header().Element(c => ComposeReportHeader(c, "REPORTE CONSOLIDADO DE VENTAS", $"{sales.Count} ventas registradas · Total activo: {grandTotal.ToString("C2", culture)}", generatedAt));

                page.Content().PaddingTop(12).Table(table =>
                {
                    table.ColumnsDefinition(cols =>
                    {
                        cols.ConstantColumn(110); // Nº Venta
                        cols.ConstantColumn(105); // Fecha
                        cols.ConstantColumn(95);  // Doc Cliente
                        cols.RelativeColumn(3);   // Cliente
                        cols.ConstantColumn(75);  // Estado
                        cols.ConstantColumn(50);  // Ítems
                        cols.RelativeColumn(1.5f); // Total
                    });

                    table.Header(h =>
                    {
                        h.Cell().Background("#0f172a").Padding(6).Text("Nº Venta").Bold().FontColor("#fff");
                        h.Cell().Background("#0f172a").Padding(6).Text("Fecha").Bold().FontColor("#fff");
                        h.Cell().Background("#0f172a").Padding(6).Text("Doc. Cliente").Bold().FontColor("#fff");
                        h.Cell().Background("#0f172a").Padding(6).Text("Cliente").Bold().FontColor("#fff");
                        h.Cell().Background("#0f172a").Padding(6).AlignCenter().Text("Estado").Bold().FontColor("#fff");
                        h.Cell().Background("#0f172a").Padding(6).AlignRight().Text("Ítems").Bold().FontColor("#fff");
                        h.Cell().Background("#0f172a").Padding(6).AlignRight().Text("Total").Bold().FontColor("#fff");
                    });

                    var idx = 0;
                    foreach (var s in sales)
                    {
                        var bg = idx % 2 == 0 ? "#ffffff" : "#f8fafc";
                        table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).Text(s.SaleNumber).Bold();
                        table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).Text(s.SaleDate.ToLocalTime().ToString("dd/MM/yyyy HH:mm"));
                        table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).Text(s.Customer?.Document ?? "-");
                        table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).Text(s.Customer?.FullName ?? "-");
                        
                        var statusColor = s.Status == SaleStatus.Cancelled ? "#e11d48" : "#059669";
                        table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).AlignCenter().Text(s.Status.ToString()).Bold().FontColor(statusColor);
                        
                        table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).AlignRight().Text(s.Details.Count.ToString());
                        table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).AlignRight().Text(s.Total.ToString("C2", culture)).Bold();
                        idx++;
                    }

                    // Fila Total
                    table.Cell().ColumnSpan(6).Background("#f1f5f9").Padding(6).AlignRight().Text("TOTAL ACUMULADO (Ventas no canceladas):").Bold();
                    table.Cell().Background("#f1f5f9").Padding(6).AlignRight().Text(grandTotal.ToString("C2", culture)).ExtraBold().FontColor("#d97706");
                });

                page.Footer().Element(ComposeReportFooter);
            });
        });

        return doc.GeneratePdf();
    }

    // Helpers comunes
    private static void ComposeReportHeader(IContainer container, string title, string subtitle, DateTimeOffset generatedAt)
    {
        container.Row(row =>
        {
            row.RelativeItem().Column(col =>
            {
                col.Item().Text("FIRMEZA · Materiales de Construcción").FontSize(10).Bold().FontColor("#d97706");
                col.Item().Text(title).FontSize(16).ExtraBold().FontColor("#0f172a");
                col.Item().Text(subtitle).FontSize(9).FontColor("#64748b");
            });

            row.ConstantItem(180).AlignRight().Column(col =>
            {
                col.Item().Text($"Generado: {generatedAt:dd/MM/yyyy HH:mm}").FontSize(8).FontColor("#64748b");
                col.Item().Text("Reporte oficial ERP").FontSize(8).Bold().FontColor("#0f172a");
            });
        });
    }

    private static void ComposeReportFooter(IContainer container)
    {
        container.BorderTop(1).BorderColor("#e2e8f0").PaddingTop(6).Row(row =>
        {
            row.RelativeItem().Text("Firmeza ERP · Gestión operativa y soporte documental").FontSize(7.5f).FontColor("#94a3b8");
            row.RelativeItem().AlignRight().Text(x =>
            {
                x.Span("Página ").FontSize(7.5f).FontColor("#94a3b8");
                x.CurrentPageNumber().FontSize(7.5f).FontColor("#94a3b8");
                x.Span(" de ").FontSize(7.5f).FontColor("#94a3b8");
                x.TotalPages().FontSize(7.5f).FontColor("#94a3b8");
            });
        });
    }
}
