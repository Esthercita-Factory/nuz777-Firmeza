using System.Globalization;
using Firmeza.Domain.Identity;
using Firmeza.Infrastructure.Identity;
using Firmeza.Infrastructure.Persistence;
using Firmeza.Domain.Entities;
using Firmeza.Web.Presentation.ViewModels.Customers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Firmeza.Web.Presentation.Controllers;

[Authorize(Roles = ApplicationRoles.Administrator)]
public class CustomersController : Controller
{
    private readonly ApplicationDbContext _db;

    public CustomersController(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IActionResult> Index(string? q, bool soloActivos = false)
    {
        var query = _db.Customers.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(customer => customer.FullName.Contains(term) || customer.Document.Contains(term) || customer.Email.Contains(term));
        }

        if (soloActivos)
        {
            query = query.Where(customer => customer.IsActive);
        }

        ViewData["Query"] = q;
        ViewData["SoloActivos"] = soloActivos;
        var customers = await query.OrderByDescending(customer => customer.IsActive).ThenBy(customer => customer.FullName).Select(customer => new CustomerListItemViewModel
        {
            Id = customer.Id,
            Document = customer.Document,
            FullName = customer.FullName,
            Age = customer.Age,
            Email = customer.Email,
            Phone = customer.Phone,
            IsActive = customer.IsActive
        }).ToListAsync();

        return View(customers);
    }

    [HttpGet]
    public IActionResult Create() => View(new CustomerFormViewModel { Age = 18 });

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(CustomerFormViewModel model)
    {
        ValidateAgeInput();
        await ValidateUniqueFieldsAsync(model, null);
        if (!ModelState.IsValid)
        {
            return View(model);
        }

        var customer = new Customer();
        Apply(model, customer);
        _db.Customers.Add(customer);
        await _db.SaveChangesAsync();
        TempData["Message"] = "Cliente creado correctamente.";
        return RedirectToAction(nameof(Index));
    }

    [HttpGet]
    public async Task<IActionResult> Edit(Guid id)
    {
        var customer = await _db.Customers.FindAsync(id);
        return customer is null ? NotFound() : View(ToForm(customer));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(Guid id, CustomerFormViewModel model)
    {
        if (id != model.Id)
        {
            return BadRequest();
        }

        ValidateAgeInput();
        await ValidateUniqueFieldsAsync(model, model.Id);
        if (!ModelState.IsValid)
        {
            return View(model);
        }

        var customer = await _db.Customers.FindAsync(id);
        if (customer is null)
        {
            return NotFound();
        }

        Apply(model, customer);
        customer.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        TempData["Message"] = "Cliente actualizado correctamente.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(Guid id)
    {
        var customer = await _db.Customers.FindAsync(id);
        if (customer is null)
        {
            return RedirectToAction(nameof(Index));
        }

        try
        {
            _db.Customers.Remove(customer);
            await _db.SaveChangesAsync();
            TempData["Message"] = "Cliente eliminado correctamente.";
        }
        catch (DbUpdateException)
        {
            TempData["Error"] = "No se puede eliminar un cliente que tiene ventas asociadas.";
        }

        return RedirectToAction(nameof(Index));
    }

    private void ValidateAgeInput()
    {
        var rawAge = Request.Form["Age"].FirstOrDefault();
        try
        {
            _ = int.Parse(rawAge ?? string.Empty, CultureInfo.InvariantCulture);
        }
        catch (FormatException)
        {
            ModelState.AddModelError(nameof(CustomerFormViewModel.Age), "La edad debe ser un número entero.");
        }
        catch (OverflowException)
        {
            ModelState.AddModelError(nameof(CustomerFormViewModel.Age), "La edad está fuera de rango.");
        }
    }

    private async Task ValidateUniqueFieldsAsync(CustomerFormViewModel model, Guid? excludedId)
    {
        var document = model.Document.Trim();
        var email = model.Email.Trim().ToLowerInvariant();
        if (await _db.Customers.AnyAsync(customer => customer.Document == document && (excludedId == null || customer.Id != excludedId)))
        {
            ModelState.AddModelError(nameof(CustomerFormViewModel.Document), "Ya existe un cliente con ese documento.");
        }

        if (await _db.Customers.AnyAsync(customer => customer.Email == email && (excludedId == null || customer.Id != excludedId)))
        {
            ModelState.AddModelError(nameof(CustomerFormViewModel.Email), "Ya existe un cliente con ese correo.");
        }
    }

    private static void Apply(CustomerFormViewModel model, Customer customer)
    {
        customer.Document = model.Document.Trim();
        customer.FullName = model.FullName.Trim();
        customer.Age = model.Age;
        customer.Email = model.Email.Trim().ToLowerInvariant();
        customer.Phone = model.Phone.Trim();
        customer.Address = string.IsNullOrWhiteSpace(model.Address) ? null : model.Address.Trim();
        customer.IsActive = model.IsActive;
    }

    private static CustomerFormViewModel ToForm(Customer customer) => new()
    {
        Id = customer.Id,
        Document = customer.Document,
        FullName = customer.FullName,
        Age = customer.Age,
        Email = customer.Email,
        Phone = customer.Phone,
        Address = customer.Address,
        IsActive = customer.IsActive
    };
}
