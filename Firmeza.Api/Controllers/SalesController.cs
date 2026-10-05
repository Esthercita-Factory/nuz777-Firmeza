using Firmeza.Application.Abstractions;
using Firmeza.Application.Common;
using Firmeza.Application.Dtos.Sales;
using Firmeza.Application.Services.Sales;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Firmeza.Api.Controllers;

[ApiController]
[Route("api/sales")]
[Authorize]
public sealed class SalesController : ControllerBase
{
    private readonly ISaleService _sales;

    public SalesController(ISaleService sales)
    {
        _sales = sales;
    }

    /// <summary>Lista paginada de ventas con busqueda por numero o cliente.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<SaleSummaryResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<SaleSummaryResponse>>> List([FromQuery] SaleQuery query, CancellationToken cancellationToken)
        => Ok(await _sales.ListAsync(query, cancellationToken));

    /// <summary>Obtiene una venta con sus lineas de detalle.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(SaleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SaleResponse>> GetById(Guid id, CancellationToken cancellationToken)
        => Ok(await _sales.GetByIdAsync(id, cancellationToken));

    /// <summary>Registra una venta: valida stock, descuenta inventario y calcula totales.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(SaleResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<SaleResponse>> Create([FromBody] SaleRequest request, CancellationToken cancellationToken)
    {
        var result = await _sales.CreateAsync(request, cancellationToken);
        if (result.IsFailure)
        {
            return new ObjectResult(result);
        }

        return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result);
    }

    /// <summary>Descarga el comprobante/recibo oficial en formato PDF.</summary>
    [HttpGet("{id:guid}/receipt")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadReceipt(
        Guid id,
        [FromServices] ISaleRepository saleRepository,
        [FromServices] Firmeza.Application.Services.Receipts.IReceiptService receiptService,
        CancellationToken cancellationToken)
    {
        var sale = await saleRepository.FindWithDetailsAsync(id, cancellationToken);
        if (sale is null)
        {
            return NotFound();
        }

        var pdfBytes = receiptService.GenerateReceiptPdf(sale);
        return File(pdfBytes, "application/pdf", $"recibo_{sale.SaleNumber}.pdf");
    }

    /// <summary>Exporta el consolidado de ventas a Excel (.xlsx).</summary>
    [HttpGet("export/excel")]
    public async Task<IActionResult> ExportExcel(
        [FromServices] Firmeza.Application.Services.Exports.IExportService exportService,
        CancellationToken cancellationToken)
    {
        var bytes = await exportService.ExportSalesToExcelAsync(cancellationToken);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"ventas_{DateTime.Now:yyyyMMdd_HHmm}.xlsx");
    }

    /// <summary>Exporta el consolidado de ventas a PDF.</summary>
    [HttpGet("export/pdf")]
    public async Task<IActionResult> ExportPdf(
        [FromServices] Firmeza.Application.Services.Exports.IExportService exportService,
        CancellationToken cancellationToken)
    {
        var bytes = await exportService.ExportSalesToPdfAsync(cancellationToken);
        return File(bytes, "application/pdf", $"ventas_{DateTime.Now:yyyyMMdd_HHmm}.pdf");
    }

    /// <summary>Actualiza una venta existente: recalcula stock y totales.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(SaleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<SaleResponse>> Update(Guid id, [FromBody] SaleRequest request, CancellationToken cancellationToken)
    {
        var result = await _sales.UpdateAsync(id, request, cancellationToken);
        if (result.IsFailure)
        {
            return new ObjectResult(result);
        }

        return Ok(result);
    }

    /// <summary>Borra una venta y restaura el stock de sus productos.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await _sales.DeleteAsync(id, cancellationToken);
        if (result.IsFailure)
        {
            if (result.Error.Code == ErrorCode.NotFound)
            {
                return NotFound(result);
            }
            if (result.Error.Code == ErrorCode.BusinessRule)
            {
                return Conflict(result.Error!.Message);
            }
            return Conflict(result);
        }
        return NoContent();
    }
}