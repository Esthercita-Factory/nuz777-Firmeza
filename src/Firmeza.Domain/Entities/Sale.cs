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

    /// <summary>Quien confirmo la solicitud. Viene del admin, no del cliente.</summary>
    public string? ConfirmedByUserId { get; set; }

    /// <summary>Cuando se confirmo la solicitud.</summary>
    public DateTimeOffset? ConfirmedAt { get; set; }

    /// <summary>Cuando se marco como entregada.</summary>
    public DateTimeOffset? DeliveredAt { get; set; }

    /// <summary>Cuando se cancelo.</summary>
    public DateTimeOffset? CancelledAt { get; set; }

    /// <summary>
    /// Motivo que dejo el administrador al confirmar o cancelar la solicitud.
    /// El cliente lo ve en su portal: es la unica forma de que sepa por que la
    /// compra se aprobo o se rechazo.
    /// </summary>
    public string? DecisionNote { get; set; }

    /// <summary>Cuando el administrador dejo el motivo de su decision.</summary>
    public DateTimeOffset? DecidedAt { get; set; }

    public ICollection<SaleDetail> Details { get; set; } = new List<SaleDetail>();
}
