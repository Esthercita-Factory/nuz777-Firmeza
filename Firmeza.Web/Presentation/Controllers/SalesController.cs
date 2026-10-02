using Firmeza.Application.Services.Exports;
using Firmeza.Application.Services.Receipts;
using Firmeza.Domain.Entities;
using Firmeza.Domain.Enums;
using Firmeza.Domain.Identity;
using Firmeza.Domain.Services;
using Firmeza.Infrastructure.Persistence;
using Firmeza.Web.Presentation.ViewModels.Sales;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Firmeza.Web.Presentation.Controllers;

[Authorize(Roles = ApplicationRoles.Administrator)]
public class SalesController : Controller
{
    private readonly ApplicationDbContext _db;
    private readonly IExportService _exportService;
    private readonly IReceiptService _receiptService;
    private readonly IWebHostEnvironment _env;

    public SalesController(
        ApplicationDbContext db,
        IExportService exportService,
        IReceiptService receiptService,
        IWebHostEnvironment env)
    {
        _db = db;
        _exportService = exportService;
        _receiptService = receiptService;
        _env = env;
    }

    [HttpGet]
    public async Task<IActionResult> ExportExcel(CancellationToken cancellationToken)
    {
        var bytes = await _exportService.ExportSalesToExcelAsync(cancellationToken);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"reporte_ventas_{DateTime.Now:yyyyMMdd_HHmm}.xlsx");
    }

    [HttpGet]
    public async Task<IActionResult> ExportPdf(CancellationToken cancellationToken)
    {
        var bytes = await _exportService.ExportSalesToPdfAsync(cancellationToken);
        return File(bytes, "application/pdf", $"reporte_ventas_{DateTime.Now:yyyyMMdd_HHmm}.pdf");
    }

    public async Task<IActionResult> Index(string? q)
    {
        var query = _db.Sales.AsNoTracking().Include(sale => sale.Customer).AsQueryable();
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(sale => sale.SaleNumber.Contains(term) || sale.Customer.FullName.Contains(term));
        }

        ViewData["Query"] = q;
        var sales = await query.OrderByDescending(sale => sale.SaleDate).Select(sale => new SaleListItemViewModel
        {
            Id = sale.Id,
            SaleNumber = sale.SaleNumber,
            CustomerName = sale.Customer.FullName,
            SaleDate = sale.SaleDate,
            Status = sale.Status.ToString(),
            Total = sale.Total
        }).ToListAsync();

        return View(sales);
    }

    [HttpGet]
    public async Task<IActionResult> Create()
    {
        var model = new CreateSaleFormViewModel();
        await PopulateSelectOptionsAsync(model);
        return View(model);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(CreateSaleFormViewModel model)
    {
        // Limpiar líneas vacías
        model.Lines = model.Lines.Where(l => l.ProductId != Guid.Empty && l.Quantity > 0).ToList();

        if (model.CustomerId == Guid.Empty)
        {
            ModelState.AddModelError(nameof(model.CustomerId), "Debes seleccionar un cliente.");
        }

        if (model.Lines.Count == 0)
        {
            ModelState.AddModelError(string.Empty, "La venta debe tener al menos un producto.");
        }

        var customer = await _db.Customers.FindAsync(model.CustomerId);
        if (customer == null || !customer.IsActive)
        {
            ModelState.AddModelError(nameof(model.CustomerId), "El cliente seleccionado no existe o está inactivo.");
        }

        var productIds = model.Lines.Select(l => l.ProductId).Distinct().ToList();
        var products = await _db.Products.Where(p => productIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id);

        foreach (var line in model.Lines)
        {
            if (!products.TryGetValue(line.ProductId, out var product))
            {
                ModelState.AddModelError(string.Empty, "Uno de los productos seleccionados no existe.");
                continue;
            }

            if (!product.IsActive)
            {
                ModelState.AddModelError(string.Empty, $"El producto '{product.Name}' está inactivo.");
            }

            if (product.Stock < line.Quantity)
            {
                ModelState.AddModelError(string.Empty, $"Stock insuficiente para '{product.Name}'. Disponible: {product.Stock}.");
            }
        }

        if (!ModelState.IsValid)
        {
            await PopulateSelectOptionsAsync(model);
            return View(model);
        }

        var now = DateTimeOffset.UtcNow;
        var saleId = Guid.NewGuid();
        var saleNumber = SaleNumberGenerator.Next(now, saleId);

        var details = new List<SaleDetail>();
        foreach (var line in model.Lines)
        {
            var product = products[line.ProductId];
            var unitPrice = line.UnitPrice ?? product.Price;
            var subtotal = InventoryCalculator.CalculateLineTotal(line.Quantity, unitPrice);

            // Descontar inventario
            product.Stock -= line.Quantity;

            details.Add(new SaleDetail
            {
                Id = Guid.NewGuid(),
                SaleId = saleId,
                ProductId = product.Id,
                Quantity = line.Quantity,
                UnitPrice = unitPrice,
                Subtotal = subtotal
            });
        }

        var sale = new Sale
        {
            Id = saleId,
            SaleNumber = saleNumber,
            CustomerId = customer!.Id,
            Customer = customer,
            SaleDate = now,
            Status = SaleStatus.Confirmed,
            Total = InventoryCalculator.CalculateTotal(details.Select(d => (d.Quantity, d.UnitPrice))),
            Details = details
        };

        _db.Sales.Add(sale);
        await _db.SaveChangesAsync();

        // Generar y almacenar el comprobante PDF en wwwroot/recibos
        var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        try
        {
            await _receiptService.EnsureReceiptPdfSavedAsync(sale, webRoot);
        }
        catch
        {
            // El comprobante podrá generarse a demanda en la descarga
        }

        TempData["Message"] = $"Venta {sale.SaleNumber} registrada exitosamente. Se generó su recibo en PDF.";
        TempData["ReceiptSaleId"] = sale.Id.ToString();
        return RedirectToAction(nameof(Details), new { id = sale.Id });
    }

    [HttpGet]
    public async Task<IActionResult> DownloadReceipt(Guid id, CancellationToken cancellationToken)
    {
        var sale = await _db.Sales
            .AsNoTracking()
            .Include(s => s.Customer)
            .Include(s => s.Details)
            .ThenInclude(d => d.Product)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        if (sale is null)
        {
            return NotFound();
        }

        var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        await _receiptService.EnsureReceiptPdfSavedAsync(sale, webRoot, cancellationToken);

        var pdfBytes = _receiptService.GenerateReceiptPdf(sale);
        return File(pdfBytes, "application/pdf", $"recibo_{sale.SaleNumber}.pdf");
    }

    public async Task<IActionResult> Details(Guid id)
    {
        var sale = await _db.Sales
            .AsNoTracking()
            .Include(item => item.Customer)
            .Include(item => item.Details)
            .ThenInclude(detail => detail.Product)
            .FirstOrDefaultAsync(item => item.Id == id);

        if (sale is null)
        {
            return NotFound();
        }

        // Asegurar que el recibo esté en wwwroot/recibos
        var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        try
        {
            await _receiptService.EnsureReceiptPdfSavedAsync(sale, webRoot);
        }
        catch
        {
            // Continuar si ocurre error en la pre-generación
        }

        var model = new SaleDetailsViewModel
        {
            Id = sale.Id,
            SaleNumber = sale.SaleNumber,
            CustomerName = sale.Customer.FullName,
            CustomerDocument = sale.Customer.Document,
            SaleDate = sale.SaleDate,
            Status = sale.Status.ToString(),
            Total = sale.Total,
            Details = sale.Details.Select(detail => new SaleDetailViewModel
            {
                ProductName = detail.Product.Name,
                ProductSku = detail.Product.Sku,
                Quantity = detail.Quantity,
                UnitPrice = detail.UnitPrice,
                Subtotal = detail.Subtotal
            }).ToList()
        };

        return View(model);
    }

    private async Task PopulateSelectOptionsAsync(CreateSaleFormViewModel model)
    {
        model.Customers = await _db.Customers
            .AsNoTracking()
            .Where(c => c.IsActive)
            .OrderBy(c => c.FullName)
            .Select(c => new CustomerOptionViewModel
            {
                Id = c.Id,
                DisplayText = $"{c.FullName} ({c.Document})"
            })
            .ToListAsync();

        model.Products = await _db.Products
            .AsNoTracking()
            .Where(p => p.IsActive && p.Stock > 0)
            .OrderBy(p => p.Name)
            .Select(p => new ProductOptionViewModel
            {
                Id = p.Id,
                Sku = p.Sku,
                Name = p.Name,
                Price = p.Price,
                Stock = p.Stock,
                Unit = p.Unit
            })
            .ToListAsync();
    }
}
