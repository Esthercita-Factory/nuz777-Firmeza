using System.ComponentModel.DataAnnotations;
using Firmeza.Domain.Enums;

namespace Firmeza.Application.Dtos.CustomerRequests;

public sealed record CustomerRequestResponse(
    Guid Id,
    string UserId,
    string Document,
    string FullName,
    int Age,
    string Email,
    string Phone,
    string? Address,
    CustomerRequestStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ReviewedAt,
    string? ReviewedByUserId,
    Guid? CustomerId);

/// <summary>Resultado de revisar una solicitud.</summary>
public sealed record CustomerRequestReviewResponse(
    Guid Id,
    CustomerRequestStatus Status,
    Guid? CustomerId,
    string Message);

public sealed class CustomerRequestQuery
{
    public CustomerRequestStatus? Status { get; init; } = CustomerRequestStatus.Pending;

    public string? Q { get; init; }

    public int Page { get; init; } = 1;

    public int PageSize { get; init; } = 20;
}