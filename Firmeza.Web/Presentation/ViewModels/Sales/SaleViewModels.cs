namespace Firmeza.Web.Presentation.ViewModels.Sales;

public class SaleListItemViewModel
{
    public Guid Id { get; init; }
    public string SaleNumber { get; init; } = string.Empty;
    public string CustomerName { get; init; } = string.Empty;
    public DateTimeOffset SaleDate { get; init; }
    public string Status { get; init; } = string.Empty;
    public decimal Total { get; init; }
}

public class SaleDetailsViewModel
{
    public Guid Id { get; init; }
    public string SaleNumber { get; init; } = string.Empty;
    public string CustomerName { get; init; } = string.Empty;
    public string CustomerDocument { get; init; } = string.Empty;
    public DateTimeOffset SaleDate { get; init; }
    public string Status { get; init; } = string.Empty;
    public decimal Total { get; init; }
    public IEnumerable<SaleDetailViewModel> Details { get; init; } = [];
}

public class SaleDetailViewModel
{
    public string ProductName { get; init; } = string.Empty;
    public string ProductSku { get; init; } = string.Empty;
    public int Quantity { get; init; }
    public decimal UnitPrice { get; init; }
    public decimal Subtotal { get; init; }
}

public class CreateSaleFormViewModel
{
    public Guid CustomerId { get; set; }
    public List<CreateSaleLineFormViewModel> Lines { get; set; } = new();

    // Select lists
    public List<CustomerOptionViewModel> Customers { get; set; } = new();
    public List<ProductOptionViewModel> Products { get; set; } = new();
}

public class CreateSaleLineFormViewModel
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal? UnitPrice { get; set; }
}

public class CustomerOptionViewModel
{
    public Guid Id { get; set; }
    public string DisplayText { get; set; } = string.Empty;
}

public class ProductOptionViewModel
{
    public Guid Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public string Unit { get; set; } = string.Empty;
}

