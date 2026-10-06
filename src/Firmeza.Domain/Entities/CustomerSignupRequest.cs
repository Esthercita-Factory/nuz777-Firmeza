using Firmeza.Domain.Enums;

namespace Firmeza.Domain.Entities;

/// <summary>
/// Solicitud de alta de cliente desde el registro publico.
/// Se crea cuando alguien se registra en el portal. Hasta que un administrador
/// la aprueba, el solicitante no existe como <see cref="Customer"/>.
/// </summary>
public class CustomerSignupRequest
{
    public Guid Id { get; set; }

    /// <summary>Cuenta de Identity asociada al registro.</summary>
    public string UserId { get; set; } = string.Empty;

    public string Document { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public int Age { get; set; }

    public string Email { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string? Address { get; set; }

    public CustomerRequestStatus Status { get; set; } = CustomerRequestStatus.Pending;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? ReviewedAt { get; set; }

    /// <summary>Administrador que aprobo o descarto la solicitud.</summary>
    public string? ReviewedByUserId { get; set; }

    /// <summary>Cliente generado al aprobar. Null mientras esta pendiente o descartada.</summary>
    public Guid? CustomerId { get; set; }
}