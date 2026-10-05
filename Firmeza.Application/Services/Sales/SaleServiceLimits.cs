namespace Firmeza.Application.Services.Sales;

/// <summary>
/// Limites de la compra del portal del cliente. Aqui y no en el servicio porque
/// dependen del rol de quien llama: el administrador no esta sujeto al tope de
/// solicitudes pendientes (puede registrar ventas en nombre de cualquier cliente).
/// </summary>
public static class SaleServiceLimits
{
    /// <summary>
    /// Solicitudes pendientes maximas por cliente. Sin este tope un cliente puede
    /// generar solicitudes sin limite y el administrador se queda sin poder
    /// confirmar nada, porque todas compiten por el mismo stock.
    /// </summary>
    public const int MaxPendingPerCustomer = 5;
}