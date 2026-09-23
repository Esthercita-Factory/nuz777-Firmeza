namespace Firmeza.Web.Models;

public enum SaleStatus
{
    Pending,
    Confirmed,
    Delivered,
    Cancelled
}

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
    public ApplicationUser? CreatedByUser { get; set; }
    public ICollection<SaleDetail> Details { get; set; } = new List<SaleDetail>();
}
