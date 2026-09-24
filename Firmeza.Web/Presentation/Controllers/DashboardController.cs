using Firmeza.Web.Infrastructure.Identity;
using Firmeza.Web.Infrastructure.Persistence;
using Firmeza.Web.Domain.Enums;
using Firmeza.Web.Presentation.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Firmeza.Web.Presentation.Controllers;

[Authorize(Roles = ApplicationRoles.Administrator)]
public class DashboardController : Controller
{
    private readonly ApplicationDbContext _db;

    public DashboardController(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IActionResult> Index()
    {
        var model = new DashboardViewModel
        {
            ProductCount = await _db.Products.CountAsync(product => product.IsActive),
            CustomerCount = await _db.Customers.CountAsync(customer => customer.IsActive),
            SaleCount = await _db.Sales.CountAsync(),
            SalesTotal = await _db.Sales.Where(sale => sale.Status != SaleStatus.Cancelled).Select(sale => (decimal?)sale.Total).SumAsync() ?? 0,
            RecentSales = await _db.Sales
                .AsNoTracking()
                .Include(sale => sale.Customer)
                .OrderByDescending(sale => sale.SaleDate)
                .Take(5)
                .Select(sale => new RecentSaleViewModel
                {
                    Id = sale.Id,
                    SaleNumber = sale.SaleNumber,
                    CustomerName = sale.Customer.FullName,
                    SaleDate = sale.SaleDate,
                    Total = sale.Total,
                    Status = sale.Status.ToString()
                })
                .ToListAsync()
        };

        return View(model);
    }
}
