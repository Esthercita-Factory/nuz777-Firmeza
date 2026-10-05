using System.Globalization;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Firmeza.Application.Abstractions;
using Firmeza.Domain.Entities;
using Firmeza.Domain.Enums;
using Firmeza.Domain.Services;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Firmeza.Application.Services.Receipts;

public sealed class ReceiptService : IReceiptService
{
    private readonly ISaleRepository _sales;

    static ReceiptService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public ReceiptService(ISaleRepository sales)
    {
        _sales = sales;
    }

    public byte[] GenerateReceiptPdf(Sale sale)
    {
        // La base y el IVA los calcula el dominio para que el comprobante
        // coincida exactamente con lo que muestra el panel.
        var taxes = InventoryCalculator.SplitTaxInclusive(sale.Total);
        var subtotalBase = taxes.SubtotalBase;
        var iva = taxes.Tax;
        var culture = new CultureInfo("es-CO");

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(32);
                page.DefaultTextStyle(x => x.FontSize(9).FontColor("#1e293b"));

                page.Header().Element(c => ComposeHeader(c, sale));
                page.Content().Element(c => ComposeContent(c, sale, subtotalBase, iva, culture));
                page.Footer().Element(ComposeFooter);
            });
        });

        return doc.GeneratePdf();
    }

    public async Task<string> EnsureReceiptPdfSavedAsync(Guid saleId, string webRootPath, CancellationToken cancellationToken = default)
    {
        var sale = await _sales.FindWithDetailsAsync(saleId, cancellationToken);
        if (sale == null)
        {
            throw new InvalidOperationException($"No se encontró la venta con id {saleId}.");
        }

        return await EnsureReceiptPdfSavedAsync(sale, webRootPath, cancellationToken);
    }

    public async Task<string> EnsureReceiptPdfSavedAsync(Sale sale, string webRootPath, CancellationToken cancellationToken = default)
    {
        var receiptsDir = Path.Combine(webRootPath, "recibos");
        if (!Directory.Exists(receiptsDir))
        {
            Directory.CreateDirectory(receiptsDir);
        }

        var fileName = $"{sale.SaleNumber}.pdf";
        var fullPath = Path.Combine(receiptsDir, fileName);

        if (!File.Exists(fullPath))
        {
            var pdfBytes = GenerateReceiptPdf(sale);
            await File.WriteAllBytesAsync(fullPath, pdfBytes, cancellationToken);
        }

        return $"recibos/{fileName}";
    }

    private static void ComposeHeader(IContainer container, Sale sale)
    {
        container.Row(row =>
        {
            row.RelativeItem().Column(col =>
            {
                col.Item().Text("FIRMEZA").FontSize(22).ExtraBold().FontColor("#0f172a");
                col.Item().Text("Materiales de Construcción").FontSize(10).Bold().FontColor("#d97706");
                col.Item().PaddingTop(2).Text("NIT: 901.458.789-1 · Régimen Común").FontSize(8).FontColor("#64748b");
                col.Item().Text("Dirección: Zona Industrial Los Andes #45-12, Bogotá").FontSize(8).FontColor("#64748b");
                col.Item().Text("Teléfono: +57 (601) 745-9000 · ventas@firmeza.local").FontSize(8).FontColor("#64748b");
            });

            row.ConstantItem(200).Column(col =>
            {
                col.Item().Border(1).BorderColor("#e2e8f0").Background("#f8fafc").Padding(10).Column(card =>
                {
                    card.Item().Text("RECIBO DE VENTA").FontSize(11).ExtraBold().FontColor("#0f172a");
                    card.Item().Text($"No. {sale.SaleNumber}").FontSize(13).ExtraBold().FontColor("#d97706");
                    card.Item().PaddingTop(4).Text($"Fecha: {sale.SaleDate.ToLocalTime():dd/MM/yyyy HH:mm}").FontSize(8).FontColor("#475569");
                    
                    var statusColor = sale.Status == SaleStatus.Cancelled ? "#e11d48" : "#059669";
                    var statusText = sale.Status switch
                    {
                        SaleStatus.Pending => "Pendiente",
                        SaleStatus.Confirmed => "Confirmada",
                        SaleStatus.Delivered => "Entregada",
                        SaleStatus.Cancelled => "Cancelada",
                        _ => sale.Status.ToString()
                    };
                    card.Item().Text($"Estado: {statusText}").FontSize(8).Bold().FontColor(statusColor);
                });
            });
        });
    }

    private static void ComposeContent(IContainer container, Sale sale, decimal subtotalBase, decimal iva, CultureInfo culture)
    {
        container.PaddingVertical(16).Column(col =>
        {
            // Panel de información del cliente
            col.Item().Border(1).BorderColor("#e2e8f0").Background("#f8fafc").Padding(10).Column(cust =>
            {
                cust.Item().Text("DATOS DEL CLIENTE").FontSize(9).ExtraBold().FontColor("#d97706");
                cust.Item().PaddingTop(4).Row(rowCust =>
                {
                    rowCust.RelativeItem().Column(colLeft =>
                    {
                        colLeft.Item().Text(t =>
                        {
                            t.Span("Cliente: ").Bold();
                            t.Span(sale.Customer?.FullName ?? "Consumidor Final");
                        });
                        colLeft.Item().PaddingTop(2).Text(t =>
                        {
                            t.Span("Teléfono: ").Bold();
                            t.Span(sale.Customer?.Phone ?? "No registrado");
                        });
                        if (!string.IsNullOrWhiteSpace(sale.Customer?.Address))
                        {
                            colLeft.Item().PaddingTop(2).Text(t =>
                            {
                                t.Span("Dirección: ").Bold();
                                t.Span(sale.Customer.Address);
                            });
                        }
                    });

                    rowCust.RelativeItem().Column(colRight =>
                    {
                        colRight.Item().Text(t =>
                        {
                            t.Span("Identificación / NIT: ").Bold();
                            t.Span(sale.Customer?.Document ?? "222222222222");
                        });
                        colRight.Item().PaddingTop(2).Text(t =>
                        {
                            t.Span("Correo: ").Bold();
                            t.Span(sale.Customer?.Email ?? "No registrado");
                        });
                    });
                });
            });

            col.Item().PaddingTop(16);

            // Tabla de productos
            col.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(24); // #
                    columns.ConstantColumn(80); // SKU
                    columns.RelativeColumn(3);  // Descripción
                    columns.RelativeColumn(1);  // Cantidad
                    columns.RelativeColumn(1.4f); // Precio Unit
                    columns.RelativeColumn(1.4f); // Subtotal
                });

                table.Header(header =>
                {
                    header.Cell().Background("#0f172a").Padding(6).Text("#").Bold().FontColor("#ffffff");
                    header.Cell().Background("#0f172a").Padding(6).Text("Código").Bold().FontColor("#ffffff");
                    header.Cell().Background("#0f172a").Padding(6).Text("Descripción").Bold().FontColor("#ffffff");
                    header.Cell().Background("#0f172a").Padding(6).AlignRight().Text("Cant.").Bold().FontColor("#ffffff");
                    header.Cell().Background("#0f172a").Padding(6).AlignRight().Text("Precio Unit.").Bold().FontColor("#ffffff");
                    header.Cell().Background("#0f172a").Padding(6).AlignRight().Text("Subtotal").Bold().FontColor("#ffffff");
                });

                var idx = 1;
                foreach (var detail in sale.Details)
                {
                    var bg = idx % 2 == 0 ? "#f8fafc" : "#ffffff";
                    table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(6).Text(idx.ToString());
                    table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(6).Text(detail.Product?.Sku ?? "-");
                    table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(6).Text(detail.Product?.Name ?? "Producto");
                    table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(6).AlignRight().Text(detail.Quantity.ToString());
                    table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(6).AlignRight().Text(detail.UnitPrice.ToString("C2", culture));
                    table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(6).AlignRight().Text(detail.Subtotal.ToString("C2", culture));
                    idx++;
                }
            });

            col.Item().PaddingTop(12);

            // Resumen de Totales e IVA
            col.Item().Row(row =>
            {
                row.RelativeItem().PaddingRight(20).Column(notes =>
                {
                    notes.Item().Text("Condiciones y soporte:").FontSize(8).Bold().FontColor("#64748b");
                    notes.Item().Text("• Mercancía revisada y entregada a satisfacción.").FontSize(7.5f).FontColor("#94a3b8");
                    notes.Item().Text("• Para reclamos o garantías conserve este comprobante.").FontSize(7.5f).FontColor("#94a3b8");
                    notes.Item().Text("• Firmeza garantiza la calidad de sus materiales.").FontSize(7.5f).FontColor("#94a3b8");
                });

                row.ConstantItem(240).Border(1).BorderColor("#e2e8f0").Background("#f8fafc").Padding(10).Column(totals =>
                {
                    totals.Item().Row(r =>
                    {
                        r.RelativeItem().Text("Subtotal (Base):").FontSize(9).FontColor("#475569");
                        r.RelativeItem().AlignRight().Text(subtotalBase.ToString("C2", culture)).FontSize(9).Bold().FontColor("#334155");
                    });

                    totals.Item().PaddingTop(3).Row(r =>
                    {
                        r.RelativeItem().Text($"IVA ({InventoryCalculator.TaxRate:P0}):").FontSize(9).FontColor("#475569");
                        r.RelativeItem().AlignRight().Text(iva.ToString("C2", culture)).FontSize(9).Bold().FontColor("#334155");
                    });

                    totals.Item().PaddingTop(5).BorderTop(1).BorderColor("#cbd5e1").Row(r =>
                    {
                        r.RelativeItem().Text("TOTAL A PAGAR:").FontSize(11).ExtraBold().FontColor("#0f172a");
                        r.RelativeItem().AlignRight().Text(sale.Total.ToString("C2", culture)).FontSize(12).ExtraBold().FontColor("#d97706");
                    });
                });
            });
        });
    }

    private static void ComposeFooter(IContainer container)
    {
        container.BorderTop(1).BorderColor("#e2e8f0").PaddingTop(8).Row(row =>
        {
            row.RelativeItem().Text("Documento generado por Firmeza ERP · Soporte documental digital").FontSize(7.5f).FontColor("#94a3b8");
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
