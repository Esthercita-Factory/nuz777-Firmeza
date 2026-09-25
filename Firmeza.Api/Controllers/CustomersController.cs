using Firmeza.Api.Infrastructure;
using Firmeza.Application.Common;
using Firmeza.Application.Dtos.Customers;
using Firmeza.Application.Services.Customers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Firmeza.Api.Controllers;

[ApiController]
[Route("api/customers")]
[Authorize]
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
}
