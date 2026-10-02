using Firmeza.Application.Services.BulkImport;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Firmeza.Api.Controllers;

[ApiController]
[Route("api/imports")]
[Authorize]
public sealed class ImportsController : ControllerBase
{
    private readonly IBulkImportService _bulkImportService;

    public ImportsController(IBulkImportService bulkImportService)
    {
        _bulkImportService = bulkImportService;
    }

    /// <summary>Realiza la carga masiva de datos desnormalizados mediante un archivo Excel (.xlsx).</summary>
    [HttpPost("excel")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ImportResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ImportResult>> Upload(IFormFile? file, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Debes proporcionar un archivo Excel (.xlsx)." });
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".xlsx")
        {
            return BadRequest(new { message = "El archivo debe ser formato Excel (.xlsx)." });
        }

        using var stream = new MemoryStream();
        await file.CopyToAsync(stream, cancellationToken);
        stream.Position = 0;

        var result = await _bulkImportService.ImportFromExcelAsync(stream, cancellationToken);
        return Ok(result);
    }

    /// <summary>Descarga la plantilla oficial en Excel (.xlsx) con datos de ejemplo y hoja de instrucciones.</summary>
    [HttpGet("template")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> DownloadTemplate()
    {
        var bytes = await _bulkImportService.GenerateImportTemplateAsync();
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "plantilla_carga_masiva_firmeza.xlsx");
    }
}
