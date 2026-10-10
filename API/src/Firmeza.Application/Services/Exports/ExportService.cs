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
                page.Margin(26);
                page.DefaultTextStyle(x => x.FontSize(9).FontColor("#1e293b"));

                page.Header().Element(c => ComposeReportHeader(c, "CATÁLOGO DE PRODUCTOS", $"{products.Count} productos registrados en inventario", generatedAt));

                page.Content().PaddingTop(10).Column(contentCol =>
                {
                    // Tarjetas de Métricas Resumen (KPIs)
                    contentCol.Item().PaddingBottom(10).Row(kpiRow =>
                    {
                        kpiRow.RelativeItem().Border(1).BorderColor("#e2e8f0").Background("#f8fafc").Padding(6).Column(c =>
                        {
                            c.Item().Text("TOTAL PRODUCTOS").FontSize(7).Bold().FontColor("#64748b");
                            c.Item().Text(products.Count.ToString()).FontSize(11).ExtraBold().FontColor("#0f172a");
                        });
                        kpiRow.ConstantItem(8);
                        kpiRow.RelativeItem().Border(1).BorderColor("#e2e8f0").Background("#f8fafc").Padding(6).Column(c =>
                        {
                            c.Item().Text("ACTIVOS EN CATÁLOGO").FontSize(7).Bold().FontColor("#059669");
                            c.Item().Text(products.Count(p => p.IsActive).ToString()).FontSize(11).ExtraBold().FontColor("#059669");
                        });
                        kpiRow.ConstantItem(8);
                        kpiRow.RelativeItem().Border(1).BorderColor("#e2e8f0").Background("#f8fafc").Padding(6).Column(c =>
                        {
                            c.Item().Text("INACTIVOS").FontSize(7).Bold().FontColor("#64748b");
                            c.Item().Text(products.Count(p => !p.IsActive).ToString()).FontSize(11).ExtraBold().FontColor("#e11d48");
                        });
                        kpiRow.ConstantItem(8);
                        kpiRow.RelativeItem().Border(1).BorderColor("#e2e8f0").Background("#f8fafc").Padding(6).Column(c =>
                        {
                            c.Item().Text("STOCK TOTAL (UNID)").FontSize(7).Bold().FontColor("#d97706");
                            c.Item().Text(products.Sum(p => p.Stock).ToString("N0", culture)).FontSize(11).ExtraBold().FontColor("#d97706");
                        });
                    });

                    // Tabla de Productos
                    contentCol.Item().Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.ConstantColumn(85);   // SKU
                            cols.RelativeColumn(3);    // Nombre
                            cols.RelativeColumn(1.6f); // Categoría
                            cols.ConstantColumn(65);   // Unidad
                            cols.RelativeColumn(1.4f); // Precio
                            cols.ConstantColumn(60);   // Stock
                            cols.ConstantColumn(70);   // Estado
                        });

                        table.Header(h =>
                        {
                            h.Cell().Background("#0f172a").Padding(6).Text("Código / SKU").Bold().FontSize(8.5f).FontColor("#fff");
                            h.Cell().Background("#0f172a").Padding(6).Text("Nombre del Producto").Bold().FontSize(8.5f).FontColor("#fff");
                            h.Cell().Background("#0f172a").Padding(6).Text("Categoría").Bold().FontSize(8.5f).FontColor("#fff");
                            h.Cell().Background("#0f172a").Padding(6).AlignCenter().Text("Unidad").Bold().FontSize(8.5f).FontColor("#fff");
                            h.Cell().Background("#0f172a").Padding(6).AlignRight().Text("Precio Unit.").Bold().FontSize(8.5f).FontColor("#fff");
                            h.Cell().Background("#0f172a").Padding(6).AlignRight().Text("Stock").Bold().FontSize(8.5f).FontColor("#fff");
                            h.Cell().Background("#0f172a").Padding(6).AlignCenter().Text("Estado").Bold().FontSize(8.5f).FontColor("#fff");
                        });

                        var idx = 0;
                        foreach (var p in products)
                        {
                            var bg = idx % 2 == 0 ? "#ffffff" : "#f8fafc";
                            table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).Text(p.Sku).Bold().FontSize(8.5f).FontColor("#0f172a");
                            table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).Text(p.Name).FontSize(8.5f).FontColor("#1e293b");
                            table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).Text(p.Category).FontSize(8.5f).FontColor("#475569");
                            table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).AlignCenter().Text(p.Unit).FontSize(8.5f).FontColor("#64748b");
                            table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).AlignRight().Text(p.Price.ToString("C2", culture)).FontSize(8.5f).FontColor("#0f172a");
                            table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).AlignRight().Text(p.Stock.ToString()).Bold().FontSize(8.5f).FontColor(p.Stock > 0 ? "#0f172a" : "#e11d48");

                            var (stBg, stColor, stTxt) = p.IsActive ? ("#ecfdf5", "#059669", "ACTIVO") : ("#f1f5f9", "#94a3b8", "INACTIVO");
                            table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(4).AlignCenter()
                                .Background(stBg).Border(1).BorderColor(stColor).PaddingVertical(1).PaddingHorizontal(4)
                                .Text(stTxt).FontSize(7).Bold().FontColor(stColor);
                            idx++;
                        }
                    });
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
                page.Margin(26);
                page.DefaultTextStyle(x => x.FontSize(9).FontColor("#1e293b"));

                page.Header().Element(c => ComposeReportHeader(c, "DIRECTORIO DE CLIENTES", $"{customers.Count} clientes registrados en el sistema", generatedAt));

                page.Content().PaddingTop(10).Column(contentCol =>
                {
                    // KPIs Resumen
                    contentCol.Item().PaddingBottom(10).Row(kpiRow =>
                    {
                        kpiRow.RelativeItem().Border(1).BorderColor("#e2e8f0").Background("#f8fafc").Padding(6).Column(c =>
                        {
                            c.Item().Text("TOTAL CLIENTES").FontSize(7).Bold().FontColor("#64748b");
                            c.Item().Text(customers.Count.ToString()).FontSize(11).ExtraBold().FontColor("#0f172a");
                        });
                        kpiRow.ConstantItem(8);
                        kpiRow.RelativeItem().Border(1).BorderColor("#e2e8f0").Background("#f8fafc").Padding(6).Column(c =>
                        {
                            c.Item().Text("CLIENTES ACTIVOS").FontSize(7).Bold().FontColor("#059669");
                            c.Item().Text(customers.Count(c => c.IsActive).ToString()).FontSize(11).ExtraBold().FontColor("#059669");
                        });
                        kpiRow.ConstantItem(8);
                        kpiRow.RelativeItem().Border(1).BorderColor("#e2e8f0").Background("#f8fafc").Padding(6).Column(c =>
                        {
                            c.Item().Text("CLIENTES INACTIVOS").FontSize(7).Bold().FontColor("#64748b");
                            c.Item().Text(customers.Count(c => !c.IsActive).ToString()).FontSize(11).ExtraBold().FontColor("#64748b");
                        });
                        kpiRow.ConstantItem(8);
                        kpiRow.RelativeItem().Border(1).BorderColor("#e2e8f0").Background("#f8fafc").Padding(6).Column(c =>
                        {
                            c.Item().Text("CON DIRECCIÓN REGISTRADA").FontSize(7).Bold().FontColor("#d97706");
                            c.Item().Text(customers.Count(c => !string.IsNullOrWhiteSpace(c.Address)).ToString()).FontSize(11).ExtraBold().FontColor("#d97706");
                        });
                    });

                    // Tabla de Clientes
                    contentCol.Item().Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.ConstantColumn(95);   // Documento
                            cols.RelativeColumn(2.6f); // Nombre
                            cols.ConstantColumn(45);   // Edad
                            cols.RelativeColumn(2.1f); // Correo
                            cols.RelativeColumn(1.3f); // Teléfono
                            cols.RelativeColumn(2f);   // Dirección
                            cols.ConstantColumn(65);   // Estado
                        });

                        table.Header(h =>
                        {
                            h.Cell().Background("#0f172a").Padding(6).Text("Documento / NIT").Bold().FontSize(8.5f).FontColor("#fff");
                            h.Cell().Background("#0f172a").Padding(6).Text("Nombre Completo").Bold().FontSize(8.5f).FontColor("#fff");
                            h.Cell().Background("#0f172a").Padding(6).AlignCenter().Text("Edad").Bold().FontSize(8.5f).FontColor("#fff");
                            h.Cell().Background("#0f172a").Padding(6).Text("Correo Electrónico").Bold().FontSize(8.5f).FontColor("#fff");
                            h.Cell().Background("#0f172a").Padding(6).Text("Teléfono").Bold().FontSize(8.5f).FontColor("#fff");
                            h.Cell().Background("#0f172a").Padding(6).Text("Dirección").Bold().FontSize(8.5f).FontColor("#fff");
                            h.Cell().Background("#0f172a").Padding(6).AlignCenter().Text("Estado").Bold().FontSize(8.5f).FontColor("#fff");
                        });

                        var idx = 0;
                        foreach (var c in customers)
                        {
                            var bg = idx % 2 == 0 ? "#ffffff" : "#f8fafc";
                            table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).Text(c.Document).Bold().FontSize(8.5f).FontColor("#0f172a");
                            table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).Text(c.FullName).FontSize(8.5f).FontColor("#1e293b");
                            table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).AlignCenter().Text(c.Age.ToString()).FontSize(8.5f).FontColor("#475569");
                            table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).Text(c.Email).FontSize(8f).FontColor("#334155");
                            table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).Text(c.Phone).FontSize(8.5f).FontColor("#334155");
                            table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).Text(c.Address ?? "-").FontSize(8f).FontColor("#64748b");

                            var (stBg, stColor, stTxt) = c.IsActive ? ("#ecfdf5", "#059669", "ACTIVO") : ("#f1f5f9", "#94a3b8", "INACTIVO");
                            table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(4).AlignCenter()
                                .Background(stBg).Border(1).BorderColor(stColor).PaddingVertical(1).PaddingHorizontal(4)
                                .Text(stTxt).FontSize(7).Bold().FontColor(stColor);
                            idx++;
                        }
                    });
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
                page.Margin(26);
                page.DefaultTextStyle(x => x.FontSize(9).FontColor("#1e293b"));

                page.Header().Element(c => ComposeReportHeader(c, "REPORTE CONSOLIDADO DE VENTAS", $"{sales.Count} operaciones comerciales registradas", generatedAt));

                page.Content().PaddingTop(10).Column(contentCol =>
                {
                    // KPIs Resumen
                    contentCol.Item().PaddingBottom(10).Row(kpiRow =>
                    {
                        kpiRow.RelativeItem().Border(1).BorderColor("#e2e8f0").Background("#f8fafc").Padding(6).Column(c =>
                        {
                            c.Item().Text("TOTAL VENTAS").FontSize(7).Bold().FontColor("#64748b");
                            c.Item().Text(sales.Count.ToString()).FontSize(11).ExtraBold().FontColor("#0f172a");
                        });
                        kpiRow.ConstantItem(8);
                        kpiRow.RelativeItem().Border(1).BorderColor("#e2e8f0").Background("#f8fafc").Padding(6).Column(c =>
                        {
                            c.Item().Text("FACTURACIÓN ACTIVA").FontSize(7).Bold().FontColor("#d97706");
                            c.Item().Text(grandTotal.ToString("C2", culture)).FontSize(11).ExtraBold().FontColor("#d97706");
                        });
                        kpiRow.ConstantItem(8);
                        kpiRow.RelativeItem().Border(1).BorderColor("#e2e8f0").Background("#f8fafc").Padding(6).Column(c =>
                        {
                            c.Item().Text("CONFIRMADAS / ENTREGADAS").FontSize(7).Bold().FontColor("#059669");
                            c.Item().Text(sales.Count(s => s.Status == SaleStatus.Confirmed || s.Status == SaleStatus.Delivered).ToString()).FontSize(11).ExtraBold().FontColor("#059669");
                        });
                        kpiRow.ConstantItem(8);
                        kpiRow.RelativeItem().Border(1).BorderColor("#e2e8f0").Background("#f8fafc").Padding(6).Column(c =>
                        {
                            c.Item().Text("PENDIENTES / CANCELADAS").FontSize(7).Bold().FontColor("#64748b");
                            c.Item().Text(sales.Count(s => s.Status == SaleStatus.Pending || s.Status == SaleStatus.Cancelled).ToString()).FontSize(11).ExtraBold().FontColor("#475569");
                        });
                    });

                    // Tabla de Ventas
                    contentCol.Item().Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.ConstantColumn(105); // Nº Venta
                            cols.ConstantColumn(100); // Fecha
                            cols.ConstantColumn(95);  // Doc Cliente
                            cols.RelativeColumn(3);   // Cliente
                            cols.ConstantColumn(75);  // Estado
                            cols.ConstantColumn(50);  // Ítems
                            cols.RelativeColumn(1.5f); // Total
                        });

                        table.Header(h =>
                        {
                            h.Cell().Background("#0f172a").Padding(6).Text("Nº Venta").Bold().FontSize(8.5f).FontColor("#fff");
                            h.Cell().Background("#0f172a").Padding(6).Text("Fecha").Bold().FontSize(8.5f).FontColor("#fff");
                            h.Cell().Background("#0f172a").Padding(6).Text("Doc. Cliente").Bold().FontSize(8.5f).FontColor("#fff");
                            h.Cell().Background("#0f172a").Padding(6).Text("Cliente").Bold().FontSize(8.5f).FontColor("#fff");
                            h.Cell().Background("#0f172a").Padding(6).AlignCenter().Text("Estado").Bold().FontSize(8.5f).FontColor("#fff");
                            h.Cell().Background("#0f172a").Padding(6).AlignRight().Text("Ítems").Bold().FontSize(8.5f).FontColor("#fff");
                            h.Cell().Background("#0f172a").Padding(6).AlignRight().Text("Total").Bold().FontSize(8.5f).FontColor("#fff");
                        });

                        var idx = 0;
                        foreach (var s in sales)
                        {
                            var bg = idx % 2 == 0 ? "#ffffff" : "#f8fafc";
                            table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).Text(s.SaleNumber).Bold().FontSize(8.5f).FontColor("#0f172a");
                            table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).Text(s.SaleDate.ToLocalTime().ToString("dd/MM/yyyy HH:mm")).FontSize(8f).FontColor("#475569");
                            table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).Text(s.Customer?.Document ?? "-").FontSize(8.5f).FontColor("#475569");
                            table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).Text(s.Customer?.FullName ?? "-").FontSize(8.5f).FontColor("#1e293b");

                            var (stBg, stColor, stTxt) = s.Status switch
                            {
                                SaleStatus.Confirmed => ("#ecfdf5", "#059669", "CONFIRMADA"),
                                SaleStatus.Delivered => ("#ecfdf5", "#059669", "ENTREGADA"),
                                SaleStatus.Pending => ("#fffbeb", "#92400e", "PENDIENTE"),
                                SaleStatus.Cancelled => ("#fef2f2", "#991b1b", "CANCELADA"),
                                _ => ("#f1f5f9", "#334155", s.Status.ToString().ToUpperInvariant())
                            };
                            table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(4).AlignCenter()
                                .Background(stBg).Border(1).BorderColor(stColor).PaddingVertical(1).PaddingHorizontal(4)
                                .Text(stTxt).FontSize(7).Bold().FontColor(stColor);

                            table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).AlignRight().Text(s.Details.Count.ToString()).FontSize(8.5f).FontColor("#475569");
                            table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).AlignRight().Text(s.Total.ToString("C2", culture)).Bold().FontSize(8.5f).FontColor("#0f172a");
                            idx++;
                        }

                        // Fila Total Resumen Destacada
                        table.Cell().ColumnSpan(6).Background("#0f172a").Padding(7).AlignRight().Text("TOTAL ACUMULADO (Ventas no canceladas):").Bold().FontSize(9f).FontColor("#ffffff");
                        table.Cell().Background("#0f172a").Padding(7).AlignRight().Text(grandTotal.ToString("C2", culture)).ExtraBold().FontSize(10.5f).FontColor("#fbbf24");
                    });
                });

                page.Footer().Element(ComposeReportFooter);
            });
        });

        return doc.GeneratePdf();
    }

    // Helpers comunes
    private static void ComposeReportHeader(IContainer container, string title, string subtitle, DateTimeOffset generatedAt)
    {
        container.Column(col =>
        {
            // Barra superior decorativa corporativa (Azul marino + Ámbar)
            col.Item().PaddingBottom(10).Row(bar =>
            {
                bar.RelativeItem(5).Height(3.5f).Background("#0f172a");
                bar.RelativeItem(1).Height(3.5f).Background("#d97706");
            });

            col.Item().Row(row =>
            {
                row.RelativeItem().Column(brand =>
                {
                    brand.Item().Row(r =>
                    {
                        r.AutoItem().Border(1).BorderColor("#0f172a").Background("#0f172a").PaddingHorizontal(6).PaddingVertical(2)
                            .Text("F").FontSize(11).ExtraBold().FontColor("#ffffff");
                        r.RelativeItem().PaddingLeft(7).Column(c =>
                        {
                            c.Item().Text("FIRMEZA").FontSize(15).ExtraBold().FontColor("#0f172a");
                            c.Item().Text("MATERIALES DE CONSTRUCCIÓN & ACABADOS").FontSize(6.5f).Bold().FontColor("#d97706");
                        });
                    });

                    brand.Item().PaddingTop(4).Text(title).FontSize(14).ExtraBold().FontColor("#0f172a");
                    brand.Item().Text(subtitle).FontSize(8.5f).FontColor("#64748b");
                });

                row.ConstantItem(210).Column(cardCol =>
                {
                    cardCol.Item().Border(1).BorderColor("#cbd5e1").Background("#f8fafc").Padding(8).Column(card =>
                    {
                        card.Item().Row(r =>
                        {
                            r.RelativeItem().Text("REPORTE OFICIAL").FontSize(7.5f).ExtraBold().FontColor("#0f172a");
                            r.AutoItem().Background("#e2e8f0").PaddingHorizontal(4).PaddingVertical(1)
                                .Text("SISTEMA ERP").FontSize(6.5f).Bold().FontColor("#334155");
                        });

                        card.Item().PaddingTop(3).Text($"Emisión: {generatedAt:dd/MM/yyyy HH:mm}").FontSize(8).FontColor("#475569");
                        card.Item().Text("Clasificación: Control Operativo").FontSize(7.5f).FontColor("#64748b");
                        card.Item().PaddingTop(4).Background("#ecfdf5").Border(1).BorderColor("#059669").PaddingVertical(1).AlignCenter()
                            .Text("DOCUMENTO VÁLIDO").FontSize(6.5f).ExtraBold().FontColor("#059669");
                    });
                });
            });
        });
    }

    private static void ComposeReportFooter(IContainer container)
    {
        container.BorderTop(1).BorderColor("#e2e8f0").PaddingTop(6).Row(row =>
        {
            row.RelativeItem().Text("Firmeza S.A.S. · NIT 901.458.789-1 · Generado por Firmeza ERP v2.0").FontSize(7.5f).FontColor("#94a3b8");
            row.RelativeItem().AlignRight().Text(x =>
            {
                x.Span("Página ").FontSize(7.5f).FontColor("#94a3b8");
                x.CurrentPageNumber().FontSize(7.5f).Bold().FontColor("#64748b");
                x.Span(" de ").FontSize(7.5f).FontColor("#94a3b8");
                x.TotalPages().FontSize(7.5f).Bold().FontColor("#64748b");
            });
        });
    }
}
