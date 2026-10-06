using Firmeza.Domain.Entities;
using Firmeza.Domain.Enums;

namespace Firmeza.Domain.Services;

/// <summary>
/// Reglas de avance de una venta.
///
/// El cliente del portal solicita (Pending) y el administrador confirma
/// (Confirmed) y entrega (Delivered). Una venta entregada queda cerrada: no se
/// edita ni se borra, y tampoco se puede retrolaburar a un estado anterior.
/// </summary>
public static class SaleStatusRules
{
    /// <summary>Estados a los que se puede mover una venta desde su estado actual.</summary>
    public static IReadOnlyCollection<SaleStatus> AllowedTransitionsFrom(SaleStatus current) => current switch
    {
        // El admin confirma o cancela lo solicitado.
        SaleStatus.Pending => [SaleStatus.Confirmed, SaleStatus.Cancelled],
        // Confirmada: el admin marca la entrega.
        SaleStatus.Confirmed => [SaleStatus.Delivered, SaleStatus.Cancelled],
        // Entregada o cancelada: estado final.
        _ => []
    };

    public static bool CanTransition(SaleStatus current, SaleStatus next)
        => AllowedTransitionsFrom(current).Contains(next);

    public static string RejectReason(SaleStatus current, SaleStatus next) => (current, next) switch
    {
        (SaleStatus.Delivered, _) => "Una venta entregada no cambia de estado.",
        (SaleStatus.Cancelled, _) => "Una venta cancelada no cambia de estado.",
        _ when current == next => "La venta ya tiene ese estado.",
        _ => $"No se puede pasar de {Label(current)} a {Label(next)}."
    };

    /// <summary>Texto para los mensajes de error y la interfaz.</summary>
    public static string Label(SaleStatus status) => status switch
    {
        SaleStatus.Pending => "Pendiente",
        SaleStatus.Confirmed => "Confirmada",
        SaleStatus.Delivered => "Entregada",
        SaleStatus.Cancelled => "Cancelada",
        _ => status.ToString()
    };
}