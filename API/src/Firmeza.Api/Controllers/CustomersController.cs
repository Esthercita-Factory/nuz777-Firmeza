using Firmeza.Api.Infrastructure;
using Firmeza.Application.Common;
using Firmeza.Application.Dtos.Customers;
using Firmeza.Application.Services.Customers;
using Firmeza.Domain.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Firmeza.Api.Controllers;

/// <summary>
/// Directorio de clientes. Solo Administrador: un Cliente no debe poder ver ni
/// modificar la cartera de otros clientes.
/// </summary>
[ApiController]
[Route("api/customers")]
[Authorize(Roles = ApplicationRoles.Administrator)]
public sealed class CustomersController : ControllerBase
{
    private readonly ICustomerService _customers;

    public CustomersController(ICustomerService customers)
    {
        _customers = customers;
    }

    /// <summary>Lista paginada de clientes con busqueda opcional.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<CustomerResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<CustomerResponse>>> List([FromQuery] CustomerQuery query, CancellationToken cancellationToken)
        => Ok(await _customers.ListAsync(query, cancellationToken));

    /// <summary>Obtiene un cliente por su identificador.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(CustomerResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CustomerResponse>> GetById(Guid id, CancellationToken cancellationToken)
        => Ok(await _customers.GetByIdAsync(id, cancellationToken));

    /// <summary>Crea un cliente.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(CustomerResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CustomerResponse>> Create([FromBody] CustomerRequest request, CancellationToken cancellationToken)
    {
        var result = await _customers.CreateAsync(request, cancellationToken);
        if (result.IsFailure)
        {
            return new ObjectResult(result);
        }

        return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result);
    }

    /// <summary>Actualiza un cliente existente.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(CustomerResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CustomerResponse>> Update(Guid id, [FromBody] CustomerRequest request, CancellationToken cancellationToken)
        => Ok(await _customers.UpdateAsync(id, request, cancellationToken));

    /// <summary>Elimina un cliente sin ventas asociadas.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await _customers.DeleteAsync(id, cancellationToken);

        return result.IsSuccess ? NoContent() : new ObjectResult(result) { StatusCode = StatusCodes.Status409Conflict };
    }

    /// <summary>Exporta el directorio de clientes a Excel (.xlsx).</summary>
    [HttpGet("export/excel")]
    public async Task<IActionResult> ExportExcel(
        [FromServices] Firmeza.Application.Services.Exports.IExportService exportService,
        CancellationToken cancellationToken)
    {
        var bytes = await exportService.ExportCustomersToExcelAsync(cancellationToken);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"clientes_{DateTime.Now:yyyyMMdd_HHmm}.xlsx");
    }

    /// <summary>Exporta el directorio de clientes a PDF.</summary>
    [HttpGet("export/pdf")]
    public async Task<IActionResult> ExportPdf(
        [FromServices] Firmeza.Application.Services.Exports.IExportService exportService,
        CancellationToken cancellationToken)
    {
        var bytes = await exportService.ExportCustomersToPdfAsync(cancellationToken);
        return File(bytes, "application/pdf", $"clientes_{DateTime.Now:yyyyMMdd_HHmm}.pdf");
    }
}
