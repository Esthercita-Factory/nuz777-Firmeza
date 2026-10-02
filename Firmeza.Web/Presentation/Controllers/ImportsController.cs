using Firmeza.Application.Services.BulkImport;
using Firmeza.Domain.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Firmeza.Web.Presentation.Controllers;

[Authorize(Roles = ApplicationRoles.Administrator)]
public sealed class ImportsController : Controller
{
    private readonly IBulkImportService _bulkImportService;

    public ImportsController(IBulkImportService bulkImportService)
    {
        _bulkImportService = bulkImportService;
    }

    [HttpGet]
    public IActionResult Index()
    {
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Upload(IFormFile? file, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            ViewBag.ErrorMessage = "Por favor selecciona un archivo Excel (.xlsx) para importar.";
            return View("Index");
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".xlsx")
        {
            ViewBag.ErrorMessage = "El archivo debe ser un libro de Excel con extensión .xlsx.";
            return View("Index");
        }

        using var stream = new MemoryStream();
        await file.CopyToAsync(stream, cancellationToken);
        stream.Position = 0;

        var result = await _bulkImportService.ImportFromExcelAsync(stream, cancellationToken);

        if (result.Success)
        {
            TempData["Message"] = $"Carga masiva completada con éxito. Se procesaron {result.TotalRowsProcessed} filas.";
        }
        else if (result.ProductsCreated + result.ProductsUpdated + result.CustomersCreated + result.CustomersUpdated + result.SalesCreated > 0)
        {
            TempData["Message"] = $"Carga masiva completada parcialmente con algunas inconsistencias.";
        }
        else
        {
            TempData["Error"] = "No se pudieron importar los datos debido a errores en el archivo.";
        }

        return View("Index", result);
    }

    [HttpGet]
    public async Task<IActionResult> DownloadTemplate()
    {
        var bytes = await _bulkImportService.GenerateImportTemplateAsync();
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "plantilla_carga_masiva_firmeza.xlsx");
    }
}
