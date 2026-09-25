using Firmeza.Domain.Enums;

namespace Firmeza.Domain.Entities;

public class Sale
{
    public Guid Id { get; set; }
    public string SaleNumber { get; set; } = string.Empty;
    public Guid CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public DateTimeOffset SaleDate { get; set; }
    public SaleStatus Status { get; set; } = SaleStatus.Pending;
    public decimal Total { get; set; }
    public string? CreatedByUserId { get; set; }
    public ICollection<SaleDetail> Details { get; set; } = new List<SaleDetail>();
}
