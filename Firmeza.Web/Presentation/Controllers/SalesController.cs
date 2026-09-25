using Firmeza.Domain.Identity;
using Firmeza.Infrastructure.Identity;
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

    public SalesController(ApplicationDbContext db)
    {
        _db = db;
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
}
