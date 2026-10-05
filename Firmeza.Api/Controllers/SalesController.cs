using Firmeza.Api.Infrastructure;
using Firmeza.Application.Abstractions;
using Firmeza.Application.Common;
using Firmeza.Application.Dtos.Sales;
using Firmeza.Application.Services.Sales;
using Firmeza.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Firmeza.Api.Controllers;

/// <summary>
/// Ventas.
///
/// Disponibles para el rol Cliente (que compra desde el portal) y para el
/// Administrador. Un Cliente solo alcanza sus propias ventas: el alcance se
/// resuelve con el correo del token, no con lo que mande en la peticion.
/// </summary>
[ApiController]
[Route("api/sales")]
[Authorize]
public sealed class SalesController : ControllerBase
{
    private readonly ISaleService _sales;
    private readonly ICustomerRepository _customers;
    private readonly ISaleRepository _saleRepository;

    public SalesController(ISaleService sales, ICustomerRepository customers, ISaleRepository saleRepository)
    {
        _sales = sales;
        _customers = customers;
        _saleRepository = saleRepository;
    }

    /// <summary>
    /// Cliente asociado a la cuenta autenticada. Para el Administrador devuelve
    /// null, que significa "sin filtro".
    /// </summary>
    private async Task<Guid?> ResolveScopeAsync()
    {
        if (this.IsAdministrator())
        {
            return null;
        }

        var email = this.AuthenticatedEmail();
        if (string.IsNullOrWhiteSpace(email))
        {
            return null;
        }

        var customer = await _customers.FindByEmailAsync(email, CancellationToken.None);
        return customer?.Id;
    }

    /// <summary>
    /// True si quien llama puede ver esa venta: el Administrador siempre, y un
    /// Cliente solo si es de su propia ficha.
    ///
    /// Cuando la venta existe pero es de otro se responde 403, no 404: el 404
    /// solo se usa cuando el recurso no esta o el Administrador busca algo
    /// inexistente, para no filtrar la existencia del dato.
    /// </summary>
    private async Task<bool> CanAccessSaleAsync(Guid saleId)
    {
        if (this.IsAdministrator())
        {
            return true;
        }

        var sale = await _sales.GetByIdAsync(saleId, CancellationToken.None);
        if (!sale.IsSuccess)
        {
            return false;
        }

        var mine = await ResolveScopeAsync();
        return mine is not null && sale.Value!.CustomerId == mine.Value;
    }

    /// <summary>Lista paginada de ventas. El Cliente solo ve las propias.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<SaleSummaryResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<SaleSummaryResponse>>> List([FromQuery] SaleQuery query, CancellationToken cancellationToken)
    {
        var scoped = query with { CustomerId = await ResolveScopeAsync() };
        return Ok(await _sales.ListAsync(scoped, cancellationToken));
    }

    /// <summary>Obtiene una venta con sus lineas de detalle.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(SaleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<SaleResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        if (!await CanAccessSaleAsync(id))
        {
            return this.IsAdministrator() ? NotFound() : this.Forbidden("La venta no pertenece a tu cuenta.");
        }

        return Ok(await _sales.GetByIdAsync(id, cancellationToken));
    }

    /// <summary>
    /// Registra una venta: valida stock, descuenta inventario y calcula totales.
    /// Un Cliente compra para si mismo; el Administrador puede registrar una venta
    /// para cualquier cliente del directorio.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(SaleResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<SaleResponse>> Create([FromBody] SaleRequest request, CancellationToken cancellationToken)
    {
        // El cliente de la venta lo decide el servidor: un Cliente compra para su
        // propia ficha y el valor del cuerpo se descarta; el Administrador puede
        // registrar una venta para cualquiera del directorio.
        var customerId = request.CustomerId;

        if (!this.IsAdministrator())
        {
            var mine = await ResolveScopeAsync();
            if (mine is null)
            {
                return this.Forbidden("Tu cuenta aun no esta vinculada a una ficha de cliente.");
            }

            customerId = mine.Value;
        }
        else if (customerId is null)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Solicitud invalida",
                Detail = "El cliente es obligatorio.",
                Status = StatusCodes.Status400BadRequest
            });
        }

        request.CustomerId = customerId;

        // El cliente del portal solicita: su venta nace Pendiente y el estado
        // que mande en el cuerpo se descarta. Confirmar y entregar es del admin.
        if (!this.IsAdministrator())
        {
            var pending = await _saleRepository.CountByStatusAsync(SaleStatus.Pending, customerId.Value, cancellationToken);
            if (pending >= SaleServiceLimits.MaxPendingPerCustomer)
            {
                return Conflict(new ProblemDetails
                {
                    Title = "Demasiadas solicitudes pendientes",
                    Detail = $"Ya tenes {pending} solicitudes pendientes. Espera a que se confirmen antes de enviar otra.",
                    Status = StatusCodes.Status409Conflict
                });
            }

            request.Status = SaleStatus.Pending;
        }

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
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DownloadReceipt(
        Guid id,
        [FromServices] ISaleRepository saleRepository,
        [FromServices] Firmeza.Application.Services.Receipts.IReceiptService receiptService,
        CancellationToken cancellationToken)
    {
        if (!await CanAccessSaleAsync(id))
        {
            return this.IsAdministrator() ? NotFound() : this.Forbidden("La venta no pertenece a tu cuenta.");
        }

        var sale = await saleRepository.FindWithDetailsAsync(id, cancellationToken);
        if (sale is null)
        {
            return NotFound();
        }

        var pdfBytes = receiptService.GenerateReceiptPdf(sale);
        return File(pdfBytes, "application/pdf", $"recibo_{sale.SaleNumber}.pdf");
    }

    /// <summary>Exporta el consolidado de ventas a Excel (.xlsx). Solo Administrador.</summary>
    [HttpGet("export/excel")]
    [Authorize(Roles = Firmeza.Domain.Identity.ApplicationRoles.Administrator)]
    public async Task<IActionResult> ExportExcel(
        [FromServices] Firmeza.Application.Services.Exports.IExportService exportService,
        CancellationToken cancellationToken)
    {
        var bytes = await exportService.ExportSalesToExcelAsync(cancellationToken);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"ventas_{DateTime.Now:yyyyMMdd_HHmm}.xlsx");
    }

    /// <summary>Exporta el consolidado de ventas a PDF. Solo Administrador.</summary>
    [HttpGet("export/pdf")]
    [Authorize(Roles = Firmeza.Domain.Identity.ApplicationRoles.Administrator)]
    public async Task<IActionResult> ExportPdf(
        [FromServices] Firmeza.Application.Services.Exports.IExportService exportService,
        CancellationToken cancellationToken)
    {
        var bytes = await exportService.ExportSalesToPdfAsync(cancellationToken);
        return File(bytes, "application/pdf", $"ventas_{DateTime.Now:yyyyMMdd_HHmm}.pdf");
    }

    /// <summary>
    /// Actualiza una venta existente: recalcula stock y totales.
    /// Solo Administrador: el Cliente no edita su historial de compras.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = Firmeza.Domain.Identity.ApplicationRoles.Administrator)]
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

    /// <summary>
    /// Cancela una solicitud pendiente. Disponible para el Cliente (siempre que
    /// sea suya y este pendiente) y para el Administrador. Confirmar y entregar
    /// siguen siendo solo del admin.
    /// </summary>
    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(typeof(SaleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<SaleResponse>> Cancel(Guid id, CancellationToken cancellationToken)
    {
        if (!await CanAccessSaleAsync(id))
        {
            return this.IsAdministrator() ? NotFound() : this.Forbidden("La venta no pertenece a tu cuenta.");
        }

        var result = await _sales.ChangeStatusAsync(id, SaleStatus.Cancelled, cancellationToken);
        if (result.IsFailure)
        {
            return new ObjectResult(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Avanza el estado de una venta. Solo Administrador: es el quien confirma lo
    /// que el cliente solicita y lo marca como entregado.
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = Firmeza.Domain.Identity.ApplicationRoles.Administrator)]
    [ProducesResponseType(typeof(SaleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<SaleResponse>> ChangeStatus(
        Guid id,
        [FromBody] UpdateSaleStatusRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _sales.ChangeStatusAsync(id, request.Status, cancellationToken);
        if (result.IsFailure)
        {
            return new ObjectResult(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Borra una venta y restaura el stock de sus productos.
    /// Solo Administrador: es una operacion de inventario, no del portal cliente.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Firmeza.Domain.Identity.ApplicationRoles.Administrator)]
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