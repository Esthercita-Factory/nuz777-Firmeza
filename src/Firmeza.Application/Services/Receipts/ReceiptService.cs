using System;
using System.Collections.Generic;
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
        var taxes = InventoryCalculator.SplitTaxInclusive(sale.Total);
        var subtotalBase = taxes.SubtotalBase;
        var iva = taxes.Tax;
        var culture = new CultureInfo("es-CO");

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(28);
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
        container.Column(col =>
        {
            // Barra superior decorativa corporativa (Azul marino + Ámbar)
            col.Item().PaddingBottom(12).Row(bar =>
            {
                bar.RelativeItem(4).Height(4).Background("#0f172a");
                bar.RelativeItem(1).Height(4).Background("#d97706");
            });

            // Cabecera principal: Marca a la izquierda, Tarjeta de comprobante a la derecha
            col.Item().Row(row =>
            {
                // Identidad corporativa
                row.RelativeItem().Column(brand =>
                {
                    brand.Item().Row(r =>
                    {
                        r.AutoItem().Border(1).BorderColor("#0f172a").Background("#0f172a").PaddingHorizontal(7).PaddingVertical(3)
                            .Text("F").FontSize(14).ExtraBold().FontColor("#ffffff");
                        r.RelativeItem().PaddingLeft(8).Column(c =>
                        {
                            c.Item().Text("FIRMEZA").FontSize(20).ExtraBold().FontColor("#0f172a");
                            c.Item().Text("MATERIALES DE CONSTRUCCIÓN & ACABADOS").FontSize(7.5f).Bold().FontColor("#d97706");
                        });
                    });

                    brand.Item().PaddingTop(6).Text("NIT: 901.458.789-1 · Régimen Común Responsable de IVA").FontSize(8).FontColor("#475569");
                    brand.Item().Text("Sede Principal: Zona Industrial Los Andes #45-12, Bogotá D.C.").FontSize(8).FontColor("#64748b");
                    brand.Item().Text("PBX: +57 (601) 745-9000 · Correo: ventas@firmeza.com").FontSize(8).FontColor("#64748b");
                    brand.Item().Text("Portal web y pedidos: https://firmeza.local").FontSize(8).FontColor("#64748b");
                });

                // Tarjeta de identificación del documento
                row.ConstantItem(210).Column(cardCol =>
                {
                    cardCol.Item().Border(1).BorderColor("#cbd5e1").Background("#f8fafc").Padding(10).Column(card =>
                    {
                        card.Item().Row(r =>
                        {
                            r.RelativeItem().Text("COMPROBANTE DE VENTA").FontSize(8.5f).ExtraBold().FontColor("#0f172a");
                            r.AutoItem().Background("#e2e8f0").PaddingHorizontal(4).PaddingVertical(1)
                                .Text("OFICIAL").FontSize(6.5f).Bold().FontColor("#334155");
                        });

                        card.Item().PaddingTop(3).Text($"No. {sale.SaleNumber}").FontSize(14).ExtraBold().FontColor("#d97706");
                        card.Item().PaddingTop(3).Text($"Fecha: {sale.SaleDate.ToLocalTime():dd/MM/yyyy HH:mm}").FontSize(8).FontColor("#475569");

                        var (bgColor, textColor, statusText) = sale.Status switch
                        {
                            SaleStatus.Confirmed => ("#ecfdf5", "#065f46", "CONFIRMADA"),
                            SaleStatus.Delivered => ("#ecfdf5", "#065f46", "ENTREGADA"),
                            SaleStatus.Pending => ("#fffbeb", "#92400e", "PENDIENTE"),
                            SaleStatus.Cancelled => ("#fef2f2", "#991b1b", "CANCELADA"),
                            _ => ("#f1f5f9", "#334155", sale.Status.ToString().ToUpperInvariant())
                        };

                        card.Item().PaddingTop(6).Background(bgColor).Border(1).BorderColor(textColor).PaddingVertical(2).AlignCenter()
                            .Text(statusText).FontSize(7.5f).ExtraBold().FontColor(textColor);
                    });
                });
            });
        });
    }

    private static void ComposeContent(IContainer container, Sale sale, decimal subtotalBase, decimal iva, CultureInfo culture)
    {
        container.PaddingVertical(12).Column(col =>
        {
            // Bloque informativo doble: Datos del cliente y Datos del pedido
            col.Item().Row(rowInfo =>
            {
                // Tarjeta Cliente
                rowInfo.RelativeItem().Border(1).BorderColor("#e2e8f0").Background("#f8fafc").Padding(10).Column(cust =>
                {
                    cust.Item().Row(r =>
                    {
                        r.RelativeItem().Text("DATOS DEL CLIENTE / RECEPTOR").FontSize(8.5f).ExtraBold().FontColor("#0f172a");
                        r.AutoItem().Text("IDENTIFICACIÓN FISCAL").FontSize(7f).Bold().FontColor("#d97706");
                    });

                    cust.Item().PaddingTop(6).Row(r =>
                    {
                        r.RelativeItem().Column(c =>
                        {
                            c.Item().Text(t =>
                            {
                                t.Span("Nombre / Razón Social: ").Bold().FontSize(8).FontColor("#475569");
                                t.Span(sale.Customer?.FullName ?? "Consumidor Final").Bold().FontSize(8.5f).FontColor("#0f172a");
                            });
                            c.Item().PaddingTop(2).Text(t =>
                            {
                                t.Span("Cédula / NIT: ").Bold().FontSize(8).FontColor("#475569");
                                t.Span(sale.Customer?.Document ?? "222222222222").FontSize(8).FontColor("#1e293b");
                            });
                            c.Item().PaddingTop(2).Text(t =>
                            {
                                t.Span("Teléfono: ").Bold().FontSize(8).FontColor("#475569");
                                t.Span(sale.Customer?.Phone ?? "No registrado").FontSize(8).FontColor("#1e293b");
                            });
                        });
                    });

                    cust.Item().PaddingTop(4).BorderTop(1).BorderColor("#f1f5f9").Row(r =>
                    {
                        r.RelativeItem().Column(c =>
                        {
                            c.Item().Text(t =>
                            {
                                t.Span("Correo: ").Bold().FontSize(7.5f).FontColor("#64748b");
                                t.Span(sale.Customer?.Email ?? "No registrado").FontSize(7.5f).FontColor("#1e293b");
                            });
                            if (!string.IsNullOrWhiteSpace(sale.Customer?.Address))
                            {
                                c.Item().PaddingTop(1).Text(t =>
                                {
                                  t.Span("Dirección: ").Bold().FontSize(7.5f).FontColor("#64748b");
                                  t.Span(sale.Customer.Address).FontSize(7.5f).FontColor("#1e293b");
                                });
                            }
                        });
                    });
                });

                rowInfo.ConstantItem(12);

                // Tarjeta de la Operación
                rowInfo.RelativeItem().Border(1).BorderColor("#e2e8f0").Background("#f8fafc").Padding(10).Column(oper =>
                {
                    oper.Item().Row(r =>
                    {
                        r.RelativeItem().Text("DETALLES DE LA OPERACIÓN").FontSize(8.5f).ExtraBold().FontColor("#0f172a");
                        r.AutoItem().Text("SOPORTE ERP").FontSize(7f).Bold().FontColor("#d97706");
                    });

                    oper.Item().PaddingTop(6).Column(c =>
                    {
                        c.Item().Text(t =>
                        {
                            t.Span("Moneda: ").Bold().FontSize(8).FontColor("#475569");
                            t.Span("Peso Colombiano (COP)").FontSize(8).FontColor("#1e293b");
                        });
                        c.Item().PaddingTop(2).Text(t =>
                        {
                            t.Span("Régimen de IVA: ").Bold().FontSize(8).FontColor("#475569");
                            t.Span($"Tarifa General {InventoryCalculator.TaxRate:P0} Incluida").FontSize(8).FontColor("#1e293b");
                        });
                        c.Item().PaddingTop(2).Text(t =>
                        {
                            t.Span("Canal de Venta: ").Bold().FontSize(8).FontColor("#475569");
                            t.Span("Firmeza ERP / Portal Digital").FontSize(8).FontColor("#1e293b");
                        });
                        c.Item().PaddingTop(2).Text(t =>
                        {
                            t.Span("ID de Registro: ").Bold().FontSize(8).FontColor("#475569");
                            t.Span(sale.Id.ToString("N")[..12].ToUpperInvariant()).FontSize(8).FontColor("#64748b");
                        });
                    });
                });
            });

            col.Item().PaddingTop(14);

            // Tabla de Productos con estilo corporativo
            col.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(24);   // #
                    columns.ConstantColumn(75);   // Código / SKU
                    columns.RelativeColumn(3.2f); // Descripción del Material
                    columns.ConstantColumn(45);   // Cantidad
                    columns.RelativeColumn(1.3f); // Precio Unitario
                    columns.RelativeColumn(1.4f); // Subtotal
                });

                table.Header(header =>
                {
                    header.Cell().Background("#0f172a").PaddingVertical(6).PaddingHorizontal(4).AlignCenter()
                        .Text("#").Bold().FontSize(8.5f).FontColor("#ffffff");
                    header.Cell().Background("#0f172a").PaddingVertical(6).PaddingHorizontal(6)
                        .Text("Código SKU").Bold().FontSize(8.5f).FontColor("#ffffff");
                    header.Cell().Background("#0f172a").PaddingVertical(6).PaddingHorizontal(6)
                        .Text("Descripción del Material").Bold().FontSize(8.5f).FontColor("#ffffff");
                    header.Cell().Background("#0f172a").PaddingVertical(6).PaddingHorizontal(4).AlignRight()
                        .Text("Cant.").Bold().FontSize(8.5f).FontColor("#ffffff");
                    header.Cell().Background("#0f172a").PaddingVertical(6).PaddingHorizontal(6).AlignRight()
                        .Text("Precio Unit.").Bold().FontSize(8.5f).FontColor("#ffffff");
                    header.Cell().Background("#0f172a").PaddingVertical(6).PaddingHorizontal(6).AlignRight()
                        .Text("Subtotal").Bold().FontSize(8.5f).FontColor("#ffffff");
                });

                var idx = 1;
                foreach (var detail in sale.Details)
                {
                    var bg = idx % 2 == 0 ? "#f8fafc" : "#ffffff";
                    table.Cell().Background(bg).BorderBottom(1).BorderColor("#e2e8f0").PaddingVertical(5).PaddingHorizontal(4).AlignCenter()
                        .Text(idx.ToString()).FontSize(8.5f).FontColor("#64748b");

                    table.Cell().Background(bg).BorderBottom(1).BorderColor("#e2e8f0").PaddingVertical(5).PaddingHorizontal(6)
                        .Text(detail.Product?.Sku ?? "-").FontSize(8.5f).Bold().FontColor("#0f172a");

                    table.Cell().Background(bg).BorderBottom(1).BorderColor("#e2e8f0").PaddingVertical(5).PaddingHorizontal(6)
                        .Text(detail.Product?.Name ?? "Producto").FontSize(8.5f).FontColor("#1e293b");

                    table.Cell().Background(bg).BorderBottom(1).BorderColor("#e2e8f0").PaddingVertical(5).PaddingHorizontal(4).AlignRight()
                        .Text(detail.Quantity.ToString()).FontSize(8.5f).Bold().FontColor("#0f172a");

                    table.Cell().Background(bg).BorderBottom(1).BorderColor("#e2e8f0").PaddingVertical(5).PaddingHorizontal(6).AlignRight()
                        .Text(detail.UnitPrice.ToString("C2", culture)).FontSize(8.5f).FontColor("#334155");

                    table.Cell().Background(bg).BorderBottom(1).BorderColor("#e2e8f0").PaddingVertical(5).PaddingHorizontal(6).AlignRight()
                        .Text(detail.Subtotal.ToString("C2", culture)).FontSize(8.5f).Bold().FontColor("#0f172a");

                    idx++;
                }
            });

            col.Item().PaddingTop(12);

            // Bloque final: Políticas y Cuadro de Totales
            col.Item().Row(row =>
            {
                // Notas y Condiciones
                row.RelativeItem().PaddingRight(20).Column(notes =>
                {
                    notes.Item().Border(1).BorderColor("#e2e8f0").Background("#fafaf9").Padding(8).Column(c =>
                    {
                        c.Item().Text("TÉRMINOS Y CONDICIONES DE SUMINISTRO:").FontSize(8).Bold().FontColor("#0f172a");
                        c.Item().PaddingTop(3).Text("• Mercancía inspeccionada y entregada a entera satisfacción del comprador.").FontSize(7.2f).FontColor("#64748b");
                        c.Item().Text("• Todo reclamo o solicitud de garantía requiere la presentación de este documento.").FontSize(7.2f).FontColor("#64748b");
                        c.Item().Text("• No se aceptan cambios ni devoluciones en agregados y cemento después de su despacho.").FontSize(7.2f).FontColor("#64748b");
                        c.Item().Text("• Firmeza certifica la procedencia y calidad técnica de todos sus materiales.").FontSize(7.2f).FontColor("#64748b");
                    });
                });

                // Caja de Totales Destacada
                row.ConstantItem(240).Border(1).BorderColor("#cbd5e1").Background("#f8fafc").Padding(10).Column(totals =>
                {
                    totals.Item().Row(r =>
                    {
                        r.RelativeItem().Text("Subtotal Gravable (Base):").FontSize(8.5f).FontColor("#475569");
                        r.RelativeItem().AlignRight().Text(subtotalBase.ToString("C2", culture)).FontSize(8.5f).Bold().FontColor("#334155");
                    });

                    totals.Item().PaddingTop(4).Row(r =>
                    {
                        r.RelativeItem().Text($"IVA Discriminado ({InventoryCalculator.TaxRate:P0}):").FontSize(8.5f).FontColor("#475569");
                        r.RelativeItem().AlignRight().Text(iva.ToString("C2", culture)).FontSize(8.5f).Bold().FontColor("#334155");
                    });

                    // Banner de Total Final
                    totals.Item().PaddingTop(8).Background("#0f172a").PaddingVertical(8).PaddingHorizontal(8).Row(r =>
                    {
                        r.RelativeItem().Text("TOTAL A PAGAR:").FontSize(9.5f).ExtraBold().FontColor("#ffffff");
                        r.RelativeItem().AlignRight().Text(sale.Total.ToString("C2", culture)).FontSize(12.5f).ExtraBold().FontColor("#fbbf24");
                    });
                });
            });
        });
    }

    private static void ComposeFooter(IContainer container)
    {
        container.BorderTop(1).BorderColor("#e2e8f0").PaddingTop(8).Row(row =>
        {
            row.RelativeItem().Column(col =>
            {
                col.Item().Text("Firmeza S.A.S. · NIT 901.458.789-1 · Documento oficial emitido por Firmeza ERP v2.0").FontSize(7.5f).FontColor("#94a3b8");
                col.Item().Text("Para consultas o validación de comprobantes comuníquese a soporte@firmeza.com").FontSize(7f).FontColor("#cbd5e1");
            });

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