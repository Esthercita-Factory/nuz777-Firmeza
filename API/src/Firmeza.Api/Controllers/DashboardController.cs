using Firmeza.Application.Common;
using Firmeza.Application.Dtos.Dashboard;
using Firmeza.Application.Services.Dashboard;
using Firmeza.Domain.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Firmeza.Api.Controllers;

/// <summary>Indicadores del negocio. Solo Administrador.</summary>
[ApiController]
[Route("api/dashboard")]
[Authorize(Roles = ApplicationRoles.Administrator)]
public sealed class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboard;

    public DashboardController(IDashboardService dashboard)
    {
        _dashboard = dashboard;
    }

    /// <summary>Metricas de productos, clientes y ventas.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(DashboardResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardResponse>> Get(CancellationToken cancellationToken)
        => Ok(await _dashboard.GetAsync(cancellationToken));
}
