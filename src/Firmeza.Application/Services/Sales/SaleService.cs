using Firmeza.Application.Abstractions;
using Firmeza.Application.Common;
using Firmeza.Application.Dtos.Sales;
using Firmeza.Domain.Enums;
using Firmeza.Domain.Entities;
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
        var result = await _sales.ListAsync(new SaleFilter(query.Q?.Trim(), query.Status, query.CustomerId), page, cancellationToken);

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

        var customer = await _customers.FindByIdAsync(request.CustomerId!.Value, cancellationToken);
        if (customer is null)
        {
            return Result.Failure<SaleResponse>(
                request.CustomerId is null
                    ? Error.Validation("El cliente es obligatorio.")
                    : Error.EntityNotFound("Cliente", request.CustomerId));
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

            var isConfirmed = HasStockDeducted(request.Status ?? SaleStatus.Pending);
            if (isConfirmed)
            {
                product.Stock -= requested.Quantity;
                product.UpdatedAt = now;
            }

            details.Add(new SaleDetail
            {
                ProductId = product.Id,
                Quantity = requested.Quantity,
                UnitPrice = unitPrice,
                Subtotal = subtotal
            });
        }

        var saleStatus = request.Status ?? SaleStatus.Pending;
        var saleIsConfirmed = HasStockDeducted(saleStatus);
        var saleId = Guid.NewGuid();
        var sale = new Sale
        {
            Id = saleId,
            SaleNumber = SaleNumberGenerator.Next(now, saleId),
            CustomerId = customer.Id,
            SaleDate = now,
            Status = saleStatus,
            Total = InventoryCalculator.CalculateTotal(details.Select(detail => (detail.Quantity, detail.UnitPrice))),
            CreatedByUserId = _currentUser.UserId,
            ConfirmedByUserId = saleIsConfirmed ? _currentUser.UserId : null,
            ConfirmedAt = saleIsConfirmed ? now : null,
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

        var taxes = InventoryCalculator.SplitTaxInclusive(sale.Total);

        return Result.Success(new SaleResponse(
            sale.Id,
            sale.SaleNumber,
            sale.CustomerId,
            customer.FullName,
            customer.Document,
            sale.SaleDate,
            sale.Status,
            sale.Total,
            new SaleTaxesResponse(taxes.SubtotalBase, taxes.Tax, InventoryCalculator.TaxRate),
            sale.CreatedByUserId,
            details.Select(detail => new SaleLineResponse(
                Guid.Empty,
                detail.ProductId,
                productsById[detail.ProductId].Sku,
                productsById[detail.ProductId].Name,
                detail.Quantity,
                detail.UnitPrice,
                detail.Subtotal)).ToList(),
            sale.DecisionNote,
            sale.DecidedAt));
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
        sale.Details.Count,
        sale.DecisionNote,
        sale.DecidedAt);

    private static SaleTaxesResponse ToTaxes(Sale sale)
    {
        var taxes = InventoryCalculator.SplitTaxInclusive(sale.Total);
        return new SaleTaxesResponse(taxes.SubtotalBase, taxes.Tax, InventoryCalculator.TaxRate);
    }

    private static SaleResponse ToResponse(Sale sale) => new(
        sale.Id,
        sale.SaleNumber,
        sale.CustomerId,
        sale.Customer?.FullName ?? string.Empty,
        sale.Customer?.Document ?? string.Empty,
        sale.SaleDate,
        sale.Status,
        sale.Total,
        ToTaxes(sale),
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
            .ToList(),
        sale.DecisionNote,
        sale.DecidedAt);

    public async Task<Result<SaleResponse>> UpdateAsync(Guid id, SaleRequest request, CancellationToken cancellationToken = default)
    {
        if (request.Lines.Count == 0)
        {
            return Result.Failure<SaleResponse>(Error.Validation("La venta debe tener al menos una linea."));
        }

        var customer = await _customers.FindByIdAsync(request.CustomerId!.Value, cancellationToken);
        if (customer is null)
        {
            return Result.Failure<SaleResponse>(
                request.CustomerId is null
                    ? Error.Validation("El cliente es obligatorio.")
                    : Error.EntityNotFound("Cliente", request.CustomerId));
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

        await using var transaction = await _unitOfWork.BeginTransactionAsync(cancellationToken);

        var sale = await _sales.FindByIdForUpdateAsync(id, cancellationToken);
        if (sale is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Result.Failure<SaleResponse>(Error.EntityNotFound("Venta", id));
        }

        if (sale.Status == SaleStatus.Delivered)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Result.Failure<SaleResponse>(Error.BusinessRule("No se puede editar una venta que ya ha sido entregada."));
        }

        // Se bloquean los productos antiguos y los nuevos en una sola consulta.
        // Si se devolviera y se descontara por separado, dos ediciones
        // simultaneas sobre las mismas filas pueden dejar un deadlock.
        var productIds = sale.Details
            .Select(detail => detail.ProductId)
            .Concat(requestedLines.Keys)
            .Distinct()
            .ToList();

        var products = await _products.FindByIdsForUpdateAsync(productIds, cancellationToken);
        var productsById = products.ToDictionary(product => product.Id);

        var targetStatus = request.Status ?? sale.Status;
        var wasConfirmed = HasStockDeducted(sale.Status);
        var willBeConfirmed = HasStockDeducted(targetStatus);

        // 1. Se devuelve al stock lo que esta venta tenia descontado. Si venia de
        // Pendiente, no tenia nada descontado y devolverlo crearia inventario.
        if (wasConfirmed)
        {
            foreach (var detail in sale.Details)
            {
                if (productsById.TryGetValue(detail.ProductId, out var product))
                {
                    product.Stock += detail.Quantity;
                }
            }
        }

        // 2. Del stock disponible se descuenta lo que la venta pasa a tener,
        //    siempre que el estado resultante sea confirmado o entregado.
        var details = new List<SaleDetail>(requestedLines.Count);
        foreach (var (productId, requested) in requestedLines)
        {
            if (!productsById.TryGetValue(productId, out var product))
            {
                await transaction.RollbackAsync(cancellationToken);
                return Result.Failure<SaleResponse>(Error.EntityNotFound("Producto", productId));
            }

            if (!product.IsActive)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Result.Failure<SaleResponse>(Error.BusinessRule($"El producto '{product.Name}' esta inactivo."));
            }

            // Al validar el stock se compara contra lo disponible (que ya incluye lo devuelto si venia confirmada).
            var available = product.Stock;
            if (available < requested.Quantity)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Result.Failure<SaleResponse>(
                    Error.BusinessRule($"Stock insuficiente para '{product.Name}'. Disponible: {available}."));
            }

            var unitPrice = requested.UnitPrice ?? product.Price;
            var subtotal = InventoryCalculator.CalculateLineTotal(requested.Quantity, unitPrice);

            if (willBeConfirmed)
            {
                product.Stock -= requested.Quantity;
                product.UpdatedAt = _clock.UtcNow;
            }

            // La navegacion se asigna para que ToResponse devuelva sku y nombre
            // sin tener que recargar las lineas.
            details.Add(new SaleDetail
            {
                ProductId = product.Id,
                Product = product,
                Quantity = requested.Quantity,
                UnitPrice = unitPrice,
                Subtotal = subtotal
            });
        }

        var now = _clock.UtcNow;
        sale.CustomerId = customer.Id;
        sale.Customer = customer;
        sale.Status = targetStatus;
        sale.Total = InventoryCalculator.CalculateTotal(details.Select(detail => (detail.Quantity, detail.UnitPrice)));

        if (willBeConfirmed && !wasConfirmed)
        {
            sale.ConfirmedByUserId = _currentUser.UserId;
            sale.ConfirmedAt = now;
        }
        else if (!willBeConfirmed && wasConfirmed && targetStatus == SaleStatus.Cancelled)
        {
            sale.CancelledAt = now;
        }

        // Las lineas anteriores quedan huerfanas y EF las borra en cascada.
        sale.Details.Clear();
        foreach (var detail in details)
        {
            sale.Details.Add(detail);
        }

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

        return Result.Success(ToResponse(sale));
    }

    /// <summary>
    /// Si la venta tiene el stock descontado. El descuento ocurre al confirmar, asi
    /// que Pending todavia no lo tiene y Cancelled depende de como se llego.
    /// </summary>
    private static bool HasStockDeducted(SaleStatus status)
        => status is SaleStatus.Confirmed or SaleStatus.Delivered;

    /// <summary>
    /// Devuelve al stock lo que la venta habia descontado. Si el producto ya no
    /// existe, se ignora en lugar de romper la operacion.
    /// </summary>
    private async Task RestoreStockAsync(Sale sale, CancellationToken cancellationToken)
    {
        var productIds = sale.Details.Select(detail => detail.ProductId).Distinct().ToList();
        if (productIds.Count == 0)
        {
            return;
        }

        var products = await _products.FindByIdsForUpdateAsync(productIds, cancellationToken);
        var byId = products.ToDictionary(product => product.Id);

        var now = _clock.UtcNow;
        foreach (var detail in sale.Details)
        {
            if (byId.TryGetValue(detail.ProductId, out var product))
            {
                product.Stock += detail.Quantity;
                product.UpdatedAt = now;
            }
        }
    }

    /// <summary>
    /// Descuenta el stock de la venta. Se llama al confirmar: si no alcanza, la
    /// confirmacion falla con 422 y el admin puede cancelar en vez de confirmar.
    /// </summary>
    private async Task<Result> DeductStockAsync(Sale sale, CancellationToken cancellationToken)
    {
        var productIds = sale.Details.Select(detail => detail.ProductId).Distinct().ToList();
        if (productIds.Count == 0)
        {
            return Result.Success();
        }

        var products = await _products.FindByIdsForUpdateAsync(productIds, cancellationToken);
        var byId = products.ToDictionary(product => product.Id);

        // Se valida todo antes de descontar nada: si una linea no alcanza, no se
        // descuenta ninguna.
        foreach (var detail in sale.Details)
        {
            if (!byId.TryGetValue(detail.ProductId, out var product))
            {
                return Result.Failure(Error.EntityNotFound("Producto", detail.ProductId));
            }

            if (product.Stock < detail.Quantity)
            {
                return Result.Failure(
                    Error.BusinessRule($"Stock insuficiente para '{product.Name}'. Disponible: {product.Stock}, solicitado: {detail.Quantity}."));
            }
        }

        var now = _clock.UtcNow;
        foreach (var detail in sale.Details)
        {
            byId[detail.ProductId].Stock -= detail.Quantity;
            byId[detail.ProductId].UpdatedAt = now;
        }

        return Result.Success();
    }

    public async Task<Result<SaleResponse>> ChangeStatusAsync(Guid id, SaleStatus status, string? note = null, CancellationToken cancellationToken = default)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync(cancellationToken);

        var sale = await _sales.FindByIdForUpdateAsync(id, cancellationToken);
        if (sale is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Result.Failure<SaleResponse>(Error.EntityNotFound("Venta", id));
        }

        if (!SaleStatusRules.CanTransition(sale.Status, status))
        {
            await transaction.RollbackAsync(cancellationToken);
            return Result.Failure<SaleResponse>(
                Error.BusinessRule(SaleStatusRules.RejectReason(sale.Status, status)));
        }

        // Cancelar sin explicacion deja al cliente sin respuesta, asi que el motivo
        // es obligatorio en ese caso. Confirmar y entregar lo admiten vacio.
        var trimmedNote = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
        if (status == SaleStatus.Cancelled && trimmedNote is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Result.Failure<SaleResponse>(
                Error.BusinessRule("Escribe el motivo por el que cancelas la solicitud: el cliente lo vera."));
        }

        var previous = sale.Status;
        var now = _clock.UtcNow;

        if (status == SaleStatus.Confirmed)
        {
            // Aqui si se descuenta. Antes valido el total de las lineas.
            var deducted = await DeductStockAsync(sale, cancellationToken);
            if (deducted.IsFailure)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Result.Failure<SaleResponse>(deducted.Error!);
            }

            sale.ConfirmedByUserId = _currentUser.UserId;
            sale.ConfirmedAt = now;
        }
        else if (status == SaleStatus.Cancelled && HasStockDeducted(previous))
        {
            // Venia de Confirmada o Entregada: el stock estaba descontado y hay que
            // devolverlo, o el inventario se queda con trabajo fantasma.
            await RestoreStockAsync(sale, cancellationToken);
            sale.CancelledAt = now;
        }
        else if (status == SaleStatus.Cancelled)
        {
            // Venia de Pendiente: nunca se habia descontado nada.
            sale.CancelledAt = now;
        }

        if (status == SaleStatus.Delivered)
        {
            sale.DeliveredAt = now;
        }

        sale.Status = status;
        sale.DecisionNote = trimmedNote;
        sale.DecidedAt = trimmedNote is null ? null : now;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return Result.Success(ToResponse(sale));
    }

    public async Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync(cancellationToken);

        var sale = await _sales.FindByIdForUpdateAsync(id, cancellationToken);
        if (sale is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Result.Failure(Error.EntityNotFound("Venta", id));
        }

        if (sale.Status == SaleStatus.Delivered)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Result.Failure(Error.BusinessRule("No se puede borrar una venta que ya ha sido entregada."));
        }

        // Solo se devuelve stock si la venta lo tenia descontado. Una solicitud
        // pendiente nunca lo descontó, y devolverlo seria crear inventario.
        if (HasStockDeducted(sale.Status))
        {
            await RestoreStockAsync(sale, cancellationToken);
        }

        _sales.Remove(sale);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return Result.Success();
    }
}