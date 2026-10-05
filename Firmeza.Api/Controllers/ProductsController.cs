using Firmeza.Api.Infrastructure;
using Firmeza.Application.Common;
using Firmeza.Application.Dtos.Products;
using Firmeza.Application.Services.Products;
using Firmeza.Domain.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Firmeza.Api.Controllers;

/// <summary>
/// Catalogo de productos.
///
/// La clase lleva <c>[Authorize]</c> sin rol para que el Cliente pueda leer el
/// catalogo (necesita listar productos para comprar desde el portal). Cada
/// endpoint de escritura y de exportacion declara
/// <c>[Authorize(Roles = ApplicationRoles.Administrator)]</c>, asi que un Cliente
/// autenticado solo puede consultar.
/// </summary>
[ApiController]
[Route("api/products")]
[Authorize]
public sealed class ProductsController : ControllerBase
{
    private readonly IProductService _products;

    public ProductsController(IProductService products)
    {
        _products = products;
    }

    /// <summary>Lista paginada de productos con busqueda opcional.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<ProductResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<ProductResponse>>> List([FromQuery] ProductQuery query, CancellationToken cancellationToken)
        => Ok(await _products.ListAsync(query, cancellationToken));

    /// <summary>Obtiene un producto por su identificador.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ProductResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductResponse>> GetById(Guid id, CancellationToken cancellationToken)
        => Ok(await _products.GetByIdAsync(id, cancellationToken));

    /// <summary>Crea un producto. Solo Administrador.</summary>
    [HttpPost]
    [Authorize(Roles = ApplicationRoles.Administrator)]
    [ProducesResponseType(typeof(ProductResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ProductResponse>> Create([FromBody] ProductRequest request, CancellationToken cancellationToken)
    {
        var result = await _products.CreateAsync(request, cancellationToken);
        if (result.IsFailure)
        {
            return new ObjectResult(result);
        }

        return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result);
    }

    /// <summary>Actualiza un producto existente. Solo Administrador.</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = ApplicationRoles.Administrator)]
    [ProducesResponseType(typeof(ProductResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ProductResponse>> Update(Guid id, [FromBody] ProductRequest request, CancellationToken cancellationToken)
        => Ok(await _products.UpdateAsync(id, request, cancellationToken));

    /// <summary>Elimina un producto sin ventas asociadas. Solo Administrador.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = ApplicationRoles.Administrator)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await _products.DeleteAsync(id, cancellationToken);

        return result.IsSuccess ? NoContent() : new ObjectResult(result) { StatusCode = StatusCodes.Status409Conflict };
    }

    /// <summary>Exporta el catálogo de productos a Excel (.xlsx). Solo Administrador.</summary>
    [HttpGet("export/excel")]
    [Authorize(Roles = ApplicationRoles.Administrator)]
    public async Task<IActionResult> ExportExcel(
        [FromServices] Firmeza.Application.Services.Exports.IExportService exportService,
        CancellationToken cancellationToken)
    {
        var bytes = await exportService.ExportProductsToExcelAsync(cancellationToken);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"catalogo_productos_{DateTime.Now:yyyyMMdd_HHmm}.xlsx");
    }

    /// <summary>Exporta el catálogo de productos a PDF. Solo Administrador.</summary>
    [HttpGet("export/pdf")]
    [Authorize(Roles = ApplicationRoles.Administrator)]
    public async Task<IActionResult> ExportPdf(
        [FromServices] Firmeza.Application.Services.Exports.IExportService exportService,
        CancellationToken cancellationToken)
    {
        var bytes = await exportService.ExportProductsToPdfAsync(cancellationToken);
        return File(bytes, "application/pdf", $"catalogo_productos_{DateTime.Now:yyyyMMdd_HHmm}.pdf");
    }
}
