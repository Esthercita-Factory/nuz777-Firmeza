using Firmeza.Application.Common;
using Firmeza.Application.Dtos.CustomerRequests;
using Firmeza.Application.Services.CustomerRequests;
using Firmeza.Domain.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Firmeza.Api.Controllers;

/// <summary>Revision de solicitudes de alta de clientes registradas desde el portal.</summary>
[ApiController]
[Route("api/customer-requests")]
[Authorize(Roles = ApplicationRoles.Administrator)]
public sealed class CustomerRequestsController : ControllerBase
{
    private readonly ICustomerRequestService _requests;

    public CustomerRequestsController(ICustomerRequestService requests)
    {
        _requests = requests;
    }

    /// <summary>Lista paginada de solicitudes, por defecto solo las pendientes.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<CustomerRequestResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<CustomerRequestResponse>>> List(
        [FromQuery] CustomerRequestQuery query,
        CancellationToken cancellationToken)
        => Ok(await _requests.ListAsync(query, cancellationToken));

    /// <summary>Aprueba la solicitud y crea el cliente con esos datos.</summary>
    [HttpPost("{id:guid}/approve")]
    [ProducesResponseType(typeof(CustomerRequestReviewResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CustomerRequestReviewResponse>> Approve(Guid id, CancellationToken cancellationToken)
    {
        var result = await _requests.ApproveAsync(id, cancellationToken);
        if (result.IsFailure)
        {
            return new ObjectResult(result);
        }

        return Ok(result);
    }

    /// <summary>Descarta la solicitud. El solicitante no se agrega a la lista de clientes.</summary>
    [HttpPost("{id:guid}/reject")]
    [ProducesResponseType(typeof(CustomerRequestReviewResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CustomerRequestReviewResponse>> Reject(Guid id, CancellationToken cancellationToken)
    {
        var result = await _requests.RejectAsync(id, cancellationToken);
        if (result.IsFailure)
        {
            return new ObjectResult(result);
        }

        return Ok(result);
    }
}