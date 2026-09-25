using Firmeza.Application.Abstractions;
using Firmeza.Application.Common;
using Firmeza.Application.Dtos.Products;
using Firmeza.Domain.Entities;

namespace Firmeza.Application.Services.Products;

public sealed class ProductService : IProductService
{
    private readonly IProductRepository _products;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IClock _clock;

    public ProductService(IProductRepository products, IUnitOfWork unitOfWork, IClock clock)
    {
        _products = products;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    public async Task<Result<PagedResponse<ProductResponse>>> ListAsync(ProductQuery query, CancellationToken cancellationToken = default)
    {
        var page = ToPageRequest(query);
        var result = await _products.ListAsync(new ProductFilter(query.Q?.Trim(), query.OnlyActive), page, cancellationToken);
        var items = result.Items.Select(ToResponse).ToList();

        return Result.Success(new PagedResponse<ProductResponse>
        {
            Items = items,
            Page = page.Page,
            PageSize = page.Take,
            TotalCount = result.TotalCount
        });
    }

    public async Task<Result<ProductResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var product = await _products.FindByIdAsync(id, cancellationToken);

        return product is null
            ? Result.Failure<ProductResponse>(Error.EntityNotFound("Producto", id))
            : Result.Success(ToResponse(product));
    }

    public async Task<Result<ProductResponse>> CreateAsync(ProductRequest request, CancellationToken cancellationToken = default)
    {
        var sku = NormalizeSku(request.Sku);
        if (await _products.SkuExistsAsync(sku, null, cancellationToken))
        {
            return Result.Failure<ProductResponse>(DuplicateSku());
        }

        var product = new Product
        {
            Sku = sku,
            CreatedAt = _clock.UtcNow
        };

        Apply(request, product);
        await _products.AddAsync(product, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(ToResponse(product));
    }

    public async Task<Result<ProductResponse>> UpdateAsync(Guid id, ProductRequest request, CancellationToken cancellationToken = default)
    {
        var product = await _products.FindByIdAsync(id, cancellationToken);
        if (product is null)
        {
            return Result.Failure<ProductResponse>(Error.EntityNotFound("Producto", id));
        }

        var sku = NormalizeSku(request.Sku);
        if (await _products.SkuExistsAsync(sku, id, cancellationToken))
        {
            return Result.Failure<ProductResponse>(DuplicateSku());
        }

        Apply(request, product);
        product.Sku = sku;
        product.UpdatedAt = _clock.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(ToResponse(product));
    }

    public async Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var product = await _products.FindByIdAsync(id, cancellationToken);
        if (product is null)
        {
            return Result.Success();
        }

        if (await _products.HasSalesAsync(id, cancellationToken))
        {
            return Result.Failure(Error.Conflict("No se puede eliminar un producto que tiene ventas asociadas."));
        }

        _products.Remove(product);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    internal static PageRequest ToPageRequest(ProductQuery query) => new() { Page = query.Page, PageSize = query.PageSize };

    private static string NormalizeSku(string sku) => sku.Trim().ToUpperInvariant();

    private static Error DuplicateSku() => Error.Conflict("Ya existe un producto con ese codigo.");

    private static void Apply(ProductRequest request, Product product)
    {
        product.Name = request.Name.Trim();
        product.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        product.Category = request.Category.Trim();
        product.Unit = request.Unit.Trim();
        product.Price = request.Price;
        product.Stock = request.Stock;
        product.IsActive = request.IsActive;
    }

    private static ProductResponse ToResponse(Product product) => new(
        product.Id,
        product.Sku,
        product.Name,
        product.Description,
        product.Category,
        product.Unit,
        product.Price,
        product.Stock,
        product.IsActive,
        product.CreatedAt,
        product.UpdatedAt);
}
