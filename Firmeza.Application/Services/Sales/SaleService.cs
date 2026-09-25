using Firmeza.Application.Abstractions;
using Firmeza.Application.Common;
using Firmeza.Application.Dtos.Sales;
using Firmeza.Domain.Entities;
using Firmeza.Domain.Enums;
using Firmeza.Domain.Errors;
using Firmeza.Domain.Services;

namespace Firmeza.Application.Services.Sales;

public sealed class SaleService : ISaleService
{
    private readonly ISaleRepository _sales;
    private readonly IProductRepository _products;
    private readonly ICustomerRepository _customers;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IClock _clock;

    public SaleService(
        ISaleRepository sales,
        IProductRepository products,
        ICustomerRepository customers,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork,
        IClock clock)
    {
        _clock = clock;
        _sales = sales;
        _products = products;
        _customers = customers;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<PagedResponse<SaleSummaryResponse>>> ListAsync(SaleQuery query, CancellationToken cancellationToken = default)
    {
        var page = new PageRequest { Page = query.Page, PageSize = query.PageSize };
        var result = await _sales.ListAsync(new SaleFilter(query.Q?.Trim(), query.Status), page, cancellationToken);

        return Result.Success(new PagedResponse<SaleSummaryResponse>
        {
            Items = result.Items.Select(ToSummary).ToList(),
            Page = page.Page,
            PageSize = page.Take,
            TotalCount = result.TotalCount
        });
    }

    public async Task<Result<SaleResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var sale = await _sales.FindWithDetailsAsync(id, cancellationToken);

        return sale is null
            ? Result.Failure<SaleResponse>(Error.EntityNotFound("Venta", id))
            : Result.Success(ToResponse(sale));
    }

    public async Task<Result<SaleResponse>> CreateAsync(SaleRequest request, CancellationToken cancellationToken = default)
    {
        if (request.Lines.Count == 0)
        {
            return Result.Failure<SaleResponse>(Error.Validation("La venta debe tener al menos una linea."));
        }

        var customer = await _customers.FindByIdAsync(request.CustomerId, cancellationToken);
        if (customer is null)
        {
            return Result.Failure<SaleResponse>(Error.EntityNotFound("Cliente", request.CustomerId));
        }

        if (!customer.IsActive)
        {
            return Result.Failure<SaleResponse>(Error.BusinessRule("El cliente esta inactivo y no puede tener ventas."));
        }

        var requestedLines = MergeLines(request.Lines);
        if (requestedLines.Count == 0)
        {
            return Result.Failure<SaleResponse>(Error.Validation("La venta debe tener al menos una linea."));
        }

        var productIds = requestedLines.Keys.ToList();
        var now = _clock.UtcNow;

        await using var transaction = await _unitOfWork.BeginTransactionAsync(cancellationToken);

        var products = await _products.FindByIdsForUpdateAsync(productIds, cancellationToken);
        var productsById = products.ToDictionary(product => product.Id);

        var details = new List<SaleDetail>(productIds.Count);
        foreach (var (productId, requested) in requestedLines)
        {
            if (!productsById.TryGetValue(productId, out var product))
            {
                return Result.Failure<SaleResponse>(Error.EntityNotFound("Producto", productId));
            }

            if (!product.IsActive)
            {
                return Result.Failure<SaleResponse>(Error.BusinessRule($"El producto '{product.Name}' esta inactivo."));
            }

            if (product.Stock < requested.Quantity)
            {
                return Result.Failure<SaleResponse>(
                    Error.BusinessRule($"Stock insuficiente para '{product.Name}'. Disponible: {product.Stock}."));
            }

            var unitPrice = requested.UnitPrice ?? product.Price;
            var subtotal = InventoryCalculator.CalculateLineTotal(requested.Quantity, unitPrice);

            product.Stock -= requested.Quantity;
            details.Add(new SaleDetail
            {
                ProductId = product.Id,
                Quantity = requested.Quantity,
                UnitPrice = unitPrice,
                Subtotal = subtotal
            });
        }

        var saleId = Guid.NewGuid();
        var sale = new Sale
        {
            Id = saleId,
            SaleNumber = SaleNumberGenerator.Next(now, saleId),
            CustomerId = customer.Id,
            SaleDate = now,
            Status = request.Status ?? SaleStatus.Pending,
            Total = InventoryCalculator.CalculateTotal(details.Select(detail => (detail.Quantity, detail.UnitPrice))),
            CreatedByUserId = _currentUser.UserId,
            Details = details
        };

        await _sales.AddAsync(sale, cancellationToken);

        try
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (DuplicateEntityException exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Result.Failure<SaleResponse>(Error.Conflict(exception.Message));
        }

        return Result.Success(new SaleResponse(
            sale.Id,
            sale.SaleNumber,
            sale.CustomerId,
            customer.FullName,
            customer.Document,
            sale.SaleDate,
            sale.Status,
            sale.Total,
            sale.CreatedByUserId,
            details.Select(detail => new SaleLineResponse(
                Guid.Empty,
                detail.ProductId,
                productsById[detail.ProductId].Sku,
                productsById[detail.ProductId].Name,
                detail.Quantity,
                detail.UnitPrice,
                detail.Subtotal)).ToList()));
    }

    private static Dictionary<Guid, (int Quantity, decimal? UnitPrice)> MergeLines(IReadOnlyCollection<SaleLineRequest> lines)
    {
        var merged = new Dictionary<Guid, (int Quantity, decimal? UnitPrice)>();

        foreach (var line in lines)
        {
            merged.TryGetValue(line.ProductId, out var current);
            merged[line.ProductId] = (current.Quantity + line.Quantity, line.UnitPrice ?? current.UnitPrice);
        }

        return merged;
    }

    private static SaleSummaryResponse ToSummary(Sale sale) => new(
        sale.Id,
        sale.SaleNumber,
        sale.CustomerId,
        sale.Customer?.FullName ?? string.Empty,
        sale.SaleDate,
        sale.Status,
        sale.Total,
        sale.Details.Count);

    private static SaleResponse ToResponse(Sale sale) => new(
        sale.Id,
        sale.SaleNumber,
        sale.CustomerId,
        sale.Customer?.FullName ?? string.Empty,
        sale.Customer?.Document ?? string.Empty,
        sale.SaleDate,
        sale.Status,
        sale.Total,
        sale.CreatedByUserId,
        sale.Details
            .Select(detail => new SaleLineResponse(
                detail.Id,
                detail.ProductId,
                detail.Product?.Sku ?? string.Empty,
                detail.Product?.Name ?? string.Empty,
                detail.Quantity,
                detail.UnitPrice,
                detail.Subtotal))
            .ToList());
}
