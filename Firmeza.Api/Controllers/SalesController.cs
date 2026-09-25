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
}
